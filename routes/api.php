<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\ContactFormController;
use App\Http\Controllers\WidgetController;

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::get('/locations', function (Request $request) {
    $locale = session('locale', env('OMR_DEFAULT_LOCALE', 'de'));
    $page   = (int) $request->query('page', 1);
    $limit  = 20;

    $response = LocationController::getLocations($locale, $page, $limit);

    return response()->json([
        'data' => $response['data'] ?? [],
        'meta' => $response['meta'] ?? [],
    ]);
});
Route::post('/contact/forms/{id}/submit', [ContactFormController::class, 'submit']);

Route::get('/widgets', [WidgetController::class, 'index']);
