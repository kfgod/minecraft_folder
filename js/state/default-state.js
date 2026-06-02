import { APP_MODES } from '../app-modes.js';
import { CONFIG } from '../config.js';
import { CONTENT_FILTER_STATE_KEYS } from '../constants/filter-config.js';

export function createDefaultState() {
    const contentVisibility = CONTENT_FILTER_STATE_KEYS.reduce((state, key) => {
        state[key] = true;
        return state;
    }, {});

    return {
        allUpdates: [],
        currentView: CONFIG.VIEWS.VERSIONS,
        removeDuplicates: true,
        ...contentVisibility,
        showBorders: false,
        showNotableChanges: true,
        debounceTimer: null,
        collapsedSections: {},
        compareVersions: [null, null],
        activeMode: APP_MODES.LIST,
        detailTarget: null,
        detailReturnContext: 'list',
        scrollPositionBeforeDetail: 0,
    };
}
