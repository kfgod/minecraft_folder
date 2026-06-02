import { DOMManager } from '../../dom-manager.js';
import { renderStatusMessage } from '../../ui/status-view.js';

export function renderDetailNotFound(ctx) {
    renderStatusMessage(ctx.elements.content, 'Detail not found.');
    DOMManager.clearContainer(ctx.elements.navList);
}

export function renderDetailView(ctx, filteredData) {
    ctx.managers.navigation().renderDetailNav(filteredData);
    DOMManager.clearContainer(ctx.elements.content);

    const container = document.createElement('div');
    container.className = 'detail-view';

    const cardWrapper = document.createElement('div');
    cardWrapper.className = 'detail-card-wrapper';
    cardWrapper.appendChild(ctx.managers.cardRenderer().createCard(filteredData));
    container.appendChild(cardWrapper);

    ctx.elements.content.appendChild(container);
    window.scrollTo({ top: 0, behavior: 'instant' });
}
