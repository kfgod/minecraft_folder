import {
    restoreFromURL as applyUrlParamsToState,
    refreshUrlSessionFromLocation,
    getLastTrackedUrlParams,
} from '../url-state.js';

export async function handlePopStateNavigation(app) {
    const p = new URLSearchParams(window.location.search);
    const currentView = p.get('view');
    const currentMode = p.get('mode');
    const { view: lastView, mode: lastMode } = getLastTrackedUrlParams();
    if (currentView === lastView && currentMode === lastMode) {
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

    app.restoreCompareVersions();
    await app.renderActiveModeView();
    app.updateLayout();
    window.scrollTo({ top: 0, behavior: 'auto' });
}
