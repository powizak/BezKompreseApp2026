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
exports.checkVehicleReminders = void 0;
/**
 * Scheduled Cloud Function to check vehicle reminders and send notifications
 * Runs daily at 9:00 AM Prague time
 * Handles all reminder types: STK, first aid kit, highway vignette, liability insurance
 */
const functions = __importStar(require("firebase-functions"));
const sendNotification_1 = require("./sendNotification");
const REMINDER_CONFIG = {
    stk: { label: "Platnost STK", warningDays: [90, 30] },
    first_aid_kit: { label: "Lékárnička", warningDays: [30] },
    highway_vignette: { label: "Dálniční známka", warningDays: [30] },
    liability_insurance: { label: "Povinné ručení", warningDays: [60] }
};
/**
 * Check all vehicle reminders and send notifications for upcoming expirations
 * Single job for all reminder types to stay within free tier
 */
exports.checkVehicleReminders = functions
    .region("europe-west1")
    .pubsub.schedule("0 9 * * *") // Every day at 9:00 AM
    .timeZone("Europe/Prague")
    .onRun(async () => {
    console.log("Starting vehicle reminder check...");
    try {
        // Get all users with vehicleReminders enabled
        const usersSnapshot = await sendNotification_1.db.collection("users").get();
        const now = new Date();
        let notificationsSent = 0;
        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const userId = userDoc.id;
            // Skip if notifications disabled or vehicleReminders disabled
            if (!userData.notificationSettings?.enabled)
                continue;
            if (!userData.notificationSettings?.vehicleReminders)
                continue;
            if (!userData.fcmToken)
                continue;
            // Get user's cars with reminders
            const carsSnapshot = await sendNotification_1.db.collection("cars")
                .where("ownerId", "==", userId)
                .get();
            for (const carDoc of carsSnapshot.docs) {
                const car = { id: carDoc.id, ...carDoc.data() };
                if (!car.reminders?.length)
                    continue;
                for (const reminder of car.reminders) {
                    if (!reminder.notifyEnabled || !reminder.expirationDate)
                        continue;
                    const expDate = new Date(reminder.expirationDate);
                    const daysLeft = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    const config = REMINDER_CONFIG[reminder.type];
                    if (!config)
                        continue;
                    // Check if today matches any warning day
                    if (config.warningDays.includes(daysLeft)) {
                        const title = `${config.label} vyprší za ${daysLeft} dní`;
                        const body = `${car.name} (${car.make} ${car.model}) - ${config.label} vyprší ${expDate.toLocaleDateString("cs-CZ")}`;
                        const success = await (0, sendNotification_1.sendPushNotification)({
                            token: userData.fcmToken,
                            title,
                            body,
                            data: {
                                type: "vehicle_reminder",
                                carId: car.id,
                                reminderType: reminder.type
                            },
                            channelId: "reminders"
                        });
                        if (success) {
                            notificationsSent++;
                            console.log(`Sent reminder for ${car.name}: ${config.label} (${daysLeft} days left)`);
                        }
                    }
                    // Also check for expired (0 or negative days)
                    if (daysLeft === 0) {
                        const title = `${config.label} vyprší dnes!`;
                        const body = `${car.name} (${car.make} ${car.model}) - ${config.label} vyprší dnes!`;
                        await (0, sendNotification_1.sendPushNotification)({
                            token: userData.fcmToken,
                            title,
                            body,
                            data: {
                                type: "vehicle_reminder",
                                carId: car.id,
                                reminderType: reminder.type
                            },
                            channelId: "reminders"
                        });
                        notificationsSent++;
                    }
                }
            }
        }
        console.log(`Vehicle reminder check complete. Sent ${notificationsSent} notifications.`);
        return null;
    }
    catch (error) {
        console.error("Error checking vehicle reminders:", error);
        return null;
    }
});
//# sourceMappingURL=onVehicleReminderCheck.js.map