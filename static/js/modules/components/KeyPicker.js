/**
 * KeyPicker Component
 * Modal for selecting users to assign as BLF keys
 */
import ConfigStore from '../state/ConfigStore.js';
import UserStore from '../state/UserStore.js';
import { createElement, clearElement, getElement } from '../utils/dom.js';

class KeyPicker {
    constructor(modalId) {
        this.modalElement = getElement(modalId);

        if (!this.modalElement) {
            console.error(`KeyPicker modal element with ID "${modalId}" not found`);
            return;
        }

        this.modal = new bootstrap.Modal(this.modalElement);
        this.list = getElement('pickerList');
        this.selectAllCheckbox = getElement('selectAllKeysCheckbox');
        this.confirmButton = this.modalElement.querySelector('[data-action="confirm-add-keys"]') ||
                            this.modalElement.querySelector('.btn-primary');

        // Setup event handlers
        if (this.selectAllCheckbox) {
            this.selectAllCheckbox.addEventListener('click', () => this.toggleSelectAll());
        }

        if (this.confirmButton) {
            this.confirmButton.addEventListener('click', () => this.confirmAddKeys());
        }
    }

    /**
     * Open key picker modal
     */
    open() {
        const config = ConfigStore.getState();
        const users = UserStore.getUsers();

        if (!config.mainUserId) {
            alert('Please select a Phone Owner first.');
            return;
        }

        this.render(config, users);
        this.modal.show();
    }

    /**
     * Render available users list
     * @param {Object} config - Configuration state
     * @param {Array} users - All users
     */
    render(config, users) {
        if (!this.list) return;

        clearElement(this.list);

        // Filter: Users who are NOT the main user AND NOT already assigned
        const available = users.filter(u =>
            u.id !== config.mainUserId && !config.assignedKeys.includes(u.id)
        );

        if (available.length === 0) {
            const emptyMessage = createElement('div', {
                class: 'text-center text-muted p-4'
            }, ['No available users to add']);
            this.list.appendChild(emptyMessage);

            // Hide select all checkbox if no users
            if (this.selectAllCheckbox) {
                this.selectAllCheckbox.parentElement.style.display = 'none';
            }
            return;
        }

        // Show select all checkbox
        if (this.selectAllCheckbox) {
            this.selectAllCheckbox.parentElement.style.display = 'flex';
            this.selectAllCheckbox.checked = false;
            this.selectAllCheckbox.indeterminate = false;
        }

        available.forEach(user => {
            const label = createElement('label', { class: 'list-group-item' });

            const checkbox = createElement('input', {
                class: 'form-check-input me-2 key-checkbox',
                type: 'checkbox',
                value: user.id
            });
            checkbox.addEventListener('change', () => this.updateSelectAllState());

            const userName = createElement('span', {}, [user.name]);
            const userExt = createElement('span', {
                class: 'text-muted small'
            }, [` (${user.ext})`]);

            label.appendChild(checkbox);
            label.appendChild(userName);
            label.appendChild(userExt);

            this.list.appendChild(label);
        });
    }

    /**
     * Toggle select all checkboxes
     */
    toggleSelectAll() {
        if (!this.selectAllCheckbox) return;

        const keyCheckboxes = document.querySelectorAll('.key-checkbox');
        keyCheckboxes.forEach(checkbox => {
            checkbox.checked = this.selectAllCheckbox.checked;
        });
    }

    /**
     * Update select all checkbox state based on individual selections
     */
    updateSelectAllState() {
        if (!this.selectAllCheckbox) return;

        const keyCheckboxes = document.querySelectorAll('.key-checkbox');
        const checkedBoxes = document.querySelectorAll('.key-checkbox:checked');

        if (checkedBoxes.length === 0) {
            this.selectAllCheckbox.checked = false;
            this.selectAllCheckbox.indeterminate = false;
        } else if (checkedBoxes.length === keyCheckboxes.length) {
            this.selectAllCheckbox.checked = true;
            this.selectAllCheckbox.indeterminate = false;
        } else {
            this.selectAllCheckbox.checked = false;
            this.selectAllCheckbox.indeterminate = true;
        }
    }

    /**
     * Confirm and add selected keys
     */
    confirmAddKeys() {
        const checked = document.querySelectorAll('.key-checkbox:checked');
        const selectedIds = Array.from(checked).map(cb => parseInt(cb.value, 10));

        if (selectedIds.length > 0) {
            ConfigStore.addAssignedKeys(selectedIds);
        }

        this.modal.hide();
    }
}

export default KeyPicker;
