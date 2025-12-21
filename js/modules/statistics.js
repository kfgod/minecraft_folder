/**
 * Statistics module for rendering charts and tables
 */
import { Utils } from '../utils.js';
import { CONFIG } from '../config.js';
import { DOMManager } from '../dom-manager.js';

export class StatisticsManager {
    constructor(app) {
        this.app = app;
        this.state = {
            versionsStats: null,
            yearsStats: null,
            namesStats: null,
            chart: null,
            chartType: 'line',
            sortState: {
                column: 'total',
                direction: 'desc',
            },
            lastView: app.state.currentView,
        };
        this.elements = null;
    }

    async ensureData() {
        if (this.state.versionsStats) {
            return;
        }

        try {
            const [versionsStats, yearsStats, namesStats] = await Promise.all([
                Utils.fetchJSON(CONFIG.BASE_URL + '/data/statistics/by_versions.json'),
                Utils.fetchJSON(CONFIG.BASE_URL + '/data/statistics/by_years.json'),
                Utils.fetchJSON(CONFIG.BASE_URL + '/data/statistics/names.json'),
            ]);
            this.state.versionsStats = versionsStats;
            this.state.yearsStats = yearsStats;
            this.state.namesStats = namesStats;
        } catch (error) {
            throw new Error(`Failed to load statistics: ${error.message}`);
        }
    }

    destroyChart() {
        if (this.state.chart) {
            this.state.chart.destroy();
            this.state.chart = null;
        }
    }

    reset() {
        this.elements = null;
        this.destroyChart();
    }

    async render() {
        DOMManager.clearContainer(this.app.elements.navList);
        this.app.elements.content.innerHTML = '<p class="empty-state">Loading statistics...</p>';
        this.destroyChart();

        try {
            await this.ensureData();

            if (this.state.lastView !== this.app.state.currentView) {
                this.state.sortState = {
                    column: 'total',
                    direction: 'desc',
                };
                this.state.lastView = this.app.state.currentView;
            }

            const statsTemplate = this.buildTemplate();
            this.app.elements.content.innerHTML = statsTemplate;

            this.elements = {
                viewTitle: document.getElementById('stats-view-title'),
                chartCanvas: document.getElementById('stats-growth-chart'),
                longestTableBody: document.querySelector('#stats-longest-table tbody'),
                shortestTableBody: document.querySelector('#stats-shortest-table tbody'),
                tableTitle: document.getElementById('stats-content-title'),
                contentTableHead: document.querySelector('#stats-content-table thead'),
                contentTableBody: document.querySelector('#stats-content-table tbody'),
                chartTypeButtons: document.querySelectorAll('.chart-type-btn'),
            };

            // Add event listeners for chart type toggle
            if (this.elements.chartTypeButtons) {
                this.elements.chartTypeButtons.forEach((btn) => {
                    btn.addEventListener('click', () => {
                        const chartType = btn.dataset.chartType;
                        this.state.chartType = chartType;
                        this.elements.chartTypeButtons.forEach((b) => b.classList.remove('active'));
                        btn.classList.add('active');
                        const isYearView = this.app.state.currentView === CONFIG.VIEWS.YEARS;
                        this.renderChart(isYearView);
                    });
                });
            }

            this.updateDisplay();
        } catch (error) {
            console.error(error);
            this.app.elements.content.innerHTML = `<p class="empty-state">Unable to load statistics. ${error.message}</p>`;
        }
    }

    buildTemplate() {
        const heading = this.app.state.currentView === CONFIG.VIEWS.YEARS ? 'Growth by Year' : 'Growth by Version';
        const tableHeading = this.app.state.currentView === CONFIG.VIEWS.YEARS ? 'Content by Year' : 'Content by Version';

        return `
            <section class="statistics-view">
                <div class="statistics-card stats-chart-card">
                    <div class="stats-card-header">
                        <h2 id="stats-view-title">${heading}</h2>
                        <div class="chart-type-toggle">
                            <button type="button" class="chart-type-btn ${this.state.chartType === 'line' ? 'active' : ''}" data-chart-type="line">Line</button>
                            <button type="button" class="chart-type-btn ${this.state.chartType === 'bar' ? 'active' : ''}" data-chart-type="bar">Stacked Bar</button>
                            <button type="button" class="chart-type-btn ${this.state.chartType === 'bar-absolute' ? 'active' : ''}" data-chart-type="bar-absolute">Absolute Bar</button>
                        </div>
                    </div>
                    <div class="stats-chart-wrapper">
                        <canvas id="stats-growth-chart"></canvas>
                    </div>
                </div>

                <div class="stats-names-grid">
                    <div class="statistics-card">
                        <h3>Top 5 Longest Names</h3>
                        <table id="stats-longest-table">
                            <thead>
                                <tr><th>Name</th><th>Length</th></tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                    <div class="statistics-card">
                        <h3>Top 5 Shortest Names</h3>
                        <table id="stats-shortest-table">
                            <thead>
                                <tr><th>Name</th><th>Length</th></tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>

                <div class="statistics-card stats-table-card">
                    <div class="stats-card-header">
                        <h2 id="stats-content-title">${tableHeading}</h2>
                    </div>
                    <div class="stats-table-wrapper">
                        <table id="stats-content-table">
                            <thead></thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
            </section>
        `;
    }

    updateDisplay() {
        if (!this.elements) return;
        const isYearView = this.app.state.currentView === CONFIG.VIEWS.YEARS;

        const chartTitle = isYearView ? 'Growth by Year' : 'Growth by Version';
        const tableTitle = isYearView ? 'Content by Year' : 'Content by Version';

        if (this.elements.viewTitle) {
            this.elements.viewTitle.textContent = chartTitle;
        }

        if (this.elements.tableTitle) {
            this.elements.tableTitle.textContent = tableTitle;
        }

        this.renderChart(isYearView);
        this.renderNameTables();
        this.renderContentTable();
    }

    renderChart(isYearView) {
        const statsData = isYearView ? this.state.yearsStats : this.state.versionsStats;
        if (!statsData || !statsData.length) {
            this.destroyChart();
            return;
        }
        const labelKey = isYearView ? 'year' : 'version';
        const isAbsoluteBar = this.state.chartType === 'bar-absolute';
        const chartData = this.calculateChartData(statsData, labelKey, !isAbsoluteBar);

        if (!this.elements.chartCanvas || typeof Chart === 'undefined') {
            return;
        }

        const allDatasets = [
            {
                key: 'blocks',
                label: 'Blocks',
                data: chartData.blocks,
                borderColor: CONFIG.CHART_COLORS.BLOCKS,
                backgroundColor: CONFIG.CHART_COLORS.BLOCKS_BG,
                enabled: this.app.state.showBlocks,
            },
            {
                key: 'items',
                label: 'Items',
                data: chartData.items,
                borderColor: CONFIG.CHART_COLORS.ITEMS,
                backgroundColor: CONFIG.CHART_COLORS.ITEMS_BG,
                enabled: this.app.state.showItems,
            },
            {
                key: 'mobs',
                label: 'Mobs',
                data: chartData.mobs,
                borderColor: CONFIG.CHART_COLORS.MOBS,
                backgroundColor: CONFIG.CHART_COLORS.MOBS_BG,
                enabled: this.app.state.showMobs,
            },
            {
                key: 'effects',
                label: 'Effects',
                data: chartData.effects,
                borderColor: CONFIG.CHART_COLORS.EFFECTS,
                backgroundColor: CONFIG.CHART_COLORS.EFFECTS_BG,
                enabled: this.app.state.showEffects,
            },
            {
                key: 'biomes',
                label: 'Biomes',
                data: chartData.biomes,
                borderColor: '#4ade80',
                backgroundColor: 'rgba(74, 222, 128, 0.1)',
                enabled: this.app.state.showBiomes,
            },
            {
                key: 'enchantments',
                label: 'Enchantments',
                data: chartData.enchantments,
                borderColor: '#a78bfa',
                backgroundColor: 'rgba(167, 139, 250, 0.1)',
                enabled: this.app.state.showEnchantments,
            },
            {
                key: 'advancements',
                label: 'Advancements',
                data: chartData.advancements,
                borderColor: CONFIG.CHART_COLORS.ADVANCEMENTS,
                backgroundColor: CONFIG.CHART_COLORS.ADVANCEMENTS_BG,
                enabled: this.app.state.showAdvancements,
            },
        ];

        const isBarChart = this.state.chartType === 'bar' || this.state.chartType === 'bar-absolute';
        const filteredDatasets = allDatasets
            .filter((ds) => ds.enabled)
            .map((ds) => {
                let bgColor = ds.backgroundColor;
                if (isBarChart && bgColor.includes('rgba')) {
                    const rgbaMatch = bgColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
                    if (rgbaMatch) {
                        bgColor = `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, 0.7)`;
                    }
                }
                return {
                    label: ds.label,
                    data: ds.data,
                    borderColor: ds.borderColor,
                    backgroundColor: bgColor,
                    fill: isBarChart,
                    tension: isBarChart ? 0 : 0.1,
                };
            });

        const ctx = this.elements.chartCanvas.getContext('2d');
        this.destroyChart();
        
        const chartOptions = {
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

        this.state.chart = new Chart(ctx, {
            type: isBarChart ? 'bar' : 'line',
            data: {
                labels: chartData.labels,
                datasets: filteredDatasets,
            },
            options: chartOptions,
        });
    }

    calculateChartData(stats, labelKey, cumulative = true) {
        const labels = [];
        const blockCounts = [];
        const itemCounts = [];
        const mobCounts = [];
        const effectCounts = [];
        const biomeCounts = [];
        const enchantmentCounts = [];
        const advancementCounts = [];
        
        if (cumulative) {
            let totalBlocks = 0;
            let totalItems = 0;
            let totalMobs = 0;
            let totalEffects = 0;
            let totalBiomes = 0;
            let totalEnchantments = 0;
            let totalAdvancements = 0;

            stats.forEach((stat) => {
                labels.push(stat[labelKey]);
                totalBlocks += stat.counts.blocks;
                totalItems += stat.counts.items;
                totalMobs += stat.counts.mobs;
                totalEffects += stat.counts.effects;
                totalBiomes += stat.counts.biomes || 0;
                totalEnchantments += stat.counts.enchantments || 0;
                totalAdvancements += stat.counts.advancements || 0;
                blockCounts.push(totalBlocks);
                itemCounts.push(totalItems);
                mobCounts.push(totalMobs);
                effectCounts.push(totalEffects);
                biomeCounts.push(totalBiomes);
                enchantmentCounts.push(totalEnchantments);
                advancementCounts.push(totalAdvancements);
            });
        } else {
            stats.forEach((stat) => {
                labels.push(stat[labelKey]);
                blockCounts.push(stat.counts.blocks);
                itemCounts.push(stat.counts.items);
                mobCounts.push(stat.counts.mobs);
                effectCounts.push(stat.counts.effects);
                biomeCounts.push(stat.counts.biomes || 0);
                enchantmentCounts.push(stat.counts.enchantments || 0);
                advancementCounts.push(stat.counts.advancements || 0);
            });
        }

        return {
            labels,
            blocks: blockCounts,
            items: itemCounts,
            mobs: mobCounts,
            effects: effectCounts,
            biomes: biomeCounts,
            enchantments: enchantmentCounts,
            advancements: advancementCounts,
        };
    }

    renderNameTables() {
        if (!this.elements) return;
        const namesStats = this.state.namesStats;
        if (!namesStats) return;

        const renderRows = (container, data) => {
            DOMManager.clearContainer(container);
            data.forEach((name) => {
                const row = document.createElement('tr');
                const nameCell = document.createElement('td');
                const lengthCell = document.createElement('td');
                nameCell.textContent = name;
                lengthCell.textContent = name.length;
                row.appendChild(nameCell);
                row.appendChild(lengthCell);
                container.appendChild(row);
            });
        };

        if (this.elements.longestTableBody) {
            renderRows(this.elements.longestTableBody, namesStats.longest || []);
        }
        if (this.elements.shortestTableBody) {
            renderRows(this.elements.shortestTableBody, namesStats.shortest || []);
        }
    }

    renderContentTable() {
        if (!this.elements) return;
        const columns = this.getTableColumns();
        const data = this.getTableData();
        const sortedData = this.sortTableData(data);

        const thead = this.elements.contentTableHead;
        const tbody = this.elements.contentTableBody;

        if (!thead || !tbody) return;
        const isYearView = this.app.state.currentView === CONFIG.VIEWS.YEARS;

        thead.innerHTML = `<tr>${columns
            .map((col) => `<th data-sort="${col.key}">${col.label}</th>`)
            .join('')}</tr>`;

        thead.querySelectorAll('th').forEach((th) => {
            th.addEventListener('click', () => {
                this.handleTableSort(th.dataset.sort);
            });
        });

        DOMManager.clearContainer(tbody);
        sortedData.forEach((item) => {
            const row = tbody.insertRow();
            columns.forEach((col) => {
                const cell = row.insertCell();
                const value = item[col.key];
                const displayValue = value ?? 'N/A';

                if (!isYearView && (col.key === 'name' || col.key === 'version')) {
                    const detailId = item._detailId || this.getVersionDetailId(item);
                    if (detailId) {
                        cell.innerHTML = `<button type="button" class="detail-link" data-detail-type="version" data-detail-id="${detailId}">${displayValue}</button>`;
                    } else {
                        cell.textContent = displayValue;
                    }
                } else if (isYearView && col.key === 'year') {
                    const detailId = this.getYearDetailId(item.year);
                    cell.innerHTML = `<button type="button" class="detail-link" data-detail-type="year" data-detail-id="${detailId}">${displayValue}</button>`;
                } else {
                    cell.textContent = displayValue;
                }
            });
        });
    }

    getTableColumns() {
        const contentColumns = [
            { key: 'items', label: 'Items', enabled: this.app.state.showItems },
            { key: 'blocks', label: 'Blocks', enabled: this.app.state.showBlocks },
            { key: 'mobs', label: 'Mobs', enabled: this.app.state.showMobs },
            { key: 'effects', label: 'Effects', enabled: this.app.state.showEffects },
            { key: 'enchantments', label: 'Enchantments', enabled: this.app.state.showEnchantments },
            { key: 'advancements', label: 'Advancements', enabled: this.app.state.showAdvancements },
            { key: 'biomes', label: 'Biomes', enabled: this.app.state.showBiomes },
        ];

        const filteredContentColumns = contentColumns
            .filter((col) => col.enabled)
            .map((col) => ({ key: col.key, label: col.label }));

        if (this.app.state.currentView === CONFIG.VIEWS.YEARS) {
            return [
                { key: 'year', label: 'Year' },
                ...filteredContentColumns,
                { key: 'total', label: 'Total' },
            ];
        }

        return [
            { key: 'name', label: 'Name' },
            { key: 'version', label: 'Version' },
            ...filteredContentColumns,
            { key: 'total', label: 'Total' },
        ];
    }

    getTableData() {
        if (this.app.state.currentView === CONFIG.VIEWS.YEARS) {
            return this.state.yearsStats.map((stat) => ({
                year: stat.year,
                items: stat.counts.items,
                blocks: stat.counts.blocks,
                mobs: stat.counts.mobs,
                effects: stat.counts.effects,
                enchantments: stat.counts.enchantments || 0,
                advancements: stat.counts.advancements || 0,
                biomes: stat.counts.biomes || 0,
                total: stat.counts.total,
                _detailId: this.getYearDetailId(stat.year),
            }));
        }

        return this.state.versionsStats.map((stat, index) => ({
            name: stat.name || 'N/A',
            version: stat.version || 'N/A',
            items: stat.counts.items,
            blocks: stat.counts.blocks,
            mobs: stat.counts.mobs,
            effects: stat.counts.effects,
            enchantments: stat.counts.enchantments || 0,
            advancements: stat.counts.advancements || 0,
            biomes: stat.counts.biomes || 0,
            total: stat.counts.total,
            _original_index: index,
            _detailId: this.getVersionDetailId(stat),
        }));
    }

    sortTableData(data) {
        const sortState = this.state.sortState;
        const column = sortState.column;
        const direction = sortState.direction === 'asc' ? 1 : -1;

        if (!data.length || !(column in data[0])) {
            return data;
        }

        return data.slice().sort((a, b) => {
            let valA = a[column];
            let valB = b[column];

            if (column === 'name') {
                const aNa = valA === 'N/A' ? 1 : 0;
                const bNa = valB === 'N/A' ? 1 : 0;
                if (aNa !== bNa) return aNa - bNa;
                return direction * String(valA).localeCompare(String(valB), undefined, { numeric: true });
            }

            if (column === 'version') {
                return direction * ((a._original_index || 0) - (b._original_index || 0));
            }

            if (typeof valA === 'string' || typeof valB === 'string') {
                return direction * String(valA).localeCompare(String(valB), undefined, { numeric: true });
            }

            return direction * (valA - valB);
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
                this.app.state.allUpdates.find(
                    (update) =>
                        (update.release_version?.java || '').toLowerCase() === stat.version.toLowerCase()
                )) ||
            (stat.name &&
                this.app.state.allUpdates.find(
                    (update) => (update.name || '').toLowerCase() === stat.name.toLowerCase()
                ));
        return match ? Utils.generateCardId(match) : null;
    }

    getYearDetailId(yearValue) {
        if (!yearValue) return null;
        return Utils.generateCardId({ name: String(yearValue) });
    }
}

