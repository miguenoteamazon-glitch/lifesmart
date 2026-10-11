import React, { useState, useEffect } from 'react';
import { Task, Priority, TaskStatus, SubGoal, CategoryInfo } from '../types';
import { useTheme } from '../context/ThemeContext';
import { TaskLiveTimer } from './TaskLiveTimer';
import { 
  X, 
  Plus, 
  Trash2, 
  Clock, 
  Target, 
  Calendar, 
  Tag, 
  CheckCircle2, 
  Repeat, 
  CalendarDays,
  Calculator,
  Zap,
  Sliders,
  Briefcase,
  Sparkles
} from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  onDeleteTask?: (taskId: string) => void;
  categories: CategoryInfo[];
  initialTask?: Partial<Task> | null;
  defaultDate?: string;
}

const DAYS_CONFIG = [
  { id: 1, short: 'Lun', label: 'Lunes' },
  { id: 2, short: 'Mar', label: 'Martes' },
  { id: 3, short: 'Mié', label: 'Miércoles' },
  { id: 4, short: 'Jue', label: 'Jueves' },
  { id: 5, short: 'Vie', label: 'Viernes' },
  { id: 6, short: 'Sáb', label: 'Sábado' },
  { id: 0, short: 'Dom', label: 'Domingo' },
];

const DAILY_HOURS_OPTIONS = [
  { value: 0.5, label: '0.5 hrs (30 minutos)' },
  { value: 1, label: '1 hora al día' },
  { value: 1.5, label: '1.5 hrs (1h 30m)' },
  { value: 2, label: '2 horas al día' },
  { value: 2.5, label: '2.5 horas al día' },
  { value: 3, label: '3 horas al día' },
  { value: 3.5, label: '3.5 horas al día' },
  { value: 4, label: '4 horas al día' },
  { value: 5, label: '5 horas al día' },
  { value: 6, label: '6 horas al día' },
  { value: 8, label: '8 horas al día' },
];

const START_TIME_OPTIONS = Array.from({ length: 38 }, (_, i) => {
  const totalMinutes = 5 * 60 + i * 30; // Starts at 05:00 to 23:30
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}`;
});

const calculateTimeRange = (startStr: string, durationHours: number): string => {
  if (!startStr) return '09:00 - 10:00';
  const parts = startStr.split(':');
  let h = parseInt(parts[0], 10);
  let m = parseInt(parts[1] || '0', 10);
  if (isNaN(h)) h = 9;
  if (isNaN(m)) m = 0;

  const totalMinutes = Math.round((durationHours || 1) * 60);
  let endM = m + totalMinutes;
  let endH = h + Math.floor(endM / 60);
  endM = endM % 60;
  endH = endH % 24;

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)} - ${pad(endH)}:${pad(endM)}`;
};

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDeleteTask,
  categories,
  initialTask,
  defaultDate,
}) => {
  const { isDark } = useTheme();
  const [modalMode, setModalMode] = useState<'rapido' | 'completo'>('rapido');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0]?.id || 'desarrollo');
  const [priority, setPriority] = useState<Priority>('media');
  const [status, setStatus] = useState<TaskStatus>('pendiente');
  const [isJobTask, setIsJobTask] = useState<boolean>(false);
  
  // Goal Definition
  const [finalGoal, setFinalGoal] = useState('');
  const [targetMetricValue, setTargetMetricValue] = useState<number>(100);
  const [currentMetricValue, setCurrentMetricValue] = useState<number>(0);
  const [metricUnit, setMetricUnit] = useState('%');

  // Schedule & Hours Generation
  const [dailyHours, setDailyHours] = useState<number>(1);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [timeSlot, setTimeSlot] = useState('09:00 - 10:00');
  const [recurringDays, setRecurringDays] = useState<number[]>([1, 2, 3, 4, 5]); // Lun-Vie
  const [assignedDate, setAssignedDate] = useState(''); // Fecha inicio
  const [dueDate, setDueDate] = useState(''); // Fecha final estimada
  const [completedHours, setCompletedHours] = useState<number>(0);
  
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  
  const [subgoals, setSubgoals] = useState<SubGoal[]>([]);
  const [newSubgoalTitle, setNewSubgoalTitle] = useState('');

  const handleSelectStartTime = (newStart: string, hours: number = dailyHours) => {
    setStartTime(newStart);
    setTimeSlot(calculateTimeRange(newStart, hours));
  };

  const handleDailyHoursChange = (newHours: number) => {
    setDailyHours(newHours);
    setTimeSlot(calculateTimeRange(startTime, newHours));
  };

  // Calculate default end date (14 days from today)
  const get14DaysLater = (startStr?: string) => {
    try {
      const validStr = typeof startStr === 'string' && startStr.match(/^\d{4}-\d{2}-\d{2}$/) 
        ? startStr 
        : new Date().toISOString().split('T')[0];
      const base = new Date(validStr + 'T00:00:00');
      if (isNaN(base.getTime())) {
        const fallback = new Date();
        fallback.setDate(fallback.getDate() + 14);
        return fallback.toISOString().split('T')[0];
      }
      base.setDate(base.getDate() + 14);
      return base.toISOString().split('T')[0];
    } catch {
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 14);
      return fallback.toISOString().split('T')[0];
    }
  };

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const initialStart = (typeof defaultDate === 'string' && defaultDate.match(/^\d{4}-\d{2}-\d{2}$/)) 
      ? defaultDate 
      : today;

    if (initialTask) {
      setTitle(initialTask.title || '');
      setDescription(initialTask.description || '');
      setCategory(initialTask.category || categories[0]?.id || 'desarrollo');
      setPriority(initialTask.priority || 'media');
      setStatus(initialTask.status || 'pendiente');
      
      setFinalGoal(initialTask.finalGoal || '');
      setTargetMetricValue(typeof initialTask.targetMetricValue === 'number' ? initialTask.targetMetricValue : 100);
      setCurrentMetricValue(typeof initialTask.currentMetricValue === 'number' ? initialTask.currentMetricValue : 0);
      setMetricUnit(initialTask.metricUnit || '%');

      const initHours = initialTask.dailyHours || 1;
      const rawSlot = initialTask.timeSlot || '09:00 - 10:00';
      const extractedStart = rawSlot.split(' - ')[0]?.trim() || '09:00';

      setDailyHours(initHours);
      setStartTime(extractedStart);
      setTimeSlot(calculateTimeRange(extractedStart, initHours));

      setRecurringDays(
        initialTask.recurringDays && Array.isArray(initialTask.recurringDays) && initialTask.recurringDays.length > 0
          ? initialTask.recurringDays
          : [1, 2, 3, 4, 5]
      );
      
      const safeAssigned = (typeof initialTask.assignedDate === 'string' && initialTask.assignedDate.match(/^\d{4}-\d{2}-\d{2}$/))
        ? initialTask.assignedDate
        : initialStart;
      setAssignedDate(safeAssigned);
      
      const safeDue = (typeof initialTask.dueDate === 'string' && initialTask.dueDate.match(/^\d{4}-\d{2}-\d{2}$/))
        ? initialTask.dueDate
        : (modalMode === 'rapido' ? safeAssigned : get14DaysLater(safeAssigned));
      setDueDate(safeDue);
      
      setCompletedHours(initialTask.completedHours || 0);

      const loadedTags = Array.isArray(initialTask.tags) ? initialTask.tags : [];
      setTags(loadedTags);
      setSubgoals(Array.isArray(initialTask.subgoals) ? initialTask.subgoals : []);
      
      const isJob = Boolean(
        initialTask.isJobTask || 
        loadedTags.includes('laboral') || 
        initialTask.category === 'job_things' || 
        initialTask.category === 'trabajo'
      );
      setIsJobTask(isJob);

      // If initialTask has complex properties set (like different finalGoal or multiple recurringDays), open in 'completo'
      if (initialTask.finalGoal && initialTask.finalGoal !== initialTask.title) {
        setModalMode('completo');
      } else {
        setModalMode('rapido');
      }
    } else {
      // Defaults for new task -> default to 'rapido'!
      setModalMode('rapido');
      setTitle('');
      setDescription('');
      setCategory(categories[0]?.id || 'desarrollo');
      setPriority('media');
      setStatus('pendiente');
      setIsJobTask(false);
      
      setFinalGoal('');
      setTargetMetricValue(100);
      setCurrentMetricValue(0);
      setMetricUnit('%');

      setDailyHours(1);
      setStartTime('09:00');
      setTimeSlot(calculateTimeRange('09:00', 1));
      setRecurringDays([1, 2, 3, 4, 5]);
      setAssignedDate(initialStart);
      setDueDate(initialStart);
      setCompletedHours(0);

      setTags([]);
      setSubgoals([]);
    }
  }, [initialTask, isOpen, defaultDate, categories]);

  if (!isOpen) return null;

  // Occurrence Calculation Logic
  const calculateOccurrences = (startStr: string, endStr: string, selectedDays: number[]): number => {
    try {
      if (!startStr || !endStr || !Array.isArray(selectedDays) || selectedDays.length === 0) return 1;
      const start = new Date(String(startStr) + 'T00:00:00');
      const end = new Date(String(endStr) + 'T00:00:00');
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 1;

      let count = 0;
      let cur = new Date(start);
      let iterations = 0;
      while (cur <= end && iterations < 400) {
        iterations++;
        const dayOfWeek = cur.getDay(); // 0=Dom, 1=Lun...
        if (selectedDays.includes(dayOfWeek)) {
          count++;
        }
        cur.setDate(cur.getDate() + 1);
      }
      return count > 0 ? count : 1;
    } catch {
      return 1;
    }
  };

  const occurrences = calculateOccurrences(assignedDate, dueDate, recurringDays);
  const calculatedTotalHours = Math.round((dailyHours * occurrences) * 10) / 10;

  const toggleDayOfWeek = (dayId: number) => {
    if (recurringDays.includes(dayId)) {
      if (recurringDays.length > 1) {
        setRecurringDays(recurringDays.filter((d) => d !== dayId));
      }
    } else {
      setRecurringDays([...recurringDays, dayId]);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddSubgoal = () => {
    if (newSubgoalTitle.trim()) {
      setSubgoals([
        ...subgoals,
        { id: `sg-${Date.now()}`, title: newSubgoalTitle.trim(), completed: false },
      ]);
      setNewSubgoalTitle('');
    }
  };

  const handleRemoveSubgoal = (id: string) => {
    setSubgoals(subgoals.filter((sg) => sg.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalAssignedDate = assignedDate || new Date().toISOString().split('T')[0];
    const finalDueDate = modalMode === 'rapido' ? finalAssignedDate : (dueDate || finalAssignedDate);
    const finalTimeSlot = timeSlot || calculateTimeRange(startTime, dailyHours || 1);
    
    // Total hours: in quick mode, it's 1 hour (or dailyHours) for the selected day
    const hoursToSave = modalMode === 'rapido' 
      ? (Number(dailyHours) || 1) 
      : calculatedTotalHours;

    // Recurring days: in quick mode, calculate day of the selected assignedDate
    let daysToSave = recurringDays;
    if (modalMode === 'rapido') {
      try {
        const d = new Date(finalAssignedDate + 'T00:00:00');
        const dayOfWeek = isNaN(d.getTime()) ? 1 : d.getDay();
        daysToSave = [dayOfWeek];
      } catch {
        daysToSave = [1];
      }
    }

    const tagsToSave = [...tags];
    if (isJobTask && !tagsToSave.includes('laboral')) {
      tagsToSave.push('laboral');
    } else if (!isJobTask && tagsToSave.includes('laboral')) {
      const idx = tagsToSave.indexOf('laboral');
      if (idx !== -1) tagsToSave.splice(idx, 1);
    }

    onSave({
      id: initialTask?.id,
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      status,
      dailyHours: Number(dailyHours) || 1,
      recurringDays: daysToSave,
      estimatedHours: hoursToSave,
      completedHours: Number(completedHours) || 0,
      finalGoal: finalGoal.trim() || title.trim(),
      targetMetricValue: Number(targetMetricValue) || 100,
      currentMetricValue: Number(currentMetricValue) || 0,
      metricUnit: metricUnit.trim() || '%',
      dueDate: finalDueDate,
      assignedDate: finalAssignedDate,
      timeSlot: finalTimeSlot,
      tags: tagsToSave,
      subgoals,
      isJobTask,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#131b2e] border border-[#2d3449] w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#171f33] border-b border-[#2d3449]">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-colors ${
              modalMode === 'rapido' 
                ? 'bg-amber-400/10 border-amber-400/40 text-amber-300' 
                : 'bg-[#00f2ff]/10 border-[#00f2ff]/30 text-[#00f2ff]'
            }`}>
              {modalMode === 'rapido' ? <Zap className="w-5 h-5 text-amber-400" /> : <Target className="w-5 h-5 text-[#00f2ff]" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                <span>{initialTask?.id ? 'Editar Tarea' : 'Nueva Tarea'}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  modalMode === 'rapido'
                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
                }`}>
                  {modalMode === 'rapido' ? '⚡ Modo Rápido' : '⚙️ Modo Completo'}
                </span>
              </h2>
              {initialTask && initialTask.id && (
                <div className="pt-1">
                  <TaskLiveTimer task={initialTask} />
                </div>
              )}
              <p className="text-xs text-slate-400">
                {modalMode === 'rapido' 
                  ? 'Ingresa qué hacer y cuándo en 1 solo paso.' 
                  : 'Configura meta final, horas diarias y programación avanzada.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector: Modo Rápido vs Modo Completo */}
        <div className="px-5 sm:px-6 pt-3 pb-2.5 bg-[#10182b] border-b border-[#22304d]">
          <div className="grid grid-cols-2 p-1 bg-[#090f1d] border border-[#2d3e63] rounded-2xl gap-1.5 shadow-inner">
            <button
              type="button"
              onClick={() => setModalMode('rapido')}
              className={`py-2 px-3 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                modalMode === 'rapido'
                  ? 'bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] text-[#00363a] shadow-lg shadow-[#00f2ff]/20 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Zap className="w-4 h-4 shrink-0" />
              <span>⚡ Modo Rápido</span>
            </button>
            <button
              type="button"
              onClick={() => setModalMode('completo')}
              className={`py-2 px-3 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                modalMode === 'completo'
                  ? 'bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] text-[#00363a] shadow-lg shadow-[#00f2ff]/20 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0" />
              <span>⚙️ Modo Completo</span>
            </button>
          </div>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {modalMode === 'rapido' ? (
            /* ======================================================== */
            /* MODO RÁPIDO: QUÉ HACER + CUÁNDO (FECHA Y HORA)          */
            /* ======================================================== */
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* 1. Descripción de la tarea */}
              <div className="space-y-2">
                <label className="text-xs font-mono tracking-wider uppercase text-cyan-400 font-bold flex items-center justify-between">
                  <span>¿Qué hay que hacer? (Descripción de la tarea) *</span>
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40">
                    Directo & Rápido
                  </span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Cancelar la póliza 3234245 / Enviar reporte semanal al cliente"
                  className="w-full px-4 py-3 bg-[#0b1326] border-2 border-cyan-500/50 focus:border-[#00f2ff] rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00f2ff]/30 text-base font-medium shadow-inner"
                />
              </div>

              {/* Detalles o notas adicionales opcionales */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wider uppercase text-slate-300 font-semibold">
                  Detalles o notas (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles adicionales, teléfono, número de trámite o persona de contacto..."
                  className="w-full px-4 py-2 bg-[#0b1326] border border-[#2d3449] focus:border-[#00f2ff] rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none text-xs"
                />
              </div>

              {/* 2. ¿Cuándo? Selector de Fecha y Hora */}
              <div className="p-4 bg-gradient-to-br from-[#0e172a] to-[#091122] border border-cyan-500/35 rounded-2xl space-y-4 shadow-md">
                <div className="flex items-center justify-between border-b border-[#22304d] pb-2.5">
                  <div className="flex items-center space-x-2 text-cyan-300">
                    <CalendarDays className="w-4 h-4 text-[#00f2ff]" />
                    <span className="text-xs font-mono uppercase tracking-wider font-bold">
                      ¿Cuándo? (Fecha y Hora) *
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#17233d] border border-cyan-500/30 rounded-lg text-cyan-300 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-[#00f2ff]" />
                    <span>{timeSlot}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Selector de Fecha */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-slate-300 font-semibold block">
                      Fecha programada *
                    </label>
                    <input
                      type="date"
                      required
                      value={assignedDate}
                      onChange={(e) => {
                        setAssignedDate(e.target.value);
                        setDueDate(e.target.value);
                      }}
                      className="w-full px-3.5 py-2.5 bg-[#17233d] border border-[#2d3e63] focus:border-[#00f2ff] rounded-xl text-slate-100 text-sm font-mono font-medium focus:outline-none cursor-pointer"
                    />
                    {/* Botones rápidos de fecha */}
                    <div className="flex items-center space-x-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date().toISOString().split('T')[0];
                          setAssignedDate(today);
                          setDueDate(today);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer border ${
                          assignedDate === new Date().toISOString().split('T')[0]
                            ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        Hoy
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          const str = tomorrow.toISOString().split('T')[0];
                          setAssignedDate(str);
                          setDueDate(str);
                        }}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700 hover:text-white transition-colors cursor-pointer"
                      >
                        Mañana
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          const day = d.getDay();
                          const diff = (day === 0 ? 1 : 8 - day);
                          d.setDate(d.getDate() + diff);
                          const str = d.toISOString().split('T')[0];
                          setAssignedDate(str);
                          setDueDate(str);
                        }}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700 hover:text-white transition-colors cursor-pointer"
                      >
                        Próx. Lunes
                      </button>
                    </div>
                  </div>

                  {/* Selector de Hora */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-slate-300 font-semibold block">
                      Hora de inicio *
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => handleSelectStartTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#17233d] border border-[#2d3e63] focus:border-[#00f2ff] rounded-xl text-slate-100 text-sm font-mono font-medium focus:outline-none cursor-pointer"
                    />
                    {/* Botones de horas frecuentes */}
                    <div className="flex items-center flex-wrap gap-1 pt-0.5">
                      {['09:00', '11:00', '14:00', '16:00', '18:00', '20:00'].map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => handleSelectStartTime(h)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors cursor-pointer border ${
                            startTime === h
                              ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400 font-bold'
                              : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Clasificación Rápida: Laboral [J], Prioridad & Categoría */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-[#0b1326] border border-[#22304d] rounded-2xl">
                {/* Botón Laboral [J] */}
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-[11px] font-mono text-slate-400 block font-semibold">Tipo de Tarea</label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isJobTask;
                      setIsJobTask(next);
                      if (next) {
                        if (!tags.includes('laboral')) setTags([...tags, 'laboral']);
                        const jobCat = categories.find(c => c.id === 'job_things' || c.id === 'trabajo');
                        if (jobCat) setCategory(jobCat.id);
                      } else {
                        setTags(tags.filter(t => t !== 'laboral'));
                      }
                    }}
                    className={`w-full py-2 px-2.5 rounded-xl border text-xs font-mono font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      isJobTask
                        ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : 'bg-[#17233d] text-slate-300 border-[#2d3e63] hover:text-white'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center font-black text-xs ${
                      isJobTask ? 'bg-cyan-400 text-slate-950 font-black' : 'bg-slate-700 text-slate-300'
                    }`}>
                      J
                    </span>
                    <span>{isJobTask ? 'Es Laboral (Trabajo)' : 'Marcar Laboral [J]'}</span>
                  </button>
                </div>

                {/* Prioridad */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-400 block font-semibold">Prioridad</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 bg-[#17233d] border border-[#2d3e63] rounded-xl text-slate-200 text-xs font-mono focus:outline-none cursor-pointer"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media (Normal)</option>
                    <option value="alta">Alta 🔥</option>
                    <option value="urgente">Urgente ⚡</option>
                  </select>
                </div>

                {/* Categoría */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-400 block font-semibold">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#17233d] border border-[#2d3e63] rounded-xl text-slate-200 text-xs font-mono focus:outline-none cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* MODO COMPLETO (METAS, HORAS & CALENDARIO AVANZADO)      */
            /* ======================================================== */
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Main Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-mono tracking-wider uppercase text-cyan-400 font-bold">
                    Título de la Meta / Actividad *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Entrenamiento de Running 10K / Curso de Programación"
                    className="w-full px-4 py-2.5 bg-[#0b1326] border border-[#2d3449] focus:border-[#00f2ff] rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#00f2ff] text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono tracking-wider uppercase text-slate-300 font-bold">
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0b1326] border border-[#2d3449] focus:border-[#00f2ff] rounded-xl text-slate-100 focus:outline-none text-sm"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

          <div className="space-y-2">
            <label className="text-xs font-mono tracking-wider uppercase text-slate-300 font-bold">
              Descripción Corta / Detalles
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Escribe los detalles clave, lugar o materiales necesarios..."
              className="w-full px-4 py-2.5 bg-[#0b1326] border border-[#2d3449] focus:border-[#00f2ff] rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none text-sm"
            />
          </div>

          {/* Section: Definición de la Meta Final */}
          <div className="p-4 bg-[#171f33] border border-[#00f2ff]/30 rounded-2xl space-y-4">
            <div className="flex items-center space-x-2 text-[#00f2ff]">
              <Target className="w-4 h-4" />
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold">
                Definición de Meta Final y Métrica de Éxito
              </h3>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-medium">
                Meta Final Objetivo (¿Qué define que esta meta fue un éxito personal?)
              </label>
              <input
                type="text"
                value={finalGoal}
                onChange={(e) => setFinalGoal(e.target.value)}
                placeholder="Ej: Correr 10 kilómetros seguidos sin detenerse en menos de 55 minutos"
                className="w-full px-4 py-2 bg-[#0b1326] border border-[#2d3449] focus:border-[#00f2ff] rounded-xl text-slate-100 placeholder-slate-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400">Meta Objetivo (Valor)</label>
                <input
                  type="number"
                  min="1"
                  value={targetMetricValue}
                  onChange={(e) => setTargetMetricValue(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#0b1326] border border-[#2d3449] rounded-xl text-slate-100 text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Avance Actual</label>
                <input
                  type="number"
                  min="0"
                  value={currentMetricValue}
                  onChange={(e) => setCurrentMetricValue(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#0b1326] border border-[#2d3449] rounded-xl text-slate-100 text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Unidad de Medida</label>
                <input
                  type="text"
                  value={metricUnit}
                  onChange={(e) => setMetricUnit(e.target.value)}
                  placeholder="%, km, módulos"
                  className="w-full px-3 py-2 bg-[#0b1326] border border-[#2d3449] rounded-xl text-slate-100 text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* SIMPLIFIED SECTION: HORARIO Y ASIGNACIÓN AL CALENDARIO DE VIDA */}
          <div className="p-5 bg-[#0b1326] border border-[#00f2ff]/30 rounded-3xl space-y-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#2d3449] pb-3">
              <div className="flex items-center space-x-2 text-[#00f2ff]">
                <CalendarDays className="w-5 h-5 text-[#00f2ff]" />
                <h3 className="text-xs font-mono uppercase tracking-wider font-bold">
                  Programación de Horario y Calendario
                </h3>
              </div>

              <div className="px-3 py-1 bg-[#171f33] border border-[#00f2ff]/30 rounded-xl flex items-center space-x-1.5 text-xs font-mono">
                <Clock className="w-3.5 h-3.5 text-[#00f2ff]" />
                <span className="text-slate-400 text-[11px]">Horario:</span>
                <span className="font-bold text-[#00f2ff]">{timeSlot}</span>
              </div>
            </div>

            {/* 1. Cuántas horas al día & Hora de Inicio en Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-200 block">
                  ¿Cuántas horas al día? *
                </label>
                <select
                  value={dailyHours}
                  onChange={(e) => handleDailyHoursChange(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-[#171f33] border border-[#2d3449] focus:border-[#00f2ff] rounded-xl text-slate-100 text-sm font-mono font-medium focus:outline-none cursor-pointer"
                >
                  {DAILY_HOURS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                  {/* Option for custom if not in standard list */}
                  {!DAILY_HOURS_OPTIONS.some((o) => o.value === dailyHours) && (
                    <option value={dailyHours}>{dailyHours} horas al día</option>
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-200 block">
                  Hora de inicio *
                </label>
                <select
                  value={startTime}
                  onChange={(e) => handleSelectStartTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#171f33] border border-[#2d3449] focus:border-[#00f2ff] rounded-xl text-slate-100 text-sm font-mono font-medium focus:outline-none cursor-pointer"
                >
                  {START_TIME_OPTIONS.map((timeOpt) => (
                    <option key={timeOpt} value={timeOpt}>
                      {timeOpt} hs
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Días de la semana */}
            <div className="space-y-2 pt-1 border-t border-[#2d3449]/60">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-slate-200">
                  Días de la semana
                </label>

                {/* Quick Presets */}
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setRecurringDays([1, 2, 3, 4, 5])}
                    className="text-[10px] font-mono text-cyan-300 hover:underline px-1.5 py-0.5 cursor-pointer"
                  >
                    Lun-Vie
                  </button>
                  <span className="text-slate-600 text-xs">|</span>
                  <button
                    type="button"
                    onClick={() => setRecurringDays([1, 3, 5])}
                    className="text-[10px] font-mono text-cyan-300 hover:underline px-1.5 py-0.5 cursor-pointer"
                  >
                    Lun-Mié-Vie
                  </button>
                  <span className="text-slate-600 text-xs">|</span>
                  <button
                    type="button"
                    onClick={() => setRecurringDays([0, 1, 2, 3, 4, 5, 6])}
                    className="text-[10px] font-mono text-cyan-300 hover:underline px-1.5 py-0.5 cursor-pointer"
                  >
                    Todos
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {DAYS_CONFIG.map((d) => {
                  const isSelected = recurringDays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDayOfWeek(d.id)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-[#00f2ff] text-[#00363a] shadow-md shadow-[#00f2ff]/20 font-black scale-105'
                          : 'bg-[#171f33] text-slate-400 hover:text-slate-200 border border-[#2d3449]'
                      }`}
                    >
                      <span>{d.short}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Fechas de Inicio y Término */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[#2d3449]/60">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Fecha de Inicio</label>
                <input
                  type="date"
                  required
                  value={assignedDate}
                  onChange={(e) => setAssignedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#171f33] border border-[#2d3449] rounded-xl text-slate-100 text-xs font-mono focus:outline-none focus:border-[#00f2ff]"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-cyan-400 font-bold block mb-1">Fecha Final Estimada *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#171f33] border border-[#2d3449] rounded-xl text-slate-100 text-xs font-mono focus:outline-none focus:border-[#00f2ff]"
                />
              </div>
            </div>

            {/* Total Hours Badge */}
            <div className="p-3 bg-[#171f33] border border-[#00f2ff]/40 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-slate-300">
                <Calculator className="w-4 h-4 text-[#00f2ff] shrink-0" />
                <span>
                  <strong className="text-white">{occurrences} sesiones</strong> de <strong className="text-[#00f2ff]">{dailyHours}h/día</strong>
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono uppercase text-slate-400 mr-2">Total Estimado:</span>
                <span className="text-base font-black font-mono text-[#00f2ff]">{calculatedTotalHours} hrs</span>
              </div>
            </div>

          </div>

          {/* Section: Priority, Status & Completed Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-mono uppercase text-slate-300 font-bold mb-1 block">
                Prioridad
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 bg-[#0b1326] border border-[#2d3449] rounded-xl text-slate-100 text-sm"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono uppercase text-slate-300 font-bold mb-1 block">
                Estado
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 bg-[#0b1326] border border-[#2d3449] rounded-xl text-slate-100 text-sm"
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_progreso">En Progreso</option>
                <option value="completada">Completada</option>
                <option value="bloqueada">Bloqueada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono uppercase text-emerald-400 font-bold mb-1 block">
                Horas Invertidas (Ejecutadas)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={completedHours}
                onChange={(e) => setCompletedHours(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0b1326] border border-[#2d3449] rounded-xl text-slate-100 text-sm font-mono"
              />
            </div>
          </div>

          {/* Subgoals Checklist */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-mono uppercase text-slate-300 font-bold block">
              Sub-objetivos / Checklist
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newSubgoalTitle}
                onChange={(e) => setNewSubgoalTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubgoal())}
                placeholder="Agregar hito o sub-tarea..."
                className="flex-1 px-3 py-2 bg-[#0b1326] border border-[#2d3449] rounded-xl text-slate-100 text-sm"
              />
              <button
                type="button"
                onClick={handleAddSubgoal}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Añadir</span>
              </button>
            </div>

            {subgoals.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {subgoals.map((sg) => (
                  <div
                    key={sg.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-all ${
                      sg.completed
                        ? 'bg-orange-950/20 border border-orange-500/50 shadow-[0_0_8px_rgba(249,115,22,0.25)]'
                        : 'bg-[#0b1326]/60 border border-[#2d3449]'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {sg.completed && (
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_6px_rgba(249,115,22,0.8)]" />
                      )}
                      <span className={sg.completed ? 'line-through decoration-orange-400/90 decoration-2 text-slate-100 font-medium' : 'text-slate-200'}>
                        {sg.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubgoal(sg.id)}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase text-slate-300 font-bold block">
              Etiquetas
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#171f33] border border-[#2d3449] rounded-full text-xs text-cyan-300"
                >
                  <Tag className="w-3 h-3" />
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-slate-400 hover:text-white ml-1 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Añadir etiqueta (Presiona Enter)..."
                className="flex-1 px-3 py-1.5 bg-[#0b1326] border border-[#2d3449] rounded-xl text-slate-100 text-xs"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-xl hover:bg-slate-700 cursor-pointer"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

          {/* Modal Footer Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#2d3449]">
            <div>
              {initialTask && initialTask.id && onDeleteTask ? (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente esta tarea "${initialTask.title || 'esta tarea'}"?`)) {
                      onDeleteTask(initialTask.id!);
                      onClose();
                    }
                  }}
                  className="px-4 py-2 text-xs font-bold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/60 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Tarea</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setModalMode(modalMode === 'rapido' ? 'completo' : 'rapido')}
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 hover:underline flex items-center space-x-1.5 cursor-pointer py-1"
                >
                  {modalMode === 'rapido' ? (
                    <>
                      <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                      <span>¿Metas métricas o checklist? Cambiar a Modo Completo</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Volver al Modo Rápido (1 Paso)</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] hover:brightness-110 text-[#00363a] font-black text-sm rounded-xl shadow-lg shadow-[#00f2ff]/20 transition-all flex items-center space-x-2 cursor-pointer"
              >
                {modalMode === 'rapido' ? (
                  <>
                    <Zap className="w-4 h-4 text-[#00363a]" />
                    <span>Guardar Tarea Rápida</span>
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 text-[#00363a]" />
                    <span>{initialTask ? 'Guardar Cambios' : 'Crear Tarea y Programar'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
