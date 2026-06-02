import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CardRenderer } from '../js/modules/card/exports.js';
import { renderCompareShell } from '../js/modules/compare/exports.js';
import { renderDetailView } from '../js/modules/detail/renderer.js';
import { renderMaterialGroupsView } from '../js/modules/material-groups/view.js';
import { renderStatisticsView } from '../js/modules/statistics/view.js';
import { renderTimeSinceView } from '../js/modules/time-since/view.js';
import { findByClass, flattenText, installDomStub } from './helpers/dom-stub.mjs';

test('browser smoke: static shell and core mode renderers', async () => {
    installDomStub();
    globalThis.window = { scrollTo() {} };

    const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
    assert.match(html, /js\/index\.js/);
    assert.match(html, /id="content"/);

    const content = document.createElement('main');
    const navList = document.createElement('ul');
    const ctx = {
        state: {
            activeMode: 'list',
            currentView: 'versions',
            showItems: true,
            showBlocks: true,
            showMobs: true,
            showMobVariants: true,
            showEffects: true,
            showEnchantments: true,
            showAdvancements: true,
            showPaintings: true,
            showBiomes: true,
            showStructures: true,
            showNotableChanges: true,
            removeDuplicates: false,
        },
        elements: { content, navList },
        queries: {
            isYearView: () => false,
            getSearchQuery: () => '',
        },
        managers: {
            navigation: () => ({ renderDetailNav() {} }),
            cardRenderer: () => cardRenderer,
        },
    };
    const cardRenderer = new CardRenderer(ctx);

    const update = {
        name: 'Smoke Update',
        release_version: { java: '1.0' },
        release_date: '2024-01-01',
        added: {
            blocks: [{ name: 'Smoke Block', identifier: 'smoke_block' }],
        },
    };

    const card = cardRenderer.createCard(update);
    assert.ok(findByClass(card, 'update-card'));
    assert.match(flattenText(card), /Smoke Update/);

    const compareRoot = document.createElement('div');
    renderCompareShell(compareRoot, { dataSource: [update], selections: [update, null], isYearView: false });
    assert.match(flattenText(compareRoot), /Compare Versions/);

    const statsRoot = document.createElement('div');
    renderStatisticsView(statsRoot, { isYearView: false, chartType: 'line' });
    assert.match(flattenText(statsRoot), /Growth by Version/);

    const timeRoot = document.createElement('div');
    renderTimeSinceView(timeRoot, {
        last_block: {
            release_date: '2024-01-01',
            version: '1.0',
            element: { name: 'Smoke Block' },
        },
    });
    assert.match(flattenText(timeRoot), /Time Since Last Update/);

    const materialRoot = document.createElement('div');
    renderMaterialGroupsView(materialRoot, {
        content: [{
            name: 'Smoke Materials',
            groups: [{
                material: { name: 'Iron', identifier: 'iron' },
                items: { sword: { name: 'Iron Sword', identifier: 'iron_sword' } },
            }],
        }],
    }, { isSectionCollapsed: () => false });
    assert.match(flattenText(materialRoot), /Smoke Materials/);

    renderDetailView(ctx, update);
    assert.ok(findByClass(content, 'detail-view'));
});
