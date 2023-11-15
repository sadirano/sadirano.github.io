const timers = [];
let isEditMode = false;
let shouldReload = false;
let lastCountdownAdded;
const settings = {
  updateInterval: 60000,
};

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

function initializePage() {
  updateSettings(settings);
  setInterval(refreshPageIfNeeded, settings.updateInterval);
  loadTimers();
  document.addEventListener('keydown', pasteTimers);
  document.addEventListener('keydown', copyTimers);
  document.addEventListener('keydown', createNewTimerEvent);
}

document.addEventListener('DOMContentLoaded', initializePage);


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
function pasteTimers(event) {
  if (event.ctrlKey && event.key === 'e') {
    event.preventDefault();
    navigator.clipboard
      .writeText(localStorage.getItem('timers'));
  }
}

function copyTimers(event) {
  if (event.ctrlKey && event.key === 'q') {
    event.preventDefault();
    navigator.clipboard
      .readText()
      .then(
        (clipText) => (localStorage.setItem('timers', clipText))
      );
    refreshPage()
  }
}


function createNewTimerEvent(event) {
  if (event.ctrlKey && event.key === "Enter") {
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
    tags: []
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

  const durationDisplay = document.createElement('h5');
  durationDisplay.textContent = `${timer.duration}`;
  durationDisplay.style.display = 'none';

  const countdownDisplay = document.createElement('h2');
  const divBottom = document.createElement('div');
  divBottom.className = 'div-bottom';
  const timerName = document.createElement('h5');
  timerName.textContent = timer.name;

  const deleteButton = document.createElement('button');
  deleteButton.innerHTML = '&#10006;';
  deleteButton.className = 'icon-button delete-button';

  const refreshButton = document.createElement('button');
  refreshButton.innerHTML = '&#8634;';
  refreshButton.className = 'icon-button refresh-button';

  const divmain = document.createElement('div');
  divmain.className = 'div-main';

  const divgroup = document.createElement('div');
  divgroup.className = 'vert-timer';

  updateBackgroundImage();

  const divElement = document.createElement('inputDiv');
  divElement.className = 'div-hint';

  const tagContainer = document.createElement('div');
  tagContainer.className = 'tag-container';


  timerElement.addEventListener('mouseover', function () {
    let note = '';
    let hour = formatTime(timer.startTime, timer.duration);
    if (timer.note !== '' && timer.note !== undefined && timer.note !== 'undefined') {
      let noteLines = timer.note.split("\n");
      for (let line of noteLines) {
        if (!line.trim().startsWith("img=")) { //ignore only the img config
          note += line.trim() + '<br>';
        }
      }
    }
    divElement.innerHTML = ''
      + hour.startTime + ' / ' + hour.endTime + ' - ' + timer.input + '<br>'
      + note;
  });

  timerElement.addEventListener('mouseout', updateNote);

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

  function updateTags() {
    // Code to update tags display
    tagsDisplay.innerHTML = '';
    // Add existing tags to the tags display
    timer.tags.forEach(tag => {
      const tagElement = document.createElement('span');
      tagElement.className = 'tag';
      tagElement.textContent = tag;
      tagsDisplay.appendChild(tagElement);
      // Add event listener to the tag icon for showing/hiding timers with the same tag
      tagElement.addEventListener('click', function () {
        toggleTaggedTimers(tag);
      });
    });
    if (!hasTag(timer)) {
      tagContainer.style.display = 'none';
    }
  }

  updateTags();

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
    }

    let formattedTime = millisecondsToTime(remainingTime_ms, displayTimeFormat);

    countdownDisplay.textContent = formattedTime;

    let percentage = (remainingTime_ms / timer.duration * 1000) * 100;

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
    let totalSeconds = Math.floor(milliseconds / 1000);
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;
    let millisecondsRemainder = milliseconds % 1000;

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
    if (milliseconds < 0) formattedTime = '-' + formattedTime;

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
  const promptType = document.getElementById('promptType');

  timerName.addEventListener('click', function () {
    openPrompt(timer.name, "name");
  });

  countdownDisplay.addEventListener('click', function () {
    openPrompt(timer.input, "duration");
  });

  divElement.addEventListener('click', function () {
    openPrompt(timer.note, "note");
  });

  function getAllTags() {
    const allTags = new Set();

    timers.forEach(timer => {
        timer.tags.forEach(tag => {
          allTags.add(tag);
        });
    });

    return Array.from(allTags);
  }

  // Updated openPrompt function to handle multiline notes input
  function openPrompt(initialValue, elementToUpdate) {
    isEditMode = true;
    customPrompt.style.display = 'flex';
    promptType.value = elementToUpdate;

    // Clear previous event listeners
    prompt.removeEventListener('keydown', handlePromptKeydown);
    prompt.removeEventListener("blur", cancelPrompt);
    document.removeEventListener('keydown', cancelPrompt);

    //    prompt.textContent = initialValue;
    prompt.value = initialValue;

    // Create a textarea for notes input
    if (elementToUpdate === "note") {
      prompt.rows = 5; // Set the number of rows as needed
      // Initialize autocomplete for tags
      const tags = getAllTags();
      const tagInput = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.whitespace,
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        local: tags,
      });

      tagInput.initialize();

      $('#prompt').typeahead(
        {
          hint: true,
          highlight: true,
          minLength: 1,
        },
        {
          name: 'tags',
          source: tagInput.ttAdapter(),
        }
      );

    } else {
      prompt.rows = 1;
    }

    prompt.addEventListener('keydown', handlePromptKeydown);
    // Add new event listeners
    prompt.addEventListener("blur", cancelPrompt);
    document.addEventListener('keydown', cancelPrompt);

    customPrompt.appendChild(prompt);
    prompt.focus();
    prompt.select();
  }

  function handlePromptKeydown(event) {
    if ((event.key === 'Enter' && !event.shiftKey) || event.key === 'Tab') {
      submitPrompt();
    }
  }

  function cancelPrompt(event) {
    if (event.key === "Escape" || event.type === "blur") {
      isEditMode = false;
      customPrompt.style.display = 'none';
      prompt.removeEventListener('keydown', handlePromptKeydown);
    }
  }

  // Updated submitPrompt function to handle notes changes
  function submitPrompt() {
    switch (promptType.value) {
      case "name":
        const newTimerName = prompt.value;
        if (newTimerName !== null && newTimerName !== '') {
          timerName.textContent = newTimerName;

          timer.name = newTimerName;
          saveTimers();
        }
        break;
      case "duration":
        const durationInput = prompt.value;

        let newDuration = getDuration(durationInput);

        if (!isNaN(newDuration) && newDuration > 0) {
          clearInterval(timerInterval);
          durationDisplay.textContent = `${newDuration}`;
          timer.startTime = Date.now();
          timer.duration = newDuration;
          timer.input = durationInput;

          updateCountdown();
          saveTimers();
          startTimer();
          openPrompt(timerName.textContent, "name");

          if (timerName.textContent === "Timer") {
            openPrompt(timerName.textContent, "name");
          }
        }
        break;
      case "note":
        const newNote = prompt.value;
        // Extract tags from the note and update the timer tags
        const newTags = extractTags(newNote);
        timer.tags = newTags;
        timer.note = newNote;
        updateNote(1);
        updateTags(); // Update the tags display
        updateBackgroundImage()
        saveTimers();
        break;

      default:
    }

    customPrompt.style.display = 'none';
    isEditMode = false;
  }

  function extractTags(note) {
    // Regex to find all content after hashtags in the note
    const tagRegex = /#(.+?(?=\n|\r\n|$))/g;
    const matches = note.match(tagRegex);
    return matches || [];
  }

  function toggleTaggedTimers(tag) {
    const timerElements = document.getElementsByClassName('timer');
    Array.from(timerElements).forEach(timerElement => {
      const timer = timers.find(timer => timer.timerId === timerElement.dataset.timerId);
      if (hasTag(timer) && timer.tags.includes(tag)) {
        timerElement.style.display = timerElement.style.display === 'none' ? 'none' : 'flex';
      } else {
        timerElement.style.display = timerElement.style.display === 'none' ? 'flex' : 'none';
      }
    });
  }

  customPrompt.style.display = 'none';
  // Clear event listener after submitting
  prompt.removeEventListener('keydown', handlePromptKeydown);
  isEditMode = false;

  // Delete button functionality
  deleteButton.addEventListener('click', function () {
    document.getElementById('timer-list').removeChild(timerElement);
    clearInterval(timerInterval);
    let timerIndex = timers.findIndex(t => t.timerId === timer.timerId);
    if (timerIndex - 1) {
      timers.splice(timerIndex, 1);
      saveTimers();
    }
  });

  updateNote();
  function updateNote(event) {
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


  // Refresh button functionality
  refreshButton.addEventListener('click', function () {
    clearInterval(timerInterval);

    let newDuration = getDuration(timer.input);
    durationDisplay.textContent = `${newDuration}`;
    timer.startTime = Date.now();
    timer.duration = newDuration;
    notified = false;

    startTimer();
    saveTimers();
  });

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
      if(!hasTag(timer)) timer.tags = [];
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
  const minRemaining = parseInt(document.getElementById('min-remaining').value) || 0;
  const maxRemaining = parseInt(document.getElementById('max-remaining').value) || Infinity;

  Array.from(timerElements).forEach(timerElement => {
    const timer = timers.find(timer => timer.timerId === timerElement.dataset.timerId);
    const tags_text = timer.tags === undefined ? '' : timer.tags.join(' ');
    const timerText = `${timer.name} ${timer.note} ${timer.input} ${tags_text}`.toLowerCase();

    // Check if the timer's text contains the search input and is within the remaining time range
    const meetsSearchCriteria = timerText.includes(searchInput);
    const meetsTimeCriteria = minRemaining <= timer.duration && timer.duration <= maxRemaining;

    timerElement.style.display = meetsSearchCriteria && meetsTimeCriteria ? 'flex' : 'none';
  });
}

function hasTag(timer) {
  return timer.tags !== undefined && timer.tags.length !== 0;
}
