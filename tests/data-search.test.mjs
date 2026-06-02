import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterItems, parseSearchQuery } from '../js/data/search.js';

test('parseSearchQuery: empty', () => {
    assert.deepEqual(parseSearchQuery(''), { text: '', tags: [] });
    assert.deepEqual(parseSearchQuery('   '), { text: '', tags: [] });
});

test('parseSearchQuery: text and tags', () => {
    assert.deepEqual(parseSearchQuery('foo bar'), { text: 'foo bar', tags: [] });
    assert.deepEqual(parseSearchQuery('#mob #item'), { text: '', tags: ['mob', 'item'] });
    assert.deepEqual(parseSearchQuery('stone #block'), { text: 'stone', tags: ['block'] });
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
