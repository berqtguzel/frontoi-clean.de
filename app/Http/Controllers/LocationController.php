<?php

namespace App\Http\Controllers;

use App\Support\OmrConfig;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class LocationController extends Controller
{
    private static function makeSlug(string $text): string
    {
        $text = str_replace(['/', '\\'], '-', $text);
        $text = iconv('UTF-8', 'ASCII//TRANSLIT', $text);
        $text = preg_replace('/[^A-Za-z0-9]+/', '-', $text);
        return trim(strtolower($text), '-');
    }

    private static function replaceImageTenant(?string $imageUrl): ?string
    {
        if (!$imageUrl) {
            return null;
        }

        $mainTenant = OmrConfig::mainTenantId();

        if (! $mainTenant) {
            return $imageUrl;
        }

        $pattern = '/(\/storage\/)([^\/]+)(\/media\/)/';

        if (preg_match($pattern, $imageUrl, $matches)) {
            if ($matches[2] === $mainTenant) {
                return $imageUrl;
            }

            return preg_replace($pattern, '$1' . $mainTenant . '$3', $imageUrl);
        }

        return $imageUrl;
    }

    private static function normalizeDistrict(?string $value): string
    {
        $value = strtolower(trim((string) $value));
        $value = str_replace(['-', '_', '/'], ' ', $value);
        return preg_replace('/\s+/', ' ', $value);
    }

    public static function getLocations(string $locale): array
    {
        $tenantDistrict = (string) config('services.omr.tenant_district', '');
        $tenantCity = (string) config('services.omr.tenant_city', '');
        $mainTenant = OmrConfig::tenantForSharedContent();

        $cacheKey = "locations_from_services_{$mainTenant}_{$locale}_{$tenantDistrict}_{$tenantCity}";

        return Cache::remember($cacheKey, now()->addHours(24), function () use (
            $locale,
            $tenantDistrict,
            $tenantCity,
            $mainTenant
        ) {
            $apiUrl = OmrConfig::apiUrl('services');

            $allServices = [];
            $page = 1;
            $lastPage = 1;
            $maxPages = 10;

            do {
                try {
                    $response = Http::withoutVerifying()
                        ->connectTimeout(5)
                        ->timeout(12)
                        ->retry(2, 400)
                        ->withHeaders([
                            'Accept'      => 'application/json',
                            'X-Tenant-ID' => $mainTenant,
                        ])
                        ->get($apiUrl, [
                            'tenant'        => $mainTenant,
                            'locale'        => $locale,
                            'category_slug' => 'gebaudereinigung',
                            'page'          => $page,
                            'per_page'      => 50,
                        ]);

                    if (!$response->ok()) {
                        \Log::warning('LocationController services API failed', [
                            'status' => $response->status(),
                            'tenant' => $mainTenant,
                            'locale' => $locale,
                            'page'   => $page,
                            'url'    => $apiUrl,
                            'query'  => [
                                'tenant'        => $mainTenant,
                                'locale'        => $locale,
                                'category_slug' => 'gebaudereinigung',
                                'page'          => $page,
                                'per_page'      => 50,
                            ],
                        ]);
                        break;
                    }

                    $json = $response->json();
                    $services = $json['data'] ?? [];

                    if (empty($services)) {
                        break;
                    }

                    $allServices = array_merge($allServices, $services);
                    $lastPage = (int) data_get($json, 'pagination.last_page', 1);
                    $page++;
                } catch (\Throwable $e) {
                    \Log::error('LocationController getLocations exception', [
                        'message' => $e->getMessage(),
                        'tenant'  => $mainTenant,
                        'locale'  => $locale,
                        'page'    => $page,
                        'url'     => $apiUrl,
                        'query'   => [
                            'tenant'        => $mainTenant,
                            'locale'        => $locale,
                            'category_slug' => 'gebaudereinigung',
                            'page'          => $page,
                            'per_page'      => 50,
                        ],
                    ]);

                    break;
                }
            } while ($page <= $lastPage && $page <= $maxPages);

            $normalizedDistrict = !empty($tenantDistrict)
                ? self::normalizeDistrict($tenantDistrict)
                : null;

            $normalizedCity = !empty($tenantCity)
                ? strtolower(trim($tenantCity))
                : null;

            $validLocales = ['de', 'de_DE', 'en', 'en_US'];
            $collator = new \Collator(
                in_array($locale, $validLocales, true) ? $locale : 'de_DE'
            );

            $locations = collect($allServices)
                ->filter(function ($s) use ($normalizedDistrict, $normalizedCity) {
                    if (empty($s['city'])) {
                        return false;
                    }

                    if ($normalizedCity !== null) {
                        $serviceCity = strtolower(trim($s['city'] ?? ''));
                        if ($serviceCity !== $normalizedCity) {
                            return false;
                        }
                    }

                    if ($normalizedDistrict !== null) {
                        $serviceDistrict = self::normalizeDistrict($s['district'] ?? '');
                        if ($serviceDistrict !== $normalizedDistrict) {
                            return false;
                        }
                    }

                    return true;
                })
                ->groupBy(fn ($s) => self::makeSlug($s['city']))
                ->map(function ($items, $slug) {
                    $firstItem = $items->first();

                    return [
                        'city'           => $firstItem['city'],
                        'slug'           => $slug,
                        'services_count' => $items->count(),
                        'image'          => self::replaceImageTenant($firstItem['image'] ?? null),
                        'services'       => $items->values()->toArray(),
                    ];
                })
                ->sort(fn ($a, $b) => $collator->compare($a['city'], $b['city']))
                ->values()
                ->toArray();

            return ['data' => $locations];
        });
    }

    public function index()
    {
        $locale = session('locale', OmrConfig::defaultLocale());
        $response = self::getLocations($locale);

        return Inertia::render('Locations/Index', [
            'locations' => $response['data'] ?? [],
            'locale'    => $locale,
        ]);
    }

    public function show(string $slug)
    {
        $locale = session('locale', OmrConfig::defaultLocale());
        $normalizedSlug = self::makeSlug($slug);
        $response = self::getLocations($locale);

        $city = collect($response['data'] ?? [])->firstWhere('slug', $normalizedSlug);

        if (!$city) {
            abort(404);
        }

        return Inertia::render('Locations/Show', [
            'locale'   => $locale,
            'city'     => $city,
            'services' => $city['services'] ?? [],
        ]);
    }
}
