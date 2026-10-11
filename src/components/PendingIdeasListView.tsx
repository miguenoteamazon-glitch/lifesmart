import React, { useState, useMemo } from 'react';
import { 
  Lightbulb, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  Target, 
  Trash2, 
  Edit3, 
  Plus, 
  Mic, 
  ArrowUpDown, 
  AlertTriangle, 
  Sparkles, 
  Flame, 
  Calendar, 
  Tag, 
  X,
  Check,
  ChevronRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { IdeaItem, CategoryInfo, IdeaStatus, IdeaType } from '../types';
import { useTheme } from '../context/ThemeContext';
import { 
  getIdeaAgeDays, 
  formatIdeaAge, 
  getIdeaAgeBadgeStyle, 
  getIdeaStatusConfig 
} from '../utils/ideaHelpers';
import { VoiceIdeaModal } from './VoiceIdeaModal';

interface PendingIdeasListViewProps {
  ideas: IdeaItem[];
  categories: CategoryInfo[];
  onAddIdea: (idea: Omit<IdeaItem, 'id' | 'createdAt'>) => void;
  onUpdateIdeaStatus: (ideaId: string, status: IdeaStatus) => void;
  onEditIdea?: (idea: IdeaItem) => void;
  onDeleteIdea: (ideaId: string) => void;
  onConvertIdeaToTask: (idea: IdeaItem) => void;
  onNavigateToTab?: (tab: any) => void;
}

export const PendingIdeasListView: React.FC<PendingIdeasListViewProps> = ({
  ideas,
  categories,
  onAddIdea,
  onUpdateIdeaStatus,
  onEditIdea,
  onDeleteIdea,
  onConvertIdeaToTask,
  onNavigateToTab,
}) => {
  const { isDark } = useTheme();

  // Filter and Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | IdeaStatus>('all');
  const [selectedAgeTier, setSelectedAgeTier] = useState<'all' | 'aged' | 'moderate' | 'recent'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'oldest' | 'newest' | 'status' | 'alpha'>('oldest');

  // Modal states for creating / editing
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<IdeaItem | null>(null);

  // Form states for Create/Edit
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<string>(categories[0]?.id || 'actividades_pendientes');
  const [formStatus, setFormStatus] = useState<IdeaStatus>('pendiente');
  const [formTags, setFormTags] = useState('');

  const safeIdeas = Array.isArray(ideas) ? ideas : [];

  // Metrics computation
  const metrics = useMemo(() => {
    let pendingCount = 0;
    let inProgress50Count = 0;
    let completedCount = 0;
    let agedOver30Count = 0;

    safeIdeas.forEach((item) => {
      const st = item.status || 'pendiente';
      if (st === 'hecha') completedCount++;
      else if (st === '50%') inProgress50Count++;
      else pendingCount++;

      // Check if age >= 30 days and not yet done
      const days = getIdeaAgeDays(item.createdAt);
      if (days >= 30 && st !== 'hecha') {
        agedOver30Count++;
      }
    });

    return {
      total: safeIdeas.length,
      pendingCount,
      inProgress50Count,
      completedCount,
      agedOver30Count,
    };
  }, [safeIdeas]);

  // Filtered and sorted ideas
  const filteredIdeas = useMemo(() => {
    return safeIdeas.filter((item) => {
      const itemStatus: IdeaStatus = item.status || 'pendiente';

      // 1. Status Filter
      if (selectedStatus !== 'all' && itemStatus !== selectedStatus) {
        return false;
      }

      // 2. Category Filter
      if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) {
        return false;
      }

      // 3. Age Tier Filter
      const days = getIdeaAgeDays(item.createdAt);
      if (selectedAgeTier === 'aged' && days < 30) return false;
      if (selectedAgeTier === 'moderate' && (days < 7 || days >= 30)) return false;
      if (selectedAgeTier === 'recent' && days >= 7) return false;

      // 4. Text Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const titleMatch = (item.title || '').toLowerCase().includes(query);
        const descMatch = (item.description || '').toLowerCase().includes(query);
        const tagMatch = item.tags ? item.tags.some((t) => t.toLowerCase().includes(query)) : false;
        if (!titleMatch && !descMatch && !tagMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      const daysA = getIdeaAgeDays(a.createdAt);
      const daysB = getIdeaAgeDays(b.createdAt);

      if (sortBy === 'oldest') {
        // Most days first (oldest waiting ideas first)
        return daysB - daysA;
      }
      if (sortBy === 'newest') {
        // Fewest days first (newest created first)
        return daysA - daysB;
      }
      if (sortBy === 'alpha') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'status') {
        const weight: Record<IdeaStatus, number> = { pendiente: 1, '50%': 2, hecha: 3 };
        const wA = weight[a.status || 'pendiente'];
        const wB = weight[b.status || 'pendiente'];
        return wA - wB;
      }
      return 0;
    });
  }, [safeIdeas, selectedStatus, selectedCategory, selectedAgeTier, searchTerm, sortBy]);

  const handleOpenCreateModal = () => {
    setFormTitle('');
    setFormDescription('');
    setFormCategory(selectedCategory !== 'all' ? selectedCategory : (categories[0]?.id || 'actividades_pendientes'));
    setFormStatus('pendiente');
    setFormTags('');
    setEditingIdea(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (idea: IdeaItem) => {
    setEditingIdea(idea);
    setFormTitle(idea.title);
    setFormDescription(idea.description || '');
    setFormCategory(idea.categoryId);
    setFormStatus(idea.status || 'pendiente');
    setFormTags(idea.tags ? idea.tags.join(', ') : '');
    setIsCreateModalOpen(true);
  };

  const handleSaveModalForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (editingIdea && onEditIdea) {
      onEditIdea({
        ...editingIdea,
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        categoryId: formCategory,
        status: formStatus,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        updatedAt: new Date().toISOString().split('T')[0],
      });
    } else {
      onAddIdea({
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        categoryId: formCategory,
        type: 'idea' as IdeaType,
        status: formStatus,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
      });
    }

    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 pb-20">
      
      {/* 1. HERO HEADER WITH METRICS & TIME COUNTER HIGHLIGHTS */}
      <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border shadow-xl transition-all ${
        isDark 
          ? 'bg-gradient-to-br from-[#0c1427] via-[#101b38] to-[#0c1427] border-[#223354]' 
          : 'bg-gradient-to-br from-white via-sky-50/50 to-white border-slate-200'
      }`}>
        {/* Glow ambient background effects */}
        <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
          isDark ? 'bg-cyan-500/10' : 'bg-cyan-300/30'
        }`} />
        <div className={`absolute bottom-0 left-10 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
          isDark ? 'bg-amber-500/10' : 'bg-amber-200/40'
        }`} />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
              isDark 
                ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300' 
                : 'bg-cyan-50 border-cyan-300 text-cyan-900'
            }`}>
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Vista Lista de Ideas Pendientes & Contador de Vida</span>
            </div>

            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Banco de Ideas: Estados, Metas & Tiempo
            </h1>

            <p className={`text-xs sm:text-sm leading-relaxed ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Gestiona todas tus ideas en formato lista con estados (<strong>Pendiente</strong>, <strong>50%</strong> y <strong>Hecha</strong>), 
              monitorea cuántos días llevan registradas y detecta cuando superan los <strong>30 días</strong> para convertirlas en metas activas.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleOpenCreateModal}
                className="px-4.5 py-2.5 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 hover:brightness-110 active:scale-95 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center space-x-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Nueva Idea</span>
              </button>

              <button
                onClick={() => setIsVoiceModalOpen(true)}
                className="px-4.5 py-2.5 bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 hover:brightness-110 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-purple-500/25 transition-all flex items-center space-x-2 cursor-pointer"
              >
                <Mic className="w-4 h-4 text-pink-200" />
                <span>Hablar Idea (Voz) 🎙️</span>
              </button>

              {metrics.agedOver30Count > 0 && (
                <button
                  onClick={() => {
                    setSelectedAgeTier('aged');
                    setSelectedStatus('all');
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1.5 cursor-pointer animate-pulse ${
                    isDark 
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 hover:bg-rose-500/30' 
                      : 'bg-rose-100 border-rose-400 text-rose-900 hover:bg-rose-200'
                  }`}
                  title="Filtrar ideas con más de 30 días"
                >
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  <span>Ver {metrics.agedOver30Count} estancadas (+30d)</span>
                </button>
              )}
            </div>
          </div>

          {/* 30-Day Alert Highlight Box if any aged idea exists */}
          {metrics.agedOver30Count > 0 && (
            <div className={`p-4 rounded-2xl border max-w-sm shrink-0 ${
              isDark 
                ? 'bg-rose-950/40 border-rose-500/40 shadow-lg shadow-rose-950/50' 
                : 'bg-rose-50 border-rose-300 shadow-sm'
            }`}>
              <div className="flex items-start space-x-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className={`text-xs font-bold ${isDark ? 'text-rose-200' : 'text-rose-900'}`}>
                      Contador: Alerta +30 Días
                    </h4>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500 text-white">
                      {metrics.agedOver30Count}
                    </span>
                  </div>
                  <p className={`text-[11px] leading-relaxed ${isDark ? 'text-rose-300/80' : 'text-rose-800'}`}>
                    Tienes ideas con más de un mes esperando. Cambiaron a color rojo para que decidas si las ejecutas, conviertes a meta o las descartas.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* METRIC COUNTER TILES */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-6 mt-6 border-t border-slate-700/30">
          
          {/* 1. Total */}
          <button
            onClick={() => { setSelectedStatus('all'); setSelectedAgeTier('all'); }}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedStatus === 'all' && selectedAgeTier === 'all'
                ? isDark ? 'bg-slate-800/80 border-cyan-400/50 ring-1 ring-cyan-400/30' : 'bg-white border-cyan-500 ring-1 ring-cyan-200 shadow-sm'
                : isDark ? 'bg-[#0d172e]/60 border-[#223354] hover:border-slate-500' : 'bg-white/80 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Ideas</span>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className={`text-xl font-black mt-1 font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {metrics.total}
            </div>
            <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Registros activos</div>
          </button>

          {/* 2. Pendientes */}
          <button
            onClick={() => { setSelectedStatus('pendiente'); setSelectedAgeTier('all'); }}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedStatus === 'pendiente'
                ? isDark ? 'bg-sky-950/60 border-sky-400/60 ring-1 ring-sky-400/30' : 'bg-sky-50 border-sky-400 ring-1 ring-sky-200 shadow-sm'
                : isDark ? 'bg-[#0d172e]/60 border-[#223354] hover:border-sky-500/40' : 'bg-white/80 border-slate-200 hover:border-sky-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono uppercase font-bold ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>Pendientes</span>
              <Clock className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className={`text-xl font-black mt-1 font-mono ${isDark ? 'text-sky-300' : 'text-sky-800'}`}>
              {metrics.pendingCount}
            </div>
            <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Sin iniciar</div>
          </button>

          {/* 3. 50% En Proceso */}
          <button
            onClick={() => { setSelectedStatus('50%'); setSelectedAgeTier('all'); }}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedStatus === '50%'
                ? isDark ? 'bg-amber-950/60 border-amber-400/60 ring-1 ring-amber-400/30' : 'bg-amber-50 border-amber-400 ring-1 ring-amber-200 shadow-sm'
                : isDark ? 'bg-[#0d172e]/60 border-[#223354] hover:border-amber-500/40' : 'bg-white/80 border-slate-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono uppercase font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>50% En Proceso</span>
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className={`text-xl font-black mt-1 font-mono ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
              {metrics.inProgress50Count}
            </div>
            <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>A mitad de camino</div>
          </button>

          {/* 4. Hechas */}
          <button
            onClick={() => { setSelectedStatus('hecha'); setSelectedAgeTier('all'); }}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedStatus === 'hecha'
                ? isDark ? 'bg-emerald-950/60 border-emerald-400/60 ring-1 ring-emerald-400/30' : 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-200 shadow-sm'
                : isDark ? 'bg-[#0d172e]/60 border-[#223354] hover:border-emerald-500/40' : 'bg-white/80 border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono uppercase font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Hechas</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className={`text-xl font-black mt-1 font-mono ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
              {metrics.completedCount}
            </div>
            <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Completadas</div>
          </button>

          {/* 5. Estancadas (+30 días) */}
          <button
            onClick={() => { setSelectedAgeTier('aged'); setSelectedStatus('all'); }}
            className={`col-span-2 sm:col-span-1 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedAgeTier === 'aged'
                ? isDark ? 'bg-rose-950/70 border-rose-400/70 ring-1 ring-rose-400/40' : 'bg-rose-50 border-rose-400 ring-1 ring-rose-200 shadow-sm'
                : isDark ? 'bg-[#0d172e]/60 border-[#223354] hover:border-rose-500/40' : 'bg-white/80 border-slate-200 hover:border-rose-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono uppercase font-bold ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>+30 Días</span>
              <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            </div>
            <div className={`text-xl font-black mt-1 font-mono ${isDark ? 'text-rose-300' : 'text-rose-800'}`}>
              {metrics.agedOver30Count}
            </div>
            <div className={`text-[10px] ${isDark ? 'text-rose-400/80' : 'text-rose-600'}`}>Cambio de color 🚨</div>
          </button>

        </div>
      </div>

      {/* 2. FILTERS & SEARCH TOOLBAR */}
      <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 shadow-sm ${
        isDark ? 'bg-[#0d1527] border-[#223354]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar ideas por título, descripción o etiqueta..."
              className={`w-full pl-9 pr-8 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none transition-all border ${
                isDark 
                  ? 'bg-[#080d19] border-[#202d47] text-white placeholder-slate-500 focus:border-cyan-400' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-500'
              }`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2 shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`px-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-none border cursor-pointer ${
                isDark 
                  ? 'bg-[#080d19] border-[#202d47] text-slate-200 focus:border-cyan-400' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-sky-500'
              }`}
            >
              <option value="all">📁 Todas las Áreas de Vida</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Sorting Select */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`px-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-none border cursor-pointer ${
                isDark 
                  ? 'bg-[#080d19] border-[#202d47] text-slate-200 focus:border-cyan-400' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-sky-500'
              }`}
            >
              <option value="oldest">⏳ Más Antiguas Primero (+ días)</option>
              <option value="newest">🌱 Más Recientes Primero</option>
              <option value="status">📊 Por Estado (Pendiente &gt; 50% &gt; Hecha)</option>
              <option value="alpha">🔤 Alfabético (A-Z)</option>
            </select>
          </div>
        </div>

        {/* SECOND ROW: QUICK FILTER CHIPS (STATUS & TIME CONTADOR) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-700/20">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className={`text-[11px] font-mono uppercase font-bold mr-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Estado:
            </span>
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedStatus === 'all'
                  ? isDark ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'bg-cyan-100 text-cyan-900 border border-cyan-300'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({safeIdeas.length})
            </button>
            <button
              onClick={() => setSelectedStatus('pendiente')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedStatus === 'pendiente'
                  ? isDark ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50' : 'bg-sky-100 text-sky-900 border border-sky-300'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pendiente ({metrics.pendingCount})
            </button>
            <button
              onClick={() => setSelectedStatus('50%')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedStatus === '50%'
                  ? isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' : 'bg-amber-100 text-amber-900 border border-amber-300'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              50% ({metrics.inProgress50Count})
            </button>
            <button
              onClick={() => setSelectedStatus('hecha')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedStatus === 'hecha'
                  ? isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hecha ({metrics.completedCount})
            </button>
          </div>

          {/* Time Counter Aging Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className={`text-[11px] font-mono uppercase font-bold mr-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Contador de Tiempo:
            </span>
            <button
              onClick={() => setSelectedAgeTier('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedAgeTier === 'all'
                  ? isDark ? 'bg-slate-700 text-white font-bold' : 'bg-slate-200 text-slate-900 font-bold'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cualquier edad
            </button>
            <button
              onClick={() => setSelectedAgeTier('aged')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                selectedAgeTier === 'aged'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : isDark ? 'text-rose-400 hover:bg-rose-500/10' : 'text-rose-700 hover:bg-rose-100'
              }`}
              title="Filtrar ideas que cambiaron a color rojo por tener 30 días o más"
            >
              <span>🔥 +30 Días ({metrics.agedOver30Count})</span>
            </button>
            <button
              onClick={() => setSelectedAgeTier('moderate')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                selectedAgeTier === 'moderate'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : isDark ? 'text-amber-300 hover:bg-amber-500/10' : 'text-amber-800 hover:bg-amber-100'
              }`}
            >
              <span>⏳ 7 a 29 Días</span>
            </button>
            <button
              onClick={() => setSelectedAgeTier('recent')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                selectedAgeTier === 'recent'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : isDark ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <span>🌱 &lt; 7 Días</span>
            </button>
          </div>

        </div>

      </div>

      {/* 3. LIST VIEW OF IDEAS */}
      <div className="space-y-3">
        {filteredIdeas.length === 0 ? (
          <div className={`p-12 text-center rounded-3xl border space-y-4 ${
            isDark ? 'bg-[#0d1527] border-[#223354]' : 'bg-white border-slate-200'
          }`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-2xl border ${
              isDark ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'
            }`}>
              💡
            </div>
            <div className="space-y-1">
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                No se encontraron ideas con los filtros actuales
              </h3>
              <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {searchTerm || selectedStatus !== 'all' || selectedAgeTier !== 'all' || selectedCategory !== 'all'
                  ? 'Prueba restableciendo los filtros o buscando otro término.'
                  : 'Empieza registrando pensamientos, planes de viaje, lecturas o reparaciones para tu vida.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              {(searchTerm || selectedStatus !== 'all' || selectedAgeTier !== 'all' || selectedCategory !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedStatus('all');
                    setSelectedAgeTier('all');
                    setSelectedCategory('all');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                    isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Restablecer Filtros
                </button>
              )}
              <button
                onClick={handleOpenCreateModal}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:brightness-110 text-slate-950 font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
              >
                + Crear Nueva Idea
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredIdeas.map((idea) => {
              const currentStatus: IdeaStatus = idea.status || 'pendiente';
              const cat = categories.find((c) => c.id === idea.categoryId);
              const days = getIdeaAgeDays(idea.createdAt);
              const ageStyle = getIdeaAgeBadgeStyle(days, isDark);
              const statusCfg = getIdeaStatusConfig(currentStatus, isDark);
              const isOver30 = days >= 30;

              return (
                <div
                  key={idea.id}
                  className={`rounded-2xl p-4 sm:p-5 border transition-all shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 group ${
                    isOver30 && currentStatus !== 'hecha'
                      ? isDark
                        ? 'bg-[#151427] border-rose-500/50 shadow-md shadow-rose-950/30'
                        : 'bg-rose-50/40 border-rose-300 shadow-sm'
                      : isDark
                        ? 'bg-[#0d1527] hover:bg-[#101b34] border-[#202f4d] hover:border-cyan-500/40'
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-sky-300'
                  }`}
                >
                  {/* Left Column: Status Pill / Age counter / Title / Details */}
                  <div className="space-y-2 flex-1 min-w-0">
                    
                    {/* Top Meta Bar: Category, Age Counter (Color changes at 30 days), Status Badge */}
                    <div className="flex flex-wrap items-center gap-2">
                      
                      {/* Category Badge */}
                      <span
                        className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase truncate max-w-[200px]"
                        style={{
                          backgroundColor: `${cat?.color || '#0284c7'}15`,
                          color: cat?.color || '#0284c7',
                          border: `1px solid ${cat?.color || '#0284c7'}35`,
                        }}
                      >
                        {cat?.name || idea.categoryId}
                      </span>

                      {/* TIME COUNTER (COLOR CHANGES WHEN >= 30 DAYS) */}
                      <span
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold border transition-all ${ageStyle.containerClass}`}
                        title={
                          isOver30 
                            ? `Idea creada el ${idea.createdAt} (${days} días atrás). Ha superado el límite de 30 días.`
                            : `Creada el ${idea.createdAt} (${days} días transcurridos)`
                        }
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${ageStyle.dotClass}`} />
                        <span>{ageStyle.icon}</span>
                        <span>{ageStyle.label}</span>
                      </span>

                      {/* Current Status Pill */}
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${statusCfg.badgeClass}`}>
                        {statusCfg.label}
                      </span>

                      {/* Optional Type */}
                      {idea.type && idea.type !== 'idea' && (
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono border ${
                          isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {idea.type.replace('_', ' ')}
                        </span>
                      )}

                    </div>

                    {/* Title */}
                    <h3 className={`text-sm sm:text-base font-bold leading-snug transition-colors ${
                      currentStatus === 'hecha'
                        ? 'line-through opacity-70 text-slate-400'
                        : isDark ? 'text-white group-hover:text-cyan-300' : 'text-slate-900 group-hover:text-sky-700'
                    }`}>
                      {idea.title}
                    </h3>

                    {/* Description */}
                    {idea.description && (
                      <p className={`text-xs leading-relaxed line-clamp-2 ${
                        isDark ? 'text-slate-300' : 'text-slate-600'
                      }`}>
                        {idea.description}
                      </p>
                    )}

                    {/* Tags */}
                    {idea.tags && idea.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        {idea.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded-md border ${
                              isDark ? 'bg-slate-800/80 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                  </div>

                  {/* Right Column: Status Toggle Buttons + Action "Convertir a Meta" + Actions */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-700/20">
                    
                    {/* Status Interactive Selector (Pendiente / 50% / Hecha) */}
                    <div className={`p-1 rounded-xl border flex items-center space-x-1 ${
                      isDark ? 'bg-[#080d19] border-[#202f4d]' : 'bg-slate-100 border-slate-200'
                    }`}>
                      {/* Pendiente button */}
                      <button
                        type="button"
                        onClick={() => onUpdateIdeaStatus(idea.id, 'pendiente')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                          currentStatus === 'pendiente'
                            ? isDark ? 'bg-sky-500/30 text-sky-200 font-extrabold border border-sky-400/50 shadow-sm' : 'bg-white text-sky-800 font-extrabold shadow-sm'
                            : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Marcar como Pendiente"
                      >
                        <Clock className="w-3 h-3" />
                        <span>Pendiente</span>
                      </button>

                      {/* 50% button */}
                      <button
                        type="button"
                        onClick={() => onUpdateIdeaStatus(idea.id, '50%')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                          currentStatus === '50%'
                            ? isDark ? 'bg-amber-500/30 text-amber-200 font-extrabold border border-amber-400/50 shadow-sm' : 'bg-white text-amber-800 font-extrabold shadow-sm'
                            : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Marcar al 50% (En progreso)"
                      >
                        <TrendingUp className="w-3 h-3" />
                        <span>50%</span>
                      </button>

                      {/* Hecha button */}
                      <button
                        type="button"
                        onClick={() => onUpdateIdeaStatus(idea.id, 'hecha')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                          currentStatus === 'hecha'
                            ? isDark ? 'bg-emerald-500/30 text-emerald-200 font-extrabold border border-emerald-400/50 shadow-sm' : 'bg-white text-emerald-800 font-extrabold shadow-sm'
                            : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Marcar como Hecha"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Hecha</span>
                      </button>
                    </div>

                    {/* CONVERT TO GOAL BUTTON */}
                    <button
                      type="button"
                      onClick={() => onConvertIdeaToTask(idea)}
                      className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:brightness-110 active:scale-95 text-slate-950 font-extrabold text-xs rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer whitespace-nowrap transition-all"
                      title="Convertir esta idea en una Meta formal en tu tablero de gestión"
                    >
                      <Target className="w-3.5 h-3.5" />
                      <span>Convertir a Meta</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(idea)}
                      className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                        isDark ? 'border-[#202f4d] hover:bg-slate-800 text-slate-400 hover:text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                      title="Editar idea"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`¿Estás seguro de eliminar la idea "${idea.title}"?`)) {
                          onDeleteIdea(idea.id);
                        }
                      }}
                      className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                        isDark ? 'border-[#202f4d] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400' : 'border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600'
                      }`}
                      title="Eliminar idea"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. MODAL FOR CREATE / EDIT IDEA */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`relative w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border ${
            isDark ? 'bg-[#0f172a] border-[#223354] text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/20">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold">
                    {editingIdea ? 'Editar Idea' : 'Anotar Nueva Idea'}
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Banco de ideas con seguimiento de estado y tiempo
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModalForm} className="space-y-4 pt-4">
              
              {/* Category */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1.5 opacity-80">
                  Área de Vida / Categoría
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border focus:outline-none ${
                    isDark ? 'bg-[#080d19] border-[#202f4d] focus:border-cyan-400 text-white' : 'bg-slate-50 border-slate-300 focus:border-sky-500 text-slate-900'
                  }`}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1.5 opacity-80">
                  Estado Inicial
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormStatus('pendiente')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      formStatus === 'pendiente'
                        ? 'bg-sky-500 text-white border-sky-500 shadow-md'
                        : isDark ? 'bg-[#080d19] border-[#202f4d] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Pendiente
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormStatus('50%')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      formStatus === '50%'
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                        : isDark ? 'bg-[#080d19] border-[#202f4d] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    50% (En Proceso)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormStatus('hecha')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      formStatus === 'hecha'
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                        : isDark ? 'bg-[#080d19] border-[#202f4d] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Hecha
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1.5 opacity-80">
                  Título de la Idea *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ej. Pintar la fachada de la casa, Planificar vacaciones de verano..."
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-none ${
                    isDark ? 'bg-[#080d19] border-[#202f4d] focus:border-cyan-400 text-white' : 'bg-slate-50 border-slate-300 focus:border-sky-500 text-slate-900'
                  }`}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1.5 opacity-80">
                  Notas / Detalles Adicionales
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Materiales requeridos, enlaces, pasos iniciales o motivación..."
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-none resize-none ${
                    isDark ? 'bg-[#080d19] border-[#202f4d] focus:border-cyan-400 text-white' : 'bg-slate-50 border-slate-300 focus:border-sky-500 text-slate-900'
                  }`}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1.5 opacity-80">
                  Etiquetas (Separadas por comas)
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="Hogar, Prioritario, Materiales..."
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-none ${
                    isDark ? 'bg-[#080d19] border-[#202f4d] focus:border-cyan-400 text-white' : 'bg-slate-50 border-slate-300 focus:border-sky-500 text-slate-900'
                  }`}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-700/20">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:brightness-110 active:scale-95 text-slate-950 font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  {editingIdea ? 'Guardar Cambios' : 'Registrar Idea'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Voice Idea Modal */}
      <VoiceIdeaModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        categories={categories}
        defaultCategoryId={selectedCategory !== 'all' ? selectedCategory : undefined}
        onAddIdea={(newIdea) => {
          onAddIdea({
            ...newIdea,
            status: 'pendiente',
          });
        }}
      />

    </div>
  );
};
