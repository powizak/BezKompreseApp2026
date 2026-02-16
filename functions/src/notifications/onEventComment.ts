import * as functions from "firebase-functions";
import {
    sendPushNotification,
    getUserNotificationData,
    db,
} from "./sendNotification";

interface EventComment {
    userId: string;
    userName: string;
    text: string;
}

interface AppEvent {
    title: string;
    participants?: string[];
    creatorId: string;
}

/**
 * Triggered when a new comment is added to an event
 * Notifies event participants (except the comment author)
 */
export const onEventCommentCreated = functions
    .region("europe-west1")
    .firestore.document("events/{eventId}/comments/{commentId}")
    .onCreate(async (snap, context) => {
        const comment = snap.data() as EventComment;
        const { eventId } = context.params;

        console.log(`New comment on event ${eventId} by ${comment.userName}`);

        // Get the event to find participants
        const eventDoc = await db.collection("events").doc(eventId).get();
        if (!eventDoc.exists) {
            console.log("Event not found, skipping notification");
            return;
        }

        const event = eventDoc.data() as AppEvent;
        const participants = event.participants || [];

        // Include creator in notification recipients
        const allRecipients = new Set([...participants, event.creatorId]);

        // Remove the comment author from recipients
        allRecipients.delete(comment.userId);

        console.log(`Notifying ${allRecipients.size} participants`);

        const notifications = Array.from(allRecipients).map(async (userId) => {
            const userData = await getUserNotificationData(userId);

            if (!userData.token) return false;
            if (!userData.settings?.enabled) return false;
            if (!userData.settings.eventComments) return false;

            return sendPushNotification({
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
