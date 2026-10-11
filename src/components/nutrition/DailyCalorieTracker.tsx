import React, { useState, useMemo } from 'react';
import { 
  HealthProfile, 
  DailyCalorieLog, 
  MealLog, 
  MealItem, 
  SleepQuality 
} from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { 
  calculateBMR, 
  calculateStepCalories, 
  calculateDailyEnergyBalance, 
  calculateWeightProjectionGoal,
  POPULAR_FOOD_PRESETS 
} from '../../utils/healthCalculators';
import { 
  Utensils, 
  Flame, 
  Footprints, 
  Dumbbell, 
  Moon, 
  Droplets, 
  TrendingDown, 
  TrendingUp, 
  Scale, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Sparkles, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Award,
  Zap,
  Coffee,
  Sun,
  Sunset,
  Apple
} from 'lucide-react';

interface DailyCalorieTrackerProps {
  profile: HealthProfile;
  calorieLogs: DailyCalorieLog[];
  onSaveDailyLog: (log: DailyCalorieLog) => void;
  onDeleteDailyLog?: (logId: string) => void;
  onUpdateProfileTargetWeight?: (target: number) => void;
}

export const DailyCalorieTracker: React.FC<DailyCalorieTrackerProps> = ({
  profile,
  calorieLogs,
  onSaveDailyLog,
  onDeleteDailyLog,
  onUpdateProfileTargetWeight,
}) => {
  const { isDark } = useTheme();

  // Selected date state (defaults to today 'YYYY-MM-DD')
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Calculate Base Metabolic Rate for the user profile
  const bmr = useMemo(() => {
    return calculateBMR(profile.gender, profile.currentWeight, profile.height, profile.age);
  }, [profile.gender, profile.currentWeight, profile.height, profile.age]);

  // Find or create empty log template for the selected date
  const activeLog = useMemo<DailyCalorieLog>(() => {
    const existing = calorieLogs.find((l) => l.date === selectedDate);
    if (existing) return existing;

    const defaultSteps = 8000;
    const defaultStepsBurn = calculateStepCalories(defaultSteps, profile.currentWeight);
    const defaultExerciseBurn = 300;
    const totalExp = bmr + defaultStepsBurn + defaultExerciseBurn;

    return {
      id: `calorie-log-${selectedDate}`,
      date: selectedDate,
      breakfast: { items: [], totalCalories: 0 },
      lunch: { items: [], totalCalories: 0 },
      dinner: { items: [], totalCalories: 0 },
      snacks: { items: [], totalCalories: 0 },
      totalCaloriesConsumed: 0,
      steps: defaultSteps,
      stepsCaloriesBurned: defaultStepsBurn,
      exerciseCaloriesBurned: defaultExerciseBurn,
      exerciseNotes: 'Entrenamiento general',
      sleepHours: 7.5,
      sleepQuality: 'bueno',
      waterGlasses: 8,
      bmrSnapshot: bmr,
      totalEnergyExpenditure: totalExp,
      netCalorieBalance: -totalExp,
      balanceStatus: 'deficit',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [calorieLogs, selectedDate, bmr, profile.currentWeight]);

  // Modal / Form state for adding custom food item
  const [activeMealSection, setActiveMealSection] = useState<'breakfast' | 'lunch' | 'dinner' | 'snacks' | null>(null);
  const [foodName, setFoodName] = useState('');
  const [foodCalories, setFoodCalories] = useState<number>(300);
  const [foodPortion, setFoodPortion] = useState('');
  const [foodProtein, setFoodProtein] = useState<number | undefined>(undefined);

  // Quick preset tab filter
  const [presetCategoryFilter, setPresetCategoryFilter] = useState<'all' | 'desayuno' | 'almuerzo' | 'cena' | 'snack'>('all');

  // Energy Balance calculations for the active log
  const energyBalance = useMemo(() => {
    const consumed = activeLog.totalCaloriesConsumed;
    const stepsBurn = activeLog.stepsCaloriesBurned || calculateStepCalories(activeLog.steps, profile.currentWeight);
    const exerciseBurn = activeLog.exerciseCaloriesBurned || 0;
    return calculateDailyEnergyBalance(consumed, bmr, stepsBurn, exerciseBurn);
  }, [activeLog, bmr, profile.currentWeight]);

  // Weight Projection calculations
  const weightProjection = useMemo(() => {
    const target = profile.targetWeight || 70;
    return calculateWeightProjectionGoal(profile.currentWeight, target, energyBalance.netBalance);
  }, [profile.currentWeight, profile.targetWeight, energyBalance.netBalance]);

  // Helper to change selected date by +/- offset days
  const handleOffsetDate = (offset: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Generic updater for activeLog
  const updateLog = (partial: Partial<DailyCalorieLog>) => {
    const updated: DailyCalorieLog = {
      ...activeLog,
      ...partial,
      updatedAt: new Date().toISOString(),
    };

    // Recalculate totals
    const bTotal = updated.breakfast.items.reduce((s, i) => s + i.calories, 0);
    const lTotal = updated.lunch.items.reduce((s, i) => s + i.calories, 0);
    const dTotal = updated.dinner.items.reduce((s, i) => s + i.calories, 0);
    const sTotal = updated.snacks.items.reduce((s, i) => s + i.calories, 0);
    
    updated.breakfast.totalCalories = bTotal;
    updated.lunch.totalCalories = lTotal;
    updated.dinner.totalCalories = dTotal;
    updated.snacks.totalCalories = sTotal;
    updated.totalCaloriesConsumed = bTotal + lTotal + dTotal + sTotal;

    const sBurn = calculateStepCalories(updated.steps, profile.currentWeight);
    updated.stepsCaloriesBurned = sBurn;

    const totalExp = bmr + sBurn + (updated.exerciseCaloriesBurned || 0);
    updated.totalEnergyExpenditure = totalExp;
    updated.netCalorieBalance = updated.totalCaloriesConsumed - totalExp;
    updated.balanceStatus = updated.netCalorieBalance < -100 ? 'deficit' : updated.netCalorieBalance > 100 ? 'superavit' : 'mantenimiento';

    onSaveDailyLog(updated);
  };

  // Add Item to a specific Meal
  const handleAddMealItem = (mealKey: 'breakfast' | 'lunch' | 'dinner' | 'snacks', itemData: Omit<MealItem, 'id'>) => {
    const newItem: MealItem = {
      ...itemData,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    };

    const currentMeal = activeLog[mealKey] || { items: [], totalCalories: 0 };
    const updatedItems = [...currentMeal.items, newItem];
    const newTotal = updatedItems.reduce((sum, i) => sum + i.calories, 0);

    updateLog({
      [mealKey]: {
        ...currentMeal,
        items: updatedItems,
        totalCalories: newTotal,
      },
    });

    // Reset modal input
    setFoodName('');
    setFoodCalories(300);
    setFoodPortion('');
    setFoodProtein(undefined);
    setActiveMealSection(null);
  };

  // Remove Item from a specific Meal
  const handleRemoveMealItem = (mealKey: 'breakfast' | 'lunch' | 'dinner' | 'snacks', itemId: string) => {
    const currentMeal = activeLog[mealKey];
    const updatedItems = currentMeal.items.filter((i) => i.id !== itemId);
    const newTotal = updatedItems.reduce((sum, i) => sum + i.calories, 0);

    updateLog({
      [mealKey]: {
        ...currentMeal,
        items: updatedItems,
        totalCalories: newTotal,
      },
    });
  };

  // Format date display (e.g. "Domingo, 30 de Agosto de 2026")
  const dateFormatted = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const obj = new Date(y, m - 1, d);
    return obj.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [selectedDate]);

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // Filtered preset food list
  const filteredPresets = useMemo(() => {
    if (presetCategoryFilter === 'all') return POPULAR_FOOD_PRESETS;
    return POPULAR_FOOD_PRESETS.filter((p) => p.category === presetCategoryFilter);
  }, [presetCategoryFilter]);

  // Recent 7 days history for mini trend
  const recentLogs = useMemo(() => {
    return [...calorieLogs]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);
  }, [calorieLogs]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. DATE NAVIGATOR & EXECUTIVE HEADER */}
      <div className={`p-5 sm:p-6 rounded-3xl border shadow-xl backdrop-blur-md transition-all ${
        isDark 
          ? 'bg-gradient-to-br from-[#0c1830] via-[#091326] to-[#0d1c38] border-cyan-500/30' 
          : 'bg-gradient-to-br from-white via-sky-50/40 to-indigo-50/30 border-sky-200 shadow-sky-950/5'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Left Title & Status */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border shadow-sm ${
                isDark 
                  ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300' 
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              }`}>
                <Utensils className="w-3.5 h-3.5" />
                NUTRICIÓN & DEFICIT ENERGÉTICO
              </span>
              {isToday && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  HOY
                </span>
              )}
            </div>
            <h2 className={`text-xl sm:text-2xl font-black font-mono capitalize ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {dateFormatted}
            </h2>
            <p className={`text-xs font-sans ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Registra tus 4 tiempos de comida, pasos y entrenamiento para calcular tu déficit diario y proyección de peso.
            </p>
          </div>

          {/* Date Selector Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOffsetDate(-1)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-[#121f3d] border-slate-700 text-slate-300 hover:text-white hover:bg-cyan-500/20' 
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm'
              }`}
              title="Día anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
              isDark ? 'bg-[#101b36] border-slate-700' : 'bg-white border-slate-300 shadow-sm'
            }`}>
              <CalendarIcon className="w-4 h-4 text-cyan-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`bg-transparent font-mono text-xs sm:text-sm font-bold outline-none cursor-pointer ${
                  isDark ? 'text-white [color-scheme:dark]' : 'text-slate-900'
                }`}
              />
            </div>

            <button
              type="button"
              onClick={() => handleOffsetDate(1)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-[#121f3d] border-slate-700 text-slate-300 hover:text-white hover:bg-cyan-500/20' 
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm'
              }`}
              title="Día siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isToday && (
              <button
                type="button"
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold transition-all shadow-md cursor-pointer"
              >
                Ir a Hoy
              </button>
            )}
          </div>
        </div>

        {/* 2. EXECUTIVE METABOLIC SCORECARD (Consumido vs Gasto vs Balance Neto) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-700/50">
          
          {/* Card 1: Calorías Ingeridas */}
          <div className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
            isDark ? 'bg-[#111f3d]/80 border-slate-700/70' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <div className={`text-[10px] font-mono tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    CALORÍAS INGERIDAS
                  </div>
                  <div className={`text-2xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {activeLog.totalCaloriesConsumed.toLocaleString()} <span className="text-xs font-normal text-slate-400">kcal</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-breakdown chips */}
            <div className="grid grid-cols-4 gap-1 mt-3 pt-2 border-t border-slate-700/40 text-[10px] font-mono">
              <div className="text-center">
                <span className="text-slate-400 block">Des.</span>
                <span className="font-bold text-amber-400">{activeLog.breakfast.totalCalories}</span>
              </div>
              <div className="text-center">
                <span className="text-slate-400 block">Alm.</span>
                <span className="font-bold text-orange-400">{activeLog.lunch.totalCalories}</span>
              </div>
              <div className="text-center">
                <span className="text-slate-400 block">Cena</span>
                <span className="font-bold text-indigo-400">{activeLog.dinner.totalCalories}</span>
              </div>
              <div className="text-center">
                <span className="text-slate-400 block">Snacks</span>
                <span className="font-bold text-rose-400">{activeLog.snacks.totalCalories}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Gasto Metabólico Total */}
          <div className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
            isDark ? 'bg-[#111f3d]/80 border-slate-700/70' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <div className={`text-[10px] font-mono tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    GASTO ENERGÉTICO TOTAL
                  </div>
                  <div className={`text-2xl font-black font-mono ${isDark ? 'text-cyan-300' : 'text-cyan-600'}`}>
                    {energyBalance.totalExpenditure.toLocaleString()} <span className="text-xs font-normal text-slate-400">kcal</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-breakdown chips */}
            <div className="grid grid-cols-3 gap-1 mt-3 pt-2 border-t border-slate-700/40 text-[10px] font-mono">
              <div className="text-center">
                <span className="text-slate-400 block">TMB Basal</span>
                <span className="font-bold text-cyan-400">{bmr}</span>
              </div>
              <div className="text-center">
                <span className="text-slate-400 block">Pasos ({activeLog.steps.toLocaleString()})</span>
                <span className="font-bold text-emerald-400">+{activeLog.stepsCaloriesBurned || 0}</span>
              </div>
              <div className="text-center">
                <span className="text-slate-400 block">Ejercicio</span>
                <span className="font-bold text-amber-400">+{activeLog.exerciseCaloriesBurned || 0}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Balance Neto Diario & Semáforo */}
          <div className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
            energyBalance.status === 'deficit'
              ? isDark ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-emerald-50 border-emerald-300'
              : energyBalance.status === 'superavit'
              ? isDark ? 'bg-amber-950/40 border-amber-500/40' : 'bg-amber-50 border-amber-300'
              : isDark ? 'bg-sky-950/40 border-sky-500/40' : 'bg-sky-50 border-sky-300'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                  energyBalance.status === 'deficit'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : energyBalance.status === 'superavit'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                    : 'bg-sky-500/20 border-sky-500 text-sky-400'
                }`}>
                  {energyBalance.status === 'deficit' ? (
                    <TrendingDown className="w-4 h-4 animate-bounce" />
                  ) : energyBalance.status === 'superavit' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <Scale className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className={`text-[10px] font-mono tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    BALANCE NETO DIARIO
                  </div>
                  <div className={`text-2xl font-black font-mono ${
                    energyBalance.status === 'deficit'
                      ? 'text-emerald-400'
                      : energyBalance.status === 'superavit'
                      ? 'text-amber-400'
                      : 'text-sky-400'
                  }`}>
                    {energyBalance.netBalance > 0 ? `+${energyBalance.netBalance}` : energyBalance.netBalance} <span className="text-xs font-normal text-slate-400">kcal</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-700/40 flex items-center justify-between text-xs font-mono">
              <span className={`font-bold ${
                energyBalance.status === 'deficit' ? 'text-emerald-400' : energyBalance.status === 'superavit' ? 'text-amber-400' : 'text-sky-400'
              }`}>
                {energyBalance.status === 'deficit' ? '🔥 BAJANDO DE PESO' : energyBalance.status === 'superavit' ? '📈 SUBIENDO DE PESO' : '⚖️ MANTENIMIENTO'}
              </span>
              <span className="text-[11px] text-slate-400">
                {energyBalance.weeklyWeightChangeKg > 0 ? `+${energyBalance.weeklyWeightChangeKg}` : energyBalance.weeklyWeightChangeKg} kg/sem
              </span>
            </div>
          </div>

        </div>

        {/* 3. SMART PROJECTION BANNER */}
        <div className={`mt-5 p-4 sm:p-5 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
          isDark 
            ? 'bg-gradient-to-r from-[#0d2238] via-[#0b1c2e] to-[#10243b] border-cyan-500/40' 
            : 'bg-gradient-to-r from-sky-50 via-indigo-50/50 to-white border-sky-200'
        }`}>
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                Proyección Inteligente de Composición Corporal
              </span>
            </div>
            <p className={`text-sm font-sans leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              {weightProjection.message}
            </p>
          </div>

          {/* Goal & Milestone Pill */}
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2.5 rounded-xl border text-center ${
              isDark ? 'bg-[#0f1b34] border-slate-700' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>PESO OBJETIVO</div>
              <div className={`text-base font-black font-mono ${isDark ? 'text-cyan-300' : 'text-cyan-600'}`}>
                {profile.targetWeight || 70} kg
              </div>
            </div>

            <div className={`px-4 py-2.5 rounded-xl border text-center ${
              isDark ? 'bg-[#0f1b34] border-slate-700' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>TIEMPO ESTIMADO</div>
              <div className={`text-base font-black font-mono ${
                weightProjection.isFeasible ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {weightProjection.isFeasible ? `${weightProjection.estimatedWeeks} sem` : 'Ajustar'}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 4. MEAL LOGGING: 4 MEAL CARDS (Desayuno, Almuerzo, Cena, Snacks) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* DESAYUNO */}
        <div className={`p-5 rounded-3xl border shadow-lg transition-all ${
          isDark ? 'bg-[#0f1b34]/90 border-slate-700/80' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-base font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  🍳 Desayuno
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {activeLog.breakfast.items.length} alimentos registrados
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-lg font-black font-mono ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
                {activeLog.breakfast.totalCalories} <span className="text-xs font-normal text-slate-400">kcal</span>
              </span>
            </div>
          </div>

          {/* Food List */}
          <div className="mt-4 space-y-2 min-h-[100px]">
            {activeLog.breakfast.items.length === 0 ? (
              <div className={`py-6 text-center text-xs font-mono border border-dashed rounded-2xl ${
                isDark ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-400'
              }`}>
                Sin alimentos añadidos en el desayuno
              </div>
            ) : (
              activeLog.breakfast.items.map((item) => (
                <div 
                  key={item.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono group transition-all ${
                    isDark ? 'bg-[#132242] border-slate-700/60' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex-1 pr-2">
                    <span className={`font-bold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {item.name}
                    </span>
                    {item.portion && (
                      <span className="text-[10px] text-slate-400">{item.portion}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                      {item.calories} kcal
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMealItem('breakfast', item.id)}
                      className="text-slate-500 hover:text-red-400 p-1 opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Add Button */}
          <button
            type="button"
            onClick={() => {
              setActiveMealSection('breakfast');
              setPresetCategoryFilter('desayuno');
            }}
            className="w-full mt-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:text-amber-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar al Desayuno</span>
          </button>
        </div>

        {/* ALMUERZO */}
        <div className={`p-5 rounded-3xl border shadow-lg transition-all ${
          isDark ? 'bg-[#0f1b34]/90 border-slate-700/80' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-base font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  🍲 Almuerzo
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {activeLog.lunch.items.length} alimentos registrados
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-lg font-black font-mono ${isDark ? 'text-orange-300' : 'text-orange-600'}`}>
                {activeLog.lunch.totalCalories} <span className="text-xs font-normal text-slate-400">kcal</span>
              </span>
            </div>
          </div>

          {/* Food List */}
          <div className="mt-4 space-y-2 min-h-[100px]">
            {activeLog.lunch.items.length === 0 ? (
              <div className={`py-6 text-center text-xs font-mono border border-dashed rounded-2xl ${
                isDark ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-400'
              }`}>
                Sin alimentos añadidos en el almuerzo
              </div>
            ) : (
              activeLog.lunch.items.map((item) => (
                <div 
                  key={item.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono group transition-all ${
                    isDark ? 'bg-[#132242] border-slate-700/60' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex-1 pr-2">
                    <span className={`font-bold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {item.name}
                    </span>
                    {item.portion && (
                      <span className="text-[10px] text-slate-400">{item.portion}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-400 font-bold border border-orange-500/20">
                      {item.calories} kcal
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMealItem('lunch', item.id)}
                      className="text-slate-500 hover:text-red-400 p-1 opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Add Button */}
          <button
            type="button"
            onClick={() => {
              setActiveMealSection('lunch');
              setPresetCategoryFilter('almuerzo');
            }}
            className="w-full mt-4 py-2.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 hover:text-orange-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar al Almuerzo</span>
          </button>
        </div>

        {/* CENA */}
        <div className={`p-5 rounded-3xl border shadow-lg transition-all ${
          isDark ? 'bg-[#0f1b34]/90 border-slate-700/80' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Sunset className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-base font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  🥗 Cena
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {activeLog.dinner.items.length} alimentos registrados
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-lg font-black font-mono ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
                {activeLog.dinner.totalCalories} <span className="text-xs font-normal text-slate-400">kcal</span>
              </span>
            </div>
          </div>

          {/* Food List */}
          <div className="mt-4 space-y-2 min-h-[100px]">
            {activeLog.dinner.items.length === 0 ? (
              <div className={`py-6 text-center text-xs font-mono border border-dashed rounded-2xl ${
                isDark ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-400'
              }`}>
                Sin alimentos añadidos en la cena
              </div>
            ) : (
              activeLog.dinner.items.map((item) => (
                <div 
                  key={item.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono group transition-all ${
                    isDark ? 'bg-[#132242] border-slate-700/60' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex-1 pr-2">
                    <span className={`font-bold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {item.name}
                    </span>
                    {item.portion && (
                      <span className="text-[10px] text-slate-400">{item.portion}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20">
                      {item.calories} kcal
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMealItem('dinner', item.id)}
                      className="text-slate-500 hover:text-red-400 p-1 opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Add Button */}
          <button
            type="button"
            onClick={() => {
              setActiveMealSection('dinner');
              setPresetCategoryFilter('cena');
            }}
            className="w-full mt-4 py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 hover:text-indigo-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar a la Cena</span>
          </button>
        </div>

        {/* ADICIONAL / SNACKS & MERIENDAS */}
        <div className={`p-5 rounded-3xl border shadow-lg transition-all ${
          isDark ? 'bg-[#0f1b34]/90 border-slate-700/80' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Apple className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-base font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  🍎 Snacks & Adicionales
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {activeLog.snacks.items.length} meriendas registradas
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-lg font-black font-mono ${isDark ? 'text-rose-300' : 'text-rose-600'}`}>
                {activeLog.snacks.totalCalories} <span className="text-xs font-normal text-slate-400">kcal</span>
              </span>
            </div>
          </div>

          {/* Food List */}
          <div className="mt-4 space-y-2 min-h-[100px]">
            {activeLog.snacks.items.length === 0 ? (
              <div className={`py-6 text-center text-xs font-mono border border-dashed rounded-2xl ${
                isDark ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-400'
              }`}>
                Sin snacks o meriendas adicionales hoy
              </div>
            ) : (
              activeLog.snacks.items.map((item) => (
                <div 
                  key={item.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono group transition-all ${
                    isDark ? 'bg-[#132242] border-slate-700/60' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex-1 pr-2">
                    <span className={`font-bold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {item.name}
                    </span>
                    {item.portion && (
                      <span className="text-[10px] text-slate-400">{item.portion}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20">
                      {item.calories} kcal
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMealItem('snacks', item.id)}
                      className="text-slate-500 hover:text-red-400 p-1 opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Add Button */}
          <button
            type="button"
            onClick={() => {
              setActiveMealSection('snacks');
              setPresetCategoryFilter('snack');
            }}
            className="w-full mt-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Snack / Adicional</span>
          </button>
        </div>

      </div>

      {/* 5. PHYSICAL ACTIVITY, STEPS, EXERCISE & SLEEP TRACKER */}
      <div className={`p-6 rounded-3xl border shadow-xl transition-all ${
        isDark ? 'bg-[#0f1b34]/90 border-slate-700/80' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-700/40">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Footprints className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-base font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              👟 Actividad Física, Pasos & Descanso
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Calcula el gasto activo real del día para sumarlo a tu Tasa Metabólica Basal.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5">
          
          {/* PASOS DIARIOS */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isDark ? 'bg-[#132242] border-slate-700/70' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold flex items-center gap-1.5 text-cyan-400">
                <Footprints className="w-4 h-4" />
                <span>NÚMERO DE PASOS</span>
              </label>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                ~{calculateStepCalories(activeLog.steps, profile.currentWeight)} kcal quemadas
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="50000"
                step="500"
                value={activeLog.steps || 0}
                onChange={(e) => updateLog({ steps: Math.max(0, parseInt(e.target.value) || 0) })}
                className={`w-full px-3 py-2 rounded-xl border font-mono font-bold text-sm outline-none ${
                  isDark ? 'bg-[#0b162c] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
                placeholder="Ej: 8500"
              />
            </div>

            {/* Quick increment step buttons */}
            <div className="flex items-center gap-1.5">
              {[5000, 8000, 10000, 12000].map((stepVal) => (
                <button
                  key={stepVal}
                  type="button"
                  onClick={() => updateLog({ steps: stepVal })}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-mono border transition-all cursor-pointer ${
                    activeLog.steps === stepVal
                      ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                      : isDark ? 'bg-[#0d1c38] border-slate-700 text-slate-300 hover:text-white' : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  {(stepVal / 1000)}k
                </button>
              ))}
            </div>
          </div>

          {/* EJERCICIO & ENTRENAMIENTO */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isDark ? 'bg-[#132242] border-slate-700/70' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold flex items-center gap-1.5 text-amber-400">
                <Dumbbell className="w-4 h-4" />
                <span>EJERCICIO / GASTO ACTIVO</span>
              </label>
              <span className="text-xs font-mono text-amber-400 font-bold">
                {activeLog.exerciseCaloriesBurned || 0} kcal
              </span>
            </div>

            <div className="space-y-2">
              <input
                type="number"
                min="0"
                max="3000"
                step="50"
                value={activeLog.exerciseCaloriesBurned || 0}
                onChange={(e) => updateLog({ exerciseCaloriesBurned: Math.max(0, parseInt(e.target.value) || 0) })}
                className={`w-full px-3 py-2 rounded-xl border font-mono font-bold text-sm outline-none ${
                  isDark ? 'bg-[#0b162c] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
                placeholder="Calorías quemadas en ejercicio (kcal)"
              />
              <input
                type="text"
                value={activeLog.exerciseNotes || ''}
                onChange={(e) => updateLog({ exerciseNotes: e.target.value })}
                className={`w-full px-3 py-1.5 rounded-xl border font-mono text-xs outline-none ${
                  isDark ? 'bg-[#0b162c] border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'
                }`}
                placeholder="Ej: 45 min pesas + 15 min elíptica"
              />
            </div>

            {/* Quick exercise preset buttons */}
            <div className="flex items-center gap-1.5">
              {[
                { label: 'Gym (350k)', val: 350, note: '45 min pesas' },
                { label: 'Run 5K (420k)', val: 420, note: '5K Running' },
                { label: 'Bici (500k)', val: 500, note: '1h Ciclismo' },
              ].map((ex) => (
                <button
                  key={ex.val}
                  type="button"
                  onClick={() => updateLog({ exerciseCaloriesBurned: ex.val, exerciseNotes: ex.note })}
                  className="flex-1 py-1 rounded-lg text-[10px] font-mono border bg-[#0d1c38] border-slate-700 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-all cursor-pointer whitespace-nowrap"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          {/* SUEÑO & HIDRATACIÓN */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isDark ? 'bg-[#132242] border-slate-700/70' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold flex items-center gap-1.5 text-indigo-400">
                <Moon className="w-4 h-4" />
                <span>SUEÑO & RECUPERACIÓN</span>
              </label>
              <span className="text-xs font-mono text-indigo-400 font-bold">
                {activeLog.sleepHours || 0} horas
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={activeLog.sleepHours || 0}
                onChange={(e) => updateLog({ sleepHours: Math.max(0, parseFloat(e.target.value) || 0) })}
                className={`w-1/2 px-3 py-2 rounded-xl border font-mono font-bold text-sm outline-none ${
                  isDark ? 'bg-[#0b162c] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
                placeholder="Horas"
              />

              <select
                value={activeLog.sleepQuality || 'bueno'}
                onChange={(e) => updateLog({ sleepQuality: e.target.value as SleepQuality })}
                className={`w-1/2 px-2.5 py-2 rounded-xl border font-mono text-xs outline-none cursor-pointer ${
                  isDark ? 'bg-[#0b162c] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="excelente">🌟 Excelente</option>
                <option value="bueno">👍 Bueno</option>
                <option value="regular">😐 Regular</option>
                <option value="malo">🥱 Malo</option>
              </select>
            </div>

            {/* Quick Water glasses tracker */}
            <div className="pt-2 border-t border-slate-700/40 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-cyan-400 text-xs font-mono">
                <Droplets className="w-3.5 h-3.5" />
                <span>Agua: {activeLog.waterGlasses || 8} vasos ({( (activeLog.waterGlasses || 8) * 0.25 ).toFixed(1)}L)</span>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => updateLog({ waterGlasses: Math.max(0, (activeLog.waterGlasses || 8) - 1) })}
                  className="w-6 h-6 rounded-lg bg-[#0b162c] border border-slate-700 text-slate-300 text-xs flex items-center justify-center hover:bg-cyan-500/20 cursor-pointer"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => updateLog({ waterGlasses: (activeLog.waterGlasses || 8) + 1 })}
                  className="w-6 h-6 rounded-lg bg-[#0b162c] border border-slate-700 text-slate-300 text-xs flex items-center justify-center hover:bg-cyan-500/20 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 6. HISTORIAL RECIENTE DE 7 DÍAS (TABLA COMPARATIVA) */}
      <div className={`p-6 rounded-3xl border shadow-xl transition-all ${
        isDark ? 'bg-[#0f1b34]/90 border-slate-700/80' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                📊 Historial y Consistencia de los Últimos Días
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Comparativa de ingesta, pasos, gasto total y déficit energético diario.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Consumido</th>
                <th className="py-2.5 px-3">Pasos</th>
                <th className="py-2.5 px-3">Ejercicio</th>
                <th className="py-2.5 px-3">Gasto Total</th>
                <th className="py-2.5 px-3">Balance Diario</th>
                <th className="py-2.5 px-3">Diagnóstico</th>
                <th className="py-2.5 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {recentLogs.map((log) => {
                const logBalance = calculateDailyEnergyBalance(
                  log.totalCaloriesConsumed,
                  bmr,
                  log.stepsCaloriesBurned || calculateStepCalories(log.steps, profile.currentWeight),
                  log.exerciseCaloriesBurned || 0
                );

                const isCurrent = log.date === selectedDate;

                return (
                  <tr 
                    key={log.id} 
                    className={`transition-colors cursor-pointer ${
                      isCurrent 
                        ? isDark ? 'bg-cyan-500/10 font-bold' : 'bg-sky-50 font-bold'
                        : isDark ? 'hover:bg-[#132242]' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => setSelectedDate(log.date)}
                  >
                    <td className="py-3 px-3 flex items-center space-x-2">
                      <span className={isDark ? 'text-white' : 'text-slate-900'}>{log.date}</span>
                      {log.date === new Date().toISOString().split('T')[0] && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-cyan-500/20 text-cyan-400">Hoy</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-400">
                      {log.totalCaloriesConsumed} kcal
                    </td>
                    <td className="py-3 px-3 text-cyan-400">
                      {log.steps.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-amber-400">
                      {log.exerciseCaloriesBurned || 0} kcal
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-300">
                      {logBalance.totalExpenditure} kcal
                    </td>
                    <td className="py-3 px-3 font-black">
                      <span className={
                        logBalance.status === 'deficit' ? 'text-emerald-400' : logBalance.status === 'superavit' ? 'text-amber-400' : 'text-sky-400'
                      }>
                        {logBalance.netBalance > 0 ? `+${logBalance.netBalance}` : logBalance.netBalance} kcal
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        logBalance.status === 'deficit'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : logBalance.status === 'superavit'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                      }`}>
                        {logBalance.status === 'deficit' ? '🔥 Déficit' : logBalance.status === 'superavit' ? '📈 Superávit' : '⚖️ Mantenimiento'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(log.date);
                        }}
                        className="px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-[11px] font-mono cursor-pointer"
                      >
                        Ver / Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. MODAL / DRAWER FOR QUICK-ADDING FOOD ITEMS */}
      {activeMealSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-2xl rounded-3xl border p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-[#0d1c38] border-cyan-500/40 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/40">
              <div className="flex items-center space-x-2">
                <Utensils className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-black font-mono uppercase">
                  Agregar Alimento a {
                    activeMealSection === 'breakfast' ? 'Desayuno' :
                    activeMealSection === 'lunch' ? 'Almuerzo' :
                    activeMealSection === 'dinner' ? 'Cena' : 'Snacks & Adicionales'
                  }
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveMealSection(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Custom Input Form */}
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? 'bg-[#122244] border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-xs font-mono font-bold text-cyan-400 uppercase">
                1. Entrada Rápida Personalizada
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6">
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Nombre del alimento / plato</label>
                  <input
                    type="text"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    placeholder="Ej: Pechuga a la plancha con arepa"
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-mono outline-none ${
                      isDark ? 'bg-[#0a1428] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Calorías (kcal)</label>
                  <input
                    type="number"
                    min="0"
                    max="5000"
                    step="10"
                    value={foodCalories}
                    onChange={(e) => setFoodCalories(Math.max(0, parseInt(e.target.value) || 0))}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold outline-none ${
                      isDark ? 'bg-[#0a1428] border-slate-700 text-emerald-400' : 'bg-white border-slate-300 text-emerald-600'
                    }`}
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Porción (opcional)</label>
                  <input
                    type="text"
                    value={foodPortion}
                    onChange={(e) => setFoodPortion(e.target.value)}
                    placeholder="Ej: 200g / 1 plato"
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-mono outline-none ${
                      isDark ? 'bg-[#0a1428] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Fast Increment Buttons */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] font-mono text-slate-400">Ajuste rápido:</span>
                {[50, 100, 250, 500].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFoodCalories(c)}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 cursor-pointer"
                  >
                    {c} kcal
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={!foodName.trim() || foodCalories <= 0}
                onClick={() => {
                  if (activeMealSection) {
                    handleAddMealItem(activeMealSection, {
                      name: foodName.trim(),
                      calories: foodCalories,
                      portion: foodPortion.trim() || undefined,
                      proteinGrams: foodProtein,
                    });
                  }
                }}
                className={`w-full py-2.5 rounded-xl font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                  !foodName.trim() || foodCalories <= 0
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] text-slate-950 font-black'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Confirmar y Guardar Alimento ({foodCalories} kcal)</span>
              </button>
            </div>

            {/* Popular Presets Picker */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>2. O Selecciona de la Biblioteca de Platos Saludables</span>
                </div>
                
                {/* Category tabs */}
                <div className="flex items-center gap-1">
                  {(['all', 'desayuno', 'almuerzo', 'cena', 'snack'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setPresetCategoryFilter(tab)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono capitalize transition-all cursor-pointer ${
                        presetCategoryFilter === tab
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white bg-slate-800/50'
                      }`}
                    >
                      {tab === 'all' ? 'Todos' : tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {filteredPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (activeMealSection) {
                        handleAddMealItem(activeMealSection, {
                          name: preset.name,
                          calories: preset.calories,
                          portion: preset.portion,
                          proteinGrams: preset.proteinGrams,
                          carbsGrams: preset.carbsGrams,
                          fatsGrams: preset.fatsGrams,
                        });
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs font-mono transition-all cursor-pointer ${
                      isDark 
                        ? 'bg-[#101e3d] border-slate-700/70 hover:border-cyan-400 hover:bg-[#15274d]' 
                        : 'bg-white border-slate-200 hover:border-sky-400 hover:bg-sky-50 shadow-sm'
                    }`}
                  >
                    <div className="flex-1 pr-2">
                      <span className={`font-bold block line-clamp-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {preset.name}
                      </span>
                      <span className="text-[10px] text-slate-400">{preset.portion} • {preset.proteinGrams}g prot</span>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-[11px] border border-emerald-500/20 whitespace-nowrap">
                      +{preset.calories} kcal
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
