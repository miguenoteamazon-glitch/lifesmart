import { Task, Habit } from '../types';
import { isHabitCompletedOn, getTodayDateString } from '../utils/habitHelpers';

export interface WebNotificationSettings {
  enabled: boolean;
  notifyUpcomingTasks: boolean;
  taskAdvanceMinutes: number; // e.g. 15 minutes before
  notifyUrgentTasks: boolean;
  notifyHabits: boolean;
  notifyNightHabits: boolean;
  soundEnabled: boolean;
  lastUpdated?: string;
}

const SETTINGS_STORAGE_KEY = 'lifeblocks_web_push_settings';
const NOTIFIED_CACHE_KEY = 'lifeblocks_notified_events_v2';

export const DEFAULT_NOTIFICATION_SETTINGS: WebNotificationSettings = {
  enabled: true,
  notifyUpcomingTasks: true,
  taskAdvanceMinutes: 15,
  notifyUrgentTasks: true,
  notifyHabits: true,
  notifyNightHabits: true,
  soundEnabled: true,
};

let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
let audioContext: AudioContext | null = null;

/**
 * Check if the browser supports the Notifications API
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current browser notification permission
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Load user notification preferences from localStorage
 */
export function getWebNotificationSettings(): WebNotificationSettings {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_SETTINGS;
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

/**
 * Save user notification preferences to localStorage
 */
export function saveWebNotificationSettings(settings: Partial<WebNotificationSettings>): WebNotificationSettings {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_SETTINGS;
  const current = getWebNotificationSettings();
  const updated: WebNotificationSettings = {
    ...current,
    ...settings,
    lastUpdated: new Date().toISOString(),
  };
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving notification settings:', e);
  }
  return updated;
}

/**
 * Request notification permission from the user
 */
export async function requestWebNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    if (granted) {
      saveWebNotificationSettings({ enabled: true });
      await registerServiceWorker();
    }
    return granted;
  } catch (error) {
    console.warn('Could not request notification permission:', error);
    return false;
  }
}

/**
 * Register Service Worker for web push & rich background notifications
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    serviceWorkerRegistration = reg;
    return reg;
  } catch (err) {
    console.warn('[LifeBlocks SW] Service Worker registration failed, falling back to window.Notification:', err);
    return null;
  }
}

/**
 * Synthesizes a pleasant audio chime using Web Audio API
 */
export function playNotificationChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioContext || audioContext.state === 'closed') {
      audioContext = new AudioCtx();
    }

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const now = audioContext.currentTime;

    // First harmonious bell note
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Second bell harmonic note
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.08); // A5
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.22); // D6

    gain2.gain.setValueAtTime(0.001, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.22, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.65);
  } catch (e) {
    console.debug('Could not play notification chime:', e);
  }
}

export interface WebNotificationOptions {
  body: string;
  tag?: string;
  icon?: string;
  badge?: string;
  url?: string;
  playSound?: boolean;
}

/**
 * Dispatches a native browser notification via Service Worker or window.Notification
 */
export async function sendWebNotification(
  title: string,
  options: WebNotificationOptions
): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  const settings = getWebNotificationSettings();
  if (!settings.enabled) return false;

  if (options.playSound !== false && settings.soundEnabled) {
    playNotificationChime();
  }

  const notificationPayload = {
    body: options.body,
    icon: options.icon || '/favicon.svg',
    badge: options.badge || '/favicon.svg',
    tag: options.tag || `lifeblocks-${Date.now()}`,
    data: {
      url: options.url || '/',
      timestamp: Date.now(),
    },
  };

  // Try Service Worker registration first (supports PWA, background, and actions)
  try {
    if (!serviceWorkerRegistration && 'serviceWorker' in navigator) {
      serviceWorkerRegistration = await navigator.serviceWorker.getRegistration();
    }

    if (serviceWorkerRegistration && 'showNotification' in serviceWorkerRegistration) {
      await serviceWorkerRegistration.showNotification(title, notificationPayload);
      return true;
    }
  } catch (swErr) {
    console.debug('[LifeBlocks SW] SW showNotification failed, trying window.Notification fallback:', swErr);
  }

  // Fallback to standard window.Notification API
  try {
    const notif = new Notification(title, notificationPayload);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return true;
  } catch (err) {
    console.error('Error triggering window.Notification:', err);
    return false;
  }
}

/**
 * Deduplication helper to prevent alerting the same event multiple times on the same day
 */
function hasBeenNotified(key: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(NOTIFIED_CACHE_KEY);
    if (!raw) return false;
    const cache: Record<string, number> = JSON.parse(raw);
    const lastNotifiedAt = cache[key];
    if (!lastNotifiedAt) return false;

    // Expire cache items after 18 hours
    const eighteenHoursMs = 18 * 60 * 60 * 1000;
    if (Date.now() - lastNotifiedAt > eighteenHoursMs) {
      delete cache[key];
      localStorage.setItem(NOTIFIED_CACHE_KEY, JSON.stringify(cache));
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function markAsNotified(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(NOTIFIED_CACHE_KEY);
    const cache: Record<string, number> = raw ? JSON.parse(raw) : {};
    cache[key] = Date.now();
    localStorage.setItem(NOTIFIED_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.debug('Error recording notification cache:', e);
  }
}

/**
 * Parse time string (e.g. "14:30 - 15:30", "09:15", "16:00") into minutes from midnight
 */
function parseStartTimeToMinutes(timeSlotStr?: string): number | null {
  if (!timeSlotStr) return null;
  // Match first HH:MM format
  const match = timeSlotStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

/**
 * Main evaluation engine: inspects upcoming tasks and habits, firing push alerts if matching window
 */
export async function evaluateUpcomingAlerts(tasks: Task[], habits: Habit[]): Promise<{
  triggeredTasks: number;
  triggeredHabits: number;
}> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return { triggeredTasks: 0, triggeredHabits: 0 };
  }

  const settings = getWebNotificationSettings();
  if (!settings.enabled) {
    return { triggeredTasks: 0, triggeredHabits: 0 };
  }

  const now = new Date();
  const todayStr = getTodayDateString();
  const currentMinutesFromMidnight = now.getHours() * 60 + now.getMinutes();
  const currentHour = now.getHours();

  let triggeredTasks = 0;
  let triggeredHabits = 0;

  // 1. EVALUATE UPCOMING TASKS
  if (settings.notifyUpcomingTasks && Array.isArray(tasks)) {
    const todayTasks = tasks.filter(t => {
      const isForToday = t.assignedDate === todayStr || (!t.assignedDate && t.dueDate === todayStr);
      const isPending = t.status !== 'completada' && t.status !== 'cancelada';
      return isForToday && isPending;
    });

    for (const task of todayTasks) {
      const taskStartMinutes = parseStartTimeToMinutes(task.timeSlot);

      if (taskStartMinutes !== null) {
        const diffMinutes = taskStartMinutes - currentMinutesFromMidnight;
        const advanceWindow = settings.taskAdvanceMinutes || 15;

        // Trigger if time is within advance window (e.g., 0 to 15 min before start)
        if (diffMinutes >= 0 && diffMinutes <= advanceWindow) {
          const dedupKey = `task_upcoming_${task.id}_${todayStr}`;
          if (!hasBeenNotified(dedupKey)) {
            const timeLabel = diffMinutes === 0 ? '¡Ahora mismo!' : `en ~${diffMinutes} min`;
            const title = `⏰ Tarea Próxima: ${task.title}`;
            const body = `${timeLabel} (${task.timeSlot}) • ${task.description || task.finalGoal || 'Compromiso agendado en LifeBlocks'}`;

            await sendWebNotification(title, {
              body,
              tag: dedupKey,
              playSound: true,
            });

            markAsNotified(dedupKey);
            triggeredTasks++;
          }
        }
      }

      // Urgent Task Alert if scheduled for today and morning or afternoon check
      if (settings.notifyUrgentTasks && (task.priority === 'urgente' || task.priority === 'alta')) {
        const isMorningCheck = currentHour === 9 && now.getMinutes() < 30;
        if (isMorningCheck) {
          const urgentDedupKey = `task_urgent_morning_${task.id}_${todayStr}`;
          if (!hasBeenNotified(urgentDedupKey)) {
            await sendWebNotification(`🚨 Tarea Prioritaria de Hoy: ${task.title}`, {
              body: `Prioridad ${task.priority.toUpperCase()} programada para hoy. ¡Asegúrate de atenderla!`,
              tag: urgentDedupKey,
              playSound: true,
            });
            markAsNotified(urgentDedupKey);
            triggeredTasks++;
          }
        }
      }
    }
  }

  // 2. EVALUATE HABIT REMINDERS
  if (settings.notifyHabits && Array.isArray(habits)) {
    const activeHabits = habits.filter(h => !h.archived);
    const pendingHabits = activeHabits.filter(h => !isHabitCompletedOn(h, todayStr));

    for (const habit of pendingHabits) {
      if (habit.targetTime) {
        const habitMinutes = parseStartTimeToMinutes(habit.targetTime);
        if (habitMinutes !== null) {
          const diff = Math.abs(currentMinutesFromMidnight - habitMinutes);
          // Within 5 minutes of target time
          if (diff <= 5) {
            const habitDedupKey = `habit_target_${habit.id}_${todayStr}`;
            if (!hasBeenNotified(habitDedupKey)) {
              await sendWebNotification(`✨ Momento de tu Hábito: ${habit.title}`, {
                body: `Programado para las ${habit.targetTime}. ¡Constancia en tu racha diaria!`,
                tag: habitDedupKey,
                playSound: true,
              });
              markAsNotified(habitDedupKey);
              triggeredHabits++;
            }
          }
        }
      }
    }

    // Night reminder (at 21:00 or 22:00) for remaining uncompleted habits
    if (settings.notifyNightHabits && currentHour >= 21 && pendingHabits.length > 0) {
      const nightDedupKey = `habit_night_summary_${todayStr}`;
      if (!hasBeenNotified(nightDedupKey)) {
        const habitTitles = pendingHabits.slice(0, 3).map(h => h.title).join(', ');
        const extra = pendingHabits.length > 3 ? ` y ${pendingHabits.length - 3} más` : '';
        await sendWebNotification(`🌙 ${pendingHabits.length} Hábito(s) Pendiente(s) Hoy`, {
          body: `No olvides registrar: ${habitTitles}${extra} antes de medianoche.`,
          tag: nightDedupKey,
          playSound: true,
        });
        markAsNotified(nightDedupKey);
        triggeredHabits++;
      }
    }
  }

  return { triggeredTasks, triggeredHabits };
}

/**
 * Triggers an immediate test notification so the user can verify their system permissions & sound
 */
export async function sendTestNotification(): Promise<boolean> {
  const perm = getNotificationPermission();
  if (perm !== 'granted') {
    const granted = await requestWebNotificationPermission();
    if (!granted) return false;
  }

  return sendWebNotification('🔔 Notificación Web Push Activa', {
    body: '¡Todo listo! Recibirás alertas automáticas sobre tus tareas próximas y recordatorios de hábitos.',
    tag: `test-notification-${Date.now()}`,
    playSound: true,
  });
}
