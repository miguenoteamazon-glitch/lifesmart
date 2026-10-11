import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Task, 
  Habit, 
  CategoryInfo, 
  IdeaItem, 
  TaskStatus, 
  Priority, 
  HealthProfile, 
  WeightLogEntry, 
  DailyCalorieLog 
} from '../types';
import { calculateBMI, getBMICategory, calculateBMR, calculateTDEE, calculateStepCalories } from '../utils/healthCalculators';
import { 
  playTechBlip, 
  playTaskCompleteSound, 
  playPomodoroBell, 
  toggleAmbientNoise,
  startAmbientSound,
  stopAmbientSound,
  setAmbientVolume,
  AMBIENT_SOUND_OPTIONS,
  AmbientSoundType
} from '../utils/deskbuddyAudio';
import { TaskLiveTimer } from './TaskLiveTimer';
import { CalendarDailyClosureCard } from './CalendarDailyClosureCard';
import { 
  Calendar,
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  Volume1,
  VolumeX, 
  Mic, 
  MicOff, 
  Bot, 
  Sparkles, 
  Flame, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  X, 
  AlertCircle, 
  Smile, 
  Zap, 
  Compass, 
  Radio, 
  Waves, 
  TreePine,
  Award,
  Layers,
  ArrowUpRight,
  Headphones,
  Check,
  Activity,
  Scale,
  Heart,
  Utensils,
  Droplets,
  Dumbbell,
  TrendingDown,
  TrendingUp,
  Minus,
  Target,
  Edit3,
  Trash2,
  Copy,
  FileText,
  Bell,
  Sunrise,
  ArrowLeft,
  Home
} from 'lucide-react';
import { DailyBriefingModal } from './DailyBriefingModal';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ReferenceLine 
} from 'recharts';

interface DeskBuddyViewProps {
  tasks: Task[];
  habits: Habit[];
  ideas?: IdeaItem[];
  categories: CategoryInfo[];
  healthProfile?: HealthProfile;
  weightLogs?: WeightLogEntry[];
  calorieLogs?: DailyCalorieLog[];
  onAddWeightLog?: (entry: Omit<WeightLogEntry, 'id' | 'createdAt'>) => void;
  onDeleteWeightLog?: (id: string) => void;
  onSaveDailyCalorieLog?: (log: DailyCalorieLog) => void;
  onUpdateHealthProfile?: (updated: HealthProfile) => void;
  onNavigateToHealth?: () => void;
  onToggleTask: (taskId: string, newStatus: TaskStatus) => void;
  onToggleHabitDay?: (habitId: string, date: string) => void;
  onOpenNewTaskModal?: () => void;
  onOpenNewHabitModal?: () => void;
  onQuickAddTask?: (taskData: Partial<Task>) => void;
  onQuickAddHabit?: (habitData: Partial<Habit>) => void;
  onEditTask?: (task: Task) => void;
  onEditHabit?: (habit: Habit) => void;
  onUpdateTask?: (task: Task) => void;
  onRolloverTask?: (task: Task) => void;
  onConsultAgent?: (task?: Task) => void;
  onOpenNotifications?: () => void;
  onExit: () => void;
}

type MoodType = 'focused' | 'energized' | 'calm' | 'flow';

const MONTH_NAMES_ES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

const DAY_NAMES_SHORT = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

export const DeskBuddyView: React.FC<DeskBuddyViewProps> = ({
  tasks,
  habits,
  ideas = [],
  categories,
  healthProfile,
  weightLogs = [],
  calorieLogs = [],
  onAddWeightLog,
  onDeleteWeightLog,
  onSaveDailyCalorieLog,
  onUpdateHealthProfile,
  onNavigateToHealth,
  onToggleTask,
  onToggleHabitDay,
  onOpenNewTaskModal,
  onOpenNewHabitModal,
  onQuickAddTask,
  onQuickAddHabit,
  onEditTask,
  onEditHabit,
  onUpdateTask,
  onRolloverTask,
  onConsultAgent,
  onOpenNotifications,
  onExit
}) => {
  // Toast feedback for task rollovers & updates
  const [toastNotification, setToastNotification] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  // Live Real-Time Clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calendar State & View Modes
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'week' | 'day' | 'cierre'>('month');
  const [agendaStatusFilter, setAgendaStatusFilter] = useState<'todas' | 'pendientes' | 'completadas'>('todas');

  // Nexus-07 & Bio-Salud Drawer State (50/50 dual-panel layout on desktop)
  const [isNexusDrawerOpen, setIsNexusDrawerOpen] = useState(false);

  // Daily Morning Briefing Modal State
  const [isDailyBriefingOpen, setIsDailyBriefingOpen] = useState(false);

  // Pomodoro State
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break'>('work');

  // Ambient Sound State
  const [ambientAudioOn, setAmbientAudioOn] = useState(false);
  const [ambientSoundType, setAmbientSoundType] = useState<AmbientSoundType>(() => {
    try {
      const saved = localStorage.getItem('deskbuddy_ambient_sound_type');
      if (saved && ['ocean', 'forest', 'rain', 'river', 'campfire', 'space'].includes(saved)) {
        return saved as AmbientSoundType;
      }
    } catch {}
    return 'forest';
  });
  const [ambientVolume, setAmbientVolumeState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('deskbuddy_ambient_volume');
      return saved ? parseFloat(saved) : 0.06;
    } catch {
      return 0.06;
    }
  });
  const [isAmbientMenuOpen, setIsAmbientMenuOpen] = useState(false);
  const ambientMenuRef = useRef<HTMLDivElement>(null);
  const [soundEffectsOn, setSoundEffectsOn] = useState(true);

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Mood State
  const [mood, setMood] = useState<MoodType>('focused');

  // Task Filter State
  const [taskFilter, setTaskFilter] = useState<'pendientes' | 'todas' | 'completadas' | 'habitos' | 'salud'>('pendientes');
  const [isQuickActivityOpen, setIsQuickActivityOpen] = useState(false);
  const [quickActivityCalories, setQuickActivityCalories] = useState('');
  const [quickActivitySteps, setQuickActivitySteps] = useState('');
  const [agendaLaboralOnly, setAgendaLaboralOnly] = useState(false);
  const [laboralOverrides, setLaboralOverrides] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('deskbuddy_laboral_tasks');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const isItemLaboral = (item: Task): boolean => {
    if (laboralOverrides[item.id] !== undefined) {
      return laboralOverrides[item.id];
    }
    return Boolean(
      item.isJobTask ||
      item.category === 'trabajo' ||
      item.tags?.some(t => {
        const lower = t.toLowerCase();
        return lower === 'laboral' || lower === 'trabajo' || lower === 'j';
      })
    );
  };

  const handleToggleLaboral = (item: Task, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentlyLaboral = isItemLaboral(item);
    const nextVal = !currentlyLaboral;

    if (soundEffectsOn) playTechBlip(nextVal ? 780 : 420, 'sine', 0.05);

    const newOverrides = { ...laboralOverrides, [item.id]: nextVal };
    setLaboralOverrides(newOverrides);
    try {
      localStorage.setItem('deskbuddy_laboral_tasks', JSON.stringify(newOverrides));
    } catch (err) {
      console.error(err);
    }

    if (onQuickAddTask) {
      const tags = new Set(item.tags || []);
      if (nextVal) {
        tags.add('laboral');
      } else {
        tags.delete('laboral');
      }
      onQuickAddTask({
        ...item,
        isJobTask: nextVal,
        tags: Array.from(tags)
      });
    }
  };

  // Inline Quick Add Task / Habit state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'task' | 'habit'>('task');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<Priority>('alta');
  const [quickTimeSlot, setQuickTimeSlot] = useState('16:00 - 17:00');
  const [quickCategory, setQuickCategory] = useState<string>('actividades_pendientes');
  const [quickHabitFrequency, setQuickHabitFrequency] = useState<'daily' | 'weekdays' | 'weekends'>('daily');

  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // Modals inside DeskBuddy
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isBacklogModalOpen, setIsBacklogModalOpen] = useState(false);
  const [adviceIndex, setAdviceIndex] = useState(0);

  // Right Panel Tab state: 'assistant' | 'health'
  const [rightPanelTab, setRightPanelTab] = useState<'assistant' | 'health'>('assistant');

  // Today Date Strings
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Quick Weight Drawer & Daily Entry state
  const [isQuickWeightOpen, setIsQuickWeightOpen] = useState(false);
  const [quickWeightValue, setQuickWeightValue] = useState('');
  const [quickWeightNotes, setQuickWeightNotes] = useState('');
  const [dailyWeightInputDate, setDailyWeightInputDate] = useState<string>(todayStr);

  // Quick Calorie Drawer state
  const [isQuickCalorieOpen, setIsQuickCalorieOpen] = useState(false);
  const [quickCalorieAmount, setQuickCalorieAmount] = useState('');
  const [quickCalorieMeal, setQuickCalorieMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snacks'>('lunch');
  const [quickCalorieItemName, setQuickCalorieItemName] = useState('');

  // Meal Direct Calorie Editor state (clicking Desayuno, Almuerzo, Cena, Snacks)
  const [editingMealKey, setEditingMealKey] = useState<'breakfast' | 'lunch' | 'dinner' | 'snacks' | null>(null);
  const [editingMealCalories, setEditingMealCalories] = useState<string>('');
  const [editingMealDescription, setEditingMealDescription] = useState<string>('');

  // Quick Copy Feedback state
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);

  // Daily Focus State & Persistence (LocalStorage)
  interface DailyFocusGoal {
    id: string;
    text: string;
    completed: boolean;
    createdAt: string;
  }

  interface DailyFocusData {
    date: string;
    mainFocus: string;
    mainFocusCompleted: boolean;
    subGoals: DailyFocusGoal[];
    updatedAt: string;
  }

  const [dailyFocus, setDailyFocus] = useState<DailyFocusData>(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const savedToday = localStorage.getItem(`deskbuddy_daily_focus_${today}`);
      if (savedToday) {
        return JSON.parse(savedToday);
      }
      const savedGeneral = localStorage.getItem('deskbuddy_daily_focus');
      if (savedGeneral) {
        const parsed = JSON.parse(savedGeneral);
        if (parsed && (parsed.date === today || !parsed.date)) {
          return { ...parsed, date: today };
        }
      }
    } catch (err) {
      console.warn('Error reading deskbuddy_daily_focus from localStorage', err);
    }
    return {
      date: new Date().toISOString().split('T')[0],
      mainFocus: '',
      mainFocusCompleted: false,
      subGoals: [],
      updatedAt: new Date().toISOString()
    };
  });

  const [isEditingMainFocus, setIsEditingMainFocus] = useState(false);
  const [inputMainFocus, setInputMainFocus] = useState('');
  const [isAddingSubGoal, setIsAddingSubGoal] = useState(false);
  const [inputSubGoal, setInputSubGoal] = useState('');

  // Persist Daily Focus to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(`deskbuddy_daily_focus_${todayStr}`, JSON.stringify(dailyFocus));
      localStorage.setItem('deskbuddy_daily_focus', JSON.stringify(dailyFocus));
    } catch (err) {
      console.warn('Error saving deskbuddy_daily_focus to localStorage', err);
    }
  }, [dailyFocus, todayStr]);

  const handleStartEditingMainFocus = () => {
    setInputMainFocus(dailyFocus.mainFocus);
    setIsEditingMainFocus(true);
    if (soundEffectsOn) playTechBlip(560, 'sine', 0.04);
  };

  const handleSaveMainFocus = (overrideText?: string) => {
    const textToSave = (overrideText !== undefined ? overrideText : inputMainFocus).trim();
    setDailyFocus(prev => ({
      ...prev,
      mainFocus: textToSave,
      updatedAt: new Date().toISOString()
    }));
    setIsEditingMainFocus(false);
    if (soundEffectsOn) playTechBlip(750, 'triangle', 0.08);
  };

  const handleToggleMainFocus = () => {
    const nextState = !dailyFocus.mainFocusCompleted;
    setDailyFocus(prev => ({
      ...prev,
      mainFocusCompleted: nextState,
      updatedAt: new Date().toISOString()
    }));
    if (nextState) {
      if (soundEffectsOn) playTaskCompleteSound();
    } else {
      if (soundEffectsOn) playTechBlip(500, 'sine', 0.05);
    }
  };

  const handleClearMainFocus = () => {
    setDailyFocus(prev => ({
      ...prev,
      mainFocus: '',
      mainFocusCompleted: false,
      updatedAt: new Date().toISOString()
    }));
    setIsEditingMainFocus(false);
    if (soundEffectsOn) playTechBlip(400, 'sine', 0.05);
  };

  const handleAddSubGoal = () => {
    if (!inputSubGoal.trim()) return;
    const newGoal: DailyFocusGoal = {
      id: `focus-sub-${Date.now()}`,
      text: inputSubGoal.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };
    setDailyFocus(prev => ({
      ...prev,
      subGoals: [...(prev.subGoals || []), newGoal],
      updatedAt: new Date().toISOString()
    }));
    setInputSubGoal('');
    setIsAddingSubGoal(false);
    if (soundEffectsOn) playTechBlip(680, 'sine', 0.05);
  };

  const handleToggleSubGoal = (id: string) => {
    setDailyFocus(prev => ({
      ...prev,
      subGoals: (prev.subGoals || []).map(g => {
        if (g.id === id) {
          const next = !g.completed;
          if (next && soundEffectsOn) playTaskCompleteSound();
          else if (!next && soundEffectsOn) playTechBlip(480, 'sine', 0.05);
          return { ...g, completed: next };
        }
        return g;
      }),
      updatedAt: new Date().toISOString()
    }));
  };

  const handleDeleteSubGoal = (id: string) => {
    setDailyFocus(prev => ({
      ...prev,
      subGoals: (prev.subGoals || []).filter(g => g.id !== id),
      updatedAt: new Date().toISOString()
    }));
    if (soundEffectsOn) playTechBlip(400, 'sine', 0.04);
  };
  
  // Format live clock time string (e.g. 01:52:32 | JUE, 24 SEPT 2026)
  const formattedClock = useMemo(() => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const hh = pad(currentTime.getHours());
    const mm = pad(currentTime.getMinutes());
    const ss = pad(currentTime.getSeconds());
    
    const dayNames = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    
    const dayName = dayNames[currentTime.getDay()];
    const dayNum = currentTime.getDate();
    const monthName = monthNames[currentTime.getMonth()];

    return {
      timeStr: `${hh}:${mm}:${ss}`,
      dateStr: `${dayName}, ${dayNum} ${monthName}`
    };
  }, [currentTime]);

  // Pomodoro countdown effect
  useEffect(() => {
    let interval: any = null;
    if (pomodoroRunning && pomodoroSeconds > 0) {
      interval = setInterval(() => {
        setPomodoroSeconds((prev) => prev - 1);
      }, 1000);
    } else if (pomodoroRunning && pomodoroSeconds === 0) {
      playPomodoroBell();
      if (pomodoroMode === 'work') {
        setPomodoroMode('break');
        setPomodoroSeconds(5 * 60);
      } else {
        setPomodoroMode('work');
        setPomodoroSeconds(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [pomodoroRunning, pomodoroSeconds, pomodoroMode]);

  const togglePomodoro = () => {
    if (soundEffectsOn) playTechBlip(640, 'triangle', 0.05);
    setPomodoroRunning(!pomodoroRunning);
  };

  const resetPomodoro = () => {
    if (soundEffectsOn) playTechBlip(440, 'sine', 0.06);
    setPomodoroRunning(false);
    setPomodoroSeconds(pomodoroMode === 'work' ? 25 * 60 : 5 * 60);
  };

  const formatPomodoro = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Click outside to close ambient menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ambientMenuRef.current && !ambientMenuRef.current.contains(event.target as Node)) {
        setIsAmbientMenuOpen(false);
      }
    }
    if (isAmbientMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isAmbientMenuOpen]);

  // Clean up ambient audio on unmount
  useEffect(() => {
    return () => {
      stopAmbientSound();
    };
  }, []);

  // Ambient sound handlers
  const handleToggleAmbient = () => {
    const nextState = !ambientAudioOn;
    setAmbientAudioOn(nextState);
    if (nextState) {
      startAmbientSound(ambientSoundType, ambientVolume);
    } else {
      stopAmbientSound();
    }
  };

  const handleSelectAmbientSound = (type: AmbientSoundType) => {
    setAmbientSoundType(type);
    try {
      localStorage.setItem('deskbuddy_ambient_sound_type', type);
    } catch {}
    setAmbientAudioOn(true);
    startAmbientSound(type, ambientVolume);
    if (soundEffectsOn) playTechBlip(640, 'sine', 0.04);
  };

  const handleChangeAmbientVolume = (vol: number) => {
    setAmbientVolumeState(vol);
    setAmbientVolume(vol);
    try {
      localStorage.setItem('deskbuddy_ambient_volume', vol.toString());
    } catch {}
  };

  const selectedAmbientInfo = useMemo(() => {
    return AMBIENT_SOUND_OPTIONS.find(opt => opt.id === ambientSoundType) || AMBIENT_SOUND_OPTIONS[0];
  }, [ambientSoundType]);

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
      } else {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    } catch {
      setIsFullscreen(!isFullscreen);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Voice recognition init
  const handleToggleVoice = () => {
    if (soundEffectsOn) playTechBlip(800, 'sine', 0.06);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta entrada de voz por SpeechRecognition. Puedes usar el teclado para añadir tareas.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          setVoiceTranscript('Escuchando...');
        };

        recognition.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          setVoiceTranscript(text);
          setIsListening(false);
          // Auto add task from voice command!
          if (text && text.trim().length > 2) {
            handleQuickCreateTask(text.trim(), 'alta');
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
          setVoiceTranscript('');
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch {
        setIsListening(false);
      }
    }
  };

  // Gamification & Progress Calculations
  const {
    dailyProgressPercent,
    totalXP,
    currentLevel,
    levelTitle,
    pendingTasksCount,
    totalTasksCount,
    completedHabitsToday,
    totalHabitsCount,
    habitsProgressPercent
  } = useMemo(() => {
    const todayTasks = tasks.filter(t => t.assignedDate === todayStr || t.dueDate === todayStr);
    const activeTasks = todayTasks.length > 0 ? todayTasks : tasks;

    const completed = activeTasks.filter(t => t.status === 'completada').length;
    const total = activeTasks.length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Calculate total XP earned from all tasks completed + habits streaks
    const completedAllTasks = tasks.filter(t => t.status === 'completada');
    let xp = 75; // Starting baseline
    completedAllTasks.forEach(t => {
      if (t.priority === 'urgente') xp += 60;
      else if (t.priority === 'alta') xp += 50;
      else if (t.priority === 'media') xp += 35;
      else xp += 20;
    });

    habits.forEach(h => {
      xp += (h.streak || 0) * 10;
      if (Array.isArray(h.completedDates) && h.completedDates.includes(todayStr)) {
        xp += 25;
      }
    });

    // Level formula: Level 1 = 0-200, Level 2 = 201-500, Level 3 = 501-1000...
    let lvl = 1;
    let title = 'Iniciado en Organización';
    if (xp >= 1500) {
      lvl = 5;
      title = 'Maestro de Productividad Cósmica';
    } else if (xp >= 800) {
      lvl = 4;
      title = 'Comandante de Hábitos';
    } else if (xp >= 400) {
      lvl = 3;
      title = 'Estratega de Enfoque';
    } else if (xp >= 200) {
      lvl = 2;
      title = 'Operador Táctico';
    }

    const pending = activeTasks.filter(t => t.status !== 'completada').length;

    // Habit metrics for today
    const completedHabitsToday = habits.filter(h => Array.isArray(h.completedDates) && h.completedDates.includes(todayStr)).length;
    const totalHabitsCount = habits.length;
    const habitsProgressPercent = totalHabitsCount > 0 ? Math.round((completedHabitsToday / totalHabitsCount) * 100) : 0;

    return {
      dailyProgressPercent: progress,
      totalXP: xp,
      currentLevel: lvl,
      levelTitle: title,
      pendingTasksCount: pending,
      totalTasksCount: total,
      completedHabitsToday,
      totalHabitsCount,
      habitsProgressPercent
    };
  }, [tasks, habits, todayStr]);

  // Calendar calculation
  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Day of week for 1st day (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    // Convert to Monday = 0, Sunday = 6
    let startingDayIndex = firstDayOfMonth.getDay() - 1;
    if (startingDayIndex === -1) startingDayIndex = 6;

    const daysInMonth = lastDayOfMonth.getDate();

    const days: { dayNum: number; dateStr: string; isCurrentMonth: boolean; hasTasks: boolean }[] = [];

    // Empty spaces before first day
    for (let i = 0; i < startingDayIndex; i++) {
      days.push({ dayNum: 0, dateStr: '', isCurrentMonth: false, hasTasks: false });
    }

    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hasTasks = tasks.some(t => t.assignedDate === dateStr || t.dueDate === dateStr);
      days.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: true,
        hasTasks
      });
    }

    return days;
  }, [calendarDate, tasks]);

  // Week days calculation for week view mode
  const currentWeekDays = useMemo(() => {
    const base = new Date(selectedDateStr + 'T12:00:00');
    const dayOfWeek = base.getDay(); // 0 is Sunday, 1 is Monday
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(base);
    monday.setDate(base.getDate() + diffToMonday);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const hasTasks = tasks.some(t => t.assignedDate === dateStr || t.dueDate === dateStr);
      const taskCount = tasks.filter(t => (t.assignedDate === dateStr || t.dueDate === dateStr) && t.status !== 'completada').length;
      days.push({
        dayName: DAY_NAMES_SHORT[i],
        dayNum: d.getDate(),
        dateStr,
        hasTasks,
        taskCount,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDateStr
      });
    }
    return days;
  }, [selectedDateStr, tasks, todayStr]);

  // Calendar title text based on mode
  const calendarTitleText = useMemo(() => {
    if (calendarViewMode === 'month') {
      return `${MONTH_NAMES_ES[calendarDate.getMonth()]} ${calendarDate.getFullYear()}`;
    }
    if (calendarViewMode === 'week') {
      if (currentWeekDays.length === 0) return '';
      const first = currentWeekDays[0];
      const last = currentWeekDays[6];
      const firstMonth = MONTH_NAMES_ES[new Date(first.dateStr + 'T12:00:00').getMonth()].slice(0, 3);
      const lastMonth = MONTH_NAMES_ES[new Date(last.dateStr + 'T12:00:00').getMonth()].slice(0, 3);
      return `${first.dayNum} ${firstMonth} - ${last.dayNum} ${lastMonth} ${new Date(last.dateStr + 'T12:00:00').getFullYear()}`;
    }
    // day mode
    const d = new Date(selectedDateStr + 'T12:00:00');
    return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
  }, [calendarViewMode, calendarDate, currentWeekDays, selectedDateStr]);

  const handleCalendarPrev = () => {
    if (soundEffectsOn) playTechBlip(440, 'sine', 0.04);
    if (calendarViewMode === 'month') {
      setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
    } else if (calendarViewMode === 'week') {
      const d = new Date(selectedDateStr + 'T12:00:00');
      d.setDate(d.getDate() - 7);
      const newDateStr = d.toISOString().split('T')[0];
      setSelectedDateStr(newDateStr);
      setCalendarDate(d);
    } else {
      // day mode
      const d = new Date(selectedDateStr + 'T12:00:00');
      d.setDate(d.getDate() - 1);
      const newDateStr = d.toISOString().split('T')[0];
      setSelectedDateStr(newDateStr);
      setCalendarDate(d);
    }
  };

  const handleCalendarNext = () => {
    if (soundEffectsOn) playTechBlip(440, 'sine', 0.04);
    if (calendarViewMode === 'month') {
      setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
    } else if (calendarViewMode === 'week') {
      const d = new Date(selectedDateStr + 'T12:00:00');
      d.setDate(d.getDate() + 7);
      const newDateStr = d.toISOString().split('T')[0];
      setSelectedDateStr(newDateStr);
      setCalendarDate(d);
    } else {
      // day mode
      const d = new Date(selectedDateStr + 'T12:00:00');
      d.setDate(d.getDate() + 1);
      const newDateStr = d.toISOString().split('T')[0];
      setSelectedDateStr(newDateStr);
      setCalendarDate(d);
    }
  };

  // Helper to add days to a YYYY-MM-DD date string
  const addDaysToDateStr = (dateStr: string, days: number = 1): string => {
    if (!dateStr) return todayStr;
    const d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  // Agenda for selected date: strictly tasks scheduled for this day
  const agendaItems = useMemo(() => {
    return tasks.filter(t => t.assignedDate === selectedDateStr || (!t.assignedDate && t.dueDate === selectedDateStr));
  }, [tasks, selectedDateStr]);

  const displayAgendaItems = useMemo(() => {
    let list = agendaLaboralOnly ? agendaItems.filter(isItemLaboral) : agendaItems;
    if (agendaStatusFilter === 'pendientes') {
      list = list.filter(t => t.status !== 'completada' && t.status !== 'cancelada');
    } else if (agendaStatusFilter === 'completadas') {
      list = list.filter(t => t.status === 'completada');
    }
    // Sort: pending at top, completed at bottom. Within pending: prioritize oldest first!
    return [...list].sort((a, b) => {
      const aDone = a.status === 'completada' ? 1 : 0;
      const bDone = b.status === 'completada' ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;

      if (!aDone) {
        const priorityWeight: Record<string, number> = { urgente: 4, alta: 3, media: 2, baja: 1 };
        const pDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        if (pDiff !== 0) return pDiff;

        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeA && timeB && timeA !== timeB) return timeA - timeB;
      }

      const compA = a.completedAtTimestamp ? new Date(a.completedAtTimestamp).getTime() : 0;
      const compB = b.completedAtTimestamp ? new Date(b.completedAtTimestamp).getTime() : 0;
      return compB - compA;
    });
  }, [agendaItems, agendaLaboralOnly, agendaStatusFilter, laboralOverrides]);

  // Unfinished work tasks for the current selected date
  const pendingLaboralTasksForDate = useMemo(() => {
    return tasks.filter(t => {
      const isLaboral = isItemLaboral(t);
      const isPending = t.status !== 'completada' && t.status !== 'cancelada';
      const isForDate = t.assignedDate === selectedDateStr || (!t.assignedDate && t.dueDate === selectedDateStr);
      return isLaboral && isPending && isForDate;
    });
  }, [tasks, selectedDateStr, laboralOverrides]);

  // Single task rollover to next day (Button ">")
  const handleRolloverTaskToNextDay = (task: Task, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (soundEffectsOn) playTechBlip(620, 'triangle', 0.06);

    const baseDate = task.assignedDate || selectedDateStr || todayStr;
    const nextDate = addDaysToDateStr(baseDate, 1);

    const updatedTask: Task = {
      ...task,
      assignedDate: nextDate,
      dueDate: task.dueDate && task.dueDate < nextDate ? nextDate : (task.dueDate || nextDate),
      rolloverCount: (task.rolloverCount || 0) + 1,
      isRollover: true,
      postponedFromDate: baseDate,
      rolledOverFromDate: baseDate,
      updatedAt: todayStr
    };

    if (onUpdateTask) {
      onUpdateTask(updatedTask);
    } else if (onQuickAddTask) {
      onQuickAddTask(updatedTask);
    }

    setToastNotification({
      show: true,
      message: `Tarea "${task.title.slice(0, 22)}" rodada al ${nextDate} ⏭️`
    });
    setTimeout(() => setToastNotification(prev => ({ ...prev, show: false })), 2800);
  };

  // Batch rollover for uncompleted work tasks of selected day (End of day closure)
  const handleBatchRolloverPendingLaboral = () => {
    if (pendingLaboralTasksForDate.length === 0) return;
    if (soundEffectsOn) playTechBlip(750, 'sine', 0.08);

    const nextDate = addDaysToDateStr(selectedDateStr, 1);
    pendingLaboralTasksForDate.forEach(task => {
      const updatedTask: Task = {
        ...task,
        assignedDate: nextDate,
        dueDate: task.dueDate && task.dueDate < nextDate ? nextDate : (task.dueDate || nextDate),
        rolloverCount: (task.rolloverCount || 0) + 1,
        isRollover: true,
        postponedFromDate: selectedDateStr,
        rolledOverFromDate: selectedDateStr,
        updatedAt: todayStr
      };

      if (onUpdateTask) {
        onUpdateTask(updatedTask);
      } else if (onQuickAddTask) {
        onQuickAddTask(updatedTask);
      }
    });

    setToastNotification({
      show: true,
      message: `${pendingLaboralTasksForDate.length} tarea(s) laboral(es) rodada(s) al ${nextDate} 🌙`
    });
    setTimeout(() => setToastNotification(prev => ({ ...prev, show: false })), 3000);
  };

  // Filtered tasks for center panel
  const displayTasks = useMemo(() => {
    let list = tasks;
    if (taskFilter === 'completadas') {
      list = tasks.filter(t => t.status === 'completada');
    } else if (taskFilter === 'pendientes') {
      list = tasks.filter(t => t.status !== 'completada');
    }

    return [...list].sort((a, b) => {
      const aDone = a.status === 'completada' ? 1 : 0;
      const bDone = b.status === 'completada' ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;

      if (!aDone) {
        const priorityWeight: Record<string, number> = { urgente: 4, alta: 3, media: 2, baja: 1 };
        const pDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        if (pDiff !== 0) return pDiff;

        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeA && timeB && timeA !== timeB) return timeA - timeB;
      }

      const compA = a.completedAtTimestamp ? new Date(a.completedAtTimestamp).getTime() : 0;
      const compB = b.completedAtTimestamp ? new Date(b.completedAtTimestamp).getTime() : 0;
      return compB - compA;
    });
  }, [tasks, taskFilter]);

  // Quick Task Creation Handler
  const handleQuickCreateTask = (titleToCreate?: string, priorityToUse?: Priority) => {
    const finalTitle = titleToCreate || quickTitle;
    if (!finalTitle.trim()) return;

    if (soundEffectsOn) playTechBlip(720, 'sine', 0.08);

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: finalTitle.trim(),
      description: 'Creado desde DeskBuddy Tablet HUD',
      category: quickCategory || 'actividades_pendientes',
      priority: priorityToUse || quickPriority,
      status: 'pendiente',
      estimatedHours: 2,
      completedHours: 0,
      finalGoal: finalTitle.trim(),
      assignedDate: selectedDateStr || todayStr,
      dueDate: selectedDateStr || todayStr,
      timeSlot: quickTimeSlot || '16:00 - 17:00',
      tags: ['DeskBuddy', 'Productividad'],
      subgoals: [],
      createdAt: todayStr,
      updatedAt: todayStr
    };

    if (onQuickAddTask) {
      onQuickAddTask(newTask);
    } else if (onOpenNewTaskModal) {
      // Fallback
      onOpenNewTaskModal();
    }

    setQuickTitle('');
    setIsQuickAddOpen(false);
  };

  // Toggle Task Completion with rewarding sound and XP
  const handleCheckTask = (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'completada' ? 'pendiente' : 'completada';
    if (nextStatus === 'completada' && soundEffectsOn) {
      playTaskCompleteSound();
    } else if (soundEffectsOn) {
      playTechBlip(480, 'sine', 0.05);
    }
    onToggleTask(task.id, nextStatus);
  };

  // Copy task details to clipboard
  const handleCopyTaskInfo = (task: Task, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const textParts = [task.title];
    if (task.description && task.description.trim()) {
      textParts.push(`Detalles: ${task.description.trim()}`);
    }
    if (task.finalGoal && task.finalGoal.trim() && task.finalGoal !== task.title) {
      textParts.push(`Meta: ${task.finalGoal.trim()}`);
    }
    if (task.timeSlot) {
      textParts.push(`Horario: ${task.timeSlot}`);
    }
    if (task.dueDate) {
      textParts.push(`Fecha: ${task.dueDate}`);
    }
    if (task.priority) {
      textParts.push(`Prioridad: ${task.priority.toUpperCase()}`);
    }
    const textToCopy = textParts.join('\n');
    try {
      navigator.clipboard.writeText(textToCopy);
      setCopiedTaskId(task.id);
      if (soundEffectsOn) playTechBlip(880, 'sine', 0.05);
      setTimeout(() => setCopiedTaskId(null), 2000);
    } catch {
      setCopiedTaskId(task.id);
      setTimeout(() => setCopiedTaskId(null), 2000);
    }
  };

  // Quick Habit Creation Handler
  const handleQuickCreateHabit = (titleToCreate?: string) => {
    const finalTitle = titleToCreate || quickTitle;
    if (!finalTitle.trim()) return;

    if (soundEffectsOn) playTechBlip(880, 'triangle', 0.1);

    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      title: finalTitle.trim(),
      description: 'Hábito diario configurado desde DeskBuddy Tablet HUD',
      category: quickCategory || 'salud_bienestar',
      frequency: quickHabitFrequency || 'daily',
      targetDaysPerWeek: quickHabitFrequency === 'weekdays' ? 5 : quickHabitFrequency === 'weekends' ? 2 : 7,
      targetTime: quickTimeSlot || '08:00',
      streak: 0,
      bestStreak: 0,
      completedDates: [],
      createdAt: todayStr,
      archived: false,
    };

    if (onQuickAddHabit) {
      onQuickAddHabit(newHabit);
    } else if (onOpenNewHabitModal) {
      onOpenNewHabitModal();
    }

    setQuickTitle('');
    setIsQuickAddOpen(false);
  };

  // Toggle Habit
  const handleCheckHabit = (habit: Habit) => {
    if (soundEffectsOn) playTaskCompleteSound();
    if (onToggleHabitDay) {
      onToggleHabitDay(habit.id, todayStr);
    }
  };

  // Health & Nutrition Metrics
  const sortedWeightLogs = useMemo(() => {
    if (!weightLogs || !Array.isArray(weightLogs)) return [];
    return [...weightLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [weightLogs]);

  const latestWeightEntry = sortedWeightLogs.length > 0 ? sortedWeightLogs[sortedWeightLogs.length - 1] : null;
  const previousWeightEntry = sortedWeightLogs.length > 1 ? sortedWeightLogs[sortedWeightLogs.length - 2] : null;
  const latestWeight = latestWeightEntry?.weight ?? healthProfile?.currentWeight ?? 72;
  const weightDiff = previousWeightEntry ? Number((latestWeight - previousWeightEntry.weight).toFixed(1)) : null;
  const targetWeight = healthProfile?.targetWeight;

  const bmi = calculateBMI(latestWeight, healthProfile?.height || 175);
  const bmiInfo = getBMICategory(bmi);
  const bmr = calculateBMR(healthProfile?.gender || 'masculino', latestWeight, healthProfile?.height || 175, healthProfile?.age || 30);
  const tdee = calculateTDEE(bmr, healthProfile?.activityLevel || 'moderado');

  // Target calories: based on goal or maintenance
  const targetCalories = useMemo(() => {
    if (targetWeight && targetWeight < latestWeight) {
      return Math.max(1200, Math.round(tdee - 450)); // Controlled deficit
    }
    if (targetWeight && targetWeight > latestWeight) {
      return Math.round(tdee + 350); // Clean surplus
    }
    return Math.round(tdee); // Maintenance
  }, [targetWeight, latestWeight, tdee]);

  // Weight Trend Chart Data
  const weightTrendChartData = useMemo(() => {
    if (sortedWeightLogs.length === 0) {
      const initialW = healthProfile?.currentWeight || healthProfile?.startingWeight || 72;
      return [
        { id: 'initial-1', date: 'Inicio', weight: initialW, fullDate: todayStr },
        { id: 'initial-2', date: 'Hoy', weight: initialW, fullDate: todayStr }
      ];
    }

    if (sortedWeightLogs.length === 1) {
      const single = sortedWeightLogs[0];
      const startW = healthProfile?.startingWeight && healthProfile.startingWeight !== single.weight
        ? healthProfile.startingWeight
        : single.weight;
      return [
        { id: 'initial-start', date: 'Inicio', weight: startW, fullDate: 'Inicio' },
        { 
          id: single.id,
          date: single.date.length > 5 ? single.date.slice(5) : single.date, 
          weight: single.weight, 
          fullDate: single.date,
          notes: single.notes 
        }
      ];
    }

    return sortedWeightLogs.map(l => ({
      id: l.id,
      date: l.date.length > 5 ? l.date.slice(5) : l.date,
      weight: l.weight,
      fullDate: l.date,
      notes: l.notes
    }));
  }, [sortedWeightLogs, healthProfile, todayStr]);

  const weightDomain = useMemo(() => {
    if (weightTrendChartData.length === 0) return [60, 85];
    const vals = weightTrendChartData.map(d => d.weight);
    if (targetWeight) vals.push(targetWeight);
    const min = Math.floor(Math.min(...vals) - 1.5);
    const max = Math.ceil(Math.max(...vals) + 1.5);
    return [min, max];
  }, [weightTrendChartData, targetWeight]);

  // Selected Health & Nutrition Date (Defaults to todayStr, but user can choose yesterday or any past date to fill missing info)
  const [selectedHealthDate, setSelectedHealthDate] = useState<string>(todayStr);

  const yesterdayDateStr = useMemo(() => {
    try {
      const d = new Date(todayStr + 'T12:00:00');
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    } catch {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    }
  }, [todayStr]);

  // Active Calorie Log for the selected health date (Today, Yesterday, or custom date)
  const todayCalorieLog = useMemo(() => {
    if (!calorieLogs || !Array.isArray(calorieLogs)) return null;
    return calorieLogs.find(l => l.date === selectedHealthDate) || null;
  }, [calorieLogs, selectedHealthDate]);

  const caloriesConsumed = todayCalorieLog?.totalCaloriesConsumed || 0;
  const calorieProgressPercent = targetCalories > 0 ? Math.round((caloriesConsumed / targetCalories) * 100) : 0;
  const calorieBalance = caloriesConsumed - targetCalories;
  const waterGlasses = todayCalorieLog?.waterGlasses || 0;
  const dailySteps = todayCalorieLog?.steps || 0;
  const exerciseCaloriesBurned = todayCalorieLog?.exerciseCaloriesBurned || 0;

  // Quick Weight Save Handler
  const handleSaveQuickWeight = (overrideWeight?: number, overrideDate?: string) => {
    const num = overrideWeight !== undefined ? overrideWeight : parseFloat(quickWeightValue);
    if (isNaN(num) || num <= 0) return;

    const logDate = overrideDate || dailyWeightInputDate || selectedHealthDate || todayStr;

    if (soundEffectsOn) playTechBlip(840, 'triangle', 0.1);

    if (onAddWeightLog) {
      onAddWeightLog({
        date: logDate,
        weight: num,
        notes: quickWeightNotes.trim() || undefined
      });
    }

    if (onUpdateHealthProfile && healthProfile) {
      onUpdateHealthProfile({
        ...healthProfile,
        currentWeight: num,
        updatedAt: new Date().toISOString()
      });
    }

    setToastNotification({
      show: true,
      message: `⚖️ Peso registrado: ${num} kg (${logDate})`
    });
    setTimeout(() => setToastNotification(prev => ({ ...prev, show: false })), 3000);

    setIsQuickWeightOpen(false);
    setQuickWeightValue('');
    setQuickWeightNotes('');
  };

  // Quick Calorie Save Handler
  const handleSaveQuickCalories = (overrideAmount?: number, overrideMeal?: 'breakfast' | 'lunch' | 'dinner' | 'snacks') => {
    const amount = overrideAmount ?? parseInt(quickCalorieAmount, 10);
    if (isNaN(amount) || amount <= 0) return;

    const mealKey = overrideMeal ?? quickCalorieMeal;

    if (soundEffectsOn) playTechBlip(720, 'sine', 0.08);

    const currentLog: DailyCalorieLog = todayCalorieLog || {
      id: `cal-log-${Date.now()}`,
      date: selectedHealthDate,
      breakfast: { items: [], totalCalories: 0 },
      lunch: { items: [], totalCalories: 0 },
      dinner: { items: [], totalCalories: 0 },
      snacks: { items: [], totalCalories: 0 },
      totalCaloriesConsumed: 0,
      steps: 0,
      stepsCaloriesBurned: 0,
      exerciseCaloriesBurned: 0,
      sleepHours: 7,
      waterGlasses: 0,
      createdAt: new Date().toISOString()
    };

    const existingMeal = currentLog[mealKey] || { items: [], totalCalories: 0 };
    const defaultMealNames: Record<string, string> = {
      breakfast: 'Desayuno',
      lunch: 'Almuerzo',
      dinner: 'Cena',
      snacks: 'Snack / Refrigerio'
    };

    const newItem = {
      id: `item-${Date.now()}`,
      name: quickCalorieItemName.trim() || defaultMealNames[mealKey] || 'Comida',
      calories: amount
    };

    const updatedMeal = {
      ...existingMeal,
      items: [...existingMeal.items, newItem],
      totalCalories: existingMeal.totalCalories + amount
    };

    const newTotalConsumed = (
      (mealKey === 'breakfast' ? updatedMeal.totalCalories : currentLog.breakfast?.totalCalories || 0) +
      (mealKey === 'lunch' ? updatedMeal.totalCalories : currentLog.lunch?.totalCalories || 0) +
      (mealKey === 'dinner' ? updatedMeal.totalCalories : currentLog.dinner?.totalCalories || 0) +
      (mealKey === 'snacks' ? updatedMeal.totalCalories : currentLog.snacks?.totalCalories || 0)
    );

    const updatedLog: DailyCalorieLog = {
      ...currentLog,
      [mealKey]: updatedMeal,
      totalCaloriesConsumed: newTotalConsumed,
      updatedAt: new Date().toISOString()
    };

    if (onSaveDailyCalorieLog) {
      onSaveDailyCalorieLog(updatedLog);
    }

    setIsQuickCalorieOpen(false);
    setQuickCalorieAmount('');
    setQuickCalorieItemName('');
  };

  // Open direct meal calorie editor
  const handleOpenMealEdit = (mealKey: 'breakfast' | 'lunch' | 'dinner' | 'snacks') => {
    if (editingMealKey === mealKey) {
      setEditingMealKey(null);
      return;
    }
    const currentVal = todayCalorieLog?.[mealKey]?.totalCalories;
    setEditingMealKey(mealKey);
    setEditingMealCalories(currentVal !== undefined && currentVal !== null ? String(currentVal) : '');
    setEditingMealDescription(todayCalorieLog?.[mealKey]?.items?.[0]?.name || '');
    setIsQuickCalorieOpen(false);
    if (soundEffectsOn) playTechBlip(640, 'sine', 0.05);
  };

  // Set exact calories for a meal (Desayuno, Almuerzo, Cena, Snacks)
  const handleSetMealExactCalories = (
    mealKey: 'breakfast' | 'lunch' | 'dinner' | 'snacks',
    exactCalories: number,
    description?: string
  ) => {
    const calories = Math.max(0, Math.round(exactCalories));
    if (soundEffectsOn) playTechBlip(760, 'sine', 0.08);

    const currentLog: DailyCalorieLog = todayCalorieLog || {
      id: `cal-log-${Date.now()}`,
      date: selectedHealthDate,
      breakfast: { items: [], totalCalories: 0 },
      lunch: { items: [], totalCalories: 0 },
      dinner: { items: [], totalCalories: 0 },
      snacks: { items: [], totalCalories: 0 },
      totalCaloriesConsumed: 0,
      steps: 0,
      stepsCaloriesBurned: 0,
      exerciseCaloriesBurned: 0,
      sleepHours: 7,
      waterGlasses: 0,
      createdAt: new Date().toISOString()
    };

    const defaultMealNames: Record<string, string> = {
      breakfast: 'Desayuno',
      lunch: 'Almuerzo',
      dinner: 'Cena',
      snacks: 'Snacks'
    };

    const mealLabel = defaultMealNames[mealKey] || 'Comida';
    const itemName = description && description.trim().length > 0 
      ? description.trim() 
      : `${mealLabel} (${calories} kcal)`;

    const updatedMeal = {
      items: calories > 0 ? [
        {
          id: `item-${Date.now()}`,
          name: itemName,
          calories: calories
        }
      ] : [],
      totalCalories: calories
    };

    const newTotalConsumed = (
      (mealKey === 'breakfast' ? updatedMeal.totalCalories : currentLog.breakfast?.totalCalories || 0) +
      (mealKey === 'lunch' ? updatedMeal.totalCalories : currentLog.lunch?.totalCalories || 0) +
      (mealKey === 'dinner' ? updatedMeal.totalCalories : currentLog.dinner?.totalCalories || 0) +
      (mealKey === 'snacks' ? updatedMeal.totalCalories : currentLog.snacks?.totalCalories || 0)
    );

    const updatedLog: DailyCalorieLog = {
      ...currentLog,
      [mealKey]: updatedMeal,
      totalCaloriesConsumed: newTotalConsumed,
      updatedAt: new Date().toISOString()
    };

    if (onSaveDailyCalorieLog) {
      onSaveDailyCalorieLog(updatedLog);
    }

    setEditingMealKey(null);
    setEditingMealCalories('');
    setEditingMealDescription('');
  };

  const mealPresets: Record<'breakfast' | 'lunch' | 'dinner' | 'snacks', { label: string; val: number; desc?: string }[]> = {
    breakfast: [
      { label: '2 huevos', val: 160, desc: '2 huevos cocidos o revueltos' },
      { label: 'Avena con fruta', val: 260, desc: 'Avena cocida con banano/fresas' },
      { label: 'Huevos + café', val: 220, desc: '2 huevos con café negro' },
      { label: 'Arepa con queso', val: 345, desc: 'Arepa con queso blanco y café' },
      { label: '0 (Ayuno)', val: 0, desc: 'Ayuno intermitente' }
    ],
    lunch: [
      { label: 'Ligero', val: 350, desc: 'Ensalada con pechuga' },
      { label: 'Medio', val: 540, desc: 'Pechuga a la plancha con arroz y ensalada' },
      { label: 'Completo', val: 680, desc: 'Almuerzo completo con sopa' },
      { label: '2 huevos', val: 160, desc: '2 huevos con guarnición' },
      { label: '0 (Sin almuerzo)', val: 0, desc: 'Sin almuerzo' }
    ],
    dinner: [
      { label: '2 huevos', val: 160, desc: '2 huevos cocidos ligeros' },
      { label: 'Ensalada/Ligera', val: 250, desc: 'Ensalada fresca o crema' },
      { label: 'Wrap / Atún', val: 340, desc: 'Wrap integral con atún y verduras' },
      { label: 'Cena fuerte', val: 480, desc: 'Cena completa' },
      { label: '0 (Sin cena)', val: 0, desc: 'Sin cena' }
    ],
    snacks: [
      { label: 'Fruta fresca', val: 80, desc: 'Manzana verde o fruta fresca' },
      { label: 'Batido proteína', val: 130, desc: 'Batido Whey protein con agua' },
      { label: 'Frutos secos', val: 180, desc: 'Puñado de almendras o nueces' },
      { label: 'Snack 215', val: 215, desc: 'Snack energético' },
      { label: '0 (Sin snacks)', val: 0, desc: 'Sin snacks' }
    ]
  };

  // Quick Water Increment/Decrement Handler
  const handleUpdateWaterGlasses = (delta: number) => {
    const current = todayCalorieLog?.waterGlasses || 0;
    const nextVal = Math.max(0, current + delta);

    if (soundEffectsOn) playTechBlip(delta > 0 ? 800 : 420, 'sine', 0.05);

    const currentLog: DailyCalorieLog = todayCalorieLog || {
      id: `cal-log-${Date.now()}`,
      date: selectedHealthDate,
      breakfast: { items: [], totalCalories: 0 },
      lunch: { items: [], totalCalories: 0 },
      dinner: { items: [], totalCalories: 0 },
      snacks: { items: [], totalCalories: 0 },
      totalCaloriesConsumed: 0,
      steps: 0,
      stepsCaloriesBurned: 0,
      exerciseCaloriesBurned: 0,
      sleepHours: 7,
      waterGlasses: 0,
      createdAt: new Date().toISOString()
    };

    const updatedLog: DailyCalorieLog = {
      ...currentLog,
      waterGlasses: nextVal,
      updatedAt: new Date().toISOString()
    };

    if (onSaveDailyCalorieLog) {
      onSaveDailyCalorieLog(updatedLog);
    }
  };

  // Handler to set/save exact steps and exercise calories, calculating steps burn internally
  const handleSaveActivityValues = (
    exactSteps?: number,
    exactExerciseCalories?: number
  ) => {
    if (soundEffectsOn) playTechBlip(820, 'triangle', 0.08);

    const currentLog: DailyCalorieLog = todayCalorieLog || {
      id: `cal-log-${Date.now()}`,
      date: selectedHealthDate,
      breakfast: { items: [], totalCalories: 0 },
      lunch: { items: [], totalCalories: 0 },
      dinner: { items: [], totalCalories: 0 },
      snacks: { items: [], totalCalories: 0 },
      totalCaloriesConsumed: 0,
      steps: 0,
      stepsCaloriesBurned: 0,
      exerciseCaloriesBurned: 0,
      sleepHours: 7,
      waterGlasses: 0,
      createdAt: new Date().toISOString()
    };

    const targetSteps = exactSteps !== undefined
      ? Math.max(0, Math.round(exactSteps))
      : quickActivitySteps.trim() !== ''
      ? Math.max(0, parseInt(quickActivitySteps, 10) || 0)
      : (currentLog.steps || 0);

    const targetExerciseCalories = exactExerciseCalories !== undefined
      ? Math.max(0, Math.round(exactExerciseCalories))
      : quickActivityCalories.trim() !== ''
      ? Math.max(0, parseInt(quickActivityCalories, 10) || 0)
      : (currentLog.exerciseCaloriesBurned || 0);

    // Calculate calories burned from step count adjusted to user's body weight
    const stepsBurned = calculateStepCalories(targetSteps, latestWeight);
    const totalActivity = stepsBurned + targetExerciseCalories;

    const updatedLog: DailyCalorieLog = {
      ...currentLog,
      steps: targetSteps,
      stepsCaloriesBurned: stepsBurned,
      exerciseCaloriesBurned: targetExerciseCalories,
      updatedAt: new Date().toISOString()
    };

    if (onSaveDailyCalorieLog) {
      onSaveDailyCalorieLog(updatedLog);
    }

    setToastNotification({
      show: true,
      message: `Actividad registrada: ${targetSteps.toLocaleString()} pasos (${stepsBurned} kcal) + ${targetExerciseCalories} kcal ejercicio = ${totalActivity} kcal añadidas al déficit.`
    });
    setTimeout(() => setToastNotification(prev => ({ ...prev, show: false })), 4000);

    setIsQuickActivityOpen(false);
    setQuickActivityCalories('');
    setQuickActivitySteps('');
  };

  // Quick Activity Increment Handler
  const handleUpdateActivity = (deltaCalories: number, deltaSteps: number = 0) => {
    const curSteps = todayCalorieLog?.steps || 0;
    const curExKcal = todayCalorieLog?.exerciseCaloriesBurned || 0;
    handleSaveActivityValues(curSteps + deltaSteps, curExKcal + deltaCalories);
  };

  // Smart Productivity Advice list
  const ADVICE_LIST = useMemo(() => [
    dailyFocus.mainFocus
      ? `🎯 Enfoque de hoy: "${dailyFocus.mainFocus}". ¡Mantén el rumbo y protege este bloque de atención!`
      : `¡Hola! He organizado tu espacio. Define tu "Objetivo de Enfoque del Día" en el panel central para fijar tu prioridad número uno.`,
    `Detecto ${pendingTasksCount} tareas pendientes. Te recomiendo iniciar con tu bloque de máxima energía antes de mediodía.`,
    `El Pomodoro está configurado a 25 minutos. Activa el temporizador para entrar en estado de hiperimpulso sin distracciones.`,
    `Tus hábitos diarios mantienen tu racha viva. Recuerda registrar cada victoria para sumar XP a tu nivel organizativo.`,
    `La constancia vence a la intensidad. Si un compromiso parece abrumador, divídelo en micro-bloques de 15 minutos.`
  ], [pendingTasksCount, dailyFocus.mainFocus]);

  const currentAdvice = ADVICE_LIST[adviceIndex % ADVICE_LIST.length];

  const handleNextAdvice = () => {
    if (soundEffectsOn) playTechBlip(840, 'triangle', 0.05);
    setAdviceIndex(prev => prev + 1);
  };

  // Text to Speech for Assistant
  const handleSpeakAdvice = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentAdvice);
      utterance.lang = 'es-ES';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#060b17] text-slate-100 flex flex-col font-sans overflow-hidden select-none">
      
      {/* Background Cyber Grid Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f2ff08_1px,transparent_1px),linear-gradient(to_bottom,#00f2ff08_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00f2ff]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#38ef7d]/5 rounded-full blur-3xl pointer-events-none" />

      {/* ======================================================== */}
      {/* TOP HEADER BAR (DESKBUDDY TELEMETRY HUD)                   */}
      {/* ======================================================== */}
      <header className="relative z-20 shrink-0 h-13 sm:h-14 bg-[#0a1224]/95 backdrop-blur-md border-b border-[#00f2ff]/30 px-2 sm:px-4 flex items-center justify-between gap-2 shadow-lg shadow-[#00f2ff]/5">
        
        {/* Left: Branding & Status Beacon */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00f2ff] shadow-[0_0_12px_#00f2ff]" />
            <span className="absolute w-4 h-4 rounded-full border border-[#00f2ff]/50 animate-ping" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <h1 className="text-xs sm:text-sm font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-[#00f2ff] uppercase font-mono">
              DESKBUDDY
            </h1>
            <span className="text-[10px] text-cyan-300 font-semibold tracking-normal hidden 2xl:inline font-mono">
              // ASISTENTE HUD
            </span>
          </div>

          {/* Quick Back to Home next to Logo */}
          <button
            onClick={onExit}
            className="ml-1 sm:ml-2 px-2 py-1 rounded-xl bg-[#0e1933] hover:bg-[#16274e] border border-cyan-500/40 hover:border-cyan-300 text-cyan-300 hover:text-white text-xs font-mono font-bold flex items-center space-x-1 transition-all cursor-pointer shrink-0"
            title="Regresar al inicio / tablero de LifeBlocks"
          >
            <ArrowLeft className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">Inicio</span>
          </button>
        </div>

        {/* Center: Scrollable Telemetry Strip & Quick Controls */}
        <div className="flex items-center space-x-1.5 text-xs min-w-0 flex-1 overflow-x-auto scrollbar-none px-1">
          
          {/* Live Digital Clock */}
          <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-xl bg-[#0e1933] border border-[#00f2ff]/30 shadow-inner font-mono text-xs whitespace-nowrap shrink-0">
            <Clock className="w-3.5 h-3.5 text-[#00f2ff]" />
            <span className="font-bold text-cyan-200 tracking-wider text-sm">{formattedClock.timeStr}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300 font-medium text-[11px]">{formattedClock.dateStr}</span>
          </div>
          
          {/* Hábitos Indicator */}
          <div 
            onClick={() => {
              setTaskFilter('habitos');
              if (soundEffectsOn) playTechBlip(520, 'sine', 0.05);
            }}
            className="flex items-center space-x-1.5 px-2 py-1 rounded-xl bg-[#0e1933]/90 border border-emerald-500/30 hover:border-emerald-400 cursor-pointer transition-colors shrink-0"
            title="Ver Hábitos Diarios"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="hidden xl:inline text-[10px] font-mono uppercase text-slate-400">Hábitos:</span>
            <span className="text-[11px] font-mono font-bold text-emerald-300">
              {completedHabitsToday}/{totalHabitsCount}
            </span>
          </div>

          {/* Salud & Estado Físico Quick Telemetry Pill */}
          <div 
            onClick={() => {
              setRightPanelTab('health');
              if (soundEffectsOn) playTechBlip(560, 'sine', 0.05);
            }}
            className="flex items-center space-x-1.5 px-2 py-1 rounded-xl bg-[#0e1933]/90 border border-rose-500/30 hover:border-rose-400 cursor-pointer transition-colors shrink-0"
            title="Abrir Panel de Salud y Estado Físico (Peso y Calorías)"
          >
            <Heart className="w-3.5 h-3.5 text-rose-400 animate-pulse fill-rose-500/20" />
            <span className="hidden xl:inline text-[10px] font-mono uppercase text-slate-400">Salud:</span>
            <span className="text-[11px] font-mono font-bold text-cyan-300">{latestWeight}kg</span>
            <span className="text-slate-600">|</span>
            <span className="text-[11px] font-mono font-bold text-amber-300">{caloriesConsumed}/{targetCalories}kcal</span>
          </div>

          {/* Gamification Level & XP */}
          <div className="hidden xl:flex items-center space-x-1.5 px-2 py-1 rounded-xl bg-[#0e1933]/90 border border-[#00f2ff]/20 shrink-0">
            <Award className="w-3.5 h-3.5 text-[#00f2ff]" />
            <span className="text-[11px] font-mono font-bold text-slate-200">NV.{currentLevel}</span>
            <span className="text-[10px] font-mono text-cyan-300 font-bold">{totalXP}XP</span>
          </div>

          {/* Pomodoro Timer */}
          <div className="flex items-center space-x-1 px-2 py-1 rounded-xl bg-[#0e1933] border border-[#00f2ff]/40 shadow-sm font-mono shrink-0">
            <span className="text-[9px] text-slate-400 font-bold uppercase hidden sm:inline">POM:</span>
            <span className={`text-xs font-bold ${pomodoroRunning ? 'text-[#00f2ff] animate-pulse' : 'text-slate-200'}`}>
              {formatPomodoro(pomodoroSeconds)}
            </span>
            <button
              onClick={togglePomodoro}
              className="p-1 rounded-md hover:bg-cyan-500/20 text-[#00f2ff] transition-colors cursor-pointer"
              title={pomodoroRunning ? 'Pausar Pomodoro' : 'Iniciar Pomodoro'}
            >
              {pomodoroRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
            </button>
            <button
              onClick={resetPomodoro}
              className="p-1 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Reiniciar Temporizador"
            >
              <RotateCcw className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Mood Selector Mini-Button */}
          <button
            onClick={() => {
              const moods: MoodType[] = ['focused', 'energized', 'calm', 'flow'];
              const next = moods[(moods.indexOf(mood) + 1) % moods.length];
              setMood(next);
              if (soundEffectsOn) playTechBlip(600, 'sine', 0.05);
            }}
            className="p-1.5 rounded-xl bg-[#0e1933] border border-[#23314d] hover:border-cyan-400 text-amber-300 transition-all cursor-pointer shrink-0"
            title={`Estado de Ánimo: ${mood} (clic para alternar)`}
          >
            <Smile className="w-3.5 h-3.5 text-amber-400" />
          </button>

          {/* Voice Input Button */}
          <button
            onClick={handleToggleVoice}
            className={`p-1.5 rounded-xl transition-all cursor-pointer border shrink-0 ${
              isListening
                ? 'bg-rose-500/20 text-rose-300 border-rose-500 animate-pulse'
                : 'bg-[#0e1933] text-cyan-200 border-[#23314d] hover:border-cyan-400'
            }`}
            title="Activar Comando de Voz para Crear Tareas"
          >
            {isListening ? <MicOff className="w-3.5 h-3.5 text-rose-400" /> : <Mic className="w-3.5 h-3.5 text-cyan-400" />}
          </button>

          {/* Ambient Sound Selector & Drone Toggle Button */}
          <div className="flex items-center rounded-xl bg-[#0e1933] border border-[#23314d] hover:border-cyan-400 p-0.5 shrink-0">
            <button
              onClick={handleToggleAmbient}
              className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                ambientAudioOn
                  ? 'bg-cyan-500/25 text-[#00f2ff] shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={ambientAudioOn ? `Pausar Sonido: ${selectedAmbientInfo.name}` : `Activar Sonido: ${selectedAmbientInfo.name}`}
            >
              {ambientAudioOn ? (
                <Volume2 className="w-3.5 h-3.5 text-[#00f2ff] animate-pulse" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="text-xs">{selectedAmbientInfo.icon}</span>
              <span className="hidden xl:inline text-[11px] font-mono font-bold text-cyan-200">
                {selectedAmbientInfo.shortName}
              </span>
            </button>

            <button
              onClick={() => setIsAmbientMenuOpen(!isAmbientMenuOpen)}
              className={`px-1.5 py-1 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer rounded-r-lg ${
                isAmbientMenuOpen ? 'text-cyan-300 bg-cyan-500/20' : ''
              }`}
              title="Elegir sonido ambiental (Océano, Bosque, Lluvia, Río, Fogata, Espacio)"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {/* Daily Morning Briefing Button (Resumen de Ayer & Panorama de Hoy) */}
          <button
            onClick={() => {
              setIsDailyBriefingOpen(true);
              if (soundEffectsOn) playTechBlip(680, 'sine', 0.05);
            }}
            className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/25 via-orange-500/20 to-cyan-500/25 hover:from-amber-500/35 hover:to-cyan-500/35 border border-amber-400/50 text-amber-200 hover:text-amber-100 flex items-center space-x-1.5 text-xs font-mono font-bold transition-all cursor-pointer shrink-0 shadow-sm active:scale-95 group"
            title="Abrir Resumen Diario: Cómo estuvo ayer y panorama de hoy (Clima, Tareas Urgentes, Hábitos)"
          >
            <Sunrise className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform animate-pulse" />
            <span className="hidden sm:inline">Resumen Diario</span>
            <span className="sm:hidden text-[11px]">Resumen</span>
          </button>

          {/* Nexus & Salud Drawer Toggle Button */}
          <button
            onClick={() => {
              setIsNexusDrawerOpen(!isNexusDrawerOpen);
              if (soundEffectsOn) playTechBlip(620, 'sine', 0.05);
            }}
            className={`px-2.5 py-1 rounded-xl border text-xs font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer shrink-0 shadow-sm ${
              isNexusDrawerOpen
                ? 'bg-cyan-500/30 text-[#00f2ff] border-cyan-400'
                : 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 hover:from-cyan-500/30 hover:to-emerald-500/30 border-cyan-400/40 text-cyan-200'
            }`}
            title="Abrir / Ocultar Asistente Nexus-07 y Bio-Salud"
          >
            <Bot className="w-3.5 h-3.5 text-[#00f2ff]" />
            <span className="hidden sm:inline">Nexus & Salud</span>
            <Heart className="w-3 h-3 text-rose-400 fill-rose-500/30" />
          </button>

          {/* Web Push Alerts Modal Trigger */}
          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className="p-1.5 px-2 rounded-xl bg-[#0e1933] border border-[#23314d] hover:border-amber-400 text-amber-300 hover:text-amber-200 transition-colors cursor-pointer shrink-0 flex items-center space-x-1 text-xs font-mono"
              title="Configurar Alertas Web Push de Tareas y Hábitos"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline text-[11px]">Alertas</span>
            </button>
          )}

        </div>

        {/* Right: Fullscreen & Salir (Dejando solo Salir como solicitó el usuario) */}
        <div className="flex items-center space-x-2 shrink-0 z-30 ml-auto pl-1">
          {/* Native Fullscreen Toggle */}
          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 rounded-xl bg-[#0e1933] border border-[#23314d] hover:border-cyan-400 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla Completa Fija para Tablet'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Exit / Return to Standard View */}
          <button
            onClick={onExit}
            className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 hover:text-white text-xs font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer shrink-0 shadow-sm active:scale-95"
            title="Salir de DeskBuddy y volver al menú principal"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
            <span className="inline text-xs font-bold">Salir</span>
          </button>
        </div>
      </header>

      {/* Floating Ambient Sound Modal / Dropdown (Above ALL windows and panels) */}
      {isAmbientMenuOpen && (
        <>
          {/* Dimmed backdrop to prevent click-through and focus attention */}
          <div 
            className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
            onClick={() => setIsAmbientMenuOpen(false)}
          />

          {/* Floating Window Dialog on top of everything */}
          <div 
            ref={ambientMenuRef}
            className="fixed top-14 sm:top-16 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-24 md:right-36 w-84 max-w-[94vw] rounded-2xl bg-[#081226]/98 border-2 border-cyan-400/80 p-4 shadow-2xl shadow-cyan-950/90 backdrop-blur-2xl z-[90] font-mono animate-in fade-in zoom-in-95 duration-150 space-y-3.5"
          >
            {/* Header with Title and Close Button */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider block">Sonidos Ambientales</span>
                  <span className="text-[10px] text-slate-400">Atmósfera de concentración</span>
                </div>
              </div>
              <button
                onClick={() => setIsAmbientMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Cerrar selector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sound Options List */}
            <div className="space-y-1.5 max-h-70 overflow-y-auto pr-0.5">
              {AMBIENT_SOUND_OPTIONS.map((opt) => {
                const isSelected = ambientSoundType === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectAmbientSound(opt.id)}
                    className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-cyan-500/25 border-cyan-400 text-white shadow-lg shadow-cyan-500/15 ring-1 ring-cyan-400/40'
                        : 'bg-[#0c1833]/80 hover:bg-[#13234a] border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className="text-xl shrink-0">{opt.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold truncate text-white">{opt.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 font-bold border border-slate-700">
                            {opt.badge}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">{opt.description}</span>
                      </div>
                    </div>

                    <div className="shrink-0 pl-1.5">
                      {isSelected && ambientAudioOn ? (
                        <span className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                        </span>
                      ) : isSelected ? (
                        <Check className="w-4 h-4 text-cyan-400" />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Volume Slider & Play/Pause Button */}
            <div className="pt-2.5 border-t border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center space-x-1.5 font-bold text-slate-300">
                  <Volume1 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Volumen Master</span>
                </span>
                <span className="font-bold text-cyan-300">{Math.round((ambientVolume / 0.15) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.15"
                step="0.01"
                value={ambientVolume}
                onChange={(e) => handleChangeAmbientVolume(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
              />

              <button
                onClick={handleToggleAmbient}
                className={`w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  ambientAudioOn
                    ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 shadow-sm'
                    : 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-lg shadow-cyan-500/25 hover:brightness-110 active:scale-98'
                }`}
              >
                {ambientAudioOn ? (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>Pausar Sonido Ambiental</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>Reproducir ({selectedAmbientInfo.name})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* MAIN 2-PANEL RESPONSIVE 50/50 GRID (DESKTOP WORKSPACE)   */}
      {/* ======================================================== */}
      <main className="relative z-10 flex-1 p-2 sm:p-3 grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3 overflow-y-auto lg:overflow-hidden min-h-0">
        
        {/* ------------------------------------------------------ */}
        {/* PANEL 1 (LEFT): CALENDARIO & AGENDA (50% DESKTOP)       */}
        {/* ------------------------------------------------------ */}
        <section className="bg-[#0a1326]/90 border border-[#00f2ff]/30 rounded-2xl p-2.5 sm:p-3 flex flex-col min-h-0 h-full overflow-hidden shadow-xl shadow-[#000000]/40 backdrop-blur-xl">
          
          {/* Header with View Buttons */}
          <div className="flex items-center justify-between pb-2.5 border-b border-[#1c2b4d] shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-[#00f2ff]/10 border border-[#00f2ff]/30 flex items-center justify-center text-[#00f2ff]">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-black tracking-wider uppercase text-white font-mono flex items-center space-x-1.5">
                  <span>CALENDARIO & AGENDA</span>
                </h2>
                <p className="text-[10px] text-slate-400">
                  {agendaItems.length} compromisos programados
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {/* Calendar View Mode Switcher: Mes / Semana / Día */}
              <div className="flex items-center bg-[#070f21] p-0.5 rounded-lg border border-[#1b2b4d]">
                <button
                  type="button"
                  onClick={() => {
                    setCalendarViewMode('month');
                    if (soundEffectsOn) playTechBlip(500, 'sine', 0.03);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    calendarViewMode === 'month'
                      ? 'bg-[#00f2ff] text-[#00363a] shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Vista Mensual"
                >
                  Mes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCalendarViewMode('week');
                    if (soundEffectsOn) playTechBlip(500, 'sine', 0.03);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    calendarViewMode === 'week'
                      ? 'bg-[#00f2ff] text-[#00363a] shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Vista Semanal"
                >
                  Semana
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCalendarViewMode('day');
                    if (soundEffectsOn) playTechBlip(500, 'sine', 0.03);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    calendarViewMode === 'day'
                      ? 'bg-[#00f2ff] text-[#00363a] shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Vista Diaria"
                >
                  Día
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCalendarViewMode('cierre');
                    if (soundEffectsOn) playTechBlip(560, 'sine', 0.04);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                    calendarViewMode === 'cierre'
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black shadow-sm'
                      : 'text-amber-400 hover:text-white'
                  }`}
                  title="Resumen Total y Cierre Diario de Tareas"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Cierre</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCalendarDate(new Date());
                  setSelectedDateStr(todayStr);
                  if (soundEffectsOn) playTechBlip(540, 'sine', 0.05);
                }}
                className="px-2 py-1 rounded-lg bg-[#142344] hover:bg-[#1b2f5b] text-[10px] font-mono text-cyan-200 border border-[#273d6b] cursor-pointer transition-colors"
                title="Ir a Hoy"
              >
                Hoy
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenNewTaskModal) onOpenNewTaskModal();
                  else setIsQuickAddOpen(true);
                }}
                className="px-2 py-1 rounded-lg bg-[#00f2ff]/20 hover:bg-[#00f2ff]/30 text-[#00f2ff] text-[10px] font-mono font-bold border border-[#00f2ff]/40 flex items-center space-x-1 cursor-pointer transition-all"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
                <span>Cita</span>
              </button>
            </div>
          </div>

          {/* Calendar Container with Limited/Bounded Height (max-h-[300px]) */}
          <div className="py-2 shrink-0 max-h-[300px] min-h-[220px] overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/20 border-b border-[#1c2b4d]/80">
            {/* Calendar Navigation Header */}
            <div className="flex items-center justify-between px-2 pb-2">
              <button
                type="button"
                onClick={handleCalendarPrev}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                title="Anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono font-black tracking-wider text-cyan-200">
                {calendarTitleText}
              </span>
              <button
                type="button"
                onClick={handleCalendarNext}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                title="Siguiente"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* View 1: Month View */}
            {calendarViewMode === 'month' && (
              <>
                {/* Weekdays Row */}
                <div className="grid grid-cols-7 text-center font-mono text-[10px] text-slate-400 pb-1 font-semibold">
                  {DAY_NAMES_SHORT.map((day, idx) => (
                    <div key={idx} className="py-0.5">{day}</div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs">
                  {calendarDays.map((item, idx) => {
                    if (!item.isCurrentMonth) {
                      return <div key={idx} className="h-7 sm:h-8" />;
                    }
                    const isSelected = item.dateStr === selectedDateStr;
                    const isToday = item.dateStr === todayStr;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedDateStr(item.dateStr);
                          if (soundEffectsOn) playTechBlip(700, 'sine', 0.04);
                        }}
                        className={`h-7 sm:h-8 rounded-lg flex flex-col items-center justify-center relative transition-all cursor-pointer text-[11px] font-semibold ${
                          isSelected
                            ? 'bg-[#00f2ff] text-[#00363a] font-black shadow-md shadow-[#00f2ff]/40 scale-105 ring-1 ring-cyan-200'
                            : isToday
                            ? 'border border-[#00f2ff] text-cyan-200 bg-[#00f2ff]/10 font-bold'
                            : 'text-slate-300 hover:bg-[#142344] hover:text-white'
                        }`}
                      >
                        <span>{item.dayNum}</span>
                        {item.hasTasks && !isSelected && (
                          <span className="w-1 h-1 rounded-full bg-[#00f2ff] absolute bottom-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* View 2: Week View */}
            {calendarViewMode === 'week' && (
              <div className="grid grid-cols-7 gap-1 px-1 py-1 text-center font-mono">
                {currentWeekDays.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedDateStr(item.dateStr);
                      if (soundEffectsOn) playTechBlip(700, 'sine', 0.04);
                    }}
                    className={`p-2 rounded-xl flex flex-col items-center justify-between transition-all cursor-pointer min-h-[95px] border ${
                      item.isSelected
                        ? 'bg-[#00f2ff] text-[#00363a] font-black shadow-md shadow-[#00f2ff]/40 ring-1 ring-cyan-200'
                        : item.isToday
                        ? 'border-[#00f2ff] text-cyan-200 bg-[#00f2ff]/10 font-bold'
                        : 'border-[#1b2b4d] bg-[#0c1833]/80 text-slate-300 hover:border-cyan-400/50'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider">{item.dayName}</span>
                    <span className="text-base font-black my-0.5">{item.dayNum}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                      item.isSelected
                        ? 'bg-[#00363a] text-cyan-200'
                        : item.taskCount > 0
                        ? 'bg-cyan-500/20 text-[#00f2ff] border border-cyan-400/30'
                        : 'text-slate-500'
                    }`}>
                      {item.taskCount > 0 ? `${item.taskCount} t.` : '—'}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* View 3: Day View */}
            {calendarViewMode === 'day' && (
              <div className="p-3 rounded-xl bg-[#0c1833]/90 border border-[#1b2b4d] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10.5px] font-mono font-bold text-cyan-300 uppercase">
                      {selectedDateStr === todayStr ? '⭐ HOY' : 'DÍA SELECCIONADO'}
                    </span>
                    <h3 className="text-xs font-mono font-black text-white mt-0.5 uppercase">
                      {new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </h3>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-base font-black text-cyan-200">{agendaItems.length}</span>
                    <span className="text-[9.5px] text-slate-400 block">compromisos</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-1 text-center font-mono text-[10px]">
                  <div className="p-1.5 rounded-lg bg-[#081226] border border-[#1a2a4c]">
                    <span className="text-slate-400 block text-[9px]">MAÑANA</span>
                    <span className="text-cyan-200 font-bold">08:00 - 12:00</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#081226] border border-[#1a2a4c]">
                    <span className="text-slate-400 block text-[9px]">TARDE</span>
                    <span className="text-amber-300 font-bold">12:00 - 18:00</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#081226] border border-[#1a2a4c]">
                    <span className="text-slate-400 block text-[9px]">NOCHE</span>
                    <span className="text-emerald-300 font-bold">18:00 - 22:00</span>
                  </div>
                </div>
              </div>
            )}

            {/* View 4: Cierre Diario y Resumen (Solicitado por el usuario) */}
            {calendarViewMode === 'cierre' && (
              <div className="py-2 animate-in fade-in duration-300">
                <CalendarDailyClosureCard
                  tasks={tasks}
                  categories={categories}
                  todayYMD={todayStr}
                  onAssignTaskDate={(taskId, dateStr) => {
                    const taskToUpdate = tasks.find(t => t.id === taskId);
                    if (taskToUpdate && onUpdateTask) {
                      onUpdateTask({ ...taskToUpdate, assignedDate: dateStr, dueDate: dateStr });
                    }
                  }}
                  onQuickStatusChange={onToggleTask}
                  onOpenNewTaskModal={onOpenNewTaskModal}
                />
              </div>
            )}
          </div>

          {/* Agenda Section (Takes Remaining Height with Scrolling) */}
          <div className="flex-1 min-h-0 pt-2 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-1.5 px-0.5 text-[10px] font-mono text-slate-400 shrink-0 flex-wrap gap-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-cyan-300 uppercase">
                  AGENDA // {selectedDateStr === todayStr ? 'HOY' : selectedDateStr}
                </span>
                <span className="text-slate-500">({agendaItems.length})</span>
              </div>

              {/* Status filter: Todas | Pendientes | Hechas */}
              <div className="flex items-center space-x-1 p-0.5 rounded-lg border border-[#1b2b4d] bg-[#070f21]">
                <button
                  type="button"
                  onClick={() => setAgendaStatusFilter('todas')}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${
                    agendaStatusFilter === 'todas'
                      ? 'bg-[#00f2ff] text-[#00363a]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todas ({agendaItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAgendaStatusFilter('pendientes')}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${
                    agendaStatusFilter === 'pendientes'
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-amber-300'
                  }`}
                >
                  ⏳ Pendientes ({agendaItems.filter(t => t.status !== 'completada' && t.status !== 'cancelada').length})
                </button>
                <button
                  type="button"
                  onClick={() => setAgendaStatusFilter('completadas')}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${
                    agendaStatusFilter === 'completadas'
                      ? 'bg-orange-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-orange-400'
                  }`}
                >
                  ✨ Hechas ({agendaItems.filter(t => t.status === 'completada').length})
                </button>
              </div>

              {/* Action buttons: Batch Rollover & J Laboral filter toggle */}
              <div className="flex items-center space-x-1.5 flex-wrap">
                {/* Batch rollover button for uncompleted work tasks */}
                {pendingLaboralTasksForDate.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBatchRolloverPendingLaboral}
                    className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold flex items-center space-x-1 transition-all cursor-pointer border bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 shadow-sm active:scale-95"
                    title={`Rodar ${pendingLaboralTasksForDate.length} tarea(s) laboral(es) pendiente(s) al ${addDaysToDateStr(selectedDateStr, 1)}`}
                  >
                    <RotateCcw className="w-2.5 h-2.5 text-amber-400 stroke-[2.5]" />
                    <span>Rodar {pendingLaboralTasksForDate.length} laborales a mañana</span>
                    <span className="font-black text-amber-300">&gt;</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setAgendaLaboralOnly(!agendaLaboralOnly);
                    if (soundEffectsOn) playTechBlip(550, 'sine', 0.04);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold flex items-center space-x-1 transition-all cursor-pointer border ${
                    agendaLaboralOnly
                      ? 'bg-cyan-500/25 text-[#00f2ff] border-cyan-400 shadow-[0_0_8px_#00f2ff40]'
                      : 'bg-[#0e1a35] text-slate-400 border-slate-700 hover:text-cyan-300'
                  }`}
                  title="Filtrar solo compromisos laborales [J]"
                >
                  <span className="w-3.5 h-3.5 rounded bg-[#00f2ff]/20 text-[#00f2ff] flex items-center justify-center font-black text-[9px] border border-cyan-400/40">
                    J
                  </span>
                  <span>{agendaItems.filter(isItemLaboral).length} Laborales</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-cyan-500/20 min-h-0">
              {displayAgendaItems.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 italic">
                  {agendaLaboralOnly 
                    ? 'No hay compromisos marcados con [J] Laboral para este día.' 
                    : 'No hay compromisos agendados para este día.'}
                </div>
              ) : (
                displayAgendaItems.map((item, idx) => {
                  const isLaboral = isItemLaboral(item);
                  const colors = [
                    { border: 'border-l-amber-400', tag: 'bg-amber-400/20 text-amber-300 border-amber-400/30', label: 'REUNIÓN' },
                    { border: 'border-l-[#00f2ff]', tag: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30', label: 'ENFOQUE' },
                    { border: 'border-l-emerald-400', tag: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30', label: 'PERSONAL' },
                    { border: 'border-l-teal-400', tag: 'bg-teal-400/20 text-teal-300 border-teal-400/30', label: 'RECORDATORIO' }
                  ];
                  const c = colors[idx % colors.length];
                  const isCompleted = item.status === 'completada';

                  return (
                    <div
                      key={item.id}
                      onClick={() => onEditTask && onEditTask(item)}
                      className={`p-2 rounded-xl transition-all flex items-center justify-between gap-2 border cursor-pointer group ${
                        isCompleted
                          ? 'bg-gradient-to-r from-orange-950/30 via-[#0c1833] to-[#0c1833] border-orange-500/60 ring-1 ring-orange-500/40 shadow-[0_0_16px_rgba(249,115,22,0.35)] border-l-4 border-l-orange-500 hover:border-orange-400'
                          : isLaboral
                          ? 'bg-gradient-to-r from-[#0d1e3d] via-[#09152b] to-[#0c1833] border-cyan-400/60 shadow-md shadow-cyan-950/40 border-l-4 border-l-[#00f2ff] hover:ring-1 hover:ring-cyan-400/40'
                          : `bg-[#0c1833]/90 border-[#1b2b4d] border-l-4 ${c.border} hover:border-cyan-400/50 hover:ring-1 hover:ring-cyan-400/40`
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          {/* Completed orange indicator badge */}
                          {isCompleted && (
                            <span className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-[0_0_6px_rgba(249,115,22,0.35)] flex items-center space-x-1 shrink-0 animate-in fade-in">
                              <span>✓ Terminada</span>
                            </span>
                          )}

                          {/* Selectable J Laboral Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleLaboral(item, e);
                            }}
                            title={isLaboral ? "Compromiso Laboral activo [J] - Clic para alternar" : "Marcar como compromiso Laboral [J] (Trabajo / Jornada)"}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black transition-all cursor-pointer flex items-center space-x-1 shrink-0 border ${
                              isLaboral
                                ? 'bg-[#00f2ff] text-[#00363a] border-cyan-200 shadow-[0_0_8px_#00f2ff80] scale-105'
                                : 'bg-[#081226] text-slate-400 border-slate-700/80 hover:border-cyan-400 hover:text-cyan-300'
                            }`}
                          >
                            <span>J</span>
                            {isLaboral && <span className="text-[8px] font-black uppercase tracking-wider">LABORAL</span>}
                          </button>

                          {/* Orange badge if coming from yesterday / rolled over */}
                          {((item.rolloverCount && item.rolloverCount > 0) || item.postponedFromDate || item.isRollover) && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1 shrink-0 animate-in fade-in"
                              title={`Tarea pospuesta que viene de ayer (${item.postponedFromDate || 'día anterior'}) • Rodada ${item.rolloverCount || 1} ${item.rolloverCount === 1 ? 'vez' : 'veces'}`}
                            >
                              <RotateCcw className="w-2.5 h-2.5 text-amber-400 stroke-[2.5]" />
                              <span>Viene de ayer</span>
                            </span>
                          )}

                          <h4 className={`text-xs font-bold truncate transition-colors ${
                            isCompleted 
                              ? 'text-slate-100 line-through decoration-orange-400/90 decoration-2 group-hover:text-orange-300' 
                              : 'text-white group-hover:text-cyan-300'
                          }`}>
                            {item.title}
                          </h4>
                        </div>
                        <p className={`text-[10px] flex items-center space-x-1.5 mt-0.5 ${
                          isCompleted ? 'text-slate-300 font-medium' : 'text-slate-400'
                        }`}>
                          <Clock className="w-2.5 h-2.5 text-[#00f2ff]" />
                          <span>{item.timeSlot || 'Durante el día'}</span>
                          <span>•</span>
                          <span className="truncate">{item.description || item.finalGoal || 'Prioritario'}</span>
                        </p>
                        <div className="mt-1 flex items-center space-x-1.5 flex-wrap gap-1">
                          <TaskLiveTimer task={item} compact />
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center space-x-1.5">
                        {/* Quick Copy Button */}
                        <button
                          type="button"
                          onClick={(e) => handleCopyTaskInfo(item, e)}
                          className="p-1 rounded-md bg-[#081226] hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/80 transition-colors cursor-pointer"
                          title="Copiar información de la tarea"
                        >
                          {copiedTaskId === item.id ? (
                            <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>

                        {/* Edit Button */}
                        {onEditTask && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditTask(item);
                            }}
                            className="p-1 sm:px-2 sm:py-0.5 rounded-md bg-[#081226] hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700/80 hover:border-cyan-400/50 flex items-center space-x-1 text-[10px] font-mono transition-colors cursor-pointer"
                            title="Editar tarea y ver información completa"
                          >
                            <Edit3 className="w-3 h-3 text-cyan-400" />
                            <span className="hidden sm:inline">Editar</span>
                          </button>
                        )}

                        {/* Rollover to Next Day ">" Button */}
                        <button
                          type="button"
                          onClick={(e) => handleRolloverTaskToNextDay(item, e)}
                          className="px-2 py-0.5 rounded-md bg-[#081226] hover:bg-amber-500/25 text-amber-400 hover:text-amber-300 border border-amber-500/40 hover:border-amber-400 flex items-center space-x-0.5 text-[10px] font-mono font-bold transition-all cursor-pointer shadow-sm active:scale-95 group"
                          title={`Rodar tarea para el día siguiente (pasar al ${addDaysToDateStr(item.assignedDate || selectedDateStr, 1)})`}
                        >
                          <span className="font-extrabold text-amber-400 group-hover:translate-x-0.5 transition-transform">&gt;</span>
                          <span className="hidden sm:inline text-[8.5px] text-amber-300/90">+1d</span>
                        </button>

                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                          isLaboral 
                            ? 'bg-cyan-500/20 text-[#00f2ff] border-cyan-400/50' 
                            : item.priority === 'urgente' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : c.tag
                        }`}>
                          {item.priority === 'urgente' ? 'URGENTE' : isLaboral ? 'LABORAL' : c.label}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCheckTask(item);
                          }}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                            item.status === 'completada'
                              ? 'bg-orange-500 border-orange-400 text-white shadow-[0_0_10px_rgba(249,115,22,0.6)]'
                              : 'border-slate-600 hover:border-cyan-400 text-transparent hover:text-cyan-400'
                          }`}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </section>

        {/* ------------------------------------------------------ */}
        {/* PANEL 2 (RIGHT): TAREAS DEL DÍA & HÁBITOS (50% DESKTOP) */}
        {/* ------------------------------------------------------ */}
        <section className="bg-[#0a1326]/90 border border-[#00f2ff]/30 rounded-2xl p-2.5 sm:p-3 flex flex-col min-h-0 h-full overflow-hidden shadow-xl shadow-[#000000]/40 backdrop-blur-xl">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#1c2b4d]">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-black tracking-wider uppercase text-white font-mono flex items-center space-x-1.5">
                  <span>TAREAS, HÁBITOS & SALUD</span>
                </h2>
                <p className="text-[10px] text-slate-400">
                  {pendingTasksCount} pendientes • {completedHabitsToday}/{totalHabitsCount} hábitos • {waterGlasses}/8 vasos • {caloriesConsumed} kcal
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {onOpenNewHabitModal && (
                <button
                  onClick={() => {
                    if (soundEffectsOn) playTechBlip(600, 'sine', 0.05);
                    onOpenNewHabitModal();
                  }}
                  className="px-2 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-bold flex items-center space-x-1 cursor-pointer transition-all active:scale-95"
                  title="Crear nuevo hábito"
                >
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span className="hidden sm:inline">+ Hábito</span>
                </button>
              )}
              <button
                onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
                className="px-2.5 py-1 rounded-xl bg-[#00f2ff] hover:bg-[#00dbe7] text-[#00363a] text-xs font-mono font-bold shadow-md shadow-[#00f2ff]/20 flex items-center space-x-1 cursor-pointer transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Añadir</span>
              </button>
            </div>
          </div>

          {/* Quick Add Form Drawer */}
          {isQuickAddOpen && (
            <div className="my-2 p-2.5 rounded-xl bg-[#0f1d3d] border border-cyan-400/40 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setQuickAddType('task')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-colors ${
                      quickAddType === 'task'
                        ? 'bg-cyan-500/30 text-[#00f2ff] border border-cyan-400'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    + Tarea
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickAddType('habit')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-colors ${
                      quickAddType === 'habit'
                        ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    + Hábito
                  </button>
                </div>
                <button onClick={() => setIsQuickAddOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (quickAddType === 'habit') handleQuickCreateHabit();
                    else handleQuickCreateTask();
                  }
                }}
                placeholder={quickAddType === 'habit' ? 'Ej: Meditar 15 min, Tomar 2L de agua...' : 'Ej: Revisar balance trimestral con Liz...'}
                className="w-full px-2.5 py-1.5 bg-[#080e1c] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                autoFocus
              />

              <div className="flex items-center justify-between gap-1.5">
                {quickAddType === 'task' ? (
                  <select
                    value={quickPriority}
                    onChange={(e) => setQuickPriority(e.target.value as Priority)}
                    className="px-2 py-1 bg-[#080e1c] border border-slate-700 rounded-lg text-[10px] font-mono text-slate-200"
                  >
                    <option value="alta">Prioridad: ALTA (+50 XP)</option>
                    <option value="media">Prioridad: MEDIA (+35 XP)</option>
                    <option value="baja">Prioridad: BAJA (+20 XP)</option>
                    <option value="urgente">Prioridad: URGENTE (+60 XP)</option>
                  </select>
                ) : (
                  <select
                    value={quickHabitFrequency}
                    onChange={(e) => setQuickHabitFrequency(e.target.value as any)}
                    className="px-2 py-1 bg-[#080e1c] border border-slate-700 rounded-lg text-[10px] font-mono text-slate-200"
                  >
                    <option value="daily">Frecuencia: Todos los días (+25 XP)</option>
                    <option value="weekdays">Días laborales (Lun - Vie)</option>
                    <option value="weekends">Fines de semana</option>
                  </select>
                )}

                <button
                  onClick={() => {
                    if (quickAddType === 'habit') handleQuickCreateHabit();
                    else handleQuickCreateTask();
                  }}
                  className="px-3 py-1 bg-[#00f2ff] text-[#00363a] font-bold text-xs rounded-lg hover:brightness-110 cursor-pointer font-mono"
                >
                  Guardar
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SECCIÓN FIJA: SALUD & ACTIVIDAD FÍSICA (MOTIVACIONAL)    */}
          {/* ======================================================== */}
          <div className="my-1.5 rounded-xl bg-gradient-to-r from-[#09152b] via-[#0d1e3d] to-[#081329] border border-cyan-500/35 p-2.5 shadow-md shadow-cyan-950/20 space-y-2 shrink-0">
            <div className="flex items-center justify-between border-b border-[#18294d] pb-1.5 flex-wrap gap-1.5">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded-md bg-rose-500/20 border border-rose-400/50 flex items-center justify-center text-rose-400 shadow-[0_0_8px_#f43f5e40]">
                  <Heart className="w-3.5 h-3.5 fill-rose-500/30 animate-pulse" />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono font-black tracking-wider uppercase text-cyan-200">
                    SALUD & ALIMENTACIÓN
                  </span>
                  {selectedHealthDate === todayStr ? (
                    <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[8.5px] font-mono font-bold border border-emerald-500/40">
                      <Activity className="w-2.5 h-2.5 mr-1 animate-pulse" />
                      HOY
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded-full bg-amber-500/25 text-amber-300 text-[8.5px] font-mono font-bold border border-amber-500/40 animate-pulse">
                      📅 {selectedHealthDate === yesterdayDateStr ? 'AYER' : selectedHealthDate}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                {/* Selector de Fecha para registrar comidas/salud (Hoy / Ayer / Otra fecha) */}
                <div className="flex items-center bg-[#060e1d] p-0.5 rounded-lg border border-[#1d2d4d] text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedHealthDate(todayStr);
                      if (soundEffectsOn) playTechBlip(500, 'sine', 0.03);
                    }}
                    className={`px-2 py-0.5 rounded transition-all cursor-pointer font-bold ${
                      selectedHealthDate === todayStr
                        ? 'bg-cyan-500 text-slate-950 shadow-sm font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Ver y registrar datos de hoy"
                  >
                    Hoy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedHealthDate(yesterdayDateStr);
                      if (soundEffectsOn) playTechBlip(520, 'sine', 0.03);
                    }}
                    className={`px-2 py-0.5 rounded transition-all cursor-pointer font-bold ${
                      selectedHealthDate === yesterdayDateStr
                        ? 'bg-amber-400 text-slate-950 shadow-sm font-black'
                        : 'text-slate-400 hover:text-amber-300'
                    }`}
                    title="Llenar o revisar alimentación del día de ayer"
                  >
                    Ayer
                  </button>
                  <label className="relative flex items-center px-1.5 py-0.5 rounded cursor-pointer hover:bg-slate-800 text-slate-400 hover:text-white" title="Elegir otra fecha para completar información">
                    <input
                      type="date"
                      value={selectedHealthDate}
                      max={todayStr}
                      onChange={(e) => {
                        if (e.target.value) {
                          setSelectedHealthDate(e.target.value);
                          if (soundEffectsOn) playTechBlip(540, 'sine', 0.03);
                        }
                      }}
                      className="w-4 h-4 opacity-0 absolute inset-0 cursor-pointer"
                    />
                    <Calendar className="w-3 h-3 text-cyan-400" />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsQuickCalorieOpen(!isQuickCalorieOpen);
                    if (soundEffectsOn) playTechBlip(600, 'sine', 0.04);
                  }}
                  className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold flex items-center space-x-1 cursor-pointer transition-all ${
                    isQuickCalorieOpen
                      ? 'bg-amber-400 text-slate-950 border-amber-300'
                      : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                  }`}
                  title="Registrar calorías consumidas"
                >
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>+ Kcal</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!isQuickActivityOpen) {
                      setQuickActivitySteps(todayCalorieLog?.steps ? String(todayCalorieLog.steps) : '');
                      setQuickActivityCalories(todayCalorieLog?.exerciseCaloriesBurned ? String(todayCalorieLog.exerciseCaloriesBurned) : '');
                    }
                    setIsQuickActivityOpen(!isQuickActivityOpen);
                    setIsQuickCalorieOpen(false);
                    if (soundEffectsOn) playTechBlip(620, 'sine', 0.04);
                  }}
                  className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold flex items-center space-x-1 cursor-pointer transition-all ${
                    isQuickActivityOpen
                      ? 'bg-emerald-400 text-slate-950 border-emerald-300'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                  }`}
                  title="Anotar número de pasos y calorías de ejercicio"
                >
                  <Dumbbell className="w-3 h-3 text-emerald-400" />
                  <span>+ Actividad & Pasos</span>
                </button>

                {onNavigateToHealth && (
                  <button
                    type="button"
                    onClick={() => {
                      if (soundEffectsOn) playTechBlip(500, 'sine', 0.05);
                      onNavigateToHealth();
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/20 transition-colors cursor-pointer"
                    title="Abrir módulo completo de salud"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Aviso informativo cuando se está viendo o llenando un día diferente a hoy */}
            {selectedHealthDate !== todayStr && (
              <div className="p-1.5 px-2.5 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-between text-[10.5px] font-mono text-amber-200 animate-in fade-in">
                <span className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    Completando información de: <strong>{selectedHealthDate === yesterdayDateStr ? `Ayer (${yesterdayDateStr})` : selectedHealthDate}</strong> (Comidas, agua y peso guardarán para este día)
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedHealthDate(todayStr)}
                  className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 cursor-pointer transition-colors shadow-sm ml-2 text-[10px]"
                >
                  Volver a Hoy
                </button>
              </div>
            )}

            {/* Quick Activity Logger Drawer (Pasos + Ejercicio con Conversión Interna y Déficit) */}
            {isQuickActivityOpen && (() => {
              const parsedSteps = Math.max(0, parseInt(quickActivitySteps, 10) || 0);
              const stepBurnKcal = calculateStepCalories(parsedSteps, latestWeight);
              const parsedExerciseKcal = Math.max(0, parseInt(quickActivityCalories, 10) || 0);
              const combinedActivityKcal = stepBurnKcal + parsedExerciseKcal;
              const totalEstExpenditure = bmr + combinedActivityKcal;
              const estDeficit = totalEstExpenditure - caloriesConsumed;

              return (
                <div className="p-3 rounded-xl bg-gradient-to-b from-[#061226] via-[#08152e] to-[#040c1a] border border-emerald-400/60 space-y-2.5 animate-in fade-in duration-150 font-mono shadow-2xl">
                  {/* Header */}
                  <div className="flex items-center justify-between text-[11px] text-emerald-300 font-bold uppercase border-b border-[#14294a] pb-1.5">
                    <span className="flex items-center space-x-1.5">
                      <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Registrar Pasos y Calorías de Ejercicio</span>
                    </span>
                    <button 
                      onClick={() => setIsQuickActivityOpen(false)} 
                      className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 2 Inputs: Pasos y Ejercicio */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    
                    {/* Campo 1: Número de Pasos */}
                    <div className="p-2 rounded-lg bg-[#071328] border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-300 font-bold flex items-center gap-1">
                          <span>🚶 Pasos Diarios</span>
                        </span>
                        <span className="text-emerald-300 font-bold">
                          ~{stepBurnKcal} kcal
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <input
                          type="number"
                          value={quickActivitySteps}
                          onChange={(e) => setQuickActivitySteps(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveActivityValues();
                          }}
                          placeholder="Ej: 8000 pasos"
                          className="flex-1 px-2 py-1 bg-[#040a16] border border-slate-700 rounded-lg text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                        />
                        {quickActivitySteps && (
                          <button
                            type="button"
                            onClick={() => setQuickActivitySteps('')}
                            className="text-[9px] text-slate-500 hover:text-rose-300 px-1 cursor-pointer"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      {/* Atajos de pasos */}
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {[
                          { label: '+1k', val: 1000 },
                          { label: '+3k', val: 3000 },
                          { label: '+5k', val: 5000 },
                          { label: '8k', exact: 8000 },
                          { label: '10k', exact: 10000 },
                        ].map((btn, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              if (btn.exact !== undefined) {
                                setQuickActivitySteps(String(btn.exact));
                              } else {
                                const current = parseInt(quickActivitySteps, 10) || 0;
                                setQuickActivitySteps(String(current + btn.val));
                              }
                              if (soundEffectsOn) playTechBlip(640, 'sine', 0.03);
                            }}
                            className="px-1.5 py-0.5 rounded bg-[#0c1c38] hover:bg-[#122850] text-emerald-200 border border-emerald-500/20 text-[9px] font-bold cursor-pointer transition-colors"
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>

                      <p className="text-[8.5px] text-slate-400 leading-tight">
                        Transformación automática: ~0.043 kcal/paso según tus {latestWeight} kg.
                      </p>
                    </div>

                    {/* Campo 2: Calorías por Ejercicio */}
                    <div className="p-2 rounded-lg bg-[#071328] border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-300 font-bold flex items-center gap-1">
                          <span>🏋️ Calorías Ejercicio</span>
                        </span>
                        <span className="text-cyan-300 font-bold">
                          +{parsedExerciseKcal} kcal
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <input
                          type="number"
                          value={quickActivityCalories}
                          onChange={(e) => setQuickActivityCalories(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveActivityValues();
                          }}
                          placeholder="Ej: 300 kcal (gym/cardio)"
                          className="flex-1 px-2 py-1 bg-[#040a16] border border-slate-700 rounded-lg text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                        />
                        {quickActivityCalories && (
                          <button
                            type="button"
                            onClick={() => setQuickActivityCalories('')}
                            className="text-[9px] text-slate-500 hover:text-rose-300 px-1 cursor-pointer"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      {/* Atajos de calorías */}
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {[
                          { label: '+150 Caminata', val: 150 },
                          { label: '+250 Pesas/Gym', val: 250 },
                          { label: '+400 Cardio', val: 400 },
                        ].map((btn, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              const current = parseInt(quickActivityCalories, 10) || 0;
                              setQuickActivityCalories(String(current + btn.val));
                              if (soundEffectsOn) playTechBlip(680, 'sine', 0.03);
                            }}
                            className="px-1.5 py-0.5 rounded bg-[#0c1c38] hover:bg-[#122850] text-cyan-200 border border-cyan-500/20 text-[9px] font-bold cursor-pointer transition-colors"
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>

                      <p className="text-[8.5px] text-slate-400 leading-tight">
                        Quema de entrenamientos de pesas, cardio, deportes, etc.
                      </p>
                    </div>

                  </div>

                  {/* Resumen de Quema Total e Impacto en el Déficit */}
                  <div className="p-2 rounded-lg bg-[#040a16] border border-[#162744] text-[9.5px] space-y-1">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Suma Actividad Física:</span>
                      <span className="font-bold text-emerald-300">
                        {stepBurnKcal} kcal (pasos) + {parsedExerciseKcal} kcal (ejercicio) = <strong>+{combinedActivityKcal} kcal quemadas</strong>
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#121f38] pt-1 text-slate-400">
                      <span>Gasto Total Día (BMR {bmr} kcal + Actividad):</span>
                      <span className="font-bold text-cyan-300">{totalEstExpenditure} kcal</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#121f38] pt-1 font-bold">
                      <span className="text-slate-300">Déficit Resultante (vs Ingesta {caloriesConsumed} kcal):</span>
                      <span className={estDeficit >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                        {estDeficit >= 0 ? `🔥 Déficit de -${estDeficit} kcal` : `⚡ Superávit de +${Math.abs(estDeficit)} kcal`}
                      </span>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex items-center justify-end space-x-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setIsQuickActivityOpen(false)}
                      className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveActivityValues()}
                      className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 font-bold text-xs cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center space-x-1.5"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Guardar Actividad y Sumar al Déficit</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Quick Calorie Logger Drawer */}
            {isQuickCalorieOpen && (
              <div className="p-2 rounded-lg bg-[#071124] border border-amber-400/40 space-y-1.5 animate-in fade-in duration-150 font-mono">
                <div className="flex items-center justify-between text-[10px] text-amber-300 font-bold uppercase">
                  <span className="flex items-center space-x-1">
                    <Flame className="w-3 h-3" />
                    <span>Sumar Ingesta Rápida</span>
                  </span>
                  <button onClick={() => setIsQuickCalorieOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center space-x-1">
                  {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map(mealKey => (
                    <button
                      key={mealKey}
                      type="button"
                      onClick={() => setQuickCalorieMeal(mealKey)}
                      className={`flex-1 py-1 rounded text-[9.5px] font-mono uppercase transition-colors ${
                        quickCalorieMeal === mealKey
                          ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {mealKey === 'breakfast' ? '🌅 Des' : mealKey === 'lunch' ? '☀️ Alm' : mealKey === 'dinner' ? '🌙 Cen' : '🍎 Snk'}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-1 pt-0.5">
                  {[
                    { label: '+150 kcal', val: 150 },
                    { label: '+300 kcal', val: 300 },
                    { label: '+500 kcal', val: 500 }
                  ].map(p => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => handleSaveQuickCalories(p.val)}
                      className="flex-1 py-1 rounded bg-[#0f2142] hover:bg-[#153163] text-cyan-200 border border-cyan-500/30 text-[10px] font-bold transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-1.5 pt-0.5">
                  <input
                    type="number"
                    value={quickCalorieAmount}
                    onChange={(e) => setQuickCalorieAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveQuickCalories();
                    }}
                    placeholder="Kcal exactas..."
                    className="flex-1 px-2 py-1 bg-[#040914] border border-slate-700 rounded-lg text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={() => handleSaveQuickCalories()}
                    className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono font-bold text-xs rounded-lg cursor-pointer transition-all"
                  >
                    Sumar
                  </button>
                </div>
              </div>
            )}

            {/* Main 3 Metrics Rows */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
              
              {/* 1. VASOS DE AGUA */}
              <div className="p-2 rounded-lg bg-[#071226] border border-[#1b2b4d] flex flex-col justify-between">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center space-x-1.5">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/30" />
                    <span className="text-[10px] font-mono uppercase text-slate-300 font-bold">Agua</span>
                  </div>
                  <span className="text-[11px] font-mono font-black text-cyan-200">
                    {waterGlasses} <span className="text-[9px] font-normal text-slate-400">/ 8</span>
                  </span>
                </div>

                {/* Visual Glass Indicator Dots */}
                <div className="flex items-center justify-between gap-1 py-1">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-2 rounded-sm transition-all ${
                        i < waterGlasses
                          ? 'bg-[#00f2ff] shadow-[0_0_6px_#00f2ff80]'
                          : 'bg-slate-800 border border-slate-700'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#132344]">
                  <span className="text-[9px] font-mono text-slate-400">
                    {(waterGlasses * 0.25).toFixed(2)}L
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleUpdateWaterGlasses(-1)}
                      className="w-5 h-5 rounded bg-[#101f3b] hover:bg-[#172d54] text-slate-300 hover:text-white border border-[#223a66] flex items-center justify-center text-[10px] font-bold cursor-pointer transition-colors"
                      title="Restar 1 vaso"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateWaterGlasses(1)}
                      className="w-5 h-5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 flex items-center justify-center text-[10px] font-bold cursor-pointer transition-colors"
                      title="Sumar 1 vaso"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. CALORÍAS & COMIDA */}
              <div className="p-2 rounded-lg bg-[#071226] border border-[#1b2b4d] flex flex-col justify-between">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center space-x-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
                    <span className="text-[10px] font-mono uppercase text-slate-300 font-bold">Comida & Kcal</span>
                  </div>
                  <span className="text-[11px] font-mono font-black text-amber-300">
                    {caloriesConsumed} <span className="text-[9px] font-normal text-slate-400">/ {targetCalories}</span>
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 rounded-full bg-[#111f38] overflow-hidden border border-[#1d2d4d] my-1">
                  <div
                    className={`h-full transition-all duration-500 ${
                      calorieProgressPercent > 105
                        ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]'
                        : 'bg-gradient-to-r from-amber-400 to-[#38ef7d] shadow-[0_0_6px_#f59e0b]'
                    }`}
                    style={{ width: `${Math.min(100, calorieProgressPercent)}%` }}
                  />
                </div>

                {/* Meal breakdown mini chips (Click to edit exact calories) */}
                <div className="grid grid-cols-4 gap-0.5 pt-0.5 text-center font-mono text-[8.5px]">
                  {[
                    { key: 'breakfast' as const, label: 'Desayuno', short: 'Des', val: todayCalorieLog?.breakfast?.totalCalories || 0 },
                    { key: 'lunch' as const, label: 'Almuerzo', short: 'Alm', val: todayCalorieLog?.lunch?.totalCalories || 0 },
                    { key: 'dinner' as const, label: 'Cena', short: 'Cen', val: todayCalorieLog?.dinner?.totalCalories || 0 },
                    { key: 'snacks' as const, label: 'Snacks', short: 'Snk', val: todayCalorieLog?.snacks?.totalCalories || 0 }
                  ].map(m => {
                    const isSelected = editingMealKey === m.key;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => handleOpenMealEdit(m.key)}
                        className={`py-0.5 rounded border text-center transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-md scale-105 ring-1 ring-amber-300'
                            : 'bg-[#0d1c38] hover:bg-[#142952] border-[#1e335a] text-slate-300 hover:text-white'
                        }`}
                        title={`Editar ${m.label}`}
                      >
                        <span className={`block text-[7px] uppercase leading-tight ${isSelected ? 'text-slate-900 font-black' : 'text-slate-400'}`}>
                          {m.short}
                        </span>
                        <span className={`font-bold leading-tight ${isSelected ? 'text-slate-950 font-black' : 'text-amber-200'}`}>
                          {m.val}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. ACTIVIDAD FÍSICA & EJERCICIO */}
              <div className="p-2 rounded-lg bg-[#071226] border border-[#1b2b4d] flex flex-col justify-between">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center space-x-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-mono uppercase text-slate-300 font-bold">Actividad Física</span>
                  </div>
                  <span className="text-[11px] font-mono font-black text-emerald-300">
                    {exerciseCaloriesBurned} <span className="text-[9px] font-normal text-slate-400">kcal</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-[9.5px] font-mono text-slate-400 py-1">
                  <span>Pasos diarios:</span>
                  <span className="font-bold text-slate-200">{dailySteps.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#132344]">
                  <span className="text-[9px] font-mono text-emerald-400 font-bold flex items-center space-x-1">
                    <Activity className="w-2.5 h-2.5" />
                    <span>{exerciseCaloriesBurned > 200 ? '🔥 Meta activa' : '⚡ En marcha'}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleUpdateActivity(100, 1000)}
                    className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 text-[9px] font-mono font-bold cursor-pointer transition-colors"
                    title="Sumar +100 kcal y +1000 pasos de actividad"
                  >
                    +100 kcal
                  </button>
                </div>
              </div>

            </div>

            {/* ======================================================== */}
            {/* BIO-METRÍA EN VIVO: DÉFICIT / SUPERÁVIT & PESO (7500 KCAL = 1 KG) */}
            {/* ======================================================== */}
            {(() => {
              const basalKcal = bmr;
              const diffVsBasal = caloriesConsumed - basalKcal;
              const isDeficit = diffVsBasal <= 0;
              const absDiff = Math.abs(diffVsBasal);
              const weightDeltaKg = absDiff / 7500;
              const weightDeltaGrams = Math.round(weightDeltaKg * 1000);
              const weeklyProjectionKg = (weightDeltaKg * 7).toFixed(2);

              return (
                <div className="p-2 sm:p-2.5 rounded-xl bg-[#060e1e] border border-cyan-500/30 space-y-1.5 font-mono text-[10px]">
                  {/* Fila 1: 3 Métricas compactas y perfectamente alineadas */}
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="px-2 py-1.5 rounded-lg bg-[#0a1529]/90 border border-slate-800 flex flex-col justify-center">
                      <span className="text-[8.5px] uppercase tracking-wider text-slate-400">Calorías Hoy</span>
                      <div className="flex items-baseline justify-center space-x-1 mt-0.5">
                        <span className="text-xs sm:text-sm font-black text-amber-300">
                          {caloriesConsumed.toLocaleString()}
                        </span>
                        <span className="text-[8.5px] text-slate-400">kcal</span>
                      </div>
                    </div>

                    <div className="px-2 py-1.5 rounded-lg bg-[#0a1529]/90 border border-slate-800 flex flex-col justify-center">
                      <span className="text-[8.5px] uppercase tracking-wider text-slate-400">Meta Basal</span>
                      <div className="flex items-baseline justify-center space-x-1 mt-0.5">
                        <span className="text-xs sm:text-sm font-black text-cyan-300">
                          {basalKcal.toLocaleString()}
                        </span>
                        <span className="text-[8.5px] text-slate-400">kcal</span>
                      </div>
                    </div>

                    <div className={`px-2 py-1.5 rounded-lg border flex flex-col justify-center ${
                      isDeficit
                        ? 'bg-emerald-950/40 border-emerald-500/40'
                        : 'bg-amber-950/40 border-amber-500/40'
                    }`}>
                      <span className={`text-[8.5px] uppercase tracking-wider font-bold ${
                        isDeficit ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {isDeficit ? '🔥 Déficit' : '⚡ Superávit'}
                      </span>
                      <div className="flex items-baseline justify-center space-x-1 mt-0.5">
                        <span className={`text-xs sm:text-sm font-black ${
                          isDeficit ? 'text-emerald-300' : 'text-amber-300'
                        }`}>
                          {isDeficit ? `-${absDiff}` : `+${absDiff}`}
                        </span>
                        <span className={`text-[8.5px] ${isDeficit ? 'text-emerald-400/80' : 'text-amber-400/80'}`}>kcal</span>
                      </div>
                    </div>
                  </div>

                  {/* Fila 2: Conversión a peso ultra compacta en una sola línea */}
                  <div className="flex items-center justify-between flex-wrap gap-x-2 gap-y-1 px-1 pt-1 border-t border-[#132344] text-[9.5px]">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-slate-400">
                        {isDeficit ? 'Pérdida est.:' : 'Ganancia est.:'}
                      </span>
                      <span className={`font-bold ${isDeficit ? 'text-emerald-300' : 'text-amber-300'}`}>
                        {isDeficit ? '-' : '+'}{weightDeltaKg.toFixed(3)} kg ({isDeficit ? '-' : '+'}{weightDeltaGrams}g)
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 text-slate-400">
                      <span>Proy:</span>
                      <span className={`font-bold ${isDeficit ? 'text-emerald-300' : 'text-amber-300'}`}>
                        {isDeficit ? '-' : '+'}{weeklyProjectionKg} kg/sem
                      </span>
                      <span className="hidden sm:inline text-[8px] text-slate-500">
                        (7.5k kcal = 1 kg)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ======================================================== */}
            {/* EDITOR DIRECTO DE CALORÍAS DE LA COMIDA SELECCIONADA     */}
            {/* ======================================================== */}
            {editingMealKey && (
              <div className="p-3 rounded-xl bg-gradient-to-b from-[#0a1733] via-[#07122b] to-[#040918] border-2 border-amber-400/80 shadow-2xl space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-amber-400/30 pb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-base">
                      {editingMealKey === 'breakfast' ? '🌅' : editingMealKey === 'lunch' ? '☀️' : editingMealKey === 'dinner' ? '🌙' : '🍎'}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wide">
                      Modificar Calorías: {editingMealKey === 'breakfast' ? 'Desayuno' : editingMealKey === 'lunch' ? 'Almuerzo' : editingMealKey === 'dinner' ? 'Cena' : 'Snacks'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      (Registrado: {todayCalorieLog?.[editingMealKey]?.totalCalories || 0} kcal)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingMealKey(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Cerrar editor"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Numeric Input & Steppers */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-300 font-semibold">Calorías exactas consumidas:</span>
                    <span className="text-amber-400/90 text-[9.5px]">Escribe o ajusta con los botones</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={editingMealCalories}
                        onChange={(e) => setEditingMealCalories(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseInt(editingMealCalories, 10);
                            handleSetMealExactCalories(editingMealKey, isNaN(val) ? 0 : val, editingMealDescription);
                          }
                        }}
                        autoFocus
                        placeholder="0"
                        className="w-full pl-3 pr-12 py-1.5 bg-[#030712] border-2 border-amber-400/80 rounded-lg text-base font-mono font-black text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400/40 shadow-inner"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400 pointer-events-none">
                        kcal
                      </span>
                    </div>

                    {/* Quick Stepper Buttons */}
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => {
                          const cur = parseInt(editingMealCalories, 10) || 0;
                          setEditingMealCalories(String(Math.max(0, cur - 50)));
                        }}
                        className="px-2 py-1.5 rounded-lg bg-[#0e1d38] hover:bg-[#162a52] border border-[#223b6b] text-[10px] font-mono font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Restar 50 kcal"
                      >
                        -50
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const cur = parseInt(editingMealCalories, 10) || 0;
                          setEditingMealCalories(String(cur + 50));
                        }}
                        className="px-2 py-1.5 rounded-lg bg-[#0e1d38] hover:bg-[#162a52] border border-[#223b6b] text-[10px] font-mono font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Sumar 50 kcal"
                      >
                        +50
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const cur = parseInt(editingMealCalories, 10) || 0;
                          setEditingMealCalories(String(cur + 100));
                        }}
                        className="px-2 py-1.5 rounded-lg bg-[#0e1d38] hover:bg-[#162a52] border border-[#223b6b] text-[10px] font-mono font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Sumar 100 kcal"
                      >
                        +100
                      </button>
                    </div>
                  </div>
                </div>

                {/* Optional Food description */}
                <div className="space-y-0.5">
                  <input
                    type="text"
                    value={editingMealDescription}
                    onChange={(e) => setEditingMealDescription(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = parseInt(editingMealCalories, 10);
                        handleSetMealExactCalories(editingMealKey, isNaN(val) ? 0 : val, editingMealDescription);
                      }
                    }}
                    placeholder={
                      editingMealKey === 'breakfast'
                        ? 'Detalle: ej. 2 huevos cocidos con café y tostada'
                        : editingMealKey === 'lunch'
                        ? 'Detalle: ej. Pechuga a la plancha con ensalada y arroz'
                        : editingMealKey === 'dinner'
                        ? 'Detalle: ej. Wrap de atún o ensalada ligera'
                        : 'Detalle: ej. Manzana verde o frutos secos'
                    }
                    className="w-full px-2.5 py-1 bg-[#030712] border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                {/* Quick Presets for this meal */}
                <div className="space-y-1">
                  <div className="text-[9px] font-mono uppercase text-slate-400">
                    Opciones habituales para {editingMealKey === 'breakfast' ? 'desayuno' : editingMealKey === 'lunch' ? 'almuerzo' : editingMealKey === 'dinner' ? 'cena' : 'snacks'}:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {mealPresets[editingMealKey].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setEditingMealCalories(String(preset.val));
                          if (preset.desc) setEditingMealDescription(preset.desc);
                          if (soundEffectsOn) playTechBlip(620, 'sine', 0.03);
                        }}
                        className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono transition-all cursor-pointer ${
                          editingMealCalories === String(preset.val)
                            ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-sm'
                            : 'bg-[#0d1c3a] border-cyan-500/20 text-cyan-200 hover:border-cyan-400/50 hover:bg-[#142850]'
                        }`}
                      >
                        {preset.label} ({preset.val} kcal)
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Preview of New Total & Weight Delta */}
                {(() => {
                  const curVal = todayCalorieLog?.[editingMealKey]?.totalCalories || 0;
                  const nextVal = parseInt(editingMealCalories, 10);
                  const validNext = isNaN(nextVal) ? curVal : Math.max(0, nextVal);
                  const diff = validNext - curVal;
                  const nextTotal = Math.max(0, caloriesConsumed + diff);
                  const nextDiffVsBasal = nextTotal - bmr;
                  const nextKgDelta = Math.abs(nextDiffVsBasal) / 7500;
                  const nextGrams = Math.round(nextKgDelta * 1000);

                  return (
                    <div className="p-2 rounded-lg bg-[#030712] border border-[#1b2b4d] space-y-1 text-[10px] font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Total diario resultante:</span>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-slate-500 line-through">{caloriesConsumed} kcal</span>
                          <span className="text-cyan-400 font-bold">→</span>
                          <span className="font-extrabold text-amber-300 font-mono text-xs">{nextTotal} kcal</span>
                          {diff !== 0 && (
                            <span className={`text-[9px] font-bold ${diff > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              ({diff > 0 ? `+${diff}` : `${diff}`})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-0.5 border-t border-slate-800 text-[9.5px]">
                        <span className="text-slate-400">Balance vs Basal ({bmr} kcal):</span>
                        <span className={nextDiffVsBasal <= 0 ? 'text-emerald-300 font-bold' : 'text-amber-300 font-bold'}>
                          {nextDiffVsBasal <= 0 ? (
                            <>🔥 Déficit: {Math.abs(nextDiffVsBasal)} kcal (~{nextKgDelta.toFixed(3)} kg / -{nextGrams}g)</>
                          ) : (
                            <>⚡ Superávit: +{nextDiffVsBasal} kcal (~+{nextKgDelta.toFixed(3)} kg / +{nextGrams}g)</>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Buttons: Cancel & Save */}
                <div className="flex items-center justify-between pt-1 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleSetMealExactCalories(editingMealKey, 0, 'Sin comida / Ayuno');
                    }}
                    className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-[10px] font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Marcar esta comida como 0 kcal"
                  >
                    Poner en 0 kcal
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditingMealKey(null)}
                      className="px-3 py-1 rounded-lg text-slate-400 hover:text-white text-xs font-mono transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const val = parseInt(editingMealCalories, 10);
                        handleSetMealExactCalories(
                          editingMealKey,
                          isNaN(val) ? 0 : val,
                          editingMealDescription
                        );
                      }}
                      className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-[#38ef7d] hover:brightness-105 active:scale-95 text-slate-950 font-mono font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer transition-all flex items-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Guardar {editingMealCalories || 0} kcal</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* DAILY FOCUS TARGETS SECTION ("Hoy me concentraré en: ...") */}
          {/* ======================================================== */}
          <div className="my-1.5 rounded-xl bg-gradient-to-r from-[#0d1c3a] via-[#0b1730] to-[#0d1f3d] border border-cyan-500/40 p-2.5 shadow-md shadow-cyan-950/30 space-y-2 relative overflow-hidden group shrink-0">
            {/* Ambient subtle glow */}
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
            
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded-md bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-[#00f2ff] shadow-[0_0_8px_#00f2ff40]">
                  <Target className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-mono font-black tracking-wider uppercase text-cyan-200 flex items-center space-x-1.5">
                  <span>ENFOQUE DEL DÍA</span>
                </span>
              </div>

              <div className="flex items-center space-x-1.5">
                {dailyFocus.mainFocus && (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border transition-all ${
                    dailyFocus.mainFocusCompleted
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-[0_0_8px_#10b98140]'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  }`}>
                    {dailyFocus.mainFocusCompleted ? '✓ CUMPLIDO' : 'EN CURSO'}
                  </span>
                )}
                {!isEditingMainFocus && (
                  <button
                    onClick={handleStartEditingMainFocus}
                    className="p-1 rounded-md hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                    title="Editar objetivo de enfoque"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Main Focus Goal: View vs Edit */}
            {isEditingMainFocus ? (
              <div className="space-y-2 pt-0.5 animate-in fade-in duration-150">
                <div className="flex items-center space-x-1.5 text-[10.5px] font-mono font-bold text-cyan-300">
                  <span>Hoy me concentraré en:</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={inputMainFocus}
                    onChange={(e) => setInputMainFocus(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveMainFocus();
                      if (e.key === 'Escape') setIsEditingMainFocus(false);
                    }}
                    placeholder="Ej: Finalizar la propuesta de cliente y 4 bloques Pomodoro..."
                    className="w-full px-2.5 py-1.5 bg-[#070f21] border border-cyan-400/60 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 shadow-inner"
                    autoFocus
                  />
                </div>

                {/* Quick Suggestion Chips */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[9.5px] font-mono scrollbar-none">
                  <span className="text-slate-500 shrink-0">Sugerencias:</span>
                  {[
                    'Terminar entregable clave',
                    '4 bloques de Pomodoro sin redes',
                    'Resolver tickets urgentes',
                    'Revisión y cierre semanal',
                    'Planificar sprint y descansos'
                  ].map((sugg, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setInputMainFocus(sugg)}
                      className="px-2 py-0.5 rounded-full bg-[#132347] hover:bg-[#1a3163] text-cyan-200 border border-cyan-500/30 whitespace-nowrap cursor-pointer transition-colors"
                    >
                      {sugg}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-end space-x-1.5 pt-1">
                  {dailyFocus.mainFocus && (
                    <button
                      type="button"
                      onClick={handleClearMainFocus}
                      className="px-2 py-1 rounded-lg hover:bg-rose-500/20 text-rose-300 text-[10px] font-mono cursor-pointer transition-colors"
                    >
                      Borrar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEditingMainFocus(false)}
                    className="px-2.5 py-1 rounded-lg bg-[#142347] hover:bg-[#1b2f5d] text-slate-300 text-[10px] font-mono cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveMainFocus()}
                    className="px-3 py-1 rounded-lg bg-[#00f2ff] hover:bg-[#3bf5ff] text-[#002f35] font-mono font-bold text-[10px] shadow-sm shadow-[#00f2ff]/30 cursor-pointer transition-all active:scale-95"
                  >
                    Guardar Enfoque
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-0.5 space-y-1.5">
                {dailyFocus.mainFocus ? (
                  <div 
                    onClick={handleToggleMainFocus}
                    className={`group/item flex items-start space-x-2.5 p-2 rounded-lg cursor-pointer transition-all border ${
                      dailyFocus.mainFocusCompleted
                        ? 'bg-emerald-950/30 border-emerald-500/40 shadow-sm'
                        : 'bg-[#081226] hover:bg-[#0c1833] border-cyan-500/30 hover:border-cyan-400'
                    }`}
                    title="Clic para marcar como completado o en curso"
                  >
                    <div className="mt-0.5 shrink-0">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                        dailyFocus.mainFocusCompleted
                          ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_8px_#10b981]'
                          : 'border-cyan-500/60 group-hover/item:border-cyan-300 text-transparent'
                      }`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-mono uppercase text-cyan-400 block font-bold tracking-wide">
                        Hoy me concentraré en:
                      </span>
                      <p className={`text-xs font-mono font-medium leading-snug transition-all ${
                        dailyFocus.mainFocusCompleted
                          ? 'line-through text-emerald-300/80 italic'
                          : 'text-white'
                      }`}>
                        {dailyFocus.mainFocus}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={handleStartEditingMainFocus}
                    className="p-2.5 rounded-lg bg-[#081226]/80 border border-dashed border-cyan-500/40 hover:border-cyan-400 cursor-pointer transition-all flex items-center justify-between text-slate-400 hover:text-cyan-200"
                  >
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-cyan-400 animate-pulse" />
                      <span className="text-xs font-mono">
                        Hoy me concentraré en: <span className="text-cyan-400/80 italic font-normal">Define tu objetivo clave de hoy...</span>
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-[#00f2ff] text-[10px] font-mono font-bold border border-cyan-400/30">
                      + Definir
                    </span>
                  </div>
                )}

                {/* Specific Sub-Goals / Micro-Objetivos de Enfoque */}
                {dailyFocus.subGoals && dailyFocus.subGoals.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-[#18284c]">
                    <div className="flex items-center justify-between text-[9.5px] font-mono text-slate-400 px-0.5">
                      <span>Objetivos específicos:</span>
                      <span className="text-cyan-300">
                        {dailyFocus.subGoals.filter(g => g.completed).length}/{dailyFocus.subGoals.length} completados
                      </span>
                    </div>
                    <div className="space-y-1">
                      {dailyFocus.subGoals.map(goal => (
                        <div 
                          key={goal.id}
                          className="flex items-center justify-between p-1.5 rounded-md bg-[#081226] border border-[#1b2b4d] hover:border-cyan-500/40 text-xs font-mono group/sub"
                        >
                          <div 
                            onClick={() => handleToggleSubGoal(goal.id)}
                            className="flex items-center space-x-2 flex-1 min-w-0 cursor-pointer"
                          >
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                              goal.completed
                                ? 'bg-emerald-500 border-emerald-400 text-white'
                                : 'border-slate-600 group-hover/sub:border-cyan-400 text-transparent'
                            }`}>
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                            <span className={`truncate text-[11px] ${goal.completed ? 'line-through text-slate-500 italic' : 'text-slate-200'}`}>
                              {goal.text}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteSubGoal(goal.id)}
                            className="opacity-0 group-hover/sub:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-all cursor-pointer"
                            title="Eliminar micro-objetivo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Specific Sub-Goal Button / Inline Form */}
                {isAddingSubGoal ? (
                  <div className="flex items-center space-x-1.5 pt-1">
                    <input
                      type="text"
                      value={inputSubGoal}
                      onChange={(e) => setInputSubGoal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddSubGoal();
                        if (e.key === 'Escape') setIsAddingSubGoal(false);
                      }}
                      placeholder="Añadir objetivo específico de enfoque..."
                      className="flex-1 px-2 py-1 bg-[#070f21] border border-cyan-400/50 rounded-md text-[11px] font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddSubGoal}
                      className="px-2 py-1 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 text-[10px] font-mono font-bold cursor-pointer"
                    >
                      Añadir
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingSubGoal(false)}
                      className="p-1 rounded-md text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-0.5">
                    <button
                      onClick={() => setIsAddingSubGoal(true)}
                      className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer transition-colors hover:underline"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Agregar objetivo específico</span>
                    </button>
                    <span className="text-[9px] font-mono text-slate-500">Auto-guardado local</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Combined Progress Bars: Tasks & Habits */}
          <div className="py-2 space-y-1.5">
            <div>
              <div className="flex items-center justify-between text-[10.5px] font-mono text-slate-300 pb-0.5">
                <span className="flex items-center space-x-1 text-cyan-300 font-semibold">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span>Tareas del Día ({totalTasksCount - pendingTasksCount}/{totalTasksCount})</span>
                </span>
                <span className="font-bold text-cyan-200">{dailyProgressPercent}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#121c33] border border-[#1e2d4a] overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-[#38ef7d] transition-all duration-500 shadow-[0_0_8px_#00f2ff]"
                  style={{ width: `${dailyProgressPercent}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[10.5px] font-mono text-slate-300 pb-0.5">
                <span className="flex items-center space-x-1 text-emerald-300 font-semibold">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>Hábitos Cumplidos Hoy ({completedHabitsToday}/{totalHabitsCount})</span>
                </span>
                <span className="font-bold text-emerald-300">{habitsProgressPercent}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#121c33] border border-[#1e2d4a] overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-[#00f2ff] transition-all duration-500 shadow-[0_0_8px_#10b981]"
                  style={{ width: `${habitsProgressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 pb-2 overflow-x-auto scrollbar-none">
            {[
              { id: 'pendientes', label: 'Todo Hoy', count: pendingTasksCount + (totalHabitsCount - completedHabitsToday) },
              { id: 'habitos', label: 'Hábitos', count: totalHabitsCount },
              { id: 'todas', label: 'Tareas', count: totalTasksCount },
              { id: 'salud', label: 'Salud & Fit', count: `${waterGlasses}/8v` },
              { id: 'completadas', label: 'Completadas', count: (totalTasksCount - pendingTasksCount) + completedHabitsToday }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setTaskFilter(tab.id as any);
                  if (soundEffectsOn) playTechBlip(500, 'sine', 0.04);
                }}
                className={`px-2 py-0.8 rounded-xl text-[11px] font-mono transition-all cursor-pointer flex items-center space-x-1 shrink-0 ${
                  taskFilter === tab.id
                    ? 'bg-cyan-500/20 text-[#00f2ff] border border-cyan-400 font-bold shadow-sm'
                    : 'bg-[#101b33] text-slate-400 border border-transparent hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[9px] px-1 py-0.2 rounded-full ${
                  taskFilter === tab.id ? 'bg-cyan-400 text-slate-900 font-bold' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Tasks & Habits Scroll List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-cyan-500/20 min-h-0">
            {/* If tab is 'pendientes' (Todo Hoy): show quick habits strip FIRST, then pending tasks */}
            {taskFilter === 'pendientes' && (
              <>
                {/* Embedded Permanent Habits Ribbon */}
                <div className="p-2.5 rounded-xl bg-[#09152b] border border-emerald-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-emerald-300 flex items-center space-x-1.5 uppercase tracking-wide">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>Hábitos del Día ({completedHabitsToday}/{totalHabitsCount})</span>
                    </span>
                    <button
                      onClick={() => setTaskFilter('habitos')}
                      className="text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer"
                    >
                      Ver todos
                    </button>
                  </div>

                  {habits.length === 0 ? (
                    <div className="text-center py-2 text-[11px] text-slate-500 italic">
                      No tienes hábitos activos configurados.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {habits.map(h => {
                        const isDoneToday = Array.isArray(h.completedDates) && h.completedDates.includes(todayStr);
                        return (
                          <div
                            key={h.id}
                            onClick={() => handleCheckHabit(h)}
                            className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between select-none ${
                              isDoneToday
                                ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                                : 'bg-[#0f1d38] border-[#1e2e4e] hover:border-cyan-400/50 text-slate-200'
                            }`}
                          >
                            <div className="flex items-center space-x-2 min-w-0">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                isDoneToday ? 'bg-emerald-400 border-emerald-300 text-[#060b17]' : 'border-slate-500'
                              }`}>
                                {isDoneToday && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span className={`text-[11px] font-semibold truncate ${isDoneToday ? 'line-through text-slate-400' : 'text-white'}`}>
                                {h.title}
                              </span>
                            </div>

                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/10 text-amber-300 shrink-0 flex items-center space-x-0.5">
                              <Flame className="w-2.5 h-2.5 text-amber-400" />
                              <span>{h.streak || 0}d</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Subtitle for Pending Tasks */}
                <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="uppercase font-bold tracking-wider text-cyan-300">Actividades & Tareas Pendientes</span>
                  <span>{displayTasks.length} listas</span>
                </div>
              </>
            )}

            {taskFilter === 'habitos' ? (
              // Dedicated Full Habits View
              habits.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 italic">No hay hábitos configurados.</div>
              ) : (
                habits.map(h => {
                  const isDoneToday = Array.isArray(h.completedDates) && h.completedDates.includes(todayStr);
                  return (
                    <div
                      key={h.id}
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-between group ${
                        isDoneToday
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-100'
                          : 'bg-[#0c1833] border-[#1b2b4d] hover:border-cyan-400/50 text-slate-200'
                      }`}
                    >
                      <div 
                        onClick={() => handleCheckHabit(h)}
                        className="flex items-center space-x-2.5 min-w-0 flex-1 cursor-pointer"
                      >
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                          isDoneToday ? 'bg-emerald-400 border-emerald-300 text-[#060b17]' : 'border-slate-500'
                        }`}>
                          {isDoneToday && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${isDoneToday ? 'line-through text-slate-400' : 'text-white'}`}>
                            {h.title}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {h.targetTime || 'Rutina diaria'} • {h.category}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 font-mono text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-0.5">
                          <Flame className="w-3 h-3 text-amber-400" />
                          <span>{h.streak || 0} d</span>
                        </span>
                        <span className="text-cyan-300 font-bold">+25 XP</span>
                        {onEditHabit && (
                          <button
                            onClick={() => onEditHabit(h)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-emerald-300 text-[10px] font-mono transition-opacity cursor-pointer pl-1"
                          >
                            Editar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )
            ) : taskFilter === 'salud' ? (
              /* Dedicated Deep Health & Bio-Telemetry View */
              <div className="space-y-2 py-1 pr-0.5">
                {/* 1. Bio-HUD Telemetry Banner */}
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#09172f] via-[#0d2244] to-[#0a1a36] border border-cyan-500/30 flex items-center justify-between shadow-sm shrink-0">
                  <div className="flex items-center space-x-2">
                    <div className="relative flex items-center justify-center">
                      <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span className="absolute w-5 h-5 rounded-full border border-emerald-400/40 animate-ping" />
                    </div>
                    <div>
                      <div className="text-[11px] font-mono font-black uppercase text-cyan-200 tracking-wider flex items-center space-x-1.5">
                        <span>BIO-TELEMETRÍA // HUMANA</span>
                      </div>
                      <p className="text-[9.5px] font-mono text-slate-400">
                        BMR: <span className="text-white font-bold">{bmr} kcal</span> // TDEE: <span className="text-amber-300 font-bold">{tdee} kcal</span>
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[9px] font-mono font-bold uppercase">
                    {bmiInfo.label}
                  </span>
                </div>

                {/* 2. CARD: REGISTRO DE PESO DIARIO & GRÁFICA DE TENDENCIA */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-[#0c1833] border border-[#1b2b4d] hover:border-cyan-400/40 transition-all space-y-3 shrink-0 shadow-lg shadow-[#000000]/20">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#1c2b4d]">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                        <Scale className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-mono font-black uppercase text-white tracking-wider flex items-center space-x-1.5">
                          <span>REGISTRO DE PESO DIARIO & TENDENCIA</span>
                        </h4>
                        <p className="text-[10px] font-mono text-slate-400">
                          {latestWeightEntry ? `Último registro: ${latestWeightEntry.date}` : 'Sin registros previos'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 text-[9.5px] font-mono font-bold">
                        IMC {bmi} ({bmiInfo.label})
                      </span>
                    </div>
                  </div>

                  {/* Weight KPI Readout & Target Delta */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#081226] border border-[#1b2b4d]/80">
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Peso Actual</span>
                      <div className="flex items-baseline space-x-1 mt-0.5">
                        <span className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
                          {latestWeight}
                        </span>
                        <span className="text-xs font-mono text-cyan-300 font-bold">kg</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Diferencia</span>
                      <div className="mt-0.5">
                        {weightDiff !== null ? (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold inline-flex items-center space-x-0.5 border ${
                            weightDiff < 0
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : weightDiff > 0
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {weightDiff < 0 ? <TrendingDown className="w-3 h-3 text-emerald-400" /> : <TrendingUp className="w-3 h-3 text-amber-400" />}
                            <span>{weightDiff > 0 ? `+${weightDiff}` : weightDiff} kg</span>
                          </span>
                        ) : (
                          <span className="text-xs font-mono text-slate-500">Base inicial</span>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Meta</span>
                      <div className="mt-0.5 text-xs font-mono font-bold">
                        {targetWeight ? (
                          <span className={latestWeight <= targetWeight ? 'text-emerald-300' : 'text-amber-300'}>
                            {targetWeight} kg {latestWeight > targetWeight ? `(faltan ${(latestWeight - targetWeight).toFixed(1)}k)` : '✓ Lograda'}
                          </span>
                        ) : (
                          <span className="text-slate-500">No definida</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* FORMULARIO DIRECTO DE REGISTRO DIARIO */}
                  <div className="p-2.5 rounded-xl bg-[#09152b] border border-cyan-500/30 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300 font-bold uppercase">
                      <span className="flex items-center space-x-1">
                        <Plus className="w-3 h-3 text-cyan-400" />
                        <span>Anotar Peso del Día</span>
                      </span>
                      {/* Date quick buttons */}
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => setDailyWeightInputDate(todayStr)}
                          className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold transition-all cursor-pointer border ${
                            dailyWeightInputDate === todayStr
                              ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-xs'
                              : 'bg-[#0d1c3a] text-slate-300 border-[#243963] hover:text-white'
                          }`}
                        >
                          Hoy
                        </button>
                        <button
                          type="button"
                          onClick={() => setDailyWeightInputDate(yesterdayDateStr)}
                          className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold transition-all cursor-pointer border ${
                            dailyWeightInputDate === yesterdayDateStr
                              ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-xs'
                              : 'bg-[#0d1c3a] text-slate-300 border-[#243963] hover:text-white'
                          }`}
                        >
                          Ayer
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      {/* Input Peso */}
                      <div className="sm:col-span-5 relative flex items-center">
                        <input
                          type="number"
                          step="0.1"
                          value={quickWeightValue}
                          onChange={(e) => setQuickWeightValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveQuickWeight();
                          }}
                          placeholder={`Ej: ${latestWeight}`}
                          className="w-full pl-3 pr-8 py-1.5 bg-[#050b18] border border-cyan-400/40 focus:border-cyan-400 rounded-xl text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                        />
                        <span className="absolute right-2.5 text-xs font-mono font-bold text-cyan-300">kg</span>
                      </div>

                      {/* Quick Adjust Buttons */}
                      <div className="sm:col-span-3 flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => {
                            const cur = parseFloat(quickWeightValue) || latestWeight;
                            setQuickWeightValue((Math.max(30, cur - 0.5)).toFixed(1));
                          }}
                          className="flex-1 py-1 bg-[#101f3f] hover:bg-[#182f61] text-slate-200 border border-[#233a69] rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-all active:scale-95"
                          title="Restar 0.5 kg"
                        >
                          -0.5k
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const cur = parseFloat(quickWeightValue) || latestWeight;
                            setQuickWeightValue((cur + 0.5).toFixed(1));
                          }}
                          className="flex-1 py-1 bg-[#101f3f] hover:bg-[#182f61] text-slate-200 border border-[#233a69] rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-all active:scale-95"
                          title="Sumar 0.5 kg"
                        >
                          +0.5k
                        </button>
                      </div>

                      {/* Submit Button */}
                      <div className="sm:col-span-4">
                        <button
                          type="button"
                          onClick={() => handleSaveQuickWeight()}
                          className="w-full py-1.5 px-3 bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:brightness-110 text-slate-950 font-mono font-black text-xs rounded-xl shadow-md shadow-cyan-500/20 cursor-pointer transition-all flex items-center justify-center space-x-1 active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Registrar Peso</span>
                        </button>
                      </div>
                    </div>

                    {/* Date input & optional notes */}
                    <div className="flex items-center space-x-2 pt-0.5 text-[10px] font-mono">
                      <input
                        type="date"
                        value={dailyWeightInputDate}
                        onChange={(e) => setDailyWeightInputDate(e.target.value)}
                        className="px-2 py-0.8 bg-[#050b18] border border-slate-700 rounded-lg text-slate-300 text-[10px] font-mono focus:outline-none focus:border-cyan-400 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={quickWeightNotes}
                        onChange={(e) => setQuickWeightNotes(e.target.value)}
                        placeholder="Nota opcional (ej: En ayunas, post-entreno...)"
                        className="flex-1 px-2.5 py-0.8 bg-[#050b18] border border-slate-700 rounded-lg text-slate-200 text-[10px] font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  {/* GRÁFICA DE TENDENCIA DE PESO */}
                  <div className="p-2.5 rounded-xl bg-[#081226] border border-[#1b2b4d] space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span className="uppercase font-bold text-cyan-300 flex items-center space-x-1">
                        <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Gráfica de Tendencia ({sortedWeightLogs.length} pesajes)</span>
                      </span>
                      {targetWeight && (
                        <span className="text-amber-400 font-bold">
                          -- Meta: {targetWeight} kg
                        </span>
                      )}
                    </div>

                    <div className="h-32 w-full pt-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={weightTrendChartData}
                          margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                        >
                          <XAxis 
                            dataKey="date" 
                            stroke="#64748b" 
                            fontSize={9} 
                            tickLine={false}
                          />
                          <YAxis 
                            domain={weightDomain} 
                            stroke="#64748b" 
                            fontSize={9} 
                            tickLine={false}
                            unit="k"
                          />
                          <RechartsTooltip
                            contentStyle={{ 
                              backgroundColor: '#071226', 
                              borderColor: '#00f2ff', 
                              borderRadius: '10px', 
                              fontSize: '11px', 
                              color: '#fff',
                              boxShadow: '0 0 12px rgba(0,242,255,0.3)'
                            }}
                            formatter={(value: any) => [`${value} kg`, 'Peso']}
                            labelFormatter={(label, payload) => {
                              const item = payload && payload[0]?.payload;
                              return item?.fullDate ? `${item.fullDate} ${item.notes ? `(${item.notes})` : ''}` : label;
                            }}
                          />
                          {targetWeight && (
                            <ReferenceLine 
                              y={targetWeight} 
                              stroke="#f59e0b" 
                              strokeDasharray="3 3" 
                              label={{ value: `Meta: ${targetWeight}k`, fill: '#f59e0b', fontSize: 9, position: 'right' }} 
                            />
                          )}
                          <Line 
                            type="monotone" 
                            dataKey="weight" 
                            stroke="#00f2ff" 
                            strokeWidth={2.5} 
                            dot={{ r: 3, fill: '#00f2ff' }} 
                            activeDot={{ r: 5, fill: '#38ef7d' }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Historial de últimos 4 registros */}
                    {sortedWeightLogs.length > 0 && (
                      <div className="pt-1.5 border-t border-slate-800 flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
                        <span className="text-[9px] font-mono text-slate-500 uppercase shrink-0">Recientes:</span>
                        {sortedWeightLogs.slice(-4).reverse().map((entry) => (
                          <div
                            key={entry.id}
                            className="px-2 py-0.5 rounded-lg bg-[#0e1a35] border border-[#213359] text-[9.5px] font-mono flex items-center space-x-1 shrink-0"
                          >
                            <span className="text-slate-400">{entry.date.slice(5)}:</span>
                            <span className="text-white font-bold">{entry.weight}kg</span>
                            {onDeleteWeightLog && (
                              <button
                                type="button"
                                onClick={() => onDeleteWeightLog(entry.id)}
                                title={`Eliminar registro del ${entry.date}`}
                                className="text-slate-500 hover:text-rose-400 cursor-pointer ml-0.5 transition-colors"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. CARD: PROGRESO DE CALORÍAS DIARIAS */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-[#0c1833] border border-[#1b2b4d] hover:border-amber-400/40 transition-all space-y-2 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                        <Flame className="w-3.5 h-3.5 fill-amber-400/30" />
                      </div>
                      <span className="text-[11px] font-mono font-bold uppercase text-white tracking-wide">
                        Progreso de Calorías
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setIsQuickCalorieOpen(!isQuickCalorieOpen);
                        if (soundEffectsOn) playTechBlip(600, 'sine', 0.04);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-[10px] font-mono font-bold flex items-center space-x-1 cursor-pointer transition-all active:scale-95"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                      <span>{isQuickCalorieOpen ? 'Cerrar' : '+ Kcal'}</span>
                    </button>
                  </div>

                  {/* Progress Numbers */}
                  <div className="flex items-baseline justify-between pt-0.5">
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                        {caloriesConsumed.toLocaleString()}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">/ {targetCalories.toLocaleString()} kcal</span>
                    </div>

                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                      calorieProgressPercent > 105
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : calorieProgressPercent >= 80
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                    }`}>
                      {calorieProgressPercent}%
                    </span>
                  </div>

                  {/* Energy Balance & Remaining */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                    <span>Gasto TDEE: <strong className="text-slate-200">{tdee} kcal</strong></span>
                    <span>
                      {calorieBalance <= 0 ? (
                        <span className="text-emerald-300 font-semibold">
                          Restan {Math.abs(calorieBalance)} kcal para meta
                        </span>
                      ) : (
                        <span className="text-amber-300 font-semibold">
                          + {calorieBalance} kcal sobre meta
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* 4. Link to Health Hub */}
                {onNavigateToHealth && (
                  <button
                    onClick={() => {
                      if (soundEffectsOn) playTechBlip(500, 'sine', 0.05);
                      onNavigateToHealth();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#091e3f] to-[#0f2e5c] hover:from-[#0d2a58] hover:to-[#143b74] border border-cyan-400/40 text-cyan-200 text-xs font-mono font-bold flex items-center justify-center space-x-2 cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <Heart className="w-3.5 h-3.5 text-rose-400" />
                    <span>Abrir Módulo de Salud & Nutrición Completo</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ) : (
              // Tasks List
              displayTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 italic">
                  No hay tareas en esta sección.
                </div>
              ) : (
                displayTasks.map(t => {
                  const isDone = t.status === 'completada';
                  const isLaboral = isItemLaboral(t);
                  const priorityColor =
                    t.priority === 'urgente' || t.priority === 'alta'
                      ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                      : t.priority === 'media'
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                      : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300';

                  const xpReward =
                    t.priority === 'urgente'
                      ? '+60 XP'
                      : t.priority === 'alta'
                      ? '+50 XP'
                      : t.priority === 'media'
                      ? '+35 XP'
                      : '+20 XP';

                  return (
                    <div
                      key={t.id}
                      onClick={() => onEditTask && onEditTask(t)}
                      className={`p-2.5 rounded-xl border transition-all flex items-start space-x-2.5 group cursor-pointer ${
                        isDone
                          ? 'bg-gradient-to-r from-orange-950/25 via-[#0c1833] to-[#0c1833] border-orange-500/60 ring-1 ring-orange-500/40 shadow-[0_0_16px_rgba(249,115,22,0.35)] hover:border-orange-400'
                          : isLaboral
                          ? 'bg-gradient-to-r from-[#0d1e3d] via-[#0c1833] to-[#0a1429] border-cyan-400/60 shadow-md shadow-cyan-950/30 hover:ring-1 hover:ring-cyan-400/40'
                          : 'bg-[#0c1833] border-[#1b2b4d] hover:border-cyan-400/50 hover:bg-[#101e40] hover:ring-1 hover:ring-cyan-400/40'
                      }`}
                    >
                      {/* Check circle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCheckTask(t);
                        }}
                        className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                          isDone
                            ? 'bg-orange-500 border-orange-400 text-white shadow-[0_0_10px_rgba(249,115,22,0.6)]'
                            : 'border-slate-500 hover:border-[#00f2ff] text-transparent hover:text-cyan-400'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          {/* Completed orange indicator badge */}
                          {isDone && (
                            <span className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-[0_0_6px_rgba(249,115,22,0.35)] flex items-center space-x-1 shrink-0 animate-in fade-in">
                              <span>✓ Terminada</span>
                            </span>
                          )}

                          {/* Selectable J Laboral Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleLaboral(t, e);
                            }}
                            title={isLaboral ? "Tarea Laboral activa [J] - Clic para alternar" : "Marcar como tarea Laboral [J] (Trabajo / Jornada)"}
                            className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-black transition-all cursor-pointer flex items-center space-x-1 shrink-0 border ${
                              isLaboral
                                ? 'bg-[#00f2ff] text-[#00363a] border-cyan-200 shadow-[0_0_8px_#00f2ff80] scale-105'
                                : 'bg-[#081226] text-slate-500 border-slate-700/80 hover:border-cyan-400 hover:text-cyan-300'
                            }`}
                          >
                            <span>J</span>
                            {isLaboral && <span className="text-[7.5px] font-black uppercase tracking-wider">LAB</span>}
                          </button>

                          {/* Orange badge if coming from yesterday / rolled over */}
                          {((t.rolloverCount && t.rolloverCount > 0) || t.postponedFromDate || t.isRollover) && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1 shrink-0 animate-in fade-in"
                              title={`Tarea pospuesta que viene de ayer (${t.postponedFromDate || 'día anterior'}) • Rodada ${t.rolloverCount || 1} ${t.rolloverCount === 1 ? 'vez' : 'veces'}`}
                            >
                              <RotateCcw className="w-2.5 h-2.5 text-amber-400 stroke-[2.5]" />
                              <span>Viene de ayer</span>
                            </span>
                          )}

                          <p className={`text-xs font-bold truncate transition-colors ${
                            isDone 
                              ? 'text-slate-100 line-through decoration-orange-400/90 decoration-2 group-hover:text-orange-300' 
                              : 'text-white group-hover:text-cyan-300'
                          }`}>
                            {t.title}
                          </p>
                        </div>

                        {/* Optional description preview */}
                        {t.description && (
                          <p className={`text-[10px] truncate mt-0.5 max-w-full font-mono ${
                            isDone ? 'text-slate-300 font-medium' : 'text-slate-400'
                          }`}>
                            {t.description}
                          </p>
                        )}

                        {/* Badges strip: Priority, XP, Due time */}
                        <div className="flex items-center space-x-1.5 mt-1 font-mono text-[9.5px]">
                          {isLaboral && (
                            <span className="px-1.5 py-0.2 rounded border font-bold uppercase bg-cyan-500/20 text-[#00f2ff] border-cyan-400/40">
                              LABORAL
                            </span>
                          )}
                          <span className={`px-1.5 py-0.2 rounded border font-bold uppercase ${priorityColor}`}>
                            {t.priority}
                          </span>
                          <span className="text-cyan-300 font-bold">{xpReward}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400 truncate">
                            {t.timeSlot || t.dueDate || 'Hoy'}
                          </span>
                          <span className="text-slate-500">•</span>
                          <TaskLiveTimer task={t} compact />
                        </div>
                      </div>

                      {/* Action buttons: Copy & Edit */}
                      <div className="flex items-center space-x-1 shrink-0 self-center">
                        {/* Quick Copy Button */}
                        <button
                          type="button"
                          onClick={(e) => handleCopyTaskInfo(t, e)}
                          className="p-1.5 rounded-lg bg-[#081226] hover:bg-[#142344] text-slate-400 hover:text-white border border-[#1b2b4d] hover:border-cyan-400/50 transition-colors cursor-pointer"
                          title="Copiar información de la tarea"
                        >
                          {copiedTaskId === t.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Edit CTA Button */}
                        {onEditTask && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditTask(t);
                            }}
                            className="px-2 py-1 rounded-lg bg-[#0e1d3a] hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-[#1b2b4d] hover:border-cyan-400/50 flex items-center space-x-1 text-[10px] font-mono font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                            title="Editar tarea y ver información completa"
                          >
                            <Edit3 className="w-3 h-3 text-cyan-400" />
                            <span className="hidden sm:inline">Editar</span>
                          </button>
                        )}

                        {/* Rollover to Next Day ">" Button */}
                        <button
                          type="button"
                          onClick={(e) => handleRolloverTaskToNextDay(t, e)}
                          className="px-2 py-1 rounded-lg bg-[#081226] hover:bg-amber-500/25 text-amber-400 hover:text-amber-300 border border-amber-500/40 hover:border-amber-400 flex items-center space-x-1 text-[11px] font-mono font-black transition-all cursor-pointer shadow-sm active:scale-95 group"
                          title={`Rodar tarea para el día siguiente (pasar al ${addDaysToDateStr(t.assignedDate || selectedDateStr, 1)})`}
                        >
                          <span className="font-black group-hover:translate-x-0.5 transition-transform">&gt;</span>
                          <span className="hidden xl:inline text-[9px] font-bold text-amber-300/90">+1d</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>

        </section>

      </main>

      {/* ======================================================== */}
      {/* DRAWER / SLIDE-OVER: ASISTENTE // SALUD & FITNESS HUD    */}
      {/* ======================================================== */}
      {isNexusDrawerOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200"
          onClick={() => setIsNexusDrawerOpen(false)}
        >
          <div 
            className="w-full max-w-lg bg-[#0a1326] border-l border-[#00f2ff]/40 h-full flex flex-col p-3 sm:p-4 shadow-2xl shadow-[#000000]/80 overflow-hidden animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Switcher Tabs and Close Button */}
            <div className="flex items-center justify-between pb-2 border-b border-[#1c2b4d] shrink-0">
              <div className="flex items-center space-x-1 p-0.5 bg-[#081022] rounded-xl border border-[#1b2b4d] shrink-0">
                <button
                  onClick={() => {
                    setRightPanelTab('assistant');
                    if (soundEffectsOn) playTechBlip(520, 'sine', 0.04);
                  }}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 whitespace-nowrap transition-all cursor-pointer ${
                    rightPanelTab === 'assistant'
                      ? 'bg-cyan-500/20 text-[#00f2ff] border border-cyan-400/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5 shrink-0" />
                  <span>NEXUS-07</span>
                </button>
                
                <button
                  onClick={() => {
                    setRightPanelTab('health');
                    if (soundEffectsOn) playTechBlip(620, 'sine', 0.04);
                  }}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 whitespace-nowrap transition-all cursor-pointer ${
                    rightPanelTab === 'health'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-500/30 shrink-0" />
                  <span>SALUD & FITNESS</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                </button>
              </div>

              <div className="flex items-center space-x-2">
                {rightPanelTab === 'assistant' ? (
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={handleSpeakAdvice}
                      className="p-1.5 rounded-lg bg-[#142344] hover:bg-[#1c3261] text-cyan-300 transition-colors cursor-pointer"
                      title="Leer consejo en voz alta"
                    >
                      <Radio className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  onNavigateToHealth && (
                    <button
                      onClick={() => {
                        if (soundEffectsOn) playTechBlip(500, 'sine', 0.05);
                        onNavigateToHealth();
                      }}
                      className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 hover:underline cursor-pointer px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30 whitespace-nowrap shrink-0"
                      title="Abrir Hub de Salud completo"
                    >
                      <span>Módulo Hub</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  )
                )}

                <button
                  onClick={() => setIsNexusDrawerOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 cursor-pointer transition-colors"
                  title="Cerrar panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

          {/* ==================================================== */}
          {/* TAB CONTENT: HEALTH & FITNESS SUMMARY PANEL          */}
          {/* ==================================================== */}
          {rightPanelTab === 'health' ? (
            <div className="flex-1 min-h-0 flex flex-col overflow-y-auto space-y-2 py-1.5 pr-0.5 scrollbar-thin scrollbar-thumb-cyan-500/20">
              
              {/* 1. Bio-HUD Telemetry Banner */}
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#09172f] via-[#0d2244] to-[#0a1a36] border border-cyan-500/30 flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="relative flex items-center justify-center">
                    <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span className="absolute w-5 h-5 rounded-full border border-emerald-400/40 animate-ping" />
                  </div>
                  <div>
                    <div className="text-[11px] font-mono font-black uppercase text-cyan-200 tracking-wider flex items-center space-x-1.5">
                      <span>BIO-TELEMETRÍA // HUMANA</span>
                    </div>
                    <p className="text-[9.5px] font-mono text-slate-400">
                      BMR: <span className="text-white font-bold">{bmr} kcal</span> // TDEE: <span className="text-amber-300 font-bold">{tdee} kcal</span>
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[9px] font-mono font-bold uppercase">
                  {bmiInfo.label}
                </span>
              </div>

              {/* 2. CARD: REGISTRO DE PESO DIARIO & GRÁFICA DE TENDENCIA */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-[#0c1833] border border-[#1b2b4d] hover:border-cyan-400/40 transition-all space-y-3 shrink-0 shadow-lg shadow-[#000000]/20">
                {/* Header */}
                <div className="flex items-center justify-between pb-1.5 border-b border-[#1c2b4d]">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-mono font-black uppercase text-white tracking-wider flex items-center space-x-1.5">
                        <span>REGISTRO DE PESO DIARIO & TENDENCIA</span>
                      </h4>
                      <p className="text-[10px] font-mono text-slate-400">
                        {latestWeightEntry ? `Último registro: ${latestWeightEntry.date}` : 'Sin registros previos'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 text-[9.5px] font-mono font-bold">
                      IMC {bmi} ({bmiInfo.label})
                    </span>
                  </div>
                </div>

                {/* Weight KPI Readout & Target Delta */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#081226] border border-[#1b2b4d]/80">
                  <div>
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Peso Actual</span>
                    <div className="flex items-baseline space-x-1 mt-0.5">
                      <span className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
                        {latestWeight}
                      </span>
                      <span className="text-xs font-mono text-cyan-300 font-bold">kg</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Diferencia</span>
                    <div className="mt-0.5">
                      {weightDiff !== null ? (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold inline-flex items-center space-x-0.5 border ${
                          weightDiff < 0
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : weightDiff > 0
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {weightDiff < 0 ? <TrendingDown className="w-3 h-3 text-emerald-400" /> : <TrendingUp className="w-3 h-3 text-amber-400" />}
                          <span>{weightDiff > 0 ? `+${weightDiff}` : weightDiff} kg</span>
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-slate-500">Base inicial</span>
                      )}
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Meta</span>
                    <div className="mt-0.5 text-xs font-mono font-bold">
                      {targetWeight ? (
                        <span className={latestWeight <= targetWeight ? 'text-emerald-300' : 'text-amber-300'}>
                          {targetWeight} kg {latestWeight > targetWeight ? `(faltan ${(latestWeight - targetWeight).toFixed(1)}k)` : '✓ Lograda'}
                        </span>
                      ) : (
                        <span className="text-slate-500">No definida</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* FORMULARIO DIRECTO DE REGISTRO DIARIO (Solicitado por el usuario) */}
                <div className="p-2.5 rounded-xl bg-[#09152b] border border-cyan-500/30 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300 font-bold uppercase">
                    <span className="flex items-center space-x-1">
                      <Plus className="w-3 h-3 text-cyan-400" />
                      <span>Anotar Peso del Día</span>
                    </span>
                    {/* Date quick buttons */}
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => setDailyWeightInputDate(todayStr)}
                        className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold transition-all cursor-pointer border ${
                          dailyWeightInputDate === todayStr
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-xs'
                            : 'bg-[#0d1c3a] text-slate-300 border-[#243963] hover:text-white'
                        }`}
                      >
                        Hoy
                      </button>
                      <button
                        type="button"
                        onClick={() => setDailyWeightInputDate(yesterdayDateStr)}
                        className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold transition-all cursor-pointer border ${
                          dailyWeightInputDate === yesterdayDateStr
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-xs'
                            : 'bg-[#0d1c3a] text-slate-300 border-[#243963] hover:text-white'
                        }`}
                      >
                        Ayer
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    {/* Input Peso */}
                    <div className="sm:col-span-5 relative flex items-center">
                      <input
                        type="number"
                        step="0.1"
                        value={quickWeightValue}
                        onChange={(e) => setQuickWeightValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveQuickWeight();
                        }}
                        placeholder={`Ej: ${latestWeight}`}
                        className="w-full pl-3 pr-8 py-1.5 bg-[#050b18] border border-cyan-400/40 focus:border-cyan-400 rounded-xl text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      />
                      <span className="absolute right-2.5 text-xs font-mono font-bold text-cyan-300">kg</span>
                    </div>

                    {/* Quick Adjust Buttons */}
                    <div className="sm:col-span-3 flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => {
                          const cur = parseFloat(quickWeightValue) || latestWeight;
                          setQuickWeightValue((Math.max(30, cur - 0.5)).toFixed(1));
                        }}
                        className="flex-1 py-1 bg-[#101f3f] hover:bg-[#182f61] text-slate-200 border border-[#233a69] rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-all active:scale-95"
                        title="Restar 0.5 kg"
                      >
                        -0.5k
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const cur = parseFloat(quickWeightValue) || latestWeight;
                          setQuickWeightValue((cur + 0.5).toFixed(1));
                        }}
                        className="flex-1 py-1 bg-[#101f3f] hover:bg-[#182f61] text-slate-200 border border-[#233a69] rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-all active:scale-95"
                        title="Sumar 0.5 kg"
                      >
                        +0.5k
                      </button>
                    </div>

                    {/* Submit Button */}
                    <div className="sm:col-span-4">
                      <button
                        type="button"
                        onClick={() => handleSaveQuickWeight()}
                        className="w-full py-1.5 px-3 bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:brightness-110 text-slate-950 font-mono font-black text-xs rounded-xl shadow-md shadow-cyan-500/20 cursor-pointer transition-all flex items-center justify-center space-x-1 active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Registrar Peso</span>
                      </button>
                    </div>
                  </div>

                  {/* Date input & optional notes */}
                  <div className="flex items-center space-x-2 pt-0.5 text-[10px] font-mono">
                    <input
                      type="date"
                      value={dailyWeightInputDate}
                      onChange={(e) => setDailyWeightInputDate(e.target.value)}
                      className="px-2 py-0.8 bg-[#050b18] border border-slate-700 rounded-lg text-slate-300 text-[10px] font-mono focus:outline-none focus:border-cyan-400 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={quickWeightNotes}
                      onChange={(e) => setQuickWeightNotes(e.target.value)}
                      placeholder="Nota opcional (ej: En ayunas, post-entreno...)"
                      className="flex-1 px-2.5 py-0.8 bg-[#050b18] border border-slate-700 rounded-lg text-slate-200 text-[10px] font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Target Weight Progress Strip */}
                {targetWeight && (
                  <div className="pt-1 border-t border-[#162544]">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 pb-1">
                      <span className="flex items-center space-x-1">
                        <span className="text-slate-400">Objetivo:</span>
                        <strong className="text-amber-300">{targetWeight} kg</strong>
                      </span>
                      <span className="text-cyan-300">
                        {latestWeight === targetWeight
                          ? '🎯 ¡Meta alcanzada!'
                          : latestWeight > targetWeight
                          ? `Faltan -${(latestWeight - targetWeight).toFixed(1)} kg`
                          : `Faltan +${(targetWeight - latestWeight).toFixed(1)} kg`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#081022] overflow-hidden border border-[#1b2b4d]">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-[#38ef7d] transition-all duration-500"
                        style={{
                          width: `${Math.max(5, Math.min(100, targetWeight ? (1 - Math.abs(latestWeight - targetWeight) / Math.max(1, latestWeight)) * 100 : 50))}%`
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* GRÁFICA DE TENDENCIA DE PESO */}
                <div className="p-2.5 rounded-xl bg-[#081226] border border-[#1b2b4d] space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="uppercase font-bold text-cyan-300 flex items-center space-x-1">
                      <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Gráfica de Tendencia ({sortedWeightLogs.length} pesajes)</span>
                    </span>
                    {targetWeight && (
                      <span className="text-amber-400 font-bold">
                        -- Meta: {targetWeight} kg
                      </span>
                    )}
                  </div>

                  <div className="h-28 w-full pt-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={weightTrendChartData}
                        margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                      >
                        <XAxis 
                          dataKey="date" 
                          stroke="#64748b" 
                          fontSize={9} 
                          tickLine={false}
                        />
                        <YAxis 
                          domain={weightDomain} 
                          stroke="#64748b" 
                          fontSize={9} 
                          tickLine={false}
                          unit="k"
                        />
                        <RechartsTooltip
                          contentStyle={{ 
                            backgroundColor: '#071226', 
                            borderColor: '#00f2ff', 
                            borderRadius: '10px', 
                            fontSize: '11px', 
                            color: '#fff',
                            boxShadow: '0 0 12px rgba(0,242,255,0.3)'
                          }}
                          formatter={(value: any) => [`${value} kg`, 'Peso']}
                          labelFormatter={(label, payload) => {
                            const item = payload && payload[0]?.payload;
                            return item?.fullDate ? `${item.fullDate} ${item.notes ? `(${item.notes})` : ''}` : label;
                          }}
                        />
                        {targetWeight && (
                          <ReferenceLine 
                            y={targetWeight} 
                            stroke="#f59e0b" 
                            strokeDasharray="3 3" 
                            label={{ value: `Meta: ${targetWeight}k`, fill: '#f59e0b', fontSize: 9, position: 'right' }} 
                          />
                        )}
                        <Line 
                          type="monotone" 
                          dataKey="weight" 
                          stroke="#00f2ff" 
                          strokeWidth={2.5} 
                          dot={{ r: 3, fill: '#00f2ff' }} 
                          activeDot={{ r: 5, fill: '#38ef7d' }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Historial de registros recientes */}
                  {sortedWeightLogs.length > 0 && (
                    <div className="pt-1.5 border-t border-slate-800 flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
                      <span className="text-[9px] font-mono text-slate-500 uppercase shrink-0">Recientes:</span>
                      {sortedWeightLogs.slice(-4).reverse().map((entry) => (
                        <div
                          key={entry.id}
                          className="px-2 py-0.5 rounded-lg bg-[#0e1a35] border border-[#213359] text-[9.5px] font-mono flex items-center space-x-1 shrink-0"
                        >
                          <span className="text-slate-400">{entry.date.slice(5)}:</span>
                          <span className="text-white font-bold">{entry.weight}kg</span>
                          {onDeleteWeightLog && (
                            <button
                              type="button"
                              onClick={() => onDeleteWeightLog(entry.id)}
                              title={`Eliminar registro del ${entry.date}`}
                              className="text-slate-500 hover:text-rose-400 cursor-pointer ml-0.5 transition-colors"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. CARD: PROGRESO DE CALORÍAS DIARIAS */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-[#0c1833] border border-[#1b2b4d] hover:border-amber-400/40 transition-all space-y-2 shrink-0">
                <div className="flex items-center justify-between flex-wrap gap-1.5">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                      <Flame className="w-3.5 h-3.5 fill-amber-400/30" />
                    </div>
                    <div>
                      <span className="text-[11px] font-mono font-bold uppercase text-white tracking-wide block">
                        Progreso de Calorías
                      </span>
                      <span className="text-[9px] font-mono text-cyan-300">
                        {selectedHealthDate === todayStr ? 'Día: Hoy' : selectedHealthDate === yesterdayDateStr ? 'Día: Ayer' : `Día: ${selectedHealthDate}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    {/* Date quick switcher in drawer */}
                    <div className="flex items-center bg-[#071124] p-0.5 rounded-lg border border-[#1d2d4d] text-[9.5px] font-mono">
                      <button
                        type="button"
                        onClick={() => setSelectedHealthDate(todayStr)}
                        className={`px-1.5 py-0.5 rounded transition-all font-bold ${
                          selectedHealthDate === todayStr
                            ? 'bg-cyan-500 text-slate-950 font-black'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Hoy
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedHealthDate(yesterdayDateStr)}
                        className={`px-1.5 py-0.5 rounded transition-all font-bold ${
                          selectedHealthDate === yesterdayDateStr
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : 'text-slate-400 hover:text-amber-300'
                        }`}
                      >
                        Ayer
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setIsQuickCalorieOpen(!isQuickCalorieOpen);
                        if (soundEffectsOn) playTechBlip(600, 'sine', 0.04);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-[10px] font-mono font-bold flex items-center space-x-1 cursor-pointer transition-all active:scale-95"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                      <span>{isQuickCalorieOpen ? 'Cerrar' : '+ Kcal'}</span>
                    </button>
                  </div>
                </div>

                {/* Quick Calorie Drawer */}
                {isQuickCalorieOpen && (
                  <div className="p-2 rounded-lg bg-[#081226] border border-amber-400/40 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-[10px] font-mono text-amber-300 font-bold uppercase">
                      <span>Añadir Ingesta Rápida</span>
                      <div className="flex items-center space-x-1">
                        {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map(mealKey => (
                          <button
                            key={mealKey}
                            type="button"
                            onClick={() => setQuickCalorieMeal(mealKey)}
                            className={`px-1.5 py-0.2 rounded text-[9px] font-mono uppercase ${
                              quickCalorieMeal === mealKey
                                ? 'bg-amber-500 text-slate-950 font-bold'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {mealKey === 'breakfast' ? 'Des' : mealKey === 'lunch' ? 'Alm' : mealKey === 'dinner' ? 'Cen' : 'Snk'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex items-center space-x-1">
                      {[
                        { label: '+150 kcal', val: 150 },
                        { label: '+300 kcal', val: 300 },
                        { label: '+500 kcal', val: 500 }
                      ].map(preset => (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => handleSaveQuickCalories(preset.val)}
                          className="flex-1 py-1 rounded bg-[#0f1f3d] hover:bg-[#172d57] border border-cyan-500/30 text-[10px] font-mono font-bold text-cyan-200 transition-colors"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {/* Custom Calorie input */}
                    <div className="flex items-center space-x-2 pt-0.5">
                      <input
                        type="number"
                        value={quickCalorieAmount}
                        onChange={(e) => setQuickCalorieAmount(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveQuickCalories();
                        }}
                        placeholder="Kcal exactas..."
                        className="flex-1 px-2.5 py-1 bg-[#050b18] border border-slate-700 rounded-lg text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                      <button
                        onClick={() => handleSaveQuickCalories()}
                        className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono font-bold text-xs rounded-lg cursor-pointer transition-all"
                      >
                        Sumar
                      </button>
                    </div>
                  </div>
                )}

                {/* Progress Numbers */}
                <div className="flex items-baseline justify-between pt-0.5">
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                      {caloriesConsumed.toLocaleString()}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">/ {targetCalories.toLocaleString()} kcal</span>
                  </div>

                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                    calorieProgressPercent > 105
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : calorieProgressPercent >= 80
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  }`}>
                    {calorieProgressPercent}%
                  </span>
                </div>

                {/* Glowing Cyberpunk Progress Bar */}
                <div className="w-full h-2 rounded-full bg-[#081022] overflow-hidden border border-[#1b2b4d]">
                  <div
                    className={`h-full transition-all duration-500 ${
                      calorieProgressPercent > 105
                        ? 'bg-gradient-to-r from-amber-400 to-rose-500 shadow-[0_0_8px_#f43f5e]'
                        : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-[#38ef7d] shadow-[0_0_8px_#00f2ff]'
                    }`}
                    style={{ width: `${Math.min(100, calorieProgressPercent)}%` }}
                  />
                </div>

                {/* Bio-Metría: Calorías Diarias, Meta Basal, Diferencia y Déficit/Superávit con Peso (7500 kcal = 1 kg) */}
                {(() => {
                  const basalKcal = bmr;
                  const diffVsBasal = caloriesConsumed - basalKcal;
                  const isDeficit = diffVsBasal <= 0;
                  const absDiff = Math.abs(diffVsBasal);
                  const weightDeltaKg = absDiff / 7500;
                  const weightDeltaGrams = Math.round(weightDeltaKg * 1000);
                  const weeklyProjectionKg = (weightDeltaKg * 7).toFixed(2);

                  return (
                    <div className="p-2 sm:p-2.5 rounded-xl bg-[#060e1e] border border-cyan-500/30 space-y-1.5 font-mono text-[10px]">
                      {/* Fila 1: 3 Métricas compactas y perfectamente alineadas */}
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <div className="px-2 py-1.5 rounded-lg bg-[#0a1529]/90 border border-slate-800 flex flex-col justify-center">
                          <span className="text-[8.5px] uppercase tracking-wider text-slate-400">Calorías Hoy</span>
                          <div className="flex items-baseline justify-center space-x-1 mt-0.5">
                            <span className="text-xs sm:text-sm font-black text-amber-300">
                              {caloriesConsumed.toLocaleString()}
                            </span>
                            <span className="text-[8.5px] text-slate-400">kcal</span>
                          </div>
                        </div>

                        <div className="px-2 py-1.5 rounded-lg bg-[#0a1529]/90 border border-slate-800 flex flex-col justify-center">
                          <span className="text-[8.5px] uppercase tracking-wider text-slate-400">Meta Basal</span>
                          <div className="flex items-baseline justify-center space-x-1 mt-0.5">
                            <span className="text-xs sm:text-sm font-black text-cyan-300">
                              {basalKcal.toLocaleString()}
                            </span>
                            <span className="text-[8.5px] text-slate-400">kcal</span>
                          </div>
                        </div>

                        <div className={`px-2 py-1.5 rounded-lg border flex flex-col justify-center ${
                          isDeficit
                            ? 'bg-emerald-950/40 border-emerald-500/40'
                            : 'bg-amber-950/40 border-amber-500/40'
                        }`}>
                          <span className={`text-[8.5px] uppercase tracking-wider font-bold ${
                            isDeficit ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            {isDeficit ? '🔥 Déficit' : '⚡ Superávit'}
                          </span>
                          <div className="flex items-baseline justify-center space-x-1 mt-0.5">
                            <span className={`text-xs sm:text-sm font-black ${
                              isDeficit ? 'text-emerald-300' : 'text-amber-300'
                            }`}>
                              {isDeficit ? `-${absDiff}` : `+${absDiff}`}
                            </span>
                            <span className={`text-[8.5px] ${isDeficit ? 'text-emerald-400/80' : 'text-amber-400/80'}`}>kcal</span>
                          </div>
                        </div>
                      </div>

                      {/* Fila 2: Conversión a peso ultra compacta en una sola línea */}
                      <div className="flex items-center justify-between flex-wrap gap-x-2 gap-y-1 px-1 pt-1 border-t border-[#132344] text-[9.5px]">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-slate-400">
                            {isDeficit ? 'Pérdida est.:' : 'Ganancia est.:'}
                          </span>
                          <span className={`font-bold ${isDeficit ? 'text-emerald-300' : 'text-amber-300'}`}>
                            {isDeficit ? '-' : '+'}{weightDeltaKg.toFixed(3)} kg ({isDeficit ? '-' : '+'}{weightDeltaGrams}g)
                          </span>
                        </div>

                        <div className="flex items-center space-x-1.5 text-slate-400">
                          <span>Proy:</span>
                          <span className={`font-bold ${isDeficit ? 'text-emerald-300' : 'text-amber-300'}`}>
                            {isDeficit ? '-' : '+'}{weeklyProjectionKg} kg/sem
                          </span>
                          <span className="hidden sm:inline text-[8px] text-slate-500">
                            (7.5k kcal = 1 kg)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 4-Meal Breakdown Strip (Clickable to Edit Exact Calories) */}
                <div className="space-y-1.5 pt-1.5 border-t border-[#162544]">
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                    <span className="uppercase tracking-wider">Desglose por Comidas:</span>
                    <span className="text-[8.5px] text-cyan-400/80 font-normal">Toca una comida para editar kcal</span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { key: 'breakfast' as const, label: 'Desayuno', val: todayCalorieLog?.breakfast?.totalCalories || 0, icon: '🌅' },
                      { key: 'lunch' as const, label: 'Almuerzo', val: todayCalorieLog?.lunch?.totalCalories || 0, icon: '☀️' },
                      { key: 'dinner' as const, label: 'Cena', val: todayCalorieLog?.dinner?.totalCalories || 0, icon: '🌙' },
                      { key: 'snacks' as const, label: 'Snacks', val: todayCalorieLog?.snacks?.totalCalories || 0, icon: '🍎' }
                    ].map(m => {
                      const isSelected = editingMealKey === m.key;
                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => handleOpenMealEdit(m.key)}
                          className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer group relative ${
                            isSelected
                              ? 'bg-amber-500/25 border-amber-400 text-white shadow-lg shadow-amber-500/20 ring-1 ring-amber-400 scale-[1.02]'
                              : 'bg-[#081226] border-[#182645] hover:border-amber-400/70 hover:bg-[#0f1d38] text-white hover:scale-[1.02]'
                          }`}
                          title={`Haz clic para cambiar o ingresar calorías exactas de ${m.label}`}
                        >
                          <div className="flex items-center justify-center space-x-1">
                            <span className="text-[10px] leading-none">{m.icon}</span>
                            <Edit3 className={`w-2.5 h-2.5 transition-colors ${
                              isSelected ? 'text-amber-300' : 'text-slate-500 group-hover:text-amber-300'
                            }`} />
                          </div>
                          <span className={`text-[8.5px] font-mono uppercase block truncate mt-0.5 ${
                            isSelected ? 'text-amber-300 font-bold' : 'text-slate-400 group-hover:text-slate-200'
                          }`}>
                            {m.label}
                          </span>
                          <span className={`text-[10.5px] font-mono font-bold block mt-0.5 ${
                            isSelected ? 'text-amber-300 font-black' : 'text-white'
                          }`}>
                            {m.val}
                          </span>

                          {/* Active Indicator Arrow */}
                          {isSelected && (
                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-amber-400 z-10" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Inline Meal Direct Calorie Editor Panel */}
                {editingMealKey && (
                  <div className="p-3 rounded-xl bg-gradient-to-b from-[#09152e] via-[#071126] to-[#040916] border border-amber-400/70 shadow-2xl space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between border-b border-amber-400/20 pb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-sm">
                          {editingMealKey === 'breakfast' ? '🌅' : editingMealKey === 'lunch' ? '☀️' : editingMealKey === 'dinner' ? '🌙' : '🍎'}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wide">
                          Editar Calorías: {editingMealKey === 'breakfast' ? 'Desayuno' : editingMealKey === 'lunch' ? 'Almuerzo' : editingMealKey === 'dinner' ? 'Cena' : 'Snacks'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          (Actual: {todayCalorieLog?.[editingMealKey]?.totalCalories || 0} kcal)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingMealKey(null)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Cerrar editor"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Numeric Input & Steppers */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-slate-300 font-semibold">Calorías exactas consumidas:</span>
                        <span className="text-amber-400/80 text-[9.5px]">Ej: 160 si fueron 2 huevos</span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={editingMealCalories}
                            onChange={(e) => setEditingMealCalories(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = parseInt(editingMealCalories, 10);
                                handleSetMealExactCalories(editingMealKey, isNaN(val) ? 0 : val, editingMealDescription);
                              }
                            }}
                            autoFocus
                            placeholder="0"
                            className="w-full pl-3 pr-11 py-1.5 bg-[#040814] border border-amber-400/60 rounded-lg text-sm sm:text-base font-mono font-black text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-300 shadow-inner"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400 pointer-events-none">
                            kcal
                          </span>
                        </div>

                        {/* Quick Stepper Buttons */}
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              const cur = parseInt(editingMealCalories, 10) || 0;
                              setEditingMealCalories(String(Math.max(0, cur - 50)));
                            }}
                            className="px-2 py-1.5 rounded-lg bg-[#0e1d38] hover:bg-[#162a52] border border-[#223b6b] text-[10px] font-mono font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Restar 50 kcal"
                          >
                            -50
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const cur = parseInt(editingMealCalories, 10) || 0;
                              setEditingMealCalories(String(cur + 50));
                            }}
                            className="px-2 py-1.5 rounded-lg bg-[#0e1d38] hover:bg-[#162a52] border border-[#223b6b] text-[10px] font-mono font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Sumar 50 kcal"
                          >
                            +50
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Optional description/food name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 block">
                        Descripción de alimentos (opcional):
                      </label>
                      <input
                        type="text"
                        value={editingMealDescription}
                        onChange={(e) => setEditingMealDescription(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseInt(editingMealCalories, 10);
                            handleSetMealExactCalories(editingMealKey, isNaN(val) ? 0 : val, editingMealDescription);
                          }
                        }}
                        placeholder={
                          editingMealKey === 'breakfast'
                            ? 'Ej: 2 huevos cocidos con café'
                            : editingMealKey === 'lunch'
                            ? 'Ej: Pechuga a la plancha con ensalada'
                            : editingMealKey === 'dinner'
                            ? 'Ej: Wrap de atún o huevos revueltos'
                            : 'Ej: Manzana verde o frutos secos'
                        }
                        className="w-full px-2.5 py-1 bg-[#040814] border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>

                    {/* Quick Presets for this meal */}
                    <div className="space-y-1 pt-0.5">
                      <div className="text-[9px] font-mono uppercase text-slate-400">
                        Atajos y valores habituales:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {mealPresets[editingMealKey].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setEditingMealCalories(String(preset.val));
                              if (preset.desc) setEditingMealDescription(preset.desc);
                              if (soundEffectsOn) playTechBlip(620, 'sine', 0.03);
                            }}
                            className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono transition-all cursor-pointer ${
                              editingMealCalories === String(preset.val)
                                ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-sm'
                                : 'bg-[#0d1c3a] border-cyan-500/20 text-cyan-200 hover:border-cyan-400/50 hover:bg-[#142850]'
                            }`}
                          >
                            {preset.label} ({preset.val} kcal)
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dynamic Real-Time Preview of New Total */}
                    {(() => {
                      const curVal = todayCalorieLog?.[editingMealKey]?.totalCalories || 0;
                      const nextVal = parseInt(editingMealCalories, 10);
                      const validNext = isNaN(nextVal) ? curVal : Math.max(0, nextVal);
                      const diff = validNext - curVal;
                      const nextTotal = Math.max(0, caloriesConsumed + diff);
                      return (
                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#040814]/90 border border-[#1b2b4d] text-[10px] font-mono">
                          <span className="text-slate-400">Total diario resultante:</span>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-slate-400 line-through">{caloriesConsumed} kcal</span>
                            <span className="text-cyan-400 font-bold">→</span>
                            <span className="font-extrabold text-amber-300 font-mono text-xs">{nextTotal} kcal</span>
                            {diff !== 0 && (
                              <span className={`text-[9px] font-bold ${diff > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                ({diff > 0 ? `+${diff}` : `${diff}`})
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-1 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          handleSetMealExactCalories(editingMealKey, 0, 'Sin comida / Ayuno');
                        }}
                        className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-[10px] font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Marcar esta comida como 0 kcal"
                      >
                        Poner en 0 kcal
                      </button>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditingMealKey(null)}
                          className="px-3 py-1 rounded-lg text-slate-400 hover:text-white text-xs font-mono transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const val = parseInt(editingMealCalories, 10);
                            handleSetMealExactCalories(
                              editingMealKey,
                              isNaN(val) ? 0 : val,
                              editingMealDescription
                            );
                          }}
                          className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-[#38ef7d] hover:brightness-105 active:scale-95 text-slate-950 font-mono font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer transition-all flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Guardar {editingMealCalories || 0} kcal</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. CARD: HIDRATACIÓN & ACTIVIDAD */}
              <div className="p-2.5 rounded-xl bg-[#0c1833] border border-[#1b2b4d] flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-400/30 flex items-center justify-center text-blue-400">
                    <Droplets className="w-3.5 h-3.5 fill-blue-400/30" />
                  </div>
                  <div>
                    <div className="text-[9.5px] font-mono text-slate-400 uppercase">Hidratación Diaria</div>
                    <div className="text-xs font-mono font-bold text-cyan-200">
                      {waterGlasses} / 8 Vasos <span className="text-[10px] font-normal text-slate-400">({(waterGlasses * 0.25).toFixed(1)}L)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleUpdateWaterGlasses(-1)}
                    className="w-7 h-7 rounded-lg bg-[#142344] hover:bg-[#1a305e] text-slate-300 hover:text-white border border-[#273d6b] flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                    title="Restar 1 vaso de agua"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleUpdateWaterGlasses(1)}
                    className="w-7 h-7 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-cyan-200 border border-blue-400/40 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                    title="Sumar 1 vaso de agua (250ml)"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* 5. Bottom Shortcut Button to full Health Hub */}
              {onNavigateToHealth && (
                <button
                  onClick={() => {
                    if (soundEffectsOn) playTechBlip(500, 'sine', 0.05);
                    onNavigateToHealth();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#091e3f] to-[#0f2e5c] hover:from-[#0d2a58] hover:to-[#143b74] border border-cyan-400/40 text-cyan-200 text-xs font-mono font-bold flex items-center justify-center space-x-2 cursor-pointer transition-all active:scale-[0.99] shrink-0"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>Abrir Módulo de Salud & Nutrición Completo</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              )}

            </div>
          ) : (
            /* ==================================================== */
            /* TAB CONTENT: ASISTENTE NEXUS-07                      */
            /* ==================================================== */
            <div className="flex-1 min-h-0 flex flex-col overflow-y-auto space-y-2 py-1.5 pr-0.5 scrollbar-thin scrollbar-thumb-cyan-500/20">
              {/* Central Futuristic Cockpit Visual Display */}
              <div className="relative my-1 rounded-xl border border-cyan-500/30 bg-gradient-to-b from-[#0a1836] to-[#050b18] overflow-hidden p-2 flex flex-col justify-between h-28 sm:h-32 shadow-inner shrink-0">
                
                {/* SVG Holographic Cockpit HUD Graphics */}
                <div className="absolute inset-0 pointer-events-none opacity-40">
                  <svg className="w-full h-full" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Radar grid & arcs */}
                    <circle cx="200" cy="100" r="80" stroke="#00f2ff" strokeWidth="0.5" strokeDasharray="3 3" />
                    <circle cx="200" cy="100" r="50" stroke="#00f2ff" strokeWidth="0.75" />
                    <line x1="200" y1="20" x2="200" y2="180" stroke="#00f2ff" strokeWidth="0.5" strokeDasharray="2 4" />
                    <line x1="120" y1="100" x2="280" y2="100" stroke="#00f2ff" strokeWidth="0.5" strokeDasharray="2 4" />
                    {/* Cockpit canopy frames */}
                    <path d="M 0 0 L 100 80 L 100 160 L 0 200" stroke="#1e3a6d" strokeWidth="2" />
                    <path d="M 400 0 L 300 80 L 300 160 L 400 200" stroke="#1e3a6d" strokeWidth="2" />
                    {/* Cyber Companion Silhouette with Visor */}
                    <circle cx="200" cy="85" r="28" fill="#0d1b38" stroke="#00f2ff" strokeWidth="1.5" />
                    <path d="M 184 82 Q 200 88 216 82" stroke="#00f2ff" strokeWidth="3" strokeLinecap="round" />
                    <path d="M 160 160 Q 200 120 240 160" fill="#0c1833" stroke="#00f2ff" strokeWidth="1" />
                  </svg>
                </div>

                {/* Top Display Badges */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>FOCO ACTIVO</span>
                  </span>

                  <button
                    onClick={() => {
                      if (onConsultAgent) onConsultAgent();
                      else handleNextAdvice();
                    }}
                    className="px-2 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 text-[10px] font-mono font-bold flex items-center space-x-1 cursor-pointer transition-all active:scale-95"
                  >
                    <Sparkles className="w-3 h-3 text-[#00f2ff]" />
                    <span>CONSULTAR ASISTENTE</span>
                  </button>
                </div>

                {/* Dynamic Telemetry Soundwaves */}
                <div className="relative z-10 flex items-end justify-center space-x-1 py-4">
                  {[12, 24, 40, 60, 48, 80, 52, 90, 45, 68, 30, 18].map((h, i) => (
                    <div
                      key={i}
                      className="w-1.5 rounded-full bg-gradient-to-t from-cyan-500 to-[#38ef7d] transition-all duration-300"
                      style={{ height: `${Math.max(6, (h * (pomodoroRunning ? 1.2 : 0.6)) % 40)}px` }}
                    />
                  ))}
                </div>

                {/* Bottom Cockpit Tag */}
                <div className="relative z-10 flex items-center justify-between text-[9px] font-mono text-cyan-300/80">
                  <span className="truncate max-w-[70%] text-cyan-200">
                    {dailyFocus.mainFocus ? `🎯 ENFOQUE: ${dailyFocus.mainFocus}` : 'CANOPY // DOCK-01'}
                  </span>
                  <span className={`shrink-0 font-bold ${dailyFocus.mainFocusCompleted ? 'text-emerald-400' : 'text-cyan-400/80'}`}>
                    {dailyFocus.mainFocusCompleted ? '✓ LOGRADO (+50XP)' : 'TELEMETRÍA ESTABLE'}
                  </span>
                </div>
              </div>

              {/* Advice / Speech Bubble Box */}
              <div className="p-3 rounded-xl bg-[#0c1833] border border-[#1e2d4a] relative">
                <div className="flex items-center justify-between pb-1 text-[10px] font-mono text-slate-400">
                  <span className="text-[#00f2ff] font-bold flex items-center space-x-1">
                    <Radio className="w-3 h-3 text-[#00f2ff]" />
                    <span>CONSEJO DE PRODUCTIVIDAD:</span>
                  </span>
                  <span className="uppercase text-slate-500">Modo: {mood}</span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-sans italic pt-1">
                  "{currentAdvice}"
                </p>

                <div className="mt-2 flex items-center justify-end space-x-1">
                  <button
                    onClick={handleNextAdvice}
                    className="px-2 py-0.5 rounded bg-[#142344] hover:bg-[#1b2f5b] text-[10px] font-mono text-cyan-300 border border-[#273d6b] cursor-pointer transition-colors"
                  >
                    Siguiente Consejo ➔
                  </button>
                </div>
              </div>

              {/* Mini Health Status Ticker */}
              <div
                onClick={() => {
                  setRightPanelTab('health');
                  if (soundEffectsOn) playTechBlip(620, 'sine', 0.05);
                }}
                className="mt-2 p-2 rounded-xl bg-[#081329] border border-cyan-500/20 hover:border-cyan-400/50 flex items-center justify-between cursor-pointer transition-all group"
                title="Abrir Resumen de Salud & Fitness"
              >
                <div className="flex items-center space-x-2 text-[10.5px] font-mono">
                  <Scale className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-slate-300">Peso: <strong className="text-white">{latestWeight} kg</strong></span>
                  <span className="text-slate-600">|</span>
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-300">Calorías: <strong className="text-amber-300">{caloriesConsumed}/{targetCalories} kcal</strong></span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 group-hover:text-cyan-200 flex items-center space-x-0.5">
                  <span>Ver Bio-HUD</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              {/* Assistant Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={handleToggleVoice}
                  className="p-2 rounded-xl bg-[#0c1833] hover:bg-[#13234a] border border-[#1e2d4a] hover:border-cyan-400 text-xs font-mono text-slate-200 hover:text-white flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Comando de Voz</span>
                </button>

                <button
                  onClick={() => setIsSummaryModalOpen(true)}
                  className="p-2 rounded-xl bg-[#0c1833] hover:bg-[#13234a] border border-[#1e2d4a] hover:border-cyan-400 text-xs font-mono text-slate-200 hover:text-white flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Resumen del Día</span>
                </button>

                <button
                  onClick={() => setIsAmbientMenuOpen(true)}
                  className={`p-2 rounded-xl border text-xs font-mono flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    ambientAudioOn 
                      ? 'bg-cyan-500/20 border-cyan-400 text-[#00f2ff] shadow-sm' 
                      : 'bg-[#0c1833] hover:bg-[#13234a] border-[#1e2d4a] hover:border-cyan-400 text-slate-200 hover:text-white'
                  }`}
                  title={`Configurar Sonidos Ambientales (Actual: ${selectedAmbientInfo.name})`}
                >
                  <Headphones className={`w-3.5 h-3.5 ${ambientAudioOn ? 'text-[#00f2ff] animate-pulse' : 'text-[#38ef7d]'}`} />
                  <span className="truncate">{selectedAmbientInfo.icon} {selectedAmbientInfo.shortName} ({ambientAudioOn ? 'Activo' : 'Pausa'})</span>
                </button>

                <button
                  onClick={() => setIsBacklogModalOpen(true)}
                  className="p-2 rounded-xl bg-[#0c1833] hover:bg-[#13234a] border border-[#1e2d4a] hover:border-cyan-400 text-xs font-mono text-slate-200 hover:text-white flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Actividades ({ideas.length})</span>
                </button>
              </div>

              {/* Bottom Mood Selector Bar */}
              <div className="pt-2 flex items-center justify-between border-t border-[#1c2b4d] mt-2">
                <span className="text-[10px] font-mono text-slate-400">Estado de Ánimo:</span>
                <div className="flex items-center space-x-1.5">
                  {[
                    { id: 'focused', icon: '🎯', title: 'Focused' },
                    { id: 'energized', icon: '⚡', title: 'Energized' },
                    { id: 'calm', icon: '🌀', title: 'Zen Calm' },
                    { id: 'flow', icon: '🌊', title: 'Flow' }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setMood(m.id as MoodType);
                        if (soundEffectsOn) playTechBlip(620, 'sine', 0.04);
                      }}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all cursor-pointer ${
                        mood === m.id
                          ? 'bg-[#00f2ff]/25 border border-cyan-400 text-white shadow-sm shadow-[#00f2ff]/30 scale-105'
                          : 'bg-[#0c1833] border border-[#1e2d4a] text-slate-400 hover:text-white'
                      }`}
                      title={m.title}
                    >
                      {m.icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          </div>
        </div>
      )}

      {/* Floating HUD Shortcut Button for Nexus & Salud */}
      {!isNexusDrawerOpen && (
        <button
          onClick={() => {
            setIsNexusDrawerOpen(true);
            if (soundEffectsOn) playTechBlip(620, 'sine', 0.04);
          }}
          className="fixed bottom-4 right-4 z-40 px-3 py-2 rounded-2xl bg-[#0a1326]/95 hover:bg-[#0e1d3d] border border-cyan-400/50 hover:border-cyan-300 text-white font-mono text-xs font-bold shadow-2xl shadow-cyan-950/60 flex items-center space-x-2 backdrop-blur-md cursor-pointer transition-all hover:scale-105 active:scale-95 group"
          title="Abrir Asistente Nexus-07 & Bio-Salud"
        >
          <div className="relative">
            <Bot className="w-4 h-4 text-[#00f2ff] group-hover:rotate-12 transition-transform" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 animate-pulse" />
          </div>
          <span className="text-cyan-200">Nexus & Salud</span>
          <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-500/30" />
        </button>
      )}

      {/* ======================================================== */}
      {/* MODAL: RESUMEN EJECUTIVO DEL DÍA                         */}
      {/* ======================================================== */}
      {isSummaryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0d1629] border border-cyan-400/40 rounded-2xl p-5 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f2d4a]">
              <div className="flex items-center space-x-2 text-[#00f2ff] font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>RESUMEN EJECUTIVO DEL DÍA</span>
              </div>
              <button onClick={() => setIsSummaryModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 font-sans text-slate-200">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 rounded-xl bg-[#09101f] border border-slate-800">
                  <p className="text-[10px] font-mono text-slate-400">Progreso Diario</p>
                  <p className="text-xl font-mono font-bold text-cyan-300 mt-1">{dailyProgressPercent}%</p>
                </div>
                <div className="p-3 rounded-xl bg-[#09101f] border border-slate-800">
                  <p className="text-[10px] font-mono text-slate-400">XP Acumulado</p>
                  <p className="text-xl font-mono font-bold text-emerald-400 mt-1">{totalXP} XP</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#09101f] border border-slate-800 space-y-1.5">
                <h4 className="text-xs font-mono font-bold text-cyan-300 uppercase">Estado Táctico:</h4>
                <p className="text-xs text-slate-300">
                  Tienes <span className="text-cyan-200 font-bold">{pendingTasksCount} tareas pendientes</span> para completar tu cuota de hoy.
                  El modo actual es <span className="text-amber-300 font-bold capitalize">{mood}</span>.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsSummaryModalOpen(false)}
                className="px-4 py-1.5 bg-[#00f2ff] text-[#00363a] font-bold rounded-xl hover:brightness-110"
              >
                Cerrar Resumen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: BANDEJA DE ACTIVIDADES PENDIENTES                  */}
      {/* ======================================================== */}
      {isBacklogModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0d1629] border border-cyan-400/40 rounded-2xl p-5 shadow-2xl space-y-4 font-mono text-xs max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f2d4a]">
              <div className="flex items-center space-x-2 text-cyan-300 font-bold text-sm">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>BANDEJA DE ACTIVIDADES & IDEAS ({ideas.length})</span>
              </div>
              <button onClick={() => setIsBacklogModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-sans">
              {ideas.length === 0 ? (
                <p className="text-center py-6 text-slate-500 italic">No hay ideas registradas en el backlog.</p>
              ) : (
                ideas.slice(0, 15).map(i => (
                  <div key={i.id} className="p-2.5 rounded-xl bg-[#09101f] border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{i.title}</p>
                      <p className="text-[10px] text-slate-400">{i.type || 'Idea'} • {i.createdAt}</p>
                    </div>
                    <button
                      onClick={() => {
                        handleQuickCreateTask(i.title, 'media');
                        setIsBacklogModalOpen(false);
                      }}
                      className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 text-[10px] font-mono hover:bg-cyan-500/30"
                    >
                      Mover a Hoy
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#1f2d4a]">
              <button
                onClick={() => setIsBacklogModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Morning Briefing Modal (Resumen de Ayer & Panorama de Hoy) */}
      <DailyBriefingModal
        isOpen={isDailyBriefingOpen}
        onClose={() => setIsDailyBriefingOpen(false)}
        tasks={tasks}
        habits={habits}
        calorieLogs={calorieLogs}
        weightLogs={weightLogs}
        healthProfile={healthProfile}
        todayStr={todayStr}
        onRolloverTask={onRolloverTask || onUpdateTask}
        onSelectHealthDate={(date) => {
          setSelectedHealthDate(date);
        }}
        onOpenQuickCalorie={() => {
          setIsQuickCalorieOpen(true);
        }}
      />

      {/* Toast Notification for Rollovers & Quick Actions */}
      {toastNotification.show && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-[#09152b] border border-amber-400/80 text-amber-200 text-xs font-mono font-bold shadow-2xl shadow-amber-950/60 flex items-center space-x-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <RotateCcw className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />
          <span>{toastNotification.message}</span>
        </div>
      )}

    </div>
  );
};
