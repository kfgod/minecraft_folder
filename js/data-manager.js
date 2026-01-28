/**
 * Data management utilities
 */
import { Utils } from './utils.js';
import { CONFIG } from './config.js';
import { SECTION_TYPES } from './section-config.js';

export class DataManager {
    // Content types supported by the application
    static CONTENT_TYPES = SECTION_TYPES;

    /**
     * Filter items based on search query and duplicate removal settings
     * @param {Array} items - Items to filter
     * @param {string} query - Search query
     * @param {boolean} removeDuplicates - Whether to remove duplicates
     * @returns {Array} Filtered items
     */
    static filterItems(items, query, removeDuplicates) {
        if (!items) return [];

        const parsed = this.parseSearchQuery(query);

        let filtered = items.filter((item) => {
            const displayName = (item.name || '').toLowerCase();
            const identifier = (item.identifier || '').toLowerCase();
            const types = Array.isArray(item.types) ? item.types.map((t) => String(t).toLowerCase()) : [];
            const tags = Array.isArray(item.tags) ? item.tags.map((t) => String(t).toLowerCase()) : [];
            const allTags = new Set([...types, ...tags]);

            const matchesText = parsed.text
                ? displayName.includes(parsed.text) || identifier.includes(parsed.text)
                : true;
            const matchesTags = parsed.tags.length
                ? parsed.tags.every((tag) => allTags.has(tag))
                : true;
            return matchesText && matchesTags;
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
     * Filter all content types for a given entry
     * @param {Object} entry
     * @param {string} query
     * @param {boolean} removeDuplicates
     * @returns {Object}
     */
    static filterAllContentTypes(entry, query, removeDuplicates) {
        const filteredAdded = {};
        this.CONTENT_TYPES.forEach((type) => {
            filteredAdded[type] = this.filterItems(entry.added?.[type], query, removeDuplicates);
        });
        return filteredAdded;
    }

    /**
     * Parse search query into text and tags
     * Supports tag search via #tag and mixed queries.
     * @param {string} query
     * @returns {{text: string, tags: string[]}}
     */
    static parseSearchQuery(query) {
        if (!query) return { text: '', tags: [] };
        const tokens = query.trim().toLowerCase().split(/\s+/);
        const tags = [];
        const textTokens = [];

        tokens.forEach((token) => {
            if (token.startsWith('#')) {
                const tag = token.slice(1).replace(/[^\w-]/g, '');
                if (tag) tags.push(tag);
            } else {
                textTokens.push(token);
            }
        });

        return { text: textTokens.join(' '), tags };
    }

    /**
     * Get most common names for suggestions
     * @param {Array} updates
     * @param {number} limit
     * @returns {Array<string>}
     */
    static getNameSuggestions(updates, limit = 80) {
        const counts = new Map();
        updates.forEach((update) => {
            this.CONTENT_TYPES.forEach((type) => {
                const items = update.added?.[type] || [];
                items.forEach((item) => {
                    if (!item?.name) return;
                    counts.set(item.name, (counts.get(item.name) || 0) + 1);
                });
            });
        });

        return [...counts.entries()]
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .slice(0, limit)
            .map(([name]) => name);
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
     * @param {boolean} showStructures - Whether to display structures
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
        showBiomes,
        showStructures
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
            biomes: showBiomes,
            structures: showStructures
        };

        // Apply filters to all content types
        const mapped = sourceData.map((entry) => ({
            ...entry,
            added: this.filterAllContentTypes(entry, query, removeDuplicates),
        }));

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
                update.added?.[type]?.map(item => item.name) || []
            )
        );

        return [...new Set(allNames)].sort((a, b) => a.length - b.length);
    }

    /**
     * Get all unique names by a concrete property ('name')
     * @param {Array} updates - Array of updates
     * @param {('name')} property - Property to extract
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
