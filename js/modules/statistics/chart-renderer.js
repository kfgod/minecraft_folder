import { CONFIG } from '../../config.js';
import { ensureChartJs } from '../../cdn-loaders.js';
import { Utils } from '../../utils.js';
import { CHART_SERIES, SERIES_COLORS } from './chart-series.js';

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

    const statsData = getChartStatsData(
        isYearView ? statisticsState.yearsStats : statisticsState.versionsStats,
        isYearView,
    );
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
    const logScale = !isBarChart && Boolean(statisticsState.logScale);
    const datasets = buildDatasets({ chartData, appState, isBarChart, logScale });

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
            options: buildChartOptions({ isBarChart, logScale, statsData, isYearView }),
            plugins: [crosshairPlugin],
        })
    );
    setPlaceholder('', false);
}

export function getChartStatsData(stats, isYearView) {
    const source = Array.isArray(stats) ? stats.slice() : [];
    if (isYearView) {
        return source.sort((a, b) => Number(a.year) - Number(b.year));
    }

    // Utils.parseDate puts a bare year at its end, like the update list ("2026" after June 2026).
    const time = (stat) => Utils.parseDate(stat.release_date)?.getTime() ?? Number.POSITIVE_INFINITY;
    return source.sort((a, b) => {
        const timeA = time(a);
        const timeB = time(b);
        return timeA === timeB ? 0 : timeA - timeB;
    });
}

export function calculateChartData(stats, labelKey, cumulative = true) {
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

function buildDatasets({ chartData, appState, isBarChart, logScale }) {
    const theme = isLightTheme() ? 'light' : 'dark';
    return CHART_SERIES
        .filter((series) => appState[series.stateKey])
        .map((series) => {
            const color = SERIES_COLORS[series.hue][theme];
            const data = (chartData[series.key] || chartData.labels.map(() => 0))
                // A log axis cannot show zero: the line starts at the first non-empty point.
                .map((value) => (logScale && value === 0 ? null : value));
            if (isBarChart) {
                return {
                    label: series.label,
                    data,
                    backgroundColor: series.variant ? `${color}8c` : color,
                    borderColor: getComputedStyle(document.body).getPropertyValue('--surface-color').trim(),
                    borderWidth: 1,
                    borderRadius: 2,
                };
            }
            return {
                label: series.label,
                data,
                borderColor: color,
                backgroundColor: color,
                borderWidth: 2,
                borderDash: series.variant ? [5, 4] : [],
                pointRadius: 0,
                pointHoverRadius: 4,
                pointHitRadius: 12,
                tension: 0,
                spanGaps: true,
            };
        });
}

/** Thin vertical guide at the hovered version. */
const crosshairPlugin = {
    id: 'statsCrosshair',
    afterDatasetsDraw(chart) {
        const active = chart.tooltip?.getActiveElements?.() || [];
        if (!active.length) return;
        const { ctx, chartArea } = chart;
        const x = active[0].element.x;
        ctx.save();
        ctx.strokeStyle = getChartThemeColors().grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.stroke();
        ctx.restore();
    },
};

function getTooltipTitle(stat, isYearView) {
    if (!stat) return '';
    if (isYearView) return String(stat.year);
    const heading = stat.name ? `${stat.version} — ${stat.name}` : stat.version;
    return stat.release_date ? [heading, stat.release_date] : heading;
}

function buildChartOptions({ isBarChart, logScale, statsData, isYearView }) {
    const themeColors = getChartThemeColors();
    const axisFont = { family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", size: 11 };

    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
            y: {
                type: logScale ? 'logarithmic' : 'linear',
                beginAtZero: !logScale,
                stacked: isBarChart,
                ticks: { color: themeColors.text, font: axisFont, maxTicksLimit: 8 },
                grid: { color: themeColors.grid },
                border: { display: false },
            },
            x: {
                stacked: isBarChart,
                ticks: { color: themeColors.text, font: axisFont, maxRotation: 45, autoSkipPadding: 12 },
                grid: { display: false },
            },
        },
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: themeColors.text, font: axisFont, boxWidth: isBarChart ? 10 : 18, boxHeight: isBarChart ? 10 : 2, padding: 12 },
            },
            tooltip: {
                itemSort: (a, b) => b.parsed.y - a.parsed.y,
                filter: (item) => Boolean(item.parsed.y),
                callbacks: {
                    title: (items) => getTooltipTitle(statsData[items[0]?.dataIndex], isYearView),
                },
            },
        },
    };
}

export function isLightTheme() {
    return document.body.classList.contains('theme-light');
}

export function getChartThemeColors() {
    const styles = getComputedStyle(document.body);
    return {
        text: styles.getPropertyValue('--chart-text-color').trim() || CONFIG.CHART_COLORS.TEXT,
        grid: styles.getPropertyValue('--chart-grid-color').trim() || CONFIG.CHART_COLORS.GRID,
    };
}
