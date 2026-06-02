import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupByYear } from '../js/data/aggregation.js';
import { SECTION_TYPES } from '../js/section-config.js';

test('groupByYear: merges same year, sorts years descending', () => {
    const updates = [
        {
            release_date: '2024-01-15',
            added: { blocks: [{ name: 'A', identifier: 'a' }] },
            notable_changes: { additions: ['x'], changes: [] },
        },
        {
            release_date: '2024-06-01',
            added: { blocks: [{ name: 'B', identifier: 'b' }] },
            notable_changes: { additions: [], changes: ['y'] },
        },
        {
            release_date: '2023-05-01',
            added: { blocks: [{ name: 'C', identifier: 'c' }] },
        },
    ];
    const years = groupByYear(updates, SECTION_TYPES);
    assert.equal(years.length, 2);
    assert.equal(years[0].name, '2024');
    assert.equal(years[0].type, 'year');
    assert.equal(years[0].added.blocks.length, 2);
    assert.deepEqual(years[0].notable_changes.additions, ['x']);
    assert.deepEqual(years[0].notable_changes.changes, ['y']);
    assert.equal(years[1].name, '2023');
});

test('groupByYear: skips unparseable release_date', () => {
    const years = groupByYear([{ release_date: 'nope', added: {} }], SECTION_TYPES);
    assert.equal(years.length, 0);
});
