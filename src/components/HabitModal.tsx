import React, { useState, useEffect } from 'react';
import { Habit, CategoryInfo } from '../types';
import { X, Sparkles, Plus, Clock, Target, Check, Calendar } from 'lucide-react';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: Omit<Habit, 'id' | 'streak' | 'bestStreak' | 'completedDates' | 'createdAt'> & { id?: string }) => void;
  categories: CategoryInfo[];
  initialHabit?: Habit | null;
}

const COMMON_HABIT_TEMPLATES = [
  { title: 'Barrer la casa', category: 'actividades_pendientes', icon: '🧹', duration: 15, time: '08:30', description: 'Mantener pisos limpios y sala ordenada' },
  { title: 'Bajar y pasear el perro', category: 'familia_relaciones', icon: '🐕', duration: 20, time: '07:30', description: 'Paseo relajante y aire fresco con la mascota' },
  { title: 'Caminar 30 minutos', category: 'salud_deporte', icon: '🚶', duration: 30, time: '18:00', description: 'Caminata rápida para activar el cuerpo' },
  { title: 'Beber 2L de agua', category: 'salud_deporte', icon: '💧', duration: 5, time: '09:00', description: 'Mantener hidratación óptima durante el día' },
  { title: 'Leer 10 páginas', category: 'aprendizaje', icon: '📖', duration: 15, time: '21:30', description: 'Lectura diaria de crecimiento o novela' },
  { title: 'Lavar los platos después de cenar', category: 'actividades_pendientes', icon: '🍽️', duration: 10, time: '21:00', description: 'Cocina limpia antes de ir a descansar' },
  { title: '5 minutos de meditación / respiración', category: 'bienestar_mente', icon: '🧘', duration: 5, time: '07:00', description: 'Enfoque y calma para iniciar la mañana' },
  { title: 'Revisar finanzas y gastos del día', category: 'finanzas_hogar', icon: '💰', duration: 5, time: '20:00', description: 'Anotar gastos y tener control del presupuesto' },
];

const EMOJI_OPTIONS = ['🧹', '🐕', '🚶', '💧', '📖', '🧘', '🍽️', '🏋️', '🚴', '🥗', '☕', '🛌', '💰', '🎯', '✨', '💻', '🌱', '☀️'];

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  initialHabit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0]?.id || 'actividades_pendientes');
  const [icon, setIcon] = useState('🧹');
  const [frequency, setFrequency] = useState<'daily' | 'weekdays' | 'weekends' | 'custom'>('daily');
  const [targetDaysPerWeek, setTargetDaysPerWeek] = useState(7);
  const [targetTime, setTargetTime] = useState('08:00');
  const [targetDurationMinutes, setTargetDurationMinutes] = useState(15);
  const [color, setColor] = useState('#00f2ff');

  useEffect(() => {
    if (initialHabit) {
      setTitle(initialHabit.title || '');
      setDescription(initialHabit.description || '');
      setCategory(initialHabit.category || categories[0]?.id || 'actividades_pendientes');
      setIcon(initialHabit.icon || '🧹');
      setFrequency(initialHabit.frequency || 'daily');
      setTargetDaysPerWeek(initialHabit.targetDaysPerWeek || 7);
      setTargetTime(initialHabit.targetTime || '08:00');
      setTargetDurationMinutes(initialHabit.targetDurationMinutes || 15);
      setColor(initialHabit.color || '#00f2ff');
    } else {
      setTitle('');
      setDescription('');
      setCategory(categories[0]?.id || 'actividades_pendientes');
      setIcon('🧹');
      setFrequency('daily');
      setTargetDaysPerWeek(7);
      setTargetTime('08:00');
      setTargetDurationMinutes(15);
      setColor('#00f2ff');
    }
  }, [initialHabit, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      ...(initialHabit?.id ? { id: initialHabit.id } : {}),
      title: title.trim(),
      description: description.trim(),
      category,
      icon,
      frequency,
      targetDaysPerWeek,
      targetTime,
      targetDurationMinutes,
      color,
      archived: initialHabit?.archived || false,
    });
    onClose();
  };

  const handleApplyTemplate = (tmpl: typeof COMMON_HABIT_TEMPLATES[0]) => {
    setTitle(tmpl.title);
    setDescription(tmpl.description);
    setCategory(tmpl.category);
    setIcon(tmpl.icon);
    setTargetDurationMinutes(tmpl.duration);
    setTargetTime(tmpl.time);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-xl bg-[#0f172a] border border-[#2d3a58] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#2d3a58] flex items-center justify-between bg-[#131d36]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-2xl shadow-inner">
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {initialHabit ? 'Editar Hábito Diario' : 'Nuevo Hábito Diario'}
              </h3>
              <p className="text-xs text-slate-400">
                Seguimiento de pequeñas acciones cotidianas con racha
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Quick Preset Templates (only when creating new) */}
          {!initialHabit && (
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ejemplos Rápidos Comunes:</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {COMMON_HABIT_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl)}
                    className="px-2.5 py-1.5 rounded-xl bg-[#17233f] hover:bg-cyan-500/20 border border-[#2c3d66] hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 text-xs flex items-center space-x-1.5 transition-all text-left"
                  >
                    <span>{tmpl.icon}</span>
                    <span className="font-medium">{tmpl.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title & Emoji Selector */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase text-slate-300 font-semibold block">
              Nombre del Hábito *
            </label>
            <div className="flex items-center space-x-2">
              <div className="relative group">
                <button
                  type="button"
                  className="w-12 h-11 rounded-xl bg-[#18233e] border border-[#2d3a58] flex items-center justify-center text-xl hover:border-cyan-400 transition-colors"
                >
                  {icon}
                </button>
                {/* Emoji popover on hover/click */}
                <div className="hidden group-hover:flex absolute left-0 top-12 z-20 w-56 p-2 bg-[#121c33] border border-[#2d3a58] rounded-2xl shadow-xl flex-wrap gap-1.5">
                  {EMOJI_OPTIONS.map((em, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setIcon(em)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-base hover:bg-cyan-500/20 ${icon === em ? 'bg-cyan-500/30 ring-1 ring-cyan-400' : ''}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Barrer la casa, Bajar al perro, Caminar 30 min..."
                className="flex-1 px-4 py-2.5 bg-[#141d33] border border-[#2d3a58] rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm font-medium"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase text-slate-300 font-semibold block">
              Categoría de Vida
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#141d33] border border-[#2d3a58] rounded-xl text-slate-200 text-sm focus:outline-none focus:border-cyan-400 font-medium"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Time & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase text-slate-300 font-semibold flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Hora Preferida (Opcional)</span>
              </label>
              <input
                type="time"
                value={targetTime}
                onChange={(e) => setTargetTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#141d33] border border-[#2d3449] rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase text-slate-300 font-semibold flex items-center space-x-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span>Duración Estimada (Minutos)</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={targetDurationMinutes}
                  onChange={(e) => setTargetDurationMinutes(Math.max(1, parseInt(e.target.value) || 15))}
                  className="w-full px-3.5 py-2.5 bg-[#141d33] border border-[#2d3449] rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-400 font-mono font-bold"
                />
                <span className="text-xs text-slate-400 font-mono shrink-0">min</span>
              </div>
            </div>
          </div>

          {/* Frequency Selector */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase text-slate-300 font-semibold block">
              Frecuencia de Cumplimiento
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setFrequency('daily'); setTargetDaysPerWeek(7); }}
                className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  frequency === 'daily'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                    : 'bg-[#141d33] border-[#2d3449] text-slate-300 hover:border-slate-500'
                }`}
              >
                Todos los días (7d)
              </button>
              <button
                type="button"
                onClick={() => { setFrequency('weekdays'); setTargetDaysPerWeek(5); }}
                className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  frequency === 'weekdays'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                    : 'bg-[#141d33] border-[#2d3449] text-slate-300 hover:border-slate-500'
                }`}
              >
                Lun a Vie (5d)
              </button>
              <button
                type="button"
                onClick={() => { setFrequency('weekends'); setTargetDaysPerWeek(2); }}
                className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  frequency === 'weekends'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                    : 'bg-[#141d33] border-[#2d3449] text-slate-300 hover:border-slate-500'
                }`}
              >
                Fines de semana
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase text-slate-300 font-semibold block">
              Nota / Detalle (Opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="¿Por qué es importante para ti este hábito o qué detalle debes tener en cuenta?"
              className="w-full px-3.5 py-2 bg-[#141d33] border border-[#2d3449] rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#2d3449] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#2d3449] text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] hover:brightness-105 text-[#00363a] font-extrabold text-xs shadow-lg shadow-cyan-500/20 flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{initialHabit ? 'Guardar Cambios' : 'Crear Hábito'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
