import React, { useState, useEffect } from 'react';
import { Task, ActiveTab, CategoryInfo, TaskStatus, IdeaItem, Habit, HealthProfile, WeightLogEntry, Vehicle, VehicleMaintenance, MedicalAppointment, MedicalExamNote, TripDestination, MediaBacklogItem, MediaReviewItem, GameBacklogItem, MonthlyBillItem, MonthlyIncomeItem, MonthlyExtraExpenseItem, DebtItem, DebtPaymentRecord, MediaType, BookItem, ReadingQuote, DailyCalorieLog, SmartPurchaseGoal } from './types';
import { INITIAL_TASKS, INITIAL_CATEGORIES, INITIAL_IDEAS, INITIAL_MEDICAL_APPOINTMENTS, INITIAL_MEDICAL_EXAM_NOTES, INITIAL_FAMILY_TRIPS, INITIAL_MEDIA_BACKLOG, INITIAL_GAME_BACKLOG, INITIAL_MEDIA_REVIEWS, INITIAL_MONTHLY_BILLS, INITIAL_MONTHLY_INCOMES, INITIAL_MONTHLY_EXTRA_EXPENSES, INITIAL_DEBTS, INITIAL_BOOKS, INITIAL_READING_QUOTES, INITIAL_DAILY_CALORIE_LOGS, INITIAL_SMART_PURCHASES } from './data/initialData';
import { INITIAL_HABITS } from './data/initialHabits';
import { INITIAL_HEALTH_PROFILE, generateSeedWeightLogs } from './utils/healthCalculators';
import { INITIAL_VEHICLES, INITIAL_VEHICLE_MAINTENANCES } from './utils/vehicleHelpers';
import { Navbar } from './components/Navbar';
import { TaskManagement } from './components/TaskManagement';
import { HabitTrackerView } from './components/HabitTrackerView';
import { CalendarView } from './components/CalendarView';
import { AnalyticsView } from './components/AnalyticsView';
import { HistoryView } from './components/HistoryView';
import { TaskModal } from './components/TaskModal';
import { HabitModal } from './components/HabitModal';
import { LogHoursModal } from './components/LogHoursModal';
import { AuthModal } from './components/AuthModal';
import { VoiceIdeaModal } from './components/VoiceIdeaModal';
import { VoiceAssistantIntegrationModal } from './components/VoiceAssistantIntegrationModal';
import { BrainDumpModal } from './components/BrainDumpModal';
import { AssistantIdeaAnnouncementToast, IdeaAnnouncementData } from './components/AssistantIdeaAnnouncementToast';
import { AgentBanner } from './components/AgentBanner';
import { AgentDrawerModal } from './components/AgentDrawerModal';
import { FloatingAgentWidget } from './components/FloatingAgentWidget';
import { InstallAppModal } from './components/InstallAppModal';
import { DeskBuddyView } from './components/DeskBuddyView';
import { auth, onAuthStateChanged, signOut, db, User, sanitizeForFirestore, getRedirectResult, GoogleAuthProvider, browserPopupRedirectResolver } from './lib/firebase';
import { collection, query, where, onSnapshot, setDoc, doc, deleteDoc, getDoc, getDocs, writeBatch, updateDoc } from 'firebase/firestore';
import { calculateHabitStreak, getTodayDateString } from './utils/habitHelpers';
import { checkAndTriggerNightHabitNotification } from './utils/habitNotificationScheduler';
import { useTheme } from './context/ThemeContext';
import { getGoogleCalendarToken, setGoogleCalendarToken, syncSingleTaskToGoogleCalendar, syncTokenToServer } from './lib/googleCalendar';
import { CalendarDays, CheckSquare, Flame, BarChart2, History, ChevronRight, Lightbulb } from 'lucide-react';
import { PendingIdeasListView } from './components/PendingIdeasListView';
import { getIdeaAgeDays } from './utils/ideaHelpers';
import { WebPushNotificationModal } from './components/WebPushNotificationModal';
import { registerServiceWorker, evaluateUpcomingAlerts } from './services/webNotificationService';

const STORAGE_KEY = 'aurora_tasks_app_v1';
const IDEAS_STORAGE_KEY = 'lifeflow_ideas_v1';
const HABITS_STORAGE_KEY = 'lifeflow_habits_v1';
const HEALTH_PROFILE_STORAGE_KEY = 'lifeflow_health_profile_v1';
const WEIGHT_LOGS_STORAGE_KEY = 'lifeflow_weight_logs_v1';
const DAILY_CALORIE_LOGS_STORAGE_KEY = 'lifeflow_daily_calorie_logs_v1';
const VEHICLES_STORAGE_KEY = 'lifeflow_vehicles_v1';
const VEHICLE_MAINTENANCE_STORAGE_KEY = 'lifeflow_vehicle_maintenances_v1';
const MEDICAL_APPOINTMENTS_STORAGE_KEY = 'lifeflow_medical_appointments_v1';
const MEDICAL_EXAM_NOTES_STORAGE_KEY = 'lifeflow_medical_exam_notes_v1';
const FAMILY_TRIPS_STORAGE_KEY = 'lifeflow_family_trips_v1';
const MEDIA_BACKLOG_STORAGE_KEY = 'lifeflow_media_backlog_v1';
const GAME_BACKLOG_STORAGE_KEY = 'lifeflow_game_backlog_v1';
const MEDIA_REVIEWS_STORAGE_KEY = 'lifeflow_media_reviews_v1';
const MONTHLY_BILLS_STORAGE_KEY = 'lifeflow_monthly_bills_v1';
const MONTHLY_INCOMES_STORAGE_KEY = 'lifeflow_monthly_incomes_v1';
const MONTHLY_EXTRA_EXPENSES_STORAGE_KEY = 'lifeflow_monthly_extra_expenses_v1';
const DEBTS_STORAGE_KEY = 'lifeflow_debts_v1';
const BOOKS_STORAGE_KEY = 'lifeflow_books_v1';
const READING_QUOTES_STORAGE_KEY = 'lifeflow_reading_quotes_v1';
const SMART_PURCHASES_STORAGE_KEY = 'lifeflow_smart_purchases_v1';
const DELETED_ITEMS_STORAGE_KEY = 'lifeflow_deleted_item_ids_v1';

export function deduplicateTasksList(taskList: Task[]): { cleaned: Task[]; removedIds: string[] } {
  const seenMap = new Map<string, Task>();
  const removedIds: string[] = [];

  for (const t of taskList) {
    // Normalize title: remove conversational prefixes, accents and symbols
    const cleanTitle = (t.title || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/^(programar\s+para\s+el\s+d[ií]a\s+de\s+hoy\s+a\s+las\s+\d{1,2}(:\d{2})?\s+|para\s+el\s+d[ií]a\s+de\s+hoy\s+a\s+las\s+\d{1,2}(:\d{2})?\s+|recuerdame\s+|recordatorio:\s*|tarea:\s*|agregar\s+a\s+actividad\s+pendiente\s+)/i, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const dateKey = t.assignedDate || '';
    const timeKey = t.timeSlot || '';
    const key = `${cleanTitle}|${dateKey}|${timeKey}`;

    if (!seenMap.has(key)) {
      seenMap.set(key, t);
    } else {
      const existing = seenMap.get(key)!;
      // Prefer task with more completed hours, with gcalSynced, or without bridged prefix
      const preferExisting =
        (existing.completedHours > t.completedHours) ||
        (existing.gcalSynced && !t.gcalSynced) ||
        (!existing.id.startsWith('task-from-idea-') && t.id.startsWith('task-from-idea-')) ||
        ((existing.description?.length || 0) >= (t.description?.length || 0));

      if (preferExisting) {
        removedIds.push(t.id);
      } else {
        removedIds.push(existing.id);
        seenMap.set(key, t);
      }
    }
  }

  return { cleaned: Array.from(seenMap.values()), removedIds };
}

export default function App() {
  const { theme, isDark } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');

  // Set of deleted task & idea IDs to prevent resurrection from background polls
  const deletedItemIdsRef = React.useRef<Set<string>>(new Set<string>());

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DELETED_ITEMS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          deletedItemIdsRef.current = new Set(parsed);
        }
      }
    } catch {}
  }, []);

  const recordDeletedItemId = (id: string) => {
    if (!id) return;
    deletedItemIdsRef.current.add(id);
    try {
      localStorage.setItem(DELETED_ITEMS_STORAGE_KEY, JSON.stringify(Array.from(deletedItemIdsRef.current)));
    } catch {}
  };

  // Agent Modal State
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [agentModalTask, setAgentModalTask] = useState<Task | null>(null);
  const [isVoiceIdeaModalOpen, setIsVoiceIdeaModalOpen] = useState(false);
  const [isAssistantIntegrationOpen, setIsAssistantIntegrationOpen] = useState(false);
  const [isGlobalBrainDumpOpen, setIsGlobalBrainDumpOpen] = useState(false);
  const [isInstallAppModalOpen, setIsInstallAppModalOpen] = useState(false);
  const [isWebPushModalOpen, setIsWebPushModalOpen] = useState(false);
  const [ideaAnnouncement, setIdeaAnnouncement] = useState<IdeaAnnouncementData | null>(null);

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      if (localStorage.getItem('lifeflow_tasks_cleared') === 'true') return [];
      const isInit = localStorage.getItem('lifeflow_initialized_v1');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const { cleaned } = deduplicateTasksList(parsed);
          return cleaned;
        }
      }
      if (isInit) return [];
    } catch (e) {
      console.error('Error loading tasks from localStorage', e);
    }
    return INITIAL_TASKS;
  });

  const [ideas, setIdeas] = useState<IdeaItem[]>(() => {
    try {
      if (localStorage.getItem('lifeflow_ideas_cleared') === 'true') return [];
      const isInit = localStorage.getItem('lifeflow_initialized_v1');
      const saved = localStorage.getItem(IDEAS_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      if (isInit) return [];
    } catch (e) {
      console.error('Error loading ideas from localStorage', e);
    }
    return INITIAL_IDEAS;
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      if (localStorage.getItem('lifeflow_habits_cleared') === 'true') return [];
      const saved = localStorage.getItem(HABITS_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading habits from localStorage', e);
    }
    return INITIAL_HABITS;
  });

  // Health Profile State
  const [healthProfile, setHealthProfile] = useState<HealthProfile>(() => {
    try {
      const saved = localStorage.getItem(HEALTH_PROFILE_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {
      console.error('Error loading healthProfile from localStorage', e);
    }
    return INITIAL_HEALTH_PROFILE;
  });

  // Weight Logs State
  const [weightLogs, setWeightLogs] = useState<WeightLogEntry[]>(() => {
    try {
      const isInit = localStorage.getItem('lifeflow_initialized_v1');
      if (isInit) {
        const saved = localStorage.getItem(WEIGHT_LOGS_STORAGE_KEY);
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading weightLogs from localStorage', e);
    }
    return generateSeedWeightLogs();
  });

  // Daily Calorie & Nutrition Logs State (Salud & Deporte)
  const [calorieLogs, setCalorieLogs] = useState<DailyCalorieLog[]>(() => {
    try {
      const isInit = localStorage.getItem('lifeflow_initialized_v1');
      if (isInit) {
        const saved = localStorage.getItem(DAILY_CALORIE_LOGS_STORAGE_KEY);
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading calorieLogs from localStorage', e);
    }
    return INITIAL_DAILY_CALORIE_LOGS;
  });

  // Vehicles State
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    try {
      const isInit = localStorage.getItem('lifeflow_initialized_v1');
      if (isInit) {
        const saved = localStorage.getItem(VEHICLES_STORAGE_KEY);
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading vehicles from localStorage', e);
    }
    return INITIAL_VEHICLES;
  });

  // Vehicle Maintenance & Upgrades State
  const [vehicleMaintenances, setVehicleMaintenances] = useState<VehicleMaintenance[]>(() => {
    try {
      const isInit = localStorage.getItem('lifeflow_initialized_v1');
      if (isInit) {
        const saved = localStorage.getItem(VEHICLE_MAINTENANCE_STORAGE_KEY);
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading vehicle maintenances from localStorage', e);
    }
    return INITIAL_VEHICLE_MAINTENANCES;
  });

  // Medical Appointments State (Bienestar & Mente Hub)
  const [medicalAppointments, setMedicalAppointments] = useState<MedicalAppointment[]>(() => {
    try {
      const isInit = localStorage.getItem('lifeflow_initialized_v1');
      if (isInit) {
        const saved = localStorage.getItem(MEDICAL_APPOINTMENTS_STORAGE_KEY);
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading medical appointments from localStorage', e);
    }
    return INITIAL_MEDICAL_APPOINTMENTS;
  });

  // Medical Exam Notes State (Hemoglobin, Lab Orders, etc.)
  const [medicalExamNotes, setMedicalExamNotes] = useState<MedicalExamNote[]>(() => {
    try {
      const isInit = localStorage.getItem('lifeflow_initialized_v1');
      if (isInit) {
        const saved = localStorage.getItem(MEDICAL_EXAM_NOTES_STORAGE_KEY);
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading medical exam notes from localStorage', e);
    }
    return INITIAL_MEDICAL_EXAM_NOTES;
  });

  // Family Trips & Savings State (Familia & Tiempo Juntos)
  const [familyTrips, setFamilyTrips] = useState<TripDestination[]>(() => {
    try {
      const isInit = localStorage.getItem('lifeflow_initialized_v1');
      if (isInit) {
        const saved = localStorage.getItem(FAMILY_TRIPS_STORAGE_KEY);
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading family trips from localStorage', e);
    }
    return INITIAL_FAMILY_TRIPS;
  });

  // Entertainment: Movies & Series Backlog State (Ocio & Entretenimiento)
  const [mediaBacklog, setMediaBacklog] = useState<MediaBacklogItem[]>(() => {
    try {
      const isInit = localStorage.getItem('lifeflow_initialized_v1');
      if (isInit) {
        const saved = localStorage.getItem(MEDIA_BACKLOG_STORAGE_KEY);
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading media backlog from localStorage', e);
    }
    return INITIAL_MEDIA_BACKLOG;
  });

  // Entertainment: Video Games Backlog State
  const [gameBacklog, setGameBacklog] = useState<GameBacklogItem[]>(() => {
    try {
      const isInit = localStorage.getItem('lifeflow_initialized_v1');
      if (isInit) {
        const saved = localStorage.getItem(GAME_BACKLOG_STORAGE_KEY);
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading game backlog from localStorage', e);
    }
    return INITIAL_GAME_BACKLOG;
  });

  // Entertainment: Media Reviews & Ratings Tracker State
  const [mediaReviews, setMediaReviews] = useState<MediaReviewItem[]>(() => {
    try {
      const isInit = localStorage.getItem('lifeflow_initialized_v1');
      if (isInit) {
        const saved = localStorage.getItem(MEDIA_REVIEWS_STORAGE_KEY);
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading media reviews from localStorage', e);
    }
    return INITIAL_MEDIA_REVIEWS;
  });

  // Finances: Monthly Fixed Bills State (Finanzas del Hogar)
  const [monthlyBills, setMonthlyBills] = useState<MonthlyBillItem[]>(() => {
    try {
      if (localStorage.getItem('lifeflow_finances_cleared') === 'true' || localStorage.getItem('lifeflow_bills_cleared') === 'true') return [];
      const isInit = localStorage.getItem('lifeflow_initialized_v1');
      const saved = localStorage.getItem(MONTHLY_BILLS_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.map((b: any) => ({ ...b, monthKey: b.monthKey || '2026-09' }));
      }
      if (isInit) return [];
    } catch (e) {
      console.error('Error loading monthly bills from localStorage', e);
    }
    return INITIAL_MONTHLY_BILLS.map(b => ({ ...b, monthKey: '2026-09' }));
  });

  // Finances: Monthly Incomes State (Finanzas del Hogar)
  const [monthlyIncomes, setMonthlyIncomes] = useState<MonthlyIncomeItem[]>(() => {
    try {
      if (localStorage.getItem('lifeflow_finances_cleared') === 'true' || localStorage.getItem('lifeflow_incomes_cleared') === 'true') return [];
      const isInit = localStorage.getItem('lifeflow_initialized_v1');
      const saved = localStorage.getItem(MONTHLY_INCOMES_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.map((i: any) => ({ ...i, monthKey: i.monthKey || '2026-09' }));
      }
      if (isInit) return [];
    } catch (e) {
      console.error('Error loading monthly incomes from localStorage', e);
    }
    return INITIAL_MONTHLY_INCOMES.map(i => ({ ...i, monthKey: '2026-09' }));
  });

  // Finances: Monthly Extra Expenses State (Finanzas del Hogar)
  const [monthlyExtraExpenses, setMonthlyExtraExpenses] = useState<MonthlyExtraExpenseItem[]>(() => {
    try {
      if (localStorage.getItem('lifeflow_finances_cleared') === 'true' || localStorage.getItem('lifeflow_extra_expenses_cleared') === 'true') return [];
      const deletedIdsRaw = localStorage.getItem(DELETED_ITEMS_STORAGE_KEY);
      const deletedSet = new Set(deletedIdsRaw ? JSON.parse(deletedIdsRaw) : []);
      const isInit = localStorage.getItem('lifeflow_initialized_v1');
      const saved = localStorage.getItem(MONTHLY_EXTRA_EXPENSES_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((e: any) => {
            const nameKey = e.name ? `name:${String(e.name).toLowerCase().trim()}` : '';
            return !deletedSet.has(e.id) && (!nameKey || !deletedSet.has(nameKey));
          }).map((e: any) => ({ ...e, monthKey: e.monthKey || '2026-09' }));
        }
      }
      if (isInit) return [];
      if (deletedSet.has('extra-1') || deletedSet.has('extra-2') || deletedSet.has('extra-3')) return [];
    } catch (e) {
      console.error('Error loading monthly extra expenses from localStorage', e);
    }
    return INITIAL_MONTHLY_EXTRA_EXPENSES.map(e => ({ ...e, monthKey: '2026-09' }));
  });

  // Finances: Debts & Loans Tracking State (Seguimiento de Deudas & Préstamos)
  const [debts, setDebts] = useState<DebtItem[]>(() => {
    try {
      if (localStorage.getItem('lifeflow_finances_cleared') === 'true' || localStorage.getItem('lifeflow_debts_cleared') === 'true') return [];
      const deletedIdsRaw = localStorage.getItem(DELETED_ITEMS_STORAGE_KEY);
      const deletedSet = new Set(deletedIdsRaw ? JSON.parse(deletedIdsRaw) : []);
      const isInit = localStorage.getItem('lifeflow_initialized_v1');
      const saved = localStorage.getItem(DEBTS_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((d: any) => !deletedSet.has(d.id));
        }
      }
      if (isInit) return [];
      if (deletedSet.has('debt-1') || deletedSet.has('debt-2')) return [];
    } catch (e) {
      console.error('Error loading debts from localStorage', e);
    }
    return INITIAL_DEBTS;
  });

  // Learning & Skills: Books Library State (Aprendizaje & Habilidades)
  const [books, setBooks] = useState<BookItem[]>(() => {
    try {
      const saved = localStorage.getItem(BOOKS_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading books from localStorage', e);
    }
    return INITIAL_BOOKS;
  });

  // Learning & Skills: Reading Quotes State (Citas & Reflexiones)
  const [readingQuotes, setReadingQuotes] = useState<ReadingQuote[]>(() => {
    try {
      const saved = localStorage.getItem(READING_QUOTES_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading reading quotes from localStorage', e);
    }
    return INITIAL_READING_QUOTES;
  });

  // Smart Purchases Planner State (Actividades Pendientes & Compras Programadas)
  const [smartPurchases, setSmartPurchases] = useState<SmartPurchaseGoal[]>(() => {
    try {
      const isInit = localStorage.getItem('lifeflow_initialized_v1');
      if (isInit) {
        const saved = localStorage.getItem(SMART_PURCHASES_STORAGE_KEY);
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading smart purchases from localStorage', e);
    }
    return INITIAL_SMART_PURCHASES;
  });

  const [categories] = useState<CategoryInfo[]>(INITIAL_CATEGORIES);
  const [activeTab, setActiveTab] = useState<ActiveTab>('gestion');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleGoHome = () => {
    setActiveTab('gestion');
    setSelectedCategory('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Count of ideas exceeding 30 days that are not completed
  const agedIdeasCount = React.useMemo(() => {
    return ideas.filter((i) => {
      const st = i.status || 'pendiente';
      return st !== 'hecha' && getIdeaAgeDays(i.createdAt) >= 30;
    }).length;
  }, [ideas]);

  // Task Modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultTaskDate, setDefaultTaskDate] = useState<string>('');

  // Habit Modal state
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const [isLogHoursModalOpen, setIsLogHoursModalOpen] = useState(false);
  const [loggingTask, setLoggingTask] = useState<Task | null>(null);

  // Auth Listener & Firestore Sync
  useEffect(() => {
    // Process redirect sign-in if returning from Google OAuth redirect (especially on tablets)
    getRedirectResult(auth, browserPopupRedirectResolver)
      .then((result) => {
        if (result) {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (credential?.accessToken) {
            setGoogleCalendarToken(credential.accessToken, result.user?.email || undefined, result.user?.uid || undefined);
          }
        }
      })
      .catch((err) => {
        console.warn('Google redirect result notice:', err?.code, err?.message);
      });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Ensure Google Calendar token is shared with server for Telegram bot auto-writes
        const localGCalToken = getGoogleCalendarToken();
        if (localGCalToken) {
          syncTokenToServer(localGCalToken, currentUser.email || undefined, currentUser.uid).catch(() => {});
        }

        // Check if user has been seeded before in Firestore
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userDocRef);

          if (!userSnap.exists()) {
            // First time user registration: seed initial data once
            await setDoc(userDocRef, { initialized: true, createdAt: new Date().toISOString() });
            for (const initTask of INITIAL_TASKS) {
              await setDoc(doc(db, 'tasks', initTask.id), { ...initTask, userId: currentUser.uid });
            }
            for (const initIdea of INITIAL_IDEAS) {
              await setDoc(doc(db, 'ideas', initIdea.id), { ...initIdea, userId: currentUser.uid });
            }
            for (const initHabit of INITIAL_HABITS) {
              await setDoc(doc(db, 'habits', initHabit.id), { ...initHabit, userId: currentUser.uid });
            }
            for (const initVeh of INITIAL_VEHICLES) {
              await setDoc(doc(db, 'vehicles', initVeh.id), { ...initVeh, userId: currentUser.uid });
            }
            for (const initMaint of INITIAL_VEHICLE_MAINTENANCES) {
              await setDoc(doc(db, 'vehicle_maintenances', initMaint.id), { ...initMaint, userId: currentUser.uid });
            }
            for (const initTrip of INITIAL_FAMILY_TRIPS) {
              await setDoc(doc(db, 'family_trips', initTrip.id), { ...initTrip, userId: currentUser.uid });
            }
            for (const initMedia of INITIAL_MEDIA_BACKLOG) {
              await setDoc(doc(db, 'media_backlog', initMedia.id), { ...initMedia, userId: currentUser.uid });
            }
            for (const initGame of INITIAL_GAME_BACKLOG) {
              await setDoc(doc(db, 'game_backlog', initGame.id), { ...initGame, userId: currentUser.uid });
            }
            for (const initRev of INITIAL_MEDIA_REVIEWS) {
              await setDoc(doc(db, 'media_reviews', initRev.id), { ...initRev, userId: currentUser.uid });
            }
          }
        } catch (err: any) {
          if (err?.code === 'unavailable' || err?.message?.includes('offline')) {
            console.log('Firestore is currently offline or unreachable. Using offline storage mode.');
          } else {
            console.warn('User doc initialization check note:', err?.message || err);
          }
        }

        // Subscribe to user tasks in Firestore
        const qTasks = query(collection(db, 'tasks'), where('userId', '==', currentUser.uid));
        const unsubTasks = onSnapshot(qTasks, (snapshot) => {
          const loadedTasks: Task[] = [];
          snapshot.forEach((docSnap) => {
            loadedTasks.push({ ...docSnap.data(), id: docSnap.id } as Task);
          });
          const { cleaned, removedIds } = deduplicateTasksList(loadedTasks);
          if (removedIds.length > 0) {
            for (const remId of removedIds) {
              deleteDoc(doc(db, 'tasks', remId)).catch(() => {});
            }
          }
          setTasks(cleaned);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
          } catch {}
        }, (err) => {
          console.error('Firestore tasks subscription error:', err);
        });

        // Subscribe to user ideas in Firestore
        const qIdeas = query(collection(db, 'ideas'), where('userId', '==', currentUser.uid));
        const unsubIdeas = onSnapshot(qIdeas, (snapshot) => {
          const loadedIdeas: IdeaItem[] = [];
          snapshot.forEach((docSnap) => {
            loadedIdeas.push({ ...docSnap.data(), id: docSnap.id } as IdeaItem);
          });
          setIdeas(loadedIdeas);
          try {
            localStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify(loadedIdeas));
          } catch {}
        }, (err) => {
          console.error('Firestore ideas subscription error:', err);
        });

        // Subscribe to user habits in Firestore
        const qHabits = query(collection(db, 'habits'), where('userId', '==', currentUser.uid));
        const unsubHabits = onSnapshot(qHabits, (snapshot) => {
          if (localStorage.getItem('lifeflow_habits_cleared') === 'true') {
            setHabits([]);
            return;
          }

          if (snapshot.empty) {
            // Firestore has no habits for this user yet!
            // Check if we have habits in localStorage or fallback to INITIAL_HABITS
            const savedLocal = localStorage.getItem(HABITS_STORAGE_KEY);
            let habitsToSeed: Habit[] = [];
            if (savedLocal) {
              try {
                const parsed = JSON.parse(savedLocal);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  habitsToSeed = parsed;
                }
              } catch {}
            }
            if (habitsToSeed.length === 0) {
              habitsToSeed = INITIAL_HABITS;
            }

            setHabits(habitsToSeed);
            try {
              localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habitsToSeed));
            } catch {}

            // Auto-persist habits to Firestore under this user so future snapshots won't be empty
            for (const habit of habitsToSeed) {
              const sanitized = sanitizeForFirestore({
                ...habit,
                userId: currentUser.uid,
              });
              setDoc(doc(db, 'habits', habit.id), sanitized, { merge: true }).catch((err) => {
                console.warn('Error auto-seeding habit to Firestore:', err);
              });
            }
            return;
          }

          const loadedHabits: Habit[] = [];
          snapshot.forEach((docSnap) => {
            loadedHabits.push({ ...docSnap.data(), id: docSnap.id } as Habit);
          });
          setHabits(loadedHabits);
          try {
            localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(loadedHabits));
          } catch {}
        }, (err) => {
          console.error('Firestore habits subscription error:', err);
        });

        // Subscribe to user health profile in Firestore
        const healthDocRef = doc(db, 'health_profiles', currentUser.uid);
        const unsubHealthProfile = onSnapshot(healthDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setHealthProfile(docSnap.data() as HealthProfile);
          }
        }, (err) => {
          console.error('Firestore health profile subscription error:', err);
        });

        // Subscribe to user weight logs in Firestore
        const qWeightLogs = query(collection(db, 'weight_logs'), where('userId', '==', currentUser.uid));
        const unsubWeightLogs = onSnapshot(qWeightLogs, (snapshot) => {
          const loadedLogs: WeightLogEntry[] = [];
          snapshot.forEach((docSnap) => {
            loadedLogs.push({ ...docSnap.data(), id: docSnap.id } as WeightLogEntry);
          });
          loadedLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          setWeightLogs(loadedLogs);
          localStorage.setItem(WEIGHT_LOGS_STORAGE_KEY, JSON.stringify(loadedLogs));
        }, (err) => {
          console.error('Firestore weight logs subscription error:', err);
        });

        // Subscribe to user calorie logs in Firestore
        const qCalorieLogs = query(collection(db, 'calorie_logs'), where('userId', '==', currentUser.uid));
        const unsubCalorieLogs = onSnapshot(qCalorieLogs, (snapshot) => {
          const loadedCal: DailyCalorieLog[] = [];
          snapshot.forEach((docSnap) => {
            loadedCal.push({ ...docSnap.data(), id: docSnap.id } as DailyCalorieLog);
          });
          loadedCal.sort((a, b) => b.date.localeCompare(a.date));
          setCalorieLogs(loadedCal);
          localStorage.setItem(DAILY_CALORIE_LOGS_STORAGE_KEY, JSON.stringify(loadedCal));
        }, (err) => {
          console.error('Firestore calorie logs subscription error:', err);
        });

        // Subscribe to user vehicles in Firestore
        const qVehicles = query(collection(db, 'vehicles'), where('userId', '==', currentUser.uid));
        const unsubVehicles = onSnapshot(qVehicles, (snapshot) => {
          const loadedVehicles: Vehicle[] = [];
          snapshot.forEach((docSnap) => {
            loadedVehicles.push({ ...docSnap.data(), id: docSnap.id } as Vehicle);
          });
          setVehicles(loadedVehicles);
          localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(loadedVehicles));
        }, (err) => {
          console.error('Firestore vehicles subscription error:', err);
        });

        // Subscribe to user vehicle maintenances in Firestore
        const qMaintenances = query(collection(db, 'vehicle_maintenances'), where('userId', '==', currentUser.uid));
        const unsubMaintenances = onSnapshot(qMaintenances, (snapshot) => {
          const loadedMaint: VehicleMaintenance[] = [];
          snapshot.forEach((docSnap) => {
            loadedMaint.push({ ...docSnap.data(), id: docSnap.id } as VehicleMaintenance);
          });
          setVehicleMaintenances(loadedMaint);
          localStorage.setItem(VEHICLE_MAINTENANCE_STORAGE_KEY, JSON.stringify(loadedMaint));
        }, (err) => {
          console.error('Firestore vehicle maintenances subscription error:', err);
        });

        // Subscribe to user medical appointments in Firestore
        const qAppointments = query(collection(db, 'medical_appointments'), where('userId', '==', currentUser.uid));
        const unsubAppointments = onSnapshot(qAppointments, (snapshot) => {
          const loadedApp: MedicalAppointment[] = [];
          snapshot.forEach((docSnap) => {
            loadedApp.push({ ...docSnap.data(), id: docSnap.id } as MedicalAppointment);
          });
          setMedicalAppointments(loadedApp);
          localStorage.setItem(MEDICAL_APPOINTMENTS_STORAGE_KEY, JSON.stringify(loadedApp));
        }, (err) => {
          console.error('Firestore medical appointments subscription error:', err);
        });

        // Subscribe to user medical exam notes in Firestore
        const qExamNotes = query(collection(db, 'medical_exam_notes'), where('userId', '==', currentUser.uid));
        const unsubExamNotes = onSnapshot(qExamNotes, (snapshot) => {
          const loadedExams: MedicalExamNote[] = [];
          snapshot.forEach((docSnap) => {
            loadedExams.push({ ...docSnap.data(), id: docSnap.id } as MedicalExamNote);
          });
          setMedicalExamNotes(loadedExams);
          localStorage.setItem(MEDICAL_EXAM_NOTES_STORAGE_KEY, JSON.stringify(loadedExams));
        }, (err) => {
          console.error('Firestore medical exam notes subscription error:', err);
        });

        // Subscribe to user family trips in Firestore
        const qTrips = query(collection(db, 'family_trips'), where('userId', '==', currentUser.uid));
        const unsubTrips = onSnapshot(qTrips, (snapshot) => {
          const loadedTrips: TripDestination[] = [];
          snapshot.forEach((docSnap) => {
            loadedTrips.push({ ...docSnap.data(), id: docSnap.id } as TripDestination);
          });
          setFamilyTrips(loadedTrips);
          localStorage.setItem(FAMILY_TRIPS_STORAGE_KEY, JSON.stringify(loadedTrips));
        }, (err) => {
          console.error('Firestore family trips subscription error:', err);
        });

        // Subscribe to user media backlog in Firestore
        const qMedia = query(collection(db, 'media_backlog'), where('userId', '==', currentUser.uid));
        const unsubMedia = onSnapshot(qMedia, (snapshot) => {
          const loadedMedia: MediaBacklogItem[] = [];
          snapshot.forEach((docSnap) => {
            loadedMedia.push({ ...docSnap.data(), id: docSnap.id } as MediaBacklogItem);
          });
          setMediaBacklog(loadedMedia);
          localStorage.setItem(MEDIA_BACKLOG_STORAGE_KEY, JSON.stringify(loadedMedia));
        }, (err) => {
          console.error('Firestore media backlog subscription error:', err);
        });

        // Subscribe to user game backlog in Firestore
        const qGames = query(collection(db, 'game_backlog'), where('userId', '==', currentUser.uid));
        const unsubGames = onSnapshot(qGames, (snapshot) => {
          const loadedGames: GameBacklogItem[] = [];
          snapshot.forEach((docSnap) => {
            loadedGames.push({ ...docSnap.data(), id: docSnap.id } as GameBacklogItem);
          });
          setGameBacklog(loadedGames);
          localStorage.setItem(GAME_BACKLOG_STORAGE_KEY, JSON.stringify(loadedGames));
        }, (err) => {
          console.error('Firestore game backlog subscription error:', err);
        });

        // Subscribe to user media reviews in Firestore
        const qReviews = query(collection(db, 'media_reviews'), where('userId', '==', currentUser.uid));
        const unsubReviews = onSnapshot(qReviews, (snapshot) => {
          const loadedReviews: MediaReviewItem[] = [];
          snapshot.forEach((docSnap) => {
            loadedReviews.push({ ...docSnap.data(), id: docSnap.id } as MediaReviewItem);
          });
          setMediaReviews(loadedReviews);
          localStorage.setItem(MEDIA_REVIEWS_STORAGE_KEY, JSON.stringify(loadedReviews));
        }, (err) => {
          console.error('Firestore media reviews subscription error:', err);
        });

        // Subscribe to user monthly bills in Firestore
        const qBills = query(collection(db, 'monthly_bills'), where('userId', '==', currentUser.uid));
        const unsubBills = onSnapshot(qBills, (snapshot) => {
          if (localStorage.getItem('lifeflow_finances_cleared') === 'true' || localStorage.getItem('lifeflow_bills_cleared') === 'true') {
            setMonthlyBills([]);
            return;
          }
          const loadedBills: MonthlyBillItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const rawId = (data as any).id || docSnap.id;
            if (!deletedItemIdsRef.current.has(docSnap.id) && !deletedItemIdsRef.current.has(rawId)) {
              loadedBills.push({ ...data, id: docSnap.id, monthKey: data.monthKey || '2026-09' } as MonthlyBillItem);
            }
          });
          loadedBills.sort((a, b) => a.dueDay - b.dueDay);
          setMonthlyBills(loadedBills);
          localStorage.setItem(MONTHLY_BILLS_STORAGE_KEY, JSON.stringify(loadedBills));
        }, (err) => {
          console.error('Firestore monthly bills subscription error:', err);
        });

        // Subscribe to user monthly incomes in Firestore
        const qIncomes = query(collection(db, 'monthly_incomes'), where('userId', '==', currentUser.uid));
        const unsubIncomes = onSnapshot(qIncomes, (snapshot) => {
          if (localStorage.getItem('lifeflow_finances_cleared') === 'true' || localStorage.getItem('lifeflow_incomes_cleared') === 'true') {
            setMonthlyIncomes([]);
            return;
          }
          const loadedIncomes: MonthlyIncomeItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const rawId = (data as any).id || docSnap.id;
            if (!deletedItemIdsRef.current.has(docSnap.id) && !deletedItemIdsRef.current.has(rawId)) {
              loadedIncomes.push({ ...data, id: docSnap.id, monthKey: data.monthKey || '2026-09' } as MonthlyIncomeItem);
            }
          });
          loadedIncomes.sort((a, b) => (a.dayOfMonth || 15) - (b.dayOfMonth || 15));
          setMonthlyIncomes(loadedIncomes);
          localStorage.setItem(MONTHLY_INCOMES_STORAGE_KEY, JSON.stringify(loadedIncomes));
        }, (err) => {
          console.error('Firestore monthly incomes subscription error:', err);
        });

        // Subscribe to user monthly extra expenses in Firestore
        const qExtras = query(collection(db, 'monthly_extra_expenses'), where('userId', '==', currentUser.uid));
        const unsubExtras = onSnapshot(qExtras, (snapshot) => {
          if (localStorage.getItem('lifeflow_finances_cleared') === 'true' || localStorage.getItem('lifeflow_extra_expenses_cleared') === 'true') {
            setMonthlyExtraExpenses([]);
            return;
          }
          const loadedExtras: MonthlyExtraExpenseItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const rawId = (data as any).id || docSnap.id;
            const nameKey = data.name ? `name:${String(data.name).toLowerCase().trim()}` : '';
            if (
              !deletedItemIdsRef.current.has(docSnap.id) &&
              !deletedItemIdsRef.current.has(rawId) &&
              (!nameKey || !deletedItemIdsRef.current.has(nameKey))
            ) {
              loadedExtras.push({ ...data, id: docSnap.id, monthKey: data.monthKey || '2026-09' } as MonthlyExtraExpenseItem);
            }
          });
          loadedExtras.sort((a, b) => (a.dayOfMonth || 15) - (b.dayOfMonth || 15));
          setMonthlyExtraExpenses(loadedExtras);
          localStorage.setItem(MONTHLY_EXTRA_EXPENSES_STORAGE_KEY, JSON.stringify(loadedExtras));
        }, (err) => {
          console.error('Firestore monthly extra expenses subscription error:', err);
        });

        // Subscribe to user debts in Firestore
        const qDebts = query(collection(db, 'debts'), where('userId', '==', currentUser.uid));
        const unsubDebts = onSnapshot(qDebts, (snapshot) => {
          if (localStorage.getItem('lifeflow_finances_cleared') === 'true' || localStorage.getItem('lifeflow_debts_cleared') === 'true') {
            setDebts([]);
            return;
          }
          const loadedDebts: DebtItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const rawId = (data as any).id || docSnap.id;
            if (!deletedItemIdsRef.current.has(docSnap.id) && !deletedItemIdsRef.current.has(rawId)) {
              loadedDebts.push({ ...data, id: docSnap.id } as DebtItem);
            }
          });
          setDebts(loadedDebts);
          localStorage.setItem(DEBTS_STORAGE_KEY, JSON.stringify(loadedDebts));
        }, (err) => {
          console.error('Firestore debts subscription error:', err);
        });

        // Subscribe to user books in Firestore
        const qBooks = query(collection(db, 'books'), where('userId', '==', currentUser.uid));
        const unsubBooks = onSnapshot(qBooks, (snapshot) => {
          const loadedBooks: BookItem[] = [];
          snapshot.forEach((docSnap) => {
            loadedBooks.push({ ...docSnap.data(), id: docSnap.id } as BookItem);
          });
          setBooks(loadedBooks);
          localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(loadedBooks));
        }, (err) => {
          console.error('Firestore books subscription error:', err);
        });

        // Subscribe to user reading quotes in Firestore
        const qQuotes = query(collection(db, 'reading_quotes'), where('userId', '==', currentUser.uid));
        const unsubQuotes = onSnapshot(qQuotes, (snapshot) => {
          const loadedQuotes: ReadingQuote[] = [];
          snapshot.forEach((docSnap) => {
            loadedQuotes.push({ ...docSnap.data(), id: docSnap.id } as ReadingQuote);
          });
          setReadingQuotes(loadedQuotes);
          localStorage.setItem(READING_QUOTES_STORAGE_KEY, JSON.stringify(loadedQuotes));
        }, (err) => {
          console.error('Firestore reading quotes subscription error:', err);
        });

        // Subscribe to user smart purchases in Firestore
        const qPurchases = query(collection(db, 'smart_purchases'), where('userId', '==', currentUser.uid));
        const unsubPurchases = onSnapshot(qPurchases, (snapshot) => {
          const loadedPurchases: SmartPurchaseGoal[] = [];
          snapshot.forEach((docSnap) => {
            loadedPurchases.push({ ...docSnap.data(), id: docSnap.id } as SmartPurchaseGoal);
          });
          setSmartPurchases(loadedPurchases);
          localStorage.setItem(SMART_PURCHASES_STORAGE_KEY, JSON.stringify(loadedPurchases));
        }, (err) => {
          console.error('Firestore smart purchases subscription error:', err);
        });

        return () => {
          unsubTasks();
          unsubIdeas();
          unsubHabits();
          unsubHealthProfile();
          unsubWeightLogs();
          unsubCalorieLogs();
          unsubVehicles();
          unsubMaintenances();
          unsubAppointments();
          unsubExamNotes();
          unsubTrips();
          unsubMedia();
          unsubGames();
          unsubReviews();
          unsubBills();
          unsubIncomes();
          unsubExtras();
          unsubDebts();
          unsubBooks();
          unsubQuotes();
          unsubPurchases();
        };
      } else {
        // Fallback to local storage
        try {
          const savedTasks = localStorage.getItem(STORAGE_KEY);
          if (savedTasks !== null) {
            const parsed = JSON.parse(savedTasks);
            if (Array.isArray(parsed)) setTasks(parsed);
          }

          const savedIdeas = localStorage.getItem(IDEAS_STORAGE_KEY);
          if (savedIdeas !== null) {
            const parsed = JSON.parse(savedIdeas);
            if (Array.isArray(parsed)) setIdeas(parsed);
          }

          const savedHabits = localStorage.getItem(HABITS_STORAGE_KEY);
          if (savedHabits !== null) {
            const parsed = JSON.parse(savedHabits);
            if (Array.isArray(parsed)) setHabits(parsed);
          }

          const savedProfile = localStorage.getItem(HEALTH_PROFILE_STORAGE_KEY);
          if (savedProfile !== null) {
            const parsed = JSON.parse(savedProfile);
            if (parsed && typeof parsed === 'object') setHealthProfile(parsed);
          }

          const savedLogs = localStorage.getItem(WEIGHT_LOGS_STORAGE_KEY);
          if (savedLogs !== null) {
            const parsed = JSON.parse(savedLogs);
            if (Array.isArray(parsed)) setWeightLogs(parsed);
          }

          const savedCalorieLogs = localStorage.getItem(DAILY_CALORIE_LOGS_STORAGE_KEY);
          if (savedCalorieLogs !== null) {
            const parsed = JSON.parse(savedCalorieLogs);
            if (Array.isArray(parsed)) setCalorieLogs(parsed);
          }

          const savedVehicles = localStorage.getItem(VEHICLES_STORAGE_KEY);
          if (savedVehicles !== null) {
            const parsed = JSON.parse(savedVehicles);
            if (Array.isArray(parsed)) setVehicles(parsed);
          }

          const savedMaintenances = localStorage.getItem(VEHICLE_MAINTENANCE_STORAGE_KEY);
          if (savedMaintenances !== null) {
            const parsed = JSON.parse(savedMaintenances);
            if (Array.isArray(parsed)) setVehicleMaintenances(parsed);
          }

          const savedAppointments = localStorage.getItem(MEDICAL_APPOINTMENTS_STORAGE_KEY);
          if (savedAppointments !== null) {
            const parsed = JSON.parse(savedAppointments);
            if (Array.isArray(parsed)) setMedicalAppointments(parsed);
          }

          const savedExamNotes = localStorage.getItem(MEDICAL_EXAM_NOTES_STORAGE_KEY);
          if (savedExamNotes !== null) {
            const parsed = JSON.parse(savedExamNotes);
            if (Array.isArray(parsed)) setMedicalExamNotes(parsed);
          }

          const savedTrips = localStorage.getItem(FAMILY_TRIPS_STORAGE_KEY);
          if (savedTrips !== null) {
            const parsed = JSON.parse(savedTrips);
            if (Array.isArray(parsed)) setFamilyTrips(parsed);
          }

          const savedMedia = localStorage.getItem(MEDIA_BACKLOG_STORAGE_KEY);
          if (savedMedia !== null) {
            const parsed = JSON.parse(savedMedia);
            if (Array.isArray(parsed)) setMediaBacklog(parsed);
          }

          const savedGames = localStorage.getItem(GAME_BACKLOG_STORAGE_KEY);
          if (savedGames !== null) {
            const parsed = JSON.parse(savedGames);
            if (Array.isArray(parsed)) setGameBacklog(parsed);
          }

          const savedReviews = localStorage.getItem(MEDIA_REVIEWS_STORAGE_KEY);
          if (savedReviews !== null) {
            const parsed = JSON.parse(savedReviews);
            if (Array.isArray(parsed)) setMediaReviews(parsed);
          }

          if (localStorage.getItem('lifeflow_finances_cleared') === 'true') {
            setMonthlyBills([]);
            setMonthlyIncomes([]);
            setMonthlyExtraExpenses([]);
            setDebts([]);
          } else {
            if (localStorage.getItem('lifeflow_bills_cleared') === 'true') {
              setMonthlyBills([]);
            } else {
              const savedBills = localStorage.getItem(MONTHLY_BILLS_STORAGE_KEY);
              if (savedBills !== null) {
                const parsed = JSON.parse(savedBills);
                if (Array.isArray(parsed)) setMonthlyBills(parsed.filter((b: any) => !deletedItemIdsRef.current.has(b.id)));
              }
            }

            if (localStorage.getItem('lifeflow_incomes_cleared') === 'true') {
              setMonthlyIncomes([]);
            } else {
              const savedIncomes = localStorage.getItem(MONTHLY_INCOMES_STORAGE_KEY);
              if (savedIncomes !== null) {
                const parsed = JSON.parse(savedIncomes);
                if (Array.isArray(parsed)) setMonthlyIncomes(parsed.filter((i: any) => !deletedItemIdsRef.current.has(i.id)));
              }
            }

            if (localStorage.getItem('lifeflow_extra_expenses_cleared') === 'true') {
              setMonthlyExtraExpenses([]);
            } else {
              const savedExtras = localStorage.getItem(MONTHLY_EXTRA_EXPENSES_STORAGE_KEY);
              if (savedExtras !== null) {
                const parsed = JSON.parse(savedExtras);
                if (Array.isArray(parsed)) {
                  setMonthlyExtraExpenses(parsed.filter((e: any) => {
                    const nameKey = e.name ? `name:${String(e.name).toLowerCase().trim()}` : '';
                    return !deletedItemIdsRef.current.has(e.id) && (!nameKey || !deletedItemIdsRef.current.has(nameKey));
                  }));
                }
              }
            }

            if (localStorage.getItem('lifeflow_debts_cleared') === 'true') {
              setDebts([]);
            } else {
              const savedDebts = localStorage.getItem(DEBTS_STORAGE_KEY);
              if (savedDebts !== null) {
                const parsed = JSON.parse(savedDebts);
                if (Array.isArray(parsed)) setDebts(parsed.filter((d: any) => !deletedItemIdsRef.current.has(d.id)));
              }
            }
          }

          const savedBooks = localStorage.getItem(BOOKS_STORAGE_KEY);
          if (savedBooks !== null) {
            const parsed = JSON.parse(savedBooks);
            if (Array.isArray(parsed)) setBooks(parsed);
          }

          const savedQuotes = localStorage.getItem(READING_QUOTES_STORAGE_KEY);
          if (savedQuotes !== null) {
            const parsed = JSON.parse(savedQuotes);
            if (Array.isArray(parsed)) setReadingQuotes(parsed);
          }

          const savedPurchases = localStorage.getItem(SMART_PURCHASES_STORAGE_KEY);
          if (savedPurchases !== null) {
            const parsed = JSON.parse(savedPurchases);
            if (Array.isArray(parsed)) setSmartPurchases(parsed);
          }
        } catch (e) {
          console.error('Error reading localStorage on signout:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Periodic check for 22:00 night habit reminder (2 hours before end of day in user timezone)
  useEffect(() => {
    checkAndTriggerNightHabitNotification(habits);
    const habitTimer = setInterval(() => {
      checkAndTriggerNightHabitNotification(habits);
    }, 60000);
    return () => clearInterval(habitTimer);
  }, [habits]);

  // Register Service Worker for Web Push and browser notifications on mount
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Periodic Web Push & in-browser notification alert evaluation for upcoming tasks and timed habits
  useEffect(() => {
    // Initial evaluation
    evaluateUpcomingAlerts(tasks, habits);

    // Evaluate every 60 seconds against current time windows
    const alertInterval = setInterval(() => {
      evaluateUpcomingAlerts(tasks, habits);
    }, 60000);

    return () => clearInterval(alertInterval);
  }, [tasks, habits]);

  // Poll server webhook incoming ideas queue and Telegram task completions to auto-sync with the UI
  useEffect(() => {
    const pollWebhookIdeas = async () => {
      try {
        const url = user ? `/api/webhook/incoming?userId=${encodeURIComponent(user.uid)}` : '/api/webhook/incoming';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.ideas) && data.ideas.length > 0) {
            const addedIdeaIds: string[] = [];
            const newMediaToAdd: MediaBacklogItem[] = [];
            const newGamesToAdd: GameBacklogItem[] = [];
            const newBooksToAdd: BookItem[] = [];
            const newTasksFromIdeas: Task[] = [];

            // Merge any webhook ideas not currently in list and not marked as deleted
            setIdeas((prev) => {
              const existingIds = new Set(prev.map(i => i.id));
              const toAdd: IdeaItem[] = [];
              for (const incoming of data.ideas) {
                if (!existingIds.has(incoming.id) && !deletedItemIdsRef.current.has(incoming.id)) {
                  const isFinancialOrInvoice = incoming.categoryId === 'finanzas_hogar' || 
                    incoming.type === 'gasto_adicional' || 
                    incoming.type === 'factura' || 
                    incoming.type === 'recibo';

                  const isBook = !isFinancialOrInvoice && (
                    incoming.categoryId === 'aprendizaje' ||
                    incoming.categoryId === 'aprendizaje_habilidades' ||
                    incoming.type === 'libro' ||
                    !!incoming.author ||
                    /\b(libro|books|lectura|autor|autora|editorial|título del libro|paginas|capítulo)\b/i.test(incoming.title || '') ||
                    /\b(libro|books|lectura|autor|autora|editorial|título del libro|paginas|capítulo)\b/i.test(incoming.description || '')
                  );

                  const isEntertainment = !isFinancialOrInvoice && !isBook && (
                    incoming.categoryId === 'ocio_entretenimiento' ||
                    incoming.type === 'pelicula' ||
                    incoming.type === 'serie' ||
                    incoming.type === 'anime' ||
                    incoming.type === 'videojuego' ||
                    /\b(serie|series|capitul|temporada|episodio|pelicul|película|peliculas|películas|cine|film|netflix|apple tv|prime video|disney|hbo|crunchyroll|videojueg|video juego|videojuegos|playstation|ps5|ps4|xbox|nintendo|switch|steam|anime|manga)\b/i.test(incoming.title || '') ||
                    /\b(serie|series|capitul|temporada|episodio|pelicul|película|peliculas|películas|cine|film|netflix|apple tv|prime video|disney|hbo|crunchyroll|videojueg|video juego|videojuegos|playstation|ps5|ps4|xbox|nintendo|switch|steam|anime|manga)\b/i.test(incoming.description || '')
                  );

                  const assignedType = incoming.type || (isBook ? 'libro' : isEntertainment ? (incoming.title?.toLowerCase().includes('serie') ? 'serie' : 'pelicula') : 'idea');

                  const ideaRecord: IdeaItem = {
                    id: incoming.id,
                    categoryId: isBook ? 'aprendizaje' : isEntertainment ? 'ocio_entretenimiento' : (incoming.categoryId || 'actividades_pendientes'),
                    title: incoming.title || 'Nueva Idea',
                    description: incoming.description || '',
                    type: assignedType,
                    createdAt: incoming.createdAt || new Date().toISOString().split('T')[0],
                    userId: user ? user.uid : undefined,
                  };

                  toAdd.push(ideaRecord);
                  addedIdeaIds.push(incoming.id);

                  // If this item is an actionable task / pendiente, only bridge if NOT already handled as a direct task
                  const isActionPending = !incoming.isDirectTask && (
                    incoming.type === 'pendiente' || 
                    incoming.type === 'tarea' || 
                    incoming.type === 'recordatorio'
                  );

                  const isAlreadyInTasks = isActionPending && (
                    (data.tasks && data.tasks.some((t: any) => {
                      const tTitle = (t.title || '').toLowerCase().trim();
                      const inTitle = (incoming.title || '').toLowerCase().trim();
                      return tTitle === inTitle || (tTitle.length > 5 && inTitle.includes(tTitle));
                    })) ||
                    tasks.some(t => {
                      const tTitle = (t.title || '').toLowerCase().trim();
                      const inTitle = (incoming.title || '').toLowerCase().trim();
                      return tTitle === inTitle || (tTitle.length > 5 && inTitle.includes(tTitle));
                    })
                  );

                  if (isActionPending && !isAlreadyInTasks) {
                    newTasksFromIdeas.push({
                      id: `task-from-idea-${incoming.id}`,
                      title: incoming.title || 'Nuevo Pendiente',
                      description: incoming.description || '',
                      category: incoming.categoryId || 'actividades_pendientes',
                      priority: 'media',
                      status: 'pendiente',
                      estimatedHours: Number(incoming.estimatedHours) || 1,
                      completedHours: 0,
                      dailyHours: 1,
                      assignedDate: incoming.assignedDate || new Date().toISOString().split('T')[0],
                      dueDate: incoming.dueDate || incoming.assignedDate || new Date().toISOString().split('T')[0],
                      timeSlot: incoming.timeSlot || '11:00',
                      finalGoal: 'Completar actividad pendiente',
                      tags: ['pendiente', 'telegram'],
                      subgoals: [],
                      createdAt: incoming.createdAt || new Date().toISOString().split('T')[0],
                      updatedAt: new Date().toISOString().split('T')[0],
                    });
                  }

                  // If book, auto-register in books library
                  if (isBook) {
                    newBooksToAdd.push({
                      id: `book-${incoming.id}`,
                      userId: user ? user.uid : undefined,
                      title: incoming.title || 'Nuevo Libro',
                      author: incoming.author || 'Autor por definir',
                      category: (incoming.bookCategory as any) || 'desarrollo_personal',
                      status: 'por_leer',
                      format: 'fisico',
                      currentPage: 0,
                      totalPages: Number(incoming.totalPages) || 250,
                      summary: incoming.description || 'Importado desde Visión IA / Telegram',
                      tags: ['Lectura', 'Libro'],
                      createdAt: incoming.createdAt || new Date().toISOString().split('T')[0],
                      updatedAt: new Date().toISOString().split('T')[0],
                    });
                  }

                  // If entertainment, also auto-register in mediaBacklog or gameBacklog
                  if (isEntertainment) {
                    if (assignedType === 'videojuego' || incoming.title?.toLowerCase().includes('juego') || incoming.title?.toLowerCase().includes('game')) {
                      newGamesToAdd.push({
                        id: `game-${incoming.id}`,
                        userId: user ? user.uid : undefined,
                        title: incoming.title || 'Nuevo Videojuego',
                        platform: incoming.platform || 'PC / Consola',
                        genre: incoming.genre || 'General',
                        status: 'pendiente',
                        priority: 'media',
                        notes: incoming.description || 'Importado desde Visión IA / Telegram',
                        coverEmoji: '🎮',
                        createdAt: incoming.createdAt || new Date().toISOString().split('T')[0],
                        updatedAt: new Date().toISOString().split('T')[0],
                      });
                    } else {
                      const mediaTypeVal: MediaType = assignedType === 'serie' ? 'serie' : assignedType === 'anime' ? 'anime' : 'pelicula';
                      newMediaToAdd.push({
                        id: `media-${incoming.id}`,
                        userId: user ? user.uid : undefined,
                        title: incoming.title || 'Nueva Película / Serie',
                        type: mediaTypeVal,
                        platform: incoming.platform || 'Streaming / Cine',
                        genre: incoming.genre || 'General',
                        status: 'pendiente',
                        priority: 'media',
                        releaseYear: incoming.releaseYear || undefined,
                        notes: incoming.description || 'Importado desde foto en Telegram / Visión IA',
                        coverEmoji: mediaTypeVal === 'pelicula' ? '🎬' : mediaTypeVal === 'serie' ? '📺' : '🎌',
                        createdAt: incoming.createdAt || new Date().toISOString().split('T')[0],
                        updatedAt: new Date().toISOString().split('T')[0],
                      });
                    }
                  }
                }
              }
              if (toAdd.length > 0) {
                if (user) {
                  for (const newIdea of toAdd) {
                    setDoc(doc(db, 'ideas', newIdea.id), { ...newIdea, userId: user.uid }).catch(console.error);
                  }
                }
                const updatedList = [...toAdd, ...prev];
                try {
                  localStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify(updatedList));
                } catch {}
                return updatedList;
              }
              return prev;
            });

            // If new books detected, add to books library
            if (newBooksToAdd.length > 0) {
              setBooks((prevBooks) => {
                const existingBookTitles = new Set(prevBooks.map(b => b.title.toLowerCase().trim()));
                const filteredNewBooks = newBooksToAdd.filter(b => !existingBookTitles.has(b.title.toLowerCase().trim()));
                if (filteredNewBooks.length === 0) return prevBooks;

                if (user) {
                  for (const item of filteredNewBooks) {
                    setDoc(doc(db, 'books', item.id), { ...item, userId: user.uid }).catch(console.error);
                  }
                }
                const updatedBooks = [...filteredNewBooks, ...prevBooks];
                try {
                  localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(updatedBooks));
                } catch {}

                // Trigger announcement toast
                const firstBook = filteredNewBooks[0];
                setIdeaAnnouncement({
                  id: firstBook.id,
                  title: `📚 Libro: ${firstBook.title}`,
                  readableCategory: 'Aprendizaje & Biblioteca (Por Leer)',
                  categoryEmoji: '📖',
                  spokenMessage: `Se ha guardado "${firstBook.title}" en tu biblioteca de libros por leer en LifeBlocks.`,
                });

                return updatedBooks;
              });
            }

            // If new media items detected, add to mediaBacklog
            if (newMediaToAdd.length > 0) {
              setMediaBacklog((prevMedia) => {
                const existingMediaTitles = new Set(prevMedia.map(m => m.title.toLowerCase().trim()));
                const filteredNew = newMediaToAdd.filter(m => !existingMediaTitles.has(m.title.toLowerCase().trim()));
                if (filteredNew.length === 0) return prevMedia;

                if (user) {
                  for (const item of filteredNew) {
                    setDoc(doc(db, 'media_backlog', item.id), { ...item, userId: user.uid }).catch(console.error);
                  }
                }
                const updatedMedia = [...filteredNew, ...prevMedia];
                try {
                  localStorage.setItem(MEDIA_BACKLOG_STORAGE_KEY, JSON.stringify(updatedMedia));
                } catch {}

                // Trigger announcement toast
                const firstMedia = filteredNew[0];
                setIdeaAnnouncement({
                  id: firstMedia.id,
                  title: `🎬 ${firstMedia.type === 'serie' ? 'Serie' : 'Película'}: ${firstMedia.title}`,
                  readableCategory: 'Ocio & Entretenimiento (Por Ver)',
                  categoryEmoji: firstMedia.type === 'serie' ? '📺' : '🎬',
                  spokenMessage: `Se ha guardado "${firstMedia.title}" en tu lista de Películas y Series por ver en LifeBlocks.`,
                });

                return updatedMedia;
              });
            }

            // If new games detected, add to gameBacklog
            if (newGamesToAdd.length > 0) {
              setGameBacklog((prevGames) => {
                const existingGameTitles = new Set(prevGames.map(g => g.title.toLowerCase().trim()));
                const filteredNewGames = newGamesToAdd.filter(g => !existingGameTitles.has(g.title.toLowerCase().trim()));
                if (filteredNewGames.length === 0) return prevGames;

                if (user) {
                  for (const item of filteredNewGames) {
                    setDoc(doc(db, 'game_backlog', item.id), { ...item, userId: user.uid }).catch(console.error);
                  }
                }
                const updatedGames = [...filteredNewGames, ...prevGames];
                try {
                  localStorage.setItem(GAME_BACKLOG_STORAGE_KEY, JSON.stringify(updatedGames));
                } catch {}
                return updatedGames;
              });
            }

            // If actionable tasks were extracted from ideas, merge them into the calendar tasks immediately
            if (newTasksFromIdeas.length > 0) {
              setTasks((prevTasks) => {
                const existingTaskIds = new Set(prevTasks.map(t => t.id));
                const filteredTasksToAdd = newTasksFromIdeas.filter(t => !existingTaskIds.has(t.id));
                if (filteredTasksToAdd.length === 0) return prevTasks;

                // Auto-sync bridged idea tasks directly to user's Google Calendar with native 10-minute alarm
                const gcalToken = getGoogleCalendarToken();
                if (gcalToken) {
                  for (const ideaTask of filteredTasksToAdd) {
                    if (ideaTask.assignedDate) {
                      syncSingleTaskToGoogleCalendar(gcalToken, ideaTask).catch((err) => {
                        console.warn('[Auto-GCal] Sync failed for idea-task:', ideaTask.title, err);
                      });
                    }
                  }
                }

                if (user) {
                  for (const item of filteredTasksToAdd) {
                    setDoc(doc(db, 'tasks', item.id), sanitizeForFirestore({ ...item, userId: user.uid })).catch(console.error);
                  }
                }
                const updatedTasks = [...filteredTasksToAdd, ...prevTasks];
                try {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
                  localStorage.removeItem('lifeflow_tasks_cleared');
                } catch {}
                return updatedTasks;
              });
            }

            // Acknowledge all ideas from the server queue so they are not re-sent
            const allIncomingIdeaIds = data.ideas.map((i: any) => i.id).filter(Boolean);
            if (allIncomingIdeaIds.length > 0) {
              fetch('/api/webhook/acknowledge-ideas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ideaIds: allIncomingIdeaIds }),
              }).catch(() => {});
            }
          }

          // Merge any scheduled direct tasks received from Telegram / Assistant into the Calendar
          if (data.success && Array.isArray(data.tasks) && data.tasks.length > 0) {
            const addedTaskIds: string[] = [];
            setTasks((prev) => {
              const existingIds = new Set(prev.map(t => t.id));
              const existingKeys = new Set(prev.map(t => {
                const clean = (t.title || '')
                  .toLowerCase()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .replace(/^(programar\s+para\s+el\s+d[ií]a\s+de\s+hoy\s+a\s+las\s+\d{1,2}(:\d{2})?\s+|para\s+el\s+d[ií]a\s+de\s+hoy\s+a\s+las\s+\d{1,2}(:\d{2})?\s+|recuerdame\s+|recordatorio:\s*|tarea:\s*|agregar\s+a\s+actividad\s+pendiente\s+)/i, '')
                  .replace(/[^\w\s]/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim();
                return `${clean}|${t.assignedDate || ''}|${t.timeSlot || ''}`;
              }));

              const toAddTasks: Task[] = [];
              for (const incomingTask of data.tasks) {
                const cleanIncoming = (incomingTask.title || '')
                  .toLowerCase()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .replace(/^(programar\s+para\s+el\s+d[ií]a\s+de\s+hoy\s+a\s+las\s+\d{1,2}(:\d{2})?\s+|para\s+el\s+d[ií]a\s+de\s+hoy\s+a\s+las\s+\d{1,2}(:\d{2})?\s+|recuerdame\s+|recordatorio:\s*|tarea:\s*|agregar\s+a\s+actividad\s+pendiente\s+)/i, '')
                  .replace(/[^\w\s]/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim();
                const incomingKey = `${cleanIncoming}|${incomingTask.assignedDate || ''}|${incomingTask.timeSlot || ''}`;

                if (!existingIds.has(incomingTask.id) && !existingKeys.has(incomingKey) && !deletedItemIdsRef.current.has(incomingTask.id)) {
                  const isEntertainmentTask = /\b(serie|series|capitul|temporada|episodio|pelicul|película|peliculas|películas|cine|film|netflix|apple tv|prime video|disney|hbo|crunchyroll|videojueg|video juego|videojuegos|playstation|ps5|ps4|xbox|nintendo|switch|steam|anime|manga)\b/i.test(incomingTask.title || '') ||
                    /\b(serie|series|capitul|temporada|episodio|pelicul|película|peliculas|películas|cine|film|netflix|apple tv|prime video|disney|hbo|crunchyroll|videojueg|video juego|videojuegos|playstation|ps5|ps4|xbox|nintendo|switch|steam|anime|manga)\b/i.test(incomingTask.description || '') ||
                    (incomingTask.rawText && /\b(serie|series|capitul|temporada|episodio|pelicul|película|peliculas|películas|cine|film|netflix|apple tv|prime video|disney|hbo|crunchyroll|videojueg|video juego|videojuegos|playstation|ps5|ps4|xbox|nintendo|switch|steam|anime|manga)\b/i.test(incomingTask.rawText));

                  const assignedCategory = isEntertainmentTask ? 'ocio_entretenimiento' : (incomingTask.category || 'actividades_pendientes');

                  toAddTasks.push({
                    id: incomingTask.id,
                    title: incomingTask.title || 'Nuevo Compromiso',
                    description: incomingTask.description || '',
                    category: assignedCategory,
                    priority: 'media',
                    status: 'pendiente',
                    estimatedHours: incomingTask.estimatedHours || 1,
                    completedHours: 0,
                    dailyHours: 1,
                    assignedDate: incomingTask.assignedDate || new Date().toISOString().split('T')[0],
                    dueDate: incomingTask.dueDate || incomingTask.assignedDate || new Date().toISOString().split('T')[0],
                    timeSlot: incomingTask.timeSlot || '11:30',
                    finalGoal: isEntertainmentTask ? 'Ver capítulos y disfrutar de la serie' : (incomingTask.finalGoal || 'Completar compromiso'),
                    tags: [incomingTask.type || (isEntertainmentTask ? 'serie' : 'recordatorio')],
                    subgoals: [],
                    gcalSynced: Boolean(incomingTask.gcalSynced),
                    gcalEventId: incomingTask.gcalEventId,
                    createdAt: incomingTask.createdAt || new Date().toISOString().split('T')[0],
                    updatedAt: new Date().toISOString().split('T')[0],
                  });
                  addedTaskIds.push(incomingTask.id);
                  existingKeys.add(incomingKey);
                }
              }
              if (toAddTasks.length > 0) {
                // Auto-sync incoming bot tasks directly to user's Google Calendar with native 10-minute alarm if not already synced by server
                const gcalToken = getGoogleCalendarToken();
                if (gcalToken) {
                  for (const incomingBotTask of toAddTasks) {
                    if (incomingBotTask.assignedDate && !incomingBotTask.gcalSynced) {
                      syncSingleTaskToGoogleCalendar(gcalToken, incomingBotTask)
                        .then((createdEvents) => {
                          if (createdEvents && createdEvents.length > 0) {
                            setTasks((curr) => {
                              const updated = curr.map((t) => t.id === incomingBotTask.id ? { ...t, gcalSynced: true, gcalEventId: createdEvents[0]?.id } : t);
                              try {
                                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                              } catch {}
                              return updated;
                            });
                          }
                        })
                        .catch((err) => {
                          console.warn('[Auto-GCal] Sync failed for bot task:', incomingBotTask.title, err);
                        });
                    }
                  }
                }

                if (user) {
                  for (const newTask of toAddTasks) {
                    setDoc(doc(db, 'tasks', newTask.id), sanitizeForFirestore({ ...newTask, userId: user.uid })).catch(console.error);
                  }
                }
                const merged = [...toAddTasks, ...prev];
                const { cleaned: finalUpdatedList } = deduplicateTasksList(merged);
                try {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(finalUpdatedList));
                } catch {}

                // Trigger announcement banner so user sees immediate confirmation in the app
                const firstTask = toAddTasks[0];
                if (firstTask) {
                  setIdeaAnnouncement({
                    id: firstTask.id,
                    title: `📅 ${firstTask.title}`,
                    readableCategory: firstTask.category || 'Calendario & Tareas',
                    categoryEmoji: '🗓️',
                    spokenMessage: `Se ha agendado "${firstTask.title}" en tu Calendario.`,
                  });
                }

                return finalUpdatedList;
              }
              return prev;
            });

            // Acknowledge all tasks from server queue so they are purged
            const allIncomingTaskIds = data.tasks.map((t: any) => t.id).filter(Boolean);
            if (allIncomingTaskIds.length > 0) {
              fetch('/api/webhook/acknowledge-tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskIds: allIncomingTaskIds }),
              }).catch(() => {});
            }
          }

          // Check for completed task events received from Telegram
          if (data.success && Array.isArray(data.taskCompletions) && data.taskCompletions.length > 0) {
            const completedEventIds: string[] = [];
            for (const completion of data.taskCompletions) {
              completedEventIds.push(completion.id);
              if (completion.status === 'completada' && completion.taskTitle) {
                const targetTitle = completion.taskTitle.toLowerCase().trim();
                setTasks(prevTasks => {
                  return prevTasks.map(t => {
                    const matchId = completion.taskId && t.id === completion.taskId;
                    const matchTitle = t.title.toLowerCase().trim().includes(targetTitle) || targetTitle.includes(t.title.toLowerCase().trim());
                    if ((matchId || matchTitle) && t.status !== 'completada') {
                      const updated = {
                        ...t,
                        status: 'completada' as const,
                        completedHours: t.estimatedHours || 1,
                        updatedAt: new Date().toISOString().split('T')[0],
                      };
                      if (user) {
                        setDoc(doc(db, 'tasks', t.id), { ...updated, userId: user.uid }, { merge: true }).catch(console.error);
                      }
                      return updated;
                    }
                    return t;
                  });
                });
              }
            }

            if (completedEventIds.length > 0) {
              fetch('/api/webhook/acknowledge-task-completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventIds: completedEventIds }),
              }).catch(() => {});
            }
          }

          // Check for completed habit events received from Telegram
          if (data.success && Array.isArray(data.habitCompletions) && data.habitCompletions.length > 0) {
            const completedHabitEventIds: string[] = [];
            const todayStr = new Date().toISOString().split('T')[0];

            for (const hComp of data.habitCompletions) {
              completedHabitEventIds.push(hComp.id);
              const targetHabitId = hComp.habitId;
              const targetTitle = (hComp.habitTitle || '').toLowerCase().trim();
              const dateToMark = hComp.completedDate || todayStr;

              setHabits(prevHabits => {
                let changed = false;
                const updatedList = prevHabits.map(h => {
                  const matchId = targetHabitId && h.id === targetHabitId;
                  const matchTitle = targetTitle && (h.title.toLowerCase().trim().includes(targetTitle) || targetTitle.includes(h.title.toLowerCase().trim()));
                  if (matchId || matchTitle) {
                    const currentDates = Array.isArray(h.completedDates) ? [...h.completedDates] : [];
                    if (!currentDates.includes(dateToMark)) {
                      changed = true;
                      const newDates = [...currentDates, dateToMark];
                      const streakInfo = calculateHabitStreak(newDates);
                      const updatedHabit = {
                        ...h,
                        completedDates: newDates,
                        streak: streakInfo.streak,
                        bestStreak: Math.max(h.bestStreak || 0, streakInfo.bestStreak),
                      };
                      if (user) {
                        setDoc(doc(db, 'habits', h.id), { ...updatedHabit, userId: user.uid }, { merge: true }).catch(console.error);
                      }
                      return updatedHabit;
                    }
                  }
                  return h;
                });

                if (changed) {
                  try {
                    localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(updatedList));
                  } catch {}
                  setIdeaAnnouncement({
                    id: hComp.id,
                    title: `🔥 Hábito: ${hComp.habitTitle}`,
                    readableCategory: 'Hábitos & Rutinas',
                    categoryEmoji: '🔥',
                    spokenMessage: `¡Hábito "${hComp.habitTitle}" completado hoy desde Telegram! Racha actual: ${hComp.newStreak || 1} días.`,
                  });
                  return updatedList;
                }
                return prevHabits;
              });
            }

            if (completedHabitEventIds.length > 0) {
              fetch('/api/webhook/acknowledge-habit-completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventIds: completedHabitEventIds }),
              }).catch(() => {});
            }
          }

          // Merge any incoming Extra Expenses / Invoices received from Telegram / Assistant
          if (data.success && Array.isArray(data.extraExpenses) && data.extraExpenses.length > 0) {
            const addedExpenseIds: string[] = [];
            setMonthlyExtraExpenses((prev) => {
              const existingIds = new Set(prev.map(e => e.id));
              const toAddExpenses: MonthlyExtraExpenseItem[] = [];
              for (const incoming of data.extraExpenses) {
                if (!existingIds.has(incoming.id) && !deletedItemIdsRef.current.has(incoming.id)) {
                  const item: MonthlyExtraExpenseItem = {
                    id: incoming.id,
                    userId: user ? user.uid : (incoming.userId || 'guest'),
                    name: incoming.name || 'Gasto Factura',
                    category: incoming.category || 'otro',
                    amount: Number(incoming.amount) || 0,
                    dayOfMonth: Number(incoming.dayOfMonth) || new Date().getDate(),
                    date: incoming.date || new Date().toISOString().split('T')[0],
                    assignedQuincena: incoming.assignedQuincena || (Number(incoming.dayOfMonth) <= 15 ? 'quincena_1' : 'quincena_2'),
                    isPaid: incoming.isPaid !== false,
                    paidBy: incoming.paidBy || 'Miguel',
                    paymentMethod: incoming.paymentMethod || 'Tarjeta de Crédito',
                    receiptNotes: incoming.receiptNotes || 'Factura procesada automáticamente',
                    createdAt: incoming.createdAt || new Date().toISOString().split('T')[0],
                    updatedAt: incoming.updatedAt || new Date().toISOString().split('T')[0],
                  };
                  toAddExpenses.push(item);
                  addedExpenseIds.push(incoming.id);
                }
              }
              if (toAddExpenses.length > 0) {
                if (user) {
                  for (const newExp of toAddExpenses) {
                    setDoc(doc(db, 'monthly_extra_expenses', newExp.id), { ...newExp, userId: user.uid }).catch(console.error);
                  }
                }
                const updatedList = [...prev, ...toAddExpenses];
                updatedList.sort((a, b) => (a.dayOfMonth || 15) - (b.dayOfMonth || 15));
                try {
                  localStorage.setItem(MONTHLY_EXTRA_EXPENSES_STORAGE_KEY, JSON.stringify(updatedList));
                } catch {}

                // Trigger toast notification
                const firstExp = toAddExpenses[0];
                setIdeaAnnouncement({
                  id: firstExp.id,
                  title: `🧾 Factura: ${firstExp.name}`,
                  readableCategory: 'Gastos Adicionales del Mes',
                  categoryEmoji: '🐾',
                  spokenMessage: `Se ha incluido la factura "${firstExp.name}" por $${Number(firstExp.amount).toLocaleString('es-CO')} COP en Gastos Adicionales (Pagado).`,
                });

                return updatedList;
              }
              return prev;
            });

            // Acknowledge all extra expenses from server queue so they are purged
            const allIncomingExpenseIds = data.extraExpenses.map((e: any) => e.id).filter(Boolean);
            if (allIncomingExpenseIds.length > 0) {
              fetch('/api/webhook/acknowledge-expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expenseIds: allIncomingExpenseIds }),
              }).catch(() => {});
            }
          }
        }
      } catch (pollErr) {
        // Silently ignore background poll errors
      }
    };

    // Run immediately on mount / user change, then poll periodically
    pollWebhookIdeas();
    const interval = setInterval(pollWebhookIdeas, 3500);
    return () => clearInterval(interval);
  }, [user]);

  // Proactive background reminder & follow-up check-in auto-scheduler for upcoming tasks & habits
  useEffect(() => {
    const syncUpcomingReminders = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        // Find tasks assigned for today that have a timeSlot (e.g., "11:00", "17:00" or "11:00 - 11:20")
        const todayTasks = tasks.filter(t => {
          if (t.status === 'completada' || t.status === 'cancelada') return false;
          const taskDate = t.assignedDate || t.dueDate;
          return taskDate === todayStr && t.timeSlot;
        });

        for (const task of todayTasks) {
          const times = (task.timeSlot || '').split('-');
          const rawStartTime = times[0]?.trim();
          const rawEndTime = times[1]?.trim() || rawStartTime;

          // 1. Proactive pre-reminder (10 minutes before start)
          if (rawStartTime) {
            await fetch('/api/telegram/schedule-reminder', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                taskId: task.id,
                title: task.title,
                category: task.category,
                eventTime: rawStartTime,
                eventDate: todayStr,
                advanceMinutes: 10,
                userId: user ? user.uid : undefined,
                type: 'task',
              }),
            }).catch(() => {});
          }

          // 2. Post-task follow-up verification (10 minutes after scheduled end time)
          if (rawEndTime) {
            await fetch('/api/telegram/schedule-followup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                taskId: task.id,
                title: task.title,
                category: task.category,
                eventTime: task.timeSlot,
                eventDate: todayStr,
                afterMinutes: 10,
                userId: user ? user.uid : undefined,
              }),
            }).catch(() => {});
          }
        }
      } catch {
        // Silently ignore background scheduler sync
      }
    };

    if (tasks.length > 0) {
      syncUpcomingReminders();
    }
  }, [tasks, user]);

  // Sync agenda (tasks and habits) to backend so Telegram bot can respond to "que tengo para hoy" accurately
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const simplifiedTasks = tasks.map(t => ({
          id: t.id,
          title: t.title,
          category: t.category,
          status: t.status,
          assignedDate: t.assignedDate,
          dueDate: t.dueDate,
          timeSlot: t.timeSlot,
          priority: t.priority,
          description: t.description,
          estimatedHours: t.estimatedHours,
          completedHours: t.completedHours,
        }));

        const simplifiedHabits = habits.map(h => ({
          id: h.id,
          title: h.title,
          category: h.category,
          icon: h.icon,
          frequency: h.frequency,
          targetTime: h.targetTime,
          targetDurationMinutes: h.targetDurationMinutes,
          streak: h.streak,
          completedToday: Array.isArray(h.completedDates) && h.completedDates.includes(todayStr),
        }));

        await fetch('/api/user/sync-agenda', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user ? user.uid : 'default',
            userDisplayName: user?.displayName || 'Miguel',
            todayStr,
            tasks: simplifiedTasks,
            habits: simplifiedHabits,
          }),
        }).catch(() => {});
      } catch {
        // Silently ignore background agenda sync
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [tasks, habits, user]);

  // Save tasks, ideas, habits, vehicles, maintenances, and entertainment to localStorage on change (for offline/fast recovery cache)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      localStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify(ideas));
      localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits));
      localStorage.setItem(DAILY_CALORIE_LOGS_STORAGE_KEY, JSON.stringify(calorieLogs));
      localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(vehicles));
      localStorage.setItem(VEHICLE_MAINTENANCE_STORAGE_KEY, JSON.stringify(vehicleMaintenances));
      localStorage.setItem(FAMILY_TRIPS_STORAGE_KEY, JSON.stringify(familyTrips));
      localStorage.setItem(MEDIA_BACKLOG_STORAGE_KEY, JSON.stringify(mediaBacklog));
      localStorage.setItem(GAME_BACKLOG_STORAGE_KEY, JSON.stringify(gameBacklog));
      localStorage.setItem(MEDIA_REVIEWS_STORAGE_KEY, JSON.stringify(mediaReviews));
    } catch (e) {
      console.error('Error saving data to localStorage', e);
    }
  }, [tasks, ideas, habits, calorieLogs, vehicles, vehicleMaintenances, familyTrips, mediaBacklog, gameBacklog, mediaReviews, user]);

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Error signing out', e);
    }
  };

  // ================= HABITS HANDLERS =================
  const handleOpenNewHabitModal = () => {
    setEditingHabit(null);
    setIsHabitModalOpen(true);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsHabitModalOpen(true);
  };

  const handleSaveHabit = async (habitData: Omit<Habit, 'id' | 'streak' | 'bestStreak' | 'completedDates' | 'createdAt'> & { id?: string }) => {
    const today = getTodayDateString();
    const habitId = habitData.id || `habit-${Date.now()}`;

    let savedHabit: Habit;
    let nextList: Habit[];

    if (habitData.id) {
      const existing = habits.find((h) => h.id === habitData.id);
      const existingCompleted = existing?.completedDates || [];
      const streakInfo = calculateHabitStreak(existingCompleted);

      savedHabit = {
        ...(existing || {}),
        ...habitData,
        id: habitId,
        completedDates: existingCompleted,
        streak: streakInfo.streak,
        bestStreak: Math.max(existing?.bestStreak || 0, streakInfo.bestStreak),
        createdAt: existing?.createdAt || today,
      };

      nextList = habits.some((h) => h.id === habitId)
        ? habits.map((h) => (h.id === habitId ? savedHabit : h))
        : [savedHabit, ...habits];
    } else {
      savedHabit = {
        ...habitData,
        id: habitId,
        completedDates: [],
        streak: 0,
        bestStreak: 0,
        createdAt: today,
      };
      nextList = [savedHabit, ...habits];
    }

    setHabits(nextList);

    try {
      localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(nextList));
      localStorage.removeItem('lifeflow_habits_cleared');
    } catch (e) {
      console.warn('Error writing habits to localStorage:', e);
    }

    if (user) {
      try {
        const sanitized = sanitizeForFirestore({
          ...savedHabit,
          userId: user.uid,
        });
        await setDoc(doc(db, 'habits', habitId), sanitized, { merge: true });
      } catch (e) {
        console.error('Error saving habit to Firestore:', e);
      }
    }
  };

  const handleToggleHabitDay = async (habitId: string, dateStr: string) => {
    let habitToSave: Habit | null = null;
    let nextHabitsList: Habit[] = [];

    // Compute updated list synchronously to prevent batching race conditions
    const target = habits.find((h) => h.id === habitId);
    if (target) {
      const currentDates = Array.isArray(target.completedDates) ? [...target.completedDates] : [];
      const isDone = currentDates.includes(dateStr);
      const newDates = isDone
        ? currentDates.filter((d) => d !== dateStr)
        : [...currentDates, dateStr];

      const streakInfo = calculateHabitStreak(newDates);
      habitToSave = {
        ...target,
        completedDates: newDates,
        streak: streakInfo.streak,
        bestStreak: Math.max(target.bestStreak || 0, streakInfo.bestStreak),
      };

      nextHabitsList = habits.map((h) => (h.id === habitId ? habitToSave! : h));
      setHabits(nextHabitsList);
    } else {
      // Fallback with functional updater if habits was momentarily out of sync
      setHabits((prev) => {
        const t = prev.find((h) => h.id === habitId);
        if (!t) return prev;
        const currentDates = Array.isArray(t.completedDates) ? [...t.completedDates] : [];
        const isDone = currentDates.includes(dateStr);
        const newDates = isDone
          ? currentDates.filter((d) => d !== dateStr)
          : [...currentDates, dateStr];
        const streakInfo = calculateHabitStreak(newDates);
        habitToSave = {
          ...t,
          completedDates: newDates,
          streak: streakInfo.streak,
          bestStreak: Math.max(t.bestStreak || 0, streakInfo.bestStreak),
        };
        nextHabitsList = prev.map((h) => (h.id === habitId ? habitToSave! : h));
        return nextHabitsList;
      });
    }

    if (habitToSave) {
      // 1. Persist immediately to localStorage so nothing is lost if browser reloads or unloads
      try {
        localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(nextHabitsList));
        localStorage.removeItem('lifeflow_habits_cleared');
      } catch (e) {
        console.warn('Error saving habits to localStorage:', e);
      }

      // 2. Persist to Firestore with sanitation
      if (user) {
        try {
          const sanitized = sanitizeForFirestore({
            ...habitToSave,
            userId: user.uid,
          });
          await setDoc(doc(db, 'habits', habitId), sanitized, { merge: true });
        } catch (e) {
          console.error('Error updating habit day in Firestore:', e);
        }
      }
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este hábito?')) return;

    const nextList = habits.filter((h) => h.id !== habitId);
    setHabits(nextList);

    try {
      localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(nextList));
    } catch (e) {
      console.warn('Error saving habits to localStorage:', e);
    }

    if (user) {
      try {
        await deleteDoc(doc(db, 'habits', habitId));
      } catch (e) {
        console.error('Error deleting habit from Firestore:', e);
      }
    }
  };

  const handleRestoreDefaultHabits = async () => {
    try {
      localStorage.removeItem('lifeflow_habits_cleared');
      localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(INITIAL_HABITS));
    } catch {}

    setHabits(INITIAL_HABITS);

    if (user) {
      try {
        for (const h of INITIAL_HABITS) {
          const sanitized = sanitizeForFirestore({
            ...h,
            userId: user.uid,
          });
          await setDoc(doc(db, 'habits', h.id), sanitized, { merge: true });
        }
      } catch (e) {
        console.error('Error restoring default habits to Firestore:', e);
      }
    }
  };

  // ================= TASKS HANDLERS =================
  const handleOpenNewTaskModal = (defaultDateOrPrefilled?: string | Partial<Task>) => {
    if (typeof defaultDateOrPrefilled === 'string') {
      setEditingTask(null);
      setDefaultTaskDate(defaultDateOrPrefilled || '');
    } else if (defaultDateOrPrefilled && typeof defaultDateOrPrefilled === 'object') {
      setEditingTask(defaultDateOrPrefilled as Task);
      setDefaultTaskDate((defaultDateOrPrefilled as any).assignedDate || '');
    } else {
      setEditingTask(null);
      setDefaultTaskDate('');
    }
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split('T')[0];
    const taskId = taskData.id || `task-${Date.now()}`;

    const newTask: Task = {
      ...taskData,
      id: taskId,
      createdAt: (taskData as any).createdAt || nowIso,
      updatedAt: todayStr,
      durationSeconds: (taskData as any).durationSeconds || 0,
    };

    if (taskData.id) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? newTask : t)));
    } else {
      setTasks((prev) => [newTask, ...prev]);
    }

    // Auto-sync to Google Calendar with native 10-min alarm if scheduled
    const gcalToken = getGoogleCalendarToken();
    if (gcalToken && newTask.assignedDate) {
      syncSingleTaskToGoogleCalendar(gcalToken, newTask).catch((err) => {
        console.warn('[Auto-GCal] Sync on save failed:', err);
      });
    }

    if (user) {
      try {
        await setDoc(doc(db, 'tasks', taskId), {
          ...newTask,
          userId: user.uid,
        }, { merge: true });
      } catch (e) {
        console.error('Error saving task to Firestore:', e);
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!taskId) return;
    recordDeletedItemId(taskId);

    setTasks((prev) => {
      const updated = prev.filter((t) => t.id !== taskId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Notify backend webhook queue and timer canceler
    fetch('/api/webhook/delete-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId }),
    }).catch(() => {});

    if (user) {
      try {
        await deleteDoc(doc(db, 'tasks', taskId));
      } catch (e) {
        console.error('Error deleting task from Firestore:', e);
      }
    }
  };

  // Rollover single task to next day (button ">")
  const handleRolloverTaskToNextDay = async (task: Task, targetDate?: string) => {
    const baseDate = targetDate || task.assignedDate || task.dueDate || new Date().toISOString().split('T')[0];
    const d = new Date(baseDate + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    const nextDate = d.toISOString().split('T')[0];

    const updatedTask: Task = {
      ...task,
      assignedDate: nextDate,
      dueDate: task.dueDate && task.dueDate < nextDate ? nextDate : (task.dueDate || nextDate),
      rolloverCount: (task.rolloverCount || 0) + 1,
      isRollover: true,
      postponedFromDate: baseDate,
      rolledOverFromDate: baseDate,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    await handleSaveTask(updatedTask);
  };

  // Auto-rollover uncompleted work tasks from past days to today (midnight / next day transition)
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const pendingPastLaboral = tasks.filter(t => {
      const isLaboral = t.isJobTask || t.category === 'trabajo' || t.category === 'laboral' || t.tags?.includes('trabajo') || t.tags?.includes('laboral');
      const isPending = t.status !== 'completada' && t.status !== 'cancelada';
      const taskDate = t.assignedDate || t.dueDate;
      return isLaboral && isPending && taskDate && taskDate < todayStr;
    });

    if (pendingPastLaboral.length > 0) {
      setTasks(prev => prev.map(t => {
        const isLaboral = t.isJobTask || t.category === 'trabajo' || t.category === 'laboral' || t.tags?.includes('trabajo') || t.tags?.includes('laboral');
        const isPending = t.status !== 'completada' && t.status !== 'cancelada';
        const taskDate = t.assignedDate || t.dueDate;
        if (isLaboral && isPending && taskDate && taskDate < todayStr) {
          const updated: Task = {
            ...t,
            assignedDate: todayStr,
            dueDate: t.dueDate && t.dueDate < todayStr ? todayStr : (t.dueDate || todayStr),
            rolloverCount: (t.rolloverCount || 0) + 1,
            isRollover: true,
            postponedFromDate: taskDate,
            rolledOverFromDate: taskDate,
            updatedAt: todayStr
          };
          if (user) {
            setDoc(doc(db, 'tasks', t.id), { ...updated, userId: user.uid }, { merge: true }).catch(console.error);
          }
          return updated;
        }
        return t;
      }));
    }
  }, [tasks.length, user]);

  const handleOpenLogHours = (task: Task) => {
    setLoggingTask(task);
    setIsLogHoursModalOpen(true);
  };

  const handleUpdateProgress = async (taskId: string, newCompletedHours: number, newMetricValue?: number) => {
    let updatedTask: Task | null = null;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          let newStatus = t.status;
          if (newCompletedHours >= t.estimatedHours && t.estimatedHours > 0) {
            newStatus = 'completada';
          } else if (newCompletedHours > 0 && t.status === 'pendiente') {
            newStatus = 'en_progreso';
          }

          updatedTask = {
            ...t,
            completedHours: newCompletedHours,
            currentMetricValue: newMetricValue !== undefined ? newMetricValue : t.currentMetricValue,
            status: newStatus,
            updatedAt: new Date().toISOString().split('T')[0],
          };
          return updatedTask;
        }
        return t;
      })
    );

    if (user && updatedTask) {
      try {
        await setDoc(doc(db, 'tasks', taskId), {
          ...updatedTask,
          userId: user.uid,
        }, { merge: true });
      } catch (e) {
        console.error('Error updating progress in Firestore:', e);
      }
    }
  };

  const handleToggleSubgoal = async (taskId: string, subgoalId: string) => {
    let updatedTask: Task | null = null;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const safeSubgoals = Array.isArray(t.subgoals) ? t.subgoals : [];
          const updatedSubgoals = safeSubgoals.map((sg) =>
            sg.id === subgoalId ? { ...sg, completed: !sg.completed } : sg
          );
          
          updatedTask = {
            ...t,
            subgoals: updatedSubgoals,
            updatedAt: new Date().toISOString().split('T')[0],
          };
          return updatedTask;
        }
        return t;
      })
    );

    if (user && updatedTask) {
      try {
        await setDoc(doc(db, 'tasks', taskId), {
          ...updatedTask,
          userId: user.uid,
        }, { merge: true });
      } catch (e) {
        console.error('Error updating subgoal in Firestore:', e);
      }
    }
  };

  const handleQuickStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    let updatedTask: Task | null = null;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          let compHours = t.completedHours;
          if (newStatus === 'completada' && compHours < t.estimatedHours) {
            compHours = t.estimatedHours;
          }

          const now = new Date();
          const nowIso = now.toISOString();
          const todayDate = nowIso.split('T')[0];

          let durationSec = t.durationSeconds;
          if (newStatus === 'completada' && (!durationSec || durationSec <= 0)) {
            const startMs = t.createdAt ? new Date(t.createdAt).getTime() : now.getTime();
            durationSec = Math.max(1, Math.floor((now.getTime() - startMs) / 1000));
          }

          const resMinutes = t.resolutionMinutes || (durationSec ? Math.max(1, Math.round(durationSec / 60)) : undefined);

          updatedTask = {
            ...t,
            status: newStatus,
            completedHours: compHours,
            updatedAt: todayDate,
            ...(newStatus === 'completada' ? {
              completedAt: t.completedAt || todayDate,
              completedAtTimestamp: t.completedAtTimestamp || nowIso,
              durationSeconds: durationSec,
              resolutionMinutes: resMinutes,
            } : {
              completedAt: undefined,
              completedAtTimestamp: undefined,
            }),
          };
          return updatedTask;
        }
        return t;
      })
    );

    if (user && updatedTask) {
      try {
        await setDoc(doc(db, 'tasks', taskId), {
          ...updatedTask,
          userId: user.uid,
        }, { merge: true });
      } catch (e) {
        console.error('Error changing status in Firestore:', e);
      }
    }
  };

  const handleAssignTaskDate = async (taskId: string, dateStr: string) => {
    let updatedTask: Task | null = null;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          updatedTask = { ...t, assignedDate: dateStr };
          return updatedTask;
        }
        return t;
      })
    );

    // Auto-sync to Google Calendar with native 10-min alarm
    const gcalToken = getGoogleCalendarToken();
    if (gcalToken && updatedTask && (updatedTask as Task).assignedDate) {
      syncSingleTaskToGoogleCalendar(gcalToken, updatedTask as Task).catch((err) => {
        console.warn('[Auto-GCal] Sync on date assign failed:', err);
      });
    }

    if (user && updatedTask) {
      try {
        await setDoc(doc(db, 'tasks', taskId), {
          ...updatedTask,
          userId: user.uid,
        }, { merge: true });
      } catch (e) {
        console.error('Error assigning date in Firestore:', e);
      }
    }
  };

  const handleAssignToCalendar = (task: Task) => {
    setActiveTab('calendario');
  };

  // Handlers for Ideas / Collections
  const handleAddIdea = async (ideaData: Omit<IdeaItem, 'id' | 'createdAt'>) => {
    const newId = `idea-${Date.now()}`;
    const newIdea: IdeaItem = {
      ...ideaData,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setIdeas((prev) => [newIdea, ...prev]);

    // Announce via AI Assistant where this idea was assigned
    const targetCategory = categories.find((c) => c.id === ideaData.categoryId);
    setIdeaAnnouncement({
      id: newId,
      title: ideaData.title,
      categoryId: ideaData.categoryId,
      categoryName: targetCategory ? targetCategory.name : 'Categoría Asignada',
      categoryColor: targetCategory ? targetCategory.color : '#00f2ff',
      typeLabel: ideaData.type,
      timestamp: Date.now(),
    });

    if (user) {
      try {
        await setDoc(doc(db, 'ideas', newId), {
          ...newIdea,
          userId: user.uid,
        });
      } catch (e) {
        console.error('Error adding idea to Firestore:', e);
      }
    }
  };

  const handleAddBatchIdeas = async (batchIdeas: Omit<IdeaItem, 'id' | 'createdAt'>[]) => {
    if (!batchIdeas || batchIdeas.length === 0) return;
    const now = new Date().toISOString().split('T')[0];
    const newItems: IdeaItem[] = batchIdeas.map((item, idx) => ({
      ...item,
      id: `idea-${Date.now()}-${idx}`,
      createdAt: now,
      userId: user ? user.uid : undefined,
    }));

    setIdeas((prev) => [...newItems, ...prev]);

    // Announce the first item or batch summary
    if (newItems.length > 0) {
      const first = newItems[0];
      const targetCat = categories.find(c => c.id === first.categoryId);
      setIdeaAnnouncement({
        id: first.id,
        title: newItems.length > 1 ? `${first.title} (+${newItems.length - 1} más)` : first.title,
        categoryId: first.categoryId,
        categoryName: targetCat ? targetCat.name : 'Múltiples Categorías',
        categoryColor: targetCat ? targetCat.color : '#00f2ff',
        typeLabel: 'brain_dump',
        timestamp: Date.now(),
      });
    }

    if (user) {
      for (const item of newItems) {
        setDoc(doc(db, 'ideas', item.id), { ...item, userId: user.uid }).catch(console.error);
      }
    }
  };

  const handleAddBatchTasks = async (batchTasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    if (!batchTasks || batchTasks.length === 0) return;
    const now = new Date().toISOString().split('T')[0];
    const newItems: Task[] = batchTasks.map((t, idx) => ({
      ...t,
      id: `task-${Date.now()}-${idx}`,
      createdAt: now,
      updatedAt: now,
      userId: user ? user.uid : undefined,
    }));

    setTasks((prev) => [...newItems, ...prev]);

    if (user) {
      for (const item of newItems) {
        setDoc(doc(db, 'tasks', item.id), { ...item, userId: user.uid }).catch(console.error);
      }
    }
  };

  const handleDeleteIdea = async (ideaId: string) => {
    if (!ideaId) return;
    recordDeletedItemId(ideaId);

    setIdeas((prev) => {
      const updated = prev.filter((i) => i.id !== ideaId);
      try {
        localStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Notify backend queue
    fetch('/api/webhook/delete-idea', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ideaId }),
    }).catch(() => {});

    if (user) {
      try {
        await deleteDoc(doc(db, 'ideas', ideaId));
      } catch (e) {
        console.error('Error deleting idea from Firestore:', e);
      }
    }
  };

  const handleConvertIdeaToTask = (idea: IdeaItem) => {
    const draftTask: Task = {
      id: '',
      title: idea.title,
      description: idea.description || '',
      category: idea.categoryId,
      priority: 'media',
      status: 'pendiente',
      estimatedHours: 8,
      completedHours: 0,
      finalGoal: idea.title,
      targetMetricValue: 100,
      currentMetricValue: 0,
      metricUnit: '%',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tags: [idea.type || 'Idea'],
      subgoals: [],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setEditingTask(draftTask);
    setIsTaskModalOpen(true);
  };

  const handleUpdateIdeaStatus = async (ideaId: string, status: any) => {
    if (!ideaId) return;
    const now = new Date().toISOString().split('T')[0];
    setIdeas((prev) => {
      const updated = prev.map((item) =>
        item.id === ideaId ? { ...item, status, updatedAt: now } : item
      );
      try {
        localStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (user) {
      try {
        await updateDoc(doc(db, 'ideas', ideaId), {
          status,
          updatedAt: now,
        });
      } catch (e) {
        console.error('Error updating idea status in Firestore:', e);
      }
    }
  };

  const handleEditIdea = async (updatedIdea: IdeaItem) => {
    if (!updatedIdea || !updatedIdea.id) return;
    const now = new Date().toISOString().split('T')[0];
    const fullUpdated = { ...updatedIdea, updatedAt: now };

    setIdeas((prev) => {
      const updated = prev.map((item) =>
        item.id === updatedIdea.id ? fullUpdated : item
      );
      try {
        localStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'ideas', updatedIdea.id), {
          ...fullUpdated,
          userId: user.uid,
        }, { merge: true });
      } catch (e) {
        console.error('Error updating idea in Firestore:', e);
      }
    }
  };

  // Health Profile handlers
  const handleUpdateHealthProfile = async (updated: HealthProfile) => {
    setHealthProfile(updated);
    localStorage.setItem(HEALTH_PROFILE_STORAGE_KEY, JSON.stringify(updated));

    if (user) {
      try {
        await setDoc(doc(db, 'health_profiles', user.uid), {
          ...updated,
          userId: user.uid,
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.error('Error saving health profile to Firestore:', e);
      }
    }
  };

  // Weight Log handlers
  const handleAddWeightLog = async (entryData: Omit<WeightLogEntry, 'id' | 'createdAt'>) => {
    const newId = `weight-${Date.now()}`;
    const newEntry: WeightLogEntry = {
      ...entryData,
      id: newId,
      createdAt: new Date().toISOString(),
      userId: user ? user.uid : undefined,
    };

    setWeightLogs((prev) => {
      // If entry for this date exists, update it, otherwise insert & sort
      const filtered = prev.filter((p) => p.date !== entryData.date);
      const updated = [...filtered, newEntry];
      updated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      localStorage.setItem(WEIGHT_LOGS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    // Also update healthProfile current weight if the logged date is today or newest
    setHealthProfile((prev) => {
      const updated = { 
        ...prev, 
        currentWeight: entryData.weight, 
        weight: entryData.weight, 
        updatedAt: new Date().toISOString() 
      };
      localStorage.setItem(HEALTH_PROFILE_STORAGE_KEY, JSON.stringify(updated));
      if (user) {
        setDoc(doc(db, 'health_profiles', user.uid), { ...updated, userId: user.uid }).catch(console.error);
      }
      return updated;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'weight_logs', newId), {
          ...newEntry,
          userId: user.uid,
        });
      } catch (e) {
        console.error('Error adding weight log to Firestore:', e);
      }
    }
  };

  const handleDeleteWeightLog = async (logId: string) => {
    setWeightLogs((prev) => {
      const updated = prev.filter((l) => l.id !== logId);
      localStorage.setItem(WEIGHT_LOGS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (user) {
      try {
        await deleteDoc(doc(db, 'weight_logs', logId));
      } catch (e) {
        console.error('Error deleting weight log from Firestore:', e);
      }
    }
  };

  // Daily Calorie & Nutrition Handlers
  const handleSaveDailyCalorieLog = async (log: DailyCalorieLog) => {
    setCalorieLogs((prev) => {
      const existingIndex = prev.findIndex((l) => l.date === log.date || l.id === log.id);
      let updated: DailyCalorieLog[];
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = log;
      } else {
        updated = [log, ...prev];
      }
      updated.sort((a, b) => b.date.localeCompare(a.date));
      localStorage.setItem(DAILY_CALORIE_LOGS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'calorie_logs', log.id), {
          ...log,
          userId: user.uid,
        }, { merge: true });
      } catch (e) {
        console.error('Error saving calorie log to Firestore:', e);
      }
    }
  };

  const handleDeleteDailyCalorieLog = async (logId: string) => {
    setCalorieLogs((prev) => {
      const updated = prev.filter((l) => l.id !== logId);
      localStorage.setItem(DAILY_CALORIE_LOGS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (user) {
      try {
        await deleteDoc(doc(db, 'calorie_logs', logId));
      } catch (e) {
        console.error('Error deleting calorie log from Firestore:', e);
      }
    }
  };

  // ================= VEHICLE HANDLERS =================
  const handleAddVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = `veh-${Date.now()}`;
    const now = new Date().toISOString();
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: newId,
      createdAt: now,
      updatedAt: now,
      userId: user ? user.uid : undefined,
    };

    setVehicles((prev) => {
      const updated = [newVehicle, ...prev];
      localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'vehicles', newId), sanitizeForFirestore({
          ...newVehicle,
          userId: user.uid,
        }));
      } catch (e) {
        console.error('Error adding vehicle to Firestore:', e);
      }
    }
  };

  const handleUpdateVehicle = async (updated: Vehicle) => {
    const now = new Date().toISOString();
    const withUpdate: Vehicle = {
      ...updated,
      updatedAt: now,
      userId: user ? user.uid : updated.userId,
    };

    setVehicles((prev) => {
      const list = prev.map((v) => (v.id === updated.id ? withUpdate : v));
      localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(list));
      return list;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'vehicles', updated.id), sanitizeForFirestore({
          ...withUpdate,
          userId: user.uid,
        }), { merge: true });
      } catch (e) {
        console.error('Error updating vehicle in Firestore:', e);
      }
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    setVehicles((prev) => {
      const filtered = prev.filter((v) => v.id !== vehicleId);
      localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(filtered));
      return filtered;
    });

    // Also delete associated maintenances
    setVehicleMaintenances((prev) => {
      const filtered = prev.filter((m) => m.vehicleId !== vehicleId);
      localStorage.setItem(VEHICLE_MAINTENANCE_STORAGE_KEY, JSON.stringify(filtered));
      return filtered;
    });

    if (user) {
      try {
        await deleteDoc(doc(db, 'vehicles', vehicleId));
        const qM = query(collection(db, 'vehicle_maintenances'), where('vehicleId', '==', vehicleId), where('userId', '==', user.uid));
        const snap = await getDocs(qM);
        for (const d of snap.docs) {
          await deleteDoc(doc(db, 'vehicle_maintenances', d.id));
        }
      } catch (e) {
        console.error('Error deleting vehicle from Firestore:', e);
      }
    }
  };

  const handleAddVehicleMaintenance = async (maintData: Omit<VehicleMaintenance, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = `maint-${Date.now()}`;
    const now = new Date().toISOString();
    const newMaint: VehicleMaintenance = {
      ...maintData,
      id: newId,
      createdAt: now,
      updatedAt: now,
      userId: user ? user.uid : undefined,
    };

    setVehicleMaintenances((prev) => {
      const updated = [newMaint, ...prev];
      localStorage.setItem(VEHICLE_MAINTENANCE_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'vehicle_maintenances', newId), {
          ...newMaint,
          userId: user.uid,
        });
      } catch (e) {
        console.error('Error adding vehicle maintenance to Firestore:', e);
      }
    }
  };

  const handleUpdateVehicleMaintenance = async (updated: VehicleMaintenance) => {
    const now = new Date().toISOString();
    const withUpdate: VehicleMaintenance = {
      ...updated,
      updatedAt: now,
      userId: user ? user.uid : updated.userId,
    };

    setVehicleMaintenances((prev) => {
      const list = prev.map((m) => (m.id === updated.id ? withUpdate : m));
      localStorage.setItem(VEHICLE_MAINTENANCE_STORAGE_KEY, JSON.stringify(list));
      return list;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'vehicle_maintenances', updated.id), {
          ...withUpdate,
          userId: user.uid,
        }, { merge: true });
      } catch (e) {
        console.error('Error updating vehicle maintenance in Firestore:', e);
      }
    }
  };

  const handleDeleteVehicleMaintenance = async (maintId: string) => {
    setVehicleMaintenances((prev) => {
      const filtered = prev.filter((m) => m.id !== maintId);
      localStorage.setItem(VEHICLE_MAINTENANCE_STORAGE_KEY, JSON.stringify(filtered));
      return filtered;
    });

    if (user) {
      try {
        await deleteDoc(doc(db, 'vehicle_maintenances', maintId));
      } catch (e) {
        console.error('Error deleting vehicle maintenance from Firestore:', e);
      }
    }
  };

  const handleRecordOilChange = async (vehicleId: string, currentMileage: number) => {
    const today = new Date().toISOString().split('T')[0];
    const targetVeh = vehicles.find((v) => v.id === vehicleId);
    if (!targetVeh) return;

    const updatedVehicle: Vehicle = {
      ...targetVeh,
      currentMileage: Math.max(targetVeh.currentMileage, currentMileage),
      oilChangeLastMileage: currentMileage,
      oilChangeLastDate: today,
      updatedAt: new Date().toISOString(),
    };

    await handleUpdateVehicle(updatedVehicle);

    // Also auto-add a completed maintenance record for documentation
    await handleAddVehicleMaintenance({
      vehicleId,
      category: 'preventivo',
      title: 'Cambio de aceite y filtro de motor',
      description: `Registrado a los ${currentMileage.toLocaleString()} km. Próximo cambio recomendado a los ${(currentMileage + targetVeh.oilChangeIntervalKm).toLocaleString()} km.`,
      status: 'completado',
      priority: 'media',
      targetMileage: currentMileage,
      completedDate: today,
    });
  };

  const handleQuickUpdateMileage = async (vehicleId: string, newMileage: number) => {
    const targetVeh = vehicles.find((v) => v.id === vehicleId);
    if (!targetVeh) return;

    const updatedVehicle: Vehicle = {
      ...targetVeh,
      currentMileage: newMileage,
      updatedAt: new Date().toISOString(),
    };

    await handleUpdateVehicle(updatedVehicle);
  };

  // Reset Specific Vehicles Collection (Fresh Start)
  const handleResetVehiclesData = async () => {
    setVehicles([]);
    setVehicleMaintenances([]);
    localStorage.removeItem(VEHICLES_STORAGE_KEY);
    localStorage.removeItem(VEHICLE_MAINTENANCE_STORAGE_KEY);

    if (user) {
      try {
        const qV = query(collection(db, 'vehicles'), where('userId', '==', user.uid));
        const snapV = await getDocs(qV);
        for (const d of snapV.docs) {
          await deleteDoc(doc(db, 'vehicles', d.id));
        }

        const qM = query(collection(db, 'vehicle_maintenances'), where('userId', '==', user.uid));
        const snapM = await getDocs(qM);
        for (const d of snapM.docs) {
          await deleteDoc(doc(db, 'vehicle_maintenances', d.id));
        }
      } catch (e) {
        console.error('Error clearing vehicles from Firestore:', e);
      }
    }
  };

  // Reset Specific Health Collection (Fresh Start)
  const handleResetHealthData = async () => {
    const cleanProfile: HealthProfile = {
      ...INITIAL_HEALTH_PROFILE,
      id: user ? `profile-${user.uid}` : 'default-health-profile',
      userId: user ? user.uid : undefined,
      updatedAt: new Date().toISOString(),
    };

    setHealthProfile(cleanProfile);
    setWeightLogs([]);
    setCalorieLogs([]);
    localStorage.setItem(HEALTH_PROFILE_STORAGE_KEY, JSON.stringify(cleanProfile));
    localStorage.removeItem(WEIGHT_LOGS_STORAGE_KEY);
    localStorage.removeItem(DAILY_CALORIE_LOGS_STORAGE_KEY);

    if (user) {
      try {
        await setDoc(doc(db, 'health_profiles', user.uid), cleanProfile);
        const qW = query(collection(db, 'weight_logs'), where('userId', '==', user.uid));
        const snapW = await getDocs(qW);
        for (const d of snapW.docs) {
          await deleteDoc(doc(db, 'weight_logs', d.id));
        }
        const qCal = query(collection(db, 'calorie_logs'), where('userId', '==', user.uid));
        const snapCal = await getDocs(qCal);
        for (const d of snapCal.docs) {
          await deleteDoc(doc(db, 'calorie_logs', d.id));
        }
      } catch (e) {
        console.error('Error resetting health in Firestore:', e);
      }
    }
  };

  // Reset Specific Category Ideas/Tasks (Fresh Start)
  const handleResetCategoryData = async (categoryId: string) => {
    setIdeas((prev) => {
      const filtered = prev.filter((i) => i.categoryId !== categoryId);
      localStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify(filtered));
      return filtered;
    });

    if (user) {
      try {
        const qI = query(collection(db, 'ideas'), where('userId', '==', user.uid), where('categoryId', '==', categoryId));
        const snapI = await getDocs(qI);
        for (const d of snapI.docs) {
          await deleteDoc(doc(db, 'ideas', d.id));
        }
      } catch (e) {
        console.error('Error resetting category ideas in Firestore:', e);
      }
    }
  };

  // ================= MEDICAL APPOINTMENTS & EXAM NOTES HANDLERS =================
  const handleAddMedicalAppointment = async (appData: Omit<MedicalAppointment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = `app-${Date.now()}`;
    const now = new Date().toISOString();
    const newApp: MedicalAppointment = {
      ...appData,
      id: newId,
      createdAt: now,
      updatedAt: now,
      userId: user ? user.uid : undefined,
    };

    setMedicalAppointments((prev) => {
      const updated = [...prev, newApp];
      updated.sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate));
      localStorage.setItem(MEDICAL_APPOINTMENTS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'medical_appointments', newId), {
          ...newApp,
          userId: user.uid,
        });
      } catch (e) {
        console.error('Error adding medical appointment to Firestore:', e);
      }
    }
  };

  const handleUpdateMedicalAppointment = async (updated: MedicalAppointment) => {
    const now = new Date().toISOString();
    const withUpdate: MedicalAppointment = {
      ...updated,
      updatedAt: now,
      userId: user ? user.uid : updated.userId,
    };

    setMedicalAppointments((prev) => {
      const list = prev.map((a) => (a.id === updated.id ? withUpdate : a));
      list.sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate));
      localStorage.setItem(MEDICAL_APPOINTMENTS_STORAGE_KEY, JSON.stringify(list));
      return list;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'medical_appointments', updated.id), {
          ...withUpdate,
          userId: user.uid,
        }, { merge: true });
      } catch (e) {
        console.error('Error updating medical appointment in Firestore:', e);
      }
    }
  };

  const handleDeleteMedicalAppointment = async (appId: string) => {
    setMedicalAppointments((prev) => {
      const filtered = prev.filter((a) => a.id !== appId);
      localStorage.setItem(MEDICAL_APPOINTMENTS_STORAGE_KEY, JSON.stringify(filtered));
      return filtered;
    });

    if (user) {
      try {
        await deleteDoc(doc(db, 'medical_appointments', appId));
      } catch (e) {
        console.error('Error deleting medical appointment from Firestore:', e);
      }
    }
  };

  const handleAddMedicalExamNote = async (examData: Omit<MedicalExamNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = `exam-${Date.now()}`;
    const now = new Date().toISOString();
    const newExam: MedicalExamNote = {
      ...examData,
      id: newId,
      createdAt: now,
      updatedAt: now,
      userId: user ? user.uid : undefined,
    };

    setMedicalExamNotes((prev) => {
      const updated = [newExam, ...prev];
      localStorage.setItem(MEDICAL_EXAM_NOTES_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'medical_exam_notes', newId), {
          ...newExam,
          userId: user.uid,
        });
      } catch (e) {
        console.error('Error adding medical exam note to Firestore:', e);
      }
    }
  };

  const handleUpdateMedicalExamNote = async (updated: MedicalExamNote) => {
    const now = new Date().toISOString();
    const withUpdate: MedicalExamNote = {
      ...updated,
      updatedAt: now,
      userId: user ? user.uid : updated.userId,
    };

    setMedicalExamNotes((prev) => {
      const list = prev.map((e) => (e.id === updated.id ? withUpdate : e));
      localStorage.setItem(MEDICAL_EXAM_NOTES_STORAGE_KEY, JSON.stringify(list));
      return list;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'medical_exam_notes', updated.id), {
          ...withUpdate,
          userId: user.uid,
        }, { merge: true });
      } catch (e) {
        console.error('Error updating medical exam note in Firestore:', e);
      }
    }
  };

  const handleDeleteMedicalExamNote = async (examId: string) => {
    setMedicalExamNotes((prev) => {
      const filtered = prev.filter((e) => e.id !== examId);
      localStorage.setItem(MEDICAL_EXAM_NOTES_STORAGE_KEY, JSON.stringify(filtered));
      return filtered;
    });

    if (user) {
      try {
        await deleteDoc(doc(db, 'medical_exam_notes', examId));
      } catch (e) {
        console.error('Error deleting medical exam note from Firestore:', e);
      }
    }
  };

  const handleResetMedicalData = async () => {
    setMedicalAppointments([]);
    setMedicalExamNotes([]);
    localStorage.removeItem(MEDICAL_APPOINTMENTS_STORAGE_KEY);
    localStorage.removeItem(MEDICAL_EXAM_NOTES_STORAGE_KEY);

    if (user) {
      try {
        const qA = query(collection(db, 'medical_appointments'), where('userId', '==', user.uid));
        const snapA = await getDocs(qA);
        for (const d of snapA.docs) {
          await deleteDoc(doc(db, 'medical_appointments', d.id));
        }

        const qE = query(collection(db, 'medical_exam_notes'), where('userId', '==', user.uid));
        const snapE = await getDocs(qE);
        for (const d of snapE.docs) {
          await deleteDoc(doc(db, 'medical_exam_notes', d.id));
        }
      } catch (e) {
        console.error('Error resetting medical data in Firestore:', e);
      }
    }
  };

  // ================= FAMILY TRIPS & SAVINGS HANDLERS =================
  const handleAddFamilyTrip = async (tripData: Omit<TripDestination, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = `trip-${Date.now()}`;
    const now = new Date().toISOString();
    const newTrip: TripDestination = {
      ...tripData,
      id: newId,
      createdAt: now,
      updatedAt: now,
      userId: user ? user.uid : undefined,
    };

    setFamilyTrips((prev) => {
      const updated = [newTrip, ...prev];
      localStorage.setItem(FAMILY_TRIPS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'family_trips', newId), {
          ...newTrip,
          userId: user.uid,
        });
      } catch (e) {
        console.error('Error adding family trip to Firestore:', e);
      }
    }
  };

  const handleUpdateFamilyTrip = async (updated: TripDestination) => {
    const now = new Date().toISOString();
    const withUpdate: TripDestination = {
      ...updated,
      updatedAt: now,
      userId: user ? user.uid : updated.userId,
    };

    setFamilyTrips((prev) => {
      const list = prev.map((t) => (t.id === updated.id ? withUpdate : t));
      localStorage.setItem(FAMILY_TRIPS_STORAGE_KEY, JSON.stringify(list));
      return list;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'family_trips', updated.id), {
          ...withUpdate,
          userId: user.uid,
        }, { merge: true });
      } catch (e) {
        console.error('Error updating family trip in Firestore:', e);
      }
    }
  };

  const handleDeleteFamilyTrip = async (tripId: string) => {
    setFamilyTrips((prev) => {
      const filtered = prev.filter((t) => t.id !== tripId);
      localStorage.setItem(FAMILY_TRIPS_STORAGE_KEY, JSON.stringify(filtered));
      return filtered;
    });

    if (user) {
      try {
        await deleteDoc(doc(db, 'family_trips', tripId));
      } catch (e) {
        console.error('Error deleting family trip from Firestore:', e);
      }
    }
  };

  const handleResetFamilyTripsData = async () => {
    setFamilyTrips([]);
    localStorage.removeItem(FAMILY_TRIPS_STORAGE_KEY);

    if (user) {
      try {
        const qT = query(collection(db, 'family_trips'), where('userId', '==', user.uid));
        const snapT = await getDocs(qT);
        for (const d of snapT.docs) {
          await deleteDoc(doc(db, 'family_trips', d.id));
        }
      } catch (e) {
        console.error('Error resetting family trips in Firestore:', e);
      }
    }
  };

  // ================= ENTERTAINMENT: MEDIA BACKLOG HANDLERS =================
  const handleAddMediaBacklog = async (itemData: Omit<MediaBacklogItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = `media-${Date.now()}`;
    const now = new Date().toISOString();
    const newItem: MediaBacklogItem = {
      ...itemData,
      id: newId,
      createdAt: now,
      updatedAt: now,
      userId: user ? user.uid : undefined,
    };

    setMediaBacklog((prev) => {
      const updated = [newItem, ...prev];
      localStorage.setItem(MEDIA_BACKLOG_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'media_backlog', newId), {
          ...newItem,
          userId: user.uid,
        });
      } catch (e) {
        console.error('Error adding media backlog to Firestore:', e);
      }
    }
  };

  const handleUpdateMediaBacklog = async (updated: MediaBacklogItem) => {
    const now = new Date().toISOString();
    const withUpdate: MediaBacklogItem = {
      ...updated,
      updatedAt: now,
      userId: user ? user.uid : updated.userId,
    };

    setMediaBacklog((prev) => {
      const list = prev.map((m) => (m.id === updated.id ? withUpdate : m));
      localStorage.setItem(MEDIA_BACKLOG_STORAGE_KEY, JSON.stringify(list));
      return list;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'media_backlog', updated.id), {
          ...withUpdate,
          userId: user.uid,
        }, { merge: true });
      } catch (e) {
        console.error('Error updating media backlog in Firestore:', e);
      }
    }
  };

  const handleDeleteMediaBacklog = async (itemId: string) => {
    setMediaBacklog((prev) => {
      const filtered = prev.filter((m) => m.id !== itemId);
      localStorage.setItem(MEDIA_BACKLOG_STORAGE_KEY, JSON.stringify(filtered));
      return filtered;
    });

    if (user) {
      try {
        await deleteDoc(doc(db, 'media_backlog', itemId));
      } catch (e) {
        console.error('Error deleting media backlog from Firestore:', e);
      }
    }
  };

  // ================= ENTERTAINMENT: GAME BACKLOG HANDLERS =================
  const handleAddGameBacklog = async (gameData: Omit<GameBacklogItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = `game-${Date.now()}`;
    const now = new Date().toISOString();
    const newGame: GameBacklogItem = {
      ...gameData,
      id: newId,
      createdAt: now,
      updatedAt: now,
      userId: user ? user.uid : undefined,
    };

    setGameBacklog((prev) => {
      const updated = [newGame, ...prev];
      localStorage.setItem(GAME_BACKLOG_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'game_backlog', newId), {
          ...newGame,
          userId: user.uid,
        });
      } catch (e) {
        console.error('Error adding game backlog to Firestore:', e);
      }
    }
  };

  const handleUpdateGameBacklog = async (updated: GameBacklogItem) => {
    const now = new Date().toISOString();
    const withUpdate: GameBacklogItem = {
      ...updated,
      updatedAt: now,
      userId: user ? user.uid : updated.userId,
    };

    setGameBacklog((prev) => {
      const list = prev.map((g) => (g.id === updated.id ? withUpdate : g));
      localStorage.setItem(GAME_BACKLOG_STORAGE_KEY, JSON.stringify(list));
      return list;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'game_backlog', updated.id), {
          ...withUpdate,
          userId: user.uid,
        }, { merge: true });
      } catch (e) {
        console.error('Error updating game backlog in Firestore:', e);
      }
    }
  };

  const handleDeleteGameBacklog = async (gameId: string) => {
    setGameBacklog((prev) => {
      const filtered = prev.filter((g) => g.id !== gameId);
      localStorage.setItem(GAME_BACKLOG_STORAGE_KEY, JSON.stringify(filtered));
      return filtered;
    });

    if (user) {
      try {
        await deleteDoc(doc(db, 'game_backlog', gameId));
      } catch (e) {
        console.error('Error deleting game backlog from Firestore:', e);
      }
    }
  };

  // ================= ENTERTAINMENT: MEDIA REVIEWS & RATINGS HANDLERS =================
  const handleAddMediaReview = async (reviewData: Omit<MediaReviewItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = `review-${Date.now()}`;
    const now = new Date().toISOString();
    const newReview: MediaReviewItem = {
      ...reviewData,
      id: newId,
      createdAt: now,
      updatedAt: now,
      userId: user ? user.uid : undefined,
    };

    setMediaReviews((prev) => {
      const updated = [newReview, ...prev];
      localStorage.setItem(MEDIA_REVIEWS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'media_reviews', newId), {
          ...newReview,
          userId: user.uid,
        });
      } catch (e) {
        console.error('Error adding media review to Firestore:', e);
      }
    }
  };

  const handleUpdateMediaReview = async (updated: MediaReviewItem) => {
    const now = new Date().toISOString();
    const withUpdate: MediaReviewItem = {
      ...updated,
      updatedAt: now,
      userId: user ? user.uid : updated.userId,
    };

    setMediaReviews((prev) => {
      const list = prev.map((r) => (r.id === updated.id ? withUpdate : r));
      localStorage.setItem(MEDIA_REVIEWS_STORAGE_KEY, JSON.stringify(list));
      return list;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'media_reviews', updated.id), {
          ...withUpdate,
          userId: user.uid,
        }, { merge: true });
      } catch (e) {
        console.error('Error updating media review in Firestore:', e);
      }
    }
  };

  const handleDeleteMediaReview = async (reviewId: string) => {
    setMediaReviews((prev) => {
      const filtered = prev.filter((r) => r.id !== reviewId);
      localStorage.setItem(MEDIA_REVIEWS_STORAGE_KEY, JSON.stringify(filtered));
      return filtered;
    });

    if (user) {
      try {
        await deleteDoc(doc(db, 'media_reviews', reviewId));
      } catch (e) {
        console.error('Error deleting media review from Firestore:', e);
      }
    }
  };

  const handleResetEntertainmentData = async () => {
    setMediaBacklog([]);
    setGameBacklog([]);
    setMediaReviews([]);
    localStorage.removeItem(MEDIA_BACKLOG_STORAGE_KEY);
    localStorage.removeItem(GAME_BACKLOG_STORAGE_KEY);
    localStorage.removeItem(MEDIA_REVIEWS_STORAGE_KEY);

    if (user) {
      try {
        const qM = query(collection(db, 'media_backlog'), where('userId', '==', user.uid));
        const snapM = await getDocs(qM);
        for (const d of snapM.docs) {
          await deleteDoc(doc(db, 'media_backlog', d.id));
        }

        const qG = query(collection(db, 'game_backlog'), where('userId', '==', user.uid));
        const snapG = await getDocs(qG);
        for (const d of snapG.docs) {
          await deleteDoc(doc(db, 'game_backlog', d.id));
        }

        const qR = query(collection(db, 'media_reviews'), where('userId', '==', user.uid));
        const snapR = await getDocs(qR);
        for (const d of snapR.docs) {
          await deleteDoc(doc(db, 'media_reviews', d.id));
        }
      } catch (e) {
        console.error('Error resetting entertainment data in Firestore:', e);
      }
    }
  };

  // ================= FINANCES: MONTHLY FIXED BILLS HANDLERS =================
  const handleAddMonthlyBill = async (billData: Omit<MonthlyBillItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    localStorage.removeItem('lifeflow_finances_cleared');
    localStorage.removeItem('lifeflow_bills_cleared');
    const newId = `bill-${Date.now()}`;
    const now = new Date().toISOString();
    const newBill: MonthlyBillItem = {
      ...billData,
      id: newId,
      monthKey: billData.monthKey || '2026-09',
      createdAt: now,
      updatedAt: now,
      userId: user ? user.uid : undefined,
    };

    setMonthlyBills((prev) => {
      const updated = [...prev, newBill];
      updated.sort((a, b) => a.dueDay - b.dueDay);
      localStorage.setItem(MONTHLY_BILLS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'monthly_bills', newId), sanitizeForFirestore({
          ...newBill,
          userId: user.uid,
        }));
      } catch (e) {
        console.error('Error adding monthly bill to Firestore:', e);
      }
    }
  };

  const handleUpdateMonthlyBill = async (updated: MonthlyBillItem) => {
    const now = new Date().toISOString();
    const withUpdate: MonthlyBillItem = {
      ...updated,
      monthKey: updated.monthKey || '2026-09',
      updatedAt: now,
      userId: user ? user.uid : updated.userId,
    };

    setMonthlyBills((prev) => {
      const list = prev.map((b) => (b.id === updated.id ? withUpdate : b));
      list.sort((a, b) => a.dueDay - b.dueDay);
      localStorage.setItem(MONTHLY_BILLS_STORAGE_KEY, JSON.stringify(list));
      return list;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'monthly_bills', updated.id), sanitizeForFirestore({
          ...withUpdate,
          userId: user.uid,
        }), { merge: true });
      } catch (e) {
        console.error('Error updating monthly bill in Firestore:', e);
      }
    }
  };

  const handleDeleteMonthlyBill = async (billId: string) => {
    setMonthlyBills((prev) => {
      const filtered = prev.filter((b) => b.id !== billId);
      localStorage.setItem(MONTHLY_BILLS_STORAGE_KEY, JSON.stringify(filtered));
      if (filtered.length === 0) {
        localStorage.setItem('lifeflow_bills_cleared', 'true');
      }
      return filtered;
    });

    if (user) {
      try {
        await deleteDoc(doc(db, 'monthly_bills', billId));
      } catch (e) {
        console.error('Error deleting monthly bill from Firestore:', e);
      }
    }
  };

  const handleBatchSetMonthlyBills = async (bills: MonthlyBillItem[], targetMonthKey?: string) => {
    localStorage.removeItem('lifeflow_finances_cleared');
    localStorage.removeItem('lifeflow_bills_cleared');
    const sorted = [...bills].sort((a, b) => a.dueDay - b.dueDay);

    setMonthlyBills((prev) => {
      let combined: MonthlyBillItem[];
      if (targetMonthKey) {
        const otherMonths = prev.filter((b) => (b.monthKey || '2026-09') !== targetMonthKey);
        combined = [...otherMonths, ...sorted.map(b => ({ ...b, monthKey: targetMonthKey }))];
      } else {
        combined = sorted;
      }
      combined.sort((a, b) => a.dueDay - b.dueDay);
      localStorage.setItem(MONTHLY_BILLS_STORAGE_KEY, JSON.stringify(combined));
      return combined;
    });

    if (user) {
      try {
        const batch = writeBatch(db);
        const qB = query(collection(db, 'monthly_bills'), where('userId', '==', user.uid));
        const snapB = await getDocs(qB);
        snapB.docs.forEach((d) => {
          const dData = d.data();
          const docMonthKey = dData.monthKey || '2026-09';
          if (!targetMonthKey || docMonthKey === targetMonthKey) {
            batch.delete(doc(db, 'monthly_bills', d.id));
          }
        });
        sorted.forEach((bill) => {
          batch.set(doc(db, 'monthly_bills', bill.id), sanitizeForFirestore({
            ...bill,
            monthKey: bill.monthKey || targetMonthKey || '2026-09',
            userId: user.uid,
          }));
        });
        await batch.commit();
      } catch (e) {
        console.error('Error saving batch monthly bills to Firestore:', e);
      }
    }
  };

  const handleResetMonthlyBillsData = async () => {
    localStorage.setItem('lifeflow_finances_cleared', 'true');
    localStorage.setItem('lifeflow_bills_cleared', 'true');
    localStorage.setItem('lifeflow_incomes_cleared', 'true');
    localStorage.setItem('lifeflow_extra_expenses_cleared', 'true');
    localStorage.setItem('lifeflow_debts_cleared', 'true');
    localStorage.setItem('lifeflow_builder_draft_items', JSON.stringify([]));

    // Record all IDs so onSnapshot never resurrects them
    monthlyBills.forEach((b) => recordDeletedItemId(b.id));
    monthlyIncomes.forEach((i) => recordDeletedItemId(i.id));
    monthlyExtraExpenses.forEach((e) => {
      recordDeletedItemId(e.id);
      if (e.name) recordDeletedItemId(`name:${e.name.toLowerCase().trim()}`);
    });
    debts.forEach((d) => recordDeletedItemId(d.id));
    ['extra-1', 'extra-2', 'extra-3', 'income-1', 'income-2', 'debt-1', 'debt-2'].forEach((id) => recordDeletedItemId(id));

    setMonthlyBills([]);
    setMonthlyIncomes([]);
    setMonthlyExtraExpenses([]);
    setDebts([]);

    localStorage.setItem(MONTHLY_BILLS_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(MONTHLY_INCOMES_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(MONTHLY_EXTRA_EXPENSES_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(DEBTS_STORAGE_KEY, JSON.stringify([]));

    if (user) {
      try {
        const batch = writeBatch(db);
        const qB = query(collection(db, 'monthly_bills'), where('userId', '==', user.uid));
        const snapB = await getDocs(qB);
        snapB.docs.forEach((d) => batch.delete(doc(db, 'monthly_bills', d.id)));

        const qI = query(collection(db, 'monthly_incomes'), where('userId', '==', user.uid));
        const snapI = await getDocs(qI);
        snapI.docs.forEach((d) => batch.delete(doc(db, 'monthly_incomes', d.id)));

        const qE = query(collection(db, 'monthly_extra_expenses'), where('userId', '==', user.uid));
        const snapE = await getDocs(qE);
        snapE.docs.forEach((d) => batch.delete(doc(db, 'monthly_extra_expenses', d.id)));

        const qD = query(collection(db, 'debts'), where('userId', '==', user.uid));
        const snapD = await getDocs(qD);
        snapD.docs.forEach((d) => batch.delete(doc(db, 'debts', d.id)));

        // Also explicitly delete initial/seed documents
        batch.delete(doc(db, 'monthly_extra_expenses', 'extra-1'));
        batch.delete(doc(db, 'monthly_extra_expenses', 'extra-2'));
        batch.delete(doc(db, 'monthly_extra_expenses', 'extra-3'));
        batch.delete(doc(db, 'monthly_incomes', 'income-1'));
        batch.delete(doc(db, 'monthly_incomes', 'income-2'));
        batch.delete(doc(db, 'debts', 'debt-1'));
        batch.delete(doc(db, 'debts', 'debt-2'));

        await batch.commit();
      } catch (e) {
        console.error('Error resetting monthly bills data in Firestore:', e);
      }
    }
  };

  // ================= FINANCES: MONTHLY INCOMES HANDLERS =================
  const handleAddMonthlyIncome = async (incomeData: Omit<MonthlyIncomeItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    localStorage.removeItem('lifeflow_finances_cleared');
    localStorage.removeItem('lifeflow_incomes_cleared');
    const newId = `inc-${Date.now()}`;
    const now = new Date().toISOString();
    const newIncome: MonthlyIncomeItem = {
      ...incomeData,
      id: newId,
      monthKey: incomeData.monthKey || '2026-09',
      createdAt: now,
      updatedAt: now,
      userId: user ? user.uid : undefined,
    };

    setMonthlyIncomes((prev) => {
      const updated = [...prev, newIncome];
      updated.sort((a, b) => (a.dayOfMonth || 15) - (b.dayOfMonth || 15));
      localStorage.setItem(MONTHLY_INCOMES_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'monthly_incomes', newId), sanitizeForFirestore({
          ...newIncome,
          userId: user.uid,
        }));
      } catch (e) {
        console.error('Error adding monthly income to Firestore:', e);
      }
    }
  };

  const handleUpdateMonthlyIncome = async (updated: MonthlyIncomeItem) => {
    const now = new Date().toISOString();
    const withUpdate: MonthlyIncomeItem = {
      ...updated,
      monthKey: updated.monthKey || '2026-09',
      updatedAt: now,
      userId: user ? user.uid : updated.userId,
    };

    setMonthlyIncomes((prev) => {
      const list = prev.map((inc) => (inc.id === updated.id ? withUpdate : inc));
      list.sort((a, b) => (a.dayOfMonth || 15) - (b.dayOfMonth || 15));
      localStorage.setItem(MONTHLY_INCOMES_STORAGE_KEY, JSON.stringify(list));
      return list;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'monthly_incomes', updated.id), sanitizeForFirestore({
          ...withUpdate,
          userId: user.uid,
        }), { merge: true });
      } catch (e) {
        console.error('Error updating monthly income in Firestore:', e);
      }
    }
  };

  const handleDeleteMonthlyIncome = async (incomeId: string) => {
    setMonthlyIncomes((prev) => {
      const filtered = prev.filter((inc) => inc.id !== incomeId);
      localStorage.setItem(MONTHLY_INCOMES_STORAGE_KEY, JSON.stringify(filtered));
      if (filtered.length === 0) {
        localStorage.setItem('lifeflow_incomes_cleared', 'true');
      }
      return filtered;
    });

    if (user) {
      try {
        await deleteDoc(doc(db, 'monthly_incomes', incomeId));
      } catch (e) {
        console.error('Error deleting monthly income from Firestore:', e);
      }
    }
  };

  const handleBatchSetMonthlyIncomes = async (incomes: MonthlyIncomeItem[], targetMonthKey?: string) => {
    localStorage.removeItem('lifeflow_finances_cleared');
    localStorage.removeItem('lifeflow_incomes_cleared');
    const sorted = [...incomes].sort((a, b) => (a.dayOfMonth || 15) - (b.dayOfMonth || 15));

    setMonthlyIncomes((prev) => {
      let combined: MonthlyIncomeItem[];
      if (targetMonthKey) {
        const otherMonths = prev.filter((i) => (i.monthKey || '2026-09') !== targetMonthKey);
        combined = [...otherMonths, ...sorted.map(i => ({ ...i, monthKey: targetMonthKey }))];
      } else {
        combined = sorted;
      }
      combined.sort((a, b) => (a.dayOfMonth || 15) - (b.dayOfMonth || 15));
      localStorage.setItem(MONTHLY_INCOMES_STORAGE_KEY, JSON.stringify(combined));
      return combined;
    });

    if (user) {
      try {
        const batch = writeBatch(db);
        const qI = query(collection(db, 'monthly_incomes'), where('userId', '==', user.uid));
        const snapI = await getDocs(qI);
        snapI.docs.forEach((d) => {
          const dData = d.data();
          const docMonthKey = dData.monthKey || '2026-09';
          if (!targetMonthKey || docMonthKey === targetMonthKey) {
            batch.delete(doc(db, 'monthly_incomes', d.id));
          }
        });
        sorted.forEach((inc) => {
          batch.set(doc(db, 'monthly_incomes', inc.id), sanitizeForFirestore({
            ...inc,
            monthKey: inc.monthKey || targetMonthKey || '2026-09',
            userId: user.uid,
          }));
        });
        await batch.commit();
      } catch (e) {
        console.error('Error batch setting monthly incomes in Firestore:', e);
      }
    }
  };

  // ================= FINANCES: MONTHLY EXTRA EXPENSES HANDLERS =================
  const handleAddMonthlyExtraExpense = async (extraData: Omit<MonthlyExtraExpenseItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    localStorage.removeItem('lifeflow_finances_cleared');
    localStorage.removeItem('lifeflow_extra_expenses_cleared');
    const newId = `extra-${Date.now()}`;
    const now = new Date().toISOString();
    const newExtra: MonthlyExtraExpenseItem = {
      ...extraData,
      id: newId,
      monthKey: extraData.monthKey || '2026-09',
      createdAt: now,
      updatedAt: now,
      userId: user ? user.uid : undefined,
    };

    setMonthlyExtraExpenses((prev) => {
      const updated = [...prev, newExtra];
      updated.sort((a, b) => (a.dayOfMonth || 15) - (b.dayOfMonth || 15));
      localStorage.setItem(MONTHLY_EXTRA_EXPENSES_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'monthly_extra_expenses', newId), sanitizeForFirestore({
          ...newExtra,
          userId: user.uid,
        }));
      } catch (e) {
        console.error('Error adding monthly extra expense to Firestore:', e);
      }
    }
  };

  const handleUpdateMonthlyExtraExpense = async (updated: MonthlyExtraExpenseItem) => {
    const now = new Date().toISOString();
    const withUpdate: MonthlyExtraExpenseItem = {
      ...updated,
      monthKey: updated.monthKey || '2026-09',
      updatedAt: now,
      userId: user ? user.uid : updated.userId,
    };

    setMonthlyExtraExpenses((prev) => {
      const list = prev.map((ext) => (ext.id === updated.id ? withUpdate : ext));
      list.sort((a, b) => (a.dayOfMonth || 15) - (b.dayOfMonth || 15));
      localStorage.setItem(MONTHLY_EXTRA_EXPENSES_STORAGE_KEY, JSON.stringify(list));
      return list;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'monthly_extra_expenses', updated.id), sanitizeForFirestore({
          ...withUpdate,
          userId: user.uid,
        }), { merge: true });
      } catch (e) {
        console.error('Error updating monthly extra expense in Firestore:', e);
      }
    }
  };

  const handleDeleteMonthlyExtraExpense = async (extraId: string) => {
    recordDeletedItemId(extraId);
    const itemToDelete = monthlyExtraExpenses.find((ext) => ext.id === extraId);
    if (itemToDelete?.name) {
      recordDeletedItemId(`name:${itemToDelete.name.toLowerCase().trim()}`);
    }

    setMonthlyExtraExpenses((prev) => {
      const filtered = prev.filter((ext) => ext.id !== extraId && (!itemToDelete?.name || ext.name !== itemToDelete.name));
      localStorage.setItem(MONTHLY_EXTRA_EXPENSES_STORAGE_KEY, JSON.stringify(filtered));
      if (filtered.length === 0) {
        localStorage.setItem('lifeflow_extra_expenses_cleared', 'true');
      }
      return filtered;
    });

    if (user) {
      try {
        await deleteDoc(doc(db, 'monthly_extra_expenses', extraId)).catch(() => {});
        const q1 = query(collection(db, 'monthly_extra_expenses'), where('id', '==', extraId));
        const snap1 = await getDocs(q1);
        snap1.docs.forEach((d) => deleteDoc(d.ref).catch(() => {}));
        if (itemToDelete?.name) {
          const qName = query(collection(db, 'monthly_extra_expenses'), where('userId', '==', user.uid), where('name', '==', itemToDelete.name));
          const snapName = await getDocs(qName);
          snapName.docs.forEach((d) => deleteDoc(d.ref).catch(() => {}));
        }
      } catch (e) {
        console.error('Error deleting monthly extra expense from Firestore:', e);
      }
    }
  };

  const handleBatchSetMonthlyExtraExpenses = async (extras: MonthlyExtraExpenseItem[], targetMonthKey?: string) => {
    if (extras.length === 0) {
      if (targetMonthKey) {
        setMonthlyExtraExpenses((prev) => {
          const otherMonths = prev.filter((e) => (e.monthKey || '2026-09') !== targetMonthKey);
          localStorage.setItem(MONTHLY_EXTRA_EXPENSES_STORAGE_KEY, JSON.stringify(otherMonths));
          return otherMonths;
        });
        if (user) {
          try {
            const batch = writeBatch(db);
            const qE = query(collection(db, 'monthly_extra_expenses'), where('userId', '==', user.uid));
            const snapE = await getDocs(qE);
            snapE.docs.forEach((d) => {
              const dData = d.data();
              const docMonthKey = dData.monthKey || '2026-09';
              if (docMonthKey === targetMonthKey) {
                batch.delete(doc(db, 'monthly_extra_expenses', d.id));
              }
            });
            await batch.commit();
          } catch (e) {
            console.error('Error clearing monthly extra expenses for month in Firestore:', e);
          }
        }
        return;
      }

      localStorage.setItem('lifeflow_extra_expenses_cleared', 'true');
      monthlyExtraExpenses.forEach((e) => {
        recordDeletedItemId(e.id);
        if (e.name) recordDeletedItemId(`name:${e.name.toLowerCase().trim()}`);
      });
      ['extra-1', 'extra-2', 'extra-3'].forEach((id) => recordDeletedItemId(id));
      setMonthlyExtraExpenses([]);
      localStorage.setItem(MONTHLY_EXTRA_EXPENSES_STORAGE_KEY, JSON.stringify([]));

      if (user) {
        try {
          const batch = writeBatch(db);
          const qE = query(collection(db, 'monthly_extra_expenses'), where('userId', '==', user.uid));
          const snapE = await getDocs(qE);
          snapE.docs.forEach((d) => batch.delete(doc(db, 'monthly_extra_expenses', d.id)));
          batch.delete(doc(db, 'monthly_extra_expenses', 'extra-1'));
          batch.delete(doc(db, 'monthly_extra_expenses', 'extra-2'));
          batch.delete(doc(db, 'monthly_extra_expenses', 'extra-3'));
          await batch.commit();
        } catch (e) {
          console.error('Error clearing monthly extra expenses in Firestore:', e);
        }
      }
      return;
    }

    localStorage.removeItem('lifeflow_finances_cleared');
    localStorage.removeItem('lifeflow_extra_expenses_cleared');
    const sorted = [...extras].sort((a, b) => (a.dayOfMonth || 15) - (b.dayOfMonth || 15));

    setMonthlyExtraExpenses((prev) => {
      let combined: MonthlyExtraExpenseItem[];
      if (targetMonthKey) {
        const otherMonths = prev.filter((e) => (e.monthKey || '2026-09') !== targetMonthKey);
        combined = [...otherMonths, ...sorted.map(e => ({ ...e, monthKey: targetMonthKey }))];
      } else {
        combined = sorted;
      }
      combined.sort((a, b) => (a.dayOfMonth || 15) - (b.dayOfMonth || 15));
      localStorage.setItem(MONTHLY_EXTRA_EXPENSES_STORAGE_KEY, JSON.stringify(combined));
      return combined;
    });

    if (user) {
      try {
        const batch = writeBatch(db);
        const qE = query(collection(db, 'monthly_extra_expenses'), where('userId', '==', user.uid));
        const snapE = await getDocs(qE);
        snapE.docs.forEach((d) => {
          const dData = d.data();
          const docMonthKey = dData.monthKey || '2026-09';
          if (!targetMonthKey || docMonthKey === targetMonthKey) {
            batch.delete(doc(db, 'monthly_extra_expenses', d.id));
          }
        });
        sorted.forEach((ext) => {
          batch.set(doc(db, 'monthly_extra_expenses', ext.id), sanitizeForFirestore({
            ...ext,
            monthKey: ext.monthKey || targetMonthKey || '2026-09',
            userId: user.uid,
          }));
        });
        await batch.commit();
      } catch (e) {
        console.error('Error batch setting monthly extra expenses in Firestore:', e);
      }
    }
  };

  // ================= FINANCES: DEBTS & LOANS TRACKING HANDLERS =================
  const handleAddDebt = async (debtData: Omit<DebtItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    localStorage.removeItem('lifeflow_finances_cleared');
    localStorage.removeItem('lifeflow_debts_cleared');
    const newId = `debt-${Date.now()}`;
    const now = new Date().toISOString();
    const newDebt: DebtItem = {
      ...debtData,
      id: newId,
      createdAt: now,
      updatedAt: now,
      userId: user ? user.uid : undefined,
    };

    setDebts((prev) => {
      const updated = [newDebt, ...prev];
      localStorage.setItem(DEBTS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'debts', newId), sanitizeForFirestore({
          ...newDebt,
          userId: user.uid,
        }));
      } catch (e) {
        console.error('Error adding debt to Firestore:', e);
      }
    }
  };

  const handleUpdateDebt = async (updated: DebtItem) => {
    const now = new Date().toISOString();
    const withUpdate: DebtItem = {
      ...updated,
      updatedAt: now,
      userId: user ? user.uid : updated.userId,
    };

    setDebts((prev) => {
      const list = prev.map((d) => (d.id === updated.id ? withUpdate : d));
      localStorage.setItem(DEBTS_STORAGE_KEY, JSON.stringify(list));
      return list;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'debts', updated.id), sanitizeForFirestore({
          ...withUpdate,
          userId: user.uid,
        }), { merge: true });
      } catch (e) {
        console.error('Error updating debt in Firestore:', e);
      }
    }
  };

  const handleDeleteDebt = async (debtId: string) => {
    setDebts((prev) => {
      const filtered = prev.filter((d) => d.id !== debtId);
      localStorage.setItem(DEBTS_STORAGE_KEY, JSON.stringify(filtered));
      if (filtered.length === 0) {
        localStorage.setItem('lifeflow_debts_cleared', 'true');
      }
      return filtered;
    });

    if (user) {
      try {
        await deleteDoc(doc(db, 'debts', debtId));
      } catch (e) {
        console.error('Error deleting debt from Firestore:', e);
      }
    }
  };

  const handlePayDebtInstallment = async (debtId: string, paymentData: Omit<DebtPaymentRecord, 'id'>) => {
    const debt = debts.find((d) => d.id === debtId);
    if (!debt) return;

    const newPayment: DebtPaymentRecord = {
      ...paymentData,
      id: `pay-${Date.now()}`,
    };

    const newCurrentBalance = Math.max(0, debt.currentBalance - paymentData.amount);
    const newPaidInstallments = debt.paidInstallments + 1;
    const isNowPaidOff = newCurrentBalance <= 0 || newPaidInstallments >= debt.totalInstallments;

    const updatedDebt: DebtItem = {
      ...debt,
      currentBalance: newCurrentBalance,
      paidInstallments: newPaidInstallments,
      status: isNowPaidOff ? 'pagada' : 'activa',
      paymentHistory: [newPayment, ...(debt.paymentHistory || [])],
      updatedAt: new Date().toISOString(),
    };

    await handleUpdateDebt(updatedDebt);
  };

  const handleBatchSetDebts = async (newDebts: DebtItem[]) => {
    localStorage.removeItem('lifeflow_finances_cleared');
    localStorage.removeItem('lifeflow_debts_cleared');
    setDebts(newDebts);
    localStorage.setItem(DEBTS_STORAGE_KEY, JSON.stringify(newDebts));

    if (user) {
      try {
        const batch = writeBatch(db);
        const qD = query(collection(db, 'debts'), where('userId', '==', user.uid));
        const snapD = await getDocs(qD);
        snapD.docs.forEach((d) => batch.delete(doc(db, 'debts', d.id)));
        newDebts.forEach((d) => {
          batch.set(doc(db, 'debts', d.id), sanitizeForFirestore({
            ...d,
            userId: user.uid,
          }));
        });
        await batch.commit();
      } catch (e) {
        console.error('Error batch setting debts in Firestore:', e);
      }
    }
  };

  // ================= LEARNING & SKILLS: BOOKS LIBRARY HANDLERS =================
  const handleAddBook = async (bookData: Omit<BookItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = `book-${Date.now()}`;
    const now = new Date().toISOString();
    const newBook: BookItem = {
      ...bookData,
      id: newId,
      createdAt: now,
      updatedAt: now,
      userId: user ? user.uid : undefined,
    };

    setBooks((prev) => {
      const updated = [newBook, ...prev];
      localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'books', newId), sanitizeForFirestore({
          ...newBook,
          userId: user.uid,
        }));
      } catch (e) {
        console.error('Error adding book to Firestore:', e);
      }
    }
  };

  const handleUpdateBook = async (updated: BookItem) => {
    const now = new Date().toISOString();
    const withUpdate: BookItem = {
      ...updated,
      updatedAt: now,
      userId: user ? user.uid : updated.userId,
    };

    setBooks((prev) => {
      const list = prev.map((b) => (b.id === updated.id ? withUpdate : b));
      localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(list));
      return list;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'books', updated.id), sanitizeForFirestore({
          ...withUpdate,
          userId: user.uid,
        }), { merge: true });
      } catch (e) {
        console.error('Error updating book in Firestore:', e);
      }
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    setBooks((prev) => {
      const filtered = prev.filter((b) => b.id !== bookId);
      localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(filtered));
      return filtered;
    });

    if (user) {
      try {
        await deleteDoc(doc(db, 'books', bookId));
      } catch (e) {
        console.error('Error deleting book from Firestore:', e);
      }
    }
  };

  const handleQuickUpdateBookProgress = async (bookId: string, newCurrentPage: number, sessionNote?: string) => {
    const book = books.find((b) => b.id === bookId);
    if (!book) return;

    const isNowFinished = newCurrentPage >= book.totalPages;
    const now = new Date().toISOString();
    const newSession = sessionNote ? {
      id: `session-${Date.now()}`,
      date: now.split('T')[0],
      pagesRead: Math.max(0, newCurrentPage - book.currentPage),
      endPage: newCurrentPage,
      note: sessionNote,
    } : undefined;

    const updatedBook: BookItem = {
      ...book,
      currentPage: Math.min(newCurrentPage, book.totalPages),
      status: isNowFinished ? 'leido' : book.status === 'por_leer' ? 'leyendo' : book.status,
      completedDate: isNowFinished ? now.split('T')[0] : book.completedDate,
      startDate: (!book.startDate && newCurrentPage > 0) ? now.split('T')[0] : book.startDate,
      updatedAt: now,
      readingSessions: newSession ? [newSession, ...(book.readingSessions || [])] : book.readingSessions,
    };

    handleUpdateBook(updatedBook);
  };

  const handleAddReadingQuote = async (quoteData: Omit<ReadingQuote, 'id' | 'createdAt'>) => {
    const newId = `quote-${Date.now()}`;
    const now = new Date().toISOString();
    const newQuote: ReadingQuote = {
      ...quoteData,
      id: newId,
      createdAt: now,
      userId: user ? user.uid : undefined,
    };

    setReadingQuotes((prev) => {
      const updated = [newQuote, ...prev];
      localStorage.setItem(READING_QUOTES_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'reading_quotes', newId), sanitizeForFirestore({
          ...newQuote,
          userId: user.uid,
        }));
      } catch (e) {
        console.error('Error adding reading quote to Firestore:', e);
      }
    }
  };

  const handleDeleteReadingQuote = async (quoteId: string) => {
    setReadingQuotes((prev) => {
      const filtered = prev.filter((q) => q.id !== quoteId);
      localStorage.setItem(READING_QUOTES_STORAGE_KEY, JSON.stringify(filtered));
      return filtered;
    });

    if (user) {
      try {
        await deleteDoc(doc(db, 'reading_quotes', quoteId));
      } catch (e) {
        console.error('Error deleting reading quote from Firestore:', e);
      }
    }
  };

  const handleResetBooksData = async () => {
    if (window.confirm('¿Deseas restaurar la biblioteca de libros con los ejemplos recomendados?')) {
      setBooks(INITIAL_BOOKS);
      setReadingQuotes(INITIAL_READING_QUOTES);
      localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(INITIAL_BOOKS));
      localStorage.setItem(READING_QUOTES_STORAGE_KEY, JSON.stringify(INITIAL_READING_QUOTES));

      if (user) {
        try {
          const qB = query(collection(db, 'books'), where('userId', '==', user.uid));
          const snapB = await getDocs(qB);
          for (const d of snapB.docs) {
            await deleteDoc(doc(db, 'books', d.id));
          }
          for (const b of INITIAL_BOOKS) {
            await setDoc(doc(db, 'books', b.id), { ...b, userId: user.uid });
          }

          const qQ = query(collection(db, 'reading_quotes'), where('userId', '==', user.uid));
          const snapQ = await getDocs(qQ);
          for (const d of snapQ.docs) {
            await deleteDoc(doc(db, 'reading_quotes', d.id));
          }
          for (const q of INITIAL_READING_QUOTES) {
            await setDoc(doc(db, 'reading_quotes', q.id), { ...q, userId: user.uid });
          }
        } catch (e) {
          console.error('Error resetting books data in Firestore:', e);
        }
      }
    }
  };

  const handleAddSmartPurchase = async (purchaseData: Omit<SmartPurchaseGoal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = `purchase-${Date.now()}`;
    const now = new Date().toISOString();
    const newPurchase: SmartPurchaseGoal = {
      ...purchaseData,
      id: newId,
      createdAt: now,
      updatedAt: now,
      userId: user ? user.uid : undefined,
    };

    setSmartPurchases((prev) => {
      const updated = [newPurchase, ...prev];
      localStorage.setItem(SMART_PURCHASES_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'smart_purchases', newId), sanitizeForFirestore({
          ...newPurchase,
          userId: user.uid,
        }));
      } catch (e) {
        console.error('Error adding smart purchase to Firestore:', e);
      }
    }
  };

  const handleUpdateSmartPurchase = async (updated: SmartPurchaseGoal) => {
    const now = new Date().toISOString();
    const withUpdate: SmartPurchaseGoal = {
      ...updated,
      updatedAt: now,
      userId: user ? user.uid : updated.userId,
    };

    setSmartPurchases((prev) => {
      const list = prev.map((p) => (p.id === updated.id ? withUpdate : p));
      localStorage.setItem(SMART_PURCHASES_STORAGE_KEY, JSON.stringify(list));
      return list;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'smart_purchases', updated.id), sanitizeForFirestore({
          ...withUpdate,
          userId: user.uid,
        }), { merge: true });
      } catch (e) {
        console.error('Error updating smart purchase in Firestore:', e);
      }
    }
  };

  const handleDeleteSmartPurchase = async (purchaseId: string) => {
    setSmartPurchases((prev) => {
      const filtered = prev.filter((p) => p.id !== purchaseId);
      localStorage.setItem(SMART_PURCHASES_STORAGE_KEY, JSON.stringify(filtered));
      return filtered;
    });

    if (user) {
      try {
        await deleteDoc(doc(db, 'smart_purchases', purchaseId));
      } catch (e) {
        console.error('Error deleting smart purchase from Firestore:', e);
      }
    }
  };

  const handleResetSmartPurchasesData = async () => {
    if (window.confirm('¿Deseas restaurar las compras inteligentes programadas con los ejemplos iniciales?')) {
      setSmartPurchases(INITIAL_SMART_PURCHASES);
      localStorage.setItem(SMART_PURCHASES_STORAGE_KEY, JSON.stringify(INITIAL_SMART_PURCHASES));

      if (user) {
        try {
          const qP = query(collection(db, 'smart_purchases'), where('userId', '==', user.uid));
          const snapP = await getDocs(qP);
          for (const d of snapP.docs) {
            await deleteDoc(doc(db, 'smart_purchases', d.id));
          }
          for (const p of INITIAL_SMART_PURCHASES) {
            await setDoc(doc(db, 'smart_purchases', p.id), sanitizeForFirestore({ ...p, userId: user.uid }));
          }
        } catch (e) {
          console.error('Error resetting smart purchases in Firestore:', e);
        }
      }
    }
  };

  const handleResetAllData = async () => {
    if (window.confirm('¿Deseas reiniciar y limpiar los datos para comenzar desde cero? Se borrarán todos los datos y metas de ejemplo.')) {
      setTasks([]);
      setIdeas([]);
      setHabits([]);
      setHealthProfile(INITIAL_HEALTH_PROFILE);
      setWeightLogs([]);
      setCalorieLogs([]);
      setVehicles([]);
      setVehicleMaintenances([]);
      setMedicalAppointments([]);
      setMedicalExamNotes([]);
      setFamilyTrips([]);
      setMediaBacklog([]);
      setGameBacklog([]);
      setMediaReviews([]);
      setMonthlyBills([]);
      setMonthlyIncomes([]);
      setMonthlyExtraExpenses([]);
      setDebts([]);
      setBooks([]);
      setReadingQuotes([]);
      setSmartPurchases([]);

      deletedItemIdsRef.current.clear();
      try {
        localStorage.removeItem(DELETED_ITEMS_STORAGE_KEY);
      } catch {}

      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(HEALTH_PROFILE_STORAGE_KEY, JSON.stringify(INITIAL_HEALTH_PROFILE));
      localStorage.setItem(WEIGHT_LOGS_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(DAILY_CALORIE_LOGS_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(VEHICLE_MAINTENANCE_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(MEDICAL_APPOINTMENTS_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(MEDICAL_EXAM_NOTES_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(FAMILY_TRIPS_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(MEDIA_BACKLOG_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(GAME_BACKLOG_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(MEDIA_REVIEWS_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(MONTHLY_BILLS_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(MONTHLY_INCOMES_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(MONTHLY_EXTRA_EXPENSES_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(DEBTS_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(READING_QUOTES_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(SMART_PURCHASES_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem('lifeflow_initialized_v1', 'true');
      localStorage.setItem('lifeflow_tasks_cleared', 'true');
      localStorage.setItem('lifeflow_ideas_cleared', 'true');
      localStorage.setItem('lifeflow_finances_cleared', 'true');
      localStorage.setItem('lifeflow_bills_cleared', 'true');
      localStorage.setItem('lifeflow_incomes_cleared', 'true');
      localStorage.setItem('lifeflow_extra_expenses_cleared', 'true');
      localStorage.setItem('lifeflow_debts_cleared', 'true');
      localStorage.setItem('lifeflow_builder_draft_items', JSON.stringify([]));
      localStorage.setItem('lifeflow_habits_cleared', 'true');

      if (user) {
        try {
          const collectionsToClear = [
            'tasks',
            'ideas',
            'habits',
            'weight_logs',
            'calorie_logs',
            'vehicles',
            'vehicle_maintenances',
            'medical_appointments',
            'medical_exam_notes',
            'family_trips',
            'media_backlog',
            'game_backlog',
            'media_reviews',
            'monthly_bills',
            'monthly_incomes',
            'monthly_extra_expenses',
            'debts',
            'books',
            'reading_quotes',
            'smart_purchases',
          ];

          for (const colName of collectionsToClear) {
            const q = query(collection(db, colName), where('userId', '==', user.uid));
            const snap = await getDocs(q);
            for (const d of snap.docs) {
              await deleteDoc(doc(db, colName, d.id));
            }
          }

          await setDoc(doc(db, 'users', user.uid), { initialized: true, resetAt: new Date().toISOString() }, { merge: true });
          await setDoc(doc(db, 'health_profiles', user.uid), { ...INITIAL_HEALTH_PROFILE, userId: user.uid });
        } catch (e) {
          console.error('Error clearing user data in Firestore:', e);
        }
      }

      alert('¡Listo! Se han eliminado todos los datos y metas de ejemplo. Tu aplicación está 100% limpia y lista para tu uso diario.');
    }
  };

  const handleLoadExamples = async () => {
    try {
      localStorage.removeItem('lifeflow_tasks_cleared');
      localStorage.removeItem('lifeflow_ideas_cleared');
      localStorage.removeItem('lifeflow_finances_cleared');
      localStorage.removeItem('lifeflow_bills_cleared');
      localStorage.removeItem('lifeflow_incomes_cleared');
      localStorage.removeItem('lifeflow_extra_expenses_cleared');
      localStorage.removeItem('lifeflow_debts_cleared');
      localStorage.removeItem('lifeflow_builder_draft_items');
      localStorage.removeItem('lifeflow_habits_cleared');
    } catch {}

    const seedLogs = generateSeedWeightLogs();
    setTasks(INITIAL_TASKS);
    setIdeas(INITIAL_IDEAS);
    setHabits(INITIAL_HABITS);
    setHealthProfile(INITIAL_HEALTH_PROFILE);
    setWeightLogs(seedLogs);
    setCalorieLogs(INITIAL_DAILY_CALORIE_LOGS);
    setVehicles(INITIAL_VEHICLES);
    setVehicleMaintenances(INITIAL_VEHICLE_MAINTENANCES);
    setMedicalAppointments(INITIAL_MEDICAL_APPOINTMENTS);
    setMedicalExamNotes(INITIAL_MEDICAL_EXAM_NOTES);
    setFamilyTrips(INITIAL_FAMILY_TRIPS);
    setMediaBacklog(INITIAL_MEDIA_BACKLOG);
    setGameBacklog(INITIAL_GAME_BACKLOG);
    setMediaReviews(INITIAL_MEDIA_REVIEWS);
    setMonthlyBills(INITIAL_MONTHLY_BILLS);
    setMonthlyIncomes(INITIAL_MONTHLY_INCOMES);
    setMonthlyExtraExpenses(INITIAL_MONTHLY_EXTRA_EXPENSES);
    setDebts(INITIAL_DEBTS);
    setBooks(INITIAL_BOOKS);
    setReadingQuotes(INITIAL_READING_QUOTES);
    setSmartPurchases(INITIAL_SMART_PURCHASES);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TASKS));
    localStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify(INITIAL_IDEAS));
    localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(INITIAL_HABITS));
    localStorage.setItem(HEALTH_PROFILE_STORAGE_KEY, JSON.stringify(INITIAL_HEALTH_PROFILE));
    localStorage.setItem(WEIGHT_LOGS_STORAGE_KEY, JSON.stringify(seedLogs));
    localStorage.setItem(DAILY_CALORIE_LOGS_STORAGE_KEY, JSON.stringify(INITIAL_DAILY_CALORIE_LOGS));
    localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(INITIAL_VEHICLES));
    localStorage.setItem(VEHICLE_MAINTENANCE_STORAGE_KEY, JSON.stringify(INITIAL_VEHICLE_MAINTENANCES));
    localStorage.setItem(MEDICAL_APPOINTMENTS_STORAGE_KEY, JSON.stringify(INITIAL_MEDICAL_APPOINTMENTS));
    localStorage.setItem(MEDICAL_EXAM_NOTES_STORAGE_KEY, JSON.stringify(INITIAL_MEDICAL_EXAM_NOTES));
    localStorage.setItem(FAMILY_TRIPS_STORAGE_KEY, JSON.stringify(INITIAL_FAMILY_TRIPS));
    localStorage.setItem(MEDIA_BACKLOG_STORAGE_KEY, JSON.stringify(INITIAL_MEDIA_BACKLOG));
    localStorage.setItem(GAME_BACKLOG_STORAGE_KEY, JSON.stringify(INITIAL_GAME_BACKLOG));
    localStorage.setItem(MEDIA_REVIEWS_STORAGE_KEY, JSON.stringify(INITIAL_MEDIA_REVIEWS));
    localStorage.setItem(MONTHLY_BILLS_STORAGE_KEY, JSON.stringify(INITIAL_MONTHLY_BILLS));
    localStorage.setItem(MONTHLY_INCOMES_STORAGE_KEY, JSON.stringify(INITIAL_MONTHLY_INCOMES));
    localStorage.setItem(MONTHLY_EXTRA_EXPENSES_STORAGE_KEY, JSON.stringify(INITIAL_MONTHLY_EXTRA_EXPENSES));
    localStorage.setItem(DEBTS_STORAGE_KEY, JSON.stringify(INITIAL_DEBTS));
    localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(INITIAL_BOOKS));
    localStorage.setItem(READING_QUOTES_STORAGE_KEY, JSON.stringify(INITIAL_READING_QUOTES));
    localStorage.setItem(SMART_PURCHASES_STORAGE_KEY, JSON.stringify(INITIAL_SMART_PURCHASES));
    localStorage.setItem('lifeflow_initialized_v1', 'true');

    if (user) {
      try {
        for (const t of INITIAL_TASKS) {
          await setDoc(doc(db, 'tasks', t.id), { ...t, userId: user.uid });
        }
        for (const i of INITIAL_IDEAS) {
          await setDoc(doc(db, 'ideas', i.id), { ...i, userId: user.uid });
        }
        for (const h of INITIAL_HABITS) {
          await setDoc(doc(db, 'habits', h.id), { ...h, userId: user.uid });
        }
        await setDoc(doc(db, 'health_profiles', user.uid), { ...INITIAL_HEALTH_PROFILE, userId: user.uid });
        for (const log of seedLogs) {
          await setDoc(doc(db, 'weight_logs', log.id), { ...log, userId: user.uid });
        }
        for (const cLog of INITIAL_DAILY_CALORIE_LOGS) {
          await setDoc(doc(db, 'calorie_logs', cLog.id), { ...cLog, userId: user.uid });
        }
        for (const v of INITIAL_VEHICLES) {
          await setDoc(doc(db, 'vehicles', v.id), { ...v, userId: user.uid });
        }
        for (const m of INITIAL_VEHICLE_MAINTENANCES) {
          await setDoc(doc(db, 'vehicle_maintenances', m.id), { ...m, userId: user.uid });
        }
        for (const a of INITIAL_MEDICAL_APPOINTMENTS) {
          await setDoc(doc(db, 'medical_appointments', a.id), { ...a, userId: user.uid });
        }
        for (const e of INITIAL_MEDICAL_EXAM_NOTES) {
          await setDoc(doc(db, 'medical_exam_notes', e.id), { ...e, userId: user.uid });
        }
        for (const tr of INITIAL_FAMILY_TRIPS) {
          await setDoc(doc(db, 'family_trips', tr.id), { ...tr, userId: user.uid });
        }
        for (const mb of INITIAL_MEDIA_BACKLOG) {
          await setDoc(doc(db, 'media_backlog', mb.id), { ...mb, userId: user.uid });
        }
        for (const gb of INITIAL_GAME_BACKLOG) {
          await setDoc(doc(db, 'game_backlog', gb.id), { ...gb, userId: user.uid });
        }
        for (const mr of INITIAL_MEDIA_REVIEWS) {
          await setDoc(doc(db, 'media_reviews', mr.id), { ...mr, userId: user.uid });
        }
        for (const bill of INITIAL_MONTHLY_BILLS) {
          await setDoc(doc(db, 'monthly_bills', bill.id), { ...bill, userId: user.uid });
        }
        for (const inc of INITIAL_MONTHLY_INCOMES) {
          await setDoc(doc(db, 'monthly_incomes', inc.id), { ...inc, userId: user.uid });
        }
        for (const ext of INITIAL_MONTHLY_EXTRA_EXPENSES) {
          await setDoc(doc(db, 'monthly_extra_expenses', ext.id), { ...ext, userId: user.uid });
        }
        for (const dbt of INITIAL_DEBTS) {
          await setDoc(doc(db, 'debts', dbt.id), sanitizeForFirestore({ ...dbt, userId: user.uid }));
        }
        for (const bk of INITIAL_BOOKS) {
          await setDoc(doc(db, 'books', bk.id), { ...bk, userId: user.uid });
        }
        for (const qt of INITIAL_READING_QUOTES) {
          await setDoc(doc(db, 'reading_quotes', qt.id), { ...qt, userId: user.uid });
        }
        for (const p of INITIAL_SMART_PURCHASES) {
          await setDoc(doc(db, 'smart_purchases', p.id), sanitizeForFirestore({ ...p, userId: user.uid }));
        }
      } catch (e) {
        console.error('Error reloading examples to Firestore:', e);
      }
    }
  };

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden ${isDark ? 'bg-[#0b1326] text-slate-100 dark' : 'bg-slate-50 text-slate-900 light'} flex flex-col font-sans selection:bg-[#00f2ff] selection:text-[#0b1326] transition-colors duration-200`}>
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tasks={tasks}
        habitsCount={habits.length}
        ideasCount={ideas.length}
        agedIdeasCount={agedIdeasCount}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        ideas={ideas}
        onOpenNewTaskModal={() => handleOpenNewTaskModal()}
        user={user}
        onOpenAuth={handleOpenAuth}
        onSignOut={handleSignOut}
        onResetAllData={handleResetAllData}
        onLoadExamples={handleLoadExamples}
        onOpenAgent={() => setIsAgentModalOpen(true)}
        onOpenAssistantIntegration={() => setIsAssistantIntegrationOpen(true)}
        onOpenBrainDump={() => setIsGlobalBrainDumpOpen(true)}
        onOpenInstallApp={() => setIsInstallAppModalOpen(true)}
        onOpenNotifications={() => setIsWebPushModalOpen(true)}
        onGoHome={handleGoHome}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6 space-y-6">
        
        {/* Proactive AI Coach Assistant Banner */}
        <AgentBanner
          tasks={tasks}
          categories={categories}
          onOpenLogHours={handleOpenLogHours}
          onOpenAgentModal={(task) => {
            setAgentModalTask(task || null);
            setIsAgentModalOpen(true);
          }}
          onToggleSubgoal={handleToggleSubgoal}
        />

        {/* Google Calendar Direct Visibility & Sync Hub Card */}
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-all shadow-md ${
          isDark ? 'bg-gradient-to-r from-[#111a2e] via-[#162444] to-[#111a2e] border-blue-500/30' : 'bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-teal-50/60 border-blue-200'
        }`}>
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#4285F4]/20 border border-[#4285F4]/40 flex items-center justify-center text-[#4285F4] shrink-0 shadow-xs">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap">
                <span className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Google Calendar Oficial
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                  En Vivo
                </span>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {user?.email || 'miguelpatino0@gmail.com'}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Tus compromisos, tareas y órdenes del bot sincronizadas en tiempo real con Google.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('calendario')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#4285F4] to-cyan-500 hover:brightness-110 text-white font-bold text-xs shrink-0 flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all active:scale-95"
          >
            <span>Abrir Google Calendar</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {activeTab === 'gestion' && (
          <TaskManagement
            tasks={tasks}
            ideas={ideas}
            categories={categories}
            healthProfile={healthProfile}
            weightLogs={weightLogs}
            calorieLogs={calorieLogs}
            vehicles={vehicles}
            vehicleMaintenances={vehicleMaintenances}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onOpenNewTaskModal={handleOpenNewTaskModal}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onLogHours={handleOpenLogHours}
            onQuickStatusChange={handleQuickStatusChange}
            onToggleSubgoal={handleToggleSubgoal}
            onAssignToCalendar={handleAssignToCalendar}
            onRolloverTask={handleRolloverTaskToNextDay}
            onAddIdea={handleAddIdea}
            onAddBatchIdeas={handleAddBatchIdeas}
            onAddBatchTasks={handleAddBatchTasks}
            onDeleteIdea={handleDeleteIdea}
            onConvertIdeaToTask={handleConvertIdeaToTask}
            onResetAllData={handleResetAllData}
            onLoadExamples={handleLoadExamples}
            onUpdateHealthProfile={handleUpdateHealthProfile}
            onAddWeightLog={handleAddWeightLog}
            onDeleteWeightLog={handleDeleteWeightLog}
            onSaveDailyCalorieLog={handleSaveDailyCalorieLog}
            onDeleteDailyCalorieLog={handleDeleteDailyCalorieLog}
            onAddVehicle={handleAddVehicle}
            onUpdateVehicle={handleUpdateVehicle}
            onDeleteVehicle={handleDeleteVehicle}
            onAddVehicleMaintenance={handleAddVehicleMaintenance}
            onUpdateVehicleMaintenance={handleUpdateVehicleMaintenance}
            onDeleteVehicleMaintenance={handleDeleteVehicleMaintenance}
            onRecordOilChange={handleRecordOilChange}
            onQuickUpdateMileage={handleQuickUpdateMileage}
            onResetVehiclesData={handleResetVehiclesData}
            onResetHealthData={handleResetHealthData}
            onResetCategoryData={handleResetCategoryData}
            medicalAppointments={medicalAppointments}
            medicalExamNotes={medicalExamNotes}
            onAddMedicalAppointment={handleAddMedicalAppointment}
            onUpdateMedicalAppointment={handleUpdateMedicalAppointment}
            onDeleteMedicalAppointment={handleDeleteMedicalAppointment}
            onAddMedicalExamNote={handleAddMedicalExamNote}
            onUpdateMedicalExamNote={handleUpdateMedicalExamNote}
            onDeleteMedicalExamNote={handleDeleteMedicalExamNote}
            onResetMedicalData={handleResetMedicalData}
            familyTrips={familyTrips}
            onAddFamilyTrip={handleAddFamilyTrip}
            onUpdateFamilyTrip={handleUpdateFamilyTrip}
            onDeleteFamilyTrip={handleDeleteFamilyTrip}
            onResetFamilyTripsData={handleResetFamilyTripsData}
            mediaBacklog={mediaBacklog}
            gameBacklog={gameBacklog}
            mediaReviews={mediaReviews}
            onAddMediaBacklog={handleAddMediaBacklog}
            onUpdateMediaBacklog={handleUpdateMediaBacklog}
            onDeleteMediaBacklog={handleDeleteMediaBacklog}
            onAddGameBacklog={handleAddGameBacklog}
            onUpdateGameBacklog={handleUpdateGameBacklog}
            onDeleteGameBacklog={handleDeleteGameBacklog}
            onAddMediaReview={handleAddMediaReview}
            onUpdateMediaReview={handleUpdateMediaReview}
            onDeleteMediaReview={handleDeleteMediaReview}
            onResetEntertainmentData={handleResetEntertainmentData}
            monthlyBills={monthlyBills}
            onAddMonthlyBill={handleAddMonthlyBill}
            onUpdateMonthlyBill={handleUpdateMonthlyBill}
            onDeleteMonthlyBill={handleDeleteMonthlyBill}
            onBatchSetMonthlyBills={handleBatchSetMonthlyBills}
            onResetMonthlyBillsData={handleResetMonthlyBillsData}
            monthlyIncomes={monthlyIncomes}
            onAddMonthlyIncome={handleAddMonthlyIncome}
            onUpdateMonthlyIncome={handleUpdateMonthlyIncome}
            onDeleteMonthlyIncome={handleDeleteMonthlyIncome}
            onBatchSetMonthlyIncomes={handleBatchSetMonthlyIncomes}
            monthlyExtraExpenses={monthlyExtraExpenses}
            onAddMonthlyExtraExpense={handleAddMonthlyExtraExpense}
            onUpdateMonthlyExtraExpense={handleUpdateMonthlyExtraExpense}
            onDeleteMonthlyExtraExpense={handleDeleteMonthlyExtraExpense}
            onBatchSetMonthlyExtraExpenses={handleBatchSetMonthlyExtraExpenses}
            debts={debts}
            onAddDebt={handleAddDebt}
            onUpdateDebt={handleUpdateDebt}
            onDeleteDebt={handleDeleteDebt}
            onPayDebtInstallment={handlePayDebtInstallment}
            onBatchSetDebts={handleBatchSetDebts}
            books={books}
            readingQuotes={readingQuotes}
            onAddBook={handleAddBook}
            onUpdateBook={handleUpdateBook}
            onDeleteBook={handleDeleteBook}
            onQuickUpdateBookProgress={handleQuickUpdateBookProgress}
            onAddReadingQuote={handleAddReadingQuote}
            onDeleteReadingQuote={handleDeleteReadingQuote}
            onResetBooksData={handleResetBooksData}
            smartPurchases={smartPurchases}
            onAddSmartPurchase={handleAddSmartPurchase}
            onUpdateSmartPurchase={handleUpdateSmartPurchase}
            onDeleteSmartPurchase={handleDeleteSmartPurchase}
            onResetSmartPurchasesData={handleResetSmartPurchasesData}
            onConsultAgent={(task) => {
              setAgentModalTask(task);
              setIsAgentModalOpen(true);
            }}
            onNavigateToHabits={() => setActiveTab('habitos')}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onOpenAssistantIntegration={() => setIsAssistantIntegrationOpen(true)}
            onOpenNotifications={() => setIsWebPushModalOpen(true)}
          />
        )}

        {activeTab === 'ideas' && (
          <PendingIdeasListView
            ideas={ideas}
            categories={categories}
            onAddIdea={handleAddIdea}
            onUpdateIdeaStatus={handleUpdateIdeaStatus}
            onEditIdea={handleEditIdea}
            onDeleteIdea={handleDeleteIdea}
            onConvertIdeaToTask={handleConvertIdeaToTask}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'habitos' && (
          <HabitTrackerView
            habits={habits}
            categories={categories}
            onToggleHabitDay={handleToggleHabitDay}
            onOpenNewHabitModal={handleOpenNewHabitModal}
            onEditHabit={handleEditHabit}
            onDeleteHabit={handleDeleteHabit}
            onRestoreDefaultHabits={handleRestoreDefaultHabits}
            onOpenNotifications={() => setIsWebPushModalOpen(true)}
          />
        )}

        {activeTab === 'calendario' && (
          <CalendarView
            tasks={tasks}
            categories={categories}
            userEmail={user?.email || 'miguelpatino0@gmail.com'}
            onOpenNewTaskModal={handleOpenNewTaskModal}
            onOpenNewTaskModalForDate={handleOpenNewTaskModal}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onLogHours={handleOpenLogHours}
            onQuickStatusChange={handleQuickStatusChange}
            onAssignTaskDate={handleAssignTaskDate}
            onConsultAgent={(task) => {
              setAgentModalTask(task);
              setIsAgentModalOpen(true);
            }}
          />
        )}

        {activeTab === 'cumplimiento' && (
          <AnalyticsView
            tasks={tasks}
            categories={categories}
            calorieLogs={calorieLogs}
            healthProfile={healthProfile}
          />
        )}

        {activeTab === 'historial' && (
          <HistoryView
            tasks={tasks}
            categories={categories}
            onOpenLogHours={handleOpenLogHours}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onQuickStatusChange={handleQuickStatusChange}
            onNavigateToActive={() => setActiveTab('gestion')}
          />
        )}

        {/* DeskBuddy - Modo Tablet & Escritorio Always-On */}
        {activeTab === 'deskbuddy' && (
          <DeskBuddyView
            tasks={tasks}
            habits={habits}
            ideas={ideas}
            categories={categories}
            healthProfile={healthProfile}
            weightLogs={weightLogs}
            calorieLogs={calorieLogs}
            onAddWeightLog={handleAddWeightLog}
            onDeleteWeightLog={handleDeleteWeightLog}
            onSaveDailyCalorieLog={handleSaveDailyCalorieLog}
            onUpdateHealthProfile={handleUpdateHealthProfile}
            onNavigateToHealth={() => {
              setSelectedCategory('salud_bienestar');
              setActiveTab('gestion');
            }}
            onToggleTask={handleQuickStatusChange}
            onToggleHabitDay={handleToggleHabitDay}
            onOpenNewTaskModal={() => handleOpenNewTaskModal()}
            onOpenNewHabitModal={() => handleOpenNewHabitModal()}
            onQuickAddTask={(taskData) => handleSaveTask(taskData as any)}
            onQuickAddHabit={(habitData) => handleSaveHabit(habitData as any)}
            onEditTask={handleEditTask}
            onEditHabit={handleEditHabit}
            onUpdateTask={handleSaveTask}
            onRolloverTask={handleRolloverTaskToNextDay}
            onConsultAgent={(task) => {
              setAgentModalTask(task || null);
              setIsAgentModalOpen(true);
            }}
            onOpenNotifications={() => setIsWebPushModalOpen(true)}
            onExit={() => setActiveTab('gestion')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a2647] bg-[#080d1a] py-6 px-4 text-center text-xs text-slate-500">
        <p>LifeBlocks • Sistema Holístico de Productividad, Hábitos Diarios y Metas de Vida</p>
      </footer>

      {/* Task Edit / Add Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        onDeleteTask={handleDeleteTask}
        categories={categories}
        initialTask={editingTask}
        defaultDate={defaultTaskDate}
      />

      {/* Habit Edit / Add Modal */}
      <HabitModal
        isOpen={isHabitModalOpen}
        onClose={() => setIsHabitModalOpen(false)}
        onSave={handleSaveHabit}
        categories={categories}
        initialHabit={editingHabit}
      />

      {/* Log Hours & Progress Modal */}
      <LogHoursModal
        isOpen={isLogHoursModalOpen}
        onClose={() => setIsLogHoursModalOpen(false)}
        task={loggingTask}
        onUpdateProgress={handleUpdateProgress}
      />

      {/* User Registration & Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* Voice Idea AI Capture Modal */}
      <VoiceIdeaModal
        isOpen={isVoiceIdeaModalOpen}
        onClose={() => setIsVoiceIdeaModalOpen(false)}
        categories={categories}
        onOpenAssistantIntegration={() => setIsAssistantIntegrationOpen(true)}
        onAddIdea={(newIdea) => {
          handleAddIdea(newIdea);
        }}
      />

      {/* Siri, Google Assistant & Gemini Webhook Ingestion Hub Modal */}
      <VoiceAssistantIntegrationModal
        isOpen={isAssistantIntegrationOpen}
        onClose={() => setIsAssistantIntegrationOpen(false)}
        categories={categories}
        userId={user ? user.uid : undefined}
        onAddIdeaDirectly={(newIdea) => {
          handleAddIdea(newIdea);
        }}
      />

      {/* Interactive AI Coach Agent Drawer Modal */}
      <AgentDrawerModal
        isOpen={isAgentModalOpen}
        onClose={() => {
          setIsAgentModalOpen(false);
          setAgentModalTask(null);
        }}
        tasks={tasks}
        categories={categories}
        ideas={ideas}
        selectedTask={agentModalTask}
        onConvertIdeaToTask={handleConvertIdeaToTask}
        onOpenNewTaskModal={(prefilled) => {
          setIsAgentModalOpen(false);
          setEditingTask(prefilled ? (prefilled as Task) : null);
          setIsTaskModalOpen(true);
        }}
      />

      {/* Floating AI Agent Coach trigger button (bottom-right) */}
      <FloatingAgentWidget
        tasks={tasks}
        todayTasksCount={tasks.filter(t => t && t.status !== 'completada').length}
        categories={categories}
        onOpenAgentChat={() => {
          setAgentModalTask(null);
          setIsAgentModalOpen(true);
        }}
        onOpenVoiceIdeaModal={() => {
          setIsVoiceIdeaModalOpen(true);
        }}
        onOpenAssistantIntegration={() => {
          setIsAssistantIntegrationOpen(true);
        }}
        onSaveIdeaDirectly={(idea) => {
          handleAddIdea(idea);
        }}
        onConvertIdeaToTask={(idea) => {
          handleConvertIdeaToTask(idea);
        }}
        onOpenAgent={() => {
          setAgentModalTask(null);
          setIsAgentModalOpen(true);
        }}
      />

      {/* Install App as PWA Modal */}
      <InstallAppModal
        isOpen={isInstallAppModalOpen}
        onClose={() => setIsInstallAppModalOpen(false)}
      />

      {/* Web Push & In-Browser Notification Settings Modal */}
      <WebPushNotificationModal
        isOpen={isWebPushModalOpen}
        onClose={() => setIsWebPushModalOpen(false)}
        tasks={tasks}
        habits={habits}
      />

      {/* Global Brain Dump Multi-Idea AI Reassigner Modal */}
      <BrainDumpModal
        isOpen={isGlobalBrainDumpOpen}
        onClose={() => setIsGlobalBrainDumpOpen(false)}
        categories={categories}
        onAddIdeas={(newIdeas) => {
          handleAddBatchIdeas(newIdeas);
        }}
        onAddTasks={(newTasks) => {
          handleAddBatchTasks(newTasks);
        }}
      />

      {/* Spoken & Visual Assistant Announcement for Captured Ideas */}
      <AssistantIdeaAnnouncementToast
        announcement={ideaAnnouncement}
        onClose={() => setIdeaAnnouncement(null)}
        onNavigateToCategory={(catId) => {
          setActiveTab('gestion');
          setSelectedCategory(catId);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Mobile Fixed Bottom Navigation Bar (Guarantees Google Calendar is 100% visible on any phone) */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t px-2 py-1.5 flex items-center justify-around shadow-2xl backdrop-blur-lg ${
        isDark ? 'bg-[#0b1326]/95 border-slate-800/90' : 'bg-white/95 border-slate-200/90'
      }`}>
        <button
          onClick={() => {
            setActiveTab('gestion');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'gestion'
              ? 'text-cyan-400 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckSquare className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Metas</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('ideas');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all cursor-pointer relative ${
            activeTab === 'ideas'
              ? 'text-amber-400 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {agedIdeasCount > 0 && (
            <span className="absolute -top-0.5 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
          )}
          <Lightbulb className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Ideas</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('habitos');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'habitos'
              ? 'text-amber-400 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Hábitos</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('calendario');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center py-1 px-3.5 rounded-xl transition-all cursor-pointer relative ${
            activeTab === 'calendario'
              ? 'text-white bg-[#4285F4] shadow-lg shadow-[#4285F4]/40 font-black scale-105'
              : 'text-[#4285F4] bg-[#4285F4]/10 border border-[#4285F4]/30'
          }`}
        >
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
          </span>
          <CalendarDays className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-extrabold tracking-tight">Google Cal</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('cumplimiento');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'cumplimiento'
              ? 'text-purple-400 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart2 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Progreso</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('historial');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'historial'
              ? 'text-slate-200 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Historial</span>
        </button>
      </nav>
    </div>
  );
}
