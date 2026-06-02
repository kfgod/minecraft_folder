import { Utils } from '../../utils.js';
import { CONFIG } from '../../config.js';
import { DOMManager } from '../../dom-manager.js';
import { applyNavFilter, updateNavControls } from './controls.js';

export function renderListNavigation(ctx, data) {
    updateNavControls(ctx, data);
    const navItems = data.map((item) => createListNavItem(ctx, item));
    const fragment = DOMManager.createFragment(navItems);
    DOMManager.clearContainer(ctx.elements.navList);
    ctx.elements.navList.appendChild(fragment);
    applyNavFilter(ctx, ctx.elements.navSearch?.value || '');
}

function createListNavItem(ctx, item) {
    const itemDisplayName = item.name;
    const li = DOMManager.createElement('li');
    const a = DOMManager.createElement('a', {
        href: `#${Utils.generateCardId(item)}`,
    });

    if (ctx.state.currentView === CONFIG.VIEWS.VERSIONS) {
        const displayDate = item.release_date || 'upcoming';
        const date = DOMManager.createElement('span', { className: 'nav-date' }, displayDate);
        a.append(itemDisplayName || item.release_version?.java || '', date);
    } else {
        a.textContent = itemDisplayName;
    }

    li.appendChild(a);
    return li;
}
