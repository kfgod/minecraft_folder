export function getSearchQueryFromFields(elements) {
    if (elements.mobileSearchBar && elements.mobileSearchBar.value.trim()) {
        return elements.mobileSearchBar.value.trim();
    }
    return elements.searchBar.value.trim();
}

export function setSearchQueryInFields(elements, value) {
    if (elements.searchBar) {
        elements.searchBar.value = value;
    }
    if (elements.mobileSearchBar) {
        elements.mobileSearchBar.value = value;
    }
    const hasValue = value.length > 0;
    elements.searchClearBtn?.classList.toggle('is-visible', hasValue);
    elements.mobileSearchClearBtn?.classList.toggle('is-visible', hasValue);
}
