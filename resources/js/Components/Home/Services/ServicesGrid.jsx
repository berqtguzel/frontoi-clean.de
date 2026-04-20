import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { usePage } from "@inertiajs/react";
import ServiceCard from "./ServiceCard";
import SafeHtml from "@/Components/Common/SafeHtml";
import "../../../../css/ServicesGrid.css";

const ServicesGrid = () => {
    const { t } = useTranslation();
    const { props } = usePage();

    const locale = (props?.locale || "de").toLowerCase();
    const lang = locale.split("-")[0];
    const content = props?.content || {};
    const categories = props.categories || [];

    return (
        <section id="services" className="services-section">
            <div className="services-container">
                <h2 className="services-title">
                    <SafeHtml
                        html={content.services_title || t("servicesList.title")}
                    />
                </h2>

                <div className="services-grid">
                    {categories.map((cat) => {
                        const translations = cat?.translations || [];

                        const tr =
                            translations.find((x) =>
                                String(x.language_code)
                                    .toLowerCase()
                                    .startsWith(lang),
                            ) ||
                            translations.find(
                                (x) =>
                                    String(x.language_code).toLowerCase() ===
                                    "de",
                            ) ||
                            translations[0] ||
                            cat;

                        const name = tr?.name || cat.name || "Service";

                        return (
                            <ServiceCard
                                key={cat.id}
                                title={name}
                                image={cat.image}
                                slug={cat.slug}
                                translations={translations}
                            />
                        );
                    })}

                    {!categories.length && (
                        <div className="no-services-message">
                            {t("servicesList.no_services")}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default memo(ServicesGrid);
