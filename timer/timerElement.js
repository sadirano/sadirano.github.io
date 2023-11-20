import { dynamicParamsManager } from "./dynamicParamsManager.js";
import { selectLastFocusedTimerElement } from "./navigationManager.js";
import * as stm from "./settingsManager.js";
import * as time from '../commons/time.js'
import * as view from './viewManager.js'
import * as tcm from './tagColorManager.js'

export class TimerElement {
  constructor(timer) {
    this.timer = timer;
    this.instance = createTimerElement();
    this.updateTags();
    this.displayNote();
  }

  updateTags() {
    this.tagsDisplay.innerHTML = '';
    _addTagsToDisplay();
    if (!this.timer.hasTag()) this.tagContainer.style.display = 'none';
  }

  updateBackgroundImage() {
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

  displayNote() {
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

  _addTagsToDisplay() {
    timer.tags.forEach(tag => {
      const tagElement = document.createElement('span');
      tagElement.className = 'tag';
      tagElement.textContent = tag.substring(1);
      if (tcm.tagColorMap[tag] === undefined) getRandomColor(tag);
      tagElement.style.backgroundColor = tcm.tagColorMap[tag].backgroundColor;
      tagElement.style.color = tcm.tagColorMap[tag].fontColor;
      tagsDisplay.appendChild(tagElement);

      // Add event listener to the tag icon for showing/hiding timers with the same tag
      tagElement.addEventListener('click', function () {
        applySearch(tag);
      });

      // Add event listener for changing the tag color
      tagElement.addEventListener('contextmenu', function (event) {
        event.preventDefault();
        showColorPicker(event, tag);
      });

      tagContainer.style.display = '';
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
  
    if (this.timer.fixed || !stm.settings.showTimerButtons) {
      this.refreshButton.style.visibility = 'hidden';
    }
  
    if (!stm.settings.showTimerButtons) {
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
 
    const customPrompt = document.getElementById('customPrompt');
    const prompt = document.getElementById('my-prompt');
  
    this.instance.addEventListener('click', openPromptHandler);
  
    this.instance.addEventListener('keypress', function (event) {
      switch (event.key) {
        case "D":
          event.preventDefault();
          deleteTimer();
          break;
        case "R":
          event.preventDefault();
          refreshTimer();
          break;
        case "e":
        case " ":
          event.preventDefault();
          openPromptHandler(event);
          break;
        case "F":
          event.preventDefault();
          timer.input = formatTime(timer.startTime, timer.duration).endTime;
          displayNote(timer, divElement);
          break;
  
        default:
          break;
      }
    });
  
    // Delete button functionality
    deleteButton.addEventListener('click', deleteTimer);
    // Refresh button functionality
    refreshButton.addEventListener('click', refreshTimer);
  
    customPrompt.style.display = 'none';
    // Clear event listener after submitting
    prompt.removeEventListener('keydown', handlePromptKeydown);
  
    // this.instance.displayNote(timer, divElement);
    this.startTimer();
    return this.instance;
  }


  refreshTimerDelayed() {
    setTimeout(refreshTimer, 10000);
  }

  refreshTimer(timer) {
    let newDuration = getDuration(timer.input);
    this.durationDisplay.textContent = `${newDuration}`;
    timer.startTime = Date.now();
    timer.duration = newDuration;
    notified = false;

    startTimer();
    saveTimersData();
    if (settings.allowForcedReloadOnRefresh) {
      delayForceReload();
    } else {
      displayNote(timer, divElement);
    }
  }

  deleteTimer() {
    document.getElementById('timer-list').removeChild(timerElement);
    let timerIndex = timers.findIndex(t => t.timerId === timer.timerId);
    if (timerIndex - 1) {
      timers.splice(timerIndex, 1);
      saveTimersData();
    }
  }


  openPromptHandler(event) {
    if (dpm.dynamicParamsManager.getParams().isEditMode) return;

    // Elements to be excluded
    const excludeElements = [tagContainer, deleteButton, refreshButton];

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
      if (timer.note !== undefined && timer.note !== "undefined") {
        note = timer.note;
      }
      openPrompt(timer.input + '\n' + timer.name + '\n' + note);
    }
  }

  // Updated openPrompt function to handle multiline notes input
  openPrompt(initialValue) {
    dynamicParamsManager.updateParams({ isEditMode: true })
    customPrompt.style.display = 'flex';

    //    prompt.textContent = initialValue;
    prompt.value = initialValue;

    prompt.rows = 10; // Set the number of rows as needed
    prompt.addEventListener('keydown', handlePromptKeydown);
    // Add new event listeners
    // prompt.addEventListener("blur", cancelPrompt);
    document.addEventListener('keydown', cancelPrompt);

    customPrompt.appendChild(prompt);
    prompt.focus();
  }

  handlePromptKeydown(event) {
    if (event.ctrlKey && event.key === 'Enter') {
      submitPrompt();
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      submitPrompt();
    }
  }



  cancelPrompt(event) {
    if (event.key === "Escape" || event.type === "blur") {
      dynamicParamsManager.updateParams({ isEditMode: false });
      customPrompt.style.display = 'none';
      clearListeners();
      selectLastFocusedTimerElement();
    }
  }

  // Updated submitPrompt function to handle notes changes save Edited Timer
  submitPrompt() {
    const inputValue = prompt.value;

    // Split the input into lines
    const lines = inputValue.split('\n');

    // Extract the first line as the timer duration input
    const durationInput = lines[0].trim();
    let newDuration = getDuration(durationInput);

    //Handle new duration.
    if (!isNaN(newDuration) && newDuration > 0 && newDuration != timer.duration) {
      this.durationDisplay.textContent = `${newDuration}`;
      timer.startTime = Date.now();
      timer.duration = newDuration;
      timer.input = durationInput;
      timer.fixed = timer.input.includes(':');
      const validInputs = ['odd', 'even', 'next'];
      timer.settings.repeat = validInputs.includes(timer.input.toLowerCase()) || (timer.fixed && settings.autoRepeatFixedTimers);

      updateCountdown();
      saveTimersData();
      startTimer();
    }

    // Extract the second line as the timer name
    const newTimerName = lines[1].trim();
    if (newTimerName !== null && newTimerName !== '') {
      timerName.textContent = newTimerName;
      timer.name = newTimerName;
    }

    // Extract the rest of the lines as notes
    const newNote = lines.slice(2).join('\n').trim();

    // Extract tags from the note and update the timer tags
    const newTags = extractTags(newNote);
    timer.tags = newTags;
    timer.note = newNote;
    displayNote(timer, divElement);
    updateTags(timer, tagsDisplay, tagContainer); // Update the tags display
    updateBackgroundImage(timer, divgroup);

    updateTimerSettings(timer.note);

    saveTimersData();

    customPrompt.style.display = 'none';
    dynamicParamsManager.updateParams({ isEditMode: false })

    clearListeners();
    selectLastFocusedTimerElement();
  }


  updateTimerSettings() {
    // Regex to find all content after hashtags in the note, allowing spaces
    const tagRegex = /$[a-zA-Z0-9_]+( [a-zA-Z0-9_]+)*/g;
    const matches = timer.note.match(tagRegex);
    timer.settings = { ...timer.settings, ...matches }
  }

  clearListeners() {
    // Clear previous event listeners
    prompt.removeEventListener('keydown', handlePromptKeydown);
    prompt.removeEventListener("blur", cancelPrompt);
    document.removeEventListener('keydown', cancelPrompt);
  }

  extractTags(note) {
    // Regex to find all content after hashtags in the note, allowing spaces
    const tagRegex = /#[a-zA-Z0-9_]+( [a-zA-Z0-9_]+)*/g;
    const matches = note.match(tagRegex);
    return matches || [];
  }

  

  updateCountdown() {
    this.remainingTime_ms = this.timer.duration * 1000 - (Date.now() - this.timer.startTime);

    if (Math.floor(remainingTime_ms / 1000) === 0 && !notified) {
      let options = { hour: "2-digit", minute: "2-digit" };
      let hora = new Date().toLocaleString("en-us", options);
      showNotification(timerName.textContent + " Done at " + hora);
      notified = true;
      if (timer.fixed || timer.settings.repeat) refreshTimerDelayed();
    }

    if (timer.remainingTime_ms < 10000 && (timer.fixed || timer.settings.repeat)) refreshTimerDelayed();

    let formattedTime = millisecondsToTime(remainingTime_ms, stm.settings.displayTimeFormat);

    countdownDisplay.textContent = formattedTime;

    let percentage = (remainingTime_ms / (timer.duration * 1000)) * 100;
    // Apply styles based on the percentage and timer rules
    applyStyles(percentage, timer.settings.rules);

    function applyStyles(percentage, rules) {
      // Find the rule that matches the percentage
      const matchingRule = rules.find(rule => percentage < rule.limit);

      // Apply styles based on the matching rule
      if (matchingRule) {
        countdownDisplay.style.color = matchingRule.color;
        // countdownDisplay.style.backgroundColor = matchingRule.backgroundColor;
      } else {
        // Provide a default style if no rule matches
        countdownDisplay.style.color = '#0073e6';
        // countdownDisplay.style.backgroundColor = '#333';
      }
    }

  }

  millisecondsToTime(milliseconds, format = "hh:mm:ss") {
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

  padNumber(number, length = 2) {
    return String(Math.abs(number)).padStart(length, '0');
  }

  startTimer() {
    updateCountdown();
    setInterval(updateCountdown, 50);
  }


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

// // Function to get the contrast color for font based on background color
// function getContrastColor(hexColor) {
//   const threshold = 130; // Adjust as needed
//   const rgb = hexToRgb(hexColor);
//   const luminance = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
//   return luminance > threshold ? 'black' : 'white';
// }

// Function to convert hex color to RGB
function hexToRgb(hex) {
  const bigint = hex;
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}
