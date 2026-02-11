/**
 * UserModal Component
 * Manages add/edit user modal dialog
 */
import UserStore from '../state/UserStore.js';
import { validateUser, ValidationError } from '../utils/validators.js';
import { getElement } from '../utils/dom.js';

class UserModal {
    constructor(modalId) {
        this.modalElement = getElement(modalId);

        if (!this.modalElement) {
            console.error(`Modal element with ID "${modalId}" not found`);
            return;
        }

        // Initialize Bootstrap modal
        this.modal = new bootstrap.Modal(this.modalElement);

        // Get form elements
        this.form = getElement('userForm');
        this.userIdInput = getElement('userId');
        this.nameInput = getElement('userName');
        this.extInput = getElement('userExt');
        this.passInput = getElement('userPass');
        this.labelInput = getElement('userLabel');
        this.titleElement = getElement('modalTitle');

        // Find save button
        this.saveButton = this.modalElement.querySelector('[data-action="save-user"]') ||
                         this.modalElement.querySelector('.btn-primary');

        if (this.saveButton) {
            this.saveButton.addEventListener('click', () => this.save());
        }

        // Handle Enter key in form
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.save();
            });
        }
    }

    /**
     * Open modal for add or edit
     * @param {string} mode - 'add' or 'edit'
     * @param {number|null} userId - User ID for edit mode
     */
    open(mode = 'add', userId = null) {
        // Clear any previous validation errors
        this.clearValidationErrors();

        // Reset form
        if (this.form) {
            this.form.reset();
        }

        if (mode === 'edit' && userId !== null) {
            const user = UserStore.getUserById(userId);
            if (user) {
                this.userIdInput.value = user.id;
                this.nameInput.value = user.name;
                this.extInput.value = user.ext;
                this.passInput.value = user.password || '';
                this.labelInput.value = user.label || '';
                if (this.titleElement) {
                    this.titleElement.textContent = 'Edit User';
                }
            }
        } else {
            this.userIdInput.value = '';
            if (this.titleElement) {
                this.titleElement.textContent = 'Add New User';
            }
        }

        this.modal.show();
    }

    /**
     * Save user (add or update)
     */
    save() {
        // Clear previous errors
        this.clearValidationErrors();

        // Collect form data
        const userData = {
            name: this.nameInput.value.trim(),
            ext: this.extInput.value.trim(),
            password: this.passInput.value.trim(),
            label: this.labelInput.value.trim()
        };

        try {
            // Validate user data
            validateUser(userData);

            const userId = this.userIdInput.value;

            if (userId) {
                // Update existing user
                UserStore.updateUser(parseInt(userId, 10), userData);
            } else {
                // Add new user
                UserStore.addUser(userData);
            }

            this.modal.hide();
        } catch (error) {
            if (error instanceof ValidationError) {
                this.showValidationErrors(error.errors);
            } else {
                alert('Error saving user: ' + error.message);
            }
        }
    }

    /**
     * Show validation errors on form fields
     * @param {Array} errors - Array of {field, message} objects
     */
    showValidationErrors(errors) {
        errors.forEach(({ field, message }) => {
            const input = this[`${field}Input`];
            if (input) {
                input.classList.add('is-invalid');

                // Add error message
                let feedback = input.parentElement.querySelector('.invalid-feedback');
                if (!feedback) {
                    feedback = document.createElement('div');
                    feedback.className = 'invalid-feedback';
                    input.parentElement.appendChild(feedback);
                }
                feedback.textContent = message;
                feedback.style.display = 'block';
            }
        });
    }

    /**
     * Clear validation errors from form
     */
    clearValidationErrors() {
        // Remove invalid classes
        this.modalElement.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });

        // Remove error messages
        this.modalElement.querySelectorAll('.invalid-feedback').forEach(el => {
            el.style.display = 'none';
        });
    }
}

export default UserModal;
