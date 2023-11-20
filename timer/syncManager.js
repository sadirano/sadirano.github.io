
// Function to backup timers to clipboard
export async function backupToClipboard(event) {
  if (event === undefined || (event.ctrlKey && event.key === 'e')) {
    try {

      let backup = {
        timers: timers,
        tagColorMap: {
          data: tagColorMap,
          lastUpdate: localStorage.getItem('tagColorMapLastUpdate'),
        },
        settings: {
          data: stm.settings,
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
export async function loadBackupFromClipboard(event) {
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
  // Check and update tagColorMap and stm.settings based on lastUpdate
  if (backup.tagColorMap && backup.tagColorMap.lastUpdate && backup.tagColorMap.lastUpdate > localStorage.getItem('tagColorMapLastUpdate')) {
    localStorage.setItem('tagColorMap', JSON.stringify(backup.tagColorMap));
    localStorage.setItem('tagColorMapLastUpdate', backup.tagColorMap.lastUpdate);
  }

  if (backup.stm.settings && backup.stm.settings.lastUpdate && backup.stm.settings.lastUpdate > localStorage.getItem('settingsLastUpdate')) {
    localStorage.setItem('settings', JSON.stringify(backup.stm.settings));
    localStorage.setItem('settingsLastUpdate', backup.stm.settings.lastUpdate);
  }
}

