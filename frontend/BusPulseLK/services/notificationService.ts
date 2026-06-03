// services/notificationService.ts
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ── Constants ─────────────────────────────────────────────────────────────────
const TRACKING_NOTIF_ID_KEY = 'buspulse_tracking_notif_id';
const WORKER_ACTION_KEY = 'buspulse_worker_last_action';
const ACTIVE_TRACKING_KEY = 'buspulse_active_tracking';

const TRACKING_CHANNEL_ID = 'buspulse-tracking';
const WORKER_CHANNEL_ID = 'buspulse-worker';

// Notification category identifiers
const CAT_WORKER_MANUAL = 'WORKER_MANUAL';
const CAT_TRACKING = 'TRACKING';

// Action identifier
export const ACTION_MARK_PASSED = 'MARK_PASSED';

// ── Setup ─────────────────────────────────────────────────────────────────────

/** Call this once at app startup (root _layout). */
export async function setupNotifications(): Promise<void> {
  // Set default handler (foreground behaviour)
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Android channels
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(TRACKING_CHANNEL_ID, {
      name: 'Bus Tracking',
      importance: Notifications.AndroidImportance.LOW,
      vibrationPattern: [0],
    });
    await Notifications.setNotificationChannelAsync(WORKER_CHANNEL_ID, {
      name: 'Trip Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250],
    });
  }

  // Notification categories with actions
  await Notifications.setNotificationCategoryAsync(CAT_WORKER_MANUAL, [
    {
      identifier: ACTION_MARK_PASSED,
      buttonTitle: '✅ Mark Passed',
      options: { opensAppToForeground: false },
    },
  ]);
}

/** Request notification permissions. Returns true if granted. */
export async function requestPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ── Passenger Tracking Notification ───────────────────────────────────────────

/** Show/update the persistent passenger tracking notification. */
export async function showPassengerTrackingNotification(
  busName: string,
  nextStop: string,
  progressPercent: number,
): Promise<void> {
  const existing = await AsyncStorage.getItem(TRACKING_NOTIF_ID_KEY);
  if (existing) {
    await Notifications.dismissNotificationAsync(existing);
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `🚌 Tracking ${busName}`,
      body: `Next Stop: ${nextStop} • ${Math.round(progressPercent)}% complete`,
      sticky: true,
      data: { type: 'passenger_tracking' },
      categoryIdentifier: CAT_TRACKING,
      ...(Platform.OS === 'android' ? { channelId: TRACKING_CHANNEL_ID } : {}),
    },
    trigger: null,
  });

  await AsyncStorage.setItem(TRACKING_NOTIF_ID_KEY, id);
}

/** Simple "Tracking [bus]" notification for automatic mode (passenger). */
export async function showAutoPassengerNotification(
  busName: string,
  busId: number,
  timetableId: number,
): Promise<void> {
  const existing = await AsyncStorage.getItem(TRACKING_NOTIF_ID_KEY);
  if (existing) await Notifications.dismissNotificationAsync(existing);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `🚌 Live Tracking Active`,
      body: `Tracking ${busName} in real-time`,
      sticky: true,
      data: { type: 'auto_passenger', busId, timetableId },
      categoryIdentifier: CAT_TRACKING,
      ...(Platform.OS === 'android' ? { channelId: TRACKING_CHANNEL_ID } : {}),
    },
    trigger: null,
  });

  await AsyncStorage.setItem(TRACKING_NOTIF_ID_KEY, id);
}

// ── Worker Trip Notification ──────────────────────────────────────────────────

/** Show/update the worker notification with a "Mark Passed" button. */
export async function showWorkerTripNotification(
  routeName: string,
  nextStopName: string,
  tripId: number,
  nextStopTownId: number,
): Promise<void> {
  const existing = await AsyncStorage.getItem(TRACKING_NOTIF_ID_KEY);
  if (existing) await Notifications.dismissNotificationAsync(existing);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `🗺️ ${routeName}`,
      body: `Next: ${nextStopName}`,
      sticky: true,
      data: { type: 'worker_manual', tripId, nextStopTownId, routeName },
      categoryIdentifier: CAT_WORKER_MANUAL,
      ...(Platform.OS === 'android' ? { channelId: WORKER_CHANNEL_ID } : {}),
    },
    trigger: null,
  });

  await AsyncStorage.setItem(TRACKING_NOTIF_ID_KEY, id);
}

/** Simple "Tracking" notification for automatic mode (worker). */
export async function showAutoWorkerNotification(
  routeName: string,
  busId: number,
  timetableId: number,
): Promise<void> {
  const existing = await AsyncStorage.getItem(TRACKING_NOTIF_ID_KEY);
  if (existing) await Notifications.dismissNotificationAsync(existing);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `📍 GPS Tracking Active`,
      body: `Transmitting location for ${routeName}`,
      sticky: true,
      data: { type: 'auto_worker', busId, timetableId, routeName },
      categoryIdentifier: CAT_TRACKING,
      ...(Platform.OS === 'android' ? { channelId: WORKER_CHANNEL_ID } : {}),
    },
    trigger: null,
  });

  await AsyncStorage.setItem(TRACKING_NOTIF_ID_KEY, id);
}

// ── Cancel ────────────────────────────────────────────────────────────────────

/** Dismiss the active tracking notification and clear stored ID. */
export async function cancelTrackingNotification(): Promise<void> {
  const id = await AsyncStorage.getItem(TRACKING_NOTIF_ID_KEY);
  if (id) {
    await Notifications.dismissNotificationAsync(id);
    await AsyncStorage.removeItem(TRACKING_NOTIF_ID_KEY);
  }
}

// ── Active Tracking Session (Passenger) ──────────────────────────────────────

export interface ActiveTracking {
  busId: number;
  timetableId?: number;
  busName: string;
}

export async function getActiveTracking(): Promise<ActiveTracking | null> {
  const raw = await AsyncStorage.getItem(ACTIVE_TRACKING_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function setActiveTracking(data: ActiveTracking): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_TRACKING_KEY, JSON.stringify(data));
}

export async function clearActiveTracking(): Promise<void> {
  await AsyncStorage.removeItem(ACTIVE_TRACKING_KEY);
}

// ── Worker Action Result (for syncing to app UI) ──────────────────────────────

export interface WorkerLastAction {
  townId: number;
  timestamp: number;
}

export async function setWorkerLastAction(data: WorkerLastAction): Promise<void> {
  await AsyncStorage.setItem(WORKER_ACTION_KEY, JSON.stringify(data));
}

export async function getWorkerLastAction(): Promise<WorkerLastAction | null> {
  const raw = await AsyncStorage.getItem(WORKER_ACTION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function clearWorkerLastAction(): Promise<void> {
  await AsyncStorage.removeItem(WORKER_ACTION_KEY);
}
