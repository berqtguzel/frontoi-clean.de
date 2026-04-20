<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SetLocaleFromUrl
{
    public function handle(Request $request, Closure $next)
    {
        $locale = $request->route('locale');

        if (!in_array($locale, ['de', 'en', 'tr'])) {
            $locale = 'de';
        }


        session(['locale' => $locale]);

        return $next($request);
    }
}
