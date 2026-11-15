import { CONFIG } from '../../config.js';
import { Utils } from '../../utils.js';

const CONTENT_LABELS = {
    block: 'Block',
    item: 'Item',
    mob: 'Mob',
    mob_variant: 'Mob Variant',
    advancement: 'Advancement',
    biome: 'Biome',
    painting: 'Painting',
    effect: 'Effect',
    enchantment: 'Enchantment',
    structure: 'Structure',
    food: 'Food',
    smithing_template: 'Smithing Template',
    weapon: 'Weapon',
    tool: 'Tool',
    armor: 'Armor',
    pottery_sherd: 'Pottery Sherd',
    banner_pattern: 'Banner Pattern',
    dye: 'Dye',
    seeds: 'Seeds',
    music_disc: 'Music Disc',
};

const SLOT_TYPES = new Set(['block', 'item', 'food', 'smithing_template', 'weapon', 'tool', 'armor', 'pottery_sherd', 'banner_pattern', 'dye', 'seeds', 'music_disc']);

export function createVersionCard(type, versionData) {
    const typeLabel = type === 'drop' ? 'Drop Update' : 'Major Update';
    const card = createCardContainer({
        href: versionData.wiki || '',
        className: `time-since-card-update time-since-card-${type}`,
        id: `time-since-${type}`,
    });

    card.append(
        createCardHeader([
            createCardTitle(typeLabel),
            versionData.name ? createCardName(versionData.name) : null,
            createCardMeta([versionData.version, formatDate(versionData.release_date)]),
        ]),
        createTimer(versionData.release_date),
    );
    return card;
}

export function createContentCard(type, data, { onOpen = null } = {}) {
    const element = data.element || {};
    const elementName = element.name || 'Unknown';

    // With onOpen the card opens the filtered list in-app; otherwise it links to the wiki.
    const card = onOpen
        ? createActionCard({
            onOpen,
            label: `Show all: ${CONTENT_LABELS[type] || type}`,
            className: `time-since-card-content time-since-card-${type}`,
            id: `time-since-${type}`,
        })
        : createCardContainer({
            href: element.wiki || '',
            className: `time-since-card-content time-since-card-${type}`,
            id: `time-since-${type}`,
        });

    const header = createCardHeader([
        createCardTitle(CONTENT_LABELS[type] || type),
        createCardName(elementName),
        createCardMeta([data.version_name, data.version, formatDate(data.release_date)]),
    ]);

    const summary = document.createElement('div');
    summary.className = 'time-since-card-summary';
    const icon = createCardIcon(type, element);
    if (icon) summary.appendChild(icon);
    summary.appendChild(header);

    card.append(summary, createTimer(data.release_date, { compact: true }));
    return card;
}

function createCardIcon(type, element) {
    const src = type === 'enchantment' ? CONFIG.ENCHANTMENT_ICON : Utils.resolveImagePath(element);
    if (!src) return null;
    const wrapper = document.createElement('div');
    // Blocks and items sit in the same inventory slot as in the update cards.
    wrapper.className = `time-since-card-icon${SLOT_TYPES.has(type) ? ' slot-cell' : ''}`;
    const image = document.createElement('img');
    image.alt = '';
    image.loading = 'lazy';
    image.addEventListener('error', () => wrapper.remove());
    image.src = src;
    wrapper.appendChild(image);
    return wrapper;
}

function createTimer(releaseDate, { compact = false } = {}) {
    const timer = document.createElement('div');
    timer.className = 'time-since-card-timer';
    timer.dataset.releaseDate = releaseDate || '';
    if (compact) timer.dataset.compact = '';
    return timer;
}

function createCardContainer({ href, className, id }) {
    const card = document.createElement(href ? 'a' : 'div');
    if (href) {
        card.href = href;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
    }
    card.className = `time-since-card ${className}`;
    card.id = id;
    return card;
}

function createActionCard({ onOpen, label, className, id }) {
    const card = document.createElement('div');
    card.className = `time-since-card time-since-card-action ${className}`;
    card.id = id;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.title = label;
    card.addEventListener('click', onOpen);
    card.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        onOpen();
    });
    return card;
}

function createCardHeader(children) {
    const header = document.createElement('div');
    header.className = 'time-since-card-header';
    children.filter(Boolean).forEach((child) => header.appendChild(child));
    return header;
}

function createCardTitle(value) {
    const title = document.createElement('h2');
    title.className = 'time-since-card-title';
    title.textContent = value;
    return title;
}

function createCardName(value) {
    const name = document.createElement('div');
    name.className = 'time-since-card-name';
    name.textContent = value;
    return name;
}

function createCardMeta(parts) {
    const meta = document.createElement('div');
    meta.className = 'time-since-card-meta';
    meta.textContent = parts.filter(Boolean).join(' · ');
    return meta;
}

export function formatDate(dateString) {
    if (!dateString) return 'Unknown';

    const date = Utils.parseDate(dateString);
    if (!date) return dateString;

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}
