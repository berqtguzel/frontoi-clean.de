<?php

namespace App\Http\Controllers;

use App\Support\OmrConfig;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class MenuController extends Controller
{
    public static function fetchMenu(string $type, string $locale)
    {
        $mainTenant = OmrConfig::tenantForSharedContent();
        $url = OmrConfig::apiUrl("menus/{$type}");

        $locale   = strtolower($locale);
        $cacheKey = "{$type}_menu_{$mainTenant}_{$locale}";


        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            $res = Http::withoutVerifying()
                ->connectTimeout(5)
                ->timeout(10)
                ->retry(2, 300)
                ->withHeaders([
                    'Accept'      => 'application/json',
                    'X-Tenant-ID' => $mainTenant,
                ])
                ->get($url, [
                    'tenant' => $mainTenant,
                    'locale' => $locale,
                ]);

            \Log::info('MENU API DEBUG', [
                'type'     => $type,
                'url'      => $url,
                'tenant'   => $mainTenant,
                'locale'   => $locale,
                'status'   => $res->status(),
                'response' => $res->json(),
            ]);

            if ($res->ok()) {

                $json = $res->json();


                $data =
                    $json['data']['items'] ??
                    $json['data'] ??
                    $json['items'] ??
                    [];


                if (!empty($data)) {
                    Cache::put($cacheKey, $data, now()->addDays(7));
                } else {
                    \Log::warning('Menu empty data', [
                        'type'   => $type,
                        'url'    => $url,
                        'tenant' => $mainTenant,
                        'locale' => $locale,
                        'json'   => $json,
                    ]);
                }

                return $data;
            }

            \Log::warning('Menu API failed', [
                'status' => $res->status(),
                'url'    => $url,
                'tenant' => $mainTenant,
                'locale' => $locale,
                'body'   => $res->body(),
            ]);

        } catch (\Throwable $e) {
            \Log::error('Menu API exception', [
                'error'  => $e->getMessage(),
                'url'    => $url,
                'tenant' => $mainTenant,
                'locale' => $locale,
            ]);
        }

        return [];
    }

    public static function getHeaderMenu(string $locale)
    {
        return self::fetchMenu('header', $locale);
    }

    public static function getFooterMenu(string $locale)
    {
        return self::fetchMenu('footer', $locale);
    }
}
