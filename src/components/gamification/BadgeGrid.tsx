import React, { useState, useMemo } from 'react';
import type { UserBadge } from '../../types/badges';
import { BADGES } from '../../config/badges';
import { BadgeIcon } from './BadgeIcon';
import { BadgeDetailModal } from './BadgeDetailModal';
import { Lock } from 'lucide-react';

interface BadgeGridProps {
    userBadges?: UserBadge[];
    className?: string;
}

export const BadgeGrid: React.FC<BadgeGridProps> = ({ userBadges = [], className = '' }) => {
    const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);

    // Create a map of earned badges for O(1) lookup
    const earnedBadgeMap = useMemo(() => {
        const map = new Map<string, UserBadge>();
        userBadges.forEach(b => map.set(b.badgeId, b));
        return map;
    }, [userBadges]);

    const sortedBadges = useMemo(() => {
        return [...BADGES].sort((a, b) => {
            const aEarned = earnedBadgeMap.has(a.id);
            const bEarned = earnedBadgeMap.has(b.id);

            // Earned first
            if (aEarned && !bEarned) return -1;
            if (!aEarned && bEarned) return 1;

            // Then by category
            return a.category.localeCompare(b.category);
        });
    }, [earnedBadgeMap]);

    const selectedBadgeDef = selectedBadgeId ? BADGES.find(b => b.id === selectedBadgeId) : null;
    const selectedUserBadge = selectedBadgeId ? earnedBadgeMap.get(selectedBadgeId) : null;

    return (
        <div className={`w-full ${className}`}>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 justify-items-center">
                {sortedBadges.map((badge) => {
                    const isEarned = earnedBadgeMap.has(badge.id);

                    return (
                        <button
                            key={badge.id}
                            onClick={() => setSelectedBadgeId(badge.id)}
                            className={`flex flex-col items-center group transition-transform active:scale-95 focus:outline-none`}
                        >
                            <div className={`relative transition-all duration-300 ${!isEarned ? 'opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100' : 'drop-shadow-sm group-hover:drop-shadow-md'}`}>
                                <BadgeIcon
                                    badge={badge}
                                    size="lg"
                                    isLocked={!isEarned}
                                />

                                {/* Mini Lock Icon for unearned */}
                                {!isEarned && (
                                    <div className="absolute -bottom-1 -right-1 bg-gray-100 rounded-full p-1 border border-white shadow-sm">
                                        <Lock size={10} className="text-gray-400" />
                                    </div>
                                )}
                            </div>

                            <span className={`mt-2 text-xs text-center font-medium max-w-[80px] leading-tight ${isEarned ? 'text-gray-700' : 'text-gray-400'
                                }`}>
                                {badge.name}
                            </span>
                        </button>
                    );
                })}
            </div>

            {selectedBadgeDef && (
                <BadgeDetailModal
                    isOpen={!!selectedBadgeId}
                    onClose={() => setSelectedBadgeId(null)}
                    badge={selectedBadgeDef}
                    userBadge={selectedUserBadge}
                />
            )}
        </div>
    );
};
