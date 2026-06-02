import { APP_MODES } from '../app-modes.js';
import { DOMManager } from '../dom-manager.js';
import { groupByYear } from '../data/aggregation.js';
import { SECTION_TYPES } from '../section-config.js';
import { renderCardsInChunks, renderEmptyState, renderResultsSummary } from '../ui/list-renderer.js';
import { renderSearchSuggestions } from '../ui/search-suggestions.js';

export function renderAppNav(app, data) {
    if (app.state.activeMode === APP_MODES.DETAIL) {
        return;
    }
    app.navigationManager.renderListNav(data);
    app.updateActiveNavLink();
}

export function renderAppContent(app, data) {
    DOMManager.clearContainer(app.elements.content);
    const summary = renderResultsSummary(app, data);

    if (data.length === 0) {
        renderEmptyState(app, summary);
        return;
    }

    renderCardsInChunks({
        app,
        data,
        cardRenderer: app.cardRenderer,
        afterRender: () => {
            app.applyCollapsedState();
            app.handleHashScroll();
        },
    });
}

export function updateAppSearchSuggestions(app) {
    renderSearchSuggestions(app.state.allUpdates, document.getElementById('search-suggestions'));
}

export function getAppYearEntries(app) {
    if (!app.yearEntriesCache) {
        app.yearEntriesCache = groupByYear(app.state.allUpdates, SECTION_TYPES);
    }
    return app.yearEntriesCache;
}
