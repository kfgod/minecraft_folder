import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterItems, getNameSuggestions, parseSearchQuery } from '../js/data/search.js';

test('parseSearchQuery: empty', () => {
    assert.deepEqual(parseSearchQuery(''), { text: '', terms: [], tags: [] });
    assert.deepEqual(parseSearchQuery('   '), { text: '', terms: [], tags: [] });
});

test('parseSearchQuery: text and tags', () => {
    assert.deepEqual(parseSearchQuery('foo bar'), { text: 'foo bar', terms: ['foo', 'bar'], tags: [] });
    assert.deepEqual(parseSearchQuery('#mob #item'), { text: '', terms: [], tags: ['mob', 'item'] });
    assert.deepEqual(parseSearchQuery('stone #block'), { text: 'stone', terms: ['stone'], tags: ['block'] });
});

test('parseSearchQuery: keeps namespaced tags', () => {
    assert.deepEqual(parseSearchQuery('#wood:oak').tags, ['wood:oak']);
    assert.deepEqual(parseSearchQuery('#woodset/oak').tags, ['woodset/oak']);
    assert.deepEqual(parseSearchQuery('#Form:Planks!').tags, ['form:planks']);
});

test('filterItems: namespaced tags and word order', () => {
    const items = [
        { name: 'Oak Planks', identifier: 'oak_planks', types: ['wood:oak', 'form:planks'] },
        { name: 'Spruce Planks', identifier: 'spruce_planks', types: ['family:spruce', 'form:planks'] },
        { name: 'Oak Log', identifier: 'oak_log', types: ['wood:oak'] },
    ];
    assert.deepEqual(filterItems(items, '#wood:oak', false).map((i) => i.name), ['Oak Planks', 'Oak Log']);
    assert.deepEqual(filterItems(items, '#form:planks #wood:oak', false).map((i) => i.name), ['Oak Planks']);
    assert.deepEqual(filterItems(items, 'planks oak', false).map((i) => i.name), ['Oak Planks']);
    assert.deepEqual(filterItems(items, 'OAK planks', false).map((i) => i.name), ['Oak Planks']);
    assert.deepEqual(filterItems(items, 'planks #family:spruce', false).map((i) => i.name), ['Spruce Planks']);
});

test('getNameSuggestions: names first, then tags without hidden', () => {
    const updates = [{ added: { blocks: [
        { name: 'Oak Planks', types: ['wood:oak', 'hidden'] },
        { name: 'Oak Log', types: ['wood:oak'] },
    ] } }];
    assert.deepEqual(getNameSuggestions(updates, ['blocks']), ['Oak Log', 'Oak Planks', '#wood:oak']);
});

test('filterItems: text and hidden duplicates', () => {
    const items = [
        { name: 'Alpha', identifier: 'a', types: [], tags: [] },
        { name: 'Beta', identifier: 'b', types: ['hidden'], tags: [] },
    ];
    const r1 = filterItems(items, 'alp', false);
    assert.equal(r1.length, 1);
    assert.equal(r1[0].name, 'Alpha');
    const r2 = filterItems(items, '', true);
    assert.equal(r2.length, 1);
});
