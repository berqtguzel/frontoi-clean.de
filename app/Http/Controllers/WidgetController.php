<?php

namespace App\Http\Controllers;

use App\Support\OmrConfig;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class WidgetController extends Controller
{
    /**
     * Resim URL'indeki tenant ID'sini ana tenant ile değiştirir
     *
     * @param string|null $imageUrl
     * @return string|null
     */
    private static function replaceImageTenant(?string $imageUrl): ?string
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

    public static function getWidgets($tenant, $locale = 'de')
    {
        if (!$tenant) {
            Log::error("❌ Tenant ID Eksik!");
            return [
                'whatsapp'   => [],
                'ratings'    => [],
                'highlights' => [],
            ];
        }

        $locale = strtolower($locale);

        $mainTenant = OmrConfig::mainTenantId() ?: $tenant;

        // 🔑 Cache key (tenant + locale + main_tenant)
        $cacheKey = "widgets_{$tenant}_{$locale}_{$mainTenant}";

        // 🧊 7 gün cache
        return Cache::remember($cacheKey, now()->addDays(7), function () use ($mainTenant, $locale) {
            try {
                $whatsapp = Http::withoutVerifying()
                    ->timeout(5)
                    ->connectTimeout(2)
                    ->withHeaders([
                        'Accept' => 'application/json',
                        'X-Tenant-ID' => $mainTenant,
                    ])
                    ->get(OmrConfig::apiUrl('widgets/whatsapp'), [
                        'tenant' => $mainTenant,
                        'locale' => $locale,
                    ])
                    ->json('data') ?? [];

                $ratings = Http::withoutVerifying()
                    ->timeout(5)
                    ->connectTimeout(2)
                    ->withHeaders([
                        'Accept' => 'application/json',
                        'X-Tenant-ID' => $mainTenant,
                    ])
                    ->get(OmrConfig::apiUrl('widgets/ratings'), [
                        'tenant' => $mainTenant,
                        'locale' => $locale,
                    ])
                    ->json('data') ?? [];

                $highlights = Http::withoutVerifying()
                    ->timeout(5)
                    ->connectTimeout(2)
                    ->withHeaders([
                        'Accept' => 'application/json',
                        'X-Tenant-ID' => $mainTenant,
                    ])
                    ->get(OmrConfig::apiUrl('widgets/service-highlights'), [
                        'tenant' => $mainTenant,
                        'locale' => $locale,
                    ])
                    ->json('data') ?? [];

                // Highlights'taki image URL'lerini OMR_MAIN_TENANT ile değiştir
                $highlights = array_map(function ($item) {
                    if (isset($item['image'])) {
                        $item['image'] = self::replaceImageTenant($item['image']);
                    }
                    return $item;
                }, $highlights);

                Log::info("🟢 Widgets Loaded", [
                    'whatsapp'   => count($whatsapp),
                    'ratings'    => count($ratings),
                    'highlights' => count($highlights),
                ]);

                return [
                    'whatsapp'   => $whatsapp,
                    'ratings'    => $ratings,
                    'highlights' => $highlights,
                ];
            } catch (\Throwable $e) {
                Log::error("🚨 WidgetController ERROR: " . $e->getMessage());

                return [
                    'whatsapp'   => [],
                    'ratings'    => [],
                    'highlights' => [],
                ];
            }
        });
    }
}
