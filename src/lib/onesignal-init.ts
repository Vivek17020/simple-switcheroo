// OneSignal initialization utility
export const initializeOneSignal = () => {
  if (typeof window === 'undefined') return;

  // Load OneSignal SDK
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  
  window.OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.init({
      appId: "1ace9244-6c2b-4b2c-852f-1583c1ff0f72",
      safari_web_id: "web.onesignal.auto.1ace9244-6c2b-4b2c-852f-1583c1ff0f72",
      notifyButton: {
        enable: false, // We'll use our custom button
      },
      allowLocalhostAsSecureOrigin: true,
    });
  });

  // Load OneSignal script
  if (!document.getElementById('onesignal-sdk')) {
    const script = document.createElement('script');
    script.id = 'onesignal-sdk';
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.defer = true;
    document.head.appendChild(script);
  }
};

// Subscribe user to notifications
export const subscribeToNotifications = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !window.OneSignal) {
    return false;
  }

  try {
    const OneSignal = window.OneSignal;
    
    // Check if already subscribed
    const isPushSupported = await OneSignal.Notifications.isPushSupported();
    if (!isPushSupported) {
      throw new Error('Push notifications not supported');
    }

    const permission = await OneSignal.Notifications.permission;
    
    if (permission === 'granted') {
      // Already subscribed
      return true;
    }

    if (permission === 'denied') {
      throw new Error('Notification permission denied. Please enable in browser settings.');
    }

    // Request permission
    const permissionGranted = await OneSignal.Notifications.requestPermission();
    
    if (permissionGranted) {
      // Opt in to notifications
      await OneSignal.User.PushSubscription.optIn();
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    throw error;
  }
};

// Check if user is subscribed
export const isSubscribedToNotifications = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !window.OneSignal) {
    return false;
  }

  try {
    const OneSignal = window.OneSignal;
    const permission = await OneSignal.Notifications.permission;
    const isOptedIn = await OneSignal.User.PushSubscription.optedIn;
    
    return permission === 'granted' && isOptedIn;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
};

// Unsubscribe from notifications
export const unsubscribeFromNotifications = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !window.OneSignal) {
    return false;
  }

  try {
    const OneSignal = window.OneSignal;
    await OneSignal.User.PushSubscription.optOut();
    return true;
  } catch (error) {
    console.error('Error unsubscribing:', error);
    throw error;
  }
};

// TypeScript declarations
declare global {
  interface Window {
    OneSignal: any;
    OneSignalDeferred: any[];
  }
}
