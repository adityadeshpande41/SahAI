// Service Worker for Push Notifications

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push received');
  
  if (!event.data) {
    console.log('[Service Worker] Push event but no data');
    return;
  }

  const data = event.data.json();
  console.log('[Service Worker] Push data:', data);

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.png',
    badge: data.badge || '/favicon.png',
    data: data.data || {},
    actions: data.actions || [],
    vibrate: [200, 100, 200],
    tag: data.data?.type || 'notification',
    requireInteraction: data.data?.severity === 'high',
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click:', event.action);
  
  event.notification.close();

  const data = event.notification.data;
  
  // Handle notification actions
  if (event.action === 'taken') {
    // Mark medication as taken
    event.waitUntil(
      fetch('/api/medications/' + data.medicationId + '/take', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ takenAt: new Date().toISOString() }),
      })
    );
  } else if (event.action === 'snooze') {
    // Snooze medication
    event.waitUntil(
      fetch('/api/medications/' + data.medicationId + '/snooze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snoozeMinutes: 30 }),
      })
    );
  } else {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('[Service Worker] Push subscription changed');
  
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then(function(subscription) {
        return fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription }),
        });
      })
  );
});
