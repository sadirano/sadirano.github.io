import { settings } from "./settingsManager.js";

export function playAlarm() {
    let audioElement = document.getElementById('alarmAudio' + settings.alarm.sound);
    audioElement.volume = settings.alarm.volume;
    audioElement.play();
}

export function changeAlarmSound(alarm, test = true) {
    if (alarm < 1 || alarm > 6) return false;
    settings.alarm.sound = alarm;
    settings.alarm.volume = volume;
    if (test) {
        playAlarm();
    }
    return true;
}

export function changeAlarmVolume(volume, test = true) {
    if (alarm < 0 || alarm > 100) return false;
    settings.alarm.volume = volume / 10;
    if (test) {
        playAlarm();
    }
    return true;
}

export function startAlarm() {
    if (!alarmInterval && settings.enableAlarms) {
        alarmInterval = setInterval(playAlarm, settings.alarm.interval);
    }
}

export function clearAlarm() {
    alarmInterval = clearInterval(alarmInterval);
}