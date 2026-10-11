import React, { useState, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { MonthlyBillItem, MonthlyIncomeItem, MonthlyExtraExpenseItem, DebtItem } from '../../types';
import {
  Calendar,
  TrendingUp,
  CreditCard,
  ShoppingBag,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  DollarSign,
  Wallet,
  Scale,
  ShieldAlert,
  ArrowRight,
  Coins,
  Sparkles,
  Info
} from 'lucide-react';

interface CashFlowTimelineProps {
  incomes: MonthlyIncomeItem[];
  bills: MonthlyBillItem[];
  extraExpenses: MonthlyExtraExpenseItem[];
  debts?: DebtItem[];
}

export const CashFlowTimeline: React.FC<CashFlowTimelineProps> = ({
  incomes,
  bills,
  extraExpenses,
  debts = []
}) => {
  const { isDark } = useTheme();
  const [quincenaFilter, setQuincenaFilter] = useState<'all' | 'q1' | 'q2'>('all');
  const [initialBalance, setInitialBalance] = useState<number>(0);
  const [showInitialBalanceInput, setShowInitialBalanceInput] = useState<boolean>(false);

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Group events by day of month (1-31) and compute progressive rolling balances
  const { daysWithActivity, totalMonthlyIn, totalMonthlyOut, projectedEndBalance, lowestBalancePoint } = useMemo(() => {
    const daysMap: Record<number, {
      day: number;
      incomes: MonthlyIncomeItem[];
      bills: MonthlyBillItem[];
      extraExpenses: MonthlyExtraExpenseItem[];
      debtPayments: DebtItem[];
      totalIn: number;
      totalOut: number;
      netDelta: number;
    }> = {};

    // Initialize days 1-31
    for (let d = 1; d <= 31; d++) {
      daysMap[d] = {
        day: d,
        incomes: [],
        bills: [],
        extraExpenses: [],
        debtPayments: [],
        totalIn: 0,
        totalOut: 0,
        netDelta: 0,
      };
    }

    let sumIn = 0;
    let sumOut = 0;

    // 1. Map Incomes
    incomes.forEach(inc => {
      const d = Math.max(1, Math.min(31, inc.dayOfMonth || 15));
      daysMap[d].incomes.push(inc);
      const val = Number(inc.estimatedAmount) || 0;
      daysMap[d].totalIn += val;
      sumIn += val;
    });

    // 2. Map Fixed Bills
    bills.forEach(bill => {
      const d = Math.max(1, Math.min(31, bill.dueDay || 10));
      daysMap[d].bills.push(bill);
      const val = Number(bill.estimatedAmount) || 0;
      daysMap[d].totalOut += val;
      sumOut += val;
    });

    // 3. Map Extra Expenses
    extraExpenses.forEach(extra => {
      const d = Math.max(1, Math.min(31, extra.dayOfMonth || 15));
      daysMap[d].extraExpenses.push(extra);
      const val = Number(extra.amount) || 0;
      daysMap[d].totalOut += val;
      sumOut += val;
    });

    // 4. Map Active Debts monthly installments
    debts.filter(d => d.status === 'activa' && d.monthlyPayment > 0).forEach(debt => {
      const d = Math.max(1, Math.min(31, debt.dueDay || 15));
      daysMap[d].debtPayments.push(debt);
      const val = Number(debt.monthlyPayment) || 0;
      daysMap[d].totalOut += val;
      sumOut += val;
    });

    // Progressive balance computation from Day 1 to 31
    let runningBalance = initialBalance;
    let minBalance = initialBalance;
    let minBalanceDay = 1;

    const activityList: Array<{
      day: number;
      incomes: MonthlyIncomeItem[];
      bills: MonthlyBillItem[];
      extraExpenses: MonthlyExtraExpenseItem[];
      debtPayments: DebtItem[];
      totalIn: number;
      totalOut: number;
      netDelta: number;
      startBalance: number;
      endBalance: number;
    }> = [];

    for (let d = 1; d <= 31; d++) {
      const data = daysMap[d];
      data.netDelta = data.totalIn - data.totalOut;

      const dayStartBalance = runningBalance;
      runningBalance += data.netDelta;
      const dayEndBalance = runningBalance;

      if (dayEndBalance < minBalance) {
        minBalance = dayEndBalance;
        minBalanceDay = d;
      }

      if (data.incomes.length > 0 || data.bills.length > 0 || data.extraExpenses.length > 0 || data.debtPayments.length > 0) {
        activityList.push({
          ...data,
          startBalance: dayStartBalance,
          endBalance: dayEndBalance,
        });
      }
    }

    return {
      daysWithActivity: activityList,
      totalMonthlyIn: sumIn,
      totalMonthlyOut: sumOut,
      projectedEndBalance: runningBalance,
      lowestBalancePoint: { minBalance, minBalanceDay },
    };
  }, [incomes, bills, extraExpenses, debts, initialBalance]);

  const filteredDays = useMemo(() => {
    return daysWithActivity.filter(d => {
      if (quincenaFilter === 'q1') return d.day <= 15;
      if (quincenaFilter === 'q2') return d.day > 15;
      return true;
    });
  }, [daysWithActivity, quincenaFilter]);

  return (
    <div className="space-y-6">
      
      {/* 1. TOP HEADER & CONTROLS */}
      <div className={`p-5 sm:p-6 rounded-3xl border shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative overflow-hidden ${
        isDark ? 'bg-gradient-to-br from-[#10192e] via-[#0f172a] to-[#0c1322] border-[#223554]' : 'bg-gradient-to-r from-blue-50 via-indigo-50 to-white border-blue-200'
      }`}>
        <div className="flex items-center space-x-3.5 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg shadow-cyan-500/10">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className={`text-lg sm:text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Cronograma de Flujo de Caja & Saldo Proyectado
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono">
                Día a Día (1 al 31)
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Monitorea lo que gastas en cada fecha y exactamente <b>cuánto dinero te va quedando</b> disponible tras cada pago.
            </p>
          </div>
        </div>

        {/* Right Controls: Initial Balance & Quincena Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          
          {/* Initial Balance toggle / input */}
          <div className={`p-1.5 px-3 rounded-2xl border flex items-center space-x-2 text-xs ${
            isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-300 shadow-xs'
          }`}>
            <Wallet className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 text-[11px]">Saldo inicial:</span>
            {showInitialBalanceInput ? (
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  value={initialBalance || ''}
                  onChange={(e) => setInitialBalance(Number(e.target.value) || 0)}
                  placeholder="0"
                  className={`w-24 px-2 py-0.5 rounded-lg text-xs font-mono font-bold border focus:outline-none ${
                    isDark ? 'bg-slate-800 border-cyan-500/50 text-cyan-300' : 'bg-slate-50 border-cyan-300 text-slate-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowInitialBalanceInput(false)}
                  className="text-[10px] text-cyan-400 font-bold px-1.5 py-0.5 rounded hover:bg-cyan-500/20"
                >
                  OK
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowInitialBalanceInput(true)}
                className="font-mono font-bold text-cyan-400 hover:underline cursor-pointer flex items-center space-x-1"
                title="Hacer clic para editar el saldo con el que arrancas el mes"
              >
                <span>{formatCOP(initialBalance)}</span>
                <span className="text-[10px] text-slate-500">(editar)</span>
              </button>
            )}
          </div>

          {/* Quincena filter */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-200 dark:bg-[#15223c] shrink-0 border border-slate-300 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setQuincenaFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                quincenaFilter === 'all'
                  ? 'bg-white dark:bg-[#203258] text-slate-900 dark:text-cyan-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              Todo el Mes (1-31)
            </button>
            <button
              type="button"
              onClick={() => setQuincenaFilter('q1')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                quincenaFilter === 'q1'
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              1ra Quincena (1-15)
            </button>
            <button
              type="button"
              onClick={() => setQuincenaFilter('q2')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                quincenaFilter === 'q2'
                  ? 'bg-purple-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              2da Quincena (16-31)
            </button>
          </div>
        </div>
      </div>

      {/* 2. EXECUTIVE CASH FLOW KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Ingresos Totales */}
        <div className={`p-4 rounded-3xl border shadow-md ${
          isDark ? 'bg-[#101c2e] border-emerald-500/30' : 'bg-white border-emerald-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Total Entradas (Ingresos)
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-300 font-mono">
            {formatCOP(totalMonthlyIn)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {incomes.length} fuentes de ingreso activas
          </span>
        </div>

        {/* KPI 2: Egresos Totales */}
        <div className={`p-4 rounded-3xl border shadow-md ${
          isDark ? 'bg-[#1b1222] border-rose-500/30' : 'bg-white border-rose-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Total Salidas (Gastos + Pagos)
            </span>
            <div className="w-7 h-7 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
            {formatCOP(totalMonthlyOut)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Facturas, gastos del mes y cuotas
          </span>
        </div>

        {/* KPI 3: Saldo Final del Mes (Lo que te queda) */}
        <div className={`p-4 rounded-3xl border shadow-md ${
          projectedEndBalance >= 0
            ? isDark ? 'bg-[#0f2128] border-cyan-500/40' : 'bg-cyan-50/70 border-cyan-300'
            : isDark ? 'bg-[#291319] border-rose-500/40' : 'bg-rose-50/70 border-rose-300'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              Saldo Final Proyectado
            </span>
            <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl sm:text-2xl font-black font-mono ${
            projectedEndBalance >= 0 ? 'text-cyan-600 dark:text-cyan-300' : 'text-rose-500'
          }`}>
            {formatCOP(projectedEndBalance)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {projectedEndBalance >= 0 ? '✓ Superávit estimado al cierre' : '⚠️ Déficit proyectado en el mes'}
          </span>
        </div>

        {/* KPI 4: Punto de Liquidez Mínima */}
        <div className={`p-4 rounded-3xl border shadow-md ${
          lowestBalancePoint.minBalance >= 0
            ? isDark ? 'bg-[#101b2e] border-indigo-500/30' : 'bg-white border-indigo-200'
            : isDark ? 'bg-[#2a171d] border-amber-500/40' : 'bg-amber-50/70 border-amber-300'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Punto Crítico (Menor Saldo)
            </span>
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
              lowestBalancePoint.minBalance >= 0 ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl sm:text-2xl font-black font-mono ${
            lowestBalancePoint.minBalance >= 0 ? 'text-indigo-600 dark:text-indigo-300' : 'text-amber-500'
          }`}>
            {formatCOP(lowestBalancePoint.minBalance)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Registrado hacia el <b>Día {lowestBalancePoint.minBalanceDay}</b>
          </span>
        </div>

      </div>

      {/* Guide Note Box */}
      <div className={`p-3.5 rounded-2xl border flex items-start space-x-3 text-xs ${
        isDark ? 'bg-[#0f172a]/90 border-slate-800 text-slate-300' : 'bg-blue-50/70 border-blue-200 text-slate-700'
      }`}>
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-cyan-400 block mb-0.5">Cómo leer tu Flujo Diario:</span>
          Cada tarjeta muestra: <b>(1) Lo que gastas o recibes ese día</b>, <b>(2) La variación neta (Delta)</b>, y <b>(3) El Saldo Disponible que te va quedando en la cuenta</b> tras aplicar los movimientos.
        </div>
      </div>

      {/* 3. TIMELINE DAYS */}
      {filteredDays.length === 0 ? (
        <div className={`p-10 rounded-3xl border text-center space-y-2 ${
          isDark ? 'bg-[#101729] border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <Clock className="w-8 h-8 mx-auto opacity-50" />
          <p className="text-sm font-semibold">No hay movimientos financieros programados en este período.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDays.map((dayData, idx) => {
            const isQ1 = dayData.day <= 15;
            const isBalancePositive = dayData.endBalance >= 0;

            return (
              <div
                key={dayData.day}
                className={`p-4 sm:p-5 rounded-3xl border transition-all shadow-md relative overflow-hidden ${
                  isDark 
                    ? isBalancePositive 
                      ? 'bg-[#111a2e] border-[#223354] hover:border-cyan-500/40' 
                      : 'bg-[#1a1322] border-rose-500/30'
                    : isBalancePositive
                      ? 'bg-white border-slate-200 hover:border-blue-300'
                      : 'bg-rose-50/30 border-rose-200'
                }`}
              >
                {/* Day Header Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                  
                  {/* Left: Day Badge & Summary */}
                  <div className="flex items-center space-x-3">
                    <div className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center font-mono font-black shrink-0 ${
                      isQ1
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40'
                        : 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/40'
                    }`}>
                      <span className="text-[9px] uppercase tracking-tighter">DÍA</span>
                      <span className="text-base leading-none">{dayData.day}</span>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className={`text-sm sm:text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Día {dayData.day} del Mes
                        </h3>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          isQ1 
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                        }`}>
                          {isQ1 ? '1ra Quincena' : '2da Quincena'}
                        </span>
                      </div>
                      
                      {/* Flow Description: Start -> Delta -> End */}
                      <p className="text-[11px] text-slate-400 font-mono flex items-center space-x-1.5 flex-wrap">
                        <span>Saldo inicial hoy: <b>{formatCOP(dayData.startBalance)}</b></span>
                        <ArrowRight className="w-3 h-3 text-slate-500 shrink-0 inline" />
                        <span>
                          Variación: <b className={dayData.netDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {dayData.netDelta >= 0 ? '+' : ''}{formatCOP(dayData.netDelta)}
                          </b>
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Right: Daily Breakdown & PROMINENT REMAINING BALANCE */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
                    
                    {/* Total Entradas */}
                    {dayData.totalIn > 0 && (
                      <div className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 flex items-center space-x-1">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>+{formatCOP(dayData.totalIn)}</span>
                      </div>
                    )}

                    {/* Total Gastos */}
                    {dayData.totalOut > 0 && (
                      <div className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/30 flex items-center space-x-1">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        <span>-{formatCOP(dayData.totalOut)}</span>
                      </div>
                    )}

                    {/* PROMINENT REMAINING BALANCE (Saldo que va quedando al cierre del día) */}
                    <div className={`px-3 py-1.5 rounded-2xl font-black border flex items-center space-x-1.5 shadow-sm ${
                      isBalancePositive
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-600 dark:text-cyan-300 border-cyan-500/40'
                        : 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/40'
                    }`}>
                      <Wallet className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-tight">Saldo al cierre:</span>
                        <span className="text-xs sm:text-sm leading-tight block">{formatCOP(dayData.endBalance)}</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Day Items List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  
                  {/* Incomes on this day */}
                  {dayData.incomes.map(inc => (
                    <div
                      key={inc.id}
                      className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
                        <div>
                          <span className="font-bold text-emerald-700 dark:text-emerald-300 block truncate">{inc.name}</span>
                          <span className="text-[10px] text-slate-400">👤 {inc.earner} • Ingreso</span>
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatCOP(inc.estimatedAmount)}
                      </div>
                    </div>
                  ))}

                  {/* Fixed bills on this day */}
                  {dayData.bills.map(bill => (
                    <div
                      key={bill.id}
                      className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4 text-purple-500 shrink-0" />
                        <div>
                          <span className="font-bold text-purple-700 dark:text-purple-300 block truncate">{bill.name}</span>
                          <span className="text-[10px] text-slate-400">
                            {bill.status === 'pagado' ? '✓ Factura Pagada' : '⏳ Factura Fija Pendiente'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold text-purple-600 dark:text-purple-400">
                        -{formatCOP(bill.estimatedAmount)}
                      </div>
                    </div>
                  ))}

                  {/* Extra expenses on this day */}
                  {dayData.extraExpenses.map(extra => (
                    <div
                      key={extra.id}
                      className="p-3 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <ShoppingBag className="w-4 h-4 text-pink-500 shrink-0" />
                        <div>
                          <span className="font-bold text-pink-700 dark:text-pink-300 block truncate">{extra.name}</span>
                          <span className="text-[10px] text-slate-400">Gasto Extra • {extra.paidBy}</span>
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold text-pink-600 dark:text-pink-400">
                        -{formatCOP(extra.amount)}
                      </div>
                    </div>
                  ))}

                  {/* Active Debt installments on this day */}
                  {dayData.debtPayments.map(debt => (
                    <div
                      key={debt.id}
                      className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <Coins className="w-4 h-4 text-amber-500 shrink-0" />
                        <div>
                          <span className="font-bold text-amber-700 dark:text-amber-300 block truncate">{debt.name}</span>
                          <span className="text-[10px] text-slate-400">Cuota Deuda • {debt.creditor}</span>
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                        -{formatCOP(debt.monthlyPayment)}
                      </div>
                    </div>
                  ))}

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
