import { CONFIG } from '../config.js';
import { DOMManager } from '../dom-manager.js';
import { loadSortedUpdates } from '../data-loader.js';
import { showLoadError } from '../error-ui.js';

export async function loadUpdatesAndRender(app) {
    try {
        app.state.allUpdates = await loadSortedUpdates();

        app.updateSearchSuggestions();
        app.restoreCompareVersions();
        app.yearEntriesCache = null;

        await app.renderActiveModeView();
        app.updateLayout();

        setTimeout(() => {
            DOMManager.removeClass(app.elements.body, CONFIG.CSS_CLASSES.NO_TRANSITION);
        }, CONFIG.TRANSITION_DELAY);
    } catch (error) {
        console.error('Initialization error:', error);
        showLoadError(app.elements.content, `Unable to load data. ${error.message}`, () => {
            void loadUpdatesAndRender(app);
        });
        DOMManager.removeClass(app.elements.body, CONFIG.CSS_CLASSES.NO_TRANSITION);
    }
}
