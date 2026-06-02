/**
 * Search input and clear buttons (delegates to MinecraftUpdatesApp).
 */
import { Utils } from '../utils.js';
import { CONFIG } from '../config.js';
import { isSearchDisabledMode } from '../app-modes.js';

/**
 * @param {*} app - MinecraftUpdatesApp
 */
export function attachSearchController(app) {
    const searchDebounce = Utils.debounce(() => {
        void app.actions.refreshForSearchChange();
    }, CONFIG.DEBOUNCE_DELAY);

    const handleSearchInput = (value) => {
        if (isSearchDisabledMode(app.state.activeMode)) {
            return;
        }
        app.setSearchQuery(value);
        searchDebounce();
    };

    app.elements.searchBar.addEventListener('input', () => {
        handleSearchInput(app.elements.searchBar.value);
    });

    if (app.elements.mobileSearchBar) {
        app.elements.mobileSearchBar.addEventListener('input', () => {
            handleSearchInput(app.elements.mobileSearchBar.value);
        });
    }

    const onClearSearch = () => {
        void app.actions.clearSearch();
    };

    app.elements.searchClearBtn.addEventListener('click', onClearSearch);

    if (app.elements.mobileSearchClearBtn) {
        app.elements.mobileSearchClearBtn.addEventListener('click', onClearSearch);
    }
}
