import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Sunrise, 
  Sunset, 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudSun, 
  CloudLightning, 
  Snowflake,
  Wind, 
  Droplets, 
  Thermometer, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Flame, 
  Sparkles, 
  RotateCcw, 
  ArrowRight, 
  Target, 
  Utensils, 
  RefreshCw,
  Award,
  ChevronRight,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { Task, Habit, DailyCalorieLog, HealthProfile, WeightLogEntry } from '../types';
import { isHabitCompletedOn } from '../utils/habitHelpers';

interface DailyBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  habits: Habit[];
  calorieLogs?: DailyCalorieLog[];
  weightLogs?: WeightLogEntry[];
  healthProfile?: HealthProfile;
  todayStr: string;
  onRolloverTask?: (task: Task) => void;
  onSelectHealthDate?: (dateStr: string) => void;
  onOpenQuickCalorie?: () => void;
}

interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  description: string;
  city?: string;
  isFallback?: boolean;
}

export const DailyBriefingModal: React.FC<DailyBriefingModalProps> = ({
  isOpen,
  onClose,
  tasks = [],
  habits = [],
  calorieLogs = [],
  weightLogs = [],
  healthProfile,
  todayStr,
  onRolloverTask,
  onSelectHealthDate,
  onOpenQuickCalorie
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'yesterday' | 'full'>('full');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  // Compute Yesterday Date String
  const yesterdayStr = useMemo(() => {
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

  // Formatted date labels
  const formattedToday = useMemo(() => {
    try {
      const [y, m, d] = todayStr.split('-').map(Number);
      const date = new Date(y, m - 1, d, 12, 0, 0);
      return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return todayStr;
    }
  }, [todayStr]);

  const formattedYesterday = useMemo(() => {
    try {
      const [y, m, d] = yesterdayStr.split('-').map(Number);
      const date = new Date(y, m - 1, d, 12, 0, 0);
      return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    } catch {
      return yesterdayStr;
    }
  }, [yesterdayStr]);

  // Weather Code Translation
  const getWeatherDescription = (code: number): { text: string; icon: React.ReactNode; advice: string } => {
    if (code === 0) {
      return { 
        text: 'Cielo Despejado y Soleado', 
        icon: <Sun className="w-6 h-6 text-amber-400" />,
        advice: 'Excelente día para una caminata de 20 min y cumplir tus hábitos al aire libre.'
      };
    }
    if (code >= 1 && code <= 3) {
      return { 
        text: 'Parcialmente Nublado / Agradable', 
        icon: <CloudSun className="w-6 h-6 text-cyan-300" />,
        advice: 'Clima fresco y propicio para balancear trabajo enfocado y movimiento.'
      };
    }
    if (code === 45 || code === 48) {
      return { 
        text: 'Niebla / Neblina', 
        icon: <Cloud className="w-6 h-6 text-slate-400" />,
        advice: 'Visibilidad reducida en exteriores; ideal para bloques de concentración.'
      };
    }
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
      return { 
        text: 'Lluvia / Llovizna', 
        icon: <CloudRain className="w-6 h-6 text-sky-400" />,
        advice: 'Lluvia en el pronóstico: lleva paraguas y aprovecha para trabajar en interiores.'
      };
    }
    if (code >= 71 && code <= 77) {
      return { 
        text: 'Nieve / Bajas Temperaturas', 
        icon: <Snowflake className="w-6 h-6 text-cyan-200" />,
        advice: 'Ambiente frío: mantén buena hidratación y calistenia suave.'
      };
    }
    if (code >= 95) {
      return { 
        text: 'Tormenta Eléctrica', 
        icon: <CloudLightning className="w-6 h-6 text-amber-400" />,
        advice: 'Tormenta prevista: mantén tus actividades protegidas y planifica tareas digitales.'
      };
    }
    return { 
      text: 'Tiempo Templado', 
      icon: <CloudSun className="w-6 h-6 text-cyan-300" />,
      advice: 'Buen día para avanzar de forma constante en tus prioridades.'
    };
  };

  // Weather fetcher with geolocation and fallback
  const fetchWeather = async () => {
    setIsLoadingWeather(true);

    const fallbackCoord = { lat: 4.71, lon: -74.07, city: 'Local' };

    const queryApi = async (lat: number, lon: number, cityName?: string) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Weather API error');
        const data = await res.json();
        const current = data.current;
        const code = current.weather_code ?? 0;
        const desc = getWeatherDescription(code);

        setWeather({
          temperature: Math.round(current.temperature_2m),
          apparentTemperature: Math.round(current.apparent_temperature ?? current.temperature_2m),
          humidity: Math.round(current.relative_humidity_2m),
          windSpeed: Math.round(current.wind_speed_10m),
          weatherCode: code,
          description: desc.text,
          city: cityName,
          isFallback: false
        });
      } catch (err) {
        console.warn('Could not fetch Open-Meteo weather:', err);
        setWeather({
          temperature: 22,
          apparentTemperature: 22,
          humidity: 55,
          windSpeed: 8,
          weatherCode: 1,
          description: 'Agradable / Parcialmente Soleado',
          city: 'Estimado',
          isFallback: true
        });
      } finally {
        setIsLoadingWeather(false);
      }
    };

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          queryApi(pos.coords.latitude, pos.coords.longitude, 'Tu Ubicación');
        },
        () => {
          queryApi(fallbackCoord.lat, fallbackCoord.lon, fallbackCoord.city);
        },
        { timeout: 3500 }
      );
    } else {
      queryApi(fallbackCoord.lat, fallbackCoord.lon, fallbackCoord.city);
    }
  };

  useEffect(() => {
    if (isOpen && !weather) {
      fetchWeather();
    }
  }, [isOpen]);

  // =========================================================================
  // YESTERDAY'S RECAP CALCULATIONS
  // =========================================================================
  const yesterdayTasks = useMemo(() => {
    return tasks.filter(t => t.assignedDate === yesterdayStr || (!t.assignedDate && t.dueDate === yesterdayStr));
  }, [tasks, yesterdayStr]);

  const yesterdayCompletedTasks = useMemo(() => {
    return yesterdayTasks.filter(t => t.status === 'completada');
  }, [yesterdayTasks]);

  const yesterdayPendingTasks = useMemo(() => {
    return yesterdayTasks.filter(t => t.status !== 'completada' && t.status !== 'cancelada');
  }, [yesterdayTasks]);

  const yesterdayPendingLaboralTasks = useMemo(() => {
    return yesterdayPendingTasks.filter(t => 
      t.isJobTask || 
      t.category === 'trabajo_laboral' || 
      t.category === 'trabajo' || 
      (t.tags && t.tags.some(tag => tag.toLowerCase().includes('laboral') || tag.toLowerCase().includes('trabajo')))
    );
  }, [yesterdayPendingTasks]);

  // Habits completed yesterday
  const activeHabits = useMemo(() => habits.filter(h => !h.archived), [habits]);
  const yesterdayCompletedHabits = useMemo(() => {
    return activeHabits.filter(h => isHabitCompletedOn(h, yesterdayStr));
  }, [activeHabits, yesterdayStr]);

  const yesterdayHabitCompliancePercent = activeHabits.length > 0
    ? Math.round((yesterdayCompletedHabits.length / activeHabits.length) * 100)
    : 0;

  // Calorie & Nutrition log for yesterday
  const yesterdayCalorieLog = useMemo(() => {
    return calorieLogs.find(l => l.date === yesterdayStr) || null;
  }, [calorieLogs, yesterdayStr]);

  const yesterdayCaloriesConsumed = yesterdayCalorieLog?.totalCaloriesConsumed || 0;
  const yesterdayWaterGlasses = yesterdayCalorieLog?.waterGlasses || 0;

  // Weight for yesterday (if recorded)
  const yesterdayWeightEntry = useMemo(() => {
    return weightLogs.find(w => w.date === yesterdayStr) || null;
  }, [weightLogs, yesterdayStr]);

  // =========================================================================
  // TODAY'S OUTLOOK CALCULATIONS
  // =========================================================================
  const todayTasks = useMemo(() => {
    return tasks.filter(t => t.assignedDate === todayStr || (!t.assignedDate && t.dueDate === todayStr));
  }, [tasks, todayStr]);

  const todayCompletedTasks = useMemo(() => {
    return todayTasks.filter(t => t.status === 'completada');
  }, [todayTasks]);

  const todayPendingTasks = useMemo(() => {
    return todayTasks.filter(t => t.status !== 'completada' && t.status !== 'cancelada');
  }, [todayTasks]);

  // Urgent / High priority tasks for today
  const todayUrgentTasks = useMemo(() => {
    return todayPendingTasks.filter(t => t.priority === 'urgente' || t.priority === 'alta');
  }, [todayPendingTasks]);

  // Tasks rolled over from yesterday
  const todayRolloverTasks = useMemo(() => {
    return todayPendingTasks.filter(t => 
      t.isRollover || 
      (t.rolloverCount && t.rolloverCount > 0) || 
      t.postponedFromDate === yesterdayStr || 
      t.rolledOverFromDate === yesterdayStr
    );
  }, [todayPendingTasks, yesterdayStr]);

  // Today's scheduled habits
  const todayTimedHabits = useMemo(() => {
    return activeHabits.filter(h => h.targetTime).sort((a, b) => (a.targetTime || '').localeCompare(b.targetTime || ''));
  }, [activeHabits]);

  // Today's completed habits so far
  const todayCompletedHabits = useMemo(() => {
    return activeHabits.filter(h => isHabitCompletedOn(h, todayStr));
  }, [activeHabits, todayStr]);

  // Quick Action: Fill yesterday's food
  const handleGoFillYesterdayFood = () => {
    if (onSelectHealthDate) {
      onSelectHealthDate(yesterdayStr);
    }
    if (onOpenQuickCalorie) {
      onOpenQuickCalorie();
    }
    onClose();
  };

  // Quick Action: Batch rollover remaining yesterday tasks
  const handleBatchRolloverYesterdayTasks = () => {
    if (!onRolloverTask) return;
    yesterdayPendingTasks.forEach(task => {
      onRolloverTask(task);
    });
  };

  if (!isOpen) return null;

  const weatherDetails = weather ? getWeatherDescription(weather.weatherCode) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[92vh] rounded-3xl bg-[#091122] border border-cyan-500/40 shadow-2xl shadow-cyan-950/40 flex flex-col overflow-hidden text-slate-100 font-sans">
        
        {/* ================================================================ */}
        {/* TOP HEADER: GREETING & TABS                                      */}
        {/* ================================================================ */}
        <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-[#070e1c] via-[#0c1830] to-[#070e1c] border-b border-[#1b2b4d] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/25 to-orange-500/25 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-[0_0_15px_#f59e0b35]">
              <Sunrise className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-white font-mono">
                  BRIEFING DIARIO // DESKBUDDY
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-[#00f2ff] border border-cyan-400/40 text-[10px] font-mono font-bold uppercase">
                  Comienzo del Día
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono flex items-center space-x-1.5 capitalize">
                <span>{formattedToday}</span>
              </p>
            </div>
          </div>

          {/* View Tab Selector */}
          <div className="flex items-center space-x-1 bg-[#060c18] p-1 rounded-xl border border-[#1b2b4d] text-xs font-mono">
            <button
              onClick={() => setActiveTab('full')}
              className={`px-3 py-1 rounded-lg transition-all font-bold cursor-pointer ${
                activeTab === 'full'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Panorama Completo
            </button>
            <button
              onClick={() => setActiveTab('today')}
              className={`px-3 py-1 rounded-lg transition-all font-bold cursor-pointer ${
                activeTab === 'today'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setActiveTab('yesterday')}
              className={`px-3 py-1 rounded-lg transition-all font-bold cursor-pointer ${
                activeTab === 'yesterday'
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ayer
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* MODAL BODY (SCROLLABLE)                                          */}
        {/* ================================================================ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-cyan-500/20">
          
          {/* ============================================================== */}
          {/* WEATHER FORECAST STRIP                                         */}
          {/* ============================================================== */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#071329] via-[#0b1c3c] to-[#071329] border border-cyan-500/35 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#091836] border border-cyan-400/40 flex items-center justify-center shrink-0 shadow-inner">
                {weatherDetails?.icon || <CloudSun className="w-6 h-6 text-cyan-300 animate-pulse" />}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5" />
                    <span>Pronóstico Meteorológico</span>
                  </span>
                  {weather?.city && (
                    <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-200 text-[9px] font-mono flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" />
                      {weather.city}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline space-x-2 pt-0.5">
                  <span className="text-2xl font-black font-mono text-white">
                    {weather ? `${weather.temperature}°C` : '--°C'}
                  </span>
                  <span className="text-xs text-slate-300 font-medium">
                    {weather ? weather.description : 'Cargando clima en vivo...'}
                  </span>
                  {weather?.apparentTemperature !== undefined && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      (Sensación: {weather.apparentTemperature}°C)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Weather Metrics & Advice */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              {weather && (
                <div className="flex items-center space-x-3 text-slate-400 border-l border-[#192b50] pl-3">
                  <div className="flex items-center space-x-1" title="Humedad relativa">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-slate-200">{weather.humidity}%</span>
                  </div>
                  <div className="flex items-center space-x-1" title="Velocidad del viento">
                    <Wind className="w-3.5 h-3.5 text-teal-400" />
                    <span className="text-slate-200">{weather.windSpeed} km/h</span>
                  </div>
                </div>
              )}

              {weatherDetails?.advice && (
                <div className="text-[11px] text-amber-200/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-xl max-w-sm">
                  💡 {weatherDetails.advice}
                </div>
              )}

              <button
                type="button"
                onClick={fetchWeather}
                disabled={isLoadingWeather}
                className="p-1.5 rounded-lg bg-[#0b1730] hover:bg-[#12254d] text-cyan-400 border border-cyan-500/30 transition-colors cursor-pointer"
                title="Actualizar pronóstico"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWeather ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* TWO MAIN COLUMNS: YESTERDAY RECAP & TODAY OUTLOOK              */}
          {/* ============================================================== */}
          <div className={`grid gap-4 ${activeTab === 'full' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            
            {/* ------------------------------------------------------------ */}
            {/* COLUMN 1: RESUMEN DE AYER (CÓMO ESTUVO)                      */}
            {/* ------------------------------------------------------------ */}
            {(activeTab === 'full' || activeTab === 'yesterday') && (
              <div className="rounded-2xl bg-[#070e1c] border border-purple-500/30 p-4 space-y-3.5 flex flex-col justify-between shadow-lg">
                <div className="space-y-3">
                  {/* Column Header */}
                  <div className="flex items-center justify-between border-b border-[#18233c] pb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center">
                        <Sunset className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-mono font-black uppercase text-purple-200 tracking-wider">
                          RESUMEN DE AYER
                        </h3>
                        <p className="text-[10px] text-slate-400 capitalize">
                          {formattedYesterday}
                        </p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      yesterdayCompletedTasks.length > 0 && yesterdayPendingTasks.length === 0
                        ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                        : 'bg-purple-500/20 border-purple-400/40 text-purple-300'
                    }`}>
                      {yesterdayTasks.length > 0 
                        ? `${yesterdayCompletedTasks.length}/${yesterdayTasks.length} Tareas Hechas`
                        : 'Sin tareas agendadas'}
                    </span>
                  </div>

                  {/* 1. Yesterday Task Performance */}
                  <div className="p-3 rounded-xl bg-[#091428] border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Cumplimiento de Tareas:</span>
                      </span>
                      <span className="text-emerald-300 font-bold">
                        {yesterdayTasks.length > 0 
                          ? `${Math.round((yesterdayCompletedTasks.length / yesterdayTasks.length) * 100)}%` 
                          : '100%'}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-400 to-emerald-400 transition-all"
                        style={{ 
                          width: `${yesterdayTasks.length > 0 ? (yesterdayCompletedTasks.length / yesterdayTasks.length) * 100 : 100}%` 
                        }}
                      />
                    </div>

                    {/* Pending tasks warning if any left */}
                    {yesterdayPendingTasks.length > 0 ? (
                      <div className="pt-1 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-mono text-amber-300">
                          <span className="flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                            <span>{yesterdayPendingTasks.length} tarea(s) quedaron pendientes</span>
                          </span>
                          {onRolloverTask && (
                            <button
                              type="button"
                              onClick={handleBatchRolloverYesterdayTasks}
                              className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <RotateCcw className="w-2.5 h-2.5" />
                              <span>Mover a Hoy</span>
                            </button>
                          )}
                        </div>

                        {/* List preview of yesterday's uncompleted tasks */}
                        <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                          {yesterdayPendingTasks.map(task => (
                            <div 
                              key={task.id}
                              className="p-1.5 rounded-lg bg-[#0c1830] border border-amber-500/20 text-xs flex items-center justify-between gap-2"
                            >
                              <div className="truncate text-slate-300">
                                {task.isJobTask && <span className="text-amber-400 font-mono text-[10px] mr-1">[Laboral]</span>}
                                <span>{task.title}</span>
                              </div>
                              {onRolloverTask && (
                                <button
                                  type="button"
                                  onClick={() => onRolloverTask(task)}
                                  className="shrink-0 p-1 rounded bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-[10px] font-mono font-bold cursor-pointer transition-colors"
                                  title="Pasar a hoy"
                                >
                                  Rodar &gt;
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 pt-0.5">
                        <Sparkles className="w-3 h-3" />
                        <span>¡Gran jornada! Todas las metas asignadas fueron concluidas.</span>
                      </p>
                    )}
                  </div>

                  {/* 2. Yesterday Habits Score */}
                  <div className="p-3 rounded-xl bg-[#091428] border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span>Hábitos de Ayer:</span>
                      </span>
                      <span className="text-amber-300 font-bold">
                        {yesterdayCompletedHabits.length} de {activeHabits.length} ({yesterdayHabitCompliancePercent}%)
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all"
                        style={{ width: `${yesterdayHabitCompliancePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* 3. Yesterday Nutrition & Calorie Status */}
                  <div className="p-3 rounded-xl bg-[#091428] border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Alimentación y Calorías de Ayer:</span>
                      </span>
                      {yesterdayCalorieLog ? (
                        <span className="text-cyan-300 font-bold">
                          {yesterdayCaloriesConsumed} kcal
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold text-[10px]">
                          Sin Registro
                        </span>
                      )}
                    </div>

                    {yesterdayCalorieLog ? (
                      <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[10px] pt-1">
                        <div className="p-1.5 rounded bg-[#0c1830] border border-slate-800">
                          <span className="text-slate-400 block text-[9px]">Ingesta</span>
                          <span className="text-amber-300 font-bold">{yesterdayCaloriesConsumed} kcal</span>
                        </div>
                        <div className="p-1.5 rounded bg-[#0c1830] border border-slate-800">
                          <span className="text-slate-400 block text-[9px]">Agua</span>
                          <span className="text-cyan-300 font-bold">{yesterdayWaterGlasses} vasos</span>
                        </div>
                        <div className="p-1.5 rounded bg-[#0c1830] border border-slate-800">
                          <span className="text-slate-400 block text-[9px]">Desglose</span>
                          <span className="text-emerald-300 font-bold">
                            {(yesterdayCalorieLog.breakfast?.totalCalories || 0) + (yesterdayCalorieLog.lunch?.totalCalories || 0)}/{(yesterdayCalorieLog.dinner?.totalCalories || 0) + (yesterdayCalorieLog.snacks?.totalCalories || 0)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2">
                        <p className="text-[11px] text-amber-200 leading-tight">
                          No registraste tu alimentación de ayer. ¿Deseas completarla ahora?
                        </p>
                        <button
                          type="button"
                          onClick={handleGoFillYesterdayFood}
                          className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-mono font-bold cursor-pointer transition-colors shadow-sm"
                        >
                          Llenar Ayer &gt;
                        </button>
                      </div>
                    )}

                    {yesterdayWeightEntry && (
                      <p className="text-[10px] font-mono text-slate-400">
                        ⚖️ Peso registrado ayer: <strong className="text-white">{yesterdayWeightEntry.weight} kg</strong>
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Yesterday CTA */}
                <div className="pt-2 border-t border-[#18233c] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">
                    {yesterdayCompletedTasks.length > 0 ? '🏆 Registro archivado' : 'Sin actividad registrada'}
                  </span>
                  <button
                    type="button"
                    onClick={handleGoFillYesterdayFood}
                    className="text-xs font-mono text-cyan-300 hover:text-cyan-200 flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Editar Salud de Ayer</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* COLUMN 2: PANORAMA DE HOY (TU PLAN DE CONQUISTA)             */}
            {/* ------------------------------------------------------------ */}
            {(activeTab === 'full' || activeTab === 'today') && (
              <div className="rounded-2xl bg-[#070e1c] border border-cyan-500/35 p-4 space-y-3.5 flex flex-col justify-between shadow-lg">
                <div className="space-y-3">
                  {/* Column Header */}
                  <div className="flex items-center justify-between border-b border-[#18233c] pb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center">
                        <Sunrise className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-mono font-black uppercase text-cyan-200 tracking-wider">
                          PANORAMA DE HOY
                        </h3>
                        <p className="text-[10px] text-slate-400 capitalize">
                          {formattedToday}
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
                      {todayPendingTasks.length} Tareas Pendientes
                    </span>
                  </div>

                  {/* 1. URGENT / HIGH PRIORITY TASKS ALERT */}
                  {todayUrgentTasks.length > 0 && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1.5 animate-in fade-in">
                      <div className="flex items-center justify-between text-xs font-mono font-bold text-rose-300">
                        <span className="flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-rose-400" />
                          <span>🚨 Prioridades Críticas de Hoy ({todayUrgentTasks.length})</span>
                        </span>
                        <span className="text-[10px] uppercase text-rose-400">Atender primero</span>
                      </div>

                      <div className="space-y-1">
                        {todayUrgentTasks.slice(0, 3).map(task => (
                          <div 
                            key={task.id}
                            className="p-1.5 rounded-lg bg-[#0e172a] border border-rose-500/20 text-xs flex items-center justify-between"
                          >
                            <span className="font-semibold text-white truncate">{task.title}</span>
                            {task.timeSlot && (
                              <span className="font-mono text-[10px] text-rose-300 shrink-0">{task.timeSlot}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. TASKS ROLLED OVER FROM YESTERDAY (ORANGE BADGE) */}
                  {todayRolloverTasks.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-300">
                        <span className="flex items-center gap-1.5">
                          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                          <span>🔄 Tareas que vienen de ayer ({todayRolloverTasks.length})</span>
                        </span>
                        <span className="text-[10px] text-amber-400 uppercase">Posponidas</span>
                      </div>

                      <div className="space-y-1">
                        {todayRolloverTasks.slice(0, 3).map(task => (
                          <div 
                            key={task.id}
                            className="p-1.5 rounded-lg bg-[#0e172a] border border-amber-500/20 text-xs flex items-center justify-between"
                          >
                            <span className="text-slate-200 truncate">{task.title}</span>
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono shrink-0">
                              Ayer
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. ALL TODAY'S TASKS BREAKDOWN */}
                  <div className="p-3 rounded-xl bg-[#091428] border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-[#00f2ff]" />
                        <span>Compromisos en Agenda de Hoy:</span>
                      </span>
                      <span className="text-cyan-300 font-bold">
                        {todayCompletedTasks.length}/{todayTasks.length} listos
                      </span>
                    </div>

                    {todayPendingTasks.length === 0 ? (
                      <p className="text-xs text-emerald-400 font-mono flex items-center gap-1.5 py-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>No tienes tareas pendientes programadas para hoy.</span>
                      </p>
                    ) : (
                      <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                        {todayPendingTasks.slice(0, 5).map(task => (
                          <div 
                            key={task.id}
                            className="p-1.5 rounded-lg bg-[#0b162c] border border-slate-800 text-xs flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center space-x-1.5 truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                              <span className="truncate text-slate-200">{task.title}</span>
                            </div>
                            {task.timeSlot ? (
                              <span className="text-[10px] font-mono text-cyan-300 shrink-0">{task.timeSlot}</span>
                            ) : (
                              <span className="text-[9.5px] font-mono text-slate-500 shrink-0">Hoy</span>
                            )}
                          </div>
                        ))}
                        {todayPendingTasks.length > 5 && (
                          <p className="text-[10px] text-slate-400 text-center font-mono pt-0.5">
                            + {todayPendingTasks.length - 5} tarea(s) más en tu agenda
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 4. TODAY'S HABITS TO CRUSH */}
                  <div className="p-3 rounded-xl bg-[#091428] border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span>Micro-Hábitos para Hoy:</span>
                      </span>
                      <span className="text-amber-300 font-bold">
                        {todayCompletedHabits.length}/{activeHabits.length} completados
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {activeHabits.slice(0, 6).map(habit => {
                        const isDone = isHabitCompletedOn(habit, todayStr);
                        return (
                          <div
                            key={habit.id}
                            className={`px-2 py-1 rounded-lg border text-[10px] font-mono flex items-center space-x-1.5 ${
                              isDone
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 line-through opacity-70'
                                : 'bg-[#0c1830] border-slate-700 text-slate-200'
                            }`}
                          >
                            <span>{habit.emoji || '✨'}</span>
                            <span className="truncate max-w-[120px]">{habit.title}</span>
                            {habit.targetTime && (
                              <span className="text-amber-400 font-bold text-[9px]">
                                {habit.targetTime}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bottom Today CTA */}
                <div className="pt-2 border-t border-[#18233c] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-cyan-300 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Construyendo tu racha de hoy</span>
                  </span>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs cursor-pointer transition-colors shadow-md active:scale-95"
                  >
                    ¡A por el día! &gt;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* DAILY MOTIVATION & FOCUS MESSAGE STRIP                         */}
          {/* ============================================================== */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-emerald-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-slate-200 leading-snug">
                <strong className="text-amber-300">Enfoque de Hoy:</strong> Prioriza las tareas urgentes durante la primera mitad del día y cuida tu balance de hidratación y déficit calórico.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:brightness-110 text-slate-950 font-black text-xs cursor-pointer transition-all shadow-md active:scale-95"
            >
              Comenzar Jornada
            </button>
          </div>

        </div>

        {/* ================================================================ */}
        {/* MODAL FOOTER                                                     */}
        {/* ================================================================ */}
        <div className="px-6 py-3 bg-[#070e1a] border-t border-[#1b2b4d] flex items-center justify-between text-xs font-mono text-slate-400 shrink-0">
          <div className="flex items-center space-x-3">
            <span>DeskBuddy HUD • Always-On Assistant</span>
            {yesterdayPendingTasks.length > 0 && (
              <span className="text-amber-400 font-bold">
                ⚠️ {yesterdayPendingTasks.length} pendiente(s) de ayer
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
