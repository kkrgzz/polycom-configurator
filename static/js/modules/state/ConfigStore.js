/**
 * ConfigStore - State management for phone configuration
 * Manages main user, assigned keys, and pagination
 */
class ConfigStore {
    constructor() {
        this.state = {
            mainUserId: null,
            assignedKeys: [], // Array of user IDs
            currentPage: 1
        };
        this.listeners = new Map();
    }

    /**
     * Subscribe to state changes
     * @param {string} event - Event name (e.g., 'config:changed')
     * @param {Function} callback - Callback function
     */
    subscribe(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * Emit event to all subscribers
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        const callbacks = this.listeners.get(event) || [];
        callbacks.forEach(cb => cb(data));
    }

    /**
     * Get complete configuration state
     * @returns {Object} Configuration state
     */
    getState() {
        return {
            mainUserId: this.state.mainUserId,
            assignedKeys: [...this.state.assignedKeys],
            currentPage: this.state.currentPage
        };
    }

    /**
     * Set main user (phone owner)
     * @param {number|null} userId - User ID or null
     */
    setMainUser(userId) {
        this.state.mainUserId = userId;

        // Remove main user from assigned keys if present
        if (userId !== null) {
            this.state.assignedKeys = this.state.assignedKeys.filter(id => id !== userId);
        }

        this.emit('config:changed', this.getState());
    }

    /**
     * Get main user ID
     * @returns {number|null} Main user ID
     */
    getMainUserId() {
        return this.state.mainUserId;
    }

    /**
     * Add key to assigned keys
     * @param {number} userId - User ID to add
     */
    addAssignedKey(userId) {
        // Don't add if it's the main user or already assigned
        if (userId === this.state.mainUserId || this.state.assignedKeys.includes(userId)) {
            return;
        }

        this.state.assignedKeys.push(userId);
        this.emit('config:changed', this.getState());
    }

    /**
     * Add multiple keys at once
     * @param {Array<number>} userIds - Array of user IDs
     */
    addAssignedKeys(userIds) {
        userIds.forEach(id => {
            if (id !== this.state.mainUserId && !this.state.assignedKeys.includes(id)) {
                this.state.assignedKeys.push(id);
            }
        });
        this.emit('config:changed', this.getState());
    }

    /**
     * Remove key from assigned keys
     * @param {number} userId - User ID to remove
     */
    removeAssignedKey(userId) {
        this.state.assignedKeys = this.state.assignedKeys.filter(id => id !== userId);
        this.emit('config:changed', this.getState());
    }

    /**
     * Get assigned keys
     * @returns {Array<number>} Array of user IDs
     */
    getAssignedKeys() {
        return [...this.state.assignedKeys];
    }

    /**
     * Set assigned keys (for drag-drop reordering)
     * @param {Array<number>} keys - New order of user IDs
     */
    setAssignedKeys(keys) {
        this.state.assignedKeys = [...keys];
        this.emit('config:changed', this.getState());
    }

    /**
     * Set current page
     * @param {number} page - Page number (1-4)
     */
    setPage(page) {
        if (page < 1) page = 1;
        if (page > 4) page = 4;
        this.state.currentPage = page;
        this.emit('config:changed', this.getState());
    }

    /**
     * Get current page
     * @returns {number} Current page number
     */
    getCurrentPage() {
        return this.state.currentPage;
    }

    /**
     * Change page by delta
     * @param {number} delta - Page change (-1 or +1)
     */
    changePage(delta) {
        this.setPage(this.state.currentPage + delta);
    }

    /**
     * Reset configuration to defaults
     */
    reset() {
        this.state.mainUserId = null;
        this.state.assignedKeys = [];
        this.state.currentPage = 1;
        this.emit('config:changed', this.getState());
    }
}

// Export singleton instance
export default new ConfigStore();
