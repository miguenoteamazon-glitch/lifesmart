import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { MonthlyBillItem, MonthlyIncomeItem, MonthlyExtraExpenseItem, DebtItem } from '../../types';
import {
  TrendingUp,
  CreditCard,
  ShoppingBag,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  PiggyBank,
  Sparkles,
  Calendar,
  Layers,
  Scale,
  TrendingDown,
  Landmark,
  Search,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  HelpCircle,
  Check,
  Info
} from 'lucide-react';
import { ExecutiveQuincenaCard } from './ExecutiveQuincenaCard';

interface FinancialSummaryDashboardProps {
  incomes: MonthlyIncomeItem[];
  bills: MonthlyBillItem[];
  extraExpenses: MonthlyExtraExpenseItem[];
  debts?: DebtItem[];
  onSelectTab?: (tabId: 'quincenas' | 'resumen' | 'ingresos' | 'fijos' | 'extras' | 'deudas' | 'flujo') => void;
  selectedMonth?: number;
  selectedYear?: number;
  monthName?: string;
}

export const FinancialSummaryDashboard: React.FC<FinancialSummaryDashboardProps> = ({
  incomes,
  bills,
  extraExpenses,
  debts = [],
  onSelectTab,
  selectedMonth,
  selectedYear,
  monthName
}) => {
  const { isDark } = useTheme();

  // Bank reconciliation state with local storage persistence
  const currentMonthIdx = selectedMonth !== undefined ? selectedMonth : new Date().getMonth();
  const currentYearNum = selectedYear || new Date().getFullYear();
  const storageKey = `lifeflow_bank_balance_${currentYearNum}_${currentMonthIdx}`;

  const [realBankBalanceInput, setRealBankBalanceInput] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null && saved !== '') return saved;
    } catch (e) {}
    return '';
  });

  const [reconciliationBase, setReconciliationBase] = useState<'real' | 'estimated'>('real');
  const [lastReconciledDate, setLastReconciledDate] = useState<string>(() => {
    try {
      return localStorage.getItem(`${storageKey}_date`) || '';
    } catch (e) {}
    return '';
  });
  const [showDifferenceTips, setShowDifferenceTips] = useState<boolean>(true);

  // View mode for separating Q1 and Q2
  const [viewMode, setViewMode] = useState<'both' | 'q1' | 'q2' | 'consolidated'>(() => {
    try {
      const saved = localStorage.getItem('lifeflow_executive_view_mode');
      if (saved && ['both', 'q1', 'q2', 'consolidated'].includes(saved)) {
        return saved as any;
      }
    } catch (e) {}
    return 'both';
  });

  const handleViewModeChange = (mode: 'both' | 'q1' | 'q2' | 'consolidated') => {
    setViewMode(mode);
    try {
      localStorage.setItem('lifeflow_executive_view_mode', mode);
    } catch (e) {}
  };

  // Reconciliation period filter
  const [reconciliationPeriod, setReconciliationPeriod] = useState<'q1' | 'q2' | 'month'>('month');

  // Sync state when month/year changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setRealBankBalanceInput(saved !== null && saved !== '' ? saved : '');
      const savedDate = localStorage.getItem(`${storageKey}_date`) || '';
      setLastReconciledDate(savedDate);
    } catch (e) {}
  }, [storageKey]);

  const handleBankBalanceChange = (val: string) => {
    setRealBankBalanceInput(val);
    try {
      localStorage.setItem(storageKey, val);
      const nowStr = new Date().toLocaleString('es-CO', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      localStorage.setItem(`${storageKey}_date`, nowStr);
      setLastReconciledDate(nowStr);
    } catch (e) {}
  };

  // 1. Incomes Calculations
  const totalIncomeEstimated = incomes.reduce((sum, item) => sum + (Number(item.estimatedAmount) || 0), 0);
  const totalIncomeReceived = incomes.reduce((sum, item) => {
    if (item.isReceived) {
      return sum + (item.actualAmount !== undefined && item.actualAmount !== null && item.actualAmount > 0 
        ? Number(item.actualAmount) 
        : Number(item.estimatedAmount) || 0);
    }
    return sum;
  }, 0);
  const totalIncomePending = Math.max(0, totalIncomeEstimated - totalIncomeReceived);

  // 2. Fixed Bills Calculations
  const totalBillsEstimated = bills.reduce((sum, item) => sum + (Number(item.estimatedAmount) || 0), 0);
  const totalBillsPaid = bills.reduce((sum, item) => {
    if (item.status === 'pagado') {
      return sum + (item.actualAmount !== undefined && item.actualAmount !== null && item.actualAmount > 0 
        ? Number(item.actualAmount) 
        : Number(item.estimatedAmount) || 0);
    }
    return sum;
  }, 0);
  const totalBillsPending = bills.reduce((sum, item) => {
    if (item.status !== 'pagado') {
      return sum + (Number(item.estimatedAmount) || 0);
    }
    return sum;
  }, 0);

  // 3. Extra Expenses Calculations
  const totalExtraExpensesEstimated = extraExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalExtraExpensesPaid = extraExpenses.reduce((sum, item) => {
    if (item.isPaid) {
      return sum + (Number(item.amount) || 0);
    }
    return sum;
  }, 0);
  const totalExtraExpensesPending = extraExpenses.reduce((sum, item) => {
    if (!item.isPaid) {
      return sum + (Number(item.amount) || 0);
    }
    return sum;
  }, 0);

  // 4. Combined Balances
  // Subtotal remaining after fixed bills: Total Ingresos - Gastos Fijos
  const remainingAfterFixedBills = totalIncomeEstimated - totalBillsEstimated;

  // Total All Expenses: Gastos Fijos + Gastos Adicionales
  const totalAllExpenses = totalBillsEstimated + totalExtraExpensesEstimated;

  // Final Estimated Balance (Saldo Estimado Disponible): Total Ingresos - Gastos Fijos - Gastos Adicionales
  const finalEstimatedBalance = totalIncomeEstimated - totalBillsEstimated - totalExtraExpensesEstimated;

  // Real Cash In Hand Balance: Ingresos Recibidos - Gastos Fijos Pagados - Gastos Extras Pagados
  const realCashInHand = totalIncomeReceived - totalBillsPaid - totalExtraExpensesPaid;

  // Percentages of Income
  const fixedBillsPercentage = totalIncomeEstimated > 0 ? Math.round((totalBillsEstimated / totalIncomeEstimated) * 100) : 0;
  const extraExpensesPercentage = totalIncomeEstimated > 0 ? Math.round((totalExtraExpensesEstimated / totalIncomeEstimated) * 100) : 0;
  const savingsPercentage = totalIncomeEstimated > 0 ? Math.max(0, Math.round((finalEstimatedBalance / totalIncomeEstimated) * 100)) : 0;

  // Robust classification of Q1 vs Q2
  const isItemQ1 = (item: MonthlyIncomeItem) => {
    if (item.source === 'quincena_1') return true;
    if (item.source === 'quincena_2') return false;
    const nameLower = (item.name || '').toLowerCase();
    if (nameLower.includes('primera quincena') || nameLower.includes('1ra quincena') || nameLower.includes('1era quincena') || nameLower.includes('q1')) return true;
    if (nameLower.includes('segunda quincena') || nameLower.includes('2da quincena') || nameLower.includes('2era quincena') || nameLower.includes('q2')) return false;
    return (item.dayOfMonth || 15) <= 15;
  };

  const isBillQ1 = (item: MonthlyBillItem) => {
    return (item.dueDay || 10) <= 15;
  };

  const isExtraQ1 = (item: MonthlyExtraExpenseItem) => {
    if (item.assignedQuincena === 'quincena_1') return true;
    if (item.assignedQuincena === 'quincena_2') return false;
    return (item.dayOfMonth || 10) <= 15;
  };

  const q1IncomesList = incomes.filter(isItemQ1);
  const q2IncomesList = incomes.filter(i => !isItemQ1(i));

  const q1BillsList = bills.filter(isBillQ1);
  const q2BillsList = bills.filter(b => !isBillQ1(b));

  const q1ExtrasList = extraExpenses.filter(isExtraQ1);
  const q2ExtrasList = extraExpenses.filter(e => !isExtraQ1(e));

  // Q1 Calculations
  const q1IncomesEstimated = q1IncomesList.reduce((sum, item) => sum + (Number(item.estimatedAmount) || 0), 0);
  const q1IncomesReceived = q1IncomesList.reduce((sum, item) => {
    if (item.isReceived) {
      return sum + (item.actualAmount !== undefined && item.actualAmount !== null && item.actualAmount > 0 
        ? Number(item.actualAmount) 
        : Number(item.estimatedAmount) || 0);
    }
    return sum;
  }, 0);
  const q1IncomesPending = Math.max(0, q1IncomesEstimated - q1IncomesReceived);

  const q1BillsEstimated = q1BillsList.reduce((sum, item) => sum + (Number(item.estimatedAmount) || 0), 0);
  const q1BillsPaid = q1BillsList.reduce((sum, item) => {
    if (item.status === 'pagado') {
      return sum + (item.actualAmount !== undefined && item.actualAmount !== null && item.actualAmount > 0 
        ? Number(item.actualAmount) 
        : Number(item.estimatedAmount) || 0);
    }
    return sum;
  }, 0);
  const q1BillsPending = q1BillsList.reduce((sum, item) => {
    if (item.status !== 'pagado') return sum + (Number(item.estimatedAmount) || 0);
    return sum;
  }, 0);

  const q1ExtrasEstimated = q1ExtrasList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const q1ExtrasPaid = q1ExtrasList.reduce((sum, item) => item.isPaid ? sum + (Number(item.amount) || 0) : sum, 0);
  const q1ExtrasPending = q1ExtrasList.reduce((sum, item) => !item.isPaid ? sum + (Number(item.amount) || 0) : sum, 0);

  const q1RemainingAfterFixed = q1IncomesEstimated - q1BillsEstimated;
  const q1FinalEstimatedBalance = q1IncomesEstimated - q1BillsEstimated - q1ExtrasEstimated;
  const q1RealCashInHand = q1IncomesReceived - q1BillsPaid - q1ExtrasPaid;

  const q1FixedPercentage = q1IncomesEstimated > 0 ? Math.round((q1BillsEstimated / q1IncomesEstimated) * 100) : 0;
  const q1ExtrasPercentage = q1IncomesEstimated > 0 ? Math.round((q1ExtrasEstimated / q1IncomesEstimated) * 100) : 0;
  const q1SavingsPercentage = q1IncomesEstimated > 0 ? Math.max(0, Math.round((q1FinalEstimatedBalance / q1IncomesEstimated) * 100)) : 0;

  // Q2 Calculations (with carry-over surplus from Q1)
  const q2IncomesEstimated = q2IncomesList.reduce((sum, item) => sum + (Number(item.estimatedAmount) || 0), 0);
  const q2IncomesReceived = q2IncomesList.reduce((sum, item) => {
    if (item.isReceived) {
      return sum + (item.actualAmount !== undefined && item.actualAmount !== null && item.actualAmount > 0 
        ? Number(item.actualAmount) 
        : Number(item.estimatedAmount) || 0);
    }
    return sum;
  }, 0);
  const q2IncomesPending = Math.max(0, q2IncomesEstimated - q2IncomesReceived);

  const q2BillsEstimated = q2BillsList.reduce((sum, item) => sum + (Number(item.estimatedAmount) || 0), 0);
  const q2BillsPaid = q2BillsList.reduce((sum, item) => {
    if (item.status === 'pagado') {
      return sum + (item.actualAmount !== undefined && item.actualAmount !== null && item.actualAmount > 0 
        ? Number(item.actualAmount) 
        : Number(item.estimatedAmount) || 0);
    }
    return sum;
  }, 0);
  const q2BillsPending = q2BillsList.reduce((sum, item) => {
    if (item.status !== 'pagado') return sum + (Number(item.estimatedAmount) || 0);
    return sum;
  }, 0);

  const q2ExtrasEstimated = q2ExtrasList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const q2ExtrasPaid = q2ExtrasList.reduce((sum, item) => item.isPaid ? sum + (Number(item.amount) || 0) : sum, 0);
  const q2ExtrasPending = q2ExtrasList.reduce((sum, item) => !item.isPaid ? sum + (Number(item.amount) || 0) : sum, 0);

  const carriedOverFromQ1 = q1FinalEstimatedBalance;
  const carriedOverFromQ1Real = q1RealCashInHand;

  const q2TotalAvailableBudget = q2IncomesEstimated + carriedOverFromQ1;
  const q2RealAvailableBudget = q2IncomesReceived + carriedOverFromQ1Real;

  const q2RemainingAfterFixed = q2TotalAvailableBudget - q2BillsEstimated;
  const q2FinalEstimatedBalance = q2TotalAvailableBudget - q2BillsEstimated - q2ExtrasEstimated;
  const q2RealCashInHand = q2RealAvailableBudget - q2BillsPaid - q2ExtrasPaid;

  const q2BaseForPercentages = q2TotalAvailableBudget > 0 ? q2TotalAvailableBudget : (q2IncomesEstimated || 1);
  const q2FixedPercentage = Math.round((q2BillsEstimated / q2BaseForPercentages) * 100);
  const q2ExtrasPercentage = Math.round((q2ExtrasEstimated / q2BaseForPercentages) * 100);
  const q2SavingsPercentage = Math.max(0, Math.round((q2FinalEstimatedBalance / q2BaseForPercentages) * 100));

  // 5. Bank Balance Reconciliation Calculations
  const parseNumericBankBalance = (str: string): number | null => {
    if (!str || str.trim() === '') return null;
    const clean = str.replace(/[^\d.-]/g, '');
    const val = parseFloat(clean);
    return isNaN(val) ? null : val;
  };

  const numericBankBalance = parseNumericBankBalance(realBankBalanceInput);
  
  let targetAppBalance = reconciliationBase === 'real' ? realCashInHand : finalEstimatedBalance;
  if (reconciliationPeriod === 'q1') {
    targetAppBalance = reconciliationBase === 'real' ? q1RealCashInHand : q1FinalEstimatedBalance;
  } else if (reconciliationPeriod === 'q2') {
    targetAppBalance = reconciliationBase === 'real' ? q2RealCashInHand : q2FinalEstimatedBalance;
  }

  // Difference: Bank Balance - App Tracking Balance
  const difference = numericBankBalance !== null ? (numericBankBalance - targetAppBalance) : null;
  const isExactMatch = difference !== null && Math.abs(difference) < 1;

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      
      {/* VIEW SELECTOR TOOLBAR (Separar Q1 y Q2 o Ver Consolidado) */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDark
            ? 'bg-gradient-to-r from-[#0c1524] via-[#101c30] to-[#0c1524] border-slate-800'
            : 'bg-gradient-to-r from-slate-50 via-white to-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-md">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Resumen Ejecutivo por Quincenas
              </h2>
              {monthName && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold font-mono bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
                  {monthName} {currentYearNum}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Los ingresos y gastos de la Q2 están separados y no alteran los resultados parciales de la Q1.
            </p>
          </div>
        </div>

        {/* Mode Selector Buttons */}
        <div
          className={`p-1 rounded-2xl border flex flex-wrap items-center gap-1 ${
            isDark ? 'bg-[#0b1220] border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={() => handleViewModeChange('both')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              viewMode === 'both'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>📑 Ambas Quincenas (Q1 / Q2)</span>
          </button>
          <button
            type="button"
            onClick={() => handleViewModeChange('q1')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              viewMode === 'q1'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>🟢 Solo Q1 (1-15)</span>
          </button>
          <button
            type="button"
            onClick={() => handleViewModeChange('q2')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              viewMode === 'q2'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/25'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>🔵 Solo Q2 (16-31)</span>
          </button>
          <button
            type="button"
            onClick={() => handleViewModeChange('consolidated')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              viewMode === 'consolidated'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>🌐 Total Mes</span>
          </button>
        </div>
      </div>

      {/* 🟢 QUINCENA 1 CARD (ARRIBA) */}
      {(viewMode === 'both' || viewMode === 'q1') && (
        <ExecutiveQuincenaCard
          quincenaKey="q1"
          title="Resumen Ejecutivo — Primera Quincena"
          badge="Q1 (Días 1 - 15)"
          subtitle="Control exclusivo de la 1ra quincena. Los ingresos y facturas de la 2da quincena no alteran estos números."
          themeColor="emerald"
          isDark={isDark}
          incomesList={q1IncomesList}
          billsList={q1BillsList}
          extrasList={q1ExtrasList}
          incomesEstimated={q1IncomesEstimated}
          incomesReceived={q1IncomesReceived}
          incomesPending={q1IncomesPending}
          billsEstimated={q1BillsEstimated}
          billsPaid={q1BillsPaid}
          billsPending={q1BillsPending}
          extrasEstimated={q1ExtrasEstimated}
          extrasPaid={q1ExtrasPaid}
          extrasPending={q1ExtrasPending}
          remainingAfterFixed={q1RemainingAfterFixed}
          finalEstimatedBalance={q1FinalEstimatedBalance}
          realCashInHand={q1RealCashInHand}
          savingsPercentage={q1SavingsPercentage}
          fixedPercentage={q1FixedPercentage}
          extrasPercentage={q1ExtrasPercentage}
          formatCOP={formatCOP}
          onSelectTab={onSelectTab}
        />
      )}

      {/* Visual Transfer Connector between Q1 and Q2 */}
      {viewMode === 'both' && (
        <div className="flex items-center justify-center my-1">
          <div
            className={`px-4 py-2 rounded-2xl border text-xs font-mono font-bold flex items-center space-x-2 shadow-sm ${
              isDark
                ? 'bg-[#0f172a] border-emerald-500/30 text-emerald-300'
                : 'bg-white border-emerald-300 text-emerald-800'
            }`}
          >
            <span>⬇️ Traspaso: Saldo Resultante Q1 ({formatCOP(q1FinalEstimatedBalance)})</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span>Pasa a favor de la Segunda Quincena (Q2)</span>
          </div>
        </div>
      )}

      {/* 🔵 QUINCENA 2 CARD (ABAJO) */}
      {(viewMode === 'both' || viewMode === 'q2') && (
        <ExecutiveQuincenaCard
          quincenaKey="q2"
          title="Resumen Ejecutivo — Segunda Quincena"
          badge="Q2 (Días 16 - 31)"
          subtitle="Control exclusivo de la 2da quincena con ingresos propios más el remanente transferido de la Q1."
          themeColor="cyan"
          isDark={isDark}
          incomesList={q2IncomesList}
          billsList={q2BillsList}
          extrasList={q2ExtrasList}
          incomesEstimated={q2IncomesEstimated}
          incomesReceived={q2IncomesReceived}
          incomesPending={q2IncomesPending}
          billsEstimated={q2BillsEstimated}
          billsPaid={q2BillsPaid}
          billsPending={q2BillsPending}
          extrasEstimated={q2ExtrasEstimated}
          extrasPaid={q2ExtrasPaid}
          extrasPending={q2ExtrasPending}
          remainingAfterFixed={q2RemainingAfterFixed}
          finalEstimatedBalance={q2FinalEstimatedBalance}
          realCashInHand={q2RealCashInHand}
          savingsPercentage={q2SavingsPercentage}
          fixedPercentage={q2FixedPercentage}
          extrasPercentage={q2ExtrasPercentage}
          carriedFromPreviousQ={q1FinalEstimatedBalance}
          carriedFromPreviousQReal={q1RealCashInHand}
          formatCOP={formatCOP}
          onSelectTab={onSelectTab}
        />
      )}

      {/* 🌐 CONSOLIDATED GLOBAL MONTH SUMMARY */}
      {(viewMode === 'both' || viewMode === 'consolidated') && (
        <div className="space-y-6 pt-2">
          <div className="flex items-center space-x-2 border-t pt-4 border-slate-200 dark:border-slate-800">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              🌐 Consolidado Global de Todo el Mes (Q1 + Q2)
            </h3>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              Visión unificada de ingresos, facturas fijas y gastos extras del mes completo
            </span>
          </div>

      {/* 1. TOP 4 EXECUTIVE KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Ingresos */}
        <div 
          onClick={() => onSelectTab && onSelectTab('ingresos')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden group shadow-lg ${
            isDark 
              ? 'bg-gradient-to-br from-[#0c1f1f] to-[#122b2b] border-emerald-500/40 hover:border-emerald-400 hover:shadow-emerald-500/10' 
              : 'bg-gradient-to-br from-emerald-50/90 to-teal-50/70 border-emerald-300 hover:border-emerald-400 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                1. Total Ingresos
              </span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold">
              {incomes.length} fuentes
            </span>
          </div>
          
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300 tracking-tight">
            {formatCOP(totalIncomeEstimated)}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-emerald-500/20">
            <span className="text-emerald-700/80 dark:text-emerald-400/80 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Recibido: <strong>{formatCOP(totalIncomeReceived)}</strong></span>
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              Pendiente: {formatCOP(totalIncomePending)}
            </span>
          </div>
        </div>

        {/* Card 2: Total Gastos Fijos */}
        <div 
          onClick={() => onSelectTab && onSelectTab('fijos')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden group shadow-lg ${
            isDark 
              ? 'bg-gradient-to-br from-[#1e172e] to-[#2a1e42] border-purple-500/40 hover:border-purple-400 hover:shadow-purple-500/10' 
              : 'bg-gradient-to-br from-purple-50/90 to-indigo-50/70 border-purple-300 hover:border-purple-400 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                2. Gastos Fijos
              </span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold">
              {bills.length} facturas
            </span>
          </div>
          
          <div className="text-2xl sm:text-3xl font-black text-purple-700 dark:text-purple-300 tracking-tight">
            -{formatCOP(totalBillsEstimated)}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-purple-500/20">
            <span className="text-purple-700/80 dark:text-purple-400/80 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pagado: <strong>{formatCOP(totalBillsPaid)}</strong></span>
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              Por pagar: {formatCOP(totalBillsPending)}
            </span>
          </div>
        </div>

        {/* Card 3: Total Gastos Adicionales */}
        <div 
          onClick={() => onSelectTab && onSelectTab('extras')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden group shadow-lg ${
            isDark 
              ? 'bg-gradient-to-br from-[#24171e] to-[#361c28] border-pink-500/40 hover:border-pink-400 hover:shadow-pink-500/10' 
              : 'bg-gradient-to-br from-pink-50/90 to-rose-50/70 border-pink-300 hover:border-pink-400 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">
                3. Gastos Extras
              </span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-600 dark:text-pink-300 font-bold">
              {extraExpenses.length} items
            </span>
          </div>
          
          <div className="text-2xl sm:text-3xl font-black text-pink-700 dark:text-pink-300 tracking-tight">
            -{formatCOP(totalExtraExpensesEstimated)}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-pink-500/20">
            <span className="text-pink-700/80 dark:text-pink-400/80 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pagado: <strong>{formatCOP(totalExtraExpensesPaid)}</strong></span>
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              Pendiente: {formatCOP(totalExtraExpensesPending)}
            </span>
          </div>
        </div>

        {/* Card 4: Saldo Estimado Restante (Final) */}
        <div 
          className={`p-5 rounded-3xl border transition-all relative overflow-hidden shadow-xl ${
            finalEstimatedBalance >= 0
              ? isDark
                ? 'bg-gradient-to-br from-[#0e272a] via-[#113833] to-[#0a2322] border-cyan-400/60 shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                : 'bg-gradient-to-br from-cyan-100 via-teal-50 to-emerald-100 border-cyan-400 text-slate-900 shadow-cyan-500/10 ring-1 ring-cyan-400/40'
              : isDark
                ? 'bg-gradient-to-br from-[#2a1313] to-[#3d1a1a] border-rose-500/60 shadow-rose-500/10'
                : 'bg-gradient-to-br from-rose-100 to-red-50 border-rose-400 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold ${
                finalEstimatedBalance >= 0 
                  ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-400' 
                  : 'bg-rose-500/20 border border-rose-400/50 text-rose-400'
              }`}>
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                4. Saldo Estimado
              </span>
            </div>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-black ${
              finalEstimatedBalance >= 0
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30'
            }`}>
              {finalEstimatedBalance >= 0 ? '✓ Superávit' : '⚠️ Déficit'}
            </span>
          </div>
          
          <div className={`text-2xl sm:text-3xl font-black tracking-tight ${
            finalEstimatedBalance >= 0 
              ? 'text-cyan-800 dark:text-cyan-200' 
              : 'text-rose-700 dark:text-rose-300'
          }`}>
            {formatCOP(finalEstimatedBalance)}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-cyan-500/20">
            <span className="text-cyan-700/80 dark:text-cyan-300/80 flex items-center space-x-1">
              <PiggyBank className="w-3.5 h-3.5" />
              <span>Ahorro: <strong>{savingsPercentage}%</strong></span>
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              Caja Real: {formatCOP(realCashInHand)}
            </span>
          </div>
        </div>

      </div>

      {/* 2. THE MATHEMATICAL BREAKDOWN FORMULA BANNER */}
      <div className={`p-5 rounded-3xl border shadow-xl relative overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-r from-[#121c33] via-[#10172a] to-[#151f38] border-[#2e3e68]' 
          : 'bg-gradient-to-r from-slate-50 via-white to-sky-50 border-slate-200'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Step-by-step formula */}
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className={`text-sm font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Fórmula de Balance del Mes
              </h3>
            </div>

            {/* Visual Formula Chain */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              
              {/* Total Incomes */}
              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center space-x-1.5">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Total Ingresos:</span>
                <strong className="text-xs font-bold text-emerald-700 dark:text-emerald-300 font-mono">{formatCOP(totalIncomeEstimated)}</strong>
              </div>

              <span className="text-sm font-black text-slate-400 dark:text-slate-500">−</span>

              {/* Fixed Bills */}
              <div className="px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center space-x-1.5">
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">Gastos Fijos:</span>
                <strong className="text-xs font-bold text-purple-700 dark:text-purple-300 font-mono">{formatCOP(totalBillsEstimated)}</strong>
              </div>

              <span className="text-sm font-black text-slate-400 dark:text-slate-500">=</span>

              {/* Subtotal after fixed */}
              <div className="px-3 py-1.5 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center space-x-1.5">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Queda tras Fijos:</span>
                <strong className="text-xs font-bold text-blue-700 dark:text-blue-300 font-mono">{formatCOP(remainingAfterFixedBills)}</strong>
              </div>

              <span className="text-sm font-black text-slate-400 dark:text-slate-500">−</span>

              {/* Extra Expenses */}
              <div className="px-3 py-1.5 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center space-x-1.5">
                <span className="text-xs font-semibold text-pink-700 dark:text-pink-400">Gastos Extras:</span>
                <strong className="text-xs font-bold text-pink-700 dark:text-pink-300 font-mono">{formatCOP(totalExtraExpensesEstimated)}</strong>
              </div>

              <span className="text-sm font-black text-slate-400 dark:text-slate-500">=</span>

              {/* Final Saldo */}
              <div className={`px-3.5 py-1.5 rounded-xl border flex items-center space-x-1.5 shadow-md ${
                finalEstimatedBalance >= 0
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-800 dark:text-cyan-200'
                  : 'bg-rose-500/25 border-rose-400 text-rose-800 dark:text-rose-200'
              }`}>
                <span className="text-xs font-black">Saldo Disponible:</span>
                <strong className="text-xs font-black font-mono text-cyan-900 dark:text-cyan-100">{formatCOP(finalEstimatedBalance)}</strong>
              </div>

            </div>
          </div>

          {/* Quick Action to view by Quincena */}
          <div 
            onClick={() => onSelectTab && onSelectTab('quincenas')}
            role="button"
            tabIndex={0}
            className={`p-3 rounded-2xl border text-xs space-y-1.5 shrink-0 cursor-pointer transition-all hover:scale-[1.02] ${
              isDark ? 'bg-[#0e1628] border-cyan-800/50 hover:border-cyan-400' : 'bg-white border-cyan-200 shadow-xs hover:border-cyan-500'
            }`}
          >
            <div className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>Módulos por Quincena:</span>
              </span>
              <span className="text-[10px] text-cyan-500 underline font-semibold">Ver vista completa →</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="px-2.5 py-1 rounded-xl bg-slate-500/10 border border-slate-500/20">
                <span className="text-slate-400 block text-[10px]">1ra Quincena (1-15)</span>
                <span className={`font-bold ${q1FinalEstimatedBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {formatCOP(q1FinalEstimatedBalance)}
                </span>
              </div>
              <div className="px-2.5 py-1 rounded-xl bg-slate-500/10 border border-slate-500/20">
                <span className="text-slate-400 block text-[10px]">2da Quincena (16-31)</span>
                <span className={`font-bold ${q2FinalEstimatedBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {formatCOP(q2FinalEstimatedBalance)}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Income Allocation Progress Bar (50/30/20 Rule) */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Distribución del 100% de Ingresos del Mes:
            </span>
            <div className="flex items-center space-x-4 text-xs font-bold font-mono">
              <span className="text-purple-600 dark:text-purple-400 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>Fijos: {fixedBillsPercentage}%</span>
              </span>
              <span className="text-pink-600 dark:text-pink-400 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                <span>Extras: {extraExpensesPercentage}%</span>
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Ahorro / Libre: {savingsPercentage}%</span>
              </span>
            </div>
          </div>

          {/* Multi-segment bar */}
          <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex shadow-inner">
            <div 
              style={{ width: `${Math.min(100, fixedBillsPercentage)}%` }} 
              className="bg-purple-500 h-full transition-all duration-500" 
              title={`Gastos Fijos: ${fixedBillsPercentage}%`}
            />
            <div 
              style={{ width: `${Math.min(100 - fixedBillsPercentage, extraExpensesPercentage)}%` }} 
              className="bg-pink-500 h-full transition-all duration-500" 
              title={`Gastos Extras: ${extraExpensesPercentage}%`}
            />
            <div 
              style={{ width: `${Math.min(100, savingsPercentage)}%` }} 
              className="bg-emerald-400 h-full transition-all duration-500" 
              title={`Ahorro / Superávit: ${savingsPercentage}%`}
            />
          </div>
        </div>

        {/* Debts & Loans Summary Quick Banner */}
        {debts.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  💳 Control de Deudas & Préstamos ({debts.filter(d => d.status === 'activa').length} Activas)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Saldo pendiente total: {formatCOP(debts.reduce((s, d) => s + (Number(d.remainingAmount) || 0), 0))} • Cuota mensual total: {formatCOP(debts.filter(d => d.status === 'activa').reduce((s, d) => s + (Number(d.monthlyPayment) || 0), 0))}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectTab && onSelectTab('deudas')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-all cursor-pointer flex items-center space-x-1.5 shrink-0"
            >
              <span>Ver Amortización & Cuotas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 3. CONSOLIDATED EXECUTIVE TABLE SUMMARY */}
      <div className={`rounded-3xl border shadow-xl overflow-hidden ${
        isDark ? 'bg-[#0f172a] border-[#1e2f4f]' : 'bg-white border-slate-200'
      }`}>
        <div className={`p-4 border-b flex items-center justify-between ${
          isDark ? 'bg-[#15223c] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Tabla Resumen de Control Financiero Mensual
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Haz clic en cualquier sección para ver su tabla con checklist
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b font-mono uppercase tracking-wider text-[11px] ${
                isDark ? 'bg-[#111c33] text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                <th className="py-3 px-4">Concepto Principal</th>
                <th className="py-3 px-3 text-center">Registros</th>
                <th className="py-3 px-3 text-right">Monto Estimado</th>
                <th className="py-3 px-3 text-right">Monto Real / Ejecutado</th>
                <th className="py-3 px-3 text-right">Pendiente</th>
                <th className="py-3 px-3 text-center">Estado / Progreso</th>
                <th className="py-3 px-4 text-center">Ver Tabla</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
              
              {/* Row 1: Ingresos */}
              <tr className={`transition-colors ${isDark ? 'hover:bg-[#152037]' : 'hover:bg-slate-50'}`}>
                <td className="py-3 px-4 font-bold flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>1. Ingresos Totales del Mes</span>
                </td>
                <td className="py-3 px-3 text-center font-mono">{incomes.length} fuentes</td>
                <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  +{formatCOP(totalIncomeEstimated)}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-300">
                  +{formatCOP(totalIncomeReceived)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-400">
                  {formatCOP(totalIncomePending)}
                </td>
                <td className="py-3 px-3 text-center">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                    {incomes.filter(i => i.isReceived).length} de {incomes.length} cobrados
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => onSelectTab && onSelectTab('ingresos')}
                    className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 cursor-pointer"
                  >
                    Ver Tabla Checklist →
                  </button>
                </td>
              </tr>

              {/* Row 2: Gastos Fijos */}
              <tr className={`transition-colors ${isDark ? 'hover:bg-[#152037]' : 'hover:bg-slate-50'}`}>
                <td className="py-3 px-4 font-bold flex items-center space-x-2 text-purple-600 dark:text-purple-400">
                  <CreditCard className="w-4 h-4" />
                  <span>2. Gastos Fijos (Servicios & Facturas)</span>
                </td>
                <td className="py-3 px-3 text-center font-mono">{bills.length} facturas</td>
                <td className="py-3 px-3 text-right font-mono font-bold text-purple-600 dark:text-purple-400">
                  -{formatCOP(totalBillsEstimated)}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-purple-600 dark:text-purple-300">
                  -{formatCOP(totalBillsPaid)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-400">
                  {formatCOP(totalBillsPending)}
                </td>
                <td className="py-3 px-3 text-center">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30">
                    {bills.filter(b => b.status === 'pagado').length} de {bills.length} pagadas
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => onSelectTab && onSelectTab('fijos')}
                    className="px-3 py-1 rounded-xl text-xs font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-600 dark:text-purple-300 border border-purple-500/30 cursor-pointer"
                  >
                    Ver Tabla Checklist →
                  </button>
                </td>
              </tr>

              {/* Subtotal Row */}
              <tr className={`font-semibold ${isDark ? 'bg-[#121c30] text-blue-300' : 'bg-blue-50/70 text-blue-900'}`}>
                <td className="py-2.5 px-4 font-mono font-bold" colSpan={2}>
                  = Subtotal Restante (Ingresos − Gastos Fijos)
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-black">
                  {formatCOP(remainingAfterFixedBills)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-black">
                  {formatCOP(totalIncomeReceived - totalBillsPaid)}
                </td>
                <td colSpan={3} className="py-2.5 px-4 text-xs font-sans text-slate-400 italic">
                  Margen operativo asegurado tras cubrir gastos fijos
                </td>
              </tr>

              {/* Row 3: Gastos Adicionales */}
              <tr className={`transition-colors ${isDark ? 'hover:bg-[#152037]' : 'hover:bg-slate-50'}`}>
                <td className="py-3 px-4 font-bold flex items-center space-x-2 text-pink-600 dark:text-pink-400">
                  <ShoppingBag className="w-4 h-4" />
                  <span>3. Gastos Extras & Imprevistos</span>
                </td>
                <td className="py-3 px-3 text-center font-mono">{extraExpenses.length} items</td>
                <td className="py-3 px-3 text-right font-mono font-bold text-pink-600 dark:text-pink-400">
                  -{formatCOP(totalExtraExpensesEstimated)}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-pink-600 dark:text-pink-300">
                  -{formatCOP(totalExtraExpensesPaid)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-400">
                  {formatCOP(totalExtraExpensesPending)}
                </td>
                <td className="py-3 px-3 text-center">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-600 dark:text-pink-300 border border-pink-500/30">
                    {extraExpenses.filter(e => e.isPaid).length} de {extraExpenses.length} pagados
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => onSelectTab && onSelectTab('extras')}
                    className="px-3 py-1 rounded-xl text-xs font-bold bg-pink-500/20 hover:bg-pink-500/30 text-pink-600 dark:text-pink-300 border border-pink-500/30 cursor-pointer"
                  >
                    Ver Tabla Checklist →
                  </button>
                </td>
              </tr>

            </tbody>
            {/* Grand Total Row */}
            <tfoot>
              {/* Row 4: Saldo de Seguimiento en App */}
              <tr className={`border-t font-black font-mono text-sm ${
                finalEstimatedBalance >= 0
                  ? isDark ? 'bg-[#0f2824] text-cyan-200 border-cyan-500/40' : 'bg-cyan-100 text-cyan-950 border-cyan-300'
                  : isDark ? 'bg-[#2b1414] text-rose-200 border-rose-500/40' : 'bg-rose-100 text-rose-950 border-rose-300'
              }`}>
                <td colSpan={2} className="py-3.5 px-4 uppercase tracking-wider text-xs">
                  4. Saldo de Seguimiento en App:
                </td>
                <td className="py-3.5 px-3 text-right text-sm font-black text-cyan-500 dark:text-cyan-300">
                  {formatCOP(finalEstimatedBalance)}
                  <span className="text-[10px] font-normal block text-slate-400 font-sans">Proyectado Fin Mes</span>
                </td>
                <td className="py-3.5 px-3 text-right text-base font-black text-emerald-600 dark:text-emerald-400">
                  {formatCOP(realCashInHand)}
                  <span className="text-[10px] font-normal block text-slate-400 font-sans">Ejecutado Actual</span>
                </td>
                <td colSpan={3} className="py-3.5 px-4 text-left font-sans text-xs">
                  <span className="font-bold">
                    {finalEstimatedBalance >= 0 ? '✓ Superávit Disponible para Ahorro / Inversión' : '⚠️ Déficit Presupuestario'}
                  </span>
                  <span className="block text-[11px] text-slate-400 font-normal">
                    Saldo calculado según cobros recibidos menos gastos pagados
                  </span>
                </td>
              </tr>

              {/* Row 5: SALDO REAL EN BANCO & DIFERENCIA DE CONCILIACIÓN */}
              <tr className={`border-t-2 font-mono text-xs ${
                isDark 
                  ? 'bg-[#141d33] border-indigo-500/40 text-slate-200' 
                  : 'bg-indigo-50/90 border-indigo-200 text-slate-900'
              }`}>
                <td colSpan={2} className="py-3.5 px-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-black uppercase tracking-wider text-xs text-indigo-600 dark:text-indigo-400 block">
                        5. Saldo Real en Banco (Extracto Actual)
                      </span>
                      <span className="text-[11px] font-sans text-slate-400 block">
                        Ingresa lo que ves hoy al entrar a tu cuenta bancaria
                      </span>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-right font-sans">
                  <span className="text-[10px] text-slate-400 block font-mono">Meta en App:</span>
                  <span className="font-bold text-xs font-mono text-slate-700 dark:text-slate-300">
                    {formatCOP(targetAppBalance)}
                  </span>
                </td>
                <td className="py-3.5 px-3 text-right">
                  <div className="flex flex-col items-end gap-1">
                    <div className="inline-flex items-center space-x-1">
                      <span className="font-mono text-slate-400 text-xs">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={realBankBalanceInput}
                        onChange={(e) => handleBankBalanceChange(e.target.value)}
                        placeholder="Ej: 4000000"
                        className={`w-28 sm:w-32 px-2 py-1 rounded-xl border text-right font-mono font-bold text-xs outline-none transition-all ${
                          isDark 
                            ? 'bg-[#0f172a] border-indigo-500/50 text-indigo-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20' 
                            : 'bg-white border-indigo-300 text-indigo-950 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                        }`}
                      />
                    </div>
                    {numericBankBalance !== null && (
                      <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                        {formatCOP(numericBankBalance)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3.5 px-3 text-right">
                  {difference !== null ? (
                    <div className="flex flex-col items-end">
                      <span className={`font-mono font-black text-xs sm:text-sm ${
                        isExactMatch 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : difference < 0 
                            ? 'text-amber-600 dark:text-amber-400' 
                            : 'text-cyan-600 dark:text-cyan-400'
                      }`}>
                        {difference > 0 ? `+${formatCOP(difference)}` : formatCOP(difference)}
                      </span>
                      <span className={`text-[10px] font-bold ${
                        isExactMatch 
                          ? 'text-emerald-500' 
                          : difference < 0 
                            ? 'text-amber-500' 
                            : 'text-cyan-500'
                      }`}>
                        {isExactMatch ? '✓ Exacto' : difference < 0 ? 'Faltan en banco' : 'Sobran en banco'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 font-mono text-xs">---</span>
                  )}
                </td>
                <td className="py-3.5 px-3 text-center font-sans">
                  {difference === null ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">
                      Pendiente ingresar
                    </span>
                  ) : isExactMatch ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>100% Cuadrado</span>
                    </span>
                  ) : difference < 0 ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>Faltan {formatCOP(Math.abs(difference))}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                      <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span>Sobran {formatCOP(difference)}</span>
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <a
                    href="#conciliador-banco"
                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 inline-flex items-center space-x-1 transition-colors cursor-pointer"
                  >
                    <span>Buscar Descuadre ↓</span>
                  </a>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )}

      {/* 4. DEDICATED BANK RECONCILIATION & DIFFERENCE HUNTER PANEL */}
      <div 
        id="conciliador-banco"
        className={`p-5 sm:p-6 rounded-3xl border shadow-xl space-y-6 ${
          isDark 
            ? 'bg-gradient-to-br from-[#0e172a] via-[#121c35] to-[#151a2e] border-indigo-500/30' 
            : 'bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/70 border-indigo-200'
        }`}
      >
        {/* Header with Mode Toggle and Last Update */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Conciliador Bancario & Búsqueda de Descuadre
                </h3>
                {monthName && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
                    {monthName} {currentYearNum}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Compara en vivo lo que ves en tu banco contra el seguimiento de la app para localizar cualquier descuadre.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Period selector */}
            <div className={`p-1 rounded-2xl border flex items-center space-x-1 ${
              isDark ? 'bg-[#0b1220] border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setReconciliationPeriod('q1')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  reconciliationPeriod === 'q1'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                🟢 Quincena 1
              </button>
              <button
                type="button"
                onClick={() => setReconciliationPeriod('q2')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  reconciliationPeriod === 'q2'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                🔵 Quincena 2
              </button>
              <button
                type="button"
                onClick={() => setReconciliationPeriod('month')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  reconciliationPeriod === 'month'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                🌐 Mes
              </button>
            </div>

            {/* Base comparison toggle */}
            <div className={`p-1 rounded-2xl border flex items-center space-x-1 ${
              isDark ? 'bg-[#0b1220] border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setReconciliationBase('real')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  reconciliationBase === 'real'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Saldo Ejecutado ({formatCOP(
                  reconciliationPeriod === 'q1' 
                    ? q1RealCashInHand 
                    : reconciliationPeriod === 'q2' 
                      ? q2RealCashInHand 
                      : realCashInHand
                )})
              </button>
              <button
                type="button"
                onClick={() => setReconciliationBase('estimated')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  reconciliationBase === 'estimated'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Proyectado ({formatCOP(
                  reconciliationPeriod === 'q1' 
                    ? q1FinalEstimatedBalance 
                    : reconciliationPeriod === 'q2' 
                      ? q2FinalEstimatedBalance 
                      : finalEstimatedBalance
                )})
              </button>
            </div>

            {lastReconciledDate && (
              <span className="text-[11px] font-mono text-slate-400 px-2 py-1 bg-slate-500/10 rounded-xl">
                Verificado: {lastReconciledDate}
              </span>
            )}
          </div>
        </div>

        {/* 3 Interactive Metric Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Box 1: Saldo de Seguimiento en App */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${
            isDark ? 'bg-[#111a30] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Saldo de Seguimiento en App
              </span>
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {formatCOP(targetAppBalance)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              {reconciliationBase === 'real' ? (
                <>
                  Lo que debería haber según tus ingresos ya cobrados (<span className="font-bold text-emerald-600 dark:text-emerald-400">+{formatCOP(totalIncomeReceived)}</span>) menos gastos ya pagados (<span className="font-bold text-rose-500">-{formatCOP(totalBillsPaid + totalExtraExpensesPaid)}</span>).
                </>
              ) : (
                <>
                  Saldo neto que deberías tener al terminar el mes tras cobrar todos los ingresos estimados y pagar todos los gastos previstos.
                </>
              )}
            </p>
          </div>

          {/* Box 2: Saldo Real en Banco (Editable) */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${
            isDark ? 'bg-[#111a30] border-indigo-500/40' : 'bg-white border-indigo-300'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                2. Saldo Real en Banco
              </span>
              <Landmark className="w-4 h-4 text-indigo-400" />
            </div>
            
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-black text-slate-400 text-sm">
                $
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={realBankBalanceInput}
                onChange={(e) => handleBankBalanceChange(e.target.value)}
                placeholder="0"
                className={`w-full pl-7 pr-3 py-2 rounded-xl border font-mono font-black text-xl outline-none transition-all ${
                  isDark 
                    ? 'bg-[#0c1324] border-indigo-500/60 text-indigo-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20' 
                    : 'bg-indigo-50/40 border-indigo-300 text-indigo-950 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                }`}
              />
            </div>

            {/* Quick shortcuts */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              <button
                type="button"
                onClick={() => handleBankBalanceChange(String(Math.round(targetAppBalance)))}
                className="px-2 py-1 rounded-lg text-[11px] font-bold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 cursor-pointer"
                title="Copiar saldo de la app al banco"
              >
                Copiar Saldo App ({formatCOP(targetAppBalance)})
              </button>
              <button
                type="button"
                onClick={() => {
                  const current = numericBankBalance || 0;
                  handleBankBalanceChange(String(current + 100000));
                }}
                className="px-2 py-1 rounded-lg text-[11px] font-mono font-semibold bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                +100K
              </button>
              <button
                type="button"
                onClick={() => {
                  const current = numericBankBalance || 0;
                  handleBankBalanceChange(String(current + 500000));
                }}
                className="px-2 py-1 rounded-lg text-[11px] font-mono font-semibold bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                +500K
              </button>
              {realBankBalanceInput && (
                <button
                  type="button"
                  onClick={() => handleBankBalanceChange('')}
                  className="px-2 py-1 rounded-lg text-[11px] font-bold text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Box 3: Diferencia de Cuadre */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${
            difference === null
              ? isDark ? 'bg-[#111a30] border-slate-800' : 'bg-white border-slate-200'
              : isExactMatch
                ? isDark ? 'bg-[#0c241d] border-emerald-500/50' : 'bg-emerald-50 border-emerald-300'
                : difference < 0
                  ? isDark ? 'bg-[#2b1912] border-amber-500/50' : 'bg-amber-50 border-amber-300'
                  : isDark ? 'bg-[#102330] border-cyan-500/50' : 'bg-cyan-50 border-cyan-300'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                3. Diferencia con tu Banco
              </span>
              {difference === null ? (
                <HelpCircle className="w-4 h-4 text-slate-400" />
              ) : isExactMatch ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : difference < 0 ? (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              ) : (
                <Sparkles className="w-4 h-4 text-cyan-400" />
              )}
            </div>

            <p className={`text-2xl font-black font-mono ${
              difference === null
                ? 'text-slate-400'
                : isExactMatch
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : difference < 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-cyan-600 dark:text-cyan-400'
            }`}>
              {difference === null 
                ? '---' 
                : difference > 0 
                  ? `+${formatCOP(difference)}` 
                  : formatCOP(difference)}
            </p>

            <div className="mt-2">
              {difference === null ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ingresa tu saldo del banco en el campo #2 para ver si tienes faltante o sobrante.
                </p>
              ) : isExactMatch ? (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Cuadratura Perfecta! Diferencia $0</span>
                </span>
              ) : difference < 0 ? (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Faltan {formatCOP(Math.abs(difference))} en el Banco</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Sobran {formatCOP(difference)} en el Banco</span>
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Diagnostic Guide & Direct Search Actions */}
        {difference !== null && !isExactMatch && (
          <div className={`p-5 rounded-2xl border space-y-4 ${
            difference < 0
              ? isDark ? 'bg-[#1a1412] border-amber-500/40' : 'bg-amber-50/70 border-amber-200'
              : isDark ? 'bg-[#101b26] border-cyan-500/40' : 'bg-cyan-50/70 border-cyan-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Search className={`w-5 h-5 ${difference < 0 ? 'text-amber-400' : 'text-cyan-400'}`} />
                <h4 className={`text-sm font-black ${
                  difference < 0 
                    ? 'text-amber-800 dark:text-amber-300' 
                    : 'text-cyan-800 dark:text-cyan-300'
                }`}>
                  {difference < 0 
                    ? `¿Dónde buscar los ${formatCOP(Math.abs(difference))} que faltan en tu banco?`
                    : `¿Dónde buscar los +${formatCOP(difference)} que sobran en tu banco?`
                  }
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowDifferenceTips(!showDifferenceTips)}
                className="text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {showDifferenceTips ? 'Ocultar Guía' : 'Mostrar Guía'}
              </button>
            </div>

            {showDifferenceTips && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {difference < 0 
                    ? `El banco tiene menos dinero del que calculaste (${formatCOP(Math.abs(difference))} de diferencia negativa). Revisa estos puntos clave para encontrar dónde se fue ese dinero y cuadrarlo:`
                    : `El banco tiene más dinero del que calculaste (+${formatCOP(difference)} a favor). Revisa estos puntos para identificar qué dinero entró o qué pago aún no se debita:`
                  }
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  
                  {/* Option 1: Gastos Extras */}
                  <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                    isDark ? 'bg-[#151c29] border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div>
                      <div className="flex items-center space-x-2 text-pink-500 font-bold text-xs mb-1">
                        <ShoppingBag className="w-4 h-4" />
                        <span>1. Gastos Extras / Tarjeta</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {difference < 0 
                          ? '¿Hiciste compras con débito, salidas a comer, retiros de cajero o pedidos que olvidaste anotar?' 
                          : '¿Anotaste un gasto extra estimado que al final no compraste o te reembolsaron?'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectTab && onSelectTab('extras')}
                      className="mt-3 w-full py-1.5 rounded-lg text-xs font-bold bg-pink-500/20 hover:bg-pink-500/30 text-pink-600 dark:text-pink-300 border border-pink-500/30 flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                    >
                      <span>Revisar Gastos Extras</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Option 2: Facturas Fijas */}
                  <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                    isDark ? 'bg-[#151c29] border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div>
                      <div className="flex items-center space-x-2 text-purple-500 font-bold text-xs mb-1">
                        <CreditCard className="w-4 h-4" />
                        <span>2. Facturas Fijas</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {difference < 0 
                          ? '¿El débito automático cobró una factura que aún figura como "Pendiente" en la app?' 
                          : '¿Marcaste una factura como "Pagada" pero el banco aún no la descuenta de tu saldo disponible?'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectTab && onSelectTab('fijos')}
                      className="mt-3 w-full py-1.5 rounded-lg text-xs font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-600 dark:text-purple-300 border border-purple-500/30 flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                    >
                      <span>Revisar Facturas Fijas</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Option 3: Ingresos */}
                  <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                    isDark ? 'bg-[#151c29] border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div>
                      <div className="flex items-center space-x-2 text-emerald-500 font-bold text-xs mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>3. Ingresos & Cobros</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {difference < 0 
                          ? '¿Marcaste como "Cobrado" algún pago o sueldo que en tu banco todavía no se ha reflejado?' 
                          : '¿Recibiste una transferencia, abono o consignación que olvidaste registrar en ingresos?'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectTab && onSelectTab('ingresos')}
                      className="mt-3 w-full py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                    >
                      <span>Revisar Ingresos</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                </div>

                {difference < 0 && (
                  <div className="pt-2 text-[11px] text-slate-400 flex items-center space-x-2">
                    <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      💡 Recuerda también revisar en tu extracto los costos bancarios: cuotas de manejo, transferencias interbancarias o el impuesto del 4x1000.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Perfect Match Celebratory State */}
        {isExactMatch && (
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
            isDark ? 'bg-[#092b1f] border-emerald-500/40 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black">
                  ¡Conciliación 100% Exitosa! Saldo en Banco = Saldo en App
                </p>
                <p className="text-xs opacity-85">
                  Los {formatCOP(targetAppBalance)} de tu banco coinciden exactamente con los registros de LifeBlocks. Cada centavo está perfectamente justificado.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-500 text-slate-950 shrink-0">
              Diferencia: $0 COP
            </span>
          </div>
        )}

      </div>

    </div>
  );
};
