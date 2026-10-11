import { Habit } from '../types';
import { isHabitCompletedOn, getTodayDateString } from './habitHelpers';

const HABIT_NOTIFICATIONS_KEY = 'lifeblocks_habit_notifications_enabled';
const HABIT_LAST_NOTIFIED_KEY = 'lifeblocks_habit_last_notified_date';

export interface HabitNotificationStatus {
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  isEnabled: boolean;
  userTimezone: string;
  targetTimeStr: string; // e.g. "22:00 (10:00 PM)"
  isPastTargetToday: boolean;
  pendingHabitsCount: number;
  lastNotifiedDate: string | null;
}

/**
 * Gets user's current IANA timezone (e.g., 'America/Bogota', 'America/New_York', 'Europe/Madrid')
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Checks if browser supports notifications
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Checks if the user has enabled habit reminders in app settings
 */
export function getHabitNotificationsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(HABIT_NOTIFICATIONS_KEY);
  if (stored === null) {
    // Default to true if notifications are granted
    return isNotificationSupported() && Notification.permission === 'granted';
  }
  return stored === 'true';
}

/**
 * Sets user preference for habit notifications
 */
export function setHabitNotificationsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HABIT_NOTIFICATIONS_KEY, enabled ? 'true' : 'false');
}

/**
 * Gets overall status of habit notifications
 */
export function getHabitNotificationStatus(habits: Habit[]): HabitNotificationStatus {
  const isSupported = isNotificationSupported();
  const permission: NotificationPermission | 'unsupported' = isSupported 
    ? Notification.permission 
    : 'unsupported';
  
  const isEnabled = getHabitNotificationsEnabled();
  const userTimezone = getUserTimezone();
  const todayStr = getTodayDateString();
  const lastNotifiedDate = typeof window !== 'undefined' 
    ? localStorage.getItem(HABIT_LAST_NOTIFIED_KEY) 
    : null;

  const now = new Date();
  const currentHour = now.getHours();
  // 2 hours before end of day is 22:00 (10:00 PM)
  const isPastTargetToday = currentHour >= 22;

  const activeHabits = Array.isArray(habits) ? habits.filter(h => !h.archived) : [];
  const pendingHabits = activeHabits.filter(h => !isHabitCompletedOn(h, todayStr));

  return {
    isSupported,
    permission,
    isEnabled,
    userTimezone,
    targetTimeStr: '22:00 (10:00 PM)',
    isPastTargetToday,
    pendingHabitsCount: pendingHabits.length,
    lastNotifiedDate,
  };
}

/**
 * Requests browser notification permission
 */
export async function requestHabitNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setHabitNotificationsEnabled(true);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Triggers a habit reminder notification
 */
export function sendHabitReminderNotification(pendingHabits: Habit[]): boolean {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  const count = pendingHabits.length;
  if (count === 0) return false;

  const habitNames = pendingHabits.slice(0, 3).map(h => `• ${h.title}`).join('\n');
  const extra = count > 3 ? `\n...y ${count - 3} hábito(s) más` : '';

  const title = `⏳ ¡2 horas para finalizar el día! (${count} ${count === 1 ? 'hábito pendiente' : 'hábitos pendientes'})`;
  const body = `Mantén tus rachas activas hoy en tu zona horaria:\n${habitNames}${extra}\n¡Aún estás a tiempo de completarlos!`;

  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'habit-night-reminder',
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Mark as notified today
    const todayStr = getTodayDateString();
    localStorage.setItem(HABIT_LAST_NOTIFIED_KEY, todayStr);
    return true;
  } catch (err) {
    console.warn('Failed to send habit notification:', err);
    return false;
  }
}

/**
 * Checks and triggers notification if conditions are met:
 * 1. Notifications supported and granted
 * 2. Enabled by user
 * 3. Current local time is 22:00 or later (2 hours before midnight)
 * 4. Not yet notified today
 * 5. There are pending habits today
 */
export function checkAndTriggerNightHabitNotification(habits: Habit[], force: boolean = false): boolean {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;
  if (!force && !getHabitNotificationsEnabled()) return false;

  const todayStr = getTodayDateString();
  const lastNotified = localStorage.getItem(HABIT_LAST_NOTIFIED_KEY);
  
  if (!force && lastNotified === todayStr) {
    // Already notified today
    return false;
  }

  const now = new Date();
  const hours = now.getHours();

  // "2 horas antes de finalizar el día" = 22:00 in local timezone
  if (!force && hours < 22) {
    return false;
  }

  const activeHabits = Array.isArray(habits) ? habits.filter(h => !h.archived) : [];
  const pendingHabits = activeHabits.filter(h => !isHabitCompletedOn(h, todayStr));

  if (pendingHabits.length === 0) {
    return false;
  }

  return sendHabitReminderNotification(pendingHabits);
}

/**
 * Sends an immediate test notification to verify audio/visual alerts
 */
export function sendTestHabitNotification(habits: Habit[]): boolean {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const activeHabits = Array.isArray(habits) ? habits.filter(h => !h.archived) : [];
  const todayStr = getTodayDateString();
  const pending = activeHabits.filter(h => !isHabitCompletedOn(h, todayStr));
  const sampleHabits = pending.length > 0 
    ? pending 
    : (activeHabits.length > 0 ? activeHabits : [{ id: 'sample', title: 'Caminar 30 min', category: 'salud', frequency: 'daily', completedDates: [], streak: 3, bestStreak: 7, createdAt: todayStr }]);

  try {
    const tz = getUserTimezone();
    const title = `🔔 Prueba de Recordatorio de Hábitos (22:00)`;
    const body = `Zona horaria detectada: ${tz}\nLos recordatorios automáticos se enviarán 2 horas antes de medianoche (22:00 hrs) si tienes hábitos pendientes.`;
    
    new Notification(title, {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
    });
    return true;
  } catch (e) {
    console.error('Test notification failed:', e);
    return false;
  }
}
