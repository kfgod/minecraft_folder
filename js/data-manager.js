/**
 * Data management utilities
 */
import { Utils } from './utils.js';
import { CONFIG } from './config.js';

export class DataManager {
    // Content types supported by the application
    static CONTENT_TYPES = [
        'blocks',
        'items',
        'mobs',
        'mob_variants',
        'effects',
        'enchantments',
        'advancements',
        'paintings',
        'biomes',
    ];

    /**
     * Filter items based on search query and duplicate removal settings
     * @param {Array} items - Items to filter
     * @param {string} query - Search query
     * @param {boolean} removeDuplicates - Whether to remove duplicates
     * @returns {Array} Filtered items
     */
    static filterItems(items, query, removeDuplicates) {
        if (!items) return [];

        let filtered = items.filter((item) => {
            const displayName = (item.display_name || item.name || '').toLowerCase();
            return displayName.includes(query.toLowerCase());
        });

        if (removeDuplicates) {
            filtered = filtered.filter((item) => {
                const types = Array.isArray(item.types) ? item.types : [];
                return !types.includes('hidden');
            });
        }

        return filtered;
    }

    /**
     * Create an empty content structure with all content types
     * @returns {Object} Empty content structure
     */
    static createEmptyContent() {
        return this.CONTENT_TYPES.reduce((acc, type) => {
            acc[type] = [];
            return acc;
        }, {});
    }

    /**
     * Group updates by year
     * @param {Array} updates - Array of updates
     * @returns {Array} Updates grouped by year
     */
    static groupByYear(updates) {
        const groupedByYear = updates.reduce((acc, data) => {
            const parsedDate = Utils.parseDate(data.release_date);
            const year = parsedDate ? parsedDate.getFullYear() : null;
            if (!year) return acc;

            if (!acc[year]) {
                acc[year] = {
                    name: `${year}`,
                    type: 'year',
                    added: this.createEmptyContent(),
                };
            }

            // Aggregate content from all updates in this year
            this.CONTENT_TYPES.forEach(type => {
                if (data.added?.[type]) {
                    acc[year].added[type].push(...data.added[type]);
                }
            });

            return acc;
        }, {});

        return Object.values(groupedByYear).sort((a, b) => b.name - a.name);
    }

    /**
     * Get filtered data based on current view and search query
     * @param {Array} allUpdates - All available updates
     * @param {string} currentView - Current view mode
     * @param {string} query - Search query
     * @param {boolean} removeDuplicates - Whether to remove duplicates
     * @param {boolean} showBlocks - Whether to display blocks
     * @param {boolean} showItems - Whether to display items
     * @param {boolean} showMobs - Whether to display mobs
     * @param {boolean} showMobVariants - Whether to display mob variants
     * @param {boolean} showEffects - Whether to display effects
     * @param {boolean} showEnchantments - Whether to display enchantments
     * @param {boolean} showAdvancements - Whether to display advancements
     * @param {boolean} showPaintings - Whether to display paintings
     * @param {boolean} showBiomes - Whether to display biomes
     * @returns {Array} Filtered data
     */
    static getFilteredData(
        allUpdates,
        currentView,
        query,
        removeDuplicates,
        showBlocks,
        showItems,
        showMobs,
        showMobVariants,
        showEffects,
        showEnchantments,
        showAdvancements,
        showPaintings,
        showBiomes
    ) {
        // Select data source based on view
        const sourceData = currentView === CONFIG.VIEWS.VERSIONS ? allUpdates : this.groupByYear(allUpdates);

        // Map visibility flags to content types
        const visibilityMap = {
            blocks: showBlocks,
            items: showItems,
            mobs: showMobs,
            mob_variants: showMobVariants,
            effects: showEffects,
            enchantments: showEnchantments,
            advancements: showAdvancements,
            paintings: showPaintings,
            biomes: showBiomes
        };

        // Apply filters to all content types
        const mapped = sourceData.map((entry) => {
            const filteredAdded = {};
            this.CONTENT_TYPES.forEach(type => {
                filteredAdded[type] = this.filterItems(entry.added?.[type], query, removeDuplicates);
            });

            return { ...entry, added: filteredAdded };
        });

        // Filter out entries that have no visible content
        return mapped.filter((entry) => {
            return this.CONTENT_TYPES.some(type => 
                visibilityMap[type] && entry.added[type].length > 0
            );
        });
    }

    /**
     * Get growth data by version
     * @param {Array} updates - Array of updates
     * @returns {Object} Chart data for versions
     */
    static getGrowthByVersion(updates) {
        const labels = [];
        const blockCounts = [];
        const itemCounts = [];
        const mobCounts = [];
        const effectCounts = [];
        let totalBlocks = 0;
        let totalItems = 0;
        let totalMobs = 0;
        let totalEffects = 0;

        updates.forEach((update) => {
            labels.push(update.release_version?.java || update.name);
            totalBlocks += update.added?.blocks?.length || 0;
            totalItems += update.added?.items?.length || 0;
            totalMobs += update.added?.mobs?.length || 0;
            totalEffects += update.added?.effects?.length || 0;
            blockCounts.push(totalBlocks);
            itemCounts.push(totalItems);
            mobCounts.push(totalMobs);
            effectCounts.push(totalEffects);
        });

        return { labels, blocks: blockCounts, items: itemCounts, mobs: mobCounts, effects: effectCounts };
    }

    /**
     * Get growth data by year
     * @param {Array} updates - Array of updates
     * @returns {Object} Chart data for years
     */
    static getGrowthByYear(updates) {
        const byYear = updates.reduce((acc, update) => {
            const parsedDate = Utils.parseDate(update.release_date);
            const year = parsedDate ? parsedDate.getFullYear() : null;
            if (!year) return acc;

            if (!acc[year]) acc[year] = { blocks: 0, items: 0, mobs: 0, effects: 0 };
            acc[year].blocks += update.added?.blocks?.length || 0;
            acc[year].items += update.added?.items?.length || 0;
            acc[year].mobs += update.added?.mobs?.length || 0;
            acc[year].effects += update.added?.effects?.length || 0;
            return acc;
        }, {});

        const labels = Object.keys(byYear).sort();
        const blockCounts = [];
        const itemCounts = [];
        const mobCounts = [];
        const effectCounts = [];
        let totalBlocks = 0;
        let totalItems = 0;
        let totalMobs = 0;
        let totalEffects = 0;

        labels.forEach((year) => {
            totalBlocks += byYear[year].blocks;
            totalItems += byYear[year].items;
            totalMobs += byYear[year].mobs;
            totalEffects += byYear[year].effects;
            blockCounts.push(totalBlocks);
            itemCounts.push(totalItems);
            mobCounts.push(totalMobs);
            effectCounts.push(totalEffects);
        });

        return { labels, blocks: blockCounts, items: itemCounts, mobs: mobCounts, effects: effectCounts };
    }

    /**
     * Get all unique names from updates
     * @param {Array} updates - Array of updates
     * @returns {Array} Array of unique names sorted by length
     */
    static getAllNames(updates) {
        const allNames = updates.flatMap((update) => 
            this.CONTENT_TYPES.flatMap(type => 
                update.added?.[type]?.map(item => item.display_name || item.name) || []
            )
        );

        return [...new Set(allNames)].sort((a, b) => a.length - b.length);
    }

    /**
     * Get all unique names by a concrete property ('name' or 'display_name')
     * @param {Array} updates - Array of updates
     * @param {('name'|'display_name')} property - Property to extract
     * @returns {Array} Array of unique names sorted by length
     */
    static getAllNamesByProperty(updates, property = 'name') {
        const get = (obj) => (obj && typeof obj[property] === 'string' ? obj[property] : '');
        const allNames = updates
            .flatMap((update) => 
                this.CONTENT_TYPES.flatMap(type => 
                    update.added?.[type]?.map(get) || []
                )
            )
            .filter(Boolean);

        return [...new Set(allNames)].sort((a, b) => a.length - b.length);
    }

    /**
     * Get content table data for versions view
     * @param {Array} updates - Array of updates
     * @returns {Array} Table data
     */
    static getVersionsTableData(updates) {
        return updates.map((update) => {
            const releaseDate = update.release_date;
            const parsed = Utils.parseDate(releaseDate);
            const isYearOnly = Utils.isYearOnly(releaseDate);
            return {
                name: update.name || 'N/A',
                version: update.release_version?.java || 'N/A',
                items: update.added?.items?.length || 0,
                blocks: update.added?.blocks?.length || 0,
                mobs: update.added?.mobs?.length || 0,
                effects: update.added?.effects?.length || 0,
                total:
                    (update.added?.items?.length || 0) +
                    (update.added?.blocks?.length || 0) +
                    (update.added?.mobs?.length || 0) +
                    (update.added?.effects?.length || 0),
                _release_date: releaseDate,
                _is_year_only: !!isYearOnly,
                _date_value: parsed ? parsed.getTime() : null,
            };
        });
    }

    /**
     * Get content table data for years view
     * @param {Array} updates - Array of updates
     * @returns {Array} Table data
     */
    static getYearsTableData(updates) {
        const byYear = updates.reduce((acc, update) => {
            const parsedDate = Utils.parseDate(update.release_date);
            const year = parsedDate ? parsedDate.getFullYear() : null;
            if (!year) return acc;

            // Initialize year entry with all content types
            if (!acc[year]) {
                acc[year] = this.CONTENT_TYPES.reduce((obj, type) => {
                    obj[type] = 0;
                    return obj;
                }, {});
            }

            // Aggregate counts for all content types
            this.CONTENT_TYPES.forEach(type => {
                acc[year][type] += update.added?.[type]?.length || 0;
            });

            return acc;
        }, {});

        return Object.keys(byYear).map((year) => {
            const yearData = byYear[year];
            const total = this.CONTENT_TYPES.reduce((sum, type) => sum + yearData[type], 0);
            return {
                year: parseInt(year),
                ...yearData,
                total
            };
        });
    }

    /**
     * Sort data by column and direction
     * @param {Array} data - Data to sort
     * @param {string} column - Column to sort by
     * @param {string} direction - Sort direction ('asc' or 'desc')
     * @returns {Array} Sorted data
     */
    static sortData(data, column, direction) {
        const dir = direction === 'asc' ? 1 : -1;
        return data.sort((a, b) => {
            let valA = a[column];
            let valB = b[column];

            // Special handling for 'name' to keep 'N/A' last
            if (column === 'name') {
                const aNa = valA === 'N/A' ? 1 : 0;
                const bNa = valB === 'N/A' ? 1 : 0;
                if (aNa !== bNa) return aNa - bNa; // 'N/A' always last
                return dir * String(valA).localeCompare(String(valB), undefined, { numeric: true });
            }

            // Special handling for 'version' using release_date semantics similar to index.js
            if (column === 'version') {
                // Emulate index.js logic: upcoming (null) first, then year-only, then exact dates
                const rank = (row) => {
                    if (row._release_date === null) return 0; // upcoming first
                    if (row._is_year_only) return 1;
                    return 2; // exact date
                };
                const rA = rank(a);
                const rB = rank(b);
                if (rA !== rB) return rA - rB; // group order fixed

                // Inside groups: by date. For exact dates, direction controls oldest/newest.
                const dA = a._date_value;
                const dB = b._date_value;
                if (dA === null && dB === null) return 0;
                if (dA === null) return -1;
                if (dB === null) return 1;

                // For year-only we sort by numeric year; for exact dates by timestamp
                return dir * (dA - dB);
            }

            // Default behavior
            const comparison =
                typeof valA === 'string'
                    ? String(valA).localeCompare(String(valB), undefined, { numeric: true })
                    : valA - valB;
            return dir * comparison;
        });
    }
}
