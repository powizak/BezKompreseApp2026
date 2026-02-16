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
exports.onEventCommentCreated = void 0;
const functions = __importStar(require("firebase-functions"));
const sendNotification_1 = require("./sendNotification");
/**
 * Triggered when a new comment is added to an event
 * Notifies event participants (except the comment author)
 */
exports.onEventCommentCreated = functions
    .region("europe-west1")
    .firestore.document("events/{eventId}/comments/{commentId}")
    .onCreate(async (snap, context) => {
    const comment = snap.data();
    const { eventId } = context.params;
    console.log(`New comment on event ${eventId} by ${comment.userName}`);
    // Get the event to find participants
    const eventDoc = await sendNotification_1.db.collection("events").doc(eventId).get();
    if (!eventDoc.exists) {
        console.log("Event not found, skipping notification");
        return;
    }
    const event = eventDoc.data();
    const participants = event.participants || [];
    // Include creator in notification recipients
    const allRecipients = new Set([...participants, event.creatorId]);
    // Remove the comment author from recipients
    allRecipients.delete(comment.userId);
    console.log(`Notifying ${allRecipients.size} participants`);
    const notifications = Array.from(allRecipients).map(async (userId) => {
        const userData = await (0, sendNotification_1.getUserNotificationData)(userId);
        if (!userData.token)
            return false;
        if (!userData.settings?.enabled)
            return false;
        if (!userData.settings.eventComments)
            return false;
        return (0, sendNotification_1.sendPushNotification)({
            token: userData.token,
            title: `💬 ${event.title}`,
            body: `${comment.userName}: ${comment.text.substring(0, 100)}${comment.text.length > 100 ? "..." : ""}`,
            data: {
                type: "event_comment",
                eventId,
            },
            channelId: "default",
            quietHours: userData.settings?.quietHours,
        });
    });
    const results = await Promise.all(notifications);
    const successCount = results.filter(Boolean).length;
    console.log(`Comment notifications sent: ${successCount}/${allRecipients.size}`);
});
//# sourceMappingURL=onEventComment.js.map