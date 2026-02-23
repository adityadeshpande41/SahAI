import webpush from "web-push";

// VAPID keys for Web Push (generate these once and store in .env)
// To generate: npx web-push generate-vapid-keys
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || "",
  privateKey: process.env.VAPID_PRIVATE_KEY || "",
};

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:support@sahai.app",
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

export class PushNotificationService {
  async sendNotification(
    subscription: PushSubscription,
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
        console.warn("VAPID keys not configured, skipping push notification");
        return false;
      }

      await webpush.sendNotification(
        subscription,
        JSON.stringify(payload)
      );

      console.log("Push notification sent successfully");
      return true;
    } catch (error: any) {
      console.error("Error sending push notification:", error);
      
      // If subscription is invalid/expired, return false so it can be removed
      if (error.statusCode === 410) {
        console.log("Subscription expired, should be removed");
        return false;
      }
      
      return false;
    }
  }

  async sendMedicationReminder(
    subscription: PushSubscription,
    medicationName: string,
    time: string
  ): Promise<boolean> {
    return this.sendNotification(subscription, {
      title: "💊 Medication Reminder",
      body: `Time to take ${medicationName}`,
      icon: "/favicon.png",
      badge: "/favicon.png",
      data: {
        type: "medication",
        medicationName,
        time,
      },
      actions: [
        { action: "taken", title: "Mark as Taken" },
        { action: "snooze", title: "Snooze 30min" },
      ],
    });
  }

  async sendHealthAlert(
    subscription: PushSubscription,
    alertTitle: string,
    alertMessage: string,
    severity: "low" | "medium" | "high"
  ): Promise<boolean> {
    const icons = {
      low: "ℹ️",
      medium: "⚠️",
      high: "🚨",
    };

    return this.sendNotification(subscription, {
      title: `${icons[severity]} ${alertTitle}`,
      body: alertMessage,
      icon: "/favicon.png",
      badge: "/favicon.png",
      data: {
        type: "alert",
        severity,
      },
    });
  }

  async sendCaregiverUpdate(
    subscription: PushSubscription,
    userName: string,
    updateMessage: string
  ): Promise<boolean> {
    return this.sendNotification(subscription, {
      title: `💚 Update from ${userName}`,
      body: updateMessage,
      icon: "/favicon.png",
      badge: "/favicon.png",
      data: {
        type: "caregiver_update",
        userName,
      },
    });
  }

  getPublicKey(): string {
    return vapidKeys.publicKey;
  }
}

export const pushNotificationService = new PushNotificationService();
