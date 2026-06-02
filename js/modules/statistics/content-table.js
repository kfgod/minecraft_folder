import { DOMManager } from '../../dom-manager.js';
import { CONFIG } from '../../config.js';
import { SECTION_META, STATS_COLUMNS_ORDER } from '../../section-config.js';
import { STATISTICS_CLASSES } from './constants.js';

export function renderStatisticsContentTable({
    elements,
    appState,
    statisticsState,
    getVersionDetailId,
    getYearDetailId,
    onSort,
}) {
    if (!elements) return;

    const columns = getTableColumns(appState);
    const data = getTableData({
        appState,
        statisticsState,
        getVersionDetailId,
        getYearDetailId,
    });
    const sortedData = sortTableData(data, statisticsState.sortState);
    const thead = elements.contentTableHead;
    const tbody = elements.contentTableBody;

    if (!thead || !tbody) return;

    renderTableHead(thead, columns);

    thead.querySelectorAll('th').forEach((th) => {
        th.addEventListener('click', () => {
            onSort(th.dataset.sort);
        });
    });

    renderTableRows({
        tbody,
        columns,
        sortedData,
        isYearView: appState.currentView === CONFIG.VIEWS.YEARS,
        getYearDetailId,
    });
}

function renderTableHead(thead, columns) {
    DOMManager.clearContainer(thead);
    const row = document.createElement('tr');
    columns.forEach((col) => {
        const cell = document.createElement('th');
        cell.dataset.sort = col.key;
        cell.textContent = col.label;
        row.appendChild(cell);
    });
    thead.appendChild(row);
}

export function getTableColumns(appState) {
    const filteredContentColumns = STATS_COLUMNS_ORDER
        .map((key) => {
            const meta = SECTION_META[key];
            if (!meta?.statsTable) return null;
            const enabled = meta.stateKey ? appState[meta.stateKey] : true;
            return enabled ? { key, label: meta.label } : null;
        })
        .filter(Boolean);

    if (appState.currentView === CONFIG.VIEWS.YEARS) {
        return [
            { key: 'year', label: 'Year' },
            ...filteredContentColumns,
            { key: 'total', label: 'Total' },
        ];
    }

    return [
        { key: 'name', label: 'Name' },
        { key: 'version', label: 'Version' },
        ...filteredContentColumns,
        { key: 'total', label: 'Total' },
    ];
}

export function getTableData({ appState, statisticsState, getVersionDetailId, getYearDetailId }) {
    if (appState.currentView === CONFIG.VIEWS.YEARS) {
        return statisticsState.yearsStats.map((stat) => ({
            year: stat.year,
            items: stat.counts.items,
            blocks: stat.counts.blocks,
            mobs: stat.counts.mobs,
            effects: stat.counts.effects,
            enchantments: stat.counts.enchantments || 0,
            advancements: stat.counts.advancements || 0,
            biomes: stat.counts.biomes || 0,
            structures: stat.counts.structures || 0,
            total: stat.counts.total,
            _detailId: getYearDetailId(stat.year),
        }));
    }

    return statisticsState.versionsStats.map((stat, index) => ({
        name: stat.name || 'N/A',
        version: stat.version || 'N/A',
        items: stat.counts.items,
        blocks: stat.counts.blocks,
        mobs: stat.counts.mobs,
        effects: stat.counts.effects,
        enchantments: stat.counts.enchantments || 0,
        advancements: stat.counts.advancements || 0,
        biomes: stat.counts.biomes || 0,
        structures: stat.counts.structures || 0,
        total: stat.counts.total,
        _original_index: index,
        _detailId: getVersionDetailId(stat),
    }));
}

export function sortTableData(data, sortState) {
    const column = sortState.column;
    const direction = sortState.direction === 'asc' ? 1 : -1;

    if (!data.length || !(column in data[0])) {
        return data;
    }

    return data.slice().sort((a, b) => {
        const valA = a[column];
        const valB = b[column];

        if (column === 'name') {
            const aNa = valA === 'N/A' ? 1 : 0;
            const bNa = valB === 'N/A' ? 1 : 0;
            if (aNa !== bNa) return aNa - bNa;
            return direction * String(valA).localeCompare(String(valB), undefined, { numeric: true });
        }

        if (column === 'version') {
            return direction * ((a._original_index || 0) - (b._original_index || 0));
        }

        if (typeof valA === 'string' || typeof valB === 'string') {
            return direction * String(valA).localeCompare(String(valB), undefined, { numeric: true });
        }

        return direction * (valA - valB);
    });
}

function renderTableRows({ tbody, columns, sortedData, isYearView, getYearDetailId }) {
    DOMManager.clearContainer(tbody);
    sortedData.forEach((item) => {
        const row = tbody.insertRow();
        columns.forEach((col) => {
            const cell = row.insertCell();
            const value = item[col.key];
            const displayValue = value ?? 'N/A';

            if (!isYearView && (col.key === 'name' || col.key === 'version')) {
                renderVersionDetailCell(cell, displayValue, item._detailId);
            } else if (isYearView && col.key === 'year') {
                renderYearDetailCell(cell, displayValue, getYearDetailId(item.year));
            } else {
                cell.textContent = displayValue;
            }
        });
    });
}

function renderVersionDetailCell(cell, displayValue, detailId) {
    if (detailId) {
        cell.appendChild(createDetailButton('version', detailId, displayValue));
    } else {
        cell.textContent = displayValue;
    }
}

function renderYearDetailCell(cell, displayValue, detailId) {
    cell.appendChild(createDetailButton('year', detailId, displayValue));
}

function createDetailButton(detailType, detailId, displayValue) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = STATISTICS_CLASSES.DETAIL_LINK;
    button.dataset.detailType = detailType;
    button.dataset.detailId = detailId;
    button.textContent = displayValue;
    return button;
}
