/**
 * Filter checkboxes, view toggle, mode toggle buttons.
 */
import { isYearToggleDisabledMode } from '../app-modes.js';
import { CONFIG } from '../config.js';
import { ALL_FILTER_CHECKBOX_PAIRS, CONTENT_FILTER_STATE_KEYS } from '../constants/filter-config.js';

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

    app.elements.exploreBtn?.addEventListener('click', () => {
        app.selectMode('list');
    });

    // Biome Content has no data yet in some data sets: hide the entry instead of showing an error page.
    void fetch(`${CONFIG.BASE_URL}/data/biome_content/file_index.json`, { method: 'HEAD' })
        .then((response) => { if (!response.ok) app.elements.biomeContentBtn?.setAttribute('hidden', ''); })
        .catch(() => app.elements.biomeContentBtn?.setAttribute('hidden', ''));

    if (app.elements.compareBtn) {
        app.elements.compareBtn.addEventListener('click', () => {
            app.selectMode('compare');
        });
    }

    if (app.elements.statsBtn) {
        app.elements.statsBtn.addEventListener('click', () => {
            app.selectMode('stats');
        });
    }

    if (app.elements.timeSinceBtn) {
        app.elements.timeSinceBtn.addEventListener('click', () => {
            app.selectMode('time-since');
        });
    } else {
        console.warn('Time Since button not found');
    }

    if (app.elements.materialGroupsBtn) {
        app.elements.materialGroupsBtn.addEventListener('click', () => {
            app.selectMode('material-groups');
        });
    } else {
        console.warn('Material Groups button not found');
    }

    app.elements.biomeContentBtn?.addEventListener('click', () => {
        app.selectMode('biome-content');
    });

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

    [
        app.elements.themeDarkBtn,
        app.elements.themeLightBtn,
    ].forEach((button) => {
        if (!button) return;
        button.addEventListener('click', () => {
            const theme = button.dataset.theme;
            void app.actions.setTheme(theme);
        });
    });
}
