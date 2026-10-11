import React, { useState, useMemo } from 'react';
import { Habit, CategoryInfo } from '../types';
import { useTheme } from '../context/ThemeContext';
import { isHabitCompletedOn, getTodayDateString } from '../utils/habitHelpers';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  BarChart3,
  LineChart as LineChartIcon,
  Sparkles,
  Zap,
  Target,
  ChevronRight,
  Flame,
} from 'lucide-react';

interface HabitComplianceTrendChartProps {
  habits: Habit[];
  categories: CategoryInfo[];
}

type TimeWindow = 30 | 14 | 7;
type ChartDisplayMode = 'area' | 'bar' | 'composed';

interface DayComplianceData {
  dateStr: string;
  displayDate: string;
  fullDate: string;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  totalActive: number;
  completedCount: number;
  pendingCount: number;
  complianceRate: number; // 0 - 100
  completedNames: string[];
  pendingNames: string[];
}

export const HabitComplianceTrendChart: React.FC<HabitComplianceTrendChartProps> = ({
  habits,
  categories,
}) => {
  const { isDark } = useTheme();
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(30);
  const [selectedHabitId, setSelectedHabitId] = useState<string>('all');
  const [displayMode, setDisplayMode] = useState<ChartDisplayMode>('area');

  const todayStr = getTodayDateString();
  const activeHabits = useMemo(() => {
    return Array.isArray(habits) ? habits.filter((h) => !h.archived) : [];
  }, [habits]);

  // Compute 30-day compliance timeline
  const chartData = useMemo<DayComplianceData[]>(() => {
    const data: DayComplianceData[] = [];
    const daysShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const monthsShort = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    // Relevant habits based on selector
    const evaluatedHabits =
      selectedHabitId === 'all'
        ? activeHabits
        : activeHabits.filter((h) => h.id === selectedHabitId);

    const count = timeWindow;

    for (let i = count - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const monthStr = String(monthIndex + 1).padStart(2, '0');
      const day = d.getDate();
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;

      const completedNames: string[] = [];
      const pendingNames: string[] = [];

      evaluatedHabits.forEach((habit) => {
        if (isHabitCompletedOn(habit, dateStr)) {
          completedNames.push(habit.title);
        } else {
          pendingNames.push(habit.title);
        }
      });

      const totalActive = evaluatedHabits.length;
      const completedCount = completedNames.length;
      const pendingCount = pendingNames.length;
      const complianceRate =
        totalActive > 0 ? Math.round((completedCount / totalActive) * 100) : 0;

      data.push({
        dateStr,
        displayDate: `${day} ${monthsShort[monthIndex]}`,
        fullDate: `${daysShort[d.getDay()]}, ${day} de ${monthsShort[monthIndex]}`,
        dayName: daysShort[d.getDay()],
        dayNumber: day,
        isToday: dateStr === todayStr,
        totalActive,
        completedCount,
        pendingCount,
        complianceRate,
        completedNames,
        pendingNames,
      });
    }

    return data;
  }, [activeHabits, selectedHabitId, timeWindow, todayStr]);

  // Metrics for the selected time window (typically 30 days)
  const metrics = useMemo(() => {
    if (chartData.length === 0) {
      return {
        avgRate: 0,
        perfectDaysCount: 0,
        bestDay: null as DayComplianceData | null,
        totalCompletedAllDays: 0,
        trendDiff: 0,
      };
    }

    const totalRates = chartData.reduce((acc, curr) => acc + curr.complianceRate, 0);
    const avgRate = Math.round(totalRates / chartData.length);

    const perfectDaysCount = chartData.filter(
      (d) => d.totalActive > 0 && d.completedCount === d.totalActive
    ).length;

    const totalCompletedAllDays = chartData.reduce(
      (acc, curr) => acc + curr.completedCount,
      0
    );

    // Find best day
    let bestDay = chartData[0];
    for (const d of chartData) {
      if (d.complianceRate > bestDay.complianceRate || (d.complianceRate === bestDay.complianceRate && d.completedCount > bestDay.completedCount)) {
        bestDay = d;
      }
    }

    // Biweekly / split trend comparison
    let trendDiff = 0;
    if (chartData.length >= 14) {
      const half = Math.floor(chartData.length / 2);
      const firstHalf = chartData.slice(0, half);
      const secondHalf = chartData.slice(half);

      const firstAvg =
        firstHalf.reduce((sum, d) => sum + d.complianceRate, 0) / firstHalf.length;
      const secondAvg =
        secondHalf.reduce((sum, d) => sum + d.complianceRate, 0) / secondHalf.length;

      trendDiff = Math.round(secondAvg - firstAvg);
    }

    return {
      avgRate,
      perfectDaysCount,
      bestDay,
      totalCompletedAllDays,
      trendDiff,
    };
  }, [chartData]);

  // Custom Tooltip Component for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DayComplianceData = payload[0].payload;
      return (
        <div
          className={`p-3.5 rounded-2xl border shadow-xl backdrop-blur-md max-w-xs transition-all ${
            isDark
              ? 'bg-[#0f182c]/95 border-[#293d6b] text-slate-100 shadow-cyan-950/40'
              : 'bg-white/95 border-emerald-200 text-slate-900 shadow-slate-400/20'
          }`}
        >
          <div className="flex items-center justify-between gap-2 border-b pb-2 mb-2 border-slate-700/30">
            <span className="font-bold text-xs flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>{data.fullDate}</span>
            </span>
            {data.isToday && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                HOY
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                Cumplimiento:
              </span>
              <span
                className={`font-mono font-black text-sm ${
                  data.complianceRate >= 80
                    ? isDark ? 'text-emerald-400' : 'text-emerald-700'
                    : data.complianceRate >= 50
                    ? isDark ? 'text-amber-400' : 'text-amber-700'
                    : isDark ? 'text-rose-400' : 'text-rose-600'
                }`}
              >
                {data.complianceRate}%
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                Micro-acciones:
              </span>
              <span className="font-mono font-bold text-xs">
                {data.completedCount} de {data.totalActive} hábitos
              </span>
            </div>

            {/* List of completed habits */}
            {data.completedNames.length > 0 && (
              <div className="pt-2 border-t border-slate-700/30">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Completados ({data.completedNames.length}):</span>
                </div>
                <div className="max-h-24 overflow-y-auto space-y-0.5 pr-1">
                  {data.completedNames.map((name, idx) => (
                    <div
                      key={idx}
                      className={`text-[11px] truncate flex items-center gap-1 ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span className="truncate">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.completedNames.length === 0 && (
              <div className="pt-1.5 text-[11px] italic text-slate-400">
                Sin micro-acciones completadas este día.
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const selectedHabit = activeHabits.find((h) => h.id === selectedHabitId);

  return (
    <div
      className={`rounded-3xl border p-5 sm:p-7 shadow-xl space-y-6 transition-all ${
        isDark
          ? 'bg-gradient-to-br from-[#0c1324] via-[#101b33] to-[#0a101f] border-[#24355a] shadow-black/40'
          : 'bg-gradient-to-br from-white via-emerald-50/30 to-cyan-50/40 border-emerald-200/80 shadow-emerald-950/5'
      }`}
    >
      {/* Header with Title, Filter & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-md shadow-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </span>
            <span
              className={`text-xs font-mono font-bold uppercase tracking-wider ${
                isDark ? 'text-emerald-400' : 'text-emerald-800'
              }`}
            >
              Visualización de Cumplimiento (Recharts)
            </span>
          </div>

          <h3
            className={`text-xl sm:text-2xl font-black tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Tendencia de Hábitos de los Últimos {timeWindow} Días
          </h3>
          <p
            className={`text-xs sm:text-sm ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            Analiza tu constancia diaria, picos de productividad y patrones de consolidación de hábitos cotidianos.
          </p>
        </div>

        {/* Controls: Time window + Habit selector + Chart Mode */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Habit filter selector */}
          <div className="relative">
            <select
              value={selectedHabitId}
              onChange={(e) => setSelectedHabitId(e.target.value)}
              className={`px-3 py-2 pr-7 rounded-xl text-xs font-semibold border cursor-pointer focus:outline-none focus:border-cyan-400 transition-all ${
                isDark
                  ? 'bg-[#0f172a] border-[#2d3f66] text-slate-200'
                  : 'bg-white border-slate-300 text-slate-800 shadow-sm'
              }`}
            >
              <option value="all">🌟 Todos los Hábitos ({activeHabits.length})</option>
              {activeHabits.map((habit) => (
                <option key={habit.id} value={habit.id}>
                  {habit.icon || '✓'} {habit.title}
                </option>
              ))}
            </select>
          </div>

          {/* Time Window Buttons */}
          <div
            className={`flex items-center p-1 border rounded-xl ${
              isDark ? 'bg-[#090f1e] border-[#273859]' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              onClick={() => setTimeWindow(30)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                timeWindow === 30
                  ? isDark
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-sm'
                    : 'bg-white text-emerald-800 shadow-sm font-extrabold'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Días
            </button>
            <button
              onClick={() => setTimeWindow(14)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                timeWindow === 14
                  ? isDark
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-sm'
                    : 'bg-white text-emerald-800 shadow-sm font-extrabold'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              14 Días
            </button>
            <button
              onClick={() => setTimeWindow(7)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                timeWindow === 7
                  ? isDark
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-sm'
                    : 'bg-white text-emerald-800 shadow-sm font-extrabold'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Días
            </button>
          </div>

          {/* Display Mode Toggle */}
          <div
            className={`flex items-center p-1 border rounded-xl ${
              isDark ? 'bg-[#090f1e] border-[#273859]' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              onClick={() => setDisplayMode('area')}
              title="Tendencia en Área (%)"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                displayMode === 'area'
                  ? isDark
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                    : 'bg-white text-cyan-700 shadow-sm font-bold'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDisplayMode('bar')}
              title="Barras de Hábitos Completados"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                displayMode === 'bar'
                  ? isDark
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                    : 'bg-white text-cyan-700 shadow-sm font-bold'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDisplayMode('composed')}
              title="Vista Combinada (% y conteo)"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                displayMode === 'composed'
                  ? isDark
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                    : 'bg-white text-cyan-700 shadow-sm font-bold'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 30-Day Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Average Compliance % */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDark
              ? 'bg-[#0f172c]/80 border-[#24355a]'
              : 'bg-white border-emerald-100 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[10px] font-mono uppercase tracking-wider ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Promedio {timeWindow} Días
            </span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline space-x-2">
            <span
              className={`text-2xl sm:text-3xl font-black font-mono ${
                isDark ? 'text-emerald-300' : 'text-emerald-800'
              }`}
            >
              {metrics.avgRate}%
            </span>
            <span className="text-[10px] font-mono text-slate-400">cumplimiento</span>
          </div>
          <div className="mt-1.5 flex items-center space-x-1 text-[11px] font-mono">
            {metrics.trendDiff > 0 ? (
              <span className="text-emerald-400 flex items-center font-bold">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +{metrics.trendDiff}%
              </span>
            ) : metrics.trendDiff < 0 ? (
              <span className="text-rose-400 flex items-center font-bold">
                <TrendingDown className="w-3 h-3 mr-0.5" /> {metrics.trendDiff}%
              </span>
            ) : (
              <span className="text-slate-400 font-bold">Estable</span>
            )}
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              vs quincena previa
            </span>
          </div>
        </div>

        {/* KPI 2: 100% Days */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDark
              ? 'bg-[#0f172c]/80 border-[#24355a]'
              : 'bg-white border-amber-100 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[10px] font-mono uppercase tracking-wider ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Días con 100%
            </span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-1 flex items-baseline space-x-2">
            <span
              className={`text-2xl sm:text-3xl font-black font-mono ${
                isDark ? 'text-amber-300' : 'text-amber-800'
              }`}
            >
              {metrics.perfectDaysCount}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              de {chartData.length} días
            </span>
          </div>
          <div className="mt-1.5 text-[11px] font-mono text-amber-500 flex items-center gap-1 font-semibold">
            <Sparkles className="w-3 h-3" />
            <span>
              {metrics.perfectDaysCount > 0
                ? `${Math.round((metrics.perfectDaysCount / chartData.length) * 100)}% de días perfectos`
                : 'Construyendo el primer día 100%'}
            </span>
          </div>
        </div>

        {/* KPI 3: Best Day */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDark
              ? 'bg-[#0f172c]/80 border-[#24355a]'
              : 'bg-white border-cyan-100 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[10px] font-mono uppercase tracking-wider ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Mejor Día
            </span>
            <Flame className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-1 flex items-baseline space-x-2">
            <span
              className={`text-xl sm:text-2xl font-black font-mono ${
                isDark ? 'text-cyan-300' : 'text-cyan-800'
              }`}
            >
              {metrics.bestDay ? `${metrics.bestDay.complianceRate}%` : 'N/A'}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {metrics.bestDay ? `(${metrics.bestDay.displayDate})` : ''}
            </span>
          </div>
          <div className="mt-1.5 text-[11px] font-mono text-cyan-400 flex items-center gap-1">
            <span>
              {metrics.bestDay
                ? `${metrics.bestDay.completedCount} hábitos completados`
                : 'Sin registros'}
            </span>
          </div>
        </div>

        {/* KPI 4: Total Actions Completed in Period */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDark
              ? 'bg-[#0f172c]/80 border-[#24355a]'
              : 'bg-white border-purple-100 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[10px] font-mono uppercase tracking-wider ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Total Micro-Acciones
            </span>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-1 flex items-baseline space-x-2">
            <span
              className={`text-2xl sm:text-3xl font-black font-mono ${
                isDark ? 'text-purple-300' : 'text-purple-800'
              }`}
            >
              {metrics.totalCompletedAllDays}
            </span>
            <span className="text-[10px] font-mono text-slate-400">registros</span>
          </div>
          <div className="mt-1.5 text-[11px] font-mono text-purple-400 flex items-center gap-1">
            <span>
              {selectedHabit
                ? `En "${selectedHabit.title}"`
                : `En ${activeHabits.length} hábitos activos`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Recharts Visualization Canvas */}
      <div
        className={`p-4 sm:p-6 rounded-2xl border ${
          isDark
            ? 'bg-[#070d1a] border-[#1d2b4a]'
            : 'bg-white/80 border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Curva de Cumplimiento Diario (% de hábitos completados por fecha)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-1 bg-emerald-400 rounded-full" />
              <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                Tasa de Cumplimiento
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-1 bg-amber-400/80 rounded-full border border-dashed border-amber-300" />
              <span className={isDark ? 'text-amber-300' : 'text-amber-700'}>
                Objetivo (80%)
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-1 bg-cyan-400 rounded-full" />
              <span className={isDark ? 'text-cyan-300' : 'text-cyan-700'}>
                Meta Perfecta (100%)
              </span>
            </div>
          </div>
        </div>

        {chartData.length > 0 && activeHabits.length > 0 ? (
          <div className="w-full h-64 sm:h-72 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              {displayMode === 'area' ? (
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="complianceAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={isDark ? '#10b981' : '#059669'}
                        stopOpacity={isDark ? 0.45 : 0.25}
                      />
                      <stop
                        offset="95%"
                        stopColor={isDark ? '#06b6d4' : '#0284c7'}
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? '#1e293b' : '#e2e8f0'}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="displayDate"
                    stroke={isDark ? '#64748b' : '#94a3b8'}
                    tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
                    interval={timeWindow === 30 ? 3 : 1}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke={isDark ? '#64748b' : '#94a3b8'}
                    tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
                    tickFormatter={(val) => `${val}%`}
                    tickLine={false}
                    ticks={[0, 25, 50, 75, 100]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={80}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    strokeOpacity={0.7}
                  />
                  <ReferenceLine
                    y={100}
                    stroke="#00f2ff"
                    strokeDasharray="2 2"
                    strokeOpacity={0.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="complianceRate"
                    name="Cumplimiento"
                    stroke={isDark ? '#10b981' : '#059669'}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#complianceAreaGrad)"
                    activeDot={{
                      r: 6,
                      stroke: '#00f2ff',
                      strokeWidth: 2,
                      fill: isDark ? '#022c22' : '#ffffff',
                    }}
                  />
                </AreaChart>
              ) : displayMode === 'bar' ? (
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? '#1e293b' : '#e2e8f0'}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="displayDate"
                    stroke={isDark ? '#64748b' : '#94a3b8'}
                    tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
                    interval={timeWindow === 30 ? 3 : 1}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 'auto']}
                    stroke={isDark ? '#64748b' : '#94a3b8'}
                    tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="completedCount"
                    name="Hábitos Completados"
                    fill={isDark ? '#10b981' : '#059669'}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              ) : (
                <ComposedChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="composedAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={isDark ? '#06b6d4' : '#0284c7'}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={isDark ? '#06b6d4' : '#0284c7'}
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? '#1e293b' : '#e2e8f0'}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="displayDate"
                    stroke={isDark ? '#64748b' : '#94a3b8'}
                    tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
                    interval={timeWindow === 30 ? 3 : 1}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    domain={[0, 100]}
                    stroke={isDark ? '#64748b' : '#94a3b8'}
                    tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
                    tickFormatter={(val) => `${val}%`}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 'auto']}
                    stroke={isDark ? '#64748b' : '#94a3b8'}
                    tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    yAxisId="left"
                    y={80}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="completedCount"
                    name="Hábitos Hechos"
                    fill={isDark ? '#0284c7' : '#38bdf8'}
                    opacity={0.65}
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="complianceRate"
                    name="Tasa %"
                    stroke={isDark ? '#10b981' : '#059669'}
                    strokeWidth={2.5}
                    dot={{ r: 2 }}
                    activeDot={{ r: 6, stroke: '#00f2ff' }}
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-12 text-center space-y-2">
            <div className="text-3xl">📊</div>
            <p
              className={`text-xs sm:text-sm font-semibold ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              No hay datos suficientes para graficar la tendencia.
            </p>
            <p className="text-xs text-slate-500">
              Registra el cumplimiento de tus hábitos diarios para visualizar la curva de los últimos 30 días.
            </p>
          </div>
        )}

        {/* Footer info note */}
        <div
          className={`mt-4 pt-3 border-t flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono ${
            isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Ventana de análisis: <strong>30 días continuos</strong> hasta hoy ({todayStr})
            </span>
          </div>
          <div className="mt-1 sm:mt-0 flex items-center space-x-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> &gt;80% Óptimo
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> 50-79% Regular
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400" /> &lt;50% Por mejorar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
