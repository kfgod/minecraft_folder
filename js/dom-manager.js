/**
 * DOM management utilities
 */
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
     * Set element visibility by toggling inline display style.
     * When showing (visible=true) the inline style is cleared so the element's
     * CSS-defined display value takes effect (e.g. flex, inline-block, etc.).
     * @param {HTMLElement} element - Target element
     * @param {boolean} visible - Whether to show or hide
     */
    static setVisibility(element, visible) {
        if (!element) return;
        element.style.display = visible ? '' : 'none';
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

}
