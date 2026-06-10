import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { APP_MODES } from '../js/app-modes.js';
import { AppActions } from '../js/app/actions.js';
import { attachContentController } from '../js/controllers/content-controller.js';
import { attachCompareHandlers } from '../js/modules/compare/controller.js';
import { renderCompareShell, getCompareElements } from '../js/modules/compare/view.js';
import { attachMaterialGroupToggleHandlers } from '../js/modules/material-groups/controller.js';
import { renderMaterialGroupsView } from '../js/modules/material-groups/view.js';
import { renderStatisticsContentTable } from '../js/modules/statistics/content-table.js';
import { syncThemeUi } from '../js/ui/mode-ui.js';
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

test('material groups interaction: keeps empty cells without synthetic fill cell', () => {
    installDomStub();
    const root = document.createElement('div');
    renderMaterialGroupsView(root, {
        content: [{
            name: 'Tiered Materials',
            groups: [
                {
                    material: { name: 'Wood', identifier: 'wood' },
                    items: {
                        axe: { name: 'Wooden Axe', identifier: 'wooden_axe' },
                        sword: { name: 'Wooden Sword', identifier: 'wooden_sword' },
                    },
                },
                {
                    material: { name: 'Leather', identifier: 'leather' },
                    items: {
                        boots: { name: 'Leather Boots', identifier: 'leather_boots' },
                    },
                },
            ],
        }],
    }, { isSectionCollapsed: () => false });

    const rows = findAll(root, (node) => node.tagName === 'tr');
    const firstRowCells = rows[0].children.filter((node) => node.tagName === 'td');

    assert.equal(firstRowCells.length, 4);
    assert.equal(findByClass(root, 'material-group-table-cell-fill'), null);
});

test('material groups interaction: renders generated family headers', () => {
    installDomStub();
    const root = document.createElement('div');
    renderMaterialGroupsView(root, {
        content: [{
            name: 'Block Forms',
            generated: 'families',
            columns_order: [
                'initial_stairs',
                'initial_slab',
                'polished_base',
                'polished_stairs',
                'mossy_base',
                'mossy_stairs',
                'special_button',
                'special_chiseled',
                'special_chiseled_2',
            ],
            groups: [{
                material: { name: 'Demo', identifier: 'demo' },
                items: {
                    initial_stairs: null,
                    initial_slab: { name: 'Demo Slab', identifier: 'demo_slab' },
                    polished_base: { name: 'Polished Demo', identifier: 'polished_demo' },
                    polished_stairs: { name: 'Polished Demo Stairs', identifier: 'polished_demo_stairs' },
                    special_button: { name: 'Demo Button', identifier: 'demo_button' },
                },
            }, {
                material: { name: 'Other', identifier: 'other' },
                items: {
                    mossy_base: { name: 'Mossy Other', identifier: 'mossy_other' },
                    mossy_stairs: { name: 'Mossy Other Stairs', identifier: 'mossy_other_stairs' },
                    special_chiseled: { name: 'Chiseled Other', identifier: 'chiseled_other' },
                    special_chiseled_2: { name: 'Other Chiseled Other', identifier: 'other_chiseled_other' },
                },
            }],
        }],
    }, { isSectionCollapsed: () => false });

    const headerRows = findAll(root, (node) => node.tagName === 'thead')[0].children;
    const familyTypeCells = headerRows[0].children.filter((node) => node.tagName === 'th');
    const formCells = headerRows[1].children.filter((node) => node.tagName === 'th');

    assert.equal(familyTypeCells[0].textContent, 'Initial');
    assert.equal(familyTypeCells[0].colSpan, 2);
    assert.equal(familyTypeCells[1].textContent, 'Polished');
    assert.equal(familyTypeCells[1].colSpan, 2);
    assert.equal(familyTypeCells[2].textContent, 'Mossy');
    assert.equal(familyTypeCells[2].colSpan, 2);
    assert.equal(familyTypeCells[3].textContent, 'Special');
    assert.equal(familyTypeCells[3].colSpan, 3);
    assert.deepEqual(formCells.map((cell) => cell.textContent), ['Stairs', 'Slab', 'Base', 'Stairs', 'Base', 'Stairs', 'Button', 'Chiseled', 'Chiseled']);
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

test('theme interaction: syncs body class and button pressed state', () => {
    installDomStub();
    const body = document.createElement('body');
    const dark = document.createElement('button');
    const light = document.createElement('button');
    const app = {
        state: { theme: 'light' },
        elements: {
            body,
            themeDarkBtn: dark,
            themeLightBtn: light,
        },
    };

    syncThemeUi(app);

    assert.equal(body.classList.contains('theme-light'), true);
    assert.equal(body.classList.contains('theme-dark'), false);
    assert.equal(dark.attributes['aria-pressed'], 'false');
    assert.equal(light.attributes['aria-pressed'], 'true');
    assert.equal(light.classList.contains('active'), true);
});

test('theme interaction: refreshes statistics chart colors when theme changes', async () => {
    let chartRenderView = null;
    let synced = false;
    let saved = false;

    const app = {
        state: {
            theme: 'dark',
            activeMode: APP_MODES.STATS,
            currentView: CONFIG.VIEWS.VERSIONS,
        },
        syncViewToggle() {
            synced = true;
        },
        saveState() {
            saved = true;
        },
        async ensureStatisticsManager() {
            return {
                async renderChart(isYearView) {
                    chartRenderView = isYearView;
                },
            };
        },
    };

    await new AppActions(app).setTheme('light');

    assert.equal(app.state.theme, 'light');
    assert.equal(synced, true);
    assert.equal(saved, true);
    assert.equal(chartRenderView, false);
});
