export type TrackerStatus = 'Dáme pokec?' | 'Závod?' | 'Projížďka?' | 'Jen tak' | 'Na kafi' | 'V garáži';

/**
 * Image variants for different display contexts
 * - thumb: 400x400px - for list/grid views
 * - large: 1920x1920px - for full-screen/modals
 */
export interface ImageVariants {
  thumb: string;
  large: string;
}

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
  isOrganizer?: boolean; // Can create trackday events
  notificationSettings?: NotificationSettings;
  fcmToken?: string; // FCM device token
  // Optimization fields
  friendsCount?: number;
  searchKey?: string; // Lowercase display name for search
  _random?: number; // Random integer for random sorting
  isBKTeam?: boolean; // Member of Bez Komprese Team
  badges?: import('./badges').UserBadge[]; // Collected badges
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
  photos: (string | ImageVariants)[]; // Backward compatible: supports legacy string URLs and new variants
  isOwned?: boolean;
  reminders?: VehicleReminder[];
  status?: VehicleStatus;         // Status vozidla
  // Odometer tracking
  currentMileage?: number;        // Aktuální stav tachometru
  lastMileageUpdate?: string;     // Datum poslední aktualizace (ISO)
  // Marketplace - selling
  forSale?: boolean;
  salePrice?: number;
  saleDescription?: string;
}

// Vehicle Status Types
export type VehicleStatus =
  | 'seasonal'           // Sezónní
  | 'storage'            // Depozit
  | 'restoration'        // V renovaci
  | 'scrap'              // Do šrotu
  | 'breakdown'          // Porucha
  | 'racing'             // Závodní speciál
  | 'daily'              // Daily
  | 'work'               // Pracovní
  | 'company';           // Služební

export const VEHICLE_STATUS_CONFIG: Record<VehicleStatus, {
  label: string;
  color: { bg: string; text: string; border: string };
}> = {
  seasonal: {
    label: 'Sezónní',
    color: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' }
  },
  storage: {
    label: 'Depozit',
    color: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
  },
  restoration: {
    label: 'V renovaci',
    color: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' }
  },
  scrap: {
    label: 'Do šrotu',
    color: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' }
  },
  breakdown: {
    label: 'Porucha',
    color: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' }
  },
  racing: {
    label: 'Závodní speciál',
    color: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' }
  },
  daily: {
    label: 'Daily',
    color: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' }
  },
  work: {
    label: 'Pracovní',
    color: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' }
  },
  company: {
    label: 'Služební',
    color: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' }
  }
};

// Vehicle Reminder Types ("Digitální Kaslík")
export type ReminderType = 'stk' | 'first_aid_kit' | 'highway_vignette' | 'liability_insurance';

export interface VehicleReminder {
  type: ReminderType;
  expirationDate: string; // ISO date string
  notifyEnabled: boolean;
}

export const REMINDER_CONFIG: Record<ReminderType, {
  label: string;
  warningDays: number[]; // Days before expiration to notify
  icon: string; // Lucide icon name for future use
}> = {
  stk: { label: 'Platnost STK', warningDays: [90, 30], icon: 'ClipboardCheck' },
  first_aid_kit: { label: 'Lékárnička', warningDays: [30], icon: 'Cross' },
  highway_vignette: { label: 'Dálniční známka', warningDays: [30], icon: 'BadgeCheck' },
  liability_insurance: { label: 'Povinné ručení', warningDays: [60], icon: 'Shield' }
};

// Event Types
export type EventType = 'minisraz' | 'velky_sraz' | 'trackday' | 'vyjizdka';

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  minisraz: 'Minisraz',
  velky_sraz: 'Velký sraz',
  trackday: 'Trackday',
  vyjizdka: 'Vyjížďka'
};

export const EVENT_TYPE_COLORS: Record<EventType, { bg: string; text: string }> = {
  minisraz: { bg: 'bg-blue-100', text: 'text-blue-700' },
  velky_sraz: { bg: 'bg-purple-100', text: 'text-purple-700' },
  trackday: { bg: 'bg-green-100', text: 'text-green-700' },
  vyjizdka: { bg: 'bg-orange-100', text: 'text-orange-700' }
};

export interface AppEvent {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  date: string;
  endDate?: string; // Optional end date for multi-day events
  location: string;
  coordinates?: { lat: number; lng: number };
  eventType: EventType;
  imageUrl?: string | ImageVariants; // Backward compatible: supports legacy string URLs and new variants
  // Trackday specific fields
  registrationUrl?: string;
  price?: string;
  capacity?: number;
  rules?: string;
  contactInfo?: string;
  participants?: string[]; // Array of user UIDs who are attending
}

export interface EventComment {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  text: string;
  createdAt: any; // Firebase Timestamp
  isBKTeam?: boolean;
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
  isBKTeam?: boolean;
}

// Marketplace Listing Types ("Bazar")
export type ListingType = 'wanted_car' | 'wanted_parts' | 'selling_parts' | 'service';

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  wanted_car: 'Sháním auto',
  wanted_parts: 'Sháním díly',
  selling_parts: 'Prodám díly',
  service: 'Nabízím službu'
};

export const LISTING_TYPE_COLORS: Record<ListingType, { bg: string; text: string }> = {
  wanted_car: { bg: 'bg-blue-100', text: 'text-blue-700' },
  wanted_parts: { bg: 'bg-purple-100', text: 'text-purple-700' },
  selling_parts: { bg: 'bg-green-100', text: 'text-green-700' },
  service: { bg: 'bg-orange-100', text: 'text-orange-700' }
};

export interface MarketplaceListing {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  isBKTeam?: boolean;
  type: ListingType;
  title: string;
  description: string;
  imageUrl?: string | ImageVariants; // Backward compatible: supports legacy string URLs and new variants
  price?: number;       // Orientační/nabízená cena v Kč
  createdAt: any;       // Firebase Timestamp
  isActive: boolean;
}

// Notification Settings
export interface QuietHours {
  enabled: boolean;
  startHour: number; // 0-23
  endHour: number;   // 0-23
}

export interface NotificationSettings {
  // Master switch
  enabled: boolean;

  // Quiet hours
  quietHours: QuietHours;

  // Notification categories
  newEvents: {
    enabled: boolean;
    types: EventType[]; // Which event types to notify about
  };
  sosAlerts: boolean;          // SOS from others
  friendRequests: boolean;     // Added as friend
  eventComments: boolean;      // Comments on events I'm attending
  eventChanges: boolean;       // Changes to events I'm attending
  appUpdates: boolean;         // General info, new versions
  vehicleReminders: boolean;   // Digitální kaslík (STK, lékárnička, pojištění...)
  chatMessages: boolean;       // New chat messages
  marketplaceNotifications: boolean; // New marketplace listings

  // Digest mode (group notifications)
  digestMode: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  quietHours: { enabled: false, startHour: 22, endHour: 7 },
  newEvents: { enabled: true, types: ['trackday', 'velky_sraz'] },
  sosAlerts: true,
  friendRequests: true,
  eventComments: true,
  eventChanges: true,
  appUpdates: true,
  vehicleReminders: true,
  chatMessages: true,
  marketplaceNotifications: true,
  digestMode: false
};