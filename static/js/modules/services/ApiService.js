/**
 * ApiService - Backend API communication
 * Centralized service for all Flask backend calls
 */
class ApiService {
    /**
     * Export user pool as JSON
     * @param {Array} users - Array of user objects
     * @returns {Promise<Blob>} JSON file blob
     */
    async exportPool(users) {
        const response = await fetch('/export_pool', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ users })
        });

        if (!response.ok) {
            throw new Error(`Export failed: ${response.statusText}`);
        }

        return response.blob();
    }

    /**
     * Generate Polycom configuration file
     * @param {Object} payload - Configuration payload
     * @param {Object} payload.server_config - Server settings
     * @param {Object} payload.user_config - Main user configuration
     * @param {Array} payload.attendants - BLF attendants list
     * @returns {Promise<Blob>} XML config file blob
     */
    async generateConfig(payload) {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Generation failed: ${response.statusText}`);
        }

        return response.blob();
    }
}

// Export singleton instance
export default new ApiService();
