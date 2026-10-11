import React, { useState, useRef, useEffect } from 'react';
import { ActiveTab, Task, CategoryInfo, IdeaItem } from '../types';
import { calculateMetrics } from '../utils/helpers';
import { APP_LOGO } from '../data/initialData';
import { User } from '../lib/firebase';
import { useTheme } from '../context/ThemeContext';
import { 
  CheckSquare, 
  Calendar, 
  PieChart, 
  Plus, 
  Clock, 
  Award, 
  User as UserIcon, 
  LogOut, 
  UserPlus, 
  LogIn, 
  ChevronDown, 
  History, 
  Trash2, 
  RotateCcw, 
  Bot, 
  Sparkles, 
  Flame, 
  Home, 
  Smartphone,
  Download,
  Menu,
  X,
  Sun,
  Moon,
  Brain,
  Lightbulb,
  Layers,
  Activity,
  Car,
  Heart,
  BookOpen,
  Smile,
  Gamepad2,
  PiggyBank,
  Briefcase,
  Check,
  FolderHeart,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Radio,
  Bell
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  tasks: Task[];
  habitsCount?: number;
  ideasCount?: number;
  agedIdeasCount?: number;
  categories?: CategoryInfo[];
  selectedCategory?: string;
  onSelectCategory?: (catId: string) => void;
  ideas?: IdeaItem[];
  onOpenNewTaskModal: () => void;
  user: User | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onSignOut: () => void;
  onResetAllData: () => void;
  onLoadExamples: () => void;
  onOpenAgent?: () => void;
  onOpenAssistantIntegration?: () => void;
  onOpenBrainDump?: () => void;
  onOpenInstallApp?: () => void;
  onOpenNotifications?: () => void;
  onGoHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  tasks,
  habitsCount = 0,
  ideasCount = 0,
  agedIdeasCount = 0,
  categories = [],
  selectedCategory = 'all',
  onSelectCategory,
  ideas = [],
  onOpenNewTaskModal,
  user,
  onOpenAuth,
  onSignOut,
  onResetAllData,
  onLoadExamples,
  onOpenAgent,
  onOpenAssistantIntegration,
  onOpenBrainDump,
  onOpenInstallApp,
  onOpenNotifications,
  onGoHome,
}) => {
  const metrics = calculateMetrics(tasks);
  const { theme, isDark, toggleTheme } = useTheme();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAssistantMenuOpen, setIsAssistantMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollectionsDropdownOpen, setIsCollectionsDropdownOpen] = useState(false);
  const collectionsDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        collectionsDropdownRef.current &&
        !collectionsDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCollectionsDropdownOpen(false);
      }
    };
    if (isCollectionsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isCollectionsDropdownOpen]);

  const activeCategoryObj = categories.find((c) => c.id === selectedCategory);

  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, { tasks: number; ideas: number; total: number }> = {};
    if (categories && Array.isArray(categories)) {
      categories.forEach((cat) => {
        const catTasks = tasks.filter((t) => t && t.category === cat.id).length;
        const catIdeas = ideas && Array.isArray(ideas) ? ideas.filter((i) => i && i.categoryId === cat.id).length : 0;
        counts[cat.id] = {
          tasks: catTasks,
          ideas: catIdeas,
          total: catTasks + catIdeas,
        };
      });
    }
    return counts;
  }, [categories, tasks, ideas]);

  const handleSelectCategory = (catId: string) => {
    if (onSelectCategory) {
      onSelectCategory(catId);
    }
    setActiveTab('gestion');
    setIsCollectionsDropdownOpen(false);

    // Smooth scroll to the content area
    const mainEl = document.querySelector('main');
    if (mainEl) {
      const yOffset = -70;
      const y = mainEl.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getCategoryIconComponent = (iconName: string, className = "w-3.5 h-3.5") => {
    switch (iconName) {
      case 'Briefcase': return <Briefcase className={className} />;
      case 'Activity': return <Activity className={className} />;
      case 'Car': return <Car className={className} />;
      case 'CheckSquare': return <CheckSquare className={className} />;
      case 'Heart': return <Heart className={className} />;
      case 'BookOpen': return <BookOpen className={className} />;
      case 'Smile': return <Smile className={className} />;
      case 'Gamepad2': case 'Gamepad': return <Gamepad2 className={className} />;
      case 'PiggyBank': return <PiggyBank className={className} />;
      default: return <Sparkles className={className} />;
    }
  };

  const getCategoryShortLabel = (id: string, fullName: string) => {
    switch (id) {
      case 'job_things': return 'Trabajo';
      case 'salud_deporte': return 'Salud';
      case 'vehiculos': return 'Vehículos';
      case 'actividades_pendientes': return 'Pendientes';
      case 'familia_relaciones': return 'Familia';
      case 'aprendizaje': return 'Aprendizaje';
      case 'bienestar_mente': return 'Bienestar';
      case 'ocio_entretenimiento': return 'Ocio';
      case 'finanzas_hogar': return 'Finanzas';
      default: return fullName.split('&')[0].trim();
    }
  };

  const renderCollectionDoodle = (id: string, color: string, isSelected: boolean) => {
    const doodleProps = {
      className: `w-4 h-4 transition-transform duration-200 ease-out group-hover:scale-115 group-hover:rotate-6 shrink-0`,
      style: { color: color }
    };

    switch (id) {
      case 'job_things':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...doodleProps}>
            <rect x="2" y="7" width="20" height="14" rx="3" fill={color} fillOpacity="0.2" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            <line x1="2" y1="13" x2="22" y2="13" strokeWidth="1.5" strokeDasharray="3 2" />
            <rect x="10" y="11" width="4" height="4" rx="1" fill={color} />
          </svg>
        );
      case 'all':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...doodleProps}>
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill={color} fillOpacity="0.2" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
            <circle cx="19" cy="4" r="1.5" fill={color} />
          </svg>
        );
      case 'salud_deporte':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...doodleProps}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill={color} fillOpacity="0.18" />
            <path d="M3.5 12h3l2-3 3 6 2-4 2 2h3.5" strokeWidth="2" />
          </svg>
        );
      case 'vehiculos':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...doodleProps}>
            <path d="M5 16l1.5-6h11L19 16H5z" fill={color} fillOpacity="0.25" />
            <path d="M3 14h18v4a1 1 0 0 1-1 1h-1a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H4a1 1 0 0 1-1-1v-4z" />
            <circle cx="7" cy="18.5" r="1.5" fill={color} />
            <circle cx="17" cy="18.5" r="1.5" fill={color} />
            <path d="M7 11h3m4 0h3" />
          </svg>
        );
      case 'actividades_pendientes':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...doodleProps}>
            <rect x="4" y="3" width="14" height="18" rx="2" fill={color} fillOpacity="0.18" />
            <path d="M8 8h6M8 12h4" />
            <path d="M7 16l2 2 4-4" strokeWidth="2" />
            <path d="M16 14l4 4-2 2-4-4z" fill={color} />
          </svg>
        );
      case 'familia_relaciones':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...doodleProps}>
            <path d="M12 4.5C10-1 2 2 2 8.5c0 5.5 10 11.5 10 11.5s10-6 10-11.5c0-6.5-8-9.5-10-4z" fill={color} fillOpacity="0.2" />
            <circle cx="9" cy="11" r="1.8" fill={color} />
            <circle cx="15" cy="11" r="1.8" fill={color} />
            <path d="M6.5 16.5c0-1.5 1.5-2.5 3-2.5h1m4 0h1c1.5 0 3 1 3 2.5" />
          </svg>
        );
      case 'menu':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...doodleProps}>
            <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z" fill={color} fillOpacity="0.2" />
            <path d="M9 13h6m-3-3v6" strokeWidth="2" />
          </svg>
        );
      case 'aprendizaje':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...doodleProps}>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" fill={color} fillOpacity="0.2" />
            <path d="M12 6v6m-3-3h6" />
            <circle cx="12" cy="7" r="2.2" fill={color} />
          </svg>
        );
      case 'bienestar_mente':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...doodleProps}>
            <path d="M12 3c-2.5 3-4 6-4 9a4 4 0 0 0 8 0c0-3-1.5-6-4-9z" fill={color} fillOpacity="0.25" />
            <path d="M8 14c-3-1-5-4-5-6 3 0 5 2 6 4" />
            <path d="M16 14c3-1 5-4 5-6-3 0-5 2-6 4" />
            <path d="M4 19c4-1 12-1 16 0" />
          </svg>
        );
      case 'ocio_entretenimiento':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...doodleProps}>
            <rect x="2" y="6" width="20" height="12" rx="4" fill={color} fillOpacity="0.2" />
            <path d="M6 12h4m-2-2v4" strokeWidth="2" />
            <circle cx="15" cy="11" r="1.3" fill={color} />
            <circle cx="18" cy="13" r="1.3" fill={color} />
            <path d="M9 6V4m6 2V4" />
          </svg>
        );
      case 'finanzas_hogar':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...doodleProps}>
            <path d="M19 11c0-4-3-7-7-7s-7 3-7 7c0 2 .8 3.8 2 5v2l2-1h4l2 1v-2c1.2-1.2 2-3 2-5z" fill={color} fillOpacity="0.2" />
            <circle cx="12" cy="5" r="1.5" fill={color} />
            <path d="M10 11h4" strokeWidth="2" />
            <circle cx="8" cy="10" r="1" fill={color} />
            <path d="M18 10h1.5a1.5 1.5 0 0 1 1.5 1.5v.5" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...doodleProps}>
            <circle cx="12" cy="12" r="9" fill={color} fillOpacity="0.2" />
            <path d="M12 8v8m-4-4h8" />
          </svg>
        );
    }
  };

  const renderUniformCategoryCard = (cat: CategoryInfo) => {
    const isSelected = selectedCategory === cat.id;
    const count = categoryCounts[cat.id] || { tasks: 0, ideas: 0, total: 0 };
    const shortLabel = getCategoryShortLabel(cat.id, cat.name);

    return (
      <button
        key={cat.id}
        type="button"
        onClick={() => handleSelectCategory(cat.id)}
        className={`group relative flex items-center justify-between w-full h-8 sm:h-8.5 px-2 sm:px-2.5 rounded-xl border text-[11px] sm:text-xs font-bold transition-all duration-200 ease-out cursor-pointer select-none overflow-hidden ${
          isSelected
            ? 'text-white shadow-xs ring-1.5 ring-offset-0 scale-[1.01]'
            : isDark
              ? 'bg-[#10192e]/90 hover:bg-[#162340] border-[#1e2d4a] hover:border-slate-500 text-slate-300 hover:text-white hover:-translate-y-0.5 hover:shadow-md'
              : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700 hover:text-slate-900 hover:-translate-y-0.5 hover:shadow-xs'
        } active:scale-95 active:translate-y-0`}
        style={{
          borderColor: isSelected ? cat.color : undefined,
          backgroundColor: isSelected ? `${cat.color}24` : undefined,
          boxShadow: isSelected ? `0 2px 10px ${cat.color}35` : undefined,
          outlineColor: isSelected ? cat.color : undefined,
        }}
        title={`Colección ${cat.name}: ${count.tasks} metas`}
      >
        {/* Left: Doodle */}
        <div 
          className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 ease-out group-hover:scale-110"
          style={{
            backgroundColor: isSelected ? `${cat.color}35` : `${cat.color}15`,
          }}
        >
          {renderCollectionDoodle(cat.id, cat.color, isSelected)}
        </div>

        {/* Middle: Short Name (same font, truncated) */}
        <span className={`flex-1 mx-1.5 text-left font-bold tracking-tight truncate leading-tight transition-colors ${
          isSelected ? 'text-white font-extrabold' : 'text-slate-300 group-hover:text-white'
        }`}>
          {shortLabel}
        </span>

        {/* Right: Counter Badge */}
        <span 
          className="shrink-0 text-[9.5px] font-mono px-1.5 py-0.2 rounded-md font-bold transition-colors"
          style={{
            backgroundColor: isSelected ? `${cat.color}40` : isDark ? '#1b253b' : '#e2e8f0',
            color: isSelected ? '#ffffff' : (isDark ? '#94a3b8' : '#475569'),
          }}
        >
          {count.tasks}
        </span>
      </button>
    );
  };

  const renderUniformAllCard = () => {
    const isSelected = selectedCategory === 'all';
    return (
      <button
        type="button"
        onClick={() => handleSelectCategory('all')}
        className={`group relative flex items-center justify-between w-full h-8 sm:h-8.5 px-2 sm:px-2.5 rounded-xl border text-[11px] sm:text-xs font-bold transition-all duration-200 ease-out cursor-pointer select-none overflow-hidden ${
          isSelected
            ? 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 border-[#00f2ff] text-white shadow-xs shadow-[#00f2ff]/25 ring-1.5 ring-[#00f2ff]/60 scale-[1.01]'
            : isDark
              ? 'bg-[#10192e]/90 hover:bg-[#162340] border-[#1e2d4a] hover:border-cyan-500/40 text-slate-300 hover:text-white hover:-translate-y-0.5 hover:shadow-md hover:shadow-cyan-500/10'
              : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-cyan-400 text-slate-700 hover:text-slate-900 hover:-translate-y-0.5 hover:shadow-xs'
        } active:scale-95 active:translate-y-0`}
        title="Vista General / Todas las Colecciones"
      >
        <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 bg-cyan-500/18 text-cyan-400 group-hover:scale-110 transition-transform duration-200">
          {renderCollectionDoodle('all', '#00f2ff', isSelected)}
        </div>

        <span className={`flex-1 mx-1.5 text-left font-bold tracking-tight truncate leading-tight transition-colors ${
          isSelected ? 'text-white font-extrabold' : 'text-slate-300 group-hover:text-white'
        }`}>
          Todas
        </span>

        <span className={`shrink-0 text-[9.5px] font-mono px-1.5 py-0.2 rounded-md font-bold ${
          isSelected ? 'bg-cyan-400/30 text-cyan-200' : isDark ? 'bg-[#1b253b] text-slate-400' : 'bg-slate-200 text-slate-600'
        }`}>
          {tasks.length}
        </span>
      </button>
    );
  };

  const renderUniformMenuCard = () => {
    return (
      <div className="relative w-full" ref={collectionsDropdownRef}>
        <button
          type="button"
          onClick={() => setIsCollectionsDropdownOpen((prev) => !prev)}
          className={`group relative flex items-center justify-between w-full h-8 sm:h-8.5 px-2 sm:px-2.5 rounded-xl border text-[11px] sm:text-xs font-bold transition-all duration-200 ease-out cursor-pointer select-none overflow-hidden ${
            isCollectionsDropdownOpen
              ? 'bg-gradient-to-r from-cyan-950/90 to-blue-950/90 border-[#00f2ff] text-cyan-200 shadow-sm shadow-[#00f2ff]/20 ring-1.5 ring-[#00f2ff]/50'
              : isDark
                ? 'bg-[#10192e]/90 hover:bg-[#162340] border-[#1e2d4a] hover:border-slate-500 text-slate-300 hover:text-white hover:-translate-y-0.5 hover:shadow-md'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:-translate-y-0.5 hover:shadow-xs'
          } active:scale-95 active:translate-y-0`}
          title="Abrir menú desplegable de áreas de vida"
          aria-expanded={isCollectionsDropdownOpen}
        >
          <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 bg-indigo-500/18 text-indigo-400 group-hover:scale-110 transition-transform duration-200">
            {renderCollectionDoodle('menu', '#818cf8', isCollectionsDropdownOpen)}
          </div>

          <span className="flex-1 mx-1.5 text-left font-bold tracking-tight truncate leading-tight text-slate-300 group-hover:text-white">
            Colecciones
          </span>

          <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
            isCollectionsDropdownOpen ? 'rotate-180 text-[#00f2ff]' : 'text-slate-400 group-hover:text-slate-200'
          }`} />
        </button>

        {/* Dropdown Menu Modal */}
        {isCollectionsDropdownOpen && (
          <div className={`absolute left-0 top-full mt-1.5 w-72 sm:w-84 rounded-2xl border shadow-2xl z-50 p-2 overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-top-2 ${
            isDark
              ? 'bg-[#0f172a]/95 backdrop-blur-2xl border-slate-700/90 shadow-black/80 text-slate-100'
              : 'bg-white/95 backdrop-blur-2xl border-slate-200 shadow-slate-400/30 text-slate-800'
          }`}>
            {/* Header */}
            <div className="px-2.5 py-2 border-b border-slate-700/40 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FolderHeart className="w-4 h-4 text-[#00f2ff]" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Colecciones de Vida
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {categories.length} Áreas
              </span>
            </div>

            {/* Option: Todas las Colecciones */}
            <button
              type="button"
              onClick={() => {
                handleSelectCategory('all');
                setIsCollectionsDropdownOpen(false);
              }}
              className={`w-full mt-1.5 flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? isDark
                    ? 'bg-cyan-500/20 text-cyan-200 font-bold border border-cyan-500/40'
                    : 'bg-cyan-50 text-cyan-800 font-bold border border-cyan-300'
                  : isDark
                    ? 'hover:bg-slate-800/70 text-slate-300 hover:text-white'
                    : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold truncate">Todas las Colecciones</p>
                  <p className="text-[10px] text-slate-400 truncate">Vista General y Dashboard completo</p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 shrink-0 pl-2">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300">
                  {tasks.length} metas
                </span>
                {selectedCategory === 'all' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </div>
            </button>

            <div className="my-1.5 border-t border-slate-700/40" />

            {/* Categories List */}
            <div className="max-h-72 overflow-y-auto space-y-1 pr-0.5 scrollbar-thin">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const count = categoryCounts[cat.id] || { tasks: 0, ideas: 0, total: 0 };
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      handleSelectCategory(cat.id);
                      setIsCollectionsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'bg-gradient-to-r from-slate-800 to-slate-800/80 border text-white font-bold'
                          : 'bg-slate-100 border text-slate-900 font-bold'
                        : isDark
                          ? 'hover:bg-slate-800/60 text-slate-300 hover:text-white'
                          : 'hover:bg-slate-100 text-slate-700'
                    }`}
                    style={{
                      borderColor: isSelected ? cat.color : 'transparent'
                    }}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div 
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-xs"
                        style={{
                          backgroundColor: `${cat.color}20`,
                          borderColor: `${cat.color}40`,
                          color: cat.color,
                          borderWidth: '1px'
                        }}
                      >
                        {getCategoryIconComponent(cat.iconName, 'w-3.5 h-3.5')}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{cat.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{cat.description || ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5 shrink-0 pl-2">
                      <span 
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold"
                        style={{
                          backgroundColor: isSelected ? `${cat.color}30` : isDark ? '#1e293b' : '#e2e8f0',
                          color: isSelected ? (isDark ? '#fff' : cat.color) : undefined
                        }}
                      >
                        {count.tasks} metas
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5" style={{ color: cat.color }} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleBrandClick = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      setActiveTab('gestion');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0b1326]/95 backdrop-blur-xl border-b border-[#2d3449]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Tier 1: Main Brand & Actions Header */}
        <div className="py-2 sm:py-2.5 border-b border-[#1c2947]/60">
          
          {/* Top Row: Brand on Left, Primary Actions & User on Right */}
          <div className="flex items-center justify-between gap-2">
            
            {/* Brand Logo & Name */}
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              <button
                onClick={handleBrandClick}
                className="group relative flex items-center space-x-2 sm:space-x-3 text-left rounded-2xl p-1 -ml-1 transition-all duration-300 hover:bg-[#121c33]/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00f2ff] cursor-pointer"
                title="Ir al Inicio / Portada de LifeBlocks"
                aria-label="Ir al inicio / portada de LifeBlocks"
              >
                {/* Logo with glow */}
                <div className="relative shrink-0">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl overflow-hidden border-2 border-[#00f2ff]/50 group-hover:border-[#00f2ff] shadow-md shadow-[#00f2ff]/20 bg-gradient-to-br from-[#121c33] via-[#0d1627] to-[#0a1020] flex items-center justify-center p-0.5 transition-all duration-300 group-hover:scale-105">
                    <img
                      src={APP_LOGO}
                      alt="LifeBlocks Logo"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#00f2ff] text-[#00363a] flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                    <Home className="w-2 sm:w-2.5 h-2 sm:h-2.5 stroke-[2.5]" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <span className="text-lg sm:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-[#00f2ff] group-hover:from-[#00f2ff] group-hover:to-[#38ef7d] transition-all">
                      LifeBlocks
                    </span>
                    <span className="hidden sm:inline-flex items-center px-2 py-0.2 text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-full">
                      v2.1
                    </span>
                  </div>
                  <p className="hidden sm:block text-[11px] text-slate-400 group-hover:text-cyan-200 transition-colors font-medium">
                    Bloques de Vida • Hábitos • Salud • Metas
                  </p>
                </div>
              </button>
            </div>

            {/* Desktop Action Tools Strip (Visible on sm screens and larger) */}
            <div className="hidden sm:flex items-center space-x-2">
              
              {/* Asistente & Herramientas IA Dropdown */}
              {(onOpenAssistantIntegration || onOpenBrainDump || onOpenAgent || onOpenInstallApp) && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsAssistantMenuOpen(!isAssistantMenuOpen);
                      setIsUserMenuOpen(false);
                    }}
                    className={`h-8 px-3 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer border ${
                      isAssistantMenuOpen
                        ? 'bg-cyan-500/25 text-white border-cyan-400 ring-1 ring-cyan-400/40'
                        : 'bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-teal-500/15 hover:from-cyan-500/25 hover:to-blue-500/25 text-cyan-200 hover:text-white border-cyan-500/40 hover:border-cyan-400'
                    }`}
                    title="Herramientas de Inteligencia Artificial y Asistentes"
                    aria-expanded={isAssistantMenuOpen}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#00f2ff]" />
                    <span>Asistente & IA</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <ChevronDown className={`w-3 h-3 text-cyan-300 transition-transform duration-200 ${isAssistantMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu with Backdrop */}
                  {isAssistantMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsAssistantMenuOpen(false)}
                      />
                      <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-72 bg-[#101828] border border-[#23314d] rounded-2xl shadow-2xl p-2 z-50 space-y-1 animate-in fade-in duration-150">
                        <div className="px-2.5 py-1.5 border-b border-[#23314d] flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inteligencia Artificial & Apps</span>
                          <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 text-[10px] font-semibold border border-cyan-500/30">Gemini</span>
                        </div>

                        {/* 1. Agente Coach IA */}
                        {onOpenAgent && (
                          <button
                            onClick={() => {
                              setIsAssistantMenuOpen(false);
                              onOpenAgent();
                            }}
                            className="w-full p-2 text-left rounded-xl hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30 transition-all flex items-start space-x-2.5 group cursor-pointer"
                          >
                            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                              <Bot className="w-4 h-4 text-[#00f2ff]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <span className="text-xs font-semibold text-white group-hover:text-cyan-200">Agente Coach IA</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              </div>
                              <p className="text-[11px] text-slate-400 group-hover:text-slate-300 truncate">Mentor personal de hábitos y metas</p>
                            </div>
                          </button>
                        )}

                        {/* 2. Bot Telegram & Voz */}
                        {onOpenAssistantIntegration && (
                          <button
                            onClick={() => {
                              setIsAssistantMenuOpen(false);
                              onOpenAssistantIntegration();
                            }}
                            className="w-full p-2 text-left rounded-xl hover:bg-sky-500/10 border border-transparent hover:border-sky-500/30 transition-all flex items-start space-x-2.5 group cursor-pointer"
                          >
                            <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                              <span className="text-xs">✈️</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <span className="text-xs font-semibold text-white group-hover:text-sky-200">Bot Telegram & Voz</span>
                                <span className="px-1 py-0.2 bg-sky-500/20 text-sky-300 text-[9px] rounded font-semibold">Voz</span>
                              </div>
                              <p className="text-[11px] text-slate-400 group-hover:text-slate-300 truncate">Captura tareas o notas por audio</p>
                            </div>
                          </button>
                        )}

                        {/* 3. Brain Dump */}
                        {onOpenBrainDump && (
                          <button
                            onClick={() => {
                              setIsAssistantMenuOpen(false);
                              onOpenBrainDump();
                            }}
                            className="w-full p-2 text-left rounded-xl hover:bg-amber-500/10 border border-transparent hover:border-amber-500/30 transition-all flex items-start space-x-2.5 group cursor-pointer"
                          >
                            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                              <Brain className="w-4 h-4 text-amber-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <span className="text-xs font-semibold text-white group-hover:text-amber-200">Brain Dump</span>
                                <span className="px-1 py-0.2 bg-amber-500/20 text-amber-300 text-[9px] rounded font-semibold">IA</span>
                              </div>
                              <p className="text-[11px] text-slate-400 group-hover:text-slate-300 truncate">Vierte ideas y organízalas con IA</p>
                            </div>
                          </button>
                        )}

                        {/* 4. DeskBuddy // Modo Tablet & Escritorio */}
                        <button
                          onClick={() => {
                            setIsAssistantMenuOpen(false);
                            setActiveTab('deskbuddy');
                          }}
                          className="w-full p-2 text-left rounded-xl hover:bg-cyan-500/15 border border-cyan-500/30 hover:border-[#00f2ff] bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-[#0b1426] transition-all flex items-start space-x-2.5 group cursor-pointer shadow-md shadow-cyan-500/10"
                        >
                          <div className="w-7 h-7 rounded-lg bg-[#00f2ff]/20 border border-[#00f2ff]/50 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform text-[#00f2ff]">
                            <Radio className="w-4 h-4 text-[#00f2ff]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs font-bold text-white group-hover:text-cyan-200">DeskBuddy // Tablet HUD</span>
                              <span className="px-1.5 py-0.2 bg-[#00f2ff]/30 text-cyan-200 text-[9px] rounded font-mono font-bold uppercase tracking-wider border border-[#00f2ff]/40 animate-pulse">
                                Always-On
                              </span>
                            </div>
                            <p className="text-[11px] text-cyan-300/80 group-hover:text-cyan-100 truncate">
                              Pantalla fija con calendario, tareas, hábitos y asistente
                            </p>
                          </div>
                        </button>

                        {/* 5. Instalar App */}
                        {onOpenInstallApp && (
                          <button
                            onClick={() => {
                              setIsAssistantMenuOpen(false);
                              onOpenInstallApp();
                            }}
                            className="w-full p-2 text-left rounded-xl hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/30 transition-all flex items-start space-x-2.5 group cursor-pointer border-t border-[#23314d]/60 mt-1"
                          >
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                              <Download className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <span className="text-xs font-semibold text-white group-hover:text-emerald-200">Instalar App Móvil</span>
                                <span className="px-1 py-0.2 bg-emerald-500/20 text-emerald-300 text-[9px] rounded font-semibold">PWA</span>
                              </div>
                              <p className="text-[11px] text-slate-400 group-hover:text-slate-300 truncate">Instalar en celular o PC como app nativa</p>
                            </div>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Theme Toggle (Modo Claro / Modo Oscuro) */}
              <button
                onClick={toggleTheme}
                className={`h-8 px-2.5 sm:px-3 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer border ${
                  isDark
                    ? 'bg-[#131f3f] hover:bg-[#1c2c54] text-amber-300 border-amber-400/30 hover:border-amber-300'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 hover:border-indigo-300'
                }`}
                title={isDark ? 'Cambiar a Modo Claro (fondo blanco)' : 'Cambiar a Modo Oscuro (fondo noche)'}
                aria-label="Alternar modo oscuro y modo claro"
              >
                {isDark ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden lg:inline">Modo Claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="hidden lg:inline">Modo Oscuro</span>
                  </>
                )}
              </button>
            </div>

            {/* Right side CTAs: New Goal Button & User Auth (Visible on all screen sizes) */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
              
              {/* Web Push Notifications Button */}
              {onOpenNotifications && (
                <button
                  type="button"
                  onClick={onOpenNotifications}
                  className="h-8 px-2 sm:px-2.5 rounded-xl bg-[#131b2e] hover:bg-slate-800 border border-[#2d3449] hover:border-amber-400/50 text-slate-300 hover:text-amber-300 flex items-center space-x-1.5 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
                  title="Configurar Notificaciones Web Push (Alertas de Tareas y Hábitos)"
                >
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline text-xs font-medium">Alertas</span>
                </button>
              )}

              {/* Primary CTA: New Goal / Task */}
              <button
                onClick={onOpenNewTaskModal}
                className="h-8 px-3 sm:px-3.5 bg-[#00f2ff] hover:bg-[#00dbe7] text-[#00363a] font-semibold text-xs rounded-xl shadow-md shadow-[#00f2ff]/20 transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
                title="Crear Nueva Meta o Tarea"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="inline">Nueva Meta</span>
              </button>

              {/* User Profile / Auth */}
              {user ? (
                <div className="relative shrink-0">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(!isUserMenuOpen);
                      setIsAssistantMenuOpen(false);
                    }}
                    className="h-8 p-1 sm:px-2.5 bg-[#131b2e] hover:bg-slate-800 border border-[#2d3449] rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                    title={user.displayName || user.email || 'Mi Perfil'}
                  >
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || 'Avatar'} referrerPolicy="no-referrer" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-[#00f2ff] to-[#38ef7d] text-[#00363a] font-bold flex items-center justify-center text-[10px]">
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="hidden md:inline font-semibold text-slate-200 max-w-[90px] truncate text-xs">
                      {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {/* Dropdown menu */}
                  {isUserMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-64 bg-[#131b2e] border border-[#2d3449] rounded-2xl shadow-2xl p-2 z-50 space-y-1 animate-in fade-in duration-150">
                        <div className="p-2 border-b border-[#2d3449]">
                          <div className="text-xs font-bold text-white truncate">{user.displayName || 'Usuario'}</div>
                          <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                        </div>

                        {/* Theme Toggle in User Dropdown */}
                        <button
                          onClick={() => {
                            toggleTheme();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full px-3 py-2 text-left text-xs text-indigo-400 hover:bg-indigo-500/10 rounded-xl flex items-center space-x-2 font-semibold cursor-pointer transition-colors"
                        >
                          {isDark ? (
                            <>
                              <Sun className="w-3.5 h-3.5 text-amber-400" />
                              <span>Cambiar a Modo Claro ☀️</span>
                            </>
                          ) : (
                            <>
                              <Moon className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Cambiar a Modo Oscuro 🌙</span>
                            </>
                          )}
                        </button>

                        {onOpenInstallApp && (
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onOpenInstallApp();
                            }}
                            className="w-full px-3 py-2 text-left text-xs text-emerald-300 hover:bg-emerald-500/10 rounded-xl flex items-center space-x-2 font-semibold cursor-pointer transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-400" />
                            <span>📲 Instalar App en Celular</span>
                          </button>
                        )}

                        {onOpenNotifications && (
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onOpenNotifications();
                            }}
                            className="w-full px-3 py-2 text-left text-xs text-amber-300 hover:bg-amber-500/10 rounded-xl flex items-center space-x-2 font-semibold cursor-pointer transition-colors"
                          >
                            <Bell className="w-3.5 h-3.5 text-amber-400" />
                            <span>🔔 Alertas Web Push</span>
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onResetAllData();
                          }}
                          className="w-full px-3 py-2 text-left text-xs text-amber-300 hover:bg-amber-500/10 rounded-xl flex items-center space-x-2 font-semibold cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Comenzar desde 0 (Limpiar Todo)</span>
                        </button>

                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onLoadExamples();
                          }}
                          className="w-full px-3 py-2 text-left text-xs text-cyan-300 hover:bg-cyan-500/10 rounded-xl flex items-center space-x-2 font-semibold cursor-pointer transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Cargar datos de ejemplo</span>
                        </button>

                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onSignOut();
                          }}
                          className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 rounded-xl flex items-center space-x-2 font-semibold cursor-pointer transition-colors border-t border-[#2d3449]/60"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Cerrar Sesión</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={() => onOpenAuth('login')}
                    className="h-8 px-2.5 sm:px-3 bg-[#131b2e] hover:bg-slate-800 text-slate-200 border border-[#2d3449] font-semibold text-xs rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Entrar</span>
                  </button>

                  <button
                    onClick={() => onOpenAuth('register')}
                    className="h-8 px-2.5 sm:px-3 bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] hover:brightness-110 text-[#00363a] font-semibold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Registro</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Second Line: Scrollable Touch-Friendly AI & Assistant Ribbon */}
          <div className="sm:hidden mt-2 pt-1.5 border-t border-[#1c2947]/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 px-0.5">
            {/* 1. Telegram & Voice Bot */}
            {onOpenAssistantIntegration && (
              <button
                onClick={onOpenAssistantIntegration}
                className="px-2.5 py-1.5 bg-[#0088cc]/20 hover:bg-[#0088cc]/30 text-sky-200 hover:text-white border border-[#0088cc]/50 rounded-xl text-[11px] font-semibold transition-all flex items-center space-x-1.5 shadow-sm shrink-0 whitespace-nowrap active:scale-95"
                title="Vincular Bot de Telegram, Siri o Gemini Móvil"
              >
                <span className="text-xs">✈️</span>
                <span className="text-white">Bot Telegram & Voz</span>
                <span className="px-1 py-0.2 bg-sky-400/30 text-sky-200 text-[9px] rounded font-semibold">IA</span>
              </button>
            )}

            {/* 2. Brain Dump */}
            {onOpenBrainDump && (
              <button
                onClick={onOpenBrainDump}
                className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-200 border border-amber-500/40 rounded-xl text-[11px] font-semibold transition-all flex items-center space-x-1.5 shadow-sm shrink-0 whitespace-nowrap active:scale-95"
                title="Brain Dump: Captura de ideas con IA"
              >
                <Brain className="w-3 h-3 text-amber-400" />
                <span>Brain Dump</span>
                <span className="px-1 py-0.2 bg-amber-400/25 text-amber-200 text-[9px] rounded font-semibold">IA</span>
              </button>
            )}

            {/* 3. AI Agent */}
            {onOpenAgent && (
              <button
                onClick={onOpenAgent}
                className="px-2.5 py-1.5 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-200 border border-cyan-500/40 rounded-xl text-[11px] font-semibold transition-all flex items-center space-x-1.5 shadow-sm shrink-0 whitespace-nowrap active:scale-95"
                title="Agente Coach IA"
              >
                <Bot className="w-3 h-3 text-[#00f2ff]" />
                <span>Agente IA</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </button>
            )}

            {/* DeskBuddy Tablet HUD */}
            <button
              onClick={() => setActiveTab('deskbuddy')}
              className="px-2.5 py-1.5 bg-gradient-to-r from-cyan-500/25 via-blue-500/20 to-teal-500/20 text-cyan-200 hover:text-white border border-[#00f2ff]/50 rounded-xl text-[11px] font-semibold transition-all flex items-center space-x-1.5 shadow-sm shrink-0 whitespace-nowrap active:scale-95"
              title="Abrir DeskBuddy (Pantalla fija para Tablet y Escritorio)"
            >
              <Radio className="w-3 h-3 text-[#00f2ff]" />
              <span>DeskBuddy HUD</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-ping" />
            </button>

            {/* 4. Theme Toggle (Modo Claro / Modo Oscuro) */}
            <button
              onClick={toggleTheme}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all flex items-center space-x-1 shadow-sm shrink-0 whitespace-nowrap border active:scale-95 ${
                isDark
                  ? 'bg-[#131f3f] text-amber-300 border-amber-400/40'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}
              title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
            >
              {isDark ? (
                <>
                  <Sun className="w-3 h-3 text-amber-400" />
                  <span>Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-3 h-3 text-indigo-600" />
                  <span>Modo Oscuro</span>
                </>
              )}
            </button>

            {/* 5. Install App */}
            {onOpenInstallApp && (
              <button
                onClick={onOpenInstallApp}
                className="px-2.5 py-1.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-xl text-[11px] font-semibold transition-all flex items-center space-x-1 shadow-sm shrink-0 whitespace-nowrap active:scale-95"
                title="Instalar App en el Celular"
              >
                <Download className="w-3 h-3 text-[#38ef7d]" />
                <span>Instalar App</span>
              </button>
            )}
          </div>
        </div>

        {/* Tier 2: Navigation Pillars Hub (Symmetrical 6-Column Full-Width Grid) */}
        <div className="py-2 sm:py-2.5 w-full">
          <nav className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 sm:gap-2">
            
            {/* 1. Pilar: Gestión de Vida & Metas */}
            <button
              onClick={() => {
                setActiveTab('gestion');
                if (onGoHome) {
                  onGoHome();
                } else {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className={`group relative flex items-center space-x-2 sm:space-x-2.5 px-2 sm:px-2.5 lg:px-3 py-2 sm:py-2.5 rounded-2xl border transition-all duration-200 cursor-pointer w-full min-w-0 select-none overflow-hidden ${
                activeTab === 'gestion'
                  ? 'bg-gradient-to-r from-cyan-500/25 via-teal-500/20 to-blue-600/20 border-[#00f2ff] text-white shadow-lg shadow-[#00f2ff]/25 scale-[1.02] ring-1 ring-[#00f2ff]/50'
                  : isDark 
                    ? 'bg-[#111a2e]/90 hover:bg-[#16223d] border-[#1e2d4a] hover:border-cyan-500/50 text-slate-300 hover:text-white shadow-sm hover:scale-[1.01]' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-cyan-400 text-slate-700 hover:text-slate-900 shadow-sm hover:scale-[1.01]'
              }`}
              title="Pilar 1: Gestión de Vida, Metas & Colecciones"
              aria-label="Pilar 1: Gestión de Vida, Metas & Colecciones"
            >
              {/* Active ambient glow pill */}
              {activeTab === 'gestion' && (
                <span className="absolute -top-1 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f2ff] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00f2ff]"></span>
                </span>
              )}
              
              <div className={`w-7.5 h-7.5 sm:w-8 sm:h-8 lg:w-8.5 lg:h-8.5 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0 ${
                activeTab === 'gestion'
                  ? 'bg-[#00f2ff] text-[#00363a] shadow-md shadow-[#00f2ff]/40 rotate-[-2deg]'
                  : 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 group-hover:scale-105 group-hover:border-cyan-400'
              }`}>
                <CheckSquare className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
              </div>

              <div className="text-left min-w-0 flex-1">
                <div className="flex items-center space-x-1 min-w-0">
                  <span className={`text-[11px] sm:text-xs xl:text-sm font-extrabold tracking-tight truncate ${
                    activeTab === 'gestion' ? 'text-white' : ''
                  }`}>
                    Gestión & Metas
                  </span>
                  <span className={`shrink-0 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                    activeTab === 'gestion' ? 'bg-[#00f2ff]/30 text-cyan-200 border border-[#00f2ff]/40' : 'bg-slate-700/50 text-slate-400'
                  }`}>
                    {tasks.length}
                  </span>
                </div>
                <span className={`hidden sm:block text-[9.5px] xl:text-[10px] leading-tight truncate ${
                  activeTab === 'gestion' ? 'text-cyan-200 font-medium' : 'text-slate-400 group-hover:text-slate-300'
                }`}>
                  Metas & Áreas
                </span>
              </div>
            </button>

            {/* Pilar: Ideas Pendientes & Banco de Ideas */}
            <button
              onClick={() => {
                setActiveTab('ideas');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`group relative flex items-center space-x-2 sm:space-x-2.5 px-2 sm:px-2.5 lg:px-3 py-2 sm:py-2.5 rounded-2xl border transition-all duration-200 cursor-pointer w-full min-w-0 select-none overflow-hidden ${
                activeTab === 'ideas'
                  ? 'bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-orange-500/20 border-amber-400 text-white shadow-lg shadow-amber-500/25 scale-[1.02] ring-1 ring-amber-400/50'
                  : isDark 
                    ? 'bg-[#111a2e]/90 hover:bg-[#16223d] border-[#1e2d4a] hover:border-amber-400/50 text-slate-300 hover:text-white shadow-sm hover:scale-[1.01]' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-amber-400 text-slate-700 hover:text-slate-900 shadow-sm hover:scale-[1.01]'
              }`}
              title="Pilar: Banco de Ideas, Estados (Pendiente / 50% / Hecha) y Contador de Vida (+30 días)"
              aria-label="Pilar: Ideas Pendientes"
            >
              {activeTab === 'ideas' && (
                <span className="absolute -top-1 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                </span>
              )}

              <div className={`w-7.5 h-7.5 sm:w-8 sm:h-8 lg:w-8.5 lg:h-8.5 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0 ${
                activeTab === 'ideas'
                  ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-[#0b1326] shadow-md shadow-amber-500/40 rotate-[-2deg]'
                  : 'bg-amber-500/15 border border-amber-500/30 text-amber-400 group-hover:scale-105 group-hover:border-amber-400'
              }`}>
                <Lightbulb className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${activeTab === 'ideas' ? 'animate-pulse stroke-[2.5]' : ''}`} />
              </div>

              <div className="text-left min-w-0 flex-1">
                <div className="flex items-center space-x-1 min-w-0">
                  <span className={`text-[11px] sm:text-xs xl:text-sm font-extrabold tracking-tight truncate ${
                    activeTab === 'ideas' ? 'text-white' : ''
                  }`}>
                    Ideas
                  </span>
                  <span className={`shrink-0 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                    activeTab === 'ideas' 
                      ? 'bg-amber-400/30 text-amber-200 border border-amber-400/40' 
                      : (agedIdeasCount && agedIdeasCount > 0)
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                        : 'bg-slate-700/50 text-slate-400'
                  }`}>
                    {ideasCount !== undefined ? ideasCount : 0}
                    {agedIdeasCount && agedIdeasCount > 0 ? ' 🔥' : ''}
                  </span>
                </div>
                <span className={`hidden sm:block text-[9.5px] xl:text-[10px] leading-tight truncate ${
                  activeTab === 'ideas' ? 'text-amber-200 font-medium' : 'text-slate-400 group-hover:text-slate-300'
                }`}>
                  Lista & +30 Días
                </span>
              </div>
            </button>

            {/* 2. Pilar: Hábitos Diarios */}
            <button
              onClick={() => setActiveTab('habitos')}
              className={`group relative flex items-center space-x-2 sm:space-x-2.5 px-2 sm:px-2.5 lg:px-3 py-2 sm:py-2.5 rounded-2xl border transition-all duration-200 cursor-pointer w-full min-w-0 select-none overflow-hidden ${
                activeTab === 'habitos'
                  ? 'bg-gradient-to-r from-amber-500/25 via-orange-500/20 to-red-500/20 border-amber-400 text-white shadow-lg shadow-amber-500/25 scale-[1.02] ring-1 ring-amber-400/50'
                  : isDark 
                    ? 'bg-[#111a2e]/90 hover:bg-[#16223d] border-[#1e2d4a] hover:border-amber-400/50 text-slate-300 hover:text-white shadow-sm hover:scale-[1.01]' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-amber-400 text-slate-700 hover:text-slate-900 shadow-sm hover:scale-[1.01]'
              }`}
              title="Pilar 2: Hábitos Diarios & Rutinas de Disciplina"
            >
              {activeTab === 'habitos' && (
                <span className="absolute -top-1 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                </span>
              )}

              <div className={`w-7.5 h-7.5 sm:w-8 sm:h-8 lg:w-8.5 lg:h-8.5 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0 ${
                activeTab === 'habitos'
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-[#0b1326] shadow-md shadow-amber-500/40 rotate-[-2deg]'
                  : 'bg-amber-500/15 border border-amber-500/30 text-amber-400 group-hover:scale-105 group-hover:border-amber-400'
              }`}>
                <Flame className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${activeTab === 'habitos' ? 'animate-pulse stroke-[2.5]' : ''}`} />
              </div>

              <div className="text-left min-w-0 flex-1">
                <div className="flex items-center space-x-1 min-w-0">
                  <span className={`text-[11px] sm:text-xs xl:text-sm font-extrabold tracking-tight truncate ${
                    activeTab === 'habitos' ? 'text-white' : ''
                  }`}>
                    Hábitos Diarios
                  </span>
                  {habitsCount > 0 && (
                    <span className={`shrink-0 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                      activeTab === 'habitos' ? 'bg-amber-400/30 text-amber-200 border border-amber-400/40' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {habitsCount}
                    </span>
                  )}
                </div>
                <span className={`hidden sm:block text-[9.5px] xl:text-[10px] leading-tight truncate ${
                  activeTab === 'habitos' ? 'text-amber-200 font-medium' : 'text-slate-400 group-hover:text-slate-300'
                }`}>
                  Rachas & Rutinas
                </span>
              </div>
            </button>

            {/* 3. Pilar: Calendario */}
            <button
              onClick={() => setActiveTab('calendario')}
              className={`group relative flex items-center space-x-2 sm:space-x-2.5 px-2 sm:px-2.5 lg:px-3 py-2 sm:py-2.5 rounded-2xl border transition-all duration-200 cursor-pointer w-full min-w-0 select-none overflow-hidden ${
                activeTab === 'calendario'
                  ? 'bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-cyan-500/20 border-emerald-400 text-white shadow-lg shadow-emerald-500/25 scale-[1.02] ring-1 ring-emerald-400/50'
                  : isDark 
                    ? 'bg-[#111a2e]/90 hover:bg-[#16223d] border-[#1e2d4a] hover:border-emerald-400/50 text-slate-300 hover:text-white shadow-sm hover:scale-[1.01]' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-emerald-400 text-slate-700 hover:text-slate-900 shadow-sm hover:scale-[1.01]'
              }`}
              title="Pilar 3: Calendario & Programación Semanal"
            >
              {activeTab === 'calendario' && (
                <span className="absolute -top-1 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
              )}

              <div className={`w-7.5 h-7.5 sm:w-8 sm:h-8 lg:w-8.5 lg:h-8.5 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0 ${
                activeTab === 'calendario'
                  ? 'bg-gradient-to-br from-[#4285F4] to-teal-500 text-white shadow-md shadow-[#4285F4]/40 rotate-[-2deg]'
                  : 'bg-[#4285F4]/15 border border-[#4285F4]/30 text-[#4285F4] group-hover:scale-105 group-hover:border-[#4285F4]'
              }`}>
                <Calendar className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
              </div>

              <div className="text-left min-w-0 flex-1">
                <div className="flex items-center space-x-1 min-w-0">
                  <span className={`text-[11px] sm:text-xs xl:text-sm font-extrabold tracking-tight truncate ${
                    activeTab === 'calendario' ? 'text-white' : ''
                  }`}>
                    Google Calendar
                  </span>
                  <span className={`shrink-0 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                    activeTab === 'calendario' ? 'bg-[#4285F4]/30 text-blue-200 border border-[#4285F4]/40' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    Google
                  </span>
                </div>
                <span className={`hidden sm:block text-[9.5px] xl:text-[10px] leading-tight truncate ${
                  activeTab === 'calendario' ? 'text-blue-200 font-medium' : 'text-slate-400 group-hover:text-slate-300'
                }`}>
                  Oficial & Bot Sync
                </span>
              </div>
            </button>

            {/* 4. Pilar: % Cumplimiento */}
            <button
              onClick={() => setActiveTab('cumplimiento')}
              className={`group relative flex items-center space-x-2 sm:space-x-2.5 px-2 sm:px-2.5 lg:px-3 py-2 sm:py-2.5 rounded-2xl border transition-all duration-200 cursor-pointer w-full min-w-0 select-none overflow-hidden ${
                activeTab === 'cumplimiento'
                  ? 'bg-gradient-to-r from-purple-500/25 via-indigo-500/20 to-pink-500/20 border-purple-400 text-white shadow-lg shadow-purple-500/25 scale-[1.02] ring-1 ring-purple-400/50'
                  : isDark 
                    ? 'bg-[#111a2e]/90 hover:bg-[#16223d] border-[#1e2d4a] hover:border-purple-400/50 text-slate-300 hover:text-white shadow-sm hover:scale-[1.01]' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-purple-400 text-slate-700 hover:text-slate-900 shadow-sm hover:scale-[1.01]'
              }`}
              title="Pilar 4: Analítica, Métricas & % de Cumplimiento"
            >
              {activeTab === 'cumplimiento' && (
                <span className="absolute -top-1 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-400"></span>
                </span>
              )}

              <div className={`w-7.5 h-7.5 sm:w-8 sm:h-8 lg:w-8.5 lg:h-8.5 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0 ${
                activeTab === 'cumplimiento'
                  ? 'bg-gradient-to-br from-purple-400 to-indigo-500 text-white shadow-md shadow-purple-500/40 rotate-[-2deg]'
                  : 'bg-purple-500/15 border border-purple-500/30 text-purple-400 group-hover:scale-105 group-hover:border-purple-400'
              }`}>
                <PieChart className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
              </div>

              <div className="text-left min-w-0 flex-1">
                <div className="flex items-center space-x-1 min-w-0">
                  <span className={`text-[11px] sm:text-xs xl:text-sm font-extrabold tracking-tight truncate ${
                    activeTab === 'cumplimiento' ? 'text-white' : ''
                  }`}>
                    Cumplimiento
                  </span>
                  <span className={`shrink-0 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                    activeTab === 'cumplimiento' ? 'bg-purple-400/30 text-purple-200 border border-purple-400/40' : 'bg-purple-500/20 text-purple-300'
                  }`}>
                    {metrics.overallCompletionPercentage}%
                  </span>
                </div>
                <span className={`hidden sm:block text-[9.5px] xl:text-[10px] leading-tight truncate ${
                  activeTab === 'cumplimiento' ? 'text-purple-200 font-medium' : 'text-slate-400 group-hover:text-slate-300'
                }`}>
                  Progreso & Analítica
                </span>
              </div>
            </button>

            {/* 5. Pilar: Historial & Archivo */}
            <button
              onClick={() => setActiveTab('historial')}
              className={`group relative flex items-center space-x-2 sm:space-x-2.5 px-2 sm:px-2.5 lg:px-3 py-2 sm:py-2.5 rounded-2xl border transition-all duration-200 cursor-pointer w-full min-w-0 select-none overflow-hidden ${
                activeTab === 'historial'
                  ? 'bg-gradient-to-r from-blue-500/25 via-slate-600/20 to-indigo-500/20 border-sky-400 text-white shadow-lg shadow-sky-500/25 scale-[1.02] ring-1 ring-sky-400/50'
                  : isDark 
                    ? 'bg-[#111a2e]/90 hover:bg-[#16223d] border-[#1e2d4a] hover:border-slate-400/50 text-slate-300 hover:text-white shadow-sm hover:scale-[1.01]' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-400 text-slate-700 hover:text-slate-900 shadow-sm hover:scale-[1.01]'
              }`}
              title="Pilar 5: Historial de Avances, Horas Dedicadas & Archivo"
            >
              {activeTab === 'historial' && (
                <span className="absolute -top-1 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400"></span>
                </span>
              )}

              <div className={`w-7.5 h-7.5 sm:w-8 sm:h-8 lg:w-8.5 lg:h-8.5 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0 ${
                activeTab === 'historial'
                  ? 'bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-md shadow-sky-500/40 rotate-[-2deg]'
                  : 'bg-sky-500/15 border border-sky-500/30 text-sky-400 group-hover:scale-105 group-hover:border-sky-400'
              }`}>
                <History className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
              </div>

              <div className="text-left min-w-0 flex-1">
                <div className="flex items-center space-x-1 min-w-0">
                  <span className={`text-[11px] sm:text-xs xl:text-sm font-extrabold tracking-tight truncate ${
                    activeTab === 'historial' ? 'text-white' : ''
                  }`}>
                    Historial
                  </span>
                  <span className={`shrink-0 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                    activeTab === 'historial' ? 'bg-sky-400/30 text-sky-200 border border-sky-400/40' : 'bg-slate-700/50 text-slate-400'
                  }`}>
                    Logs
                  </span>
                </div>
                <span className={`hidden sm:block text-[9.5px] xl:text-[10px] leading-tight truncate ${
                  activeTab === 'historial' ? 'text-sky-200 font-medium' : 'text-slate-400 group-hover:text-slate-300'
                }`}>
                  Horas & Victorias
                </span>
              </div>
            </button>

          </nav>
        </div>

        {/* Tier 3: Uniform 5x2 Collections Grid occupying the full width with standardized cards and doodles */}
        <div className={`pt-2 pb-2 border-t transition-colors duration-200 ${
          isDark ? 'border-[#1c2947]/70' : 'border-slate-200/80'
        }`}>
          <div className="w-full overflow-x-auto scrollbar-none py-0.5 touch-pan-x">
            <div className="min-w-[560px] sm:min-w-0 w-full grid grid-cols-5 gap-1.5 sm:gap-2">
              
              {/* Row 1 (5 perfectly equal slots) */}
              {renderUniformAllCard()}
              {categories.find(c => c.id === 'salud_deporte') && renderUniformCategoryCard(categories.find(c => c.id === 'salud_deporte')!)}
              {categories.find(c => c.id === 'vehiculos') && renderUniformCategoryCard(categories.find(c => c.id === 'vehiculos')!)}
              {categories.find(c => c.id === 'actividades_pendientes') && renderUniformCategoryCard(categories.find(c => c.id === 'actividades_pendientes')!)}
              {categories.find(c => c.id === 'familia_relaciones') && renderUniformCategoryCard(categories.find(c => c.id === 'familia_relaciones')!)}

              {/* Row 2 (5 perfectly equal slots) */}
              {renderUniformMenuCard()}
              {categories.find(c => c.id === 'aprendizaje') && renderUniformCategoryCard(categories.find(c => c.id === 'aprendizaje')!)}
              {categories.find(c => c.id === 'bienestar_mente') && renderUniformCategoryCard(categories.find(c => c.id === 'bienestar_mente')!)}
              {categories.find(c => c.id === 'ocio_entretenimiento') && renderUniformCategoryCard(categories.find(c => c.id === 'ocio_entretenimiento')!)}
              {categories.find(c => c.id === 'finanzas_hogar') && renderUniformCategoryCard(categories.find(c => c.id === 'finanzas_hogar')!)}

              {/* Any extra custom categories */}
              {categories
                .filter(c => !['salud_deporte', 'vehiculos', 'actividades_pendientes', 'familia_relaciones', 'aprendizaje', 'bienestar_mente', 'ocio_entretenimiento', 'finanzas_hogar'].includes(c.id))
                .map(cat => renderUniformCategoryCard(cat))
              }

            </div>
          </div>
        </div>

      </div>
    </header>
  );
};
