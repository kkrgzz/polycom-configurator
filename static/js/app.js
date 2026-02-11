/**
 * Polycom Configurator - Main Application
 * Entry point for the modular application
 */

// Import stores
import UserStore from './modules/state/UserStore.js';
import ConfigStore from './modules/state/ConfigStore.js';

// Import services
import ApiService from './modules/services/ApiService.js';
import FileService from './modules/services/FileService.js';

// Import components
import UserTable from './modules/components/UserTable.js';
import UserModal from './modules/components/UserModal.js';
import PhonePreview from './modules/components/PhonePreview.js';
import KeyPicker from './modules/components/KeyPicker.js';
import Configurator from './modules/components/Configurator.js';

// Import utilities
import { startClock, renderButtons } from './modules/utils/ui.js';
import { getElement } from './modules/utils/dom.js';

/**
 * Main Application Class
 */
class App {
    constructor() {
        this.userModal = null;
        this.userTable = null;
        this.phonePreview = null;
        this.keyPicker = null;
        this.configurator = null;
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('Initializing Polycom Configurator...');

        // Load initial data
        this.loadDummyData();

        // Initialize components
        this.initializeComponents();

        // Setup global event handlers
        this.setupEventHandlers();

        // Start UI elements
        startClock();
        renderButtons();

        console.log('Application initialized successfully');
    }

    /**
     * Initialize all components
     */
    initializeComponents() {
        // User Modal
        this.userModal = new UserModal('userModal');

        // User Table
        this.userTable = new UserTable({
            tbodyId: 'userTableBody',
            emptyStateId: 'emptyState',
            countId: 'userCount',
            selectAllCheckboxId: 'selectAllCheckbox',
            deleteSelectedBtnId: 'deleteSelectedBtn',
            selectedCountId: 'selectedCount',
            onEdit: (id) => this.userModal.open('edit', id),
            onDelete: (id) => this.handleDeleteUser(id),
            onDeleteSelected: (ids) => this.handleDeleteSelected(ids)
        });

        // Phone Preview
        this.phonePreview = new PhonePreview({
            leftId: 'previewLeft',
            rightId: 'previewRight',
            headerLeftId: 'headerLeft',
            pageInfoId: 'pgInfo',
            pageDotsId: 'pgDots'
        });

        // Key Picker
        this.keyPicker = new KeyPicker('keyPickerModal');

        // Configurator
        this.configurator = new Configurator({
            serverIpId: 'cfgServerIP',
            serverPortId: 'cfgServerPort',
            mainUserSelectId: 'mainUserSelect',
            ownerDetailsId: 'ownerDetails'
        });
    }

    /**
     * Setup global event handlers
     */
    setupEventHandlers() {
        // Add user button (check both data-action and fallback to onclick)
        const addUserBtns = document.querySelectorAll('[data-action="add-user"], [onclick*="openModal"]');
        addUserBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.userModal.open('add');
            });
        });

        // Export pool button
        const exportBtns = document.querySelectorAll('[data-action="export-pool"], [onclick*="exportUsers"]');
        exportBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleExport();
            });
        });

        // Import pool file input
        const importInput = getElement('importFile');
        if (importInput) {
            importInput.addEventListener('change', (e) => this.handleImport(e));
        }

        // Add keys button
        const addKeysBtns = document.querySelectorAll('[data-action="add-keys"], [onclick*="openKeyPicker"]');
        addKeysBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.keyPicker.open();
            });
        });

        // Generate config button
        const generateBtns = document.querySelectorAll('[data-action="generate-config"], [onclick*="generateConfig"]');
        generateBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleGenerateConfig();
            });
        });

        // Tab refresh
        const configTab = document.getElementById('config-tab');
        if (configTab) {
            configTab.addEventListener('click', () => {
                this.configurator.refreshMainUserDropdown();
            });
        }
    }

    /**
     * Load dummy data if pool is empty
     */
    loadDummyData() {
        const users = UserStore.getUsers();
        if (users.length === 0) {
            const dummyUsers = [
                { name: "Reception", ext: "100", password: "123" },
                { name: "John Doe", ext: "101", password: "123" },
                { name: "Jane Smith", ext: "102", password: "123" },
                { name: "Meeting Room", ext: "103", password: "123" }
            ];

            dummyUsers.forEach(user => UserStore.addUser(user));
        }
    }

    /**
     * Handle single user deletion
     * @param {number} userId - User ID to delete
     */
    handleDeleteUser(userId) {
        if (!confirm('Delete this user?')) return;

        UserStore.deleteUser(userId);

        // Clean up references in config
        const config = ConfigStore.getState();
        if (config.mainUserId === userId) {
            ConfigStore.setMainUser(null);
            if (this.configurator.mainUserSelect) {
                this.configurator.mainUserSelect.value = '';
            }
        }
        ConfigStore.removeAssignedKey(userId);
    }

    /**
     * Handle bulk user deletion
     * @param {Array<number>} ids - Array of user IDs
     */
    handleDeleteSelected(ids) {
        const confirmMsg = `Delete ${ids.length} selected user(s)?`;
        if (!confirm(confirmMsg)) return;

        UserStore.deleteMany(ids);

        // Clean up references in config
        const config = ConfigStore.getState();
        if (ids.includes(config.mainUserId)) {
            ConfigStore.setMainUser(null);
            if (this.configurator.mainUserSelect) {
                this.configurator.mainUserSelect.value = '';
            }
        }

        ids.forEach(id => ConfigStore.removeAssignedKey(id));
    }

    /**
     * Handle pool export
     */
    async handleExport() {
        try {
            const users = UserStore.getUsers();
            if (users.length === 0) {
                alert('Pool is empty.');
                return;
            }

            const blob = await ApiService.exportPool(users);
            await FileService.downloadBlob(blob, 'user_pool.json');
        } catch (error) {
            console.error('Export error:', error);
            alert('Export failed: ' + error.message);
        }
    }

    /**
     * Handle pool import
     * @param {Event} event - Change event from file input
     */
    async handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const data = await FileService.readJsonFile(file);

            if (!Array.isArray(data)) {
                alert('Invalid JSON format. Expected an array of users.');
                return;
            }

            if (confirm('Replace current pool with imported data?')) {
                // Reset configuration
                ConfigStore.reset();

                // Replace users
                UserStore.setUsers(data);
            }
        } catch (error) {
            console.error('Import error:', error);
            alert('Import failed: ' + error.message);
        } finally {
            event.target.value = ''; // Reset file input
        }
    }

    /**
     * Handle config file generation
     */
    async handleGenerateConfig() {
        const config = ConfigStore.getState();

        if (!config.mainUserId) {
            alert('Select a Main User first.');
            return;
        }

        try {
            const users = UserStore.getUsers();
            const owner = users.find(u => u.id === config.mainUserId);

            if (!owner) {
                alert('Selected main user not found.');
                return;
            }

            // Get BLF users
            const blfList = config.assignedKeys
                .map(id => users.find(u => u.id === id))
                .filter(u => u); // Remove undefined entries

            // Build payload
            const payload = {
                server_config: this.configurator.getServerConfig(),
                user_config: owner,
                attendants: blfList,
                phone_settings: this.configurator.getPhoneSettings()
            };

            // Generate and download
            const blob = await ApiService.generateConfig(payload);
            await FileService.downloadBlob(blob, `${owner.ext}.cfg`);
        } catch (error) {
            console.error('Generation error:', error);
            alert('Generation failed: ' + error.message);
        }
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
