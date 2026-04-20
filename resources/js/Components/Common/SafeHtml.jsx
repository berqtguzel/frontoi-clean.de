import React from "react";
import { safeParse } from "@/utils/safeParse";

/**
 * Güvenli HTML içeriğini (API'den gelen metinleri) bir React öğesi içinde render eder.
 * @param {string} html - HTML içeriği.
 * @param {string} as - İçeriği sarmalayacak etiket (Örn: 'span', 'p', 'h1'). Varsayılan: 'span'
 */
export default function SafeHtml({ html, as: Tag = "span", ...rest }) {
    if (!html) return null;

   
    
    return (
        <Tag {...rest} suppressHydrationWarning={true}>
        
            {safeParse(html)}
        </Tag>
    );
}