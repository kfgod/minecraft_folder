/**
 * Utility functions for the Minecraft Updates application
 */
import { CONFIG } from './config.js';

export class Utils {
    /**
     * Build a full URL from a relative path using BASE_URL from config
     * @param {string} path - Relative path (e.g., 'data/file.json' or 'images/block.png')
     * @returns {string} Full URL or relative path if BASE_URL is empty
     */
    static buildUrl(path) {
        if (!path) return path;
        // If path is already a full URL (starts with http:// or https://), return as is
        if (/^https?:\/\//.test(path)) {
            return path;
        }
        // If BASE_URL is empty, return relative path
        if (!CONFIG.BASE_URL) {
            return path;
        }
        // Remove leading slash from path if present
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;
        // Remove trailing slash from BASE_URL if present
        const baseUrl = CONFIG.BASE_URL.endsWith('/') ? CONFIG.BASE_URL.slice(0, -1) : CONFIG.BASE_URL;
        return `${baseUrl}/${cleanPath}`;
    }

    /**
     * Fetch JSON data from a URL
     * @param {string} url - The URL to fetch from (can be relative or absolute)
     * @returns {Promise<Object>} The parsed JSON data
     */
    static async fetchJSON(url) {
        const fullUrl = this.buildUrl(url);
        const response = await fetch(fullUrl);
        if (!response.ok) {
            throw new Error(`Network error: ${response.statusText} for ${fullUrl}`);
        }
        return response.json();
    }

    /**
     * Generate a unique card ID from data
     * @param {Object} data - The data object
     * @returns {string} The generated card ID
     */
    static generateCardId(data) {
        const idString = data.display_name || data.name || data.release_version?.java || `year-${new Date().getTime()}`;
        const sanitized = idString.replace(/[^a-zA-Z0-9]/g, '-');
        
        // Ensure ID starts with a letter (CSS requirement)
        // If it starts with a digit, add 'id-' prefix
        if (/^\d/.test(sanitized)) {
            return `id-${sanitized}`;
        }
        
        return sanitized;
    }

    /**
     * Debounce function to limit the rate of function calls
     * @param {Function} func - The function to debounce
     * @param {number} wait - The delay in milliseconds
     * @returns {Function} The debounced function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Check if the current layout should be mobile
     * @param {number} availableSpace - Available space for navigation panel
     * @param {number} navPanelWidth - Width of navigation panel
     * @param {number} layoutGap - Gap between main content and nav panel
     * @returns {boolean} True if should be mobile layout
     */
    static shouldUseMobileLayout(availableSpace, navPanelWidth, layoutGap) {
        return availableSpace < navPanelWidth + layoutGap;
    }

    /**
     * Parse a date string, handling cases where only year is provided
     * @param {string} dateString - The date string to parse
     * @returns {Date} The parsed date object
     */
    static parseDate(dateString) {
        if (!dateString) return null;

        // If the string is only a year (4 digits), treat it as December 31st of that year
        // This ensures it sorts as the latest possible date for that year
        if (/^\d{4}$/.test(dateString.trim())) {
            return new Date(parseInt(dateString), 11, 31);
        }

        // Otherwise, try to parse as normal date
        const parsed = new Date(dateString);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    /**
     * Format a date for display, handling cases where only year is provided
     * @param {string} dateString - The date string to format
     * @returns {string} The formatted date string
     */
    static formatDateForDisplay(dateString) {
        if (!dateString) return 'upcoming';

        // If the string is only a year, return it as is
        if (/^\d{4}$/.test(dateString.trim())) {
            return dateString;
        }

        // Otherwise, return the original string
        return dateString;
    }

    /**
     * Check if a date string contains only a year
     * @param {string} dateString - The date string to check
     * @returns {boolean} True if the string contains only a year
     */
    static isYearOnly(dateString) {
        return dateString && /^\d{4}$/.test(dateString.trim());
    }
}
