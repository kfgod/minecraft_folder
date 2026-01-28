/**
 * Detail view module for displaying detailed version/year information
 */
import { Utils } from '../utils.js';
import { CONFIG } from '../config.js';
import { DOMManager } from '../dom-manager.js';
import { DataManager } from '../data-manager.js';

export class DetailViewManager {
    constructor(app) {
        this.app = app;
    }

    getDetailData(target) {
        if (!target) return null;
        if (target.type === 'year') {
            return this.app.getYearEntries().find((entry) => Utils.generateCardId(entry) === target.id);
        }
        return this.app.state.allUpdates.find((entry) => Utils.generateCardId(entry) === target.id);
    }

    open(detailType, detailId, options = {}) {
        if (!detailId) return;
        const { silent = false, preserveContext = false } = options;
        const targetData = this.getDetailData({ type: detailType, id: detailId });
        if (!targetData) {
            console.warn('Detail target not found', detailType, detailId);
            return;
        }

        if (!preserveContext) {
            this.app.state.detailReturnContext = this.app.state.isStatsMode
                ? 'stats'
                : this.app.state.isCompareMode
                ? 'compare'
                : 'list';
        }

        this.app.state.currentView = detailType === 'year' ? CONFIG.VIEWS.YEARS : CONFIG.VIEWS.VERSIONS;
        const wasStatsMode = this.app.state.isStatsMode;

        // Save scroll position before opening detail view
        this.app.state.scrollPositionBeforeDetail = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;

        this.app.state.detailTarget = { type: detailType, id: detailId };
        this.app.state.detailSection = null;
        this.app.state.isDetailMode = true;
        this.app.state.isStatsMode = false;
        this.app.state.isCompareMode = false;
        if (wasStatsMode && this.app.statisticsManager) {
            this.app.statisticsManager.reset();
        }
        this.app.syncViewToggle();

        if (!silent) {
            this.app.updateURL(true, true);
            this.app.saveState();
        }

        this.render(targetData);
        this.app.updateLayout();
        // Scroll to top when opening detail view
        window.scrollTo({ top: 0, behavior: 'instant' });
    }

    render(preloadedData = null) {
        if (!this.app.state.detailTarget) {
            this.app.state.isDetailMode = false;
            this.app.render();
            return;
        }

        const targetData = preloadedData || this.getDetailData(this.app.state.detailTarget);

        if (!targetData) {
            this.app.state.isDetailMode = false;
            this.app.state.detailTarget = null;
            this.app.elements.content.innerHTML = `<p class="empty-state">Detail not found.</p>`;
            DOMManager.clearContainer(this.app.elements.navList);
            return;
        }

        // Render navigation for detail view
        this.app.navigationManager.renderDetailNav(targetData);

        // Get search query from search bar
        const searchQuery = this.app.getSearchQuery().toLowerCase();
        
        const filteredData = {
            ...targetData,
            added: DataManager.filterAllContentTypes(targetData, searchQuery, this.app.state.removeDuplicates),
        };

        DOMManager.clearContainer(this.app.elements.content);
        const container = document.createElement('div');
        container.className = 'detail-view';

        const cardWrapper = document.createElement('div');
        cardWrapper.className = 'detail-card-wrapper';
        cardWrapper.appendChild(this.app.cardRenderer.createCard(filteredData));
        container.appendChild(cardWrapper);

        this.app.elements.content.appendChild(container);
        window.scrollTo({ top: 0, behavior: 'instant' });
    }


    close() {
        if (!this.app.state.isDetailMode) return;

        const returnContext = this.app.state.detailReturnContext || 'list';
        const savedScrollPosition = this.app.state.scrollPositionBeforeDetail || 0;
        
        this.app.state.isDetailMode = false;
        this.app.state.detailTarget = null;

        if (returnContext === 'stats') {
            this.app.state.isStatsMode = true;
            this.app.state.isCompareMode = false;
            if (this.app.statisticsManager) {
                this.app.statisticsManager.render();
            }
        } else if (returnContext === 'compare') {
            this.app.state.isCompareMode = true;
            this.app.state.isStatsMode = false;
            if (this.app.compareManager) {
                this.app.compareManager.render();
            }
        } else {
            this.app.state.isStatsMode = false;
            this.app.state.isCompareMode = false;
            this.app.render();
        }

        this.app.state.detailReturnContext = 'list';
        this.app.syncViewToggle();
        this.app.updateURL(true, true);
        this.app.saveState();
        this.app.updateLayout();
        
        // Restore scroll position after rendering
        setTimeout(() => {
            window.scrollTo({ top: savedScrollPosition, behavior: 'instant' });
        }, 0);
    }
}

