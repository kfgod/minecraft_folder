import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { attachContentController } from '../js/controllers/content-controller.js';
import { attachCompareHandlers } from '../js/modules/compare/controller.js';
import { renderCompareShell, getCompareElements } from '../js/modules/compare/view.js';
import { attachMaterialGroupToggleHandlers } from '../js/modules/material-groups/controller.js';
import { renderMaterialGroupsView } from '../js/modules/material-groups/view.js';
import { renderStatisticsContentTable } from '../js/modules/statistics/content-table.js';
import { showTooltip } from '../js/ui/tooltip.js';
import { findAll, findByClass, flattenText, installDomStub } from './helpers/dom-stub.mjs';

test('compare interaction: select change resolves selected item', () => {
    installDomStub();
    const dataSource = [
        { name: 'One', release_version: { java: '1.0' } },
        { name: 'Two', release_version: { java: '2.0' } },
    ];
    const root = document.createElement('div');
    renderCompareShell(root, { dataSource, selections: [null, null], isYearView: false });

    let changed = null;
    const elements = getCompareElements(root);
    attachCompareHandlers({
        elements,
        dataSource,
        onSelectionChange: (index, item) => {
            changed = { index, item };
        },
        onScreenshot: () => {},
    });

    const secondOption = findAll(elements.select1, (node) => node.tagName === 'option')[2];
    elements.select1.value = secondOption.value;
    elements.select1.dispatchEvent({ type: 'change', target: elements.select1 });

    assert.equal(changed.index, 0);
    assert.equal(changed.item, dataSource[1]);
});

test('material groups interaction: click toggles collapsed state', () => {
    installDomStub();
    const root = document.createElement('div');
    renderMaterialGroupsView(root, {
        content: [{
            name: 'Tools',
            groups: [{
                material: { name: 'Iron', identifier: 'iron' },
                items: { sword: { name: 'Iron Sword', identifier: 'iron_sword' } },
            }],
        }],
    }, { isSectionCollapsed: () => false });

    let stored = null;
    attachMaterialGroupToggleHandlers(root, {
        setSectionCollapsed: (sectionId, collapsed) => {
            stored = { sectionId, collapsed };
        },
    });

    const title = findByClass(root, 'material-group-section-title');
    const table = findByClass(root, 'material-group-table-container');
    title.click();

    assert.equal(stored.sectionId, 'material-group-0');
    assert.equal(stored.collapsed, true);
    assert.equal(title.classList.contains('collapsed'), true);
    assert.equal(table.classList.contains('collapsed'), true);
});

test('statistics interaction: header click calls sort handler with column key', () => {
    installDomStub();
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    let sortedColumn = null;

    renderStatisticsContentTable({
        elements: { contentTableHead: thead, contentTableBody: tbody },
        appState: {
            currentView: CONFIG.VIEWS.VERSIONS,
            showItems: true,
            showBlocks: false,
            showMobs: false,
            showEffects: false,
            showEnchantments: false,
            showAdvancements: false,
            showBiomes: false,
            showStructures: false,
        },
        statisticsState: {
            sortState: { column: 'total', direction: 'desc' },
            versionsStats: [{ name: 'A', version: '1.0', counts: { items: 1, total: 1 } }],
        },
        getVersionDetailId: () => 'version-a',
        getYearDetailId: () => 'year-a',
        onSort: (column) => {
            sortedColumn = column;
        },
    });

    const itemsHeader = findAll(thead, (node) => node.tagName === 'th').find((cell) => cell.dataset.sort === 'items');
    itemsHeader.click();

    assert.equal(sortedColumn, 'items');
});

test('card interaction: section title toggles collapsed state and persists', () => {
    installDomStub();
    const content = document.createElement('div');
    const card = document.createElement('div');
    card.className = 'update-card';
    card.id = 'card-a';
    const section = document.createElement('div');
    section.className = 'card-section';
    section.dataset.section = 'blocks';
    const title = document.createElement('div');
    title.className = 'section-title';
    section.appendChild(title);
    card.appendChild(section);
    content.appendChild(card);

    let remembered = null;
    attachContentController({
        elements: { content },
        state: { currentView: CONFIG.VIEWS.VERSIONS },
        rememberCollapsed: (sectionEl) => {
            remembered = sectionEl;
        },
    });

    content.dispatchEvent({
        type: 'click',
        target: title,
        preventDefault() {},
    });

    assert.equal(section.classList.contains('collapsed'), true);
    assert.equal(title.attributes['aria-expanded'], 'false');
    assert.equal(remembered, section);
});

test('tooltip interaction: health tooltip renders icon text and below state', () => {
    installDomStub();
    globalThis.window = { innerWidth: 800 };
    const tooltip = document.createElement('div');
    tooltip.rect = { left: 0, top: 0, width: 120, height: 30 };
    const target = document.createElement('div');
    target.rect = { left: 20, top: 5, width: 50, height: 20 };

    showTooltip(tooltip, target, 'Zombie|health:10');

    assert.match(flattenText(tooltip), /Zombie/);
    assert.match(flattenText(tooltip), /×10/);
    assert.ok(findByClass(tooltip, 'tooltip-health-icon'));
    assert.equal(tooltip.classList.contains('tooltip-below'), true);
    assert.equal(tooltip.classList.contains('visible'), true);
});
