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
exports.onFriendAdded = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const sendNotification_1 = require("./sendNotification");
/**
 * Triggered when a user's document is updated
 * Detects new friends added and notifies them
 */
exports.onFriendAdded = functions
    .region("europe-west1")
    .firestore.document("users/{userId}")
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const { userId } = context.params;
    const beforeFriends = before.friends || [];
    const afterFriends = after.friends || [];
    // Find newly added friends
    const newFriends = afterFriends.filter((friendId) => !beforeFriends.includes(friendId));
    if (newFriends.length === 0) {
        return;
    }
    console.log(`User ${userId} added ${newFriends.length} new friend(s). Before: ${beforeFriends.length}, After: ${afterFriends.length}`);
    const adderName = after.displayName || "Někdo";
    const notifications = newFriends.map(async (friendId) => {
        // Check cooldown to prevent spam (e.g. remove and add immediately)
        const lockId = `friend_req_${userId}_${friendId}`;
        const lockRef = sendNotification_1.db.collection("notification_locks").doc(lockId);
        const lockDoc = await lockRef.get();
        if (lockDoc.exists) {
            const lastSent = lockDoc.data()?.timestamp?.toDate();
            if (lastSent && Date.now() - lastSent.getTime() < 1000 * 60 * 60 * 24) { // 24 hours
                console.log(`Skipping notification to ${friendId} from ${userId} due to 24h cooldown.`);
                return false;
            }
        }
        const userData = await (0, sendNotification_1.getUserNotificationData)(friendId);
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
        return (0, sendNotification_1.sendPushNotification)({
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
//# sourceMappingURL=onFriendRequest.js.map