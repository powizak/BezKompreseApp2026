import { Context, Effect, Layer } from "effect";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../config/firebase";
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
  readonly getEvents: Effect.Effect<AppEvent[], DataError>;
  readonly getEventById: (id: string) => Effect.Effect<AppEvent | undefined, DataError>;
  readonly addEvent: (event: Omit<AppEvent, "id">) => Effect.Effect<string, DataError>;
  readonly getSocialFeed: Effect.Effect<SocialPost[], DataError>;
}

export const DataService = Context.GenericTag<DataService>("DataService");

const YOUTUBE_CHANNEL_ID = "UCw7nrQwqRDvG6Q3CSEmcOSw";
// Note: In production, API Key should be secured or proxy-ed.
// Users will need to add VITE_GOOGLE_API_KEY to .env
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY; 

export const DataServiceLive = Layer.succeed(
  DataService,
  DataService.of({
    getMyCars: (userId) => Effect.tryPromise({
      try: async () => {
        return [
           { id: '1', ownerId: userId, name: 'Služebák', make: 'Škoda', model: 'Octavia', year: 2005, engine: '1.9 TDI', power: '66kW', mods: ['Chip', 'EGR Off'] }
        ] as Car[];
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
    getEvents: Effect.tryPromise({
        try: async () => {
            return [
                { id: '1', creatorId: 'admin', title: 'Sraz Bez Komprese', description: 'Velký letní sraz na letišti. Sprinty, drift, pokec.', date: new Date(Date.now() + 86400000 * 5).toISOString(), location: 'Klatovy Letiště', coordinates: { lat: 49.395, lng: 13.295 }, type: 'official' },
                { id: '2', creatorId: 'user1', title: 'Kafe na pumpě', description: 'Rychlý sraz pro místní. Kdo má čas, doražte.', date: new Date(Date.now() + 86400000).toISOString(), location: 'MOL Plzeň', coordinates: { lat: 49.747, lng: 13.377 }, type: 'meetup' },
                { id: '3', creatorId: 'user2', title: 'Projížďka Šumava', description: 'Víkendová projížďka, sraz na Železné Rudě.', date: new Date(Date.now() + 86400000 * 10).toISOString(), location: 'Železná Ruda', coordinates: { lat: 49.137, lng: 13.235 }, type: 'meetup' }
            ] as AppEvent[];
        },
        catch: (e) => new DataError("Failed to fetch events", e)
    }),
    getEventById: (id) => Effect.tryPromise({
        try: async () => {
             // Mock implementation - reusing the same list logic
             const events = [
                { id: '1', creatorId: 'admin', title: 'Sraz Bez Komprese', description: 'Velký letní sraz na letišti. Sprinty, drift, pokec.', date: new Date(Date.now() + 86400000 * 5).toISOString(), location: 'Klatovy Letiště', coordinates: { lat: 49.395, lng: 13.295 }, type: 'official' },
                { id: '2', creatorId: 'user1', title: 'Kafe na pumpě', description: 'Rychlý sraz pro místní. Kdo má čas, doražte.', date: new Date(Date.now() + 86400000).toISOString(), location: 'MOL Plzeň', coordinates: { lat: 49.747, lng: 13.377 }, type: 'meetup' },
                { id: '3', creatorId: 'user2', title: 'Projížďka Šumava', description: 'Víkendová projížďka, sraz na Železné Rudě.', date: new Date(Date.now() + 86400000 * 10).toISOString(), location: 'Železná Ruda', coordinates: { lat: 49.137, lng: 13.235 }, type: 'meetup' }
            ] as AppEvent[];
            return events.find(e => e.id === id);
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

            // 1. Try Fetch YouTube if Key exists
            if (API_KEY) {
                try {
                    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${YOUTUBE_CHANNEL_ID}&part=snippet,id&order=date&maxResults=5`);
                    if (response.ok) {
                        const data = await response.json();
                        const ytPosts = data.items.map((item: any) => ({
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
                    console.warn("YouTube API failed, using mock", e);
                }
            }

            // 2. Add Mock Data (Instagram/FB - simulated scraping)
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
                }
            ];

            // If no API data, fill with more mock YouTube
            if (posts.length === 0) {
                 posts.push({ 
                    id: 'yt_mock1', platform: 'youtube', type: 'video', 
                    title: 'Stavba 130LR pokračuje! - Epizoda 12', 
                    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg', 
                    url: 'https://youtube.com', 
                    publishedAt: new Date(Date.now() - 172800000).toISOString() 
                });
            }

            // Merge and sort by date
            return [...posts, ...mockSocial].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        },
        catch: (e) => new DataError("Failed to fetch social feed", e)
    })
  })
);