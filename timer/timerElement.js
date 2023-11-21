import { prompt, timerContainer } from "./documentElementsManager.js";
import { dynamicParamsManager } from "./dynamicParamsManager.js";
import { selectLastFocusedTimerElement } from "./navigationManager.js";
import { settings } from "./settingsManager.js";
import { getDuration } from "../commons/time.js";
import { getAllTags, timersList } from "./dataManager.js";
import { showColorPicker, tagColorMap } from "./tagColorManager.js";
import * as view from "./viewManager.js";
import * as time from "../commons/time.js";
import { saveTimersData } from "./dataManager.js"
import { showNotification } from "../commons/utils.js";
import { applySearch } from "./searchBarManager.js";


let tribute;

export class TimerElement {
  constructor(timer) {
    this.timer = timer;
    this.instance = this.createTimerElement();
    timerContainer.appendChild(this.instance);
    this.updateTags();
    this.displayNote();
    this.startTimer();
    this.refreshTimer = this.refreshTimer.bind(this);
    this.submitPrompt = this.submitPrompt.bind(this);
    this.handlePromptKeydown = this.handlePromptKeydown.bind(this);
    this.openPrompt = this.openPrompt.bind(this);
    this.clearListeners = this.clearListeners.bind(this);
    this.cancelPrompt = this.cancelPrompt.bind(this);
    this.interval = undefined;
  }

  updateTags() {
    this.tagsDisplay.innerHTML = '';
    this._addTagsToDisplay();
    if (!this.timer.hasTag()) this.tagContainer.style.display = 'none';
  }

  updateBackgroundImage() {
    if (this.timer.note !== '' && this.timer.note !== undefined && this.timer.note !== 'undefined') {
      let noteLines = this.timer.note.split("\n");
      for (let line of noteLines) {
        // Check for img= at the start of the note
        if (line.startsWith("img=")) {
          const noteUrl = line.substring(4).trim();
          this.divgroup.style.backgroundImage = `url('${noteUrl}')`;
          return;
        }
      }
    }
    this.divgroup.style.backgroundImage = ``;
  }

  displayNote() {
    if (settings.hideAllNotes) {
      this.divElement.innerHTML = '';
      return;
    }
    let note = '';
    let hour = time.formatTime(this.timer.startTime, this.timer.duration);
    if (this.timer.note !== '' && this.timer.note !== undefined && this.timer.note !== 'undefined') {
      let noteLines = this.timer.note.split("\n");
      for (let line of noteLines) {
        if (!line.trim().startsWith("img=") //Image config
          && !line.trim().startsWith("#") // Tag
          && !line.trim().startsWith(">") // Hidden line note.
        ) {
          note += line.trim() + '<br>';
        }
      }
    }
    this.divElement.innerHTML = ''
      + (settings.showStartTimeOnNotes ? hour.startTime + ' / ' : '')
      + hour.endTime //Always shows the endtime.
      + ((settings.showInputOnNotes && !this.timer.fixed) ? ' - ' + this.timer.input : '')
      + '<br>' + note;
  }

  _addTagsToDisplay() {
    this.timer.tags.forEach( (tag) =>  {
      const tagElement = document.createElement('span');
      tagElement.className = 'tag';
      tagElement.textContent = tag.substring(1);
      if (tagColorMap[tag] === undefined) getRandomColor(tag);
      tagElement.style.backgroundColor = tagColorMap[tag].backgroundColor;
      tagElement.style.color = tagColorMap[tag].fontColor;
      this.tagsDisplay.appendChild(tagElement);

      // Add event listener to the tag icon for showing/hiding timers with the same tag
      tagElement.addEventListener('click', function () {
        applySearch(tag);
      });

      // Add event listener for changing the tag color
      tagElement.addEventListener('contextmenu', function (event) {
        event.preventDefault();
        showColorPicker(event, tag);
      });

      this.tagContainer.style.display = '';
    });
  }

  createTimerElement() {
    this.instance = document.createElement('div');
    this.instance.className = 'timer';
    this.instance.dataset.timerId = this.timer.timerId;
    this.instance.tabIndex = 0;

    this.countdownDisplay = document.createElement('h2');
    this.divBottom = document.createElement('div');
    this.divBottom.className = 'div-bottom';
    this.timerName = document.createElement('h5');
    this.timerName.textContent = this.timer.name;

    this.refreshButton = document.createElement('span');
    this.refreshButton.className = 'material-symbols-outlined refresh-button';
    this.refreshButton.innerHTML = 'replay';

    this.deleteButton = document.createElement('span');
    this.deleteButton.className = 'material-symbols-outlined delete-button';
    this.deleteButton.innerHTML = 'delete';

    if (this.timer.fixed || !settings.showTimerButtons) {
      this.refreshButton.style.visibility = 'hidden';
    }

    if (!settings.showTimerButtons) {
      this.deleteButton.style.visibility = 'hidden';
    }


    this.divmain = document.createElement('div');
    this.divmain.className = 'div-main';

    this.divgroup = document.createElement('div');
    this.divgroup.className = 'vert-timer';

    view.updateBackgroundImage(this.timer, this.divgroup);

    this.divElement = document.createElement('inputDiv');
    this.divElement.className = 'div-hint';

    this.tagContainer = document.createElement('div');
    this.tagContainer.className = 'tag-container';


    this.tagsDisplay = document.createElement('div');
    this.tagsDisplay.className = 'tags-display';

    this.tagContainer.appendChild(this.tagsDisplay);

    this.instance.appendChild(this.divgroup);

    this.divgroup.appendChild(this.divmain);
    this.divgroup.appendChild(this.divBottom);
    this.divgroup.appendChild(this.tagContainer);
    this.divgroup.appendChild(this.divElement);
    this.divmain.appendChild(this.countdownDisplay);
    this.divBottom.appendChild(this.refreshButton);
    this.divBottom.appendChild(this.timerName);
    this.divBottom.appendChild(this.deleteButton);


    this.remainingTime_ms = this.timer.duration - Date.now() - this.timer.startTime; //Change to a method
    this.notified = false;

    this.instance.addEventListener('click', (event) => this.openPromptHandler(event));

    this.instance.addEventListener('keypress', (event) => this.keyPressHandler(event));

    // Delete button functionality
    this.deleteButton.addEventListener('click', () => this.deleteTimer());
    // Refresh button functionality
    this.refreshButton.addEventListener('click', () => this.refreshTimer());

    // this.instance.displayNote(timer, divElement);
    this.startTimer();
    return this.instance;
  }

  keyPressHandler(event) {
    switch (event.key) {
      case "D":
        event.preventDefault();
        this.deleteTimer();
        break;
      case "R":
        event.preventDefault();
        this.refreshTimer();
        break;
      case "e":
      case " ":
        event.preventDefault();
        this.openPromptHandler(event);
        break;
      case "F":
        event.preventDefault();
        this.timer.input = time.formatTime(this.timer.startTime, this.timer.duration).endTime;
        this.displayNote(this.timer, this.divElement);
        break;

      default:
        break;
    }
  }

  refreshTimerDelayed() {
    setTimeout(this.refreshTimer.bind(this), 10000);
  }

  updateTimerSettings() {
    // Regex to find all content after hashtags in the note, allowing spaces
    const tagRegex = /$[a-zA-Z0-9_]+( [a-zA-Z0-9_]+)*/g;
    const matches = this.timer.note.match(tagRegex);
    this.timer.settings = { ...this.timer.settings, ...matches }
  }

  clearListeners = () => {
    // Clear previous event listeners
    prompt.removeEventListener('keydown', this.handlePromptKeydown);
    prompt.removeEventListener('blur', this.cancelPrompt);
    document.removeEventListener('keydown', this.cancelPrompt);
  }



  startTimer() {
    this.updateCountdown();
    if (!this.interval) {
      setInterval(this.updateCountdown.bind(this), 1000);
    }
  }

  stopTimer() {
    clearInterval(this.interval);
  }

  openPromptHandler = (event) => {
    if (dynamicParamsManager.getParams().isEditMode) return;

    // Elements to be excluded
    const excludeElements = [this.tagContainer, this.deleteButton, this.refreshButton];

    bindTribute();

    let isExcluded = false;
    try {
      // Get the clicked element
      const clickedElement = event.target;
      // Check if the clicked element is inside any of the excludeElements
      isExcluded = excludeElements.some(element => element.contains(clickedElement));
    } catch (error) {
      // Handle the error if needed
    }

    // If not, open the prompt
    if (!isExcluded) {
      let note = '';
      if (this.timer.note !== undefined && this.timer.note !== "undefined") {
        note = this.timer.note;
      }
      this.openPrompt(this.timer.input + '\n' + this.timer.name + '\n' + note);
    }
  }

  refreshTimer = () => {
    let newDuration = getDuration(this.timer.input);
    this.timer.startTime = Date.now();
    this.timer.duration = newDuration;
    this.notified = false;

    this.startTimer();
    saveTimersData(this.timer);
    if (settings.allowForcedReloadOnRefresh) {
      this.delayForceReload();
    } else {
      this.displayNote();
    }
  }

  deleteTimer() {
    document.getElementById('timer-list').removeChild(this.instance);
    let timerIndex = timersList.findIndex(t => t.timerId === this.timer.timerId);
    if (timerIndex - 1) {
      timersList.splice(timerIndex, 1);
      saveTimersData(this.timer, true);
    }
  }

  getRemainingTimeMs() {
    return this.timer.duration * 1000 - (Date.now() - this.timer.startTime);
  }

  updateCountdown() {
    let remainingTime_ms = this.getRemainingTimeMs();
    if (Math.floor(remainingTime_ms / 1000) === 0 && !this.notified) {
      let options = { hour: "2-digit", minute: "2-digit" };
      let hora = new Date().toLocaleString("en-us", options);
      showNotification(this.timerName.textContent + " Done at " + hora);
      notified = true;
      if (this.timer.fixed || this.timer.settings.repeat) this.refreshTimerDelayed();
    }

    if (remainingTime_ms < 10000 && (this.timer.fixed || this.timer.settings.repeat)) this.refreshTimerDelayed();

    let formattedTime = millisecondsToTime(remainingTime_ms, settings.displayTimeFormat);

    this.countdownDisplay.textContent = formattedTime;

    // Apply styles based on the percentage and timer rules
    this.applyStyles();

  }

  applyStyles() {
    let percentage = (this.getRemainingTimeMs() / (this.timer.duration * 1000)) * 100;
    // Find the rule that matches the percentage
    const matchingRule = this.timer.settings.rules.find(rule => percentage < rule.limit);

    // Apply styles based on the matching rule
    if (matchingRule) {
      this.countdownDisplay.style.color = matchingRule.color;
      // countdownDisplay.style.backgroundColor = matchingRule.backgroundColor;
    } else {
      // Provide a default style if no rule matches
      this.countdownDisplay.style.color = '#0073e6';
      // countdownDisplay.style.backgroundColor = '#333';
    }
  }


  // Updated openPrompt function to handle multiline notes input
  openPrompt = (initialValue) => {
    dynamicParamsManager.updateParams({ isEditMode: true })
    customPrompt.style.display = 'flex';

    //    prompt.textContent = initialValue;
    prompt.value = initialValue;

    prompt.rows = 10; // Set the number of rows as needed
    prompt.addEventListener('keydown', this.handlePromptKeydown);
    // Add new event listeners
    // prompt.addEventListener("blur", cancelPrompt);
    document.addEventListener('keydown', (event) => this.cancelPrompt(event));

    customPrompt.appendChild(prompt);
    prompt.focus();
  }

  handlePromptKeydown = (event) => {
    if (event.ctrlKey && event.key === 'Enter') {
      this.submitPrompt();
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      this.submitPrompt(this.timer);
    }
  }

  // Updated submitPrompt function to handle notes changes save Edited Timer
  submitPrompt = (timer) => {
    const inputValue = prompt.value;

    // Split the input into lines
    const lines = inputValue.split('\n');

    // Extract the first line as the timer duration input
    const durationInput = lines[0].trim();
    let newDuration = getDuration(durationInput);

    //Handle new duration.
    if (!isNaN(newDuration) && newDuration > 0 && newDuration != this.timer.duration) {
      this.timer.startTime = Date.now();
      this.timer.duration = newDuration;
      this.timer.input = durationInput;
      this.timer.fixed = this.timer.input.includes(':');
      const validInputs = ['odd', 'even', 'next'];
      this.timer.settings.repeat = validInputs.includes(this.timer.input.toLowerCase()) || (this.timer.fixed && settings.autoRepeatFixedTimers);

      this.updateCountdown();
      saveTimersData(this.timer);
      this.startTimer();
    }

    // Extract the second line as the timer name
    const newTimerName = lines[1].trim();
    if (newTimerName !== null && newTimerName !== '') {
      this.timerName.textContent = newTimerName;
      this.timer.name = newTimerName;
    }

    // Extract the rest of the lines as notes
    const newNote = lines.slice(2).join('\n').trim();

    // Extract tags from the note and update the timer tags
    const newTags = extractTags(newNote);
    this.timer.tags = newTags;
    this.timer.note = newNote;
    this.displayNote();
    this.updateTags(); // Update the tags display
    this.updateBackgroundImage();

    this.updateTimerSettings(this.timer.note);

    saveTimersData(this.timer);

    customPrompt.style.display = 'none';
    dynamicParamsManager.updateParams({ isEditMode: false })

    this.clearListeners();
    prompt.removeEventListener('keydown', this.handlePromptKeydown);

    selectLastFocusedTimerElement();
  }
  

  cancelPrompt = (event) => {
    if (event.key === 'Escape' || event.type === 'blur') {
      dynamicParamsManager.updateParams({ isEditMode: false });
      customPrompt.style.display = 'none';
      this.clearListeners();
      selectLastFocusedTimerElement();
    }
  }

}



function millisecondsToTime(milliseconds, format = "hh:mm:ss") {
  let negative = milliseconds < 0

  let absMilliseconds = Math.abs(milliseconds);
  let totalSeconds = Math.floor(absMilliseconds / 1000);
  let hours = Math.floor(totalSeconds / 3600);
  let minutes = Math.floor((totalSeconds % 3600) / 60);
  let seconds = totalSeconds % 60;
  let millisecondsRemainder = absMilliseconds % 1000;

  let formattedTime = "";

  if (format === "hh:mm:ss") {
    if (hours != 0) {
      formattedTime += `${padNumber(hours)}:`;
    }
    if (minutes != 0 || hours != 0) {
      formattedTime += `${padNumber(minutes)}:`;
    }
    formattedTime += `${padNumber(seconds)}`;
  } else if (format === "hh:mm:ss.mmm") {
    if (hours != 0) {
      formattedTime += `${padNumber(hours)}:`;
    }
    if (minutes != 0 || hours != 0) {
      formattedTime += `${padNumber(minutes)}:`;
    }
    formattedTime += `${padNumber(seconds)}.${padNumber(millisecondsRemainder, 3)}`;
  }
  if (negative) formattedTime = '-' + formattedTime;

  return formattedTime;
}


function getRandomColor(tag) {
  const isValidColor = (r, g, b) => {
    // Check if the color is not too bright and not too similar to other colors
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128 && !isColorTooSimilar(r, g, b);
  };

  const isColorTooSimilar = (r, g, b) => {
    // Check if the color is too similar to existing colors
    for (const existingColor in tagColorMap) {
      const existingRGB = hexToRgb(tagColorMap[existingColor]);
      const colorDifference = Math.abs(r - existingRGB.r) + Math.abs(g - existingRGB.g) + Math.abs(b - existingRGB.b);
      if (colorDifference < 50) {
        return true;
      }
    }
    return false;
  };

  const letters = '0123456789ABCDEF';
  let color;
  let count = 0;
  do {
    color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    var rgb = hexToRgb(color);
    count++;
  } while (!isValidColor(rgb.r, rgb.g, rgb.b) && count < 20);

  // Adjust font color based on brightness
  const fontColor = rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114 > 186 ? 'black' : 'white';

  const colorInfo = {
    backgroundColor: color,
    fontColor,
  };

  // Update tagColorMap with the new color info
  tagColorMap[tag] = colorInfo;

  // Save tagColorMap to localStorage
  localStorage.setItem('tagColorMap', JSON.stringify(tagColorMap));

  return colorInfo;
}

function hexToRgb(hex) {
  const bigint = hex;
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}


function padNumber(number, length = 2) {
  return String(Math.abs(number)).padStart(length, '0');
}

function bindTribute() {
  var tributeAttributes = {
    trigger: "#",
    noMatchTemplate: "",
    values: getAllTags(),
    selectTemplate: function (item) {
      if (typeof item === "undefined") return null;
      if (this.range.isContentEditable(this.current.element)) {
        return item.original.key;
      }

      return item.original.value;
    },
    menuItemTemplate: function (item) {
      return item.original.value.replace("#", "");
    }
  };
  // Clear existing tribute collections
  if (tribute) {
    tribute.detach(prompt);
    prompt.removeAttribute("data-tribute")
    tribute = null;
  }
  // Create a new tribute instance
  tribute = new Tribute(
    Object.assign(
      {
        menuContainer: document.getElementById("customPrompt")
      },
      tributeAttributes
    )
  );
  // Attach tribute to the input element
  tribute.attach(prompt);

  return tribute;
}

function extractTags(note) {
  // Regex to find all content after hashtags in the note, allowing spaces
  const tagRegex = /#[a-zA-Z0-9_]+( [a-zA-Z0-9_]+)*/g;
  const matches = note.match(tagRegex);
  return matches || [];
}
