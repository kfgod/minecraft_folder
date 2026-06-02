import { findCompareItem } from './data.js';

export function attachCompareHandlers({ elements, dataSource, onSelectionChange, onScreenshot }) {
    attachSelect(elements.select1, 0, dataSource, onSelectionChange);
    attachSelect(elements.select2, 1, dataSource, onSelectionChange);
    elements.screenshotButton?.addEventListener('click', onScreenshot);
}

function attachSelect(select, index, dataSource, onSelectionChange) {
    if (!select) return;
    select.addEventListener('change', (e) => {
        onSelectionChange(index, findCompareItem(dataSource, e.target.value));
    });
}
