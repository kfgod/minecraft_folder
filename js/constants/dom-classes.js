export const DOM_CLASSES = Object.freeze({
    GRID_ITEM: 'grid-item',
    SECTION_TITLE: 'section-title',
    CARD_SECTION: 'card-section',
    UPDATE_CARD: 'update-card',
    DETAIL_LINK: 'detail-link',
    SCREENSHOT_BUTTON: 'screenshot-btn',
    EMPTY_STATE: 'empty-state',
    ERROR_STATE: 'is-error',
});

export const DOM_SELECTORS = Object.freeze({
    GRID_ITEM: `.${DOM_CLASSES.GRID_ITEM}`,
    UPDATE_CARD: `.${DOM_CLASSES.UPDATE_CARD}`,
    SCREENSHOT_BUTTON: `.${DOM_CLASSES.SCREENSHOT_BUTTON}`,
    SECTION_TITLE: `.${DOM_CLASSES.SECTION_TITLE}`,
    CARD_SECTION: `.${DOM_CLASSES.CARD_SECTION}`,
});
