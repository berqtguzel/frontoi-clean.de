<?php

namespace App\Http\Controllers;

use App\Support\OmrConfig;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SliderController extends Controller
{
    public static function getSliders($tenant, string $locale = 'de'): array
    {
        if (!$tenant) {
            return [
                'sliders' => [],
                'meta'    => [],
            ];
        }

        $locale = strtolower($locale);
        $mainTenant = OmrConfig::mainTenantId() ?: $tenant;
        $cacheKey = "sliders_{$tenant}_{$locale}";

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($tenant, $mainTenant, $locale) {
            try {

                $response = Http::timeout(3)
                    ->withoutVerifying()
                    ->withHeaders([
                        'X-Tenant-ID' => $mainTenant,
                        'Accept'      => 'application/json',
                    ])
                    ->get(OmrConfig::apiUrl('sliders'), [
                        'tenant' => $mainTenant,
                        'lang'   => $locale,
                    ]);

                if (!$response->successful()) {
                    Log::warning('Slider API non-200 response', [
                        'tenant'  => $tenant,
                        'status'  => $response->status(),
                    ]);

                    return [
                        'sliders' => [],
                        'meta'    => ['status' => $response->status()],
                    ];
                }

                $raw = $response->json('data') ?? [];
                $data = is_array($raw) && isset($raw['data']) && is_array($raw['data'])
                    ? $raw['data']
                    : (is_array($raw) ? $raw : []);

                $sliders = collect($data)
                    ->map(function ($it, $i) {
                        $image       = $it['image']        ?? null;
                        $videoUrl    = $it['video_url']    ?? null;
                        $videoPoster = $it['video_poster'] ?? null;

                        if (!$videoPoster && $videoUrl && $image) {
                            $videoPoster = $image;
                        }

                        return [
                            'id'           => $it['id']             ?? $i,
                            'title'        => $it['title']          ?? '',
                            'description'  => $it['description']    ?? '',
                            'buttonLabel'  => $it['button_text']    ?? '',
                            'buttonUrl'    => $it['button_link']    ?? '#',
                            'order'        => $it['order']          ?? $i,
                            'image'        => $image,
                            'video_url'    => $videoUrl,
                            'video_poster' => $videoPoster,
                            'raw'          => $it,
                        ];
                    })
                    ->sortBy('order')
                    ->values();

                return [
                    'sliders' => $sliders,
                    'meta'    => $response->json('_meta') ?? [],
                ];

            } catch (\Throwable $e) {

                Log::error('❌ Slider API ERROR (Sessiz Fallback): ' . $e->getMessage());


                return [
                    'sliders' => [],
                    'meta'    => [
                        'error'   => true,
                        'message' => 'Slider data currently unavailable',
                    ],
                ];
            }
        });
    }
}
