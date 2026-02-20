export function generateSearchKeys(strings: (string | null | undefined)[]): string[] {
    const keys = new Set<string>();
    strings.forEach(s => {
        if (!s) return;
        const normalized = s.toLowerCase().trim();
        if (!normalized) return;

        // Add full string prefixes
        for (let i = 1; i <= normalized.length; i++) {
            keys.add(normalized.substring(0, i));
        }

        // Add individual word prefixes
        const parts = normalized.split(/\s+/);
        if (parts.length > 1) {
            parts.forEach(part => {
                for (let i = 1; i <= part.length; i++) {
                    keys.add(part.substring(0, i));
                }
            });
        }
    });
    return Array.from(keys);
}
