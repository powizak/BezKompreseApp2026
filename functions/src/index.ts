/**
 * Firebase Cloud Functions - Push Notifications
 * 
 * Triggers:
 * - onSosBeaconCreated: Notifies users about SOS beacons
 * - onEventCommentCreated: Notifies event participants about new comments
 * - onEventUpdated: Notifies participants about event changes
 * - onFriendAdded: Notifies users when added as friend
 */

export { onSosBeaconCreated } from "./notifications/onSosBeacon";
export { onEventCommentCreated } from "./notifications/onEventComment";
export { onEventUpdated } from "./notifications/onEventUpdate";
export { onFriendAdded } from "./notifications/onFriendRequest";
