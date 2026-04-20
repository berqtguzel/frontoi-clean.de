import React, { useEffect, useMemo, useState } from "react";
import { Head, usePage } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import AppLayout from "@/Layouts/AppLayout";
import ContactSection from "@/Components/Home/Contact/ContactSection";
import ServiceCard from "@/Components/Home/Services/ServiceCard";
import "../../../css/location-show.css";
import LiquidEther from "@/Components/ReactBits/Backgrounds/LiquidEther";

export default function LocationShow() {
    const { props } = usePage();
    const { t, i18n } = useTranslation();

    const locale = props?.locale?.toLowerCase() || "de";
    const primaryService = props?.primaryService || {};
    const services = props?.services || [];

    // Dil güncellemesi
    useEffect(() => {
        if (i18n.language !== locale) i18n.changeLanguage(locale);
    }, [locale, i18n]);

    // Şehir adı — sadece primaryService üzerinden alınır
    const cityName = primaryService.city;

    // Çeviri bilgisi
    const tr =
        primaryService?.translations?.find((t) => t.language_code === locale) ||
        primaryService?.translations?.[0];

    // Bu şehirde ana kategori mi?
    const isBuildingCleaning =
        primaryService?.category_slug === "gebaudereinigung";

    // SEO Title Mantığı
    const pageTitle = isBuildingCleaning
        ? locale === "de"
            ? `Gebäudereinigung in ${cityName}`
            : locale === "en"
              ? `Building Cleaning in ${cityName}`
              : `Gebäudereinigung in ${cityName}`
        : tr?.name || `${primaryService?.name ?? ""} in ${cityName}`;

    const pageContent =
        tr?.content || `<p>Professionelle Gebäudereinigung in ${cityName}.</p>`;

    const heroImage =
        primaryService?.image ||
        "https://images.unsplash.com/photo-1581578731117-e0a820bd4928?w=1920&auto=format&fit=crop";

    const seoDescription =
        tr?.description || pageContent.replace(/<[^>]+>/g, "").slice(0, 160);

    // Kartlar — diğer servisler alfabetik
    const servicesSorted = useMemo(
        () =>
            [...services].sort((a, b) =>
                (a.name || "").localeCompare(b.name || "", locale, {
                    sensitivity: "base",
                }),
            ),
        [services, locale],
    );

    const [etherColors, setEtherColors] = useState([
        "#5227FF",
        "#FF9FFC",
        "#B19EEF",
    ]);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const root = document.documentElement;
        const primary =
            root.style.getPropertyValue("--site-primary-color") ||
            getComputedStyle(root).getPropertyValue("--site-primary-color");
        const accent =
            root.style.getPropertyValue("--site-accent-color") ||
            getComputedStyle(root).getPropertyValue("--site-accent-color");
        const secondary =
            root.style.getPropertyValue("--site-secondary-color") ||
            getComputedStyle(root).getPropertyValue("--site-secondary-color");

        const cleaned = [primary, accent, secondary]
            .map((c) => (c || "").trim())
            .filter(Boolean);

        if (cleaned.length === 3) {
            setEtherColors(cleaned);
        }
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const mq = window.matchMedia("(max-width: 768px)");
        const handler = () => setIsMobile(mq.matches);
        handler();
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    return (
        <AppLayout key={`location-${primaryService?.id || "show"}`}>
            <Head>
                <title>{pageTitle}</title>
                <meta name="description" content={seoDescription} />
            </Head>

            <motion.section
                className="locx-hero"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7 }}
            >
                <div className="locx-hero__media">
                    <img
                        width={2550}
                        height={700}
                        src={heroImage}
                        alt={pageTitle}
                        className="locx-hero__img"
                    />
                    <div className="locx-hero__overlay" />
                    <motion.div
                        className="locx-hero__content"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="locx-title">{pageTitle}</h1>
                    </motion.div>
                </div>
            </motion.section>

            <motion.section
                className="locx-content"
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
            >
                <div className="container">
                    <h2 className="locx-city-title">{cityName}</h2>
                    <div
                        className="locx-content-html"
                        dangerouslySetInnerHTML={{ __html: pageContent }}
                    />
                </div>
            </motion.section>

            {servicesSorted.length > 0 && (
                <section className="locx-services locx-services-ether">
                    {!isMobile && (
                        <LiquidEther
                            className="locx-liquid-bg"
                            colors={etherColors}
                            mouseForce={12}
                            cursorSize={90}
                            resolution={0.28}
                            autoDemo={true}
                            autoSpeed={0.28}
                            autoIntensity={1.35}
                            autoResumeDelay={1500}
                            autoRampDuration={0.5}
                            BFECC={false}
                            isViscous={false}
                            iterationsPoisson={18}
                        />
                    )}

                    <div className="container">
                        <div className="locx-services__header">
                            <h2 className="locx-services__title">
                                {cityName}
                                {t(
                                    "locationShow.services_title_suffix",
                                    "Temizlik Hizmetleri",
                                )}
                            </h2>
                        </div>

                        <motion.div
                            className="locx-services__grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8 }}
                        >
                            {servicesSorted.map((s, i) => (
                                <motion.div
                                    key={s.id}
                                    initial={{ opacity: 0, y: 40 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 * i }}
                                >
                                    <ServiceCard {...s} />
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>
            )}

            <ContactSection />
        </AppLayout>
    );
}
