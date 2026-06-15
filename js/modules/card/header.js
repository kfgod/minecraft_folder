import { CARD_CLASSES, CARD_DATA } from './constants.js';

export function createCardHeaderElement(model) {
    const header = document.createElement('div');
    header.className = model.showClose
        ? `${CARD_CLASSES.HEADER_ROW} ${CARD_CLASSES.DETAIL_HEADER}`
        : CARD_CLASSES.HEADER_ROW;

    if (model.showClose) {
        header.appendChild(createDetailCloseButton());
    }

    const title = document.createElement('h1');
    if (model.showClose) {
        title.textContent = model.title;
    } else {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = CARD_CLASSES.DETAIL_LINK;
        button.dataset[CARD_DATA.DETAIL_TYPE] = model.detailType;
        button.dataset[CARD_DATA.DETAIL_ID] = model.id;
        button.textContent = model.title;
        title.appendChild(button);
    }
    header.appendChild(title);

    if (model.showClose) {
        const spacer = document.createElement('span');
        spacer.className = CARD_CLASSES.DETAIL_HEADER_SPACER;
        header.appendChild(spacer);
    }

    return header;
}

export function createCardStatusBadgeElement(model) {
    if (!model.statusBadge) return null;

    const badge = document.createElement('div');
    badge.className = [
        CARD_CLASSES.STATUS_BADGE,
        model.statusBadgeType ? `${CARD_CLASSES.STATUS_BADGE}-${model.statusBadgeType}` : '',
    ].filter(Boolean).join(' ');
    badge.textContent = model.statusBadge;
    return badge;
}

export function createCardSubtitleElement(model) {
    const parts = [];
    if (model.subtitle) {
        parts.push(createSubtitleText(model.subtitle));
    }
    if (model.typeLabel) {
        parts.push(createSubtitleText(model.typeLabel));
    }
    if (model.wiki) {
        const link = document.createElement('a');
        link.href = model.wiki;
        link.className = CARD_CLASSES.SUBTITLE_LINK;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'wiki';
        parts.push(link);
    }

    if (!parts.length) return null;

    const row = document.createElement('div');
    row.className = CARD_CLASSES.SUBTITLE_ROW;
    parts.forEach((part, index) => {
        if (index > 0) {
            const separator = document.createElement('span');
            separator.className = CARD_CLASSES.SUBTITLE_SEPARATOR;
            separator.textContent = '|';
            row.appendChild(separator);
        }
        row.appendChild(part);
    });
    return row;
}

function createDetailCloseButton() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = CARD_CLASSES.DETAIL_CLOSE_BUTTON;
    button.setAttribute('aria-label', 'Close detail');

    const icon = document.createElement('img');
    icon.src = 'static/images/icons/arrow.backward.svg';
    icon.alt = 'Back';
    button.appendChild(icon);
    return button;
}

function createSubtitleText(value) {
    const span = document.createElement('span');
    span.className = CARD_CLASSES.SUBTITLE_TEXT;
    span.textContent = value;
    return span;
}
