import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Effect } from 'effect';
import { DataService, DataServiceLive } from '../services/DataService';
import { useAuth } from '../contexts/AuthContext';
import type { UserProfile, Car } from '../types';
import { Car as CarIcon, UserPlus, UserMinus, Users } from 'lucide-react';

export default function UserProfilePage() {
    const { id } = useParams<{ id: string }>();
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [cars, setCars] = useState<Car[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFriend, setIsFriend] = useState(false);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            const dataService = Effect.runSync(
                Effect.gen(function* (_) {
                    return yield* _(DataService);
                }).pipe(Effect.provide(DataServiceLive))
            );

            const result = await Effect.runPromise(dataService.getUserProfile(id));
            if (result) {
                setProfile(result.profile);
                setCars(result.cars);
            }
            setLoading(false);
        };

        fetchData();
    }, [id]);

    useEffect(() => {
        if (currentUser && currentUser.friends && id) {
            setIsFriend(currentUser.friends.includes(id));
        }
    }, [currentUser, id]);

    const handleFriendAction = async () => {
        if (!currentUser || !id) return;

        const dataService = Effect.runSync(
            Effect.gen(function* (_) {
                return yield* _(DataService);
            }).pipe(Effect.provide(DataServiceLive))
        );

        if (isFriend) {
            // Remove friend
            await Effect.runPromise(dataService.removeFriend(currentUser.uid, id));
            setIsFriend(false);
            // Optimistically update local auth state would require context update, keeping it simple
        } else {
            // Add friend
            await Effect.runPromise(dataService.addFriend(currentUser.uid, id));
            setIsFriend(true);
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-500">Načítám profil...</div>;
    if (!profile) return <div className="p-10 text-center text-slate-500">Uživatel nenalezen.</div>;

    const isMe = currentUser?.uid === profile.uid;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-slate-900 to-slate-800"></div>

                <div className="relative z-10 w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                    {profile.photoURL ? (
                        <img src={profile.photoURL} alt={profile.displayName || 'User'} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                            <CarIcon size={48} />
                        </div>
                    )}
                </div>

                <div className="relative z-10 pt-12 md:pt-24 text-center md:text-left flex-1">
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-1">{profile.displayName || 'Neznámý uživatel'}</h1>
                    <p className="text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2">
                        <Users size={16} />
                        {profile.friends?.length || 0} přátel
                    </p>
                </div>

                <div className="relative z-10 pt-4 md:pt-24">
                    {currentUser && !isMe && (
                        <button
                            onClick={handleFriendAction}
                            className={`px-6 py-2 rounded-full font-bold uppercase text-sm tracking-wide flex items-center gap-2 transition-all ${isFriend
                                ? 'bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500'
                                : 'bg-brand text-brand-contrast hover:bg-brand-dark shadow-lg shadow-brand/20'
                                }`}
                        >
                            {isFriend ? <><UserMinus size={18} /> Odebrat z přátel</> : <><UserPlus size={18} /> Pridat do přátel</>}
                        </button>
                    )}
                </div>
            </div>

            {/* Garage */}
            <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-3">
                    <CarIcon className="text-brand" size={28} />
                    Garáž
                </h2>

                {cars.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cars.map(car => (
                            <div key={car.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-100 group">
                                <div className="h-48 bg-slate-100 relative overflow-hidden">
                                    {car.photos && car.photos.length > 0 ? (
                                        <img src={car.photos[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={car.name} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <CarIcon size={48} opacity={0.2} />
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
                                        <h3 className="text-white font-black text-xl italic uppercase tracking-wide">{car.name}</h3>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="flex justify-between items-center text-sm font-bold text-slate-600 mb-3">
                                        <span>{car.year}</span>
                                        <span>{car.engine}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {car.mods.slice(0, 3).map((mod, i) => (
                                            <span key={i} className="bg-slate-50 text-slate-500 text-[10px] px-2 py-1 rounded-md uppercase font-bold tracking-wider border border-slate-200">
                                                {/* Handle if mod is string or object */}
                                                {typeof mod === 'string' ? mod : mod.name}
                                            </span>
                                        ))}
                                        {car.mods.length > 3 && (
                                            <span className="bg-slate-50 text-slate-400 text-[10px] px-2 py-1 rounded-md uppercase font-bold tracking-wider border border-slate-200">+{car.mods.length - 3}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400">
                        <CarIcon size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="font-bold">Garáž zeje prázdnotou</p>
                    </div>
                )}
            </div>
        </div>
    );
}
