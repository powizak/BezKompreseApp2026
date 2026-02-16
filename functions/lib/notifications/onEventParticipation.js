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
exports.onEventParticipation = void 0;
const functions = __importStar(require("firebase-functions"));
const sendNotification_1 = require("./sendNotification");
/**
 * Triggered when an event's participants list changes
 * Notifies the event organizer about new participants
 */
exports.onEventParticipation = functions
    .region("europe-west1")
    .firestore.document("events/{eventId}")
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const { eventId } = context.params;
    const beforeParticipants = before.participants || [];
    const afterParticipants = after.participants || [];
    // Find new participants (joined)
    const joined = afterParticipants.filter((p) => !beforeParticipants.includes(p));
    // Find removed participants (left)
    const left = beforeParticipants.filter((p) => !afterParticipants.includes(p));
    if (joined.length === 0 && left.length === 0) {
        return;
    }
    console.log(`Event ${eventId}: ${joined.length} joined, ${left.length} left`);
    // Get organizer's notification settings
    const organizerData = await (0, sendNotification_1.getUserNotificationData)(after.creatorId);
    if (!organizerData.token)
        return;
    if (!organizerData.settings?.enabled)
        return;
    if (!organizerData.settings.eventParticipation)
        return;
    // Notify about new participants
    for (const participantId of joined) {
        // Get participant's name
        const participantDoc = await sendNotification_1.db.collection("users").doc(participantId).get();
        const participantName = participantDoc.exists
            ? participantDoc.data()?.displayName || "Někdo"
            : "Někdo";
        await (0, sendNotification_1.sendPushNotification)({
            token: organizerData.token,
            title: "👤 Nový účastník",
            body: `${participantName} se přihlásil na ${after.title}`,
            data: {
                type: "event_participant_joined",
                eventId,
                participantId,
            },
            channelId: "default",
            quietHours: organizerData.settings?.quietHours,
        });
        console.log(`Notified organizer about ${participantName} joining event ${eventId}`);
    }
    // Optionally notify about participants leaving (less important, could be skipped)
    if (left.length > 0 && joined.length === 0) {
        // Only notify if someone left and nobody joined
        const leftNames = [];
        for (const participantId of left) {
            const participantDoc = await sendNotification_1.db.collection("users").doc(participantId).get();
            const name = participantDoc.exists
                ? participantDoc.data()?.displayName || "Někdo"
                : "Někdo";
            leftNames.push(name);
        }
        await (0, sendNotification_1.sendPushNotification)({
            token: organizerData.token,
            title: "👋 Účastník se odhlásil",
            body: `${leftNames[0]} se odhlásil z ${after.title}`,
            data: {
                type: "event_participant_left",
                eventId,
            },
            channelId: "default",
            quietHours: organizerData.settings?.quietHours,
        });
        console.log(`Notified organizer about participant leaving event ${eventId}`);
    }
});
//# sourceMappingURL=onEventParticipation.js.map