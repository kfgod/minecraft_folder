import { CONFIG } from '../config.js';

export function attachContentController(app) {
    app.elements.content.addEventListener('click', (e) => {
        const detailCloseBtn = e.target.closest('.detail-close-btn');
        if (detailCloseBtn) {
            e.preventDefault();
            void app.detailViewManager.close();
            return;
        }

        const detailTrigger = e.target.closest('.detail-link');
        if (detailTrigger) {
            e.preventDefault();
            const detailType =
                detailTrigger.dataset.detailType ||
                (app.state.currentView === CONFIG.VIEWS.YEARS ? 'year' : 'version');
            const detailId = detailTrigger.dataset.detailId || detailTrigger.textContent.trim();
            app.detailViewManager.open(detailType, detailId);
            return;
        }

        const button = e.target.closest('.screenshot-btn');
        if (button) {
            app.cardRenderer.takeScreenshot(button.closest('.update-card'));
            return;
        }

        const scrollLink = e.target.closest('.scroll-to-item');
        if (scrollLink) {
            e.preventDefault();
            app.scrollToItem(scrollLink.dataset.targetIdentifier, scrollLink.dataset.targetType);
            return;
        }

        const clickableCard = e.target.closest('.clickable-card');
        if (clickableCard && clickableCard.dataset.wiki && !e.target.closest('a')) {
            window.open(clickableCard.dataset.wiki, '_blank', 'noopener,noreferrer');
            return;
        }

        const header = e.target.closest('.section-title');
        if (header) {
            toggleSection(header, app);
        }
    });

    app.elements.content.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const header = e.target.closest && e.target.closest('.section-title');
        if (!header) return;

        e.preventDefault();
        toggleSection(header, app);
    });
}

function toggleSection(header, app) {
    const section = header.closest('.card-section');
    if (!section) return;

    const isCollapsed = section.classList.toggle('collapsed');
    header.setAttribute('aria-expanded', String(!isCollapsed));
    app.rememberCollapsed(section);
}
