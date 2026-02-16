import * as functions from "firebase-functions";
import {
    sendPushNotification,
    getUserNotificationData,
} from "./sendNotification";

interface AppEvent {
    title: string;
    date: string;
    endDate?: string;
    location: string;
    participants?: string[];
    creatorId: string;
}

/**
 * Triggered when an event is updated
 * Notifies participants about changes to date, location, or title
 */
export const onEventUpdated = functions
    .region("europe-west1")
    .firestore.document("events/{eventId}")
    .onUpdate(async (change, context) => {
        const before = change.before.data() as AppEvent;
        const after = change.after.data() as AppEvent;
        const { eventId } = context.params;

        // Detect relevant changes
        const changes: string[] = [];

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
            const userData = await getUserNotificationData(userId);

            if (!userData.token) return false;
            if (!userData.settings?.enabled) return false;
            if (!userData.settings.eventChanges) return false;

            return sendPushNotification({
                token: userData.token,
                title: `📅 Změna v akci`,
                body: `${after.title}: změněn ${changeText}`,
                data: {
                    type: "event_update",
                    eventId,
                },
                channelId: "default",
                quietHours: userData.settings?.quietHours,
            });
        });

        const results = await Promise.all(notifications);
        const successCount = results.filter(Boolean).length;

        console.log(`Event update notifications sent: ${successCount}/${allRecipients.size}`);
    });
