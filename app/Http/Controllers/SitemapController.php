<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\StaticPageController;

class SitemapController extends Controller
{
    private int $serviceLocationPerPage = 2500;

public function globalIndex()
{
    $cacheKey = "sitemap_global_index";

    $xml = Cache::remember($cacheKey, now()->addHours(6), function () {

        $baseUrl = rtrim(request()->getSchemeAndHttpHost(), '/');

        $languages = ['de', 'en', 'tr'];

        $sitemaps = [];

        foreach ($languages as $language) {

            $sitemaps[] = [
                'loc' => "{$baseUrl}/{$language}/sitemap.xml",
                'lastmod' => Carbon::now()->toAtomString(),
            ];
        }

        return $this->buildSitemapIndexXml($sitemaps);
    });

    return response($xml, 200)
        ->header('Content-Type', 'application/xml; charset=UTF-8');
}

    public function index(string $locale)
    {
        $locale = strtolower($locale);

        $cacheKey = "sitemap_index_xml_{$locale}";

        $xml = Cache::remember($cacheKey, now()->addHours(6), function () use ($locale) {

            $baseUrl = rtrim(request()->getSchemeAndHttpHost(), '/');

            $serviceLocation = $this->getserviceLocationCount($locale);

            $sitemaps = [];

            $sitemaps[] = [
                'loc' => "{$baseUrl}/{$locale}/sitemap-pages.xml",
                'lastmod' => Carbon::now()->toAtomString(),
            ];
            $sitemaps[] = [
                'loc' => "{$baseUrl}/{$locale}/sitemap-services.xml",
                'lastmod' => Carbon::now()->toAtomString(),
            ];
            $sitemaps[] = [
                'loc' => "{$baseUrl}/{$locale}/sitemap-locations.xml",
                'lastmod' => Carbon::now()->toAtomString(),
            ];
            for ($p = 1; $p <= $serviceLocation; $p++) {
                $sitemaps[] = [
                    'loc' => "{$baseUrl}/{$locale}/sitemap-serviceLocation-{$p}.xml",
                    'lastmod' => Carbon::now()->toAtomString(),
                ];
            }

            return $this->buildSitemapIndexXml($sitemaps);
        });

        return response($xml, 200)->header('Content-Type', 'application/xml; charset=UTF-8');
    }

    public function pages(string $locale)
    {
        $locale = strtolower($locale);

        $cacheKey = "sitemap_pages_xml_{$locale}";

        $xml = Cache::remember($cacheKey, now()->addHours(6), function () use ($locale) {
            $baseUrl = rtrim(request()->getSchemeAndHttpHost(), '/');
            $urls = [];


            $urls[] = $this->urlItem("{$baseUrl}/{$locale}", null, 'daily', '1.0');
            $urls[] = $this->urlItem("{$baseUrl}/{$locale}/standorte", null, 'weekly', '0.8');
            $urls[] = $this->urlItem("{$baseUrl}/{$locale}/kontakt", null, 'monthly', '0.5');

            try {
                $pages = StaticPageController::getPages($locale);

                $excludeSlugs = [
                    'startseite',
                    'home',
                    'index',
                    'services',
                ];

                foreach ($pages as $page) {
                    $slug = strtolower(trim($page['slug'] ?? ''));
                    if (!$slug) continue;

                    if ($this->isErrorPageSlug($slug)) continue;
                    if (in_array($slug, $excludeSlugs, true)) continue;

                    $urls[] = $this->urlItem(
                        "{$baseUrl}/{$locale}/{$slug}",
                        $this->normalizeLastmod($page['updated_at'] ?? null),
                        'weekly',
                        '0.6'
                    );
                }
            } catch (\Throwable $e) {
                Log::error('Sitemap pages error: ' . $e->getMessage());
            }

            $urls = $this->uniqueByLoc($urls);
            return $this->buildSitemapXml($urls);
        });

        return response($xml, 200)->header('Content-Type', 'application/xml; charset=UTF-8');
    }

    public function services(string $locale)
    {
        $locale = strtolower($locale);

        $cacheKey = "sitemap_services_xml_{$locale}";

        $xml = Cache::remember($cacheKey, now()->addHours(6), function () use ($locale) {
            $baseUrl = rtrim(request()->getSchemeAndHttpHost(), '/');
            $urls = [];

            try {
                $categories = CategoryController::getCategories($locale);

                foreach ($categories as $cat) {
                    $slug = strtolower(trim($cat['slug'] ?? ''));
                    if (!$slug) continue;

                    $urls[] = $this->urlItem(
                        "{$baseUrl}/{$locale}/{$slug}",
                        $this->normalizeLastmod($cat['updated_at'] ?? null),
                        'monthly',
                        '0.7'
                    );
                }
            } catch (\Throwable $e) {
                Log::error('Sitemap category error: ' . $e->getMessage());
            }

            $urls = $this->uniqueByLoc($urls);
            return $this->buildSitemapXml($urls);
        });

        return response($xml, 200)->header('Content-Type', 'application/xml; charset=UTF-8');
    }

    public function locations(string $locale)
    {
        $locale = strtolower($locale);

        $cacheKey = "sitemap_locations_xml_{$locale}";

        $xml = Cache::remember($cacheKey, now()->addHours(6), function () use ($locale) {
            $baseUrl = rtrim(request()->getSchemeAndHttpHost(), '/');
            $urls = [];

            try {
                $locationResponse = LocationController::getLocations($locale);
                $locations = $locationResponse['data'] ?? [];

                foreach ($locations as $city) {
                    $slug = strtolower(trim($city['slug'] ?? ''));
                    if (!$slug) continue;

                    $urls[] = $this->urlItem(
                        "{$baseUrl}/{$locale}/{$slug}",
                        null,
                        'monthly',
                        '0.7'
                    );
                }
            } catch (\Throwable $e) {
                Log::error('Sitemap location error: ' . $e->getMessage());
            }

            $urls = $this->uniqueByLoc($urls);
            return $this->buildSitemapXml($urls);
        });

        return response($xml, 200)->header('Content-Type', 'application/xml; charset=UTF-8');
    }


    public function servicelocation(string $locale, int $page)
    {
        $locale = strtolower($locale);
        $page = max(1, $page);

        $cacheKey = "sitemap_servicelocation_xml_{$locale}_{$page}_{$this->serviceLocationPerPage}";

        $xml = Cache::remember($cacheKey, now()->addHours(6), function () use ($locale, $page) {
            $baseUrl = rtrim(request()->getSchemeAndHttpHost(), '/');
            $urls = [];

            try {
                $categories = CategoryController::getCategories($locale);

                $locationResponse = LocationController::getLocations($locale);
                $locations = $locationResponse['data'] ?? [];

                $catSlugs = [];
                foreach ($categories as $cat) {
                    $s = strtolower(trim($cat['slug'] ?? ''));
                    if ($s) $catSlugs[] = $s;
                }

                $citySlugs = [];
                foreach ($locations as $city) {
                    $s = strtolower(trim($city['slug'] ?? ''));
                    if ($s) $citySlugs[] = $s;
                }

                $catSlugs = array_values(array_unique($catSlugs));
                $citySlugs = array_values(array_unique($citySlugs));

                $total = count($catSlugs) * count($citySlugs);
                if ($total <= 0) {
                    return $this->buildSitemapXml([]);
                }

                $offset = ($page - 1) * $this->serviceLocationPerPage;
                $limit  = $this->serviceLocationPerPage;


                $index = 0;
                foreach ($catSlugs as $catSlug) {
                    foreach ($citySlugs as $citySlug) {

                        if ($index < $offset) {
                            $index++;
                            continue;
                        }
                        if (count($urls) >= $limit) {
                            break 2;
                        }

                        $serviceLocationSlug = $catSlug . '-' . $citySlug;

                        $urls[] = $this->urlItem(
                            "{$baseUrl}/{$locale}/{$serviceLocationSlug}",
                            null,
                            'monthly',
                            '0.7'
                        );

                        $index++;
                    }
                }

            } catch (\Throwable $e) {
                Log::error('Sitemap combos error: ' . $e->getMessage());
            }

            $urls = $this->uniqueByLoc($urls);
            return $this->buildSitemapXml($urls);
        });

        return response($xml, 200)->header('Content-Type', 'application/xml; charset=UTF-8');
    }

    private function getserviceLocationCount(string $locale): int
    {
        $cacheKey = "sitemap_servicelocation_pages_count_{$locale}_{$this->serviceLocationPerPage}";

        return Cache::remember($cacheKey, now()->addHours(6), function () use ($locale) {
            try {
                $categories = CategoryController::getCategories($locale);
                $locationResponse = LocationController::getLocations($locale);

                $catCount = is_array($categories) ? count($categories) : 0;
                $locCount = is_array($locationResponse) ? count(($locationResponse['data'] ?? [])) : 0;

                $total = $catCount * $locCount;
                if ($total <= 0) return 1;

                return (int) ceil($total / $this->serviceLocationPerPage);
            } catch (\Throwable $e) {
                Log::error('Sitemap service location page-count error: ' . $e->getMessage());
                return 1;
            }
        });
    }

    private function isErrorPageSlug(string $slug): bool
    {
        return in_array($slug, [
            '404',
            '500',
            'seite-nichtgefunden-404',
            'not-found-404',
            'keine-antwort-500',
            'not-responding-500',
        ], true);
    }

    private function urlItem($loc, $lastmod, $freq, $priority)
    {
        return compact('loc', 'lastmod', 'freq', 'priority');
    }

    private function uniqueByLoc(array $urls)
    {
        return collect($urls)->unique('loc')->values()->all();
    }

    private function buildSitemapXml(array $urls)
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml .= "\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">";

        foreach ($urls as $u) {
            $xml .= "\n<url>";
            $xml .= "\n<loc>{$u['loc']}</loc>";

            if (!empty($u['lastmod'])) {
                $xml .= "\n<lastmod>{$u['lastmod']}</lastmod>";
            }

            $xml .= "\n<changefreq>{$u['freq']}</changefreq>";
            $xml .= "\n<priority>{$u['priority']}</priority>";
            $xml .= "\n</url>";
        }

        $xml .= "\n</urlset>";

        return $xml;
    }

    private function buildSitemapIndexXml(array $sitemaps)
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml .= "\n<sitemapindex xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">";

        foreach ($sitemaps as $sm) {
            $xml .= "\n<sitemap>";
            $xml .= "\n<loc>{$sm['loc']}</loc>";
            if (!empty($sm['lastmod'])) {
                $xml .= "\n<lastmod>{$sm['lastmod']}</lastmod>";
            }
            $xml .= "\n</sitemap>";
        }

        $xml .= "\n</sitemapindex>";

        return $xml;
    }

    private function normalizeLastmod($date)
    {
        if (!$date) return null;

        try {
            return Carbon::parse($date)->toAtomString();
        } catch (\Throwable $e) {
            return null;
        }
    }
}
