export const customKeywordsMap = loadCustomKeywordsMap();

function loadCustomKeywordsMap() {
  try {
    return JSON.parse(localStorage.getItem('customKeywordsMap')) || {};
  } catch (error) {
    return {};
  }
}

export function saveCustomKeywordsMap() {
  localStorage.setItem('customKeywordsMap', customKeywordsMap);
}

export function updateCustomKeywordsMap(item) {
  customKeywordsMap.setItem(item.key, item.value);
  localStorage.setItem('customKeywordsMap', customKeywordsMap);
}

