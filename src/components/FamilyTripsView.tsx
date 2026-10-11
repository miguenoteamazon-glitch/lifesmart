import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { TripDestination, TripPlace, TripSavingContribution, TripPackingItem, TripStatus, TripPlaceCategory, Task } from '../types';
import { 
  Plane, 
  MapPin, 
  PiggyBank, 
  Calendar, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  Compass, 
  Luggage, 
  DollarSign, 
  Users, 
  ArrowRight, 
  RotateCcw, 
  CheckSquare, 
  Square, 
  X, 
  AlertCircle, 
  Hotel, 
  Palmtree, 
  TrendingUp, 
  Info,
  ChevronRight,
  Send,
  Camera,
  Heart
} from 'lucide-react';

interface FamilyTripsViewProps {
  trips: TripDestination[];
  onAddTrip: (trip: Omit<TripDestination, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateTrip: (trip: TripDestination) => void;
  onDeleteTrip: (tripId: string) => void;
  onOpenNewTaskModal?: (prefilled?: Partial<Task>) => void;
  onResetTripsData?: () => void;
}

const PLACE_CATEGORIES: { id: TripPlaceCategory; label: string; icon: string; color: string }[] = [
  { id: 'playa', label: 'Playa & Mar', icon: '🏖️', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { id: 'atraccion', label: 'Atracción / Parque', icon: '🎡', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { id: 'cultura', label: 'Cultura & Ruinas', icon: '🏛️', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { id: 'aventura', label: 'Aventura & Cenotes', icon: '🛶', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { id: 'restaurante', label: 'Gastronomía & Tacos', icon: '🌮', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  { id: 'compras', label: 'Compras & Souvenirs', icon: '🛍️', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  { id: 'otro', label: 'Otro Lugar', icon: '📍', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
];

const PRESET_DESTINATIONS = [
  { title: 'Cancún & Riviera Maya', country: '🇲🇽 México', emoji: '🌴', budget: 5000000, days: 7, notes: 'Playas turquesas, parques como Xcaret y ruinas de Chichén Itzá.' },
  { title: 'San Andrés & Providencia', country: '🇨🇴 Colombia', emoji: '🐠', budget: 3500000, days: 5, notes: 'Mar de los 7 colores, snorkel en Johnny Cay y vuelta a la isla.' },
  { title: 'Cartagena & Islas del Rosario', country: '🇨🇴 Colombia', emoji: '🏰', budget: 3000000, days: 4, notes: 'Ciudad amurallada, historia colonial y descanso en Barú.' },
  { title: 'Eje Cafetero & Termales', country: '🇨🇴 Colombia', emoji: '☕', budget: 2200000, days: 4, notes: 'Parque del Café, Panaca, Valle de Cocora y termales de Santa Rosa.' },
  { title: 'Orlando & Parques Mágicos', country: '🇺🇸 EE.UU.', emoji: '🎢', budget: 12000000, days: 10, notes: 'Parques temáticos, compras y entretenimiento familiar.' },
];

const STATUS_LABELS: Record<TripStatus, { label: string; bg: string; text: string; border: string }> = {
  planeando: { label: 'Planeando', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  ahorrando: { label: 'Ahorrando Meta', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  listo_para_viajar: { label: '¡Listo para Viajar!', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  en_viaje: { label: '¡En Viaje!', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  completado: { label: 'Completado', bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' },
};

export const FamilyTripsView: React.FC<FamilyTripsViewProps> = ({
  trips,
  onAddTrip,
  onUpdateTrip,
  onDeleteTrip,
  onOpenNewTaskModal,
  onResetTripsData,
}) => {
  const { isDark } = useTheme();
  const [selectedTripId, setSelectedTripId] = useState<string | null>(trips.length > 0 ? trips[0].id : null);
  const [activeTab, setActiveTab] = useState<'sitios' | 'ahorro' | 'equipaje' | 'logistica'>('sitios');
  
  // Modals
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TripDestination | null>(null);
  
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [contributionAmount, setContributionAmount] = useState<string>('');
  const [contributionDate, setContributionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [contributionSource, setContributionSource] = useState<string>('');

  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [placeName, setPlaceName] = useState('');
  const [placeCategory, setPlaceCategory] = useState<TripPlaceCategory>('playa');
  const [placeCost, setPlaceCost] = useState<string>('');
  const [placeNotes, setPlaceNotes] = useState('');

  const [newPackingItem, setNewPackingItem] = useState('');

  // Trip form state
  const [formTitle, setFormTitle] = useState('');
  const [formDestination, setFormDestination] = useState('');
  const [formCountryOrFlag, setFormCountryOrFlag] = useState('🇲🇽 México');
  const [formEmoji, setFormEmoji] = useState('🌴');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formEstimatedBudget, setFormEstimatedBudget] = useState('5000000');
  const [formSavedAmount, setFormSavedAmount] = useState('0');
  const [formTravelers, setFormTravelers] = useState('4');
  const [formFlightNotes, setFormFlightNotes] = useState('');
  const [formAccommodationNotes, setFormAccommodationNotes] = useState('');
  const [formGeneralNotes, setFormGeneralNotes] = useState('');
  const [formStatus, setFormStatus] = useState<TripStatus>('ahorrando');

  // Selected trip helper
  const currentTrip = trips.find(t => t.id === selectedTripId) || (trips.length > 0 ? trips[0] : null);

  // Global calculations
  const totalBudget = trips.reduce((acc, t) => acc + (t.estimatedBudget || 0), 0);
  const totalSaved = trips.reduce((acc, t) => acc + (t.savedAmount || 0), 0);
  const totalPending = Math.max(0, totalBudget - totalSaved);
  const globalProgress = totalBudget > 0 ? Math.min(100, Math.round((totalSaved / totalBudget) * 100)) : 0;

  // Days calculation for a trip
  const calculateDaysRemaining = (startDateStr: string) => {
    if (!startDateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(startDateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Open modal to create trip
  const handleOpenCreateTripModal = () => {
    setEditingTrip(null);
    setFormTitle('Viaje Familiar a Cancún 🌴');
    setFormDestination('Cancún, México');
    setFormCountryOrFlag('🇲🇽 México');
    setFormEmoji('🌴');
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    setFormStartDate(d.toISOString().split('T')[0]);
    const dEnd = new Date(d);
    dEnd.setDate(dEnd.getDate() + 7);
    setFormEndDate(dEnd.toISOString().split('T')[0]);
    setFormEstimatedBudget('5000000');
    setFormSavedAmount('0');
    setFormTravelers('4');
    setFormFlightNotes('Vuelos ida y vuelta con equipaje de mano incluido.');
    setFormAccommodationNotes('Hotel todo incluido o apartamento con piscina cerca de la playa.');
    setFormGeneralNotes('Planear actividades para disfrutar en familia sin pantallas.');
    setFormStatus('ahorrando');
    setIsTripModalOpen(true);
  };

  // Open modal to edit trip
  const handleOpenEditTripModal = (trip: TripDestination) => {
    setEditingTrip(trip);
    setFormTitle(trip.title);
    setFormDestination(trip.destination);
    setFormCountryOrFlag(trip.countryOrFlag || '🇲🇽 México');
    setFormEmoji(trip.coverEmoji || '🌴');
    setFormStartDate(trip.startDate);
    setFormEndDate(trip.endDate || '');
    setFormEstimatedBudget(trip.estimatedBudget.toString());
    setFormSavedAmount(trip.savedAmount.toString());
    setFormTravelers((trip.travelersCount || 4).toString());
    setFormFlightNotes(trip.flightOrTransportNotes || '');
    setFormAccommodationNotes(trip.accommodationNotes || '');
    setFormGeneralNotes(trip.generalNotes || '');
    setFormStatus(trip.status);
    setIsTripModalOpen(true);
  };

  // Save Trip (Create or Edit)
  const handleSaveTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDestination.trim() || !formStartDate) return;

    const budget = parseFloat(formEstimatedBudget) || 0;
    const saved = parseFloat(formSavedAmount) || 0;
    const travelers = parseInt(formTravelers) || 1;

    if (editingTrip) {
      const updated: TripDestination = {
        ...editingTrip,
        title: formTitle.trim(),
        destination: formDestination.trim(),
        countryOrFlag: formCountryOrFlag.trim(),
        coverEmoji: formEmoji,
        startDate: formStartDate,
        endDate: formEndDate || undefined,
        estimatedBudget: budget,
        savedAmount: saved,
        travelersCount: travelers,
        flightOrTransportNotes: formFlightNotes.trim() || undefined,
        accommodationNotes: formAccommodationNotes.trim() || undefined,
        generalNotes: formGeneralNotes.trim() || undefined,
        status: formStatus,
        updatedAt: new Date().toISOString(),
      };
      onUpdateTrip(updated);
    } else {
      const newTripData: Omit<TripDestination, 'id' | 'createdAt' | 'updatedAt'> = {
        title: formTitle.trim(),
        destination: formDestination.trim(),
        countryOrFlag: formCountryOrFlag.trim(),
        coverEmoji: formEmoji,
        startDate: formStartDate,
        endDate: formEndDate || undefined,
        status: formStatus,
        estimatedBudget: budget,
        savedAmount: saved,
        currency: 'COP',
        travelersCount: travelers,
        flightOrTransportNotes: formFlightNotes.trim() || undefined,
        accommodationNotes: formAccommodationNotes.trim() || undefined,
        generalNotes: formGeneralNotes.trim() || undefined,
        placesToVisit: [
          {
            id: `p-${Date.now()}-1`,
            name: 'Paseo en la playa al atardecer',
            category: 'playa',
            estimatedCost: 0,
            visited: false,
            notes: 'Caminar descalzos y tomar fotos familiares.'
          },
          {
            id: `p-${Date.now()}-2`,
            name: 'Cena típica en restaurante local',
            category: 'restaurante',
            estimatedCost: 150000,
            visited: false,
            notes: 'Probar los platos típicos del destino.'
          }
        ],
        savingsContributions: saved > 0 ? [
          {
            id: `sav-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            amount: saved,
            sourceOrNote: 'Aporte de ahorro inicial'
          }
        ] : [],
        packingList: [
          { id: `pack-${Date.now()}-1`, item: 'Documentos de identidad y reservas', packed: false, category: 'documentos' },
          { id: `pack-${Date.now()}-2`, item: 'Ropa cómoda y trajes de baño', packed: false, category: 'ropa' },
          { id: `pack-${Date.now()}-3`, item: 'Protector solar y repelente', packed: false, category: 'salud_cuidado' },
          { id: `pack-${Date.now()}-4`, item: 'Cargadores y cámara de fotos', packed: false, category: 'tecnologia' },
        ]
      };
      onAddTrip(newTripData);
    }

    setIsTripModalOpen(false);
  };

  // Add savings contribution
  const handleSaveContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTrip) return;
    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) return;

    const newContrib: TripSavingContribution = {
      id: `save-${Date.now()}`,
      date: contributionDate || new Date().toISOString().split('T')[0],
      amount: amount,
      sourceOrNote: contributionSource.trim() || 'Aporte al fondo de vacaciones',
    };

    const newContributions = [...(currentTrip.savingsContributions || []), newContrib];
    const newSavedTotal = (currentTrip.savedAmount || 0) + amount;

    // If reached or exceeded budget, adjust status if was saving
    let newStatus = currentTrip.status;
    if (newSavedTotal >= currentTrip.estimatedBudget && currentTrip.status === 'ahorrando') {
      newStatus = 'listo_para_viajar';
    }

    const updatedTrip: TripDestination = {
      ...currentTrip,
      savedAmount: newSavedTotal,
      status: newStatus,
      savingsContributions: newContributions,
      updatedAt: new Date().toISOString(),
    };

    onUpdateTrip(updatedTrip);
    setIsContributionModalOpen(false);
    setContributionAmount('');
    setContributionSource('');
  };

  // Delete savings contribution
  const handleDeleteContribution = (contribId: string) => {
    if (!currentTrip) return;
    const contrib = currentTrip.savingsContributions?.find(c => c.id === contribId);
    if (!contrib) return;

    const newContributions = (currentTrip.savingsContributions || []).filter(c => c.id !== contribId);
    const newSavedTotal = Math.max(0, (currentTrip.savedAmount || 0) - contrib.amount);

    const updatedTrip: TripDestination = {
      ...currentTrip,
      savedAmount: newSavedTotal,
      savingsContributions: newContributions,
      updatedAt: new Date().toISOString(),
    };

    onUpdateTrip(updatedTrip);
  };

  // Add place to visit
  const handleSavePlace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTrip || !placeName.trim()) return;

    const newPlace: TripPlace = {
      id: `place-${Date.now()}`,
      name: placeName.trim(),
      category: placeCategory,
      estimatedCost: placeCost ? parseFloat(placeCost) : undefined,
      visited: false,
      notes: placeNotes.trim() || undefined,
    };

    const updatedPlaces = [...(currentTrip.placesToVisit || []), newPlace];
    const updatedTrip: TripDestination = {
      ...currentTrip,
      placesToVisit: updatedPlaces,
      updatedAt: new Date().toISOString(),
    };

    onUpdateTrip(updatedTrip);
    setIsPlaceModalOpen(false);
    setPlaceName('');
    setPlaceCost('');
    setPlaceNotes('');
  };

  // Toggle place visited
  const handleTogglePlaceVisited = (placeId: string) => {
    if (!currentTrip) return;
    const updatedPlaces = (currentTrip.placesToVisit || []).map(p => 
      p.id === placeId ? { ...p, visited: !p.visited } : p
    );
    onUpdateTrip({
      ...currentTrip,
      placesToVisit: updatedPlaces,
      updatedAt: new Date().toISOString(),
    });
  };

  // Delete place
  const handleDeletePlace = (placeId: string) => {
    if (!currentTrip) return;
    const updatedPlaces = (currentTrip.placesToVisit || []).filter(p => p.id !== placeId);
    onUpdateTrip({
      ...currentTrip,
      placesToVisit: updatedPlaces,
      updatedAt: new Date().toISOString(),
    });
  };

  // Add packing item
  const handleAddPackingItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTrip || !newPackingItem.trim()) return;

    const newItem: TripPackingItem = {
      id: `pack-${Date.now()}`,
      item: newPackingItem.trim(),
      packed: false,
      category: 'otro'
    };

    const updatedList = [...(currentTrip.packingList || []), newItem];
    onUpdateTrip({
      ...currentTrip,
      packingList: updatedList,
      updatedAt: new Date().toISOString(),
    });
    setNewPackingItem('');
  };

  // Toggle packing item
  const handleTogglePackingItem = (itemId: string) => {
    if (!currentTrip) return;
    const updatedList = (currentTrip.packingList || []).map(item => 
      item.id === itemId ? { ...item, packed: !item.packed } : item
    );
    onUpdateTrip({
      ...currentTrip,
      packingList: updatedList,
      updatedAt: new Date().toISOString(),
    });
  };

  // Delete packing item
  const handleDeletePackingItem = (itemId: string) => {
    if (!currentTrip) return;
    const updatedList = (currentTrip.packingList || []).filter(item => item.id !== itemId);
    onUpdateTrip({
      ...currentTrip,
      packingList: updatedList,
      updatedAt: new Date().toISOString(),
    });
  };

  // Preset destination picker helper
  const handleApplyPreset = (preset: typeof PRESET_DESTINATIONS[0]) => {
    setFormTitle(`Viaje Familiar a ${preset.title} ${preset.emoji}`);
    setFormDestination(preset.title);
    setFormCountryOrFlag(preset.country);
    setFormEmoji(preset.emoji);
    setFormEstimatedBudget(preset.budget.toString());
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    setFormStartDate(d.toISOString().split('T')[0]);
    const dEnd = new Date(d);
    dEnd.setDate(dEnd.getDate() + preset.days);
    setFormEndDate(dEnd.toISOString().split('T')[0]);
    setFormGeneralNotes(preset.notes);
  };

  return (
    <div id="family-trips-view" className="space-y-6">
      {/* Header Banner */}
      <div id="trips-header-banner" className={`relative overflow-hidden rounded-2xl p-6 shadow-xl backdrop-blur-md border transition-all ${
        isDark
          ? 'bg-gradient-to-r from-pink-900/40 via-rose-900/30 to-amber-900/30 border-pink-500/20'
          : 'bg-gradient-to-r from-rose-50 via-orange-50 to-amber-50 border-rose-200 shadow-rose-950/5'
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
              isDark
                ? 'bg-pink-500/20 border-pink-500/30 text-pink-300'
                : 'bg-rose-100 border-rose-300 text-rose-800'
            }`}>
              <Palmtree className="w-3.5 h-3.5 text-pink-400" />
              <span>Vacaciones & Experiencias Familiares</span>
            </div>
            <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              <span>✈️ Planeador de Viajes & Fondo de Ahorro</span>
            </h2>
            <p className={`text-sm max-w-2xl leading-relaxed ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Organiza los viajes de tus sueños en familia: presupuesto estimado, seguimiento de ahorro por cuotas, 
              cuenta regresiva de días, lugares de interés turístico y lista de equipaje sin estrés.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onResetTripsData && (
              <button
                id="btn-fresh-start-trips"
                onClick={() => {
                  if (window.confirm('¿Deseas reiniciar y limpiar los viajes para comenzar desde cero (Fresh Start)?')) {
                    onResetTripsData();
                  }
                }}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all shadow-sm border ${
                  isDark
                    ? 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/80 hover:border-slate-600'
                    : 'text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border-slate-200'
                }`}
                title="Limpiar datos de viajes y comenzar de cero"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Fresh Start</span>
              </button>
            )}

            <button
              id="btn-new-trip"
              onClick={handleOpenCreateTripModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>Programar Nuevo Viaje</span>
            </button>
          </div>
        </div>

        {/* Global Summary Metrics Bar */}
        <div id="trips-global-metrics" className={`grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t ${
          isDark ? 'border-pink-500/20' : 'border-rose-200'
        }`}>
          <div className={`rounded-xl p-3.5 border ${
            isDark ? 'bg-slate-900/60 border-pink-500/10' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <span className={`text-xs block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Meta Total de Ahorro</span>
            <span className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(totalBudget)}</span>
          </div>
          <div className={`rounded-xl p-3.5 border ${
            isDark ? 'bg-slate-900/60 border-pink-500/10' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <span className="text-xs text-emerald-500 block font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Ahorrado Acumulado
            </span>
            <span className={`text-lg font-bold tracking-tight ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{formatCurrency(totalSaved)}</span>
          </div>
          <div className={`rounded-xl p-3.5 border ${
            isDark ? 'bg-slate-900/60 border-pink-500/10' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <span className={`text-xs block font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Pendiente por Ahorrar</span>
            <span className={`text-lg font-bold tracking-tight ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>{formatCurrency(totalPending)}</span>
          </div>
          <div className={`rounded-xl p-3.5 border ${
            isDark ? 'bg-slate-900/60 border-pink-500/10' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <span className={`text-xs block font-medium ${isDark ? 'text-pink-400' : 'text-pink-600'}`}>Progreso Global</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-lg font-bold ${isDark ? 'text-pink-300' : 'text-pink-600'}`}>{globalProgress}%</span>
              <div className={`flex-1 rounded-full h-2 overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <div 
                  className="bg-gradient-to-r from-pink-500 to-emerald-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${globalProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trips Carousel / Selection Cards */}
      {trips.length === 0 ? (
        <div id="no-trips-placeholder" className="bg-slate-900/60 border border-dashed border-slate-700/80 rounded-2xl p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-pink-500/10 text-pink-400 mx-auto flex items-center justify-center text-3xl">
            🏖️
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No tienes viajes programados aún</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Empieza planeando unas vacaciones a Cancún, San Andrés o el destino que más les ilusione en familia.
            </p>
          </div>
          <button
            onClick={handleOpenCreateTripModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-pink-600 hover:bg-pink-500 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Mi Primer Viaje</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Trip Selector Badges */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {trips.map((trip) => {
              const isSelected = trip.id === currentTrip?.id;
              const daysLeft = calculateDaysRemaining(trip.startDate);
              const progress = trip.estimatedBudget > 0 ? Math.min(100, Math.round((trip.savedAmount / trip.estimatedBudget) * 100)) : 0;

              return (
                <button
                  key={trip.id}
                  id={`btn-select-trip-${trip.id}`}
                  onClick={() => setSelectedTripId(trip.id)}
                  className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    isSelected 
                      ? 'bg-pink-950/40 border-pink-500/50 shadow-md shadow-pink-500/10 ring-1 ring-pink-500/30' 
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 text-slate-300'
                  }`}
                >
                  <span className="text-2xl">{trip.coverEmoji || '🌴'}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white truncate max-w-[180px]">{trip.destination}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${STATUS_LABELS[trip.status].bg} ${STATUS_LABELS[trip.status].text} ${STATUS_LABELS[trip.status].border}`}>
                        {STATUS_LABELS[trip.status].label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span>{progress}% Ahorrado</span>
                      {daysLeft !== null && (
                        <span className="text-pink-400 font-medium">
                          {daysLeft > 0 ? `Faltan ${daysLeft}d` : daysLeft === 0 ? '¡Hoy es el viaje!' : 'Viaje pasado'}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Trip Hero Details Card */}
          {currentTrip && (
            <div id="active-trip-card" className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              {/* Trip Header Banner */}
              <div className="p-6 bg-gradient-to-r from-slate-900 via-pink-950/20 to-slate-900 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-3xl">{currentTrip.coverEmoji || '🏖️'}</span>
                    <h3 className="text-2xl font-extrabold text-white tracking-tight">{currentTrip.title}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_LABELS[currentTrip.status].bg} ${STATUS_LABELS[currentTrip.status].text} ${STATUS_LABELS[currentTrip.status].border}`}>
                      {STATUS_LABELS[currentTrip.status].label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                    <span className="flex items-center gap-1.5 text-pink-300">
                      <MapPin className="w-4 h-4 text-pink-400" />
                      <strong>{currentTrip.destination}</strong> {currentTrip.countryOrFlag && `(${currentTrip.countryOrFlag})`}
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {currentTrip.startDate} {currentTrip.endDate && `al ${currentTrip.endDate}`}
                    </span>
                    {currentTrip.travelersCount && (
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Users className="w-4 h-4 text-slate-400" />
                        {currentTrip.travelersCount} personas
                      </span>
                    )}
                  </div>
                </div>

                {/* Days Remaining Pill & Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  {(() => {
                    const days = calculateDaysRemaining(currentTrip.startDate);
                    if (days === null) return null;
                    return (
                      <div className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500/20 to-rose-500/20 border border-pink-500/30 text-center">
                        <span className="text-xs text-pink-300 block font-medium">Cuenta Regresiva</span>
                        <span className="text-lg font-black text-white">
                          {days > 0 ? `¡Faltan ${days} días!` : days === 0 ? '✈️ ¡HOY VIAJAMOS!' : '🌴 ¡Disfrutado!'}
                        </span>
                      </div>
                    );
                  })()}

                  <button
                    id="btn-edit-active-trip"
                    onClick={() => handleOpenEditTripModal(currentTrip)}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
                    title="Editar detalles del viaje"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    id="btn-delete-active-trip"
                    onClick={() => {
                      if (window.confirm(`¿Estás seguro de eliminar el viaje a "${currentTrip.destination}"?`)) {
                        onDeleteTrip(currentTrip.id);
                      }
                    }}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 transition-all"
                    title="Eliminar viaje"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Financial Progress Deep Dive */}
              <div className="p-6 bg-slate-900/40 border-b border-slate-800">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-slate-850/80 rounded-xl p-4 border border-slate-800">
                    <span className="text-xs text-slate-400 block font-medium">Presupuesto Estimado</span>
                    <span className="text-2xl font-black text-white tracking-tight">{formatCurrency(currentTrip.estimatedBudget)}</span>
                    <span className="text-[11px] text-slate-500 block mt-1">Hospedaje, vuelos, tours y comidas</span>
                  </div>

                  <div className="bg-slate-850/80 rounded-xl p-4 border border-emerald-500/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-400 font-medium">Ahorro Actual</span>
                      <button
                        id="btn-quick-add-savings"
                        onClick={() => {
                          setContributionDate(new Date().toISOString().split('T')[0]);
                          setContributionAmount('');
                          setContributionSource('Ahorro quincenal');
                          setIsContributionModalOpen(true);
                        }}
                        className="text-xs font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-500/20 hover:bg-emerald-500/30 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Registrar Aporte
                      </button>
                    </div>
                    <span className="text-2xl font-black text-emerald-400 tracking-tight block mt-1">
                      {formatCurrency(currentTrip.savedAmount)}
                    </span>
                    <span className="text-[11px] text-emerald-400/80 block mt-1">
                      {currentTrip.savingsContributions?.length || 0} aportes registrados
                    </span>
                  </div>

                  <div className="bg-slate-850/80 rounded-xl p-4 border border-amber-500/20">
                    <span className="text-xs text-amber-400 block font-medium">Falta por Ahorrar</span>
                    <span className="text-2xl font-black text-amber-300 tracking-tight">
                      {formatCurrency(Math.max(0, currentTrip.estimatedBudget - currentTrip.savedAmount))}
                    </span>
                    {(() => {
                      const days = calculateDaysRemaining(currentTrip.startDate);
                      const pending = Math.max(0, currentTrip.estimatedBudget - currentTrip.savedAmount);
                      if (days && days > 0 && pending > 0) {
                        const months = Math.max(1, Math.round(days / 30));
                        const monthlyNeeded = Math.round(pending / months);
                        return (
                          <span className="text-[11px] text-amber-400/80 block mt-1">
                            💡 Sugerido: {formatCurrency(monthlyNeeded)} / mes
                          </span>
                        );
                      }
                      return (
                        <span className="text-[11px] text-emerald-400 block mt-1">
                          🎉 ¡Meta de ahorro completada!
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-400 font-medium">
                    <span>Avance del Ahorro</span>
                    <span className="text-pink-400 font-bold">
                      {currentTrip.estimatedBudget > 0 
                        ? Math.min(100, Math.round((currentTrip.savedAmount / currentTrip.estimatedBudget) * 100))
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-3.5 p-0.5 overflow-hidden border border-slate-700/60">
                    <div 
                      className="bg-gradient-to-r from-pink-500 via-rose-500 to-emerald-400 h-full rounded-full transition-all duration-700 shadow-sm"
                      style={{ 
                        width: `${currentTrip.estimatedBudget > 0 ? Math.min(100, (currentTrip.savedAmount / currentTrip.estimatedBudget) * 100) : 0}%` 
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="flex border-b border-slate-800 bg-slate-900/60 px-6">
                <button
                  id="tab-btn-places"
                  onClick={() => setActiveTab('sitios')}
                  className={`flex items-center gap-2 px-4 py-3.5 font-bold text-sm border-b-2 transition-all ${
                    activeTab === 'sitios'
                      ? 'border-pink-500 text-pink-400 bg-pink-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  <span>Sitios por Visitar & Tours ({currentTrip.placesToVisit?.length || 0})</span>
                </button>

                <button
                  id="tab-btn-savings"
                  onClick={() => setActiveTab('ahorro')}
                  className={`flex items-center gap-2 px-4 py-3.5 font-bold text-sm border-b-2 transition-all ${
                    activeTab === 'ahorro'
                      ? 'border-pink-500 text-pink-400 bg-pink-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <PiggyBank className="w-4 h-4" />
                  <span>Historial de Aportes ({currentTrip.savingsContributions?.length || 0})</span>
                </button>

                <button
                  id="tab-btn-packing"
                  onClick={() => setActiveTab('equipaje')}
                  className={`flex items-center gap-2 px-4 py-3.5 font-bold text-sm border-b-2 transition-all ${
                    activeTab === 'equipaje'
                      ? 'border-pink-500 text-pink-400 bg-pink-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Luggage className="w-4 h-4" />
                  <span>Equipaje & Checklist ({currentTrip.packingList?.filter(i => i.packed).length || 0}/{currentTrip.packingList?.length || 0})</span>
                </button>

                <button
                  id="tab-btn-logistics"
                  onClick={() => setActiveTab('logistica')}
                  className={`flex items-center gap-2 px-4 py-3.5 font-bold text-sm border-b-2 transition-all ${
                    activeTab === 'logistica'
                      ? 'border-pink-500 text-pink-400 bg-pink-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Hotel className="w-4 h-4" />
                  <span>Logística & Notas</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-6">
                {/* 1. PLACES TO VISIT TAB */}
                {activeTab === 'sitios' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-bold text-white flex items-center gap-2">
                          <Compass className="w-5 h-5 text-pink-400" />
                          <span>Atracciones, Playas y Sitios de Interés en {currentTrip.destination}</span>
                        </h4>
                        <p className="text-xs text-slate-400">
                          Guarda los lugares imperdibles, parques, cenotes, restaurantes y actividades que quieren disfrutar.
                        </p>
                      </div>

                      <button
                        id="btn-add-place-modal"
                        onClick={() => {
                          setPlaceName('');
                          setPlaceCategory('playa');
                          setPlaceCost('');
                          setPlaceNotes('');
                          setIsPlaceModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-pink-600 hover:bg-pink-500 shadow-md shadow-pink-600/20 transition-all self-start sm:self-auto"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Agregar Sitio para Visitar</span>
                      </button>
                    </div>

                    {(!currentTrip.placesToVisit || currentTrip.placesToVisit.length === 0) ? (
                      <div className="text-center py-10 bg-slate-850/50 rounded-xl border border-dashed border-slate-700/80 p-6 space-y-3">
                        <span className="text-3xl block">🏖️</span>
                        <p className="text-slate-300 text-sm font-medium">Aún no has agregado sitios de interés</p>
                        <p className="text-slate-500 text-xs">Ej: Parque Xcaret, Chichén Itzá, Cenotes, Playa Delfines, etc.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentTrip.placesToVisit.map((place) => {
                          const catInfo = PLACE_CATEGORIES.find(c => c.id === place.category) || PLACE_CATEGORIES[0];
                          return (
                            <div 
                              key={place.id}
                              id={`place-item-${place.id}`}
                              className={`p-4 rounded-xl border transition-all ${
                                place.visited 
                                  ? 'bg-slate-900/40 border-slate-800/80 opacity-75' 
                                  : 'bg-slate-850 border-slate-700/80 hover:border-pink-500/40 hover:shadow-lg shadow-sm'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 flex-1">
                                  <button
                                    onClick={() => handleTogglePlaceVisited(place.id)}
                                    className="mt-0.5 text-pink-400 hover:text-pink-300 transition-colors"
                                    title={place.visited ? 'Marcar como pendiente' : 'Marcar como visitado'}
                                  >
                                    {place.visited ? (
                                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                    ) : (
                                      <Square className="w-5 h-5 text-slate-500 hover:text-pink-400" />
                                    )}
                                  </button>

                                  <div className="space-y-1 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h5 className={`font-bold text-sm text-white ${place.visited ? 'line-through text-slate-400' : ''}`}>
                                        {place.name}
                                      </h5>
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border flex items-center gap-1 ${catInfo.color}`}>
                                        <span>{catInfo.icon}</span>
                                        <span>{catInfo.label}</span>
                                      </span>
                                    </div>

                                    {place.notes && (
                                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-2 rounded-lg border border-slate-800 mt-1.5">
                                        💡 {place.notes}
                                      </p>
                                    )}

                                    {place.estimatedCost !== undefined && place.estimatedCost > 0 && (
                                      <div className="text-xs text-pink-300 font-semibold pt-1">
                                        Costo estimado: {formatCurrency(place.estimatedCost)}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleDeletePlace(place.id)}
                                  className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                                  title="Eliminar sitio"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. SAVINGS CONTRIBUTIONS TAB */}
                {activeTab === 'ahorro' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-bold text-white flex items-center gap-2">
                          <PiggyBank className="w-5 h-5 text-emerald-400" />
                          <span>Historial de Aportes & Fondo de Ahorro</span>
                        </h4>
                        <p className="text-xs text-slate-400">
                          Registra cada ahorro quincenal, prima o aporte familiar para ver cómo crece el fondo de vacaciones.
                        </p>
                      </div>

                      <button
                        id="btn-add-contribution-modal"
                        onClick={() => {
                          setContributionDate(new Date().toISOString().split('T')[0]);
                          setContributionAmount('');
                          setContributionSource('Ahorro quincenal');
                          setIsContributionModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all self-start sm:self-auto"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Registrar Nuevo Aporte</span>
                      </button>
                    </div>

                    {(!currentTrip.savingsContributions || currentTrip.savingsContributions.length === 0) ? (
                      <div className="text-center py-10 bg-slate-850/50 rounded-xl border border-dashed border-slate-700/80 p-6 space-y-3">
                        <span className="text-3xl block">💰</span>
                        <p className="text-slate-300 text-sm font-medium">Aún no hay aportes de ahorro registrados</p>
                        <p className="text-slate-500 text-xs">Registra tu primer aporte para iniciar el fondo de {currentTrip.destination}.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {currentTrip.savingsContributions.map((contrib, idx) => (
                          <div
                            key={contrib.id}
                            id={`contrib-row-${contrib.id}`}
                            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-850 border border-slate-800 hover:border-emerald-500/30 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/20">
                                #{idx + 1}
                              </div>
                              <div>
                                <h6 className="font-semibold text-sm text-white">{contrib.sourceOrNote}</h6>
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-500" />
                                  {contrib.date}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <span className="text-base font-bold text-emerald-400">
                                +{formatCurrency(contrib.amount)}
                              </span>
                              <button
                                onClick={() => handleDeleteContribution(contrib.id)}
                                className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                                title="Eliminar aporte"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. PACKING & CHECKLIST TAB */}
                {activeTab === 'equipaje' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-bold text-white flex items-center gap-2">
                          <Luggage className="w-5 h-5 text-pink-400" />
                          <span>Lista de Equipaje & Documentos Familiares</span>
                        </h4>
                        <p className="text-xs text-slate-400">
                          Prepara las maletas con tiempo para que no falte nada esencial antes de salir.
                        </p>
                      </div>
                    </div>

                    {/* Quick Add Packing Item Input */}
                    <form onSubmit={handleAddPackingItem} className="flex gap-2">
                      <input
                        type="text"
                        value={newPackingItem}
                        onChange={(e) => setNewPackingItem(e.target.value)}
                        placeholder="Agregar elemento al equipaje (ej: Bloqueador biodegradable, Aqua shoes, etc.)..."
                        className="flex-1 px-4 py-2.5 rounded-xl bg-slate-850 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-pink-500"
                      />
                      <button
                        type="submit"
                        disabled={!newPackingItem.trim()}
                        className="px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-pink-600 hover:bg-pink-500 disabled:opacity-50 transition-all flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Agregar</span>
                      </button>
                    </form>

                    {(!currentTrip.packingList || currentTrip.packingList.length === 0) ? (
                      <div className="text-center py-8 bg-slate-850/50 rounded-xl border border-dashed border-slate-700/80 p-4 space-y-2">
                        <span className="text-2xl block">🧳</span>
                        <p className="text-slate-400 text-xs">No hay elementos en la lista de equipaje todavía.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {currentTrip.packingList.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleTogglePackingItem(item.id)}
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                              item.packed 
                                ? 'bg-slate-900/60 border-slate-800 text-slate-400' 
                                : 'bg-slate-850 border-slate-700/80 text-white hover:border-pink-500/40'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {item.packed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-500 flex-shrink-0" />
                              )}
                              <span className={`text-sm truncate ${item.packed ? 'line-through' : ''}`}>
                                {item.item}
                              </span>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePackingItem(item.id);
                              }}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-800 transition-colors ml-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. LOGISTICS & NOTES TAB */}
                {activeTab === 'logistica' && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                      <Hotel className="w-5 h-5 text-amber-400" />
                      <span>Logística de Vuelos, Hotel y Notas Generales</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Transport / Flights */}
                      <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-2">
                        <div className="flex items-center gap-2 text-pink-300 font-bold text-sm">
                          <Plane className="w-4 h-4 text-pink-400" />
                          <span>Vuelos & Transporte</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-900/60 p-3 rounded-lg border border-slate-800 min-h-[70px]">
                          {currentTrip.flightOrTransportNotes || 'Sin notas de vuelos o transporte registradas.'}
                        </p>
                      </div>

                      {/* Accommodation */}
                      <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-2">
                        <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                          <Hotel className="w-4 h-4 text-amber-400" />
                          <span>Hospedaje & Alojamiento</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-900/60 p-3 rounded-lg border border-slate-800 min-h-[70px]">
                          {currentTrip.accommodationNotes || 'Sin notas de hospedaje registradas.'}
                        </p>
                      </div>
                    </div>

                    {currentTrip.generalNotes && (
                      <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-2">
                        <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                          <Info className="w-4 h-4 text-slate-400" />
                          <span>Recomendaciones & Notas Generales</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                          {currentTrip.generalNotes}
                        </p>
                      </div>
                    )}

                    {onOpenNewTaskModal && (
                      <div className="pt-2 flex items-center justify-between p-4 rounded-xl bg-pink-950/20 border border-pink-500/20">
                        <div className="space-y-0.5">
                          <h5 className="text-sm font-bold text-white">¿Quieres crear una meta en tu Calendario LifeBlocks?</h5>
                          <p className="text-xs text-slate-400">Vincula los preparativos del viaje como tarea activa en el tablero principal.</p>
                        </div>
                        <button
                          onClick={() => {
                            onOpenNewTaskModal({
                              title: `Preparativos para ${currentTrip.title}`,
                              category: 'familia_relaciones',
                              dueDate: currentTrip.startDate,
                              priority: 'alta',
                              finalGoal: `Completar el ahorro de ${formatCurrency(currentTrip.estimatedBudget)} y viajar a ${currentTrip.destination}`,
                              description: `Viaje familiar a ${currentTrip.destination}. Salida programada para el ${currentTrip.startDate}.`,
                            });
                          }}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-pink-600 hover:bg-pink-500 transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Crear Meta en Calendario</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Create / Edit Trip */}
      {isTripModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{formEmoji}</span>
                <h3 className="text-lg font-bold text-white">
                  {editingTrip ? 'Editar Destino de Viaje' : 'Programar Nuevo Viaje Familiar'}
                </h3>
              </div>
              <button
                onClick={() => setIsTripModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Presets if creating */}
            {!editingTrip && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Destinos sugeridos para inspirarse:</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_DESTINATIONS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-pink-950/40 hover:border-pink-500/40 border border-slate-700 text-xs text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                    >
                      <span>{preset.emoji}</span>
                      <span>{preset.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveTrip} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Título del Viaje *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ej: Viaje Familiar a Cancún & Riviera Maya 🌴"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Emoji Representativo</label>
                  <div className="flex gap-2">
                    {['🌴', '🏖️', '✈️', '🐠', '🏰', '🎢', '☕'].map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setFormEmoji(em)}
                        className={`text-xl p-1.5 rounded-lg border transition-all ${
                          formEmoji === em ? 'bg-pink-500/20 border-pink-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Destino / Ciudad *</label>
                  <input
                    type="text"
                    required
                    value={formDestination}
                    onChange={(e) => setFormDestination(e.target.value)}
                    placeholder="Ej: Cancún, México"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">País / Región</label>
                  <input
                    type="text"
                    value={formCountryOrFlag}
                    onChange={(e) => setFormCountryOrFlag(e.target.value)}
                    placeholder="Ej: 🇲🇽 México"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Fecha de Salida *</label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Fecha de Regreso (Opcional)</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Número de Viajeros</label>
                  <input
                    type="number"
                    min="1"
                    value={formTravelers}
                    onChange={(e) => setFormTravelers(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Presupuesto Estimado Total ($ COP) *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formEstimatedBudget}
                    onChange={(e) => setFormEstimatedBudget(e.target.value)}
                    placeholder="Ej: 5000000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-pink-500 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Ahorro Inicial ($ COP)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formSavedAmount}
                    onChange={(e) => setFormSavedAmount(e.target.value)}
                    placeholder="Ej: 1000000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Estado del Viaje</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as TripStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-pink-500"
                >
                  <option value="planeando">Planeando destino y cotizando</option>
                  <option value="ahorrando">Ahorrando para la meta</option>
                  <option value="listo_para_viajar">¡Listo para viajar / Reservado!</option>
                  <option value="en_viaje">¡En viaje actualmente!</option>
                  <option value="completado">Completado</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Notas de Vuelos / Transporte</label>
                  <textarea
                    rows={2}
                    value={formFlightNotes}
                    onChange={(e) => setFormFlightNotes(e.target.value)}
                    placeholder="Ej: Vuelo directo con Avianca / Copa..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Notas de Hospedaje</label>
                  <textarea
                    rows={2}
                    value={formAccommodationNotes}
                    onChange={(e) => setFormAccommodationNotes(e.target.value)}
                    placeholder="Ej: Hotel Todo Incluido en Zona Hotelera..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTripModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-pink-600 hover:bg-pink-500 shadow-md shadow-pink-600/20"
                >
                  {editingTrip ? 'Guardar Cambios' : 'Crear Viaje'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Savings Contribution */}
      {isContributionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Registrar Aporte de Ahorro</h3>
              </div>
              <button
                onClick={() => setIsContributionModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContribution} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Monto Aportado ($ COP) *</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  autoFocus
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  placeholder="Ej: 500000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-base font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Quick Amount Pills */}
              <div className="flex flex-wrap gap-2">
                {[200000, 500000, 1000000, 1500000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setContributionAmount(amt.toString())}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-emerald-400 font-medium"
                  >
                    +{formatCurrency(amt)}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Fecha del Aporte</label>
                <input
                  type="date"
                  required
                  value={contributionDate}
                  onChange={(e) => setContributionDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Concepto / Origen del Ahorro</label>
                <input
                  type="text"
                  value={contributionSource}
                  onChange={(e) => setContributionSource(e.target.value)}
                  placeholder="Ej: Ahorro quincenal de agosto, Prima, Bono laboral..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsContributionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
                >
                  Sumar Aporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Place to Visit */}
      {isPlaceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-pink-400" />
                <h3 className="text-base font-bold text-white">Agregar Sitio para Visitar</h3>
              </div>
              <button
                onClick={() => setIsPlaceModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlace} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Nombre del Lugar / Atracción *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  placeholder="Ej: Parque Xcaret & Ríos Subterráneos"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Categoría</label>
                <select
                  value={placeCategory}
                  onChange={(e) => setPlaceCategory(e.target.value as TripPlaceCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-pink-500"
                >
                  {PLACE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Costo Estimado ($ COP) - Opcional</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={placeCost}
                  onChange={(e) => setPlaceCost(e.target.value)}
                  placeholder="Ej: 350000"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Recomendaciones o Tips</label>
                <textarea
                  rows={2}
                  value={placeNotes}
                  onChange={(e) => setPlaceNotes(e.target.value)}
                  placeholder="Ej: Comprar boletos con anticipación online para 15% de descuento..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPlaceModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-pink-600 hover:bg-pink-500 shadow-md shadow-pink-600/20"
                >
                  Guardar Sitio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
