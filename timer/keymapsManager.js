import { clearAlarm } from "./alarmManager.js";
import { newTimer } from "./dataManager.js";
import { searchInput, searchContainer } from "./documentElementsManager.js";
import * as dpm from "./dynamicParamsManager.js"
import * as sm from "./syncManager.js"

function isKeyShortcut(event, key, ctrl, shift) {
    if (dpm.dynamicParamsManager.getParams().isEditMode) return false;
    if (ctrl !== event.ctrlKey) return false;
    if (shift !== event.shiftKey) return false;
    return event.key === key;
}

function handleKeyShortcut(event, actionFunction, key, ctrl, shift) {
    if (isKeyShortcut(event, key, ctrl, shift)) {
        event.preventDefault();
        actionFunction(key);
    }
}

function focusHandler(key) {
    searchContainer.style.display = 'flex';
    searchInput.focus();
    if (key === 'f') searchInput.select();
    if (key === '/') searchInput.value = '/';
}

function createNewTimerHandler() {
    if (document.activeElement.tagName === 'INPUT') return;
    newTimer();
}

function toggleAdvancedSearchHandler(event) {
    const advancedSearchOptions = document.getElementById('advanced-search-options');
    advancedSearchOptions.style.display = advancedSearchOptions.style.display === 'none' ? 'flex' : 'none';
}

function newShortcut(cmd, key, { ctrl = false, shift = false } = {}) {
    document.addEventListener('keydown', (event) => handleKeyShortcut(event, cmd, key, ctrl, shift));
}

export function init() {
    newShortcut(sm.backupToClipboard, 'e', { ctrl: true })
    newShortcut(sm.loadBackupFromClipboard, 'q', { ctrl: true })
    newShortcut(createNewTimerHandler, '+');
    newShortcut(clearAlarm, 'p');
    newShortcut(dpm.clearUnread, 'r');
    newShortcut(focusHandler, '/', { ctrl: true });
    newShortcut(focusHandler, 'f', { ctrl: true });
    newShortcut(toggleAdvancedSearchHandler, 'ArrowDown', { ctrl: true });
}

