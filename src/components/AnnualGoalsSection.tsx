import React, { useState, useEffect, useMemo } from 'react';
import { AnnualGoal, AnnualMilestone, CategoryInfo } from '../types';
import { INITIAL_ANNUAL_GOALS } from '../data/initialAnnualGoals';
import { useTheme } from '../context/ThemeContext';
import { db, auth, sanitizeForFirestore } from '../lib/firebase';
import { collection, query, where, onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Edit3,
  Trash2,
  Filter,
  TrendingUp,
  Award,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Layers,
  Flag,
  X,
  Check,
  Compass,
  AlertCircle
} from 'lucide-react';

interface AnnualGoalsSectionProps {
  categories: CategoryInfo[];
  onSelectCategory?: (catId: string) => void;
}

const ANNUAL_GOALS_STORAGE_KEY = 'lifeblocks_annual_goals';

export const AnnualGoalsSection: React.FC<AnnualGoalsSectionProps> = ({
  categories,
  onSelectCategory
}) => {
  const { isDark } = useTheme();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedQuarterFilter, setSelectedQuarterFilter] = useState<'all' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<AnnualGoal | null>(null);
  const [isSectionCollapsed, setIsSectionCollapsed] = useState(false);

  // New Milestone inline input state per goal
  const [newMilestoneText, setNewMilestoneText] = useState<{ [goalId: string]: string }>({});
  const [newMilestoneQuarter, setNewMilestoneQuarter] = useState<{ [goalId: string]: 'Q1' | 'Q2' | 'Q3' | 'Q4' }>({});

  // Local storage state initialization
  const [annualGoals, setAnnualGoals] = useState<AnnualGoal[]>(() => {
    try {
      const saved = localStorage.getItem(ANNUAL_GOALS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading annual goals from localStorage', e);
    }
    return INITIAL_ANNUAL_GOALS;
  });

  // Firestore sync if user is logged in
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const q = query(collection(db, 'annual_goals'), where('userId', '==', currentUser.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const loaded: AnnualGoal[] = [];
          snapshot.forEach((docSnap) => {
            loaded.push({ ...docSnap.data(), id: docSnap.id } as AnnualGoal);
          });
          setAnnualGoals(loaded);
          localStorage.setItem(ANNUAL_GOALS_STORAGE_KEY, JSON.stringify(loaded));
        }
      }, (err) => {
        console.warn('Firestore annual goals subscription note:', err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Error setting up annual goals listener:', e);
    }
  }, []);

  // Persist to localStorage and Firestore
  const saveGoals = async (updated: AnnualGoal[]) => {
    setAnnualGoals(updated);
    try {
      localStorage.setItem(ANNUAL_GOALS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving annual goals to localStorage:', e);
    }

    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        for (const goal of updated) {
          const sanitized = sanitizeForFirestore({
            ...goal,
            userId: currentUser.uid,
          });
          await setDoc(doc(db, 'annual_goals', goal.id), sanitized, { merge: true });
        }
      } catch (e) {
        console.warn('Error syncing annual goals to Firestore:', e);
      }
    }
  };

  // Day of the year progress calculation
  const yearProgressInfo = useMemo(() => {
    const now = new Date();
    const start = new Date(selectedYear, 0, 1);
    const end = new Date(selectedYear, 11, 31, 23, 59, 59);
    const totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // If viewing current year, show real day
    const currentYear = now.getFullYear();
    let currentDayOfYear = totalDays;
    let pct = 100;
    
    if (selectedYear === currentYear) {
      const diffTime = Math.max(0, now.getTime() - start.getTime());
      currentDayOfYear = Math.min(totalDays, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      pct = Math.min(100, Math.round((currentDayOfYear / totalDays) * 100));
    } else if (selectedYear > currentYear) {
      currentDayOfYear = 0;
      pct = 0;
    }

    return {
      totalDays,
      currentDayOfYear,
      percentage: pct
    };
  }, [selectedYear]);

  // Filtered goals by year, category, and quarter
  const filteredGoals = useMemo(() => {
    return annualGoals.filter((goal) => {
      const matchesYear = goal.year === selectedYear;
      const matchesCategory = selectedCategoryFilter === 'all' || goal.categoryId === selectedCategoryFilter;
      const matchesQuarter =
        selectedQuarterFilter === 'all' ||
        goal.quarter === selectedQuarterFilter ||
        goal.milestones?.some((m) => m.targetQuarter === selectedQuarterFilter);

      return matchesYear && matchesCategory && matchesQuarter;
    });
  }, [annualGoals, selectedYear, selectedCategoryFilter, selectedQuarterFilter]);

  // Overall statistics for the selected year
  const stats = useMemo(() => {
    const yearGoals = annualGoals.filter((g) => g.year === selectedYear);
    const total = yearGoals.length;
    const completedGoals = yearGoals.filter((g) => g.status === 'completada').length;

    let totalMilestones = 0;
    let completedMilestones = 0;

    yearGoals.forEach((g) => {
      if (Array.isArray(g.milestones)) {
        totalMilestones += g.milestones.length;
        completedMilestones += g.milestones.filter((m) => m.completed).length;
      }
    });

    const milestonePct = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
    const goalPct = total > 0 ? Math.round((completedGoals / total) * 100) : 0;

    return {
      total,
      completedGoals,
      totalMilestones,
      completedMilestones,
      milestonePct,
      goalPct
    };
  }, [annualGoals, selectedYear]);

  // Toggle milestone completion
  const handleToggleMilestone = async (goalId: string, milestoneId: string) => {
    const updated = annualGoals.map((g) => {
      if (g.id !== goalId) return g;
      const nextMilestones = (g.milestones || []).map((m) => {
        if (m.id !== milestoneId) return m;
        const nextState = !m.completed;
        return {
          ...m,
          completed: nextState,
          completedAt: nextState ? new Date().toISOString() : undefined
        };
      });

      // Auto update goal status if all milestones are completed
      const allDone = nextMilestones.length > 0 && nextMilestones.every((m) => m.completed);
      const anyDone = nextMilestones.some((m) => m.completed);
      const nextStatus = allDone ? 'completada' : anyDone ? 'en_progreso' : g.status;

      // Update metric value if using % unit
      let nextMetric = g.currentMetricValue;
      if (g.metricUnit === '%' && g.targetMetricValue === 100) {
        const doneCount = nextMilestones.filter((m) => m.completed).length;
        nextMetric = Math.round((doneCount / Math.max(1, nextMilestones.length)) * 100);
      }

      return {
        ...g,
        milestones: nextMilestones,
        status: nextStatus as any,
        currentMetricValue: nextMetric,
        updatedAt: new Date().toISOString()
      };
    });

    await saveGoals(updated);
  };

  // Add a new milestone to an existing goal
  const handleAddMilestoneToGoal = async (goalId: string) => {
    const text = (newMilestoneText[goalId] || '').trim();
    if (!text) return;

    const quarter = newMilestoneQuarter[goalId] || 'Q4';

    const updated = annualGoals.map((g) => {
      if (g.id !== goalId) return g;
      const newM: AnnualMilestone = {
        id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: text,
        completed: false,
        targetQuarter: quarter
      };
      return {
        ...g,
        milestones: [...(g.milestones || []), newM],
        updatedAt: new Date().toISOString()
      };
    });

    await saveGoals(updated);
    setNewMilestoneText((prev) => ({ ...prev, [goalId]: '' }));
  };

  // Delete a milestone
  const handleDeleteMilestone = async (goalId: string, milestoneId: string) => {
    const updated = annualGoals.map((g) => {
      if (g.id !== goalId) return g;
      return {
        ...g,
        milestones: (g.milestones || []).filter((m) => m.id !== milestoneId),
        updatedAt: new Date().toISOString()
      };
    });
    await saveGoals(updated);
  };

  // Toggle goal completed status
  const handleToggleGoalStatus = async (goalId: string) => {
    const updated = annualGoals.map((g) => {
      if (g.id !== goalId) return g;
      const isComplete = g.status === 'completada';
      const nextStatus = isComplete ? 'en_progreso' : 'completada';
      
      // If marking as complete, also mark all milestones as completed
      const updatedMilestones = !isComplete
        ? (g.milestones || []).map((m) => ({ ...m, completed: true, completedAt: new Date().toISOString() }))
        : g.milestones;

      return {
        ...g,
        status: nextStatus as any,
        milestones: updatedMilestones,
        currentMetricValue: !isComplete && g.targetMetricValue ? g.targetMetricValue : g.currentMetricValue,
        updatedAt: new Date().toISOString()
      };
    });
    await saveGoals(updated);
  };

  // Delete an entire annual goal
  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta meta anual?')) return;
    const updated = annualGoals.filter((g) => g.id !== goalId);
    setAnnualGoals(updated);
    try {
      localStorage.setItem(ANNUAL_GOALS_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        await deleteDoc(doc(db, 'annual_goals', goalId));
      } catch (e) {
        console.warn('Error deleting goal from Firestore:', e);
      }
    }
  };

  // Modal Form State
  const [formYear, setFormYear] = useState<number>(selectedYear);
  const [formCategory, setFormCategory] = useState<string>(categories[0]?.id || 'salud_bienestar');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formQuarter, setFormQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4' | 'anual'>('anual');
  const [formTargetDate, setFormTargetDate] = useState('');
  const [formMetricUnit, setFormMetricUnit] = useState('%');
  const [formTargetMetric, setFormTargetMetric] = useState<string>('100');
  const [formCurrentMetric, setFormCurrentMetric] = useState<string>('0');
  const [formMilestones, setFormMilestones] = useState<{ title: string; quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' }[]>([
    { title: '', quarter: 'Q1' },
    { title: '', quarter: 'Q2' },
    { title: '', quarter: 'Q3' },
    { title: '', quarter: 'Q4' }
  ]);

  const handleOpenCreateModal = () => {
    setEditingGoal(null);
    setFormYear(selectedYear);
    setFormCategory(categories[0]?.id || 'finanzas_hogar');
    setFormTitle('');
    setFormDescription('');
    setFormQuarter('anual');
    setFormTargetDate(`${selectedYear}-12-31`);
    setFormMetricUnit('%');
    setFormTargetMetric('100');
    setFormCurrentMetric('0');
    setFormMilestones([
      { title: '', quarter: 'Q1' },
      { title: '', quarter: 'Q2' },
      { title: '', quarter: 'Q3' },
      { title: '', quarter: 'Q4' }
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (goal: AnnualGoal) => {
    setEditingGoal(goal);
    setFormYear(goal.year);
    setFormCategory(goal.categoryId);
    setFormTitle(goal.title);
    setFormDescription(goal.description || '');
    setFormQuarter(goal.quarter || 'anual');
    setFormTargetDate(goal.targetDate || '');
    setFormMetricUnit(goal.metricUnit || '%');
    setFormTargetMetric(goal.targetMetricValue !== undefined ? String(goal.targetMetricValue) : '100');
    setFormCurrentMetric(goal.currentMetricValue !== undefined ? String(goal.currentMetricValue) : '0');
    setFormMilestones(
      goal.milestones && goal.milestones.length > 0
        ? goal.milestones.map((m) => ({ title: m.title, quarter: m.targetQuarter || 'Q1' }))
        : [
            { title: '', quarter: 'Q1' },
            { title: '', quarter: 'Q2' },
            { title: '', quarter: 'Q3' },
            { title: '', quarter: 'Q4' }
          ]
    );
    setIsModalOpen(true);
  };

  const handleSaveModalGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const validMilestones: AnnualMilestone[] = formMilestones
      .filter((m) => m.title.trim().length > 0)
      .map((m, idx) => ({
        id: `m-${Date.now()}-${idx}`,
        title: m.title.trim(),
        completed: false,
        targetQuarter: m.quarter
      }));

    if (editingGoal) {
      // Keep existing completed states where applicable
      const mergedMilestones: AnnualMilestone[] = formMilestones
        .filter((m) => m.title.trim().length > 0)
        .map((m, idx) => {
          const existing = editingGoal.milestones?.find((em) => em.title.toLowerCase() === m.title.toLowerCase());
          return {
            id: existing ? existing.id : `m-${Date.now()}-${idx}`,
            title: m.title.trim(),
            completed: existing ? existing.completed : false,
            targetQuarter: m.quarter,
            completedAt: existing?.completedAt
          };
        });

      const updatedGoal: AnnualGoal = {
        ...editingGoal,
        year: formYear,
        categoryId: formCategory,
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        quarter: formQuarter,
        targetDate: formTargetDate || undefined,
        metricUnit: formMetricUnit || '%',
        targetMetricValue: parseFloat(formTargetMetric) || 100,
        currentMetricValue: parseFloat(formCurrentMetric) || 0,
        milestones: mergedMilestones,
        updatedAt: new Date().toISOString()
      };

      const updated = annualGoals.map((g) => (g.id === editingGoal.id ? updatedGoal : g));
      await saveGoals(updated);
    } else {
      const newGoal: AnnualGoal = {
        id: `ag-${Date.now()}`,
        year: formYear,
        categoryId: formCategory,
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        status: 'en_progreso',
        quarter: formQuarter,
        targetDate: formTargetDate || undefined,
        metricUnit: formMetricUnit || '%',
        targetMetricValue: parseFloat(formTargetMetric) || 100,
        currentMetricValue: parseFloat(formCurrentMetric) || 0,
        milestones: validMilestones,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updated = [newGoal, ...annualGoals];
      await saveGoals(updated);
    }

    setIsModalOpen(false);
  };

  return (
    <section className="space-y-4 pt-2">
      {/* Container Card */}
      <div
        className={`rounded-3xl border shadow-xl p-5 sm:p-7 transition-all ${
          isDark
            ? 'bg-gradient-to-br from-[#0c1429] via-[#091022] to-[#070b18] border-[#22355c] shadow-black/50'
            : 'bg-gradient-to-br from-white via-slate-50/80 to-amber-50/20 border-amber-200/80 shadow-slate-200/80'
        }`}
      >
        {/* Top Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <span className="p-1.5 rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 text-slate-950 font-bold shadow-md shadow-amber-500/20">
                <Target className="w-4 h-4 stroke-[2.5]" />
              </span>
              <span
                className={`text-xs font-mono font-bold uppercase tracking-wider ${
                  isDark ? 'text-amber-300' : 'text-amber-800'
                }`}
              >
                Visión Estratégica & Largo Plazo
              </span>

              {/* Year Switcher Pills */}
              <div
                className={`inline-flex items-center p-0.5 rounded-xl border ml-2 ${
                  isDark ? 'bg-[#060b17] border-[#253961]' : 'bg-slate-100 border-slate-300'
                }`}
              >
                {[2025, 2026, 2027].map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setSelectedYear(yr)}
                    className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                      selectedYear === yr
                        ? 'bg-gradient-to-r from-amber-400 to-rose-400 text-slate-950 shadow-sm'
                        : isDark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>

            <h3
              className={`text-2xl sm:text-3xl font-black tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Metas Anuales {selectedYear}
            </h3>

            <p className={`text-xs sm:text-sm max-w-2xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Establece hitos a largo plazo vinculados a tus áreas de vida. Desglosa cada gran aspiración en cuartos trimestrales (Q1-Q4) para medir tu avance real.
            </p>
          </div>

          {/* Action buttons & collapse toggle */}
          <div className="flex items-center space-x-2 shrink-0 self-start lg:self-center">
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-400 via-rose-400 to-purple-400 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Nueva Meta Anual</span>
            </button>

            <button
              onClick={() => setIsSectionCollapsed(!isSectionCollapsed)}
              className={`p-2.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                isDark
                  ? 'border-[#22355c] bg-[#0c1429] text-slate-300 hover:text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:text-slate-900'
              }`}
              title={isSectionCollapsed ? 'Expandir sección' : 'Colapsar sección'}
            >
              {isSectionCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {!isSectionCollapsed && (
          <div className="space-y-6 pt-4 animate-in fade-in duration-200">
            {/* Year Progress Bar & KPI Cards */}
            <div className="space-y-3">
              {/* Year Progress Bar */}
              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-[#070d1d] border-[#1d2d50]' : 'bg-amber-50/50 border-amber-200/60'
                }`}
              >
                <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                  <span className={`font-semibold flex items-center space-x-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Progreso del Año {selectedYear}</span>
                    <span className="text-[10px] text-slate-400">
                      (Día {yearProgressInfo.currentDayOfYear} de {yearProgressInfo.totalDays})
                    </span>
                  </span>
                  <span className={`font-bold font-mono ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                    {yearProgressInfo.percentage}% transcurrido
                  </span>
                </div>
                <div
                  className={`w-full h-2.5 rounded-full overflow-hidden p-0.5 border ${
                    isDark ? 'bg-[#040813] border-[#1f3158]' : 'bg-slate-200 border-slate-300'
                  }`}
                >
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 via-rose-400 to-purple-400 rounded-full transition-all duration-700"
                    style={{ width: `${yearProgressInfo.percentage}%` }}
                  />
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div
                  className={`p-3.5 rounded-2xl border ${
                    isDark ? 'bg-[#0c1429] border-[#1f3158]' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400">
                    <span>Metas Anuales</span>
                    <Flag className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className={`text-2xl font-black font-mono mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {stats.total}
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
                    {stats.completedGoals} logradas al 100%
                  </div>
                </div>

                <div
                  className={`p-3.5 rounded-2xl border ${
                    isDark ? 'bg-[#0c1429] border-[#1f3158]' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400">
                    <span>Hitos Totales</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className={`text-2xl font-black font-mono mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {stats.completedMilestones} <span className="text-xs text-slate-400 font-normal">/ {stats.totalMilestones}</span>
                  </div>
                  <div className="text-[11px] font-mono text-cyan-400 mt-0.5">
                    {stats.milestonePct}% de hitos cumplidos
                  </div>
                </div>

                <div
                  className={`p-3.5 rounded-2xl border ${
                    isDark ? 'bg-[#0c1429] border-[#1f3158]' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400">
                    <span>Avance Global</span>
                    <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className={`text-2xl font-black font-mono mt-1 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                    {stats.milestonePct}%
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    promedio de hitos
                  </div>
                </div>

                <div
                  className={`p-3.5 rounded-2xl border ${
                    isDark ? 'bg-[#0c1429] border-[#1f3158]' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400">
                    <span>Enfoque Q3-Q4</span>
                    <Award className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <div className={`text-xl font-bold font-mono mt-1 truncate ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>
                    Cierre de Año
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">
                    Consolidación de metas
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Bar (Category selector & Quarter filter) */}
            <div
              className={`p-3 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-3 ${
                isDark ? 'bg-[#091124] border-[#1d2d50]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              {/* Category dropdown */}
              <div className="flex items-center space-x-2 w-full md:w-auto">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border focus:outline-none focus:border-amber-400 cursor-pointer ${
                    isDark ? 'bg-[#0c1429] border-[#22355c] text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="all">Todas las Categorías ({annualGoals.filter((g) => g.year === selectedYear).length})</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quarter tabs */}
              <div
                className={`flex items-center space-x-1 p-1 rounded-xl border text-xs ${
                  isDark ? 'bg-[#060b17] border-[#1d2d50]' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                {(['all', 'Q1', 'Q2', 'Q3', 'Q4'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => setSelectedQuarterFilter(q)}
                    className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                      selectedQuarterFilter === q
                        ? isDark
                          ? 'bg-amber-500/25 border border-amber-400/40 text-amber-300'
                          : 'bg-amber-100 border border-amber-300 text-amber-900 shadow-sm'
                        : isDark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {q === 'all' ? 'Todos' : q}
                  </button>
                ))}
              </div>
            </div>

            {/* Goals Cards Grid */}
            {filteredGoals.length === 0 ? (
              <div
                className={`text-center py-10 px-4 rounded-3xl border border-dashed space-y-3 ${
                  isDark ? 'bg-[#081020] border-[#1f3158]' : 'bg-slate-50 border-slate-300'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto text-2xl">
                  🎯
                </div>
                <div className="space-y-1">
                  <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    No hay metas anuales en este filtro ({selectedYear})
                  </h4>
                  <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Crea tu primer hito a largo plazo vinculado a una categoría como Salud, Finanzas o Desarrollo Personal para orientar tu año.
                  </p>
                </div>
                <button
                  onClick={handleOpenCreateModal}
                  className="px-4 py-2 bg-gradient-to-r from-amber-400 to-rose-400 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer transition-all active:scale-95"
                >
                  + Crear Meta Anual {selectedYear}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredGoals.map((goal) => {
                  const cat = categories.find((c) => c.id === goal.categoryId);
                  const totalMilestones = goal.milestones?.length || 0;
                  const completedMilestones = (goal.milestones || []).filter((m) => m.completed).length;
                  const progressPct =
                    totalMilestones > 0
                      ? Math.round((completedMilestones / totalMilestones) * 100)
                      : goal.currentMetricValue && goal.targetMetricValue
                      ? Math.min(100, Math.round((goal.currentMetricValue / goal.targetMetricValue) * 100))
                      : 0;

                  const isComplete = goal.status === 'completada' || progressPct === 100;

                  return (
                    <div
                      key={goal.id}
                      className={`rounded-2xl border p-4 sm:p-5 transition-all duration-300 shadow-md flex flex-col justify-between space-y-4 ${
                        isComplete
                          ? isDark
                            ? 'bg-gradient-to-br from-[#0c1a2e] via-[#091526] to-[#07101e] border-emerald-500/40 shadow-emerald-950/20'
                            : 'bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-white border-emerald-200 shadow-sm'
                          : isDark
                          ? 'bg-[#091226] border-[#1d2d50] hover:border-amber-400/50 shadow-black/40'
                          : 'bg-white border-slate-200 hover:border-amber-400 shadow-slate-200/60'
                      }`}
                    >
                      {/* Top Card Row: Category Badge + Quarter + Action icons */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center space-x-2">
                            {/* Category Badge */}
                            <span
                              className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold flex items-center space-x-1"
                              style={{
                                backgroundColor: `${cat?.color || '#f59e0b'}20`,
                                color: cat?.color || '#f59e0b',
                                border: `1px solid ${cat?.color || '#f59e0b'}40`
                              }}
                            >
                              <span>{cat?.name || 'General'}</span>
                            </span>

                            {/* Quarter / Anual Badge */}
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                                isDark
                                  ? 'bg-[#060b17] border-slate-700 text-slate-300'
                                  : 'bg-slate-100 border-slate-300 text-slate-700'
                              }`}
                            >
                              {goal.quarter ? `Hito ${goal.quarter.toUpperCase()}` : 'Anual'}
                            </span>
                          </div>

                          {/* Action Buttons: Status toggle, Edit, Delete */}
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleToggleGoalStatus(goal.id)}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                isComplete
                                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                                  : isDark
                                  ? 'border-[#22355c] bg-[#0c1429] text-slate-400 hover:text-white'
                                  : 'border-slate-300 bg-slate-100 text-slate-600 hover:text-slate-900'
                              }`}
                              title={isComplete ? 'Marcar como en progreso' : 'Marcar meta como 100% completada'}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleOpenEditModal(goal)}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                isDark
                                  ? 'border-[#22355c] bg-[#0c1429] text-slate-400 hover:text-amber-300 hover:border-amber-400'
                                  : 'border-slate-300 bg-slate-100 text-slate-600 hover:text-amber-600'
                              }`}
                              title="Editar meta anual e hitos"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteGoal(goal.id)}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                isDark
                                  ? 'border-[#22355c] bg-[#0c1429] text-slate-400 hover:text-rose-400 hover:border-rose-400'
                                  : 'border-slate-300 bg-slate-100 text-slate-600 hover:text-rose-600'
                              }`}
                              title="Eliminar meta anual"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Goal Title */}
                        <h4
                          className={`text-base font-extrabold tracking-tight ${
                            isComplete
                              ? isDark ? 'text-emerald-200' : 'text-emerald-950'
                              : isDark ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {goal.title}
                        </h4>

                        {/* Description */}
                        {goal.description && (
                          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            {goal.description}
                          </p>
                        )}
                      </div>

                      {/* Progress Bar & Metric */}
                      <div className="space-y-1.5 pt-1 border-t border-slate-700/30">
                        <div className="flex justify-between items-center text-xs font-mono">
                          <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Progreso de Hitos ({completedMilestones} de {totalMilestones})
                          </span>
                          <span
                            className={`font-black font-mono ${
                              isComplete
                                ? 'text-emerald-400'
                                : progressPct >= 50
                                ? 'text-amber-400'
                                : 'text-cyan-400'
                            }`}
                          >
                            {progressPct}%
                          </span>
                        </div>
                        <div
                          className={`w-full h-2 rounded-full overflow-hidden p-0.5 border ${
                            isDark ? 'bg-[#050b18] border-[#1d2d50]' : 'bg-slate-100 border-slate-300'
                          }`}
                        >
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isComplete
                                ? 'bg-gradient-to-r from-emerald-400 to-teal-400 shadow-sm shadow-emerald-400/50'
                                : 'bg-gradient-to-r from-amber-400 via-rose-400 to-purple-400 shadow-sm shadow-amber-400/50'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>

                        {/* Optional Target Metric text */}
                        {goal.targetMetricValue && (
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-0.5">
                            <span>Métrica objetivo:</span>
                            <span className="font-bold text-slate-200">
                              {goal.currentMetricValue || 0} / {goal.targetMetricValue} {goal.metricUnit}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Milestones Checklist (Hitos Desglosados) */}
                      <div className="space-y-2 pt-1">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between">
                          <span>Hitos de Avance (Milestones):</span>
                          {goal.targetDate && (
                            <span className="text-[9px] font-normal text-slate-400">
                              Límite: {goal.targetDate}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                          {(goal.milestones || []).map((milestone) => (
                            <div
                              key={milestone.id}
                              className={`flex items-start justify-between p-2 rounded-xl border text-xs transition-all ${
                                milestone.completed
                                  ? isDark
                                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                  : isDark
                                  ? 'bg-[#060c1c] border-[#182645] text-slate-300 hover:border-slate-600'
                                  : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
                              }`}
                            >
                              <div
                                onClick={() => handleToggleMilestone(goal.id, milestone.id)}
                                className="flex items-start space-x-2 cursor-pointer flex-1 mr-2 select-none"
                              >
                                <button
                                  type="button"
                                  className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                    milestone.completed
                                      ? 'bg-emerald-500 border-emerald-400 text-white'
                                      : isDark
                                      ? 'border-slate-600 bg-[#091122]'
                                      : 'border-slate-400 bg-white'
                                  }`}
                                >
                                  {milestone.completed && <Check className="w-3 h-3 stroke-[3]" />}
                                </button>
                                <span
                                  className={`text-xs leading-snug ${
                                    milestone.completed ? 'line-through opacity-75' : 'font-medium'
                                  }`}
                                >
                                  {milestone.title}
                                </span>
                              </div>

                              <div className="flex items-center space-x-1 shrink-0">
                                {milestone.targetQuarter && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                                      milestone.completed
                                        ? 'bg-emerald-500/20 text-emerald-300'
                                        : isDark
                                        ? 'bg-slate-800 text-slate-400'
                                        : 'bg-slate-200 text-slate-700'
                                    }`}
                                  >
                                    {milestone.targetQuarter}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMilestone(goal.id, milestone.id)}
                                  className="p-0.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                                  title="Eliminar hito"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Inline add milestone to this goal */}
                        <div className="flex items-center space-x-1.5 pt-1">
                          <input
                            type="text"
                            value={newMilestoneText[goal.id] || ''}
                            onChange={(e) =>
                              setNewMilestoneText((prev) => ({ ...prev, [goal.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddMilestoneToGoal(goal.id);
                              }
                            }}
                            placeholder="+ Añadir hito (ej: Q3: Iniciar trámite)..."
                            className={`flex-1 px-2.5 py-1 text-xs rounded-xl border focus:outline-none focus:border-amber-400 ${
                              isDark
                                ? 'bg-[#050b18] border-[#1b2b4d] text-slate-200 placeholder-slate-500'
                                : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                            }`}
                          />
                          <select
                            value={newMilestoneQuarter[goal.id] || 'Q3'}
                            onChange={(e) =>
                              setNewMilestoneQuarter((prev) => ({
                                ...prev,
                                [goal.id]: e.target.value as any
                              }))
                            }
                            className={`px-2 py-1 text-[11px] font-mono rounded-xl border cursor-pointer ${
                              isDark ? 'bg-[#050b18] border-[#1b2b4d] text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
                            }`}
                          >
                            <option value="Q1">Q1</option>
                            <option value="Q2">Q2</option>
                            <option value="Q3">Q3</option>
                            <option value="Q4">Q4</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleAddMilestoneToGoal(goal.id)}
                            className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition-all active:scale-95"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Card Bottom Link: View connected category */}
                      {onSelectCategory && cat && (
                        <div className="pt-2 border-t border-slate-700/30 flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-400">
                            Área vinculada: <strong className="text-slate-300">{cat.name}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => onSelectCategory(cat.id)}
                            className="text-[11px] font-mono font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1 cursor-pointer transition-colors"
                          >
                            <span>Explorar área</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Create / Edit Annual Goal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
              isDark ? 'bg-[#0c1429] border-[#22355c] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div
              className={`p-5 border-b flex items-center justify-between ${
                isDark ? 'border-[#1b2b4d] bg-[#081022]' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-rose-400 text-slate-950 font-bold">
                  <Target className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight">
                    {editingGoal ? 'Editar Meta Anual' : `Nueva Meta Anual ${formYear}`}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Define un objetivo a largo plazo e hitos trimestrales vinculados a tus categorías.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveModalGoal} className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Row 1: Year & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-300">Año de la Meta:</label>
                  <select
                    value={formYear}
                    onChange={(e) => setFormYear(parseInt(e.target.value, 10))}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold focus:outline-none focus:border-amber-400 ${
                      isDark ? 'bg-[#060b17] border-[#22355c] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026 (Año Actual)</option>
                    <option value={2027}>2027 (Próximo Año)</option>
                    <option value={2028}>2028</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-300">Categoría Vinculada:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none focus:border-amber-400 ${
                      isDark ? 'bg-[#060b17] border-[#22355c] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Goal Title */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-slate-300">Título de la Meta Anual:</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ej: Comprar vehículo familiar / Carrera 21K / Fondo de emergencia..."
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-amber-400 ${
                    isDark ? 'bg-[#060b17] border-[#22355c] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Goal Description */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-slate-300">Visión / Por qué es importante (opcional):</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Explica qué lograrás al cumplir este hito a largo plazo y cómo impactará tu vida..."
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-amber-400 resize-none ${
                    isDark ? 'bg-[#060b17] border-[#22355c] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Quarter & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-300">Periodo Objetivo:</label>
                  <select
                    value={formQuarter}
                    onChange={(e) => setFormQuarter(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-mono focus:outline-none focus:border-amber-400 ${
                      isDark ? 'bg-[#060b17] border-[#22355c] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="anual">Todo el Año (Anual)</option>
                    <option value="Q1">Q1 (Enero - Marzo)</option>
                    <option value="Q2">Q2 (Abril - Junio)</option>
                    <option value="Q3">Q3 (Julio - Septiembre)</option>
                    <option value="Q4">Q4 (Octubre - Diciembre)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-300">Fecha Límite (opcional):</label>
                  <input
                    type="date"
                    value={formTargetDate}
                    onChange={(e) => setFormTargetDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-mono focus:outline-none focus:border-amber-400 ${
                      isDark ? 'bg-[#060b17] border-[#22355c] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Milestones Builder (Desglose en Hitos Trimestrales) */}
              <div className="space-y-2 pt-2 border-t border-slate-700/40">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wide">
                    Hitos Trimestrales (Milestones de Avance):
                  </label>
                  <span className="text-[10px] text-slate-400">Desglosa los pasos clave</span>
                </div>

                <div className="space-y-2">
                  {formMilestones.map((m, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono font-bold shrink-0">
                        {m.quarter}
                      </span>
                      <input
                        type="text"
                        value={m.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormMilestones((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, title: val } : item))
                          );
                        }}
                        placeholder={`Hito ${idx + 1} para ${m.quarter}...`}
                        className={`flex-1 px-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:border-amber-400 ${
                          isDark ? 'bg-[#060b17] border-[#1d2d50] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                      <select
                        value={m.quarter}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setFormMilestones((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, quarter: val } : item))
                          );
                        }}
                        className={`px-2 py-1.5 rounded-xl border text-xs font-mono ${
                          isDark ? 'bg-[#060b17] border-[#1d2d50] text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
                        }`}
                      >
                        <option value="Q1">Q1</option>
                        <option value="Q2">Q2</option>
                        <option value="Q3">Q3</option>
                        <option value="Q4">Q4</option>
                      </select>
                      {formMilestones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setFormMilestones((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1 text-slate-400 hover:text-rose-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      setFormMilestones((prev) => [
                        ...prev,
                        {
                          title: '',
                          quarter: prev.length === 0 ? 'Q1' : prev.length === 1 ? 'Q2' : prev.length === 2 ? 'Q3' : 'Q4'
                        }
                      ])
                    }
                    className="text-xs font-mono font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1 cursor-pointer pt-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Añadir otro hito</span>
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-700/40 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-rose-400 hover:brightness-110 active:scale-95 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer transition-all flex items-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{editingGoal ? 'Guardar Cambios' : 'Crear Meta Anual'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
