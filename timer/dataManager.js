import { TimerElement } from "./timerElement.js";
import { timerContainer } from "./documentElementsManager.js";
import { getDuration } from "../commons/time.js";
import { generateRandomId } from "../commons/utils.js";

class Timer {
    constructor(timer) {
        this.timerId = timer.timerId;
        this.input = timer.input;
        this.name = timer.name;
        this.note = timer.note;

        this.duration = timer.duration;
        this.startTime = timer.startTime;
        this.tags = timer.tags;
        this.settings = timer.settings || defaultTimerSettings;
    }

    hasTag = () => {
        return this.tags !== undefined && this.tags.length !== 0;
    }
    remainingTime() {
        return this.duration - Math.floor((Date.now() - this.startTime) / 1000);
    }
}
export function saveTimersData(updatedTimer, remove) {
    if (!updatedTimer) return;

    const index = timersList.findIndex(timer => timer.timerId === updatedTimer.timerId);
    if (!remove) {
        index !== -1 ? (timersList[index] = updatedTimer) : timersList.push(updatedTimer);
    }

    localStorage.setItem('timers', JSON.stringify(timersList));
}

export function loadTimersData() {
    try {
        let jsonList = JSON.parse(localStorage.getItem(`timers`),) || [];
        const timers = jsonList.map(jsonObject => new Timer(jsonObject));
        return timers.sort((a, b) => a.remainingTime() - b.remainingTime());
    } catch (error) {
        console.error(`Couldn't parse the timers, Error: ${error}!`);
        return [];
    }
}

export function newTimer() {
    const timerName = "Timer";
    const durationInput = 3600;
    let duration = getDuration(durationInput);
    const startTime = Date.now();
    const ids = timersList.map(timer => timer.timerId);

    let timer = {
        timerId: generateRandomId(ids),
        name: timerName,
        duration: duration,
        startTime: startTime,
        input: durationInput,
        note: '',
        tags: [],
        settings: defaultTimerSettings
    };
    const timerElement = new TimerElement(new Timer(timer));
    timersList.push(timer);
    saveTimersData(timer);
    timerContainer.appendChild(timerElement.instance);
    timerElement.instance.focus();
    rightClick(timerElement.instance);

}

const defaultTimerSettings = {
    repeat: false,
    rules: [
        { limit: 10, color: '#ff0000', backgroundColor: '#333' },
        { limit: 20, color: '#ffa500', backgroundColor: '#333' },
        { limit: 30, color: '#ffff00', backgroundColor: '#333' },
    ]
};

export function getAllTags() {
    const allTags = new Set();
    timersList.forEach(timer => {
        timer.tags.forEach(tag => {
            allTags.add(tag);
        });
    });
    return Array.from(allTags).map(tag => ({ key: tag.toLowerCase(), value: tag }));
}



export const timersList = loadTimersData() || [];


// Simulate a right-click event
function rightClick(element) {
    const rightClickEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        button: 2, // 2 represents the right mouse button
    });
    element.dispatchEvent(rightClickEvent);
}
