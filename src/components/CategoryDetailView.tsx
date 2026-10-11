import React, { useState, useEffect } from 'react';
import { Task, CategoryInfo, IdeaItem, TaskStatus, Priority, IdeaType, HealthProfile, WeightLogEntry, Vehicle, VehicleMaintenance, MedicalAppointment, MedicalExamNote, TripDestination, MediaBacklogItem, MediaReviewItem, GameBacklogItem, MonthlyBillItem, MonthlyIncomeItem, MonthlyExtraExpenseItem, DebtItem, DebtPaymentRecord, BookItem, ReadingQuote, DailyCalorieLog, SmartPurchaseGoal } from '../types';
import { VoiceIdeaModal } from './VoiceIdeaModal';
import { HealthHubView } from './HealthHubView';
import { VehiclesHubView } from './VehiclesHubView';
import { MedicalAppointmentsView } from './MedicalAppointmentsView';
import { FamilyTripsView } from './FamilyTripsView';
import { EntertainmentHubView } from './EntertainmentHubView';
import { MonthlyBillsTrackerView } from './MonthlyBillsTrackerView';
import { ReadingHubView } from './ReadingHubView';
import { SmartPurchasesPlannerView } from './SmartPurchasesPlannerView';
import { JobThingsHubView } from './JobThingsHubView';
import { CollectionDoodleBackground, getCategoryContrastColor, getCategoryDoodleTags, getCategoryDoodleBadge } from './CollectionDoodleBackground';
import { useTheme } from '../context/ThemeContext';
import { 
  getPriorityBadgeColor, 
  getStatusBadgeColor, 
  getStatusLabelSpanish, 
  formatShortDateSpanish, 
  getTaskProgressPercentage 
} from '../utils/helpers';
import { TaskLiveTimer } from './TaskLiveTimer';
import { getIdeaAgeDays, getIdeaAgeBadgeStyle, getIdeaStatusConfig } from '../utils/ideaHelpers';
import { 
  ArrowLeft,
  Plus, 
  Clock, 
  Target, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Edit3, 
  Trash2, 
  CheckSquare, 
  AlertCircle,
  TrendingUp,
  Sparkles,
  Heart,
  Activity,
  BookOpen,
  Bookmark,
  BookMarked,
  Smile,
  Home,
  Lightbulb,
  Mic,
  Tag,
  Gamepad2,
  Gamepad,
  Clapperboard,
  Film,
  Tv,
  PiggyBank,
  Coins,
  Wallet,
  CircleDollarSign,
  Dumbbell,
  ArrowRight,
  Bot,
  Layers,
  ChevronRight,
  Filter,
  Check,
  Flame,
  Search,
  Paintbrush,
  Scale,
  Zap,
  Car,
  Gauge,
  Wrench,
  ShieldCheck,
  Plane,
  Palmtree,
  ShoppingBag,
  Briefcase
} from 'lucide-react';

interface CategoryDetailViewProps {
  category: CategoryInfo;
  allCategories: CategoryInfo[];
  tasks: Task[];
  ideas: IdeaItem[];
  healthProfile?: HealthProfile;
  weightLogs?: WeightLogEntry[];
  calorieLogs?: DailyCalorieLog[];
  vehicles?: Vehicle[];
  vehicleMaintenances?: VehicleMaintenance[];
  onBackToOverview: () => void;
  onSelectCategory: (categoryId: string) => void;
  onOpenNewTaskModal: (prefilled?: Partial<Task>) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onLogHours: (task: Task) => void;
  onToggleSubgoal: (taskId: string, subgoalId: string) => void;
  onQuickStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onAssignToCalendar: (task: Task) => void;
  onAddIdea: (idea: Omit<IdeaItem, 'id' | 'createdAt'>) => void;
  onDeleteIdea: (ideaId: string) => void;
  onConvertIdeaToTask: (idea: IdeaItem) => void;
  onConsultAgent?: (task: Task) => void;
  onUpdateHealthProfile?: (updated: HealthProfile) => void;
  onAddWeightLog?: (entry: Omit<WeightLogEntry, 'id' | 'createdAt'>) => void;
  onDeleteWeightLog?: (logId: string) => void;
  onSaveDailyCalorieLog?: (log: DailyCalorieLog) => void;
  onDeleteDailyCalorieLog?: (logId: string) => void;
  onAddVehicle?: (vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateVehicle?: (vehicle: Vehicle) => void;
  onDeleteVehicle?: (vehicleId: string) => void;
  onAddVehicleMaintenance?: (maint: Omit<VehicleMaintenance, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateVehicleMaintenance?: (maint: VehicleMaintenance) => void;
  onDeleteVehicleMaintenance?: (maintId: string) => void;
  onRecordOilChange?: (vehicleId: string, currentMileage: number) => void;
  onQuickUpdateMileage?: (vehicleId: string, newMileage: number) => void;
  onResetVehiclesData?: () => void;
  onResetHealthData?: () => void;
  onResetCategoryData?: (categoryId: string) => void;
  medicalAppointments?: MedicalAppointment[];
  medicalExamNotes?: MedicalExamNote[];
  onAddMedicalAppointment?: (appointment: Omit<MedicalAppointment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateMedicalAppointment?: (appointment: MedicalAppointment) => void;
  onDeleteMedicalAppointment?: (appointmentId: string) => void;
  onAddMedicalExamNote?: (note: Omit<MedicalExamNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateMedicalExamNote?: (note: MedicalExamNote) => void;
  onDeleteMedicalExamNote?: (noteId: string) => void;
  onResetMedicalData?: () => void;
  familyTrips?: TripDestination[];
  onAddFamilyTrip?: (trip: Omit<TripDestination, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateFamilyTrip?: (trip: TripDestination) => void;
  onDeleteFamilyTrip?: (tripId: string) => void;
  onResetFamilyTripsData?: () => void;
  mediaBacklog?: MediaBacklogItem[];
  gameBacklog?: GameBacklogItem[];
  mediaReviews?: MediaReviewItem[];
  onAddMediaBacklog?: (item: Omit<MediaBacklogItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateMediaBacklog?: (item: MediaBacklogItem) => void;
  onDeleteMediaBacklog?: (itemId: string) => void;
  onAddGameBacklog?: (item: Omit<GameBacklogItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateGameBacklog?: (item: GameBacklogItem) => void;
  onDeleteGameBacklog?: (gameId: string) => void;
  onAddMediaReview?: (item: Omit<MediaReviewItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateMediaReview?: (item: MediaReviewItem) => void;
  onDeleteMediaReview?: (reviewId: string) => void;
  onResetEntertainmentData?: () => void;
  monthlyBills?: MonthlyBillItem[];
  onAddMonthlyBill?: (bill: Omit<MonthlyBillItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateMonthlyBill?: (bill: MonthlyBillItem) => void;
  onDeleteMonthlyBill?: (billId: string) => void;
  onBatchSetMonthlyBills?: (bills: MonthlyBillItem[]) => void;
  onResetMonthlyBillsData?: () => void;
  monthlyIncomes?: MonthlyIncomeItem[];
  onAddMonthlyIncome?: (income: Omit<MonthlyIncomeItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateMonthlyIncome?: (income: MonthlyIncomeItem) => void;
  onDeleteMonthlyIncome?: (incomeId: string) => void;
  onBatchSetMonthlyIncomes?: (incomes: MonthlyIncomeItem[]) => void;
  monthlyExtraExpenses?: MonthlyExtraExpenseItem[];
  onAddMonthlyExtraExpense?: (extra: Omit<MonthlyExtraExpenseItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateMonthlyExtraExpense?: (extra: MonthlyExtraExpenseItem) => void;
  onDeleteMonthlyExtraExpense?: (extraId: string) => void;
  onBatchSetMonthlyExtraExpenses?: (extras: MonthlyExtraExpenseItem[]) => void;
  debts?: DebtItem[];
  onAddDebt?: (debt: Omit<DebtItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateDebt?: (debt: DebtItem) => void;
  onDeleteDebt?: (debtId: string) => void;
  onPayDebtInstallment?: (debtId: string, payment: Omit<DebtPaymentRecord, 'id'>) => void;
  onBatchSetDebts?: (debts: DebtItem[]) => void;
  books?: BookItem[];
  readingQuotes?: ReadingQuote[];
  onAddBook?: (book: Omit<BookItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateBook?: (book: BookItem) => void;
  onDeleteBook?: (bookId: string) => void;
  onQuickUpdateBookProgress?: (bookId: string, newCurrentPage: number, sessionNote?: string) => void;
  onAddReadingQuote?: (quote: Omit<ReadingQuote, 'id' | 'createdAt'>) => void;
  onDeleteReadingQuote?: (quoteId: string) => void;
  onResetBooksData?: () => void;
  smartPurchases?: SmartPurchaseGoal[];
  onAddSmartPurchase?: (purchase: Omit<SmartPurchaseGoal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateSmartPurchase?: (purchase: SmartPurchaseGoal) => void;
  onDeleteSmartPurchase?: (purchaseId: string) => void;
  onResetSmartPurchasesData?: () => void;
}

interface CategoryOptionConfig {
  type: IdeaType;
  label: string;
  placeholderTitle: string;
  placeholderDesc: string;
}

const CATEGORY_TYPE_OPTIONS: Record<string, CategoryOptionConfig[]> = {
  vehiculos: [
    { type: 'mantenimiento_preventivo', label: '🛡️ Mantenimiento Preventivo (Aceite / Filtros / Frenos)', placeholderTitle: 'Ej. Cambio de pastillas delanteras, rotación de llantas...', placeholderDesc: 'Kilometraje programado, tipo de repuesto o taller...' },
    { type: 'mantenimiento_correctivo', label: '🔧 Mantenimiento Correctivo (Reparación / Ruidos / Fallas)', placeholderTitle: 'Ej. Reparar ruido en suspensión derecha, cambiar batería...', placeholderDesc: 'Síntomas, fecha estimada o repuesto a comprar...' },
    { type: 'mejora_vehiculo', label: '✨ Mejora / Upgrade & Personalización', placeholderTitle: 'Ej. Polarizado nano-cerámico, pantalla táctil CarPlay, rines...', placeholderDesc: 'Presupuesto, tienda de accesorios o especificaciones...' },
    { type: 'seguro_poliza', label: '🛡️ Póliza de Seguro & Trámites', placeholderTitle: 'Ej. Renovar seguro Todo Riesgo, revisión técnico-mecánica...', placeholderDesc: 'Aseguradora, fecha límite o costo anual...' },
    { type: 'accesorio_vehiculo', label: '🚗 Accesorio o Equipamiento de Viaje', placeholderTitle: 'Ej. Barras portaequipaje de techo, tapetes a medida termoformados...', placeholderDesc: 'Marca, compatibilidad o tienda...' },
    { type: 'otro', label: '✨ Otra Idea de Vehículos', placeholderTitle: 'Ej. Detallado y lavado de motor en seco...', placeholderDesc: 'Notas adicionales del vehículo...' },
  ],
  salud_deporte: [
    { type: 'cardio', label: '🏃 Cardio (Running / Ciclismo / Caminata)', placeholderTitle: 'Ej. Rutina de Running 5K, Salida dominical en bicicleta...', placeholderDesc: 'Distancia objetivo, ritmo por km, frecuencia cardíaca...' },
    { type: 'pesas', label: '🏋️ Pesas & Gimnasio (Fuerza / Hipertrofia)', placeholderTitle: 'Ej. Rutina Push-Pull-Legs, Subir peso en sentadilla a 80kg...', placeholderDesc: 'Ejercicios clave, series, repeticiones o días...' },
    { type: 'deporte', label: '⚽ Deporte & Disciplina (Fútbol / Natación / Pádel)', placeholderTitle: 'Ej. Partido semanal con amigos, Aprender natación...', placeholderDesc: 'Lugar de práctica, equipo, amigos con los que jugar...' },
    { type: 'rutina', label: '🧘 Rutina de Salud / Movilidad & Estiramientos', placeholderTitle: 'Ej. 15 min de estiramientos al despertar, Movilidad...', placeholderDesc: 'Horario, duración o ejercicios para aliviar postura...' },
    { type: 'nutricion', label: '🥗 Nutrición / Receta Saludable & Meal Prep', placeholderTitle: 'Ej. Plan de meal prep domingos, Recetas altas en proteína...', placeholderDesc: 'Ingredientes, macros, metas de hidratación...' },
    { type: 'otro', label: '✨ Otra Idea de Salud', placeholderTitle: 'Ej. Chequeo médico anual, Comprar zapatillas...', placeholderDesc: 'Notas adicionales de salud...' },
  ],
  familia_relaciones: [
    { type: 'plan_familiar', label: '👨‍👩‍👧 Plan Familiar / Cena / Juegos', placeholderTitle: 'Ej. Noche de pizza artesanal y juegos de mesa...', placeholderDesc: 'Detalles del plan, comida o actividades sin pantallas...' },
    { type: 'cita', label: '❤️ Cita en Pareja / Salida Especial', placeholderTitle: 'Ej. Cena romántica en restaurante nuevo, Tarde de café...', placeholderDesc: 'Lugar, fecha ideal, reservas o detalles...' },
    { type: 'viaje', label: '✈️ Paseo / Camping / Viaje Familiar', placeholderTitle: 'Ej. Fin de semana de camping y fogata en la montaña...', placeholderDesc: 'Destino, equipaje, itinerario o lugares por visitar...' },
    { type: 'proyecto_hogar', label: '🏡 Proyecto en Familia / Jardín', placeholderTitle: 'Ej. Construir un huerto urbano de especias en familia...', placeholderDesc: 'Materiales, roles de cada integrante o fotos...' },
    { type: 'otro', label: '✨ Otra Idea Familiar', placeholderTitle: 'Ej. Visitar a los abuelos, Álbum de fotos...', placeholderDesc: 'Notas y recordatorios familiares...' },
  ],
  actividades_pendientes: [
    { type: 'pintura_mejora', label: '🎨 Pintura / Decoración del Hogar', placeholderTitle: 'Ej. Pintar paredes de la sala y pasillo con pintura lavable...', placeholderDesc: 'Color elegido, brochas, cinta de enmascarar, lija...' },
    { type: 'organizacion_espacio', label: '🗄️ Organizar Estudio / Espacio de Trabajo', placeholderTitle: 'Ej. Ordenar escritorio, organizar cables y estantes...', placeholderDesc: 'Organizadores necesarios, limpieza, iluminación...' },
    { type: 'mantenimiento_hogar', label: '🔨 Reparación / Mantenimiento del Hogar', placeholderTitle: 'Ej. Cambiar cerradura, arreglar grifo, instalar repisas...', placeholderDesc: 'Herramientas requeridas, repuestos o técnico...' },
    { type: 'compra_materiales', label: '🛒 Compras de Materiales / Hogar', placeholderTitle: 'Ej. Comprar pintura blanca, rodillos, tornillos y organizador...', placeholderDesc: 'Tienda (Home Depot/Sodimac), presupuesto estimado...' },
    { type: 'diligencia_tramite', label: '🧹 Trámites / Limpieza & Donaciones', placeholderTitle: 'Ej. Limpieza a fondo de clóset y donar ropa...', placeholderDesc: 'Zonas prioritarias, bolsas, destino de donaciones...' },
    { type: 'otro', label: '✨ Otra Actividad Pendiente', placeholderTitle: 'Ej. Lavar cortinas, organizar bodega...', placeholderDesc: 'Notas de la tarea...' },
  ],
  aprendizaje: [
    { type: 'habilidad', label: '⚡ Habilidad Técnica (Arduino, Cameo, Diseño...)', placeholderTitle: 'Ej. Aprender a programar en Arduino, Silhouette Cameo 4...', placeholderDesc: 'Software, herramientas requeridas o tutoriales...' },
    { type: 'curso', label: '🎓 Curso / Taller / Certificación', placeholderTitle: 'Ej. Curso de DaVinci Resolve, Certificación...', placeholderDesc: 'Plataforma (Coursera/Udemy/YouTube), duración...' },
    { type: 'libro', label: '📖 Libro Técnico o de Estudio', placeholderTitle: 'Ej. Leer "Clean Code", Manual de electrónica...', placeholderDesc: 'Autor, páginas o temas clave por dominar...' },
    { type: 'idioma', label: '🗣️ Idioma / Vocabulario & Conversación', placeholderTitle: 'Ej. Practicar conversación en Italiano nivel B1...', placeholderDesc: 'App (Duolingo), podcast de práctica...' },
    { type: 'proyecto', label: '🛠️ Proyecto Práctico / Portafolio', placeholderTitle: 'Ej. Automatizar luces de la sala con relé...', placeholderDesc: 'Pasos de implementación, materiales...' },
    { type: 'otro', label: '✨ Otra Idea de Aprendizaje', placeholderTitle: 'Ej. Suscripción a newsletter de tecnología...', placeholderDesc: 'Notas de estudio...' },
  ],
  bienestar_mente: [
    { type: 'meditacion', label: '🧘 Meditación / Mindfulness & Respiración', placeholderTitle: 'Ej. Sesión de 10 min de respiración diafragmática...', placeholderDesc: 'Momento del día, técnica de respiración...' },
    { type: 'lectura_reflexiva', label: '📖 Lectura Reflexiva & Desarrollo Personal', placeholderTitle: 'Ej. Leer "Hábitos Atómicos", "El Poder del Ahora"...', placeholderDesc: 'Autor, ideas principales por aplicar...' },
    { type: 'descanso', label: '🌙 Descanso / Higiene del Sueño', placeholderTitle: 'Ej. Noche sin pantallas 1 hora antes de dormir...', placeholderDesc: 'Hábito nocturno, ambiente relajante...' },
    { type: 'habito_saludable', label: '✨ Gratitud & Diario Personal', placeholderTitle: 'Ej. Escribir 3 cosas por las que agradezco hoy...', placeholderDesc: 'Preguntas guía del diario o propósito...' },
    { type: 'paseo_naturaleza', label: '🌲 Paseo en Naturaleza & Desconexión', placeholderTitle: 'Ej. Caminata consciente en el parque natural...', placeholderDesc: 'Lugar o tiempo de desconexión...' },
    { type: 'otro', label: '✨ Otra Idea de Bienestar', placeholderTitle: 'Ej. Taller de alfarería, Día de spa en casa...', placeholderDesc: 'Notas de cuidado personal...' },
  ],
  ocio_entretenimiento: [
    { type: 'videojuego', label: '🎮 Videojuego / Partida Pendiente', placeholderTitle: 'Ej. Jugar campaña de Zelda: Tears of the Kingdom...', placeholderDesc: 'Plataforma (PC/PS5/Switch), horas estimadas...' },
    { type: 'pelicula', label: '🎬 Película por Ver / Cine', placeholderTitle: 'Ej. Ver "Interstellar", Tarde de cine clásico...', placeholderDesc: 'Director, plataforma (Netflix/HBO/Prime/Cine)...' },
    { type: 'serie', label: '📺 Serie / Anime / Temporada', placeholderTitle: 'Ej. Terminar temporada de Shingeki no Kyojin...', placeholderDesc: 'Temporada, capítulos o plataforma...' },
    { type: 'libro', label: '📚 Novela / Cómic / Lectura de Ocio', placeholderTitle: 'Ej. Leer saga de Fantasía o Novela gráfica...', placeholderDesc: 'Autor, tomo o género...' },
    { type: 'evento', label: '🎲 Juegos de Mesa / Noche con Amigos', placeholderTitle: 'Ej. Partida de Catán o Carcassonne...', placeholderDesc: 'Número de jugadores, lugar...' },
    { type: 'otro', label: '✨ Otra Idea de Ocio', placeholderTitle: 'Ej. Asistir a convención de cómics...', placeholderDesc: 'Notas de entretenimiento...' },
  ],
  finanzas_hogar: [
    { type: 'ahorro', label: '🪙 Meta de Ahorro / Fondo de Emergencia', placeholderTitle: 'Ej. Ahorrar $500 USD para fondo de emergencia familiar...', placeholderDesc: 'Monto mensual, plazo objetivo o cuenta de ahorro...' },
    { type: 'presupuesto', label: '📊 Presupuesto Familiar / Control de Gastos', placeholderTitle: 'Ej. Revisar suscripciones mensuales y optimizar gastos...', placeholderDesc: 'Categorías a reducir, herramientas de control...' },
    { type: 'inversion', label: '📈 Inversión / Educación Financiera', placeholderTitle: 'Ej. Invertir en fondo indexado o ETF de bajo costo...', placeholderDesc: 'Estrategia, plataforma regulada, aportes mensuales...' },
    { type: 'compra', label: '💳 Compra Planificada para el Hogar', placeholderTitle: 'Ej. Renovar refrigerador eficiente o electrodoméstico...', placeholderDesc: 'Modelos comparados, precio objetivo...' },
    { type: 'otro', label: '✨ Otra Idea Financiera', placeholderTitle: 'Ej. Plan de amortización de créditos...', placeholderDesc: 'Notas financieras familiares...' },
  ],
};

export const CategoryDetailView: React.FC<CategoryDetailViewProps> = ({
  category,
  allCategories,
  tasks,
  ideas,
  onBackToOverview,
  onSelectCategory,
  onOpenNewTaskModal,
  onEditTask,
  onDeleteTask,
  onLogHours,
  onToggleSubgoal,
  onQuickStatusChange,
  onAssignToCalendar,
  onAddIdea,
  onDeleteIdea,
  onConvertIdeaToTask,
  onConsultAgent,
  healthProfile,
  weightLogs,
  calorieLogs,
  onUpdateHealthProfile,
  onAddWeightLog,
  onDeleteWeightLog,
  onSaveDailyCalorieLog,
  onDeleteDailyCalorieLog,
  vehicles,
  vehicleMaintenances,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onAddVehicleMaintenance,
  onUpdateVehicleMaintenance,
  onDeleteVehicleMaintenance,
  onRecordOilChange,
  onQuickUpdateMileage,
  onResetVehiclesData,
  onResetHealthData,
  onResetCategoryData,
  medicalAppointments,
  medicalExamNotes,
  onAddMedicalAppointment,
  onUpdateMedicalAppointment,
  onDeleteMedicalAppointment,
  onAddMedicalExamNote,
  onUpdateMedicalExamNote,
  onDeleteMedicalExamNote,
  onResetMedicalData,
  familyTrips,
  onAddFamilyTrip,
  onUpdateFamilyTrip,
  onDeleteFamilyTrip,
  onResetFamilyTripsData,
  mediaBacklog,
  gameBacklog,
  mediaReviews,
  onAddMediaBacklog,
  onUpdateMediaBacklog,
  onDeleteMediaBacklog,
  onAddGameBacklog,
  onUpdateGameBacklog,
  onDeleteGameBacklog,
  onAddMediaReview,
  onUpdateMediaReview,
  onDeleteMediaReview,
  onResetEntertainmentData,
  monthlyBills,
  onAddMonthlyBill,
  onUpdateMonthlyBill,
  onDeleteMonthlyBill,
  onBatchSetMonthlyBills,
  onResetMonthlyBillsData,
  monthlyIncomes,
  onAddMonthlyIncome,
  onUpdateMonthlyIncome,
  onDeleteMonthlyIncome,
  onBatchSetMonthlyIncomes,
  monthlyExtraExpenses,
  onAddMonthlyExtraExpense,
  onUpdateMonthlyExtraExpense,
  onDeleteMonthlyExtraExpense,
  onBatchSetMonthlyExtraExpenses,
  debts,
  onAddDebt,
  onUpdateDebt,
  onDeleteDebt,
  onPayDebtInstallment,
  onBatchSetDebts,
  books,
  readingQuotes,
  onAddBook,
  onUpdateBook,
  onDeleteBook,
  onQuickUpdateBookProgress,
  onAddReadingQuote,
  onDeleteReadingQuote,
  onResetBooksData,
  smartPurchases,
  onAddSmartPurchase,
  onUpdateSmartPurchase,
  onDeleteSmartPurchase,
  onResetSmartPurchasesData,
}) => {
  const { isDark } = useTheme();
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [selectedSubtype, setSelectedSubtype] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Active section tab for categories (job_things, vehiculos, salud_deporte, bienestar_mente, familia_relaciones, ocio_entretenimiento, finanzas_hogar, aprendizaje, actividades_pendientes, or metas/ideas)
  const [activeCategoryView, setActiveCategoryView] = useState<'job_things_hub' | 'garage' | 'salud_tracker' | 'citas_medicas' | 'viajes' | 'ocio_gaming' | 'pagos_fijos' | 'libreria' | 'compras_programadas' | 'metas' | 'ideas'>(
    category.id === 'job_things'
      ? 'job_things_hub'
      : category.id === 'vehiculos' 
      ? 'garage' 
      : category.id === 'salud_deporte' 
      ? 'salud_tracker' 
      : category.id === 'bienestar_mente' 
      ? 'citas_medicas' 
      : category.id === 'familia_relaciones' 
      ? 'viajes' 
      : category.id === 'ocio_entretenimiento'
      ? 'ocio_gaming'
      : category.id === 'finanzas_hogar'
      ? 'pagos_fijos'
      : category.id === 'aprendizaje'
      ? 'libreria'
      : category.id === 'actividades_pendientes'
      ? 'compras_programadas'
      : 'metas'
  );

  // Sync activeCategoryView when user switches category
  useEffect(() => {
    if (category.id === 'job_things') {
      setActiveCategoryView('job_things_hub');
    } else if (category.id === 'vehiculos') {
      setActiveCategoryView('garage');
    } else if (category.id === 'salud_deporte') {
      setActiveCategoryView('salud_tracker');
    } else if (category.id === 'bienestar_mente') {
      setActiveCategoryView('citas_medicas');
    } else if (category.id === 'familia_relaciones') {
      setActiveCategoryView('viajes');
    } else if (category.id === 'ocio_entretenimiento') {
      setActiveCategoryView('ocio_gaming');
    } else if (category.id === 'finanzas_hogar') {
      setActiveCategoryView('pagos_fijos');
    } else if (category.id === 'aprendizaje') {
      setActiveCategoryView('libreria');
    } else if (category.id === 'actividades_pendientes') {
      setActiveCategoryView('compras_programadas');
    } else {
      setActiveCategoryView('metas');
    }
  }, [category.id]);

  // New idea form state
  const [isAddingIdea, setIsAddingIdea] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<IdeaType>('otro');
  const [newTagInput, setNewTagInput] = useState('');

  // Filter ideas specifically for this category
  const categoryIdeas = (Array.isArray(ideas) ? ideas : []).filter((i) => i && i.categoryId === category.id);
  const filteredIdeas = categoryIdeas.filter((i) => {
    if (selectedSubtype !== 'all' && i.type !== selectedSubtype) return false;
    return true;
  });

  // Filter tasks specifically for this category
  const categoryTasks = (Array.isArray(tasks) ? tasks : []).filter((t) => t && t.category === category.id);
  const filteredTasks = categoryTasks
    .filter((t) => {
      if (selectedStatusFilter !== 'all') {
        if (selectedStatusFilter === 'pendiente') {
          if (t.status === 'completada' || t.status === 'cancelada') return false;
        } else if (t.status !== selectedStatusFilter) {
          return false;
        }
      }
      if (taskSearchTerm.trim()) {
        const matchTitle = (t.title || '').toLowerCase().includes(taskSearchTerm.toLowerCase());
        const matchDesc = (t.description || '').toLowerCase().includes(taskSearchTerm.toLowerCase());
        const matchGoal = (t.finalGoal || '').toLowerCase().includes(taskSearchTerm.toLowerCase());
        return matchTitle || matchDesc || matchGoal;
      }
      return true;
    })
    .sort((a, b) => {
      // 1. Pending first, completed last
      const aDone = a.status === 'completada' ? 1 : 0;
      const bDone = b.status === 'completada' ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;

      // 2. Pending: oldest first for priority
      if (!aDone) {
        const priorityWeight: Record<string, number> = { urgente: 4, alta: 3, media: 2, baja: 1 };
        const pDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        if (pDiff !== 0) return pDiff;

        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeA && timeB && timeA !== timeB) return timeA - timeB;

        const dateA = a.assignedDate || a.dueDate || '9999-99-99';
        const dateB = b.assignedDate || b.dueDate || '9999-99-99';
        return dateA.localeCompare(dateB);
      }

      const compA = a.completedAtTimestamp ? new Date(a.completedAtTimestamp).getTime() : 0;
      const compB = b.completedAtTimestamp ? new Date(b.completedAtTimestamp).getTime() : 0;
      return compB - compA;
    });

  // Metrics for this category
  const completedTasksCount = categoryTasks.filter((t) => t.status === 'completada').length;
  const totalHoursInvested = categoryTasks.reduce((sum, t) => sum + (Number(t.completedHours) || 0), 0);
  const totalEstimatedHours = categoryTasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0);
  const progressPercentage = totalEstimatedHours > 0 
    ? Math.min(100, Math.round((totalHoursInvested / totalEstimatedHours) * 100))
    : (categoryTasks.length > 0 ? Math.round((completedTasksCount / categoryTasks.length) * 100) : 0);

  const typeOptions = CATEGORY_TYPE_OPTIONS[category.id] || [];

  const handleCreateIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const tags = newTagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onAddIdea({
      categoryId: category.id,
      title: newTitle.trim(),
      description: newDescription.trim(),
      type: newType,
      tags: tags.length > 0 ? tags : [category.name],
    });

    setNewTitle('');
    setNewDescription('');
    setNewTagInput('');
    setIsAddingIdea(false);
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Car': return <Car className="w-6 h-6 text-cyan-400" />;
      case 'Activity': return <Activity className="w-6 h-6" />;
      case 'Heart': return <Heart className="w-6 h-6" />;
      case 'BookOpen': return <BookOpen className="w-6 h-6" />;
      case 'Smile': return <Smile className="w-6 h-6" />;
      case 'Gamepad2': case 'Gamepad': return <Gamepad2 className="w-6 h-6 text-pink-400" />;
      case 'Clapperboard': return <Clapperboard className="w-6 h-6 text-pink-400" />;
      case 'Film': case 'Tv': return <Film className="w-6 h-6 text-pink-400" />;
      case 'PiggyBank': return <PiggyBank className="w-6 h-6 text-amber-400" />;
      case 'Coins': return <Coins className="w-6 h-6 text-amber-400" />;
      case 'Wallet': return <Wallet className="w-6 h-6 text-amber-400" />;
      case 'CircleDollarSign': return <CircleDollarSign className="w-6 h-6 text-amber-400" />;
      case 'CheckSquare': case 'Paintbrush': return <Paintbrush className="w-6 h-6 text-orange-400" />;
      default: return <Home className="w-6 h-6" />;
    }
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      
      {/* Top Header & Navigation Breadcrumb */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <button
          type="button"
          onClick={onBackToOverview}
          className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md group w-fit border ${
            isDark 
              ? 'bg-[#131d33] hover:bg-[#1c2948] border-[#2d3a58] hover:border-[#00f2ff]/40 text-slate-200' 
              : 'bg-white hover:bg-slate-100 border-slate-300 hover:border-slate-400 text-slate-700'
          }`}
        >
          <ArrowLeft className="w-4 h-4 text-[#00f2ff] group-hover:-translate-x-1 transition-transform" />
          <span>← Volver a Todas las Áreas</span>
        </button>

        {/* Quick Category Switcher Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full">
          <span className={`text-[11px] font-mono uppercase shrink-0 mr-1 hidden md:inline ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Cambiar Área:
          </span>
          {allCategories.map((c) => {
            const isCurrent = c.id === category.id;
            const cContrastColor = getCategoryContrastColor(c.id, isDark, c.color);

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                  isCurrent
                    ? 'shadow-md scale-105'
                    : isDark 
                      ? 'bg-[#101729] text-slate-400 hover:text-white border border-[#232f48] hover:border-slate-500'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300'
                }`}
                style={
                  isCurrent
                    ? { 
                        backgroundColor: isDark ? `${c.color}25` : `${cContrastColor}18`, 
                        color: cContrastColor, 
                        border: `1.5px solid ${isDark ? c.color : cContrastColor}` 
                      }
                    : {}
                }
              >
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Thematic Category Hero Banner */}
      <div 
        className={`relative rounded-3xl overflow-hidden border shadow-2xl transition-all ${
          isDark ? 'shadow-black/50 bg-[#0b1326]' : 'shadow-slate-200/80 bg-white'
        }`}
        style={{ borderColor: isDark ? `${category.color}50` : `${getCategoryContrastColor(category.id, false, category.color)}40` }}
      >
        {/* Background Artwork */}
        {category.image ? (
          <div className="absolute inset-0 z-0">
            <img
              src={category.image}
              alt={category.name}
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover object-center filter ${
                isDark ? 'brightness-[0.35] saturate-150' : 'brightness-[0.95] opacity-15 saturate-125'
              }`}
            />
            <div className={`absolute inset-0 ${
              isDark 
                ? 'bg-gradient-to-r from-[#0b1326] via-[#0b1326]/90 to-[#0b1326]/75' 
                : 'bg-gradient-to-r from-white via-white/95 to-white/85'
            }`} />
            <div 
              className="absolute -top-16 -left-16 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ backgroundColor: category.color }}
            />
          </div>
        ) : (
          <div className={`absolute inset-0 ${
            isDark 
              ? 'bg-gradient-to-br from-[#151f38] via-[#10172b] to-[#0b1222]' 
              : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
          }`} />
        )}

        {/* Thematic Doodle Background */}
        <CollectionDoodleBackground 
          categoryId={category.id} 
          isDark={isDark} 
          opacity={isDark ? 0.38 : 0.28} 
        />

        <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Left Column: Info & Thematic identity */}
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <div 
                className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono font-bold backdrop-blur-md shadow-md border ${
                  isDark ? '' : 'bg-white/90 border-slate-300'
                }`}
                style={{ 
                  backgroundColor: isDark ? `${category.color}20` : `${getCategoryContrastColor(category.id, false, category.color)}15`, 
                  borderColor: isDark ? `${category.color}50` : `${getCategoryContrastColor(category.id, false, category.color)}40`, 
                  color: getCategoryContrastColor(category.id, isDark, category.color) 
                }}
              >
                {getCategoryIcon(category.iconName)}
                <span>{getCategoryDoodleBadge(category.id).emoji} {getCategoryDoodleBadge(category.id).label}</span>
              </div>
              <span className={`text-[11px] font-mono px-2.5 py-1 rounded-full border ${
                isDark ? 'text-slate-300 bg-slate-900/80 border-slate-700' : 'text-slate-700 bg-slate-100 border-slate-300 font-semibold'
              }`}>
                {categoryIdeas.length} ideas · {categoryTasks.length} metas
              </span>
            </div>

            <h1 className={`text-2xl sm:text-4xl font-black tracking-tight flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <span style={{ color: getCategoryContrastColor(category.id, isDark, category.color) }}>{category.name}</span>
            </h1>

            <p className={`text-sm leading-relaxed font-sans max-w-xl ${isDark ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>
              {category.description || 'Registra tus ideas, notas y metas específicas para esta área de vida.'}
            </p>

            {/* Doodle Sub-topic Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {getCategoryDoodleTags(category.id).map((tag, idx) => (
                <span
                  key={idx}
                  className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition-all ${
                    isDark
                      ? 'bg-[#0f172a]/80 text-slate-200 border-slate-700'
                      : 'bg-white/90 text-slate-800 border-slate-300 shadow-xs'
                  }`}
                  style={{
                    borderLeftColor: isDark ? category.color : getCategoryContrastColor(category.id, false, category.color),
                    borderLeftWidth: '3.5px',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className={`flex items-center space-x-2 px-3.5 py-1.5 backdrop-blur-md rounded-xl border text-xs font-mono ${
                isDark ? 'bg-[#0b1326]/90 border-slate-700/60 text-slate-200' : 'bg-white/90 border-slate-200 text-slate-800 shadow-xs'
              }`}>
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span className="font-semibold">{categoryIdeas.length} Ideas guardadas</span>
              </div>

              <div className={`flex items-center space-x-2 px-3.5 py-1.5 backdrop-blur-md rounded-xl border text-xs font-mono ${
                isDark ? 'bg-[#0b1326]/90 border-slate-700/60 text-slate-200' : 'bg-white/90 border-slate-200 text-slate-800 shadow-xs'
              }`}>
                <Target className="w-4 h-4 text-[#00f2ff]" />
                <span className="font-semibold">{categoryTasks.length} Metas activas ({completedTasksCount} logradas)</span>
              </div>

              <div className={`flex items-center space-x-2 px-3.5 py-1.5 backdrop-blur-md rounded-xl border text-xs font-mono ${
                isDark ? 'bg-[#0b1326]/90 border-slate-700/60 text-slate-200' : 'bg-white/90 border-slate-200 text-slate-800 shadow-xs'
              }`}>
                <Clock className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold">{totalHoursInvested}h Invertidas</span>
              </div>
            </div>
          </div>

          {/* Right Column: In-context Fast Actions */}
          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2.5 min-w-[220px]">
            {category.id === 'job_things' ? (
              <button
                type="button"
                onClick={() => setActiveCategoryView('job_things_hub')}
                className="px-5 py-3 rounded-2xl font-extrabold text-xs shadow-xl transition-all flex items-center justify-center space-x-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white shadow-indigo-500/30"
              >
                <Briefcase className="w-4 h-4 text-white" />
                <span>Centro de Trabajo & Productividad 💼</span>
              </button>
            ) : category.id === 'vehiculos' ? (
              <button
                type="button"
                onClick={() => setActiveCategoryView('garage')}
                className="px-5 py-3 rounded-2xl font-extrabold text-xs shadow-xl transition-all flex items-center justify-center space-x-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] text-[#00363a] shadow-cyan-500/30"
              >
                <Car className="w-4 h-4 text-[#00363a]" />
                <span>Abrir Garaje & Telemetría 🚗</span>
              </button>
            ) : category.id === 'salud_deporte' ? (
              <button
                type="button"
                onClick={() => setActiveCategoryView('salud_tracker')}
                className="px-5 py-3 rounded-2xl font-extrabold text-xs shadow-xl transition-all flex items-center justify-center space-x-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] text-[#00363a] shadow-cyan-500/30"
              >
                <Scale className="w-4 h-4 text-[#00363a]" />
                <span>Abrir Tracker de Salud & Peso</span>
              </button>
            ) : category.id === 'familia_relaciones' ? (
              <button
                type="button"
                onClick={() => setActiveCategoryView('viajes')}
                className="px-5 py-3 rounded-2xl font-extrabold text-xs shadow-xl transition-all flex items-center justify-center space-x-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-[#00363a] shadow-teal-500/30"
              >
                <Plane className="w-4 h-4 text-[#00363a]" />
                <span>Planeador de Viajes & Ahorro 🌴</span>
              </button>
            ) : category.id === 'finanzas_hogar' ? (
              <button
                type="button"
                onClick={() => setActiveCategoryView('pagos_fijos')}
                className="px-5 py-3 rounded-2xl font-extrabold text-xs shadow-xl transition-all flex items-center justify-center space-x-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 shadow-amber-500/30"
              >
                <Wallet className="w-4 h-4 text-slate-950" />
                <span>Planificador: Ingresos, Gastos Fijos & Extras 💰</span>
              </button>
            ) : (category.id === 'aprendizaje' || category.id === 'aprendizaje_habilidades') ? (
              <button
                type="button"
                onClick={() => setActiveCategoryView('libreria')}
                className="px-5 py-3 rounded-2xl font-extrabold text-xs shadow-xl transition-all flex items-center justify-center space-x-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white shadow-orange-500/30"
              >
                <BookOpen className="w-4 h-4 text-white" />
                <span>Abrir Biblioteca & Libros 📚</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpenNewTaskModal({ category: category.id })}
                className="px-5 py-3 rounded-2xl font-extrabold text-xs shadow-xl transition-all flex items-center justify-center space-x-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] text-[#00363a]"
                style={{
                  backgroundColor: category.color,
                  boxShadow: `0 10px 20px -5px ${category.color}40`,
                }}
              >
                <Plus className="w-4 h-4 text-[#00363a]" />
                <span>Crear Meta en {category.name.split('&')[0].trim()}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              className={`px-5 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md border ${
                isDark 
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-pink-200 hover:text-white border-rose-500/40' 
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
              }`}
            >
              <Mic className="w-4 h-4 text-rose-500" />
              <span>Dictar Idea con Voz 🎙️</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveCategoryView('ideas');
                setIsAddingIdea(true);
                const el = document.getElementById('seccion-ideas-categoria');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`px-5 py-2.5 rounded-2xl font-semibold text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer border ${
                isDark 
                  ? 'bg-[#17223b] hover:bg-[#1f2d4e] text-slate-200 hover:text-white border-slate-700' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
              }`}
            >
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>+ Anotar Nueva Idea</span>
            </button>
          </div>

        </div>
      </div>

      {/* Category Section View Switcher Tabs (Garage vs Health Hub vs Medical vs Trips vs Goals vs Ideas) */}
      <div className={`flex items-center gap-3 overflow-x-auto pb-2 p-2 rounded-2xl border shadow-sm ${
        isDark ? 'bg-[#0c1427] border-slate-800' : 'bg-slate-100/90 border-slate-200'
      }`}>
        {category.id === 'vehiculos' && (
          <button
            type="button"
            onClick={() => setActiveCategoryView('garage')}
            className={`px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl text-sm sm:text-base font-bold transition-all cursor-pointer flex items-center space-x-2.5 whitespace-nowrap shadow-sm ${
              activeCategoryView === 'garage'
                ? 'bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] text-[#00363a] font-black shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400 scale-[1.02]'
                : isDark
                ? 'bg-[#131d33] border-2 border-emerald-600/50 text-emerald-200 hover:bg-[#1a2744] hover:border-emerald-400 hover:text-white'
                : 'bg-white border-2 border-emerald-300 text-emerald-950 hover:bg-emerald-50 hover:border-emerald-400 hover:shadow-md'
            }`}
          >
            <Car className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <span>🚗 Garaje, Odómetro & Pólizas</span>
          </button>
        )}

        {category.id === 'salud_deporte' && (
          <button
            type="button"
            onClick={() => setActiveCategoryView('salud_tracker')}
            className={`px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl text-sm sm:text-base font-bold transition-all cursor-pointer flex items-center space-x-2.5 whitespace-nowrap shadow-sm ${
              activeCategoryView === 'salud_tracker'
                ? 'bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] text-[#00363a] font-black shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400 scale-[1.02]'
                : isDark
                ? 'bg-[#131d33] border-2 border-cyan-600/50 text-cyan-200 hover:bg-[#1a2744] hover:border-cyan-400 hover:text-white'
                : 'bg-white border-2 border-cyan-300 text-cyan-950 hover:bg-cyan-50 hover:border-cyan-400 hover:shadow-md'
            }`}
          >
            <Scale className="w-5 h-5 text-cyan-500 dark:text-cyan-400 shrink-0" />
            <span>🩺 Panel de Salud & Tracker de Peso</span>
          </button>
        )}

        {category.id === 'bienestar_mente' && (
          <button
            type="button"
            onClick={() => setActiveCategoryView('citas_medicas')}
            className={`px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl text-sm sm:text-base font-bold transition-all cursor-pointer flex items-center space-x-2.5 whitespace-nowrap shadow-sm ${
              activeCategoryView === 'citas_medicas'
                ? 'bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] text-[#00363a] font-black shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400 scale-[1.02]'
                : isDark
                ? 'bg-[#131d33] border-2 border-teal-600/50 text-teal-200 hover:bg-[#1a2744] hover:border-teal-400 hover:text-white'
                : 'bg-white border-2 border-teal-300 text-teal-950 hover:bg-teal-50 hover:border-teal-400 hover:shadow-md'
            }`}
          >
            <Calendar className="w-5 h-5 text-teal-500 dark:text-teal-400 shrink-0" />
            <span>🩺 Citas Médicas & Exámenes</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
              activeCategoryView === 'citas_medicas'
                ? 'bg-[#00363a]/20 text-[#00363a]'
                : isDark ? 'bg-teal-950 text-teal-300 border border-teal-800' : 'bg-teal-100 text-teal-800'
            }`}>
              {(medicalAppointments || []).length}
            </span>
          </button>
        )}

        {category.id === 'familia_relaciones' && (
          <button
            type="button"
            onClick={() => setActiveCategoryView('viajes')}
            className={`px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl text-sm sm:text-base font-bold transition-all cursor-pointer flex items-center space-x-2.5 whitespace-nowrap shadow-sm ${
              activeCategoryView === 'viajes'
                ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-[#00363a] font-black shadow-lg shadow-teal-500/25 ring-2 ring-teal-300 scale-[1.02]'
                : isDark
                ? 'bg-[#131d33] border-2 border-teal-600/50 text-teal-200 hover:bg-[#1a2744] hover:border-teal-400 hover:text-white'
                : 'bg-white border-2 border-teal-300 text-teal-950 hover:bg-teal-50 hover:border-teal-400 hover:shadow-md'
            }`}
          >
            <Plane className="w-5 h-5 text-teal-500 dark:text-teal-400 shrink-0" />
            <span>✈️ Viajes & Ahorro Familiar</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
              activeCategoryView === 'viajes'
                ? 'bg-[#00363a]/20 text-[#00363a]'
                : isDark ? 'bg-teal-950 text-teal-300 border border-teal-800' : 'bg-teal-100 text-teal-800'
            }`}>
              {(familyTrips || []).length}
            </span>
          </button>
        )}

        {category.id === 'ocio_entretenimiento' && (
          <button
            type="button"
            onClick={() => setActiveCategoryView('ocio_gaming')}
            className={`px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl text-sm sm:text-base font-bold transition-all cursor-pointer flex items-center space-x-2.5 whitespace-nowrap shadow-sm ${
              activeCategoryView === 'ocio_gaming'
                ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 text-white font-black shadow-lg shadow-pink-500/30 ring-2 ring-pink-300 scale-[1.02]'
                : isDark
                ? 'bg-[#131d33] border-2 border-purple-600/50 text-purple-200 hover:bg-[#1a2744] hover:border-purple-400 hover:text-white'
                : 'bg-white border-2 border-purple-300 text-purple-950 hover:bg-purple-50 hover:border-purple-400 hover:shadow-md'
            }`}
          >
            <Film className="w-5 h-5 text-pink-500 dark:text-pink-400 shrink-0" />
            <span>🍿 Películas, Series, Videojuegos & Reseñas ⭐</span>
          </button>
        )}

        {category.id === 'finanzas_hogar' && (
          <button
            type="button"
            onClick={() => setActiveCategoryView('pagos_fijos')}
            className={`px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl text-sm sm:text-base font-bold transition-all cursor-pointer flex items-center space-x-2.5 whitespace-nowrap shadow-sm ${
              activeCategoryView === 'pagos_fijos'
                ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/25 ring-2 ring-amber-300 scale-[1.02]'
                : isDark
                ? 'bg-[#131d33] border-2 border-amber-600/50 text-amber-200 hover:bg-[#1a2744] hover:border-amber-400 hover:text-white'
                : 'bg-white border-2 border-amber-300 text-amber-950 hover:bg-amber-50 hover:border-amber-400 hover:shadow-md'
            }`}
          >
            <Wallet className="w-5 h-5 text-amber-500 shrink-0" />
            <span>💰 Planificador Financiero & Pagos</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
              activeCategoryView === 'pagos_fijos'
                ? 'bg-black/20 text-slate-950'
                : isDark ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {((monthlyIncomes || []).length + (monthlyBills || []).length + (monthlyExtraExpenses || []).length)}
            </span>
          </button>
        )}

        {(category.id === 'aprendizaje' || category.id === 'aprendizaje_habilidades') && (
          <button
            type="button"
            onClick={() => setActiveCategoryView('libreria')}
            className={`px-6 py-3.5 sm:px-7 sm:py-4 rounded-2xl text-sm sm:text-base font-black transition-all cursor-pointer flex items-center space-x-3 whitespace-nowrap shadow-md ${
              activeCategoryView === 'libreria'
                ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white font-black shadow-xl shadow-orange-500/30 ring-2 ring-orange-300 scale-[1.03]'
                : isDark
                ? 'bg-[#131d33] border-2 border-orange-500/60 text-orange-200 hover:bg-[#1e2a47] hover:border-orange-400 hover:text-white'
                : 'bg-white border-2 border-orange-400 text-orange-950 hover:bg-orange-50 hover:border-orange-500 hover:shadow-md'
            }`}
          >
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 shrink-0" />
            <span>📚 Biblioteca, Libros & Tracker de Lectura</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black ${
              activeCategoryView === 'libreria'
                ? 'bg-black/25 text-white'
                : isDark ? 'bg-orange-950 text-orange-300 border border-orange-800' : 'bg-orange-100 text-orange-900 border border-orange-300'
            }`}>
              {(books || []).length}
            </span>
          </button>
        )}

        {category.id === 'actividades_pendientes' && (
          <button
            type="button"
            onClick={() => setActiveCategoryView('compras_programadas')}
            className={`px-6 py-3.5 sm:px-7 sm:py-4 rounded-2xl text-sm sm:text-base font-black transition-all cursor-pointer flex items-center space-x-3 whitespace-nowrap shadow-md ${
              activeCategoryView === 'compras_programadas'
                ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-slate-950 font-black shadow-xl shadow-orange-500/35 ring-2 ring-orange-300 scale-[1.03]'
                : isDark
                ? 'bg-[#131d33] border-2 border-orange-500/60 text-orange-200 hover:bg-[#1a2744] hover:border-orange-400 hover:text-white'
                : 'bg-white border-2 border-orange-400 text-orange-950 hover:bg-orange-50 hover:border-orange-500 hover:shadow-md'
            }`}
          >
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 shrink-0" />
            <span>🛒 Compras Inteligentes Programadas</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black ${
              activeCategoryView === 'compras_programadas'
                ? 'bg-black/20 text-slate-950'
                : isDark ? 'bg-orange-950 text-orange-300 border border-orange-800' : 'bg-orange-100 text-orange-900 border border-orange-300'
            }`}>
              {(smartPurchases || []).length}
            </span>
          </button>
        )}

        {category.id === 'job_things' && (
          <button
            type="button"
            onClick={() => setActiveCategoryView('job_things_hub')}
            className={`px-6 py-3.5 sm:px-7 sm:py-4 rounded-2xl text-sm sm:text-base font-black transition-all cursor-pointer flex items-center space-x-3 whitespace-nowrap shadow-md ${
              activeCategoryView === 'job_things_hub'
                ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white font-black shadow-xl shadow-indigo-500/40 ring-2 ring-indigo-300 scale-[1.03]'
                : isDark
                ? 'bg-[#131d33] border-2 border-indigo-500/60 text-indigo-200 hover:bg-[#1a2744] hover:border-indigo-400 hover:text-white'
                : 'bg-white border-2 border-indigo-400 text-indigo-950 hover:bg-indigo-50 hover:border-indigo-500 hover:shadow-md'
            }`}
          >
            <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 shrink-0" />
            <span>💼 Centro de Trabajo (Día a Día & Análisis)</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black ${
              activeCategoryView === 'job_things_hub'
                ? 'bg-white/25 text-white'
                : isDark ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
            }`}>
              {categoryTasks.length}
            </span>
          </button>
        )}

        {/* 🎯 METAS & CHECKLISTS BUTTON (Prominent & Eye-catching) */}
        <button
          type="button"
          onClick={() => setActiveCategoryView('metas')}
          className={`px-6 py-3.5 sm:px-7 sm:py-4 rounded-2xl text-sm sm:text-base font-black transition-all cursor-pointer flex items-center space-x-3 whitespace-nowrap shadow-md ${
            activeCategoryView === 'metas'
              ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-black shadow-xl shadow-cyan-500/40 ring-2 ring-cyan-300 scale-[1.03]'
              : isDark
              ? 'bg-[#131d33] border-2 border-cyan-500/60 text-cyan-200 hover:bg-[#1a2744] hover:border-cyan-400 hover:text-white'
              : 'bg-white border-2 border-cyan-400 text-cyan-950 hover:bg-cyan-50 hover:border-cyan-500 hover:shadow-md'
          }`}
        >
          <Target className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-500 dark:text-cyan-400 shrink-0" />
          <span>🎯 Metas & Checklists</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black ${
            activeCategoryView === 'metas'
              ? 'bg-white/30 text-white'
              : isDark ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-cyan-100 text-cyan-900 border border-cyan-300'
          }`}>
            {categoryTasks.length}
          </span>
        </button>

        {/* 💡 BANCO DE IDEAS BUTTON (Prominent & Eye-catching) */}
        <button
          type="button"
          onClick={() => setActiveCategoryView('ideas')}
          className={`px-6 py-3.5 sm:px-7 sm:py-4 rounded-2xl text-sm sm:text-base font-black transition-all cursor-pointer flex items-center space-x-3 whitespace-nowrap shadow-md ${
            activeCategoryView === 'ideas'
              ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black shadow-xl shadow-amber-400/50 ring-2 ring-amber-300 scale-[1.03]'
              : isDark
              ? 'bg-[#131d33] border-2 border-amber-500/70 text-amber-200 hover:bg-[#1a2744] hover:border-amber-400 hover:text-white'
              : 'bg-white border-2 border-amber-400 text-amber-950 hover:bg-amber-50 hover:border-amber-500 hover:shadow-md'
          }`}
        >
          <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 shrink-0" />
          <span>💡 Banco de Ideas</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black ${
            activeCategoryView === 'ideas'
              ? 'bg-black/25 text-slate-950'
              : isDark ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-amber-100 text-amber-900 border border-amber-300'
          }`}>
            {categoryIdeas.length}
          </span>
        </button>
      </div>

      {/* RENDER CONDITIONAL VIEWS */}
      {/* 0. JOB THINGS VIEW (when category is job_things and activeCategoryView is job_things_hub) */}
      {category.id === 'job_things' && activeCategoryView === 'job_things_hub' && (
        <JobThingsHubView
          tasks={tasks}
          categories={allCategories}
          onOpenNewTaskModal={onOpenNewTaskModal}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
          onQuickStatusChange={onQuickStatusChange}
        />
      )}

      {/* 1. VEHICLES GARAGE VIEW (when category is vehiculos and activeCategoryView is garage) */}
      {category.id === 'vehiculos' && activeCategoryView === 'garage' && (
        <VehiclesHubView
          vehicles={vehicles || []}
          maintenances={vehicleMaintenances || []}
          onAddVehicle={onAddVehicle || (() => {})}
          onUpdateVehicle={onUpdateVehicle || (() => {})}
          onDeleteVehicle={onDeleteVehicle || (() => {})}
          onAddMaintenance={onAddVehicleMaintenance || (() => {})}
          onUpdateMaintenance={onUpdateVehicleMaintenance || (() => {})}
          onDeleteMaintenance={onDeleteVehicleMaintenance || (() => {})}
          onRecordOilChange={onRecordOilChange || (() => {})}
          onQuickUpdateMileage={onQuickUpdateMileage || (() => {})}
          onResetVehiclesData={onResetVehiclesData}
        />
      )}

      {/* 2. HEALTH HUB VIEW (when salud_deporte and salud_tracker is active) */}
      {category.id === 'salud_deporte' && activeCategoryView === 'salud_tracker' && healthProfile && (
        <HealthHubView
          profile={healthProfile}
          weightLogs={weightLogs || []}
          calorieLogs={calorieLogs || []}
          tasks={tasks}
          ideas={ideas}
          onUpdateProfile={onUpdateHealthProfile || (() => {})}
          onAddWeightLog={onAddWeightLog || (() => {})}
          onDeleteWeightLog={onDeleteWeightLog || (() => {})}
          onSaveDailyCalorieLog={onSaveDailyCalorieLog}
          onDeleteDailyCalorieLog={onDeleteDailyCalorieLog}
          onOpenNewTaskModal={onOpenNewTaskModal}
          onResetHealthData={onResetHealthData}
        />
      )}

      {/* 3. MEDICAL APPOINTMENTS & EXAM NOTES VIEW (when bienestar_mente and citas_medicas is active) */}
      {category.id === 'bienestar_mente' && activeCategoryView === 'citas_medicas' && (
        <MedicalAppointmentsView
          appointments={medicalAppointments || []}
          examNotes={medicalExamNotes || []}
          onAddAppointment={onAddMedicalAppointment || (() => {})}
          onUpdateAppointment={onUpdateMedicalAppointment || (() => {})}
          onDeleteAppointment={onDeleteMedicalAppointment || (() => {})}
          onAddExamNote={onAddMedicalExamNote || (() => {})}
          onUpdateExamNote={onUpdateMedicalExamNote || (() => {})}
          onDeleteExamNote={onDeleteMedicalExamNote || (() => {})}
          onOpenNewTaskModal={onOpenNewTaskModal}
          onResetMedicalData={onResetMedicalData}
        />
      )}

      {/* 4. FAMILY TRIPS & SAVINGS VIEW (when familia_relaciones and viajes is active) */}
      {category.id === 'familia_relaciones' && activeCategoryView === 'viajes' && (
        <FamilyTripsView
          trips={familyTrips || []}
          onAddTrip={onAddFamilyTrip || (() => {})}
          onUpdateTrip={onUpdateFamilyTrip || (() => {})}
          onDeleteTrip={onDeleteFamilyTrip || (() => {})}
          onResetTripsData={onResetFamilyTripsData}
          onOpenNewTaskModal={onOpenNewTaskModal}
        />
      )}

      {/* 5. ENTERTAINMENT & GAMING HUB VIEW (when ocio_entretenimiento and ocio_gaming is active) */}
      {category.id === 'ocio_entretenimiento' && activeCategoryView === 'ocio_gaming' && (
        <EntertainmentHubView
          mediaBacklog={mediaBacklog || []}
          gameBacklog={gameBacklog || []}
          mediaReviews={mediaReviews || []}
          onAddMediaBacklog={onAddMediaBacklog || (() => {})}
          onUpdateMediaBacklog={onUpdateMediaBacklog || (() => {})}
          onDeleteMediaBacklog={onDeleteMediaBacklog || (() => {})}
          onAddGameBacklog={onAddGameBacklog || (() => {})}
          onUpdateGameBacklog={onUpdateGameBacklog || (() => {})}
          onDeleteGameBacklog={onDeleteGameBacklog || (() => {})}
          onAddMediaReview={onAddMediaReview || (() => {})}
          onUpdateMediaReview={onUpdateMediaReview || (() => {})}
          onDeleteMediaReview={onDeleteMediaReview || (() => {})}
          onResetEntertainmentData={onResetEntertainmentData}
          onOpenNewTaskModal={onOpenNewTaskModal}
        />
      )}

      {/* 6. MONTHLY FIXED PAYMENTS & BUDGET PLANNER VIEW (when finanzas_hogar and pagos_fijos is active) */}
      {category.id === 'finanzas_hogar' && activeCategoryView === 'pagos_fijos' && (
        <MonthlyBillsTrackerView
          bills={monthlyBills || []}
          onAddBill={onAddMonthlyBill || (() => {})}
          onUpdateBill={onUpdateMonthlyBill || (() => {})}
          onDeleteBill={onDeleteMonthlyBill || (() => {})}
          onBatchSetBills={onBatchSetMonthlyBills}
          onResetBillsData={onResetMonthlyBillsData}
          monthlyIncomes={monthlyIncomes || []}
          onAddIncome={onAddMonthlyIncome || (() => {})}
          onUpdateIncome={onUpdateMonthlyIncome || (() => {})}
          onDeleteIncome={onDeleteMonthlyIncome || (() => {})}
          onBatchSetIncomes={onBatchSetMonthlyIncomes}
          monthlyExtraExpenses={monthlyExtraExpenses || []}
          onAddExtraExpense={onAddMonthlyExtraExpense || (() => {})}
          onUpdateExtraExpense={onUpdateMonthlyExtraExpense || (() => {})}
          onDeleteExtraExpense={onDeleteMonthlyExtraExpense || (() => {})}
          onBatchSetExtraExpenses={onBatchSetMonthlyExtraExpenses}
          debts={debts || []}
          onAddDebt={onAddDebt}
          onUpdateDebt={onUpdateDebt}
          onDeleteDebt={onDeleteDebt}
          onPayDebtInstallment={onPayDebtInstallment}
          onBatchSetDebts={onBatchSetDebts}
          onOpenNewTaskModal={onOpenNewTaskModal}
        />
      )}

      {/* 7. READING & LEARNING HUB VIEW (when aprendizaje and libreria is active) */}
      {(category.id === 'aprendizaje' || category.id === 'aprendizaje_habilidades') && activeCategoryView === 'libreria' && (
        <ReadingHubView
          books={books || []}
          readingQuotes={readingQuotes || []}
          onAddBook={onAddBook || (() => {})}
          onUpdateBook={onUpdateBook || (() => {})}
          onDeleteBook={onDeleteBook || (() => {})}
          onQuickUpdateProgress={onQuickUpdateBookProgress || (() => {})}
          onAddQuote={onAddReadingQuote || (() => {})}
          onDeleteQuote={onDeleteReadingQuote || (() => {})}
          onResetBooksData={onResetBooksData}
        />
      )}

      {/* 8. SMART PURCHASES PLANNER VIEW (when actividades_pendientes and compras_programadas is active) */}
      {category.id === 'actividades_pendientes' && activeCategoryView === 'compras_programadas' && (
        <SmartPurchasesPlannerView
          purchases={smartPurchases || []}
          onAddPurchase={onAddSmartPurchase || (() => {})}
          onUpdatePurchase={onUpdateSmartPurchase || (() => {})}
          onDeletePurchase={onDeleteSmartPurchase || (() => {})}
          onResetPurchasesData={onResetSmartPurchasesData}
        />
      )}

      {/* 3. IDEAS SECTION */}
      {activeCategoryView === 'ideas' && (
      <section id="seccion-ideas-categoria" className="space-y-4 pt-2">
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border ${
          isDark ? 'bg-[#131b2e] border-[#2d3449]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
              style={{ backgroundColor: `${category.color}25`, color: category.color, border: `1px solid ${category.color}50` }}
            >
              <Lightbulb className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className={`text-base sm:text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <span>💡 Banco de Ideas de {category.name}</span>
                <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
                  isDark ? 'bg-slate-800 border-slate-700 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800 font-bold'
                }`}>
                  {categoryIdeas.length}
                </span>
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Anota pensamientos, sugerencias y planes antes de convertirlos en metas formales.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsAddingIdea(!isAddingIdea)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                isDark 
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40' 
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{isAddingIdea ? 'Ocultar Formulario' : 'Nueva Idea'}</span>
            </button>
          </div>
        </div>

        {/* Subtype Filter Pills for Ideas */}
        {typeOptions.length > 0 && (
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedSubtype('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedSubtype === 'all'
                  ? 'bg-amber-400 text-[#0b1326] shadow-md'
                  : isDark 
                    ? 'bg-[#101729] text-slate-400 hover:text-white border border-[#232f48]' 
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-xs'
              }`}
            >
              Todas las Ideas ({categoryIdeas.length})
            </button>
            {typeOptions.map((opt) => {
              const count = categoryIdeas.filter((i) => i.type === opt.type).length;
              const isSelected = selectedSubtype === opt.type;
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setSelectedSubtype(opt.type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-amber-400 text-[#0b1326] shadow-md font-bold'
                      : isDark 
                        ? 'bg-[#101729] text-slate-400 hover:text-white border border-[#232f48]' 
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-xs'
                  }`}
                >
                  <span>{opt.label.split('(')[0].trim()}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected 
                      ? 'bg-[#0b1326]/30 text-[#0b1326]' 
                      : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* New Idea Inline Form */}
        {isAddingIdea && (
          <form
            onSubmit={handleCreateIdea}
            className={`p-5 rounded-2xl border shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 ${
              isDark 
                ? 'bg-gradient-to-br from-[#16203a] to-[#0f172a] border-amber-500/40' 
                : 'bg-amber-50/50 border-amber-300 shadow-amber-900/5'
            }`}
          >
            <div className="flex items-center justify-between">
              <h4 className={`text-sm font-bold flex items-center space-x-2 ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Anotar Idea en {category.name}</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddingIdea(false)}
                className={`text-xs ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Cancelar
              </button>
            </div>

            {/* Type selector */}
            {typeOptions.length > 0 && (
              <div className="space-y-1.5">
                <label className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>Tipo de Idea:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {typeOptions.map((opt) => (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => setNewType(opt.type)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        newType === opt.type
                          ? 'border-amber-400 bg-amber-500/20 text-amber-800 dark:text-amber-200 font-bold shadow-md'
                          : isDark 
                            ? 'border-[#2d3449] bg-[#0b1326] text-slate-300 hover:border-slate-500' 
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      <div className="font-semibold">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Título de la idea (ej. Planificar salida dominical, Comprar rodillo de pintar...)"
                  className={`w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none border ${
                    isDark 
                      ? 'bg-[#0b1326] border-[#2d3449] focus:border-amber-400 text-slate-100 placeholder-slate-500' 
                      : 'bg-white border-slate-300 focus:border-amber-500 text-slate-900 placeholder-slate-400 shadow-xs'
                  }`}
                  autoFocus
                />
              </div>

              <div>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                  placeholder="Detalles, materiales necesarios, enlaces o notas de inspiración..."
                  className={`w-full px-4 py-2 rounded-xl text-xs focus:outline-none resize-none border ${
                    isDark 
                      ? 'bg-[#0b1326] border-[#2d3449] focus:border-amber-400 text-slate-100 placeholder-slate-500' 
                      : 'bg-white border-slate-300 focus:border-amber-500 text-slate-900 placeholder-slate-400 shadow-xs'
                  }`}
                />
              </div>

              <div>
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="Etiquetas separadas por coma (ej. FinDeSemana, Materiales, PróximoMes)"
                  className={`w-full px-4 py-2 rounded-xl text-xs focus:outline-none border ${
                    isDark 
                      ? 'bg-[#0b1326] border-[#2d3449] focus:border-amber-400 text-slate-100 placeholder-slate-500' 
                      : 'bg-white border-slate-300 focus:border-amber-500 text-slate-900 placeholder-slate-400 shadow-xs'
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingIdea(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-[#0b1326] font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Guardar Idea en {category.name}
              </button>
            </div>
          </form>
        )}

        {/* Ideas Grid */}
        {filteredIdeas.length === 0 ? (
          <div className={`py-10 text-center rounded-2xl p-6 space-y-3 border ${
            isDark ? 'bg-[#131b2e]/60 border-[#2d3449]/70' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <Lightbulb className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
              No hay ideas registradas en {category.name} {selectedSubtype !== 'all' ? 'para este filtro' : ''}
            </h4>
            <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Anota chispas de inspiración o planes que quieras realizar en el futuro para esta área.
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingIdea(true)}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer border ${
                  isDark 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}
              >
                + Anotar Primera Idea
              </button>
              <button
                type="button"
                onClick={() => setIsVoiceModalOpen(true)}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center space-x-1.5 border ${
                  isDark 
                    ? 'bg-rose-500/20 text-pink-200 border-rose-500/40' 
                    : 'bg-rose-100 text-rose-900 border-rose-300'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Dictar por Voz</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
            {filteredIdeas.map((idea) => {
              return (
                <div
                  key={idea.id}
                  className={`rounded-2xl p-3 sm:p-4.5 flex flex-col justify-between space-y-2 sm:space-y-3 shadow-md transition-all duration-200 group border ${
                    isDark 
                      ? 'bg-[#131b2e] hover:bg-[#18223a] border-[#2d3449] hover:border-amber-400/50' 
                      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-amber-400 shadow-xs'
                  }`}
                >
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-mono font-bold truncate border ${
                          isDark 
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}>
                          {idea.type ? idea.type.toUpperCase() : 'IDEA'}
                        </span>

                        {/* Status badge */}
                        {(() => {
                          const statusCfg = getIdeaStatusConfig(idea.status, isDark);
                          return (
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold border ${statusCfg.badgeClass}`}>
                              {statusCfg.label}
                            </span>
                          );
                        })()}
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Age Counter & 30-Day Alert Badge */}
                        {(() => {
                          const ageDays = getIdeaAgeDays(idea.createdAt);
                          const ageBadge = getIdeaAgeBadgeStyle(ageDays, isDark);
                          return (
                            <span 
                              className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-mono border font-bold flex items-center space-x-1 ${ageBadge.badgeClass}`}
                              title={`Creada hace ${ageDays} días (${idea.createdAt || 'reciente'}). ${ageDays >= 30 ? '¡Alerta: más de 30 días acumulados!' : ''}`}
                            >
                              <Clock className={`w-2.5 h-2.5 ${ageBadge.iconColor}`} />
                              <span>{ageBadge.label}</span>
                            </span>
                          );
                        })()}

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`¿Deseas eliminar la idea "${idea.title}"?`)) {
                              onDeleteIdea(idea.id);
                            }
                          }}
                          className={`p-1 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer ${
                            isDark ? 'text-slate-500 hover:text-red-400' : 'text-slate-400 hover:text-red-600'
                          }`}
                          title="Eliminar idea"
                        >
                          <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className={`text-xs sm:text-sm font-bold transition-colors leading-snug ${
                      isDark ? 'text-white group-hover:text-amber-300' : 'text-slate-900 group-hover:text-amber-700'
                    }`}>
                      {idea.title}
                    </h4>

                    {idea.description && (
                      <p className={`text-[11px] sm:text-xs line-clamp-2 sm:line-clamp-3 leading-relaxed font-sans ${
                        isDark ? 'text-slate-300' : 'text-slate-600'
                      }`}>
                        {idea.description}
                      </p>
                    )}

                    {/* Tags */}
                    {idea.tags && idea.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {idea.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className={`text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded-md border ${
                              isDark 
                                ? 'bg-[#0b1326] border-slate-700/60 text-slate-400' 
                                : 'bg-slate-100 border-slate-200 text-slate-600'
                            }`}
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom Action: Convert to Goal */}
                  <div className={`pt-2 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 ${
                    isDark ? 'border-slate-800/80' : 'border-slate-100'
                  }`}>
                    <span className={`text-[9px] sm:text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {formatShortDateSpanish(idea.createdAt)}
                    </span>

                    <button
                      type="button"
                      onClick={() => onConvertIdeaToTask(idea)}
                      className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer group-hover:scale-105 border ${
                        isDark 
                          ? 'bg-gradient-to-r from-[#00f2ff]/20 to-[#38ef7d]/20 hover:from-[#00f2ff]/30 hover:to-[#38ef7d]/30 text-cyan-200 border-[#00f2ff]/40' 
                          : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-300 shadow-xs'
                      }`}
                      title="Convertir esta idea en una meta activa con checklist"
                    >
                      <Target className="w-3 h-3 text-[#00f2ff]" />
                      <span className="truncate">Convertir 🎯</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: METAS & CHECKLISTS DE ESTA CATEGORÍA */}
      {/* ========================================================================= */}
      {activeCategoryView === 'metas' && (
      <section className={`space-y-4 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border ${
          isDark ? 'bg-[#131b2e] border-[#2d3449]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
              style={{ backgroundColor: `${category.color}25`, color: category.color, border: `1px solid ${category.color}50` }}
            >
              <Target className="w-5 h-5" style={{ color: category.color }} />
            </div>
            <div>
              <h2 className={`text-base sm:text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <span>🎯 Metas & Checklists de {category.name}</span>
                <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
                  isDark ? 'bg-slate-800 border-slate-700 text-cyan-300' : 'bg-sky-50 border-sky-200 text-sky-800 font-bold'
                }`}>
                  {categoryTasks.length}
                </span>
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Sigue el avance de tus proyectos, marca subtareas completadas y registra tus horas.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => onOpenNewTaskModal({ category: category.id })}
              className="px-4 py-2 text-[#00363a] font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer hover:brightness-110"
              style={{ backgroundColor: category.color }}
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Meta</span>
            </button>
          </div>
        </div>

        {/* Task Search & Filter Bar */}
        <div className={`p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 border ${
          isDark ? 'bg-[#0f172a] border-[#2d3449]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={taskSearchTerm}
              onChange={(e) => setTaskSearchTerm(e.target.value)}
              placeholder={`Buscar metas en ${category.name}...`}
              className={`w-full pl-9 pr-4 py-1.5 rounded-xl text-xs focus:outline-none border ${
                isDark 
                  ? 'bg-[#0b1326] border-[#2d3449] focus:border-[#00f2ff] text-slate-100 placeholder-slate-500' 
                  : 'bg-white border-slate-300 focus:border-sky-500 text-slate-900 placeholder-slate-400 shadow-xs'
              }`}
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap gap-2">
            {/* Quick Status Filter Tabs */}
            <div className="flex items-center space-x-1 p-0.5 rounded-lg border border-slate-700/50 bg-[#070f21]">
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('all')}
                className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                  selectedStatusFilter === 'all'
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todas ({categoryTasks.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('pendiente')}
                className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                  selectedStatusFilter === 'pendiente'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-amber-300'
                }`}
              >
                ⏳ Pendientes ({categoryTasks.filter(t => t.status !== 'completada' && t.status !== 'cancelada').length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('completada')}
                className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                  selectedStatusFilter === 'completada'
                    ? 'bg-orange-500 text-slate-950 shadow-xs shadow-orange-500/40'
                    : 'text-slate-400 hover:text-orange-400'
                }`}
              >
                ✨ Completadas ({completedTasksCount})
              </button>
            </div>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className={`px-3 py-1.5 rounded-xl text-xs focus:outline-none border hidden md:inline-block ${
                isDark 
                  ? 'bg-[#0b1326] border-[#2d3449] text-slate-200' 
                  : 'bg-white border-slate-300 text-slate-700 shadow-xs'
              }`}
            >
              <option value="all">Todos los Estados ({categoryTasks.length})</option>
              <option value="pendiente">Pendientes ({categoryTasks.filter(t => t.status === 'pendiente').length})</option>
              <option value="en_progreso">En Progreso ({categoryTasks.filter(t => t.status === 'en_progreso').length})</option>
              <option value="completada">Completadas ({categoryTasks.filter(t => t.status === 'completada').length})</option>
            </select>

            <div className={`flex items-center space-x-1 border-l pl-2 ${isDark ? 'border-slate-700' : 'border-slate-300'}`}>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  viewMode === 'grid' 
                    ? isDark ? 'bg-[#00f2ff]/20 text-[#00f2ff]' : 'bg-sky-100 text-sky-800'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cuadrícula
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  viewMode === 'table' 
                    ? isDark ? 'bg-[#00f2ff]/20 text-[#00f2ff]' : 'bg-sky-100 text-sky-800'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tabla
              </button>
            </div>
          </div>
        </div>

        {/* Goals List - Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-5">
            {filteredTasks.length === 0 ? (
              <div className={`col-span-full py-12 text-center rounded-2xl p-8 space-y-3 border ${
                isDark ? 'bg-[#131b2e] border-[#2d3449]' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className={`text-base font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  No hay metas activas en {category.name} {selectedStatusFilter !== 'all' ? 'con este estado' : ''}
                </h4>
                <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Crea una nueva meta o convierte una de tus ideas para comenzar a hacerle tracking y seguimiento.
                </p>
                <button
                  type="button"
                  onClick={() => onOpenNewTaskModal({ category: category.id })}
                  className="px-4 py-2 text-[#00363a] font-extrabold text-xs rounded-xl inline-flex items-center space-x-2"
                  style={{ backgroundColor: category.color }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Primera Meta de {category.name}</span>
                </button>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const hoursPct = task.estimatedHours > 0 
                  ? Math.round(((task.completedHours || 0) / task.estimatedHours) * 100) 
                  : 0;
                const isCompleted = task.status === 'completada';

                return (
                  <div
                    key={task.id}
                    className={`rounded-2xl overflow-hidden transition-all duration-200 flex flex-col justify-between shadow-md group relative border ${
                      isCompleted
                        ? isDark
                          ? 'bg-[#131b2e] border-orange-500/60 ring-1 ring-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:border-orange-400'
                          : 'bg-orange-50/20 border-orange-400 ring-1 ring-orange-400/30 shadow-[0_0_18px_rgba(249,115,22,0.22)] hover:border-orange-500'
                        : isDark 
                          ? 'bg-[#131b2e] hover:bg-[#171f33] border-[#2d3449] hover:border-[#00f2ff]/50' 
                          : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-sky-400 shadow-xs'
                    }`}
                  >
                    {/* Card Body */}
                    <div className="p-3 sm:p-5 space-y-2.5 sm:space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5 sm:space-y-2">
                        {/* Header Status & Priority */}
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center space-x-1">
                            <span className={`px-1.5 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono border font-semibold truncate ${getStatusBadgeColor(task.status)}`}>
                              {getStatusLabelSpanish(task.status)}
                            </span>
                            <span className={`hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-mono border font-semibold ${getPriorityBadgeColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            {(task.assignedBy || task.tags?.some(t => t.toLowerCase().includes('liz'))) && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-pink-500/15 text-pink-300 border border-pink-500/30">
                                <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-pink-400 text-pink-400" />
                                <span>Asignado por {task.assignedBy || 'Liz'}</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-0.5 sm:space-x-1">
                            {onConsultAgent && (
                              <button
                                type="button"
                                onClick={() => onConsultAgent(task)}
                                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                                  isDark ? 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10' : 'text-slate-500 hover:text-sky-600 hover:bg-sky-50'
                                }`}
                                title="Consultar recomendaciones del Agente IA"
                              >
                                <Bot className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onEditTask(task)}
                              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                              }`}
                              title="Editar meta"
                            >
                              <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`¿Eliminar la meta "${task.title}"?`)) {
                                  onDeleteTask(task.id);
                                }
                              }}
                              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                                isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                              }`}
                              title="Eliminar meta"
                            >
                              <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          {isCompleted && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-[0_0_6px_rgba(249,115,22,0.35)] shrink-0 flex items-center gap-0.5 animate-in fade-in">
                              <span>✓ Terminada</span>
                            </span>
                          )}
                          <h3 className={`font-bold text-xs sm:text-base transition-colors leading-snug ${
                            isCompleted
                              ? isDark 
                                ? 'text-slate-100 line-through decoration-orange-400/90 decoration-2 group-hover:text-orange-300' 
                                : 'text-slate-900 line-through decoration-orange-500/90 decoration-2 group-hover:text-orange-600'
                              : isDark ? 'text-slate-100 group-hover:text-[#00f2ff]' : 'text-slate-900 group-hover:text-sky-700'
                          }`}>
                            {task.title}
                          </h3>
                        </div>

                        {/* Live Timer / Duración */}
                        <div className="pt-0.5">
                          <TaskLiveTimer task={task} />
                        </div>

                        {task.description && (
                          <p className={`text-[11px] sm:text-xs line-clamp-2 leading-relaxed ${
                            isCompleted 
                              ? isDark ? 'text-slate-300 font-medium' : 'text-slate-700'
                              : isDark ? 'text-slate-400' : 'text-slate-600'
                          }`}>
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Final Goal / Impact */}
                      {task.finalGoal && (
                        <div className={`p-2 sm:p-2.5 rounded-xl border space-y-1 ${
                          isDark ? 'bg-[#0b1326]/60 border-[#2d3449]/50' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className={`text-[9px] sm:text-[10px] font-mono font-bold flex items-center space-x-1 uppercase ${
                            isDark ? 'text-slate-400' : 'text-slate-600'
                          }`}>
                            <Target className="w-3 h-3 text-[#00f2ff]" />
                            <span>Propósito Final</span>
                          </div>
                          <p className={`text-[11px] sm:text-xs leading-snug font-medium line-clamp-1 sm:line-clamp-2 ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            {task.finalGoal}
                          </p>
                        </div>
                      )}

                      {/* Checklist / Subtasks (Interactive & Complete) */}
                      {task.subgoals && task.subgoals.length > 0 && (
                        <div className={`space-y-1 sm:space-y-1.5 pt-1 p-2 sm:p-2.5 rounded-xl border ${
                          isDark ? 'bg-[#0b1326]/50 border-[#2d3449]/70' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="flex justify-between items-center text-[10px] sm:text-[11px] font-mono">
                            <span className={`flex items-center space-x-1 font-semibold truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              <CheckSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#00f2ff]" />
                              <span>Check ({task.subgoals.filter((s) => s.completed).length}/{task.subgoals.length})</span>
                            </span>
                            <span className={`text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.2 rounded border truncate ${
                              task.subgoals.every(s => s.completed)
                                ? isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}>
                              {task.subgoals.every(s => s.completed) ? 'Listo' : `${task.subgoals.filter((s) => !s.completed).length} pend.`}
                            </span>
                          </div>
                          <div className="space-y-1 max-h-24 sm:max-h-36 overflow-y-auto">
                            {task.subgoals.map((sg) => (
                              <button
                                key={sg.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleSubgoal(task.id, sg.id);
                                }}
                                className={`w-full flex items-center space-x-1.5 sm:space-x-2 text-left text-[11px] sm:text-xs p-1 sm:p-1.5 rounded-lg border transition-all cursor-pointer ${
                                  sg.completed
                                    ? isDark 
                                      ? 'bg-emerald-950/25 border-emerald-500/30 text-emerald-300 line-through opacity-85'
                                      : 'bg-emerald-50 border-emerald-200 text-emerald-700 line-through opacity-80'
                                    : isDark 
                                      ? 'bg-[#121c38] border-[#25355c] hover:border-amber-400 text-slate-200'
                                      : 'bg-white border-slate-200 hover:border-amber-400 text-slate-700 shadow-xs'
                                }`}
                              >
                                {sg.completed ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
                                ) : (
                                  <Circle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
                                )}
                                <span className="flex-1 font-medium leading-tight truncate">
                                  {sg.title}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Progress Bar & Hours */}
                      <div className={`space-y-1 sm:space-y-2 pt-1 sm:pt-2 border-t ${isDark ? 'border-[#2d3449]/50' : 'border-slate-100'}`}>
                        <div className="flex justify-between items-center text-[10px] sm:text-xs font-mono">
                          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Horas:</span>
                          <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {task.completedHours}h/{task.estimatedHours}h ({hoursPct}%)
                          </span>
                        </div>
                        <div className={`w-full rounded-full h-1.5 sm:h-2 overflow-hidden border ${
                          isDark ? 'bg-[#0b1326] border-[#2d3449]' : 'bg-slate-200 border-slate-300'
                        }`}>
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, hoursPct)}%`,
                              backgroundColor: category.color,
                            }}
                          />
                        </div>
                      </div>

                      {/* Bottom Controls Bar */}
                      <div className="pt-1.5 sm:pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => onLogHours(task)}
                          className={`w-full sm:w-auto px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold transition-all flex items-center justify-center space-x-1 cursor-pointer border ${
                            isDark 
                              ? 'bg-[#0b1326] hover:bg-[#1a2642] border-[#2d3449] hover:border-[#00f2ff]/50 text-slate-200' 
                              : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-xs'
                          }`}
                        >
                          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" />
                          <span className="truncate">Horas</span>
                        </button>

                        <div className="flex items-center space-x-1 w-full sm:w-auto">
                          {task.status !== 'completada' ? (
                            <button
                              type="button"
                              onClick={() => onQuickStatusChange(task.id, 'completada')}
                              className={`w-full sm:w-auto px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer border ${
                                isDark 
                                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40' 
                                  : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300'
                              }`}
                              title="Marcar meta como completada"
                            >
                              <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              <span className="truncate">Completar</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onQuickStatusChange(task.id, 'en_progreso')}
                              className={`w-full sm:w-auto px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center cursor-pointer border ${
                                isDark 
                                  ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40' 
                                  : 'bg-sky-100 hover:bg-sky-200 text-sky-800 border-sky-300'
                              }`}
                              title="Reabrir meta"
                            >
                              <span className="truncate">Reabrir</span>
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Goals List - Table View */}
        {viewMode === 'table' && (
          <div className={`border rounded-2xl overflow-hidden shadow-xl ${
            isDark ? 'bg-[#131b2e] border-[#2d3449]' : 'bg-white border-slate-200'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b font-mono ${
                    isDark ? 'border-[#2d3449] bg-[#0b1326] text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}>
                    <th className="p-3.5">Meta / Tarea</th>
                    <th className="p-3.5">Estado</th>
                    <th className="p-3.5">Prioridad</th>
                    <th className="p-3.5">Checklist</th>
                    <th className="p-3.5">Horas</th>
                    <th className="p-3.5">Fecha Límite</th>
                    <th className="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-[#2d3449]/60' : 'divide-slate-200'}`}>
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={`p-6 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        No hay metas en esta categoría.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => {
                      const completedSubgoals = (task.subgoals || []).filter(s => s.completed).length;
                      const totalSubgoals = (task.subgoals || []).length;
                      const isCompleted = task.status === 'completada';
                      return (
                        <tr key={task.id} className={`transition-colors ${
                          isCompleted
                            ? isDark
                              ? 'bg-orange-950/20 border-l-4 border-l-orange-500 shadow-[inset_0_0_12px_rgba(249,115,22,0.1)]'
                              : 'bg-orange-50/60 border-l-4 border-l-orange-500'
                            : isDark ? 'hover:bg-[#171f33]' : 'hover:bg-slate-50'
                        }`}>
                          <td className={`p-3.5 font-bold max-w-xs truncate ${
                            isCompleted 
                              ? 'text-slate-100 dark:text-slate-100 line-through decoration-orange-400/90 decoration-2' 
                              : isDark ? 'text-slate-100' : 'text-slate-900'
                          }`}>
                            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                              {isCompleted && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-[0_0_6px_rgba(249,115,22,0.3)] shrink-0">
                                  ✓ Hecha
                                </span>
                              )}
                              <span className="truncate">{task.title}</span>
                            </div>
                            <div className="mt-1">
                              <TaskLiveTimer task={task} compact />
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] border ${getStatusBadgeColor(task.status)}`}>
                              {getStatusLabelSpanish(task.status)}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] border ${getPriorityBadgeColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className={`p-3.5 font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {totalSubgoals > 0 ? `${completedSubgoals}/${totalSubgoals}` : '—'}
                          </td>
                          <td className={`p-3.5 font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {task.completedHours}h / {task.estimatedHours}h
                          </td>
                          <td className={`p-3.5 font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {task.dueDate ? formatShortDateSpanish(task.dueDate) : '—'}
                          </td>
                          <td className="p-3.5 text-right space-x-1">
                            <button
                              type="button"
                              onClick={() => onLogHours(task)}
                              className={`px-2 py-1 rounded-lg font-semibold border ${
                                isDark 
                                  ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/30 border-emerald-500/30' 
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                              }`}
                            >
                              Horas
                            </button>
                            <button
                              type="button"
                              onClick={() => onEditTask(task)}
                              className={`p-1 rounded-lg ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
      )}

      {/* Voice Idea Modal configured for this Category */}
      <VoiceIdeaModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        categories={allCategories}
        defaultCategoryId={category.id}
        onAddIdea={onAddIdea}
      />
    </div>
  );
};
