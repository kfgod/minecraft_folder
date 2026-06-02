import { DOMManager } from '../../dom-manager.js';

export function scrollToDetailSection(ctx, sectionType) {
    const section = ctx.elements.content.querySelector(`.card-section[data-section="${sectionType}"]`);
    if (!section) return;

    const sectionTitle = section.querySelector('.section-title');
    if (!sectionTitle) return;

    if (section.classList.contains('collapsed')) {
        section.classList.remove('collapsed');
        sectionTitle.setAttribute('aria-expanded', 'true');
        ctx.actions.rememberCollapsed(section);
    }

    DOMManager.scrollIntoView(sectionTitle, {
        behavior: 'smooth',
        block: 'start',
    });

    sectionTitle.classList.add('highlight-section');
    setTimeout(() => {
        sectionTitle.classList.remove('highlight-section');
    }, 2000);
}
