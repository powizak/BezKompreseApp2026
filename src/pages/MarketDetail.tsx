import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Effect } from 'effect';
import { DataService, DataServiceLive } from '../services/DataService';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl } from '../lib/imageService';
import { useChat } from '../contexts/ChatContext';
import { type MarketplaceListing, LISTING_TYPE_LABELS, LISTING_TYPE_COLORS } from '../types';
import CachedImage from '../components/CachedImage';
import LoadingState from '../components/LoadingState';
import UserAvatar from '../components/UserAvatar';
import ChatDrawer from '../components/ChatDrawer';
import { ArrowLeft, MessageCircle, Calendar, Tag, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cs } from 'date-fns/locale';

export default function MarketDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { activeChat, openChat, closeChat } = useChat();

    const [listing, setListing] = useState<MarketplaceListing | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const dataService = Effect.runSync(
        Effect.gen(function* (_) {
            return yield* _(DataService);
        }).pipe(Effect.provide(DataServiceLive))
    );

    useEffect(() => {
        if (!id) return;
        loadListing();
    }, [id]);

    const loadListing = async () => {
        setLoading(true);
        try {
            // We need to fetch all listings and find the one (since we don't have getListingById yet or it's just a ref to the collection)
            // Implementation detail: In a real app we'd have getListingById. 
            // For now, let's reuse getMarketplaceListings and filter, or add getListingById to DataService.
            // Assuming getMarketplaceListings returns all, which might be inefficient but works for now. 
            // Better approach: Add getListingById to DataService if possible, or just use what we have.
            // Let's try to fetch all for now as per current pattern in Market.tsx

            // OPTIMIZATION: In a large app, we should fetch single document. 
            // For this phase, we'll fetch all and find. 
            const allListings = await Effect.runPromise(dataService.getMarketplaceListings());
            const found = allListings.find(l => l.id === id);

            if (found) {
                setListing(found);
            } else {
                setError('Inzerát nebyl nalezen.');
            }
        } catch (e) {
            console.error('Failed to load listing', e);
            setError('Nepodařilo se načíst inzerát.');
        } finally {
            setLoading(false);
        }
    };

    const handleContact = async () => {
        if (!user || !listing) return;
        try {
            const roomId = await Effect.runPromise(
                dataService.getOrCreateChatRoom(
                    user.uid, user.displayName || 'Já', user.photoURL,
                    listing.userId, listing.userName, null
                )
            );
            openChat(roomId, listing.userId, listing.userName);
        } catch (e) {
            console.error('Failed to open chat', e);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: listing?.title || 'Inzerát na Bez Komprese',
                    text: listing?.description,
                    url: window.location.href,
                });
            } catch (err) {
                console.error('Share failed', err);
            }
        } else {
            // Fallback for desktop: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            alert('Odkaz zkopírován do schránky!');
        }
    };

    if (loading) return <LoadingState message="Načítám inzerát..." />;

    if (error || !listing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <p className="text-slate-500 font-medium">{error || 'Inzerát nenalezen'}</p>
                <button
                    onClick={() => navigate('/market')}
                    className="text-brand font-bold hover:underline"
                >
                    Zpět na bazar
                </button>
            </div>
        );
    }

    const typeColors = LISTING_TYPE_COLORS[listing.type];
    const typeLabel = LISTING_TYPE_LABELS[listing.type];

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-20">
            {/* Header / Nav */}
            <div className="mb-6 flex items-center justify-between">
                <button
                    onClick={() => navigate('/market')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium"
                >
                    <ArrowLeft size={20} />
                    Zpět na bazar
                </button>

                <button
                    onClick={handleShare}
                    className="p-2 text-slate-400 hover:text-brand transition-colors rounded-full hover:bg-brand/10"
                >
                    <Share2 size={20} />
                </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Image Section */}
                {listing.imageUrl ? (
                    <div className="aspect-video w-full bg-slate-100 relative">
                        <CachedImage
                            src={getImageUrl(listing.imageUrl, 'large')}
                            alt={listing.title}
                            priority={true}
                            className="w-full h-full object-contain bg-black/5"
                        />
                        <div className="absolute top-4 left-4">
                            <span className={`${typeColors.bg} ${typeColors.text} px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider shadow-sm`}>
                                {typeLabel}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="h-48 bg-slate-50 relative flex flex-col items-center justify-center text-slate-300 border-b border-slate-100">
                        <Tag size={48} strokeWidth={1.5} className="mb-2" />
                        <span className="text-sm font-medium">Bez fotografie</span>
                        <div className="absolute top-4 left-4">
                            <span className={`${typeColors.bg} ${typeColors.text} px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider shadow-sm`}>
                                {typeLabel}
                            </span>
                        </div>
                    </div>
                )}

                <div className="p-6 md:p-8 space-y-8">
                    {/* Title & Price */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="space-y-2">
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                                {listing.title}
                            </h1>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    {formatDistanceToNow(listing.createdAt.toDate ? listing.createdAt.toDate() : new Date(listing.createdAt), { addSuffix: true, locale: cs })}
                                </span>
                            </div>
                        </div>

                        {listing.price && (
                            <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-xl md:text-2xl whitespace-nowrap shadow-lg shadow-slate-200">
                                {listing.price.toLocaleString('cs-CZ')} Kč
                            </div>
                        )}
                    </div>

                    <hr className="border-slate-100" />

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Description */}
                        <div className="md:col-span-2 space-y-4">
                            <h3 className="text-lg font-bold text-slate-900">Popis</h3>
                            <div className="prose prose-slate max-w-none text-slate-600 whitespace-pre-wrap">
                                {listing.description}
                            </div>
                        </div>

                        {/* Sidebar / Seller Info */}
                        <div className="space-y-6">
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Inzerent</h3>
                                <div className="flex items-center gap-3 mb-6">
                                    <UserAvatar
                                        user={{ photoURL: listing.userPhotoURL, displayName: listing.userName, isBKTeam: listing.isBKTeam }}
                                        size={12}
                                    />
                                    <div>
                                        <div className="font-bold text-slate-900">{listing.userName}</div>
                                        <div className="text-xs text-slate-500">Člen komunity</div>
                                    </div>
                                </div>

                                {user?.uid !== listing.userId ? (
                                    <button
                                        onClick={handleContact}
                                        className="w-full bg-brand text-slate-900 font-bold py-3 rounded-xl hover:bg-brand-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/20"
                                    >
                                        <MessageCircle size={20} />
                                        Napsat zprávu
                                    </button>
                                ) : (
                                    <div className="text-center text-sm text-slate-500 italic">
                                        Toto je váš inzerát
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Drawer */}
            {activeChat && (
                <ChatDrawer
                    roomId={activeChat.roomId}
                    recipientId={activeChat.recipientId}
                    recipientName={activeChat.recipientName}
                    onClose={closeChat}
                />
            )}
        </div>
    );
}
