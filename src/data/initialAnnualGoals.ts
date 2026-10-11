import { AnnualGoal } from '../types';

export const INITIAL_ANNUAL_GOALS: AnnualGoal[] = [
  {
    id: 'ag-2026-1',
    year: 2026,
    title: 'Consolidar Fondo de Emergencia y Portafolio de Inversión',
    description: 'Tener 6 meses de gastos fijos resguardados en cuenta de alta rentabilidad y diversificar aportes mensuales.',
    categoryId: 'finanzas_hogar',
    status: 'en_progreso',
    quarter: 'anual',
    targetDate: '2026-12-31',
    targetMetricValue: 100,
    currentMetricValue: 70,
    metricUnit: '%',
    milestones: [
      { id: 'm-1-1', title: 'Liquidar saldo diferido de tarjetas de crédito', completed: true, targetQuarter: 'Q1' },
      { id: 'm-1-2', title: 'Automatizar transferencia quincenal del 20% de nómina', completed: true, targetQuarter: 'Q2' },
      { id: 'm-1-3', title: 'Completar los primeros 3 meses de fondo de tranquilidad', completed: true, targetQuarter: 'Q3' },
      { id: 'm-1-4', title: 'Llegar a la meta total de 6 meses de gastos resguardados', completed: false, targetQuarter: 'Q4' }
    ],
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-09-20T10:00:00.000Z'
  },
  {
    id: 'ag-2026-2',
    year: 2026,
    title: 'Acondicionamiento Físico & Carrera 10K',
    description: 'Reducir porcentaje de grasa, mantener peso objetivo de 70 kg y correr 10 km continuos con excelente ritmo cardiovascular.',
    categoryId: 'salud_bienestar',
    status: 'en_progreso',
    quarter: 'anual',
    targetDate: '2026-11-15',
    targetMetricValue: 10,
    currentMetricValue: 7,
    metricUnit: 'km',
    milestones: [
      { id: 'm-2-1', title: 'Completar 3 meses ininterrumpidos de gimnasio (3-4 días/sem)', completed: true, targetQuarter: 'Q1' },
      { id: 'm-2-2', title: 'Correr 5 km continuos por debajo de 28 minutos', completed: true, targetQuarter: 'Q2' },
      { id: 'm-2-3', title: 'Inscripción oficial y entrenamiento específico para carrera 10K', completed: false, targetQuarter: 'Q3' },
      { id: 'm-2-4', title: 'Cruzar la meta de los 10 km sintiéndose fuerte y saludable', completed: false, targetQuarter: 'Q4' }
    ],
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-09-22T14:30:00.000Z'
  },
  {
    id: 'ag-2026-3',
    year: 2026,
    title: 'Leer 12 Libros de Crecimiento & Especialización Técnica',
    description: 'Consolidar el hábito de lectura diaria de 20 páginas y obtener certificación profesional.',
    categoryId: 'desarrollo_personal',
    status: 'en_progreso',
    quarter: 'anual',
    targetDate: '2026-12-20',
    targetMetricValue: 12,
    currentMetricValue: 9,
    metricUnit: 'libros',
    milestones: [
      { id: 'm-3-1', title: 'Leer primeros 3 libros y crear biblioteca de notas', completed: true, targetQuarter: 'Q1' },
      { id: 'm-3-2', title: 'Completar módulo avanzado de formación profesional', completed: true, targetQuarter: 'Q2' },
      { id: 'm-3-3', title: 'Alcanzar 9 libros leídos y aplicar aprendizajes en proyectos', completed: true, targetQuarter: 'Q3' },
      { id: 'm-3-4', title: 'Completar los 12 libros y rendir examen de certificación', completed: false, targetQuarter: 'Q4' }
    ],
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-09-24T16:00:00.000Z'
  },
  {
    id: 'ag-2026-4',
    year: 2026,
    title: 'Viaje Soñado a San Andrés y Aventura en Pareja',
    description: 'Disfrutar tiempo de calidad, descanso pleno frente al mar de los 7 colores y desconexión laboral.',
    categoryId: 'familia_pareja',
    status: 'en_progreso',
    quarter: 'Q4',
    targetDate: '2026-11-20',
    targetMetricValue: 100,
    currentMetricValue: 75,
    metricUnit: '%',
    milestones: [
      { id: 'm-4-1', title: 'Acordar fechas y presupuesto total del viaje', completed: true, targetQuarter: 'Q1' },
      { id: 'm-4-2', title: 'Comprar tiquetes aéreos y reservar hotel frente al mar', completed: true, targetQuarter: 'Q2' },
      { id: 'm-4-3', title: 'Comprar equipaje y planear tour a Cayo Bolívar y Jonhy Cay', completed: true, targetQuarter: 'Q3' },
      { id: 'm-4-4', title: 'Disfrutar de las vacaciones y crear álbum de recuerdos', completed: false, targetQuarter: 'Q4' }
    ],
    createdAt: '2026-01-05T09:00:00.000Z',
    updatedAt: '2026-09-15T11:00:00.000Z'
  },
  {
    id: 'ag-2026-5',
    year: 2026,
    title: 'Puesta a Punto Completa del Vehículo & Mantenimiento Preventivo',
    description: 'Mantener el vehículo en estado impecable mecánico y estético para máxima seguridad y confort en viajes.',
    categoryId: 'vehiculos_garaje',
    status: 'en_progreso',
    quarter: 'anual',
    targetDate: '2026-12-10',
    targetMetricValue: 100,
    currentMetricValue: 60,
    metricUnit: '%',
    milestones: [
      { id: 'm-5-1', title: 'Cambio de aceite sintético 5W-30 y filtros', completed: true, targetQuarter: 'Q1' },
      { id: 'm-5-2', title: 'Sustitución de pastillas de freno y alineación/balanceo', completed: true, targetQuarter: 'Q2' },
      { id: 'm-5-3', title: 'Renovación de póliza todo riesgo y seguro obligatorio', completed: false, targetQuarter: 'Q3' },
      { id: 'm-5-4', title: 'Detailing interior y tratamiento cerámico de pintura', completed: false, targetQuarter: 'Q4' }
    ],
    createdAt: '2026-01-10T11:00:00.000Z',
    updatedAt: '2026-09-18T18:00:00.000Z'
  }
];
