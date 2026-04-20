import React, { useEffect, useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import DOMPurify from "isomorphic-dompurify";
import parse from "html-react-parser";
import { useTranslation } from "react-i18next";
import { FiHome, FiMail, FiRefreshCw } from "react-icons/fi";
import "../../../css/error-page.css";

export default function NotFound() {
    const { t } = useTranslation();
    const { props } = usePage();

    const { status = 404, page, global = {} } = props;

    const branding = props.settings?.branding || {};
    const logo = branding?.logo?.url;
    const darkLogo = branding?.dark_logo?.url;
    const siteName = branding?.site_name || "Logo";

    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        if (typeof document === "undefined" || typeof window === "undefined") {
            return;
        }

        setIsDark(document.documentElement.classList.contains("dark"));

        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains("dark"));
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => observer.disconnect();
    }, []);

    const logoSrc = isDark && darkLogo ? darkLogo : logo;

    const locale = props.locale || "de";
    const is500 = status >= 500;

    const safeContent = parse(
        DOMPurify.sanitize(
            page?.content ||
                t(is500 ? "errors.notFound.500" : "errors.notFound.404"),
        ),
    );

    const title =
        page?.title ||
        page?.meta_title ||
        (is500 ? "500 — Serverfehler" : "404 — Seite nicht gefunden");

    const description =
        page?.meta_description ||
        page?.content ||
        t(is500 ? "errors.notFound.500" : "errors.notFound.404");

    return (
        <AppLayout>
            <Head title={title}>
                <meta name="description" content={description} />
            </Head>

            <section className="error-page">
                <div className="error-container">
                    {logoSrc && (
                        <div className="error-logo-wrapper">
                            <Link
                                href={`/${locale}`}
                                className="error-logo-link"
                            >
                                <img
                                    src={logoSrc}
                                    alt={siteName}
                                    className="error-logo"
                                    loading="lazy"
                                />
                            </Link>
                        </div>
                    )}

                    <h1 className="error-status">{status}</h1>
                    <div className="error-message">{safeContent}</div>

                    <div className="error-actions">
                        <Link href={`/${locale}`} className="error-btn primary">
                            <FiHome size={20} />
                            {t("errors.notFound.home")}
                        </Link>

                        {!is500 && (
                            <Link
                                href={`/${locale}/kontakt`}
                                className="error-btn secondary"
                            >
                                <FiMail size={20} />
                                {t("errors.notFound.contact")}
                            </Link>
                        )}

                        {is500 && (
                            <button
                                onClick={() => window.location.reload()}
                                className="error-btn secondary"
                            >
                                <FiRefreshCw size={20} />
                                {t("errors.notFound.reload")}
                            </button>
                        )}
                    </div>
                </div>
            </section>
        </AppLayout>
    );
}
