import React, { useState } from 'react';
import { Habit, CategoryInfo } from '../types';
import { useTheme } from '../context/ThemeContext';
import { HABITS_HERO_IMAGE } from '../data/initialData';
import { 
  getLastNDays, 
  isHabitCompletedOn, 
  getHabitsTodayStats, 
  getTodayDateString 
} from '../utils/habitHelpers';
import { HabitComplianceTrendChart } from './HabitComplianceTrendChart';
import { HabitNotificationBanner } from './HabitNotificationBanner';
import { 
  Sparkles, 
  Plus, 
  Flame, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  Award, 
  Trash2, 
  Edit3, 
  Search, 
  Filter, 
  Check, 
  TrendingUp, 
  Activity, 
  Zap,
  Info,
  Archive,
  RefreshCw,
  BarChart2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface HabitTrackerViewProps {
  habits: Habit[];
  categories: CategoryInfo[];
  onToggleHabitDay: (habitId: string, dateStr: string) => void;
  onOpenNewHabitModal: () => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
  onArchiveHabit?: (habitId: string) => void;
  onRestoreDefaultHabits?: () => void;
  onOpenNotifications?: () => void;
}

export const HabitTrackerView: React.FC<HabitTrackerViewProps> = ({
  habits,
  categories,
  onToggleHabitDay,
  onOpenNewHabitModal,
  onEditHabit,
  onDeleteHabit,
  onArchiveHabit,
  onRestoreDefaultHabits,
  onOpenNotifications,
}) => {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'pending_today' | 'completed_today'>('all');
  const [showTrendChart, setShowTrendChart] = useState(true);

  const todayStr = getTodayDateString();
  const weekDays = getLastNDays(7); // Last 7 days for the streak matrix

  const safeHabits = Array.isArray(habits) ? habits : [];
  const stats = getHabitsTodayStats(safeHabits);

  // Filter habits
  const filteredHabits = safeHabits.filter((habit) => {
    if (habit.archived) return false;
    const matchesSearch = 
      (habit.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (habit.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCat = selectedCategory === 'all' || habit.category === selectedCategory;
    
    const isCompletedToday = isHabitCompletedOn(habit, todayStr);
    let matchesStatus = true;
    if (filterMode === 'pending_today') matchesStatus = !isCompletedToday;
    if (filterMode === 'completed_today') matchesStatus = isCompletedToday;

    return matchesSearch && matchesCat && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner / Summary Card with Themed Human-Centric Image */}
      <div className={`relative rounded-3xl overflow-hidden border shadow-2xl p-5 sm:p-7 transition-all ${
        isDark
          ? 'border-[#2d3a58] bg-gradient-to-br from-[#131d36] via-[#0f172a] to-[#090e1c]'
          : 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 shadow-emerald-950/5'
      }`}>
        
        {/* Glow ambient background */}
        <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
          isDark ? 'bg-emerald-500/10' : 'bg-emerald-300/30'
        }`} />
        <div className={`absolute bottom-0 left-10 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
          isDark ? 'bg-cyan-500/10' : 'bg-cyan-300/30'
        }`} />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          <div className="lg:col-span-8 space-y-3">
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono font-semibold border ${
              isDark
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-emerald-100 border-emerald-300 text-emerald-900'
            }`}>
              <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>Capa de Hábitos & Micro-acciones Diarias</span>
            </div>

            <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Habit Tracker: Construye Tu Rutina Diaria
            </h2>

            <p className={`text-xs sm:text-sm leading-relaxed ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Seguimiento de pequeñas tareas cotidianas que sostienen tu vida: <strong>barrer la casa</strong>, <strong>pasear la mascota</strong>, <strong>caminar 30 minutos</strong> o meditar. Mantén tu racha activa todos los días.
            </p>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <div className={`flex items-center space-x-2.5 px-3 py-1.5 border rounded-2xl ${
                isDark ? 'bg-[#0b1326]/80 border-[#2d3a58]' : 'bg-white/90 border-emerald-200 shadow-sm'
              }`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <div>
                  <div className={`text-[10px] font-mono uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Hoy Completados</div>
                  <div className={`text-xs sm:text-sm font-bold font-mono ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                    {stats.completedCount} / {stats.total} ({stats.percentage}%)
                  </div>
                </div>
              </div>

              <div className={`flex items-center space-x-2.5 px-3 py-1.5 border rounded-2xl ${
                isDark ? 'bg-[#0b1326]/80 border-[#2d3449]' : 'bg-white/90 border-amber-200 shadow-sm'
              }`}>
                <Flame className="w-4 h-4 text-amber-500" />
                <div>
                  <div className={`text-[10px] font-mono uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Mejor Racha</div>
                  <div className={`text-xs sm:text-sm font-bold font-mono ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                    {stats.bestStreakOverall} días seguidos 🔥
                  </div>
                </div>
              </div>

              <div className={`flex items-center space-x-2.5 px-3 py-1.5 border rounded-2xl ${
                isDark ? 'bg-[#0b1326]/80 border-[#2d3449]' : 'bg-white/90 border-cyan-200 shadow-sm'
              }`}>
                <Zap className="w-4 h-4 text-cyan-500" />
                <div>
                  <div className={`text-[10px] font-mono uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Check-ins Totales</div>
                  <div className={`text-xs sm:text-sm font-bold font-mono ${isDark ? 'text-cyan-300' : 'text-cyan-800'}`}>
                    {stats.totalCompletedAllTime} registros
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                onClick={onOpenNewHabitModal}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:brightness-105 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all inline-flex items-center space-x-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Nuevo Hábito Diario</span>
              </button>

              {/* Toggle Trend Chart Button */}
              <button
                onClick={() => setShowTrendChart(!showTrendChart)}
                className={`px-4 py-2.5 border text-xs font-bold rounded-xl cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 ${
                  showTrendChart
                    ? isDark
                      ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                      : 'border-emerald-300 bg-emerald-100 text-emerald-900 shadow-sm'
                    : isDark
                    ? 'border-[#2d3a58] bg-[#0b1326] text-slate-300 hover:border-cyan-400'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 shadow-sm'
                }`}
                title="Mostrar u ocultar gráfica de tendencia de los últimos 30 días"
              >
                <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{showTrendChart ? 'Ocultar Tendencia 30d' : 'Ver Tendencia 30d (Recharts)'}</span>
                {showTrendChart ? (
                  <ChevronUp className="w-3.5 h-3.5 opacity-60" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                )}
              </button>

              {onRestoreDefaultHabits && safeHabits.length === 0 && (
                <button
                  onClick={onRestoreDefaultHabits}
                  className={`px-4 py-2.5 border text-xs font-bold rounded-xl cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 ${
                    isDark
                      ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
                      : 'border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Cargar Hábitos Recomendados</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Thematic Image Card */}
          <div className="lg:col-span-4 hidden sm:block">
            <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 shadow-xl h-44 group">
              <img 
                src={HABITS_HERO_IMAGE} 
                alt="Persona disfrutando su rutina y hábitos con energía"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09101f] via-transparent to-transparent" />
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] backdrop-blur-md bg-[#09101f]/80 px-2.5 py-1.5 rounded-xl border border-emerald-500/30">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Rutinas Saludables
                </span>
                <span className="font-mono text-emerald-300 text-[10px]">Energía Diaria</span>
              </div>
            </div>
          </div>

        </div>

        {/* Progress Bar of Today */}
        <div className={`mt-6 pt-5 border-t space-y-2 ${isDark ? 'border-[#2d3a58]/60' : 'border-emerald-200/60'}`}>
          <div className="flex justify-between items-center text-xs font-mono">
            <span className={`font-semibold flex items-center space-x-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <span>Progreso de Hábitos de Hoy ({todayStr})</span>
            </span>
            <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{stats.percentage}% completado</span>
          </div>
          <div className={`w-full h-3 rounded-full overflow-hidden p-0.5 border ${
            isDark ? 'bg-[#0b1326] border-[#2d3a58]' : 'bg-emerald-100/60 border-emerald-200'
          }`}>
            <div
              className="h-full bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 rounded-full transition-all duration-500 shadow-sm shadow-emerald-400/50"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>

      </div>

      {/* Habit Night Notification Banner (2 hours before midnight - 22:00 in local timezone) */}
      <HabitNotificationBanner habits={safeHabits} onOpenPushSettings={onOpenNotifications} />

      {/* 30-Day Compliance Trend Chart Visualization (Recharts) */}
      {showTrendChart && (
        <HabitComplianceTrendChart habits={safeHabits} categories={categories} />
      )}

      {/* Filters and Search Bar */}
      <div className={`border p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg ${
        isDark ? 'bg-[#121c36] border-[#2d3a58]' : 'bg-white border-slate-200 shadow-slate-950/5'
      }`}>
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar hábito (ej. barrer, perro, caminar)..."
            className={`w-full pl-9 pr-4 py-2 border rounded-xl text-xs focus:outline-none focus:border-cyan-400 ${
              isDark
                ? 'bg-[#0b1326] border-[#2d3a58] text-slate-200 placeholder-slate-500'
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
            }`}
          />
        </div>

        {/* Category & Status Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`px-3 py-2 border rounded-xl text-xs font-medium focus:outline-none focus:border-cyan-400 cursor-pointer ${
              isDark ? 'bg-[#0b1326] border-[#2d3a58] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <option value="all">Todas las Categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Quick status tabs */}
          <div className={`flex items-center space-x-1 p-1 border rounded-xl text-xs ${
            isDark ? 'bg-[#0b1326] border-[#2d3a58]' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterMode === 'all'
                  ? isDark ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'bg-white text-cyan-800 font-bold shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({safeHabits.length})
            </button>
            <button
              onClick={() => setFilterMode('pending_today')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterMode === 'pending_today'
                  ? isDark ? 'bg-amber-500/20 text-amber-300 font-bold' : 'bg-white text-amber-800 font-bold shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pendientes Hoy ({stats.pendingCount})
            </button>
            <button
              onClick={() => setFilterMode('completed_today')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterMode === 'completed_today'
                  ? isDark ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'bg-white text-emerald-800 font-bold shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hechos Hoy ({stats.completedCount})
            </button>
          </div>

        </div>

      </div>

      {/* Habit Matrix Grid / Weekly Tracker */}
      <div className="space-y-4">
        
        {filteredHabits.length === 0 ? (
          <div className={`border border-dashed rounded-3xl p-10 text-center space-y-4 ${
            isDark ? 'bg-[#111a33] border-[#2d3a58]' : 'bg-slate-50 border-slate-300'
          }`}>
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center text-3xl mx-auto ${
              isDark ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-cyan-100 border-cyan-300'
            }`}>
              🌱
            </div>
            <div className="space-y-1">
              <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>No se encontraron hábitos en esta vista</h4>
              <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Crea tus hábitos cotidianos como <strong>barrer la casa</strong>, <strong>pasear la mascota</strong> o <strong>caminar 30 min</strong> para iniciar tu seguimiento diario.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={onOpenNewHabitModal}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer transition-all active:scale-95"
              >
                + Crear Hábito
              </button>
              {onRestoreDefaultHabits && (
                <button
                  onClick={onRestoreDefaultHabits}
                  className={`px-5 py-2.5 border text-xs font-bold rounded-xl cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 ${
                    isDark
                      ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
                      : 'border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Cargar Hábitos Recomendados</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {filteredHabits.map((habit) => {
              const isDoneToday = isHabitCompletedOn(habit, todayStr);
              const cat = categories.find((c) => c.id === habit.category);

              return (
                <div
                  key={habit.id}
                  className={`border rounded-2xl p-4 sm:p-5 transition-all shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isDoneToday
                      ? isDark
                        ? 'border-emerald-500/40 bg-gradient-to-r from-[#121c36] via-[#102334] to-[#121c36]'
                        : 'border-emerald-300 bg-gradient-to-r from-emerald-50/60 via-teal-50/40 to-emerald-50/60 shadow-emerald-950/5'
                      : isDark
                        ? 'bg-[#121c36] border-[#263558] hover:border-cyan-500/40'
                        : 'bg-white border-slate-200 hover:border-cyan-400 shadow-slate-950/5'
                  }`}
                >
                  
                  {/* Left Column: Big Today Checkbox + Habit Title & Category */}
                  <div className="flex items-start space-x-3.5 flex-1 min-w-[280px]">
                    
                    {/* Big Checkbox for Today */}
                    <button
                      onClick={() => onToggleHabitDay(habit.id, todayStr)}
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl transition-all cursor-pointer shrink-0 border ${
                        isDoneToday
                          ? 'bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/30 scale-105'
                          : isDark
                            ? 'bg-[#0b1326] border-[#31436e] hover:border-emerald-400/80 text-slate-500 hover:text-emerald-400 hover:scale-105'
                            : 'bg-slate-100 border-slate-300 hover:border-emerald-500 text-slate-400 hover:text-emerald-600 hover:scale-105'
                      }`}
                      title={isDoneToday ? 'Hábito completado hoy (Haz clic para desmarcar)' : 'Marcar como completado hoy'}
                    >
                      {isDoneToday ? (
                        <Check className="w-6 h-6 stroke-[3.5]" />
                      ) : (
                        <span className="text-lg opacity-70 group-hover:opacity-100">{habit.icon || '✓'}</span>
                      )}
                    </button>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <span
                          className="px-2 py-0.5 rounded text-[9px] font-mono font-bold"
                          style={{
                            backgroundColor: `${cat?.color || '#00f2ff'}20`,
                            color: cat?.color || '#00f2ff',
                          }}
                        >
                          {cat?.name || 'General'}
                        </span>

                        {habit.targetTime && (
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border flex items-center space-x-1 ${
                            isDark
                              ? 'text-cyan-300 bg-cyan-950/40 border-cyan-500/20'
                              : 'text-cyan-800 bg-cyan-50 border-cyan-200'
                          }`}>
                            <Clock className="w-3 h-3 text-cyan-500" />
                            <span>{habit.targetTime}</span>
                          </span>
                        )}

                        {habit.targetDurationMinutes && (
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            isDark ? 'text-slate-400 bg-slate-800/60' : 'text-slate-600 bg-slate-100'
                          }`}>
                            {habit.targetDurationMinutes} min
                          </span>
                        )}
                      </div>

                      <h4 className={`text-sm sm:text-base font-bold transition-all ${
                        isDoneToday
                          ? isDark ? 'text-emerald-200 line-through opacity-90' : 'text-emerald-900 line-through opacity-90'
                          : isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {habit.title}
                      </h4>

                      {habit.description && (
                        <p className={`text-xs line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {habit.description}
                        </p>
                      )}
                    </div>

                  </div>

                  {/* Center/Right: 7-Day Mini Tracker Grid */}
                  <div className={`flex items-center justify-between lg:justify-end gap-4 sm:gap-6 border-t lg:border-t-0 pt-3 lg:pt-0 ${
                    isDark ? 'border-[#202f54]' : 'border-slate-200'
                  }`}>
                    
                    {/* Weekly Bubbles Matrix */}
                    <div className="space-y-1">
                      <span className={`text-[9px] font-mono uppercase tracking-wider block text-center sm:text-right ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Últimos 7 días
                      </span>
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        {weekDays.map((day) => {
                          const isDone = isHabitCompletedOn(habit, day.dateStr);
                          return (
                            <div key={day.dateStr} className="flex flex-col items-center">
                              <button
                                onClick={() => onToggleHabitDay(habit.id, day.dateStr)}
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer text-xs ${
                                  isDone
                                    ? 'bg-emerald-500 border-emerald-400 text-white font-bold shadow-sm shadow-emerald-500/30'
                                    : day.isToday
                                      ? isDark ? 'bg-[#0b1326] border-cyan-400/80 text-cyan-300 hover:bg-cyan-500/20' : 'bg-cyan-50 border-cyan-400 text-cyan-800 hover:bg-cyan-100'
                                      : isDark ? 'bg-[#090f1e] border-[#223154] text-slate-600 hover:border-slate-500' : 'bg-slate-100 border-slate-200 text-slate-400 hover:border-slate-400'
                                }`}
                                title={`${day.dayName} ${day.dayNumber} (${day.dateStr}): ${isDone ? 'Completado' : 'Pendiente'}`}
                              >
                                {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : ''}
                              </button>
                              <span className={`text-[9px] font-mono mt-0.5 ${
                                day.isToday
                                  ? isDark ? 'text-cyan-300 font-bold' : 'text-cyan-700 font-bold'
                                  : isDark ? 'text-slate-500' : 'text-slate-600'
                              }`}>
                                {day.dayName}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Streak Counter Badge */}
                    <div className={`flex flex-col items-center justify-center px-3 py-2 border rounded-2xl min-w-[70px] ${
                      isDark ? 'bg-[#090e1c] border-[#223154]' : 'bg-slate-100 border-slate-200'
                    }`}>
                      <div className="flex items-center space-x-1 text-amber-500">
                        <Flame className="w-4 h-4" />
                        <span className={`text-base font-extrabold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {habit.streak || 0}
                        </span>
                      </div>
                      <span className={`text-[9px] font-mono uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Días racha
                      </span>
                    </div>

                    {/* Action buttons (edit, delete) */}
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() => onEditHabit(habit)}
                        className={`p-2 rounded-xl transition-colors ${
                          isDark ? 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60' : 'text-slate-500 hover:text-cyan-700 hover:bg-slate-100'
                        }`}
                        title="Editar hábito"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteHabit(habit.id)}
                        className={`p-2 rounded-xl transition-colors ${
                          isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        title="Eliminar hábito"
                      >
                        <Trash2 className="w-4 h-4" />
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
  );
};
