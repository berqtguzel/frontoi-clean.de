<?php

use App\Support\OmrConfig;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

if (! function_exists('omrFlattenSettingsRows')) {
    /**
     * @param  array<string, mixed>|null  $json
     * @return array<string, mixed>
     */
    function omrFlattenSettingsRows(?array $json): array
    {
        if (! is_array($json)) {
            return [];
        }

        $d = data_get($json, 'data');
        if (is_array($d) && isset($d['data']) && is_array($d['data'])) {
            $rows = $d['data'];
        } elseif (is_array($d)) {
            $rows = $d;
        } else {
            $rows = [];
        }

        $flat = [];
        foreach ($rows as $row) {
            if (is_array($row) && isset($row['key'])) {
                $flat[$row['key']] = $row['value'] ?? null;
            }
        }

        return $flat;
    }
}

if (! function_exists('getSiteColors')) {
    function getSiteColors(): array
    {

        $defaults = [
            'site_primary_color' => '#007bff',
            'site_secondary_color' => '#6c757d',
            'site_accent_color' => '#22d3ee',
            'button_color' => '#007bff',
            'text_color' => '#333333',
            'h1_color' => '#111111',
            'h2_color' => '#333333',
            'h3_color' => '#555555',
            'link_color' => '#2563eb',
            'background_color' => '#ffffff',
            'header_background_color' => '#ffffff',
            'footer_background_color' => '#f8f9fa',
        ];

        try {
            $tenantId = OmrConfig::tenantId();

            $cacheKey = "site_colors_{$tenantId}";

            return Cache::remember($cacheKey, now()->addDays(7), function () use ($tenantId, $defaults) {
                try {
                    if (OmrConfig::apiVersionNumber() === 1) {
                        $response = Http::withoutVerifying()->withHeaders([
                            'X-Tenant-ID' => $tenantId,
                        ])->get(OmrConfig::apiUrl('settings/colors'));

                        if ($response->successful() && data_get($response->json(), 'success') === true) {
                            $data = (array) data_get($response->json(), 'data', []);

                            return array_merge($defaults, $data);
                        }
                    } else {
                        $response = Http::withoutVerifying()->withHeaders([
                            'X-Tenant-ID' => $tenantId,
                        ])->get(OmrConfig::apiUrl('settings'));

                        if ($response->successful() && data_get($response->json(), 'success') === true) {
                            $flat = omrFlattenSettingsRows($response->json());

                            return array_merge($defaults, array_intersect_key($flat, $defaults));
                        }
                    }
                } catch (\Throwable $e) {
                    Log::warning('Failed to fetch site colors (inside cache): '.$e->getMessage());
                }

                return $defaults;
            });
        } catch (\Throwable $e) {
            Log::warning('Failed to fetch site colors: '.$e->getMessage());
        }

        // Hata veya başarısızlıkta tüm alanları içeren varsayılanlar
        return $defaults;
    }
}
