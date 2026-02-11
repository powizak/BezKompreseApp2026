import { useState, useEffect, type ImgHTMLAttributes } from 'react';
import { ImageLoader } from '../utils/ImageLoader';

/**
 * Track which URLs have been loaded in this session.
 * Used to skip the fade-in animation for already-seen images.
 */
const seenUrls = new Set<string>();

interface CachedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    /** Set to true to skip fade-in animation */
    noCache?: boolean;
    /** If true, this image will be loaded before standard images (e.g. car photos > avatars) */
    priority?: boolean;
}

/**
 * Drop-in replacement for <img> that:
 * - Uses a custom ImageLoader service to prevent 429 Too Many Requests
 * - Shows a subtle fade-in on first load, instant on subsequent renders
 * - Lazy-loads off-screen images by default
 */
export default function CachedImage({ src, alt, noCache, priority, className, style, onLoad, onError, ...props }: CachedImageProps) {
    const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!src) return;

        let isMounted = true;
        const load = async () => {
            try {
                // Use our loader which handles 429 backoff
                // This ensures the image is in the browser cache
                await ImageLoader.loadImage(src, priority);

                if (isMounted) {
                    // Now set the src, the browser will pull it from cache instantly
                    setImageSrc(src);
                }
            } catch (e) {
                // If Loader fails (timeout, 429, etc), we still try to set the SRC.
                // The browser might have partial data or handle it better directly.
                // If it fails again, the <img onError> will catch it.
                if (isMounted) {
                    // console.warn("Loader failed, falling back to direct render:", src);
                    setImageSrc(src);
                }
            }
        };

        load();

        return () => {
            isMounted = false;
        };
    }, [src]);

    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        if (src) seenUrls.add(src);
        setLoaded(true);
        onLoad?.(e);
    };

    const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        setError(true);
        onError?.(e);
    };

    // If fetch failed completely (e.g. 429 after retries), we don't render img or render fallback?
    // Using empty src or error handling.
    if (error) {
        return (
            <div className={`${className} bg-slate-100 flex items-center justify-center text-slate-300`}>
                <span className="text-xs">!</span>
            </div>
        );
    }

    return (
        <img
            src={imageSrc} // Use the blob URL from loader
            alt={alt || ''}
            loading="lazy"
            onLoad={handleLoad}
            onError={handleError}
            className={className}
            style={{
                ...style,
                opacity: (loaded && !error) ? 1 : 0,
                transition: (seenUrls.has(src!) || noCache) ? 'none' : 'opacity 0.3s ease',
            }}
            {...props}
        />
    );
}
