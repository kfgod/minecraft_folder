/**
 * Utility functions for the Minecraft Updates application
 */
import { CONFIG } from './config.js';

const MONTHS = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
];

export class Utils {
    /**
     * Fetch JSON data from a URL
     * @param {string} url - The URL to fetch from
     * @returns {Promise<Object>} The parsed JSON data
     */
    static async fetchJSON(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Network error: ${response.statusText} for ${url}`);
        }
        return response.json();
    }

    /**
     * Generate a unique card ID from data
     * @param {Object} data - The data object
     * @returns {string} The generated card ID
     */
    static generateCardId(data) {
        const idString = data.name || data.release_version?.java || 'entry-unknown';
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

        // ISO dates (YYYY-MM-DD) as local midnight, consistent with every other format;
        // new Date('YYYY-MM-DD') would be UTC and can shift the day/year west of Greenwich
        const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString.trim());
        if (iso) {
            return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
        }

        // "June 7, 2023" — the format used by the data files; parsed explicitly
        // because non-ISO strings in the Date constructor are engine-dependent
        const long = /^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/.exec(dateString.trim());
        if (long) {
            const month = MONTHS.indexOf(long[1].toLowerCase());
            if (month !== -1) {
                return new Date(Number(long[3]), month, Number(long[2]));
            }
        }

        const parsed = new Date(dateString);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    /**
     * Format a date for display, handling cases where only year is provided
     * @param {string} dateString - The date string to format
     * @returns {string} The formatted date string
     */
    static formatDateForDisplay(dateString) {
        return dateString || 'upcoming';
    }

    /**
     * Check if a date string contains only a year
     * @param {string} dateString - The date string to check
     * @returns {boolean} True if the string contains only a year
     */
    static isYearOnly(dateString) {
        return dateString && /^\d{4}$/.test(dateString.trim());
    }

    /**
     * Escape HTML for safe rendering
     * @param {string} value
     * @returns {string}
     */
    static escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Set an <img> source, falling back to the missing texture when the path
     * is empty or the file fails to load
     * @param {HTMLImageElement} image
     * @param {string | null} src
     */
    static setImageWithFallback(image, src) {
        image.addEventListener('error', function useMissingTexture() {
            image.removeEventListener('error', useMissingTexture);
            image.src = CONFIG.MISSING_TEXTURE;
        });
        image.src = src || CONFIG.MISSING_TEXTURE;
    }

    /**
     * Resolve image path with placeholder fallback
     * @param {Object} item
     * @returns {string}
     */
    static resolveImagePath(item) {
        if (!item) return null;
        if (item.imagePath) return CONFIG.IMAGE_BASE_PATH + item.imagePath;
        return null;
    }
}
