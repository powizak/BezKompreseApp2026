
import type { BadgeDefinition, BadgeCategory } from '../types/badges';

export const BADGES: BadgeDefinition[] = [
    // ... (content remains similar, just fixing imports)

    // --- Technical / Cars ---
    {
        id: 'high_miler_300k',
        name: 'Dobyvatel kilometrů',
        description: 'Vlastníte auto s nájezdem přes 300 000 km.',
        icon: 'Gauge',
        category: 'technical',
        criteriaText: 'Mějte v garáži auto s více než 300 000 km.',
    },
    {
        id: 'centurion_100k',
        name: 'Zajetý motor',
        description: 'Vlastníte auto s nájezdem přes 100 000 km.',
        icon: 'Gauge',
        category: 'technical',
        criteriaText: 'Mějte v garáži auto s více než 100 000 km.',
    },
    {
        id: 'power_user_220kw', // approx 300hp
        name: 'Trhač asfaltu',
        description: 'Vlastníte výkonné auto s více než 220 kW.',
        icon: 'Zap', // Lightning
        category: 'technical',
        criteriaText: 'Vlastněte auto s výkonem nad 220 kW (~300 koní).',
    },
    {
        id: 'garage_keeper_3',
        name: 'Sběratel vraků',
        description: 'Vlastníte alespoň 3 auta.',
        icon: 'Warehouse',
        category: 'technical',
        criteriaText: 'Mějte v garáži alespoň 3 auta.',
    },

    // --- Maintenance ---
    {
        id: 'brakes_fixer',
        name: 'Brzdař',
        description: 'Opravili jste si brzdy sami.',
        icon: 'Disc', // Disc brake icon if available, or generic tool
        category: 'technical',
        criteriaText: 'Zapište servis brzd typu "Doma".',
    },
    {
        id: 'wrench_wizard_10',
        name: 'Domácí kutil',
        description: 'Máte 10 servisních záznamů typu "Doma".',
        icon: 'Wrench',
        category: 'technical',
        criteriaText: 'Zapište 10 oprav svépomocí.',
    },

    // --- Usage ---
    {
        id: 'fuel_tracker_50',
        name: 'Puntičkář',
        description: 'Zadali jste 50 tankování.',
        icon: 'Fuel',
        category: 'milestone',
        criteriaText: 'Zaznamenejte 50 tankování.',
    },

    // --- Community ---
    {
        id: 'event_junkie_5',
        name: 'Srazový fanatik',
        description: 'Zúčastnili jste se 5 akcí.',
        icon: 'CalendarCheck',
        category: 'community',
        criteriaText: 'Přihlaste se a potvrďte účast na 5 srazech.',
    },
    {
        id: 'organizer',
        name: 'Organizátor',
        description: 'Zorganizovali jste vlastní akci.',
        icon: 'Megaphone',
        category: 'community',
        criteriaText: 'Vytvořte veřejnou akci.',
    },
    {
        id: 'socialite_10',
        name: 'Influencer',
        description: 'Máte 10 přátel v aplikaci.',
        icon: 'Users',
        category: 'community',
        criteriaText: 'Mějte 10 potvrzených přátel.',
    },
    {
        id: 'content_creator_5',
        name: 'Obchodník',
        description: 'Vytvořili jste 5 inzerátů na Marketu.',
        icon: 'ShoppingBag',
        category: 'community',
        criteriaText: 'Vystavte 5 inzerátů na bazaru.',
    },

    // --- Special ---
    {
        id: 'early_adopter_2026',
        name: 'Early Adopter',
        description: 'Připojili jste se k Bez Komprese v rané fázi.',
        icon: 'Rocket',
        category: 'special',
        criteriaText: 'Registrace před 1. 5. 2026.',
    },
    {
        id: 'alpha_tester',
        name: 'Alpha Tester',
        description: 'Byli jste u toho, když to celé začalo.',
        icon: 'Beaker', // Test tube
        category: 'special',
        criteriaText: 'Registrace před 1. 3. 2026.',
    },
    {
        id: 'loyal_member_1y',
        name: 'Věrný člen',
        description: 'Jste s námi už více než rok.',
        icon: 'Award',
        category: 'special',
        criteriaText: 'Členství v aplikaci déle než 1 rok.',
    }
];

export const BADGE_CATEGORIES: Record<BadgeCategory, { label: string; color: string; bg: string }> = {
    technical: { label: 'Technika', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    milestone: { label: 'Milníky', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    community: { label: 'Komunita', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    special: { label: 'Speciální', color: 'text-red-500', bg: 'bg-red-500/10' },
};
