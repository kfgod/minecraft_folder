import { CONFIG } from '../config.js';
import { SECTION_META, SECTION_TYPES } from '../section-config.js';
import { filterItems } from './search.js';
import { groupByYear } from './aggregation.js';

export function filterAllContentTypes(entry, query, removeDuplicates, contentTypes = SECTION_TYPES) {
    const filteredAdded = {};
    contentTypes.forEach((type) => {
        filteredAdded[type] = filterItems(entry.added?.[type], query, removeDuplicates);
    });
    return filteredAdded;
}

export function getFilteredData(
    allUpdates,
    currentView,
    query,
    removeDuplicates,
    visibilityMap,
    contentTypes = SECTION_TYPES
) {
    const sourceData = currentView === CONFIG.VIEWS.VERSIONS ? allUpdates : groupByYear(allUpdates, contentTypes);
    const mapped = sourceData.map((entry) => ({
        ...entry,
        added: filterAllContentTypes(entry, query, removeDuplicates, contentTypes),
    }));

    return mapped.filter((entry) =>
        contentTypes.some((type) => visibilityMap[type] && entry.added[type].length > 0)
    );
}

export function getFilteredDataFromState(allUpdates, currentView, query, state, contentTypes = SECTION_TYPES) {
    const visibilityMap = Object.fromEntries(
        contentTypes.map((type) => {
            const stateKey = SECTION_META[type]?.stateKey;
            return [type, stateKey ? Boolean(state[stateKey]) : true];
        })
    );
    return getFilteredData(allUpdates, currentView, query, state.removeDuplicates, visibilityMap, contentTypes);
}
