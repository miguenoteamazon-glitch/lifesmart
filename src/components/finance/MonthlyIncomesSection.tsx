import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { MonthlyIncomeItem, MonthlyIncomeSource } from '../../types';
import { INITIAL_MONTHLY_INCOMES } from '../../data/initialData';
import {
  TrendingUp,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Circle,
  Calendar,
  DollarSign,
  User,
  Sparkles,
  CreditCard,
  Search,
  Filter,
  ArrowDownRight,
  Check,
  Building,
  Briefcase,
  Gift,
  Coins,
  RotateCcw
} from 'lucide-react';

interface MonthlyIncomesSectionProps {
  incomes: MonthlyIncomeItem[];
  onAddIncome: (income: Omit<MonthlyIncomeItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateIncome: (income: MonthlyIncomeItem) => void;
  onDeleteIncome: (incomeId: string) => void;
  onBatchSetIncomes?: (incomes: MonthlyIncomeItem[]) => void;
}

const INCOME_PRESETS: { name: string; earner: string; source: MonthlyIncomeSource; defaultAmount: number; defaultDay: number; channel: string; icon: string }[] = [
  { name: '1ra Quincena Miguel', earner: 'Miguel', source: 'quincena_1', defaultAmount: 2000000, defaultDay: 15, channel: 'Nómina Bancolombia', icon: '💼' },
  { name: '2da Quincena Miguel', earner: 'Miguel', source: 'quincena_2', defaultAmount: 3000000, defaultDay: 30, channel: 'Nómina Bancolombia', icon: '💼' },
  { name: 'Bonificación / Comisión', earner: 'Miguel', source: 'bonificacion', defaultAmount: 700000, defaultDay: 20, channel: 'Transferencia', icon: '🎁' },
  { name: 'Quincena Liz', earner: 'Liz', source: 'quincena_1', defaultAmount: 1500000, defaultDay: 15, channel: 'Cuenta Banco', icon: '🌸' },
  { name: '2da Quincena Liz', earner: 'Liz', source: 'quincena_2', defaultAmount: 1500000, defaultDay: 30, channel: 'Cuenta Banco', icon: '🌸' },
  { name: 'Rendimientos / Dividendos', earner: 'Hogar', source: 'inversion', defaultAmount: 350000, defaultDay: 10, channel: 'Fondo de Inversión', icon: '📈' },
  { name: 'Arriendo / Renta Recibida', earner: 'Hogar', source: 'arriendo_renta', defaultAmount: 800000, defaultDay: 5, channel: 'Transferencia Bancaria', icon: '🏠' },
  { name: 'Honorarios / Freelance', earner: 'Miguel', source: 'independiente', defaultAmount: 900000, defaultDay: 18, channel: 'Nequi / Daviplata', icon: '💻' },
];

const SOURCE_LABELS: Record<MonthlyIncomeSource, { label: string; icon: string; color: string }> = {
  quincena_1: { label: '1ra Quincena (1-15)', icon: '💼', color: '#10b981' },
  quincena_2: { label: '2da Quincena (16-31)', icon: '💼', color: '#06b6d4' },
  bonificacion: { label: 'Bonificación / Extra', icon: '🎁', color: '#f59e0b' },
  independiente: { label: 'Freelance / Ventas', icon: '💻', color: '#3b82f6' },
  arriendo_renta: { label: 'Renta / Alquiler', icon: '🏠', color: '#8b5cf6' },
  inversion: { label: 'Rendimientos / Intereses', icon: '📈', color: '#ec4899' },
  otro: { label: 'Otro Ingreso', icon: '💵', color: '#64748b' },
};

export const MonthlyIncomesSection: React.FC<MonthlyIncomesSectionProps> = ({
  incomes,
  onAddIncome,
  onUpdateIncome,
  onDeleteIncome,
  onBatchSetIncomes
}) => {
  const { isDark } = useTheme();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [earnerFilter, setEarnerFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'recibido' | 'pendiente'>('todos');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<MonthlyIncomeItem | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formEarner, setFormEarner] = useState('Miguel');
  const [formSource, setFormSource] = useState<MonthlyIncomeSource>('quincena_1');
  const [formEstimatedAmount, setFormEstimatedAmount] = useState<string>('');
  const [formActualAmount, setFormActualAmount] = useState<string>('');
  const [formDayOfMonth, setFormDayOfMonth] = useState<number>(15);
  const [formIsReceived, setFormIsReceived] = useState(false);
  const [formPaymentChannel, setFormPaymentChannel] = useState('Nómina Bancolombia');
  const [formNotes, setFormNotes] = useState('');

  // Quick inline add state
  const [quickName, setQuickName] = useState('');
  const [quickEarner, setQuickEarner] = useState('Miguel');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickDay, setQuickDay] = useState(15);

  // Success Feedback Toast
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Unique list of earners for filter dropdown
  const uniqueEarners = useMemo(() => {
    const list = new Set<string>();
    incomes.forEach(i => {
      if (i.earner && i.earner.trim()) list.add(i.earner.trim());
    });
    return Array.from(list);
  }, [incomes]);

  // Sort ascending by Day of Month (1-31)
  const sortedIncomes = useMemo(() => {
    return [...incomes].sort((a, b) => {
      if ((a.dayOfMonth || 15) !== (b.dayOfMonth || 15)) {
        return (a.dayOfMonth || 15) - (b.dayOfMonth || 15);
      }
      return a.name.localeCompare(b.name);
    });
  }, [incomes]);

  // Filtered incomes
  const filteredIncomes = useMemo(() => {
    return sortedIncomes.filter(item => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchEarner = (item.earner || '').toLowerCase().includes(q);
        const matchChannel = (item.paymentChannel || '').toLowerCase().includes(q);
        const matchNotes = (item.notes || '').toLowerCase().includes(q);
        if (!matchName && !matchEarner && !matchChannel && !matchNotes) return false;
      }
      if (earnerFilter !== 'todos' && item.earner !== earnerFilter) {
        return false;
      }
      if (statusFilter === 'recibido' && !item.isReceived) return false;
      if (statusFilter === 'pendiente' && item.isReceived) return false;

      return true;
    });
  }, [sortedIncomes, searchQuery, earnerFilter, statusFilter]);

  // Totals
  const totalEstimated = incomes.reduce((sum, item) => sum + (Number(item.estimatedAmount) || 0), 0);
  const totalReceived = incomes.reduce((sum, item) => {
    if (item.isReceived) {
      return sum + (item.actualAmount ? Number(item.actualAmount) : Number(item.estimatedAmount) || 0);
    }
    return sum;
  }, 0);
  const totalPending = Math.max(0, totalEstimated - totalReceived);

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleOpenAddModal = (preset?: typeof INCOME_PRESETS[0]) => {
    if (preset) {
      setEditingIncome(null);
      setFormName(preset.name);
      setFormEarner(preset.earner);
      setFormSource(preset.source);
      setFormEstimatedAmount(preset.defaultAmount.toString());
      setFormActualAmount('');
      setFormDayOfMonth(preset.defaultDay);
      setFormIsReceived(false);
      setFormPaymentChannel(preset.channel);
      setFormNotes('');
    } else {
      setEditingIncome(null);
      setFormName('');
      setFormEarner('Miguel');
      setFormSource('quincena_1');
      setFormEstimatedAmount('');
      setFormActualAmount('');
      setFormDayOfMonth(15);
      setFormIsReceived(false);
      setFormPaymentChannel('Nómina Bancolombia');
      setFormNotes('');
    }
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: MonthlyIncomeItem) => {
    setEditingIncome(item);
    setFormName(item.name);
    setFormEarner(item.earner || 'Miguel');
    setFormSource(item.source || 'quincena_1');
    setFormEstimatedAmount(item.estimatedAmount ? item.estimatedAmount.toString() : '');
    setFormActualAmount(item.actualAmount !== undefined && item.actualAmount !== null ? item.actualAmount.toString() : '');
    setFormDayOfMonth(item.dayOfMonth || 15);
    setFormIsReceived(Boolean(item.isReceived));
    setFormPaymentChannel(item.paymentChannel || 'Nómina Bancolombia');
    setFormNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const estimated = parseFloat(formEstimatedAmount) || 0;
    const actual = formActualAmount ? parseFloat(formActualAmount) : (formIsReceived ? estimated : undefined);

    if (editingIncome) {
      onUpdateIncome({
        ...editingIncome,
        name: formName.trim(),
        earner: formEarner.trim(),
        source: formSource,
        estimatedAmount: estimated,
        actualAmount: actual,
        dayOfMonth: Math.max(1, Math.min(31, Number(formDayOfMonth) || 15)),
        isReceived: formIsReceived,
        receivedDate: formIsReceived ? (editingIncome.receivedDate || new Date().toISOString().split('T')[0]) : undefined,
        paymentChannel: formPaymentChannel,
        notes: formNotes.trim() || undefined,
        updatedAt: new Date().toISOString(),
      });
      setSuccessMessage(`Ingreso actualizado: "${formName.trim()}"`);
    } else {
      onAddIncome({
        name: formName.trim(),
        earner: formEarner.trim(),
        source: formSource,
        estimatedAmount: estimated,
        actualAmount: actual,
        dayOfMonth: Math.max(1, Math.min(31, Number(formDayOfMonth) || 15)),
        isReceived: formIsReceived,
        receivedDate: formIsReceived ? new Date().toISOString().split('T')[0] : undefined,
        paymentChannel: formPaymentChannel,
        notes: formNotes.trim() || undefined,
      });
      // Clear filters so the newly created income is immediately visible in the view
      setSearchQuery('');
      setEarnerFilter('todos');
      setStatusFilter('todos');
      setSuccessMessage(`Ingreso guardado exitosamente: "${formName.trim()}"`);
    }

    setIsModalOpen(false);
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) return;
    const estimated = parseFloat(quickAmount) || 0;

    let source: MonthlyIncomeSource = 'quincena_1';
    if (quickDay > 15) source = 'quincena_2';
    if (quickName.toLowerCase().includes('bonificaci')) source = 'bonificacion';

    const addedName = quickName.trim();
    onAddIncome({
      name: addedName,
      earner: quickEarner.trim() || 'Miguel',
      source: source,
      estimatedAmount: estimated,
      actualAmount: undefined,
      dayOfMonth: Math.max(1, Math.min(31, Number(quickDay) || 15)),
      isReceived: false,
      paymentChannel: 'Nómina / Transferencia',
    });

    setQuickName('');
    setQuickAmount('');
    setSearchQuery('');
    setEarnerFilter('todos');
    setStatusFilter('todos');
    setSuccessMessage(`Ingreso guardado exitosamente: "${addedName}"`);
  };

  const handleToggleReceived = (item: MonthlyIncomeItem) => {
    const newStatus = !item.isReceived;
    onUpdateIncome({
      ...item,
      isReceived: newStatus,
      actualAmount: newStatus ? (item.actualAmount || item.estimatedAmount) : item.actualAmount,
      receivedDate: newStatus ? new Date().toISOString().split('T')[0] : undefined,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddPresetDirect = (preset: typeof INCOME_PRESETS[0]) => {
    // Check if already exists with same name
    const already = incomes.some(i => i.name.toLowerCase() === preset.name.toLowerCase());
    if (already) {
      handleOpenAddModal(preset);
      return;
    }
    onAddIncome({
      name: preset.name,
      earner: preset.earner,
      source: preset.source,
      estimatedAmount: preset.defaultAmount,
      actualAmount: undefined,
      dayOfMonth: preset.defaultDay,
      isReceived: false,
      paymentChannel: preset.channel,
    });
    setSearchQuery('');
    setEarnerFilter('todos');
    setStatusFilter('todos');
    setSuccessMessage(`Plantilla de ingreso agregada: "${preset.name}"`);
  };

  return (
    <div className="space-y-6">
      
      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-3.5 px-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center justify-between shadow-md animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Header & Summary Bar */}
      <div className={`p-5 rounded-3xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDark ? 'bg-[#101b2b] border-[#223552]' : 'bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-200'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-500">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className={`text-lg sm:text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                💵 Ingresos Mensuales del Hogar
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-mono">
                {incomes.length} fuentes
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Registra sueldos, quincenas de cada integrante, bonificaciones y rentas estimadas.
            </p>
          </div>
        </div>

        {/* Totals & Add Button */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] font-mono text-slate-400 uppercase block">Total Ingresos:</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {formatCOP(totalEstimated)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center space-x-2 cursor-pointer bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 hover:brightness-105 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>+ Nuevo Ingreso</span>
          </button>
        </div>
      </div>

      {/* 2. 1-CLICK QUICK PRESETS CHIPS */}
      <div className={`p-4 rounded-2xl border space-y-2.5 ${
        isDark ? 'bg-[#0f172a]/70 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Plantillas Rápidas de Ingresos (Clic para añadir en 1 segundo):</span>
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {INCOME_PRESETS.map((preset, idx) => {
            const isAdded = incomes.some(i => i.name.toLowerCase() === preset.name.toLowerCase());
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddPresetDirect(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs border ${
                  isAdded
                    ? isDark 
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-600/40 opacity-80' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : isDark
                      ? 'bg-[#151f38] hover:bg-[#1e2d4e] text-slate-300 border-[#2d3f66] hover:border-emerald-400'
                      : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-200 hover:border-emerald-400'
                }`}
                title={`Añadir ${preset.name} (${formatCOP(preset.defaultAmount)})`}
              >
                <span>{preset.icon}</span>
                <span>{preset.name}</span>
                <span className="font-mono text-[11px] opacity-75 font-semibold">({formatCOP(preset.defaultAmount)})</span>
                {isAdded ? (
                  <Check className="w-3 h-3 text-emerald-400 ml-1" />
                ) : (
                  <Plus className="w-3 h-3 opacity-60 ml-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. QUICK INLINE ADD BAR */}
      <form onSubmit={handleQuickAdd} className={`p-3.5 rounded-2xl border flex flex-wrap sm:flex-nowrap items-center gap-2.5 shadow-md ${
        isDark ? 'bg-[#131f33] border-[#223552]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex-1 min-w-[160px]">
          <input
            type="text"
            placeholder="Ej. Quincena Miguel, Bonificación..."
            value={quickName}
            onChange={(e) => setQuickName(e.target.value)}
            className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border ${
              isDark ? 'bg-[#0e1626] border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          />
        </div>

        <div className="w-[110px] shrink-0">
          <input
            type="text"
            placeholder="Persona (Miguel/Liz)"
            value={quickEarner}
            onChange={(e) => setQuickEarner(e.target.value)}
            className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border ${
              isDark ? 'bg-[#0e1626] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          />
        </div>

        <div className="w-[130px] shrink-0">
          <input
            type="number"
            placeholder="Valor ($)"
            value={quickAmount}
            onChange={(e) => setQuickAmount(e.target.value)}
            className={`w-full px-3 py-2 rounded-xl text-xs font-bold font-mono border ${
              isDark ? 'bg-[#0e1626] border-slate-700 text-emerald-400' : 'bg-slate-50 border-slate-200 text-emerald-700'
            }`}
          />
        </div>

        <div className="w-[85px] shrink-0">
          <input
            type="number"
            min="1"
            max="31"
            placeholder="Día (1-31)"
            value={quickDay}
            onChange={(e) => setQuickDay(Number(e.target.value))}
            className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border ${
              isDark ? 'bg-[#0e1626] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
            title="Día del mes esperado para cobrar"
          />
        </div>

        <button
          type="submit"
          disabled={!quickName.trim()}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 transition-all cursor-pointer shrink-0 shadow-md"
        >
          + Agregar
        </button>
      </form>

      {/* 4. Filters & Search Bar */}
      <div className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
        isDark ? 'bg-[#101729] border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nombre, persona, canal o notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full px-3 py-1.5 rounded-xl text-xs border ${
              isDark ? 'bg-[#0b111e] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}
          />
        </div>

        <div className="flex items-center space-x-2">
          {/* Earner filter */}
          {uniqueEarners.length > 1 && (
            <select
              value={earnerFilter}
              onChange={(e) => setEarnerFilter(e.target.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                isDark ? 'bg-[#0b111e] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <option value="todos">Todos los Integrantes</option>
              {uniqueEarners.map(earner => (
                <option key={earner} value={earner}>👤 {earner}</option>
              ))}
            </select>
          )}

          {/* Status filter */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-200 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setStatusFilter('todos')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'todos'
                  ? 'bg-white dark:bg-[#1a253d] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('recibido')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'recibido'
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Recibidos
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pendiente')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'pendiente'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Pendientes
            </button>
          </div>
        </div>
      </div>

      {/* 5. Incomes Checklist Table (Sorted Ascending by Day of Month) */}
      {filteredIncomes.length === 0 ? (
        <div className={`p-10 rounded-3xl border text-center space-y-4 ${
          isDark ? 'bg-[#101729] border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {incomes.length === 0 
                ? 'No tienes ingresos registrados en este momento'
                : 'No se encontraron ingresos con los filtros seleccionados'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              {incomes.length === 0 
                ? 'Puedes registrar tus sueldos quincenales, ingresos independientes o bonificaciones, o restaurar la plantilla base.'
                : 'Intenta limpiar el buscador o seleccionar "Todos" en los filtros superiores para ver los ingresos.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 shadow-md hover:bg-emerald-400 cursor-pointer inline-flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Ingreso</span>
            </button>
            {incomes.length === 0 && onBatchSetIncomes && (
              <button
                type="button"
                onClick={() => {
                  onBatchSetIncomes(INITIAL_MONTHLY_INCOMES);
                  setSuccessMessage('Plantilla recomendada de ingresos cargada correctamente.');
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-md hover:bg-blue-500 cursor-pointer inline-flex items-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Plantilla Quincenal Recomendada</span>
              </button>
            )}
            {incomes.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setEarnerFilter('todos');
                  setStatusFilter('todos');
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className={`rounded-3xl border shadow-xl overflow-hidden ${
          isDark ? 'bg-[#0f172a] border-[#1e2f4f]' : 'bg-white border-slate-200'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b font-mono uppercase tracking-wider text-[11px] ${
                  isDark ? 'bg-[#15223c] text-slate-300 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  <th className="py-3.5 px-3 text-center w-14">Check</th>
                  <th className="py-3.5 px-3 w-24">Día Cobro</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Concepto / Ingreso</th>
                  <th className="py-3.5 px-3 min-w-[120px]">Persona</th>
                  <th className="py-3.5 px-3 min-w-[140px]">Tipo / Fuente</th>
                  <th className="py-3.5 px-3 text-right min-w-[120px]">Monto Estimado</th>
                  <th className="py-3.5 px-3 text-right min-w-[120px]">Monto Recibido</th>
                  <th className="py-3.5 px-3 text-center w-28">Estado</th>
                  <th className="py-3.5 px-3 min-w-[130px] hidden md:table-cell">Canal / Cuenta</th>
                  <th className="py-3.5 px-3 text-center w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {filteredIncomes.map((item) => {
                  const sourceMeta = SOURCE_LABELS[item.source] || SOURCE_LABELS.otro;
                  const isRec = item.isReceived;
                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors group ${
                        isRec
                          ? isDark 
                            ? 'bg-emerald-950/20 hover:bg-emerald-950/30' 
                            : 'bg-emerald-50/50 hover:bg-emerald-50'
                          : isDark 
                            ? 'hover:bg-[#152037]' 
                            : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* 1. Checklist Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleReceived(item)}
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer mx-auto ${
                            isRec
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-sm ring-2 ring-emerald-500/30'
                              : isDark
                                ? 'border-slate-600 bg-[#162238] hover:border-emerald-400 text-transparent hover:text-emerald-400'
                                : 'border-slate-300 bg-white hover:border-emerald-500 text-transparent hover:text-emerald-500'
                          }`}
                          title={isRec ? 'Marcar como pendiente' : 'Marcar como recibido'}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>
                      </td>

                      {/* 2. Day of Month Badge */}
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black border inline-flex items-center space-x-1 ${
                          isRec
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                            : isDark
                              ? 'bg-[#1a2744] border-[#2b3e6b] text-cyan-300'
                              : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}>
                          <Calendar className="w-3 h-3 text-cyan-400" />
                          <span>Día {item.dayOfMonth || 15}</span>
                        </span>
                      </td>

                      {/* 3. Name & Notes */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className={`font-bold text-sm ${
                            isRec 
                              ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
                              : isDark ? 'text-white' : 'text-slate-900'
                          }`}>
                            {item.name}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5" title={item.notes}>
                            📝 {item.notes}
                          </p>
                        )}
                      </td>

                      {/* 4. Earner (Persona) */}
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 inline-flex items-center space-x-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{item.earner || 'Hogar'}</span>
                        </span>
                      </td>

                      {/* 5. Source / Type */}
                      <td className="py-3 px-3">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase font-mono whitespace-nowrap inline-flex items-center space-x-1"
                          style={{
                            backgroundColor: `${sourceMeta.color}20`,
                            color: sourceMeta.color,
                            border: `1px solid ${sourceMeta.color}40`,
                          }}
                        >
                          <span>{sourceMeta.icon}</span>
                          <span>{sourceMeta.label.split('(')[0].trim()}</span>
                        </span>
                      </td>

                      {/* 6. Estimated Amount */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                        {formatCOP(item.estimatedAmount)}
                      </td>

                      {/* 7. Actual Received Amount */}
                      <td className="py-3 px-3 text-right font-mono font-black">
                        {isRec ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {formatCOP(item.actualAmount || item.estimatedAmount)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic font-normal">--</span>
                        )}
                      </td>

                      {/* 8. Status */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleReceived(item)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-black cursor-pointer transition-all border inline-flex items-center space-x-1 ${
                            isRec
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                          }`}
                        >
                          {isRec ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>Recibido</span>
                            </>
                          ) : (
                            <>
                              <Circle className="w-3 h-3 text-amber-500" />
                              <span>Pendiente</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* 9. Channel */}
                      <td className="py-3 px-3 hidden md:table-cell text-slate-400 text-[11px]">
                        <span className="block truncate max-w-[130px]">{item.paymentChannel || 'Nómina'}</span>
                      </td>

                      {/* 10. Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isDark 
                                ? 'bg-[#172238] border-slate-700 text-slate-300 hover:text-white hover:border-emerald-400' 
                                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                            }`}
                            title="Editar ingreso"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteIncome(item.id)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer text-rose-400 ${
                              isDark 
                                ? 'bg-[#172238] border-slate-700 hover:bg-rose-500/20 hover:border-rose-500' 
                                : 'bg-slate-100 border-slate-200 hover:bg-rose-50 hover:border-rose-300'
                            }`}
                            title="Eliminar ingreso"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Table Totals Footer */}
              <tfoot>
                <tr className={`border-t font-bold font-mono text-xs ${
                  isDark ? 'bg-[#131d33] text-white border-slate-700' : 'bg-slate-100 text-slate-900 border-slate-300'
                }`}>
                  <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider text-[11px]">
                    Total Ingresos ({filteredIncomes.length} fuentes):
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatCOP(filteredIncomes.reduce((s, i) => s + (Number(i.estimatedAmount) || 0), 0))}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatCOP(filteredIncomes.filter(i => i.isReceived).reduce((s, i) => s + (Number(i.actualAmount || i.estimatedAmount) || 0), 0))}
                  </td>
                  <td colSpan={3} className="py-3 px-4 text-left font-sans text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-[11px]">
                      {filteredIncomes.filter(i => i.isReceived).length} de {filteredIncomes.length} cobrados ({filteredIncomes.length > 0 ? Math.round((filteredIncomes.filter(i => i.isReceived).length / filteredIncomes.length) * 100) : 0}%)
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 6. MODAL FOR ADDING / EDITING INCOME */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden ${
            isDark ? 'bg-[#131b2e] border-[#2d3a58]' : 'bg-white border-slate-200'
          }`}>
            <form onSubmit={handleSaveModal}>
              <div className={`p-5 border-b flex items-center justify-between ${
                isDark ? 'border-slate-800 bg-[#0f172a]' : 'border-slate-200 bg-slate-50'
              }`}>
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {editingIncome ? 'Editar Ingreso Mensual' : 'Nuevo Ingreso Mensual'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Configura el valor, la persona que lo percibe y el día estimado de cobro.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-500/20 text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Nombre del Ingreso *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 1ra Quincena Miguel, Bonificación, Quincena Liz..."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-2xl text-sm font-semibold border ${
                      isDark ? 'bg-[#0c1220] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                {/* Earner & Source */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Persona / Destinatario *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Miguel, Liz, Hogar..."
                      value={formEarner}
                      onChange={(e) => setFormEarner(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs font-semibold border ${
                        isDark ? 'bg-[#0c1220] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Tipo de Fuente
                    </label>
                    <select
                      value={formSource}
                      onChange={(e) => setFormSource(e.target.value as MonthlyIncomeSource)}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs font-semibold border ${
                        isDark ? 'bg-[#0c1220] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      <option value="quincena_1">💼 1ra Quincena (Días 1-15)</option>
                      <option value="quincena_2">💼 2da Quincena (Días 16-31)</option>
                      <option value="bonificacion">🎁 Bonificación / Comisión</option>
                      <option value="independiente">💻 Freelance / Ventas</option>
                      <option value="arriendo_renta">🏠 Renta / Alquiler</option>
                      <option value="inversion">📈 Inversión / Rendimientos</option>
                      <option value="otro">💵 Otro Ingreso</option>
                    </select>
                  </div>
                </div>

                {/* Estimated Amount & Actual Amount */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Monto Estimado ($) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="Ej. 2000000"
                      value={formEstimatedAmount}
                      onChange={(e) => setFormEstimatedAmount(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl text-sm font-bold font-mono border ${
                        isDark ? 'bg-[#0c1220] border-slate-700 text-emerald-400' : 'bg-slate-50 border-slate-200 text-emerald-700'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Día del Mes de Cobro (1 - 31)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formDayOfMonth}
                      onChange={(e) => setFormDayOfMonth(Number(e.target.value))}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs font-bold font-mono border ${
                        isDark ? 'bg-[#0c1220] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                {/* Status Toggle & Channel */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Canal de Pago / Cuenta
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Nómina Bancolombia, Nequi..."
                      value={formPaymentChannel}
                      onChange={(e) => setFormPaymentChannel(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs font-semibold border ${
                        isDark ? 'bg-[#0c1220] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Estado de Recepción
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormIsReceived(!formIsReceived)}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                        formIsReceived
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : isDark ? 'bg-[#0c1220] border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      {formIsReceived ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Ya Recibido / Consignado</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4 text-slate-400" />
                          <span>Pendiente por Recibir</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Actual Amount if received */}
                {formIsReceived && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-emerald-500 mb-1">
                      Monto Real Recibido (Opcional si varió del estimado)
                    </label>
                    <input
                      type="number"
                      placeholder="Dejar vacío si es igual al estimado"
                      value={formActualAmount}
                      onChange={(e) => setFormActualAmount(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl text-sm font-bold font-mono border ${
                        isDark ? 'bg-[#0c1220] border-emerald-600/50 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      }`}
                    />
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Notas Adicionales (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Detalles sobre retenciones, horas extras o acuerdos..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-2xl text-xs border ${
                      isDark ? 'bg-[#0c1220] border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className={`p-4 border-t flex items-center justify-end space-x-2 ${
                isDark ? 'border-slate-800 bg-[#0f172a]' : 'border-slate-200 bg-slate-50'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-600 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer shadow-md"
                >
                  {editingIncome ? 'Guardar Cambios' : 'Añadir Ingreso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
