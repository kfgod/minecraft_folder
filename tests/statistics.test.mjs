import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { calculateChartData, getChartStatsData } from '../js/modules/statistics/chart-renderer.js';
import { getTableColumns, sortTableData } from '../js/modules/statistics/content-table.js';
import { getMedian, getReleaseGaps, getStatisticsSummary, getUpdateTypeSummary } from '../js/modules/statistics/insights.js';

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

test('statistics chart: a bare year sorts after dated versions, a missing date last', () => {
    const stats = [
        { version: '26.5', release_date: null, counts: {} },
        { version: '26.4', release_date: '2026', counts: {} },
        { version: '26.3', release_date: 'September 15, 2026', counts: {} },
        { version: '26.1', release_date: 'March 24, 2026', counts: {} },
    ];
    assert.deepEqual(getChartStatsData(stats, false).map((stat) => stat.version), ['26.1', '26.3', '26.4', '26.5']);
});

test('statistics insights: gaps skip inexact dates, summary and update types add up', () => {
    const versions = [
        { version: '1.0', name: 'A', release_date: 'January 1, 2020', counts: { total: 10 } },
        { version: '1.1', name: 'B', release_date: 'January 11, 2020', counts: { total: 30 } },
        { version: '1.2', name: 'C', release_date: 'February 10, 2020', counts: { total: 20 } },
        { version: '1.3', name: 'D', release_date: '2020', counts: { total: 5 } },
    ];
    assert.deepEqual(getReleaseGaps(versions).map((gap) => [gap.previous, gap.version, gap.days]), [['1.0', '1.1', 10], ['1.1', '1.2', 30]]);
    assert.equal(getMedian([3, 1, 2]), 2);
    assert.equal(getMedian([1, 2, 3, 4]), 2.5);

    const summary = getStatisticsSummary(versions, [{ year: 2020, counts: { total: 65 } }, { year: 2021, counts: { total: 0 } }]);
    assert.equal(summary.total, 65);
    assert.equal(summary.years, 1);
    assert.equal(summary.biggest.version, '1.1');
    assert.equal(summary.medianGap, 20);

    const updates = versions.slice(0, 3).map((row, index) => ({
        release_version: { java: row.version },
        type: index === 2 ? 'drop' : 'major',
    }));
    assert.deepEqual(getUpdateTypeSummary(versions, updates).map((type) => [type.label, type.updates, type.total, type.average]), [
        ['Major', 2, 40, 20],
        ['Drop', 1, 20, 20],
        ['Early development', 1, 5, 5],
    ]);
});
