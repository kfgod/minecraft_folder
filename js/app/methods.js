import { CONFIG } from '../config.js';
import { renderActiveModeView as renderActiveModeViewForApp, renderCurrentView } from './rendering.js';
import { setAppMode, toggleAppMode } from './modes.js';
import { handlePopStateNavigation } from './popstate.js';
import { getAppYearEntries, renderAppContent, renderAppNav, updateAppSearchSuggestions } from './list-view.js';
import {
    applyAppCollapsedState,
    attachAppEventListeners,
    attachAppPanelScrollGuards,
    closeAppNav,
    getAppSearchQuery,
    initializeAppData,
    isAppNavOpen,
    openAppNav,
    rememberAppCollapsedSection,
    restoreAppCompareVersions,
    saveAppState,
    scrollToAppHashTarget,
    scrollToAppHashTargetWithRetry,
    scrollToAppItem,
    setAppSearchQuery,
    syncAppCheckboxes,
    syncAppViewToggle,
    toggleAppFiltersPanel,
    updateAppActiveNavLink,
    updateAppPopularButtons,
    updateAppShellLayout,
    updateAppURL,
} from './shell.js';

export function installAppMethods(proto) {
    Object.defineProperties(proto, {
        statisticsManager: {
            get() { return this.featureManagers.get('statistics'); },
        },
        compareManager: {
            get() { return this.featureManagers.get('compare'); },
        },
        timeSinceManager: {
            get() { return this.featureManagers.get('timeSince'); },
        },
        materialGroupsManager: {
            get() { return this.featureManagers.get('materialGroups'); },
        },
    });

    Object.assign(proto, {
        ensureStatisticsManager() {
            return this.featureManagers.ensure('statistics');
        },

        ensureCompareManager() {
            return this.featureManagers.ensure('compare');
        },

        ensureTimeSinceManager() {
            return this.featureManagers.ensure('timeSince');
        },

        ensureMaterialGroupsManager() {
            return this.featureManagers.ensure('materialGroups');
        },

        rememberCollapsed(sectionEl) {
            rememberAppCollapsedSection(this, sectionEl);
        },

        applyCollapsedState() {
            applyAppCollapsedState(this);
        },

        async init() {
            this.addEventListeners();
            this.attachPanelScrollGuards();
            await this._loadUpdatesAndRender();
        },

        async _loadUpdatesAndRender() {
            await initializeAppData(this);
        },

        attachPanelScrollGuards() {
            attachAppPanelScrollGuards(this);
        },

        saveState() {
            saveAppState(this);
        },

        updateURL(clearHash = false, pushHistory = false) {
            updateAppURL(this, clearHash, pushHistory);
        },

        syncViewToggle() {
            syncAppViewToggle(this);
        },

        syncCheckboxesToState() {
            syncAppCheckboxes(this);
        },

        restoreCompareVersions() {
            restoreAppCompareVersions(this);
        },

        setMode(mode) {
            setAppMode(this, mode);
        },

        toggleMode(mode) {
            toggleAppMode(this, mode);
        },

        isYearView() {
            return this.state.currentView === CONFIG.VIEWS.YEARS;
        },

        getSearchQuery() {
            return getAppSearchQuery(this);
        },

        setSearchQuery(value) {
            setAppSearchQuery(this, value);
        },

        updatePopularButtons() {
            updateAppPopularButtons(this);
        },

        updateSearchSuggestions() {
            updateAppSearchSuggestions(this);
        },

        toggleFiltersPanel(forceOpen = null) {
            toggleAppFiltersPanel(this, forceOpen);
        },

        updateActiveNavLink() {
            updateAppActiveNavLink(this);
        },

        addEventListeners() {
            attachAppEventListeners(this);
        },

        updateLayout() {
            updateAppShellLayout(this);
        },

        isNavOpen() {
            return isAppNavOpen(this);
        },

        toggleNav() {
            if (this.isNavOpen()) {
                this.closeNav();
            } else {
                this.openNav();
            }
        },

        openNav() {
            openAppNav(this);
        },

        closeNav() {
            closeAppNav(this);
        },

        async render() {
            await renderCurrentView(this);
        },

        async renderActiveModeView() {
            await renderActiveModeViewForApp(this);
        },

        async onPopStateNavigation() {
            await handlePopStateNavigation(this);
        },

        renderNav(data) {
            renderAppNav(this, data);
        },

        renderContent(data) {
            renderAppContent(this, data);
        },

        handleHashScroll() {
            scrollToAppHashTarget();
        },

        handleHashScrollWithRetry() {
            scrollToAppHashTargetWithRetry();
        },

        scrollToItem(identifier) {
            scrollToAppItem(this, identifier);
        },

        getYearEntries() {
            return getAppYearEntries(this);
        },
    });
}
