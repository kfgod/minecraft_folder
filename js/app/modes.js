import { APP_MODES } from '../app-modes.js';

export function normalizeAppMode(mode) {
    if (mode === APP_MODES.LIST || mode === 'list' || !mode) {
        return APP_MODES.LIST;
    }
    return Object.values(APP_MODES).includes(mode) ? mode : APP_MODES.LIST;
}

export function setAppMode(app, mode) {
    const next = normalizeAppMode(mode);
    const previousMode = app.state.activeMode;

    app.featureManagers.resetMode(previousMode, next);
    app.state.activeMode = next;

    if (next !== APP_MODES.DETAIL) {
        app.state.detailTarget = null;
        app.state.detailReturnContext = 'list';
    }

    app.syncViewToggle();
    app.updateURL(true, true);
    app.saveState();
    void app.render();
    app.updateLayout();
    window.scrollTo({ top: 0, behavior: 'auto' });
}

export function toggleAppMode(app, mode) {
    const target = normalizeAppMode(mode);
    const isActive = app.state.activeMode === target;
    setAppMode(app, isActive ? APP_MODES.LIST : target);
}
