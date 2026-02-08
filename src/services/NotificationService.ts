import { Context, Effect, Layer } from "effect";
import { Capacitor } from "@capacitor/core";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { NativeSettings, AndroidSettings, IOSSettings } from "capacitor-native-settings";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import type { NotificationSettings } from "../types";
import { DEFAULT_NOTIFICATION_SETTINGS } from "../types";

// Error type
export class NotificationError {
    readonly _tag = "NotificationError";
    readonly message: string;
    readonly originalError: unknown;
    constructor(message: string, originalError: unknown = null) {
        this.message = message;
        this.originalError = originalError;
    }
}

// Permission status
export type NotificationPermissionStatus = "granted" | "denied" | "prompt";

// Service Interface
export interface NotificationService {
    // Permission & Registration
    readonly checkPermission: Effect.Effect<NotificationPermissionStatus, NotificationError>;
    readonly requestPermission: Effect.Effect<NotificationPermissionStatus, NotificationError>;
    readonly registerDevice: (userId: string) => Effect.Effect<string, NotificationError>;
    readonly unregisterDevice: (userId: string) => Effect.Effect<void, NotificationError>;

    // Platform-specific
    readonly openSystemSettings: Effect.Effect<void, NotificationError>;
    readonly isNativePlatform: boolean;
}

// Create the Tag
export const NotificationService = Context.GenericTag<NotificationService>("NotificationService");

// Implement the Live Layer
export const NotificationServiceLive = Layer.succeed(
    NotificationService,
    NotificationService.of({
        isNativePlatform: Capacitor.isNativePlatform(),

        checkPermission: Effect.tryPromise({
            try: async () => {
                if (Capacitor.isNativePlatform()) {
                    const result = await FirebaseMessaging.checkPermissions();
                    return result.receive as NotificationPermissionStatus;
                }
                // Web
                if (!("Notification" in window)) {
                    return "denied" as NotificationPermissionStatus;
                }
                return Notification.permission as NotificationPermissionStatus;
            },
            catch: (e) => new NotificationError("Failed to check notification permission", e)
        }),

        requestPermission: Effect.tryPromise({
            try: async () => {
                if (Capacitor.isNativePlatform()) {
                    const result = await FirebaseMessaging.requestPermissions();
                    return result.receive as NotificationPermissionStatus;
                }
                // Web
                if (!("Notification" in window)) {
                    throw new Error("Notifications not supported in this browser");
                }
                const permission = await Notification.requestPermission();
                return permission as NotificationPermissionStatus;
            },
            catch: (e) => new NotificationError("Failed to request notification permission", e)
        }),

        registerDevice: (userId: string) => Effect.tryPromise({
            try: async () => {
                let token: string;

                if (Capacitor.isNativePlatform()) {
                    const result = await FirebaseMessaging.getToken();
                    token = result.token;
                } else {
                    // Web - requires VAPID key from Firebase Console
                    // For now, we'll use the native getToken which works in supported browsers
                    const result = await FirebaseMessaging.getToken();
                    token = result.token;
                }

                // Save token to user's Firestore document
                const userRef = doc(db, "users", userId);
                await updateDoc(userRef, { fcmToken: token });

                // Set up token refresh listener
                FirebaseMessaging.addListener("tokenReceived", async (event) => {
                    console.log("FCM Token refreshed:", event.token);
                    await updateDoc(userRef, { fcmToken: event.token });
                });

                return token;
            },
            catch: (e) => new NotificationError("Failed to register device for notifications", e)
        }),

        unregisterDevice: (userId: string) => Effect.tryPromise({
            try: async () => {
                await FirebaseMessaging.deleteToken();
                const userRef = doc(db, "users", userId);
                await updateDoc(userRef, { fcmToken: null });
            },
            catch: (e) => new NotificationError("Failed to unregister device", e)
        }),

        openSystemSettings: Effect.tryPromise({
            try: async () => {
                if (Capacitor.isNativePlatform()) {
                    const platform = Capacitor.getPlatform();
                    if (platform === 'android') {
                        // Open Android app notification settings
                        await NativeSettings.open({
                            optionAndroid: AndroidSettings.AppNotification,
                            optionIOS: IOSSettings.App
                        });
                    } else if (platform === 'ios') {
                        // Open iOS app settings (notification settings are part of app settings)
                        await NativeSettings.open({
                            optionAndroid: AndroidSettings.AppNotification,
                            optionIOS: IOSSettings.App
                        });
                    }
                } else {
                    // Web: Can't open system settings, show instructions instead
                    console.log("To change notification settings, use your browser's site settings.");
                }
            },
            catch: (e) => new NotificationError("Failed to open system settings", e)
        })
    })
);

// Helper to get default settings with user overrides
export function mergeNotificationSettings(
    userSettings?: Partial<NotificationSettings>
): NotificationSettings {
    if (!userSettings) return DEFAULT_NOTIFICATION_SETTINGS;

    return {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...userSettings,
        quietHours: {
            ...DEFAULT_NOTIFICATION_SETTINGS.quietHours,
            ...(userSettings.quietHours || {})
        },
        newEvents: {
            ...DEFAULT_NOTIFICATION_SETTINGS.newEvents,
            ...(userSettings.newEvents || {})
        }
    };
}
