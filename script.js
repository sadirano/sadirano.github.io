const timers = [];
let editMode = false;
let lastCountdownAdded;

document.addEventListener('DOMContentLoaded', function () {
  setInterval(refreshPage, 60000);
  loadTimers();
  document.addEventListener('keydown', pasteTimers);
  document.addEventListener('keydown', copyTimers);
  document.addEventListener('keydown', createNewTimer);
});

function refreshPage() {
  if(!editMode) {
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


function createNewTimer(event) {
  if (event.ctrlKey && event.key === "Enter") {
    const timerList = document.getElementById('timer-list');
    const timerName = "Timer";
    const timerDurationInput = 60;
    let timerDuration = getDuration(timerDurationInput);
    const startTime = Date.now();

    const timerElement = createTimerElement(generateRandomId(), timerName, timerDuration, startTime, true);
    timers.push({ timerId: timerElement.dataset.timerId, name: timerName, duration: timerDuration, startTime, input: timerDurationInput, note: '' });
    timerList.appendChild(timerElement);
    saveTimers();
  }
}

function createTimerElement(timerId, name, timerDuration, startTime) {
  const timerElement = document.createElement('div');
  timerElement.className = 'timer';
  timerElement.dataset.timerId = timerId;


  const timerDurationDisplay = document.createElement('h5');
  timerDurationDisplay.textContent = `${timerDuration}`;
  timerDurationDisplay.style.display = 'none';

  const countdownDisplay = document.createElement('h2');
  const divBottom = document.createElement('div');
  divBottom.className = 'div-bottom';
  const timerName = document.createElement('h5');
  timerName.textContent = name;

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

  const divElement = document.createElement('inputDiv');
  divElement.className = 'div-hint';

  timerElement.addEventListener('mouseover', function () {
    let t = timers[getIndex(timerElement)];
    let hour = formatTime(t.startTime, t.duration);
    let note = '';
    if(t.note !== '' && t.note !== undefined && t.note !== 'undefined') {
      note = '<br>' 
      + t.note 
    } 
    divElement.innerHTML = '' 
    + hour.startTime + ' / ' + hour.endTime
    + '<br>' 
    + t.input 
    + note;
  });

  timerElement.addEventListener('mouseout', function () {
    divElement.innerHTML = ''; // Clear the text when not hovering
  });

  timerElement.appendChild(divgroup);

  divgroup.appendChild(divmain);
  divgroup.appendChild(divBottom);
  divgroup.appendChild(divElement);

  divmain.appendChild(countdownDisplay);

  divBottom.appendChild(deleteButton);
  divBottom.appendChild(timerName);
  divBottom.appendChild(refreshButton);

  let timerInterval;
  let remainingTime = timerDuration - Math.floor((Date.now() - startTime) / 1000);

  function updateCountdown() {
    remainingTime = timerDuration - Math.floor((Date.now() - startTime) / 1000);
    if (remainingTime === 0) {
      let options = { hour: "2-digit", minute: "2-digit" };
      let hora = new Date().toLocaleString("en-us", options)
      showNotification(timerName.textContent + " Done at " + hora)
    }
    countdownDisplay.textContent = remainingTime;
  }

  function startTimer() {
    updateCountdown();
    timerInterval = setInterval(updateCountdown, 1000);
  }

  const customPrompt = document.getElementById('customPrompt');
  const promptInput = document.getElementById('promptInput');
  const promptType = document.getElementById('promptType');

  timerName.addEventListener('click', function () {
    openPrompt(timerName.textContent, "name");
  });

  countdownDisplay.addEventListener('click', function () {
    openPrompt(timers[getIndex(timerElement)].input, "duration");
  });

  divElement.addEventListener('click', function () {
    openPrompt(timers[getIndex(timerElement)].note, "note");
  });

  function openPrompt(initialValue, elementToUpdate) {
    editMode = true;
    promptInput.value = initialValue === undefined ? '' : initialValue;
    promptType.value = elementToUpdate;
    customPrompt.style.display = 'flex';
    promptInput.focus();
    promptInput.select();
    
    // Clear previous event listeners
    promptInput.removeEventListener('keydown', handlePromptKeydown);
    // Add new event listener
    promptInput.addEventListener('keydown', handlePromptKeydown);
    document.addEventListener('keydown', cancelPrompt);
  }

  function handlePromptKeydown(event) {
    if (event.key === 'Enter'|| event.key === 'Tab') {
      submitPrompt();
    }
  }

  function cancelPrompt(event) {
    if (event.key === "Escape") {
      editMode = false;
      customPrompt.style.display = 'none';
      promptInput.removeEventListener('keydown', handlePromptKeydown);
    }
  }

  function submitPrompt() {

    switch(promptType.value) {
      case "name":
        const newTimerName = promptInput.value;
        if (newTimerName !== null && newTimerName !== '') {
          timerName.textContent = newTimerName;
  
          let timerIndex = getIndex(timerElement);
  
          timers[timerIndex].name = newTimerName;
          saveTimers();
        }
        break;
      case "duration":
        const timerDurationInput = promptInput.value;

        let newDuration = getDuration(timerDurationInput);
  
        if (!isNaN(newDuration) && newDuration > 0) {
          clearInterval(timerInterval);
          timerDurationDisplay.textContent = `${newDuration}`;
          startTime = Date.now();
          timerDuration = newDuration;
          input = timerDurationInput;
  
          let timerIndex = getIndex(timerElement);
  
          timers[timerIndex].startTime = startTime;
          timers[timerIndex].input = timerDurationInput;
          timers[timerIndex].duration = newDuration;
          updateCountdown();
          saveTimers();
          startTimer();
          openPrompt(timerName.textContent, "name");
  
          if(timerName.textContent === "Timer") {
            openPrompt(timerName.textContent, "name");
          }
        }
        break;
      case "note":
        const newNote = promptInput.value;
        if (newNote === null) {
          newNote = ''
        }
  
        timers[getIndex(timerElement)].note = newNote;
        saveTimers();

        break;
      default:
          // code block
    }

    customPrompt.style.display = 'none';
    // Clear event listener after submitting
    promptInput.removeEventListener('keydown', handlePromptKeydown);
    editMode = false;
  }

  // Delete button functionality
  deleteButton.addEventListener('click', function () {
    document.getElementById('timer-list').removeChild(timerElement);
    clearInterval(timerInterval);
    let timerIndex = getIndex(timerElement)
    if (timerIndex - 1) {
      timers.splice(timerIndex, 1);
      saveTimers();
    }
  });

  function getIndex(timerElement) {
    timerId = timerElement.dataset.timerId;
    return timers.findIndex(timer => timer.timerId === timerId);
  }

  // Refresh button functionality
  refreshButton.addEventListener('click', function () {
    clearInterval(timerInterval);
    startTime = Date.now();

    let timerIndex = getIndex(timerElement);

    let newDuration = getDuration(timers[timerIndex].input);
    timerDurationDisplay.textContent = `${newDuration}`;
    startTime = Date.now();
    timerDuration = newDuration;

    timers[timerIndex].startTime = startTime;
    timers[timerIndex].duration = newDuration;

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
      const timerElement = createTimerElement(timerId, timerData.name, timerData.duration, startTime);
      timers.push({ timerId, name: timerData.name, duration: timerData.duration, startTime, input: timerData.input, note: timerData.note });
      timerList.appendChild(timerElement);
    });
}


