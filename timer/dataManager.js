import {TimerElement} from "./timerElement.js";
import * as time from "../commons/time.js";

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

    hasTag() {
        return this.tags !== undefined && this.tags.length !== 0;
    }
    remainingTime() {
        // console.log(`${this.duration} - ${this.startTime}`);
        return this.duration - Math.floor((Date.now() - this.startTime) / 1000);
    }
}
export function saveTimersData() {
    localStorage.setItem(`timers`, JSON.stringify(timersList));
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
    const durationInput = 60;
    let duration = time.getDuration(durationInput);
    const startTime = Date.now();
    let timer = {
        timerId: generateRandomId(),
        name: timerName,
        duration: duration,
        startTime: startTime,
        input: durationInput,
        note: '',
        tags: [],
        settings: defaultTimerSettings
    };
    const timerElement = new TimerElement(timer);
    timersList.push(timer);
    saveTimersData();
    document.getElementById('timer-list').appendChild(timerElement);
    timerElement.focus();
    timerElement.click();
}

const defaultTimerSettings = {
    repeat: false,
    rules: [
        { limit: 10, color: '#ff0000', backgroundColor: '#333' },
        { limit: 20, color: '#ffa500', backgroundColor: '#333' },
        { limit: 30, color: '#ffff00', backgroundColor: '#333' },
    ]
};

function getAllTags() {
    const allTags = new Set();
    timersList.forEach(timer => {
        timer.tags.forEach(tag => {
            allTags.add(tag);
        });
    });
    return Array.from(allTags).map(tag => ({ key: tag.toLowerCase(), value: tag }));
}



export const timersList = loadTimersData() || [];
