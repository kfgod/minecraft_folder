import { CONFIG } from '../config.js';
import { DOMManager } from '../dom-manager.js';

const ELEMENT_SELECTORS = {
    body: CONFIG.SELECTORS.BODY,
    main: CONFIG.SELECTORS.MAIN,
    content: CONFIG.SELECTORS.CONTENT,
    navList: CONFIG.SELECTORS.NAV_LIST,
    searchBar: CONFIG.SELECTORS.SEARCH_BAR,
    searchClearBtn: CONFIG.SELECTORS.SEARCH_CLEAR_BTN,
    searchContainer: '.search-container',
    mobileSearchBar: '#mobile-search-bar',
    mobileSearchClearBtn: '#mobile-search-clear-btn',
    filtersFab: '#filters-fab',
    filtersOverlay: '#filters-overlay',
    toggleSwitch: CONFIG.SELECTORS.TOGGLE_SWITCH,
    removeDuplicatesCheckbox: CONFIG.SELECTORS.REMOVE_DUPLICATES_CHECKBOX,
    showBlocksCheckbox: CONFIG.SELECTORS.SHOW_BLOCKS_CHECKBOX,
    showItemsCheckbox: CONFIG.SELECTORS.SHOW_ITEMS_CHECKBOX,
    showMobsCheckbox: CONFIG.SELECTORS.SHOW_MOBS_CHECKBOX,
    showMobVariantsCheckbox: CONFIG.SELECTORS.SHOW_MOB_VARIANTS_CHECKBOX,
    showEffectsCheckbox: CONFIG.SELECTORS.SHOW_EFFECTS_CHECKBOX,
    showEnchantmentsCheckbox: CONFIG.SELECTORS.SHOW_ENCHANTMENTS_CHECKBOX,
    showAdvancementsCheckbox: CONFIG.SELECTORS.SHOW_ADVANCEMENTS_CHECKBOX,
    showPaintingsCheckbox: CONFIG.SELECTORS.SHOW_PAINTINGS_CHECKBOX,
    showBiomesCheckbox: CONFIG.SELECTORS.SHOW_BIOMES_CHECKBOX,
    showStructuresCheckbox: CONFIG.SELECTORS.SHOW_STRUCTURES_CHECKBOX,
    showBordersCheckbox: CONFIG.SELECTORS.SHOW_BORDERS_CHECKBOX,
    showNotableChangesCheckbox: CONFIG.SELECTORS.SHOW_NOTABLE_CHANGES_CHECKBOX,
    controlsPanel: '#controls-panel',
    navPanel: CONFIG.SELECTORS.NAV_PANEL,
    navToggleBtn: CONFIG.SELECTORS.NAV_TOGGLE_BTN,
    overlay: CONFIG.SELECTORS.OVERLAY,
    navOverlay: '#nav-overlay',
    tooltip: CONFIG.SELECTORS.TOOLTIP,
    statsBtn: '#stats-btn',
    compareBtn: '#compare-btn',
    timeSinceBtn: '#time-since-btn',
    materialGroupsBtn: '#material-groups-btn',
    navFab: '#nav-fab',
    filtersSelectAllBtn: '#filters-select-all',
    filtersSelectNoneBtn: '#filters-select-none',
    filtersPopularBlocksBtn: '#filters-popular-blocks',
    filtersPopularItemsBtn: '#filters-popular-items',
    filtersPopularMobsBtn: '#filters-popular-mobs',
    themeDarkBtn: '#theme-dark-btn',
    themeLightBtn: '#theme-light-btn',
    navSearch: '#nav-search',
    navJump: '#nav-jump',
};

export function getAppElements() {
    return Object.fromEntries(
        Object.entries(ELEMENT_SELECTORS).map(([key, selector]) => [
            key,
            DOMManager.getElement(selector),
        ])
    );
}
