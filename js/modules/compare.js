/**
 * Compare module for version/year comparison functionality
 */
import { Utils } from '../utils.js';
import { CONFIG } from '../config.js';
import { DOMManager } from '../dom-manager.js';
import { DataManager } from '../data-manager.js';

export class CompareManager {
    constructor(app) {
        this.app = app;
    }

    render() {
        DOMManager.clearContainer(this.app.elements.navList);

        const isYearView = this.app.state.currentView === CONFIG.VIEWS.YEARS;
        const dataSource = isYearView ? this.app.getYearEntries() : this.app.state.allUpdates;
        const label1 = isYearView ? 'Year 1:' : 'Version 1:';
        const label2 = isYearView ? 'Year 2:' : 'Version 2:';
        const placeholder = isYearView ? 'Select a year...' : 'Select a version...';
        const compareTitle = isYearView ? 'Compare Years' : 'Compare Versions';

        this.app.state.compareVersions = this.app.state.compareVersions.map((item) => {
            if (!item) return null;
            const match = dataSource.find((entry) => Utils.generateCardId(entry) === Utils.generateCardId(item));
            return match || null;
        });

        const selectorHtml = `
            <div class="compare-container">
                <div class="compare-header">
                    <h3 class="compare-title">${compareTitle}</h3>
                    <button class="screenshot-compare-btn" aria-label="Save comparison as image" title="Save comparison as image">
                        <img src="static/images/icons/save_image.svg"> Save Comparison
                    </button>
                </div>
                <div class="compare-selectors">
                    <div class="compare-selector">
                        <label for="compare-version-1">${label1}</label>
                        <select id="compare-version-1" class="version-select">
                            <option value="">${placeholder}</option>
                            ${this.generateSelectorOptions(dataSource, 0)}
                        </select>
                    </div>
                    <div class="compare-selector">
                        <label for="compare-version-2">${label2}</label>
                        <select id="compare-version-2" class="version-select">
                            <option value="">${placeholder}</option>
                            ${this.generateSelectorOptions(dataSource, 1)}
                        </select>
                    </div>
                </div>
                <div class="compare-cards" id="compare-cards-container"></div>
            </div>
        `;

        this.app.elements.content.innerHTML = selectorHtml;

        const select1 = document.getElementById('compare-version-1');
        const select2 = document.getElementById('compare-version-2');

        select1.addEventListener('change', (e) => {
            const cardId = e.target.value;
            this.app.state.compareVersions[0] = dataSource.find((u) => Utils.generateCardId(u) === cardId) || null;
            this.app.updateURL(false, false);
            this.app.saveState();
            this.renderCards();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        select2.addEventListener('change', (e) => {
            const cardId = e.target.value;
            this.app.state.compareVersions[1] = dataSource.find((u) => Utils.generateCardId(u) === cardId) || null;
            this.app.updateURL(false, false);
            this.app.saveState();
            this.renderCards();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        const screenshotCompareBtn = document.querySelector('.screenshot-compare-btn');
        if (screenshotCompareBtn) {
            screenshotCompareBtn.addEventListener('click', () => {
                this.takeScreenshot();
            });
        }

        this.renderCards();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    renderCards() {
        const container = document.getElementById('compare-cards-container');
        if (!container) return;

        const [version1, version2] = this.app.state.compareVersions;

        if (!version1 && !version2) {
            container.innerHTML = '<p class="compare-empty">Select two versions to compare</p>';
            return;
        }

        const filteredVersion1 = version1 ? this.applyFilters(version1) : null;
        const filteredVersion2 = version2 ? this.applyFilters(version2) : null;

        const card1Html = filteredVersion1
            ? this.app.cardRenderer.createCard(filteredVersion1).outerHTML
            : '<div class="compare-placeholder">Select version 1</div>';
        const card2Html = filteredVersion2
            ? this.app.cardRenderer.createCard(filteredVersion2).outerHTML
            : '<div class="compare-placeholder">Select version 2</div>';

        container.innerHTML = `
            <div class="compare-card-wrapper">${card1Html}</div>
            <div class="compare-card-wrapper">${card2Html}</div>
        `;

        this.app.applyCollapsedState();
    }

    applyFilters(version) {
        const searchQuery = this.app.elements.searchBar.value.trim();
        
        return {
            ...version,
            added: {
                blocks: DataManager.filterItems(version.added?.blocks, searchQuery, this.app.state.removeDuplicates),
                items: DataManager.filterItems(version.added?.items, searchQuery, this.app.state.removeDuplicates),
                mobs: DataManager.filterItems(version.added?.mobs, searchQuery, this.app.state.removeDuplicates),
                mob_variants: DataManager.filterItems(version.added?.mob_variants, searchQuery, this.app.state.removeDuplicates),
                effects: DataManager.filterItems(version.added?.effects, searchQuery, this.app.state.removeDuplicates),
                enchantments: DataManager.filterItems(version.added?.enchantments, searchQuery, this.app.state.removeDuplicates),
                advancements: DataManager.filterItems(version.added?.advancements, searchQuery, this.app.state.removeDuplicates),
                paintings: DataManager.filterItems(version.added?.paintings, searchQuery, this.app.state.removeDuplicates),
                biomes: DataManager.filterItems(version.added?.biomes, searchQuery, this.app.state.removeDuplicates),
            },
        };
    }

    generateSelectorOptions(dataSource, selectorIndex) {
        return dataSource
            .map((item) => {
                const displayText =
                    this.app.state.currentView === CONFIG.VIEWS.YEARS
                        ? item.name
                        : item.name
                        ? `${item.release_version?.java || item.name} — ${item.name}`
                        : item.release_version?.java || 'Unknown';
                const itemId = Utils.generateCardId(item);
                const selectedId = this.app.state.compareVersions[selectorIndex]
                    ? Utils.generateCardId(this.app.state.compareVersions[selectorIndex])
                    : null;
                const selected = itemId === selectedId ? 'selected' : '';
                return `<option value="${itemId}" ${selected}>${displayText}</option>`;
            })
            .join('');
    }

    takeScreenshot() {
        const container = document.getElementById('compare-cards-container');
        if (!container) return;

        const [version1, version2] = this.app.state.compareVersions;
        if (!version1 || !version2) {
            alert('Please select both versions to take a comparison screenshot');
            return;
        }

        const screenshotButtons = container.querySelectorAll('.screenshot-btn');
        screenshotButtons.forEach((btn) => DOMManager.setVisibility(btn, false));

        html2canvas(container, {
            backgroundColor: '#1a1a1a',
            useCORS: true,
            scale: 2,
        }).then((canvas) => {
            screenshotButtons.forEach((btn) => DOMManager.setVisibility(btn, true));

            const name1 = version1.release_version?.java || version1.name || 'v1';
            const name2 = version2.release_version?.java || version2.name || 'v2';
            const filename = `compare_${name1}_vs_${name2}.png`.replace(/[^a-z0-9_.-]/gi, '_');

            const link = DOMManager.createElement('a', {
                download: filename,
                href: canvas.toDataURL('image/png'),
            });
            link.click();
        });
    }
}

