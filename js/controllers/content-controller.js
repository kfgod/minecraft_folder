import { CONFIG } from '../config.js';
import { hasItemInfo, loadItemIndex } from '../modules/item-info/data.js';

export function attachContentController(app) {
    // The index decides synchronously on click whether a cell has recipes; fetch it up front.
    if (CONFIG.FEATURES.ITEM_PAGE) setTimeout(() => void loadItemIndex(), 0);

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

        const itemInfoCell = e.target.closest('[data-item-info]');
        if (CONFIG.FEATURES.ITEM_PAGE && itemInfoCell && !isModifiedClick(e) && hasItemInfo(itemInfoCell.dataset.itemInfo)) {
            e.preventDefault();
            app.openItem(itemInfoCell.dataset.itemInfo);
            return;
        }

        const itemTarget = e.target.closest('[data-item-target]');
        if (itemTarget?.dataset.itemTarget) {
            e.preventDefault();
            app.openItem(itemTarget.dataset.itemTarget.replace(/^minecraft:/, ''));
            return;
        }

        if (e.target.closest('[data-item-back]')) {
            e.preventDefault();
            // Back within the app's own history; a page opened directly goes to the list.
            if (window.history.state?.itemDepth >= 1) window.history.back();
            else app.selectMode('list');
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
        const clickableCard = e.target.closest && e.target.closest('.clickable-card');
        if (clickableCard === e.target && clickableCard.dataset.wiki) {
            e.preventDefault();
            window.open(clickableCard.dataset.wiki, '_blank', 'noopener,noreferrer');
            return;
        }

        const header = e.target.closest && e.target.closest('.section-title');
        if (!header) return;

        e.preventDefault();
        toggleSection(header, app);
    });
}

// Cmd/Ctrl/Shift-click and middle click keep opening the Wiki link.
function isModifiedClick(e) {
    return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
}

function toggleSection(header, app) {
    const section = header.closest('.card-section');
    if (!section) return;

    const isCollapsed = section.classList.toggle('collapsed');
    header.setAttribute('aria-expanded', String(!isCollapsed));
    app.rememberCollapsed(section);
}
