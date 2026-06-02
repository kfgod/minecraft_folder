import { Utils } from '../utils.js';

export function createEmptyContent(contentTypes) {
    return contentTypes.reduce((acc, type) => {
        acc[type] = [];
        return acc;
    }, {});
}

export function groupByYear(updates, contentTypes) {
    const groupedByYear = updates.reduce((acc, data) => {
        const parsedDate = Utils.parseDate(data.release_date);
        const year = parsedDate ? parsedDate.getFullYear() : null;
        if (!year) return acc;

        if (!acc[year]) {
            acc[year] = {
                name: `${year}`,
                type: 'year',
                added: createEmptyContent(contentTypes),
                notable_changes: { additions: [], changes: [] },
            };
        }

        contentTypes.forEach((type) => {
            if (data.added?.[type]) acc[year].added[type].push(...data.added[type]);
        });

        const notableChanges = data.notable_changes;
        if (notableChanges) {
            if (notableChanges.additions?.length) {
                acc[year].notable_changes.additions.push(...notableChanges.additions);
            }
            if (notableChanges.changes?.length) {
                acc[year].notable_changes.changes.push(...notableChanges.changes);
            }
        }

        return acc;
    }, {});

    return Object.values(groupedByYear).sort((a, b) => b.name - a.name);
}

export function getGrowthByVersion(updates) {
    const labels = [];
    const blockCounts = [];
    const itemCounts = [];
    const mobCounts = [];
    const effectCounts = [];
    let totalBlocks = 0;
    let totalItems = 0;
    let totalMobs = 0;
    let totalEffects = 0;

    updates.forEach((update) => {
        labels.push(update.release_version?.java || update.name);
        totalBlocks += update.added?.blocks?.length || 0;
        totalItems += update.added?.items?.length || 0;
        totalMobs += update.added?.mobs?.length || 0;
        totalEffects += update.added?.effects?.length || 0;
        blockCounts.push(totalBlocks);
        itemCounts.push(totalItems);
        mobCounts.push(totalMobs);
        effectCounts.push(totalEffects);
    });

    return { labels, blocks: blockCounts, items: itemCounts, mobs: mobCounts, effects: effectCounts };
}

export function getGrowthByYear(updates) {
    const byYear = updates.reduce((acc, update) => {
        const parsedDate = Utils.parseDate(update.release_date);
        const year = parsedDate ? parsedDate.getFullYear() : null;
        if (!year) return acc;

        if (!acc[year]) acc[year] = { blocks: 0, items: 0, mobs: 0, effects: 0 };
        acc[year].blocks += update.added?.blocks?.length || 0;
        acc[year].items += update.added?.items?.length || 0;
        acc[year].mobs += update.added?.mobs?.length || 0;
        acc[year].effects += update.added?.effects?.length || 0;
        return acc;
    }, {});

    const labels = Object.keys(byYear).sort();
    const blockCounts = [];
    const itemCounts = [];
    const mobCounts = [];
    const effectCounts = [];
    let totalBlocks = 0;
    let totalItems = 0;
    let totalMobs = 0;
    let totalEffects = 0;

    labels.forEach((year) => {
        totalBlocks += byYear[year].blocks;
        totalItems += byYear[year].items;
        totalMobs += byYear[year].mobs;
        totalEffects += byYear[year].effects;
        blockCounts.push(totalBlocks);
        itemCounts.push(totalItems);
        mobCounts.push(totalMobs);
        effectCounts.push(totalEffects);
    });

    return { labels, blocks: blockCounts, items: itemCounts, mobs: mobCounts, effects: effectCounts };
}
