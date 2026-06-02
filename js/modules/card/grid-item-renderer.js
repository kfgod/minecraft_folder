import { CONFIG } from '../../config.js';
import { Utils } from '../../utils.js';
import { CARD_CLASSES, CARD_DATA } from './constants.js';

export function createGridItemElement(item, sectionType) {
    if (sectionType === 'mobs' || sectionType === 'mob_variants') {
        return createMobItem(item, sectionType);
    }
    if (sectionType === 'enchantments') {
        return createEnchantmentItem(item);
    }
    if (sectionType === 'advancements') {
        return createAdvancementItem(item);
    }
    if (sectionType === 'paintings') {
        return createImageCell(item, 'painting-cell', 'painting-cell-image');
    }
    if (sectionType === 'biomes') {
        return createImageCell(item, 'biome-cell', 'biome-cell-image');
    }
    return createDefaultItem(item);
}

export function createPlaceholderGridItem() {
    const placeholder = document.createElement('div');
    placeholder.className = CARD_CLASSES.GRID_ITEM;
    return placeholder;
}

function createMobItem(item, sectionType) {
    const root = createGridItem(item, `mob-cell ${CARD_CLASSES.CLICKABLE_CARD}`);
    root.dataset[CARD_DATA.TOOLTIP] = getMobTooltip(item) || item.name || '';
    if (item.wiki) {
        root.dataset[CARD_DATA.WIKI] = item.wiki;
    }

    const card = document.createElement('div');
    card.className = 'mob-card';

    const parentMob = createParentMob(item.meta?.parent_mob);
    if (parentMob) {
        const parent = document.createElement('div');
        parent.className = 'mob-card-parent';
        parent.appendChild(parentMob);
        card.appendChild(parent);
    }

    const imageContainer = document.createElement('div');
    imageContainer.className = 'mob-card-image';
    imageContainer.appendChild(createImage({
        className: 'mob-render',
        src: Utils.resolveImagePath(item),
    }));

    const eggContainer = document.createElement('div');
    eggContainer.className = 'mob-card-egg';
    const egg = sectionType !== 'mob_variants' ? createSpawnEgg(item.meta?.spawn_egg) : null;
    if (egg) {
        eggContainer.appendChild(egg);
    }

    card.append(imageContainer, eggContainer);
    root.appendChild(card);
    return root;
}

function getMobTooltip(item) {
    const name = item.name;
    const healthValue = item.meta?.health ?? item.meta?.parent_mob?.health ?? null;
    if (healthValue === null) return name;
    return `${name}|health:${healthValue / 2}`;
}

function createSpawnEgg(spawnEgg) {
    if (!spawnEgg) return null;

    const wrapper = createTooltipWrapper(spawnEgg.name);
    const link = createExternalLink(spawnEgg.wiki);
    link.className = 'mob-egg-link';

    const image = createImage({
        className: 'inv-img mob-egg',
        src: Utils.resolveImagePath(spawnEgg),
    });
    image.addEventListener('error', () => wrapper.remove());

    link.appendChild(image);
    wrapper.appendChild(link);
    return wrapper;
}

function createParentMob(parentMob) {
    if (!parentMob) return null;

    const wrapper = createTooltipWrapper(parentMob.name);
    const image = createImage({
        className: 'mob-parent-icon',
        src: Utils.resolveImagePath(parentMob),
    });

    if (parentMob.wiki) {
        const link = createExternalLink(parentMob.wiki);
        link.appendChild(image);
        wrapper.appendChild(link);
    } else {
        wrapper.appendChild(image);
    }

    return wrapper;
}

function createEnchantmentItem(item) {
    const root = createGridItem(item, 'ench-cell');
    const inner = document.createElement('div');
    inner.className = 'ench-cell-inner';

    inner.append(
        createImage({
            className: 'inv-img ench-icon',
            src: CONFIG.ENCHANTMENT_ICON,
        }),
        createTextElement('span', 'ench-name', item.name || ''),
    );

    root.appendChild(wrapWithOptionalLink(inner, item.wiki));
    return root;
}

function createAdvancementItem(item) {
    const root = createGridItem(item, 'advancement-cell');
    const inner = document.createElement('div');
    inner.className = 'advancement-cell-content';

    const iconPath = Utils.resolveImagePath(item.meta?.icon);
    const icon = iconPath
        ? createImage({ className: 'advancement-icon', src: iconPath, alt: '' })
        : createTextElement('span', 'advancement-icon advancement-icon-placeholder', '');

    inner.append(icon, createTextElement('span', 'advancement-name', item.name || ''));
    root.appendChild(wrapWithOptionalLink(inner, item.wiki));
    return root;
}

function createImageCell(item, cellClass, imageClass) {
    const root = createGridItem(item, cellClass);
    const inner = document.createElement('div');
    inner.className = imageClass;
    inner.appendChild(createImage({
        className: 'inv-img',
        src: Utils.resolveImagePath(item),
    }));

    root.appendChild(wrapWithOptionalLink(inner, item.wiki));
    return root;
}

function createDefaultItem(item) {
    const root = createGridItem(item);
    const image = createImage({
        className: 'inv-img',
        src: Utils.resolveImagePath(item),
    });

    root.appendChild(wrapWithOptionalLink(image, item.wiki));
    return root;
}

function createGridItem(item, extraClass = '') {
    const root = document.createElement('div');
    root.className = `${CARD_CLASSES.GRID_ITEM}${extraClass ? ` ${extraClass}` : ''}`;
    root.dataset[CARD_DATA.TOOLTIP] = item.name || '';
    root.dataset[CARD_DATA.IDENTIFIER] = item.identifier || '';
    return root;
}

function createImage({ className, src, alt, loading = 'lazy' }) {
    const image = document.createElement('img');
    image.className = className;
    image.src = src;
    image.loading = loading;
    if (alt !== undefined) {
        image.alt = alt;
    }
    return image;
}

function createTooltipWrapper(tooltip) {
    const wrapper = document.createElement('span');
    wrapper.className = CARD_CLASSES.TOOLTIP_WRAPPER;
    wrapper.dataset[CARD_DATA.TOOLTIP] = tooltip || '';
    return wrapper;
}

function createExternalLink(href) {
    const link = document.createElement('a');
    link.href = href || '';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
}

function wrapWithOptionalLink(content, wiki) {
    if (!wiki) return content;
    const link = createExternalLink(wiki);
    link.appendChild(content);
    return link;
}

function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    return element;
}
