/**
 * Navigation panel manager facade.
 */
import { applyNavFilter } from './controls.js';
import { renderDetailNavigation } from './detail.js';
import { renderListNavigation } from './list.js';
import { scrollToDetailSection } from './scroll.js';

export class NavigationManager {
    constructor(ctx) {
        this.ctx = ctx;
    }

    renderListNav(data) {
        renderListNavigation(this.ctx, data);
    }

    renderDetailNav(detailData) {
        renderDetailNavigation(this.ctx, detailData);
    }

    applyNavFilter(query) {
        applyNavFilter(this.ctx, query);
    }

    scrollToSection(sectionType) {
        scrollToDetailSection(this.ctx, sectionType);
    }
}
