import { APP_MODES } from '../app-modes.js';
import { getFilteredDataFromState } from '../data/filtering.js';

export async function renderCurrentView(app) {
    switch (app.state.activeMode) {
        case APP_MODES.DETAIL:
            app.detailViewManager.render();
            return;
        case APP_MODES.STATS: {
            const statisticsManager = await app.ensureStatisticsManager();
            await statisticsManager.render();
            return;
        }
        case APP_MODES.TIME_SINCE: {
            const timeSinceManager = await app.ensureTimeSinceManager();
            await timeSinceManager.render();
            return;
        }
        case APP_MODES.MATERIAL_GROUPS: {
            const materialGroupsManager = await app.ensureMaterialGroupsManager();
            await materialGroupsManager.render();
            return;
        }
        case APP_MODES.COMPARE: {
            const compareManager = await app.ensureCompareManager();
            compareManager.render();
            return;
        }
        default:
            renderListView(app);
    }
}

export async function renderActiveModeView(app) {
    const pendingDetailTarget = app.pendingRestore.detailTarget;
    if (app.state.activeMode === APP_MODES.DETAIL && pendingDetailTarget) {
        app.detailViewManager.open(pendingDetailTarget.type, pendingDetailTarget.id, {
            silent: true,
            preserveContext: true,
        });
        app.pendingRestore.detailTarget = null;
        return;
    }

    if (app.state.activeMode === APP_MODES.TIME_SINCE) {
        const timeSinceManager = await app.ensureTimeSinceManager();
        await timeSinceManager.render();
        return;
    }

    if (app.state.activeMode === APP_MODES.MATERIAL_GROUPS) {
        const materialGroupsManager = await app.ensureMaterialGroupsManager();
        await materialGroupsManager.render();
        return;
    }

    await app.render();
}

function renderListView(app) {
    const query = app.getSearchQuery().toLowerCase();
    const filteredData = getFilteredDataFromState(
        app.state.allUpdates,
        app.state.currentView,
        query,
        app.state
    );
    app.renderNav(filteredData);
    app.renderContent(filteredData);
}
