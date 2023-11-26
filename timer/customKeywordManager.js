// Define default values for properties
const defaultKeywords = {
  'day' : '24h',
  'week': 'day * 7',
  'month': 'day * 30', //around that.
  'year': 'day * 365', //yup ignore the other one.
};

export const customKeywordsMap = loadCustomKeywordsMap();


function loadCustomKeywordsMap() {
  try {
    let storedKeywords = JSON.parse(localStorage.getItem('customKeywordsMap')) || {};
    return { ...defaultKeywords, ...storedKeywords };

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

