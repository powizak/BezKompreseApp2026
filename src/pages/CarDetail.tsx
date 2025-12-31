import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Effect } from 'effect';
import { DataService, DataServiceLive } from '../services/DataService';
import type { Car, UserProfile } from '../types';
import { Car as CarIcon, Calendar, Gauge, Wrench, User, ChevronLeft, X, Zap, ArrowUpRight } from 'lucide-react';

export default function CarDetail() {
    const { id } = useParams<{ id: string }>();
    const [car, setCar] = useState<Car | null>(null);
    const [owner, setOwner] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    useEffect(() => {
        if (!id) return;

        const loadCar = async () => {
            const dataService = Effect.runSync(
                Effect.gen(function* (_) {
                    return yield* _(DataService);
                }).pipe(Effect.provide(DataServiceLive))
            );

            const fetchedCar = await Effect.runPromise(dataService.getCarById(id));
            setCar(fetchedCar || null);

            if (fetchedCar && fetchedCar.ownerId) {
                const ownerResult = await Effect.runPromise(dataService.getUserProfile(fetchedCar.ownerId));
                if (ownerResult) {
                    setOwner(ownerResult.profile);
                }
            }

            setLoading(false);
        };

        loadCar();
    }, [id]);

    if (loading) return <div className="p-12 text-center text-slate-400 font-mono">Načítám vozidlo...</div>;
    if (!car) return <div className="p-12 text-center text-slate-400 font-mono">Vozidlo nenalezeno.</div>;

    const formatPrice = (price?: number) => {
        if (!price) return null;
        return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(price);
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
            <Link to={owner ? `/profile/${owner.uid}` : '/'} className="inline-flex items-center gap-2 text-slate-500 hover:text-brand font-bold uppercase tracking-wide text-xs mb-4">
                <ChevronLeft size={16} /> Zpět na profil {owner ? owner.displayName : ''}
            </Link>

            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
                {/* Main Image */}
                <div
                    className="h-[400px] md:h-[500px] bg-slate-100 relative group cursor-zoom-in"
                    onClick={() => setIsImageModalOpen(true)}
                >
                    {car.photos && car.photos.length > 0 ? (
                        <img src={car.photos[0]} alt={car.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <CarIcon size={64} opacity={0.3} />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8 md:p-12 pointer-events-none">
                        <h1 className="text-4xl md:text-5xl font-black italic text-white uppercase tracking-tighter mb-4">{car.name}</h1>
                        <div className="flex flex-wrap items-center gap-6 text-white/90 font-bold uppercase tracking-wide text-sm">
                            <span className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm"><Calendar size={16} /> {car.year}</span>
                            <span className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm"><Gauge size={16} /> {car.engine}</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 md:p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Left Column: Docs & Specs */}
                    <div className="lg:col-span-2 space-y-10">

                        {/* Power Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                    <Zap size={14} /> Aktuální výkon
                                </span>
                                <div className="text-3xl font-black text-brand italic">{car.power}</div>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                    <Zap size={14} className="opacity-50" /> Sériový výkon
                                </span>
                                <div className="text-3xl font-black text-slate-300 italic">{car.stockPower || '-'}</div>
                            </div>
                        </div>

                        {/* Mods List */}
                        <div>
                            <h2 className="text-xl font-black italic uppercase tracking-wider mb-6 flex items-center gap-2">
                                <Wrench className="text-brand" size={24} /> Úpravy a specifikace
                            </h2>
                            {car.mods.length > 0 ? (
                                <div className="space-y-4">
                                    {car.mods.map((mod, i) => (
                                        <div key={i} className="bg-white border border-slate-100 p-5 rounded-2xl hover:border-slate-300 transition-colors shadow-sm">
                                            <div className="flex justify-between items-start gap-4 mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-brand flex-shrink-0" />
                                                    <h3 className="font-black text-lg text-slate-900">{typeof mod === 'string' ? mod : mod.name}</h3>
                                                </div>
                                                {typeof mod !== 'string' && mod.price && (
                                                    <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md whitespace-nowrap">
                                                        {formatPrice(mod.price)}
                                                    </span>
                                                )}
                                            </div>

                                            {typeof mod !== 'string' && (
                                                <div className="pl-5 space-y-2">
                                                    {mod.type && (
                                                        <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100 mb-1 mr-2">{mod.type}</span>
                                                    )}
                                                    {mod.description && (
                                                        <p className="text-slate-600 text-sm leading-relaxed">{mod.description}</p>
                                                    )}
                                                    {mod.date && (
                                                        <div className="pt-2 text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                                                            <Calendar size={12} /> {new Date(mod.date).toLocaleDateString('cs-CZ')}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-400 italic">Žádné úpravy uvedeny.</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Owner Card */}
                    <div>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 sticky top-24">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Majitel vozu</h3>
                            {owner ? (
                                <Link to={`/profile/${owner.uid}`} className="flex items-center gap-4 group">
                                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md group-hover:border-brand transition-colors">
                                        {owner.photoURL ? (
                                            <img src={owner.photoURL} alt={owner.displayName || 'User'} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                                                <User size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-black text-lg text-slate-900 group-hover:text-brand transition-colors">{owner.displayName || 'Neznámý'}</p>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                                            Zobrazit profil <ArrowUpRight size={12} />
                                        </p>
                                    </div>
                                </Link>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-slate-200 animate-pulse" />
                                    <div className="space-y-2">
                                        <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                                        <div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Modal */}
            {isImageModalOpen && car.photos && car.photos.length > 0 && (
                <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsImageModalOpen(false)}>
                    <button className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
                        <X size={32} />
                    </button>
                    <img
                        src={car.photos[0]}
                        alt={car.name}
                        className="max-w-full max-h-screen object-contain shadow-2xl rounded-sm"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
