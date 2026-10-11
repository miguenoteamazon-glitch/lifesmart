import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Wallet,
  Coins,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  RotateCcw,
  Check,
  Edit2,
  RefreshCw,
  Plus,
  Link,
  Link2
} from 'lucide-react';
import { MonthlyBillItem, MonthlyBillCategory } from '../../types';

interface DailyQuincenaExpenseTrackerProps {
  quincenaNumber: 1 | 2;
  startDay: number; // 1 for Q1, 16 for Q2
  endDay: number;   // 15 for Q1, lastDay for Q2 (28..31)
  selectedMonth: number; // 0-11
  selectedYear: number;
  bills: MonthlyBillItem[];
  onAddBill?: (bill: Omit<MonthlyBillItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateBill?: (bill: MonthlyBillItem) => void;
  onDeleteBill?: (id: string) => void;
  isDark?: boolean;
  moduleSurplusBalance?: number; // Saldo a favor calculado del módulo (Ingresos - Gastos Fijos & Extras)
  onDailySpentChange?: (totalSpent: number) => void;
}

const WEEKDAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const formatCOP = (val: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(val);
};

export const DailyQuincenaExpenseTracker: React.FC<DailyQuincenaExpenseTrackerProps> = ({
  quincenaNumber,
  startDay,
  endDay,
  selectedMonth,
  selectedYear,
  bills,
  onAddBill,
  onUpdateBill,
  isDark = true,
  moduleSurplusBalance,
  onDailySpentChange,
}) => {
  const totalDays = endDay - startDay + 1;
  const storageKey = `lifeflow_daily_pocket_${selectedYear}_${selectedMonth}_q${quincenaNumber}`;

  // Find if there's already a bill in fixed expenses for this quincena's daily pocket
  const existingDailyBill = useMemo(() => {
    return bills.find(b => {
      const isCategoryMatch = b.category === 'gastos_diarios';
      const isNameMatch = (b.name || '').toLowerCase().includes('gasto diario') || 
                          (b.name || '').toLowerCase().includes('gastos diarios') ||
                          (b.name || '').toLowerCase().includes('bolsillo diario');
      const day = b.dueDay || 1;
      const isQuincenaMatch = quincenaNumber === 1 ? day <= 15 : day > 15;
      return (isCategoryMatch || isNameMatch) && isQuincenaMatch;
    });
  }, [bills, quincenaNumber]);

  // Preference: whether to link automatically to the module's surplus balance (default: true)
  const [isLinkedToModule, setIsLinkedToModule] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}_is_linked`);
      if (saved !== null) return saved === 'true';
    } catch (e) {}
    return true; // Default linked to module surplus
  });

  const handleToggleLink = (linked: boolean) => {
    setIsLinkedToModule(linked);
    try {
      localStorage.setItem(`${storageKey}_is_linked`, String(linked));
    } catch (e) {}
  };

  // Initial State from storage or fallback
  const [manualBudget, setManualBudget] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.totalBudget === 'number') return parsed.totalBudget;
      }
    } catch (e) {}
    if (existingDailyBill) {
      return Number(existingDailyBill.estimatedAmount) || 400000;
    }
    return 400000;
  });

  // Effective Budget: dynamically linked to module surplus balance or manual budget
  const effectiveBudget = useMemo(() => {
    if (isLinkedToModule && typeof moduleSurplusBalance === 'number') {
      return Math.max(0, moduleSurplusBalance);
    }
    return manualBudget;
  }, [isLinkedToModule, moduleSurplusBalance, manualBudget]);

  // Recorded daily spent: { [dayNumber]: spentAmount }
  const [dailySpent, setDailySpent] = useState<Record<number, number>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.dailySpent && typeof parsed.dailySpent === 'object') {
          return parsed.dailySpent;
        }
      }
    } catch (e) {}
    return {};
  });

  // Editing budget mode
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetText, setBudgetText] = useState(effectiveBudget.toString());

  // Save changes to localStorage whenever manualBudget or dailySpent changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        totalBudget: manualBudget,
        dailySpent,
      }));
    } catch (e) {
      console.warn('Could not save daily pocket state', e);
    }
  }, [storageKey, manualBudget, dailySpent]);

  // Overall totals
  const totalSpentSoFar: number = (Object.values(dailySpent) as number[]).reduce((s: number, v: number) => s + (Number(v) || 0), 0);
  const totalRemainingInPocket: number = effectiveBudget - totalSpentSoFar;
  const recordedDaysCount = Object.keys(dailySpent).length;
  const daysLeftToRecord = Math.max(0, totalDays - recordedDaysCount);

  // Notify parent on daily spent update
  useEffect(() => {
    if (onDailySpentChange) {
      onDailySpentChange(totalSpentSoFar);
    }
  }, [totalSpentSoFar, onDailySpentChange]);

  // Base daily estimate (e.g. Presupuesto / totalDays)
  const baseDailyBudget = Math.round(effectiveBudget / totalDays);

  // Sync / Create fixed expense bill
  const handleSyncWithFixedBills = () => {
    if (existingDailyBill && onUpdateBill) {
      onUpdateBill({
        ...existingDailyBill,
        name: `Presupuesto Gastos Diarios (Q${quincenaNumber})`,
        category: 'gastos_diarios',
        estimatedAmount: effectiveBudget,
        actualAmount: totalSpentSoFar,
        dueDay: startDay,
      });
    } else if (onAddBill) {
      onAddBill({
        name: `Presupuesto Gastos Diarios (Q${quincenaNumber})`,
        category: 'gastos_diarios',
        estimatedAmount: effectiveBudget,
        actualAmount: totalSpentSoFar,
        dueDay: startDay,
        status: 'pendiente',
        isRecurring: true,
      });
    }
  };

  const handleSaveBudget = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanNum = parseFloat(budgetText.replace(/[^\d.-]/g, '')) || 0;
    const finalVal = Math.max(0, cleanNum);
    setManualBudget(finalVal);
    handleToggleLink(false); // Disconnect auto-link if user sets manual budget
    setIsEditingBudget(false);
    
    // Also update existing bill if synced
    if (existingDailyBill && onUpdateBill) {
      onUpdateBill({
        ...existingDailyBill,
        estimatedAmount: finalVal,
      });
    }
  };

  // Day-by-Day Dynamic Recalculation Engine
  // "si un dia se gasto menos y sobro un poquito de los 26 mil se suman a los otros dias
  //  si se gasto mas de lo estimado se restan de los otros dias"
  const dayRows = useMemo(() => {
    const rows = [];
    const today = new Date();
    let accumulatedSpent = 0;

    for (let day = startDay; day <= endDay; day++) {
      const dateObj = new Date(selectedYear, selectedMonth, day);
      const weekday = WEEKDAY_NAMES[dateObj.getDay()];
      const isToday = today.getFullYear() === selectedYear && 
                      today.getMonth() === selectedMonth && 
                      today.getDate() === day;
      
      const isPast = (today.getFullYear() > selectedYear) ||
                     (today.getFullYear() === selectedYear && today.getMonth() > selectedMonth) ||
                     (today.getFullYear() === selectedYear && today.getMonth() === selectedMonth && today.getDate() > day);

      const daysRemainingFromHere = endDay - day + 1;
      
      // Dynamic available budget for this day:
      // (Effective Budget - Sum of all spent in prior days) / (Days remaining)
      const remainingQuincenaBudget = effectiveBudget - accumulatedSpent;
      const calculatedDailyAllowance = remainingQuincenaBudget > 0 
        ? Math.round(remainingQuincenaBudget / daysRemainingFromHere)
        : 0;

      const hasRecorded = dailySpent[day] !== undefined;
      const actualSpent = hasRecorded ? dailySpent[day] : 0;

      // Update accumulated spent for future days
      if (hasRecorded) {
        accumulatedSpent += actualSpent;
      }

      // Difference
      const difference = calculatedDailyAllowance - actualSpent;

      rows.push({
        day,
        weekday,
        isToday,
        isPast,
        calculatedDailyAllowance,
        hasRecorded,
        actualSpent,
        difference,
        remainingQuincenaBudgetAfterDay: effectiveBudget - accumulatedSpent,
      });
    }

    return rows;
  }, [startDay, endDay, selectedYear, selectedMonth, effectiveBudget, dailySpent]);

  // Current dynamic recommendation for upcoming unrecorded days:
  const currentDynamicDailyRate = daysLeftToRecord > 0 
    ? Math.max(0, Math.round(totalRemainingInPocket / daysLeftToRecord))
    : 0;

  // Handler for setting a specific day's spent amount
  const handleUpdateDaySpent = (day: number, amount: number | null) => {
    setDailySpent(prev => {
      const copy = { ...prev };
      if (amount === null || isNaN(amount) || amount < 0) {
        delete copy[day];
      } else {
        copy[day] = amount;
      }
      return copy;
    });
  };

  // State for inline edit inputs
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [tempAmountText, setTempAmountText] = useState('');

  const handleStartEditDay = (day: number, currentVal?: number) => {
    setEditingDay(day);
    setTempAmountText(currentVal !== undefined ? currentVal.toString() : '');
  };

  const handleCommitEditDay = (day: number) => {
    if (tempAmountText.trim() === '') {
      handleUpdateDaySpent(day, null);
    } else {
      const num = parseFloat(tempAmountText.replace(/[^\d.-]/g, '')) || 0;
      handleUpdateDaySpent(day, Math.max(0, num));
    }
    setEditingDay(null);
  };

  const handleResetQuincena = () => {
    if (window.confirm(`¿Deseas reiniciar los registros de gastos diarios para la Quincena ${quincenaNumber}?`)) {
      setDailySpent({});
    }
  };

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-md ${
      isDark 
        ? 'bg-[#0b1322]/90 border-amber-500/30 shadow-amber-500/5' 
        : 'bg-amber-50/40 border-amber-300 shadow-amber-500/10'
    }`}>
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-amber-500/20">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className={`text-sm font-black uppercase tracking-wider ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                Gastos Diarios (Día a Día)
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">
                Q{quincenaNumber} • {totalDays} Días
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
              Si gastas menos, el sobrante se suma a los otros días; si gastas de más, se resta de los días restantes.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Link to Module Surplus Toggle */}
          {isLinkedToModule ? (
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <Link2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Vinculado al Saldo a Favor (Q{quincenaNumber})</span>
              <button
                type="button"
                onClick={() => handleToggleLink(false)}
                className="ml-1 text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                title="Cambiar a presupuesto manual"
              >
                (Manual)
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleToggleLink(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold cursor-pointer transition-all"
              title="Vincular automáticamente al Saldo a Favor del Módulo"
            >
              <Link className="w-3.5 h-3.5" />
              <span>Vincular al Saldo a Favor ({formatCOP(Math.max(0, moduleSurplusBalance || 0))})</span>
            </button>
          )}

          {recordedDaysCount > 0 && (
            <button
              type="button"
              onClick={handleResetQuincena}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
              title="Reiniciar registros de esta quincena"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Pocket Budget Config & Real-Time Remaining Highlight */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3.5 text-xs">
        
        {/* Card 1: Presupuesto Asignado (Saldo a Favor) */}
        <div className={`p-3 rounded-xl border ${
          isDark ? 'bg-[#0f1a2e] border-slate-700' : 'bg-white border-amber-200'
        }`}>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="font-semibold">
              {isLinkedToModule ? `Saldo Inicial Q${quincenaNumber}:` : 'Presupuesto Quincenal:'}
            </span>
            {!isLinkedToModule && !isEditingBudget && (
              <button
                type="button"
                onClick={() => {
                  setBudgetText(manualBudget.toString());
                  setIsEditingBudget(true);
                }}
                className="text-amber-400 hover:text-amber-300 flex items-center space-x-1 font-bold cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>Modificar</span>
              </button>
            )}
          </div>

          {isEditingBudget && !isLinkedToModule ? (
            <form onSubmit={handleSaveBudget} className="flex items-center space-x-1.5 mt-1">
              <input
                type="number"
                value={budgetText}
                onChange={(e) => setBudgetText(e.target.value)}
                autoFocus
                className={`w-full px-2 py-1 text-xs rounded-lg font-mono font-bold border ${
                  isDark ? 'bg-slate-900 border-amber-500 text-amber-300' : 'bg-slate-50 border-amber-400 text-slate-900'
                }`}
                placeholder="400000"
              />
              <button
                type="submit"
                className="px-2 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer hover:bg-amber-400"
              >
                OK
              </button>
            </form>
          ) : (
            <div className="flex items-baseline space-x-1">
              <span className="font-mono text-base font-black text-amber-400">
                {formatCOP(effectiveBudget)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                / {totalDays} días
              </span>
            </div>
          )}
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {isLinkedToModule ? `🔗 Saldo a favor del Módulo ${quincenaNumber}` : 'Presupuesto manual'}
          </span>
        </div>

        {/* Card 2: Saldo que va quedando en tiempo real */}
        <div className={`p-3 rounded-xl border ${
          totalRemainingInPocket >= 0
            ? isDark ? 'bg-[#0a1f18] border-emerald-500/40' : 'bg-emerald-50 border-emerald-300'
            : isDark ? 'bg-[#220c13] border-rose-500/40' : 'bg-rose-50 border-rose-300'
        }`}>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className={`font-semibold ${totalRemainingInPocket >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              Saldo que va quedando:
            </span>
            <span className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded ${
              totalRemainingInPocket >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {totalRemainingInPocket >= 0 ? 'Disponible' : 'Sobregiro'}
            </span>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className={`font-mono text-base font-black ${
              totalRemainingInPocket >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {totalRemainingInPocket >= 0 ? '+' : ''}{formatCOP(totalRemainingInPocket)}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
            Gastado: {formatCOP(totalSpentSoFar)} ({recordedDaysCount} días reg.)
          </span>
        </div>

        {/* Card 3: Cupo dinámico por día pendiente */}
        <div className={`p-3 rounded-xl border ${
          isDark ? 'bg-[#0f1a2e] border-slate-700' : 'bg-white border-amber-200'
        }`}>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-400 font-semibold">Disponible Hoy / Próximos:</span>
            <span className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded ${
              currentDynamicDailyRate >= baseDailyBudget ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
            }`}>
              {currentDynamicDailyRate >= baseDailyBudget ? '▲ Con Ahorro' : '▼ Ajustado'}
            </span>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className={`font-mono text-base font-black ${
              totalRemainingInPocket >= 0 ? 'text-cyan-400' : 'text-rose-400'
            }`}>
              {formatCOP(currentDynamicDailyRate)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              / día ({daysLeftToRecord} días pend.)
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Base inicial: {formatCOP(baseDailyBudget)} / día
          </span>
        </div>

      </div>

      {/* Pocket Progress Bar */}
      <div className="mt-3.5 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 text-[11px]">
            Gastado: <strong className="text-white">{formatCOP(totalSpentSoFar)}</strong> de {formatCOP(effectiveBudget)} ({recordedDaysCount}/{totalDays} días)
          </span>
          <span className={`font-bold text-[11px] ${totalRemainingInPocket >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalRemainingInPocket >= 0 ? 'Restante: +' : 'Sobregiro: -'}{formatCOP(Math.abs(totalRemainingInPocket))}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-700/50 overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              totalSpentSoFar > effectiveBudget
                ? 'bg-rose-500'
                : totalSpentSoFar > effectiveBudget * 0.85
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, (totalSpentSoFar / (effectiveBudget || 1)) * 100)}%` }}
          />
        </div>
      </div>

      {/* THE DAILY TABLE (La Tablita al Lado) */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-700/60">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
              isDark ? 'bg-[#0f172a] border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}>
              <th className="py-2.5 px-3">Día</th>
              <th className="py-2.5 px-3">Presupuesto del Día</th>
              <th className="py-2.5 px-3">Gasto Real</th>
              <th className="py-2.5 px-3 text-right">Efecto / Redistribución</th>
            </tr>
          </thead>
          <tbody className={`divide-y font-mono ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
            {dayRows.map((row) => {
              const isCurrentDay = row.isToday;
              const isRowEditing = editingDay === row.day;

              return (
                <tr
                  key={row.day}
                  className={`transition-colors ${
                    isCurrentDay
                      ? isDark ? 'bg-amber-500/10' : 'bg-amber-100/50'
                      : isDark ? 'hover:bg-slate-800/30' : 'hover:bg-amber-50/30'
                  }`}
                >
                  {/* Day column */}
                  <td className="py-2 px-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isCurrentDay
                          ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                          : row.hasRecorded
                          ? isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-800'
                          : isDark ? 'bg-slate-900 text-slate-500' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {row.day}
                      </span>
                      <div>
                        <span className={`text-xs block font-sans ${isCurrentDay ? 'font-bold text-amber-400' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {row.weekday} {row.day}
                        </span>
                        {isCurrentDay && (
                          <span className="text-[9px] font-black uppercase text-amber-400 block tracking-widest font-sans">
                            ● HOY
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Calculated daily allowance */}
                  <td className="py-2 px-3 whitespace-nowrap">
                    <div className="flex items-center space-x-1.5">
                      <span className={`font-bold text-xs ${
                        row.calculatedDailyAllowance > baseDailyBudget
                          ? 'text-emerald-400'
                          : row.calculatedDailyAllowance < baseDailyBudget
                          ? 'text-amber-400'
                          : isDark ? 'text-slate-200' : 'text-slate-800'
                      }`}>
                        {formatCOP(row.calculatedDailyAllowance)}
                      </span>
                      {row.calculatedDailyAllowance !== baseDailyBudget && (
                        <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                          row.calculatedDailyAllowance > baseDailyBudget
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-amber-500/15 text-amber-400'
                        }`}>
                          {row.calculatedDailyAllowance > baseDailyBudget ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block font-sans">
                      Disponible
                    </span>
                  </td>

                  {/* Actual spent input / buttons */}
                  <td className="py-2 px-3 whitespace-nowrap">
                    {isRowEditing ? (
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          value={tempAmountText}
                          onChange={(e) => setTempAmountText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCommitEditDay(row.day);
                            if (e.key === 'Escape') setEditingDay(null);
                          }}
                          autoFocus
                          placeholder="0"
                          className={`w-28 px-2 py-1 text-xs rounded font-bold border ${
                            isDark ? 'bg-slate-900 border-amber-500 text-white' : 'bg-white border-amber-400 text-slate-900'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => handleCommitEditDay(row.day)}
                          className="p-1 rounded bg-amber-500 text-slate-950 cursor-pointer hover:bg-amber-400"
                          title="Guardar"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        {row.hasRecorded ? (
                          <div
                            onClick={() => handleStartEditDay(row.day, row.actualSpent)}
                            role="button"
                            tabIndex={0}
                            className={`cursor-pointer px-2 py-1 rounded border text-xs font-bold transition-all hover:border-amber-400 ${
                              isDark ? 'bg-slate-900/80 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                            title="Click para modificar gasto del día"
                          >
                            {formatCOP(row.actualSpent)}
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditDay(row.day, 0)}
                              className={`px-2 py-1 rounded border text-[11px] font-sans font-semibold transition-all cursor-pointer ${
                                isDark 
                                  ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-amber-300 hover:border-amber-500' 
                                  : 'bg-white border-slate-300 text-slate-600 hover:text-amber-700 hover:border-amber-500'
                              }`}
                              title="Registrar cuánto se gastó hoy"
                            >
                              + Registrar
                            </button>

                            {/* Quick: Spent exactly the daily budget */}
                            <button
                              type="button"
                              onClick={() => handleUpdateDaySpent(row.day, row.calculatedDailyAllowance)}
                              className="px-1.5 py-1 rounded text-[10px] font-mono bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 cursor-pointer"
                              title="Marcar que gastaste exactamente el presupuesto del día"
                            >
                              = Exacto
                            </button>

                            {/* Quick: Zero spent today (saved everything!) */}
                            <button
                              type="button"
                              onClick={() => handleUpdateDaySpent(row.day, 0)}
                              className="px-1.5 py-1 rounded text-[10px] font-mono bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 cursor-pointer"
                              title="Marcar $0 gastos hoy (suma todo al resto)"
                            >
                              $0
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Redistribution / Effect column */}
                  <td className="py-2 px-3 whitespace-nowrap text-right">
                    {row.hasRecorded ? (
                      <div>
                        {row.difference > 0 ? (
                          <div>
                            <span className="font-bold text-xs text-emerald-400 block">
                              +{formatCOP(row.difference)}
                            </span>
                            <span className="text-[9px] text-emerald-500/90 font-sans block">
                              ✓ Sobró (se sumó a los otros días)
                            </span>
                          </div>
                        ) : row.difference < 0 ? (
                          <div>
                            <span className="font-bold text-xs text-rose-400 block">
                              -{formatCOP(Math.abs(row.difference))}
                            </span>
                            <span className="text-[9px] text-rose-400/90 font-sans block">
                              ⚠ Exceso (se restó a los otros días)
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-xs text-cyan-400 block">
                              $0 (Exacto)
                            </span>
                            <span className="text-[9px] text-slate-400 font-sans block">
                              Cumplió el presupuesto
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-sans italic">
                        {row.isPast ? 'Sin registrar' : 'Por registrar'}
                      </span>
                    )}
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Helpful Smart Footer Note */}
      <div className={`mt-3.5 p-2.5 rounded-xl border flex items-center space-x-2 text-[11px] font-sans ${
        isDark ? 'bg-amber-500/5 border-amber-500/20 text-slate-300' : 'bg-amber-100/60 border-amber-200 text-slate-800'
      }`}>
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>Fórmula Inteligente:</strong> Cada día que ahorras dinero, el excedente se divide entre los días pendientes incrementando tu capacidad diaria. Si te pasas, los días siguientes se ajustan a la baja automáticamente para mantener intacta tu meta quincenal.
        </span>
      </div>

    </div>
  );
};
