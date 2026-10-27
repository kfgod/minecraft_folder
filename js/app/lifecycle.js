import { CONFIG } from '../config.js';
import { DOMManager } from '../dom-manager.js';
import { loadSortedUpdates } from '../data-loader.js';
import { clearPartialLoadWarning, showLoadError, showPartialLoadWarning } from '../error-ui.js';

export async function loadUpdatesAndRender(app) {
    try {
        const { updates, failedFiles } = await loadSortedUpdates();
        app.state.allUpdates = updates;
        if (failedFiles.length) {
            showPartialLoadWarning(app.elements.content, failedFiles, () => {
                void loadUpdatesAndRender(app);
            });
        } else {
            clearPartialLoadWarning();
        }

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
