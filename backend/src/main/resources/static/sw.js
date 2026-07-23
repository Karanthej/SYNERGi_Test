// Service Worker for SYNERGi Call Notifications

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// We listen to notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Close the notification

  const action = event.action; // 'accept' or 'reject' or ''
  const notificationData = event.notification.data || {};

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Find the first client
      let client = windowClients.length ? windowClients[0] : null;

      if (!client) {
        // If there's no active window, we might need to open one.
        // However, if the window is fully closed, the WebSocket is dead anyway,
        // but we can at least open the app.
        return self.clients.openWindow('/').then((newClient) => {
          if (newClient) {
             // Send a message after a short delay so the app has time to boot
             setTimeout(() => {
               newClient.postMessage({ type: 'CALL_ACTION', action, data: notificationData });
             }, 3000);
          }
        });
      } else {
        // Focus the existing window
        client.focus();
        
        // Send a message to the client indicating the action
        client.postMessage({ type: 'CALL_ACTION', action, data: notificationData });
      }
    })
  );
});

// We can also listen for messages from the client (e.g. to close a notification)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLOSE_NOTIFICATION') {
    const callId = event.data.callId;
    self.registration.getNotifications().then((notifications) => {
      notifications.forEach((notification) => {
        if (notification.data && notification.data.callId === callId) {
          notification.close();
        }
      });
    });
  }
});
