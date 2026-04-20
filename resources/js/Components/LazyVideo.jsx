import React, { useRef, useEffect, useState } from "react";

/**
 * IntersectionObserver ile:
 *  - Video sadece görünce yüklenir
 *  - Görüş alanından çıkınca pause edilir
 *  - Preload yok, CPU ve network yükü minimum
 */
const LazyVideo = ({
    src,
    type = "video/mp4",
    className,
    loop = true,
    muted = true,
    playsInline = true,
    poster,
    onError,
}) => {
    const videoRef = useRef(null);
    const [shouldLoad, setShouldLoad] = useState(false);

    useEffect(() => {
        const el = videoRef.current;
        if (!el || !src) return;

        let observer;

        if (typeof window !== "undefined" && "IntersectionObserver" in window) {
            observer = new IntersectionObserver(
                ([entry]) => {
                    if (!videoRef.current) return;

                    if (entry.isIntersecting) {
                        // İlk kez görünüyorsa kaynağı yükle
                        if (!shouldLoad) {
                            setShouldLoad(true);
                        }
                        // Oynatmayı dene (autoplay)
                        videoRef.current
                            .play()
                            .catch(() => {
                                // autoplay bloklanırsa sessizce geç
                            });
                    } else {
                        // Görüş alanından çıktı -> pause
                        videoRef.current.pause();
                    }
                },
                {
                    threshold: 0.3,
                    rootMargin: "200px",
                }
            );

            observer.observe(el);
        } else {
            // Eski tarayıcılar: direkt yükle
            setShouldLoad(true);
        }

        return () => {
            if (observer && el) {
                observer.unobserve(el);
                observer.disconnect();
            }
        };
    }, [src, shouldLoad]);

    return (
        <video
            ref={videoRef}
            className={className}
            muted={muted}
            playsInline={playsInline}
            loop={loop}
            preload="none"
            poster={poster}
            onError={onError}
        >
            {shouldLoad && src && <source src={src} type={type} />}
        </video>
    );
};

export default LazyVideo;
