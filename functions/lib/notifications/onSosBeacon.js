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
exports.onSosBeaconCreated = void 0;
const functions = __importStar(require("firebase-functions"));
const sendNotification_1 = require("./sendNotification");
const BEACON_TYPE_LABELS = {
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
exports.onSosBeaconCreated = functions
    .region("europe-west1")
    .firestore.document("help-beacons/{beaconId}")
    .onCreate(async (snap, context) => {
    const beacon = snap.data();
    const beaconId = context.params.beaconId;
    console.log(`SOS Beacon created: ${beaconId} by ${beacon.displayName}`);
    // Get all users with SOS alerts enabled
    const usersToNotify = await (0, sendNotification_1.getUsersWithNotificationEnabled)("sosAlerts");
    // Filter out the beacon creator
    const recipients = usersToNotify.filter((user) => user.uid !== beacon.userId);
    console.log(`Notifying ${recipients.length} users about SOS`);
    const beaconTypeLabel = BEACON_TYPE_LABELS[beacon.beaconType] || beacon.beaconType;
    const body = beacon.description
        ? `${beacon.displayName} potřebuje pomoc: ${beacon.description}`
        : `${beacon.displayName} hlásí: ${beaconTypeLabel}`;
    const notifications = recipients.map((user) => (0, sendNotification_1.sendPushNotification)({
        token: user.token,
        title: "🚨 SOS Volání",
        body,
        data: {
            type: "sos_beacon",
            beaconId,
        },
        channelId: "alerts",
    }));
    const results = await Promise.all(notifications);
    const successCount = results.filter(Boolean).length;
    console.log(`SOS notifications sent: ${successCount}/${recipients.length}`);
});
//# sourceMappingURL=onSosBeacon.js.map