<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;
use Illuminate\Support\Facades\Cache;

// Controller Importları
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ContactFormController;
use App\Http\Controllers\GlobalWebsiteController;
use App\Http\Controllers\WidgetController;
use App\Http\Controllers\MapController;
use App\Http\Controllers\SliderController;
use App\Http\Controllers\LanguagesController;
use App\Http\Controllers\LocationController;
use App\Support\OmrConfig;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        $tenantId = OmrConfig::tenantId();

        $locale = $request->route('locale')
            ?? session('locale')
            ?? config('app.locale', 'de');

        session(['locale' => $locale]);

        $langData = LanguagesController::getLanguages($tenantId, $locale);

        return array_merge(parent::share($request), [
            'locale'      => $locale,
            'languages'   => $langData['languages'] ?? [],
            'defaultLang' => $langData['defaultCode'] ?? 'de',

            'settings' => fn() => SettingsController::getSettings($tenantId, $locale),

            'menus' => fn() => [
                'header' => MenuController::getHeaderMenu($locale),
                'footer' => MenuController::getFooterMenu($locale),
            ],

            'global' => [
                'locale' => $locale,
                'categories' => fn() => CategoryController::getCategories($locale),
                'forms'      => fn() => ContactFormController::getForms($locale),
                'websites'   => fn() => Cache::get("websites", []),
                'widgets'    => fn() => WidgetController::getWidgets($tenantId, $locale),
                'maps'       => fn() => MapController::getMaps($tenantId, $locale),
                'sliders'    => fn() => SliderController::getSliders($tenantId, $locale),
                'locations'  => fn() => LocationController::getLocations($locale),
            ],

            'ziggy' => fn() => array_merge((new Ziggy)->toArray(), [
                'location' => $request->url(),
            ]),
        ]);
    }
}
