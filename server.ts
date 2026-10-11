import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory webhook incoming ideas queue (also stored per user if provided)
const incomingWebhookIdeas: Array<{
  id: string;
  source: string;
  rawText: string;
  title: string;
  description: string;
  categoryId: string;
  type: string;
  estimatedHours?: number;
  dailyHours?: number;
  finalGoal?: string;
  createdAt: string;
  userId?: string;
}> = [];

// In-memory webhook incoming tasks queue (for direct calendar scheduling)
export interface IncomingWebhookTask {
  id: string;
  source: string;
  rawText: string;
  title: string;
  description: string;
  category: string;
  type: string;
  priority?: string;
  status?: string;
  estimatedHours: number;
  completedHours?: number;
  assignedDate: string;
  dueDate?: string;
  timeSlot: string;
  tags?: string[];
  assignedBy?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt?: string;
  userId?: string;
}

const incomingWebhookTasks: IncomingWebhookTask[] = [];

// In-memory webhook incoming extra expenses queue (for invoices, receipts, and extra expenses)
export interface IncomingExtraExpense {
  id: string;
  source: string;
  rawText?: string;
  userId?: string;
  name: string;
  category: 'salidas_ocio' | 'compras_ropa' | 'salud_farmacia' | 'imprevisto_hogar' | 'regalos_celebracion' | 'transporte_extra' | 'tecnologia_hogar' | 'mascotas_extra' | 'otro';
  amount: number;
  dayOfMonth: number;
  date?: string;
  assignedQuincena?: 'quincena_1' | 'quincena_2' | 'general';
  isPaid: boolean;
  paidBy?: string;
  paymentMethod?: string;
  receiptNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const incomingWebhookExpenses: IncomingExtraExpense[] = [];

const EXTRA_EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  salidas_ocio: 'Salidas & Restaurantes',
  compras_ropa: 'Ropa & Compras',
  salud_farmacia: 'Salud & Farmacia',
  imprevisto_hogar: 'Imprevisto Hogar',
  regalos_celebracion: 'Regalos & Fiestas',
  transporte_extra: 'Transporte Extra',
  tecnologia_hogar: 'Tecnología & Gadgets',
  mascotas_extra: 'Mascotas & Veterinaria',
  otro: 'Otros Gastos',
};

const EXTRA_EXPENSE_CATEGORY_EMOJIS: Record<string, string> = {
  salidas_ocio: '🍽️',
  compras_ropa: '🛍️',
  salud_farmacia: '💊',
  imprevisto_hogar: '🔧',
  regalos_celebracion: '🎁',
  transporte_extra: '🚕',
  tecnologia_hogar: '💻',
  mascotas_extra: '🐾',
  otro: '📦',
};

// Deterministic Extra Expense and Invoice parser
function detectExpenseCategory(text: string): { 
  category: 'salidas_ocio' | 'compras_ropa' | 'salud_farmacia' | 'imprevisto_hogar' | 'regalos_celebracion' | 'transporte_extra' | 'tecnologia_hogar' | 'mascotas_extra' | 'otro'; 
  amount: number; 
  isPaid: boolean;
  name?: string;
  paidBy?: string;
} {
  const lower = (text || '').toLowerCase();
  let category: 'salidas_ocio' | 'compras_ropa' | 'salud_farmacia' | 'imprevisto_hogar' | 'regalos_celebracion' | 'transporte_extra' | 'tecnologia_hogar' | 'mascotas_extra' | 'otro' = 'otro';
  
  if (lower.includes('veterinari') || lower.includes('juguete') || lower.includes('perro') || lower.includes('gato') || lower.includes('mascota') || lower.includes('croquetas') || lower.includes('purina') || lower.includes('pet')) {
    category = 'mascotas_extra';
  } else if (lower.includes('restaurante') || lower.includes('cena') || lower.includes('almuerzo') || lower.includes('salida') || lower.includes('cine') || lower.includes('cafe') || lower.includes('café') || lower.includes('bar') || lower.includes('comida') || lower.includes('hamburguesa') || lower.includes('pizza')) {
    category = 'salidas_ocio';
  } else if (lower.includes('ropa') || lower.includes('calzado') || lower.includes('zapatos') || lower.includes('camisa') || lower.includes('pantalon') || lower.includes('pantalón') || lower.includes('tienda') || lower.includes('zara') || lower.includes('falabella') || lower.includes('h&m') || lower.includes('bershka') || lower.includes('pull') || lower.includes('stradivarius') || lower.includes('vestido') || lower.includes('tenis')) {
    category = 'compras_ropa';
  } else if (lower.includes('farmacia') || lower.includes('drogueria') || lower.includes('droguería') || lower.includes('medicamento') || lower.includes('remedio') || lower.includes('pastillas') || lower.includes('cruz verde') || lower.includes('rebaja') || lower.includes('farmatodo')) {
    category = 'salud_farmacia';
  } else if (lower.includes('imprevisto') || lower.includes('reparacion') || lower.includes('reparación') || lower.includes('plomero') || lower.includes('electricista') || lower.includes('arreglo') || lower.includes('tuberia') || lower.includes('tubería') || lower.includes('homecenter') || lower.includes('ferreteria') || lower.includes('ferretería')) {
    category = 'imprevisto_hogar';
  } else if (lower.includes('regalo') || lower.includes('cumpleano') || lower.includes('cumpleaños') || lower.includes('aniversario') || lower.includes('celebracion') || lower.includes('celebración') || lower.includes('fiesta') || lower.includes('detalle')) {
    category = 'regalos_celebracion';
  } else if (lower.includes('transporte') || lower.includes('gasolina') || lower.includes('taxi') || lower.includes('uber') || lower.includes('didi') || lower.includes('peaje') || lower.includes('parqueadero') || lower.includes('combustible')) {
    category = 'transporte_extra';
  } else if (lower.includes('tecnologia') || lower.includes('tecnología') || lower.includes('gadget') || lower.includes('cable') || lower.includes('cargador') || lower.includes('audifonos') || lower.includes('mouse') || lower.includes('teclado') || lower.includes('computador')) {
    category = 'tecnologia_hogar';
  }

  // Extract amount: e.g. 8200, 8.200, 8,200, 45000, 45.000, 45,000, $45.000, 40 mil, 2000000, etc.
  let amount = 0;
  const milMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:mil|k)\b/);
  if (milMatch) {
    amount = parseFloat(milMatch[1].replace(',', '.')) * 1000;
  } else {
    // 1. Look for explicit total / valor / monto / precio keywords first
    const explicitValMatch = lower.match(/(?:total\s*a\s*pagar|total|valor\s*total|valor|monto|precio|pago|costo|por|subtotal|neto|importe)\s*(?:de|es|:)?\s*\$?\s*([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d{3,9})/i);
    if (explicitValMatch) {
      const rawNum = explicitValMatch[1];
      // If contains decimal comma/dot like 8,200.00 or 8.200,00 or 8.200 (thousands)
      if (/^\d{1,3}\.\d{3}$/.test(rawNum) || /^\d{1,3},\d{3}$/.test(rawNum)) {
        amount = parseInt(rawNum.replace(/[.,]/g, ''), 10);
      } else if (rawNum.includes('.') && rawNum.includes(',')) {
        // e.g. 1.250,50 -> 1250 or 1,250.50 -> 1250
        const cleanNum = rawNum.replace(/\.\d{2}$/, '').replace(/,\d{2}$/, '').replace(/[.,]/g, '');
        amount = parseInt(cleanNum, 10);
      } else {
        const cleanNum = rawNum.replace(/[.,]/g, '');
        amount = parseInt(cleanNum, 10);
      }
    } else {
      // 2. Look for any money formatted number e.g. $8.200, $8200, 8.200 cop
      const moneyMatch = lower.match(/(?:\$|\b)([\d]{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?|\d{3,9})(?:\b|\s*cop|\s*pesos)/i);
      if (moneyMatch) {
        const cleanNum = moneyMatch[1].replace(/[.,]/g, '');
        amount = parseInt(cleanNum, 10);
      } else {
        // 3. Any standalone 3-8 digit number
        const standaloneNumMatch = lower.match(/\b(\d{3,8})\b/);
        if (standaloneNumMatch) {
          amount = parseInt(standaloneNumMatch[1], 10);
        }
      }
    }
  }

  // Check paidBy
  let paidBy = 'Miguel';
  if (lower.includes('liz') || lower.includes('esposa') || lower.includes('para liz') || lower.includes('de liz')) {
    paidBy = 'Liz';
  } else if (lower.includes('miguel') || lower.includes('yo') || lower.includes('para miguel')) {
    paidBy = 'Miguel';
  }

  // Extract name/concept
  let name = '';
  const cleanedFromCommands = text.replace(/^(factura|recibo|comprobante|gasto|compra|ticket)\s*(de|del|en|para|:)?\s*/i, '').trim();
  const nameParts = cleanedFromCommands.split(/(?:por|\$|\d|\bcon\b|\bya\b|\bpagado\b|\bpara\b)/i);
  if (nameParts[0] && nameParts[0].trim().length >= 3) {
    name = nameParts[0].trim();
  }

  const isPaid = !lower.includes('no pagado') && !lower.includes('sin pagar') && !lower.includes('pendiente');
  return { category, amount, isPaid, name: name || undefined, paidBy };
}

// Telegram deduplication cache for update_ids and message_ids
const processedTelegramUpdates = new Set<string>();

// Store Telegram chat IDs per user or bot token to send proactive notifications
const telegramSubscribers: Map<string, { chatId: number | string; username: string; token?: string; lastActive: string }> = new Map();

// Scheduled reminders and follow-up check-ins in-memory queue
interface ScheduledReminder {
  id: string;
  taskId?: string;
  userId?: string;
  chatId: number | string;
  token?: string;
  title: string;
  category: string;
  scheduledTime: number; // timestamp in ms when to fire
  eventTime: string; // e.g. "17:00"
  eventDate: string; // e.g. "2026-08-24"
  sent: boolean;
  type: 'habit' | 'task' | 'flexiones' | 'general' | 'followup_check';
  advanceMinutes?: number; // for proactive pre-reminders
  afterMinutes?: number; // for post-activity verification check-ins
  assignedBy?: string; // e.g. 'Liz'
}

const scheduledReminders: ScheduledReminder[] = [];

// Helper to parse local datetime into exact epoch ms assuming local timezone (default: Colombia UTC-5, America/Bogota)
function parseLocalDateTimeMs(dateStr?: string, timeStr?: string, defaultOffset: string = '-05:00'): number {
  try {
    if (!dateStr || !timeStr) return NaN;
    const cleanTime = timeStr.includes('-') ? timeStr.split('-')[0].trim() : timeStr.trim();
    const formattedTime = cleanTime.length === 5 ? `${cleanTime}:00` : cleanTime.slice(0, 8);
    // If timezone is already in string (Z, +, -), don't append defaultOffset
    const hasTz = /([+-]\d{2}:?\d{2}|Z)$/i.test(formattedTime);
    const isoString = `${dateStr}T${formattedTime}${hasTz ? '' : defaultOffset}`;
    const ms = new Date(isoString).getTime();
    return isNaN(ms) ? NaN : ms;
  } catch {
    return NaN;
  }
}

// User Google Calendar OAuth tokens store for server-side direct syncing
interface GoogleCalendarTokenRecord {
  token: string;
  email?: string;
  userId?: string;
  updatedAt: number;
}

const GOOGLE_TOKENS_FILE = path.join(process.cwd(), 'google_tokens.json');
const userGoogleTokens: Map<string, GoogleCalendarTokenRecord> = new Map();

function loadGoogleTokensFromDisk() {
  try {
    if (fs.existsSync(GOOGLE_TOKENS_FILE)) {
      const data = fs.readFileSync(GOOGLE_TOKENS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        for (const [k, v] of Object.entries(parsed)) {
          userGoogleTokens.set(k, v as GoogleCalendarTokenRecord);
        }
      }
    }
  } catch (err) {
    console.warn('[GoogleTokens] Could not load tokens from disk:', err);
  }
}

function saveGoogleTokensToDisk() {
  try {
    const obj: Record<string, GoogleCalendarTokenRecord> = {};
    for (const [k, v] of userGoogleTokens.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(GOOGLE_TOKENS_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[GoogleTokens] Could not save tokens to disk:', err);
  }
}

loadGoogleTokensFromDisk();

function getActiveGoogleToken(userId?: string): GoogleCalendarTokenRecord | null {
  if (userId && userGoogleTokens.has(userId)) {
    return userGoogleTokens.get(userId)!;
  }
  if (userGoogleTokens.size > 0) {
    const all = Array.from(userGoogleTokens.values());
    all.sort((a, b) => b.updatedAt - a.updatedAt);
    return all[0];
  }
  return null;
}

async function syncTaskToGoogleCalendarOnServer(task: {
  id?: string;
  title: string;
  description?: string;
  category?: string;
  assignedDate: string;
  timeSlot?: string;
  estimatedHours?: number;
  assignedBy?: string;
  assignedTo?: string;
}, userId?: string): Promise<{ success: boolean; eventId?: string; htmlLink?: string; error?: string }> {
  const tokenRec = getActiveGoogleToken(userId);
  if (!tokenRec || !tokenRec.token) {
    return { success: false, error: 'NO_TOKEN' };
  }

  try {
    const isPartner = Boolean(task.assignedBy);
    const prefix = isPartner ? `💖 [Asignado por ${task.assignedBy}] ` : '[LifeBlocks] ';
    const summary = `${prefix}${task.title}`;

    const rawSlot = (task.timeSlot || '09:00 - 10:00').trim();
    let startTime = '09:00';
    let endTime = '10:00';

    if (rawSlot.includes(' - ')) {
      const parts = rawSlot.split(' - ');
      startTime = parts[0]?.trim() || '09:00';
      endTime = parts[1]?.trim() || '10:00';
    } else if (rawSlot.length > 0) {
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

    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    if (isNaN(eH) || isNaN(eM) || eH * 60 + eM <= sH * 60 + sM) {
      const validMinutes = (sH * 60 + sM + 60) % 1440;
      endTime = `${String(Math.floor(validMinutes / 60)).padStart(2, '0')}:${String(validMinutes % 60).padStart(2, '0')}`;
    }

    const startDateTime = `${task.assignedDate}T${startTime}:00-05:00`;
    const endDateTime = `${task.assignedDate}T${endTime}:00-05:00`;

    let description = '';
    if (isPartner) {
      description += `💜 Tarea asignada por: ${task.assignedBy} para ${task.assignedTo || 'Miguel'}\n`;
    }
    if (task.category) {
      description += `📂 Categoría: ${task.category}\n`;
    }
    if (task.description) {
      description += `📝 Detalle: ${task.description}\n`;
    }
    description += `\n⏰ Alarma nativa programada 10 minutos antes.\nAgendado automáticamente desde Telegram vía LifeBlocks.`;

    const body = {
      summary,
      description,
      start: {
        dateTime: startDateTime,
        timeZone: 'America/Bogota',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Bogota',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 10 },
          { method: 'popup', minutes: 60 },
        ],
      },
    };

    // Check if an event with this title already exists on that date/time to prevent duplicate events
    try {
      const timeMin = `${task.assignedDate}T00:00:00-05:00`;
      const timeMax = `${task.assignedDate}T23:59:59-05:00`;
      const rawTitle = task.title.replace(/^(\[LifeBlocks\]|💖\s*\[[^\]]+\])\s*/i, '').trim();
      const searchUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&q=${encodeURIComponent(rawTitle)}&singleEvents=true`;
      const checkResp = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${tokenRec.token}` },
      });
      if (checkResp.ok) {
        const checkData = (await checkResp.json()) as any;
        const normTarget = rawTitle.toLowerCase();
        const existing = (checkData.items || []).find((ev: any) => {
          const evSum = (ev.summary || '').toLowerCase();
          const evStart = ev.start?.dateTime || ev.start?.date || '';
          return evSum.includes(normTarget) && (evStart.includes(startTime) || evSum === summary.toLowerCase());
        });
        if (existing) {
          console.log(`[ServerGCal] Event "${summary}" already exists (${existing.id}), reusing without creating duplicate.`);
          return { success: true, eventId: existing.id, htmlLink: existing.htmlLink };
        }
      }
    } catch (checkErr) {
      console.warn('[ServerGCal] Could not check existing events:', checkErr);
    }

    const gcalResp = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenRec.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!gcalResp.ok) {
      if (gcalResp.status === 401) {
        userGoogleTokens.delete(tokenRec.userId || 'default');
        saveGoogleTokensToDisk();
        return { success: false, error: 'TOKEN_EXPIRED' };
      }
      const errText = await gcalResp.text();
      console.warn('[ServerGCal] GCal error:', gcalResp.status, errText);
      return { success: false, error: `GCAL_API_ERROR_${gcalResp.status}` };
    }

    const data = (await gcalResp.json()) as any;
    console.log(`[ServerGCal] Event successfully created on Google Calendar: ${data.id}`);
    return { success: true, eventId: data.id, htmlLink: data.htmlLink };
  } catch (err: any) {
    console.error('[ServerGCal] Exception creating event:', err);
    return { success: false, error: err?.message || 'NETWORK_ERROR' };
  }
}

// Safely register or update a scheduled reminder, preventing duplicates and past triggers
function registerScheduledReminder(reminder: ScheduledReminder): boolean {
  if (!reminder.scheduledTime || isNaN(reminder.scheduledTime)) {
    return false;
  }
  // NEVER fire if scheduled time is already in the past (allow a 30s grace window)
  if (reminder.scheduledTime <= Date.now() - 30000) {
    console.log(`[Scheduler] Ignored past reminder for "${reminder.title}" at ${new Date(reminder.scheduledTime).toISOString()}`);
    return false;
  }

  // Deduplicate by taskId and type
  if (reminder.taskId) {
    const existingIdx = scheduledReminders.findIndex(
      r => r.taskId === reminder.taskId && r.type === reminder.type
    );
    if (existingIdx !== -1) {
      if (scheduledReminders[existingIdx].sent) {
        return false;
      }
      // Update target time and info if changed
      scheduledReminders[existingIdx].scheduledTime = reminder.scheduledTime;
      scheduledReminders[existingIdx].eventTime = reminder.eventTime;
      scheduledReminders[existingIdx].eventDate = reminder.eventDate;
      if (reminder.assignedBy) scheduledReminders[existingIdx].assignedBy = reminder.assignedBy;
      if (reminder.chatId && reminder.chatId !== 'simulated') scheduledReminders[existingIdx].chatId = reminder.chatId;
      return true;
    }
  }

  scheduledReminders.push(reminder);
  console.log(`[Scheduler] Queued reminder for "${reminder.title}" at ${new Date(reminder.scheduledTime).toISOString()} (type: ${reminder.type}, assignedBy: ${reminder.assignedBy || 'none'})`);
  return true;
}

// Track pending follow-up questions awaiting user reply (Chat ID -> Followup State)
interface PendingFollowupState {
  taskId?: string;
  taskTitle: string;
  category: string;
  askedAt: number;
  userId?: string;
  stage: 'awaiting_yes_no' | 'awaiting_reason_no';
}
const pendingUserFollowups: Map<string, PendingFollowupState> = new Map();

// Synchronized task completion events to bridge back to the web client
interface TaskCompletionEvent {
  id: string;
  taskId?: string;
  taskTitle: string;
  status: 'completada' | 'pendiente';
  timestamp: string;
  userId?: string;
  reasonIfNotCompleted?: string;
}
const recentTaskCompletionEvents: TaskCompletionEvent[] = [];

// Synchronized habit completion events to bridge back to the web client
interface HabitCompletionEvent {
  id: string;
  habitId?: string;
  habitTitle: string;
  completedDate: string;
  timestamp: string;
  userId?: string;
  newStreak?: number;
}
const recentHabitCompletionEvents: HabitCompletionEvent[] = [];

// Helper to send Telegram message with optional Inline Buttons
async function sendTelegramMessage(
  botToken: string,
  chatId: number | string,
  text: string,
  replyMarkup?: any
) {
  if (!botToken) return false;
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const payload: any = {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return resp.ok;
  } catch (err) {
    console.error('Error sending Telegram message:', err);
    return false;
  }
}

// Background interval worker to check and trigger reminders and follow-up check-ins (runs every 15 seconds)
setInterval(async () => {
  const now = Date.now();
  for (const rem of scheduledReminders) {
    if (!rem.sent && rem.scheduledTime <= now) {
      rem.sent = true;
      const botToken = rem.token || process.env.TELEGRAM_BOT_TOKEN || '';
      let targetChatId = rem.chatId;

      // If chatId is simulated or empty, route to Miguel (ownerChatId) or latest subscriber
      if (!targetChatId || targetChatId === 'simulated') {
        if (partnerConfig.ownerChatId) {
          targetChatId = partnerConfig.ownerChatId;
        } else if (telegramSubscribers.size > 0) {
          const lastSub = Array.from(telegramSubscribers.values()).pop();
          if (lastSub) targetChatId = lastSub.chatId;
        }
      }

      if (botToken && targetChatId && targetChatId !== 'simulated') {
        const categoryEmoji = CATEGORY_EMOJIS[rem.category] || '🔔';
        const partnerTag = rem.assignedBy ? `\n💜 _Compromiso asignado por ${rem.assignedBy}_` : '';

        if (rem.type === 'followup_check') {
          // Post-task follow-up: Ask if user completed the task with inline yes/no buttons
          const msg = `🔔 *¡Seguimiento de LifeGlow!*
          
${categoryEmoji} *¿Lograste hacer tu compromiso:* "${rem.title}"?
🕐 *Horario programado:* ${rem.eventTime}${partnerTag}

Toca una opción o responde directamente *"Sí"* o *"No"*:`;

          // Set pending followup state
          pendingUserFollowups.set(String(targetChatId), {
            taskId: rem.taskId,
            taskTitle: rem.title,
            category: rem.category,
            askedAt: now,
            userId: rem.userId,
            stage: 'awaiting_yes_no',
          });

          const inlineKeyboard = {
            inline_keyboard: [
              [
                { text: '✅ ¡Sí, la completé!', callback_data: `TASK_DONE:${rem.taskId || rem.title}` },
                { text: '❌ No la hice', callback_data: `TASK_NOT_DONE:${rem.taskId || rem.title}` }
              ]
            ]
          };

          try {
            await sendTelegramMessage(botToken, targetChatId, msg, inlineKeyboard);
            console.log(`[Follow-up Triggered] Asked user about "${rem.title}" in chat ${targetChatId}`);
          } catch (e) {
            console.error('[Follow-up Error]', e);
          }
        } else {
          // Pre-activity proactive reminder (e.g. 10 mins before)
          const msg = `⏰ *¡Recordatorio Proactivo de LifeGlow!* (en ${rem.advanceMinutes || 10} minutos)

${categoryEmoji} *Compromiso:* ${rem.title}
🕐 *Hora programada:* ${rem.eventTime}
📅 *Fecha:* ${rem.eventDate}${partnerTag}

💡 _¡Prepárate, alista tus cosas o toma un vaso de agua para arrancar a tiempo!_`;

          try {
            await sendTelegramMessage(botToken, targetChatId, msg);
            console.log(`[Reminder Triggered] Sent reminder for "${rem.title}" to chat ${targetChatId}`);
          } catch (e) {
            console.error('[Reminder Error]', e);
          }
        }
      }
    }
  }
}, 15000);

const CATEGORY_LABELS: Record<string, string> = {
  vehiculos: 'Vehículos & Garaje',
  salud_deporte: 'Salud & Deporte',
  aprendizaje: 'Aprendizaje & Nuevas Habilidades',
  aprendizaje_habilidades: 'Aprendizaje & Nuevas Habilidades',
  bienestar_mente: 'Bienestar & Mente',
  ocio_entretenimiento: 'Ocio & Entretenimiento',
  familia_relaciones: 'Familia & Relaciones',
  finanzas_hogar: 'Finanzas & Hogar',
  actividades_pendientes: 'Actividades Pendientes',
};

const CATEGORY_EMOJIS: Record<string, string> = {
  vehiculos: '🚗',
  salud_deporte: '🏃‍♂️',
  aprendizaje: '📚',
  aprendizaje_habilidades: '📚',
  bienestar_mente: '🧘‍♂️',
  ocio_entretenimiento: '🎮',
  familia_relaciones: '👨‍👩‍👧‍👦',
  finanzas_hogar: '💰',
  actividades_pendientes: '📋',
};

// Normalizer to convert any time format (e.g., "4:00 PM", "4 pm", "16:00", "4 de la tarde") to standard 24h "HH:MM"
function normalizeTimeSlot(timeStr: string, contextText: string): string {
  if (!timeStr) return '16:00';
  const clean = timeStr.trim().toLowerCase();
  const isPM = clean.includes('pm') || clean.includes('p.m.') || clean.includes('tarde') || clean.includes('noche') || contextText.toLowerCase().includes('tarde') || contextText.toLowerCase().includes('noche') || contextText.toLowerCase().includes('pm');
  const isAM = (clean.includes('am') || clean.includes('a.m.') || contextText.toLowerCase().includes('de la mañana') || contextText.toLowerCase().includes('de la manana')) && !clean.includes('pm') && !contextText.toLowerCase().includes('tarde');

  const m = clean.match(/(\d{1,2})(?::(\d{2}))?/);
  if (m) {
    let h = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    if (isPM && h < 12) {
      h += 12;
    } else if (isAM && h === 12) {
      h = 0;
    }
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }
  return timeStr;
}

// ----------------------------------------------------
// USER AGENDA STATE & QUERY INTENT HANDLING (DAILY SUMMARIES)
// ----------------------------------------------------
interface UserSyncedTask {
  id: string;
  title: string;
  category: string;
  status: string;
  assignedDate?: string;
  dueDate?: string;
  timeSlot?: string;
  priority?: string;
  description?: string;
  estimatedHours?: number;
  completedHours?: number;
}

interface UserSyncedHabit {
  id: string;
  title: string;
  category: string;
  icon?: string;
  frequency?: string;
  targetTime?: string;
  targetDurationMinutes?: number;
  streak?: number;
  completedToday?: boolean;
}

interface UserSyncedAgenda {
  userId?: string;
  userDisplayName?: string;
  todayStr: string;
  tasks: UserSyncedTask[];
  habits: UserSyncedHabit[];
  lastSynced: string;
}

const userAgendaStore: Map<string, UserSyncedAgenda> = new Map();
let lastKnownGlobalAgenda: UserSyncedAgenda | null = null;

// Persistent storage for synced agenda on disk so it survives restarts
const USER_AGENDA_FILE = path.join(process.cwd(), 'user_agenda_store.json');

function loadAgendaStoreFromDisk() {
  try {
    if (fs.existsSync(USER_AGENDA_FILE)) {
      const data = fs.readFileSync(USER_AGENDA_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        for (const [key, value] of Object.entries(parsed)) {
          const agenda = value as UserSyncedAgenda;
          userAgendaStore.set(key, agenda);
          if (!lastKnownGlobalAgenda || (agenda.tasks && agenda.tasks.length > 0) || (agenda.habits && agenda.habits.length > 0)) {
            lastKnownGlobalAgenda = agenda;
          }
        }
        console.log(`[AgendaStore] Loaded ${userAgendaStore.size} user agendas from disk.`);
      }
    }
  } catch (err) {
    console.warn('[AgendaStore] Could not load agenda from disk:', err);
  }
}

function saveAgendaStoreToDisk() {
  try {
    const obj: Record<string, UserSyncedAgenda> = {};
    for (const [key, value] of userAgendaStore.entries()) {
      obj[key] = value;
    }
    fs.writeFileSync(USER_AGENDA_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[AgendaStore] Could not save agenda to disk:', err);
  }
}

// Initial load
loadAgendaStoreFromDisk();

// Persistent storage for incoming webhook queues on disk so they survive restarts
const INCOMING_WEBHOOKS_FILE = path.join(process.cwd(), 'incoming_webhooks.json');

function saveIncomingWebhooksToDisk() {
  try {
    const data = {
      tasks: incomingWebhookTasks,
      ideas: incomingWebhookIdeas,
      expenses: incomingWebhookExpenses,
      taskCompletions: recentTaskCompletionEvents,
      habitCompletions: recentHabitCompletionEvents,
    };
    fs.writeFileSync(INCOMING_WEBHOOKS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[WebhookStore] Could not save incoming webhooks to disk:', err);
  }
}

function loadIncomingWebhooksFromDisk() {
  try {
    if (fs.existsSync(INCOMING_WEBHOOKS_FILE)) {
      const data = fs.readFileSync(INCOMING_WEBHOOKS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.tasks)) incomingWebhookTasks.push(...parsed.tasks);
        if (Array.isArray(parsed.ideas)) incomingWebhookIdeas.push(...parsed.ideas);
        if (Array.isArray(parsed.expenses)) incomingWebhookExpenses.push(...parsed.expenses);
        if (Array.isArray(parsed.taskCompletions)) recentTaskCompletionEvents.push(...parsed.taskCompletions);
        if (Array.isArray(parsed.habitCompletions)) recentHabitCompletionEvents.push(...parsed.habitCompletions);
        console.log(`[WebhookStore] Loaded ${incomingWebhookTasks.length} tasks, ${incomingWebhookIdeas.length} ideas, ${incomingWebhookExpenses.length} expenses from disk.`);
      }
    }
  } catch (err) {
    console.warn('[WebhookStore] Could not load incoming webhooks from disk:', err);
  }
}

// Initial load of webhooks
loadIncomingWebhooksFromDisk();

// Persistent partner configuration (Miguel & Liz)
const PARTNER_CONFIG_FILE = path.join(process.cwd(), 'partner_config.json');

interface PartnerConfig {
  ownerChatId?: number | string;
  ownerName: string;
  ownerUsername?: string;
  partnerChatId?: number | string;
  partnerName: string;
  partnerUsername?: string;
  lastUpdated?: string;
}

let partnerConfig: PartnerConfig = {
  ownerName: 'Miguel',
  partnerName: 'Liz',
};

function savePartnerConfigToDisk() {
  try {
    fs.writeFileSync(PARTNER_CONFIG_FILE, JSON.stringify(partnerConfig, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[PartnerConfig] Could not save partner config to disk:', err);
  }
}

function loadPartnerConfigFromDisk() {
  try {
    if (fs.existsSync(PARTNER_CONFIG_FILE)) {
      const data = fs.readFileSync(PARTNER_CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        partnerConfig = { ...partnerConfig, ...parsed };
        console.log(`[PartnerConfig] Loaded partner configuration: Miguel (${partnerConfig.ownerChatId || 'sin chat'}), Liz (${partnerConfig.partnerChatId || 'sin chat'}).`);
      }
    }
  } catch (err) {
    console.warn('[PartnerConfig] Could not load partner config from disk:', err);
  }
}

loadPartnerConfigFromDisk();

// Detect if user text is completing a habit (e.g. "ya hice el hábito de caminar", "hábito de flexiones listo", "marcar como hecho pasear al perro")
function detectHabitCompletionIntent(
  rawText: string,
  habits: UserSyncedHabit[]
): { isHabitDone: boolean; matchedHabit?: UserSyncedHabit } {
  const clean = (rawText || '').trim().toLowerCase();
  if (!clean || !Array.isArray(habits) || habits.length === 0) return { isHabitDone: false };

  const isCompletionWord = /\b(hecho|completad[oa]|listo|ya\s+hice|ya\s+cumpl[ií]|cumplid[oa]|terminad[oa]|realizad[oa]|marcar\s+(como\s+)?(hecho|completad[oa]))\b/i.test(clean);

  if (!isCompletionWord) return { isHabitDone: false };

  for (const habit of habits) {
    const habitTitleLower = (habit.title || '').toLowerCase().trim();
    if (!habitTitleLower) continue;

    // Direct substring or words
    if (clean.includes(habitTitleLower)) {
      return { isHabitDone: true, matchedHabit: habit };
    }

    const words = habitTitleLower.split(/\s+/).filter(w => w.length > 3 && !['para', 'hacer', 'cada'].includes(w));
    if (words.length > 0 && words.some(w => clean.includes(w))) {
      return { isHabitDone: true, matchedHabit: habit };
    }
  }

  return { isHabitDone: false };
}

interface DetectedQuery {
  isQuery: boolean;
  intent: 'daily_summary' | 'tomorrow_summary' | 'pending_tasks' | 'habits_summary' | 'greeting' | 'general_question';
  queryPrompt: string;
}

function detectUserQueryIntent(rawText: string): DetectedQuery {
  const clean = (rawText || '').trim();
  if (!clean) return { isQuery: false, intent: 'daily_summary', queryPrompt: '' };

  const lower = clean.toLowerCase();
  const stripped = lower.replace(/^[¿?¡!.,\s]+|[¿?¡!.,\s]+$/g, '').trim();

  // 1. Daily Summary / What do I have today?
  const dailySummaryRegex = /\b(qu[eé]\s+(tengo|hay|tenemos)\s+(para\s+|de\s+)?hoy|qu[eé]\s+tengo\s+hoy|agenda\s+(de\s+|para\s+)?hoy|resumen\s+(del?\s+)?d[ií]a|resumen\s+(de\s+|para\s+)?hoy|mis\s+tareas\s+(de\s+|para\s+)?hoy|qu[eé]\s+hago\s+hoy|c[oó]mo\s+voy\s+hoy|qu[eé]\s+me\s+toca\s+hoy|qu[eé]\s+tengo\s+que\s+hacer(\s+hoy)?|planes\s+(de\s+|para\s+)?hoy|compromisos\s+(de\s+|para\s+)?hoy|mi\s+d[ií]a(\s+de)?\s+hoy|qu[eé]\s+hay\s+hoy|qu[eé]\s+tengo\s+agendado(\s+hoy)?|dime\s+mi\s+agenda|mu[eé]strame\s+mi\s+agenda)\b/i;
  if (dailySummaryRegex.test(stripped) || stripped === 'que tengo para hoy' || stripped === 'que tengo hoy' || stripped === 'resumen') {
    return { isQuery: true, intent: 'daily_summary', queryPrompt: clean };
  }

  // 2. Tomorrow's Summary / What do I have tomorrow?
  const tomorrowSummaryRegex = /\b(qu[eé]\s+(tengo|hay|tenemos)\s+(para\s+|de\s+)?ma[nñ]ana|agenda\s+(de\s+|para\s+)?ma[nñ]ana|resumen\s+(de\s+|para\s+)?ma[nñ]ana|mis\s+tareas\s+(de\s+|para\s+)?ma[nñ]ana|planes\s+(de\s+|para\s+)?ma[nñ]ana|qu[eé]\s+hay\s+ma[nñ]ana|qu[eé]\s+tengo\s+agendado\s+ma[nñ]ana)\b/i;
  if (tomorrowSummaryRegex.test(stripped)) {
    return { isQuery: true, intent: 'tomorrow_summary', queryPrompt: clean };
  }

  // 3. Pending Tasks
  const pendingTasksRegex = /\b(qu[eé]\s+(tengo|hay)\s+pendiente|mis\s+pendientes|tareas\s+pendientes|qu[eé]\s+est[aá]\s+pendiente|actividades\s+pendientes|cu[aá]les\s+son\s+mis\s+pendientes|qu[eé]\s+me\s+falta(\s+por\s+hacer)?|qu[eé]\s+tareas\s+tengo|lista\s+de\s+pendientes)\b/i;
  if (pendingTasksRegex.test(stripped)) {
    return { isQuery: true, intent: 'pending_tasks', queryPrompt: clean };
  }

  // 4. Habits Summary
  const habitsRegex = /\b(mis\s+h[aá]bitos|cu[aá]les\s+son\s+mis\s+h[aá]bitos|qu[eé]\s+h[aá]bitos\s+tengo|h[aá]bitos\s+(de\s+|para\s+)?hoy|rutinas\s+(de\s+|para\s+)?hoy|qu[eé]\s+h[aá]bitos\s+me\s+faltan|mis\s+rutinas|mis\s+rachas)\b/i;
  if (habitsRegex.test(stripped)) {
    return { isQuery: true, intent: 'habits_summary', queryPrompt: clean };
  }

  // 5. Short Greetings & Conversational check-ins
  const greetingRegex = /^(hola|buenos\s+d[ií]as|buenas\s+tardes|buenas\s+noches|saludos|hey|c[oó]mo\s+est[aá]s|qui[eé]n\s+eres|qu[eé]\s+tal|ayuda|help|info)$/i;
  if (greetingRegex.test(stripped) && stripped.length <= 35) {
    return { isQuery: true, intent: 'greeting', queryPrompt: clean };
  }

  // 6. Direct questions that do NOT ask to schedule or create
  const isQuestion = clean.startsWith('¿') || clean.endsWith('?') || /^(c[oó]mo|por\s+qu[eé]|cu[aá]l|cu[aá]les|d[oó]nde|qui[eé]n|cu[aá]nto|dame\s+un\s+consejo|recomi[eé]ndame)\b/i.test(stripped);
  const isCreationCommand = /\b(recordar|recordarme|agendar|programar|crear|nueva\s+tarea|anotar|comprar|pagar|guardar|inscribir|ver\s+serie|ver\s+pelicula)\b/i.test(stripped);
  if (isQuestion && !isCreationCommand) {
    return { isQuery: true, intent: 'general_question', queryPrompt: clean };
  }

  return { isQuery: false, intent: 'daily_summary', queryPrompt: clean };
}

function formatTimeSlotForDisplay(timeSlot?: string): string {
  if (!timeSlot) return '';
  const firstPart = timeSlot.split('-')[0].trim();
  const match = firstPart.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return timeSlot;
  let hour = parseInt(match[1], 10);
  const min = match[2];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;
  return `${hour}:${min} ${ampm}`;
}

interface UserQueryResponsePayload {
  text: string;
  replyMarkup?: {
    inline_keyboard: Array<Array<{ text: string; callback_data: string }>>;
  };
}

async function handleUserQueryResponse(
  queryInfo: DetectedQuery,
  username: string,
  userId?: string,
  chatId?: number | string
): Promise<UserQueryResponsePayload> {
  const ai = getGeminiClient();
  const now = new Date();
  const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  
  const dayName = daysOfWeek[now.getDay()];
  const dayNum = now.getDate();
  const monthName = months[now.getMonth()];
  const formattedToday = `${dayName}, ${dayNum} de ${monthName}`;
  const todayISO = now.toISOString().split('T')[0];

  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowDayName = daysOfWeek[tomorrow.getDay()];
  const tomorrowDayNum = tomorrow.getDate();
  const tomorrowMonthName = months[tomorrow.getMonth()];
  const formattedTomorrow = `${tomorrowDayName}, ${tomorrowDayNum} de ${tomorrowMonthName}`;
  const tomorrowISO = tomorrow.toISOString().split('T')[0];

  // Retrieve agenda from sync store
  let userAgenda = userId ? userAgendaStore.get(userId) : null;
  if (!userAgenda && chatId) {
    const subscriber = telegramSubscribers.get(String(chatId));
    if (subscriber && (subscriber as any).userId) {
      userAgenda = userAgendaStore.get((subscriber as any).userId);
    }
  }
  if (!userAgenda && username) {
    const cleanU = username.toLowerCase().replace('@', '');
    for (const agenda of userAgendaStore.values()) {
      if (agenda.userDisplayName && agenda.userDisplayName.toLowerCase().includes(cleanU)) {
        userAgenda = agenda;
        break;
      }
    }
  }
  if (!userAgenda) {
    userAgenda = lastKnownGlobalAgenda || userAgendaStore.get('default') || Array.from(userAgendaStore.values())[0] || null;
  }

  // EXCLUSIVELY use real user tasks and habits - NEVER dummy fallbacks!
  const allTasks: UserSyncedTask[] = userAgenda && Array.isArray(userAgenda.tasks)
    ? [...userAgenda.tasks]
    : [];
  const allHabits: UserSyncedHabit[] = userAgenda && Array.isArray(userAgenda.habits)
    ? [...userAgenda.habits]
    : [];

  // Also merge any live tasks from scheduledReminders for today
  for (const rem of scheduledReminders) {
    if (rem.eventDate === todayISO && rem.title) {
      if (!allTasks.some(t => t.title.toLowerCase() === rem.title.toLowerCase())) {
        allTasks.push({
          id: rem.taskId || `rem-${rem.id}`,
          title: rem.title,
          category: rem.category || 'actividades_pendientes',
          status: 'pendiente',
          assignedDate: rem.eventDate,
          timeSlot: rem.eventTime,
          priority: 'alta',
        });
      }
    }
  }

  const rawName = userAgenda?.userDisplayName || username || 'Miguel';
  const cleanName = rawName.replace(/^@/, '').trim() || 'Miguel';

  // Build interactive buttons for pending habits so the user can mark them done directly in Telegram
  const pendingHabits = allHabits.filter(h => !h.completedToday);
  let habitButtons: Array<Array<{ text: string; callback_data: string }>> = [];
  if (pendingHabits.length > 0) {
    habitButtons = pendingHabits.slice(0, 6).map(h => ([
      {
        text: `✅ Hecho: ${h.icon || '🔥'} ${h.title}`,
        callback_data: `HABIT_DONE:${h.id}`,
      }
    ]));
  }
  const habitReplyMarkup = habitButtons.length > 0 ? { inline_keyboard: habitButtons } : undefined;

  // 1. GREETING
  if (queryInfo.intent === 'greeting') {
    return {
      text: `👋 *¡Hola, ${cleanName}! Soy tu Asistente Personal de LifeBlocks 🚀*

Estoy aquí para ayudarte a mantener el control de tu día a día, calendario, hábitos y finanzas.

✨ *¿Qué puedes pedirme?*
• ☀️ *¿Qué tengo para hoy?* – Te daré un resumen completo de tus compromisos, hábitos y pendientes.
• 📅 *Agendar compromisos:* _"Entrenamiento hoy a las 5 pm"_ o _"Ver serie a las 4 de la tarde"_.
• 🧾 *Registrar facturas y gastos:* Envíame fotos de recibos o escribe _"Gasto veterinaria $45.000 pagado"_.
• 🎙️ *Notas de voz:* Dicta lo que necesites y lo organizaré automáticamente en tu tablero.
• 📋 *¿Qué tengo pendiente?* – Para revisar tus tareas abiertas.
• 🔥 *Mis hábitos* – Para revisar tus rutinas y marcarlas como hechas con un solo toque.

¿En qué te puedo colaborar hoy?`,
    };
  }

  // 2. HABITS SUMMARY
  if (queryInfo.intent === 'habits_summary') {
    if (allHabits.length === 0) {
      return {
        text: `🔥 *Tus Hábitos del Día (${formattedToday}):*

_Aún no has registrado hábitos en tu tablero de LifeGlow. Puedes configurarlos en la app o dictármelos por aquí._`,
      };
    }

    const habitsList = allHabits.map(h => {
      const icon = h.icon || '🔥';
      const timeStr = h.targetTime ? ` (${formatTimeSlotForDisplay(h.targetTime)})` : '';
      const statusStr = h.completedToday ? '✅ *Completado*' : '⏳ _Pendiente_';
      const streakStr = h.streak ? ` | 🔥 Racha: ${h.streak} días` : '';
      return `• ${icon} *${h.title}*${timeStr} -> ${statusStr}${streakStr}`;
    }).join('\n');

    let replyText = `🔥 *Tus Hábitos del Día (${formattedToday}):*

${habitsList}

💡 *Recuerda:* Mantener la constancia diaria construye grandes metas. ¡Vamos por esa racha!`;

    if (pendingHabits.length > 0) {
      replyText += `\n\n👇 *Toca abajo para marcar como hecho enseguida:*`;
    }

    return {
      text: replyText,
      replyMarkup: habitReplyMarkup,
    };
  }

  // 3. PENDING TASKS
  if (queryInfo.intent === 'pending_tasks') {
    const pending = allTasks.filter(t => t.status !== 'completada').slice(0, 8);
    if (pending.length === 0) {
      return {
        text: `🎉 *¡Felicidades, ${cleanName}!* No tienes tareas pendientes acumuladas. Tu lista está completamente al día.`,
      };
    }
    const list = pending.map(t => {
      const emoji = CATEGORY_EMOJIS[t.category] || '📋';
      const cat = CATEGORY_LABELS[t.category] || 'General';
      const timeStr = t.timeSlot ? ` [⏰ ${formatTimeSlotForDisplay(t.timeSlot)}]` : '';
      return `• ${emoji} *${t.title}* (${cat})${timeStr}`;
    }).join('\n');

    return {
      text: `📋 *Tus Tareas y Actividades Pendientes:*

${list}

_Dime si completaste alguna o si quieres agendar un horario específico para avanzar._`,
    };
  }

  // 4. TOMORROW SUMMARY
  if (queryInfo.intent === 'tomorrow_summary') {
    const tomorrowTasks = allTasks.filter(t => (t.assignedDate === tomorrowISO || t.dueDate === tomorrowISO) && t.status !== 'completada');
    tomorrowTasks.sort((a, b) => (a.timeSlot || '99:99').localeCompare(b.timeSlot || '99:99'));

    let scheduledText = '';
    if (tomorrowTasks.length > 0) {
      scheduledText = tomorrowTasks.map(t => {
        const emoji = CATEGORY_EMOJIS[t.category] || '📌';
        const time = formatTimeSlotForDisplay(t.timeSlot) || 'Durante el día';
        const cat = CATEGORY_LABELS[t.category] || 'General';
        return `• ⏰ *${time}* | ${emoji} *${t.title}* (${cat})`;
      }).join('\n');
    } else {
      scheduledText = `_No tienes tareas con hora fija agendadas para mañana. Tienes el día abierto._`;
    }

    let habitsText = '';
    if (allHabits.length > 0) {
      habitsText = allHabits.map(h => {
        const timeStr = h.targetTime ? ` (${formatTimeSlotForDisplay(h.targetTime)})` : '';
        return `• ${h.icon || '🔥'} *${h.title}*${timeStr}`;
      }).join('\n');
    } else {
      habitsText = `_No tienes hábitos configurados aún._`;
    }

    return {
      text: `🌅 *Resumen para Mañana (${formattedTomorrow}):*

📅 *Compromisos Programados:*
${scheduledText}

🔥 *Hábitos Previstos:*
${habitsText}

💡 *Tip:* Preparar tu día con anticipación reduce el estrés y multiplica tu enfoque.`,
    };
  }

  // 5. PRIMARY INTENT: daily_summary ("que tengo para hoy")
  const scheduledToday = allTasks.filter(t => {
    const date = t.assignedDate || t.dueDate;
    return date === todayISO && t.status !== 'completada';
  });
  scheduledToday.sort((a, b) => (a.timeSlot || '99:99').localeCompare(b.timeSlot || '99:99'));

  const completedToday = allTasks.filter(t => {
    const date = t.assignedDate || t.dueDate;
    return date === todayISO && t.status === 'completada';
  });

  const otherPending = allTasks.filter(t => {
    const date = t.assignedDate || t.dueDate;
    return t.status !== 'completada' && (!date || date !== todayISO);
  }).slice(0, 4);

  // Gemini generative personalization
  if (ai) {
    try {
      const scheduledPromptList = scheduledToday.map(t => ({
        titulo: t.title,
        hora: formatTimeSlotForDisplay(t.timeSlot) || t.timeSlot,
        categoria: CATEGORY_LABELS[t.category] || t.category,
        emoji: CATEGORY_EMOJIS[t.category] || '📌',
      }));

      const habitsPromptList = allHabits.map(h => ({
        habito: h.title,
        hora: h.targetTime ? formatTimeSlotForDisplay(h.targetTime) : undefined,
        estado: h.completedToday ? 'completado' : 'pendiente',
        racha: h.streak || 0,
        icono: h.icon || '🔥',
      }));

      const pendingPromptList = otherPending.map(t => ({
        titulo: t.title,
        categoria: CATEGORY_LABELS[t.category] || t.category,
      }));

      const geminiPrompt = `
Eres el asistente personal y coach inteligente de la aplicación LifeBlocks / LifeGlow.
El usuario (${cleanName}) te acaba de enviar este mensaje: "${queryInfo.queryPrompt}".

Fecha actual de hoy: ${formattedToday} (${todayISO}).

DATOS EXACTOS Y REALES DE SU AGENDA (USA ÚNICAMENTE ESTOS DATOS, NO INVENTES NADA):
- Tareas programadas para HOY con hora: ${JSON.stringify(scheduledPromptList)}
- Tareas ya completadas hoy: ${JSON.stringify(completedToday.map(t => t.title))}
- Hábitos diarios del usuario: ${JSON.stringify(habitsPromptList)}
- Otras tareas pendientes en lista: ${JSON.stringify(pendingPromptList)}

INSTRUCCIONES DE RESPUESTA:
1. Responde de forma cálida, profesional y muy motivadora usando formato Telegram Markdown (*negrita*, _cursiva_, viñetas •).
2. Salúdalo por su nombre (${cleanName}) e indícale la fecha de hoy.
3. Muestra una sección clara de "📅 Compromisos Programados de Hoy":
   - Si tiene tareas con hora hoy, lístalas ordenadas por hora, indicando la hora en negrita, emoji y categoría.
   - Si NO tiene tareas con hora hoy (${scheduledPromptList.length === 0}), dile amablemente que NO tiene compromisos agendados con hora para hoy y que su día está despejado. NUNCA inventes tareas.
4. Muestra la sección "🔥 Tus Hábitos del Día":
   - Si tiene hábitos, lista sus hábitos reales indicando si están completados (✅) o pendientes (⏳) y si tienen racha menciónala. Si no tiene hábitos, indica que aún no tiene hábitos configurados.
5. Muestra una sección breve de "📋 Actividades Pendientes" con sus tareas abiertas si existen.
6. Cierra con un breve consejo inspirador y una invitación a interactuar.
7. CRÍTICO: BAJO NINGUNA CIRCUNSTANCIA INVENTES ACTIVIDADES O DUMMY DATA. Usa únicamente los datos proporcionados.
`;

      let aiResp;
      try {
        aiResp = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: geminiPrompt,
          config: {
            temperature: 0.2,
          },
        });
      } catch {
        aiResp = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: geminiPrompt,
          config: {
            temperature: 0.2,
          },
        });
      }

      if (aiResp && aiResp.text && aiResp.text.trim().length > 30) {
        let generatedText = aiResp.text.trim();
        if (pendingHabits.length > 0) {
          generatedText += `\n\n👇 *Toca para marcar tus hábitos completados de hoy:*`;
        }
        return {
          text: generatedText,
          replyMarkup: habitReplyMarkup,
        };
      }
    } catch (aiErr) {
      console.error('Gemini daily summary generation error:', aiErr);
    }
  }

  // Deterministic fallback response
  let scheduledSection = '';
  if (scheduledToday.length > 0) {
    const lines = scheduledToday.map(t => {
      const time = formatTimeSlotForDisplay(t.timeSlot) || 'Horario flexible';
      const emoji = CATEGORY_EMOJIS[t.category] || '📌';
      const cat = CATEGORY_LABELS[t.category] || 'General';
      return `• ⏰ *${time}* | ${emoji} *${t.title}* (${cat})`;
    });
    scheduledSection = `📅 *Compromisos Programados de Hoy:*
${lines.join('\n')}
_(🔔 Te avisaré 10 minutos antes de cada uno para que arranques a tiempo)_`;
  } else {
    scheduledSection = `📅 *Compromisos Programados de Hoy:*
_No tienes tareas con hora fija agendadas para hoy en tu calendario. Tienes espacio libre para avanzar a tu propio ritmo._`;
  }

  let habitsSection = '';
  if (allHabits.length > 0) {
    const lines = allHabits.map(h => {
      const icon = h.icon || '🔥';
      const time = h.targetTime ? ` (${formatTimeSlotForDisplay(h.targetTime)})` : '';
      const status = h.completedToday ? '✅ *Completado*' : '⏳ _Pendiente_';
      const streak = h.streak ? ` (🔥 Racha: ${h.streak} d)` : '';
      return `• ${icon} *${h.title}*${time} - ${status}${streak}`;
    });
    habitsSection = `🔥 *Tus Hábitos del Día:*
${lines.join('\n')}`;
  } else {
    habitsSection = `🔥 *Tus Hábitos del Día:*
_Aún no has configurado hábitos en tu tablero._`;
  }

  let pendingSection = '';
  if (otherPending.length > 0) {
    const lines = otherPending.map(t => {
      const emoji = CATEGORY_EMOJIS[t.category] || '📋';
      return `• ${emoji} ${t.title}`;
    });
    pendingSection = `📋 *Actividades Pendientes Destacadas:*
${lines.join('\n')}`;
  }

  let finalFallbackText = `☀️ *¡Hola, ${cleanName}! Aquí tienes tu resumen para hoy*
🗓️ *${formattedToday}*

${scheduledSection}

${habitsSection}

${pendingSection ? pendingSection + '\n' : ''}💡 *Consejo de tu Asistente:*
_Concéntrate en una tarea a la vez. Si deseas agendar un nuevo compromiso (ej: "Entrenar a las 6 pm") o registrar una compra, solo escríbeme o mándame un audio._ ¡A tener un día extraordinario!`;

  if (pendingHabits.length > 0) {
    finalFallbackText += `\n\n👇 *Toca para marcar tus hábitos completados de hoy:*`;
  }

  return {
    text: finalFallbackText,
    replyMarkup: habitReplyMarkup,
  };
}

// Deterministic Spanish category and area classifier
function detectSpanishCategory(text: string): { categoryId: string; type: string; finalGoal: string } {
  const lower = (text || '').toLowerCase();

  // 0. Finanzas & Hogar (Gastos, Facturas, Recibos, Comprobantes, Pagos) - FIRST PRIORITY
  if (
    lower.includes('factura') ||
    lower.includes('recibo') ||
    lower.includes('comprobante') ||
    lower.includes('gasto adicional') ||
    lower.includes('gastos adicionales') ||
    lower.includes('ticket') ||
    ((lower.includes('tienda') || lower.includes('supermercado') || lower.includes('veterinaria') || lower.includes('farmacia') || lower.includes('d1') || lower.includes('exito') || lower.includes('jumbo') || lower.includes('falabella')) && (lower.includes('$') || lower.includes('cop') || lower.includes('pesos') || lower.includes('mil') || /\d{4,}/.test(lower))) ||
    lower.includes('pagar') ||
    lower.includes('pago') ||
    lower.includes('banco') ||
    lower.includes('tarjeta de credito') ||
    lower.includes('tarjeta de crédito') ||
    lower.includes('presupuesto') ||
    lower.includes('transferencia') ||
    lower.includes('arriendo') ||
    lower.includes('alquiler')
  ) {
    return {
      categoryId: 'finanzas_hogar',
      type: 'gasto_adicional',
      finalGoal: 'Mantener finanzas y control de gastos al día'
    };
  }

  // 1. Ocio & Entretenimiento (Series, Programas TV, Películas, Cine, Streaming, Videojuegos, Anime)
  if (
    lower.includes('serie') || // serie, series, ver serie, ver la serie
    lower.includes('capitul') || // capitulo, capitulos, capítulo, capítulos
    lower.includes('temporada') ||
    lower.includes('episodio') ||
    lower.includes('pelicul') || // pelicula, peliculas, película, películas
    lower.includes('cine') ||
    lower.includes('film') ||
    lower.includes('estreno') ||
    lower.includes('documental') ||
    lower.includes('netflix') ||
    lower.includes('apple tv') ||
    lower.includes('prime video') ||
    lower.includes('disney') ||
    lower.includes('hbo') ||
    lower.includes('max') ||
    lower.includes('crunchyroll') ||
    lower.includes('paramount') ||
    lower.includes('streaming') ||
    lower.includes('programa de tv') ||
    lower.includes('programas de tv') ||
    lower.includes('television') ||
    lower.includes('televisión') ||
    lower.includes('videojueg') ||
    lower.includes('video juego') ||
    lower.includes('jugar') ||
    lower.includes('gamer') ||
    lower.includes('gaming') ||
    lower.includes('playstation') ||
    lower.includes('ps5') ||
    lower.includes('ps4') ||
    lower.includes('xbox') ||
    lower.includes('nintendo') ||
    lower.includes('switch') ||
    lower.includes('steam') ||
    lower.includes('consola') ||
    lower.includes('anime') ||
    lower.includes('manga') ||
    lower.includes('hobby') ||
    lower.includes('hobbies') ||
    lower.includes('concierto') ||
    lower.includes('fiesta') ||
    lower.includes('teatro') ||
    lower.includes('espectacul') ||
    lower.includes('oppenheimer')
  ) {
    let subType = 'ocio';
    let goal = 'Disfrutar tiempo de descanso, series y entretenimiento';
    if (lower.includes('serie') || lower.includes('capitul') || lower.includes('temporada') || lower.includes('episodio') || lower.includes('apple tv') || lower.includes('netflix') || lower.includes('hbo') || lower.includes('anime')) {
      subType = 'serie';
      goal = 'Ver capítulos y disfrutar de la serie';
    } else if (lower.includes('pelicul') || lower.includes('cine') || lower.includes('film')) {
      subType = 'pelicula';
      goal = 'Ver película y disfrutar del cine';
    } else if (lower.includes('videojueg') || lower.includes('video juego') || lower.includes('playstation') || lower.includes('xbox') || lower.includes('nintendo') || lower.includes('switch') || lower.includes('steam')) {
      subType = 'videojuego';
      goal = 'Avanzar y disfrutar videojuego';
    }

    return {
      categoryId: 'ocio_entretenimiento',
      type: subType,
      finalGoal: goal,
    };
  }

  // 2. Salud & Deporte (Sports, workout, running, gym, pushups, health, doctors)
  if (
    lower.includes('corr') || // correr, corriendo, corrí, carrera
    lower.includes('trot') || // trotar, trote
    lower.includes('run') || // running
    lower.includes('camin') || // caminar, caminata
    lower.includes('gym') ||
    lower.includes('gimnasio') ||
    lower.includes('pesa') ||
    lower.includes('flexion') || // flexiones, flexión
    lower.includes('pechada') ||
    lower.includes('sentadilla') ||
    lower.includes('abdominal') ||
    lower.includes('cardio') ||
    lower.includes('natacion') ||
    lower.includes('natación') ||
    lower.includes('nadar') ||
    lower.includes('bici') ||
    lower.includes('ciclism') ||
    lower.includes('pedalear') ||
    lower.includes('ejercicio') ||
    lower.includes('entren') || // entrenar, entrenamiento
    lower.includes('crossfit') ||
    lower.includes('calistenia') ||
    lower.includes('estiramient') ||
    lower.includes('yoga') ||
    lower.includes('dieta') ||
    lower.includes('nutrici') ||
    lower.includes('proteina') ||
    lower.includes('proteína') ||
    lower.includes('calorias') ||
    lower.includes('calorías') ||
    lower.includes('medico') ||
    lower.includes('médico') ||
    lower.includes('doctor') ||
    lower.includes('dentista') ||
    lower.includes('odontolog') ||
    lower.includes('chequeo') ||
    lower.includes('analisis de sangre')
  ) {
    return {
      categoryId: 'salud_deporte',
      type: lower.includes('corr') || lower.includes('flexion') || lower.includes('gym') || lower.includes('entren') ? 'rutina_deportiva' : 'salud',
      finalGoal: 'Mejorar condición física y salud'
    };
  }

  // 3. Vehículos & Garaje (Cars, bikes, oil, mechanics, tires, brakes)
  if (
    lower.includes('carro') ||
    lower.includes('auto') ||
    lower.includes('coche') ||
    lower.includes('moto') ||
    lower.includes('vehicul') ||
    lower.includes('vehícul') ||
    lower.includes('camioneta') ||
    lower.includes('aceite') ||
    lower.includes('llanta') ||
    lower.includes('freno') ||
    lower.includes('pastilla') ||
    lower.includes('filtro') ||
    lower.includes('motor') ||
    lower.includes('odometro') ||
    lower.includes('odómetro') ||
    lower.includes('kilometraje') ||
    lower.includes('bateria') ||
    lower.includes('batería') ||
    lower.includes('mecanic') ||
    lower.includes('mecánic') ||
    lower.includes('taller') ||
    lower.includes('soat') ||
    lower.includes('seguro de auto') ||
    lower.includes('gasolina') ||
    lower.includes('combustible') ||
    lower.includes('alineacion') ||
    lower.includes('balanceo')
  ) {
    return {
      categoryId: 'vehiculos',
      type: lower.includes('aceite') ? 'cambio_aceite' : 'mantenimiento_preventivo',
      finalGoal: 'Mantener vehículo en óptimas condiciones mecánicas'
    };
  }

  // 4. Aprendizaje & Habilidades
  if (
    lower.includes('estudi') ||
    lower.includes('curso') ||
    lower.includes('aprender') ||
    lower.includes('aprend') ||
    lower.includes('libro') ||
    lower.includes('leer') ||
    lower.includes('lectura') ||
    lower.includes('program') ||
    lower.includes('codigo') ||
    lower.includes('código') ||
    lower.includes('python') ||
    lower.includes('javascript') ||
    lower.includes('typescript') ||
    lower.includes('docker') ||
    lower.includes('react') ||
    lower.includes('ingles') ||
    lower.includes('inglés') ||
    lower.includes('idioma') ||
    lower.includes('clase') ||
    lower.includes('examen') ||
    lower.includes('tutorial') ||
    lower.includes('certifica') ||
    lower.includes('bootcamp')
  ) {
    return {
      categoryId: 'aprendizaje_habilidades',
      type: 'estudio_aprendizaje',
      finalGoal: 'Desarrollar nuevas habilidades y conocimiento'
    };
  }

  // 5. Finanzas & Hogar
  if (
    lower.includes('pagar') ||
    lower.includes('pago') ||
    lower.includes('factura') ||
    lower.includes('recibo') ||
    lower.includes('banco') ||
    lower.includes('tarjeta') ||
    lower.includes('dinero') ||
    lower.includes('presupuesto') ||
    lower.includes('ahorr') ||
    lower.includes('cuenta') ||
    lower.includes('transferencia') ||
    lower.includes('arriendo') ||
    lower.includes('alquiler') ||
    lower.includes('invers') ||
    lower.includes('cripto') ||
    lower.includes('deuda')
  ) {
    return {
      categoryId: 'finanzas_hogar',
      type: 'pago_finanzas',
      finalGoal: 'Mantener finanzas y servicios al día'
    };
  }

  // 6. Bienestar & Mente
  if (
    lower.includes('medit') ||
    lower.includes('respiraci') ||
    lower.includes('dormir') ||
    lower.includes('descans') ||
    lower.includes('paz') ||
    lower.includes('journal') ||
    lower.includes('psicolog') ||
    lower.includes('psicólog') ||
    lower.includes('terapia') ||
    lower.includes('relaj')
  ) {
    return {
      categoryId: 'bienestar_mente',
      type: 'bienestar',
      finalGoal: 'Cultivar serenidad y claridad mental'
    };
  }

  // 7. Familia & Relaciones
  if (
    lower.includes('mama') ||
    lower.includes('mamá') ||
    lower.includes('papa') ||
    lower.includes('papá') ||
    lower.includes('hijo') ||
    lower.includes('esposa') ||
    lower.includes('novia') ||
    lower.includes('pareja') ||
    lower.includes('familia') ||
    lower.includes('amigo') ||
    lower.includes('cumpleaños') ||
    lower.includes('visita')
  ) {
    return {
      categoryId: 'familia_relaciones',
      type: 'familia',
      finalGoal: 'Fortalecer vínculos familiares y personales'
    };
  }

  // Default: Actividades Pendientes (compras, arreglos, filamentos, llamadas, tareas generales)
  return {
    categoryId: 'actividades_pendientes',
    type: lower.includes('compr') || lower.includes('pedido') || lower.includes('filamento') ? 'compra' : 'pendiente',
    finalGoal: 'Completar actividad pendiente'
  };
}

// Helper to parse Spanish dates and times deterministically (e.g., "4 de la tarde" -> "16:00", "mañana" -> tomorrow)
function parseSpanishTimeAndDate(text: string, todayISO: string, tomorrowISO: string): { timeSlot?: string; assignedDate?: string; isDirectTask?: boolean; estimatedHours?: number } {
  const lower = text.toLowerCase();
  let timeSlot: string | undefined = undefined;
  let assignedDate: string | undefined = undefined;
  let isDirectTask = false;
  let estimatedHours = 1;

  // Check duration indicators (e.g., "1 hora", "30 minutos", "media hora", "2 horas")
  if (lower.includes('30 min') || lower.includes('media hora')) {
    estimatedHours = 0.5;
  } else if (lower.includes('2 hora') || lower.includes('dos hora')) {
    estimatedHours = 2;
  } else if (lower.includes('1.5 hora') || lower.includes('hora y media')) {
    estimatedHours = 1.5;
  } else if (lower.includes('1 hora') || lower.includes('una hora')) {
    estimatedHours = 1;
  }

  // Check date indicators
  if (lower.includes('pasado mañana') || lower.includes('pasado manana')) {
    const d = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    assignedDate = d.toISOString().split('T')[0];
    isDirectTask = true;
  } else if (lower.includes('mañana') || lower.includes('manana')) {
    assignedDate = tomorrowISO;
    isDirectTask = true;
  } else if (lower.includes('hoy') || lower.includes('todos los dias') || lower.includes('todos los días') || lower.includes('cada día') || lower.includes('cada dia') || lower.includes('cada noche') || lower.includes('cada mañana')) {
    assignedDate = todayISO;
    isDirectTask = true;
  }

  // Word number map for Spanish
  const wordMap: Record<string, number> = {
    'una': 1, 'uno': 1, '1': 1,
    'dos': 2, '2': 2,
    'tres': 3, '3': 3,
    'cuatro': 4, '4': 4,
    'cinco': 5, '5': 5,
    'seis': 6, '6': 6,
    'siete': 7, '7': 7,
    'ocho': 8, '8': 8,
    'nueve': 9, '9': 9,
    'diez': 10, '10': 10,
    'once': 11, '11': 11,
    'doce': 12, '12': 12,
  };

  const isGeneralPM = lower.includes('tarde') || lower.includes('noche') || lower.includes('pm') || lower.includes('p.m.');
  const isGeneralAM = lower.includes('de la mañana') || lower.includes('de la manana') || lower.includes('am') || lower.includes('a.m.') || lower.includes('madrugada');

  // Pattern Range: "de 7 a 8 pm", "de 7 a 8 de la noche", "de 19:00 a 20:00"
  const rangePattern = /(?:de\s+)?(\d{1,2}|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce)\s*(?:a|hasta)\s*(\d{1,2}|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce)\s*(de\s+la\s+tarde|de\s+la\s+noche|de\s+la\s+mañana|de\s+la\s+manana|pm|am|p\.m\.|a\.m\.)?/i;
  const rangeMatch = lower.match(rangePattern);
  if (rangeMatch) {
    isDirectTask = true;
    if (!assignedDate) assignedDate = todayISO;
    const rawStart = rangeMatch[1].toLowerCase();
    let startHour = wordMap[rawStart] !== undefined ? wordMap[rawStart] : parseInt(rawStart, 10);
    const mod = (rangeMatch[3] || '').toLowerCase();
    const isModPM = mod.includes('tarde') || mod.includes('noche') || mod.includes('pm') || isGeneralPM;
    const isModAM = mod.includes('mañana') || mod.includes('manana') || mod.includes('am') || isGeneralAM;

    if (isModPM && !isModAM && startHour < 12) {
      startHour += 12;
    }
    timeSlot = `${String(startHour).padStart(2, '0')}:00`;
  }

  // Pattern 1: "a las 11 de la noche", "todos los días a las 11", "a las cuatro", "a las 4:30 pm", "las 4 y media de la tarde", "a las 11 de la mañana"
  if (!timeSlot) {
    const pattern1 = /(?:a\s+las?|a\s+la|las?|a\s+eso\s+de\s+las?)\s*(\d{1,2}|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce)(?::(\d{2})|\s+y\s+(media|cuarto|\d{1,2}))?\s*(de\s+la\s+tarde|de\s+la\s+noche|de\s+la\s+mañana|de\s+la\s+manana|pm|am|p\.m\.|a\.m\.)?/i;
    const match1 = lower.match(pattern1);

    if (match1) {
      isDirectTask = true;
      if (!assignedDate) assignedDate = todayISO;
      const rawHour = match1[1].toLowerCase();
      let hour = wordMap[rawHour] !== undefined ? wordMap[rawHour] : parseInt(rawHour, 10);
      let minute = 0;

      if (match1[2]) {
        minute = parseInt(match1[2], 10);
      } else if (match1[3]) {
        if (match1[3] === 'media') minute = 30;
        else if (match1[3] === 'cuarto') minute = 15;
        else minute = parseInt(match1[3], 10) || 0;
      }

      const modifier = (match1[4] || '').toLowerCase();
      const isModifierPM = modifier.includes('tarde') || modifier.includes('noche') || modifier.includes('pm') || isGeneralPM;
      const isModifierAM = modifier.includes('mañana') || modifier.includes('manana') || modifier.includes('am') || isGeneralAM;

      if (isModifierPM && !isModifierAM && hour < 12) {
        hour += 12;
      } else if (isModifierAM && hour === 12) {
        hour = 0;
      }

      timeSlot = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
  }

  // Pattern 2: "11 pm", "11:00 pm", "4 de la tarde", "16:00", "23:00", "11:30"
  if (!timeSlot) {
    const pattern2 = /(\d{1,2})(?::(\d{2}))?\s*(pm|am|p\.m\.|a\.m\.|de\s+la\s+tarde|de\s+la\s+noche|de\s+la\s+mañana|de\s+la\s+manana)?/i;
    const match2 = lower.match(pattern2);
    if (match2 && (match2[3] || lower.includes('hora') || lower.includes('program') || lower.includes('agend') || lower.includes('record') || lower.includes('diario') || lower.includes('cada'))) {
      isDirectTask = true;
      if (!assignedDate) assignedDate = todayISO;
      let hour = parseInt(match2[1], 10);
      const minute = match2[2] ? parseInt(match2[2], 10) : 0;
      const mod = (match2[3] || '').toLowerCase();
      if ((mod.includes('tarde') || mod.includes('noche') || mod.includes('pm') || isGeneralPM) && !mod.includes('mañana') && !mod.includes('am') && hour < 12) {
        hour += 12;
      } else if ((mod.includes('mañana') || mod.includes('am')) && hour === 12) {
        hour = 0;
      }
      timeSlot = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
  }

  // Recurring commitment check: "todos los dias", "cada noche", "cada mañana", "correr una hora"
  if (lower.includes('todos los dias') || lower.includes('todos los días') || lower.includes('cada día') || lower.includes('cada dia') || lower.includes('cada mañana') || lower.includes('cada noche') || lower.includes('rutina')) {
    isDirectTask = true;
    if (!assignedDate) assignedDate = todayISO;
    if (!timeSlot) {
      if (lower.includes('noche')) timeSlot = '23:00';
      else if (lower.includes('mañana') || lower.includes('manana')) timeSlot = '08:00';
      else timeSlot = '18:00';
    }
  }

  // Pending action and task keywords: "pendiente", "tarea", "recordatorio", "comprar", "revisar", "pagar", "entrenamiento", "mantenimiento"
  const isPendingActionWord = /\b(pendiente|pendientes|tarea|tareas|recordatorio|recordatorios|por hacer|hacer|revisar|comprar|pagar|entregar|llamar|escribir|enviar|recoger|llevar|limpiar|arreglar|agendar|programar|cita|turno|entrenamiento|mantenimiento)\b/i.test(lower);
  if (isPendingActionWord) {
    isDirectTask = true;
    if (!assignedDate) assignedDate = todayISO;
    if (!timeSlot) timeSlot = '11:00';
  }

  return { timeSlot, assignedDate, isDirectTask, estimatedHours };
}

// Core AI categorization helper using Gemini
async function processIdeaWithGemini(rawText: string, source: string, userId?: string, assignedBy?: string) {
  const cleanText = rawText.trim();
  const ai = getGeminiClient();

  const now = new Date();
  const todayISO = now.toISOString().split('T')[0];
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowISO = tomorrow.toISOString().split('T')[0];

  // Run deterministic parser first
  const deterministicParsed = parseSpanishTimeAndDate(cleanText, todayISO, tomorrowISO);
  const detectedCategory = detectSpanishCategory(cleanText);

  let structuredResult = {
    title: cleanText.slice(0, 70),
    description: `Recibido desde ${source}: "${cleanText}"`,
    categoryId: detectedCategory.categoryId || 'actividades_pendientes',
    type: detectedCategory.type || 'tarea',
    estimatedHours: deterministicParsed.estimatedHours || 1,
    dailyHours: 1,
    finalGoal: detectedCategory.finalGoal || 'Completar el compromiso propuesto',
    isDirectTask: deterministicParsed.isDirectTask || false,
    assignedDate: deterministicParsed.assignedDate || todayISO,
    dueDate: deterministicParsed.assignedDate || todayISO,
    timeSlot: deterministicParsed.timeSlot || '16:00',
  };

  // Rule-based heuristic
  const lowerText = cleanText.toLowerCase();
  const hasTimeIndicator = /\b(\d{1,2}:\d{2}|\d{1,2}\s*(am|pm)|mañana|hoy|tarde|noche|lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo)\b/i.test(lowerText);
  const hasTaskKeyword = /\b(recordatorio|recordar|recordarme|tarea|tareas|pendiente|pendientes|actividad\s+pendiente|actividades\s+pendientes|agregar|anotar|programar|agendar|cita|revisar|comprar|hacer|pagar|llamar|recoger|entregar|inspeccionar|conectar|verificar|instalar|arreglar|configurar|ordenar|limpiar|mandar|enviar|terminar|finalizar|ver serie|ver la serie|ver pelicula|ver la pelicula)\b/i.test(lowerText);
  if (hasTimeIndicator || hasTaskKeyword) {
    structuredResult.isDirectTask = true;
    if (lowerText.includes('mañana') || lowerText.includes('manana')) {
      structuredResult.assignedDate = tomorrowISO;
      structuredResult.dueDate = tomorrowISO;
    }
  }

  // Strip conversational preamble and date/time suffixes from task titles (e.g. "recuerdame visitar a mis papas hoy a las 4 de la tarde" -> "Visitar a mis papas")
  const stripTaskPreamble = (raw: string) => {
    let t = raw.trim();
    t = t.replace(/^(agregar|anotar|guardar|poner)\s+(a|en)?\s*(actividad\s+pendiente|actividades\s+pendientes|pendientes?|tareas?|compromisos?|mi\s+agenda|el\s+calendario)\s*(:|que|de)?\s*/i, '');
    t = t.replace(/^(por\s+favor\s+)?(recordarme|recuerdame|recuérdame|recordar|recuerda|acordarme|acuerdame|acuérdame|agendar|agenda|programar|programa|anotar|anota|avisarme|avisar)\s*(que|de)?\s*/i, '');
    t = t.replace(/^(tarea|pendiente|compromiso)\s*:\s*/i, '');
    t = t.replace(/\s+(hoy|esta\s+tarde|esta\s+noche|mañana|manana|el\s+(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo))\s*(a\s+las?\s+\d{1,2}(:\d{2})?\s*(am|pm|de\s+la\s+(mañana|tarde|noche))?)?$/i, '');
    t = t.replace(/\s+a\s+las?\s+\d{1,2}(:\d{2})?\s*(am|pm|de\s+la\s+(mañana|tarde|noche))?$/i, '');
    t = t.trim();
    if (!t) return raw;
    return t.charAt(0).toUpperCase() + t.slice(1);
  };
  structuredResult.title = stripTaskPreamble(structuredResult.title);

  if (ai) {
    try {
      const extractionPrompt = `
Eres el clasificador, programador y estructurador inteligente de LifeBlocks.
Fecha de referencia actual (HOY): ${todayISO} (Hora actual: ${now.toLocaleTimeString()}).
Mañana es: ${tomorrowISO}.

Analiza el siguiente mensaje dictado o escrito por el usuario:
"${cleanText}"

REGLAS DE CATEGORIZACIÓN ESTRICTAS:
- "ocio_entretenimiento": Series, programas de televisión, películas, cine, documentales, streaming (Netflix, Apple TV, Disney+, HBO Max, Prime Video, Anime, Crunchyroll), videojuegos (PlayStation, Xbox, Nintendo Switch, Steam, PC), hobbies recreativos, espectáculos.
  ⭐ REGLA OBLIGATORIA: Cualquier tarea, recordatorio o actividad de ver series, series y programas, películas, animes o jugar videojuegos (ej: "ver la serie hoy a las 3 de la tarde", "ver stranger things a las 8 pm", "jugar playstation a las 4 pm", "ir al cine a ver una pelicula") DEBE asignarse SIEMPRE a "ocio_entretenimiento" (Series y Programas), NUNCA a "actividades_pendientes".
- "actividades_pendientes": compras generales del hogar, pedidos, paquetes, envíos, filamentos (impresión 3D), repuestos del hogar, pintar, arreglos de carpintería/plomería, trámites de oficina/notaría, llamadas pendientes, tareas domésticas, conectar dispositivos, cámaras, bots, soporte técnico.
- "vehiculos": carros, motos, camionetas, cambio de aceite, odómetro, filtros, frenos, llantas, taller mecánico, seguro de auto, repuestos automotrices.
- "salud_deporte": ÚNICAMENTE actividad física (flexiones, running, pesas, gym, ejercicio, natación, ciclismo), citas médicas, nutrición, hábitos deportivos.
- "aprendizaje_habilidades": estudiar, programar, idiomas, cursos, lectura de estudio, habilidades técnicas.
- "finanzas_hogar": pagar servicios, bancos, cuentas, transferencias, presupuestos, ahorros, facturas.
- "bienestar_mente": meditación, relajación, respiración, hábitos de sueño, salud mental.
- "familia_relaciones": planes con familia, pareja, hijos.

REGLAS DE FECHA Y HORA (FORMATO 24 HORAS HH:MM OBLIGATORIO):
- "4 de la tarde", "4 pm", "cuatro de la tarde" -> "16:00"
- "4:30 de la tarde", "4 y media de la tarde", "4:30 pm" -> "16:30"
- "5 de la tarde", "5 pm" -> "17:00"
- "3 de la tarde", "3 pm" -> "15:00"
- "2 de la tarde", "2 pm" -> "14:00"
- "11 de la mañana", "11 am" -> "11:00"
- "11:30 de la mañana", "11:30 am" -> "11:30"
- "8 de la noche", "8 pm" -> "20:00"
- "10 de la mañana", "10 am" -> "10:00"
- "mañana" -> "${tomorrowISO}"
- "hoy" -> "${todayISO}"

⭐ REGLA DE DETECCIÓN DE TAREAS Y COMPROMISOS:
Si el usuario pide programar, agendar, recordar, agregar a pendientes/actividad pendiente, o indica una acción concreta que debe ejecutarse (ej: "agregar a actividad pendiente conectar camara y verificar bot", "comprar pastillas", "cambio de aceite", "revisar servidor"):
- "isDirectTask": true
- "title": El nombre de la tarea limpio de frases conversacionales como "Agregar a actividad pendiente..." (ej: "Conectar cámara y verificar bot")
- "assignedDate": "YYYY-MM-DD" (si no se especifica día, usa "${todayISO}")
- "timeSlot": "HH:MM en formato 24h" (si no se especifica hora, asigna una hora coherente del día como "11:00", "15:00" o "17:00")

Devuelve ÚNICAMENTE un JSON válido con esta estructura:
{
  "title": "Título corto, claro y directo sin frases como 'Agregar a pendientes' (ej: 'Conectar cámara y verificar bot', 'Ver la serie', 'Revisar llegada de filamentos', '50 flexiones')",
  "description": "Detalles o contexto sintetizado",
  "categoryId": "una de las categorías válidas",
  "type": "tipo específico (ej: serie, pelicula, videojuego, recordatorio, revision_material, mantenimiento, tarea, etc.)",
  "estimatedHours": número (ej: 0.5, 1, 2),
  "isDirectTask": true o false,
  "assignedDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "timeSlot": "HH:MM en formato 24h",
  "finalGoal": "Objetivo final"
}
`;

      let aiResp;
      try {
        aiResp = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: extractionPrompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });
      } catch {
        try {
          aiResp = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: extractionPrompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          });
        } catch {
          // Gracefully proceed
        }
      }

      if (aiResp && aiResp.text) {
        const parsed = JSON.parse(aiResp.text);
        if (parsed.title) structuredResult.title = stripTaskPreamble(parsed.title);
        if (parsed.description) structuredResult.description = parsed.description;
        if (parsed.categoryId && CATEGORY_LABELS[parsed.categoryId]) structuredResult.categoryId = parsed.categoryId;
        if (parsed.type) structuredResult.type = parsed.type;
        if (parsed.estimatedHours) structuredResult.estimatedHours = Number(parsed.estimatedHours) || 1;
        if (parsed.dailyHours) structuredResult.dailyHours = Number(parsed.dailyHours) || 1;
        if (parsed.finalGoal) structuredResult.finalGoal = parsed.finalGoal;
        if (typeof parsed.isDirectTask === 'boolean') structuredResult.isDirectTask = parsed.isDirectTask;
        if (parsed.assignedDate && parsed.assignedDate.includes('-')) structuredResult.assignedDate = parsed.assignedDate;
        if (parsed.dueDate && parsed.dueDate.includes('-')) structuredResult.dueDate = parsed.dueDate;
        if (parsed.timeSlot) {
          structuredResult.timeSlot = normalizeTimeSlot(parsed.timeSlot, cleanText);
        }
      }
    } catch (e) {
      console.warn('Gemini categorization fallback used:', e);
    }
  }

  // Check if this text is an Extra Expense / Invoice (e.g., "Factura veterinaria juguete 45000 pagado", "Gasto adicional veterinaria juguete $40.000")
  const expenseDetection = detectExpenseCategory(cleanText);
  const isExplicitExpense = cleanText.toLowerCase().includes('factura') || 
    cleanText.toLowerCase().includes('gasto adicional') || 
    cleanText.toLowerCase().includes('recibo') || 
    cleanText.toLowerCase().includes('veterinaria juguete') ||
    (expenseDetection.amount > 0 && (cleanText.toLowerCase().includes('compré') || cleanText.toLowerCase().includes('compre') || cleanText.toLowerCase().includes('pagué') || cleanText.toLowerCase().includes('pague') || cleanText.toLowerCase().includes('veterinaria') || cleanText.toLowerCase().includes('gasto')));

  if (isExplicitExpense) {
    const expenseId = `ext-exp-txt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const expenseCategory = expenseDetection.category || 'otro';
    const expenseAmount = expenseDetection.amount || 45000;
    const cleanName = cleanText.replace(/^(factura|gasto adicional|recibo|comprobante)\s*(de|del|:)?\s*/i, '').split(/(?:por|\$|\d|\bcon\b|\bya\b)/i)[0].trim() || 'Gasto Factura';

    const newExpenseRecord: IncomingExtraExpense = {
      id: expenseId,
      source: source || 'Gemini / Asistente de Voz',
      rawText: cleanText,
      userId: userId || undefined,
      name: cleanName.length > 3 ? cleanName : structuredResult.title,
      category: expenseCategory,
      amount: expenseAmount,
      dayOfMonth: new Date().getDate(),
      date: todayISO,
      assignedQuincena: new Date().getDate() <= 15 ? 'quincena_1' : 'quincena_2',
      isPaid: expenseDetection.isPaid !== false,
      paidBy: 'Miguel',
      paymentMethod: 'Tarjeta de Crédito',
      receiptNotes: cleanText,
      createdAt: todayISO,
      updatedAt: todayISO,
    };

    incomingWebhookExpenses.unshift(newExpenseRecord);
    if (incomingWebhookExpenses.length > 80) incomingWebhookExpenses.pop();

    return {
      isExtraExpense: true,
      newExpenseRecord,
      expenseCategoryLabel: EXTRA_EXPENSE_CATEGORY_LABELS[expenseCategory] || 'Gastos Adicionales',
      expenseCategoryEmoji: EXTRA_EXPENSE_CATEGORY_EMOJIS[expenseCategory] || '🐾',
      structuredIdea: structuredResult,
      newIdeaRecord: null,
      newTaskRecord: null,
      isDirectTask: false,
      readableCategory: 'Finanzas & Hogar (Gastos Adicionales)',
      categoryEmoji: '🧾',
    };
  }

  // Mandatory category safeguard for Series, Movies, Streaming, Video Games & Ocio
  const isOcioContent = /\b(serie|series|capitul|temporada|episodio|pelicul|película|peliculas|películas|cine|film|netflix|apple tv|prime video|disney|hbo|crunchyroll|videojueg|video juego|videojuegos|video juegos|playstation|ps5|ps4|xbox|nintendo|switch|steam|anime|manga|ver serie|ver la serie|ver pelicula|ver la pelicula)\b/i.test(cleanText) ||
    lowerText.includes('serie') ||
    lowerText.includes('series') ||
    lowerText.includes('pelicul') ||
    lowerText.includes('película') ||
    lowerText.includes('anime') ||
    lowerText.includes('videojueg') ||
    lowerText.includes('video juego');

  if (isOcioContent) {
    structuredResult.categoryId = 'ocio_entretenimiento';
    if (!structuredResult.type || structuredResult.type === 'tarea' || structuredResult.type === 'pendiente') {
      structuredResult.type = detectedCategory.type || 'serie';
    }
    if (!structuredResult.finalGoal || structuredResult.finalGoal.includes('pendiente')) {
      structuredResult.finalGoal = detectedCategory.finalGoal || 'Ver capítulos y disfrutar de la serie';
    }
  }

  // Ensure deterministic time/date override if matched directly from user's words
  if (deterministicParsed.timeSlot) {
    structuredResult.timeSlot = deterministicParsed.timeSlot;
  }
  if (deterministicParsed.assignedDate) {
    structuredResult.assignedDate = deterministicParsed.assignedDate;
    structuredResult.dueDate = deterministicParsed.assignedDate;
  }
  if (deterministicParsed.isDirectTask) {
    structuredResult.isDirectTask = true;
  }
  structuredResult.timeSlot = normalizeTimeSlot(structuredResult.timeSlot, cleanText);

  const readableCategory = CATEGORY_LABELS[structuredResult.categoryId] || 'Actividades Pendientes & Hogar';
  const categoryEmoji = CATEGORY_EMOJIS[structuredResult.categoryId] || '📋';

  let newIdeaRecord: any = null;
  let newTaskRecord: any = null;

  if (structuredResult.isDirectTask) {
    const taskId = `ext-task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    newTaskRecord = {
      id: taskId,
      source: source || 'Gemini / Asistente de Voz',
      rawText: cleanText,
      title: structuredResult.title,
      description: structuredResult.description,
      category: structuredResult.categoryId || 'actividades_pendientes',
      type: structuredResult.type || 'pendiente',
      priority: assignedBy ? 'alta' : 'media',
      status: 'pendiente',
      estimatedHours: structuredResult.estimatedHours || 1,
      completedHours: 0,
      assignedDate: structuredResult.assignedDate || todayISO,
      dueDate: structuredResult.dueDate || structuredResult.assignedDate || todayISO,
      timeSlot: structuredResult.timeSlot || '11:00',
      tags: assignedBy ? [`Asignado por ${assignedBy}`, 'pareja', 'telegram'] : undefined,
      assignedBy: assignedBy || undefined,
      assignedTo: assignedBy ? 'Miguel' : undefined,
      createdAt: todayISO,
      updatedAt: todayISO,
      userId: userId || undefined,
    };

    incomingWebhookTasks.unshift(newTaskRecord);
    if (incomingWebhookTasks.length > 80) {
      incomingWebhookTasks.pop();
    }
  }

  // Also maintain in ideas queue so it is permanently archived in collections
  const ideaId = `ext-idea-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  newIdeaRecord = {
    id: ideaId,
    source: source || 'Gemini / Asistente de Voz',
    rawText: cleanText,
    ...structuredResult,
    createdAt: todayISO,
    userId: userId || undefined,
  };

  incomingWebhookIdeas.unshift(newIdeaRecord);
  if (incomingWebhookIdeas.length > 80) {
    incomingWebhookIdeas.pop();
  }

  // Persist queues to disk immediately
  saveIncomingWebhooksToDisk();

  return {
    structuredIdea: structuredResult,
    structuredResult,
    newIdeaRecord,
    newTaskRecord,
    isDirectTask: structuredResult.isDirectTask,
    isExtraExpense: false,
    newExpenseRecord: null,
    readableCategory,
    categoryEmoji,
  };
}

// Helper to transcribe audio/voice note with Gemini
async function transcribeAndProcessVoiceAudio(audioBuffer: Buffer, mimeType: string, source: string, userId?: string, assignedBy?: string) {
  const ai = getGeminiClient();
  let transcription = '';

  if (ai) {
    try {
      const base64Data = audioBuffer.toString('base64');
      const prompt = `Escucha con atención este audio de voz en español donde una persona dicta una idea, tarea, gasto, factura, mantenimiento o meta para organizar en su vida diaria. Transcribe el texto exacto. Responde ÚNICAMENTE con el texto transcrito sin explicaciones ni comillas adicionales.`;

      let resp;
      try {
        resp = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType || 'audio/ogg',
                    data: base64Data,
                  },
                },
              ],
            },
          ],
        });
      } catch {
        // Fallback to flash-latest
        try {
          resp = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: [
              {
                role: 'user',
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: mimeType || 'audio/ogg',
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
          });
        } catch {
          // Ignored
        }
      }

      if (resp && resp.text) {
        transcription = resp.text.trim();
      }
    } catch (err) {
      console.warn('Error during voice transcription with Gemini:', err);
    }
  }

  if (!transcription) {
    transcription = 'Audio de voz dictado en Telegram';
  }

  const result = await processIdeaWithGemini(transcription, `${source} (Audio)`, userId, assignedBy);
  return {
    ...result,
    transcription,
  };
}

// Helper to extract clean integer amount from various string/number representations (e.g. '$8.200', '8.200', '8,200', '3400.00', '3.400')
function parseRawFinancialAmount(val: any): number {
  if (typeof val === 'number') {
    if (isNaN(val)) return 0;
    if (val > 0 && val < 50) {
      // In case someone wrote 8.2 meaning 8200 COP or 3.4 meaning 3400 COP
      return Math.round(val * 1000);
    }
    return Math.round(val);
  }
  if (!val || typeof val !== 'string') return 0;

  const str = val.trim();
  if (!str) return 0;

  // Case: "8.2 mil" or "40k"
  const milMatch = str.toLowerCase().match(/(\d+(?:[.,]\d+)?)\s*(?:mil|k)\b/);
  if (milMatch) {
    return Math.round(parseFloat(milMatch[1].replace(',', '.')) * 1000);
  }

  // Case: "$ 8.200", "$8.200,00", "$ 150.000", "$8200", "COP 8.200", "Total: $ 8.200", "Enviaste: $8.200"
  const currencyMatch = str.match(/(?:[$€£]|COP|Pesos?|Total|Valor|Monto|Transferido|Enviaste)\s*[:=]?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d+)/i);
  if (currencyMatch) {
    let numStr = currencyMatch[1].trim();
    numStr = numStr.replace(/[.,]00$/, '');
    const cleaned = numStr.replace(/[.,]/g, '');
    const parsed = parseInt(cleaned, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed < 1000000000) {
      return parsed;
    }
  }

  // Case: Colombian thousands notation: 8.200, 15.000, 150.000, 1.250.000, 8,200
  const thousandsMatch = str.match(/\b(\d{1,3}(?:\.\d{3})+|\d{1,3}(?:,\d{3})+)(?:[.,]00)?\b/);
  if (thousandsMatch) {
    const clean = thousandsMatch[1].replace(/[.,]/g, '');
    const num = parseInt(clean, 10);
    if (!isNaN(num) && num > 0) return num;
  }

  // Case: with decimals like 8200.00 or 8.200,00 or 8,200.00
  const decimalMatch = str.match(/(?:\$|\b)(\d{1,8})[.,](\d{2})(?:\b|$)/);
  if (decimalMatch) {
    const num = parseInt(decimalMatch[1].replace(/[.,]/g, ''), 10);
    if (!isNaN(num) && num > 0) return num;
  }

  // Case: plain digits 3 to 9 digits: 8200, 15000, 45000, 150000
  const plainMatches = str.match(/\b\d{3,9}\b/g);
  if (plainMatches && plainMatches.length > 0) {
    const filtered = plainMatches
      .map(n => parseInt(n, 10))
      .filter(n => n > 0 && n !== 2024 && n !== 2025 && n !== 2026 && n !== 2027);
    if (filtered.length > 0) {
      return filtered[0];
    }
    return parseInt(plainMatches[0], 10);
  }

  return 0;
}

// Dedicated OCR helper to transcribe and extract ticket / invoice / bank transfer lines with high precision
async function extractInvoiceTotalDirectly(ai: GoogleGenAI, imageBuffer: Buffer, mimeType: string, captionText?: string): Promise<{ amount: number; establishment: string; rawTotal: string; fullText: string }> {
  try {
    const base64Data = imageBuffer.toString('base64');
    const directPrompt = `Eres un sistema OCR y Visión IA de máxima precisión especializado en finanzas colombianas (COP).
Tu tarea es analizar la imagen adjunta, que puede ser:
1. Comprobante / Captura de pantalla de transferencia bancaria (Nequi, Bancolombia, Daviplata, Transfiya, PSE, Dale, Lulo Bank, BBVA, Davivienda, etc.).
2. Factura física o ticket de caja POS (D1, Ara, Éxito, Jumbo, Carulla, Olímpica, droguerías, restaurantes, tiendas).
3. Recibo de pago digital o voucher.
Texto complementario del usuario: "${captionText || ''}".

INSTRUCCIONES DE EXTRACCIÓN:
1. Para Transferencias Bancarias (Nequi / Bancolombia / Daviplata / PSE):
   - "establishment": Nombre de la persona o comercio receptor (ej: "Envío Nequi a Juan Pérez", "Transferencia Bancolombia", "Pago PSE", "Daviplata").
   - "rawTotalText": El valor exacto transferido (ej: "$ 8.200", "$ 150.000", "8.200,00"). ¡Cuidado! NO confundas números de comprobante o cuentas bancarias con el monto de dinero.
   - "amount": El valor monetario en número entero en COP (ej: 8200, 150000, 45000).
2. Para Facturas y Tickets:
   - "establishment": Nombre de la tienda o comercio.
   - "rawTotalText": Texto de la línea de TOTAL / TOTAL A PAGAR / VALOR A PAGAR.
   - "amount": Monto entero en Pesos Colombianos (COP) sin decimales.

Responde ÚNICAMENTE con este JSON válido:
{
  "establishment": "Nombre",
  "rawTotalText": "$ 8.200",
  "amount": 8200,
  "fullText": "..."
}`;

    const imagePart = {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: base64Data,
      },
    };
    const textPart = { text: directPrompt };

    const modelsToTry = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-3.7-flash', 'gemini-3.1-pro-preview'];
    let respText = '';

    for (const modelName of modelsToTry) {
      try {
        const resp = await ai.models.generateContent({
          model: modelName,
          contents: [imagePart, textPart],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.0,
          },
        });
        if (resp?.text) {
          respText = resp.text;
          break;
        }
      } catch (mErr) {
        console.warn(`Direct OCR with model ${modelName} failed, trying next:`, mErr);
      }
    }

    if (respText) {
      console.log('[Direct OCR Response]:', respText);
      const cleaned = respText.replace(/```(?:json)?\s*/gi, '').replace(/```\s*$/gi, '').trim();
      const parsed = JSON.parse(cleaned);
      let calculatedAmount = parseRawFinancialAmount(parsed.amount);
      if (calculatedAmount <= 0 && parsed.rawTotalText) {
        calculatedAmount = parseRawFinancialAmount(parsed.rawTotalText);
      }
      if (calculatedAmount <= 0 && parsed.fullText) {
        calculatedAmount = parseRawFinancialAmount(parsed.fullText);
      }

      return {
        amount: calculatedAmount,
        establishment: parsed.establishment || '',
        rawTotal: parsed.rawTotalText || '',
        fullText: parsed.fullText || '',
      };
    }
  } catch (err) {
    console.error('Direct invoice OCR extraction error:', err);
  }
  return { amount: 0, establishment: '', rawTotal: '', fullText: '' };
}

// Helper to extract data from photos (e.g. invoices, bank transfers, receipts, store purchases, movies, series, posters, books) with Gemini Vision
async function processImageWithGeminiVision(imageBuffer: Buffer, mimeType: string, captionText: string, source: string, userId?: string) {
  const ai = getGeminiClient();
  const captionLower = (captionText || '').toLowerCase();
  
  // Check if caption hints strongly at an invoice/expense/transfer
  const hasInvoiceKeywordsInCaption = captionLower.includes('factura') || 
    captionLower.includes('recibo') || 
    captionLower.includes('comprobante') || 
    captionLower.includes('ticket') || 
    captionLower.includes('gasto') || 
    captionLower.includes('compra') || 
    captionLower.includes('tienda') || 
    captionLower.includes('veterinaria') || 
    captionLower.includes('supermercado') || 
    captionLower.includes('farmacia') || 
    captionLower.includes('restaurante') || 
    captionLower.includes('transferencia') || 
    captionLower.includes('transferido') || 
    captionLower.includes('envio') || 
    captionLower.includes('enviaste') || 
    captionLower.includes('nequi') || 
    captionLower.includes('bancolombia') || 
    captionLower.includes('daviplata') || 
    captionLower.includes('transfiya') || 
    captionLower.includes('pse') || 
    captionLower.includes('davivienda') || 
    captionLower.includes('lulo') || 
    captionLower.includes('dale') || 
    captionLower.includes('d1') || 
    captionLower.includes('éxito') || 
    captionLower.includes('exito') || 
    captionLower.includes('jumbo') || 
    captionLower.includes('falabella') || 
    captionLower.includes('valor') || 
    captionLower.includes('total') || 
    captionLower.includes('precio') || 
    captionLower.includes('pago') || 
    captionLower.includes('pagado') || 
    captionLower.includes('$') || 
    captionLower.includes('cop') || 
    captionLower.includes('pesos');

  let visionAnalysis: any = {
    title: hasInvoiceKeywordsInCaption ? 'Factura / Comprobante de Compra' : 'Registro desde Foto',
    description: captionText || 'Información extraída de imagen con Visión IA',
    categoryId: hasInvoiceKeywordsInCaption ? 'finanzas_hogar' : 'actividades_pendientes',
    type: hasInvoiceKeywordsInCaption ? 'gasto_adicional' : 'foto_general',
    platform: '',
    genre: '',
    author: '',
    totalPages: 0,
    releaseYear: new Date().getFullYear(),
    estimatedHours: 1,
    dailyHours: 1,
    finalGoal: hasInvoiceKeywordsInCaption ? 'Mantener control de gastos y finanzas' : 'Registrar información',
    extractedSummary: '',
    isInvoiceOrReceipt: hasInvoiceKeywordsInCaption,
    isFinancialExpense: hasInvoiceKeywordsInCaption,
    financialExpense: null as any,
  };

  let rawModelOutput = '';

  if (ai) {
    try {
      const base64Data = imageBuffer.toString('base64');
      const prompt = `Eres el sistema experto de Visión Computacional, OCR e Inteligencia Artificial de LifeBlocks especializado en Colombia (Finanzas, Transferencias Nequi/Bancolombia/Daviplata, Entretenimiento Películas/Series y Biblioteca de Libros).
Analiza con MÁXIMA PRECISIÓN la imagen adjunta enviada por el usuario junto con el texto opcional: "${captionText}".

CLASIFICA LA IMAGEN EN UNO DE ESTOS 4 CASOS PRINCIPALES:

========================================================================
CASO 1: TRANSFERENCIA BANCARIA, FACTURA, RECIBO O COMPROBANTE DE PAGO
(Capturas de Nequi, Bancolombia, Daviplata, PSE, Transfiya, tickets POS de D1/Éxito/Jumbo/Ara, tiendas, restaurantes, etc.)
========================================================================
- "categoryId": "finanzas_hogar"
- "isInvoiceOrReceipt": true
- "isFinancialExpense": true
- "type": "gasto_adicional"
- "title": Nombre descriptivo (ej: "Transferencia Nequi a Juan", "Factura D1", "Pago Bancolombia", "Droguería Cruz Verde")
- "financialExpense":
  * "name": Nombre del destinatario, persona o comercio (ej: "Nequi - Juan Pérez", "D1 Supermercado", "Restaurante La Parrilla")
  * "category": Selecciona exactamente una de:
    - "compras_ropa": ropa, calzado, moda.
    - "salidas_ocio": restaurantes, cafés, bares, cine, comida fuera.
    - "mascotas_extra": veterinaria, comida mascota, medicinas animales.
    - "salud_farmacia": farmacias, droguerías, medicamentos, consultas médicas particulares.
    - "imprevisto_hogar": ferreterías, reparaciones, servicios técnicos, aseo.
    - "regalos_celebracion": regalos, fechas especiales.
    - "transporte_extra": gasolina, peajes, parqueaderos, taxis, uber.
    - "tecnologia_hogar": cargadores, cables, accesorios tech.
    - "otro": transferencias personales, pagos generales o compras varias.
  * "amount": MONTO TOTAL EN PESOS COLOMBIANOS COMO NÚMERO ENTERO (ej: 8200, 15000, 45000, 120000).
    ¡ATENCIÓN CRÍTICA!: Si la imagen muestra "$ 8.200", "$8.200,00", o "8200", el valor es 8200. NO confundas números de cuenta, celular o código de referencia con el dinero transferido.
  * "rawTotalText": Texto tal cual aparece en la pantalla (ej: "$ 8.200", "$ 150.000 COP")
  * "isPaid": true
  * "dayOfMonth": Día del mes de la fecha o día actual (${new Date().getDate()})
  * "date": "${new Date().toISOString().split('T')[0]}"
  * "paidBy": Si en el texto o imagen se menciona a alguien ("Miguel", "Liz"), ponlo. Por defecto "Miguel".
  * "paymentMethod": Si es Nequi pon "Nequi", si es Bancolombia pon "Bancolombia", si es Daviplata pon "Daviplata", si es tarjeta pon "Tarjeta de Crédito", o "Efectivo"
  * "receiptNotes": Resumen del comprobante, número de confirmación o artículos
- "extractedSummary": "• Concepto/Receptor: [Nombre]\\n• Monto: $[Monto] COP\\n• Método: [Nequi/Bancolombia/Tarjeta]\\n• Estado: Pagado"

========================================================================
CASO 2: PELÍCULA, SERIE DE TV, ANIME O VIDEOJUEGO
(Capturas de Netflix, Prime Video, Max, Disney+, Apple TV+, YouTube, Letterboxd, IMDb, pósters de cine, TikTok de recomendaciones)
========================================================================
- "categoryId": "ocio_entretenimiento"
- "isInvoiceOrReceipt": false
- "isFinancialExpense": false
- "type": "pelicula" | "serie" | "anime" | "videojuego"
- "title": TÍTULO EXACTO Y OFICIAL de la obra identificada en la captura o póster (ej: "Dune: Parte Dos", "Severance", "Breaking Bad", "Elden Ring", "Gladiador II")
- "platform": Plataforma de streaming o emisión (ej: "Netflix", "Max", "Prime Video", "Disney+", "Apple TV+", "Cine", "YouTube", "PlayStation")
- "genre": Género principal (ej: "Ciencia Ficción", "Drama", "Acción", "Terror", "Comedia", "Thriller")
- "releaseYear": Año de estreno (ej: 2024)
- "description": Sinopsis o resumen atractivo de qué trata la película/serie y por qué verla
- "finalGoal": "Ver película / serie y registrar en lista de entretenimiento"
- "extractedSummary": "• Título: [Nombre]\\n• Tipo: [Película / Serie]\\n• Plataforma: [Plataforma]\\n• Género: [Género]\\n• Año: [Año]"

========================================================================
CASO 3: LIBRO, PORTADA DE LIBRO O RECOMENDACIÓN DE LECTURA (BIBLIOTECA)
(Portadas de libros físicos, capturas de Kindle, Goodreads, recomendaciones de libros o páginas)
========================================================================
- "categoryId": "aprendizaje"
- "isInvoiceOrReceipt": false
- "isFinancialExpense": false
- "type": "libro"
- "title": TÍTULO EXACTO Y COMPLETO del libro (visible en la portada, lomo o captura)
- "author": Nombre exacto del autor/a (ej: "James Clear", "Marco Aurelio", "Robert Kiyosaki", "Cal Newport")
- "totalPages": Número total de páginas estimado o identificado (ej: 320)
- "genre": Género o categoría (ej: "Desarrollo Personal", "Finanzas & Negocios", "Filosofía", "Productividad & Hábitos", "Psicología", "Ciencia & Tecnología", "Novela / Ficción")
- "description": Resumen de qué trata el libro, ideas centrales y aprendizajes clave
- "finalGoal": "Leer libro y aplicar aprendizajes clave"
- "extractedSummary": "• Libro: [Título]\n• Autor: [Autor]\n• Género: [Género]\n• Páginas: [Páginas] págs"

========================================================================
CASO 4: OTRA FOTO (Nota, vehículo, rutina, receta, etc.)
========================================================================
- "categoryId": "actividades_pendientes" o "vehiculos" o "salud_deporte"
- "isInvoiceOrReceipt": false
- "isFinancialExpense": false
- "type": "idea" o "mantenimiento"
- "title": Título claro
- "description": Contenido de la foto

Devuelve ÚNICAMENTE un JSON con esta estructura (sin formato markdown):
{
  "title": "Nombre extraído",
  "description": "Detalles o resumen",
  "categoryId": "finanzas_hogar",
  "type": "gasto_adicional",
  "platform": "",
  "genre": "",
  "author": "",
  "totalPages": 0,
  "releaseYear": 2024,
  "estimatedHours": 1,
  "dailyHours": 1,
  "finalGoal": "Objetivo",
  "extractedSummary": "• Resumen",
  "isInvoiceOrReceipt": true,
  "isFinancialExpense": true,
  "financialExpense": {
    "name": "Nequi - Juan Pérez",
    "category": "otro",
    "amount": 8200,
    "rawTotalText": "$ 8.200",
    "isPaid": true,
    "dayOfMonth": 15,
    "date": "2026-08-30",
    "paidBy": "Miguel",
    "paymentMethod": "Nequi",
    "receiptNotes": "Comprobante M123456"
  }
}`;

      const imagePart = {
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: base64Data,
        },
      };
      const textPart = { text: prompt };

      const modelsToTry = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-3.7-flash', 'gemini-3.1-pro-preview'];
      let respText = '';

      for (const modelName of modelsToTry) {
        try {
          const resp = await ai.models.generateContent({
            model: modelName,
            contents: [imagePart, textPart],
            config: {
              responseMimeType: 'application/json',
              temperature: 0.0,
            },
          });
          if (resp?.text) {
            respText = resp.text;
            break;
          }
        } catch (e) {
          console.warn(`Vision model ${modelName} attempt failed:`, e);
        }
      }

      if (respText) {
        rawModelOutput = respText;
        console.log('[Vision Main Output]:', rawModelOutput);
        const cleanedText = respText.replace(/```(?:json)?\s*/gi, '').replace(/```\s*$/gi, '').trim();
        const parsed = JSON.parse(cleanedText);
        if (parsed.title) visionAnalysis.title = parsed.title;
        if (parsed.description) visionAnalysis.description = parsed.description;
        if (parsed.categoryId) visionAnalysis.categoryId = parsed.categoryId;
        if (parsed.type) visionAnalysis.type = parsed.type;
        if (parsed.platform) visionAnalysis.platform = parsed.platform;
        if (parsed.genre) visionAnalysis.genre = parsed.genre;
        if (parsed.author) visionAnalysis.author = parsed.author;
        if (parsed.totalPages) visionAnalysis.totalPages = Number(parsed.totalPages) || 0;
        if (parsed.releaseYear) visionAnalysis.releaseYear = parsed.releaseYear;
        if (parsed.estimatedHours) visionAnalysis.estimatedHours = Number(parsed.estimatedHours) || 1;
        if (parsed.dailyHours) visionAnalysis.dailyHours = Number(parsed.dailyHours) || 1;
        if (parsed.finalGoal) visionAnalysis.finalGoal = parsed.finalGoal;
        if (parsed.extractedSummary) visionAnalysis.extractedSummary = parsed.extractedSummary;
        if (typeof parsed.isInvoiceOrReceipt === 'boolean') visionAnalysis.isInvoiceOrReceipt = parsed.isInvoiceOrReceipt;
        if (typeof parsed.isFinancialExpense === 'boolean') visionAnalysis.isFinancialExpense = parsed.isFinancialExpense;
        if (parsed.financialExpense) visionAnalysis.financialExpense = parsed.financialExpense;
      }
    } catch (err) {
      console.warn('Error during Gemini Vision extraction:', err);
    }
  }

  // Deterministic checks
  const expenseDetection = detectExpenseCategory(`${captionText} ${visionAnalysis.title || ''} ${visionAnalysis.description || ''} ${rawModelOutput}`);
  
  // Decide if this is an Invoice / Expense:
  const isInvoice = hasInvoiceKeywordsInCaption ||
    visionAnalysis.isInvoiceOrReceipt === true ||
    visionAnalysis.isFinancialExpense === true ||
    visionAnalysis.categoryId === 'finanzas_hogar' ||
    visionAnalysis.type === 'gasto_adicional' ||
    (expenseDetection.amount > 0 && !captionLower.includes('pelicula') && !captionLower.includes('serie') && !captionLower.includes('videojuego'));

  if (isInvoice) {
    visionAnalysis.categoryId = 'finanzas_hogar';
    visionAnalysis.type = 'gasto_adicional';
    visionAnalysis.isInvoiceOrReceipt = true;
    visionAnalysis.isFinancialExpense = true;

    const expenseData = visionAnalysis.financialExpense || {};
    
    // Extract amount using robust multi-level parser
    let amount = parseRawFinancialAmount(expenseData.amount);
    
    if (amount <= 0 && expenseData.rawTotalText) {
      amount = parseRawFinancialAmount(expenseData.rawTotalText);
    }

    if (amount <= 0 && expenseData.total) {
      amount = parseRawFinancialAmount(expenseData.total);
    }

    if (amount <= 0 && expenseData.valor) {
      amount = parseRawFinancialAmount(expenseData.valor);
    }

    if (amount <= 0 && expenseDetection.amount > 0) {
      amount = expenseDetection.amount;
    }

    if (amount <= 0 && rawModelOutput) {
      amount = parseRawFinancialAmount(rawModelOutput);
    }

    // If STILL amount <= 0, run dedicated direct OCR extraction
    if (amount <= 0 && ai) {
      const directOcr = await extractInvoiceTotalDirectly(ai, imageBuffer, mimeType, captionText);
      if (directOcr.amount > 0) {
        amount = directOcr.amount;
        if (!expenseData.name && directOcr.establishment) {
          expenseData.name = directOcr.establishment;
        }
      }
    }

    // Caption fallback if any number was written by user
    if (amount <= 0 && captionText) {
      const capNum = parseRawFinancialAmount(captionText);
      if (capNum > 0) amount = capNum;
    }

    const category = expenseData.category || expenseDetection.category || 'otro';
    const isPaid = expenseData.isPaid !== false && expenseDetection.isPaid !== false;
    const dayOfMonth = Number(expenseData.dayOfMonth) || new Date().getDate();
    const dateStr = expenseData.date || new Date().toISOString().split('T')[0];

    let cleanName = expenseData.name || expenseDetection.name || visionAnalysis.title.replace(/^(factura|recibo|comprobante|gasto|compra)\s*(de|del|en|:)?\s*/i, '').trim();
    if (!cleanName || cleanName.length < 3 || cleanName.toLowerCase().includes('registro desde foto')) {
      cleanName = category === 'compras_ropa' ? 'Tienda de Ropa' :
                  category === 'salidas_ocio' ? 'Restaurante / Salida' :
                  category === 'mascotas_extra' ? 'Veterinaria / Mascota' :
                  category === 'salud_farmacia' ? 'Farmacia / Salud' :
                  category === 'imprevisto_hogar' ? 'Reparación / Hogar' :
                  category === 'transporte_extra' ? 'Transporte / Gasolina' :
                  category === 'tecnologia_hogar' ? 'Tecnología' : 'Factura de Compra';
    }

    const paidBy = expenseData.paidBy || expenseDetection.paidBy || 'Miguel';
    const paymentMethod = expenseData.paymentMethod || 'Tarjeta de Crédito';
    const receiptNotes = expenseData.receiptNotes || visionAnalysis.extractedSummary || captionText || 'Factura procesada automáticamente con Visión IA';

    const newExpenseRecord: IncomingExtraExpense = {
      id: `ext-exp-img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      source: source || 'Telegram Foto',
      rawText: captionText || cleanName,
      userId: userId,
      name: cleanName,
      category: category,
      amount: amount,
      dayOfMonth: dayOfMonth,
      date: dateStr,
      assignedQuincena: dayOfMonth <= 15 ? 'quincena_1' : 'quincena_2',
      isPaid: isPaid,
      paidBy: paidBy,
      paymentMethod: paymentMethod,
      receiptNotes: receiptNotes,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    // Store in global webhook extra expenses queue
    incomingWebhookExpenses.unshift(newExpenseRecord);
    if (incomingWebhookExpenses.length > 80) {
      incomingWebhookExpenses.pop();
    }
    saveIncomingWebhooksToDisk();

    const expenseCategoryLabel = EXTRA_EXPENSE_CATEGORY_LABELS[category] || 'Otros Gastos';
    const expenseCategoryEmoji = EXTRA_EXPENSE_CATEGORY_EMOJIS[category] || '🧾';

    return {
      isExtraExpense: true,
      newExpenseRecord,
      expenseCategoryLabel,
      expenseCategoryEmoji,
      structuredIdea: visionAnalysis,
      newIdeaRecord: null,
      readableCategory: 'Finanzas & Hogar (Gastos Adicionales)',
      categoryEmoji: '🧾',
      extractedSummary: visionAnalysis.extractedSummary || `• Establecimiento: ${cleanName}\n• Monto: $${amount.toLocaleString('es-CO')} COP\n• Pagado por: ${paidBy}`,
    };
  }

  // If not an invoice, check if it is entertainment (movie, series, game)
  const combinedCheckText = `${captionText} ${visionAnalysis.title || ''} ${visionAnalysis.description || ''} ${visionAnalysis.type || ''}`.toLowerCase();
  const isMovieOrSeriesOrGame = visionAnalysis.categoryId === 'ocio_entretenimiento' || 
    ['pelicula', 'serie', 'anime', 'videojuego'].includes(visionAnalysis.type) ||
    /\b(pelicul|película|peliculas|películas|film|movie|cine|serie|series|capitul|temporada|episodio|anime|manga|netflix|apple tv|prime video|disney|hbo|max|crunchyroll|videojueg|video juego|videojuegos|playstation|ps5|ps4|xbox|nintendo|switch|steam|poster|sinopsis)\b/i.test(combinedCheckText);

  // Check if it is a book or reading recommendation
  const isBookDetected = visionAnalysis.type === 'libro' || 
    visionAnalysis.categoryId === 'aprendizaje' ||
    visionAnalysis.categoryId === 'aprendizaje_habilidades' ||
    !!visionAnalysis.author ||
    /\b(libro|libros|book|books|lectura|leer|autor|autora|páginas|paginas|editorial|capítulo|goodreads|kindle|desarrollo personal|novela|bestseller|no ficcion|ensayo|título del libro)\b/i.test(combinedCheckText);

  const isFinalBook = isBookDetected && !isMovieOrSeriesOrGame;

  if (isFinalBook) {
    visionAnalysis.categoryId = 'aprendizaje';
    visionAnalysis.type = 'libro';
    visionAnalysis.isInvoiceOrReceipt = false;
    visionAnalysis.isFinancialExpense = false;
    visionAnalysis.financialExpense = null;
    visionAnalysis.finalGoal = 'Leer libro y aplicar aprendizajes clave';
  } else if (isMovieOrSeriesOrGame) {
    visionAnalysis.categoryId = 'ocio_entretenimiento';
    visionAnalysis.isInvoiceOrReceipt = false;
    visionAnalysis.isFinancialExpense = false;
    visionAnalysis.financialExpense = null;
    if (!['pelicula', 'serie', 'anime', 'videojuego'].includes(visionAnalysis.type)) {
      visionAnalysis.type = combinedCheckText.includes('serie') ? 'serie' : 
        combinedCheckText.includes('juego') || combinedCheckText.includes('game') ? 'videojuego' : 
        combinedCheckText.includes('anime') ? 'anime' : 'pelicula';
    }
    visionAnalysis.finalGoal = 'Ver película / serie y disfrutar de momentos de entretenimiento';
  }

  const readableCategory = CATEGORY_LABELS[visionAnalysis.categoryId] || (isFinalBook ? 'Aprendizaje & Nuevas Habilidades' : 'Ocio & Entretenimiento');
  const categoryEmoji = CATEGORY_EMOJIS[visionAnalysis.categoryId] || (isFinalBook ? '📚' : '🎬');

  const newIdeaRecord = {
    id: `ext-idea-img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    source: `${source} (Foto OCR)`,
    rawText: captionText || visionAnalysis.title,
    ...visionAnalysis,
    createdAt: new Date().toISOString().split('T')[0],
    userId: userId || undefined,
  };

  incomingWebhookIdeas.unshift(newIdeaRecord);
  if (incomingWebhookIdeas.length > 60) {
    incomingWebhookIdeas.pop();
  }
  saveIncomingWebhooksToDisk();

  return {
    isExtraExpense: false,
    newExpenseRecord: null,
    expenseCategoryLabel: '',
    expenseCategoryEmoji: '',
    structuredIdea: visionAnalysis,
    newIdeaRecord,
    readableCategory,
    categoryEmoji,
    extractedSummary: visionAnalysis.extractedSummary,
    isBook: isFinalBook,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // ----------------------------------------------------
  // WEBHOOK / EXTERNAL API: Send ideas directly from Gemini, Google Assistant, Shortcuts or Webhooks
  // Supports both POST (JSON / form) and GET (query params) for maximum mobile compatibility
  // ----------------------------------------------------
  const handleIncomingIdeaWebhook = async (req: Request, res: Response) => {
    try {
      const text = req.body?.text || req.body?.prompt || req.body?.idea || req.body?.note || req.query?.text || req.query?.prompt || req.query?.idea || req.query?.note || (typeof req.body === 'string' ? req.body : '');
      const source = req.body?.source || req.query?.source || 'Gemini / Asistente Móvil';
      const userId = req.body?.userId || req.query?.userId || undefined;

      if (!text || typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Falta el texto de la idea. Envía { "text": "Tu idea aquí" } o ?text=Tu+idea'
        });
      }

      // Check if user is asking for daily agenda / summary / questions
      const queryCheck = detectUserQueryIntent(text);
      if (queryCheck.isQuery) {
        const summaryReply = await handleUserQueryResponse(queryCheck, 'usuario', userId);
        return res.json({
          success: true,
          isQuery: true,
          message: summaryReply.text,
          spokenResponse: summaryReply.text.replace(/[*_#•`]/g, ''),
          replyMarkup: summaryReply.replyMarkup,
        });
      }

      const { structuredIdea, newIdeaRecord, readableCategory, categoryEmoji } = await processIdeaWithGemini(text, source, userId);

      return res.json({
        success: true,
        message: `¡Idea guardada exitosamente en ${readableCategory}!`,
        spokenResponse: `He guardado "${structuredIdea.title}" en tu colección de ${readableCategory} en LifeBlocks.`,
        idea: newIdeaRecord,
        categoryEmoji,
      });
    } catch (err: any) {
      console.error('Error in /api/webhook/idea:', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Internal Server Error'
      });
    }
  };

  app.post('/api/webhook/idea', handleIncomingIdeaWebhook);
  app.get('/api/webhook/idea', handleIncomingIdeaWebhook);

  // ----------------------------------------------------
  // TELEGRAM BOT NATIVE INTEGRATION
  // ----------------------------------------------------

  // 1. Status & Info of Telegram Bot
  app.get('/api/telegram/status', async (req: Request, res: Response) => {
    const token = (req.query?.token as string) || process.env.TELEGRAM_BOT_TOKEN || '';
    if (!token) {
      return res.json({
        configured: false,
        message: 'No hay TELEGRAM_BOT_TOKEN configurado en el entorno.',
      });
    }

    try {
      const meResp = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const meData = await meResp.json();

      const hookResp = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
      const hookData = await hookResp.json();

      return res.json({
        configured: true,
        ok: meData.ok,
        bot: meData.result || null,
        webhook: hookData.result || null,
      });
    } catch (err: any) {
      return res.status(500).json({
        configured: true,
        ok: false,
        error: err?.message || 'Error connecting to Telegram API',
      });
    }
  });

  // 2. Set Webhook in 1 click
  app.post('/api/telegram/set-webhook', async (req: Request, res: Response) => {
    try {
      const token = req.body?.botToken || process.env.TELEGRAM_BOT_TOKEN || '';
      const webhookUrl = req.body?.webhookUrl || '';

      if (!token) {
        return res.status(400).json({ success: false, error: 'Falta el botToken de Telegram' });
      }
      if (!webhookUrl) {
        return res.status(400).json({ success: false, error: 'Falta la URL de webhook' });
      }

      const resp = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
      const data = await resp.json();

      return res.json({
        success: data.ok,
        telegramResponse: data,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  // 3. Main Telegram Webhook (Processes updates, messages, commands, callback queries & voice notes)
  app.post('/api/telegram/webhook', async (req: Request, res: Response) => {
    try {
      const update = req.body;
      const token = (req.query?.token as string) || process.env.TELEGRAM_BOT_TOKEN || '';
      const userId = (req.query?.userId as string) || undefined;

      // Prevent Telegram webhook duplicate retries
      const updateId = update?.update_id ? `upd_${update.update_id}` : null;
      const msgId = update?.message?.message_id && update?.message?.chat?.id ? `msg_${update.message.chat.id}_${update.message.message_id}` : null;
      const dedupeKey = updateId || msgId;

      if (dedupeKey) {
        if (processedTelegramUpdates.has(dedupeKey)) {
          console.log(`[Telegram] Duplicate update ${dedupeKey} ignored.`);
          return res.json({ ok: true, note: 'Duplicate ignored' });
        }
        processedTelegramUpdates.add(dedupeKey);
        if (processedTelegramUpdates.size > 500) {
          const firstKey = processedTelegramUpdates.values().next().value;
          if (firstKey) processedTelegramUpdates.delete(firstKey);
        }
      }

      // 1. Handle Inline Button Clicks (Callback Queries from Telegram)
      if (update?.callback_query) {
        const cq = update.callback_query;
        const cqChatId = cq.message?.chat?.id;
        const cqData = cq.data || '';
        const cqFrom = cq.from?.first_name || 'Amigo';

        // Answer callback query so Telegram spinner stops
        if (token && cq.id) {
          fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: cq.id }),
          }).catch(() => {});
        }

        if (cqData.startsWith('HABIT_DONE:')) {
          const habitIdOrTitle = cqData.replace('HABIT_DONE:', '').trim();
          
          let userAgenda = (userId ? userAgendaStore.get(userId) : null) || lastKnownGlobalAgenda || userAgendaStore.get('default') || Array.from(userAgendaStore.values())[0] || null;
          let habitTitle = habitIdOrTitle;
          let habitIcon = '🔥';
          let newStreak = 1;
          const todayStr = new Date().toISOString().split('T')[0];

          if (userAgenda && Array.isArray(userAgenda.habits)) {
            const targetHabit = userAgenda.habits.find(h => h.id === habitIdOrTitle || h.title.toLowerCase().trim() === habitIdOrTitle.toLowerCase().trim());
            if (targetHabit) {
              targetHabit.completedToday = true;
              targetHabit.streak = (targetHabit.streak || 0) + 1;
              habitTitle = targetHabit.title;
              habitIcon = targetHabit.icon || '🔥';
              newStreak = targetHabit.streak;
              saveAgendaStoreToDisk();
            }
          }

          // Register habit completion event for web client synchronization
          recentHabitCompletionEvents.push({
            id: `evt-h-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            habitId: habitIdOrTitle,
            habitTitle: habitTitle,
            completedDate: todayStr,
            timestamp: new Date().toISOString(),
            userId: userAgenda?.userId || userId,
            newStreak,
          });

          // Remaining pending habits buttons
          const remainingPending = (userAgenda?.habits || []).filter(h => !h.completedToday && h.id !== habitIdOrTitle);
          let remainingButtons: Array<Array<{ text: string; callback_data: string }>> = [];
          if (remainingPending.length > 0) {
            remainingButtons = remainingPending.slice(0, 5).map(h => ([
              {
                text: `✅ Hecho: ${h.icon || '🔥'} ${h.title}`,
                callback_data: `HABIT_DONE:${h.id}`,
              }
            ]));
          }

          const praiseMessage = `🎉 *¡Excelente trabajo, ${cqFrom}!*
          
✅ He marcado tu hábito *"${habitIcon} ${habitTitle}"* como *COMPLETADO* hoy en tu tablero de LifeGlow.
🔥 *Tu racha actual:* *${newStreak} día(s) consecutivos*.

${remainingButtons.length > 0 ? `_Aún tienes ${remainingButtons.length} hábito(s) pendientes hoy. Toca el botón para completarlo:_` : `🏆 *¡Felicidades! Has completado todos tus hábitos del día.*`}`;

          if (token && cqChatId) {
            await sendTelegramMessage(token, cqChatId, praiseMessage, remainingButtons.length > 0 ? { inline_keyboard: remainingButtons } : undefined);
          }
          return res.json({ ok: true });
        }

        if (cqData.startsWith('TASK_DONE:')) {
          const taskIdentifier = cqData.replace('TASK_DONE:', '').trim();
          pendingUserFollowups.delete(String(cqChatId));

          // Register task completion event for web client synchronization
          recentTaskCompletionEvents.push({
            id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            taskTitle: taskIdentifier,
            status: 'completada',
            timestamp: new Date().toISOString(),
            userId,
          });

          const praiseMessage = `🎉 *¡Excelente trabajo, ${cqFrom}!*
          
✅ He marcado tu compromiso *"${taskIdentifier}"* como *COMPLETADA* en tu tablero de LifeGlow.
          
💪 _"La constancia en los pequeños bloques diarios es lo que construye grandes resultados. ¡Sigue con esa gran energía!"_`;

          if (token && cqChatId) {
            await sendTelegramMessage(token, cqChatId, praiseMessage);
          }
          return res.json({ ok: true });
        }

        if (cqData.startsWith('TASK_NOT_DONE:')) {
          const taskIdentifier = cqData.replace('TASK_NOT_DONE:', '').trim();

          // Set stage to awaiting reason
          pendingUserFollowups.set(String(cqChatId), {
            taskTitle: taskIdentifier,
            category: 'salud_deporte',
            askedAt: Date.now(),
            userId,
            stage: 'awaiting_reason_no',
          });

          const askWhyMessage = `Entendido, ${cqFrom}. No te preocupes, a todos se nos presentan imprevistos.

🤔 *Cuéntame brevemente: ¿Por qué no pudiste hacerla?*
_(Ej: "Me quedé sin tiempo", "No tenía energía", "Tuve una reunión de última hora" o "Se me pasó la hora")_

💬 _Escríbeme tu motivo aquí para que juntos podamos ajustar tu horario o reprogramarla._`;

          if (token && cqChatId) {
            await sendTelegramMessage(token, cqChatId, askWhyMessage);
          }
          return res.json({ ok: true });
        }

        return res.json({ ok: true });
      }

      const message = update?.message || update?.edited_message || update?.channel_post;
      if (!message || !message.chat) {
        return res.json({ ok: true, ignored: true });
      }

      const chatId = message.chat.id;
      const fromFirstName = (message.from?.first_name || '').trim();
      const fromLastName = (message.from?.last_name || '').trim();
      const fromUsername = (message.from?.username || '').trim();
      const username = fromFirstName ? `${fromFirstName}${fromLastName ? ' ' + fromLastName : ''}` : (fromUsername || 'Usuario');
      const text = (message.text || message.caption || '').trim();

      // Detect if sender is Liz (wife/partner)
      const isLizExplicitName =
        fromFirstName.toLowerCase().includes('liz') ||
        fromFirstName.toLowerCase().includes('elizabeth') ||
        fromUsername.toLowerCase().includes('liz') ||
        fromUsername.toLowerCase().includes('elizabeth');
      const isLizCommand = text.toLowerCase().startsWith('/soyliz');
      const isLizSavedChat = Boolean(partnerConfig.partnerChatId && String(partnerConfig.partnerChatId) === String(chatId));

      const isLiz = isLizExplicitName || isLizCommand || isLizSavedChat;

      // Automatically sync partner config and subscriber records
      if (isLiz) {
        partnerConfig.partnerChatId = chatId;
        partnerConfig.partnerName = fromFirstName || 'Liz';
        if (fromUsername) partnerConfig.partnerUsername = fromUsername;
        partnerConfig.lastUpdated = new Date().toISOString();
        savePartnerConfigToDisk();
      } else {
        partnerConfig.ownerChatId = chatId;
        partnerConfig.ownerName = fromFirstName || 'Miguel';
        if (fromUsername) partnerConfig.ownerUsername = fromUsername;
        partnerConfig.lastUpdated = new Date().toISOString();
        savePartnerConfigToDisk();
      }

      // Automatically register user's Chat ID for proactive reminders
      telegramSubscribers.set(String(chatId), {
        chatId,
        username,
        token,
        lastActive: new Date().toISOString(),
      });
      if (userId) {
        telegramSubscribers.set(String(userId), {
          chatId,
          username,
          token,
          lastActive: new Date().toISOString(),
        });
      }

      // Handle Slash Commands for Partner / Couple Mode
      if (text.startsWith('/pareja') || text.startsWith('/configurar_pareja') || text.startsWith('/esposa')) {
        const parejaMsg = `💑 *Configuración Modo Pareja en LifeGlow:*

👤 *Miguel:* ${partnerConfig.ownerUsername ? '@' + partnerConfig.ownerUsername : partnerConfig.ownerName} ${partnerConfig.ownerChatId ? '✅ Conectado' : '⏳ Pendiente'}
💜 *Liz:* ${partnerConfig.partnerUsername ? '@' + partnerConfig.partnerUsername : partnerConfig.partnerName} ${partnerConfig.partnerChatId ? '✅ Conectada' : '⏳ Pendiente'}

✨ *Funcionalidades activas:*
1. 💜 *Tareas Asignadas:* Cuando Liz escribe o envía audios con tareas o pendientes, se marcan como *"Asignado por Liz 💜"*, se agendan en el Calendario de Miguel y le llega un aviso instantáneo a su chat.
2. ⏰ *Recordatorios Precisos:* 10 minutos antes de la hora programada se enviará el recordatorio a Miguel sin adelantarse ni repetirse.
3. 🔔 *Seguimiento:* Al finalizar el horario, el bot pregunta si se completó.

💬 *Comandos rápidos:*
• \`/soyliz\` - Registra este chat como el de Liz.
• \`/soymiguel\` - Registra este chat como el de Miguel.`;
        if (token) {
          await sendTelegramMessage(token, chatId, parejaMsg);
          return res.json({ ok: true });
        }
        return res.json({ method: 'sendMessage', chat_id: chatId, text: parejaMsg, parse_mode: 'Markdown' });
      }

      if (text.startsWith('/soyliz')) {
        partnerConfig.partnerChatId = chatId;
        partnerConfig.partnerName = fromFirstName || 'Liz';
        if (fromUsername) partnerConfig.partnerUsername = fromUsername;
        partnerConfig.lastUpdated = new Date().toISOString();
        savePartnerConfigToDisk();
        const msg = `💜 *¡Hola Liz! Tu chat ha sido configurado como Pareja en LifeGlow.*
        
A partir de ahora, cada tarea, recordatorio o pendiente que me escribas o me envíes por nota de voz se guardará en el calendario de Miguel con tu etiqueta *"Asignado por Liz 💜"* y le avisaré directamente a él en su chat. ¡Un gusto ayudarte!`;
        if (token) {
          await sendTelegramMessage(token, chatId, msg);
          return res.json({ ok: true });
        }
        return res.json({ method: 'sendMessage', chat_id: chatId, text: msg, parse_mode: 'Markdown' });
      }

      if (text.startsWith('/soymiguel')) {
        partnerConfig.ownerChatId = chatId;
        partnerConfig.ownerName = fromFirstName || 'Miguel';
        if (fromUsername) partnerConfig.ownerUsername = fromUsername;
        partnerConfig.lastUpdated = new Date().toISOString();
        savePartnerConfigToDisk();
        const msg = `👤 *¡Hola Miguel! Tu chat ha sido configurado como el usuario principal de LifeGlow.*
        
Recibirás aquí todas tus notificaciones y los avisos cuando Liz te asigne una nueva tarea.`;
        if (token) {
          await sendTelegramMessage(token, chatId, msg);
          return res.json({ ok: true });
        }
        return res.json({ method: 'sendMessage', chat_id: chatId, text: msg, parse_mode: 'Markdown' });
      }

      // Check if user is responding to an active Follow-up question (Stage 1: Yes/No, or Stage 2: Reason)
      const pendingFollowup = pendingUserFollowups.get(String(chatId));
      if (pendingFollowup && text) {
        const lowerText = text.toLowerCase().trim();

        if (pendingFollowup.stage === 'awaiting_yes_no') {
          const isAffirmative = lowerText.includes('si') || lowerText.includes('sí') || lowerText.includes('hecho') || lowerText.includes('listo') || lowerText.includes('claro') || lowerText.includes('completada') || lowerText.includes('terminada');
          const isNegative = lowerText.includes('no') || lowerText.includes('nop') || lowerText.includes('pude') || lowerText.includes('olvid');

          if (isAffirmative) {
            pendingUserFollowups.delete(String(chatId));

            recentTaskCompletionEvents.push({
              id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
              taskId: pendingFollowup.taskId,
              taskTitle: pendingFollowup.taskTitle,
              status: 'completada',
              timestamp: new Date().toISOString(),
              userId: pendingFollowup.userId || userId,
            });

            const praiseMessage = `🎉 *¡Felicidades, ${username}!*
            
✅ Acabo de marcar tu compromiso *"${pendingFollowup.taskTitle}"* como *COMPLETADA* en LifeGlow.

🌟 _¡Suma victorias diarias! Estás construyendo hábitos sólidos y consistentes._`;

            if (token) {
              await sendTelegramMessage(token, chatId, praiseMessage);
              return res.json({ ok: true });
            }
            return res.json({ method: 'sendMessage', chat_id: chatId, text: praiseMessage, parse_mode: 'Markdown' });
          } else if (isNegative) {
            pendingFollowup.stage = 'awaiting_reason_no';
            pendingUserFollowups.set(String(chatId), pendingFollowup);

            const askReasonMsg = `Comprendo perfectamente, ${username}. No pasa nada, lo importante es no perder el foco.

🤔 *¿Qué te impidió realizar "${pendingFollowup.taskTitle}"?*
_(Escríbeme el motivo para ayudarte a resolverlo o reprogramarlo en un horario más conveniente)_`;

            if (token) {
              await sendTelegramMessage(token, chatId, askReasonMsg);
              return res.json({ ok: true });
            }
            return res.json({ method: 'sendMessage', chat_id: chatId, text: askReasonMsg, parse_mode: 'Markdown' });
          }
        } else if (pendingFollowup.stage === 'awaiting_reason_no') {
          // User supplied their reason for not doing it! Give smart AI empathetic coaching feedback
          pendingUserFollowups.delete(String(chatId));

          recentTaskCompletionEvents.push({
            id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            taskId: pendingFollowup.taskId,
            taskTitle: pendingFollowup.taskTitle,
            status: 'pendiente',
            reasonIfNotCompleted: text,
            timestamp: new Date().toISOString(),
            userId: pendingFollowup.userId || userId,
          });

          // Generate supportive coaching response with Gemini
          let coachingTip = `Gracias por compartirlo. Anoté tu observación ("${text}") para ayudarte a mejorar la planificación. Mañana será una gran oportunidad para retomar con más fuerza.`;
          const ai = getGeminiClient();
          if (ai) {
            try {
              const coachPrompt = `El usuario no pudo completar su compromiso programado: "${pendingFollowup.taskTitle}".
Motivo dado por el usuario: "${text}".
Eres el asistente empático y motivador de LifeGlow.
Escribe un mensaje breve en español (máximo 3 párrafos cortos) donde:
1. Valides con empatía su motivo (sin regañarlo).
2. Le des un consejo práctico y constructivo para superar ese obstáculo la próxima vez o reprogramarlo.
3. Le des una frase de ánimo motivadora.
Usa emojis amigables.`;
              const cResp = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: coachPrompt,
              });
              if (cResp && cResp.text) {
                coachingTip = cResp.text.trim();
              }
            } catch (coachErr) {
              console.warn('Coaching AI generation error:', coachErr);
            }
          }

          const responseMsg = `📋 *Anotado en tus reflexiones de LifeGlow:*

${coachingTip}

💡 _Tu tarea sigue disponible en tu tablero para cuando decidas reactivarla o reprogramarla._`;

          if (token) {
            await sendTelegramMessage(token, chatId, responseMsg);
            return res.json({ ok: true });
          }
          return res.json({ method: 'sendMessage', chat_id: chatId, text: responseMsg, parse_mode: 'Markdown' });
        }
      }

      // Handle Slash Commands
      if (text.startsWith('/monto') || text.startsWith('/corregir') || text.startsWith('/valor')) {
        const rawArg = text.replace(/^\/(?:monto|corregir|valor)\s*/i, '').trim();
        const parsedAmount = parseRawFinancialAmount(rawArg);

        if (parsedAmount > 0) {
          // Find the most recent expense from incomingWebhookExpenses
          let targetExpense = incomingWebhookExpenses.find(e => !userId || e.userId === userId);
          if (!targetExpense && incomingWebhookExpenses.length > 0) {
            targetExpense = incomingWebhookExpenses[0];
          }

          if (targetExpense) {
            targetExpense.amount = parsedAmount;
            targetExpense.updatedAt = new Date().toISOString().split('T')[0];

            const successMsg = `✅ *¡Monto actualizado con éxito!*

🧾 *Gasto / Establecimiento:* ${targetExpense.name}
💰 *Nuevo Total:* $${parsedAmount.toLocaleString('es-CO')} COP
📅 *Fecha:* Día ${targetExpense.dayOfMonth} (${targetExpense.assignedQuincena === 'quincena_1' ? '1ra Quincena' : '2da Quincena'})

✨ _El cambio ya quedó registrado en tus Gastos Adicionales de LifeGlow._`;

            if (token) {
              await sendTelegramMessage(token, chatId, successMsg);
              return res.json({ ok: true });
            }
            return res.json({ method: 'sendMessage', chat_id: chatId, text: successMsg, parse_mode: 'Markdown' });
          } else {
            // Create a new expense record directly with this amount
            const newExp: IncomingExtraExpense = {
              id: `ext-exp-manual-${Date.now()}`,
              source: `Telegram @${username} (/monto)`,
              rawText: text,
              userId: userId || undefined,
              name: 'Gasto Registrado',
              category: 'otro',
              amount: parsedAmount,
              dayOfMonth: new Date().getDate(),
              date: new Date().toISOString().split('T')[0],
              assignedQuincena: new Date().getDate() <= 15 ? 'quincena_1' : 'quincena_2',
              isPaid: true,
              paidBy: 'Miguel',
              paymentMethod: 'Tarjeta de Crédito',
              receiptNotes: 'Anotado manualmente con comando /monto',
              createdAt: new Date().toISOString().split('T')[0],
              updatedAt: new Date().toISOString().split('T')[0],
            };

            incomingWebhookExpenses.unshift(newExp);
            if (incomingWebhookExpenses.length > 80) incomingWebhookExpenses.pop();
            saveIncomingWebhooksToDisk();

            const successMsg = `🧾 *¡Gasto registrado con éxito!*

💰 *Monto:* $${parsedAmount.toLocaleString('es-CO')} COP
📅 *Quincena:* ${newExp.assignedQuincena === 'quincena_1' ? '1ra Quincena' : '2da Quincena'}

✨ _Sumado a tus Gastos Adicionales en Finanzas de LifeGlow._`;

            if (token) {
              await sendTelegramMessage(token, chatId, successMsg);
              return res.json({ ok: true });
            }
            return res.json({ method: 'sendMessage', chat_id: chatId, text: successMsg, parse_mode: 'Markdown' });
          }
        } else {
          const helpMontoMsg = `ℹ️ *Cómo usar el comando /monto:*
Escribe \`/monto 8200\` o \`/corregir 8200\` para ajustar de inmediato el valor de tu último recibo registrado.`;
          if (token) {
            await sendTelegramMessage(token, chatId, helpMontoMsg);
            return res.json({ ok: true });
          }
          return res.json({ method: 'sendMessage', chat_id: chatId, text: helpMontoMsg, parse_mode: 'Markdown' });
        }
      }

      // Explicit slash commands for Habits with Interactive Buttons
      if (text.startsWith('/habitos') || text.startsWith('/rutinas')) {
        const habitsQuery: DetectedQuery = { isQuery: true, intent: 'habits_summary', queryPrompt: text };
        const reply = await handleUserQueryResponse(habitsQuery, fromFirstName || username, userId, chatId);
        if (token) {
          await sendTelegramMessage(token, chatId, reply.text, reply.replyMarkup);
          return res.json({ ok: true });
        }
        return res.json({ method: 'sendMessage', chat_id: chatId, text: reply.text, parse_mode: 'Markdown', reply_markup: reply.replyMarkup });
      }

      // Explicit slash commands for Daily Agenda
      if (text.startsWith('/hoy') || text.startsWith('/agenda') || text.startsWith('/resumen')) {
        const agendaQuery: DetectedQuery = { isQuery: true, intent: 'daily_summary', queryPrompt: text };
        const reply = await handleUserQueryResponse(agendaQuery, fromFirstName || username, userId, chatId);
        if (token) {
          await sendTelegramMessage(token, chatId, reply.text, reply.replyMarkup);
          return res.json({ ok: true });
        }
        return res.json({ method: 'sendMessage', chat_id: chatId, text: reply.text, parse_mode: 'Markdown', reply_markup: reply.replyMarkup });
      }

      // Explicit slash commands for Pending Tasks
      if (text.startsWith('/tareas') || text.startsWith('/pendientes')) {
        const tasksQuery: DetectedQuery = { isQuery: true, intent: 'pending_tasks', queryPrompt: text };
        const reply = await handleUserQueryResponse(tasksQuery, fromFirstName || username, userId, chatId);
        if (token) {
          await sendTelegramMessage(token, chatId, reply.text, reply.replyMarkup);
          return res.json({ ok: true });
        }
        return res.json({ method: 'sendMessage', chat_id: chatId, text: reply.text, parse_mode: 'Markdown', reply_markup: reply.replyMarkup });
      }

      // Slash command for Partner Config (/pareja_config [nombre] [chatId])
      if (text.startsWith('/pareja_config') || text.startsWith('/config_pareja')) {
        const parts = text.split(/\s+/).slice(1);
        if (parts.length >= 1) {
          if (parts[0]) partnerConfig.partnerName = parts[0];
          if (parts[1] && !isNaN(Number(parts[1]))) partnerConfig.partnerChatId = Number(parts[1]);
          partnerConfig.lastUpdated = new Date().toISOString();
          savePartnerConfigToDisk();
        }
        const cfgMsg = `💑 *Configuración de Pareja en LifeGlow:*
👤 *Titular:* ${partnerConfig.ownerName} (${partnerConfig.ownerChatId || 'Sin vincular'})
💜 *Pareja:* ${partnerConfig.partnerName} (${partnerConfig.partnerChatId || 'Sin vincular'})

💬 *Comandos rápidos:*
• \`/soyliz\` - Vincular este chat como el de ${partnerConfig.partnerName}
• \`/soymiguel\` - Vincular este chat como el de ${partnerConfig.ownerName}
• \`/pareja_config [nombre] [chatId]\` - Ajustar manualmente`;
        if (token) {
          await sendTelegramMessage(token, chatId, cfgMsg);
          return res.json({ ok: true });
        }
        return res.json({ method: 'sendMessage', chat_id: chatId, text: cfgMsg, parse_mode: 'Markdown' });
      }

      if (text.startsWith('/start') || text.startsWith('/help') || text.startsWith('/ayuda')) {
        const welcomeMessage = `👋 *¡Hola, ${message.from?.first_name || 'amigo'}! Soy tu Asistente Inteligente de LifeGlow* 🚀

Envíame cualquier idea, tarea, mantenimiento de tu auto o meta en:
• ✍️ **Texto**
• 🎙️ **Nota de voz**
• 📸 **Foto** (Sticker de cambio de aceite, factura de taller, receta, recibo o nota)

Gemini IA extraerá los datos automáticamente y los organizará en tus bloques de vida.

💡 *Ejemplos de lo que puedes enviarme:*
• 🚗 _"Cambio de aceite y filtro de aire a los 40.000 km"_
• 📸 _[Foto del recibo de compra o ticket de supermercado]_
• 💬 _"8200"_ (o acompaña la foto con el monto en el pie de foto)
• 🏃‍♂️ _"Rutina de running 5km los martes y jueves a las 7am"_
• 🧹 _"Limpiar la casa y organizar la sala hoy a las 4pm"_

✨ *Comandos Rápidos:*
• \`/habitos\` - Ver y marcar hábitos con botones interactivos 🔥
• \`/hoy\` o \`/agenda\` - Ver tu resumen del día y compromisos
• \`/tareas\` - Listar compromisos pendientes
• \`/pareja\` - Configurar modo pareja con Liz 💜
• \`/soyliz\` - Identificar este chat como Liz
• \`/soymiguel\` - Identificar este chat como Miguel
• \`/monto 8200\` - Corregir o registrar valor de factura al instante
• \`/status\` - Ver estado de conexión con LifeGlow
• \`/help\` - Ver esta ayuda`;

        if (token) {
          await sendTelegramMessage(token, chatId, welcomeMessage);
          return res.json({ ok: true });
        }
        return res.json({
          method: 'sendMessage',
          chat_id: chatId,
          text: welcomeMessage,
          parse_mode: 'Markdown',
        });
      }

      if (text.startsWith('/status') || text.startsWith('/estado')) {
        const statusMessage = `🟢 *Conexión Activa con LifeGlow*
✅ El servidor está sincronizado y listo para procesar tus ideas, notas de voz y fotos con Visión IA en tiempo real.`;
        if (token) {
          await sendTelegramMessage(token, chatId, statusMessage);
          return res.json({ ok: true });
        }
        return res.json({
          method: 'sendMessage',
          chat_id: chatId,
          text: statusMessage,
          parse_mode: 'Markdown',
        });
      }

      if (text.startsWith('/categories') || text.startsWith('/colecciones') || text.startsWith('/categorias')) {
        const categoriesList = Object.entries(CATEGORY_LABELS)
          .map(([k, v]) => `${CATEGORY_EMOJIS[k] || '📁'} *${v}*`)
          .join('\n');
        const catMessage = `📂 *Colecciones Disponibles en LifeGlow:*\n\n${categoriesList}\n\n_Cualquier mensaje, audio o foto que envíes se clasificará automáticamente en una de ellas._`;

        if (token) {
          await sendTelegramMessage(token, chatId, catMessage);
          return res.json({ ok: true });
        }
        return res.json({
          method: 'sendMessage',
          chat_id: chatId,
          text: catMessage,
          parse_mode: 'Markdown',
        });
      }

      // Handle Photos / Images (Sticker of oil change, invoices, receipts, notes)
      const hasPhoto = message.photo && Array.isArray(message.photo) && message.photo.length > 0;
      const hasDocImage = message.document && message.document.mime_type?.startsWith('image/');

      if (hasPhoto || hasDocImage) {
        const photoFileId = hasPhoto
          ? message.photo[message.photo.length - 1].file_id // Get highest resolution
          : message.document.file_id;

        const photoMime = hasDocImage ? message.document.mime_type : 'image/jpeg';
        const captionText = (message.caption || '').trim();

        if (token && photoFileId) {
          try {
            const fileInfoResp = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${photoFileId}`);
            const fileInfoData = await fileInfoResp.json();

            if (fileInfoData.ok && fileInfoData.result?.file_path) {
              const fileUrl = `https://api.telegram.org/file/bot${token}/${fileInfoData.result.file_path}`;
              const imgResp = await fetch(fileUrl);
              const arrayBuf = await imgResp.arrayBuffer();
              const buffer = Buffer.from(arrayBuf);

              const visionResult = await processImageWithGeminiVision(
                buffer,
                photoMime,
                captionText,
                `Telegram @${username}`,
                userId
              );

              let replyText = '';
              if (visionResult.isExtraExpense && visionResult.newExpenseRecord) {
                const exp = visionResult.newExpenseRecord;
                replyText = `🧾 *¡Factura procesada con Visión IA!*

${visionResult.expenseCategoryEmoji} *Sección:* Finanzas & Hogar (Gastos Adicionales)
🏪 *Establecimiento / Concepto:* ${exp.name}
💰 *Monto Total Extraído:* $${Number(exp.amount).toLocaleString('es-CO')} COP
✅ *Estado:* ${exp.isPaid ? 'Pagado' : 'Pendiente'}
👤 *Pagado por:* ${exp.paidBy || 'Miguel'} (${exp.paymentMethod || 'Tarjeta'})
📅 *Día:* ${exp.dayOfMonth} (${exp.assignedQuincena === 'quincena_1' ? '1ra Quincena' : '2da Quincena'})

✨ _Se ha sumado automáticamente a tus Gastos Adicionales en Finanzas de LifeGlow._`;
              } else if (visionResult.isBook || visionResult.structuredIdea.categoryId === 'aprendizaje' || visionResult.structuredIdea.categoryId === 'aprendizaje_habilidades' || visionResult.structuredIdea.type === 'libro') {
                const book = visionResult.structuredIdea;
                replyText = `📚 *¡Libro Identificado con Visión IA!*

📖 *Título:* ${book.title}
✍️ *Autor:* ${book.author || 'Autor identificado'}
🏷️ *Categoría / Género:* ${book.genre || 'Desarrollo Personal / No Ficción'}
📄 *Páginas:* ${book.totalPages ? `${book.totalPages} págs` : 'Estimadas ~250 págs'}
💡 *De qué trata / Sinopsis:*
${book.description}

✨ _¡Guardado automáticamente en tu colección de Aprendizaje & Habilidades y en tu Biblioteca de Lectura (Por Leer / Lista de Deseos)!_`;
              } else if (visionResult.structuredIdea.categoryId === 'ocio_entretenimiento' || visionResult.structuredIdea.type === 'pelicula' || visionResult.structuredIdea.type === 'serie' || visionResult.structuredIdea.type === 'videojuego' || visionResult.structuredIdea.type === 'anime') {
                const media = visionResult.structuredIdea;
                const typeLabel = media.type === 'serie' ? 'Serie de TV 📺' : media.type === 'videojuego' ? 'Videojuego 🎮' : media.type === 'anime' ? 'Anime 🎌' : 'Película 🎬';
                replyText = `🎬 *¡Contenido de Entretenimiento Identificado con Visión IA!*

🍿 *Título:* ${media.title}
📺 *Tipo:* ${typeLabel}
🌐 *Plataforma:* ${media.platform || 'Streaming / Cine'}
🏷️ *Género:* ${media.genre || 'Cine'}
📝 *Sinopsis / Detalles:*
${media.description}

✨ _Guardada automáticamente en tu colección de Ocio & Entretenimiento y en tu lista de Películas por Ver (Entertainment Hub)._`;
              } else {
                replyText = `📸 *Foto analizada con Visión IA (Gemini):*
${visionResult.categoryEmoji} *Colección:* ${visionResult.readableCategory}
🎯 *Título:* ${visionResult.structuredIdea.title}
📝 *Datos Extraídos:*
${visionResult.structuredIdea.description}

✅ *¡Registro guardado con éxito en LifeGlow!*`;

                if (visionResult.extractedSummary) {
                  replyText += `\n\n🔍 *Resumen Clave:*\n${visionResult.extractedSummary}`;
                }

                replyText += `\n\n✨ _Ya está sincronizado en tu tablero y colecciones._`;
              }

              await sendTelegramMessage(token, chatId, replyText);
              return res.json({ ok: true });
            }
          } catch (photoErr) {
            console.error('Error processing Telegram photo message:', photoErr);
          }
        }

        // Fallback if token/download not available
        const fallbackResult = await processIdeaWithGemini(
          captionText || 'Foto o comprobante recibido en Telegram',
          `Telegram @${username} (Foto)`,
          userId
        );
        let replyText = `📸 *Foto recibida en Telegram*
✅ Guardada en ${fallbackResult.categoryEmoji} *${fallbackResult.readableCategory}*`;
        if (fallbackResult.isExtraExpense && fallbackResult.newExpenseRecord) {
          const exp = fallbackResult.newExpenseRecord;
          replyText = `🧾 *Factura Recibida:* ${exp.name} por $${Number(exp.amount).toLocaleString('es-CO')} COP (Pagado) en Gastos Adicionales.`;
        }
        if (token) {
          await sendTelegramMessage(token, chatId, replyText);
          return res.json({ ok: true });
        }
        return res.json({ method: 'sendMessage', chat_id: chatId, text: replyText, parse_mode: 'Markdown' });
      }

      // Handle Voice Note / Audio
      if (message.voice || message.audio) {
        const voiceObj = message.voice || message.audio;
        let transcriptionText = '';

        if (token && voiceObj.file_id) {
          try {
            // 1. Get file path from Telegram
            const fileInfoResp = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${voiceObj.file_id}`);
            const fileInfoData = await fileInfoResp.json();

            if (fileInfoData.ok && fileInfoData.result?.file_path) {
              const fileUrl = `https://api.telegram.org/file/bot${token}/${fileInfoData.result.file_path}`;
              const audioResp = await fetch(fileUrl);
              const arrayBuf = await audioResp.arrayBuffer();
              const buffer = Buffer.from(arrayBuf);

              const voiceResult = await transcribeAndProcessVoiceAudio(
                buffer,
                voiceObj.mime_type || 'audio/ogg',
                isLiz ? 'Telegram (Liz)' : `Telegram @${username}`,
                userId,
                isLiz ? 'Liz' : undefined
              );

              transcriptionText = voiceResult.transcription;

              // If voice note was an inquiry or asking for daily summary, reply directly
              const voiceQueryCheck = detectUserQueryIntent(transcriptionText);
              if (voiceQueryCheck.isQuery) {
                const summaryReply = await handleUserQueryResponse(
                  voiceQueryCheck,
                  username,
                  userId,
                  chatId
                );
                await sendTelegramMessage(token, chatId, `🎙️ *Voz procesada:* "${transcriptionText}"\n\n${summaryReply.text}`, summaryReply.replyMarkup);
                return res.json({ ok: true });
              }

              let replyText = '';
              if (voiceResult.isDirectTask && voiceResult.newTaskRecord) {
                // Ensure assignedBy and partner fields
                if (isLiz) {
                  voiceResult.newTaskRecord.assignedBy = 'Liz';
                  voiceResult.newTaskRecord.assignedTo = 'Miguel';
                  voiceResult.newTaskRecord.tags = ['Asignado por Liz', 'pareja', 'hogar', 'telegram'];
                }

                const taskAssignedDate = voiceResult.structuredResult.assignedDate;
                const taskTimeSlot = voiceResult.structuredResult.timeSlot;
                const taskTitle = voiceResult.structuredResult.title;

                try {
                  const eventMs = parseLocalDateTimeMs(taskAssignedDate, taskTimeSlot);
                  if (!isNaN(eventMs)) {
                    const preAlertMs = eventMs - 10 * 60 * 1000;
                    const estimatedMinutes = Math.round((voiceResult.structuredResult.estimatedHours || 1) * 60);
                    const postCheckMs = eventMs + (estimatedMinutes + 10) * 60 * 1000;

                    const reminderChatId = isLiz && partnerConfig.ownerChatId ? partnerConfig.ownerChatId : chatId;

                    if (preAlertMs > Date.now()) {
                      registerScheduledReminder({
                        id: `rem-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                        taskId: voiceResult.newTaskRecord.id,
                        userId,
                        chatId: reminderChatId,
                        token,
                        title: taskTitle,
                        category: voiceResult.structuredResult.categoryId,
                        scheduledTime: preAlertMs,
                        eventTime: taskTimeSlot,
                        eventDate: taskAssignedDate,
                        sent: false,
                        type: 'task',
                        advanceMinutes: 10,
                        assignedBy: isLiz ? 'Liz' : undefined,
                      });
                    }

                    if (postCheckMs > Date.now()) {
                      registerScheduledReminder({
                        id: `fol-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                        taskId: voiceResult.newTaskRecord.id,
                        userId,
                        chatId: reminderChatId,
                        token,
                        title: taskTitle,
                        category: voiceResult.structuredResult.categoryId,
                        scheduledTime: postCheckMs,
                        eventTime: taskTimeSlot,
                        eventDate: taskAssignedDate,
                        sent: false,
                        type: 'followup_check',
                        afterMinutes: 10,
                        assignedBy: isLiz ? 'Liz' : undefined,
                      });
                    }
                  }
                } catch (e) {
                  console.warn('Error scheduling voice reminders:', e);
                }

                let gcalVoiceNotice = '';
                if (voiceResult.newTaskRecord.assignedDate) {
                  try {
                    const gcalRes = await syncTaskToGoogleCalendarOnServer(voiceResult.newTaskRecord, userId);
                    if (gcalRes.success) {
                      voiceResult.newTaskRecord.gcalSynced = true;
                      voiceResult.newTaskRecord.gcalEventId = gcalRes.eventId;
                      saveIncomingWebhooksToDisk();
                      gcalVoiceNotice = '\n🗓️ *Google Calendar:* ✅ ¡Evento creado en tu Google Calendar con alarma 10 min antes!';
                    } else if (gcalRes.error === 'TOKEN_EXPIRED') {
                      voiceResult.newTaskRecord.gcalSynced = false;
                      gcalVoiceNotice = '\n🗓️ *Google Calendar:* ⚠️ La sesión de Google venció. Abre LifeBlocks y pulsa *"Vincular Google Cal"* para reconectar.';
                    } else if (gcalRes.error === 'NO_TOKEN') {
                      voiceResult.newTaskRecord.gcalSynced = false;
                      gcalVoiceNotice = '\n🗓️ *Google Calendar:* ⚠️ Vinculación pendiente. Abre LifeBlocks y pulsa *"Vincular Google Cal"* para sincronizar este evento.';
                    }
                  } catch (gcalErr) {
                    console.warn('[Telegram Voice] GCal sync error:', gcalErr);
                  }
                }

                if (isLiz) {
                  replyText = `🎙️ *Nota de voz de Liz:* "${transcriptionText}"

💜 *¡Tarea agendada para Miguel en LifeGlow!*
${voiceResult.categoryEmoji} *Colección:* ${voiceResult.readableCategory}
📋 *Compromiso:* ${voiceResult.structuredResult.title}
🗓️ *Fecha:* ${voiceResult.structuredResult.assignedDate}
⏰ *Hora:* ${voiceResult.structuredResult.timeSlot}
⏱️ *Duración:* ${voiceResult.structuredResult.estimatedHours}h
${gcalVoiceNotice}

🔔 *Alertas automáticas activadas:*
• ⏰ *10 min antes:* Le avisaré a Miguel a su chat.
• 🔔 *10 min después:* Le preguntaré si la completó.

✨ _Ya aparece en el Calendario de Miguel y le envié un aviso directo a su chat._ 💑`;

                  // Also notify Miguel if his chat is registered
                  if (partnerConfig.ownerChatId && String(partnerConfig.ownerChatId) !== String(chatId) && token) {
                    const partnerAlert = `💜 *¡Notificación de Pareja: Liz te acaba de programar una tarea por voz!*

${voiceResult.categoryEmoji} *Colección:* ${voiceResult.readableCategory}
📋 *Compromiso:* ${voiceResult.structuredResult.title}
🗓️ *Fecha:* ${voiceResult.structuredResult.assignedDate}
⏰ *Hora:* ${voiceResult.structuredResult.timeSlot}
⏱️ *Duración:* ${voiceResult.structuredResult.estimatedHours}h
🎙️ _"${transcriptionText}"_
${gcalVoiceNotice}

✨ _Ya quedó registrada en tu Calendario y lista de Pendientes de LifeGlow._`;
                    sendTelegramMessage(token, partnerConfig.ownerChatId, partnerAlert).catch(() => {});
                  }
                } else {
                  replyText = `🎙️ *Nota de voz procesada:*
"${transcriptionText}"

📅 *¡Tarea y Recordatorio programado en tu Calendario!*
${voiceResult.categoryEmoji} *Colección:* ${voiceResult.readableCategory}
🎯 *Compromiso:* ${voiceResult.structuredResult.title}
🗓️ *Fecha:* ${voiceResult.structuredResult.assignedDate}
⏰ *Hora:* ${voiceResult.structuredResult.timeSlot}
⏱️ *Estimado:* ${voiceResult.structuredResult.estimatedHours}h
${gcalVoiceNotice}

🔔 *Alertas automáticas activas:*
• ⏰ *10 min antes:* Te avisaré para arrancar a tiempo.
• 🔔 *10 min después:* Te preguntaré si la completaste con botones [Sí / No].

✨ _Ya aparece reflejada en tu Calendario de LifeGlow._`;
                }
              } else {
                replyText = `🎙️ *Nota de voz procesada:*
"${transcriptionText}"

💡 *¡Idea guardada en LifeGlow!*
${voiceResult.categoryEmoji} *Colección:* ${voiceResult.readableCategory}
🎯 *Título:* ${voiceResult.structuredIdea.title}
⏱️ *Estimación:* ${voiceResult.structuredIdea.estimatedHours}h (${voiceResult.structuredIdea.dailyHours}h/día)
📝 *Contexto:* ${voiceResult.structuredIdea.description}

✨ _Ya está sincronizada en tus ideas y metas de LifeGlow._`;
              }

              await sendTelegramMessage(token, chatId, replyText);
              return res.json({ ok: true });
            }
          } catch (audioErr) {
            console.error('Error processing Telegram voice message:', audioErr);
          }
        }

        // Fallback for voice if token/download wasn't possible
        const fallbackResult = await processIdeaWithGemini('Nota de voz recibida desde Telegram', `Telegram @${username}`, userId);
        const replyText = `🎙️ *Nota de voz recibida*
✅ Guardada en ${fallbackResult.categoryEmoji} *${fallbackResult.readableCategory}*`;
        if (token) {
          await sendTelegramMessage(token, chatId, replyText);
          return res.json({ ok: true });
        }
        return res.json({ method: 'sendMessage', chat_id: chatId, text: replyText, parse_mode: 'Markdown' });
      }

      // Handle Standard Text Message
      if (text) {
        // Check if user is reporting a habit as done in natural language (e.g. "ya hice el hábito de caminar", "flexiones listas", "cumplí el hábito de leer")
        const currentAgenda = (userId ? userAgendaStore.get(userId) : null) || lastKnownGlobalAgenda || userAgendaStore.get('default') || Array.from(userAgendaStore.values())[0] || null;
        if (currentAgenda && Array.isArray(currentAgenda.habits) && currentAgenda.habits.length > 0) {
          const habitMatch = detectHabitCompletionIntent(text, currentAgenda.habits);
          if (habitMatch.isHabitDone && habitMatch.matchedHabit) {
            const h = habitMatch.matchedHabit;
            h.completedToday = true;
            h.streak = (h.streak || 0) + 1;
            saveAgendaStoreToDisk();

            const todayStr = new Date().toISOString().split('T')[0];
            recentHabitCompletionEvents.push({
              id: `evt-h-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
              habitId: h.id,
              habitTitle: h.title,
              completedDate: todayStr,
              timestamp: new Date().toISOString(),
              userId: currentAgenda.userId || userId,
              newStreak: h.streak,
            });

            const remainingPending = currentAgenda.habits.filter(hab => !hab.completedToday);
            const remainingButtons = remainingPending.slice(0, 5).map(hab => ([
              {
                text: `✅ Hecho: ${hab.icon || '🔥'} ${hab.title}`,
                callback_data: `HABIT_DONE:${hab.id}`,
              }
            ]));

            const habitDoneReply = `🎉 *¡Excelente logro, ${username}!*

✅ He marcado tu hábito *"${h.icon || '🔥'} ${h.title}"* como *COMPLETADO* hoy en tu tablero de LifeGlow.
🔥 *Tu racha actual:* *${h.streak} día(s) consecutivos*.

${remainingButtons.length > 0 ? `_Aún tienes ${remainingButtons.length} hábito(s) pendientes hoy:_` : `🏆 *¡Has completado todos tus hábitos de hoy!*`}`;

            if (token) {
              await sendTelegramMessage(token, chatId, habitDoneReply, remainingButtons.length > 0 ? { inline_keyboard: remainingButtons } : undefined);
              return res.json({ ok: true });
            }
            const payload: any = { method: 'sendMessage', chat_id: chatId, text: habitDoneReply, parse_mode: 'Markdown' };
            if (remainingButtons.length > 0) payload.reply_markup = { inline_keyboard: remainingButtons };
            return res.json(payload);
          }
        }

        // Intercept questions, daily summary, habits, or agenda inquiries
        const queryCheck = detectUserQueryIntent(text);
        if (queryCheck.isQuery) {
          const summaryReply = await handleUserQueryResponse(
            queryCheck,
            username,
            userId,
            chatId
          );
          if (token) {
            await sendTelegramMessage(token, chatId, summaryReply.text, summaryReply.replyMarkup);
            return res.json({ ok: true });
          }
          const respPayload: any = {
            method: 'sendMessage',
            chat_id: chatId,
            text: summaryReply.text,
            parse_mode: 'Markdown',
          };
          if (summaryReply.replyMarkup) {
            respPayload.reply_markup = summaryReply.replyMarkup;
          }
          return res.json(respPayload);
        }

        const result = await processIdeaWithGemini(
          text,
          isLiz ? 'Telegram (Liz)' : `Telegram (@${username})`,
          userId,
          isLiz ? 'Liz' : undefined
        );

        let replyText = '';
        if (result.isDirectTask && result.newTaskRecord) {
          // Ensure partner attributes
          if (isLiz) {
            result.newTaskRecord.assignedBy = 'Liz';
            result.newTaskRecord.assignedTo = 'Miguel';
            result.newTaskRecord.tags = ['Asignado por Liz', 'pareja', 'hogar', 'telegram'];
          }

          const taskAssignedDate = result.structuredResult.assignedDate;
          const taskTimeSlot = result.structuredResult.timeSlot;
          const taskTitle = result.structuredResult.title;

          try {
            const eventMs = parseLocalDateTimeMs(taskAssignedDate, taskTimeSlot);
            if (!isNaN(eventMs)) {
              const preAlertMs = eventMs - 10 * 60 * 1000;
              const estimatedMinutes = Math.round((result.structuredResult.estimatedHours || 1) * 60);
              const postCheckMs = eventMs + (estimatedMinutes + 10) * 60 * 1000;

              const reminderChatId = isLiz && partnerConfig.ownerChatId ? partnerConfig.ownerChatId : chatId;

              if (preAlertMs > Date.now()) {
                registerScheduledReminder({
                  id: `rem-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                  taskId: result.newTaskRecord.id,
                  userId,
                  chatId: reminderChatId,
                  token,
                  title: taskTitle,
                  category: result.structuredResult.categoryId,
                  scheduledTime: preAlertMs,
                  eventTime: taskTimeSlot,
                  eventDate: taskAssignedDate,
                  sent: false,
                  type: 'task',
                  advanceMinutes: 10,
                  assignedBy: isLiz ? 'Liz' : undefined,
                });
              }

              if (postCheckMs > Date.now()) {
                registerScheduledReminder({
                  id: `fol-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                  taskId: result.newTaskRecord.id,
                  userId,
                  chatId: reminderChatId,
                  token,
                  title: taskTitle,
                  category: result.structuredResult.categoryId,
                  scheduledTime: postCheckMs,
                  eventTime: taskTimeSlot,
                  eventDate: taskAssignedDate,
                  sent: false,
                  type: 'followup_check',
                  afterMinutes: 10,
                  assignedBy: isLiz ? 'Liz' : undefined,
                });
              }
            }
          } catch (e) {
            console.warn('Error scheduling text reminders:', e);
          }

          let gcalTextNotice = '';
          if (result.newTaskRecord.assignedDate) {
            try {
              const gcalRes = await syncTaskToGoogleCalendarOnServer(result.newTaskRecord, userId);
              if (gcalRes.success) {
                result.newTaskRecord.gcalSynced = true;
                result.newTaskRecord.gcalEventId = gcalRes.eventId;
                saveIncomingWebhooksToDisk();
                gcalTextNotice = '\n🗓️ *Google Calendar:* ✅ ¡Evento creado en tu Google Calendar con alarma 10 min antes!';
              } else if (gcalRes.error === 'TOKEN_EXPIRED') {
                result.newTaskRecord.gcalSynced = false;
                gcalTextNotice = '\n🗓️ *Google Calendar:* ⚠️ La sesión de Google venció. Abre LifeBlocks y pulsa *"Vincular Google Cal"* para reconectar.';
              } else if (gcalRes.error === 'NO_TOKEN') {
                result.newTaskRecord.gcalSynced = false;
                gcalTextNotice = '\n🗓️ *Google Calendar:* ⚠️ Vinculación pendiente. Abre LifeBlocks y pulsa *"Vincular Google Cal"* para sincronizar este evento con tu Google Calendar.';
              }
            } catch (gcalErr) {
              console.warn('[Telegram Text] GCal sync error:', gcalErr);
            }
          }

          if (isLiz) {
            replyText = `💜 *¡Hola Liz! Tarea agendada con éxito para Miguel:*

${result.categoryEmoji} *Colección:* ${result.readableCategory}
📋 *Compromiso:* ${result.structuredResult.title}
🗓️ *Fecha:* ${result.structuredResult.assignedDate}
⏰ *Hora:* ${result.structuredResult.timeSlot}
⏱️ *Duración estimada:* ${result.structuredResult.estimatedHours}h
${gcalTextNotice}

🔔 *Alertas automáticas activadas:*
• ⏰ *10 min antes:* Le avisaré a Miguel a su chat para que arranque a tiempo.
• 🔔 *10 min después:* Le preguntaré si la completó.

✨ _Ya aparece en el Calendario de Miguel en LifeGlow y le envié una notificación directa a su chat._ 💑`;

            // Also notify Miguel directly if his chat is known and different
            if (partnerConfig.ownerChatId && String(partnerConfig.ownerChatId) !== String(chatId) && token) {
              const partnerAlert = `💜 *¡Notificación de Pareja: Liz te acaba de programar una tarea!*

${result.categoryEmoji} *Colección:* ${result.readableCategory}
📋 *Compromiso:* ${result.structuredResult.title}
🗓️ *Fecha:* ${result.structuredResult.assignedDate}
⏰ *Hora:* ${result.structuredResult.timeSlot}
⏱️ *Duración:* ${result.structuredResult.estimatedHours}h
${gcalTextNotice}

✨ _Ya quedó registrada en tu Calendario y lista de Pendientes de LifeGlow._`;
              sendTelegramMessage(token, partnerConfig.ownerChatId, partnerAlert).catch(() => {});
            }
          } else {
            replyText = `📅 *¡Tarea y Recordatorio programado en tu Calendario!*

${result.categoryEmoji} *Colección:* ${result.readableCategory}
🎯 *Compromiso:* ${result.structuredResult.title}
🗓️ *Fecha:* ${result.structuredResult.assignedDate}
⏰ *Hora:* ${result.structuredResult.timeSlot}
⏱️ *Duración estimada:* ${result.structuredResult.estimatedHours}h
${gcalTextNotice}

🔔 *Alertas automáticas activadas:*
• ⏰ *10 min antes:* Te avisaré para arrancar a tiempo.
• 🔔 *10 min después:* Te preguntaré si la completaste con botones [Sí / No].

✨ _Ya aparece programada en tu Calendario de LifeGlow._`;
          }
        } else {
          replyText = `💡 *¡Idea guardada en LifeGlow!*

${result.categoryEmoji} *Colección:* ${result.readableCategory}
🎯 *Título:* ${result.structuredIdea.title}
⏱️ *Tiempo estimado:* ${result.structuredIdea.estimatedHours}h (${result.structuredIdea.dailyHours}h/día)
📌 *Tipo:* ${result.structuredIdea.type}
📝 *Contexto:* ${result.structuredIdea.description}

✨ _Ya está disponible en tus bloques y metas de LifeGlow._`;
        }

        if (token) {
          await sendTelegramMessage(token, chatId, replyText);
          return res.json({ ok: true });
        }

        return res.json({
          method: 'sendMessage',
          chat_id: chatId,
          text: replyText,
          parse_mode: 'Markdown',
        });
      }

      return res.json({ ok: true });
    } catch (err: any) {
      console.error('Error handling Telegram Webhook:', err);
      return res.status(500).json({ ok: false, error: err?.message });
    }
  });

  // 4. Test Simulation for Telegram (so user can test in UI with zero credentials)
  app.post('/api/telegram/test-simulation', async (req: Request, res: Response) => {
    try {
      const text = req.body?.text || 'Cambio de aceite para el carro a los 40.000 km y comprar pastillas';
      const username = req.body?.username || 'miguel';
      const userId = req.body?.userId || undefined;
      const callbackData = req.body?.callbackData;

      // Handle simulated button clicks
      if (callbackData && typeof callbackData === 'string') {
        if (callbackData.startsWith('HABIT_DONE:')) {
          const habitIdOrTitle = callbackData.replace('HABIT_DONE:', '').trim();
          let userAgenda = (userId ? userAgendaStore.get(userId) : null) || lastKnownGlobalAgenda || userAgendaStore.get('default') || Array.from(userAgendaStore.values())[0] || null;
          let habitTitle = habitIdOrTitle;
          let habitIcon = '🔥';
          let newStreak = 1;
          const todayStr = new Date().toISOString().split('T')[0];

          if (userAgenda && Array.isArray(userAgenda.habits)) {
            const targetHabit = userAgenda.habits.find(h => h.id === habitIdOrTitle || h.title.toLowerCase().trim() === habitIdOrTitle.toLowerCase().trim());
            if (targetHabit) {
              targetHabit.completedToday = true;
              targetHabit.streak = (targetHabit.streak || 0) + 1;
              habitTitle = targetHabit.title;
              habitIcon = targetHabit.icon || '🔥';
              newStreak = targetHabit.streak;
              saveAgendaStoreToDisk();
            }
          }

          recentHabitCompletionEvents.push({
            id: `evt-h-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            habitId: habitIdOrTitle,
            habitTitle,
            completedDate: todayStr,
            timestamp: new Date().toISOString(),
            userId: userAgenda?.userId || userId,
            newStreak,
          });

          const remainingPending = (userAgenda?.habits || []).filter(h => !h.completedToday && h.id !== habitIdOrTitle);
          let remainingButtons: Array<Array<{ text: string; callback_data: string }>> = [];
          if (remainingPending.length > 0) {
            remainingButtons = remainingPending.slice(0, 5).map(h => ([
              {
                text: `✅ Hecho: ${h.icon || '🔥'} ${h.title}`,
                callback_data: `HABIT_DONE:${h.id}`,
              }
            ]));
          }

          const praiseMessage = `🎉 *¡Excelente trabajo, ${username}!*

✅ He marcado tu hábito *"${habitIcon} ${habitTitle}"* como *COMPLETADO* hoy en tu tablero de LifeGlow.
🔥 *Tu racha actual:* *${newStreak} día(s) consecutivos*.

${remainingButtons.length > 0 ? `_Aún tienes ${remainingButtons.length} hábito(s) pendientes hoy. Toca el botón para completarlo:_` : `🏆 *¡Felicidades! Has completado todos tus hábitos del día.*`}`;

          return res.json({
            success: true,
            isQuery: true,
            isDirectTask: false,
            isExtraExpense: false,
            telegramReply: praiseMessage,
            replyMarkup: remainingButtons.length > 0 ? { inline_keyboard: remainingButtons } : undefined,
            readableCategory: 'Hábitos & Rutinas',
            categoryEmoji: '🔥',
          });
        }
      }

      // Check if text matches habit completion
      const currentAgenda = (userId ? userAgendaStore.get(userId) : null) || lastKnownGlobalAgenda || userAgendaStore.get('default') || Array.from(userAgendaStore.values())[0] || null;
      if (currentAgenda && Array.isArray(currentAgenda.habits) && currentAgenda.habits.length > 0) {
        const habitMatch = detectHabitCompletionIntent(text, currentAgenda.habits);
        if (habitMatch.isHabitDone && habitMatch.matchedHabit) {
          const h = habitMatch.matchedHabit;
          h.completedToday = true;
          h.streak = (h.streak || 0) + 1;
          saveAgendaStoreToDisk();

          const todayStr = new Date().toISOString().split('T')[0];
          recentHabitCompletionEvents.push({
            id: `evt-h-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            habitId: h.id,
            habitTitle: h.title,
            completedDate: todayStr,
            timestamp: new Date().toISOString(),
            userId: currentAgenda.userId || userId,
            newStreak: h.streak,
          });

          const remainingPending = currentAgenda.habits.filter(hab => !hab.completedToday);
          const remainingButtons = remainingPending.slice(0, 5).map(hab => ([
            {
              text: `✅ Hecho: ${hab.icon || '🔥'} ${hab.title}`,
              callback_data: `HABIT_DONE:${hab.id}`,
            }
          ]));

          const habitDoneReply = `🎉 *¡Excelente logro, ${username}!*

✅ He marcado tu hábito *"${h.icon || '🔥'} ${h.title}"* como *COMPLETADO* hoy en tu tablero de LifeGlow.
🔥 *Tu racha actual:* *${h.streak} día(s) consecutivos*.

${remainingButtons.length > 0 ? `_Aún tienes ${remainingButtons.length} hábito(s) pendientes hoy:_` : `🏆 *¡Has completado todos tus hábitos de hoy!*`}`;

          return res.json({
            success: true,
            isQuery: true,
            isDirectTask: false,
            isExtraExpense: false,
            telegramReply: habitDoneReply,
            replyMarkup: remainingButtons.length > 0 ? { inline_keyboard: remainingButtons } : undefined,
            readableCategory: 'Hábitos & Rutinas',
            categoryEmoji: '🔥',
          });
        }
      }

      // Check if this test message is a query or daily summary request
      const queryCheck = detectUserQueryIntent(text);
      if (queryCheck.isQuery) {
        const summaryReply = await handleUserQueryResponse(
          queryCheck,
          username,
          userId
        );
        return res.json({
          success: true,
          isQuery: true,
          isDirectTask: false,
          isExtraExpense: false,
          telegramReply: summaryReply.text,
          replyMarkup: summaryReply.replyMarkup,
          readableCategory: 'Resumen & Asistente IA',
          categoryEmoji: '☀️',
        });
      }

      const result = await processIdeaWithGemini(
        text,
        `Telegram (@${username})`,
        userId
      );

      let telegramReply = '';
      if (result.isExtraExpense && result.newExpenseRecord) {
        const exp = result.newExpenseRecord;
        telegramReply = `🧾 *¡Gasto Adicional / Factura Registrada!*

${result.expenseCategoryEmoji} *Sección:* Gastos Adicionales (${result.expenseCategoryLabel})
🏷️ *Concepto:* ${exp.name}
💰 *Monto:* $${Number(exp.amount).toLocaleString('es-CO')} COP
✅ *Estado:* ${exp.isPaid ? 'Pagado' : 'Pendiente'}
👤 *Pagado por:* ${exp.paidBy || 'Miguel'} (${exp.paymentMethod || 'Tarjeta'})

✨ _Se ha incluido automáticamente en tu tabla de Gastos Adicionales de LifeGlow._`;
      } else if (result.isDirectTask && result.newTaskRecord) {
        let gcalSimNotice = '';
        if (result.newTaskRecord.assignedDate) {
          try {
            const gcalRes = await syncTaskToGoogleCalendarOnServer(result.newTaskRecord, userId);
            if (gcalRes.success) {
              result.newTaskRecord.gcalSynced = true;
              result.newTaskRecord.gcalEventId = gcalRes.eventId;
              saveIncomingWebhooksToDisk();
              gcalSimNotice = '\n🗓️ *Google Calendar:* ✅ ¡Evento creado en tu Google Calendar con alarma 10 min antes!';
            } else if (gcalRes.error === 'TOKEN_EXPIRED') {
              result.newTaskRecord.gcalSynced = false;
              gcalSimNotice = '\n🗓️ *Google Calendar:* ⚠️ La sesión de Google venció. Abre LifeBlocks y pulsa *"Vincular Google Cal"* para reconectar.';
            } else if (gcalRes.error === 'NO_TOKEN') {
              result.newTaskRecord.gcalSynced = false;
              gcalSimNotice = '\n🗓️ *Google Calendar:* ⚠️ Vinculación pendiente. Abre LifeBlocks y pulsa *"Vincular Google Cal"* para sincronizar este evento.';
            }
          } catch (gcalErr) {
            console.warn('[Simulation] GCal sync error:', gcalErr);
          }
        }

        telegramReply = `📅 *¡Tarea y Recordatorio programado en tu Calendario!*

${result.categoryEmoji} *Colección:* ${result.readableCategory}
🎯 *Compromiso:* ${result.structuredResult.title}
🗓️ *Fecha:* ${result.structuredResult.assignedDate}
⏰ *Hora:* ${result.structuredResult.timeSlot}
⏱️ *Duración estimada:* ${result.structuredResult.estimatedHours}h
${gcalSimNotice}

🔔 *Alertas automáticas activadas:*
• ⏰ *10 min antes:* Te avisaré para arrancar a tiempo.
• 🔔 *10 min después:* Te preguntaré si la completaste con botones [Sí / No].

✨ _Ya aparece programada en tu Calendario de LifeGlow._`;
      } else {
        telegramReply = `💡 *¡Idea guardada en LifeGlow!*

${result.categoryEmoji} *Colección:* ${result.readableCategory}
🎯 *Título:* ${result.structuredIdea.title}
⏱️ *Tiempo estimado:* ${result.structuredIdea.estimatedHours}h (${result.structuredIdea.dailyHours}h/día)
📌 *Tipo:* ${result.structuredIdea.type}
📝 *Contexto:* ${result.structuredIdea.description}

✨ _Ya está disponible en tus bloques y metas de LifeGlow._`;
      }

      return res.json({
        success: true,
        isDirectTask: result.isDirectTask,
        isExtraExpense: result.isExtraExpense,
        extraExpense: result.newExpenseRecord,
        idea: result.newIdeaRecord,
        task: result.newTaskRecord,
        telegramReply,
        readableCategory: result.readableCategory,
        categoryEmoji: result.categoryEmoji,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Simulation endpoint for Photo / Invoice uploads in the modal
  app.post('/api/telegram/simulate-photo', async (req: Request, res: Response) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg', caption = 'Factura veterinaria juguete $45.000 pagado', username = 'miguel', userId } = req.body;
      let buffer: Buffer;
      if (imageBase64) {
        const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
        buffer = Buffer.from(cleanBase64, 'base64');
      } else {
        // Mock 1x1 image buffer if none passed
        buffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      }

      const visionResult = await processImageWithGeminiVision(
        buffer,
        mimeType,
        caption,
        `Telegram (@${username})`,
        userId
      );

      let telegramReply = '';
      if (visionResult.isExtraExpense && visionResult.newExpenseRecord) {
        const exp = visionResult.newExpenseRecord;
        telegramReply = `🧾 *¡Factura procesada con Visión IA!*

${visionResult.expenseCategoryEmoji} *Sección:* Gastos Adicionales (${visionResult.expenseCategoryLabel})
🏷️ *Concepto:* ${exp.name}
💰 *Monto:* $${Number(exp.amount).toLocaleString('es-CO')} COP
✅ *Estado:* ${exp.isPaid ? 'Pagado' : 'Pendiente'}
👤 *Pagado por:* ${exp.paidBy || 'Miguel'} (${exp.paymentMethod || 'Tarjeta'})
📅 *Día:* ${exp.dayOfMonth} (${exp.assignedQuincena === 'quincena_1' ? '1ra Quincena' : '2da Quincena'})

✨ _Se ha sumado automáticamente a tu tabla de Gastos Adicionales y se descuenta del saldo del mes en LifeGlow._`;
      } else {
        telegramReply = `📸 *Foto analizada con Visión IA (Gemini):*
${visionResult.categoryEmoji} *Colección:* ${visionResult.readableCategory}
🎯 *Título:* ${visionResult.structuredIdea.title}
📝 *Datos Extraídos:*
${visionResult.structuredIdea.description}

✅ *¡Registro guardado con éxito en LifeGlow!*`;
      }

      return res.json({
        success: true,
        isExtraExpense: visionResult.isExtraExpense,
        extraExpense: visionResult.newExpenseRecord,
        idea: visionResult.newIdeaRecord,
        telegramReply,
        readableCategory: visionResult.readableCategory,
        categoryEmoji: visionResult.categoryEmoji,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  // 5. Proactive Telegram Alert & Scheduler Endpoints
  app.post('/api/telegram/schedule-reminder', async (req: Request, res: Response) => {
    try {
      const {
        taskId,
        title,
        category,
        eventTime,
        eventDate,
        clientTimestampMs,
        advanceMinutes = 10,
        userId,
        chatId: customChatId,
        botToken: customToken,
        type = 'general',
        assignedBy,
      } = req.body;

      if (!title) {
        return res.status(400).json({ success: false, error: 'Falta el título del recordatorio' });
      }

      // Determine chatId and token
      let targetChatId = customChatId;
      let targetToken = customToken || process.env.TELEGRAM_BOT_TOKEN || '';

      if (!targetChatId && partnerConfig.ownerChatId) {
        targetChatId = partnerConfig.ownerChatId;
      }

      if (!targetChatId && userId && telegramSubscribers.has(String(userId))) {
        const sub = telegramSubscribers.get(String(userId))!;
        targetChatId = sub.chatId;
        if (!targetToken && sub.token) targetToken = sub.token;
      }

      if (!targetChatId && telegramSubscribers.size > 0) {
        // Fallback to most recent subscriber
        const lastSub = Array.from(telegramSubscribers.values()).pop();
        if (lastSub) {
          targetChatId = lastSub.chatId;
          if (!targetToken && lastSub.token) targetToken = lastSub.token;
        }
      }

      // Compute target scheduled fire timestamp accurately
      let fireTimestamp = 0;
      if (clientTimestampMs && !isNaN(Number(clientTimestampMs))) {
        fireTimestamp = Number(clientTimestampMs) - (Number(advanceMinutes) || 10) * 60 * 1000;
      } else if (eventDate && eventTime) {
        const targetEventMs = parseLocalDateTimeMs(eventDate, eventTime);
        if (!isNaN(targetEventMs)) {
          fireTimestamp = targetEventMs - (Number(advanceMinutes) || 10) * 60 * 1000;
        }
      } else {
        fireTimestamp = Date.now() + (Number(advanceMinutes) || 10) * 60 * 1000;
      }

      // Only schedule if fire timestamp is in the future
      if (!fireTimestamp || fireTimestamp <= Date.now()) {
        return res.json({
          success: true,
          skipped: true,
          message: 'La hora del recordatorio ya ocurrió en el pasado.',
        });
      }

      const reminderId = `rem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newReminder: ScheduledReminder = {
        id: reminderId,
        taskId: taskId || undefined,
        userId: userId || undefined,
        chatId: targetChatId || 'simulated',
        token: targetToken,
        title,
        category: category || 'salud_deporte',
        scheduledTime: fireTimestamp,
        eventTime: eventTime || 'Pronto',
        eventDate: eventDate || new Date().toISOString().split('T')[0],
        sent: false,
        type: type || 'general',
        advanceMinutes: Number(advanceMinutes) || 10,
        assignedBy: assignedBy || undefined,
      };

      const registered = registerScheduledReminder(newReminder);

      return res.json({
        success: true,
        reminder: newReminder,
        registered,
        hasActiveChatTarget: Boolean(targetChatId && targetChatId !== 'simulated'),
        message: `⏰ Recordatorio programado para avisarte ${advanceMinutes} minutos antes de "${title}".`,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Send an instant test reminder right now to verify Telegram notifications
  app.post('/api/telegram/send-instant-alert', async (req: Request, res: Response) => {
    try {
      const {
        title = 'Hacer 50 Flexiones de Pecho',
        category = 'salud_deporte',
        eventTime = '17:00',
        advanceMinutes = 10,
        userId,
        chatId: customChatId,
        botToken: customToken,
      } = req.body;

      let targetChatId = customChatId;
      let targetToken = customToken || process.env.TELEGRAM_BOT_TOKEN || '';

      if (!targetChatId && userId && telegramSubscribers.has(String(userId))) {
        const sub = telegramSubscribers.get(String(userId))!;
        targetChatId = sub.chatId;
        if (!targetToken && sub.token) targetToken = sub.token;
      }

      if (!targetChatId && telegramSubscribers.size > 0) {
        const lastSub = Array.from(telegramSubscribers.values()).pop();
        if (lastSub) {
          targetChatId = lastSub.chatId;
          if (!targetToken && lastSub.token) targetToken = lastSub.token;
        }
      }

      const categoryEmoji = CATEGORY_EMOJIS[category] || '🔔';
      const alertMsg = `⏰ *¡Recordatorio Proactivo de LifeGlow!* (en ${advanceMinutes} minutos)

${categoryEmoji} *Compromiso:* ${title}
🕐 *Hora programada:* ${eventTime}
📅 *Fecha:* Hoy

💡 _¡Prepárate, toma agua y comienza a calentar para empezar a tiempo!_`;

      if (targetToken && targetChatId && targetChatId !== 'simulated') {
        const sent = await sendTelegramMessage(targetToken, targetChatId, alertMsg);
        return res.json({
          success: sent,
          deliveredToTelegram: sent,
          chatId: targetChatId,
          alertMessage: alertMsg,
        });
      }

      return res.json({
        success: true,
        deliveredToTelegram: false,
        alertMessage: alertMsg,
        note: 'Notificación generada en modo simulación (vincula tu bot o escribe /start en tu chat de Telegram para recibirla en vivo).',
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Sync agenda (tasks & habits) from web client to server for Telegram Bot daily summaries
  app.post('/api/user/sync-agenda', (req: Request, res: Response) => {
    try {
      const { userId = 'default', userDisplayName, todayStr, tasks = [], habits = [] } = req.body;
      const agendaData: UserSyncedAgenda = {
        userId,
        userDisplayName: userDisplayName || 'Miguel',
        todayStr: todayStr || new Date().toISOString().split('T')[0],
        tasks: Array.isArray(tasks) ? tasks : [],
        habits: Array.isArray(habits) ? habits : [],
        lastSynced: new Date().toISOString(),
      };
      userAgendaStore.set(userId, agendaData);
      lastKnownGlobalAgenda = agendaData;
      saveAgendaStoreToDisk();
      return res.json({ success: true, countTasks: agendaData.tasks.length, countHabits: agendaData.habits.length });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Store Google Calendar OAuth access token for automatic direct syncing from backend / Telegram
  app.post('/api/user/set-gcal-token', (req: Request, res: Response) => {
    try {
      const { token, email = 'miguelpatino0@gmail.com', userId } = req.body;
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ success: false, error: 'Token is required' });
      }
      const record: GoogleCalendarTokenRecord = {
        token,
        email,
        userId,
        updatedAt: Date.now(),
      };
      const key = userId || email || 'default';
      userGoogleTokens.set(key, record);
      if (email && email !== key) {
        userGoogleTokens.set(email, record);
      }
      saveGoogleTokensToDisk();
      console.log(`[GoogleTokens] Token saved for ${key} (${email}) at ${new Date().toISOString()}`);
      return res.json({ success: true, email, savedAt: record.updatedAt });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Check status of Google Calendar token on server
  app.get('/api/user/gcal-token-status', (_req: Request, res: Response) => {
    try {
      const tokenRec = getActiveGoogleToken();
      if (!tokenRec) {
        return res.json({ connected: false });
      }
      const ageMinutes = Math.round((Date.now() - tokenRec.updatedAt) / 60000);
      const isLikelyExpired = ageMinutes >= 55;
      return res.json({
        connected: true,
        email: tokenRec.email || 'miguelpatino0@gmail.com',
        ageMinutes,
        isLikelyExpired,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Query agenda for user summary via GET API
  app.get('/api/user/daily-summary', async (req: Request, res: Response) => {
    try {
      const { userId, prompt = 'que tengo para hoy', username = 'miguel' } = req.query;
      const queryCheck = detectUserQueryIntent(String(prompt));
      const summary = await handleUserQueryResponse(
        queryCheck,
        String(username),
        typeof userId === 'string' ? userId : undefined
      );
      return res.json({ success: true, summary: summary.text, replyMarkup: summary.replyMarkup });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Endpoint to poll incoming webhook ideas, direct tasks, extra expenses, and recent task/habit completion events for the web client
  app.get('/api/webhook/incoming', (req: Request, res: Response) => {
    const { userId } = req.query;
    const isQueryTitle = (title: string, raw?: string) => {
      const combined = `${title || ''} ${raw || ''}`.toLowerCase();
      return /\b(qu[eé]\s+(tengo|hay)\s+(para\s+|de\s+)?hoy|agenda\s+(de\s+|para\s+)?hoy|resumen\s+(del?\s+)?d[ií]a|resumen\s+de\s+hoy)\b/i.test(combined);
    };

    const filteredIdeas = incomingWebhookIdeas.filter(i => {
      if (userId && i.userId && i.userId !== userId) return false;
      if (isQueryTitle(i.title, i.rawText)) return false;
      return true;
    });

    const filteredTasks = incomingWebhookTasks.filter(t => {
      if (userId && t.userId && t.userId !== userId) return false;
      if (isQueryTitle(t.title, t.rawText)) return false;
      return true;
    });

    const filteredExpenses = incomingWebhookExpenses.filter(e => !userId || !e.userId || e.userId === userId);
    const filteredCompletions = recentTaskCompletionEvents.filter(c => !userId || !c.userId || c.userId === userId);
    const filteredHabitCompletions = recentHabitCompletionEvents.filter(h => !userId || !h.userId || h.userId === userId);

    res.json({
      success: true,
      ideas: filteredIdeas,
      tasks: filteredTasks,
      extraExpenses: filteredExpenses,
      taskCompletions: filteredCompletions,
      habitCompletions: filteredHabitCompletions,
    });
  });

  // Acknowledge extra expenses once ingested by the client
  app.post('/api/webhook/acknowledge-expenses', (req: Request, res: Response) => {
    const { expenseIds } = req.body;
    if (Array.isArray(expenseIds) && expenseIds.length > 0) {
      const idSet = new Set(expenseIds);
      for (let i = incomingWebhookExpenses.length - 1; i >= 0; i--) {
        if (idSet.has(incomingWebhookExpenses[i].id)) {
          incomingWebhookExpenses.splice(i, 1);
        }
      }
      saveIncomingWebhooksToDisk();
    }
    return res.json({ success: true });
  });

  // Acknowledge tasks once ingested by the client to prevent re-adding them
  app.post('/api/webhook/acknowledge-tasks', (req: Request, res: Response) => {
    const { taskIds } = req.body;
    if (Array.isArray(taskIds) && taskIds.length > 0) {
      const idSet = new Set(taskIds);
      for (let i = incomingWebhookTasks.length - 1; i >= 0; i--) {
        if (idSet.has(incomingWebhookTasks[i].id)) {
          incomingWebhookTasks.splice(i, 1);
        }
      }
      saveIncomingWebhooksToDisk();
    }
    return res.json({ success: true });
  });

  // Acknowledge ideas once ingested by the client
  app.post('/api/webhook/acknowledge-ideas', (req: Request, res: Response) => {
    const { ideaIds } = req.body;
    if (Array.isArray(ideaIds) && ideaIds.length > 0) {
      const idSet = new Set(ideaIds);
      for (let i = incomingWebhookIdeas.length - 1; i >= 0; i--) {
        if (idSet.has(incomingWebhookIdeas[i].id)) {
          incomingWebhookIdeas.splice(i, 1);
        }
      }
      saveIncomingWebhooksToDisk();
    }
    return res.json({ success: true });
  });

  // Delete task from webhook and scheduled reminder queues
  app.post('/api/webhook/delete-task', (req: Request, res: Response) => {
    const { taskId } = req.body;
    if (taskId) {
      // Remove from incoming queue
      for (let i = incomingWebhookTasks.length - 1; i >= 0; i--) {
        if (incomingWebhookTasks[i].id === taskId) {
          incomingWebhookTasks.splice(i, 1);
        }
      }
      // Cancel any scheduled reminders or followups for this task
      for (let i = scheduledReminders.length - 1; i >= 0; i--) {
        if (scheduledReminders[i].taskId === taskId) {
          scheduledReminders.splice(i, 1);
        }
      }
      saveIncomingWebhooksToDisk();
    }
    return res.json({ success: true });
  });

  // Delete idea from webhook queue
  app.post('/api/webhook/delete-idea', (req: Request, res: Response) => {
    const { ideaId } = req.body;
    if (ideaId) {
      for (let i = incomingWebhookIdeas.length - 1; i >= 0; i--) {
        if (incomingWebhookIdeas[i].id === ideaId) {
          incomingWebhookIdeas.splice(i, 1);
        }
      }
      saveIncomingWebhooksToDisk();
    }
    return res.json({ success: true });
  });

  // Clear or acknowledge task completions once synced
  app.post('/api/webhook/acknowledge-task-completions', (req: Request, res: Response) => {
    const { eventIds } = req.body;
    if (Array.isArray(eventIds) && eventIds.length > 0) {
      const idSet = new Set(eventIds);
      for (let i = recentTaskCompletionEvents.length - 1; i >= 0; i--) {
        if (idSet.has(recentTaskCompletionEvents[i].id)) {
          recentTaskCompletionEvents.splice(i, 1);
        }
      }
    }
    return res.json({ success: true });
  });

  // Clear or acknowledge habit completions once synced to the web client
  app.post('/api/webhook/acknowledge-habit-completions', (req: Request, res: Response) => {
    const { eventIds } = req.body;
    if (Array.isArray(eventIds) && eventIds.length > 0) {
      const idSet = new Set(eventIds);
      for (let i = recentHabitCompletionEvents.length - 1; i >= 0; i--) {
        if (idSet.has(recentHabitCompletionEvents[i].id)) {
          recentHabitCompletionEvents.splice(i, 1);
        }
      }
    }
    return res.json({ success: true });
  });

  // Partner Config (GET & POST) for managing husband/wife couple integration
  app.get('/api/partner/config', (_req: Request, res: Response) => {
    return res.json({
      success: true,
      partnerConfig,
    });
  });

  app.post('/api/partner/config', (req: Request, res: Response) => {
    const { ownerName, ownerChatId, partnerName, partnerChatId, partnerUsername } = req.body;
    if (ownerName !== undefined) partnerConfig.ownerName = String(ownerName).trim() || 'Miguel';
    if (ownerChatId !== undefined) partnerConfig.ownerChatId = ownerChatId ? (isNaN(Number(ownerChatId)) ? String(ownerChatId) : Number(ownerChatId)) : null;
    if (partnerName !== undefined) partnerConfig.partnerName = String(partnerName).trim() || 'Liz';
    if (partnerChatId !== undefined) partnerConfig.partnerChatId = partnerChatId ? (isNaN(Number(partnerChatId)) ? String(partnerChatId) : Number(partnerChatId)) : null;
    if (partnerUsername !== undefined) partnerConfig.partnerUsername = String(partnerUsername).trim() || undefined;
    partnerConfig.lastUpdated = new Date().toISOString();
    savePartnerConfigToDisk();

    return res.json({
      success: true,
      partnerConfig,
      message: 'Configuración de Modo Pareja guardada exitosamente.',
    });
  });

  // Test Partner Task assignment from Liz to Miguel
  app.post('/api/partner/test-task', async (req: Request, res: Response) => {
    try {
      const {
        title = 'Limpiar la casa y organizar la sala',
        category = 'finanzas_hogar',
        timeSlot = '16:00 - 17:00',
        assignedDate = new Date().toISOString().split('T')[0],
        estimatedHours = 1,
        partnerName = partnerConfig.partnerName || 'Liz',
        ownerName = partnerConfig.ownerName || 'Miguel',
        userId,
      } = req.body;

      const newTaskRecord: IncomingWebhookTask = {
        id: `task-partner-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        source: `Telegram (@${partnerConfig.partnerUsername || partnerName.toLowerCase()})`,
        rawText: `Tarea asignada por ${partnerName}: ${title}`,
        title,
        description: `Tarea asignada por ${partnerName} para ${ownerName} desde Telegram.`,
        category: category || 'finanzas_hogar',
        type: 'actividad_programada',
        priority: 'alta',
        status: 'pendiente',
        assignedDate,
        timeSlot,
        estimatedHours: Number(estimatedHours) || 1,
        completedHours: 0,
        tags: [`Asignado por ${partnerName}`, 'pareja', 'telegram'],
        assignedBy: partnerName,
        assignedTo: ownerName,
        userId: userId || undefined,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };

      incomingWebhookTasks.unshift(newTaskRecord);
      if (incomingWebhookTasks.length > 80) incomingWebhookTasks.pop();
      saveIncomingWebhooksToDisk();

      // Send live notification to owner if configured
      let deliveredToTelegram = false;
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (botToken && partnerConfig.ownerChatId) {
        const notifMsg = `💜 *¡Nueva tarea asignada por tu pareja (${partnerName})!*
        
🎯 *Tarea:* ${title}
🗓️ *Fecha:* ${assignedDate}
⏰ *Hora:* ${timeSlot}
⏱️ *Duración estimada:* ${estimatedHours}h

✨ _Ya ha sido añadida automáticamente a tu Calendario de LifeGlow con la etiqueta "Asignado por ${partnerName}"._`;
        try {
          deliveredToTelegram = await sendTelegramMessage(botToken, partnerConfig.ownerChatId, notifMsg);
        } catch (tgErr) {
          console.warn('Error notifying owner in test-task:', tgErr);
        }
      }

      // Schedule reminder 10 minutes before
      const eventTimeStr = timeSlot ? timeSlot.split(' - ')[0].trim() : '16:00';
      const scheduledFireMs = parseLocalDateTimeMs(assignedDate, eventTimeStr) - 10 * 60 * 1000;
      if (scheduledFireMs > Date.now()) {
        registerScheduledReminder({
          id: `rem-partner-${Date.now()}`,
          taskId: newTaskRecord.id,
          userId: userId || undefined,
          chatId: partnerConfig.ownerChatId || 'simulated',
          token: botToken || '',
          title,
          category,
          scheduledTime: scheduledFireMs,
          eventTime: eventTimeStr,
          eventDate: assignedDate,
          sent: false,
          type: 'general',
          advanceMinutes: 10,
          assignedBy: partnerName,
        });
      }

      return res.json({
        success: true,
        task: newTaskRecord,
        deliveredToTelegram,
        message: `✅ Tarea de ${partnerName} para ${ownerName} asignada con éxito y programada en el calendario.`,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Batch Brain Dump Processing with Gemini AI & Robust Deterministic Classification
  app.post('/api/gemini/braindump', async (req: Request, res: Response) => {
    try {
      const { rawText } = req.body;
      if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
        return res.status(400).json({ success: false, error: 'El texto está vacío' });
      }

      const now = new Date();
      const todayISO = now.toISOString().split('T')[0];
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowISO = tomorrow.toISOString().split('T')[0];

      // Helper function to validate and post-process any single item
      const enrichItem = (item: any, rawSnippet: string) => {
        const textToAnalyze = `${item.title || ''} ${item.description || ''} ${rawSnippet}`.trim();
        const detectedCat = detectSpanishCategory(textToAnalyze);
        const detectedTime = parseSpanishTimeAndDate(textToAnalyze, todayISO, tomorrowISO);

        const categoryId = (item.categoryId && CATEGORY_LABELS[item.categoryId]) 
          ? item.categoryId 
          : detectedCat.categoryId;

        const isTask = typeof item.isDirectTask === 'boolean' 
          ? (item.isDirectTask || detectedTime.isDirectTask) 
          : detectedTime.isDirectTask;

        const timeSlot = item.timeSlot 
          ? normalizeTimeSlot(item.timeSlot, textToAnalyze) 
          : (detectedTime.timeSlot || (isTask ? '16:00' : undefined));

        const assignedDate = item.assignedDate && item.assignedDate.includes('-')
          ? item.assignedDate
          : (isTask ? (detectedTime.assignedDate || todayISO) : undefined);

        const estimatedHours = Number(item.estimatedHours) || detectedTime.estimatedHours || 1;

        return {
          rawText: item.rawText || rawSnippet,
          title: (item.title || rawSnippet.slice(0, 60)).trim(),
          description: (item.description || rawSnippet).trim(),
          categoryId,
          type: item.type || detectedCat.type,
          isDirectTask: isTask,
          assignedDate: isTask ? assignedDate : undefined,
          timeSlot: isTask ? timeSlot : undefined,
          estimatedHours,
          priority: item.priority || 'media',
          finalGoal: item.finalGoal || detectedCat.finalGoal,
        };
      };

      const ai = getGeminiClient();

      if (ai) {
        const prompt = `
Eres el clasificador y estructurador de "Brain Dump" de LifeBlocks.
El usuario ha vertido múltiples ideas, pensamientos, compromisos deportivos, rutinas, mantenimientos y tareas en el siguiente texto:
"""
${rawText}
"""

Fecha actual de referencia: ${todayISO} (Mañana: ${tomorrowISO}).

TU MISIÓN OBLIGATORIA:
1. Divide el texto en elementos/ideas/tareas individuales distintas (cada pensamiento o pendiente separado).
2. Para cada una, analiza el área de vida correspondiente:
   - "salud_deporte": ÚNICAMENTE actividad física (correr, trotar, flexiones, running, pesas, gym, ejercicio, natación, ciclismo), citas médicas, nutrición, hábitos deportivos.
   - "vehiculos": autos, carros, motos, cambio de aceite, odómetro, llantas, frenos, taller mecánico, seguro de auto, repuestos automotrices.
   - "aprendizaje_habilidades": estudiar, programar, idiomas, cursos, lectura de estudio, habilidades técnicas.
   - "finanzas_hogar": pagar servicios, bancos, cuentas, transferencias, presupuestos, ahorros, facturas.
   - "bienestar_mente": meditación, relajación, respiración, hábitos de sueño, salud mental.
   - "ocio_entretenimiento": videojuegos, series, películas, salidas recreativas, hobbies.
   - "familia_relaciones": planes con familia, pareja, hijos.
   - "actividades_pendientes": compras, pedidos, paquetes, envíos, filamentos (impresión 3D), repuestos del hogar, pintar, arreglos, trámites, llamadas, recordatorios.

3. DISTINCIÓN CRÍTICA ENTRE TAREA ("isDirectTask": true) E IDEA ("isDirectTask": false):
   - Si menciona hora, horario o frecuencia (ej: "todos los días a las 11 de la noche", "correr una hora de 7 a 8 pm", "a las 10 am", "mañana a las 4 pm", "cada mañana a las 8 am"):
     -> "isDirectTask": true
     -> "assignedDate": "${todayISO}" (o fecha indicada)
     -> "timeSlot": hora en formato 24 horas "HH:MM" (ej: "11 de la noche" -> "23:00", "7 de la noche" -> "19:00", "8 am" -> "08:00")
     -> "estimatedHours": 1 (o las horas especificadas)
   - Si es solo una nota o idea sin hora fija (ej: "comprar filamento negro", "idea para una app"):
     -> "isDirectTask": false
     -> "assignedDate": null
     -> "timeSlot": null

EJEMPLOS DE CLASIFICACIÓN EXACTA:
- "correr todos los dias a las 11 de la noche" -> categoryId: "salud_deporte", isDirectTask: true, timeSlot: "23:00", assignedDate: "${todayISO}", estimatedHours: 1, type: "rutina_deportiva"
- "correr una hora de 7 a 8 pm" -> categoryId: "salud_deporte", isDirectTask: true, timeSlot: "19:00", assignedDate: "${todayISO}", estimatedHours: 1, type: "entrenamiento"
- "hacer 50 flexiones cada mañana a las 8 am" -> categoryId: "salud_deporte", isDirectTask: true, timeSlot: "08:00", assignedDate: "${todayISO}", estimatedHours: 0.5, type: "rutina_deportiva"
- "cambiar aceite al carro el sábado a las 10 am" -> categoryId: "vehiculos", isDirectTask: true, timeSlot: "10:00", estimatedHours: 1.5, type: "cambio_aceite"
- "comprar filamento para impresora 3d" -> categoryId: "actividades_pendientes", isDirectTask: false, type: "compra"
- "estudiar python 1 hora a las 6 pm" -> categoryId: "aprendizaje_habilidades", isDirectTask: true, timeSlot: "18:00", assignedDate: "${todayISO}", estimatedHours: 1, type: "estudio_aprendizaje"
- "pagar internet y luz" -> categoryId: "finanzas_hogar", isDirectTask: true, timeSlot: "12:00", assignedDate: "${todayISO}", type: "pago_finanzas"

Devuelve ÚNICAMENTE un JSON válido con esta estructura:
{
  "items": [
    {
      "rawText": "texto original correspondiente",
      "title": "Título claro y directo",
      "description": "Detalles o contexto sintetizado",
      "categoryId": "salud_deporte | vehiculos | aprendizaje_habilidades | finanzas_hogar | bienestar_mente | ocio_entretenimiento | familia_relaciones | actividades_pendientes",
      "type": "tipo específico (ej: rutina_deportiva, compra, cambio_aceite, estudio_aprendizaje, etc.)",
      "isDirectTask": true o false,
      "assignedDate": "YYYY-MM-DD" o null,
      "timeSlot": "HH:MM (24h)" o null,
      "estimatedHours": 1,
      "priority": "baja" | "media" | "alta" | "urgente",
      "finalGoal": "Objetivo alcanzable"
    }
  ]
}
`;

        let aiResp;
        try {
          aiResp = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          });
        } catch {
          try {
            aiResp = await ai.models.generateContent({
              model: 'gemini-flash-latest',
              contents: prompt,
              config: {
                responseMimeType: 'application/json',
                temperature: 0.1,
              },
            });
          } catch (e) {
            console.warn('Gemini generateContent error in braindump:', e);
          }
        }

        if (aiResp && aiResp.text) {
          try {
            const parsed = JSON.parse(aiResp.text);
            if (Array.isArray(parsed.items) && parsed.items.length > 0) {
              const enriched = parsed.items.map((item: any) => enrichItem(item, item.rawText || item.title || ''));
              return res.json({ success: true, items: enriched });
            }
          } catch (pe) {
            console.warn('Failed to parse Gemini response in braindump:', pe);
          }
        }
      }

      // Intelligent Fallback with full Spanish NLP splitting & classification
      const rawLines = rawText
        .split(/\n+|(?<=[.;])\s+/)
        .map(l => l.trim().replace(/^[-*•0-9.)\s]+/, ''))
        .filter(l => l.length > 2);

      const fallbackItems = rawLines.map(line => enrichItem({}, line));

      return res.json({ success: true, items: fallbackItems });
    } catch (err: any) {
      console.warn('Notice in /api/gemini/braindump:', err?.message || err);
      return res.json({ success: true, items: [] });
    }
  });

  // Helper to generate a high quality financial closure analysis if API key is absent or on network fallback
  function generateFallbackFinancialAnalysis(
    monthName: string = 'este mes',
    q1: any = {},
    q2: any = {},
    totals: any = {},
    categories: any[] = [],
    topCat: any = {},
    rawText?: string
  ) {
    const netBalance = Number(totals?.netBalance) || 0;
    const totalReceived = Number(totals?.totalReceived) || 1;
    const savingsRate = Math.round((netBalance / Math.max(1, totalReceived)) * 100);
    const q1Bal = Number(q1?.balance) || 0;
    const q2Bal = Number(q2?.balance) || 0;
    const topCatName = topCat?.label || 'Vivienda & Servicios';
    const topCatPercent = topCat?.percentage || 0;

    let rating = 'Bueno';
    let score = 75;
    if (netBalance > 500000 && savingsRate >= 20) {
      rating = 'Excelente';
      score = 92;
    } else if (netBalance >= 0) {
      rating = 'Bueno';
      score = 78;
    } else if (netBalance > -300000) {
      rating = 'Regular';
      score = 62;
    } else {
      rating = 'Por Mejorar';
      score = 48;
    }

    return {
      rating,
      score,
      executiveSummary: netBalance >= 0
        ? `En ${monthName} lograste cerrar con superávit neto de $${netBalance.toLocaleString('es-CO')} COP (${Math.max(0, savingsRate)}% de tasa de ahorro). Mantuviste control sobre tus flujos y tus ingresos superaron las obligaciones.`
        : `En ${monthName} se registró un desfase presupuestario de $${Math.abs(netBalance).toLocaleString('es-CO')} COP. Es crucial redistribuir fechas de vencimiento y frenar gastos imprevistos para recuperar el equilibrio.`,
      q1Analysis: q1Bal >= 0
        ? `El Módulo 1 (Días 1-15) concluyó con saldo a favor de $${q1Bal.toLocaleString('es-CO')} COP. Este colchón positivo alivió la segunda mitad del mes y permitió absorber pagos con holgura.`
        : `El Módulo 1 (Días 1-15) finalizó con saldo en contra de -$${Math.abs(q1Bal).toLocaleString('es-CO')} COP. Se concentraron pagos pesados en la primera quincena que trasladaron presión financiera al segundo corte.`,
      q2Analysis: q2Bal >= 0
        ? `El Módulo 2 (Días 16-fin de mes) logró absorber sus compromisos y cerró favorablemente en $${q2Bal.toLocaleString('es-CO')} COP, garantizando liquidez para el inicio del próximo mes.`
        : `El Módulo 2 (Días 16-fin de mes) cerró con déficit de -$${Math.abs(q2Bal).toLocaleString('es-CO')} COP. El arrastre y los compromisos de fin de mes sobrepasaron el ingreso del corte 15.`,
      topExpenseAnalysis: `La categoría con mayor volumen de gasto fue "${topCatName}", representando el ${topCatPercent}% del total gastado. Es el rubro estructural prioritario a monitorear para optimizar tarifas y consumos.`,
      recommendations: [
        q1Bal < 0
          ? 'Equilibrar fechas de pago: solicita a proveedores de servicios o tarjetas mover fechas de corte de la primera quincena hacia la segunda para no asfixiar el pago del día 1.'
          : 'Preservar el remanente de Q1: aparta inmediatamente el saldo a favor de la primera quincena en un bolsillo o fondo de emergencia para evitar gastarlo por inercia.',
        `Revisar contratos o alternativas en "${topCatName}" para reducir ese ${topCatPercent}% del presupuesto mensual.`,
        'Asignar un tope estricto a gastos extras imprevistos antes del día 15 para no comprometer el segundo sueldo del mes.',
        'Trasladar el saldo de cierre al mes siguiente para mantener trazabilidad histórica y conectar las finanzas mes a mes.'
      ],
      nextMonthStrategy: netBalance >= 0
        ? 'Aprovecha el saldo a favor para iniciar el próximo mes con colchón positivo y destinar un 10% adicional a inversión o amortización anticipada de deudas.'
        : 'Inicia el próximo mes reprogramando vencimientos hacia la segunda quincena y congelando compras no esenciales durante los primeros 15 días.'
    };
  }

  // Monthly Financial Closure & AI Analysis with Gemini 3.8 Flash
  app.post('/api/gemini/financial-month-analysis', async (req: Request, res: Response) => {
    try {
      const {
        monthName,
        q1Data,
        q2Data,
        totals,
        categoryBreakdown,
        topCategory
      } = req.body;

      const ai = getGeminiClient();
      if (!ai) {
        return res.json({
          success: true,
          analysis: generateFallbackFinancialAnalysis(monthName, q1Data, q2Data, totals, categoryBreakdown, topCategory)
        });
      }

      const prompt = `Actúa como un asesor financiero personal experto, analítico y motivador. Analiza el cierre financiero del mes de ${monthName || 'este mes'}.
Datos financieros:
- Módulo 1 (Quincena 1, Días 1 al 15):
  * Ingresos: $${q1Data?.incomes || 0} COP
  * Gastos Fijos: $${q1Data?.bills || 0} COP
  * Gastos Extras: $${q1Data?.extras || 0} COP
  * Saldo resultante Q1: $${q1Data?.balance || 0} COP (${(q1Data?.balance || 0) >= 0 ? 'Saldo a favor' : 'Saldo en contra/déficit'})

- Módulo 2 (Quincena 2, Días 16 al fin de mes):
  * Ingreso normal: $${q2Data?.incomes || 0} COP
  * Saldo traído del Módulo 1: $${q2Data?.carriedOver || 0} COP
  * Presupuesto efectivo disponible: $${q2Data?.availableBudget || 0} COP
  * Gastos Fijos: $${q2Data?.bills || 0} COP
  * Gastos Extras: $${q2Data?.extras || 0} COP
  * Saldo final resultante Q2: $${q2Data?.balance || 0} COP

- Totales del Mes:
  * Total Ingresos Recibidos: $${totals?.totalReceived || 0} COP
  * Total Gastado: $${totals?.totalSpent || 0} COP
  * Saldo Neto Disponible: $${totals?.netBalance || 0} COP
  * Tasa de Ahorro: ${totals?.savingsRate || 0}%

- Categoría en la que más se gastó (de la torta de gastos):
  * ${topCategory?.label || 'Gastos Generales'}: $${topCategory?.amount || 0} COP (${topCategory?.percentage || 0}% del total gastado).

Desglose de categorías principales:
${(categoryBreakdown || []).slice(0, 6).map((c: any) => `- ${c.label}: $${c.amount} COP (${c.percentage}%)`).join('\n')}

Responde ÚNICAMENTE un objeto JSON válido con esta estructura:
{
  "rating": "Excelente" | "Bueno" | "Regular" | "Por Mejorar",
  "score": número entero del 1 al 100,
  "executiveSummary": "Resumen ejecutivo en 2 oraciones sobre el desempeño global del mes.",
  "q1Analysis": "Evaluación del Módulo 1 (Días 1-15): si se respetó el presupuesto, si hubo holgura o déficit.",
  "q2Analysis": "Evaluación del Módulo 2 (Días 16-fin de mes): cómo impactó el saldo traído del Módulo 1 y cómo cerró la quincena.",
  "topExpenseAnalysis": "Análisis de la categoría que más consumió dinero (${topCategory?.label || ''}), evaluando si es una proporción sana o riesgosa.",
  "recommendations": [
    "Recomendación práctica 1 para el próximo mes...",
    "Recomendación práctica 2...",
    "Recomendación práctica 3..."
  ],
  "nextMonthStrategy": "Estrategia clave sugerida para el mes entrante (ej. cómo redistribuir pagos entre la 1ra y 2da quincena)."
}`;

      let responseText = '';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          }
        });
        responseText = response.text || '';
      } catch (geminiErr: any) {
        // Handle depleted prepayment credits, quota 429, or network limits gracefully
        console.warn('[Gemini Notice] Financial analysis fallback activated:', geminiErr?.status || geminiErr?.message || 'Quota/prepayment depleted');
      }

      if (responseText) {
        try {
          const parsed = JSON.parse(responseText.trim());
          return res.json({ success: true, analysis: parsed });
        } catch (parseErr) {
          console.warn('Could not parse Gemini JSON response, returning fallback', parseErr);
        }
      }

      return res.json({
        success: true,
        analysis: generateFallbackFinancialAnalysis(monthName, q1Data, q2Data, totals, categoryBreakdown, topCategory, responseText)
      });
    } catch (err: any) {
      console.warn('Notice in /api/gemini/financial-month-analysis:', err?.message || err);
      const { monthName, q1Data, q2Data, totals, categoryBreakdown, topCategory } = req.body || {};
      return res.json({
        success: true,
        analysis: generateFallbackFinancialAnalysis(monthName, q1Data, q2Data, totals, categoryBreakdown, topCategory)
      });
    }
  });

  // Schedule automatic post-task verification follow-up (e.g. 10 mins after task ends)
  app.post('/api/telegram/schedule-followup', async (req: Request, res: Response) => {
    try {
      const {
        taskId,
        title,
        category = 'salud_deporte',
        eventTime = '11:20',
        eventDate,
        clientTimestampMs,
        afterMinutes = 10, // e.g. 10 mins after end time (11:30)
        userId,
        chatId: customChatId,
        botToken: customToken,
        assignedBy,
      } = req.body;

      if (!title) {
        return res.status(400).json({ success: false, error: 'Falta el título de la tarea' });
      }

      let targetChatId = customChatId;
      let targetToken = customToken || process.env.TELEGRAM_BOT_TOKEN || '';

      if (!targetChatId && partnerConfig.ownerChatId) {
        targetChatId = partnerConfig.ownerChatId;
      }

      if (!targetChatId && userId && telegramSubscribers.has(String(userId))) {
        const sub = telegramSubscribers.get(String(userId))!;
        targetChatId = sub.chatId;
        if (!targetToken && sub.token) targetToken = sub.token;
      }

      if (!targetChatId && telegramSubscribers.size > 0) {
        const lastSub = Array.from(telegramSubscribers.values()).pop();
        if (lastSub) {
          targetChatId = lastSub.chatId;
          if (!targetToken && lastSub.token) targetToken = lastSub.token;
        }
      }

      // Compute follow-up time: target event time + afterMinutes
      let fireTimestamp = 0;
      if (clientTimestampMs && !isNaN(Number(clientTimestampMs))) {
        fireTimestamp = Number(clientTimestampMs) + (Number(afterMinutes) || 10) * 60 * 1000;
      } else if (eventDate && eventTime) {
        const targetEventMs = parseLocalDateTimeMs(eventDate, eventTime);
        if (!isNaN(targetEventMs)) {
          fireTimestamp = targetEventMs + (Number(afterMinutes) || 10) * 60 * 1000;
        }
      } else {
        fireTimestamp = Date.now() + (Number(afterMinutes) || 10) * 60 * 1000;
      }

      if (!fireTimestamp || fireTimestamp <= Date.now()) {
        return res.json({
          success: true,
          skipped: true,
          message: 'La hora de seguimiento ya ocurrió en el pasado.',
        });
      }

      const followupId = `fol-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newFollowup: ScheduledReminder = {
        id: followupId,
        taskId: taskId || undefined,
        userId: userId || undefined,
        chatId: targetChatId || 'simulated',
        token: targetToken,
        title,
        category,
        scheduledTime: fireTimestamp,
        eventTime,
        eventDate: eventDate || new Date().toISOString().split('T')[0],
        sent: false,
        type: 'followup_check',
        afterMinutes: Number(afterMinutes) || 10,
        assignedBy: assignedBy || undefined,
      };

      const registered = registerScheduledReminder(newFollowup);

      return res.json({
        success: true,
        followup: newFollowup,
        registered,
        message: `Pregunta de seguimiento programada para ${afterMinutes} minutos después de "${title}".`,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Instant trigger test for Follow-up Verification (e.g. testing the 11:30 check-in for 11:00 flexiones)
  app.post('/api/telegram/send-instant-followup', async (req: Request, res: Response) => {
    try {
      const {
        title = 'Hacer 50 Flexiones de Pecho',
        category = 'salud_deporte',
        eventTime = '11:00 - 11:20',
        userId,
        chatId: customChatId,
        botToken: customToken,
      } = req.body;

      let targetChatId = customChatId;
      let targetToken = customToken || process.env.TELEGRAM_BOT_TOKEN || '';

      if (!targetChatId && userId && telegramSubscribers.has(String(userId))) {
        const sub = telegramSubscribers.get(String(userId))!;
        targetChatId = sub.chatId;
        if (!targetToken && sub.token) targetToken = sub.token;
      }

      if (!targetChatId && telegramSubscribers.size > 0) {
        const lastSub = Array.from(telegramSubscribers.values()).pop();
        if (lastSub) {
          targetChatId = lastSub.chatId;
          if (!targetToken && lastSub.token) targetToken = lastSub.token;
        }
      }

      const categoryEmoji = CATEGORY_EMOJIS[category] || '🔔';
      const checkMsg = `🔔 *¡Seguimiento de LifeGlow!* (10 min después)
      
${categoryEmoji} *¿Lograste hacer tu compromiso:* "${title}"?
🕐 *Horario:* ${eventTime}

Toca una opción o responde directamente *"Sí"* o *"No"*:`;

      if (targetChatId) {
        pendingUserFollowups.set(String(targetChatId), {
          taskTitle: title,
          category,
          askedAt: Date.now(),
          userId,
          stage: 'awaiting_yes_no',
        });
      }

      const inlineKeyboard = {
        inline_keyboard: [
          [
            { text: '✅ ¡Sí, la completé!', callback_data: `TASK_DONE:${title}` },
            { text: '❌ No la hice', callback_data: `TASK_NOT_DONE:${title}` }
          ]
        ]
      };

      if (targetToken && targetChatId && targetChatId !== 'simulated') {
        const sent = await sendTelegramMessage(targetToken, targetChatId, checkMsg, inlineKeyboard);
        return res.json({
          success: sent,
          deliveredToTelegram: sent,
          chatId: targetChatId,
          checkMessage: checkMsg,
        });
      }

      return res.json({
        success: true,
        deliveredToTelegram: false,
        checkMessage: checkMsg,
        note: 'Pregunta de seguimiento generada en simulación.',
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  // AI Agent: Recommendations for upcoming task / block
  app.post('/api/agent/recommendations', async (req: Request, res: Response) => {
    try {
      const { task, context } = req.body;
      if (!task) {
        return res.status(400).json({ error: 'task object is required' });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.json({
          fallback: true,
          recommendation: generateSmartFallbackTips(task),
        });
      }

      const prompt = `
Eres el "Agente Inteligente de Productividad, Hábitos y Recordatorios de LifeBlocks".
El usuario tiene programada una actividad o meta en su calendario.

Datos de la tarea:
- Título: ${task.title}
- Categoría: ${task.category || 'General'}
- Horario / Franja: ${task.timeSlot || 'Hoy'}
- Fecha asignada: ${task.assignedDate || 'Próximamente'}
- Fecha límite: ${task.dueDate || 'Sin fecha'}
- Meta Final: ${task.finalGoal || 'Cumplir el objetivo'}
- Horas estimadas: ${task.dailyHours || task.estimatedHours || 1}h
- Subtareas / Checklist total: ${Array.isArray(task.subgoals) && task.subgoals.length > 0 ? task.subgoals.map((s: any) => `[${s.completed ? 'COMPLETADO' : 'PENDIENTE'}] ${s.title}`).join(', ') : 'Ninguna subtarea definida'}
- Contexto adicional: ${context || 'Recordatorio activo'}

REGLA FUNDAMENTAL DE RECORDATORIOS Y SUBTAREAS:
1. Si la tarea tiene subtareas PENDIENTES (por ejemplo si la tarea es "Hacer pan casero el viernes a las 3pm" y tiene subtareas pendientes como "Comprar levadura", "Comprar harina", "Comprar masa y azúcar"):
   - El recordatorio DEBE avisar con antelación recordando la tarea principal y alertando específicamente sobre lo que aún tiene pendiente por comprar o preparar antes del día/hora señalada.
   - En el saludo o tips, resalta con claridad: "Recuerda que tienes [Actividad] programada, pero aún tienes pendiente: [Subtareas pendientes]".
2. Si TODAS las subtareas ya fueron completadas (o no tiene subtareas):
   - NO menciones subtareas pasadas ni compras pendientes. Concéntrate únicamente en la tarea principal, la motivación y la ejecución directa del bloque.

Genera un recordatorio proactivo y 3 o 4 consejos prácticos, amables y motivadores muy específicos para prepararse y ejecutar con éxito esta actividad.
Responde en formato JSON con la siguiente estructura exacta:
{
  "greeting": "Frase de saludo y recordatorio puntual con horario y mención de subtareas pendientes si existen",
  "tips": ["Consejo 1 de preparación previa o anticipada", "Consejo 2 de ejecución", "Consejo 3"],
  "prepChecklist": ["Item breve 1 para tener listo antes", "Item breve 2"],
  "motivationalQuote": "Una frase corta inspiradora y energizante"
}

Devuelve ÚNICAMENTE el JSON válido, sin bloques de código markdown extra.
`;

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });
      } catch {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.7,
            },
          });
        } catch {
          return res.json({
            fallback: true,
            recommendation: generateSmartFallbackTips(task),
          });
        }
      }

      const responseText = response.text || '{}';
      try {
        const parsed = JSON.parse(responseText);
        return res.json({
          fallback: false,
          recommendation: parsed,
        });
      } catch (parseErr) {
        return res.json({
          fallback: true,
          raw: responseText,
          recommendation: generateSmartFallbackTips(task),
        });
      }
    } catch (err: any) {
      console.warn('Notice calling Gemini in /api/agent/recommendations:', err?.message || err);
      return res.json({
        fallback: true,
        error: err?.message,
        recommendation: generateSmartFallbackTips(req.body?.task || {}),
      });
    }
  });

  // AI Agent: Interactive Chat / Questions about schedule
  app.post('/api/agent/chat', async (req: Request, res: Response) => {
    try {
      const { userMessage, todayTasks, allPendingTasks } = req.body;

      const ai = getGeminiClient();
      if (!ai) {
        return res.json({
          fallback: true,
          reply: `Hola! Soy tu Agente LifeBlocks. Hoy tienes ${todayTasks?.length || 0} bloque(s) programado(s). Si quieres consejos sobre alguna actividad específica, haz clic en el botón de tips de cada tarjeta.`,
        });
      }

      const tasksContext = todayTasks && todayTasks.length > 0
        ? todayTasks.map((t: any) => `- "${t.title}" (${t.category}, ${t.timeSlot || 'Sin hora fija'}, Meta: ${t.finalGoal || 'Cumplir'}).`).join('\n')
        : 'No hay actividades específicas programadas para hoy.';

      const allTasksContext = allPendingTasks && allPendingTasks.length > 0
        ? allPendingTasks.map((t: any) => `- "${t.title}" (Fecha: ${t.assignedDate || t.dueDate || 'Sin fecha'}, Horario: ${t.timeSlot || 'Por definir'}, Subtareas pendientes: ${Array.isArray(t.subgoals) ? t.subgoals.filter((s: any) => !s.completed).map((s: any) => s.title).join(', ') || 'Ninguna' : 'Ninguna'})`).join('\n')
        : 'Sin otras tareas registradas.';

      const systemInstruction = `
Eres el "Agente Coach Inteligente de LifeBlocks", un asistente amable, empático, altamente enfocado y motivador que ayuda al usuario a organizar su vida, cumplir sus metas diarias y preparar sus bloques de tiempo.

Contexto de las tareas de HOY del usuario:
${tasksContext}

Contexto de todas las tareas y compromisos de la semana del usuario:
${allTasksContext}

Instrucciones Especiales de Recordatorio y Plan Nocturno/Semanal:
1. Si el usuario pide un resumen del día, de la noche o de los días restantes de la semana:
   - Recuérdale qué tiene para mañana y los días siguientes (ej: "Recuerda que mañana lunes tienes gimnasio a las 8:00 PM para que tengas la ropa lista", "el martes piscina para tener el traje de baño", "el jueves tal cosa...").
   - Muestra de manera secuencial desde el día siguiente en adelante hasta el domingo.
   - Da un consejo de preparación anticipada muy puntual (ropa, insumos, compras de subtareas pendientes).
2. Si el usuario pregunta qué tiene para hoy, resúmele sus bloques con horarios y consejos breves para arrancar.
3. Si una tarea tiene compras o insumos pendientes (subtareas), indícaselo con claridad para que lo compre con tiempo.
4. Responde siempre en español, con calidez, formato limpio y directo.
`;

      let replyText = 'Estoy listo para ayudarte con tu día en LifeBlocks.';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [
            { role: 'user', parts: [{ text: userMessage || '¿Qué tengo para hoy y qué me recomiendas?' }] }
          ],
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });
        replyText = response.text || replyText;
      } catch {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: [
              { role: 'user', parts: [{ text: userMessage || '¿Qué tengo para hoy y qué me recomiendas?' }] }
            ],
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });
          replyText = response.text || replyText;
        } catch {
          replyText = `Hola, hoy tienes ${todayTasks?.length || 0} bloque(s) programado(s) en tu agenda. ${
            todayTasks && todayTasks.length > 0
              ? `Próxima actividad: "${todayTasks[0].title}" a las ${todayTasks[0].timeSlot || 'horario programado'}.`
              : 'Puedes registrar ideas nuevas con el botón flotante de la esquina inferior derecha.'
          }`;
        }
      }

      return res.json({
        reply: replyText,
      });
    } catch (err: any) {
      console.warn('Notice in /api/agent/chat:', err?.message || err);
      return res.json({
        fallback: true,
        reply: 'Disculpa, tuve un pequeño contratiempo al procesar tu consulta, pero sigo atento a tu calendario de LifeBlocks.',
      });
    }
  });

  // Vite Middleware (Dev) vs Static Files (Prod)
  const isProduction = process.env.NODE_ENV === 'production' || !process.argv[1]?.endsWith('server.ts');
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const cwdDist = path.join(process.cwd(), 'dist');
    const dirnameDist = path.join(__dirname, 'dist');
    const distPath = fs.existsSync(path.join(cwdDist, 'index.html')) ? cwdDist : dirnameDist;

    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));
    app.get('*', (_req: Request, res: Response) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application build not found. Please run npm run build.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LifeBlocks Server running on http://0.0.0.0:${PORT}`);
  });
}

// Fallback intelligent tip generator for offline / zero-latency mode
function generateSmartFallbackTips(task: any) {
  const title = (task.title || '').toLowerCase();
  const category = (task.category || '').toLowerCase();
  const timeSlot = task.timeSlot || 'Hoy';

  let greeting = `🔔 Recordatorio: Tienes programado "${task.title || 'Actividad'}" (${timeSlot}).`;
  let tips: string[] = [];
  let prepChecklist: string[] = [];
  let motivationalQuote = 'Cada bloque completado te acerca más a tu meta.';

  if (title.includes('bici') || title.includes('cicl') || title.includes('pedal')) {
    greeting = `🚴‍♂️ ¡Atento! Tienes tu bloque de "${task.title}" a las ${timeSlot}.`;
    tips = [
      'Si es de noche, asegúrate de llevar luz delantera blanca, luz trasera roja intermitente y prendas reflectantes.',
      'Lleva tu termo con agua o electrolitos y verifica la presión de los neumáticos 15 minutos antes.',
      'Haz 3-5 minutos de calentamiento articular de rodillas y tobillos antes de comenzar el recorrido.',
      'Define tu ruta con anticipación para disfrutar del paseo con máxima seguridad.'
    ];
    prepChecklist = [
      'Luces delantera y trasera cargadas',
      'Casco ajustado y lentes transparentes',
      'Botella de agua llena',
      'Llave o kit básico de despinche'
    ];
    motivationalQuote = 'El viento a favor lo creas tú con cada pedalada.';
  } else if (title.includes('gym') || title.includes('fuerza') || title.includes('pesas') || title.includes('entren')) {
    greeting = `💪 Recordatorio de Fuerza: "${task.title}" (${timeSlot}).`;
    tips = [
      'Come un snack ligero con carbohidratos complejos 45 minutos antes de iniciar.',
      'Prioriza la técnica y control del movimiento antes de subir cargas.',
      'Realiza series de aproximación progresiva para calentar tendones y articulaciones.'
    ];
    prepChecklist = [
      'Toalla de gimnasio y termo de agua',
      'Ropa deportiva transpirable',
      'Plan de rutina del día claro'
    ];
    motivationalQuote = 'La disciplina de hoy es tu fuerza del mañana.';
  } else {
    tips = [
      'Prepara tu espacio y elimina distracciones 10 minutos antes de comenzar.',
      'Divide el bloque en pequeños sprints continuos para mantener el enfoque alto.',
      'Ten agua a la mano y mantén una postura cómoda.'
    ];
    prepChecklist = [
      'Materiales o herramientas necesarias listas',
      'Notificaciones del teléfono silenciadas'
    ];
  }

  return {
    greeting,
    tips,
    prepChecklist,
    motivationalQuote,
  };
}

startServer();
