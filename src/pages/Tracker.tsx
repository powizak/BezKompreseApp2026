import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { Effect } from 'effect';
import { DataService, DataServiceLive } from '../services/DataService';
import { useTracker, checkLocationPermission, requestLocationPermission, calculateDistance } from '../contexts/TrackerContext';
import { getImageUrl } from '../lib/imageService';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { Navigation, MessageCircle, Shield, User, AlertTriangle, Wrench, Fuel, CircleSlash, HelpCircle, Phone, CheckCircle, X } from 'lucide-react';
import type { HelpBeacon, BeaconType } from '../types';
import LoginRequired from '../components/LoginRequired';
import HelpBeaconModal from '../components/HelpBeaconModal';
import 'leaflet/dist/leaflet.css';
// Fix Leaflet icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapUpdater({ center, isAutoFollow, onAutoFollowChange }: {
    center: [number, number];
    isAutoFollow: boolean;
    onAutoFollowChange: (enabled: boolean) => void;
}) {
    const map = useMap();

    useEffect(() => {
        if (isAutoFollow && center) {
            map.flyTo(center, map.getZoom() || 13);
        }
    }, [center, isAutoFollow, map]);

    useEffect(() => {
        const handleInteraction = () => {
            if (isAutoFollow) {
                onAutoFollowChange(false);
            }
        };

        const container = map.getContainer();
        container.addEventListener('mousedown', handleInteraction);
        container.addEventListener('touchstart', handleInteraction, { passive: true });
        container.addEventListener('wheel', handleInteraction, { passive: true });

        return () => {
            container.removeEventListener('mousedown', handleInteraction);
            container.removeEventListener('touchstart', handleInteraction);
            container.removeEventListener('wheel', handleInteraction);
        };
    }, [map, isAutoFollow, onAutoFollowChange]);

    return null;
}

// Custom icon create function for clusters
const createClusterCustomIcon = function (cluster: any) {
    return L.divIcon({
        html: `<div class="flex items-center justify-center w-full h-full bg-brand text-brand-contrast font-black rounded-full border-4 border-white shadow-xl text-sm">${cluster.getChildCount()}</div>`,
        className: 'custom-marker-cluster',
        iconSize: L.point(40, 40, true),
    });
}

export default function Tracker() {
    const { user } = useAuth();
    const { openChat } = useChat();
    const { trackingEnabled, setTrackingEnabled, myLoc, others, isNearHome } = useTracker();
    const [chatLoading, setChatLoading] = useState(false);
    const [isAutoFollow, setIsAutoFollow] = useState(true);
    const [showBgPrompt, setShowBgPrompt] = useState(false);

    useEffect(() => {
        const dismissed = localStorage.getItem('bgLocationPromptDismissed');
        if (trackingEnabled && !dismissed) {
            setShowBgPrompt(true);
        } else if (!trackingEnabled) {
            setShowBgPrompt(false);
        }
    }, [trackingEnabled]);

    const dismissBgPrompt = () => {
        localStorage.setItem('bgLocationPromptDismissed', 'true');
        setShowBgPrompt(false);
    };

    // Help Beacon state
    const [allBeacons, setAllBeacons] = useState<HelpBeacon[]>([]);
    const [beacons, setBeacons] = useState<HelpBeacon[]>([]);
    const [showSOSModal, setShowSOSModal] = useState(false);
    const [sosLoading, setSOSLoading] = useState(false);
    const [myBeacon, setMyBeacon] = useState<HelpBeacon | null>(null);

    const dataService = Effect.runSync(
        Effect.gen(function* (_) {
            return yield* _(DataService);
        }).pipe(Effect.provide(DataServiceLive))
    );

    // Subscribe to all active help beacons independently of location
    useEffect(() => {
        const beaconEffect = dataService.getActiveBeaconsStream();
        const stream = Effect.runSync(beaconEffect);
        const reader = stream.getReader();

        let isActive = true;
        const read = async () => {
            while (isActive) {
                const { value, done } = await reader.read();
                if (done) break;
                if (value) {
                    setAllBeacons(value);
                }
            }
        };
        read();

        return () => {
            isActive = false;
            reader.cancel();
        };
    }, []);

    // Dynamically filter beacons based on myLoc and userId
    useEffect(() => {
        // Filter to beacons within 50km and update myBeacon if exists
        const filtered = allBeacons.filter(b => {
            if (b.userId === user?.uid) {
                // Own beacon is handled by setMyBeacon below
                return false;
            }
            if (!myLoc) return true; // Show all if no tracking location yet
            const dist = calculateDistance(myLoc[0], myLoc[1], b.location.lat, b.location.lng);
            return dist <= 50000; // 50km
        });
        setBeacons(filtered);

        // Update myBeacon status
        const myBeaconInList = allBeacons.find(b => b.userId === user?.uid);
        if (myBeaconInList) {
            setMyBeacon(myBeaconInList);
        } else {
            setMyBeacon(null);
        }
    }, [allBeacons, myLoc, user?.uid]);

    // S.O.S. Beacon handlers
    const handleSOSSubmit = async (beaconType: BeaconType, description?: string) => {
        if (!user || !myLoc) return;

        setSOSLoading(true);
        try {
            await Effect.runPromise(dataService.createHelpBeacon({
                userId: user.uid,
                displayName: user.displayName || 'Anonymous',
                photoURL: user.photoURL || null,
                location: { lat: myLoc[0], lng: myLoc[1] },
                beaconType,
                description,
                status: 'active'
            }));
            setShowSOSModal(false);
        } catch (err) {
            console.error("Failed to create beacon:", err);
        } finally {
            setSOSLoading(false);
        }
    };

    const handleRespondToBeacon = async (beacon: HelpBeacon) => {
        if (!user) return;
        try {
            await Effect.runPromise(dataService.respondToBeacon(beacon.id, user.uid, user.displayName || 'Anonymous'));
        } catch (err) {
            console.error("Failed to respond to beacon:", err);
        }
    };

    const handleResolveBeacon = async () => {
        if (!myBeacon) return;
        try {
            await Effect.runPromise(dataService.deleteHelpBeacon(myBeacon.id));
            setMyBeacon(null);
        } catch (err) {
            console.error("Failed to resolve beacon:", err);
        }
    };

    const getBeaconIcon = (type: BeaconType) => {
        switch (type) {
            case 'breakdown': return <Wrench size={16} />;
            case 'empty_tank': return <Fuel size={16} />;
            case 'accident': return <AlertTriangle size={16} />;
            case 'flat_tire': return <CircleSlash size={16} />;
            default: return <HelpCircle size={16} />;
        }
    };

    const getBeaconLabel = (type: BeaconType) => {
        switch (type) {
            case 'breakdown': return 'Porucha';
            case 'empty_tank': return 'Prázdná nádrž';
            case 'accident': return 'Nehoda';
            case 'flat_tire': return 'Defekt';
            default: return 'Jiné';
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
                        onClick={async () => {
                            const newStatus = !trackingEnabled;

                            if (newStatus) {
                                // Request permission DIRECTLY in user action for iOS Safari compatibility
                                try {
                                    const hasPermission = await checkLocationPermission();

                                    if (!hasPermission) {
                                        const granted = await requestLocationPermission();
                                        if (!granted) {
                                            alert('Pro zapnutí trackeru je nutné povolit přístup k poloze.');
                                            return;
                                        }
                                    }

                                    setTrackingEnabled(true);
                                    setIsAutoFollow(true);
                                } catch (e) {
                                    console.error('Failed to request permissions:', e);
                                    alert('Nepodařilo se požádat o oprávnění k poloze.');
                                }
                            } else {
                                setTrackingEnabled(false);
                            }
                        }}
                        className={`px-6 py-2 rounded-full font-black uppercase text-xs tracking-wider transition-all shadow-md ${trackingEnabled
                            ? 'bg-red-50 text-red-500 border border-red-100 hover:bg-red-100'
                            : 'bg-brand text-brand-contrast hover:bg-brand-dark'
                            }`}
                    >
                        {trackingEnabled ? 'Zastavit sledování' : 'Spustit sledování'}
                    </button>
                    {trackingEnabled && !isAutoFollow && (
                        <button
                            onClick={() => setIsAutoFollow(true)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-full shadow-sm border border-blue-100 animate-pulse hover:bg-blue-100 transition-all"
                            title="Sledovat moji polohu"
                        >
                            <Navigation size={18} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 rounded-3xl overflow-hidden border-4 border-white shadow-2xl relative z-0">
                {showBgPrompt && (
                    <div className="absolute top-4 left-4 right-4 z-[1000] bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-3xl shadow-2xl border border-slate-700 animate-in slide-in-from-top fade-in duration-500">
                        <button
                            onClick={dismissBgPrompt}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                        <div className="flex items-start gap-4">
                            <div className="p-2.5 bg-amber-500/20 text-amber-500 rounded-xl shrink-0 mt-1">
                                <AlertTriangle size={24} />
                            </div>
                            <div className="space-y-2 pr-4">
                                <h3 className="font-black italic uppercase tracking-tighter text-lg leading-tight text-white mb-1">Běh na pozadí</h3>
                                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                                    Aby tě aplikace správně upozornila na ostatní zhasnutém displeji, ujisti se, že v nastavení telefonu máš povolený přístup k poloze na <strong className="text-white bg-white/10 px-1 py-0.5 rounded">Vždy povolit</strong>.
                                </p>
                                <div className="flex flex-wrap gap-2 pt-3">
                                    <button
                                        onClick={() => {
                                            import("capacitor-native-settings").then(({ NativeSettings, AndroidSettings, IOSSettings }) => {
                                                NativeSettings.open({
                                                    optionAndroid: AndroidSettings.ApplicationDetails,
                                                    optionIOS: IOSSettings.App
                                                }).catch(console.error);
                                            });
                                            dismissBgPrompt();
                                        }}
                                        className="bg-brand text-brand-contrast px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-brand-dark transition-all shadow-lg shadow-brand/20"
                                    >
                                        Zkontrolovat
                                    </button>
                                    <button
                                        onClick={dismissBgPrompt}
                                        className="bg-slate-700/50 text-slate-300 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-700 transition-all border border-slate-600/50"
                                    >
                                        Už mám
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <MapContainer
                    center={[49.8175, 15.4730]}
                    zoom={7}
                    className="h-full w-full"
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    <MarkerClusterGroup
                        chunkedLoading
                        iconCreateFunction={createClusterCustomIcon}
                    >
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
                                                ${(user?.photoURL || user?.fallbackPhotoURL)
                                        ? `<img src="${user?.fallbackPhotoURL || user?.photoURL}" class="w-full h-full object-cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div style="display:none" class="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>`
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

                        {others.map(p => p.location && (
                            <Marker
                                key={p.uid}
                                position={[
                                    p.location.lat,
                                    p.location.lng
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
                                            ? `<img src="${p.photoURL}" class="w-full h-full object-cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div style="display:none" class="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>`
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
                                                        const roomId = await Effect.runPromise(
                                                            dataService.getOrCreateChatRoom(
                                                                user.uid, user.displayName || 'Anonymous', user.photoURL ? getImageUrl(user.photoURL) : null,
                                                                p.uid, p.displayName, p.photoURL || null
                                                            )
                                                        );
                                                        openChat(roomId, p.uid, p.displayName);
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
                    </MarkerClusterGroup>

                    {/* Help Beacon markers */}
                    {beacons.map(beacon => (
                        <Marker
                            key={beacon.id}
                            position={[beacon.location.lat, beacon.location.lng]}
                            icon={L.divIcon({
                                className: 'beacon-marker',
                                html: `
                                    <div class="relative">
                                        <div class="absolute -inset-4 bg-red-500/30 rounded-full animate-ping"></div>
                                        <div class="absolute -inset-2 bg-red-500/50 rounded-full animate-pulse"></div>
                                        <div class="relative w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 border-4 border-white shadow-2xl flex items-center justify-center text-white">
                                            <span class="text-lg">🆘</span>
                                        </div>
                                    </div>
                                `,
                                iconSize: [48, 48],
                                iconAnchor: [24, 24],
                                popupAnchor: [0, -24]
                            })}
                        >
                            <Popup>
                                <div className="p-3 min-w-[180px]">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-red-100">
                                            {beacon.photoURL ? (
                                                <img
                                                    src={beacon.photoURL}
                                                    alt={beacon.displayName}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                        target.nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                />
                                            ) : null}
                                            <div className="w-full h-full bg-red-50 flex items-center justify-center text-red-400 hidden">
                                                <User size={20} />
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm">{beacon.displayName}</h4>
                                            <div className="flex items-center gap-1 text-red-500 text-xs font-bold">
                                                {getBeaconIcon(beacon.beaconType)}
                                                {getBeaconLabel(beacon.beaconType)}
                                            </div>
                                        </div>
                                    </div>
                                    {beacon.description && (
                                        <p className="text-xs bg-red-50 p-2 rounded-lg text-slate-600 mb-3 border border-red-100">
                                            "{beacon.description}"
                                        </p>
                                    )}
                                    {beacon.status === 'help_coming' && beacon.helperName && (
                                        <div className="text-xs bg-green-50 text-green-600 p-2 rounded-lg mb-3 border border-green-100 flex items-center gap-2">
                                            <CheckCircle size={14} /> {beacon.helperName} jede na pomoc
                                        </div>
                                    )}
                                    {beacon.status === 'active' && beacon.userId !== user?.uid && (
                                        <button
                                            onClick={() => handleRespondToBeacon(beacon)}
                                            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                                        >
                                            <Phone size={14} /> Jedu pomoct!
                                        </button>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {myLoc && (
                        <MapUpdater
                            center={myLoc}
                            isAutoFollow={isAutoFollow}
                            onAutoFollowChange={setIsAutoFollow}
                        />
                    )}
                </MapContainer>

                {/* Floating S.O.S. Button */}
                {trackingEnabled && !myBeacon && myLoc && (
                    <button
                        onClick={() => setShowSOSModal(true)}
                        className="absolute bottom-6 left-6 z-[1000] w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-2xl shadow-red-500/40 flex items-center justify-center hover:scale-110 transition-all active:scale-95"
                        title="S.O.S. - Potřebuji pomoc"
                    >
                        <span className="text-2xl font-black">🆘</span>
                    </button>
                )}

                {/* My Active Beacon Status */}
                {myBeacon && (
                    <div className="absolute bottom-6 left-6 right-6 z-[1000] bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 rounded-2xl shadow-2xl shadow-red-500/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                                    <span className="text-xl">🆘</span>
                                </div>
                                <div>
                                    <p className="font-black text-sm uppercase tracking-wider">
                                        Tvůj S.O.S. je aktivní
                                    </p>
                                    <p className="text-xs text-white/80">
                                        {getBeaconLabel(myBeacon.beaconType)}
                                        {myBeacon.status === 'help_coming' && myBeacon.helperName && (
                                            <span className="ml-2">• {myBeacon.helperName} jede!</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleResolveBeacon}
                                className="px-4 py-2 bg-white text-red-500 rounded-xl font-black text-xs uppercase hover:bg-white/90 transition-all flex items-center gap-2"
                            >
                                <CheckCircle size={14} /> Vyřešeno
                            </button>
                        </div>
                    </div>
                )}

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
                                onClick={async () => {
                                    // Request permission DIRECTLY in user action for iOS Safari compatibility
                                    try {
                                        const hasPermission = await checkLocationPermission();

                                        if (!hasPermission) {
                                            const granted = await requestLocationPermission();
                                            if (!granted) {
                                                alert('Pro zapnutí trackeru je nutné povolit přístup k poloze.');
                                                return;
                                            }
                                        }

                                        setTrackingEnabled(true);
                                        setIsAutoFollow(true);
                                    } catch (e) {
                                        console.error('Failed to request permissions:', e);
                                        alert('Nepodařilo se požádat o oprávnění k poloze.');
                                    }
                                }}
                                className="bg-brand text-brand-contrast w-full py-3 rounded-2xl font-black uppercase italic tracking-tighter shadow-lg hover:shadow-brand/20 transition-all"
                            >
                                Zapnout a vidět ostatní
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* S.O.S. Modal */}
            <HelpBeaconModal
                isOpen={showSOSModal}
                onClose={() => setShowSOSModal(false)}
                onSubmit={handleSOSSubmit}
                isLoading={sosLoading}
            />
        </div>
    );
}

