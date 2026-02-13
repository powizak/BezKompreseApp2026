import React from 'react';
import type { BadgeDefinition } from '../../types/badges';
import { BADGE_CATEGORIES } from '../../config/badges';
import * as Icons from 'lucide-react';

interface BadgeIconProps {
    badge: BadgeDefinition;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    isLocked?: boolean;
    showTooltip?: boolean;
    className?: string; // Additional classes
}

const SIZE_CLASSES = {
    sm: 'w-8 h-8',  // 32px
    md: 'w-12 h-12', // 48px
    lg: 'w-20 h-20', // 80px
    xl: 'w-32 h-32', // 128px
};

const ICON_SIZES = {
    sm: 14,
    md: 20,
    lg: 32,
    xl: 48,
};

export const BadgeIcon: React.FC<BadgeIconProps> = ({
    badge,
    size = 'md',
    isLocked = false,
    className = ''
}) => {
    const IconComponent = (Icons as any)[badge.icon] || Icons.Award;
    const categoryConfig = BADGE_CATEGORIES[badge.category];

    // Base hexagon style
    // Clip-path for a hexagon
    const hexagonClipPath = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';

    // Determine colors
    let bgClass = categoryConfig.bg;
    let textClass = categoryConfig.color;

    if (isLocked) {
        bgClass = 'bg-gray-200';
        textClass = 'text-gray-400';
    } else {
        // We can add specific metallic gradients here later if requested
        // For now, using the category config colors

        // Overrides for metals if we want
        if (badge.category === 'technical') {
            // Blueish/Silver
        }
    }

    return (
        <div
            className={`relative flex items-center justify-center ${SIZE_CLASSES[size]} ${className}`}
            style={{
                clipPath: hexagonClipPath,
                backgroundColor: isLocked ? '#e5e7eb' : undefined
            }}
            title={badge.name}
        >
            {/* Background with color/gradient */}
            <div
                className={`absolute inset-0 ${isLocked ? 'bg-gray-200' : bgClass}`}
            />

            {/* Inner subtle border effect (optional, via nested div with margin) */}
            <div className={`z-10 flex items-center justify-center ${isLocked ? 'text-gray-400' : textClass}`}>
                {isLocked ? (
                    <Icons.Lock size={ICON_SIZES[size]} />
                ) : (
                    <IconComponent size={ICON_SIZES[size]} strokeWidth={1.5} />
                )}
            </div>

        </div>
    );
};
