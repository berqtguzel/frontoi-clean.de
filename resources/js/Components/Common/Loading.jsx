import React, { useEffect, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import "../../../css/loading.css";

export default function Loading() {
    const { t } = useTranslation();
    const { component } = usePage();

    // 🚨 SSR → false, Client mount sonrası → true
    const [mounted, setMounted] = useState(false);
    const [active, setActive] = useState(false);
    const [message, setMessage] = useState("");
    const [previousComponent, setPreviousComponent] = useState(component);

    useEffect(() => {
        // Client mount olduktan hemen sonra "mounted" true olur
        setMounted(true);
    }, []);

    // Component değişikliğini takip et
    useEffect(() => {
        if (mounted && component !== previousComponent) {
            setPreviousComponent(component);
        }
    }, [component, previousComponent, mounted]);

    // Inertia router event binding
    useEffect(() => {
        if (!mounted) return;

        let timeout = null;
        let isNavigating = false;

        const handleStart = () => {
            isNavigating = true;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (isNavigating) {
                    setActive(true);
                    setMessage(t("ui.loading.message") || "Yükleniyor...");
                }
            }, 100);
        };

        const handleFinish = () => {
            isNavigating = false;
            clearTimeout(timeout);
            // Fade out animasyonu için kısa bir gecikme
            setTimeout(() => {
                setActive(false);
            }, 100);
        };

        const handleError = () => {
            isNavigating = false;
            clearTimeout(timeout);
            setTimeout(() => {
                setActive(false);
            }, 100);
        };

        // Inertia router event'lerini dinle
        // router.on() bir unsubscribe fonksiyonu döndürür
        const unsubscribeStart = router.on("start", handleStart);
        const unsubscribeFinish = router.on("finish", handleFinish);
        const unsubscribeError = router.on("error", handleError);

        return () => {
            clearTimeout(timeout);
            // Unsubscribe fonksiyonlarını çağır
            if (typeof unsubscribeStart === 'function') unsubscribeStart();
            if (typeof unsubscribeFinish === 'function') unsubscribeFinish();
            if (typeof unsubscribeError === 'function') unsubscribeError();
        };
    }, [mounted, t]);

    // 🚨 SSR & İlk Client Render → hiçbir şey render ETME
    if (!mounted || !active) {
        return null;
    }

    // Client tarafında aktif loading UI
    return (
        <div className="oi-loading" role="status" aria-live="polite">
            <div className="oi-loading__backdrop" />
            <div className="oi-loading__panel">
                <div className="oi-loading__spinner" aria-hidden="true">
                    <div className="oi-loading__spinner-inner"></div>
                </div>
                <div className="oi-loading__text">{message}</div>
            </div>
        </div>
    );
}
