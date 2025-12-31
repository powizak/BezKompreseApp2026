import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Effect } from 'effect';
import { DataService, DataServiceLive } from '../services/DataService';
import type { Car, UserProfile } from '../types';
import { Car as CarIcon, Calendar, Gauge, Wrench, User, ChevronLeft } from 'lucide-react';

export default function CarDetail() {
    const { id } = useParams<{ id: string }>();
    const [car, setCar] = useState<Car | null>(null);
    const [owner, setOwner] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
            <Link to={owner ? `/profile/${owner.uid}` : '/'} className="inline-flex items-center gap-2 text-slate-500 hover:text-brand font-bold uppercase tracking-wide text-xs mb-4">
                <ChevronLeft size={16} /> Zpět na profil {owner ? owner.displayName : ''}
            </Link>

            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
                {/* Main Image */}
                <div className="h-[400px] md:h-[500px] bg-slate-100 relative group">
                    {car.photos && car.photos.length > 0 ? (
                        <img src={car.photos[0]} alt={car.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <CarIcon size={64} opacity={0.3} />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8 md:p-12">
                        <h1 className="text-4xl md:text-5xl font-black italic text-white uppercase tracking-tighter mb-2">{car.name}</h1>
                        <div className="flex items-center gap-4 text-white/80 font-bold uppercase tracking-wide text-sm">
                            <span className="flex items-center gap-1"><Calendar size={16} /> {car.year}</span>
                            <span className="flex items-center gap-1"><Gauge size={16} /> {car.engine}</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 md:p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Left Column: Specs & Owner */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* Mods / Specs */}
                        <div>
                            <h2 className="text-xl font-black italic uppercase tracking-wider mb-6 flex items-center gap-2">
                                <Wrench className="text-brand" size={24} /> Úpravy a specifikace
                            </h2>
                            {car.mods.length > 0 ? (
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {car.mods.map((mod, i) => (
                                        <li key={i} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start gap-3">
                                            <div className="mt-1 w-2 h-2 rounded-full bg-brand flex-shrink-0" />
                                            <div>
                                                <span className="font-bold text-slate-900 block">
                                                    {typeof mod === 'string' ? mod : mod.name}
                                                </span>
                                                {typeof mod !== 'string' && mod.type && (
                                                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">{mod.type}</span>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-slate-400 italic">Žádné úpravy uvedeny.</p>
                            )}
                        </div>

                        {/* Description (if we had one in the type, but standard car object is simple) */}
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
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Zobrazit profil</p>
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
        </div>
    );
}
