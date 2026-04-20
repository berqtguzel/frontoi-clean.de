<?php

namespace App\Http\Controllers;

use App\Support\OmrConfig;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CategoryController extends Controller
{
    public static function getCategories($locale)
    {

        $locale = strtolower($locale);
        $cacheKey = "categories_{$locale}";

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($locale) {
            $apiUrl = OmrConfig::apiUrl('services');

            $mainTenant = OmrConfig::tenantForSharedContent();

            try {
                $response = Http::withoutVerifying()
                    ->timeout(max(5, min(60, (int) config('services.omr.timeout', 15))))
                    ->withHeaders([
                        'Accept' => 'application/json',
                        'X-Tenant-ID' => $mainTenant,
                    ])
                    ->get($apiUrl, [
                        'tenant' => $mainTenant,
                        'locale' => $locale,
                        'parent_id' => "null",
                        'per_page' => 50,
                    ]);
                Log::info('KATEGORI API RESPONSE', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                if (!$response->successful()) {
                    Log::error("Category API Error: HTTP {$response->status()}");
                    return [];
                }

                $categories_all = collect($response->json('data') ?? []);

                $categories = $categories_all
                    ->filter(fn($item) => empty($item['parent_id']) || $item['parent_id'] == 0)
                    ->sortBy('order')
                    ->values()
                    ->all();


                return $categories;


            } catch (\Throwable $e) {
                Log::error("Category API Error: {$e->getMessage()}");
                return [];
            }
        });
    }

}
