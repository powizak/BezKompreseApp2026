import { Context, Effect, Layer } from "effect";
import {
    collection, addDoc, getDocs, query, where, updateDoc, doc, limit, deleteDoc,
    getDoc, getDocFromServer, onSnapshot, setDoc, serverTimestamp, Timestamp, orderBy, writeBatch, deleteField
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { Car, AppEvent, SocialPost, UserProfile, ServiceRecord, FuelRecord, HelpBeacon, EventType, EventComment, MarketplaceListing, ImageVariants } from "../types";
import type { PresenceInfo, Message, ChatRoom } from "../types/chat";
import { processAndUploadImage, processAndUploadAvatar } from "../lib/imageService";
import { BadgeService } from "./BadgeService";

export class DataError {
    readonly _tag = "DataError";
    readonly message: string;
    readonly originalError: unknown;
    constructor(message: string, originalError: unknown) {
        this.message = message;
        this.originalError = originalError;
    }
}

export interface DataService {
    readonly getMyCars: (userId: string) => Effect.Effect<Car[], DataError>;
    readonly addCar: (car: Omit<Car, "id">) => Effect.Effect<string, DataError>;
    readonly updateCar: (carId: string, data: Partial<Car>) => Effect.Effect<void, DataError>;
    readonly deleteCar: (carId: string) => Effect.Effect<void, DataError>;
    readonly uploadCarPhoto: (file: File, carId: string) => Effect.Effect<ImageVariants, DataError>;
    readonly getEvents: Effect.Effect<AppEvent[], DataError>;
    readonly getEventsFiltered: (filters: { eventType?: EventType; upcoming?: boolean }) => Effect.Effect<AppEvent[], DataError>;
    readonly getEventById: (id: string) => Effect.Effect<AppEvent | undefined, DataError>;
    readonly addEvent: (event: Omit<AppEvent, "id">) => Effect.Effect<string, DataError>;
    readonly updateEvent: (eventId: string, data: Partial<AppEvent>) => Effect.Effect<void, DataError>;
    readonly deleteEvent: (eventId: string) => Effect.Effect<void, DataError>;
    readonly uploadEventImage: (file: File, eventId: string) => Effect.Effect<ImageVariants, DataError>;
    readonly getSocialFeed: Effect.Effect<SocialPost[], DataError>;
    readonly getUserProfile: (userId: string) => Effect.Effect<{ profile: UserProfile, cars: Car[] } | null, DataError>;
    readonly searchUsers: (query: string) => Effect.Effect<UserProfile[], DataError>;
    readonly addFriend: (currentUserId: string, friendId: string) => Effect.Effect<void, DataError>;
    readonly removeFriend: (currentUserId: string, friendId: string) => Effect.Effect<void, DataError>;
    readonly getAllUsers: (limitCount?: number) => Effect.Effect<UserProfile[], DataError>;
    readonly getTopUsers: (limitCount?: number) => Effect.Effect<UserProfile[], DataError>;
    readonly getRandomUsers: (limitCount?: number) => Effect.Effect<UserProfile[], DataError>;
    readonly getUserEvents: (userId: string) => Effect.Effect<{ created: AppEvent[], joined: AppEvent[] }, DataError>;
    readonly getAllCars: (limitCount?: number) => Effect.Effect<Car[], DataError>;
    readonly getCarsPaginated: (
        limitCount?: number,
        lastVisible?: any,
        filters?: { make?: string; model?: string; engine?: string }
    ) => Effect.Effect<{ cars: Car[], lastVisible: any }, DataError>;
    readonly getFilterOptions: () => Effect.Effect<{ filterMap: Record<string, Record<string, string[]>> }, DataError>;
    readonly getCarById: (carId: string) => Effect.Effect<Car | undefined, DataError>;

    // Profile & Tracker Settings
    readonly updateProfile: (userId: string, data: Partial<UserProfile>) => Effect.Effect<void, DataError>;

    // Presence & Tracking
    readonly updatePresence: (presence: PresenceInfo) => Effect.Effect<void, DataError>;
    readonly removePresence: (userId: string) => Effect.Effect<void, DataError>;
    readonly getPresenceStream: () => Effect.Effect<ReadableStream<PresenceInfo[]>, DataError>;

    readonly getOrCreateChatRoom: (
        userA: string, userAName: string, userAPhoto: string | null,
        userB: string, userBName: string, userBPhoto: string | null
    ) => Effect.Effect<string, DataError>;
    readonly sendMessage: (roomId: string, message: Omit<Message, "id" | "createdAt">) => Effect.Effect<void, DataError>;
    readonly getMessagesStream: (roomId: string) => Effect.Effect<ReadableStream<Message[]>, DataError>;
    readonly getUserChatsStream: (userId: string) => Effect.Effect<ReadableStream<ChatRoom[]>, DataError>;
    readonly cleanupOldMessages: (roomId: string) => Effect.Effect<number, DataError>;
    readonly deleteChat: (roomId: string) => Effect.Effect<void, DataError>;

    // Help Beacon (S.O.S.)
    readonly createHelpBeacon: (beacon: Omit<HelpBeacon, "id" | "createdAt" | "updatedAt">) => Effect.Effect<string, DataError>;
    readonly updateHelpBeacon: (beaconId: string, data: Partial<HelpBeacon>) => Effect.Effect<void, DataError>;
    readonly deleteHelpBeacon: (beaconId: string) => Effect.Effect<void, DataError>;
    readonly getActiveBeaconsStream: () => Effect.Effect<ReadableStream<HelpBeacon[]>, DataError>;
    readonly respondToBeacon: (beaconId: string, helperId: string, helperName: string) => Effect.Effect<void, DataError>;

    // Service Records
    readonly getServiceRecords: (carId: string, userId?: string) => Effect.Effect<ServiceRecord[], DataError>;
    readonly addServiceRecord: (record: Omit<ServiceRecord, "id">) => Effect.Effect<string, DataError>;
    readonly updateServiceRecord: (recordId: string, data: Partial<ServiceRecord>) => Effect.Effect<void, DataError>;
    readonly deleteServiceRecord: (recordId: string) => Effect.Effect<void, DataError>;

    // Fuel Records
    readonly getFuelRecords: (carId: string) => Effect.Effect<FuelRecord[], DataError>;
    readonly addFuelRecord: (record: Omit<FuelRecord, "id">) => Effect.Effect<string, DataError>;
    readonly updateFuelRecord: (recordId: string, data: Partial<FuelRecord>) => Effect.Effect<void, DataError>;
    readonly deleteFuelRecord: (recordId: string) => Effect.Effect<void, DataError>;

    // Event Participation
    readonly joinEvent: (eventId: string, userId: string) => Effect.Effect<void, DataError>;
    readonly leaveEvent: (eventId: string, userId: string) => Effect.Effect<void, DataError>;

    // Event Comments
    readonly getEventComments: (eventId: string) => Effect.Effect<EventComment[], DataError>;
    readonly addEventComment: (comment: Omit<EventComment, "id" | "createdAt">) => Effect.Effect<string, DataError>;
    readonly deleteEventComment: (commentId: string) => Effect.Effect<void, DataError>;

    // Marketplace
    readonly getMarketplaceListings: (limitCount?: number) => Effect.Effect<MarketplaceListing[], DataError>;
    readonly getMyMarketplaceListings: (userId: string) => Effect.Effect<MarketplaceListing[], DataError>;
    readonly addMarketplaceListing: (listing: Omit<MarketplaceListing, "id" | "createdAt">) => Effect.Effect<string, DataError>;
    readonly updateMarketplaceListing: (listingId: string, data: Partial<MarketplaceListing>) => Effect.Effect<void, DataError>;
    readonly deleteMarketplaceListing: (listingId: string) => Effect.Effect<void, DataError>;
    readonly getCarsForSale: (limitCount?: number) => Effect.Effect<Car[], DataError>;
    readonly markCarAsSold: (carId: string) => Effect.Effect<void, DataError>;
    readonly uploadListingImage: (file: File, listingId: string) => Effect.Effect<ImageVariants, DataError>;
    readonly uploadProfilePhoto: (file: File, userId: string) => Effect.Effect<string, DataError>;
}

export const DataService = Context.GenericTag<DataService>("DataService");

export const DataServiceLive = Layer.succeed(
    DataService,
    DataService.of({
        getAllCars: (limitCount = 50) => Effect.tryPromise({
            try: async () => {
                const q = query(
                    collection(db, "cars"),
                    orderBy("createdAt", "desc"),
                    limit(limitCount)
                );
                const snapshot = await getDocs(q);
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Car));
            },
            catch: (e) => new DataError("Failed to fetch all cars", e)
        }),
        getCarsPaginated: (limitCount = 18, lastVisible = null, filters: { make?: string; model?: string; engine?: string } = {}) => Effect.tryPromise({
            try: async () => {
                const constraints: any[] = [];

                // Add filters
                if (filters.make) constraints.push(where("make", "==", filters.make));
                if (filters.model) constraints.push(where("model", "==", filters.model));
                if (filters.engine) constraints.push(where("engine", "==", filters.engine));

                // Add sorting (must be consistent)
                // Use year as primary sort, name as secondary for stability
                constraints.push(orderBy("year", "desc"));
                constraints.push(orderBy("name", "asc"));

                // Add pagination cursor
                if (lastVisible) {
                    const { startAfter } = await import("firebase/firestore");
                    constraints.push(startAfter(lastVisible));
                }

                // Add limit
                constraints.push(limit(limitCount));

                const q = query(collection(db, "cars"), ...constraints);
                const snapshot = await getDocs(q);

                const cars = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Car));
                const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1] || null;

                return { cars, lastVisible: lastVisibleDoc };
            },
            catch: (e) => new DataError("Failed to fetch paginated cars", e)
        }),
        getFilterOptions: () => Effect.tryPromise({
            try: async () => {
                // Fetch all cars to build relational filter map (make → model → engines[])
                const q = query(
                    collection(db, "cars"),
                    orderBy("year", "desc"),
                    limit(5000)
                );
                const snapshot = await getDocs(q);

                // Build relational map: { make: { model: [engine1, engine2, ...] } }
                const filterMap: Record<string, Record<string, string[]>> = {};
                for (const doc of snapshot.docs) {
                    const data = doc.data();
                    const make = data.make as string;
                    const model = data.model as string;
                    const engine = data.engine as string;
                    if (!make) continue;

                    if (!filterMap[make]) filterMap[make] = {};
                    if (model) {
                        if (!filterMap[make][model]) filterMap[make][model] = [];
                        if (engine && !filterMap[make][model].includes(engine)) {
                            filterMap[make][model].push(engine);
                        }
                    }
                }

                // Sort engines within each model
                for (const make of Object.keys(filterMap)) {
                    for (const model of Object.keys(filterMap[make])) {
                        filterMap[make][model].sort();
                    }
                }

                return { filterMap };
            },
            catch: (e) => new DataError("Failed to fetch filter options", e)
        }),
        getMyCars: (userId) => Effect.tryPromise({
            try: async () => {
                const q = query(collection(db, "cars"), where("ownerId", "==", userId));
                const querySnapshot = await getDocs(q);
                return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Car));
            },
            catch: (e) => new DataError("Failed to fetch cars", e)
        }),

        addCar: (car) => Effect.tryPromise({
            try: async () => {
                // Filter out undefined values and empty strings
                const cleanCar = Object.fromEntries(
                    Object.entries(car)
                        .filter(([_, v]) => v !== undefined && v !== "")
                        .map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
                );
                const docRef = await addDoc(collection(db, "cars"), cleanCar);

                // Check Badges (Async, don't block)
                try {
                    const q = query(collection(db, "cars"), where("ownerId", "==", car.ownerId));
                    const snapshot = await getDocs(q);
                    const cars = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Car));
                    BadgeService.checkCarBadges(car.ownerId, cars).catch(console.error);
                } catch (e) {
                    console.error("Badge check failed", e);
                }

                return docRef.id;
            },
            catch: (e) => new DataError("Failed to add car", e)
        }),
        updateCar: (carId, data) => Effect.tryPromise({
            try: async () => {
                // Filter out undefined values, but allow null for explicit field deletion
                const cleanData = Object.fromEntries(
                    Object.entries(data)
                        .filter(([_, v]) => v !== undefined && v !== "")
                        .map(([k, v]) => {
                            if (v === null) return [k, deleteField()];
                            return [k, typeof v === 'string' ? v.trim() : v];
                        })
                );
                const carRef = doc(db, "cars", carId);
                await updateDoc(carRef, cleanData);

                // Check Badges
                try {
                    const carSnap = await getDoc(carRef);
                    if (carSnap.exists()) {
                        const carData = carSnap.data() as Car;
                        const q = query(collection(db, "cars"), where("ownerId", "==", carData.ownerId));
                        const snapshot = await getDocs(q);
                        const cars = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Car));
                        BadgeService.checkCarBadges(carData.ownerId, cars).catch(console.error);
                    }
                } catch (e) {
                    console.error("Badge check failed", e);
                }
            },
            catch: (e) => new DataError("Failed to update car", e)
        }),
        deleteCar: (carId) => Effect.tryPromise({
            try: async () => {
                const carRef = doc(db, "cars", carId);
                await deleteDoc(carRef);
            },
            catch: (e) => new DataError("Failed to delete car", e)
        }),
        uploadCarPhoto: (file, carId) => Effect.gen(function* (_) {
            const basePath = `cars/${carId}/${Date.now()}`;
            const result = yield* _(processAndUploadImage(file, basePath).pipe(
                Effect.mapError((e) => new DataError("Failed to upload car photo", e))
            ));
            return result;
        }),
        getEvents: Effect.tryPromise({
            try: async () => {
                const querySnapshot = await getDocs(collection(db, "events"));
                return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppEvent));
            },
            catch: (e) => new DataError("Failed to fetch events", e)
        }),
        getEventById: (id) => Effect.tryPromise({
            try: async () => {
                const docRef = doc(db, "events", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    return { id: docSnap.id, ...docSnap.data() } as AppEvent;
                }
                return undefined;
            },
            catch: (e) => new DataError("Failed to fetch event", e)
        }),
        addEvent: (event) => Effect.tryPromise({
            try: async () => {
                // Filter out undefined values as Firestore doesn't accept them
                const cleanEvent = Object.fromEntries(
                    Object.entries(event).filter(([_, v]) => v !== undefined)
                );
                const docRef = await addDoc(collection(db, "events"), cleanEvent);

                // Check Badges - Organizer
                if (event.creatorId) {
                    BadgeService.checkOrganizerBadge(event.creatorId).catch(console.error);
                }

                return docRef.id;
            },
            catch: (e) => new DataError("Failed to add event", e)
        }),
        getEventsFiltered: (filters) => Effect.tryPromise({
            try: async () => {
                const constraints: any[] = [];

                if (filters.eventType) {
                    constraints.push(where("eventType", "==", filters.eventType));
                }

                const q = constraints.length > 0
                    ? query(collection(db, "events"), ...constraints)
                    : query(collection(db, "events"));

                const snapshot = await getDocs(q);
                let events = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AppEvent));

                // Filter by upcoming in memory (Firestore doesn't support complex date comparisons easily)
                if (filters.upcoming !== undefined) {
                    const now = new Date().toISOString();
                    events = events.filter(e => filters.upcoming ? e.date >= now : e.date < now);
                }

                // Sort by date
                return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            },
            catch: (e) => new DataError("Failed to fetch filtered events", e)
        }),
        updateEvent: (eventId, data) => Effect.tryPromise({
            try: async () => {
                const eventRef = doc(db, "events", eventId);
                await updateDoc(eventRef, data);
            },
            catch: (e) => new DataError("Failed to update event", e)
        }),
        deleteEvent: (eventId) => Effect.tryPromise({
            try: async () => {
                const eventRef = doc(db, "events", eventId);
                await deleteDoc(eventRef);
            },
            catch: (e) => new DataError("Failed to delete event", e)
        }),
        uploadEventImage: (file, eventId) => Effect.gen(function* (_) {
            const basePath = `events/${eventId}/${Date.now()}`;
            const result = yield* _(processAndUploadImage(file, basePath).pipe(
                Effect.mapError((e) => new DataError("Failed to upload event image", e))
            ));
            return result;
        }),
        uploadProfilePhoto: (file, userId) => Effect.gen(function* (_) {
            const basePath = `users/${userId}/avatar_${Date.now()}`;
            const result = yield* _(processAndUploadAvatar(file, basePath).pipe(
                Effect.mapError((e) => new DataError("Failed to upload profile photo", e))
            ));
            return result;
        }),
        getSocialFeed: Effect.tryPromise({
            try: async () => {
                const CACHE_KEY = 'social_feed_cache';
                const CACHE_DURATION = 1000 * 60 * 10; // 10 minutes

                // Try to get from cache first
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    try {
                        const { timestamp, data } = JSON.parse(cached);
                        if (Date.now() - timestamp < CACHE_DURATION) {
                            return data as SocialPost[];
                        }
                    } catch (e) {
                        console.warn('Failed to parse social feed cache', e);
                    }
                }

                let posts: SocialPost[] = [];
                const YT_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
                const YT_CHANNEL = import.meta.env.VITE_YOUTUBE_CHANNEL_ID || "UCw7nrQwqRDvG6Q3CSEmcOSw";

                const FB_TOKEN = import.meta.env.VITE_FACEBOOK_ACCESS_TOKEN;
                const FB_PAGE_ID = import.meta.env.VITE_FACEBOOK_PAGE_ID;

                if (YT_KEY) {
                    try {
                        // Optimalizace: Používáme playlistItems místo search (1 quota místo 100)
                        // ID playlistu "Uploads" je většinou ID kanálu s 'UU' na začátku místo 'UC'
                        const YT_PLAYLIST = YT_CHANNEL.replace(/^UC/, 'UU');
                        const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${YT_PLAYLIST}&key=${YT_KEY}&maxResults=6`);

                        if (response.ok) {
                            const data = await response.json();
                            const ytPosts = data.items
                                .map((item: any) => ({
                                    id: item.snippet.resourceId.videoId,
                                    platform: 'youtube',
                                    type: 'video',
                                    title: item.snippet.title,
                                    thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
                                    url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
                                    publishedAt: item.snippet.publishedAt
                                }));
                            posts = [...posts, ...ytPosts];
                        }
                    } catch (e) {
                        console.warn("YouTube API failed", e);
                    }
                }

                const IG_BUSINESS_ID = "17841406885713212";
                if (FB_TOKEN && IG_BUSINESS_ID) {
                    try {
                        const response = await fetch(`https://graph.facebook.com/v19.0/${IG_BUSINESS_ID}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&access_token=${FB_TOKEN}&limit=6`);
                        if (response.ok) {
                            const data = await response.json();
                            const igPosts = data.data.map((item: any) => ({
                                id: item.id,
                                platform: 'instagram',
                                type: item.media_type === 'VIDEO' ? 'reel' : 'post',
                                title: item.caption ? (item.caption.length > 50 ? item.caption.substring(0, 50) + '...' : item.caption) : 'Instagram Post',
                                thumbnail: item.thumbnail_url || item.media_url,
                                url: item.permalink,
                                publishedAt: item.timestamp
                            }));
                            posts = [...posts, ...igPosts];
                        }
                    } catch (e) {
                        console.warn("Instagram API failed", e);
                    }
                }

                if (FB_TOKEN && FB_PAGE_ID) {
                    try {
                        const response = await fetch(`https://graph.facebook.com/v19.0/${FB_PAGE_ID}/feed?fields=id,message,full_picture,permalink_url,created_time&access_token=${FB_TOKEN}&limit=6`);
                        if (response.ok) {
                            const data = await response.json();
                            const fbPosts = data.data
                                .filter((item: any) => item.full_picture)
                                .map((item: any) => ({
                                    id: item.id,
                                    platform: 'facebook',
                                    type: 'post',
                                    title: item.message ? (item.message.length > 60 ? item.message.substring(0, 60) + '...' : item.message) : 'Facebook Post',
                                    thumbnail: item.full_picture,
                                    url: item.permalink_url,
                                    publishedAt: item.created_time
                                }));
                            posts = [...posts, ...fbPosts];
                        }
                    } catch (e) {
                        console.warn("Facebook API failed", e);
                    }
                }

                if (posts.length === 0) {
                    // Try to use cache even if expired if fetch failed and we have no posts
                    if (cached) {
                        try {
                            const { data } = JSON.parse(cached);
                            if (data && data.length > 0) return data as SocialPost[];
                        } catch (e) { /* ignore */ }
                    }

                    const mockSocial: SocialPost[] = [
                        {
                            id: 'ig1', platform: 'instagram', type: 'reel',
                            title: 'Nový projekt odhalen! 🤫 #bezkomprese #projectcar',
                            thumbnail: 'https://images.unsplash.com/photo-1618423691163-9137cb4205bb?auto=format&fit=crop&q=80&w=1000',
                            url: 'https://instagram.com/bezkomprese',
                            publishedAt: new Date(Date.now() - 3600000).toISOString(),
                            likes: 1250
                        },
                        {
                            id: 'fb1', platform: 'facebook', type: 'post',
                            title: 'Dnes máme v servisu plno. Dorazila zajímavá klasika na seřízení.',
                            thumbnail: 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&q=80&w=1000',
                            url: 'https://facebook.com/bezkomprese',
                            publishedAt: new Date(Date.now() - 86400000).toISOString(),
                            likes: 45
                        }
                    ];
                    posts = mockSocial;
                } else {
                    // Cache the successful result
                    localStorage.setItem(CACHE_KEY, JSON.stringify({
                        timestamp: Date.now(),
                        data: posts
                    }));
                }

                return posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
            },
            catch: (e) => new DataError("Failed to fetch social feed", e)
        }),
        getUserProfile: (userId) => Effect.tryPromise({
            try: async () => {
                const userRef = doc(db, "users", userId);
                // Use getDocFromServer to bypass Firestore local cache.
                // On page refresh, AuthService writes basic auth data via setDoc (merge:true),
                // which pollutes the cache with an incomplete document. getDocFromServer
                // always fetches the full document directly from Firestore.
                const userSnap = await getDocFromServer(userRef);

                if (!userSnap.exists()) {
                    return null;
                }

                const profile = userSnap.data() as UserProfile;
                const carsQuery = query(collection(db, "cars"), where("ownerId", "==", userId));
                const carsSnap = await getDocs(carsQuery);
                const cars = carsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Car));

                return { profile, cars };
            },
            catch: (e) => new DataError("Failed to fetch user profile", e)
        }),
        searchUsers: (searchQuery) => Effect.tryPromise({
            try: async () => {
                const normalizedQuery = searchQuery.toLowerCase().trim();
                const q = query(
                    collection(db, "users"),
                    where("searchKeys", "array-contains", normalizedQuery),
                    limit(20)
                );
                const snapshot = await getDocs(q);
                return snapshot.docs.map(doc => doc.data() as UserProfile);
            },
            catch: (e) => new DataError("Failed to search users", e)
        }),
        addFriend: (currentUserId, friendId) => Effect.tryPromise({
            try: async () => {
                const { arrayUnion } = await import("firebase/firestore");
                const userRef = doc(db, "users", currentUserId);
                await updateDoc(userRef, {
                    friends: arrayUnion(friendId),
                    friendsCount: ((await getDoc(userRef)).data()?.friends?.length || 0) + 1
                });

                // Check Badges - Socialite
                BadgeService.checkProfileBadges(currentUserId).catch(console.error);
            },
            catch: (e) => new DataError("Failed to add friend", e)
        }),
        removeFriend: (currentUserId, friendId) => Effect.tryPromise({
            try: async () => {
                const { arrayRemove } = await import("firebase/firestore");
                const userRef = doc(db, "users", currentUserId);
                await updateDoc(userRef, {
                    friends: arrayRemove(friendId),
                    friendsCount: Math.max(0, ((await getDoc(userRef)).data()?.friends?.length || 1) - 1)
                });

                // Check Badges - Socialite (in case of removal, though badges are usually permanent, we might want to re-evaluate)
                // Actually, badges are usually permanent. But let's check anyway for consistency/updates.
                BadgeService.checkProfileBadges(currentUserId).catch(console.error);
            },
            catch: (e) => new DataError("Failed to remove friend", e)
        }),
        getAllUsers: (limitCount = 20) => Effect.tryPromise({
            try: async () => {
                const q = query(
                    collection(db, "users"),
                    limit(limitCount)
                );
                const snapshot = await getDocs(q);
                return snapshot.docs.map(doc => doc.data() as UserProfile);
            },
            catch: (e) => new DataError("Failed to fetch users", e)
        }),
        getTopUsers: (limitCount = 5) => Effect.tryPromise({
            try: async () => {
                const q = query(
                    collection(db, "users"),
                    orderBy("friendsCount", "desc"),
                    limit(limitCount)
                );
                const snapshot = await getDocs(q);
                return snapshot.docs.map(doc => doc.data() as UserProfile);
            },
            catch: (e) => new DataError("Failed to fetch top users", e)
        }),
        getRandomUsers: (limitCount = 9) => Effect.tryPromise({
            try: async () => {
                const random = Math.floor(Math.random() * 1000000);
                const q = query(
                    collection(db, "users"),
                    where("_random", ">=", random),
                    limit(limitCount)
                );
                const snapshot = await getDocs(q);
                let users = snapshot.docs.map(doc => doc.data() as UserProfile);

                if (users.length < limitCount) {
                    const remaining = limitCount - users.length;
                    const q2 = query(
                        collection(db, "users"),
                        where("_random", "<", random),
                        limit(remaining)
                    );
                    const snapshot2 = await getDocs(q2);
                    users = [...users, ...snapshot2.docs.map(doc => doc.data() as UserProfile)];
                }
                return users;
            },
            catch: (e) => new DataError("Failed to fetch random users", e)
        }),
        getUserEvents: (userId) => Effect.tryPromise({
            try: async () => {
                const qCreated = query(collection(db, "events"), where("creatorId", "==", userId));
                const snapCreated = await getDocs(qCreated);
                return {
                    created: snapCreated.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppEvent)),
                    joined: []
                };
            },
            catch: (e) => new DataError("Failed to fetch user events", e)
        }),
        getCarById: (carId) => Effect.tryPromise({
            try: async () => {
                const docRef = doc(db, "cars", carId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    return { id: docSnap.id, ...docSnap.data() } as Car;
                }
                return undefined;
            },
            catch: (e) => new DataError("Failed to fetch car", e)
        }),

        getServiceRecords: (carId: string, userId?: string) => Effect.tryPromise({
            try: async () => {
                const constraints = [where("carId", "==", carId)];
                if (userId) {
                    constraints.push(where("ownerId", "==", userId));
                }

                const q = query(collection(db, "service-records"), ...constraints);
                const snapshot = await getDocs(q);
                const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRecord));
                return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            },
            catch: (e) => new DataError("Failed to fetch service records", e)
        }),

        addServiceRecord: (record) => Effect.tryPromise({
            try: async () => {
                const docRef = await addDoc(collection(db, "service-records"), {
                    ...record,
                    createdAt: serverTimestamp()
                });

                // Check Badges - Fire and forget
                // We use a new query that includes ownerId to satisfy rules
                try {
                    const constraints = [where("carId", "==", record.carId)];
                    if (record.ownerId) {
                        constraints.push(where("ownerId", "==", record.ownerId));
                    }
                    const q = query(collection(db, "service-records"), ...constraints);

                    const snapshot = await getDocs(q);
                    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRecord));

                    if (record.ownerId) {
                        BadgeService.checkServiceBadges(record.ownerId, records).catch(console.error);
                    }
                } catch (e) {
                    console.error("Badge check failed", e);
                }

                return docRef.id;
            },
            catch: (e) => new DataError("Failed to add service record", e)
        }),

        updateServiceRecord: (recordId, data) => Effect.tryPromise({
            try: async () => {
                const recordRef = doc(db, "service-records", recordId);
                await updateDoc(recordRef, data);
            },
            catch: (e) => new DataError("Failed to update service record", e)
        }),

        deleteServiceRecord: (recordId) => Effect.tryPromise({
            try: async () => {
                const recordRef = doc(db, "service-records", recordId);
                await deleteDoc(recordRef);
            },
            catch: (e) => new DataError("Failed to delete service record", e)
        }),

        getFuelRecords: (carId) => Effect.tryPromise({
            try: async () => {
                const q = query(
                    collection(db, "fuel-records"),
                    where("carId", "==", carId)
                );
                const snapshot = await getDocs(q);
                const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FuelRecord));
                return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            },
            catch: (e) => new DataError("Failed to fetch fuel records", e)
        }),

        addFuelRecord: (record) => Effect.tryPromise({
            try: async () => {
                const docRef = await addDoc(collection(db, "fuel-records"), record);

                // Check Badges
                try {
                    const q = query(collection(db, "fuel-records"), where("carId", "==", record.carId));
                    const snapshot = await getDocs(q);
                    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FuelRecord));
                    if (record.ownerId) {
                        BadgeService.checkFuelBadges(record.ownerId, records).catch(console.error);
                    }
                } catch (e) {
                    console.error("Badge check failed", e);
                }

                return docRef.id;
            },
            catch: (e) => new DataError("Failed to add fuel record", e)
        }),

        updateFuelRecord: (recordId, data) => Effect.tryPromise({
            try: async () => {
                const recordRef = doc(db, "fuel-records", recordId);
                await updateDoc(recordRef, data);
            },
            catch: (e) => new DataError("Failed to update fuel record", e)
        }),

        deleteFuelRecord: (recordId) => Effect.tryPromise({
            try: async () => {
                const recordRef = doc(db, "fuel-records", recordId);
                await deleteDoc(recordRef);
            },
            catch: (e) => new DataError("Failed to delete fuel record", e)
        }),

        updateProfile: (userId, data) => Effect.tryPromise({
            try: async () => {
                const userRef = doc(db, "users", userId);
                await updateDoc(userRef, data);
            },
            catch: (e) => new DataError("Failed to update profile", e)
        }),

        updatePresence: (presence) => Effect.tryPromise({
            try: async () => {
                const presenceRef = doc(db, "presence", presence.uid);
                await setDoc(presenceRef, {
                    ...presence,
                    lastActive: serverTimestamp()
                });
            },
            catch: (e) => new DataError("Failed to update presence", e)
        }),

        removePresence: (userId) => Effect.tryPromise({
            try: async () => {
                const presenceRef = doc(db, "presence", userId);
                await deleteDoc(presenceRef);
            },
            catch: (e) => new DataError("Failed to remove presence", e)
        }),

        getPresenceStream: () => Effect.sync(() => {
            let unsubscribe: (() => void) | null = null;
            let closed = false;

            return new ReadableStream({
                start(controller) {
                    // Relaxed threshold to 24 hours to tolerate clock skews between devices
                    const oneDayAgo = new Timestamp(Math.floor(Date.now() / 1000) - 86400, 0);
                    const q = query(collection(db, "presence"), where("lastActive", ">=", oneDayAgo));

                    unsubscribe = onSnapshot(q, (snapshot) => {
                        if (closed) return;
                        const presence = snapshot.docs.map(doc => doc.data() as PresenceInfo);
                        controller.enqueue(presence);
                    }, (error) => {
                        if (!closed) controller.error(error);
                    });
                },
                cancel() {
                    closed = true;
                    if (unsubscribe) unsubscribe();
                }
            });
        }),

        getOrCreateChatRoom: (userA, userAName, userAPhoto, userB, userBName, userBPhoto) => Effect.tryPromise({
            try: async () => {
                const participants = [userA, userB].sort();
                const q = query(collection(db, "chats"), where("participants", "==", participants));
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    return snapshot.docs[0].id;
                }

                const docRef = await addDoc(collection(db, "chats"), {
                    participants,
                    participantNames: { [userA]: userAName, [userB]: userBName },
                    participantPhotos: { [userA]: userAPhoto, [userB]: userBPhoto },
                    updatedAt: serverTimestamp()
                });
                return docRef.id;
            },
            catch: (e) => new DataError("Failed to get/create chat room", e)
        }),

        sendMessage: (roomId, message) => Effect.tryPromise({
            try: async () => {
                await addDoc(collection(db, "chats", roomId, "messages"), {
                    ...message,
                    createdAt: serverTimestamp()
                });
                await updateDoc(doc(db, "chats", roomId), {
                    lastMessage: message.text,
                    lastMessageSenderId: message.senderId,
                    updatedAt: serverTimestamp()
                });
            },
            catch: (e) => new DataError("Failed to send message", e)
        }),

        getMessagesStream: (roomId) => Effect.sync(() => {
            let unsubscribe: (() => void) | null = null;
            let closed = false;

            return new ReadableStream({
                start(controller) {
                    const q = query(
                        collection(db, "chats", roomId, "messages"),
                        orderBy("createdAt", "asc"),
                        limit(50)
                    );

                    unsubscribe = onSnapshot(q, (snapshot) => {
                        if (closed) return;
                        const messages = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        } as Message));
                        controller.enqueue(messages);
                    }, (error) => {
                        if (!closed) controller.error(error);
                    });
                },
                cancel() {
                    closed = true;
                    if (unsubscribe) unsubscribe();
                }
            });
        }),

        getUserChatsStream: (userId) => Effect.sync(() => {
            let unsubscribe: (() => void) | null = null;
            let closed = false;

            return new ReadableStream({
                start(controller) {
                    const q = query(
                        collection(db, "chats"),
                        where("participants", "array-contains", userId),
                        orderBy("updatedAt", "desc")
                    );

                    unsubscribe = onSnapshot(q, (snapshot) => {
                        if (closed) return;
                        const chats = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        } as ChatRoom));
                        controller.enqueue(chats);
                    }, (error) => {
                        if (!closed) controller.error(error);
                    });
                },
                cancel() {
                    closed = true;
                    if (unsubscribe) unsubscribe();
                }
            });
        }),

        cleanupOldMessages: (roomId) => Effect.tryPromise({
            try: async () => {
                const thirtyDaysAgo = Timestamp.fromDate(
                    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                );
                const q = query(
                    collection(db, "chats", roomId, "messages"),
                    where("createdAt", "<", thirtyDaysAgo)
                );
                const snapshot = await getDocs(q);
                if (snapshot.empty) return 0;
                const batch = writeBatch(db);
                snapshot.docs.forEach(d => batch.delete(d.ref));
                await batch.commit();
                return snapshot.size;
            },
            catch: (e) => new DataError("Failed to cleanup old messages", e)
        }),

        deleteChat: (roomId) => Effect.tryPromise({
            try: async () => {
                // First delete all messages in the subcollection
                const messagesSnapshot = await getDocs(collection(db, "chats", roomId, "messages"));
                const batch = writeBatch(db);
                messagesSnapshot.docs.forEach(d => batch.delete(d.ref));
                await batch.commit();
                // Then delete the chat room document
                await deleteDoc(doc(db, "chats", roomId));
            },
            catch: (e) => new DataError("Failed to delete chat", e)
        }),

        // Help Beacon (S.O.S.) implementations
        createHelpBeacon: (beacon) => Effect.tryPromise({
            try: async () => {
                const docRef = await addDoc(collection(db, "help-beacons"), {
                    ...beacon,
                    status: 'active',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                return docRef.id;
            },
            catch: (e) => new DataError("Failed to create help beacon", e)
        }),

        updateHelpBeacon: (beaconId, data) => Effect.tryPromise({
            try: async () => {
                const beaconRef = doc(db, "help-beacons", beaconId);
                await updateDoc(beaconRef, {
                    ...data,
                    updatedAt: serverTimestamp()
                });
            },
            catch: (e) => new DataError("Failed to update help beacon", e)
        }),

        deleteHelpBeacon: (beaconId) => Effect.tryPromise({
            try: async () => {
                const beaconRef = doc(db, "help-beacons", beaconId);
                await deleteDoc(beaconRef);
            },
            catch: (e) => new DataError("Failed to delete help beacon", e)
        }),

        getActiveBeaconsStream: () => Effect.sync(() => {
            let unsubscribe: (() => void) | null = null;
            let closed = false;

            return new ReadableStream({
                start(controller) {
                    const q = query(
                        collection(db, "help-beacons"),
                        where("status", "in", ["active", "help_coming"])
                    );

                    unsubscribe = onSnapshot(q, (snapshot) => {
                        if (closed) return;
                        const beacons = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        } as HelpBeacon));
                        controller.enqueue(beacons);
                    }, (error) => {
                        if (!closed) controller.error(error);
                    });
                },
                cancel() {
                    closed = true;
                    if (unsubscribe) unsubscribe();
                }
            });
        }),

        respondToBeacon: (beaconId, helperId, helperName) => Effect.tryPromise({
            try: async () => {
                const beaconRef = doc(db, "help-beacons", beaconId);
                await updateDoc(beaconRef, {
                    status: 'help_coming',
                    helperId,
                    helperName,
                    updatedAt: serverTimestamp()
                });
            },
            catch: (e) => new DataError("Failed to respond to beacon", e)
        }),

        // Event Participation
        joinEvent: (eventId, userId) => Effect.tryPromise({
            try: async () => {
                const { arrayUnion } = await import("firebase/firestore");
                const eventRef = doc(db, "events", eventId);
                await updateDoc(eventRef, {
                    participants: arrayUnion(userId)
                });

                // Check Badges
                try {
                    const q = query(collection(db, "events"), where("participants", "array-contains", userId));
                    const snapshot = await getDocs(q);
                    const count = snapshot.size; // This includes the one just joined if the update was precise, or we assume eventually consistent
                    BadgeService.checkEventBadges(userId, count).catch(console.error);
                } catch (e) {
                    console.error("Badge check failed", e);
                }
            },
            catch: (e) => new DataError("Failed to join event", e)
        }),

        leaveEvent: (eventId, userId) => Effect.tryPromise({
            try: async () => {
                const { arrayRemove } = await import("firebase/firestore");
                const eventRef = doc(db, "events", eventId);
                await updateDoc(eventRef, {
                    participants: arrayRemove(userId)
                });
            },
            catch: (e) => new DataError("Failed to leave event", e)
        }),

        // Event Comments
        getEventComments: (eventId) => Effect.tryPromise({
            try: async () => {
                // Note: No orderBy to avoid requiring composite index
                const q = query(
                    collection(db, "event-comments"),
                    where("eventId", "==", eventId)
                );
                const snapshot = await getDocs(q);
                const comments = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as EventComment));
                // Sort in memory by createdAt descending
                return comments.sort((a, b) => {
                    const aTime = a.createdAt?.toMillis?.() || 0;
                    const bTime = b.createdAt?.toMillis?.() || 0;
                    return bTime - aTime;
                });
            },
            catch: (e) => new DataError("Failed to fetch event comments", e)
        }),

        addEventComment: (comment) => Effect.tryPromise({
            try: async () => {
                const docRef = await addDoc(collection(db, "event-comments"), {
                    ...comment,
                    createdAt: serverTimestamp()
                });
                return docRef.id;
            },
            catch: (e) => new DataError("Failed to add comment", e)
        }),

        deleteEventComment: (commentId) => Effect.tryPromise({
            try: async () => {
                const commentRef = doc(db, "event-comments", commentId);
                await deleteDoc(commentRef);
            },
            catch: (e) => new DataError("Failed to delete comment", e)
        }),

        // Marketplace
        getMarketplaceListings: (limitCount = 50) => Effect.tryPromise({
            try: async () => {
                // Note: No orderBy to avoid requiring composite index
                const q = query(
                    collection(db, "marketplace-listings"),
                    where("isActive", "==", true),
                    limit(limitCount)
                );
                const snapshot = await getDocs(q);
                const listings = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MarketplaceListing));
                // Sort in memory by createdAt descending
                return listings.sort((a, b) => {
                    const aTime = a.createdAt?.toMillis?.() || 0;
                    const bTime = b.createdAt?.toMillis?.() || 0;
                    return bTime - aTime;
                });
            },
            catch: (e) => new DataError("Failed to fetch marketplace listings", e)
        }),

        getMyMarketplaceListings: (userId) => Effect.tryPromise({
            try: async () => {
                const q = query(
                    collection(db, "marketplace-listings"),
                    where("userId", "==", userId)
                );
                const snapshot = await getDocs(q);
                const listings = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MarketplaceListing));
                return listings.sort((a, b) => {
                    const aTime = a.createdAt?.toMillis?.() || 0;
                    const bTime = b.createdAt?.toMillis?.() || 0;
                    return bTime - aTime;
                });
            },
            catch: (e) => new DataError("Failed to fetch my listings", e)
        }),

        addMarketplaceListing: (listing) => Effect.tryPromise({
            try: async () => {
                const docRef = await addDoc(collection(db, "marketplace-listings"), {
                    ...listing,
                    createdAt: serverTimestamp()
                });

                // Check Badges
                try {
                    const q = query(collection(db, "marketplace-listings"), where("userId", "==", listing.userId));
                    const snapshot = await getDocs(q);
                    const count = snapshot.size;
                    BadgeService.checkMarketplaceBadges(listing.userId, count).catch(console.error);
                } catch (e) {
                    console.error("Badge check failed", e);
                }

                return docRef.id;
            },
            catch: (e) => new DataError("Failed to add marketplace listing", e)
        }),

        updateMarketplaceListing: (listingId, data) => Effect.tryPromise({
            try: async () => {
                const listingRef = doc(db, "marketplace-listings", listingId);
                await updateDoc(listingRef, data);
            },
            catch: (e) => new DataError("Failed to update marketplace listing", e)
        }),

        deleteMarketplaceListing: (listingId) => Effect.tryPromise({
            try: async () => {
                const listingRef = doc(db, "marketplace-listings", listingId);
                await deleteDoc(listingRef);
            },
            catch: (e) => new DataError("Failed to delete marketplace listing", e)
        }),

        getCarsForSale: (limitCount = 50) => Effect.tryPromise({
            try: async () => {
                const q = query(
                    collection(db, "cars"),
                    where("forSale", "==", true),
                    limit(limitCount)
                );
                const snapshot = await getDocs(q);
                return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Car));
            },
            catch: (e) => new DataError("Failed to fetch cars for sale", e)
        }),

        markCarAsSold: (carId) => Effect.tryPromise({
            try: async () => {
                const carRef = doc(db, "cars", carId);
                await updateDoc(carRef, {
                    forSale: false,
                    isOwned: false,
                    salePrice: null,
                    saleDescription: null
                });
            },
            catch: (e) => new DataError("Failed to mark car as sold", e)
        }),

        uploadListingImage: (file, listingId) => Effect.gen(function* (_) {
            const basePath = `marketplace/${listingId}/${Date.now()}`;
            const result = yield* _(processAndUploadImage(file, basePath).pipe(
                Effect.mapError((e) => new DataError("Failed to upload listing image", e))
            ));
            return result;
        })
    })
);