import { CONFIG } from '../config.js';
import { APP_MODES } from '../app-modes.js';

export class AppActions {
    constructor(app) {
        this.app = app;
    }

    async refreshForSearchChange() {
        const app = this.app;
        app.updateURL(false, false);

        switch (app.state.activeMode) {
            case APP_MODES.COMPARE: {
                const compareManager = await app.ensureCompareManager();
                compareManager.renderCards();
                break;
            }
            case APP_MODES.DETAIL:
                app.detailViewManager.render();
                break;
            case APP_MODES.STATS:
            case APP_MODES.TIME_SINCE:
            case APP_MODES.MATERIAL_GROUPS:
                break;
            default:
                await app.render();
        }
    }

    async clearSearch() {
        this.app.setSearchQuery('');
        await this.refreshForSearchClear();
        window.scrollTo({ top: 0, behavior: 'auto' });
    }

    async refreshForSearchClear() {
        const app = this.app;
        app.updateURL(false, false);

        switch (app.state.activeMode) {
            case APP_MODES.COMPARE: {
                const compareManager = await app.ensureCompareManager();
                compareManager.renderCards();
                break;
            }
            case APP_MODES.STATS: {
                const statisticsManager = await app.ensureStatisticsManager();
                await statisticsManager.render();
                break;
            }
            case APP_MODES.TIME_SINCE: {
                const timeSinceManager = await app.ensureTimeSinceManager();
                await timeSinceManager.render();
                break;
            }
            case APP_MODES.DETAIL:
                app.detailViewManager.render();
                break;
            default:
                await app.render();
        }
    }

    async setView(targetView) {
        const app = this.app;
        if (!targetView) return;

        if (app.state.currentView === targetView) {
            const url = new URL(window.location);
            url.hash = '';
            window.history.replaceState({}, '', url);
            window.scrollTo({ top: 0, behavior: 'instant' });
            return;
        }

        const previousMode = app.state.activeMode;
        app.state.currentView = targetView;

        if (previousMode === APP_MODES.COMPARE) {
            app.state.compareVersions = [null, null];
            app.restoreCompareVersions();
        }
        if (previousMode === APP_MODES.DETAIL) {
            app.state.activeMode = APP_MODES.LIST;
            app.state.detailTarget = null;
            app.state.detailReturnContext = 'list';
        }
        if (previousMode === APP_MODES.TIME_SINCE) {
            app.state.activeMode = APP_MODES.LIST;
            app.timeSinceManager?.reset();
        }

        app.syncViewToggle();
        app.updateURL(true, true);
        app.saveState();
        await app.render();
        app.updateLayout();
        window.scrollTo({ top: 0, behavior: 'instant' });
    }

    async setFilter(stateKey, enabled) {
        const app = this.app;
        app.state[stateKey] = enabled;
        app.saveState();
        app.updatePopularButtons();
        await this.refreshForFilterChange();
    }

    async toggleFilter(stateKey) {
        await this.setFilter(stateKey, !this.app.state[stateKey]);
        this.app.syncCheckboxesToState();
    }

    async setContentFilters(stateKeys, enabled) {
        const app = this.app;
        stateKeys.forEach((key) => {
            app.state[key] = enabled;
        });
        app.syncCheckboxesToState();
        app.updatePopularButtons();
        app.saveState();
        await app.render();
    }

    async refreshForFilterChange() {
        const app = this.app;

        switch (app.state.activeMode) {
            case APP_MODES.COMPARE: {
                const compareManager = await app.ensureCompareManager();
                compareManager.renderCards();
                break;
            }
            case APP_MODES.STATS: {
                const isYearView = app.state.currentView === CONFIG.VIEWS.YEARS;
                const statisticsManager = await app.ensureStatisticsManager();
                await statisticsManager.renderChart(isYearView);
                statisticsManager.renderContentTable();
                break;
            }
            case APP_MODES.TIME_SINCE: {
                const timeSinceManager = await app.ensureTimeSinceManager();
                await timeSinceManager.render();
                break;
            }
            case APP_MODES.DETAIL:
                app.detailViewManager.render();
                break;
            default:
                await app.render();
        }
    }
}
