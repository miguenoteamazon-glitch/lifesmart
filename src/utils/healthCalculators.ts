import { Gender, ActivityLevel, HealthProfile, WeightLogEntry } from '../types';

export interface BMICategoryInfo {
  label: string;
  category: 'bajo' | 'normal' | 'sobrepeso' | 'obesidad1' | 'obesidad2' | 'obesidad3';
  color: string;
  badgeBg: string;
  description: string;
  rangeText: string;
  recommendation: string;
}

export const ACTIVITY_LEVEL_DETAILS: Record<ActivityLevel, { label: string; multiplier: number; desc: string }> = {
  sedentario: {
    label: 'Sedentario',
    multiplier: 1.2,
    desc: 'Poco o ningún ejercicio, trabajo de escritorio',
  },
  ligero: {
    label: 'Actividad Ligera',
    multiplier: 1.375,
    desc: 'Ejercicio suave 1 a 3 días por semana',
  },
  moderado: {
    label: 'Moderado (Recomendado)',
    multiplier: 1.55,
    desc: 'Entrenamiento 3 a 5 días por semana',
  },
  intenso: {
    label: 'Intenso / Avanzado',
    multiplier: 1.725,
    desc: 'Ejercicio fuerte 6 a 7 días por semana',
  },
  atleta: {
    label: 'Atleta / Alto Rendimiento',
    multiplier: 1.9,
    desc: 'Entrenamientos dobles diarios o trabajo físico pesado',
  },
};

/**
 * Calculates Body Mass Index (IMC)
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm || heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Number(bmi.toFixed(1));
}

/**
 * Returns detailed BMI categorization
 */
export function getBMICategory(bmi: number): BMICategoryInfo {
  if (bmi <= 0) {
    return {
      label: 'Sin calcular',
      category: 'normal',
      color: '#94a3b8',
      badgeBg: 'rgba(148, 163, 184, 0.1)',
      description: 'Ingresa tu peso y estatura',
      rangeText: '-',
      recommendation: 'Completa los datos para ver tu diagnóstico.',
    };
  }

  if (bmi < 18.5) {
    return {
      label: 'Bajo Peso',
      category: 'bajo',
      color: '#38bdf8',
      badgeBg: 'rgba(56, 189, 248, 0.15)',
      description: 'Por debajo del rango recomendado',
      rangeText: '< 18.5',
      recommendation: 'Enfoque en superávit calórico nutritivo y entrenamiento de fuerza para masa muscular.',
    };
  }

  if (bmi < 25.0) {
    return {
      label: 'Peso Saludable / Óptimo',
      category: 'normal',
      color: '#38ef7d',
      badgeBg: 'rgba(56, 239, 125, 0.15)',
      description: 'Composición corporal en rango ideal',
      rangeText: '18.5 - 24.9',
      recommendation: '¡Excelente! Mantén tus hábitos activos, hidratación y balance calórico.',
    };
  }

  if (bmi < 30.0) {
    return {
      label: 'Sobrepeso',
      category: 'sobrepeso',
      color: '#fbbf24',
      badgeBg: 'rgba(251, 191, 36, 0.15)',
      description: 'Leve exceso ponderal según estatura',
      rangeText: '25.0 - 29.9',
      recommendation: 'Ajuste ligero en déficit calórico (-300 kcal) y combinación de fuerza + cardio.',
    };
  }

  if (bmi < 35.0) {
    return {
      label: 'Obesidad Tipo I',
      category: 'obesidad1',
      color: '#f97316',
      badgeBg: 'rgba(249, 115, 22, 0.15)',
      description: 'Riesgo metabólico moderado',
      rangeText: '30.0 - 34.9',
      recommendation: 'Plan estructurado de actividad diaria progresiva y asesoría nutricional.',
    };
  }

  if (bmi < 40.0) {
    return {
      label: 'Obesidad Tipo II',
      category: 'obesidad2',
      color: '#ef4444',
      badgeBg: 'rgba(239, 68, 68, 0.15)',
      description: 'Riesgo cardiovascular aumentado',
      rangeText: '35.0 - 39.9',
      recommendation: 'Monitoreo médico y metas realistas a mediano plazo paso a paso.',
    };
  }

  return {
    label: 'Obesidad Tipo III (Mórbida)',
    category: 'obesidad3',
    color: '#dc2626',
    badgeBg: 'rgba(220, 38, 38, 0.2)',
    description: 'Prioridad alta de salud',
    rangeText: '≥ 40.0',
    recommendation: 'Acompañamiento profesional personalizado y control de factores de riesgo.',
  };
}

/**
 * Calculates Basal Metabolic Rate (Tasa Metabólica Basal / TMB) using Mifflin-St Jeor equation
 */
export function calculateBMR(gender: Gender, weightKg: number, heightCm: number, age: number): number {
  if (!weightKg || !heightCm || !age || weightKg <= 0 || heightCm <= 0 || age <= 0) return 0;
  
  // Mifflin-St Jeor formula
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'hombre') {
    bmr += 5;
  } else {
    bmr -= 161;
  }
  return Math.round(bmr);
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE / Gasto Calórico Total)
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  if (!bmr || bmr <= 0) return 0;
  const factor = ACTIVITY_LEVEL_DETAILS[activityLevel]?.multiplier || 1.375;
  return Math.round(bmr * factor);
}

/**
 * Calculates healthy weight range for height
 */
export function getIdealWeightRange(heightCm: number): { min: number; max: number; mid: number } {
  if (!heightCm || heightCm <= 0) return { min: 50, max: 70, mid: 60 };
  const hM = heightCm / 100;
  const min = Number((18.5 * hM * hM).toFixed(1));
  const max = Number((24.9 * hM * hM).toFixed(1));
  const mid = Number(((min + max) / 2).toFixed(1));
  return { min, max, mid };
}

/**
 * Evaluates Waist Circumference (PC - Perímetro de Cintura) and Waist-to-Height Ratio (WHtR)
 */
export function evaluateWaist(gender: Gender, waistCm?: number, heightCm?: number): {
  status: string;
  color: string;
  ratio?: number;
  recommendation: string;
} {
  if (!waistCm || waistCm <= 0) {
    return {
      status: 'No especificado',
      color: '#94a3b8',
      recommendation: 'Mide tu cintura a la altura del ombligo para evaluar riesgo cardiovascular.',
    };
  }

  let ratio: number | undefined;
  if (heightCm && heightCm > 0) {
    ratio = Number((waistCm / heightCm).toFixed(2));
  }

  if (gender === 'hombre') {
    if (waistCm < 94) {
      return {
        status: 'Cintura Saludable (Riesgo Bajo)',
        color: '#38ef7d',
        ratio,
        recommendation: 'Excelente perímetro abdominal. Baja acumulación de grasa visceral.',
      };
    }
    if (waistCm <= 102) {
      return {
        status: 'Riesgo Cardiovascular Moderado',
        color: '#fbbf24',
        ratio,
        recommendation: 'Perímetro ligeramente elevado (>94 cm). Enfócate en entrenamiento aeróbico.',
      };
    }
    return {
      status: 'Riesgo Cardiovascular Aumentado',
      color: '#ef4444',
      ratio,
      recommendation: 'Perímetro > 102 cm. Recomendado reducir grasa visceral con nutrición y déficit moderado.',
    };
  } else {
    // Mujer
    if (waistCm < 80) {
      return {
        status: 'Cintura Saludable (Riesgo Bajo)',
        color: '#38ef7d',
        ratio,
        recommendation: 'Excelente perímetro abdominal. Mantiene un perfil metabólico favorable.',
      };
    }
    if (waistCm <= 88) {
      return {
        status: 'Riesgo Cardiovascular Moderado',
        color: '#fbbf24',
        ratio,
        recommendation: 'Perímetro entre 80-88 cm. Un balance de fuerza y cardio ayudará a reducirlo.',
      };
    }
    return {
      status: 'Riesgo Cardiovascular Aumentado',
      color: '#ef4444',
      ratio,
      recommendation: 'Perímetro > 88 cm. Se aconseja seguimiento nutricional y actividad constante.',
    };
  }
}

/**
 * Generate seed weight logs for realistic 30-day initial preview
 */
export function generateSeedWeightLogs(baseWeight: number = 74.5, targetWeight: number = 70.0): WeightLogEntry[] {
  const entries: WeightLogEntry[] = [];
  const today = new Date();
  
  // 24 logged days over the last 30 days
  const dayOffsets = [
    28, 27, 25, 24, 22, 21, 20, 18, 17, 15, 14, 13, 11, 10, 8, 7, 6, 5, 4, 3, 2, 1, 0
  ];

  dayOffsets.forEach((offset, idx) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offset);
    const dateStr = d.toISOString().split('T')[0];

    // Gradual progression from baseWeight + 2.2 kg down towards baseWeight with natural daily micro-fluctuations
    const progressFactor = (dayOffsets.length - 1 - idx) / (dayOffsets.length - 1);
    const trendWeight = baseWeight + (progressFactor * 2.0);
    // Add small realistic fluctuation (-0.3 to +0.3 kg)
    const jitter = Math.sin(idx * 1.7) * 0.25;
    const computedWeight = Number((trendWeight + jitter).toFixed(1));

    entries.push({
      id: `weight-seed-${idx + 1}`,
      date: dateStr,
      weight: computedWeight,
      waist: Number((84 - ((1 - progressFactor) * 2) + Math.cos(idx) * 0.4).toFixed(1)),
      bodyFat: Number((18.5 - ((1 - progressFactor) * 1.2)).toFixed(1)),
      notes: idx === 0 
        ? 'Inicio de seguimiento' 
        : idx === 10 
        ? 'Excelente semana de cardio y pesas' 
        : idx === dayOffsets.length - 1 
        ? 'Pesaje matutino en ayunas' 
        : undefined,
      createdAt: d.toISOString(),
    });
  });

  return entries.sort((a, b) => a.date.localeCompare(b.date));
}

export const INITIAL_HEALTH_PROFILE: HealthProfile = {
  id: 'default-profile-1',
  gender: 'hombre',
  age: 28,
  height: 175,
  currentWeight: 74.5,
  waistCircumference: 82,
  targetWeight: 70.0,
  activityLevel: 'moderado',
  updatedAt: new Date().toISOString(),
};

// -------------------------------------------------------------
// NUTRITION & ENERGY DEFICIT / SURPLUS CALCULATORS
// -------------------------------------------------------------

import { DailyCalorieLog, MealItem } from '../types';

/**
 * Calculates estimated calories burned from step count based on weight
 * Average: ~0.04 - 0.05 kcal per step adjusted for body mass
 */
export function calculateStepCalories(steps: number, weightKg: number = 70): number {
  if (!steps || steps <= 0) return 0;
  // Baseline ~0.043 kcal per step for a 70kg person, scales with weight
  const weightFactor = weightKg / 70;
  const burned = steps * 0.043 * weightFactor;
  return Math.round(burned);
}

/**
 * Evaluates net calorie balance and status
 */
export function calculateDailyEnergyBalance(
  caloriesConsumed: number,
  bmr: number,
  stepsCaloriesBurned: number,
  exerciseCaloriesBurned: number
): {
  totalExpenditure: number;
  netBalance: number; // Negative = deficit, Positive = surplus
  status: 'deficit' | 'mantenimiento' | 'superavit';
  statusLabel: string;
  statusBadgeColor: string;
  weeklyWeightChangeKg: number; // e.g. -0.45 kg
  monthlyWeightChangeKg: number; // e.g. -1.9 kg
  explanation: string;
} {
  const totalExpenditure = Math.round(bmr + stepsCaloriesBurned + exerciseCaloriesBurned);
  const netBalance = Math.round(caloriesConsumed - totalExpenditure);

  // 1 kg of fat mass ~= 7,700 kcal
  const weeklyWeightChangeKg = Number(((netBalance * 7) / 7700).toFixed(2));
  const monthlyWeightChangeKg = Number(((netBalance * 30) / 7700).toFixed(2));

  if (netBalance < -100) {
    const deficitAbs = Math.abs(netBalance);
    let intensity = 'moderado y saludable';
    if (deficitAbs > 900) intensity = 'alto (cuidado con la pérdida de masa muscular)';
    else if (deficitAbs < 350) intensity = 'ligero y muy sostenible';

    return {
      totalExpenditure,
      netBalance,
      status: 'deficit',
      statusLabel: `Déficit Calórico (-${deficitAbs} kcal) • Bajando de peso 🔥`,
      statusBadgeColor: '#10b981',
      weeklyWeightChangeKg,
      monthlyWeightChangeKg,
      explanation: `Estás consumiendo menos de lo que gastas (${caloriesConsumed} vs ${totalExpenditure} kcal). Tu cuerpo oxida reservas grasas con un ritmo proyectado de ${Math.abs(weeklyWeightChangeKg)} kg/semana (${intensity}).`,
    };
  }

  if (netBalance > 100) {
    const surplusAbs = netBalance;
    return {
      totalExpenditure,
      netBalance,
      status: 'superavit',
      statusLabel: `Superávit Calórico (+${surplusAbs} kcal) • Subiendo de peso 📈`,
      statusBadgeColor: '#f59e0b',
      weeklyWeightChangeKg,
      monthlyWeightChangeKg,
      explanation: `Estás consumiendo más de lo que tu cuerpo gasta (${caloriesConsumed} vs ${totalExpenditure} kcal). Ritmo estimado de ganancia de peso: +${weeklyWeightChangeKg} kg/semana (ideal para volumen muscular si entrenas fuerza).`,
    };
  }

  return {
    totalExpenditure,
    netBalance,
    status: 'mantenimiento',
    statusLabel: `Mantenimiento Energético (±${Math.abs(netBalance)} kcal) • Peso Estable ⚖️`,
    statusBadgeColor: '#38bdf8',
    weeklyWeightChangeKg: 0,
    monthlyWeightChangeKg: 0,
    explanation: `Tu ingesta calórica (${caloriesConsumed} kcal) está en perfecto equilibrio con tu gasto metabólico (${totalExpenditure} kcal). Tu peso corporal se mantendrá estable.`,
  };
}

/**
 * Calculates projection timeline to reach target weight
 */
export function calculateWeightProjectionGoal(
  currentWeight: number,
  targetWeight: number,
  dailyNetDeficitOrSurplus: number
): {
  direction: 'bajar' | 'subir' | 'alcanzado';
  diffKg: number;
  estimatedWeeks: number;
  estimatedDays: number;
  estimatedDateStr: string;
  isFeasible: boolean;
  message: string;
} {
  const diffKg = Number(Math.abs(currentWeight - targetWeight).toFixed(1));

  if (diffKg < 0.2) {
    return {
      direction: 'alcanzado',
      diffKg: 0,
      estimatedWeeks: 0,
      estimatedDays: 0,
      estimatedDateStr: '¡Hoy mismo!',
      isFeasible: true,
      message: '¡Felicitaciones! Has alcanzado tu peso objetivo.',
    };
  }

  const isLosingWeight = currentWeight > targetWeight;
  const direction = isLosingWeight ? 'bajar' : 'subir';

  // If wanting to lose weight but in surplus (or vice versa), time cannot be calculated
  if (isLosingWeight && dailyNetDeficitOrSurplus >= 0) {
    return {
      direction,
      diffKg,
      estimatedWeeks: 0,
      estimatedDays: 0,
      estimatedDateStr: 'Sin proyección (en superávit)',
      isFeasible: false,
      message: `Para bajar los ${diffKg} kg hacia tu meta de ${targetWeight} kg necesitas generar un déficit calórico diario (gastar más calorías de las que consumes).`,
    };
  }

  if (!isLosingWeight && dailyNetDeficitOrSurplus <= 0) {
    return {
      direction,
      diffKg,
      estimatedWeeks: 0,
      estimatedDays: 0,
      estimatedDateStr: 'Sin proyección (en déficit)',
      isFeasible: false,
      message: `Para subir los ${diffKg} kg hacia tu meta de ${targetWeight} kg necesitas un superávit calórico controlado.`,
    };
  }

  const dailyChangeKg = Math.abs((dailyNetDeficitOrSurplus * 1) / 7700);
  const estimatedDays = Math.max(1, Math.round(diffKg / dailyChangeKg));
  const estimatedWeeks = Number((estimatedDays / 7).toFixed(1));

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + estimatedDays);
  const estimatedDateStr = targetDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return {
    direction,
    diffKg,
    estimatedWeeks,
    estimatedDays,
    estimatedDateStr,
    isFeasible: true,
    message: `A este ritmo de ${dailyNetDeficitOrSurplus < 0 ? 'déficit' : 'superávit'} (${Math.abs(dailyNetDeficitOrSurplus)} kcal/día), alcanzarás tu peso objetivo de ${targetWeight} kg en aproximadamente ${estimatedWeeks} semanas (${estimatedDateStr}).`,
  };
}

/**
 * Common quick-add meal presets library for Colombian & international healthy nutrition
 */
export const POPULAR_FOOD_PRESETS: {
  category: 'desayuno' | 'almuerzo' | 'cena' | 'snack';
  name: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  portion: string;
}[] = [
  // Desayunos
  { category: 'desayuno', name: 'Huevos revueltos (2) con arepa y queso blanco', calories: 340, proteinGrams: 18, carbsGrams: 28, fatsGrams: 16, portion: '1 plato' },
  { category: 'desayuno', name: 'Omelette de claras con espinaca y tostada integral', calories: 250, proteinGrams: 22, carbsGrams: 24, fatsGrams: 6, portion: '1 plato' },
  { category: 'desayuno', name: 'Bowl de avena en hojuelas con leche, banano y canela', calories: 360, proteinGrams: 14, carbsGrams: 62, fatsGrams: 6, portion: '1 bowl' },
  { category: 'desayuno', name: 'Yogurt griego con granola y frutos rojos', calories: 280, proteinGrams: 20, carbsGrams: 35, fatsGrams: 5, portion: '200g' },
  { category: 'desayuno', name: 'Pancakes de avena y proteína con miel', calories: 380, proteinGrams: 26, carbsGrams: 50, fatsGrams: 7, portion: '3 unidades' },
  { category: 'desayuno', name: 'Café negro o americano sin azúcar', calories: 5, proteinGrams: 0, carbsGrams: 1, fatsGrams: 0, portion: '1 taza' },
  { category: 'desayuno', name: 'Café con leche descremada', calories: 75, proteinGrams: 5, carbsGrams: 8, fatsGrams: 2, portion: '1 taza' },

  // Almuerzos
  { category: 'almuerzo', name: 'Pechuga de pollo a la plancha (180g) con arroz y ensalada', calories: 540, proteinGrams: 42, carbsGrams: 52, fatsGrams: 12, portion: '1 plato balanceado' },
  { category: 'almuerzo', name: 'Carne magra a la parrilla (180g) con papa cocida y aguacate', calories: 590, proteinGrams: 45, carbsGrams: 40, fatsGrams: 22, portion: '1 plato' },
  { category: 'almuerzo', name: 'Filete de salmón o pescado blanco con quinoa y verduras', calories: 510, proteinGrams: 38, carbsGrams: 38, fatsGrams: 20, portion: '1 plato' },
  { category: 'almuerzo', name: 'Bowl de pollo, frijoles negros, arroz integral y pico de gallo', calories: 580, proteinGrams: 40, carbsGrams: 68, fatsGrams: 14, portion: '1 bowl grande' },
  { category: 'almuerzo', name: 'Pasta integral con carne molida magra y salsa de tomate casera', calories: 560, proteinGrams: 36, carbsGrams: 65, fatsGrams: 14, portion: '1 plato' },
  { category: 'almuerzo', name: 'Sancocho de pollo o sopa casera ligera con porción pequeña', calories: 420, proteinGrams: 28, carbsGrams: 48, fatsGrams: 11, portion: '1 tazón' },

  // Cenas
  { category: 'cena', name: 'Ensalada césar ligera con pechuga desmechada y aderezo yogurt', calories: 380, proteinGrams: 34, carbsGrams: 14, fatsGrams: 16, portion: '1 ensaladera' },
  { category: 'cena', name: 'Wrap de tortilla integral con atún en agua, lechuga y tomate', calories: 320, proteinGrams: 28, carbsGrams: 30, fatsGrams: 7, portion: '1 wrap' },
  { category: 'cena', name: 'Crema de verduras casera con dados de queso fresco', calories: 230, proteinGrams: 10, carbsGrams: 26, fatsGrams: 8, portion: '1 plato hondo' },
  { category: 'cena', name: 'Huevos cocidos (2) con rodajas de tomate y aguacate', calories: 260, proteinGrams: 14, carbsGrams: 8, fatsGrams: 19, portion: '1 plato ligero' },
  { category: 'cena', name: 'Salmón o tilapia con espárragos y brócoli al vapor', calories: 360, proteinGrams: 35, carbsGrams: 10, fatsGrams: 16, portion: '1 plato' },

  // Snacks & Adicionales
  { category: 'snack', name: 'Batido de proteína de suero (Whey protein con agua)', calories: 130, proteinGrams: 25, carbsGrams: 3, fatsGrams: 2, portion: '1 scoop (30g)' },
  { category: 'snack', name: 'Manzana verde o fruta fresca entera', calories: 80, proteinGrams: 0, carbsGrams: 21, fatsGrams: 0, portion: '1 unidad mediana' },
  { category: 'snack', name: 'Puñado de frutos secos (almendras/nueces)', calories: 170, proteinGrams: 6, carbsGrams: 6, fatsGrams: 15, portion: '30g' },
  { category: 'snack', name: 'Barra de proteína nutritiva', calories: 200, proteinGrams: 20, carbsGrams: 22, fatsGrams: 6, portion: '1 barra (60g)' },
  { category: 'snack', name: 'Tostada de arroz inflado con mantequilla de maní', calories: 140, proteinGrams: 5, carbsGrams: 15, fatsGrams: 8, portion: '1 tostada' },
  { category: 'snack', name: 'Gelatina light sin azúcar', calories: 15, proteinGrams: 2, carbsGrams: 1, fatsGrams: 0, portion: '1 porción' },
];

/**
 * Generate seed daily calorie logs for rich immediate visualization
 */
export function generateSeedCalorieLogs(bmr: number = 1720, baseWeight: number = 74.5): DailyCalorieLog[] {
  const today = new Date();
  const logs: DailyCalorieLog[] = [];

  const offsets = [6, 5, 4, 3, 2, 1, 0];

  const presetsByDay = [
    {
      offset: 6,
      breakfast: [
        { id: 'm-1-1', name: 'Huevos revueltos (2) con arepa y queso blanco', calories: 340, portion: '1 plato' },
        { id: 'm-1-2', name: 'Café negro sin azúcar', calories: 5, portion: '1 taza' }
      ],
      lunch: [
        { id: 'm-1-3', name: 'Pechuga a la plancha (180g) con arroz y ensalada', calories: 540, portion: '1 plato' }
      ],
      dinner: [
        { id: 'm-1-4', name: 'Wrap integral con atún en agua y verduras', calories: 320, portion: '1 wrap' }
      ],
      snacks: [
        { id: 'm-1-5', name: 'Batido de proteína con agua', calories: 130, portion: '1 scoop' },
        { id: 'm-1-6', name: 'Manzana verde', calories: 80, portion: '1 unidad' }
      ],
      steps: 8400,
      exerciseCalories: 360,
      exerciseNotes: '45 min gimnasio pesas (tren superior)',
      sleepHours: 7.5,
      sleepQuality: 'excelente' as const,
      waterGlasses: 8,
    },
    {
      offset: 5,
      breakfast: [
        { id: 'm-2-1', name: 'Bowl de avena con leche, banano y canela', calories: 360, portion: '1 bowl' }
      ],
      lunch: [
        { id: 'm-2-2', name: 'Bowl de pollo, frijoles negros y pico de gallo', calories: 580, portion: '1 bowl' }
      ],
      dinner: [
        { id: 'm-2-3', name: 'Ensalada con pechuga desmechada y queso fresco', calories: 350, portion: '1 plato' }
      ],
      snacks: [
        { id: 'm-2-4', name: 'Puñado de almendras (30g)', calories: 170, portion: '30g' }
      ],
      steps: 10200,
      exerciseCalories: 450,
      exerciseNotes: '5K Running al aire libre + estiramientos',
      sleepHours: 8.0,
      sleepQuality: 'excelente' as const,
      waterGlasses: 10,
    },
    {
      offset: 4,
      breakfast: [
        { id: 'm-3-1', name: 'Omelette de claras con espinaca y tostada integral', calories: 250, portion: '1 plato' },
        { id: 'm-3-2', name: 'Café con leche descremada', calories: 75, portion: '1 taza' }
      ],
      lunch: [
        { id: 'm-3-3', name: 'Carne magra a la parrilla con papa y aguacate', calories: 590, portion: '1 plato' }
      ],
      dinner: [
        { id: 'm-3-4', name: 'Crema de verduras casera con queso', calories: 230, portion: '1 plato' }
      ],
      snacks: [
        { id: 'm-3-5', name: 'Barra de proteína nutritiva', calories: 200, portion: '1 barra' },
        { id: 'm-3-6', name: 'Tostada de arroz con mantequilla de maní', calories: 140, portion: '1 unidad' }
      ],
      steps: 7200,
      exerciseCalories: 300,
      exerciseNotes: '40 min rutina de fuerza core + piernas',
      sleepHours: 7.0,
      sleepQuality: 'bueno' as const,
      waterGlasses: 8,
    },
    {
      offset: 3,
      breakfast: [
        { id: 'm-4-1', name: 'Yogurt griego con granola y frutos rojos', calories: 280, portion: '200g' }
      ],
      lunch: [
        { id: 'm-4-2', name: 'Filete de salmón con quinoa y brócoli', calories: 510, portion: '1 plato' }
      ],
      dinner: [
        { id: 'm-4-3', name: 'Huevos cocidos (2) con rodajas de tomate y aguacate', calories: 260, portion: '1 plato' }
      ],
      snacks: [
        { id: 'm-4-4', name: 'Batido de proteína Whey', calories: 130, portion: '1 scoop' },
        { id: 'm-4-5', name: 'Manzana verde', calories: 80, portion: '1 unidad' }
      ],
      steps: 9100,
      exerciseCalories: 380,
      exerciseNotes: '45 min entrenamiento funcional HIIT',
      sleepHours: 7.5,
      sleepQuality: 'bueno' as const,
      waterGlasses: 9,
    },
    {
      offset: 2,
      breakfast: [
        { id: 'm-5-1', name: 'Pancakes de avena y proteína con miel', calories: 380, portion: '3 unidades' },
        { id: 'm-5-2', name: 'Café americano', calories: 5, portion: '1 taza' }
      ],
      lunch: [
        { id: 'm-5-3', name: 'Pasta integral con carne molida magra', calories: 560, portion: '1 plato' }
      ],
      dinner: [
        { id: 'm-5-4', name: 'Ensalada fresca de atún y verduras mixtas', calories: 330, portion: '1 plato' }
      ],
      snacks: [
        { id: 'm-5-5', name: 'Puñado de nueces mixtas', calories: 180, portion: '30g' }
      ],
      steps: 8800,
      exerciseCalories: 350,
      exerciseNotes: '50 min pesas espalda y bíceps',
      sleepHours: 8.2,
      sleepQuality: 'excelente' as const,
      waterGlasses: 8,
    },
    {
      offset: 1,
      breakfast: [
        { id: 'm-6-1', name: 'Huevos revueltos con arepa y queso', calories: 340, portion: '1 plato' },
        { id: 'm-6-2', name: 'Café con leche', calories: 75, portion: '1 taza' }
      ],
      lunch: [
        { id: 'm-6-3', name: 'Pechuga a la plancha con arroz y aguacate', calories: 550, portion: '1 plato' }
      ],
      dinner: [
        { id: 'm-6-4', name: 'Wrap de atún con verduras crujientes', calories: 310, portion: '1 wrap' }
      ],
      snacks: [
        { id: 'm-6-5', name: 'Batido de proteína con agua', calories: 130, portion: '1 scoop' },
        { id: 'm-6-6', name: 'Fruta fresca en rodajas', calories: 90, portion: '1 plato pequeño' }
      ],
      steps: 11000,
      exerciseCalories: 480,
      exerciseNotes: '6K Carrera continua + 15 min caminata',
      sleepHours: 7.8,
      sleepQuality: 'excelente' as const,
      waterGlasses: 10,
    },
    {
      offset: 0, // Hoy
      breakfast: [
        { id: 'm-7-1', name: 'Huevos revueltos (2) con arepa y queso blanco', calories: 340, portion: '1 plato' },
        { id: 'm-7-2', name: 'Café negro sin azúcar', calories: 5, portion: '1 taza' }
      ],
      lunch: [
        { id: 'm-7-3', name: 'Pechuga de pollo a la plancha (180g) con arroz y ensalada', calories: 540, portion: '1 plato' }
      ],
      dinner: [
        { id: 'm-7-4', name: 'Wrap de atún en agua con vegetales y aguacate', calories: 340, portion: '1 wrap' }
      ],
      snacks: [
        { id: 'm-7-5', name: 'Batido de proteína Whey', calories: 130, portion: '1 scoop' },
        { id: 'm-7-6', name: 'Manzana verde con una cucharadita de canela', calories: 85, portion: '1 unidad' }
      ],
      steps: 9400,
      exerciseCalories: 380,
      exerciseNotes: '45 min rutina de fuerza + estiramiento de tren inferior',
      sleepHours: 7.5,
      sleepQuality: 'excelente' as const,
      waterGlasses: 8,
    }
  ];

  presetsByDay.forEach(day => {
    const d = new Date(today);
    d.setDate(d.getDate() - day.offset);
    const dateStr = d.toISOString().split('T')[0];

    const breakfastTotal = day.breakfast.reduce((sum, item) => sum + item.calories, 0);
    const lunchTotal = day.lunch.reduce((sum, item) => sum + item.calories, 0);
    const dinnerTotal = day.dinner.reduce((sum, item) => sum + item.calories, 0);
    const snacksTotal = day.snacks.reduce((sum, item) => sum + item.calories, 0);
    const totalConsumed = breakfastTotal + lunchTotal + dinnerTotal + snacksTotal;

    const stepsCalories = calculateStepCalories(day.steps, baseWeight);
    const totalExpenditure = bmr + stepsCalories + day.exerciseCalories;
    const netBalance = totalConsumed - totalExpenditure;
    const balanceStatus = netBalance < -100 ? 'deficit' : netBalance > 100 ? 'superavit' : 'mantenimiento';

    logs.push({
      id: `calorie-log-${dateStr}`,
      date: dateStr,
      breakfast: {
        items: day.breakfast,
        totalCalories: breakfastTotal,
      },
      lunch: {
        items: day.lunch,
        totalCalories: lunchTotal,
      },
      dinner: {
        items: day.dinner,
        totalCalories: dinnerTotal,
      },
      snacks: {
        items: day.snacks,
        totalCalories: snacksTotal,
      },
      totalCaloriesConsumed: totalConsumed,
      steps: day.steps,
      stepsCaloriesBurned: stepsCalories,
      exerciseCaloriesBurned: day.exerciseCalories,
      exerciseNotes: day.exerciseNotes,
      sleepHours: day.sleepHours,
      sleepQuality: day.sleepQuality,
      waterGlasses: day.waterGlasses,
      bmrSnapshot: bmr,
      totalEnergyExpenditure: totalExpenditure,
      netCalorieBalance: netBalance,
      balanceStatus,
      createdAt: d.toISOString(),
      updatedAt: d.toISOString(),
    });
  });

  return logs.sort((a, b) => b.date.localeCompare(a.date));
}

