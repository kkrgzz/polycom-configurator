/**
 * DOM Utility Functions
 * Helper functions for creating and manipulating DOM elements
 */

/**
 * Create a DOM element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} attributes - Element attributes
 * @param {Array} children - Child elements or text
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);

    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'class' || key === 'className') {
            element.className = value;
        } else if (key.startsWith('data-')) {
            element.setAttribute(key, value);
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key in element) {
            element[key] = value;
        } else {
            element.setAttribute(key, value);
        }
    });

    // Add children
    if (!Array.isArray(children)) {
        children = [children];
    }

    children.forEach(child => {
        if (child === null || child === undefined) {
            return;
        }
        if (typeof child === 'string' || typeof child === 'number') {
            element.appendChild(document.createTextNode(String(child)));
        } else if (child instanceof HTMLElement) {
            element.appendChild(child);
        }
    });

    return element;
}

/**
 * Remove all children from an element
 * @param {HTMLElement} element - Element to clear
 */
export function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * Toggle class based on condition
 * @param {HTMLElement} element - Target element
 * @param {string} className - Class name to toggle
 * @param {boolean} condition - Whether to add or remove class
 */
export function toggleClass(element, className, condition) {
    if (condition) {
        element.classList.add(className);
    } else {
        element.classList.remove(className);
    }
}

/**
 * Show element by removing d-none class
 * @param {HTMLElement} element - Element to show
 */
export function show(element) {
    element.classList.remove('d-none');
}

/**
 * Hide element by adding d-none class
 * @param {HTMLElement} element - Element to hide
 */
export function hide(element) {
    element.classList.add('d-none');
}

/**
 * Set element visibility based on condition
 * @param {HTMLElement} element - Target element
 * @param {boolean} visible - Whether element should be visible
 */
export function setVisible(element, visible) {
    toggleClass(element, 'd-none', !visible);
}

/**
 * Get element by ID with error handling
 * @param {string} id - Element ID
 * @returns {HTMLElement|null} Element or null
 */
export function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with ID "${id}" not found`);
    }
    return element;
}

/**
 * Safely query selector
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element (default: document)
 * @returns {HTMLElement|null} First matching element or null
 */
export function query(selector, parent = document) {
    return parent.querySelector(selector);
}

/**
 * Safely query selector all
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element (default: document)
 * @returns {Array<HTMLElement>} Array of matching elements
 */
export function queryAll(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
}
