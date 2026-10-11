import React, { useState, useMemo } from 'react';
import { WeightLogEntry, HealthProfile } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { 
  Weight as WeightIcon, 
  Plus, 
  TrendingDown, 
  TrendingUp, 
  Minus, 
  Calendar, 
  Target, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  X, 
  ChevronRight, 
  ArrowDownRight, 
  ArrowUpRight,
  Activity,
  History
} from 'lucide-react';

interface DailyWeightTrackerProps {
  weightLogs: WeightLogEntry[];
  profile: HealthProfile;
  onAddWeightLog: (entry: Omit<WeightLogEntry, 'id' | 'createdAt'>) => void;
  onDeleteWeightLog: (logId: string) => void;
  onUpdateTargetWeight: (targetWeight: number) => void;
}

export const DailyWeightTracker: React.FC<DailyWeightTrackerProps> = ({
  weightLogs,
  profile,
  onAddWeightLog,
  onDeleteWeightLog,
  onUpdateTargetWeight,
}) => {
  const { isDark } = useTheme();
  const [timeFilter, setTimeFilter] = useState<'30d' | 'month' | '90d' | 'all'>('30d');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [showHistoryTable, setShowHistoryTable] = useState(false);

  // New weight log form state
  const [logDate, setLogDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [logWeight, setLogWeight] = useState<string>(profile.currentWeight ? String(profile.currentWeight) : '');
  const [logWaist, setLogWaist] = useState<string>(profile.waistCircumference ? String(profile.waistCircumference) : '');
  const [logNotes, setLogNotes] = useState<string>('');
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState<string>(profile.targetWeight ? String(profile.targetWeight) : '70');

  // Sorted entries chronologically
  const sortedLogs = useMemo(() => {
    return [...weightLogs].sort((a, b) => a.date.localeCompare(b.date));
  }, [weightLogs]);

  // Filter logs by selected time frame
  const filteredLogs = useMemo(() => {
    if (sortedLogs.length === 0) return [];
    const now = new Date();

    if (timeFilter === 'month') {
      const currentYearMonth = now.toISOString().substring(0, 7); // 'YYYY-MM'
      return sortedLogs.filter(l => l.date.startsWith(currentYearMonth));
    }
    
    if (timeFilter === '30d') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const cutoffStr = cutoff.toISOString().split('T')[0];
      return sortedLogs.filter(l => l.date >= cutoffStr);
    }

    if (timeFilter === '90d') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);
      const cutoffStr = cutoff.toISOString().split('T')[0];
      return sortedLogs.filter(l => l.date >= cutoffStr);
    }

    return sortedLogs;
  }, [sortedLogs, timeFilter]);

  // Chart data formatting
  const chartData = useMemo(() => {
    return filteredLogs.map((entry, index) => {
      const parts = entry.date.split('-');
      const day = parts[2];
      const monthNumber = parseInt(parts[1], 10);
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const formattedLabel = `${day} ${monthNames[monthNumber - 1] || ''}`;

      const prevEntry = index > 0 ? filteredLogs[index - 1] : null;
      const diffVsPrev = prevEntry ? Number((entry.weight - prevEntry.weight).toFixed(2)) : 0;

      return {
        id: entry.id,
        rawDate: entry.date,
        dayLabel: formattedLabel,
        weight: entry.weight,
        waist: entry.waist,
        notes: entry.notes,
        diffVsPrev,
        target: profile.targetWeight || undefined,
      };
    });
  }, [filteredLogs, profile.targetWeight]);

  // Statistical calculations
  const stats = useMemo(() => {
    if (sortedLogs.length === 0) {
      return {
        latest: profile.currentWeight || 0,
        initial: profile.currentWeight || 0,
        change: 0,
        min: 0,
        max: 0,
        avg: 0,
        toGoal: 0,
      };
    }

    const latest = sortedLogs[sortedLogs.length - 1].weight;
    const initial = sortedLogs[0].weight;
    const change = Number((latest - initial).toFixed(1));
    const weights = sortedLogs.map(l => l.weight);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const sum = weights.reduce((acc, val) => acc + val, 0);
    const avg = Number((sum / weights.length).toFixed(1));
    const target = profile.targetWeight || latest;
    const toGoal = Number((latest - target).toFixed(1));

    return { latest, initial, change, min, max, avg, toGoal };
  }, [sortedLogs, profile.currentWeight, profile.targetWeight]);

  // Handle new weight record submission
  const handleSubmitLog = (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = parseFloat(logWeight);
    if (!weightNum || isNaN(weightNum) || weightNum <= 0) return;

    const waistNum = logWaist ? parseFloat(logWaist) : undefined;

    onAddWeightLog({
      date: logDate,
      weight: Number(weightNum.toFixed(1)),
      waist: waistNum && !isNaN(waistNum) ? Number(waistNum.toFixed(1)) : undefined,
      notes: logNotes.trim() || undefined,
    });

    setIsLogModalOpen(false);
    setLogNotes('');
  };

  const handleSaveTarget = () => {
    const val = parseFloat(tempTarget);
    if (val && !isNaN(val) && val > 0) {
      onUpdateTargetWeight(Number(val.toFixed(1)));
    }
    setIsEditingTarget(false);
  };

  // Y-Axis domain bounds
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [60, 90];
    const vals = chartData.map(d => d.weight);
    if (profile.targetWeight) vals.push(profile.targetWeight);
    const minVal = Math.floor(Math.min(...vals) - 1.5);
    const maxVal = Math.ceil(Math.max(...vals) + 1.5);
    return [Math.max(0, minVal), maxVal];
  }, [chartData, profile.targetWeight]);

  return (
    <div className={`rounded-3xl border p-3.5 sm:p-6 shadow-md space-y-4 sm:space-y-6 ${
      isDark 
        ? 'bg-gradient-to-b from-[#0b1324] via-[#0d1629] to-[#080e1b] border-[#2d3a58]' 
        : 'bg-white border-slate-200 shadow-slate-200/50'
    }`}>
      
      {/* Top Bar: Title, Filters & New Weight Log Button */}
      <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 border-b pb-3.5 sm:pb-4 ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div>
          <div className="flex items-center space-x-2.5">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center shadow-inner border shrink-0 ${
              isDark ? 'bg-cyan-500/10 border-cyan-500/30 text-[#00f2ff]' : 'bg-cyan-50 border-cyan-200 text-cyan-600'
            }`}>
              <WeightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className={`text-sm sm:text-base md:text-lg font-black tracking-wide uppercase font-mono flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Seguimiento & Peso Diario
              </h3>
              <p className={`text-[11px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Gráfica día a día del mes vs peso para visualizar tu evolución
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time Filter Pills */}
          <div className={`flex items-center p-1 rounded-2xl border ${
            isDark ? 'bg-[#121c33] border-slate-700/80' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => setTimeFilter('month')}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-mono font-bold transition-colors cursor-pointer ${
                timeFilter === 'month' 
                  ? 'bg-cyan-500 text-slate-950 shadow-sm' 
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Este Mes
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('30d')}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-mono font-bold transition-colors cursor-pointer ${
                timeFilter === '30d' 
                  ? 'bg-cyan-500 text-slate-950 shadow-sm' 
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Días
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('90d')}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-mono font-bold transition-colors cursor-pointer ${
                timeFilter === '90d' 
                  ? 'bg-cyan-500 text-slate-950 shadow-sm' 
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              90 Días
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('all')}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-mono font-bold transition-colors cursor-pointer ${
                timeFilter === 'all' 
                  ? 'bg-cyan-500 text-slate-950 shadow-sm' 
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todo
            </button>
          </div>

          {/* Log Daily Weight Button */}
          <button
            type="button"
            onClick={() => setIsLogModalOpen(true)}
            className="flex items-center space-x-1.5 sm:space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] text-[#00363a] font-bold text-xs sm:text-sm font-mono shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            <span>Registrar Peso</span>
          </button>
        </div>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        
        {/* Latest Weight Card */}
        <div className={`p-3 sm:p-4 rounded-2xl border relative overflow-hidden ${
          isDark ? 'bg-[#121c33]/90 border-slate-700/70' : 'bg-slate-50 border-slate-200 shadow-xs'
        }`}>
          <div className={`flex items-center justify-between text-[11px] sm:text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Último Peso</span>
            <span className={`text-[10px] font-bold ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>HOY</span>
          </div>
          <div className={`text-xl sm:text-2xl md:text-3xl font-black font-mono mt-0.5 sm:mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {stats.latest} <span className={`text-xs sm:text-sm font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>kg</span>
          </div>
          <div className="mt-1 sm:mt-1.5 flex items-center space-x-1 sm:space-x-1.5 text-[11px] sm:text-xs">
            {stats.change < 0 ? (
              <span className={`font-bold flex items-center gap-0.5 ${isDark ? 'text-[#38ef7d]' : 'text-emerald-700'}`}>
                <TrendingDown className="w-3.5 h-3.5" />
                {stats.change} kg
              </span>
            ) : stats.change > 0 ? (
              <span className={`font-bold flex items-center gap-0.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                <TrendingUp className="w-3.5 h-3.5" />
                +{stats.change} kg
              </span>
            ) : (
              <span className={`font-bold flex items-center gap-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <Minus className="w-3.5 h-3.5" />
                0.0 kg
              </span>
            )}
            <span className={`text-[10px] sm:text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>vs inicio</span>
          </div>
        </div>

        {/* Target Weight Card */}
        <div className={`p-3 sm:p-4 rounded-2xl border relative ${
          isDark ? 'bg-[#121c33]/90 border-slate-700/70' : 'bg-slate-50 border-slate-200 shadow-xs'
        }`}>
          <div className={`flex items-center justify-between text-[11px] sm:text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span className="flex items-center gap-1"><Target className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" /> Meta</span>
            <button
              type="button"
              onClick={() => setIsEditingTarget(!isEditingTarget)}
              className={`text-[10px] hover:underline cursor-pointer ${isDark ? 'text-[#00f2ff]' : 'text-cyan-700 font-bold'}`}
            >
              {isEditingTarget ? 'Cancelar' : 'Editar'}
            </button>
          </div>

          {isEditingTarget ? (
            <div className="flex items-center space-x-1.5 mt-1.5">
              <input
                type="number"
                step="0.1"
                value={tempTarget}
                onChange={(e) => setTempTarget(e.target.value)}
                className={`w-16 sm:w-20 px-2 py-0.5 sm:py-1 rounded-lg border text-xs sm:text-sm font-mono ${
                  isDark ? 'bg-[#0a1020] border-cyan-500/50 text-white' : 'bg-white border-cyan-500 text-slate-900'
                }`}
              />
              <button
                type="button"
                onClick={handleSaveTarget}
                className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-emerald-500 text-[#00363a] text-[10px] sm:text-xs font-bold font-mono cursor-pointer"
              >
                OK
              </button>
            </div>
          ) : (
            <div className={`text-xl sm:text-2xl md:text-3xl font-black font-mono mt-0.5 sm:mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              {profile.targetWeight || '--'} <span className={`text-xs sm:text-sm font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>kg</span>
            </div>
          )}

          <div className={`mt-1 sm:mt-1.5 text-[10px] sm:text-xs font-mono truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {stats.toGoal > 0 ? (
              <span className={isDark ? 'text-cyan-300' : 'text-cyan-700 font-semibold'}>Faltan {stats.toGoal} kg</span>
            ) : stats.toGoal < 0 ? (
              <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Superada: {Math.abs(stats.toGoal)} kg</span>
            ) : (
              <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>¡En peso meta!</span>
            )}
          </div>
        </div>

        {/* Monthly Average Weight */}
        <div className={`p-3 sm:p-4 rounded-2xl border ${
          isDark ? 'bg-[#121c33]/90 border-slate-700/70' : 'bg-slate-50 border-slate-200 shadow-xs'
        }`}>
          <div className={`flex items-center justify-between text-[11px] sm:text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Promedio</span>
            <span className={`text-[10px] font-bold font-mono ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>AVG</span>
          </div>
          <div className={`text-xl sm:text-2xl md:text-3xl font-black font-mono mt-0.5 sm:mt-1 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
            {stats.avg} <span className={`text-xs sm:text-sm font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>kg</span>
          </div>
          <div className={`mt-1 sm:mt-1.5 text-[10px] sm:text-xs font-mono truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {stats.min} – {stats.max} kg
          </div>
        </div>

        {/* Total Logs Count & Action */}
        <div className={`p-3 sm:p-4 rounded-2xl border flex flex-col justify-between ${
          isDark ? 'bg-[#121c33]/90 border-slate-700/70' : 'bg-slate-50 border-slate-200 shadow-xs'
        }`}>
          <div className={`flex items-center justify-between text-[11px] sm:text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Registros</span>
            <span className={`text-[10px] font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>DÍAS</span>
          </div>
          <div className={`text-xl sm:text-2xl md:text-3xl font-black font-mono mt-0.5 sm:mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {weightLogs.length} <span className={`text-xs sm:text-sm font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>días</span>
          </div>
          <button
            type="button"
            onClick={() => setShowHistoryTable(!showHistoryTable)}
            className={`mt-1 sm:mt-1.5 text-[11px] sm:text-xs hover:underline text-left font-mono flex items-center gap-1 cursor-pointer font-bold ${
              isDark ? 'text-[#00f2ff]' : 'text-cyan-700'
            }`}
          >
            <History className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{showHistoryTable ? 'Ocultar tabla' : 'Ver tabla'}</span>
          </button>
        </div>

      </div>

      {/* Main Interactive Daily Line Chart */}
      <div className={`p-3 sm:p-5 rounded-2xl border shadow-inner ${
        isDark ? 'bg-[#090f1d] border-slate-800' : 'bg-slate-50/70 border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <span className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Evolución Diaria (Día vs Peso kg)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] sm:text-xs font-mono">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-1 bg-cyan-500 rounded-full" />
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Peso Diario</span>
            </div>
            {profile.targetWeight && (
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-1 bg-emerald-500 rounded-full border border-dashed border-emerald-400" />
                <span className={isDark ? 'text-emerald-400' : 'text-emerald-700 font-semibold'}>Meta ({profile.targetWeight} kg)</span>
              </div>
            )}
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-48 sm:h-64 md:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? '#00f2ff' : '#0284c7'} stopOpacity={isDark ? 0.4 : 0.2} />
                    <stop offset="95%" stopColor={isDark ? '#00f2ff' : '#0284c7'} stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} vertical={false} />

                <XAxis 
                  dataKey="dayLabel" 
                  stroke={isDark ? '#64748b' : '#64748b'} 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: isDark ? '#334155' : '#cbd5e1' }}
                />

                <YAxis 
                  domain={yDomain} 
                  stroke={isDark ? '#64748b' : '#64748b'} 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: isDark ? '#334155' : '#cbd5e1' }}
                  unit="kg"
                />

                <Tooltip content={<CustomTooltip isDark={isDark} />} />

                {/* Target Weight Reference Line */}
                {profile.targetWeight && (
                  <ReferenceLine 
                    y={profile.targetWeight} 
                    stroke={isDark ? '#38ef7d' : '#059669'} 
                    strokeDasharray="4 4" 
                    strokeWidth={1.5}
                  />
                )}

                {/* Average Reference Line */}
                {stats.avg > 0 && (
                  <ReferenceLine 
                    y={stats.avg} 
                    stroke="#a855f7" 
                    strokeDasharray="2 2" 
                    strokeOpacity={0.6}
                  />
                )}

                <Area 
                  type="monotone" 
                  dataKey="weight" 
                  stroke={isDark ? '#00f2ff' : '#0284c7'} 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#weightAreaGrad)" 
                  activeDot={{ r: 5, fill: '#10b981', stroke: isDark ? '#ffffff' : '#0f172a', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className={`h-44 sm:h-52 flex flex-col items-center justify-center text-center p-4 border border-dashed rounded-xl ${
            isDark ? 'border-slate-800' : 'border-slate-300 bg-white'
          }`}>
            <WeightIcon className={`w-8 h-8 sm:w-10 sm:h-10 mb-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
            <p className={`text-xs sm:text-sm font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>No hay registros de peso para este filtro temporal.</p>
            <button
              type="button"
              onClick={() => setIsLogModalOpen(true)}
              className="mt-2.5 px-3 py-1 rounded-xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-400/40 text-xs font-mono font-bold hover:bg-cyan-500/25 cursor-pointer"
            >
              Registrar pesaje hoy
            </button>
          </div>
        )}
      </div>

      {/* Expandable Daily History Table */}
      {showHistoryTable && (
        <div className={`p-3.5 sm:p-5 rounded-2xl border space-y-3 animate-in fade-in duration-300 ${
          isDark ? 'bg-[#090f1d] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <h4 className={`text-xs font-bold font-mono uppercase tracking-wider ${isDark ? 'text-cyan-300' : 'text-cyan-800'}`}>
              Historial de Pesajes Diarios ({sortedLogs.length})
            </h4>
            <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Orden cronológico</span>
          </div>

          <div className="overflow-x-auto max-h-60 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className={`border-b ${isDark ? 'border-slate-800 text-slate-400 bg-[#0d1629]' : 'border-slate-200 text-slate-600 bg-slate-100'}`}>
                <tr>
                  <th className="py-2 px-3">Fecha</th>
                  <th className="py-2 px-3">Peso</th>
                  <th className="py-2 px-3">Cintura (PC)</th>
                  <th className="py-2 px-3">Notas</th>
                  <th className="py-2 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                {sortedLogs.slice().reverse().map((entry) => (
                  <tr key={entry.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/40 text-slate-200' : 'hover:bg-slate-100 text-slate-700'}`}>
                    <td className={`py-2 px-3 font-semibold ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>{entry.date}</td>
                    <td className={`py-2 px-3 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{entry.weight} kg</td>
                    <td className={`py-2 px-3 ${isDark ? 'text-emerald-400' : 'text-emerald-700 font-semibold'}`}>{entry.waist ? `${entry.waist} cm` : '--'}</td>
                    <td className={`py-2 px-3 max-w-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{entry.notes || '-'}</td>
                    <td className="py-2 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteWeightLog(entry.id)}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          isDark ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                        title="Eliminar pesaje"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal to Register Daily Weight */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className={`relative w-full max-w-md border rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-6 ${
            isDark ? 'bg-[#0b1326] border-[#2d3a58] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            <div className={`flex items-center justify-between border-b pb-3.5 mb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center space-x-2.5">
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center ${
                  isDark ? 'bg-[#00f2ff]/10 border-[#00f2ff]/30 text-[#00f2ff]' : 'bg-cyan-50 border-cyan-200 text-cyan-600'
                }`}>
                  <WeightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className={`text-sm sm:text-base font-black font-mono uppercase tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Nuevo Pesaje Diario
                  </h3>
                  <p className={`text-[11px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Registra tu peso de hoy en ayunas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLogModalOpen(false)}
                className={`p-1.5 rounded-xl cursor-pointer ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitLog} className="space-y-3.5 sm:space-y-4">
              {/* Date Input */}
              <div>
                <label className={`block text-xs font-mono mb-1 font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Fecha del Registro
                </label>
                <input
                  type="date"
                  required
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl text-sm font-mono focus:outline-none border ${
                    isDark 
                      ? 'bg-[#121c33] border-slate-700 text-white focus:border-[#00f2ff]' 
                      : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500 shadow-xs'
                  }`}
                />
              </div>

              {/* Weight in kg */}
              <div>
                <label className={`block text-xs font-mono mb-1 font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Peso (kg) <span className={isDark ? 'text-[#00f2ff]' : 'text-cyan-600'}>*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="350"
                  required
                  placeholder="Ej. 74.5"
                  value={logWeight}
                  onChange={(e) => setLogWeight(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl text-base font-mono font-bold focus:outline-none border ${
                    isDark 
                      ? 'bg-[#121c33] border-slate-700 text-white focus:border-[#00f2ff]' 
                      : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500 shadow-xs'
                  }`}
                />
              </div>

              {/* Waist Circumference (PC) in cm */}
              <div>
                <label className={`block text-xs font-mono mb-1 font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Perímetro de Cintura - PC (cm) <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="40"
                  max="200"
                  placeholder="Ej. 82.0"
                  value={logWaist}
                  onChange={(e) => setLogWaist(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl text-sm font-mono focus:outline-none border ${
                    isDark 
                      ? 'bg-[#121c33] border-slate-700 text-white focus:border-emerald-400' 
                      : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500 shadow-xs'
                  }`}
                />
              </div>

              {/* Notes */}
              <div>
                <label className={`block text-xs font-mono mb-1 font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Notas del Día <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. En ayunas, buena hidratación..."
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl text-sm font-mono focus:outline-none border ${
                    isDark 
                      ? 'bg-[#121c33] border-slate-700 text-white focus:border-[#00f2ff]' 
                      : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500 shadow-xs'
                  }`}
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-2.5 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono cursor-pointer border ${
                    isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] text-[#00363a] font-black text-xs font-mono shadow-md cursor-pointer"
                >
                  Guardar Pesaje
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

// Custom Chart Tooltip
const CustomTooltip = ({ active, payload, isDark }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className={`p-3 rounded-xl border shadow-xl text-xs font-mono space-y-1 ${
        isDark 
          ? 'bg-[#0b1326]/95 backdrop-blur-md border-[#00f2ff]/60 text-slate-100' 
          : 'bg-white/95 backdrop-blur-md border-cyan-400 text-slate-800 shadow-cyan-900/10'
      }`}>
        <div className={`font-bold border-b pb-1 ${isDark ? 'text-cyan-300 border-slate-800' : 'text-cyan-800 border-slate-200'}`}>
          📅 {data.rawDate} ({data.dayLabel})
        </div>
        <div className={`text-sm font-extrabold flex items-center justify-between gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <span>Peso Diario:</span>
          <span className={isDark ? 'text-[#00f2ff]' : 'text-cyan-700 font-black'}>{data.weight} kg</span>
        </div>
        {data.diffVsPrev !== 0 && (
          <div className="text-[11px] flex items-center justify-between gap-3">
            <span>Variación vs anterior:</span>
            <span className={data.diffVsPrev < 0 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
              {data.diffVsPrev > 0 ? `+${data.diffVsPrev}` : data.diffVsPrev} kg
            </span>
          </div>
        )}
        {data.waist && (
          <div className={`text-[11px] flex items-center justify-between gap-3 ${isDark ? 'text-emerald-300' : 'text-emerald-700 font-semibold'}`}>
            <span>Cintura (PC):</span>
            <span>{data.waist} cm</span>
          </div>
        )}
        {data.target && (
          <div className={`text-[10px] flex items-center justify-between gap-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>Meta:</span>
            <span className="text-emerald-600 font-bold">{data.target} kg</span>
          </div>
        )}
        {data.notes && (
          <div className={`text-[10px] italic pt-1 border-t max-w-[180px] ${
            isDark ? 'text-slate-300 border-slate-800' : 'text-slate-600 border-slate-200'
          }`}>
            "{data.notes}"
          </div>
        )}
      </div>
    );
  }
  return null;
};

