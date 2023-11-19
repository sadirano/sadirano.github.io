function generateRandomId() {
    return Math.random().toString(36).substring(2, 11);
}

async function checkNotificationPermission() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    } else {
        console.warn('Notifications not supported in this browser.');
        return false;
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function uncapitalizeFirstLetter(string) {
    return string.charAt(0).toLowerCase() + string.slice(1);
}

function showNotification(msg) {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        // Register a service worker
        navigator.serviceWorker.register('./commons/service-worker.js')
            .then(async function (registration) {
                // Check if permission to show notifications is granted
                const permissionGranted = await checkNotificationPermission();
                if (permissionGranted) {
                    // Create a push notification
                    return registration.showNotification(msg);
                }
            })
            .catch(function (error) {
                console.error('Error during service worker registration:', error);
            });
    } else {
        console.warn('Service workers or PushManager not supported in this browser.');
    }
}

function requestClipboardPermission() {
    navigator.permissions.query({ name: 'clipboard-write' })
        .then(permissionStatus => {
            // Check if the permission is already granted
            if (permissionStatus.state === 'granted') {
                return true;
            } else if (permissionStatus.state === 'prompt') {
                // The browser will prompt the user for permission
                permissionStatus.onchange = () => {
                    if (permissionStatus.state === 'granted') {
                        return true;
                    } else {
                        console.warn('Clipboard permission denied.');
                    }
                };
            } else {
                console.warn('Clipboard permission denied.');
            }
        })
        .catch(error => {
            console.error('Error requesting clipboard permission:', error);
        });
}

