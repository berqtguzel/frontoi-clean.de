import React, { useEffect, useState, memo } from "react";
import { Head, usePage } from "@inertiajs/react";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import CookieBanner from "../Components/CookieBanner";
import Cookies from "js-cookie";
import { FaCookieBite } from "react-icons/fa";
import WhatsAppWidget from "@/Components/WhatsAppWidget";
import Loading from "@/Components/Common/Loading";
import OfferDock from "@/Components/OfferDock";
import QuoteModal from "@/Components/Modals/QuoteModal";

const AppLayout = memo(function AppLayout({ children }) {
    const { props } = usePage();

    const locale = props.locale || "de";
    const tenantId = props.tenantId || "";

    const settings = props.settings ?? {};
    const general = settings.general ?? {};
    const branding = settings.branding ?? {};
    const colors = settings.colors ?? {};

    const headerMenu = Array.isArray(props.menus?.header?.items)
        ? props.menus.header.items
        : [];

    const footerMenu = Array.isArray(props.menus?.footer?.items)
        ? props.menus.footer.items
        : [];

    const siteTitle = general.site_name || "O&I CLEAN";
    const siteDescription = general.site_description || "";

    const favicon =
        branding?.favicon?.url || general?.favicon?.url || "/favicon.ico";

    const rootStyles = {
        "--primary-color": colors.site_primary_color,
        "--secondary-color": colors.site_secondary_color,
        "--accent-color": colors.site_accent_color,

        "--text-color": colors.text_color,
        "--heading-1-color": colors.h1_color,
        "--heading-2-color": colors.h2_color,
        "--heading-3-color": colors.h3_color,
        "--link-color": colors.link_color,

        "--background-color": colors.background_color,
        "--header-bg": colors.header_background_color,
        "--footer-bg": colors.footer_background_color,

        "--button-bg": colors.button_color,
    };

    useEffect(() => {
        if (!colors || typeof colors !== "object") return;
        const root = document.documentElement;
        Object.keys(colors).forEach((key) => {
            root.style.setProperty(`--${key.replace(/_/g, "-")}`, colors[key]);
        });
    }, [colors]);

    const [isClient, setIsClient] = useState(false);
    useEffect(() => setIsClient(true), []);

    const [showCookieSettings, setShowCookieSettings] = useState(false);
    useEffect(() => {
        if (!Cookies.get("cookie_consent")) {
            setShowCookieSettings(true);
        }
    }, []);

    const whatsappData = Array.isArray(props.widgets?.whatsapp)
        ? props.widgets.whatsapp
        : [];

    return (
        <>
            <Head>
                <title>{siteTitle}</title>

                {siteDescription && (
                    <meta name="description" content={siteDescription} />
                )}

                <link rel="icon" href={favicon} />
                <link rel="shortcut icon" href={favicon} />
                <link rel="apple-touch-icon" href={favicon} />
            </Head>

            <div className="min-h-screen flex flex-col" style={rootStyles}>
                <Header menu={headerMenu} settings={settings} />
                <main className="flex-grow relative z-10">{children}</main>
                <Footer menu={footerMenu} settings={settings} />
            </div>

            {isClient && (
                <>
                    <Loading style={rootStyles} />
                    <OfferDock style={rootStyles} />
                    <QuoteModal style={rootStyles} />

                    <CookieBanner
                        style={rootStyles}
                        forceVisible={showCookieSettings}
                        onClose={() => setShowCookieSettings(false)}
                    />

                    {Cookies.get("cookie_consent") && !showCookieSettings && (
                        <button
                            className="fixed bottom-4 left-4 z-50 w-12 h-12 rounded-full
                            bg-white shadow-lg border flex items-center justify-center
                            text-blue-600 cursor-pointer"
                            onClick={() => setShowCookieSettings(true)}
                            aria-label="Cookie Settings"
                        >
                            <FaCookieBite />
                        </button>
                    )}

                    {/* 🔥 ARTIK ASLA PATLAMAZ */}
                    <WhatsAppWidget style={rootStyles} data={whatsappData} />
                </>
            )}
        </>
    );
});

export default AppLayout;
