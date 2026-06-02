import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { getTableColumns, sortTableData } from '../js/modules/statistics/content-table.js';

test('statistics content table: derives columns and sorts values', () => {
    const columns = getTableColumns({
        currentView: CONFIG.VIEWS.VERSIONS,
        showItems: true,
        showBlocks: false,
        showMobs: true,
        showEffects: false,
        showEnchantments: false,
        showAdvancements: false,
        showBiomes: false,
        showStructures: false,
    });
    assert.deepEqual(columns.map((col) => col.key), ['name', 'version', 'items', 'mobs', 'total']);

    const sorted = sortTableData(
        [
            { name: 'B', total: 2 },
            { name: 'A', total: 5 },
        ],
        { column: 'total', direction: 'desc' }
    );
    assert.deepEqual(sorted.map((row) => row.name), ['A', 'B']);
});
