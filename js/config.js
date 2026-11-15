/**
 * Application configuration constants
 */

// Example: 'https://raw.githubusercontent.com/kfgod/minecraft_folder_data/main' or '../minecraft_data'
const BASE_URL = 'https://raw.githubusercontent.com/kfgod/minecraft_folder_data/main';
// const BASE_URL = '../minecraft_data';
export const CONFIG = {
    BASE_URL: BASE_URL,
    INDEX_FILE_PATH: '/data/file_index.json',
    IMAGE_BASE_PATH: BASE_URL + '/images',
    ENCHANTMENT_ICON: BASE_URL + '/images/item/enchanted_book/latest.png',
    /** Shown when an element has no image or its image fails to load */
    MISSING_TEXTURE: 'https://minecraft.wiki/images/Missing_Texture_JE4.png?71c27',
    VIEWS: {
        VERSIONS: 'versions',
        YEARS: 'years',
    },
    COLUMNS_COUNT: 9,
    NAV_PANEL_WIDTH: 280,
    LAYOUT_GAP: 20,
    DEBOUNCE_DELAY: 250,
    RESIZE_DEBOUNCE_DELAY: 100,
    TRANSITION_DELAY: 50,
    MOBILE_BREAKPOINT: 900,
    /** Features that are built but not released yet */
    FEATURES: {
        /** Item page (recipes and tags) on block/item click; off: the click opens the Wiki */
        ITEM_PAGE: false,
    },
    /** Batch card DOM inserts above this count to avoid long main-thread blocks */
    LIST_RENDER_CHUNK_SIZE: 48,
    CHART_COLORS: {
        GRID: 'rgba(255, 255, 255, 0.1)',
        TEXT: 'white',
    },
    CSS_CLASSES: {
        NO_TRANSITION: 'no-transition',
        MOBILE_LAYOUT: 'mobile-layout',
        DESKTOP_LAYOUT: 'desktop-layout',
        ACTIVE: 'active',
        VISIBLE: 'is-visible',
        SHOW_BORDERS: 'show-borders',
    },
    SELECTORS: {
        BODY: 'body',
        MAIN: 'main',
        CONTENT: '#content',
        NAV_LIST: '#nav-list',
        SEARCH_BAR: '#search-bar',
        SEARCH_CLEAR_BTN: '#search-clear-btn',
        TOGGLE_SWITCH: '.toggle-switch',
        REMOVE_DUPLICATES_CHECKBOX: '#remove-duplicates-checkbox',
        SHOW_BLOCKS_CHECKBOX: '#show-blocks-checkbox',
        SHOW_ITEMS_CHECKBOX: '#show-items-checkbox',
        SHOW_MOBS_CHECKBOX: '#show-mobs-checkbox',
        SHOW_MOB_VARIANTS_CHECKBOX: '#show-mob-variants-checkbox',
        SHOW_EFFECTS_CHECKBOX: '#show-effects-checkbox',
        SHOW_ENCHANTMENTS_CHECKBOX: '#show-enchantments-checkbox',
        SHOW_ADVANCEMENTS_CHECKBOX: '#show-advancements-checkbox',
        SHOW_PAINTINGS_CHECKBOX: '#show-paintings-checkbox',
        SHOW_BIOMES_CHECKBOX: '#show-biomes-checkbox',
        SHOW_STRUCTURES_CHECKBOX: '#show-structures-checkbox',
        SHOW_BORDERS_CHECKBOX: '#show-borders-checkbox',
        SHOW_NOTABLE_CHANGES_CHECKBOX: '#show-notable-changes-checkbox',
        NAV_PANEL: '#nav-panel',
        NAV_TOGGLE_BTN: '#nav-toggle-btn',
        OVERLAY: '#overlay',
        TOOLTIP: '#tooltip',
        GROWTH_CHART: '#growthChart',
        VIEW_TITLE: '#view-title',
        CONTENT_TABLE_TITLE: '#content-table-title',
        LONGEST_NAMES_TABLE: '#longest-names-table tbody',
        SHORTEST_NAMES_TABLE: '#shortest-names-table tbody',
        CONTENT_TABLE: '#content-table',
    },
};
