import React, { useState } from 'react';
import { HealthProfile, WeightLogEntry, Gender, Task, IdeaItem, DailyCalorieLog } from '../types';
import { useTheme } from '../context/ThemeContext';
import { BodyFigureVisualizer } from './BodyFigureVisualizer';
import { DailyWeightTracker } from './DailyWeightTracker';
import { HealthProfileCard } from './HealthProfileCard';
import { DailyCalorieTracker } from './nutrition/DailyCalorieTracker';
import { QuarterlyHealthAnalytics } from './QuarterlyHealthAnalytics';
import { 
  Heart, 
  Activity, 
  Dumbbell, 
  Flame, 
  Sparkles, 
  Scale, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  Target, 
  Calendar,
  Layers,
  ArrowRight,
  Plus,
  Trash2,
  Utensils,
  LineChart
} from 'lucide-react';
import { calculateBMI, getBMICategory, calculateBMR, calculateTDEE } from '../utils/healthCalculators';

interface HealthHubViewProps {
  profile: HealthProfile;
  weightLogs: WeightLogEntry[];
  calorieLogs?: DailyCalorieLog[];
  tasks: Task[];
  ideas: IdeaItem[];
  onUpdateProfile: (updated: HealthProfile) => void;
  onAddWeightLog: (entry: Omit<WeightLogEntry, 'id' | 'createdAt'>) => void;
  onDeleteWeightLog: (logId: string) => void;
  onSaveDailyCalorieLog?: (log: DailyCalorieLog) => void;
  onDeleteDailyCalorieLog?: (logId: string) => void;
  onOpenNewTaskModal?: (prefilled?: Partial<Task>) => void;
  onResetHealthData?: () => void;
}

export const HealthHubView: React.FC<HealthHubViewProps> = ({
  profile,
  weightLogs,
  calorieLogs = [],
  tasks,
  ideas,
  onUpdateProfile,
  onAddWeightLog,
  onDeleteWeightLog,
  onSaveDailyCalorieLog,
  onDeleteDailyCalorieLog,
  onOpenNewTaskModal,
  onResetHealthData,
}) => {
  const { isDark } = useTheme();
  const [activeHealthTab, setActiveHealthTab] = useState<'tracker' | 'calorias' | 'biometria' | 'analisis'>('tracker');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const bmi = calculateBMI(profile.currentWeight, profile.height);
  const bmiInfo = getBMICategory(bmi);
  const bmr = calculateBMR(profile.gender, profile.currentWeight, profile.height, profile.age);
  const tdee = calculateTDEE(bmr, profile.activityLevel);

  const handleGenderChange = (newGender: Gender) => {
    onUpdateProfile({
      ...profile,
      gender: newGender,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUpdateTargetWeight = (newTarget: number) => {
    onUpdateProfile({
      ...profile,
      targetWeight: newTarget,
      updatedAt: new Date().toISOString(),
    });
  };

  // Health-related tasks / workouts
  const healthTasks = tasks.filter(t => t.category === 'salud_deporte');
  const completedWorkouts = healthTasks.filter(t => t.status === 'completado').length;

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      
      {/* Top Health Hero Banner */}
      <div className={`relative rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden border transition-all ${
        isDark
          ? 'bg-gradient-to-r from-[#0d1c38] via-[#09152b] to-[#0a1a2e] border-cyan-500/30'
          : 'bg-gradient-to-r from-sky-50 via-white to-indigo-50 border-sky-200 shadow-sky-950/5'
      }`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#00f2ff]/10 via-[#38ef7d]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm border ${
                isDark 
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' 
                  : 'bg-sky-100 border-sky-300 text-sky-800'
              }`}>
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                CENTRO DE SALUD & COMPOSICIÓN CORPORAL
              </span>
              <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {profile.gender === 'hombre' ? '♂️ Masculino' : '♀️ Femenino'} • {profile.age} años
              </span>
            </div>

            <h2 className={`text-2xl sm:text-3xl font-black tracking-tight uppercase font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Salud, Biometría & Tracker de Peso
            </h2>
            <p className={`text-sm leading-relaxed font-sans ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Monitorea tu evolución ponderal día a día, composición corporal con el modelo biométrico interactivo, 
              cálculo de IMC y tasa metabólica basal para optimizar tu bienestar y rendimiento.
            </p>
          </div>

          {/* Quick Metrics Badge Ribbon */}
          <div className="flex flex-wrap items-center gap-3">
            <div className={`px-4 py-3 rounded-2xl border shadow-md flex items-center space-x-3 ${
              isDark ? 'bg-[#121c33]/90 border-slate-700/80' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[#00f2ff]">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <div className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>PESO ACTUAL</div>
                <div className={`text-lg font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile.currentWeight} <span className="text-xs font-normal text-slate-400">kg</span></div>
              </div>
            </div>

            <div className={`px-4 py-3 rounded-2xl border shadow-md flex items-center space-x-3 ${
              isDark ? 'bg-[#121c33]/90 border-slate-700/80' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>TASA BASAL</div>
                <div className={`text-lg font-black font-mono ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>{bmr.toLocaleString()} <span className="text-xs font-normal text-slate-400">kcal</span></div>
              </div>
            </div>

            <div className={`px-4 py-3 rounded-2xl border shadow-md flex items-center space-x-3 ${
              isDark ? 'bg-[#121c33]/90 border-slate-700/80' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[#38ef7d]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ESTADO IMC</div>
                <div className="text-sm font-black font-mono" style={{ color: bmiInfo.color }}>{bmiInfo.label}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation inside Health Hub */}
        <div className={`relative z-10 mt-6 pt-4 border-t flex flex-wrap items-center justify-between gap-2 ${
          isDark ? 'border-slate-800/80' : 'border-slate-200'
        }`}>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveHealthTab('tracker')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeHealthTab === 'tracker'
                  ? 'bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] text-[#00363a] shadow-lg shadow-cyan-500/25'
                  : isDark 
                    ? 'text-slate-300 hover:text-white bg-[#121c33]/70 hover:bg-[#182645]' 
                    : 'text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 shadow-sm'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Tracker de Peso & Gráfica</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveHealthTab('calorias')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeHealthTab === 'calorias'
                  ? 'bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] text-[#00363a] shadow-lg shadow-cyan-500/25'
                  : isDark 
                    ? 'text-slate-300 hover:text-white bg-[#121c33]/70 hover:bg-[#182645]' 
                    : 'text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 shadow-sm'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>🥗 Contador de Calorías & Déficit</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveHealthTab('biometria')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeHealthTab === 'biometria'
                  ? 'bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] text-[#00363a] shadow-lg shadow-cyan-500/25'
                  : isDark 
                    ? 'text-slate-300 hover:text-white bg-[#121c33]/70 hover:bg-[#182645]' 
                    : 'text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 shadow-sm'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Modelo Corporal & Biometría 3D</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveHealthTab('analisis')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeHealthTab === 'analisis'
                  ? 'bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] text-[#00363a] shadow-lg shadow-cyan-500/25'
                  : isDark 
                    ? 'text-slate-300 hover:text-white bg-[#121c33]/70 hover:bg-[#182645]' 
                    : 'text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 shadow-sm'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>📈 Análisis Trimestral (Largo Plazo)</span>
            </button>
          </div>

          {onResetHealthData && (
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-[#121c33]/80 hover:bg-red-500/10 border border-slate-700/60 hover:border-red-500/40 text-slate-400 hover:text-red-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Borrar registros de peso y biometría para empezar de cero"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-red-400" />
              <span>Limpiar Salud (Fresh Start)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      {activeHealthTab === 'calorias' && (
        <DailyCalorieTracker
          profile={profile}
          calorieLogs={calorieLogs}
          onSaveDailyLog={(log) => {
            if (onSaveDailyCalorieLog) onSaveDailyCalorieLog(log);
          }}
          onDeleteDailyLog={onDeleteDailyCalorieLog}
          onUpdateProfileTargetWeight={handleUpdateTargetWeight}
        />
      )}

      {activeHealthTab === 'tracker' && (
        <div className="space-y-6">
          {/* Top 2 Columns: Body Visualizer Summary + Daily Weight Tracker Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Human Body Figure (4 cols) */}
            <div className="lg:col-span-5">
              <BodyFigureVisualizer
                profile={profile}
                gender={profile.gender}
                age={profile.age}
                height={profile.height}
                weight={profile.currentWeight}
                waist={profile.waistCircumference}
                targetWeight={profile.targetWeight}
                activityLevel={profile.activityLevel}
                onGenderChange={handleGenderChange}
                onUpdateProfile={onUpdateProfile}
              />
            </div>

            {/* Right Column: Interactive Daily Weight Chart (7 cols) */}
            <div className="lg:col-span-7">
              <DailyWeightTracker
                weightLogs={weightLogs}
                profile={profile}
                onAddWeightLog={onAddWeightLog}
                onDeleteWeightLog={onDeleteWeightLog}
                onUpdateTargetWeight={handleUpdateTargetWeight}
              />
            </div>
          </div>

          {/* Full Width Biometric Calculator and Metabolic Insights */}
          <HealthProfileCard
            profile={profile}
            onUpdateProfile={onUpdateProfile}
          />
        </div>
      )}

      {activeHealthTab === 'biometria' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6">
              <BodyFigureVisualizer
                profile={profile}
                gender={profile.gender}
                age={profile.age}
                height={profile.height}
                weight={profile.currentWeight}
                waist={profile.waistCircumference}
                targetWeight={profile.targetWeight}
                activityLevel={profile.activityLevel}
                onGenderChange={handleGenderChange}
                onUpdateProfile={onUpdateProfile}
              />
            </div>
            <div className="lg:col-span-6">
              <HealthProfileCard
                profile={profile}
                onUpdateProfile={onUpdateProfile}
              />
            </div>
          </div>

          <DailyWeightTracker
            weightLogs={weightLogs}
            profile={profile}
            onAddWeightLog={onAddWeightLog}
            onDeleteWeightLog={onDeleteWeightLog}
            onUpdateTargetWeight={handleUpdateTargetWeight}
          />
        </div>
      )}

      {/* 4. Quarterly Health Analytics Tab */}
      {activeHealthTab === 'analisis' && (
        <QuarterlyHealthAnalytics
          profile={profile}
          weightLogs={weightLogs}
          calorieLogs={calorieLogs}
        />
      )}

      {/* Fresh Start (Reset All Health Logs & Biometrics) Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0d162a] border border-red-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-red-400">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-mono font-black text-white text-base">¿Limpiar Datos de Salud?</h3>
                <p className="text-xs text-slate-400 font-sans">Fresh Start de Peso & Biometría</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Esta acción borrará todo el historial de pesajes diarios, registros de la gráfica y restablecerá la configuración antropométrica a los valores iniciales.
            </p>

            <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20 text-[11px] text-red-300 font-mono">
              ⚠️ Esta acción no se puede deshacer.
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsResetConfirmOpen(false);
                  if (onResetHealthData) {
                    onResetHealthData();
                  }
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-mono font-black rounded-xl shadow-lg shadow-red-500/30 cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Limpiar Salud</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
