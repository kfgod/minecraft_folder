import { STATISTICS_CLASSES, STATISTICS_DOM } from './constants.js';
import { createReleaseGapCard, createStatisticsChartCard, createUpdateTypesCard } from './chart-view.js';
import { createStatisticsContentTableCard, createStatisticsNameTablesGrid } from './table-view.js';

export function collectStatisticsElements() {
    return {
        viewTitle: document.getElementById(STATISTICS_DOM.VIEW_TITLE_ID),
        chartCanvas: document.getElementById(STATISTICS_DOM.CHART_ID),
        gapChartCanvas: document.getElementById(STATISTICS_DOM.GAP_CHART_ID),
        tiles: document.getElementById(STATISTICS_DOM.TILES_ID),
        updateTypes: document.getElementById(STATISTICS_DOM.TYPES_ID),
        logToggle: document.querySelector(`.${STATISTICS_CLASSES.LOG_TOGGLE}`),
        longestTableBody: document.querySelector(`#${STATISTICS_DOM.LONGEST_TABLE_ID} tbody`),
        shortestTableBody: document.querySelector(`#${STATISTICS_DOM.SHORTEST_TABLE_ID} tbody`),
        tableTitle: document.getElementById(STATISTICS_DOM.CONTENT_TITLE_ID),
        contentTableHead: document.querySelector(`#${STATISTICS_DOM.CONTENT_TABLE_ID} thead`),
        contentTableBody: document.querySelector(`#${STATISTICS_DOM.CONTENT_TABLE_ID} tbody`),
        contentTableFoot: document.querySelector(`#${STATISTICS_DOM.CONTENT_TABLE_ID} tfoot`),
        chartTypeButtons: document.querySelectorAll(`.${STATISTICS_CLASSES.CHART_BUTTON}`),
    };
}

export function renderStatisticsView(container, { isYearView, chartType, logScale }) {
    if (!container) return;
    container.replaceChildren(createStatisticsView({ isYearView, chartType, logScale }));
}

function createStatisticsView({ isYearView, chartType, logScale }) {
    const heading = isYearView ? 'Growth by Year' : 'Growth by Version';
    const tableHeading = isYearView ? 'Content by Year' : 'Content by Version';

    const section = document.createElement('section');
    section.className = STATISTICS_CLASSES.VIEW;

    const title = document.createElement('h1');
    title.className = STATISTICS_CLASSES.PAGE_TITLE;
    title.textContent = 'Statistics';

    const tiles = document.createElement('div');
    tiles.id = STATISTICS_DOM.TILES_ID;
    tiles.className = STATISTICS_CLASSES.TILES;

    section.append(
        title,
        tiles,
        createStatisticsChartCard(heading, chartType, { isYearView, logScale }),
        createReleaseGapCard(),
        createUpdateTypesCard(),
        createStatisticsContentTableCard(tableHeading),
        createStatisticsNameTablesGrid(),
    );
    return section;
}
