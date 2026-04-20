<?php

namespace App\Http\Controllers;

use App\Support\OmrConfig;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class StaticPageController extends Controller
{
    public static function getPages(string $locale): array
    {
        $tenant = OmrConfig::tenantId();
        $locale = strtolower($locale);

        if (! $tenant) {
            return [];
        }

        $cacheKey = "pages_list_{$tenant}_{$locale}";

        $mainTenant = OmrConfig::tenantForSharedContent();

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($mainTenant, $locale) {
            try {
                $res = Http::withoutVerifying()
                    ->timeout(5)
                    ->withHeaders([
                        'X-Tenant-ID' => $mainTenant,
                        'Accept' => 'application/json',
                    ])
                    ->get(OmrConfig::apiUrl('pages'), [
                        'tenant' => $mainTenant,
                        'locale' => $locale,
                    ]);

                if (!$res->successful()) {
                    Log::error('getPages API error', [
                        'status' => $res->status(),
                        'body' => $res->body(),
                        'locale' => $locale,
                    ]);
                    return [];
                }

                return $res->json('data') ?? [];

            } catch (\Throwable $e) {
                Log::error('getPages exception', [
                    'error' => $e->getMessage(),
                    'locale' => $locale,
                ]);
                return [];
            }
        });
    }



    public function index($locale)
    {
        $locale = strtolower($locale);

        $pages = self::getPages($locale);

        return Inertia::render('Pages/Index', [
            'pages'  => $pages,
            'locale' => $locale,
        ]);
    }


    public function show($locale, $pageSlug)
    {
        $tenant = OmrConfig::tenantId();
        $locale = strtolower($locale);
        $pageSlug = strtolower($pageSlug);

        if (! $tenant) {
            abort(500, 'OMR_TENANT_ID missing');
        }

        $errorPages = [
            '404'                     => 404,
            '500'                     => 500,
            'seite-nichtgefunden-404' => 404,
            'not-found-404'           => 404,
            'keine-antwort-500'       => 500,
            'not-responding-500'      => 500,
        ];

        $isErrorSlug = array_key_exists($pageSlug, $errorPages);
        $status = $errorPages[$pageSlug] ?? 404;

        $cacheKey = "page_show_{$tenant}_{$locale}_{$pageSlug}";
        $mainTenant = OmrConfig::tenantForSharedContent();

        $page = Cache::remember($cacheKey, now()->addDays(7), function () use ($mainTenant, $locale, $pageSlug) {
            try {
                $res = Http::withoutVerifying()
                    ->timeout(5)
                    ->withHeaders(['X-Tenant-ID' => $mainTenant])
                    ->get(OmrConfig::apiUrl("pages/{$pageSlug}"), [
                        'tenant' => $mainTenant,
                        'locale' => $locale,
                    ]);

                return $res->json('data') ?? null;

            } catch (\Throwable $e) {
                Log::error('Pages show API error', [
                    'slug' => $pageSlug,
                    'error' => $e->getMessage(),
                ]);
                return null;
            }
        });

        if (!$page && $isErrorSlug) {
            return Inertia::render('Errors/NotFound', [
                'status' => $status,
                'locale' => $locale,
                'page' => [
                    'title' => ($status === 500 ? '500 — Serverfehler' : '404 — Seite nicht gefunden'),
                    'content' => ($status === 500
                        ? 'Ein Serverfehler ist aufgetreten — bitte versuchen Sie es erneut.'
                        : 'Die Seite wurde nicht gefunden oder existiert nicht mehr.'),
                ],
            ])->toResponse(request())->setStatusCode($status);
        }

        if ($isErrorSlug) {
            return Inertia::render('Errors/NotFound', [
                'status' => $status,
                'locale' => $locale,
                'page' => $page,
            ])->toResponse(request())->setStatusCode($status);
        }

        if (!$page) abort(404);

        return Inertia::render('Pages/Show', [
            'page'   => $page,
            'locale' => $locale,
        ]);
    }
}
