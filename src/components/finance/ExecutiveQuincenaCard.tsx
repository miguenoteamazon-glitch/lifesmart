import React, { useState } from 'react';
import {
  TrendingUp,
  CreditCard,
  ShoppingBag,
  Wallet,
  CheckCircle2,
  PiggyBank,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { MonthlyBillItem, MonthlyIncomeItem, MonthlyExtraExpenseItem } from '../../types';

interface ExecutiveQuincenaCardProps {
  quincenaKey: 'q1' | 'q2';
  title: string;
  badge: string;
  subtitle: string;
  themeColor: 'emerald' | 'cyan';
  isDark: boolean;
  incomesList: MonthlyIncomeItem[];
  billsList: MonthlyBillItem[];
  extrasList: MonthlyExtraExpenseItem[];
  incomesEstimated: number;
  incomesReceived: number;
  incomesPending: number;
  billsEstimated: number;
  billsPaid: number;
  billsPending: number;
  extrasEstimated: number;
  extrasPaid: number;
  extrasPending: number;
  remainingAfterFixed: number;
  finalEstimatedBalance: number;
  realCashInHand: number;
  savingsPercentage: number;
  fixedPercentage: number;
  extrasPercentage: number;
  carriedFromPreviousQ?: number;
  carriedFromPreviousQReal?: number;
  formatCOP: (val: number) => string;
  onSelectTab?: (tabId: 'quincenas' | 'resumen' | 'ingresos' | 'fijos' | 'extras' | 'deudas' | 'flujo') => void;
}

export const ExecutiveQuincenaCard: React.FC<ExecutiveQuincenaCardProps> = ({
  quincenaKey,
  title,
  badge,
  subtitle,
  themeColor,
  isDark,
  incomesList,
  billsList,
  extrasList,
  incomesEstimated,
  incomesReceived,
  incomesPending,
  billsEstimated,
  billsPaid,
  billsPending,
  extrasEstimated,
  extrasPaid,
  extrasPending,
  remainingAfterFixed,
  finalEstimatedBalance,
  realCashInHand,
  savingsPercentage,
  fixedPercentage,
  extrasPercentage,
  carriedFromPreviousQ = 0,
  carriedFromPreviousQReal = 0,
  formatCOP,
  onSelectTab,
}) => {
  const [showTableDetails, setShowTableDetails] = useState<boolean>(true);

  const isQ2 = quincenaKey === 'q2';
  const hasSurplusCarry = isQ2 && carriedFromPreviousQ !== 0;

  return (
    <div
      className={`rounded-3xl border shadow-xl overflow-hidden transition-all ${
        isDark
          ? quincenaKey === 'q1'
            ? 'bg-gradient-to-b from-[#0e1d24] via-[#0d1829] to-[#0b1424] border-emerald-500/30'
            : 'bg-gradient-to-b from-[#0e1f2b] via-[#0d1b2e] to-[#0b1524] border-cyan-500/30'
          : quincenaKey === 'q1'
            ? 'bg-gradient-to-b from-emerald-50/40 via-white to-slate-50 border-emerald-200'
            : 'bg-gradient-to-b from-cyan-50/40 via-white to-slate-50 border-cyan-200'
      }`}
    >
      {/* 1. Header Bar */}
      <div
        className={`p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isDark
            ? quincenaKey === 'q1'
              ? 'bg-[#102422]/90 border-emerald-500/20'
              : 'bg-[#102436]/90 border-cyan-500/20'
            : quincenaKey === 'q1'
              ? 'bg-emerald-50/80 border-emerald-200'
              : 'bg-cyan-50/80 border-cyan-200'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-md ${
              quincenaKey === 'q1'
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                : 'bg-cyan-500 text-slate-950 shadow-cyan-500/20'
            }`}
          >
            {quincenaKey.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {title}
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide font-mono ${
                  quincenaKey === 'q1'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30'
                }`}
              >
                {badge}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowTableDetails(!showTableDetails)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center space-x-1.5 cursor-pointer ${
              isDark
                ? 'bg-[#0f172a] hover:bg-[#1e293b] border-slate-700 text-slate-300'
                : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showTableDetails ? 'Ocultar Tabla' : 'Ver Tabla Detallada'}</span>
            {showTableDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Cards */}
      <div className="p-4 sm:p-5 space-y-5">
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${isQ2 && hasSurplusCarry ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-3 sm:gap-4`}>
          
          {/* Card 1: Ingresos de esta Quincena */}
          <div
            onClick={() => onSelectTab && onSelectTab('ingresos')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer group shadow-sm ${
              isDark
                ? 'bg-[#0e2122] border-emerald-500/30 hover:border-emerald-400'
                : 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5">
                <TrendingUp className="w-4 h-4" />
                <span>1. Ingresos {quincenaKey.toUpperCase()}</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                {incomesList.length} fuentes
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 tracking-tight font-mono">
              {formatCOP(incomesEstimated)}
            </div>
            <div className="mt-2.5 pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[11px]">
              <span className="text-emerald-700/80 dark:text-emerald-400/80 font-medium">
                Cobrado: <strong>{formatCOP(incomesReceived)}</strong>
              </span>
              <span className="text-slate-500 dark:text-slate-400 font-mono">
                Pend: {formatCOP(incomesPending)}
              </span>
            </div>
          </div>

          {/* Card Optional for Q2: Saldo Traído de Q1 */}
          {isQ2 && hasSurplusCarry && (
            <div
              className={`p-4 rounded-2xl border transition-all shadow-sm ${
                carriedFromPreviousQ >= 0
                  ? isDark
                    ? 'bg-[#0f2425] border-teal-500/40 text-teal-200'
                    : 'bg-teal-50/70 border-teal-300 text-teal-900'
                  : isDark
                    ? 'bg-[#261414] border-rose-500/40 text-rose-200'
                    : 'bg-rose-50/70 border-rose-300 text-rose-900'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span>2. Remanente Q1</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-teal-500/20">
                  {carriedFromPreviousQ >= 0 ? '+ Superávit' : '- Déficit'}
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black tracking-tight font-mono">
                {carriedFromPreviousQ >= 0 ? '+' : ''}{formatCOP(carriedFromPreviousQ)}
              </div>
              <div className="mt-2.5 pt-2 border-t border-teal-500/20 flex items-center justify-between text-[11px]">
                <span className="opacity-80">Saldo traído de 1ra Quincena</span>
                <span className="font-mono font-bold">Caja: {formatCOP(carriedFromPreviousQReal)}</span>
              </div>
            </div>
          )}

          {/* Card 2/3: Gastos Fijos de esta Quincena */}
          <div
            onClick={() => onSelectTab && onSelectTab('fijos')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer group shadow-sm ${
              isDark
                ? 'bg-[#1a152e] border-purple-500/30 hover:border-purple-400'
                : 'bg-purple-50/60 border-purple-200 hover:border-purple-400'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center space-x-1.5">
                <CreditCard className="w-4 h-4" />
                <span>{isQ2 && hasSurplusCarry ? '3' : '2'}. Gastos Fijos</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300">
                {billsList.length} facturas
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-purple-700 dark:text-purple-300 tracking-tight font-mono">
              -{formatCOP(billsEstimated)}
            </div>
            <div className="mt-2.5 pt-2 border-t border-purple-500/20 flex items-center justify-between text-[11px]">
              <span className="text-purple-700/80 dark:text-purple-400/80 font-medium">
                Pagado: <strong>{formatCOP(billsPaid)}</strong>
              </span>
              <span className="text-slate-500 dark:text-slate-400 font-mono">
                Por pagar: {formatCOP(billsPending)}
              </span>
            </div>
          </div>

          {/* Card 3/4: Gastos Extras de esta Quincena */}
          <div
            onClick={() => onSelectTab && onSelectTab('extras')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer group shadow-sm ${
              isDark
                ? 'bg-[#221422] border-pink-500/30 hover:border-pink-400'
                : 'bg-pink-50/60 border-pink-200 hover:border-pink-400'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400 flex items-center space-x-1.5">
                <ShoppingBag className="w-4 h-4" />
                <span>{isQ2 && hasSurplusCarry ? '4' : '3'}. Gastos Extras</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-600 dark:text-pink-300">
                {extrasList.length} items
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-pink-700 dark:text-pink-300 tracking-tight font-mono">
              -{formatCOP(extrasEstimated)}
            </div>
            <div className="mt-2.5 pt-2 border-t border-pink-500/20 flex items-center justify-between text-[11px]">
              <span className="text-pink-700/80 dark:text-pink-400/80 font-medium">
                Pagado: <strong>{formatCOP(extrasPaid)}</strong>
              </span>
              <span className="text-slate-500 dark:text-slate-400 font-mono">
                Pend: {formatCOP(extrasPending)}
              </span>
            </div>
          </div>

          {/* Card 4/5: Saldo Disponible / Cierre de Quincena */}
          <div
            className={`p-4 rounded-2xl border transition-all relative overflow-hidden shadow-md ${
              finalEstimatedBalance >= 0
                ? isDark
                  ? 'bg-gradient-to-br from-[#0c2420] via-[#0e302b] to-[#0b2422] border-emerald-400/50'
                  : 'bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-50 border-emerald-400'
                : isDark
                  ? 'bg-gradient-to-br from-[#2a1313] to-[#3d1a1a] border-rose-500/50'
                  : 'bg-gradient-to-br from-rose-100 to-red-50 border-rose-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 text-slate-800 dark:text-slate-200">
                <Wallet className="w-4 h-4 text-cyan-400" />
                <span>{isQ2 ? 'Saldo Cierre Mes' : 'Saldo Resultante Q1'}</span>
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-black ${
                  finalEstimatedBalance >= 0
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                }`}
              >
                {finalEstimatedBalance >= 0 ? '✓ Superávit' : '⚠️ Déficit'}
              </span>
            </div>

            <div
              className={`text-xl sm:text-2xl font-black tracking-tight font-mono ${
                finalEstimatedBalance >= 0
                  ? 'text-emerald-800 dark:text-emerald-200'
                  : 'text-rose-700 dark:text-rose-300'
              }`}
            >
              {finalEstimatedBalance >= 0 ? '+' : ''}{formatCOP(finalEstimatedBalance)}
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-300 dark:border-slate-700 flex items-center justify-between text-[11px]">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                Caja Real: <strong>{formatCOP(realCashInHand)}</strong>
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                Ahorro: {savingsPercentage}%
              </span>
            </div>
          </div>

        </div>

        {/* 3. Mathematical Formula Chain */}
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border text-xs flex flex-wrap items-center gap-2 font-mono ${
            isDark ? 'bg-[#0f172a]/70 border-slate-800' : 'bg-white/80 border-slate-200'
          }`}
        >
          <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-slate-400 shrink-0">
            Fórmula {quincenaKey.toUpperCase()}:
          </span>

          <div className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 font-bold">
            Ingresos {quincenaKey.toUpperCase()}: {formatCOP(incomesEstimated)}
          </div>

          {isQ2 && carriedFromPreviousQ !== 0 && (
            <>
              <span className="font-black text-slate-400">{carriedFromPreviousQ >= 0 ? '+' : '−'}</span>
              <div className="px-2.5 py-1 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-300 font-bold">
                Remanente Q1: {formatCOP(Math.abs(carriedFromPreviousQ))}
              </div>
            </>
          )}

          <span className="font-black text-slate-400">−</span>

          <div className="px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-300 font-bold">
            Fijos: {formatCOP(billsEstimated)}
          </div>

          <span className="font-black text-slate-400">=</span>

          <div className="px-2.5 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-300 font-bold">
            Queda tras Fijos: {formatCOP(remainingAfterFixed)}
          </div>

          <span className="font-black text-slate-400">−</span>

          <div className="px-2.5 py-1 rounded-lg bg-pink-500/15 border border-pink-500/30 text-pink-600 dark:text-pink-300 font-bold">
            Extras: {formatCOP(extrasEstimated)}
          </div>

          <span className="font-black text-slate-400">=</span>

          <div
            className={`px-3 py-1 rounded-lg border font-black shadow-xs ${
              finalEstimatedBalance >= 0
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-700 dark:text-emerald-200'
                : 'bg-rose-500/20 border-rose-400 text-rose-700 dark:text-rose-200'
            }`}
          >
            Saldo: {formatCOP(finalEstimatedBalance)}
          </div>
        </div>

        {/* 4. Table Details (Collapsible) */}
        {showTableDetails && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr
                  className={`border-b font-mono uppercase tracking-wider text-[11px] ${
                    isDark ? 'bg-[#111c33] text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <th className="py-2.5 px-4">Concepto {quincenaKey.toUpperCase()}</th>
                  <th className="py-2.5 px-3 text-center">Registros</th>
                  <th className="py-2.5 px-3 text-right">Monto Estimado</th>
                  <th className="py-2.5 px-3 text-right">Monto Real / Cobrado</th>
                  <th className="py-2.5 px-3 text-right">Pendiente</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                  <th className="py-2.5 px-4 text-center">Ver Checklist</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-sans">
                {/* Ingresos */}
                <tr className={isDark ? 'hover:bg-[#152037]' : 'hover:bg-slate-50'}>
                  <td className="py-2.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-2">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Ingresos {quincenaKey.toUpperCase()}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">{incomesList.length} fuentes</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    +{formatCOP(incomesEstimated)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-300">
                    +{formatCOP(incomesReceived)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                    {formatCOP(incomesPending)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                      {incomesList.filter((i) => i.isReceived).length} de {incomesList.length} cobrados
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onSelectTab && onSelectTab('ingresos')}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Ir a Ingresos →
                    </button>
                  </td>
                </tr>

                {/* Gastos Fijos */}
                <tr className={isDark ? 'hover:bg-[#152037]' : 'hover:bg-slate-50'}>
                  <td className="py-2.5 px-4 font-bold text-purple-600 dark:text-purple-400 flex items-center space-x-2">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Gastos Fijos {quincenaKey.toUpperCase()}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">{billsList.length} facturas</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-600 dark:text-purple-400">
                    -{formatCOP(billsEstimated)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-600 dark:text-purple-300">
                    -{formatCOP(billsPaid)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                    {formatCOP(billsPending)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-600 dark:text-purple-300">
                      {billsList.filter((b) => b.status === 'pagado').length} de {billsList.length} pagadas
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onSelectTab && onSelectTab('fijos')}
                      className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                    >
                      Ir a Fijos →
                    </button>
                  </td>
                </tr>

                {/* Gastos Extras */}
                <tr className={isDark ? 'hover:bg-[#152037]' : 'hover:bg-slate-50'}>
                  <td className="py-2.5 px-4 font-bold text-pink-600 dark:text-pink-400 flex items-center space-x-2">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Gastos Extras {quincenaKey.toUpperCase()}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">{extrasList.length} items</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-pink-600 dark:text-pink-400">
                    -{formatCOP(extrasEstimated)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-pink-600 dark:text-pink-300">
                    -{formatCOP(extrasPaid)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                    {formatCOP(extrasPending)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-600 dark:text-pink-300">
                      {extrasList.filter((e) => e.isPaid).length} de {extrasList.length} pagados
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onSelectTab && onSelectTab('extras')}
                      className="text-xs font-bold text-pink-600 dark:text-pink-400 hover:underline cursor-pointer"
                    >
                      Ir a Extras →
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Transfer indicator / closure banner */}
        {!isQ2 ? (
          <div
            className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
              finalEstimatedBalance >= 0
                ? isDark
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : isDark
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">⬇️</span>
              <div>
                <strong className="font-bold block">
                  Traspaso a la Segunda Quincena (Q2):
                </strong>
                <span className="opacity-80">
                  {finalEstimatedBalance >= 0
                    ? `Tu superávit resultante de ${formatCOP(finalEstimatedBalance)} se transfiere a favor de la Quincena 2 para sumarse a tus ingresos de fin de mes.`
                    : `Tu déficit de ${formatCOP(Math.abs(finalEstimatedBalance))} se arrastra a la Quincena 2 y restará de tu capacidad de gasto.`}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0 font-mono font-black text-sm">
              {finalEstimatedBalance >= 0 ? '+' : ''}{formatCOP(finalEstimatedBalance)}
            </div>
          </div>
        ) : (
          <div
            className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
              finalEstimatedBalance >= 0
                ? isDark
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200'
                  : 'bg-cyan-50 border-cyan-200 text-cyan-900'
                : isDark
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">🏁</span>
              <div>
                <strong className="font-bold block">
                  Cierre Final del Mes (Módulo 2):
                </strong>
                <span className="opacity-80">
                  {finalEstimatedBalance >= 0
                    ? `Resultado neto acumulado tras cubrir todos los compromisos de la Q1 y la Q2. Disponible para ahorro libre o inversión: ${formatCOP(finalEstimatedBalance)}.`
                    : `Déficit proyectado al cierre del mes: ${formatCOP(Math.abs(finalEstimatedBalance))}. Se sugiere ajustar gastos extras o revisar facturas.`}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0 font-mono font-black text-sm">
              {finalEstimatedBalance >= 0 ? '+' : ''}{formatCOP(finalEstimatedBalance)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
