/**
 * DOM management utilities
 */
import { CONFIG } from './config.js';

export class DOMManager {
    /**
     * Get DOM element by selector
     * @param {string} selector - CSS selector
     * @returns {HTMLElement|null} The element or null if not found
     */
    static getElement(selector) {
        return document.querySelector(selector);
    }

    /**
     * Get all DOM elements by selector
     * @param {string} selector - CSS selector
     * @returns {NodeList} List of elements
     */
    static getElements(selector) {
        return document.querySelectorAll(selector);
    }

    /**
     * Create a new element with optional attributes and content
     * @param {string} tagName - HTML tag name
     * @param {Object} attributes - Element attributes
     * @param {string} content - Element content
     * @returns {HTMLElement} The created element
     */
    static createElement(tagName, attributes = {}, content = '') {
        const element = document.createElement(tagName);

        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else {
                element.setAttribute(key, value);
            }
        });

        if (content) {
            element.textContent = content;
        }

        return element;
    }

    /**
     * Create a document fragment with elements
     * @param {Array} elements - Array of elements to add to fragment
     * @returns {DocumentFragment} The fragment with elements
     */
    static createFragment(elements) {
        const fragment = new DocumentFragment();
        elements.forEach((element) => fragment.appendChild(element));
        return fragment;
    }

    /**
     * Add event listener with optional debouncing
     * @param {HTMLElement} element - Target element
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {number} debounceDelay - Debounce delay in ms
     */
    static addEventListener(element, event, handler, debounceDelay = 0) {
        if (debounceDelay > 0) {
            const debouncedHandler = this.debounce(handler, debounceDelay);
            element.addEventListener(event, debouncedHandler);
        } else {
            element.addEventListener(event, handler);
        }
    }

    /**
     * Remove all child elements from a container
     * @param {HTMLElement} container - Container element
     */
    static clearContainer(container) {
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    }

    /**
     * Toggle CSS class on element
     * @param {HTMLElement} element - Target element
     * @param {string} className - Class name to toggle
     * @param {boolean} force - Force add/remove
     */
    static toggleClass(element, className, force) {
        element.classList.toggle(className, force);
    }

    /**
     * Add CSS class to element
     * @param {HTMLElement} element - Target element
     * @param {string} className - Class name to add
     */
    static addClass(element, className) {
        element.classList.add(className);
    }

    /**
     * Remove CSS class from element
     * @param {HTMLElement} element - Target element
     * @param {string} className - Class name to remove
     */
    static removeClass(element, className) {
        element.classList.remove(className);
    }

    /**
     * Check if element has CSS class
     * @param {HTMLElement} element - Target element
     * @param {string} className - Class name to check
     * @returns {boolean} True if element has the class
     */
    static hasClass(element, className) {
        return element.classList.contains(className);
    }

    /**
     * Set element visibility
     * @param {HTMLElement} element - Target element
     * @param {boolean} visible - Whether to show or hide
     */
    static setVisibility(element, visible) {
        element.style.display = visible ? 'block' : 'none';
    }

    /**
     * Set element attribute
     * @param {HTMLElement} element - Target element
     * @param {string} attribute - Attribute name
     * @param {string} value - Attribute value
     */
    static setAttribute(element, attribute, value) {
        element.setAttribute(attribute, value);
    }

    /**
     * Get element attribute
     * @param {HTMLElement} element - Target element
     * @param {string} attribute - Attribute name
     * @returns {string|null} Attribute value or null
     */
    static getAttribute(element, attribute) {
        return element.getAttribute(attribute);
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
     * Get element's bounding rectangle
     * @param {HTMLElement} element - Target element
     * @returns {DOMRect} Element's bounding rectangle
     */
    static getBoundingRect(element) {
        return element.getBoundingClientRect();
    }

    /**
     * Scroll element into view
     * @param {HTMLElement} element - Target element
     * @param {Object} options - Scroll options
     */
    static scrollIntoView(element, options = {}) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            ...options,
        });
    }

    /**
     * Show tooltip at element position with smart positioning
     * Automatically positions tooltip above or below target based on available space
     * @param {HTMLElement} tooltip - Tooltip element to show
     * @param {HTMLElement} target - Target element to position tooltip near
     * @param {string} text - Tooltip text (can include health data in format "name|health:value")
     */
    static showTooltip(tooltip, target, text) {
        if (!tooltip || !target || !text) return;

        // Parse tooltip text for health information (special format for mobs)
        if (text.includes('|health:')) {
            const [name, healthPart] = text.split('|health:');
            const healthValue = healthPart;
            tooltip.innerHTML = `${name}<br><span class="tooltip-health-text"><img src="static/images/icons/health_icon.png" alt="Health" class="tooltip-health-icon">×${healthValue}</span>`;
        } else {
            tooltip.textContent = text;
        }
        tooltip.style.display = 'block';

        // Get element positions
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        // Calculate horizontal position (centered above/below target)
        let left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;

        // Keep tooltip within viewport horizontally
        const padding = 10;
        if (left < padding) {
            left = padding;
        } else if (left + tooltipRect.width > window.innerWidth - padding) {
            left = window.innerWidth - tooltipRect.width - padding;
        }

        // Calculate vertical position (prefer above target)
        let top = targetRect.top - tooltipRect.height - 8;

        // If tooltip would go above viewport, show it below target instead
        if (top < padding) {
            top = targetRect.bottom + 8;
            tooltip.classList.add('tooltip-below');
        } else {
            tooltip.classList.remove('tooltip-below');
        }

        // Apply calculated position
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        tooltip.classList.add('visible');
    }

    /**
     * Hide tooltip
     * @param {HTMLElement} tooltip - Tooltip element
     */
    static hideTooltip(tooltip) {
        if (!tooltip) return;
        tooltip.classList.remove('visible', 'tooltip-below');
        tooltip.style.display = 'none';
    }
}
