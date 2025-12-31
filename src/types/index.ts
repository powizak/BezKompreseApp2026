export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface CarModification {
  id: string;
  type: string;
  name: string;
  description?: string;
  date?: string;
  price?: number;
}

export interface Car {
  id: string;
  ownerId: string;
  name: string;
  make: string;
  model: string;
  year: number;
  engine: string;
  power: string;
  mods: CarModification[];
  photos: string[];
}

export interface AppEvent {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  date: string;
  location: string;
  coordinates?: { lat: number; lng: number }; // Added for map
  type: 'official' | 'meetup';
}

export type SocialPlatform = 'youtube' | 'instagram' | 'facebook';
export type ContentType = 'video' | 'reel' | 'post' | 'story';

export interface SocialPost {
  id: string;
  platform: SocialPlatform;
  type: ContentType;
  title: string; // Or caption
  thumbnail: string;
  url: string;
  publishedAt: string;
  views?: number;
  likes?: number;
}