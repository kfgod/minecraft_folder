import { STATISTICS_CLASSES, STATISTICS_DOM } from './constants.js';

export function createStatisticsChartCard(heading, chartType, { isYearView = false, logScale = false } = {}) {
    const card = createStatisticsCard(STATISTICS_CLASSES.CHART_CARD);
    const header = createCardHeader();

    const title = document.createElement('h2');
    title.id = STATISTICS_DOM.VIEW_TITLE_ID;
    title.textContent = heading;

    const toggle = document.createElement('div');
    toggle.className = STATISTICS_CLASSES.CHART_TOGGLE;
    toggle.append(
        createChartToggleButton('line', 'Growth', chartType),
        createChartToggleButton('bar', 'Stacked', chartType),
        createChartToggleButton('bar-absolute', isYearView ? 'Per year' : 'Per version', chartType),
    );

    const logToggle = document.createElement('label');
    logToggle.className = STATISTICS_CLASSES.LOG_TOGGLE;
    logToggle.hidden = chartType !== 'line';
    const logInput = document.createElement('input');
    logInput.type = 'checkbox';
    logInput.checked = logScale;
    const logLabel = document.createElement('span');
    logLabel.textContent = 'Log scale';
    logToggle.append(logInput, logLabel);

    const controls = document.createElement('div');
    controls.className = STATISTICS_CLASSES.CHART_CONTROLS;
    controls.append(logToggle, toggle);

    const wrapper = document.createElement('div');
    wrapper.className = STATISTICS_CLASSES.CHART_WRAPPER;

    const placeholder = document.createElement('div');
    placeholder.id = STATISTICS_DOM.CHART_PLACEHOLDER_ID;
    placeholder.className = STATISTICS_CLASSES.CHART_PLACEHOLDER;
    placeholder.textContent = 'No data to display.';

    const canvas = document.createElement('canvas');
    canvas.id = STATISTICS_DOM.CHART_ID;

    header.append(title, controls);
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

export function createReleaseGapCard() {
    const card = createStatisticsCard();
    const header = createCardHeader();
    const title = document.createElement('h2');
    title.textContent = 'Release Rhythm';
    const note = document.createElement('p');
    note.className = STATISTICS_CLASSES.SUBTITLE;
    note.textContent = 'Days between consecutive versions';
    const heading = document.createElement('div');
    heading.append(title, note);
    header.appendChild(heading);

    const wrapper = document.createElement('div');
    wrapper.className = `${STATISTICS_CLASSES.CHART_WRAPPER} ${STATISTICS_CLASSES.CHART_WRAPPER_SMALL}`;
    const canvas = document.createElement('canvas');
    canvas.id = STATISTICS_DOM.GAP_CHART_ID;
    wrapper.appendChild(canvas);
    card.append(header, wrapper);
    return card;
}

export function createUpdateTypesCard() {
    const card = createStatisticsCard();
    const header = createCardHeader();
    const title = document.createElement('h2');
    title.textContent = 'Update Types';
    const note = document.createElement('p');
    note.className = STATISTICS_CLASSES.SUBTITLE;
    note.textContent = 'Average content added per update';
    const heading = document.createElement('div');
    heading.append(title, note);
    header.appendChild(heading);

    const list = document.createElement('div');
    list.id = STATISTICS_DOM.TYPES_ID;
    card.append(header, list);
    return card;
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
