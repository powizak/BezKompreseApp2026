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
exports.onEventUpdated = void 0;
const functions = __importStar(require("firebase-functions"));
const sendNotification_1 = require("./sendNotification");
/**
 * Triggered when an event is updated
 * Notifies participants about changes to date, location, or title
 */
exports.onEventUpdated = functions
    .region("europe-west1")
    .firestore.document("events/{eventId}")
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const { eventId } = context.params;
    // Detect relevant changes
    const changes = [];
    if (before.title !== after.title) {
        changes.push("název");
    }
    if (before.date !== after.date || before.endDate !== after.endDate) {
        changes.push("datum");
    }
    if (before.location !== after.location) {
        changes.push("místo");
    }
    // No relevant changes, skip
    if (changes.length === 0) {
        return;
    }
    console.log(`Event ${eventId} updated: ${changes.join(", ")}`);
    const participants = after.participants || [];
    // Include creator in notification recipients
    const allRecipients = new Set([...participants, after.creatorId]);
    // Don't notify if there are no participants
    if (allRecipients.size === 0) {
        console.log("No recipients for event update notification");
        return;
    }
    console.log(`Notifying ${allRecipients.size} participants about event update`);
    const changeText = changes.join(", ");
    const notifications = Array.from(allRecipients).map(async (userId) => {
        const userData = await (0, sendNotification_1.getUserNotificationData)(userId);
        if (!userData.token)
            return false;
        if (!userData.settings?.enabled)
            return false;
        if (!userData.settings.eventChanges)
            return false;
        return (0, sendNotification_1.sendPushNotification)({
            token: userData.token,
            title: `📅 Změna v akci`,
            body: `${after.title}: změněn ${changeText}`,
            data: {
                type: "event_update",
                eventId,
            },
            channelId: "default",
        });
    });
    const results = await Promise.all(notifications);
    const successCount = results.filter(Boolean).length;
    console.log(`Event update notifications sent: ${successCount}/${allRecipients.size}`);
});
//# sourceMappingURL=onEventUpdate.js.map