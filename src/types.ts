export type Priority = 'baja' | 'media' | 'alta' | 'urgente';

export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada' | 'bloqueada' | 'cancelada';

export interface SubGoal {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: Priority;
  status: TaskStatus;
  
  // Hours and Goal definition
  estimatedHours: number;
  completedHours: number;
  dailyHours?: number; // Horas diarias estimadas
  recurringDays?: number[]; // Días de la semana seleccionados (0=Dom, 1=Lun, 2=Mar, 3=Mie, 4=Jue, 5=Vie, 6=Sab)
  finalGoal: string; // La meta final específica
  targetMetricValue?: number; // Ej: 100 (%) o 50 (unidades)
  currentMetricValue?: number; // Ej: 75
  metricUnit?: string; // Ej: "%", "módulos", "páginas", "entregables"
  
  dueDate: string; // YYYY-MM-DD
  assignedDate?: string; // YYYY-MM-DD para el calendario
  timeSlot?: string; // Ej: "09:00 - 11:00"
  
  tags: string[];
  subgoals: SubGoal[];
  createdAt: string;
  updatedAt: string;
  image?: string;
  assignedBy?: string; // Ej: 'Liz' (Pareja) o 'Miguel'
  assignedTo?: string; // Ej: 'Miguel' o 'Liz'
  gcalSynced?: boolean;
  gcalEventId?: string;

  // Job Things / Work Task specific fields
  isJobTask?: boolean;
  resolutionMinutes?: number; // Tiempo de solución real en minutos (ej: 45m, 90m)
  durationSeconds?: number; // Tiempo total de duración transcurrido en segundos
  completedAt?: string; // Fecha de finalización (YYYY-MM-DD)
  completedAtTimestamp?: string; // Marca de tiempo exacta de finalización ISO
  rolloverCount?: number; // Contador de días que la tarea ha sido pospuesta / arrastrada
  postponedFromDate?: string; // Fecha original de la tarea
  isRollover?: boolean; // Indica si la tarea viene pospuesta de un día anterior
  rolledOverFromDate?: string; // Fecha previa de la que fue rodada
  clientOrProject?: string; // Cliente, proyecto o departamento laboral
  workImportance?: 'critica' | 'alta' | 'media' | 'baja'; // Clasificación en importancia
  scheduledTimeOfDay?: 'manana' | 'tarde' | 'bloque_foco' | 'fin_dia';
}

export interface CategoryInfo {
  id: string;
  name: string;
  color: string; // hex or tailwind class
  iconName: string;
  image?: string;
  description?: string;
}

export interface AnnualMilestone {
  id: string;
  title: string;
  completed: boolean;
  targetQuarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  completedAt?: string;
}

export interface AnnualGoal {
  id: string;
  year: number; // e.g. 2026
  title: string;
  description?: string;
  categoryId: string; // Linked to CategoryInfo.id
  status: 'pendiente' | 'en_progreso' | 'completada';
  quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'anual';
  targetDate?: string;
  targetMetricValue?: number;
  currentMetricValue?: number;
  metricUnit?: string;
  milestones: AnnualMilestone[];
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export type IdeaType = 
  // Salud & Deporte
  | 'cardio' 
  | 'pesas' 
  | 'deporte' 
  | 'rutina' 
  | 'nutricion'
  // Aprendizaje & Habilidades
  | 'habilidad' 
  | 'curso' 
  | 'libro' 
  | 'idioma' 
  | 'proyecto'
  // Bienestar & Mente
  | 'meditacion' 
  | 'lectura_reflexiva' 
  | 'descanso' 
  | 'habito_saludable' 
  | 'paseo_naturaleza'
  // Ocio & Entretenimiento
  | 'videojuego' 
  | 'serie' 
  | 'pelicula' 
  | 'musica' 
  | 'evento'
  // Familia & Tiempo Juntos
  | 'plan_familiar' 
  | 'cita' 
  | 'viaje' 
  | 'proyecto_hogar'
  // Finanzas & Hogar
  | 'ahorro' 
  | 'inversion' 
  | 'compra' 
  | 'presupuesto'
  // Actividades Pendientes & Hogar
  | 'pintura_mejora'
  | 'organizacion_espacio'
  | 'compra_materiales'
  | 'mantenimiento_hogar'
  | 'diligencia_tramite'
  // Vehículos & Garaje
  | 'mantenimiento_preventivo'
  | 'mantenimiento_correctivo'
  | 'mejora_vehiculo'
  | 'seguro_poliza'
  | 'revision_tecnica'
  | 'accesorio_vehiculo'
  // Job Things (Trabajo & Productividad Diaria)
  | 'trabajo_reunion'
  | 'trabajo_entregable'
  | 'trabajo_reporte'
  | 'trabajo_soporte'
  | 'trabajo_mejora'
  | 'trabajo_cliente'
  | 'trabajo_seguimiento'
  // General & Compatibilidad
  | 'lugar' 
  | 'idea' 
  | 'otro';

export type IdeaStatus = 'pendiente' | '50%' | 'hecha';

export interface IdeaItem {
  id: string;
  categoryId: string;
  title: string;
  description?: string;
  type: IdeaType;
  tags?: string[];
  createdAt: string;
  userId?: string;
  status?: IdeaStatus;
  updatedAt?: string;
}

export type ActiveTab = 'gestion' | 'ideas' | 'habitos' | 'calendario' | 'cumplimiento' | 'historial' | 'deskbuddy';

export interface Habit {
  id: string;
  title: string;
  description?: string;
  category: string;
  icon?: string;
  frequency: 'daily' | 'weekdays' | 'weekends' | 'custom';
  targetDaysPerWeek?: number;
  targetTime?: string;
  targetDurationMinutes?: number;
  completedDates: string[]; // List of 'YYYY-MM-DD' strings
  streak: number;
  bestStreak: number;
  color?: string;
  createdAt: string;
  archived?: boolean;
  userId?: string;
}

export interface DaySchedule {
  date: string; // YYYY-MM-DD
  tasks: Task[];
  totalHours: number;
}

export type Gender = 'hombre' | 'mujer';

export type ActivityLevel = 'sedentario' | 'ligero' | 'moderado' | 'intenso' | 'atleta';

export interface HealthProfile {
  id: string;
  userId?: string;
  gender: Gender;
  age: number; // Edad en años
  height: number; // Estatura en cm
  currentWeight: number; // Peso actual en kg
  waistCircumference?: number; // Perímetro de Cintura (PC) en cm
  targetWeight?: number; // Peso objetivo en kg
  activityLevel: ActivityLevel;
  updatedAt: string;
}

export interface WeightLogEntry {
  id: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  weight: number; // kg
  waist?: number; // cm
  bodyFat?: number; // %
  notes?: string;
  createdAt: string;
}

// -------------------------------------------------------------
// NUTRITION, CALORIE TRACKER & DEFICIT PROJECTION TYPES
// -------------------------------------------------------------

export interface MealItem {
  id: string;
  name: string; // Ej: "Huevos revueltos con arepa", "Pechuga de pollo a la plancha"
  calories: number; // kcal
  proteinGrams?: number;
  carbsGrams?: number;
  fatsGrams?: number;
  portion?: string; // Ej: "2 unidades", "200g", "1 plato mediano"
}

export interface MealLog {
  items: MealItem[];
  totalCalories: number;
  notes?: string;
}

export type SleepQuality = 'excelente' | 'bueno' | 'regular' | 'malo';
export type CalorieBalanceStatus = 'deficit' | 'mantenimiento' | 'superavit';

export interface DailyCalorieLog {
  id: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  
  // Intake by meal
  breakfast: MealLog; // Desayuno
  lunch: MealLog; // Almuerzo
  dinner: MealLog; // Cena
  snacks: MealLog; // Adicional / Snacks / Meriendas
  totalCaloriesConsumed: number; // Sum of breakfast + lunch + dinner + snacks

  // Physical Activity, Steps & Sleep
  steps: number; // Ej: 8500 pasos
  stepsCaloriesBurned: number; // Estimado kcal quemadas por pasos
  exerciseCaloriesBurned: number; // Ej: 350 kcal quemadas en gym / cardio
  exerciseNotes?: string; // Ej: "45 min pesas + 15 min elíptica"
  sleepHours: number; // Horas de sueño, ej: 7.5
  sleepQuality?: SleepQuality;
  waterGlasses?: number; // Vasos de agua (ej: 8 vasos / 2L)

  // Energy balance metrics snapshot
  bmrSnapshot?: number; // Tasa Metabólica Basal
  totalEnergyExpenditure?: number; // BMR + Steps Burn + Exercise Burn
  netCalorieBalance?: number; // Consumed - Total Expenditure (negativo = déficit)
  balanceStatus?: CalorieBalanceStatus;

  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// -------------------------------------------------------------
// VEHICLES & GARAGE TYPES
// -------------------------------------------------------------

export type VehicleType = 'automovil' | 'camioneta' | 'moto' | 'camion' | 'otro';

export interface Vehicle {
  id: string;
  userId?: string;
  name: string; // Ej: "Mazda 3 Grand Touring", "Toyota Hilux", "Yamaha MT-07"
  brand: string; // Ej: "Mazda", "Toyota", "Yamaha"
  model: string; // Año o versión, ej: "2023"
  plate?: string; // Placa / Matrícula, ej: "XYZ-789"
  type: VehicleType; // 'automovil' | 'camioneta' | 'moto' | 'camion' | 'otro'
  currentMileage: number; // Kilometraje actual
  color?: string; // Color distintivo o hex
  imageUrl?: string; // Foto real del auto / vehículo (Data URL base64 o URL web)
  
  // Control de Cambio de Aceite
  oilChangeLastMileage: number; // Km en que se hizo el último cambio
  oilChangeIntervalKm: number; // Cada cuántos km se cambia (ej. 5000 o 10000)
  oilType?: string; // Ej: "100% Sintético 5W-30", "10W-40"
  oilChangeLastDate?: string; // YYYY-MM-DD
  
  // Póliza de Seguro
  policyName?: string; // Ej: "Póliza Todo Riesgo", "SOAT Obligatorio"
  policyCompany?: string; // Ej: "Sura", "Allianz", "Mapfre", "Axa"
  policyNumber?: string; // Número de póliza
  policyExpirationDate?: string; // YYYY-MM-DD fecha de vencimiento
  policyCost?: number; // Valor anual de la póliza
  
  // Revisión Técnico-Mecánica (Opcional)
  techInspectionExpirationDate?: string; // YYYY-MM-DD
  
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type MaintenanceCategory = 'preventivo' | 'correctivo' | 'mejora';
export type MaintenancePriority = 'baja' | 'media' | 'alta' | 'urgente';
export type MaintenanceStatus = 'pendiente' | 'en_progreso' | 'completado';

export interface VehicleMaintenance {
  id: string;
  userId?: string;
  vehicleId: string;
  category: MaintenanceCategory; // 'preventivo' | 'correctivo' | 'mejora'
  title: string; // Ej: "Cambio de pastillas de freno", "Reparar fuga de refrigerante", "Polarizado nano-cerámico"
  description?: string;
  status: MaintenanceStatus; // 'pendiente' | 'en_progreso' | 'completado'
  priority: MaintenancePriority;
  targetMileage?: number; // Km programado para realizar
  dueDate?: string; // YYYY-MM-DD
  completedDate?: string; // YYYY-MM-DD
  cost?: number; // Costo estimado o real ($)
  workshop?: string; // Taller / Mecánico
  parts?: string[]; // Lista de repuestos
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// MEDICAL APPOINTMENTS & LAB EXAM NOTES TYPES (Bienestar & Mente)
// -------------------------------------------------------------

export type MedicalSpecialty =
  | 'odontologia'
  | 'urologia'
  | 'medicina_interna'
  | 'cardiologia'
  | 'dermatologia'
  | 'oftalmologia'
  | 'gastroenterologia'
  | 'nutricion'
  | 'psicologia'
  | 'ginecologia'
  | 'traumatologia_ortopedia'
  | 'otorrinolaringologia'
  | 'neurologia'
  | 'endocrinologia'
  | 'general'
  | 'otro';

export type AppointmentStatus = 'programada' | 'confirmada' | 'completada' | 'cancelada';

export interface MedicalExamNote {
  id: string;
  userId?: string;
  appointmentId?: string; // id de la cita médica asociada (opcional)
  specialty: string; // ej: "Medicina Interna", "Odontología", "Urología"
  doctorName?: string; // ej: "Dr. Ramírez"
  title: string; // ej: "Examen de sangre - Hemoglobina y Perfil Lipídico"
  date: string; // YYYY-MM-DD
  status: 'pendiente_muestra' | 'esperando_resultados' | 'completado';
  instructions?: string; // ej: "Ayuno 10 horas, examen de sangre para revisar hemoglobina"
  resultsSummary?: string; // ej: "Hemoglobina en 14.5 g/dL (normal)"
  notesHistory?: { id: string; date: string; text: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface MedicalAppointment {
  id: string;
  userId?: string;
  specialty: MedicalSpecialty | string;
  specialtyLabel: string; // ej: "Odontología / Dentista", "Urología", "Medicina Interna"
  doctorName?: string; // ej: "Dra. Gómez", "Dr. Martínez"
  clinicOrLocation?: string; // ej: "Clínica Medellín Consultorio 402"
  appointmentDate: string; // YYYY-MM-DD (soporta 4 meses, 6 meses, etc.)
  appointmentTime?: string; // HH:mm (ej: "10:30")
  status: AppointmentStatus;
  reason?: string; // ej: "Control semestral de odontología", "Chequeo de rutina de urología"
  preparationNotes?: string; // ej: "Llevar examen de sangre previo para revisar hemoglobina"
  cost?: number;
  phone?: string;
  linkedExamNotes?: string[]; // IDs de notas de exámenes asociadas
  notesHistory?: { id: string; date: string; text: string }[];
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// FAMILY TRIPS & VACATION SAVINGS TYPES (Familia & Tiempo Juntos)
// -------------------------------------------------------------

export type TripStatus = 'planeando' | 'ahorrando' | 'listo_para_viajar' | 'en_viaje' | 'completado';
export type TripPlaceCategory = 'atraccion' | 'playa' | 'restaurante' | 'cultura' | 'aventura' | 'compras' | 'otro';

export interface TripPlace {
  id: string;
  name: string; // Ej: "Parque Xcaret & Ríos Subterráneos"
  category: TripPlaceCategory;
  estimatedCost?: number; // Costo estimado en COP o moneda local
  visited: boolean;
  notes?: string; // Ej: "Comprar entradas con anticipación para descuento"
  locationOrUrl?: string;
}

export interface TripSavingContribution {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number; // Ej: 500000 COP
  sourceOrNote: string; // Ej: "Ahorro quincenal de agosto", "Prima de mitad de año"
}

export interface TripPackingItem {
  id: string;
  item: string;
  packed: boolean;
  category?: 'documentos' | 'ropa' | 'tecnologia' | 'salud_cuidado' | 'otro';
}

export interface TripDestination {
  id: string;
  userId?: string;
  title: string; // Ej: "Viaje Familiar a Cancún & Riviera Maya"
  destination: string; // Ej: "Cancún, México"
  countryOrFlag?: string; // Ej: "🇲🇽 México"
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  status: TripStatus;
  estimatedBudget: number; // Ej: 5000000 (COP)
  savedAmount: number; // Ej: 3200000 (COP)
  currency: string; // 'COP', 'USD', etc.
  travelersCount?: number; // Ej: 4 personas
  flightOrTransportNotes?: string; // Ej: "Vuelo con escala rápida, reservar 3 meses antes"
  accommodationNotes?: string; // Ej: "Hotel All Inclusive en Zona Hotelera o Airbnb en Playa del Carmen"
  generalNotes?: string;
  placesToVisit: TripPlace[];
  savingsContributions: TripSavingContribution[];
  packingList?: TripPackingItem[];
  coverEmoji?: string; // Ej: "🌴", "🏖️", "✈️"
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// SMART PURCHASES PLANNER (Compras Inteligentes Programadas)
// -------------------------------------------------------------

export type SmartPurchaseCategory =
  | 'tecnologia'
  | 'impresion_3d'
  | 'negocio'
  | 'herramientas'
  | 'fotografia'
  | 'hogar_oficina'
  | 'vehiculo'
  | 'otro';

export type SmartPurchaseStatus =
  | 'ahorrando'
  | 'listo'
  | 'comprado'
  | 'pausado';

export type ContributionFrequency = 'quincenal' | 'mensual' | 'semanal';

export interface SmartPurchaseContribution {
  id: string;
  amount: number; // COP
  date: string; // YYYY-MM-DD
  note?: string; // Ej: "Abono 1ra quincena", "Venta freelance"
  source?: string; // 'quincena_1' | 'quincena_2' | 'ahorro_extra' | 'negocio' | 'otro'
  createdAt: string;
}

export interface SmartPurchaseChecklistItem {
  id: string;
  title: string;
  estimatedCost?: number;
  completed: boolean;
}

export interface SmartPurchaseGoal {
  id: string;
  userId?: string;
  title: string; // Ej: "Drone DJI Neo 2"
  category: SmartPurchaseCategory;
  emoji: string; // Ej: "🚁", "🖨️", "💼"
  targetPrice: number; // Ej: 2300000
  savedAmount: number; // Total acumulado abonado, ej: 70000
  currency: string; // 'COP'
  priority: 'alta' | 'media' | 'baja';
  status: SmartPurchaseStatus;
  
  // Projection settings
  estimatedContributionPerPeriod?: number; // Ej: 70000 (cuánto planea abonar regularmente)
  frequency?: ContributionFrequency; // 'quincenal' | 'mensual' | 'semanal'
  targetDate?: string; // YYYY-MM-DD meta opcional

  // Details
  storeOrLink?: string; // Ej: "MercadoLibre / Tienda Oficial DJI"
  modelOrSpecs?: string; // Ej: "Fly More Combo con 3 baterías y hub"
  notes?: string;
  
  // History & execution
  contributions: SmartPurchaseContribution[];
  checklists?: SmartPurchaseChecklistItem[];
  
  // When purchased:
  purchasedDate?: string; // YYYY-MM-DD when purchased
  actualPurchasePrice?: number;
  purchaseNotes?: string;

  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// ENTERTAINMENT: MOVIES, SERIES & VIDEO GAMES BACKLOG (Ocio & Gaming)
// -------------------------------------------------------------

export type MediaType = 'pelicula' | 'serie' | 'anime' | 'documental';
export type MediaStatus = 'pendiente' | 'viendo' | 'pausada' | 'completada';
export type MediaPriority = 'alta' | 'media' | 'baja';

export interface MediaBacklogItem {
  id: string;
  userId?: string;
  title: string;
  type: MediaType;
  platform: string; // Ej: "Netflix", "Max", "Prime Video", "Disney+", "Apple TV+", "Cine", "Crunchyroll", "Otro"
  genre?: string; // Ej: "Ciencia Ficción", "Drama", "Thriller", "Acción", "Animación", "Comedia"
  status: MediaStatus;
  priority: MediaPriority;
  totalDurationOrSeasons?: string; // Ej: "125 min" o "3 Temporadas / 24 Caps"
  currentSeasonOrEpisode?: string; // Ej: "Temp 2 - Ep 4"
  releaseYear?: number;
  coverEmoji?: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MediaReviewItem {
  id: string;
  userId?: string;
  mediaBacklogId?: string; // ID opcional para vincular si venía del backlog
  title: string;
  type: MediaType;
  watchedDate: string; // YYYY-MM-DD
  rating: number; // 1 to 5 (stars)
  review?: string; // Pequeña reseña u opinión personal del usuario
  platform?: string; // Plataforma donde se vio
  genre?: string;
  favoriteMomentOrQuote?: string; // Frase o momento memorable
  wouldRecommend: boolean; // Si la recomienda o no
  coverEmoji?: string;
  createdAt: string;
  updatedAt: string;
}

export type GameStatus = 'pendiente' | 'jugando' | 'pausado' | 'completado' | 'abandonado';
export type GamePriority = 'alta' | 'media' | 'baja';

export interface GameBacklogItem {
  id: string;
  userId?: string;
  title: string;
  platform: string; // Ej: "PC / Steam", "PlayStation 5", "Nintendo Switch", "Xbox Series X", "Game Pass", "Emulador"
  genre: string; // Ej: "RPG / Acción", "Soulslike", "Aventura", "Estrategia", "Shooter", "Indie", "Plataformas"
  status: GameStatus;
  priority: GamePriority;
  estimatedHours?: number; // Horas estimadas para pasarlo
  playedHours?: number; // Horas ya jugadas
  scoreOrRating?: number; // 1 a 5 estrellas opcional si ya se ha jugado
  achievementsProgress?: string; // Ej: "32 de 45 trofeos (71%)"
  notes?: string; // Ej: "Jugar en dificultad difícil", "DLC pendiente"
  coverEmoji?: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// MONTHLY FIXED PAYMENTS & BUDGET PLANNER (Finanzas Familiares & Hogar)
// -------------------------------------------------------------

export type MonthlyBillCategory = 
  | 'servicios_publicos' // Agua, Luz, Gas, Basura
  | 'telecomunicaciones' // Internet, Celular, TV
  | 'vivienda' // Arriendo, Hipoteca, Administración
  | 'seguros_salud' // Póliza auto, Medicina prepagada, Seguro vida
  | 'educacion' // Colegio, Universidad, Cursos
  | 'suscripciones' // Netflix, Spotify, iCloud, Gimnasio
  | 'financiero' // Tarjeta de crédito, Cuota préstamo
  | 'hogar_familia' // Mercado fijo, Aseo, Mascotas
  | 'gastos_diarios' // Presupuesto de gastos diarios / bolsillo quincenal
  | 'otro';

export type MonthlyBillStatus = 'pendiente' | 'pagado' | 'vencido' | 'proximo';

export interface MonthlyBillItem {
  id: string;
  userId?: string;
  monthKey?: string; // Ej: "2026-09", "2026-10" para separar meses
  name: string; // Ej: "💧 Agua / Acueducto", "⚡ Luz / Energía Eléctrica", "🌐 Internet Fibra", "📱 Teléfono / Celular"
  category: MonthlyBillCategory;
  estimatedAmount: number; // Valor estimado ($)
  actualAmount?: number; // Valor real pagado ($)
  dueDay: number; // Día del mes para el pago (1-31)
  dueDate?: string; // Fecha completa YYYY-MM-DD
  status: MonthlyBillStatus;
  paidDate?: string; // YYYY-MM-DD cuando se pagó
  paymentMethod?: string; // "Débito Automático", "Transferencia / PSE", "Efectivo", "Tarjeta de Crédito", "Nequi / Daviplata"
  receiptNumber?: string; // Referencia de pago o código de factura
  notes?: string;
  assignedQuincena?: 'quincena_1' | 'quincena_2'; // Asignación explícita a Q1 o Q2
  isRecurring: boolean; // Si aplica todos los meses
  createdAt: string;
  updatedAt: string;
}

export type MonthlyIncomeSource = 
  | 'quincena_1' // 1ra Quincena (Días 1-15)
  | 'quincena_2' // 2da Quincena (Días 16-31)
  | 'bonificacion' // Bonificaciones, Comisiones, Horas extras
  | 'independiente' // Honorarios, Freelance, Ventas
  | 'arriendo_renta' // Ingreso por rentas o alquileres
  | 'inversion' // Rendimientos, Dividendos
  | 'otro';

export interface MonthlyIncomeItem {
  id: string;
  userId?: string;
  monthKey?: string; // Ej: "2026-09", "2026-10" para separar meses
  name: string; // Ej: "1ra Quincena Miguel", "2da Quincena Miguel", "Bonificación", "Quincena Liz"
  source: MonthlyIncomeSource;
  earner: string; // Ej: "Miguel", "Liz", "Negocio", "Hogar"
  estimatedAmount: number; // Monto esperado / acordado ($)
  actualAmount?: number; // Monto real recibido ($)
  dayOfMonth: number; // Día esperado de cobro (1-31)
  isReceived: boolean; // Si ya fue recibido / consignado
  receivedDate?: string; // Fecha en que se recibió
  paymentChannel?: string; // "Cuenta Nómina Bancolombia", "Nequi", "Daviplata", "Efectivo"
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type MonthlyExtraExpenseCategory =
  | 'salidas_ocio' // Restaurantes, Cine, Salidas de fin de semana
  | 'compras_ropa' // Ropa, Calzado, Accesorios
  | 'salud_farmacia' // Medicamentos extras, Consultas no programadas
  | 'imprevisto_hogar' // Arreglos, Reparaciones, Mantenimientos no previstos
  | 'regalos_celebracion' // Cumpleaños, Aniversarios, Regalos
  | 'transporte_extra' // Taxis, Gasolina extra, Peajes no programados
  | 'tecnologia_hogar' // Repuestos, Accesorios, Gadgets
  | 'mascotas_extra' // Veterinaria imprevista, Accesorios
  | 'otro';

export interface MonthlyExtraExpenseItem {
  id: string;
  userId?: string;
  monthKey?: string; // Ej: "2026-09", "2026-10" para separar meses
  name: string; // Ej: "Salida a cenar fin de semana", "Reparación de cerradura", "Ropa deportiva"
  category: MonthlyExtraExpenseCategory;
  amount: number; // Valor del gasto ($)
  dayOfMonth: number; // Día del mes (1-31) o fecha
  date?: string; // YYYY-MM-DD
  assignedQuincena?: 'quincena_1' | 'quincena_2' | 'general';
  isPaid: boolean; // Si ya fue pagado
  paidBy?: string; // "Miguel", "Liz", "Caja Común"
  paymentMethod?: string; // "Tarjeta de Crédito", "Efectivo", "Nequi / Daviplata", "PSE"
  receiptNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyBudgetPlan {
  id: string;
  userId?: string;
  month: string; // YYYY-MM ej: "2026-08"
  monthName: string; // "Agosto 2026"
  incomes: MonthlyIncomeItem[];
  bills: MonthlyBillItem[];
  extraExpenses: MonthlyExtraExpenseItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// PERSONAL LIBRARY & READING HUB (Aprendizaje & Nuevas Habilidades)
// -------------------------------------------------------------

export type BookStatus = 'por_leer' | 'leyendo' | 'leido' | 'abandonado' | 'deseado';

export type BookFormat = 'fisico' | 'kindle_ebook' | 'audiolibro' | 'pdf';

export type BookCategory =
  | 'desarrollo_personal'
  | 'finanzas_negocios'
  | 'filosofia_mente'
  | 'ciencia_tecnologia'
  | 'ficcion_novela'
  | 'historia_biografias'
  | 'productividad_habitos'
  | 'psicologia_conducta'
  | 'liderazgo_gestion'
  | 'salud_bienestar'
  | 'otro';

export interface ReadingSessionNote {
  id: string;
  date: string; // YYYY-MM-DD
  page?: number;
  text: string;
}

export interface BookItem {
  id: string;
  userId?: string;
  title: string;
  author: string;
  status: BookStatus;
  category: BookCategory | string;
  categoryLabel?: string;
  format: BookFormat;
  totalPages: number;
  currentPage: number;
  rating?: number; // 1 to 5 (stars)
  coverGradient?: string; // Tailwind gradient classes
  coverEmoji?: string; // Emoji de portada
  coverImage?: string;
  startDate?: string; // YYYY-MM-DD
  finishDate?: string; // YYYY-MM-DD
  keyTakeaway?: string; // Mayor aprendizaje
  summary?: string; // Resumen o reflexiones personales
  favoriteQuote?: string; // Cita memorable del libro
  recommendedBy?: string; // Quién lo recomendó
  notesHistory?: ReadingSessionNote[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReadingQuote {
  id: string;
  userId?: string;
  bookTitle: string;
  author: string;
  quote: string;
  page?: number;
  reflection?: string;
  favorite?: boolean;
  category?: string;
  createdAt: string;
}

// -------------------------------------------------------------
// DEBTS & LOANS TRACKER (Control de Deudas, Préstamos y Amortización)
// -------------------------------------------------------------

export type DebtCategory =
  | 'personal' // Préstamo personal, amigos, familiares (ej. Angélica)
  | 'bancario' // Libre inversión, crédito de consumo bancario
  | 'tarjeta' // Saldo diferido / Tarjeta de crédito
  | 'vehicular' // Crédito de auto / moto
  | 'hipotecario' // Crédito de vivienda / leasing habitacional
  | 'educativo' // Icetex, Crédito de estudios
  | 'comercial' // Proveedores, crédito comercial
  | 'otro';

export type DebtStatus = 'activa' | 'saldada' | 'pausada';

export interface DebtPaymentRecord {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number; // Monto abonado ($)
  installmentNumber?: number; // Cuota #
  type?: 'cuota_ordinaria' | 'abono_capital' | 'liquidacion_total';
  note?: string; // Ej: "Pago cuota mensual", "Abono extra a capital"
  receiptNumber?: string;
}

export interface DebtItem {
  id: string;
  userId?: string;
  name: string; // Ej: "Préstamo Angélica", "Crédito Libre Inversión Bancolombia"
  creditor: string; // A quién se le debe: "Angélica", "Bancolombia", "Familiar", etc.
  category: DebtCategory;
  totalAmount: number; // Monto total original del préstamo ($) ej: 4,000,000
  remainingAmount: number; // Saldo actual pendiente por saldar ($)
  monthlyPayment: number; // Valor de la cuota mensual ($) ej: 35,000
  dueDay: number; // Día del mes para pagar la cuota (1-31, ej: 15)
  status: DebtStatus;
  startDate?: string; // Fecha en que se adquirió el préstamo YYYY-MM-DD
  interestRate?: number; // Tasa de interés % (0% si es sin interés)
  interestType?: 'sin_interes' | 'fijo' | 'compuesto';
  paymentChannel?: string; // "Nequi", "Daviplata", "Transferencia Bancaria", "Efectivo"
  notes?: string; // Notas o acuerdos especiales
  paymentsHistory?: DebtPaymentRecord[];
  createdAt: string;
  updatedAt: string;
}




