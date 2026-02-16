"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.sendPushNotification = sendPushNotification;
exports.getUsersWithNotificationEnabled = getUsersWithNotificationEnabled;
exports.getUserNotificationData = getUserNotificationData;
const admin = __importStar(require("firebase-admin"));
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
exports.db = db;
/**
 * Check if current time is within user's quiet hours
 */
function isQuietHours(settings) {
    if (!settings.quietHours?.enabled)
        return false;
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
async function sendPushNotification(payload) {
    // Respect quiet hours (skip for alerts channel — SOS must always go through)
    if (payload.channelId !== "alerts" && payload.quietHours?.enabled) {
        const now = new Date();
        const currentHour = now.getHours();
        const { startHour, endHour } = payload.quietHours;
        const inQuietHours = startHour > endHour
            ? currentHour >= startHour || currentHour < endHour
            : currentHour >= startHour && currentHour < endHour;
        if (inQuietHours) {
            console.log(`Skipping notification — quiet hours active (${startHour}:00-${endHour}:00)`);
            return false;
        }
    }
    try {
        const message = {
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
    }
    catch (error) {
        const errorCode = error?.code;
        if (errorCode === "messaging/invalid-registration-token" ||
            errorCode === "messaging/registration-token-not-registered") {
            console.log("Invalid token, should be removed from database");
        }
        else {
            console.error("Error sending notification:", error);
        }
        return false;
    }
}
/**
 * Get users with specific notification setting enabled
 */
async function getUsersWithNotificationEnabled(settingKey) {
    const usersSnapshot = await db.collection("users").get();
    return usersSnapshot.docs
        .map((doc) => ({
        uid: doc.id,
        token: doc.data().fcmToken,
        displayName: doc.data().displayName || "Uživatel",
        settings: doc.data().notificationSettings,
    }))
        .filter((user) => {
        if (!user.token)
            return false;
        if (!user.settings?.enabled)
            return false;
        if (isQuietHours(user.settings))
            return false;
        return user.settings[settingKey] === true;
    });
}
/**
 * Get specific user's FCM token and settings
 */
async function getUserNotificationData(userId) {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
        return { token: null, displayName: "Uživatel", settings: null };
    }
    const data = userDoc.data();
    return {
        token: data.fcmToken || null,
        displayName: data.displayName || "Uživatel",
        settings: data.notificationSettings || null,
    };
}
//# sourceMappingURL=sendNotification.js.map