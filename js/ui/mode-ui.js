import { APP_MODES, isSearchDisabledMode, isYearToggleDisabledMode } from '../app-modes.js';
import { CONFIG } from '../config.js';
import { POPULAR_FILTERS, ALL_FILTER_CHECKBOX_PAIRS } from '../constants/filter-config.js';
import { DOMManager } from '../dom-manager.js';

export const MODE_UI_CONFIG = [
    { mode: APP_MODES.COMPARE, btnKey: 'compareBtn', bodyClass: 'compare-mode' },
    { mode: APP_MODES.STATS, btnKey: 'statsBtn', bodyClass: 'stats-mode' },
    { mode: APP_MODES.TIME_SINCE, btnKey: 'timeSinceBtn', bodyClass: 'time-since-mode' },
    { mode: APP_MODES.MATERIAL_GROUPS, btnKey: 'materialGroupsBtn', bodyClass: 'material-groups-mode' },
    { mode: APP_MODES.DETAIL, btnKey: null, bodyClass: 'detail-mode' },
];

export function syncModeUi(app) {
    const mode = app.state.activeMode;

    if (app.elements.toggleSwitch) {
        const activeElement = app.elements.toggleSwitch.querySelector(`.${CONFIG.CSS_CLASSES.ACTIVE}`);
        if (activeElement) DOMManager.removeClass(activeElement, CONFIG.CSS_CLASSES.ACTIVE);
        const target = app.elements.toggleSwitch.querySelector(`[data-view="${app.state.currentView}"]`);
        if (target) DOMManager.addClass(target, CONFIG.CSS_CLASSES.ACTIVE);
        app.elements.toggleSwitch.classList.toggle('disabled', isYearToggleDisabledMode(mode));
    }

    MODE_UI_CONFIG.forEach(({ mode: uiMode, btnKey, bodyClass }) => {
        const active = mode === uiMode;
        app.elements.body.classList.toggle(bodyClass, active);
        if (btnKey) app.elements[btnKey]?.classList.toggle('active', active);
    });

    const searchDisabled = isSearchDisabledMode(mode);
    const searchPlaceholder = searchDisabled ? 'Search disabled' : 'Search across all content...';
    [app.elements.searchBar, app.elements.mobileSearchBar].forEach((bar) => {
        if (!bar) return;
        bar.disabled = searchDisabled;
        bar.placeholder = searchPlaceholder;
    });

    syncPopularButtons(app);
}

export function syncCheckboxes(app) {
    ALL_FILTER_CHECKBOX_PAIRS.forEach(([elementKey, stateKey]) => {
        const element = app.elements[elementKey];
        if (element) element.checked = app.state[stateKey];
    });
}

export function syncPopularButtons(app) {
    POPULAR_FILTERS.forEach(({ elementKey, stateKey }) => {
        const element = app.elements[elementKey];
        if (!element) return;
        element.classList.toggle('active', Boolean(app.state[stateKey]));
    });
}
