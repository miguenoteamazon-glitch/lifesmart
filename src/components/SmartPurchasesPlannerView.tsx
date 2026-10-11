import React, { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  SmartPurchaseGoal, 
  SmartPurchaseCategory, 
  SmartPurchaseStatus, 
  ContributionFrequency, 
  SmartPurchaseContribution, 
  SmartPurchaseChecklistItem 
} from '../types';
import { 
  ShoppingBag, 
  Sparkles, 
  Plus, 
  Clock, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight, 
  Trash2, 
  Edit3, 
  RotateCcw, 
  CheckSquare, 
  Square, 
  Info, 
  ExternalLink, 
  History, 
  Tag, 
  Zap, 
  AlertCircle,
  X,
  Calculator,
  ChevronDown,
  ChevronUp,
  Package,
  Wrench,
  Printer,
  Briefcase,
  Camera,
  Laptop,
  Check
} from 'lucide-react';

interface SmartPurchasesPlannerViewProps {
  purchases: SmartPurchaseGoal[];
  onAddPurchase: (purchase: Omit<SmartPurchaseGoal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdatePurchase: (purchase: SmartPurchaseGoal) => void;
  onDeletePurchase: (purchaseId: string) => void;
  onResetPurchasesData?: () => void;
}

const CATEGORY_CONFIG: Record<SmartPurchaseCategory, { label: string; icon: any; color: string; bgLight: string; bgDark: string }> = {
  tecnologia: { label: 'Tecnología & Gadgets', icon: Laptop, color: 'text-indigo-400', bgLight: 'bg-indigo-50 border-indigo-200 text-indigo-900', bgDark: 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300' },
  impresion_3d: { label: 'Impresión 3D & Makers', icon: Printer, color: 'text-purple-400', bgLight: 'bg-purple-50 border-purple-200 text-purple-900', bgDark: 'bg-purple-950/40 border-purple-500/30 text-purple-300' },
  negocio: { label: 'Negocio & Inversión', icon: Briefcase, color: 'text-emerald-400', bgLight: 'bg-emerald-50 border-emerald-200 text-emerald-900', bgDark: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' },
  herramientas: { label: 'Herramientas & Taller', icon: Wrench, color: 'text-amber-400', bgLight: 'bg-amber-50 border-amber-200 text-amber-900', bgDark: 'bg-amber-950/40 border-amber-500/30 text-amber-300' },
  fotografia: { label: 'Fotografía & Video', icon: Camera, color: 'text-rose-400', bgLight: 'bg-rose-50 border-rose-200 text-rose-900', bgDark: 'bg-rose-950/40 border-rose-500/30 text-rose-300' },
  hogar_oficina: { label: 'Hogar & Oficina', icon: Package, color: 'text-cyan-400', bgLight: 'bg-cyan-50 border-cyan-200 text-cyan-900', bgDark: 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300' },
  vehiculo: { label: 'Vehículo & Movilidad', icon: Zap, color: 'text-blue-400', bgLight: 'bg-blue-50 border-blue-200 text-blue-900', bgDark: 'bg-blue-950/40 border-blue-500/30 text-blue-300' },
  otro: { label: 'Otro Artículo', icon: Tag, color: 'text-slate-400', bgLight: 'bg-slate-100 border-slate-300 text-slate-900', bgDark: 'bg-slate-800/50 border-slate-700 text-slate-300' },
};

const PRESET_TEMPLATES = [
  {
    title: 'Drone DJI Neo 2 (Fly More Combo)',
    category: 'tecnologia' as SmartPurchaseCategory,
    emoji: '🚁',
    targetPrice: 2300000,
    estimatedContributionPerPeriod: 70000,
    frequency: 'quincenal' as ContributionFrequency,
    modelOrSpecs: 'Fly More Combo con 3 baterías inteligentes, cargador hub y hélices de repuesto',
    notes: 'Drone ultra liviano (135g) con grabación 4K, despegue desde la mano y seguimiento por IA para viajes y contenido.',
    storeOrLink: 'DJI Store Oficial / MercadoLibre',
    checklists: [
      { title: 'MicroSD SanDisk Extreme 128GB V30', estimatedCost: 85000 },
      { title: 'Estuche rígido de transporte impermeable', estimatedCost: 95000 },
      { title: 'Seguro DJI Care Refresh 1 año', estimatedCost: 120000 }
    ]
  },
  {
    title: 'Impresora 3D Bambu Lab A1 Mini Combo',
    category: 'impresion_3d' as SmartPurchaseCategory,
    emoji: '🖨️',
    targetPrice: 1850000,
    estimatedContributionPerPeriod: 100000,
    frequency: 'quincenal' as ContributionFrequency,
    modelOrSpecs: 'Combo AMS Lite para impresión multicolor de 4 filamentos a alta velocidad',
    notes: 'Para prototipado, organizadores a medida, repuestos mecánicos del hogar y proyectos de ingeniería.',
    storeOrLink: 'MakerTech3D Colombia / Bambu Lab Direct',
    checklists: [
      { title: 'Pack 4 rollos Filamento PLA+ (Negro, Blanco, Gris, Naranja)', estimatedCost: 240000 },
      { title: 'Boquilla de acero endurecido 0.4mm', estimatedCost: 75000 }
    ]
  },
  {
    title: 'Maquinaria & Equipamiento para Negocio',
    category: 'negocio' as SmartPurchaseCategory,
    emoji: '💼',
    targetPrice: 3200000,
    estimatedContributionPerPeriod: 200000,
    frequency: 'quincenal' as ContributionFrequency,
    modelOrSpecs: 'Equipo de producción / empaque continuo industrial',
    notes: 'Inversión productiva para optimizar el negocio, reducir tiempos de entrega y aumentar rentabilidad.',
    storeOrLink: 'Distribuidor Industrial Especializado',
    checklists: [
      { title: 'Insumos y material consumible para primer trimestre', estimatedCost: 250000 }
    ]
  },
  {
    title: 'Laptop / Monitor 4K de Trabajo & Productividad',
    category: 'tecnologia' as SmartPurchaseCategory,
    emoji: '💻',
    targetPrice: 2800000,
    estimatedContributionPerPeriod: 150000,
    frequency: 'quincenal' as ContributionFrequency,
    modelOrSpecs: 'Monitor IPS 27" 4K HDR USB-C 90W Power Delivery o Laptop Ultrabook',
    notes: 'Para trabajo remoto, edición, programación y mayor confort ergonómico visual.',
    storeOrLink: 'Amazon / Alkosto / MercadoLibre',
    checklists: [
      { title: 'Brazo articulado para escritorio con gestión de cables', estimatedCost: 130000 }
    ]
  },
  {
    title: 'Combo Herramientas Eléctricas Inalámbricas 20V',
    category: 'herramientas' as SmartPurchaseCategory,
    emoji: '🛠️',
    targetPrice: 1200000,
    estimatedContributionPerPeriod: 80000,
    frequency: 'quincenal' as ContributionFrequency,
    modelOrSpecs: 'Taladro percutor + atornillador de impacto con 2 baterías de 4Ah',
    notes: 'Kit profesional para reparaciones del hogar, remodelación y carpintería.',
    storeOrLink: 'Homecenter / Ferretería Industrial',
    checklists: [
      { title: 'Juego de brocas de cobalto y puntas magnéticas', estimatedCost: 75000 }
    ]
  }
];

export const SmartPurchasesPlannerView: React.FC<SmartPurchasesPlannerViewProps> = ({
  purchases,
  onAddPurchase,
  onUpdatePurchase,
  onDeletePurchase,
  onResetPurchasesData,
}) => {
  const { isDark } = useTheme();

  // Tab: 'activas' (ahorrando/listo) | 'historico' (comprado) | 'todas'
  const [activeTab, setActiveTab] = useState<'activas' | 'historico' | 'todas'>('activas');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedPurchaseId, setExpandedPurchaseId] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<SmartPurchaseGoal | null>(null);

  // Contribution Modal state
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [contributionPurchaseId, setContributionPurchaseId] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState<string>('70000');
  const [contributionDate, setContributionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [contributionNote, setContributionNote] = useState<string>('');
  const [contributionSource, setContributionSource] = useState<string>('quincena_1');

  // Mark as purchased modal state
  const [isMarkPurchasedModalOpen, setIsMarkPurchasedModalOpen] = useState(false);
  const [markPurchasedGoal, setMarkPurchasedGoal] = useState<SmartPurchaseGoal | null>(null);
  const [purchasedPriceInput, setPurchasedPriceInput] = useState<string>('');
  const [purchasedDateInput, setPurchasedDateInput] = useState<string>(new Date().toISOString().split('T')[0]);
  const [purchasedNotesInput, setPurchasedNotesInput] = useState<string>('');

  // Simulator state per item
  const [simulatingGoalId, setSimulatingGoalId] = useState<string | null>(null);
  const [simulatedContribution, setSimulatedContribution] = useState<number>(100000);

  // Form state for Create / Edit
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<SmartPurchaseCategory>('tecnologia');
  const [formEmoji, setFormEmoji] = useState('🚁');
  const [formTargetPrice, setFormTargetPrice] = useState('2300000');
  const [formSavedAmount, setFormSavedAmount] = useState('0');
  const [formContributionPerPeriod, setFormContributionPerPeriod] = useState('70000');
  const [formFrequency, setFormFrequency] = useState<ContributionFrequency>('quincenal');
  const [formPriority, setFormPriority] = useState<'alta' | 'media' | 'baja'>('alta');
  const [formStoreOrLink, setFormStoreOrLink] = useState('');
  const [formModelOrSpecs, setFormModelOrSpecs] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formNewChecklistTitle, setFormNewChecklistTitle] = useState('');

  // Formatting helpers
  const formatCOP = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Aggregated KPIs
  const activePurchases = useMemo(() => purchases.filter(p => p.status !== 'comprado'), [purchases]);
  const completedPurchases = useMemo(() => purchases.filter(p => p.status === 'comprado'), [purchases]);

  const totalActiveTarget = useMemo(() => activePurchases.reduce((sum, p) => sum + (Number(p.targetPrice) || 0), 0), [activePurchases]);
  const totalActiveSaved = useMemo(() => activePurchases.reduce((sum, p) => sum + (Number(p.savedAmount) || 0), 0), [activePurchases]);
  const totalActiveRemaining = Math.max(0, totalActiveTarget - totalActiveSaved);
  const globalProgress = totalActiveTarget > 0 ? Math.min(100, Math.round((totalActiveSaved / totalActiveTarget) * 100)) : 0;

  const totalCompletedSpent = useMemo(() => completedPurchases.reduce((sum, p) => sum + (Number(p.actualPurchasePrice) || Number(p.targetPrice) || 0), 0), [completedPurchases]);

  // Filtered purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      if (activeTab === 'activas' && p.status === 'comprado') return false;
      if (activeTab === 'historico' && p.status !== 'comprado') return false;
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      return true;
    });
  }, [purchases, activeTab, categoryFilter]);

  // Calculate intelligent time projection
  const calculateProjection = (target: number, saved: number, periodContribution: number, frequency: ContributionFrequency) => {
    const remaining = Math.max(0, target - saved);
    if (remaining <= 0) {
      return {
        periodsRemaining: 0,
        text: '¡Meta alcanzada! Tienes el 100% ahorrado',
        estimatedDateStr: '¡Disponible ahora!',
        isReady: true,
        monthsEstimate: 0
      };
    }

    const contribution = periodContribution > 0 ? periodContribution : 70000;
    const periodsRemaining = Math.ceil(remaining / contribution);

    // Calculate approx months and future date
    let daysPerPeriod = 15;
    if (frequency === 'mensual') daysPerPeriod = 30;
    if (frequency === 'semanal') daysPerPeriod = 7;

    const totalDays = periodsRemaining * daysPerPeriod;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + totalDays);

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const estimatedDateStr = `${monthNames[futureDate.getMonth()]} de ${futureDate.getFullYear()}`;
    const monthsEstimate = (totalDays / 30).toFixed(1);

    const freqLabel = frequency === 'quincenal' ? 'quincenas' : frequency === 'mensual' ? 'meses' : 'semanas';

    return {
      periodsRemaining,
      freqLabel,
      totalDays,
      monthsEstimate,
      estimatedDateStr,
      isReady: false,
      text: `Faltan aprox. ${periodsRemaining} ${freqLabel} (~${monthsEstimate} meses)`
    };
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingPurchase(null);
    setFormTitle('Drone DJI Neo 2');
    setFormCategory('tecnologia');
    setFormEmoji('🚁');
    setFormTargetPrice('2300000');
    setFormSavedAmount('0');
    setFormContributionPerPeriod('70000');
    setFormFrequency('quincenal');
    setFormPriority('alta');
    setFormStoreOrLink('DJI Store / MercadoLibre');
    setFormModelOrSpecs('Fly More Combo con 3 baterías y hub');
    setFormNotes('Drone compacto de 135g con video 4K estabilizado.');
    setFormNewChecklistTitle('');
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (purchase: SmartPurchaseGoal) => {
    setEditingPurchase(purchase);
    setFormTitle(purchase.title);
    setFormCategory(purchase.category);
    setFormEmoji(purchase.emoji || '🛍️');
    setFormTargetPrice(String(purchase.targetPrice));
    setFormSavedAmount(String(purchase.savedAmount));
    setFormContributionPerPeriod(String(purchase.estimatedContributionPerPeriod || 70000));
    setFormFrequency(purchase.frequency || 'quincenal');
    setFormPriority(purchase.priority || 'alta');
    setFormStoreOrLink(purchase.storeOrLink || '');
    setFormModelOrSpecs(purchase.modelOrSpecs || '');
    setFormNotes(purchase.notes || '');
    setFormNewChecklistTitle('');
    setIsCreateModalOpen(true);
  };

  // Use Preset
  const handleApplyPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    setEditingPurchase(null);
    setFormTitle(preset.title);
    setFormCategory(preset.category);
    setFormEmoji(preset.emoji);
    setFormTargetPrice(String(preset.targetPrice));
    setFormSavedAmount('0');
    setFormContributionPerPeriod(String(preset.estimatedContributionPerPeriod));
    setFormFrequency(preset.frequency);
    setFormPriority('alta');
    setFormStoreOrLink(preset.storeOrLink);
    setFormModelOrSpecs(preset.modelOrSpecs);
    setFormNotes(preset.notes);
    setIsPresetsModalOpen(false);
    setIsCreateModalOpen(true);
  };

  // Save Create / Edit
  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPrice = parseFloat(formTargetPrice) || 0;
    const savedAmount = parseFloat(formSavedAmount) || 0;
    const contrib = parseFloat(formContributionPerPeriod) || 70000;

    let status: SmartPurchaseStatus = 'ahorrando';
    if (savedAmount >= targetPrice && targetPrice > 0) {
      status = 'listo';
    }

    if (editingPurchase) {
      const updated: SmartPurchaseGoal = {
        ...editingPurchase,
        title: formTitle.trim() || 'Nueva Compra Programada',
        category: formCategory,
        emoji: formEmoji || '🛍️',
        targetPrice,
        savedAmount,
        estimatedContributionPerPeriod: contrib,
        frequency: formFrequency,
        priority: formPriority,
        storeOrLink: formStoreOrLink.trim() || undefined,
        modelOrSpecs: formModelOrSpecs.trim() || undefined,
        notes: formNotes.trim() || undefined,
        status: editingPurchase.status === 'comprado' ? 'comprado' : status,
        updatedAt: new Date().toISOString(),
      };
      onUpdatePurchase(updated);
    } else {
      const newPurchase: Omit<SmartPurchaseGoal, 'id' | 'createdAt' | 'updatedAt'> = {
        title: formTitle.trim() || 'Nueva Compra Programada',
        category: formCategory,
        emoji: formEmoji || '🛍️',
        targetPrice,
        savedAmount,
        currency: 'COP',
        priority: formPriority,
        status,
        estimatedContributionPerPeriod: contrib,
        frequency: formFrequency,
        storeOrLink: formStoreOrLink.trim() || undefined,
        modelOrSpecs: formModelOrSpecs.trim() || undefined,
        notes: formNotes.trim() || undefined,
        contributions: savedAmount > 0 ? [
          {
            id: `cont-${Date.now()}`,
            amount: savedAmount,
            date: new Date().toISOString().split('T')[0],
            note: 'Aporte / Base inicial',
            source: 'quincena_1',
            createdAt: new Date().toISOString()
          }
        ] : [],
        checklists: []
      };
      onAddPurchase(newPurchase);
    }

    setIsCreateModalOpen(false);
  };

  // Open Add Contribution Modal
  const handleOpenContributionModal = (goal: SmartPurchaseGoal) => {
    setContributionPurchaseId(goal.id);
    setContributionAmount(String(goal.estimatedContributionPerPeriod || 70000));
    setContributionDate(new Date().toISOString().split('T')[0]);
    setContributionNote(`Abono para ${goal.title}`);
    setContributionSource('quincena_1');
    setIsContributionModalOpen(true);
  };

  // Submit Contribution
  const handleSaveContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributionPurchaseId) return;

    const goal = purchases.find(p => p.id === contributionPurchaseId);
    if (!goal) return;

    const amount = parseFloat(contributionAmount) || 0;
    if (amount <= 0) return;

    const newContrib: SmartPurchaseContribution = {
      id: `cont-${Date.now()}`,
      amount,
      date: contributionDate,
      note: contributionNote.trim() || undefined,
      source: contributionSource,
      createdAt: new Date().toISOString(),
    };

    const newSaved = (goal.savedAmount || 0) + amount;
    const newStatus: SmartPurchaseStatus = (newSaved >= goal.targetPrice && goal.targetPrice > 0) 
      ? 'listo' 
      : goal.status === 'comprado' 
      ? 'comprado' 
      : 'ahorrando';

    const updated: SmartPurchaseGoal = {
      ...goal,
      savedAmount: newSaved,
      status: newStatus,
      contributions: [newContrib, ...(goal.contributions || [])],
      updatedAt: new Date().toISOString()
    };

    onUpdatePurchase(updated);
    setIsContributionModalOpen(false);
  };

  // Delete Contribution
  const handleDeleteContribution = (goalId: string, contribId: string) => {
    const goal = purchases.find(p => p.id === goalId);
    if (!goal) return;

    const contribToDelete = goal.contributions.find(c => c.id === contribId);
    const amountToSubtract = contribToDelete ? contribToDelete.amount : 0;
    const newSaved = Math.max(0, (goal.savedAmount || 0) - amountToSubtract);

    const updated: SmartPurchaseGoal = {
      ...goal,
      savedAmount: newSaved,
      status: (newSaved >= goal.targetPrice && goal.targetPrice > 0) ? 'listo' : (goal.status === 'comprado' ? 'comprado' : 'ahorrando'),
      contributions: goal.contributions.filter(c => c.id !== contribId),
      updatedAt: new Date().toISOString()
    };

    onUpdatePurchase(updated);
  };

  // Open Mark Purchased Modal
  const handleOpenMarkPurchased = (goal: SmartPurchaseGoal) => {
    setMarkPurchasedGoal(goal);
    setPurchasedPriceInput(String(goal.targetPrice));
    setPurchasedDateInput(new Date().toISOString().split('T')[0]);
    setPurchasedNotesInput(`¡Comprado con éxito! Meta completada con ahorro programado.`);
    setIsMarkPurchasedModalOpen(true);
  };

  // Confirm Mark Purchased
  const handleConfirmMarkPurchased = (e: React.FormEvent) => {
    e.preventDefault();
    if (!markPurchasedGoal) return;

    const actualPrice = parseFloat(purchasedPriceInput) || markPurchasedGoal.targetPrice;

    const updated: SmartPurchaseGoal = {
      ...markPurchasedGoal,
      status: 'comprado',
      purchasedDate: purchasedDateInput,
      actualPurchasePrice: actualPrice,
      purchaseNotes: purchasedNotesInput.trim() || undefined,
      updatedAt: new Date().toISOString()
    };

    onUpdatePurchase(updated);
    setIsMarkPurchasedModalOpen(false);
    setActiveTab('historico');
  };

  // Reactivate from history
  const handleReactivatePurchase = (goal: SmartPurchaseGoal) => {
    const updated: SmartPurchaseGoal = {
      ...goal,
      status: goal.savedAmount >= goal.targetPrice ? 'listo' : 'ahorrando',
      purchasedDate: undefined,
      updatedAt: new Date().toISOString()
    };
    onUpdatePurchase(updated);
  };

  // Toggle Checklist Item
  const handleToggleChecklist = (goalId: string, checkId: string) => {
    const goal = purchases.find(p => p.id === goalId);
    if (!goal) return;

    const updatedChecklists = (goal.checklists || []).map(item => {
      if (item.id === checkId) return { ...item, completed: !item.completed };
      return item;
    });

    onUpdatePurchase({
      ...goal,
      checklists: updatedChecklists,
      updatedAt: new Date().toISOString()
    });
  };

  // Add Checklist Item
  const handleAddChecklistItem = (goalId: string, title: string) => {
    if (!title.trim()) return;
    const goal = purchases.find(p => p.id === goalId);
    if (!goal) return;

    const newItem: SmartPurchaseChecklistItem = {
      id: `chk-${Date.now()}`,
      title: title.trim(),
      completed: false
    };

    onUpdatePurchase({
      ...goal,
      checklists: [...(goal.checklists || []), newItem],
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-6">
      
      {/* 1. TOP EXECUTIVE DASHBOARD HEADER */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDark
            ? 'bg-gradient-to-r from-[#0d1627] via-[#111f38] to-[#0d1627] border-slate-800'
            : 'bg-gradient-to-r from-amber-50/50 via-white to-orange-50/40 border-slate-200'
        }`}
      >
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/25 shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className={`text-lg sm:text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Planeador de Compras Inteligentes Programadas
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black font-mono bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                PROYECCIÓN & AHORRO
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Programa tus compras deseadas (drone, impresora 3D, inversión de negocio), haz abonos quincenales y proyecta exactamente cuánto tiempo falta para tenerlas.
            </p>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPresetsModalOpen(true)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm ${
              isDark 
                ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>⚡ Ideas & Presets</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-2xl text-xs font-black bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-slate-950 hover:brightness-110 shadow-md shadow-orange-500/25 transition-all cursor-pointer flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nueva Compra</span>
          </button>
        </div>
      </div>

      {/* 2. TOP METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Active Targets */}
        <div
          className={`p-4 rounded-2xl border shadow-sm ${
            isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
            <span>Metas Activas en Ahorro</span>
            <span className="p-1 rounded-lg bg-orange-500/10 text-orange-400">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className={`text-xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {formatCOP(totalActiveTarget)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
            <span className="font-semibold text-orange-400">{activePurchases.length} compras</span>
            <span>en planeación</span>
          </div>
        </div>

        {/* Metric 2: Total Saved */}
        <div
          className={`p-4 rounded-2xl border shadow-sm ${
            isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
            <span>Total Ahorrado / Abonado</span>
            <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {formatCOP(totalActiveSaved)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span className="font-bold text-emerald-500">{globalProgress}%</span> del valor total cubierto
          </div>
        </div>

        {/* Metric 3: Total Remaining */}
        <div
          className={`p-4 rounded-2xl border shadow-sm ${
            isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
            <span>Faltante para Completar</span>
            <span className="p-1 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className={`text-xl font-black font-mono ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
            {formatCOP(totalActiveRemaining)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Diferencia pendiente por abonar
          </div>
        </div>

        {/* Metric 4: History / Completed */}
        <div
          className={`p-4 rounded-2xl border shadow-sm ${
            isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
            <span>Histórico Realizadas</span>
            <span className="p-1 rounded-lg bg-purple-500/10 text-purple-400">
              <History className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black font-mono text-purple-600 dark:text-purple-400">
            {completedPurchases.length} compras 🎉
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {formatCOP(totalCompletedSpent)} ejecutados con éxito
          </div>
        </div>
      </div>

      {/* 3. TABS AND CATEGORY FILTER TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Primary View Switcher */}
        <div
          className={`p-1 rounded-2xl border flex items-center space-x-1 ${
            isDark ? 'bg-[#0b1220] border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('activas')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'activas'
                ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/25'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>🎯 En Ahorro Activo</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-black/20 text-slate-950">
              {activePurchases.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('historico')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'historico'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>🏆 Histórico Realizadas</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-white/25 text-white">
              {completedPurchases.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('todas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'todas'
                ? 'bg-slate-700 text-white'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>Ver Todas ({purchases.length})</span>
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Todas ({purchases.length})
          </button>
          {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
            const count = purchases.filter(p => p.category === key).length;
            if (count === 0 && categoryFilter !== key) return null;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setCategoryFilter(key)}
                className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  categoryFilter === key
                    ? 'bg-orange-500 text-slate-950 font-black'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                <span>{cfg.label}</span>
                <span className="ml-1 opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. PURCHASES LIST */}
      {filteredPurchases.length === 0 ? (
        <div
          className={`p-12 rounded-3xl border text-center ${
            isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="w-16 h-16 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {activeTab === 'historico' 
              ? 'No hay compras en el histórico todavía'
              : 'No tienes compras registradas en este filtro'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
            {activeTab === 'historico'
              ? 'Cuando completes el ahorro para una compra o la adquieras, márcala como realizada para verla aquí.'
              : 'Crea tu primera compra inteligente programada (como el Drone DJI Neo 2 o una impresora 3D) para proyectar tu ahorro.'}
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setIsPresetsModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 transition-all cursor-pointer"
            >
              Explorar Ideas de Compras
            </button>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl text-xs font-black bg-orange-500 text-slate-950 hover:brightness-110 transition-all cursor-pointer"
            >
              + Crear Nueva Compra
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPurchases.map(goal => {
            const isCompleted = goal.status === 'comprado';
            const progress = goal.targetPrice > 0 ? Math.min(100, Math.round(((goal.savedAmount || 0) / goal.targetPrice) * 100)) : 0;
            const remaining = Math.max(0, goal.targetPrice - (goal.savedAmount || 0));
            const catCfg = CATEGORY_CONFIG[goal.category] || CATEGORY_CONFIG.otro;
            const CategoryIcon = catCfg.icon;
            const isExpanded = expandedPurchaseId === goal.id;

            // Projection calculation
            const periodContribution = goal.estimatedContributionPerPeriod || 70000;
            const projection = calculateProjection(goal.targetPrice, goal.savedAmount || 0, periodContribution, goal.frequency || 'quincenal');

            // Interactive simulation state for this card
            const isSimulating = simulatingGoalId === goal.id;
            const activeSimRate = simulatedContribution > 0 ? simulatedContribution : periodContribution;
            const simulatedProjection = calculateProjection(goal.targetPrice, goal.savedAmount || 0, activeSimRate, goal.frequency || 'quincenal');

            return (
              <div
                key={goal.id}
                className={`rounded-3xl border transition-all shadow-sm overflow-hidden ${
                  isCompleted
                    ? isDark
                      ? 'bg-[#0f172a]/70 border-purple-500/30 ring-1 ring-purple-500/20'
                      : 'bg-purple-50/20 border-purple-200'
                    : isDark
                    ? 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Main Card Header & Metrics */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    
                    {/* Title & Category Info */}
                    <div className="flex items-start space-x-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl shadow-inner shrink-0 border border-slate-200 dark:border-slate-700">
                        {goal.emoji || '🛍️'}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {goal.title}
                          </h3>
                          
                          {/* Status Badge */}
                          {isCompleted ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Comprado {goal.purchasedDate ? `(${goal.purchasedDate})` : ''}</span>
                            </span>
                          ) : progress >= 100 ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                              <Sparkles className="w-3 h-3 text-emerald-500" />
                              <span>¡Meta Lista para Comprar!</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>En Ahorro ({progress}%)</span>
                            </span>
                          )}

                          {/* Category Tag */}
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center space-x-1 ${
                            isDark ? catCfg.bgDark : catCfg.bgLight
                          }`}>
                            <CategoryIcon className="w-3 h-3" />
                            <span>{catCfg.label}</span>
                          </span>
                        </div>

                        {/* Specs & Link subtitle */}
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {goal.modelOrSpecs && (
                            <span>{goal.modelOrSpecs}</span>
                          )}
                          {goal.storeOrLink && (
                            <span className="flex items-center space-x-1 text-indigo-500 dark:text-indigo-400 font-medium">
                              <ExternalLink className="w-3 h-3" />
                              <span>{goal.storeOrLink}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center space-x-1 self-end sm:self-auto">
                      {!isCompleted && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenContributionModal(goal)}
                            className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all cursor-pointer flex items-center space-x-1"
                            title="Registrar nuevo abono de dinero"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Abonar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenMarkPurchased(goal)}
                            className="px-3 py-1.5 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-500 text-white shadow-sm transition-all cursor-pointer flex items-center space-x-1"
                            title="Marcar como compra ya realizada"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>¡Comprado!</span>
                          </button>
                        </>
                      )}

                      {isCompleted && (
                        <button
                          type="button"
                          onClick={() => handleReactivatePurchase(goal)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold border border-purple-500/40 text-purple-400 hover:bg-purple-500/10 transition-all cursor-pointer flex items-center space-x-1"
                          title="Volver a poner en ahorro activo"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reactivar</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(goal)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
                        title="Editar compra"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Eliminar la compra programada "${goal.title}"?`)) {
                            onDeletePurchase(goal.id);
                          }
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Financial Bar & Progress Indicators */}
                  <div
                    className={`p-4 rounded-2xl border ${
                      isDark ? 'bg-[#090e18] border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 block">Valor Meta Objetivo</span>
                        <span className={`text-base font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {formatCOP(goal.targetPrice)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 block">Total Ahorrado / Abonado</span>
                        <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                          {formatCOP(goal.savedAmount || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 block">Faltante por Ahorrar</span>
                        <span className={`text-base font-black font-mono ${remaining <= 0 ? 'text-emerald-500' : isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                          {remaining <= 0 ? '¡Listo para comprar! 🎉' : formatCOP(remaining)}
                        </span>
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono font-bold">
                        <span className="text-slate-400">Progreso de Compra</span>
                        <span className={progress >= 100 ? 'text-emerald-400' : 'text-orange-400'}>
                          {progress}% completado
                        </span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted
                              ? 'bg-gradient-to-r from-purple-500 to-indigo-500'
                              : progress >= 100
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* INTELLIGENT TIME PROJECTION BOX (Only if not already completed) */}
                  {!isCompleted && (
                    <div
                      className={`p-4 rounded-2xl border ${
                        isDark 
                          ? 'bg-gradient-to-r from-[#101b2f] to-[#0c1524] border-indigo-500/20' 
                          : 'bg-indigo-50/40 border-indigo-100'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-start space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                            <Calculator className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-black text-indigo-400 uppercase tracking-wider">
                                Proyección Inteligente de Tiempo
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                                {formatCOP(periodContribution)} / {goal.frequency || 'quincenal'}
                              </span>
                            </div>

                            {remaining <= 0 ? (
                              <p className="text-sm font-bold text-emerald-400 mt-0.5">
                                ¡Ya tienes el 100% reunido para comprar este artículo! 🚀
                              </p>
                            ) : (
                              <p className={`text-sm font-bold mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                Aportando <span className="text-orange-400 font-mono">{formatCOP(periodContribution)}</span> cada {goal.frequency || 'quincena'}, te faltan <span className="text-indigo-400 font-mono font-black">{projection.periodsRemaining} {projection.freqLabel}</span> (~{projection.monthsEstimate} meses).
                                <span className="block text-xs font-normal text-slate-400 mt-0.5">
                                  📅 Fecha estimada de compra: <span className="text-white dark:text-indigo-300 font-bold">{projection.estimatedDateStr}</span>
                                </span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Interactive Simulator Trigger */}
                        {remaining > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSimulatingGoalId(isSimulating ? null : goal.id);
                              setSimulatedContribution(periodContribution);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center space-x-1.5 self-start md:self-auto ${
                              isSimulating
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                                : 'border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10'
                            }`}
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>{isSimulating ? 'Cerrar Simulador' : '⚡ Simular Aceleración'}</span>
                          </button>
                        )}
                      </div>

                      {/* SIMULATOR DRAWER */}
                      {isSimulating && remaining > 0 && (
                        <div className="mt-4 pt-4 border-t border-indigo-500/20 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-xs font-bold text-indigo-300">
                              ¿Cuánto podrías abonar por {goal.frequency || 'quincena'} para acelerar la compra?
                            </span>
                            <div className="flex items-center space-x-1 text-xs">
                              {[50000, 70000, 100000, 150000, 250000].map(amt => (
                                <button
                                  key={amt}
                                  type="button"
                                  onClick={() => setSimulatedContribution(amt)}
                                  className={`px-2 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                                    simulatedContribution === amt
                                      ? 'bg-orange-500 text-slate-950'
                                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                  }`}
                                >
                                  {amt >= 1000000 ? `${amt / 1000000}M` : `${amt / 1000}k`}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                            <div>
                              <input
                                type="range"
                                min={30000}
                                max={Math.min(remaining, 500000)}
                                step={10000}
                                value={simulatedContribution}
                                onChange={(e) => setSimulatedContribution(Number(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                              />
                              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                                <span>$30.000</span>
                                <span className="font-bold text-orange-400">{formatCOP(simulatedContribution)}/{goal.frequency || 'quincena'}</span>
                                <span>{formatCOP(Math.min(remaining, 500000))}</span>
                              </div>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs">
                              <span className="text-slate-400 block">Resultado con este abono:</span>
                              <span className="font-bold text-emerald-400 block font-mono text-sm">
                                {simulatedProjection.periodsRemaining} {simulatedProjection.freqLabel} (~{simulatedProjection.monthsEstimate} meses)
                              </span>
                              <span className="text-[11px] text-indigo-300">
                                Fecha aproximada: {simulatedProjection.estimatedDateStr}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes if available */}
                  {goal.notes && (
                    <p className="text-xs text-slate-400 italic">
                      "{goal.notes}"
                    </p>
                  )}

                  {/* Expand / Collapse Details Toggle */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setExpandedPurchaseId(isExpanded ? null : goal.id)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-300 flex items-center space-x-1.5 transition-all cursor-pointer py-1"
                    >
                      <span>
                        {isExpanded ? 'Ocultar historial de abonos y accesorios' : `Ver historial de abonos (${goal.contributions?.length || 0}) y accesorios (${goal.checklists?.length || 0})`}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {/* Quick Add Abono Link */}
                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() => handleOpenContributionModal(goal)}
                        className="text-xs font-black text-emerald-500 hover:text-emerald-400 flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Registrar nuevo abono</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* EXPANDED SECTION: CONTRIBUTIONS LOG & ACCESSORIES CHECKLIST */}
                {isExpanded && (
                  <div className={`p-5 sm:p-6 border-t space-y-6 ${isDark ? 'bg-[#080d17] border-slate-800' : 'bg-slate-50/70 border-slate-200'}`}>
                    
                    {/* Row 1: Contributions Log */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-emerald-500" />
                          <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Historial de Abonos ({goal.contributions?.length || 0})
                          </h4>
                        </div>
                        {!isCompleted && (
                          <button
                            type="button"
                            onClick={() => handleOpenContributionModal(goal)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer"
                          >
                            + Agregar Abono
                          </button>
                        )}
                      </div>

                      {(!goal.contributions || goal.contributions.length === 0) ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic py-2">
                          Aún no hay abonos registrados para esta compra. Haz clic en "+ Agregar Abono" para empezar a llenar tu meta.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {goal.contributions.map((c) => (
                            <div
                              key={c.id}
                              className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                                isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black text-sm">
                                  +{formatCOP(c.amount)}
                                </span>
                                <div>
                                  <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                    {c.note || 'Abono programado'}
                                  </span>
                                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                                    <span>📅 {c.date}</span>
                                    {c.source && (
                                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                                        {c.source === 'quincena_1' ? '1ra Quincena' : c.source === 'quincena_2' ? '2da Quincena' : c.source}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`¿Eliminar este abono de ${formatCOP(c.amount)}?`)) {
                                    handleDeleteContribution(goal.id, c.id);
                                  }
                                }}
                                className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-all cursor-pointer"
                                title="Eliminar abono"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Row 2: Checklist of accessories / prerequisites */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <CheckSquare className="w-4 h-4 text-cyan-500" />
                          <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Accesorios & Pre-requisitos ({goal.checklists?.filter(c => c.completed).length || 0}/{goal.checklists?.length || 0})
                          </h4>
                        </div>
                      </div>

                      <div className="space-y-2 mb-3">
                        {(goal.checklists || []).map(item => (
                          <div
                            key={item.id}
                            onClick={() => handleToggleChecklist(goal.id, item.id)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                              item.completed
                                ? isDark ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                : isDark ? 'bg-[#0f172a] border-slate-800 text-slate-300 hover:border-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              {item.completed ? (
                                <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <span className={item.completed ? 'line-through opacity-70' : ''}>
                                {item.title}
                              </span>
                            </div>
                            {item.estimatedCost && (
                              <span className="font-mono font-semibold text-slate-400">
                                {formatCOP(item.estimatedCost)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add Item to Checklist input */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const input = (e.currentTarget.elements.namedItem('newChecklist') as HTMLInputElement);
                          if (input && input.value.trim()) {
                            handleAddChecklistItem(goal.id, input.value);
                            input.value = '';
                          }
                        }}
                        className="flex items-center space-x-2"
                      >
                        <input
                          name="newChecklist"
                          type="text"
                          placeholder="Agregar accesorio o pre-requisito (ej: Batería extra, estuche rígido)..."
                          className={`flex-1 px-3 py-1.5 rounded-xl text-xs border outline-none ${
                            isDark ? 'bg-[#0f172a] border-slate-800 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 transition-all cursor-pointer"
                        >
                          + Agregar
                        </button>
                      </form>
                    </div>

                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: CREATE / EDIT PURCHASE */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl p-6 ${
              isDark ? 'bg-[#0f172a] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-500 flex items-center justify-center text-xl">
                  {formEmoji || '🛍️'}
                </div>
                <div>
                  <h3 className="text-base font-black">
                    {editingPurchase ? 'Editar Compra Programada' : 'Crear Compra Inteligente Programada'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Define el valor del artículo, tu ritmo de abono y proyecta la fecha estimada.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="space-y-4 pt-4">
              {/* Row: Title & Emoji */}
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="text-xs font-bold text-slate-400 block mb-1">Emoji</label>
                  <input
                    type="text"
                    value={formEmoji}
                    onChange={(e) => setFormEmoji(e.target.value)}
                    className={`w-full px-3 py-2 text-center text-xl rounded-xl border outline-none ${
                      isDark ? 'bg-[#090e18] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-xs font-bold text-slate-400 block mb-1">Artículo a Comprar *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ej: Drone DJI Neo 2, Impresora 3D Bambu Lab..."
                    className={`w-full px-3 py-2 rounded-xl border text-sm font-semibold outline-none ${
                      isDark ? 'bg-[#090e18] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
              </div>

              {/* Row: Category & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Categoría</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as SmartPurchaseCategory)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none ${
                      isDark ? 'bg-[#090e18] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Prioridad</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none ${
                      isDark ? 'bg-[#090e18] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="alta">🔥 Alta Prioridad</option>
                    <option value="media">⚡ Media</option>
                    <option value="baja">🌱 Baja / Deseo a futuro</option>
                  </select>
                </div>
              </div>

              {/* Row: Target Price & Initial Saved Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Valor Total Estimado (COP) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    step="any"
                    value={formTargetPrice}
                    onChange={(e) => setFormTargetPrice(e.target.value)}
                    placeholder="2300000"
                    className={`w-full px-3 py-2 rounded-xl border text-sm font-mono font-bold outline-none ${
                      isDark ? 'bg-[#090e18] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                  <span className="text-[10px] text-slate-500 font-mono">
                    {formatCOP(parseFloat(formTargetPrice) || 0)}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Total Ya Ahorrado (COP)</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={formSavedAmount}
                    onChange={(e) => setFormSavedAmount(e.target.value)}
                    placeholder="0"
                    className={`w-full px-3 py-2 rounded-xl border text-sm font-mono font-bold outline-none ${
                      isDark ? 'bg-[#090e18] border-slate-700 text-emerald-400' : 'bg-slate-50 border-slate-300 text-emerald-700'
                    }`}
                  />
                  <span className="text-[10px] text-slate-500 font-mono">
                    {formatCOP(parseFloat(formSavedAmount) || 0)}
                  </span>
                </div>
              </div>

              {/* Row: Regular Contribution & Frequency for Projections */}
              <div className="p-3.5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 space-y-2">
                <div className="flex items-center space-x-2 text-indigo-400 text-xs font-black">
                  <Calculator className="w-4 h-4" />
                  <span>Configuración de Abonos para la Proyección</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">Abono Planeado por Período</label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={formContributionPerPeriod}
                      onChange={(e) => setFormContributionPerPeriod(e.target.value)}
                      placeholder="70000"
                      className={`w-full px-3 py-2 rounded-xl border text-sm font-mono font-bold outline-none ${
                        isDark ? 'bg-[#090e18] border-slate-700 text-white' : 'bg-white border-slate-300'
                      }`}
                    />
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatCOP(parseFloat(formContributionPerPeriod) || 0)}
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">Frecuencia de Abono</label>
                    <select
                      value={formFrequency}
                      onChange={(e) => setFormFrequency(e.target.value as ContributionFrequency)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none ${
                        isDark ? 'bg-[#090e18] border-slate-700 text-white' : 'bg-white border-slate-300'
                      }`}
                    >
                      <option value="quincenal">🗓️ Quincenal (Cada 15 días)</option>
                      <option value="mensual">📅 Mensual (1 vez al mes)</option>
                      <option value="semanal">⚡ Semanal</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Row: Model / Specs & Store Link */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Versión / Especificación</label>
                  <input
                    type="text"
                    value={formModelOrSpecs}
                    onChange={(e) => setFormModelOrSpecs(e.target.value)}
                    placeholder="Ej: Fly More Combo, AMS Lite..."
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                      isDark ? 'bg-[#090e18] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Tienda / Enlace</label>
                  <input
                    type="text"
                    value={formStoreOrLink}
                    onChange={(e) => setFormStoreOrLink(e.target.value)}
                    placeholder="Ej: DJI Oficial, MercadoLibre, Amazon..."
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                      isDark ? 'bg-[#090e18] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Notas / Motivo de la Compra</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Para qué se utilizará, por qué es una buena inversión..."
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                    isDark ? 'bg-[#090e18] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-orange-500 text-slate-950 hover:brightness-110 shadow-md transition-all cursor-pointer"
                >
                  {editingPurchase ? 'Guardar Cambios' : 'Crear Compra Programada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD CONTRIBUTION */}
      {isContributionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 ${
              isDark ? 'bg-[#0f172a] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg font-bold">
                  💰
                </div>
                <div>
                  <h3 className="text-base font-black">Registrar Abono a la Meta</h3>
                  <p className="text-xs text-slate-400">
                    Añade dinero al fondo de esta compra programada.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsContributionModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContribution} className="space-y-3.5 pt-3">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Monto del Abono (COP) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  step="any"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  placeholder="70000"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-base font-mono font-bold outline-none ${
                    isDark ? 'bg-[#090e18] border-slate-700 text-emerald-400' : 'bg-slate-50 border-slate-300 text-emerald-700'
                  }`}
                />
                <span className="text-xs text-emerald-500 font-mono font-bold mt-1 block">
                  {formatCOP(parseFloat(contributionAmount) || 0)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Fecha de Abono</label>
                  <input
                    type="date"
                    required
                    value={contributionDate}
                    onChange={(e) => setContributionDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                      isDark ? 'bg-[#090e18] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Origen del Dinero</label>
                  <select
                    value={contributionSource}
                    onChange={(e) => setContributionSource(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                      isDark ? 'bg-[#090e18] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="quincena_1">1ra Quincena (1-15)</option>
                    <option value="quincena_2">2da Quincena (16-31)</option>
                    <option value="ahorro_extra">Ahorro Extra / Bono</option>
                    <option value="negocio">Venta de Negocio</option>
                    <option value="otro">Otro Origen</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Nota o Descripción</label>
                <input
                  type="text"
                  value={contributionNote}
                  onChange={(e) => setContributionNote(e.target.value)}
                  placeholder="Ej: Abono quincenal para el Drone, prima de junio..."
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                    isDark ? 'bg-[#090e18] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsContributionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all cursor-pointer"
                >
                  Confirmar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: MARK AS PURCHASED CELEBRATION */}
      {isMarkPurchasedModalOpen && markPurchasedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 ${
              isDark ? 'bg-[#0f172a] border-purple-500/30 text-white' : 'bg-white border-purple-200 text-slate-900'
            }`}
          >
            <div className="text-center space-y-2 mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center mx-auto text-2xl shadow-lg shadow-purple-500/30">
                🎉
              </div>
              <h3 className="text-lg font-black">
                ¡Felicitaciones! Compra Realizada
              </h3>
              <p className="text-xs text-slate-400">
                Vas a marcar <span className="text-purple-400 font-bold">{markPurchasedGoal.title}</span> como compra completada. Pasará a tu archivo histórico de metas logradas.
              </p>
            </div>

            <form onSubmit={handleConfirmMarkPurchased} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Precio Final Pagado (COP)</label>
                <input
                  type="number"
                  required
                  min={1}
                  step="any"
                  value={purchasedPriceInput}
                  onChange={(e) => setPurchasedPriceInput(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm font-mono font-bold outline-none ${
                    isDark ? 'bg-[#090e18] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Fecha de la Compra</label>
                <input
                  type="date"
                  required
                  value={purchasedDateInput}
                  onChange={(e) => setPurchasedDateInput(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                    isDark ? 'bg-[#090e18] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Notas de la Compra</label>
                <textarea
                  rows={2}
                  value={purchasedNotesInput}
                  onChange={(e) => setPurchasedNotesInput(e.target.value)}
                  placeholder="Dónde se compró, si vino con garantía o descuento..."
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                    isDark ? 'bg-[#090e18] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMarkPurchasedModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                >
                  Guardar en el Histórico 🎉
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: PRESETS QUICK SELECTOR */}
      {isPresetsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl border shadow-2xl p-6 ${
              isDark ? 'bg-[#0f172a] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">Ideas & Presets Populares</h3>
                  <p className="text-xs text-slate-400">
                    Elige una compra preconfigurada para agregarla en 1 clic.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPresetsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 pt-4">
              {PRESET_TEMPLATES.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => handleApplyPreset(p)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isDark
                      ? 'bg-[#090e18] border-slate-800 hover:border-orange-500/50 hover:bg-[#0f1b30]'
                      : 'bg-slate-50 border-slate-200 hover:border-orange-300 hover:bg-orange-50/40'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl p-2 rounded-xl bg-slate-800/40">{p.emoji}</span>
                    <div>
                      <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {p.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">{p.notes}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] font-mono">
                        <span className="text-orange-400 font-bold">{formatCOP(p.targetPrice)}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-indigo-400">Abonos de {formatCOP(p.estimatedContributionPerPeriod)} {p.frequency}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-xl text-xs font-black bg-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-slate-950 transition-all shrink-0"
                  >
                    Usar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
