
export type BadgeCategory = 'milestone' | 'community' | 'technical' | 'special';

export interface BadgeDefinition {
    id: string;
    name: string;
    description: string;
    icon: string; // Lucide icon name
    category: BadgeCategory;
    criteriaText: string;
    // Optional metadata for rendering
    colorScheme?: {
        primary: string;
        secondary: string;
        text: string;
    };
}

export interface UserBadge {
    badgeId: string;
    earnedAt: string; // ISO timestamp
    isDisplayed?: boolean;
}
