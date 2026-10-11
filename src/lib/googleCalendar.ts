import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { Task } from '../types';

const TOKEN_STORAGE_KEY = 'lifeblocks_gcal_token';

export const syncTokenToServer = async (token: string, email?: string, userId?: string) => {
  try {
    await fetch('/api/user/set-gcal-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, email, userId }),
    });
  } catch (err) {
    console.warn('[GoogleCalendar] Could not push token to server:', err);
  }
};

let cachedAccessToken: string | null = null;
if (typeof window !== 'undefined') {
  try {
    cachedAccessToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (cachedAccessToken) {
      // Sync to server immediately on script load
      syncTokenToServer(cachedAccessToken).catch(() => {});
    }
  } catch {}
}

export const setGoogleCalendarToken = (token: string | null, email?: string, userId?: string) => {
  cachedAccessToken = token;
  if (typeof window !== 'undefined') {
    try {
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
        syncTokenToServer(token, email, userId);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch {}
  }
};

export const getGoogleCalendarToken = (): string | null => {
  if (!cachedAccessToken && typeof window !== 'undefined') {
    try {
      cachedAccessToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {}
  }
  return cachedAccessToken;
};

export const connectGoogleCalendar = async (): Promise<string | null> => {
  try {
    const calendarProvider = new GoogleAuthProvider();
    calendarProvider.addScope('https://www.googleapis.com/auth/calendar.events');
    calendarProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
    calendarProvider.setCustomParameters({ prompt: 'select_account' });

    const result = await signInWithPopup(auth, calendarProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (credential?.accessToken) {
      setGoogleCalendarToken(credential.accessToken, result.user?.email || undefined, result.user?.uid || undefined);
      return credential.accessToken;
    }
    return null;
  } catch (error) {
    console.error('Error connecting Google Calendar:', error);
    throw error;
  }
};

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  htmlLink?: string;
}

export const getTaskOccurrenceDates = (task: Task): { dateStr: string; startTime: string; endTime: string }[] => {
  if (!task.assignedDate) return [];

  const rawSlot = (task.timeSlot || '09:00 - 10:00').trim();
  let startTime = '09:00';
  let endTime = '10:00';

  if (rawSlot.includes(' - ')) {
    const parts = rawSlot.split(' - ');
    startTime = parts[0]?.trim() || '09:00';
    endTime = parts[1]?.trim() || '10:00';
  } else if (rawSlot.length > 0) {
    // Single time given like "16:00" or "09:30"
    startTime = rawSlot;
    const [hStr, mStr] = startTime.split(':');
    const startH = parseInt(hStr, 10) || 9;
    const startM = parseInt(mStr, 10) || 0;
    const durationMinutes = Math.max(30, Math.round((Number(task.estimatedHours) || 1) * 60));
    const totalMinutes = startH * 60 + startM + durationMinutes;
    const endH = Math.min(23, Math.floor(totalMinutes / 60));
    const endM = totalMinutes % 60;
    endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  }

  // Safety check: ensure endTime is strictly after startTime (prevents Google Calendar 400 bad request)
  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);
  if (isNaN(eH) || isNaN(eM) || eH * 60 + eM <= sH * 60 + sM) {
    const validMinutes = (sH * 60 + sM + 60) % 1440;
    endTime = `${String(Math.floor(validMinutes / 60)).padStart(2, '0')}:${String(validMinutes % 60).padStart(2, '0')}`;
  }

  if (!task.recurringDays || task.recurringDays.length === 0 || !task.dueDate) {
    return [{ dateStr: task.assignedDate, startTime, endTime }];
  }

  const start = new Date(task.assignedDate + 'T00:00:00');
  const end = new Date(task.dueDate + 'T00:00:00');
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return [{ dateStr: task.assignedDate, startTime, endTime }];
  }

  const occurrences: { dateStr: string; startTime: string; endTime: string }[] = [];
  let cur = new Date(start);
  while (cur <= end) {
    const dayOfWeek = cur.getDay(); // 0=Dom, 1=Lun...
    if (task.recurringDays.includes(dayOfWeek)) {
      const yyyy = cur.getFullYear();
      const mm = String(cur.getMonth() + 1).padStart(2, '0');
      const dd = String(cur.getDate()).padStart(2, '0');
      occurrences.push({ dateStr: `${yyyy}-${mm}-${dd}`, startTime, endTime });
    }
    cur.setDate(cur.getDate() + 1);
  }

  return occurrences.length > 0 ? occurrences : [{ dateStr: task.assignedDate, startTime, endTime }];
};

export const createGoogleCalendarEvent = async (
  accessToken: string,
  event: {
    summary: string;
    description: string;
    dateStr: string;
    startTime: string;
    endTime: string;
  }
): Promise<any> => {
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Bogota';

  // Compute timezone offset formatted as +/-HH:MM
  const pad = (n: number) => String(n).padStart(2, '0');
  const getISOWithOffset = (dateStr: string, timeStr: string) => {
    try {
      const d = new Date(`${dateStr}T${timeStr}:00`);
      if (isNaN(d.getTime())) {
        return `${dateStr}T${timeStr}:00-05:00`;
      }
      const offsetMin = -d.getTimezoneOffset();
      const sign = offsetMin >= 0 ? '+' : '-';
      const offH = pad(Math.floor(Math.abs(offsetMin) / 60));
      const offM = pad(Math.abs(offsetMin) % 60);
      return `${dateStr}T${timeStr}:00${sign}${offH}:${offM}`;
    } catch {
      return `${dateStr}T${timeStr}:00-05:00`;
    }
  };

  const startDateTime = getISOWithOffset(event.dateStr, event.startTime);
  const endDateTime = getISOWithOffset(event.dateStr, event.endTime);

  // Robust deduplication: check if an event with this exact or matching summary already exists
  try {
    const startDateObj = new Date(startDateTime);
    // Expand search window to ±18 hours to safely encompass local day in any timezone
    const timeMin = new Date(startDateObj.getTime() - 18 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(startDateObj.getTime() + 18 * 60 * 60 * 1000).toISOString();
    const rawSearch = event.summary.replace(/^(\[LifeBlocks\]|💖\s*\[[^\]]+\])\s*/i, '').trim();
    const searchUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&maxResults=50`;
    const existingCheck = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (existingCheck.ok) {
      const existingData = await existingCheck.json();
      const normRaw = rawSearch.toLowerCase();
      const match = (existingData.items || []).find((ev: any) => {
        const evSum = (ev.summary || '').toLowerCase().trim();
        const evStart = ev.start?.dateTime || ev.start?.date || '';
        const sameDay = evStart.startsWith(event.dateStr);
        const titleMatch = evSum.includes(normRaw) || normRaw.includes(evSum.replace(/^(\[lifeblocks\]|💖\s*\[[^\]]+\])\s*/i, '').trim());
        return titleMatch && (sameDay || Math.abs(new Date(evStart).getTime() - startDateObj.getTime()) < 4 * 60 * 60 * 1000);
      });
      if (match) {
        console.log(`[GoogleCalendar] Event "${event.summary}" already exists on ${event.dateStr} (${match.id}), avoiding duplicate creation.`);
        return match;
      }
    }
  } catch (searchErr) {
    console.warn('[GoogleCalendar] Error checking existing events:', searchErr);
  }

  const body = {
    summary: event.summary,
    description: event.description,
    start: {
      dateTime: startDateTime,
      timeZone: userTimeZone,
    },
    end: {
      dateTime: endDateTime,
      timeZone: userTimeZone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 10 }, // Alarma nativa 10 min antes
        { method: 'popup', minutes: 60 }, // Aviso 1 hora antes
      ],
    },
  };

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 401) {
      setGoogleCalendarToken(null);
      throw new Error('Tu sesión de Google Calendar ha caducado. Por favor haz clic en "Vincular Google Cal" para renovar el permiso.');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Error (${response.status}) al crear evento en Google Calendar`);
  }

  return await response.json();
};

const inFlightSyncTasks = new Set<string>();

export const syncSingleTaskToGoogleCalendar = async (
  accessToken: string,
  task: Task
): Promise<any[]> => {
  // If already marked as synced and has an event ID, avoid duplicate creation
  if (task.gcalSynced && task.gcalEventId) {
    return [{ id: task.gcalEventId, summary: task.title }];
  }

  const syncKey = `${task.id || task.title}_${task.assignedDate || ''}_${task.timeSlot || ''}`;
  if (inFlightSyncTasks.has(syncKey)) {
    console.log(`[GoogleCalendar] Task sync already in flight for ${syncKey}, skipping duplicate invocation.`);
    return task.gcalEventId ? [{ id: task.gcalEventId, summary: task.title }] : [];
  }
  inFlightSyncTasks.add(syncKey);

  try {
    const occurrences = getTaskOccurrenceDates(task);
    const results = [];
    const isPartner = Boolean(task.assignedBy);
    const prefix = isPartner ? `💖 [Asignado por ${task.assignedBy}] ` : '[LifeBlocks] ';

    let description = '';
    if (isPartner) {
      description += `💜 Tarea asignada por: ${task.assignedBy} para ${task.assignedTo || 'Miguel'}\n`;
    }
    if (task.finalGoal) {
      description += `🎯 Meta: ${task.finalGoal}\n`;
    }
    if (task.category) {
      description += `📂 Categoría: ${task.category}\n`;
    }
    if (task.description) {
      description += `📝 Detalle: ${task.description}\n`;
    }
    description += `\n⏰ Alarma nativa programada a 10 minutos antes mediante Google Calendar.`;

    for (const occ of occurrences) {
      const res = await createGoogleCalendarEvent(accessToken, {
        summary: `${prefix}${task.title}`,
        description,
        dateStr: occ.dateStr,
        startTime: occ.startTime,
        endTime: occ.endTime,
      });
      results.push(res);
    }

    if (results.length > 0 && results[0]?.id) {
      task.gcalSynced = true;
      task.gcalEventId = results[0].id;
    }

    return results;
  } finally {
    // Release in-flight lock after 5 seconds to prevent rapid double triggers
    setTimeout(() => {
      inFlightSyncTasks.delete(syncKey);
    }, 5000);
  }
};

export const fetchGoogleCalendarEvents = async (
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<GoogleCalendarEvent[]> => {
  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.append('timeMin', timeMin);
  url.searchParams.append('timeMax', timeMax);
  url.searchParams.append('singleEvents', 'true');
  url.searchParams.append('orderBy', 'startTime');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Error al obtener eventos de Google Calendar');
  }

  const data = await response.json();
  return data.items || [];
};

export interface ParsedGoogleEvent {
  id: string;
  summary: string;
  dateStr: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  isAllDay: boolean;
  htmlLink?: string;
}

export const parseGoogleCalendarEvent = (gEvent: GoogleCalendarEvent): ParsedGoogleEvent | null => {
  if (!gEvent) return null;

  const summary = gEvent.summary || 'Evento ocupado en Google Calendar';

  // All day event
  if (gEvent.start?.date) {
    return {
      id: gEvent.id || Math.random().toString(),
      summary,
      dateStr: gEvent.start.date,
      startTime: '00:00',
      endTime: '23:59',
      isAllDay: true,
      htmlLink: gEvent.htmlLink,
    };
  }

  if (gEvent.start?.dateTime) {
    const startDate = new Date(gEvent.start.dateTime);
    const endDate = gEvent.end?.dateTime ? new Date(gEvent.end.dateTime) : new Date(startDate.getTime() + 3600000);

    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = startDate.getFullYear();
    const mm = pad(startDate.getMonth() + 1);
    const dd = pad(startDate.getDate());
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const startTime = `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`;
    const endTime = `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;

    return {
      id: gEvent.id || Math.random().toString(),
      summary,
      dateStr,
      startTime,
      endTime,
      isAllDay: false,
      htmlLink: gEvent.htmlLink,
    };
  }

  return null;
};

export const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
};

export const isTimeOverlap = (
  slotA: { startTime: string; endTime: string },
  slotB: { startTime: string; endTime: string }
): boolean => {
  const startA = parseTimeToMinutes(slotA.startTime);
  const endA = parseTimeToMinutes(slotA.endTime);
  const startB = parseTimeToMinutes(slotB.startTime);
  const endB = parseTimeToMinutes(slotB.endTime);

  return Math.max(startA, startB) < Math.min(endA, endB);
};

