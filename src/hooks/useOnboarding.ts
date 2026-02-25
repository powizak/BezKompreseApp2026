import { useState, useEffect, useCallback } from 'react';
import { Effect } from 'effect';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { NotificationService, NotificationServiceLive, type NotificationPermissionStatus } from '../services/NotificationService';
import type { UserProfile } from '../types';

const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';

interface UseOnboardingResult {
    showOnboarding: boolean;
    completeOnboarding: () => void;
    // We expose these specifically for the Notification step of the wizard
    permissionStatus: NotificationPermissionStatus;
    isProcessing: boolean;
    requestNotificationPermission: () => Promise<boolean>;
}

function getNotificationService() {
    return Effect.runSync(
        Effect.gen(function* (_) {
            return yield* _(NotificationService);
        }).pipe(Effect.provide(NotificationServiceLive))
    );
}

export function useOnboarding(user: UserProfile | null): UseOnboardingResult {
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>('prompt');
    const [isProcessing, setIsProcessing] = useState(false);

    const service = getNotificationService();

    // 1. Check if onboarding should be shown
    useEffect(() => {
        const checkShouldShow = async () => {
            // Only show onboarding if the user is completely loaded (if required)
            // However, user can be null if they just opened the app. 
            // On first load, `user` might be null while Firebase initializes. We should wait or show it immediately.
            // Best to wait for auth state to resolve, whether logged in or out.

            // Wait for app mount checks
            const completed = localStorage.getItem(ONBOARDING_COMPLETED_KEY);

            // Also, if the user already has FCM token, they definitely did this before (or the old prompt)
            if (completed || user?.fcmToken) {
                setShowOnboarding(false);

                // If they are logged in and skipped the prompt, we still want to grab their token
                // if they've granted OS permission elsewhere.
                if (user && !user.fcmToken) {
                    const status = await Effect.runPromise(service.checkPermission);
                    if (status === 'granted') {
                        await silentRegister(user.uid);
                    }
                }
                return;
            }

            // Check OS permission just to know the UI state
            try {
                const status = await Effect.runPromise(service.checkPermission);
                setPermissionStatus(status);
            } catch (e) {
                console.error('[Onboarding] Error checking state:', e);
            }

            setShowOnboarding(true);
        };

        // Small delay so the app has time to settle 
        const timer = setTimeout(checkShouldShow, 1000);
        return () => clearTimeout(timer);
    }, [user?.uid, user?.fcmToken]);

    // 2. App resume listener (native only) - re-check permission state and sync profile
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
            console.log('[Onboarding] FCM token silently registered');
        } catch (e) {
            console.error('[Onboarding] Silent registration failed:', e);
        }
    };

    const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
        setIsProcessing(true);
        try {
            const status = await Effect.runPromise(service.requestPermission);
            setPermissionStatus(status);

            // Register device if user is ALREADY logged in
            if (status === 'granted' && user) {
                await Effect.runPromise(service.registerDevice(user.uid));
                console.log('[Onboarding] Permission granted, device registered');
                return true;
            }

            // Return true if granted, so UI knows they clicked OK.
            return status === 'granted';
        } catch (e) {
            console.error('[Onboarding] Accept flow failed:', e);
            return false;
        } finally {
            setIsProcessing(false);
        }
    }, [user]);

    const completeOnboarding = useCallback(() => {
        localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
        setShowOnboarding(false);
    }, []);

    return {
        showOnboarding,
        completeOnboarding,
        permissionStatus,
        isProcessing,
        requestNotificationPermission
    };
}
