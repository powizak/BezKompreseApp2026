export type TrackerStatus = 'Dáme pokec?' | 'Závod?' | 'Projížďka?' | 'Jen tak' | 'Na kafi' | 'V garáži';

export interface TrackerSettings {
  isEnabled: boolean;
  allowContact: boolean;
  status: TrackerStatus;
  privacyRadius: number; // in meters
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  friends?: string[]; // Array of user UIDs
  homeLocation?: { lat: number; lng: number };
  trackerSettings?: TrackerSettings;
  shareFuelConsumption?: boolean;
}

export interface CarModification {
  id: string;
  type: string;
  name: string;
  description?: string;
  date?: string;
}

export interface Car {
  id: string;
  ownerId: string;
  name: string;
  make: string;
  model: string;
  year: number;
  engine: string;
  power: number;
  stockPower?: number;
  fuelConsumption?: string; // L/100km
  mods: CarModification[];
  photos: string[];
  isOwned?: boolean;
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

export interface ServicePart {
  name: string;
  brand?: string;
  partNumber?: string;
  quantity: number;
  price?: number;
}

export interface ServiceRecord {
  id: string;
  carId: string;
  ownerId: string;
  date: string; // ISO timestamp
  mileage: number; // km at time of service
  type: 'scheduled' | 'repair' | 'upgrade' | 'inspection';
  category: 'oil' | 'tires' | 'brakes' | 'filters' | 'timing' | 'other';

  // What was done
  title: string;
  description?: string;
  parts?: ServicePart[];

  // Economics
  laborCost?: number;
  partsCost?: number;
  totalCost: number;

  // Where it was done
  serviceProvider?: string; // "Autoservis XY" / "Doma"

  // Next service
  nextServiceMileage?: number;
  nextServiceDate?: string;
}

export interface FuelRecord {
  id: string;
  carId: string;
  ownerId: string;
  date: string; // ISO string
  mileage: number; // Tachometer km
  liters: number;
  pricePerLiter: number;
  totalPrice: number;
  fullTank: boolean;
  station?: string;
  notes?: string;
  consumption?: number; // l/100km (calculated)
  distanceDelta?: number; // km since last refuel (calculated)
}

// Help Beacon (S.O.S.) types
export type BeaconType = 'breakdown' | 'empty_tank' | 'accident' | 'flat_tire' | 'other';
export type BeaconStatus = 'active' | 'help_coming' | 'resolved';

export interface HelpBeacon {
  id: string;
  userId: string;
  displayName: string;
  photoURL: string | null;
  location: { lat: number; lng: number };
  beaconType: BeaconType;
  description?: string;
  status: BeaconStatus;
  createdAt: any; // Firebase Timestamp
  updatedAt: any;
  helperId?: string; // UID of user who is coming to help
  helperName?: string; // Display name of helper
}