import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { calculateChartData, getChartStatsData } from '../js/modules/statistics/chart-renderer.js';
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

test('statistics chart: versions are normalized to chronological order', () => {
    const stats = [
        { version: '1.2', release_date: '2012-03-01T00:00:00+00:00', counts: { blocks: 2 } },
        { version: '1.0', release_date: '2011-11-18T00:00:00+00:00', counts: { blocks: 1 } },
        { version: '1.1', release_date: '2012-01-12T00:00:00+00:00', counts: { blocks: 3 } },
    ];

    const chartStats = getChartStatsData(stats, false);
    const chartData = calculateChartData(chartStats, 'version', true);

    assert.deepEqual(chartData.labels, ['1.0', '1.1', '1.2']);
    assert.deepEqual(chartData.blocks, [1, 4, 6]);
    assert.deepEqual(stats.map((stat) => stat.version), ['1.2', '1.0', '1.1']);
});

test('statistics chart: years are normalized ascending', () => {
    const stats = [
        { year: 2024, counts: { blocks: 2 } },
        { year: 2022, counts: { blocks: 1 } },
        { year: 2023, counts: { blocks: 3 } },
    ];

    const chartData = calculateChartData(getChartStatsData(stats, true), 'year', false);

    assert.deepEqual(chartData.labels, [2022, 2023, 2024]);
    assert.deepEqual(chartData.blocks, [1, 3, 2]);
});
