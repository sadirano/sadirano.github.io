import { dynamicParamsManager } from "./dynamicParamsManager.js";

let previousColumn = -1;
let lastFocusedTimerElement = null;

export function init() {

    document.addEventListener('keydown', function (event) {
        if (dynamicParamsManager.getParams().isEditMode) return;
        const movementKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'];

        // Check if the pressed key is an arrow key
        if (movementKeys.includes(event.key)) {
            // Get the currently focused element
            const focusedElement = document.activeElement;

            if (focusedElement.tagName === 'INPUT') return;

            // Prevent the default arrow key behavior to handle it manually
            event.preventDefault();

            let key = event.key;

            if (key === 'Tab') {
                key = event.shiftKey ? 'STab' : 'Tab'
            }

            // Find all focusable elements on the page
            const focusableElements = Array.from(document.querySelectorAll('[tabindex]'))
                .filter(element => !(element.hasAttribute('disabled') || element.style.display === 'none'));

            // Find the index of the currently focused element in the array
            const currentIndex = focusableElements.indexOf(focusedElement);

            // Get the container element for layout calculations
            const container = document.querySelector('.timer-container');

            // Calculate the number of elements in a line dynamically
            const numberOfElementsInLine = _calculateNumberOfElementsInLine(container, focusedElement);

            if (previousColumn === -1) {
                previousColumn = currentIndex % numberOfElementsInLine;
            }
            // Calculate the index of the next or previous focusable element
            let nextIndex;
            switch (key) {
                case 'ArrowDown':
                    //Last row
                    if (currentIndex >= focusableElements.length - numberOfElementsInLine) {
                        nextIndex = previousColumn;
                    } else {
                        nextIndex = (currentIndex + numberOfElementsInLine);
                        //Selecting the last row item
                        if (nextIndex > focusableElements.length) {
                            nextIndex = focusableElements.length - 1;
                        }
                    }
                    break;
                case 'ArrowRight':
                case 'Tab':
                    nextIndex = (currentIndex + 1) % focusableElements.length;
                    previousColumn = nextIndex % numberOfElementsInLine;
                    break;
                case 'ArrowUp':
                    let elementsLastLine = focusableElements.length % numberOfElementsInLine;
                    //Last row
                    if (currentIndex > focusableElements.length - numberOfElementsInLine) {
                        nextIndex = focusableElements.length - elementsLastLine - numberOfElementsInLine + previousColumn;
                    } else {
                        if (currentIndex < numberOfElementsInLine) { //First row
                            nextIndex = focusableElements.length - elementsLastLine + previousColumn;
                            if (nextIndex >= focusableElements.length) nextIndex = focusableElements.length - 1;
                        } else {
                            nextIndex = (currentIndex - numberOfElementsInLine);
                        }
                    }
                    break;
                case 'ArrowLeft':
                case 'STab':
                    nextIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length;
                    previousColumn = nextIndex % numberOfElementsInLine;
                    break;
                default:
                    break;
            }

            if (focusableElements[nextIndex] !== undefined) {
                // Focus on the next or previous focusable element
                focusableElements[nextIndex].focus();
            } else {
                focusableElements[0].focus();
            }

            // Check if the focused element exists
            if (focusedElement) {
                // Scroll the focused element into view, centering it in the viewport
                focusedElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'center',
                });
            }
        }
    });


    document.addEventListener('focus', function (event) {
        const focusedElement = event.target;

        if (focusedElement.className === 'timer') {
            lastFocusedTimerElement = focusedElement;
        }
    }, true);


}


export function selectLastFocusedTimerElement() {
    if (lastFocusedTimerElement !== undefined) lastFocusedTimerElement.focus();
}

function _calculateNumberOfElementsInLine(container, currentElement) {
    // Get the width of the container
    const containerWidth = container.clientWidth;

    // Get the width of the current element (assuming all elements have the same width)
    const elementWidth = currentElement.clientWidth;

    // Calculate the number of elements that can fit in a line
    const numberOfElementsInLine = Math.floor(containerWidth / elementWidth);

    return numberOfElementsInLine;
}
