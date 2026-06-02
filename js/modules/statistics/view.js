import { STATISTICS_CLASSES, STATISTICS_DOM } from './constants.js';
import { createStatisticsChartCard } from './chart-view.js';
import { createStatisticsContentTableCard, createStatisticsNameTablesGrid } from './table-view.js';

export function collectStatisticsElements() {
    return {
        viewTitle: document.getElementById(STATISTICS_DOM.VIEW_TITLE_ID),
        chartCanvas: document.getElementById(STATISTICS_DOM.CHART_ID),
        longestTableBody: document.querySelector(`#${STATISTICS_DOM.LONGEST_TABLE_ID} tbody`),
        shortestTableBody: document.querySelector(`#${STATISTICS_DOM.SHORTEST_TABLE_ID} tbody`),
        tableTitle: document.getElementById(STATISTICS_DOM.CONTENT_TITLE_ID),
        contentTableHead: document.querySelector(`#${STATISTICS_DOM.CONTENT_TABLE_ID} thead`),
        contentTableBody: document.querySelector(`#${STATISTICS_DOM.CONTENT_TABLE_ID} tbody`),
        chartTypeButtons: document.querySelectorAll(`.${STATISTICS_CLASSES.CHART_BUTTON}`),
    };
}

export function renderStatisticsView(container, { isYearView, chartType }) {
    if (!container) return;
    container.replaceChildren(createStatisticsView({ isYearView, chartType }));
}

function createStatisticsView({ isYearView, chartType }) {
    const heading = isYearView ? 'Growth by Year' : 'Growth by Version';
    const tableHeading = isYearView ? 'Content by Year' : 'Content by Version';

    const section = document.createElement('section');
    section.className = STATISTICS_CLASSES.VIEW;

    const summary = document.createElement('div');
    summary.id = STATISTICS_DOM.SUMMARY_ID;
    summary.className = STATISTICS_CLASSES.SUMMARY;

    section.append(
        summary,
        createStatisticsChartCard(heading, chartType),
        createStatisticsNameTablesGrid(),
        createStatisticsContentTableCard(tableHeading),
    );
    return section;
}
