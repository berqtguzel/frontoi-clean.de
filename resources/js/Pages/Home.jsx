import React, { lazy, Suspense } from "react";
import { Head, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import HeroSection from "@/Components/Home/HeroSection";
import Loading from "@/Components/Common/Loading";
import ServiceCategories from "@/Components/Home/Services/ServiceCategories";

const ServicesGrid = lazy(
    () => import("@/Components/Home/Services/ServicesGrid"),
);
const LocationsGrid = lazy(
    () => import("@/Components/Home/Locations/LocationsGrid"),
);
const ContactSection = lazy(
    () => import("@/Components/Home/Contact/ContactSection"),
);

export default function Home({
    content,
    locations = [],
    categories = [],
    currentRoute,
    settings,
}) {
    const { props } = usePage();
    const global = props.global || {};
    const locale = props.locale || "de";

    const seo = props.settings?.seo || {};

    const title = seo.meta_title || "OI-CLEAN Gebäudereinigung";
    const description = seo.meta_description || "";
    const keywords = seo.meta_keywords || "";
    const ogTitle = seo.og_title || title;
    const ogDesc = seo.og_description || description;
    const ogImage = seo.og_image || "/og-default.jpg";

    const isClient = typeof window !== "undefined";
    const canonicalUrl = isClient
        ? window.location.origin + ``
        : `https://oiclean.de/${locale}`;

    const languages = props.languages || [
        { code: "de" },
        { code: "en" },
        { code: "tr" },
    ];

    return (
        <AppLayout content={content} currentRoute={currentRoute}>
            <Head>
                <title>{title}</title>

                <meta name="description" content={description} />
                {keywords && <meta name="keywords" content={keywords} />}

                <link rel="canonical" href={canonicalUrl} />

                {languages.map((lang) => (
                    <link
                        key={lang.code}
                        rel="alternate"
                        hreflang={lang.code}
                        href={
                            isClient
                                ? `${window.location.origin}/${lang.code}`
                                : `https://oiclean.de/${lang.code}`
                        }
                    />
                ))}
                <link
                    rel="alternate"
                    hreflang="x-default"
                    href={canonicalUrl}
                />

                <meta property="og:type" content="website" />
                <meta property="og:title" content={ogTitle} />
                <meta property="og:description" content={ogDesc} />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:image" content={ogImage} />

                {/* TWITTER */}
                <meta name="twitter:card" content="summary_large_image" />
            </Head>

            {/* PAGE SECTIONS */}
            <HeroSection sliders={props.sliders} />
            <ServiceCategories />

            <Suspense fallback={<Loading />}>
                <ServicesGrid categories={categories} />
            </Suspense>

            <Suspense fallback={<Loading />}>
                <LocationsGrid
                    locations={locations?.data || []}
                    meta={locations?.meta || {}}
                />
            </Suspense>

            <Suspense fallback={<Loading />}>
                <ContactSection settings={settings} />
            </Suspense>
        </AppLayout>
    );
}
