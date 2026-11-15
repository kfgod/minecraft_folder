import { Utils } from '../../utils.js';
import { CARD_CLASSES, CARD_DATA } from '../card/constants.js';
import { MATERIAL_GROUPS_CLASSES, MATERIAL_GROUPS_DATA } from './constants.js';

const GENERATED_FAMILIES_KIND = 'families';
const GENERATED_COLORS_KIND = 'colors';
const GENERATED_FORM_SUFFIXES = [
    'pressure_plate',
    'base',
    'stairs',
    'slab',
    'wall',
    'button',
    'cracked',
    'chiseled',
];
const COLOR_SWATCHES = Object.freeze({
    white: '#f9fffe',
    light_gray: '#9d9d97',
    gray: '#474f52',
    black: '#1d1d21',
    brown: '#835432',
    red: '#b02e26',
    orange: '#f9801d',
    yellow: '#fed83d',
    lime: '#80c71f',
    green: '#5e7c16',
    cyan: '#169c9c',
    light_blue: '#3ab3da',
    blue: '#3c44aa',
    purple: '#8932b8',
    magenta: '#c74ebd',
    pink: '#f38baa',
});

export function createMaterialGroupSection(item, index, isSectionCollapsed) {
    const groups = item.groups || [];
    if (groups.length === 0) return null;

    const itemKeysOrder = getItemKeysOrder(groups, { columnsOrder: item.columns_order });
    if (itemKeysOrder.length === 0) return null;

    const sectionId = `material-group-${index}`;
    const sectionName = item.name || `Group ${index + 1}`;
    const isCollapsed = isSectionCollapsed(sectionId);

    const section = document.createElement('div');
    section.className = MATERIAL_GROUPS_CLASSES.SECTION;
    section.dataset[MATERIAL_GROUPS_DATA.SECTION_ID] = sectionId;

    const title = document.createElement('h2');
    title.className = [
        MATERIAL_GROUPS_CLASSES.SECTION_TITLE,
        isCollapsed ? MATERIAL_GROUPS_CLASSES.COLLAPSED : '',
    ].filter(Boolean).join(' ');
    title.dataset[MATERIAL_GROUPS_DATA.SECTION_ID] = sectionId;
    title.textContent = sectionName;
    title.appendChild(createSectionCount(groups, itemKeysOrder));

    const tableContainer = document.createElement('div');
    tableContainer.className = [
        MATERIAL_GROUPS_CLASSES.TABLE_CONTAINER,
        isCollapsed ? MATERIAL_GROUPS_CLASSES.COLLAPSED : '',
    ].filter(Boolean).join(' ');

    const wrapper = document.createElement('div');
    wrapper.className = MATERIAL_GROUPS_CLASSES.TABLE_WRAPPER;

    const table = document.createElement('table');
    table.className = MATERIAL_GROUPS_CLASSES.TABLE;
    table.appendChild(isGeneratedFamiliesGroup(item)
        ? createGeneratedFamiliesHeader(itemKeysOrder)
        : createFormHeader(itemKeysOrder, getCornerLabel(item)));

    const tbody = document.createElement('tbody');
    groups.forEach((group) => {
        tbody.appendChild(createGroupRow(group, itemKeysOrder, { useColorSwatch: isGeneratedColorsGroup(item) }));
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);
    tableContainer.appendChild(wrapper);
    section.append(title, tableContainer);
    return section;
}

function isGeneratedFamiliesGroup(item) {
    return item?.generated === GENERATED_FAMILIES_KIND;
}

function isGeneratedColorsGroup(item) {
    return item?.generated === GENERATED_COLORS_KIND;
}

function getCornerLabel(item) {
    return isGeneratedColorsGroup(item) ? 'Color' : 'Material';
}

function createSectionCount(groups, itemKeysOrder) {
    const count = document.createElement('span');
    count.className = MATERIAL_GROUPS_CLASSES.SECTION_COUNT;
    const filled = groups.reduce((sum, group) => sum + Object.values(group.items || {}).filter(Boolean).length, 0);
    count.textContent = `${filled} of ${groups.length * itemKeysOrder.length} filled`;
    return count;
}

function createCornerCell(label, rowSpan = 1) {
    const cell = document.createElement('th');
    cell.className = [
        MATERIAL_GROUPS_CLASSES.HEADER_CELL,
        MATERIAL_GROUPS_CLASSES.HEADER_CELL_CORNER,
    ].join(' ');
    cell.rowSpan = rowSpan;
    cell.scope = 'col';
    cell.textContent = label;
    return cell;
}

function createGeneratedFamiliesHeader(itemKeysOrder) {
    const header = document.createElement('thead');
    const familyTypeRow = document.createElement('tr');
    const formRow = document.createElement('tr');

    familyTypeRow.appendChild(createCornerCell('Material', 2));
    getFamilyTypeSpans(itemKeysOrder).forEach((span) => {
        const cell = document.createElement('th');
        cell.className = [
            MATERIAL_GROUPS_CLASSES.HEADER_CELL,
            MATERIAL_GROUPS_CLASSES.HEADER_CELL_GROUP,
        ].join(' ');
        cell.colSpan = span.count;
        cell.textContent = formatGeneratedLabel(span.familyType);
        familyTypeRow.appendChild(cell);
    });

    getFormSpans(itemKeysOrder).forEach((span) => {
        const cell = document.createElement('th');
        cell.className = [
            MATERIAL_GROUPS_CLASSES.HEADER_CELL,
            MATERIAL_GROUPS_CLASSES.HEADER_CELL_FORM,
        ].join(' ');
        cell.colSpan = span.count;
        cell.textContent = formatGeneratedLabel(span.form);
        formRow.appendChild(cell);
    });

    header.append(familyTypeRow, formRow);
    return header;
}

function createFormHeader(itemKeysOrder, cornerLabel) {
    const header = document.createElement('thead');
    const formRow = document.createElement('tr');

    formRow.appendChild(createCornerCell(cornerLabel));
    getRepeatedFormSpans(itemKeysOrder).forEach((span) => {
        const cell = document.createElement('th');
        cell.className = [
            MATERIAL_GROUPS_CLASSES.HEADER_CELL,
            MATERIAL_GROUPS_CLASSES.HEADER_CELL_FORM,
        ].join(' ');
        cell.colSpan = span.count;
        cell.textContent = formatGeneratedLabel(span.form);
        formRow.appendChild(cell);
    });

    header.appendChild(formRow);
    return header;
}

function getFormSpans(itemKeysOrder) {
    const spans = [];
    itemKeysOrder.forEach((itemKey) => {
        const { familyType, form } = parseGeneratedItemKey(itemKey);
        const lastSpan = spans.at(-1);
        if (lastSpan?.familyType === familyType && lastSpan.form === form) {
            lastSpan.count += 1;
            return;
        }
        spans.push({ familyType, form, count: 1 });
    });
    return spans;
}

function getRepeatedFormSpans(itemKeysOrder) {
    const spans = [];
    itemKeysOrder.forEach((itemKey) => {
        const form = stripDuplicateIndex(itemKey);
        const lastSpan = spans.at(-1);
        if (lastSpan?.form === form) {
            lastSpan.count += 1;
            return;
        }
        spans.push({ form, count: 1 });
    });
    return spans;
}

function getFamilyTypeSpans(itemKeysOrder) {
    const spans = [];
    itemKeysOrder.forEach((itemKey) => {
        const { familyType } = parseGeneratedItemKey(itemKey);
        const lastSpan = spans.at(-1);
        if (lastSpan?.familyType === familyType) {
            lastSpan.count += 1;
            return;
        }
        spans.push({ familyType, count: 1 });
    });
    return spans;
}

function stripDuplicateIndex(itemKey) {
    return String(itemKey || '').replace(/_([2-9]\d*)$/, '');
}

function parseGeneratedItemKey(itemKey) {
    const normalizedKey = String(itemKey || '');
    const duplicateMatch = normalizedKey.match(/^(.*)_([2-9]\d*)$/);
    const keyWithoutDuplicateIndex = duplicateMatch ? duplicateMatch[1] : normalizedKey;
    const duplicateIndex = duplicateMatch ? Number(duplicateMatch[2]) : 1;
    const suffix = GENERATED_FORM_SUFFIXES.find((form) => keyWithoutDuplicateIndex.endsWith(`_${form}`));
    if (suffix) {
        return {
            familyType: keyWithoutDuplicateIndex.slice(0, -(suffix.length + 1)) || 'initial',
            form: suffix,
            duplicateIndex,
        };
    }

    const lastSeparatorIndex = keyWithoutDuplicateIndex.lastIndexOf('_');
    if (lastSeparatorIndex === -1) {
        return { familyType: 'initial', form: keyWithoutDuplicateIndex, duplicateIndex };
    }
    return {
        familyType: keyWithoutDuplicateIndex.slice(0, lastSeparatorIndex) || 'initial',
        form: keyWithoutDuplicateIndex.slice(lastSeparatorIndex + 1),
        duplicateIndex,
    };
}

function formatGeneratedLabel(value) {
    return String(value || '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getItemKeysOrder(groups, { columnsOrder = null } = {}) {
    const itemKeysOrder = [];
    const seenKeys = new Set();
    const existingKeys = new Set();

    groups.forEach((group) => {
        Object.keys(group.items || {}).forEach((key) => {
            existingKeys.add(key);
            if (!seenKeys.has(key)) {
                itemKeysOrder.push(key);
                seenKeys.add(key);
            }
        });
    });

    if (!Array.isArray(columnsOrder) || columnsOrder.length === 0) return itemKeysOrder;

    const orderedKeys = columnsOrder.filter((key) => existingKeys.has(key));
    itemKeysOrder.forEach((key) => {
        if (!orderedKeys.includes(key)) orderedKeys.push(key);
    });
    return orderedKeys;
}

function createGroupRow(group, allItemKeys, { useColorSwatch = false } = {}) {
    const row = document.createElement('tr');
    const items = group.items || {};
    row.appendChild(createRowLabel(group, allItemKeys, useColorSwatch));
    allItemKeys.forEach((itemKey) => {
        row.appendChild(createTableCell(items[itemKey]));
    });
    return row;
}

/** Sticky first column: which material this row is. */
function createRowLabel(group, allItemKeys, useColorSwatch) {
    const cell = document.createElement('th');
    cell.className = MATERIAL_GROUPS_CLASSES.ROW_LABEL;
    cell.scope = 'row';
    const content = document.createElement('div');
    content.className = MATERIAL_GROUPS_CLASSES.ROW_LABEL_CONTENT;
    cell.appendChild(content);

    if (useColorSwatch) {
        const swatch = document.createElement('span');
        swatch.className = MATERIAL_GROUPS_CLASSES.ROW_LABEL_SWATCH;
        swatch.style.setProperty('--material-group-color', COLOR_SWATCHES[group.group] || '#888');
        content.appendChild(swatch);
    } else {
        const iconSource = group.material || allItemKeys.map((key) => group.items?.[key]).find(Boolean);
        const imagePath = Utils.resolveImagePath(iconSource);
        if (imagePath) {
            const icon = document.createElement('img');
            icon.className = MATERIAL_GROUPS_CLASSES.ROW_LABEL_ICON;
            Utils.setImageWithFallback(icon, imagePath);
            icon.alt = '';
            icon.loading = 'lazy';
            content.appendChild(icon);
        }
    }

    const name = document.createElement('span');
    name.textContent = group.group_name || formatGeneratedLabel(group.group);
    content.appendChild(name);
    return cell;
}

function createTableCell(element) {
    const cell = document.createElement('td');
    cell.className = MATERIAL_GROUPS_CLASSES.CELL;
    cell.appendChild(createElementCell(element));
    return cell;
}

function createElementCell(element) {
    if (!element || typeof element !== 'object') {
        return createEmptyCell();
    }

    const imagePath = Utils.resolveImagePath(element);
    const image = document.createElement('img');
    Utils.setImageWithFallback(image, imagePath);
    image.alt = element.name || '';
    image.loading = 'lazy';

    const imageWrapper = document.createElement('div');
    imageWrapper.className = MATERIAL_GROUPS_CLASSES.ELEMENT_IMAGE;

    if (element.wiki) {
        const link = document.createElement('a');
        link.href = element.wiki;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.appendChild(image);
        imageWrapper.appendChild(link);
    } else {
        imageWrapper.appendChild(image);
    }

    const wrapper = document.createElement('div');
    wrapper.className = `${MATERIAL_GROUPS_CLASSES.ELEMENT} ${CARD_CLASSES.TOOLTIP_WRAPPER}`;
    wrapper.dataset[CARD_DATA.TOOLTIP] = element.name || '';
    // Same click contract as list cells: item page when enabled, otherwise the Wiki link.
    if (element.identifier) wrapper.dataset[CARD_DATA.ITEM_INFO] = element.identifier;
    wrapper.appendChild(imageWrapper);
    return wrapper;
}

function createEmptyCell() {
    const empty = document.createElement('span');
    empty.className = MATERIAL_GROUPS_CLASSES.EMPTY;
    empty.textContent = '—';
    return empty;
}
