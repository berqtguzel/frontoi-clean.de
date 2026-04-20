<?php

namespace App\Providers;

use App\Support\OmrConfig;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\ContactFormController;
use App\Http\Controllers\LanguagesController;
use App\Http\Controllers\GlobalWebsiteController;

class AppServiceProvider extends ServiceProvider
{
   public function boot(): void
{
    Inertia::share('global', function () {

        $locale = session('locale', OmrConfig::defaultLocale());
        $tenantId = OmrConfig::tenantId();


        $defaults = [
            'site_primary_color' => '#0d6efd',
            'site_secondary_color' => '#6c757d',
            'site_accent_color' => '#f59e0b',
            'button_color' => '#0d6efd',
            'text_color' => '#111827',
            'background_color' => '#ffffff',
        ];


        try {
            $settings = SettingsController::getSettings($tenantId, $locale) ?? [];
            $colors = $settings['colors'] ?? [];
            $mergedColors = array_merge($defaults, $colors);
            $settings['colors'] = $mergedColors;
        } catch (\Throwable $e) {
            $settings = ['colors' => $defaults];
            $mergedColors = $defaults;
        }

        try {
            $headerMenu = MenuController::getHeaderMenu($locale) ?? [];
            $footerMenu = MenuController::getFooterMenu($locale) ?? [];
        } catch (\Throwable $e) {
            $headerMenu = [];
            $footerMenu = [];
        }


            try {
                $langData = LanguagesController::getLanguages($tenantId, $locale) ?? [];
                $languages = $langData['languages'] ?? [];
                $defaultLang = $langData['defaultCode'] ?? $locale;
            } catch (\Throwable $e) {
                $languages = [];
                $defaultLang = $locale;
            }


        try {
            $forms = ContactFormController::getForms($locale) ?? [];
        } catch (\Throwable $e) {
            $forms = [];
        }


        try {
            $websites = GlobalWebsiteController::getGlobalWebsites() ?? [];
        } catch (\Throwable $e) {
            $websites = [];
        }


        return [
            'tenantId' => $tenantId,
            'locale' => $locale,
            'settings' => $settings,
            'colors' => $mergedColors,
            'languages' => $languages,
            'defaultLang' => $defaultLang,
            'menus' => [
                'header' => $headerMenu,
                'footer' => $footerMenu,
            ],
            'forms' => $forms,
            'websites' => $websites,
        ];
    });
}

}
