import { createContentCard, createVersionCard } from './cards.js';

const CONTENT_TYPES = [
    ['block', 'last_block'],
    ['item', 'last_item'],
    ['mob', 'last_mob'],
    ['mob_variant', 'last_mob_variant'],
    ['advancement', 'last_advancement'],
    ['biome', 'last_biome'],
    ['painting', 'last_painting'],
    ['effect', 'last_effect'],
    ['enchantment', 'last_enchantment'],
    ['structure', 'last_structure'],
];

export function renderTimeSinceView(container, data) {
    if (!container) return;
    container.replaceChildren(createTimeSinceView(data));
}

function createTimeSinceView(data) {
    const { last_drop, last_major } = data || {};

    const root = document.createElement('div');
    root.className = 'time-since-container';

    const title = document.createElement('h1');
    title.className = 'time-since-title';
    title.textContent = 'Time Since Last Update';

    const versionCards = document.createElement('div');
    versionCards.className = 'time-since-cards time-since-cards-versions';
    if (last_drop) versionCards.appendChild(createVersionCard('drop', last_drop));
    if (last_major) versionCards.appendChild(createVersionCard('major', last_major));

    const contentTitle = document.createElement('h2');
    contentTitle.className = 'time-since-subtitle';
    contentTitle.textContent = 'Time Since Last Content';

    const contentCards = document.createElement('div');
    contentCards.className = 'time-since-cards time-since-cards-content';
    getSortedContentItems(data).forEach((item) => {
        contentCards.appendChild(createContentCard(item.type, item.data));
    });

    root.append(title, versionCards, contentTitle, contentCards);
    return root;
}

function getSortedContentItems(data) {
    return CONTENT_TYPES
        .map(([type, key]) => ({ type, data: data?.[key] }))
        .filter((item) => item.data)
        .sort((a, b) => {
            const dateA = a.data.release_date ? new Date(a.data.release_date).getTime() : 0;
            const dateB = b.data.release_date ? new Date(b.data.release_date).getTime() : 0;
            return dateB - dateA;
    });
}
