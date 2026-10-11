import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { MonthlyExtraExpenseItem, MonthlyExtraExpenseCategory } from '../../types';
import { acquireGmailAccessToken, fetchPurchaseEmails, ExtractedEmailExpense } from '../../utils/gmailExpenseService';
import { Mail, RefreshCw, CheckCircle2, AlertCircle, Sparkles, Plus, ExternalLink, ShieldCheck, ArrowRight, X, Calendar, DollarSign, Tag, Search, Terminal, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GmailExpenseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportExpense: (expense: Omit<MonthlyExtraExpenseItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  existingExpenses: MonthlyExtraExpenseItem[];
}

export const GmailExpenseSyncModal: React.FC<GmailExpenseSyncModalProps> = ({
  isOpen,
  onClose,
  onImportExpense,
  existingExpenses
}) => {
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedItems, setExtractedItems] = useState<ExtractedEmailExpense[]>([]);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [hasScanned, setHasScanned] = useState(false);
  const [daysFilter, setDaysFilter] = useState<number>(60);
  const [customKeyword, setCustomKeyword] = useState<string>('');
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState<boolean>(false);
  const [totalFoundInInbox, setTotalFoundInInbox] = useState<number>(0);

  if (!isOpen) return null;

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleScanGmail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await acquireGmailAccessToken();
      const { expenses: results, totalFound, scanLog } = await fetchPurchaseEmails(token, daysFilter, customKeyword);
      
      setScanLogs(scanLog);
      setTotalFoundInInbox(totalFound);

      // Match against existing expenses to avoid duplicates
      const enriched = results.map(item => {
        const isDuplicate = existingExpenses.some(ex => 
          Math.abs(Number(ex.amount) - item.amount) < 100 && 
          ex.name.toLowerCase().includes(item.merchant.toLowerCase().slice(0, 5))
        );
        return {
          ...item,
          isAlreadyImported: isDuplicate
        };
      });

      setExtractedItems(enriched);
      setHasScanned(true);
    } catch (err: any) {
      console.error('Error scanning Gmail:', err);
      setError(err.message || 'Error al conectar con Gmail. Verifica los permisos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportSingle = (item: ExtractedEmailExpense) => {
    const day = parseInt(item.date.split('-')[2], 10) || 15;
    
    onImportExpense({
      name: `${item.merchant} (${item.subject.slice(0, 30)})`,
      category: item.suggestedCategory,
      amount: item.amount,
      dayOfMonth: day,
      isPaid: true,
      paidBy: 'Miguel',
      paymentMethod: item.paymentMethod,
      receiptNotes: `Importado de Gmail: ${item.snippet.slice(0, 100)}... Fecha correo: ${item.date}`
    });

    setImportedIds(prev => new Set(prev).add(item.id));
  };

  const handleImportAll = () => {
    extractedItems
      .filter(item => !importedIds.has(item.id) && !item.isAlreadyImported)
      .forEach(handleImportSingle);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                Captura Automática desde Gmail
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-normal border border-emerald-500/20">
                  Google Workspace
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Detecta comprobantes de compra, transferencias y recibos bancarios en tu correo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-500/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Instructions Card */}
          <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
            isDark ? 'bg-indigo-950/20 border-indigo-900/40 text-indigo-200' : 'bg-indigo-50 border-indigo-100 text-indigo-900'
          }`}>
            <ShieldCheck className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-semibold block mb-0.5">Lectura Segura y Privada</span>
              Solo se leen notificaciones de compras (Bancolombia, Nequi, Davivienda, Nu, Rappi, Uber, D1, etc.). Ningún dato personal es almacenado fuera de tu sesión.
            </div>
          </div>

          {/* Action Bar with Custom Filter Input */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Buscar en los últimos:</span>
                <select
                  value={daysFilter}
                  onChange={(e) => setDaysFilter(Number(e.target.value))}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value={15}>15 días</option>
                  <option value={30}>30 días</option>
                  <option value={60}>60 días (Recomendado)</option>
                  <option value={90}>90 días</option>
                  <option value={180}>6 meses</option>
                </select>
              </div>

              <button
                onClick={handleScanGmail}
                disabled={isLoading}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-md ${
                  isLoading 
                    ? 'opacity-70 cursor-not-allowed bg-slate-700 text-slate-300' 
                    : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-500/20'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Escaneando tu Gmail...' : hasScanned ? 'Volver a Escanear' : 'Conectar y Escanear Gmail'}
              </button>
            </div>

            {/* Quick preset chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400">Filtros directos:</span>
              <button
                type="button"
                onClick={() => setCustomKeyword('from:alertasynotificaciones@an.notificacionesbancolombia.com')}
                className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                  customKeyword.includes('notificacionesbancolombia')
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                    : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                🟡 Bancolombia Alertas
              </button>
              <button
                type="button"
                onClick={() => setCustomKeyword('from:serviciopse@achcolombia.com.co')}
                className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                  customKeyword.includes('achcolombia')
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' 
                    : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                🔵 PSE / ACH Colombia
              </button>
              <button
                type="button"
                onClick={() => setCustomKeyword('from:alertasynotificaciones@an.notificacionesbancolombia.com OR from:serviciopse@achcolombia.com.co')}
                className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                  customKeyword.includes('OR')
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                ✨ Bancolombia + PSE Juntos
              </button>
              <button
                type="button"
                onClick={() => setCustomKeyword('')}
                className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                  customKeyword === '' 
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' 
                    : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                💳 Todos (Auto)
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Results List */}
          {hasScanned && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Gastos Detectados ({extractedItems.length})
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowLogs(!showLogs)}
                    className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                  >
                    <Terminal className="w-3 h-3" />
                    <span>{showLogs ? 'Ocultar diagnóstico' : 'Ver diagnóstico'}</span>
                  </button>

                  {extractedItems.length > 0 && (
                    <button
                      onClick={handleImportAll}
                      className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      Importar todos los nuevos
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Debug Logs Box if requested */}
              {showLogs && (
                <div className={`p-3 rounded-xl border text-[11px] font-mono space-y-1 ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}>
                  {scanLogs.map((log, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-indigo-400">›</span>
                      <span>{log}</span>
                    </div>
                  ))}
                  <div>Correos leídos en la cuenta: {totalFoundInInbox}</div>
                </div>
              )}

              {extractedItems.length === 0 ? (
                <div className={`p-8 rounded-xl border text-center ${
                  isDark ? 'bg-slate-800/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                  <Mail className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-400" />
                  <p className="text-sm font-semibold text-slate-200">No se reconocieron comprobantes en el período seleccionado ({daysFilter} días).</p>
                  <div className="text-xs mt-2 space-y-1 text-slate-400 max-w-md mx-auto">
                    <p>• Escribe el nombre de tu banco o comercio en el buscador (ej: <b>Bancolombia</b>, <b>Nequi</b> o <b>Compra</b>).</p>
                    <p>• O amplía el rango de búsqueda a <b>90 días</b> o <b>6 meses</b>.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {extractedItems.map((item) => {
                    const isImported = importedIds.has(item.id) || item.isAlreadyImported;
                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isImported 
                            ? isDark ? 'bg-slate-800/30 border-slate-800 opacity-60' : 'bg-slate-50 border-slate-200 opacity-60'
                            : isDark ? 'bg-slate-800/80 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm truncate">{item.merchant}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                              {item.categoryLabel}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 truncate max-w-sm">
                            {item.subject}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {item.date}
                            </span>
                            <span>•</span>
                            <span>{item.paymentMethod}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="font-bold text-sm text-emerald-400">
                            {formatCOP(item.amount)}
                          </span>

                          {isImported ? (
                            <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-500/10 px-2.5 py-1 rounded-lg">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              Importado
                            </span>
                          ) : (
                            <button
                              onClick={() => handleImportSingle(item)}
                              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Importar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-between ${
          isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'
        }`}>
          <span className="text-xs text-slate-400">
            {importedIds.size > 0 ? `${importedIds.size} gasto(s) agregados en esta sesión` : 'Listo para sincronizar'}
          </span>
          <button
            onClick={onClose}
            className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

