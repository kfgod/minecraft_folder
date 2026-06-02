import { createStatusMessageElement } from '../../ui/status-view.js';
import { MATERIAL_GROUPS_CLASSES } from './constants.js';
import { createMaterialGroupSection } from './table.js';

export function renderMaterialGroupsView(container, data, { isSectionCollapsed }) {
    const items = getRenderableMaterialGroups(data);

    if (items.length === 0) {
        container.replaceChildren(createStatusMessageElement('No material groups found.'));
        return;
    }

    const root = document.createElement('div');
    root.className = MATERIAL_GROUPS_CLASSES.CONTAINER;

    const title = document.createElement('h1');
    title.className = MATERIAL_GROUPS_CLASSES.TITLE;
    title.textContent = 'Material Groups';
    root.appendChild(title);

    items.forEach((item, index) => {
        const group = createMaterialGroupSection(item, index, isSectionCollapsed);
        if (group) root.appendChild(group);
    });

    container.replaceChildren(root);
}

function getRenderableMaterialGroups(data) {
    return (data?.content || []).filter((item) => item.groups && Array.isArray(item.groups) && item.groups.length > 0);
}
