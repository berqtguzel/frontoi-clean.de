/**
 * Görsel optimizasyon utility'leri
 * WebP desteği, lazy loading threshold, ve boyut optimizasyonu
 */

/**
 * WebP format desteğini kontrol eder
 */
export function supportsWebP() {
    if (typeof window === 'undefined') return false;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * Görsel URL'ini WebP formatına dönüştürür (eğer destekleniyorsa)
 * @param {string} url - Orijinal görsel URL'i
 * @returns {string} - WebP formatında URL veya orijinal URL
 */
export function getWebPUrl(url) {
    if (!url) return url;
    
    // Eğer zaten WebP formatındaysa, değiştirme
    if (url.includes('.webp')) return url;
    
    // WebP destekleniyorsa, URL'i WebP formatına dönüştür
    if (supportsWebP()) {
        // URL'deki dosya uzantısını .webp ile değiştir
        return url.replace(/\.(jpg|jpeg|png|gif)(\?.*)?$/i, '.webp$2');
    }
    
    return url;
}

/**
 * Image CDN optimizasyonu - boyut ve kalite parametreleri ekler
 * @param {string} url - Görsel URL'i
 * @param {Object} options - Optimizasyon seçenekleri
 * @returns {string} - Optimize edilmiş URL
 */
export function optimizeImageForCDN(url, options = {}) {
    if (!url) return url;
    
    const {
        width = null,
        height = null,
        quality = 85,
        format = 'webp',
        fit = 'cover',
    } = options;
    
    // Eğer URL zaten query parametreleri içeriyorsa
    const urlObj = new URL(url.startsWith('http') ? url : `https://example.com${url}`);
    
    // Format
    if (format === 'webp' && supportsWebP()) {
        urlObj.searchParams.set('format', 'webp');
    }
    
    // Boyut
    if (width) urlObj.searchParams.set('w', width);
    if (height) urlObj.searchParams.set('h', height);
    
    // Kalite
    urlObj.searchParams.set('q', quality);
    
    // Fit mode
    urlObj.searchParams.set('fit', fit);
    
    // Return relative URL if original was relative
    if (!url.startsWith('http')) {
        return urlObj.pathname + urlObj.search;
    }
    
    return urlObj.toString();
}

/**
 * Responsive görsel için srcset oluşturur
 * @param {string} baseUrl - Temel görsel URL'i
 * @param {number[]} widths - İstenen genişlikler (örn: [400, 800, 1200])
 * @returns {Object} - { srcset: string, srcsetWebP: string }
 */
export function generateSrcSet(baseUrl, widths = [400, 800, 1200, 1920]) {
    if (!baseUrl) return { srcset: '', srcsetWebP: '' };
    
    const webPUrl = getWebPUrl(baseUrl);
    const originalUrl = baseUrl;
    
    // WebP srcset
    const srcsetWebP = widths.map(width => {
        // URL'de width parametresi ekle veya dosya adına ekle
        if (webPUrl.includes('?')) {
            return `${webPUrl}&w=${width} ${width}w`;
        }
        // Dosya adına width ekle
        const webP = webPUrl.replace(/(\.webp|\.jpg|\.jpeg|\.png)(\?.*)?$/i, `_${width}w$1`);
        return `${webP} ${width}w`;
    }).join(', ');
    
    // Fallback srcset (orijinal format)
    const srcset = widths.map(width => {
        if (originalUrl.includes('?')) {
            return `${originalUrl}&w=${width} ${width}w`;
        }
        const fallback = originalUrl.replace(/(\.jpg|\.jpeg|\.png|\.webp)(\?.*)?$/i, `_${width}w$1`);
        return `${fallback} ${width}w`;
    }).join(', ');
    
    return { srcset, srcsetWebP };
}

/**
 * Lazy loading için optimize edilmiş Intersection Observer ayarları
 * @param {number} threshold - Görünürlük threshold'u (0-1 arası)
 * @param {string} rootMargin - Root margin (örn: "100px" veya "50%")
 * @returns {Object} - IntersectionObserver options
 */
export function getLazyLoadOptions(threshold = 0.1, rootMargin = '400px') {
    return {
        root: null,
        rootMargin,
        threshold,
    };
}

/**
 * Görsel boyutunu optimize eder (responsive için)
 * @param {string} url - Görsel URL'i
 * @param {number} maxWidth - Maksimum genişlik
 * @returns {string} - Optimize edilmiş URL
 */
export function optimizeImageUrl(url, maxWidth = 1920) {
    if (!url) return url;
    
    // Eğer URL zaten query parametreleri içeriyorsa
    if (url.includes('?')) {
        return `${url}&w=${maxWidth}`;
    }
    
    // WebP formatına dönüştür
    const webPUrl = getWebPUrl(url);
    
    // Eğer WebP destekleniyorsa ve URL değiştiyse
    if (webPUrl !== url && supportsWebP()) {
        return `${webPUrl}?w=${maxWidth}`;
    }
    
    return `${url}?w=${maxWidth}`;
}

/**
 * Görsel yükleme durumunu yönetir
 */
export class ImageLoader {
    constructor(options = {}) {
        this.options = {
            threshold: 0.1,
            rootMargin: '400px',
            ...options,
        };
    }
    
    /**
     * Lazy loading için Intersection Observer oluşturur
     * @param {HTMLElement} element - Gözlemlenecek element
     * @param {Function} callback - Görünür olduğunda çağrılacak callback
     * @returns {IntersectionObserver} - Observer instance
     */
    observe(element, callback) {
        if (!element) return null;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    callback(entry);
                    observer.unobserve(entry.target);
                }
            });
        }, this.options);
        
        observer.observe(element);
        return observer;
    }
}

