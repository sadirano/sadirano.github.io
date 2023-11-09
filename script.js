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

    divBottom.appendChild(deleteButton);
    divBottom.appendChild(timerTitle);
    divBottom.appendChild(refreshButton);

    let timerInterval;
    let remainingTime = timerDuration - Math.floor((Date.now() - startTime) / 1000);

    function updateCountdown() {
      remainingTime = timerDuration - Math.floor((Date.now() - startTime) / 1000);
      countdownDisplay.textContent = remainingTime;
    }

    function startTimer() {
      updateCountdown();
      timerInterval = setInterval(updateCountdown, 1000);
    }

    // Edit Name button functionality
    timerTitle.addEventListener('click', function () {
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
    countdownDisplay.addEventListener('click', function () {
      const timerId = timerElement.dataset.timerId;
      const timerIndex = timers.findIndex(timer => timer.timerId === timerId);

      const timerDurationInput = prompt('Enter a new duration:', timers[timerIndex].input);

      let newDuration = getDuration(timerDurationInput);

      if (!isNaN(newDuration) && newDuration > 0) {
        clearInterval(timerInterval);
        timerDurationDisplay.textContent = `${newDuration}`;
        startTime = Date.now();
        timerDuration = newDuration;
        input = timerDurationInput;


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

      let newDuration = getDuration(timers[timerIndex].input);
      timerDurationDisplay.textContent = `${newDuration}`;
      startTime = Date.now();
      timerDuration = newDuration;

      timers[timerIndex].startTime = startTime;
      timers[timerIndex].duration = newDuration;

      updateCountdown(); // Update the countdown display immediately
      startTimer();
      saveTimers();
    });

    startTimer();
    return timerElement;
  }

  function timeStringToSeconds(timeString) {
    const [timeComponent, expression = ''] = timeString.split(/\s+(.+)/);

    const daysMatch = timeComponent.match(/(\d+)d/);
    const hoursMatch = timeComponent.match(/(\d+)h/);
    const minutesMatch = timeComponent.match(/(\d+)m/);
    const secondsMatch = timeComponent.match(/(\d+)s/);

    if (!daysMatch && !hoursMatch && !minutesMatch && !secondsMatch) {
      throw new Error("Invalid time string format. Please use the format 'Xd', 'Yh', 'Zm', or 'As' for days, hours, minutes, and seconds respectively.");
    }

    let days = 0;
    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    if (daysMatch) {
      days = parseInt(daysMatch[1], 10);
    }

    if (hoursMatch) {
      hours = parseInt(hoursMatch[1], 10);
    }

    if (minutesMatch) {
      minutes = parseInt(minutesMatch[1], 10);
    }

    if (secondsMatch) {
      seconds = parseInt(secondsMatch[1], 10);
    }

    let totalSeconds = (days * 86400) + (hours * 3600) + (minutes * 60) + seconds;

    if (expression) {
      totalSeconds = eval(totalSeconds + expression);
    }

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

  function textSecondsRemaining(condition) {
    var now = new Date();

    var targetHour;

    switch (condition) {
      case "odd":
        targetHour = Math.floor(now.getHours() / 2) * 2 + 1; // Next odd hour
        break;
      case "even":
        targetHour = Math.floor(now.getHours() / 2) * 2 + 2; // Next even hour
        break;
      case "next":
        targetHour = now.getHours() + 1; // Next hour
        break;
      default:
        throw new Error("Invalid condition. Please use 'odd', 'even', or 'next'.");
    }

    // Set the target time with the calculated hour and reset minutes and seconds
    var targetTime = new Date(now);
    targetTime.setHours(targetHour);
    targetTime.setMinutes(0);
    targetTime.setSeconds(0);

    // Calculate the time difference in seconds
    var timeDiff = (targetTime.getTime() - now.getTime()) / 1000;

    return timeDiff;
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
      console.log(timerDurationInput + " is not a valid Hour expression");
    }

    if (timerDurationInput === "day")
      return 3600 * 24

    try {
      return textSecondsRemaining(timerDurationInput);
    } catch (error) {
      console.log(timerDurationInput + " is not a valid Hour expression");
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

  function toggleButtons() {
    toggle = localStorage.getItem('display') !== "none" ? "none" : "flex";
    localStorage.setItem('display', toggle);
    hideShowButtons(toggle)
  }

  function hideShowButtons(hide) {
    toggleAllElements(".edit-button", hide);
    toggleAllElements(".delete-button", hide);
    // toggleAllElements(".refresh-button");
  }

  function toggleAllElements(className, toggle) {
    // Hide all elements with the class "yourClassName"
    var elements = document.querySelectorAll(className);
    elements.forEach(function (element) {
      element.style.display = toggle;
    });
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
        timers.push({ timerId, name: timerData.name, duration: timerData.duration, startTime, input: timerData.input });
        timerList.appendChild(timerElement);
      });
    hideShowButtons(localStorage.getItem('display'))
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
    if (event.ctrlKey && event.key === 'a') {
      event.preventDefault();
      AddPopupOpen = true;
      showAddTimerPopup();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.key === "Enter") {
      createNewTimer();
    }
  });

  const editPopup = document.getElementById('edit-popup');
  const jsonEditor = document.getElementById('json-editor');


  // Show the popup with the "Ctrl + e" shortcut
  document.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.key === 'e') {
      event.preventDefault();
      editPopup.style.display = 'block';
      jsonEditor.value = localStorage.getItem('timers');
      jsonEditor.focus();
    }
  });

  // Show the popup with the "Ctrl + h" shortcut
  document.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.key === 'h') {
      event.preventDefault();
      toggleButtons();
    };
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

  AddPopupOpen = false;
  loadTimers();

});
