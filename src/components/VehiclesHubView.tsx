import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Vehicle, VehicleMaintenance, MaintenanceCategory, MaintenanceStatus, VehicleType } from '../types';
import { VEHICLES_HERO_IMAGE } from '../data/initialData';
import { 
  calculateOilStatus, 
  calculatePolicyStatus, 
  getVehicleTypeIcon, 
  getVehicleTypeLabel, 
  getMaintenanceCategoryMeta 
} from '../utils/vehicleHelpers';
import { VehicleModal } from './VehicleModal';
import { VehicleMaintenanceModal } from './VehicleMaintenanceModal';
import { 
  Car, 
  ShieldCheck, 
  Wrench, 
  Sparkles, 
  Plus, 
  Edit3, 
  Trash2, 
  Gauge, 
  Shield, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Check, 
  RefreshCw, 
  Tag, 
  SlidersHorizontal,
  ChevronRight,
  Filter,
  Layers,
  ArrowRight,
  AlertCircle,
  Camera,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { compressImageFile } from '../utils/imageCompressor';

interface VehiclesHubViewProps {
  vehicles: Vehicle[];
  maintenances: VehicleMaintenance[];
  onAddVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (vehicleId: string) => void;
  onAddMaintenance: (maint: Omit<VehicleMaintenance, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateMaintenance: (maint: VehicleMaintenance) => void;
  onDeleteMaintenance: (maintId: string) => void;
  onRecordOilChange: (vehicleId: string, currentMileage: number) => void;
  onQuickUpdateMileage: (vehicleId: string, newMileage: number) => void;
  onResetVehiclesData?: () => void;
}

export const VehiclesHubView: React.FC<VehiclesHubViewProps> = ({
  vehicles,
  maintenances,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onAddMaintenance,
  onUpdateMaintenance,
  onDeleteMaintenance,
  onRecordOilChange,
  onQuickUpdateMileage,
  onResetVehiclesData,
}) => {
  const { isDark } = useTheme();
  // Selected Vehicle ID (defaults to first vehicle)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    vehicles.length > 0 ? vehicles[0].id : ''
  );

  // Active Maintenance Tab
  const [activeMaintTab, setActiveMaintTab] = useState<MaintenanceCategory>('preventivo');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendiente' | 'en_progreso' | 'completado'>('all');

  // Modals state
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
  const [editingMaint, setEditingMaint] = useState<VehicleMaintenance | null>(null);
  const [defaultMaintCategory, setDefaultMaintCategory] = useState<MaintenanceCategory>('preventivo');

  // Quick Mileage Editor Popover/Modal
  const [isMileageModalOpen, setIsMileageModalOpen] = useState(false);
  const [newMileageInput, setNewMileageInput] = useState<number | ''>('');

  // Selected vehicle object
  const activeVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  // If activeVehicle changed or deleted, sync selectedVehicleId
  React.useEffect(() => {
    if (vehicles.length > 0 && !vehicles.some((v) => v.id === selectedVehicleId)) {
      setSelectedVehicleId(vehicles[0].id);
    }
  }, [vehicles, selectedVehicleId]);

  // Maintenances for the selected vehicle
  const vehicleMaintenances = maintenances.filter((m) => m.vehicleId === activeVehicle?.id);
  
  const preventives = vehicleMaintenances.filter((m) => m.category === 'preventivo');
  const correctives = vehicleMaintenances.filter((m) => m.category === 'correctivo');
  const upgrades = vehicleMaintenances.filter((m) => m.category === 'mejora');

  const pendingPreventives = preventives.filter((m) => m.status !== 'completado');
  const pendingCorrectives = correctives.filter((m) => m.status !== 'completado');
  const pendingUpgrades = upgrades.filter((m) => m.status !== 'completado');

  // Filtered list by current tab and status
  const currentList = vehicleMaintenances
    .filter((m) => m.category === activeMaintTab)
    .filter((m) => (statusFilter === 'all' ? true : m.status === statusFilter));

  // Calculations for current vehicle
  const oilStatus = activeVehicle ? calculateOilStatus(activeVehicle) : null;
  const policyStatus = activeVehicle ? calculatePolicyStatus(activeVehicle.policyExpirationDate) : null;

  // Global Garage Summary Metrics
  const totalVehiclesCount = vehicles.length;
  const vehiclesRequiringOil = vehicles.filter((v) => {
    const s = calculateOilStatus(v);
    return s.status === 'proximo' || s.status === 'vencido';
  });
  const vehiclesExpiringPolicy = vehicles.filter((v) => {
    const s = calculatePolicyStatus(v.policyExpirationDate);
    return s.status === 'por_vencer' || s.status === 'vencida';
  });
  const totalPendingMaintenancesAllVehicles = maintenances.filter((m) => m.status !== 'completado').length;

  // Handlers
  const handleOpenAddVehicle = () => {
    setEditingVehicle(null);
    setIsVehicleModalOpen(true);
  };

  const handleOpenEditVehicle = (veh: Vehicle) => {
    setEditingVehicle(veh);
    setIsVehicleModalOpen(true);
  };

  const handleOpenAddMaint = (cat: MaintenanceCategory = activeMaintTab) => {
    setDefaultMaintCategory(cat);
    setEditingMaint(null);
    setIsMaintModalOpen(true);
  };

  const handleOpenEditMaint = (m: VehicleMaintenance) => {
    setEditingMaint(m);
    setIsMaintModalOpen(true);
  };

  const handleToggleMaintStatus = (m: VehicleMaintenance) => {
    let nextStatus: MaintenanceStatus = 'pendiente';
    if (m.status === 'pendiente') nextStatus = 'en_progreso';
    else if (m.status === 'en_progreso') nextStatus = 'completado';
    else if (m.status === 'completado') nextStatus = 'pendiente';

    onUpdateMaintenance({
      ...m,
      status: nextStatus,
      completedDate: nextStatus === 'completado' ? new Date().toISOString().split('T')[0] : undefined,
    });
  };

  const heroFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isUploadingHeroPhoto, setIsUploadingHeroPhoto] = useState(false);
  const [heroPhotoNotice, setHeroPhotoNotice] = useState<string | null>(null);

  const handleHeroPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeVehicle) return;
    try {
      setIsUploadingHeroPhoto(true);
      const compressed = await compressImageFile(file);
      onUpdateVehicle({
        ...activeVehicle,
        imageUrl: compressed,
      });
      setHeroPhotoNotice('¡Foto real del vehículo actualizada con éxito!');
      setTimeout(() => setHeroPhotoNotice(null), 3500);
    } catch (err: any) {
      alert(err?.message || 'Error al procesar la foto seleccionada.');
    } finally {
      setIsUploadingHeroPhoto(false);
      e.target.value = '';
    }
  };

  const handleOpenQuickMileage = () => {
    if (!activeVehicle) return;
    setNewMileageInput(activeVehicle.currentMileage || 0);
    setIsMileageModalOpen(true);
  };

  const handleSaveQuickMileage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVehicle || newMileageInput === '') return;
    onQuickUpdateMileage(activeVehicle.id, Number(newMileageInput));
    setIsMileageModalOpen(false);
  };

  const handleConfirmOilChangeDone = () => {
    if (!activeVehicle) return;
    const confirm = window.confirm(
      `¿Registrar cambio de aceite de motor realizado hoy para "${activeVehicle.name}" al kilometraje actual (${activeVehicle.currentMileage.toLocaleString()} km)?\n\nEsto reseteará el contador para los próximos ${activeVehicle.oilChangeIntervalKm.toLocaleString()} km.`
    );
    if (confirm) {
      onRecordOilChange(activeVehicle.id, activeVehicle.currentMileage);
    }
  };

  // If no vehicles registered yet, show welcome prompt
  if (!activeVehicle || vehicles.length === 0) {
    return (
      <div className="p-8 text-center bg-[#0d1527] border border-cyan-500/30 rounded-3xl space-y-6 shadow-2xl">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-4xl shadow-xl shadow-cyan-500/25">
          🚗
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h2 className="text-2xl font-black text-white">Tu Garaje de Vehículos está Vacío</h2>
          <p className="text-sm text-slate-400">
            Agrega tu primer automóvil, camioneta o motocicleta para llevar el control automático del cambio de aceite, vigencia de pólizas, mantenimientos preventivos y correctivos.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAddVehicle}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] text-[#00363a] font-mono font-black text-sm shadow-xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer inline-flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>+ Agregar Mi Primer Vehículo</span>
        </button>

        {isVehicleModalOpen && (
          <VehicleModal
            isOpen={isVehicleModalOpen}
            onClose={() => setIsVehicleModalOpen(false)}
            onSaveVehicle={(v) => {
              onAddVehicle(v);
              setIsVehicleModalOpen(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. TOP GARAGE SHOWCASE HERO BANNER */}
      <div className={`border rounded-3xl p-5 sm:p-7 relative overflow-hidden shadow-2xl transition-all ${
        isDark
          ? 'bg-gradient-to-br from-[#131d36] via-[#0f172a] to-[#090e1c] border-cyan-500/30'
          : 'bg-gradient-to-br from-cyan-50 via-sky-50 to-emerald-50 border-cyan-200 shadow-cyan-950/5'
      }`}>
        {/* Glow ambient background circles */}
        <div className={`absolute -right-16 -top-16 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
          isDark ? 'bg-cyan-500/15' : 'bg-cyan-300/30'
        }`} />
        <div className={`absolute -left-16 -bottom-16 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
          isDark ? 'bg-emerald-500/10' : 'bg-emerald-300/30'
        }`} />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          <div className="lg:col-span-8 space-y-3">
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
              isDark
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-500/20'
                : 'bg-cyan-100 border-cyan-300 text-cyan-800'
            }`}>
              <Car className="w-3.5 h-3.5 text-cyan-400" />
              <span>🏎️ Garaje Inteligente & Telemetría de Flota</span>
            </div>

            <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Mis Vehículos & Control Operativo
            </h2>

            <p className={`text-xs sm:text-sm leading-relaxed ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Monitoreo en tiempo real de odómetros, intervalos para cambio de aceite de motor, vigencia de pólizas de seguro y bitácora completa de mantenimientos.
            </p>

            {/* Quick Global Garage KPI Chips */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <div className={`flex items-center space-x-2 px-3 py-1.5 border rounded-2xl ${
                isDark ? 'bg-[#0b1326]/90 border-cyan-500/30 shadow-sm' : 'bg-white/90 border-cyan-200 shadow-sm'
              }`}>
                <Car className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className={`text-[9px] font-mono uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>En Garaje</div>
                  <div className={`text-xs sm:text-sm font-bold font-mono ${isDark ? 'text-cyan-300' : 'text-cyan-800'}`}>
                    {totalVehiclesCount} {totalVehiclesCount === 1 ? 'Vehículo' : 'Vehículos'}
                  </div>
                </div>
              </div>

              <div className={`flex items-center space-x-2 px-3 py-1.5 border rounded-2xl ${
                isDark 
                  ? vehiclesRequiringOil.length > 0 ? 'bg-amber-950/40 border-amber-500/40 shadow-sm' : 'bg-[#0b1326]/90 border-emerald-500/30 shadow-sm'
                  : vehiclesRequiringOil.length > 0 ? 'bg-amber-50 border-amber-300 shadow-sm' : 'bg-emerald-50 border-emerald-200 shadow-sm'
              }`}>
                <Gauge className={`w-4 h-4 ${vehiclesRequiringOil.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
                <div>
                  <div className={`text-[9px] font-mono uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Aceites</div>
                  <div className={`text-xs sm:text-sm font-bold font-mono ${
                    vehiclesRequiringOil.length > 0 
                      ? isDark ? 'text-amber-300' : 'text-amber-800'
                      : isDark ? 'text-emerald-300' : 'text-emerald-800'
                  }`}>
                    {vehiclesRequiringOil.length === 0 ? '100% al Día' : `${vehiclesRequiringOil.length} Requieren Atención`}
                  </div>
                </div>
              </div>

              <div className={`flex items-center space-x-2 px-3 py-1.5 border rounded-2xl ${
                isDark 
                  ? vehiclesExpiringPolicy.length > 0 ? 'bg-rose-950/40 border-rose-500/40 shadow-sm' : 'bg-[#0b1326]/90 border-slate-700 shadow-sm'
                  : vehiclesExpiringPolicy.length > 0 ? 'bg-rose-50 border-rose-200 shadow-sm' : 'bg-white/90 border-slate-200 shadow-sm'
              }`}>
                <ShieldCheck className={`w-4 h-4 ${vehiclesExpiringPolicy.length > 0 ? 'text-rose-400' : 'text-cyan-400'}`} />
                <div>
                  <div className={`text-[9px] font-mono uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Seguros</div>
                  <div className={`text-xs sm:text-sm font-bold font-mono ${
                    vehiclesExpiringPolicy.length > 0
                      ? isDark ? 'text-rose-300' : 'text-rose-800'
                      : isDark ? 'text-cyan-300' : 'text-cyan-800'
                  }`}>
                    {vehiclesExpiringPolicy.length === 0 ? 'Pólizas Vigentes' : `${vehiclesExpiringPolicy.length} por Vencer`}
                  </div>
                </div>
              </div>

              <div className={`flex items-center space-x-2 px-3 py-1.5 border rounded-2xl ${
                isDark ? 'bg-[#0b1326]/90 border-slate-700 shadow-sm' : 'bg-white/90 border-slate-200 shadow-sm'
              }`}>
                <Wrench className="w-4 h-4 text-indigo-400" />
                <div>
                  <div className={`text-[9px] font-mono uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Servicios</div>
                  <div className={`text-xs sm:text-sm font-bold font-mono ${isDark ? 'text-indigo-300' : 'text-indigo-800'}`}>
                    {totalPendingMaintenancesAllVehicles} Pendientes
                  </div>
                </div>
              </div>
            </div>

            {/* Garage Actions Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleOpenAddVehicle}
                className="px-4 py-2.5 bg-gradient-to-r from-[#00f2ff] via-teal-300 to-[#38ef7d] hover:brightness-110 active:scale-[0.98] text-[#00363a] font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition-all inline-flex items-center space-x-2 cursor-pointer group"
              >
                <Plus className="w-4 h-4 stroke-[3] group-hover:rotate-90 transition-transform" />
                <span>+ Registrar Nuevo Vehículo</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenEditVehicle(activeVehicle)}
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all inline-flex items-center space-x-1.5 cursor-pointer shadow-sm ${
                  isDark
                    ? 'bg-[#142342] hover:bg-[#1a2d52] border-cyan-500/40 text-cyan-300'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Editar Ficha ({activeVehicle.name})</span>
              </button>

              {/* Quick direct upload button */}
              <button
                type="button"
                onClick={() => heroFileInputRef.current?.click()}
                disabled={isUploadingHeroPhoto}
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all inline-flex items-center space-x-1.5 cursor-pointer shadow-sm ${
                  isDark
                    ? 'bg-[#122240] hover:bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                    : 'bg-white hover:bg-cyan-50 border-cyan-300 text-cyan-800'
                }`}
                title={activeVehicle.imageUrl ? 'Cambiar foto real del auto activo' : 'Subir foto real de este auto'}
              >
                {isUploadingHeroPhoto ? (
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span>{isUploadingHeroPhoto ? 'Subiendo...' : activeVehicle.imageUrl ? 'Cambiar Foto Real' : 'Subir Foto Real'}</span>
              </button>

              {/* Hidden file input for hero/quick upload */}
              <input
                ref={heroFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleHeroPhotoUpload}
                className="hidden"
              />

              {onResetVehiclesData && (
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(true)}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-mono transition-all inline-flex items-center space-x-1.5 cursor-pointer shadow-sm ${
                    isDark
                      ? 'bg-[#121c33]/80 hover:bg-red-500/15 border-slate-800 hover:border-red-500/40 text-slate-400 hover:text-red-300'
                      : 'bg-white hover:bg-red-50 border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600'
                  }`}
                  title="Borrar todos los vehículos para un Fresh Start"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Limpiar Garaje</span>
                </button>
              )}
            </div>

            {heroPhotoNotice && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{heroPhotoNotice}</span>
              </div>
            )}

          </div>

          {/* Right Thematic Showcase Image */}
          <div className="lg:col-span-4 hidden sm:block">
            <div className="relative rounded-2xl overflow-hidden border border-cyan-500/40 shadow-xl h-44 group bg-[#09101f]">
              <img 
                src={activeVehicle.imageUrl || VEHICLES_HERO_IMAGE} 
                alt={activeVehicle.name || "Vehículos y Garaje"}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09101f] via-[#09101f]/20 to-transparent pointer-events-none" />

              {/* Photo badge & upload trigger */}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                {activeVehicle.imageUrl && (
                  <span className="px-2 py-1 rounded-lg bg-black/80 backdrop-blur-md text-white text-[10px] font-mono font-bold border border-cyan-400/50 flex items-center gap-1">
                    <Camera className="w-3 h-3 text-cyan-400" />
                    Foto Real
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => heroFileInputRef.current?.click()}
                  disabled={isUploadingHeroPhoto}
                  className="px-2.5 py-1 rounded-lg bg-black/80 hover:bg-cyan-600 text-white text-[11px] font-bold backdrop-blur-md border border-cyan-400/50 flex items-center gap-1 transition-all cursor-pointer shadow-md"
                  title={activeVehicle.imageUrl ? 'Cambiar foto real' : 'Subir foto real'}
                >
                  <Camera className="w-3 h-3 text-cyan-300" />
                  <span>{activeVehicle.imageUrl ? 'Cambiar' : 'Subir'}</span>
                </button>
              </div>

              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] backdrop-blur-md bg-[#09101f]/85 px-3 py-1.5 rounded-xl border border-cyan-500/40 shadow-md">
                <span className="font-bold text-white flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                  <span className="truncate">{activeVehicle.name}</span>
                </span>
                <span className="font-mono text-cyan-300 text-[10px] font-bold shrink-0 ml-2">
                  {activeVehicle.currentMileage?.toLocaleString()} km
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 2. PROMINENT VEHICLE SELECTOR CARDS GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Car className="w-4 h-4 text-cyan-400" />
            <h3 className={`text-sm sm:text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Vehículos en Garaje ({vehicles.length})
            </h3>
          </div>
          <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Selecciona para inspeccionar telemetría
          </span>
        </div>

        {/* High-Contrast Interactive Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => {
            const isSelected = v.id === activeVehicle.id;
            const vOil = calculateOilStatus(v);
            const vPolicy = calculatePolicyStatus(v.policyExpirationDate);
            const isWarning = vOil.status === 'proximo' || vOil.status === 'vencido';

            return (
              <div
                key={v.id}
                onClick={() => setSelectedVehicleId(v.id)}
                className={`relative rounded-3xl p-4 sm:p-5 border cursor-pointer transition-all duration-300 group overflow-hidden ${
                  isSelected
                    ? isDark
                      ? 'bg-gradient-to-br from-[#16274a] via-[#101e3b] to-[#0b1426] border-2 border-cyan-400 ring-4 ring-cyan-400/25 shadow-2xl shadow-cyan-500/25 scale-[1.02]'
                      : 'bg-gradient-to-br from-cyan-50 via-teal-50 to-white border-2 border-cyan-500 ring-4 ring-cyan-500/20 shadow-xl shadow-cyan-500/15 scale-[1.02]'
                    : isDark
                      ? 'bg-[#11192c] hover:bg-[#16233f] border-[#29385c] hover:border-cyan-500/60 shadow-lg hover:shadow-cyan-500/10'
                      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-cyan-300 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Top Corner Glow for Selected Vehicle */}
                {isSelected && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />
                )}

                {/* Real Photo Thumbnail Banner if available */}
                {v.imageUrl ? (
                  <div className="relative -mx-4 -mt-4 sm:-mx-5 sm:-mt-5 mb-3.5 h-28 overflow-hidden rounded-t-3xl border-b border-cyan-500/30 bg-black/40">
                    <img
                      src={v.imageUrl}
                      alt={v.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-mono font-bold text-cyan-300 border border-cyan-400/40 shadow-sm">
                      <Camera className="w-3 h-3 text-cyan-400" />
                      <span>Foto Real</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVehicleId(v.id);
                        setTimeout(() => heroFileInputRef.current?.click(), 50);
                      }}
                      className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/80 hover:bg-cyan-600 text-[10px] font-mono font-bold text-white border border-cyan-400/40 flex items-center gap-1 transition-all shadow-md cursor-pointer"
                      title="Cambiar foto real de este auto"
                    >
                      <Camera className="w-2.5 h-2.5 text-cyan-300" />
                      <span>Cambiar</span>
                    </button>
                  </div>
                ) : (
                  <div className="relative -mx-4 -mt-4 sm:-mx-5 sm:-mt-5 mb-3.5 h-16 border-b border-dashed border-cyan-500/20 bg-cyan-950/10 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVehicleId(v.id);
                        setTimeout(() => heroFileInputRef.current?.click(), 50);
                      }}
                      className="px-2.5 py-1 rounded-xl border border-dashed border-cyan-500/40 hover:border-cyan-400 bg-black/40 hover:bg-cyan-950/50 text-cyan-300 text-[10px] font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      title="Subir foto real de este vehículo"
                    >
                      <Camera className="w-3 h-3 text-cyan-400" />
                      <span>+ Subir Foto Real</span>
                    </button>
                  </div>
                )}

                {/* Top Row: Icon + Type Badge + Plate Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl border shadow-inner ${
                      isSelected
                        ? isDark
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                          : 'bg-cyan-100 border-cyan-400 text-cyan-800'
                        : isDark
                          ? 'bg-[#1a2744] border-slate-700 text-slate-200'
                          : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}>
                      {getVehicleTypeIcon(v.type)}
                    </div>
                    <div>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase border block ${
                        isSelected
                          ? isDark ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300' : 'bg-cyan-100 border-cyan-300 text-cyan-900'
                          : isDark ? 'bg-[#18233c] border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}>
                        {getVehicleTypeLabel(v.type)}
                      </span>
                    </div>
                  </div>

                  {/* License Plate Stylized Badge */}
                  {v.plate ? (
                    <div className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black tracking-widest border shadow-inner ${
                      isDark
                        ? 'bg-[#070d1a] border-amber-400/60 text-amber-300'
                        : 'bg-amber-50 border-amber-400 text-amber-900'
                    }`}>
                      {v.plate}
                    </div>
                  ) : (
                    <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Sin Placa</span>
                  )}
                </div>

                {/* Vehicle Name & Model */}
                <div className="space-y-0.5 mb-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-base sm:text-lg font-black tracking-tight truncate ${
                      isSelected 
                        ? isDark ? 'text-white' : 'text-slate-900' 
                        : isDark ? 'text-slate-100 group-hover:text-white' : 'text-slate-800 group-hover:text-slate-900'
                    }`}>
                      {v.name}
                    </h4>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-xs shrink-0">
                        Activo
                      </span>
                    )}
                  </div>
                  <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {v.brand} {v.model ? `· Año ${v.model}` : ''}
                  </p>
                </div>

                {/* Quick Telemetry Strip inside Card */}
                <div className={`grid grid-cols-2 gap-2 p-2.5 rounded-2xl border mb-3 ${
                  isSelected
                    ? isDark ? 'bg-[#09101f]/90 border-cyan-500/30' : 'bg-white/90 border-cyan-200'
                    : isDark ? 'bg-[#0b1222]/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  {/* Kilometraje */}
                  <div className="space-y-0.5">
                    <span className={`text-[9px] font-mono uppercase block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Odómetro</span>
                    <div className={`text-xs sm:text-sm font-bold font-mono flex items-center gap-1 ${
                      isDark ? 'text-cyan-300' : 'text-cyan-800'
                    }`}>
                      <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{v.currentMileage?.toLocaleString()} km</span>
                    </div>
                  </div>

                  {/* Aceite Status */}
                  <div className="space-y-0.5">
                    <span className={`text-[9px] font-mono uppercase block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Aceite Motor</span>
                    <div className={`text-xs font-bold font-mono flex items-center gap-1 truncate ${
                      vOil.status === 'vencido' 
                        ? 'text-rose-400' 
                        : vOil.status === 'proximo' 
                          ? 'text-amber-400' 
                          : 'text-emerald-400'
                    }`}>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        vOil.status === 'vencido' ? 'bg-rose-500 animate-ping' : vOil.status === 'proximo' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                      }`} />
                      <span className="truncate">{vOil.kmRemaining > 0 ? `+${vOil.kmRemaining.toLocaleString()} km` : `${vOil.kmRemaining.toLocaleString()} km`}</span>
                    </div>
                  </div>
                </div>

                {/* Card Selection Status Footer */}
                <div className="flex items-center justify-between pt-1">
                  <span className={`text-[10px] font-mono flex items-center gap-1 ${
                    vPolicy.status === 'vencida' 
                      ? 'text-rose-400' 
                      : vPolicy.status === 'por_vencer' 
                        ? 'text-amber-400' 
                        : isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    <Shield className="w-3 h-3" />
                    <span>Póliza: {vPolicy.label}</span>
                  </span>

                  <span className={`text-[11px] font-bold font-mono flex items-center gap-1 ${
                    isSelected
                      ? 'text-cyan-400'
                      : isDark ? 'text-slate-400 group-hover:text-cyan-300' : 'text-slate-500 group-hover:text-cyan-600'
                  }`}>
                    {isSelected ? '✓ Seleccionado' : 'Inspeccionar →'}
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* 3. ACTIVE VEHICLE TELEMETRY CARDS (ODOMETER + OIL COUNTDOWN + POLICY DATES) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* CARD 1: ODOMETER & VEHICLE OVERVIEW */}
        <div className={`p-5 rounded-3xl border shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden transition-all ${
          isDark ? 'bg-[#0e1629] border-slate-800' : 'bg-white border-slate-200 shadow-slate-950/5'
        }`}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold uppercase border ${
                isDark
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                  : 'bg-cyan-100 border-cyan-300 text-cyan-800'
              }`}>
                {getVehicleTypeLabel(activeVehicle.type)}
              </span>
              {activeVehicle.plate && (
                <span className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black tracking-widest border ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-amber-300'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}>
                  {activeVehicle.plate}
                </span>
              )}
            </div>

            <h3 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {activeVehicle.name}
            </h3>
            <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Marca: {activeVehicle.brand} {activeVehicle.model ? `· Año ${activeVehicle.model}` : ''}
            </p>
          </div>

          {/* Odometer Display */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
            isDark ? 'bg-[#080d1a] border-slate-800/80' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <span className={`text-[10px] font-mono block uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Kilometraje Odómetro</span>
              <div className={`text-2xl font-black font-mono tracking-tight ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
                {activeVehicle.currentMileage?.toLocaleString()} <span className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>km</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenQuickMileage}
              className={`px-3 py-2 rounded-xl border text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                isDark
                  ? 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/40 text-cyan-300'
                  : 'bg-cyan-100 hover:bg-cyan-200 border-cyan-300 text-cyan-800'
              }`}
              title="Actualizar lectura del kilometraje"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Actualizar</span>
            </button>
          </div>

          {/* Photo View & Quick Upload in Card 1 */}
          {activeVehicle.imageUrl ? (
            <div className="relative h-28 rounded-2xl overflow-hidden border border-cyan-500/40 shadow-inner group/cphoto bg-black/40">
              <img
                src={activeVehicle.imageUrl}
                alt={activeVehicle.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center group-hover/cphoto:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-mono font-bold text-white border border-cyan-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Foto Real</span>
              </div>
              <button
                type="button"
                onClick={() => heroFileInputRef.current?.click()}
                disabled={isUploadingHeroPhoto}
                className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/80 hover:bg-cyan-600 text-white text-[10px] font-bold border border-cyan-400/50 flex items-center gap-1 cursor-pointer transition-all shadow-md"
                title="Cambiar foto real de este auto"
              >
                <Camera className="w-3 h-3 text-cyan-300" />
                <span>Cambiar</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => heroFileInputRef.current?.click()}
              disabled={isUploadingHeroPhoto}
              className={`p-2.5 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-xs font-mono font-bold transition-all cursor-pointer ${
                isDark
                  ? 'border-slate-800 hover:border-cyan-500/50 bg-[#080d1a]/50 text-slate-400 hover:text-cyan-300'
                  : 'border-slate-300 hover:border-cyan-500 bg-slate-50 hover:bg-cyan-50 text-slate-600 hover:text-cyan-800'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>+ Subir Foto Real del Auto</span>
            </button>
          )}
        </div>

        {/* CARD 2: MOTOR OIL HEALTH & COUNTDOWN */}
        <div className={`p-5 rounded-3xl border shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden transition-all ${
          isDark ? 'bg-[#0e1629] border-slate-800' : 'bg-white border-slate-200 shadow-slate-950/5'
        }`}>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-mono font-bold uppercase flex items-center gap-1.5 ${
                isDark ? 'text-amber-300' : 'text-amber-700'
              }`}>
                <Gauge className="w-4 h-4 text-amber-500" /> Cambio de Aceite de Motor
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border ${oilStatus?.badgeColor}`}>
                {oilStatus?.label}
              </span>
            </div>

            {/* Big Countdown Number */}
            <div className="pt-1">
              <div className="text-3xl font-black font-mono tracking-tight flex items-baseline gap-1.5">
                <span className={oilStatus?.status === 'vencido' ? 'text-rose-500' : isDark ? 'text-white' : 'text-slate-900'}>
                  {oilStatus?.status === 'vencido'
                    ? `-${Math.abs(oilStatus.kmRemaining).toLocaleString()}`
                    : oilStatus?.kmRemaining.toLocaleString()}
                </span>
                <span className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>km para el cambio</span>
              </div>

              {/* Progress bar of oil life */}
              <div className={`w-full h-2.5 rounded-full overflow-hidden border mt-2 ${
                isDark ? 'bg-[#080d1a] border-slate-800' : 'bg-slate-200 border-slate-300'
              }`}>
                <div 
                  className={`h-full transition-all duration-500 ${oilStatus?.progressColor}`}
                  style={{ width: `${oilStatus?.oilLifePercentage}%` }}
                />
              </div>
              <div className={`flex justify-between text-[10px] font-mono mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <span>Vida útil: {oilStatus?.oilLifePercentage}%</span>
                <span>Intervalo: cada {activeVehicle.oilChangeIntervalKm?.toLocaleString()} km</span>
              </div>
            </div>

            <div className={`text-xs font-mono space-y-1 pt-1 border-t ${
              isDark ? 'text-slate-300 border-slate-800/60' : 'text-slate-700 border-slate-200'
            }`}>
              <div className="flex justify-between">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Último cambio:</span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeVehicle.oilChangeLastMileage?.toLocaleString()} km</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Próximo cambio:</span>
                <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>{oilStatus?.nextOilChangeKm.toLocaleString()} km</span>
              </div>
              {activeVehicle.oilType && (
                <div className="flex justify-between">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Aceite:</span>
                  <span className={`truncate max-w-[140px] font-medium ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>{activeVehicle.oilType}</span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirmOilChangeDone}
            className={`w-full py-2.5 rounded-xl border font-mono font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
              isDark
                ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300 hover:text-white'
                : 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Registrar Cambio de Aceite Hecho ✓</span>
          </button>
        </div>

        {/* CARD 3: INSURANCE POLICY & DOCUMENT EXPIRATIONS */}
        <div className={`p-5 rounded-3xl border shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden transition-all ${
          isDark ? 'bg-[#0e1629] border-slate-800' : 'bg-white border-slate-200 shadow-slate-950/5'
        }`}>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-mono font-bold uppercase flex items-center gap-1.5 ${
                isDark ? 'text-emerald-300' : 'text-emerald-700'
              }`}>
                <Shield className="w-4 h-4 text-emerald-500" /> Póliza & Documentos
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border ${policyStatus?.badgeColor}`}>
                {policyStatus?.label}
              </span>
            </div>

            <div className="pt-1">
              <h4 className={`text-base font-black truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {activeVehicle.policyName || 'Póliza de Seguro'}
              </h4>
              <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {activeVehicle.policyCompany ? `Aseguradora: ${activeVehicle.policyCompany}` : 'Sin aseguradora registrada'}
              </p>
            </div>

            <div className={`p-3 rounded-2xl border space-y-1 font-mono text-xs ${
              isDark ? 'bg-[#080d1a] border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Vence el:</span>
                <span className={`font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{policyStatus?.formattedDate}</span>
              </div>
              {activeVehicle.policyNumber && (
                <div className="flex justify-between">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>N° Póliza:</span>
                  <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{activeVehicle.policyNumber}</span>
                </div>
              )}
              {activeVehicle.policyCost && (
                <div className="flex justify-between">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Costo anual:</span>
                  <span className={isDark ? 'text-amber-300' : 'text-amber-700'}>${activeVehicle.policyCost.toLocaleString()}</span>
                </div>
              )}
            </div>

            {activeVehicle.techInspectionExpirationDate && (
              <div className={`text-[11px] font-mono flex items-center justify-between px-1 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                <span>Rev. Técnico-Mecánica:</span>
                <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-900'}`}>{activeVehicle.techInspectionExpirationDate}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleOpenEditVehicle(activeVehicle)}
            className={`w-full py-2.5 rounded-xl border font-mono font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
              isDark
                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300 hover:text-white'
                : 'bg-emerald-100 hover:bg-emerald-200 border-emerald-300 text-emerald-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Actualizar Fechas de Póliza</span>
          </button>
        </div>

      </div>

      {/* 3. MAINTENANCE & UPGRADES SECTION */}
      <div className={`p-6 rounded-3xl border shadow-2xl space-y-6 transition-all ${
        isDark ? 'bg-[#0b1222] border-slate-800' : 'bg-white border-slate-200 shadow-slate-950/5'
      }`}>
        
        {/* Section Header & Sub-Tabs */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div>
            <h3 className={`text-lg font-black tracking-tight flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              <Wrench className="w-5 h-5 text-cyan-500" />
              <span>Mantenimientos & Mejoras de {activeVehicle.name}</span>
            </h3>
            <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Control preventivo, reparaciones correctivas pendientes y mejoras deseadas
            </p>
          </div>

          {/* New Item Action Button */}
          <button
            type="button"
            onClick={() => handleOpenAddMaint(activeMaintTab)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-mono font-black text-xs shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Añadir {getMaintenanceCategoryMeta(activeMaintTab).shortLabel}</span>
          </button>
        </div>

        {/* Categories Tab Selector (Preventivo / Correctivo / Mejora) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {/* Preventivo */}
            <button
              type="button"
              onClick={() => setActiveMaintTab('preventivo')}
              className={`px-4 py-2.5 rounded-2xl font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap border ${
                activeMaintTab === 'preventivo'
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                  : isDark
                    ? 'bg-[#10192e] border-slate-800 text-slate-400 hover:text-slate-200'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Mantenimiento Preventivo</span>
              <span className={`px-2 py-0.2 rounded-full text-[10px] ${
                pendingPreventives.length > 0
                  ? isDark ? 'bg-emerald-500/30 text-emerald-200 font-black' : 'bg-emerald-100 text-emerald-800 font-black'
                  : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
              }`}>
                {pendingPreventives.length} pend.
              </span>
            </button>

            {/* Correctivo */}
            <button
              type="button"
              onClick={() => setActiveMaintTab('correctivo')}
              className={`px-4 py-2.5 rounded-2xl font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap border ${
                activeMaintTab === 'correctivo'
                  ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-lg shadow-rose-500/20 scale-[1.02]'
                  : isDark
                    ? 'bg-[#10192e] border-slate-800 text-slate-400 hover:text-slate-200'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wrench className="w-4 h-4 text-rose-500" />
              <span>Mantenimiento Correctivo</span>
              <span className={`px-2 py-0.2 rounded-full text-[10px] ${
                pendingCorrectives.length > 0
                  ? isDark ? 'bg-rose-500/30 text-rose-200 font-black' : 'bg-rose-100 text-rose-800 font-black'
                  : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
              }`}>
                {pendingCorrectives.length} pend.
              </span>
            </button>

            {/* Mejoras */}
            <button
              type="button"
              onClick={() => setActiveMaintTab('mejora')}
              className={`px-4 py-2.5 rounded-2xl font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap border ${
                activeMaintTab === 'mejora'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20 scale-[1.02]'
                  : isDark
                    ? 'bg-[#10192e] border-slate-800 text-slate-400 hover:text-slate-200'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-cyan-500" />
              <span>Mejoras & Upgrades</span>
              <span className={`px-2 py-0.2 rounded-full text-[10px] ${
                pendingUpgrades.length > 0
                  ? isDark ? 'bg-cyan-500/30 text-cyan-200 font-black' : 'bg-cyan-100 text-cyan-800 font-black'
                  : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
              }`}>
                {pendingUpgrades.length} pend.
              </span>
            </button>
          </div>

          {/* Status Filter (Todos / Pendiente / En Progreso / Completado) */}
          <div className={`flex items-center gap-1.5 self-end sm:self-auto p-1 rounded-xl border ${
            isDark ? 'bg-[#090f1d] border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <Filter className={`w-3.5 h-3.5 ml-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            {(['all', 'pendiente', 'en_progreso', 'completado'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-[11px] font-mono rounded-lg transition-all cursor-pointer ${
                  statusFilter === st
                    ? isDark ? 'bg-slate-800 text-white font-bold' : 'bg-white text-slate-900 font-bold shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'all' ? 'Todos' : st === 'pendiente' ? 'Pendientes' : st === 'en_progreso' ? 'En Taller' : 'Realizados'}
              </button>
            ))}
          </div>

        </div>

        {/* Items List */}
        {currentList.length === 0 ? (
          <div className={`p-8 text-center rounded-2xl border space-y-3 ${
            isDark ? 'bg-[#0e1629] border-slate-800/80' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center ${
              isDark ? 'bg-slate-800/60 text-slate-400' : 'bg-slate-200 text-slate-600'
            }`}>
              {activeMaintTab === 'preventivo' && <ShieldCheck className="w-6 h-6 text-emerald-500" />}
              {activeMaintTab === 'correctivo' && <Wrench className="w-6 h-6 text-rose-500" />}
              {activeMaintTab === 'mejora' && <Sparkles className="w-6 h-6 text-cyan-500" />}
            </div>
            <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              No hay {getMaintenanceCategoryMeta(activeMaintTab).label.toLowerCase()}s con este filtro.
            </p>
            <button
              type="button"
              onClick={() => handleOpenAddMaint(activeMaintTab)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
              }`}
            >
              + Añadir primer registro de {getMaintenanceCategoryMeta(activeMaintTab).shortLabel}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentList.map((item) => {
              const meta = getMaintenanceCategoryMeta(item.category);
              const isCompleted = item.status === 'completado';
              const isInProgress = item.status === 'en_progreso';

              // Km target calculation
              const kmDiff = item.targetMileage ? item.targetMileage - (activeVehicle.currentMileage || 0) : null;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
                    isCompleted
                      ? isDark ? 'bg-[#090f1d]/80 border-slate-800/60 opacity-80' : 'bg-slate-50 border-slate-200 opacity-80'
                      : isInProgress
                        ? isDark ? 'bg-[#121c33] border-amber-500/40 shadow-lg shadow-amber-500/10' : 'bg-amber-50/70 border-amber-300 shadow-sm'
                        : isDark ? 'bg-[#101b33] border-slate-700/80 hover:border-cyan-500/40 shadow-md' : 'bg-white border-slate-200 hover:border-cyan-400 shadow-sm'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleMaintStatus(item)}
                          className={`w-5 h-5 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                            isCompleted
                              ? 'bg-emerald-500 border-emerald-400 text-black'
                              : isInProgress
                                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                                : isDark ? 'border-slate-600 hover:border-cyan-400' : 'border-slate-300 hover:border-cyan-500'
                          }`}
                          title="Clic para cambiar estado: Pendiente -> En Taller -> Completado"
                        >
                          {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          {isInProgress && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
                        </button>

                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold ${
                          isCompleted
                            ? isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                            : isInProgress
                              ? isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'
                              : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {isCompleted ? '✓ Realizado' : isInProgress ? '⚙️ En Taller' : '⏳ Pendiente'}
                        </span>

                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold ${
                          item.priority === 'urgente'
                            ? isDark ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-rose-100 text-rose-800 border border-rose-300'
                            : item.priority === 'alta'
                              ? isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'
                              : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.priority.toUpperCase()}
                        </span>
                      </div>

                      {item.cost && (
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
                          isDark
                            ? 'text-emerald-300 bg-emerald-950/40 border-emerald-500/30'
                            : 'text-emerald-800 bg-emerald-50 border-emerald-200'
                        }`}>
                          ${item.cost.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className={`text-sm font-black ${
                      isCompleted
                        ? 'line-through text-slate-400'
                        : isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {item.title}
                    </h4>

                    {/* Description */}
                    {item.description && (
                      <p className={`text-xs font-sans leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {item.description}
                      </p>
                    )}

                    {/* Target Mileage or Date details */}
                    <div className="flex flex-wrap gap-2 text-[11px] font-mono pt-1">
                      {item.targetMileage && (
                        <span className={`px-2 py-0.5 rounded-lg border ${
                          kmDiff !== null && kmDiff <= 0
                            ? isDark ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-700'
                            : isDark ? 'bg-[#090f1d] border-slate-800 text-cyan-300' : 'bg-slate-50 border-slate-200 text-cyan-700'
                        }`}>
                          🎯 A los {item.targetMileage.toLocaleString()} km
                          {kmDiff !== null && (
                            <span className="ml-1 text-[10px]">
                              ({kmDiff <= 0 ? `¡Superado por ${Math.abs(kmDiff).toLocaleString()} km!` : `faltan ${kmDiff.toLocaleString()} km`})
                            </span>
                          )}
                        </span>
                      )}

                      {item.dueDate && (
                        <span className={`px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
                          isDark ? 'bg-[#090f1d] border-slate-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
                        }`}>
                          <Calendar className="w-3 h-3" /> Fecha: {item.dueDate}
                        </span>
                      )}

                      {item.workshop && (
                        <span className={`px-2 py-0.5 rounded-lg border ${
                          isDark ? 'bg-[#090f1d] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}>
                          📍 {item.workshop}
                        </span>
                      )}
                    </div>

                    {/* Parts pills */}
                    {item.parts && item.parts.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.parts.map((p, idx) => (
                          <span key={idx} className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                            isDark ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            🏷️ {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Item Actions */}
                  <div className={`flex items-center justify-between pt-3 border-t ${
                    isDark ? 'border-slate-800/80' : 'border-slate-200'
                  }`}>
                    <button
                      type="button"
                      onClick={() => handleToggleMaintStatus(item)}
                      className="text-[11px] font-mono font-bold text-cyan-600 hover:text-cyan-500 transition-colors cursor-pointer"
                    >
                      {isCompleted ? 'Marcar como pendiente' : isInProgress ? 'Marcar completado ✓' : 'Mover a "En Taller" →'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditMaint(item)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isDark ? 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800' : 'text-slate-500 hover:text-cyan-700 hover:bg-slate-100'
                        }`}
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`¿Eliminar este registro de ${item.title}?`)) {
                            onDeleteMaintenance(item.id);
                          }
                        }}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-500 hover:text-rose-600 hover:bg-slate-100'
                        }`}
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* 4. MODALS */}
      {isVehicleModalOpen && (
        <VehicleModal
          isOpen={isVehicleModalOpen}
          onClose={() => {
            setIsVehicleModalOpen(false);
            setEditingVehicle(null);
          }}
          editingVehicle={editingVehicle}
          onSaveVehicle={(vData) => {
            if (editingVehicle) {
              onUpdateVehicle({ ...editingVehicle, ...vData } as Vehicle);
            } else {
              onAddVehicle(vData);
            }
            setIsVehicleModalOpen(false);
            setEditingVehicle(null);
          }}
        />
      )}

      {isMaintModalOpen && activeVehicle && (
        <VehicleMaintenanceModal
          isOpen={isMaintModalOpen}
          onClose={() => {
            setIsMaintModalOpen(false);
            setEditingMaint(null);
          }}
          vehicle={activeVehicle}
          editingMaintenance={editingMaint}
          defaultCategory={defaultMaintCategory}
          onSave={(mData) => {
            if (editingMaint) {
              onUpdateMaintenance({ ...editingMaint, ...mData } as VehicleMaintenance);
            } else {
              onAddMaintenance(mData);
            }
            setIsMaintModalOpen(false);
            setEditingMaint(null);
          }}
        />
      )}

      {/* Quick Mileage Update Modal */}
      {isMileageModalOpen && activeVehicle && (
        <div 
          id="mileage-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
        >
          <div 
            id="modal-quick-mileage"
            className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 border ${
              isDark 
                ? 'bg-[#0f172a] border-sky-500/50 text-slate-100 shadow-black/80' 
                : 'bg-white border-sky-300 text-slate-900 shadow-slate-300/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase flex items-center gap-1.5 ${
                isDark ? 'text-sky-300' : 'text-sky-800'
              }`}>
                <Gauge className="w-4 h-4 text-sky-500" /> Actualizar Odómetro
              </span>
              <button
                type="button"
                onClick={() => setIsMileageModalOpen(false)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                ✕
              </button>
            </div>

            <div>
              <p className={`text-xs sm:text-sm font-medium leading-relaxed ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Ingresa el kilometraje actual que marca el tablero de <strong>{activeVehicle.name}</strong>:
              </p>
              <div className="mt-3 relative">
                <input
                  id="input-quick-mileage-number"
                  type="number"
                  min="0"
                  autoFocus
                  required
                  value={newMileageInput}
                  onChange={(e) => setNewMileageInput(e.target.value === '' ? '' : Number(e.target.value))}
                  className={`w-full rounded-2xl px-4 py-3 text-xl font-mono font-black border transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                    isDark 
                      ? 'bg-[#1e293b] border-sky-500/60 text-sky-300 focus:border-sky-400' 
                      : 'bg-white border-sky-400 text-sky-900 focus:border-sky-500 shadow-xs'
                  }`}
                />
                <span className={`absolute right-4 top-3.5 text-xs font-mono font-bold ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  KM
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsMileageModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Cancelar
              </button>
              <button
                id="btn-save-quick-mileage"
                type="button"
                onClick={handleSaveQuickMileage}
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Guardar Km
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fresh Start (Reset All Vehicles) Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 border ${
            isDark 
              ? 'bg-[#0f172a] border-red-500/40 text-slate-100' 
              : 'bg-white border-red-300 text-slate-900 shadow-slate-300/80'
          }`}>
            <div className="flex items-center space-x-3 text-red-500">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
              }`}>
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className={`font-black text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  ¿Limpiar Todo el Garaje?
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Fresh Start de Vehículos & Mantenimientos
                </p>
              </div>
            </div>

            <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Esta acción eliminará todos los vehículos registrados, odómetros, fechas de pólizas y el historial completo de mantenimientos para que puedas empezar desde cero.
            </p>

            <div className={`p-3 rounded-2xl border text-xs font-semibold ${
              isDark ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              ⚠️ Esta acción no se puede deshacer.
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsResetConfirmOpen(false);
                  if (onResetVehiclesData) {
                    onResetVehiclesData();
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-500/30 cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Limpiar Garaje</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
