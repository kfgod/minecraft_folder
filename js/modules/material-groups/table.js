import { Utils } from '../../utils.js';
import { MATERIAL_GROUPS_CLASSES, MATERIAL_GROUPS_DATA } from './constants.js';

const GENERATED_FAMILIES_KIND = 'families';
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

    const tableContainer = document.createElement('div');
    tableContainer.className = [
        MATERIAL_GROUPS_CLASSES.TABLE_CONTAINER,
        isCollapsed ? MATERIAL_GROUPS_CLASSES.COLLAPSED : '',
    ].filter(Boolean).join(' ');

    const wrapper = document.createElement('div');
    wrapper.className = MATERIAL_GROUPS_CLASSES.TABLE_WRAPPER;

    const table = document.createElement('table');
    table.className = MATERIAL_GROUPS_CLASSES.TABLE;
    if (isGeneratedFamiliesGroup(item)) {
        table.appendChild(createGeneratedFamiliesHeader(itemKeysOrder));
    }

    const tbody = document.createElement('tbody');
    groups.forEach((group) => {
        tbody.appendChild(createGroupRow(group, itemKeysOrder, { includeMaterialCell: !isGeneratedFamiliesGroup(item) }));
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

function createGeneratedFamiliesHeader(itemKeysOrder) {
    const header = document.createElement('thead');
    const familyTypeRow = document.createElement('tr');
    const formRow = document.createElement('tr');

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

    itemKeysOrder.forEach((itemKey) => {
        const cell = document.createElement('th');
        const { form } = parseGeneratedItemKey(itemKey);
        cell.className = [
            MATERIAL_GROUPS_CLASSES.HEADER_CELL,
            MATERIAL_GROUPS_CLASSES.HEADER_CELL_FORM,
        ].join(' ');
        cell.textContent = formatGeneratedLabel(form);
        formRow.appendChild(cell);
    });

    header.append(familyTypeRow, formRow);
    return header;
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

function createGroupRow(group, allItemKeys, { includeMaterialCell = true } = {}) {
    const row = document.createElement('tr');
    if (includeMaterialCell) {
        row.appendChild(createTableCell(group.material || {}, true));
    }

    const items = group.items || {};
    allItemKeys.forEach((itemKey) => {
        row.appendChild(createTableCell(items[itemKey], false));
    });

    return row;
}

function createTableCell(element, isMaterial) {
    const cell = document.createElement('td');
    cell.className = [
        MATERIAL_GROUPS_CLASSES.CELL,
        isMaterial ? MATERIAL_GROUPS_CLASSES.MATERIAL_CELL : '',
    ].filter(Boolean).join(' ');
    cell.appendChild(createElementCell(element));
    return cell;
}

function createElementCell(element) {
    if (!element || typeof element !== 'object') {
        return createEmptyCell();
    }

    const imagePath = Utils.resolveImagePath(element);
    const image = document.createElement('img');
    image.src = imagePath;
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
    wrapper.className = MATERIAL_GROUPS_CLASSES.ELEMENT;
    wrapper.appendChild(imageWrapper);
    return wrapper;
}

function createEmptyCell() {
    const empty = document.createElement('span');
    empty.className = MATERIAL_GROUPS_CLASSES.EMPTY;
    empty.textContent = '—';
    return empty;
}
