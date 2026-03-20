import { X, Share2, MessageCircle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { shareContent } from '../utils/shareUtils';
import CachedImage from './CachedImage';
import UserAvatar from './UserAvatar';
import { getImageUrl } from '../lib/imageService';
import { formatDistanceToNow } from 'date-fns';
import { cs } from 'date-fns/locale';
import { createPortal } from 'react-dom';

export interface UnifiedQuickViewData {
    id: string;
    sourceType: 'car' | 'market';
    badgeLabel: string;
    badgeColorClass: string;
    title: string;
    subtitle: string;
    priceText: string | null;
    description: string;
    imageUrl: string | null;
    author: {
        userId: string;
        name: string;
        photoUrl?: string;
        isBKTeam?: boolean;
    };
    createdAt: Date;
    shareUrl: string;
}

interface MarketQuickViewProps {
    isOpen: boolean;
    onClose: () => void;
    data: UnifiedQuickViewData | null;
    onContact: (userId: string, userName: string) => void;
    currentUserId?: string;
}

export default function MarketQuickView({ isOpen, onClose, data, onContact, currentUserId }: MarketQuickViewProps) {
    if (!isOpen || !data) return null;

    const isOwner = currentUserId === data.author.userId;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
            <div 
                className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col md:flex-row"
                onClick={e => e.stopPropagation()}
            >
                {/* Close & Share absolute buttons */}
                <div className="absolute top-4 right-4 z-20 flex gap-2">
                    <button 
                        onClick={(e) => { e.preventDefault(); shareContent(data.title, data.subtitle, data.shareUrl, 'Sdílet inzerát'); }}
                        className="p-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full transition-all"
                        aria-label="Sdílet inzerát"
                    >
                        <Share2 size={20} />
                    </button>
                    <button 
                        onClick={onClose}
                        className="p-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full transition-all"
                        aria-label="Zavřít"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Media Section */}
                <div className="md:w-1/2 h-64 md:h-auto relative bg-slate-100 shrink-0">
                    {data.imageUrl ? (
                        <CachedImage 
                            src={getImageUrl(data.imageUrl, 'large')} 
                            alt={data.title} 
                            className="w-full h-full object-cover" 
                            priority={true}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                            <div className="font-black text-6xl opacity-20 tracking-tighter">{data.title.substring(0, 2).toUpperCase()}</div>
                        </div>
                    )}
                    
                    {/* Badge */}
                    <div className="absolute top-4 left-4 z-10">
                        <span className={`${data.badgeColorClass} text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-lg`}>
                            {data.badgeLabel}
                        </span>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                </div>

                {/* Content Section */}
                <div className="md:w-1/2 p-6 md:p-10 flex flex-col overflow-y-auto">
                    <div className="flex-1">
                        <div className="mb-4">
                            <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-none tracking-tighter mb-2">
                                {data.title}
                            </h2>
                            {data.subtitle && (
                                <p className="text-brand-contrast/50 font-bold tracking-tight text-lg mb-4">{data.subtitle}</p>
                            )}
                        </div>

                        {data.priceText && (
                            <div className="inline-block bg-slate-50 border border-slate-100 text-slate-900 font-black text-2xl px-5 py-2.5 rounded-2xl mb-8 shadow-sm">
                                {data.priceText}
                            </div>
                        )}

                        <div className="prose prose-slate text-slate-600 mb-8 whitespace-pre-wrap leading-relaxed">
                            {data.description || 'Bez popisu.'}
                        </div>
                    </div>

                    {/* Footer / Actions */}
                    <div className="mt-auto space-y-6">
                        {/* Author info */}
                        <div className="flex items-center gap-3 py-5 border-t border-slate-100">
                            <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden shrink-0 shadow-sm border border-slate-200">
                                <UserAvatar user={{ photoURL: data.author.photoUrl, displayName: data.author.name, isBKTeam: data.author.isBKTeam }} className="w-full h-full" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 text-base truncate">{data.author.name}</p>
                                <p className="text-slate-500 font-medium text-sm">{formatDistanceToNow(data.createdAt, { addSuffix: true, locale: cs })}</p>
                            </div>
                        </div>

                        {/* CTAs */}
                        <div className="flex flex-col gap-3">
                            {!isOwner && (
                                <button 
                                    onClick={() => {
                                        onClose();
                                        onContact(data.author.userId, data.author.name);
                                    }}
                                    className="w-full bg-brand text-slate-900 font-black py-4 rounded-xl hover:bg-[#E6C000] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/20"
                                >
                                    <MessageCircle size={20} />
                                    Napsat zprávu
                                </button>
                            )}

                            <Link 
                                to={data.shareUrl.replace(window.location.origin, '')}
                                onClick={onClose}
                                className="w-full bg-slate-50 text-slate-600 font-bold py-3.5 rounded-xl hover:bg-slate-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                            >
                                <ExternalLink size={18} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                                Zobrazit plný detail
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

