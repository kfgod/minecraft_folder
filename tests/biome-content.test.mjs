import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderBiomeContentView } from '../js/modules/biome-content/view.js';
import { APP_MODES, activeModeFromUrlParam, urlParamFromActiveMode, isSearchDisabledMode, isYearToggleDisabledMode } from '../js/app-modes.js';
import { flattenText, installDomStub } from './helpers/dom-stub.mjs';

test('biome content renders generated data, flat lists, links and hides empty sections', async () => {
    installDomStub();
    const data = JSON.parse(await readFile(new URL('../../minecraft_data/data/biome_content/desert.json', import.meta.url), 'utf8'));
    data.contents.empty = [];
    const container = document.createElement('main');
    renderBiomeContentView(container, [data]);
    const text = flattenText(container);
    for (const label of ['Desert', 'Environment', 'Blocks', 'Mobs', 'Tall Dry Grass', 'Rabbit']) assert.ok(text.includes(label));
    assert.ok(!text.includes('empty'));
    const links = container.querySelectorAll('a');
    assert.equal(links.length, 15);
    assert.equal(links.at(-1).href, 'https://minecraft.wiki/w/Rabbit');
    assert.equal(container.querySelectorAll('li').length, 14);
});

test('biome content has an empty state and URL mode', () => {
    installDomStub();
    const container = document.createElement('main');
    renderBiomeContentView(container, []);
    assert.match(flattenText(container), /No biome content found/);
    assert.equal(activeModeFromUrlParam('biome-content'), APP_MODES.BIOME_CONTENT);
    assert.equal(urlParamFromActiveMode(APP_MODES.BIOME_CONTENT), 'biome-content');
    assert.equal(isSearchDisabledMode(APP_MODES.BIOME_CONTENT), true);
    assert.equal(isYearToggleDisabledMode(APP_MODES.BIOME_CONTENT), true);
});
