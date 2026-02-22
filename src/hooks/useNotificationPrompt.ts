import { useState, useEffect, useCallback } from 'react';
import { Effect } from 'effect';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { NotificationService, NotificationServiceLive, type NotificationPermissionStatus } from '../services/NotificationService';
import type { UserProfile } from '../types';

const DISMISS_KEY = 'notification_prompt_dismissed_at';
const COOLDOWN_DAYS = 7;

interface UseNotificationPromptResult {
    showPrompt: boolean;
    permissionStatus: NotificationPermissionStatus;
    isProcessing: boolean;
    handleAccept: () => Promise<void>;
    handleDismiss: () => void;
}

function getNotificationService() {
    return Effect.runSync(
        Effect.gen(function* (_) {
            return yield* _(NotificationService);
        }).pipe(Effect.provide(NotificationServiceLive))
    );
}

/**
 * Hook that manages the notification permission prompt lifecycle:
 * 1. Shows primer dialog if user hasn't registered FCM and hasn't dismissed recently
 * 2. On accept: requests OS permission → registers FCM token
 * 3. On dismiss: stores timestamp, cooldown for 7 days
 * 4. On app resume (native): silently re-checks permission state
 */
export function useNotificationPrompt(user: UserProfile | null): UseNotificationPromptResult {
    const [showPrompt, setShowPrompt] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>('prompt');
    const [isProcessing, setIsProcessing] = useState(false);

    const service = getNotificationService();

    // Check if we should show the prompt
    useEffect(() => {
        if (!user) {
            setShowPrompt(false);
            return;
        }

        const checkShouldShow = async () => {
            try {
                // 1. Check current permission status
                const status = await Effect.runPromise(service.checkPermission);
                setPermissionStatus(status);

                // Already granted → silently ensure registration, don't show prompt
                if (status === 'granted') {
                    if (!user.fcmToken) {
                        await silentRegister(user.uid);
                    }
                    setShowPrompt(false);
                    return;
                }

                // Denied → can't show OS prompt, don't show primer
                if (status === 'denied') {
                    setShowPrompt(false);
                    return;
                }

                // Status is 'prompt' → check if user already has token (shouldn't happen, but guard)
                if (user.fcmToken) {
                    setShowPrompt(false);
                    return;
                }

                // Check cooldown
                const dismissedAt = localStorage.getItem(DISMISS_KEY);
                if (dismissedAt) {
                    const dismissDate = new Date(dismissedAt);
                    const now = new Date();
                    const diffDays = (now.getTime() - dismissDate.getTime()) / (1000 * 60 * 60 * 24);
                    if (diffDays < COOLDOWN_DAYS) {
                        setShowPrompt(false);
                        return;
                    }
                }

                // All checks passed → show primer
                setShowPrompt(true);
            } catch (e) {
                console.error('[NotificationPrompt] Error checking state:', e);
                setShowPrompt(false);
            }
        };

        // Small delay so the app has time to settle after login
        const timer = setTimeout(checkShouldShow, 2000);
        return () => clearTimeout(timer);
    }, [user?.uid, user?.fcmToken]);

    // App resume listener (native only) - re-check permission state
    useEffect(() => {
        if (!user || !Capacitor.isNativePlatform()) return;

        const listener = App.addListener('appStateChange', async ({ isActive }) => {
            if (!isActive) return;

            try {
                const status = await Effect.runPromise(service.checkPermission);
                setPermissionStatus(status);

                if (status === 'granted' && !user.fcmToken) {
                    // User may have enabled notifications in system settings
                    await silentRegister(user.uid);
                } else if (status === 'denied' && user.fcmToken) {
                    // User revoked permissions in system settings → clean up
                    await Effect.runPromise(service.unregisterDevice(user.uid));
                    console.log('[NotificationPrompt] Permission revoked, FCM token removed');
                }
            } catch (e) {
                console.error('[NotificationPrompt] App resume check failed:', e);
            }
        });

        return () => {
            listener.then(l => l.remove());
        };
    }, [user?.uid, user?.fcmToken]);

    const silentRegister = async (userId: string) => {
        try {
            await Effect.runPromise(service.registerDevice(userId));
            console.log('[NotificationPrompt] FCM token silently registered');
        } catch (e) {
            console.error('[NotificationPrompt] Silent registration failed:', e);
        }
    };

    const handleAccept = useCallback(async () => {
        if (!user) return;
        setIsProcessing(true);

        try {
            const status = await Effect.runPromise(service.requestPermission);
            setPermissionStatus(status);

            if (status === 'granted') {
                await Effect.runPromise(service.registerDevice(user.uid));
                console.log('[NotificationPrompt] Permission granted, device registered');
            }

            // Clear any dismiss timestamp
            localStorage.removeItem(DISMISS_KEY);
            setShowPrompt(false);
        } catch (e) {
            console.error('[NotificationPrompt] Accept flow failed:', e);
        } finally {
            setIsProcessing(false);
        }
    }, [user?.uid]);

    const handleDismiss = useCallback(() => {
        localStorage.setItem(DISMISS_KEY, new Date().toISOString());
        setShowPrompt(false);
    }, []);

    return { showPrompt, permissionStatus, isProcessing, handleAccept, handleDismiss };
}
