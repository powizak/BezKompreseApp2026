import { User } from 'lucide-react';
import CachedImage from './CachedImage';
import { cn } from '../lib/utils';
import type { UserProfile } from '../types';
import { useState, useEffect } from 'react';

interface UserAvatarProps {
    user?: Partial<UserProfile> | null;
    photoURL?: string | null;
    displayName?: string | null;
    isBKTeam?: boolean;
    size?: number;
    className?: string;
    showBadge?: boolean;
}

export default function UserAvatar({
    user,
    photoURL,
    displayName,
    isBKTeam,
    size, // Optional explicit size for icon scaling
    className,
    showBadge = true
}: UserAvatarProps) {
    // Resolve data from user object or direct props
    const finalPhotoURLString = user?.photoURL ?? photoURL;
    const fallbackPhotoURL = user?.fallbackPhotoURL ?? null; // Google account photo URL
    const finalDisplayName = user?.displayName ?? displayName ?? 'Uživatel';
    // Explicit isBKTeam prop takes precedence, otherwise check user object
    const finalIsBKTeam = isBKTeam ?? user?.isBKTeam ?? false;

    const initialSrc = finalPhotoURLString || fallbackPhotoURL || null;

    // Track current image source with fallback support
    const [currentSrc, setCurrentSrc] = useState<string | null>(initialSrc);
    const [hasTriedFallback, setHasTriedFallback] = useState(false);

    // Reset when primary URL changes
    useEffect(() => {
        setCurrentSrc(finalPhotoURLString || fallbackPhotoURL || null);
        setHasTriedFallback(false);
    }, [finalPhotoURLString, fallbackPhotoURL]);

    const handleImageError = () => {
        // If main image fails and we haven't tried fallback yet, use Google URL
        if (!hasTriedFallback && fallbackPhotoURL) {
            setHasTriedFallback(true);
            setCurrentSrc(fallbackPhotoURL);
        }
    };

    return (
        <div className={cn("relative inline-block rounded-full", className)}>
            <div className="w-full h-full rounded-[inherit] overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-100 relative z-0">
                {currentSrc ? (
                    <CachedImage
                        src={currentSrc}
                        alt={finalDisplayName}
                        priority="low"
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                    />
                ) : (
                    <User size={size ? size * 0.5 : '50%'} className="text-slate-300" />
                )}
            </div>

            {/* BK Team Badge */}
            {showBadge && finalIsBKTeam && (
                <div className="absolute -top-[5%] -right-[5%] w-[45%] h-[45%] z-10 bg-white rounded-full p-[2px] shadow-sm border border-slate-100">
                    <img
                        src="/logo_120.webp"
                        alt="BK Team"
                        className="w-full h-full object-contain"
                    />
                </div>
            )}
        </div>
    );
}
