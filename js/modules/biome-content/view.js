import { Utils } from '../../utils.js';
import { createStatusMessageElement } from '../../ui/status-view.js';

const SECTION_NAMES = { environment: 'Environment', blocks: 'Blocks', mobs: 'Mobs' };

function createEntryLink(entry, className) {
    const link = document.createElement(entry.wiki ? 'a' : 'span');
    link.className = className;
    if (entry.wiki) {
        link.href = entry.wiki;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
    }
    if (entry.imagePath) {
        const image = document.createElement('img');
        Utils.setImageWithFallback(image, Utils.resolveImagePath(entry));
        image.alt = '';
        image.loading = 'lazy';
        link.appendChild(image);
    }
    const name = document.createElement('span');
    name.textContent = entry.name || entry.identifier;
    link.appendChild(name);
    return link;
}

export function renderBiomeContentView(container, data) {
    if (!data?.length) {
        container.replaceChildren(createStatusMessageElement('No biome content found.'));
        return;
    }
    const root = document.createElement('div');
    root.className = 'biome-content-container';
    const title = document.createElement('h1');
    title.textContent = 'Biome Content';
    root.appendChild(title);
    data.forEach(({ biome, contents }) => {
        const section = document.createElement('section');
        section.className = 'biome-content-section';
        const heading = document.createElement('h2');
        heading.appendChild(createEntryLink(biome, 'biome-content-heading'));
        section.appendChild(heading);
        Object.entries(contents || {}).forEach(([key, entries]) => {
            if (!entries.length) return;
            const group = document.createElement('div');
            group.className = 'biome-content-group';
            const label = document.createElement('h3');
            label.textContent = SECTION_NAMES[key] || key;
            const list = document.createElement('ul');
            list.className = 'biome-content-entries';
            entries.forEach((entry) => {
                const item = document.createElement('li');
                item.appendChild(createEntryLink(entry, 'biome-content-entry'));
                list.appendChild(item);
            });
            group.append(label, list);
            section.appendChild(group);
        });
        root.appendChild(section);
    });
    container.replaceChildren(root);
}
