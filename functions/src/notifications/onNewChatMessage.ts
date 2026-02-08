import * as functions from "firebase-functions/v1";
import {
    sendPushNotification,
    getUserNotificationData,
    db,
} from "./sendNotification";

interface MessageData {
    senderId: string;
    text: string;
}

interface ChatRoomData {
    participants: string[];
    participantNames: Record<string, string>;
}

/**
 * Triggered when a new message is created in a chat room
 * Sends a push notification to the recipient
 */
export const onNewChatMessage = functions.firestore
    .document("chats/{roomId}/messages/{messageId}")
    .onCreate(async (snap, context) => {
        const messageData = snap.data() as MessageData;
        const { roomId } = context.params;
        const senderId = messageData.senderId;

        // Get chat room to find recipient
        const chatDoc = await db.collection("chats").doc(roomId).get();
        if (!chatDoc.exists) {
            console.log("Chat room not found:", roomId);
            return null;
        }

        const chatData = chatDoc.data() as ChatRoomData;
        const recipientId = chatData.participants.find((p) => p !== senderId);
        if (!recipientId) {
            console.log("No recipient found");
            return null;
        }

        // Get recipient's notification settings
        const recipientData = await getUserNotificationData(recipientId);
        if (!recipientData.token) {
            console.log("Recipient has no FCM token:", recipientId);
            return null;
        }

        if (!recipientData.settings?.enabled) {
            console.log("Recipient has notifications disabled:", recipientId);
            return null;
        }

        if (!recipientData.settings?.chatMessages) {
            console.log("Recipient has chat notifications disabled:", recipientId);
            return null;
        }

        // Get sender name
        const senderName = chatData.participantNames?.[senderId] || "Uživatel";

        // Send notification
        const truncatedText =
            messageData.text.length > 100
                ? messageData.text.substring(0, 100) + "..."
                : messageData.text;

        await sendPushNotification({
            token: recipientData.token,
            title: `Nová zpráva od ${senderName}`,
            body: truncatedText,
            data: {
                type: "chat_message",
                roomId: roomId,
                senderId: senderId,
            },
            channelId: "messages",
        });

        console.log(`Chat notification sent to ${recipientId} from ${senderId}`);
        return null;
    });
