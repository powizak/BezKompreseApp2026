import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Effect } from 'effect';
import { DataService, DataServiceLive } from '../services/DataService';
import type { Car, UserProfile } from '../types';
import { Car as CarIcon, Calendar, Gauge, Wrench, User, ChevronLeft, ChevronRight, X, Zap, ArrowUpRight } from 'lucide-react';

export default function CarDetail() {
    const { id } = useParams<{ id: string }>();
    const [car, setCar] = useState<Car | null>(null);
    const [owner, setOwner] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    const [activeImageIndex, setActiveImageIndex] = useState(0);

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

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!car?.photos) return;
        setActiveImageIndex((prev) => (prev + 1) % car.photos.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!car?.photos) return;
        setActiveImageIndex((prev) => (prev - 1 + car.photos.length) % car.photos.length);
    };

    if (loading) return <div className="p-12 text-center text-slate-400 font-mono">Načítám vozidlo...</div>;
    if (!car) return <div className="p-12 text-center text-slate-400 font-mono">Vozidlo nenalezeno.</div>;


    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
            <Link to={owner ? `/profile/${owner.uid}` : '/'} className="inline-flex items-center gap-2 text-slate-500 hover:text-brand font-bold uppercase tracking-wide text-xs mb-4">
                <ChevronLeft size={16} /> Zpět na profil {owner ? owner.displayName : ''}
            </Link>

            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
                {/* Main Image Carousel */}
                <div
                    className="h-[400px] md:h-[600px] bg-slate-900 relative group overflow-hidden"
                >
                    {car.photos && car.photos.length > 0 ? (
                        <>
                            <img
                                src={car.photos[activeImageIndex]}
                                alt={car.name}
                                className="w-full h-full object-cover cursor-zoom-in transition-all duration-500"
                                onClick={() => setIsImageModalOpen(true)}
                            />

                            {/* Navigation Buttons */}
                            {car.photos.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/20 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/40 border border-white/10"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/20 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/40 border border-white/10"
                                    >
                                        <ChevronRight size={24} />
                                    </button>

                                    {/* Pagination Dots */}
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                                        {car.photos.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={(e) => { e.stopPropagation(); setActiveImageIndex(i); }}
                                                className={`h-1.5 rounded-full transition-all ${i === activeImageIndex ? 'w-8 bg-brand' : 'w-2 bg-white/40 hover:bg-white/60'}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700">
                            <CarIcon size={64} opacity={0.3} />
                        </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8 md:p-12 pointer-events-none">
                        <h1 className="text-4xl md:text-6xl font-black italic text-white uppercase tracking-tighter mb-4 leading-none">{car.name}</h1>
                        <div className="flex flex-wrap items-center gap-4 text-white font-bold uppercase tracking-widest text-[10px] md:text-xs">
                            <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10"><Calendar size={14} className="text-brand" /> {car.year}</span>
                            <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10"><Gauge size={14} className="text-brand" /> {car.engine}</span>
                            <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">< Zap size={14} className="text-brand" /> {car.power}</span>
                        </div>
                    </div>


                    {/* Ownership Badge */}
                    {(car.isOwned ?? true) && (
                        <div className="absolute top-6 right-6 z-10 pointer-events-none">
                            <span className="bg-brand text-slate-900 font-black uppercase tracking-wider px-4 py-2 rounded-xl shadow-2xl border border-brand-light flex items-center gap-2 transform rotate-2">
                                V garáži
                            </span>
                        </div>
                    )}
                    {!(car.isOwned ?? true) && (
                        <div className="absolute top-6 right-6 z-10 pointer-events-none">
                            <span className="bg-slate-800 text-white font-black uppercase tracking-wider px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 opacity-90 transform -rotate-2 border border-slate-700">
                                Historie / Prodáno
                            </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-8 md:p-16 grid grid-cols-1 lg:grid-cols-3 gap-16">

                    {/* Left Column: Docs & Specs */}
                    <div className="lg:col-span-2 space-y-16">

                        {/* Power Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 relative overflow-hidden group">
                                <Zap className="absolute -right-4 -bottom-4 w-32 h-32 text-brand/5 -rotate-12 transition-transform group-hover:scale-110" />
                                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                                    <Zap size={14} className="text-brand" /> Aktuální výkon
                                </span>
                                <div className="text-5xl font-black text-slate-900 italic tracking-tighter">{car.power}</div>
                            </div>
                            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 relative overflow-hidden group">
                                <Zap className="absolute -right-4 -bottom-4 w-32 h-32 text-slate-200/20 -rotate-12 transition-transform group-hover:scale-110" />
                                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                                    <Zap size={14} className="opacity-50" /> Sériový výkon
                                </span>
                                <div className="text-5xl font-black text-slate-200 italic tracking-tighter">{car.stockPower || '-'}</div>
                            </div>
                        </div>

                        {/* Mods List */}
                        <div>
                            <div className="flex items-center gap-4 mb-10">
                                <div className="h-px bg-slate-200 flex-1" />
                                <h2 className="text-2xl font-black italic uppercase tracking-[0.15em] flex items-center gap-3 whitespace-nowrap">
                                    <Wrench className="text-brand" size={28} /> Úpravy a specifikace
                                </h2>
                                <div className="h-px bg-slate-200 flex-1" />
                            </div>

                            {car.mods.length > 0 ? (
                                <div className="space-y-6">
                                    {car.mods.map((mod, i) => (
                                        <div key={i} className="bg-white border border-slate-100 p-8 rounded-3xl hover:border-brand/30 transition-all shadow-sm hover:shadow-xl group relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-slate-100 group-hover:bg-brand transition-colors" />
                                            <div className="flex justify-between items-start gap-4 mb-4">
                                                <div className="flex items-center gap-4">
                                                    <h3 className="font-black text-xl text-slate-900 tracking-tight uppercase italic">{typeof mod === 'string' ? mod : mod.name}</h3>
                                                </div>
                                            </div>

                                            {typeof mod !== 'string' && (
                                                <div className="space-y-4">
                                                    {mod.type && (
                                                        <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] bg-brand text-slate-900 px-3 py-1 rounded-full border border-brand-light">{mod.type}</span>
                                                    )}
                                                    {mod.description && (
                                                        <p className="text-slate-600 text-base leading-relaxed font-medium">{mod.description}</p>
                                                    )}
                                                    {mod.date && (
                                                        <div className="pt-2 text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                            <Calendar size={14} /> {new Date(mod.date).toLocaleDateString('cs-CZ')}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-slate-50 p-12 rounded-3xl border border-dashed border-slate-200 text-center">
                                    <Wrench size={48} className="mx-auto text-slate-200 mb-4" />
                                    <p className="text-slate-400 italic font-bold">Žádné úpravy zatím nebyly specifikovány.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Owner Card */}
                    <div>
                        <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl sticky top-24 border border-slate-800">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-8 border-b border-slate-800 pb-4">Profil Majitele</h3>
                            {owner ? (
                                <Link to={`/profile/${owner.uid}`} className="block group">
                                    <div className="flex items-center gap-6 mb-8">
                                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-xl group-hover:border-brand transition-all rotate-3 group-hover:rotate-0">
                                            {owner.photoURL ? (
                                                <img src={owner.photoURL} alt={owner.displayName || 'User'} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600">
                                                    <User size={32} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-black text-2xl text-white group-hover:text-brand transition-colors tracking-tighter italic uppercase">{owner.displayName || 'Neznámý'}</p>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Člen komunity</p>
                                        </div>
                                    </div>
                                    <div className="bg-brand text-slate-900 font-black uppercase tracking-widest text-[10px] py-4 rounded-xl flex items-center justify-center gap-2 group-hover:bg-brand-dark transition-all">
                                        Zobrazit profil <ArrowUpRight size={14} />
                                    </div>
                                </Link>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-2xl bg-slate-800 animate-pulse" />
                                    <div className="space-y-3">
                                        <div className="h-6 w-32 bg-slate-800 rounded animate-pulse" />
                                        <div className="h-3 w-20 bg-slate-800 rounded animate-pulse" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Modal */}
            {
                isImageModalOpen && car.photos && car.photos.length > 0 && (
                    <div className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300 backdrop-blur-xl" onClick={() => setIsImageModalOpen(false)}>
                        <button className="absolute top-8 right-8 text-white/40 hover:text-white transition-all z-[110] bg-white/5 p-2 rounded-full backdrop-blur-md">
                            <X size={40} />
                        </button>

                        <div className="relative w-full h-full flex items-center justify-center group/modal" onClick={(e) => e.stopPropagation()}>
                            <img
                                src={car.photos[activeImageIndex]}
                                alt={car.name}
                                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg animate-in zoom-in-95 duration-500"
                            />

                            {car.photos.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/5 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/10 transition-all border border-white/10"
                                    >
                                        <ChevronLeft size={32} />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/5 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/10 transition-all border border-white/10"
                                    >
                                        <ChevronRight size={32} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )
            }
        </div >
    );
}
