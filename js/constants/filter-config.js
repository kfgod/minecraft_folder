import { SECTION_META, SECTION_TYPES } from '../section-config.js';

export const CONTENT_FILTER_STATE_KEYS = SECTION_TYPES
    .map((type) => SECTION_META[type]?.stateKey)
    .filter(Boolean);

export const ALL_FILTER_CHECKBOX_PAIRS = [
    ['removeDuplicatesCheckbox', 'removeDuplicates'],
    ...SECTION_TYPES.map((type) => {
        const meta = SECTION_META[type];
        return [meta.checkboxElementKey, meta.stateKey];
    }).filter(([, stateKey]) => Boolean(stateKey)),
    ['showBordersCheckbox', 'showBorders'],
    ['showNotableChangesCheckbox', 'showNotableChanges'],
];

export const POPULAR_FILTERS = [
    { elementKey: 'filtersPopularBlocksBtn', stateKey: 'showBlocks' },
    { elementKey: 'filtersPopularItemsBtn', stateKey: 'showItems' },
    { elementKey: 'filtersPopularMobsBtn', stateKey: 'showMobs' },
];
