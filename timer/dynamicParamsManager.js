export const dynamicParamsManager = (function () {
    let dynamicParams = {
      isEditMode: false,
      shouldReload: false,
      lastUserInteraction: Date.now(),
    };
  
    function updateParams({ isEditMode, shouldReload, lastUserInteraction }) {
      dynamicParams.isEditMode = isEditMode !== undefined ? isEditMode : dynamicParams.isEditMode;
      dynamicParams.shouldReload = shouldReload !== undefined ? shouldReload : dynamicParams.shouldReload;
      dynamicParams.lastUserInteraction = lastUserInteraction !== undefined ? lastUserInteraction : dynamicParams.lastUserInteraction;
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
  

  function updateDynamicParams({ isEditMode, shouldReload, lastUserInteraction }) {
    dynamicParamsManager.updateParams({ isEditMode, shouldReload, lastUserInteraction });
  }
  
  