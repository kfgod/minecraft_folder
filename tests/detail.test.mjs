import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getDetailData, getFilteredDetailData } from '../js/modules/detail/data.js';

test('detail data helpers find targets and apply filters', () => {
    const yearEntry = { name: '2024', added: { blocks: [{ name: 'Year Block', identifier: 'yb' }] } };
    const versionEntry = {
        name: 'Version',
        added: {
            blocks: [
                { name: 'Stone', identifier: 'stone' },
                { name: 'Dirt', identifier: 'dirt' },
            ],
        },
    };
    const ctx = {
        state: {
            allUpdates: [versionEntry],
            removeDuplicates: false,
        },
        queries: {
            getYearEntries: () => [yearEntry],
            getSearchQuery: () => 'stone',
        },
    };

    assert.equal(getDetailData(ctx, { type: 'year', id: 'id-2024' }), yearEntry);
    assert.equal(getDetailData(ctx, { type: 'version', id: 'Version' }), versionEntry);
    assert.equal(getFilteredDetailData(ctx, versionEntry).added.blocks.length, 1);
});
