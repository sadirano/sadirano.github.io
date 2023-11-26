
// Define default values for properties
const defaultSettings = {
    updateInterval: 60000,
    displayTimeFormat: 'hh:mm:ss',
    showNotificationCommand: true,
    resultToSearchInput: true,
    clearSearchInput: true,
    showTimerButtons: true,
    showBottomMenu: true,
    showNotes: true,
    showStartTimeOnNotes: false,
    showInputOnNotes: true,
    allowForcedReloadOnRefresh: true,
    autoRepeatFixedTimers: true,
    alarm : {
        enabled : false,
        sound: 1,
        volume : 0.5,
    },
};

function loadSettings() {
    try {
        const storedSettings = JSON.parse(localStorage.getItem('settings')) || {};
        // Merge the stored settings with default settings
        return { ...defaultSettings, ...storedSettings };
    } catch (error) {
        // Handle parsing error or other issues
        console.error('Error loading settings:', error);

        // Return default settings in case of an error
        return defaultSettings;
    }
}
export function saveSettings() {
    localStorage.setItem('settings', JSON.stringify(settings));
    localStorage.setItem('settingsLastUpdate', Date.now());
}

export const settings = loadSettings()
