import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { registerPlugin } from '@capacitor/core';
import type { BackgroundGeolocationPlugin } from '@capacitor-community/background-geolocation';
const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');
import { LocalNotifications } from '@capacitor/local-notifications';
import { Effect } from 'effect';
import { DataService, DataServiceLive } from '../services/DataService';
import { getImageUrl } from '../lib/imageService';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { Navigation, MessageCircle, Shield, User, AlertTriangle, Wrench, Fuel, CircleSlash, HelpCircle, Phone, CheckCircle, X } from 'lucide-react';
import type { PresenceInfo } from '../types/chat';
import type { HelpBeacon, BeaconType } from '../types';
import LoginRequired from '../components/LoginRequired';
import HelpBeaconModal from '../components/HelpBeaconModal';
import 'leaflet/dist/leaflet.css';
import { Capacitor } from '@capacitor/core';

// Fix Leaflet icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Geolocation wrapper that works in both native and web environments
const isNativePlatform = Capacitor.isNativePlatform();

async function checkLocationPermission(): Promise<boolean> {
    if (isNativePlatform) {
        try {
            // First check local notifications permission since we might use them
            await LocalNotifications.requestPermissions();

            // BackgroundGeolocation requests permission on addWatcher automatically,
            // but we can check if it's already running or fail gracefully later.
            // There's no separate checkPermissions method exposed in the community plugin
            // standard API, so we assume true to proceed with watcher initiation block,
            // which will handle the native prompt.
            return true;
        } catch (e) {
            console.error('Error checking permissions:', e);
            return false;
        }
    } else {
        return 'geolocation' in navigator;
    }
}

async function requestLocationPermission(): Promise<boolean> {
    if (isNativePlatform) {
        try {
            // Permission is handled by addWatcher
            return true;
        } catch (e) {
            console.error('Error requesting permissions:', e);
            return false;
        }
    } else {
        return 'geolocation' in navigator;
    }
}

async function watchPosition(
    callback: (position: { coords: { latitude: number; longitude: number } }) => void,
    errorCallback: (error: any) => void
): Promise<string | number> {
    if (isNativePlatform) {
        try {
            const watcher_id = await BackgroundGeolocation.addWatcher(
                {
                    // Option config for BackgroundGeolocation
                    backgroundMessage: "Sledujeme tvou polohu a upozorníme tě na ostatní uživatele.",
                    backgroundTitle: "Live Tracker aktivní",
                    requestPermissions: true,
                    stale: false,
                    distanceFilter: 10 // meters before update
                },
                (location, error) => {
                    if (error) {
                        if (error.code === "NOT_AUTHORIZED") {
                            errorCallback({ code: 1, message: "Permission Denied" });
                        } else {
                            errorCallback(error);
                        }
                        return;
                    }
                    if (location) {
                        callback({
                            coords: {
                                latitude: location.latitude,
                                longitude: location.longitude
                            }
                        });
                    }
                }
            );
            return watcher_id;
        } catch (e) {
            errorCallback(e);
            return 'error_id';
        }
    } else {
        // Use browser's geolocation API for web
        return navigator.geolocation.watchPosition(
            (position) => callback(position),
            (error) => errorCallback(error),
            { enableHighAccuracy: true, maximumAge: 0 }
        );
    }
}

function clearWatch(watchId: string | number) {
    if (isNativePlatform && typeof watchId === 'string') {
        BackgroundGeolocation.removeWatcher({ id: watchId });
    } else if (!isNativePlatform && typeof watchId === 'number') {
        navigator.geolocation.clearWatch(watchId);
    }
}

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
    const [others, setOthers] = useState<PresenceInfo[]>([]);
    const [myLoc, setMyLoc] = useState<[number, number] | null>(null);
    const [isNearHome, setIsNearHome] = useState(false);
    const [trackingEnabled, setTrackingEnabled] = useState(false);
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
    const [beacons, setBeacons] = useState<HelpBeacon[]>([]);
    const [showSOSModal, setShowSOSModal] = useState(false);
    const [sosLoading, setSOSLoading] = useState(false);
    const [myBeacon, setMyBeacon] = useState<HelpBeacon | null>(null);

    const watchId = useRef<string | number | null>(null);

    const dataService = Effect.runSync(
        Effect.gen(function* (_) {
            return yield* _(DataService);
        }).pipe(Effect.provide(DataServiceLive))
    );

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

    // Subscribe to active help beacons
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
                    // Filter to beacons within 50km and update myBeacon if exists
                    const filtered = value.filter(b => {
                        if (b.userId === user?.uid) {
                            setMyBeacon(b);
                            return false; // Don't show own beacon in list
                        }
                        if (!myLoc) return true; // Show all if no location yet
                        const dist = calculateDistance(myLoc[0], myLoc[1], b.location.lat, b.location.lng);
                        return dist <= 50000; // 50km
                    });
                    setBeacons(filtered);

                    // Clear myBeacon if not in the list anymore
                    const myBeaconInList = value.find(b => b.userId === user?.uid);
                    if (!myBeaconInList) setMyBeacon(null);
                }
            }
        };
        read();

        return () => {
            isActive = false;
            reader.cancel();
        };
    }, [user?.uid, myLoc]);

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

    // Keep track of notified users per session to prevent spam
    const notifiedUsers = useRef<Set<string>>(new Set());

    const startTracking = async () => {
        try {
            // Permission is already checked and granted by the button handlers
            // This just starts the actual tracking

            // Clear existing watch if any to avoid duplicates
            if (watchId.current !== null) {
                clearWatch(watchId.current);
            }

            const id = await watchPosition(
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
                            fallbackPhotoURL: user.fallbackPhotoURL || null,
                            status: user.trackerSettings?.status || 'Jen tak',
                            location: { lat: latitude, lng: longitude },
                            lastActive: new Date(),
                            allowContact: user.trackerSettings?.allowContact || false
                        })).catch(err => {
                            console.error("Failed to update presence:", err);
                        });

                        // Check for proximity alerts
                        if (user.notificationSettings?.proximityAlerts) {
                            const radiusKm = user.notificationSettings?.proximityRadiusKm || 20;
                            const radiusMeters = radiusKm * 1000;

                            // Need to access current state of others
                            setOthers(currentOthers => {
                                currentOthers.forEach(p => {
                                    // Don't notify for myself, no location, or already notified this session
                                    if (p.uid === user.uid || !p.location || notifiedUsers.current.has(p.uid)) return;

                                    const dist = calculateDistance(latitude, longitude, p.location.lat, p.location.lng);
                                    if (dist <= radiusMeters) {
                                        // Proximity trigger!
                                        notifiedUsers.current.add(p.uid);

                                        // Schedule local notification
                                        LocalNotifications.schedule({
                                            notifications: [
                                                {
                                                    title: "Někdo je blízko!",
                                                    body: `${p.displayName} je v tvé oblasti (${Math.round(dist / 1000)} km daleko). Styl: ${p.status || 'Jen tak'}`,
                                                    id: new Date().getTime(),
                                                    schedule: { at: new Date(Date.now() + 1000) },
                                                    sound: undefined,
                                                    attachments: undefined,
                                                    actionTypeId: "",
                                                    extra: null
                                                }
                                            ]
                                        }).catch(err => console.error("Error scheduling local notification:", err));
                                    }
                                });
                                return currentOthers;
                            });
                        }
                    } else if (user) {
                        // If invisible or near home, ensure we are removed from map
                        Effect.runPromise(dataService.removePresence(user.uid));
                    }
                },
                (err) => {
                    console.error("Tracking error:", err);
                    // Only disable tracking if permission was denied (code 1)
                    // Other errors (timeout, position unavailable) should not stop tracking
                    if (err.code === 1) {
                        alert('Přístup k poloze byl zamítnut. Tracker byl vypnut.');
                        setTrackingEnabled(false);
                    }
                }
            );

            watchId.current = id;
        } catch (e) {
            console.error("Error starting tracking", e);
            // If tracking fails, disable it
            setTrackingEnabled(false);
        }
    };

    const stopTracking = () => {
        if (watchId.current !== null) {
            clearWatch(watchId.current);
            watchId.current = null;
        }
        if (user?.uid) {
            Effect.runPromise(dataService.removePresence(user.uid));
        }
    };

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

