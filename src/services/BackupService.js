const BackupService = {
    exportBackup: async () => {
        if (window.electronAPI && window.electronAPI.exportBackup) {
            try {
                return await window.electronAPI.exportBackup();
            } catch (error) {
                console.error('Renderer Backup Error:', error);
                return { success: false, error: error.message };
            }
        }
        return { success: false, error: 'Nepodporované prostředí.' };
    },

    importBackup: async () => {
        if (window.electronAPI && window.electronAPI.importBackup) {
            try {
                return await window.electronAPI.importBackup();
            } catch (error) {
                console.error('Renderer Restore Error:', error);
                return { success: false, error: error.message };
            }
        }
        return { success: false, error: 'Nepodporované prostředí.' };
    }
};

export default BackupService;
