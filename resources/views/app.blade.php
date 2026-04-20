@php
    $inertiaLocale = $page['props']['locale'] ?? ($page['props']['global']['locale'] ?? null);
    $htmlLocale = $inertiaLocale ?: app()->getLocale();
@endphp
<!DOCTYPE html>
<html lang="{{ $htmlLocale }}"
      data-locale="{{ $htmlLocale }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    {{-- Performance DNS Prefetch --}}
    <link rel="dns-prefetch" href="https://omerdogan.de">
    <link rel="preconnect" href="https://omerdogan.de" crossorigin>
    <link rel="dns-prefetch" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

    {{-- Preload OG Image --}}
    @if(isset($meta['ogImage']) && $meta['ogImage'])
        <link rel="preload" as="image" href="{{ $finalOgImage }}" fetchpriority="high" type="image/webp">
    @endif



    {{-- Vite --}}
    @viteReactRefresh
    @vite([
        'resources/css/app.css',
        'resources/js/app.jsx',
    ])

    @php
        use Illuminate\Support\Str;

        $props = $page['props'] ?? [];
        $global = $props['global'] ?? [];
        $locale = $props['locale'] ?? ($global['locale'] ?? app()->getLocale());
        $settings = $global['settings'] ?? [];
        $general = $settings['general'] ?? [];
        $seo = $settings['seo'] ?? [];

        $siteName = $general['site_name'] ?? config('app.name');

        $currentUrl = url()->current();

        $meta = [
            'title' => $seo['meta_title'] ?? $siteName,
            'description' => $seo['meta_description'] ?? '',
            'keywords' => $seo['meta_keywords'] ?? '',
            'canonicalUrl' => $currentUrl,
            'ogImage' => $seo['og_image'] ?? asset('og-default.jpg'),
        ];

        $finalTitle = Str::limit(strip_tags($meta['title']), 60);
        $finalDesc = Str::limit(strip_tags($meta['description']), 160);
        $finalKeywords = $meta['keywords'] ?? '';
        $canonicalUrl = $meta['canonicalUrl'] ?? $currentUrl;
        $finalOgImage = $meta['ogImage'] ?? asset('og-default.jpg');

        // Çoklu dil ayarları
        $languages = $global['languages'] ?? [
            ['code' => 'de'],
            ['code' => 'en'],
            ['code' => 'tr'],
        ];

        $slug = $props['slug'] ?? request()->path();
        if (Str::startsWith($slug, "$locale/")) {
            $slug = substr($slug, strlen("$locale/"));
        }
    @endphp

    {{-- SEO Meta --}}
    <title inertia>{{ $finalTitle }}</title>
    <meta name="description" content="{{ $finalDesc }}" inertia>

    @if($finalKeywords)
        <meta name="keywords" content="{{ $finalKeywords }}" inertia>
    @endif

    <link rel="canonical" href="{{ $canonicalUrl }}" inertia>

    <meta property="og:type" content="website" inertia>
    <meta property="og:site_name" content="{{ $siteName }}" inertia>
    <meta property="og:title" content="{{ $finalTitle }}" inertia>
    <meta property="og:description" content="{{ $finalDesc }}" inertia>
    <meta property="og:url" content="{{ $canonicalUrl }}" inertia>
    <meta property="og:image" content="{{ $finalOgImage }}" inertia>

    <meta name="twitter:card" content="summary_large_image" inertia>

    {{-- SEO Çoklu Dilde Hreflang --}}
    @foreach($languages as $lang)
        <link rel="alternate"
              hreflang="{{ $lang['code'] }}"
              href="{{ url($lang['code'].'/'.$slug) }}" />
    @endforeach

    <link rel="alternate" hreflang="x-default" href="{{ $canonicalUrl }}" />

    @inertiaHead
</head>

<body class="font-sans antialiased bg-white">
    @inertia
</body>
</html>
