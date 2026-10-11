import React, { useState, useMemo } from 'react';
import { Task, CategoryInfo, Priority, TaskStatus } from '../types';
import { useTheme } from '../context/ThemeContext';
import { JOB_THINGS_HERO_IMAGE } from '../data/initialData';
import {
  calculateJobThingsMetrics,
  formatResolutionTime,
  getLocalTodayString,
  getLocalTomorrowString,
  getJobThingsTasks,
} from '../utils/jobThingsHelpers';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Cell,
} from 'recharts';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Layers,
  ChevronRight,
  Sparkles,
  Flame,
  Award,
  RotateCcw,
  Zap,
  Target,
  Edit3,
  Trash2,
  CheckSquare,
  Building,
  Filter,
  Check,
  X,
  CalendarDays,
  Timer,
  BarChart3,
  ArrowUpRight,
  CalendarClock,
} from 'lucide-react';

interface JobThingsHubViewProps {
  tasks: Task[];
  categories: CategoryInfo[];
  onOpenNewTaskModal?: (prefilled?: Partial<Task>) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onQuickStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onUpdateTaskCustom?: (task: Task) => void;
}

export const JobThingsHubView: React.FC<JobThingsHubViewProps> = ({
  tasks,
  categories,
  onOpenNewTaskModal,
  onEditTask,
  onDeleteTask,
  onQuickStatusChange,
  onUpdateTaskCustom,
}) => {
  const { isDark } = useTheme();
  const todayStr = getLocalTodayString();
  const tomorrowStr = getLocalTomorrowString();

  // Active view filters
  const [activeTab, setActiveTab] = useState<'hoy' | 'otros_dias' | 'completadas' | 'analisis' | 'prioridades'>('hoy');
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'dia' | 'semana' | 'mes'>('dia');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Resolution time modal state
  const [resolvingTask, setResolvingTask] = useState<Task | null>(null);
  const [resolutionInputMinutes, setResolutionInputMinutes] = useState<number>(45);

  // Quick new job task drawer
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<Priority>('alta');
  const [quickEstHours, setQuickEstHours] = useState<number>(1.5);
  const [quickClientProject, setQuickClientProject] = useState('');
  const [quickDueDate, setQuickDueDate] = useState(todayStr);

  // Filter job tasks
  const jobTasks = useMemo(() => getJobThingsTasks(tasks), [tasks]);
  const metrics = useMemo(() => calculateJobThingsMetrics(tasks), [tasks]);

  // Tasks of today
  const todayTasks = useMemo(() => {
    return jobTasks.filter((t) => {
      const taskDate = t.assignedDate || t.dueDate || todayStr;
      return t.status !== 'completada' && taskDate <= todayStr;
    });
  }, [jobTasks, todayStr]);

  // Tasks for other days / future / backlog
  const otherDaysTasks = useMemo(() => {
    return jobTasks.filter((t) => {
      const taskDate = t.assignedDate || t.dueDate || '';
      const isPostponed = (t.rolloverCount && t.rolloverCount > 0) || Boolean(t.postponedFromDate);
      return t.status !== 'completada' && (taskDate > todayStr || isPostponed);
    });
  }, [jobTasks, todayStr]);

  // Completed tasks
  const completedTasks = useMemo(() => {
    return jobTasks.filter((t) => t.status === 'completada');
  }, [jobTasks]);

  // Filtered by priority and search
  const filterList = (list: Task[]) => {
    return list.filter((t) => {
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = (t.title || '').toLowerCase().includes(query);
        const matchDesc = (t.description || '').toLowerCase().includes(query);
        const matchClient = (t.clientOrProject || '').toLowerCase().includes(query);
        return matchTitle || matchDesc || matchClient;
      }
      return true;
    });
  };

  // Actions
  const handleRolloverToTomorrow = (task: Task) => {
    const updated: Task = {
      ...task,
      assignedDate: tomorrowStr,
      dueDate: tomorrowStr,
      rolloverCount: (task.rolloverCount || 0) + 1,
      postponedFromDate: task.assignedDate || todayStr,
      updatedAt: todayStr,
    };
    if (onUpdateTaskCustom) {
      onUpdateTaskCustom(updated);
    } else if (onEditTask) {
      onEditTask(updated);
    }
  };

  const handleMoveToToday = (task: Task) => {
    const updated: Task = {
      ...task,
      assignedDate: todayStr,
      dueDate: todayStr,
      updatedAt: todayStr,
    };
    if (onUpdateTaskCustom) {
      onUpdateTaskCustom(updated);
    } else if (onEditTask) {
      onEditTask(updated);
    }
  };

  const handleOpenResolveModal = (task: Task) => {
    setResolvingTask(task);
    const initialMins = task.resolutionMinutes || (task.estimatedHours ? Math.round(task.estimatedHours * 60) : 45);
    setResolutionInputMinutes(initialMins);
  };

  const handleConfirmResolution = () => {
    if (!resolvingTask) return;
    const completedHours = Math.round((resolutionInputMinutes / 60) * 10) / 10;
    const updated: Task = {
      ...resolvingTask,
      status: 'completada',
      resolutionMinutes: resolutionInputMinutes,
      completedHours: Math.max(completedHours, 0.5),
      completedAt: todayStr,
      updatedAt: todayStr,
    };
    if (onUpdateTaskCustom) {
      onUpdateTaskCustom(updated);
    } else if (onEditTask) {
      onEditTask(updated);
    } else if (onQuickStatusChange) {
      onQuickStatusChange(resolvingTask.id, 'completada');
    }
    setResolvingTask(null);
  };

  const handleQuickCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    if (onOpenNewTaskModal) {
      onOpenNewTaskModal({
        title: quickTitle.trim(),
        category: 'job_things',
        priority: quickPriority,
        status: 'pendiente',
        estimatedHours: quickEstHours,
        completedHours: 0,
        assignedDate: quickDueDate,
        dueDate: quickDueDate,
        clientOrProject: quickClientProject.trim() || undefined,
        isJobTask: true,
        finalGoal: `Completar exitosamente ${quickTitle.trim()} con entregables listos`,
        tags: ['Trabajo', 'Job Things'],
      });
    }

    setQuickTitle('');
    setQuickClientProject('');
    setIsQuickAdding(false);
  };

  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case 'urgente':
        return {
          label: '🔥 Urgente',
          style: isDark
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            : 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
        };
      case 'alta':
        return {
          label: '⚡ Alta',
          style: isDark
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            : 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
        };
      case 'media':
        return {
          label: '📋 Media',
          style: isDark
            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
            : 'bg-indigo-100 text-indigo-800 border-indigo-300 font-bold',
        };
      case 'baja':
      default:
        return {
          label: '☕ Baja',
          style: isDark
            ? 'bg-slate-700/40 text-slate-300 border-slate-600'
            : 'bg-slate-100 text-slate-700 border-slate-300 font-semibold',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Hero */}
      <div
        className={`relative overflow-hidden rounded-3xl border transition-all duration-300 ${
          isDark
            ? 'bg-gradient-to-br from-[#121633] via-[#161c42] to-[#0c0f24] border-indigo-500/30 shadow-2xl'
            : 'bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/70 border-indigo-200 shadow-md'
        }`}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold tracking-wide uppercase border bg-indigo-500/15 border-indigo-500/30 text-indigo-400">
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
              <span>Colección Oficial • Job Things</span>
            </div>

            <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Gestión Diaria & Productividad Laboral 💼
            </h2>

            <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Tu centro de mando para tareas del trabajo día a día: clasifícalas por nivel de importancia, traslada tareas que quedan para otros días (rollover), y analiza tu volumen de tareas y tiempos de solución promedio.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (onOpenNewTaskModal) {
                    onOpenNewTaskModal({ category: 'job_things', isJobTask: true });
                  } else {
                    setIsQuickAdding(true);
                  }
                }}
                className="px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center space-x-2 cursor-pointer bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:brightness-110 text-white shadow-indigo-500/25 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nueva Tarea de Trabajo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('analisis')}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs border transition-all flex items-center space-x-2 cursor-pointer ${
                  activeTab === 'analisis'
                    ? isDark
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400'
                      : 'bg-indigo-100 text-indigo-800 border-indigo-300'
                    : isDark
                      ? 'bg-[#182142] text-slate-200 border-[#2d3449] hover:bg-slate-800'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span>Ver Análisis (Día/Sem/Mes)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsQuickAdding((prev) => !prev)}
                className={`px-3.5 py-2.5 rounded-xl font-semibold text-xs border transition-all flex items-center space-x-1.5 cursor-pointer ${
                  isDark
                    ? 'bg-[#121831] text-indigo-300 border-indigo-500/30 hover:bg-indigo-950/40'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Captura Rápida</span>
              </button>
            </div>
          </div>

          {/* Right Image Banner Preview */}
          <div className="shrink-0 w-full sm:w-64 h-36 sm:h-44 rounded-2xl overflow-hidden border border-indigo-500/30 relative shadow-xl">
            <img
              src={JOB_THINGS_HERO_IMAGE}
              alt="Job Things Workspace"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover filter brightness-95 hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3">
              <span className="text-[11px] font-mono font-bold text-white bg-indigo-600/80 px-2 py-0.5 rounded-md backdrop-blur-sm">
                💼 Entorno Profesional Activo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Inline Drawer */}
      {isQuickAdding && (
        <form
          onSubmit={handleQuickCreateTask}
          className={`p-5 rounded-2xl border transition-all animate-in fade-in shadow-xl ${
            isDark ? 'bg-[#0f142b] border-indigo-500/40' : 'bg-indigo-50/70 border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20 mb-3">
            <h4 className={`text-xs font-bold font-mono uppercase flex items-center space-x-2 ${isDark ? 'text-indigo-300' : 'text-indigo-800'}`}>
              <Zap className="w-4 h-4 text-indigo-400" />
              <span>Creación Rápida de Tarea de Trabajo</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsQuickAdding(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[10px] font-mono uppercase font-bold text-slate-400">Título de la Tarea</label>
              <input
                type="text"
                required
                placeholder="Ej. Revisar cotización de cliente, enviar entregable..."
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className={`w-full mt-1 px-3 py-2 text-xs rounded-xl border focus:outline-none ${
                  isDark
                    ? 'bg-[#171e3d] border-[#2e375e] text-white focus:border-indigo-400'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600'
                }`}
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase font-bold text-slate-400">Prioridad / Importancia</label>
              <select
                value={quickPriority}
                onChange={(e) => setQuickPriority(e.target.value as Priority)}
                className={`w-full mt-1 px-3 py-2 text-xs rounded-xl border focus:outline-none cursor-pointer ${
                  isDark
                    ? 'bg-[#171e3d] border-[#2e375e] text-white focus:border-indigo-400'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600'
                }`}
              >
                <option value="urgente">🔥 Urgente / Crítica</option>
                <option value="alta">⚡ Alta Prioridad</option>
                <option value="media">📋 Media</option>
                <option value="baja">☕ Baja</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase font-bold text-slate-400">Horas Estimadas</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                value={quickEstHours}
                onChange={(e) => setQuickEstHours(parseFloat(e.target.value) || 1)}
                className={`w-full mt-1 px-3 py-2 text-xs rounded-xl border focus:outline-none ${
                  isDark
                    ? 'bg-[#171e3d] border-[#2e375e] text-white focus:border-indigo-400'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600'
                }`}
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase font-bold text-slate-400">Cliente o Proyecto</label>
              <input
                type="text"
                placeholder="Ej. Nexus Corp, IT, Operaciones..."
                value={quickClientProject}
                onChange={(e) => setQuickClientProject(e.target.value)}
                className={`w-full mt-1 px-3 py-2 text-xs rounded-xl border focus:outline-none ${
                  isDark
                    ? 'bg-[#171e3d] border-[#2e375e] text-white focus:border-indigo-400'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600'
                }`}
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase font-bold text-slate-400">Fecha Asignada</label>
              <input
                type="date"
                value={quickDueDate}
                onChange={(e) => setQuickDueDate(e.target.value)}
                className={`w-full mt-1 px-3 py-2 text-xs rounded-xl border focus:outline-none ${
                  isDark
                    ? 'bg-[#171e3d] border-[#2e375e] text-white focus:border-indigo-400'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600'
                }`}
              />
            </div>

            <div className="sm:col-span-2 flex items-end justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsQuickAdding(false)}
                className="px-3.5 py-2 text-xs rounded-xl font-bold bg-slate-700/50 hover:bg-slate-700 text-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 text-white shadow-md cursor-pointer"
              >
                Guardar Tarea
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Primary KPI & Counters Ribbon (Requested: "un contador de tareas", "tiempo de solucion") */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Tasks Counter */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-[#0f142b] border-[#242b50]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Total Tareas</span>
            <Briefcase className="w-4 h-4 text-indigo-400" />
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold mt-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {metrics.totalTasks}
          </div>
          <p className="text-[11px] font-mono text-emerald-500 mt-1 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{metrics.completedCount} completadas ({metrics.completionRate}%)</span>
          </p>
        </div>

        {/* Pending Today Counter */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-[#0f142b] border-[#242b50]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Para Hoy</span>
            <Calendar className="w-4 h-4 text-cyan-400" />
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold mt-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {metrics.pendingTodayCount}
          </div>
          <p className="text-[11px] font-mono text-slate-400 mt-1">
            {todayTasks.length === 0 ? '¡Al día sin pendientes!' : 'Pendientes de resolver hoy'}
          </p>
        </div>

        {/* Rollover / Postponed to other days */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-[#0f142b] border-[#242b50]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Otros Días / Rollover</span>
            <RotateCcw className="w-4 h-4 text-amber-400" />
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold mt-1.5 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
            {metrics.rolloverCount}
          </div>
          <p className="text-[11px] font-mono text-amber-500 mt-1">
            Tareas arrastradas o pospuestas
          </p>
        </div>

        {/* Average Resolution Time */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-[#0f142b] border-[#242b50]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Tiempo de Solución</span>
            <Timer className="w-4 h-4 text-purple-400" />
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold mt-1.5 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
            {formatResolutionTime(metrics.avgResolutionMinutes)}
          </div>
          <p className="text-[11px] font-mono text-slate-400 mt-1">
            Promedio real por tarea
          </p>
        </div>

        {/* Urgent / Critical Priority */}
        <div
          className={`p-4 rounded-2xl border transition-all col-span-2 sm:col-span-1 ${
            isDark ? 'bg-[#0f142b] border-[#242b50]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Prioridad Urgente</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold mt-1.5 ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
            {metrics.priorityBreakdown.urgente}
          </div>
          <p className="text-[11px] font-mono text-slate-400 mt-1">
            {metrics.priorityBreakdown.alta} con prioridad Alta
          </p>
        </div>
      </div>

      {/* Main Navigation Tabs within Job Things */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 border-indigo-500/20">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('hoy')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'hoy'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : isDark
                  ? 'bg-[#101530] text-slate-300 hover:text-white border border-[#2d3449]'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Agenda de Hoy</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
              {todayTasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('otros_dias')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'otros_dias'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : isDark
                  ? 'bg-[#101530] text-slate-300 hover:text-white border border-[#2d3449]'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Para Otros Días (Rollover)</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
              {otherDaysTasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('completadas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'completadas'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : isDark
                  ? 'bg-[#101530] text-slate-300 hover:text-white border border-[#2d3449]'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Resueltas</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
              {completedTasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prioridades')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'prioridades'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : isDark
                  ? 'bg-[#101530] text-slate-300 hover:text-white border border-[#2d3449]'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Por Importancia</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analisis')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'analisis'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : isDark
                  ? 'bg-[#101530] text-slate-300 hover:text-white border border-[#2d3449]'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Análisis (Día / Sem / Mes)</span>
          </button>
        </div>

        {/* Priority Quick Filter */}
        <div className="flex items-center gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className={`px-3 py-1.5 text-xs rounded-xl border font-mono font-medium focus:outline-none cursor-pointer ${
              isDark
                ? 'bg-[#0f142b] border-[#242b50] text-slate-200'
                : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            <option value="all">Todas las Prioridades</option>
            <option value="urgente">🔥 Solo Urgentes</option>
            <option value="alta">⚡ Solo Altas</option>
            <option value="media">📋 Solo Medias</option>
            <option value="baja">☕ Solo Bajas</option>
          </select>
        </div>
      </div>

      {/* VIEW 1: AGENDA DE HOY */}
      {activeTab === 'hoy' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`text-base font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Tareas Asignadas para Hoy ({todayTasks.length})</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {todayStr}
            </span>
          </div>

          {filterList(todayTasks).length === 0 ? (
            <div
              className={`p-8 rounded-2xl border text-center space-y-3 ${
                isDark ? 'bg-[#0f142b] border-[#242b50]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                ¡No tienes tareas pendientes para hoy!
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Excelente ritmo de trabajo. Puedes agregar una nueva tarea o revisar tareas que quedaron para otros días.
              </p>
              <button
                type="button"
                onClick={() => setIsQuickAdding(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                + Crear Tarea de Trabajo
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filterList(todayTasks).map((task) => {
                const priorityBadge = getPriorityBadge(task.priority);
                const hasRollover = (task.rolloverCount && task.rolloverCount > 0) || Boolean(task.postponedFromDate);

                return (
                  <div
                    key={task.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md ${
                      isDark
                        ? 'bg-[#0f142b] hover:bg-[#121936] border-indigo-500/30 hover:border-indigo-400'
                        : 'bg-white hover:bg-indigo-50/40 border-indigo-100 hover:border-indigo-300'
                    }`}
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* High visibility work badge */}
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 flex items-center space-x-1">
                          <Briefcase className="w-3 h-3 text-indigo-400" />
                          <span>JOB THINGS</span>
                        </span>

                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono border ${priorityBadge.style}`}>
                          {priorityBadge.label}
                        </span>

                        {hasRollover && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1">
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Arrastrada {task.rolloverCount ? `+${task.rolloverCount}d` : 'de ayer'}</span>
                          </span>
                        )}

                        {task.clientOrProject && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center space-x-1">
                            <Building className="w-2.5 h-2.5" />
                            <span>{task.clientOrProject}</span>
                          </span>
                        )}
                      </div>

                      <h4 className={`text-sm sm:text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className={`text-xs line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400 pt-1">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Est: {task.estimatedHours}h ({Math.round(task.estimatedHours * 60)}m)</span>
                        </span>

                        {task.timeSlot && (
                          <span className="flex items-center space-x-1">
                            <CalendarDays className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{task.timeSlot}</span>
                          </span>
                        )}

                        {task.subgoals && task.subgoals.length > 0 && (
                          <span className="flex items-center space-x-1">
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                            <span>
                              {task.subgoals.filter((s) => s.completed).length}/{task.subgoals.length} sub-hitos
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Operational Action Buttons (Complete with resolution time OR Rollover to tomorrow) */}
                    <div className="flex flex-wrap md:flex-col items-center md:items-end gap-2 shrink-0">
                      {/* 1-click complete & record solution time */}
                      <button
                        type="button"
                        onClick={() => handleOpenResolveModal(task)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/40"
                        title="Marcar como resuelta y registrar tiempo de solución"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Completar (Tiempo Solución)</span>
                      </button>

                      {/* 1-click rollover: mover a mañana */}
                      <button
                        type="button"
                        onClick={() => handleRolloverToTomorrow(task)}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center space-x-1.5 cursor-pointer bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-white border border-amber-500/30"
                        title="Mover a mañana si no alcanzaste a hacerla hoy"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Mover a Mañana ➡️</span>
                      </button>

                      <div className="flex items-center space-x-1 pt-1">
                        {onEditTask && (
                          <button
                            type="button"
                            onClick={() => onEditTask(task)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 cursor-pointer"
                            title="Editar Tarea"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteTask && (
                          <button
                            type="button"
                            onClick={() => onDeleteTask(task.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                            title="Eliminar Tarea"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: TAREAS PARA OTROS DÍAS / ROLLOVER (User specifically mentioned: "aveces quedan tareas para otros dias") */}
      {activeTab === 'otros_dias' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-base font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Tareas para Otros Días & Rollover ({otherDaysTasks.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tareas laborales que no se alcanzaron a realizar y se trasladaron para mañana, fechas futuras o backlog.
              </p>
            </div>
          </div>

          {filterList(otherDaysTasks).length === 0 ? (
            <div
              className={`p-8 rounded-2xl border text-center space-y-3 ${
                isDark ? 'bg-[#0f142b] border-[#242b50]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <Award className="w-10 h-10 text-amber-400 mx-auto" />
              <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                No tienes tareas pendientes para otros días
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No hay tareas acumuladas ni pendientes de días pasados.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filterList(otherDaysTasks).map((task) => {
                const priorityBadge = getPriorityBadge(task.priority);

                return (
                  <div
                    key={task.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isDark
                        ? 'bg-[#0f142b] border-amber-500/30 hover:border-amber-400'
                        : 'bg-white border-amber-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center space-x-1">
                          <RotateCcw className="w-3 h-3 text-amber-400" />
                          <span>ROLLOVER / OTRO DÍA</span>
                        </span>

                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono border ${priorityBadge.style}`}>
                          {priorityBadge.label}
                        </span>

                        {task.rolloverCount && task.rolloverCount > 0 && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            Arrastrada {task.rolloverCount} veces
                          </span>
                        )}

                        {task.clientOrProject && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            🏢 {task.clientOrProject}
                          </span>
                        )}
                      </div>

                      <h4 className={`text-sm sm:text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className={`text-xs line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400 pt-1">
                        <span className="flex items-center space-x-1 text-amber-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Programada: {task.assignedDate || task.dueDate || 'Sin fecha específica'}</span>
                        </span>
                        {task.postponedFromDate && (
                          <span className="text-[11px] text-slate-500">
                            (original: {task.postponedFromDate})
                          </span>
                        )}
                        <span>Est: {task.estimatedHours}h</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap md:flex-col items-center md:items-end gap-2 shrink-0">
                      {/* Traer a hoy */}
                      <button
                        type="button"
                        onClick={() => handleMoveToToday(task)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer bg-indigo-500/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40"
                        title="Pasar esta tarea a la agenda de hoy"
                      >
                        <CalendarClock className="w-3.5 h-3.5" />
                        <span>Pasar a Hoy ⬅️</span>
                      </button>

                      {/* Completar */}
                      <button
                        type="button"
                        onClick={() => handleOpenResolveModal(task)}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center space-x-1.5 cursor-pointer bg-emerald-500/15 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30"
                      >
                        <Check className="w-3 h-3" />
                        <span>Completar Ahora</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: COMPLETADAS CON TIEMPO DE RESOLUCIÓN */}
      {activeTab === 'completadas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`text-base font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Tareas Completadas & Registro de Solución ({completedTasks.length})</span>
            </h3>
            <span className="text-xs font-mono text-emerald-400">
              Total tiempo: {formatResolutionTime(metrics.totalResolutionMinutes)}
            </span>
          </div>

          {filterList(completedTasks).length === 0 ? (
            <div className={`p-8 rounded-2xl border text-center ${isDark ? 'bg-[#0f142b] border-[#242b50]' : 'bg-slate-50 border-slate-200'}`}>
              <CheckCircle2 className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Aún no hay tareas marcadas como completadas en Job Things.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filterList(completedTasks).map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_16px_rgba(249,115,22,0.25)] ring-1 ring-orange-500/30 ${
                    isDark ? 'bg-[#0f142b]/70 border-orange-500/40' : 'bg-orange-50/50 border-orange-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                      <h4 className={`text-sm font-bold line-through decoration-orange-400/90 decoration-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                        {task.title}
                      </h4>
                    </div>
                    {task.clientOrProject && (
                      <span className="text-[11px] font-mono text-slate-400 block pl-4">
                        🏢 {task.clientOrProject}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 text-xs font-mono shrink-0 pl-4 sm:pl-0">
                    <span className="px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-300 font-bold border border-orange-500/40 shadow-[0_0_6px_rgba(249,115,22,0.25)] flex items-center space-x-1">
                      <Timer className="w-3 h-3 text-orange-400" />
                      <span>Solución: {formatResolutionTime(task.resolutionMinutes || (task.completedHours ? Math.round(task.completedHours * 60) : 0))}</span>
                    </span>

                    {task.completedAt && (
                      <span className="text-slate-400 text-[11px]">
                        {task.completedAt}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: CLASIFICACIÓN POR IMPORTANCIA / PRIORIDADES */}
      {activeTab === 'prioridades' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Crítica / Urgente */}
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#1a1020] border-rose-500/40' : 'bg-rose-50/70 border-rose-200'}`}>
              <div className="flex items-center justify-between pb-2 border-b border-rose-500/30">
                <span className="font-mono text-xs font-bold text-rose-400 flex items-center space-x-1.5">
                  <Flame className="w-4 h-4" />
                  <span>🔥 Urgente / Crítica</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-300 font-bold">
                  {metrics.priorityBreakdown.urgente}
                </span>
              </div>
              <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                {jobTasks.filter((t) => t.priority === 'urgente' && t.status !== 'completada').map((t) => (
                  <div key={t.id} className="p-2.5 rounded-xl bg-black/20 border border-rose-500/20 text-xs">
                    <div className="font-bold text-slate-100">{t.title}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1 flex justify-between">
                      <span>{t.clientOrProject || 'General'}</span>
                      <span>{t.estimatedHours}h est</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alta */}
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#1b1912] border-amber-500/40' : 'bg-amber-50/70 border-amber-200'}`}>
              <div className="flex items-center justify-between pb-2 border-b border-amber-500/30">
                <span className="font-mono text-xs font-bold text-amber-400 flex items-center space-x-1.5">
                  <Zap className="w-4 h-4" />
                  <span>⚡ Alta Prioridad</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 font-bold">
                  {metrics.priorityBreakdown.alta}
                </span>
              </div>
              <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                {jobTasks.filter((t) => t.priority === 'alta' && t.status !== 'completada').map((t) => (
                  <div key={t.id} className="p-2.5 rounded-xl bg-black/20 border border-amber-500/20 text-xs">
                    <div className="font-bold text-slate-100">{t.title}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1 flex justify-between">
                      <span>{t.clientOrProject || 'General'}</span>
                      <span>{t.estimatedHours}h est</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Media */}
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0f142b] border-indigo-500/40' : 'bg-indigo-50/70 border-indigo-200'}`}>
              <div className="flex items-center justify-between pb-2 border-b border-indigo-500/30">
                <span className="font-mono text-xs font-bold text-indigo-400 flex items-center space-x-1.5">
                  <Briefcase className="w-4 h-4" />
                  <span>📋 Media / Operativa</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/20 text-indigo-300 font-bold">
                  {metrics.priorityBreakdown.media}
                </span>
              </div>
              <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                {jobTasks.filter((t) => t.priority === 'media' && t.status !== 'completada').map((t) => (
                  <div key={t.id} className="p-2.5 rounded-xl bg-black/20 border border-indigo-500/20 text-xs">
                    <div className="font-bold text-slate-100">{t.title}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1 flex justify-between">
                      <span>{t.clientOrProject || 'General'}</span>
                      <span>{t.estimatedHours}h est</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Baja */}
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#101524] border-slate-700' : 'bg-slate-50 border-slate-300'}`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                <span className="font-mono text-xs font-bold text-slate-400 flex items-center space-x-1.5">
                  <Clock className="w-4 h-4" />
                  <span>☕ Baja / Cuando Haya Tiempo</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-700 text-slate-300 font-bold">
                  {metrics.priorityBreakdown.baja}
                </span>
              </div>
              <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                {jobTasks.filter((t) => t.priority === 'baja' && t.status !== 'completada').map((t) => (
                  <div key={t.id} className="p-2.5 rounded-xl bg-black/20 border border-slate-700 text-xs">
                    <div className="font-bold text-slate-100">{t.title}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1 flex justify-between">
                      <span>{t.clientOrProject || 'General'}</span>
                      <span>{t.estimatedHours}h est</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: ANÁLISIS DE PRODUCTIVIDAD (Día / Semana / Mes + Tiempo de Solución) */}
      {activeTab === 'analisis' && (
        <div className="space-y-6">
          {/* Timeframe Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
            <div>
              <h3 className={`text-base font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span>Análisis de Volumen de Tareas & Tiempos de Solución</span>
              </h3>
              <p className="text-xs text-slate-400">
                Métricas comparativas al día, a la semana y al mes con distribución de eficiencia.
              </p>
            </div>

            <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-slate-800/50 border border-slate-700">
              <button
                type="button"
                onClick={() => setAnalyticsTimeframe('dia')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  analyticsTimeframe === 'dia'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Al Día (14d)
              </button>
              <button
                type="button"
                onClick={() => setAnalyticsTimeframe('semana')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  analyticsTimeframe === 'semana'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                A la Semana (4s)
              </button>
              <button
                type="button"
                onClick={() => setAnalyticsTimeframe('mes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  analyticsTimeframe === 'mes'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Al Mes (4m)
              </button>
            </div>
          </div>

          {/* Chart Display Area */}
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#0f142b] border-[#242b50]' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-bold uppercase text-slate-400 flex items-center space-x-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>
                  {analyticsTimeframe === 'dia'
                    ? 'Tareas Completadas & Minutos de Solución Diarios'
                    : analyticsTimeframe === 'semana'
                    ? 'Tareas Resueltas por Semana'
                    : 'Tareas Resueltas por Mes & Cumplimiento'}
                </span>
              </span>
              <span className="text-[11px] font-mono text-indigo-400">
                Promedio de solución: {formatResolutionTime(metrics.avgResolutionMinutes)}
              </span>
            </div>

            <div className="h-64 sm:h-72 w-full">
              {analyticsTimeframe === 'dia' && (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={metrics.dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#242b50' : '#e2e8f0'} />
                    <XAxis dataKey="dayLabel" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} />
                    <YAxis yAxisId="left" stroke="#818cf8" fontSize={11} allowDecimals={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#38ef7d" fontSize={11} unit="m" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#0f142b' : '#ffffff',
                        borderColor: '#6366f1',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar yAxisId="left" dataKey="completedCount" fill="#6366f1" radius={[4, 4, 0, 0]} name="Tareas Completadas" />
                    <Line yAxisId="right" type="monotone" dataKey="totalMinutes" stroke="#38ef7d" strokeWidth={2} name="Minutos de Solución" />
                  </ComposedChart>
                </ResponsiveContainer>
              )}

              {analyticsTimeframe === 'semana' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#242b50' : '#e2e8f0'} />
                    <XAxis dataKey="weekKey" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} />
                    <YAxis stroke="#818cf8" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#0f142b' : '#ffffff',
                        borderColor: '#818cf8',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="completedCount" fill="#818cf8" radius={[6, 6, 0, 0]} name="Tareas Resueltas" />
                    <Bar dataKey="totalHours" fill="#38ef7d" radius={[6, 6, 0, 0]} name="Horas Invertidas" />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {analyticsTimeframe === 'mes' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#242b50' : '#e2e8f0'} />
                    <XAxis dataKey="monthName" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} />
                    <YAxis stroke="#818cf8" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#0f142b' : '#ffffff',
                        borderColor: '#818cf8',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="completedCount" fill="#6366f1" radius={[6, 6, 0, 0]} name="Tareas Completadas" />
                    <Bar dataKey="completionRate" fill="#a855f7" radius={[6, 6, 0, 0]} name="% Cumplimiento" unit="%" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR TIEMPO DE SOLUCIÓN AL COMPLETAR TAREA */}
      {resolvingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-4 ${
              isDark ? 'bg-[#0f142b] border-indigo-500/40 text-white' : 'bg-white border-indigo-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-indigo-500/20">
              <div className="flex items-center space-x-2">
                <Timer className="w-5 h-5 text-indigo-400" />
                <h3 className="font-extrabold text-sm sm:text-base">Registrar Tiempo de Solución</h3>
              </div>
              <button
                type="button"
                onClick={() => setResolvingTask(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-400">Tarea completada:</p>
              <h4 className="font-bold text-sm text-indigo-300 mt-0.5">{resolvingTask.title}</h4>
            </div>

            <div>
              <label className="text-xs font-mono font-bold uppercase text-slate-400 block mb-1">
                ¿Cuánto tiempo te tomó resolverla?
              </label>

              {/* Quick Stepper Presets */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[15, 30, 45, 60, 90, 120, 180, 240].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setResolutionInputMinutes(mins)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                      resolutionInputMinutes === mins
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                        : isDark
                          ? 'bg-[#182142] text-slate-300 border-[#2d3449] hover:bg-slate-800'
                          : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  min="5"
                  max="1440"
                  step="5"
                  value={resolutionInputMinutes}
                  onChange={(e) => setResolutionInputMinutes(parseInt(e.target.value, 10) || 30)}
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border font-mono font-bold focus:outline-none ${
                    isDark
                      ? 'bg-[#182142] border-[#2e375e] text-white focus:border-indigo-400'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600'
                  }`}
                />
                <span className="text-xs font-mono font-bold text-indigo-400 shrink-0">
                  minutos ({formatResolutionTime(resolutionInputMinutes)})
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-2.5 pt-3 border-t border-indigo-500/20">
              <button
                type="button"
                onClick={() => setResolvingTask(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmResolution}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-indigo-600 hover:brightness-110 text-white shadow-lg cursor-pointer"
              >
                Guardar & Finalizar Tarea ✅
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
