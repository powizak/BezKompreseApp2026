import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Effect } from 'effect';
import { DataService, DataServiceLive } from '../services/DataService';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import type { UserProfile, Car, AppEvent, NotificationSettings } from '../types';
import { DEFAULT_NOTIFICATION_SETTINGS } from '../types';
import { Car as CarIcon, UserPlus, UserMinus, Users, Calendar, MapPin, User, ChevronRight, Settings, Shield, Save, CarFront, Gauge, Fuel, MessageCircle, LogOut } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import LoginRequired from '../components/LoginRequired';
import NotificationSettingsSection from '../components/NotificationSettings';

// Fix Leaflet icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function UserProfilePage() {
    const { id } = useParams<{ id: string }>();
    const { user: currentUser, logout } = useAuth();
    const { openChat } = useChat();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [cars, setCars] = useState<Car[]>([]);
    const [events, setEvents] = useState<AppEvent[]>([]);
    const [friends, setFriends] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFriend, setIsFriend] = useState(false);
    const [activeTab, setActiveTab] = useState<'garage' | 'events' | 'friends' | 'settings'>('garage');
    const [saving, setSaving] = useState(false);
    const [homeLocation, setHomeLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
    const [trackerSettings, setTrackerSettings] = useState<import('../types').TrackerSettings>({
        isEnabled: false,
        allowContact: true,
        status: 'Jen tak',
        privacyRadius: 500
    });
    const [shareFuelConsumption, setShareFuelConsumption] = useState(false);
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
    const [chatLoading, setChatLoading] = useState(false);

    const dataService = Effect.runSync(
        Effect.gen(function* (_) {
            return yield* _(DataService);
        }).pipe(Effect.provide(DataServiceLive))
    );

    useEffect(() => {
        if (!id || !currentUser) return;

        const fetchData = async () => {

            // 1. Profile & Cars
            const result = await Effect.runPromise(dataService.getUserProfile(id));
            if (result) {
                setProfile(result.profile);
                setCars(result.cars);
                setHomeLocation(result.profile.homeLocation);
                if (result.profile.trackerSettings) {
                    setTrackerSettings(result.profile.trackerSettings);
                }
                setShareFuelConsumption(!!result.profile.shareFuelConsumption);
                if (result.profile.notificationSettings) {
                    setNotificationSettings(result.profile.notificationSettings);
                }

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

    const handleChat = async () => {
        if (!currentUser || !id || !profile) return;
        setChatLoading(true);
        try {
            const roomId = await Effect.runPromise(
                dataService.getOrCreateChatRoom(
                    currentUser.uid, currentUser.displayName || 'Anonymous', currentUser.photoURL,
                    id, profile.displayName || 'Uživatel', profile.photoURL || null
                )
            );
            openChat(roomId, id, profile.displayName || 'Uživatel');
        } finally {
            setChatLoading(false);
        }
    };

    const saveSettings = async () => {
        if (!currentUser || !id) return;
        setSaving(true);

        const dataService = Effect.runSync(
            Effect.gen(function* (_) {
                return yield* _(DataService);
            }).pipe(Effect.provide(DataServiceLive))
        );

        try {
            // Firestore doesn't accept 'undefined'. Strip it or use null.
            const updateData: any = {
                trackerSettings,
                shareFuelConsumption,
                notificationSettings
            };
            if (homeLocation !== undefined) {
                updateData.homeLocation = homeLocation;
            }

            await Effect.runPromise(dataService.updateProfile(currentUser.uid, updateData));
            // alert('Nastavení úspěšně uloženo!');
        } catch (e) {
            console.error('Update failed:', e);
            // alert('Chyba při ukládání nastavení. Zkontrolujte konzoli.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        if (window.confirm('Opravdu se chcete odhlásit?')) {
            await logout();
            window.location.href = '/';
        }
    };

    function LocationPicker() {
        useMapEvents({
            click(e) {
                setHomeLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
            },
        });
        return homeLocation ? <Marker position={[homeLocation.lat, homeLocation.lng]} /> : null;
    }

    if (loading) return <div className="p-10 text-center text-slate-500">Načítám profil...</div>;
    if (!profile) return <div className="p-10 text-center text-slate-500">Uživatel nenalezen.</div>;

    const isMe = currentUser?.uid === profile.uid;

    if (!currentUser) {
        return (
            <LoginRequired
                title="Profil je zamčený"
                message="Pro zobrazení profilů uživatelů se musíte přihlásit."
                icon={User}
            />
        );
    }

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

                <div className="relative z-10 pt-4 md:pt-24 flex gap-2">
                    {currentUser && !isMe && (
                        <>
                            <button
                                onClick={handleChat}
                                disabled={chatLoading}
                                className="px-4 py-2 rounded-full font-bold uppercase text-sm tracking-wide flex items-center gap-2 transition-all bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                            >
                                <MessageCircle size={18} />
                                {chatLoading ? '...' : 'Zpráva'}
                            </button>
                            <button
                                onClick={handleFriendAction}
                                className={`px-6 py-2 rounded-full font-bold uppercase text-sm tracking-wide flex items-center gap-2 transition-all ${isFriend
                                    ? 'bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500'
                                    : 'bg-brand text-brand-contrast hover:bg-brand-dark shadow-lg shadow-brand/20'
                                    }`}
                            >
                                {isFriend ? <><UserMinus size={18} /> Odebrat</> : <><UserPlus size={18} /> Přidat</>}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="sticky top-0 bg-slate-50 z-20 -mx-4 px-4 py-3 flex justify-start md:justify-start gap-2 md:gap-4 border-b border-slate-200 overflow-x-auto scrollbar-hide shadow-sm">
                <button onClick={() => setActiveTab('garage')} className={`pb-3 px-2 md:px-4 text-xs md:text-sm font-black uppercase tracking-wide border-b-2 transition-colors flex items-center gap-1 md:gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === 'garage' ? 'border-brand text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                    <CarIcon size={16} className="md:w-[18px] md:h-[18px]" /> Garáž <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-md ml-1 text-slate-500">{cars.length}</span>
                </button>
                <button onClick={() => setActiveTab('events')} className={`pb-3 px-2 md:px-4 text-xs md:text-sm font-black uppercase tracking-wide border-b-2 transition-colors flex items-center gap-1 md:gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === 'events' ? 'border-brand text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                    <Calendar size={16} className="md:w-[18px] md:h-[18px]" /> Akce <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-md ml-1 text-slate-500">{events.length}</span>
                </button>
                <button onClick={() => setActiveTab('friends')} className={`pb-3 px-2 md:px-4 text-xs md:text-sm font-black uppercase tracking-wide border-b-2 transition-colors flex items-center gap-1 md:gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === 'friends' ? 'border-brand text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                    <Users size={16} className="md:w-[18px] md:h-[18px]" /> Přátelé <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-md ml-1 text-slate-500">{friends.length}</span>
                </button>
                {isMe && (
                    <button onClick={() => setActiveTab('settings')} className={`pb-3 px-2 md:px-4 text-xs md:text-sm font-black uppercase tracking-wide border-b-2 transition-colors flex items-center gap-1 md:gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === 'settings' ? 'border-brand text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        <Settings size={16} className="md:w-[18px] md:h-[18px]" /> Nastavení
                    </button>
                )}
            </div>

            {/* Content Sections */}
            <div>
                {/* Garage Tab */}
                {activeTab === 'garage' && (
                    <div>
                        {cars.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {cars.map(car => (
                                    <Link to={`/car/${car.id}`} key={car.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-xl transition-all duration-300 block">
                                        {/* Image */}
                                        <div className="aspect-video bg-slate-100 relative overflow-hidden">
                                            {car.photos && car.photos.length > 0 ? (
                                                <img src={car.photos[0]} alt={car.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                                    <CarFront size={48} strokeWidth={1.5} />
                                                </div>
                                            )}
                                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                                            <div className="absolute bottom-0 left-0 p-4 text-white">
                                                <h3 className="font-black text-xl tracking-tight leading-none mb-1">{car.name}</h3>
                                                <p className="text-sm font-medium opacity-90">{car.make} {car.model}</p>
                                            </div>

                                            {/* Ownership Badge */}
                                            {(car.isOwned ?? true) && (
                                                <div className="absolute top-3 right-3 z-20">
                                                    <span className="bg-brand text-slate-900 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-lg border border-brand-light flex items-center gap-1">
                                                        V garáži
                                                    </span>
                                                </div>
                                            )}
                                            {!(car.isOwned ?? true) && (
                                                <div className="absolute top-3 right-3 z-20">
                                                    <span className="bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-lg flex items-center gap-1 opacity-90">
                                                        Historie
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="p-4 flex justify-between items-center text-slate-600 text-sm">
                                            <span className="flex items-center gap-1 font-bold bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                                <Calendar size={14} className="text-brand" /> {car.year}
                                            </span>
                                            <span className="flex items-center gap-1 font-bold bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                                <Gauge size={14} className="text-brand" /> {car.power} kW
                                            </span>
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

                {/* Settings Tab */}
                {activeTab === 'settings' && isMe && (
                    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-brand/10 text-brand rounded-xl">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black italic uppercase tracking-tighter">Nastavení Trackeru</h2>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Soukromí a viditelnost</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div>
                                            <h3 className="font-bold text-slate-900">Vidět na mapě</h3>
                                            <p className="text-xs text-slate-500">Sdílet moji polohu s ostatními</p>
                                        </div>
                                        <button
                                            onClick={() => setTrackerSettings(prev => ({ ...prev, isEnabled: !prev.isEnabled }))}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${trackerSettings.isEnabled ? 'bg-brand' : 'bg-slate-300'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${trackerSettings.isEnabled ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div>
                                            <h3 className="font-bold text-slate-900">Povolit kontakt</h3>
                                            <p className="text-xs text-slate-500">Ostatní mi mohou psát z mapy</p>
                                        </div>
                                        <button
                                            onClick={() => setTrackerSettings(prev => ({ ...prev, allowContact: !prev.allowContact }))}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${trackerSettings.allowContact ? 'bg-brand' : 'bg-slate-300'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${trackerSettings.allowContact ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Můj Status</label>
                                        <select
                                            value={trackerSettings.status}
                                            onChange={(e) => setTrackerSettings(prev => ({ ...prev, status: e.target.value as any }))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand/20 appearance-none"
                                        >
                                            <option value="Dáme pokec?">Dáme pokec?</option>
                                            <option value="Závod?">Závod?</option>
                                            <option value="Projížďka?">Projížďka?</option>
                                            <option value="Jen tak">Jen tak</option>
                                            <option value="Na kafi">Na kafi</option>
                                            <option value="V garáži">V garáži</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <h3 className="font-bold text-slate-900">Bydliště (Privacy Zone)</h3>
                                            <p className="text-xs text-slate-500">Klikni do mapy pro nastavení středu zóny</p>
                                        </div>
                                    </div>
                                    <div className="h-48 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
                                        <MapContainer
                                            center={homeLocation ? [homeLocation.lat, homeLocation.lng] : [49.8175, 15.4730]}
                                            zoom={13}
                                            className="h-full w-full"
                                        >
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                            <LocationPicker />
                                        </MapContainer>
                                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold border border-slate-200 pointer-events-none">
                                            Zone: 500m radius
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 italic font-medium px-2">
                                        * Poloha se automaticky skryje, pokud budete v okruhu 500m od tohoto bodu. Nikdo neuvidí přesnou polohu vašeho bydliště.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={saveSettings}
                                    disabled={saving}
                                    className="bg-brand text-brand-contrast px-8 py-3 rounded-2xl font-black uppercase italic tracking-tighter shadow-lg shadow-brand/20 hover:bg-brand-dark transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? 'Ukládám...' : <><Save size={18} /> Uložit nastavení</>}
                                </button>
                            </div>
                        </section>

                        <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-brand/10 text-brand rounded-xl">
                                    <Fuel size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black italic uppercase tracking-tighter">Ostatní nastavení</h2>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Veřejné informace</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <h3 className="font-bold text-slate-900">Sdílet spotřebu paliva</h3>
                                    <p className="text-xs text-slate-500">Zobrazit průměrnou spotřebu u mých vozidel ostatním</p>
                                </div>
                                <button
                                    onClick={() => setShareFuelConsumption(!shareFuelConsumption)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${shareFuelConsumption ? 'bg-brand' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${shareFuelConsumption ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={saveSettings}
                                    disabled={saving}
                                    className="bg-brand text-brand-contrast px-8 py-3 rounded-2xl font-black uppercase italic tracking-tighter shadow-lg shadow-brand/20 hover:bg-brand-dark transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? 'Ukládám...' : <><Save size={18} /> Uložit nastavení</>}
                                </button>
                            </div>
                        </section>

                        {/* Notification Settings */}
                        <NotificationSettingsSection
                            settings={notificationSettings}
                            onChange={setNotificationSettings}
                            userId={currentUser.uid}
                        />

                        {/* Logout Section */}
                        <section className="bg-white p-6 rounded-3xl border border-red-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                                    <LogOut size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black italic uppercase tracking-tighter">Odhlášení</h2>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Ukončit relaci</p>
                                </div>
                            </div>

                            <p className="text-sm text-slate-600 mb-6">
                                Po odhlášení budete přesměrováni na úvodní stránku a budete se muset znovu přihlásit pro přístup k aplikaci.
                            </p>

                            <button
                                onClick={handleLogout}
                                className="w-full bg-red-600 text-white px-8 py-3 rounded-2xl font-black uppercase italic tracking-tighter shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                            >
                                <LogOut size={18} /> Odhlásit se
                            </button>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}
