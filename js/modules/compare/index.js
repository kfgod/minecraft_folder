/**
 * Compare module for version/year comparison functionality.
 */
import { DOMManager } from '../../dom-manager.js';
import { buildCompareScreenshotFilename, takeElementScreenshot } from '../shared/screenshot-service.js';
import {
    filterCompareVersion,
    getCompareDataSource,
    getCompareDisplayName,
    isCompareYearView,
    normalizeCompareSelections,
} from './data.js';
import { attachCompareHandlers } from './controller.js';
import {
    createComparePlaceholder,
    getCompareElements,
    renderCompareCards,
    renderCompareEmpty,
    renderCompareSummary,
    renderCompareShell,
} from './view.js';

export class CompareManager {
    constructor(ctx) {
        this.ctx = ctx;
    }

    render() {
        DOMManager.clearContainer(this.ctx.elements.navList);

        const dataSource = getCompareDataSource(this.ctx);
        this.ctx.state.compareVersions = normalizeCompareSelections(this.ctx.state.compareVersions, dataSource);

        renderCompareShell(this.ctx.elements.content, {
            dataSource,
            selections: this.ctx.state.compareVersions,
            isYearView: isCompareYearView(this.ctx),
        });

        attachCompareHandlers({
            elements: getCompareElements(),
            dataSource,
            onSelectionChange: (index, item) => this.selectVersion(index, item),
            onScreenshot: () => this.takeScreenshot(),
        });

        this.renderCards();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    selectVersion(index, item) {
        this.ctx.state.compareVersions[index] = item;
        this.ctx.actions.updateURL(false, false);
        this.ctx.actions.saveState();
        this.renderCards();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    renderCards() {
        const { container, summary } = getCompareElements();
        if (!container) return;

        const [version1, version2] = this.ctx.state.compareVersions;
        if (!version1 && !version2) {
            renderCompareEmpty(container, summary, { isYearView: isCompareYearView(this.ctx) });
            return;
        }

        const firstLabel = isCompareYearView(this.ctx) ? 'Select year 1' : 'Select version 1';
        const secondLabel = isCompareYearView(this.ctx) ? 'Select year 2' : 'Select version 2';
        const card1 = version1
            ? this.ctx.managers.cardRenderer().createCard(this.applyFilters(version1))
            : createComparePlaceholder(firstLabel);
        const card2 = version2
            ? this.ctx.managers.cardRenderer().createCard(this.applyFilters(version2))
            : createComparePlaceholder(secondLabel);

        renderCompareCards(container, card1, card2);
        this.ctx.actions.applyCollapsedState();
        renderCompareSummary(
            summary,
            getCompareDisplayName(version1, 'Version 1'),
            getCompareDisplayName(version2, 'Version 2')
        );
    }

    applyFilters(version) {
        return filterCompareVersion(
            version,
            this.ctx.queries.getSearchQuery().trim(),
            this.ctx.state.removeDuplicates
        );
    }

    takeScreenshot() {
        const { container } = getCompareElements();
        if (!container) return;

        const [version1, version2] = this.ctx.state.compareVersions;
        if (!version1 || !version2) {
            alert('Please select both versions to take a comparison screenshot');
            return;
        }

        void takeElementScreenshot(container, {
            filename: buildCompareScreenshotFilename(version1, version2),
            backgroundColor: '#1a1a1a',
            scale: 2,
            errorLabel: 'Compare screenshot failed:',
        });
    }
}
