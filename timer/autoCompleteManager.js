import { searchInput } from "./documentElementsManager.js";
import { delayForceReload } from "./viewManager.js";
import { saveSettings, settings } from "./settingsManager.js";
import { showNotification } from "../commons/utils.js";
import { removeUnusedColors } from "./tagColorManager.js";
import { changeAlarmSound, changeAlarmVolume } from "./alarmManager.js";
import { updateCustomKeywordsMap } from "./customKeywordManager.js";

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
  if (command.includes(`/toggle=${setting}`)) {
    settings[setting] = !settings[setting];
    saveSettings();
    clearSearchInput();
    showResult(`[${(settings[setting] ? 'T' : 'F')}] ${toggleMessage}`);
    if (toggleFunction) {
      toggleFunction(); // Call additional function if provided
    }
  }
}

export function executeCommand(command) {

  toggleSetting(command, 'showTimerButtons', 'Show Timer Buttons', delayForceReload);
  toggleSetting(command, 'showBottomMenu', 'Show Bottom Menu', delayForceReload);
  toggleSetting(command, 'showNotificationCommand', 'Notifications back online!');
  toggleSetting(command, 'resultToSearchInput', 'Command results back to the Search bar.');
  toggleSetting(command, 'clearSearchInput', 'The input was cleared, believe me.');
  toggleSetting(command, 'hideAllNotes', 'Hide All Notes', delayForceReload);
  toggleSetting(command, 'showStartTimeOnNotes', 'Show Start Time on Notes', delayForceReload);
  toggleSetting(command, 'showInputOnNotes', 'Show Input on Notes', delayForceReload);
  toggleSetting(command, 'allowForcedReloadOnRefresh', 'Allow Forced Reload on Refresh', delayForceReload);
  toggleSetting(command, 'autoRepeatFixedTimers', 'Auto Repeat Fixed Timers');

  if (command.includes('/toggleAds')) {
    clearSearchInput();
    showResult('Thank you for trying.');
    return;
  }

  if (command.includes('/help')) {
    clearSearchInput();
    showResult('Sorry, can\'t help at the moment, please try again later.');
    return;
  }

  if (command.includes('/toggleEnableAlarms')) {
    settings.alarm.enabled = !settings.alarm.enabled;
    saveSettings();
    clearSearchInput();
    showResult(`[${(settings.alarm.enabled ? 'T' : 'F')}] Enable Alarms`);
    return;
  }

  if (command.includes('/alarmSound=')) {
    let alarm = command.substring('/alarmSound='.length).trim();
    if(changeAlarmSound(alarm)) {
      clearSearchInput();
      showResult("New alarm sound configured " + alarm);
    }
    return;
  }

  if (command.includes('/alarmVolume=')) {
    let volume = command.substring('/alarmVolume='.length).trim();
    if(changeAlarmVolume(volume)) {
      clearSearchInput();
      showResult("New alarm volume configured " + volume);
    }
    return;
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

  const keywordMatch = command.match(/\/#(\S+)=.+/);

  if (keywordMatch) {
    const keyword = keywordMatch[1];
    const input = keywordMatch[1];
    clearSearchInput();
    updateCustomKeywordsMap({ key: keyword, value: input })

    showNotificationCommand(`Keyword ${keyword} configured with ${input}.`);
    return;
  }

  const keywordQuestionMatch = command.match(/\/#(\S+)\?/);

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
    return;
  }

  if (command.includes('/cleanColorMap')) {
    removeUnusedColors();
    clearSearchInput();
    showNotificationCommand("Color map cleared.");
    return;
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
  { key: '/refreshTimer=', value: 'Refresh a timer by it\'s ID', },
  { key: '/cleanColorMap', value: 'Remove unused color tags', },
  { key: '/help', value: 'Are you looking for help ? Me too.', },
  { key: '/sadirano-configs', value: 'Sadirano\'s Profile Config ', },
  { key: '/toggleAds', value: 'The Ads Opt-in option', },
  { key: '/toggle=showTimerButtons', value: 'Toggle Timer Buttons', },
  { key: '/toggle=showBottomMenu', value: 'Toggle Bottom Menu Bar', },
  { key: '/toggle=showNotificationCommand', value: 'Toggle Command Notification', },
  { key: '/toggle=resultToSearchInput', value: 'Toggle option to output the result to the Search Bar', },
  { key: '/toggle=clearSearchInput', value: 'Toggle option to Clear the Search Bar after Executing the Command', },
  { key: '/toggle=hideAllNotes', value: 'Show/Hide all Notes', },
  { key: '/toggle=showStartTimeOnNotes', value: 'Toggle Start Time on Notes', },
  { key: '/toggle=showInputOnNotes', value: 'Toggle Input on Notes', },
  { key: '/toggle=allowForcedReloadOnRefresh', value: 'Toggle Forced Reload by the App', },
  { key: '/toggle=autoRepeatFixedTimers', value: 'Toggle Automatic Repeat for Fixed Timers', },
  { key: '/toggleEnableAlarms', value: 'Enable Alarm Sounds', },
  { key: '/alarmSound=', value: 'Choose an Alarm Sound [1-6]', },
  { key: '/alarmVolume=', value: 'Alarm Volume [0-100]', },
];