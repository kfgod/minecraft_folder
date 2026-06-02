import { DOM_CLASSES } from '../constants/dom-classes.js';

export function renderStatusMessage(container, message, { error = false } = {}) {
    if (!container) return;
    container.replaceChildren(createStatusMessageElement(message, { error }));
}

export function createStatusMessageElement(message, { error = false } = {}) {
    const element = document.createElement('p');
    element.className = `${DOM_CLASSES.EMPTY_STATE}${error ? ` ${DOM_CLASSES.ERROR_STATE}` : ''}`;
    element.textContent = message;
    return element;
}
