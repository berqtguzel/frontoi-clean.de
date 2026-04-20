import React, { useEffect, useState } from "react";
import { router } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import Cookies from "js-cookie";
import { FiX } from "react-icons/fi"; // 🔥 temiz X icon
import Loading from "./Common/Loading";
import "../../css/language-switcher.css";

function normalizeLang(code) {
    return String(code || "")
        .toLowerCase()
        .split("-")[0];
}

// 🔥 flag fix map
const flagMap = {
    en: "gb",
    cs: "cz",
};

const LanguageSwitcher = ({ currentLang, languages }) => {
    const { i18n } = useTranslation();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const normalizedCurrent = normalizeLang(currentLang);

    // ✅ ESC ile kapatma
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === "Escape") setOpen(false);
        };

        if (open) {
            window.addEventListener("keydown", handleKey);
        }

        return () => {
            window.removeEventListener("keydown", handleKey);
        };
    }, [open]);

    const handleLanguageChange = async (codeNorm) => {
        if (codeNorm === normalizedCurrent) return;

        setIsLoading(true);

        const segments = window.location.pathname.split("/").filter(Boolean);
        const validLocales = languages.map((l) => normalizeLang(l.code));

        if (validLocales.includes(normalizeLang(segments[0]))) {
            segments[0] = codeNorm;
        } else {
            segments.unshift(codeNorm);
        }

        const newUrl = "/" + segments.join("/");

        Cookies.set("locale", codeNorm, { path: "/", expires: 365 });

        try {
            await i18n.changeLanguage(codeNorm);
        } catch (e) {}

        setTimeout(() => {
            router.visit(newUrl, {
                replace: true,
                preserveState: false,
                preserveScroll: false,
            });
        }, 150);
    };

    if (!languages || languages.length <= 1) return null;

    const activeLang =
        languages.find((l) => normalizeLang(l.code) === normalizedCurrent) ||
        languages[0];

    return (
        <>
            {/* BUTTON */}
            <button className="lang-switch__btn" onClick={() => setOpen(true)}>
                {activeLang.code.toUpperCase()}
            </button>

            {/* MODAL */}
            {open && (
                <div className="lang-modal">
                    {/* backdrop */}
                    <div
                        className="lang-modal__backdrop"
                        onClick={() => setOpen(false)}
                    />

                    {/* content */}
                    <div
                        className="lang-modal__content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="lang-modal__header">
                            <button
                                className="lang-modal__close-btn"
                                onClick={() => setOpen(false)}
                            >
                                <FiX size={20} />
                            </button>
                        </div>

                        {/* LOADING */}
                        {isLoading && (
                            <div className="lang-modal__loading">
                                <Loading />
                            </div>
                        )}

                        {/* LIST */}
                        <div
                            className={`lang-modal__list ${
                                isLoading ? "disabled" : ""
                            }`}
                        >
                            {languages.map((l) => {
                                const codeNorm = normalizeLang(l.code);
                                const isActive = codeNorm === normalizedCurrent;

                                const flagCode = flagMap[codeNorm] || codeNorm;

                                return (
                                    <button
                                        key={l.code}
                                        className={`lang-modal__item ${
                                            isActive ? "is-active" : ""
                                        }`}
                                        onClick={() =>
                                            handleLanguageChange(codeNorm)
                                        }
                                        disabled={isLoading}
                                    >
                                        {/* FLAG */}
                                        <div className="lang-modal__flag">
                                            <img
                                                src={`https://flagcdn.com/w40/${flagCode}.png`}
                                                alt={l.code}
                                                onError={(e) => {
                                                    e.target.src =
                                                        "https://flagcdn.com/w40/un.png";
                                                }}
                                            />
                                        </div>

                                        {/* TEXT */}
                                        <div className="lang-modal__info">
                                            <span className="lang-modal__name">
                                                {l.label ||
                                                    codeNorm.toUpperCase()}
                                            </span>
                                        </div>

                                        {/* ACTIVE */}
                                        {isActive && (
                                            <div className="lang-modal__check">
                                                ✓
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default LanguageSwitcher;
