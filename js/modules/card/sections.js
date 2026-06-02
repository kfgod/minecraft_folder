import { CONFIG } from '../../config.js';
import { SECTION_META } from '../../section-config.js';
import { CARD_CLASSES, CARD_DATA } from './constants.js';
import { createGridItemElement, createPlaceholderGridItem } from './grid-item-renderer.js';

export function createGridSectionElement(items, title, sectionType) {
    const meta = SECTION_META[sectionType];
    const section = createCardSection(sectionType, title);
    const grid = document.createElement('div');
    grid.className = meta?.gridClass ? `${CARD_CLASSES.GRID} ${meta.gridClass}` : CARD_CLASSES.GRID;

    items.forEach((item) => {
        grid.appendChild(createGridItemElement(item, sectionType));
    });

    if (meta?.usePlaceholders) {
        addPlaceholderElements(grid, items.length);
    }

    section.appendChild(grid);
    return section;
}

export function createNotableChangesSectionElement(notable) {
    if (!notable || (!notable.additions?.length && !notable.changes?.length)) return null;

    const section = createCardSection('notable-changes', 'Notable changes');
    const content = document.createElement('div');
    content.className = CARD_CLASSES.NOTABLE_CONTENT;

    if (notable.additions?.length) {
        content.appendChild(createNotableSubsection('Additions', notable.additions));
    }
    if (notable.changes?.length) {
        content.appendChild(createNotableSubsection('Changes', notable.changes));
    }

    section.appendChild(content);
    return section;
}

function addPlaceholderElements(grid, itemCount) {
    const remainder = itemCount % CONFIG.COLUMNS_COUNT;
    const placeholdersNeeded = remainder === 0 ? 0 : CONFIG.COLUMNS_COUNT - remainder;
    for (let i = 0; i < placeholdersNeeded; i++) {
        grid.appendChild(createPlaceholderGridItem());
    }
}

function createCardSection(sectionType, title) {
    const section = document.createElement('div');
    section.className = CARD_CLASSES.SECTION;
    section.dataset[CARD_DATA.SECTION] = sectionType;

    const sectionTitle = document.createElement('div');
    sectionTitle.className = CARD_CLASSES.SECTION_TITLE;
    sectionTitle.setAttribute('role', 'button');
    sectionTitle.tabIndex = 0;
    sectionTitle.setAttribute('aria-expanded', 'true');
    sectionTitle.textContent = title;

    section.appendChild(sectionTitle);
    return section;
}

function createNotableSubsection(title, entries) {
    const section = document.createElement('div');
    section.className = CARD_CLASSES.NOTABLE_SUBSECTION;

    const heading = document.createElement('div');
    heading.className = CARD_CLASSES.NOTABLE_SUBSECTION_TITLE;
    heading.textContent = title;

    const list = document.createElement('ul');
    list.className = CARD_CLASSES.NOTABLE_LIST;
    entries.forEach((entry) => {
        list.appendChild(createNotableEntry(entry));
    });

    section.append(heading, list);
    return section;
}

function createNotableEntry(entry) {
    const item = document.createElement('li');
    item.className = CARD_CLASSES.NOTABLE_ENTRY;

    if (entry.imagePath) {
        const image = document.createElement('img');
        image.className = CARD_CLASSES.NOTABLE_ENTRY_IMAGE;
        image.src = `${CONFIG.IMAGE_BASE_PATH}${entry.imagePath}`;
        image.alt = '';
        image.loading = 'lazy';
        item.appendChild(image);
    }

    const body = document.createElement('div');
    body.className = CARD_CLASSES.NOTABLE_ENTRY_BODY;

    const description = document.createElement('span');
    description.className = CARD_CLASSES.NOTABLE_ENTRY_DESC;
    description.textContent = entry.description || '';
    body.appendChild(description);

    if (Array.isArray(entry.list) && entry.list.length) {
        const sublist = document.createElement('ul');
        sublist.className = CARD_CLASSES.NOTABLE_ENTRY_SUBLIST;
        entry.list.forEach((text) => {
            const subitem = document.createElement('li');
            subitem.textContent = text;
            sublist.appendChild(subitem);
        });
        body.appendChild(sublist);
    }

    item.appendChild(body);
    return item;
}
