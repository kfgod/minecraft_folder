/**
 * Single source of truth for application view modes (GitHub Pages — client-only).
 */

export const APP_MODES = Object.freeze({
    LIST: 'list',
    COMPARE: 'compare',
    STATS: 'stats',
    TIME_SINCE: 'time-since',
    MATERIAL_GROUPS: 'material-groups',
    DETAIL: 'detail',
});

const URL_MODE_TO_ACTIVE = Object.freeze({
    compare: APP_MODES.COMPARE,
    stats: APP_MODES.STATS,
    'time-since': APP_MODES.TIME_SINCE,
    'material-groups': APP_MODES.MATERIAL_GROUPS,
    detail: APP_MODES.DETAIL,
});

const ACTIVE_TO_URL_PARAM = Object.freeze({
    [APP_MODES.COMPARE]: 'compare',
    [APP_MODES.STATS]: 'stats',
    [APP_MODES.TIME_SINCE]: 'time-since',
    [APP_MODES.MATERIAL_GROUPS]: 'material-groups',
    [APP_MODES.DETAIL]: 'detail',
});

/**
 * @param {string | null} modeParam - value of URL ?mode=
 * @returns {keyof typeof APP_MODES extends infer K ? typeof APP_MODES[K] : string}
 */
export function activeModeFromUrlParam(modeParam) {
    if (!modeParam) return APP_MODES.LIST;
    return URL_MODE_TO_ACTIVE[modeParam] || APP_MODES.LIST;
}

/**
 * @param {string} activeMode
 * @returns {string | null} URL mode query value or null for list
 */
export function urlParamFromActiveMode(activeMode) {
    if (!activeMode || activeMode === APP_MODES.LIST) return null;
    return ACTIVE_TO_URL_PARAM[activeMode] || null;
}

/**
 * @param {string} activeMode
 * @returns {boolean}
 */
export function isSearchDisabledMode(activeMode) {
    return (
        activeMode === APP_MODES.STATS ||
        activeMode === APP_MODES.TIME_SINCE ||
        activeMode === APP_MODES.MATERIAL_GROUPS
    );
}

/**
 * @param {string} activeMode
 * @returns {boolean}
 */
export function isYearToggleDisabledMode(activeMode) {
    return activeMode === APP_MODES.TIME_SINCE || activeMode === APP_MODES.MATERIAL_GROUPS;
}

/**
 * History state `mode` string for popstate / pushState
 * @param {string} activeMode
 * @returns {string}
 */
export function historyModeLabel(activeMode) {
    if (activeMode === APP_MODES.DETAIL) return 'detail';
    if (activeMode === APP_MODES.STATS) return 'stats';
    if (activeMode === APP_MODES.TIME_SINCE) return 'time-since';
    if (activeMode === APP_MODES.MATERIAL_GROUPS) return 'material-groups';
    if (activeMode === APP_MODES.COMPARE) return 'compare';
    return 'list';
}
