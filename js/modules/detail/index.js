/**
 * Detail view module for displaying detailed version/year information.
 */
import { APP_MODES } from '../../app-modes.js';
import { enterDetailMode, leaveDetailMode, resetMissingDetail } from './actions.js';
import { getDetailData, getFilteredDetailData } from './data.js';
import { renderDetailNotFound, renderDetailView } from './renderer.js';

export class DetailViewManager {
    constructor(ctx) {
        this.ctx = ctx;
    }

    getDetailData(target) {
        return getDetailData(this.ctx, target);
    }

    open(detailType, detailId, options = {}) {
        if (!detailId) return;

        const targetData = this.getDetailData({ type: detailType, id: detailId });
        if (!targetData) {
            console.warn('Detail target not found', detailType, detailId);
            return;
        }

        enterDetailMode(this.ctx, {
            detailType,
            detailId,
            silent: Boolean(options.silent),
            preserveContext: Boolean(options.preserveContext),
        });
        this.render(targetData);
        this.ctx.actions.updateLayout();
        window.scrollTo({ top: 0, behavior: 'instant' });
    }

    render(preloadedData = null) {
        if (!this.ctx.state.detailTarget) {
            this.ctx.state.activeMode = APP_MODES.LIST;
            void this.ctx.actions.render();
            return;
        }

        const targetData = preloadedData || this.getDetailData(this.ctx.state.detailTarget);
        if (!targetData) {
            resetMissingDetail(this.ctx);
            renderDetailNotFound(this.ctx);
            return;
        }

        renderDetailView(this.ctx, getFilteredDetailData(this.ctx, targetData));
    }

    async close() {
        await leaveDetailMode(this.ctx);
    }
}
