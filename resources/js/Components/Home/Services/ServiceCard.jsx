import React, { useEffect, useRef, useState, memo } from "react";
import { Link } from "@inertiajs/react";
import "../../../../css/ServiceCard.css";
import SafeHtml from "@/Components/Common/SafeHtml";
import { useTranslation } from "react-i18next";
import { getCachedImageUrl, loadAndCacheImage } from "@/utils/imageCache";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const FALLBACK_IMAGE = "/images/Wohnungsrenovierung.jpg";

function normalizeUrl(url) {
    if (!url) return null;
    return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

const ServiceCard = memo(({ title, image, slug, translations = [] }) => {
    const { t, i18n } = useTranslation();

    const lang = (i18n.language || "de").split("-")[0].toLowerCase();
    const localePrefix = `/${lang}`;

    const tr =
        translations.find(
            (x) => (x.language_code || "").toLowerCase() === lang
        ) || {};

    const displayTitle = tr.title || tr.name || title || slug || "Service";

    const finalImage = normalizeUrl(image) || FALLBACK_IMAGE;
    const lowResBlur = `${finalImage}?w=50&blur=20&q=20`;

    const imgRef = useRef(null);
    const [loaded, setLoaded] = useState(false);

    const href = `${localePrefix}/${slug || ""}`.replace(/\/+/g, "/");

    useEffect(() => {
        if (!imgRef.current || !finalImage) return;

        const cached = getCachedImageUrl(finalImage);
        if (cached) {
            imgRef.current.src = cached;
            setLoaded(true);
            return;
        }

        const observer = new IntersectionObserver(
            async (entries) => {
                if (!entries[0].isIntersecting) return;
                observer.disconnect();

                const optimized = `${finalImage}?format=webp&w=600&q=80`;
                const cachedUrl = await loadAndCacheImage(optimized);

                if (cachedUrl && imgRef.current) {
                    imgRef.current.src = cachedUrl;
                    setLoaded(true);
                }
            },
            { threshold: 0.1, rootMargin: "300px" }
        );

        observer.observe(imgRef.current);
        return () => observer.disconnect();
    }, [finalImage]);

    return (
        <Link href={href} className="service-card" aria-label={displayTitle}>
            <div className="service-card__image-wrapper">
                <img
                    ref={imgRef}
                    src={lowResBlur}
                    alt={displayTitle}
                    className={`service-card__image ${
                        loaded ? "is-loaded" : ""
                    }`}
                    width="400"
                    height="400"
                    loading="lazy"
                    decoding="async"
                    style={{
                        backgroundImage: `url(${lowResBlur})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                />
            </div>

            <div className="service-card__content">
                <h3 className="service-card__title">
                    <SafeHtml html={displayTitle} />
                </h3>

                <span className="service-card__button">
                    <span>{t("services.card.button", "Details")}</span>
                    <svg className="service-card__arrow" viewBox="0 0 24 24">
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
        </Link>
    );
});

ServiceCard.displayName = "ServiceCard";
export default ServiceCard;
