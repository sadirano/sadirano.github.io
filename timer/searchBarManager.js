
// searchInput.value = searchInputValue;
// applySearch(filterTag);
//Create a function that can be called by the main.js on init.

function toggleAdvancedSearch() {
  const advancedSearchOptions = document.getElementById('advanced-search-options');
  advancedSearchOptions.style.display = advancedSearchOptions.style.display === 'none' ? 'flex' : 'none';
}

let searchTimer;

export function applySearchWithDelay() {
  // Clear previous timer to avoid premature execution
  clearTimeout(searchTimer);

  searchTimer = setTimeout(applySearch, 500);
}

// Load filters and search parameters from localStorage
let filterTag = localStorage.getItem('filterTag') || '';
let searchInputValue = localStorage.getItem('searchInputValue') || '';

function applySearch(clickedTag) {
  filterTag == clickedTag ? "" : clickedTag;
  applySearchInternal(searchInput.value.toLowerCase(), filterTag);
}

let intervalReaplySearch;

function applySearchInternal(searchInputValue, filterTag) {

  // Save filters and search parameters to localStorage
  localStorage.setItem('filterTag', filterTag);
  localStorage.setItem('searchInputValue', searchInputValue);

  if (searchInputValue.startsWith('/')) {
    executeCommand(searchInput.value);
    return
  }


  const timerElements = document.getElementsByClassName('timer');
  const minRemaining = getDuration(document.getElementById('min-remaining').value);
  const maxRemaining = getDuration(document.getElementById('max-remaining').value);

  if ((minRemaining || maxRemaining)) {
    clearInterval(intervalReaplySearch);
    intervalReaplySearch = setInterval(applySearchInternal, stm.settings.updateInterval, searchInputValue, filterTag);
  } else {
    clearInterval(intervalReaplySearch);
  }

  Array.from(timerElements).forEach(timerElement => {
    const timer = timers.find(timer => timer.timerId === timerElement.dataset.timerId);
    const tags_text = timer.tags === undefined ? '' : timer.tags.join(' ');
    const timerText = `${timer.name} ${timer.note} ${timer.input} ${tags_text}`.toLowerCase();

    const remainingSeconds = timer.duration - Math.floor(Date.now() - timer.startTime) / 1000;

    // Check if the timer's text contains the search input and is within the remaining time range
    const meetsSearchCriteria = timerText.includes(searchInputValue);
    const meetsTagFilterCriteria = filterTag ? timer.tags.includes(filterTag) : true;
    const meetsMinTimeCriteria = minRemaining === "" || minRemaining <= remainingSeconds;
    const meetsMaxTimeCriteria = maxRemaining === "" || remainingSeconds <= maxRemaining;

    timerElement.style.display = meetsTagFilterCriteria && meetsSearchCriteria && meetsMinTimeCriteria && meetsMaxTimeCriteria ? 'flex' : 'none';
  });
}


