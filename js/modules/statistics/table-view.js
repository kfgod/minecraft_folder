import { STATISTICS_CLASSES, STATISTICS_DOM } from './constants.js';
import { createCardHeader, createStatisticsCard } from './chart-view.js';

export function createStatisticsNameTablesGrid() {
    const grid = document.createElement('div');
    grid.className = STATISTICS_CLASSES.NAMES_GRID;
    grid.append(
        createNameTableElement(STATISTICS_DOM.LONGEST_TABLE_ID, 'Top 5 Longest Names'),
        createNameTableElement(STATISTICS_DOM.SHORTEST_TABLE_ID, 'Top 5 Shortest Names'),
    );
    return grid;
}

export function createStatisticsContentTableCard(tableHeading) {
    const card = createStatisticsCard(STATISTICS_CLASSES.TABLE_CARD);
    const header = createCardHeader();

    const title = document.createElement('h2');
    title.id = STATISTICS_DOM.CONTENT_TITLE_ID;
    title.textContent = tableHeading;

    const wrapper = document.createElement('div');
    wrapper.className = STATISTICS_CLASSES.TABLE_WRAPPER;

    const table = document.createElement('table');
    table.id = STATISTICS_DOM.CONTENT_TABLE_ID;
    table.append(document.createElement('thead'), document.createElement('tbody'));

    header.appendChild(title);
    wrapper.appendChild(table);
    card.append(header, wrapper);
    return card;
}

function createNameTableElement(id, title) {
    const card = createStatisticsCard();

    const heading = document.createElement('h3');
    heading.textContent = title;

    const table = document.createElement('table');
    table.id = id;

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    ['Name', 'Length'].forEach((label) => {
        const cell = document.createElement('th');
        cell.textContent = label;
        headRow.appendChild(cell);
    });
    thead.appendChild(headRow);

    table.append(thead, document.createElement('tbody'));
    card.append(heading, table);
    return card;
}
