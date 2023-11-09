document.addEventListener('DOMContentLoaded', function () {
  const timerList = document.getElementById('timer-list');
  const timers = [];

  function generateRandomId() {
    return Math.random().toString(36).substring(2, 11);
  }

  function createTimerElement(timerId, timerName, timerDuration, startTime) {
    const timerElement = document.createElement('div');
    timerElement.className = 'timer';
    timerElement.dataset.timerId = timerId;
    const timerDurationDisplay = document.createElement('h5');
    timerDurationDisplay.textContent = `${timerDuration}`;
    timerDurationDisplay.style.display = 'none';
    const editDurationButton = document.createElement('button');
    editDurationButton.innerHTML = '&#9998;';
    editDurationButton.className = 'icon-button edit-button';


    const countdownDisplay = document.createElement('h2');
    const divBottom = document.createElement('div');
    divBottom.className = 'div-bottom';
    const timerTitle = document.createElement('h5');
    timerTitle.textContent = timerName;
    const editNameButton = document.createElement('button');
    editNameButton.innerHTML = '&#9998;';
    editNameButton.className = 'icon-button edit-button';
    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '&#10006;';
    deleteButton.className = 'icon-button delete-button';

    const refreshButton = document.createElement('button');
    refreshButton.innerHTML = '&#8634;';
    refreshButton.className = 'icon-button refresh-button';

    // timerElement.appendChild(timerDurationDisplay);
    // timerDurationDisplay.appendChild(editDurationButton);
    // timerTitle.appendChild(editNameButton);
    const divmain = document.createElement('div');
    divmain.className = 'div-main';

    const divgroup = document.createElement('div');
    divgroup.className = 'vert-timer';

    timerElement.appendChild(divgroup);

    divgroup.appendChild(divmain);
    divgroup.appendChild(divBottom);

    divmain.appendChild(countdownDisplay);
    divmain.appendChild(editDurationButton);

    divBottom.appendChild(deleteButton);
    divBottom.appendChild(editNameButton);
    divBottom.appendChild(timerTitle);
    divBottom.appendChild(refreshButton);

    let timerInterval;
    let remainingTime = timerDuration - Math.floor((Date.now() - startTime) / 1000);

    function updateCountdown() {
      remainingTime = Math.max(0, timerDuration - Math.floor((Date.now() - startTime) / 1000));
      countdownDisplay.textContent = remainingTime === 0 ? 'Done' : remainingTime;

      if (remainingTime === 0) {
        clearInterval(timerInterval);
      }
    }

    function startTimer() {
      updateCountdown();
      timerInterval = setInterval(updateCountdown, 1000);
    }

    // Edit Name button functionality
    editNameButton.addEventListener('click', function () {
      const newTimerName = prompt('Enter a new name for the timer:', timerName);
      if (newTimerName !== null && newTimerName !== '') {
        timerName = newTimerName

        timerTitle.textContent = timerName;

        const timerId = timerElement.dataset.timerId;
        const timerIndex = timers.findIndex(timer => timer.timerId === timerId);

        timers[timerIndex].name = timerName;

        saveTimers();
      }
    });

    // Edit Duration button functionality
    editDurationButton.addEventListener('click', function () {
      const timerId = timerElement.dataset.timerId;
      const timerIndex = timers.findIndex(timer => timer.timerId === timerId);

      const timerDurationInput = prompt('Enter a new duration:', timers[timerIndex].input);

      newDuration = getDuration(timerDurationInput);

      if (!isNaN(newDuration) && newDuration > 0) {
        clearInterval(timerInterval);
        timerDurationDisplay.textContent = `${newDuration}`;
        startTime = Date.now();
        timerDuration = newDuration;

        timers[timerIndex].startTime = startTime;
        timers[timerIndex].input = timerDurationInput;
        timers[timerIndex].duration = newDuration;
        updateCountdown();
        saveTimers();
        startTimer();
      }
    });

    // Delete button functionality
    deleteButton.addEventListener('click', function () {
      clearInterval(timerInterval);
      const timerId = timerElement.dataset.timerId;
      timerList.removeChild(timerElement);
      const timerIndex = timers.findIndex(timer => timer.timerId === timerId);
      if (timerIndex > -1) {
        timers.splice(timerIndex, 1);
        saveTimers();
      }
    });

    // Refresh button functionality
    refreshButton.addEventListener('click', function () {
      clearInterval(timerInterval);
      startTime = Date.now();

      const timerId = timerElement.dataset.timerId;
      const timerIndex = timers.findIndex(timer => timer.timerId === timerId);
      timers[timerIndex].startTime = startTime;

      updateCountdown(); // Update the countdown display immediately
      startTimer();
      saveTimers();
    });

    startTimer();
    return timerElement;
  }

  function timeStringToSeconds(timeString) {
    const hoursMatch = timeString.match(/(\d+)h/);
    const minutesMatch = timeString.match(/(\d+)m/);
  
    if (!hoursMatch && !minutesMatch) {
      throw new Error("Invalid time string format. Please use the format 'Xh' for hours or 'Ym' for minutes.");
    }
  
    let hours = 0;
    let minutes = 0;
  
    if (hoursMatch) {
      hours = parseInt(hoursMatch[1], 10);
    }
  
    if (minutesMatch) {
      minutes = parseInt(minutesMatch[1], 10);
    }
  
    const totalSeconds = (hours * 3600) + (minutes * 60);
    return totalSeconds;
  }

  function hourStringToSeconds(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error("Invalid time format. Please use the format 'HH:mm'.");
    }
  
    const now = new Date();
    const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
  
    // Check if the target time is earlier than the current time (next day)
    if (targetTime < now) {
      targetTime.setDate(targetTime.getDate() + 1);
    }
  
    const timeDifference = (targetTime - now) / 1000; // Convert milliseconds to seconds
    return Math.round(timeDifference);
  }
  

  function getDuration(timerDurationInput) {
    try {
      return Math.max(0, eval(timerDurationInput));
    } catch (error) {
      console.log(timerDurationInput + " is not a valid Math expression");
    }

    try {
      return timeStringToSeconds(timerDurationInput);
    } catch (error) {
      console.log(timerDurationInput + " is not a valid Time expression");
    }

    try {
      return hourStringToSeconds(timerDurationInput);
    } catch (error) {
      console.log(timerDurationInput + " is not a valid Time expression");
    }

  }

  function showAddTimerPopup() {
    const addTimerPopup = document.getElementById('add-timer-popup');
    const timerNameInput = document.getElementById('timer-name');
    addTimerPopup.style.display = 'block';
    timerNameInput.focus(); // Set focus to the timer name input
    timerNameInput.select(); // Select the existing text for editing

  }

  function hideAddTimerPopup() {
    const addTimerPopup = document.getElementById('add-timer-popup');
    addTimerPopup.style.display = 'none';
    AddPopupOpen = false;
  }

  function createNewTimer() {
    const timerName = document.getElementById('timer-name').value;
    const timerDurationInput = document.getElementById('timer-duration').value;
    let timerDuration = 0;

    if (timerName) {
      // Check if the input is a valid mathematical expression and evaluate it
      try {
        timerDuration = Math.max(0, eval(timerDurationInput));
      } catch (error) {
        alert('Invalid duration expression. Please enter a valid mathematical expression.');
        return;
      }

      if (isNaN(timerDuration)) {
        alert('Invalid duration expression. Please enter a valid mathematical expression.');
        return;
      }

      if (timerDuration <= 0) {
        alert('Duration must be a positive number.');
        return;
      }

      // Create a new timer here using the timerName and timerDuration
      const startTime = Date.now();
      const timerElement = createTimerElement(generateRandomId(), timerName, timerDuration, startTime);
      timers.push({ timerId: timerElement.dataset.timerId, name: timerName, duration: timerDuration, startTime, input: timerDurationInput });
      timerList.appendChild(timerElement);
      saveTimers();
      document.getElementById('timer-name').value = 'Timer';
      document.getElementById('timer-duration').value = '60';
      hideAddTimerPopup(); // Hide the popup after creating a timer
    } else {
      alert('Please enter a valid timer name.');
    }
  }

  function saveTimers() {
    localStorage.setItem('timers', JSON.stringify(timers));
    console.log("Saved:" + JSON.stringify(timers))
  }

  function loadTimers() {
    const timersData = JSON.parse(localStorage.getItem('timers')) || [];
    timersData
      .sort(function (a, b) { return (a.duration - Math.floor((Date.now() - a.startTime) / 1000)) - (b.duration - Math.floor((Date.now() - b.startTime) / 1000)) })
      .forEach((timerData) => {
        const timerId = timerData.timerId;
        const startTime = timerData.startTime;
        const timerElement = createTimerElement(timerId, timerData.name, timerData.duration, startTime);
        timers.push({ timerId, name: timerData.name, duration: timerData.duration, startTime });
        timerList.appendChild(timerElement);
      });
    console.log("Loaded:" + JSON.stringify(timers))
  }

  // Add event listener to hide the popup when pressing ESC key
  document.addEventListener('keyup', function (event) {
    if (event.key === 'Escape') {
      hideAddTimerPopup();
    }
  });

  // Event listener to open the creation popup when pressing Shift and + keys
  document.addEventListener('keydown', function (event) {
    if (event.key === '+' && !AddPopupOpen) {
      AddPopupOpen = true;
      event.preventDefault(); // Prevent the default behavior of the + key
      showAddTimerPopup();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === "Enter") {
      createNewTimer();
    }
  });


  AddPopupOpen = false;
  loadTimers();

});

document.addEventListener('DOMContentLoaded', function () {
  const editPopup = document.getElementById('edit-popup');
  const jsonEditor = document.getElementById('json-editor');

  // Show the popup with the "e" shortcut
  document.addEventListener('keydown', function (event) {
    if (event.key === 'e') {
      event.preventDefault(); // Prevent the default behavior of the + key
      editPopup.style.display = 'block';
      jsonEditor.value = localStorage.getItem('timers');
      jsonEditor.focus();
    }
  });

  // Hide the popup with the ESC key
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      editPopup.style.display = 'none';
    }
  });

  // Update timers when JSON is edited and saved
  jsonEditor.addEventListener('input', function () {
    try {
      localStorage.setItem('timers', jsonEditor.value);
    } catch (error) {
      // Handle JSON parse errors
      console.error('Invalid JSON:', error);
    }
  });
});