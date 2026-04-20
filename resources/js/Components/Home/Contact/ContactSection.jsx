import React, { useState, useEffect } from "react";
import { usePage } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import "../../../../css/ContactSection.css";
import DotGrid from "@/Components/ReactBits/Backgrounds/DotGrid";
import SafeHtml from "@/Components/Common/SafeHtml";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import SuccessModal from "@/Components/SuccesModal";
import ContactMap from "@/Components/Contact/ContactMaps";

const ContactSection = () => {
    const { t } = useTranslation();
    const { props } = usePage();

    const global = props.global || {};
    const tenantId = props.tenantId || "";
    const locale = props.locale || "de";
    const settings = props.settings || {};
    const branding = settings.branding || {};

    const contactInfo = settings.contact.contact_infos?.[0] || {};

    const forms = global.forms || [];
    const formToDisplay = forms[0];

    const fields = Array.isArray(formToDisplay?.fields)
        ? formToDisplay.fields
        : [];

    const displayPhone = contactInfo.phone || "+49 (0)36874 38 55 67";
    const phoneHref = displayPhone.replace(/[^+\d]/g, "");
    const displayEmail = contactInfo.email || "info@oi-clean.de";
    const displayAddress =
        contactInfo.formatted_address ||
        `${contactInfo.address || ""}<br/>${contactInfo.postal_code || ""} ${
            contactInfo.city || ""
        }`;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [data, setData] = useState({});
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [dotColors, setDotColors] = useState({
        baseColor: "#e5e7eb",
        activeColor: "#0ea5e9",
    });
    const [isMobile, setIsMobile] = useState(false);

    const labelKeyMap = {
        field_0: "contact.form.name",
        field_1: "contact.form.phone",
        field_2: "contact.form.email",
        field_3: "contact.form.message",
    };

    const safeSetField = (name, value) => {
        if (name === "field_1" && !/^[0-9+\-()\s]*$/.test(value)) return;
        if (name === "field_2") value = value.toLowerCase();

        setData((prev) => ({ ...prev, [name]: value }));

        if (errors[name]) {
            const newErr = { ...errors };
            delete newErr[name];
            setErrors(newErr);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        const frontendErrors = {};

        if (!data.field_0)
            frontendErrors["field_0"] = t("contact.required.name");
        if (!data.field_1)
            frontendErrors["field_1"] = t("contact.required.phone");
        if (!data.field_2)
            frontendErrors["field_2"] = t("contact.required.email");
        if (!data.field_3)
            frontendErrors["field_3"] = t("contact.required.message");

        if (Object.keys(frontendErrors).length > 0) {
            setErrors(frontendErrors);
            setIsSubmitting(false);
            return;
        }

        const form_fields = {
            name: data.field_0,
            phone: data.field_1,
            email: data.field_2,
            message: data.field_3,
        };

        try {
            const response = await fetch(
                `/api/contact/forms/${formToDisplay.id}/submit?locale=${locale}`,
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "X-Tenant-ID": tenantId,
                    },
                    body: JSON.stringify(form_fields),
                },
            );

            const result = await response.json();

            if (response.status === 422) {
                const translatedErrors = {};
                Object.keys(result.errors).forEach((key) => {
                    if (key === "email")
                        translatedErrors["field_2"] = t(
                            "contact.required.email",
                        );
                    if (key === "phone")
                        translatedErrors["field_1"] = t(
                            "contact.required.phone",
                        );
                    if (key === "message")
                        translatedErrors["field_3"] = t(
                            "contact.required.message",
                        );
                    if (key === "name")
                        translatedErrors["field_0"] = t(
                            "contact.required.name",
                        );
                });

                setErrors(translatedErrors);
                setIsSubmitting(false);
                return;
            }

            setSuccessModalOpen(true);
            setData({});
        } catch {
            setSuccessModalOpen(true);
            setData({});
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
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
        <section className="contact-section rbits-section" id="contact">
            {successModalOpen && (
                <SuccessModal
                    isOpen={successModalOpen}
                    onClose={() => setSuccessModalOpen(false)}
                    title={t("contact.success_title")}
                    message={t("contact.success_message")}
                    subMessage={t("contact.success_sub")}
                    buttonText={t("common.ok")}
                />
            )}

            {!isMobile && (
                <div className="rbits-bg-wrap">
                    <DotGrid
                        dotSize={10}
                        gap={22}
                        baseColor={dotColors.baseColor}
                        activeColor={dotColors.activeColor}
                    />
                </div>
            )}

            <div className="contact-container">
                <div className="contact-content">
                    <div className="contact-info">
                        <h2>{t("contact.title")}</h2>
                        <div className="contact-details">
                            <div className="contact-details-text">
                                <FaPhoneAlt />{" "}
                                <a href={`tel:${phoneHref}`}>{displayPhone}</a>
                            </div>
                            <div className="contact-details-text">
                                <FaEnvelope />{" "}
                                <a href={`mailto:${displayEmail}`}>
                                    {displayEmail}
                                </a>
                            </div>
                            <div className="contact-details-text">
                                <FaMapMarkerAlt />{" "}
                                <SafeHtml html={displayAddress} />
                            </div>
                        </div>

                        <div className="contact-map-wrapper">
                            <ContactMap
                                query={`${contactInfo.address}, ${contactInfo.postal_code} ${contactInfo.city}, ${contactInfo.country}`}
                                zoom={15}
                                title={contactInfo.title}
                            />
                        </div>
                    </div>

                    {formToDisplay && (
                        <form className="contact-form" onSubmit={handleSubmit}>
                            <div className="form-grid">
                                {fields.map((f) => (
                                    <div
                                        key={f.name}
                                        className={`form-group ${
                                            f.type === "textarea"
                                                ? "full-width"
                                                : ""
                                        }`}
                                    >
                                        <label>
                                            {t(labelKeyMap[f.name] || f.label)}{" "}
                                            {f.required && "*"}
                                        </label>

                                        {f.type === "textarea" ? (
                                            <textarea
                                                rows="5"
                                                value={data[f.name] || ""}
                                                onChange={(e) =>
                                                    safeSetField(
                                                        f.name,
                                                        e.target.value,
                                                    )
                                                }
                                                className={
                                                    errors[f.name]
                                                        ? "error"
                                                        : ""
                                                }
                                            />
                                        ) : (
                                            <input
                                                type={f.type}
                                                value={data[f.name] || ""}
                                                onChange={(e) =>
                                                    safeSetField(
                                                        f.name,
                                                        e.target.value,
                                                    )
                                                }
                                                className={
                                                    errors[f.name]
                                                        ? "error"
                                                        : ""
                                                }
                                            />
                                        )}

                                        {errors[f.name] && (
                                            <span className="error-message">
                                                {errors[f.name]}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                type="submit"
                                className="submit-button bg-button"
                                disabled={isSubmitting}
                            >
                                {isSubmitting
                                    ? t("contact.submitting")
                                    : t("contact.submit_label")}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ContactSection;
