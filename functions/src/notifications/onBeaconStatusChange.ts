import * as functions from "firebase-functions";
import {
    sendPushNotification,
    getUserNotificationData,
} from "./sendNotification";

interface HelpBeacon {
    userId: string;
    displayName: string;
    beaconType: string;
    description?: string;
    status: "active" | "help_coming" | "resolved";
    helperId?: string;
    helperName?: string;
}

/**
 * Triggered when a help beacon status changes
 * Notifies the beacon creator when someone is coming to help
 * Notifies the helper when beacon is resolved
 */
export const onBeaconStatusChange = functions
    .region("europe-west1")
    .firestore.document("helpBeacons/{beaconId}")
    .onUpdate(async (change, context) => {
        const before = change.before.data() as HelpBeacon;
        const after = change.after.data() as HelpBeacon;
        const { beaconId } = context.params;

        // Only process status changes
        if (before.status === after.status) {
            return;
        }

        console.log(`Beacon ${beaconId} status changed: ${before.status} -> ${after.status}`);

        // Case 1: Someone is coming to help - notify beacon creator
        if (before.status === "active" && after.status === "help_coming") {
            const creatorData = await getUserNotificationData(after.userId);

            if (!creatorData.token) return;
            if (!creatorData.settings?.enabled) return;
            if (!creatorData.settings.sosAlerts) return;

            const helperName = after.helperName || "Někdo";

            await sendPushNotification({
                token: creatorData.token,
                title: "🚗 Někdo jede pomoct!",
                body: `${helperName} reaguje na tvůj SOS signál`,
                data: {
                    type: "beacon_help_coming",
                    beaconId,
                    helperId: after.helperId || "",
                },
                channelId: "alerts",
            });

            console.log(`Notified beacon creator ${after.userId} that ${helperName} is coming`);
        }

        // Case 2: Beacon resolved - notify helper if exists
        if (before.status === "help_coming" && after.status === "resolved" && after.helperId) {
            const helperData = await getUserNotificationData(after.helperId);

            if (!helperData.token) return;
            if (!helperData.settings?.enabled) return;
            if (!helperData.settings.sosAlerts) return;

            const creatorName = after.displayName || "Uživatel";

            await sendPushNotification({
                token: helperData.token,
                title: "✅ Problém vyřešen",
                body: `${creatorName} označil SOS signál jako vyřešený`,
                data: {
                    type: "beacon_resolved",
                    beaconId,
                },
                channelId: "alerts",
            });

            console.log(`Notified helper ${after.helperId} that beacon is resolved`);
        }
    });
