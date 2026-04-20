import React, { memo, useState, useEffect, useMemo } from "react";
import { Head, usePage } from "@inertiajs/react";
import "../../../../css/LocationsGrid.css";
import { useTranslation } from "react-i18next";
import GermanyMap from "./GermanyMap";
import LocationCard from "./LocationCard";
import LiquidEther from "@/Components/ReactBits/Backgrounds/LiquidEther";

const norm = (v) =>
    String(v ?? "")
        .trim()
        .toLowerCase();

const LocationsGrid = memo(() => {
    const { t } = useTranslation();
    const { props } = usePage();

    const allLocations = props.locations?.data || [];
    const locale = props?.locale || "de";

    const maps = props.maps ?? {};
    const markers = maps.markers ?? [];

    // Maps.markers zaten VITE_TENANT_DISTRICT'e göre filtrelenmiş durumda
    // Marker'lardan city listesini çıkarıp locations'ı ona göre filtrele
    const filteredLocations = useMemo(() => {
        // Eğer marker yoksa tüm lokasyonları göster
        if (!markers || markers.length === 0) return allLocations;

        // Marker'lardan city listesini çıkar (normalize edilmiş)
        const markerCities = new Set(
            markers
                .map((m) => m.name || m.city)
                .filter(Boolean)
                .map((city) => norm(city))
        );

        // Locations'ı marker'lardaki city'lere göre filtrele
        return allLocations.filter((loc) => {
            const cityValue = loc?.city ?? loc?.location?.city ?? loc?.address?.city;
            return markerCities.has(norm(cityValue));
        });
    }, [allLocations, markers]);

    const [etherColors, setEtherColors] = useState([]);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const css = getComputedStyle(document.documentElement);

        const primary = css.getPropertyValue("--site-primary-color").trim();
        const accent = css.getPropertyValue("--site-accent-color").trim();
        const secondary = css.getPropertyValue("--site-secondary-color").trim();

        const cleaned = [primary, accent, secondary].filter(Boolean);

        if (cleaned.length === 3) setEtherColors(cleaned);
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
        <section id="locations" className="locations-section">
            <Head>
                <meta name="description" content={t("locations.description")} />
            </Head>

            {!isMobile && etherColors.length === 3 && (
                <LiquidEther
                    className="locations-liquid"
                    colors={etherColors}
                    mouseForce={12}
                    cursorSize={90}
                    resolution={0.24}
                    autoDemo={false}
                    autoSpeed={0.22}
                    autoIntensity={1.1}
                    autoResumeDelay={1500}
                    autoRampDuration={0.5}
                    BFECC={false}
                    isViscous={false}
                    iterationsPoisson={14}
                />
            )}

            <div className="locations-container">
                <h1 className="locations-title">{t("locations.title")}</h1>

                <GermanyMap locations={filteredLocations} />

                <div className="locations-grid">
                    {filteredLocations.map((loc) => (
                        <LocationCard key={loc.slug} location={loc} />
                    ))}
                </div>

                {filteredLocations.length === 0 && (
                    <p>{t("locations.empty")}</p>
                )}
            </div>
        </section>
    );
});

export default LocationsGrid;
