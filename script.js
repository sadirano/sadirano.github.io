const timers = [];
let editMode = false;
let reload = false;
let lastCountdownAdded;
const settings = {
  updateInterval: 60000
}

const dynamicParamsManager = (function () {
  let dynamicParams = {
    editMode: false,
    reload: false,
    lastUserInteraction: Date.now(),
  };

  function updateParams({ editMode, reload, lastUserInteraction }) {
    dynamicParams.editMode = editMode !== undefined ? editMode : dynamicParams.editMode;
    dynamicParams.reload = reload !== undefined ? reload : dynamicParams.reload;
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

// Function to be called by setInterval
function intervalCallback() {
  const { editMode, reload, lastUserInteraction } = dynamicParamsManager.getParams();
  refreshPage(editMode, reload, lastUserInteraction);
}


document.addEventListener('DOMContentLoaded', function () {
  updateSettings(settings);
  setInterval(intervalCallback, settings.updateInterval);
  loadTimers();
  document.addEventListener('keydown', pasteTimers);
  document.addEventListener('keydown', copyTimers);
  document.addEventListener('keydown', createNewTimerEvent);

});

// Add the new functions for settings
function showGroup(groupName) {
  // Load settings content dynamically
  document.getElementById('content').innerHTML = `<h2>${groupName}</h2>`;
}

function closeSettings() {
  // Hide settings window
  document.getElementById('settingsWindow').style.display = 'none';
}

function openSettings() {
  // Display settings window
  document.getElementById('settingsWindow').style.display = 'block';
  // Show the default settings group on open
  showGroup('generalSettings');
}

function updateSettings(settings) {
  //load settings online if Api is enabled.
}

function refreshPage() {
  if (!editMode && reload && lastUserInteraction > Date.now() - settings.updateInterval) {
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
  let timer = { timerId: generateRandomId(), name: timerName, duration: duration, startTime, input: durationInput, note: '' }

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

  timerElement.addEventListener('mouseout',updateNote);

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


  timerElement.appendChild(divgroup);

  divgroup.appendChild(divmain);
  divgroup.appendChild(divBottom);
  divgroup.appendChild(divElement);

  divmain.appendChild(countdownDisplay);

  divBottom.appendChild(refreshButton);
  divBottom.appendChild(timerName);
  divBottom.appendChild(deleteButton);

  let timerInterval;
  let remainingTime = timer.duration - Math.floor((Date.now() - timer.startTime) / 1000);
  let currentClass = ""; // Initialize with an empty class

  function updateCountdown() {
    remainingTime = timer.duration - Math.floor((Date.now() - timer.startTime) / 1000);
    if (remainingTime === 0) {
      let options = { hour: "2-digit", minute: "2-digit" };
      let hora = new Date().toLocaleString("en-us", options)
      showNotification(timerName.textContent + " Done at " + hora)
    }
    countdownDisplay.textContent = remainingTime;

    let percentage = (remainingTime / timer.duration) * 100;
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

  function startTimer() {
    updateCountdown();
    setInterval(updateCountdown, 330);
  }

  const customPrompt = document.getElementById('customPrompt');
  const prompt = document.getElementById('prompt');
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


  // Updated openPrompt function to handle multiline notes input
  function openPrompt(initialValue, elementToUpdate) {
    editMode = true;
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
    if ((event.key === 'Enter' && !event.shiftKey ) || event.key === 'Tab') {
      submitPrompt();
    }
  }

  function cancelPrompt(event) {
    if (event.key === "Escape" || event.type === "blur") {
      editMode = false;
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
        timer.note = newNote;
        updateNote(1);
        updateBackgroundImage()
        saveTimers();
        break;

      default:
    }

    customPrompt.style.display = 'none';
    editMode = false;
  }

  customPrompt.style.display = 'none';
  // Clear event listener after submitting
  prompt.removeEventListener('keydown', handlePromptKeydown);
  editMode = false;

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
          note += line.substring(1).trim() +'<br>';
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

    updateCountdown();
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
    .forEach((timerData) => {
      const timerId = timerData.timerId;
      const startTime = timerData.startTime;
      const timer = { timerId, name: timerData.name, duration: timerData.duration, startTime, input: timerData.input, note: timerData.note };
      const timerElement = createTimerElement(timer);
      timers.push(timer);
      timerList.appendChild(timerElement);
    });
}


