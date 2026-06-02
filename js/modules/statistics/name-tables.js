import { DOMManager } from '../../dom-manager.js';

export function renderStatisticsNameTables(elements, namesStats) {
    if (!elements || !namesStats) return;

    renderRows(elements.longestTableBody, namesStats.longest || []);
    renderRows(elements.shortestTableBody, namesStats.shortest || []);
}

function renderRows(container, data) {
    if (!container) return;
    DOMManager.clearContainer(container);

    data.forEach((name) => {
        const row = document.createElement('tr');
        const nameCell = document.createElement('td');
        const lengthCell = document.createElement('td');
        nameCell.textContent = name;
        lengthCell.textContent = name.length;
        row.appendChild(nameCell);
        row.appendChild(lengthCell);
        container.appendChild(row);
    });
}
