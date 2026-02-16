/**
 * Scheduled Cloud Function to check vehicle reminders and send notifications
 * Runs daily at 9:00 AM Prague time
 * Handles all reminder types: STK, first aid kit, highway vignette, liability insurance
 * Also handles service reminders from service records (nextServiceDate, nextServiceMileage)
 */
import * as functions from "firebase-functions";
import { sendPushNotification, db } from "./sendNotification";

// Reminder configuration matching frontend types
interface VehicleReminder {
    type: "stk" | "first_aid_kit" | "highway_vignette" | "liability_insurance";
    expirationDate: string;
    notifyEnabled: boolean;
}

interface Car {
    id: string;
    ownerId: string;
    name: string;
    make: string;
    model: string;
    reminders?: VehicleReminder[];
    currentMileage?: number;
}

interface ServiceRecord {
    id: string;
    carId: string;
    ownerId: string;
    title: string;
    nextServiceMileage?: number;
    nextServiceDate?: string;
    lastServiceNotificationSent?: string; // ISO date — cool-off tracking
}

const REMINDER_CONFIG: Record<string, {
    label: string;
    warningDays: number[];
}> = {
    stk: { label: "Platnost STK", warningDays: [90, 30] },
    first_aid_kit: { label: "Lékárnička", warningDays: [30] },
    highway_vignette: { label: "Dálniční známka", warningDays: [30] },
    liability_insurance: { label: "Povinné ručení", warningDays: [60] }
};

const SERVICE_WARNING_DAYS = [7, 3, 1]; // Days before service to notify
const SERVICE_WARNING_MILEAGE = [500, 200]; // Km before service mileage to notify
const SERVICE_OVERDUE_COOLOFF_DAYS = 7; // Days between repeated overdue notifications

/**
 * Check if we should send an overdue notification based on cool-off period.
 * Returns true if never sent before or if enough days have passed since last notification.
 */
function shouldSendOverdueNotification(service: ServiceRecord, now: Date): boolean {
    if (!service.lastServiceNotificationSent) return true;
    const lastSent = new Date(service.lastServiceNotificationSent);
    const daysSince = Math.ceil((now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24));
    return daysSince >= SERVICE_OVERDUE_COOLOFF_DAYS;
}

/**
 * Check all vehicle reminders and send notifications for upcoming expirations
 * Single job for all reminder types to stay within free tier
 */
export const checkVehicleReminders = functions
    .region("europe-west1")
    .pubsub.schedule("0 9 * * *")     // Every day at 9:00 AM
    .timeZone("Europe/Prague")
    .onRun(async () => {
        console.log("Starting vehicle reminder check...");

        try {
            // Get all users with vehicleReminders enabled
            const usersSnapshot = await db.collection("users").get();
            const now = new Date();
            let notificationsSent = 0;

            for (const userDoc of usersSnapshot.docs) {
                const userData = userDoc.data();
                const userId = userDoc.id;

                // Skip if notifications disabled or vehicleReminders disabled
                if (!userData.notificationSettings?.enabled) continue;
                if (!userData.notificationSettings?.vehicleReminders) continue;
                if (!userData.fcmToken) continue;

                // Get user's cars with reminders
                const carsSnapshot = await db.collection("cars")
                    .where("ownerId", "==", userId)
                    .get();

                for (const carDoc of carsSnapshot.docs) {
                    const car = { id: carDoc.id, ...carDoc.data() } as Car;
                    if (!car.reminders?.length) continue;

                    for (const reminder of car.reminders) {
                        if (!reminder.notifyEnabled || !reminder.expirationDate) continue;

                        const expDate = new Date(reminder.expirationDate);
                        const daysLeft = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        const config = REMINDER_CONFIG[reminder.type];

                        if (!config) continue;

                        // Check if today matches any warning day
                        if (config.warningDays.includes(daysLeft)) {
                            const title = `${config.label} vyprší za ${daysLeft} dní`;
                            const body = `${car.name} (${car.make} ${car.model}) - ${config.label} vyprší ${expDate.toLocaleDateString("cs-CZ")}`;

                            const success = await sendPushNotification({
                                token: userData.fcmToken,
                                title,
                                body,
                                data: {
                                    type: "vehicle_reminder",
                                    carId: car.id,
                                    reminderType: reminder.type
                                },
                                channelId: "reminders",
                                quietHours: userData.notificationSettings?.quietHours
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

                            await sendPushNotification({
                                token: userData.fcmToken,
                                title,
                                body,
                                data: {
                                    type: "vehicle_reminder",
                                    carId: car.id,
                                    reminderType: reminder.type
                                },
                                channelId: "reminders",
                                quietHours: userData.notificationSettings?.quietHours
                            });
                            notificationsSent++;
                        }
                    }

                    // === SERVICE REMINDERS ===
                    // Check service records for this car
                    const serviceSnapshot = await db.collection("service-records")
                        .where("carId", "==", car.id)
                        .get();

                    for (const serviceDoc of serviceSnapshot.docs) {
                        const service = { id: serviceDoc.id, ...serviceDoc.data() } as ServiceRecord;
                        let isOverdue = false;

                        // Check date-based service reminders
                        if (service.nextServiceDate) {
                            const serviceDate = new Date(service.nextServiceDate);
                            const daysUntilService = Math.ceil((serviceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                            if (daysUntilService <= 0) {
                                // OVERDUE — send one notification, then cool off
                                isOverdue = true;
                                if (shouldSendOverdueNotification(service, now)) {
                                    const title = "🔧 Servis po termínu!";
                                    const body = `${car.name}: ${service.title} — termín vypršel ${serviceDate.toLocaleDateString("cs-CZ")}`;

                                    const success = await sendPushNotification({
                                        token: userData.fcmToken,
                                        title,
                                        body,
                                        data: {
                                            type: "service_reminder",
                                            carId: car.id,
                                            serviceId: service.id
                                        },
                                        channelId: "reminders",
                                        quietHours: userData.notificationSettings?.quietHours
                                    });

                                    if (success) {
                                        notificationsSent++;
                                        await serviceDoc.ref.update({ lastServiceNotificationSent: now.toISOString() });
                                        console.log(`Sent overdue service reminder for ${car.name}: ${service.title} (${Math.abs(daysUntilService)} days overdue)`);
                                    }
                                }
                            } else if (SERVICE_WARNING_DAYS.includes(daysUntilService)) {
                                const title = `🔧 Servis za ${daysUntilService} ${daysUntilService === 1 ? 'den' : daysUntilService < 5 ? 'dny' : 'dní'}`;
                                const body = `${car.name}: ${service.title} - ${serviceDate.toLocaleDateString("cs-CZ")}`;

                                const success = await sendPushNotification({
                                    token: userData.fcmToken,
                                    title,
                                    body,
                                    data: {
                                        type: "service_reminder",
                                        carId: car.id,
                                        serviceId: service.id
                                    },
                                    channelId: "reminders",
                                    quietHours: userData.notificationSettings?.quietHours
                                });

                                if (success) {
                                    notificationsSent++;
                                    console.log(`Sent service reminder for ${car.name}: ${service.title} (${daysUntilService} days)`);
                                }
                            }
                        }

                        // Check mileage-based service reminders (skip if already handled as date-overdue)
                        if (!isOverdue && service.nextServiceMileage && car.currentMileage) {
                            const kmUntilService = service.nextServiceMileage - car.currentMileage;

                            if (kmUntilService <= 0) {
                                // OVERDUE by mileage — cool off logic
                                if (shouldSendOverdueNotification(service, now)) {
                                    const title = "🔧 Servis po termínu!";
                                    const body = `${car.name}: ${service.title} — nájezd překročen o ${Math.abs(kmUntilService)} km`;

                                    const success = await sendPushNotification({
                                        token: userData.fcmToken,
                                        title,
                                        body,
                                        data: {
                                            type: "service_reminder",
                                            carId: car.id,
                                            serviceId: service.id
                                        },
                                        channelId: "reminders",
                                        quietHours: userData.notificationSettings?.quietHours
                                    });

                                    if (success) {
                                        notificationsSent++;
                                        await serviceDoc.ref.update({ lastServiceNotificationSent: now.toISOString() });
                                        console.log(`Sent overdue mileage reminder for ${car.name}: ${service.title} (${Math.abs(kmUntilService)} km over)`);
                                    }
                                }
                            } else {
                                // Normal mileage threshold warnings
                                for (let i = 0; i < SERVICE_WARNING_MILEAGE.length; i++) {
                                    const warningKm = SERVICE_WARNING_MILEAGE[i];
                                    const nextThreshold = SERVICE_WARNING_MILEAGE[i + 1] ?? 0;
                                    if (kmUntilService <= warningKm && kmUntilService > nextThreshold) {
                                        const title = `🔧 Servis za ${kmUntilService} km`;
                                        const body = `${car.name}: ${service.title} - při ${service.nextServiceMileage.toLocaleString()} km`;

                                        const success = await sendPushNotification({
                                            token: userData.fcmToken,
                                            title,
                                            body,
                                            data: {
                                                type: "service_reminder",
                                                carId: car.id,
                                                serviceId: service.id
                                            },
                                            channelId: "reminders",
                                            quietHours: userData.notificationSettings?.quietHours
                                        });

                                        if (success) {
                                            notificationsSent++;
                                            console.log(`Sent service reminder for ${car.name}: ${service.title} (${kmUntilService} km)`);
                                        }
                                        break; // Only send one mileage notification
                                    }
                                }
                            }
                        }
                    }
                }
            }

            console.log(`Vehicle & service reminder check complete. Sent ${notificationsSent} notifications.`);
            return null;
        } catch (error) {
            console.error("Error checking vehicle reminders:", error);
            return null;
        }
    });
