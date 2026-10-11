import React, { useState, useEffect } from 'react';
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
  Activity, 
  Heart, 
  Flame, 
  Ruler, 
  Weight as WeightIcon, 
  User, 
  Sparkles, 
  ShieldCheck, 
  Info,
  Zap,
  Target,
  Edit3,
  Check,
  X,
  Plus,
  Minus,
  Save,
  RotateCcw
} from 'lucide-react';

interface BodyFigureVisualizerProps {
  profile?: HealthProfile;
  gender?: Gender;
  age?: number;
  height?: number;
  weight?: number;
  waist?: number;
  targetWeight?: number;
  activityLevel?: ActivityLevel;
  onGenderChange?: (newGender: Gender) => void;
  onUpdateProfile?: (updated: HealthProfile) => void;
}

export const BodyFigureVisualizer: React.FC<BodyFigureVisualizerProps> = ({
  profile,
  gender: propGender = 'hombre',
  age: propAge = 28,
  height: propHeight = 175,
  weight: propWeight = 74,
  waist: propWaist,
  targetWeight: propTargetWeight,
  activityLevel: propActivityLevel = 'moderado',
  onGenderChange,
  onUpdateProfile,
}) => {
  // Use profile values if provided, otherwise fallback to explicit props
  const currentGender = profile ? profile.gender : propGender;
  const currentAge = profile ? profile.age : propAge;
  const currentHeight = profile ? profile.height : propHeight;
  const currentWeight = profile ? profile.currentWeight : propWeight;
  const currentWaist = profile ? profile.waistCircumference : propWaist;
  const currentTargetWeight = profile ? profile.targetWeight : propTargetWeight;
  const currentActivityLevel = profile ? profile.activityLevel : propActivityLevel;

  const { isDark } = useTheme();
  const [activeZone, setActiveZone] = useState<'all' | 'head' | 'chest' | 'waist' | 'legs'>('all');
  
  // Quick Biometric Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFieldFocus, setEditFieldFocus] = useState<'all' | 'age' | 'height' | 'weight' | 'waist'>('all');

  // Form State inside modal
  const [formGender, setFormGender] = useState<Gender>(currentGender);
  const [formAge, setFormAge] = useState<number>(currentAge);
  const [formHeight, setFormHeight] = useState<number>(currentHeight);
  const [formWeight, setFormWeight] = useState<number>(currentWeight);
  const [formWaist, setFormWaist] = useState<number | undefined>(currentWaist);
  const [formTargetWeight, setFormTargetWeight] = useState<number | undefined>(currentTargetWeight);
  const [formActivityLevel, setFormActivityLevel] = useState<ActivityLevel>(currentActivityLevel);
  const [saveToast, setSaveToast] = useState(false);

  // Sync state when props change or modal opens
  useEffect(() => {
    setFormGender(currentGender);
    setFormAge(currentAge);
    setFormHeight(currentHeight);
    setFormWeight(currentWeight);
    setFormWaist(currentWaist);
    setFormTargetWeight(currentTargetWeight);
    setFormActivityLevel(currentActivityLevel);
  }, [currentGender, currentAge, currentHeight, currentWeight, currentWaist, currentTargetWeight, currentActivityLevel, isEditModalOpen]);

  const bmi = calculateBMI(currentWeight, currentHeight);
  const bmiInfo = getBMICategory(bmi);
  const bmr = calculateBMR(currentGender, currentWeight, currentHeight, currentAge);
  const tdee = calculateTDEE(bmr, currentActivityLevel);
  const waistEval = evaluateWaist(currentGender, currentWaist, currentHeight);
  const idealRange = getIdealWeightRange(currentHeight);

  // Dynamic preview for modal
  const previewBmi = calculateBMI(formWeight, formHeight);
  const previewBmiInfo = getBMICategory(previewBmi);
  const previewBmr = calculateBMR(formGender, formWeight, formHeight, formAge);
  const previewTdee = calculateTDEE(previewBmr, formActivityLevel);
  const previewWaistEval = evaluateWaist(formGender, formWaist, formHeight);

  // Dynamic theme colors based on BMI
  const accentColor = bmiInfo.color;

  const handleGenderToggle = (newGender: Gender) => {
    if (onGenderChange) {
      onGenderChange(newGender);
    }
    if (onUpdateProfile && profile) {
      onUpdateProfile({
        ...profile,
        gender: newGender,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleOpenEdit = (focusField: 'all' | 'age' | 'height' | 'weight' | 'waist' = 'all') => {
    setEditFieldFocus(focusField);
    setIsEditModalOpen(true);
  };

  const handleSaveBiometrics = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile: HealthProfile = {
      id: profile?.id || 'default-health-profile',
      userId: profile?.userId,
      gender: formGender,
      age: Number(formAge) || 25,
      height: Number(formHeight) || 170,
      currentWeight: Number(formWeight) || 70,
      waistCircumference: formWaist ? Number(formWaist) : undefined,
      targetWeight: formTargetWeight ? Number(formTargetWeight) : undefined,
      activityLevel: formActivityLevel,
      updatedAt: new Date().toISOString(),
    };

    if (onUpdateProfile) {
      onUpdateProfile(updatedProfile);
    }
    if (onGenderChange && formGender !== currentGender) {
      onGenderChange(formGender);
    }

    setSaveToast(true);
    setIsEditModalOpen(false);
    setTimeout(() => setSaveToast(false), 3000);
  };

  return (
    <div id="holo-bio-card" className={`relative rounded-3xl border p-4 sm:p-5 md:p-6 shadow-xl overflow-hidden flex flex-col justify-between transition-all ${
      isDark 
        ? 'bg-gradient-to-b from-[#0e1629] via-[#0b1324] to-[#080d1a] border-[#2d3a58] text-white' 
        : 'bg-white border-slate-200 shadow-slate-200/60 text-slate-900'
    }`}>
      
      {/* Background Holographic Ambient Grid & Radial Glow */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 40%, ${accentColor} 0%, transparent 65%)`,
        }}
      />
      <div 
        className={`absolute inset-0 pointer-events-none ${isDark ? 'opacity-5' : 'opacity-10'}`}
        style={{
          backgroundImage: `linear-gradient(to right, ${isDark ? '#ffffff' : '#0284c7'} 1px, transparent 1px), linear-gradient(to bottom, ${isDark ? '#ffffff' : '#0284c7'} 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Header: Gender Switcher + Biometric Status + Quick Edit Button */}
      <div className={`relative z-10 flex flex-wrap items-center justify-between gap-2.5 border-b pb-3.5 ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00f2ff] animate-ping" />
            <h3 className={`text-xs sm:text-sm md:text-base font-black tracking-wide uppercase font-mono flex items-center gap-1.5 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              <Zap className="w-4 h-4 text-cyan-500" />
              Holo-Bio Escaneo Corporal
            </h3>
          </div>
          <p className={`text-[11px] sm:text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Modelo biométrico interactivo según género y medidas
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Gender Toggle Selector */}
          <div className={`flex items-center p-0.5 sm:p-1 border rounded-2xl shadow-inner ${
            isDark ? 'bg-[#121c33] border-slate-700/80' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              id="btn-gender-male"
              type="button"
              onClick={() => handleGenderToggle('hombre')}
              className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold font-mono transition-all duration-300 cursor-pointer ${
                currentGender === 'hombre'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>♂️</span>
              <span className="hidden sm:inline">Hombre</span>
            </button>
            
            <button
              id="btn-gender-female"
              type="button"
              onClick={() => handleGenderToggle('mujer')}
              className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold font-mono transition-all duration-300 cursor-pointer ${
                currentGender === 'mujer'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/30'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>♀️</span>
              <span className="hidden sm:inline">Mujer</span>
            </button>
          </div>

          {/* Direct Biometric Edit Trigger */}
          <button
            id="btn-open-holo-bio-edit"
            type="button"
            onClick={() => handleOpenEdit('all')}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-mono font-bold transition-all shadow-sm cursor-pointer border ${
              isDark 
                ? 'bg-gradient-to-r from-[#00f2ff]/20 to-[#38ef7d]/20 hover:from-[#00f2ff]/30 hover:to-[#38ef7d]/30 border-[#00f2ff]/50 text-[#00f2ff] hover:text-white' 
                : 'bg-cyan-50 hover:bg-cyan-100 border-cyan-300 text-cyan-800'
            }`}
            title="Editar edad, estatura, peso actual y cintura"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Editar Datos</span>
          </button>
        </div>
      </div>

      {/* Main Body Figure Canvas & Interactive Telemetry Nodes */}
      <div className="relative z-10 my-3 py-1 flex flex-col lg:flex-row items-center justify-center gap-4 sm:gap-6">
        
        {/* Left Telemetry Badges */}
        <div className="w-full lg:w-44 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2 sm:gap-2.5 order-2 lg:order-1">
          {/* Head & Age */}
          <div 
            id="badge-bio-age"
            onClick={() => handleOpenEdit('age')}
            onMouseEnter={() => setActiveZone('head')}
            onMouseLeave={() => setActiveZone('all')}
            className={`group p-2.5 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden ${
              activeZone === 'head' 
                ? 'bg-cyan-500/20 border-cyan-400 shadow-md scale-[1.02]' 
                : isDark
                ? 'bg-[#121c33]/70 border-slate-800 hover:border-cyan-500/50 hover:bg-[#121c33]'
                : 'bg-slate-50 border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/40 shadow-sm'
            }`}
            title="Clic para cambiar edad"
          >
            <div className={`flex items-center justify-between text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-cyan-500" /> Edad</span>
              <span className="text-[10px] text-cyan-600 dark:text-cyan-300 font-bold group-hover:underline flex items-center gap-0.5">
                <Edit3 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                Años
              </span>
            </div>
            <div className={`text-base sm:text-lg font-black mt-0.5 flex items-baseline justify-between ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <span>{currentAge || '--'} <span className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>años</span></span>
              <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400/70 group-hover:text-cyan-500">Editar ✎</span>
            </div>
          </div>

          {/* Height */}
          <div 
            id="badge-bio-height"
            onClick={() => handleOpenEdit('height')}
            onMouseEnter={() => setActiveZone('legs')}
            onMouseLeave={() => setActiveZone('all')}
            className={`group p-2.5 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden ${
              activeZone === 'legs' 
                ? 'bg-emerald-500/20 border-emerald-400 shadow-md scale-[1.02]' 
                : isDark
                ? 'bg-[#121c33]/70 border-slate-800 hover:border-emerald-500/50 hover:bg-[#121c33]'
                : 'bg-slate-50 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 shadow-sm'
            }`}
            title="Clic para cambiar estatura"
          >
            <div className={`flex items-center justify-between text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5 text-emerald-500" /> Estatura</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold group-hover:underline flex items-center gap-0.5">
                <Edit3 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                cm
              </span>
            </div>
            <div className={`text-base sm:text-lg font-black mt-0.5 flex items-baseline justify-between ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <span>{currentHeight || '--'} <span className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>cm</span></span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400/70 group-hover:text-emerald-500">Editar ✎</span>
            </div>
          </div>

          {/* BMR Basal */}
          <div 
            id="badge-bio-bmr"
            onClick={() => handleOpenEdit('all')}
            onMouseEnter={() => setActiveZone('chest')}
            onMouseLeave={() => setActiveZone('all')}
            className={`group p-2.5 rounded-2xl border transition-all duration-300 cursor-pointer ${
              activeZone === 'chest' 
                ? 'bg-amber-500/20 border-amber-400 shadow-md' 
                : isDark
                ? 'bg-[#121c33]/70 border-slate-800 hover:border-amber-500/40 hover:bg-[#121c33]'
                : 'bg-slate-50 border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 shadow-sm'
            }`}
            title="Tasa Metabólica Basal (Calorías mínimas diarias en reposo)"
          >
            <div className={`flex items-center justify-between text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-amber-500" /> Tasa Basal</span>
              <span className="text-[10px] text-amber-600 dark:text-amber-300 font-bold">TMB</span>
            </div>
            <div className={`text-base sm:text-lg font-black mt-0.5 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
              {bmr.toLocaleString()} <span className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>kcal</span>
            </div>
            <div className={`text-[10px] mt-0.5 flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span>En reposo</span>
              <span className="text-amber-600 dark:text-amber-400/70 font-mono">Calcular ✎</span>
            </div>
          </div>
        </div>

        {/* Central High-Tech Silhouette Vector Figure */}
        <div className="relative w-40 sm:w-52 lg:w-56 h-60 sm:h-72 lg:h-80 flex items-center justify-center order-1 lg:order-2">
          
          {/* Cyber Body Rings & Orbital HUD */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div 
              className="w-36 sm:w-48 lg:w-52 h-36 sm:h-48 lg:h-52 rounded-full border border-dashed opacity-25 animate-spin"
              style={{ 
                borderColor: accentColor,
                animationDuration: '28s' 
              }} 
            />
            <div 
              className={`absolute w-44 sm:w-56 lg:w-64 h-44 sm:h-56 lg:h-64 rounded-full border opacity-30 animate-pulse ${
                isDark ? 'border-cyan-500/20' : 'border-cyan-400/40'
              }`} 
            />
          </div>

          {/* SVG Friendly Character Figure Rendering (Male / Female Stylized & Friendly Avatar) */}
          <svg
            viewBox="0 0 240 340"
            className="w-full h-full filter drop-shadow-[0_0_20px_rgba(0,242,255,0.25)] transition-all duration-500"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Male Theme Gradients */}
              <linearGradient id="maleSkinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="60%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>

              <linearGradient id="maleShirtGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#0e7490" />
              </linearGradient>

              <linearGradient id="maleShortsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>

              {/* Female Theme Gradients */}
              <linearGradient id="femaleSkinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="60%" stopColor="#db2777" />
                <stop offset="100%" stopColor="#9d174d" />
              </linearGradient>

              <linearGradient id="femaleTopGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fb7185" />
                <stop offset="100%" stopColor="#e11d48" />
              </linearGradient>

              <linearGradient id="femaleLeggingsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#312e81" />
                <stop offset="100%" stopColor="#1e1b4b" />
              </linearGradient>

              <linearGradient id="glowGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00f2ff" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#38ef7d" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#00f2ff" stopOpacity="0.8" />
              </linearGradient>

              <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Ambient Aura Background Ring */}
            <circle
              cx="120"
              cy="165"
              r="105"
              fill={currentGender === 'hombre' ? '#0284c7' : '#db2777'}
              fillOpacity="0.05"
              stroke={currentGender === 'hombre' ? '#38bdf8' : '#f472b6'}
              strokeWidth="1.5"
              strokeDasharray="6 6"
              className="animate-spin"
              style={{ animationDuration: '45s', transformOrigin: '120px 165px' }}
            />

            {/* Friendly Base Platform with Reflection */}
            <ellipse cx="120" cy="318" rx="72" ry="12" fill={accentColor} fillOpacity="0.2" filter="url(#softGlow)" />
            <ellipse cx="120" cy="318" rx="55" ry="7" fill="#090f1d" stroke={accentColor} strokeWidth="1.5" />

            {/* CHARACTER RENDERING */}
            {currentGender === 'hombre' ? (
              /* FRIENDLY MALE ATHLETIC AVATAR */
              <g id="avatar-friendly-male" className="transition-all duration-300">
                
                {/* Shoes */}
                <path d="M78 300 C78 312 85 316 98 316 C105 316 108 310 106 300 Z" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                <path d="M134 300 C132 310 135 316 142 316 C155 316 162 312 162 300 Z" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                {/* Shoe soles glow */}
                <path d="M80 314 Q95 318 106 314" stroke="#00f2ff" strokeWidth="2" strokeLinecap="round" />
                <path d="M134 314 Q145 318 160 314" stroke="#00f2ff" strokeWidth="2" strokeLinecap="round" />

                {/* Legs & Calves */}
                <path d="M88 220 L86 300 L102 300 L106 220 Z" fill="url(#maleSkinGrad)" stroke="#0284c7" strokeWidth="1" />
                <path d="M134 220 L138 300 L154 300 L152 220 Z" fill="url(#maleSkinGrad)" stroke="#0284c7" strokeWidth="1" />

                {/* Athletic Shorts */}
                <path 
                  d="M78 165 C78 165 72 225 76 228 C80 230 110 228 114 200 L120 185 L126 200 C130 228 160 230 164 228 C168 225 162 165 162 165 Z" 
                  fill="url(#maleShortsGrad)" 
                  stroke="#38bdf8" 
                  strokeWidth="1.5" 
                />
                {/* Shorts Accent Stripes */}
                <path d="M82 175 L80 220" stroke="#00f2ff" strokeWidth="2" strokeLinecap="round" />
                <path d="M158 175 L160 220" stroke="#00f2ff" strokeWidth="2" strokeLinecap="round" />

                {/* Waist Belt Indicator */}
                <path d="M80 165 Q120 172 160 165" stroke={waistEval.color} strokeWidth="3" strokeLinecap="round" />

                {/* Torso & Athletic T-Shirt */}
                <path 
                  d="M76 96 C70 120 74 165 80 166 C100 168 140 168 160 166 C166 165 170 120 164 96 C152 82 136 82 120 85 C104 82 88 82 76 96 Z" 
                  fill="url(#maleShirtGrad)" 
                  stroke="#00f2ff" 
                  strokeWidth="1.5" 
                />
                
                {/* Chest Emblem: Heart & Pulse Tech */}
                <circle cx="120" cy="115" r="10" fill="#082f49" stroke="#38ef7d" strokeWidth="1.5" />
                <path d="M114 115 L117 115 L119 111 L121 119 L123 113 L126 115" stroke="#38ef7d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Left Arm (Relaxed & Fit) */}
                <path 
                  d="M74 98 C60 115 50 145 54 180 C56 186 64 186 66 180 C70 150 78 125 84 105 Z" 
                  fill="url(#maleSkinGrad)" 
                  stroke="#0284c7" 
                  strokeWidth="1" 
                />
                {/* Left Hand */}
                <circle cx="56" cy="184" r="7" fill="url(#maleSkinGrad)" />

                {/* Right Arm (Friendly Wave / Thumbs Up) */}
                <path 
                  d="M162 98 C176 110 188 128 190 148 C192 154 184 158 180 152 C174 135 166 118 156 105 Z" 
                  fill="url(#maleSkinGrad)" 
                  stroke="#0284c7" 
                  strokeWidth="1" 
                />
                {/* Right Hand Waving */}
                <g transform="translate(188, 142)">
                  <circle cx="0" cy="0" r="7" fill="url(#maleSkinGrad)" />
                  <path d="M-2 -6 C0 -9 4 -9 5 -6 C5 -3 1 0 0 2" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
                </g>

                {/* Neck */}
                <path d="M112 76 L112 88 C116 90 124 90 128 88 L128 76 Z" fill="url(#maleSkinGrad)" />

                {/* Head & Friendly Face */}
                <g id="male-head">
                  {/* Ears */}
                  <circle cx="100" cy="56" r="4.5" fill="url(#maleSkinGrad)" />
                  <circle cx="140" cy="56" r="4.5" fill="url(#maleSkinGrad)" />

                  {/* Face Base */}
                  <ellipse cx="120" cy="56" rx="18" ry="21" fill="url(#maleSkinGrad)" stroke="#38bdf8" strokeWidth="1.5" />

                  {/* Stylish Modern Hair */}
                  <path 
                    d="M100 52 C98 34 112 24 126 24 C138 24 146 32 144 46 C138 38 132 38 120 38 C110 38 104 44 100 52 Z" 
                    fill="#0369a1" 
                    stroke="#00f2ff" 
                    strokeWidth="1.5" 
                  />

                  {/* Friendly Smiling Eyes */}
                  <path d="M110 52 Q114 49 117 52" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="114" cy="53" r="1.5" fill="#00f2ff" />

                  <path d="M123 52 Q126 49 130 52" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="126" cy="53" r="1.5" fill="#00f2ff" />

                  {/* Cute Eyebrows */}
                  <path d="M109 46 Q114 44 118 47" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M122 47 Q126 44 131 46" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />

                  {/* Friendly Big Smile */}
                  <path d="M113 64 Q120 70 127 64" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none" />
                  <path d="M115 64 Q120 68 125 64" fill="#38ef7d" fillOpacity="0.4" />

                  {/* Cheerful Blush */}
                  <circle cx="107" cy="59" r="3" fill="#38ef7d" fillOpacity="0.4" filter="url(#softGlow)" />
                  <circle cx="133" cy="59" r="3" fill="#38ef7d" fillOpacity="0.4" filter="url(#softGlow)" />
                </g>

              </g>
            ) : (
              /* FRIENDLY FEMALE ATHLETIC AVATAR */
              <g id="avatar-friendly-female" className="transition-all duration-300">
                
                {/* Sport Shoes */}
                <path d="M80 302 C80 312 87 316 98 316 C105 316 108 310 106 302 Z" fill="#db2777" stroke="#f472b6" strokeWidth="1.5" />
                <path d="M134 302 C132 310 135 316 142 316 C153 316 160 312 160 302 Z" fill="#db2777" stroke="#f472b6" strokeWidth="1.5" />
                {/* Shoe soles glow */}
                <path d="M82 314 Q94 318 106 314" stroke="#fb7185" strokeWidth="2" strokeLinecap="round" />
                <path d="M134 314 Q146 318 158 314" stroke="#fb7185" strokeWidth="2" strokeLinecap="round" />

                {/* Athletic Leggings / Legs */}
                <path 
                  d="M84 175 C82 210 84 250 86 302 L104 302 C106 250 114 210 116 182 Z" 
                  fill="url(#femaleLeggingsGrad)" 
                  stroke="#db2777" 
                  strokeWidth="1.2" 
                />
                <path 
                  d="M156 175 C158 210 156 250 154 302 L136 302 C134 250 126 210 124 182 Z" 
                  fill="url(#femaleLeggingsGrad)" 
                  stroke="#db2777" 
                  strokeWidth="1.2" 
                />

                {/* Leggings Neon Side Stripe */}
                <path d="M85 180 Q84 240 88 295" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" />
                <path d="M155 180 Q156 240 152 295" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" />

                {/* Waist Belt Indicator */}
                <path d="M86 168 Q120 174 154 168" stroke={waistEval.color} strokeWidth="3" strokeLinecap="round" />

                {/* Athletic Crop-Top / Activewear */}
                <path 
                  d="M82 98 C78 120 86 160 90 168 C105 170 135 170 150 168 C154 160 162 120 158 98 C148 88 136 86 120 88 C104 86 92 88 82 98 Z" 
                  fill="url(#femaleTopGrad)" 
                  stroke="#f472b6" 
                  strokeWidth="1.5" 
                />
                
                {/* Midriff Skin Area */}
                <path d="M90 156 Q120 160 150 156 L152 168 Q120 174 88 168 Z" fill="url(#femaleSkinGrad)" opacity="0.9" />

                {/* Chest Vital Tracker Emblem */}
                <circle cx="120" cy="116" r="9" fill="#4c0519" stroke="#38ef7d" strokeWidth="1.5" />
                <path d="M115 116 L118 116 L120 112 L122 120 L124 114 L126 116" stroke="#38ef7d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Left Arm (Smooth & Friendly) */}
                <path 
                  d="M80 100 C68 115 58 145 62 180 C64 186 72 186 74 180 C78 150 84 125 90 106 Z" 
                  fill="url(#femaleSkinGrad)" 
                  stroke="#db2777" 
                  strokeWidth="1" 
                />
                {/* Left Hand */}
                <circle cx="64" cy="184" r="6.5" fill="url(#femaleSkinGrad)" />

                {/* Right Arm (Enthusiastic Greeting Pose) */}
                <path 
                  d="M160 100 C172 112 184 130 188 150 C190 156 182 160 178 154 C172 136 164 118 154 106 Z" 
                  fill="url(#femaleSkinGrad)" 
                  stroke="#db2777" 
                  strokeWidth="1" 
                />
                {/* Right Hand Greeting */}
                <g transform="translate(186, 144)">
                  <circle cx="0" cy="0" r="6.5" fill="url(#femaleSkinGrad)" />
                  <path d="M-2 -5 C0 -8 4 -8 5 -5 C5 -2 1 0 0 2" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round" />
                </g>

                {/* Neck */}
                <path d="M114 78 L114 88 C117 90 123 90 126 88 L126 78 Z" fill="url(#femaleSkinGrad)" />

                {/* Head & Friendly Cheerful Face */}
                <g id="female-head">
                  {/* High Ponytail / Hair Backdrop */}
                  <path 
                    d="M136 34 C155 30 168 45 165 70 C162 76 156 74 154 68 C155 52 146 44 136 42 Z" 
                    fill="#831843" 
                    stroke="#f472b6" 
                    strokeWidth="1.5" 
                  />
                  <circle cx="138" cy="38" r="4" fill="#fb7185" />

                  {/* Ears */}
                  <circle cx="102" cy="58" r="4" fill="url(#femaleSkinGrad)" />
                  <circle cx="138" cy="58" r="4" fill="url(#femaleSkinGrad)" />

                  {/* Face Base */}
                  <ellipse cx="120" cy="58" rx="17" ry="19.5" fill="url(#femaleSkinGrad)" stroke="#f472b6" strokeWidth="1.5" />

                  {/* Beautiful Friendly Bangs & Hair */}
                  <path 
                    d="M102 52 C100 36 112 26 125 26 C137 26 144 34 140 48 C135 39 128 38 120 38 C110 38 105 45 102 52 Z" 
                    fill="#9d174d" 
                    stroke="#f472b6" 
                    strokeWidth="1.5" 
                  />

                  {/* Big Friendly Anime/Cute Eyes */}
                  <path d="M110 54 Q114 50 117 54" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="114" cy="55" r="2" fill="#38ef7d" />
                  <circle cx="115" cy="54" r="0.7" fill="#ffffff" />

                  <path d="M123 54 Q126 50 130 54" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="126" cy="55" r="2" fill="#38ef7d" />
                  <circle cx="127" cy="54" r="0.7" fill="#ffffff" />

                  {/* Soft Eyebrows */}
                  <path d="M109 48 Q114 46 118 49" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M122 49 Q126 46 131 48" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round" />

                  {/* Charming Sweet Smile */}
                  <path d="M114 65 Q120 71 126 65" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none" />
                  <path d="M116 65 Q120 69 124 65" fill="#f43f5e" fillOpacity="0.5" />

                  {/* Sweet Cheerful Pink Blush */}
                  <circle cx="108" cy="61" r="3.5" fill="#fb7185" fillOpacity="0.6" filter="url(#softGlow)" />
                  <circle cx="132" cy="61" r="3.5" fill="#fb7185" fillOpacity="0.6" filter="url(#softGlow)" />
                </g>

              </g>
            )}

            {/* Interactive Biometric Glowing Hotspots */}
            
            {/* 1. Head / Age Hotspot */}
            <g 
              className="cursor-pointer transition-transform duration-300 hover:scale-125"
              onClick={() => handleOpenEdit('age')}
              onMouseEnter={() => setActiveZone('head')}
            >
              <circle cx="120" cy="58" r="14" fill="transparent" />
              <circle 
                cx="142" cy="38" r="7" 
                fill={activeZone === 'head' ? '#00f2ff' : '#0e1629'} 
                stroke="#00f2ff" 
                strokeWidth="2" 
                className="animate-pulse"
              />
              <text x="142" y="41" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="monospace">
                {currentAge || '?'}
              </text>
            </g>

            {/* 2. Chest / BMR Energy Pulse Hotspot */}
            <g 
              className="cursor-pointer transition-transform duration-300 hover:scale-125"
              onClick={() => handleOpenEdit('all')}
              onMouseEnter={() => setActiveZone('chest')}
            >
              <circle cx="120" cy="116" r="14" fill="transparent" />
              <circle 
                cx="120" cy="116" r="8" 
                fill="#fbbf24" 
                fillOpacity="0.2" 
                stroke="#fbbf24" 
                strokeWidth="1.5" 
                className="animate-ping"
              />
            </g>

            {/* 3. Waist / PC Circumference Hotspot with Pulsing Smart Ring */}
            <g 
              className="cursor-pointer"
              onClick={() => handleOpenEdit('waist')} 
              onMouseEnter={() => setActiveZone('waist')}
            >
              <ellipse 
                cx="120" cy="168" rx="42" ry="7" 
                fill="none" 
                stroke={waistEval.color} 
                strokeWidth="2.5" 
                strokeDasharray="5 3"
                className="animate-pulse"
              />
              <circle cx="162" cy="168" r="6" fill={waistEval.color} stroke="#ffffff" strokeWidth="1.5" />
            </g>

            {/* 4. Feet / Height Hotspot */}
            <g 
              className="cursor-pointer transition-transform duration-300 hover:scale-125"
              onClick={() => handleOpenEdit('height')}
              onMouseEnter={() => setActiveZone('legs')}
            >
              <circle cx="120" cy="270" r="18" fill="transparent" />
              <circle 
                cx="120" cy="265" r="7" 
                fill="#38ef7d" 
                stroke="#ffffff" 
                strokeWidth="1.5" 
                className="animate-bounce"
              />
              <text x="120" y="268" textAnchor="middle" fill="#00363a" fontSize="7" fontWeight="bold" fontFamily="monospace">
                ↕
              </text>
            </g>

          </svg>

          {/* Dynamic Floating Scan Line */}
          <div 
            className="absolute left-4 right-4 h-0.5 opacity-70 pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
              boxShadow: `0 0 12px ${accentColor}`,
              top: activeZone === 'head' ? '18%' : activeZone === 'chest' ? '34%' : activeZone === 'waist' ? '50%' : activeZone === 'legs' ? '78%' : '44%',
              transition: 'top 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
        </div>

        {/* Right Telemetry Badges */}
        <div className="w-full lg:w-44 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2 sm:gap-2.5 order-3">
          {/* Current Weight */}
          <div 
            id="badge-bio-weight"
            onClick={() => handleOpenEdit('weight')}
            onMouseEnter={() => setActiveZone('waist')}
            onMouseLeave={() => setActiveZone('all')}
            className={`group p-2.5 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden ${
              activeZone === 'waist' 
                ? 'bg-cyan-500/20 border-cyan-400 shadow-md scale-[1.02]' 
                : isDark
                ? 'bg-[#121c33]/70 border-slate-800 hover:border-cyan-500/50 hover:bg-[#121c33]'
                : 'bg-slate-50 border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/40 shadow-sm'
            }`}
            title="Clic para actualizar tu peso actual"
          >
            <div className={`flex items-center justify-between text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="flex items-center gap-1"><WeightIcon className="w-3.5 h-3.5 text-cyan-500" /> Peso Actual</span>
              <span className="text-[10px] text-cyan-600 dark:text-cyan-300 font-bold group-hover:underline flex items-center gap-0.5">
                <Edit3 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                kg
              </span>
            </div>
            <div className={`text-base sm:text-lg font-black mt-0.5 flex items-baseline justify-between ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <span>{currentWeight || '--'} <span className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>kg</span></span>
              <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400/70 group-hover:text-cyan-500">Editar ✎</span>
            </div>
          </div>

          {/* Waist Circumference PC */}
          <div 
            id="badge-bio-waist"
            onClick={() => handleOpenEdit('waist')}
            onMouseEnter={() => setActiveZone('waist')}
            onMouseLeave={() => setActiveZone('all')}
            className={`group p-2.5 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden ${
              activeZone === 'waist' 
                ? 'bg-emerald-500/20 border-emerald-400 shadow-md scale-[1.02]' 
                : isDark
                ? 'bg-[#121c33]/70 border-slate-800 hover:border-emerald-500/50 hover:bg-[#121c33]'
                : 'bg-slate-50 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 shadow-sm'
            }`}
            title="Clic para registrar perímetro de cintura"
          >
            <div className={`flex items-center justify-between text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-emerald-500" /> PC (Cintura)</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-300 font-bold group-hover:underline flex items-center gap-0.5">
                <Edit3 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                cm
              </span>
            </div>
            <div className={`text-base sm:text-lg font-black mt-0.5 flex items-baseline justify-between ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <span>{currentWaist || '--'} <span className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>cm</span></span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400/70 group-hover:text-emerald-500">Editar ✎</span>
            </div>
            <div className="text-[10px] font-semibold mt-0.5 truncate" style={{ color: waistEval.color }}>
              {waistEval.status}
            </div>
          </div>

          {/* TDEE Daily Energy Output */}
          <div 
            id="badge-bio-tdee"
            onClick={() => handleOpenEdit('all')}
            onMouseEnter={() => setActiveZone('chest')}
            onMouseLeave={() => setActiveZone('all')}
            className={`group p-2.5 rounded-2xl border transition-all duration-300 cursor-pointer ${
              activeZone === 'chest' 
                ? 'bg-purple-500/20 border-purple-400 shadow-md' 
                : isDark
                ? 'bg-[#121c33]/70 border-slate-800 hover:border-purple-500/40 hover:bg-[#121c33]'
                : 'bg-slate-50 border-slate-200 hover:border-purple-400 hover:bg-purple-50/40 shadow-sm'
            }`}
            title="Gasto Calórico Total Diario según nivel de actividad"
          >
            <div className={`flex items-center justify-between text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-purple-500" /> Gasto Total</span>
              <span className="text-[10px] text-purple-600 dark:text-purple-300 font-bold">TDEE</span>
            </div>
            <div className={`text-base sm:text-lg font-black mt-0.5 ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>
              {tdee.toLocaleString()} <span className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>kcal</span>
            </div>
            <div className={`text-[10px] mt-0.5 flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="capitalize truncate max-w-[90px]">{currentActivityLevel}</span>
              <span className="text-purple-600 dark:text-purple-400/70 font-mono">Ajustar ✎</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Key Metric Bar: BMI Gauge + Ideal Range */}
      <div className={`relative z-10 pt-3.5 border-t grid grid-cols-1 sm:grid-cols-2 gap-3 ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        
        {/* BMI Card */}
        <div 
          onClick={() => handleOpenEdit('all')}
          className="p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer hover:scale-[1.01] transition-transform"
          style={{ 
            backgroundColor: isDark ? bmiInfo.badgeBg : `${bmiInfo.color}15`,
            borderColor: `${bmiInfo.color}40`
          }}
          title="Clic para recalcular IMC"
        >
          <div>
            <div className={`flex items-center space-x-1.5 text-xs font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <Sparkles className="w-3.5 h-3.5" style={{ color: bmiInfo.color }} />
              <span className="font-bold uppercase tracking-wider">Índice IMC</span>
            </div>
            <div className="text-xl sm:text-2xl font-black mt-0.5" style={{ color: bmiInfo.color }}>
              {bmi > 0 ? bmi : '--'}
            </div>
            <div className={`text-xs font-semibold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {bmiInfo.label}
            </div>
          </div>

          <div className="text-right">
            <span className={`text-[11px] font-mono block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Rango Normal</span>
            <span className={`text-xs font-bold font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>18.5 - 24.9</span>
            <div className="mt-1">
              <span 
                className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono inline-block border"
                style={{ 
                  backgroundColor: `${bmiInfo.color}20`,
                  color: bmiInfo.color,
                  borderColor: `${bmiInfo.color}50`
                }}
              >
                {bmiInfo.rangeText}
              </span>
            </div>
          </div>
        </div>

        {/* Ideal Weight Range & Goal */}
        <div 
          onClick={() => handleOpenEdit('weight')}
          className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer hover:scale-[1.01] transition-transform ${
            isDark 
              ? 'bg-[#121c33]/80 border-slate-700/80' 
              : 'bg-emerald-50/50 border-emerald-200'
          }`}
          title="Clic para ajustar peso o meta"
        >
          <div>
            <div className={`flex items-center space-x-1.5 text-xs font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <Target className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-bold uppercase tracking-wider">Peso Saludable</span>
            </div>
            <div className={`text-lg sm:text-xl font-black mt-0.5 font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              {idealRange.min} - {idealRange.max} <span className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>kg</span>
            </div>
            <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {currentTargetWeight ? `Meta elegida: ${currentTargetWeight} kg` : `Punto medio ideal: ${idealRange.mid} kg`}
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl border flex items-center justify-center font-mono font-bold text-xs shadow-inner ${
              isDark 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-emerald-100 border-emerald-300 text-emerald-800'
            }`}>
              {currentWeight && idealRange.mid ? (
                <span>
                  {currentWeight > idealRange.max 
                    ? `+${(currentWeight - idealRange.max).toFixed(1)}` 
                    : currentWeight < idealRange.min 
                    ? `-${(idealRange.min - currentWeight).toFixed(1)}` 
                    : '✓'}
                </span>
              ) : '--'}
            </div>
          </div>
        </div>

      </div>

      {/* Success Notification Toast */}
      {saveToast && (
        <div className="absolute top-4 right-4 z-50 px-4 py-2 rounded-2xl bg-emerald-500/90 text-slate-900 font-mono font-bold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4" />
          <span>¡Datos biométricos actualizados con éxito!</span>
        </div>
      )}

      {/* Quick Biometric Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className={`relative w-full max-w-xl rounded-3xl border p-5 sm:p-7 shadow-2xl space-y-4 sm:space-y-5 overflow-y-auto max-h-[90vh] ${
              isDark 
                ? 'bg-[#090f1d] border-cyan-500/50 text-white' 
                : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between border-b pb-3.5 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl border flex items-center justify-center shadow-inner ${
                  isDark ? 'bg-cyan-500/20 border-cyan-500/50 text-[#00f2ff]' : 'bg-cyan-100 border-cyan-300 text-cyan-700'
                }`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-sm sm:text-base font-black uppercase font-mono tracking-wide ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    Modificar Datos Biométricos
                  </h3>
                  <p className={`text-[11px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Actualiza tu edad, estatura, peso actual y medidas corporales
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isDark ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveBiometrics} className="space-y-4">
              
              {/* Gender Selector */}
              <div>
                <label className={`block text-xs font-mono mb-1.5 font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Género Anatómico
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormGender('hombre')}
                    className={`py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl text-xs font-mono font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      formGender === 'hombre'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-600 dark:text-cyan-200 shadow-sm'
                        : isDark ? 'bg-[#121c33] border-slate-700 text-slate-400 hover:border-slate-600' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-base">♂️</span>
                    <span>Hombre</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormGender('mujer')}
                    className={`py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl text-xs font-mono font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      formGender === 'mujer'
                        ? 'bg-pink-500/20 border-pink-400 text-pink-600 dark:text-pink-200 shadow-sm'
                        : isDark ? 'bg-[#121c33] border-slate-700 text-slate-400 hover:border-slate-600' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-base">♀️</span>
                    <span>Mujer</span>
                  </button>
                </div>
              </div>

              {/* Grid 2 Columns for Primary Biometrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                
                {/* Age Input with Steppers */}
                <div className={`p-3 rounded-2xl border transition-all ${
                  editFieldFocus === 'age' 
                    ? 'border-cyan-400 bg-cyan-500/10' 
                    : isDark ? 'border-slate-800 bg-[#121c33]/80' : 'border-slate-200 bg-slate-50'
                }`}>
                  <label className={`block text-xs font-mono mb-1 font-bold flex items-center justify-between ${
                    isDark ? 'text-cyan-300' : 'text-cyan-700'
                  }`}>
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> Edad (Años)</span>
                    <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>10 a 115 años</span>
                  </label>
                  <div className="flex items-center space-x-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setFormAge(prev => Math.max(10, (prev || 25) - 1))}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold font-mono transition-colors cursor-pointer ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      id="input-bio-age"
                      type="number"
                      min="10"
                      max="115"
                      required
                      value={formAge}
                      onChange={(e) => setFormAge(parseInt(e.target.value, 10) || 0)}
                      className={`flex-1 px-3 py-1.5 rounded-xl border font-mono text-center font-bold text-base focus:outline-none ${
                        isDark ? 'bg-[#090f1d] border-slate-700 text-white focus:border-cyan-400' : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setFormAge(prev => Math.min(115, (prev || 25) + 1))}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold font-mono transition-colors cursor-pointer ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Height Input with Steppers */}
                <div className={`p-3 rounded-2xl border transition-all ${
                  editFieldFocus === 'height' 
                    ? 'border-emerald-400 bg-emerald-500/10' 
                    : isDark ? 'border-slate-800 bg-[#121c33]/80' : 'border-slate-200 bg-slate-50'
                }`}>
                  <label className={`block text-xs font-mono mb-1 font-bold flex items-center justify-between ${
                    isDark ? 'text-emerald-300' : 'text-emerald-700'
                  }`}>
                    <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" /> Estatura (cm)</span>
                    <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>90 a 240 cm</span>
                  </label>
                  <div className="flex items-center space-x-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setFormHeight(prev => Math.max(90, (prev || 170) - 1))}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold font-mono transition-colors cursor-pointer ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      id="input-bio-height"
                      type="number"
                      min="90"
                      max="240"
                      required
                      value={formHeight}
                      onChange={(e) => setFormHeight(parseInt(e.target.value, 10) || 0)}
                      className={`flex-1 px-3 py-1.5 rounded-xl border font-mono text-center font-bold text-base focus:outline-none ${
                        isDark ? 'bg-[#090f1d] border-slate-700 text-white focus:border-emerald-400' : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setFormHeight(prev => Math.min(240, (prev || 170) + 1))}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold font-mono transition-colors cursor-pointer ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Current Weight Input with Steppers */}
                <div className={`p-3 rounded-2xl border transition-all ${
                  editFieldFocus === 'weight' 
                    ? 'border-cyan-400 bg-cyan-500/10' 
                    : isDark ? 'border-slate-800 bg-[#121c33]/80' : 'border-slate-200 bg-slate-50'
                }`}>
                  <label className={`block text-xs font-mono mb-1 font-bold flex items-center justify-between ${
                    isDark ? 'text-cyan-300' : 'text-cyan-700'
                  }`}>
                    <span className="flex items-center gap-1"><WeightIcon className="w-3.5 h-3.5" /> Peso Actual (kg)</span>
                    <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>25 a 300 kg</span>
                  </label>
                  <div className="flex items-center space-x-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setFormWeight(prev => Math.max(25, Number(((prev || 70) - 0.5).toFixed(1))))}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold font-mono transition-colors cursor-pointer ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      id="input-bio-weight"
                      type="number"
                      step="0.1"
                      min="25"
                      max="300"
                      required
                      value={formWeight}
                      onChange={(e) => setFormWeight(parseFloat(e.target.value) || 0)}
                      className={`flex-1 px-3 py-1.5 rounded-xl border font-mono text-center font-bold text-base focus:outline-none ${
                        isDark ? 'bg-[#090f1d] border-slate-700 text-white focus:border-cyan-400' : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setFormWeight(prev => Math.min(300, Number(((prev || 70) + 0.5).toFixed(1))))}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold font-mono transition-colors cursor-pointer ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Waist Circumference PC */}
                <div className={`p-3 rounded-2xl border transition-all ${
                  editFieldFocus === 'waist' 
                    ? 'border-emerald-400 bg-emerald-500/10' 
                    : isDark ? 'border-slate-800 bg-[#121c33]/80' : 'border-slate-200 bg-slate-50'
                }`}>
                  <label className={`block text-xs font-mono mb-1 font-bold flex items-center justify-between ${
                    isDark ? 'text-emerald-300' : 'text-emerald-700'
                  }`}>
                    <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> Perímetro Cintura (PC cm)</span>
                    <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Opcional</span>
                  </label>
                  <div className="flex items-center space-x-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setFormWaist(prev => Math.max(40, (prev || 80) - 1))}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold font-mono transition-colors cursor-pointer ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      id="input-bio-waist"
                      type="number"
                      min="40"
                      max="180"
                      placeholder="Ej. 82"
                      value={formWaist || ''}
                      onChange={(e) => setFormWaist(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                      className={`flex-1 px-3 py-1.5 rounded-xl border font-mono text-center font-bold text-base focus:outline-none ${
                        isDark ? 'bg-[#090f1d] border-slate-700 text-white focus:border-emerald-400' : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setFormWaist(prev => Math.min(180, (prev || 80) + 1))}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold font-mono transition-colors cursor-pointer ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Target Weight & Activity Level Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Target Weight */}
                <div>
                  <label className={`block text-xs font-mono mb-1 font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Peso Objetivo / Meta (kg)
                  </label>
                  <input
                    id="input-bio-target-weight"
                    type="number"
                    step="0.1"
                    min="30"
                    max="200"
                    placeholder="Ej. 70.0"
                    value={formTargetWeight || ''}
                    onChange={(e) => setFormTargetWeight(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className={`w-full px-3 py-2 rounded-xl border font-mono text-sm focus:outline-none ${
                      isDark ? 'bg-[#121c33] border-slate-700 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                    }`}
                  />
                </div>

                {/* Activity Level */}
                <div>
                  <label className={`block text-xs font-mono mb-1 font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Nivel de Actividad Física
                  </label>
                  <select
                    id="select-bio-activity-level"
                    value={formActivityLevel}
                    onChange={(e) => setFormActivityLevel(e.target.value as ActivityLevel)}
                    className={`w-full px-3 py-2 rounded-xl border font-mono text-sm focus:outline-none ${
                      isDark ? 'bg-[#121c33] border-slate-700 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                    }`}
                  >
                    <option value="sedentario">Sedentario (poco o nada de ejercicio)</option>
                    <option value="ligero">Ligero (ejercicio 1-3 días/semana)</option>
                    <option value="moderado">Moderado (ejercicio 3-5 días/semana)</option>
                    <option value="intenso">Intenso (ejercicio 6-7 días/semana)</option>
                    <option value="atleta">Atleta / Trabajo Físico Diario</option>
                  </select>
                </div>
              </div>

              {/* Realtime Live Preview Ribbon */}
              <div className={`p-3 sm:p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono ${
                isDark ? 'bg-[#0e1629] border-cyan-500/30' : 'bg-cyan-50/60 border-cyan-200'
              }`}>
                <div>
                  <span className={`block text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>IMC Estimado:</span>
                  <span className="text-sm sm:text-base font-black" style={{ color: previewBmiInfo.color }}>
                    {previewBmi > 0 ? previewBmi : '--'} ({previewBmiInfo.label})
                  </span>
                </div>
                <div>
                  <span className={`block text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Tasa Basal (TMB):</span>
                  <span className={`text-sm sm:text-base font-black ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                    {previewBmr.toLocaleString()} kcal
                  </span>
                </div>
                <div>
                  <span className={`block text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Gasto Diario (TDEE):</span>
                  <span className={`text-sm sm:text-base font-black ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                    {previewTdee.toLocaleString()} kcal
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className={`flex items-center justify-end space-x-3 pt-3 border-t ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className={`px-4 py-2 rounded-xl border text-xs font-mono font-bold transition-colors cursor-pointer ${
                    isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  id="btn-save-biometrics-modal"
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] text-[#00363a] text-xs font-mono font-black shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Datos Biométricos</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
