import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DataService, DataServiceLive } from '../services/DataService';
import { Effect } from 'effect';

export type EmojiReaction = '❤️' | '🔥' | '😎' | '🚀' | '💩';
export const EMOJI_LIST: EmojiReaction[] = ['❤️', '🔥', '😎', '🚀', '💩'];

interface CarEmojiReactionsProps {
    carId: string;
    initialCounts?: Record<string, number>;
    variant?: 'small' | 'large';
    ownerId: string;
}

export const CarEmojiReactions: React.FC<CarEmojiReactionsProps> = ({ 
    carId, 
    initialCounts = {}, 
    variant = 'small',
    ownerId
}) => {
    const { user } = useAuth();
    const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
    const [userReaction, setUserReaction] = useState<EmojiReaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    const dataService = Effect.runSync(
        Effect.gen(function* (_) {
            return yield* _(DataService);
        }).pipe(Effect.provide(DataServiceLive))
    );

    // Fetch user's current reaction on mount
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchReaction = async () => {
            try {
                const reaction = await Effect.runPromise(
                    dataService.getUserCarReaction(carId, user.uid)
                );
                setUserReaction(reaction as EmojiReaction | null);
            } catch (error) {
                console.error("Failed to load user reaction", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReaction();
    }, [carId, user, dataService]);

    const handleReaction = async (emoji: EmojiReaction) => {
        if (!user) {
            // Probably should show login modal or toast, assuming silently fail or alert
            alert("Pro hodnocení se musíte přihlásit.");
            return;
        }
        if (user.uid === ownerId && false) {
            // Optional: prevent liking own car. But let's allow it for testing unless specified.
        }

        if (isUpdating) return;
        setIsUpdating(true);

        // Optimistic UI update
        const previousReaction = userReaction;
        const newCounts = { ...counts };

        if (previousReaction === emoji) {
            // Remove
            setUserReaction(null);
            newCounts[emoji] = Math.max(0, (newCounts[emoji] || 1) - 1);
        } else {
            // Change or Add
            if (previousReaction) {
                newCounts[previousReaction] = Math.max(0, (newCounts[previousReaction] || 1) - 1);
            }
            setUserReaction(emoji);
            newCounts[emoji] = (newCounts[emoji] || 0) + 1;
        }
        setCounts(newCounts);

        try {
            await Effect.runPromise(
                dataService.toggleCarReaction(carId, user.uid, emoji)
            );
        } catch (error) {
            console.error("Reaction failed, reverting...", error);
            // Revert on failure
            setCounts(counts); // revert to original counts from before the transition
            setUserReaction(previousReaction);
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) return <div className="h-8 animate-pulse bg-white/5 rounded-full w-24"></div>;

    const isLarge = variant === 'large';

    // Always show all emojis
    const emojisToShow = EMOJI_LIST;

    return (
        <div className={`flex flex-wrap items-center justify-center ${isLarge ? 'gap-3' : 'gap-1'}`}>
            {emojisToShow.map(emoji => {
                const count = counts[emoji] || 0;
                const isActive = userReaction === emoji;

                return (
                    <button
                        key={emoji}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleReaction(emoji); }}
                        disabled={isUpdating}
                        className={`
                            flex items-center justify-center transition-all duration-300 ease-out
                            ${isLarge 
                                ? `px-3 py-2 rounded-xl border border-white/10 ${isActive ? 'bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)] scale-105 border-white/20' : 'bg-transparent hover:bg-white/5 grayscale hover:grayscale-0'}`
                                : `px-2 py-1.5 rounded-full border border-transparent ${isActive ? 'bg-slate-100 shadow-sm scale-105 border-slate-200' : 'bg-transparent hover:bg-slate-50 grayscale hover:grayscale-0'}`
                            }
                            ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                        style={isLarge ? { backdropFilter: 'blur(10px)' } : {}}
                    >
                        <span className={`${isLarge ? 'text-xl drop-shadow-md' : 'text-base'} transform transition-transform ${isActive ? 'scale-110' : ''}`}>
                            {emoji}
                        </span>
                        {(count > 0 || isLarge) && (
                            <span className={`
                                font-medium tracking-tight ml-1.5
                                ${isLarge ? (isActive ? 'text-white' : 'text-white/60') : (isActive ? 'text-slate-700' : 'text-slate-400')}
                                ${isLarge ? 'text-sm' : 'text-xs'}
                            `}>
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};
