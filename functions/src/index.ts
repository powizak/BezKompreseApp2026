/**
 * Firebase Cloud Functions - Push Notifications
 * 
 * Triggers:
 * - onSosBeaconCreated: Notifies users about SOS beacons
 * - onEventCommentCreated: Notifies event participants about new comments
 * - onEventUpdated: Notifies participants about event changes
 * - onFriendAdded: Notifies users when added as friend
 * - onNewChatMessage: Notifies users about new chat messages
 * - onMarketplaceListingCreated: Notifies users about new marketplace listings
 * - onCarForSale: Notifies users when a car is marked for sale
 */

export { onSosBeaconCreated } from "./notifications/onSosBeacon";
export { onEventCommentCreated } from "./notifications/onEventComment";
export { onEventUpdated } from "./notifications/onEventUpdate";
export { onFriendAdded } from "./notifications/onFriendRequest";
export { checkVehicleReminders } from "./notifications/onVehicleReminderCheck";
export { onNewChatMessage } from "./notifications/onNewChatMessage";
export { onMarketplaceListingCreated, onCarForSale } from "./notifications/onMarketplaceListing";
