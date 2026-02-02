import { Context, Effect, Layer } from "effect";
import {
    collection, addDoc, getDocs, query, where, updateDoc, doc, limit, deleteDoc,
    getDoc, onSnapshot, setDoc, serverTimestamp, Timestamp, orderBy
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../config/firebase";
import type { Car, AppEvent, SocialPost, UserProfile, ServiceRecord, FuelRecord } from "../types";
import type { PresenceInfo, Message, ChatRoom } from "../types/chat";

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
    readonly getUserProfile: (userId: string) => Effect.Effect<{ profile: UserProfile, cars: Car[] } | null, DataError>;
    readonly searchUsers: (query: string) => Effect.Effect<UserProfile[], DataError>;
    readonly addFriend: (currentUserId: string, friendId: string) => Effect.Effect<void, DataError>;
    readonly removeFriend: (currentUserId: string, friendId: string) => Effect.Effect<void, DataError>;
    readonly getAllUsers: (limitCount?: number) => Effect.Effect<UserProfile[], DataError>;
    readonly getUserEvents: (userId: string) => Effect.Effect<{ created: AppEvent[], joined: AppEvent[] }, DataError>;
    readonly getAllCars: (limitCount?: number) => Effect.Effect<Car[], DataError>;
    readonly getCarById: (carId: string) => Effect.Effect<Car | undefined, DataError>;

    // Profile & Tracker Settings
    readonly updateProfile: (userId: string, data: Partial<UserProfile>) => Effect.Effect<void, DataError>;

    // Presence & Tracking
    readonly updatePresence: (presence: PresenceInfo) => Effect.Effect<void, DataError>;
    readonly removePresence: (userId: string) => Effect.Effect<void, DataError>;
    readonly getPresenceStream: () => Effect.Effect<ReadableStream<PresenceInfo[]>, DataError>;

    // Chat
    readonly getOrCreateChatRoom: (userA: string, userB: string) => Effect.Effect<string, DataError>;
    readonly sendMessage: (roomId: string, message: Omit<Message, "id" | "createdAt">) => Effect.Effect<void, DataError>;
    readonly getMessagesStream: (roomId: string) => Effect.Effect<ReadableStream<Message[]>, DataError>;
    readonly getUserChatsStream: (userId: string) => Effect.Effect<ReadableStream<ChatRoom[]>, DataError>;

    // Service Records
    readonly getServiceRecords: (carId: string) => Effect.Effect<ServiceRecord[], DataError>;
    readonly addServiceRecord: (record: Omit<ServiceRecord, "id">) => Effect.Effect<string, DataError>;
    readonly updateServiceRecord: (recordId: string, data: Partial<ServiceRecord>) => Effect.Effect<void, DataError>;
    readonly deleteServiceRecord: (recordId: string) => Effect.Effect<void, DataError>;

    // Fuel Records
    readonly getFuelRecords: (carId: string) => Effect.Effect<FuelRecord[], DataError>;
    readonly addFuelRecord: (record: Omit<FuelRecord, "id">) => Effect.Effect<string, DataError>;
    readonly updateFuelRecord: (recordId: string, data: Partial<FuelRecord>) => Effect.Effect<void, DataError>;
    readonly deleteFuelRecord: (recordId: string) => Effect.Effect<void, DataError>;
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

                if (YT_KEY) {
                    try {
                        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${YT_KEY}&channelId=${YT_CHANNEL}&part=snippet,id&order=date&maxResults=6`);
                        if (response.ok) {
                            const data = await response.json();
                            const ytPosts = data.items
                                .filter((item: any) => item.id.videoId)
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
                }

                return posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
            },
            catch: (e) => new DataError("Failed to fetch social feed", e)
        }),
        getUserProfile: (userId) => Effect.tryPromise({
            try: async () => {
                const userRef = doc(db, "users", userId);
                const userSnap = await getDoc(userRef);

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
                const q = query(
                    collection(db, "users"),
                    where("displayName", ">=", searchQuery),
                    where("displayName", "<=", searchQuery + '\uf8ff'),
                    limit(10)
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
                return snapshot.docs.map(doc => doc.data() as UserProfile);
            },
            catch: (e) => new DataError("Failed to fetch users", e)
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

        getServiceRecords: (carId) => Effect.tryPromise({
            try: async () => {
                const q = query(
                    collection(db, "service-records"),
                    where("carId", "==", carId)
                );
                const snapshot = await getDocs(q);
                const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRecord));
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
            return new ReadableStream({
                start(controller) {
                    const tenMinAgo = new Timestamp(Math.floor(Date.now() / 1000) - 600, 0);
                    const q = query(collection(db, "presence"), where("lastActive", ">=", tenMinAgo));

                    const unsubscribe = onSnapshot(q, (snapshot) => {
                        const presence = snapshot.docs.map(doc => doc.data() as PresenceInfo);
                        controller.enqueue(presence);
                    }, (error) => controller.error(error));
                    return () => unsubscribe();
                }
            });
        }),

        getOrCreateChatRoom: (userA, userB) => Effect.tryPromise({
            try: async () => {
                const participants = [userA, userB].sort();
                const q = query(collection(db, "chats"), where("participants", "==", participants));
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    return snapshot.docs[0].id;
                }

                const docRef = await addDoc(collection(db, "chats"), {
                    participants,
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
                    updatedAt: serverTimestamp()
                });
            },
            catch: (e) => new DataError("Failed to send message", e)
        }),

        getMessagesStream: (roomId) => Effect.sync(() => {
            return new ReadableStream({
                start(controller) {
                    const q = query(
                        collection(db, "chats", roomId, "messages"),
                        orderBy("createdAt", "asc"),
                        limit(50)
                    );

                    const unsubscribe = onSnapshot(q, (snapshot) => {
                        const messages = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        } as Message));
                        controller.enqueue(messages);
                    }, (error) => controller.error(error));
                    return () => unsubscribe();
                }
            });
        }),

        getUserChatsStream: (userId) => Effect.sync(() => {
            return new ReadableStream({
                start(controller) {
                    const q = query(
                        collection(db, "chats"),
                        where("participants", "array-contains", userId),
                        orderBy("updatedAt", "desc")
                    );

                    const unsubscribe = onSnapshot(q, (snapshot) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const chats = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        } as any)); // Using any to avoid strict typecheck on ChatRoom vs DocData for now
                        controller.enqueue(chats);
                    }, (error) => controller.error(error));
                    return () => unsubscribe();
                }
            });
        })
    })
);