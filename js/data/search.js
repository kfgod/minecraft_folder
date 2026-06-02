export function parseSearchQuery(query) {
    if (!query) return { text: '', tags: [] };
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const tags = [];
    const textTokens = [];

    tokens.forEach((token) => {
        if (token.startsWith('#')) {
            const tag = token.slice(1).replace(/[^\w-]/g, '');
            if (tag) tags.push(tag);
        } else {
            textTokens.push(token);
        }
    });

    return { text: textTokens.join(' '), tags };
}

export function filterItems(items, query, removeDuplicates) {
    if (!items) return [];
    const parsed = parseSearchQuery(query);
    let filtered = items.filter((item) => {
        const displayName = (item.name || '').toLowerCase();
        const identifier = (item.identifier || '').toLowerCase();
        const types = Array.isArray(item.types) ? item.types.map((t) => String(t).toLowerCase()) : [];
        const tags = Array.isArray(item.tags) ? item.tags.map((t) => String(t).toLowerCase()) : [];
        const allTags = new Set([...types, ...tags]);

        const matchesText = parsed.text
            ? displayName.includes(parsed.text) || identifier.includes(parsed.text)
            : true;
        const matchesTags = parsed.tags.length
            ? parsed.tags.every((tag) => allTags.has(tag))
            : true;
        return matchesText && matchesTags;
    });

    if (removeDuplicates) {
        filtered = filtered.filter((item) => {
            const types = Array.isArray(item.types) ? item.types : [];
            return !types.includes('hidden');
        });
    }

    return filtered;
}

export function getNameSuggestions(updates, contentTypes, limit = 80) {
    const counts = new Map();
    updates.forEach((update) => {
        contentTypes.forEach((type) => {
            const items = update.added?.[type] || [];
            items.forEach((item) => {
                if (!item?.name) return;
                counts.set(item.name, (counts.get(item.name) || 0) + 1);
            });
        });
    });

    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, limit)
        .map(([name]) => name);
}
