import { newTimer } from "./dataManager.js";
import { searchInput, searchContainer } from "./documentElementsManager.js";
import * as dpm from "./dynamicParamsManager.js"
import * as sm from "./syncManager.js"




function focusSearchBar(event) {
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
function createNewTimerEvent(event) {
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

export function init() {
    document.addEventListener('keydown', sm.backupToClipboard);
    document.addEventListener('keydown', sm.loadBackupFromClipboard);
    document.addEventListener('keydown', createNewTimerEvent);
    document.addEventListener('keydown', focusSearchBar);
    document.addEventListener('keydown', toggleAdvancedSearchHandler);
    document.addEventListener('keydown', function (event) {
        if (event.ctrlKey && event.key === " ") {
            event.preventDefault();
        }
    });
}