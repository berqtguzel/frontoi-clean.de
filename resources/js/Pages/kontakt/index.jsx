import React, { useMemo, useState, useEffect } from "react";
import { Head, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import ContactSection from "@/Components/Home/Contact/ContactSection";
import ContactMap from "@/Components/Contact/ContactMaps";
import { useTranslation } from "react-i18next";
import { FaPhone, FaEnvelope } from "react-icons/fa";
import "../../../css/ContactLocations.css";

export default function ContactIndex({ currentRoute = "kontakt" }) {
    const { props } = usePage();
    const { t } = useTranslation();

    const global = props.global || {};
    const settings = props.settings || [];
    const contactInfos =
        settings.contact_infos || settings.contact?.contact_infos || [];

    const [activeMapId, setActiveMapId] = useState(null);
    const isMobile = typeof window !== "undefined" && window.innerWidth <= 1024;

    const isMapActive = (locId) => activeMapId === locId;

    return (
        <AppLayout currentRoute={currentRoute}>
            <Head>
                <title>{t("contact.title", "Kontakt")}</title>
            </Head>

            <section className="contactx-page-wrapper">
                <section className="contactx-intro contactx-page-intro">
                    <h1 className="contactx-title">
                        {t("contact.title", "Kontakt")}
                    </h1>
                </section>

                <ContactSection />

                <section className="contactx-locations-wrapper">
                    <div className="max-w-7xl mx-auto px-4">
                        <h2 className="contactx-section-title">
                            {t(
                                "contact.locations_title",
                                "Standorte & Kontakt",
                            )}
                        </h2>

                        {contactInfos.map((loc) => (
                            <article
                                key={loc.id}
                                className="contactx-location-row"
                            >
                                <div className="contactx-card">
                                    <h3 className="contactx-card__title">
                                        {loc.title}
                                    </h3>

                                    <div className="contactx-card__address">
                                        <div>{loc.address}</div>
                                        <div>
                                            {loc.postal_code} {loc.city},{" "}
                                            {loc.country}
                                        </div>
                                    </div>

                                    {loc.phone && (
                                        <div className="contactx-card__row">
                                            <FaPhone size={14} />
                                            <a href={`tel:${loc.phone}`}>
                                                {loc.phone}
                                            </a>
                                        </div>
                                    )}

                                    {loc.email && (
                                        <div className="contactx-card__row">
                                            <FaEnvelope size={14} />
                                            <a href={`mailto:${loc.email}`}>
                                                {loc.email}
                                            </a>
                                        </div>
                                    )}

                                    {isMobile && (
                                        <button
                                            className={`contactx-map-toggle-btn ${
                                                isMapActive(loc.id)
                                                    ? "is-active"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                setActiveMapId(
                                                    isMapActive(loc.id)
                                                        ? null
                                                        : loc.id,
                                                )
                                            }
                                        >
                                            {isMapActive(loc.id)
                                                ? t("map.close")
                                                : t("map.show")}
                                        </button>
                                    )}
                                </div>

                                {(!isMobile || isMapActive(loc.id)) && (
                                    <section className="contactx-map-item">
                                        <ContactMap
                                            query={`${loc.address}, ${loc.postal_code} ${loc.city}, ${loc.country}`}
                                            zoom={15}
                                            title={loc.title}
                                        />
                                    </section>
                                )}
                            </article>
                        ))}
                    </div>
                </section>
            </section>
        </AppLayout>
    );
}
