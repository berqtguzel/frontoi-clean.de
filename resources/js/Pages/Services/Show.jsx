import React, { useEffect, useState, useMemo } from "react";
import { Head, usePage } from "@inertiajs/react";
import { motion } from "framer-motion";
import AppLayout from "@/Layouts/AppLayout";
import SafeHtml from "@/Components/Common/SafeHtml";
import "../../../css/service-show.css";
import ServiceCard from "@/Components/Home/Services/ServiceCard";
import LiquidEther from "@/Components/ReactBits/Backgrounds/LiquidEther";

const truncate = (text = "", max = 160) =>
    String(text || "")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max);

const normalizeCity = (v) =>
    String(v || "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

const normalizeLang = (lang) =>
    String(lang || "")
        .toLowerCase()
        .split("-")[0]
        .trim();

const unwrapResource = (value) => {
    if (!value) return null;
    if (value.data && typeof value.data === "object") return value.data;
    return value;
};

const getTranslations = (item) =>
    Array.isArray(item?.translations) ? item.translations : [];

const getActiveTranslation = (item, locale, fallbackLocale = "en") => {
    const translations = getTranslations(item);
    const current = normalizeLang(locale);
    const fallback = normalizeLang(fallbackLocale);

    return (
        translations.find(
            (tr) => normalizeLang(tr?.language_code) === current,
        ) ||
        translations.find(
            (tr) => normalizeLang(tr?.language_code) === fallback,
        ) ||
        translations[0] ||
        {}
    );
};

const getServiceTitle = (item, locale) => {
    const entity = unwrapResource(item);
    const tr = getActiveTranslation(
        entity,
        locale,
        entity?._meta?.default_language || "en",
    );

    return (
        tr?.name ||
        tr?.title ||
        entity?.name ||
        entity?.title ||
        entity?.slug ||
        "Service"
    );
};

const getServiceDescription = (item, locale) => {
    const entity = unwrapResource(item);
    const tr = getActiveTranslation(
        entity,
        locale,
        entity?._meta?.default_language || "en",
    );

    return (
        tr?.content ||
        tr?.description ||
        entity?.content ||
        entity?.description ||
        entity?.short_description ||
        ""
    );
};

const getServiceShortDescription = (item, locale) => {
    const entity = unwrapResource(item);
    const tr = getActiveTranslation(
        entity,
        locale,
        entity?._meta?.default_language || "en",
    );

    return (
        tr?.short_description ||
        entity?.short_description ||
        truncate(getServiceDescription(entity, locale), 140)
    );
};

const getCategoryName = (item, locale) => {
    const entity = unwrapResource(item);
    const tr = getActiveTranslation(
        entity,
        locale,
        entity?._meta?.default_language || "en",
    );

    return tr?.name || entity?.name || entity?.title || "";
};

export default function ServiceShow() {
    const { props } = usePage();

    const rawService = props.service ?? null;
    const rawCategory = props.category ?? null;
    const rawRelated = Array.isArray(props.services) ? props.services : [];

    const service = unwrapResource(rawService);
    const category = unwrapResource(rawCategory);
    const related = rawRelated
        .map((item) => unwrapResource(item))
        .filter(Boolean);

    const locale =
        props.locale ||
        service?._meta?.current_language ||
        service?._meta?.default_language ||
        "de";

    const appName = props.global?.appName || "Site";

    const envCity = normalizeCity(import.meta.env.VITE_TENANT_CITY || "");

    const [etherColors, setEtherColors] = useState([
        "#5227FF",
        "#FF9FFC",
        "#B19EEF",
    ]);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const root = document.documentElement;
        const primary = getComputedStyle(root).getPropertyValue(
            "--site-primary-color",
        );
        const accent = getComputedStyle(root).getPropertyValue(
            "--site-accent-color",
        );
        const secondary = getComputedStyle(root).getPropertyValue(
            "--site-secondary-color",
        );

        const cleaned = [primary, accent, secondary]
            .map((c) => (c || "").trim())
            .filter(Boolean);

        if (cleaned.length === 3) setEtherColors(cleaned);
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const mq = window.matchMedia("(max-width: 768px)");
        const handler = () => setIsMobile(mq.matches);
        handler();

        if (mq.addEventListener) {
            mq.addEventListener("change", handler);
            return () => mq.removeEventListener("change", handler);
        }

        mq.addListener(handler);
        return () => mq.removeListener(handler);
    }, []);

    const filteredRelated = useMemo(() => {
        if (!envCity) return related;

        return related.filter((srv) => normalizeCity(srv?.city) === envCity);
    }, [related, envCity]);

    if (!service) {
        return (
            <section className="service-show__loading">
                <div className="service-show__spinner" />
                <p>Service not found.</p>
            </section>
        );
    }

    const activeTr = getActiveTranslation(
        service,
        locale,
        service?._meta?.default_language || "en",
    );

    const title = getServiceTitle(service, locale);

    const description = getServiceDescription(service, locale);

    const shortDescription = getServiceShortDescription(service, locale);

    const categoryName = getCategoryName(category, locale);

    const image =
        service?.image ||
        "https://images.unsplash.com/photo-1581578731117-e0a820bd4928?q=80&w=1920&auto=format&fit=crop";

    const seoTitle =
        service?.meta_title || activeTr?.meta_title || `${title} - ${appName}`;

    const seoDescription =
        service?.meta_description ||
        activeTr?.meta_description ||
        shortDescription ||
        truncate(description);

    const slug = service?.slug || "";
    const canonicalUrl = `/${locale}/${slug}`;

    return (
        <AppLayout>
            <Head>
                <title>{seoTitle}</title>
                <meta name="description" content={seoDescription} />
                <link rel="canonical" href={canonicalUrl} />

                <meta property="og:type" content="website" />
                <meta property="og:title" content={seoTitle} />
                <meta property="og:description" content={seoDescription} />
                <meta property="og:url" content={canonicalUrl} />
                {image && <meta property="og:image" content={image} />}

                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={seoTitle} />
                <meta name="twitter:description" content={seoDescription} />
                {image && <meta name="twitter:image" content={image} />}
            </Head>

            {filteredRelated.length > 0 && !isMobile && (
                <LiquidEther
                    className="related-liquid-fixed"
                    colors={etherColors}
                    mouseForce={16}
                    cursorSize={100}
                    resolution={0.32}
                    autoDemo
                    autoSpeed={0.28}
                    autoIntensity={1.2}
                    BFECC={false}
                    isViscous={false}
                />
            )}

            <motion.section
                className="service-show__hero"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
            >
                <div className="service-show__hero-media">
                    <img
                        src={image}
                        width={2500}
                        height={700}
                        alt={title}
                        className="service-show__hero-img"
                    />
                    <div className="service-show__hero-overlay" />
                </div>

                <motion.div
                    className="service-show__hero-content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    {categoryName && (
                        <p className="service-show__badge">{categoryName}</p>
                    )}

                    <h1 className="service-show__title">{title}</h1>
                </motion.div>
            </motion.section>

            {description && (
                <motion.section
                    className="service-show__content fade-up"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                >
                    <div className="service-show__content-inner service-show__content-grid">
                        <article className="service-show__prose">
                            <SafeHtml html={description} />
                        </article>

                        <aside className="service-show__side-media">
                            <div className="service-show__side-card">
                                <img
                                    width={450}
                                    height={340}
                                    src={image}
                                    alt={title}
                                    className="service-show__side-img"
                                />
                            </div>
                        </aside>
                    </div>
                </motion.section>
            )}

            {filteredRelated.length > 0 && (
                <section className="service-show__related container">
                    <div className="service-show__grid">
                        {filteredRelated.map((srv, index) => (
                            <motion.div
                                key={
                                    srv?.id ??
                                    `${index}-${srv?.slug || "service"}`
                                }
                                initial={{ opacity: 0, y: 25 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.45,
                                    delay: index * 0.05,
                                }}
                            >
                                <ServiceCard
                                    title={getServiceTitle(srv, locale)}
                                    image={srv?.image}
                                    slug={srv?.slug}
                                    translations={srv?.translations}
                                />
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}
        </AppLayout>
    );
}
