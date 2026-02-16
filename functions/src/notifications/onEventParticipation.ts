import * as functions from "firebase-functions";
import {
    sendPushNotification,
    getUserNotificationData,
    db,
} from "./sendNotification";

interface AppEvent {
    title: string;
    creatorId: string;
    participants?: string[];
}

/**
 * Triggered when an event's participants list changes
 * Notifies the event organizer about new participants
 */
export const onEventParticipation = functions
    .region("europe-west1")
    .firestore.document("events/{eventId}")
    .onUpdate(async (change, context) => {
        const before = change.before.data() as AppEvent;
        const after = change.after.data() as AppEvent;
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
        const organizerData = await getUserNotificationData(after.creatorId);

        if (!organizerData.token) return;
        if (!organizerData.settings?.enabled) return;
        if (!organizerData.settings.eventParticipation) return;

        // Notify about new participants
        for (const participantId of joined) {
            // Get participant's name
            const participantDoc = await db.collection("users").doc(participantId).get();
            const participantName = participantDoc.exists
                ? participantDoc.data()?.displayName || "Někdo"
                : "Někdo";

            await sendPushNotification({
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
            const leftNames: string[] = [];
            for (const participantId of left) {
                const participantDoc = await db.collection("users").doc(participantId).get();
                const name = participantDoc.exists
                    ? participantDoc.data()?.displayName || "Někdo"
                    : "Někdo";
                leftNames.push(name);
            }

            await sendPushNotification({
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
