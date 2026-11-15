import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGridItemElement } from '../js/modules/card/exports.js';
import { createRecipeLayout, createVersionBadges } from '../js/modules/item-info/view.js';
import { attachTooltipController } from '../js/controllers/tooltip-controller.js';
import { findAll, flattenText, installDomStub } from './helpers/dom-stub.mjs';

const slots = (root) => findAll(root, (node) => /(^| )recipe-slot( |$)/.test(node.className || ''));

test('grid items: only blocks and items open the recipes dialog', () => {
    installDomStub();
    assert.equal(createGridItemElement({ name: 'Calcite', identifier: 'calcite' }, 'blocks').dataset.itemInfo, 'calcite');
    assert.equal(createGridItemElement({ name: 'Stick', identifier: 'stick' }, 'items').dataset.itemInfo, 'stick');
    assert.equal(createGridItemElement({ name: 'Speed', identifier: 'speed' }, 'effects').dataset.itemInfo, undefined);
});

test('recipe layout: pads shaped recipes to a 3x3 grid and shows result count', () => {
    installDomStub();
    const refs = { 'minecraft:calcite': { name: 'Calcite' }, 'minecraft:calcite_stairs': { name: 'Calcite Stairs' } };
    const layout = createRecipeLayout({
        type: 'crafting_shaped',
        grid: [[['minecraft:calcite'], null], [['minecraft:calcite'], ['minecraft:calcite']]],
        result: { id: 'minecraft:calcite_stairs', count: 4 },
    }, refs);
    const all = slots(layout);
    assert.equal(all.length, 10);
    assert.equal(all.filter((slot) => /recipe-slot-empty/.test(slot.className)).length, 6);
    assert.match(flattenText(layout), /4/);
});

test('recipe layout: cycles tag members and shows cooking time', () => {
    installDomStub();
    const refs = { '#minecraft:logs': { items: ['minecraft:oak_log', 'minecraft:birch_log'] } };
    const layout = createRecipeLayout({
        type: 'smelting',
        inputs: { ingredient: ['#minecraft:logs'] },
        result: { id: 'minecraft:charcoal', count: 1 },
        extra: { cookingtime: 200, experience: 0.15 },
    }, refs);
    const [input] = slots(layout);
    assert.equal(input._cycle.options.length, 2);
    assert.match(input.className, /recipe-slot-tag/);
    assert.match(flattenText(layout), /10 s · 0\.15 XP/);
});

test('version badges: only removal is shown', () => {
    installDomStub();
    assert.deepEqual(createVersionBadges({ removed: '26.4' }).map((b) => b.textContent), ['Removed in 26.4']);
    assert.equal(createVersionBadges({ since: '1.21.4', changed: ['26.1'] }).length, 0);
});

test('tooltip controller: a tap shows nothing and a click clears the tooltip', () => {
    installDomStub();
    globalThis.window = { addEventListener() {}, innerWidth: 1000 };
    const tooltip = document.createElement('div');
    tooltip.rect = { left: 0, top: 0, width: 120, height: 30 };
    const content = document.createElement('div');
    const cell = document.createElement('div');
    cell.className = 'grid-item';
    cell.dataset.tooltip = 'Calcite';
    cell.rect = { left: 100, top: 100, width: 40, height: 40 };
    cell.closest = () => cell; // the stub's closest() has no selector lists
    content.appendChild(cell);
    attachTooltipController({ elements: { content, tooltip } });

    content.dispatchEvent({ type: 'pointerover', pointerType: 'touch', target: cell });
    assert.equal(tooltip.classList.contains('visible'), false);

    content.dispatchEvent({ type: 'pointerover', pointerType: 'mouse', target: cell });
    assert.equal(tooltip.classList.contains('visible'), true);

    content.dispatchEvent({ type: 'click', target: cell });
    assert.equal(tooltip.classList.contains('visible'), false);
    delete globalThis.window;
});
