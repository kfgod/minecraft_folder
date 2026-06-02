import { CONFIG } from '../config.js';
import { Utils } from '../utils.js';
import { groupByYear } from '../data/aggregation.js';
import { SECTION_TYPES } from '../section-config.js';

export function restoreCompareVersions(app) {
    const compareVersionIds = app.pendingRestore.compareVersionIds;
    if (!compareVersionIds || !Array.isArray(compareVersionIds)) {
        return;
    }

    const dataSource =
        app.state.currentView === CONFIG.VIEWS.YEARS
            ? groupByYear(app.state.allUpdates, SECTION_TYPES)
            : app.state.allUpdates;

    app.state.compareVersions = compareVersionIds.map((id) => {
        if (!id) return null;
        return dataSource.find((item) => Utils.generateCardId(item) === id) || null;
    });

    app.pendingRestore.compareVersionIds = null;
}
