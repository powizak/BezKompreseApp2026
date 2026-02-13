import type { UserProfile, Car, ServiceRecord, FuelRecord } from '../types';
import type { UserBadge } from '../types/badges';
import { db } from '../config/firebase';
import { doc, getDoc, runTransaction } from 'firebase/firestore';

export class BadgeService {
    /**
     * Helper to get user profile if not provided
     */
    private static async getUserProfile(userId: string): Promise<UserProfile | null> {
        const snap = await getDoc(doc(db, "users", userId));
        return snap.exists() ? snap.data() as UserProfile : null;
    }

    /**
     * Checks if a user has earned any new badges based on their car data.
     * Should be called after saving/updating a car.
     */
    static async checkCarBadges(userId: string, cars: Car[], userSnapshot?: UserProfile): Promise<void> {
        const user = userSnapshot || await this.getUserProfile(userId);
        if (!user) return;

        const newBadges: string[] = [];

        // --- High Miler (300k km) ---
        if (cars.some(c => (c.currentMileage || 0) > 300000)) {
            newBadges.push('high_miler_300k');
        }

        // --- Centurion (100k km) ---
        if (cars.some(c => (c.currentMileage || 0) > 100000)) {
            newBadges.push('centurion_100k');
        }

        // --- Power User (220kW) ---
        // Note: 'power' in Car interface is just a number, assuming kW based on context
        if (cars.some(c => (c.power || 0) > 220)) {
            newBadges.push('power_user_220kw');
        }

        // --- Garage Keeper (3+ cars) ---
        // Filter for owned cars only if necessary, or just length
        if (cars.length >= 3) {
            newBadges.push('garage_keeper_3');
        }

        await this.awardBadges(userId, newBadges);
    }

    /**
     * Checks service-related badges.
     */
    static async checkServiceBadges(userId: string, serviceRecords: ServiceRecord[], userSnapshot?: UserProfile): Promise<void> {
        const user = userSnapshot || await this.getUserProfile(userId);
        if (!user) return;

        const newBadges: string[] = [];

        // --- Wrench Wizard (10 DIY records) ---
        // Strict check on "Doma" as per description
        const strictDiy = serviceRecords.filter(r => r.serviceProvider?.toLowerCase() === 'doma');

        if (strictDiy.length >= 10) {
            newBadges.push('wrench_wizard_10');
        }

        // --- Brakes Fixer ---
        const brakesDiy = serviceRecords.some(r =>
            r.category === 'brakes' && r.serviceProvider?.toLowerCase() === 'doma'
        );
        if (brakesDiy) {
            newBadges.push('brakes_fixer');
        }

        await this.awardBadges(userId, newBadges);
    }

    /**
     * Checks fuel-related badges.
     */
    /**
     * Checks fuel-related badges.
     */
    static async checkFuelBadges(userId: string, fuelRecords: FuelRecord[], userSnapshot?: UserProfile): Promise<void> {
        const user = userSnapshot || await this.getUserProfile(userId);
        if (!user) return;

        const newBadges: string[] = [];

        // --- Fuel Tracker (50 records) ---
        if (fuelRecords.length >= 50) {
            newBadges.push('fuel_tracker_50');
        }

        await this.awardBadges(userId, newBadges);
    }

    /**
     * Checks event-related badges.
     */
    static async checkEventBadges(userId: string, attendedEventsCount: number, userSnapshot?: UserProfile): Promise<void> {
        const user = userSnapshot || await this.getUserProfile(userId);
        if (!user) return;

        const newBadges: string[] = [];

        // --- Event Junkie (5 events) ---
        if (attendedEventsCount >= 5) {
            newBadges.push('event_junkie_5');
        }

        await this.awardBadges(userId, newBadges);
    }

    /**
     * Checks organizer badge.
     */
    static async checkOrganizerBadge(userId: string, userSnapshot?: UserProfile): Promise<void> {
        const user = userSnapshot || await this.getUserProfile(userId);
        if (!user) return;
        await this.awardBadges(userId, ['organizer']);
    }

    /**
     * Checks marketplace badges.
     */
    static async checkMarketplaceBadges(userId: string, listingCount: number, userSnapshot?: UserProfile): Promise<void> {
        const user = userSnapshot || await this.getUserProfile(userId);
        if (!user) return;

        // --- Content Creator (5 listings) ---
        if (listingCount >= 5) {
            await this.awardBadges(userId, ['content_creator_5']);
        }
    }

    /**
     * Checks profile/social badges.
     * Should be called on login or profile update.
     */
    static async checkProfileBadges(userId: string, userSnapshot?: UserProfile): Promise<void> {
        const user = userSnapshot || await this.getUserProfile(userId);
        if (!user) return;

        const newBadges: string[] = [];

        // --- Socialite (10 friends) ---
        if ((user.friends?.length || 0) >= 10) {
            newBadges.push('socialite_10');
        }

        await this.awardBadges(userId, newBadges);
    }

    static async checkRegistrationBadges(userId: string, registrationDate: Date, userSnapshot?: UserProfile): Promise<void> {
        const user = userSnapshot || await this.getUserProfile(userId);
        if (!user) return;

        const newBadges: string[] = [];

        const alphaCutoff = new Date('2026-03-01');
        const earlyAdopterCutoff = new Date('2026-05-01');
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        if (registrationDate < alphaCutoff) {
            newBadges.push('alpha_tester');
        }

        if (registrationDate < earlyAdopterCutoff) {
            newBadges.push('early_adopter_2026');
        }

        if (registrationDate < oneYearAgo) {
            newBadges.push('loyal_member_1y');
        }

        await this.awardBadges(userId, newBadges);
    }

    /**
     * Checks for retroactive badges that might have been missed.
     * Useful for older accounts or when badges are added later.
     */
    static async checkRetroactiveBadges(userId: string): Promise<void> {
        // First, ensure we don't have duplicates
        await this.deduplicateBadges(userId);

        const user = await this.getUserProfile(userId);
        if (!user) return;

        const newBadges: string[] = [];

        // --- Socialite (10 friends) ---
        if ((user.friends?.length || 0) >= 10) {
            newBadges.push('socialite_10');
        }

        // --- Organizer (Has created at least one event) ---
        // We need to query events to be sure
        try {
            const { collection, query, where, limit, getDocs } = await import('firebase/firestore');
            const q = query(collection(db, "events"), where("creatorId", "==", userId), limit(1));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                newBadges.push('organizer');
            }
        } catch (e) {
            console.error("Failed to check organizer badge retroactively", e);
        }

        // --- Registration Badges ---
        // Try to get createdAt from profile. If not present, we might be limited.
        // Assuming 'createdAt' might be in the document metadata or a field we missed.
        // If the user profile doesn't have it, we can't reliably check retroactive early adopter status 
        // unless we passed it in. 
        //
        // Strategy: Use a known field or assume new users have it. 
        // For now, let's try to see if we can get it from the doc snapshot metadata if we read it again, 
        // OR just check if the user has 'createdAt' field in the data (common practice).

        let registrationDate = new Date(); // Default to now (no badge) if unknown

        // We need to re-fetch the doc with metadata if possible or check if it is in the data
        try {
            const userDoc = await getDoc(doc(db, "users", userId));
            if (userDoc.exists()) {
                const data = userDoc.data();
                if (data.createdAt) {
                    // Handle Firestore Timestamp or string
                    registrationDate = typeof data.createdAt.toDate === 'function'
                        ? data.createdAt.toDate()
                        : new Date(data.createdAt);
                }
            }

            await this.checkRegistrationBadges(userId, registrationDate, user);
        } catch (e) {
            console.error("Failed to check registration badges", e);
        }

        await this.awardBadges(userId, newBadges);
    }


    /**
     * Removes duplicate badges from user profile.
     * Keeps the earliest earned instance of each badge.
     */
    static async deduplicateBadges(userId: string): Promise<void> {
        try {
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, "users", userId);
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) return;

                const userData = userDoc.data() as UserProfile;
                const badges = userData.badges || [];

                if (badges.length === 0) return;

                const uniqueBadgesMap = new Map<string, UserBadge>();

                // Keep the earliest earned date for each badge ID
                badges.forEach(badge => {
                    if (!uniqueBadgesMap.has(badge.badgeId)) {
                        uniqueBadgesMap.set(badge.badgeId, badge);
                    } else {
                        const existing = uniqueBadgesMap.get(badge.badgeId)!;
                        if (new Date(badge.earnedAt) < new Date(existing.earnedAt)) {
                            uniqueBadgesMap.set(badge.badgeId, badge);
                        }
                    }
                });

                const uniqueBadges = Array.from(uniqueBadgesMap.values());

                if (uniqueBadges.length < badges.length) {
                    transaction.update(userRef, { badges: uniqueBadges });
                    console.log(`[BadgeService] Deduplicated badges for ${userId}. Removed ${badges.length - uniqueBadges.length} duplicates.`);
                }
            });
        } catch (error) {
            console.error('[BadgeService] Failed to deduplicate badges:', error);
        }
    }

    private static async awardBadges(userId: string, potentialBadgeIds: string[]): Promise<void> {
        if (potentialBadgeIds.length === 0) return;

        try {
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, "users", userId);
                const userDoc = await transaction.get(userRef);

                if (!userDoc.exists()) return;

                const userData = userDoc.data() as UserProfile;
                const currentBadges = userData.badges || [];
                const existingBadgeIds = new Set(currentBadges.map(b => b.badgeId));

                const reallyNewBadges = potentialBadgeIds.filter(id => !existingBadgeIds.has(id));

                if (reallyNewBadges.length === 0) return;

                const newBadgeObjects: UserBadge[] = reallyNewBadges.map(id => ({
                    badgeId: id,
                    earnedAt: new Date().toISOString(),
                    isDisplayed: false
                }));

                const updatedBadges = [...currentBadges, ...newBadgeObjects];

                transaction.update(userRef, {
                    badges: updatedBadges
                });

                console.log(`[BadgeService] Awarded badges to ${userId}:`, reallyNewBadges);
            });
        } catch (error) {
            console.error('[BadgeService] Failed to award badges:', error);
        }
    }
}
