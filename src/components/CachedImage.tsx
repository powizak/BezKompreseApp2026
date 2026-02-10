import { useState, useEffect, useRef, type ImgHTMLAttributes } from 'react';

/**
 * In-memory cache: original URL → Object URL (blob)
 * Persists for the lifetime of the browser tab.
 * Eliminates redundant network requests during SPA navigation.
 */
const blobCache = new Map<string, string>();

/**
 * Pending fetches: original URL → Promise
 * Prevents duplicate concurrent fetches for the same image.
 */
const pendingFetches = new Map<string, Promise<string>>();

/**
 * Check if a URL is a remote image URL that should be cached.
 * Skips local assets, data URIs, blob URLs, and SVGs.
 */
function isCacheableUrl(url: string | undefined): boolean {
    if (!url) return false;
    if (url.startsWith('data:')) return false;
    if (url.startsWith('blob:')) return false;
    if (url.startsWith('/')) return false; // Local asset
    if (url.endsWith('.svg')) return false;
    return true;
}

/**
 * Fetch an image and create a blob URL for it.
 * Uses deduplication to prevent concurrent fetches of the same URL.
 */
async function fetchAndCacheImage(url: string): Promise<string> {
    // Already cached
    const cached = blobCache.get(url);
    if (cached) return cached;

    // Already fetching — wait for the same promise
    const pending = pendingFetches.get(url);
    if (pending) return pending;

    const fetchPromise = (async () => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);

            blobCache.set(url, objectUrl);
            return objectUrl;
        } catch {
            // On error, fall back to original URL
            return url;
        } finally {
            pendingFetches.delete(url);
        }
    })();

    pendingFetches.set(url, fetchPromise);
    return fetchPromise;
}

// --- Component ---

interface CachedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    /** Set to true to skip caching (e.g. for local previews) */
    noCache?: boolean;
}

/**
 * Drop-in replacement for <img> that caches remote images in-memory as blob URLs.
 * 
 * Features:
 * - In-memory blob cache eliminates re-fetches during SPA navigation
 * - Deduplicates concurrent requests for the same image
 * - Lazy loading by default for off-screen images
 * - Subtle fade-in animation on load
 * - Falls back to standard <img> for non-cacheable URLs
 */
export default function CachedImage({ src, alt, noCache, className, style, ...props }: CachedImageProps) {
    const [displaySrc, setDisplaySrc] = useState<string | undefined>(() => {
        // Synchronous check: if already in cache, use immediately (no flash)
        if (src && isCacheableUrl(src)) {
            const cached = blobCache.get(src);
            if (cached) return cached;
        }
        return src;
    });
    const [loaded, setLoaded] = useState(false);
    const prevSrcRef = useRef(src);

    useEffect(() => {
        // Reset loaded state when src changes
        if (prevSrcRef.current !== src) {
            setLoaded(false);
            prevSrcRef.current = src;
        }

        if (!src || noCache || !isCacheableUrl(src)) {
            setDisplaySrc(src);
            return;
        }

        // Check synchronous cache first
        const cached = blobCache.get(src);
        if (cached) {
            setDisplaySrc(cached);
            return;
        }

        // Async fetch and cache
        let cancelled = false;
        fetchAndCacheImage(src).then((blobUrl) => {
            if (!cancelled) {
                setDisplaySrc(blobUrl);
            }
        });

        return () => { cancelled = true; };
    }, [src, noCache]);

    return (
        <img
            src={displaySrc}
            alt={alt || ''}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className={className}
            style={{
                ...style,
                opacity: loaded ? 1 : 0,
                transition: 'opacity 0.3s ease',
            }}
            {...props}
        />
    );
}
