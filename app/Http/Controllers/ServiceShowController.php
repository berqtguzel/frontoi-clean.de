<?php

namespace App\Http\Controllers;

use App\Support\OmrConfig;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class ServiceShowController extends Controller
{
    public function show($locale, $serviceSlug)
    {
        $tenant = OmrConfig::tenantId();

        $mainTenant = OmrConfig::tenantForSharedContent();

        $mainCacheKey = "service_main_{$tenant}_{$locale}_{$serviceSlug}";

        $mainService = Cache::remember($mainCacheKey, now()->addDays(7), function () use ($mainTenant, $locale, $serviceSlug) {
            $res = Http::withoutVerifying()
                ->timeout(3)
                ->withHeaders([
                    'X-Tenant-ID' => $mainTenant,
                    'Accept' => 'application/json',
                ])
                ->get(OmrConfig::apiUrl("services/{$serviceSlug}"), [
                    'tenant' => $mainTenant,
                    'locale' => $locale,
                ]);

            if (!$res->successful()) {
                return null;
            }

            $json = $res->json();

            return is_array($json) && isset($json['data']) && is_array($json['data'])
                ? $json['data']
                : (is_array($json) ? $json : null);
        });

        if (!$mainService) {
            abort(404);
        }

        $category = $mainService['category'] ?? null;
        $categoryId = $mainService['category_id'] ?? null;

        $variantCacheKey = "service_variants_{$tenant}_{$locale}_{$serviceSlug}_" . ($categoryId ?? 'none');

        $variantServices = Cache::remember($variantCacheKey, now()->addDays(7), function () use ($mainTenant, $locale, $serviceSlug, $categoryId, $mainService) {
            $perPage = 50;
            $mainId = $mainService['id'] ?? null;


            $fetchAllPages = function (array $params) use ($mainTenant, $locale, $perPage) {
                $all = collect();
                $page = 1;

                while (true) {
                    $res = Http::withoutVerifying()
                        ->timeout(3)
                        ->withHeaders([
                            'X-Tenant-ID' => $mainTenant,
                            'Accept' => 'application/json',
                        ])
                        ->get(OmrConfig::apiUrl('services'), array_merge([
                            'tenant' => $mainTenant,
                            'locale' => $locale,
                            'page' => $page,
                            'per_page' => $perPage,
                        ], $params));

                    if (!$res->successful()) {
                        return collect();
                    }

                    $items = $res->json('data') ?? [];
                    $all = $all->concat($items);


                    $lastPage = $res->json('meta.last_page');
                    if ($lastPage !== null) {
                        if ($page >= (int) $lastPage)
                            break;
                        $page++;
                        continue;
                    }


                    if (count($items) < $perPage)
                        break;

                    $page++;
                    if ($page > 50)
                        break;
                }

                return $all;
            };


            $variants = $fetchAllPages([
                'category_slug' => $serviceSlug,
            ]);


            if ($variants->isEmpty() && $categoryId) {
                $variants = $fetchAllPages([
                    'category_id' => $categoryId,
                ]);
            }


            return $variants
                ->filter(fn($s) => ($s['id'] ?? null) !== $mainId)
                ->values()
                ->toArray();
        });

        return Inertia::render('Services/Show', [
            'service' => $mainService,
            'services' => $variantServices,
            'category' => $category,
            'slug' => $serviceSlug,
            'locale' => $locale,
        ]);
    }
}
