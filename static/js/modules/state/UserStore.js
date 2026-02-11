/**
 * UserStore - State management for user pool
 * Implements observer pattern for reactive updates
 */
class UserStore {
    constructor() {
        this.state = {
            users: [],
            selectedIds: new Set()
        };
        this.listeners = new Map();
    }

    /**
     * Subscribe to state changes
     * @param {string} event - Event name (e.g., 'users:changed')
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
     * Get all users
     * @returns {Array} Copy of users array
     */
    getUsers() {
        return [...this.state.users];
    }

    /**
     * Get user by ID
     * @param {number} id - User ID
     * @returns {Object|undefined} User object or undefined
     */
    getUserById(id) {
        return this.state.users.find(u => u.id === id);
    }

    /**
     * Add new user
     * @param {Object} user - User data (name, ext, password, label)
     * @returns {Object} Newly created user with ID
     */
    addUser(user) {
        const newId = this.generateId();
        const newUser = { id: newId, ...user };
        this.state.users.push(newUser);
        this.emit('users:changed', this.getUsers());
        return newUser;
    }

    /**
     * Update existing user
     * @param {number} id - User ID
     * @param {Object} updates - Fields to update
     */
    updateUser(id, updates) {
        const index = this.state.users.findIndex(u => u.id === id);
        if (index !== -1) {
            this.state.users[index] = {
                ...this.state.users[index],
                ...updates,
                id // Ensure ID doesn't change
            };
            this.emit('users:changed', this.getUsers());
        }
    }

    /**
     * Delete single user
     * @param {number} id - User ID
     */
    deleteUser(id) {
        this.state.users = this.state.users.filter(u => u.id !== id);
        this.emit('users:changed', this.getUsers());
    }

    /**
     * Delete multiple users
     * @param {Array<number>} ids - Array of user IDs
     */
    deleteMany(ids) {
        this.state.users = this.state.users.filter(u => !ids.includes(u.id));
        this.emit('users:changed', this.getUsers());
    }

    /**
     * Replace all users (for import)
     * @param {Array} users - New users array
     */
    setUsers(users) {
        this.state.users = users.map((user, index) => ({
            ...user,
            id: user.id || index + 1
        }));
        this.emit('users:changed', this.getUsers());
    }

    /**
     * Generate new unique ID
     * @returns {number} New ID
     */
    generateId() {
        return this.state.users.length > 0
            ? Math.max(...this.state.users.map(u => u.id)) + 1
            : 1;
    }

    /**
     * Get selected user IDs
     * @returns {Array<number>} Array of selected IDs
     */
    getSelectedIds() {
        return Array.from(this.state.selectedIds);
    }

    /**
     * Set selected user IDs
     * @param {Array<number>} ids - Array of user IDs
     */
    setSelectedIds(ids) {
        this.state.selectedIds = new Set(ids);
        this.emit('selection:changed', this.getSelectedIds());
    }

    /**
     * Clear all selected IDs
     */
    clearSelection() {
        this.state.selectedIds.clear();
        this.emit('selection:changed', this.getSelectedIds());
    }
}

// Export singleton instance
export default new UserStore();
