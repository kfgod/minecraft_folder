import { CONFIG } from '../../config.js';
import { Utils } from '../../utils.js';
import { hasItemInfo, previousVersion, stripNamespace } from './data.js';

const TYPE_LABELS = {
    crafting_shaped: 'Shaped crafting',
    crafting_shapeless: 'Shapeless crafting',
    crafting_transmute: 'Crafting',
    crafting_dye: 'Dyeing',
    crafting_imbue: 'Crafting',
    crafting_decorated_pot: 'Decorated pot',
    smelting: 'Smelting',
    blasting: 'Blasting',
    smoking: 'Smoking',
    campfire_cooking: 'Campfire cooking',
    stonecutting: 'Stonecutting',
    smithing_transform: 'Smithing',
    smithing_trim: 'Smithing trim',
    brewing: 'Brewing',
};
const COOKING_TYPES = new Set(['smelting', 'blasting', 'smoking', 'campfire_cooking']);
// Slot order for the "a + b + c → result" layouts.
const INPUT_ORDER = ['template', 'base', 'addition', 'input', 'target', 'source', 'banner', 'map', 'ingredient', 'reagent', 'material', 'dye'];
const USED_IN_OPEN_LIMIT = 12;

function el(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function typeLabel(type) {
    if (TYPE_LABELS[type]) return TYPE_LABELS[type];
    if (type.startsWith('crafting_special_')) return 'Special crafting';
    return type.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

function refName(refs, id) {
    if (id.startsWith('#')) return id.replace('#minecraft:', '#');
    return refs[id]?.name || stripNamespace(id);
}

/** Every item a slot can show, tags expanded; cycled like the in-game recipe book. */
function expandOptions(options, refs) {
    return options.flatMap((option) => {
        if (!option.startsWith('#')) return [{ id: option }];
        const members = refs[option]?.items || [];
        return members.length ? members.map((id) => ({ id, tag: option })) : [{ id: option, tag: option }];
    });
}

function applySlotOption(slot, option, refs) {
    const image = slot.querySelector('img');
    const ref = refs[option.id] || {};
    const imagePath = ref.imagePath ? CONFIG.IMAGE_BASE_PATH + ref.imagePath : null;
    if (image.dataset.src !== (imagePath || '')) {
        image.dataset.src = imagePath || '';
        Utils.setImageWithFallback(image, imagePath);
    }
    const name = refName(refs, option.id);
    // Same tooltip as list cells (the content tooltip controller reads data-tooltip).
    slot.dataset.tooltip = option.tag && !option.id.startsWith('#') ? `${name} (${refName(refs, option.tag)})` : name;
    image.alt = name;
    if (slot.tagName === 'BUTTON') {
        slot.dataset.itemTarget = option.id.startsWith('#') ? '' : option.id;
        slot.disabled = !hasItemInfo(option.id);
    }
}

export function createSlot(options, refs, { count = 1, result = false } = {}) {
    const expanded = expandOptions(options || [], refs);
    const interactive = expanded.some((option) => hasItemInfo(option.id));
    // grid-item + slot-cell: the inventory slot of the update cards, not a separate drawing.
    const slot = el(interactive ? 'button' : 'div', `grid-item slot-cell recipe-slot${result ? ' recipe-slot-result' : ''}`);
    if (interactive) slot.type = 'button';
    if (!expanded.length) {
        slot.classList.add('recipe-slot-empty');
        return slot;
    }
    const image = el('img', 'inv-img');
    image.loading = 'lazy';
    slot.appendChild(image);
    if (count > 1) slot.appendChild(el('span', 'recipe-slot-count', String(count)));
    if (expanded.some((option) => option.tag)) slot.classList.add('recipe-slot-tag');
    applySlotOption(slot, expanded[0], refs);
    if (expanded.length > 1) {
        slot._cycle = { options: expanded, index: 0, refs };
        slot.dataset.cycle = '';
    }
    return slot;
}

/** Advances every cycling slot inside root; called on an interval while the item page is shown. */
export function advanceSlots(root) {
    root.querySelectorAll('.recipe-slot[data-cycle]').forEach((slot) => {
        const cycle = slot._cycle;
        if (!cycle) return;
        cycle.index = (cycle.index + 1) % cycle.options.length;
        applySlotOption(slot, cycle.options[cycle.index], cycle.refs);
    });
}

function createGrid(cells, refs, columns = 3) {
    const grid = el('div', 'recipe-grid');
    grid.style.setProperty('--recipe-columns', String(columns));
    cells.forEach((options) => grid.appendChild(createSlot(options, refs)));
    return grid;
}

function shapedCells(rows) {
    const cells = [];
    for (let y = 0; y < 3; y += 1) {
        for (let x = 0; x < 3; x += 1) cells.push(rows[y]?.[x] || null);
    }
    return cells;
}

function orderedInputs(inputs = {}) {
    const names = Object.keys(inputs);
    return [
        ...INPUT_ORDER.filter((name) => names.includes(name)),
        ...names.filter((name) => !INPUT_ORDER.includes(name)),
    ].map((name) => inputs[name]);
}

function createArrow() {
    const arrow = el('span', 'recipe-arrow', '→');
    arrow.setAttribute('aria-hidden', 'true');
    return arrow;
}

function cookingNote(extra = {}) {
    const parts = [];
    if (extra.cookingtime) parts.push(`${extra.cookingtime / 20} s`);
    if (extra.experience) parts.push(`${extra.experience} XP`);
    return parts.join(' · ');
}

function resultFor(recipe) {
    if (recipe.result) return recipe.result;
    // Smithing trim keeps the base item.
    if (recipe.type === 'smithing_trim' && recipe.inputs?.base) return { id: recipe.inputs.base[0], count: 1, options: recipe.inputs.base };
    return null;
}

export function createRecipeLayout(recipe, refs) {
    const layout = el('div', 'recipe-layout');
    const { type } = recipe;
    if (recipe.grid) {
        layout.appendChild(createGrid(shapedCells(recipe.grid), refs));
    } else if (recipe.ingredients) {
        const cells = recipe.ingredients.slice(0, 9);
        while (cells.length < 9) cells.push(null);
        layout.appendChild(createGrid(cells, refs));
    } else {
        const inputs = el('div', 'recipe-inputs');
        orderedInputs(recipe.inputs).forEach((options) => inputs.appendChild(createSlot(options, refs)));
        if (COOKING_TYPES.has(type)) inputs.classList.add('recipe-inputs-furnace');
        layout.appendChild(inputs);
    }
    const result = resultFor(recipe);
    layout.appendChild(createArrow());
    layout.appendChild(result
        ? createSlot(result.options || [result.id], refs, { count: result.count, result: true })
        : createSlot([], refs, { result: true }));
    const note = COOKING_TYPES.has(type) ? cookingNote(recipe.extra) : '';
    if (note) layout.appendChild(el('span', 'recipe-note', note));
    return layout;
}

function createBadge(text, kind, title) {
    const badge = el('span', `item-info-badge item-info-badge-${kind}`, text);
    if (title) badge.title = title;
    return badge;
}

function versionTitle(version) {
    const previous = previousVersion(version);
    return previous ? `Between ${previous} and ${version}` : '';
}

export function createVersionBadges(entry) {
    const badges = [];
    if (entry.removed) badges.push(createBadge(`Removed in ${entry.removed}`, 'removed', versionTitle(entry.removed)));
    return badges;
}

function createRecipeCard(entry, refs) {
    const card = el('article', `recipe-card${entry.removed ? ' recipe-card-removed' : ''}`);
    const header = el('header', 'recipe-card-header');
    header.appendChild(el('span', 'recipe-type', typeLabel(entry.type)));
    header.append(...createVersionBadges(entry));
    const id = el('code', 'recipe-id', stripNamespace(entry.id));
    header.appendChild(id);
    card.append(header, createRecipeLayout(entry, refs));
    return card;
}

function createSection(title, count) {
    const section = el('section', 'item-info-section');
    const heading = el('h3', '', title);
    if (count !== undefined) heading.appendChild(el('span', 'item-info-count', String(count)));
    section.appendChild(heading);
    return section;
}

function createRecipeList(entries, refs) {
    const list = el('div', 'recipe-list');
    entries.forEach((entry) => list.appendChild(createRecipeCard(entry, refs)));
    return list;
}

function createTagChip(tag) {
    const chip = el('li', `item-tag${tag.via ? ' item-tag-inherited' : ''}${tag.removed ? ' item-tag-removed' : ''}`);
    chip.appendChild(el('span', '', `#${stripNamespace(tag.id)}`));
    const title = [tag.id];
    if (tag.via) title.push(`via #${stripNamespace(tag.via)}`);
    if (tag.removed) title.push(`removed in ${tag.removed}`);
    chip.title = title.join('\n');
    return chip;
}

function createTagsSection(tags) {
    const section = createSection('Tags', tags.filter((tag) => !tag.removed).length);
    [['block', 'Block tags'], ['item', 'Item tags']].forEach(([registry, label]) => {
        const group = tags.filter((tag) => tag.registry === registry)
            .sort((a, b) => Boolean(a.removed) - Boolean(b.removed) || Boolean(a.via) - Boolean(b.via) || a.id.localeCompare(b.id));
        if (!group.length) return;
        section.appendChild(el('h4', '', label));
        const list = el('ul', 'item-tag-list');
        group.forEach((tag) => list.appendChild(createTagChip(tag)));
        section.appendChild(list);
    });
    if (tags.some((tag) => tag.via)) {
        section.appendChild(el('p', 'item-info-hint', 'Dashed tags include this entry through another tag.'));
    }
    return section;
}

function createItemHeader(info, { canGoBack }) {
    const header = el('header', 'item-page-header');
    const back = el('button', 'item-page-back', canGoBack ? '← Back' : '← All updates');
    back.type = 'button';
    back.dataset.itemBack = '';
    header.appendChild(back);

    const title = el('div', 'item-page-title');
    const slot = el('div', 'grid-item slot-cell item-page-icon');
    const image = el('img', 'inv-img');
    Utils.setImageWithFallback(image, info.imagePath ? CONFIG.IMAGE_BASE_PATH + info.imagePath : null);
    image.alt = '';
    slot.appendChild(image);
    const names = el('div', 'item-page-names');
    names.appendChild(el('h1', 'item-page-name', info.name || stripNamespace(info.id)));
    names.appendChild(el('code', 'item-page-id', info.id));
    title.append(slot, names);
    if (info.wiki) {
        const link = el('a', 'item-page-wiki', 'Wiki ↗');
        link.href = info.wiki;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        title.appendChild(link);
    }
    header.appendChild(title);
    return header;
}

export function renderItemPage(container, info, index, { canGoBack = false } = {}) {
    const refs = info.refs || {};
    const page = el('article', 'item-page');
    page.appendChild(createItemHeader(info, { canGoBack }));

    const active = (entries) => entries.filter((entry) => !entry.removed);
    const main = el('div', 'item-page-main');
    const recipes = createSection('Recipes', active(info.recipes).length);
    recipes.appendChild(info.recipes.length
        ? createRecipeList(info.recipes, refs)
        : el('p', 'item-info-empty', 'No recipe produces this item.'));
    main.appendChild(recipes);

    if (info.used_in.length) {
        const usedIn = createSection('Used in', active(info.used_in).length);
        const details = el('details', 'item-info-used-in');
        details.open = info.used_in.length <= USED_IN_OPEN_LIMIT;
        details.appendChild(el('summary', '', details.open ? 'Recipes' : `Show ${info.used_in.length} recipes`));
        details.appendChild(createRecipeList(info.used_in, refs));
        usedIn.appendChild(details);
        main.appendChild(usedIn);
    }

    const side = el('div', 'item-page-side');
    if (info.tags.length) side.appendChild(createTagsSection(info.tags));
    if (index?.versions?.length) {
        const versions = index.versions.map((entry) => entry.id);
        side.appendChild(el('p', 'item-info-source', `Java Edition data: ${versions[0]} – ${versions[versions.length - 1]} (${versions.length} versions).`));
    }

    const body = el('div', 'item-page-body');
    body.append(main, side);
    page.appendChild(body);
    container.replaceChildren(page);
}

export function renderItemPageLoading(container, identifier, message = 'Loading…') {
    const page = el('article', 'item-page');
    page.appendChild(createItemHeader({ id: `minecraft:${stripNamespace(identifier)}` }, { canGoBack: false }));
    page.appendChild(el('p', 'item-info-empty', message));
    container.replaceChildren(page);
}
