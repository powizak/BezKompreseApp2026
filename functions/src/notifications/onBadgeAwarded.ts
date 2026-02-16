import * as functions from "firebase-functions";
import { sendPushNotification } from "./sendNotification";

interface UserBadge {
    id: string;
    earnedAt: string;
}

interface UserData {
    displayName?: string | null;
    badges?: UserBadge[];
    fcmToken?: string;
    notificationSettings?: {
        enabled: boolean;
        badgeNotifications: boolean;
        quietHours?: { enabled: boolean; startHour: number; endHour: number };
    };
}

// Badge definitions (synced with src/config/badges.ts)
const BADGE_INFO: Record<string, { name: string; description: string }> = {
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
export const onBadgeAwarded = functions
    .region("europe-west1")
    .firestore.document("users/{userId}")
    .onUpdate(async (change, context) => {
        const before = change.before.data() as UserData;
        const after = change.after.data() as UserData;
        const { userId } = context.params;

        const beforeBadges = before.badges || [];
        const afterBadges = after.badges || [];

        // Find newly earned badges
        const newBadges = afterBadges.filter((badge) =>
            !beforeBadges.some((old) => old.id === badge.id)
        );

        if (newBadges.length === 0) {
            return;
        }

        console.log(`User ${userId} earned ${newBadges.length} new badge(s)`);

        // Check notification settings
        if (!after.notificationSettings?.enabled) return;
        if (!after.notificationSettings?.badgeNotifications) return;
        if (!after.fcmToken) return;

        // Send notification for each new badge
        for (const badge of newBadges) {
            const badgeInfo = BADGE_INFO[badge.id] || {
                name: badge.id,
                description: "Speciální odznak",
            };

            await sendPushNotification({
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
