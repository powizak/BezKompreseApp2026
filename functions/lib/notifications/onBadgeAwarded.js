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
exports.onBadgeAwarded = void 0;
const functions = __importStar(require("firebase-functions"));
const sendNotification_1 = require("./sendNotification");
// Badge definitions (synced with src/config/badges.ts)
const BADGE_INFO = {
    early_adopter: { name: "Early Adopter", description: "Jeden z prvních uživatelů aplikace" },
    high_miler: { name: "High Miler", description: "Najeto přes 100 000 km" },
    wrench_wizard: { name: "Wrench Wizard", description: "Více než 20 servisních záznamů" },
    socialite: { name: "Socialite", description: "Více než 50 přátel" },
    organizer: { name: "Organizer", description: "Organizoval jsi alespoň 5 akcí" },
    test_driver: { name: "Test Driver", description: "Pomohl s testováním aplikace" },
    bk_team: { name: "BK Team", description: "Člen týmu Bez Komprese" },
};
/**
 * Triggered when a user's badges are updated
 * Sends notification for newly earned badges
 */
exports.onBadgeAwarded = functions
    .region("europe-west1")
    .firestore.document("users/{userId}")
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const { userId } = context.params;
    const beforeBadges = before.badges || [];
    const afterBadges = after.badges || [];
    // Find newly earned badges
    const newBadges = afterBadges.filter((badge) => !beforeBadges.some((old) => old.id === badge.id));
    if (newBadges.length === 0) {
        return;
    }
    console.log(`User ${userId} earned ${newBadges.length} new badge(s)`);
    // Check notification settings
    if (!after.notificationSettings?.enabled)
        return;
    if (!after.notificationSettings?.badgeNotifications)
        return;
    if (!after.fcmToken)
        return;
    // Send notification for each new badge
    for (const badge of newBadges) {
        const badgeInfo = BADGE_INFO[badge.id] || {
            name: badge.id,
            description: "Speciální odznak",
        };
        await (0, sendNotification_1.sendPushNotification)({
            token: after.fcmToken,
            title: "🏆 Nový odznak!",
            body: `Získal jsi odznak "${badgeInfo.name}" - ${badgeInfo.description}`,
            data: {
                type: "badge_awarded",
                badgeId: badge.id,
            },
            channelId: "default",
            quietHours: after.notificationSettings?.quietHours,
        });
        console.log(`Badge notification sent: ${badge.id} to user ${userId}`);
    }
});
//# sourceMappingURL=onBadgeAwarded.js.map