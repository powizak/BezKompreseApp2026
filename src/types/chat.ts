export interface Message {
    id: string;
    senderId: string;
    text: string;
    createdAt: any; // Firebase Timestamp or string ISO
}

export interface ChatRoom {
    id: string;
    participants: string[];
    lastMessage?: string;
    updatedAt: any;
}

export interface PresenceInfo {
    uid: string;
    displayName: string;
    photoURL: string;
    status: string;
    location: { lat: number; lng: number } | null; // null if hidden/near home
    lastActive: any;
    allowContact: boolean;
}
