import { searchInput } from "./documentElementsManager.js";
import { delayForceReload } from "./viewManager.js";
import { saveSettings, settings } from "./settingsManager.js";
import { showNotification, uncapitalizeFirstLetter } from "../commons/utils.js";
import { removeUnusedColors } from "./tagColorManager.js";

function clearSearchInput(force) {
  if (force || settings.clearSearchInput) {
    searchInput.value = '';
  }
}

function showResult(result) {
  if (settings.resultToSearchInput) {
    searchInput.value = result;
  }
}

function showNotificationCommand(msg) {
  if (settings.showNotificationCommand) {
    showNotification(msg)
  }
}


function toggleSetting(command, setting, toggleMessage, toggleFunction) {
  if (command.includes(`/toggle${setting}`)) {
    setting = uncapitalizeFirstLetter(setting);
    settings[setting] = !settings[setting];
    saveSettings();
    clearSearchInput();
    showResult(toggleMessage);
    if (toggleFunction) {
      toggleFunction(); // Call additional function if provided
    }
  }
}

export function executeCommand(command) {

  toggleSetting(command, 'ShowTimerButtons', '', delayForceReload);
  toggleSetting(command, 'ShowBottomMenu', '', delayForceReload);
  toggleSetting(command, 'ShowNotificationCommand', 'Notifications back online!');
  toggleSetting(command, 'ResultToSearchInput', 'Command results back to the Search bar.');
  toggleSetting(command, 'ClearSearchInput', 'The input was cleared, believe me.');
  toggleSetting(command, 'HideAllNotes', '', delayForceReload);
  toggleSetting(command, 'ShowStartTimeOnNotes', '', delayForceReload);
  toggleSetting(command, 'ShowInputOnNotes', '', delayForceReload);
  toggleSetting(command, 'AllowForcedReloadOnRefresh', '', delayForceReload);
  toggleSetting(command, 'AutoRepeatFixedTimers', '', delayForceReload);


  if (command.includes('/toggleAds')) {
    clearSearchInput();
    showResult('Thank you for trying.');
  }

  if (command.includes('/help')) {
    clearSearchInput();
    showResult('Sorry, can\'t help at the moment, please try again later.');
  }

  if (command.includes('/api=')) {
    let api = command.substring(5).trim();
    if (!api) return;

    clearSearchInput();

    localStorage.setItem('api', api);

    showNotificationCommand("Api Configured with " + api);
    return;
  }

  if (command.includes('/refreshTimer=')) {
    let api = command.substring('/refreshTimer='.length).trim();
    if (!api) return;

    clearSearchInput();

    // refreshTimer()

    showNotificationCommand("Not working for now.");

    // showNotificationCommand("Timer refreshed by Command Line");
    return;
  }

  if (command.includes('/apiRemove')) {
    clearSearchInput();

    localStorage.removeItem('api');

    showNotificationCommand("Api removed.");
    return;
  }

  if (command.includes('/api?')) {
    clearSearchInput();

    showResult(localStorage.getItem('api'));
    return;
  }

  const keywordMatch = command.match(/\/(\S+)=.+/);

  if (keywordMatch) {
    const keyword = keywordMatch[1];
    const input = keywordMatch[1];
    clearSearchInput();
    updateCustomKeywordsMap({ key: keyword, value: input })

    showNotificationCommand(`Keyword ${keyword} configured with ${input}.`);
    return;
  }

  const keywordQuestionMatch = command.match(/\/(\S+)\?/);

  if (keywordQuestionMatch) {
    const keyword = keywordQuestionMatch[1];
    clearSearchInput();
    showResult(customKeywordsMap.getItem(keyword));
    return;
  }

  if (command.includes('/sadirano-configs')) {
    settings.showNotificationCommand = true;
    settings.resultToSearchInput = true;
    settings.clearSearchInput = true;
    clearSearchInput();
    showNotificationCommand("Sadirano's Profile Loaded!");
  }

  if (command.includes('/cleanColorMap')) {
    removeUnusedColors();
    clearSearchInput();
    showNotificationCommand("Color map cleared.");
  }
}

export function bindAutoCompleteCommands(searchInput) {
  var tribute = new Tribute({
    trigger: "/",
    values: options.sort((a, b) => a.value.localeCompare(b.value)),
    selectTemplate: function (item) {
      if (item === undefined) return '';
      return item.original.key;
    },
    menuItemTemplate: function (item) {
      return item.original.value;
    },
    lookup: function (item) {
      return item.value + item.key
    }
  });

  // Attach tribute to the input element
  tribute.attach(searchInput);
  return tribute;
}

const options = [
  { key: '/api?', value: 'Retrieve API', },
  { key: '/apiRemove', value: 'Remove API', },
  { key: '/api=', value: 'Setup API', },
  { key: '/toggleShowTimerButtons', value: 'Toggle Timer Buttons', },
  { key: '/toggleShowBottomMenu', value: 'Toggle Bottom Menu Bar', },
  { key: '/sadirano-configs', value: 'Sadirano\'s Profile Config ', },
  { key: '/toggleShowNotificationCommand', value: 'Toggle Command Notification', },
  { key: '/toggleResultToSearchInput', value: 'Toggle option to output the result to the Search Bar', },
  { key: '/toggleClearSearchInput', value: 'Toggle option to Clear the Search Bar after Executing the Command', },
  { key: '/cleanColorMap', value: 'Remove unused color tags', },
  { key: '/toggleAds', value: 'The Ads Opt-in option', },
  { key: '/help', value: 'Are you looking for help ? Me too.', },
  { key: '/toggleHideAllNotes', value: 'Show/Hide all Notes', },
  { key: '/toggleShowStartTimeOnNotes', value: 'Toggle Start Time on Notes', },
  { key: '/toggleShowInputOnNotes', value: 'Toggle Input on Notes', },
  { key: '/toggleAllowForcedReloadOnRefresh', value: 'Toggle Forced Reload by the App', },
  { key: '/toggleAutoRepeatFixedTimers', value: 'Toggle Automatic Repeat for Fixed Timers', },
  { key: '/refreshTimer=', value: 'Refresh a timer by it\'s ID', },
];