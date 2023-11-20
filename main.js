import * as nav from "./timer/navigationManager.js";
import * as view from "./timer/viewManager.js";
import * as stm from "./timer/settingsManager.js";
import * as utils from "./commons/utils.js";
import * as acm from "./timer/autoCompleteManager.js";
import * as sbm from "./timer/searchBarManager.js";
import * as km from "./timer/keymapsManager.js";

const searchInput = document.getElementById('search-input');

function init() {
  km.init();
  nav.init();
  setInterval(view.refreshPageIfNeeded, stm.settings.updateInterval);
  utils.checkNotificationPermission();
  view.loadTimersView(stm.settings);
  //  tribute = bindTribute();
  acm.bindAutoCompleteCommands(searchInput);
  if (!stm.settings.showBottomMenu) {
    document.getElementById('bottom-bar').style.display = 'none'
  }
  // searchInput.value = searchInputValue;
  //  applySearch(filterTag);
}
document.addEventListener('DOMContentLoaded', init);