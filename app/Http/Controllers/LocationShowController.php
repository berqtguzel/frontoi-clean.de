<?php

namespace App\Http\Controllers;

use App\Support\OmrConfig;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class LocationShowController extends Controller
{
    /**
     * Slug normalize (tek format)
     */
    private function normalizeSlug(string $text): string
    {
        $text = str_replace(['/', '\\'], '-', $text);
        $text = iconv('UTF-8', 'ASCII//TRANSLIT', $text);
        $text = preg_replace('/[^A-Za-z0-9]+/', '-', $text);
        return trim(strtolower($text), '-');
    }

    /**
     * Resim URL'indeki tenant ID'sini ana tenant ile değiştirir
     *
     * @param string|null $imageUrl
     * @return string|null
     */
    private function replaceImageTenant(?string $imageUrl): ?string
    {
        if (!$imageUrl) {
            return null;
        }

        $mainTenant = OmrConfig::mainTenantId();

        if (! $mainTenant) {
            return $imageUrl;
        }

        // URL'deki tenant ID'sini bul ve değiştir
        // Format: /storage/{tenant_id}/media/...
        $pattern = '/\/storage\/([^\/]+)\/media\//';

        if (preg_match($pattern, $imageUrl, $matches)) {
            $currentTenant = $matches[1];
            // Eğer zaten ana tenant ise değiştirme
            if ($currentTenant === $mainTenant) {
                return $imageUrl;
            }
            // Tenant ID'sini değiştir
            return preg_replace($pattern, '/storage/' . $mainTenant . '/media/', $imageUrl);
        }

        return $imageUrl;
    }

    /**
     * Servis verilerindeki resim URL'lerini dönüştürür (static versiyon)
     *
     * @param array $service
     * @return array
     */
    private static function transformServiceImagesStatic(array $service): array
    {
        if (isset($service['image'])) {
            $service['image'] = self::replaceImageTenantStatic($service['image']);
        }

        // Diğer olası resim alanları
        if (isset($service['images']) && is_array($service['images'])) {
            $service['images'] = array_map(function ($img) {
                return is_string($img) ? self::replaceImageTenantStatic($img) : $img;
            }, $service['images']);
        }

        return $service;
    }

    /**
     * Resim URL'indeki tenant ID'sini ana tenant ile değiştirir (static versiyon)
     *
     * @param string|null $imageUrl
     * @return string|null
     */
    private static function replaceImageTenantStatic(?string $imageUrl): ?string
    {
        if (!$imageUrl) {
            return null;
        }

        $mainTenant = OmrConfig::mainTenantId();

        if (! $mainTenant) {
            return $imageUrl;
        }

        // URL'deki tenant ID'sini bul ve değiştir
        // Format: /storage/{tenant_id}/media/ veya https://domain.com/storage/{tenant_id}/media/
        // Hem relative hem absolute URL'leri destekle
        $pattern = '/(\/storage\/)([^\/]+)(\/media\/)/';

        if (preg_match($pattern, $imageUrl, $matches)) {
            $currentTenant = $matches[2];
            // Eğer zaten ana tenant ise değiştirme
            if ($currentTenant === $mainTenant) {
                return $imageUrl;
            }
            // Tenant ID'sini değiştir
            return preg_replace($pattern, '$1' . $mainTenant . '$3', $imageUrl);
        }

        return $imageUrl;
    }


private function findCityNameBySlug(string $slug, string $locale): ?string
{
    $cacheKey = "city_slug_map_{$locale}_gebaudereinigung";

    $cityMap = Cache::remember($cacheKey, now()->addDays(7), function () use ($locale) {

        $apiUrl = OmrConfig::apiUrl('services');
        $mainTenant = OmrConfig::tenantForSharedContent();

        $map = [];
        $page = 1;
        $lastPage = 1;

        do {
            $res = Http::withoutVerifying()
                ->withHeaders([
                    'Accept'      => 'application/json',
                    'X-Tenant-ID' => $mainTenant,
                ])
                ->get($apiUrl, [
                    'tenant'        => $mainTenant,
                    'locale'        => $locale,
                    'category_slug' => 'Gebaudereinigung',
                    'page'          => $page,
                ]);

            if (!$res->ok()) {
                break;
            }

            $json = $res->json();
            $services = $json['data'] ?? [];

            foreach ($services as $s) {
                $city = $s['city'] ?? null;
                if (!$city) {
                    continue;
                }

                $citySlug = $this->normalizeSlug($city);

                // 🔒 overwrite yok
                if (!isset($map[$citySlug])) {
                    $map[$citySlug] = $city;
                }
            }

            $lastPage = data_get($json, 'pagination.last_page', 1);
            $page++;

        } while ($page <= $lastPage);

        return $map;
    });

    $normalized = $this->normalizeSlug($slug);

    return $cityMap[$normalized] ?? null;
}


    // ---------------------
    // ROUTE HANDLERS
    // ---------------------

    public function show(string $locale, string $citySlug)
    {
        return $this->loadCityServices($locale, $citySlug);
    }

    public function service(string $locale, string $serviceSlug, string $citySlug)
    {
        return $this->loadCityServices($locale, $citySlug, $serviceSlug);
    }

    // ---------------------
    // MAIN LOADER
    // ---------------------

    private function loadCityServices(
        string $locale,
        string $citySlug,
        string $serviceSlug = 'Gebaudereinigung'
    ) {
        $tenantId = OmrConfig::tenantId();

        $mainTenant = OmrConfig::tenantForSharedContent();

        session(['locale' => $locale]);


        // 🔥 slug → cityName
        $cityName = $this->findCityNameBySlug($citySlug, $locale);

        if (!$cityName) {
            abort(404, 'City not found');
        }

        $apiUrl = OmrConfig::apiUrl('services');

        // -------- PRIMARY SERVICE --------
        $primaryCacheKey = "primary_service_{$tenantId}_{$citySlug}_{$serviceSlug}_{$locale}";

        $primaryService = Cache::remember($primaryCacheKey, now()->addDays(7), function () use (
            $apiUrl,
            $mainTenant,
            $cityName,
            $locale,
            $serviceSlug
        ) {
            $res = Http::withoutVerifying()
                ->withHeaders([
                    'Accept' => 'application/json',
                    'X-Tenant-ID' => $mainTenant,
                ])
                ->get($apiUrl, [
                    'tenant'        => $mainTenant,
                    'city'          => $cityName,
                    'locale'        => $locale,
                    'category_slug' => $serviceSlug,
                    'per_page'      => 1,
                ]);

            $service = $res->json('data')[0] ?? null;

            // Resim URL'lerini dönüştür
            if ($service) {
                $service = self::transformServiceImagesStatic($service);
            }

            return $service;
        });

        if (!$primaryService) {
            abort(404);
        }

        // -------- OTHER SERVICES --------
        $otherCacheKey = "other_services_{$tenantId}_{$citySlug}_{$locale}";

   $otherServices = Cache::remember($otherCacheKey, now()->addDays(7), function () use (
    $apiUrl,
    $mainTenant,
    $cityName,
    $locale,
    $primaryService
) {
    $allServices = [];
    $page = 1;
    $lastPage = 1;
    $maxPages = 20;

    do {
        $res = Http::withoutVerifying()
            ->timeout(3)
            ->connectTimeout(1)
            ->withHeaders([
                'Accept' => 'application/json',
                'X-Tenant-ID' => $mainTenant,
            ])
            ->get($apiUrl, [
                'tenant'   => $mainTenant,
                'city'     => $cityName,
                'locale'   => $locale,
                'page'     => $page,
                'per_page' => 50,
            ]);

        if (!$res->ok()) {
            break;
        }

        $json = $res->json();
        $services = $json['data'] ?? [];

        if (empty($services)) {
            break;
        }

        $allServices = array_merge($allServices, $services);

        $lastPage = data_get($json, 'pagination.last_page', 1);
        $page++;

    } while ($page <= $lastPage && $page <= $maxPages);

    return collect($allServices)
        ->reject(fn ($s) => ($s['id'] ?? 0) === ($primaryService['id'] ?? -1))
        ->map(fn ($service) => self::transformServiceImagesStatic($service))
        ->values()
        ->toArray();
});
        return Inertia::render('Locations/Show', [
            'city'           => $cityName,
            'primaryService' => $primaryService,
            'services'       => $otherServices,
            'locale'         => $locale,
            'slug'           => $citySlug,
        ]);
    }
}
