import React from "react";
import { FaWhatsapp } from "react-icons/fa";
import { usePage } from "@inertiajs/react";

export default function WhatsAppWidget() {
    const { props } = usePage();
    const widgets = props.global?.widgets ?? {}; // 🔥 Doğru veri yolu

    const config = widgets.whatsapp?.[0];
    if (!config || !config.is_active) return null;

    const phone = config.phone_number?.replace(/\s|\+/g, "") || "";
    if (!phone) return null;

    const message = config.default_message || config.welcome_text || "Hello!";
    const position = config.button_position === "bottom-left" ? "left" : "right";
    const buttonColor = config.button_color || "#25D366";
    const textColor = config.button_text_color || "#FFFFFF";

    const logoUrl =
        config.logo_url && config.logo_url.trim() !== "" ? config.logo_url : null;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp Chat"
            className={`
                fixed bottom-4 z-50 w-14 h-14 
                flex items-center justify-center
                rounded-full shadow-lg cursor-pointer
                hover:scale-110 hover:shadow-2xl
                transition-transform
                ${position === "left" ? "left-4" : "right-4"}
            `}
            style={{ backgroundColor: buttonColor, color: textColor }}
            title={config.welcome_text || "WhatsApp"}
        >
            {logoUrl ? (
                <img
                    src={logoUrl}
                    className="w-10 h-10 object-contain rounded-full"
                    alt="WhatsApp"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                        // Görsel hata verirse ikon fallback
                        e.currentTarget.style.display = "none";
                    }}
                />
            ) : (
                <FaWhatsapp size={32} />
            )}
        </a>
    );
}
