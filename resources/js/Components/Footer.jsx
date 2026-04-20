import React, { memo, useEffect, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    FaMapMarkerAlt,
    FaPhoneAlt,
    FaEnvelope,
    FaFacebook,
    FaInstagram,
    FaArrowUp,
} from "react-icons/fa";
import { FaSquareXTwitter } from "react-icons/fa6";

import DotGrid from "@/Components/ReactBits/Backgrounds/DotGrid";
import SafeHtml from "@/Components/Common/SafeHtml";
import { useTranslation } from "react-i18next";
import "../../css/Footer.css";

const stripHtml = (html = "") => html.replace(/<[^>]*>/g, "").trim();

const Footer = memo(() => {
    const { t } = useTranslation();
    const { props } = usePage();

    const global = props.global ?? {};
    const settings = props.settings ?? {};
    const branding = settings.branding ?? {};
    const social = settings.social ?? {};
    const contactData = settings.contact ?? {};
    const footerSettings = settings.footer ?? {};
    const general = settings.general ?? {};

    const locale = props?.locale || "de";
    const siteName = general.site_name || "O&I CLEAN";

    const logoUrl =
        branding.dark_logo?.url || branding.logo?.url || "/logo.png";

    const footerMenu = Array.isArray(props.menus?.footer)
        ? props.menus.footer
        : [];

    const footerLinks = footerMenu.map((item) => {
        const translation = item.translations?.find(
            (x) => x.language_code?.toLowerCase() === locale.toLowerCase(),
        );

        return {
            label: translation?.label || item.name || "",
            url: item.url?.startsWith("http")
                ? item.url
                : `/${locale}${
                      item.url?.startsWith("/") ? item.url : "/" + item.url
                  }`,
        };
    });

    const contactInfos = Array.isArray(contactData.contact_infos)
        ? contactData.contact_infos
        : [];

    const contact = contactInfos[0] ?? {};
    const cleanPhone = contact.phone?.replace(/[^+\d]/g, "");

    const addressText = contact.address ? stripHtml(contact.address) : "";

    const googleMapsUrl = addressText
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              addressText,
          )}`
        : null;

    const [dotColors, setDotColors] = useState({
        baseColor: "#e5e7eb",
        activeColor: "#0ea5e9",
    });

    const [isMobile, setIsMobile] = useState(false);

    const scrollToTop = () => {
        if (typeof window === "undefined") return;
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    useEffect(() => {
        if (typeof window === "undefined") return;

        const style = getComputedStyle(document.documentElement);

        const primary =
            branding.colors?.primary_color ||
            style.getPropertyValue("--site-accent-color")?.trim() ||
            "#0ea5e9";

        const secondary =
            branding.colors?.secondary_color ||
            style.getPropertyValue("--header-background-color")?.trim() ||
            "#e5e7eb";

        setDotColors({
            baseColor: secondary,
            activeColor: primary,
        });
    }, [branding]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const mq = window.matchMedia("(max-width: 768px)");
        const handler = () => setIsMobile(mq.matches);
        handler();

        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    return (
        <footer className="footer-dotgrid">
            {!isMobile && (
                <div className="footer-dotgrid-bg">
                    <DotGrid
                        dotSize={5}
                        gap={22}
                        baseColor={dotColors.baseColor}
                        activeColor={dotColors.activeColor}
                    />
                </div>
            )}

            <div className="container footer-content">
                <img
                    src={logoUrl}
                    alt={siteName}
                    className="footer-minimal-logo"
                />

                {footerLinks.length > 0 && (
                    <ul className="footer-minimal-menu">
                        {footerLinks.map((link, i) => (
                            <li key={i}>
                                <Link href={link.url}>{link.label}</Link>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="footer-divider"></div>

                <address className="footer-contact">
                    {contact.address && googleMapsUrl && (
                        <span className="footer-contact-item">
                            <FaMapMarkerAlt />
                            <a
                                href={googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Google Maps"
                            >
                                <SafeHtml html={contact.address} as="span" />
                            </a>
                        </span>
                    )}

                    {contact.phone && (
                        <span className="footer-contact-item">
                            <FaPhoneAlt />
                            <a href={`tel:${cleanPhone}`}>{contact.phone}</a>
                        </span>
                    )}

                    {contact.email && (
                        <span className="footer-contact-item">
                            <FaEnvelope />
                            <a href={`mailto:${contact.email}`}>
                                {contact.email}
                            </a>
                        </span>
                    )}
                </address>

                <div className="footer-minimal-social">
                    {social.social_facebook && (
                        <a href={social.social_facebook}>
                            <FaFacebook />
                        </a>
                    )}
                    {social.social_instagram && (
                        <a href={social.social_instagram}>
                            <FaInstagram />
                        </a>
                    )}
                    {social.social_twitter && (
                        <a href={social.social_twitter}>
                            <FaSquareXTwitter />
                        </a>
                    )}
                </div>

                <div className="footer-minimal-bottom">
                    © {new Date().getFullYear()} {siteName}.{" "}
                    {footerSettings?.footer_copyright}
                </div>
            </div>

            <button
                type="button"
                className="footer-scroll-top"
                onClick={scrollToTop}
            >
                <FaArrowUp />
            </button>
        </footer>
    );
});

export default Footer;
