import { Task } from '../types';

export interface DailyWorkStats {
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. "Lun 22"
  completedCount: number;
  totalScheduled: number;
  totalMinutes: number;
  efficiencyPct: number;
}

export interface WeeklyWorkStats {
  weekKey: string; // e.g. "Semana 38"
  startDate: string;
  endDate: string;
  completedCount: number;
  totalScheduled: number;
  totalHours: number;
  avgResolutionMinutes: number;
}

export interface MonthlyWorkStats {
  monthKey: string; // e.g. "2026-09"
  monthName: string; // e.g. "Septiembre"
  completedCount: number;
  totalCreated: number;
  completionRate: number;
  totalHours: number;
  avgResolutionMinutes: number;
}

export interface PriorityBreakdown {
  urgente: number;
  alta: number;
  media: number;
  baja: number;
}

export interface JobThingsMetrics {
  totalTasks: number;
  completedCount: number;
  pendingTodayCount: number;
  rolloverCount: number; // Tareas que quedaron de otros días y fueron arrastradas
  completionRate: number; // %
  totalResolutionMinutes: number;
  avgResolutionMinutes: number;
  estimatedVsActualRatio: number; // >1 = tardó más de lo estimado, <1 = resolvió más rápido
  priorityBreakdown: PriorityBreakdown;
  dailyTrend: DailyWorkStats[];
  weeklyTrend: WeeklyWorkStats[];
  monthlyTrend: MonthlyWorkStats[];
}

/**
 * Returns today's date in local YYYY-MM-DD format
 */
export function getLocalTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns tomorrow's date in local YYYY-MM-DD format
 */
export function getLocalTomorrowString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats minutes into human-readable string (e.g. 45 min, 1h 30m, 2h)
 */
export function formatResolutionTime(minutes?: number): string {
  if (!minutes || minutes <= 0) return 'Sin registrar';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Filters all tasks belonging to Job Things
 */
export function getJobThingsTasks(tasks: Task[]): Task[] {
  if (!Array.isArray(tasks)) return [];
  return tasks.filter(
    (t) => t && (t.category === 'job_things' || t.isJobTask === true || (t.tags && t.tags.includes('Trabajo')))
  );
}

/**
 * Computes deep metrics and analytical breakdowns for Job Things
 */
export function calculateJobThingsMetrics(tasks: Task[]): JobThingsMetrics {
  const jobTasks = getJobThingsTasks(tasks);
  const todayStr = getLocalTodayString();

  const totalTasks = jobTasks.length;
  const completedTasks = jobTasks.filter((t) => t.status === 'completada');
  const completedCount = completedTasks.length;

  const pendingTodayTasks = jobTasks.filter((t) => {
    if (t.status === 'completada') return false;
    const taskDate = t.assignedDate || t.dueDate || todayStr;
    return taskDate <= todayStr;
  });
  const pendingTodayCount = pendingTodayTasks.length;

  // Tareas con rollover (arrastradas para otros días)
  const rolloverTasks = jobTasks.filter(
    (t) => (t.rolloverCount && t.rolloverCount > 0) || Boolean(t.postponedFromDate)
  );
  const rolloverCount = rolloverTasks.length;

  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Resolution minutes
  let totalResolutionMinutes = 0;
  let tasksWithResolutionTimeCount = 0;
  let totalEstimatedMinutes = 0;

  completedTasks.forEach((t) => {
    const mins = t.resolutionMinutes || (t.completedHours ? Math.round(t.completedHours * 60) : 0);
    if (mins > 0) {
      totalResolutionMinutes += mins;
      tasksWithResolutionTimeCount++;
    }
    const estMins = t.estimatedHours ? Math.round(t.estimatedHours * 60) : 0;
    if (estMins > 0) {
      totalEstimatedMinutes += estMins;
    }
  });

  const avgResolutionMinutes =
    tasksWithResolutionTimeCount > 0 ? Math.round(totalResolutionMinutes / tasksWithResolutionTimeCount) : 0;

  const estimatedVsActualRatio =
    totalEstimatedMinutes > 0 ? Math.round((totalResolutionMinutes / totalEstimatedMinutes) * 100) / 100 : 1;

  // Breakdown by priority
  const priorityBreakdown: PriorityBreakdown = {
    urgente: 0,
    alta: 0,
    media: 0,
    baja: 0,
  };

  jobTasks.forEach((t) => {
    const p = t.priority || 'media';
    if (p === 'urgente') priorityBreakdown.urgente++;
    else if (p === 'alta') priorityBreakdown.alta++;
    else if (p === 'media') priorityBreakdown.media++;
    else priorityBreakdown.baja++;
  });

  // Daily Trend (last 14 days)
  const dailyTrend: DailyWorkStats[] = [];
  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayLabel = `${daysOfWeek[d.getDay()]} ${d.getDate()}`;

    const tasksOnDay = jobTasks.filter((t) => (t.assignedDate || t.dueDate || t.createdAt?.split('T')[0]) === dateStr);
    const completedOnDay = jobTasks.filter(
      (t) => (t.completedAt || t.assignedDate || t.dueDate || t.updatedAt?.split('T')[0]) === dateStr && t.status === 'completada'
    );

    let dayMinutes = 0;
    completedOnDay.forEach((t) => {
      dayMinutes += t.resolutionMinutes || (t.completedHours ? Math.round(t.completedHours * 60) : 60);
    });

    const totalScheduled = Math.max(tasksOnDay.length, completedOnDay.length);
    const eff = totalScheduled > 0 ? Math.round((completedOnDay.length / totalScheduled) * 100) : (completedOnDay.length > 0 ? 100 : 0);

    dailyTrend.push({
      date: dateStr,
      dayLabel,
      completedCount: completedOnDay.length,
      totalScheduled,
      totalMinutes: dayMinutes,
      efficiencyPct: eff,
    });
  }

  // Weekly Trend (last 4 weeks)
  const weeklyTrend: WeeklyWorkStats[] = [];
  for (let w = 3; w >= 0; w--) {
    const endDaysAgo = w * 7;
    const startDaysAgo = (w + 1) * 7 - 1;

    const endD = new Date();
    endD.setDate(endD.getDate() - endDaysAgo);
    const startD = new Date();
    startD.setDate(startD.getDate() - startDaysAgo);

    const startStr = `${startD.getFullYear()}-${String(startD.getMonth() + 1).padStart(2, '0')}-${String(startD.getDate()).padStart(2, '0')}`;
    const endStr = `${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, '0')}-${String(endD.getDate()).padStart(2, '0')}`;

    const completedInWeek = jobTasks.filter((t) => {
      if (t.status !== 'completada') return false;
      const d = t.completedAt || t.assignedDate || t.dueDate || t.updatedAt?.split('T')[0] || '';
      return d >= startStr && d <= endStr;
    });

    const scheduledInWeek = jobTasks.filter((t) => {
      const d = t.assignedDate || t.dueDate || t.createdAt?.split('T')[0] || '';
      return d >= startStr && d <= endStr;
    });

    let weekMinutes = 0;
    completedInWeek.forEach((t) => {
      weekMinutes += t.resolutionMinutes || (t.completedHours ? Math.round(t.completedHours * 60) : 60);
    });

    weeklyTrend.push({
      weekKey: w === 0 ? 'Esta Semana' : w === 1 ? 'Semana Pasada' : `Hace ${w} semanas`,
      startDate: startStr,
      endDate: endStr,
      completedCount: completedInWeek.length,
      totalScheduled: Math.max(scheduledInWeek.length, completedInWeek.length),
      totalHours: Math.round((weekMinutes / 60) * 10) / 10,
      avgResolutionMinutes: completedInWeek.length > 0 ? Math.round(weekMinutes / completedInWeek.length) : 0,
    });
  }

  // Monthly Trend (last 4 months)
  const monthlyTrend: MonthlyWorkStats[] = [];
  const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  for (let m = 3; m >= 0; m--) {
    const d = new Date();
    d.setMonth(d.getMonth() - m);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthName = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;

    const createdInMonth = jobTasks.filter((t) => (t.createdAt || '').startsWith(monthKey));
    const completedInMonth = jobTasks.filter((t) => {
      if (t.status !== 'completada') return false;
      const compDate = t.completedAt || t.assignedDate || t.dueDate || t.updatedAt || '';
      return compDate.startsWith(monthKey);
    });

    let monthMinutes = 0;
    completedInMonth.forEach((t) => {
      monthMinutes += t.resolutionMinutes || (t.completedHours ? Math.round(t.completedHours * 60) : 60);
    });

    const totalCreated = Math.max(createdInMonth.length, completedInMonth.length);
    const rate = totalCreated > 0 ? Math.round((completedInMonth.length / totalCreated) * 100) : (completedInMonth.length > 0 ? 100 : 0);

    monthlyTrend.push({
      monthKey,
      monthName: m === 0 ? `Este Mes (${monthNames[d.getMonth()]})` : monthName,
      completedCount: completedInMonth.length,
      totalCreated,
      completionRate: rate,
      totalHours: Math.round((monthMinutes / 60) * 10) / 10,
      avgResolutionMinutes: completedInMonth.length > 0 ? Math.round(monthMinutes / completedInMonth.length) : 0,
    });
  }

  return {
    totalTasks,
    completedCount,
    pendingTodayCount,
    rolloverCount,
    completionRate,
    totalResolutionMinutes,
    avgResolutionMinutes,
    estimatedVsActualRatio,
    priorityBreakdown,
    dailyTrend,
    weeklyTrend,
    monthlyTrend,
  };
}
