import React, { useMemo, useState } from 'react';
import { Task, CategoryInfo } from '../types';
import { useTheme } from '../context/ThemeContext';
import { formatDurationSeconds, getTaskStartTime } from './TaskLiveTimer';
import {
  CheckCircle2,
  Clock,
  Timer,
  AlertCircle,
  Calendar,
  Sparkles,
  Copy,
  Check,
  ChevronRight,
  RotateCcw,
  Flame,
  ArrowRight
} from 'lucide-react';

interface CalendarDailyClosureCardProps {
  tasks: Task[];
  categories: CategoryInfo[];
  todayYMD: string;
  onAssignTaskDate?: (taskId: string, dateStr: string) => void;
  onQuickStatusChange?: (taskId: string, newStatus: any) => void;
  onOpenNewTaskModal?: (defaultDate?: string) => void;
}

export const CalendarDailyClosureCard: React.FC<CalendarDailyClosureCardProps> = ({
  tasks,
  categories,
  todayYMD,
  onAssignTaskDate,
  onQuickStatusChange,
  onOpenNewTaskModal
}) => {
  const { isDark } = useTheme();
  const [copied, setCopied] = useState(false);

  // Tomorrow's date string YYYY-MM-DD
  const tomorrowYMD = useMemo(() => {
    const d = new Date(todayYMD + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, [todayYMD]);

  // Tasks for today (assigned today, completed today, or created today)
  const todayTasks = useMemo(() => {
    return tasks.filter((t) => {
      const isAssignedToday = t.assignedDate === todayYMD || (!t.assignedDate && t.dueDate === todayYMD);
      const isCompletedToday = t.completedAt === todayYMD || (t.completedAtTimestamp && t.completedAtTimestamp.startsWith(todayYMD));
      const isCreatedToday = t.createdAt && t.createdAt.startsWith(todayYMD);
      return isAssignedToday || isCompletedToday || isCreatedToday;
    });
  }, [tasks, todayYMD]);

  const totalToday = todayTasks.length;
  const completedToday = todayTasks.filter((t) => t.status === 'completada').length;
  const pendingToday = todayTasks.filter((t) => t.status !== 'completada' && t.status !== 'cancelada').length;
  const complianceRate = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 100;

  // Average completion time for tasks completed today
  const { avgSeconds, completedTodayWithDuration } = useMemo(() => {
    const completedTasks = todayTasks.filter((t) => t.status === 'completada');
    if (completedTasks.length === 0) {
      return { avgSeconds: 0, completedTodayWithDuration: 0 };
    }

    let totalDuration = 0;
    completedTasks.forEach((t) => {
      if (t.durationSeconds && t.durationSeconds > 0) {
        totalDuration += t.durationSeconds;
      } else if (t.resolutionMinutes && t.resolutionMinutes > 0) {
        totalDuration += t.resolutionMinutes * 60;
      } else if (t.completedAtTimestamp && t.createdAt) {
        const start = getTaskStartTime(t);
        const end = new Date(t.completedAtTimestamp).getTime();
        if (end > start) {
          totalDuration += Math.floor((end - start) / 1000);
        } else {
          totalDuration += 1800; // 30m default
        }
      } else {
        totalDuration += 1800; // 30m default
      }
    });

    return {
      avgSeconds: Math.round(totalDuration / completedTasks.length),
      completedTodayWithDuration: completedTasks.length
    };
  }, [todayTasks]);

  // Tasks scheduled for tomorrow or remaining pending tasks that roll over to tomorrow
  const tomorrowTasks = useMemo(() => {
    return tasks.filter((t) => t.assignedDate === tomorrowYMD || (!t.assignedDate && t.dueDate === tomorrowYMD));
  }, [tasks, tomorrowYMD]);

  // Oldest pending tasks needing highest priority for tomorrow
  // Priority order: highest rollover count, earliest createdAt / postponedFromDate
  const oldestPendingTasks = useMemo(() => {
    const pendingList = tasks.filter((t) => t.status !== 'completada' && t.status !== 'cancelada');
    return [...pendingList].sort((a, b) => {
      // 1. Highest rollover count first
      const rollA = a.rolloverCount || 0;
      const rollB = b.rolloverCount || 0;
      if (rollA !== rollB) return rollB - rollA;

      // 2. Earliest date (assigned or dueDate)
      const dateA = a.assignedDate || a.dueDate || a.createdAt || '9999';
      const dateB = b.assignedDate || b.dueDate || b.createdAt || '9999';
      return dateA.localeCompare(dateB);
    }).slice(0, 4);
  }, [tasks]);

  const handleCopySummary = () => {
    const summaryText = `📋 CIERRE DE JORNADA (${todayYMD})
━━━━━━━━━━━━━━━━━━━━━
• Total Tareas Hoy: ${totalToday}
• Completadas: ${completedToday} (${complianceRate}%)
• Pendientes: ${pendingToday}
• Tiempo Promedio de Solución: ${avgSeconds > 0 ? formatDurationSeconds(avgSeconds) : 'N/A'}
• Para Mañana: ${tomorrowTasks.length + pendingToday} tareas proyectadas
• Tareas más antiguas a priorizar: ${oldestPendingTasks.map(t => `"${t.title}"`).join(', ') || 'Ninguna'}
━━━━━━━━━━━━━━━━━━━━━
Generado desde LifeBlocks`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className={`border rounded-3xl p-4 sm:p-5 shadow-xl space-y-4 transition-all ${
        isDark ? 'bg-[#11192e] border-[#293656]' : 'bg-white border-slate-200 shadow-slate-900/5'
      }`}
    >
      {/* Block Header */}
      <div className="flex items-start justify-between gap-2 border-b pb-3 border-dashed border-slate-700/40">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-black flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Resumen Total & Cierre</span>
          </span>
          <h3 className={`text-sm sm:text-base font-black leading-tight mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Tareas al Día de Hoy
          </h3>
          <p className="text-[10px] font-mono text-slate-400 mt-0.5">
            {todayYMD}
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopySummary}
          title="Copiar balance de cierre al portapapeles"
          className={`px-2 sm:px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold flex items-center space-x-1 transition-all cursor-pointer border ${
            copied
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : isDark
              ? 'bg-[#0b1326] text-slate-300 hover:text-white border-[#2d3449] hover:border-cyan-400'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-cyan-400" />
              <span>Copiar Cierre</span>
            </>
          )}
        </button>
      </div>

      {/* 1. KPIs Total, Pendientes, Completadas */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {/* Total */}
        <div className={`p-2.5 rounded-2xl border ${isDark ? 'bg-[#0b1326] border-[#222e4c]' : 'bg-slate-50 border-slate-200'}`}>
          <div className="text-[9px] font-mono uppercase font-bold text-slate-400">Total Hoy</div>
          <div className={`text-base sm:text-lg font-black font-mono mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {totalToday}
          </div>
          <div className="text-[8.5px] font-mono text-slate-400">tareas</div>
        </div>

        {/* Pendientes */}
        <div className={`p-2.5 rounded-2xl border ${
          pendingToday > 0
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            : isDark ? 'bg-[#0b1326] border-[#222e4c] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div className="text-[9px] font-mono uppercase font-bold">Pendientes</div>
          <div className="text-base sm:text-lg font-black font-mono mt-0.5 text-amber-400">
            {pendingToday}
          </div>
          <div className="text-[8.5px] font-mono opacity-80">por hacer</div>
        </div>

        {/* Completadas */}
        <div className="p-2.5 rounded-2xl border bg-orange-500/10 border-orange-500/30 text-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.15)]">
          <div className="text-[9px] font-mono uppercase font-bold">Completadas</div>
          <div className="text-base sm:text-lg font-black font-mono mt-0.5 text-orange-400 font-extrabold">
            {completedToday}
          </div>
          <div className="text-[8.5px] font-mono text-orange-300/80">{complianceRate}% éxito</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-[10px] font-mono font-bold">
          <span className="text-slate-400">Tasa de resolución diaria:</span>
          <span className={complianceRate === 100 ? 'text-emerald-400' : 'text-cyan-300'}>
            {complianceRate}%
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden border border-slate-700/50">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-amber-500 to-orange-500 transition-all duration-500"
            style={{ width: `${complianceRate}%` }}
          />
        </div>
      </div>

      {/* 2. Tiempo Promedio de Tareas */}
      <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
        isDark ? 'bg-[#0b1326] border-[#2d3449]' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(249,115,22,0.3)]">
            <Timer className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[9.5px] font-mono uppercase font-bold text-slate-400">
              Tiempo Promedio de Solución
            </div>
            <div className="text-xs sm:text-sm font-black font-mono text-slate-100 mt-0.5">
              {avgSeconds > 0 ? formatDurationSeconds(avgSeconds) : 'Aún sin resolver'}
            </div>
          </div>
        </div>

        <span className="text-[9px] font-mono text-slate-400 text-right">
          {completedTodayWithDuration > 0
            ? `${completedTodayWithDuration} tarea(s) resueltas`
            : 'En cronómetro'}
        </span>
      </div>

      {/* 3. Cierre del Día / Balance de Jornada */}
      <div className="p-3.5 rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-cyan-950/20 via-[#0a1226] to-[#0c1833] space-y-2 shadow-md shadow-cyan-950/20">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-black text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Cierre de la Jornada</span>
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-200 border border-cyan-400/30">
            Balance
          </span>
        </div>

        <p className="text-xs text-slate-200 leading-relaxed font-sans">
          Hoy se hicieron <strong className="text-cyan-300 font-bold">{totalToday}</strong> tareas: se completaron{' '}
          <strong className="text-orange-400 font-bold">{completedToday}</strong> y quedaron pendientes{' '}
          <strong className="text-amber-300 font-bold">{pendingToday}</strong>.
          {avgSeconds > 0 && (
            <span> El tiempo promedio de solución de tareas fue de <strong className="text-emerald-300 font-bold">{formatDurationSeconds(avgSeconds)}</strong>.</span>
          )}
        </p>

        {/* Status for Tomorrow */}
        <div className="pt-2 border-t border-cyan-500/20 flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-300">Para mañana quedan:</span>
          <span className="font-bold text-amber-300">
            {pendingToday + tomorrowTasks.length} tarea(s)
          </span>
        </div>
      </div>

      {/* 4. Recomendación: Dar Prioridad a las más Antiguas */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-300">
          <span className="flex items-center gap-1 text-amber-400">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Prioridad: Tareas más Antiguas</span>
          </span>
          <span className="text-[9px] text-slate-400">Pendientes</span>
        </div>

        {oldestPendingTasks.length === 0 ? (
          <div className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-center text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
            <span>¡Excelente! No hay tareas pendientes acumuladas.</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {oldestPendingTasks.map((task) => {
              const rollCount = task.rolloverCount || 0;
              const hasRollover = rollCount > 0 || task.isRollover;

              return (
                <div
                  key={task.id}
                  className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                    hasRollover
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                      : isDark
                      ? 'bg-[#0b1326] border-[#222d46] text-slate-200'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      {hasRollover && (
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-0.5 shrink-0">
                          <RotateCcw className="w-2 h-2 text-amber-400" />
                          <span>+{rollCount || 1}d atraso</span>
                        </span>
                      )}
                      <p className="text-xs font-bold truncate">
                        {task.title}
                      </p>
                    </div>
                    <div className="text-[9.5px] font-mono text-slate-400 flex items-center space-x-1.5 mt-0.5">
                      <span className="capitalize text-rose-400 font-bold">{task.priority}</span>
                      <span>•</span>
                      <span>{task.assignedDate || task.dueDate || 'Sin fecha'}</span>
                    </div>
                  </div>

                  {/* Move to tomorrow action */}
                  {onAssignTaskDate && (
                    <button
                      type="button"
                      onClick={() => onAssignTaskDate(task.id, tomorrowYMD)}
                      title="Asignar prioritariamente para mañana"
                      className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-[9.5px] font-mono font-bold flex items-center space-x-0.5 cursor-pointer shrink-0 transition-all active:scale-95"
                    >
                      <span>A Mañana</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
