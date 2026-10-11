import { Vehicle, VehicleMaintenance, VehicleType, MaintenanceCategory } from '../types';

export interface OilStatusResult {
  nextOilChangeKm: number;
  kmRemaining: number;
  kmDrivenSinceChange: number;
  oilLifePercentage: number; // 0 to 100%
  status: 'excelente' | 'bueno' | 'proximo' | 'vencido';
  label: string;
  badgeColor: string;
  progressColor: string;
}

export function calculateOilStatus(vehicle: Vehicle): OilStatusResult {
  const lastKm = Number(vehicle.oilChangeLastMileage) || 0;
  const interval = Number(vehicle.oilChangeIntervalKm) || 5000;
  const currentKm = Number(vehicle.currentMileage) || 0;

  const nextOilChangeKm = lastKm + interval;
  const kmRemaining = nextOilChangeKm - currentKm;
  const kmDrivenSinceChange = Math.max(0, currentKm - lastKm);
  
  // Calculate remaining life percentage of the oil
  const rawPercentage = ((interval - kmDrivenSinceChange) / interval) * 100;
  const oilLifePercentage = Math.max(0, Math.min(100, Math.round(rawPercentage)));

  if (kmRemaining < 0) {
    return {
      nextOilChangeKm,
      kmRemaining,
      kmDrivenSinceChange,
      oilLifePercentage: 0,
      status: 'vencido',
      label: `Vencido por ${Math.abs(kmRemaining).toLocaleString()} km`,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
      progressColor: 'bg-gradient-to-r from-rose-600 to-red-500',
    };
  }

  if (kmRemaining <= 800) {
    return {
      nextOilChangeKm,
      kmRemaining,
      kmDrivenSinceChange,
      oilLifePercentage,
      status: 'proximo',
      label: `Cambio próximo (${kmRemaining.toLocaleString()} km restantes)`,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
      progressColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
    };
  }

  if (oilLifePercentage > 60) {
    return {
      nextOilChangeKm,
      kmRemaining,
      kmDrivenSinceChange,
      oilLifePercentage,
      status: 'excelente',
      label: `Óptimo (${kmRemaining.toLocaleString()} km restantes)`,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
      progressColor: 'bg-gradient-to-r from-emerald-500 to-teal-400',
    };
  }

  return {
    nextOilChangeKm,
    kmRemaining,
    kmDrivenSinceChange,
    oilLifePercentage,
    status: 'bueno',
    label: `Al día (${kmRemaining.toLocaleString()} km restantes)`,
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50',
    progressColor: 'bg-gradient-to-r from-cyan-500 to-blue-500',
  };
}

export interface PolicyStatusResult {
  daysRemaining: number | null;
  status: 'vigente' | 'por_vencer' | 'vencida' | 'no_registrada';
  label: string;
  badgeColor: string;
  formattedDate: string;
}

export function calculatePolicyStatus(expirationDate?: string): PolicyStatusResult {
  if (!expirationDate) {
    return {
      daysRemaining: null,
      status: 'no_registrada',
      label: 'Sin póliza registrada',
      badgeColor: 'bg-slate-700/50 text-slate-400 border-slate-600',
      formattedDate: 'No configurada',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = expirationDate.split('-').map(Number);
  const expDate = new Date(year, month - 1, day);
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const formattedDate = expDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  if (daysRemaining < 0) {
    return {
      daysRemaining,
      status: 'vencida',
      label: `Vencida hace ${Math.abs(daysRemaining)} días`,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
      formattedDate,
    };
  }

  if (daysRemaining <= 30) {
    return {
      daysRemaining,
      status: 'por_vencer',
      label: daysRemaining === 0 ? 'Vence hoy' : `Vence en ${daysRemaining} días`,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
      formattedDate,
    };
  }

  return {
    daysRemaining,
    status: 'vigente',
    label: `Vigente (${daysRemaining} días)`,
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
    formattedDate,
  };
}

export function getVehicleTypeLabel(type: VehicleType): string {
  switch (type) {
    case 'automovil':
      return 'Automóvil / Sedán / Hatchback';
    case 'camioneta':
      return 'Camioneta / SUV / Pick-up';
    case 'moto':
      return 'Motocicleta / Scooter';
    case 'camion':
      return 'Camión / Furgoneta';
    default:
      return 'Vehículo';
  }
}

export function getVehicleTypeIcon(type: VehicleType): string {
  switch (type) {
    case 'automovil':
      return '🚗';
    case 'camioneta':
      return '🚙';
    case 'moto':
      return '🏍️';
    case 'camion':
      return '🚚';
    default:
      return '🏎️';
  }
}

export function getMaintenanceCategoryMeta(cat: MaintenanceCategory) {
  switch (cat) {
    case 'preventivo':
      return {
        label: 'Mantenimiento Preventivo',
        shortLabel: 'Preventivo',
        color: '#38ef7d',
        icon: 'ShieldCheck',
        description: 'Servicios programados para evitar fallas (filtros, frenos, bujías, fluidos, llantas)',
        tagBg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
      };
    case 'correctivo':
      return {
        label: 'Mantenimiento Correctivo',
        shortLabel: 'Correctivo',
        color: '#f43f5e',
        icon: 'Wrench',
        description: 'Reparaciones mecánicas, ruidos, fugas, fallas eléctricas o cambios de piezas dañadas',
        tagBg: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
      };
    case 'mejora':
      return {
        label: 'Mejora / Upgrade',
        shortLabel: 'Mejora',
        color: '#00f2ff',
        icon: 'Sparkles',
        description: 'Personalización, accesorios, sonido, rines, polarizado nano-cerámico, confort y estética',
        tagBg: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300',
      };
  }
}

// Initial Sample Seed Vehicles
export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'veh-1',
    name: 'Mazda 3 Grand Touring',
    brand: 'Mazda',
    model: '2022',
    plate: 'KRM-482',
    type: 'automovil',
    currentMileage: 34200,
    color: '#00f2ff',
    oilChangeLastMileage: 30000,
    oilChangeIntervalKm: 5000,
    oilType: '100% Sintético 0W-20 Skyactiv',
    oilChangeLastDate: '2026-05-15',
    policyName: 'Póliza Todo Riesgo',
    policyCompany: 'Sura Seguros',
    policyNumber: 'POL-993821-COL',
    policyExpirationDate: '2026-11-20',
    policyCost: 2800000,
    techInspectionExpirationDate: '2027-03-10',
    notes: 'Mantenimientos al día en concesionario oficial. Batería cambiada en 2025.',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-15',
  },
  {
    id: 'veh-2',
    name: 'Toyota Hilux 4x4 Diésel',
    brand: 'Toyota',
    model: '2021',
    plate: 'HXC-901',
    type: 'camioneta',
    currentMileage: 58900,
    color: '#fbbf24',
    oilChangeLastMileage: 55000,
    oilChangeIntervalKm: 5000,
    oilType: 'Sintético 5W-30 Diésel DPF',
    oilChangeLastDate: '2026-06-10',
    policyName: 'Póliza Todo Riesgo + Asistencia 4x4',
    policyCompany: 'Allianz',
    policyNumber: 'ALZ-442819',
    policyExpirationDate: '2026-09-12', // Próxima a vencer
    policyCost: 3500000,
    techInspectionExpirationDate: '2026-12-05',
    notes: 'Uso mixto ciudad y carretera. Excelente rendimiento de combustible.',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-15',
  },
  {
    id: 'veh-3',
    name: 'Yamaha MT-07',
    brand: 'Yamaha',
    model: '2023',
    plate: 'YMH-23F',
    type: 'moto',
    currentMileage: 12400,
    color: '#ec4899',
    oilChangeLastMileage: 10000,
    oilChangeIntervalKm: 3000,
    oilType: 'Yamalube 4T Sintético 10W-40',
    oilChangeLastDate: '2026-07-02',
    policyName: 'SOAT + Seguro Responsabilidad Civil',
    policyCompany: 'Mapfre',
    policyNumber: 'MAP-102938',
    policyExpirationDate: '2027-01-15',
    policyCost: 950000,
    notes: 'Cadena lubricada cada 500km. Llantas Michelin Road 5 en perfecto estado.',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-15',
  },
];

// Initial Sample Maintenances
export const INITIAL_VEHICLE_MAINTENANCES: VehicleMaintenance[] = [
  {
    id: 'maint-1',
    vehicleId: 'veh-1', // Mazda 3
    category: 'preventivo',
    title: 'Cambio de pastillas de frenos delanteras y líquido DOT 4',
    description: 'Revisión de grosor de pastillas y purga de líquido de frenos.',
    status: 'pendiente',
    priority: 'alta',
    targetMileage: 35000,
    dueDate: '2026-09-05',
    cost: 320000,
    workshop: 'Taller Especializado Mazda',
    parts: ['Pastillas cerámicas Brembo / OEM', '1L Líquido DOT 4'],
    createdAt: '2026-08-10',
    updatedAt: '2026-08-15',
  },
  {
    id: 'maint-2',
    vehicleId: 'veh-1', // Mazda 3
    category: 'mejora',
    title: 'Instalar película de seguridad y polarizado nano-cerámico',
    description: 'Reducción de calor al 85% y protección UV para cabina.',
    status: 'pendiente',
    priority: 'media',
    dueDate: '2026-09-20',
    cost: 450000,
    workshop: 'AutoDetailing Pro',
    notes: 'Tono 20% laterales y 35% panorámico delantero legal.',
    createdAt: '2026-08-12',
    updatedAt: '2026-08-15',
  },
  {
    id: 'maint-3',
    vehicleId: 'veh-2', // Toyota Hilux
    category: 'correctivo',
    title: 'Revisar ruido en bujes de tijera delantera derecha',
    description: 'Se siente un pequeño crujido al pasar por baches a baja velocidad.',
    status: 'en_progreso',
    priority: 'urgente',
    targetMileage: 59000,
    dueDate: '2026-08-25',
    cost: 280000,
    workshop: 'Suspensiones 4x4 Master',
    parts: ['Bujes de poliuretano', 'Alineación computarizada'],
    createdAt: '2026-08-14',
    updatedAt: '2026-08-16',
  },
  {
    id: 'maint-4',
    vehicleId: 'veh-2', // Toyota Hilux
    category: 'preventivo',
    title: 'Cambio de filtro de combustible (diésel) y filtro de aire',
    description: 'Mantenimiento preventivo esencial para inyección Common Rail.',
    status: 'pendiente',
    priority: 'alta',
    targetMileage: 60000,
    dueDate: '2026-09-15',
    cost: 190000,
    workshop: 'Centro de Servicio Diésel',
    createdAt: '2026-08-11',
    updatedAt: '2026-08-11',
  },
  {
    id: 'maint-5',
    vehicleId: 'veh-3', // Yamaha MT-07
    category: 'mejora',
    title: 'Sliders de protección de motor y protector de radiador',
    description: 'Instalar protecciones de aluminio CNC para caídas en curva.',
    status: 'completado',
    priority: 'media',
    completedDate: '2026-08-05',
    cost: 380000,
    workshop: 'MotoStore Racing',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-05',
  },
];
