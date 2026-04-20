<?php

namespace App\Http\Controllers;

use App\Support\OmrConfig;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SettingsController extends Controller
{
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
            $currentTenant = $matches[2];

            if ($currentTenant === $mainTenant) {
                return $imageUrl;
            }

            return preg_replace($pattern, '$1' . $mainTenant . '$3', $imageUrl);
        }

        return $imageUrl;
    }

    private static function replaceLogoImages($data)
    {
        if (is_array($data)) {
            foreach ($data as $key => $value) {
                if (in_array($key, ['logo', 'dark_logo', 'logo_dark'], true)) {
                    if (is_string($value)) {
                        $data[$key] = self::replaceImageTenant($value);
                    } elseif (is_array($value) && isset($value['url']) && is_string($value['url'])) {
                        $data[$key]['url'] = self::replaceImageTenant($value['url']);
                    }
                } elseif (is_array($value)) {
                    $data[$key] = self::replaceLogoImages($value);
                }
            }
        }

        return $data;
    }

    public static function getSettings(string $tenantId, string $locale): array
    {
        $locale = strtolower($locale);
        $mainTenant = OmrConfig::mainTenantId() ?: $tenantId;
        $cacheKey = "settings_{$tenantId}_{$locale}_{$mainTenant}";

        // Önce cache varsa direkt onu ver
        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey, []);
        }

        $apiBase = OmrConfig::baseUrl() . '/v1';

        $sections = [
            'general',
            'seo',
            'branding',
            'colors',
            'contact',
            'social',
            'analytics',
            'performance',
            'email',
            'custom-code',
            'footer',
        ];

        $settings = [];

        foreach ($sections as $section) {
            try {
                $url = "{$apiBase}/settings/{$section}";
                $requestTenant = ($section === 'colors') ? $tenantId : $mainTenant;

                $response = Http::withoutVerifying()
                    ->timeout(10)
                    ->connectTimeout(5)
                    ->withHeaders([
                        'Accept' => 'application/json',
                        'X-Tenant-ID' => $requestTenant,
                    ])
                    ->get($url, [
                        'tenant' => $requestTenant,
                        'locale' => $locale,
                    ]);

                if (! $response->successful()) {
                    Log::warning('Settings API error', [
                        'section' => $section,
                        'status' => $response->status(),
                        'body' => $response->body(),
                    ]);

                    $settings[$section] = [];
                    continue;
                }

                $json = $response->json();

                $sectionData = isset($json['data'])
                    ? (array) $json['data']
                    : [];

                $settings[$section] = self::replaceLogoImages($sectionData);

            } catch (\Throwable $e) {
                Log::error('Settings API exception', [
                    'section' => $section,
                    'error' => $e->getMessage(),
                ]);

                $settings[$section] = [];
            }
        }

        // Ne geldiyse onu cache'le, tekrar tekrar timeout yemesin
        Cache::put($cacheKey, $settings, now()->addDays(7));

        return $settings;
    }
}
