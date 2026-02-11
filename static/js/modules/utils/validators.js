/**
 * Validation Utilities
 * Input validation functions
 */

/**
 * Custom validation error
 */
export class ValidationError extends Error {
    constructor(errors) {
        super('Validation failed');
        this.name = 'ValidationError';
        this.errors = errors;
    }
}

/**
 * Validate user data
 * @param {Object} user - User data to validate
 * @returns {boolean} True if valid
 * @throws {ValidationError} If validation fails
 */
export function validateUser(user) {
    const errors = [];

    // Name validation
    if (!user.name || user.name.trim().length === 0) {
        errors.push({ field: 'name', message: 'Name is required' });
    }

    // Extension validation
    if (!user.ext || user.ext.trim().length === 0) {
        errors.push({ field: 'ext', message: 'Extension is required' });
    } else if (!/^\d+$/.test(user.ext.trim())) {
        errors.push({ field: 'ext', message: 'Extension must be numeric' });
    }

    if (errors.length > 0) {
        throw new ValidationError(errors);
    }

    return true;
}

/**
 * Validate IP address
 * @param {string} ip - IP address to validate
 * @returns {boolean} True if valid IP
 */
export function validateIP(ip) {
    const pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!pattern.test(ip)) {
        return false;
    }

    const parts = ip.split('.');
    return parts.every(part => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
    });
}

/**
 * Validate port number
 * @param {string|number} port - Port to validate
 * @returns {boolean} True if valid port
 */
export function validatePort(port) {
    const num = parseInt(port, 10);
    return !isNaN(num) && num > 0 && num <= 65535;
}
