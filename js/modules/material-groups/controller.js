import { MATERIAL_GROUPS_CLASSES } from './constants.js';

export function attachMaterialGroupToggleHandlers(root, { setSectionCollapsed }) {
    root.querySelectorAll(`.${MATERIAL_GROUPS_CLASSES.SECTION_TITLE}`).forEach((title) => {
        title.addEventListener('click', () => {
            const sectionId = title.getAttribute('data-section-id');
            if (!sectionId) return;

            const section = root.querySelector(`.${MATERIAL_GROUPS_CLASSES.SECTION}[data-section-id="${sectionId}"]`);
            const container = section?.querySelector(`.${MATERIAL_GROUPS_CLASSES.TABLE_CONTAINER}`);
            if (!section || !container) return;

            const isCollapsed = container.classList.toggle(MATERIAL_GROUPS_CLASSES.COLLAPSED);
            title.classList.toggle(MATERIAL_GROUPS_CLASSES.COLLAPSED, isCollapsed);
            setSectionCollapsed(sectionId, isCollapsed);
        });
    });
}
