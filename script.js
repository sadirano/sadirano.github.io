const timers = [];

// Define default values for properties
const defaultSettings = {
  updateInterval: 60000,
  displayTimeFormat: 'hh:mm:ss',
  showNotificationCommand: true,
  resultToSearchInput: true,
  clearSearchInput: true,
  showTimerButtons: true,
  showBottomMenu: true,
  showNotes: true,
  showStartTimeOnNotes: false,
  showInputOnNotes: true
};

const settings = loadSettings()
const searchInput = document.getElementById('search-input');

function initializePage() {
  setInterval(refreshPageIfNeeded, settings.updateInterval);
  checkNotificationPermission();
  loadTimers();
  tribute = bindTribute();
  bindAutoCompleteCommands();
  document.addEventListener('keydown', backupToClipboard);
  document.addEventListener('keydown', loadBackupFromClipboard);
  document.addEventListener('keydown', createNewTimerEvent);
  document.addEventListener('keydown', focusSearchBar);

  document.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.key === " ") {
      event.preventDefault();
    }
  });
  if (!settings.showBottomMenu) {
    document.getElementById('bottom-bar').style.display = 'none'
  }
}

function calculateNumberOfElementsInLine(container) {
  // Get the width of the container
  const containerWidth = container.clientWidth;

  // Get the width of the first focusable element (assuming all elements have the same width)
  const elementWidth = document.querySelector('[tabindex]').clientWidth;

  // Calculate the number of elements that can fit in a line
  const numberOfElementsInLine = Math.floor(containerWidth / elementWidth);

  return numberOfElementsInLine;
}

let previousColumn = -1;

document.addEventListener('keydown', function (event) {
  if (dynamicParamsManager.getParams().isEditMode) return;
  const movementKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'];

  // Check if the pressed key is an arrow key
  if (movementKeys.includes(event.key)) {
    // Get the currently focused element
    const focusedElement = document.activeElement;

    if (focusedElement.tagName === 'INPUT') return;

    // Prevent the default arrow key behavior to handle it manually
    event.preventDefault();

    let key = event.key;

    if (key === 'Tab') {
      key = event.shiftKey ? 'STab' : 'Tab'
    }

    // Find all focusable elements on the page
    const focusableElements = Array.from(document.querySelectorAll('[tabindex]'))
      .filter(element => !element.hasAttribute('disabled'));

    // Find the index of the currently focused element in the array
    const currentIndex = focusableElements.indexOf(focusedElement);

    // Get the container element for layout calculations
    const container = document.querySelector('.timer-container');

    // Calculate the number of elements in a line dynamically
    const numberOfElementsInLine = calculateNumberOfElementsInLine(container);

    if (previousColumn === -1) {
      previousColumn = currentIndex % numberOfElementsInLine;
    }
    // Calculate the index of the next or previous focusable element
    let nextIndex;
    switch (key) {
      case 'ArrowDown':
        //Last row
        if (currentIndex >= focusableElements.length - numberOfElementsInLine) {
          nextIndex = previousColumn;
        } else {
          nextIndex = (currentIndex + numberOfElementsInLine);
          //Selecting the last row item
          if (nextIndex > focusableElements.length) {
            nextIndex = focusableElements.length - 1;
          }
        }
        break;
      case 'ArrowRight':
      case 'Tab':
        nextIndex = (currentIndex + 1) % focusableElements.length;
        previousColumn = nextIndex % numberOfElementsInLine;
        break;
      case 'ArrowUp':
        let elementsLastLine = focusableElements.length % numberOfElementsInLine;
        //Last row
        if (currentIndex > focusableElements.length - numberOfElementsInLine) {
          nextIndex = focusableElements.length - elementsLastLine - numberOfElementsInLine + previousColumn;
        } else {
          if (currentIndex < numberOfElementsInLine) { //First row
            nextIndex = focusableElements.length - elementsLastLine + previousColumn;
            if (nextIndex >= focusableElements.length) nextIndex = focusableElements.length - 1;
          } else {
            nextIndex = (currentIndex - numberOfElementsInLine);
          }
        }
        break;
      case 'ArrowLeft':
      case 'STab':
        nextIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length;
        previousColumn = nextIndex % numberOfElementsInLine;
        break;
      default:
        break;
    }

    if (focusableElements[nextIndex] !== undefined) {
      // Focus on the next or previous focusable element
      focusableElements[nextIndex].focus();
    } else {
      focusableElements[0].focus();
    }

    // Check if the focused element exists
    if (focusedElement) {
      // Scroll the focused element into view, centering it in the viewport
      focusedElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  }
});


let lastFocusedTimerElement = null;
document.addEventListener('focus', function (event) {
  const focusedElement = event.target;

  if (focusedElement.className === 'timer') {
    lastFocusedTimerElement = focusedElement;
  }
}, true);
function selectLastFocusedTimerElement() {
  if (lastFocusedTimerElement !== undefined) lastFocusedTimerElement.focus();
}


function loadSettings() {
  try {
    const storedSettings = JSON.parse(localStorage.getItem('settings')) || {};

    // Merge the stored settings with default settings
    return { ...defaultSettings, ...storedSettings };
  } catch (error) {
    // Handle parsing error or other issues
    console.error('Error loading settings:', error);

    // Return default settings in case of an error
    return defaultSettings;
  }
}
function saveSettings() {
  localStorage.setItem('settings', JSON.stringify(settings));
  localStorage.setItem('settingsLastUpdate', Date.now());
}


const tagColorMap = loadColorMap()

function loadColorMap() {
  try {
    return JSON.parse(localStorage.getItem('tagColorMap')) || {};
  } catch (error) {
    return {};
  }
}

function saveColorMap() {
  localStorage.setItem('tagColorMap', JSON.stringify(tagColorMap));
  localStorage.setItem('tagColorMapLastUpdate', Date.now());
}

//Preparing for a setting that would allow the user to keep only used tags color in the map.
function removeUnusedColors() {
  const usedColors = new Set();

  // Collect all colors used in the current tags
  timers.forEach(timer => {
    timer.tags.forEach(tag => {
      const tagLowerCase = tag.toLowerCase();
      if (tagColorMap[tagLowerCase]) {
        usedColors.add(tagColorMap[tagLowerCase]);
      }
    });
  });

  // Filter the tagColorMap to keep only used colors
  const updatedColorMap = Object.keys(tagColorMap)
    .filter(tag => usedColors.has(tagColorMap[tag]))
    .reduce((obj, tag) => {
      obj[tag] = tagColorMap[tag];
      return obj;
    }, {});

  // Update the tagColorMap and save it
  tagColorMap = updatedColorMap;
  saveColorMap();
}


const customKeywordsMap = loadCustomKeywordsMap();

function loadCustomKeywordsMap() {
  try {
    return JSON.parse(localStorage.getItem('customKeywordsMap')) || {};
  } catch (error) {
    return {};
  }
}

function saveCustomKeywordsMap() {
  localStorage.setItem('customKeywordsMap', customKeywordsMap);
}

function updateCustomKeywordsMap(item) {
  customKeywordsMap.setItem(item.key, item.value);
  localStorage.setItem('customKeywordsMap', customKeywordsMap);
}

const dynamicParamsManager = (function () {
  let dynamicParams = {
    isEditMode: false,
    shouldReload: false,
    lastUserInteraction: Date.now(),
  };

  function updateParams({ isEditMode, shouldReload, lastUserInteraction }) {
dynamicParams.isEditMode = isEditMode !== undefined ? isEditMode : dynamicParams.isEditMode;
    dynamicParams.shouldReload = shouldReload !== undefined ? shouldReload : dynamicParams.shouldReload;
    dynamicParams.lastUserInteraction = lastUserInteraction !== undefined ? lastUserInteraction : dynamicParams.lastUserInteraction;
  }

  function getParams() {
    return dynamicParams;
  }

  function updateLastUserInteraction() {
    dynamicParams.lastUserInteraction = Date.now();
  }

  return {
    updateParams,
    getParams,
    updateLastUserInteraction,
  };
})();

let tribute;

document.addEventListener('DOMContentLoaded', initializePage);

function getAllTags() {
  const allTags = new Set();
  timers.forEach(timer => {
    timer.tags.forEach(tag => {
      allTags.add(tag);
    });
  });
  return Array.from(allTags).map(tag => ({ key: tag.toLowerCase(), value: tag }));
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
    tribute.detach(document.getElementById("my-prompt"));
    document.getElementById("my-prompt").removeAttribute("data-tribute")
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
  tribute.attach(document.getElementById("my-prompt"));

  return tribute;
}

function updateDynamicParams({ isEditMode, shouldReload, lastUserInteraction }) {
  dynamicParamsManager.updateParams({ isEditMode, shouldReload, lastUserInteraction });
}

function displayGroup(groupName) {
  document.getElementById('content').innerHTML = `<h2>${groupName}</h2>`;
}

function hideSettings() {
  document.getElementById('settingsWindow').style.display = 'none';
}

function showSettings() {
  const settingsWindow = document.getElementById('settingsWindow');
  settingsWindow.style.display = 'block';
  displayGroup('generalSettings');
}

function refreshPageIfNeeded(force = false) {
  const { isEditMode, shouldReload, lastUserInteraction } = dynamicParamsManager.getParams();
  const { updateInterval } = settings;
  if (force || !isEditMode && shouldReload && lastUserInteraction > Date.now() - updateInterval) {
    location.reload();
  }
}

function delayForceReload() {
  setTimeout(refreshPageIfNeeded, 3000, true);
}

// Function to backup timers to clipboard
async function backupToClipboard(event) {
  if (event === undefined || (event.ctrlKey && event.key === 'e')) {
    try {

      let backup = {
        timers: timers,
        tagColorMap: {
          data: tagColorMap,
          lastUpdate: localStorage.getItem('tagColorMapLastUpdate'),
        },
        settings: {
          data: settings,
          lastUpdate: localStorage.getItem('settingsLastUpdate'),
        }
      };

      const api = localStorage.getItem('api');
      if (api) {
        // Make API call to save remote data
        const saveApiResponse = await fetch(api + '/timers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(backup),
        });

        if (saveApiResponse.ok) {
          console.log('Remote data saved successfully.');
        } else {
          console.error('Error saving remote data:', saveApiResponse.statusText);
        }
      } else {
        // Copy the combined backup to clipboard
        navigator.clipboard.writeText(JSON.stringify(backup));
      }
    } catch (error) {
      console.error('Error during backup:', error);
    }
  }
}


// Function to load backup from clipboard
async function loadBackupFromClipboard(event) {
  if (event === undefined || (event.ctrlKey && event.key === 'q')) {
    try {
      let backup;
      const api = localStorage.getItem('api');
      if (api) {
        // Make API call to retrieve remote data
        const apiResponse = await fetch(api + '/timers');
        backup = await apiResponse.json();
      } else {
        // Read the backup from clipboard
        const backup_string = await navigator.clipboard.readText();
        backup = JSON.parse(backup_string);
      }

      processBackup(backup);
      processTimers(backup);

      // Reload the page after processing the backup
      location.reload();
    } catch (error) {
      console.error('Error during backup loading:', error);
    }
  }
}


function processTimers(backup) {
  // Compare and update each timer based on startTime
  if (backup.timers && Array.isArray(backup.timers)) {
    backup.timers.forEach((backupTimer) => {
      const existingTimer = timers.find((timer) => timer.timerId === backupTimer.timerId);

      if (existingTimer) {
        // Compare and update based on startTime
        if (backupTimer.startTime > existingTimer.startTime) {
          Object.assign(existingTimer, backupTimer);
        }
      } else {
        // If timer doesn't exist, add it to the timers array
        timers.push(backupTimer);
      }
    });

    // Update localStorage with the modified timers array
    localStorage.setItem('timers', JSON.stringify(timers));
  }
}

function processBackup(backup) {
  // Check and update tagColorMap and settings based on lastUpdate
  if (backup.tagColorMap && backup.tagColorMap.lastUpdate && backup.tagColorMap.lastUpdate > localStorage.getItem('tagColorMapLastUpdate')) {
    localStorage.setItem('tagColorMap', JSON.stringify(backup.tagColorMap));
    localStorage.setItem('tagColorMapLastUpdate', backup.tagColorMap.lastUpdate);
  }

  if (backup.settings && backup.settings.lastUpdate && backup.settings.lastUpdate > localStorage.getItem('settingsLastUpdate')) {
    localStorage.setItem('settings', JSON.stringify(backup.settings));
    localStorage.setItem('settingsLastUpdate', backup.settings.lastUpdate);
  }
}

function createNewTimerEvent(event) {
  // Get the currently focused element
  const focusedElement = document.activeElement;
  if (focusedElement.tagName === 'INPUT') return;
  if (dynamicParamsManager.getParams().isEditMode) return;
  if (event.key === "+") {
    event.preventDefault();
    newTimer();
  }
}

function newTimer() {
  const timerList = document.getElementById('timer-list');
  const timerName = "Timer";
  const durationInput = 60;
  let duration = getDuration(durationInput);
  const startTime = Date.now();
  let timer = {
    timerId: generateRandomId(),
    name: timerName,
    duration: duration,
    startTime: startTime,
    input: durationInput,
    note: '',
    tags: [],
    settings: defaultTimerSettings
  };

  const timerElement = createTimerElement(timer);
  timers.push(timer);
  timerList.appendChild(timerElement);
  saveTimers();
  timerElement.focus();
  timerElement.click();
}

function createTimerElement(timer) {
  const timerElement = document.createElement('div');
  timerElement.className = 'timer';
  timerElement.dataset.timerId = timer.timerId;
  timerElement.tabIndex = 0;

  const durationDisplay = document.createElement('h5');
  durationDisplay.textContent = `${timer.duration}`;
  durationDisplay.style.display = 'none';

  const countdownDisplay = document.createElement('h2');
  const divBottom = document.createElement('div');
  divBottom.className = 'div-bottom';
  const timerName = document.createElement('h5');
  timerName.textContent = timer.name;

  const refreshButton = document.createElement('span');
  refreshButton.className = 'material-symbols-outlined refresh-button';
  refreshButton.innerHTML = 'replay';


  const deleteButton = document.createElement('span');
  deleteButton.className = 'material-symbols-outlined delete-button';
  deleteButton.innerHTML = 'delete';

  if (timer.fixed || !settings.showTimerButtons) {
    refreshButton.style.visibility = 'hidden';
  }

  if (!settings.showTimerButtons) {
    deleteButton.style.visibility = 'hidden';
  }


  const divmain = document.createElement('div');
  divmain.className = 'div-main';

  const divgroup = document.createElement('div');
  divgroup.className = 'vert-timer';

  updateBackgroundImage();

  const divElement = document.createElement('inputDiv');
  divElement.className = 'div-hint';

  const tagContainer = document.createElement('div');
  tagContainer.className = 'tag-container';


  displayNote();

  function displayNote() {
    if (settings.hideAllNotes) {
      divElement.innerHTML = '';
      return;
    }
    let note = '';
    let hour = formatTime(timer.startTime, timer.duration);
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
      + (settings.showInputOnNotes ? ' - ' + timer.input : '')
      + '<br>' + note;
  }

  function updateBackgroundImage() {
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

  const tagsDisplay = document.createElement('div');
  tagsDisplay.className = 'tags-display';

  tagContainer.appendChild(tagsDisplay);

  timerElement.appendChild(divgroup);

  divgroup.appendChild(divmain);
  divgroup.appendChild(divBottom);
  divgroup.appendChild(tagContainer);
  divgroup.appendChild(divElement);

  divmain.appendChild(countdownDisplay);

  divBottom.appendChild(refreshButton);
  divBottom.appendChild(timerName);
  divBottom.appendChild(deleteButton);


  updateTags(timer, tagsDisplay, tagContainer);

  let timerInterval;
  let remainingTime_ms = timer.duration - Date.now() - timer.startTime;
  let notified = false;
  function updateCountdown() {
    remainingTime_ms = timer.duration * 1000 - (Date.now() - timer.startTime);

    if (Math.floor(remainingTime_ms / 1000) === 0 && !notified) {
      let options = { hour: "2-digit", minute: "2-digit" };
      let hora = new Date().toLocaleString("en-us", options);
      showNotification(timerName.textContent + " Done at " + hora);
      notified = true;
      if (timer.fixed || timer.repeat) refreshTimerDelayed();
    }

    if (timer.remainingTime_ms < 10000 && (timer.fixed || timer.repeat)) refreshTimerDelayed();

    let formattedTime = millisecondsToTime(remainingTime_ms, settings.displayTimeFormat);

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


  function padNumber(number, length = 2) {
    return String(Math.abs(number)).padStart(length, '0');
  }



  function startTimer() {
    updateCountdown();
    setInterval(updateCountdown, 50);
  }

  const customPrompt = document.getElementById('customPrompt');
  const prompt = document.getElementById('my-prompt');

  timerElement.addEventListener('click', openPromptHandler);

  timerElement.addEventListener('keypress', function (event) {
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
        refreshTimerDelayed();
        break;

      default:
        break;
    }
  });

  // Delete button functionality
  deleteButton.addEventListener('click', deleteTimer);
  // Refresh button functionality
  refreshButton.addEventListener('click', refreshTimer);

  function refreshTimerDelayed() {
    setTimeout(refreshTimer, 3000);
  }

  function refreshTimer() {
    clearInterval(timerInterval);

    let newDuration = getDuration(timer.input);
    durationDisplay.textContent = `${newDuration}`;
    timer.startTime = Date.now();
    timer.duration = newDuration;
    notified = false;

    startTimer();
    saveTimers();
    delayForceReload();
  }

  function deleteTimer() {
    document.getElementById('timer-list').removeChild(timerElement);
    clearInterval(timerInterval);
    let timerIndex = timers.findIndex(t => t.timerId === timer.timerId);
    if (timerIndex - 1) {
      timers.splice(timerIndex, 1);
      saveTimers();
    }
  }


  function openPromptHandler(event) {
    if (dynamicParamsManager.getParams().isEditMode) return;
    
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
  function openPrompt(initialValue) {
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

  function handlePromptKeydown(event) {
    if (event.ctrlKey && event.key === 'Enter') {
      submitPrompt();
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      submitPrompt();
    }
  }



  function cancelPrompt(event) {
    if (event.key === "Escape" || event.type === "blur") {
      dynamicParamsManager.updateParams({ isEditMode: false });
      customPrompt.style.display = 'none';
      clearListeners();
      selectLastFocusedTimerElement();
    }
  }



  // Updated submitPrompt function to handle notes changes save Edited Timer
  function submitPrompt() {
    const inputValue = prompt.value;

    // Split the input into lines
    const lines = inputValue.split('\n');

    // Extract the first line as the timer duration input
    const durationInput = lines[0].trim();
    let newDuration = getDuration(durationInput);

    //Handle new duration.
    if (!isNaN(newDuration) && newDuration > 0 && newDuration != timer.duration) {
      clearInterval(timerInterval);
      durationDisplay.textContent = `${newDuration}`;
      timer.startTime = Date.now();
      timer.duration = newDuration;
      timer.input = durationInput;
      timer.fixed = timer.input.includes(':');
      const validInputs = ['odd', 'even', 'next'];
      timer.repeat = validInputs.includes(timer.input.toLowerCase());

      updateCountdown();
      saveTimers();
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
    displayNote();
    updateTags(timer, tagsDisplay, tagContainer); // Update the tags display
    updateBackgroundImage();

    updateTimerSettings(timer.note);

    saveTimers();

    customPrompt.style.display = 'none';
    dynamicParamsManager.updateParams({ isEditMode: false })

    clearListeners();
    selectLastFocusedTimerElement();
  }
  function updateTimerSettings() {
    // Regex to find all content after hashtags in the note, allowing spaces
    const tagRegex = /$[a-zA-Z0-9_]+( [a-zA-Z0-9_]+)*/g;
    const matches = timer.note.match(tagRegex);
    timer.settings = { ...timer.settings, ...matches }
  }

  function clearListeners() {
    // Clear previous event listeners
    prompt.removeEventListener('keydown', handlePromptKeydown);
    prompt.removeEventListener("blur", cancelPrompt);
    document.removeEventListener('keydown', cancelPrompt);
  }

  function extractTags(note) {
    // Regex to find all content after hashtags in the note, allowing spaces
    const tagRegex = /#[a-zA-Z0-9_]+( [a-zA-Z0-9_]+)*/g;
    const matches = note.match(tagRegex);
    return matches || [];
  }
  customPrompt.style.display = 'none';
  // Clear event listener after submitting
  prompt.removeEventListener('keydown', handlePromptKeydown);


  displayNote();
  startTimer();
  return timerElement;
}

function saveTimers() {
  localStorage.setItem('timers', JSON.stringify(timers));
}

const defaultTimerSettings = {
  repeat: false,
  rules: [
    { limit: 10, color: '#ff0000', backgroundColor: '#333' },
    { limit: 20, color: '#ffa500', backgroundColor: '#333' },
    { limit: 30, color: '#ffff00', backgroundColor: '#333' },
  ]
};

function loadTimers() {
  const timerList = document.getElementById('timer-list');
  let timersData = [];

  try {
    timersData = JSON.parse(localStorage.getItem('timers')) || [];
  } catch (error) {
    // console.log("Something went wrong with the JSON Parse for Timers. " + error)
  }

  timersData
    .sort(function (a, b) { return (a.duration - Math.floor((Date.now() - a.startTime) / 1000)) - (b.duration - Math.floor((Date.now() - b.startTime) / 1000)) })
    .forEach((timer) => {
      // Add default settings if it doesn't exist
      timer.settings = timer.settings || defaultTimerSettings;

      if (!hasTag(timer)) timer.tags = [];
      const timerElement = createTimerElement(timer);
      timers.push(timer);
      timerList.appendChild(timerElement);
    });
}

function toggleAdvancedSearch() {
  const advancedSearchOptions = document.getElementById('advanced-search-options');
  advancedSearchOptions.style.display = advancedSearchOptions.style.display === 'none' ? 'flex' : 'none';
}

let searchTimer;

function applySearchWithDelay() {
  // Clear previous timer to avoid premature execution
  clearTimeout(searchTimer);

  searchTimer = setTimeout(applySearch, 500);
}

function applySearch(filterTag) {
  const searchInputValue = searchInput.value.toLowerCase();

  if (searchInputValue.startsWith('/')) {
    executeCommand(searchInput.value);
    return
  }


  const timerElements = document.getElementsByClassName('timer');
  const minRemaining = getDuration(document.getElementById('min-remaining').value);
  const maxRemaining = getDuration(document.getElementById('max-remaining').value);

  Array.from(timerElements).forEach(timerElement => {
    if (timerElement.style.display === 'none' && searchInputValue !== '' || filterTag) return;
    const timer = timers.find(timer => timer.timerId === timerElement.dataset.timerId);
    const tags_text = timer.tags === undefined ? '' : timer.tags.join(' ');
    const timerText = `${timer.name} ${timer.note} ${timer.input} ${tags_text}`.toLowerCase();

    const remainingSeconds = timer.duration - Math.floor(Date.now() - timer.startTime) / 1000;

    // Check if the timer's text contains the search input and is within the remaining time range
    const meetsSearchCriteria = timerText.includes(searchInputValue);
    const meetsMinTimeCriteria = minRemaining === "" || minRemaining <= remainingSeconds;
    const meetsMaxTimeCriteria = maxRemaining === "" || remainingSeconds <= maxRemaining;

    timerElement.style.display = meetsSearchCriteria && meetsMinTimeCriteria && meetsMaxTimeCriteria ? 'flex' : 'none';
  });
}

function hasTag(timer) {
  return timer.tags !== undefined && timer.tags.length !== 0;
}



// Inside the updateTags function, after generating a new tag
function updateTags(timer, tagsDisplay, tagContainer) {
  // Code to update tags display
  tagsDisplay.innerHTML = '';

  // Add existing tags to the tags display
  timer.tags.forEach(tag => {
    const tagElement = document.createElement('span');
    tagElement.className = 'tag';
    tagElement.textContent = tag.substring(1);
    if (tagColorMap[tag] === undefined) getRandomColor(tag);
    tagElement.style.backgroundColor = tagColorMap[tag].backgroundColor;
    tagElement.style.color = tagColorMap[tag].fontColor;
    tagsDisplay.appendChild(tagElement);

    // Add event listener to the tag icon for showing/hiding timers with the same tag
    tagElement.addEventListener('click', function () {
      toggleTaggedTimers(tag);
    });

    // Add event listener for changing the tag color
    tagElement.addEventListener('contextmenu', function (event) {
      event.preventDefault();
      showColorPicker(event, tag);
    });

    tagContainer.style.display = '';
  });
  if (!hasTag(timer)) {
    tagContainer.style.display = 'none';
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


// Add an event listener to the document to handle clicks outside the color picker
document.addEventListener('click', function (event) {
  const colorPicker = document.getElementById('colorPicker');
  if (colorPicker && !colorPicker.contains(event.target)) {
    colorPicker.remove();
  }
});

function showColorPicker(event, tag) {
  // Remove any existing color pickers
  const existingColorPicker = document.getElementById('colorPickerContainer');
  if (existingColorPicker) {
    existingColorPicker.remove();
  }

  // Create a container div for the color picker and confirm button
  const colorPickerContainer = document.createElement('div');

  colorPickerContainer.id = 'colorPickerContainer';
  colorPickerContainer.style.position = 'absolute';
  colorPickerContainer.style.left = `${event.pageX}px`;
  colorPickerContainer.style.top = `${event.pageY}px`;

  // Create a color picker element
  const colorPicker = document.createElement('input');
  colorPicker.type = 'color';
  colorPicker.id = 'colorPicker';

  // Set initial color based on stored color or a default color
  const storedColor = tagColorMap[tag].backgroundColor;
  colorPicker.value = storedColor || '#000000';

  // Add event listener for color changes
  colorPicker.addEventListener('input', function () {
    // Save the selected color to local storage
    tagColorMap[tag].backgroundColor = colorPicker.value;
  });

  // Create a span for the confirm button
  const confirmButton = document.createElement('span');
  confirmButton.id = 'colorPickerConfirm';
  confirmButton.className = 'material-symbols-outlined';
  confirmButton.innerHTML = 'check';
  confirmButton.addEventListener('click', function () {
    // Save the selected color to local storage
    tagColorMap[tag].backgroundColor = colorPicker.value;
    // Remove the color picker container from the document
    colorPickerContainer.remove();
    // Save the color map to local storage
    saveColorMap();
    // Reload the page
    location.reload();
  });

  // Append the color picker and confirm button to the container
  colorPickerContainer.appendChild(colorPicker);
  colorPickerContainer.appendChild(confirmButton);

  // Append the container to the document body
  document.body.appendChild(colorPickerContainer);

  function colorConfirmHandler(event) {
    if (event.key === 'Enter') {
      // Save the selected color to local storage
      tagColorMap[tag].backgroundColor = colorPicker.value;
      // Remove the color picker container from the document
      colorPickerContainer.remove();
      // Save the color map to local storage
      saveColorMap();
      // Reload the page
      location.reload();
    }
  }

  // Add event listener for confirming with Enter key
  document.addEventListener('keypress', colorConfirmHandler);
}


let filterTag = "";

function toggleTaggedTimers(tag) {
  applySearch();
  const timerElements = document.getElementsByClassName('timer');
  if (filterTag === tag) {
    Array.from(timerElements).forEach(timerElement => {
      timerElement.style.display = 'flex';
    });
    filterTag = "";
  } else {
    Array.from(timerElements).forEach(timerElement => {
      const timer = timers.find(timer => timer.timerId === timerElement.dataset.timerId);
      if (!hasTag(timer) || hasTag(timer) && !timer.tags.includes(tag) && timerElement.style.display === 'flex') {
        timerElement.style.display = 'none';
      }
    });
    filterTag = tag;
  }
  applySearch(filterTag);
}


// Add an event listener to the document to handle clicks outside the color picker and confirm button
document.addEventListener('click', function (event) {
  const colorPickerContainer = document.getElementById('colorPickerContainer');
  if (colorPickerContainer && !colorPickerContainer.contains(event.target)) {
    colorPickerContainer.remove();
  }
});

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

function focusSearchBar(event) {
  if (event.ctrlKey && event.key === 'f') {
    event.preventDefault();
    searchInput.focus();
    searchInput.select();
  }
  if (event.ctrlKey && event.key === '/') {
    searchInput.focus();
    searchInput.value = '/';
  }

}

function updateButtonVisibility() {


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

function executeCommand(command) {

  toggleSetting(command, 'ShowTimerButtons', '', delayForceReload);
  toggleSetting(command, 'ShowBottomMenu', '', delayForceReload);
  toggleSetting(command, 'ShowNotificationCommand', 'Notifications back online!');
  toggleSetting(command, 'ResultToSearchInput', 'Command results back to the Search bar.');
  toggleSetting(command, 'ClearSearchInput', 'The input was cleared, believe me.');
  toggleSetting(command, 'HideAllNotes', '', delayForceReload);
  toggleSetting(command, 'ShowStartTimeOnNotes', '', delayForceReload);
  toggleSetting(command, 'ShowInputOnNotes', '', delayForceReload);

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

function bindAutoCompleteCommands() {
  var tribute = new Tribute({
    trigger: "/",
    values: options.sort((a, b) => a.value.localeCompare(b.value)),
    selectTemplate: function (item) {
      if(item === undefined) return '';
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
];