import * as functions from "firebase-functions";
import {
    sendPushNotification,
    db,
} from "./sendNotification";

interface AppEvent {
    title: string;
    date: string;
    endDate?: string;
    location: string;
    eventType: string;
    creatorId: string;
    description?: string;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
    minisraz: "Minisraz",
    velky_sraz: "Velký sraz",
    trackday: "Trackday",
    vyjizdka: "Vyjížďka",
};

/**
 * Triggered when a new event is created
 * Notifies users who have enabled notifications for this event type
 */
export const onNewEventCreated = functions
    .region("europe-west1")
    .firestore.document("events/{eventId}")
    .onCreate(async (snap, context) => {
        const event = snap.data() as AppEvent;
        const { eventId } = context.params;

        console.log(`New event created: ${event.title} (${event.eventType})`);

        // Only fetch users who have notifications + newEvents enabled (reduces reads)
        const usersSnapshot = await db.collection("users")
            .where("notificationSettings.enabled", "==", true)
            .where("notificationSettings.newEvents.enabled", "==", true)
            .get();
        const notifications: Promise<boolean>[] = [];

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const userId = userDoc.id;

            // Skip the creator
            if (userId === event.creatorId) continue;

            // Check if user has this specific event type in their preferences
            const newEventsSettings = userData.notificationSettings?.newEvents;
            if (!newEventsSettings.types?.includes(event.eventType)) continue;

            if (!userData.fcmToken) continue;

            const eventDate = new Date(event.date);
            const dateStr = eventDate.toLocaleDateString("cs-CZ", {
                day: "numeric",
                month: "long",
            });

            const typeLabel = EVENT_TYPE_LABELS[event.eventType] || event.eventType;

            notifications.push(
                sendPushNotification({
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
                })
            );
        }

        const results = await Promise.all(notifications);
        const successCount = results.filter(Boolean).length;

        console.log(`New event notifications sent: ${successCount}/${notifications.length}`);
    });
