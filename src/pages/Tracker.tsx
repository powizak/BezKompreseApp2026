import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Effect } from 'effect';
import { DataService, DataServiceLive } from '../services/DataService';
import { useAuth } from '../contexts/AuthContext';
import { Navigation, MessageCircle, Shield, User } from 'lucide-react';
import type { PresenceInfo } from '../types/chat';
import ChatDrawer from '../components/ChatDrawer';
import LoginRequired from '../components/LoginRequired';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
}

// Function to spread out markers that are too close to each other
type SpreadPresence = PresenceInfo & { offsetLat?: number; offsetLng?: number };

function spreadMarkers(presences: PresenceInfo[], threshold = 50): SpreadPresence[] {
    const result: SpreadPresence[] = presences.map(p => ({ ...p }));
    const clusters: number[][] = [];

    // Find clusters of nearby users
    result.forEach((p, i) => {
        if (!p.location) return;
        let foundCluster = false;

        for (const cluster of clusters) {
            const firstInCluster = result[cluster[0]];
            if (firstInCluster.location) {
                const dist = calculateDistance(
                    p.location.lat, p.location.lng,
                    firstInCluster.location.lat, firstInCluster.location.lng
                );
                if (dist < threshold) {
                    cluster.push(i);
                    foundCluster = true;
                    break;
                }
            }
        }

        if (!foundCluster) {
            clusters.push([i]);
        }
    });

    // Spread out each cluster in a circle
    clusters.forEach(cluster => {
        if (cluster.length > 1) {
            const radius = 0.0002; // ~20 meters in degrees
            cluster.forEach((idx, position) => {
                const angle = (2 * Math.PI * position) / cluster.length;
                const person = result[idx];
                if (person.location) {
                    person.offsetLat = person.location.lat + radius * Math.cos(angle);
                    person.offsetLng = person.location.lng + radius * Math.sin(angle);
                }
            });
        }
    });

    return result;
}

function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, 13);
    }, [center, map]);
    return null;
}

export default function Tracker() {
    const { user } = useAuth();
    const [others, setOthers] = useState<PresenceInfo[]>([]);
    const [myLoc, setMyLoc] = useState<[number, number] | null>(null);
    const [isNearHome, setIsNearHome] = useState(false);
    const [trackingEnabled, setTrackingEnabled] = useState(false);
    const [activeChat, setActiveChat] = useState<{ roomId: string; name: string } | null>(null);
    const [chatLoading, setChatLoading] = useState(false);
    const watchId = useRef<number | null>(null);

    const dataService = Effect.runSync(
        Effect.gen(function* (_) {
            return yield* _(DataService);
        }).pipe(Effect.provide(DataServiceLive))
    );

    // Spread out markers that are too close to each other
    const spreadOthers = spreadMarkers(others);

    useEffect(() => {
        // Subscribe to others' presence
        const presenceEffect = dataService.getPresenceStream();
        const stream = Effect.runSync(presenceEffect);
        const reader = stream.getReader();

        let isActive = true;
        const read = async () => {
            while (isActive) {
                const { value, done } = await reader.read();
                if (done) break;
                if (value) {
                    // Filter out self and users without location
                    setOthers(value.filter(p => p.uid !== user?.uid && p.location !== null));
                }
            }
        };
        read();

        return () => {
            isActive = false;
            reader.cancel();
            if (user?.uid) {
                Effect.runPromise(dataService.removePresence(user.uid));
            }
        };
    }, [user?.uid]);

    useEffect(() => {
        if (trackingEnabled) {
            startTracking();
        } else {
            stopTracking();
        }
        return () => stopTracking();
    }, [
        trackingEnabled,
        user?.trackerSettings?.isEnabled,
        user?.trackerSettings?.status,
        user?.trackerSettings?.allowContact,
        user?.trackerSettings?.privacyRadius,
        user?.homeLocation
    ]);

    const startTracking = () => {
        if (!navigator.geolocation) return;

        // Clear existing watch if any to avoid duplicates
        if (watchId.current !== null) {
            navigator.geolocation.clearWatch(watchId.current);
        }

        watchId.current = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setMyLoc([latitude, longitude]);

                let tooClose = false;
                if (user?.homeLocation) {
                    const dist = calculateDistance(
                        latitude, longitude,
                        user.homeLocation.lat, user.homeLocation.lng
                    );
                    tooClose = dist < (user.trackerSettings?.privacyRadius || 500);
                    setIsNearHome(tooClose);
                }

                const isVisible = user?.trackerSettings?.isEnabled ?? false;

                // Update presence only if visible and not near home
                if (user && isVisible && !tooClose) {
                    Effect.runPromise(dataService.updatePresence({
                        uid: user.uid,
                        displayName: user.displayName || 'Anonymous',
                        photoURL: user.photoURL || '',
                        status: user.trackerSettings?.status || 'Jen tak',
                        location: { lat: latitude, lng: longitude },
                        lastActive: new Date(),
                        allowContact: user.trackerSettings?.allowContact || false
                    })).catch(err => {
                        console.error("Failed to update presence:", err);
                    });
                } else if (user) {
                    // If invisible or near home, ensure we are removed from map
                    Effect.runPromise(dataService.removePresence(user.uid));
                }
            },
            (err) => console.error(err),
            { enableHighAccuracy: true }
        );
    };

    const stopTracking = () => {
        if (watchId.current !== null) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
        }
        if (user?.uid) {
            Effect.runPromise(dataService.removePresence(user.uid));
        }
    };

    if (!user) {
        return (
            <LoginRequired
                title="Live Tracker je zamčený"
                message="Pro zobrazení mapy a polohy ostatních uživatelů se musíte přihlásit."
                icon={Navigation}
            />
        );
    }

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand text-brand-contrast rounded-xl shadow-lg shadow-brand/20">
                        <Navigation size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black italic uppercase tracking-tighter">Live Tracker</h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Kdo je právě v okolí?</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {isNearHome && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold border border-amber-100 animate-pulse">
                            <Shield size={14} /> Privacy Zone (Skryto)
                        </div>
                    )}
                    <button
                        onClick={() => setTrackingEnabled(!trackingEnabled)}
                        className={`px-6 py-2 rounded-full font-black uppercase text-xs tracking-wider transition-all shadow-md ${trackingEnabled
                            ? 'bg-red-50 text-red-500 border border-red-100 hover:bg-red-100'
                            : 'bg-brand text-brand-contrast hover:bg-brand-dark'
                            }`}
                    >
                        {trackingEnabled ? 'Zastavit sledování' : 'Spustit sledování'}
                    </button>
                </div>
            </div>

            <div className="flex-1 rounded-3xl overflow-hidden border-4 border-white shadow-2xl relative z-0">
                <MapContainer
                    center={[49.8175, 15.4730]}
                    zoom={7}
                    className="h-full w-full"
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    {myLoc && !isNearHome && (
                        <Marker position={myLoc} icon={L.divIcon({
                            className: 'custom-icon',
                            html: `
                                <div class="flex flex-col items-center">
                                    <div class="px-2 py-0.5 bg-white border-2 border-white text-[10px] font-bold rounded-full shadow-sm mb-[-6px] z-20 relative max-w-[100px] truncate text-center text-slate-700">
                                        ${user?.trackerSettings?.status || 'Jen tak'}
                                    </div>
                                    <div class="relative z-10">
                                        <div class="w-12 h-12 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-slate-100 relative z-10">
                                            ${user?.photoURL
                                    ? `<img src="${user.photoURL}" class="w-full h-full object-cover" />`
                                    : `<div class="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                                </div>`
                                }
                                        </div>
                                        <div class="absolute -inset-2 bg-brand/30 rounded-full animate-ping z-0"></div>
                                    </div>
                                </div>
                            `,
                            iconSize: [48, 68], // Height increased to accommodate status
                            iconAnchor: [24, 48], // Anchored at bottom center of the whole group effectively
                            popupAnchor: [0, -48]
                        })}>
                            <Popup>
                                <div className="p-1">
                                    <p className="font-black italic uppercase text-xs">Ty (Live)</p>
                                    <p className="text-[10px] text-slate-500">{user?.trackerSettings?.status || 'Jen tak'}</p>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {spreadOthers.map(p => p.location && (
                        <Marker
                            key={p.uid}
                            position={[
                                p.offsetLat || p.location.lat,
                                p.offsetLng || p.location.lng
                            ]}
                            icon={L.divIcon({
                                className: 'custom-icon',
                                html: `
                                <div class="flex flex-col items-center transform transition-transform hover:scale-110 origin-bottom">
                                    <div class="px-2 py-0.5 bg-white border-2 border-white text-[10px] font-bold rounded-full shadow-sm mb-[-4px] z-20 relative max-w-[80px] truncate text-center text-slate-700">
                                        ${p.status || 'Jen tak'}
                                    </div>
                                    <div class="w-10 h-10 rounded-full border-2 border-white shadow-xl overflow-hidden bg-slate-100 z-10">
                                        ${p.photoURL
                                        ? `<img src="${p.photoURL}" class="w-full h-full object-cover" />`
                                        : `<div class="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                           </div>`
                                    }
                                    </div>
                                </div>
                            `,
                                iconSize: [40, 60],
                                iconAnchor: [20, 42],
                                popupAnchor: [0, -42]
                            })}>
                            <Popup>
                                <div className="p-2 min-w-[150px]">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-100">
                                            {p.photoURL ? <img src={p.photoURL} alt={p.displayName} /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center"><User size={16} /></div>}
                                        </div>
                                        <h4 className="font-bold text-sm">{p.displayName}</h4>
                                    </div>
                                    <p className="text-xs bg-slate-50 p-2 rounded-lg font-medium text-slate-600 mb-3 border border-slate-100">
                                        "{p.status || 'Jen tak'}"
                                    </p>
                                    {p.allowContact && (
                                        <button
                                            onClick={async () => {
                                                if (!user) return;
                                                setChatLoading(true);
                                                try {
                                                    const roomId = await Effect.runPromise(dataService.getOrCreateChatRoom(user.uid, p.uid));
                                                    setActiveChat({ roomId, name: p.displayName });
                                                } finally {
                                                    setChatLoading(false);
                                                }
                                            }}
                                            className="w-full bg-brand text-brand-contrast py-1.5 rounded-xl text-[10px] font-black uppercase italic tracking-wider flex items-center justify-center gap-2 hover:bg-brand-dark transition-all shadow-sm"
                                        >
                                            <MessageCircle size={14} /> {chatLoading ? 'Načítám...' : 'Chat'}
                                        </button>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {myLoc && <MapUpdater center={myLoc} />}
                </MapContainer>

                {!trackingEnabled && (
                    <div className="absolute inset-0 z-10 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-8 text-center">
                        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm space-y-4">
                            <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mx-auto">
                                <Navigation size={32} />
                            </div>
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Tracker je vypnutý</h2>
                            <p className="text-slate-500 text-sm font-medium">
                                Pro zobrazení mapy a ostatních uživatelů musíš povolit sledování své polohy. Platí tvoje nastavení soukromí.
                            </p>
                            <button
                                onClick={() => setTrackingEnabled(true)}
                                className="bg-brand text-brand-contrast w-full py-3 rounded-2xl font-black uppercase italic tracking-tighter shadow-lg hover:shadow-brand/20 transition-all"
                            >
                                Zapnout a vidět ostatní
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {activeChat && (
                <ChatDrawer
                    roomId={activeChat.roomId}
                    recipientName={activeChat.name}
                    onClose={() => setActiveChat(null)}
                />
            )}
        </div>
    );
}
