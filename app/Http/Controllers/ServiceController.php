<?php

namespace App\Http\Controllers;

use App\Support\OmrConfig;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class ServiceController extends Controller
{
    public function index()
    {

        $tenantId = OmrConfig::tenantId();
        $locale = session('locale', OmrConfig::defaultLocale());

        if (!$tenantId) {
            return response()->json(['error' => 'OMR_TENANT_ID missing'], 500);
        }

        $apiUrl = OmrConfig::apiUrl('services');
        $cacheKey = "services_categories_root_{$tenantId}_" . strtolower($locale);

        $categories = Cache::remember($cacheKey, now()->addDays(7), function () use ($apiUrl, $tenantId, $locale) {
            try {
                // API parent_id=null

                $response = Http::withoutVerifying()
                    ->timeout(3)
                    ->withHeaders([
                        'Accept' => 'application/json',
                        'X-Tenant-ID' => $tenantId,
                    ])
                    ->get($apiUrl, [
                        'tenant' => $tenantId,
                        'locale' => $locale,
                        'parent_id' => 'null',
                        'per_page' => 100,
                    ]);

                if (!$response->successful()) {
                    return [];
                }

                return $response->json('data') ?? [];

            } catch (\Throwable $e) {
                return [];
            }
        });

        return Inertia::render('Services/Index', [
            'count' => count($categories),
            'categories' => $categories,
            'locale' => $locale,
        ]);
    }
}
