<?php

namespace App\Http\Controllers;

use App\Support\OmrConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
class ContactFormController extends Controller
{
    public static function getForms(string $locale = 'de')
    {
        $mainTenant = OmrConfig::tenantForSharedContent();

        $cacheKey = "contact_forms_{$mainTenant}_{$locale}";

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($mainTenant, $locale) {
            try {
                $response = Http::withoutVerifying()
                    ->timeout(3)
                    ->connectTimeout(2)
                    ->withHeaders([
                        'Accept' => 'application/json',
                        'X-Tenant-ID' => $mainTenant,
                    ])
                    ->get(OmrConfig::apiUrl('contact/forms'), [
                        'tenant' => $mainTenant,
                        'locale' => $locale,
                    ]);

                if (!$response->successful()) {
                    Log::warning('ContactForms API error', [
                        'status' => $response->status(),
                        'body' => $response->body(),
                    ]);
                    return collect();
                }

                $data = $response->json()['data'] ?? [];

                return collect($data)->map(fn($form, $index) => [
                    'id' => $form['id'] ?? $index,
                    'name' => $form['name'] ?? "Form #{$index}",
                    'fields' => collect($form['fields'] ?? [])->map(function ($f, $idx) {
                        return [
                            'id' => $f['id'] ?? $idx,
                            'name' => $f['name'] ?? "field_{$idx}",
                            'label' => $f['label'] ?? "Field",
                            'type' => strtolower($f['type'] ?? 'text'),
                            'required' => !empty($f['required']),
                            'placeholder' => $f['placeholder'] ?? '',
                            'options' => $f['options'] ?? [],
                        ];
                    }),
                ]);
            } catch (\Throwable $e) {
                Log::error("ContactForms Fetch Error: " . $e->getMessage());
                return collect();
            }
        });
    }

    public function submit(Request $request, $id)
    {
        $locale = $request->input('locale', 'de');
        $mainTenant = OmrConfig::tenantForSharedContent();

        try {
            $url = OmrConfig::apiUrl("contact/forms/{$id}/submit");

            $response = Http::withoutVerifying()
                ->timeout(3)
                ->connectTimeout(2)
                ->withHeaders([
                    'Accept' => 'application/json',
                    'X-Tenant-ID' => $mainTenant,
                ])
                ->post($url, [
                    'tenant' => $mainTenant,
                    'locale' => $locale,
                    "name" => $request->input("name"),
                    "phone" => $request->input("phone"),
                    "email" => $request->input("email"),
                    "message" => $request->input("message"),
                ]);
            $json = $response->json() ?? [];


            if ($response->status() === 422) {
                return response()->json([
                    "message" => $json["message"] ?? "Validation failed",
                    "errors" => $json["errors"] ?? $json,
                ], 422);
            }

            return response()->json($json, $response->status());

        } catch (\Throwable $e) {
            Log::error("Contact Submit Error: " . $e->getMessage());
            return response()->json([
                "error" => "Submit failed",
                "debug" => app()->environment('local') ? $e->getMessage() : null
            ], 500);
        }
    }
}
