import { updateURL as syncLocationWithState } from '../url-state.js';
import { persistUIState } from '../ui-persistence.js';
import { attachAppControllers } from '../controllers/index.js';
import { syncCheckboxes, syncModeUi, syncPopularButtons } from '../ui/mode-ui.js';
import { attachPanelScrollGuards, toggleFiltersPanel as setFiltersPanelState } from '../ui/panels.js';
import { closeNav as closeNavPanel, isNavOpen as isNavPanelOpen, openNav as openNavPanel } from '../ui/nav-panel.js';
import { applyCollapsedSections, rememberCollapsedSection } from '../ui/collapsible-sections.js';
import { scrollToHashTarget, scrollToHashTargetWithRetry } from '../ui/hash-scroll.js';
import { getSearchQueryFromFields, setSearchQueryInFields } from '../ui/search-fields.js';
import { updateAppLayout } from '../ui/layout.js';
import { updateActiveNavLink as updateActiveNavLinkUi } from '../ui/active-nav.js';
import { scrollToGridItem } from '../ui/item-scroll.js';
import { restoreCompareVersions as restoreCompareVersionsForApp } from './compare-restore.js';
import { loadUpdatesAndRender } from './lifecycle.js';

export function rememberAppCollapsedSection(app, sectionEl) {
    if (rememberCollapsedSection(app.state, sectionEl)) {
        app.saveState();
    }
}

export function applyAppCollapsedState(app) {
    applyCollapsedSections(app.state);
}

export async function initializeAppData(app) {
    await loadUpdatesAndRender(app);
}

export function attachAppPanelScrollGuards(app) {
    attachPanelScrollGuards(app);
}

export function saveAppState(app) {
    persistUIState(app);
}

export function updateAppURL(app, clearHash = false, pushHistory = false) {
    syncLocationWithState(app, clearHash, pushHistory);
}

export function syncAppViewToggle(app) {
    syncModeUi(app);
}

export function syncAppCheckboxes(app) {
    syncCheckboxes(app);
}

export function restoreAppCompareVersions(app) {
    restoreCompareVersionsForApp(app);
}

export function getAppSearchQuery(app) {
    return getSearchQueryFromFields(app.elements);
}

export function setAppSearchQuery(app, value) {
    setSearchQueryInFields(app.elements, value);
}

export function updateAppPopularButtons(app) {
    syncPopularButtons(app);
}

export function toggleAppFiltersPanel(app, forceOpen = null) {
    setFiltersPanelState(app, forceOpen);
}

export function updateAppActiveNavLink(app) {
    updateActiveNavLinkUi(app);
}

export function attachAppEventListeners(app) {
    attachAppControllers(app);
}

export function updateAppShellLayout(app) {
    updateAppLayout(app);
}

export function isAppNavOpen(app) {
    return isNavPanelOpen(app);
}

export function openAppNav(app) {
    openNavPanel(app);
}

export function closeAppNav(app) {
    closeNavPanel(app);
}

export function scrollToAppHashTarget() {
    scrollToHashTarget();
}

export function scrollToAppHashTargetWithRetry() {
    scrollToHashTargetWithRetry();
}

export function scrollToAppItem(app, identifier) {
    scrollToGridItem(app.elements.content, identifier);
}
