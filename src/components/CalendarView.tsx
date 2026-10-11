import React, { useState, useMemo } from 'react';
import { Task, CategoryInfo, TaskStatus } from '../types';
import { formatDateSpanish, formatShortDateSpanish, getStatusBadgeColor } from '../utils/helpers';
import { useTheme } from '../context/ThemeContext';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Target, 
  Plus, 
  CheckCircle2, 
  AlertTriangle,
  CalendarDays,
  Sparkles,
  RefreshCw,
  Check,
  ExternalLink,
  Bot,
  Trash2,
  Filter,
  Search,
  Maximize2,
  Minimize2,
  CheckSquare,
  Square,
  Layers,
  Flame,
  List,
  Columns,
  Grid3X3,
  CalendarRange,
  Zap,
  Tag,
  Heart
} from 'lucide-react';
import { 
  connectGoogleCalendar, 
  getGoogleCalendarToken, 
  getTaskOccurrenceDates, 
  createGoogleCalendarEvent,
  syncSingleTaskToGoogleCalendar,
  fetchGoogleCalendarEvents,
  parseGoogleCalendarEvent,
  ParsedGoogleEvent,
  isTimeOverlap
} from '../lib/googleCalendar';
import { CALENDAR_HERO_IMAGE } from '../data/initialData';
import { TaskLiveTimer } from './TaskLiveTimer';
import { CalendarDailyClosureCard } from './CalendarDailyClosureCard';

interface CalendarViewProps {
  tasks: Task[];
  categories: CategoryInfo[];
  userEmail?: string;
  onOpenNewTaskModal?: (defaultDate?: string) => void;
  onOpenNewTaskModalForDate?: (dateStr: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onLogHours: (task: Task) => void;
  onQuickStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onAssignTaskDate: (taskId: string, dateStr: string) => void;
  onConsultAgent?: (task: Task) => void;
}

type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda' | 'google';

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  categories,
  userEmail,
  onOpenNewTaskModal,
  onOpenNewTaskModalForDate,
  onEditTask,
  onDeleteTask,
  onLogHours,
  onQuickStatusChange,
  onAssignTaskDate,
  onConsultAgent,
}) => {
  const { isDark } = useTheme();

  // Current real date (YYYY-MM-DD)
  const now = new Date();
  const todayYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Bogota';

  // View & Navigation State (Defaulted to Google Calendar Oficial as requested)
  const [viewMode, setViewMode] = useState<CalendarViewMode>('google');
  const [currentDate, setCurrentDate] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedDateStr, setSelectedDateStr] = useState(() => todayYMD);
  const [isFullWidth, setIsFullWidth] = useState(false);
  const [cellDensity, setCellDensity] = useState<'normal' | 'extra-large'>('extra-large');

  // Official Google Calendar Viewer State
  const [googleEmail, setGoogleEmail] = useState<string>(() => userEmail || 'miguelpatino0@gmail.com');
  const [googleEmbedMode, setGoogleEmbedMode] = useState<'MONTH' | 'WEEK' | 'AGENDA'>('MONTH');
  const [googleIframeKey, setGoogleIframeKey] = useState<number>(0);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [tempEmailInput, setTempEmailInput] = useState(() => userEmail || 'miguelpatino0@gmail.com');
  const [hasGoogleToken, setHasGoogleToken] = useState<boolean>(() => Boolean(getGoogleCalendarToken()));

  // Filters & Search
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Google Calendar state
  const [isSyncing, setIsSyncing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [googleEvents, setGoogleEvents] = useState<ParsedGoogleEvent[]>([]);
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper to open new task modal for a specific date
  const handleAddNewTask = (targetDateStr: string = selectedDateStr) => {
    if (onOpenNewTaskModalForDate) {
      onOpenNewTaskModalForDate(targetDateStr);
    } else if (onOpenNewTaskModal) {
      onOpenNewTaskModal(targetDateStr);
    }
  };

  // Google Calendar handlers
  const handleFetchGoogleCalendarEvents = async () => {
    setIsImporting(true);
    setSyncStatusMsg(null);
    try {
      let token = getGoogleCalendarToken();
      if (!token) {
        token = await connectGoogleCalendar();
      }

      if (!token) {
        throw new Error('No se pudo conectar con Google Calendar.');
      }

      const mm = String(month + 1).padStart(2, '0');
      const timeMin = `${year}-${mm}-01T00:00:00Z`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const timeMax = `${year}-${mm}-${String(lastDay).padStart(2, '0')}T23:59:59Z`;

      const rawItems = await fetchGoogleCalendarEvents(token, timeMin, timeMax);
      const parsed: ParsedGoogleEvent[] = [];
      rawItems.forEach((item) => {
        const p = parseGoogleCalendarEvent(item);
        if (p) parsed.push(p);
      });

      setGoogleEvents(parsed);
      setSyncStatusMsg({
        type: 'success',
        text: `¡Se cargaron ${parsed.length} evento(s) desde Google Calendar! Franjas ocupadas reflejadas.`,
      });

      setTimeout(() => {
        setSyncStatusMsg(null);
      }, 5000);
    } catch (err: any) {
      console.error('Error fetching Google Calendar events:', err);
      setSyncStatusMsg({
        type: 'error',
        text: err?.message || 'Error al obtener ocupación de Google Calendar.',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleConnectGCal = async () => {
    try {
      const token = await connectGoogleCalendar();
      if (token) {
        setHasGoogleToken(true);
        setSyncStatusMsg({
          type: 'success',
          text: '¡Google Calendar vinculado con éxito! El bot y LifeBlocks ahora escribirán directamente en tu Google Calendar oficial.',
        });
      }
    } catch (err: any) {
      setSyncStatusMsg({
        type: 'error',
        text: err?.message || 'No se pudo vincular con Google Calendar. Intenta nuevamente.',
      });
    }
  };

  const handleStartGoogleSync = async () => {
    try {
      const token = getGoogleCalendarToken();
      if (!token) {
        const newTok = await connectGoogleCalendar();
        if (!newTok) return;
      }
      setShowSyncConfirm(true);
    } catch (err: any) {
      setSyncStatusMsg({
        type: 'error',
        text: err?.message || 'No se pudo conectar con Google Calendar. Intenta nuevamente.',
      });
    }
  };

  const handleConfirmGoogleSync = async () => {
    setShowSyncConfirm(false);
    setIsSyncing(true);
    setSyncStatusMsg(null);

    try {
      let token = getGoogleCalendarToken();
      if (!token) {
        token = await connectGoogleCalendar();
      }

      if (!token) {
        throw new Error('No se obtuvo el token de autenticación de Google Calendar.');
      }

      const assignedTasks = tasks.filter((t) => t.assignedDate && t.status !== 'completada');
      if (assignedTasks.length === 0) {
        setSyncStatusMsg({
          type: 'error',
          text: 'No hay metas activas con fecha asignada para exportar.',
        });
        setIsSyncing(false);
        return;
      }

      let syncedCount = 0;
      for (const task of assignedTasks) {
        await syncSingleTaskToGoogleCalendar(token, task);
        syncedCount++;
      }

      setSyncStatusMsg({
        type: 'success',
        text: `¡Éxito! Se han exportado ${syncedCount} meta(s) a tu Google Calendar con recordatorio 10 min antes. Cargando ocupaciones...`,
      });

      await handleFetchGoogleCalendarEvents();
    } catch (err: any) {
      console.error('Error syncing with Google Calendar:', err);
      setSyncStatusMsg({
        type: 'error',
        text: err?.message || 'Error al exportar eventos a Google Calendar.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncSingleTask = async (task: Task) => {
    if (!task.assignedDate) {
      setSyncStatusMsg({
        type: 'error',
        text: 'Esta actividad no tiene fecha programada para sincronizar.',
      });
      return;
    }

    const confirmed = window.confirm(
      `¿Deseas programar la actividad "${task.title}" en tu Google Calendar con alarma y recordatorio a 10 minutos antes?`
    );
    if (!confirmed) return;

    try {
      let token = getGoogleCalendarToken();
      if (!token) {
        token = await connectGoogleCalendar();
      }
      if (!token) {
        throw new Error('No se obtuvo el token de autenticación de Google Calendar.');
      }

      const syncedEvents = await syncSingleTaskToGoogleCalendar(token, task);
      task.gcalSynced = true;
      if (syncedEvents && syncedEvents.length > 0) {
        task.gcalEventId = syncedEvents[0]?.id;
      }
      try {
        const stored = localStorage.getItem('aurora_tasks_app_v1');
        if (stored) {
          const list: Task[] = JSON.parse(stored);
          const updated = list.map((t) => (t.id === task.id ? { ...t, gcalSynced: true, gcalEventId: task.gcalEventId } : t));
          localStorage.setItem('aurora_tasks_app_v1', JSON.stringify(updated));
        }
      } catch {}

      setSyncStatusMsg({
        type: 'success',
        text: `¡"${task.title}" sincronizada con alarma a 10 min en tu Google Calendar!`,
      });
      setTimeout(() => setSyncStatusMsg(null), 4000);
      await handleFetchGoogleCalendarEvents();
    } catch (err: any) {
      console.error('Error syncing single task to Google Calendar:', err);
      setSyncStatusMsg({
        type: 'error',
        text: err?.message || 'Error al sincronizar actividad a Google Calendar.',
      });
    }
  };

  // Date navigation helpers
  const formatYMD = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  const prevPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      const [sy, sm, sd] = selectedDateStr.split('-').map(Number);
      const d = new Date(sy, sm - 1, sd - 7);
      const ymd = formatYMD(d.getFullYear(), d.getMonth(), d.getDate());
      setSelectedDateStr(ymd);
      setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
    } else if (viewMode === 'day') {
      const [sy, sm, sd] = selectedDateStr.split('-').map(Number);
      const d = new Date(sy, sm - 1, sd - 1);
      const ymd = formatYMD(d.getFullYear(), d.getMonth(), d.getDate());
      setSelectedDateStr(ymd);
      setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  };

  const nextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      const [sy, sm, sd] = selectedDateStr.split('-').map(Number);
      const d = new Date(sy, sm - 1, sd + 7);
      const ymd = formatYMD(d.getFullYear(), d.getMonth(), d.getDate());
      setSelectedDateStr(ymd);
      setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
    } else if (viewMode === 'day') {
      const [sy, sm, sd] = selectedDateStr.split('-').map(Number);
      const d = new Date(sy, sm - 1, sd + 1);
      const ymd = formatYMD(d.getFullYear(), d.getMonth(), d.getDate());
      setSelectedDateStr(ymd);
      setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  };

  const goToToday = () => {
    const realNow = new Date();
    setCurrentDate(new Date(realNow.getFullYear(), realNow.getMonth(), 1));
    setSelectedDateStr(todayYMD);
  };

  // Month calculation
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Monday = 0

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Group and filter tasks by date
  const { tasksByDate, unassignedTasks, allFilteredTasks } = useMemo(() => {
    const byDate: Record<string, Task[]> = {};
    const unassigned: Task[] = [];
    const safeTasks = Array.isArray(tasks) ? tasks.filter(Boolean) : [];

    const filtered = safeTasks.filter((t) => {
      if (selectedCategoryFilter !== 'all' && t.category !== selectedCategoryFilter) return false;
      if (selectedStatusFilter !== 'all' && t.status !== selectedStatusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title?.toLowerCase().includes(q);
        const matchesGoal = t.finalGoal?.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesGoal && !matchesDesc) return false;
      }
      return true;
    });

    filtered.forEach((t) => {
      const primaryDate = (typeof t.assignedDate === 'string' && t.assignedDate.trim()) 
        ? t.assignedDate.trim() 
        : (typeof t.dueDate === 'string' && t.dueDate.trim()) 
          ? t.dueDate.trim() 
          : '';

      if (primaryDate) {
        const hasRecurring = Array.isArray(t.recurringDays) && t.recurringDays.length > 0;
        const secondDate = (typeof t.dueDate === 'string' && t.dueDate.trim()) ? t.dueDate.trim() : primaryDate;

        let start = new Date(primaryDate + 'T00:00:00');
        let end = new Date(secondDate + 'T00:00:00');

        if (isNaN(start.getTime())) start = new Date();
        if (isNaN(end.getTime()) || end.getTime() < start.getTime()) {
          end = new Date(start);
        }

        const isMultiDay = end.getTime() > start.getTime();

        if (hasRecurring) {
          let cur = new Date(start);
          let matchCount = 0;
          let safetyCounter = 0;
          while (cur.getTime() <= end.getTime() && safetyCounter < 90) {
            const dayOfWeek = cur.getDay();
            if (t.recurringDays!.includes(dayOfWeek)) {
              const yyyy = cur.getFullYear();
              const mm = String(cur.getMonth() + 1).padStart(2, '0');
              const dd = String(cur.getDate()).padStart(2, '0');
              const dateStr = `${yyyy}-${mm}-${dd}`;

              if (!byDate[dateStr]) byDate[dateStr] = [];
              const dailyHoursForDay = t.dailyHours || t.estimatedHours;
              byDate[dateStr].push({
                ...t,
                estimatedHours: dailyHoursForDay,
              });
              matchCount++;
            }
            cur.setDate(cur.getDate() + 1);
            safetyCounter++;
          }
          // If no specific recurring day matched in range, ensure it at least appears on start date
          if (matchCount === 0) {
            if (!byDate[primaryDate]) byDate[primaryDate] = [];
            byDate[primaryDate].push(t);
          }
        } else if (isMultiDay) {
          // Task scheduled across a week range without specific recurring filter: display on every day of range
          let cur = new Date(start);
          let safetyCounter = 0;
          while (cur.getTime() <= end.getTime() && safetyCounter < 60) {
            const yyyy = cur.getFullYear();
            const mm = String(cur.getMonth() + 1).padStart(2, '0');
            const dd = String(cur.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;

            if (!byDate[dateStr]) byDate[dateStr] = [];
            const dailyHoursForDay = t.dailyHours || t.estimatedHours;
            byDate[dateStr].push({
              ...t,
              estimatedHours: dailyHoursForDay,
            });
            cur.setDate(cur.getDate() + 1);
            safetyCounter++;
          }
        } else {
          // Single day task
          if (!byDate[primaryDate]) byDate[primaryDate] = [];
          byDate[primaryDate].push(t);
        }
      } else {
        unassigned.push(t);
      }
    });

    // Sort each day's task list: pending at top, completed at bottom, prioritized by urgency and antiquity
    Object.keys(byDate).forEach((d) => {
      byDate[d].sort((a, b) => {
        const aDone = a.status === 'completada' ? 1 : 0;
        const bDone = b.status === 'completada' ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;

        // Pending: highest priority first
        const priorityWeight: Record<string, number> = { urgente: 4, alta: 3, media: 2, baja: 1 };
        const pA = priorityWeight[a.priority] || 0;
        const pB = priorityWeight[b.priority] || 0;
        if (pA !== pB) return pB - pA;

        // Antiquity / older first
        const rollA = a.rolloverCount || 0;
        const rollB = b.rolloverCount || 0;
        if (rollA !== rollB) return rollB - rollA;

        const dateA = a.createdAt || '';
        const dateB = b.createdAt || '';
        return dateA.localeCompare(dateB);
      });
    });

    // Also sort allFilteredTasks: pending first, completed at bottom
    filtered.sort((a, b) => {
      const aDone = a.status === 'completada' ? 1 : 0;
      const bDone = b.status === 'completada' ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      const priorityWeight: Record<string, number> = { urgente: 4, alta: 3, media: 2, baja: 1 };
      const pA = priorityWeight[a.priority] || 0;
      const pB = priorityWeight[b.priority] || 0;
      if (pA !== pB) return pB - pA;
      return 0;
    });

    return { tasksByDate: byDate, unassignedTasks: unassigned, allFilteredTasks: filtered };
  }, [tasks, selectedCategoryFilter, selectedStatusFilter, searchQuery]);

  // Group Google Calendar events by date
  const googleEventsByDate = useMemo(() => {
    const byDate: Record<string, ParsedGoogleEvent[]> = {};
    googleEvents.forEach((ge) => {
      if (!byDate[ge.dateStr]) byDate[ge.dateStr] = [];
      byDate[ge.dateStr].push(ge);
    });
    return byDate;
  }, [googleEvents]);

  // Selected date data
  const selectedDayTasks = tasksByDate[selectedDateStr] || [];
  const selectedDayGoogleEvents = googleEventsByDate[selectedDateStr] || [];
  const selectedDayTotalHours = selectedDayTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const selectedDayCompletedHours = selectedDayTasks.reduce((sum, t) => sum + (t.completedHours || 0), 0);

  // Month Statistics
  const monthStats = useMemo(() => {
    let totalMonthTasks = 0;
    let completedMonthTasks = 0;
    let totalMonthHours = 0;
    let completedMonthHours = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatYMD(year, month, day);
      const dayTasks = tasksByDate[dateStr] || [];
      dayTasks.forEach((t) => {
        totalMonthTasks++;
        if (t.status === 'completada') completedMonthTasks++;
        totalMonthHours += Number(t.estimatedHours) || 0;
        completedMonthHours += Number(t.completedHours) || 0;
      });
    }

    const completionRate = totalMonthTasks > 0 ? Math.round((completedMonthTasks / totalMonthTasks) * 100) : 0;
    return {
      totalMonthTasks,
      completedMonthTasks,
      totalMonthHours,
      completedMonthHours,
      completionRate,
    };
  }, [tasksByDate, daysInMonth, year, month]);

  // Load color badges for grid cells
  const getLoadBadge = (hours: number) => {
    if (hours === 0) return null;
    if (hours <= 3) return { bg: isDark ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-cyan-50 text-cyan-800 border-cyan-300', label: `${hours}h (Ligero)` };
    if (hours <= 7) return { bg: isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-50 text-emerald-800 border-emerald-300', label: `${hours}h (Óptimo)` };
    return { bg: isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-50 text-amber-800 border-amber-300', label: `${hours}h (Carga Alta)` };
  };

  // Week calculation for Week View
  const weekDays = useMemo(() => {
    const [sy, sm, sd] = selectedDateStr.split('-').map(Number);
    const selectedDate = new Date(sy, sm - 1, sd);
    const dayOfWeek = selectedDate.getDay(); // 0 = Sun
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(selectedDate);
    monday.setDate(selectedDate.getDate() + diffToMonday);

    const days = [];
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = formatYMD(d.getFullYear(), d.getMonth(), d.getDate());
      days.push({
        name: dayNames[i],
        dateStr,
        dayNum: d.getDate(),
        monthNum: d.getMonth() + 1,
        isToday: dateStr === todayYMD,
        isSelected: dateStr === selectedDateStr,
      });
    }
    return days;
  }, [selectedDateStr, todayYMD]);

  // Quick toggle status helper
  const handleToggleTaskStatus = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onQuickStatusChange) return;
    const nextStatus: TaskStatus = task.status === 'completada' ? 'pendiente' : 'completada';
    onQuickStatusChange(task.id, nextStatus);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* 1. Header Banner & Monthly Key Metrics */}
      <div className={`p-4 md:p-5 rounded-2xl border shadow-lg transition-all overflow-hidden relative ${
        isDark 
          ? 'bg-gradient-to-br from-[#131b2e] via-[#0f172a] to-[#131b2e] border-[#2d3449]' 
          : 'bg-gradient-to-br from-white via-slate-50 to-white border-slate-200 shadow-slate-900/5'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          
          {/* Title & Description */}
          <div className="flex items-start space-x-3.5">
            <div className={`w-12 h-12 rounded-2xl overflow-hidden border shadow-inner shrink-0 relative ${
              isDark ? 'border-cyan-500/30' : 'border-cyan-200'
            }`}>
              <img 
                src={CALENDAR_HERO_IMAGE} 
                alt="Planificación y tiempo libre"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h1 className={`text-lg md:text-xl font-black tracking-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Calendario Maestro & Tiempo Libre
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-xs">
                  {isFullWidth ? 'Vista 100%' : 'Vista Normal'}
                </span>
              </div>
              <p className={`text-xs mt-0.5 max-w-xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Visualiza tus actividades, programa tus días y garantiza tiempo libre de calidad.
              </p>
            </div>
          </div>

          {/* Quick Metrics Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className={`p-2 sm:p-2.5 rounded-xl border ${
              isDark ? 'bg-[#0b1326]/80 border-[#2d3449]' : 'bg-white border-slate-200 shadow-2xs'
            }`}>
              <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">Actividades</div>
              <div className={`text-base font-black font-mono mt-0.5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                {monthStats.totalMonthTasks}
              </div>
            </div>

            <div className={`p-2 sm:p-2.5 rounded-xl border ${
              isDark ? 'bg-[#0b1326]/80 border-[#2d3449]' : 'bg-white border-slate-200 shadow-2xs'
            }`}>
              <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">Horas Mes</div>
              <div className={`text-base font-black font-mono mt-0.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                {monthStats.totalMonthHours}h
              </div>
            </div>

            <div className={`p-2 sm:p-2.5 rounded-xl border ${
              isDark ? 'bg-[#0b1326]/80 border-[#2d3449]' : 'bg-white border-slate-200 shadow-2xs'
            }`}>
              <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">Completadas</div>
              <div className={`text-base font-black font-mono mt-0.5 text-emerald-500`}>
                {monthStats.completedMonthTasks}
              </div>
            </div>

            <div className={`p-2 sm:p-2.5 rounded-xl border ${
              isDark ? 'bg-[#0b1326]/80 border-[#2d3449]' : 'bg-white border-slate-200 shadow-2xs'
            }`}>
              <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">Efectividad</div>
              <div className={`text-base font-black font-mono mt-0.5 ${
                monthStats.completionRate >= 70 ? 'text-emerald-500' : 'text-amber-500'
              }`}>
                {monthStats.completionRate}%
              </div>
            </div>
          </div>

        </div>

        {/* 2. Control Toolbar: Views, Period Navigation, Google Calendar & Layout */}
        <div className={`mt-3.5 pt-3 border-t flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 flex-wrap ${
          isDark ? 'border-[#2d3449]' : 'border-slate-200'
        }`}>
          
          {/* View Mode Selector Tabs */}
          <div className={`flex items-center p-1 rounded-2xl border ${
            isDark ? 'bg-[#0b1326] border-[#2d3449]' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                viewMode === 'month'
                  ? isDark 
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-black' 
                    : 'bg-white text-cyan-800 shadow-sm font-black'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Vista Mes</span>
            </button>

            <button
              onClick={() => setViewMode('week')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                viewMode === 'week'
                  ? isDark 
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-black' 
                    : 'bg-white text-cyan-800 shadow-sm font-black'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Semana</span>
            </button>

            <button
              onClick={() => setViewMode('day')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                viewMode === 'day'
                  ? isDark 
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-black' 
                    : 'bg-white text-cyan-800 shadow-sm font-black'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Día Detalle</span>
            </button>

            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                viewMode === 'agenda'
                  ? isDark 
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-black' 
                    : 'bg-white text-cyan-800 shadow-sm font-black'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Agenda</span>
            </button>

            <button
              onClick={() => setViewMode('google')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                viewMode === 'google'
                  ? 'bg-[#4285F4] text-white shadow-md font-black'
                  : isDark ? 'text-blue-400 hover:text-white' : 'text-blue-600 hover:text-blue-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Google Calendar Oficial</span>
            </button>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-2 flex-wrap">
            <button
              onClick={goToToday}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                isDark
                  ? 'bg-[#171f33] hover:bg-slate-700 text-cyan-300 border-[#2d3449]'
                  : 'bg-slate-100 hover:bg-slate-200 text-cyan-700 border-slate-300 shadow-xs'
              }`}
            >
              Hoy
            </button>

            <div className={`flex items-center space-x-1 p-1 border rounded-2xl ${
              isDark ? 'bg-[#0b1326] border-[#2d3449]' : 'bg-slate-50 border-slate-200'
            }`}>
              <button
                onClick={prevPeriod}
                title="Anterior"
                className={`p-1.5 rounded-xl cursor-pointer transition-colors ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-[#171f33]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className={`px-3 text-xs md:text-sm font-black font-mono uppercase tracking-wide min-w-[140px] text-center ${
                isDark ? 'text-cyan-400' : 'text-cyan-800'
              }`}>
                {viewMode === 'month' && `${monthNames[month]} ${year}`}
                {viewMode === 'week' && `Semana ${formatShortDateSpanish(weekDays[0]?.dateStr)} - ${formatShortDateSpanish(weekDays[6]?.dateStr)}`}
                {viewMode === 'day' && `${formatShortDateSpanish(selectedDateStr)} (${monthNames[new Date(selectedDateStr + 'T00:00:00').getMonth()]})`}
                {viewMode === 'agenda' && `${monthNames[month]} ${year}`}
                {viewMode === 'google' && `Google Calendar (${googleEmail})`}
              </span>

              <button
                onClick={nextPeriod}
                title="Siguiente"
                className={`p-1.5 rounded-xl cursor-pointer transition-colors ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-[#171f33]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Google Calendar Integrations */}
            {hasGoogleToken ? (
              <div 
                title="Google Calendar conectado. Las tareas del bot y de la app se sincronizan directamente."
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-xs cursor-default"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="hidden sm:inline">Google Conectado</span>
              </div>
            ) : (
              <button
                onClick={handleConnectGCal}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 text-xs font-black shadow-sm transition-all cursor-pointer"
                title="Vincular con tu cuenta de Google para que el bot y la app sincronicen tus compromisos directamente a Google Calendar"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Vincular Google Cal</span>
              </button>
            )}

            <button
              onClick={handleFetchGoogleCalendarEvents}
              disabled={isImporting}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs ${
                isDark 
                  ? 'bg-[#4285F4]/15 hover:bg-[#4285F4]/25 text-[#4285F4] border border-[#4285F4]/40'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
              }`}
              title="Cargar franjas ocupadas de tu Google Calendar personal"
            >
              <CalendarDays className={`w-3.5 h-3.5 ${isImporting ? 'animate-spin text-[#4285F4]' : ''}`} />
              <span className="hidden sm:inline">{isImporting ? 'Cargando...' : 'Google Cal'}</span>
            </button>

            <button
              onClick={handleStartGoogleSync}
              disabled={isSyncing}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/30'
                  : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200'
              }`}
              title="Exportar actividades a Google Calendar"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Exportar</span>
            </button>

            {/* Layout Expand Toggle */}
            <button
              onClick={() => setIsFullWidth(!isFullWidth)}
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer border hidden lg:flex items-center space-x-1.5 ${
                isFullWidth
                  ? isDark ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-cyan-100 text-cyan-800 border-cyan-300'
                  : isDark ? 'bg-[#171f33] text-slate-300 border-[#2d3449]' : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}
              title={isFullWidth ? 'Cambiar a Vista Dividida con Inspector' : 'Expandir Calendario al 100% de Ancho'}
            >
              {isFullWidth ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullWidth ? 'Panel Lateral' : 'Pantalla 100%'}</span>
            </button>

            {/* Quick Add Button */}
            <button
              onClick={() => handleAddNewTask(selectedDateStr)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:brightness-110 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center space-x-1.5 transition-all cursor-pointer ml-auto sm:ml-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Nueva Actividad</span>
            </button>
          </div>

        </div>

        {/* 3. Filters & Category Pills Bar */}
        <div className={`mt-4 pt-3 border-t flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${
          isDark ? 'border-[#2d3449]' : 'border-slate-200'
        }`}>
          {/* Categories Horizontal Scrolling Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider mr-1 shrink-0 flex items-center space-x-1 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <Tag className="w-3 h-3 text-cyan-400" />
              <span>Filtrar:</span>
            </span>

            <button
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                selectedCategoryFilter === 'all'
                  ? isDark 
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 ring-1 ring-cyan-400/40' 
                    : 'bg-cyan-100 text-cyan-800 border-cyan-400 ring-1 ring-cyan-400/30 font-black'
                  : isDark ? 'bg-[#0b1326] text-slate-400 border-[#2d3449] hover:text-white' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              ✨ Todas ({tasks.length})
            </button>

            {categories.map((cat) => {
              const catTasksCount = tasks.filter((t) => t.category === cat.id).length;
              const isSelected = selectedCategoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryFilter(isSelected ? 'all' : cat.id)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center space-x-1.5 ${
                    isSelected
                      ? isDark 
                        ? 'bg-slate-800 text-white border-cyan-400 ring-1 ring-cyan-400' 
                        : 'bg-white text-slate-900 border-cyan-500 ring-1 ring-cyan-500 shadow-xs'
                      : isDark ? 'bg-[#0b1326] text-slate-400 border-[#2d3449] hover:text-white' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color || '#00f2ff' }}
                  />
                  <span>{cat.name}</span>
                  <span className="text-[10px] opacity-70 font-mono">({catTasksCount})</span>
                </button>
              );
            })}
          </div>

          {/* Search Input & Status Selector */}
          <div className="flex items-center space-x-2 shrink-0">
            <div className={`relative flex items-center rounded-xl border px-2.5 py-1 ${
              isDark ? 'bg-[#0b1326] border-[#2d3449]' : 'bg-white border-slate-300'
            }`}>
              <Search className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <input
                type="text"
                placeholder="Buscar actividad..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`text-xs bg-transparent focus:outline-none w-28 sm:w-36 ${
                  isDark ? 'text-white placeholder-slate-500' : 'text-slate-800 placeholder-slate-400'
                }`}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white text-xs ml-1">
                  ✕
                </button>
              )}
            </div>

            {/* Quick Status Filter Pills */}
            <div className="flex items-center space-x-1 p-0.5 rounded-xl border bg-black/20 border-slate-700/50">
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('all')}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  selectedStatusFilter === 'all'
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('pendiente')}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  selectedStatusFilter === 'pendiente'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pendientes
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('completada')}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  selectedStatusFilter === 'completada'
                    ? 'bg-orange-500 text-white shadow-[0_0_8px_rgba(249,115,22,0.4)]'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Completadas
              </button>
            </div>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className={`text-xs px-2.5 py-1 rounded-xl border font-bold cursor-pointer focus:outline-none hidden sm:inline-block ${
                isDark ? 'bg-[#0b1326] border-[#2d3449] text-slate-300' : 'bg-white border-slate-300 text-slate-700'
              }`}
            >
              <option value="all">Todos los Estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="en_progreso">En Progreso</option>
              <option value="completada">Completadas</option>
            </select>
          </div>

        </div>

      </div>

      {/* Sync Status Toast Alert */}
      {syncStatusMsg && (
        <div
          className={`p-4 rounded-2xl border flex items-start justify-between text-xs font-mono animate-in fade-in duration-200 ${
            syncStatusMsg.type === 'success'
              ? isDark ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : isDark ? 'bg-red-500/15 border-red-500/30 text-red-300' : 'bg-red-50 border-red-300 text-red-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {syncStatusMsg.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            )}
            <span>{syncStatusMsg.text}</span>
          </div>
          <button
            onClick={() => setSyncStatusMsg(null)}
            className="ml-2 cursor-pointer text-slate-400 hover:text-white font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Google Calendar Confirmation Modal */}
      {showSyncConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 ${
            isDark ? 'bg-[#131b2e] border-[#2d3449]' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-[#4285F4]/20 border border-[#4285F4]/40 flex items-center justify-center text-[#4285F4]">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Exportar a Google Calendar</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sincroniza tus bloques con tu cuenta de Google</p>
              </div>
            </div>

            <p className={`text-xs leading-relaxed p-3.5 rounded-2xl border ${
              isDark ? 'text-slate-300 bg-[#0b1326] border-[#2d3449]' : 'text-slate-700 bg-slate-50 border-slate-200'
            }`}>
              ¿Deseas exportar tus metas y actividades programadas a tu Google Calendar personal? Se crearán los eventos con tu horario asignado y una alarma nativa a 10 minutos antes (que sonará en tu teléfono y smartwatch).
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSyncConfirm(false)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-colors cursor-pointer border ${
                  isDark ? 'bg-[#171f33] hover:bg-slate-800 text-slate-300 border-[#2d3449]' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmGoogleSync}
                className="px-4 py-2 bg-[#4285F4] hover:bg-[#3367D6] text-white rounded-xl text-xs font-mono font-bold transition-all shadow-lg shadow-[#4285F4]/30 cursor-pointer flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Exportación</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Main Calendar Content Area (Reduced calendar width to accommodate the Daily Summary & Closure block) */}
      <div className={`grid grid-cols-1 ${isFullWidth ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-5`}>
        
        {/* Primary Calendar Grid View Container */}
        <div className={`${isFullWidth ? 'w-full' : 'lg:col-span-8 xl:col-span-8'} border rounded-3xl p-4 md:p-6 shadow-xl space-y-4 transition-all ${
          isDark ? 'bg-[#131b2e] border-[#2d3449]' : 'bg-white border-slate-200 shadow-slate-900/5'
        }`}>
          
          {/* =========================================================================
              VIEW MODE 1: MONTH VIEW (RESPONSIVE COMPACT IN SPLIT / EXPANDED IN 100%)
             ========================================================================= */}
          {viewMode === 'month' && (
            <div className="space-y-3">
              
              {/* Weekday Header Columns */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center font-mono text-[11px] sm:text-xs uppercase font-black pb-2 border-b border-dashed border-slate-700/40">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d, i) => (
                  <div key={d} className={`py-1 rounded-lg sm:rounded-xl ${
                    i >= 5 
                      ? isDark ? 'text-amber-400 bg-amber-500/5' : 'text-amber-700 bg-amber-50/50' 
                      : isDark ? 'text-cyan-400' : 'text-cyan-800'
                  }`}>
                    <span>{d}</span>
                  </div>
                ))}
              </div>

              {/* Month Day Grid */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {/* Empty offset slots */}
                {Array.from({ length: startOffset }).map((_, i) => (
                  <div 
                    key={`offset-${i}`} 
                    className={`border border-dashed rounded-xl sm:rounded-2xl opacity-20 ${
                      isFullWidth 
                        ? 'min-h-[135px] sm:min-h-[160px] md:min-h-[185px]' 
                        : 'min-h-[70px] sm:min-h-[80px] md:min-h-[90px]'
                    } ${
                      isDark ? 'bg-[#0b1326]/40 border-[#2d3449]' : 'bg-slate-100/60 border-slate-300'
                    }`} 
                  />
                ))}

                {/* Day Cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = formatYMD(year, month, dayNum);
                  const isSelected = dateStr === selectedDateStr;
                  const isToday = dateStr === todayYMD;
                  const dayTasks = tasksByDate[dateStr] || [];
                  const dayGoogleEvents = googleEventsByDate[dateStr] || [];
                  const dayTotalHours = dayTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
                  const badge = getLoadBadge(dayTotalHours);

                  return (
                    <div
                      key={dateStr}
                      onClick={() => setSelectedDateStr(dateStr)}
                      className={`rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative group ${
                        isFullWidth
                          ? 'min-h-[135px] sm:min-h-[160px] md:min-h-[185px] p-2.5 sm:p-3'
                          : 'min-h-[70px] sm:min-h-[80px] md:min-h-[90px] p-1.5 sm:p-2'
                      } ${
                        isSelected
                          ? isDark
                            ? 'bg-[#17233f] border-cyan-400 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-950/40 z-10'
                            : 'bg-cyan-50/90 border-cyan-500 ring-2 ring-cyan-500/30 shadow-md z-10'
                          : isToday
                            ? isDark
                              ? 'bg-[#0e1b33] border-cyan-500/60 ring-1 ring-cyan-500/30'
                              : 'bg-sky-50/70 border-sky-300'
                            : isDark
                              ? 'bg-[#0b1326] border-[#222d46] hover:border-cyan-500/40 hover:bg-[#101b33]'
                              : 'bg-slate-50/90 border-slate-200 hover:border-cyan-300 hover:bg-white'
                      }`}
                    >
                      {/* Top Header inside cell */}
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center space-x-1">
                          <span
                            className={`font-mono font-black rounded-lg sm:rounded-xl flex items-center justify-center transition-all ${
                              isFullWidth 
                                ? 'text-xs sm:text-sm w-6 h-6 sm:w-7 sm:h-7' 
                                : 'text-[11px] sm:text-xs w-5 h-5 sm:w-6 sm:h-6'
                            } ${
                              isSelected
                                ? 'bg-cyan-400 text-slate-950 shadow-xs'
                                : isToday
                                  ? 'bg-gradient-to-br from-cyan-500 to-emerald-500 text-slate-950 font-black ring-1 ring-cyan-400/40'
                                  : isDark ? 'text-slate-200 group-hover:text-cyan-400' : 'text-slate-800 group-hover:text-cyan-700'
                            }`}
                          >
                            {dayNum}
                          </span>

                          {isToday && (
                            <span className="text-[8px] sm:text-[9px] font-mono font-black uppercase px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hidden sm:inline-block">
                              Hoy
                            </span>
                          )}
                        </div>

                        {badge && (
                          <span className={`font-mono font-bold px-1 sm:px-1.5 py-0.2 rounded-md border shadow-xs ${
                            isFullWidth ? 'text-[9px] sm:text-[10px]' : 'text-[8px] sm:text-[9px]'
                          } ${badge.bg}`}>
                            {dayTotalHours}h
                          </span>
                        )}
                      </div>

                      {/* Middle: Activities Display */}
                      {isFullWidth ? (
                        /* EXPANDED FULL-WIDTH MODE (Rich Large Cards) */
                        <div className="space-y-1.5 my-1.5 flex-1 overflow-y-auto max-h-[125px] scrollbar-none pr-0.5">
                          {/* Google Calendar Badges */}
                          {dayGoogleEvents.map((gEv) => (
                            <div
                              key={gEv.id}
                              className={`text-[10px] sm:text-[11px] p-1.5 rounded-xl font-bold flex items-center justify-between border shadow-xs transition-transform hover:scale-[1.01] ${
                                isDark 
                                  ? 'bg-[#4285F4]/20 border-[#4285F4]/40 text-[#4285F4]'
                                  : 'bg-blue-50 border-blue-300 text-blue-800'
                              }`}
                              title={`Google Calendar: ${gEv.summary} (${gEv.startTime} - ${gEv.endTime})`}
                            >
                              <span className="truncate flex items-center space-x-1">
                                <CalendarDays className="w-3 h-3 shrink-0" />
                                <span className="truncate">{gEv.summary}</span>
                              </span>
                              <span className="text-[9px] font-mono shrink-0 ml-1 opacity-80">{gEv.startTime}</span>
                            </div>
                          ))}

                          {/* LifeBlocks Activities */}
                          {dayTasks.map((t) => {
                            const cat = categories.find((c) => c.id === t.category);
                            const isCompleted = t.status === 'completada';
                            const catColor = cat?.color || '#00f2ff';

                            return (
                              <div
                                key={t.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDateStr(dateStr);
                                }}
                                className={`text-[11px] sm:text-xs p-1.5 sm:p-2 rounded-xl font-medium border shadow-xs transition-all hover:scale-[1.01] relative group/card ${
                                  isCompleted
                                    ? isDark 
                                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
                                      : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                    : isDark 
                                      ? 'bg-[#152037] border-[#29385c] text-slate-100 hover:border-cyan-500/60' 
                                      : 'bg-white border-slate-300 text-slate-900 hover:border-cyan-400 shadow-xs'
                                }`}
                                style={{ borderLeftWidth: '4px', borderLeftColor: catColor }}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <span className={`font-bold leading-tight line-clamp-2 ${isCompleted ? 'line-through opacity-70' : ''}`}>
                                    {t.title}
                                  </span>
                                  
                                  <button
                                    type="button"
                                    onClick={(e) => handleToggleTaskStatus(t, e)}
                                    title={isCompleted ? 'Marcar como pendiente' : 'Marcar como completada'}
                                    className={`p-0.5 rounded-md cursor-pointer shrink-0 transition-colors ${
                                      isCompleted 
                                        ? 'text-emerald-400 hover:text-emerald-300' 
                                        : isDark ? 'text-slate-500 hover:text-cyan-400' : 'text-slate-400 hover:text-cyan-600'
                                    }`}
                                  >
                                    {isCompleted ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                                  </button>
                                </div>

                                {(t.assignedBy || t.tags?.some(tag => tag.toLowerCase().includes('liz'))) && (
                                  <div className="mt-1 flex items-center">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                                      <Heart className="w-2.5 h-2.5 fill-pink-400 text-pink-400" />
                                      <span>Asignado por {t.assignedBy || 'Liz'}</span>
                                    </span>
                                  </div>
                                )}

                                <div className="flex items-center justify-between gap-1 mt-1 text-[10px] font-mono">
                                  <span
                                    className="px-1.5 py-0.2 rounded-md font-bold truncate max-w-[80px]"
                                    style={{
                                      backgroundColor: `${catColor}20`,
                                      color: catColor,
                                    }}
                                  >
                                    {cat?.name || 'General'}
                                  </span>

                                  <span className={`font-semibold shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {t.timeSlot ? `⏰ ${t.timeSlot.split(' - ')[0]}` : `⚡ ${t.estimatedHours || 1}h`}
                                  </span>
                                </div>
                              </div>
                            );
                          })}

                          {dayTasks.length === 0 && dayGoogleEvents.length === 0 && (
                            <div className="h-full flex items-center justify-center py-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className={`text-[11px] font-mono ${isDark ? 'text-cyan-400/80' : 'text-cyan-700'}`}>
                                + Programar
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* COMPACT FIT-IN-SCREEN MODE (Neat Pills + Lateral Inspector Sync) */
                        <div className="space-y-1 my-1 flex-1 overflow-hidden">
                          {/* Google Events Mini Pill */}
                          {dayGoogleEvents.slice(0, 1).map((gEv) => (
                            <div
                              key={gEv.id}
                              className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold truncate flex items-center space-x-1 border ${
                                isDark ? 'bg-[#4285F4]/15 border-[#4285F4]/30 text-[#4285F4]' : 'bg-blue-50 border-blue-200 text-blue-700'
                              }`}
                              title={`Google: ${gEv.summary}`}
                            >
                              <CalendarDays className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{gEv.summary}</span>
                            </div>
                          ))}

                          {/* Up to 2 Compact Activity Chips */}
                          {dayTasks.slice(0, dayGoogleEvents.length > 0 ? 1 : 2).map((t) => {
                            const cat = categories.find((c) => c.id === t.category);
                            const isCompleted = t.status === 'completada';
                            const catColor = cat?.color || '#00f2ff';

                            return (
                              <div
                                key={t.id}
                                className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md font-bold truncate flex items-center justify-between gap-1 border transition-all ${
                                  isCompleted
                                    ? isDark 
                                      ? 'bg-orange-950/30 border-orange-500/50 text-orange-200 shadow-[0_0_8px_rgba(249,115,22,0.35)]' 
                                      : 'bg-orange-50 border-orange-400 text-orange-950 shadow-[0_0_8px_rgba(249,115,22,0.25)]'
                                    : isDark 
                                      ? 'bg-[#152037] border-[#25324e] text-slate-200 hover:border-cyan-500/50' 
                                      : 'bg-white border-slate-200 text-slate-800 hover:border-cyan-400 shadow-2xs'
                                }`}
                                style={{ borderLeftWidth: '3px', borderLeftColor: catColor }}
                                title={`${t.title} (${cat?.name || 'General'})`}
                              >
                                <span className={`truncate flex items-center gap-1 ${
                                  isCompleted ? 'line-through decoration-orange-400/90 decoration-2 font-bold text-slate-100 dark:text-slate-100' : ''
                                }`}>
                                  {(t.assignedBy || t.tags?.some(tag => tag.toLowerCase().includes('liz'))) && (
                                    <span title={`Asignado por ${t.assignedBy || 'Liz'}`} className="text-pink-400 shrink-0 text-[10px]">🌸</span>
                                  )}
                                  <span className="truncate">{t.title}</span>
                                </span>
                                {t.timeSlot && (
                                  <span className="text-[8px] font-mono opacity-70 shrink-0 hidden sm:inline">
                                    {t.timeSlot.split(' - ')[0]}
                                  </span>
                                )}
                              </div>
                            );
                          })}

                          {/* Remaining Tasks Counter Indicator */}
                          {dayTasks.length > (dayGoogleEvents.length > 0 ? 1 : 2) && (
                            <div className={`text-[8px] sm:text-[9px] font-mono font-bold px-1 rounded text-center truncate ${
                              isDark ? 'text-cyan-400/90 bg-cyan-500/10' : 'text-cyan-800 bg-cyan-50'
                            }`}>
                              +{dayTasks.length - (dayGoogleEvents.length > 0 ? 1 : 2)} más
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bottom Footer inside cell */}
                      <div className={`flex items-center justify-between pt-0.5 border-t border-slate-700/20 font-mono ${
                        isFullWidth ? 'text-[10px]' : 'text-[8px] sm:text-[9px]'
                      }`}>
                        <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {dayTasks.length > 0 ? `${dayTasks.length} act.` : ''}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddNewTask(dateStr);
                          }}
                          title="Añadir actividad a este día"
                          className={`rounded transition-all cursor-pointer ${
                            isFullWidth ? 'p-1' : 'p-0.5'
                          } ${
                            isDark 
                              ? 'bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950' 
                              : 'bg-cyan-100 hover:bg-cyan-600 text-cyan-800 hover:text-white'
                          }`}
                        >
                          <Plus className={`${isFullWidth ? 'w-3 h-3' : 'w-2.5 h-2.5'} stroke-[3]`} />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Hours Legend */}
              <div className={`pt-2.5 border-t flex flex-wrap items-center justify-between text-[11px] sm:text-xs font-mono gap-2 ${
                isDark ? 'border-[#2d3449] text-slate-400' : 'border-slate-200 text-slate-600'
              }`}>
                <span className="font-bold">Carga de Horas Diarias:</span>
                <div className="flex items-center space-x-3 sm:space-x-4 flex-wrap">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 inline-block shadow-xs" />
                    <span>1-3h Ligero</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block shadow-xs" />
                    <span>4-7h Óptimo</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block shadow-xs" />
                    <span>&gt;7h Carga Alta</span>
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* =========================================================================
              VIEW MODE 2: WEEK VIEW (7 SPACIOUS COLUMNS WITH DETAILED BLOCKS)
             ========================================================================= */}
          {viewMode === 'week' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {weekDays.map((wDay) => {
                  const dayTasks = tasksByDate[wDay.dateStr] || [];
                  const dayGoogleEvents = googleEventsByDate[wDay.dateStr] || [];
                  const isSelected = wDay.dateStr === selectedDateStr;
                  const dayTotalHours = dayTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

                  return (
                    <div
                      key={wDay.dateStr}
                      onClick={() => setSelectedDateStr(wDay.dateStr)}
                      className={`min-h-[420px] p-3 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer ${
                        isSelected
                          ? isDark 
                            ? 'bg-[#17233f] border-cyan-400 ring-2 ring-cyan-400/40 shadow-xl' 
                            : 'bg-cyan-50/90 border-cyan-500 ring-2 ring-cyan-500/30 shadow-md'
                          : isDark 
                            ? 'bg-[#0b1326] border-[#222d46] hover:border-slate-600' 
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Weekday Column Header */}
                      <div className="border-b pb-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-black uppercase font-mono ${
                            wDay.isToday ? 'text-cyan-400' : isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            {wDay.name}
                          </span>
                          <span className={`text-sm font-black font-mono px-2 py-0.5 rounded-lg ${
                            wDay.isToday 
                              ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-black' 
                              : isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-800'
                          }`}>
                            {wDay.dayNum}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono mt-1 text-slate-400 flex justify-between">
                          <span>{dayTasks.length} actividades</span>
                          <span className="font-bold text-cyan-400">{dayTotalHours}h</span>
                        </div>
                      </div>

                      {/* Activities Stack */}
                      <div className="flex-1 py-2 space-y-2 overflow-y-auto max-h-[320px] scrollbar-none">
                        {dayGoogleEvents.map((gEv) => (
                          <div
                            key={gEv.id}
                            className={`p-2 rounded-xl text-xs font-bold border ${
                              isDark ? 'bg-[#4285F4]/20 border-[#4285F4]/40 text-[#4285F4]' : 'bg-blue-50 border-blue-200 text-blue-800'
                            }`}
                          >
                            <div className="flex items-center space-x-1">
                              <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{gEv.summary}</span>
                            </div>
                            <span className="text-[10px] font-mono opacity-80 mt-1 block">{gEv.startTime} - {gEv.endTime}</span>
                          </div>
                        ))}

                        {dayTasks.map((t) => {
                          const cat = categories.find((c) => c.id === t.category);
                          const isCompleted = t.status === 'completada';
                          const catColor = cat?.color || '#00f2ff';

                          return (
                            <div
                              key={t.id}
                              className={`p-2.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                                isCompleted
                                  ? isDark 
                                    ? 'bg-orange-950/20 border-orange-500/50 ring-1 ring-orange-500/30 shadow-[0_0_14px_rgba(249,115,22,0.3)] text-slate-100' 
                                    : 'bg-orange-50/70 border-orange-400 ring-1 ring-orange-400/30 shadow-[0_0_12px_rgba(249,115,22,0.2)] text-slate-900'
                                  : isDark ? 'bg-[#131b2e] border-[#29385c] text-slate-100' : 'bg-white border-slate-300 text-slate-900 shadow-xs'
                              }`}
                              style={{ borderLeftWidth: '4px', borderLeftColor: catColor }}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <span className={`font-bold leading-snug ${
                                  isCompleted ? 'line-through decoration-orange-400/90 decoration-2 text-slate-100 dark:text-slate-100' : ''
                                }`}>
                                  {t.title}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleTaskStatus(t, e)}
                                  className="text-slate-400 hover:text-cyan-400 cursor-pointer"
                                >
                                  {isCompleted ? <CheckSquare className="w-3.5 h-3.5 text-orange-400" /> : <Square className="w-3.5 h-3.5" />}
                                </button>
                              </div>

                              {(t.assignedBy || t.tags?.some(tag => tag.toLowerCase().includes('liz'))) && (
                                <div className="mt-0.5 flex items-center">
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                                    <Heart className="w-2.5 h-2.5 fill-pink-400 text-pink-400" />
                                    <span>Asignado por {t.assignedBy || 'Liz'}</span>
                                  </span>
                                </div>
                              )}

                              {t.timeSlot && (
                                <div className="text-[10px] font-mono text-cyan-400 flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{t.timeSlot}</span>
                                </div>
                              )}

                              {t.finalGoal && (
                                <div className="text-[10px] text-slate-400 truncate flex items-center space-x-1">
                                  <Target className="w-3 h-3 shrink-0 text-cyan-500" />
                                  <span className="truncate">{t.finalGoal}</span>
                                </div>
                              )}

                              <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-slate-700/20">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span>{t.completedHours || 0}h / {t.estimatedHours || 1}h</span>
                                  <TaskLiveTimer task={t} compact />
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onLogHours(t);
                                  }}
                                  className="text-emerald-400 hover:underline font-bold"
                                >
                                  +Horas
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {dayTasks.length === 0 && dayGoogleEvents.length === 0 && (
                          <div className="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed rounded-xl opacity-40">
                            <CalendarIcon className="w-6 h-6 mb-1 text-slate-500" />
                            <span className="text-[11px]">Libre</span>
                          </div>
                        )}
                      </div>

                      {/* Add Button at Column Bottom */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddNewTask(wDay.dateStr);
                        }}
                        className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                          isDark 
                            ? 'bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30' 
                            : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200'
                        }`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>Añadir</span>
                      </button>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW MODE 3: DAY VIEW (HOURLY TIMELINE & SLOTTING)
             ========================================================================= */}
          {viewMode === 'day' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-[#0b1326] border-[#2d3449]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-black">Agenda Diaria Detallada</span>
                  <h3 className={`text-lg font-black capitalize ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatDateSpanish(selectedDateStr)}
                  </h3>
                </div>
                <button
                  onClick={() => handleAddNewTask(selectedDateStr)}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+ Actividad Hoy</span>
                </button>
              </div>

              {/* Day Tasks List & Schedule */}
              <div className="space-y-3">
                {selectedDayTasks.length === 0 && selectedDayGoogleEvents.length === 0 ? (
                  <div className={`p-12 text-center border-2 border-dashed rounded-3xl space-y-3 ${
                    isDark ? 'border-[#2d3449]' : 'border-slate-300'
                  }`}>
                    <CalendarIcon className="w-12 h-12 mx-auto text-cyan-400/50" />
                    <h4 className="text-base font-bold">No hay actividades programadas para este día</h4>
                    <p className={`text-xs max-w-sm mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Aprovecha para descansar o programa una nueva meta de deporte, familia o proyectos.
                    </p>
                    <button
                      onClick={() => handleAddNewTask(selectedDateStr)}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-xs rounded-xl cursor-pointer"
                    >
                      + Programar Actividad Ahora
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedDayTasks.map((t) => {
                      const cat = categories.find((c) => c.id === t.category);
                      const isCompleted = t.status === 'completada';
                      const catColor = cat?.color || '#00f2ff';

                      return (
                        <div
                          key={t.id}
                          className={`p-4 rounded-2xl border space-y-3 transition-all ${
                            isCompleted
                              ? isDark 
                                ? 'bg-orange-950/20 border-orange-500/50 ring-1 ring-orange-500/30 shadow-[0_0_16px_rgba(249,115,22,0.3)] text-slate-100' 
                                : 'bg-orange-50/70 border-orange-400 ring-1 ring-orange-400/30 shadow-[0_0_14px_rgba(249,115,22,0.2)] text-slate-900'
                              : isDark ? 'bg-[#0b1326] border-[#2d3449] hover:border-cyan-500' : 'bg-white border-slate-200 hover:border-cyan-400 shadow-md'
                          }`}
                          style={{ borderLeftWidth: '6px', borderLeftColor: catColor }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                                {isCompleted && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-[0_0_6px_rgba(249,115,22,0.3)] shrink-0">
                                    ✓ Terminada
                                  </span>
                                )}
                                <span
                                  className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase"
                                  style={{ backgroundColor: `${catColor}20`, color: catColor }}
                                >
                                  {cat?.name}
                                </span>
                                {(t.assignedBy || t.tags?.some(tag => tag.toLowerCase().includes('liz'))) && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                                    <Heart className="w-3 h-3 fill-pink-400 text-pink-400" />
                                    <span>Asignado por {t.assignedBy || 'Liz'}</span>
                                  </span>
                                )}
                              </div>
                              <h4 className={`text-base font-black mt-1 ${
                                isCompleted ? 'line-through decoration-orange-400/90 decoration-2 text-slate-100 dark:text-slate-100' : ''
                              }`}>
                                {t.title}
                              </h4>
                            </div>

                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <TaskLiveTimer task={t} />
                              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold border ${getStatusBadgeColor(t.status)}`}>
                                {t.status}
                              </span>
                            </div>
                          </div>

                          {t.timeSlot && (
                            <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-cyan-400">
                              <Clock className="w-4 h-4" />
                              <span>Horario Programado: {t.timeSlot}</span>
                            </div>
                          )}

                          {t.finalGoal && (
                            <div className={`p-2 rounded-xl border text-xs flex items-center space-x-2 ${
                              isDark ? 'bg-[#131b2e] border-[#2d3449] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}>
                              <Target className="w-4 h-4 text-cyan-400 shrink-0" />
                              <span className="truncate">{t.finalGoal}</span>
                            </div>
                          )}

                          {t.description && (
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                              {t.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-slate-700/30 text-xs font-mono">
                            <span className="font-bold">
                              {t.completedHours || 0}h / {t.estimatedHours || 1}h
                            </span>

                            <div className="flex items-center space-x-2">
                              {onConsultAgent && (
                                <button
                                  onClick={() => onConsultAgent(t)}
                                  className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold hover:bg-cyan-500/30 cursor-pointer flex items-center space-x-1"
                                >
                                  <Bot className="w-3.5 h-3.5" />
                                  <span>Tips IA</span>
                                </button>
                              )}
                              <button
                                onClick={() => onLogHours(t)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold hover:bg-emerald-500/30 cursor-pointer"
                              >
                                + Horas
                              </button>
                              <button
                                onClick={() => onEditTask(t)}
                                className="px-2.5 py-1 rounded-lg bg-slate-700 text-slate-200 font-bold hover:bg-slate-600 cursor-pointer"
                              >
                                Editar
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW MODE 4: AGENDA / LIST VIEW (CHRONOLOGICAL TIMELINE)
             ========================================================================= */}
          {viewMode === 'agenda' && (
            <div className="space-y-4">
              <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Próximas Actividades Programadas ({allFilteredTasks.length})
              </div>

              <div className="space-y-3">
                {allFilteredTasks.map((t) => {
                  const cat = categories.find((c) => c.id === t.category);
                  const isCompleted = t.status === 'completada';
                  const catColor = cat?.color || '#00f2ff';

                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        if (t.assignedDate) setSelectedDateStr(t.assignedDate);
                      }}
                      className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all cursor-pointer ${
                        isCompleted
                          ? isDark 
                            ? 'bg-orange-950/20 border-orange-500/50 ring-1 ring-orange-500/30 shadow-[0_0_16px_rgba(249,115,22,0.3)] text-slate-100' 
                            : 'bg-orange-50/70 border-orange-400 ring-1 ring-orange-400/30 shadow-[0_0_14px_rgba(249,115,22,0.2)] text-slate-900'
                          : isDark ? 'bg-[#0b1326] border-[#2d3449] hover:border-cyan-500' : 'bg-white border-slate-200 hover:border-cyan-400 shadow-sm'
                      }`}
                      style={{ borderLeftWidth: '6px', borderLeftColor: catColor }}
                    >
                      <div className="flex items-start space-x-3.5">
                        <div className={`p-2.5 rounded-xl border text-center font-mono shrink-0 ${
                          isDark ? 'bg-[#131b2e] border-[#2d3449]' : 'bg-slate-100 border-slate-300'
                        }`}>
                          <div className="text-[10px] uppercase font-bold text-cyan-400">
                            {t.assignedDate ? formatShortDateSpanish(t.assignedDate).split(' ')[1] : 'S/F'}
                          </div>
                          <div className="text-base font-black text-slate-200">
                            {t.assignedDate ? t.assignedDate.split('-')[2] : '--'}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            {isCompleted && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-[0_0_6px_rgba(249,115,22,0.3)] shrink-0">
                                ✓ Terminada
                              </span>
                            )}
                            <span
                              className="px-2 py-0.2 rounded text-[10px] font-mono font-bold"
                              style={{ backgroundColor: `${catColor}20`, color: catColor }}
                            >
                              {cat?.name}
                            </span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getStatusBadgeColor(t.status)}`}>
                              {t.status}
                            </span>
                            <TaskLiveTimer task={t} />
                          </div>

                          <h4 className={`text-sm md:text-base font-black mt-1 ${
                            isCompleted ? 'line-through decoration-orange-400/90 decoration-2 text-slate-100 dark:text-slate-100' : ''
                          }`}>
                            {t.title}
                          </h4>

                          {t.finalGoal && (
                            <p className="text-xs text-slate-400 mt-0.5 flex items-center space-x-1">
                              <Target className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span>{t.finalGoal}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 self-end md:self-center">
                        <span className="text-xs font-mono font-bold mr-2 text-slate-300">
                          {t.completedHours || 0}h / {t.estimatedHours || 1}h
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onLogHours(t);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-xs hover:bg-emerald-500/30 cursor-pointer"
                        >
                          + Horas
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTask(t);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs hover:bg-slate-700 cursor-pointer"
                        >
                          Editar
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW MODE 5: OFFICIAL GOOGLE CALENDAR EMBED
             ========================================================================= */}
          {viewMode === 'google' && (
            <div className="space-y-4">
              {/* Top Controls Bar for Google Calendar */}
              <div className={`p-4 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 ${
                isDark ? 'bg-[#0b1326] border-[#2d3449]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#4285F4]/20 border border-[#4285F4]/40 flex items-center justify-center text-[#4285F4] shrink-0 shadow-xs">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Google Calendar Oficial</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                        En Vivo
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1 flex-wrap">
                      <span className="text-xs text-slate-400 font-mono">Cuenta activa:</span>
                      {isEditingEmail ? (
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="email"
                            value={tempEmailInput}
                            onChange={(e) => setTempEmailInput(e.target.value)}
                            className="text-xs px-2 py-0.5 rounded bg-slate-800 text-white border border-slate-600 focus:outline-hidden"
                            placeholder="miguelpatino0@gmail.com"
                          />
                          <button
                            onClick={() => {
                              if (tempEmailInput.trim()) setGoogleEmail(tempEmailInput.trim());
                              setIsEditingEmail(false);
                            }}
                            className="px-2 py-0.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded cursor-pointer"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setIsEditingEmail(false)}
                            className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-mono font-bold text-cyan-400">{googleEmail}</span>
                          <button
                            onClick={() => {
                              setTempEmailInput(googleEmail);
                              setIsEditingEmail(true);
                            }}
                            className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                            title="Cambiar correo de Google Calendar"
                          >
                            Cambiar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subview Mode buttons & Actions */}
                <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                  {/* Google Calendar Auto-write Token Connection Status */}
                  {hasGoogleToken ? (
                    <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-xs">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Bot Conectado a Google</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleConnectGCal}
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-black hover:brightness-110 shadow-sm transition-all cursor-pointer"
                      title="Vincular cuenta con Google para que el bot de Telegram escriba directamente en tu Google Calendar"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Vincular Escritura Automática</span>
                    </button>
                  )}

                  {/* Mode selector */}
                  <div className={`flex items-center p-1 rounded-xl border ${
                    isDark ? 'bg-[#131b2e] border-[#2d3449]' : 'bg-white border-slate-300'
                  }`}>
                    {(['MONTH', 'WEEK', 'AGENDA'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setGoogleEmbedMode(mode)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          googleEmbedMode === mode
                            ? 'bg-[#4285F4] text-white font-black shadow-xs'
                            : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {mode === 'MONTH' ? 'Mes' : mode === 'WEEK' ? 'Semana' : 'Agenda'}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setGoogleIframeKey((prev) => prev + 1)}
                    title="Recargar Visor de Google Calendar"
                    className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                      isDark ? 'bg-[#131b2e] border-[#2d3449] text-slate-300 hover:text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href="https://calendar.google.com/calendar/u/0/r/eventedit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Nuevo Evento Google</span>
                  </a>

                  <a
                    href="https://calendar.google.com/calendar/u/0/r"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir en Google Calendar</span>
                  </a>
                </div>
              </div>

              {/* Interactive Google Calendar Iframe */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl bg-white">
                <iframe
                  key={googleIframeKey}
                  src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(googleEmail)}&ctz=${encodeURIComponent(userTimeZone)}&mode=${googleEmbedMode}&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=1&showTz=1&bgcolor=%23ffffff`}
                  style={{ border: 0 }}
                  width="100%"
                  height="780"
                  frameBorder="0"
                  scrolling="no"
                  title="Google Calendar Oficial"
                  className="w-full h-[650px] md:h-[780px] bg-white"
                />
              </div>

              {/* Informative Footer & 1-Click Sync */}
              <div className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 ${
                isDark ? 'bg-[#0b1326] border-[#2d3449] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <div className="flex items-center space-x-2 font-bold text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Sincronización en tiempo real con Google Calendar</span>
                </div>
                <p>
                  Estás visualizando directamente el visor oficial de Google Calendar sincronizado con tu cuenta <strong>{googleEmail}</strong>. Cualquier cita, recordatorio o reunión creada desde tu teléfono móvil, reloj o navegador se actualiza en tiempo real.
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleStartGoogleSync}
                    disabled={isSyncing}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>{isSyncing ? 'Sincronizando...' : 'Exportar todas mis Metas de LifeBlocks a Google Calendar (con alarma 10 min)'}</span>
                  </button>
                  <a
                    href="https://calendar.google.com/calendar/u/0/r"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline flex items-center space-x-1 font-mono font-bold"
                  >
                    <span>Abrir en pantalla completa de Google Calendar</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* =========================================================================
            DAY INSPECTOR & DAILY SUMMARY / CLOSURE BLOCK (SIDE PANEL)
           ========================================================================= */}
        {!isFullWidth && (
          <div className="lg:col-span-4 xl:col-span-4 space-y-5">
            
            {/* 1. Resumen Total al Día de Hoy & Cierre de Jornada (Solicitado por el usuario) */}
            <CalendarDailyClosureCard
              tasks={tasks}
              categories={categories}
              todayYMD={todayYMD}
              onAssignTaskDate={onAssignTaskDate}
              onQuickStatusChange={onQuickStatusChange}
              onOpenNewTaskModal={onOpenNewTaskModal}
            />

            {/* 2. Selected Day Full Details Inspector */}
            <div className={`border rounded-3xl p-5 shadow-xl space-y-4 transition-all ${
              isDark ? 'bg-[#131b2e] border-[#2d3449]' : 'bg-white border-slate-200 shadow-slate-900/5'
            }`}>
              
              {/* Header */}
              <div className="border-b pb-3 flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-black">
                    Día Seleccionado
                  </span>
                  <h3 className={`text-base font-black capitalize leading-tight mt-0.5 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {formatDateSpanish(selectedDateStr)}
                  </h3>
                </div>

                <button
                  onClick={() => handleAddNewTask(selectedDateStr)}
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-sm flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Añadir</span>
                </button>
              </div>

              {/* Hours KPI */}
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-[#0b1326] border-[#2d3449]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Planificado</div>
                  <div className={`text-lg font-black font-mono mt-0.5 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                    {selectedDayTotalHours} hrs
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Ejecutado</div>
                  <div className="text-lg font-black font-mono text-emerald-500 mt-0.5">
                    {selectedDayCompletedHours} hrs
                  </div>
                </div>
              </div>

              {/* Google Calendar Occupied Slots */}
              {selectedDayGoogleEvents.length > 0 && (
                <div className={`p-3 rounded-2xl border space-y-2 ${
                  isDark ? 'bg-[#4285F4]/10 border-[#4285F4]/30' : 'bg-blue-50 border-blue-200'
                }`}>
                  <span className="text-[10px] font-mono uppercase font-black text-[#4285F4] flex items-center space-x-1">
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>Google Calendar ({selectedDayGoogleEvents.length})</span>
                  </span>
                  <div className="space-y-1.5">
                    {selectedDayGoogleEvents.map((gEv) => (
                      <div
                        key={gEv.id}
                        className={`text-xs p-2 rounded-xl flex items-center justify-between border ${
                          isDark ? 'bg-[#0b1326] border-[#4285F4]/30 text-slate-200' : 'bg-white border-blue-200 text-slate-800'
                        }`}
                      >
                        <div className="truncate mr-2">
                          <p className="font-bold truncate text-[#4285F4]">{gEv.summary}</p>
                          <p className="text-[10px] font-mono opacity-80">{gEv.startTime} - {gEv.endTime}</p>
                        </div>
                        {gEv.htmlLink && (
                          <a
                            href={gEv.htmlLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Day Tasks List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  <span>Actividades ({selectedDayTasks.length})</span>
                  {selectedDayTotalHours > 7 && (
                    <span className="text-amber-400 text-[10px] flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Carga Alta</span>
                    </span>
                  )}
                </div>

                {selectedDayTasks.length === 0 ? (
                  <div className={`p-6 text-center border-2 border-dashed rounded-2xl space-y-2 ${
                    isDark ? 'border-[#2d3449]' : 'border-slate-300'
                  }`}>
                    <CalendarIcon className="w-8 h-8 mx-auto text-slate-500" />
                    <p className="text-xs text-slate-400">Sin actividades para esta fecha.</p>
                    <button
                      onClick={() => handleAddNewTask(selectedDateStr)}
                      className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer"
                    >
                      + Programar ahora
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {selectedDayTasks.map((t) => {
                      const cat = categories.find((c) => c.id === t.category);
                      const isCompleted = t.status === 'completada';
                      const catColor = cat?.color || '#00f2ff';

                      return (
                        <div
                          key={t.id}
                          className={`p-3.5 rounded-2xl border space-y-2 transition-all ${
                            isCompleted
                              ? isDark 
                                ? 'bg-orange-950/20 border-orange-500/50 ring-1 ring-orange-500/30 shadow-[0_0_14px_rgba(249,115,22,0.3)]' 
                                : 'bg-orange-50/70 border-orange-400 ring-1 ring-orange-400/30 shadow-[0_0_12px_rgba(249,115,22,0.2)]'
                              : isDark ? 'bg-[#0b1326] border-[#2d3449]' : 'bg-slate-50 border-slate-200'
                          }`}
                          style={{ borderLeftWidth: '4px', borderLeftColor: catColor }}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                                {isCompleted && (
                                  <span className="px-1.5 py-0.2 rounded text-[8.5px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-[0_0_6px_rgba(249,115,22,0.3)] shrink-0">
                                    ✓ Hecha
                                  </span>
                                )}
                                <span
                                  className="px-2 py-0.2 rounded text-[9px] font-mono font-bold uppercase"
                                  style={{ backgroundColor: `${catColor}20`, color: catColor }}
                                >
                                  {cat?.name}
                                </span>
                                {(t.assignedBy || t.tags?.some(tag => tag.toLowerCase().includes('liz'))) && (
                                  <span className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                                    <Heart className="w-2.5 h-2.5 fill-pink-400 text-pink-400" />
                                    <span>Liz</span>
                                  </span>
                                )}
                              </div>
                              <h5 className={`font-bold text-xs mt-1 ${
                                isCompleted ? 'line-through decoration-orange-400/90 decoration-2 text-slate-100 dark:text-slate-100' : ''
                              }`}>
                                {t.title}
                              </h5>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleToggleTaskStatus(t, e)}
                              className="text-slate-400 hover:text-cyan-400 cursor-pointer"
                            >
                              {isCompleted ? <CheckSquare className="w-4 h-4 text-orange-400" /> : <Square className="w-4 h-4" />}
                            </button>
                          </div>

                          {t.timeSlot && (
                            <div className="text-[11px] font-mono font-bold text-cyan-400 flex items-center space-x-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{t.timeSlot}</span>
                            </div>
                          )}

                          {t.finalGoal && (
                            <div className={`text-[11px] p-2 rounded-xl border flex items-center space-x-1.5 ${
                              isDark ? 'bg-[#131b2e] border-[#2d3449] text-slate-300' : 'bg-white border-slate-200 text-slate-800'
                            }`}>
                              <Target className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span className="truncate">{t.finalGoal}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-slate-700/20 text-xs font-mono">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <span className="text-[11px] font-bold">
                                {t.completedHours || 0}h / {t.estimatedHours || 1}h
                              </span>
                              <TaskLiveTimer task={t} compact />
                            </div>

                            <div className="flex items-center space-x-1">
                              {onConsultAgent && (
                                <button
                                  onClick={() => onConsultAgent(t)}
                                  className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-[10px] font-bold"
                                >
                                  Tips
                                </button>
                              )}
                              <button
                                onClick={() => handleSyncSingleTask(t)}
                                title={t.gcalSynced ? 'Sincronizada con Google Calendar. Toca para actualizar.' : 'Sincronizar a Google Calendar (alarma 10 min antes)'}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-colors ${
                                  t.gcalSynced
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-[#4285F4]/20 hover:bg-[#4285F4]/30 text-[#4285F4]'
                                }`}
                              >
                                <CalendarDays className="w-3 h-3" />
                                <span>{t.gcalSynced ? '✓ GCal' : '+Cal'}</span>
                              </button>
                              <button
                                onClick={() => onLogHours(t)}
                                className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-bold"
                              >
                                +Horas
                              </button>
                              <button
                                onClick={() => onEditTask(t)}
                                className="px-2 py-0.5 rounded-lg bg-slate-700 text-slate-200 text-[10px] font-bold"
                              >
                                Editar
                              </button>
                              {onDeleteTask && (
                                <button
                                  onClick={() => {
                                    if (window.confirm(`¿Eliminar "${t.title}"?`)) {
                                      onDeleteTask(t.id);
                                    }
                                  }}
                                  className="p-1 rounded-lg text-slate-400 hover:text-red-400"
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

            </div>

            {/* Unassigned Tasks Quick-Drop Area */}
            {unassignedTasks.length > 0 && (
              <div className={`border rounded-3xl p-5 shadow-xl space-y-3 ${
                isDark ? 'bg-[#131b2e] border-[#2d3449]' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase font-black text-amber-400 flex items-center space-x-1">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Sin Asignar ({unassignedTasks.length})</span>
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {unassignedTasks.map((ut) => (
                    <div
                      key={ut.id}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                        isDark ? 'bg-[#0b1326] border-[#2d3449]' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <span className="truncate font-bold text-xs">{ut.title}</span>
                      <button
                        onClick={() => onAssignTaskDate(ut.id, selectedDateStr)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 font-bold text-[10px] font-mono shrink-0 transition-colors"
                      >
                        Asignar Hoy
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
};
