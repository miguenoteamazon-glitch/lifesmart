import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  MonthlyBillItem,
  MonthlyIncomeItem,
  MonthlyExtraExpenseItem,
  DebtItem,
  MonthlyBillCategory,
  MonthlyBillStatus,
  MonthlyExtraExpenseCategory
} from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  PieChart as PieIcon,
  Layers,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  AlertTriangle,
  Info,
  ArrowUpRight,
  Check,
  RefreshCw,
  Copy,
  Receipt,
  Tag,
  Clock,
  ShieldCheck,
  Zap,
  ShoppingBag,
  CreditCard
} from 'lucide-react';
import { DailyQuincenaExpenseTracker } from './DailyQuincenaExpenseTracker';

interface BiweeklyBudgetModulesViewProps {
  bills: MonthlyBillItem[];
  incomes: MonthlyIncomeItem[];
  extraExpenses: MonthlyExtraExpenseItem[];
  debts?: DebtItem[];
  selectedMonth: number;
  selectedYear: number;
  onSelectMonth: (month: number) => void;
  onSelectYear: (year: number) => void;
  onAddBill: (bill: Omit<MonthlyBillItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateBill: (bill: MonthlyBillItem) => void;
  onDeleteBill: (billId: string) => void;
  onAddIncome: (income: Omit<MonthlyIncomeItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateIncome: (income: MonthlyIncomeItem) => void;
  onDeleteIncome: (incomeId: string) => void;
  onAddExtraExpense: (extra: Omit<MonthlyExtraExpenseItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateExtraExpense: (extra: MonthlyExtraExpenseItem) => void;
  onDeleteExtraExpense: (extraId: string) => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const CATEGORY_COLORS: Record<string, string> = {
  vivienda: '#8b5cf6', // Violet
  servicios_publicos: '#06b6d4', // Cyan
  hogar_familia: '#10b981', // Emerald
  telecomunicaciones: '#3b82f6', // Blue
  financiero: '#f43f5e', // Rose
  salidas_ocio: '#ec4899', // Pink
  compras_ropa: '#f97316', // Orange
  seguros_salud: '#14b8a6', // Teal
  educacion: '#eab308', // Yellow
  transporte_extra: '#6366f1', // Indigo
  imprevisto_hogar: '#d97706', // Amber
  regalos_celebracion: '#a855f7', // Purple
  salud_farmacia: '#059669', // Dark emerald
  tecnologia_hogar: '#0284c7', // Sky
  mascotas_extra: '#84cc16', // Lime
  suscripciones: '#f43f5e', // Rose
  gastos_diarios: '#f59e0b', // Amber
  otro: '#64748b', // Slate
};

const CATEGORY_LABELS: Record<string, string> = {
  vivienda: 'Vivienda & Arriendo',
  servicios_publicos: 'Servicios Públicos',
  hogar_familia: 'Hogar & Mercado',
  telecomunicaciones: 'Internet & Celular',
  financiero: 'Financiero & Tarjetas',
  salidas_ocio: 'Restaurantes & Salidas',
  compras_ropa: 'Ropa & Compras',
  seguros_salud: 'Salud & Pólizas',
  educacion: 'Educación & Cursos',
  transporte_extra: 'Transporte Extra',
  imprevisto_hogar: 'Imprevistos Hogar',
  regalos_celebracion: 'Regalos & Fiestas',
  salud_farmacia: 'Farmacia & Salud Extra',
  tecnologia_hogar: 'Tecnología & Gadgets',
  mascotas_extra: 'Mascotas',
  suscripciones: 'Streaming & Suscripciones',
  gastos_diarios: 'Gastos Diarios / Bolsillo',
  otro: 'Otros Rubros',
};

export const BiweeklyBudgetModulesView: React.FC<BiweeklyBudgetModulesViewProps> = ({
  bills,
  incomes,
  extraExpenses,
  debts = [],
  selectedMonth,
  selectedYear,
  onSelectMonth,
  onSelectYear,
  onAddBill,
  onUpdateBill,
  onDeleteBill,
  onAddIncome,
  onUpdateIncome,
  onDeleteIncome,
  onAddExtraExpense,
  onUpdateExtraExpense,
  onDeleteExtraExpense
}) => {
  const { isDark } = useTheme();

  // Storage key for month-to-month carried-over balances and closure state
  const currentMonthKey = `lifeflow_closure_${selectedYear}_${selectedMonth}`;
  const prevMonthIdx = selectedMonth === 0 ? 11 : selectedMonth - 1;
  const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
  const prevMonthKey = `lifeflow_closure_${prevYear}_${prevMonthIdx}`;

  // Initial balance brought into Module 1 from previous month
  const [initialCarriedOverQ1, setInitialCarriedOverQ1] = useState<number>(() => {
    try {
      const prevSaved = localStorage.getItem(prevMonthKey);
      if (prevSaved) {
        const parsed = JSON.parse(prevSaved);
        if (typeof parsed.finalBalance === 'number') {
          return parsed.finalBalance;
        }
      }
      const currentSaved = localStorage.getItem(currentMonthKey);
      if (currentSaved) {
        const parsed = JSON.parse(currentSaved);
        if (typeof parsed.initialCarriedOverQ1 === 'number') {
          return parsed.initialCarriedOverQ1;
        }
      }
    } catch (e) {}
    return 0;
  });

  // Month Closure state
  const [isMonthClosed, setIsMonthClosed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(currentMonthKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Boolean(parsed.isClosed);
      }
    } catch (e) {}
    return false;
  });

  // Keep state synced when month/year changes
  useEffect(() => {
    try {
      const currentSaved = localStorage.getItem(currentMonthKey);
      if (currentSaved) {
        const parsed = JSON.parse(currentSaved);
        setIsMonthClosed(Boolean(parsed.isClosed));
        if (typeof parsed.initialCarriedOverQ1 === 'number') {
          setInitialCarriedOverQ1(parsed.initialCarriedOverQ1);
          return;
        }
      } else {
        setIsMonthClosed(false);
      }

      // If no explicit override for this month, check if previous month had a final balance
      const prevSaved = localStorage.getItem(prevMonthKey);
      if (prevSaved) {
        const parsedPrev = JSON.parse(prevSaved);
        if (typeof parsedPrev.finalBalance === 'number') {
          setInitialCarriedOverQ1(parsedPrev.finalBalance);
          return;
        }
      }
      setInitialCarriedOverQ1(0);
    } catch (e) {
      setInitialCarriedOverQ1(0);
      setIsMonthClosed(false);
    }
  }, [selectedMonth, selectedYear, currentMonthKey, prevMonthKey]);

  // AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(() => {
    try {
      const saved = localStorage.getItem(`lifeflow_ai_analysis_${selectedYear}_${selectedMonth}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`lifeflow_ai_analysis_${selectedYear}_${selectedMonth}`);
      if (saved) {
        setAiAnalysis(JSON.parse(saved));
      } else {
        setAiAnalysis(null);
      }
    } catch (e) {
      setAiAnalysis(null);
    }
  }, [selectedMonth, selectedYear]);

  // Quick modals / forms for adding expenses to Q1 or Q2
  const [quickAddModal, setQuickAddModal] = useState<{
    open: boolean;
    module: 1 | 2;
    type: 'fijo' | 'extra' | 'ingreso';
  }>({ open: false, module: 1, type: 'fijo' });

  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDay, setFormDay] = useState(quickAddModal.module === 1 ? 5 : 20);
  const [formCategory, setFormCategory] = useState<string>('servicios_publicos');

  // Edit Real Paid Amount Modal for Fixed Bills
  const [editingRealBill, setEditingRealBill] = useState<MonthlyBillItem | null>(null);
  const [editingRealAmountInput, setEditingRealAmountInput] = useState<string>('');
  const [editingRealStatus, setEditingRealStatus] = useState<MonthlyBillStatus>('pagado');

  const handleOpenRealAmountModal = (bill: MonthlyBillItem) => {
    setEditingRealBill(bill);
    const initialAmount = bill.actualAmount !== undefined && bill.actualAmount !== null
      ? bill.actualAmount
      : bill.estimatedAmount;
    setEditingRealAmountInput(initialAmount ? initialAmount.toString() : '');
    setEditingRealStatus('pagado');
  };

  const handleSaveRealAmountModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRealBill) return;

    const raw = editingRealAmountInput.replace(/[^\d.-]/g, '');
    const num = parseFloat(raw);
    const validAmount = !isNaN(num) && num >= 0 ? num : editingRealBill.estimatedAmount;

    onUpdateBill({
      ...editingRealBill,
      actualAmount: validAmount,
      status: editingRealStatus,
      paidDate: editingRealStatus === 'pagado' ? (editingRealBill.paidDate || new Date().toISOString().split('T')[0]) : undefined,
      updatedAt: new Date().toISOString(),
    });

    setEditingRealBill(null);
  };

  // Open quick add modal with prefilled day
  const handleOpenQuickAdd = (module: 1 | 2, type: 'fijo' | 'extra' | 'ingreso') => {
    setQuickAddModal({ open: true, module, type });
    setFormName('');
    setFormAmount('');
    setFormDay(module === 1 ? 5 : 20);
    setFormCategory(type === 'extra' ? 'salidas_ocio' : 'servicios_publicos');
  };

  const handleSaveQuickItem = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formAmount.replace(/[^\d.-]/g, '')) || 0;
    if (!formName.trim() || amountNum <= 0) return;

    if (quickAddModal.type === 'fijo') {
      onAddBill({
        name: formName.trim(),
        category: formCategory as MonthlyBillCategory,
        estimatedAmount: amountNum,
        actualAmount: amountNum,
        dueDay: Math.min(31, Math.max(1, formDay)),
        status: 'pendiente',
        isRecurring: true,
      });
    } else if (quickAddModal.type === 'extra') {
      onAddExtraExpense({
        name: formName.trim(),
        category: formCategory as MonthlyExtraExpenseCategory,
        amount: amountNum,
        dayOfMonth: Math.min(31, Math.max(1, formDay)),
        assignedQuincena: quickAddModal.module === 1 ? 'quincena_1' : 'quincena_2',
        isPaid: false,
      });
    } else if (quickAddModal.type === 'ingreso') {
      onAddIncome({
        name: formName.trim(),
        earner: 'Principal',
        source: quickAddModal.module === 1 ? 'quincena_1' : 'quincena_2',
        estimatedAmount: amountNum,
        actualAmount: amountNum,
        dayOfMonth: Math.min(31, Math.max(1, formDay)),
        isReceived: true,
      });
    }

    setQuickAddModal({ open: false, module: 1, type: 'fijo' });
  };

  // -------------------------------------------------------------
  // DATA FILTERING FOR MODULE 1 (Q1: Days 1 to 15)
  // -------------------------------------------------------------
  const q1IncomesList = useMemo(() => {
    return incomes.filter(inc => {
      if (inc.source === 'quincena_1') return true;
      if (inc.source === 'quincena_2') return false;
      return (inc.dayOfMonth || 1) <= 15;
    });
  }, [incomes]);

  const q1BillsList = useMemo(() => {
    return [...bills]
      .filter(b => {
        if (b.assignedQuincena === 'quincena_1') return true;
        if (b.assignedQuincena === 'quincena_2') return false;
        return (b.dueDay || 10) <= 15;
      })
      .sort((a, b) => a.dueDay - b.dueDay);
  }, [bills]);

  const q1ExtrasList = useMemo(() => {
    return [...extraExpenses]
      .filter(e => {
        if (e.assignedQuincena === 'quincena_1') return true;
        if (e.assignedQuincena === 'quincena_2') return false;
        return (e.dayOfMonth || 10) <= 15;
      })
      .sort((a, b) => (a.dayOfMonth || 10) - (b.dayOfMonth || 10));
  }, [extraExpenses]);

  // Helper to read daily spent from local storage
  const getQDailySpentFromStorage = (qNum: 1 | 2) => {
    try {
      const saved = localStorage.getItem(`lifeflow_daily_pocket_${selectedYear}_${selectedMonth}_q${qNum}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.dailySpent && typeof parsed.dailySpent === 'object') {
          return (Object.values(parsed.dailySpent) as number[]).reduce((s: number, v: number) => s + (Number(v) || 0), 0);
        }
      }
    } catch (e) {}
    return 0;
  };

  const [q1DailySpent, setQ1DailySpent] = useState<number>(() => getQDailySpentFromStorage(1));
  const [q2DailySpent, setQ2DailySpent] = useState<number>(() => getQDailySpentFromStorage(2));

  useEffect(() => {
    setQ1DailySpent(getQDailySpentFromStorage(1));
    setQ2DailySpent(getQDailySpentFromStorage(2));
  }, [selectedMonth, selectedYear]);

  // Q1 Numeric Calculations
  // Exclude daily pocket placeholder bill if present to avoid double-charging
  const q1FixedBillsBase = q1BillsList.filter(b => b.category !== 'gastos_diarios' && !(b.name || '').toLowerCase().includes('gastos diarios'));
  const q1IncomeEstimated = q1IncomesList.reduce((s, i) => s + (Number(i.estimatedAmount) || 0), 0);
  const q1IncomeReceived = q1IncomesList.reduce((s, i) => s + (i.isReceived ? (Number(i.actualAmount || i.estimatedAmount) || 0) : 0), 0);
  const q1BillsEstimated = q1FixedBillsBase.reduce((s, b) => s + (Number(b.estimatedAmount) || 0), 0);
  const q1BillsPaid = q1FixedBillsBase.reduce((s, b) => s + (b.status === 'pagado' ? (Number(b.actualAmount || b.estimatedAmount) || 0) : 0), 0);
  const q1ExtrasEstimated = q1ExtrasList.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const q1ExtrasPaid = q1ExtrasList.reduce((s, e) => s + (e.isPaid ? (Number(e.amount) || 0) : 0), 0);

  const q1TotalExpenses = q1BillsEstimated + q1ExtrasEstimated;
  const q1TotalExpensesPaid = q1BillsPaid + q1ExtrasPaid;

  // Q1 Surplus Base: Saldo a Favor inicial del Módulo 1 (disponible para el día a día)
  const q1SurplusBase = (q1IncomeEstimated + initialCarriedOverQ1) - q1TotalExpenses;
  const q1SurplusBaseReal = (q1IncomeReceived + initialCarriedOverQ1) - q1TotalExpensesPaid;

  // Q1 Balance Resulting: Saldo a Favor que va quedando tras los gastos del día a día
  const q1BalanceEstimated = q1SurplusBase - q1DailySpent;
  const q1BalanceReal = q1SurplusBaseReal - q1DailySpent;

  // El saldo neto que va quedando de Q1 es lo que se transfiere a la Quincena 2
  const carryOverToModule2 = q1BalanceEstimated;

  // -------------------------------------------------------------
  // DATA FILTERING FOR MODULE 2 (Q2: Days 16 to 31)
  // -------------------------------------------------------------
  const q2IncomesList = useMemo(() => {
    return incomes.filter(inc => {
      if (inc.source === 'quincena_2') return true;
      if (inc.source === 'quincena_1') return false;
      return (inc.dayOfMonth || 15) > 15;
    });
  }, [incomes]);

  const q2BillsList = useMemo(() => {
    return [...bills]
      .filter(b => {
        if (b.assignedQuincena === 'quincena_2') return true;
        if (b.assignedQuincena === 'quincena_1') return false;
        return (b.dueDay || 10) > 15;
      })
      .sort((a, b) => a.dueDay - b.dueDay);
  }, [bills]);

  const q2ExtrasList = useMemo(() => {
    return [...extraExpenses]
      .filter(e => {
        if (e.assignedQuincena === 'quincena_2') return true;
        if (e.assignedQuincena === 'quincena_1') return false;
        return (e.dayOfMonth || 10) > 15;
      })
      .sort((a, b) => (a.dayOfMonth || 10) - (b.dayOfMonth || 10));
  }, [extraExpenses]);

  // Q2 Numeric Calculations
  const q2FixedBillsBase = q2BillsList.filter(b => b.category !== 'gastos_diarios' && !(b.name || '').toLowerCase().includes('gastos diarios'));
  const q2IncomeEstimated = q2IncomesList.reduce((s, i) => s + (Number(i.estimatedAmount) || 0), 0);
  const q2IncomeReceived = q2IncomesList.reduce((s, i) => s + (i.isReceived ? (Number(i.actualAmount || i.estimatedAmount) || 0) : 0), 0);
  const q2BillsEstimated = q2FixedBillsBase.reduce((s, b) => s + (Number(b.estimatedAmount) || 0), 0);
  const q2BillsPaid = q2FixedBillsBase.reduce((s, b) => s + (b.status === 'pagado' ? (Number(b.actualAmount || b.estimatedAmount) || 0) : 0), 0);
  const q2ExtrasEstimated = q2ExtrasList.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const q2ExtrasPaid = q2ExtrasList.reduce((s, e) => s + (e.isPaid ? (Number(e.amount) || 0) : 0), 0);

  const q2TotalExpenses = q2BillsEstimated + q2ExtrasEstimated;
  const q2TotalExpensesPaid = q2BillsPaid + q2ExtrasPaid;

  // MODULE 2 AVAILABLE BUDGET = Q2 Income + Saldo Traído de Q1 (lo que va quedando)
  const q2TotalBudgetAvailable = q2IncomeEstimated + carryOverToModule2;
  const q2RealBudgetAvailable = q2IncomeReceived + q1BalanceReal;

  // Saldo base a favor en Módulo 2 disponible para gastos diarios Q2
  const q2SurplusBase = q2TotalBudgetAvailable - q2TotalExpenses;

  // Q2 Final Balance (Saldo final neto tras gastos diarios Q2)
  const q2FinalBalanceEstimated = q2SurplusBase - q2DailySpent;
  const q2FinalBalanceReal = (q2RealBudgetAvailable - q2TotalExpensesPaid) - q2DailySpent;

  // -------------------------------------------------------------
  // MONTH TOTALS & SPENDING PIE CHART DATA
  // -------------------------------------------------------------
  const totalMonthIncomesEstimated = q1IncomeEstimated + q2IncomeEstimated;
  const totalMonthIncomesReceived = q1IncomeReceived + q2IncomeReceived;
  const totalMonthSpentEstimated = q1TotalExpenses + q1DailySpent + q2TotalExpenses + q2DailySpent;
  const totalMonthSpentPaid = q1TotalExpensesPaid + q1DailySpent + q2TotalExpensesPaid + q2DailySpent;
  const monthNetBalance = totalMonthIncomesEstimated - totalMonthSpentEstimated;
  const monthSavingsRate = totalMonthIncomesEstimated > 0 
    ? Math.max(0, Math.round((monthNetBalance / totalMonthIncomesEstimated) * 100)) 
    : 0;

  // Group all expenses by Category for the Pie Chart ("Torta de Gastos")
  const categoryPieData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};

    // Fixed bills (excluding placeholder daily bills to prevent duplicate counting)
    bills.forEach(b => {
      if (b.category === 'gastos_diarios' || (b.name || '').toLowerCase().includes('gastos diarios')) return;
      const cat = b.category || 'otro';
      const amt = Number(b.actualAmount || b.estimatedAmount) || 0;
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    });

    // Extra expenses
    extraExpenses.forEach(e => {
      const cat = e.category || 'otro';
      const amt = Number(e.amount) || 0;
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    });

    // Daily spent from pocket tracker (Q1 + Q2)
    const totalDailySpent = q1DailySpent + q2DailySpent;
    if (totalDailySpent > 0) {
      categoryTotals['gastos_diarios'] = (categoryTotals['gastos_diarios'] || 0) + totalDailySpent;
    }

    const total = Object.values(categoryTotals).reduce((s, v) => s + v, 0);

    const data = Object.entries(categoryTotals)
      .map(([catKey, amount]) => {
        const percentage = total > 0 ? Math.round((amount / total) * 100) : 0;
        return {
          key: catKey,
          name: CATEGORY_LABELS[catKey] || catKey,
          value: amount,
          percentage,
          color: CATEGORY_COLORS[catKey] || '#64748b'
        };
      })
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);

    return { items: data, totalSum: total };
  }, [bills, extraExpenses]);

  // Top spending category
  const topExpenseCategory = categoryPieData.items.length > 0 ? categoryPieData.items[0] : null;

  // Format COP
  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Month-to-Month Closure Handler
  const handleSaveMonthClosure = () => {
    try {
      const closureData = {
        isClosed: true,
        closedAt: new Date().toISOString(),
        finalBalance: q2FinalBalanceEstimated,
        initialCarriedOverQ1,
        totalIncomes: totalMonthIncomesEstimated,
        totalExpenses: totalMonthSpentEstimated,
        q1Balance: q1BalanceEstimated,
        q2Balance: q2FinalBalanceEstimated,
        month: selectedMonth,
        year: selectedYear
      };
      localStorage.setItem(currentMonthKey, JSON.stringify(closureData));
      setIsMonthClosed(true);

      // Also pre-seed the next month's initial carryover
      const nextMonthIdx = selectedMonth === 11 ? 0 : selectedMonth + 1;
      const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
      const nextMonthKey = `lifeflow_closure_${nextYear}_${nextMonthIdx}`;
      const existingNext = localStorage.getItem(nextMonthKey);
      let nextData: any = {};
      if (existingNext) {
        try { nextData = JSON.parse(existingNext); } catch (e) {}
      }
      nextData.initialCarriedOverQ1 = q2FinalBalanceEstimated;
      localStorage.setItem(nextMonthKey, JSON.stringify(nextData));

      alert(`✅ ¡Mes de ${MONTH_NAMES[selectedMonth]} ${selectedYear} cerrado con éxito! El saldo final de ${formatCOP(q2FinalBalanceEstimated)} ha sido transferido automáticamente a ${MONTH_NAMES[nextMonthIdx]} ${nextYear}.`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReopenMonth = () => {
    try {
      const saved = localStorage.getItem(currentMonthKey);
      let data: any = {};
      if (saved) {
        data = JSON.parse(saved);
      }
      data.isClosed = false;
      localStorage.setItem(currentMonthKey, JSON.stringify(data));
      setIsMonthClosed(false);
    } catch (e) {}
  };

  // AI Closure Analysis Handler
  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const payload = {
        monthName: `${MONTH_NAMES[selectedMonth]} ${selectedYear}`,
        q1Data: {
          incomes: q1IncomeEstimated,
          bills: q1BillsEstimated,
          extras: q1ExtrasEstimated,
          balance: q1BalanceEstimated,
          carryOver: initialCarriedOverQ1
        },
        q2Data: {
          incomes: q2IncomeEstimated,
          carriedOver: carryOverToModule2,
          availableBudget: q2TotalBudgetAvailable,
          bills: q2BillsEstimated,
          extras: q2ExtrasEstimated,
          balance: q2FinalBalanceEstimated
        },
        totals: {
          totalReceived: totalMonthIncomesReceived || totalMonthIncomesEstimated,
          totalSpent: totalMonthSpentPaid || totalMonthSpentEstimated,
          netBalance: monthNetBalance,
          savingsRate: monthSavingsRate
        },
        categoryBreakdown: categoryPieData.items.map(c => ({
          label: c.name,
          amount: c.value,
          percentage: c.percentage
        })),
        topCategory: topExpenseCategory ? {
          label: topExpenseCategory.name,
          amount: topExpenseCategory.value,
          percentage: topExpenseCategory.percentage
        } : null
      };

      const res = await fetch('/api/gemini/financial-month-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.analysis) {
        setAiAnalysis(data.analysis);
        localStorage.setItem(`lifeflow_ai_analysis_${selectedYear}_${selectedMonth}`, JSON.stringify(data.analysis));
      } else {
        throw new Error(data.error || 'Generando informe calculado');
      }
    } catch (err) {
      console.warn('Notice running AI financial analysis, activating calculated analysis:', err);
      // Client-side fallback to guarantee the user always receives their complete report
      const net = monthNetBalance;
      const rate = monthSavingsRate;
      const fallbackReport = {
        rating: net > 0 ? (rate >= 20 ? 'Excelente' : 'Bueno') : 'Por Mejorar',
        score: Math.min(98, Math.max(35, 60 + Math.round(rate * 0.8))),
        executiveSummary: `Mes de ${MONTH_NAMES[selectedMonth]} culminado con un balance neto de ${formatCOP(net)} y tasa de ahorro del ${rate}%.`,
        q1Analysis: `Módulo 1 (días 1 al 15) cerró con un balance de ${formatCOP(q1BalanceEstimated)}. ${q1BalanceEstimated >= 0 ? 'Transfirió superávit positivo hacia el Módulo 2.' : 'Generó presión de saldo sobre la segunda quincena.'}`,
        q2Analysis: `Módulo 2 (días 16 al fin de mes) dispuso de un presupuesto efectivo de ${formatCOP(q2TotalBudgetAvailable)} y cerró con ${formatCOP(q2FinalBalanceEstimated)}.`,
        topExpenseAnalysis: topExpenseCategory ? `El rubro con mayor porcentaje de gasto fue "${topExpenseCategory.name}" con ${formatCOP(topExpenseCategory.value)} (${topExpenseCategory.percentage}% del total gastado).` : 'Gastos distribuidos homogéneamente.',
        recommendations: [
          'Mantener un fondo de maniobra para contingencias equivalente a 1 semana de gastos básicos.',
          q1BalanceEstimated < 0 ? 'Negociar fechas de corte de servicios para trasladar compromisos hacia el Módulo 2.' : 'Destinar el saldo a favor de la primera quincena a una reserva intocable.',
          topExpenseCategory ? `Poner un límite de alerta en el rubro "${topExpenseCategory.name}" para no superar el 25% de los ingresos.` : 'Registrar inmediatamente los gastos hormiga.'
        ],
        nextMonthStrategy: 'Iniciar el próximo periodo sincronizando los vencimientos clave con los días de corte de tus ingresos principales.'
      };
      setAiAnalysis(fallbackReport);
      localStorage.setItem(`lifeflow_ai_analysis_${selectedYear}_${selectedMonth}`, JSON.stringify(fallbackReport));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Navigate months
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      onSelectMonth(11);
      onSelectYear(selectedYear - 1);
    } else {
      onSelectMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      onSelectMonth(0);
      onSelectYear(selectedYear + 1);
    } else {
      onSelectMonth(selectedMonth + 1);
    }
  };

  return (
    <div id="biweekly-budget-container" className="space-y-8">
      
      {/* 1. TOP HEADER & MONTH NAVIGATOR */}
      <div className={`p-5 rounded-3xl border shadow-xl relative overflow-hidden ${
        isDark ? 'bg-[#0f172a] border-[#1e2f4f]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          {/* Title and Purpose */}
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className={`text-lg sm:text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Control de Presupuesto por Quincenas
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  isMonthClosed
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                }`}>
                  {isMonthClosed ? '🔒 Mes Cerrado' : '🟢 Mes en Curso'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Módulo 1 (Días 1-15) y Módulo 2 (Días 16-Fin de Mes) con arrastre de saldo conectado.
              </p>
            </div>
          </div>

          {/* Month Selector & Navigation Controls */}
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              type="button"
              onClick={handlePrevMonth}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDark ? 'bg-[#15223c] hover:bg-[#1d3056] text-slate-200 border-[#2b416e]' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
              title="Mes anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Select month */}
            <select
              value={selectedMonth}
              onChange={(e) => onSelectMonth(Number(e.target.value))}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono border cursor-pointer ${
                isDark ? 'bg-[#0b1222] border-slate-700 text-cyan-300' : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx}>
                  🗓️ {name} {selectedYear}
                </option>
              ))}
            </select>

            {/* Select year */}
            <select
              value={selectedYear}
              onChange={(e) => onSelectYear(Number(e.target.value))}
              className={`px-3 py-2 rounded-xl text-xs font-bold font-mono border cursor-pointer ${
                isDark ? 'bg-[#0b1222] border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              {[2024, 2025, 2026, 2027, 2028].map(yr => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleNextMonth}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDark ? 'bg-[#15223c] hover:bg-[#1d3056] text-slate-200 border-[#2b416e]' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
              title="Mes siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Closure quick toggle */}
            {isMonthClosed ? (
              <button
                type="button"
                onClick={handleReopenMonth}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 cursor-pointer flex items-center space-x-1.5"
                title="Reabrir mes para modificar"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reabrir</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveMonthClosure}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 cursor-pointer flex items-center space-x-1.5"
                title="Cerrar mes y transferir saldo"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cerrar Mes</span>
              </button>
            )}
          </div>

        </div>

        {/* Global Overview Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Ingresos del Mes:</span>
            <span className="font-mono font-bold text-emerald-500 text-sm">
              +{formatCOP(totalMonthIncomesEstimated)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Gastos Totales (Fijos+Extras):</span>
            <span className="font-mono font-bold text-rose-500 text-sm">
              -{formatCOP(totalMonthSpentEstimated)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Saldo Neto Proyectado:</span>
            <span className={`font-mono font-bold text-sm ${monthNetBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {monthNetBalance >= 0 ? '+' : ''}{formatCOP(monthNetBalance)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Tasa de Ahorro:</span>
            <span className="font-mono font-bold text-cyan-400 text-sm">
              {monthSavingsRate}% del Ingreso
            </span>
          </div>
        </div>
      </div>

      {/* 2. MÓDULO 1: 1RA QUINCENA (DÍAS 1 AL 15) */}
      <div className={`p-6 rounded-3xl border shadow-xl relative overflow-hidden transition-all ${
        isDark 
          ? 'bg-gradient-to-b from-[#0e1e2d] to-[#0c1626] border-emerald-500/30' 
          : 'bg-gradient-to-b from-emerald-50/40 to-white border-emerald-300/80 shadow-emerald-500/5'
      }`}>
        
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-emerald-500/20 gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black">
              1
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className={`text-base font-black uppercase tracking-wider ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                  MÓDULO 1: 1RA QUINCENA (Días 1 al 15)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                  Día 1 - 15
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Primer ingreso del mes y pagos asignados a la primera mitad.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleOpenQuickAdd(1, 'fijo')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 cursor-pointer flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Fijo Q1</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenQuickAdd(1, 'extra')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 cursor-pointer flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Extra Q1</span>
            </button>
          </div>
        </div>

        {/* Responsive Grid: Flujos a la izquierda, Tablita de Gastos Diarios al lado */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5">
          {/* Columna Izquierda: Flujos de la 1ra quincena */}
          <div className="lg:col-span-7 space-y-6">
            {/* Section A: Ingresos de la 1ra Quincena & Arrastre anterior */}
            <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className={`font-black uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                1.1 Ingresos Primer Corte (Día 1 - 15)
              </span>
            </div>
            <span className="font-mono font-bold text-emerald-400">
              Total Disponible: {formatCOP(q1IncomeEstimated + initialCarriedOverQ1)}
            </span>
          </div>

          {/* Previous month carryover row if present */}
          <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
            isDark ? 'bg-[#0f172a]/80 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center space-x-2.5">
              <RefreshCw className="w-4 h-4 text-blue-400" />
              <div>
                <span className="font-bold text-slate-200 block">
                  Saldo Inicial del Mes Anterior ({MONTH_NAMES[prevMonthIdx]})
                </span>
                <span className="text-[11px] text-slate-400">
                  Arrastre histórico conectado del cierre anterior
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={initialCarriedOverQ1}
                onChange={(e) => {
                  const val = Number(e.target.value) || 0;
                  setInitialCarriedOverQ1(val);
                }}
                className={`w-32 px-2.5 py-1 text-right rounded-lg font-mono font-bold text-xs border ${
                  initialCarriedOverQ1 >= 0
                    ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
                    : 'text-rose-400 border-rose-500/40 bg-rose-500/10'
                }`}
                title="Puedes editar el saldo inicial traído del mes previo"
              />
            </div>
          </div>

          {/* Q1 Incomes List */}
          {q1IncomesList.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400 bg-slate-800/20 rounded-2xl border border-dashed border-slate-700">
              No hay ingresos asignados a la 1ra quincena. Agrega uno con "+ Ingreso Q1".
            </div>
          ) : (
            <div className="space-y-2">
              {q1IncomesList.map(inc => (
                <div
                  key={inc.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                    isDark ? 'bg-[#0e182b] border-[#1e2f4f]' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => onUpdateIncome({ ...inc, isReceived: !inc.isReceived })}
                      className="cursor-pointer"
                      title={inc.isReceived ? 'Marcado como Recibido' : 'Pendiente de cobro'}
                    >
                      {inc.isReceived ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-500 hover:text-emerald-400" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {inc.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Día {inc.dayOfMonth || 1}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {inc.earner} • {inc.paymentChannel || 'Cuenta Principal'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="font-bold text-emerald-400 block">
                      +{formatCOP(inc.isReceived ? (inc.actualAmount || inc.estimatedAmount) : inc.estimatedAmount)}
                    </span>
                    <span className={`text-[10px] ${inc.isReceived ? 'text-emerald-500 font-bold' : 'text-amber-400'}`}>
                      {inc.isReceived ? 'Cobrado' : 'Esperado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section B: Gastos Fijos de la 1ra Quincena (Días 1-15) */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-purple-400" />
              <span className={`font-black uppercase tracking-wider ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                1.2 Gastos Fijos (Vencimientos Días 1 al 15) ({q1BillsList.length})
              </span>
            </div>
            <span className="font-mono font-bold text-rose-400">
              Total Fijos Q1: -{formatCOP(q1BillsEstimated)}
            </span>
          </div>

          {q1BillsList.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400 bg-slate-800/20 rounded-2xl border border-dashed border-slate-700">
              No hay facturas fijas con vencimiento entre el 1 y el 15.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {q1BillsList.map(bill => (
                <div
                  key={bill.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                    bill.status === 'pagado'
                      ? isDark ? 'bg-[#0f1f22] border-teal-800/50 opacity-90' : 'bg-teal-50 border-teal-200'
                      : isDark ? 'bg-[#0e182b] border-[#1e2f4f]' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => onUpdateBill({
                        ...bill,
                        status: bill.status === 'pagado' ? 'pendiente' : 'pagado',
                        actualAmount: bill.status === 'pagado' ? undefined : (bill.actualAmount || bill.estimatedAmount)
                      })}
                      className="cursor-pointer shrink-0"
                      title={bill.status === 'pagado' ? 'Marcar como pendiente' : 'Marcar como pagado'}
                    >
                      {bill.status === 'pagado' ? (
                        <CheckCircle2 className="w-5 h-5 text-teal-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-500 hover:text-purple-400" />
                      )}
                    </button>
                    <div className="truncate">
                      <div className="flex items-center space-x-1.5">
                        <span className={`font-bold truncate ${bill.status === 'pagado' ? 'line-through text-slate-400' : isDark ? 'text-white' : 'text-slate-900'}`}>
                          {bill.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 shrink-0">
                          Día {bill.dueDay}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateBill({
                              ...bill,
                              assignedQuincena: 'quincena_2',
                              updatedAt: new Date().toISOString(),
                            });
                          }}
                          className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-indigo-500/20 text-indigo-400 hover:bg-amber-600 hover:text-white transition-all cursor-pointer shrink-0"
                          title="Asignada a Q1. Clic para mover a Q2"
                        >
                          Q1 ➔ Q2
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate block">
                        {CATEGORY_LABELS[bill.category] || bill.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => handleOpenRealAmountModal(bill)}
                      className="p-1 rounded-lg border border-transparent hover:border-cyan-500/30 hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                      title="Modificar valor real pagado"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <div 
                      onClick={() => handleOpenRealAmountModal(bill)}
                      className="text-right font-mono cursor-pointer hover:opacity-85"
                      title="Haz clic para modificar el valor real pagado"
                    >
                      <span className={`font-bold block ${bill.status === 'pagado' ? 'text-teal-400' : 'text-rose-400'}`}>
                        {formatCOP(bill.status === 'pagado' ? (bill.actualAmount || bill.estimatedAmount) : bill.estimatedAmount)}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {bill.status === 'pagado' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section C: Gastos Extras de la 1ra Quincena (Días 1-15) */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-pink-400" />
              <span className={`font-black uppercase tracking-wider ${isDark ? 'text-pink-300' : 'text-pink-700'}`}>
                1.3 Gastos Extras & Ocio (Días 1 al 15) ({q1ExtrasList.length})
              </span>
            </div>
            <span className="font-mono font-bold text-pink-400">
              Total Extras Q1: -{formatCOP(q1ExtrasEstimated)}
            </span>
          </div>

          {q1ExtrasList.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {q1ExtrasList.map(extra => (
                <div
                  key={extra.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                    extra.isPaid 
                      ? isDark ? 'bg-pink-950/20 border-pink-900/40' : 'bg-pink-50 border-pink-200' 
                      : isDark ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <button
                      type="button"
                      onClick={() => onUpdateExtraExpense({ ...extra, isPaid: !extra.isPaid })}
                      className="cursor-pointer shrink-0"
                    >
                      {extra.isPaid ? (
                        <CheckCircle2 className="w-4 h-4 text-pink-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500 hover:text-pink-400" />
                      )}
                    </button>
                    <div className="truncate">
                      <span className={`font-semibold truncate block ${extra.isPaid ? 'line-through text-slate-400' : isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {extra.name}
                      </span>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-mono">
                          Día {extra.dayOfMonth || 10}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateExtraExpense({
                              ...extra,
                              assignedQuincena: 'quincena_2',
                              updatedAt: new Date().toISOString(),
                            });
                          }}
                          className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-indigo-500/20 text-indigo-400 hover:bg-amber-600 hover:text-white transition-all cursor-pointer"
                          title="Asignado a Q1. Clic para mover a Q2"
                        >
                          Q1 ➔ Q2
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0 ml-1">
                    <span className="font-mono font-bold text-pink-400 text-xs">
                      {formatCOP(extra.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteExtraExpense(extra.id)}
                      className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Eliminar gasto adicional"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card de Cierre / Saldo Resultante Módulo 1 */}
        <div className={`mt-6 p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
          q1BalanceEstimated >= 0
            ? isDark ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-emerald-100/70 border-emerald-300 text-emerald-900'
            : isDark ? 'bg-rose-500/10 border-rose-500/40 text-rose-300' : 'bg-rose-100/70 border-rose-300 text-rose-900'
        }`}>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-black text-sm uppercase tracking-wide">
                {q1BalanceEstimated >= 0 ? '🟢 Saldo a Favor del Módulo 1' : '🔴 Saldo en Contra del Módulo 1'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase font-mono ${
                q1BalanceEstimated >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                {q1BalanceEstimated >= 0 ? '+ Superávit Q1' : '- Déficit Q1'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                🔗 Vinculado a Gastos Diarios
              </span>
            </div>
            
            {/* Breakdown between initial surplus and daily spent */}
            <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono">
              <span>Saldo Inicial Asignado: <strong className="text-white font-bold">{formatCOP(q1SurplusBase)}</strong></span>
              {q1DailySpent > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-400 font-semibold">Gastado Día a Día: -{formatCOP(q1DailySpent)}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">Saldo que va quedando: {formatCOP(q1BalanceEstimated)}</span>
                </>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-1">
              {q1BalanceEstimated >= 0
                ? 'El remanente que va quedando pasa a favor del Módulo 2 para aumentar tu presupuesto en la segunda quincena.'
                : 'Este déficit se arrastra al Módulo 2 y restará de tu capacidad de gasto en la segunda quincena.'}
            </p>
          </div>

          <div className="text-right font-mono shrink-0">
            <span className="text-xs text-slate-400 block">
              {q1DailySpent > 0 ? 'Saldo que va quedando Q1:' : 'Saldo Resultante Q1:'}
            </span>
            <span className="text-xl font-black">
              {q1BalanceEstimated >= 0 ? '+' : ''}{formatCOP(q1BalanceEstimated)}
            </span>
          </div>
        </div>
          </div>

          {/* Columna Derecha: Tablita al lado de Gastos Diarios (Días 1 al 15) */}
          <div className="lg:col-span-5">
            <DailyQuincenaExpenseTracker
              quincenaNumber={1}
              startDay={1}
              endDay={15}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              bills={bills}
              onAddBill={onAddBill}
              onUpdateBill={onUpdateBill}
              onDeleteBill={onDeleteBill}
              isDark={isDark}
              moduleSurplusBalance={q1SurplusBase}
              onDailySpentChange={(spent) => setQ1DailySpent(spent)}
            />
          </div>
        </div>

      </div>

      {/* 3. VISUAL CONNECTOR BRIDGE (Transferencia de Saldo Q1 -> Q2) */}
      <div className="flex flex-col items-center justify-center my-[-10px] relative z-10">
        <div className={`px-4 py-2 rounded-2xl border shadow-lg flex items-center space-x-2 text-xs font-mono font-bold animate-pulse ${
          carryOverToModule2 >= 0
            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-emerald-500/20'
            : 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-rose-500/20'
        }`}>
          <ArrowDown className="w-4 h-4" />
          <span>
            {carryOverToModule2 >= 0
              ? `Conexión: Saldo a Favor Q1 (+${formatCOP(carryOverToModule2)}) se transfiere al Módulo 2`
              : `Conexión: Saldo en Contra Q1 (-${formatCOP(Math.abs(carryOverToModule2))}) se arrastra al Módulo 2`}
          </span>
          <ArrowDown className="w-4 h-4" />
        </div>
      </div>

      {/* 4. MÓDULO 2: 2DA QUINCENA (DÍAS 16 AL FIN DE MES) */}
      <div className={`p-6 rounded-3xl border shadow-xl relative overflow-hidden transition-all ${
        isDark 
          ? 'bg-gradient-to-b from-[#131b34] to-[#0c1326] border-cyan-500/30' 
          : 'bg-gradient-to-b from-cyan-50/40 to-white border-cyan-300/80 shadow-cyan-500/5'
      }`}>
        
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-cyan-500/20 gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-black">
              2
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className={`text-base font-black uppercase tracking-wider ${isDark ? 'text-cyan-300' : 'text-cyan-800'}`}>
                  MÓDULO 2: 2DA QUINCENA (Días 16 al fin de mes)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono">
                  Día 16 - Fin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Segundo ingreso del mes (corte del día 15), arrastre del Módulo 1 y pagos de fin de mes.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleOpenQuickAdd(2, 'fijo')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 cursor-pointer flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Fijo Q2</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenQuickAdd(2, 'extra')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 cursor-pointer flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Extra Q2</span>
            </button>
          </div>
        </div>

        {/* Responsive Grid: Flujos a la izquierda, Tablita de Gastos Diarios al lado */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5">
          {/* Columna Izquierda: Flujos de la 2da quincena */}
          <div className="lg:col-span-7 space-y-6">
            {/* Section A: Ingreso Q2 + CAMPO DE CONEXIÓN CON MÓDULO 1 */}
            <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span className={`font-black uppercase tracking-wider ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                2.1 Presupuesto Disponible Módulo 2
              </span>
            </div>
            <span className="font-mono font-bold text-cyan-400">
              Total Presupuesto Disponible: {formatCOP(q2TotalBudgetAvailable)}
            </span>
          </div>

          {/* Special Field: Saldo Traído del Módulo 1 */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
            carryOverToModule2 >= 0
              ? isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
              : isDark ? 'bg-rose-500/10 border-rose-500/30' : 'bg-rose-50 border-rose-200'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                carryOverToModule2 >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                {carryOverToModule2 >= 0 ? '+' : '-'}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`font-bold text-xs ${carryOverToModule2 >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {carryOverToModule2 >= 0 ? 'Saldo a Favor del Módulo 1' : 'Saldo en Contra del Módulo 1'}
                  </span>
                  <span className={`px-2 py-0.2 rounded text-[10px] font-mono font-black ${
                    carryOverToModule2 >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {carryOverToModule2 >= 0 ? 'Suma al presupuesto Q2' : 'Resta del presupuesto Q2'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block">
                  Calculado automáticamente desde el resultado de la primera quincena.
                </span>
              </div>
            </div>

            <div className="text-right font-mono font-black text-sm">
              <span className={carryOverToModule2 >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {carryOverToModule2 >= 0 ? '+' : ''}{formatCOP(carryOverToModule2)}
              </span>
            </div>
          </div>

          {/* Q2 Incomes List */}
          {q2IncomesList.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400 bg-slate-800/20 rounded-2xl border border-dashed border-slate-700">
              No hay ingresos registrados en la 2da quincena (corte del día 15). Agrega uno con "+ Ingreso Q2".
            </div>
          ) : (
            <div className="space-y-2">
              {q2IncomesList.map(inc => (
                <div
                  key={inc.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                    isDark ? 'bg-[#0e182b] border-[#1e2f4f]' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => onUpdateIncome({ ...inc, isReceived: !inc.isReceived })}
                      className="cursor-pointer"
                      title={inc.isReceived ? 'Marcado como Recibido' : 'Pendiente de cobro'}
                    >
                      {inc.isReceived ? (
                        <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-500 hover:text-cyan-400" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {inc.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          Día {inc.dayOfMonth || 15}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {inc.earner} • {inc.paymentChannel || 'Cuenta Principal'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="font-bold text-cyan-400 block">
                      +{formatCOP(inc.isReceived ? (inc.actualAmount || inc.estimatedAmount) : inc.estimatedAmount)}
                    </span>
                    <span className={`text-[10px] ${inc.isReceived ? 'text-cyan-500 font-bold' : 'text-amber-400'}`}>
                      {inc.isReceived ? 'Cobrado' : 'Esperado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section B: Gastos Fijos de la 2da Quincena (Días 16-31) */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-purple-400" />
              <span className={`font-black uppercase tracking-wider ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                2.2 Gastos Fijos (Vencimientos Días 16 al 31) ({q2BillsList.length})
              </span>
            </div>
            <span className="font-mono font-bold text-rose-400">
              Total Fijos Q2: -{formatCOP(q2BillsEstimated)}
            </span>
          </div>

          {q2BillsList.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400 bg-slate-800/20 rounded-2xl border border-dashed border-slate-700">
              No hay facturas fijas con vencimiento después del día 15.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {q2BillsList.map(bill => (
                <div
                  key={bill.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                    bill.status === 'pagado'
                      ? isDark ? 'bg-[#0f1f22] border-teal-800/50 opacity-90' : 'bg-teal-50 border-teal-200'
                      : isDark ? 'bg-[#0e182b] border-[#1e2f4f]' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => onUpdateBill({
                        ...bill,
                        status: bill.status === 'pagado' ? 'pendiente' : 'pagado',
                        actualAmount: bill.status === 'pagado' ? undefined : (bill.actualAmount || bill.estimatedAmount)
                      })}
                      className="cursor-pointer shrink-0"
                      title={bill.status === 'pagado' ? 'Marcar como pendiente' : 'Marcar como pagado'}
                    >
                      {bill.status === 'pagado' ? (
                         <CheckCircle2 className="w-5 h-5 text-teal-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-500 hover:text-purple-400" />
                      )}
                    </button>
                    <div className="truncate">
                      <div className="flex items-center space-x-1.5">
                        <span className={`font-bold truncate ${bill.status === 'pagado' ? 'line-through text-slate-400' : isDark ? 'text-white' : 'text-slate-900'}`}>
                          {bill.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 shrink-0">
                          Día {bill.dueDay}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateBill({
                              ...bill,
                              assignedQuincena: 'quincena_1',
                              updatedAt: new Date().toISOString(),
                            });
                          }}
                          className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-amber-500/20 text-amber-400 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer shrink-0"
                          title="Asignada a Q2. Clic para mover a Q1"
                        >
                          Q2 ➔ Q1
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate block">
                        {CATEGORY_LABELS[bill.category] || bill.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => handleOpenRealAmountModal(bill)}
                      className="p-1 rounded-lg border border-transparent hover:border-cyan-500/30 hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                      title="Modificar valor real pagado"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <div 
                      onClick={() => handleOpenRealAmountModal(bill)}
                      className="text-right font-mono cursor-pointer hover:opacity-85"
                      title="Haz clic para modificar el valor real pagado"
                    >
                      <span className={`font-bold block ${bill.status === 'pagado' ? 'text-teal-400' : 'text-rose-400'}`}>
                        {formatCOP(bill.status === 'pagado' ? (bill.actualAmount || bill.estimatedAmount) : bill.estimatedAmount)}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {bill.status === 'pagado' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section C: Gastos Extras de la 2da Quincena (Días 16-31) */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-pink-400" />
              <span className={`font-black uppercase tracking-wider ${isDark ? 'text-pink-300' : 'text-pink-700'}`}>
                2.3 Gastos Extras & Ocio (Días 16 al 31) ({q2ExtrasList.length})
              </span>
            </div>
            <span className="font-mono font-bold text-pink-400">
              Total Extras Q2: -{formatCOP(q2ExtrasEstimated)}
            </span>
          </div>

          {q2ExtrasList.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {q2ExtrasList.map(extra => (
                <div
                  key={extra.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                    extra.isPaid 
                      ? isDark ? 'bg-pink-950/20 border-pink-900/40' : 'bg-pink-50 border-pink-200' 
                      : isDark ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <button
                      type="button"
                      onClick={() => onUpdateExtraExpense({ ...extra, isPaid: !extra.isPaid })}
                      className="cursor-pointer shrink-0"
                    >
                      {extra.isPaid ? (
                        <CheckCircle2 className="w-4 h-4 text-pink-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500 hover:text-pink-400" />
                      )}
                    </button>
                    <div className="truncate">
                      <span className={`font-semibold truncate block ${extra.isPaid ? 'line-through text-slate-400' : isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {extra.name}
                      </span>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-mono">
                          Día {extra.dayOfMonth || 20}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateExtraExpense({
                              ...extra,
                              assignedQuincena: 'quincena_1',
                              updatedAt: new Date().toISOString(),
                            });
                          }}
                          className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-amber-500/20 text-amber-400 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                          title="Asignado a Q2. Clic para mover a Q1"
                        >
                          Q2 ➔ Q1
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0 ml-1">
                    <span className="font-mono font-bold text-pink-400 text-xs">
                      {formatCOP(extra.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteExtraExpense(extra.id)}
                      className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Eliminar gasto adicional"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card de Cierre / Saldo Resultante Módulo 2 (Saldo Final del Mes) */}
        <div className={`mt-6 p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
          q2FinalBalanceEstimated >= 0
            ? isDark ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' : 'bg-cyan-100/70 border-cyan-300 text-cyan-900'
            : isDark ? 'bg-rose-500/10 border-rose-500/40 text-rose-300' : 'bg-rose-100/70 border-rose-300 text-rose-900'
        }`}>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-black text-sm uppercase tracking-wide">
                {q2FinalBalanceEstimated >= 0 ? '🏁 Saldo Final del Mes (Cierre Módulo 2)' : '⚠️ Saldo Deficitario del Mes (Cierre Módulo 2)'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase font-mono ${
                q2FinalBalanceEstimated >= 0 ? 'bg-cyan-500/20 text-cyan-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                {q2FinalBalanceEstimated >= 0 ? 'Superávit Neto' : 'Déficit Neto'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                🔗 Vinculado a Gastos Diarios
              </span>
            </div>

            {/* Breakdown between initial surplus and daily spent */}
            <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono">
              <span>Saldo Inicial Asignado Q2: <strong className="text-white font-bold">{formatCOP(q2SurplusBase)}</strong></span>
              {q2DailySpent > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-400 font-semibold">Gastado Día a Día: -{formatCOP(q2DailySpent)}</span>
                  <span>•</span>
                  <span className="text-cyan-400 font-bold">Saldo que va quedando: {formatCOP(q2FinalBalanceEstimated)}</span>
                </>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-1">
              Resultado final luego de aplicar el remanente de la Q1, los compromisos fijos y los gastos día a día de la Q2.
            </p>
          </div>

          <div className="text-right font-mono shrink-0">
            <span className="text-xs text-slate-400 block">
              {q2DailySpent > 0 ? 'Saldo Final que va quedando:' : 'Saldo Final de Cierre:'}
            </span>
            <span className="text-xl font-black">
              {q2FinalBalanceEstimated >= 0 ? '+' : ''}{formatCOP(q2FinalBalanceEstimated)}
            </span>
          </div>
        </div>
          </div>

          {/* Columna Derecha: Tablita al lado de Gastos Diarios (Días 16 al fin de mes) */}
          <div className="lg:col-span-5">
            <DailyQuincenaExpenseTracker
              quincenaNumber={2}
              startDay={16}
              endDay={new Date(selectedYear, selectedMonth + 1, 0).getDate()}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              bills={bills}
              onAddBill={onAddBill}
              onUpdateBill={onUpdateBill}
              onDeleteBill={onDeleteBill}
              isDark={isDark}
              moduleSurplusBalance={q2SurplusBase}
              onDailySpentChange={(spent) => setQ2DailySpent(spent)}
            />
          </div>
        </div>

      </div>

      {/* 5. SECCIÓN DE CIERRE DE MES, RESUMEN FINANCIERO & TORTA DE GASTOS */}
      <div className={`p-6 rounded-3xl border shadow-xl ${
        isDark ? 'bg-[#0f172a] border-[#1e2f4f]' : 'bg-white border-slate-200'
      }`}>
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black">
              <PieIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Resumen de Cierre de Mes: ¿En Qué Se Fue el Dinero?
              </h3>
              <p className="text-xs text-slate-400">
                Resumen total de ingresos vs gastos, distribución gráfica en torta y análisis inteligente.
              </p>
            </div>
          </div>

          {/* AI Analysis Trigger Button */}
          <button
            type="button"
            onClick={handleRunAiAnalysis}
            disabled={isAnalyzing}
            className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center space-x-2 shadow-lg ${
              isAnalyzing
                ? 'bg-purple-600/50 text-white cursor-wait'
                : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 text-white hover:opacity-95 shadow-purple-500/25 active:scale-95'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analizando con IA...' : '✨ Generar Análisis con IA'}</span>
          </button>
        </div>

        {/* Global Numbers Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#15223c] border-slate-800' : 'bg-emerald-50/70 border-emerald-200'
          }`}>
            <span className="text-xs text-slate-400 font-medium block">Total Recibido / Ingresos</span>
            <span className="text-lg font-mono font-black text-emerald-500 mt-1 block">
              +{formatCOP(totalMonthIncomesReceived || totalMonthIncomesEstimated)}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Q1: {formatCOP(q1IncomeEstimated)} • Q2: {formatCOP(q2IncomeEstimated)}
            </span>
          </div>

          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#15223c] border-slate-800' : 'bg-rose-50/70 border-rose-200'
          }`}>
            <span className="text-xs text-slate-400 font-medium block">Total Gastado (Fijos + Extras)</span>
            <span className="text-lg font-mono font-black text-rose-500 mt-1 block">
              -{formatCOP(totalMonthSpentPaid || totalMonthSpentEstimated)}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Q1: {formatCOP(q1TotalExpenses)} • Q2: {formatCOP(q2TotalExpenses)}
            </span>
          </div>

          <div className={`p-4 rounded-2xl border ${
            monthNetBalance >= 0
              ? isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
              : isDark ? 'bg-rose-500/10 border-rose-500/30' : 'bg-rose-50 border-rose-200'
          }`}>
            <span className="text-xs text-slate-400 font-medium block">Saldo Neto Final del Mes</span>
            <span className={`text-lg font-mono font-black mt-1 block ${monthNetBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {monthNetBalance >= 0 ? '+' : ''}{formatCOP(monthNetBalance)}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Tasa de Ahorro: {monthSavingsRate}%
            </span>
          </div>

        </div>

        {/* 6. LA TORTA DE GASTOS ("En qué fue lo que más se gastó") */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Pie Chart */}
            <div className="w-full md:w-1/2 h-64 sm:h-72 flex flex-col items-center justify-center">
              {categoryPieData.items.length === 0 ? (
                <p className="text-xs text-slate-400 text-center">No hay gastos registrados en este mes para generar la torta.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryPieData.items}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryPieData.items.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatCOP(Number(val)), 'Gasto Total']}
                      contentStyle={{
                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                        borderColor: isDark ? '#334155' : '#cbd5e1',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Ranking Breakdown */}
            <div className="w-full md:w-1/2 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-black uppercase text-slate-400">
                  Ranking de Gastos por Categoría
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Total: {formatCOP(categoryPieData.totalSum)}
                </span>
              </div>

              {topExpenseCategory && (
                <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                  isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <span className="text-base">🏆</span>
                    <div>
                      <span className="text-xs font-black text-amber-400 block">
                        Mayor Gasto del Mes: {topExpenseCategory.name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Representa el {topExpenseCategory.percentage}% de todo lo gastado
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-black text-amber-400">
                    {formatCOP(topExpenseCategory.value)}
                  </span>
                </div>
              )}

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {categoryPieData.items.map((cat, idx) => (
                  <div key={cat.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="font-semibold text-slate-300 truncate max-w-[160px]">
                          {idx + 1}. {cat.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 font-mono">
                        <span className="text-slate-400 text-[11px]">{cat.percentage}%</span>
                        <span className="font-bold text-slate-200">{formatCOP(cat.value)}</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* 7. ANÁLISIS DE INTELIGENCIA ARTIFICIAL (GEMINI) */}
        {aiAnalysis && (
          <div className={`mt-8 p-5 rounded-3xl border shadow-xl animate-in fade-in transition-all ${
            isDark 
              ? 'bg-gradient-to-tr from-[#141b36] via-[#101b33] to-[#1a1c3b] border-indigo-500/30' 
              : 'bg-gradient-to-tr from-indigo-50/80 via-white to-purple-50/80 border-indigo-200'
          }`}>
            
            <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20">
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h4 className={`text-sm font-black uppercase tracking-wider ${isDark ? 'text-indigo-300' : 'text-indigo-900'}`}>
                  Informe de Asesoría Financiera con IA
                </h4>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                  Calificación: {aiAnalysis.rating} ({aiAnalysis.score}/100)
                </span>
              </div>
            </div>

            {/* Executive Summary */}
            <p className="mt-3 text-xs text-slate-300 leading-relaxed font-medium">
              {aiAnalysis.executiveSummary}
            </p>

            {/* Two Modules Evaluation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <div className={`p-3 rounded-2xl border text-xs ${
                isDark ? 'bg-[#0f172a]/70 border-slate-700' : 'bg-white border-slate-200'
              }`}>
                <span className="font-bold text-emerald-400 block mb-1">
                  🌓 Evaluación Módulo 1 (Días 1-15):
                </span>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  {aiAnalysis.q1Analysis}
                </p>
              </div>

              <div className={`p-3 rounded-2xl border text-xs ${
                isDark ? 'bg-[#0f172a]/70 border-slate-700' : 'bg-white border-slate-200'
              }`}>
                <span className="font-bold text-cyan-400 block mb-1">
                  🌓 Evaluación Módulo 2 (Días 16-Fin):
                </span>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  {aiAnalysis.q2Analysis}
                </p>
              </div>
            </div>

            {/* Top expense analysis */}
            {aiAnalysis.topExpenseAnalysis && (
              <div className={`mt-3 p-3 rounded-2xl border text-xs ${
                isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <span className="font-bold block mb-1">
                  🔍 Análisis de la Categoría Mayoritaria:
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {aiAnalysis.topExpenseAnalysis}
                </p>
              </div>
            )}

            {/* Practical Recommendations */}
            {Array.isArray(aiAnalysis.recommendations) && aiAnalysis.recommendations.length > 0 && (
              <div className="mt-4">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2">
                  💡 Recomendaciones Clave para el Próximo Mes:
                </span>
                <div className="space-y-1.5">
                  {aiAnalysis.recommendations.map((rec: string, idx: number) => (
                    <div key={idx} className="flex items-start space-x-2 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span className="text-slate-300">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Month Strategy */}
            {aiAnalysis.nextMonthStrategy && (
              <div className="mt-4 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
                <span className="font-bold text-indigo-300 block mb-0.5">
                  🎯 Estrategia Recomendada para el Mes Siguiente:
                </span>
                <p className="text-slate-300 text-[11px]">
                  {aiAnalysis.nextMonthStrategy}
                </p>
              </div>
            )}

          </div>
        )}

        {/* Closure Button Bar */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-slate-300 block">
              Conexión Mes a Mes:
            </span>
            <p className="text-[11px] text-slate-400">
              Al cerrar este mes, el saldo final de {formatCOP(q2FinalBalanceEstimated)} se convertirá en el saldo inicial del mes siguiente.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveMonthClosure}
            className="px-5 py-2.5 rounded-2xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:opacity-95 shadow-lg shadow-emerald-500/25 cursor-pointer flex items-center space-x-2"
          >
            <Lock className="w-4 h-4" />
            <span>Cerrar Mes {MONTH_NAMES[selectedMonth]} y Trasladar Saldo</span>
          </button>
        </div>

      </div>

      {/* QUICK ADD MODAL */}
      {quickAddModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${
            isDark ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h4 className="text-sm font-black uppercase tracking-wider text-white">
                Agregar {quickAddModal.type === 'fijo' ? 'Gasto Fijo' : quickAddModal.type === 'extra' ? 'Gasto Extra' : 'Ingreso'} a Módulo {quickAddModal.module}
              </h4>
              <button
                type="button"
                onClick={() => setQuickAddModal({ open: false, module: 1, type: 'fijo' })}
                className="text-slate-400 hover:text-white text-xs cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuickItem} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nombre / Concepto:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Factura de Teléfono, Salida a Cenar, etc."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-bold ${
                    isDark ? 'bg-[#15223c] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Valor ($ COP):</label>
                  <input
                    type="number"
                    required
                    placeholder="Ej: 85000"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border font-mono font-bold ${
                      isDark ? 'bg-[#15223c] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">
                    Día del Mes ({quickAddModal.module === 1 ? '1-15' : '16-31'}):
                  </label>
                  <input
                    type="number"
                    min={quickAddModal.module === 1 ? 1 : 16}
                    max={quickAddModal.module === 1 ? 15 : 31}
                    value={formDay}
                    onChange={(e) => setFormDay(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border font-mono font-bold ${
                      isDark ? 'bg-[#15223c] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {quickAddModal.type !== 'ingreso' && (
                <div>
                  <label className="block text-slate-400 mb-1">Categoría:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border font-bold ${
                      isDark ? 'bg-[#15223c] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickAddModal({ open: false, module: 1, type: 'fijo' })}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer"
                >
                  Guardar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ajustar Valor Real Pagado de Factura Fija */}
      {editingRealBill && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${
            isDark ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Modificar Valor Real Pagado
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
                    {editingRealBill.name} • Vence Día {editingRealBill.dueDay}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRealBill(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRealAmountModal} className="mt-4 space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Valor Estimado Presupuestado:</span>
                <span className="font-mono font-bold text-purple-300 text-sm">
                  {formatCOP(editingRealBill.estimatedAmount)}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                    Valor Real Pagado ($ COP) *:
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditingRealAmountInput(editingRealBill.estimatedAmount.toString())}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
                  >
                    Usar estimado ({formatCOP(editingRealBill.estimatedAmount)})
                  </button>
                </div>
                <input
                  type="number"
                  required
                  autoFocus
                  placeholder="Ej: 142500"
                  value={editingRealAmountInput}
                  onChange={(e) => setEditingRealAmountInput(e.target.value)}
                  className={`w-full p-3 rounded-xl border font-mono font-bold text-base ${
                    isDark ? 'bg-[#15223c] border-emerald-500/50 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  }`}
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Ingresa el valor exacto cancelado o debitado de tu cuenta.
                </span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Estado:</label>
                <select
                  value={editingRealStatus}
                  onChange={(e) => setEditingRealStatus(e.target.value as MonthlyBillStatus)}
                  className={`w-full p-2.5 rounded-xl border font-bold ${
                    isDark ? 'bg-[#15223c] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="pagado">✓ Pagado (Registrar este monto real)</option>
                  <option value="pendiente">⏳ Pendiente (Guardar estimado/real para pago futuro)</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingRealBill(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Guardar Valor Real Pagado</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
