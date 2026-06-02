import { APP_MODES } from '../app-modes.js';

export function updateActiveNavLink(app) {
    if (app.state.activeMode === APP_MODES.DETAIL) return;
    const navLinks = app.elements.navList?.querySelectorAll('a[href^="#"]');
    if (!navLinks || navLinks.length === 0) return;
    const cards = app.elements.content?.querySelectorAll('.update-card');
    if (!cards || cards.length === 0) return;

    let currentId = null;
    const offset = 120;
    cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        if (rect.top <= offset && rect.bottom > offset) {
            currentId = card.id;
        }
    });

    navLinks.forEach((link) => {
        const href = link.getAttribute('href') || '';
        link.classList.toggle('is-active', Boolean(currentId && href === `#${currentId}`));
    });
}
