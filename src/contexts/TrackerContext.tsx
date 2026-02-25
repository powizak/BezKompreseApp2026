import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { registerPlugin, Capacitor } from '@capacitor/core';
import type { BackgroundGeolocationPlugin } from '@capacitor-community/background-geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Effect } from 'effect';
import { DataService, DataServiceLive } from '../services/DataService';
import { useAuth } from './AuthContext';
import type { PresenceInfo } from '../types/chat';

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');
const isNativePlatform = Capacitor.isNativePlatform();

export async function checkLocationPermission(): Promise<boolean> {
    if (isNativePlatform) {
        try {
            await LocalNotifications.requestPermissions();
            return true;
        } catch (e) {
            console.error('Error checking permissions:', e);
            return false;
        }
    } else {
        return 'geolocation' in navigator;
    }
}

export async function requestLocationPermission(): Promise<boolean> {
    if (isNativePlatform) {
        try {
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
                    backgroundMessage: "Sledujeme tvou polohu a upozorníme tě na ostatní uživatele.",
                    backgroundTitle: "Live Tracker aktivní",
                    requestPermissions: true,
                    stale: false,
                    distanceFilter: 10
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

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

interface TrackerContextType {
    trackingEnabled: boolean;
    setTrackingEnabled: (enabled: boolean) => void;
    myLoc: [number, number] | null;
    others: PresenceInfo[];
    isNearHome: boolean;
}

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

export function TrackerProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [others, setOthers] = useState<PresenceInfo[]>([]);
    const [myLoc, setMyLoc] = useState<[number, number] | null>(null);
    const [isNearHome, setIsNearHome] = useState(false);

    // Initialize trackingEnabled from localStorage to preserve across reloads if possible, but false by default
    // We only enable it based on user action.
    const [trackingEnabled, setTrackingEnabled] = useState(false);

    const watchId = useRef<string | number | null>(null);
    const notifiedUsers = useRef<Set<string>>(new Set());

    const dataService = Effect.runSync(
        Effect.gen(function* (_) {
            return yield* _(DataService);
        }).pipe(Effect.provide(DataServiceLive))
    );

    useEffect(() => {
        const presenceEffect = dataService.getPresenceStream();
        const stream = Effect.runSync(presenceEffect);
        const reader = stream.getReader();

        let isActive = true;
        const read = async () => {
            while (isActive) {
                const { value, done } = await reader.read();
                if (done) break;
                if (value) {
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

    const startTracking = async () => {
        try {
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

                        if (user.notificationSettings?.proximityAlerts) {
                            const radiusKm = user.notificationSettings?.proximityRadiusKm || 20;
                            const radiusMeters = radiusKm * 1000;

                            setOthers(currentOthers => {
                                currentOthers.forEach(p => {
                                    if (p.uid === user.uid || !p.location || notifiedUsers.current.has(p.uid)) return;

                                    const dist = calculateDistance(latitude, longitude, p.location.lat, p.location.lng);
                                    if (dist <= radiusMeters) {
                                        notifiedUsers.current.add(p.uid);

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
                        Effect.runPromise(dataService.removePresence(user.uid));
                    }
                },
                (err) => {
                    console.error("Tracking error:", err);
                    if (err.code === 1) {
                        alert('Přístup k poloze byl zamítnut. Tracker byl vypnut.');
                        setTrackingEnabled(false);
                    }
                }
            );

            watchId.current = id;
        } catch (e) {
            console.error("Error starting tracking", e);
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

    return (
        <TrackerContext.Provider value={{
            trackingEnabled,
            setTrackingEnabled,
            myLoc,
            others,
            isNearHome
        }}>
            {children}
        </TrackerContext.Provider>
    );
}

export function useTracker() {
    const context = useContext(TrackerContext);
    if (context === undefined) {
        throw new Error('useTracker must be used within a TrackerProvider');
    }
    return context;
}
