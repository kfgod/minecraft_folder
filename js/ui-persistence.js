/**
 * localStorage persistence for UI state (versioned payload for safe migrations).
 */
import { Utils } from './utils.js';
import { CONFIG } from './config.js';
import { APP_MODES } from './app-modes.js';
import { CONTENT_FILTER_STATE_KEYS } from './constants/filter-config.js';

const STORAGE_KEY = 'minecraft_updates_ui_state';
const SCHEMA_VERSION = 3;
const BOOLEAN_STATE_KEYS = [
    'removeDuplicates',
    ...CONTENT_FILTER_STATE_KEYS,
    'showNotableChanges',
];

/**
 * Derive activeMode from legacy boolean flags (schema v1).
 * @param {object} saved
 * @returns {string}
 */
function migrateActiveModeFromBooleans(saved) {
    if (typeof saved.isDetailMode === 'boolean' && saved.isDetailMode) return APP_MODES.DETAIL;
    if (typeof saved.isStatsMode === 'boolean' && saved.isStatsMode) return APP_MODES.STATS;
    if (typeof saved.isTimeSinceMode === 'boolean' && saved.isTimeSinceMode) return APP_MODES.TIME_SINCE;
    if (typeof saved.isMaterialGroupsMode === 'boolean' && saved.isMaterialGroupsMode) {
        return APP_MODES.MATERIAL_GROUPS;
    }
    if (typeof saved.isCompareMode === 'boolean' && saved.isCompareMode) return APP_MODES.COMPARE;
    return APP_MODES.LIST;
}

/**
 * @param {string} mode
 * @returns {string}
 */
function coerceStoredMode(mode) {
    return Object.values(APP_MODES).includes(mode) ? mode : APP_MODES.LIST;
}

/**
 * @param {*} app - MinecraftUpdatesApp instance
 */
export function restorePersistedUIState(app) {
    const pendingRestore = {
        detailTarget: null,
        compareVersionIds: null,
    };

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return pendingRestore;
        const saved = JSON.parse(raw);

        if (
            saved.currentView === CONFIG.VIEWS.VERSIONS ||
            saved.currentView === CONFIG.VIEWS.YEARS
        ) {
            app.state.currentView = saved.currentView;
        }

        BOOLEAN_STATE_KEYS.forEach((prop) => {
            if (typeof saved[prop] === 'boolean') {
                app.state[prop] = saved[prop];
            }
        });

        if (saved.collapsedSections && typeof saved.collapsedSections === 'object') {
            app.state.collapsedSections = saved.collapsedSections;
        }

        if (saved.theme === 'light' || saved.theme === 'dark') {
            app.state.theme = saved.theme;
        }

        const rawMode =
            saved.schemaVersion >= SCHEMA_VERSION && typeof saved.activeMode === 'string'
                ? saved.activeMode
                : migrateActiveModeFromBooleans(saved);
        app.state.activeMode = coerceStoredMode(rawMode);

        if (saved.detailTarget) {
            app.state.detailTarget = saved.detailTarget;
            pendingRestore.detailTarget = saved.detailTarget;
        }

        if (saved.detailReturnContext) {
            app.state.detailReturnContext = saved.detailReturnContext;
        }

        if (Array.isArray(saved.compareVersionIds)) {
            pendingRestore.compareVersionIds = saved.compareVersionIds;
        }
    } catch (_) {
        /* ignore */
    }

    app.syncCheckboxesToState();
    return pendingRestore;
}

/**
 * @param {*} app - MinecraftUpdatesApp instance
 */
export function persistUIState(app) {
    try {
        const stateToPersist = {
            schemaVersion: SCHEMA_VERSION,
            activeMode: app.state.activeMode,
            currentView: app.state.currentView,
            ...Object.fromEntries(BOOLEAN_STATE_KEYS.map((key) => [key, app.state[key]])),
            theme: app.state.theme,
            collapsedSections: app.state.collapsedSections,
            detailTarget: app.state.detailTarget,
            detailReturnContext: app.state.detailReturnContext,
            compareVersionIds: app.state.compareVersions.map((v) => (v ? Utils.generateCardId(v) : null)),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPersist));
    } catch (_) {
        /* private mode / quota */
    }
}
