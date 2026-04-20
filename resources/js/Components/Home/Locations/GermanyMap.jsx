import React, { memo, useEffect, useState, useMemo } from "react";
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker,
} from "react-simple-maps";
import { usePage, router } from "@inertiajs/react";

const DE_STATES_URL =
    "https://cdn.jsdelivr.net/gh/isellsoap/deutschlandGeoJSON@master/2_bundeslaender/4_niedrig.geo.json";

/* =======================
   ENV CONFIG
======================= */
const TENANT_STATE_CODE = (import.meta.env.VITE_TENANT_STATE_CODE || "").trim();

const TENANT_CENTER_LNG = Number(import.meta.env.VITE_TENANT_CENTER_LNG || 9.5);
const TENANT_CENTER_LAT = Number(
    import.meta.env.VITE_TENANT_CENTER_LAT || 51.5
);

const TENANT_SCALE_MOBILE = Number(
    import.meta.env.VITE_TENANT_SCALE_MOBILE || 3400
);
const TENANT_SCALE_DESKTOP = Number(
    import.meta.env.VITE_TENANT_SCALE_DESKTOP || 2400
);

/* =======================
   HELPERS
======================= */
const extractCityFromSlug = (slug = "") => {
    if (!slug) return "";
    if (slug.includes("-in-")) return slug.split("-in-").pop();
    return slug;
};

/* =======================
   COMPONENT
======================= */
const GermanyMap = ({ activeId, setActiveId }) => {
    const { props } = usePage();
    const locale = props.locale ?? "de";

    const maps = props.maps ?? {};
    const allMarkers = maps.markers ?? [];

    /* =======================
       STATE
    ======================= */
    const [hoveredMarker, setHoveredMarker] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const mq = window.matchMedia("(max-width: 768px)");
        const handler = () => setIsMobile(mq.matches);
        handler();
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    /* =======================
       MARKERS
       Note: Markers are already filtered by VITE_TENANT_DISTRICT in MapController
    ======================= */
    const markers = allMarkers;

    /* =======================
       NAVIGATION
    ======================= */
    const goToCity = (slug) => {
        if (!slug) return;
        const citySlug = extractCityFromSlug(slug);
        router.visit(`/${locale}/${citySlug}`);
    };

    const hasTenantState = !!TENANT_STATE_CODE;

    /* =======================
       RENDER
    ======================= */
    return (
        <div
            className="map-box"
            style={{
                minHeight: isMobile ? "520px" : "640px",
                maxWidth: isMobile ? "100%" : "960px",
                margin: "0 auto",
            }}
        >
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    center: hasTenantState
                        ? [TENANT_CENTER_LNG, TENANT_CENTER_LAT]
                        : [9.5, 51.5],
                    scale: isMobile
                        ? hasTenantState
                            ? TENANT_SCALE_MOBILE
                            : 3400
                        : hasTenantState
                        ? TENANT_SCALE_DESKTOP
                        : 2400,
                }}
                style={{ width: "100%", height: "100%" }}
            >
                {/* ===== STATES ===== */}
                <Geographies geography={DE_STATES_URL}>
                    {({ geographies }) => {
                        const visibleGeos = hasTenantState
                            ? geographies.filter(
                                  (g) => g?.properties?.id === TENANT_STATE_CODE
                              )
                            : geographies;

                        return visibleGeos.map((geo) => (
                            <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                style={{
                                    default: {
                                        fill: "var(--site-primary-color)",
                                        stroke: "var(--site-secondary-color)",
                                        strokeWidth: 1,
                                    },
                                    hover: {
                                        fill: "var(--site-secondary-color)",
                                    },
                                }}
                            />
                        ));
                    }}
                </Geographies>

                {/* ===== MARKERS (ONLY CITY) ===== */}
                {markers.map((m) => (
                    <Marker
                        key={m.id}
                        coordinates={[m.longitude, m.latitude]}
                        onMouseEnter={() => {
                            setActiveId?.(m.id);
                            setHoveredMarker(m);
                        }}
                        onMouseLeave={() => {
                            setActiveId?.(null);
                            setHoveredMarker(null);
                        }}
                        onClick={() => goToCity(m.slug)}
                        style={{ cursor: "pointer" }}
                    >
                        <circle
                            r={activeId === m.id ? 14 : 12}
                            style={{
                                fill: "var(--site-primary-color)",
                                opacity: 0.28,
                                transition: "r .2s",
                            }}
                        />

                        <circle
                            r={activeId === m.id ? 9 : 7}
                            style={{
                                fill: "var(--site-primary-color)",
                                stroke: "#fff",
                                strokeWidth: 1.4,
                                transition: "r .2s",
                            }}
                        />

                        {hoveredMarker?.id === m.id && (
                            <g
                                transform="translate(0, -26)"
                                pointerEvents="none"
                                style={{
                                    filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.25))",
                                }}
                            >
                                <rect
                                    x={-(m.name.length * 3.5 + 12)}
                                    y={-18}
                                    width={m.name.length * 7 + 24}
                                    height={22}
                                    rx={11}
                                    ry={11}
                                    fill="#111827"
                                    opacity={0.95}
                                />

                                <text
                                    x={0}
                                    y={-3}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    style={{
                                        fill: "#ffffff",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        letterSpacing: "0.3px",
                                        fontFamily:
                                            "Inter, system-ui, -apple-system, BlinkMacSystemFont",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {m.name}
                                </text>
                            </g>
                        )}
                    </Marker>
                ))}
            </ComposableMap>
        </div>
    );
};

export default memo(GermanyMap);
