import React from "react";
import { Head, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import ContactSection from "@/Components/Home/Contact/ContactSection";
import "@/../css/static-page.css";

export default function StaticPage() {
    const { page, slug, locale = "de", global } = usePage().props;

    const appName = global?.appName || "O&I CLEAN group GmbH";
    const normalized = locale.split("-")[0].toLowerCase();

    const tr =
        page?.translations?.find(
            (t) =>
                String(t.language_code || "")
                    .toLowerCase()
                    .split("-")[0] === normalized
        ) ||
        page?.translations?.[0] ||
        {};

    const title = tr.name || page?.name || "Seite";
    const content = tr.content || page?.content || "";
    const image = page?.image || null;

    const metaTitle = page?.meta_title || `${title} - ${appName}`;
    const metaDescription =
        page?.meta_description || content.replace(/<[^>]+>/g, "").slice(0, 160);

    const metaKeywords = page?.meta_keywords;

    const faq = page?.faq || null;
    let faqTitle = "";
    let faqItems = [];

    if (faq) {
        const faqTr =
            faq.translations?.find(
                (t) =>
                    String(t.language_code || "")
                        .toLowerCase()
                        .split("-")[0] === normalized
            ) ||
            faq.translations?.[0] ||
            faq;

        faqTitle = faqTr?.name || faq?.name || "FAQ";

        if (Array.isArray(faq.items)) {
            faqItems = faq.items.map((item) => {
                const itemTr =
                    item.translations?.find(
                        (t) =>
                            String(t.language_code || "")
                                .toLowerCase()
                                .split("-")[0] === normalized
                    ) ||
                    item.translations?.[0] ||
                    item;

                return {
                    id: item.id,
                    question: itemTr?.question || "",
                    answer: itemTr?.answer || "",
                };
            });
        }
    }

    return (
        <AppLayout>
            <Head>
                <title>{metaTitle}</title>
                <meta name="description" content={metaDescription} />
                {metaKeywords && (
                    <meta name="keywords" content={metaKeywords} />
                )}
                <link rel="canonical" href={`/${locale}/${slug}`} />
                <meta property="og:title" content={metaTitle} />
                <meta property="og:description" content={metaDescription} />
                {image && <meta property="og:image" content={image} />}
            </Head>

            {/* HERO */}
            <section className={`sp-hero ${image ? "sp-hero--has-img" : ""}`}>
                {image && (
                    <img
                        src={`${image}?format=webp&w=1600&q=80`}
                        alt={title}
                        className="sp-hero__img"
                        width={1600}
                        height={450}
                        loading="lazy"
                        decoding="async"
                    />
                )}
                <div className="sp-hero__overlay" />
                <div className="sp-hero__inner container">
                    <h1 className="sp-title">{title}</h1>
                </div>
            </section>

            {/* CONTENT */}
            {content && (
                <section className="sp-content">
                    <div className="container">
                        <article className="sp-card">
                            <div
                                className="sp-card__body sp-prose"
                                dangerouslySetInnerHTML={{
                                    __html: content.replace(
                                        /\r\n|\n|\r/g,
                                        "<br />"
                                    ),
                                }}
                            />
                        </article>
                    </div>
                </section>
            )}

            {/* FAQ */}
            {faqItems.length > 0 && (
                <section className="sp-faq">
                    <div className="container">
                        <h2 className="sp-faq__title">{faqTitle}</h2>

                        <div className="sp-faq__list">
                            {faqItems.map((item) => (
                                <details key={item.id} className="sp-faq__item">
                                    <summary className="sp-faq__question">
                                        {item.question}
                                    </summary>
                                    <div
                                        className="sp-faq__answer sp-prose"
                                        dangerouslySetInnerHTML={{
                                            __html: item.answer,
                                        }}
                                    />
                                </details>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <ContactSection />
        </AppLayout>
    );
}
