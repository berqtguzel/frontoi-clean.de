<?php

namespace App\Support;

/**
 * Tenant API / OMR ayarları — sadece config() kullanır (config:cache uyumlu).
 */
final class OmrConfig
{
    public static function tenantId(): string
    {
        return (string) (config('services.omr.tenant_id') ?: config('services.omr.tenant_id_fallback'));
    }

    public static function mainTenantId(): ?string
    {
        $m = config('services.omr.main_tenant');

        return ($m !== null && $m !== '') ? (string) $m : null;
    }

    /** API isteklerinde: ana marka tenant’ı varsa o, yoksa site tenant’ı. */
    public static function tenantForSharedContent(): string
    {
        return self::mainTenantId() ?: self::tenantId();
    }

    public static function baseUrl(): string
    {
        return rtrim((string) config('services.omr.base', 'https://omerdogan.de/api'), '/');
    }

    /** 1 veya 2 — tenant API yolu /api/v1 veya /api/v2. */
    public static function apiVersionNumber(): int
    {
        $v = (int) config('services.omr.api_version', 2);

        return $v < 1 ? 1 : ($v > 2 ? 2 : $v);
    }

    public static function apiVersionSegment(): string
    {
        return 'v'.self::apiVersionNumber();
    }

    /** Örn. base https://host/api + v2 + path → https://host/api/v2/menus/header */
    public static function apiUrl(string $path): string
    {
        $path = ltrim($path, '/');

        return self::baseUrl().'/'.self::apiVersionSegment().'/'.$path;
    }

    public static function defaultLocale(): string
    {
        return (string) config('services.omr.default_locale', 'de');
    }
}
