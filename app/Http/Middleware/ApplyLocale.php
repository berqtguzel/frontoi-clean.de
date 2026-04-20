<?php

namespace App\Http\Middleware;

use App\Support\OmrConfig;
use Closure;
use App\Http\Controllers\LanguagesController;

class ApplyLocale
{
    public function handle($request, Closure $next)
{
    $locale = $request->route('locale')
        ?? session('locale', config('app.locale', 'de'));

    $tenantId = OmrConfig::mainTenantId() ?: OmrConfig::tenantId();

    $availableLocales = ['de', 'en', 'tr']; // fallback

    try {
        $data = LanguagesController::getLanguages($tenantId, 'de');

        if (!empty($data['languages'])) {
            $availableLocales = collect($data['languages'])
                ->pluck('code')
                ->map(fn($l) => strtolower($l))
                ->toArray();
        }

    } catch (\Throwable $e) {
        \Log::error('Locale error: ' . $e->getMessage());
    }

    if (!in_array(strtolower($locale), $availableLocales)) {
        abort(404);
    }

    app()->setLocale($locale);
    session(['locale' => $locale]);

    return $next($request);
}
}
