import { SECTION_TYPES } from '../section-config.js';
import { getNameSuggestions } from '../data/search.js';
import { DOMManager } from '../dom-manager.js';

export function renderSearchSuggestions(updates, datalist, limit = 80) {
    if (!datalist) return;
    const suggestions = getNameSuggestions(updates, SECTION_TYPES, limit);
    DOMManager.clearContainer(datalist);
    suggestions.forEach((name) => {
        const option = document.createElement('option');
        option.value = name;
        datalist.appendChild(option);
    });
}
