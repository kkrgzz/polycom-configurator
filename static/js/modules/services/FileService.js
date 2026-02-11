/**
 * FileService - File handling operations
 * Import/export and download functionality
 */
class FileService {
    /**
     * Trigger browser download for a blob
     * @param {Blob} blob - File blob
     * @param {string} filename - Desired filename
     */
    async downloadBlob(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    /**
     * Read and parse JSON file
     * @param {File} file - File object from input
     * @returns {Promise<*>} Parsed JSON data
     */
    async readJsonFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    resolve(data);
                } catch (error) {
                    reject(new Error('Invalid JSON format'));
                }
            };

            reader.onerror = () => {
                reject(new Error('File read error'));
            };

            reader.readAsText(file);
        });
    }
}

// Export singleton instance
export default new FileService();
