import { CONFIG } from '../../config.js';
import { ensureChartJs } from '../../cdn-loaders.js';
import { CHART_SERIES } from './chart-series.js';

export async function renderStatisticsChart({
    elements,
    statisticsState,
    appState,
    isYearView,
    destroyChart,
    setChart,
    setPlaceholder,
}) {
    await ensureChartJs();
    const Chart = globalThis.Chart;

    const statsData = isYearView ? statisticsState.yearsStats : statisticsState.versionsStats;
    if (!statsData || !statsData.length) {
        destroyChart();
        setPlaceholder('No statistics data available.', true);
        return;
    }

    if (!elements.chartCanvas || typeof Chart === 'undefined') {
        return;
    }

    const labelKey = isYearView ? 'year' : 'version';
    const isAbsoluteBar = statisticsState.chartType === 'bar-absolute';
    const chartData = calculateChartData(statsData, labelKey, !isAbsoluteBar);

    if (!chartData.labels.length) {
        destroyChart();
        setPlaceholder('No statistics data available.', true);
        return;
    }

    const isBarChart = statisticsState.chartType === 'bar' || statisticsState.chartType === 'bar-absolute';
    const datasets = buildDatasets({ chartData, appState, isBarChart });

    if (datasets.length === 0) {
        destroyChart();
        setPlaceholder('No content selected. Enable filters to see the chart.', true);
        return;
    }

    const ctx = elements.chartCanvas.getContext('2d');
    destroyChart();
    setChart(
        new Chart(ctx, {
            type: isBarChart ? 'bar' : 'line',
            data: {
                labels: chartData.labels,
                datasets,
            },
            options: buildChartOptions(isBarChart),
        })
    );
    setPlaceholder('', false);
}

function calculateChartData(stats, labelKey, cumulative = true) {
    const labels = [];
    const seriesData = Object.fromEntries(CHART_SERIES.map(({ key }) => [key, []]));

    if (cumulative) {
        const totals = Object.fromEntries(CHART_SERIES.map(({ key }) => [key, 0]));
        stats.forEach((stat) => {
            labels.push(stat[labelKey]);
            CHART_SERIES.forEach(({ key }) => {
                totals[key] += stat.counts[key] || 0;
                seriesData[key].push(totals[key]);
            });
        });
    } else {
        stats.forEach((stat) => {
            labels.push(stat[labelKey]);
            CHART_SERIES.forEach(({ key }) => {
                seriesData[key].push(stat.counts[key] || 0);
            });
        });
    }

    return { labels, ...seriesData };
}

function buildDatasets({ chartData, appState, isBarChart }) {
    CHART_SERIES.forEach(({ key }) => {
        if (!chartData[key]) {
            chartData[key] = chartData.labels.map(() => 0);
        }
    });

    return CHART_SERIES
        .map((series) => ({
            ...series,
            data: chartData[series.key],
            enabled: appState[series.stateKey],
        }))
        .filter((ds) => ds.enabled)
        .map((ds) => ({
            label: ds.label,
            data: ds.data || [],
            borderColor: ds.borderColor,
            backgroundColor: normalizeBackgroundColor(ds.backgroundColor, isBarChart),
            fill: isBarChart,
            tension: isBarChart ? 0 : 0.1,
        }));
}

function normalizeBackgroundColor(backgroundColor, isBarChart) {
    if (!isBarChart || !backgroundColor.includes('rgba')) return backgroundColor;

    const rgbaMatch = backgroundColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (!rgbaMatch) return backgroundColor;

    return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, 0.7)`;
}

function buildChartOptions(isBarChart) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                stacked: isBarChart,
                ticks: { color: CONFIG.CHART_COLORS.TEXT },
                grid: { color: CONFIG.CHART_COLORS.GRID },
            },
            x: {
                stacked: isBarChart,
                ticks: { color: CONFIG.CHART_COLORS.TEXT },
                grid: { color: CONFIG.CHART_COLORS.GRID },
            },
        },
        plugins: {
            legend: {
                labels: { color: CONFIG.CHART_COLORS.TEXT },
            },
        },
    };
}
