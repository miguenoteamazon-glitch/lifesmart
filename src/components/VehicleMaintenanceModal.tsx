import React, { useState, useEffect } from 'react';
import { Vehicle, VehicleMaintenance, MaintenanceCategory, MaintenancePriority, MaintenanceStatus } from '../types';
import { getMaintenanceCategoryMeta } from '../utils/vehicleHelpers';
import { useTheme } from '../context/ThemeContext';
import { 
  X, 
  ShieldCheck, 
  Wrench, 
  Sparkles, 
  Calendar, 
  DollarSign, 
  Gauge, 
  Check, 
  Tag, 
  Info,
  Layers,
  FileText,
  Clock,
  UserCheck
} from 'lucide-react';

interface VehicleMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (maint: Omit<VehicleMaintenance, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  vehicle: Vehicle;
  editingMaintenance?: VehicleMaintenance | null;
  defaultCategory?: MaintenanceCategory;
}

const PREVENTIVE_SUGGESTIONS = [
  'Cambio de pastillas de frenos y líquido DOT 4',
  'Cambio de filtro de aire de motor y cabina',
  'Cambio de filtro de combustible (gasolina/diésel)',
  'Rotación, alineación y balanceo de llantas',
  'Cambio de bujías de encendido (Iridium)',
  'Cambio de líquido refrigerante / anticongelante',
  'Cambio de kit de distribución / correa de accesorios',
  'Revisión y cambio de aceite de transmisión / caja',
];

const CORRECTIVE_SUGGESTIONS = [
  'Reparar ruido en suspensión delantera / bujes',
  'Cambiar amortiguadores traseros por fuga',
  'Reemplazar batería de arranque (12V)',
  'Reparar fuga en manguera de radiador',
  'Cambiar sensor de oxígeno / sensor ABS',
  'Reparación de aire acondicionado / recarga gas',
  'Rectificación de discos de freno por vibración',
  'Reparar pinchazo / cambio de neumático',
];

const UPGRADE_SUGGESTIONS = [
  'Polarizado nano-cerámico con reducción de calor',
  'Pantalla táctil con Apple CarPlay y Android Auto',
  'Instalar cámara de reversa HD y sensores',
  'Luces LED principales y exploradoras',
  'Barras de techo portaequipaje / parrilla',
  'Tapicería en cuero / fundas a medida',
  'Protector de cárter de acero o aluminio',
  'Tratamiento cerámico de pintura y detallado',
];

export const VehicleMaintenanceModal: React.FC<VehicleMaintenanceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  vehicle,
  editingMaintenance,
  defaultCategory = 'preventivo',
}) => {
  const { isDark } = useTheme();

  const [category, setCategory] = useState<MaintenanceCategory>(defaultCategory);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<MaintenanceStatus>('pendiente');
  const [priority, setPriority] = useState<MaintenancePriority>('media');
  const [targetMileage, setTargetMileage] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [completedDate, setCompletedDate] = useState('');
  const [cost, setCost] = useState<number | ''>('');
  const [workshop, setWorkshop] = useState('');
  const [partsInput, setPartsInput] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingMaintenance) {
      setCategory(editingMaintenance.category);
      setTitle(editingMaintenance.title || '');
      setDescription(editingMaintenance.description || '');
      setStatus(editingMaintenance.status || 'pendiente');
      setPriority(editingMaintenance.priority || 'media');
      setTargetMileage(editingMaintenance.targetMileage ?? '');
      setDueDate(editingMaintenance.dueDate || '');
      setCompletedDate(editingMaintenance.completedDate || '');
      setCost(editingMaintenance.cost ?? '');
      setWorkshop(editingMaintenance.workshop || '');
      setPartsInput((editingMaintenance.parts || []).join(', '));
      setNotes(editingMaintenance.notes || '');
    } else {
      setCategory(defaultCategory);
      setTitle('');
      setDescription('');
      setStatus('pendiente');
      setPriority('media');
      setTargetMileage(vehicle.currentMileage ? vehicle.currentMileage + 2000 : '');
      setDueDate('');
      setCompletedDate('');
      setCost('');
      setWorkshop('');
      setPartsInput('');
      setNotes('');
    }
  }, [editingMaintenance, defaultCategory, isOpen, vehicle]);

  if (!isOpen) return null;

  const currentMeta = getMaintenanceCategoryMeta(category);

  const getSuggestions = () => {
    if (category === 'preventivo') return PREVENTIVE_SUGGESTIONS;
    if (category === 'correctivo') return CORRECTIVE_SUGGESTIONS;
    return UPGRADE_SUGGESTIONS;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parts = partsInput
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    const payload = {
      ...(editingMaintenance ? { id: editingMaintenance.id } : {}),
      vehicleId: vehicle.id,
      category,
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      targetMileage: targetMileage !== '' ? Number(targetMileage) : undefined,
      dueDate: dueDate || undefined,
      completedDate: status === 'completado' ? (completedDate || new Date().toISOString().split('T')[0]) : undefined,
      cost: cost !== '' ? Number(cost) : undefined,
      workshop: workshop.trim() || undefined,
      parts: parts.length > 0 ? parts : undefined,
      notes: notes.trim() || undefined,
    };

    onSave(payload);
    onClose();
  };

  return (
    <div 
      id="maint-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto"
    >
      <div 
        id="modal-vehicle-maintenance"
        className={`relative w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border ${
          isDark 
            ? 'bg-[#0f172a] border-slate-700 text-slate-100 shadow-black/80' 
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/80'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-5 sm:p-6 border-b ${
          isDark ? 'border-slate-800 bg-[#141e33]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-mono font-bold px-3 py-0.5 rounded-full border ${
                isDark ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-sky-100 text-sky-800 border-sky-300'
              }`}>
                {vehicle.name} {vehicle.plate ? `· ${vehicle.plate}` : ''}
              </span>
              <span className={`text-xs font-mono font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Odómetro actual: {vehicle.currentMileage?.toLocaleString()} km
              </span>
            </div>
            <h3 className={`text-lg sm:text-xl font-black tracking-tight mt-1.5 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {editingMaintenance ? 'Editar Registro de Mantenimiento' : 'Añadir Mantenimiento, Reparación o Mejora'}
            </h3>
          </div>
          <button
            id="btn-close-maint-modal"
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
              isDark 
                ? 'text-slate-300 hover:text-white hover:bg-slate-800' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Category Selector */}
          <div>
            <label className={`block text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>
              ¿Qué tipo de trabajo vas a registrar? <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {(['preventivo', 'correctivo', 'mejora'] as MaintenanceCategory[]).map((cat) => {
                const meta = getMaintenanceCategoryMeta(cat);
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    id={`btn-maint-cat-${cat}`}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      isSelected
                        ? isDark
                          ? 'shadow-lg ring-2 ring-sky-400 font-bold bg-[#1e293b]'
                          : 'shadow-md ring-2 ring-sky-500 font-bold bg-white'
                        : isDark
                          ? 'bg-[#1e293b] border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                    style={
                      isSelected
                        ? {
                            borderColor: meta.color,
                            color: isDark ? '#ffffff' : '#0f172a',
                          }
                        : {}
                    }
                  >
                    <div style={{ color: meta.color }}>
                      {cat === 'preventivo' && <ShieldCheck className="w-5 h-5" />}
                      {cat === 'correctivo' && <Wrench className="w-5 h-5" />}
                      {cat === 'mejora' && <Sparkles className="w-5 h-5" />}
                    </div>
                    <span className="text-xs sm:text-sm">{meta.shortLabel}</span>
                  </button>
                );
              })}
            </div>
            <p className={`text-xs mt-2 font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              📌 {currentMeta.description}
            </p>
          </div>

          {/* Quick Suggestions Chips */}
          <div className={`p-3.5 rounded-2xl border ${
            isDark ? 'bg-[#0b1326] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`text-xs font-bold block mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              ⚡ Sugerencias frecuentes para {currentMeta.shortLabel} (haz clic para autocompletar):
            </span>
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
              {getSuggestions().map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTitle(sug)}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition-all text-left cursor-pointer font-medium ${
                    isDark 
                      ? 'bg-[#1e293b] hover:bg-sky-500/20 text-slate-200 hover:text-sky-300 border-slate-700 hover:border-sky-400' 
                      : 'bg-white hover:bg-sky-50 text-slate-800 hover:text-sky-900 border-slate-300 hover:border-sky-400 shadow-xs'
                  }`}
                >
                  + {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label 
              htmlFor="input-maint-title"
              className={`block text-xs sm:text-sm font-bold mb-1.5 ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              }`}
            >
              ¿Cuál es el título o tarea a realizar? <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-maint-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Cambio de pastillas de frenos delanteras..."
              className={`w-full rounded-xl px-4 py-3 text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                isDark 
                  ? 'bg-[#1e293b] border-slate-700 text-white placeholder:text-slate-400 focus:border-sky-400' 
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500'
              }`}
            />
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label 
                htmlFor="select-maint-status"
                className={`block text-xs sm:text-sm font-bold mb-1.5 ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                Estado Actual
              </label>
              <select
                id="select-maint-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as MaintenanceStatus)}
                className={`w-full rounded-xl px-4 py-3 text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer ${
                  isDark 
                    ? 'bg-[#1e293b] border-slate-700 text-white focus:border-sky-400' 
                    : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500'
                }`}
              >
                <option value="pendiente">⏳ Pendiente / Por hacer</option>
                <option value="en_progreso">⚙️ En Taller / En Progreso</option>
                <option value="completado">✅ Realizado / Completado</option>
              </select>
            </div>

            <div>
              <label 
                htmlFor="select-maint-priority"
                className={`block text-xs sm:text-sm font-bold mb-1.5 ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                Nivel de Prioridad
              </label>
              <select
                id="select-maint-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as MaintenancePriority)}
                className={`w-full rounded-xl px-4 py-3 text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer ${
                  isDark 
                    ? 'bg-[#1e293b] border-slate-700 text-white focus:border-sky-400' 
                    : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500'
                }`}
              >
                <option value="baja">🟢 Baja (cuando haya tiempo)</option>
                <option value="media">🟡 Media (rutinario)</option>
                <option value="alta">🟠 Alta (pronto)</option>
                <option value="urgente">🔴 Urgente (de inmediato)</option>
              </select>
            </div>
          </div>

          {/* Target Mileage & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label 
                htmlFor="input-maint-target-km"
                className={`block text-xs sm:text-sm font-bold mb-1.5 flex items-center gap-1.5 ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                <Gauge className="w-4 h-4 text-sky-500" />
                <span>Kilometraje Programado (km)</span>
              </label>
              <input
                id="input-maint-target-km"
                type="number"
                min="0"
                value={targetMileage}
                onChange={(e) => setTargetMileage(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder={`Ej. ${(vehicle.currentMileage || 35000) + 2000}`}
                className={`w-full rounded-xl px-4 py-3 text-sm font-mono font-bold border transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  isDark 
                    ? 'bg-[#1e293b] border-slate-700 text-white placeholder:text-slate-400 focus:border-sky-400' 
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500'
                }`}
              />
              <span className={`text-xs mt-1 block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                A qué km del vehículo le toca este mantenimiento.
              </span>
            </div>

            <div>
              <label 
                htmlFor="input-maint-due-date"
                className={`block text-xs sm:text-sm font-bold mb-1.5 flex items-center gap-1.5 ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>Fecha Estimada / Límite</span>
              </label>
              <input
                id="input-maint-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full rounded-xl px-4 py-3 text-sm font-mono font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  isDark 
                    ? 'bg-[#1e293b] border-slate-700 text-white focus:border-sky-400' 
                    : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500'
                }`}
              />
              <span className={`text-xs mt-1 block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Día objetivo para llevarlo o realizarlo.
              </span>
            </div>
          </div>

          {/* Cost & Workshop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label 
                htmlFor="input-maint-cost"
                className={`block text-xs sm:text-sm font-bold mb-1.5 flex items-center gap-1.5 ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>Costo Estimado o Pagado ($)</span>
              </label>
              <input
                id="input-maint-cost"
                type="number"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Ej. 320000"
                className={`w-full rounded-xl px-4 py-3 text-sm font-mono font-bold border transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isDark 
                    ? 'bg-[#1e293b] border-slate-700 text-emerald-300 placeholder:text-slate-400 focus:border-emerald-400' 
                    : 'bg-white border-slate-300 text-emerald-800 placeholder:text-slate-400 focus:border-emerald-500'
                }`}
              />
            </div>

            <div>
              <label 
                htmlFor="input-maint-workshop"
                className={`block text-xs sm:text-sm font-bold mb-1.5 ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                Taller / Mecánico / Proveedor
              </label>
              <input
                id="input-maint-workshop"
                type="text"
                value={workshop}
                onChange={(e) => setWorkshop(e.target.value)}
                placeholder="Ej. Taller Autorizado Mazda, Frenos & Embragues..."
                className={`w-full rounded-xl px-4 py-3 text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  isDark 
                    ? 'bg-[#1e293b] border-slate-700 text-white placeholder:text-slate-400 focus:border-sky-400' 
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500'
                }`}
              />
            </div>
          </div>

          {/* Parts required */}
          <div>
            <label 
              htmlFor="input-maint-parts"
              className={`block text-xs sm:text-sm font-bold mb-1.5 flex items-center gap-1.5 ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              }`}
            >
              <Tag className="w-4 h-4 text-sky-500" />
              <span>Repuestos o Materiales (separados por coma)</span>
            </label>
            <input
              id="input-maint-parts"
              type="text"
              value={partsInput}
              onChange={(e) => setPartsInput(e.target.value)}
              placeholder="Ej. Pastillas Brembo, 1L Líquido DOT 4, Filtro Mann..."
              className={`w-full rounded-xl px-4 py-3 text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                isDark 
                  ? 'bg-[#1e293b] border-slate-700 text-white placeholder:text-slate-400 focus:border-sky-400' 
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500'
              }`}
            />
          </div>

          {/* Description / Instructions */}
          <div>
            <label 
              htmlFor="textarea-maint-description"
              className={`block text-xs sm:text-sm font-bold mb-1.5 ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              }`}
            >
              Descripción / Notas adicionales
            </label>
            <textarea
              id="textarea-maint-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles sobre el síntoma, garantía del repuesto, especificaciones o recomendaciones del mecánico..."
              className={`w-full rounded-xl px-4 py-3 text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                isDark 
                  ? 'bg-[#1e293b] border-slate-700 text-white placeholder:text-slate-400 focus:border-sky-400' 
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500'
              }`}
            />
          </div>

          {/* Footer Buttons */}
          <div className={`flex items-center justify-between pt-5 border-t gap-3 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <button
              id="btn-cancel-maint"
              type="button"
              onClick={onClose}
              className={`px-5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                isDark 
                  ? 'border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800' 
                  : 'border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Cancelar
            </button>

            <button
              id="btn-save-maint-submit"
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-sky-500/25 transition-all cursor-pointer flex items-center space-x-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{editingMaintenance ? 'Guardar Cambios' : 'Registrar Mantenimiento'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
