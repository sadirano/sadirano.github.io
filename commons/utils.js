function generateRandomId() {
    return Math.random().toString(36).substring(2, 11);
}

function formatNote(inputString) {
    // Split the input string into an array
    var textArray = inputString.split("/");

    // Join the array elements with "<br>"
    var formattedText = textArray.join("<br>");

    return formattedText;
}

function showNotification(msg) {
    // Check if the browser supports notifications
    if (!("Notification" in window)) {
        alert("This browser does not support system notifications");
    }

    // Check if permission to show notifications is granted
    else if (Notification.permission === "granted") {
        var notification = new Notification(msg);

        // You can handle click events on the notification
        // notification.onclick = function () {
        //     // alert("Notification clicked");
        // };
    }

    // If permission is not yet granted, request it
    else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(function (permission) {
            if (permission === "granted") {
                var notification = new Notification("It works!");
            }
        });
    }
}