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
exports.onCarForSale = exports.onMarketplaceListingCreated = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const sendNotification_1 = require("./sendNotification");
const LISTING_TYPE_LABELS = {
    wanted_car: "Sháním auto",
    wanted_parts: "Sháním díly",
    selling_parts: "Nabízím díly",
    service: "Nabízím servis",
};
/**
 * Triggered when a new marketplace listing is created
 * Sends push notification to all users with marketplaceNotifications enabled
 */
exports.onMarketplaceListingCreated = functions.firestore
    .document("marketplace-listings/{listingId}")
    .onCreate(async (snap, context) => {
    const listingData = snap.data();
    const { listingId } = context.params;
    // Only notify for active listings
    if (!listingData.isActive) {
        console.log("Listing is not active, skipping notification");
        return null;
    }
    // Get all users with marketplace notifications enabled
    const usersToNotify = await (0, sendNotification_1.getUsersWithNotificationEnabled)("marketplaceNotifications");
    // Filter out the user who created the listing
    const recipients = usersToNotify.filter((u) => u.uid !== listingData.userId);
    if (recipients.length === 0) {
        console.log("No users to notify for marketplace listing");
        return null;
    }
    const typeLabel = LISTING_TYPE_LABELS[listingData.type] || "Nový inzerát";
    const priceText = listingData.price ? ` - ${listingData.price.toLocaleString()} Kč` : "";
    // Send notifications to all recipients
    const notifications = recipients.map((user) => (0, sendNotification_1.sendPushNotification)({
        token: user.token,
        title: `${typeLabel}: ${listingData.title}`,
        body: `${listingData.userName}${priceText}`,
        data: {
            type: "marketplace_listing",
            listingId: listingId,
            listingType: listingData.type,
        },
        channelId: "marketplace",
    }));
    await Promise.all(notifications);
    console.log(`Marketplace notification sent to ${recipients.length} users for listing ${listingId}`);
    return null;
});
/**
 * Triggered when a car is marked for sale (forSale = true)
 * Sends push notification to all users with marketplaceNotifications enabled
 */
exports.onCarForSale = functions.firestore
    .document("cars/{carId}")
    .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const { carId } = context.params;
    // Only trigger when forSale changes from false/undefined to true
    if (beforeData?.forSale === true || afterData?.forSale !== true) {
        return null;
    }
    // Get owner info
    const ownerDoc = await sendNotification_1.db.collection("users").doc(afterData.ownerId).get();
    const ownerName = ownerDoc.exists ? ownerDoc.data()?.displayName || "Uživatel" : "Uživatel";
    // Get all users with marketplace notifications enabled
    const usersToNotify = await (0, sendNotification_1.getUsersWithNotificationEnabled)("marketplaceNotifications");
    // Filter out the owner
    const recipients = usersToNotify.filter((u) => u.uid !== afterData.ownerId);
    if (recipients.length === 0) {
        console.log("No users to notify for car for sale");
        return null;
    }
    const priceText = afterData.salePrice ? ` za ${afterData.salePrice.toLocaleString()} Kč` : "";
    // Send notifications to all recipients
    const notifications = recipients.map((user) => (0, sendNotification_1.sendPushNotification)({
        token: user.token,
        title: `Auto na prodej: ${afterData.name}`,
        body: `${ownerName} prodává ${afterData.make} ${afterData.model}${priceText}`,
        data: {
            type: "car_for_sale",
            carId: carId,
        },
        channelId: "marketplace",
    }));
    await Promise.all(notifications);
    console.log(`Car for sale notification sent to ${recipients.length} users for car ${carId}`);
    return null;
});
//# sourceMappingURL=onMarketplaceListing.js.map