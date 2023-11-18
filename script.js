const timers = [];
let isEditMode = false;
let shouldReload = false;
let lastCountdownAdded;


function initializePage() {
  updateSettings(settings);
  setInterval(refreshPageIfNeeded, settings.updateInterval);
  loadTimers();
  tribute = bindTribute();
  document.addEventListener('keydown', backupToClipboard);
  document.addEventListener('keydown', loadBackupFromClipboard);
  document.addEventListener('keydown', createNewTimerEvent);
  document.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.key === " ") {
      event.preventDefault();
    }
  });

}

// Add an event listener to the document for the 'keydown' event
document.addEventListener('keydown', function (event) {
  // Check if the pressed key is the 'Tab' key (key code 9)
  if (event.key === 'Tab') {

    // Get the currently focused element
    const focusedElement = document.activeElement;

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

function calculateNumberOfElementsInLine(container) {
  // Get the width of the container
  const containerWidth = container.clientWidth;

  // Get the width of the first focusable element (assuming all elements have the same width)
  const elementWidth = document.querySelector('[tabindex]').clientWidth;

  // Calculate the number of elements that can fit in a line
  const numberOfElementsInLine = Math.floor(containerWidth / elementWidth);

  return numberOfElementsInLine;
}

document.addEventListener('keydown', function (event) {
  if(isEditMode) return;
  const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

  // Check if the pressed key is an arrow key
  if (arrowKeys.includes(event.key)) {
    // Prevent the default arrow key behavior to handle it manually
    event.preventDefault();

    // Get the currently focused element
    const focusedElement = document.activeElement;

    // Find all focusable elements on the page
    const focusableElements = Array.from(document.querySelectorAll('a, button, input, select, textarea, [tabindex]'))
      .filter(element => !element.hasAttribute('disabled'));

    // Find the index of the currently focused element in the array
    const currentIndex = focusableElements.indexOf(focusedElement);

    // Get the container element for layout calculations
    const container = document.querySelector('.timer-container');

    // Calculate the number of elements in a line dynamically
    const numberOfElementsInLine = calculateNumberOfElementsInLine(container);


    // Calculate the index of the next or previous focusable element
    let nextIndex;
    switch (event.key) {
      case 'ArrowDown':
        nextIndex = (currentIndex + numberOfElementsInLine) % focusableElements.length;
        break;
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % focusableElements.length;
        break;
      case 'ArrowUp':
        nextIndex = (currentIndex - numberOfElementsInLine + focusableElements.length) % focusableElements.length;
        break;
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length;
        break;
      default:
        break;
    }

    // Focus on the next or previous focusable element
    focusableElements[nextIndex].focus();

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



const settings = loadSettings();

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
    return JSON.parse(localStorage.getItem('settings')) || {};
  } catch (error) {
    return {
      updateInterval: 60000,
    };
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

const customKeywordsMap = loadCustomKeywordsMap();

function loadCustomKeywordsMap() {
  try {
    return JSON.parse(localStorage.getItem('customKeywordsMap')) || {};
  } catch (error) {
    return {};
  }
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
function updateSettings(settings) {
  // Load settings online if the API is enabled.
}

function refreshPageIfNeeded() {
  const { isEditMode, shouldReload, lastUserInteraction } = dynamicParamsManager.getParams();
  const { updateInterval } = settings;
  if (!isEditMode && shouldReload && lastUserInteraction > Date.now() - updateInterval) {
    location.reload();
  }
}
function backupToClipboard(event) {
  if (event === undefined || (event.ctrlKey && event.key === 'e')) {
    let backupTimers = timers.map(timer => {
      // Include startTime in the timer backup
      return {
        id: timer.id,
        name: timer.name,
        input: timer.input,
        note: timer.note,
        startTime: timer.startTime,
        // Add any other properties you want to include in the backup
      };
    });

    let backup = {
      timers: backupTimers,
      tagColorMap: {
        data: tagColorMap,
        lastUpdate: localStorage.getItem('tagColorMapLastUpdate'),
      },
      settings: {
        data: settings,
        lastUpdate: localStorage.getItem('settingsLastUpdate'),
      }
    };

    navigator.clipboard
      .writeText(JSON.stringify(backup));
  }
}
function loadBackupFromClipboard(event) {
  if (event === undefined || (event.ctrlKey && event.key === 'q')) {
    navigator.clipboard
      .readText()
      .then((backup_string) => {
        let backup = JSON.parse(backup_string);

        // Check and update tagColorMap and settings based on lastUpdate
        if (backup.tagColorMap && backup.tagColorMap.lastUpdate && backup.tagColorMap.lastUpdate > localStorage.getItem('tagColorMapLastUpdate')) {
          localStorage.setItem('tagColorMap', JSON.stringify(backup.tagColorMap));
          localStorage.setItem('tagColorMapLastUpdate', backup.tagColorMap.lastUpdate);
        }

        if (backup.settings && backup.settings.lastUpdate && backup.settings.lastUpdate > localStorage.getItem('settingsLastUpdate')) {
          localStorage.setItem('settings', JSON.stringify(backup.settings));
          localStorage.setItem('settingsLastUpdate', backup.settings.lastUpdate);
        }

        // Compare and update each timer based on startTime
        if (backup.timers && Array.isArray(backup.timers)) {
          backup.timers.forEach((backupTimer) => {
            const existingTimer = timers.find((timer) => timer.id === backupTimer.id);

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

        // Reload the page after processing the backup
        location.reload();
      });
  }
}

function createNewTimerEvent(event) {
  if (event.ctrlKey && event.key === "+") {
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
  const repeat = false;
  let timer = {
    timerId: generateRandomId(),
    name: timerName,
    duration: duration,
    startTime: startTime,
    input: durationInput,
    note: '',
    tags: [],
    repeat: repeat
  };

  const timerElement = createTimerElement(timer);
  timers.push(timer);
  timerList.appendChild(timerElement);
  saveTimers();
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

  if (timer.fixed) {
    refreshButton.style.visibility = 'hidden';
  }

  const deleteButton = document.createElement('span');
  deleteButton.className = 'material-symbols-outlined delete-button';
  deleteButton.innerHTML = 'delete';

  const divmain = document.createElement('div');
  divmain.className = 'div-main';

  const divgroup = document.createElement('div');
  divgroup.className = 'vert-timer';

  updateBackgroundImage();

  const divElement = document.createElement('inputDiv');
  divElement.className = 'div-hint';

  const tagContainer = document.createElement('div');
  tagContainer.className = 'tag-container';


  let displayTimeout;
  let updateTimeout;

  timerElement.addEventListener('mouseenter', function () {
    clearTimeout(updateTimeout); // Clear update timeout if it was set
    displayTimeout = setTimeout(displayNote, 2000);
  });

  timerElement.addEventListener('mouseout', function (event) {
    // Check if the mouse is leaving the timerElement and not just entering a child element
    if (!timerElement.contains(event.relatedTarget || event.toElement)) {
      clearTimeout(displayTimeout);
      updateTimeout = setTimeout(updateNote, 2000);
    }
  });

  function displayNote() {
    let note = '';
    let hour = formatTime(timer.startTime, timer.duration);
    if (timer.note !== '' && timer.note !== undefined && timer.note !== 'undefined') {
      let noteLines = timer.note.split("\n");
      for (let line of noteLines) {
        if (!line.trim().startsWith("img=")
          && !line.trim().startsWith("#")
          && !line.trim().startsWith("!")
        ) {
          note += line.trim() + '<br>';
        }
      }
    }
    divElement.innerHTML = ''
      + hour.startTime + ' / ' + hour.endTime + ' - ' + timer.input + '<br>'
      + note;
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
  let currentClass = ""; // Initialize with an empty class
  let notified = false;
  function updateCountdown(displayTimeFormat = "hhmmss") {
    remainingTime_ms = timer.duration * 1000 - (Date.now() - timer.startTime);

    if (Math.floor(remainingTime_ms / 1000) === 0 && !notified) {
      let options = { hour: "2-digit", minute: "2-digit" };
      let hora = new Date().toLocaleString("en-us", options);
      showNotification(timerName.textContent + " Done at " + hora);
      notified = true;
      if (timer.fixed) refreshTimer();
    }

    let formattedTime = millisecondsToTime(remainingTime_ms, displayTimeFormat);

    countdownDisplay.textContent = formattedTime;

    let percentage = (remainingTime_ms / (timer.duration * 1000)) * 100;

    // Calculate the new class based on percentage
    let newClass = "-normal";
    if (percentage < 10) {
      newClass = "-danger";
    } else if (percentage < 25) {
      newClass = "-alert";
    } else if (percentage < 50) {
      newClass = "-attention";
    }

    // Update the class only if it has changed
    if (newClass !== currentClass) {
      countdownDisplay.className = "countdown-display" + newClass;
      currentClass = newClass; // Update the current class
    }
  }

  function millisecondsToTime(milliseconds, format = "hhmmss") {
    let negative = milliseconds < 0

    let absMilliseconds = Math.abs(milliseconds);
    let totalSeconds = Math.floor(absMilliseconds / 1000);
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;
    let millisecondsRemainder = absMilliseconds % 1000;

    let formattedTime = "";

    if (format === "hhmmss") {
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

      default:
        break;
    }
  });

  // Delete button functionality
  deleteButton.addEventListener('click', deleteTimer);
  // Refresh button functionality
  refreshButton.addEventListener('click', refreshTimer);

  function refreshTimer() {
    clearInterval(timerInterval);

    let newDuration = getDuration(timer.input);
    durationDisplay.textContent = `${newDuration}`;
    timer.startTime = Date.now();
    timer.duration = newDuration;
    timer.fixed = timer.input.includes(':');
    notified = false;

    startTimer();
    saveTimers();
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
    if (isEditMode) return;
    isEditMode = true;
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
    isEditMode = true;
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
      isEditMode = false;
      customPrompt.style.display = 'none';
      clearListeners();
      selectLastFocusedTimerElement();
    }
  }



  // Updated submitPrompt function to handle notes changes
  function submitPrompt() {
    const inputValue = prompt.value;

    // Split the input into lines
    const lines = inputValue.split('\n');

    // Extract the first line as the timer duration input
    const durationInput = lines[0].trim();
    let newDuration = getDuration(durationInput);

    if (!isNaN(newDuration) && newDuration > 0 && newDuration != timer.duration) {
      clearInterval(timerInterval);
      durationDisplay.textContent = `${newDuration}`;
      timer.startTime = Date.now();
      timer.duration = newDuration;
      timer.input = durationInput;
      timer.repeat = false;

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
    updateNote();
    updateTags(timer, tagsDisplay, tagContainer); // Update the tags display

    updateBackgroundImage();
    saveTimers();

    customPrompt.style.display = 'none';
    isEditMode = false;

    clearListeners();
    selectLastFocusedTimerElement();
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
  isEditMode = false;


  updateNote();

  function updateNote() {
    let note = '';
    if (timer.note !== '' && timer.note !== undefined && timer.note !== 'undefined') {
      let noteLines = timer.note.split("\n");
      for (let line of noteLines) {
        if (line.trim().startsWith("!")) {
          note += line.substring(1).trim() + '<br>';
        }
      }
    }
    divElement.innerHTML = note; // Show the formatted note
  }



  startTimer();
  return timerElement;
}

function saveTimers() {
  localStorage.setItem('timers', JSON.stringify(timers));
}

function loadTimers() {
  const timerList = document.getElementById('timer-list');
  let timersData = []
  try {
    timersData = JSON.parse(localStorage.getItem('timers')) || [];
  } catch (error) {
    // console.log("Something went wrong with the JSON Parse for Timers. " + error)
  }

  timersData
    .sort(function (a, b) { return (a.duration - Math.floor((Date.now() - a.startTime) / 1000)) - (b.duration - Math.floor((Date.now() - b.startTime) / 1000)) })
    .forEach((timer) => {
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

function applySearch() {
  const searchInput = document.getElementById('search-input').value.toLowerCase();
  const timerElements = document.getElementsByClassName('timer');
  const minRemaining = getDuration(document.getElementById('min-remaining').value);
  const maxRemaining = getDuration(document.getElementById('max-remaining').value);

  Array.from(timerElements).forEach(timerElement => {
    if (timerElement.style.display === 'none' && searchInput !== '') return;
    const timer = timers.find(timer => timer.timerId === timerElement.dataset.timerId);
    const tags_text = timer.tags === undefined ? '' : timer.tags.join(' ');
    const timerText = `${timer.name} ${timer.note} ${timer.input} ${tags_text}`.toLowerCase();

    const remainingSeconds = timer.duration - Math.floor(Date.now() - timer.startTime) / 1000;

    // Check if the timer's text contains the search input and is within the remaining time range
    const meetsSearchCriteria = timerText.includes(searchInput);
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
}


// Add an event listener to the document to handle clicks outside the color picker and confirm button
document.addEventListener('click', function (event) {
  const colorPickerContainer = document.getElementById('colorPickerContainer');
  if (colorPickerContainer && !colorPickerContainer.contains(event.target)) {
    colorPickerContainer.remove();
  }
});


