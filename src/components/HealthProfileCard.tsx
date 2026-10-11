import React, { useState } from 'react';
import { HealthProfile, Gender, ActivityLevel } from '../types';
import { useTheme } from '../context/ThemeContext';
import { 
  calculateBMI, 
  getBMICategory, 
  calculateBMR, 
  calculateTDEE, 
  evaluateWaist,
  getIdealWeightRange,
  ACTIVITY_LEVEL_DETAILS
} from '../utils/healthCalculators';
import { 
  Calculator, 
  Save, 
  RotateCcw, 
  Sparkles, 
  Flame, 
  Activity, 
  Ruler, 
  Weight as WeightIcon, 
  User, 
  Check, 
  AlertCircle,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Apple
} from 'lucide-react';

interface HealthProfileCardProps {
  profile: HealthProfile;
  onUpdateProfile: (updated: HealthProfile) => void;
}

export const HealthProfileCard: React.FC<HealthProfileCardProps> = ({
  profile,
  onUpdateProfile,
}) => {
  const { isDark } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [age, setAge] = useState<number>(profile.age);
  const [height, setHeight] = useState<number>(profile.height);
  const [weight, setWeight] = useState<number>(profile.currentWeight);
  const [waist, setWaist] = useState<number | undefined>(profile.waistCircumference);
  const [targetWeight, setTargetWeight] = useState<number | undefined>(profile.targetWeight);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile.activityLevel);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state when profile prop changes from Holo-Bio or weight tracker
  React.useEffect(() => {
    setGender(profile.gender);
    setAge(profile.age);
    setHeight(profile.height);
    setWeight(profile.currentWeight);
    setWaist(profile.waistCircumference);
    setTargetWeight(profile.targetWeight);
    setActivityLevel(profile.activityLevel);
  }, [profile]);

  // Computed metrics
  const bmi = calculateBMI(weight, height);
  const bmiInfo = getBMICategory(bmi);
  const bmr = calculateBMR(gender, weight, height, age);
  const tdee = calculateTDEE(bmr, activityLevel);
  const waistEval = evaluateWaist(gender, waist, height);
  const idealRange = getIdealWeightRange(height);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: HealthProfile = {
      ...profile,
      gender,
      age: Number(age) || 25,
      height: Number(height) || 170,
      currentWeight: Number(weight) || 70,
      waistCircumference: waist ? Number(waist) : undefined,
      targetWeight: targetWeight ? Number(targetWeight) : undefined,
      activityLevel,
      updatedAt: new Date().toISOString(),
    };

    onUpdateProfile(updated);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className={`rounded-3xl border p-5 sm:p-7 shadow-xl space-y-6 ${
      isDark 
        ? 'bg-gradient-to-b from-[#0e1629] via-[#0b1324] to-[#080d1a] border-[#2d3a58]' 
        : 'bg-white border-slate-200 shadow-slate-200/50'
    }`}>
      
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4 ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className="flex items-center space-x-2.5">
          <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center shadow-inner ${
            isDark 
              ? 'bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border-cyan-500/40 text-[#00f2ff]' 
              : 'bg-cyan-50 border-cyan-200 text-cyan-600'
          }`}>
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-base sm:text-lg font-black uppercase font-mono tracking-wide ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Perfil Biométrico & Calculadora Basal
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Cálculo de IMC, Metabolismo Basal (TMB), Gasto Calórico (TDEE) y Perímetro de Cintura (PC)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className={`px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-colors cursor-pointer self-start sm:self-auto flex items-center gap-1.5 ${
            isDark 
              ? 'border-slate-700 bg-[#121c33] hover:bg-[#182645] text-cyan-300' 
              : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800'
          }`}
        >
          <span>{isEditing ? 'Cancelar edición' : '✏️ Ajustar Parámetros'}</span>
        </button>
      </div>

      {/* Editing Form */}
      {isEditing ? (
        <form onSubmit={handleSave} className={`p-4 rounded-2xl border space-y-4 animate-in fade-in duration-200 ${
          isDark ? 'bg-[#090f1d] border-cyan-500/40' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            
            {/* Gender */}
            <div>
              <label className={`block text-xs font-mono mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Género</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGender('hombre')}
                  className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                    gender === 'hombre'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-800 dark:text-cyan-200'
                      : isDark 
                        ? 'bg-[#121c33] border-slate-700 text-slate-400' 
                        : 'bg-white border-slate-300 text-slate-600'
                  }`}
                >
                  ♂️ Hombre
                </button>
                <button
                  type="button"
                  onClick={() => setGender('mujer')}
                  className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                    gender === 'mujer'
                      ? 'bg-pink-500/20 border-pink-400 text-pink-800 dark:text-pink-200'
                      : isDark 
                        ? 'bg-[#121c33] border-slate-700 text-slate-400' 
                        : 'bg-white border-slate-300 text-slate-600'
                  }`}
                >
                  ♀️ Mujer
                </button>
              </div>
            </div>

            {/* Age */}
            <div>
              <label className={`block text-xs font-mono mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Edad (Años)</label>
              <input
                type="number"
                min="10"
                max="115"
                required
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value, 10) || 0)}
                className={`w-full px-3 py-2 rounded-xl font-mono text-sm focus:outline-none border ${
                  isDark 
                    ? 'bg-[#121c33] border-slate-700 text-white focus:border-cyan-400' 
                    : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500 shadow-xs'
                }`}
              />
            </div>

            {/* Height */}
            <div>
              <label className={`block text-xs font-mono mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Estatura (cm)</label>
              <input
                type="number"
                min="90"
                max="240"
                required
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value, 10) || 0)}
                className={`w-full px-3 py-2 rounded-xl font-mono text-sm focus:outline-none border ${
                  isDark 
                    ? 'bg-[#121c33] border-slate-700 text-white focus:border-cyan-400' 
                    : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500 shadow-xs'
                }`}
              />
            </div>

            {/* Current Weight */}
            <div>
              <label className={`block text-xs font-mono mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Peso Actual (kg)</label>
              <input
                type="number"
                step="0.1"
                min="25"
                max="300"
                required
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 rounded-xl font-mono text-sm focus:outline-none border ${
                  isDark 
                    ? 'bg-[#121c33] border-slate-700 text-white focus:border-cyan-400' 
                    : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500 shadow-xs'
                }`}
              />
            </div>

            {/* Waist Circumference (PC) */}
            <div>
              <label className={`block text-xs font-mono mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Perímetro Cintura - PC (cm)
              </label>
              <input
                type="number"
                step="0.5"
                min="40"
                max="200"
                placeholder="Ej. 82.0"
                value={waist || ''}
                onChange={(e) => setWaist(e.target.value ? parseFloat(e.target.value) : undefined)}
                className={`w-full px-3 py-2 rounded-xl font-mono text-sm focus:outline-none border ${
                  isDark 
                    ? 'bg-[#121c33] border-slate-700 text-white focus:border-emerald-400' 
                    : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500 shadow-xs'
                }`}
              />
            </div>

            {/* Target Goal Weight */}
            <div>
              <label className={`block text-xs font-mono mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Peso Objetivo Meta (kg)
              </label>
              <input
                type="number"
                step="0.5"
                min="30"
                max="250"
                placeholder="Ej. 70.0"
                value={targetWeight || ''}
                onChange={(e) => setTargetWeight(e.target.value ? parseFloat(e.target.value) : undefined)}
                className={`w-full px-3 py-2 rounded-xl font-mono text-sm focus:outline-none border ${
                  isDark 
                    ? 'bg-[#121c33] border-slate-700 text-white focus:border-emerald-400' 
                    : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500 shadow-xs'
                }`}
              />
            </div>
          </div>

          {/* Activity Level Selector */}
          <div>
            <label className={`block text-xs font-mono mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Nivel de Actividad Física (Para cálculo calórico diario TDEE)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {(Object.keys(ACTIVITY_LEVEL_DETAILS) as ActivityLevel[]).map((level) => {
                const info = ACTIVITY_LEVEL_DETAILS[level];
                const isSelected = activityLevel === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setActivityLevel(level)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-900 dark:text-white shadow-xs font-bold'
                        : isDark 
                          ? 'bg-[#121c33] border-slate-700/80 text-slate-300 hover:bg-slate-800' 
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-xs'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono">{info.label}</div>
                    <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{info.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className={`px-4 py-2 rounded-xl text-xs font-mono cursor-pointer border ${
                isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] text-[#00363a] font-black text-xs font-mono shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Perfil</span>
            </button>
          </div>
        </form>
      ) : null}

      {/* Primary Calculated Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* BMI Card */}
        <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between ${
          isDark ? 'bg-[#090f1d] border-slate-800' : 'bg-slate-50 border-slate-200 shadow-xs'
        }`}>
          <div>
            <div className={`flex items-center justify-between text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-500" />
                Índice Masa Corporal
              </span>
              <span className="text-[10px] font-bold font-mono text-slate-400">FÓRMULA IMC</span>
            </div>

            <div className="flex items-baseline space-x-2.5 mt-2">
              <div className="text-3xl sm:text-4xl font-black font-mono" style={{ color: bmiInfo.color }}>
                {bmi > 0 ? bmi : '--'}
              </div>
              <span 
                className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border"
                style={{ 
                  backgroundColor: bmiInfo.badgeBg,
                  color: bmiInfo.color,
                  borderColor: `${bmiInfo.color}50`
                }}
              >
                {bmiInfo.label}
              </span>
            </div>

            <p className={`text-xs mt-2 font-sans leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {bmiInfo.description}
            </p>
          </div>

          <div className={`mt-4 pt-3 border-t text-[11px] font-mono flex items-center justify-between ${
            isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-500'
          }`}>
            <span>Rango Saludable:</span>
            <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>18.5 – 24.9</span>
          </div>
        </div>

        {/* BMR Basal Card */}
        <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between ${
          isDark ? 'bg-[#090f1d] border-slate-800' : 'bg-slate-50 border-slate-200 shadow-xs'
        }`}>
          <div>
            <div className={`flex items-center justify-between text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500" />
                Tasa Metabólica Basal
              </span>
              <span className={`text-[10px] font-bold font-mono ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>TMB / BMR</span>
            </div>

            <div className={`text-3xl sm:text-4xl font-black font-mono mt-2 ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
              {bmr.toLocaleString()} <span className={`text-xs sm:text-sm font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>kcal/día</span>
            </div>

            <p className={`text-xs mt-2 font-sans leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Calorías que tu cuerpo gasta en reposo absoluto para mantener funciones vitales (respiración, bombeo cardíaco y celular).
            </p>
          </div>

          <div className={`mt-4 pt-3 border-t text-[11px] font-mono flex items-center justify-between ${
            isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-500'
          }`}>
            <span>Gasto Total Activo:</span>
            <span className={`font-bold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>{tdee.toLocaleString()} kcal</span>
          </div>
        </div>

        {/* Waist PC Card */}
        <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between ${
          isDark ? 'bg-[#090f1d] border-slate-800' : 'bg-slate-50 border-slate-200 shadow-xs'
        }`}>
          <div>
            <div className={`flex items-center justify-between text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-500" />
                Perímetro de Cintura (PC)
              </span>
              <span className="text-[10px] font-bold font-mono" style={{ color: waistEval.color }}>
                {waist ? 'MEDIDO' : 'OPCIONAL'}
              </span>
            </div>

            <div className={`text-3xl sm:text-4xl font-black font-mono mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {profile.waistCircumference ? `${profile.waistCircumference}` : '--'} <span className={`text-xs sm:text-sm font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>cm</span>
            </div>

            <p className={`text-xs mt-2 font-sans leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {waistEval.recommendation}
            </p>
          </div>

          <div className={`mt-4 pt-3 border-t text-[11px] font-mono flex items-center justify-between ${
            isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-500'
          }`}>
            <span>Estado:</span>
            <span className="font-bold truncate max-w-[150px]" style={{ color: waistEval.color }}>
              {waistEval.status}
            </span>
          </div>
        </div>

      </div>

      {/* Nutritional Targets & Calories Breakdown Strip */}
      <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
        isDark ? 'bg-[#090f1d] border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <h4 className={`text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 ${
            isDark ? 'text-cyan-300' : 'text-cyan-800'
          }`}>
            <Apple className="w-3.5 h-3.5" />
            Objetivos Calóricos Sugeridos Según tu TDEE ({tdee.toLocaleString()} kcal)
          </h4>
          <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Basado en nivel {profile.activityLevel}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Fat loss */}
          <div className={`p-3 rounded-xl border ${
            isDark ? 'bg-[#121c33] border-cyan-500/30' : 'bg-white border-cyan-200 shadow-xs'
          }`}>
            <div className={`flex items-center space-x-1.5 text-xs font-mono font-bold ${
              isDark ? 'text-cyan-300' : 'text-cyan-700'
            }`}>
              <TrendingDown className="w-3.5 h-3.5 text-cyan-500" />
              <span>Déficit Saludable</span>
            </div>
            <div className={`text-xl font-black font-mono mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {Math.max(1200, tdee - 400).toLocaleString()} <span className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>kcal/día</span>
            </div>
            <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>-400 kcal para perder ~0.4 kg/semana</div>
          </div>

          {/* Maintenance */}
          <div className={`p-3 rounded-xl border ${
            isDark ? 'bg-[#121c33] border-emerald-500/30' : 'bg-white border-emerald-200 shadow-xs'
          }`}>
            <div className={`flex items-center space-x-1.5 text-xs font-mono font-bold ${
              isDark ? 'text-emerald-300' : 'text-emerald-700'
            }`}>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>Mantenimiento</span>
            </div>
            <div className={`text-xl font-black font-mono mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              {tdee.toLocaleString()} <span className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>kcal/día</span>
            </div>
            <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Equilibrio metabólico y energía óptima</div>
          </div>

          {/* Muscle gain */}
          <div className={`p-3 rounded-xl border ${
            isDark ? 'bg-[#121c33] border-purple-500/30' : 'bg-white border-purple-200 shadow-xs'
          }`}>
            <div className={`flex items-center space-x-1.5 text-xs font-mono font-bold ${
              isDark ? 'text-purple-300' : 'text-purple-700'
            }`}>
              <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
              <span>Superávit Magro</span>
            </div>
            <div className={`text-xl font-black font-mono mt-1 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
              {(tdee + 300).toLocaleString()} <span className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>kcal/día</span>
            </div>
            <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>+300 kcal para ganancia de masa muscular</div>
          </div>

        </div>
      </div>

    </div>
  );
};

