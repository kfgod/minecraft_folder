import { ensureChartJs } from '../../cdn-loaders.js';
import { getChartThemeColors, isLightTheme } from './chart-renderer.js';
import { SERIES_COLORS } from './chart-series.js';
import { getMedian, getReleaseGaps } from './insights.js';

/** Dashed line at the median, labelled on the plot. */
const medianLinePlugin = {
    id: 'statsMedianLine',
    afterDatasetsDraw(chart, _args, options) {
        const { ctx, chartArea, scales } = chart;
        const y = scales.y.getPixelForValue(options.value);
        ctx.save();
        ctx.strokeStyle = options.color;
        ctx.fillStyle = options.color;
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(chartArea.left, y);
        ctx.lineTo(chartArea.right, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`Median ${options.value} days`, chartArea.right - 4, y - 5);
        ctx.restore();
    },
};

export async function renderReleaseGapChart({ canvas, versions, destroyChart, setChart }) {
    await ensureChartJs();
    const Chart = globalThis.Chart;
    destroyChart();
    const gaps = getReleaseGaps(versions);
    if (!canvas || typeof Chart === 'undefined' || !gaps.length) return;

    const theme = getChartThemeColors();
    const color = SERIES_COLORS.blue[isLightTheme() ? 'light' : 'dark'];
    setChart(new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: gaps.map((gap) => gap.version),
            datasets: [{
                data: gaps.map((gap) => gap.days),
                backgroundColor: color,
                borderRadius: 2,
                borderSkipped: 'bottom',
                categoryPercentage: 0.9,
                barPercentage: 0.9,
            }],
        },
        plugins: [medianLinePlugin],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Days', color: theme.text },
                    ticks: { color: theme.text, maxTicksLimit: 6 },
                    grid: { color: theme.grid },
                    border: { display: false },
                },
                x: {
                    ticks: { color: theme.text, maxRotation: 45, autoSkipPadding: 12 },
                    grid: { display: false },
                },
            },
            plugins: {
                legend: { display: false },
                statsMedianLine: { value: getMedian(gaps.map((gap) => gap.days)), color: theme.text },
                tooltip: {
                    displayColors: false,
                    callbacks: {
                        title: (items) => {
                            const gap = gaps[items[0].dataIndex];
                            return `${gap.previous} → ${gap.version}`;
                        },
                        label: (item) => `${item.parsed.y} days`,
                    },
                },
            },
        },
    }));
}
