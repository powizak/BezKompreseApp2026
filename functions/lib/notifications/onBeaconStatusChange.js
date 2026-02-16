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
exports.onBeaconStatusChange = void 0;
const functions = __importStar(require("firebase-functions"));
const sendNotification_1 = require("./sendNotification");
/**
 * Triggered when a help beacon status changes
 * Notifies the beacon creator when someone is coming to help
 * Notifies the helper when beacon is resolved
 */
exports.onBeaconStatusChange = functions
    .region("europe-west1")
    .firestore.document("helpBeacons/{beaconId}")
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const { beaconId } = context.params;
    // Only process status changes
    if (before.status === after.status) {
        return;
    }
    console.log(`Beacon ${beaconId} status changed: ${before.status} -> ${after.status}`);
    // Case 1: Someone is coming to help - notify beacon creator
    if (before.status === "active" && after.status === "help_coming") {
        const creatorData = await (0, sendNotification_1.getUserNotificationData)(after.userId);
        if (!creatorData.token)
            return;
        if (!creatorData.settings?.enabled)
            return;
        if (!creatorData.settings.sosAlerts)
            return;
        const helperName = after.helperName || "Někdo";
        await (0, sendNotification_1.sendPushNotification)({
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
        const helperData = await (0, sendNotification_1.getUserNotificationData)(after.helperId);
        if (!helperData.token)
            return;
        if (!helperData.settings?.enabled)
            return;
        if (!helperData.settings.sosAlerts)
            return;
        const creatorName = after.displayName || "Uživatel";
        await (0, sendNotification_1.sendPushNotification)({
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
//# sourceMappingURL=onBeaconStatusChange.js.map