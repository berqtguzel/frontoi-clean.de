<?php

namespace App\Http\Controllers;

use App\Support\OmrConfig;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class DynamicSlugController extends Controller
{
    private function api($path, $params = [])
    {
        // Resimler için ana tenant'ı kullan
        $mainTenant = OmrConfig::tenantForSharedContent();

        return Http::withoutVerifying()
            ->timeout(3)
            ->withHeaders([
                'X-Tenant-ID' => $mainTenant,
                'Accept' => 'application/json',
            ])
            ->get(
                OmrConfig::baseUrl() . $path,
                array_merge(['tenant' => $mainTenant], $params)
            );
    }

    private function findCmsPage($locale, $slug)
    {
        try {
            return Cache::remember("cms_page_{$locale}_{$slug}", now()->addDays(7), function () use ($locale, $slug) {
                $res = $this->api('/'.OmrConfig::apiVersionSegment()."/pages/{$slug}", ['locale' => $locale]);
                return $res->json('data') ?? null;
            });
        } catch (\Throwable $e) {
            Log::error('CMS page fetch error', [
                'slug' => $slug,
                'locale' => $locale,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    public function handle($locale, $slug)
    {
        $locale = strtolower($locale);
        $slug = strtolower($slug);


        $errorSlugMap = [
            '404' => 404,
            '500' => 500,
            'seite-nichtgefunden-404' => 404,
            'not-found-404' => 404,
            'keine-antwort-500' => 500,
            'not-responding-500' => 500,
        ];

        if (isset($errorSlugMap[$slug])) {
            $status = $errorSlugMap[$slug];
            $page = $this->findCmsPage($locale, $slug);

            return Inertia::render('Errors/NotFound', [
                'status' => $status,
                'locale' => $locale,
                'page' => $page,
            ])->toResponse(request())->setStatusCode($status);
        }


        if ($slug === 'kontakt') {
            return Inertia::render('kontakt/index', compact('locale'));
        }


        if ($page = $this->findCmsPage($locale, $slug)) {
            return Inertia::render('StaticPage', [
                'page' => $page,
                'slug' => $slug,
                'locale' => $locale,
            ]);
        }


        $parts = explode('-', $slug);

        if (count($parts) > 2 && in_array('in', $parts, true)) {
            $inIndex = array_search('in', $parts, true);
            $serviceSlug = implode('-', array_slice($parts, 0, $inIndex));
            $citySlug = implode('-', array_slice($parts, $inIndex + 1));

            return app(LocationShowController::class)->service(
                $locale,
                $serviceSlug,
                $citySlug
            );
        }


        $serviceRes = Cache::remember("service_exists_{$locale}_{$slug}", now()->addDays(7), function () use ($locale, $slug) {
            $res = $this->api('/'.OmrConfig::apiVersionSegment()."/services/{$slug}", ['locale' => $locale]);
            return $res->successful() && $res->json() ? true : false;
        });

        if ($serviceRes) {
            return app(ServiceShowController::class)->show($locale, $slug);
        }



        return app(LocationShowController::class)->show($locale, $slug);
    }
}
