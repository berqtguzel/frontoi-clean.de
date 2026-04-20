<?php

use App\Support\OmrConfig;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

if (!function_exists('trackConversion')) {


    function trackConversion(string $type, float $value, string $url, array $data = []): void
    {
        try {
            $tenantId = OmrConfig::tenantId();

            Http::withoutVerifying()->withHeaders([
                'X-Tenant-ID' => $tenantId,
            ])->post(OmrConfig::apiUrl('analytics/track-conversion'), [
                        'tenant_id' => $tenantId,
                        'type' => $type,
                        'value' => $value,
                        'url' => $url,
                        'timestamp' => now()->toISOString(),
                        'data' => $data,
                    ]);
        } catch (\Throwable $e) {
            Log::warning('Conversion tracking failed: ' . $e->getMessage());
        }
    }
}
