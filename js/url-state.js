/**
 * URL search params and history state for shareable links (client-only).
 */
import { CONFIG } from './config.js';
import { Utils } from './utils.js';
import { APP_MODES, activeModeFromUrlParam, historyModeLabel } from './app-modes.js';

/** Last `view` / `mode` query values after our own history updates (for popstate vs hash-only). */
let lastTrackedView = null;
let lastTrackedMode = null;
let lastTrackedItem = null;

/**
 * Sync tracker from the current address bar (call after load and after updateURL).
 */
export function refreshUrlSessionFromLocation() {
    const p = new URLSearchParams(window.location.search);
    lastTrackedView = p.get('view');
    lastTrackedMode = p.get('mode');
    lastTrackedItem = p.get('item');
}

export function getLastTrackedUrlParams() {
    return { view: lastTrackedView, mode: lastTrackedMode, item: lastTrackedItem };
}

/**
 * Apply URL search params to app state (URL wins over localStorage for these fields).
 * Sets temporary flags on `app` for deferred compare/detail restore after data loads.
 *
 * @param {*} app - MinecraftUpdatesApp
 */
export function restoreFromURL(app) {
    const pendingRestore = {
        detailTarget: null,
        compareVersionIds: null,
    };

    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');

    if (viewParam === CONFIG.VIEWS.VERSIONS || viewParam === CONFIG.VIEWS.YEARS) {
        app.state.currentView = viewParam;
    }

    const modeParam = urlParams.get('mode');
    app.state.activeMode = activeModeFromUrlParam(modeParam);

    if (app.state.activeMode === APP_MODES.ITEM) {
        app.state.itemTarget = CONFIG.FEATURES.ITEM_PAGE ? urlParams.get('item') : null;
        if (!app.state.itemTarget) app.state.activeMode = APP_MODES.LIST;
    }

    if (app.state.activeMode === APP_MODES.DETAIL) {
        const detailType = urlParams.get('detailType') || 'version';
        const detailId = urlParams.get('detailId');
        if (detailId) {
            pendingRestore.detailTarget = { type: detailType, id: detailId };
        }
    }

    const searchParam = urlParams.get('search');
    if (searchParam) {
        app.setSearchQuery(searchParam);
    }

    if (app.state.activeMode === APP_MODES.COMPARE) {
        const compare1 = urlParams.get('compare1');
        const compare2 = urlParams.get('compare2');
        if (compare1 || compare2) {
            pendingRestore.compareVersionIds = [compare1, compare2];
        }
    }

    return pendingRestore;
}

/**
 * @param {*} app - MinecraftUpdatesApp
 * @param {boolean} clearHash
 * @param {boolean} pushHistory
 */
export function updateURL(app, clearHash = false, pushHistory = false) {
    const url = new URL(window.location);
    url.searchParams.set('view', app.state.currentView);

    const searchQuery = app.getSearchQuery();
    if (searchQuery) {
        url.searchParams.set('search', searchQuery);
    } else {
        url.searchParams.delete('search');
    }

    if (app.state.activeMode === APP_MODES.ITEM && app.state.itemTarget) {
        url.searchParams.set('item', app.state.itemTarget);
    } else {
        url.searchParams.delete('item');
    }

    if (app.state.activeMode === APP_MODES.ITEM && app.state.itemTarget) {
        url.searchParams.set('mode', 'item');
        ['compare1', 'compare2', 'detailType', 'detailId'].forEach((key) => url.searchParams.delete(key));
    } else if (app.state.activeMode === APP_MODES.DETAIL && app.state.detailTarget) {
        url.searchParams.set('mode', 'detail');
        url.searchParams.set('detailType', app.state.detailTarget.type);
        url.searchParams.set('detailId', app.state.detailTarget.id);
        url.searchParams.delete('compare1');
        url.searchParams.delete('compare2');
    } else if (app.state.activeMode === APP_MODES.STATS) {
        url.searchParams.set('mode', 'stats');
        url.searchParams.delete('compare1');
        url.searchParams.delete('compare2');
        url.searchParams.delete('detailType');
        url.searchParams.delete('detailId');
    } else if (app.state.activeMode === APP_MODES.TIME_SINCE) {
        url.searchParams.set('mode', 'time-since');
        url.searchParams.delete('compare1');
        url.searchParams.delete('compare2');
        url.searchParams.delete('detailType');
        url.searchParams.delete('detailId');
    } else if (app.state.activeMode === APP_MODES.BIOME_CONTENT) {
        url.searchParams.set('mode', 'biome-content');
        url.searchParams.delete('compare1');
        url.searchParams.delete('compare2');
        url.searchParams.delete('detailType');
        url.searchParams.delete('detailId');
    } else if (app.state.activeMode === APP_MODES.MATERIAL_GROUPS) {
        url.searchParams.set('mode', 'material-groups');
        url.searchParams.delete('compare1');
        url.searchParams.delete('compare2');
        url.searchParams.delete('detailType');
        url.searchParams.delete('detailId');
    } else if (app.state.activeMode === APP_MODES.COMPARE) {
        url.searchParams.set('mode', 'compare');

        const [version1, version2] = app.state.compareVersions;
        if (version1) {
            url.searchParams.set('compare1', Utils.generateCardId(version1));
        } else {
            url.searchParams.delete('compare1');
        }
        if (version2) {
            url.searchParams.set('compare2', Utils.generateCardId(version2));
        } else {
            url.searchParams.delete('compare2');
        }
        url.searchParams.delete('detailType');
        url.searchParams.delete('detailId');
    } else {
        url.searchParams.delete('mode');
        url.searchParams.delete('compare1');
        url.searchParams.delete('compare2');
        url.searchParams.delete('detailType');
        url.searchParams.delete('detailId');
    }

    if (clearHash) {
        url.hash = '';
    }

    const historyState = {
        view: app.state.currentView,
        mode: historyModeLabel(app.state.activeMode),
        // Item pages opened from item pages: the in-page Back button can use history.back().
        itemDepth: app.state.activeMode === APP_MODES.ITEM ? app.state.itemDepth || 0 : 0,
    };
    if (pushHistory) {
        window.history.pushState(historyState, '', url);
    } else {
        window.history.replaceState(historyState, '', url);
    }

    refreshUrlSessionFromLocation();
}
