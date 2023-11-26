import { saveSettings, settings } from "./settingsManager.js";

let alarmInterval;

export function playAlarm() {
    let audioElement = document.getElementById('alarmAudio' + settings.alarm.sound);
    audioElement.volume = settings.alarm.volume;
    audioElement.play();
}

export function changeAlarmSound(alarm, test = true) {
    if (alarm < 1 || alarm > 6) return false;
    settings.alarm.sound = alarm;
    saveSettings();
    if (test) {
        playAlarm();
    }
    return true;
}

export function changeAlarmVolume(volume, test = true) {
    if (volume === '' || volume < 0 || volume > 100) return false;
    settings.alarm.volume = volume / 100;
    saveSettings();
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
    if(alarmInterval) {
        alarmInterval = clearInterval(alarmInterval);
    }
}