import { useEffect, useState, useMemo, useRef } from 'react';
import { Effect } from 'effect';
import { DataService, DataServiceLive } from '../services/DataService';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl } from '../lib/imageService';
import { useChat } from '../contexts/ChatContext';
import type { Car, MarketplaceListing, ListingType } from '../types';
import { LISTING_TYPE_LABELS, LISTING_TYPE_COLORS } from '../types';
import LoginRequired from '../components/LoginRequired';
import ChatDrawer from '../components/ChatDrawer';
import CachedImage from '../components/CachedImage';
import { compressImage } from '../lib/imageOptimizer';
import {
    Store, ShoppingBag, Search, Plus, X, MessageCircle, Tag, User,
    CarFront, Gauge, Calendar, Check, AlertCircle, Camera, Save, Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cs } from 'date-fns/locale';

type TabType = 'cars' | 'listings';

export default function Market() {
    const { user } = useAuth();
    const { activeChat, openChat, closeChat } = useChat();
    const [activeTab, setActiveTab] = useState<TabType>('cars');
    const [carsForSale, setCarsForSale] = useState<Car[]>([]);
    const [listings, setListings] = useState<MarketplaceListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // New listing form
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        type: 'wanted_car' as ListingType,
        title: '',
        description: '',
        price: '',
        imageUrl: ''
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const dataService = Effect.runSync(
        Effect.gen(function* (_) {
            return yield* _(DataService);
        }).pipe(Effect.provide(DataServiceLive))
    );

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        loadData();
    }, [user]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [cars, allListings] = await Promise.all([
                Effect.runPromise(dataService.getCarsForSale()),
                Effect.runPromise(dataService.getMarketplaceListings())
            ]);
            setCarsForSale(cars);
            setListings(allListings);
        } catch (e) {
            console.error('Failed to load marketplace data', e);
        } finally {
            setLoading(false);
        }
    };

    // Filter by search query
    const filteredCars = useMemo(() => {
        if (!searchQuery.trim()) return carsForSale;
        const q = searchQuery.toLowerCase();
        return carsForSale.filter(car =>
            car.make.toLowerCase().includes(q) ||
            car.model.toLowerCase().includes(q) ||
            car.name.toLowerCase().includes(q) ||
            car.saleDescription?.toLowerCase().includes(q)
        );
    }, [carsForSale, searchQuery]);

    const filteredListings = useMemo(() => {
        if (!searchQuery.trim()) return listings;
        const q = searchQuery.toLowerCase();
        return listings.filter(l =>
            l.title.toLowerCase().includes(q) ||
            l.description.toLowerCase().includes(q)
        );
    }, [listings, searchQuery]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                alert('Obrázek je příliš velký (max 5MB).');
                return;
            }
            setSelectedFile(file);
        }
    };

    const resetForm = () => {
        setFormData({ type: 'wanted_car', title: '', description: '', price: '', imageUrl: '' });
        setSelectedFile(null);
        setShowForm(false);
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        setError(null);

        try {
            // Create listing first to get ID
            const listingId = await Effect.runPromise(dataService.addMarketplaceListing({
                userId: user.uid,
                userName: user.displayName || 'Uživatel',
                userPhotoURL: user.photoURL || undefined,
                type: formData.type,
                title: formData.title,
                description: formData.description,
                price: formData.price ? parseInt(formData.price) : undefined,
                imageUrl: '',
                isActive: true
            }));

            // Upload image if selected
            if (selectedFile) {
                const compressed = await compressImage(selectedFile);
                const imageUrl = await Effect.runPromise(dataService.uploadListingImage(compressed, listingId));
                await Effect.runPromise(dataService.updateMarketplaceListing(listingId, { imageUrl }));
            }

            resetForm();
            loadData();
        } catch (err) {
            console.error('Failed to create listing', err);
            setError('Nepodařilo se vytvořit inzerát. Zkuste to znovu.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteListing = async (listingId: string) => {
        if (!confirm('Opravdu chcete smazat tento inzerát?')) return;
        try {
            await Effect.runPromise(dataService.deleteMarketplaceListing(listingId));
            setListings(prev => prev.filter(l => l.id !== listingId));
        } catch (e) {
            console.error('Failed to delete listing', e);
        }
    };

    const handleMarkAsSold = async (carId: string) => {
        if (!confirm('Označit auto jako prodané? Přesune se do historie.')) return;
        try {
            await Effect.runPromise(dataService.markCarAsSold(carId));
            setCarsForSale(prev => prev.filter(c => c.id !== carId));
        } catch (e) {
            console.error('Failed to mark car as sold', e);
        }
    };

    const handleContact = async (targetUserId: string, targetUserName: string) => {
        if (!user) return;
        try {
            const roomId = await Effect.runPromise(
                dataService.getOrCreateChatRoom(
                    user.uid, user.displayName || 'Já', user.photoURL,
                    targetUserId, targetUserName, null
                )
            );
            openChat(roomId, targetUserId, targetUserName);
        } catch (e) {
            console.error('Failed to open chat', e);
        }
    };

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return formatDistanceToNow(date, { addSuffix: true, locale: cs });
    };

    if (!user) {
        return (
            <LoginRequired
                title="Bazar je zamčený"
                message="Pro procházení inzerátů a nabídek se musíte přihlásit."
                icon={Store}
            />
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand text-brand-contrast rounded-2xl shadow-lg shadow-brand/20">
                        <Store size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Bazar</h1>
                        <p className="text-sm text-slate-500 font-medium">
                            {activeTab === 'cars' ? `${filteredCars.length} aut na prodej` : `${filteredListings.length} inzerátů`}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setShowForm(true)}
                    className="bg-brand text-slate-900 px-5 py-3 rounded-xl font-bold shadow-lg shadow-brand/20 hover:bg-brand-dark hover:shadow-brand/40 transition-all flex items-center gap-2"
                >
                    <Plus size={20} />
                    Nový inzerát
                </button>
            </div>

            {/* Search & Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    {/* Tabs */}
                    <div className="flex bg-slate-100 rounded-xl p-1">
                        <button
                            onClick={() => setActiveTab('cars')}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'cars' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <CarFront size={18} />
                            Prodej aut
                        </button>
                        <button
                            onClick={() => setActiveTab('listings')}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'listings' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <ShoppingBag size={18} />
                            Poptávky
                        </button>
                    </div>

                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder={activeTab === 'cars' ? 'Hledat auta...' : 'Hledat inzeráty...'}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
                </div>
            ) : activeTab === 'cars' ? (
                /* Cars for Sale Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCars.length > 0 ? filteredCars.map(car => (
                        <div key={car.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-xl transition-all duration-300">
                            {/* Image */}
                            <div className="aspect-video bg-slate-100 relative overflow-hidden">
                                {car.photos && car.photos.length > 0 ? (
                                    <CachedImage src={getImageUrl(car.photos[0], 'thumb')} alt={car.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                        <CarFront size={48} strokeWidth={1.5} />
                                    </div>
                                )}
                                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>

                                {/* Sale Badge */}
                                <div className="absolute top-3 left-3 z-20">
                                    <span className="bg-green-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-lg flex items-center gap-1">
                                        <Tag size={12} />
                                        Na prodej
                                    </span>
                                </div>

                                {/* Price */}
                                {car.salePrice && (
                                    <div className="absolute top-3 right-3 z-20">
                                        <span className="bg-white/95 text-slate-900 text-sm font-black px-3 py-1 rounded-lg shadow-lg">
                                            {car.salePrice.toLocaleString('cs-CZ')} Kč
                                        </span>
                                    </div>
                                )}

                                <div className="absolute bottom-0 left-0 p-4 text-white">
                                    <h3 className="font-black text-xl tracking-tight leading-none mb-1">{car.name}</h3>
                                    <p className="text-sm font-medium opacity-90">{car.make} {car.model} {car.year}</p>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                {car.saleDescription && (
                                    <p className="text-slate-600 text-sm mb-3 line-clamp-2">{car.saleDescription}</p>
                                )}

                                <div className="flex gap-2 mb-4">
                                    <span className="flex items-center gap-1 text-xs font-bold bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                        <Gauge size={12} className="text-brand" /> {car.power} kW
                                    </span>
                                    <span className="flex items-center gap-1 text-xs font-bold bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                        <Calendar size={12} className="text-brand" /> {car.year}
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    {car.ownerId === user?.uid ? (
                                        <button
                                            onClick={() => handleMarkAsSold(car.id)}
                                            className="flex-1 bg-green-500 text-white font-bold py-2.5 rounded-xl hover:bg-green-600 transition-all flex items-center justify-center gap-2 text-sm"
                                        >
                                            <Check size={16} />
                                            Prodáno
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleContact(car.ownerId, car.name)}
                                            className="flex-1 bg-brand text-slate-900 font-bold py-2.5 rounded-xl hover:bg-brand-dark transition-all flex items-center justify-center gap-2 text-sm"
                                        >
                                            <MessageCircle size={16} />
                                            Kontaktovat
                                        </button>
                                    )}
                                    <Link
                                        to={`/car/${car.id}`}
                                        className="bg-slate-100 text-slate-700 font-bold py-2.5 px-4 rounded-xl hover:bg-slate-200 transition-all text-sm"
                                    >
                                        Detail
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full py-16 text-center">
                            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                <CarFront size={40} className="text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 mb-2">Žádná auta na prodej</h3>
                            <p className="text-slate-500 text-sm">
                                {searchQuery ? 'Zkuste upravit vyhledávání' : 'Buďte první, kdo nabídne své auto'}
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                /* Listings Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredListings.length > 0 ? filteredListings.map(listing => {
                        const colors = LISTING_TYPE_COLORS[listing.type];
                        return (
                            <div key={listing.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-xl transition-all duration-300">
                                {/* Image */}
                                <div className="aspect-video bg-slate-100 relative overflow-hidden">
                                    {listing.imageUrl ? (
                                        <CachedImage src={getImageUrl(listing.imageUrl, 'thumb')} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                            <ShoppingBag size={48} strokeWidth={1.5} />
                                        </div>
                                    )}

                                    {/* Type Badge */}
                                    <div className="absolute top-3 left-3 z-20">
                                        <span className={`${colors.bg} ${colors.text} text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-sm`}>
                                            {LISTING_TYPE_LABELS[listing.type]}
                                        </span>
                                    </div>

                                    {/* Price */}
                                    {listing.price && (
                                        <div className="absolute top-3 right-3 z-20">
                                            <span className="bg-white/95 text-slate-900 text-sm font-black px-3 py-1 rounded-lg shadow-lg">
                                                {listing.price.toLocaleString('cs-CZ')} Kč
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <h3 className="font-bold text-lg text-slate-900 mb-1 line-clamp-1">{listing.title}</h3>
                                    <p className="text-slate-500 text-sm mb-3 line-clamp-2">{listing.description}</p>

                                    {/* Author & Time */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-100">
                                            {listing.userPhotoURL ? (
                                                <CachedImage src={listing.userPhotoURL} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                    <User size={14} />
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-500 font-medium">{listing.userName}</span>
                                        <span className="text-xs text-slate-400">•</span>
                                        <span className="text-xs text-slate-400">{formatTime(listing.createdAt)}</span>
                                    </div>

                                    <div className="flex gap-2">
                                        {listing.userId === user?.uid ? (
                                            <button
                                                onClick={() => handleDeleteListing(listing.id)}
                                                className="flex-1 bg-red-50 text-red-600 font-bold py-2.5 rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-2 text-sm"
                                            >
                                                <Trash2 size={16} />
                                                Smazat
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleContact(listing.userId, listing.userName)}
                                                className="flex-1 bg-brand text-slate-900 font-bold py-2.5 rounded-xl hover:bg-brand-dark transition-all flex items-center justify-center gap-2 text-sm"
                                            >
                                                <MessageCircle size={16} />
                                                Kontaktovat
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="col-span-full py-16 text-center">
                            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                <ShoppingBag size={40} className="text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 mb-2">Žádné poptávky</h3>
                            <p className="text-slate-500 text-sm">
                                {searchQuery ? 'Zkuste upravit vyhledávání' : 'Buďte první, kdo přidá poptávku'}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* New Listing Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Plus size={18} />
                                Nový inzerát
                            </h3>
                            <button onClick={resetForm} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 text-sm">
                                    <AlertCircle size={18} />
                                    {error}
                                </div>
                            )}

                            {/* Type */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Typ inzerátu</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(Object.keys(LISTING_TYPE_LABELS) as ListingType[]).map(type => {
                                        const colors = LISTING_TYPE_COLORS[type];
                                        return (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, type }))}
                                                className={`p-2 rounded-xl text-sm font-bold border-2 transition-all ${formData.type === type
                                                    ? `${colors.bg} ${colors.text} border-current`
                                                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                                    }`}
                                            >
                                                {LISTING_TYPE_LABELS[type]}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Název</label>
                                <input
                                    type="text"
                                    placeholder="např. Sháním rozvodový řemen pro 1.9 TDI"
                                    value={formData.title}
                                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Popis</label>
                                <textarea
                                    placeholder="Detaily, stav, požadavky..."
                                    value={formData.description}
                                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none resize-none"
                                    required
                                />
                            </div>

                            {/* Price */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Orientační cena (Kč)</label>
                                <input
                                    type="number"
                                    placeholder="např. 5000"
                                    value={formData.price}
                                    onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                                />
                            </div>

                            {/* Image */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Ilustrační foto</label>
                                {selectedFile ? (
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <Camera size={20} className="text-brand" />
                                        <span className="text-sm text-slate-600 flex-1 truncate">{selectedFile.name}</span>
                                        <button type="button" onClick={() => setSelectedFile(null)} className="text-red-500 hover:text-red-600">
                                            <X size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full p-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 hover:border-brand hover:text-brand transition-all flex items-center justify-center gap-2"
                                    >
                                        <Camera size={20} />
                                        Přidat obrázek
                                    </button>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    accept="image/png,image/jpeg,image/webp"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className={`w-full font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all ${saving
                                    ? 'bg-slate-400 text-white cursor-wait'
                                    : 'bg-brand text-slate-900 hover:bg-brand-dark shadow-lg shadow-brand/20'
                                    }`}
                            >
                                {saving ? 'Ukládám...' : (
                                    <>
                                        <Save size={18} />
                                        Vytvořit inzerát
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Chat Drawer */}
            {activeChat && (
                <ChatDrawer
                    roomId={activeChat.roomId}
                    recipientName={activeChat.recipientName}
                    onClose={closeChat}
                />
            )}
        </div>
    );
}
