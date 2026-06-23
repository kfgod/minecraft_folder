import { CONFIG } from '../config.js';
import { DOMManager } from '../dom-manager.js';
import { SECTION_META, SECTION_TYPES } from '../section-config.js';
import { Utils } from '../utils.js';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function getResultsSummary(app, data) {
    const query = app.getSearchQuery();
    const entryCount = data.length;
    let itemCount = 0;
    data.forEach((entry) => {
        SECTION_TYPES.forEach((type) => {
            const stateKey = SECTION_META[type]?.stateKey;
            if (stateKey && !app.state[stateKey]) return;
            itemCount += entry.added?.[type]?.length || 0;
        });
    });
    return { query, entryCount, itemCount };
}

export function renderResultsSummary(app, data) {
    const summary = getResultsSummary(app, data);
    return { ...summary, safeQuery: summary.query };
}

export function renderEmptyState(app, summary) {
    const emptyMessage = summary.query ? `No results found for "${summary.safeQuery}"` : 'No content available';
    const emptyElement = document.createElement('p');
    emptyElement.className = 'empty-state';
    emptyElement.textContent = emptyMessage;
    app.elements.content.appendChild(emptyElement);
}

export function renderCardsInChunks({ app, data, cardRenderer, afterRender }) {
    const chunkSize = CONFIG.LIST_RENDER_CHUNK_SIZE;
    const renderContext = createCardListRenderContext(app, data);
    if (data.length <= chunkSize) {
        const cards = createCardListNodes(data, cardRenderer, renderContext, 0);
        app.elements.content.appendChild(DOMManager.createFragment(cards));
        afterRender();
        return;
    }

    let index = 0;
    const appendChunk = () => {
        const end = Math.min(index + chunkSize, data.length);
        const batch = [];
        for (; index < end; index++) {
            batch.push(...createCardListNodes([data[index]], cardRenderer, renderContext, index));
        }
        app.elements.content.appendChild(DOMManager.createFragment(batch));
        if (index < data.length) {
            requestAnimationFrame(appendChunk);
        } else {
            afterRender();
        }
    };
    requestAnimationFrame(appendChunk);
}

function createCardListNodes(data, cardRenderer, renderContext, startIndex) {
    return data.flatMap((item, offset) => {
        const index = startIndex + offset;
        const nodes = [];
        if (renderContext.showVersionGaps && index > 0) {
            const previous = renderContext.displayedData[index - 1];
            nodes.push(createVersionGapDivider(previous, item, renderContext.versionOrder, renderContext.showVersionGapCount));
        }
        nodes.push(cardRenderer.createCard(item));
        return nodes;
    });
}

function createCardListRenderContext(app, displayedData) {
    const hasSearchQuery = Boolean(app.getSearchQuery().trim());
    return {
        displayedData,
        versionOrder: createVersionOrder(app.state.allUpdates),
        showVersionGaps: shouldShowVersionGaps(app),
        showVersionGapCount: hasSearchQuery,
    };
}

function shouldShowVersionGaps(app) {
    if (app.state.currentView !== CONFIG.VIEWS.VERSIONS) return false;
    return hasActiveListFilter(app);
}

function hasActiveListFilter(app) {
    if (app.getSearchQuery().trim()) return true;
    return SECTION_TYPES.some((type) => {
        const stateKey = SECTION_META[type]?.stateKey;
        return stateKey && app.state[stateKey] === false;
    });
}

function createVersionOrder(allUpdates) {
    return new Map(allUpdates.map((item, index) => [getVersionKey(item), index]));
}

function createVersionGapDivider(previous, current, versionOrder, showVersionGapCount) {
    const divider = document.createElement('div');
    divider.className = 'version-gap-divider';
    divider.setAttribute('role', 'separator');
    divider.textContent = getVersionGapLabel(previous, current, versionOrder, { showVersionGapCount });
    return divider;
}

export function getVersionGapLabel(
    previous,
    current,
    versionOrder = createVersionOrder([previous, current]),
    { showVersionGapCount = true } = {}
) {
    const versionGap = getVersionGap(previous, current, versionOrder);
    const dayText = getDayGapText(previous?.release_date, current?.release_date);
    if (!showVersionGapCount) return `${dayText} between`;
    const versionText = `${versionGap} ${pluralize(versionGap, 'version', 'versions')}`;
    return `${versionText}, ${dayText} between`;
}

function getVersionGap(previous, current, versionOrder) {
    const previousIndex = versionOrder.get(getVersionKey(previous));
    const currentIndex = versionOrder.get(getVersionKey(current));
    if (!Number.isInteger(previousIndex) || !Number.isInteger(currentIndex)) return 0;
    return Math.max(Math.abs(currentIndex - previousIndex) - 1, 0);
}

function getDayGap(previousDate, currentDate) {
    const previous = Utils.parseDate(previousDate);
    const current = Utils.parseDate(currentDate);
    if (!previous || !current) return null;
    return Math.round(Math.abs(previous.getTime() - current.getTime()) / DAY_IN_MS);
}

function getDayGapText(previousDate, currentDate) {
    const hasPreviousDate = Boolean(previousDate);
    const hasCurrentDate = Boolean(currentDate);
    if (hasPreviousDate !== hasCurrentDate) return 'release date pending';

    const dayGap = getDayGap(previousDate, currentDate);
    if (dayGap === null) return 'date gap unavailable';
    return `${dayGap} ${pluralize(dayGap, 'day', 'days')}`;
}

function getVersionKey(item) {
    return item?.release_version?.java || item?.name || '';
}

function pluralize(count, one, many) {
    return count === 1 ? one : many;
}
