import { Utils } from '../../utils.js';
import { SECTION_META } from '../../section-config.js';
import { createContentCard, createVersionCard } from './cards.js';

/**
 * Content cards in display order. A tap opens the list:
 * - `section` cards show only that section;
 * - `tag` cards search for `#tag` in the given sections.
 */
const CONTENT_TYPES = [
    { type: 'block', key: 'last_block', section: 'blocks' },
    { type: 'item', key: 'last_item', section: 'items' },
    { type: 'mob', key: 'last_mob', section: 'mobs' },
    { type: 'mob_variant', key: 'last_mob_variant', section: 'mob_variants' },
    { type: 'advancement', key: 'last_advancement', section: 'advancements' },
    { type: 'biome', key: 'last_biome', section: 'biomes' },
    { type: 'painting', key: 'last_painting', section: 'paintings' },
    { type: 'effect', key: 'last_effect', section: 'effects' },
    { type: 'enchantment', key: 'last_enchantment', section: 'enchantments' },
    { type: 'structure', key: 'last_structure', section: 'structures' },
    { type: 'food', key: 'last_food', tag: 'use:food', sections: ['blocks', 'items'] },
    { type: 'smithing_template', key: 'last_smithing_template', tag: 'kind:smithing_template', sections: ['blocks', 'items'] },
    { type: 'weapon', key: 'last_weapon', tag: 'use:weapon', sections: ['blocks', 'items'] },
    { type: 'tool', key: 'last_tool', tag: 'use:tool', sections: ['blocks', 'items'] },
    { type: 'armor', key: 'last_armor', tag: 'use:armor', sections: ['blocks', 'items'] },
    { type: 'pottery_sherd', key: 'last_pottery_sherd', tag: 'kind:pottery_sherd', sections: ['blocks', 'items'] },
    { type: 'banner_pattern', key: 'last_banner_pattern', tag: 'kind:banner_pattern', sections: ['blocks', 'items'] },
    { type: 'dye', key: 'last_dye', tag: 'kind:dye', sections: ['blocks', 'items'] },
    { type: 'seeds', key: 'last_seeds', tag: 'kind:seed', sections: ['blocks', 'items'] },
    { type: 'music_disc', key: 'last_music_disc', tag: 'kind:music_disc', sections: ['blocks', 'items'] },
    { type: 'flower', key: 'last_flower', tag: 'kind:flower', sections: ['blocks', 'items'] },
];

/** List options a card opens: a search query plus the content state keys left visible. */
export function getListTarget(entry) {
    const sections = entry.tag ? entry.sections : [entry.section];
    return {
        search: entry.tag ? `#${entry.tag}` : '',
        sections: sections.map((section) => SECTION_META[section]?.stateKey).filter(Boolean),
    };
}

export function renderTimeSinceView(container, data, { onOpenList } = {}) {
    if (!container) return;
    container.replaceChildren(createTimeSinceView(data, onOpenList));
}

function createTimeSinceView(data, onOpenList) {
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
        const target = getListTarget(item.entry);
        const onOpen = onOpenList ? () => onOpenList(target) : null;
        contentCards.appendChild(createContentCard(item.entry.type, item.data, { onOpen }));
    });

    root.append(title, versionCards, contentTitle, contentCards);
    return root;
}

function getSortedContentItems(data) {
    return CONTENT_TYPES
        .map((entry) => ({ entry, data: data?.[entry.key] }))
        .filter((item) => item.data)
        .sort((a, b) => {
            const dateA = Utils.parseDate(a.data.release_date)?.getTime() ?? 0;
            const dateB = Utils.parseDate(b.data.release_date)?.getTime() ?? 0;
            return dateB - dateA;
        });
}
