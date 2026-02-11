/**
 * UserTable Component
 * Manages user pool table display and interactions
 */
import UserStore from '../state/UserStore.js';
import { createElement, clearElement, getElement } from '../utils/dom.js';

class UserTable {
    constructor(options) {
        this.tbody = getElement(options.tbodyId);
        this.emptyState = getElement(options.emptyStateId);
        this.countDisplay = getElement(options.countId);
        this.selectAllCheckbox = getElement(options.selectAllCheckboxId || 'selectAllCheckbox');
        this.deleteSelectedBtn = getElement(options.deleteSelectedBtnId || 'deleteSelectedBtn');
        this.selectedCountSpan = getElement(options.selectedCountId || 'selectedCount');

        this.onEdit = options.onEdit;
        this.onDelete = options.onDelete;
        this.onDeleteSelected = options.onDeleteSelected;

        // Subscribe to store changes
        UserStore.subscribe('users:changed', () => this.render());

        // Setup select all checkbox handler
        if (this.selectAllCheckbox) {
            this.selectAllCheckbox.addEventListener('change', () => this.toggleSelectAll());
        }

        // Setup delete selected button handler
        if (this.deleteSelectedBtn) {
            this.deleteSelectedBtn.addEventListener('click', () => this.handleDeleteSelected());
        }

        // Initial render
        this.render();
    }

    /**
     * Render the table
     */
    render() {
        const users = UserStore.getUsers();

        if (!this.tbody) return;

        clearElement(this.tbody);

        if (users.length === 0) {
            this.emptyState?.classList.remove('d-none');
            if (this.countDisplay) {
                this.countDisplay.textContent = '0';
            }
            return;
        }

        this.emptyState?.classList.add('d-none');

        users.forEach(user => {
            const row = this.createRow(user);
            this.tbody.appendChild(row);
        });

        if (this.countDisplay) {
            this.countDisplay.textContent = users.length;
        }

        this.updateSelectedCount();
    }

    /**
     * Create a table row for a user
     * @param {Object} user - User data
     * @returns {HTMLElement} Table row element
     */
    createRow(user) {
        const tr = createElement('tr');

        // Checkbox cell
        const checkboxCell = createElement('td', { class: 'ps-4' });
        const checkbox = createElement('input', {
            type: 'checkbox',
            class: 'user-checkbox',
            value: user.id
        });
        checkbox.addEventListener('change', () => this.updateSelectedCount());
        checkboxCell.appendChild(checkbox);

        // Name cell
        const nameCell = createElement('td', { class: 'fw-bold' }, [user.name]);

        // Extension cell
        const extCell = createElement('td');
        const badge = createElement('span', {
            class: 'badge bg-light text-dark border'
        }, [user.ext]);
        extCell.appendChild(badge);

        // Password cell
        const passCell = createElement('td', { class: 'text-muted small' }, [user.password || '-']);

        // Label cell
        const labelCell = createElement('td', { class: 'text-muted small' }, [user.label || '-']);

        // Actions cell
        const actionsCell = createElement('td', { class: 'text-end pe-4' });

        const editBtn = createElement('button', {
            class: 'btn btn-sm text-primary me-1',
            title: 'Edit user'
        });
        editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
        editBtn.addEventListener('click', () => this.onEdit(user.id));

        const deleteBtn = createElement('button', {
            class: 'btn btn-sm text-danger',
            title: 'Delete user'
        });
        deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
        deleteBtn.addEventListener('click', () => this.onDelete(user.id));

        actionsCell.append(editBtn, deleteBtn);

        tr.append(checkboxCell, nameCell, extCell, passCell, labelCell, actionsCell);
        return tr;
    }

    /**
     * Toggle select all checkboxes
     */
    toggleSelectAll() {
        if (!this.selectAllCheckbox) return;

        const userCheckboxes = document.querySelectorAll('.user-checkbox');
        userCheckboxes.forEach(checkbox => {
            checkbox.checked = this.selectAllCheckbox.checked;
        });

        this.updateSelectedCount();
    }

    /**
     * Update selected count and select all checkbox state
     */
    updateSelectedCount() {
        const userCheckboxes = document.querySelectorAll('.user-checkbox');
        const checkedBoxes = document.querySelectorAll('.user-checkbox:checked');

        // Update select all checkbox state
        if (this.selectAllCheckbox) {
            if (checkedBoxes.length === 0) {
                this.selectAllCheckbox.checked = false;
                this.selectAllCheckbox.indeterminate = false;
            } else if (checkedBoxes.length === userCheckboxes.length) {
                this.selectAllCheckbox.checked = true;
                this.selectAllCheckbox.indeterminate = false;
            } else {
                this.selectAllCheckbox.checked = false;
                this.selectAllCheckbox.indeterminate = true;
            }
        }

        // Show/hide delete button
        if (this.deleteSelectedBtn) {
            if (checkedBoxes.length > 0) {
                this.deleteSelectedBtn.style.display = 'block';
                if (this.selectedCountSpan) {
                    this.selectedCountSpan.textContent = checkedBoxes.length;
                }
            } else {
                this.deleteSelectedBtn.style.display = 'none';
            }
        }
    }

    /**
     * Handle delete selected button click
     */
    handleDeleteSelected() {
        const checkedBoxes = document.querySelectorAll('.user-checkbox:checked');
        const idsToDelete = Array.from(checkedBoxes).map(cb => parseInt(cb.value, 10));

        if (idsToDelete.length > 0 && this.onDeleteSelected) {
            this.onDeleteSelected(idsToDelete);
        }
    }
}

export default UserTable;
