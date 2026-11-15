/**
 * Statistics module for rendering charts and tables
 */
import { Utils } from '../../utils.js';
import { CONFIG } from '../../config.js';
import { DOMManager } from '../../dom-manager.js';
import { renderStatusMessage } from '../../ui/status-view.js';
import { loadStatisticsBundle } from './data.js';
import { collectStatisticsElements, renderStatisticsView } from './view.js';
import { renderStatisticsChart } from './chart-renderer.js';
import { renderStatisticsNameTables } from './name-tables.js';
import { renderStatisticsContentTable } from './content-table.js';
import { attachStickyTableHeaders } from '../../ui/sticky-table-header.js';
import { STATISTICS_CLASSES } from './constants.js';
import { getChartStatsData } from './chart-renderer.js';
import { renderReleaseGapChart } from './chart-gaps.js';
import { getStatisticsSummary, getUpdateTypeSummary } from './insights.js';
import { renderStatisticsTiles, renderUpdateTypes } from './insights-view.js';

export class StatisticsManager {
    constructor(ctx) {
        this.ctx = ctx;
        this.state = {
            versionsStats: null,
            yearsStats: null,
            namesStats: null,
            chart: null,
            gapChart: null,
            chartType: 'line',
            logScale: false,
            sortState: {
                column: 'total',
                direction: 'desc',
            },
            lastView: ctx.state.currentView,
        };
        this.elements = null;
        this.detachStickyHeaders = null;
    }

    async ensureData() {
        if (this.state.versionsStats) {
            return;
        }

        Object.assign(this.state, await loadStatisticsBundle());
    }

    destroyChart() {
        if (this.state.chart) {
            this.state.chart.destroy();
            this.state.chart = null;
        }
    }

    destroyGapChart() {
        this.state.gapChart?.destroy();
        this.state.gapChart = null;
    }

    setChartPlaceholder(message, visible) {
        const placeholder = document.getElementById('stats-chart-placeholder');
        if (!placeholder) return;
        placeholder.textContent = message;
        if (visible) {
            placeholder.classList.add('is-visible');
        } else {
            placeholder.classList.remove('is-visible');
        }
    }

    reset() {
        this.elements = null;
        this.destroyChart();
        this.destroyGapChart();
        this.detachStickyHeaders?.();
        this.detachStickyHeaders = null;
    }

    async render() {
        DOMManager.clearContainer(this.ctx.elements.navList);
        renderStatusMessage(this.ctx.elements.content, 'Loading statistics...');
        this.destroyChart();

        try {
            await this.ensureData();

            if (this.state.lastView !== this.ctx.state.currentView) {
                this.state.sortState = {
                    column: 'total',
                    direction: 'desc',
                };
                this.state.lastView = this.ctx.state.currentView;
            }

            renderStatisticsView(this.ctx.elements.content, {
                isYearView: this.ctx.state.currentView === CONFIG.VIEWS.YEARS,
                chartType: this.state.chartType,
                logScale: this.state.logScale,
            });

            this.elements = collectStatisticsElements();

            // Add event listeners for chart type toggle
            if (this.elements.chartTypeButtons) {
                this.elements.chartTypeButtons.forEach((btn) => {
                    btn.addEventListener('click', () => {
                        const chartType = btn.dataset.chartType;
                        this.state.chartType = chartType;
                        this.elements.chartTypeButtons.forEach((b) => b.classList.remove('active'));
                        btn.classList.add('active');
                        if (this.elements.logToggle) this.elements.logToggle.hidden = chartType !== 'line';
                        const isYearView = this.ctx.state.currentView === CONFIG.VIEWS.YEARS;
                        void this.renderGrowthChart(isYearView);
                    });
                });
            }

            this.elements.logToggle?.querySelector('input').addEventListener('change', (event) => {
                this.state.logScale = event.target.checked;
                void this.renderGrowthChart(this.ctx.state.currentView === CONFIG.VIEWS.YEARS);
            });

            await this.updateDisplay();
            this.detachStickyHeaders?.();
            this.detachStickyHeaders = attachStickyTableHeaders(this.ctx.elements.content, `.${STATISTICS_CLASSES.TABLE_WRAPPER}`);
        } catch (error) {
            console.error(error);
            renderStatusMessage(this.ctx.elements.content, `Unable to load statistics. ${error.message}`, { error: true });
        }
    }

    async updateDisplay() {
        if (!this.elements) return;
        const isYearView = this.ctx.state.currentView === CONFIG.VIEWS.YEARS;

        const chartTitle = isYearView ? 'Growth by Year' : 'Growth by Version';
        const tableTitle = isYearView ? 'Content by Year' : 'Content by Version';
        if (this.elements.viewTitle) {
            this.elements.viewTitle.textContent = chartTitle;
        }

        if (this.elements.tableTitle) {
            this.elements.tableTitle.textContent = tableTitle;
        }

        const versions = getChartStatsData(this.state.versionsStats, false);
        renderStatisticsTiles(this.elements.tiles, getStatisticsSummary(versions, this.state.yearsStats));
        renderUpdateTypes(this.elements.updateTypes, getUpdateTypeSummary(versions, this.ctx.state.allUpdates));

        await this.renderChart(isYearView);
        this.renderNameTables();
        this.renderContentTable();
    }

    /** Both charts: also the entry point for repainting on a theme change. */
    async renderChart(isYearView) {
        await this.renderGrowthChart(isYearView);
        await renderReleaseGapChart({
            canvas: this.elements?.gapChartCanvas,
            versions: getChartStatsData(this.state.versionsStats, false),
            destroyChart: () => this.destroyGapChart(),
            setChart: (chart) => {
                this.state.gapChart = chart;
            },
        });
    }

    async renderGrowthChart(isYearView) {
        await renderStatisticsChart({
            elements: this.elements,
            statisticsState: this.state,
            appState: this.ctx.state,
            isYearView,
            destroyChart: () => this.destroyChart(),
            setChart: (chart) => {
                this.state.chart = chart;
            },
            setPlaceholder: (message, visible) => this.setChartPlaceholder(message, visible),
        });
    }

    renderNameTables() {
        renderStatisticsNameTables(this.elements, this.state.namesStats);
    }

    renderContentTable() {
        renderStatisticsContentTable({
            elements: this.elements,
            appState: this.ctx.state,
            statisticsState: this.state,
            getVersionDetailId: (stat) => this.getVersionDetailId(stat),
            getYearDetailId: (year) => this.getYearDetailId(year),
            onSort: (column) => this.handleTableSort(column),
        });
    }

    handleTableSort(column) {
        if (!column) return;
        const sortState = this.state.sortState;
        if (sortState.column === column) {
            sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
        } else {
            sortState.column = column;
            sortState.direction = 'desc';
        }
        this.renderContentTable();
    }

    getVersionDetailId(stat) {
        if (!stat) return null;
        const match =
            (stat.version &&
                this.ctx.state.allUpdates.find(
                    (update) =>
                        (update.release_version?.java || '').toLowerCase() === stat.version.toLowerCase()
                )) ||
            (stat.name &&
                this.ctx.state.allUpdates.find(
                    (update) => (update.name || '').toLowerCase() === stat.name.toLowerCase()
                ));
        return match ? Utils.generateCardId(match) : null;
    }

    getYearDetailId(yearValue) {
        if (!yearValue) return null;
        return Utils.generateCardId({ name: String(yearValue) });
    }
}
