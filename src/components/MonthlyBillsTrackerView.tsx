import React, { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  MonthlyBillItem,
  MonthlyBillCategory,
  MonthlyBillStatus,
  MonthlyIncomeItem,
  MonthlyExtraExpenseItem,
  DebtItem,
  DebtPaymentRecord,
  Task
} from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard,
  Plus,
  Trash2,
  Edit3,
  Edit2,
  CheckCircle2,
  Calendar,
  DollarSign,
  AlertCircle,
  Clock,
  Sparkles,
  TrendingUp,
  RotateCcw,
  CheckSquare,
  Copy,
  Search,
  Filter,
  Layers,
  ChevronRight,
  ChevronLeft,
  Receipt,
  Zap,
  Droplet,
  Wifi,
  Phone,
  Home,
  Shield,
  GraduationCap,
  Tv,
  Wallet,
  ShoppingBag,
  HelpCircle,
  ArrowUpRight,
  Info,
  Check,
  Building,
  Heart,
  Cat,
  TrendingDown
} from 'lucide-react';

import { FinancialSummaryDashboard } from './finance/FinancialSummaryDashboard';
import { BiweeklyBudgetModulesView } from './finance/BiweeklyBudgetModulesView';
import { MonthlyIncomesSection } from './finance/MonthlyIncomesSection';
import { MonthlyExtraExpensesSection } from './finance/MonthlyExtraExpensesSection';
import { DebtsTrackerSection } from './finance/DebtsTrackerSection';
import { CashFlowTimeline } from './finance/CashFlowTimeline';

interface MonthlyBillsTrackerViewProps {
  bills: MonthlyBillItem[];
  onAddBill: (bill: Omit<MonthlyBillItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateBill: (bill: MonthlyBillItem) => void;
  onDeleteBill: (billId: string) => void;
  onBatchSetBills?: (bills: MonthlyBillItem[], targetMonthKey?: string) => void;
  onResetBillsData?: () => void;
  onOpenNewTaskModal?: (prefilled?: Partial<Task>) => void;

  // Incomes (support both prop names)
  incomes?: MonthlyIncomeItem[];
  monthlyIncomes?: MonthlyIncomeItem[];
  onAddIncome?: (income: Omit<MonthlyIncomeItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateIncome?: (income: MonthlyIncomeItem) => void;
  onDeleteIncome?: (incomeId: string) => void;
  onBatchSetIncomes?: (incomes: MonthlyIncomeItem[], targetMonthKey?: string) => void;

  // Extra Expenses (support both prop names)
  extraExpenses?: MonthlyExtraExpenseItem[];
  monthlyExtraExpenses?: MonthlyExtraExpenseItem[];
  onAddExtraExpense?: (extra: Omit<MonthlyExtraExpenseItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateExtraExpense?: (extra: MonthlyExtraExpenseItem) => void;
  onDeleteExtraExpense?: (extraId: string) => void;
  onBatchSetExtraExpenses?: (extras: MonthlyExtraExpenseItem[], targetMonthKey?: string) => void;

  // Debts & Loans
  debts?: DebtItem[];
  onAddDebt?: (debt: Omit<DebtItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateDebt?: (debt: DebtItem) => void;
  onDeleteDebt?: (debtId: string) => void;
  onPayDebtInstallment?: (debtId: string, payment: Omit<DebtPaymentRecord, 'id'>) => void;
  onBatchSetDebts?: (debts: DebtItem[]) => void;
}

// Quick presets for the instant fixed bills builder
const QUICK_EXPENSE_PRESETS: { name: string; category: MonthlyBillCategory; defaultDay: number; defaultEstimate: number; icon: string; badge: string }[] = [
  { name: '💧 Agua & Acueducto', category: 'servicios_publicos', defaultDay: 5, defaultEstimate: 85000, icon: 'Droplet', badge: 'Servicios' },
  { name: '⚡ Luz & Energía Eléctrica', category: 'servicios_publicos', defaultDay: 12, defaultEstimate: 140000, icon: 'Zap', badge: 'Servicios' },
  { name: '🔥 Gas Natural Domiciliario', category: 'servicios_publicos', defaultDay: 8, defaultEstimate: 35000, icon: 'Flame', badge: 'Servicios' },
  { name: '🌐 Internet Fibra Óptica', category: 'telecomunicaciones', defaultDay: 15, defaultEstimate: 95000, icon: 'Wifi', badge: 'Telecom' },
  { name: '📱 Teléfono Móvil / Celular', category: 'telecomunicaciones', defaultDay: 18, defaultEstimate: 55000, icon: 'Phone', badge: 'Telecom' },
  { name: '🏠 Arriendo / Hipoteca', category: 'vivienda', defaultDay: 25, defaultEstimate: 1200000, icon: 'Home', badge: 'Vivienda' },
  { name: '🏢 Cuota de Administración', category: 'vivienda', defaultDay: 28, defaultEstimate: 180000, icon: 'Building', badge: 'Vivienda' },
  { name: '📺 Streaming (Netflix / Spotify / Max)', category: 'suscripciones', defaultDay: 20, defaultEstimate: 45000, icon: 'Tv', badge: 'Ocio' },
  { name: '🚗 Seguro de Auto / Póliza / SOAT', category: 'seguros_salud', defaultDay: 30, defaultEstimate: 120000, icon: 'Shield', badge: 'Seguros' },
  { name: '🏥 Medicina Prepagada / Salud', category: 'seguros_salud', defaultDay: 10, defaultEstimate: 210000, icon: 'Heart', badge: 'Salud' },
  { name: '🏫 Colegio / Pensión / Universidad', category: 'educacion', defaultDay: 5, defaultEstimate: 450000, icon: 'GraduationCap', badge: 'Educación' },
  { name: '💳 Tarjeta de Crédito (Pago Mínimo/Total)', category: 'financiero', defaultDay: 17, defaultEstimate: 250000, icon: 'CreditCard', badge: 'Financiero' },
  { name: '🛒 Mercado / Alimentación Mensual', category: 'hogar_familia', defaultDay: 15, defaultEstimate: 600000, icon: 'ShoppingBag', badge: 'Hogar' },
  { name: '🐾 Alimento & Cuidado Mascota', category: 'hogar_familia', defaultDay: 22, defaultEstimate: 80000, icon: 'Cat', badge: 'Mascotas' },
];

const CATEGORY_META: Record<MonthlyBillCategory, { label: string; icon: any; color: string; bg: string; text: string }> = {
  servicios_publicos: { label: 'Servicios Públicos', icon: Droplet, color: '#06b6d4', bg: 'bg-cyan-500/10 border-cyan-500/30', text: 'text-cyan-400' },
  telecomunicaciones: { label: 'Telecomunicaciones', icon: Wifi, color: '#3b82f6', bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400' },
  vivienda: { label: 'Vivienda & Administración', icon: Home, color: '#8b5cf6', bg: 'bg-purple-500/10 border-purple-500/30', text: 'text-purple-400' },
  seguros_salud: { label: 'Seguros & Salud', icon: Shield, color: '#10b981', bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400' },
  educacion: { label: 'Educación & Cursos', icon: GraduationCap, color: '#f59e0b', bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400' },
  suscripciones: { label: 'Suscripciones & Ocio', icon: Tv, color: '#ec4899', bg: 'bg-pink-500/10 border-pink-500/30', text: 'text-pink-400' },
  financiero: { label: 'Financiero & Tarjetas', icon: CreditCard, color: '#ef4444', bg: 'bg-rose-500/10 border-rose-500/30', text: 'text-rose-400' },
  hogar_familia: { label: 'Hogar, Mercado & Familia', icon: ShoppingBag, color: '#14b8a6', bg: 'bg-teal-500/10 border-teal-500/30', text: 'text-teal-400' },
  gastos_diarios: { label: 'Gastos Diarios / Bolsillo', icon: Wallet, color: '#f59e0b', bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400' },
  otro: { label: 'Otros Gastos', icon: HelpCircle, color: '#64748b', bg: 'bg-slate-500/10 border-slate-500/30', text: 'text-slate-400' },
};

const PAYMENT_METHODS = [
  'Transferencia / PSE',
  'Débito Automático',
  'Tarjeta de Crédito',
  'Nequi / Daviplata',
  'Efectivo',
  'Puntos de Pago / Baloto / Efecty',
  'Otro'
];

export const MonthlyBillsTrackerView: React.FC<MonthlyBillsTrackerViewProps> = ({
  bills,
  onAddBill,
  onUpdateBill,
  onDeleteBill,
  onBatchSetBills,
  onResetBillsData,
  onOpenNewTaskModal,
  incomes: propIncomes,
  monthlyIncomes,
  onAddIncome,
  onUpdateIncome,
  onDeleteIncome,
  onBatchSetIncomes,
  extraExpenses: propExtraExpenses,
  monthlyExtraExpenses,
  onAddExtraExpense,
  onUpdateExtraExpense,
  onDeleteExtraExpense,
  onBatchSetExtraExpenses,
  debts,
  onAddDebt,
  onUpdateDebt,
  onDeleteDebt,
  onPayDebtInstallment,
  onBatchSetDebts
}) => {
  const { isDark } = useTheme();

  // Resolved arrays for Incomes, Extra Expenses & Debts
  const effectiveIncomes = monthlyIncomes || propIncomes || [];
  const effectiveExtraExpenses = monthlyExtraExpenses || propExtraExpenses || [];
  const effectiveDebts = debts || [];

  // Main Tab Navigation: 'quincenas' | 'resumen' | 'ingresos' | 'fijos' | 'extras' | 'deudas' | 'flujo'
  const [activeTab, setActiveTab] = useState<'quincenas' | 'resumen' | 'ingresos' | 'fijos' | 'extras' | 'deudas' | 'flujo'>('quincenas');

  // State for Month Selection
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthIdx = today.getMonth();
  const currentDayNum = today.getDate();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Default to September (8) 2026 where the user's active records reside
  const [selectedMonth, setSelectedMonth] = useState<number>(8);
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Derive active month key (e.g., '2026-09', '2026-10')
  const selectedMonthKey = useMemo(() => {
    return `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  }, [selectedYear, selectedMonth]);

  // Distinct list of months that currently have stored data
  const monthsWithData = useMemo(() => {
    const keySet = new Set<string>();
    bills.forEach((b) => keySet.add(b.monthKey || '2026-09'));
    effectiveIncomes.forEach((i) => keySet.add(i.monthKey || '2026-09'));
    effectiveExtraExpenses.forEach((e) => keySet.add(e.monthKey || '2026-09'));
    return Array.from(keySet).sort();
  }, [bills, effectiveIncomes, effectiveExtraExpenses]);

  // Strictly filter lists for the CURRENT selected month
  const currentMonthBills = useMemo(() => {
    return bills.filter((b) => (b.monthKey || '2026-09') === selectedMonthKey);
  }, [bills, selectedMonthKey]);

  const currentMonthIncomes = useMemo(() => {
    return effectiveIncomes.filter((i) => (i.monthKey || '2026-09') === selectedMonthKey);
  }, [effectiveIncomes, selectedMonthKey]);

  const currentMonthExtraExpenses = useMemo(() => {
    return effectiveExtraExpenses.filter((e) => (e.monthKey || '2026-09') === selectedMonthKey);
  }, [effectiveExtraExpenses, selectedMonthKey]);

  // Projection state and helpers
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectSourceMonthKey, setProjectSourceMonthKey] = useState<string>('2026-09');
  const [projectToastMsg, setProjectToastMsg] = useState<string | null>(null);

  // Clone recurring items from a source month into the active month
  const handleProjectMonth = (sourceKey: string = '2026-09') => {
    const sourceBills = bills.filter((b) => (b.monthKey || '2026-09') === sourceKey);
    const sourceIncomes = effectiveIncomes.filter((i) => (i.monthKey || '2026-09') === sourceKey);

    const now = new Date().toISOString();
    const clonedBills: MonthlyBillItem[] = sourceBills.map((b, idx) => ({
      ...b,
      id: `bill-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      monthKey: selectedMonthKey,
      status: 'pendiente',
      actualAmount: undefined,
      paidDate: undefined,
      receiptNumber: undefined,
      createdAt: now,
      updatedAt: now,
    }));

    const clonedIncomes: MonthlyIncomeItem[] = sourceIncomes.map((inc, idx) => ({
      ...inc,
      id: `inc-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      monthKey: selectedMonthKey,
      isReceived: false,
      actualAmount: undefined,
      receivedDate: undefined,
      createdAt: now,
      updatedAt: now,
    }));

    if (onBatchSetBills) {
      onBatchSetBills(clonedBills, selectedMonthKey);
    } else {
      clonedBills.forEach((b) => onAddBill(b));
    }

    if (onBatchSetIncomes) {
      onBatchSetIncomes(clonedIncomes, selectedMonthKey);
    } else if (onAddIncome) {
      clonedIncomes.forEach((i) => onAddIncome(i));
    }

    const [srcY, srcM] = sourceKey.split('-');
    const srcMonthName = monthNames[parseInt(srcM, 10) - 1] || sourceKey;

    setProjectToastMsg(
      `¡Proyección de ${monthNames[selectedMonth]} ${selectedYear} lista! Se copiaron ${clonedBills.length} gastos fijos y ${clonedIncomes.length} fuentes de ingreso desde ${srcMonthName} ${srcY}. Tus datos de ${srcMonthName} permanecen 100% seguros e intactos.`
    );
    setTimeout(() => setProjectToastMsg(null), 7000);
    setIsProjectModalOpen(false);
  };

  // Scoped add / update wrappers that stamp monthKey
  const handleAddBillWithMonth = (billData: Omit<MonthlyBillItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    onAddBill({
      ...billData,
      monthKey: billData.monthKey || selectedMonthKey,
    });
  };

  const handleUpdateBillWithMonth = (billData: MonthlyBillItem) => {
    onUpdateBill({
      ...billData,
      monthKey: billData.monthKey || selectedMonthKey,
    });
  };

  const handleAddIncomeWithMonth = (incomeData: Omit<MonthlyIncomeItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (onAddIncome) {
      onAddIncome({
        ...incomeData,
        monthKey: incomeData.monthKey || selectedMonthKey,
      });
    }
  };

  const handleUpdateIncomeWithMonth = (incomeData: MonthlyIncomeItem) => {
    if (onUpdateIncome) {
      onUpdateIncome({
        ...incomeData,
        monthKey: incomeData.monthKey || selectedMonthKey,
      });
    }
  };

  const handleAddExtraExpenseWithMonth = (extraData: Omit<MonthlyExtraExpenseItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (onAddExtraExpense) {
      onAddExtraExpense({
        ...extraData,
        monthKey: extraData.monthKey || selectedMonthKey,
      });
    }
  };

  const handleUpdateExtraExpenseWithMonth = (extraData: MonthlyExtraExpenseItem) => {
    if (onUpdateExtraExpense) {
      onUpdateExtraExpense({
        ...extraData,
        monthKey: extraData.monthKey || selectedMonthKey,
      });
    }
  };

  const handleBatchSetBillsWithMonth = (newBills: MonthlyBillItem[]) => {
    if (onBatchSetBills) {
      onBatchSetBills(newBills.map((b) => ({ ...b, monthKey: selectedMonthKey })), selectedMonthKey);
    }
  };

  const handleBatchSetIncomesWithMonth = (newIncomes: MonthlyIncomeItem[]) => {
    if (onBatchSetIncomes) {
      onBatchSetIncomes(newIncomes.map((i) => ({ ...i, monthKey: selectedMonthKey })), selectedMonthKey);
    }
  };

  const handleBatchSetExtraExpensesWithMonth = (newExtras: MonthlyExtraExpenseItem[]) => {
    if (onBatchSetExtraExpenses) {
      onBatchSetExtraExpenses(newExtras.map((e) => ({ ...e, monthKey: selectedMonthKey })), selectedMonthKey);
    }
  };

  // Fixed Bills View Mode (tracker vs builder)
  const [billsMode, setBillsMode] = useState<'tracker' | 'builder'>('tracker');

  // Quick builder temporary draft items with local persistence
  const [draftItems, setDraftItems] = useState<{ name: string; category: MonthlyBillCategory; defaultDay: number | string; defaultEstimate: number | string }[]>(() => {
    try {
      if (localStorage.getItem('lifeflow_finances_cleared') === 'true' || localStorage.getItem('lifeflow_bills_cleared') === 'true') {
        return [];
      }
      const savedDraft = localStorage.getItem('lifeflow_builder_draft_items');
      if (savedDraft !== null) {
        const parsed = JSON.parse(savedDraft);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [customDraftInput, setCustomDraftInput] = useState('');
  const [customDraftCategory, setCustomDraftCategory] = useState<MonthlyBillCategory>('servicios_publicos');
  const [generateToastMsg, setGenerateToastMsg] = useState<string | null>(null);

  // Sync draft items to localStorage
  const saveDraftToStorage = (items: typeof draftItems) => {
    try {
      localStorage.setItem('lifeflow_builder_draft_items', JSON.stringify(items));
    } catch (e) {}
  };

  // Fixed Bills Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendiente' | 'pagado' | 'proximo'>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');
  const [quincenaFilter, setQuincenaFilter] = useState<'todas' | 'quincena_1' | 'quincena_2'>('todas');

  // Modal for adding / editing a single fixed bill
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<MonthlyBillItem | null>(null);

  // Form states for bill modal
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<MonthlyBillCategory>('servicios_publicos');
  const [formEstimatedAmount, setFormEstimatedAmount] = useState<string>('');
  const [formActualAmount, setFormActualAmount] = useState<string>('');
  const [formDueDay, setFormDueDay] = useState<number>(10);
  const [formQuincena, setFormQuincena] = useState<'quincena_1' | 'quincena_2'>('quincena_1');
  const [formStatus, setFormStatus] = useState<MonthlyBillStatus>('pendiente');
  const [formPaymentMethod, setFormPaymentMethod] = useState<string>('Transferencia / PSE');
  const [formReceiptNumber, setFormReceiptNumber] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formIsRecurring, setFormIsRecurring] = useState(true);

  // Helper to determine the effective quincena of a fixed bill
  const getBillQuincena = (bill: MonthlyBillItem): 'quincena_1' | 'quincena_2' => {
    if (bill.assignedQuincena === 'quincena_1') return 'quincena_1';
    if (bill.assignedQuincena === 'quincena_2') return 'quincena_2';
    return (Number(bill.dueDay) || 10) <= 15 ? 'quincena_1' : 'quincena_2';
  };

  const handleSetBillQuincena = (bill: MonthlyBillItem, targetQ: 'quincena_1' | 'quincena_2') => {
    onUpdateBill({
      ...bill,
      assignedQuincena: targetQ,
      updatedAt: new Date().toISOString(),
      monthKey: bill.monthKey || selectedMonthKey,
    });
  };

  // Copy notification toast
  const [showCopyToast, setShowCopyToast] = useState(false);

  // SORT ASCENDING STRICTLY BY DUE DAY (1 to 31) - SCOPED TO CURRENT MONTH
  const sortedBills = useMemo(() => {
    return [...currentMonthBills].sort((a, b) => {
      if (a.dueDay !== b.dueDay) {
        return a.dueDay - b.dueDay;
      }
      return a.name.localeCompare(b.name);
    });
  }, [currentMonthBills]);

  // Filtered bills based on search, quincenas & filters - SCOPED TO CURRENT MONTH
  const filteredBills = useMemo(() => {
    return sortedBills.filter(bill => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = bill.name.toLowerCase().includes(q);
        const matchReceipt = (bill.receiptNumber || '').toLowerCase().includes(q);
        const matchNotes = (bill.notes || '').toLowerCase().includes(q);
        if (!matchName && !matchReceipt && !matchNotes) return false;
      }

      if (categoryFilter !== 'todas' && bill.category !== categoryFilter) {
        return false;
      }

      if (quincenaFilter !== 'todas' && getBillQuincena(bill) !== quincenaFilter) {
        return false;
      }

      if (statusFilter === 'pendiente' && bill.status !== 'pendiente') return false;
      if (statusFilter === 'pagado' && bill.status !== 'pagado') return false;
      if (statusFilter === 'proximo') {
        const isUpcoming = bill.status === 'pendiente' && bill.dueDay >= currentDayNum && bill.dueDay <= currentDayNum + 4;
        if (!isUpcoming) return false;
      }

      return true;
    });
  }, [sortedBills, searchQuery, categoryFilter, quincenaFilter, statusFilter, currentDayNum]);

  // Computed Totals for Fixed Bills - SCOPED TO CURRENT MONTH
  const billsTotals = useMemo(() => {
    let estimatedTotal = 0;
    let paidTotal = 0;
    let pendingTotal = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let urgentCount = 0;

    currentMonthBills.forEach(bill => {
      const est = Number(bill.estimatedAmount) || 0;
      const actual = bill.actualAmount !== undefined && bill.actualAmount !== null && bill.actualAmount > 0 
        ? Number(bill.actualAmount) 
        : est;

      estimatedTotal += est;

      if (bill.status === 'pagado') {
        paidTotal += actual;
        paidCount++;
      } else {
        pendingTotal += est;
        pendingCount++;
        if (bill.dueDay < currentDayNum || (bill.dueDay >= currentDayNum && bill.dueDay <= currentDayNum + 3)) {
          urgentCount++;
        }
      }
    });

    const progressPercent = estimatedTotal > 0 ? Math.round((paidTotal / estimatedTotal) * 100) : 0;

    return {
      estimatedTotal,
      paidTotal,
      pendingTotal,
      paidCount,
      pendingCount,
      urgentCount,
      totalCount: currentMonthBills.length,
      progressPercent: Math.min(100, progressPercent),
    };
  }, [currentMonthBills, currentDayNum]);

  // Subtotals & Totals by Quincena (Global from all currentMonthBills)
  const q1AllBills = useMemo(() => currentMonthBills.filter(b => getBillQuincena(b) === 'quincena_1'), [currentMonthBills]);
  const q1TotalEstimated = useMemo(() => q1AllBills.reduce((sum, b) => sum + (Number(b.estimatedAmount) || 0), 0), [q1AllBills]);
  const q1TotalPaid = useMemo(() => q1AllBills.reduce((sum, b) => b.status === 'pagado' ? sum + (Number(b.actualAmount || b.estimatedAmount) || 0) : sum, 0), [q1AllBills]);
  const q1TotalPending = Math.max(0, q1TotalEstimated - q1TotalPaid);
  const q1Count = q1AllBills.length;

  const q2AllBills = useMemo(() => currentMonthBills.filter(b => getBillQuincena(b) === 'quincena_2'), [currentMonthBills]);
  const q2TotalEstimated = useMemo(() => q2AllBills.reduce((sum, b) => sum + (Number(b.estimatedAmount) || 0), 0), [q2AllBills]);
  const q2TotalPaid = useMemo(() => q2AllBills.reduce((sum, b) => b.status === 'pagado' ? sum + (Number(b.actualAmount || b.estimatedAmount) || 0) : sum, 0), [q2AllBills]);
  const q2TotalPending = Math.max(0, q2TotalEstimated - q2TotalPaid);
  const q2Count = q2AllBills.length;

  // Filtered subtotals for the current table view
  const q1FilteredBills = useMemo(() => filteredBills.filter(b => getBillQuincena(b) === 'quincena_1'), [filteredBills]);
  const q1FilteredEstimated = useMemo(() => q1FilteredBills.reduce((sum, b) => sum + (Number(b.estimatedAmount) || 0), 0), [q1FilteredBills]);
  const q1FilteredPaid = useMemo(() => q1FilteredBills.reduce((sum, b) => b.status === 'pagado' ? sum + (Number(b.actualAmount || b.estimatedAmount) || 0) : sum, 0), [q1FilteredBills]);

  const q2FilteredBills = useMemo(() => filteredBills.filter(b => getBillQuincena(b) === 'quincena_2'), [filteredBills]);
  const q2FilteredEstimated = useMemo(() => q2FilteredBills.reduce((sum, b) => sum + (Number(b.estimatedAmount) || 0), 0), [q2FilteredBills]);
  const q2FilteredPaid = useMemo(() => q2FilteredBills.reduce((sum, b) => b.status === 'pagado' ? sum + (Number(b.actualAmount || b.estimatedAmount) || 0) : sum, 0), [q2FilteredBills]);

  const totalFilteredEstimated = useMemo(() => filteredBills.reduce((sum, b) => sum + (Number(b.estimatedAmount) || 0), 0), [filteredBills]);
  const totalFilteredPaid = useMemo(() => filteredBills.reduce((sum, b) => b.status === 'pagado' ? sum + (Number(b.actualAmount || b.estimatedAmount) || 0) : sum, 0), [filteredBills]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handler: Toggle single bill paid status
  // Inline edit of actual amount in bills table
  const [editingActualBillId, setEditingActualBillId] = useState<string | null>(null);
  const [editingActualValue, setEditingActualValue] = useState<string>('');

  const handleSaveActualInline = (bill: MonthlyBillItem) => {
    const raw = editingActualValue.replace(/[^\d.-]/g, '');
    const num = parseFloat(raw);
    if (!isNaN(num) && num >= 0) {
      onUpdateBill({
        ...bill,
        actualAmount: num,
        status: 'pagado',
        paidDate: bill.paidDate || new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString(),
      });
    }
    setEditingActualBillId(null);
  };

  const handleToggleBillStatus = (bill: MonthlyBillItem) => {
    const isPaying = bill.status !== 'pagado';
    const updated: MonthlyBillItem = {
      ...bill,
      status: isPaying ? 'pagado' : 'pendiente',
      actualAmount: isPaying ? (bill.actualAmount || bill.estimatedAmount) : undefined,
      paidDate: isPaying ? new Date().toISOString().split('T')[0] : undefined,
      updatedAt: new Date().toISOString(),
    };
    onUpdateBill(updated);
  };

  // Open Modal for single bill add/edit
  const handleOpenAddBillModal = (preset?: typeof QUICK_EXPENSE_PRESETS[0]) => {
    if (preset) {
      setEditingBill(null);
      setFormName(preset.name);
      setFormCategory(preset.category);
      setFormEstimatedAmount(preset.defaultEstimate.toString());
      setFormActualAmount('');
      setFormDueDay(preset.defaultDay);
      setFormQuincena(preset.defaultDay <= 15 ? 'quincena_1' : 'quincena_2');
      setFormStatus('pendiente');
      setFormPaymentMethod('Transferencia / PSE');
      setFormReceiptNumber('');
      setFormNotes('');
      setFormIsRecurring(true);
    } else {
      setEditingBill(null);
      setFormName('');
      setFormCategory('servicios_publicos');
      setFormEstimatedAmount('');
      setFormActualAmount('');
      setFormDueDay(10);
      setFormQuincena('quincena_1');
      setFormStatus('pendiente');
      setFormPaymentMethod('Transferencia / PSE');
      setFormReceiptNumber('');
      setFormNotes('');
      setFormIsRecurring(true);
    }
    setIsModalOpen(true);
  };

  const handleOpenEditBillModal = (bill: MonthlyBillItem) => {
    setEditingBill(bill);
    setFormName(bill.name);
    setFormCategory(bill.category);
    setFormEstimatedAmount(bill.estimatedAmount ? bill.estimatedAmount.toString() : '');
    setFormActualAmount(bill.actualAmount !== undefined && bill.actualAmount !== null ? bill.actualAmount.toString() : '');
    setFormDueDay(bill.dueDay);
    setFormQuincena(bill.assignedQuincena || (bill.dueDay <= 15 ? 'quincena_1' : 'quincena_2'));
    setFormStatus(bill.status);
    setFormPaymentMethod(bill.paymentMethod || 'Transferencia / PSE');
    setFormReceiptNumber(bill.receiptNumber || '');
    setFormNotes(bill.notes || '');
    setFormIsRecurring(bill.isRecurring !== false);
    setIsModalOpen(true);
  };

  // Save Modal
  const handleSaveBillModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const estimated = parseFloat(formEstimatedAmount) || 0;
    const actual = formActualAmount ? parseFloat(formActualAmount) : (formStatus === 'pagado' ? estimated : undefined);

    if (editingBill) {
      onUpdateBill({
        ...editingBill,
        name: formName.trim(),
        category: formCategory,
        estimatedAmount: estimated,
        actualAmount: actual,
        dueDay: Math.max(1, Math.min(31, Number(formDueDay) || 1)),
        assignedQuincena: formQuincena,
        status: formStatus,
        paymentMethod: formPaymentMethod,
        receiptNumber: formReceiptNumber.trim() || undefined,
        notes: formNotes.trim() || undefined,
        isRecurring: formIsRecurring,
        paidDate: formStatus === 'pagado' ? (editingBill.paidDate || new Date().toISOString().split('T')[0]) : undefined,
        updatedAt: new Date().toISOString(),
        monthKey: editingBill.monthKey || selectedMonthKey,
      });
    } else {
      onAddBill({
        name: formName.trim(),
        category: formCategory,
        estimatedAmount: estimated,
        actualAmount: actual,
        dueDay: Math.max(1, Math.min(31, Number(formDueDay) || 1)),
        assignedQuincena: formQuincena,
        status: formStatus,
        paymentMethod: formPaymentMethod,
        receiptNumber: formReceiptNumber.trim() || undefined,
        notes: formNotes.trim() || undefined,
        isRecurring: formIsRecurring,
        monthKey: selectedMonthKey,
        paidDate: formStatus === 'pagado' ? new Date().toISOString().split('T')[0] : undefined,
      });
    }

    setIsModalOpen(false);
  };

  // Builder Methods
  const togglePresetInDraft = (preset: typeof QUICK_EXPENSE_PRESETS[0]) => {
    const exists = draftItems.some(item => item.name === preset.name);
    let next: typeof draftItems;
    if (exists) {
      next = draftItems.filter(item => item.name !== preset.name);
    } else {
      next = [...draftItems, {
        name: preset.name,
        category: preset.category,
        defaultDay: preset.defaultDay,
        defaultEstimate: preset.defaultEstimate,
      }];
    }
    setDraftItems(next);
    saveDraftToStorage(next);
  };

  const addCustomDraftItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDraftInput.trim()) return;
    const next = [...draftItems, {
      name: customDraftInput.trim(),
      category: customDraftCategory,
      defaultDay: 15,
      defaultEstimate: 100000,
    }];
    setDraftItems(next);
    saveDraftToStorage(next);
    setCustomDraftInput('');
  };

  const removeDraftItem = (index: number) => {
    const next = draftItems.filter((_, idx) => idx !== index);
    setDraftItems(next);
    saveDraftToStorage(next);
  };

  const updateDraftItem = (index: number, field: 'defaultDay' | 'defaultEstimate' | 'name', value: any) => {
    const updated = [...draftItems];
    let finalVal = value;
    if (field === 'defaultDay') {
      if (value === '') {
        finalVal = '';
      } else {
        const num = parseInt(String(value), 10);
        finalVal = isNaN(num) ? 10 : Math.max(1, Math.min(31, num));
      }
    } else if (field === 'defaultEstimate') {
      if (value === '') {
        finalVal = '';
      } else {
        const num = parseFloat(String(value));
        finalVal = isNaN(num) ? 0 : Math.max(0, num);
      }
    }
    updated[index] = {
      ...updated[index],
      [field]: finalVal,
    };
    setDraftItems(updated);
    saveDraftToStorage(updated);
  };

  const handleGenerateListFromDraft = (mode: 'replace' | 'append' = 'replace') => {
    if (draftItems.length === 0) return;

    const baseTimestamp = Date.now();
    const newBills: MonthlyBillItem[] = draftItems.map((item, index) => {
      const estimate = typeof item.defaultEstimate === 'number' && !isNaN(item.defaultEstimate)
        ? Math.max(0, item.defaultEstimate)
        : Math.max(0, parseFloat(String(item.defaultEstimate)) || 0);
      const day = typeof item.defaultDay === 'number' && !isNaN(item.defaultDay)
        ? Math.max(1, Math.min(31, item.defaultDay))
        : Math.max(1, Math.min(31, parseInt(String(item.defaultDay), 10) || 10));

      return {
        id: `bill_${baseTimestamp}_${index}`,
        name: (item.name || '').trim() || `Pago Fijo #${index + 1}`,
        category: item.category || 'servicios_publicos',
        estimatedAmount: estimate,
        actualAmount: undefined,
        dueDay: day,
        status: 'pendiente' as MonthlyBillStatus,
        paymentMethod: 'Transferencia / PSE',
        isRecurring: true,
        monthKey: selectedMonthKey,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    let finalBills: MonthlyBillItem[];
    if (mode === 'append' && currentMonthBills.length > 0) {
      // Append unique items, avoiding duplicate names
      const existingNames = new Set(currentMonthBills.map(b => b.name.trim().toLowerCase()));
      const uniqueNew = newBills.filter(b => !existingNames.has(b.name.trim().toLowerCase()));
      finalBills = [...currentMonthBills, ...(uniqueNew.length > 0 ? uniqueNew : newBills)];
    } else {
      finalBills = newBills;
    }

    finalBills.sort((a, b) => a.dueDay - b.dueDay);

    // Reset search & filters to show the newly generated bills immediately
    setSearchQuery('');
    setCategoryFilter('todas');
    setStatusFilter('todos');

    if (onBatchSetBills) {
      onBatchSetBills(finalBills, selectedMonthKey);
    } else {
      finalBills.forEach(b => onAddBill(b));
    }

    setBillsMode('tracker');
    setGenerateToastMsg(`¡Lista de ${finalBills.length} facturas fijas generada y guardada con éxito para ${monthNames[selectedMonth]} ${selectedYear}! Están ordenadas ascendentemente (Día 1 al 31).`);
    setTimeout(() => {
      setGenerateToastMsg(null);
    }, 5000);
  };

  // Copy Summary to Clipboard
  const handleCopySummary = () => {
    const text = `📊 RESUMEN FINANCIERO & PAGOS - ${monthNames[selectedMonth]} ${selectedYear}
---------------------------------------------
(+) Total Ingresos: ${formatMoney(currentMonthIncomes.reduce((s, i) => s + (Number(i.estimatedAmount) || 0), 0))}
(-) Gastos Fijos: ${formatMoney(billsTotals.estimatedTotal)}
(-) Gastos Extras: ${formatMoney(currentMonthExtraExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0))}
(=) Saldo Estimado Disponible: ${formatMoney(
      currentMonthIncomes.reduce((s, i) => s + (Number(i.estimatedAmount) || 0), 0) -
      billsTotals.estimatedTotal -
      currentMonthExtraExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
    )}

CRONOGRAMA DE GASTOS FIJOS (Orden Ascendente por Fecha):
${sortedBills.map(b => `• Día ${b.dueDay < 10 ? '0' + b.dueDay : b.dueDay}: ${b.name} (${formatMoney(b.estimatedAmount)}) [${b.status === 'pagado' ? 'PAGADO' : 'PENDIENTE'}]`).join('\n')}
---------------------------------------------
Generado desde Planificador Financiero Hogar`;

    navigator.clipboard.writeText(text);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. TOP HEADER & MONTH CONTROLLER */}
      <div className={`p-5 rounded-3xl border shadow-xl relative overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-r from-[#0b172a] via-[#101b33] to-[#121829] border-[#1e2f4f]' 
          : 'bg-gradient-to-r from-amber-500/10 via-teal-500/10 to-cyan-500/10 border-amber-300/40'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Title & Description */}
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30">
              <Wallet className="w-6 h-6 text-slate-950 font-black" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  Planificador Financiero & Pagos del Mes
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-400/20 text-amber-600 dark:text-amber-300 border border-amber-400/30">
                  {monthNames[selectedMonth]} {selectedYear}
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Control integral de Ingresos (quincenas, sueldos), Gastos Fijos por día de vencimiento y Gastos Extras con balance automático.
              </p>
            </div>
          </div>

          {/* Month Selector & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Prev month button */}
            <button
              type="button"
              onClick={() => {
                if (selectedMonth === 0) {
                  setSelectedMonth(11);
                  setSelectedYear(y => y - 1);
                } else {
                  setSelectedMonth(m => m - 1);
                }
              }}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDark ? 'bg-[#15223c] hover:bg-[#1d3056] text-slate-200 border-[#2b416e]' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
              }`}
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Month dropdown */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className={`px-3 py-2 rounded-xl text-xs font-bold font-mono border cursor-pointer ${
                isDark ? 'bg-[#0f172a] border-slate-700 text-cyan-300' : 'bg-white border-slate-300 text-slate-800 shadow-xs'
              }`}
            >
              {monthNames.map((name, idx) => {
                const key = `${selectedYear}-${String(idx + 1).padStart(2, '0')}`;
                const hasData = monthsWithData.includes(key);
                const count = bills.filter(b => (b.monthKey || '2026-09') === key).length + 
                              effectiveIncomes.filter(i => (i.monthKey || '2026-09') === key).length;
                return (
                  <option key={name} value={idx}>
                    🗓️ {name} {selectedYear} {hasData ? `• (${count} reg.)` : '• (Nuevo)'}
                  </option>
                );
              })}
            </select>

            {/* Next month button */}
            <button
              type="button"
              onClick={() => {
                if (selectedMonth === 11) {
                  setSelectedMonth(0);
                  setSelectedYear(y => y + 1);
                } else {
                  setSelectedMonth(m => m + 1);
                }
              }}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDark ? 'bg-[#15223c] hover:bg-[#1d3056] text-slate-200 border-[#2b416e]' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
              }`}
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Proyectar mes modal trigger button */}
            <button
              type="button"
              onClick={() => {
                const defaultSrc = monthsWithData.includes('2026-09') ? '2026-09' : (monthsWithData[0] || '2026-09');
                setProjectSourceMonthKey(defaultSrc);
                setIsProjectModalOpen(true);
              }}
              className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                isDark
                  ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40 shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 shadow-xs'
              }`}
              title="Proyectar un nuevo mes copiando compromisos anteriores"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Proyectar Mes</span>
            </button>

            {/* Copy summary button */}
            <button
              type="button"
              onClick={handleCopySummary}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-[#15223c] hover:bg-[#1d3056] text-cyan-300 border-[#2b416e]' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
              }`}
              title="Copiar resumen financiero al portapapeles"
            >
              <Copy className="w-4 h-4" />
            </button>

            {/* Reset / Demo sample loader */}
            {onResetBillsData && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('¿Deseas vaciar y eliminar todos los registros financieros (ingresos, gastos fijos y extras) para comenzar desde 0?')) {
                    setDraftItems([]);
                    saveDraftToStorage([]);
                    setBillsMode('tracker');
                    onResetBillsData();
                  }
                }}
                className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  isDark 
                    ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30' 
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300 shadow-xs'
                }`}
                title="Limpiar y borrar todos los datos financieros para comenzar de cero"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpiar Finanzas (0)</span>
              </button>
            )}
          </div>

        </div>

        {/* Copy toast feedback */}
        {showCopyToast && (
          <div className="absolute top-3 right-3 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black shadow-xl animate-in fade-in flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>¡Resumen Financiero copiado al portapapeles!</span>
          </div>
        )}

        {/* Project toast notification */}
        {projectToastMsg && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{projectToastMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setProjectToastMsg(null)}
              className="text-emerald-400 hover:text-white ml-2 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Empty Month / Projection Prompt Banner */}
        {currentMonthBills.length === 0 && currentMonthIncomes.length === 0 && (
          <div className={`mt-4 p-4 rounded-2xl border shadow-md transition-all ${
            isDark 
              ? 'bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-indigo-500/10 border-amber-500/30' 
              : 'bg-gradient-to-r from-amber-50 via-teal-50 to-blue-50 border-amber-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`text-sm font-black ${isDark ? 'text-amber-200' : 'text-amber-900'}`}>
                    Mes Nuevo: {monthNames[selectedMonth]} {selectedYear}
                  </h4>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Tus datos de meses anteriores (como Septiembre 2026) están guardados al 100% y no se perderán. ¿Deseas proyectar este mes copiando tus compromisos e ingresos?
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleProjectMonth('2026-09')}
                  className="px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-md shadow-amber-500/20 flex items-center space-x-1.5 cursor-pointer transition-all transform active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>⚡ Proyectar {monthNames[selectedMonth]} desde Septiembre</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. CAJA CONTENEDORA DE NAVEGACIÓN (Cajas Uniformes y Alineadas al 100%) */}
        <div className="mt-5 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className={`p-2 sm:p-2.5 rounded-2xl border-2 transition-all shadow-xl backdrop-blur-md ${
            isDark 
              ? 'bg-[#091122]/90 border-slate-700/80 shadow-black/40 ring-1 ring-cyan-500/20' 
              : 'bg-white/95 border-slate-200 shadow-slate-200/60 ring-1 ring-amber-500/20'
          }`}>
            {/* Grid unificado: 1 sola línea fija en escritorio con 7 cajas altas y texto en 2 líneas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 sm:gap-2 w-full">
              
              {/* Tab 0: Presupuesto Quincenas */}
              <button
                type="button"
                onClick={() => setActiveTab('quincenas')}
                className={`group relative w-full h-[68px] sm:h-[72px] px-1 py-1.5 rounded-xl transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center border ${
                  activeTab === 'quincenas'
                    ? 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-slate-950 border-emerald-300 shadow-lg shadow-teal-500/30 ring-2 ring-emerald-400/50'
                    : isDark 
                    ? 'bg-[#0f1d30] border-emerald-500/30 text-emerald-300 hover:bg-[#152a45] hover:border-emerald-400' 
                    : 'bg-emerald-50/80 border-emerald-200 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400'
                }`}
              >
                <div className="flex items-center justify-center space-x-1.5 mb-1 shrink-0">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-transform group-hover:scale-110 ${
                    activeTab === 'quincenas' ? 'bg-slate-950/20 text-slate-950' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded-full border ${
                    activeTab === 'quincenas'
                      ? 'bg-slate-950/25 text-slate-950 border-slate-950/20'
                      : isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-200/70 text-emerald-900 border-emerald-300'
                  }`}>
                    Q1 & Q2
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs font-black tracking-tight leading-tight">Presupuesto</span>
                <span className={`text-[9.5px] sm:text-[10px] font-semibold leading-none mt-0.5 ${
                  activeTab === 'quincenas' ? 'text-slate-950/85' : 'opacity-75'
                }`}>
                  Quincenas
                </span>
              </button>

              {/* Tab 1: Resumen Ejecutivo */}
              <button
                type="button"
                onClick={() => setActiveTab('resumen')}
                className={`group relative w-full h-[68px] sm:h-[72px] px-1 py-1.5 rounded-xl transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center border ${
                  activeTab === 'resumen'
                    ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-white border-cyan-300 shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-400/50'
                    : isDark 
                    ? 'bg-[#0f172a] border-cyan-500/30 text-cyan-300 hover:bg-[#172545] hover:border-cyan-400' 
                    : 'bg-cyan-50/70 border-cyan-200 text-cyan-900 hover:bg-cyan-100 hover:border-cyan-400'
                }`}
              >
                <div className="flex items-center justify-center space-x-1.5 mb-1 shrink-0">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-transform group-hover:scale-110 ${
                    activeTab === 'resumen' ? 'bg-white/20 text-white' : 'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-full border ${
                    activeTab === 'resumen'
                      ? 'bg-white/20 text-white border-white/20'
                      : isDark ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-cyan-200/70 text-cyan-900 border-cyan-300'
                  }`}>
                    360°
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs font-black tracking-tight leading-tight">Resumen</span>
                <span className={`text-[9.5px] sm:text-[10px] font-semibold leading-none mt-0.5 ${
                  activeTab === 'resumen' ? 'text-white/85' : 'opacity-75'
                }`}>
                  Ejecutivo
                </span>
              </button>

              {/* Tab 2: Ingresos */}
              <button
                type="button"
                onClick={() => setActiveTab('ingresos')}
                className={`group relative w-full h-[68px] sm:h-[72px] px-1 py-1.5 rounded-xl transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center border ${
                  activeTab === 'ingresos'
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-700 text-white border-emerald-300 shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400/50'
                    : isDark 
                    ? 'bg-[#0e1d1f] border-emerald-500/30 text-emerald-300 hover:bg-[#162d30] hover:border-emerald-400' 
                    : 'bg-emerald-50/60 border-emerald-200 text-emerald-900 hover:bg-emerald-100 hover:border-emerald-400'
                }`}
              >
                <div className="flex items-center justify-center space-x-1.5 mb-1 shrink-0">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-transform group-hover:scale-110 ${
                    activeTab === 'ingresos' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === 'ingresos'
                      ? 'bg-white/20 text-white'
                      : isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-200 text-emerald-900'
                  }`}>
                    {effectiveIncomes.length}
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs font-black tracking-tight leading-tight">Ingresos</span>
                <span className={`text-[9.5px] sm:text-[10px] font-semibold leading-none mt-0.5 ${
                  activeTab === 'ingresos' ? 'text-white/85' : 'opacity-75'
                }`}>
                  Mensuales
                </span>
              </button>

              {/* Tab 3: Gastos Fijos */}
              <button
                type="button"
                onClick={() => setActiveTab('fijos')}
                className={`group relative w-full h-[68px] sm:h-[72px] px-1 py-1.5 rounded-xl transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center border ${
                  activeTab === 'fijos'
                    ? 'bg-gradient-to-r from-purple-500 via-indigo-600 to-violet-700 text-white border-purple-300 shadow-lg shadow-purple-500/30 ring-2 ring-purple-400/50'
                    : isDark 
                    ? 'bg-[#181329] border-purple-500/30 text-purple-300 hover:bg-[#251d40] hover:border-purple-400' 
                    : 'bg-purple-50/60 border-purple-200 text-purple-900 hover:bg-purple-100 hover:border-purple-400'
                }`}
              >
                <div className="flex items-center justify-center space-x-1.5 mb-1 shrink-0">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-transform group-hover:scale-110 ${
                    activeTab === 'fijos' ? 'bg-white/20 text-white' : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    <CreditCard className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === 'fijos'
                      ? 'bg-white/20 text-white'
                      : isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-200 text-purple-900'
                  }`}>
                    {bills.length}
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs font-black tracking-tight leading-tight">Gastos</span>
                <span className={`text-[9.5px] sm:text-[10px] font-semibold leading-none mt-0.5 ${
                  activeTab === 'fijos' ? 'text-white/85' : 'opacity-75'
                }`}>
                  Fijos
                </span>
              </button>

              {/* Tab 4: Gastos Extras */}
              <button
                type="button"
                onClick={() => setActiveTab('extras')}
                className={`group relative w-full h-[68px] sm:h-[72px] px-1 py-1.5 rounded-xl transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center border ${
                  activeTab === 'extras'
                    ? 'bg-gradient-to-r from-pink-500 via-rose-600 to-rose-700 text-white border-pink-300 shadow-lg shadow-pink-500/30 ring-2 ring-pink-400/50'
                    : isDark 
                    ? 'bg-[#22101e] border-pink-500/30 text-pink-300 hover:bg-[#33182d] hover:border-pink-400' 
                    : 'bg-pink-50/60 border-pink-200 text-pink-900 hover:bg-pink-100 hover:border-pink-400'
                }`}
              >
                <div className="flex items-center justify-center space-x-1.5 mb-1 shrink-0">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-transform group-hover:scale-110 ${
                    activeTab === 'extras' ? 'bg-white/20 text-white' : 'bg-pink-500/20 text-pink-400'
                  }`}>
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === 'extras'
                      ? 'bg-white/20 text-white'
                      : isDark ? 'bg-pink-500/20 text-pink-300' : 'bg-pink-200 text-pink-900'
                  }`}>
                    {effectiveExtraExpenses.length}
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs font-black tracking-tight leading-tight">Gastos</span>
                <span className={`text-[9.5px] sm:text-[10px] font-semibold leading-none mt-0.5 ${
                  activeTab === 'extras' ? 'text-white/85' : 'opacity-75'
                }`}>
                  Extras
                </span>
              </button>

              {/* Tab 5: Deudas & Préstamos */}
              <button
                type="button"
                onClick={() => setActiveTab('deudas')}
                className={`group relative w-full h-[68px] sm:h-[72px] px-1 py-1.5 rounded-xl transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center border ${
                  activeTab === 'deudas'
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white border-orange-300 shadow-lg shadow-orange-500/30 ring-2 ring-orange-400/50'
                    : isDark 
                    ? 'bg-[#23150c] border-orange-500/30 text-orange-300 hover:bg-[#352013] hover:border-orange-400' 
                    : 'bg-orange-50/60 border-orange-200 text-orange-900 hover:bg-orange-100 hover:border-orange-400'
                }`}
              >
                <div className="flex items-center justify-center space-x-1.5 mb-1 shrink-0">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-transform group-hover:scale-110 ${
                    activeTab === 'deudas' ? 'bg-white/20 text-white' : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    <TrendingDown className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === 'deudas'
                      ? 'bg-white/20 text-white'
                      : isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-200 text-orange-900'
                  }`}>
                    {effectiveDebts.length}
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs font-black tracking-tight leading-tight">Deudas &</span>
                <span className={`text-[9.5px] sm:text-[10px] font-semibold leading-none mt-0.5 ${
                  activeTab === 'deudas' ? 'text-white/85' : 'opacity-75'
                }`}>
                  Préstamos
                </span>
              </button>

              {/* Tab 6: Flujo de Caja */}
              <button
                type="button"
                onClick={() => setActiveTab('flujo')}
                className={`group relative w-full h-[68px] sm:h-[72px] px-1 py-1.5 rounded-xl transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center col-span-2 sm:col-span-2 md:col-span-1 border ${
                  activeTab === 'flujo'
                    ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 border-amber-200 shadow-lg shadow-amber-500/30 ring-2 ring-amber-300/60'
                    : isDark 
                    ? 'bg-[#1f1a0f] border-amber-500/30 text-amber-300 hover:bg-[#302816] hover:border-amber-400' 
                    : 'bg-amber-50/60 border-amber-200 text-amber-900 hover:bg-amber-100 hover:border-amber-400'
                }`}
              >
                <div className="flex items-center justify-center space-x-1.5 mb-1 shrink-0">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-transform group-hover:scale-110 ${
                    activeTab === 'flujo' ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full ${
                    activeTab === 'flujo'
                      ? 'bg-slate-950/20 text-slate-950'
                      : isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-200 text-amber-900'
                  }`}>
                    1-31
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs font-black tracking-tight leading-tight">Flujo de</span>
                <span className={`text-[9.5px] sm:text-[10px] font-semibold leading-none mt-0.5 ${
                  activeTab === 'flujo' ? 'text-slate-950/85' : 'opacity-75'
                }`}>
                  Caja
                </span>
              </button>

            </div>
          </div>
        </div>

      </div>

      {/* 3. TAB VIEWS CONTENT */}

      {/* TAB 0: PRESUPUESTO POR QUINCENAS (MÓDULOS 1 Y 2 CON CIERRE DE MES Y TORTA) */}
      {activeTab === 'quincenas' && (
        <BiweeklyBudgetModulesView
          bills={currentMonthBills}
          incomes={currentMonthIncomes}
          extraExpenses={currentMonthExtraExpenses}
          debts={effectiveDebts}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onSelectMonth={(m) => setSelectedMonth(m)}
          onSelectYear={(y) => setSelectedYear(y)}
          onAddBill={handleAddBillWithMonth}
          onUpdateBill={handleUpdateBillWithMonth}
          onDeleteBill={onDeleteBill}
          onAddIncome={handleAddIncomeWithMonth}
          onUpdateIncome={handleUpdateIncomeWithMonth}
          onDeleteIncome={onDeleteIncome || (() => {})}
          onAddExtraExpense={handleAddExtraExpenseWithMonth}
          onUpdateExtraExpense={handleUpdateExtraExpenseWithMonth}
          onDeleteExtraExpense={onDeleteExtraExpense || (() => {})}
        />
      )}

      {/* TAB 1: RESUMEN FINANCIERO */}
      {activeTab === 'resumen' && (
        <div className="space-y-6">
          <FinancialSummaryDashboard
            incomes={currentMonthIncomes}
            bills={currentMonthBills}
            extraExpenses={currentMonthExtraExpenses}
            debts={effectiveDebts}
            onSelectTab={(tabId) => setActiveTab(tabId as any)}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            monthName={monthNames[selectedMonth]}
          />

          {/* Quick Preview of Upcoming Bills & Incomes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top Incomes Box */}
            <div className={`p-5 rounded-3xl border shadow-lg ${
              isDark ? 'bg-[#10192e] border-[#1e2f4f]' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <h3 className={`text-sm font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    💵 Fuentes de Ingreso ({currentMonthIncomes.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('ingresos')}
                  className="text-xs font-bold text-emerald-500 hover:underline cursor-pointer flex items-center space-x-1"
                >
                  <span>Ver Todos</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {currentMonthIncomes.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No hay ingresos registrados para {monthNames[selectedMonth]} aún.</p>
              ) : (
                <div className="space-y-2">
                  {currentMonthIncomes.slice(0, 4).map(inc => (
                    <div
                      key={inc.id}
                      className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300 block">{inc.name}</span>
                        <span className="text-[11px] text-slate-400">👤 {inc.earner} • Día {inc.dayOfMonth || 15}</span>
                      </div>
                      <div className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatMoney(inc.estimatedAmount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Fixed Bills Box */}
            <div className={`p-5 rounded-3xl border shadow-lg ${
              isDark ? 'bg-[#10192e] border-[#1e2f4f]' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-purple-500" />
                  <h3 className={`text-sm font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    💳 Próximos Pagos Fijos ({currentMonthBills.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('fijos')}
                  className="text-xs font-bold text-purple-500 hover:underline cursor-pointer flex items-center space-x-1"
                >
                  <span>Ver Todos</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {currentMonthBills.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No hay gastos fijos registrados para {monthNames[selectedMonth]} aún.</p>
              ) : (
                <div className="space-y-2">
                  {sortedBills.slice(0, 4).map(bill => (
                    <div
                      key={bill.id}
                      className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-purple-700 dark:text-purple-300 block">{bill.name}</span>
                        <span className="text-[11px] text-slate-400">Día {bill.dueDay} • {bill.status === 'pagado' ? '✓ Pagado' : '⏳ Pendiente'}</span>
                      </div>
                      <div className="text-right font-mono font-bold text-purple-600 dark:text-purple-400">
                        {formatMoney(bill.estimatedAmount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: INGRESOS DEL MES */}
      {activeTab === 'ingresos' && (
        <MonthlyIncomesSection
          incomes={currentMonthIncomes}
          onAddIncome={handleAddIncomeWithMonth}
          onUpdateIncome={handleUpdateIncomeWithMonth}
          onDeleteIncome={onDeleteIncome || (() => {})}
          onBatchSetIncomes={handleBatchSetIncomesWithMonth}
        />
      )}

      {/* TAB 3: GASTOS FIJOS MENSUALES */}
      {activeTab === 'fijos' && (
        <div className="space-y-6">
          
          {/* Header Bar for Bills with Mode Switcher (Tracker vs Fast Builder) */}
          <div className={`p-4 sm:p-5 rounded-3xl border shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isDark ? 'bg-[#101b2e] border-[#223552]' : 'bg-gradient-to-r from-purple-50 via-indigo-50 to-white border-purple-200'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  💳 Facturas & Pagos Fijos Mensuales
                </h2>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Organizados en orden ascendente por día de vencimiento (1 al 31).
                </p>
              </div>
            </div>

            {/* Mode Switcher + Add Button */}
            <div className="flex items-center space-x-2 shrink-0">
              <div className="flex items-center p-1 rounded-2xl bg-slate-200 dark:bg-[#15223d] border border-slate-300 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setBillsMode('tracker')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    billsMode === 'tracker'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  📋 Lista Ordenada ({bills.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBillsMode('builder')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    billsMode === 'builder'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  ⚡ Creador Rápido
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleOpenAddBillModal()}
                className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Factura</span>
              </button>
            </div>
          </div>

          {/* Toast Notification when list is generated */}
          {generateToastMsg && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs sm:text-sm shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-5 h-5 text-slate-950 shrink-0" />
                <span>{generateToastMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setGenerateToastMsg(null)}
                className="px-2.5 py-1 rounded-xl bg-slate-950/20 hover:bg-slate-950/30 text-slate-950 font-black text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          )}

          {/* MODE: BUILDER */}
          {billsMode === 'builder' ? (
            <div className={`p-5 sm:p-6 rounded-3xl border shadow-xl space-y-6 ${
              isDark ? 'bg-[#101a2f] border-[#223554]' : 'bg-white border-slate-200'
            }`}>
              <div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    1. Selecciona tus Pagos Fijos Mensuales
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Haz clic en las facturas que tienes cada mes (Agua, Luz, Gas, Internet, Arriendo, Tarjetas, etc.). Luego podrás ajustar sus valores estimados y fechas de vencimiento antes de generar la lista.
                </p>
              </div>

              {/* Preset Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {QUICK_EXPENSE_PRESETS.map((preset) => {
                  const isSelected = draftItems.some(i => i.name === preset.name);
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => togglePresetInDraft(preset)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? isDark 
                            ? 'bg-purple-950/40 border-purple-500 text-purple-200 shadow-md ring-1 ring-purple-500/50' 
                            : 'bg-purple-50 border-purple-400 text-purple-900 shadow-sm ring-1 ring-purple-400'
                          : isDark
                            ? 'bg-[#15223c] border-[#23365c] text-slate-300 hover:border-slate-500'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <span className="text-base">{preset.name.split(' ')[0]}</span>
                        <div className="truncate">
                          <span className="font-bold text-xs block truncate">{preset.name.replace(/^[^\s]+\s/, '')}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">Día {preset.defaultDay} • {formatMoney(preset.defaultEstimate)}</span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-purple-500 border-purple-400 text-white' : 'border-slate-500'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Add Draft Item */}
              <form onSubmit={addCustomDraftItem} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Añadir otro gasto fijo personalizado..."
                  value={customDraftInput}
                  onChange={(e) => setCustomDraftInput(e.target.value)}
                  className={`flex-1 px-4 py-2.5 rounded-2xl text-xs border ${
                    isDark ? 'bg-[#0b1220] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!customDraftInput.trim()}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition-all cursor-pointer shadow-md"
                >
                  + Agregar Personalizado
                </button>
              </form>

              {/* 2. Step 2: Set estimated values and dates */}
              {draftItems.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        2. Ajusta los Valores Estimados y Días de Pago ({draftItems.length} seleccionados)
                      </h4>
                      <p className="text-xs text-slate-400">
                        La lista se organizará automáticamente de forma ascendente por el día de pago.
                      </p>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-[10px] text-slate-400 block uppercase">Total Estimado Fijo:</span>
                      <span className="text-base font-black text-purple-600 dark:text-purple-400">
                        {formatMoney(draftItems.reduce((s, i) => s + (Number(i.defaultEstimate) || 0), 0))}
                      </span>
                    </div>
                  </div>

                  {/* Draft List Table */}
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {draftItems.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-2xl border flex flex-wrap sm:flex-nowrap items-center gap-3 ${
                          isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex-1 min-w-[150px]">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateDraftItem(idx, 'name', e.target.value)}
                            className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-bold border ${
                              isDark ? 'bg-[#16223b] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                            }`}
                          />
                        </div>

                        <div className="w-[140px] shrink-0">
                          <label className="text-[9px] font-mono text-slate-400 uppercase block">Valor Estimado ($)</label>
                          <input
                            type="number"
                            value={item.defaultEstimate}
                            onChange={(e) => updateDraftItem(idx, 'defaultEstimate', e.target.value)}
                            className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono border ${
                              isDark ? 'bg-[#16223b] border-slate-700 text-purple-400' : 'bg-white border-slate-300 text-purple-700'
                            }`}
                          />
                        </div>

                        <div className="w-[100px] shrink-0">
                          <label className="text-[9px] font-mono text-slate-400 uppercase block">Día Pago (1-31)</label>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={item.defaultDay}
                            onChange={(e) => updateDraftItem(idx, 'defaultDay', e.target.value)}
                            className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono border ${
                              isDark ? 'bg-[#16223b] border-slate-700 text-cyan-300' : 'bg-white border-slate-300 text-slate-800'
                            }`}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => removeDraftItem(idx)}
                          className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                          title="Eliminar de la lista"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Generate Actions */}
                  <div className="pt-3 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => handleGenerateListFromDraft('replace')}
                      className="w-full py-3.5 rounded-2xl font-black text-sm bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white shadow-xl shadow-purple-600/30 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center space-x-2"
                    >
                      <Sparkles className="w-5 h-5 text-amber-300" />
                      <span>
                        {bills.length > 0 
                          ? `✨ Generar y Reemplazar con esta Lista Organizada (${draftItems.length} Facturas)` 
                          : `✨ Generar y Guardar Lista Organizada Ascendentemente (${draftItems.length} Facturas)`}
                      </span>
                    </button>

                    {bills.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleGenerateListFromDraft('append')}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs border transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                          isDark 
                            ? 'bg-[#15223c] hover:bg-[#1a2d52] text-cyan-300 border-[#233a69]' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                      >
                        <Plus className="w-4 h-4 text-cyan-400" />
                        <span>Conservar las {bills.length} facturas actuales y Agregar estas ({draftItems.length}) nuevas</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* MODE: TRACKER (List organized ascending by day) */
            <div className="space-y-6">
              
              {/* Search & Filter Bar */}
              <div className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                isDark ? 'bg-[#101729] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, factura o notas..."
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
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                        quincenaFilter === 'quincena_1'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-300'
                      }`}
                      title="Filtrar solo 1ª Quincena (Q1 - Días 1 al 15)"
                    >
                      <span>🟣 Q1</span>
                      <span className="text-[10px] font-mono opacity-80">({q1AllBills.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuincenaFilter('quincena_2')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                        quincenaFilter === 'quincena_2'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-500 hover:text-amber-600 dark:hover:text-amber-300'
                      }`}
                      title="Filtrar solo 2ª Quincena (Q2 - Días 16 al 31)"
                    >
                      <span>🟠 Q2</span>
                      <span className="text-[10px] font-mono opacity-80">({q2AllBills.length})</span>
                    </button>
                  </div>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                      isDark ? 'bg-[#0b111e] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <option value="todas">Todas las Categorías</option>
                    {Object.entries(CATEGORY_META).map(([key, meta]) => (
                      <option key={key} value={key}>{meta.label}</option>
                    ))}
                  </select>

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
                      onClick={() => setStatusFilter('pendiente')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        statusFilter === 'pendiente'
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                      }`}
                    >
                      Pendientes
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
                  </div>
                </div>
              </div>

              {/* Bills Checklist Table Sorted Ascending */}
              {filteredBills.length === 0 ? (
                <div className={`p-10 rounded-3xl border text-center space-y-3 ${
                  isDark ? 'bg-[#101729] border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <CreditCard className="w-10 h-10 mx-auto opacity-50" />
                  <p className="text-sm font-semibold">No se encontraron facturas fijas.</p>
                  <button
                    type="button"
                    onClick={() => setBillsMode('builder')}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white shadow-md hover:bg-purple-500 cursor-pointer"
                  >
                    Abrir Creador Rápido de Facturas
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
                          <th className="py-3.5 px-3 w-24">Día Pago</th>
                          <th className="py-3.5 px-4 min-w-[200px]">Factura / Concepto</th>
                          <th className="py-3.5 px-3 min-w-[140px]">Categoría</th>
                          <th className="py-3.5 px-3 text-right min-w-[120px]">Valor Estimado</th>
                          <th className="py-3.5 px-3 text-right min-w-[120px]">Valor Real / Pagado</th>
                          <th className="py-3.5 px-3 text-center w-28">Estado</th>
                          <th className="py-3.5 px-3 min-w-[130px] hidden md:table-cell">Método / Ref</th>
                          <th className="py-3.5 px-3 text-center w-24">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                        {filteredBills.map((bill) => {
                          const catMeta = CATEGORY_META[bill.category] || CATEGORY_META.otro;
                          const isPaid = bill.status === 'pagado';
                          const billQ = getBillQuincena(bill);
                          return (
                            <tr
                              key={bill.id}
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
                                  onClick={() => handleToggleBillStatus(bill)}
                                  className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer mx-auto ${
                                    isPaid
                                      ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-sm ring-2 ring-emerald-500/30'
                                      : isDark
                                        ? 'border-slate-600 bg-[#162238] hover:border-purple-400 text-transparent hover:text-purple-400'
                                        : 'border-slate-300 bg-white hover:border-purple-500 text-transparent hover:text-purple-500'
                                  }`}
                                  title={isPaid ? 'Marcar como pendiente' : 'Marcar como pagado'}
                                >
                                  <Check className="w-4 h-4 stroke-[3]" />
                                </button>
                              </td>

                              {/* Quincena Selector Toggle (Q1 / Q2) */}
                              <td className="py-3 px-2 text-center">
                                <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 shadow-inner">
                                  <button
                                    type="button"
                                    onClick={() => handleSetBillQuincena(bill, 'quincena_1')}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-black transition-all cursor-pointer ${
                                      billQ === 'quincena_1'
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10'
                                    }`}
                                    title="Asignar a 1ª Quincena (Q1 • Días 1 al 15)"
                                  >
                                    Q1
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSetBillQuincena(bill, 'quincena_2')}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-black transition-all cursor-pointer ${
                                      billQ === 'quincena_2'
                                        ? 'bg-amber-600 text-white shadow-xs'
                                        : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10'
                                    }`}
                                    title="Asignar a 2ª Quincena (Q2 • Días 16 al 31)"
                                  >
                                    Q2
                                  </button>
                                </div>
                              </td>

                              {/* 2. Due Day Badge */}
                              <td className="py-3 px-3">
                                <span className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black border inline-flex items-center space-x-1 ${
                                  isPaid
                                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                    : isDark
                                      ? 'bg-[#1a2744] border-[#2b3e6b] text-cyan-300'
                                      : 'bg-amber-100/70 border-amber-300 text-amber-900'
                                }`}>
                                  <Calendar className="w-3 h-3 text-amber-500" />
                                  <span>Día {bill.dueDay < 10 ? '0' + bill.dueDay : bill.dueDay}</span>
                                </span>
                              </td>

                              {/* 3. Bill Name & Notes */}
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <span className={`font-bold text-sm ${
                                    isPaid 
                                      ? 'line-through text-slate-400 dark:text-slate-500 font-normal' 
                                      : isDark ? 'text-white' : 'text-slate-900'
                                  }`}>
                                    {bill.name}
                                  </span>
                                </div>
                                {bill.notes && (
                                  <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5" title={bill.notes}>
                                    📝 {bill.notes}
                                  </p>
                                )}
                              </td>

                              {/* 4. Category */}
                              <td className="py-3 px-3">
                                <span
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase font-mono whitespace-nowrap inline-block"
                                  style={{
                                    backgroundColor: `${catMeta.color}20`,
                                    color: catMeta.color,
                                    border: `1px solid ${catMeta.color}40`,
                                  }}
                                >
                                  {catMeta.label}
                                </span>
                              </td>

                              {/* 5. Estimated Amount */}
                              <td className="py-3 px-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                                {formatMoney(bill.estimatedAmount)}
                              </td>

                              {/* 6. Actual / Paid Amount */}
                              <td className="py-3 px-3 text-right font-mono font-black">
                                {editingActualBillId === bill.id ? (
                                  <div className="flex items-center justify-end space-x-1">
                                    <input
                                      type="number"
                                      autoFocus
                                      value={editingActualValue}
                                      onChange={(e) => setEditingActualValue(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveActualInline(bill);
                                        if (e.key === 'Escape') setEditingActualBillId(null);
                                      }}
                                      className="w-24 px-1.5 py-1 text-xs font-mono font-bold text-right rounded-lg border bg-emerald-950/80 border-emerald-400 text-emerald-200 outline-none ring-1 ring-emerald-400"
                                      placeholder="Monto"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveActualInline(bill)}
                                      className="p-1 rounded bg-emerald-500 text-slate-950 hover:bg-emerald-400 cursor-pointer"
                                      title="Guardar valor real"
                                    >
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingActualBillId(null)}
                                      className="p-1 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 cursor-pointer text-[10px]"
                                      title="Cancelar"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    onClick={() => {
                                      setEditingActualBillId(bill.id);
                                      const currentVal = bill.actualAmount !== undefined && bill.actualAmount !== null
                                        ? bill.actualAmount
                                        : bill.estimatedAmount;
                                      setEditingActualValue(currentVal ? currentVal.toString() : '');
                                    }}
                                    className="cursor-pointer group inline-flex items-center justify-end space-x-1 hover:bg-emerald-500/10 px-2 py-1 rounded-lg transition-colors"
                                    title="Haz clic para modificar el valor real pagado"
                                  >
                                    <span className={isPaid ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-400 text-[11px] italic font-normal"}>
                                      {isPaid ? formatMoney(bill.actualAmount || bill.estimatedAmount) : '--'}
                                    </span>
                                    <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                                  </div>
                                )}
                              </td>

                              {/* 7. Status */}
                              <td className="py-3 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleBillStatus(bill)}
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
                                      <Clock className="w-3 h-3 text-amber-500" />
                                      <span>Pendiente</span>
                                    </>
                                  )}
                                </button>
                              </td>

                              {/* 8. Payment Method & Ref */}
                              <td className="py-3 px-3 hidden md:table-cell text-slate-400 text-[11px]">
                                <span className="block truncate max-w-[130px]">{bill.paymentMethod || 'Transferencia'}</span>
                                {bill.receiptNumber && (
                                  <span className="text-[10px] font-mono text-cyan-400 block truncate">Ref: {bill.receiptNumber}</span>
                                )}
                              </td>

                              {/* 9. Actions */}
                              <td className="py-3 px-3 text-center">
                                <div className="flex items-center justify-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditBillModal(bill)}
                                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                      isDark 
                                        ? 'bg-[#172238] border-slate-700 text-slate-300 hover:text-white hover:border-purple-400' 
                                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                                    }`}
                                    title="Editar factura"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onDeleteBill(bill.id)}
                                    className={`p-1.5 rounded-lg border transition-all cursor-pointer text-rose-400 ${
                                      isDark 
                                        ? 'bg-[#172238] border-slate-700 hover:bg-rose-500/20 hover:border-rose-500' 
                                        : 'bg-slate-100 border-slate-200 hover:bg-rose-50 hover:border-rose-300'
                                    }`}
                                    title="Eliminar factura"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      {/* Table Totals & Quincena Subtotals Footer */}
                      <tfoot>
                        {/* Subtotal Q1 (when viewing all or Q1) */}
                        {(quincenaFilter === 'todas' || quincenaFilter === 'quincena_1') && (
                          <tr className={`border-t font-semibold font-mono text-xs ${
                            isDark ? 'bg-indigo-950/30 text-indigo-200 border-indigo-900/50' : 'bg-indigo-50/70 text-indigo-900 border-indigo-200'
                          }`}>
                            <td colSpan={5} className="py-2.5 px-4 text-right uppercase tracking-wider text-[10px] font-bold">
                              🟣 Subtotal 1ª Quincena (Q1 • {q1FilteredBills.length} facturas):
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-400">
                              {formatMoney(q1FilteredEstimated)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-500">
                              {formatMoney(q1FilteredPaid)}
                            </td>
                            <td colSpan={3} className="py-2.5 px-4 text-left font-sans text-[11px] text-slate-400">
                              Pendiente Q1: <span className="font-mono font-bold text-amber-400">{formatMoney(Math.max(0, q1FilteredEstimated - q1FilteredPaid))}</span>
                            </td>
                          </tr>
                        )}

                        {/* Subtotal Q2 (when viewing all or Q2) */}
                        {(quincenaFilter === 'todas' || quincenaFilter === 'quincena_2') && (
                          <tr className={`border-t font-semibold font-mono text-xs ${
                            isDark ? 'bg-amber-950/25 text-amber-200 border-amber-900/50' : 'bg-amber-50/70 text-amber-900 border-amber-200'
                          }`}>
                            <td colSpan={5} className="py-2.5 px-4 text-right uppercase tracking-wider text-[10px] font-bold">
                              🟠 Subtotal 2ª Quincena (Q2 • {q2FilteredBills.length} facturas):
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                              {formatMoney(q2FilteredEstimated)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-500">
                              {formatMoney(q2FilteredPaid)}
                            </td>
                            <td colSpan={3} className="py-2.5 px-4 text-left font-sans text-[11px] text-slate-400">
                              Pendiente Q2: <span className="font-mono font-bold text-amber-400">{formatMoney(Math.max(0, q2FilteredEstimated - q2FilteredPaid))}</span>
                            </td>
                          </tr>
                        )}

                        {/* Grand Total Row */}
                        <tr className={`border-t-2 font-bold font-mono text-xs ${
                          isDark ? 'bg-[#131d33] text-white border-slate-700' : 'bg-slate-100 text-slate-900 border-slate-300'
                        }`}>
                          <td colSpan={5} className="py-3.5 px-4 text-right uppercase tracking-wider text-[11px]">
                            Total {quincenaFilter === 'quincena_1' ? 'Q1' : quincenaFilter === 'quincena_2' ? 'Q2' : 'Gastos Fijos'} ({filteredBills.length} facturas):
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono font-black text-purple-600 dark:text-purple-400 text-sm">
                            {formatMoney(totalFilteredEstimated)}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                            {formatMoney(totalFilteredPaid)}
                          </td>
                          <td colSpan={3} className="py-3.5 px-4 text-left font-sans text-xs">
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-600 dark:text-purple-300 text-[11px]">
                              {filteredBills.filter(b => b.status === 'pagado').length} de {filteredBills.length} pagadas
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Subtotal Summary Cards (Q1, Q2, Consolidado) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {/* Q1 Card */}
                <div 
                  onClick={() => setQuincenaFilter(quincenaFilter === 'quincena_1' ? 'todas' : 'quincena_1')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                    quincenaFilter === 'quincena_1'
                      ? 'ring-2 ring-indigo-500 bg-indigo-500/15 border-indigo-500/50 shadow-lg'
                      : isDark 
                        ? 'bg-[#101729] hover:bg-[#141d33] border-slate-800' 
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                        Subtotal 1ª Quincena (Q1)
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold">
                      {q1Count} facturas
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">Vencimientos del día 1 al 15</p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Total Estimado:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatMoney(q1TotalEstimated)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-emerald-500 font-semibold">Total Pagado:</span>
                      <span className="font-mono font-bold text-emerald-500">{formatMoney(q1TotalPaid)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-amber-500 font-semibold">Pendiente por Pagar:</span>
                      <span className="font-mono font-bold text-amber-500">{formatMoney(q1TotalPending)}</span>
                    </div>
                  </div>
                </div>

                {/* Q2 Card */}
                <div 
                  onClick={() => setQuincenaFilter(quincenaFilter === 'quincena_2' ? 'todas' : 'quincena_2')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                    quincenaFilter === 'quincena_2'
                      ? 'ring-2 ring-amber-500 bg-amber-500/15 border-amber-500/50 shadow-lg'
                      : isDark 
                        ? 'bg-[#101729] hover:bg-[#141d33] border-slate-800' 
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-500 dark:text-amber-400">
                        Subtotal 2ª Quincena (Q2)
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">
                      {q2Count} facturas
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">Vencimientos del día 16 al 31</p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Total Estimado:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatMoney(q2TotalEstimated)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-emerald-500 font-semibold">Total Pagado:</span>
                      <span className="font-mono font-bold text-emerald-500">{formatMoney(q2TotalPaid)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-amber-500 font-semibold">Pendiente por Pagar:</span>
                      <span className="font-mono font-bold text-amber-500">{formatMoney(q2TotalPending)}</span>
                    </div>
                  </div>
                </div>

                {/* Grand Total Card */}
                <div 
                  onClick={() => setQuincenaFilter('todas')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    quincenaFilter === 'todas'
                      ? 'ring-2 ring-purple-500/50 shadow-lg'
                      : ''
                  } ${
                    isDark 
                      ? 'bg-gradient-to-br from-[#12182b] to-[#18233c] border-purple-500/30' 
                      : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                        Total Facturas Fijas
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold">
                      {billsTotals.totalCount} facturas
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    {billsTotals.paidCount} pagadas ({billsTotals.progressPercent}%)
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Presupuesto Fijo Total:</span>
                      <span className="font-mono font-black text-sm text-purple-600 dark:text-purple-400">{formatMoney(billsTotals.estimatedTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-emerald-500 font-semibold">Pagado a la fecha:</span>
                      <span className="font-mono font-bold text-emerald-500">{formatMoney(billsTotals.paidTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-amber-500 font-semibold">Saldo Pendiente:</span>
                      <span className="font-mono font-bold text-amber-500">{formatMoney(billsTotals.pendingTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 4: GASTOS ADICIONALES */}
      {activeTab === 'extras' && (
        <MonthlyExtraExpensesSection
          extraExpenses={currentMonthExtraExpenses}
          onAddExtraExpense={handleAddExtraExpenseWithMonth}
          onUpdateExtraExpense={handleUpdateExtraExpenseWithMonth}
          onDeleteExtraExpense={onDeleteExtraExpense || (() => {})}
          onBatchSetExtraExpenses={handleBatchSetExtraExpensesWithMonth}
        />
      )}

      {/* TAB 5: DEUDAS Y PRÉSTAMOS */}
      {activeTab === 'deudas' && (
        <DebtsTrackerSection
          debts={effectiveDebts}
          onAddDebt={onAddDebt || (() => {})}
          onUpdateDebt={onUpdateDebt || (() => {})}
          onDeleteDebt={onDeleteDebt || (() => {})}
          onPayInstallment={onPayDebtInstallment || (() => {})}
          onBatchSetDebts={onBatchSetDebts}
        />
      )}

      {/* TAB 6: FLUJO DE CAJA */}
      {activeTab === 'flujo' && (
        <CashFlowTimeline
          incomes={currentMonthIncomes}
          bills={currentMonthBills}
          extraExpenses={currentMonthExtraExpenses}
          debts={effectiveDebts}
        />
      )}

      {/* MODAL FOR ADDING / EDITING A FIXED BILL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden ${
            isDark ? 'bg-[#131b2e] border-[#2d3a58]' : 'bg-white border-slate-200'
          }`}>
            <form onSubmit={handleSaveBillModal}>
              <div className={`p-5 border-b flex items-center justify-between ${
                isDark ? 'border-slate-800 bg-[#0f172a]' : 'border-slate-200 bg-slate-50'
              }`}>
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {editingBill ? 'Editar Factura Fija' : 'Nueva Factura Fija'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Configura el valor estimado y el día de pago del mes.
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
                    Nombre del Pago *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Agua, Luz, Internet, Arriendo, Tarjeta..."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-2xl text-sm font-semibold border ${
                      isDark ? 'bg-[#0c1220] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                {/* Category & Due Day */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Categoría
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as MonthlyBillCategory)}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs font-semibold border ${
                        isDark ? 'bg-[#0c1220] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      {Object.entries(CATEGORY_META).map(([key, meta]) => (
                        <option key={key} value={key}>{meta.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Día de Vencimiento (1 - 31) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      value={formDueDay}
                      onChange={(e) => {
                        const d = Number(e.target.value);
                        setFormDueDay(d);
                        if (d >= 1 && d <= 15) setFormQuincena('quincena_1');
                        else if (d > 15 && d <= 31) setFormQuincena('quincena_2');
                      }}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs font-bold font-mono border ${
                        isDark ? 'bg-[#0c1220] border-slate-700 text-cyan-300' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                {/* Quincena Asignada (Q1 / Q2) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Quincena de Pago Asignada
                  </label>
                  <div className="flex items-center p-1 rounded-2xl border bg-slate-100 dark:bg-[#0c1220] border-slate-300 dark:border-slate-700 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormQuincena('quincena_1')}
                      className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                        formQuincena === 'quincena_1'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>🟣 1ª Quincena (Q1 • Días 1-15)</span>
                      {formQuincena === 'quincena_1' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormQuincena('quincena_2')}
                      className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                        formQuincena === 'quincena_2'
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>🟠 2ª Quincena (Q2 • Días 16-31)</span>
                      {formQuincena === 'quincena_2' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Se ajusta automáticamente según el día de vencimiento, o puedes reasignarla a la quincena que desees.
                  </span>
                </div>

                {/* Estimated & Actual Amount */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Valor Estimado ($) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="Ej. 140000"
                      value={formEstimatedAmount}
                      onChange={(e) => setFormEstimatedAmount(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-bold font-mono border ${
                        isDark ? 'bg-[#0c1220] border-slate-700 text-purple-400' : 'bg-slate-50 border-slate-200 text-purple-700'
                      }`}
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Presupuesto proyectado</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-emerald-400">
                        Valor Real Pagado ($)
                      </label>
                      {formEstimatedAmount && (
                        <button
                          type="button"
                          onClick={() => setFormActualAmount(formEstimatedAmount)}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
                        >
                          Usar estimado
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      placeholder={formEstimatedAmount ? `Ej. ${formEstimatedAmount}` : 'Ej. 138500'}
                      value={formActualAmount}
                      onChange={(e) => setFormActualAmount(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-bold font-mono border ${
                        isDark ? 'bg-[#0c1220] border-emerald-500/50 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      }`}
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {formStatus === 'pagado' ? 'Monto exacto cobrado o debitado' : 'Modifica aquí el valor real pagado'}
                    </span>
                  </div>
                </div>

                {/* Status & Recurring */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Estado de Pago
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => {
                        const newStatus = e.target.value as MonthlyBillStatus;
                        setFormStatus(newStatus);
                        if (newStatus === 'pagado' && !formActualAmount && formEstimatedAmount) {
                          setFormActualAmount(formEstimatedAmount);
                        }
                      }}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs font-semibold border ${
                        isDark ? 'bg-[#0c1220] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      <option value="pendiente">⏳ Pendiente por Pagar</option>
                      <option value="pagado">✓ Ya Pagado</option>
                      <option value="vencido">⚠️ Vencido</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center space-x-2 text-xs font-bold cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={formIsRecurring}
                        onChange={(e) => setFormIsRecurring(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span>Factura fija mensual recurrente</span>
                    </label>
                  </div>
                </div>

                {/* Payment Method & Reference */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Método de Pago
                    </label>
                    <select
                      value={formPaymentMethod}
                      onChange={(e) => setFormPaymentMethod(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs font-semibold border ${
                        isDark ? 'bg-[#0c1220] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      {PAYMENT_METHODS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Nº Referencia / Convenio
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Ref # 9482910"
                      value={formReceiptNumber}
                      onChange={(e) => setFormReceiptNumber(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border ${
                        isDark ? 'bg-[#0c1220] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Notas Adicionales (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Instrucciones de pago o recordatorio..."
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
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white cursor-pointer shadow-md"
                >
                  {editingBill ? 'Guardar Cambios' : 'Añadir Factura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA PROYECTAR NUEVO MES A PARTIR DE UNO EXISTENTE */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden ${
            isDark ? 'bg-[#131b2e] border-[#2d3a58]' : 'bg-white border-slate-200'
          }`}>
            <div className={`p-5 border-b flex items-center justify-between ${
              isDark ? 'border-slate-800 bg-[#0f172a]' : 'border-slate-200 bg-amber-50/50'
            }`}>
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Proyectar Mes: {monthNames[selectedMonth]} {selectedYear}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Copia tus compromisos de un mes anterior sin tocar su información.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProjectModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Copiar compromisos desde el mes:
                </label>
                <select
                  value={projectSourceMonthKey}
                  onChange={(e) => setProjectSourceMonthKey(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border font-mono cursor-pointer ${
                    isDark ? 'bg-[#0c1220] border-slate-700 text-cyan-300' : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                >
                  {monthsWithData.map(key => {
                    const [y, m] = key.split('-');
                    const mName = monthNames[parseInt(m, 10) - 1] || m;
                    const bCount = bills.filter(b => (b.monthKey || '2026-09') === key).length;
                    const iCount = effectiveIncomes.filter(i => (i.monthKey || '2026-09') === key).length;
                    return (
                      <option key={key} value={key}>
                        {mName} {y} ({bCount} facturas, {iCount} ingresos)
                      </option>
                    );
                  })}
                  {!monthsWithData.includes('2026-09') && (
                    <option value="2026-09">Septiembre 2026 (Base)</option>
                  )}
                </select>
              </div>

              <div className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                isDark ? 'bg-[#0c1322] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className="font-bold text-amber-400 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>¿Qué ocurrirá al proyectar?</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                  <li>Se crearán copias de tus <strong>gastos fijos</strong> recurrentes en estado <em>pendiente</em>.</li>
                  <li>Se replicarán tus <strong>fuentes de ingreso</strong> habituales.</li>
                  <li>Los <strong>gastos extras</strong> comenzarán limpios para {monthNames[selectedMonth]}.</li>
                  <li><strong className="text-emerald-400">Importante:</strong> El mes de origen queda 100% resguardado e inalterado.</li>
                </ul>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-600 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleProjectMonth(projectSourceMonthKey);
                    setIsProjectModalOpen(false);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-md cursor-pointer transition-all"
                >
                  ⚡ Proyectar a {monthNames[selectedMonth]}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
