import React, { useState, useEffect } from 'react';
import { Task, CategoryInfo } from '../types';
import { useTheme } from '../context/ThemeContext';
import { 
  getTodayAlerts, 
  fetchTaskRecommendations, 
  AgentRecommendation, 
  UpcomingTaskAlert,
  requestNotificationPermission,
  sendAgentNotification,
  getRemainingWeekOverview,
  WeekOverviewSummary
} from '../utils/agentHelper';
import { 
  Bot, 
  Bell, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  CheckSquare, 
  AlertCircle, 
  Volume2, 
  MessageSquare,
  Flame,
  ArrowRight,
  ShoppingCart,
  Calendar,
  Circle,
  Moon,
  Sun,
  ListTodo
} from 'lucide-react';

interface AgentBannerProps {
  tasks: Task[];
  categories: CategoryInfo[];
  onOpenLogHours: (task: Task) => void;
  onOpenAgentModal: (initialTask?: Task) => void;
  onToggleSubgoal?: (taskId: string, subgoalId: string) => void;
}

export const AgentBanner: React.FC<AgentBannerProps> = ({
  tasks,
  categories,
  onOpenLogHours,
  onOpenAgentModal,
  onToggleSubgoal,
}) => {
  const { isDark } = useTheme();
  const [alerts, setAlerts] = useState<UpcomingTaskAlert[]>([]);
  const [selectedAlertIndex, setSelectedAlertIndex] = useState(0);
  const [recommendation, setRecommendation] = useState<AgentRecommendation | null>(null);
  const [isLoadingTips, setIsLoadingTips] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [checkedChecklist, setCheckedChecklist] = useState<Record<string, boolean>>({});
  const [showWeekSummary, setShowWeekSummary] = useState(false);
  const [weekOverview, setWeekOverview] = useState<WeekOverviewSummary | null>(null);

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  // Update alerts and week overview on tasks change and interval
  useEffect(() => {
    const update = () => {
      const currentAlerts = getTodayAlerts(tasks);
      setAlerts(currentAlerts);
      const overview = getRemainingWeekOverview(tasks);
      setWeekOverview(overview);
    };
    update();
    const interval = setInterval(update, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [tasks]);

  // Ensure selectedAlertIndex is always within valid bounds
  const safeIndex = selectedAlertIndex >= alerts.length ? Math.max(0, alerts.length - 1) : selectedAlertIndex;
  const rawAlert = alerts[safeIndex];

  // Dynamically resolve the freshest task state directly from `tasks` props so checklist toggles reflect immediately
  const currentAlert: UpcomingTaskAlert | undefined = rawAlert ? {
    ...rawAlert,
    task: tasks.find(t => t.id === rawAlert.task.id) || rawAlert.task,
  } : undefined;

  // Fetch AI tips when selected alert changes
  useEffect(() => {
    if (!currentAlert) {
      setRecommendation(null);
      return;
    }

    let isMounted = true;
    setIsLoadingTips(true);
    fetchTaskRecommendations(currentAlert.task)
      .then((rec) => {
        if (isMounted) {
          setRecommendation(rec);
          setIsLoadingTips(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingTips(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentAlert?.task?.id, JSON.stringify(currentAlert?.task?.subgoals)]);

  const handleToggleNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
    if (granted) {
      sendAgentNotification(
        '¡Agente LifeBlocks Activado! 🚀',
        'Te recordaremos tus bloques de vida y actividades programadas oportunamente con antelación para tus compras y preparativos.'
      );
    }
  };

  const toggleChecklistItem = (item: string) => {
    setCheckedChecklist((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  const isEveningTime = weekOverview?.isEvening ?? (new Date().getHours() >= 18);

  if (alerts.length === 0) {
    return (
      <div className={`rounded-2xl border p-4 text-sm flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg transition-all ${
        isDark 
          ? 'bg-[#111a33]/80 border-[#1e294b]' 
          : 'bg-white border-slate-200 shadow-slate-950/5'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
            isDark ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
          }`}>
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`font-bold text-xs tracking-wide uppercase ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>Agente LifeBlocks</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sin compromisos urgentes para hoy</span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              ¿Quieres planificar un nuevo bloque o revisar el plan del resto de la semana?
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          {weekOverview && weekOverview.totalUpcomingTasks > 0 && (
            <button
              onClick={() => setShowWeekSummary(!showWeekSummary)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1.5 cursor-pointer ${
                isDark 
                  ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border-indigo-500/30' 
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
              <span>Plan de la Semana</span>
            </button>
          )}
          <button
            onClick={() => onOpenAgentModal()}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1.5 cursor-pointer ${
              isDark 
                ? 'bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 border-cyan-500/30' 
                : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border-cyan-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Consultar al Agente</span>
          </button>
        </div>
      </div>
    );
  }

  const task = currentAlert.task;
  const isOngoing = currentAlert.status === 'ongoing';
  const isUpcoming = currentAlert.status === 'upcoming';
  const isAnticipation = currentAlert.status === 'anticipation' || currentAlert.alertType === 'advance_subtasks_prep';
  const pendingSubgoals = Array.isArray(task.subgoals) ? task.subgoals.filter(s => !s.completed) : [];
  const completedSubgoalsCount = Array.isArray(task.subgoals) ? task.subgoals.filter(s => s.completed).length : 0;
  const totalSubgoalsCount = Array.isArray(task.subgoals) ? task.subgoals.length : 0;

  return (
    <div className={`rounded-2xl border shadow-xl overflow-hidden transition-all duration-300 ${
      isAnticipation 
        ? isDark
          ? 'border-amber-500/40 bg-gradient-to-r from-[#171424] via-[#1f1938] to-[#171424] shadow-amber-950/20'
          : 'border-amber-200 bg-amber-50/90 shadow-slate-950/5'
        : isDark
          ? 'border-cyan-500/30 bg-gradient-to-r from-[#0d162e] via-[#111e40] to-[#0d162e] shadow-cyan-950/30'
          : 'border-cyan-200 bg-cyan-50/80 shadow-slate-950/5'
    }`}>
      
      {/* Top Header Bar */}
      <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left Side: Agent Identity & Current Reminder */}
        <div className="flex items-start sm:items-center space-x-3.5 flex-1">
          <div className="relative">
            <div className={`w-11 h-11 rounded-2xl p-0.5 shadow-lg flex items-center justify-center ${
              isAnticipation
                ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/20'
                : 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/20'
            }`}>
              <div className={`w-full h-full rounded-[14px] flex items-center justify-center ${
                isDark ? 'bg-[#0b1326]' : 'bg-white'
              }`}>
                {isAnticipation ? (
                  <ShoppingCart className="w-5 h-5 text-amber-500 animate-pulse" />
                ) : (
                  <Bot className={`w-6 h-6 animate-pulse ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                )}
              </div>
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
              isDark ? 'border-[#0b1326]' : 'border-white'
            } ${
              isAnticipation ? 'bg-amber-400' : 'bg-emerald-500'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </span>
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className={`text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center space-x-1 ${
                isAnticipation
                  ? isDark ? 'text-amber-300 bg-amber-950/60 border-amber-800/60' : 'text-amber-800 bg-amber-100 border-amber-300'
                  : isDark ? 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60' : 'text-cyan-800 bg-cyan-100 border-cyan-300'
              }`}>
                <Sparkles className="w-3 h-3" />
                <span>{isAnticipation ? 'Preparación Previa & Compras' : 'Agente de Recordatorios'}</span>
              </span>
              
              {isAnticipation && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center space-x-1 ${
                  isDark ? 'text-amber-300 bg-amber-500/20 border-amber-500/40' : 'text-amber-800 bg-amber-100 border-amber-300'
                }`}>
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span>En {currentAlert.daysUntilDue} día(s) • Faltan {pendingSubgoals.length} compras/subtareas</span>
                </span>
              )}

              {isOngoing && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border animate-pulse flex items-center space-x-1 ${
                  isDark ? 'text-amber-300 bg-amber-500/20 border-amber-500/40' : 'text-amber-800 bg-amber-100 border-amber-300'
                }`}>
                  <Flame className="w-3 h-3" />
                  <span>En curso ahora</span>
                </span>
              )}

              {isUpcoming && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center space-x-1 ${
                  isDark ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40' : 'text-emerald-800 bg-emerald-100 border-emerald-300'
                }`}>
                  <Clock className="w-3 h-3" />
                  <span>Próximamente</span>
                </span>
              )}

              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                ({safeIndex + 1} de {alerts.length} recordatorio{alerts.length > 1 ? 's' : ''})
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <h3 className={`text-base sm:text-lg font-black tracking-tight flex items-center gap-2 flex-wrap ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <span>{task.title}</span>
                <span className={`text-xs font-normal px-2 py-0.5 rounded-md border ${
                  isDark ? 'text-slate-400 bg-[#162244] border-[#2b3a67]' : 'text-slate-600 bg-white border-slate-300'
                }`}>
                  {currentAlert.timeSlotLabel}
                </span>
              </h3>
            </div>

            {/* Smart notice: Pending subgoals vs fully clear */}
            {pendingSubgoals.length > 0 ? (
              <div className="flex items-center space-x-2 text-xs flex-wrap gap-y-1">
                <span className={`inline-flex items-center space-x-1 font-semibold px-2 py-0.5 rounded border ${
                  isDark 
                    ? 'text-amber-300 bg-amber-950/40 border-amber-500/30' 
                    : 'text-amber-800 bg-amber-100 border-amber-300 font-bold'
                }`}>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Aún tienes pendiente:</span>
                </span>
                <span className={`font-medium line-clamp-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {pendingSubgoals.map(s => s.title).join(', ')}
                </span>
              </div>
            ) : totalSubgoalsCount > 0 ? (
              <p className={`text-xs flex items-center space-x-1.5 ${isDark ? 'text-emerald-300' : 'text-emerald-700 font-semibold'}`}>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>¡Todas las subtareas y compras completadas! Listo para ejecutar tu actividad principal.</span>
              </p>
            ) : (
              <p className={`text-xs leading-relaxed line-clamp-1 ${isDark ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>
                🎯 <strong className={isDark ? 'text-cyan-200' : 'text-cyan-700 font-bold'}>Meta:</strong> {task.finalGoal || 'Cumplir el bloque diario'} • <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>({task.dailyHours || task.estimatedHours || 1}h estimadas)</span>
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Action Buttons & Navigation */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
          
          {/* Quick cycle if multiple alerts */}
          {alerts.length > 1 && (
            <div className={`flex items-center rounded-xl border p-1 text-xs ${
              isDark ? 'bg-[#0b1326]/70 border-[#2d3a58]' : 'bg-white border-slate-200'
            }`}>
              {alerts.map((al, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedAlertIndex(idx)}
                  title={al.task.title}
                  className={`w-6 h-6 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    safeIndex === idx
                      ? al.alertType === 'advance_subtasks_prep'
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'bg-cyan-500 text-white shadow-xs'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          )}

          {/* Resumen Nocturno / Semana Restante Toggle */}
          <button
            onClick={() => setShowWeekSummary(!showWeekSummary)}
            title="Ver resumen y preparación para el resto de la semana"
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1.5 cursor-pointer ${
              showWeekSummary
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                : isEveningTime
                ? isDark ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40 hover:bg-indigo-900/60 animate-pulse' : 'bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-200 animate-pulse'
                : isDark ? 'bg-[#162244] text-indigo-300 border-[#2b3a67] hover:bg-[#1f2f5c]' : 'bg-white text-indigo-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Plan Nocturno</span>
            <span className="sm:hidden">Semana</span>
          </button>

          {/* Toggle Notification Permission */}
          <button
            onClick={handleToggleNotifications}
            title={notificationsEnabled ? 'Notificaciones activadas' : 'Activar notificaciones del navegador'}
            className={`p-2 rounded-xl text-xs border transition-all flex items-center space-x-1.5 cursor-pointer ${
              notificationsEnabled
                ? isDark ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : isDark ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white' : 'bg-white text-slate-500 border-slate-200 hover:text-slate-900'
            }`}
          >
            <Bell className={`w-4 h-4 ${notificationsEnabled ? 'text-emerald-500' : ''}`} />
          </button>

          {/* Log hours / complete button */}
          <button
            onClick={() => onOpenLogHours(task)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer ${
              isDark 
                ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border-emerald-500/40' 
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Registrar</span>
            <span>Avance</span>
          </button>

          {/* Chat with Agent */}
          <button
            onClick={() => onOpenAgentModal(task)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-md cursor-pointer ${
              isAnticipation
                ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-amber-400/20'
                : 'bg-cyan-500 text-white hover:bg-cyan-600 shadow-cyan-500/20'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Consultar IA</span>
          </button>

          {/* Expand Recommendations Drawer */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 rounded-xl text-xs border transition-all flex items-center space-x-1 cursor-pointer ${
              isDark 
                ? 'bg-[#162244] text-cyan-300 hover:bg-[#1f2f5c] border-[#2b3a67]' 
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
            }`}
          >
            <span className="text-[11px] font-semibold hidden md:inline">
              {isExpanded ? 'Ocultar Consejos' : 'Ver Consejos'}
            </span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Evening Week Overview Section (De mañana en adelante hasta el domingo) */}
      {showWeekSummary && weekOverview && (
        <div className={`border-t p-4 sm:p-5 animate-in slide-in-from-top-2 duration-200 ${
          isDark 
            ? 'border-indigo-500/30 bg-gradient-to-b from-[#0e152e] to-[#0a0f21]' 
            : 'border-indigo-100 bg-indigo-50/60'
        }`}>
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
            isDark ? 'border-indigo-500/20' : 'border-indigo-200/60'
          }`}>
            <div className="flex items-center space-x-2.5">
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                isDark ? 'bg-indigo-500/20 border-indigo-400/40 text-indigo-300' : 'bg-indigo-100 border-indigo-200 text-indigo-700'
              }`}>
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <h4 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <span>Resumen de Cierre de Día & Plan Semanal</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    isDark ? 'bg-indigo-950 text-indigo-300 border-indigo-700/50' : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                  }`}>
                    Próximos días hasta el domingo
                  </span>
                </h4>
                <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {weekOverview.quickGreeting}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowWeekSummary(false)}
              className={`text-xs px-2 py-1 rounded self-end sm:self-auto cursor-pointer transition-all ${
                isDark ? 'text-slate-400 hover:text-white bg-[#162040] hover:bg-[#1f2c58]' : 'text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Cerrar plan semanal
            </button>
          </div>

          {/* Cards for each upcoming day */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
            {weekOverview.days.map((day) => (
              <div 
                key={day.dateStr}
                className={`p-3.5 rounded-xl border transition-all ${
                  day.isTomorrow
                    ? isDark ? 'bg-[#151c3d] border-cyan-500/50 shadow-md shadow-cyan-950/40' : 'bg-white border-cyan-300 shadow-md shadow-cyan-500/5'
                    : day.tasks.length > 0
                    ? isDark ? 'bg-[#111933] border-[#22315b]' : 'bg-white border-slate-200'
                    : isDark ? 'bg-[#0d1428]/60 border-[#192445] opacity-70' : 'bg-slate-50 border-slate-200 opacity-70'
                }`}
              >
                <div className={`flex items-center justify-between pb-2 border-b ${
                  isDark ? 'border-slate-700/40' : 'border-slate-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-bold ${
                      day.isTomorrow ? isDark ? 'text-cyan-400' : 'text-cyan-700' : isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}>
                      {day.dayLabel}
                    </span>
                    {day.isTomorrow && (
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                        isDark ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-cyan-100 text-cyan-800 border-cyan-200'
                      }`}>
                        Próximo
                      </span>
                    )}
                  </div>
                  <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {day.tasks.length} {day.tasks.length === 1 ? 'actividad' : 'actividades'}
                  </span>
                </div>

                {/* Day Tasks List */}
                <div className="mt-2.5 space-y-2">
                  {day.tasks.length > 0 ? (
                    day.tasks.map((taskItem, tIdx) => {
                      const tip = day.prepTips[tIdx];
                      return (
                        <div key={taskItem.id} className={`p-2.5 rounded-lg border space-y-1.5 ${
                          isDark ? 'bg-[#0b1226] border-[#1f2d52]' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="flex items-start justify-between gap-1">
                            <span className={`text-xs font-bold line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {taskItem.title}
                            </span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                              isDark ? 'text-cyan-300 bg-[#162347]' : 'text-cyan-800 bg-cyan-100'
                            }`}>
                              {taskItem.timeSlot || 'Por definir'}
                            </span>
                          </div>
                          
                          {/* Specific advance preparation tip for next day/future */}
                          <div className={`text-[11px] p-1.5 rounded flex items-start space-x-1.5 border ${
                            isDark ? 'text-amber-200/90 bg-amber-950/30 border-amber-500/20' : 'text-amber-800 bg-amber-50 border-amber-200'
                          }`}>
                            <span className="shrink-0 mt-0.5">🎒</span>
                            <span className="leading-tight">{tip?.prepAdvice}</span>
                          </div>

                          {tip?.pendingSubgoals && tip.pendingSubgoals.length > 0 && (
                            <div className={`text-[10px] flex items-center space-x-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                              <span className="text-amber-500 font-bold">•</span>
                              <span className="line-clamp-1">Pendiente comprar/completar: {tip.pendingSubgoals.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className={`text-xs italic py-2 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Día libre sin bloques asignados
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className={`mt-3.5 pt-2.5 border-t flex flex-col sm:flex-row items-center justify-between text-xs gap-2 ${
            isDark ? 'border-indigo-500/20 text-slate-400' : 'border-indigo-200/60 text-slate-600'
          }`}>
            <span>
              💡 Cada noche este resumen se actualiza mostrándote solo desde el día siguiente en adelante.
            </span>
            <button
              onClick={() => onOpenAgentModal()}
              className={`font-medium flex items-center space-x-1 cursor-pointer transition-colors ${
                isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-700 hover:text-cyan-800'
              }`}
            >
              <span>Consultar al Agente para organizar tus días</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Expandable AI Tips & Preparation Checklist */}
      {isExpanded && (
        <div className={`border-t p-4 sm:p-5 animate-in slide-in-from-top-2 duration-200 ${
          isDark ? 'border-cyan-500/20 bg-[#090f20]/90' : 'border-slate-200 bg-slate-50/90'
        }`}>
          {isLoadingTips ? (
            <div className={`py-4 flex items-center justify-center space-x-3 text-xs ${
              isDark ? 'text-cyan-400' : 'text-cyan-700'
            }`}>
              <Sparkles className="w-4 h-4 animate-spin text-cyan-500" />
              <span>Generando recomendaciones personalizadas con IA para "{task.title}"...</span>
            </div>
          ) : recommendation ? (
            <div className="space-y-4">
              
              {/* Saludo y Frase Motivadora */}
              <div className={`border rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isAnticipation
                  ? isDark ? 'bg-amber-950/30 border-amber-500/40 text-amber-100' : 'bg-amber-100/70 border-amber-300 text-amber-900'
                  : isDark ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-100' : 'bg-cyan-100/70 border-cyan-300 text-cyan-900'
              }`}>
                <div className="flex items-center space-x-2.5">
                  <span className="text-xl">{isAnticipation ? '🛒' : '✨'}</span>
                  <p className="text-xs sm:text-sm font-medium">
                    {recommendation.greeting}
                  </p>
                </div>
                {recommendation.motivationalQuote && (
                  <p className={`text-[11px] font-sans italic px-3 py-1 rounded-lg border ${
                    isDark ? 'text-slate-300 bg-black/40 border-slate-700/60' : 'text-slate-700 bg-white/80 border-slate-300'
                  }`}>
                    "{recommendation.motivationalQuote}"
                  </p>
                )}
              </div>

              {/* Grid: Tips & Subtasks Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Consejos Clave del Agente */}
                <div className={`space-y-2 p-3.5 rounded-xl border ${
                  isDark ? 'bg-[#0d162e] border-[#212f54]' : 'bg-white border-slate-200 shadow-xs'
                }`}>
                  <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 ${
                    isDark ? 'text-cyan-400' : 'text-cyan-700'
                  }`}>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Recomendaciones para esta Actividad</span>
                  </h4>
                  <ul className={`space-y-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {recommendation.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className={`font-bold text-xs mt-0.5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>•</span>
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Subtareas reales de la tarea y Checklist */}
                <div className={`space-y-2 p-3.5 rounded-xl border ${
                  isDark ? 'bg-[#0d162e] border-[#212f54]' : 'bg-white border-slate-200 shadow-xs'
                }`}>
                  <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center justify-between ${
                    isDark ? 'text-emerald-400' : 'text-emerald-700'
                  }`}>
                    <span className="flex items-center space-x-1.5">
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Subtareas & Checklist de la Meta</span>
                    </span>
                    {totalSubgoalsCount > 0 && (
                      <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {completedSubgoalsCount}/{totalSubgoalsCount} listos
                      </span>
                    )}
                  </h4>
                  
                  {/* If task has real subgoals defined */}
                  {Array.isArray(task.subgoals) && task.subgoals.length > 0 ? (
                    <div className="space-y-1.5">
                      {task.subgoals.map((sg) => (
                        <button
                          key={sg.id}
                          onClick={() => onToggleSubgoal && onToggleSubgoal(task.id, sg.id)}
                          className={`w-full text-left p-2 rounded-lg text-xs flex items-center space-x-2.5 transition-all border cursor-pointer ${
                            sg.completed
                              ? isDark ? 'bg-emerald-950/30 text-emerald-300 border-emerald-500/30 line-through opacity-80' : 'bg-emerald-50 text-emerald-700 border-emerald-200 line-through opacity-80'
                              : isDark ? 'bg-[#121c38] text-slate-200 border-amber-500/30 hover:border-amber-400' : 'bg-slate-50 text-slate-800 border-amber-300 hover:border-amber-400'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            sg.completed ? 'bg-emerald-500 border-emerald-400 text-white' : isDark ? 'border-amber-400/80 bg-amber-950/40' : 'border-amber-400 bg-amber-50'
                          }`}>
                            {sg.completed && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="flex-1 font-medium">{sg.title}</span>
                          <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {sg.completed ? 'Completado' : 'Pendiente'}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    /* AI suggested prep checklist items */
                    <div className="space-y-1.5">
                      {recommendation.prepChecklist && recommendation.prepChecklist.length > 0 ? (
                        recommendation.prepChecklist.map((item, idx) => {
                          const isChecked = !!checkedChecklist[item];
                          return (
                            <button
                              key={idx}
                              onClick={() => toggleChecklistItem(item)}
                              className={`w-full text-left p-2 rounded-lg text-xs flex items-center space-x-2.5 transition-all border cursor-pointer ${
                                isChecked
                                  ? isDark ? 'bg-emerald-950/30 text-emerald-300 border-emerald-500/30 line-through opacity-80' : 'bg-emerald-50 text-emerald-700 border-emerald-200 line-through opacity-80'
                                  : isDark ? 'bg-[#121c38] text-slate-200 border-[#2d3a58] hover:border-cyan-500/40' : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-cyan-400'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                isChecked ? 'bg-emerald-500 border-emerald-400 text-white' : isDark ? 'border-slate-500' : 'border-slate-400'
                              }`}>
                                {isChecked && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span className="flex-1">{item}</span>
                            </button>
                          );
                        })
                      ) : (
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Todo listo para iniciar este bloque.</p>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* Bottom Quick Bar */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  💡 {isAnticipation ? 'El Agente te avisa con antelación para comprar o preparar suministros' : 'Consejo generado con IA específicamente para tu meta en LifeBlocks'}
                </span>
                <button
                  onClick={() => onOpenAgentModal(task)}
                  className={`font-semibold flex items-center space-x-1 text-xs cursor-pointer transition-colors ${
                    isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-700 hover:text-cyan-800'
                  }`}
                >
                  <span>Hacer una pregunta sobre este bloque</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

            </div>
          ) : null}
        </div>
      )}

    </div>
  );
};
