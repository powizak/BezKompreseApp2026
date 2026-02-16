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
exports.onNewChatMessage = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const sendNotification_1 = require("./sendNotification");
/**
 * Triggered when a new message is created in a chat room
 * Sends a push notification to the recipient
 */
exports.onNewChatMessage = functions.firestore
    .document("chats/{roomId}/messages/{messageId}")
    .onCreate(async (snap, context) => {
    const messageData = snap.data();
    const { roomId } = context.params;
    const senderId = messageData.senderId;
    // Get chat room to find recipient
    const chatDoc = await sendNotification_1.db.collection("chats").doc(roomId).get();
    if (!chatDoc.exists) {
        console.log("Chat room not found:", roomId);
        return null;
    }
    const chatData = chatDoc.data();
    const recipientId = chatData.participants.find((p) => p !== senderId);
    if (!recipientId) {
        console.log("No recipient found");
        return null;
    }
    // Get recipient's notification settings
    const recipientData = await (0, sendNotification_1.getUserNotificationData)(recipientId);
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
    const truncatedText = messageData.text.length > 100
        ? messageData.text.substring(0, 100) + "..."
        : messageData.text;
    await (0, sendNotification_1.sendPushNotification)({
        token: recipientData.token,
        title: `Nová zpráva od ${senderName}`,
        body: truncatedText,
        data: {
            type: "chat_message",
            roomId: roomId,
            senderId: senderId,
        },
        channelId: "messages",
        quietHours: recipientData.settings?.quietHours,
    });
    console.log(`Chat notification sent to ${recipientId} from ${senderId}`);
    return null;
});
//# sourceMappingURL=onNewChatMessage.js.map