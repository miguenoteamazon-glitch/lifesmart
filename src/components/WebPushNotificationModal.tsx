import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  BellRing, 
  Check, 
  Clock, 
  Sparkles, 
  Flame, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert,
  Send,
  Calendar
} from 'lucide-react';
import { 
  getWebNotificationSettings, 
  saveWebNotificationSettings, 
  requestWebNotificationPermission, 
  sendTestNotification, 
  getNotificationPermission, 
  WebNotificationSettings 
} from '../services/webNotificationService';
import { Task, Habit } from '../types';
import { useTheme } from '../context/ThemeContext';

interface WebPushNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  habits: Habit[];
}

export const WebPushNotificationModal: React.FC<WebPushNotificationModalProps> = ({
  isOpen,
  onClose,
  tasks,
  habits,
}) => {
  const { isDark } = useTheme();
  const [settings, setSettings] = useState<WebNotificationSettings>(() => getWebNotificationSettings());
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPermission(getNotificationPermission());
      setSettings(getWebNotificationSettings());
      setTestSuccess(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleEnable = async () => {
    if (!settings.enabled || permission !== 'granted') {
      const granted = await requestWebNotificationPermission();
      setPermission(getNotificationPermission());
      if (granted) {
        const updated = saveWebNotificationSettings({ enabled: true });
        setSettings(updated);
      }
    } else {
      const updated = saveWebNotificationSettings({ enabled: false });
      setSettings(updated);
    }
  };

  const handleUpdateSetting = <K extends keyof WebNotificationSettings>(key: K, value: WebNotificationSettings[K]) => {
    const updated = saveWebNotificationSettings({ [key]: value });
    setSettings(updated);
  };

  const handleRunTest = async () => {
    setIsTesting(true);
    setTestSuccess(null);
    try {
      const success = await sendTestNotification();
      setTestSuccess(success);
      setPermission(getNotificationPermission());
    } finally {
      setIsTesting(false);
      setTimeout(() => setTestSuccess(null), 4000);
    }
  };

  // Preview of tasks scheduled for today that will trigger alerts
  const todayStr = new Date().toISOString().split('T')[0];
  const scheduledTasksToday = tasks.filter(t => 
    (t.assignedDate === todayStr || (!t.assignedDate && t.dueDate === todayStr)) && 
    t.status !== 'completada'
  );

  const timedHabitsToday = habits.filter(h => !h.archived && h.targetTime);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark ? 'bg-[#0f172a] border-[#223354] text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800 bg-[#0b1222]' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Servicio de Notificaciones Web Push</h2>
              <p className="text-xs text-slate-400 font-mono">Alertas del navegador para tareas próximas y hábitos</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          
          {/* Permission Status Alert Banner */}
          {permission === 'granted' ? (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start space-x-3 text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold block">Permisos de Notificación Concedidos</span>
                <span className="text-slate-300">
                  Tu navegador está listo para recibir alertas en primer y segundo plano (API de Notificaciones y Web Push).
                </span>
              </div>
            </div>
          ) : permission === 'denied' ? (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-3 text-rose-300">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold block">Notificaciones Bloqueadas en el Navegador</span>
                <span className="text-slate-300">
                  Has denegado el permiso anteriormente. Para activarlas, haz clic en el icono de candado o configuración junto a la barra de direcciones de tu navegador y cambia Notificaciones a &quot;Permitir&quot;.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-3 text-amber-300">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold block">Permiso del Navegador Pendiente</span>
                <span className="text-slate-300">
                  Activa el switch a continuación para que tu navegador te pregunte si autorizas las notificaciones de LifeBlocks.
                </span>
              </div>
            </div>
          )}

          {/* Master Toggle */}
          <div className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
            settings.enabled && permission === 'granted'
              ? 'bg-amber-500/10 border-amber-500/40'
              : isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <span className="font-bold text-sm block">Activar Notificaciones Web Push</span>
              <span className="text-xs text-slate-400">
                Recibe alertas automáticas en tu escritorio o móvil aunque estés en otra pestaña
              </span>
            </div>

            <button
              type="button"
              onClick={handleToggleEnable}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.enabled && permission === 'granted' ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  settings.enabled && permission === 'granted' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Granular Preference Options */}
          <div className="space-y-3 pt-1">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Preferencias de Recordatorios
            </h3>

            {/* 1. Alertas de Tareas Próximas */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#091124] border border-slate-800/80">
              <div className="flex items-start space-x-2.5">
                <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-xs block text-slate-200">Alertas de Tareas Próximas</span>
                  <span className="text-[11px] text-slate-400">
                    Avisa antes de la hora programada en tu horario (`timeSlot`)
                  </span>
                </div>
              </div>

              <input
                type="checkbox"
                checked={settings.notifyUpcomingTasks}
                onChange={(e) => handleUpdateSetting('notifyUpcomingTasks', e.target.checked)}
                className="w-4 h-4 accent-amber-400 cursor-pointer rounded"
              />
            </div>

            {/* 1b. Anticipación en minutos */}
            {settings.notifyUpcomingTasks && (
              <div className="flex items-center justify-between pl-7 pr-3 py-2 text-xs">
                <span className="text-slate-400">Tiempo de anticipación:</span>
                <select
                  value={settings.taskAdvanceMinutes}
                  onChange={(e) => handleUpdateSetting('taskAdvanceMinutes', parseInt(e.target.value, 10))}
                  className="px-2.5 py-1 rounded-lg bg-[#0b1428] border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value={5}>5 minutos antes</option>
                  <option value={10}>10 minutos antes</option>
                  <option value={15}>15 minutos antes</option>
                  <option value={30}>30 minutos antes</option>
                  <option value={60}>1 hora antes</option>
                </select>
              </div>
            )}

            {/* 2. Recordatorios de Hábitos Diarios */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#091124] border border-slate-800/80">
              <div className="flex items-start space-x-2.5">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-xs block text-slate-200">Recordatorios de Hábitos</span>
                  <span className="text-[11px] text-slate-400">
                    Notifica a la hora configurada de cada hábito (`targetTime`)
                  </span>
                </div>
              </div>

              <input
                type="checkbox"
                checked={settings.notifyHabits}
                onChange={(e) => handleUpdateSetting('notifyHabits', e.target.checked)}
                className="w-4 h-4 accent-amber-400 cursor-pointer rounded"
              />
            </div>

            {/* 3. Recordatorio Nocturno de Hábitos Pendientes */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#091124] border border-slate-800/80">
              <div className="flex items-start space-x-2.5">
                <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-xs block text-slate-200">Recordatorio Nocturno (21:00)</span>
                  <span className="text-[11px] text-slate-400">
                    Alerta de hábitos no registrados antes de terminar el día para proteger tu racha
                  </span>
                </div>
              </div>

              <input
                type="checkbox"
                checked={settings.notifyNightHabits}
                onChange={(e) => handleUpdateSetting('notifyNightHabits', e.target.checked)}
                className="w-4 h-4 accent-amber-400 cursor-pointer rounded"
              />
            </div>

            {/* 4. Sonido de Notificación */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#091124] border border-slate-800/80">
              <div className="flex items-start space-x-2.5">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold text-xs block text-slate-200">Sonido de Alerta (Audio Chime)</span>
                  <span className="text-[11px] text-slate-400">
                    Campana sutil sintetizada al disparar la notificación
                  </span>
                </div>
              </div>

              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => handleUpdateSetting('soundEnabled', e.target.checked)}
                className="w-4 h-4 accent-amber-400 cursor-pointer rounded"
              />
            </div>
          </div>

          {/* Scheduled Today Preview */}
          <div className="p-3.5 rounded-xl bg-[#080e1d] border border-slate-800 space-y-2">
            <span className="text-xs font-mono font-bold text-slate-400 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Compromisos vigilados hoy por el servicio:</span>
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded-lg bg-[#0c152a] border border-slate-800/60">
                <span className="text-[10px] text-slate-400 block uppercase">Tareas de Hoy</span>
                <span className="text-sm font-bold text-amber-300">{scheduledTasksToday.length} tareas</span>
                <span className="text-[9.5px] text-slate-500 block truncate">
                  {scheduledTasksToday.filter(t => t.timeSlot).length} con horario específico
                </span>
              </div>

              <div className="p-2 rounded-lg bg-[#0c152a] border border-slate-800/60">
                <span className="text-[10px] text-slate-400 block uppercase">Hábitos Monitoreados</span>
                <span className="text-sm font-bold text-cyan-300">{habits.filter(h => !h.archived).length} activos</span>
                <span className="text-[9.5px] text-slate-500 block truncate">
                  {timedHabitsToday.length} con horario configurado
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className={`px-6 py-3.5 border-t flex items-center justify-between gap-3 ${
          isDark ? 'border-slate-800 bg-[#0b1222]' : 'border-slate-100 bg-slate-50'
        }`}>
          <button
            type="button"
            onClick={handleRunTest}
            disabled={isTesting}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Send className="w-3 h-3" />
            <span>{isTesting ? 'Enviando...' : 'Probar Notificación Ahora'}</span>
          </button>

          {testSuccess === true && (
            <span className="text-xs font-mono text-emerald-400 font-bold flex items-center space-x-1 animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>¡Notificación enviada!</span>
            </span>
          )}

          {testSuccess === false && (
            <span className="text-xs font-mono text-rose-400 font-bold flex items-center space-x-1 animate-in fade-in">
              <X className="w-3.5 h-3.5" />
              <span>Revisa los permisos del navegador</span>
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
