import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { DebtItem } from '../../types';
import { Sparkles, Bot, ArrowRight, ShieldCheck, Flame, Zap, Target, TrendingDown, CheckCircle2, ChevronRight, Layers, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GeminiDebtStrategyAnalysisProps {
  debts: DebtItem[];
}

export const GeminiDebtStrategyAnalysis: React.FC<GeminiDebtStrategyAnalysisProps> = ({ debts }) => {
  const { isDark } = useTheme();
  const [selectedMethod, setSelectedMethod] = useState<'avalanche' | 'snowball'>('avalanche');
  const [analyzingDebtId, setAnalyzingDebtId] = useState<string | null>(null);

  const activeDebts = debts.filter(d => d.status === 'activa' && d.remainingAmount > 0);

  const formatCOP = (val: number) => {
    return `$ ${Number(val || 0).toLocaleString('es-CO')}`;
  };

  if (activeDebts.length === 0) return null;

  // Method 1: Avalanche (Highest Interest First)
  const avalancheSorted = [...activeDebts].sort((a, b) => {
    const rateA = Number(a.interestRate || 0);
    const rateB = Number(b.interestRate || 0);
    if (rateB !== rateA) return rateB - rateA;
    return b.remainingAmount - a.remainingAmount;
  });

  // Method 2: Snowball (Lowest Balance First for quick psychological wins)
  const snowballSorted = [...activeDebts].sort((a, b) => {
    return a.remainingAmount - b.remainingAmount;
  });

  const priorityList = selectedMethod === 'avalanche' ? avalancheSorted : snowballSorted;
  const primaryTarget = priorityList[0];

  // Specific AI advice generator per debt
  const getDebtDiagnosis = (debt: DebtItem) => {
    const rate = Number(debt.interestRate || 0);
    const remaining = debt.remainingAmount;
    const monthly = debt.monthlyPayment || 1;
    const installments = Math.ceil(remaining / monthly);

    let priorityLevel: 'URGENTE' | 'ALTA' | 'MODERADA' = 'MODERADA';
    let diagnosis = '';
    let actionTip = '';

    if (rate > 20 || debt.category === 'tarjeta') {
      priorityLevel = 'URGENTE';
      diagnosis = `Interés o costo financiero elevado (${rate}% EA / tarjeta). Cada mes que pasa sin liquidar genera un sobrecosto alto.`;
      actionTip = `Destina el 80% de tus ingresos extras o ahorros a liquidar esta deuda primero. Considera refinanciar o comprar cartera a menor tasa.`;
    } else if (remaining < 1500000 && installments <= 12) {
      priorityLevel = 'ALTA';
      diagnosis = `Saldo accesible (${formatCOP(remaining)}) y pocas cuotas restantes (${installments} cuotas). Es una candidata ideal para liquidación rápida.`;
      actionTip = `Un abono extraordinario de capital de $100.000 o $200.000 la liquidará meses antes y liberará la cuota de ${formatCOP(monthly)} para otras deudas.`;
    } else if (debt.category === 'personal') {
      priorityLevel = 'MODERADA';
      diagnosis = `Préstamo personal (${debt.creditor || 'Familiar'}). Tasa favorable o al 0%, con compromiso moral y cuota flexible (${formatCOP(monthly)}).`;
      actionTip = `Mantén la cuota mensual puntual para proteger tu reputación y confianza. Cuando liquides las deudas de mayor interés, puedes acelerar este capital.`;
    } else {
      priorityLevel = 'MODERADA';
      diagnosis = `Préstamo de mediano/largo plazo con saldo de ${formatCOP(remaining)}.`;
      actionTip = `Paga siempre el mínimo puntual y proyecta abonos voluntarios cuando recibas primas o ingresos extraordinarios.`;
    }

    return { priorityLevel, diagnosis, actionTip, installments };
  };

  return (
    <div className={`p-5 sm:p-6 rounded-3xl border shadow-xl relative overflow-hidden space-y-5 ${
      isDark 
        ? 'bg-gradient-to-br from-[#121c38] via-[#101930] to-[#0c1426] border-[#223a6b]' 
        : 'bg-gradient-to-br from-indigo-50/90 via-sky-50/50 to-white border-indigo-200'
    }`}>
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Diagnóstico & Estrategia Inteligente de Salida de Deudas
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase tracking-wider">
                Gemini AI
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Análisis comparativo de tus deudas activas para optimizar tu flujo de caja y liquidarlas en el menor tiempo posible.
            </p>
          </div>
        </div>

        {/* Method Switcher Tabs */}
        <div className={`p-1 rounded-2xl border flex items-center shrink-0 ${
          isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-300 shadow-xs'
        }`}>
          <button
            type="button"
            onClick={() => setSelectedMethod('avalanche')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              selectedMethod === 'avalanche'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Método Avalancha (Mayor Tasa)</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedMethod('snowball')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              selectedMethod === 'snowball'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Método Bola de Nieve (Menor Saldo)</span>
          </button>
        </div>
      </div>

      {/* Target Priority Spotlight Card */}
      {primaryTarget && (
        <div className={`p-4 sm:p-5 rounded-2xl border relative z-10 transition-all ${
          isDark 
            ? 'bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/60 border-indigo-500/40' 
            : 'bg-white border-indigo-200 shadow-md'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center space-x-1">
                  <Target className="w-3 h-3" />
                  <span>🎯 Atacar Primero (Prioridad #1)</span>
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {selectedMethod === 'avalanche' ? 'Mayor ahorro en intereses' : 'Victoria psicológica más rápida'}
                </span>
              </div>

              <h4 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {primaryTarget.name} ({formatCOP(primaryTarget.remainingAmount)} pendiente)
              </h4>

              <p className="text-xs text-slate-300 dark:text-slate-300 max-w-2xl leading-relaxed">
                {getDebtDiagnosis(primaryTarget).diagnosis}
              </p>
            </div>

            <div className={`p-3.5 rounded-xl border text-right shrink-0 ${
              isDark ? 'bg-[#0f172a] border-indigo-900/50' : 'bg-indigo-50/70 border-indigo-100'
            }`}>
              <span className="text-[10px] uppercase font-bold text-indigo-400 block">Plan Recomendado:</span>
              <span className="text-sm font-black text-emerald-400 block font-mono">
                Abonar {formatCOP((primaryTarget.monthlyPayment || 50000) + 50000)} / mes
              </span>
              <span className="text-[11px] text-slate-400">
                Acelera la liquidación y libera cuota mensual
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Ordered Attack Sequence */}
      <div className="space-y-3 relative z-10">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
          Orden Estratégico de Liquidación ({priorityList.length} deudas activas):
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {priorityList.map((debt, index) => {
            const diag = getDebtDiagnosis(debt);
            const isFirst = index === 0;

            return (
              <div
                key={debt.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isFirst
                    ? isDark ? 'bg-indigo-950/30 border-indigo-500/50' : 'bg-indigo-50/60 border-indigo-300'
                    : isDark ? 'bg-[#0d1628]/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      isFirst 
                        ? 'bg-amber-500 text-slate-950 font-mono' 
                        : 'bg-slate-700 text-slate-300 font-mono'
                    }`}>
                      #{index + 1}
                    </span>
                    <div>
                      <h5 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {debt.name}
                      </h5>
                      <span className="text-[11px] text-slate-400">
                        {debt.creditor || 'Acreedor'} • Cuota {formatCOP(debt.monthlyPayment)}/mes
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black font-mono text-amber-400 block">
                      {formatCOP(debt.remainingAmount)}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      diag.priorityLevel === 'URGENTE' 
                        ? 'bg-rose-500/20 text-rose-400' 
                        : diag.priorityLevel === 'ALTA'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {diag.priorityLevel}
                    </span>
                  </div>
                </div>

                {/* Advice text */}
                <div className="mt-3 pt-2.5 border-t border-slate-700/50 dark:border-slate-800 text-xs text-slate-400 leading-relaxed">
                  <p className="text-slate-300 text-[11px]">
                    💡 <span className="font-semibold text-slate-200">Consejo Gemini:</span> {diag.actionTip}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
