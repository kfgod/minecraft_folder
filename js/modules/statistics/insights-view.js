import { DOMManager } from '../../dom-manager.js';
import { STATISTICS_CLASSES } from './constants.js';

function el(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function createTile(label, value, note) {
    const tile = el('div', STATISTICS_CLASSES.TILE);
    tile.append(
        el('div', STATISTICS_CLASSES.TILE_LABEL, label),
        el('div', STATISTICS_CLASSES.TILE_VALUE, value),
        el('div', STATISTICS_CLASSES.TILE_NOTE, note),
    );
    return tile;
}

export function renderStatisticsTiles(container, summary) {
    if (!container) return;
    const { total, versions, years, firstYear, biggest, medianGap } = summary;
    container.replaceChildren(
        createTile('Total content', total.toLocaleString('en-US'), 'blocks, items, mobs and more'),
        createTile('Versions', String(versions), `${years} years with new content since ${firstYear}`),
        createTile('Biggest update', biggest?.version || '—', biggest ? `${biggest.name || 'Unnamed'} · ${biggest.counts.total} added` : ''),
        createTile('Typical gap', medianGap === null ? '—' : `${medianGap} days`, 'median between versions'),
    );
}

export function renderUpdateTypes(container, types) {
    if (!container) return;
    DOMManager.clearContainer(container);
    const largest = Math.max(1, ...types.map((type) => type.average));
    types.forEach((type) => {
        const row = el('div', STATISTICS_CLASSES.TYPE_ROW);
        row.appendChild(el('div', STATISTICS_CLASSES.TYPE_LABEL, type.label));
        const track = el('div', STATISTICS_CLASSES.TYPE_TRACK);
        const bar = el('div', STATISTICS_CLASSES.TYPE_BAR);
        bar.style.width = `${(type.average / largest) * 100}%`;
        track.appendChild(bar);
        row.appendChild(track);
        row.appendChild(el('div', STATISTICS_CLASSES.TYPE_VALUE, `${type.average} avg`));
        row.appendChild(el('div', STATISTICS_CLASSES.TYPE_NOTE, `${type.updates} ${type.updates === 1 ? 'update' : 'updates'} · ${type.total} total`));
        container.appendChild(row);
    });
}
