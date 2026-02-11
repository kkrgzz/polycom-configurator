/**
 * Configurator Component
 * Manages server settings, main user selection, and assigned keys list
 */
import ConfigStore from '../state/ConfigStore.js';
import UserStore from '../state/UserStore.js';
import { createElement, clearElement, getElement } from '../utils/dom.js';

class Configurator {
    constructor(options) {
        this.serverIpInput = getElement(options.serverIpId || 'cfgServerIP');
        this.serverPortInput = getElement(options.serverPortId || 'cfgServerPort');
        this.mainUserSelect = getElement(options.mainUserSelectId || 'mainUserSelect');
        this.ownerDetails = getElement(options.ownerDetailsId || 'ownerDetails');
        this.ownerExtSpan = getElement('ownerExt');
        this.ownerPassSpan = getElement('ownerPass');
        this.assignedKeysList = getElement('assignedKeysList');
        this.keysEmpty = getElement('keysEmpty');

        // Subscribe to store changes
        UserStore.subscribe('users:changed', () => this.refreshMainUserDropdown());
        ConfigStore.subscribe('config:changed', () => this.updateDisplay());

        // Setup main user select handler
        if (this.mainUserSelect) {
            this.mainUserSelect.addEventListener('change', () => this.handleMainUserChange());
        }

        // Initial render
        this.refreshMainUserDropdown();
        this.updateDisplay();
    }

    /**
     * Refresh main user dropdown with available users
     */
    refreshMainUserDropdown() {
        if (!this.mainUserSelect) return;

        const currentValue = this.mainUserSelect.value;
        const users = UserStore.getUsers();

        clearElement(this.mainUserSelect);

        // Add empty option
        const emptyOption = createElement('option', { value: '' }, ['-- Select Owner --']);
        this.mainUserSelect.appendChild(emptyOption);

        // Add user options
        users.forEach(user => {
            const option = createElement('option', { value: user.id }, [
                `${user.name} (${user.ext})`
            ]);
            this.mainUserSelect.appendChild(option);
        });

        // Restore previous selection if still valid
        this.mainUserSelect.value = currentValue;
    }

    /**
     * Handle main user selection change
     */
    handleMainUserChange() {
        const userId = this.mainUserSelect.value;
        ConfigStore.setMainUser(userId ? parseInt(userId, 10) : null);
    }

    /**
     * Update display based on current configuration
     */
    updateDisplay() {
        const config = ConfigStore.getState();
        const users = UserStore.getUsers();

        this.updateOwnerDetails(config.mainUserId, users);
        this.renderAssignedKeysList(config.assignedKeys, users);
    }

    /**
     * Update owner details section
     * @param {number|null} mainUserId - Main user ID
     * @param {Array} users - All users
     */
    updateOwnerDetails(mainUserId, users) {
        if (!this.ownerDetails) return;

        if (mainUserId) {
            const user = users.find(u => u.id === mainUserId);
            if (user) {
                this.ownerDetails.classList.remove('d-none');
                if (this.ownerExtSpan) {
                    this.ownerExtSpan.textContent = user.ext;
                }
                if (this.ownerPassSpan) {
                    this.ownerPassSpan.textContent = user.password || '-';
                }
            }
        } else {
            this.ownerDetails.classList.add('d-none');
        }
    }

    /**
     * Render assigned keys list
     * @param {Array<number>} assignedKeys - Array of user IDs
     * @param {Array} users - All users
     */
    renderAssignedKeysList(assignedKeys, users) {
        if (!this.assignedKeysList) return;

        clearElement(this.assignedKeysList);

        if (assignedKeys.length === 0) {
            if (this.keysEmpty) {
                this.keysEmpty.style.display = 'block';
            }
            return;
        }

        if (this.keysEmpty) {
            this.keysEmpty.style.display = 'none';
        }

        assignedKeys.forEach(userId => {
            const user = users.find(u => u.id === userId);
            if (!user) return;

            const li = createElement('li', {
                class: 'list-group-item d-flex justify-content-between align-items-center',
                style: { cursor: 'move' }
            });

            const nameDiv = createElement('div');
            const gripIcon = createElement('i', {
                class: 'bi bi-grip-vertical text-muted me-2'
            });
            gripIcon.innerHTML = '';
            const nameText = document.createTextNode(user.name);

            nameDiv.appendChild(gripIcon);
            nameDiv.appendChild(nameText);

            const removeBtn = createElement('button', {
                class: 'btn btn-sm text-danger py-0',
                title: 'Remove key'
            }, ['×']);
            removeBtn.addEventListener('click', () => this.removeKey(userId));

            li.appendChild(nameDiv);
            li.appendChild(removeBtn);

            this.assignedKeysList.appendChild(li);
        });

        // Re-initialize Sortable.js after rendering
        this.initializeSortable();
    }

    /**
     * Initialize Sortable.js for drag-and-drop
     */
    initializeSortable() {
        if (!this.assignedKeysList || typeof Sortable === 'undefined') return;

        new Sortable(this.assignedKeysList, {
            animation: 150,
            ghostClass: 'bg-light',
            onEnd: (evt) => {
                const config = ConfigStore.getState();
                const newOrder = [...config.assignedKeys];
                const [moved] = newOrder.splice(evt.oldIndex, 1);
                newOrder.splice(evt.newIndex, 0, moved);
                ConfigStore.setAssignedKeys(newOrder);
            }
        });
    }

    /**
     * Remove key from assigned list
     * @param {number} userId - User ID to remove
     */
    removeKey(userId) {
        ConfigStore.removeAssignedKey(userId);
    }

    /**
     * Get server configuration
     * @returns {Object} Server config
     */
    getServerConfig() {
        const ntpServerInput = document.getElementById('cfgNtpServer');
        return {
            ip: this.serverIpInput?.value || '192.168.1.10',
            port: this.serverPortInput?.value || '5060',
            ntp_server: ntpServerInput?.value || 'pool.ntp.org'
        };
    }

    /**
     * Get phone settings configuration
     * @returns {Object} Phone settings config
     */
    getPhoneSettings() {
        const paginationSelect = document.getElementById('cfgPagination');
        const spontaneousCallsSelect = document.getElementById('cfgSpontaneousCalls');

        return {
            pagination: paginationSelect?.value || 'enabled',
            spontaneous_calls: spontaneousCallsSelect?.value || 'enabled'
        };
    }

    /**
     * Set server configuration
     * @param {Object} config - Server config object
     */
    setServerConfig(config) {
        if (this.serverIpInput && config.ip !== undefined) {
            this.serverIpInput.value = config.ip;
        }
        if (this.serverPortInput && config.port !== undefined) {
            this.serverPortInput.value = config.port;
        }
        const ntpServerInput = document.getElementById('cfgNtpServer');
        if (ntpServerInput && config.ntp_server !== undefined) {
            ntpServerInput.value = config.ntp_server;
        }
    }

    /**
     * Set phone settings configuration
     * @param {Object} settings - Phone settings object
     */
    setPhoneSettings(settings) {
        const paginationSelect = document.getElementById('cfgPagination');
        if (paginationSelect && settings.pagination !== undefined) {
            paginationSelect.value = settings.pagination;
        }

        const spontaneousCallsSelect = document.getElementById('cfgSpontaneousCalls');
        if (spontaneousCallsSelect && settings.spontaneous_calls !== undefined) {
            spontaneousCallsSelect.value = settings.spontaneous_calls;
        }
    }
}

export default Configurator;
