import * as admin from "firebase-admin";

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

export interface NotificationPayload {
    token: string;
    title: string;
    body: string;
    data?: Record<string, string>;
    channelId?: string;
}

export interface NotificationSettings {
    enabled: boolean;
    quietHours: {
        enabled: boolean;
        startHour: number;
        endHour: number;
    };
    sosAlerts: boolean;
    friendRequests: boolean;
    eventComments: boolean;
    eventChanges: boolean;
    appUpdates: boolean;
    vehicleReminders: boolean;
    newEvents: {
        enabled: boolean;
        types: string[];
    };
    digestMode: boolean;
}

/**
 * Check if current time is within user's quiet hours
 */
function isQuietHours(settings: NotificationSettings): boolean {
    if (!settings.quietHours?.enabled) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const { startHour, endHour } = settings.quietHours;

    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (startHour > endHour) {
        return currentHour >= startHour || currentHour < endHour;
    }
    return currentHour >= startHour && currentHour < endHour;
}

/**
 * Send push notification via FCM
 * Respects user's quiet hours and enabled settings
 */
export async function sendPushNotification(
    payload: NotificationPayload
): Promise<boolean> {
    try {
        const message: admin.messaging.Message = {
            token: payload.token,
            notification: {
                title: payload.title,
                body: payload.body,
            },
            data: payload.data,
            android: {
                priority: "high",
                notification: {
                    channelId: payload.channelId || "default",
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: "default",
                        badge: 1,
                    },
                },
            },
        };

        await admin.messaging().send(message);
        console.log(`Notification sent successfully to token: ${payload.token.substring(0, 20)}...`);
        return true;
    } catch (error: unknown) {
        const errorCode = (error as { code?: string })?.code;
        if (
            errorCode === "messaging/invalid-registration-token" ||
            errorCode === "messaging/registration-token-not-registered"
        ) {
            console.log("Invalid token, should be removed from database");
        } else {
            console.error("Error sending notification:", error);
        }
        return false;
    }
}

/**
 * Get users with specific notification setting enabled
 */
export async function getUsersWithNotificationEnabled(
    settingKey: keyof NotificationSettings
): Promise<
    Array<{
        uid: string;
        token: string;
        displayName: string;
        settings: NotificationSettings;
    }>
> {
    const usersSnapshot = await db.collection("users").get();

    return usersSnapshot.docs
        .map((doc) => ({
            uid: doc.id,
            token: doc.data().fcmToken as string,
            displayName: (doc.data().displayName as string) || "Uživatel",
            settings: doc.data().notificationSettings as NotificationSettings,
        }))
        .filter((user) => {
            if (!user.token) return false;
            if (!user.settings?.enabled) return false;
            if (isQuietHours(user.settings)) return false;
            return user.settings[settingKey] === true;
        });
}

/**
 * Get specific user's FCM token and settings
 */
export async function getUserNotificationData(userId: string): Promise<{
    token: string | null;
    displayName: string;
    settings: NotificationSettings | null;
}> {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
        return { token: null, displayName: "Uživatel", settings: null };
    }

    const data = userDoc.data()!;
    return {
        token: data.fcmToken || null,
        displayName: data.displayName || "Uživatel",
        settings: data.notificationSettings || null,
    };
}

export { db };
