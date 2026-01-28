/**
 * Main application module for the Minecraft Updates page
 */
import { Utils } from './utils.js';
import { CONFIG } from './config.js';
import { DOMManager } from './dom-manager.js';
import { DataManager } from './data-manager.js';
import { StatisticsManager } from './modules/statistics.js';
import { DetailViewManager } from './modules/detail-view.js';
import { CompareManager } from './modules/compare.js';
import { CardRenderer } from './modules/card-renderer.js';
import { TimeSinceManager } from './modules/time-since.js';
import { MaterialGroupsManager } from './modules/material-groups.js';
import { NavigationManager } from './modules/navigation.js';

class MinecraftUpdatesApp {
    constructor() {
        this.state = {
            allUpdates: [],
            currentView: CONFIG.VIEWS.VERSIONS,
            removeDuplicates: true,
            showBlocks: true,
            showItems: true,
            showMobs: true,
            showMobVariants: true,
            showEffects: true,
            showEnchantments: true,
            showAdvancements: true,
            showPaintings: true,
            showBiomes: true,
            showStructures: true,
            showBorders: false,
            debounceTimer: null,
            collapsedSections: {},
            compareVersions: [null, null], // Two versions to compare
            isCompareMode: false,
            isStatsMode: false,
            isTimeSinceMode: false,
            isMaterialGroupsMode: false,
            isDetailMode: false,
            detailTarget: null,
            detailReturnContext: 'list',
            scrollPositionBeforeDetail: 0,
        };

        this.elements = this.initializeElements();

        // Initialize module managers
        this.statisticsManager = new StatisticsManager(this);
        this.detailViewManager = new DetailViewManager(this);
        this.compareManager = new CompareManager(this);
        this.cardRenderer = new CardRenderer(this);
        this.timeSinceManager = new TimeSinceManager(this);
        this.materialGroupsManager = new MaterialGroupsManager(this);
        this.navigationManager = new NavigationManager(this);

        this.yearEntriesCache = null;

        // Restore UI state from localStorage and URL parameters
        this.restoreState();
        this.restoreFromURL();
        
        // Sync view toggle UI after URL restoration
        this.syncViewToggle();
    }

    /**
     * Remember collapsed state of a section in localStorage-backed state
     * Uses card id + section type as the key to uniquely identify each section
     * @param {HTMLElement} sectionEl - The section element whose state to remember
     */
    rememberCollapsed(sectionEl) {
        const card = sectionEl.closest('.update-card');
        if (!card) return;
        const cardId = card.id || 'unknown';
        const sectionType = sectionEl.getAttribute('data-section') || 'unknown';
        const key = `${cardId}:${sectionType}`;
        const isCollapsed = sectionEl.classList.contains('collapsed');
        this.state.collapsedSections[key] = isCollapsed;
        this.saveState();
    }

    /**
     * Apply collapsed state to all sections after render
     * Restores the collapsed/expanded state from localStorage for each section
     */
    applyCollapsedState() {
        const sections = document.querySelectorAll('.update-card .card-section');
        sections.forEach((sectionEl) => {
            const card = sectionEl.closest('.update-card');
            if (!card) return;
            const cardId = card.id || 'unknown';
            const sectionType = sectionEl.getAttribute('data-section') || 'unknown';
            const key = `${cardId}:${sectionType}`;
            const shouldCollapse = !!this.state.collapsedSections[key];
            if (shouldCollapse) {
                sectionEl.classList.add('collapsed');
                const header = sectionEl.querySelector('.section-title');
                if (header) header.setAttribute('aria-expanded', 'false');
            }
        });
    }

    /**
     * Initialize DOM elements
     * @returns {Object} Object containing DOM elements
     */
    initializeElements() {
        return {
            body: DOMManager.getElement(CONFIG.SELECTORS.BODY),
            main: DOMManager.getElement(CONFIG.SELECTORS.MAIN),
            content: DOMManager.getElement(CONFIG.SELECTORS.CONTENT),
            navList: DOMManager.getElement(CONFIG.SELECTORS.NAV_LIST),
            searchBar: DOMManager.getElement(CONFIG.SELECTORS.SEARCH_BAR),
            searchClearBtn: DOMManager.getElement(CONFIG.SELECTORS.SEARCH_CLEAR_BTN),
            searchContainer: document.querySelector('.search-container'),
            mobileSearchBar: DOMManager.getElement('#mobile-search-bar'),
            mobileSearchClearBtn: DOMManager.getElement('#mobile-search-clear-btn'),
            filtersFab: DOMManager.getElement('#filters-fab'),
            filtersOverlay: DOMManager.getElement('#filters-overlay'),
            toggleSwitch: DOMManager.getElement(CONFIG.SELECTORS.TOGGLE_SWITCH),
            removeDuplicatesCheckbox: DOMManager.getElement(CONFIG.SELECTORS.REMOVE_DUPLICATES_CHECKBOX),
            showBlocksCheckbox: DOMManager.getElement(CONFIG.SELECTORS.SHOW_BLOCKS_CHECKBOX),
            showItemsCheckbox: DOMManager.getElement(CONFIG.SELECTORS.SHOW_ITEMS_CHECKBOX),
            showMobsCheckbox: DOMManager.getElement(CONFIG.SELECTORS.SHOW_MOBS_CHECKBOX),
            showMobVariantsCheckbox: DOMManager.getElement(CONFIG.SELECTORS.SHOW_MOB_VARIANTS_CHECKBOX),
            showEffectsCheckbox: DOMManager.getElement(CONFIG.SELECTORS.SHOW_EFFECTS_CHECKBOX),
            showEnchantmentsCheckbox: DOMManager.getElement(CONFIG.SELECTORS.SHOW_ENCHANTMENTS_CHECKBOX),
            showAdvancementsCheckbox: DOMManager.getElement(CONFIG.SELECTORS.SHOW_ADVANCEMENTS_CHECKBOX),
            showPaintingsCheckbox: DOMManager.getElement(CONFIG.SELECTORS.SHOW_PAINTINGS_CHECKBOX),
            showBiomesCheckbox: DOMManager.getElement(CONFIG.SELECTORS.SHOW_BIOMES_CHECKBOX),
            showStructuresCheckbox: DOMManager.getElement(CONFIG.SELECTORS.SHOW_STRUCTURES_CHECKBOX),
            showBordersCheckbox: DOMManager.getElement(CONFIG.SELECTORS.SHOW_BORDERS_CHECKBOX),
            navPanel: DOMManager.getElement(CONFIG.SELECTORS.NAV_PANEL),
            navToggleBtn: DOMManager.getElement(CONFIG.SELECTORS.NAV_TOGGLE_BTN),
            overlay: DOMManager.getElement(CONFIG.SELECTORS.OVERLAY),
            navOverlay: DOMManager.getElement('#nav-overlay'),
            tooltip: DOMManager.getElement(CONFIG.SELECTORS.TOOLTIP),
            statsBtn: DOMManager.getElement('#stats-btn'),
            compareBtn: DOMManager.getElement('#compare-btn'),
            timeSinceBtn: DOMManager.getElement('#time-since-btn'),
            materialGroupsBtn: DOMManager.getElement('#material-groups-btn'),
            navFab: DOMManager.getElement('#nav-fab'),
            filtersSelectAllBtn: DOMManager.getElement('#filters-select-all'),
            filtersSelectNoneBtn: DOMManager.getElement('#filters-select-none'),
            filtersPopularBlocksBtn: DOMManager.getElement('#filters-popular-blocks'),
            filtersPopularItemsBtn: DOMManager.getElement('#filters-popular-items'),
            filtersPopularMobsBtn: DOMManager.getElement('#filters-popular-mobs'),
            navSearch: DOMManager.getElement('#nav-search'),
            navJump: DOMManager.getElement('#nav-jump'),
        };
    }

    /**
     * Initialize the application
     */
    async init() {
        this.addEventListeners();
        try {
            const indexFilePath = CONFIG.BASE_URL + CONFIG.INDEX_FILE_PATH;
            const indexData = await Utils.fetchJSON(indexFilePath);
            const fetchPromises = indexData.files.map((file) => Utils.fetchJSON(CONFIG.BASE_URL + '/' + file));
            const updatesData = await Promise.all(fetchPromises);

            // Sort updates with custom logic:
            // 1. Versions without release_date (upcoming) come first
            // 2. Versions with year-only dates come next
            // 3. Versions with full dates come last
            // Within each group, sort by date (newest first)
            this.state.allUpdates = updatesData.sort((a, b) => {
                // Upcoming versions (null release_date) come first
                if (a.release_date === null && b.release_date !== null) return -1;
                if (a.release_date !== null && b.release_date === null) return 1;
                if (a.release_date === null && b.release_date === null) return 0;

                // Year-only dates come before full dates
                const aIsYearOnly = Utils.isYearOnly(a.release_date);
                const bIsYearOnly = Utils.isYearOnly(b.release_date);

                if (aIsYearOnly && !bIsYearOnly) return -1;
                if (!aIsYearOnly && bIsYearOnly) return 1;
                if (aIsYearOnly && bIsYearOnly) {
                    // Both are year-only: sort by year (newest first)
                    return parseInt(b.release_date) - parseInt(a.release_date);
                }

                // Both have full dates: sort by date (newest first)
                const dateA = Utils.parseDate(a.release_date);
                const dateB = Utils.parseDate(b.release_date);
                if (!dateA && !dateB) return 0;
                if (!dateA) return -1;
                if (!dateB) return 1;
                return dateB - dateA;
            });

            this.updateSearchSuggestions();

            // Restore saved compare version selections
            this.restoreCompareVersions();

            this.yearEntriesCache = null;

            const pendingDetailTarget = this._urlDetailTarget || this._savedDetailTarget;
            if (this.state.isDetailMode && pendingDetailTarget) {
                this.detailViewManager.open(pendingDetailTarget.type, pendingDetailTarget.id, { silent: true, preserveContext: true });
                delete this._urlDetailTarget;
                delete this._savedDetailTarget;
            } else if (this.state.isTimeSinceMode) {
                this.timeSinceManager.render();
            } else if (this.state.isMaterialGroupsMode) {
                this.materialGroupsManager.render();
            } else {
                this.render();
            }
            this.updateLayout();

            setTimeout(() => {
                DOMManager.removeClass(this.elements.body, CONFIG.CSS_CLASSES.NO_TRANSITION);
            }, CONFIG.TRANSITION_DELAY);
        } catch (error) {
            console.error('Initialization error:', error);
            this.elements.content.innerHTML = `<p style="color: red;">Unable to load data. ${error.message}</p>`;
            DOMManager.removeClass(this.elements.body, CONFIG.CSS_CLASSES.NO_TRANSITION);
        }
    }

    /**
     * Persist current UI state to localStorage
     */
    saveState() {
        try {
            const stateToPersist = {
                currentView: this.state.currentView,
                removeDuplicates: this.state.removeDuplicates,
                showBlocks: this.state.showBlocks,
                showItems: this.state.showItems,
                showMobs: this.state.showMobs,
                showMobVariants: this.state.showMobVariants,
                showEffects: this.state.showEffects,
                showEnchantments: this.state.showEnchantments,
                showAdvancements: this.state.showAdvancements,
                showPaintings: this.state.showPaintings,
                showBiomes: this.state.showBiomes,
                showStructures: this.state.showStructures,
                collapsedSections: this.state.collapsedSections,
                isCompareMode: this.state.isCompareMode,
                isStatsMode: this.state.isStatsMode,
                isTimeSinceMode: this.state.isTimeSinceMode,
                isMaterialGroupsMode: this.state.isMaterialGroupsMode,
                isDetailMode: this.state.isDetailMode,
                detailTarget: this.state.detailTarget,
                detailReturnContext: this.state.detailReturnContext,
                compareVersionIds: this.state.compareVersions.map((v) => (v ? Utils.generateCardId(v) : null)),
            };
            localStorage.setItem('minecraft_updates_ui_state', JSON.stringify(stateToPersist));
        } catch (_) {
            // Ignore storage errors (e.g., private mode)
        }
    }

    /**
     * Restore view mode, compare settings, and search query from URL parameters
     * URL takes precedence over localStorage
     */
    restoreFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const viewParam = urlParams.get('view');

        // Validate and apply view parameter from URL
        if (
            viewParam === CONFIG.VIEWS.VERSIONS ||
            viewParam === CONFIG.VIEWS.YEARS
        ) {
            this.state.currentView = viewParam;
        }

        const modeParam = urlParams.get('mode');
        this.state.isCompareMode = modeParam === 'compare';
        this.state.isStatsMode = modeParam === 'stats';
        this.state.isTimeSinceMode = modeParam === 'time-since';
        this.state.isMaterialGroupsMode = modeParam === 'material-groups';
        this.state.isDetailMode = modeParam === 'detail';

        if (this.state.isDetailMode) {
            const detailType = urlParams.get('detailType') || 'version';
            const detailId = urlParams.get('detailId');
            if (detailId) {
                this._urlDetailTarget = { type: detailType, id: detailId };
            }
            this.state.isCompareMode = false;
            this.state.isStatsMode = false;
            this.state.isTimeSinceMode = false;
            this.state.isMaterialGroupsMode = false;
        } else if (this.state.isStatsMode) {
            this.state.isCompareMode = false;
            this.state.isTimeSinceMode = false;
            this.state.isMaterialGroupsMode = false;
        } else if (this.state.isTimeSinceMode) {
            this.state.isCompareMode = false;
            this.state.isStatsMode = false;
            this.state.isMaterialGroupsMode = false;
        } else if (this.state.isMaterialGroupsMode) {
            this.state.isCompareMode = false;
            this.state.isStatsMode = false;
            this.state.isTimeSinceMode = false;
        }

        // Restore search query from URL
        const searchParam = urlParams.get('search');
        if (searchParam) {
            this.setSearchQuery(searchParam);
        }

        // Store compare version IDs to restore after data loads
        if (this.state.isCompareMode) {
            const compare1 = urlParams.get('compare1');
            const compare2 = urlParams.get('compare2');
            if (compare1 || compare2) {
                this._urlCompareVersionIds = [compare1, compare2];
            }
        }
    }

    /**
     * Update URL with current view mode, compare settings, and search query without reloading the page
     * @param {boolean} clearHash - Whether to clear the hash from URL (default: false)
     * @param {boolean} pushHistory - Whether to push new history entry (default: false for compare selections)
     */
    updateURL(clearHash = false, pushHistory = false) {
        const url = new URL(window.location);
        url.searchParams.set('view', this.state.currentView);
        
        // Add search query to URL if present
        const searchQuery = this.getSearchQuery();
        if (searchQuery) {
            url.searchParams.set('search', searchQuery);
        } else {
            url.searchParams.delete('search');
        }
        
        if (this.state.isDetailMode && this.state.detailTarget) {
            url.searchParams.set('mode', 'detail');
            url.searchParams.set('detailType', this.state.detailTarget.type);
            url.searchParams.set('detailId', this.state.detailTarget.id);
            url.searchParams.delete('compare1');
            url.searchParams.delete('compare2');
        } else if (this.state.isStatsMode) {
            url.searchParams.set('mode', 'stats');
            url.searchParams.delete('compare1');
            url.searchParams.delete('compare2');
            url.searchParams.delete('detailType');
            url.searchParams.delete('detailId');
        } else if (this.state.isTimeSinceMode) {
            url.searchParams.set('mode', 'time-since');
            url.searchParams.delete('compare1');
            url.searchParams.delete('compare2');
            url.searchParams.delete('detailType');
            url.searchParams.delete('detailId');
        } else if (this.state.isMaterialGroupsMode) {
            url.searchParams.set('mode', 'material-groups');
            url.searchParams.delete('compare1');
            url.searchParams.delete('compare2');
            url.searchParams.delete('detailType');
            url.searchParams.delete('detailId');
        } else if (this.state.isCompareMode) {
            url.searchParams.set('mode', 'compare');

            const [version1, version2] = this.state.compareVersions;
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
        
        // Clear hash if requested (e.g., when switching views)
        if (clearHash) {
            url.hash = '';
        }
        
        // Use pushState for view changes, replaceState for compare selections
        const historyState = {
            view: this.state.currentView,
            mode: this.state.isDetailMode
                ? 'detail'
                : this.state.isStatsMode
                ? 'stats'
                : this.state.isTimeSinceMode
                ? 'time-since'
                : this.state.isMaterialGroupsMode
                ? 'material-groups'
                : this.state.isCompareMode
                ? 'compare'
                : 'list'
        };
        if (pushHistory) {
            window.history.pushState(historyState, '', url);
        } else {
            window.history.replaceState(historyState, '', url);
        }
    }

    /**
     * Restore UI state from localStorage and apply to controls
     */
    restoreState() {
        try {
            const raw = localStorage.getItem('minecraft_updates_ui_state');
            if (!raw) return;
            const saved = JSON.parse(raw);

            // Restore view mode (will be overridden by URL if present)
            if (
                saved.currentView === CONFIG.VIEWS.VERSIONS ||
                saved.currentView === CONFIG.VIEWS.YEARS
            ) {
                this.state.currentView = saved.currentView;
            }

            // Restore boolean state properties
            const booleanProps = [
                'removeDuplicates', 'showBlocks', 'showItems', 'showMobs',
                'showMobVariants', 'showEffects', 'showEnchantments',
                'showAdvancements', 'showPaintings', 'showBiomes', 'showStructures'
            ];
            booleanProps.forEach(prop => {
                if (typeof saved[prop] === 'boolean') {
                    this.state[prop] = saved[prop];
                }
            });

            // Restore collapsed sections
            if (saved.collapsedSections && typeof saved.collapsedSections === 'object') {
                this.state.collapsedSections = saved.collapsedSections;
            }

            if (typeof saved.isCompareMode === 'boolean') {
                this.state.isCompareMode = saved.isCompareMode;
            }

            if (typeof saved.isStatsMode === 'boolean') {
                this.state.isStatsMode = saved.isStatsMode;
            }

            if (typeof saved.isTimeSinceMode === 'boolean') {
                this.state.isTimeSinceMode = saved.isTimeSinceMode;
            }

            if (typeof saved.isMaterialGroupsMode === 'boolean') {
                this.state.isMaterialGroupsMode = saved.isMaterialGroupsMode;
            }

            if (this.state.isStatsMode) {
                this.state.isCompareMode = false;
                this.state.isTimeSinceMode = false;
            }

            if (this.state.isTimeSinceMode) {
                this.state.isCompareMode = false;
                this.state.isStatsMode = false;
                this.state.isMaterialGroupsMode = false;
            }

            if (this.state.isMaterialGroupsMode) {
                this.state.isCompareMode = false;
                this.state.isStatsMode = false;
                this.state.isTimeSinceMode = false;
            }

            if (typeof saved.isDetailMode === 'boolean') {
                this.state.isDetailMode = saved.isDetailMode;
            }

            if (saved.detailTarget) {
                this.state.detailTarget = saved.detailTarget;
                this._savedDetailTarget = saved.detailTarget;
            }

            if (saved.detailReturnContext) {
                this.state.detailReturnContext = saved.detailReturnContext;
            }

            if (this.state.isDetailMode) {
                this.state.isStatsMode = false;
                this.state.isCompareMode = false;
                this.state.isTimeSinceMode = false;
                this.state.isMaterialGroupsMode = false;
            }

            // Store compare version IDs temporarily (will resolve after data loads)
            if (Array.isArray(saved.compareVersionIds)) {
                this._savedCompareVersionIds = saved.compareVersionIds;
            }
        } catch (_) {
            // Ignore parse/storage errors
        }

        // Apply restored state to UI controls
        this.syncCheckboxesToState();
        this.syncViewToggle();
    }

    /**
     * Synchronize view toggle buttons with internal state
     */
    syncViewToggle() {
        // Update the view toggle active class to match current state
        if (this.elements.toggleSwitch) {
            const activeElement = this.elements.toggleSwitch.querySelector(`.${CONFIG.CSS_CLASSES.ACTIVE}`);
            if (activeElement) DOMManager.removeClass(activeElement, CONFIG.CSS_CLASSES.ACTIVE);
            const target = this.elements.toggleSwitch.querySelector(`[data-view="${this.state.currentView}"]`);
            if (target) DOMManager.addClass(target, CONFIG.CSS_CLASSES.ACTIVE);
            
            // Disable toggle switch in time-since or material-groups mode
            if (this.state.isTimeSinceMode || this.state.isMaterialGroupsMode) {
                DOMManager.addClass(this.elements.toggleSwitch, 'disabled');
            } else {
                DOMManager.removeClass(this.elements.toggleSwitch, 'disabled');
            }
        }

        if (this.elements.compareBtn) {
            if (this.state.isCompareMode) {
                DOMManager.addClass(this.elements.compareBtn, 'active');
            } else {
                DOMManager.removeClass(this.elements.compareBtn, 'active');
            }
        }

        if (this.elements.statsBtn) {
            if (this.state.isStatsMode) {
                DOMManager.addClass(this.elements.statsBtn, 'active');
            } else {
                DOMManager.removeClass(this.elements.statsBtn, 'active');
            }
        }

        if (this.elements.timeSinceBtn) {
            if (this.state.isTimeSinceMode) {
                DOMManager.addClass(this.elements.timeSinceBtn, 'active');
            } else {
                DOMManager.removeClass(this.elements.timeSinceBtn, 'active');
            }
        }

        if (this.elements.materialGroupsBtn) {
            if (this.state.isMaterialGroupsMode) {
                DOMManager.addClass(this.elements.materialGroupsBtn, 'active');
            } else {
                DOMManager.removeClass(this.elements.materialGroupsBtn, 'active');
            }
        }

        if (this.state.isCompareMode) {
            DOMManager.addClass(this.elements.body, 'compare-mode');
        } else {
            DOMManager.removeClass(this.elements.body, 'compare-mode');
        }

        if (this.state.isStatsMode) {
            DOMManager.addClass(this.elements.body, 'stats-mode');
        } else {
            DOMManager.removeClass(this.elements.body, 'stats-mode');
        }

        if (this.state.isTimeSinceMode) {
            DOMManager.addClass(this.elements.body, 'time-since-mode');
        } else {
            DOMManager.removeClass(this.elements.body, 'time-since-mode');
        }

        if (this.state.isMaterialGroupsMode) {
            DOMManager.addClass(this.elements.body, 'material-groups-mode');
        } else {
            DOMManager.removeClass(this.elements.body, 'material-groups-mode');
        }

        if (this.state.isDetailMode) {
            DOMManager.addClass(this.elements.body, 'detail-mode');
        } else {
            DOMManager.removeClass(this.elements.body, 'detail-mode');
        }

        // Enable/disable search bar based on mode
        if (this.elements.searchBar) {
            if (this.state.isTimeSinceMode || this.state.isStatsMode || this.state.isMaterialGroupsMode) {
                this.elements.searchBar.disabled = true;
                this.elements.searchBar.placeholder = 'Search disabled';
            } else {
                this.elements.searchBar.disabled = false;
                this.elements.searchBar.placeholder = 'Search across all content...';
            }
        }

        if (this.elements.mobileSearchBar) {
            if (this.state.isTimeSinceMode || this.state.isStatsMode || this.state.isMaterialGroupsMode) {
                this.elements.mobileSearchBar.disabled = true;
                this.elements.mobileSearchBar.placeholder = 'Search disabled';
            } else {
                this.elements.mobileSearchBar.disabled = false;
                this.elements.mobileSearchBar.placeholder = 'Search across all content...';
            }
        }

        this.updatePopularButtons();
    }

    /**
     * Synchronize checkbox states with internal state
     */
    syncCheckboxesToState() {
        const checkboxMap = {
            removeDuplicatesCheckbox: 'removeDuplicates',
            showBlocksCheckbox: 'showBlocks',
            showItemsCheckbox: 'showItems',
            showMobsCheckbox: 'showMobs',
            showMobVariantsCheckbox: 'showMobVariants',
            showEffectsCheckbox: 'showEffects',
            showEnchantmentsCheckbox: 'showEnchantments',
            showAdvancementsCheckbox: 'showAdvancements',
            showPaintingsCheckbox: 'showPaintings',
            showBiomesCheckbox: 'showBiomes',
            showStructuresCheckbox: 'showStructures',
            showBordersCheckbox: 'showBorders'
        };

        Object.entries(checkboxMap).forEach(([elementKey, stateKey]) => {
            if (this.elements[elementKey]) {
                this.elements[elementKey].checked = this.state[stateKey];
            }
        });
    }

    /**
     * Restore saved compare version selections after data loads
     * Resolves saved version IDs back to actual version objects
     * Prioritizes URL parameters over localStorage
     */
    restoreCompareVersions() {
        // Prioritize URL parameters over localStorage
        const compareVersionIds = this._urlCompareVersionIds || this._savedCompareVersionIds;
        
        if (!compareVersionIds || !Array.isArray(compareVersionIds)) {
            return;
        }

        const dataSource =
            this.state.currentView === CONFIG.VIEWS.YEARS
                ? DataManager.groupByYear(this.state.allUpdates)
                : this.state.allUpdates;

        this.state.compareVersions = compareVersionIds.map((id) => {
            if (!id) return null;
            return dataSource.find((item) => Utils.generateCardId(item) === id) || null;
        });

        // Clean up temporary storage
        delete this._savedCompareVersionIds;
        delete this._urlCompareVersionIds;
    }

    /**
     * Get current active mode
     * @returns {string} Current mode name
     */
    getCurrentMode() {
        if (this.state.isDetailMode) return 'detail';
        if (this.state.isCompareMode) return 'compare';
        if (this.state.isStatsMode) return 'stats';
        if (this.state.isTimeSinceMode) return 'time-since';
        if (this.state.isMaterialGroupsMode) return 'material-groups';
        return 'list';
    }

    /**
     * Set exclusive mode and render
     * @param {string} mode - Mode name
     */
    setMode(mode) {
        const previousMode = this.getCurrentMode();

        if (previousMode === 'stats' && mode !== 'stats') {
            this.statisticsManager.reset();
        }
        if (previousMode === 'time-since' && mode !== 'time-since') {
            this.timeSinceManager.reset();
        }
        if (previousMode === 'material-groups' && mode !== 'material-groups') {
            this.materialGroupsManager.reset();
        }

        this.state.isCompareMode = mode === 'compare';
        this.state.isStatsMode = mode === 'stats';
        this.state.isTimeSinceMode = mode === 'time-since';
        this.state.isMaterialGroupsMode = mode === 'material-groups';
        this.state.isDetailMode = mode === 'detail';

        if (mode !== 'detail') {
            this.state.detailTarget = null;
            this.state.detailReturnContext = 'list';
        }

        this.syncViewToggle();
        this.updateURL(true, true);
        this.saveState();
        this.render();
        this.updateLayout();
        window.scrollTo({ top: 0, behavior: 'auto' });
    }

    /**
     * Toggle between list mode and a specific mode
     * @param {string} mode - Mode name to toggle
     */
    toggleMode(mode) {
        const isActive = this.getCurrentMode() === mode;
        this.setMode(isActive ? 'list' : mode);
    }

    getSearchQuery() {
        if (this.elements.mobileSearchBar && this.elements.mobileSearchBar.value.trim()) {
            return this.elements.mobileSearchBar.value.trim();
        }
        return this.elements.searchBar.value.trim();
    }

    setSearchQuery(value) {
        if (this.elements.searchBar) {
            this.elements.searchBar.value = value;
        }
        if (this.elements.mobileSearchBar) {
            this.elements.mobileSearchBar.value = value;
        }
        const hasValue = value.length > 0;
        DOMManager.setVisibility(this.elements.searchClearBtn, hasValue);
        if (this.elements.mobileSearchClearBtn) {
            DOMManager.setVisibility(this.elements.mobileSearchClearBtn, hasValue);
        }
    }

    updatePopularButtons() {
        const buttons = [
            { el: this.elements.filtersPopularBlocksBtn, state: this.state.showBlocks },
            { el: this.elements.filtersPopularItemsBtn, state: this.state.showItems },
            { el: this.elements.filtersPopularMobsBtn, state: this.state.showMobs },
        ];
        buttons.forEach(({ el, state }) => {
            if (!el) return;
            if (state) {
                DOMManager.addClass(el, 'active');
            } else {
                DOMManager.removeClass(el, 'active');
            }
        });
    }

    updateSearchSuggestions() {
        const datalist = document.getElementById('search-suggestions');
        if (!datalist) return;
        const suggestions = DataManager.getNameSuggestions(this.state.allUpdates, 80);
        datalist.innerHTML = suggestions.map((name) => `<option value="${name}"></option>`).join('');
    }

    toggleFiltersPanel(forceOpen = null) {
        if (!this.elements.body) return;
        const willOpen = forceOpen === null ? !this.elements.body.classList.contains('filters-open') : forceOpen;
        if (willOpen) {
            DOMManager.addClass(this.elements.body, 'filters-open');
        } else {
            DOMManager.removeClass(this.elements.body, 'filters-open');
        }
    }

    updateActiveNavLink() {
        if (this.state.isDetailMode) return;
        const navLinks = this.elements.navList?.querySelectorAll('a[href^="#"]');
        if (!navLinks || navLinks.length === 0) return;
        const cards = this.elements.content?.querySelectorAll('.update-card');
        if (!cards || cards.length === 0) return;

        let currentId = null;
        const offset = 120;
        cards.forEach((card) => {
            const rect = card.getBoundingClientRect();
            if (rect.top <= offset && rect.bottom > offset) {
                currentId = card.id;
            }
        });

        navLinks.forEach((link) => {
            const href = link.getAttribute('href') || '';
            const isActive = currentId && href === `#${currentId}`;
            if (isActive) {
                link.classList.add('is-active');
            } else {
                link.classList.remove('is-active');
            }
        });
    }

    getResultsSummary(data) {
        const query = this.getSearchQuery();
        const entryCount = data.length;
        let itemCount = 0;
        const visibilityMap = {
            blocks: this.state.showBlocks,
            items: this.state.showItems,
            mobs: this.state.showMobs,
            mob_variants: this.state.showMobVariants,
            effects: this.state.showEffects,
            enchantments: this.state.showEnchantments,
            advancements: this.state.showAdvancements,
            paintings: this.state.showPaintings,
            biomes: this.state.showBiomes,
            structures: this.state.showStructures,
        };
        data.forEach((entry) => {
            DataManager.CONTENT_TYPES.forEach((type) => {
                if (!visibilityMap[type]) return;
                itemCount += entry.added?.[type]?.length || 0;
            });
        });
        return { query, entryCount, itemCount };
    }

    /**
     * Add event listeners to DOM elements
     */
    addEventListeners() {
        // Search functionality
        const searchDebounce = Utils.debounce(() => {
            this.updateURL(false, false);
            if (this.state.isCompareMode) {
                this.compareManager.renderCards();
            } else if (this.state.isStatsMode) {
                // Search disabled in stats mode
                return;
            } else if (this.state.isTimeSinceMode) {
                // Search disabled in time-since mode
                return;
            } else if (this.state.isMaterialGroupsMode) {
                // Search disabled in material-groups mode
                return;
            } else if (this.state.isDetailMode) {
                this.detailViewManager.render();
            } else {
                this.render();
            }
        }, CONFIG.DEBOUNCE_DELAY);

        const handleSearchInput = (value) => {
            if (this.state.isStatsMode || this.state.isTimeSinceMode || this.state.isMaterialGroupsMode) {
                return;
            }
            this.setSearchQuery(value);
            searchDebounce();
        };

        this.elements.searchBar.addEventListener('input', () => {
            handleSearchInput(this.elements.searchBar.value);
        });

        if (this.elements.mobileSearchBar) {
            this.elements.mobileSearchBar.addEventListener('input', () => {
                handleSearchInput(this.elements.mobileSearchBar.value);
            });
        }

        this.elements.searchClearBtn.addEventListener('click', () => {
            this.setSearchQuery('');
            this.updateURL(false, false);
            if (this.state.isCompareMode) {
                this.compareManager.renderCards();
            } else if (this.state.isStatsMode) {
                this.statisticsManager.render();
            } else if (this.state.isTimeSinceMode) {
                this.timeSinceManager.render();
            } else if (this.state.isDetailMode) {
                this.detailViewManager.render();
            } else {
                this.render();
            }
            window.scrollTo({ top: 0, behavior: 'auto' });
        });

        if (this.elements.mobileSearchClearBtn) {
            this.elements.mobileSearchClearBtn.addEventListener('click', () => {
                this.setSearchQuery('');
                this.updateURL(false, false);
                if (this.state.isCompareMode) {
                    this.compareManager.renderCards();
                } else if (this.state.isStatsMode) {
                    this.statisticsManager.render();
                } else if (this.state.isTimeSinceMode) {
                    this.timeSinceManager.render();
                } else if (this.state.isDetailMode) {
                    this.detailViewManager.render();
                } else {
                    this.render();
                }
                window.scrollTo({ top: 0, behavior: 'auto' });
            });
        }

        // Toggle switch for view mode
        this.elements.toggleSwitch.addEventListener('click', (e) => {
            // Disable toggle switch in time-since or material-groups mode
            if (this.state.isTimeSinceMode || this.state.isMaterialGroupsMode) {
                return;
            }

            const targetView = e.target.dataset.view;

            if (targetView && this.state.currentView === targetView) {
                const url = new URL(window.location);
                url.hash = '';
                window.history.replaceState({}, '', url);
                window.scrollTo({ top: 0, behavior: 'instant' });
                return;
            }
            
            if (targetView && this.state.currentView !== targetView) {
                this.state.currentView = targetView;
                if (this.state.isCompareMode) {
                    this.state.compareVersions = [null, null];
                    this.restoreCompareVersions();
                }
                 if (this.state.isDetailMode) {
                     this.state.isDetailMode = false;
                     this.state.detailTarget = null;
                     this.state.detailReturnContext = 'list';
                 }
                 if (this.state.isTimeSinceMode) {
                     this.state.isTimeSinceMode = false;
                     this.timeSinceManager.reset();
                 }
                this.syncViewToggle();
                this.updateURL(true, true);
                this.saveState();
                this.render();
                this.updateLayout();
                window.scrollTo({ top: 0, behavior: 'instant' });
            }
        });

        this.elements.toggleSwitch.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            const target = e.target.closest('.toggle-switch-label');
            if (!target) return;
            e.preventDefault();
            target.click();
        });

        if (this.elements.compareBtn) {
            this.elements.compareBtn.addEventListener('click', () => {
                this.toggleMode('compare');
            });
        }

        if (this.elements.statsBtn) {
            this.elements.statsBtn.addEventListener('click', () => {
                this.toggleMode('stats');
            });
        }

        if (this.elements.timeSinceBtn) {
            this.elements.timeSinceBtn.addEventListener('click', () => {
                this.toggleMode('time-since');
            });
        } else {
            console.warn('Time Since button not found');
        }

        if (this.elements.materialGroupsBtn) {
            this.elements.materialGroupsBtn.addEventListener('click', () => {
                this.toggleMode('material-groups');
            });
        } else {
            console.warn('Material Groups button not found');
        }

        // Attach checkbox event listeners using helper method
        this.attachCheckboxListener('removeDuplicatesCheckbox', 'removeDuplicates');
        this.attachCheckboxListener('showBlocksCheckbox', 'showBlocks');
        this.attachCheckboxListener('showItemsCheckbox', 'showItems');
        this.attachCheckboxListener('showMobsCheckbox', 'showMobs');
        this.attachCheckboxListener('showMobVariantsCheckbox', 'showMobVariants');
        this.attachCheckboxListener('showEffectsCheckbox', 'showEffects');
        this.attachCheckboxListener('showEnchantmentsCheckbox', 'showEnchantments');
        this.attachCheckboxListener('showAdvancementsCheckbox', 'showAdvancements');
        this.attachCheckboxListener('showPaintingsCheckbox', 'showPaintings');
        this.attachCheckboxListener('showBiomesCheckbox', 'showBiomes');
        this.attachCheckboxListener('showStructuresCheckbox', 'showStructures');

        if (this.elements.filtersSelectAllBtn) {
            this.elements.filtersSelectAllBtn.addEventListener('click', () => {
                const keys = [
                    'showBlocks',
                    'showItems',
                    'showMobs',
                    'showMobVariants',
                    'showEffects',
                    'showEnchantments',
                    'showAdvancements',
                    'showPaintings',
                    'showBiomes',
                    'showStructures',
                ];
                keys.forEach((key) => {
                    this.state[key] = true;
                });
                this.syncCheckboxesToState();
                this.updatePopularButtons();
                this.saveState();
                this.render();
            });
        }

        if (this.elements.filtersSelectNoneBtn) {
            this.elements.filtersSelectNoneBtn.addEventListener('click', () => {
                const keys = [
                    'showBlocks',
                    'showItems',
                    'showMobs',
                    'showMobVariants',
                    'showEffects',
                    'showEnchantments',
                    'showAdvancements',
                    'showPaintings',
                    'showBiomes',
                    'showStructures',
                ];
                keys.forEach((key) => {
                    this.state[key] = false;
                });
                this.syncCheckboxesToState();
                this.updatePopularButtons();
                this.saveState();
                this.render();
            });
        }

        const attachPopularToggle = (element, stateKey) => {
            if (!element) return;
            element.addEventListener('click', () => {
                this.state[stateKey] = !this.state[stateKey];
                this.syncCheckboxesToState();
                this.updatePopularButtons();
                this.saveState();
                this.render();
            });
        };

        attachPopularToggle(this.elements.filtersPopularBlocksBtn, 'showBlocks');
        attachPopularToggle(this.elements.filtersPopularItemsBtn, 'showItems');
        attachPopularToggle(this.elements.filtersPopularMobsBtn, 'showMobs');

        // Attach remaining event listeners
        this.attachContentEventListeners();
        this.attachNavigationEventListeners();
        this.attachNavPanelEventListeners();
        this.attachTooltipEventListeners();
        this.attachResizeListener();
        this.attachFiltersPanelListeners();
    }

    attachFiltersPanelListeners() {
        if (this.elements.filtersFab) {
            this.elements.filtersFab.addEventListener('click', () => {
                this.toggleFiltersPanel();
            });
        }
        if (this.elements.filtersOverlay) {
            this.elements.filtersOverlay.addEventListener('click', () => {
                this.toggleFiltersPanel(false);
            });
        }
        if (this.elements.navFab) {
            this.elements.navFab.addEventListener('click', () => {
                this.toggleNav();
            });
        }
        if (this.elements.navOverlay) {
            this.elements.navOverlay.addEventListener('click', () => {
                this.closeNav();
            });
        }
    }

    /**
     * Attach checkbox change event listener
     * @param {string} elementKey - Key in this.elements for the checkbox
     * @param {string} stateKey - Key in this.state to update
     */
    attachCheckboxListener(elementKey, stateKey) {
        this.elements[elementKey].addEventListener('change', (e) => {
            this.state[stateKey] = e.target.checked;
            this.saveState();
            this.updatePopularButtons();
            if (this.state.isCompareMode) {
                this.compareManager.renderCards();
            } else if (this.state.isStatsMode) {
                // Update only chart and table, not the entire view
                const isYearView = this.state.currentView === CONFIG.VIEWS.YEARS;
                this.statisticsManager.renderChart(isYearView);
                this.statisticsManager.renderContentTable();
            } else if (this.state.isTimeSinceMode) {
                this.timeSinceManager.render();
            } else if (this.state.isDetailMode) {
                this.detailViewManager.render();
            } else {
                this.render();
            }
        });
    }

    /**
     * Attach event listeners for content interactions (screenshots, collapsible sections, etc.)
     */
    attachContentEventListeners() {
        // Screenshot functionality and collapsible sections
        this.elements.content.addEventListener('click', (e) => {
            const detailCloseBtn = e.target.closest('.detail-close-btn');
            if (detailCloseBtn) {
                e.preventDefault();
                this.detailViewManager.close();
                return;
            }

            const detailTrigger = e.target.closest('.detail-link');
            if (detailTrigger) {
                e.preventDefault();
                const detailType =
                    detailTrigger.dataset.detailType ||
                    (this.state.currentView === CONFIG.VIEWS.YEARS ? 'year' : 'version');
                const detailId =
                    detailTrigger.dataset.detailId || detailTrigger.textContent.trim();
                this.detailViewManager.open(detailType, detailId);
                return;
            }

            const button = e.target.closest('.screenshot-btn');
            if (button) {
                this.cardRenderer.takeScreenshot(button.closest('.update-card'));
                return;
            }

            // Handle scroll-to-item clicks
            const scrollLink = e.target.closest('.scroll-to-item');
            if (scrollLink) {
                e.preventDefault();
                const targetIdentifier = scrollLink.dataset.targetIdentifier;
                const targetType = scrollLink.dataset.targetType;
                this.scrollToItem(targetIdentifier, targetType);
                return;
            }

            // Handle mob card clicks - open wiki if not clicking on nested links
            const clickableCard = e.target.closest('.clickable-card');
            if (clickableCard && clickableCard.dataset.wiki) {
                // Check if click was on a nested link (spawn egg or parent mob)
                const isNestedLink = e.target.closest('a');
                if (!isNestedLink) {
                    // Click was on the card itself, not on a nested link
                    window.open(clickableCard.dataset.wiki, '_blank', 'noopener,noreferrer');
                    return;
                }
            }

            const header = e.target.closest('.section-title');
            if (header) {
                const section = header.closest('.card-section');
                if (section) {
                    const isCollapsed = section.classList.toggle('collapsed');
                    header.setAttribute('aria-expanded', String(!isCollapsed));
                    this.rememberCollapsed(section);
                }
            }
        });

        this.elements.content.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            const header = e.target.closest && e.target.closest('.section-title');
            if (header) {
                e.preventDefault();
                const section = header.closest('.card-section');
                if (section) {
                    const isCollapsed = section.classList.toggle('collapsed');
                    header.setAttribute('aria-expanded', String(!isCollapsed));
                    this.rememberCollapsed(section);
                }
            }
        });

    }

    /**
     * Attach event listeners for navigation panel controls
     */
    attachNavigationEventListeners() {
        if (this.elements.navToggleBtn) {
            this.elements.navToggleBtn.addEventListener('click', () => this.toggleNav());
        }
        if (this.elements.overlay) {
            this.elements.overlay.addEventListener('click', () => this.closeNav());
        }

        this.elements.navList.addEventListener('click', (e) => {
            if (e.target.closest('a') && DOMManager.hasClass(this.elements.body, CONFIG.CSS_CLASSES.MOBILE_LAYOUT)) {
                this.closeNav();
            }
        });

        if (this.elements.navSearch) {
            this.elements.navSearch.addEventListener('input', () => {
                this.navigationManager.applyNavFilter(this.elements.navSearch.value);
            });
        }

        if (this.elements.navJump) {
            this.elements.navJump.addEventListener('change', (e) => {
                const targetId = e.target.value;
                if (!targetId) return;
                const link = this.elements.navList.querySelector(`a[href="#${targetId}"]`);
                if (link) {
                    link.click();
                } else {
                    const target = document.getElementById(targetId);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
                e.target.value = '';
            });
        }

        const updateActive = Utils.debounce(() => this.updateActiveNavLink(), 80);
        window.addEventListener('scroll', updateActive, { passive: true });
    }

    /**
     * Attach event listeners for navigation panel interactions (detail view)
     */
    attachNavPanelEventListeners() {
        this.elements.navList.addEventListener('click', (e) => {
            // Handle statistics item clicks (scroll to section)
            const statItem = e.target.closest('.nav-stat-item');
            if (statItem && this.state.isDetailMode) {
                e.preventDefault();
                const sectionType = statItem.getAttribute('data-section-type');
                if (sectionType) {
                    this.navigationManager.scrollToSection(sectionType);
                }
                if (DOMManager.hasClass(this.elements.body, CONFIG.CSS_CLASSES.MOBILE_LAYOUT)) {
                    this.closeNav();
                }
                return;
            }

            // Handle version navigation button clicks (previous/next)
            const versionNavBtn = e.target.closest('.nav-version-nav-btn');
            if (versionNavBtn && this.state.isDetailMode) {
                e.preventDefault();
                const detailType = versionNavBtn.getAttribute('data-detail-type');
                const detailId = versionNavBtn.getAttribute('data-detail-id');
                if (detailType && detailId) {
                    this.detailViewManager.open(detailType, detailId);
                }
                if (DOMManager.hasClass(this.elements.body, CONFIG.CSS_CLASSES.MOBILE_LAYOUT)) {
                    this.closeNav();
                }
                return;
            }
        });
    }

    /**
     * Attach window resize event listener
     */
    attachResizeListener() {
        const resizeDebounce = Utils.debounce(() => this.updateLayout(), CONFIG.RESIZE_DEBOUNCE_DELAY);
        window.addEventListener('resize', resizeDebounce);
    }

    /**
     * Attach tooltip event listeners
     */
    attachTooltipEventListeners() {
        // Tooltip handlers - use mouseover to handle all areas including gaps
        let currentTooltipItem = null;

        this.elements.content.addEventListener('mouseover', (e) => {
            const tooltipItem = e.target.closest('.grid-item, .tooltip-wrapper');
            if (tooltipItem && tooltipItem !== currentTooltipItem) {
                const tooltipText = tooltipItem.dataset.tooltip;
                if (tooltipText) {
                    currentTooltipItem = tooltipItem;
                    DOMManager.showTooltip(this.elements.tooltip, tooltipItem, tooltipText);
                }
            }
        });

        this.elements.content.addEventListener('mouseout', (e) => {
            const tooltipItem = e.target.closest('.grid-item, .tooltip-wrapper');
            // Check if we're leaving the tooltip item entirely
            if (tooltipItem && !tooltipItem.contains(e.relatedTarget)) {
                if (currentTooltipItem === tooltipItem) {
                    currentTooltipItem = null;
                    DOMManager.hideTooltip(this.elements.tooltip);
                }
            }
        });

        // Update tooltip position on scroll
        window.addEventListener(
            'scroll',
            () => {
                if (currentTooltipItem) {
                    const tooltipText = currentTooltipItem.dataset.tooltip;
                    if (tooltipText) {
                        DOMManager.showTooltip(this.elements.tooltip, currentTooltipItem, tooltipText);
                    }
                }
            },
            { passive: true }
        );
    }

    /**
     * Update layout based on available space
     * Switches between mobile and desktop layouts dynamically
     */
    updateLayout() {
        const isMobile = window.innerWidth < CONFIG.MOBILE_BREAKPOINT;

        if (isMobile) {
            DOMManager.addClass(this.elements.body, CONFIG.CSS_CLASSES.MOBILE_LAYOUT);
            DOMManager.removeClass(this.elements.body, CONFIG.CSS_CLASSES.DESKTOP_LAYOUT);
        } else {
            DOMManager.addClass(this.elements.body, CONFIG.CSS_CLASSES.DESKTOP_LAYOUT);
            DOMManager.removeClass(this.elements.body, CONFIG.CSS_CLASSES.MOBILE_LAYOUT);
            this.closeNav();
            this.toggleFiltersPanel(false);
        }
    }

    /**
     * Toggle navigation panel
     */
    toggleNav() {
        if (DOMManager.hasClass(this.elements.navPanel, CONFIG.CSS_CLASSES.VISIBLE)) {
            this.closeNav();
        } else {
            this.openNav();
        }
    }

    /**
     * Open navigation panel
     */
    openNav() {
        if (DOMManager.hasClass(this.elements.body, CONFIG.CSS_CLASSES.MOBILE_LAYOUT)) {
            DOMManager.addClass(this.elements.body, 'nav-open');
            if (this.elements.navOverlay) {
                DOMManager.addClass(this.elements.navOverlay, CONFIG.CSS_CLASSES.VISIBLE);
            }
        } else {
            DOMManager.addClass(this.elements.navPanel, CONFIG.CSS_CLASSES.VISIBLE);
            DOMManager.addClass(this.elements.overlay, CONFIG.CSS_CLASSES.VISIBLE);
            DOMManager.setAttribute(this.elements.navToggleBtn, 'aria-expanded', 'true');
        }
    }

    /**
     * Close navigation panel
     */
    closeNav() {
        if (DOMManager.hasClass(this.elements.body, CONFIG.CSS_CLASSES.MOBILE_LAYOUT)) {
            DOMManager.removeClass(this.elements.body, 'nav-open');
            if (this.elements.navOverlay) {
                DOMManager.removeClass(this.elements.navOverlay, CONFIG.CSS_CLASSES.VISIBLE);
            }
        } else {
            DOMManager.removeClass(this.elements.navPanel, CONFIG.CSS_CLASSES.VISIBLE);
            DOMManager.removeClass(this.elements.overlay, CONFIG.CSS_CLASSES.VISIBLE);
            DOMManager.setAttribute(this.elements.navToggleBtn, 'aria-expanded', 'false');
        }
    }

    /**
     * Render the main content and navigation
     */
    render() {
        if (this.state.isDetailMode) {
            this.detailViewManager.render();
            return;
        }

        if (this.state.isStatsMode) {
            this.statisticsManager.render();
            return;
        }

        if (this.state.isTimeSinceMode) {
            this.timeSinceManager.render();
            return;
        }

        if (this.state.isMaterialGroupsMode) {
            this.materialGroupsManager.render();
            return;
        }

        if (this.state.isCompareMode) {
            this.compareManager.render();
            return;
        }

        const query = this.getSearchQuery().toLowerCase();
        const filteredData = DataManager.getFilteredData(
            this.state.allUpdates,
            this.state.currentView,
            query,
            this.state.removeDuplicates,
            this.state.showBlocks,
            this.state.showItems,
            this.state.showMobs,
            this.state.showMobVariants,
            this.state.showEffects,
            this.state.showEnchantments,
            this.state.showAdvancements,
            this.state.showPaintings,
            this.state.showBiomes,
            this.state.showStructures
        );
        this.renderNav(filteredData);
        this.renderContent(filteredData);
    }

    /**
     * Render navigation list with links to each update card
     * @param {Array} data - Array of update/year data to create navigation items for
     */
    renderNav(data) {
        if (this.state.isDetailMode) {
            // Navigation for detail view is handled by DetailViewManager
            return;
        }
        this.navigationManager.renderListNav(data);
        this.updateActiveNavLink();
    }

    /**
     * Render main content
     * @param {Array} data - Data to render
     */
    renderContent(data) {
        DOMManager.clearContainer(this.elements.content);
        const summary = this.getResultsSummary(data);
        const safeQuery = Utils.escapeHtml(summary.query);
        const summaryText = summary.query
            ? `Results for "<strong>${safeQuery}</strong>": <strong>${summary.entryCount}</strong> entries, <strong>${summary.itemCount}</strong> items`
            : `Results: <strong>${summary.entryCount}</strong> entries, <strong>${summary.itemCount}</strong> items`;
        this.elements.content.insertAdjacentHTML(
            'beforeend',
            `<div class="results-summary">${summaryText}</div>`
        );

        if (data.length === 0) {
            const emptyMessage = summary.query ? `No results found for "${safeQuery}"` : 'No content available';
            this.elements.content.insertAdjacentHTML('beforeend', `<p class="empty-state">${emptyMessage}</p>`);
            return;
        }

        const cards = data.map((item) => this.cardRenderer.createCard(item));
        const fragment = DOMManager.createFragment(cards);
        this.elements.content.appendChild(fragment);

        // Apply collapsed state after render
        this.applyCollapsedState();
        
        // Check if we need to scroll to a specific card (from hash)
        this.handleHashScroll();
    }

    /**
     * Handle scrolling to card based on URL hash
     */
    handleHashScroll() {
        const hash = window.location.hash;
        if (hash && hash.length > 1) {
            const target = document.querySelector(hash);
            if (target) {
                // Small delay to ensure rendering is complete
                setTimeout(() => {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        }
    }

    scrollToItem(identifier) {
        // Find the grid item with matching identifier and type
        const targetItem = this.elements.content.querySelector(
            `.grid-item[data-identifier="${identifier}"]`
        );

        if (targetItem) {
            // Scroll to the item
            DOMManager.scrollIntoView(targetItem, {
                behavior: 'smooth',
                block: 'center',
            });

            // Add a highlight effect
            targetItem.classList.add('highlight-item');
            setTimeout(() => {
                targetItem.classList.remove('highlight-item');
            }, 2000);
        }
    }

    getYearEntries() {
        if (!this.yearEntriesCache) {
            this.yearEntriesCache = DataManager.groupByYear(this.state.allUpdates);
        }
        return this.yearEntriesCache;
    }

}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new MinecraftUpdatesApp();
    
    // Store URL parameters to detect changes - use object to allow updates
    const urlState = {
        lastView: new URLSearchParams(window.location.search).get('view'),
        lastMode: new URLSearchParams(window.location.search).get('mode')
    };
    
    // Function to update tracked URL state
    const updateTrackedState = () => {
        const params = new URLSearchParams(window.location.search);
        urlState.lastView = params.get('view');
        urlState.lastMode = params.get('mode');
    };
    
    // Override app's updateURL to also update tracked state
    const originalUpdateURL = app.updateURL.bind(app);
    app.updateURL = function(clearHash = false, pushHistory = false) {
        originalUpdateURL(clearHash, pushHistory);
        updateTrackedState();
    };
    
    app.init().then(() => {
        // Update URL to reflect current view (keep hash on initial load)
        app.updateURL(false);

        // Handle deep linking: scroll to card if hash is present in URL
        const hash = window.location.hash;
        if (hash && hash.length > 1) {
            // Try to scroll immediately
            const scrollToTarget = () => {
                const target = document.querySelector(hash);
                if (target) {
                    // Use setTimeout to ensure DOM is fully rendered
                    setTimeout(() => {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                    return true;
                }
                return false;
            };

            // Try immediately
            if (!scrollToTarget()) {
                // If not found, retry after a short delay (for slow rendering)
                setTimeout(() => {
                    scrollToTarget();
                }, 500);
            }
        }
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', (event) => {
        const currentParams = new URLSearchParams(window.location.search);
        const currentView = currentParams.get('view');
        const currentMode = currentParams.get('mode');
        
        // Only reload if view parameters actually changed (not just hash)
        if (currentView !== urlState.lastView || currentMode !== urlState.lastMode) {
            location.reload();
        }
        // If only hash changed, browser will handle scroll automatically
    });
});
