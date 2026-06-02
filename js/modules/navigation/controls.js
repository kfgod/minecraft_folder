import { Utils } from '../../utils.js';
import { CONFIG } from '../../config.js';

export function updateNavControls(ctx, data, isDetailMode = false) {
    const controls = document.querySelector('.nav-controls');
    if (controls) {
        controls.style.display = isDetailMode ? 'none' : 'flex';
    }
    if (!data || isDetailMode || !ctx.elements.navJump) return;

    ctx.elements.navJump.replaceChildren(
        createJumpOption('', 'Jump to…'),
        ...data.map((item) => createJumpOption(Utils.generateCardId(item), getNavItemLabel(ctx, item))),
    );
}

export function applyNavFilter(ctx, query) {
    const items = ctx.elements.navList?.querySelectorAll('li');
    if (!items) return;

    const normalized = (query || '').trim().toLowerCase();
    items.forEach((li) => {
        const text = li.textContent?.toLowerCase() || '';
        li.style.display = !normalized || text.includes(normalized) ? '' : 'none';
    });
}

function getNavItemLabel(ctx, item) {
    if (ctx.state.currentView === CONFIG.VIEWS.YEARS) {
        return item.name;
    }
    if (item.name) {
        return `${item.release_version?.java || item.name} — ${item.name}`;
    }
    return item.release_version?.java || 'Unknown';
}

function createJumpOption(value, label) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    return option;
}
