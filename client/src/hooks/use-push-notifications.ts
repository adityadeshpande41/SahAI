import { useState, useEffect } from "react";
import { useToast } from "./use-toast";

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const subscribe = async () => {
    if (!isSupported) {
      toast({
        title: "Not supported",
        description: "Push notifications are not supported in this browser",
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        toast({
          title: "Permission denied",
          description: "Please enable notifications in your browser settings",
          variant: "destructive",
        });
        setIsLoading(false);
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Get VAPID public key from server
      const response = await fetch('/api/push/public-key');
      const { publicKey } = await response.json();

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('sahai-user-id') || '',
        },
        body: JSON.stringify({ subscription }),
      });

      setIsSubscribed(true);
      toast({
        title: "Notifications enabled!",
        description: "You'll receive reminders for medications and health updates",
      });
      
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error subscribing to push:', error);
      toast({
        title: "Subscription failed",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push
        await subscription.unsubscribe();

        // Remove subscription from server
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': localStorage.getItem('sahai-user-id') || '',
          },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        setIsSubscribed(false);
        toast({
          title: "Notifications disabled",
          description: "You won't receive push notifications anymore",
        });
      }

      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error unsubscribing from push:', error);
      toast({
        title: "Unsubscribe failed",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
    }
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
