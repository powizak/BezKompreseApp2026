import * as functions from "firebase-functions";
import {
    sendPushNotification,
    getUsersWithNotificationEnabled,
} from "./sendNotification";

interface HelpBeacon {
    userId: string;
    displayName: string;
    beaconType: string;
    description?: string;
}

const BEACON_TYPE_LABELS: Record<string, string> = {
    breakdown: "porucha",
    empty_tank: "prázdná nádrž",
    accident: "nehoda",
    flat_tire: "defekt",
    other: "jiné",
};

/**
 * Triggered when a new SOS beacon is created
 * Notifies all users with sosAlerts enabled
 */
export const onSosBeaconCreated = functions
    .region("europe-west1")
    .firestore.document("helpBeacons/{beaconId}")
    .onCreate(async (snap, context) => {
        const beacon = snap.data() as HelpBeacon;
        const beaconId = context.params.beaconId;

        console.log(`SOS Beacon created: ${beaconId} by ${beacon.displayName}`);

        // Get all users with SOS alerts enabled
        const usersToNotify = await getUsersWithNotificationEnabled("sosAlerts");

        // Filter out the beacon creator
        const recipients = usersToNotify.filter(
            (user) => user.uid !== beacon.userId
        );

        console.log(`Notifying ${recipients.length} users about SOS`);

        const beaconTypeLabel =
            BEACON_TYPE_LABELS[beacon.beaconType] || beacon.beaconType;
        const body = beacon.description
            ? `${beacon.displayName} potřebuje pomoc: ${beacon.description}`
            : `${beacon.displayName} hlásí: ${beaconTypeLabel}`;

        const notifications = recipients.map((user) =>
            sendPushNotification({
                token: user.token,
                title: "🚨 SOS Volání",
                body,
                data: {
                    type: "sos_beacon",
                    beaconId,
                },
                channelId: "alerts",
            })
        );

        const results = await Promise.all(notifications);
        const successCount = results.filter(Boolean).length;

        console.log(`SOS notifications sent: ${successCount}/${recipients.length}`);
    });
