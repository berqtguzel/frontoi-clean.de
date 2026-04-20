<?php

namespace App\Http\Controllers;

use App\Support\OmrConfig;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class LocationsController extends Controller
{
    public function index()
    {
        $locale = session('locale', OmrConfig::defaultLocale());

        $cacheKey = "locations_list_{$locale}";


        $response = Cache::remember($cacheKey, now()->addDays(7), function () use ($locale) {
            return LocationController::getLocations($locale);
        });

        return Inertia::render('Locations/Index', [
            'locations' => $response['data'] ?? [],
            'meta' => $response['meta'] ?? ($response['pagination'] ?? []),
            'locale' => $locale,
        ]);
    }

    public function show(string $slug)
    {
        $locale = session('locale', OmrConfig::defaultLocale());
        $tenantId = OmrConfig::tenantId();


        $locationsCacheKey = "locations_list_full_{$locale}";

        $locationsResponse = Cache::remember($locationsCacheKey, now()->addDays(7), function () use ($locale) {

            return LocationController::getLocations($locale);
        });

        $locations = $locationsResponse['data'] ?? [];


        $city = collect($locations)->first(function ($loc) use ($slug) {
            return trim(strtolower($loc['slug'] ?? '')) === trim(strtolower($slug));
        });

        if (!$city)
            abort(404);


        $apiBase = OmrConfig::baseUrl() . '/v1';

        $servicesCacheKey = "city_services_{$tenantId}_{$slug}_{$locale}";

        $mainTenant = OmrConfig::tenantForSharedContent();

        $services = Cache::remember($servicesCacheKey, now()->addDays(7), function () use ($apiBase, $mainTenant, $locale, $slug) {
            try {
                $res = Http::withoutVerifying()
                    ->timeout(3)
                    ->connectTimeout(1)
                    ->withHeaders([
                        'Accept' => 'application/json',
                        'X-Tenant-ID' => $mainTenant
                    ])->get("$apiBase/services", [
                            'limit' => 200,
                            'locale' => $locale,
                            'city' => $slug,
                        ]);

                return $res->json()['data'] ?? [];
            } catch (\Throwable $e) {
                return [];
            }
        });


        return Inertia::render('Locations/Show', [
            'locale' => $locale,
            'city' => $city,
            'services' => $services,
        ]);
    }
}
