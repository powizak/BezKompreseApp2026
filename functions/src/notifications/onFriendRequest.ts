import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {
    sendPushNotification,
    getUserNotificationData,
    db
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

        console.log(`User ${userId} added ${newFriends.length} new friend(s). Before: ${beforeFriends.length}, After: ${afterFriends.length}`);

        const adderName = after.displayName || "Někdo";

        const notifications = newFriends.map(async (friendId) => {
            // Check cooldown to prevent spam (e.g. remove and add immediately)
            const lockId = `friend_req_${userId}_${friendId}`;
            const lockRef = db.collection("notification_locks").doc(lockId);
            const lockDoc = await lockRef.get();

            if (lockDoc.exists) {
                const lastSent = lockDoc.data()?.timestamp?.toDate();
                if (lastSent && Date.now() - lastSent.getTime() < 1000 * 60 * 60 * 24) { // 24 hours
                    console.log(`Skipping notification to ${friendId} from ${userId} due to 24h cooldown.`);
                    return false;
                }
            }

            const userData = await getUserNotificationData(friendId);

            if (!userData.token) {
                console.log(`Skipping friend notification for ${friendId} - missing token.`);
                return false;
            }
            if (!userData.settings?.enabled) {
                console.log(`Skipping friend notification for ${friendId} - notifications disabled completely.`);
                return false;
            }
            if (!userData.settings.friendRequests) {
                console.log(`Skipping friend notification for ${friendId} - friendRequests notifications disabled.`);
                return false;
            }

            // Set lock for 24h
            await lockRef.set({ timestamp: admin.firestore.FieldValue.serverTimestamp() });

            console.log(`Sending friend notification to ${friendId} (from ${userId}).`);
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
