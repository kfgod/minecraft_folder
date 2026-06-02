import { CONFIG } from '../../config.js';
import { APP_MODES } from '../../app-modes.js';

export function enterDetailMode(ctx, { detailType, detailId, silent, preserveContext }) {
    if (!preserveContext) {
        ctx.state.detailReturnContext = getReturnContext(ctx.state.activeMode);
    }

    const wasStatsMode = ctx.state.activeMode === APP_MODES.STATS;
    ctx.state.currentView = detailType === 'year' ? CONFIG.VIEWS.YEARS : CONFIG.VIEWS.VERSIONS;
    ctx.state.scrollPositionBeforeDetail =
        window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
    ctx.state.detailTarget = { type: detailType, id: detailId };
    ctx.state.detailSection = null;
    ctx.state.activeMode = APP_MODES.DETAIL;

    const statistics = ctx.managers.statistics();
    if (wasStatsMode && statistics) {
        statistics.reset();
    }
    ctx.actions.syncViewToggle();

    if (!silent) {
        ctx.actions.updateURL(true, true);
        ctx.actions.saveState();
    }
}

export async function leaveDetailMode(ctx) {
    if (ctx.state.activeMode !== APP_MODES.DETAIL) return false;

    const returnContext = ctx.state.detailReturnContext || 'list';
    const savedScrollPosition = ctx.state.scrollPositionBeforeDetail || 0;
    ctx.state.detailTarget = null;

    if (returnContext === 'stats') {
        ctx.state.activeMode = APP_MODES.STATS;
        const statisticsManager = await ctx.managers.ensureStatistics();
        await statisticsManager.render();
    } else if (returnContext === 'compare') {
        ctx.state.activeMode = APP_MODES.COMPARE;
        const compareManager = await ctx.managers.ensureCompare();
        compareManager.render();
    } else {
        ctx.state.activeMode = APP_MODES.LIST;
        void ctx.actions.render();
    }

    ctx.state.detailReturnContext = 'list';
    ctx.actions.syncViewToggle();
    ctx.actions.updateURL(true, true);
    ctx.actions.saveState();
    ctx.actions.updateLayout();

    setTimeout(() => {
        window.scrollTo({ top: savedScrollPosition, behavior: 'instant' });
    }, 0);
    return true;
}

export function resetMissingDetail(ctx) {
    ctx.state.activeMode = APP_MODES.LIST;
    ctx.state.detailTarget = null;
}

function getReturnContext(activeMode) {
    if (activeMode === APP_MODES.STATS) return 'stats';
    if (activeMode === APP_MODES.COMPARE) return 'compare';
    return 'list';
}
