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

    if (next !== APP_MODES.ITEM) {
        app.state.itemTarget = null;
        app.state.itemDepth = 0;
    }

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

/** Sidebar choice: picking the current page again does nothing. */
export function selectAppMode(app, mode) {
    const target = normalizeAppMode(mode);
    if (app.state.activeMode === target) return;
    setAppMode(app, target);
}

/** Opens the full-page item view as a new history entry, so browser Back returns. */
export function openAppItem(app, identifier) {
    if (!identifier) return;
    const fromItem = app.state.activeMode === APP_MODES.ITEM;
    if (fromItem && app.state.itemTarget === identifier) return;
    window.history.replaceState({ ...window.history.state, scrollY: window.scrollY }, '');
    app.state.itemDepth = fromItem ? (app.state.itemDepth || 1) + 1 : 1;
    app.state.itemTarget = identifier;
    if (fromItem) {
        app.updateURL(true, true);
        void app.render();
        window.scrollTo({ top: 0, behavior: 'instant' });
        return;
    }
    setAppMode(app, APP_MODES.ITEM);
}
