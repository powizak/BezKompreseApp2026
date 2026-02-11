import { useState, useCallback, type ImgHTMLAttributes } from 'react';

/**
 * Track which URLs have been loaded in this session.
 * Used to skip the fade-in animation for already-seen images.
 */
const seenUrls = new Set<string>();

interface CachedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    /** Set to true to skip fade-in animation */
    noCache?: boolean;
}

/**
 * Drop-in replacement for <img> that:
 * - Uses the browser's native HTTP cache (via Cache-Control headers set during upload)
 * - Shows a subtle fade-in on first load, instant on subsequent renders
 * - Lazy-loads off-screen images by default
 *
 * The browser cache with `Cache-Control: public, max-age=31536000, immutable`
 * already ensures images are never re-downloaded. No fetch() = no CORS issues.
 */
export default function CachedImage({ src, alt, noCache, className, style, onLoad, ...props }: CachedImageProps) {
    const alreadySeen = !!(src && seenUrls.has(src));
    const [loaded, setLoaded] = useState(alreadySeen);

    const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        if (src) seenUrls.add(src);
        setLoaded(true);
        onLoad?.(e);
    }, [src, onLoad]);

    return (
        <img
            src={src}
            alt={alt || ''}
            loading="lazy"
            onLoad={handleLoad}
            className={className}
            style={{
                ...style,
                opacity: loaded ? 1 : 0,
                transition: alreadySeen ? 'none' : 'opacity 0.3s ease',
            }}
            {...props}
        />
    );
}
