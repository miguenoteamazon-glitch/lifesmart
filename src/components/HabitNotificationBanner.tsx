import React, { useState, useEffect } from 'react';
import { Habit } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  getHabitNotificationStatus,
  requestHabitNotificationPermission,
  sendTestHabitNotification,
  setHabitNotificationsEnabled,
  checkAndTriggerNightHabitNotification,
  HabitNotificationStatus,
} from '../utils/habitNotificationScheduler';
import {
  Bell,
  BellRing,
  BellOff,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Globe,
  Sparkles,
  Volume2,
  Settings,
} from 'lucide-react';

interface HabitNotificationBannerProps {
  habits: Habit[];
  onOpenPushSettings?: () => void;
}

export const HabitNotificationBanner: React.FC<HabitNotificationBannerProps> = ({ habits, onOpenPushSettings }) => {
  const { isDark } = useTheme();
  const [status, setStatus] = useState<HabitNotificationStatus>(() =>
    getHabitNotificationStatus(habits)
  );
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Update status when habits change
  useEffect(() => {
    setStatus(getHabitNotificationStatus(habits));
  }, [habits]);

  // Periodic check at runtime (checks if it's 22:00 in local timezone)
  useEffect(() => {
    // Immediate check on mount
    checkAndTriggerNightHabitNotification(habits);

    // Interval check every 60 seconds
    const interval = setInterval(() => {
      checkAndTriggerNightHabitNotification(habits);
      setStatus(getHabitNotificationStatus(habits));
    }, 60000);

    return () => clearInterval(interval);
  }, [habits]);

  const handleToggle = async () => {
    if (!status.isSupported) {
      setFeedbackMsg('Las notificaciones no están soportadas en este navegador.');
      return;
    }

    if (status.permission !== 'granted') {
      const granted = await requestHabitNotificationPermission();
      setStatus(getHabitNotificationStatus(habits));
      if (granted) {
        setFeedbackMsg('¡Notificaciones activadas! Te avisaremos a las 22:00 si tienes hábitos pendientes.');
        setTimeout(() => setFeedbackMsg(null), 5000);
      } else {
        setFeedbackMsg('Permiso de notificaciones denegado en tu navegador.');
        setTimeout(() => setFeedbackMsg(null), 5000);
      }
      return;
    }

    const nextState = !status.isEnabled;
    setHabitNotificationsEnabled(nextState);
    setStatus(getHabitNotificationStatus(habits));
    setFeedbackMsg(
      nextState
        ? 'Recordatorios nocturnos (22:00) activados.'
        : 'Recordatorios nocturnos pausados.'
    );
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleTestNotification = () => {
    if (status.permission !== 'granted') {
      handleToggle();
      return;
    }
    const success = sendTestHabitNotification(habits);
    if (success) {
      setFeedbackMsg('🔔 ¡Notificación de prueba enviada a tu navegador!');
    } else {
      setFeedbackMsg('No se pudo enviar la notificación. Verifica permisos del navegador.');
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const isGrantedAndEnabled = status.permission === 'granted' && status.isEnabled;

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-md ${
        isGrantedAndEnabled
          ? isDark
            ? 'bg-gradient-to-r from-[#0c182c] via-[#0d2238] to-[#0c182c] border-emerald-500/30'
            : 'bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-emerald-50/70 border-emerald-200'
          : isDark
          ? 'bg-[#10172c] border-[#223354]'
          : 'bg-slate-50 border-slate-200'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Left: Icon & Description */}
        <div className="flex items-start space-x-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
              isGrantedAndEnabled
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : status.permission === 'denied'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
            }`}
          >
            {isGrantedAndEnabled ? (
              <BellRing className="w-5 h-5 animate-bounce" />
            ) : status.permission === 'denied' ? (
              <BellOff className="w-5 h-5" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <span
                className={`text-xs font-mono font-bold uppercase tracking-wider ${
                  isGrantedAndEnabled
                    ? 'text-emerald-400'
                    : isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Aviso Preventivo de Hábitos (2h antes de fin de día)
              </span>

              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  isGrantedAndEnabled
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : status.permission === 'denied'
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                }`}
              >
                {isGrantedAndEnabled
                  ? 'Activo (22:00 hrs)'
                  : status.permission === 'denied'
                  ? 'Bloqueado'
                  : 'Requiere Permiso'}
              </span>
            </div>

            <p
              className={`text-xs leading-relaxed ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Te notifica automáticamente en el navegador a las <strong>22:00 (10:00 PM)</strong> si tienes micro-acciones pendientes hoy, respetando tu zona horaria local.
            </p>

            {/* Timezone and Target details */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono">
              <div className="flex items-center space-x-1 text-cyan-400">
                <Globe className="w-3.5 h-3.5" />
                <span>Zona: {status.userTimezone}</span>
              </div>
              <div className="flex items-center space-x-1 text-amber-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Disparo diario: 22:00</span>
              </div>
              {status.pendingHabitsCount > 0 ? (
                <div className="text-emerald-400 font-bold">
                  • {status.pendingHabitsCount} pendiente(s) hoy
                </div>
              ) : (
                <div className="text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>¡Todo completado hoy!</span>
                </div>
              )}
            </div>

            {feedbackMsg && (
              <div
                className={`text-xs font-semibold mt-2 px-3 py-1.5 rounded-lg inline-block border ${
                  feedbackMsg.includes('denegado') || feedbackMsg.includes('no están')
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                }`}
              >
                {feedbackMsg}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
          {onOpenPushSettings && (
            <button
              onClick={onOpenPushSettings}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95 ${
                isDark
                  ? 'border-[#2c4068] bg-[#0b1324] text-amber-300 hover:text-white hover:border-amber-400'
                  : 'border-slate-300 bg-white text-amber-600 hover:text-amber-800 hover:border-amber-500 shadow-sm'
              }`}
              title="Configurar todas las opciones de Notificaciones Web Push"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span>Configurar</span>
            </button>
          )}

          <button
            onClick={handleTestNotification}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95 ${
              isDark
                ? 'border-[#2c4068] bg-[#0b1324] text-slate-300 hover:text-white hover:border-cyan-400'
                : 'border-slate-300 bg-white text-slate-700 hover:text-slate-900 hover:border-cyan-500 shadow-sm'
            }`}
            title="Probar notificación ahora en tu navegador"
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Probar Aviso</span>
          </button>

          <button
            onClick={handleToggle}
            className={`px-4 py-1.5 rounded-xl font-mono text-xs font-extrabold transition-all cursor-pointer shadow-sm active:scale-95 flex items-center space-x-1.5 ${
              isGrantedAndEnabled
                ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black'
                : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:brightness-105 text-white'
            }`}
          >
            {isGrantedAndEnabled ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Activado</span>
              </>
            ) : status.permission === 'denied' ? (
              <span>Desbloquear</span>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Activar Aviso</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
