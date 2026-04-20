const CACHE_PREFIX = 'img_cache_';
const CACHE_VERSION = 'v1';
const CACHE_EXPIRE_MS = 7 * 24 * 60 * 60 * 1000;

function getCacheKey(url) {
    return `${CACHE_PREFIX}${CACHE_VERSION}_${btoa(url).replace(/[^a-zA-Z0-9]/g, '')}`;
}

export function getCachedImageUrl(url) {
    if (typeof window === 'undefined' || !url) return null;

    try {
        const cacheKey = getCacheKey(url);
        const cached = localStorage.getItem(cacheKey);

        if (!cached) return null;

        const data = JSON.parse(cached);
        const now = Date.now();

        if (now > data.expires) {
            localStorage.removeItem(cacheKey);
            return null;
        }

        return data.url;
    } catch (e) {
        console.warn('Image cache read error:', e);
        return null;
    }
}

export function cacheImageUrl(originalUrl, cachedUrl) {
    if (typeof window === 'undefined' || !originalUrl || !cachedUrl) return;

    try {
        const cacheKey = getCacheKey(originalUrl);
        const data = {
            url: cachedUrl,
            originalUrl: originalUrl,
            cachedAt: Date.now(),
            expires: Date.now() + CACHE_EXPIRE_MS,
        };

        localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            clearOldCache();
            try {
                const cacheKey = getCacheKey(originalUrl);
                const data = {
                    url: cachedUrl,
                    originalUrl: originalUrl,
                    cachedAt: Date.now(),
                    expires: Date.now() + CACHE_EXPIRE_MS,
                };
                localStorage.setItem(cacheKey, JSON.stringify(data));
            } catch (e2) {
                console.warn('Image cache write error after cleanup:', e2);
            }
        } else {
            console.warn('Image cache write error:', e);
        }
    }
}

function clearOldCache() {
    if (typeof window === 'undefined') return;

    try {
        const now = Date.now();
        const keysToRemove = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (now > data.expires) {
                        keysToRemove.push(key);
                    }
                } catch (e) {
                    keysToRemove.push(key);
                }
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (e) {
        console.warn('Cache cleanup error:', e);
    }
}

export async function loadAndCacheImage(url) {
    if (typeof window === 'undefined' || !url) return null;

    const normalizedUrl = url.split('?')[0];
    const cachedUrl = getCachedImageUrl(normalizedUrl);
    if (cachedUrl) {
        return cachedUrl;
    }

    try {
        if ('caches' in window) {
            try {
                const cache = await caches.open('oi-clean-images-v1');
                const cached = await cache.match(normalizedUrl);
                if (cached && cached.ok) {
                    cacheImageUrl(normalizedUrl, normalizedUrl);
                    return normalizedUrl;
                }
            } catch (e) {
            }
        }

        const optimizedUrl = url.includes('?')
            ? url
            : `${url}?format=webp&w=800&q=80`;

        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                cacheImageUrl(normalizedUrl, optimizedUrl);
                resolve(optimizedUrl);
            };

            img.onerror = () => {
                if (optimizedUrl !== url) {
                    const fallbackImg = new Image();
                    fallbackImg.crossOrigin = 'anonymous';
                    fallbackImg.onload = () => {
                        cacheImageUrl(normalizedUrl, url);
                        resolve(url);
                    };
                    fallbackImg.onerror = () => {
                        console.warn('Image load failed:', url);
                        resolve(null);
                    };
                    fallbackImg.src = url;
                } else {
                    console.warn('Image load failed:', url);
                    resolve(null);
                }
            };

            img.src = optimizedUrl;
        });
    } catch (e) {
        console.warn('Image load error:', e);
        return null;
    }
}

export function clearImageCache() {
    if (typeof window === 'undefined') return;

    try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (e) {
        console.warn('Cache clear error:', e);
    }
}
