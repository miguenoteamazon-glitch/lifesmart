import React, { useState, useEffect } from 'react';
import { Vehicle, VehicleType } from '../types';
import { getVehicleTypeLabel, getVehicleTypeIcon } from '../utils/vehicleHelpers';
import { useTheme } from '../context/ThemeContext';
import { 
  X, 
  Car, 
  Shield, 
  Gauge, 
  Wrench, 
  Calendar, 
  DollarSign, 
  Sparkles, 
  Check, 
  AlertCircle,
  HelpCircle,
  Clock,
  FileText,
  Phone,
  ArrowRight,
  ArrowLeft,
  Info,
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  Loader2,
  Link as LinkIcon
} from 'lucide-react';
import { compressImageFile } from '../utils/imageCompressor';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  editingVehicle?: Vehicle | null;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  onClose,
  onSaveVehicle,
  editingVehicle,
}) => {
  const { isDark } = useTheme();

  // Step 1: General
  const [type, setType] = useState<VehicleType>('automovil');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [plate, setPlate] = useState('');
  const [currentMileage, setCurrentMileage] = useState<number | ''>(35000);
  const [color, setColor] = useState('#0284c7');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Step 2: Oil Change
  const [oilChangeLastMileage, setOilChangeLastMileage] = useState<number | ''>(30000);
  const [oilChangeIntervalKm, setOilChangeIntervalKm] = useState<number | ''>(5000);
  const [oilType, setOilType] = useState('100% Sintético 5W-30');
  const [oilChangeLastDate, setOilChangeLastDate] = useState('');

  // Step 3: Policy & Papers
  const [policyName, setPolicyName] = useState('Póliza Todo Riesgo');
  const [policyCompany, setPolicyCompany] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [policyExpirationDate, setPolicyExpirationDate] = useState('');
  const [policyCost, setPolicyCost] = useState<number | ''>('');
  const [techInspectionExpirationDate, setTechInspectionExpirationDate] = useState('');
  const [notes, setNotes] = useState('');

  const [activeTab, setActiveTab] = useState<'general' | 'aceite' | 'poliza'>('general');

  useEffect(() => {
    if (editingVehicle) {
      setType(editingVehicle.type || 'automovil');
      setName(editingVehicle.name || '');
      setBrand(editingVehicle.brand || '');
      setModel(editingVehicle.model || '');
      setPlate(editingVehicle.plate || '');
      setCurrentMileage(editingVehicle.currentMileage ?? 0);
      setColor(editingVehicle.color || '#0284c7');
      setImageUrl(editingVehicle.imageUrl || '');
      setUploadError(null);
      setShowUrlInput(false);

      setOilChangeLastMileage(editingVehicle.oilChangeLastMileage ?? 0);
      setOilChangeIntervalKm(editingVehicle.oilChangeIntervalKm || 5000);
      setOilType(editingVehicle.oilType || '100% Sintético 5W-30');
      setOilChangeLastDate(editingVehicle.oilChangeLastDate || '');

      setPolicyName(editingVehicle.policyName || 'Póliza Todo Riesgo');
      setPolicyCompany(editingVehicle.policyCompany || '');
      setPolicyNumber(editingVehicle.policyNumber || '');
      setPolicyExpirationDate(editingVehicle.policyExpirationDate || '');
      setPolicyCost(editingVehicle.policyCost ?? '');

      setTechInspectionExpirationDate(editingVehicle.techInspectionExpirationDate || '');
      setNotes(editingVehicle.notes || '');
    } else {
      setType('automovil');
      setName('');
      setBrand('');
      setModel('');
      setPlate('');
      setCurrentMileage(35000);
      setColor('#0284c7');
      setImageUrl('');
      setUploadError(null);
      setShowUrlInput(false);

      setOilChangeLastMileage(30000);
      setOilChangeIntervalKm(5000);
      setOilType('100% Sintético 5W-30');
      setOilChangeLastDate(new Date().toISOString().split('T')[0]);

      setPolicyName('Póliza Todo Riesgo');
      setPolicyCompany('');
      setPolicyNumber('');
      setPolicyExpirationDate('');
      setPolicyCost('');

      setTechInspectionExpirationDate('');
      setNotes('');
      setActiveTab('general');
    }
  }, [editingVehicle, isOpen]);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    try {
      setIsUploadingImage(true);
      setUploadError(null);
      const compressed = await compressImageFile(file);
      setImageUrl(compressed);
    } catch (err: any) {
      setUploadError(err?.message || 'Error al procesar la foto seleccionada.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleProcessFile(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleProcessFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() && !brand.trim()) return;

    const vehicleData = {
      ...(editingVehicle ? { id: editingVehicle.id } : {}),
      type,
      name: name.trim() || `${brand} ${model}`.trim() || 'Mi Vehículo',
      brand: brand.trim(),
      model: model.trim(),
      plate: plate.trim().toUpperCase(),
      currentMileage: Number(currentMileage) || 0,
      color,
      imageUrl: imageUrl.trim() || undefined,
      oilChangeLastMileage: Number(oilChangeLastMileage) || 0,
      oilChangeIntervalKm: Number(oilChangeIntervalKm) || 5000,
      oilType: oilType.trim(),
      oilChangeLastDate: oilChangeLastDate || undefined,
      policyName: policyName.trim() || undefined,
      policyCompany: policyCompany.trim() || undefined,
      policyNumber: policyNumber.trim() || undefined,
      policyExpirationDate: policyExpirationDate || undefined,
      policyCost: policyCost !== '' ? Number(policyCost) : undefined,
      techInspectionExpirationDate: techInspectionExpirationDate || undefined,
      notes: notes.trim() || undefined,
    };

    onSaveVehicle(vehicleData);
    onClose();
  };

  // Calculations preview
  const currKm = Number(currentMileage) || 0;
  const lastKm = Number(oilChangeLastMileage) || 0;
  const interval = Number(oilChangeIntervalKm) || 5000;
  const nextOilKm = lastKm + interval;
  const kmRemaining = nextOilKm - currKm;

  return (
    <div 
      id="vehicle-modal-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto"
    >
      <div 
        id="modal-vehicle-editor"
        className={`relative w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border ${
          isDark 
            ? 'bg-[#0f172a] border-slate-700 text-slate-100 shadow-black/80' 
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/80'
        }`}
      >
        {/* Top Header */}
        <div className={`flex items-center justify-between p-5 sm:p-6 border-b ${
          isDark ? 'border-slate-800 bg-[#141e33]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center space-x-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-md ${
              isDark 
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' 
                : 'bg-sky-100 text-sky-700 border border-sky-300'
            }`}>
              {getVehicleTypeIcon(type)}
            </div>
            <div>
              <h3 className={`text-lg sm:text-xl font-black tracking-tight flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                <span>{editingVehicle ? 'Editar Información del Vehículo' : 'Registrar Nuevo Vehículo en el Garaje'}</span>
              </h3>
              <p className={`text-xs font-medium ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Control total de kilometraje, cambio de aceite, póliza de seguro y mantenimientos.
              </p>
            </div>
          </div>
          <button
            id="btn-close-vehicle-modal"
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

        {/* 3 Steps / Tab Navigation with Clear Labels & Status */}
        <div className={`flex items-center px-4 sm:px-6 pt-3 border-b gap-2 overflow-x-auto ${
          isDark ? 'border-slate-800 bg-[#0b1326]' : 'border-slate-200 bg-slate-100/70'
        }`}>
          {/* Tab 1 */}
          <button
            id="tab-vehicle-general"
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'general'
                ? isDark
                  ? 'border-sky-400 text-sky-300 bg-[#1e293b]'
                  : 'border-sky-600 text-sky-800 bg-white shadow-xs'
                : isDark
                  ? 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Car className="w-4 h-4 text-sky-500 shrink-0" />
            <span>1. Datos del Vehículo</span>
          </button>

          {/* Tab 2 */}
          <button
            id="tab-vehicle-aceite"
            type="button"
            onClick={() => setActiveTab('aceite')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'aceite'
                ? isDark
                  ? 'border-amber-400 text-amber-300 bg-[#1e293b]'
                  : 'border-amber-600 text-amber-800 bg-white shadow-xs'
                : isDark
                  ? 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Gauge className="w-4 h-4 text-amber-500 shrink-0" />
            <span>2. Cambio de Aceite</span>
            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
              kmRemaining < 0 
                ? isDark ? 'bg-rose-500/30 text-rose-300' : 'bg-rose-100 text-rose-700 font-bold'
                : isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800 font-bold'
            }`}>
              {kmRemaining < 0 ? '¡Vencido!' : `${kmRemaining.toLocaleString()} km`}
            </span>
          </button>

          {/* Tab 3 */}
          <button
            id="tab-vehicle-poliza"
            type="button"
            onClick={() => setActiveTab('poliza')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'poliza'
                ? isDark
                  ? 'border-emerald-400 text-emerald-300 bg-[#1e293b]'
                  : 'border-emerald-600 text-emerald-800 bg-white shadow-xs'
                : isDark
                  ? 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>3. Seguro & Póliza</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 max-h-[72vh] overflow-y-auto">
          
          {/* ========================================================= */}
          {/* TAB 1: DATOS DEL VEHÍCULO                                 */}
          {/* ========================================================= */}
          {activeTab === 'general' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Guidance Box */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                isDark 
                  ? 'bg-sky-950/30 border-sky-500/30 text-sky-200' 
                  : 'bg-sky-50 border-sky-200 text-sky-900'
              }`}>
                <Info className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm leading-relaxed">
                  <p className="font-bold mb-0.5">Paso 1: Identificación y Lectura del Odómetro</p>
                  <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    Selecciona el tipo de vehículo, escribe su nombre o apodo, la marca y el kilometraje actual que marca el tablero.
                  </p>
                </div>
              </div>

              {/* 1. Vehicle Type Selector */}
              <div>
                <label className={`block text-xs sm:text-sm font-bold uppercase tracking-wider mb-2.5 ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}>
                  ¿Qué tipo de vehículo es? <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(['automovil', 'camioneta', 'moto', 'camion'] as VehicleType[]).map((t) => {
                    const isSelected = type === t;
                    return (
                      <button
                        key={t}
                        id={`btn-select-type-${t}`}
                        type="button"
                        onClick={() => setType(t)}
                        className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? isDark
                              ? 'bg-sky-500/25 border-sky-400 text-sky-200 shadow-lg shadow-sky-500/20 font-bold ring-2 ring-sky-400'
                              : 'bg-sky-50 border-sky-500 text-sky-900 shadow-md font-bold ring-2 ring-sky-400'
                            : isDark
                              ? 'bg-[#1e293b] border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-2xl sm:text-3xl">{getVehicleTypeIcon(t)}</span>
                        <span className="text-xs sm:text-sm font-semibold capitalize">{getVehicleTypeLabel(t)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Name & Plate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label 
                    htmlFor="input-vehicle-name"
                    className={`block text-xs sm:text-sm font-bold mb-1.5 ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    ¿Cómo quieres llamar a tu vehículo? <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-vehicle-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Mazda 3 Grand Touring, Mi Camioneta..."
                    className={`w-full rounded-xl px-4 py-3 text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      isDark 
                        ? 'bg-[#1e293b] border-slate-700 text-white placeholder:text-slate-400 focus:border-sky-400' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500'
                    }`}
                  />
                  <span className={`text-xs mt-1 block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Nombre que aparecerá en tus listas y reportes.
                  </span>
                </div>

                <div>
                  <label 
                    htmlFor="input-vehicle-plate"
                    className={`block text-xs sm:text-sm font-bold mb-1.5 ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    Placa / Patente / Matrícula <span className="text-xs font-normal opacity-80">(Opcional)</span>
                  </label>
                  <input
                    id="input-vehicle-plate"
                    type="text"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    placeholder="Ej. ABC-123 / KRM-482"
                    className={`w-full rounded-xl px-4 py-3 text-sm font-mono font-bold uppercase tracking-wider border transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      isDark 
                        ? 'bg-[#1e293b] border-slate-700 text-sky-300 placeholder:text-slate-400 focus:border-sky-400' 
                        : 'bg-white border-slate-300 text-sky-800 placeholder:text-slate-400 focus:border-sky-500'
                    }`}
                  />
                  <span className={`text-xs mt-1 block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Para identificar el vehículo en trámites y seguros.
                  </span>
                </div>
              </div>

              {/* 3. Brand & Model */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label 
                    htmlFor="input-vehicle-brand"
                    className={`block text-xs sm:text-sm font-bold mb-1.5 ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    Marca del Fabricante <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-vehicle-brand"
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ej. Toyota, Mazda, Chevrolet, Yamaha, Ford..."
                    className={`w-full rounded-xl px-4 py-3 text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      isDark 
                        ? 'bg-[#1e293b] border-slate-700 text-white placeholder:text-slate-400 focus:border-sky-400' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500'
                    }`}
                  />
                </div>

                <div>
                  <label 
                    htmlFor="input-vehicle-model"
                    className={`block text-xs sm:text-sm font-bold mb-1.5 ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    Línea, Modelo o Año <span className="text-xs font-normal opacity-80">(Opcional)</span>
                  </label>
                  <input
                    id="input-vehicle-model"
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Ej. 2023, CX-5, 2.5 Turbo, High Country..."
                    className={`w-full rounded-xl px-4 py-3 text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      isDark 
                        ? 'bg-[#1e293b] border-slate-700 text-white placeholder:text-slate-400 focus:border-sky-400' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500'
                    }`}
                  />
                </div>
              </div>

              {/* 4. Current Mileage (Odómetro) - Highlighted */}
              <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                isDark 
                  ? 'bg-sky-950/25 border-sky-500/40' 
                  : 'bg-sky-50/70 border-sky-300'
              }`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label 
                    htmlFor="input-vehicle-odometer"
                    className={`text-xs sm:text-sm font-bold uppercase flex items-center gap-2 ${
                      isDark ? 'text-sky-300' : 'text-sky-900'
                    }`}
                  >
                    <Gauge className="w-5 h-5 text-sky-500" /> 
                    <span>Kilometraje Actual en el Tablero (Odómetro) <span className="text-rose-500">*</span></span>
                  </label>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    isDark ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-200 text-sky-900'
                  }`}>
                    Lectura en vivo
                  </span>
                </div>

                <div className="relative">
                  <input
                    id="input-vehicle-odometer"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={currentMileage}
                    onChange={(e) => setCurrentMileage(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ej. 35000"
                    className={`w-full rounded-xl px-4 py-3 text-lg sm:text-xl font-mono font-black border transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      isDark 
                        ? 'bg-[#0b1326] border-sky-500/60 text-sky-300 placeholder:text-slate-500' 
                        : 'bg-white border-sky-400 text-sky-900 placeholder:text-slate-400 shadow-sm'
                    }`}
                  />
                  <span className={`absolute right-4 top-3.5 text-xs font-mono font-bold ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    KILÓMETROS
                  </span>
                </div>
                
                <p className={`text-xs leading-relaxed ${
                  isDark ? 'text-slate-300 font-normal' : 'text-slate-700 font-medium'
                }`}>
                  💡 <strong>¿Qué hace este valor?</strong> Es la base para calcular cuándo cambiar el aceite y avisarte a tiempo antes de que se venza tu próximo servicio.
                </p>
              </div>

              {/* 5. Color Identifier */}
              <div>
                <label className={`block text-xs sm:text-sm font-bold mb-2 ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}>
                  Color distintivo en la tarjeta del Garaje:
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                  {[
                    { hex: '#0284c7', label: 'Azul' },
                    { hex: '#10b981', label: 'Esmeralda' },
                    { hex: '#f59e0b', label: 'Ámbar' },
                    { hex: '#f43f5e', label: 'Rojo' },
                    { hex: '#8b5cf6', label: 'Púrpura' },
                    { hex: '#ec4899', label: 'Rosa' },
                    { hex: '#06b6d4', label: 'Cian' },
                  ].map((c) => (
                    <button
                      key={c.hex}
                      id={`color-picker-${c.label}`}
                      type="button"
                      onClick={() => setColor(c.hex)}
                      title={c.label}
                      className={`w-8 h-8 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                        color === c.hex 
                          ? isDark 
                            ? 'scale-125 ring-3 ring-white ring-offset-2 ring-offset-[#0f172a]' 
                            : 'scale-125 ring-3 ring-slate-900 ring-offset-2 ring-offset-white'
                          : 'hover:scale-110 opacity-75 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {color === c.hex && <Check className="w-4 h-4 text-white drop-shadow-sm" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Foto Real del Vehículo */}
              <div className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 transition-all ${
                isDark 
                  ? 'bg-[#131d33]/80 border-slate-700/80' 
                  : 'bg-slate-50/80 border-slate-200'
              }`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center space-x-2">
                    <Camera className="w-4 h-4 text-cyan-400 shrink-0" />
                    <label className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${
                      isDark ? 'text-slate-100' : 'text-slate-800'
                    }`}>
                      Foto Real del Auto / Vehículo <span className="text-xs font-normal opacity-80 lowercase">(Opcional)</span>
                    </label>
                  </div>

                  {imageUrl && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Foto cargada
                    </span>
                  )}
                </div>

                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Sube una foto real de tu carro o moto para que aparezca en el garaje, en la vitrina principal y en la ficha técnica.
                </p>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  id="input-vehicle-photo-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {/* Preview or Drop Zone */}
                {imageUrl ? (
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden border border-cyan-500/40 shadow-lg group bg-black/40 max-h-56 flex items-center justify-center">
                      <img 
                        src={imageUrl} 
                        alt="Foto real del vehículo" 
                        referrerPolicy="no-referrer"
                        className="w-full h-52 object-cover object-center group-hover:scale-102 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                      {/* Top Overlay Badge */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md text-white text-[11px] font-mono font-bold border border-cyan-500/50 shadow-md">
                        <Camera className="w-3 h-3 text-cyan-400" />
                        <span>Foto Real</span>
                      </div>

                      {/* Bottom action controls */}
                      <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md hover:shadow-cyan-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Seleccionar otra foto"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Cambiar Foto</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Quitar foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Quitar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    id="dropzone-vehicle-photo"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 group ${
                      isDragOver
                        ? 'border-cyan-400 bg-cyan-500/15 scale-[1.01]'
                        : isDark
                          ? 'border-slate-700 hover:border-cyan-500/60 bg-[#0d1527] hover:bg-[#111a31]'
                          : 'border-slate-300 hover:border-cyan-500 bg-white hover:bg-cyan-50/50'
                    }`}
                  >
                    {isUploadingImage ? (
                      <div className="flex flex-col items-center gap-2 py-2">
                        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                        <span className="text-xs font-bold text-cyan-400">Optimizando y comprimiendo fotografía...</span>
                      </div>
                    ) : (
                      <>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-md ${
                          isDark ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-cyan-100 text-cyan-700 border border-cyan-300'
                        }`}>
                          <Camera className="w-6 h-6" />
                        </div>
                        <div className="space-y-0.5">
                          <p className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Haz clic aquí o arrastra y suelta la foto real de tu auto
                          </p>
                          <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Admite fotos de tu galería, archivos o cámara del móvil (JPG, PNG, WebP)
                          </p>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase border ${
                            isDark ? 'bg-slate-800 border-slate-700 text-cyan-300' : 'bg-slate-100 border-slate-200 text-cyan-800'
                          }`}>
                            ⚡ Compresión Automática Ligera
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Error Banner if any */}
                {uploadError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Optional Web URL Link Fallback Toggle */}
                <div className="pt-1">
                  {!showUrlInput ? (
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(true)}
                      className={`text-[11px] font-mono hover:underline flex items-center gap-1.5 cursor-pointer ${
                        isDark ? 'text-slate-400 hover:text-cyan-300' : 'text-slate-500 hover:text-cyan-700'
                      }`}
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>¿Prefieres pegar un enlace URL web de la foto?</span>
                    </button>
                  ) : (
                    <div className="space-y-1.5 pt-1 animate-in fade-in duration-150">
                      <label 
                        htmlFor="input-vehicle-url"
                        className={`text-[11px] font-mono font-bold flex items-center justify-between ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      >
                        <span>Enlace directo a imagen (https://...):</span>
                        <button
                          type="button"
                          onClick={() => setShowUrlInput(false)}
                          className="text-slate-500 hover:text-slate-400 text-[10px] cursor-pointer"
                        >
                          Cerrar
                        </button>
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="input-vehicle-url"
                          type="url"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="https://ejemplo.com/mi-auto.jpg"
                          className={`w-full rounded-xl px-3 py-2 text-xs font-mono border transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                            isDark 
                              ? 'bg-[#1e293b] border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-400' 
                              : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: CAMBIO DE ACEITE                                   */}
          {/* ========================================================= */}
          {activeTab === 'aceite' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Guidance Box */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                isDark 
                  ? 'bg-amber-950/30 border-amber-500/30 text-amber-200' 
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm leading-relaxed">
                  <p className="font-bold mb-0.5">Paso 2: Registro de Aceite y Frecuencia de Cambio</p>
                  <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    El sistema calcula automáticamente cuántos kilómetros te quedan y te avisará cuando falte poco o si ya está vencido.
                  </p>
                </div>
              </div>

              {/* Real-Time Calculation Telemetry Card */}
              <div className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 ${
                isDark 
                  ? 'bg-[#141e33] border-slate-700' 
                  : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className={`text-xs sm:text-sm font-bold uppercase flex items-center gap-1.5 ${
                    isDark ? 'text-amber-300' : 'text-amber-800'
                  }`}>
                    <Gauge className="w-4 h-4 text-amber-500" /> Cálculo en Tiempo Real del Próximo Cambio
                  </span>
                  
                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                    kmRemaining < 0 
                      ? isDark 
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50' 
                        : 'bg-rose-100 text-rose-800 border-rose-300' 
                      : kmRemaining <= 800 
                        ? isDark 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' 
                          : 'bg-amber-100 text-amber-800 border-amber-300' 
                        : isDark 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' 
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {kmRemaining < 0 
                      ? `⚠️ ¡Vencido por ${Math.abs(kmRemaining).toLocaleString()} km!` 
                      : `✅ Quedan ${kmRemaining.toLocaleString()} km de vida útil`}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
                  {/* Last Oil */}
                  <div className={`p-3 rounded-xl border ${
                    isDark ? 'bg-[#0b1326] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className={`text-xs font-sans font-semibold block mb-0.5 ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      Último Cambio
                    </span>
                    <span className={`text-sm sm:text-base font-bold ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {Number(oilChangeLastMileage || 0).toLocaleString()} km
                    </span>
                  </div>

                  {/* Current Km */}
                  <div className={`p-3 rounded-xl border ${
                    isDark ? 'bg-[#0b1326] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className={`text-xs font-sans font-semibold block mb-0.5 ${
                      isDark ? 'text-sky-300' : 'text-sky-700'
                    }`}>
                      Km Actual Tablero
                    </span>
                    <span className={`text-sm sm:text-base font-bold ${
                      isDark ? 'text-sky-300' : 'text-sky-800'
                    }`}>
                      {currKm.toLocaleString()} km
                    </span>
                  </div>

                  {/* Next Km */}
                  <div className={`p-3 rounded-xl border ${
                    isDark ? 'bg-[#0b1326] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className={`text-xs font-sans font-semibold block mb-0.5 ${
                      isDark ? 'text-amber-300' : 'text-amber-700'
                    }`}>
                      Próximo Cambio
                    </span>
                    <span className={`text-sm sm:text-base font-bold ${
                      isDark ? 'text-amber-300' : 'text-amber-800'
                    }`}>
                      {nextOilKm.toLocaleString()} km
                    </span>
                  </div>
                </div>
              </div>

              {/* 1. Last Oil Change Mileage & Interval */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label 
                    htmlFor="input-oil-last-km"
                    className={`block text-xs sm:text-sm font-bold mb-1.5 ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    ¿A qué kilometraje se hizo el último cambio? <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-oil-last-km"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={oilChangeLastMileage}
                    onChange={(e) => setOilChangeLastMileage(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ej. 30000"
                    className={`w-full rounded-xl px-4 py-3 text-sm sm:text-base font-mono font-bold border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isDark 
                        ? 'bg-[#1e293b] border-slate-700 text-white placeholder:text-slate-400 focus:border-amber-400' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500'
                    }`}
                  />
                  <span className={`text-xs mt-1 block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    El número del odómetro que tenía el vehículo en el último cambio de aceite.
                  </span>
                </div>

                <div>
                  <label 
                    htmlFor="input-oil-interval"
                    className={`block text-xs sm:text-sm font-bold mb-1.5 ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    ¿Cada cuántos kilómetros se debe cambiar? <span className="text-rose-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <input
                      id="input-oil-interval"
                      type="number"
                      min="1000"
                      step="500"
                      required
                      value={oilChangeIntervalKm}
                      onChange={(e) => setOilChangeIntervalKm(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Ej. 5000"
                      className={`w-full rounded-xl px-4 py-3 text-sm sm:text-base font-mono font-bold border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        isDark 
                          ? 'bg-[#1e293b] border-slate-700 text-amber-300 placeholder:text-slate-400 focus:border-amber-400' 
                          : 'bg-white border-slate-300 text-amber-800 placeholder:text-slate-400 focus:border-amber-500'
                      }`}
                    />
                    
                    {/* Quick Interval Selection Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {[3000, 5000, 7500, 10000].map((quickKm) => (
                        <button
                          key={quickKm}
                          type="button"
                          onClick={() => setOilChangeIntervalKm(quickKm)}
                          className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            oilChangeIntervalKm === quickKm
                              ? isDark
                                ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                                : 'bg-amber-100 border-amber-400 text-amber-900 font-black'
                              : isDark
                                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {quickKm.toLocaleString()} km
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Oil Type & Last Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label 
                    htmlFor="input-oil-type"
                    className={`block text-xs sm:text-sm font-bold mb-1.5 ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    Tipo o Referencia de Aceite
                  </label>
                  <input
                    id="input-oil-type"
                    type="text"
                    value={oilType}
                    onChange={(e) => setOilType(e.target.value)}
                    placeholder="Ej. 100% Sintético 5W-30, 0W-20, 10W-40..."
                    className={`w-full rounded-xl px-4 py-3 text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isDark 
                        ? 'bg-[#1e293b] border-slate-700 text-white placeholder:text-slate-400 focus:border-amber-400' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500'
                    }`}
                  />
                  <span className={`text-xs mt-1 block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Viscosidad y tecnología recomendada por el fabricante.
                  </span>
                </div>

                <div>
                  <label 
                    htmlFor="input-oil-last-date"
                    className={`block text-xs sm:text-sm font-bold mb-1.5 ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    Fecha del Último Cambio Realizado
                  </label>
                  <input
                    id="input-oil-last-date"
                    type="date"
                    value={oilChangeLastDate}
                    onChange={(e) => setOilChangeLastDate(e.target.value)}
                    className={`w-full rounded-xl px-4 py-3 text-sm font-mono font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isDark 
                        ? 'bg-[#1e293b] border-slate-700 text-white focus:border-amber-400' 
                        : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                    }`}
                  />
                  <span className={`text-xs mt-1 block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Día en que se realizó el último servicio.
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: SEGURO, PÓLIZA & DOCUMENTOS                         */}
          {/* ========================================================= */}
          {activeTab === 'poliza' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Guidance Box */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                isDark 
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <Info className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm leading-relaxed">
                  <p className="font-bold mb-0.5">Paso 3: Seguro, Póliza Todo Riesgo & Revisión Mecánica</p>
                  <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    Registra la fecha de vencimiento de tu póliza de seguro para que el sistema te avise cuántos días te quedan antes de renovar.
                  </p>
                </div>
              </div>

              {/* 1. Policy Name & Insurance Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label 
                    htmlFor="input-policy-name"
                    className={`block text-xs sm:text-sm font-bold mb-1.5 ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    Nombre del Seguro / Tipo de Póliza
                  </label>
                  <input
                    id="input-policy-name"
                    type="text"
                    value={policyName}
                    onChange={(e) => setPolicyName(e.target.value)}
                    placeholder="Ej. Póliza Todo Riesgo, SOAT Obligatorio..."
                    className={`w-full rounded-xl px-4 py-3 text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isDark 
                        ? 'bg-[#1e293b] border-slate-700 text-white placeholder:text-slate-400 focus:border-emerald-400' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500'
                    }`}
                  />
                </div>

                <div>
                  <label 
                    htmlFor="input-policy-company"
                    className={`block text-xs sm:text-sm font-bold mb-1.5 ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    Compañía Aseguradora
                  </label>
                  <input
                    id="input-policy-company"
                    type="text"
                    value={policyCompany}
                    onChange={(e) => setPolicyCompany(e.target.value)}
                    placeholder="Ej. Sura, Allianz, Mapfre, Axa, GNP, Seguros Bolivar..."
                    className={`w-full rounded-xl px-4 py-3 text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isDark 
                        ? 'bg-[#1e293b] border-slate-700 text-white placeholder:text-slate-400 focus:border-emerald-400' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500'
                    }`}
                  />
                </div>
              </div>

              {/* 2. Policy Number & Expiration Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label 
                    htmlFor="input-policy-number"
                    className={`block text-xs sm:text-sm font-bold mb-1.5 ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    Número de Póliza o Contrato
                  </label>
                  <input
                    id="input-policy-number"
                    type="text"
                    value={policyNumber}
                    onChange={(e) => setPolicyNumber(e.target.value)}
                    placeholder="Ej. POL-8849201"
                    className={`w-full rounded-xl px-4 py-3 text-sm font-mono font-bold border transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isDark 
                        ? 'bg-[#1e293b] border-slate-700 text-white placeholder:text-slate-400 focus:border-emerald-400' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500'
                    }`}
                  />
                </div>

                <div>
                  <label 
                    htmlFor="input-policy-exp-date"
                    className={`block text-xs sm:text-sm font-bold mb-1.5 ${
                      isDark ? 'text-emerald-300' : 'text-emerald-800'
                    }`}
                  >
                    Fecha de Vencimiento de la Póliza *
                  </label>
                  <input
                    id="input-policy-exp-date"
                    type="date"
                    value={policyExpirationDate}
                    onChange={(e) => setPolicyExpirationDate(e.target.value)}
                    className={`w-full rounded-xl px-4 py-3 text-sm font-mono font-bold border transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isDark 
                        ? 'bg-[#1e293b] border-emerald-500/50 text-emerald-300 focus:border-emerald-400' 
                        : 'bg-white border-emerald-400 text-emerald-900 focus:border-emerald-500 shadow-xs'
                    }`}
                  />
                  <span className={`text-xs mt-1 block font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    🔔 Recibirás alertas antes de que se venza.
                  </span>
                </div>
              </div>

              {/* 3. Cost & Tech Inspection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label 
                    htmlFor="input-policy-cost"
                    className={`block text-xs sm:text-sm font-bold mb-1.5 ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    Costo Anual o Valor de Renovación ($)
                  </label>
                  <input
                    id="input-policy-cost"
                    type="number"
                    min="0"
                    value={policyCost}
                    onChange={(e) => setPolicyCost(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ej. 2800000"
                    className={`w-full rounded-xl px-4 py-3 text-sm font-mono font-bold border transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isDark 
                        ? 'bg-[#1e293b] border-slate-700 text-emerald-300 placeholder:text-slate-400 focus:border-emerald-400' 
                        : 'bg-white border-slate-300 text-emerald-800 placeholder:text-slate-400 focus:border-emerald-500'
                    }`}
                  />
                </div>

                <div>
                  <label 
                    htmlFor="input-tech-exp-date"
                    className={`block text-xs sm:text-sm font-bold mb-1.5 ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    Vencimiento Revisión Técnico-Mecánica (Opcional)
                  </label>
                  <input
                    id="input-tech-exp-date"
                    type="date"
                    value={techInspectionExpirationDate}
                    onChange={(e) => setTechInspectionExpirationDate(e.target.value)}
                    className={`w-full rounded-xl px-4 py-3 text-sm font-mono font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isDark 
                        ? 'bg-[#1e293b] border-slate-700 text-white focus:border-slate-500' 
                        : 'bg-white border-slate-300 text-slate-900 focus:border-slate-400'
                    }`}
                  />
                </div>
              </div>

              {/* 4. Notes & Roadside Assistance */}
              <div>
                <label 
                  htmlFor="textarea-vehicle-notes"
                  className={`block text-xs sm:text-sm font-bold mb-1.5 ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  Notas / Teléfono de Asistencia en Carretera & Grúa
                </label>
                <textarea
                  id="textarea-vehicle-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Línea de grúa 24h: #345 opción 1. Asesor: Carlos Gómez 310-0000000. Cobertura nacional 100km..."
                  className={`w-full rounded-xl px-4 py-3 text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isDark 
                      ? 'bg-[#1e293b] border-slate-700 text-white placeholder:text-slate-400 focus:border-slate-500' 
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-400'
                  }`}
                />
              </div>

            </div>
          )}

          {/* Footer Controls: Back, Next, Save */}
          <div className={`flex items-center justify-between pt-5 border-t gap-3 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            {/* Cancel or Back */}
            {activeTab === 'general' ? (
              <button
                id="btn-cancel-vehicle"
                type="button"
                onClick={onClose}
                className={`px-4 sm:px-5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isDark 
                    ? 'border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800' 
                    : 'border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Cancelar
              </button>
            ) : (
              <button
                id="btn-prev-tab"
                type="button"
                onClick={() => {
                  if (activeTab === 'poliza') setActiveTab('aceite');
                  else if (activeTab === 'aceite') setActiveTab('general');
                }}
                className={`px-4 sm:px-5 py-2.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isDark 
                    ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' 
                    : 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Paso Anterior</span>
              </button>
            )}

            {/* Next or Save */}
            <div className="flex items-center gap-2.5">
              {activeTab !== 'poliza' && (
                <button
                  id="btn-next-tab"
                  type="button"
                  onClick={() => {
                    if (activeTab === 'general') setActiveTab('aceite');
                    else if (activeTab === 'aceite') setActiveTab('poliza');
                  }}
                  className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isDark 
                      ? 'bg-sky-600 hover:bg-sky-500 text-white' 
                      : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm'
                  }`}
                >
                  <span>Siguiente Paso</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                id="btn-save-vehicle-submit"
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-sky-500/25 transition-all cursor-pointer flex items-center space-x-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{editingVehicle ? 'Guardar Cambios' : 'Registrar Vehículo'}</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
