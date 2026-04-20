import React, { useState, useEffect, useMemo } from "react";
import "../../../css/contact-maps.css";

export default function ContactMap({
    query = "Spaldingstr. 77–79, 20097 Hamburg",
    zoom = 14,
    title = "Unser Standort",
    description = "Besuchen Sie uns – wir freuen uns auf Sie!",
}) {
    const [isMounted, setIsMounted] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const q = useMemo(() => encodeURIComponent(query), [query]);
    const src = useMemo(
        () =>
            `https://maps.google.com/maps?q=${q}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`,
        [q, zoom]
    );

    const showSkeleton = !isMounted || !loaded;

    return (
        <div className="cmap-item" suppressHydrationWarning={true}>
            <div className="cmap-head">
                <h3 className="cmap-title" suppressHydrationWarning={true}>
                    {title}
                </h3>
                {description && (
                    <p className="cmap-sub" suppressHydrationWarning={true}>
                        {description}
                    </p>
                )}
            </div>

            <div className="cmap-wrap">
                {showSkeleton && (
                    <div className="cmap-skeleton" aria-hidden="true" />
                )}

                <div className="cmap-aspect">
                    <iframe
                        title={title}
                        className="cmap-iframe"
                        src={src}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        onLoad={() => setLoaded(true)}
                        suppressHydrationWarning={true}
                    />
                </div>
            </div>
        </div>
    );
}
