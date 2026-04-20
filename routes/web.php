<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\HomeController;
use App\Http\Controllers\LocationsController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\DynamicSlugController;
use App\Http\Controllers\SitemapController;

/*
|--------------------------------------------------------------------------
| GLOBAL ROUTES
|--------------------------------------------------------------------------
*/

// Kök adres her zaman Almanca (varsayılan dil) — session/cookie ile /en açılmasın
Route::get('/', function () {
    return redirect('/de');
});

// Global sitemap (locale'siz)
Route::get('/sitemap.xml', [SitemapController::class, 'globalIndex']);


/*
|--------------------------------------------------------------------------
| LOCALE GROUP
|--------------------------------------------------------------------------
*/

Route::group([
    'prefix' => '{locale}',

    'where' => ['locale' => '[a-z]{2}'],
    'middleware' => ['applyLocale'],
],function () {

    /*
    |--------------------------------------------------------------------------
    | CORE PAGES
    |--------------------------------------------------------------------------
    */

    Route::get('/', [HomeController::class, 'index'])->name('home');

    Route::get('/standorte', [LocationsController::class, 'index'])
        ->name('locations.index');

    Route::get('/kontakt', [ContactController::class, 'index'])
        ->name('kontakt.index');

    Route::post('/kontakt', [ContactController::class, 'submit'])
        ->name('kontakt.submit');


    /*
    |--------------------------------------------------------------------------
    | SITEMAPS (LOCALE)
    |--------------------------------------------------------------------------
    */

    Route::get('/sitemap.xml', [SitemapController::class, 'index']);
    Route::get('/sitemap-pages.xml', [SitemapController::class, 'pages']);
    Route::get('/sitemap-services.xml', [SitemapController::class, 'services']);
    Route::get('/sitemap-locations.xml', [SitemapController::class, 'locations']);

    Route::get('/sitemap-serviceLocation-{page}.xml', [SitemapController::class, 'serviceLocation'])
        ->whereNumber('page');


    /*
    |--------------------------------------------------------------------------
    | DYNAMIC SLUG (EN SONA!)
    |--------------------------------------------------------------------------
    */

    Route::get('/{slug}', [DynamicSlugController::class, 'handle'])
        ->where('slug', '^(?!kontakt|standorte|sitemap).*') // reserved yolları exclude
        ->name('dynamic.slug');
});


/*
|--------------------------------------------------------------------------
| FALLBACK
|--------------------------------------------------------------------------
*/

Route::fallback(function () {
    return Inertia::render('Errors/NotFound')
        ->toResponse(request())
        ->setStatusCode(404);
});
