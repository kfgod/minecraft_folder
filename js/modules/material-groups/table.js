import { Utils } from '../../utils.js';
import { MATERIAL_GROUPS_CLASSES, MATERIAL_GROUPS_DATA } from './constants.js';

export function createMaterialGroupSection(item, index, isSectionCollapsed) {
    const groups = item.groups || [];
    if (groups.length === 0) return null;

    const itemKeysOrder = getItemKeysOrder(groups);
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

    const tbody = document.createElement('tbody');
    groups.forEach((group) => {
        tbody.appendChild(createGroupRow(group, itemKeysOrder));
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);
    tableContainer.appendChild(wrapper);
    section.append(title, tableContainer);
    return section;
}

function getItemKeysOrder(groups) {
    const itemKeysOrder = [];
    const seenKeys = new Set();

    groups.forEach((group) => {
        Object.keys(group.items || {}).forEach((key) => {
            if (!seenKeys.has(key)) {
                itemKeysOrder.push(key);
                seenKeys.add(key);
            }
        });
    });

    return itemKeysOrder;
}

function createGroupRow(group, allItemKeys) {
    const row = document.createElement('tr');
    row.appendChild(createTableCell(group.material || {}, true));

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
