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
exports.onNewEventCreated = void 0;
const functions = __importStar(require("firebase-functions"));
const sendNotification_1 = require("./sendNotification");
const EVENT_TYPE_LABELS = {
    minisraz: "Minisraz",
    velky_sraz: "Velký sraz",
    trackday: "Trackday",
    vyjizdka: "Vyjížďka",
};
/**
 * Triggered when a new event is created
 * Notifies users who have enabled notifications for this event type
 */
exports.onNewEventCreated = functions
    .region("europe-west1")
    .firestore.document("events/{eventId}")
    .onCreate(async (snap, context) => {
    const event = snap.data();
    const { eventId } = context.params;
    console.log(`New event created: ${event.title} (${event.eventType})`);
    // Only fetch users who have notifications + newEvents enabled (reduces reads)
    const usersSnapshot = await sendNotification_1.db.collection("users")
        .where("notificationSettings.enabled", "==", true)
        .where("notificationSettings.newEvents.enabled", "==", true)
        .get();
    const notifications = [];
    for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;
        // Skip the creator
        if (userId === event.creatorId)
            continue;
        // Check if user has this specific event type in their preferences
        const newEventsSettings = userData.notificationSettings?.newEvents;
        if (!newEventsSettings.types?.includes(event.eventType))
            continue;
        if (!userData.fcmToken)
            continue;
        const eventDate = new Date(event.date);
        const dateStr = eventDate.toLocaleDateString("cs-CZ", {
            day: "numeric",
            month: "long",
        });
        const typeLabel = EVENT_TYPE_LABELS[event.eventType] || event.eventType;
        notifications.push((0, sendNotification_1.sendPushNotification)({
            token: userData.fcmToken,
            title: `📅 Nová akce: ${event.title}`,
            body: `${typeLabel} - ${dateStr} v ${event.location}`,
            data: {
                type: "new_event",
                eventId,
                eventType: event.eventType,
            },
            channelId: "events",
            quietHours: userData.notificationSettings?.quietHours,
        }));
    }
    const results = await Promise.all(notifications);
    const successCount = results.filter(Boolean).length;
    console.log(`New event notifications sent: ${successCount}/${notifications.length}`);
});
//# sourceMappingURL=onNewEvent.js.map