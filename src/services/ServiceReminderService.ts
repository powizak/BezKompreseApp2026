import { Effect } from 'effect';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { DataService, DataServiceLive } from './DataService';
import { analyzeUpcomingServices } from '../utils/servicePrediction';
import type { UserProfile } from '../types';

export class ServiceReminderService {
    // Generate a consistent ID to avoid conflicts
    private static generateNotificationId(recordId: string): number {
        let hash = 0;
        for (let i = 0; i < recordId.length; i++) {
            const char = recordId.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash) % 2147483647;
    }

    static async checkAndNotify(user: UserProfile) {
        if (!Capacitor.isNativePlatform()) return; // Local Notifications are native only

        // Check user settings. Default is true.
        if (user.notificationSettings?.enabled === false) return;
        if (user.notificationSettings?.vehicleReminders === false) return;

        try {
            // Setup DataService
            const dataService = Effect.runSync(Effect.gen(function* (_) {
                return yield* _(DataService);
            }).pipe(Effect.provide(DataServiceLive)));

            // Fetch user's cars
            const cars = await Effect.runPromise(dataService.getMyCars(user.uid));
            if (!cars || cars.length === 0) return;

            // Request permission
            try {
                const permStatus = await LocalNotifications.checkPermissions();
                if (permStatus.display !== 'granted') {
                    await LocalNotifications.requestPermissions();
                }
            } catch (e) { /* ignore */ }

            for (const car of cars) {
                const serviceRecords = await Effect.runPromise(dataService.getServiceRecords(car.id, user.uid));
                const fuelRecords = await Effect.runPromise(dataService.getFuelRecords(car.id));

                const predictions = analyzeUpcomingServices(car, serviceRecords, fuelRecords);

                for (const pred of predictions) {
                    if (!pred.predictedDate || pred.daysRemaining === null) continue;

                    const isUrgent = pred.isOverdue || pred.daysRemaining <= 14 || (pred.mileageRemaining !== null && pred.mileageRemaining <= 1000);

                    if (isUrgent) {
                        const record = serviceRecords.find(r => r.id === pred.recordId);
                        if (!record) continue;

                        const lastNotified = record.lastServiceNotificationSent ? new Date(record.lastServiceNotificationSent) : null;
                        const now = new Date();

                        // Notify only once every 7 days per record
                        if (!lastNotified || (now.getTime() - lastNotified.getTime() > 7 * 24 * 60 * 60 * 1000)) {
                            const notifId = this.generateNotificationId(pred.recordId);
                            let bodyText = '';
                            if (pred.isOverdue) {
                                bodyText = `Servis je pravděpodobně po termínu (${record.title}). Očekávaný termín byl ${pred.predictedDate.toLocaleDateString('cs-CZ')}.`;
                            } else {
                                bodyText = `Blíží se termín (${record.title}). Očekávaný čas: za ${pred.daysRemaining} dní.`;
                            }

                            try {
                                await LocalNotifications.schedule({
                                    notifications: [{
                                        title: `Předpokládaný servis: ${car.name}`,
                                        body: bodyText,
                                        id: notifId,
                                        schedule: { at: new Date(Date.now() + 1000 * 5) }, // In 5 seconds
                                        extra: { type: 'vehicle_reminder', carId: car.id }
                                    }]
                                });

                                // Update DB flag to avoid spamming
                                await Effect.runPromise(dataService.updateServiceRecord(record.id, {
                                    lastServiceNotificationSent: now.toISOString()
                                }));
                            } catch (e) {
                                console.warn('Local notification scheduling failed', e);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('ServiceReminderService error:', error);
        }
    }
}
