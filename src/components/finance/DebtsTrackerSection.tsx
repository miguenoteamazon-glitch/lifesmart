import React, { useState, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { DebtItem, DebtCategory, DebtStatus, DebtPaymentRecord } from '../../types';
import { GeminiDebtStrategyAnalysis } from './GeminiDebtStrategyAnalysis';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Calendar,
  DollarSign,
  TrendingDown,
  Clock,
  Sparkles,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  History,
  Zap,
  ArrowRight,
  ShieldCheck,
  Check,
  Users,
  Building2,
  HelpCircle,
  Calculator,
  Flame,
  Award,
  Wallet,
  Car,
  Home,
  GraduationCap
} from 'lucide-react';

interface DebtsTrackerSectionProps {
  debts: DebtItem[];
  onAddDebt: (debt: Omit<DebtItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateDebt: (debt: DebtItem) => void;
  onDeleteDebt: (debtId: string) => void;
  onPayInstallment?: (debtId: string, payment: Omit<DebtPaymentRecord, 'id'>) => void;
  onBatchSetDebts?: (debts: DebtItem[]) => void;
}

const CATEGORY_META: Record<DebtCategory, { label: string; icon: any; color: string; bg: string; text: string }> = {
  personal: { label: 'Préstamo Personal / Familiar', icon: Users, color: '#f59e0b', bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400' },
  bancario: { label: 'Crédito Bancario / Libre Inversión', icon: Building2, color: '#3b82f6', bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400' },
  tarjeta: { label: 'Tarjeta de Crédito / Diferidos', icon: CreditCard, color: '#ef4444', bg: 'bg-rose-500/10 border-rose-500/30', text: 'text-rose-400' },
  vehicular: { label: 'Crédito de Auto / Moto', icon: Car, color: '#06b6d4', bg: 'bg-cyan-500/10 border-cyan-500/30', text: 'text-cyan-400' },
  hipotecario: { label: 'Vivienda / Hipotecario', icon: Home, color: '#8b5cf6', bg: 'bg-purple-500/10 border-purple-500/30', text: 'text-purple-400' },
  educativo: { label: 'Educativo / Universidad', icon: GraduationCap, color: '#10b981', bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400' },
  comercial: { label: 'Comercial / Proveedor', icon: Wallet, color: '#ec4899', bg: 'bg-pink-500/10 border-pink-500/30', text: 'text-pink-400' },
  otro: { label: 'Otra Deuda', icon: HelpCircle, color: '#64748b', bg: 'bg-slate-500/10 border-slate-500/30', text: 'text-slate-400' },
};

export const DebtsTrackerSection: React.FC<DebtsTrackerSectionProps> = ({
  debts,
  onAddDebt,
  onUpdateDebt,
  onDeleteDebt,
  onPayInstallment
}) => {
  const { isDark } = useTheme();

  // Filters & Tabs
  const [filterStatus, setFilterStatus] = useState<'todas' | 'activa' | 'saldada'>('activa');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Modal for adding / editing debt
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtItem | null>(null);

  // Modal for paying installment / extra capital payment
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingDebt, setPayingDebt] = useState<DebtItem | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payType, setPayType] = useState<'cuota_ordinaria' | 'abono_capital' | 'liquidacion_total'>('cuota_ordinaria');
  const [payNote, setPayNote] = useState<string>('');
  const [payReceipt, setPayReceipt] = useState<string>('');

  // Simulator State
  const [selectedDebtForSimulator, setSelectedDebtForSimulator] = useState<string | null>(debts[0]?.id || null);
  const [simulatedExtraMonthly, setSimulatedExtraMonthly] = useState<number>(50000);

  // Form State for Debt creation / editing
  const [formName, setFormName] = useState('');
  const [formCreditor, setFormCreditor] = useState('');
  const [formCategory, setFormCategory] = useState<DebtCategory>('personal');
  const [formTotalAmount, setFormTotalAmount] = useState('');
  const [formRemainingAmount, setFormRemainingAmount] = useState('');
  const [formMonthlyPayment, setFormMonthlyPayment] = useState('');
  const [formDueDay, setFormDueDay] = useState<number>(15);
  const [formStatus, setFormStatus] = useState<DebtStatus>('activa');
  const [formStartDate, setFormStartDate] = useState('');
  const [formInterestRate, setFormInterestRate] = useState('0');
  const [formPaymentChannel, setFormPaymentChannel] = useState('Nequi / Transferencia');
  const [formNotes, setFormNotes] = useState('');

  // Currency Formatter
  const formatMoney = (val: number) => {
    return `$ ${Number(val || 0).toLocaleString('es-CO')}`;
  };

  // Helper to calculate pending installments
  const calculatePendingInstallments = (remaining: number, monthly: number) => {
    if (!monthly || monthly <= 0 || !remaining || remaining <= 0) return 0;
    return Math.ceil(remaining / monthly);
  };

  // Helper to format remaining time nicely (e.g. "110 cuotas (~9 años y 2 meses)")
  const formatRemainingTime = (monthsCount: number) => {
    if (monthsCount <= 0) return '¡Saldada!';
    if (monthsCount === 1) return '1 mes (1 cuota)';
    if (monthsCount < 12) return `${monthsCount} meses`;
    
    const years = Math.floor(monthsCount / 12);
    const remainingMonths = monthsCount % 12;
    if (remainingMonths === 0) {
      return `${monthsCount} meses (~${years} ${years === 1 ? 'año' : 'años'})`;
    }
    return `${monthsCount} meses (~${years} ${years === 1 ? 'año' : 'años'} y ${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'})`;
  };

  // Helper to estimate final payoff date from today
  const estimatePayoffDate = (monthsCount: number) => {
    if (monthsCount <= 0) return 'Deuda liquidada';
    const d = new Date();
    d.setMonth(d.getMonth() + monthsCount);
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  };

  // Filtered Debts
  const filteredDebts = useMemo(() => {
    return debts.filter(debt => {
      if (filterStatus !== 'todas' && debt.status !== filterStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = debt.name.toLowerCase().includes(q);
        const matchCreditor = (debt.creditor || '').toLowerCase().includes(q);
        const matchNotes = (debt.notes || '').toLowerCase().includes(q);
        if (!matchName && !matchCreditor && !matchNotes) return false;
      }
      return true;
    });
  }, [debts, filterStatus, searchQuery]);

  // Overall Global Debt Metrics
  const globalMetrics = useMemo(() => {
    let totalOriginal = 0;
    let totalRemaining = 0;
    let totalMonthlyCommitment = 0;
    let activeCount = 0;
    let paidOffCount = 0;

    debts.forEach(d => {
      totalOriginal += Number(d.totalAmount) || 0;
      totalRemaining += Number(d.remainingAmount) || 0;
      if (d.status === 'activa') {
        activeCount++;
        totalMonthlyCommitment += Number(d.monthlyPayment) || 0;
      } else if (d.status === 'saldada') {
        paidOffCount++;
      }
    });

    const totalAmortized = Math.max(0, totalOriginal - totalRemaining);
    const progressPercent = totalOriginal > 0 ? Math.min(100, Math.round((totalAmortized / totalOriginal) * 100)) : 0;

    return {
      totalOriginal,
      totalRemaining,
      totalAmortized,
      progressPercent,
      totalMonthlyCommitment,
      activeCount,
      paidOffCount,
      totalCount: debts.length
    };
  }, [debts]);

  // Handle open add modal
  const handleOpenAddModal = () => {
    setEditingDebt(null);
    setFormName('');
    setFormCreditor('');
    setFormCategory('personal');
    setFormTotalAmount('');
    setFormRemainingAmount('');
    setFormMonthlyPayment('');
    setFormDueDay(15);
    setFormStatus('activa');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormInterestRate('0');
    setFormPaymentChannel('Nequi / Transferencia');
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEditModal = (debt: DebtItem) => {
    setEditingDebt(debt);
    setFormName(debt.name);
    setFormCreditor(debt.creditor || '');
    setFormCategory(debt.category || 'personal');
    setFormTotalAmount(debt.totalAmount ? String(debt.totalAmount) : '');
    setFormRemainingAmount(debt.remainingAmount !== undefined ? String(debt.remainingAmount) : '');
    setFormMonthlyPayment(debt.monthlyPayment ? String(debt.monthlyPayment) : '');
    setFormDueDay(debt.dueDay || 15);
    setFormStatus(debt.status || 'activa');
    setFormStartDate(debt.startDate || '');
    setFormInterestRate(debt.interestRate !== undefined ? String(debt.interestRate) : '0');
    setFormPaymentChannel(debt.paymentChannel || 'Nequi / Transferencia');
    setFormNotes(debt.notes || '');
    setIsModalOpen(true);
  };

  // Save Debt
  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Por favor escribe el nombre de la deuda o préstamo');
      return;
    }

    const totalAmt = parseFloat(formTotalAmount.replace(/\D/g, '')) || 0;
    const remainingAmt = formRemainingAmount.trim() !== '' 
      ? (parseFloat(formRemainingAmount.replace(/\D/g, '')) || 0) 
      : totalAmt;
    const monthlyAmt = parseFloat(formMonthlyPayment.replace(/\D/g, '')) || 0;
    const interest = parseFloat(formInterestRate) || 0;

    if (totalAmt <= 0) {
      alert('Por favor ingresa un monto total válido');
      return;
    }

    if (monthlyAmt <= 0) {
      alert('Por favor ingresa el valor de la cuota mensual');
      return;
    }

    const autoStatus: DebtStatus = remainingAmt <= 0 ? 'saldada' : formStatus;

    if (editingDebt) {
      onUpdateDebt({
        ...editingDebt,
        name: formName.trim(),
        creditor: formCreditor.trim() || 'Acreedor',
        category: formCategory,
        totalAmount: totalAmt,
        remainingAmount: remainingAmt,
        monthlyPayment: monthlyAmt,
        dueDay: Number(formDueDay) || 15,
        status: autoStatus,
        startDate: formStartDate || undefined,
        interestRate: interest,
        interestType: interest > 0 ? 'fijo' : 'sin_interes',
        paymentChannel: formPaymentChannel.trim(),
        notes: formNotes.trim(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      onAddDebt({
        name: formName.trim(),
        creditor: formCreditor.trim() || 'Acreedor',
        category: formCategory,
        totalAmount: totalAmt,
        remainingAmount: remainingAmt,
        monthlyPayment: monthlyAmt,
        dueDay: Number(formDueDay) || 15,
        status: autoStatus,
        startDate: formStartDate || new Date().toISOString().split('T')[0],
        interestRate: interest,
        interestType: interest > 0 ? 'fijo' : 'sin_interes',
        paymentChannel: formPaymentChannel.trim(),
        notes: formNotes.trim(),
        paymentsHistory: [],
      });
    }

    setIsModalOpen(false);
  };

  // Open Pay Installment Modal
  const handleOpenPayModal = (debt: DebtItem, defaultType: 'cuota_ordinaria' | 'abono_capital' | 'liquidacion_total' = 'cuota_ordinaria') => {
    setPayingDebt(debt);
    setPayType(defaultType);
    if (defaultType === 'cuota_ordinaria') {
      setPayAmount(String(debt.monthlyPayment || 35000));
      setPayNote(`Pago cuota mensual de ${formatMoney(debt.monthlyPayment)}`);
    } else if (defaultType === 'liquidacion_total') {
      setPayAmount(String(debt.remainingAmount || debt.monthlyPayment));
      setPayNote('Liquidación total y saldo definitivo de la deuda');
    } else {
      setPayAmount(String(debt.monthlyPayment * 2 || 100000));
      setPayNote('Abono extraordinario a capital');
    }
    setPayReceipt('');
    setIsPayModalOpen(true);
  };

  // Submit Payment / Installment
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDebt) return;

    const amountNum = parseFloat(payAmount.replace(/\D/g, '')) || 0;
    if (amountNum <= 0) {
      alert('Por favor ingresa un monto válido a abonar');
      return;
    }

    const newRemaining = Math.max(0, payingDebt.remainingAmount - amountNum);
    const newStatus: DebtStatus = newRemaining === 0 ? 'saldada' : payingDebt.status;
    const currentPayments = payingDebt.paymentsHistory || [];
    const nextInstallmentNum = currentPayments.length + 1;

    const newPaymentRecord: DebtPaymentRecord = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: new Date().toISOString().split('T')[0],
      amount: amountNum,
      installmentNumber: nextInstallmentNum,
      type: payType,
      note: payNote.trim() || (payType === 'cuota_ordinaria' ? `Cuota #${nextInstallmentNum}` : 'Abono a capital'),
      receiptNumber: payReceipt.trim() || undefined,
    };

    const updatedDebt: DebtItem = {
      ...payingDebt,
      remainingAmount: newRemaining,
      status: newStatus,
      paymentsHistory: [newPaymentRecord, ...currentPayments],
      updatedAt: new Date().toISOString(),
    };

    if (onPayInstallment) {
      onPayInstallment(payingDebt.id, newPaymentRecord);
    } else {
      onUpdateDebt(updatedDebt);
    }

    setIsPayModalOpen(false);
  };

  // Simulator calculations for selected debt
  const simDebt = useMemo(() => {
    return debts.find(d => d.id === selectedDebtForSimulator) || debts[0];
  }, [debts, selectedDebtForSimulator]);

  const simulatorStats = useMemo(() => {
    if (!simDebt || simDebt.remainingAmount <= 0) return null;
    const standardMonthly = simDebt.monthlyPayment || 35000;
    const standardMonths = Math.ceil(simDebt.remainingAmount / standardMonthly);

    const acceleratedMonthly = standardMonthly + Number(simulatedExtraMonthly || 0);
    const acceleratedMonths = Math.ceil(simDebt.remainingAmount / acceleratedMonthly);

    const monthsSaved = Math.max(0, standardMonths - acceleratedMonths);
    const yearsSaved = (monthsSaved / 12).toFixed(1);

    return {
      standardMonthly,
      standardMonths,
      acceleratedMonthly,
      acceleratedMonths,
      monthsSaved,
      yearsSaved
    };
  }, [simDebt, simulatedExtraMonthly]);

  return (
    <div className="space-y-6">

      {/* 1. TOP HEADER & INTRO BANNER */}
      <div className={`p-5 sm:p-6 rounded-3xl border shadow-xl relative overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-br from-[#101b33] via-[#142345] to-[#0f192e] border-[#203761]' 
          : 'bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white border-amber-200 shadow-amber-500/5'
      }`}>
        {/* Background glow & accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/25 shrink-0">
              <TrendingDown className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5 flex-wrap">
                <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  Control de Deudas & Préstamos
                </h2>
                <span className="px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                  {globalMetrics.activeCount} Activas • {formatMoney(globalMetrics.totalRemaining)} Pendiente
                </span>
              </div>
              <p className={`text-xs sm:text-sm mt-1 max-w-2xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Monitorea cada préstamo personal o bancario, cuotas pendientes calculadas automáticamente, abonos a capital e historial de liquidación.
              </p>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/25 hover:brightness-105 active:scale-95 transition-all cursor-pointer flex items-center space-x-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Nueva Deuda / Préstamo</span>
            </button>
          </div>
        </div>

        {/* 2. EXECUTIVE GLOBAL METRICS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800/80">
          
          {/* Metric 1: Total Deuda Original */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#0f172a]/70 border-slate-800' : 'bg-white/80 border-slate-200 shadow-xs'
          }`}>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Deuda Total Original
            </span>
            <div className={`text-lg sm:text-xl font-black font-mono mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatMoney(globalMetrics.totalOriginal)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Suma de {globalMetrics.totalCount} préstamos
            </span>
          </div>

          {/* Metric 2: Saldo Pendiente Actual */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200 shadow-xs'
          }`}>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
              Saldo Pendiente Total
            </span>
            <div className="text-lg sm:text-xl font-black font-mono text-amber-600 dark:text-amber-300 mt-1">
              {formatMoney(globalMetrics.totalRemaining)}
            </div>
            <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-0.5 block">
              {globalMetrics.activeCount} deudas por saldar
            </span>
          </div>

          {/* Metric 3: Total Amortizado / Pagado */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200 shadow-xs'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Total Ya Pagado
              </span>
              <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-300">
                {globalMetrics.progressPercent}%
              </span>
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {formatMoney(globalMetrics.totalAmortized)}
            </div>
            {/* Mini Progress bar */}
            <div className="w-full bg-emerald-500/20 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${globalMetrics.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Metric 4: Compromiso Mensual en Cuotas */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#0f172a]/70 border-slate-800' : 'bg-white/80 border-slate-200 shadow-xs'
          }`}>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Cuotas del Mes (Fijo)
            </span>
            <div className="text-lg sm:text-xl font-black font-mono text-cyan-500 dark:text-cyan-400 mt-1">
              {formatMoney(globalMetrics.totalMonthlyCommitment)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Obligación recurrente mensual
            </span>
          </div>

        </div>
      </div>

      {/* 2.5 GEMINI AI DEBT STRATEGY & PRIORITIZATION ANALYSIS */}
      <GeminiDebtStrategyAnalysis debts={debts} />

      {/* 3. FILTER BAR & SEARCH */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
        isDark ? 'bg-[#0e1628] border-[#1e2f4f]' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-100 dark:bg-[#15223c] border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterStatus('activa')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'activa'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🔥 Activas ({debts.filter(d => d.status === 'activa').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('saldada')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'saldada'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🏆 Saldadas ({debts.filter(d => d.status === 'saldada').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('todas')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'todas'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todas ({debts.length})
          </button>
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Buscar deuda o acreedor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full px-3.5 py-2 rounded-xl text-xs border focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 ${
              isDark ? 'bg-[#121c33] border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>
      </div>

      {/* 4. DEBT CARDS LIST */}
      {filteredDebts.length === 0 ? (
        <div className={`p-10 rounded-3xl border text-center space-y-3 ${
          isDark ? 'bg-[#101a2f] border-[#223554]' : 'bg-white border-slate-200'
        }`}>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <Award className="w-6 h-6" />
          </div>
          <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {filterStatus === 'saldada' ? 'No hay deudas saldadas aún' : 'No hay deudas registradas'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {filterStatus === 'saldada' 
              ? 'Cuando liquides tus préstamos y abones las cuotas restantes, aparecerán aquí como victorias financieras.'
              : 'Agrega tu primer préstamo (ej: Angélica, Bancolombia, etc.) para monitorear las cuotas y proyectar la fecha de pago.'}
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all cursor-pointer inline-flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Agregar Préstamo / Deuda</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDebts.map(debt => {
            const catMeta = CATEGORY_META[debt.category] || CATEGORY_META.otro;
            const isPaidOff = debt.status === 'saldada' || debt.remainingAmount <= 0;
            const paidAmount = Math.max(0, debt.totalAmount - debt.remainingAmount);
            const progress = debt.totalAmount > 0 ? Math.min(100, Math.round((paidAmount / debt.totalAmount) * 100)) : 0;
            const pendingInstallments = calculatePendingInstallments(debt.remainingAmount, debt.monthlyPayment);
            const estimatedPayoff = estimatePayoffDate(pendingInstallments);
            const isExpanded = expandedHistoryId === debt.id;
            const historyCount = debt.paymentsHistory?.length || 0;

            return (
              <div
                key={debt.id}
                className={`rounded-3xl border transition-all duration-200 overflow-hidden shadow-lg ${
                  isPaidOff
                    ? isDark ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50/50 border-emerald-200'
                    : isDark ? 'bg-[#101b30] border-[#223554] hover:border-amber-500/40' : 'bg-white border-slate-200 hover:border-amber-400'
                }`}
              >
                {/* Main Card Header & Metrics */}
                <div className="p-5 sm:p-6 space-y-4">
                  
                  {/* Top Bar: Title, Badges & Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: `${catMeta.color}15`,
                          borderColor: `${catMeta.color}35`,
                          color: catMeta.color,
                        }}
                      >
                        <catMeta.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 flex-wrap">
                          <h3 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {debt.name}
                          </h3>
                          {isPaidOff ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>¡Saldada al 100%!</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              Día {debt.dueDay} de cada mes
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center space-x-2">
                          <span>👤 Acreedor: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{debt.creditor}</strong></span>
                          <span>•</span>
                          <span>🏷️ {catMeta.label}</span>
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      {!isPaidOff && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenPayModal(debt, 'cuota_ordinaria')}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-95 transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm shadow-emerald-500/20"
                            title="Registrar pago de la cuota mensual"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Pagar Cuota ({formatMoney(debt.monthlyPayment)})</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleOpenPayModal(debt, 'abono_capital')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              isDark 
                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30' 
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                            }`}
                            title="Abono extraordinario para bajar el saldo más rápido"
                          >
                            <Zap className="w-3.5 h-3.5 inline mr-1 text-amber-500" />
                            <span>Abono Extra</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(debt)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          isDark 
                            ? 'bg-[#15223e] border-slate-700 text-slate-300 hover:text-white hover:border-amber-400' 
                            : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                        }`}
                        title="Editar deuda"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`¿Seguro que deseas eliminar el registro de "${debt.name}"?`)) {
                            onDeleteDebt(debt.id);
                          }
                        }}
                        className={`p-2 rounded-xl border transition-all cursor-pointer text-rose-400 ${
                          isDark 
                            ? 'bg-[#15223e] border-slate-700 hover:bg-rose-500/20 hover:border-rose-500' 
                            : 'bg-slate-100 border-slate-200 hover:bg-rose-50 hover:border-rose-300'
                        }`}
                        title="Eliminar deuda"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Visual Repayment Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-slate-400">Progreso de Pago:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-black">{progress}% saldado</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatMoney(paidAmount)} amortizado</span>
                        <span className="text-slate-400 font-normal">/</span>
                        <span className="text-slate-400 font-normal">Total {formatMoney(debt.totalAmount)}</span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isPaidOff 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                            : 'bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* 4 Key Details Metric Boxes */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-2">
                    
                    {/* Box 1: Saldo Pendiente */}
                    <div className={`p-3 rounded-2xl border ${
                      isPaidOff 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : isDark ? 'bg-[#0d1527] border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Saldo Pendiente
                      </span>
                      <div className={`text-base font-black font-mono mt-0.5 ${
                        isPaidOff 
                          ? 'text-emerald-500' 
                          : 'text-amber-500 dark:text-amber-400'
                      }`}>
                        {formatMoney(debt.remainingAmount)}
                      </div>
                    </div>

                    {/* Box 2: Cuota Mensual */}
                    <div className={`p-3 rounded-2xl border ${
                      isDark ? 'bg-[#0d1527] border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Cuota Mensual
                      </span>
                      <div className={`text-base font-black font-mono mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {formatMoney(debt.monthlyPayment)}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Día {debt.dueDay} ({debt.paymentChannel || 'Nequi'})
                      </span>
                    </div>

                    {/* Box 3: Cuotas Pendientes Estimadas */}
                    <div className={`p-3 rounded-2xl border ${
                      isDark ? 'bg-[#0d1527] border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Cuotas Pendientes
                      </span>
                      <div className="text-base font-black font-mono text-cyan-500 dark:text-cyan-400 mt-0.5">
                        {pendingInstallments === 0 ? '0 cuotas' : `~${pendingInstallments} cuotas`}
                      </div>
                      <span className="text-[10px] text-slate-400 truncate block">
                        {formatRemainingTime(pendingInstallments)}
                      </span>
                    </div>

                    {/* Box 4: Fecha Estimada de Liquidación */}
                    <div className={`p-3 rounded-2xl border ${
                      isDark ? 'bg-[#0d1527] border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Meta de Liquidación
                      </span>
                      <div className="text-xs sm:text-sm font-black text-purple-600 dark:text-purple-400 mt-1 flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{estimatedPayoff}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        {debt.interestRate ? `${debt.interestRate}% interés` : '0% sin interés'}
                      </span>
                    </div>

                  </div>

                  {/* Notes & Agreement details if any */}
                  {debt.notes && (
                    <div className={`p-3 rounded-2xl text-xs border ${
                      isDark ? 'bg-[#0a101f] border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <span className="font-bold text-slate-400 mr-1.5">📝 Acuerdos & Notas:</span>
                      <span>{debt.notes}</span>
                    </div>
                  )}

                  {/* Toggle History Accordion Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                    <button
                      type="button"
                      onClick={() => setExpandedHistoryId(isExpanded ? null : debt.id)}
                      className={`text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-colors ${
                        isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-700 hover:text-cyan-800'
                      }`}
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Historial de Pagos & Abonos ({historyCount})</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {!isPaidOff && (
                      <button
                        type="button"
                        onClick={() => handleOpenPayModal(debt, 'liquidacion_total')}
                        className="text-[11px] font-bold text-purple-500 hover:text-purple-400 hover:underline cursor-pointer flex items-center space-x-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Liquidar Saldo Total ({formatMoney(debt.remainingAmount)})</span>
                      </button>
                    )}
                  </div>

                </div>

                {/* EXPANDABLE PAYMENTS HISTORY TABLE */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`border-t p-4 sm:p-5 ${
                        isDark ? 'bg-[#0c1424] border-slate-800' : 'bg-slate-50/80 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Historial de Cuotas Pagadas y Abonos a Capital
                        </h4>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {historyCount} transacciones registradas
                        </span>
                      </div>

                      {historyCount === 0 ? (
                        <p className="text-xs text-slate-400 py-3 text-center">
                          Aún no se han registrado abonos en este préstamo. Haz clic en "Pagar Cuota" para añadir el primer comprobante.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className={`border-b text-[10px] font-mono uppercase tracking-wider ${
                                isDark ? 'text-slate-400 border-slate-700' : 'text-slate-500 border-slate-300'
                              }`}>
                                <th className="py-2 px-2">#</th>
                                <th className="py-2 px-3">Fecha</th>
                                <th className="py-2 px-3">Tipo</th>
                                <th className="py-2 px-3">Detalle / Nota</th>
                                <th className="py-2 px-3">Comprobante</th>
                                <th className="py-2 px-3 text-right">Monto Abonado</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                              {debt.paymentsHistory!.map((pay, idx) => (
                                <tr key={pay.id || idx} className={isDark ? 'hover:bg-[#111c33]' : 'hover:bg-white'}>
                                  <td className="py-2 px-2 font-mono font-bold text-slate-400">
                                    {pay.installmentNumber ? `#${pay.installmentNumber}` : `#${historyCount - idx}`}
                                  </td>
                                  <td className="py-2 px-3 font-mono font-bold">
                                    {pay.date}
                                  </td>
                                  <td className="py-2 px-3">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                      pay.type === 'abono_capital' 
                                        ? 'bg-amber-500/20 text-amber-500' 
                                        : pay.type === 'liquidacion_total'
                                          ? 'bg-purple-500/20 text-purple-400'
                                          : 'bg-emerald-500/20 text-emerald-500'
                                    }`}>
                                      {pay.type === 'abono_capital' ? '⚡ Abono Capital' : pay.type === 'liquidacion_total' ? '🏆 Liquidación' : 'Cuota Ordinaria'}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-slate-300 dark:text-slate-400">
                                    {pay.note || 'Pago cuota'}
                                  </td>
                                  <td className="py-2 px-3 font-mono text-[11px] text-cyan-400">
                                    {pay.receiptNumber || '--'}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono font-black text-emerald-500">
                                    {formatMoney(pay.amount)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. INTERACTIVE ACCELERATOR & SIMULATOR (Acelerador de Liquidación de Deuda) */}
      {debts.filter(d => d.status === 'activa' && d.remainingAmount > 0).length > 0 && (
        <div className={`p-5 sm:p-6 rounded-3xl border shadow-xl space-y-4 ${
          isDark 
            ? 'bg-gradient-to-r from-[#101b33] via-[#142345] to-[#121e38] border-[#223963]' 
            : 'bg-gradient-to-r from-purple-50 via-indigo-50 to-white border-purple-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                ⚡ Simulador & Acelerador de Pagos (Efecto Bola de Nieve)
              </h3>
              <p className="text-xs text-slate-400">
                Calcula cuántos meses y años te ahorras aumentando tu cuota mensual o haciendo abonos extra voluntarios.
              </p>
            </div>
          </div>

          {/* Select Debt to simulate */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">
                Selecciona la Deuda a Simular:
              </label>
              <select
                value={selectedDebtForSimulator || ''}
                onChange={(e) => setSelectedDebtForSimulator(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border cursor-pointer ${
                  isDark ? 'bg-[#0d1628] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                {debts.filter(d => d.status === 'activa').map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({formatMoney(d.remainingAmount)} pendiente)
                  </option>
                ))}
              </select>
            </div>

            {/* Input Extra Monthly Payment */}
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400">
                  ¿Cuánto dinero extra puedes aportar mensualmente?
                </label>
                <span className="text-xs font-mono font-black text-amber-500">
                  +{formatMoney(simulatedExtraMonthly)} / mes
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="0"
                  max="500000"
                  step="10000"
                  value={simulatedExtraMonthly}
                  onChange={(e) => setSimulatedExtraMonthly(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
                />
              </div>

              {/* Quick preset buttons */}
              <div className="flex items-center space-x-2 pt-1">
                {[20000, 50000, 100000, 200000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSimulatedExtraMonthly(amt)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                      simulatedExtraMonthly === amt
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : isDark ? 'bg-[#15223d] text-slate-300 hover:bg-[#1e3054]' : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    +{formatMoney(amt)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Simulator Results Highlight Box */}
          {simulatorStats && (
            <div className={`p-4 sm:p-5 rounded-2xl border mt-3 flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isDark ? 'bg-[#0b1324] border-purple-500/30' : 'bg-white border-purple-200 shadow-sm'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400">Cuota actual:</span>
                  <span className="font-mono font-bold text-slate-300">{formatMoney(simulatorStats.standardMonthly)}/mes</span>
                  <span className="text-slate-400">➔</span>
                  <span className="text-slate-400">Cuota acelerada:</span>
                  <span className="font-mono font-bold text-amber-400">{formatMoney(simulatorStats.acceleratedMonthly)}/mes</span>
                </div>
                <div className={`text-sm sm:text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {simulatorStats.monthsSaved > 0 ? (
                    <span>
                      🎉 ¡Liquidaras la deuda en solo <span className="text-amber-400 font-mono font-black">{simulatorStats.acceleratedMonths} meses</span> en lugar de {simulatorStats.standardMonths} meses!
                    </span>
                  ) : (
                    <span>Ajusta el valor extra arriba para ver el tiempo que puedes ahorrar.</span>
                  )}
                </div>
              </div>

              {simulatorStats.monthsSaved > 0 && (
                <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs sm:text-sm shadow-md shrink-0 text-center">
                  🔥 Te ahorras {simulatorStats.monthsSaved} cuotas (~{simulatorStats.yearsSaved} años)
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD / EDIT DEBT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`w-full max-w-xl max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${
              isDark ? 'bg-[#101b30] border-[#223554] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black">
                    {editingDebt ? 'Editar Deuda / Préstamo' : 'Nueva Deuda o Préstamo'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Define el acreedor, el monto total inicial y el valor de la cuota mensual.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveDebt} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              
              {/* Name & Creditor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Nombre del Préstamo / Concepto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Préstamo Angélica, Crédito Auto"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs border focus:outline-hidden focus:ring-2 focus:ring-amber-500 ${
                      isDark ? 'bg-[#15223e] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Acreedor / A quién se le debe *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Angélica, Bancolombia, Familiar"
                    value={formCreditor}
                    onChange={(e) => setFormCreditor(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs border focus:outline-hidden focus:ring-2 focus:ring-amber-500 ${
                      isDark ? 'bg-[#15223e] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Categoría de Deuda
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as DebtCategory)}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs border cursor-pointer ${
                      isDark ? 'bg-[#15223e] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="personal">👤 Préstamo Personal / Amigos / Familia</option>
                    <option value="bancario">🏦 Crédito Bancario / Libre Inversión</option>
                    <option value="tarjeta">💳 Tarjeta de Crédito / Saldo diferido</option>
                    <option value="vehicular">🚗 Crédito de Auto / Moto</option>
                    <option value="hipotecario">🏠 Crédito de Vivienda / Hipoteca</option>
                    <option value="educativo">🎓 Crédito Educativo / Universidad</option>
                    <option value="comercial">💼 Comercial / Proveedor</option>
                    <option value="otro">📦 Otra deuda</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Estado Actual
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as DebtStatus)}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs border cursor-pointer ${
                      isDark ? 'bg-[#15223e] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="activa">🔥 Activa (en amortización)</option>
                    <option value="saldada">🏆 Saldada / Liquidada al 100%</option>
                    <option value="pausada">⏸️ En pausa / Acuerdo especial</option>
                  </select>
                </div>
              </div>

              {/* Total Amount & Remaining Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Monto Total Original ($) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Ej: 4000000"
                    value={formTotalAmount}
                    onChange={(e) => {
                      setFormTotalAmount(e.target.value);
                      if (!editingDebt && !formRemainingAmount) {
                        setFormRemainingAmount(e.target.value);
                      }
                    }}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono font-bold border ${
                      isDark ? 'bg-[#15223e] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  {formTotalAmount && (
                    <span className="text-[11px] font-mono text-amber-500 font-bold mt-1 block">
                      {formatMoney(Number(formTotalAmount))}
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Saldo Pendiente Actual ($) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Ej: 3825000"
                    value={formRemainingAmount}
                    onChange={(e) => setFormRemainingAmount(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono font-bold border ${
                      isDark ? 'bg-[#15223e] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  {formRemainingAmount && (
                    <span className="text-[11px] font-mono text-emerald-500 font-bold mt-1 block">
                      {formatMoney(Number(formRemainingAmount))}
                    </span>
                  )}
                </div>
              </div>

              {/* Monthly Payment & Due Day */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Cuota Mensual Acordada ($) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Ej: 35000"
                    value={formMonthlyPayment}
                    onChange={(e) => setFormMonthlyPayment(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono font-bold border ${
                      isDark ? 'bg-[#15223e] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  {formMonthlyPayment && (
                    <span className="text-[11px] font-mono text-cyan-400 font-bold mt-1 block">
                      {formatMoney(Number(formMonthlyPayment))} / mes
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Día de Pago del Mes (1 al 31)
                  </label>
                  <select
                    value={formDueDay}
                    onChange={(e) => setFormDueDay(Number(e.target.value))}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                      isDark ? 'bg-[#15223e] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        Día {d < 10 ? '0' + d : d} de cada mes
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Payment Channel & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Medio / Canal de Pago
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Nequi / Bancolombia / Efectivo"
                    value={formPaymentChannel}
                    onChange={(e) => setFormPaymentChannel(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs border ${
                      isDark ? 'bg-[#15223e] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Tasa de Interés Mensual (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0 si es sin interés"
                    value={formInterestRate}
                    onChange={(e) => setFormInterestRate(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs border ${
                      isDark ? 'bg-[#15223e] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Notas / Acuerdos Especiales (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Préstamo de confianza acordado con cuotas fijas quincenales o mensuales..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs border ${
                    isDark ? 'bg-[#15223e] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/25 hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                >
                  {editingDebt ? 'Guardar Cambios' : 'Guardar Préstamo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PAY INSTALLMENT / EXTRA CAPITAL PAYMENT */}
      {isPayModalOpen && payingDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden ${
              isDark ? 'bg-[#101b30] border-[#223554] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    Registrar Pago o Abono
                  </h3>
                  <p className="text-xs text-slate-400">
                    {payingDebt.name} • Acreedor: {payingDebt.creditor}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitPayment} className="p-5 space-y-4">
              
              {/* Type selector */}
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  Tipo de Transacción
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPayType('cuota_ordinaria');
                      setPayAmount(String(payingDebt.monthlyPayment));
                      setPayNote(`Pago cuota mensual de ${formatMoney(payingDebt.monthlyPayment)}`);
                    }}
                    className={`p-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                      payType === 'cuota_ordinaria'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                        : isDark ? 'bg-[#15223e] border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200'
                    }`}
                  >
                    Cuota Mensual
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPayType('abono_capital');
                      setPayAmount(String(payingDebt.monthlyPayment * 2 || 100000));
                      setPayNote('Abono extraordinario a capital');
                    }}
                    className={`p-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                      payType === 'abono_capital'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                        : isDark ? 'bg-[#15223e] border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200'
                    }`}
                  >
                    Abono Extra
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPayType('liquidacion_total');
                      setPayAmount(String(payingDebt.remainingAmount));
                      setPayNote('Liquidación definitiva total');
                    }}
                    className={`p-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                      payType === 'liquidacion_total'
                        ? 'bg-purple-500 text-white border-purple-400 font-black'
                        : isDark ? 'bg-[#15223e] border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200'
                    }`}
                  >
                    Liquidar Todo
                  </button>
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Monto a Abonar ($) *
                </label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono font-black border ${
                    isDark ? 'bg-[#15223e] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
                <div className="flex items-center justify-between text-[11px] font-mono mt-1 text-slate-400">
                  <span>Saldo actual: {formatMoney(payingDebt.remainingAmount)}</span>
                  <span className="text-emerald-400 font-bold">
                    Nuevo saldo: {formatMoney(Math.max(0, payingDebt.remainingAmount - (Number(payAmount) || 0)))}
                  </span>
                </div>
              </div>

              {/* Note / Detail */}
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Nota / Detalle del Pago
                </label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="Ej: Pago cuota mensual puntual"
                  className={`w-full px-3.5 py-2 rounded-xl text-xs border ${
                    isDark ? 'bg-[#15223e] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Receipt Reference */}
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Referencia / Nro. Comprobante (Opcional)
                </label>
                <input
                  type="text"
                  value={payReceipt}
                  onChange={(e) => setPayReceipt(e.target.value)}
                  placeholder="Ej: NEQ-123456 / Comprobante M12"
                  className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border ${
                    isDark ? 'bg-[#15223e] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 active:scale-95 transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Confirmar Abono ({formatMoney(Number(payAmount) || 0)})</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
