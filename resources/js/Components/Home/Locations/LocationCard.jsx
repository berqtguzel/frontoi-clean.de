import React, { memo, useRef } from "react";
import { Link, usePage } from "@inertiajs/react";
import "../../../../css/LocationCard.css";
import { useTranslation } from "react-i18next";

const LocationCard = memo(({ location, onHover, isActive }) => {
    const { props } = usePage();
    const locale = (props?.locale || "de").toLowerCase();
    const { t } = useTranslation();

    const imgRef = useRef(null);

    const imageSrc = location.image || "/images/default-city.webp";

    const firstService = location.services?.[0] ?? null;
    const translations = firstService?.translations ?? [];

    const activeTranslation =
        translations.find((tr) => tr.language_code === locale) ||
        translations.find((tr) => tr.language_code === "de") ||
        translations[0] ||
        null;

    const cityTitle =
        activeTranslation?.name ||
        firstService?.meta_title ||
        firstService?.name ||
        location.city ||
        "";

    const href = `/${locale}/${location.slug}`;

    return (
        <Link
            href={href}
            className={`location-card ${isActive ? "active" : ""}`}
            onMouseEnter={onHover}
        >
            <div className="location-card-media">
                <img
                    ref={imgRef}
                    src={imageSrc}
                    alt={cityTitle}
                    width={400}
                    height={300}
                    loading="eager"
                    fetchpriority="high"
                    decoding="async"
                    className="location-card-image"
                />
            </div>

            <div className="location-card-content">
                <div className="location-card-overlay">
                    <h2 className="location-card-title">{cityTitle}</h2>
                </div>

                <div className="location-card-footer">
                    <span className="location-card-button">
                        <span>
                            {t("locations.card.cta") || "Mehr erfahren"}
                        </span>
                        <svg
                            className="location-card-arrow"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <path
                                d="M5 12H19M19 12L12 5M19 12L12 19"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </span>
                </div>
            </div>
        </Link>
    );
});

LocationCard.displayName = "LocationCard";
export default LocationCard;
