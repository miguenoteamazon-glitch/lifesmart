import React, { useState, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { MonthlyExtraExpenseItem, MonthlyExtraExpenseCategory } from '../../types';
import { GmailExpenseSyncModal } from './GmailExpenseSyncModal';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Circle,
  Calendar,
  DollarSign,
  Sparkles,
  Search,
  Filter,
  Utensils,
  Shirt,
  Pill,
  Wrench,
  Gift,
  Car,
  Laptop,
  Cat,
  HelpCircle,
  Check,
  CreditCard,
  Mail
} from 'lucide-react';

interface MonthlyExtraExpensesSectionProps {
  extraExpenses: MonthlyExtraExpenseItem[];
  onAddExtraExpense: (extra: Omit<MonthlyExtraExpenseItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateExtraExpense: (extra: MonthlyExtraExpenseItem) => void;
  onDeleteExtraExpense: (extraId: string) => void;
  onBatchSetExtraExpenses?: (extras: MonthlyExtraExpenseItem[]) => void;
}

const EXTRA_PRESETS: { name: string; category: MonthlyExtraExpenseCategory; defaultAmount: number; defaultDay: number; icon: string; paidBy: string }[] = [
  { name: '🍽️ Salida a Cenar / Restaurante', category: 'salidas_ocio', defaultAmount: 180000, defaultDay: 16, icon: 'Utensils', paidBy: 'Miguel' },
  { name: '🛍️ Ropa / Calzado', category: 'compras_ropa', defaultAmount: 250000, defaultDay: 20, icon: 'Shirt', paidBy: 'Liz' },
  { name: '💊 Medicamentos / Farmacia', category: 'salud_farmacia', defaultAmount: 120000, defaultDay: 12, icon: 'Pill', paidBy: 'Hogar' },
  { name: '🎂 Regalo de Cumpleaños', category: 'regalos_celebracion', defaultAmount: 150000, defaultDay: 25, icon: 'Gift', paidBy: 'Miguel' },
  { name: '🔧 Reparación / Imprevisto Hogar', category: 'imprevisto_hogar', defaultAmount: 140000, defaultDay: 18, icon: 'Wrench', paidBy: 'Hogar' },
  { name: '🚕 Transporte / Gasolina Extra', category: 'transporte_extra', defaultAmount: 90000, defaultDay: 8, icon: 'Car', paidBy: 'Miguel' },
  { name: '☕ Salida de Fin de Semana / Café', category: 'salidas_ocio', defaultAmount: 80000, defaultDay: 22, icon: 'Utensils', paidBy: 'Liz' },
  { name: '🐾 Veterinaria / Mascota Extra', category: 'mascotas_extra', defaultAmount: 110000, defaultDay: 14, icon: 'Cat', paidBy: 'Hogar' },
];

const CATEGORY_META: Record<MonthlyExtraExpenseCategory, { label: string; icon: any; color: string; bg: string }> = {
  salidas_ocio: { label: 'Salidas & Restaurantes', icon: Utensils, color: '#f59e0b', bg: 'bg-amber-500/10 border-amber-500/30' },
  compras_ropa: { label: 'Ropa & Compras', icon: Shirt, color: '#ec4899', bg: 'bg-pink-500/10 border-pink-500/30' },
  salud_farmacia: { label: 'Salud & Farmacia', icon: Pill, color: '#10b981', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  imprevisto_hogar: { label: 'Imprevisto Hogar', icon: Wrench, color: '#06b6d4', bg: 'bg-cyan-500/10 border-cyan-500/30' },
  regalos_celebracion: { label: 'Regalos & Fiestas', icon: Gift, color: '#8b5cf6', bg: 'bg-purple-500/10 border-purple-500/30' },
  transporte_extra: { label: 'Transporte Extra', icon: Car, color: '#3b82f6', bg: 'bg-blue-500/10 border-blue-500/30' },
  tecnologia_hogar: { label: 'Tecnología & Gadgets', icon: Laptop, color: '#6366f1', bg: 'bg-indigo-500/10 border-indigo-500/30' },
  mascotas_extra: { label: 'Mascotas', icon: Cat, color: '#14b8a6', bg: 'bg-teal-500/10 border-teal-500/30' },
  otro: { label: 'Otros Gastos', icon: HelpCircle, color: '#64748b', bg: 'bg-slate-500/10 border-slate-500/30' },
};

export const MonthlyExtraExpensesSection: React.FC<MonthlyExtraExpensesSectionProps> = ({
  extraExpenses,
  onAddExtraExpense,
  onUpdateExtraExpense,
  onDeleteExtraExpense,
  onBatchSetExtraExpenses
}) => {
  const { isDark } = useTheme();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pagado' | 'pendiente'>('todos');
  const [quincenaFilter, setQuincenaFilter] = useState<'todas' | 'quincena_1' | 'quincena_2'>('todas');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGmailSyncOpen, setIsGmailSyncOpen] = useState(false);
  const [editingExtra, setEditingExtra] = useState<MonthlyExtraExpenseItem | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<MonthlyExtraExpenseCategory>('salidas_ocio');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formDayOfMonth, setFormDayOfMonth] = useState<number>(15);
  const [formQuincena, setFormQuincena] = useState<'quincena_1' | 'quincena_2'>('quincena_1');
  const [formIsPaid, setFormIsPaid] = useState(false);
  const [formPaidBy, setFormPaidBy] = useState('Miguel');
  const [formPaymentMethod, setFormPaymentMethod] = useState('Tarjeta de Crédito');
  const [formNotes, setFormNotes] = useState('');

  // Quick inline add state
  const [quickName, setQuickName] = useState('');
  const [quickCategory, setQuickCategory] = useState<MonthlyExtraExpenseCategory>('salidas_ocio');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickDay, setQuickDay] = useState(16);
  const [quickQuincena, setQuickQuincena] = useState<'quincena_1' | 'quincena_2'>('quincena_2');

  // Helper to determine whether an extra belongs to Q1 (1-15) or Q2 (16-31)
  const getItemQuincena = (item: MonthlyExtraExpenseItem): 'quincena_1' | 'quincena_2' => {
    if (item.assignedQuincena === 'quincena_1') return 'quincena_1';
    if (item.assignedQuincena === 'quincena_2') return 'quincena_2';
    return (Number(item.dayOfMonth) || 15) <= 15 ? 'quincena_1' : 'quincena_2';
  };

  // Instant toggle between Q1 and Q2 from list or cards
  const handleSetItemQuincena = (item: MonthlyExtraExpenseItem, targetQ: 'quincena_1' | 'quincena_2') => {
    onUpdateExtraExpense({
      ...item,
      assignedQuincena: targetQ,
      updatedAt: new Date().toISOString(),
    });
  };

  // Sort ascending by Day of Month (1-31)
  const sortedExtras = useMemo(() => {
    return [...extraExpenses].sort((a, b) => {
      if ((a.dayOfMonth || 15) !== (b.dayOfMonth || 15)) {
        return (a.dayOfMonth || 15) - (b.dayOfMonth || 15);
      }
      return a.name.localeCompare(b.name);
    });
  }, [extraExpenses]);

  // Filtered extras
  const filteredExtras = useMemo(() => {
    return sortedExtras.filter(item => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchPaidBy = (item.paidBy || '').toLowerCase().includes(q);
        const matchNotes = (item.receiptNotes || '').toLowerCase().includes(q);
        if (!matchName && !matchPaidBy && !matchNotes) return false;
      }
      if (categoryFilter !== 'todas' && item.category !== categoryFilter) {
        return false;
      }
      if (statusFilter === 'pagado' && !item.isPaid) return false;
      if (statusFilter === 'pendiente' && item.isPaid) return false;
      if (quincenaFilter !== 'todas' && getItemQuincena(item) !== quincenaFilter) {
        return false;
      }

      return true;
    });
  }, [sortedExtras, searchQuery, categoryFilter, statusFilter, quincenaFilter]);

  // Subtotals & Totals by Quincena (Global from all extraExpenses)
  const q1AllItems = useMemo(() => extraExpenses.filter(e => getItemQuincena(e) === 'quincena_1'), [extraExpenses]);
  const q1TotalEstimated = useMemo(() => q1AllItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0), [q1AllItems]);
  const q1TotalPaid = useMemo(() => q1AllItems.reduce((sum, item) => item.isPaid ? sum + (Number(item.amount) || 0) : sum, 0), [q1AllItems]);
  const q1TotalPending = Math.max(0, q1TotalEstimated - q1TotalPaid);
  const q1Count = q1AllItems.length;

  const q2AllItems = useMemo(() => extraExpenses.filter(e => getItemQuincena(e) === 'quincena_2'), [extraExpenses]);
  const q2TotalEstimated = useMemo(() => q2AllItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0), [q2AllItems]);
  const q2TotalPaid = useMemo(() => q2AllItems.reduce((sum, item) => item.isPaid ? sum + (Number(item.amount) || 0) : sum, 0), [q2AllItems]);
  const q2TotalPending = Math.max(0, q2TotalEstimated - q2TotalPaid);
  const q2Count = q2AllItems.length;

  // Filtered subtotals for the current table view
  const q1FilteredItems = useMemo(() => filteredExtras.filter(e => getItemQuincena(e) === 'quincena_1'), [filteredExtras]);
  const q1FilteredEstimated = useMemo(() => q1FilteredItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0), [q1FilteredItems]);
  const q1FilteredPaid = useMemo(() => q1FilteredItems.reduce((sum, item) => item.isPaid ? sum + (Number(item.amount) || 0) : sum, 0), [q1FilteredItems]);

  const q2FilteredItems = useMemo(() => filteredExtras.filter(e => getItemQuincena(e) === 'quincena_2'), [filteredExtras]);
  const q2FilteredEstimated = useMemo(() => q2FilteredItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0), [q2FilteredItems]);
  const q2FilteredPaid = useMemo(() => q2FilteredItems.reduce((sum, item) => item.isPaid ? sum + (Number(item.amount) || 0) : sum, 0), [q2FilteredItems]);

  // Combined Totals
  const totalEstimated = q1TotalEstimated + q2TotalEstimated;
  const totalPaid = q1TotalPaid + q2TotalPaid;
  const totalPending = Math.max(0, totalEstimated - totalPaid);

  const totalFilteredEstimated = filteredExtras.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalFilteredPaid = filteredExtras.filter(e => e.isPaid).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleOpenAddModal = (preset?: typeof EXTRA_PRESETS[0]) => {
    if (preset) {
      setEditingExtra(null);
      setFormName(preset.name);
      setFormCategory(preset.category);
      setFormAmount(preset.defaultAmount.toString());
      setFormDayOfMonth(preset.defaultDay);
      setFormQuincena(preset.defaultDay <= 15 ? 'quincena_1' : 'quincena_2');
      setFormIsPaid(false);
      setFormPaidBy(preset.paidBy);
      setFormPaymentMethod('Tarjeta de Crédito');
      setFormNotes('');
    } else {
      setEditingExtra(null);
      setFormName('');
      setFormCategory('salidas_ocio');
      setFormAmount('');
      setFormDayOfMonth(15);
      setFormQuincena('quincena_1');
      setFormIsPaid(false);
      setFormPaidBy('Miguel');
      setFormPaymentMethod('Tarjeta de Crédito');
      setFormNotes('');
    }
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: MonthlyExtraExpenseItem) => {
    setEditingExtra(item);
    setFormName(item.name);
    setFormCategory(item.category || 'salidas_ocio');
    setFormAmount(item.amount ? item.amount.toString() : '');
    setFormDayOfMonth(item.dayOfMonth || 15);
    setFormQuincena(getItemQuincena(item));
    setFormIsPaid(Boolean(item.isPaid));
    setFormPaidBy(item.paidBy || 'Miguel');
    setFormPaymentMethod(item.paymentMethod || 'Tarjeta de Crédito');
    setFormNotes(item.receiptNotes || '');
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const amount = parseFloat(formAmount) || 0;
    const day = Math.max(1, Math.min(31, Number(formDayOfMonth) || 15));
    const quincena = formQuincena || (day <= 15 ? 'quincena_1' : 'quincena_2');

    if (editingExtra) {
      onUpdateExtraExpense({
        ...editingExtra,
        name: formName.trim(),
        category: formCategory,
        amount: amount,
        dayOfMonth: day,
        assignedQuincena: quincena,
        isPaid: formIsPaid,
        paidBy: formPaidBy.trim(),
        paymentMethod: formPaymentMethod,
        receiptNotes: formNotes.trim() || undefined,
        updatedAt: new Date().toISOString(),
      });
    } else {
      onAddExtraExpense({
        name: formName.trim(),
        category: formCategory,
        amount: amount,
        dayOfMonth: day,
        assignedQuincena: quincena,
        isPaid: formIsPaid,
        paidBy: formPaidBy.trim(),
        paymentMethod: formPaymentMethod,
        receiptNotes: formNotes.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) return;
    const amount = parseFloat(quickAmount) || 0;
    const day = Math.max(1, Math.min(31, Number(quickDay) || 15));

    onAddExtraExpense({
      name: quickName.trim(),
      category: quickCategory,
      amount: amount,
      dayOfMonth: day,
      assignedQuincena: quickQuincena,
      isPaid: false,
      paidBy: 'Hogar',
      paymentMethod: 'Tarjeta de Crédito / Efectivo',
    });

    setQuickName('');
    setQuickAmount('');
  };

  const handleTogglePaid = (item: MonthlyExtraExpenseItem) => {
    onUpdateExtraExpense({
      ...item,
      isPaid: !item.isPaid,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddPresetDirect = (preset: typeof EXTRA_PRESETS[0]) => {
    const already = extraExpenses.some(e => e.name.toLowerCase() === preset.name.toLowerCase());
    if (already) {
      handleOpenAddModal(preset);
      return;
    }
    onAddExtraExpense({
      name: preset.name,
      category: preset.category,
      amount: preset.defaultAmount,
      dayOfMonth: preset.defaultDay,
      assignedQuincena: preset.defaultDay <= 15 ? 'quincena_1' : 'quincena_2',
      isPaid: false,
      paidBy: preset.paidBy,
      paymentMethod: 'Tarjeta de Crédito',
    });
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Summary Bar */}
      <div className={`p-5 rounded-3xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDark ? 'bg-[#1e1322] border-[#381e3d]' : 'bg-gradient-to-r from-pink-50 via-rose-50 to-white border-pink-200'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-500">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className={`text-lg sm:text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                🛒 Gastos Adicionales & Eventuales
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-500/20 text-pink-600 dark:text-pink-300 font-mono">
                {extraExpenses.length} gastos
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Salidas a restaurantes, compras personales, ropa, farmacia o imprevistos que no son gastos fijos pero suman a los egresos del mes.
            </p>
          </div>
        </div>

        {/* Totals & Add Button */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="text-right hidden sm:block mr-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase block">Total Gastos Extras:</span>
            <span className="text-xl font-black text-pink-600 dark:text-pink-400 font-mono">
              -{formatCOP(totalEstimated)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsGmailSyncOpen(true)}
            className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs flex items-center space-x-2 cursor-pointer transition-all border shadow-sm ${
              isDark 
                ? 'bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20' 
                : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
            }`}
            title="Escanear comprobantes de compras en tu Gmail"
          >
            <Mail className="w-4 h-4 text-red-500" />
            <span>Sincronizar Gmail</span>
          </button>

          {extraExpenses.length > 0 && onBatchSetExtraExpenses && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('¿Deseas vaciar y eliminar todos los gastos adicionales del mes para comenzar de cero? Esta acción no se puede deshacer.')) {
                  onBatchSetExtraExpenses([]);
                }
              }}
              className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition-all border shadow-sm ${
                isDark 
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30' 
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
              }`}
              title="Vaciar y borrar todos los gastos adicionales del mes"
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>Vaciar Gastos Extras</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center space-x-2 cursor-pointer bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25 hover:brightness-105 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>+ Nuevo Gasto</span>
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
            <span>Plantillas Rápidas de Gastos Adicionales (Clic para añadir en 1 segundo):</span>
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {EXTRA_PRESETS.map((preset, idx) => {
            const isAdded = extraExpenses.some(e => e.name.toLowerCase() === preset.name.toLowerCase());
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddPresetDirect(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs border ${
                  isAdded
                    ? isDark 
                      ? 'bg-pink-950/40 text-pink-300 border-pink-600/40 opacity-80' 
                      : 'bg-pink-50 text-pink-700 border-pink-300'
                    : isDark
                      ? 'bg-[#151f38] hover:bg-[#1e2d4e] text-slate-300 border-[#2d3f66] hover:border-pink-400'
                      : 'bg-white hover:bg-pink-50 text-slate-700 border-slate-200 hover:border-pink-400'
                }`}
                title={`Añadir ${preset.name} (${formatCOP(preset.defaultAmount)})`}
              >
                <span>{preset.name}</span>
                <span className="font-mono text-[11px] opacity-75 font-semibold">({formatCOP(preset.defaultAmount)})</span>
                {isAdded ? (
                  <Check className="w-3 h-3 text-pink-400 ml-1" />
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
        isDark ? 'bg-[#1a1223] border-[#2f1b3d]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex-1 min-w-[160px]">
          <input
            type="text"
            placeholder="Ej. Salida restaurante, Medicamentos, Ropa..."
            value={quickName}
            onChange={(e) => setQuickName(e.target.value)}
            className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border ${
              isDark ? 'bg-[#0f0b17] border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          />
        </div>

        <div className="w-[140px] shrink-0">
          <select
            value={quickCategory}
            onChange={(e) => setQuickCategory(e.target.value as MonthlyExtraExpenseCategory)}
            className={`w-full px-2.5 py-2 rounded-xl text-xs font-semibold border ${
              isDark ? 'bg-[#0f0b17] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <option value="salidas_ocio">🍽️ Salidas & Ocio</option>
            <option value="compras_ropa">🛍️ Ropa & Calzado</option>
            <option value="salud_farmacia">💊 Farmacia / Salud</option>
            <option value="imprevisto_hogar">🔧 Imprevisto Hogar</option>
            <option value="regalos_celebracion">🎂 Regalos / Fiestas</option>
            <option value="transporte_extra">🚕 Transporte Extra</option>
            <option value="mascotas_extra">🐾 Mascotas</option>
            <option value="otro">✨ Otro Gasto</option>
          </select>
        </div>

        <div className="w-[130px] shrink-0">
          <input
            type="number"
            placeholder="Valor ($)"
            value={quickAmount}
            onChange={(e) => setQuickAmount(e.target.value)}
            className={`w-full px-3 py-2 rounded-xl text-xs font-bold font-mono border ${
              isDark ? 'bg-[#0f0b17] border-slate-700 text-pink-400' : 'bg-slate-50 border-slate-200 text-pink-700'
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
            onChange={(e) => {
              const d = Number(e.target.value);
              setQuickDay(d);
              if (d >= 1 && d <= 15) setQuickQuincena('quincena_1');
              else if (d > 15 && d <= 31) setQuickQuincena('quincena_2');
            }}
            className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border ${
              isDark ? 'bg-[#0f0b17] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
            title="Día del mes estimado para el gasto"
          />
        </div>

        {/* Q1 / Q2 Quincena Selector in Quick Add Bar */}
        <div className="flex items-center p-0.5 rounded-xl border bg-slate-100 dark:bg-[#0f0b17] border-slate-300 dark:border-slate-700 shrink-0 shadow-inner">
          <button
            type="button"
            onClick={() => setQuickQuincena('quincena_1')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-black transition-all cursor-pointer ${
              quickQuincena === 'quincena_1'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
            title="Asignar a 1ª Quincena (Q1 - Días 1 al 15)"
          >
            Q1
          </button>
          <button
            type="button"
            onClick={() => setQuickQuincena('quincena_2')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-black transition-all cursor-pointer ${
              quickQuincena === 'quincena_2'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
            title="Asignar a 2ª Quincena (Q2 - Días 16 al 31)"
          >
            Q2
          </button>
        </div>

        <button
          type="submit"
          disabled={!quickName.trim()}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-pink-500 hover:bg-pink-400 disabled:opacity-50 text-white transition-all cursor-pointer shrink-0 shadow-md"
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
            placeholder="Buscar por nombre, pagado por o notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full px-3 py-1.5 rounded-xl text-xs border ${
              isDark ? 'bg-[#0b111e] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quincena filter (Todas / Q1 / Q2) */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setQuincenaFilter('todas')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                quincenaFilter === 'todas'
                  ? 'bg-white dark:bg-[#1a253d] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setQuincenaFilter('quincena_1')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                quincenaFilter === 'quincena_1'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-300'
              }`}
              title="Filtrar solo 1ª Quincena (Q1 - Días 1 al 15)"
            >
              <span>🟣 Q1</span>
            </button>
            <button
              type="button"
              onClick={() => setQuincenaFilter('quincena_2')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                quincenaFilter === 'quincena_2'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-amber-600 dark:hover:text-amber-300'
              }`}
              title="Filtrar solo 2ª Quincena (Q2 - Días 16 al 31)"
            >
              <span>🟠 Q2</span>
            </button>
          </div>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              isDark ? 'bg-[#0b111e] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            <option value="todas">Todas las Categorías</option>
            <option value="salidas_ocio">🍽️ Salidas & Restaurantes</option>
            <option value="compras_ropa">🛍️ Ropa & Calzado</option>
            <option value="salud_farmacia">💊 Salud & Farmacia</option>
            <option value="imprevisto_hogar">🔧 Imprevistos Hogar</option>
            <option value="regalos_celebracion">🎂 Regalos & Fiestas</option>
            <option value="transporte_extra">🚕 Transporte Extra</option>
            <option value="mascotas_extra">🐾 Mascotas</option>
            <option value="otro">✨ Otros Gastos</option>
          </select>

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
              onClick={() => setStatusFilter('pagado')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'pagado'
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Pagados
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pendiente')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'pendiente'
                  ? 'bg-pink-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Pendientes
            </button>
          </div>
        </div>
      </div>

      {/* 5. Extra Expenses Checklist Table (Sorted Ascending by Day of Month) */}
      {filteredExtras.length === 0 ? (
        <div className={`p-10 rounded-3xl border text-center space-y-3 ${
          isDark ? 'bg-[#101729] border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <ShoppingBag className="w-10 h-10 mx-auto text-slate-400 opacity-50" />
          <p className="text-sm font-semibold">No se encontraron gastos adicionales con los filtros seleccionados.</p>
          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-pink-500 text-white shadow-md hover:bg-pink-400 cursor-pointer"
          >
            + Añadir Primer Gasto Adicional
          </button>
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
                  <th className="py-3.5 px-2.5 text-center min-w-[110px]">Quincena</th>
                  <th className="py-3.5 px-3 w-24">Día</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Gasto Adicional / Detalle</th>
                  <th className="py-3.5 px-3 min-w-[140px]">Categoría</th>
                  <th className="py-3.5 px-3 min-w-[120px]">Pagado Por</th>
                  <th className="py-3.5 px-3 text-right min-w-[120px]">Monto Estimado</th>
                  <th className="py-3.5 px-3 text-right min-w-[120px]">Monto Pagado</th>
                  <th className="py-3.5 px-3 text-center w-28">Estado</th>
                  <th className="py-3.5 px-3 min-w-[130px] hidden md:table-cell">Método</th>
                  <th className={`py-3.5 px-3 text-center w-24 sticky right-0 z-10 ${
                    isDark ? 'bg-[#15223c]' : 'bg-slate-100'
                  }`}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {filteredExtras.map((item) => {
                  const catMeta = CATEGORY_META[item.category] || CATEGORY_META.otro;
                  const isPaid = item.isPaid;
                  const Icon = catMeta.icon;
                  const itemQ = getItemQuincena(item);

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors group ${
                        isPaid
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
                          onClick={() => handleTogglePaid(item)}
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer mx-auto ${
                            isPaid
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-sm ring-2 ring-emerald-500/30'
                              : isDark
                                ? 'border-slate-600 bg-[#162238] hover:border-pink-400 text-transparent hover:text-pink-400'
                                : 'border-slate-300 bg-white hover:border-pink-500 text-transparent hover:text-pink-500'
                          }`}
                          title={isPaid ? 'Marcar como pendiente' : 'Marcar como pagado'}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>
                      </td>

                      {/* 2. Quincena Q1 / Q2 Interactive Button */}
                      <td className="py-3 px-2 text-center">
                        <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-200/90 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 shadow-xs">
                          <button
                            type="button"
                            onClick={() => handleSetItemQuincena(item, 'quincena_1')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black transition-all cursor-pointer flex items-center space-x-1 ${
                              itemQ === 'quincena_1'
                                ? 'bg-indigo-600 text-white shadow-md ring-1 ring-indigo-400 scale-[1.03]'
                                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-300/60 dark:hover:bg-slate-800'
                            }`}
                            title="Asignar a Quincena 1 (Q1 - Días 1 al 15)"
                          >
                            <span>Q1</span>
                            {itemQ === 'quincena_1' && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetItemQuincena(item, 'quincena_2')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black transition-all cursor-pointer flex items-center space-x-1 ${
                              itemQ === 'quincena_2'
                                ? 'bg-amber-600 text-white shadow-md ring-1 ring-amber-400 scale-[1.03]'
                                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-300/60 dark:hover:bg-slate-800'
                            }`}
                            title="Asignar a Quincena 2 (Q2 - Días 16 al 31)"
                          >
                            <span>Q2</span>
                            {itemQ === 'quincena_2' && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>
                        </div>
                      </td>

                      {/* 3. Day of Month Badge */}
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black border inline-flex items-center space-x-1 ${
                          isPaid
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                            : isDark
                              ? 'bg-[#221633] border-[#3f2561] text-pink-300'
                              : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}>
                          <Calendar className="w-3 h-3 text-pink-400" />
                          <span>Día {item.dayOfMonth || 15}</span>
                        </span>
                      </td>

                      {/* 4. Name & Notes */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className={`font-bold text-sm ${
                            isPaid 
                              ? 'line-through text-slate-400 dark:text-slate-500 font-normal' 
                              : isDark ? 'text-white' : 'text-slate-900'
                          }`}>
                            {item.name}
                          </span>
                        </div>
                        {item.receiptNotes && (
                          <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5" title={item.receiptNotes}>
                            📝 {item.receiptNotes}
                          </p>
                        )}
                      </td>

                      {/* 5. Category */}
                      <td className="py-3 px-3">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase font-mono whitespace-nowrap inline-flex items-center space-x-1"
                          style={{
                            backgroundColor: `${catMeta.color}20`,
                            color: catMeta.color,
                            border: `1px solid ${catMeta.color}40`,
                          }}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{catMeta.label}</span>
                        </span>
                      </td>

                      {/* 6. Paid By (Persona) */}
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 inline-block">
                          👤 {item.paidBy || 'Hogar'}
                        </span>
                      </td>

                      {/* 7. Estimated Amount */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                        {formatCOP(item.amount)}
                      </td>

                      {/* 8. Actual Paid Amount */}
                      <td className="py-3 px-3 text-right font-mono font-black">
                        {isPaid ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {formatCOP(item.amount)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic font-normal">--</span>
                        )}
                      </td>

                      {/* 9. Status */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePaid(item)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-black cursor-pointer transition-all border inline-flex items-center space-x-1 ${
                            isPaid
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                          }`}
                        >
                          {isPaid ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>Pagado</span>
                            </>
                          ) : (
                            <>
                              <Circle className="w-3 h-3 text-amber-500" />
                              <span>Pendiente</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* 10. Payment Method */}
                      <td className="py-3 px-3 hidden md:table-cell text-slate-400 text-[11px]">
                        <span className="block truncate max-w-[130px]">{item.paymentMethod || 'Tarjeta / Nequi'}</span>
                      </td>

                      {/* 11. Actions */}
                      <td className={`py-3 px-3 text-center sticky right-0 z-10 ${
                        isPaid
                          ? isDark ? 'bg-[#0a2321]' : 'bg-[#eefcf4]'
                          : isDark ? 'bg-[#0f172a] group-hover:bg-[#152037]' : 'bg-white group-hover:bg-slate-50'
                      }`}>
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isDark 
                                ? 'bg-[#172238] border-slate-700 text-slate-300 hover:text-white hover:border-pink-400' 
                                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                            }`}
                            title="Editar gasto extra"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteExtraExpense(item.id);
                            }}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer text-rose-500 hover:text-white ${
                              isDark 
                                ? 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-600 hover:border-rose-600' 
                                : 'bg-rose-50 border-rose-200 hover:bg-rose-600 hover:border-rose-600'
                            }`}
                            title="Eliminar gasto extra"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Table Totals Footer: Subtotal Q1, Subtotal Q2, and Gran Total */}
              <tfoot>
                {/* 1. SUBTOTAL QUINCENA 1 (Q1) */}
                <tr className={`border-t font-bold font-mono text-xs ${
                  isDark ? 'bg-[#141b34] text-indigo-200 border-indigo-900/50' : 'bg-indigo-50/80 text-indigo-950 border-indigo-100'
                }`}>
                  <td colSpan={6} className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-indigo-600 text-white font-black text-[11px] shadow-xs">
                        🟣 Subtotal Q1 (1ª Quincena)
                      </span>
                      <span className="text-[11px] font-sans opacity-80 font-normal">
                        ({q1FilteredItems.length} gastos asignados)
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                    {formatCOP(q1FilteredEstimated)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatCOP(q1FilteredPaid)}
                  </td>
                  <td colSpan={3} className="py-2.5 px-4 text-left font-sans text-xs">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Pendiente Q1: <strong className="font-mono text-indigo-600 dark:text-indigo-300 font-bold">{formatCOP(Math.max(0, q1FilteredEstimated - q1FilteredPaid))}</strong>
                    </span>
                  </td>
                </tr>

                {/* 2. SUBTOTAL QUINCENA 2 (Q2) */}
                <tr className={`border-t font-bold font-mono text-xs ${
                  isDark ? 'bg-[#241a28] text-amber-200 border-amber-900/50' : 'bg-amber-50/80 text-amber-950 border-amber-100'
                }`}>
                  <td colSpan={6} className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-600 text-white font-black text-[11px] shadow-xs">
                        🟠 Subtotal Q2 (2ª Quincena)
                      </span>
                      <span className="text-[11px] font-sans opacity-80 font-normal">
                        ({q2FilteredItems.length} gastos asignados)
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-amber-600 dark:text-amber-400 text-sm">
                    {formatCOP(q2FilteredEstimated)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatCOP(q2FilteredPaid)}
                  </td>
                  <td colSpan={3} className="py-2.5 px-4 text-left font-sans text-xs">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Pendiente Q2: <strong className="font-mono text-amber-600 dark:text-amber-300 font-bold">{formatCOP(Math.max(0, q2FilteredEstimated - q2FilteredPaid))}</strong>
                    </span>
                  </td>
                </tr>

                {/* 3. TOTAL GENERAL DE GASTOS EXTRAS (Q1 + Q2) */}
                <tr className={`border-t-2 font-black font-mono text-xs ${
                  isDark ? 'bg-[#0f172a] text-white border-slate-700' : 'bg-slate-100 text-slate-900 border-slate-300'
                }`}>
                  <td colSpan={6} className="py-3.5 px-4 text-right uppercase tracking-wider text-xs">
                    <div className="flex items-center justify-end space-x-2">
                      <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black text-[11px] shadow-md">
                        TOTAL GASTOS EXTRAS (Q1 + Q2)
                      </span>
                      <span className="text-xs font-sans font-normal opacity-75">
                        ({filteredExtras.length} items):
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-black text-pink-600 dark:text-pink-400 text-base">
                    {formatCOP(totalFilteredEstimated)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-base">
                    {formatCOP(totalFilteredPaid)}
                  </td>
                  <td colSpan={3} className="py-3.5 px-4 text-left font-sans text-xs">
                    <div className="space-y-0.5">
                      <span className="px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-600 dark:text-pink-300 text-[11px] font-bold inline-block">
                        {filteredExtras.filter(e => e.isPaid).length} de {filteredExtras.length} pagados ({filteredExtras.length > 0 ? Math.round((filteredExtras.filter(e => e.isPaid).length / filteredExtras.length) * 100) : 0}%)
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Pendiente Total: {formatCOP(Math.max(0, totalFilteredEstimated - totalFilteredPaid))}
                      </span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 5.1 SUMMARY SHOWCASE: SUB-TOTAL Q1, SUB-TOTAL Q2 & TOTAL GENERAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CARD 1: SUBTOTAL Q1 */}
        <div className={`p-4 sm:p-5 rounded-3xl border shadow-lg transition-all ${
          isDark 
            ? 'bg-gradient-to-br from-[#121936] to-[#0c1022] border-indigo-500/30' 
            : 'bg-gradient-to-br from-indigo-50/80 to-white border-indigo-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-black bg-indigo-600 text-white shadow-sm">
                🟣 Q1
              </span>
              <span className={`text-xs font-bold ${isDark ? 'text-indigo-200' : 'text-indigo-900'}`}>
                1ª Quincena (Días 1 - 15)
              </span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold">
              {q1Count} gastos
            </span>
          </div>

          <div className="space-y-1 mb-3">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Subtotal Gastos Extras Q1
            </span>
            <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
              {formatCOP(q1TotalEstimated)}
            </div>
          </div>

          <div className="pt-3 border-t border-indigo-500/20 grid grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block">Pagado:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatCOP(q1TotalPaid)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Pendiente:</span>
              <span className="font-bold text-pink-600 dark:text-pink-400">
                {formatCOP(q1TotalPending)}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: SUBTOTAL Q2 */}
        <div className={`p-4 sm:p-5 rounded-3xl border shadow-lg transition-all ${
          isDark 
            ? 'bg-gradient-to-br from-[#24171d] to-[#150d17] border-amber-500/30' 
            : 'bg-gradient-to-br from-amber-50/80 to-white border-amber-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-black bg-amber-600 text-white shadow-sm">
                🟠 Q2
              </span>
              <span className={`text-xs font-bold ${isDark ? 'text-amber-200' : 'text-amber-900'}`}>
                2ª Quincena (Días 16 - 31)
              </span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">
              {q2Count} gastos
            </span>
          </div>

          <div className="space-y-1 mb-3">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Subtotal Gastos Extras Q2
            </span>
            <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
              {formatCOP(q2TotalEstimated)}
            </div>
          </div>

          <div className="pt-3 border-t border-amber-500/20 grid grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block">Pagado:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatCOP(q2TotalPaid)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Pendiente:</span>
              <span className="font-bold text-pink-600 dark:text-pink-400">
                {formatCOP(q2TotalPending)}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: TOTAL GENERAL */}
        <div className={`p-4 sm:p-5 rounded-3xl border shadow-xl transition-all ${
          isDark 
            ? 'bg-gradient-to-br from-[#261427] to-[#140b18] border-pink-500/40 ring-1 ring-pink-500/20' 
            : 'bg-gradient-to-br from-pink-50 to-rose-50/50 border-pink-200 ring-1 ring-pink-500/20'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md">
                💎 TOTAL
              </span>
              <span className={`text-xs font-bold ${isDark ? 'text-pink-200' : 'text-slate-900'}`}>
                Gran Total (Q1 + Q2)
              </span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 font-bold">
              {extraExpenses.length} total
            </span>
          </div>

          <div className="space-y-1 mb-3">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Total Mes Gastos Extras
            </span>
            <div className="text-2xl font-black font-mono text-pink-600 dark:text-pink-400">
              {formatCOP(totalEstimated)}
            </div>
          </div>

          <div className="pt-3 border-t border-pink-500/20 grid grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block">Total Pagado:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatCOP(totalPaid)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Total Pendiente:</span>
              <span className="font-bold text-pink-600 dark:text-pink-400">
                {formatCOP(totalPending)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. MODAL FOR ADDING / EDITING EXTRA EXPENSE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden ${
            isDark ? 'bg-[#181124] border-[#381e3d]' : 'bg-white border-slate-200'
          }`}>
            <form onSubmit={handleSaveModal}>
              <div className={`p-5 border-b flex items-center justify-between ${
                isDark ? 'border-slate-800 bg-[#120c1c]' : 'border-slate-200 bg-slate-50'
              }`}>
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {editingExtra ? 'Editar Gasto Adicional' : 'Nuevo Gasto Adicional'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Gasto eventual, salida a comer, compra o imprevisto puntual.
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
                    Nombre del Gasto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Salida a cenar, Medicamentos, Regalo de cumpleaños..."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-2xl text-sm font-semibold border ${
                      isDark ? 'bg-[#0f0b17] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                {/* Category & Amount */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Categoría
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as MonthlyExtraExpenseCategory)}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs font-semibold border ${
                        isDark ? 'bg-[#0f0b17] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      <option value="salidas_ocio">🍽️ Salidas & Restaurantes</option>
                      <option value="compras_ropa">🛍️ Ropa & Calzado</option>
                      <option value="salud_farmacia">💊 Salud & Farmacia</option>
                      <option value="imprevisto_hogar">🔧 Imprevisto Hogar</option>
                      <option value="regalos_celebracion">🎂 Regalos & Fiestas</option>
                      <option value="transporte_extra">🚕 Transporte Extra</option>
                      <option value="tecnologia_hogar">💻 Tecnología & Accesorios</option>
                      <option value="mascotas_extra">🐾 Mascotas</option>
                      <option value="otro">✨ Otro Gasto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Valor del Gasto ($) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="Ej. 180000"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl text-sm font-bold font-mono border ${
                        isDark ? 'bg-[#0f0b17] border-slate-700 text-pink-400' : 'bg-slate-50 border-slate-200 text-pink-700'
                      }`}
                    />
                  </div>
                </div>

                {/* Quincena Selector Q1 / Q2 */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Quincena Asignada (Q1 / Q2) *
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setFormQuincena('quincena_1')}
                      className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                        formQuincena === 'quincena_1'
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md ring-2 ring-indigo-400/40'
                          : isDark
                            ? 'bg-[#0f0b17] border-slate-700 text-slate-400 hover:text-white'
                            : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span className="font-mono font-black text-sm">🟣 Q1</span>
                      <span>1ª Quincena (Días 1 - 15)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormQuincena('quincena_2')}
                      className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                        formQuincena === 'quincena_2'
                          ? 'bg-amber-600 text-white border-amber-500 shadow-md ring-2 ring-amber-400/40'
                          : isDark
                            ? 'bg-[#0f0b17] border-slate-700 text-slate-400 hover:text-white'
                            : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span className="font-mono font-black text-sm">🟠 Q2</span>
                      <span>2ª Quincena (Días 16 - 31)</span>
                    </button>
                  </div>
                </div>

                {/* Day of Month & Paid By */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Día del Mes (1 - 31)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formDayOfMonth}
                      onChange={(e) => {
                        const d = Number(e.target.value);
                        setFormDayOfMonth(d);
                        if (d >= 1 && d <= 15) setFormQuincena('quincena_1');
                        else if (d > 15 && d <= 31) setFormQuincena('quincena_2');
                      }}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs font-bold font-mono border ${
                        isDark ? 'bg-[#0f0b17] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Pagado por
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Miguel, Liz, Hogar..."
                      value={formPaidBy}
                      onChange={(e) => setFormPaidBy(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs font-semibold border ${
                        isDark ? 'bg-[#0f0b17] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                {/* Status & Method */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Método de Pago
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Tarjeta de Crédito, Nequi, Efectivo..."
                      value={formPaymentMethod}
                      onChange={(e) => setFormPaymentMethod(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs font-semibold border ${
                        isDark ? 'bg-[#0f0b17] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Estado de Pago
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormIsPaid(!formIsPaid)}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                        formIsPaid
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : isDark ? 'bg-[#0f0b17] border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      {formIsPaid ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Ya Pagado</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4 text-slate-400" />
                          <span>Pendiente por Pagar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Detalles / Comentarios (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Lugar, motivo del gasto o recordatorio..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-2xl text-xs border ${
                      isDark ? 'bg-[#0f0b17] border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className={`p-4 border-t flex items-center justify-end space-x-2 ${
                isDark ? 'border-slate-800 bg-[#120c1c]' : 'border-slate-200 bg-slate-50'
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
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-pink-500 hover:bg-pink-400 text-white cursor-pointer shadow-md"
                >
                  {editingExtra ? 'Guardar Cambios' : 'Añadir Gasto Adicional'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gmail Expense Sync Modal */}
      <GmailExpenseSyncModal
        isOpen={isGmailSyncOpen}
        onClose={() => setIsGmailSyncOpen(false)}
        onImportExpense={(newExpense) => {
          onAddExtraExpense(newExpense);
        }}
        existingExpenses={extraExpenses}
      />

    </div>
  );
};
