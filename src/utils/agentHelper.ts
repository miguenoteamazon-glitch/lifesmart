import { Task } from '../types';

export interface AgentRecommendation {
  greeting: string;
  urgencyLevel: 'info' | 'upcoming' | 'focus';
  tips: string[];
  motivationalQuote: string;
  prepChecklist: string[];
}

export interface UpcomingTaskAlert {
  task: Task;
  timeSlotLabel: string;
  startMinutes: number; // Minutes from 00:00
  isToday: boolean;
  status: 'past' | 'ongoing' | 'upcoming' | 'later' | 'anticipation';
  minutesUntilStart: number;
  hasPendingSubgoals?: boolean;
  pendingSubgoalsList?: string[];
  daysUntilDue?: number;
  alertType?: 'today_execution' | 'advance_subtasks_prep';
}

// Parses time strings like "21:00", "09:00 PM", "09:00 - 11:00", "21:00 - 22:30"
export function parseStartTimeToMinutes(timeStr?: string): number {
  if (!timeStr) return 12 * 60; // default 12:00 PM
  const firstPart = timeStr.split('-')[0].trim().toLowerCase();
  
  let hours = 0;
  let minutes = 0;

  if (firstPart.includes('pm') || firstPart.includes('am')) {
    const isPm = firstPart.includes('pm');
    const clean = firstPart.replace('pm', '').replace('am', '').trim();
    const [h, m] = clean.split(':').map(Number);
    hours = (h % 12) + (isPm ? 12 : 0);
    minutes = m || 0;
  } else if (firstPart.includes(':')) {
    const [h, m] = firstPart.split(':').map(Number);
    hours = h || 0;
    minutes = m || 0;
  } else {
    const h = Number(firstPart);
    if (!isNaN(h)) hours = h;
  }

  return hours * 60 + minutes;
}

export function formatMinutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m < 10 ? `0${m}` : m;
  return `${displayH}:${displayM} ${period}`;
}

export function getTodayTasks(tasks: Task[], referenceDate: Date = new Date()): Task[] {
  const todayStr = referenceDate.toISOString().split('T')[0];
  const dayOfWeek = referenceDate.getDay(); // 0 = Sun, 1 = Mon ...
  const safeList = Array.isArray(tasks) ? tasks : [];

  return safeList.filter((task) => {
    if (!task || task.status === 'completada' || task.status === 'cancelada') return false;

    // 1. Direct assigned date
    if (task.assignedDate === todayStr) return true;

    // 2. Recurring on this day of week
    if (Array.isArray(task.recurringDays) && task.recurringDays.includes(dayOfWeek)) {
      // Check if within bounds if dueDate is specified
      if (task.dueDate && task.dueDate < todayStr) return false;
      return true;
    }

    // 3. Due today
    if (task.dueDate === todayStr) return true;

    return false;
  });
}

// Find upcoming tasks in the next 1 to 7 days that have PENDING subgoals requiring advance preparation
export function getAdvancePreparationTasks(tasks: Task[], referenceDate: Date = new Date()): Task[] {
  const todayStr = referenceDate.toISOString().split('T')[0];
  const safeList = Array.isArray(tasks) ? tasks : [];

  const nextWeek = new Date(referenceDate);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  return safeList.filter((task) => {
    if (!task || task.status === 'completada' || task.status === 'cancelada') return false;

    // Only look at future tasks that are NOT scheduled for today
    const targetDate = task.assignedDate || task.dueDate;
    if (!targetDate || targetDate <= todayStr || targetDate > nextWeekStr) return false;

    // Must have pending subgoals
    const pendingSubgoals = Array.isArray(task.subgoals) 
      ? task.subgoals.filter(sg => !sg.completed) 
      : [];

    return pendingSubgoals.length > 0;
  });
}

export function getTodayAlerts(tasks: Task[], referenceDate: Date = new Date()): UpcomingTaskAlert[] {
  const todayTasks = getTodayTasks(tasks, referenceDate);
  const advanceTasks = getAdvancePreparationTasks(tasks, referenceDate);
  const nowMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();
  const todayStr = referenceDate.toISOString().split('T')[0];

  const todayAlerts: UpcomingTaskAlert[] = todayTasks.map((task) => {
    const startMinutes = parseStartTimeToMinutes(task.timeSlot);
    const durationMinutes = (task.dailyHours || 1) * 60;
    const endMinutes = startMinutes + durationMinutes;

    let status: 'past' | 'ongoing' | 'upcoming' | 'later' = 'later';
    const diff = startMinutes - nowMinutes;

    if (nowMinutes >= startMinutes && nowMinutes <= endMinutes) {
      status = 'ongoing';
    } else if (nowMinutes > endMinutes) {
      status = 'past';
    } else if (diff > 0 && diff <= 120) {
      status = 'upcoming'; // within next 2 hours
    } else {
      status = 'later';
    }

    const pendingSubgoals = Array.isArray(task.subgoals)
      ? task.subgoals.filter((s) => !s.completed).map((s) => s.title)
      : [];

    return {
      task,
      timeSlotLabel: task.timeSlot || formatMinutesToTime(startMinutes),
      startMinutes,
      isToday: true,
      status,
      minutesUntilStart: diff,
      hasPendingSubgoals: pendingSubgoals.length > 0,
      pendingSubgoalsList: pendingSubgoals,
      daysUntilDue: 0,
      alertType: 'today_execution',
    };
  });

  // Create advance preparation alerts for future tasks that have pending shopping / prep subtasks
  const advanceAlerts: UpcomingTaskAlert[] = advanceTasks.map((task) => {
    const targetDateStr = task.assignedDate || task.dueDate || todayStr;
    const targetDate = new Date(targetDateStr + 'T00:00:00');
    const today = new Date(todayStr + 'T00:00:00');
    const diffTime = targetDate.getTime() - today.getTime();
    const daysUntilDue = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const pendingSubgoals = Array.isArray(task.subgoals)
      ? task.subgoals.filter((s) => !s.completed).map((s) => s.title)
      : [];

    return {
      task,
      timeSlotLabel: `${task.timeSlot || 'Por definir'} (${targetDateStr})`,
      startMinutes: 9999, // After today's tasks in sorting
      isToday: false,
      status: 'anticipation',
      minutesUntilStart: daysUntilDue * 24 * 60,
      hasPendingSubgoals: true,
      pendingSubgoalsList: pendingSubgoals,
      daysUntilDue,
      alertType: 'advance_subtasks_prep',
    };
  });

  return [...todayAlerts, ...advanceAlerts].sort((a, b) => {
    // Ongoing first, then upcoming today, then later today, then advance prep, then past
    const score = (alert: UpcomingTaskAlert) => {
      if (alert.status === 'ongoing') return 1;
      if (alert.status === 'upcoming') return 2;
      if (alert.status === 'later') return 3;
      if (alert.status === 'anticipation') return 4;
      return 5;
    };
    return score(a) - score(b) || a.startMinutes - b.startMinutes;
  });
}

// Request Browser Notifications Permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

// Trigger Web Notification
export function sendAgentNotification(title: string, body: string, iconUrl?: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: iconUrl || '/favicon.ico',
        badge: '/favicon.ico',
      });
    } catch (e) {
      console.warn('Could not trigger notification:', e);
    }
  }
}

// Fetch AI recommendations from server or smart fallback
export async function fetchTaskRecommendations(task: Task, context?: string): Promise<AgentRecommendation> {
  try {
    const res = await fetch('/api/agent/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, context }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.recommendation) {
        return data.recommendation;
      }
    }
  } catch (err) {
    console.warn('Using client-side fallback recommendations:', err);
  }

  // Client-side rule engine fallback
  const title = (task.title || '').toLowerCase();
  const timeSlot = task.timeSlot || 'su horario programado';
  const pendingSubgoals = Array.isArray(task.subgoals) ? task.subgoals.filter(sg => !sg.completed) : [];
  const completedSubgoals = Array.isArray(task.subgoals) ? task.subgoals.filter(sg => sg.completed) : [];
  const hasSubgoals = Array.isArray(task.subgoals) && task.subgoals.length > 0;

  // Case 1: Task with pending subgoals (e.g. buying yeast, sugar, dough, supplies)
  if (hasSubgoals && pendingSubgoals.length > 0) {
    const pendingNames = pendingSubgoals.map(s => s.title).join(', ');
    return {
      greeting: `🛒 ¡Recordatorio de preparación previa! Tienes "${task.title}" para el ${task.assignedDate || task.dueDate || 'día programado'} a las ${timeSlot}, pero aún tienes pendiente: ${pendingNames}.`,
      urgencyLevel: 'upcoming',
      tips: [
        `Consigue o adelanta con tiempo: ${pendingNames} para que todo esté listo sin estrés antes de iniciar.`,
        `Marca cada subtarea en tu checklist conforme las vayas comprando o completando.`,
        `Una vez listas todas las compras, el Agente solo te recordará la ejecución principal de "${task.title}".`
      ],
      motivationalQuote: 'La preparación previa y anticipada garantiza una experiencia tranquila y resultados perfectos.',
      prepChecklist: pendingSubgoals.map(s => s.title)
    };
  }

  // Case 2: All subgoals already completed or single activity
  if (hasSubgoals && pendingSubgoals.length === 0 && completedSubgoals.length > 0) {
    return {
      greeting: `✨ ¡Excelente preparación! Ya tienes todas las compras y preparativos listos para "${task.title}" (${timeSlot}).`,
      urgencyLevel: 'info',
      tips: [
        `Todos tus suministros y subtareas previas están listos. Enfócate 100% en disfrutar la actividad.`,
        `Ten en mente tu objetivo: "${task.finalGoal || task.title}".`,
        `Al finalizar, registra tus horas en LifeBlocks para mantener tus estadísticas actualizadas.`
      ],
      motivationalQuote: 'Tuviste todo listo a tiempo; ahora es momento de disfrutar y crear.',
      prepChecklist: ['Comenzar con buena actitud', 'Disfrutar cada paso', 'Registrar tiempo al terminar']
    };
  }

  // Case 3: Sports / Cycling specific
  if (title.includes('bici') || title.includes('cicl') || title.includes('pedal')) {
    return {
      greeting: `🚴‍♂️ ¡Atento a tu bloque de "${task.title}" a las ${timeSlot}!`,
      urgencyLevel: 'upcoming',
      tips: [
        'Usa luces delantera blanca y trasera roja intermitente si es de noche, además de ropa de alta visibilidad.',
        'Lleva hidratación con electrolitos y revisa la presión de las llantas 15 min antes.',
        'Realiza 3-5 minutos de movilidad articular en rodillas y caderas antes de montar.',
        'Elige una ruta conocida o iluminada para pedalear con total tranquilidad.'
      ],
      motivationalQuote: 'La constancia en cada salida construye tu mejor versión física.',
      prepChecklist: [
        'Luces delantera y trasera cargadas',
        'Casco abrochado',
        'Termo de hidratación',
        'Ruta definida'
      ]
    };
  }

  // Default clean recommendation
  return {
    greeting: `🔔 Recordatorio de LifeBlocks: "${task.title}" programado para ${timeSlot}.`,
    urgencyLevel: 'info',
    tips: [
      `Dedica los primeros 5 minutos a preparar tu entorno y eliminar distracciones.`,
      `Ten en cuenta tu meta final: "${task.finalGoal || task.title}" para mantenerte motivado.`,
      `Al culminar, registra tus horas en LifeBlocks para mantener tus rachas activas.`
    ],
    motivationalQuote: 'Un pequeño bloque hoy es un gran paso hacia tus metas.',
    prepChecklist: ['Espacio despejado', 'Materiales listos', 'Móvil en modo concentración']
  };
}

export interface WeekDayPreview {
  dateStr: string; // YYYY-MM-DD
  dayName: string; // "Lunes", "Martes", etc.
  dayLabel: string; // "Mañana (Lunes)", "Martes 18", etc.
  isTomorrow: boolean;
  dayIndex: number; // 0=Dom, 1=Lun ...
  tasks: Task[];
  prepTips: {
    taskTitle: string;
    timeSlot: string;
    prepAdvice: string;
    pendingSubgoals: string[];
  }[];
}

export interface WeekOverviewSummary {
  referenceDateStr: string;
  isEvening: boolean;
  currentHour: number;
  totalUpcomingTasks: number;
  days: WeekDayPreview[];
  quickGreeting: string;
}

const DAY_NAMES_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Deduce smart advance preparation tips based on task title/category (e.g., gym clothes, swimsuit, materials)
export function getSmartTaskPrepAdvice(task: Task): string {
  const title = (task.title || '').toLowerCase();
  const desc = (task.description || '').toLowerCase();
  const category = (task.category || '').toLowerCase();
  const combined = `${title} ${desc} ${category}`;

  const pendingSubgoals = Array.isArray(task.subgoals) 
    ? task.subgoals.filter(s => !s.completed).map(s => s.title)
    : [];

  if (pendingSubgoals.length > 0) {
    return `Tener listo o comprar con tiempo: ${pendingSubgoals.join(', ')}`;
  }

  if (combined.includes('gimnasio') || combined.includes('gym') || combined.includes('pesas') || combined.includes('entren')) {
    return 'Dejar lista la ropa deportiva, zapatillas, toalla y termo de agua';
  }
  if (combined.includes('piscina') || combined.includes('nataci') || combined.includes('nadar')) {
    return 'Tener listo el traje de baño, gorro, gafas de natación y toalla seca';
  }
  if (combined.includes('bici') || combined.includes('cicl') || combined.includes('pedal')) {
    return 'Cargar luces (delantera/trasera), revisar presión de llantas y preparar casco';
  }
  if (combined.includes('pan') || combined.includes('cocin') || combined.includes('receta') || combined.includes('comida') || combined.includes('hornear')) {
    return 'Verificar ingredientes frescos y utensilios limpios con antelación';
  }
  if (combined.includes('estudio') || combined.includes('curso') || combined.includes('leer') || combined.includes('libro') || combined.includes('program')) {
    return 'Tener el espacio despejado, cuaderno de notas y dispositivo cargado';
  }
  if (combined.includes('reunion') || combined.includes('trabajo') || combined.includes('presentac')) {
    return 'Revisar notas previas, enlaces de conexión o documentos a presentar';
  }
  if (combined.includes('viaje') || combined.includes('paseo') || combined.includes('caminat')) {
    return 'Preparar ropa cómoda, calzado adecuado, protector solar y snacks';
  }

  return 'Organizar tu espacio y materiales 10 minutos antes para comenzar sin prisa';
}

// Calculate remaining days of the current week from tomorrow until Sunday (or next 6 days)
export function getRemainingWeekOverview(tasks: Task[], referenceDate: Date = new Date()): WeekOverviewSummary {
  const currentHour = referenceDate.getHours();
  // Is it evening? (after 18:00 / 6 PM) or can be toggled any time
  const isEvening = currentHour >= 18;
  const safeTasks = Array.isArray(tasks) ? tasks.filter(t => t && t.status !== 'completada' && t.status !== 'cancelada') : [];

  const days: WeekDayPreview[] = [];
  const currentDayOfWeek = referenceDate.getDay(); // 0 = Dom, 1 = Lun, 2 = Mar...

  // Days until Sunday of the current week (or at least next 6 days)
  // In standard ISO week (Lun=1 ... Dom=0/7), if today is Tuesday (2), remaining are Wed(3), Thu(4), Fri(5), Sat(6), Sun(0).
  // If today is Sunday (0), remaining is the upcoming week starting Monday.
  const daysToLookAhead = currentDayOfWeek === 0 ? 7 : (7 - currentDayOfWeek);

  for (let i = 1; i <= Math.max(daysToLookAhead, 4); i++) {
    const targetDate = new Date(referenceDate);
    targetDate.setDate(targetDate.getDate() + i);
    const targetDateStr = targetDate.toISOString().split('T')[0];
    const targetDayIndex = targetDate.getDay();
    const dayName = DAY_NAMES_ES[targetDayIndex];
    const isTomorrow = i === 1;

    // Find tasks for this day
    const matchingTasks = safeTasks.filter((task) => {
      // 1. Direct assigned date
      if (task.assignedDate === targetDateStr) return true;

      // 2. Recurring on this day of week
      if (Array.isArray(task.recurringDays) && task.recurringDays.includes(targetDayIndex)) {
        if (task.dueDate && task.dueDate < targetDateStr) return false;
        return true;
      }

      // 3. Due date match
      if (task.dueDate === targetDateStr) return true;

      return false;
    });

    const prepTips = matchingTasks.map((t) => {
      const pendingSubgoals = Array.isArray(t.subgoals) 
        ? t.subgoals.filter(s => !s.completed).map(s => s.title)
        : [];
      return {
        taskTitle: t.title,
        timeSlot: t.timeSlot || 'Horario flexible',
        prepAdvice: getSmartTaskPrepAdvice(t),
        pendingSubgoals,
      };
    });

    const dayLabel = isTomorrow
      ? `Mañana (${dayName})`
      : `${dayName} ${targetDate.getDate()}`;

    days.push({
      dateStr: targetDateStr,
      dayName,
      dayLabel,
      isTomorrow,
      dayIndex: targetDayIndex,
      tasks: matchingTasks,
      prepTips,
    });
  }

  const totalUpcomingTasks = days.reduce((acc, d) => acc + d.tasks.length, 0);

  let quickGreeting = '';
  if (days.length > 0 && days[0].tasks.length > 0) {
    const tomorrowTasks = days[0].tasks;
    const firstTask = tomorrowTasks[0];
    quickGreeting = `🌙 Plan Nocturno: Mañana ${days[0].dayName.toLowerCase()} tienes "${firstTask.title}" (${firstTask.timeSlot || 'programado'}). ${days[0].prepTips[0]?.prepAdvice || 'Prepárate con tiempo'}.`;
  } else if (totalUpcomingTasks > 0) {
    quickGreeting = `🌙 Plan Nocturno: Tienes ${totalUpcomingTasks} bloque(s) programados para el resto de la semana.`;
  } else {
    quickGreeting = `🌙 Plan Nocturno: Tienes el resto de la semana despejado para nuevas metas o descanso.`;
  }

  return {
    referenceDateStr: referenceDate.toISOString().split('T')[0],
    isEvening,
    currentHour,
    totalUpcomingTasks,
    days,
    quickGreeting,
  };
}
export async function askAgent(userMessage: string, todayTasks: Task[], allPendingTasks: Task[]): Promise<string> {
  try {
    const res = await fetch('/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userMessage, todayTasks, allPendingTasks }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.reply) return data.reply;
    }
  } catch (err) {
    console.warn('Error in askAgent endpoint:', err);
  }

  // Fallback response
  if (todayTasks.length > 0) {
    const list = todayTasks.map(t => `• ${t.title} (${t.timeSlot || 'horario libre'})`).join('\n');
    return `Tienes ${todayTasks.length} actividad(es) agendada(s) para hoy:\n${list}\n\n¡Organiza tu energía y no olvides registrar tu avance en LifeBlocks!`;
  }
  return `No tienes actividades específicas programadas para hoy, pero puedes revisar tus metas pendientes en la pestaña de Gestión de Bloques.`;
}
