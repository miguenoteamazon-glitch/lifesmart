import React, { useState, useMemo, useEffect } from 'react';
import { DailyCalorieLog, HealthProfile } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { calculateStepCalories, calculateBMR } from '../../utils/healthCalculators';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  ComposedChart,
  Line,
} from 'recharts';
import {
  Flame,
  Target,
  Dumbbell,
  CheckCircle2,
  TrendingDown,
  Sparkles,
  Zap,
  Info,
  Calendar,
  Award,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

interface DailyCalorieDeficitProgressChartProps {
  calorieLogs?: DailyCalorieLog[];
  healthProfile?: HealthProfile;
  initialTargetDeficit?: number;
}

type ChartViewMode = 'deficit-bars' | 'consumed-vs-burned' | 'activity-breakdown';

export const DailyCalorieDeficitProgressChart: React.FC<DailyCalorieDeficitProgressChartProps> = ({
  calorieLogs = [],
  healthProfile,
  initialTargetDeficit = 500,
}) => {
  const { isDark } = useTheme();

  // Configurable Target Deficit (default 500 kcal or calculated from profile)
  const defaultTarget = useMemo(() => {
    if (healthProfile?.targetWeight && healthProfile?.currentWeight) {
      if (healthProfile.targetWeight < healthProfile.currentWeight) {
        return 500;
      }
    }
    return initialTargetDeficit;
  }, [healthProfile, initialTargetDeficit]);

  const [targetDeficit, setTargetDeficit] = useState<number>(defaultTarget);
  const [viewMode, setViewMode] = useState<ChartViewMode>('deficit-bars');
  const [timeRange, setTimeRange] = useState<'7' | '14' | '30'>('7');
  
  // Animation key that forces re-triggering entrance animation when data/filter changes
  const [animKey, setAnimKey] = useState<number>(0);

  // Trigger bar growth animation whenever viewMode, timeRange, or targetDeficit changes
  useEffect(() => {
    setAnimKey((prev) => prev + 1);
  }, [viewMode, timeRange, targetDeficit, calorieLogs]);

  const latestWeight = healthProfile?.currentWeight || 74.5;
  const bmr = useMemo(() => {
    return calculateBMR(
      healthProfile?.gender || 'hombre',
      latestWeight,
      healthProfile?.height || 175,
      healthProfile?.age || 30
    ) || 1720;
  }, [healthProfile, latestWeight]);

  // Process data for charts
  const processedData = useMemo(() => {
    if (!calorieLogs || calorieLogs.length === 0) return [];

    // Clone and sort chronologically (oldest first for chart progression)
    const sorted = [...calorieLogs].sort((a, b) => a.date.localeCompare(b.date));

    // Limit to chosen time range
    const limit = parseInt(timeRange, 10);
    const sliced = sorted.slice(-limit);

    return sliced.map((log) => {
      const consumed = log.totalCaloriesConsumed || 0;
      const stepsCount = log.steps || 0;
      const stepsKcal = log.stepsCaloriesBurned ?? calculateStepCalories(stepsCount, latestWeight);
      const exerciseKcal = log.exerciseCaloriesBurned || 0;
      const activityBurned = Math.round(stepsKcal + exerciseKcal);
      const dayBmr = log.bmrSnapshot || bmr;
      const totalBurned = Math.round(dayBmr + activityBurned);

      // Deficit: Total Burned - Consumed
      // Positive value means deficit (burned more than ate)
      // Negative value means surplus (ate more than total burn)
      const dailyDeficit = Math.round(totalBurned - consumed);

      // Direct activity difference (how much exercise + steps offset food)
      const activityGap = Math.round(consumed - activityBurned);

      // Check if target deficit was achieved
      const isTargetMet = dailyDeficit >= targetDeficit;

      // Status
      const status: 'target_met' | 'partial_deficit' | 'surplus' = isTargetMet
        ? 'target_met'
        : dailyDeficit > 0
        ? 'partial_deficit'
        : 'surplus';

      // Format date label (e.g. "Lun 29", "Mar 30")
      let dateLabel = log.date;
      try {
        const parts = log.date.split('-');
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' });
          const dayNum = d.getDate();
          dateLabel = `${dayName.charAt(0).toUpperCase() + dayName.slice(1, 3)} ${dayNum}`;
        }
      } catch {}

      return {
        id: log.id,
        date: log.date,
        dateLabel,
        consumed,
        stepsCount,
        stepsKcal,
        exerciseKcal,
        activityBurned,
        dayBmr,
        totalBurned,
        dailyDeficit,
        activityGap,
        targetDeficit,
        isTargetMet,
        status,
        exerciseNotes: log.exerciseNotes,
      };
    });
  }, [calorieLogs, timeRange, latestWeight, bmr, targetDeficit]);

  // Summary Metrics for the current period
  const stats = useMemo(() => {
    if (processedData.length === 0) {
      return {
        totalDays: 0,
        metDays: 0,
        metPercentage: 0,
        avgDeficit: 0,
        avgActivityBurned: 0,
        avgConsumed: 0,
        totalDeficitAccumulated: 0,
        projectedFatLossKg: '0.00',
      };
    }

    const totalDays = processedData.length;
    const metDays = processedData.filter((d) => d.isTargetMet).length;
    const metPercentage = Math.round((metDays / totalDays) * 100);

    const sumDeficit = processedData.reduce((acc, d) => acc + d.dailyDeficit, 0);
    const avgDeficit = Math.round(sumDeficit / totalDays);

    const sumActivity = processedData.reduce((acc, d) => acc + d.activityBurned, 0);
    const avgActivityBurned = Math.round(sumActivity / totalDays);

    const sumConsumed = processedData.reduce((acc, d) => acc + d.consumed, 0);
    const avgConsumed = Math.round(sumConsumed / totalDays);

    // 7700 kcal ~= 1 kg fat
    const projectedFatLossKg = (Math.max(0, sumDeficit) / 7700).toFixed(2);

    return {
      totalDays,
      metDays,
      metPercentage,
      avgDeficit,
      avgActivityBurned,
      avgConsumed,
      totalDeficitAccumulated: sumDeficit,
      projectedFatLossKg,
    };
  }, [processedData]);

  // Replay animation function
  const handleReplayAnimation = () => {
    setAnimKey((prev) => prev + 1);
  };

  return (
    <div
      className={`border rounded-3xl p-5 sm:p-7 shadow-2xl transition-all duration-300 relative overflow-hidden ${
        isDark
          ? 'bg-gradient-to-b from-[#131b2e] via-[#101726] to-[#0d1320] border-[#2d3449]'
          : 'bg-gradient-to-b from-white via-slate-50 to-emerald-50/20 border-slate-200 shadow-slate-950/5'
      }`}
    >
      {/* Glow highlight in background */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Header and Controls */}
      <div className="relative z-10 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b pb-5 border-slate-200/10 dark:border-slate-800">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Flame className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Balance Energético & Déficit Calórico</span>
            </div>
            <h3
              className={`text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              <span>Diferencia Calórica Diaria & Quema Activa</span>
            </h3>
            <p className={`text-xs sm:text-sm max-w-2xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Relación diaria entre calorías consumidas y gasto calórico (pasos + ejercicio), destacando en
              verde los días donde superaste el déficit objetivo.
            </p>
          </div>

          {/* Interactive Tool Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Replay Animation Button */}
            <button
              onClick={handleReplayAnimation}
              title="Reiniciar animación de entrada de barras"
              className={`p-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-sm'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Animar</span>
            </button>

            {/* Time Range Selector */}
            <div
              className={`flex items-center p-1 rounded-xl border ${
                isDark ? 'bg-[#090f1d] border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}
            >
              {(['7', '14', '30'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                    timeRange === r
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                      : isDark
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r}D
                </button>
              ))}
            </div>

            {/* Target Deficit Selector Chips */}
            <div
              className={`flex items-center p-1 rounded-xl border ${
                isDark ? 'bg-[#090f1d] border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}
            >
              <span className="text-[10px] font-mono px-2 text-slate-400 font-bold hidden md:inline">
                Meta:
              </span>
              {[350, 450, 500, 600].map((t) => (
                <button
                  key={t}
                  onClick={() => setTargetDeficit(t)}
                  className={`px-2 py-1 text-[11px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
                    targetDeficit === t
                      ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow'
                      : isDark
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t}k
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center space-x-1.5 p-1 rounded-2xl bg-slate-950/30 border border-slate-800/80">
            <button
              onClick={() => setViewMode('deficit-bars')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                viewMode === 'deficit-bars'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Déficit Diario vs Meta</span>
            </button>
            <button
              onClick={() => setViewMode('consumed-vs-burned')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                viewMode === 'consumed-vs-burned'
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Consumo vs Quema Activa</span>
            </button>
            <button
              onClick={() => setViewMode('activity-breakdown')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                viewMode === 'activity-breakdown'
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>Desglose: Pasos + Ejercicio</span>
            </button>
          </div>

          {/* Target Status Indicator */}
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Meta: {targetDeficit} kcal/día
            </span>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-2">
          {/* Card 1: Días con Déficit Objetivo */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0b1326] border-emerald-500/30' : 'bg-emerald-50/70 border-emerald-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
                Días con Meta Cumplida
              </span>
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                {stats.metDays}
              </span>
              <span className="text-xs font-mono text-slate-400">/ {stats.totalDays} días</span>
            </div>
            <div className="mt-2 w-full h-1.5 rounded-full overflow-hidden bg-slate-800">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${stats.metPercentage}%` }}
              />
            </div>
            <div className="mt-1.5 text-[10px] font-mono text-emerald-400/90 font-bold">
              {stats.metPercentage}% de consistencia
            </div>
          </div>

          {/* Card 2: Déficit Promedio Diario */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0b1326] border-[#2d3449]' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
                Déficit Promedio
              </span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span
                className={`text-2xl sm:text-3xl font-black font-mono ${
                  stats.avgDeficit >= targetDeficit
                    ? 'text-emerald-400'
                    : stats.avgDeficit > 0
                    ? 'text-cyan-400'
                    : 'text-amber-400'
                }`}
              >
                {stats.avgDeficit > 0 ? `-${stats.avgDeficit}` : `+${Math.abs(stats.avgDeficit)}`}
              </span>
              <span className="text-xs font-mono text-slate-400">kcal/día</span>
            </div>
            <p className="mt-2 text-[10px] font-mono text-slate-400 truncate">
              {stats.avgDeficit >= targetDeficit
                ? '🔥 Superando objetivo diario'
                : stats.avgDeficit > 0
                ? '⚡ Déficit moderado activo'
                : '📈 Superávit calórico'}
            </p>
          </div>

          {/* Card 3: Quema Activa Promedio (Ejercicio + Pasos) */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0b1326] border-[#2d3449]' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
                Quema Activa (Pasos+Gym)
              </span>
              <Dumbbell className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-400">
                {stats.avgActivityBurned}
              </span>
              <span className="text-xs font-mono text-slate-400">kcal/día</span>
            </div>
            <p className="mt-2 text-[10px] font-mono text-slate-400">
              Ingesta prom.: {stats.avgConsumed} kcal
            </p>
          </div>

          {/* Card 4: Grasa Oxidada Proyectada */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0b1326] border-[#2d3449]' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
                Pérdida Grasa Proyectada
              </span>
              <TrendingDown className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                -{stats.projectedFatLossKg}
              </span>
              <span className="text-xs font-mono text-slate-400">kg de grasa</span>
            </div>
            <p className="mt-2 text-[10px] font-mono text-slate-400">
              En {stats.totalDays} días analizados
            </p>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RECHARTS VISUALIZATION WITH ENTRANCE ANIMATION           */}
        {/* ======================================================== */}
        <div
          className={`p-4 sm:p-6 rounded-2xl border transition-all relative ${
            isDark ? 'bg-[#090f1d] border-slate-800/90' : 'bg-white border-slate-200 shadow-md'
          }`}
        >
          {/* Subheader info inside chart */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                <span className="font-bold text-emerald-400">Déficit Objetivo Alcanzado (≥ {targetDeficit} kcal)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-cyan-500 shadow-sm" />
                <span>Déficit Parcial</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500 shadow-sm" />
                <span>Superávit</span>
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>Gasto Total = Basal ({bmr} kcal) + Pasos + Ejercicio</span>
            </div>
          </div>

          {/* Recharts Container */}
          <div className="h-80 sm:h-96 w-full" key={`chart-container-${animKey}`}>
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'deficit-bars' ? (
                /* VIEW 1: Daily Deficit vs Target with ReferenceLine and highlighted bars */
                <BarChart
                  data={processedData}
                  margin={{ top: 20, right: 20, left: -10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                  <XAxis
                    dataKey="dateLabel"
                    stroke={isDark ? '#64748b' : '#94a3b8'}
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    stroke={isDark ? '#64748b' : '#94a3b8'}
                    fontSize={11}
                    tickLine={false}
                    unit=" kcal"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div
                          className={`p-3.5 rounded-xl border shadow-2xl font-mono text-xs max-w-xs space-y-2 backdrop-blur-md ${
                            isDark ? 'bg-[#060e1e]/95 border-slate-700 text-slate-200' : 'bg-white/95 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between border-b pb-1.5 border-slate-700/50">
                            <span className="font-black text-sm text-white">{data.dateLabel}</span>
                            <span className="text-[10px] text-slate-400">{data.date}</span>
                          </div>

                          {/* Status Badge */}
                          <div className="py-1">
                            {data.isTargetMet ? (
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                <span>¡Déficit Objetivo Logrado! 🔥</span>
                              </div>
                            ) : data.dailyDeficit > 0 ? (
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Déficit Parcial ({data.dailyDeficit} kcal)</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                                <span>Superávit (+{Math.abs(data.dailyDeficit)} kcal)</span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Calorías Consumidas:</span>
                              <span className="font-bold text-amber-300">{data.consumed} kcal</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Quema Activa (Pasos+Gym):</span>
                              <span className="font-bold text-cyan-300">+{data.activityBurned} kcal</span>
                            </div>
                            <div className="flex justify-between text-[10px] pl-2 text-slate-400">
                              <span>• Pasos ({data.stepsCount.toLocaleString()}):</span>
                              <span>+{data.stepsKcal} kcal</span>
                            </div>
                            <div className="flex justify-between text-[10px] pl-2 text-slate-400">
                              <span>• Ejercicio / Gym:</span>
                              <span>+{data.exerciseKcal} kcal</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Gasto Basal (BMR):</span>
                              <span className="font-bold text-slate-300">+{data.dayBmr} kcal</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-700/50 pt-1">
                              <span className="text-slate-300 font-bold">Gasto Total (TDEE):</span>
                              <span className="font-bold text-white">{data.totalBurned} kcal</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-700/50 pt-1 text-sm font-black">
                              <span className={data.isTargetMet ? 'text-emerald-400' : 'text-cyan-400'}>
                                Déficit Alcanzado:
                              </span>
                              <span className={data.isTargetMet ? 'text-emerald-400' : 'text-cyan-400'}>
                                {data.dailyDeficit} kcal
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 pt-0.5">
                              Meta: {targetDeficit} kcal{' '}
                              {data.dailyDeficit >= targetDeficit
                                ? `(Superado por +${data.dailyDeficit - targetDeficit} kcal)`
                                : `(Faltaron ${targetDeficit - data.dailyDeficit} kcal)`}
                            </div>
                            {data.exerciseNotes && (
                              <div className="text-[10px] text-slate-300 italic pt-1 border-t border-slate-800">
                                🏋️ {data.exerciseNotes}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }}
                    formatter={() => 'Déficit Calórico Diario (Gasto Total - Consumo)'}
                  />

                  {/* Reference Line for Target Deficit */}
                  <ReferenceLine
                    y={targetDeficit}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    label={{
                      value: `🎯 Meta: ${targetDeficit} kcal`,
                      position: 'top',
                      fill: '#10b981',
                      fontSize: 11,
                      fontWeight: 'bold',
                    }}
                  />

                  {/* Zero reference line */}
                  <ReferenceLine y={0} stroke={isDark ? '#475569' : '#cbd5e1'} strokeWidth={1} />

                  {/* Animated Bar with customized growing colors */}
                  <Bar
                    dataKey="dailyDeficit"
                    radius={[6, 6, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={1300}
                    animationEasing="ease-out"
                    animationBegin={150}
                  >
                    {processedData.map((entry, index) => {
                      // Distinct color highlighting for target met days vs partial vs surplus
                      let fillColor = '#f59e0b'; // surplus/amber
                      if (entry.isTargetMet) {
                        fillColor = '#10b981'; // emerald green highlight
                      } else if (entry.dailyDeficit > 0) {
                        fillColor = '#06b6d4'; // cyan / partial deficit
                      }
                      return (
                        <Cell
                          key={`cell-${entry.id || index}`}
                          fill={fillColor}
                          stroke={entry.isTargetMet ? '#34d399' : 'transparent'}
                          strokeWidth={entry.isTargetMet ? 2 : 0}
                          className="transition-all duration-300 hover:opacity-80"
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              ) : viewMode === 'consumed-vs-burned' ? (
                /* VIEW 2: Consumed vs Active Burned (Steps + Exercise) & Total TDEE */
                <ComposedChart
                  data={processedData}
                  margin={{ top: 20, right: 20, left: -10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                  <XAxis dataKey="dateLabel" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} />
                  <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} unit=" kcal" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0b1326' : '#ffffff',
                      borderColor: isDark ? '#2d3449' : '#e2e8f0',
                      borderRadius: '12px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }} />

                  {/* Consumed Bar */}
                  <Bar
                    dataKey="consumed"
                    name="Calorías Consumidas (Comidas)"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={1300}
                    animationEasing="ease-out"
                    animationBegin={100}
                  />

                  {/* Active Burned Bar (Exercise + Steps) */}
                  <Bar
                    dataKey="activityBurned"
                    name="Quemadas por Actividad (Pasos + Gym)"
                    fill="#06b6d4"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={1300}
                    animationEasing="ease-out"
                    animationBegin={250}
                  />

                  {/* Total Burned Line (TDEE) */}
                  <Line
                    type="monotone"
                    dataKey="totalBurned"
                    name="Gasto Total (BMR + Actividad)"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={true}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                </ComposedChart>
              ) : (
                /* VIEW 3: Detailed Activity Breakdown (Steps vs Exercise Calories) */
                <BarChart
                  data={processedData}
                  margin={{ top: 20, right: 20, left: -10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                  <XAxis dataKey="dateLabel" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} />
                  <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} unit=" kcal" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0b1326' : '#ffffff',
                      borderColor: isDark ? '#2d3449' : '#e2e8f0',
                      borderRadius: '12px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }} />

                  {/* Steps Calories */}
                  <Bar
                    dataKey="stepsKcal"
                    name="Kcal por Pasos Diarios"
                    stackId="activity"
                    fill="#3b82f6"
                    isAnimationActive={true}
                    animationDuration={1300}
                    animationEasing="ease-out"
                    animationBegin={100}
                  />

                  {/* Exercise Calories */}
                  <Bar
                    dataKey="exerciseKcal"
                    name="Kcal por Ejercicio & Gym"
                    stackId="activity"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={1300}
                    animationEasing="ease-out"
                    animationBegin={250}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Day-by-Day Result Strip with Target Highlights */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Registro Detallado por Día ({processedData.length} días)</span>
            </span>
            <span>Verde = Meta de {targetDeficit} kcal alcanzada</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {processedData.map((d) => (
              <div
                key={d.id || d.date}
                className={`p-2.5 rounded-xl border text-center font-mono transition-all hover:scale-[1.02] ${
                  d.isTargetMet
                    ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                    : d.dailyDeficit > 0
                    ? isDark
                      ? 'bg-[#0b1326] border-slate-800'
                      : 'bg-white border-slate-200'
                    : isDark
                    ? 'bg-amber-950/20 border-amber-500/30'
                    : 'bg-amber-50/70 border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-slate-300">{d.dateLabel}</span>
                  {d.isTargetMet && <span title="Objetivo Alcanzado">🎯</span>}
                </div>

                <div className="mt-1.5">
                  <span
                    className={`text-sm font-black ${
                      d.isTargetMet ? 'text-emerald-400' : d.dailyDeficit > 0 ? 'text-cyan-400' : 'text-amber-400'
                    }`}
                  >
                    {d.dailyDeficit > 0 ? `-${d.dailyDeficit}` : `+${Math.abs(d.dailyDeficit)}`}
                  </span>
                  <span className="text-[9px] text-slate-400 block -mt-0.5">kcal déficit</span>
                </div>

                <div className="mt-1.5 pt-1.5 border-t border-slate-800/60 text-[9px] text-slate-400 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Ingesta:</span>
                    <span className="text-amber-300">{d.consumed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Activa:</span>
                    <span className="text-cyan-300">+{d.activityBurned}</span>
                  </div>
                </div>

                <div className="mt-1.5">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-[8.5px] font-bold ${
                      d.isTargetMet
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : d.dailyDeficit > 0
                        ? 'bg-cyan-500/10 text-cyan-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    {d.isTargetMet ? '✓ Meta Lograda' : d.dailyDeficit > 0 ? 'Déficit Parcial' : 'Superávit'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
