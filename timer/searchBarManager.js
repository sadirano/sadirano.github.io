import { searchInput } from "./documentElementsManager.js";
import { getDuration } from "../commons/time.js";
import { timersList } from "./dataManager.js";
import { executeCommand } from "./autoCompleteManager.js";
import { settings } from "./settingsManager.js";

export function toggleAdvancedSearch() {
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
export let filterTag = localStorage.getItem('filterTag') || '';
export let searchInputValue = localStorage.getItem('searchInputValue') || '';

export function applySearch(clickedTag) {
  filterTag = filterTag == clickedTag ? "" : clickedTag;
  applySearchInternal(searchInput.value.toLowerCase(), filterTag);
}

let intervalReapplySearch;

function applySearchInternal(searchInputValue, filterTag) {

  if (searchInputValue.startsWith('/')) {
    executeCommand(searchInput.value);
    return;
  }
  // Save filters and search parameters to localStorage
  localStorage.setItem('filterTag', filterTag);
  localStorage.setItem('searchInputValue', searchInputValue);

  const timerElements = document.getElementsByClassName('timer');
  const minRemaining = getDuration(document.getElementById('min-remaining').value);
  const maxRemaining = getDuration(document.getElementById('max-remaining').value);

  if ((minRemaining || maxRemaining)) {
    clearInterval(intervalReapplySearch);
    intervalReapplySearch = setInterval(applySearchInternal, settings.updateInterval, searchInputValue, filterTag);
  } else {
    clearInterval(intervalReapplySearch);
  }

  Array.from(timerElements).forEach(timerElement => {
    const timer = timersList.find(timer => timer.timerId === timerElement.dataset.timerId);
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


