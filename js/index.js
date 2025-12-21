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
            showBordersCheckbox: DOMManager.getElement(CONFIG.SELECTORS.SHOW_BORDERS_CHECKBOX),
            navPanel: DOMManager.getElement(CONFIG.SELECTORS.NAV_PANEL),
            navToggleBtn: DOMManager.getElement(CONFIG.SELECTORS.NAV_TOGGLE_BTN),
            overlay: DOMManager.getElement(CONFIG.SELECTORS.OVERLAY),
            tooltip: DOMManager.getElement(CONFIG.SELECTORS.TOOLTIP),
            statsBtn: DOMManager.getElement('#stats-btn'),
            compareBtn: DOMManager.getElement('#compare-btn'),
            timeSinceBtn: DOMManager.getElement('#time-since-btn'),
            materialGroupsBtn: DOMManager.getElement('#material-groups-btn'),
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
            this.elements.searchBar.value = searchParam;
            DOMManager.setVisibility(this.elements.searchClearBtn, true);
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
        const searchQuery = this.elements.searchBar.value.trim();
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
                'showAdvancements', 'showPaintings', 'showBiomes'
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
            if (this.state.isTimeSinceMode || this.state.isStatsMode) {
                this.elements.searchBar.disabled = true;
                this.elements.searchBar.placeholder = 'Search disabled';
            } else {
                this.elements.searchBar.disabled = false;
                this.elements.searchBar.placeholder = 'Search...';
            }
        }
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
            } else if (this.state.isDetailMode) {
                this.detailViewManager.render();
            } else {
                this.render();
            }
        }, CONFIG.DEBOUNCE_DELAY);
        
        this.elements.searchBar.addEventListener('input', () => {
            // Disable search in stats and time-since modes
            if (this.state.isStatsMode || this.state.isTimeSinceMode) {
                return;
            }
            const hasValue = this.elements.searchBar.value.length > 0;
            DOMManager.setVisibility(this.elements.searchClearBtn, hasValue);
            searchDebounce();
        });

        this.elements.searchClearBtn.addEventListener('click', () => {
            this.elements.searchBar.value = '';
            DOMManager.setVisibility(this.elements.searchClearBtn, false);
            
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
            window.scrollTo({ top: 0, behavior: 'instant' });
        });

        // Toggle switch for view mode
        this.elements.toggleSwitch.addEventListener('click', (e) => {
            // Disable toggle switch in time-since mode
            if (this.state.isTimeSinceMode) {
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

        if (this.elements.compareBtn) {
            this.elements.compareBtn.addEventListener('click', () => {
                const willEnable = !this.state.isCompareMode;
                this.state.isCompareMode = willEnable;
                if (willEnable) {
                    this.state.isStatsMode = false;
                    this.state.isTimeSinceMode = false;
                    this.state.isDetailMode = false;
                    this.state.detailTarget = null;
                    this.state.detailReturnContext = 'list';
                    this.statisticsManager.reset();
                    this.timeSinceManager.reset();
                }
                this.syncViewToggle();
                this.updateURL(true, true);
                this.saveState();
                if (this.state.isCompareMode) {
                    this.compareManager.render();
                } else if (this.state.isStatsMode) {
                    this.statisticsManager.render();
                } else if (this.state.isTimeSinceMode) {
                    this.timeSinceManager.render();
                } else {
                    this.render();
                }
                this.updateLayout();
                window.scrollTo({ top: 0, behavior: 'instant' });
            });
        }

        if (this.elements.statsBtn) {
            this.elements.statsBtn.addEventListener('click', () => {
                const willEnable = !this.state.isStatsMode;
                this.state.isStatsMode = willEnable;
                if (willEnable) {
                    this.state.isCompareMode = false;
                    this.state.isTimeSinceMode = false;
                    this.state.isDetailMode = false;
                    this.state.detailTarget = null;
                    this.state.detailReturnContext = 'list';
                    this.timeSinceManager.reset();
                } else {
                    this.statisticsManager.reset();
                }
                this.syncViewToggle();
                this.updateURL(true, true);
                this.saveState();
                if (this.state.isStatsMode) {
                    this.statisticsManager.render();
                } else if (this.state.isCompareMode) {
                    this.compareManager.render();
                } else if (this.state.isTimeSinceMode) {
                    this.timeSinceManager.render();
                } else {
                    this.render();
                }
                this.updateLayout();
                window.scrollTo({ top: 0, behavior: 'instant' });
            });
        }

        if (this.elements.timeSinceBtn) {
            this.elements.timeSinceBtn.addEventListener('click', () => {
                console.log('Time Since button clicked');
                const willEnable = !this.state.isTimeSinceMode;
                this.state.isTimeSinceMode = willEnable;
                if (willEnable) {
                    this.state.isCompareMode = false;
                    this.state.isStatsMode = false;
                    this.state.isMaterialGroupsMode = false;
                    this.state.isDetailMode = false;
                    this.state.detailTarget = null;
                    this.state.detailReturnContext = 'list';
                    this.statisticsManager.reset();
                    this.materialGroupsManager.reset();
                } else {
                    this.timeSinceManager.reset();
                }
                this.syncViewToggle();
                this.updateURL(true, true);
                this.saveState();
                if (this.state.isTimeSinceMode) {
                    console.log('Rendering time-since mode');
                    this.timeSinceManager.render().catch((error) => {
                        console.error('Error in timeSinceManager.render():', error);
                        this.app.elements.content.innerHTML = `<p class="empty-state" style="color: red;">Error: ${error.message}</p>`;
                    });
                } else if (this.state.isMaterialGroupsMode) {
                    this.materialGroupsManager.render();
                } else if (this.state.isStatsMode) {
                    this.statisticsManager.render();
                } else if (this.state.isCompareMode) {
                    this.compareManager.render();
                } else {
                    this.render();
                }
                this.updateLayout();
                window.scrollTo({ top: 0, behavior: 'instant' });
            });
        } else {
            console.warn('Time Since button not found');
        }

        if (this.elements.materialGroupsBtn) {
            this.elements.materialGroupsBtn.addEventListener('click', () => {
                console.log('Material Groups button clicked');
                const willEnable = !this.state.isMaterialGroupsMode;
                this.state.isMaterialGroupsMode = willEnable;
                if (willEnable) {
                    this.state.isCompareMode = false;
                    this.state.isStatsMode = false;
                    this.state.isTimeSinceMode = false;
                    this.state.isDetailMode = false;
                    this.state.detailTarget = null;
                    this.state.detailReturnContext = 'list';
                    this.statisticsManager.reset();
                    this.timeSinceManager.reset();
                } else {
                    this.materialGroupsManager.reset();
                }
                this.syncViewToggle();
                this.updateURL(true, true);
                this.saveState();
                if (this.state.isMaterialGroupsMode) {
                    console.log('Rendering material-groups mode');
                    this.materialGroupsManager.render().catch((error) => {
                        console.error('Error in materialGroupsManager.render():', error);
                        this.app.elements.content.innerHTML = `<p class="empty-state" style="color: red;">Error: ${error.message}</p>`;
                    });
                } else if (this.state.isTimeSinceMode) {
                    this.timeSinceManager.render();
                } else if (this.state.isStatsMode) {
                    this.statisticsManager.render();
                } else if (this.state.isCompareMode) {
                    this.compareManager.render();
                } else {
                    this.render();
                }
                this.updateLayout();
                window.scrollTo({ top: 0, behavior: 'instant' });
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

        // Attach remaining event listeners
        this.attachContentEventListeners();
        this.attachNavigationEventListeners();
        this.attachNavPanelEventListeners();
        this.attachTooltipEventListeners();
        this.attachResizeListener();
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
        this.elements.navToggleBtn.addEventListener('click', () => this.toggleNav());
        this.elements.overlay.addEventListener('click', () => this.closeNav());

        this.elements.navList.addEventListener('click', (e) => {
            if (e.target.closest('a') && DOMManager.hasClass(this.elements.body, CONFIG.CSS_CLASSES.MOBILE_LAYOUT)) {
                this.closeNav();
            }
        });
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
        if (this.state.isCompareMode || this.state.isStatsMode || this.state.isTimeSinceMode || this.state.isMaterialGroupsMode || this.state.isDetailMode) {
            DOMManager.addClass(this.elements.body, CONFIG.CSS_CLASSES.DESKTOP_LAYOUT);
            DOMManager.removeClass(this.elements.body, CONFIG.CSS_CLASSES.MOBILE_LAYOUT);
            this.closeNav();
            return;
        }

        const mainRect = DOMManager.getBoundingRect(this.elements.main);
        const availableSpace = window.innerWidth - mainRect.right;

        if (Utils.shouldUseMobileLayout(availableSpace, CONFIG.NAV_PANEL_WIDTH, CONFIG.LAYOUT_GAP)) {
            DOMManager.addClass(this.elements.body, CONFIG.CSS_CLASSES.MOBILE_LAYOUT);
            DOMManager.removeClass(this.elements.body, CONFIG.CSS_CLASSES.DESKTOP_LAYOUT);
        } else {
            DOMManager.addClass(this.elements.body, CONFIG.CSS_CLASSES.DESKTOP_LAYOUT);
            DOMManager.removeClass(this.elements.body, CONFIG.CSS_CLASSES.MOBILE_LAYOUT);
            this.closeNav();
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
        DOMManager.addClass(this.elements.navPanel, CONFIG.CSS_CLASSES.VISIBLE);
        DOMManager.addClass(this.elements.overlay, CONFIG.CSS_CLASSES.VISIBLE);
        DOMManager.setAttribute(this.elements.navToggleBtn, 'aria-expanded', 'true');
    }

    /**
     * Close navigation panel
     */
    closeNav() {
        DOMManager.removeClass(this.elements.navPanel, CONFIG.CSS_CLASSES.VISIBLE);
        DOMManager.removeClass(this.elements.overlay, CONFIG.CSS_CLASSES.VISIBLE);
        DOMManager.setAttribute(this.elements.navToggleBtn, 'aria-expanded', 'false');
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

        const query = this.elements.searchBar.value.toLowerCase();
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
            this.state.showBiomes
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
    }

    /**
     * Render main content
     * @param {Array} data - Data to render
     */
    renderContent(data) {
        DOMManager.clearContainer(this.elements.content);

        if (data.length === 0) {
            const query = this.elements.searchBar.value.trim();
            const emptyMessage = query ? `No results found for "${query}"` : 'No content available';
            this.elements.content.innerHTML = `<p class="empty-state">${emptyMessage}</p>`;
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

    /**
     * Scroll to an item by identifier and type
     * @param {string} identifier - Item identifier
     * @param {string} elementType - Element type (item, mob, etc.)
     */
    scrollToItem(identifier, elementType) {
        const resolveIconPath = (itemValue) => {
            if (!itemValue) return null;
            const imageBasePath = CONFIG.BASE_URL + CONFIG.IMAGE_BASE_PATH;

            if (typeof itemValue === 'string') {
                const trimmed = itemValue.trim().replace(/^\/+/, '');
                if (!trimmed) {
                    return null;
                }
                if (trimmed.includes('/')) {
                    return `${CONFIG.IMAGE_BASE_PATH}/${trimmed}/latest.png`;
                }
                return `${CONFIG.IMAGE_BASE_PATH}/item/${trimmed}/latest.png`;
            }

            const type = itemValue.element_type || 'item';
            const identifier = itemValue.identifier || itemValue.minecraft_identifier;

            if (identifier) {
                return `${CONFIG.IMAGE_BASE_PATH}/${type}/${identifier}/latest.png`;
            }
            return null;
        };

        const itemsHtml = items.map((item) => {
            const identifier = item.identifier || item.minecraft_identifier;

            // Custom rendering for mobs and mob_variants:
            // - Large mob render image
            // - Spawn egg icon (for mobs only)
            // - Parent mob icon (for variants only)
            // - Health information in tooltip
            if (sectionType === 'mobs' || sectionType === 'mob_variants') {
                const name = item.display_name || item.name || identifier;
                const mobType = item.element_type || 'mob';

                // Build tooltip with health information if available
                let tooltipContent = name;
                let healthValue = null;

                // Try to get health from meta.health first
                if (item.meta && item.meta.health !== undefined) {
                    healthValue = item.meta.health;
                }
                // For variants, try parent mob's health
                else if (item.meta && item.meta.parent_mob && item.meta.parent_mob.health !== undefined) {
                    healthValue = item.meta.parent_mob.health;
                }

                // Add health to tooltip if found (convert to half-hearts for display)
                if (healthValue !== null) {
                    const healthInHearts = healthValue / 2;
                    tooltipContent = `${name}|health:${healthInHearts}`;
                }
                const mobImagePath = resolveIconPath(item);
                const mobImageTag = `<img class="mob-render" src="${mobImagePath}" loading="lazy">`;

                // Render spawn egg for mobs (not for variants)
                let eggTag = '';
                if (sectionType !== 'mob_variants' && item.meta && item.meta.spawn_egg) {
                    const spawnEgg = item.meta.spawn_egg;
                    const spawnEggImagePath = resolveIconPath(spawnEgg);
                    const eggName = spawnEgg.display_name || spawnEgg.name || 'Spawn Egg';
                    eggTag = `<span class="tooltip-wrapper" data-tooltip="${eggName}"><a href="${spawnEgg.wiki}" target="_blank" rel="noopener noreferrer" class="mob-egg-link"><img class="inv-img mob-egg" src="${spawnEggImagePath}" loading="lazy" onerror="this.parentElement.parentElement.parentElement.remove()"></a></span>`;
                }

                // Render parent mob icon for variants
                let parentMobTag = '';
                if (item.meta && item.meta.parent_mob) {
                    const parentMob = item.meta.parent_mob;
                    const parentImagePath = resolveIconPath(parentMob);
                    const parentName = parentMob.display_name || parentMob.name;
                    const parentWiki = parentMob.wiki || '';
                    if (parentWiki) {
                        parentMobTag = `<span class="tooltip-wrapper" data-tooltip="${parentName}"><a href="${parentWiki}" target="_blank" rel="noopener noreferrer"><img class="mob-parent-icon" src="${parentImagePath}" loading="lazy"></a></span>`;
                    } else {
                        parentMobTag = `<span class="tooltip-wrapper" data-tooltip="${parentName}"><img class="mob-parent-icon" src="${parentImagePath}" loading="lazy"></span>`;
                    }
                }

                const cardInner = `
                    <div class="mob-card">
                        ${parentMobTag ? `<div class="mob-card__parent">${parentMobTag}</div>` : ''}
                        <div class="mob-card__image">${mobImageTag}</div>
                        <div class="mob-card__egg">${eggTag}</div>
                    </div>
                `;

                // Use data-wiki attribute for click handling (allows nested links to work)
                const wikiAttr = item.wiki ? ` data-wiki="${item.wiki}"` : '';
                return `<div class="grid-item mob-cell clickable-card" data-tooltip="${tooltipContent}" data-identifier="${identifier}" data-element-type="${mobType}"${wikiAttr}>${cardInner}</div>`;
            }

            // Custom rendering for enchantments: icon + text, styled cell
            if (sectionType === 'enchantments') {
                const name = item.display_name || item.name || identifier;
                const enchIconTag = `<img class="inv-img ench-icon" src="${CONFIG.ENCHANTMENT_ICON}" loading="lazy">`;
                const enchInner = `
                    <div class="ench-cell-inner">${enchIconTag}<span class="ench-name">${name}</span></div>
                `;
                const wrapped = item.wiki
                    ? `<a href="${item.wiki}" target="_blank" rel="noopener noreferrer">${enchInner}</a>`
                    : enchInner;
                return `<div class="grid-item ench-cell" data-tooltip="${name}" data-identifier="${identifier}" data-element-type="enchantment">${wrapped}</div>`;
            }

            if (sectionType === 'advancements') {
                const name = item.display_name || item.name || identifier;
                const iconPath = resolveIconPath(item.meta?.icon);
                const iconContent = iconPath
                    ? `<img class="advancement-icon" src="${iconPath}" loading="lazy" alt="">`
                    : `<span class="advancement-icon advancement-icon--placeholder"></span>`;
                const inner = `
                    <div class="advancement-cell__content">
                        ${iconContent}
                        <span class="advancement-name">${name}</span>
                    </div>
                `;
                const wrapped = item.wiki
                    ? `<a href="${item.wiki}" target="_blank" rel="noopener noreferrer">${inner}</a>`
                    : inner;
                return `<div class="grid-item advancement-cell" data-tooltip="${name}" data-identifier="${identifier}" data-element-type="advancement">${wrapped}</div>`;
            }

            // Custom rendering for paintings: title + provided external image
            if (sectionType === 'paintings') {
                const name = item.display_name || item.name || identifier;
                const paintingImagePath = resolveIconPath(item);
                const imageTag = `<img class="inv-img" src="${paintingImagePath}" loading="lazy">`;
                const inner = `<div class="painting-cell__image">${imageTag}</div>`;
                const wrapped = item.wiki
                    ? `<a href="${item.wiki}" target="_blank" rel="noopener noreferrer">${inner}</a>`
                    : inner;
                return `<div class="grid-item painting-cell" data-tooltip="${name}" data-identifier="${identifier}" data-element-type="painting">${wrapped}</div>`;
            }

            // Custom rendering for biomes: wide rectangular cells with external images
            if (sectionType === 'biomes') {
                const name = item.display_name || item.name || identifier;
                // Use external image from item.image or fallback to local path
                const imageSrc = resolveIconPath(item);
                const imageTag = `<img class="inv-img" src="${imageSrc}" loading="lazy">`;
                const inner = `<div class="biome-cell__image">${imageTag}</div>`;
                const wrapped = item.wiki
                    ? `<a href="${item.wiki}" target="_blank" rel="noopener noreferrer">${inner}</a>`
                    : inner;
                return `<div class="grid-item biome-cell" data-tooltip="${name}" data-identifier="${identifier}" data-element-type="biome">${wrapped}</div>`;
            }

            // Default rendering for blocks/items/effects
            const elementType = item.element_type || 'item'; // fallback to 'item' if not specified
            const displayName = item.display_name || item.name;
            const imagePath = resolveIconPath(item);
            const imageTag = `<img class="inv-img" src="${imagePath}" loading="lazy">`;
            const itemContent = item.wiki
                ? `<a href="${item.wiki}" target="_blank" rel="noopener noreferrer">${imageTag}</a>`
                : imageTag;
            return `<div class="grid-item" data-tooltip="${displayName}" data-identifier="${identifier}" data-element-type="${elementType}">${itemContent}</div>`;
        });

        // Add placeholder items to fill the last row for standard grid layouts
        // (Skip for special layouts that don't need alignment)
        if (
            sectionType !== 'effects' &&
            sectionType !== 'mobs' &&
            sectionType !== 'mob_variants' &&
            sectionType !== 'enchantments' &&
            sectionType !== 'advancements' &&
            sectionType !== 'paintings' &&
            sectionType !== 'biomes'
        ) {
            const remainder = items.length % CONFIG.COLUMNS_COUNT;
            const placeholdersNeeded = remainder === 0 ? 0 : CONFIG.COLUMNS_COUNT - remainder;
            if (placeholdersNeeded > 0) {
                const placeholderContent = `<img class="inv-img" src="${CONFIG.PLACEHOLDER_IMAGE}" alt="">`;
                const placeholder = `<div class="grid-item">${placeholderContent}</div>`;
                for (let i = 0; i < placeholdersNeeded; i++) {
                    itemsHtml.push(placeholder);
                }
            }
        }

        // Apply appropriate grid class based on content type
        let gridClass = 'element-grid';
        if (sectionType === 'effects') {
            gridClass = 'element-grid effects-grid';
        } else if (sectionType === 'mobs' || sectionType === 'mob_variants') {
            gridClass = 'element-grid mobs-grid';
        } else if (sectionType === 'enchantments') {
            gridClass = 'element-grid enchantments-grid';
        } else if (sectionType === 'advancements') {
            gridClass = 'element-grid advancements-grid';
        } else if (sectionType === 'paintings') {
            gridClass = 'element-grid paintings-grid';
        } else if (sectionType === 'biomes') {
            gridClass = 'element-grid biomes-grid';
        }
        return `
            <div class="card-section" data-section="${sectionType}">
                <div class="section-title" role="button" tabindex="0" aria-expanded="true">${title}</div>
                <div class="${gridClass}">${itemsHtml.join('')}</div>
            </div>
        `;
    }

    /**
     * Scroll to an item by identifier and type
     * @param {string} identifier - Item identifier
     * @param {string} elementType - Element type (item, mob, etc.)
     */
    scrollToItem(identifier, elementType) {
        // Find the grid item with matching identifier and type
        const targetItem = this.elements.content.querySelector(
            `.grid-item[data-identifier="${identifier}"][data-element-type="${elementType}"]`
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
