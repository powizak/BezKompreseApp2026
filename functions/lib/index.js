"use strict";
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
 * - checkVehicleReminders: Scheduled check for vehicle reminders (STK, service, etc.)
 * - onNewEventCreated: Notifies users about new events based on preferences
 * - onBadgeAwarded: Notifies users when they earn a new badge
 * - onBeaconStatusChange: Notifies about SOS beacon status changes
 * - onEventParticipation: Notifies organizers about participant changes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.onEventParticipation = exports.onBeaconStatusChange = exports.onBadgeAwarded = exports.onNewEventCreated = exports.onCarForSale = exports.onMarketplaceListingCreated = exports.onNewChatMessage = exports.checkVehicleReminders = exports.onFriendAdded = exports.onEventUpdated = exports.onEventCommentCreated = exports.onSosBeaconCreated = void 0;
var onSosBeacon_1 = require("./notifications/onSosBeacon");
Object.defineProperty(exports, "onSosBeaconCreated", { enumerable: true, get: function () { return onSosBeacon_1.onSosBeaconCreated; } });
var onEventComment_1 = require("./notifications/onEventComment");
Object.defineProperty(exports, "onEventCommentCreated", { enumerable: true, get: function () { return onEventComment_1.onEventCommentCreated; } });
var onEventUpdate_1 = require("./notifications/onEventUpdate");
Object.defineProperty(exports, "onEventUpdated", { enumerable: true, get: function () { return onEventUpdate_1.onEventUpdated; } });
var onFriendRequest_1 = require("./notifications/onFriendRequest");
Object.defineProperty(exports, "onFriendAdded", { enumerable: true, get: function () { return onFriendRequest_1.onFriendAdded; } });
var onVehicleReminderCheck_1 = require("./notifications/onVehicleReminderCheck");
Object.defineProperty(exports, "checkVehicleReminders", { enumerable: true, get: function () { return onVehicleReminderCheck_1.checkVehicleReminders; } });
var onNewChatMessage_1 = require("./notifications/onNewChatMessage");
Object.defineProperty(exports, "onNewChatMessage", { enumerable: true, get: function () { return onNewChatMessage_1.onNewChatMessage; } });
var onMarketplaceListing_1 = require("./notifications/onMarketplaceListing");
Object.defineProperty(exports, "onMarketplaceListingCreated", { enumerable: true, get: function () { return onMarketplaceListing_1.onMarketplaceListingCreated; } });
Object.defineProperty(exports, "onCarForSale", { enumerable: true, get: function () { return onMarketplaceListing_1.onCarForSale; } });
var onNewEvent_1 = require("./notifications/onNewEvent");
Object.defineProperty(exports, "onNewEventCreated", { enumerable: true, get: function () { return onNewEvent_1.onNewEventCreated; } });
var onBadgeAwarded_1 = require("./notifications/onBadgeAwarded");
Object.defineProperty(exports, "onBadgeAwarded", { enumerable: true, get: function () { return onBadgeAwarded_1.onBadgeAwarded; } });
var onBeaconStatusChange_1 = require("./notifications/onBeaconStatusChange");
Object.defineProperty(exports, "onBeaconStatusChange", { enumerable: true, get: function () { return onBeaconStatusChange_1.onBeaconStatusChange; } });
var onEventParticipation_1 = require("./notifications/onEventParticipation");
Object.defineProperty(exports, "onEventParticipation", { enumerable: true, get: function () { return onEventParticipation_1.onEventParticipation; } });
//# sourceMappingURL=index.js.map