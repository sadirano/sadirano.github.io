import { settings } from "./settingsManager.js";

export let alarmInterval;

export function playAlarm() {
    document.getElementById('alarmAudio' + settings.alarmSound).play();
}

export function changeAlarmSound(alarm, test=true) {
    if (alarm < 1 || alarm > 6) return false;
    settings.alarmSound = alarm;
    if(test) {
        playAlarm();
    }
    return true;
}

export function startAlarm() {
    if(!alarmInterval && settings.enableAlarms) {
        alarmInterval = setInterval(playAlarm, 5000);
    }
}

export function clearAlarm() {
    alarmInterval = clearInterval(alarmInterval);
}