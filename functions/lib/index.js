"use strict";
/**
 * Firebase Cloud Functions - Push Notifications
 *
 * Triggers:
 * - onSosBeaconCreated: Notifies users about SOS beacons
 * - onEventCommentCreated: Notifies event participants about new comments
 * - onEventUpdated: Notifies participants about event changes
 * - onFriendAdded: Notifies users when added as friend
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.onFriendAdded = exports.onEventUpdated = exports.onEventCommentCreated = exports.onSosBeaconCreated = void 0;
var onSosBeacon_1 = require("./notifications/onSosBeacon");
Object.defineProperty(exports, "onSosBeaconCreated", { enumerable: true, get: function () { return onSosBeacon_1.onSosBeaconCreated; } });
var onEventComment_1 = require("./notifications/onEventComment");
Object.defineProperty(exports, "onEventCommentCreated", { enumerable: true, get: function () { return onEventComment_1.onEventCommentCreated; } });
var onEventUpdate_1 = require("./notifications/onEventUpdate");
Object.defineProperty(exports, "onEventUpdated", { enumerable: true, get: function () { return onEventUpdate_1.onEventUpdated; } });
var onFriendRequest_1 = require("./notifications/onFriendRequest");
Object.defineProperty(exports, "onFriendAdded", { enumerable: true, get: function () { return onFriendRequest_1.onFriendAdded; } });
//# sourceMappingURL=index.js.map