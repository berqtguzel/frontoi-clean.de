import React, { useEffect, useState, useRef, memo } from "react";
import { motion } from "framer-motion";
import SafeHtml from "@/Components/Common/SafeHtml";
import "../../../css/HeroSection.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const normalizeUrl = (url) =>
    url && !url.startsWith("http") ? `${API_BASE}${url}` : url;

const HeroSection = memo(({ sliders }) => {
    const sliderList = sliders?.sliders ?? [];
    const slide = sliderList[0] ?? {};

    const heroRef = useRef(null);
    const videoRef = useRef(null);

    const [isMobile, setIsMobile] = useState(false);
    const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
    const [showVideo, setShowVideo] = useState(false);
    const [videoLoaded, setVideoLoaded] = useState(false);

    const videoUrl = normalizeUrl(slide.video_url);
    const posterUrl =
        normalizeUrl(slide.video_poster) || normalizeUrl(slide.image);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const mobile = window.matchMedia("(max-width: 768px)").matches;
        setIsMobile(mobile);
    }, []);

    useEffect(() => {
        if (!heroRef.current || isMobile || !videoUrl) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShouldLoadVideo(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.25 },
        );

        observer.observe(heroRef.current);

        return () => observer.disconnect();
    }, [isMobile, videoUrl]);

    useEffect(() => {
        if (!shouldLoadVideo) return;

        const t = setTimeout(() => setShowVideo(true), 1500);
        return () => clearTimeout(t);
    }, [shouldLoadVideo]);

    return (
        <section ref={heroRef} id="top" className="hero-section">
            {posterUrl && (
                <img
                    src={posterUrl}
                    alt={slide.title}
                    className="hero-bg hero-bg--image"
                    width="1920"
                    height="1080"
                    loading="eager"
                    decoding="async"
                    style={{ objectFit: "cover" }}
                />
            )}

            {!isMobile && showVideo && videoUrl && (
                <motion.video
                    ref={videoRef}
                    className="hero-bg hero-bg--video"
                    playsInline
                    muted
                    autoPlay
                    loop
                    preload="none"
                    onLoadedData={() => setVideoLoaded(true)}
                    style={{
                        opacity: videoLoaded ? 1 : 0,
                        transition: "opacity .6s ease-in-out",
                    }}
                >
                    <source src={videoUrl} type="video/mp4" />
                </motion.video>
            )}

            <motion.div className="hero-content">
                <h1 className="hero-title">
                    <SafeHtml html={slide.title || ""} />
                </h1>

                <p className="hero-subtitle">
                    <SafeHtml html={slide.description || ""} />
                </p>

                {slide.buttonLabel && (
                    <div className="hero-cta-group">
                        <a
                            href={slide.buttonUrl || "#"}
                            className="hero-cta hero-cta--primary"
                        >
                            {slide.buttonLabel}
                        </a>
                    </div>
                )}
            </motion.div>
        </section>
    );
});

export default HeroSection;
