/**
 * PhonePreview Component
 * Visual phone display with key layout and pagination
 */
import ConfigStore from '../state/ConfigStore.js';
import UserStore from '../state/UserStore.js';
import { createElement, clearElement, getElement } from '../utils/dom.js';

class PhonePreview {
    constructor(options) {
        this.previewLeft = getElement(options.leftId || 'previewLeft');
        this.previewRight = getElement(options.rightId || 'previewRight');
        this.headerLeft = getElement(options.headerLeftId || 'headerLeft');
        this.pageInfo = getElement(options.pageInfoId || 'pgInfo');
        this.pageDots = getElement(options.pageDotsId || 'pgDots');

        // Subscribe to store changes
        ConfigStore.subscribe('config:changed', () => this.render());
        UserStore.subscribe('users:changed', () => this.render());

        // Setup page navigation buttons
        document.querySelectorAll('[data-action="prev-page"]').forEach(btn => {
            btn.addEventListener('click', () => this.changePage(-1));
        });

        document.querySelectorAll('[data-action="next-page"]').forEach(btn => {
            btn.addEventListener('click', () => this.changePage(1));
        });

        this.render();
    }

    /**
     * Render complete phone preview
     */
    render() {
        const config = ConfigStore.getState();
        const users = UserStore.getUsers();
        const mainUser = users.find(u => u.id === config.mainUserId);

        this.renderHeader(mainUser);
        this.renderKeys(config, users, mainUser);
        this.renderPagination(config.currentPage);
    }

    /**
     * Render phone header with extension
     * @param {Object|undefined} mainUser - Main user object
     */
    renderHeader(mainUser) {
        if (!this.headerLeft) return;

        clearElement(this.headerLeft);
        const span = createElement('span', {}, [mainUser ? mainUser.ext : '--']);
        this.headerLeft.appendChild(span);
    }

    /**
     * Render phone keys
     * @param {Object} config - Configuration state
     * @param {Array} users - All users
     * @param {Object|undefined} mainUser - Main user object
     */
    renderKeys(config, users, mainUser) {
        if (!this.previewLeft || !this.previewRight) return;

        const slots = this.calculateSlots(config, users, mainUser);

        clearElement(this.previewLeft);
        clearElement(this.previewRight);

        // Render left column (first 6 keys)
        slots.slice(0, 6).forEach(slot => {
            this.previewLeft.appendChild(this.createKeyElement(slot, false));
        });

        // Render right column (next 6 keys)
        slots.slice(6, 12).forEach(slot => {
            this.previewRight.appendChild(this.createKeyElement(slot, true));
        });
    }

    /**
     * Calculate key slots for current page
     * @param {Object} config - Configuration state
     * @param {Array} users - All users
     * @param {Object|undefined} mainUser - Main user object
     * @returns {Array} Array of 12 slot objects
     */
    calculateSlots(config, users, mainUser) {
        const slots = [];

        // Page 1: Line key + 11 BLF keys
        // Pages 2-4: 12 BLF keys each
        if (config.currentPage === 1) {
            // Add line key
            if (mainUser) {
                slots.push({
                    label: mainUser.name,
                    type: 'line',
                    icon: 'bi-telephone-fill'
                });
            } else {
                slots.push({ label: 'No User', type: 'empty' });
            }
        }

        // Calculate BLF keys for this page
        const keysPerPage = config.currentPage === 1 ? 11 : 12;
        const startIndex = config.currentPage === 1
            ? 0
            : 11 + ((config.currentPage - 2) * 12);

        const pageKeys = config.assignedKeys.slice(startIndex, startIndex + keysPerPage);

        // Add BLF keys
        pageKeys.forEach(userId => {
            const user = users.find(u => u.id === userId);
            if (user) {
                slots.push({
                    label: user.name,
                    type: 'blf',
                    icon: 'bi-person-fill'
                });
            }
        });

        // Fill remaining slots with empty keys
        while (slots.length < 12) {
            slots.push({ label: '', type: 'empty' });
        }

        return slots;
    }

    /**
     * Create a key display element
     * @param {Object} slot - Slot data {label, type, icon}
     * @param {boolean} isRight - Whether this is a right-side key
     * @returns {HTMLElement} Key element
     */
    createKeyElement(slot, isRight) {
        const iconClasses = {
            'line': 'icon-green',
            'blf': 'icon-blue',
            'empty': 'icon-empty'
        };

        const dKey = createElement('div', {
            class: `d-key ${isRight ? 'right' : ''}`
        });

        const icon = createElement('div', {
            class: `key-icon ${iconClasses[slot.type]}`
        });

        if (slot.type !== 'empty' && slot.icon) {
            icon.innerHTML = `<i class="bi ${slot.icon}"></i>`;
        }

        const label = createElement('span', { class: 'text-truncate' }, [slot.label]);

        dKey.appendChild(icon);
        dKey.appendChild(label);

        return dKey;
    }

    /**
     * Render pagination indicators
     * @param {number} currentPage - Current page number
     */
    renderPagination(currentPage) {
        if (this.pageInfo) {
            this.pageInfo.textContent = `Page ${currentPage}`;
        }

        if (this.pageDots) {
            clearElement(this.pageDots);
            for (let i = 1; i <= 4; i++) {
                const dot = createElement('div', {
                    class: `pg-sq ${i === currentPage ? 'active' : ''}`
                });
                this.pageDots.appendChild(dot);
            }
        }
    }

    /**
     * Change page by delta
     * @param {number} delta - Page change (-1 or +1)
     */
    changePage(delta) {
        ConfigStore.changePage(delta);
    }
}

export default PhonePreview;
