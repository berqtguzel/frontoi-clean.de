import "../../css/header.css";
import React, { useEffect, useMemo, useRef, useState, memo } from "react";
import { router, usePage } from "@inertiajs/react";
import {
    FaChevronDown,
    FaChevronRight,
    FaPhoneAlt,
    FaBars,
    FaTimes,
    FaFacebook,
    FaInstagram,
    FaEnvelope,
} from "react-icons/fa";
import { FaSquareXTwitter } from "react-icons/fa6";
import { useTranslation } from "react-i18next";
import ThemeToggle from "./ThemeToggle";

import SafeHtml from "@/Components/Common/SafeHtml";
import LanguageSwitcher from "./LanguageSwitcher";

/* ============================== helpers ============================== */

function cx(...args) {
    return args.filter(Boolean).join(" ");
}

const getOffset = () => {
    const el = document.querySelector(".site-header");
    const h = el ? el.offsetHeight : 0;
    return Math.max(0, h - 4);
};

const smoothScrollTo = (hash) => {
    if (!hash) return;
    const id = hash.replace("#", "");
    const el = document.getElementById(id);
    if (!el) {
        setTimeout(() => smoothScrollTo(hash), 120);
        return;
    }
    const headerOffset = getOffset();
    const rect = el.getBoundingClientRect();
    const y = rect.top + window.pageYOffset - headerOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
    if (history.replaceState) {
        history.replaceState(null, "", `${window.location.pathname}#${id}`);
    }
};
const renderMenuItems = (items, navigate) => {
    return items.map((item, idx) => (
        <div key={idx} className="menu__item">
            <a
                href={item.url}
                className="menu__link has-children"
                onClick={navigate(item.url)}
            >
                <SafeHtml html={item.label || item.name} as="span" />

                {item.children && item.children.length > 0 && (
                    <FaChevronRight className="submenu__arrow" />
                )}
            </a>

            {item.children && item.children.length > 0 && (
                <div className="submenu">
                    {renderMenuItems(item.children, navigate)}
                </div>
            )}
        </div>
    ));
};

const HeaderInner = memo(() => {
    const { props } = usePage();

    // Verileri güvenli şekilde parçalıyoruz
    const settings = props?.settings || {};
    const languages = props?.languages || [];
    const currentLocale = props?.locale || "de";
    const headerMenuRaw = props?.menus?.header || [];

    const { i18n, t } = useTranslation();

    // UI States
    const [openMenu, setOpenMenu] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [mobileAccordions, setMobileAccordions] = useState({});
    const headerRef = useRef(null);
    const closeTimer = useRef(null);
    const HOVER_INTENT = 160;

    // Contact & Branding
    const contactInfo =
        settings?.contact?.contact_infos?.[0] || settings?.contact || {};
    const sitePhone =
        contactInfo.phone || settings?.phone || "+49 (0)36874 38 55 67";
    const siteMail = contactInfo.email || settings?.email || "";
    const siteName =
        settings?.branding?.site_name || settings?.site_name || "O&I CLEAN";

    // Logo Logic
    const siteLogos = useMemo(() => {
        const getUrl = (src) =>
            src?.url || (typeof src === "string" ? src : null);
        return {
            light:
                getUrl(settings?.logo) ||
                getUrl(settings?.branding?.logo) ||
                "/images/logo/Logo.png",
            dark:
                getUrl(settings?.logo_dark) ||
                getUrl(settings?.branding?.logo_dark) ||
                "/images/logo/darkLogo.png",
        };
    }, [settings]);

    // NavItem Mapper
    const navItems = useMemo(() => {
        const items = Array.isArray(headerMenuRaw)
            ? headerMenuRaw
            : headerMenuRaw?.items || [];
        if (items.length === 0) {
            return [
                {
                    label: "Startseite",
                    url: "/",
                    route: "home",
                    hasChildren: false,
                    isActive: () => window.location.pathname === "/",
                },
            ];
        }
        return items.map((item, i) => ({
            ...item,
            displayName: item.label || item.name || "Menu Item",
            dropdownKey: `menus-${item.id || i}`,
            hasChildren:
                Array.isArray(item.children) && item.children.length > 0,
            isActive: () => {
                const currentPath =
                    window.location.pathname.replace(/\/+$/, "") || "/";
                const targetPath = (item.url || "").replace(/\/+$/, "") || "/";
                return currentPath === targetPath;
            },
        }));
    }, [headerMenuRaw]);

    // Handlers
    const openDrop = (key) => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setOpenDropdown(key);
    };

    const scheduleCloseDrop = () => {
        closeTimer.current = setTimeout(
            () => setOpenDropdown(null),
            HOVER_INTENT,
        );
    };

    const navigate =
        (url, close = false) =>
        (e) => {
            if (!url) return;

            const raw = String(url).trim();

            // hash scroll aynen kalsın
            if (raw.startsWith("#") || raw.includes("/#")) {
                const hash = raw.includes("#") ? `#${raw.split("#")[1]}` : raw;
                e.preventDefault();
                smoothScrollTo(hash);
                if (close) setOpenMenu(false);
                return;
            }

            e.preventDefault();

            // 👉 BURASI ÖNEMLİ
            const localizedUrl = raw.startsWith(`/${currentLocale}`)
                ? raw
                : `/${currentLocale}${raw.startsWith("/") ? raw : `/${raw}`}`;

            router.visit(localizedUrl, { preserveScroll: false });

            if (close) setOpenMenu(false);
        };
    useEffect(() => {
        const handler = () => {
            const header = document.querySelector("header");
            header?.classList.toggle("shadow-md", window.scrollY > 5);
        };
        window.addEventListener("scroll", handler, { passive: true });
        return () => window.removeEventListener("scroll", handler);
    }, []);

    console.log(props);
    return (
        <>
            <header ref={headerRef} className="fixed top-0 left-0 w-full z-50">
                {/* Topbar */}
                <div className="topbar">
                    <div className="container">
                        <div className="topbar__inner">
                            <div className="topbar__left">
                                <span className="topbar__phone">
                                    <FaPhoneAlt aria-hidden="true" />
                                    <a
                                        href={`tel:${sitePhone.replace(/\s+/g, "")}`}
                                    >
                                        {sitePhone}
                                    </a>
                                </span>
                                {siteMail && (
                                    <span className="topbar__mail">
                                        <FaEnvelope />
                                        <a href={`mailto:${siteMail}`}>
                                            {siteMail}
                                        </a>
                                    </span>
                                )}
                            </div>
                            <div className="topbar__right">
                                <div
                                    className="social-icons"
                                    style={{ display: "flex", gap: "10px" }}
                                >
                                    {settings?.social_facebook && (
                                        <a
                                            href={settings.social_facebook}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <FaFacebook />
                                        </a>
                                    )}
                                    {settings?.social_instagram && (
                                        <a
                                            href={settings.social_instagram}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <FaInstagram />
                                        </a>
                                    )}
                                    {settings?.social_twitter && (
                                        <a
                                            href={settings.social_twitter}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <FaSquareXTwitter />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="navwrap">
                    <div className="container">
                        <div className="navwrap__inner">
                            <a
                                href="/"
                                onClick={navigate("/")}
                                className="brand"
                            >
                                <img
                                    src={siteLogos.light}
                                    alt={siteName}
                                    className="brand__logo brand__logo--light"
                                />
                                <img
                                    src={siteLogos.dark}
                                    alt={siteName}
                                    className="brand__logo brand__logo--dark"
                                />
                            </a>

                            <nav className="nav nav--desktop">
                                {navItems.map((item) => {
                                    const isOpen =
                                        openDropdown === item.dropdownKey;
                                    return (
                                        <div
                                            key={item.dropdownKey}
                                            className={cx(
                                                "nav__item",
                                                item.isActive() && "is-active",
                                            )}
                                            onMouseEnter={() =>
                                                item.hasChildren &&
                                                openDrop(item.dropdownKey)
                                            }
                                            onMouseLeave={() =>
                                                item.hasChildren &&
                                                scheduleCloseDrop()
                                            }
                                        >
                                            <a
                                                href={item.url || "#"}
                                                className={cx(
                                                    "nav__link",
                                                    item.hasChildren &&
                                                        "has-dropdown",
                                                )}
                                                onClick={(e) =>
                                                    item.hasChildren
                                                        ? e.preventDefault()
                                                        : navigate(item.url)(e)
                                                }
                                            >
                                                <SafeHtml
                                                    html={item.displayName}
                                                    as="span"
                                                    className="nav__label"
                                                />
                                                {item.hasChildren && (
                                                    <FaChevronDown className="nav__chev" />
                                                )}
                                            </a>

                                            {item.hasChildren && isOpen && (
                                                <div
                                                    className="dropdown"
                                                    onMouseEnter={() =>
                                                        openDrop(
                                                            item.dropdownKey,
                                                        )
                                                    }
                                                >
                                                    <div className="menu">
                                                        {renderMenuItems(
                                                            item.children,
                                                            navigate,
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </nav>

                            <div className="header-controls">
                                <ThemeToggle />
                                {/* MASAÜSTÜ DİL DEĞİŞTİRİCİ BURADA */}
                                <LanguageSwitcher
                                    currentLang={currentLocale}
                                    languages={languages}
                                />
                            </div>

                            <button
                                className="hamburger"
                                onClick={() => setOpenMenu(true)}
                            >
                                <FaBars size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Drawer */}
                <div className={cx("drawer", openMenu && "is-open")}>
                    <div
                        className="drawer__backdrop"
                        onClick={() => setOpenMenu(false)}
                    />
                    <aside className="drawer__panel">
                        <div className="drawer__head">
                            <img
                                src={siteLogos.light}
                                alt="Logo"
                                style={{ height: "30px" }}
                            />
                            <button onClick={() => setOpenMenu(false)}>
                                <FaTimes size={18} />
                            </button>
                        </div>

                        <div className="drawer__body">
                            {navItems.map((item, idx) => (
                                <div key={idx} className="acc">
                                    <button
                                        className="acc__toggle"
                                        onClick={(e) =>
                                            item.hasChildren
                                                ? setMobileAccordions((p) => ({
                                                      ...p,
                                                      [item.dropdownKey]:
                                                          !p[item.dropdownKey],
                                                  }))
                                                : navigate(item.url, true)(e)
                                        }
                                    >
                                        <SafeHtml
                                            html={item.displayName}
                                            as="span"
                                        />
                                        {item.hasChildren && (
                                            <FaChevronDown
                                                className={cx(
                                                    "acc__chev",
                                                    mobileAccordions[
                                                        item.dropdownKey
                                                    ] && "rot",
                                                )}
                                            />
                                        )}
                                    </button>
                                    {item.hasChildren &&
                                        mobileAccordions[item.dropdownKey] && (
                                            <div className="acc__content open">
                                                {item.children.map((sub, i) => (
                                                    <a
                                                        key={i}
                                                        href={sub.url}
                                                        className="acc__link"
                                                        onClick={navigate(
                                                            sub.url,
                                                            true,
                                                        )}
                                                    >
                                                        <SafeHtml
                                                            html={
                                                                sub.label ||
                                                                sub.name
                                                            }
                                                            as="span"
                                                        />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                </div>
                            ))}
                        </div>

                        {/* MOBİL DİL VE TEMA KONTROLLERİ */}
                        <div
                            className="drawer__controls"
                            style={{
                                padding: "15px",
                                display: "flex",
                                justifyContent: "space-between",
                                borderBottom: "1px solid #eee",
                            }}
                        >
                            <div className="topbar__inner">
                                <div className="topbar__left">
                                    <span className="topbar__phone">
                                        <FaPhoneAlt aria-hidden="true" />
                                        <a
                                            href={`tel:${sitePhone.replace(/\s+/g, "")}`}
                                        >
                                            {sitePhone}
                                        </a>
                                    </span>
                                    {siteMail && (
                                        <span className="topbar__mail">
                                            <FaEnvelope />
                                            <a href={`mailto:${siteMail}`}>
                                                {siteMail}
                                            </a>
                                        </span>
                                    )}
                                </div>
                                <div className="topbar__right">
                                    <div
                                        className="social-icons"
                                        style={{ display: "flex", gap: "10px" }}
                                    >
                                        {settings?.social_facebook && (
                                            <a
                                                href={settings.social_facebook}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <FaFacebook />
                                            </a>
                                        )}
                                        {settings?.social_instagram && (
                                            <a
                                                href={settings.social_instagram}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <FaInstagram />
                                            </a>
                                        )}
                                        {settings?.social_twitter && (
                                            <a
                                                href={settings.social_twitter}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <FaSquareXTwitter />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </header>
        </>
    );
});

const Header = memo((props) => {
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => setHydrated(true), []);

    return (
        <header className="site-header w-full">
            {hydrated && <HeaderInner />}
        </header>
    );
});

export default Header;
