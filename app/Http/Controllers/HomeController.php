<?php

namespace App\Http\Controllers;

use App\Support\OmrConfig;
use Illuminate\Support\Facades\Log;

use Inertia\Inertia;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\ContactFormController;
use App\Http\Controllers\WidgetController;
use App\Http\Controllers\MapController;
use App\Http\Controllers\SliderController;
use App\Http\Controllers\CategoryController;
class HomeController extends Controller
{
    public function index()
    {
        $tenantId = OmrConfig::tenantId();

        $locale = request()->route('locale')
            ?? session('locale')
            ?? OmrConfig::defaultLocale();


        $categories   = [];
        $locations    = ['data' => []];
        $headerMenu   = [];
        $footerMenu   = [];
        $settings     = [];
        $forms        = [];
        $widgets      = [];
        $maps         = [];
        $sliders      = [];

        try {


            $locationsResponse = LocationController::getLocations($locale);

            $locations = [
                'data' => $locationsResponse['data'] ?? [],
                'pagination' => $locationsResponse['pagination']
                    ?? ($locationsResponse['meta']['pagination'] ?? []),
                'debug' => $locationsResponse['debug'] ?? [],
            ];

            $headerMenu = MenuController::getHeaderMenu($locale) ?? [];
            $footerMenu = MenuController::getFooterMenu($locale) ?? [];

            $settings = SettingsController::getSettings($tenantId, $locale) ?? [];
            $forms    = ContactFormController::getForms($locale) ?? [];

            $widgets  = WidgetController::getWidgets($tenantId, $locale) ?? [];
            $maps     = MapController::getMaps($tenantId, $locale) ?? [];
            $sliders  = SliderController::getSliders($tenantId, $locale) ?? [];
            $categories = CategoryController::getCategories($locale) ?? [];

        } catch (\Throwable $e) {
            Log::error("HomeController Error: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

        }

        return Inertia::render('Home', [
            'locale'      => $locale,
            'categories'  => $categories,
            'locations'   => $locations,
            'menus'       => [
                'header' => $headerMenu,
                'footer' => $footerMenu,
            ],
            'settings'    => $settings,
            'forms'       => $forms,
            'widgets'     => $widgets,
            'sliders'     => $sliders,
            'maps'        => $maps,
        ]);
    }
}
