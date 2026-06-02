import { DetailViewManager } from '../modules/detail/index.js';
import { CardRenderer } from '../modules/card/index.js';
import { NavigationManager } from '../modules/navigation/index.js';
import { FeatureManagerRegistry } from './feature-manager-registry.js';
import { AppActions } from './actions.js';

export function createAppDependencies(app) {
    return {
        state: app.state,
        elements: app.elements,
        queries: {
            isYearView: () => app.isYearView(),
            getYearEntries: () => app.getYearEntries(),
            getSearchQuery: () => app.getSearchQuery(),
        },
        actions: {
            setSearchQuery: (value) => app.setSearchQuery(value),
            render: () => app.render(),
            updateURL: (clearHash, pushHistory) => app.updateURL(clearHash, pushHistory),
            saveState: () => app.saveState(),
            syncViewToggle: () => app.syncViewToggle(),
            updateLayout: () => app.updateLayout(),
            rememberCollapsed: (sectionEl) => app.rememberCollapsed(sectionEl),
            applyCollapsedState: () => app.applyCollapsedState(),
        },
        managers: {
            navigation: () => app.navigationManager,
            cardRenderer: () => app.cardRenderer,
            statistics: () => app.statisticsManager,
            compare: () => app.compareManager,
            detailView: () => app.detailViewManager,
            timeSince: () => app.timeSinceManager,
            materialGroups: () => app.materialGroupsManager,
            ensureStatistics: () => app.ensureStatisticsManager(),
            ensureCompare: () => app.ensureCompareManager(),
            ensureTimeSince: () => app.ensureTimeSinceManager(),
            ensureMaterialGroups: () => app.ensureMaterialGroupsManager(),
        },
    };
}

export function createAppServices(app, ctx) {
    return {
        detailViewManager: new DetailViewManager(ctx),
        cardRenderer: new CardRenderer(ctx),
        navigationManager: new NavigationManager(ctx),
        featureManagers: new FeatureManagerRegistry(ctx),
        actions: new AppActions(app),
    };
}
