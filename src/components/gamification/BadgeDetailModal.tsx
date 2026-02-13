
import React from 'react';
import type { BadgeDefinition, UserBadge } from '../../types/badges';
import { BadgeIcon } from './BadgeIcon';
import { X } from 'lucide-react';

interface BadgeDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    badge: BadgeDefinition;
    userBadge?: UserBadge | null; // If null/undefined, badge is locked
}

export const BadgeDetailModal: React.FC<BadgeDetailModalProps> = ({
    isOpen,
    onClose,
    badge,
    userBadge
}) => {
    if (!isOpen) return null;

    const isLocked = !userBadge;
    const earnedDate = userBadge
        ? new Date(userBadge.earnedAt).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors z-10"
                >
                    <X size={20} />
                </button>

                {/* Content */}
                <div className="flex flex-col items-center p-8 text-center">

                    {/* Large Badge Icon */}
                    <div className="mb-6 relative">
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                        <BadgeIcon badge={badge} size="xl" isLocked={isLocked} className="relative shadow-lg" />
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {badge.name}
                    </h2>

                    {/* Status Badge */}
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${isLocked
                        ? 'bg-gray-100 text-gray-500'
                        : 'bg-green-100 text-green-700'
                        }`}>
                        {isLocked ? 'Uzamčeno' : 'Získáno'}
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 mb-6">
                        {badge.description}
                    </p>

                    {/* Criteria / Earned Date */}
                    <div className="w-full bg-gray-50 rounded-xl p-4 text-sm">
                        {isLocked ? (
                            <div>
                                <span className="block text-gray-400 font-medium mb-1 uppercase text-xs tracking-wider">Jak získat</span>
                                <span className="text-gray-700 font-medium">{badge.criteriaText}</span>
                            </div>
                        ) : (
                            <div>
                                <span className="block text-gray-400 font-medium mb-1 uppercase text-xs tracking-wider">Datum získání</span>
                                <span className="text-gray-900 font-medium">{earnedDate}</span>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};
