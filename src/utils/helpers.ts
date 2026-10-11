import { Task } from '../types';

export function calculateMetrics(tasks: Task[]) {
  const safeTasks = Array.isArray(tasks) ? tasks.filter(Boolean) : [];
  const totalTasks = safeTasks.length;
  if (totalTasks === 0) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      pendingTasks: 0,
      totalEstimatedHours: 0,
      totalCompletedHours: 0,
      hoursPercentage: 0,
      overallCompletionPercentage: 0,
      goalsCompletionPercentage: 0,
    };
  }

  const completedTasks = safeTasks.filter((t) => t.status === 'completada').length;
  const inProgressTasks = safeTasks.filter((t) => t.status === 'en_progreso').length;
  const pendingTasks = safeTasks.filter((t) => t.status === 'pendiente').length;

  const totalEstimatedHours = safeTasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0);
  const totalCompletedHours = safeTasks.reduce((sum, t) => sum + Math.min(Number(t.completedHours) || 0, Number(t.estimatedHours) || 0), 0);

  const hoursPercentage = totalEstimatedHours > 0 
    ? Math.round((totalCompletedHours / totalEstimatedHours) * 100) 
    : 0;

  // Calculate percentage of target metrics achieved across all tasks
  let taskGoalPercentagesSum = 0;
  safeTasks.forEach((t) => {
    if (t.status === 'completada') {
      taskGoalPercentagesSum += 100;
    } else if (t.targetMetricValue && t.targetMetricValue > 0) {
      const current = Number(t.currentMetricValue) || 0;
      const pct = Math.min(100, Math.round((current / t.targetMetricValue) * 100));
      taskGoalPercentagesSum += Math.max(0, pct);
    } else if (t.estimatedHours && t.estimatedHours > 0) {
      const pct = Math.min(100, Math.round(((Number(t.completedHours) || 0) / t.estimatedHours) * 100));
      taskGoalPercentagesSum += Math.max(0, pct);
    }
  });

  const goalsCompletionPercentage = Math.round(taskGoalPercentagesSum / totalTasks);

  // Overall combined weighted average (50% tasks ratio / hours, 50% goals ratio)
  const taskStatusRatio = Math.round((completedTasks / totalTasks) * 100);
  const overallCompletionPercentage = Math.round((hoursPercentage * 0.4) + (goalsCompletionPercentage * 0.4) + (taskStatusRatio * 0.2));

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    pendingTasks,
    totalEstimatedHours,
    totalCompletedHours,
    hoursPercentage: Math.min(100, hoursPercentage),
    overallCompletionPercentage: Math.min(100, overallCompletionPercentage),
    goalsCompletionPercentage: Math.min(100, goalsCompletionPercentage),
  };
}

export function formatDateSpanish(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return dateString;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function formatShortDateSpanish(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return dateString;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short'
  });
}

export function getTaskProgressPercentage(task: Task): number {
  if (task.status === 'completada') return 100;
  if (task.targetMetricValue && task.targetMetricValue > 0) {
    const current = task.currentMetricValue || 0;
    return Math.min(100, Math.max(0, Math.round((current / task.targetMetricValue) * 100)));
  }
  if (task.estimatedHours > 0) {
    return Math.min(100, Math.max(0, Math.round(((task.completedHours || 0) / task.estimatedHours) * 100)));
  }
  return 0;
}

export function getPriorityBadgeColor(priority: string) {
  switch (priority) {
    case 'urgente':
      return 'bg-red-500/20 text-red-300 border-red-500/40';
    case 'alta':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    case 'media':
      return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    case 'baja':
    default:
      return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
  }
}

export function getStatusBadgeColor(status: string) {
  switch (status) {
    case 'completada':
      return 'bg-orange-500/20 text-orange-300 border-orange-500/50 shadow-[0_0_8px_rgba(249,115,22,0.35)]';
    case 'cancelada':
      return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    case 'en_progreso':
      return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    case 'bloqueada':
      return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    case 'pendiente':
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/40';
  }
}

export function getStatusLabelSpanish(status: string) {
  switch (status) {
    case 'completada': return 'Completada';
    case 'cancelada': return 'Cancelada';
    case 'en_progreso': return 'En Progreso';
    case 'bloqueada': return 'Bloqueada';
    case 'pendiente':
    default: return 'Pendiente';
  }
}
