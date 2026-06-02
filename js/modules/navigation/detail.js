import { Utils } from '../../utils.js';
import { CONFIG } from '../../config.js';
import { DOMManager } from '../../dom-manager.js';
import { DETAIL_STATS_ORDER, SECTION_META } from '../../section-config.js';
import { updateNavControls } from './controls.js';

export function renderDetailNavigation(ctx, detailData) {
    if (!detailData) return;

    DOMManager.clearContainer(ctx.elements.navList);
    updateNavControls(ctx, null, true);

    const stats = getDetailStats(ctx, detailData);
    if (stats.length > 0) {
        ctx.elements.navList.appendChild(createStatsSection(stats));
    }

    const navSection = createVersionNavigation(ctx, detailData);
    if (navSection) {
        ctx.elements.navList.appendChild(navSection);
    }
}

function getDetailStats(ctx, detailData) {
    const added = detailData.added || {};
    const stats = [];

    DETAIL_STATS_ORDER.forEach((sectionType) => {
        const meta = SECTION_META[sectionType];
        if (!meta?.detailStats) return;
        const items = added[sectionType];
        if (!Array.isArray(items) || items.length === 0) return;
        const isEnabled = meta.stateKey ? ctx.state[meta.stateKey] !== false : true;
        if (!isEnabled) return;
        stats.push({
            label: meta.label,
            count: items.length,
            sectionType,
        });
    });

    return stats;
}

function createStatsSection(stats) {
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

function createVersionNavigation(ctx, detailData) {
    const isYearView = ctx.state.detailTarget?.type === 'year';
    const dataSource = isYearView ? ctx.queries.getYearEntries() : ctx.state.allUpdates;
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

    if (prevItem) {
        navList.appendChild(createVersionNavButton(prevItem, 'Next', isYearView));
    }
    if (nextItem) {
        navList.appendChild(createVersionNavButton(nextItem, 'Previous', isYearView));
    }

    section.appendChild(navList);
    return section;
}

function createVersionNavButton(item, label, isYearView) {
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
