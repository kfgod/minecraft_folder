/**
 * Filter checkboxes, popular pills, view toggle, mode toggle buttons.
 */
import { isYearToggleDisabledMode } from '../app-modes.js';
import { ALL_FILTER_CHECKBOX_PAIRS, CONTENT_FILTER_STATE_KEYS, POPULAR_FILTERS } from '../constants/filter-config.js';

/**
 * @param {*} app - MinecraftUpdatesApp
 */
export function attachFiltersController(app) {
    app.elements.toggleSwitch.addEventListener('click', (e) => {
        if (isYearToggleDisabledMode(app.state.activeMode)) {
            return;
        }

        const targetView = e.target.dataset.view;

        void app.actions.setView(targetView);
    });

    app.elements.toggleSwitch.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const target = e.target.closest('.toggle-switch-label');
        if (!target) return;
        e.preventDefault();
        target.click();
    });

    if (app.elements.compareBtn) {
        app.elements.compareBtn.addEventListener('click', () => {
            app.toggleMode('compare');
        });
    }

    if (app.elements.statsBtn) {
        app.elements.statsBtn.addEventListener('click', () => {
            app.toggleMode('stats');
        });
    }

    if (app.elements.timeSinceBtn) {
        app.elements.timeSinceBtn.addEventListener('click', () => {
            app.toggleMode('time-since');
        });
    } else {
        console.warn('Time Since button not found');
    }

    if (app.elements.materialGroupsBtn) {
        app.elements.materialGroupsBtn.addEventListener('click', () => {
            app.toggleMode('material-groups');
        });
    } else {
        console.warn('Material Groups button not found');
    }

    ALL_FILTER_CHECKBOX_PAIRS
        .filter(([, stateKey]) => stateKey !== 'showBorders')
        .forEach(([elementKey, stateKey]) => {
            const el = app.elements[elementKey];
            if (!el) return;
            el.addEventListener('change', (e) => {
                void app.actions.setFilter(stateKey, e.target.checked);
            });
        });

    if (app.elements.filtersSelectAllBtn) {
        app.elements.filtersSelectAllBtn.addEventListener('click', () => {
            void app.actions.setContentFilters(CONTENT_FILTER_STATE_KEYS, true);
        });
    }

    if (app.elements.filtersSelectNoneBtn) {
        app.elements.filtersSelectNoneBtn.addEventListener('click', () => {
            void app.actions.setContentFilters(CONTENT_FILTER_STATE_KEYS, false);
        });
    }

    const attachPopularToggle = (element, stateKey) => {
        if (!element) return;
        element.addEventListener('click', () => {
            void app.actions.toggleFilter(stateKey);
        });
    };

    POPULAR_FILTERS.forEach(({ elementKey, stateKey }) => {
        attachPopularToggle(app.elements[elementKey], stateKey);
    });
}
