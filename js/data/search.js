/** Characters a #tag may contain: namespaced tags such as family:oak or woodset/oak. */
const TAG_INVALID_CHARS = /[^\w\-:/.]/g;

/** Lowercased search fields per item, computed once (items are immutable after load). */
const searchFieldsCache = new WeakMap();

export function parseSearchQuery(query) {
    if (!query) return { text: '', terms: [], tags: [] };
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const tags = [];
    const terms = [];

    tokens.forEach((token) => {
        if (token.startsWith('#')) {
            const tag = token.slice(1).replace(TAG_INVALID_CHARS, '');
            if (tag) tags.push(tag);
        } else {
            terms.push(token);
        }
    });

    return { text: terms.join(' '), terms, tags };
}

function getSearchFields(item) {
    let fields = searchFieldsCache.get(item);
    if (!fields) {
        const types = Array.isArray(item.types) ? item.types : [];
        const tags = Array.isArray(item.tags) ? item.tags : [];
        fields = {
            name: (item.name || '').toLowerCase(),
            identifier: (item.identifier || '').toLowerCase(),
            tags: new Set([...types, ...tags].map((t) => String(t).toLowerCase())),
            hidden: types.includes('hidden'),
        };
        searchFieldsCache.set(item, fields);
    }
    return fields;
}

function matchesTerm(fields, term) {
    return fields.name.includes(term) || fields.identifier.includes(term);
}

/**
 * Every text term must match the name or identifier (in any order);
 * every #tag must be present in types/tags.
 */
export function filterItems(items, query, removeDuplicates) {
    if (!items) return [];
    const parsed = typeof query === 'object' && query !== null ? query : parseSearchQuery(query);
    if (!parsed.terms.length && !parsed.tags.length && !removeDuplicates) return items.slice();

    return items.filter((item) => {
        const fields = getSearchFields(item);
        if (removeDuplicates && fields.hidden) return false;
        if (!parsed.terms.every((term) => matchesTerm(fields, term))) return false;
        return parsed.tags.every((tag) => fields.tags.has(tag));
    });
}

/**
 * Suggestions for the search datalist: most frequent names, then tags (as #tag).
 */
export function getNameSuggestions(updates, contentTypes, limit = 80, tagLimit = 40) {
    const nameCounts = new Map();
    const tagCounts = new Map();
    updates.forEach((update) => {
        contentTypes.forEach((type) => {
            const items = update.added?.[type] || [];
            items.forEach((item) => {
                if (item?.name) {
                    nameCounts.set(item.name, (nameCounts.get(item.name) || 0) + 1);
                }
                (Array.isArray(item?.types) ? item.types : []).forEach((tag) => {
                    const value = String(tag).toLowerCase();
                    if (value === 'hidden') return;
                    tagCounts.set(value, (tagCounts.get(value) || 0) + 1);
                });
            });
        });
    });

    const byFrequency = (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]);
    const names = [...nameCounts.entries()].sort(byFrequency).slice(0, limit).map(([name]) => name);
    const tags = [...tagCounts.entries()].sort(byFrequency).slice(0, tagLimit).map(([tag]) => `#${tag}`);
    return [...names, ...tags];
}
