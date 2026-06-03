import { CONFIG } from '../config.js';
import { DOMManager } from '../dom-manager.js';
import { SECTION_META, SECTION_TYPES } from '../section-config.js';

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
    if (data.length <= chunkSize) {
        const cards = data.map((item) => cardRenderer.createCard(item));
        app.elements.content.appendChild(DOMManager.createFragment(cards));
        afterRender();
        return;
    }

    let index = 0;
    const appendChunk = () => {
        const end = Math.min(index + chunkSize, data.length);
        const batch = [];
        for (; index < end; index++) {
            batch.push(cardRenderer.createCard(data[index]));
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
