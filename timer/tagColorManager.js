import { timersList } from "./dataManager.js";

export let tagColorMap = loadColorMap()

export function loadColorMap() {
  try {
    return JSON.parse(localStorage.getItem('tagColorMap')) || {};
  } catch (error) {
    return {};
  }
}

export function saveColorMap() {
  localStorage.setItem('tagColorMap', JSON.stringify(tagColorMap));
  localStorage.setItem('tagColorMapLastUpdate', Date.now());
}

export function showColorPicker(event, tag) {
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

// Add an event listener to the document to handle clicks outside the color picker and confirm button
document.addEventListener('click', function (event) {
  const colorPickerContainer = document.getElementById('colorPickerContainer');
  if (colorPickerContainer && !colorPickerContainer.contains(event.target)) {
    colorPickerContainer.remove();
  }
});
// Add an event listener to the document to handle clicks outside the color picker
document.addEventListener('click', function (event) {
  const colorPicker = document.getElementById('colorPicker');
  if (colorPicker && !colorPicker.contains(event.target)) {
    colorPicker.remove();
  }
});
  
//Preparing for a setting that would allow the user to keep only used tags color in the map.
export function removeUnusedColors() {
  const usedColors = new Set();

  // Collect all colors used in the current tags
  timersList.forEach(timer => {
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

