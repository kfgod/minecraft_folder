/**
 * Navigation panel manager module
 */
import { Utils } from '../utils.js';
import { CONFIG } from '../config.js';
import { DOMManager } from '../dom-manager.js';

export class NavigationManager {
    constructor(app) {
        this.app = app;
    }

    /**
     * Render navigation for list view (versions or years)
     * @param {Array} data - Array of update/year data to create navigation items for
     */
    renderListNav(data) {
        const navItems = data.map((item) => {
            const itemDisplayName = item.name;
            const li = DOMManager.createElement('li');
            const a = DOMManager.createElement('a', {
                href: `#${Utils.generateCardId(item)}`,
            });

            if (this.app.state.currentView === CONFIG.VIEWS.VERSIONS) {
                const displayDate = item.release_date || 'upcoming';
                a.innerHTML = `${
                    itemDisplayName || item.release_version?.java
                }<span class="nav-date">${displayDate}</span>`;
            } else {
                a.textContent = itemDisplayName;
            }

            li.appendChild(a);
            return li;
        });

        const fragment = DOMManager.createFragment(navItems);
        DOMManager.clearContainer(this.app.elements.navList);
        this.app.elements.navList.appendChild(fragment);
    }

    /**
     * Render navigation for detail view
     * Shows statistics and previous/next version navigation
     * @param {Object} detailData - The detail data object
     */
    renderDetailNav(detailData) {
        if (!detailData) return;

        DOMManager.clearContainer(this.app.elements.navList);

        // Get statistics counts
        const stats = this.getDetailStats(detailData);
        
        // Create statistics section
        if (stats.length > 0) {
            const statsSection = this.createStatsSection(stats);
            this.app.elements.navList.appendChild(statsSection);
        }

        // Create previous/next navigation section
        const navSection = this.createVersionNavigation(detailData);
        if (navSection) {
            this.app.elements.navList.appendChild(navSection);
        }
    }

    /**
     * Get statistics counts from detail data
     * @param {Object} detailData - The detail data object
     * @returns {Array} Array of {label, count, sectionType} objects
     */
    getDetailStats(detailData) {
        const added = detailData.added || {};
        const stats = [];

        // Map of section types to display labels
        const sectionLabels = {
            blocks: 'Blocks',
            items: 'Items',
            mobs: 'Mobs',
            mob_variants: 'Mob Variants',
            effects: 'Effects',
            enchantments: 'Enchantments',
            advancements: 'Advancements',
            paintings: 'Paintings',
            biomes: 'Biomes',
        };

        // Map section types to state keys
        const stateKeyMap = {
            blocks: 'showBlocks',
            items: 'showItems',
            mobs: 'showMobs',
            mob_variants: 'showMobVariants',
            effects: 'showEffects',
            enchantments: 'showEnchantments',
            advancements: 'showAdvancements',
            paintings: 'showPaintings',
            biomes: 'showBiomes',
        };

        // Only show sections that have content and are enabled
        Object.entries(sectionLabels).forEach(([sectionType, label]) => {
            const items = added[sectionType];
            if (Array.isArray(items) && items.length > 0) {
                // Check if this section type is enabled
                const stateKey = stateKeyMap[sectionType];
                const isEnabled = stateKey ? this.app.state[stateKey] !== false : true;
                
                if (isEnabled) {
                    stats.push({
                        label,
                        count: items.length,
                        sectionType,
                    });
                }
            }
        });

        return stats;
    }

    /**
     * Create statistics section for navigation
     * @param {Array} stats - Array of statistics objects
     * @returns {HTMLElement} Statistics section element
     */
    createStatsSection(stats) {
        const section = document.createElement('div');
        section.className = 'nav-stats-section';

        const title = document.createElement('h4');
        title.className = 'nav-section-title';
        title.textContent = 'Statistics';
        section.appendChild(title);

        const list = document.createElement('ul');
        list.className = 'nav-stats-list';

        stats.forEach((stat) => {
            const li = document.createElement('li');
            const button = document.createElement('button');
            button.className = 'nav-stat-item';
            button.type = 'button';
            button.setAttribute('data-section-type', stat.sectionType);
            
            const labelSpan = document.createElement('span');
            labelSpan.className = 'nav-stat-label';
            labelSpan.textContent = stat.label;
            
            const countSpan = document.createElement('span');
            countSpan.className = 'nav-stat-count';
            countSpan.textContent = stat.count;

            button.appendChild(labelSpan);
            button.appendChild(countSpan);
            li.appendChild(button);
            list.appendChild(li);
        });

        section.appendChild(list);
        return section;
    }

    /**
     * Create previous/next version navigation section
     * @param {Object} detailData - The current detail data
     * @returns {HTMLElement|null} Navigation section element or null
     */
    createVersionNavigation(detailData) {
        const isYearView = this.app.state.detailTarget?.type === 'year';
        const dataSource = isYearView 
            ? this.app.getYearEntries()
            : this.app.state.allUpdates;

        const currentIndex = dataSource.findIndex(
            (item) => Utils.generateCardId(item) === Utils.generateCardId(detailData)
        );

        if (currentIndex === -1) return null;

        const prevItem = currentIndex > 0 ? dataSource[currentIndex - 1] : null;
        const nextItem = currentIndex < dataSource.length - 1 ? dataSource[currentIndex + 1] : null;

        if (!prevItem && !nextItem) return null;

        const section = document.createElement('div');
        section.className = 'nav-version-nav-section';

        const title = document.createElement('h4');
        title.className = 'nav-section-title';
        title.textContent = isYearView ? 'Years' : 'Versions';
        section.appendChild(title);

        const navList = document.createElement('div');
        navList.className = 'nav-version-nav-list';

        // Previous version
        if (prevItem) {
            const prevButton = this.createVersionNavButton(prevItem, 'Previous', isYearView);
            navList.appendChild(prevButton);
        }

        // Next version
        if (nextItem) {
            const nextButton = this.createVersionNavButton(nextItem, 'Next', isYearView);
            navList.appendChild(nextButton);
        }

        section.appendChild(navList);
        return section;
    }

    /**
     * Create a version navigation button
     * @param {Object} item - The version/year item
     * @param {string} label - Button label (Previous/Next)
     * @param {boolean} isYearView - Whether this is a year view
     * @returns {HTMLElement} Button element
     */
    createVersionNavButton(item, label, isYearView) {
        const button = document.createElement('button');
        button.className = 'nav-version-nav-btn';
        button.type = 'button';
        button.setAttribute('data-detail-type', isYearView ? 'year' : 'version');
        button.setAttribute('data-detail-id', Utils.generateCardId(item));

        const labelSpan = document.createElement('span');
        labelSpan.className = 'nav-version-nav-label';
        labelSpan.textContent = label;

        const nameSpan = document.createElement('span');
        nameSpan.className = 'nav-version-nav-name';
        if (isYearView) {
            nameSpan.textContent = item.name;
        } else {
            const version = item.release_version?.java || '';
            const name = item.name || '';
            nameSpan.textContent = [version, name].filter(Boolean).join(' — ') || 'Unknown';
        }

        button.appendChild(labelSpan);
        button.appendChild(nameSpan);
        return button;
    }

    /**
     * Handle scroll to section when clicking on statistics
     * @param {string} sectionType - The section type to scroll to
     */
    scrollToSection(sectionType) {
        const section = this.app.elements.content.querySelector(
            `.card-section[data-section="${sectionType}"]`
        );

        if (section) {
            const sectionTitle = section.querySelector('.section-title');
            if (sectionTitle) {
                // Expand section if collapsed
                if (section.classList.contains('collapsed')) {
                    section.classList.remove('collapsed');
                    sectionTitle.setAttribute('aria-expanded', 'true');
                    this.app.rememberCollapsed(section);
                }

                // Scroll to section
                DOMManager.scrollIntoView(sectionTitle, {
                    behavior: 'smooth',
                    block: 'start',
                });

                // Add highlight effect
                sectionTitle.classList.add('highlight-section');
                setTimeout(() => {
                    sectionTitle.classList.remove('highlight-section');
                }, 2000);
            }
        }
    }
}

