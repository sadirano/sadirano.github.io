export const dynamicParamsManager = (function () {
  let dynamicParams = {
    isEditMode: false,
    shouldReload: false,
    lastUserInteraction: Date.now(),
    unread: 0,
  };

  function updateParams(paramsToUpdate) {
    dynamicParams = { ...dynamicParams, ...paramsToUpdate };
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

export function clearUnread() {
  dynamicParamsManager.updateParams({unread : 0});
  updateUnreadTitle();
} 

export function updateUnreadTitle() {
  let unread = dynamicParamsManager.getParams().unread;
  if(unread === 0) {
    document.title = 'Sad Timer'
  } else {
    document.title = `(${unread}) Sad Timer`;
  } 
}
