import React, { useState, useEffect } from 'react';
import { Task, CategoryInfo, Priority, TaskStatus, IdeaItem, HealthProfile, WeightLogEntry, Vehicle, VehicleMaintenance, MedicalAppointment, MedicalExamNote, TripDestination, MediaBacklogItem, MediaReviewItem, GameBacklogItem, MonthlyBillItem, MonthlyIncomeItem, MonthlyExtraExpenseItem, DebtItem, DebtPaymentRecord, BookItem, ReadingQuote, DailyCalorieLog, SmartPurchaseGoal } from '../types';
import { 
  APP_HERO_BANNER, 
  ALL_CATEGORIES_IMAGE,
  GESTION_HERO_IMAGE,
  HABITS_HERO_IMAGE,
  CALENDAR_HERO_IMAGE,
  ACHIEVEMENTS_HERO_IMAGE
} from '../data/initialData';
import { CollectionsSection } from './CollectionsSection';
import { CategoryDetailView } from './CategoryDetailView';
import { HowItWorksGuide } from './HowItWorksGuide';
import { AnnualGoalsSection } from './AnnualGoalsSection';
import { VoiceIdeaModal } from './VoiceIdeaModal';
import { BrainDumpModal } from './BrainDumpModal';
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
import { 
  Search, 
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
  Layers,
  Sparkles,
  Heart,
  Activity,
  BookOpen,
  Smile,
  Home,
  Flame,
  Award,
  RotateCcw,
  Gamepad2,
  Gamepad,
  Clapperboard,
  Film,
  Tv,
  PiggyBank,
  Coins,
  Wallet,
  CircleDollarSign,
  Bot,
  Lightbulb,
  Brain,
  ArrowDown,
  Mic,
  Paintbrush,
  ChevronLeft,
  ChevronRight,
  Quote,
  ArrowRight,
  FolderOpen,
  Bell
} from 'lucide-react';

const HERO_QUOTES = [
  {
    id: 'quote-1',
    badge: '✨ Tu Espacio de Crecimiento & Bienestar',
    titlePrefix: 'Tus ideas te ayudan a alcanzar',
    titleHighlight: 'la mejor versión de ti',
    titleSuffix: '',
    description: 'Transforma tus pensamientos, proyectos y metas en hábitos diarios que eleven tu bienestar físico, mental y personal.',
    gradient: 'from-[#00f2ff] via-teal-200 to-[#38ef7d]',
    badgeStyle: 'border-[#00f2ff]/30 text-cyan-200 bg-gradient-to-r from-[#00f2ff]/15 via-teal-500/10 to-[#38ef7d]/15',
    tagText: 'Desarrollo Personal',
    image: GESTION_HERO_IMAGE,
    cardTitle: 'Tiempo Libre & Paz Mental',
    cardSubtitle: 'Tu Mente Despejada',
    cardStatus: '100% en Control'
  },
  {
    id: 'quote-2',
    badge: '🚀 Inspiración & Realización de Metas',
    titlePrefix: 'Tus ideas te permiten',
    titleHighlight: 'construir tus sueños',
    titleSuffix: 'cada día',
    description: 'Desde una gran meta de vida hasta un proyecto en tu hogar: todo logro extraordinario comienza con una pequeña chispa anotada.',
    gradient: 'from-amber-300 via-rose-300 to-purple-400',
    badgeStyle: 'border-amber-400/30 text-amber-200 bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-purple-500/15',
    tagText: 'Acción & Logro',
    image: ACHIEVEMENTS_HERO_IMAGE,
    cardTitle: 'Logros & Realización',
    cardSubtitle: 'Objetivos Cumplidos',
    cardStatus: 'Orgullo & Éxito'
  },
  {
    id: 'quote-3',
    badge: '🌱 Hábitos, Propósito & Equilibrio',
    titlePrefix: 'Construye tu propio',
    titleHighlight: 'estilo de vida',
    titleSuffix: ', paso a paso',
    description: 'Planifica tus entrenamientos, tiempo en familia, proyectos de aprendizaje y momentos de ocio con calma y equilibrio.',
    gradient: 'from-[#38ef7d] via-emerald-200 to-cyan-300',
    badgeStyle: 'border-emerald-400/30 text-emerald-200 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-cyan-500/15',
    tagText: 'Vida en Balance',
    image: HABITS_HERO_IMAGE,
    cardTitle: 'Rutinas & Energía Diaria',
    cardSubtitle: 'Disciplina sin Estrés',
    cardStatus: 'Hábitos Vivos'
  },
  {
    id: 'quote-4',
    badge: '☀️ Tiempo Libre & Armonía',
    titlePrefix: 'Disfruta tu tiempo con',
    titleHighlight: 'total tranquilidad',
    titleSuffix: '',
    description: 'Agenda tus días, despeja tus compromisos y regálate tiempo de calidad con total libertad mental.',
    gradient: 'from-orange-400 via-amber-300 to-yellow-200',
    badgeStyle: 'border-orange-400/30 text-orange-200 bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-yellow-500/15',
    tagText: 'Tiempo Libre & Relax',
    image: CALENDAR_HERO_IMAGE,
    cardTitle: 'Agenda Despejada',
    cardSubtitle: 'Tiempo Libre de Calidad',
    cardStatus: 'Cero Saturación'
  },
];

interface TaskManagementProps {
  tasks: Task[];
  categories: CategoryInfo[];
  ideas: IdeaItem[];
  healthProfile?: HealthProfile;
  weightLogs?: WeightLogEntry[];
  calorieLogs?: DailyCalorieLog[];
  vehicles?: Vehicle[];
  vehicleMaintenances?: VehicleMaintenance[];
  selectedCategory?: string;
  onSelectCategory?: (catId: string) => void;
  onOpenNewTaskModal: (prefilledIdea?: Partial<Task>) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onLogHours: (task: Task) => void;
  onToggleSubgoal: (taskId: string, subgoalId: string) => void;
  onQuickStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onAssignToCalendar: (task: Task) => void;
  onRolloverTask?: (task: Task) => void;
  onAddIdea: (idea: Omit<IdeaItem, 'id' | 'createdAt'>) => void;
  onAddBatchIdeas?: (ideas: Omit<IdeaItem, 'id' | 'createdAt'>[]) => void;
  onAddBatchTasks?: (tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  onDeleteIdea: (ideaId: string) => void;
  onConvertIdeaToTask: (idea: IdeaItem) => void;
  onResetAllData: () => void;
  onLoadExamples: () => void;
  onConsultAgent?: (task: Task) => void;
  onNavigateToHabits?: () => void;
  onNavigateToTab?: (tab: 'metas' | 'habitos' | 'calendario' | 'cumplimiento' | 'historial') => void;
  onOpenAssistantIntegration?: () => void;
  onOpenNotifications?: () => void;
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
  onQuickUpdateBookProgress?: (bookId: string, newPage: number) => void;
  onAddReadingQuote?: (quote: Omit<ReadingQuote, 'id' | 'createdAt'>) => void;
  onDeleteReadingQuote?: (quoteId: string) => void;
  onResetBooksData?: () => void;
  smartPurchases?: SmartPurchaseGoal[];
  onAddSmartPurchase?: (purchase: Omit<SmartPurchaseGoal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateSmartPurchase?: (purchase: SmartPurchaseGoal) => void;
  onDeleteSmartPurchase?: (purchaseId: string) => void;
  onResetSmartPurchasesData?: () => void;
}

export const TaskManagement: React.FC<TaskManagementProps> = ({
  tasks,
  categories,
  ideas,
  healthProfile,
  weightLogs,
  calorieLogs,
  vehicles,
  vehicleMaintenances,
  selectedCategory: selectedCategoryProp,
  onSelectCategory: onSelectCategoryProp,
  onOpenNewTaskModal,
  onEditTask,
  onDeleteTask,
  onLogHours,
  onToggleSubgoal,
  onQuickStatusChange,
  onAssignToCalendar,
  onRolloverTask,
  onAddIdea,
  onAddBatchIdeas,
  onAddBatchTasks,
  onDeleteIdea,
  onConvertIdeaToTask,
  onResetAllData,
  onLoadExamples,
  onConsultAgent,
  onNavigateToHabits,
  onNavigateToTab,
  onOpenAssistantIntegration,
  onOpenNotifications,
  onUpdateHealthProfile,
  onAddWeightLog,
  onDeleteWeightLog,
  onSaveDailyCalorieLog,
  onDeleteDailyCalorieLog,
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
  const [searchTerm, setSearchTerm] = useState('');
  const [internalCategory, setInternalCategory] = useState<string>('all');
  const selectedCategory = selectedCategoryProp !== undefined ? selectedCategoryProp : internalCategory;
  const setSelectedCategory = (catId: string) => {
    setInternalCategory(catId);
    if (onSelectCategoryProp) {
      onSelectCategoryProp(catId);
    }
  };
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isBrainDumpModalOpen, setIsBrainDumpModalOpen] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [showGlobalList, setShowGlobalList] = useState(false);

  // Auto-cycle through inspirational hero quotes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % HERO_QUOTES.length);
    }, 5500);
    return () => clearInterval(interval);
  }, []);

  const nextQuote = () => {
    setCurrentQuoteIndex((prev) => (prev + 1) % HERO_QUOTES.length);
  };

  const prevQuote = () => {
    setCurrentQuoteIndex((prev) => (prev - 1 + HERO_QUOTES.length) % HERO_QUOTES.length);
  };

  const currentQuote = HERO_QUOTES[currentQuoteIndex];

  // Filter tasks safely
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const filteredTasks = safeTasks
    .filter((task) => {
      if (!task) return false;
      const taskTags = Array.isArray(task.tags) ? task.tags : [];
      const matchesSearch = 
        (task.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.finalGoal || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        taskTags.some((t) => (t || '').toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
      const matchesStatus = 
        selectedStatus === 'all' ? true :
        selectedStatus === 'pendiente' ? (task.status !== 'completada' && task.status !== 'cancelada') :
        task.status === selectedStatus;
      const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;

      return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      // 1. Pending tasks first (arriba), Completed tasks last (para abajo) - Solicitud de usuario
      const aDone = a.status === 'completada' ? 1 : 0;
      const bDone = b.status === 'completada' ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;

      // 2. Para tareas pendientes: dar prioridad a las más antiguas
      if (!aDone) {
        // Mayor prioridad por etiqueta si difiere
        const priorityWeight: Record<string, number> = { urgente: 4, alta: 3, media: 2, baja: 1 };
        const pDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        if (pDiff !== 0) return pDiff;

        // Antigüedad: más antigua primero (createdAt o fecha programada)
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeA && timeB && timeA !== timeB) return timeA - timeB;

        const dateA = a.assignedDate || a.dueDate || '9999-99-99';
        const dateB = b.assignedDate || b.dueDate || '9999-99-99';
        return dateA.localeCompare(dateB);
      }

      // Para tareas completadas: las más recientemente completadas primero
      const compA = a.completedAtTimestamp ? new Date(a.completedAtTimestamp).getTime() : 0;
      const compB = b.completedAtTimestamp ? new Date(b.completedAtTimestamp).getTime() : 0;
      return compB - compA;
    });

  // Calculate quick stats safely
  const completedCount = safeTasks.filter(t => t && t.status === 'completada').length;
  const totalHours = safeTasks.reduce((sum, t) => sum + (t && t.completedHours ? Number(t.completedHours) : 0), 0);

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Activity': return <Activity className="w-4 h-4" />;
      case 'Heart': return <Heart className="w-4 h-4" />;
      case 'BookOpen': return <BookOpen className="w-4 h-4" />;
      case 'Smile': return <Smile className="w-4 h-4" />;
      case 'Gamepad2': case 'Gamepad': return <Gamepad2 className="w-4 h-4 text-pink-400" />;
      case 'Clapperboard': return <Clapperboard className="w-4 h-4 text-pink-400" />;
      case 'Film': case 'Tv': return <Film className="w-4 h-4 text-pink-400" />;
      case 'PiggyBank': return <PiggyBank className="w-4 h-4 text-amber-400" />;
      case 'Coins': return <Coins className="w-4 h-4 text-amber-400" />;
      case 'Wallet': return <Wallet className="w-4 h-4 text-amber-400" />;
      case 'CircleDollarSign': return <CircleDollarSign className="w-4 h-4 text-amber-400" />;
      case 'CheckSquare': case 'Paintbrush': return <Paintbrush className="w-4 h-4 text-orange-400" />;
      default: return <Home className="w-4 h-4" />;
    }
  };

  // If a category is selected, render the dedicated Category Detail Page (Ideas on top, Goals on bottom)
  const currentCategoryObj = categories.find((c) => c.id === selectedCategory);
  if (selectedCategory !== 'all' && currentCategoryObj) {
    return (
      <CategoryDetailView
        category={currentCategoryObj}
        allCategories={categories}
        tasks={safeTasks}
        ideas={Array.isArray(ideas) ? ideas : []}
        healthProfile={healthProfile}
        weightLogs={weightLogs}
        calorieLogs={calorieLogs}
        vehicles={vehicles}
        vehicleMaintenances={vehicleMaintenances}
        onBackToOverview={() => setSelectedCategory('all')}
        onSelectCategory={(catId) => setSelectedCategory(catId)}
        onOpenNewTaskModal={onOpenNewTaskModal}
        onEditTask={onEditTask}
        onDeleteTask={onDeleteTask}
        onLogHours={onLogHours}
        onToggleSubgoal={onToggleSubgoal}
        onQuickStatusChange={onQuickStatusChange}
        onAssignToCalendar={onAssignToCalendar}
        onAddIdea={onAddIdea}
        onDeleteIdea={onDeleteIdea}
        onConvertIdeaToTask={onConvertIdeaToTask}
        onConsultAgent={onConsultAgent}
        onUpdateHealthProfile={onUpdateHealthProfile}
        onAddWeightLog={onAddWeightLog}
        onDeleteWeightLog={onDeleteWeightLog}
        onSaveDailyCalorieLog={onSaveDailyCalorieLog}
        onDeleteDailyCalorieLog={onDeleteDailyCalorieLog}
        onAddVehicle={onAddVehicle}
        onUpdateVehicle={onUpdateVehicle}
        onDeleteVehicle={onDeleteVehicle}
        onAddVehicleMaintenance={onAddVehicleMaintenance}
        onUpdateVehicleMaintenance={onUpdateVehicleMaintenance}
        onDeleteVehicleMaintenance={onDeleteVehicleMaintenance}
        onRecordOilChange={onRecordOilChange}
        onQuickUpdateMileage={onQuickUpdateMileage}
        onResetVehiclesData={onResetVehiclesData}
        onResetHealthData={onResetHealthData}
        onResetCategoryData={onResetCategoryData}
        medicalAppointments={medicalAppointments}
        medicalExamNotes={medicalExamNotes}
        onAddMedicalAppointment={onAddMedicalAppointment}
        onUpdateMedicalAppointment={onUpdateMedicalAppointment}
        onDeleteMedicalAppointment={onDeleteMedicalAppointment}
        onAddMedicalExamNote={onAddMedicalExamNote}
        onUpdateMedicalExamNote={onUpdateMedicalExamNote}
        onDeleteMedicalExamNote={onDeleteMedicalExamNote}
        onResetMedicalData={onResetMedicalData}
        familyTrips={familyTrips}
        onAddFamilyTrip={onAddFamilyTrip}
        onUpdateFamilyTrip={onUpdateFamilyTrip}
        onDeleteFamilyTrip={onDeleteFamilyTrip}
        onResetFamilyTripsData={onResetFamilyTripsData}
        mediaBacklog={mediaBacklog}
        gameBacklog={gameBacklog}
        mediaReviews={mediaReviews}
        onAddMediaBacklog={onAddMediaBacklog}
        onUpdateMediaBacklog={onUpdateMediaBacklog}
        onDeleteMediaBacklog={onDeleteMediaBacklog}
        onAddGameBacklog={onAddGameBacklog}
        onUpdateGameBacklog={onUpdateGameBacklog}
        onDeleteGameBacklog={onDeleteGameBacklog}
        onAddMediaReview={onAddMediaReview}
        onUpdateMediaReview={onUpdateMediaReview}
        onDeleteMediaReview={onDeleteMediaReview}
        onResetEntertainmentData={onResetEntertainmentData}
        monthlyBills={monthlyBills}
        onAddMonthlyBill={onAddMonthlyBill}
        onUpdateMonthlyBill={onUpdateMonthlyBill}
        onDeleteMonthlyBill={onDeleteMonthlyBill}
        onBatchSetMonthlyBills={onBatchSetMonthlyBills}
        onResetMonthlyBillsData={onResetMonthlyBillsData}
        monthlyIncomes={monthlyIncomes}
        onAddMonthlyIncome={onAddMonthlyIncome}
        onUpdateMonthlyIncome={onUpdateMonthlyIncome}
        onDeleteMonthlyIncome={onDeleteMonthlyIncome}
        onBatchSetMonthlyIncomes={onBatchSetMonthlyIncomes}
        monthlyExtraExpenses={monthlyExtraExpenses}
        onAddMonthlyExtraExpense={onAddMonthlyExtraExpense}
        onUpdateMonthlyExtraExpense={onUpdateMonthlyExtraExpense}
        onDeleteMonthlyExtraExpense={onDeleteMonthlyExtraExpense}
        onBatchSetMonthlyExtraExpenses={onBatchSetMonthlyExtraExpenses}
        debts={debts}
        onAddDebt={onAddDebt}
        onUpdateDebt={onUpdateDebt}
        onDeleteDebt={onDeleteDebt}
        onPayDebtInstallment={onPayDebtInstallment}
        onBatchSetDebts={onBatchSetDebts}
        books={books}
        readingQuotes={readingQuotes}
        onAddBook={onAddBook}
        onUpdateBook={onUpdateBook}
        onDeleteBook={onDeleteBook}
        onQuickUpdateBookProgress={onQuickUpdateBookProgress}
        onAddReadingQuote={onAddReadingQuote}
        onDeleteReadingQuote={onDeleteReadingQuote}
        onResetBooksData={onResetBooksData}
        smartPurchases={smartPurchases}
        onAddSmartPurchase={onAddSmartPurchase}
        onUpdateSmartPurchase={onUpdateSmartPurchase}
        onDeleteSmartPurchase={onDeleteSmartPurchase}
        onResetSmartPurchasesData={onResetSmartPurchasesData}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Aesthetic, Human-Centric & Dynamic LifeBlocks Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-[#243454] shadow-2xl bg-[#09101f] transition-all duration-300 group/hero">
        
        {/* Full-width Integrated Ambient Background Image with Cinematic Gradients */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <img 
            key={currentQuote.image || APP_HERO_BANNER}
            src={currentQuote.image || APP_HERO_BANNER} 
            alt="Persona organizada y en paz disfrutando su tiempo libre" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-right sm:object-center opacity-30 sm:opacity-35 scale-105 group-hover/hero:scale-100 transition-all duration-700 filter saturate-125 animate-in fade-in"
          />
          {/* Gradient overlays to guarantee pristine readability & deep aesthetic atmosphere */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#070d1a] via-[#070d1a]/92 sm:via-[#070d1a]/85 to-[#070d1a]/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070d1a] via-transparent to-transparent" />
          
          {/* Soft atmospheric ambient glow orbs */}
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-[#00f2ff]/15 rounded-full blur-[90px]" />
          <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-[#38ef7d]/12 rounded-full blur-[90px]" />
          <div className="absolute -bottom-20 right-10 w-80 h-80 bg-amber-500/12 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 p-5 sm:p-7 lg:p-9">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            
            {/* Left Content Column (7 cols): Human-Centric Clarity & Smart Actions */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-5">
              
              {/* Top Tag & Quote Stepper */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className={`inline-flex items-center space-x-2 px-3.5 py-1.5 border rounded-full text-xs font-semibold backdrop-blur-md shadow-sm transition-all ${currentQuote.badgeStyle}`}>
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>{currentQuote.badge}</span>
                </div>

                {/* Carousel Controls */}
                <div className="flex items-center space-x-2 bg-[#0d1629]/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700/60 text-[11px] font-mono text-slate-300">
                  <div className="flex items-center space-x-1">
                    {HERO_QUOTES.map((q, idx) => (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuoteIndex(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                          idx === currentQuoteIndex
                            ? 'w-5 bg-gradient-to-r from-[#00f2ff] to-[#38ef7d]'
                            : 'w-1.5 bg-slate-600 hover:bg-slate-400'
                        }`}
                        title={`Tema: ${q.tagText || q.titleHighlight}`}
                        aria-label={`Ver tema ${idx + 1}`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center space-x-0.5 pl-1.5 border-l border-slate-700/60">
                    <button
                      type="button"
                      onClick={prevQuote}
                      className="p-0.5 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Anterior"
                      aria-label="Tema anterior"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={nextQuote}
                      className="p-0.5 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Siguiente"
                      aria-label="Siguiente tema"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Typography Section with Fixed Stable Height to Prevent Any Layout Shifts */}
              <div className="h-[135px] sm:h-[125px] lg:h-[120px] flex flex-col justify-center overflow-hidden">
                <div key={currentQuote.id} className="animate-hero-quote space-y-2">
                  <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black tracking-tight leading-[1.18] text-white line-clamp-2">
                    {currentQuote.titlePrefix}{' '}
                    <span className={`text-transparent bg-clip-text bg-gradient-to-r ${currentQuote.gradient} font-extrabold drop-shadow-sm`}>
                      {currentQuote.titleHighlight}
                    </span>
                    {currentQuote.titleSuffix && ` ${currentQuote.titleSuffix}`}
                  </h2>

                  <p className="text-xs sm:text-sm leading-relaxed text-slate-200 font-normal max-w-xl drop-shadow-sm line-clamp-2">
                    {currentQuote.description}
                  </p>
                </div>
              </div>

              {/* Clean Primary Actions Bar (Single prominent CTA + streamlined smart tools) */}
              <div className="pt-1 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onOpenNewTaskModal()}
                  className="px-6 py-3.5 bg-gradient-to-r from-[#00f2ff] via-teal-300 to-[#38ef7d] hover:brightness-110 active:scale-[0.98] text-[#00363a] font-black text-sm rounded-2xl shadow-lg shadow-[#00f2ff]/25 transition-all flex items-center space-x-2.5 cursor-pointer group hover:scale-[1.02]"
                >
                  <div className="w-6 h-6 rounded-lg bg-[#00363a]/15 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-[#00363a] group-hover:rotate-90 transition-transform duration-300 stroke-[3]" />
                  </div>
                  <span>Nueva Meta de Vida</span>
                </button>

                {/* Smart IA Dictate Button */}
                <button
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="px-4 py-3 bg-[#111c33]/90 hover:bg-[#1a2c50] text-pink-200 hover:text-white border border-rose-500/40 hover:border-pink-400 rounded-2xl font-bold text-xs transition-all flex items-center space-x-2 cursor-pointer shadow-md backdrop-blur-md group hover:scale-[1.02]"
                  title="Dictar una meta o idea por voz con auto-clasificación de Gemini"
                >
                  <div className="w-5 h-5 rounded-md bg-rose-500/20 flex items-center justify-center text-pink-300">
                    <Mic className="w-3.5 h-3.5" />
                  </div>
                  <span>Dictar Idea</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500/25 text-[9px] font-mono text-pink-200">IA</span>
                </button>

                {/* Smart Brain Dump Button */}
                <button
                  onClick={() => setIsBrainDumpModalOpen(true)}
                  className="px-4 py-3 bg-[#111c33]/90 hover:bg-[#1a2c50] text-amber-200 hover:text-amber-100 border border-amber-500/40 hover:border-amber-400 rounded-2xl font-bold text-xs transition-all flex items-center space-x-2 cursor-pointer shadow-md backdrop-blur-md group hover:scale-[1.02]"
                  title="Brain Dump: Vuelca múltiples ideas de golpe para auto-clasificarlas con Gemini"
                >
                  <div className="w-5 h-5 rounded-md bg-amber-500/20 flex items-center justify-center text-amber-300">
                    <Brain className="w-3.5 h-3.5" />
                  </div>
                  <span>Brain Dump</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/25 text-[9px] font-mono text-amber-200">Multi</span>
                </button>

                {/* Telegram bot pill if available */}
                {onOpenAssistantIntegration && (
                  <button
                    onClick={onOpenAssistantIntegration}
                    className="px-3.5 py-3 bg-[#0088cc]/20 hover:bg-[#0088cc]/30 text-sky-200 hover:text-white border border-[#0088cc]/45 hover:border-sky-300 rounded-2xl font-bold text-xs transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm backdrop-blur-md group hover:scale-[1.02]"
                    title="Vincular Bot de Telegram para enviar audios o tareas móviles"
                  >
                    <span className="text-xs">✈️</span>
                    <span>Telegram</span>
                  </button>
                )}

                {/* Web Push Alerts button */}
                {onOpenNotifications && (
                  <button
                    onClick={onOpenNotifications}
                    className="px-3.5 py-3 bg-[#111c33]/90 hover:bg-[#1a2c50] text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:border-amber-400 rounded-2xl font-bold text-xs transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm backdrop-blur-md group hover:scale-[1.02]"
                    title="Configurar Notificaciones Web Push (Alertas de Tareas y Hábitos)"
                  >
                    <Bell className="w-3.5 h-3.5 text-amber-400" />
                    <span>Alertas Push</span>
                  </button>
                )}
              </div>

              {/* Minimalist Live Metric Badges */}
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowGlobalList(true);
                    const el = document.getElementById('category-banners-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0b1326]/85 hover:bg-[#13203f] transition-all backdrop-blur-md rounded-xl border border-cyan-500/35 hover:border-cyan-400 text-xs font-mono cursor-pointer shadow-sm group"
                >
                  <Target className="w-3.5 h-3.5 text-[#00f2ff]" />
                  <span className="text-slate-300 group-hover:text-white font-medium">
                    <strong className="text-white">{tasks.length}</strong> {tasks.length === 1 ? 'meta' : 'metas'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateToTab) onNavigateToTab('historial');
                    else {
                      const el = document.getElementById('category-banners-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0b1326]/85 hover:bg-[#0f2a20] transition-all backdrop-blur-md rounded-xl border border-emerald-500/35 hover:border-emerald-400 text-xs font-mono cursor-pointer shadow-sm group"
                >
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-300 group-hover:text-white font-medium">
                    <strong className="text-emerald-300">{totalHours}h</strong> registradas
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateToTab) {
                      onNavigateToTab('ideas');
                    } else {
                      const el = document.getElementById('category-banners-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0b1326]/85 hover:bg-[#2e230f] transition-all backdrop-blur-md rounded-xl border border-amber-500/35 hover:border-amber-400 text-xs font-mono cursor-pointer shadow-sm group"
                  title="Abrir vista completa de ideas pendientes"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-300 group-hover:text-white font-medium">
                    <strong className="text-amber-300">{ideas.length}</strong> {ideas.length === 1 ? 'idea' : 'ideas'}
                  </span>
                </button>

                {completedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateToTab) onNavigateToTab('cumplimiento');
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0b1326]/85 hover:bg-[#28143d] transition-all backdrop-blur-md rounded-xl border border-purple-500/35 hover:border-purple-400 text-xs font-mono cursor-pointer shadow-sm group"
                  >
                    <Award className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-slate-300 group-hover:text-white font-medium">
                      <strong className="text-purple-300">{completedCount}</strong> logradas
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('annual-goals-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0b1326]/85 hover:bg-[#2b1f0e] transition-all backdrop-blur-md rounded-xl border border-amber-500/40 hover:border-amber-400 text-xs font-mono cursor-pointer shadow-sm group"
                  title="Ver Metas Anuales e Hitos a Largo Plazo"
                >
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-300 group-hover:text-white font-medium">
                    <strong className="text-amber-300">Metas Anuales</strong>
                  </span>
                </button>
              </div>

            </div>

            {/* Right Aesthetic Interactive Showcase (5 cols): The Human Focal Point */}
            <div className="lg:col-span-5">
              <div className="relative group">
                
                {/* Decorative floating glass layer */}
                <div className="relative rounded-3xl overflow-hidden border border-cyan-500/40 shadow-2xl bg-[#0e172a]/85 backdrop-blur-xl transition-all duration-500 group-hover:border-cyan-300/80 group-hover:shadow-cyan-500/25">
                  
                  {/* High Quality Thematic Human-Centric Image with Smooth Transition */}
                  <div className="relative h-60 sm:h-72 overflow-hidden">
                    <img 
                      key={currentQuote.image || APP_HERO_BANNER}
                      src={currentQuote.image || APP_HERO_BANNER} 
                      alt="Persona en balance y disfrutando su tiempo libre gracias a una vida organizada" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center transition-all duration-700 group-hover:scale-105 animate-in fade-in"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#09101f] via-[#09101f]/30 to-transparent" />
                    
                    {/* Floating top badge: Freedom & Clarity */}
                    <div className="absolute top-3 right-3 flex items-center space-x-1.5 px-3 py-1.5 bg-[#070e1c]/90 backdrop-blur-md border border-[#00f2ff]/50 rounded-full shadow-lg">
                      <span className="w-2 h-2 rounded-full bg-[#00f2ff] animate-ping" />
                      <span className="text-[11px] font-mono font-bold text-cyan-200">{currentQuote.cardTitle || 'Tiempo Libre & Paz Mental'}</span>
                    </div>

                    {/* Floating bottom tag: Control of life */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs backdrop-blur-md bg-[#070e1c]/85 px-3.5 py-2.5 rounded-2xl border border-slate-700/70 shadow-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#38ef7d] animate-pulse" />
                        <span className="text-white font-bold text-[11px]">{currentQuote.cardSubtitle || 'Tu Mente Despejada'}</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-300 font-bold">{currentQuote.cardStatus || '100% en Control'}</span>
                    </div>
                  </div>

                  {/* Micro Footer inside Card */}
                  <div className="p-3.5 bg-gradient-to-r from-[#0e172a] to-[#0a1120] flex items-center justify-between gap-2 border-t border-slate-800">
                    <div className="flex items-center space-x-2">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-semibold text-slate-200">Hábitos & Rutinas Claras</span>
                    </div>
                    {onNavigateToHabits ? (
                      <button
                        onClick={onNavigateToHabits}
                        className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Ver Rutinas →
                      </button>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400">Sin estrés</span>
                    )}
                  </div>

                </div>

                {/* Subtle back reflection glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[#00f2ff]/25 via-[#38ef7d]/15 to-amber-500/20 rounded-3xl blur-xl -z-10 opacity-75 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Interactive App Guide: How It Works */}
      <HowItWorksGuide 
        onOpenNewTaskModal={() => onOpenNewTaskModal()}
        onScrollToCollections={() => {
          const el = document.getElementById('category-banners-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {/* Annual Goals & Long-Term Milestones Section */}
      <div id="annual-goals-section">
        <AnnualGoalsSection
          categories={categories}
          onSelectCategory={(catId) => setSelectedCategory(catId)}
        />
      </div>

      {/* Main Categories Banners Hub */}
      <div id="category-banners-section" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className={`text-lg sm:text-xl font-black flex items-center space-x-2.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Layers className="w-5 h-5 text-[#00f2ff]" />
              <span>Colecciones & Áreas de Vida</span>
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Haz clic en cualquier área para abrir su espacio temático exclusivo con su propio Banco de Ideas y metas de vida.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5 md:gap-6">
          {categories.map((cat) => {
            const catTasks = safeTasks.filter((t) => t && t.category === cat.id);
            const catIdeas = (Array.isArray(ideas) ? ideas : []).filter((i) => i && i.categoryId === cat.id);
            const completedCount = catTasks.filter((t) => t.status === 'completada').length;
            const totalCatHours = catTasks.reduce((sum, t) => sum + (Number(t.completedHours) || 0), 0);
            const contrastColor = getCategoryContrastColor(cat.id, isDark, cat.color);
            const doodleTags = getCategoryDoodleTags(cat.id);
            const doodleBadge = getCategoryDoodleBadge(cat.id);

            return (
              <div
                key={cat.id}
                id={`card-collection-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`group relative rounded-2xl md:rounded-3xl border md:border-2 overflow-hidden text-left transition-all duration-300 cursor-pointer shadow-md md:shadow-xl hover:shadow-2xl hover:scale-[1.02] flex flex-col justify-between p-3 sm:p-4 md:p-6 min-h-[140px] sm:min-h-[175px] md:min-h-[290px] ${
                  isDark
                    ? 'bg-gradient-to-br from-[#111c35] via-[#0d162a] to-[#0a1020] hover:border-sky-400/80 shadow-black/60'
                    : 'bg-gradient-to-br from-white via-slate-50/90 to-sky-50/40 hover:border-sky-500/80 shadow-slate-200/90'
                }`}
                style={{
                  borderColor: isDark ? `${cat.color}65` : `${contrastColor}50`,
                  boxShadow: isDark 
                    ? `0 10px 30px -10px ${cat.color}25` 
                    : `0 10px 25px -10px ${contrastColor}20`,
                }}
              >
                {/* Ambient Category Radial Glow */}
                <div 
                  className="absolute -top-8 -right-8 md:-top-12 md:-right-12 w-28 h-28 md:w-48 md:h-48 rounded-full blur-2xl md:blur-3xl pointer-events-none opacity-25 group-hover:opacity-45 transition-opacity"
                  style={{ backgroundColor: cat.color }}
                />
                <div 
                  className="absolute -bottom-8 -left-8 md:-bottom-12 md:-left-12 w-28 h-28 md:w-48 md:h-48 rounded-full blur-2xl md:blur-3xl pointer-events-none opacity-20 group-hover:opacity-35 transition-opacity"
                  style={{ backgroundColor: cat.color }}
                />

                {/* Cover Image Background (Subtle) */}
                {cat.image && (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    referrerPolicy="no-referrer"
                    className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-500 pointer-events-none ${
                      isDark 
                        ? 'brightness-[0.22] contrast-[1.1] group-hover:brightness-[0.3] opacity-40 mix-blend-luminosity' 
                        : 'brightness-[0.95] contrast-[0.9] group-hover:brightness-[1.0] opacity-15 mix-blend-multiply'
                    }`}
                  />
                )}
                
                {/* Thematic Rich Doodle Art Background */}
                <CollectionDoodleBackground 
                  categoryId={cat.id} 
                  isDark={isDark} 
                  opacity={isDark ? 0.42 : 0.32} 
                />

                {/* Soft Gradient Overlay for Text Clarity */}
                <div 
                  className={`absolute inset-0 pointer-events-none ${
                    isDark 
                      ? 'bg-gradient-to-t from-[#0b1326]/95 via-[#0b1326]/65 to-[#0b1326]/35' 
                      : 'bg-gradient-to-t from-white/95 via-white/75 to-white/45'
                  }`} 
                />

                {/* Glowing Top Accent Bar with Category Color */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1 md:h-1.5 opacity-90 group-hover:opacity-100 transition-opacity"
                  style={{ 
                    backgroundColor: contrastColor, 
                    boxShadow: isDark ? `0 0 16px ${cat.color}` : `0 2px 8px ${contrastColor}50` 
                  }}
                />

                {/* Card Top Row: Icon + Name + Playful Tilted Doodle Badge Stamp */}
                <div className="relative z-10 space-y-2 md:space-y-3.5">
                  <div className="flex items-start justify-between gap-2 md:gap-2.5">
                    {/* Category Icon Badge */}
                    <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
                      <div 
                        className={`w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center border md:border-2 shadow-sm md:shadow-lg group-hover:scale-105 md:group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shrink-0 [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5 md:[&>svg]:w-6 md:[&>svg]:h-6 ${
                          isDark 
                            ? 'bg-[#152342] shadow-black/50' 
                            : 'bg-white shadow-slate-300/80'
                        }`}
                        style={{ 
                          borderColor: isDark ? cat.color : contrastColor,
                          color: isDark ? cat.color : contrastColor,
                          boxShadow: `0 4px 14px ${cat.color}35`,
                        }}
                      >
                        {getCategoryIcon(cat.iconName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className={`text-xs sm:text-sm md:text-base font-black tracking-tight leading-tight line-clamp-1 md:line-clamp-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {cat.name}
                        </h4>
                        <span className={`text-[10px] sm:text-[11px] font-mono font-bold flex items-center gap-1 mt-0.5 ${
                          isDark ? 'text-slate-300' : 'text-slate-600'
                        }`}>
                          <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 shrink-0" />
                          <span>{catIdeas.length} <span className="hidden sm:inline">{catIdeas.length === 1 ? 'Idea' : 'Ideas'}</span><span className="sm:hidden">id</span></span>
                          <span>·</span>
                          <Target className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-sky-400 shrink-0" />
                          <span>{catTasks.length} <span className="hidden sm:inline">{catTasks.length === 1 ? 'Meta' : 'Metas'}</span><span className="sm:hidden">met</span></span>
                        </span>
                      </div>
                    </div>

                    {/* Doodled Sticker Stamp Badge (Tilted & Playful, visible on desktop/tablets) */}
                    <div 
                      className={`hidden md:inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 border-dashed shadow-sm transform rotate-1 group-hover:rotate-0 transition-transform ${
                        isDark 
                          ? 'bg-[#0f172a]/90 backdrop-blur-md' 
                          : 'bg-white/95 backdrop-blur-md shadow-xs'
                      }`}
                      style={{
                        borderColor: isDark ? `${cat.color}90` : `${contrastColor}70`,
                        color: isDark ? cat.color : contrastColor,
                        backgroundColor: isDark ? `${cat.color}15` : `${contrastColor}10`,
                      }}
                      title="Área Temática LifeFlow"
                    >
                      <span className="text-xs">{doodleBadge.emoji}</span>
                      <span>{doodleBadge.label}</span>
                    </div>
                  </div>

                  {/* Description: displayed fully on desktop, hidden on compact mobile */}
                  <p className={`hidden md:block text-xs line-clamp-2 leading-relaxed ${
                    isDark 
                      ? 'text-slate-200 drop-shadow-sm font-medium' 
                      : 'text-slate-700 font-semibold'
                  }`}>
                    {cat.description}
                  </p>

                  {/* Playful Doodle Sub-topic Tags: displayed on desktop */}
                  <div className="hidden md:flex flex-wrap gap-1.5 pt-1">
                    {doodleTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className={`text-[11px] px-2.5 py-0.5 rounded-lg font-bold border transition-all duration-200 ${
                          isDark
                            ? 'bg-[#14203a]/90 text-slate-200 border-slate-700/80 group-hover:border-slate-600'
                            : 'bg-white text-slate-800 border-slate-300 group-hover:border-slate-400 shadow-xs'
                        }`}
                        style={{
                          borderLeftColor: isDark ? cat.color : contrastColor,
                          borderLeftWidth: '3px',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Mobile Bottom Row: Streamlined mini status & touch indicator */}
                <div className={`md:hidden relative z-10 pt-2 mt-2 border-t flex items-center justify-between gap-1 text-[10px] font-mono font-bold ${
                  isDark ? 'border-slate-700/40 text-slate-300' : 'border-slate-200 text-slate-600'
                }`}>
                  <div className="flex items-center space-x-1.5">
                    {totalCatHours > 0 && (
                      <span className="flex items-center space-x-0.5 text-emerald-400">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{totalCatHours}h</span>
                      </span>
                    )}
                  </div>

                  <span 
                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg font-extrabold transition-all"
                    style={{
                      backgroundColor: isDark ? `${cat.color}25` : `${contrastColor}18`,
                      color: contrastColor,
                    }}
                  >
                    <span>Abrir</span>
                    <ArrowRight className="w-3 h-3 stroke-[2.5]" />
                  </span>
                </div>

                {/* Desktop Card Bottom Row: Full Counters & Action CTA */}
                <div className={`hidden md:flex relative z-10 pt-4 mt-4 border-t items-center justify-between gap-2 ${
                  isDark ? 'border-slate-700/70' : 'border-slate-200'
                }`}>
                  {/* Micro Counters */}
                  <div className="flex items-center space-x-2 text-xs font-mono font-bold">
                    <span 
                      className={`flex items-center space-x-1 px-2 py-0.5 rounded-md border ${
                        isDark 
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' 
                          : 'bg-amber-50 border-amber-300 text-amber-800'
                      }`}
                      title="Banco de Ideas en esta área"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>{catIdeas.length}</span>
                    </span>

                    <span 
                      className={`flex items-center space-x-1 px-2 py-0.5 rounded-md border ${
                        isDark 
                          ? 'bg-sky-500/15 border-sky-500/30 text-sky-300' 
                          : 'bg-sky-50 border-sky-300 text-sky-800'
                      }`}
                      title="Metas de vida registradas"
                    >
                      <Target className="w-3.5 h-3.5" />
                      <span>{catTasks.length}</span>
                    </span>

                    <span 
                      className={`flex items-center space-x-1 px-2 py-0.5 rounded-md border ${
                        isDark 
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                          : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      }`}
                      title="Horas dedicadas a esta categoría"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{totalCatHours}h</span>
                    </span>
                  </div>

                  {/* High-Contrast "Explorar Colección" Button */}
                  <div 
                    id={`btn-open-collection-${cat.id}`}
                    className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shadow-md group-hover:translate-x-1 cursor-pointer ${
                      isDark 
                        ? 'hover:brightness-110 shadow-black/40' 
                        : 'shadow-slate-300/80 hover:brightness-95'
                    }`}
                    style={{
                      backgroundColor: isDark ? `${cat.color}28` : `${contrastColor}18`,
                      color: contrastColor,
                      border: `2px solid ${isDark ? cat.color : contrastColor}`
                    }}
                  >
                    <span>Abrir Área</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Optional Global Tasks Overview Section */}
      <div className={`pt-4 border-t space-y-4 ${isDark ? 'border-[#2d3449]/80' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowGlobalList(!showGlobalList)}
            className={`px-4 py-2.5 rounded-2xl border text-xs font-mono font-bold flex items-center space-x-2 transition-all shadow-md cursor-pointer ${
              isDark 
                ? 'bg-[#131b2e] hover:bg-[#1a243d] border-[#2d3449] hover:border-[#00f2ff]/50 text-slate-200' 
                : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-cyan-400 text-slate-800'
            }`}
          >
            <FolderOpen className="w-4 h-4 text-[#00f2ff]" />
            <span>
              {showGlobalList ? '▲ Ocultar Vista Global de Todas las Metas' : `▼ Ver Todas las Metas Globales (${safeTasks.length})`}
            </span>
          </button>

          <button
            onClick={onOpenNewTaskModal}
            className="px-4 py-2 bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] text-[#00363a] font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-lg shadow-[#00f2ff]/20 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Meta</span>
          </button>
        </div>

        {showGlobalList && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Filters Bar */}
            <div className={`border p-4 rounded-2xl space-y-3 shadow-lg ${
              isDark ? 'bg-[#131b2e] border-[#2d3449]' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                
                {/* Search bar */}
                <div className="lg:col-span-2 relative">
                  <Search className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar metas, deportes, familia, hábitos..."
                    className={`w-full pl-9 pr-4 py-2 border rounded-xl text-xs focus:outline-none ${
                      isDark 
                        ? 'bg-[#0b1326] border-[#2d3449] focus:border-[#00f2ff] text-slate-100 placeholder-slate-500' 
                        : 'bg-slate-50 border-slate-200 focus:border-cyan-500 text-slate-800 placeholder-slate-400'
                    }`}
                  />
                </div>

                {/* Category Filter */}
                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none cursor-pointer ${
                      isDark ? 'bg-[#0b1326] border-[#2d3449] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="all">Todas las Categorías</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none cursor-pointer ${
                      isDark ? 'bg-[#0b1326] border-[#2d3449] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="all">Todos los Estados</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="en_progreso">En Progreso</option>
                    <option value="completada">Completada</option>
                    <option value="bloqueada">Bloqueada</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none cursor-pointer ${
                      isDark ? 'bg-[#0b1326] border-[#2d3449] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="all">Todas las Prioridades</option>
                    <option value="urgente">Urgente</option>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>

              </div>

              {/* Quick Status Filter Tabs: Solicitado por el usuario (Filtro de completadas y pendientes) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-700/30">
                <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-[#070f21] rounded-xl border border-slate-200 dark:border-[#1b2b4d]">
                  <button
                    type="button"
                    onClick={() => setSelectedStatus('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      selectedStatus === 'all'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Todas ({safeTasks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStatus('pendiente')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                      selectedStatus === 'pendiente'
                        ? 'bg-amber-400 text-slate-950 shadow-sm font-black'
                        : 'text-slate-400 hover:text-amber-300'
                    }`}
                  >
                    <span>⏳ Pendientes ({safeTasks.filter(t => t.status !== 'completada' && t.status !== 'cancelada').length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStatus('completada')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                      selectedStatus === 'completada'
                        ? 'bg-orange-500 text-slate-950 shadow-sm shadow-orange-500/40 font-black'
                        : 'text-slate-400 hover:text-orange-400'
                    }`}
                  >
                    <span>✨ Completadas ({completedCount})</span>
                  </button>
                </div>

                <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-2">
                  <span className="hidden sm:inline">Prioridad visual:</span>
                  <span className="text-amber-400 font-semibold">Pendientes arriba</span>
                  <span>•</span>
                  <span className="text-orange-400 font-semibold">Completadas abajo</span>
                </div>
              </div>

              {/* View Mode & Count */}
              <div className={`flex items-center justify-between pt-2 border-t text-xs font-mono ${
                isDark ? 'border-[#2d3449]/50 text-slate-400' : 'border-slate-200 text-slate-500'
              }`}>
                <span>Mostrando {filteredTasks.length} de {tasks.length} metas de vida</span>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'grid' 
                        ? isDark ? 'bg-[#00f2ff]/20 text-[#00f2ff] font-bold' : 'bg-cyan-100 text-cyan-800 font-bold'
                        : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Cuadrícula
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'table' 
                        ? isDark ? 'bg-[#00f2ff]/20 text-[#00f2ff] font-bold' : 'bg-cyan-100 text-cyan-800 font-bold'
                        : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Tabla
                  </button>
                </div>
              </div>
            </div>

      {/* Task List - Grid View (Compact 2 columns on mobile) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 md:gap-5">
          {filteredTasks.length === 0 ? (
            <div className={`col-span-full py-12 text-center rounded-2xl p-8 border ${
              isDark ? 'bg-[#131b2e] border-[#2d3449]' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <h3 className={`text-base font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>No se encontraron metas de vida</h3>
              <p className={`text-xs mt-1 mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Prueba ajustando los filtros o agrega una nueva meta para tu salud, deporte, familia o aprendizaje.
              </p>
              <button
                onClick={onOpenNewTaskModal}
                className="px-4 py-2 bg-[#00f2ff] text-[#00363a] font-bold text-xs rounded-xl inline-flex items-center space-x-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Nueva Meta</span>
              </button>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const cat = categories.find((c) => c.id === task.category);
              const progressPct = getTaskProgressPercentage(task);
              const hoursPct = task.estimatedHours > 0 
                ? Math.round((task.completedHours / task.estimatedHours) * 100) 
                : 0;

              const thumbnailImage = task.image || cat?.image;
              const isCompleted = task.status === 'completada';

              return (
                <div
                  key={task.id}
                  className={`border rounded-2xl overflow-hidden transition-all duration-200 flex flex-col justify-between shadow-xl group relative ${
                    isCompleted
                      ? isDark
                        ? 'bg-[#131b2e] border-orange-500/60 ring-1 ring-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:border-orange-400'
                        : 'bg-orange-50/20 border-orange-400 ring-1 ring-orange-400/30 shadow-[0_0_18px_rgba(249,115,22,0.22)] hover:border-orange-500'
                      : isDark 
                        ? 'bg-[#131b2e] hover:bg-[#171f33] border-[#2d3449] hover:border-[#00f2ff]/50' 
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-cyan-400 shadow-xs'
                  }`}
                >
                  {/* Card Thumbnail Top Visual */}
                  {thumbnailImage && (
                    <div className="relative h-24 sm:h-28 w-full overflow-hidden bg-slate-900 shrink-0">
                      <img
                        src={thumbnailImage}
                        alt={task.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90"
                      />
                      <div className={`absolute inset-0 ${
                        isDark 
                          ? 'bg-gradient-to-t from-[#131b2e] via-[#131b2e]/40 to-transparent' 
                          : 'bg-gradient-to-t from-white/90 via-white/30 to-transparent'
                      }`} />
                      
                      <span
                        className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md shadow-md truncate max-w-[60%]"
                        style={{
                          backgroundColor: `${cat?.color || '#00f2ff'}30`,
                          color: '#ffffff',
                          border: `1px solid ${cat?.color || '#00f2ff'}60`,
                        }}
                      >
                        {cat?.name || task.category}
                      </span>

                      <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 flex items-center space-x-1">
                        <span className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-mono border font-semibold backdrop-blur-md shadow-md ${getPriorityBadgeColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Card Body */}
                  <div className="p-3 sm:p-5 space-y-2.5 sm:space-y-4 flex-1 flex flex-col justify-between">
                    
                    {/* Header info if no thumbnail */}
                    {!thumbnailImage && (
                      <div className="flex items-center justify-between gap-1.5">
                        <span
                          className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider truncate"
                          style={{
                            backgroundColor: `${cat?.color || '#00f2ff'}20`,
                            color: cat?.color || '#00f2ff',
                            border: `1px solid ${cat?.color || '#00f2ff'}40`,
                          }}
                        >
                          {cat?.name || task.category}
                        </span>

                        <div className="flex items-center space-x-1 flex-wrap gap-1">
                          {((task.rolloverCount && task.rolloverCount > 0) || task.postponedFromDate || task.isRollover) && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              title={`Tarea pospuesta que viene de ayer (${task.postponedFromDate || 'día anterior'}) • Rodada ${task.rolloverCount || 1} vez`}
                            >
                              <RotateCcw className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 stroke-[2.5]" />
                              <span>Viene de ayer</span>
                            </span>
                          )}
                          <span className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-mono border font-semibold ${getPriorityBadgeColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          {(task.assignedBy || task.tags?.some(t => t.toLowerCase().includes('liz'))) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold bg-pink-500/15 text-pink-300 border border-pink-500/30">
                              <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-pink-400 text-pink-400" />
                              <span>Asignado por {task.assignedBy || 'Liz'}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1 sm:space-y-1.5">
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1 min-w-0">
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
                              : isDark ? 'text-slate-100 group-hover:text-[#00f2ff]' : 'text-slate-900 group-hover:text-cyan-700'
                          }`}>
                            {task.title}
                          </h3>
                        </div>

                        <select
                          value={task.status}
                          onChange={(e) => onQuickStatusChange(task.id, e.target.value as TaskStatus)}
                          className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-mono border font-semibold cursor-pointer shrink-0 ${
                            isDark ? 'bg-[#0b1326]' : 'bg-white'
                          } ${getStatusBadgeColor(task.status)}`}
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="en_progreso">En Progreso</option>
                          <option value="completada">Completada</option>
                          <option value="bloqueada">Bloqueada</option>
                        </select>
                      </div>

                      {/* Contador de tiempo en vivo / Duración final congelada al completar */}
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

                    {/* Final Goal Section */}
                    {task.finalGoal && (
                      <div className={`p-2.5 sm:p-3 rounded-xl space-y-1 border ${
                        isDark ? 'bg-[#0b1326] border-[#00f2ff]/20' : 'bg-cyan-50/50 border-cyan-200'
                      }`}>
                        <div className="flex items-center justify-between text-[11px] sm:text-xs">
                          <span className={`font-mono font-bold flex items-center space-x-1 ${
                            isDark ? 'text-[#00f2ff]' : 'text-cyan-800'
                          }`}>
                            <Target className="w-3.5 h-3.5 mr-1" />
                            <span>Meta Final:</span>
                          </span>
                          <span className={`font-mono font-bold ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
                            {progressPct}%
                          </span>
                        </div>
                        <p className={`text-[11px] sm:text-xs font-medium line-clamp-2 ${
                          isDark ? 'text-slate-200' : 'text-slate-800'
                        }`}>
                          {task.finalGoal}
                        </p>
                        
                        {task.targetMetricValue && task.targetMetricValue > 0 && (
                          <div className={`text-[10px] sm:text-[11px] font-mono flex justify-between pt-0.5 ${
                            isDark ? 'text-slate-400' : 'text-slate-600'
                          }`}>
                            <span>Progreso métrico:</span>
                            <span className={isDark ? 'text-slate-200' : 'text-slate-900'}>{task.currentMetricValue || 0} / {task.targetMetricValue} {task.metricUnit}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Hours Progress Bar */}
                    <div className={`space-y-1 sm:space-y-1.5 p-2 sm:p-3 rounded-xl border ${
                      isDark ? 'bg-[#0b1326]/60 border-[#2d3449]' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex justify-between items-center text-[10px] sm:text-xs font-mono">
                        <span className={`flex items-center space-x-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" />
                          <span>Horas:</span>
                        </span>
                        <span className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                          {task.completedHours}h / {task.estimatedHours}h ({hoursPct}%)
                        </span>
                      </div>

                      <div className={`w-full h-1.5 sm:h-2 rounded-full overflow-hidden ${
                        isDark ? 'bg-slate-800' : 'bg-slate-200'
                      }`}>
                        <div
                          className="bg-gradient-to-r from-emerald-400 to-[#00f2ff] h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, hoursPct)}%` }}
                        />
                      </div>
                    </div>

                    {/* Subgoals / Checklist preview */}
                    {task.subgoals && task.subgoals.length > 0 && (
                      <div className={`space-y-1 sm:space-y-1.5 pt-1 p-2 sm:p-2.5 rounded-xl border ${
                        isDark ? 'bg-[#0b1326]/50 border-[#2d3449]/70' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className={`flex justify-between items-center text-[10px] sm:text-[11px] font-mono ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          <span className={`flex items-center space-x-1 font-semibold truncate ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            <CheckSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#00f2ff]" />
                            <span>Checklist ({task.subgoals.filter((s) => s.completed).length}/{task.subgoals.length}):</span>
                          </span>
                          <span className={`text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.2 rounded border truncate ${
                            task.subgoals.every(s => s.completed)
                              ? isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}>
                            {task.subgoals.every(s => s.completed) ? 'Listo' : `${task.subgoals.filter((s) => !s.completed).length} pend.`}
                          </span>
                        </div>
                        <div className="space-y-1 max-h-24 sm:max-h-32 overflow-y-auto">
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

                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {task.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono border ${
                              isDark ? 'bg-[#0b1326] text-slate-400 border-[#2d3449]' : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className={`pt-2.5 sm:pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs ${
                      isDark ? 'border-[#2d3449]' : 'border-slate-100'
                    }`}>
                      <div className={`text-[10px] sm:text-[11px] font-mono flex items-center space-x-1 ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                        <span className="truncate">{task.assignedDate ? formatShortDateSpanish(task.assignedDate) : 'Sin fecha'}</span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onLogHours(task)}
                          title="Registrar Horas de Avance"
                          className={`px-2 sm:px-2.5 py-1 rounded-lg font-mono text-[10px] sm:text-[11px] font-bold transition-colors flex items-center space-x-1 cursor-pointer border ${
                            isDark 
                              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40' 
                              : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>+Horas</span>
                        </button>

                        {onConsultAgent && (
                          <button
                            onClick={() => onConsultAgent(task)}
                            title="Recomendaciones y Consejos del Agente IA"
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isDark ? 'text-cyan-400 hover:text-white hover:bg-cyan-500/20' : 'text-cyan-700 hover:text-cyan-900 hover:bg-cyan-50'
                            }`}
                          >
                            <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => onAssignToCalendar(task)}
                          title="Programar en Calendario"
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isDark ? 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10' : 'text-slate-500 hover:text-cyan-700 hover:bg-cyan-50'
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>

                        {onRolloverTask && (
                          <button
                            onClick={() => onRolloverTask(task)}
                            title="Rodar tarea para el día siguiente (>)"
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-0.5 font-mono text-xs font-bold ${
                              isDark ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/15' : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50'
                            }`}
                          >
                            <span className="font-black text-sm">&gt;</span>
                            <span className="text-[10px] hidden sm:inline">+1d</span>
                          </button>
                        )}

                        <button
                          onClick={() => onEditTask(task)}
                          title="Editar Meta"
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>

                        <button
                          onClick={() => onDeleteTask(task.id)}
                          title="Eliminar Meta"
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Task List - Table View */}
      {viewMode === 'table' && (
        <div className={`border rounded-2xl overflow-hidden shadow-xl ${
          isDark ? 'bg-[#131b2e] border-[#2d3449]' : 'bg-white border-slate-200'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b uppercase font-mono tracking-wider ${
                isDark ? 'bg-[#171f33] border-[#2d3449] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <tr>
                  <th className="p-3.5">Meta & Categoría</th>
                  <th className="p-3.5">Meta Final</th>
                  <th className="p-3.5">Horas (Reales/Est)</th>
                  <th className="p-3.5">Avance</th>
                  <th className="p-3.5">Prioridad & Estado</th>
                  <th className="p-3.5">Fecha</th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#2d3449]' : 'divide-slate-200'}`}>
                {filteredTasks.map((task) => {
                  const cat = categories.find((c) => c.id === task.category);
                  const progressPct = getTaskProgressPercentage(task);
                  const isCompleted = task.status === 'completada';

                  return (
                    <tr key={task.id} className={`transition-colors ${
                      isCompleted
                        ? isDark 
                          ? 'bg-orange-950/20 border-l-4 border-l-orange-500 shadow-[inset_0_0_12px_rgba(249,115,22,0.1)] text-slate-100' 
                          : 'bg-orange-50/60 border-l-4 border-l-orange-500 text-slate-900'
                        : isDark ? 'hover:bg-[#171f33]/60 text-slate-200' : 'hover:bg-slate-50 text-slate-800'
                    }`}>
                      <td className="p-3.5 max-w-xs">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          {isCompleted && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-[0_0_6px_rgba(249,115,22,0.3)] shrink-0">
                              ✓ Hecha
                            </span>
                          )}
                          <div className={`font-bold ${
                            isCompleted 
                              ? 'text-slate-100 dark:text-slate-100 line-through decoration-orange-400/90 decoration-2' 
                              : isDark ? 'text-slate-100' : 'text-slate-900'
                          }`}>
                            {task.title}
                          </div>
                        </div>
                        <div className="mt-1 flex items-center space-x-2 flex-wrap gap-1">
                          <span
                            className="inline-block px-2 py-0.5 text-[10px] rounded font-mono"
                            style={{
                              backgroundColor: `${cat?.color || '#00f2ff'}20`,
                              color: cat?.color || '#00f2ff',
                            }}
                          >
                            {cat?.name}
                          </span>
                          <TaskLiveTimer task={task} compact />
                        </div>
                      </td>

                      <td className={`p-3.5 max-w-xs text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {task.finalGoal ? (
                          <div className="flex items-center space-x-1">
                            <Target className="w-3.5 h-3.5 text-[#00f2ff] shrink-0" />
                            <span className="line-clamp-2">{task.finalGoal}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Sin meta explícita</span>
                        )}
                      </td>

                      <td className="p-3.5 font-mono">
                        <div className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {task.completedHours}h / {task.estimatedHours}h
                        </div>
                      </td>

                      <td className="p-3.5 font-mono">
                        <div className="flex items-center space-x-2">
                          <div className={`w-16 h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                            <div
                              className="bg-[#00f2ff] h-full"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span className={`font-bold ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>{progressPct}%</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="flex flex-col space-y-1">
                          {((task.rolloverCount && task.rolloverCount > 0) || task.postponedFromDate || task.isRollover) && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center space-x-1 w-max" title={`Tarea pospuesta de ayer (${task.postponedFromDate || 'día anterior'})`}>
                              <RotateCcw className="w-2.5 h-2.5 text-amber-400 stroke-[2.5]" />
                              <span>Viene de ayer</span>
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono border w-max font-semibold ${getPriorityBadgeColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono border w-max font-semibold ${getStatusBadgeColor(task.status)}`}>
                            {getStatusLabelSpanish(task.status)}
                          </span>
                        </div>
                      </td>

                      <td className={`p-3.5 font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {task.assignedDate ? formatShortDateSpanish(task.assignedDate) : 'Sin fecha'}
                      </td>

                      <td className="p-3.5 text-right space-x-1">
                        {onRolloverTask && (
                          <button
                            onClick={() => onRolloverTask(task)}
                            title="Rodar tarea al día siguiente (>)"
                            className={`px-1.5 py-1 rounded font-mono font-bold text-xs border cursor-pointer ${
                              isDark ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25' : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                            }`}
                          >
                            &gt; +1d
                          </button>
                        )}
                        <button
                          onClick={() => onLogHours(task)}
                          className={`px-2 py-1 rounded font-mono text-[10px] border cursor-pointer ${
                            isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          +Horas
                        </button>
                        <button
                          onClick={() => onEditTask(task)}
                          className={`p-1 cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                          <Edit3 className="w-3.5 h-3.5 inline" />
                        </button>
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className={`p-1 cursor-pointer ${isDark ? 'text-slate-400 hover:text-red-400' : 'text-slate-500 hover:text-red-600'}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
          </div>
        )}
      </div>

      {/* Voice Idea Capture Modal */}
      <VoiceIdeaModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        categories={categories}
        onAddIdea={onAddIdea}
      />

      {/* Brain Dump Multi-Idea AI Reassigner Modal */}
      <BrainDumpModal
        isOpen={isBrainDumpModalOpen}
        onClose={() => setIsBrainDumpModalOpen(false)}
        categories={categories}
        onAddIdeas={(newIdeas) => {
          if (onAddBatchIdeas) {
            onAddBatchIdeas(newIdeas);
          } else {
            newIdeas.forEach(i => onAddIdea(i));
          }
        }}
        onAddTasks={(newTasks) => {
          if (onAddBatchTasks) {
            onAddBatchTasks(newTasks);
          }
        }}
      />

    </div>
  );
};
