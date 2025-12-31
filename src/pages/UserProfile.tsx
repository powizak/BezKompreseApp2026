import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Effect } from 'effect';
import { DataService, DataServiceLive } from '../services/DataService';
import { useAuth } from '../contexts/AuthContext';
import type { UserProfile, Car, AppEvent } from '../types';
import { Car as CarIcon, UserPlus, UserMinus, Users, Calendar, MapPin, User, ChevronRight } from 'lucide-react';

export default function UserProfilePage() {
    const { id } = useParams<{ id: string }>();
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [cars, setCars] = useState<Car[]>([]);
    const [events, setEvents] = useState<AppEvent[]>([]);
    const [friends, setFriends] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFriend, setIsFriend] = useState(false);
    const [activeTab, setActiveTab] = useState<'garage' | 'events' | 'friends'>('garage');

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            const dataService = Effect.runSync(
                Effect.gen(function* (_) {
                    return yield* _(DataService);
                }).pipe(Effect.provide(DataServiceLive))
            );

            // 1. Profile & Cars
            const result = await Effect.runPromise(dataService.getUserProfile(id));
            if (result) {
                setProfile(result.profile);
                setCars(result.cars);

                // 2. Events
                const eventResult = await Effect.runPromise(dataService.getUserEvents(id));
                setEvents(eventResult.created); // Displaying created events for now

                // 3. Friends (Fetch details for each friend ID)
                if (result.profile.friends && result.profile.friends.length > 0) {
                    const friendPromises = result.profile.friends.map(fid =>
                        Effect.runPromise(dataService.getUserProfile(fid))
                    );
                    const friendResults = await Promise.all(friendPromises);
                    const validFriends = friendResults
                        .filter(r => r !== null)
                        .map(r => r!.profile);
                    setFriends(validFriends);
                } else {
                    setFriends([]);
                }
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
            await Effect.runPromise(dataService.removeFriend(currentUser.uid, id));
            setIsFriend(false);
        } else {
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

            {/* Navigation Tabs */}
            <div className="flex justify-center md:justify-start gap-4 border-b border-slate-100 pb-1">
                <button onClick={() => setActiveTab('garage')} className={`pb-3 px-4 text-sm font-black uppercase tracking-wide border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'garage' ? 'border-brand text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                    <CarIcon size={18} /> Garáž <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-md ml-1 text-slate-500">{cars.length}</span>
                </button>
                <button onClick={() => setActiveTab('events')} className={`pb-3 px-4 text-sm font-black uppercase tracking-wide border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'events' ? 'border-brand text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                    <Calendar size={18} /> Akce <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-md ml-1 text-slate-500">{events.length}</span>
                </button>
                <button onClick={() => setActiveTab('friends')} className={`pb-3 px-4 text-sm font-black uppercase tracking-wide border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'friends' ? 'border-brand text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                    <Users size={18} /> Přátelé <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-md ml-1 text-slate-500">{friends.length}</span>
                </button>
            </div>

            {/* Content Sections */}
            <div>
                {/* Garage Tab */}
                {activeTab === 'garage' && (
                    <div>
                        {cars.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {cars.map(car => (
                                    <Link to={`/car/${car.id}`} key={car.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-100 group block">
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
                                                        {typeof mod === 'string' ? mod : mod.name}
                                                    </span>
                                                ))}
                                                {car.mods.length > 3 && (
                                                    <span className="bg-slate-50 text-slate-400 text-[10px] px-2 py-1 rounded-md uppercase font-bold tracking-wider border border-slate-200">+{car.mods.length - 3}</span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400">
                                <CarIcon size={48} className="mx-auto mb-4 opacity-50" />
                                <p className="font-bold">Garáž zeje prázdnotou</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Events Tab */}
                {activeTab === 'events' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {events.length > 0 ? events.map(event => (
                            <Link key={event.id} to={`/events/${event.id}`} className="block bg-white p-4 rounded-xl border border-slate-100 hover:border-brand transition-all shadow-sm hover:shadow-md group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-1 rounded-md">
                                        {new Date(event.date).toLocaleDateString('cs-CZ')}
                                    </span>
                                    <ChevronRight size={16} className="text-slate-300 group-hover:text-brand" />
                                </div>
                                <h3 className="font-bold text-lg mb-2">{event.title}</h3>
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wide">
                                    <MapPin size={14} /> {event.location}
                                </div>
                            </Link>
                        )) : (
                            <div className="col-span-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400">
                                <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                                <p className="font-bold">Žádné naplánované akce</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Friends Tab */}
                {activeTab === 'friends' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {friends.length > 0 ? friends.map(friend => (
                            <Link key={friend.uid} to={`/profile/${friend.uid}`} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 hover:border-brand transition-all shadow-sm hover:shadow-md">
                                <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-100 flex-shrink-0">
                                    {friend.photoURL ? (
                                        <img src={friend.photoURL} alt={friend.displayName || 'User'} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                                            <User size={20} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">{friend.displayName || 'Bezejmenný'}</h4>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{friend.friends?.length || 0} přátel</p>
                                </div>
                            </Link>
                        )) : (
                            <div className="col-span-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400">
                                <Users size={48} className="mx-auto mb-4 opacity-50" />
                                <p className="font-bold">Seznam přátel je prázdný</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
