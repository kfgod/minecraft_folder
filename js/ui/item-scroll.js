import { DOMManager } from '../dom-manager.js';
import { DOM_SELECTORS } from '../constants/dom-classes.js';

export function scrollToGridItem(contentElement, identifier) {
    const targetItem = contentElement.querySelector(`${DOM_SELECTORS.GRID_ITEM}[data-identifier="${identifier}"]`);
    if (!targetItem) return;

    DOMManager.scrollIntoView(targetItem, {
        behavior: 'smooth',
        block: 'center',
    });

    targetItem.classList.add('highlight-item');
    setTimeout(() => {
        targetItem.classList.remove('highlight-item');
    }, 2000);
}
