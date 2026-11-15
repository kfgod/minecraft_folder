import {
    restoreFromURL as applyUrlParamsToState,
    refreshUrlSessionFromLocation,
    getLastTrackedUrlParams,
} from '../url-state.js';

export async function handlePopStateNavigation(app) {
    const p = new URLSearchParams(window.location.search);
    const currentView = p.get('view');
    const currentMode = p.get('mode');
    const currentItem = p.get('item');
    const { view: lastView, mode: lastMode, item: lastItem } = getLastTrackedUrlParams();
    if (currentView === lastView && currentMode === lastMode && currentItem === lastItem) {
        return;
    }

    const prevMode = app.state.activeMode;
    const prevView = app.state.currentView;
    const urlRestore = applyUrlParamsToState(app);
    app.pendingRestore = {
        detailTarget: urlRestore.detailTarget,
        compareVersionIds: urlRestore.compareVersionIds,
    };

    app.featureManagers.resetMode(prevMode, app.state.activeMode);

    if (prevView !== app.state.currentView) {
        app.yearEntriesCache = null;
    }

    refreshUrlSessionFromLocation();
    app.syncViewToggle();
    app.saveState();

    if (!app.state.allUpdates.length) {
        return;
    }

    app.state.itemDepth = window.history.state?.itemDepth || 0;
    app.restoreCompareVersions();
    await app.renderActiveModeView();
    app.updateLayout();
    restoreScroll(window.history.state?.scrollY || 0);
}

/** The list renders in chunks: retry until the saved offset is reachable. */
function restoreScroll(top) {
    let attempts = 0;
    const tryScroll = () => {
        window.scrollTo({ top, behavior: 'instant' });
        if (Math.abs(window.scrollY - top) > 2 && attempts++ < 20) setTimeout(tryScroll, 50);
    };
    tryScroll();
}
