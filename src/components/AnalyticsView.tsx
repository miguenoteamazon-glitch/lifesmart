import React, { useState, useEffect } from 'react';
import { Task, CategoryInfo, DailyCalorieLog, HealthProfile } from '../types';
import { calculateMetrics, getTaskProgressPercentage } from '../utils/helpers';
import { useTheme } from '../context/ThemeContext';
import { ACHIEVEMENTS_HERO_IMAGE } from '../data/initialData';
import { DailyCalorieDeficitProgressChart } from './nutrition/DailyCalorieDeficitProgressChart';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  Award, 
  CheckCircle2, 
  Clock, 
  Target, 
  TrendingUp, 
  Sparkles, 
  BarChart3, 
  PieChart as PieChartIcon,
  Flame,
  Heart,
  Activity,
  BookOpen,
  Smile,
  ShieldCheck,
  Star,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AnalyticsViewProps {
  tasks: Task[];
  categories: CategoryInfo[];
  calorieLogs?: DailyCalorieLog[];
  healthProfile?: HealthProfile;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ 
  tasks, 
  categories,
  calorieLogs = [],
  healthProfile
}) => {
  const { isDark } = useTheme();
  const metrics = calculateMetrics(tasks);

  // Animation key that re-triggers the bar entrance animation from 0 on render/data change
  const [barAnimKey, setBarAnimKey] = useState<number>(0);

  useEffect(() => {
    setBarAnimKey((k) => k + 1);
  }, [tasks, categories]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.5 },
    });
  };

  // Recharts: Horas por categoría
  const categoryChartData = categories.map((cat) => {
    const catTasks = tasks.filter((t) => t.category === cat.id);
    const estimated = catTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const completed = catTasks.reduce((sum, t) => sum + (t.completedHours || 0), 0);
    return {
      name: cat.name.split('&')[0].trim(),
      Estimadas: estimated,
      Invertidas: completed,
    };
  });

  // Recharts: Estado de Tareas
  const statusPieData = [
    { name: 'Completadas', value: metrics.completedTasks, color: '#10b981' },
    { name: 'En Progreso', value: metrics.inProgressTasks, color: '#06b6d4' },
    { name: 'Pendientes', value: metrics.pendingTasks, color: isDark ? '#64748b' : '#94a3b8' },
  ].filter((item) => item.value > 0);

  // Trend mock data based on tasks
  const trendData = [
    { day: 'Lun', cumplimiento: Math.max(10, metrics.overallCompletionPercentage - 25) },
    { day: 'Mar', cumplimiento: Math.max(20, metrics.overallCompletionPercentage - 18) },
    { day: 'Mié', cumplimiento: Math.max(30, metrics.overallCompletionPercentage - 10) },
    { day: 'Jue', cumplimiento: Math.max(45, metrics.overallCompletionPercentage - 5) },
    { day: 'Vie', cumplimiento: metrics.overallCompletionPercentage },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner / Celebration Header with Human-Centric Image */}
      <div className={`border rounded-3xl p-5 sm:p-7 relative overflow-hidden shadow-2xl transition-all ${
        isDark
          ? 'bg-gradient-to-r from-[#131b2e] via-[#171f33] to-[#131b2e] border-[#2d3449]'
          : 'bg-gradient-to-r from-cyan-50 via-teal-50 to-emerald-50 border-cyan-200 shadow-cyan-950/5'
      }`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
          <div className="lg:col-span-8 space-y-2.5">
            <div className={`inline-flex items-center space-x-2 px-3 py-1 border rounded-full text-xs font-mono font-bold ${
              isDark
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                : 'text-emerald-800 bg-emerald-100 border-emerald-300'
            }`}>
              <Award className="w-4 h-4 text-emerald-500" />
              <span>Métricas de Cumplimiento & Estilo de Vida</span>
            </div>
            <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Progreso, Logros & Equilibrio Personal
            </h2>
            <p className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Análisis completo de tus objetivos alcanzados en salud, deporte, tiempo en familia y aprendizaje, con balance de horas dedicadas.
            </p>

            <div className="pt-2">
              <button
                onClick={triggerConfetti}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition-all inline-flex items-center space-x-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>¡Celebrar Mi Progreso!</span>
              </button>
            </div>
          </div>

          {/* Right Thematic Image Card */}
          <div className="lg:col-span-4 hidden sm:block">
            <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 shadow-xl h-40 group">
              <img 
                src={ACHIEVEMENTS_HERO_IMAGE} 
                alt="Persona celebrando sus metas y logros con libertad"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09101f] via-transparent to-transparent" />
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] backdrop-blur-md bg-[#09101f]/80 px-2.5 py-1.5 rounded-xl border border-emerald-500/30">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Metas Cumplidas
                </span>
                <span className="font-mono text-emerald-300 text-[10px] font-bold">{metrics.overallCompletionPercentage}% Éxito</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main KPI Gauges & Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Main Overall Percentage Ring */}
        <div className={`border rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden transition-all ${
          isDark ? 'bg-[#131b2e] border-[#2d3449]' : 'bg-white border-slate-200 shadow-slate-950/5'
        }`}>
          <div className="relative w-32 h-32 flex items-center justify-center my-2">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="52"
                stroke={isDark ? '#171f33' : '#e2e8f0'}
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r="52"
                stroke="url(#gradientRing)"
                strokeWidth="10"
                strokeDasharray={326}
                strokeDashoffset={326 - (326 * metrics.overallCompletionPercentage) / 100}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="gradientRing" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-extrabold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {metrics.overallCompletionPercentage}%
              </span>
              <span className="text-[10px] font-mono uppercase text-cyan-500 font-bold">
                Cumplimiento
              </span>
            </div>
          </div>
          <p className={`text-xs font-sans mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Índice Global de Cumplimiento
          </p>
        </div>

        {/* Hours Completed KPI */}
        <div className={`border rounded-2xl p-5 flex flex-col justify-between shadow-xl transition-all ${
          isDark ? 'bg-[#131b2e] border-[#2d3449]' : 'bg-white border-slate-200 shadow-slate-950/5'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-mono uppercase font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Horas Invertidas</span>
            <div className={`p-2 rounded-xl ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline space-x-2">
              <span className={`text-3xl font-extrabold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {metrics.totalCompletedHours}
              </span>
              <span className={`text-sm font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/ {metrics.totalEstimatedHours} hrs</span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden mt-3 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics.hoursPercentage}%` }}
              />
            </div>
            <p className={`text-[11px] font-mono mt-2 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              {metrics.hoursPercentage}% de las horas planificadas
            </p>
          </div>
        </div>

        {/* Tasks Completed Ratio KPI */}
        <div className={`border rounded-2xl p-5 flex flex-col justify-between shadow-xl transition-all ${
          isDark ? 'bg-[#131b2e] border-[#2d3449]' : 'bg-white border-slate-200 shadow-slate-950/5'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-mono uppercase font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tareas Finalizadas</span>
            <div className={`p-2 rounded-xl ${isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-100 text-cyan-700'}`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline space-x-2">
              <span className={`text-3xl font-extrabold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {metrics.completedTasks}
              </span>
              <span className={`text-sm font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/ {metrics.totalTasks} tareas</span>
            </div>
            <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {metrics.inProgressTasks} en progreso • {metrics.pendingTasks} pendientes
            </p>
          </div>
        </div>

        {/* Goals Achieved Rate KPI */}
        <div className={`border rounded-2xl p-5 flex flex-col justify-between shadow-xl transition-all ${
          isDark ? 'bg-[#131b2e] border-[#2d3449]' : 'bg-white border-slate-200 shadow-slate-950/5'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-mono uppercase font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tasa de Metas Finales</span>
            <div className={`p-2 rounded-xl ${isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-100 text-cyan-700'}`}>
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline space-x-2">
              <span className={`text-3xl font-extrabold font-mono ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
                {metrics.goalsCompletionPercentage}%
              </span>
            </div>
            <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Promedio de avance alcanzado en objetivos clave
            </p>
          </div>
        </div>

      </div>

      {/* Visualización de Déficit Calórico Diario & Quema Activa con Recharts */}
      <DailyCalorieDeficitProgressChart 
        calorieLogs={calorieLogs} 
        healthProfile={healthProfile} 
      />

      {/* Visual Achievement Badges */}
      <div className={`border rounded-2xl p-5 shadow-xl space-y-3 transition-all ${
        isDark ? 'bg-[#131b2e] border-[#2d3449]' : 'bg-white border-slate-200 shadow-slate-950/5'
      }`}>
        <h3 className={`text-sm font-mono font-bold uppercase tracking-wider flex items-center space-x-2 ${
          isDark ? 'text-slate-200' : 'text-slate-800'
        }`}>
          <Star className="w-4 h-4 text-amber-500" />
          <span>Insignias de Logro de Vida</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`p-3 border rounded-xl flex items-center space-x-3 ${
            isDark ? 'bg-[#0b1326] border-amber-500/30' : 'bg-amber-50/80 border-amber-200'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-200 text-amber-800'
            }`}>
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className={`text-xs font-bold ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>Atleta Constante</div>
              <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>9h de Deporte & Ciclismo</div>
            </div>
          </div>

          <div className={`p-3 border rounded-xl flex items-center space-x-3 ${
            isDark ? 'bg-[#0b1326] border-rose-500/30' : 'bg-rose-50/80 border-rose-200'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-200 text-rose-800'
            }`}>
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <div className={`text-xs font-bold ${isDark ? 'text-rose-300' : 'text-rose-900'}`}>Guardián de la Familia</div>
              <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>100% Desconexión Digital</div>
            </div>
          </div>

          <div className={`p-3 border rounded-xl flex items-center space-x-3 ${
            isDark ? 'bg-[#0b1326] border-cyan-500/30' : 'bg-cyan-50/80 border-cyan-200'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-200 text-cyan-800'
            }`}>
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className={`text-xs font-bold ${isDark ? 'text-cyan-300' : 'text-cyan-900'}`}>Mente Activa</div>
              <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>14 Días de Lectura & Italiano</div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown per Final Goal (Porcentaje por Meta Final) */}
      <div className={`border rounded-2xl p-6 shadow-xl space-y-4 transition-all ${
        isDark ? 'bg-[#131b2e] border-[#2d3449]' : 'bg-white border-slate-200 shadow-slate-950/5'
      }`}>
        <div className={`flex items-center justify-between border-b pb-3 ${
          isDark ? 'border-[#2d3449]' : 'border-slate-200'
        }`}>
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-cyan-500" />
            <h3 className={`font-bold text-base ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Detalle de Cumplimiento por Meta Final
            </h3>
          </div>
          <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {tasks.length} Objetivos evaluados
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task) => {
            const cat = categories.find((c) => c.id === task.category);
            const progress = getTaskProgressPercentage(task);

            return (
              <div
                key={task.id}
                className={`p-4 border rounded-xl space-y-3 transition-colors ${
                  isDark
                    ? 'bg-[#0b1326] border-[#2d3449] hover:border-cyan-500/40'
                    : 'bg-slate-50 border-slate-200 hover:border-cyan-400 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase"
                      style={{
                        backgroundColor: `${cat?.color || '#00f2ff'}20`,
                        color: cat?.color || '#00f2ff',
                      }}
                    >
                      {cat?.name}
                    </span>
                    <h4 className={`font-bold text-sm mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{task.title}</h4>
                  </div>

                  <span className={`text-lg font-extrabold font-mono ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
                    {progress}%
                  </span>
                </div>

                {task.finalGoal && (
                  <p className={`text-xs font-medium p-2 rounded-lg border ${
                    isDark ? 'text-slate-300 bg-[#171f33] border-[#2d3449]' : 'text-slate-800 bg-cyan-50/70 border-cyan-200'
                  }`}>
                    🎯 <span className="font-bold text-cyan-600">Meta:</span> {task.finalGoal}
                  </p>
                )}

                <div className="space-y-1">
                  <div className={`flex justify-between text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span>Avance de horas: {task.completedHours}h / {task.estimatedHours}h</span>
                    {task.targetMetricValue && (
                      <span>
                        Métrica: {task.currentMetricValue || 0}/{task.targetMetricValue} {task.metricUnit}
                      </span>
                    )}
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Recharts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Hours by Category Bar Chart */}
        <div className={`border rounded-2xl p-5 shadow-xl space-y-4 transition-all ${
          isDark ? 'bg-[#131b2e] border-[#2d3449]' : 'bg-white border-slate-200 shadow-slate-950/5'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-cyan-500" />
              <h3 className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                Horas Planificadas vs. Invertidas por Área de Vida
              </h3>
            </div>
            <button
              onClick={() => setBarAnimKey((k) => k + 1)}
              title="Reiniciar animación de barras"
              className={`p-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer flex items-center space-x-1 ${
                isDark
                  ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 shadow-sm'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline text-[11px]">Animar</span>
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer key={`category-barchart-${barAnimKey}`} width="100%" height="100%">
              <BarChart 
                data={categoryChartData} 
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis dataKey="name" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} tickLine={false} />
                <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0b1326' : '#ffffff',
                    borderColor: isDark ? '#2d3449' : '#e2e8f0',
                    borderRadius: '8px',
                    color: isDark ? '#fff' : '#0f172a',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar 
                  dataKey="Estimadas" 
                  fill={isDark ? '#222a3d' : '#e2e8f0'} 
                  stroke="#06b6d4" 
                  radius={[4, 4, 0, 0]} 
                  isAnimationActive={true}
                  animationDuration={1300}
                  animationEasing="ease-out"
                  animationBegin={100}
                />
                <Bar 
                  dataKey="Invertidas" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  isAnimationActive={true}
                  animationDuration={1300}
                  animationEasing="ease-out"
                  animationBegin={250}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Status Breakdown Pie Chart */}
        <div className={`border rounded-2xl p-5 shadow-xl space-y-4 transition-all ${
          isDark ? 'bg-[#131b2e] border-[#2d3449]' : 'bg-white border-slate-200 shadow-slate-950/5'
        }`}>
          <div className="flex items-center space-x-2">
            <PieChartIcon className="w-5 h-5 text-emerald-500" />
            <h3 className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Distribución de Estados de Tarea
            </h3>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0b1326' : '#ffffff',
                    borderColor: isDark ? '#2d3449' : '#e2e8f0',
                    borderRadius: '8px',
                    color: isDark ? '#fff' : '#0f172a',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Completion Trend Area Chart */}
      <div className={`border rounded-2xl p-5 shadow-xl space-y-4 transition-all ${
        isDark ? 'bg-[#131b2e] border-[#2d3449]' : 'bg-white border-slate-200 shadow-slate-950/5'
      }`}>
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-cyan-500" />
          <h3 className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            Evolución Semanal del Porcentaje de Cumplimiento
          </h3>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} />
              <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#0b1326' : '#ffffff',
                  borderColor: isDark ? '#2d3449' : '#e2e8f0',
                  borderRadius: '8px',
                  color: isDark ? '#fff' : '#0f172a',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Area type="monotone" dataKey="cumplimiento" stroke="#06b6d4" fill={isDark ? '#00f2ff20' : '#06b6d420'} strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
