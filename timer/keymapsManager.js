import { clearAlarm } from "./alarmManager.js";
import { newTimer } from "./dataManager.js";
import { searchInput, searchContainer } from "./documentElementsManager.js";
import * as dpm from "./dynamicParamsManager.js"
import * as sm from "./syncManager.js"

function isKeyShortcut(event, key) {
    return !dpm.dynamicParamsManager.getParams.isEditMode && event.key === key
}

function handleKeyShortcut(event, key, actionFunction) {
    if (isKeyShortcut(event, key)) {
        event.preventDefault();
        actionFunction();
    }
}

function searchBarHandler(event) {
    focus = (event) => {
        event.preventDefault();
        searchContainer.style.display = 'flex';
        searchInput.focus();
    }
    if (event.ctrlKey && event.key === 'f') {
        focus(event);
        searchInput.select();
    }
    if (event.ctrlKey && event.key === '/') {
        focus(event);
        searchInput.value = '/';
    }
}

function createNewTimerHandler(event) {
    // Get the currently focused element
    const focusedElement = document.activeElement;
    if (focusedElement.tagName === 'INPUT') return;
    if (dpm.dynamicParamsManager.getParams().isEditMode) return;
    if (event.key === "+") {
        event.preventDefault();
        newTimer();
    }
}

function toggleAdvancedSearchHandler(event) {
    if (event.ctrlKey && event.key === "ArrowDown") {
        const advancedSearchOptions = document.getElementById('advanced-search-options');
        advancedSearchOptions.style.display = advancedSearchOptions.style.display === 'none' ? 'flex' : 'none';
    }
}

function newShortcut(cmd) {
    document.addEventListener('keydown', cmd);
}

function newShortKey(key, cmd) {
    newShortcut((event) => handleKeyShortcut(event,key,cmd));
}

export function init() {
    newShortcut(sm.backupToClipboard)
    newShortcut(sm.loadBackupFromClipboard)
    newShortcut(createNewTimerHandler);
    newShortcut(searchBarHandler);
    newShortcut(toggleAdvancedSearchHandler);
    newShortKey('p', clearAlarm);
    newShortKey('r', dpm.clearUnread);
}

