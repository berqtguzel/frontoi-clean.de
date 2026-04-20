<?php

namespace App\Http\Controllers;

use App\Support\OmrConfig;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class LanguagesController extends Controller
{
    public static function getLanguages($tenantId, $locale)
    {
        $url = OmrConfig::baseUrl() . '/global/settings/languages';


    $cacheKey = "languages_{$tenantId}";


        return Cache::remember($cacheKey, now()->addDays(7), function () use ($url, $tenantId, $locale) {
            try {
                $timeout = max(5, min(60, (int) config('services.omr.timeout', 15)));
                $response = Http::timeout($timeout)
                    ->withOptions([
                        'verify' => false,
                    ])
                    ->accept('application/json')
                    ->get($url, [
                        'tenant' => $tenantId,
                        'locale' => $locale,
                    ])
                    ->json();
            } catch (\Exception $e) {
                Log::error("🌐 Languages API Error: " . $e->getMessage());
                return self::fallback();
            }

            return self::normalize($response);
        });
    }

private static function normalize($res)
{

    if (!$res || !is_array($res)) {
        return self::fallback();
    }

    $languages = $res['data']['languages'] ?? [];

    if (!is_array($languages) || empty($languages)) {
        return self::fallback();
    }

    $default = $res['data']['default']['locale'] ?? 'de';

    $normalized = [];

    foreach ($languages as $l) {
        if (!is_array($l)) continue;

        $code = strtolower($l['locale'] ?? 'de');

        $normalized[] = [
            'code'  => $code,
            'label' => $l['name'] ?? strtoupper($code),
        ];
    }

    return [
        'languages'   => $normalized,
        'defaultCode' => strtolower($default),
    ];
}

    private static function fallback()
    {
        return [
            'languages' => [
                ['code' => 'de', 'label' => 'Deutsch'],
                ['code' => 'en', 'label' => 'English'],
                ['code' => 'tr', 'label' => 'Türkçe'],
            ],
            'defaultCode' => 'de'
        ];
    }
}
