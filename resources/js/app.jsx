import "./bootstrap";
import "../css/app.css";
import "../css/theme.css";

import { router } from "@inertiajs/react";
import(/* webpackChunkName: "non-critical-css" */ "../css/loading.css").catch(
    () => {},
);
import i18n from "./i18n";

import React from "react";
import { createRoot } from "react-dom/client";
import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { ThemeProvider } from "./Context/ThemeContext";

const APP_NAME = "O&I CLEAN group GmbH";
const STORAGE_KEY = "oiclean_analytics_sid";
const TENANT = "oi_cleande_690e161c3a1dd";
const OMR_API_BASE =
    import.meta.env.VITE_OMR_API_BASE || "https://omerdogan.de/api";
const OMR_API_VERSION = import.meta.env.VITE_OMR_API_VERSION || "v2";

/**
 * ANALYTICS INITIALIZATION GUARD
 * Uygulamanın yanlışlıkla iki kez başlatılmasını ve çift kayıt atmasını engeller.
 */
window.__ANALYTICS_INITIALIZED__ = window.__ANALYTICS_INITIALIZED__ || false;

/**
 * GLOBAL SESSION ID
 * Sayfa yenilenene veya değişene kadar tek bir ID üzerinden işlem yapılmasını garanti eder.
 */
let CACHED_SESSION_ID = localStorage.getItem(STORAGE_KEY);
if (!CACHED_SESSION_ID) {
    CACHED_SESSION_ID = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, CACHED_SESSION_ID);
}

function initAnalytics() {
    // Singleton kontrolü: Eğer zaten kurulmuşsa dummy fonksiyonlar döndür.
    if (window.__ANALYTICS_INITIALIZED__) {
        return { track: () => {}, timing: () => {}, isDummy: true };
    }
    window.__ANALYTICS_INITIALIZED__ = true;

    let pageStartTime = Date.now();
    let maxScroll = 0;
    let currentPath =
        window.location.pathname +
        window.location.search +
        window.location.hash;

    const updateScrollDepth = () => {
        const winHeight = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;
        const scrollTop =
            window.pageYOffset || document.documentElement.scrollTop;
        const trackLength = docHeight - winHeight;
        if (trackLength <= 0) return;
        const pct = Math.floor((scrollTop / trackLength) * 100);
        if (pct > maxScroll) maxScroll = Math.min(pct, 100);
    };

    window.addEventListener("scroll", updateScrollDepth, { passive: true });

    const beacon = (endpoint, payload) => {
        const url = `${OMR_API_BASE}/${OMR_API_VERSION}/analytics/${endpoint}?tenant=${TENANT}`;
        navigator.sendBeacon(
            url,
            new Blob([JSON.stringify(payload)], { type: "application/json" }),
        );
    };

    return {
        track: (title) => {
            // Yeni sayfa için URL'i güncelle ve ölçümleri sıfırla
            currentPath =
                window.location.pathname +
                window.location.search +
                window.location.hash;
            pageStartTime = Date.now();
            maxScroll = 0;

            beacon("track", {
                session_id: CACHED_SESSION_ID,
                url: currentPath,
                title: title || document.title,
                referrer: document.referrer || null,
                userAgent: navigator.userAgent,
                screen: { width: screen.width, height: screen.height },
                timestamp: new Date().toISOString(),
            });
        },
        timing: () => {
            const duration = Math.floor((Date.now() - pageStartTime) / 1000);
            // Sitede en az 1 saniye kalındıysa veya kaydırma yapıldıysa gönder
            if (duration < 1 && maxScroll < 1) return;

            beacon("page-timing", {
                session_id: CACHED_SESSION_ID,
                url: currentPath, // Kilitlenmiş URL üzerinden gönderim yapar
                time_on_page: duration,
                scroll_depth: maxScroll,
            });
        },
    };
}

/** Inertia sayfa dilini URL ile i18next’e zorla (client-side dil drift’ini keser). */
const syncI18nFromPage = (page) => {
    const locale = page?.props?.locale;
    if (!locale || typeof locale !== "string") return;
    const code = locale.toLowerCase().slice(0, 2);
    if (i18n.language === code) return;
    void i18n.changeLanguage(code);
    try {
        localStorage.setItem("locale", code);
        localStorage.setItem("i18nextLng", code);
    } catch {
        /* ignore */
    }
};

createInertiaApp({
    title: (title) => (title ? `${title} - ${APP_NAME}` : APP_NAME),
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob("./Pages/**/*.{jsx,tsx}"),
        ),
    setup({ el, App, props }) {
        syncI18nFromPage(props.initialPage);

        const onInertiaSuccess = (e) => {
            const page = e?.detail?.page;
            if (page) syncI18nFromPage(page);
        };
        document.addEventListener("inertia:success", onInertiaSuccess);

        const analytics = initAnalytics();

        // Sadece gerçek analytics instance'ı için olayları bağla
        if (!analytics.isDummy) {
            window.analytics = analytics;

            // İlk sayfa yüklemesi
            analytics.track(props.initialPage?.props?.title);

            // Navigasyon başlamadan (URL değişmeden) süreyi gönder
            router.on("before", () => {
                analytics.timing();
            });

            // Yeni sayfa başarıyla yüklendiğinde yeni track kaydı aç
            router.on("success", () => {
                setTimeout(() => analytics.track(), 100);
            });

            // Sekme kapatıldığında veya arka plana atıldığında süreyi gönder
            document.addEventListener("visibilitychange", () => {
                if (document.visibilityState === "hidden") {
                    analytics.timing();
                }
            });
        }

        createRoot(el).render(
            <ThemeProvider initial={props?.initialPage?.props?.theme}>
                <App {...props} />
            </ThemeProvider>,
        );
    },
    progress: {
        color: "var(--site-primary-color)",
        delay: 80,
        showSpinner: false,
    },
});
