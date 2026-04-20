<?php

namespace App\Http\Controllers;

use App\Support\OmrConfig;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class MapController extends Controller
{
    public static function getMaps($tenant, $locale = 'de')
    {
        if (!$tenant) {
            Log::error("❌ Tenant ID Eksik!");
            return [];
        }

        // OMR_MAIN_TENANT kullan
        $mainTenant = OmrConfig::mainTenantId() ?: $tenant;
        $mainTenant = strtolower($mainTenant);
        $locale = strtolower($locale);
        $tenantDistrictRaw = (string) config('services.omr.tenant_district', '');
        $tenantCityRaw = (string) config('services.omr.tenant_city', '');
        $tenantDistrictKey = strtolower(trim($tenantDistrictRaw)) ?: 'all';
        $tenantCityKey = strtolower(trim($tenantCityRaw)) ?: 'all';

        $cacheKey = "maps_{$mainTenant}_{$locale}_{$tenantDistrictKey}_{$tenantCityKey}";

        return Cache::remember($cacheKey, now()->addHours(3), function () use ($mainTenant, $locale, $tenantDistrictRaw, $tenantCityRaw) {

            try {
                $response = Http::withoutVerifying()
                    ->timeout(3)
                    ->connectTimeout(1)
                    ->withHeaders([
                        'Accept' => 'application/json',
                        'X-Tenant-ID' => $mainTenant,
                    ])
                    ->get(OmrConfig::apiUrl('maps'), [
                        'tenant' => $mainTenant,
                        'locale' => $locale,
                    ]);

                if ($response->failed()) {
                    Log::error('❌ Maps API failed');
                    return [];
                }

                $data = $response->json('data', []);
                $map  = $data[0] ?? null;

                if (!$map) {
                    Log::warning('⚠️ Map boş döndü');
                    return [];
                }

                $regions = $map['map_data']['regions'] ?? [];

                $normalize = function (?string $value): string {
                    $value = strtolower(trim((string) $value));
                    $value = str_replace(['-', '_', '/'], ' ', $value);
                    return preg_replace('/\s+/', ' ', $value);
                };

                $markers = collect($regions)
                    ->filter(fn ($r) => !empty($r['latitude']) && !empty($r['longitude']))
                    ->map(fn ($r) => [
                        'id'        => $r['service_id'] ?? null,
                        'name'      => $r['city'] ?? null,
                        'slug'      => $r['service_slug'] ?? null,
                        'latitude'  => (float) $r['latitude'],
                        'longitude' => (float) $r['longitude'],
                        'district'  => $normalize($r['district'] ?? ''),
                        'order'     => $r['order'] ?? 0,
                    ])
                    ->values();


                $tenantDistrict = $normalize($tenantDistrictRaw);
                $tenantCity = !empty($tenantCityRaw) ? strtolower(trim($tenantCityRaw)) : null;

                // District filtresi
                if ($tenantDistrict !== '') {
                    $markers = $markers
                        ->filter(fn ($m) => $m['district'] === $tenantDistrict)
                        ->values();
                }

                // City filtresi (hem district hem city varsa ikisine de uymalı)
                if ($tenantCity !== null) {
                    $markers = $markers
                        ->filter(function ($m) use ($tenantCity) {
                            $markerCity = strtolower(trim($m['name'] ?? ''));
                            return $markerCity === $tenantCity;
                        })
                        ->values();
                }

                if (config('app.debug')) {
                    Log::info('🧪 MAP DEBUG', [
                        'tenant' => $mainTenant,
                        'district' => $tenantDistrict,
                        'city' => $tenantCity,
                        'marker_count' => $markers->count(),
                    ]);
                }

                return [
                    'map_type' => 'country',
                    'center' => [
                        (float) config('services.omr.center_lng', 9.5),
                        (float) config('services.omr.center_lat', 51.5),
                    ],
                    'scale' => (int) config('services.omr.scale_desktop', 2400),
                    'markers' => $markers->sortBy('order')->values(),
                ];

            } catch (\Throwable $e) {
                Log::error("❌ MapController ERROR: {$e->getMessage()}");
                return [];
            }
        });
    }
}
