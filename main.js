import * as km from "./timer/keymapsManager.js";
import * as nav from "./timer/navigationManager.js";
import * as view from "./timer/viewManager.js";
import * as utils from "./commons/utils.js";
import * as acm from "./timer/autoCompleteManager.js";
import { searchInput, bottomBar } from "./timer/documentElementsManager.js";
import { settings } from "./timer/settingsManager.js";
import { applySearch, searchInputValue, filterTag } from "./timer/searchBarManager.js";
import { applySearchWithDelay, toggleAdvancedSearch } from "./timer/searchBarManager.js";
import { loadBackupFromClipboard, backupToClipboard } from './timer/syncManager.js';
import { newTimer } from './timer/dataManager.js';

function init() {
  km.init();
  nav.init();
  setInterval(view.refreshPageIfNeeded, settings.updateInterval);
  utils.checkNotificationPermission();
  view.loadTimersView(settings);
  acm.bindAutoCompleteCommands(searchInput);
  if (settings.showBottomMenu) {
    bottomBar.style.display = 'flex'
  }
  searchInput.value = searchInputValue;
  applySearch(filterTag);
}
document.addEventListener('DOMContentLoaded', init);


document.getElementById('search-input').addEventListener('input', applySearchWithDelay);
document.getElementById('toggleAdvancedSearch').addEventListener('click', toggleAdvancedSearch);
document.getElementById('min-remaining').addEventListener('input', applySearchWithDelay);
document.getElementById('max-remaining').addEventListener('input', applySearchWithDelay);
document.getElementById('loadBackupFromClipboard').addEventListener('click', loadBackupFromClipboard);
document.getElementById('backupToClipboard').addEventListener('click', backupToClipboard);
document.getElementById('newTimer').addEventListener('click', newTimer);
