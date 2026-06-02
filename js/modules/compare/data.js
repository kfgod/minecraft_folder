import { Utils } from '../../utils.js';
import { CONFIG } from '../../config.js';
import { filterAllContentTypes } from '../../data/filtering.js';

export function getCompareDataSource(ctx) {
    return ctx.state.currentView === CONFIG.VIEWS.YEARS ? ctx.queries.getYearEntries() : ctx.state.allUpdates;
}

export function isCompareYearView(ctx) {
    return ctx.state.currentView === CONFIG.VIEWS.YEARS;
}

export function normalizeCompareSelections(selections, dataSource) {
    return selections.map((item) => {
        if (!item) return null;
        const itemId = Utils.generateCardId(item);
        return dataSource.find((entry) => Utils.generateCardId(entry) === itemId) || null;
    });
}

export function findCompareItem(dataSource, cardId) {
    return dataSource.find((item) => Utils.generateCardId(item) === cardId) || null;
}

export function filterCompareVersion(version, searchQuery, removeDuplicates) {
    return {
        ...version,
        added: filterAllContentTypes(version, searchQuery, removeDuplicates),
    };
}

export function getCompareItemLabel(item, isYearView) {
    if (isYearView) return item.name;
    if (item.name) return `${item.release_version?.java || item.name} — ${item.name}`;
    return item.release_version?.java || 'Unknown';
}

export function getCompareDisplayName(item, fallback) {
    return item ? item.release_version?.java || item.name || fallback : fallback;
}
