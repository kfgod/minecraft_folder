import { DOM_SELECTORS } from '../constants/dom-classes.js';

export function getSectionCollapseKey(sectionEl) {
    const card = sectionEl.closest('.update-card');
    if (!card) return null;
    const cardId = card.id || 'unknown';
    const sectionType = sectionEl.getAttribute('data-section') || 'unknown';
    return `${cardId}:${sectionType}`;
}

export function rememberCollapsedSection(state, sectionEl) {
    const key = getSectionCollapseKey(sectionEl);
    if (!key) return false;
    state.collapsedSections[key] = sectionEl.classList.contains('collapsed');
    return true;
}

export function applyCollapsedSections(state, root = document) {
    const sections = root.querySelectorAll(`${DOM_SELECTORS.UPDATE_CARD} ${DOM_SELECTORS.CARD_SECTION}`);
    sections.forEach((sectionEl) => {
        const key = getSectionCollapseKey(sectionEl);
        if (!key || !state.collapsedSections[key]) return;

        sectionEl.classList.add('collapsed');
        sectionEl.querySelector(DOM_SELECTORS.SECTION_TITLE)?.setAttribute('aria-expanded', 'false');
    });
}
