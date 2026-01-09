import { Context, Effect, Layer } from "effect";
import { collection, addDoc, getDocs, query, where, updateDoc, doc, limit, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../config/firebase";
import type { Car, AppEvent, SocialPost } from "../types";

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
    readonly uploadCarPhoto: (file: File, carId: string) => Effect.Effect<string, DataError>;
    readonly getEvents: Effect.Effect<AppEvent[], DataError>;
    readonly getEventById: (id: string) => Effect.Effect<AppEvent | undefined, DataError>;
    readonly addEvent: (event: Omit<AppEvent, "id">) => Effect.Effect<string, DataError>;
    readonly getSocialFeed: Effect.Effect<SocialPost[], DataError>;
    readonly getUserProfile: (userId: string) => Effect.Effect<{ profile: import("../types").UserProfile, cars: Car[] } | null, DataError>;
    readonly searchUsers: (query: string) => Effect.Effect<import("../types").UserProfile[], DataError>;
    readonly addFriend: (currentUserId: string, friendId: string) => Effect.Effect<void, DataError>;
    readonly removeFriend: (currentUserId: string, friendId: string) => Effect.Effect<void, DataError>;
    readonly getAllUsers: (limitCount?: number) => Effect.Effect<import("../types").UserProfile[], DataError>;
    readonly getUserEvents: (userId: string) => Effect.Effect<{ created: AppEvent[], joined: AppEvent[] }, DataError>;
    readonly getAllCars: (limitCount?: number) => Effect.Effect<Car[], DataError>;
    readonly getCarById: (carId: string) => Effect.Effect<Car | undefined, DataError>;

    // Service Records
    readonly getServiceRecords: (carId: string) => Effect.Effect<import("../types").ServiceRecord[], DataError>;
    readonly addServiceRecord: (record: Omit<import("../types").ServiceRecord, "id">) => Effect.Effect<string, DataError>;
    readonly updateServiceRecord: (recordId: string, data: Partial<import("../types").ServiceRecord>) => Effect.Effect<void, DataError>;
    readonly deleteServiceRecord: (recordId: string) => Effect.Effect<void, DataError>;
    readonly uploadInvoice: (file: File, recordId: string) => Effect.Effect<string, DataError>;
}

export const DataService = Context.GenericTag<DataService>("DataService");

export const DataServiceLive = Layer.succeed(
    DataService,
    DataService.of({
        getAllCars: (limitCount = 50) => Effect.tryPromise({
            try: async () => {
                const q = query(
                    collection(db, "cars"),
                    limit(limitCount)
                );
                const snapshot = await getDocs(q);
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Car));
            },
            catch: (e) => new DataError("Failed to fetch all cars", e)
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
                const docRef = await addDoc(collection(db, "cars"), car);
                return docRef.id;
            },
            catch: (e) => new DataError("Failed to add car", e)
        }),
        updateCar: (carId, data) => Effect.tryPromise({
            try: async () => {
                const carRef = doc(db, "cars", carId);
                await updateDoc(carRef, data);
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
        uploadCarPhoto: (file, carId) => Effect.tryPromise({
            try: async () => {
                // Resize or limit check could be here, but we'll do it in UI too
                const storageRef = ref(storage, `cars/${carId}/${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);
                return downloadURL;
            },
            catch: (e) => new DataError("Failed to upload photo", e)
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
                const docSnap = await import("firebase/firestore").then(m => m.getDoc(docRef)); // Dynamic import to avoid circular dependency if any, or just direct usage
                if (docSnap.exists()) {
                    return { id: docSnap.id, ...docSnap.data() } as AppEvent;
                }
                return undefined;
            },
            catch: (e) => new DataError("Failed to fetch event", e)
        }),
        addEvent: (event) => Effect.tryPromise({
            try: async () => {
                // In real app: Geocode location to coords here
                const docRef = await addDoc(collection(db, "events"), event);
                return docRef.id;
            },
            catch: (e) => new DataError("Failed to add event", e)
        }),
        getSocialFeed: Effect.tryPromise({
            try: async () => {
                let posts: SocialPost[] = [];
                const YT_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
                const YT_CHANNEL = import.meta.env.VITE_YOUTUBE_CHANNEL_ID || "UCw7nrQwqRDvG6Q3CSEmcOSw";

                const FB_TOKEN = import.meta.env.VITE_FACEBOOK_ACCESS_TOKEN;
                const FB_PAGE_ID = import.meta.env.VITE_FACEBOOK_PAGE_ID;

                // 1. YouTube API
                if (YT_KEY) {
                    try {
                        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${YT_KEY}&channelId=${YT_CHANNEL}&part=snippet,id&order=date&maxResults=6`);
                        if (response.ok) {
                            const data = await response.json();
                            const ytPosts = data.items
                                .filter((item: any) => item.id.videoId) // Filter out channels/playlists if any
                                .map((item: any) => ({
                                    id: item.id.videoId,
                                    platform: 'youtube',
                                    type: 'video',
                                    title: item.snippet.title,
                                    thumbnail: item.snippet.thumbnails.high.url,
                                    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                                    publishedAt: item.snippet.publishedAt
                                }));
                            posts = [...posts, ...ytPosts];
                        } else {
                            console.error("YouTube API Error:", await response.text());
                        }
                    } catch (e) {
                        console.warn("YouTube API failed", e);
                    }
                }

                // 2. Instagram Graph API (via Facebook Page Token)
                // Uses the same FB_TOKEN as it has pages_read_engagement and instagram_basic permissions
                // Query: /{ig-user-id}/media
                const IG_BUSINESS_ID = "17841406885713212"; // Discovered via Graph API
                if (FB_TOKEN && IG_BUSINESS_ID) {
                    try {
                        const response = await fetch(`https://graph.facebook.com/v19.0/${IG_BUSINESS_ID}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&access_token=${FB_TOKEN}&limit=6`);
                        if (response.ok) {
                            const data = await response.json();
                            const igPosts = data.data.map((item: any) => ({
                                id: item.id,
                                platform: 'instagram',
                                type: item.media_type === 'VIDEO' ? 'reel' : 'post', // Simplification
                                title: item.caption ? (item.caption.length > 50 ? item.caption.substring(0, 50) + '...' : item.caption) : 'Instagram Post',
                                thumbnail: item.thumbnail_url || item.media_url, // thumbnail_url is only for videos
                                url: item.permalink,
                                publishedAt: item.timestamp
                            }));
                            posts = [...posts, ...igPosts];
                        } else {
                            console.error("Instagram API Error:", await response.text());
                        }
                    } catch (e) {
                        console.warn("Instagram API failed", e);
                    }
                }

                // 3. Facebook Graph API
                // Requires Page Access Token. Fields: id,message,full_picture,permalink_url,created_time
                if (FB_TOKEN && FB_PAGE_ID) {
                    try {
                        const response = await fetch(`https://graph.facebook.com/v19.0/${FB_PAGE_ID}/feed?fields=id,message,full_picture,permalink_url,created_time&access_token=${FB_TOKEN}&limit=6`);
                        if (response.ok) {
                            const data = await response.json();
                            const fbPosts = data.data
                                .filter((item: any) => item.full_picture) // Only valid posts with images
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
                        } else {
                            console.error("Facebook API Error:", await response.text());
                        }
                    } catch (e) {
                        console.warn("Facebook API failed", e);
                    }
                }

                // Fallback: If no real data fetched, use Mock Data
                if (posts.length === 0) {
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
                        },
                        {
                            id: 'ig2', platform: 'instagram', type: 'story',
                            title: 'Backstage z natáčení 🎥',
                            thumbnail: 'https://images.unsplash.com/photo-1596720426673-e4f28bc18bb8?auto=format&fit=crop&q=80&w=1000',
                            url: 'https://instagram.com/bezkomprese',
                            publishedAt: new Date(Date.now() - 1800000).toISOString()
                        },
                        {
                            id: 'yt_mock1', platform: 'youtube', type: 'video',
                            title: 'Stavba 130LR pokračuje! - Epizoda 12',
                            thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
                            url: 'https://youtube.com',
                            publishedAt: new Date(Date.now() - 172800000).toISOString()
                        }
                    ];
                    posts = mockSocial;
                }

                // Merge and sort by date
                return posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
            },
            catch: (e) => new DataError("Failed to fetch social feed", e)
        }),
        getUserProfile: (userId) => Effect.tryPromise({
            try: async () => {
                const userRef = doc(db, "users", userId);
                const userSnap = await await import("firebase/firestore").then(m => m.getDoc(userRef));

                if (!userSnap.exists()) {
                    return null;
                }

                const profile = userSnap.data() as import("../types").UserProfile;
                const carsQuery = query(collection(db, "cars"), where("ownerId", "==", userId));
                const carsSnap = await getDocs(carsQuery);
                const cars = carsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Car));

                return { profile, cars };
            },
            catch: (e) => new DataError("Failed to fetch user profile", e)
        }),
        searchUsers: (searchQuery) => Effect.tryPromise({
            try: async () => {
                // Simple prefix search on displayName
                // Note: This requires a composite index or compatible field. 
                // For simplicity/demo: client-side filtering or simple match if low volume.
                // Real implementation ideally uses Algolia or similar for full text search.
                // Here we try a basic Firestore query for exact match or simple startAt

                const q = query(
                    collection(db, "users"),
                    where("displayName", ">=", searchQuery),
                    where("displayName", "<=", searchQuery + '\uf8ff'),
                    await import("firebase/firestore").then(m => m.limit(10))
                );
                const snapshot = await getDocs(q);
                return snapshot.docs.map(doc => doc.data() as import("../types").UserProfile);
            },
            catch: (e) => new DataError("Failed to search users", e)
        }),
        addFriend: (currentUserId, friendId) => Effect.tryPromise({
            try: async () => {
                const { arrayUnion } = await import("firebase/firestore");
                const userRef = doc(db, "users", currentUserId);
                await updateDoc(userRef, {
                    friends: arrayUnion(friendId)
                });
            },
            catch: (e) => new DataError("Failed to add friend", e)
        }),
        removeFriend: (currentUserId, friendId) => Effect.tryPromise({
            try: async () => {
                const { arrayRemove } = await import("firebase/firestore");
                const userRef = doc(db, "users", currentUserId);
                await updateDoc(userRef, {
                    friends: arrayRemove(friendId)
                });
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
                return snapshot.docs.map(doc => doc.data() as import("../types").UserProfile);
            },
            catch: (e) => new DataError("Failed to fetch users", e)
        }),
        getUserEvents: (userId) => Effect.tryPromise({
            try: async () => {
                // 1. Created events
                const qCreated = query(collection(db, "events"), where("creatorId", "==", userId));
                const snapCreated = await getDocs(qCreated);
                const created = snapCreated.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppEvent));

                // 2. Joined events (Not implemented in DB yet, return empty for safety)
                // Future todo: Query a 'participants' collection or array field
                const joined: AppEvent[] = [];

                return { created, joined };
            },
            catch: (e) => new DataError("Failed to fetch user events", e)
        }),
        getCarById: (carId) => Effect.tryPromise({
            try: async () => {
                const docRef = doc(db, "cars", carId);
                const docSnap = await import("firebase/firestore").then(m => m.getDoc(docRef));
                if (docSnap.exists()) {
                    return { id: docSnap.id, ...docSnap.data() } as Car;
                }
                return undefined;
            },
            catch: (e) => new DataError("Failed to fetch car", e)
        }),

        // Service Records Implementation
        getServiceRecords: (carId) => Effect.tryPromise({
            try: async () => {
                const q = query(
                    collection(db, "service-records"),
                    where("carId", "==", carId)
                );
                const snapshot = await getDocs(q);
                const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as import("../types").ServiceRecord));
                // Sort by date descending (newest first)
                return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            },
            catch: (e) => new DataError("Failed to fetch service records", e)
        }),

        addServiceRecord: (record) => Effect.tryPromise({
            try: async () => {
                const docRef = await addDoc(collection(db, "service-records"), record);
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
                const { deleteDoc } = await import("firebase/firestore");
                const recordRef = doc(db, "service-records", recordId);
                await deleteDoc(recordRef);
            },
            catch: (e) => new DataError("Failed to delete service record", e)
        }),

        uploadInvoice: (file, recordId) => Effect.tryPromise({
            try: async () => {
                const storageRef = ref(storage, `invoices/${recordId}/${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);
                return downloadURL;
            },
            catch: (e) => new DataError("Failed to upload invoice", e)
        })
    })
);