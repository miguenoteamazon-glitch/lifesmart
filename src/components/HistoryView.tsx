import React, { useState } from 'react';
import { Task, CategoryInfo, TaskStatus } from '../types';
import { useTheme } from '../context/ThemeContext';
import { HISTORY_HERO_IMAGE } from '../data/initialData';
import { 
  formatDateSpanish, 
  getPriorityBadgeColor, 
  getStatusBadgeColor, 
  getStatusLabelSpanish,
  getTaskProgressPercentage 
} from '../utils/helpers';
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  Search, 
  RotateCcw, 
  Trash2, 
  Award, 
  Clock, 
  TrendingUp, 
  Calendar,
  Sparkles,
  Filter,
  ArrowUpRight
} from 'lucide-react';

interface HistoryViewProps {
  tasks: Task[];
  categories: CategoryInfo[];
  onQuickStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onNavigateToActive: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  tasks,
  categories,
  onQuickStatusChange,
  onDeleteTask,
  onNavigateToActive,
}) => {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completada' | 'cancelada'>('all');

  // Filter archived tasks (only completada and cancelada)
  const archivedTasks = tasks.filter(
    (t) => t.status === 'completada' || t.status === 'cancelada'
  );

  const completedCount = tasks.filter((t) => t.status === 'completada').length;
  const canceledCount = tasks.filter((t) => t.status === 'cancelada').length;
  const totalCompletedHours = tasks
    .filter((t) => t.status === 'completada')
    .reduce((sum, t) => sum + (t.completedHours || t.estimatedHours || 0), 0);

  const totalResolved = completedCount + canceledCount;
  const successRate = totalResolved > 0 ? Math.round((completedCount / totalResolved) * 100) : 0;

  // Search and filter logic safely
  const filteredTasks = archivedTasks.filter((task) => {
    if (!task) return false;
    const taskTags = Array.isArray(task.tags) ? task.tags : [];
    const matchesSearch =
      (task.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      taskTags.some((tag) => (tag || '').toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Top Banner & Key Stats with Themed Human-Centric Image */}
      <div className={`border rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden transition-all ${
        isDark 
          ? 'bg-gradient-to-r from-[#131b2e] via-[#17223b] to-[#131b2e] border-[#2d3449]' 
          : 'bg-white border-slate-200 shadow-slate-950/5'
      }`}>
        <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
          isDark ? 'bg-cyan-500/5' : 'bg-cyan-500/10'
        }`} />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
          <div className="lg:col-span-8 space-y-2.5">
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
              isDark ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' : 'text-cyan-700 bg-cyan-50 border-cyan-200'
            }`}>
              <History className="w-3.5 h-3.5" />
              <span>Registro de Logros, Reflexión & Archivo</span>
            </div>
            <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Historial de Metas Resueltas y Registro
            </h2>
            <p className={`text-xs sm:text-sm max-w-xl ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Revisa todas las metas que has completado con éxito, los aprendizajes adquiridos y mantén el registro histórico de tu evolución personal.
            </p>

            <div className="pt-2">
              <button
                onClick={onNavigateToActive}
                className={`px-4 py-2 font-bold text-xs rounded-xl transition-all inline-flex items-center space-x-2 cursor-pointer shadow-sm border ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-[#2d3449] hover:border-cyan-500/50'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                }`}
              >
                <span>Ir a Metas Activas</span>
                <ArrowUpRight className="w-4 h-4 text-cyan-500" />
              </button>
            </div>
          </div>

          {/* Right Thematic Image Card */}
          <div className="lg:col-span-4 hidden sm:block">
            <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 shadow-xl h-40 group">
              <img 
                src={HISTORY_HERO_IMAGE} 
                alt="Persona reflexionando y registrando sus logros en su diario personal"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09101f] via-transparent to-transparent" />
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] backdrop-blur-md bg-[#09101f]/80 px-2.5 py-1.5 rounded-xl border border-cyan-500/30">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  Reflexión & Diario
                </span>
                <span className="font-mono text-cyan-300 text-[10px] font-bold">{completedCount} Resueltas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t ${
          isDark ? 'border-[#2d3449]/80' : 'border-slate-100'
        }`}>
          <div className={`border rounded-2xl p-4 flex items-center space-x-3 transition-all ${
            isDark ? 'bg-[#0b1326]/80 border-[#2d3449]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`p-3 rounded-xl border ${
              isDark ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-[10px] font-mono uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Metas Logradas</p>
              <p className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{completedCount}</p>
            </div>
          </div>

          <div className={`border rounded-2xl p-4 flex items-center space-x-3 transition-all ${
            isDark ? 'bg-[#0b1326]/80 border-[#2d3449]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`p-3 rounded-xl border ${
              isDark ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200'
            }`}>
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-[10px] font-mono uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Metas Canceladas</p>
              <p className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{canceledCount}</p>
            </div>
          </div>

          <div className={`border rounded-2xl p-4 flex items-center space-x-3 transition-all ${
            isDark ? 'bg-[#0b1326]/80 border-[#2d3449]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`p-3 rounded-xl border ${
              isDark ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-[10px] font-mono uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Horas en Logros</p>
              <p className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalCompletedHours} hrs</p>
            </div>
          </div>

          <div className={`border rounded-2xl p-4 flex items-center space-x-3 transition-all ${
            isDark ? 'bg-[#0b1326]/80 border-[#2d3449]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`p-3 rounded-xl border ${
              isDark ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-[10px] font-mono uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tasa de Efectividad</p>
              <p className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{successRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className={`border p-4 rounded-2xl space-y-4 shadow-lg transition-all ${
        isDark ? 'bg-[#131b2e] border-[#2d3449]' : 'bg-white border-slate-200 shadow-slate-950/5'
      }`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Status Filter Tabs */}
          <div className={`flex items-center space-x-2 p-1 border rounded-xl w-full md:w-auto ${
            isDark ? 'bg-[#0b1326] border-[#2d3449]' : 'bg-slate-50 border-slate-200'
          }`}>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-1 md:flex-none cursor-pointer ${
                statusFilter === 'all'
                  ? isDark ? 'bg-cyan-400 text-slate-950 shadow-md' : 'bg-cyan-600 text-white shadow-xs'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({archivedTasks.length})
            </button>
            <button
              onClick={() => setStatusFilter('completada')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-1 md:flex-none flex items-center justify-center space-x-1 cursor-pointer ${
                statusFilter === 'completada'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : isDark ? 'text-slate-400 hover:text-emerald-400' : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Logradas ({completedCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('cancelada')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-1 md:flex-none flex items-center justify-center space-x-1 cursor-pointer ${
                statusFilter === 'cancelada'
                  ? 'bg-purple-600 text-white shadow-md'
                  : isDark ? 'text-slate-400 hover:text-purple-400' : 'text-slate-600 hover:text-purple-700'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Canceladas ({canceledCount})</span>
            </button>
          </div>

          {/* Search bar & Category select */}
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                isDark ? 'text-slate-400' : 'text-slate-400'
              }`} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título, tag..."
                className={`w-full pl-9 pr-3 py-2 border rounded-xl text-xs focus:outline-none transition-all ${
                  isDark 
                    ? 'bg-[#0b1326] border-[#2d3449] focus:border-cyan-400 text-slate-100 placeholder-slate-500' 
                    : 'bg-slate-50 border-slate-200 focus:border-cyan-500 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`w-full sm:w-48 px-3 py-2 border rounded-xl text-xs focus:outline-none transition-all ${
                isDark 
                  ? 'bg-[#0b1326] border-[#2d3449] focus:border-cyan-400 text-slate-100' 
                  : 'bg-slate-50 border-slate-200 focus:border-cyan-500 text-slate-900'
              }`}
            >
              <option value="all">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Archived Cards */}
      {filteredTasks.length === 0 ? (
        <div className={`border rounded-3xl p-10 text-center space-y-4 transition-all ${
          isDark ? 'bg-[#131b2e] border-[#2d3449]' : 'bg-white border-slate-200 shadow-slate-950/5'
        }`}>
          <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto ${
            isDark ? 'bg-[#0b1326] border-[#2d3449] text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-600'
          }`}>
            <History className="w-8 h-8" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>No hay metas en el historial</h3>
            <p className={`text-xs mt-1 max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {archivedTasks.length === 0
                ? 'Cuando completes o me marques metas como resueltas o canceladas, se guardarán aquí organizadas sin saturar tu tablero principal.'
                : 'No se encontraron metas archivadas que coincidan con los filtros aplicados.'}
            </p>
          </div>
          <button
            onClick={onNavigateToActive}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs rounded-xl shadow-md inline-flex items-center space-x-1.5 cursor-pointer transition-all"
          >
            <span>Ver Metas Activas</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => {
            const cat = categories.find((c) => c.id === task.category);
            const isCompleted = task.status === 'completada';
            const progressPct = getTaskProgressPercentage(task);

            return (
              <div
                key={task.id}
                className={`border rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all duration-200 shadow-xl group ${
                  isCompleted
                    ? isDark 
                      ? 'bg-[#131b2e] border-orange-500/60 ring-1 ring-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:border-orange-400' 
                      : 'bg-orange-50/20 border-orange-400 ring-1 ring-orange-400/30 shadow-[0_0_18px_rgba(249,115,22,0.22)] hover:border-orange-500'
                    : isDark 
                      ? 'bg-[#131b2e] hover:bg-[#17223b] border-[#2d3449] hover:border-cyan-500/40' 
                      : 'bg-white hover:border-cyan-400 border-slate-200 shadow-slate-950/5'
                }`}
              >
                <div className="space-y-3">
                  {/* Category & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase"
                      style={{
                        backgroundColor: `${cat?.color || '#06b6d4'}20`,
                        color: cat?.color || '#06b6d4',
                        border: `1px solid ${cat?.color || '#06b6d4'}40`,
                      }}
                    >
                      {cat?.name || task.category}
                    </span>

                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-mono border font-bold flex items-center space-x-1 ${
                        isCompleted
                          ? isDark ? 'bg-orange-500/20 text-orange-300 border-orange-500/50 shadow-[0_0_8px_rgba(249,115,22,0.35)]' : 'bg-orange-50 text-orange-800 border-orange-300 shadow-[0_0_8px_rgba(249,115,22,0.2)]'
                          : isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />
                          <span>Completada</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-purple-500" />
                          <span>Cancelada</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h4 className={`font-bold text-base leading-snug transition-colors ${
                    isCompleted 
                      ? 'text-slate-100 group-hover:text-orange-300' 
                      : isDark ? 'text-slate-100 group-hover:text-cyan-400' : 'text-slate-900 group-hover:text-cyan-600'
                  }`}>
                    {task.title}
                  </h4>

                  {task.description && (
                    <p className={`text-xs line-clamp-2 leading-relaxed ${
                      isCompleted 
                        ? isDark ? 'text-slate-300 font-medium' : 'text-slate-700'
                        : isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      {task.description}
                    </p>
                  )}

                  {/* Final Goal / Metrics */}
                  <div className={`p-3 border rounded-xl space-y-2 ${
                    isDark ? 'bg-[#0b1326] border-[#2d3449]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Meta Final:</span>
                      <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{task.finalGoal || task.title}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Horas Invertidas:</span>
                      <span className={`font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                        {task.completedHours} / {task.estimatedHours} hrs
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                      isDark ? 'bg-slate-800' : 'bg-slate-200'
                    }`}>
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className={`pt-3 border-t flex items-center justify-between gap-2 ${
                  isDark ? 'border-[#2d3449]/60' : 'border-slate-200'
                }`}>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer rounded-lg hover:bg-red-500/10"
                    title="Eliminar permanentemente del historial"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onQuickStatusChange(task.id, 'en_progreso')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer border ${
                      isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border-[#2d3449] hover:border-cyan-500/50'
                        : 'bg-slate-100 hover:bg-slate-200 text-cyan-700 hover:text-cyan-800 border-slate-200'
                    }`}
                    title="Devolver a metas activas en progreso"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reactivar Meta</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
