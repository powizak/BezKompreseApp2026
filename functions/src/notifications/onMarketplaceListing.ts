import * as functions from "firebase-functions/v1";
import {
    sendPushNotification,
    getUsersWithNotificationEnabled,
    db,
} from "./sendNotification";

interface MarketplaceListingData {
    userId: string;
    userName: string;
    type: "wanted_car" | "wanted_parts" | "selling_parts" | "service";
    title: string;
    description: string;
    price?: number;
    isActive: boolean;
}

const LISTING_TYPE_LABELS: Record<string, string> = {
    wanted_car: "Sháním auto",
    wanted_parts: "Sháním díly",
    selling_parts: "Nabízím díly",
    service: "Nabízím servis",
};

/**
 * Triggered when a new marketplace listing is created
 * Sends push notification to all users with marketplaceNotifications enabled
 */
export const onMarketplaceListingCreated = functions.firestore
    .document("marketplace-listings/{listingId}")
    .onCreate(async (snap, context) => {
        const listingData = snap.data() as MarketplaceListingData;
        const { listingId } = context.params;

        // Only notify for active listings
        if (!listingData.isActive) {
            console.log("Listing is not active, skipping notification");
            return null;
        }

        // Get all users with marketplace notifications enabled
        const usersToNotify = await getUsersWithNotificationEnabled("marketplaceNotifications");

        // Filter out the user who created the listing
        const recipients = usersToNotify.filter((u) => u.uid !== listingData.userId);

        if (recipients.length === 0) {
            console.log("No users to notify for marketplace listing");
            return null;
        }

        const typeLabel = LISTING_TYPE_LABELS[listingData.type] || "Nový inzerát";
        const priceText = listingData.price ? ` - ${listingData.price.toLocaleString()} Kč` : "";

        // Send notifications to all recipients
        const notifications = recipients.map((user) =>
            sendPushNotification({
                token: user.token,
                title: `${typeLabel}: ${listingData.title}`,
                body: `${listingData.userName}${priceText}`,
                data: {
                    type: "marketplace_listing",
                    listingId: listingId,
                    listingType: listingData.type,
                },
                channelId: "marketplace",
                quietHours: user.settings?.quietHours,
            })
        );

        await Promise.all(notifications);
        console.log(`Marketplace notification sent to ${recipients.length} users for listing ${listingId}`);
        return null;
    });

/**
 * Triggered when a car is marked for sale (forSale = true)
 * Sends push notification to all users with marketplaceNotifications enabled
 */
export const onCarForSale = functions.firestore
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
        const ownerDoc = await db.collection("users").doc(afterData.ownerId).get();
        const ownerName = ownerDoc.exists ? ownerDoc.data()?.displayName || "Uživatel" : "Uživatel";

        // Get all users with marketplace notifications enabled
        const usersToNotify = await getUsersWithNotificationEnabled("marketplaceNotifications");

        // Filter out the owner
        const recipients = usersToNotify.filter((u) => u.uid !== afterData.ownerId);

        if (recipients.length === 0) {
            console.log("No users to notify for car for sale");
            return null;
        }

        const priceText = afterData.salePrice ? ` za ${afterData.salePrice.toLocaleString()} Kč` : "";

        // Send notifications to all recipients
        const notifications = recipients.map((user) =>
            sendPushNotification({
                token: user.token,
                title: `Auto na prodej: ${afterData.name}`,
                body: `${ownerName} prodává ${afterData.make} ${afterData.model}${priceText}`,
                data: {
                    type: "car_for_sale",
                    carId: carId,
                },
                channelId: "marketplace",
                quietHours: user.settings?.quietHours,
            })
        );

        await Promise.all(notifications);
        console.log(`Car for sale notification sent to ${recipients.length} users for car ${carId}`);
        return null;
    });
