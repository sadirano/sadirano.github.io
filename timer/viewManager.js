import * as stm from "./settingsManager.js";
import * as dpm from "./dynamicParamsManager.js";
import { TimerElement } from "./timerElement.js";
import * as data from './dataManager.js'
import * as time from '../commons/time.js'

export function displayNote(timer, divElement, settings) {
  if (settings.hideAllNotes) {
    divElement.innerHTML = '';
    return;
  }
  let note = '';
  let hour = time.formatTime(timer.startTime, timer.duration);
  if (timer.note !== '' && timer.note !== undefined && timer.note !== 'undefined') {
    let noteLines = timer.note.split("\n");
    for (let line of noteLines) {
      if (!line.trim().startsWith("img=") //Image config
        && !line.trim().startsWith("#") // Tag
        && !line.trim().startsWith(">") // Hidden line note.
      ) {
        note += line.trim() + '<br>';
      }
    }
  }
  divElement.innerHTML = ''
    + (settings.showStartTimeOnNotes ? hour.startTime + ' / ' : '')
    + hour.endTime //Always shows the endtime.
    + ((settings.showInputOnNotes && !timer.fixed) ? ' - ' + timer.input : '')
    + '<br>' + note;
}

export function updateBackgroundImage(timer, divgroup) {
  if (timer.note !== '' && timer.note !== undefined && timer.note !== 'undefined') {
    let noteLines = timer.note.split("\n");
    for (let line of noteLines) {
      // Check for img= at the start of the note
      if (line.startsWith("img=")) {
        const noteUrl = line.substring(4).trim();
        divgroup.style.backgroundImage = `url('${noteUrl}')`;
        return;
      }
    }
  }
  divgroup.style.backgroundImage = ``;
}

export function loadTimersView(settings) {
  const timerList = document.getElementById('timer-list');
  let timersData = data.loadTimersData();

  timersData
    .sort(function (a, b) { return (a.duration - Math.floor((Date.now() - a.startTime) / 1000)) - (b.duration - Math.floor((Date.now() - b.startTime) / 1000)) })
    .forEach((timer) => {
      const ele = new TimerElement(timer)
      ele.init();
      timerList.appendChild(ele.instance);
    });
}

export function refreshPageIfNeeded(force = false) {
  const { isEditMode, shouldReload, lastUserInteraction } = dpm.dynamicParamsManager.getParams();
  const { updateInterval } = stm.settings;
  if (force || !isEditMode && shouldReload && lastUserInteraction > Date.now() - updateInterval) {
    location.reload();
  }
}

function delayForceReload() {
  setTimeout(refreshPageIfNeeded, 3000, true);
}
