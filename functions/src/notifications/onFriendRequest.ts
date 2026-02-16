import * as functions from "firebase-functions";
import {
    sendPushNotification,
    getUserNotificationData,
} from "./sendNotification";

interface UserProfile {
    displayName: string | null;
    friends?: string[];
}

/**
 * Triggered when a user's document is updated
 * Detects new friends added and notifies them
 */
export const onFriendAdded = functions
    .region("europe-west1")
    .firestore.document("users/{userId}")
    .onUpdate(async (change, context) => {
        const before = change.before.data() as UserProfile;
        const after = change.after.data() as UserProfile;
        const { userId } = context.params;

        const beforeFriends = before.friends || [];
        const afterFriends = after.friends || [];

        // Find newly added friends
        const newFriends = afterFriends.filter(
            (friendId) => !beforeFriends.includes(friendId)
        );

        if (newFriends.length === 0) {
            return;
        }

        console.log(`User ${userId} added ${newFriends.length} new friend(s)`);

        const adderName = after.displayName || "Někdo";

        const notifications = newFriends.map(async (friendId) => {
            const userData = await getUserNotificationData(friendId);

            if (!userData.token) return false;
            if (!userData.settings?.enabled) return false;
            if (!userData.settings.friendRequests) return false;

            return sendPushNotification({
                token: userData.token,
                title: "👋 Nový přítel",
                body: `${adderName} vás přidal(a) mezi přátele`,
                data: {
                    type: "friend_request",
                    userId,
                },
                channelId: "default",
                quietHours: userData.settings?.quietHours,
            });
        });

        const results = await Promise.all(notifications);
        const successCount = results.filter(Boolean).length;

        console.log(`Friend notifications sent: ${successCount}/${newFriends.length}`);
    });
