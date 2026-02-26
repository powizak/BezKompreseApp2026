import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { NotificationActionPerformedEvent, NotificationReceivedEvent } from '@capacitor-firebase/messaging';

export default function PushNotificationHandler() {
    const navigate = useNavigate();

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        console.log('[PushNotificationHandler] Initializing listeners...');

        const handleRoute = (data: Record<string, string>) => {
            let url = data.url;

            if (data.type) {
                switch (data.type) {
                    case 'new_event':
                    case 'event_update':
                    case 'event_comment':
                    case 'event_participation':
                        if (data.eventId) url = `/events/${data.eventId}`;
                        break;
                    case 'friend_request':
                    case 'badge_awarded':
                    case 'beacon_status_change':
                        if (data.userId) url = `/profile/${data.userId}`;
                        break;
                    case 'chat_message':
                        url = '/chats';
                        break;
                    case 'marketplace_listing':
                        if (data.listingId) url = `/market/${data.listingId}`;
                        break;
                    case 'vehicle_reminder':
                        if (data.carId) url = `/garage/${data.carId}/service`;
                        break;
                    case 'sos_beacon':
                        url = '/tracker';
                        break;
                }
            }

            if (url) {
                console.log('[PushNotificationHandler] Navigating to:', url);
                navigate(url);
            }
        };

        // 1. Handle clicks on standard Push Notifications (when app was in background)
        const pushActionListener = FirebaseMessaging.addListener(
            'notificationActionPerformed',
            (event: NotificationActionPerformedEvent) => {
                const data = (event.notification.data as Record<string, string>) || {};
                console.log('[PushNotificationHandler] Push Action performed:', data);
                handleRoute(data);
            }
        );

        // 2. Handle incoming Push Notifications while app is OPEN (foreground)
        const pushReceivedListener = FirebaseMessaging.addListener(
            'notificationReceived',
            (event: NotificationReceivedEvent) => {
                console.log('[PushNotificationHandler] Push received in foreground:', event.notification);

                // Android/Capacitor FCM suppresses banners when app is active.
                // We dispatch a Local Notification to ensure the user gets a heads-up banner.
                LocalNotifications.schedule({
                    notifications: [
                        {
                            id: new Date().getTime(), // generate guaranteed unique ID
                            title: event.notification.title || 'Bez Komprese',
                            body: event.notification.body || '',
                            extra: event.notification.data, // store the routing payload here
                        }
                    ]
                });
            }
        );

        // 3. Handle clicks on our simulated Local Notifications (from foreground)
        const localActionListener = LocalNotifications.addListener(
            'localNotificationActionPerformed',
            (event) => {
                const data = (event.notification.extra as Record<string, string>) || {};
                console.log('[PushNotificationHandler] Local Action performed:', data);
                handleRoute(data);
            }
        );

        return () => {
            // Cleanup
            pushActionListener.then(l => l.remove()).catch(e => console.error('Error removing push action listener', e));
            pushReceivedListener.then(l => l.remove()).catch(e => console.error('Error removing push receive listener', e));
            localActionListener.then(l => l.remove()).catch(e => console.error('Error removing local action listener', e));
        };
    }, [navigate]);

    return null;
}
