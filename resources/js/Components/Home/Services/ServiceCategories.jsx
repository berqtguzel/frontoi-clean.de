import React, {
    useMemo,
    memo,
    lazy,
    Suspense,
    useState,
    useEffect,
} from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { usePage } from "@inertiajs/react";
import SafeHtml from "@/Components/Common/SafeHtml";
import { getWebPUrl } from "@/utils/imageOptimizer";
import "../../../../css/ServiceCategories.css";

const Aurora = lazy(() => import("@/Components/ReactBits/Backgrounds/Aurora"));

const FallbackImg = "/images/service-fallback.webp";

const ServiceCategories = memo(({ content = {} }) => {
    const { t } = useTranslation();
    const { props } = usePage();
    const BASE_URL = "https://omerdogan.de";
    const locale = props?.locale || "de";

    const rawHighlights = props.widgets?.highlights ?? [];
    const list = Array.isArray(rawHighlights?.data)
        ? rawHighlights.data
        : Array.isArray(rawHighlights)
          ? rawHighlights
          : [];
    const [etherColors, setEtherColors] = useState([
        "#5227FF",
        "#FF9FFC",
        "#B19EEF",
    ]);
    const [enableAurora, setEnableAurora] = useState(false);
    useEffect(() => {
        if (typeof window === "undefined") return;

        const root = document.documentElement;

        const getCssVar = (key) =>
            root.style.getPropertyValue(key) ||
            getComputedStyle(root).getPropertyValue(key);

        const primary = (getCssVar("--site-primary-color") || "").trim();
        const accent = (getCssVar("--site-accent-color") || "").trim();
        const secondary = (getCssVar("--site-secondary-color") || "").trim();

        const cleaned = [primary, accent, secondary].filter(Boolean);

        if (cleaned.length === 3) setEtherColors(cleaned);
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        const isMobile = window.matchMedia("(max-width: 768px)").matches;

        if (prefersReducedMotion || isMobile) {
            setEnableAurora(false);
            return;
        }

        try {
            const canvas = document.createElement("canvas");
            const gl = canvas.getContext("webgl2");
            setEnableAurora(!!gl);
        } catch (e) {
            setEnableAurora(false);
        }
    }, []);
    const services = useMemo(
        () =>
            list.map((s) => {
                const tr = (s.translations || []).find(
                    (i) =>
                        String(i.language_code || "").toLowerCase() ===
                        String(locale).toLowerCase(),
                );

                const imageUrl = s.media.url
                    ? getWebPUrl(
                          s.media.url.startsWith("http")
                              ? s.media.url
                              : `${BASE_URL}${s.media.url}`,
                      )
                    : FallbackImg;
                return {
                    ...s,
                    name: tr?.name || s.name,
                    description: tr?.description || s.description,
                    image: imageUrl,
                };
            }),
        [list, locale],
    );
    console.log(services);
    return (
        <section className="svc-section">
            {enableAurora && (
                <Suspense fallback={null}>
                    <div className="svc-aurora">
                        <Aurora
                            className="svc-aurora-canvas"
                            colorStops={etherColors}
                        />
                    </div>
                </Suspense>
            )}

            <div className="svc-container">
                <motion.h2
                    className="svc-title"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <SafeHtml
                        html={
                            content.section_services ||
                            t("services.section_title")
                        }
                    />
                </motion.h2>

                <div className="svc-grid">
                    {services.map((svc) => (
                        <motion.div
                            key={svc.id}
                            className="svc-card"
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="svc-card-img-wrap">
                                <img
                                    src={svc.image}
                                    className="svc-card-img"
                                    decoding="async"
                                    loading="lazy"
                                    width={360}
                                    height={230}
                                    alt={svc.name}
                                    onLoad={(e) =>
                                        e.target.classList.add("is-loaded")
                                    }
                                />
                            </div>

                            <div className="svc-card-body">
                                <h3 className="svc-card-title">{svc.name}</h3>
                                <p className="svc-card-desc">
                                    <SafeHtml html={svc.description} />
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
});

ServiceCategories.displayName = "ServiceCategories";

export default ServiceCategories;
