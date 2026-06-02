import { restoreFromURL as applyUrlParamsToState } from '../url-state.js';
import { restorePersistedUIState } from '../ui-persistence.js';

export function restoreInitialAppState(app) {
    const persistedRestore = restorePersistedUIState(app);
    const urlRestore = applyUrlParamsToState(app);
    app.pendingRestore = {
        detailTarget: urlRestore.detailTarget || persistedRestore.detailTarget,
        compareVersionIds: urlRestore.compareVersionIds || persistedRestore.compareVersionIds,
    };
}
