import { Utils } from '../../utils.js';
import { getCompareItemLabel } from './data.js';
import { COMPARE_CLASSES, COMPARE_DOM } from './constants.js';

export function renderCompareShell(root, { dataSource, selections, isYearView }) {
    if (!root) return;
    root.replaceChildren(createCompareShell({ dataSource, selections, isYearView }));
}

export function renderCompareEmpty(container, summary, { isYearView = false } = {}) {
    const empty = document.createElement('p');
    empty.className = COMPARE_CLASSES.EMPTY;
    empty.textContent = isYearView ? 'Select two years to compare' : 'Select two versions to compare';
    container.replaceChildren(empty);

    if (summary) {
        summary.textContent = isYearView
            ? 'Compare mode: select two years to view differences.'
            : 'Compare mode: select two versions to view differences.';
    }
}

export function renderCompareCards(container, card1, card2) {
    container.replaceChildren(
        createCompareCardWrapper(card1),
        createCompareCardWrapper(card2),
    );
}

export function renderCompareSummary(summary, name1, name2) {
    if (!summary) return;

    const first = document.createElement('strong');
    first.textContent = name1;
    const second = document.createElement('strong');
    second.textContent = name2;
    summary.replaceChildren('Comparing ', first, ' with ', second, '.');
}

export function getCompareElements(root = document) {
    return {
        container: getById(root, COMPARE_DOM.CONTAINER_ID),
        summary: getById(root, COMPARE_DOM.SUMMARY_ID),
        select1: getById(root, COMPARE_DOM.SELECT_1_ID),
        select2: getById(root, COMPARE_DOM.SELECT_2_ID),
        screenshotButton: root.querySelector?.(`.${COMPARE_DOM.SCREENSHOT_BUTTON}`) || null,
    };
}

function getById(root, id) {
    if (root.getElementById) return root.getElementById(id);
    return root.querySelector?.(`#${id}`) || null;
}

function createCompareShell({ dataSource, selections, isYearView }) {
    const label1 = isYearView ? 'Year 1:' : 'Version 1:';
    const label2 = isYearView ? 'Year 2:' : 'Version 2:';
    const placeholder = isYearView ? 'Select a year...' : 'Select a version...';
    const compareTitle = isYearView ? 'Compare Years' : 'Compare Versions';

    const root = document.createElement('div');
    root.className = COMPARE_CLASSES.CONTAINER;

    const header = document.createElement('div');
    header.className = COMPARE_CLASSES.HEADER;

    const title = document.createElement('h3');
    title.className = COMPARE_CLASSES.TITLE;
    title.textContent = compareTitle;

    const screenshotButton = document.createElement('button');
    screenshotButton.className = COMPARE_DOM.SCREENSHOT_BUTTON;
    screenshotButton.setAttribute('aria-label', 'Save comparison as image');
    screenshotButton.title = 'Save comparison as image';

    const icon = document.createElement('img');
    icon.src = 'static/images/icons/save_image.svg';
    icon.alt = '';
    screenshotButton.append(icon, ' Save Comparison');
    header.append(title, screenshotButton);

    const summary = document.createElement('div');
    summary.id = COMPARE_DOM.SUMMARY_ID;
    summary.className = COMPARE_CLASSES.SUMMARY;

    const selectors = document.createElement('div');
    selectors.className = COMPARE_CLASSES.SELECTORS;
    selectors.append(
        createSelector({ id: COMPARE_DOM.SELECT_1_ID, label: label1, placeholder, dataSource, selectedItem: selections[0], isYearView }),
        createSelector({ id: COMPARE_DOM.SELECT_2_ID, label: label2, placeholder, dataSource, selectedItem: selections[1], isYearView }),
    );

    const cards = document.createElement('div');
    cards.className = COMPARE_CLASSES.CARDS;
    cards.id = COMPARE_DOM.CONTAINER_ID;

    root.append(header, summary, selectors, cards);
    return root;
}

function createSelector({ id, label, placeholder, dataSource, selectedItem, isYearView }) {
    const wrapper = document.createElement('div');
    wrapper.className = COMPARE_CLASSES.SELECTOR;

    const labelEl = document.createElement('label');
    labelEl.htmlFor = id;
    labelEl.textContent = label;

    const select = document.createElement('select');
    select.id = id;
    select.className = COMPARE_CLASSES.VERSION_SELECT;
    select.appendChild(createOption('', placeholder));

    const selectedId = selectedItem ? Utils.generateCardId(selectedItem) : null;
    dataSource.forEach((item) => {
        const itemId = Utils.generateCardId(item);
        const option = createOption(itemId, getCompareItemLabel(item, isYearView));
        option.selected = itemId === selectedId;
        select.appendChild(option);
    });

    wrapper.append(labelEl, select);
    return wrapper;
}

function createOption(value, label) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    return option;
}

function createCompareCardWrapper(card) {
    const wrapper = document.createElement('div');
    wrapper.className = COMPARE_CLASSES.CARD_WRAPPER;
    wrapper.appendChild(card);
    return wrapper;
}

export function createComparePlaceholder(label) {
    const placeholder = document.createElement('div');
    placeholder.className = COMPARE_CLASSES.PLACEHOLDER;
    placeholder.textContent = label;
    return placeholder;
}
