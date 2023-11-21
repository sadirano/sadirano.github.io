import {customKeywordsMap} from "../timer/customKeywordManager.js" 

export function formatTime(startTimestamp, durationInSeconds) {
  // Calculate the end timestamp
  var endTimestamp = startTimestamp + (durationInSeconds * 1000);

  // Create Date objects
  var startDate = new Date(startTimestamp); // Multiply by 1000 to convert to milliseconds
  var endDate = new Date(endTimestamp);

  // Get hours and minutes
  var startHours = startDate.getHours();
  var startMinutes = startDate.getMinutes();
  var endHours = endDate.getHours();
  var endMinutes = endDate.getMinutes();

  // Format hours and minutes with leading zeros if needed
  startHours = (startHours < 10) ? "0" + startHours : startHours;
  startMinutes = (startMinutes < 10) ? "0" + startMinutes : startMinutes;
  endHours = (endHours < 10) ? "0" + endHours : endHours;
  endMinutes = (endMinutes < 10) ? "0" + endMinutes : endMinutes;

  // Construct the formatted time strings
  var startTimeString = startHours + ":" + startMinutes;
  var endTimeString = endHours + ":" + endMinutes;

  return { startTime: startTimeString, endTime: endTimeString };
}

export function timeStringToSeconds(timeString) {
  const [timeComponent, expression = ''] = timeString.split(/\s+(.+)/);

  const daysMatch = timeComponent.match(/(\d+)d/);
  const hoursMatch = timeComponent.match(/(\d+)h/);
  const minutesMatch = timeComponent.match(/(\d+)m/);
  const secondsMatch = timeComponent.match(/(\d+)s/);

  if (!daysMatch && !hoursMatch && !minutesMatch && !secondsMatch) {
    throw new Error("Invalid time string format. Please use the format 'Xd', 'Yh', 'Zm', or 'As' for days, hours, minutes, and seconds respectively.");
  }

  let days = 0;
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (daysMatch) {
    days = parseInt(daysMatch[1], 10);
  }

  if (hoursMatch) {
    hours = parseInt(hoursMatch[1], 10);
  }

  if (minutesMatch) {
    minutes = parseInt(minutesMatch[1], 10);
  }

  if (secondsMatch) {
    seconds = parseInt(secondsMatch[1], 10);
  }

  let totalSeconds = (days * 86400) + (hours * 3600) + (minutes * 60) + seconds;

  if (expression) {
    totalSeconds = eval(totalSeconds + expression);
  }

  return totalSeconds;
}

export function hourStringToSeconds(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error("Invalid time format. Please use the format 'HH:mm'.");
  }

  const now = new Date();
  const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

  // Check if the target time is earlier than the current time (next day)
  if (targetTime < now) {
    targetTime.setDate(targetTime.getDate() + 1);
  }

  const timeDifference = (targetTime - now) / 1000; // Convert milliseconds to seconds
  return Math.round(timeDifference);
}

export function textSecondsRemaining(condition) {
  var now = new Date();

  var targetHour;

  switch (condition) {
    case "odd":
      targetHour = Math.floor(now.getHours() / 2) * 2 + 1; // Next odd hour
      break;
    case "even":
      targetHour = Math.floor(now.getHours() / 2) * 2 + 2; // Next even hour
      break;
    case "next":
      targetHour = now.getHours() + 1; // Next hour
      break;
    default:
      throw new Error("Invalid condition. Please use 'odd', 'even', or 'next'.");
  }

  // Set the target time with the calculated hour and reset minutes and seconds
  var targetTime = new Date(now);
  targetTime.setHours(targetHour);
  targetTime.setMinutes(0);
  targetTime.setSeconds(0);

  // Calculate the time difference in seconds
  var timeDiff = (targetTime.getTime() - now.getTime()) / 1000;

  return timeDiff;
}

export function getDuration(timerDurationInput) {
  try {
    // Try to evaluate the expression directly using eval
    const evaluatedValue = eval(getDurationInternal(timerDurationInput));
    if (!isNaN(evaluatedValue)) {
      return evaluatedValue;
    }
  } catch (error) { }
  return timerDurationInput;
}

export function getDurationInternal(timerDurationInput) {
  if (timerDurationInput in customKeywordsMap) {
    // If the input is a custom keyword, recursively process its components
    const components = customKeywordsMap[timerDurationInput].split(/\s*\*\s*/);
    let result = 1; // Initialize result to 1 for multiplication
    components.forEach(element => {
      result *= getDurationInternal(element);
    });
    return result;
  }

  try {
    // Try to evaluate the expression directly using eval
    const evaluatedValue = eval(timerDurationInput);
    if (!isNaN(evaluatedValue)) {
      return evaluatedValue;
    }
  } catch (error) { }

  try {
    // Try to convert time string to seconds
    return timeStringToSeconds(timerDurationInput);
  } catch (error) { }

  try {
    // Try to convert hour string to seconds
    return hourStringToSeconds(timerDurationInput);
  } catch (error) { }

  try {
    // Try to parse text seconds remaining
    return textSecondsRemaining(timerDurationInput);
  } catch (error) { }

  if (!/\s/.test(timerDurationInput)) return timerDurationInput;

  // If the input contains multiple elements, split and sum their durations
  let result = 0;
  timerDurationInput.split(/\s+/).forEach(element => {
    result += getDurationInternal(element);
  });

  return result;
}
