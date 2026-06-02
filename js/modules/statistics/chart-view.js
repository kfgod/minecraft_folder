import { STATISTICS_CLASSES, STATISTICS_DOM } from './constants.js';

export function createStatisticsChartCard(heading, chartType) {
    const card = createStatisticsCard(STATISTICS_CLASSES.CHART_CARD);
    const header = createCardHeader();

    const title = document.createElement('h2');
    title.id = STATISTICS_DOM.VIEW_TITLE_ID;
    title.textContent = heading;

    const toggle = document.createElement('div');
    toggle.className = STATISTICS_CLASSES.CHART_TOGGLE;
    toggle.append(
        createChartToggleButton('line', 'Line', chartType),
        createChartToggleButton('bar', 'Stacked Bar', chartType),
        createChartToggleButton('bar-absolute', 'Absolute Bar', chartType),
    );

    const wrapper = document.createElement('div');
    wrapper.className = STATISTICS_CLASSES.CHART_WRAPPER;

    const placeholder = document.createElement('div');
    placeholder.id = STATISTICS_DOM.CHART_PLACEHOLDER_ID;
    placeholder.className = STATISTICS_CLASSES.CHART_PLACEHOLDER;
    placeholder.textContent = 'No data to display.';

    const canvas = document.createElement('canvas');
    canvas.id = STATISTICS_DOM.CHART_ID;

    header.append(title, toggle);
    wrapper.append(placeholder, canvas);
    card.append(header, wrapper);
    return card;
}

function createChartToggleButton(type, label, activeType) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = [
        STATISTICS_CLASSES.CHART_BUTTON,
        activeType === type ? STATISTICS_CLASSES.ACTIVE : '',
    ].filter(Boolean).join(' ');
    button.dataset.chartType = type;
    button.textContent = label;
    return button;
}

export function createStatisticsCard(extraClass = '') {
    const card = document.createElement('div');
    card.className = [
        STATISTICS_CLASSES.CARD,
        extraClass,
    ].filter(Boolean).join(' ');
    return card;
}

export function createCardHeader() {
    const header = document.createElement('div');
    header.className = STATISTICS_CLASSES.CARD_HEADER;
    return header;
}
