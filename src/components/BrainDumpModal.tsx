import React, { useState, useEffect } from 'react';
import { CategoryInfo, IdeaItem, Task, IdeaType } from '../types';
import { useTheme } from '../context/ThemeContext';
import { 
  Brain, 
  Sparkles, 
  X, 
  Check, 
  ArrowRight, 
  Trash2, 
  Calendar, 
  Clock, 
  Lightbulb, 
  Layers, 
  Bot, 
  Loader2, 
  AlertCircle,
  FolderCheck
} from 'lucide-react';

export interface BrainDumpItem {
  id: string;
  rawText: string;
  title: string;
  description: string;
  categoryId: string;
  type: IdeaType | string;
  isDirectTask: boolean;
  assignedDate?: string;
  timeSlot?: string;
  estimatedHours?: number;
  priority?: 'baja' | 'media' | 'alta' | 'urgente';
  finalGoal?: string;
  selected: boolean;
}

interface BrainDumpModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryInfo[];
  onAddIdeas: (ideas: Omit<IdeaItem, 'id' | 'createdAt'>[]) => void;
  onAddTasks?: (tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
}

// Deterministic Spanish category and area classifier
function detectClientSpanishCategory(text: string): { categoryId: string; type: string; finalGoal: string } {
  const lower = text.toLowerCase();

  // 1. Ocio & Entretenimiento (Series, Programas TV, Películas, Cine, Streaming, Videojuegos, Anime)
  if (
    lower.includes('serie') ||
    lower.includes('series') ||
    lower.includes('capitul') ||
    lower.includes('temporada') ||
    lower.includes('episodio') ||
    lower.includes('pelicul') ||
    lower.includes('películ') ||
    lower.includes('cine') ||
    lower.includes('film') ||
    lower.includes('estreno') ||
    lower.includes('documental') ||
    lower.includes('netflix') ||
    lower.includes('apple tv') ||
    lower.includes('prime video') ||
    lower.includes('disney') ||
    lower.includes('hbo') ||
    lower.includes('max') ||
    lower.includes('crunchyroll') ||
    lower.includes('paramount') ||
    lower.includes('streaming') ||
    lower.includes('programa de tv') ||
    lower.includes('programas de tv') ||
    lower.includes('television') ||
    lower.includes('televisión') ||
    lower.includes('videojueg') ||
    lower.includes('video juego') ||
    lower.includes('jugar') ||
    lower.includes('gamer') ||
    lower.includes('gaming') ||
    lower.includes('playstation') ||
    lower.includes('ps5') ||
    lower.includes('ps4') ||
    lower.includes('xbox') ||
    lower.includes('nintendo') ||
    lower.includes('switch') ||
    lower.includes('steam') ||
    lower.includes('anime') ||
    lower.includes('manga') ||
    lower.includes('hobby') ||
    lower.includes('concierto') ||
    lower.includes('fiesta') ||
    lower.includes('teatro') ||
    lower.includes('oppenheimer')
  ) {
    let subType = 'ocio';
    let goal = 'Disfrutar tiempo de descanso, series y entretenimiento';
    if (lower.includes('serie') || lower.includes('capitul') || lower.includes('temporada') || lower.includes('episodio') || lower.includes('apple tv') || lower.includes('netflix') || lower.includes('hbo') || lower.includes('anime')) {
      subType = 'serie';
      goal = 'Ver capítulos y disfrutar de la serie';
    } else if (lower.includes('pelicul') || lower.includes('cine') || lower.includes('film')) {
      subType = 'pelicula';
      goal = 'Ver película y disfrutar del cine';
    } else if (lower.includes('videojueg') || lower.includes('video juego') || lower.includes('playstation') || lower.includes('xbox') || lower.includes('nintendo') || lower.includes('switch') || lower.includes('steam')) {
      subType = 'videojuego';
      goal = 'Avanzar y disfrutar videojuego';
    }

    return {
      categoryId: 'ocio_entretenimiento',
      type: subType,
      finalGoal: goal
    };
  }

  // 2. Salud & Deporte (Running, workouts, gym, pushups, health, doctors)
  if (
    lower.includes('corr') || // correr, corriendo, corrí, carrera
    lower.includes('trot') || // trotar, trote
    lower.includes('run') || // running
    lower.includes('camin') || // caminar, caminata
    lower.includes('gym') ||
    lower.includes('gimnasio') ||
    lower.includes('pesa') ||
    lower.includes('flexion') || // flexiones, flexión
    lower.includes('pechada') ||
    lower.includes('sentadilla') ||
    lower.includes('abdominal') ||
    lower.includes('cardio') ||
    lower.includes('natacion') ||
    lower.includes('natación') ||
    lower.includes('nadar') ||
    lower.includes('bici') ||
    lower.includes('ciclism') ||
    lower.includes('pedalear') ||
    lower.includes('ejercicio') ||
    lower.includes('entren') || // entrenar, entrenamiento
    lower.includes('crossfit') ||
    lower.includes('calistenia') ||
    lower.includes('estiramient') ||
    lower.includes('yoga') ||
    lower.includes('dieta') ||
    lower.includes('nutrici') ||
    lower.includes('proteina') ||
    lower.includes('proteína') ||
    lower.includes('calorias') ||
    lower.includes('calorías') ||
    lower.includes('medico') ||
    lower.includes('médico') ||
    lower.includes('doctor') ||
    lower.includes('dentista') ||
    lower.includes('odontolog') ||
    lower.includes('chequeo') ||
    lower.includes('analisis de sangre')
  ) {
    return {
      categoryId: 'salud_deporte',
      type: lower.includes('corr') || lower.includes('flexion') || lower.includes('gym') || lower.includes('entren') ? 'rutina_deportiva' : 'salud',
      finalGoal: 'Mejorar condición física y salud'
    };
  }

  // 2. Vehículos & Garaje (Cars, bikes, oil, mechanics, tires, brakes)
  if (
    lower.includes('carro') ||
    lower.includes('auto') ||
    lower.includes('coche') ||
    lower.includes('moto') ||
    lower.includes('vehicul') ||
    lower.includes('vehícul') ||
    lower.includes('camioneta') ||
    lower.includes('aceite') ||
    lower.includes('llanta') ||
    lower.includes('freno') ||
    lower.includes('pastilla') ||
    lower.includes('filtro') ||
    lower.includes('motor') ||
    lower.includes('odometro') ||
    lower.includes('odómetro') ||
    lower.includes('kilometraje') ||
    lower.includes('bateria') ||
    lower.includes('batería') ||
    lower.includes('mecanic') ||
    lower.includes('mecánic') ||
    lower.includes('taller') ||
    lower.includes('soat') ||
    lower.includes('seguro de auto') ||
    lower.includes('gasolina') ||
    lower.includes('combustible') ||
    lower.includes('alineacion') ||
    lower.includes('balanceo')
  ) {
    return {
      categoryId: 'vehiculos',
      type: lower.includes('aceite') ? 'cambio_aceite' : 'mantenimiento_preventivo',
      finalGoal: 'Mantener vehículo en óptimas condiciones mecánicas'
    };
  }

  // 3. Aprendizaje & Habilidades
  if (
    lower.includes('estudi') ||
    lower.includes('curso') ||
    lower.includes('aprender') ||
    lower.includes('aprend') ||
    lower.includes('libro') ||
    lower.includes('leer') ||
    lower.includes('lectura') ||
    lower.includes('program') ||
    lower.includes('codigo') ||
    lower.includes('código') ||
    lower.includes('python') ||
    lower.includes('javascript') ||
    lower.includes('typescript') ||
    lower.includes('docker') ||
    lower.includes('react') ||
    lower.includes('ingles') ||
    lower.includes('inglés') ||
    lower.includes('idioma') ||
    lower.includes('clase') ||
    lower.includes('examen') ||
    lower.includes('tutorial') ||
    lower.includes('certifica') ||
    lower.includes('bootcamp')
  ) {
    return {
      categoryId: 'aprendizaje_habilidades',
      type: 'estudio_aprendizaje',
      finalGoal: 'Desarrollar nuevas habilidades y conocimiento'
    };
  }

  // 4. Finanzas & Hogar
  if (
    lower.includes('pagar') ||
    lower.includes('pago') ||
    lower.includes('factura') ||
    lower.includes('recibo') ||
    lower.includes('banco') ||
    lower.includes('tarjeta') ||
    lower.includes('dinero') ||
    lower.includes('presupuesto') ||
    lower.includes('ahorr') ||
    lower.includes('cuenta') ||
    lower.includes('transferencia') ||
    lower.includes('arriendo') ||
    lower.includes('alquiler') ||
    lower.includes('invers') ||
    lower.includes('cripto') ||
    lower.includes('deuda')
  ) {
    return {
      categoryId: 'finanzas_hogar',
      type: 'pago_finanzas',
      finalGoal: 'Mantener finanzas y servicios al día'
    };
  }

  // 6. Bienestar & Mente
  if (
    lower.includes('medit') ||
    lower.includes('respiraci') ||
    lower.includes('dormir') ||
    lower.includes('descans') ||
    lower.includes('paz') ||
    lower.includes('journal') ||
    lower.includes('psicolog') ||
    lower.includes('psicólog') ||
    lower.includes('terapia') ||
    lower.includes('relaj')
  ) {
    return {
      categoryId: 'bienestar_mente',
      type: 'bienestar',
      finalGoal: 'Cultivar serenidad y claridad mental'
    };
  }

  // 7. Familia & Relaciones
  if (
    lower.includes('mama') ||
    lower.includes('mamá') ||
    lower.includes('papa') ||
    lower.includes('papá') ||
    lower.includes('hijo') ||
    lower.includes('esposa') ||
    lower.includes('novia') ||
    lower.includes('pareja') ||
    lower.includes('familia') ||
    lower.includes('amigo') ||
    lower.includes('cumpleaños') ||
    lower.includes('visita')
  ) {
    return {
      categoryId: 'familia_relaciones',
      type: 'familia',
      finalGoal: 'Fortalecer vínculos familiares y personales'
    };
  }

  // Default: Actividades Pendientes
  return {
    categoryId: 'actividades_pendientes',
    type: lower.includes('compr') || lower.includes('pedido') || lower.includes('filamento') ? 'compra' : 'pendiente',
    finalGoal: 'Completar actividad pendiente'
  };
}

// Client-side date and time extractor in Spanish
function extractClientDateTime(text: string): { timeSlot?: string; assignedDate?: string; isDirectTask?: boolean; estimatedHours?: number } {
  const lower = text.toLowerCase();
  const todayISO = new Date().toISOString().split('T')[0];
  const tomorrowISO = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  let timeSlot: string | undefined = undefined;
  let assignedDate: string | undefined = undefined;
  let isDirectTask = false;
  let estimatedHours = 1;

  if (lower.includes('30 min') || lower.includes('media hora')) {
    estimatedHours = 0.5;
  } else if (lower.includes('2 hora') || lower.includes('dos hora')) {
    estimatedHours = 2;
  } else if (lower.includes('1.5 hora') || lower.includes('hora y media')) {
    estimatedHours = 1.5;
  } else if (lower.includes('1 hora') || lower.includes('una hora')) {
    estimatedHours = 1;
  }

  if (lower.includes('pasado mañana') || lower.includes('pasado manana')) {
    const d = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    assignedDate = d.toISOString().split('T')[0];
    isDirectTask = true;
  } else if (lower.includes('mañana') || lower.includes('manana')) {
    assignedDate = tomorrowISO;
    isDirectTask = true;
  } else if (lower.includes('hoy') || lower.includes('todos los dias') || lower.includes('todos los días') || lower.includes('cada día') || lower.includes('cada dia') || lower.includes('cada noche') || lower.includes('cada mañana')) {
    assignedDate = todayISO;
    isDirectTask = true;
  }

  const wordMap: Record<string, number> = {
    'una': 1, 'uno': 1, '1': 1,
    'dos': 2, '2': 2,
    'tres': 3, '3': 3,
    'cuatro': 4, '4': 4,
    'cinco': 5, '5': 5,
    'seis': 6, '6': 6,
    'siete': 7, '7': 7,
    'ocho': 8, '8': 8,
    'nueve': 9, '9': 9,
    'diez': 10, '10': 10,
    'once': 11, '11': 11,
    'doce': 12, '12': 12,
  };

  const isGeneralPM = lower.includes('tarde') || lower.includes('noche') || lower.includes('pm') || lower.includes('p.m.');
  const isGeneralAM = lower.includes('de la mañana') || lower.includes('de la manana') || lower.includes('am') || lower.includes('a.m.');

  // Range Pattern: "de 7 a 8 pm", "de 7 a 8 de la noche"
  const rangePattern = /(?:de\s+)?(\d{1,2}|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce)\s*(?:a|hasta)\s*(\d{1,2}|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce)\s*(de\s+la\s+tarde|de\s+la\s+noche|de\s+la\s+mañana|pm|am)?/i;
  const rangeMatch = lower.match(rangePattern);
  if (rangeMatch) {
    isDirectTask = true;
    if (!assignedDate) assignedDate = todayISO;
    const rawStart = rangeMatch[1].toLowerCase();
    let startHour = wordMap[rawStart] !== undefined ? wordMap[rawStart] : parseInt(rawStart, 10);
    const mod = (rangeMatch[3] || '').toLowerCase();
    const isModPM = mod.includes('tarde') || mod.includes('noche') || mod.includes('pm') || isGeneralPM;
    const isModAM = mod.includes('mañana') || mod.includes('manana') || mod.includes('am') || isGeneralAM;

    if (isModPM && !isModAM && startHour < 12) {
      startHour += 12;
    }
    timeSlot = `${String(startHour).padStart(2, '0')}:00`;
  }

  // Pattern 1: "a las 11 de la noche", "todos los días a las 11", "a las 4:30 pm"
  if (!timeSlot) {
    const pattern1 = /(?:a\s+las?|a\s+la|las?|a\s+eso\s+de\s+las?)\s*(\d{1,2}|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce)(?::(\d{2})|\s+y\s+(media|cuarto|\d{1,2}))?\s*(de\s+la\s+tarde|de\s+la\s+noche|de\s+la\s+mañana|de\s+la\s+manana|pm|am|p\.m\.|a\.m\.)?/i;
    const match1 = lower.match(pattern1);
    if (match1) {
      isDirectTask = true;
      if (!assignedDate) assignedDate = todayISO;
      const rawHour = match1[1].toLowerCase();
      let hour = wordMap[rawHour] !== undefined ? wordMap[rawHour] : parseInt(rawHour, 10);
      let minute = 0;

      if (match1[2]) {
        minute = parseInt(match1[2], 10);
      } else if (match1[3]) {
        if (match1[3] === 'media') minute = 30;
        else if (match1[3] === 'cuarto') minute = 15;
        else minute = parseInt(match1[3], 10) || 0;
      }

      const modifier = (match1[4] || '').toLowerCase();
      const isModifierPM = modifier.includes('tarde') || modifier.includes('noche') || modifier.includes('pm') || isGeneralPM;
      const isModifierAM = modifier.includes('mañana') || modifier.includes('manana') || modifier.includes('am') || isGeneralAM;

      if (isModifierPM && !isModifierAM && hour < 12) {
        hour += 12;
      } else if (isModifierAM && hour === 12) {
        hour = 0;
      }

      timeSlot = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
  }

  // Pattern 2: "11 pm", "16:00", "23:00"
  if (!timeSlot) {
    const pattern2 = /(\d{1,2})(?::(\d{2}))?\s*(pm|am|p\.m\.|a\.m\.|de\s+la\s+tarde|de\s+la\s+noche|de\s+la\s+mañana|de\s+la\s+manana)?/i;
    const match2 = lower.match(pattern2);
    if (match2 && (match2[3] || lower.includes('hora') || lower.includes('diario') || lower.includes('cada'))) {
      isDirectTask = true;
      if (!assignedDate) assignedDate = todayISO;
      let hour = parseInt(match2[1], 10);
      const minute = match2[2] ? parseInt(match2[2], 10) : 0;
      const mod = (match2[3] || '').toLowerCase();
      if ((mod.includes('tarde') || mod.includes('noche') || mod.includes('pm') || isGeneralPM) && !mod.includes('mañana') && !mod.includes('am') && hour < 12) {
        hour += 12;
      } else if ((mod.includes('mañana') || mod.includes('am')) && hour === 12) {
        hour = 0;
      }
      timeSlot = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
  }

  if (lower.includes('todos los dias') || lower.includes('todos los días') || lower.includes('cada día') || lower.includes('cada dia') || lower.includes('cada noche') || lower.includes('cada mañana') || lower.includes('rutina')) {
    isDirectTask = true;
    if (!assignedDate) assignedDate = todayISO;
    if (!timeSlot) {
      if (lower.includes('noche')) timeSlot = '23:00';
      else if (lower.includes('mañana') || lower.includes('manana')) timeSlot = '08:00';
      else timeSlot = '18:00';
    }
  }

  return { timeSlot, assignedDate, isDirectTask, estimatedHours };
}

export const BrainDumpModal: React.FC<BrainDumpModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddIdeas,
  onAddTasks,
}) => {
  const { isDark } = useTheme();
  const [rawInput, setRawInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedItems, setProcessedItems] = useState<BrainDumpItem[]>([]);
  const [step, setStep] = useState<'input' | 'review' | 'success'>('input');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summaryStats, setSummaryStats] = useState<{ ideasCount: number; tasksCount: number }>({ ideasCount: 0, tasksCount: 0 });

  useEffect(() => {
    if (isOpen) {
      setRawInput('');
      setProcessedItems([]);
      setStep('input');
      setErrorMessage(null);
      setIsProcessing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProcessDump = async () => {
    if (!rawInput.trim()) {
      setErrorMessage('Por favor escribe tus ideas, notas o pendientes antes de procesar.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/gemini/braindump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: rawInput }),
      });

      if (!response.ok) {
        throw new Error('No se pudo procesar con el servicio de IA.');
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.items) && data.items.length > 0) {
        const itemsWithSelection: BrainDumpItem[] = data.items.map((item: any, idx: number) => {
          const textContext = `${item.title || ''} ${item.description || ''} ${item.rawText || ''}`;
          const catInfo = detectClientSpanishCategory(textContext);
          const dtInfo = extractClientDateTime(textContext);

          const finalCatId = item.categoryId && item.categoryId !== 'actividades_pendientes' 
            ? item.categoryId 
            : (catInfo.categoryId || 'actividades_pendientes');

          const isTask = item.isDirectTask !== undefined ? Boolean(item.isDirectTask) : Boolean(dtInfo.isDirectTask);

          return {
            id: `dump-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
            rawText: item.rawText || '',
            title: item.title || 'Idea / Tarea',
            description: item.description || '',
            categoryId: finalCatId,
            type: item.type || catInfo.type,
            isDirectTask: isTask,
            assignedDate: isTask ? (item.assignedDate || dtInfo.assignedDate || new Date().toISOString().split('T')[0]) : undefined,
            timeSlot: isTask ? (item.timeSlot || dtInfo.timeSlot || '16:00') : undefined,
            estimatedHours: item.estimatedHours || dtInfo.estimatedHours || 1,
            priority: item.priority || 'media',
            finalGoal: item.finalGoal || catInfo.finalGoal,
            selected: true,
          };
        });

        setProcessedItems(itemsWithSelection);
        setStep('review');
      } else {
        // Fallback intelligent line by line splitting
        const lines = rawInput
          .split(/\n+|(?<=[.;])\s+/)
          .map(l => l.trim().replace(/^[-*•0-9.)\s]+/, ''))
          .filter(l => l.length > 2);

        if (lines.length === 0) {
          throw new Error('No se encontraron ideas claras en el texto.');
        }

        const fallbackItems: BrainDumpItem[] = lines.map((line, idx) => {
          const catInfo = detectClientSpanishCategory(line);
          const dtInfo = extractClientDateTime(line);
          const isTask = Boolean(dtInfo.isDirectTask);

          return {
            id: `dump-fallback-${Date.now()}-${idx}`,
            rawText: line,
            title: line.length > 60 ? line.substring(0, 60) + '...' : line,
            description: line,
            categoryId: catInfo.categoryId,
            type: catInfo.type,
            isDirectTask: isTask,
            assignedDate: isTask ? dtInfo.assignedDate : undefined,
            timeSlot: isTask ? dtInfo.timeSlot : undefined,
            estimatedHours: dtInfo.estimatedHours || 1,
            priority: 'media',
            finalGoal: catInfo.finalGoal,
            selected: true,
          };
        });

        setProcessedItems(fallbackItems);
        setStep('review');
      }
    } catch (err: any) {
      console.error('Error processing brain dump:', err);
      // Fallback splitting locally with full NLP so user never gets blocked
      const lines = rawInput
        .split(/\n+|(?<=[.;])\s+/)
        .map(l => l.trim().replace(/^[-*•0-9.)\s]+/, ''))
        .filter(l => l.length > 2);

      if (lines.length > 0) {
        const fallbackItems: BrainDumpItem[] = lines.map((line, idx) => {
          const catInfo = detectClientSpanishCategory(line);
          const dtInfo = extractClientDateTime(line);
          const isTask = Boolean(dtInfo.isDirectTask);

          return {
            id: `dump-fallback-${Date.now()}-${idx}`,
            rawText: line,
            title: line.length > 60 ? line.substring(0, 60) + '...' : line,
            description: line,
            categoryId: catInfo.categoryId,
            type: catInfo.type,
            isDirectTask: isTask,
            assignedDate: isTask ? dtInfo.assignedDate : undefined,
            timeSlot: isTask ? dtInfo.timeSlot : undefined,
            estimatedHours: dtInfo.estimatedHours || 1,
            priority: 'media',
            finalGoal: catInfo.finalGoal,
            selected: true,
          };
        });
        setProcessedItems(fallbackItems);
        setStep('review');
      } else {
        setErrorMessage('Ocurrió un inconveniente al clasificar. Intenta separando tus ideas con saltos de línea.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleItemSelection = (id: string) => {
    setProcessedItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  const handleUpdateItemCategory = (id: string, newCategoryId: string) => {
    setProcessedItems(prev => prev.map(item => item.id === id ? { ...item, categoryId: newCategoryId } : item));
  };

  const handleToggleItemTaskStatus = (id: string) => {
    setProcessedItems(prev => prev.map(item => item.id === id ? { ...item, isDirectTask: !item.isDirectTask } : item));
  };

  const handleUpdateItemTitle = (id: string, newTitle: string) => {
    setProcessedItems(prev => prev.map(item => item.id === id ? { ...item, title: newTitle } : item));
  };

  const handleDeleteItem = (id: string) => {
    setProcessedItems(prev => prev.filter(item => item.id !== id));
  };

  const handleConfirmAndSave = () => {
    const selectedItems = processedItems.filter(item => item.selected);
    if (selectedItems.length === 0) {
      setErrorMessage('Selecciona al menos una idea o tarea para guardar.');
      return;
    }

    const ideasToSave: Omit<IdeaItem, 'id' | 'createdAt'>[] = [];
    const tasksToSave: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] = [];

    selectedItems.forEach(item => {
      if (item.isDirectTask && onAddTasks) {
        tasksToSave.push({
          title: item.title,
          description: item.description || item.rawText || '',
          category: item.categoryId,
          priority: item.priority || 'media',
          status: 'pendiente',
          estimatedHours: item.estimatedHours || 1,
          completedHours: 0,
          dailyHours: 0.5,
          finalGoal: item.finalGoal || 'Completar tarea',
          dueDate: item.assignedDate || new Date().toISOString().split('T')[0],
          assignedDate: item.assignedDate || new Date().toISOString().split('T')[0],
          timeSlot: item.timeSlot || '16:00',
          tags: ['braindump', 'gemini-ia'],
          subgoals: [],
        });
      } else {
        ideasToSave.push({
          categoryId: item.categoryId,
          title: item.title,
          description: item.description || item.rawText || '',
          type: (item.type as IdeaType) || 'idea',
          tags: ['braindump', 'gemini-ia'],
        });
      }
    });

    if (ideasToSave.length > 0) {
      onAddIdeas(ideasToSave);
    }
    if (tasksToSave.length > 0 && onAddTasks) {
      onAddTasks(tasksToSave);
    }

    setSummaryStats({
      ideasCount: ideasToSave.length,
      tasksCount: tasksToSave.length,
    });
    setStep('success');

    setTimeout(() => {
      onClose();
    }, 1800);
  };

  const getCategoryDetails = (catId: string) => {
    return categories.find(c => c.id === catId) || {
      id: catId,
      name: 'General',
      color: '#00f2ff',
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div 
        className={`relative w-full max-w-3xl rounded-3xl shadow-2xl border ${
          isDark 
            ? 'bg-[#0f172a] border-[#25324d] text-slate-100' 
            : 'bg-white border-slate-200 text-slate-800'
        } overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isDark ? 'border-[#1e293b] bg-[#111c35]' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-purple-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center space-x-1.5">
                  <span>Brain Dump Inteligente</span>
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-full flex items-center space-x-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Gemini Auto-Organizador</span>
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Escribe o pega todas tus ideas juntas. Gemini las analizará y las asignará a sus colecciones y áreas de vida.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center space-x-2 text-xs text-red-400 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 'input' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Descarga tus pensamientos (Sin preocuparte por el orden)
                </label>
                <span className="text-[11px] text-amber-400 font-mono">
                  ✨ Separa por líneas o escribe un texto libre
                </span>
              </div>

              <div className="relative">
                <textarea
                  rows={8}
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder={`Ejemplo:\n- Comprar filamento negro para la impresora 3D\n- Cambiar aceite al carro el próximo sábado a las 10 am\n- Empezar rutina de 50 flexiones cada mañana\n- Ver la película Oppenheimer este fin de semana\n- Organizar los cables del escritorio\n- Aprender comandos avanzados de Docker`}
                  className={`w-full p-4 rounded-2xl text-sm font-sans resize-none transition-all outline-none border focus:ring-2 focus:ring-amber-400/50 leading-relaxed ${
                    isDark 
                      ? 'bg-[#0b1326] border-[#2d3a58] text-slate-100 placeholder-slate-500' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                isDark ? 'bg-[#131d33]/60 border-[#223150] text-slate-300' : 'bg-amber-50/60 border-amber-200 text-amber-900'
              }`}>
                <div className="font-bold flex items-center space-x-1.5 text-amber-400">
                  <Bot className="w-4 h-4" />
                  <span>¿Qué hará Gemini con tu lista?</span>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] opacity-90 pl-1 list-disc list-inside">
                  <li>Identificará si es una idea o un compromiso con hora</li>
                  <li>Reasignará a Salud, Vehículos, Ocio, Familia, Hogar, etc.</li>
                  <li>Podrás revisar y corregir antes de guardar definitivamente</li>
                  <li>Creará automáticamente tarjetas ordenadas y limpias</li>
                </ul>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#223150]">
                <div>
                  <h4 className="text-sm font-extrabold flex items-center space-x-2 text-cyan-300">
                    <FolderCheck className="w-4 h-4 text-cyan-400" />
                    <span>Propuesta de Organización ({processedItems.filter(i => i.selected).length} seleccionadas)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Revisa las categorías sugeridas. Puedes cambiar el área, marcar como tarea programada o desmarcar lo que no desees.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setProcessedItems(prev => prev.map(i => ({ ...i, selected: true })))}
                    className="text-[10px] font-mono font-bold px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 cursor-pointer"
                  >
                    Seleccionar todas
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('input')}
                    className="text-[10px] font-mono font-bold px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/30 cursor-pointer"
                  >
                    Editar texto original
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                {processedItems.map((item) => {
                  const cat = getCategoryDetails(item.categoryId);
                  return (
                    <div 
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        item.selected 
                          ? isDark ? 'bg-[#131f38] border-cyan-500/40 shadow-sm' : 'bg-cyan-50/40 border-cyan-300'
                          : isDark ? 'bg-[#0b1326]/50 border-slate-800 opacity-60' : 'bg-slate-100 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleToggleItemSelection(item.id)}
                          className={`mt-1 w-5 h-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                            item.selected 
                              ? 'bg-cyan-400 border-cyan-300 text-[#00363a]' 
                              : 'bg-transparent border-slate-600'
                          }`}
                        >
                          {item.selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => handleUpdateItemTitle(item.id, e.target.value)}
                              className={`text-xs sm:text-sm font-bold bg-transparent border-b border-transparent focus:border-cyan-400 outline-none w-full ${
                                isDark ? 'text-white' : 'text-slate-900'
                              }`}
                            />
                            
                            <div className="flex items-center gap-2 shrink-0">
                              {/* Task vs Idea Toggle */}
                              <button
                                type="button"
                                onClick={() => handleToggleItemTaskStatus(item.id)}
                                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg border flex items-center space-x-1 cursor-pointer transition-colors ${
                                  item.isDirectTask 
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                }`}
                                title={item.isDirectTask ? 'Se guardará como Tarea con Fecha en Calendario' : 'Se guardará como Idea en la Colección'}
                              >
                                {item.isDirectTask ? (
                                  <>
                                    <Calendar className="w-3 h-3 text-emerald-400" />
                                    <span>Tarea Calendario</span>
                                  </>
                                ) : (
                                  <>
                                    <Lightbulb className="w-3 h-3 text-amber-400" />
                                    <span>Idea de Banco</span>
                                  </>
                                )}
                              </button>

                              {/* Delete button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                                title="Descartar esta idea"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Description if present */}
                          {item.description && item.description !== item.title && (
                            <p className="text-[11px] text-slate-400 line-clamp-2">
                              {item.description}
                            </p>
                          )}

                          {/* Category Selector Dropdown & Time details */}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="text-[10px] text-slate-400 font-mono">Destino:</span>
                            <select
                              value={item.categoryId}
                              onChange={(e) => handleUpdateItemCategory(item.id, e.target.value)}
                              className={`text-[11px] font-bold py-1 px-2.5 rounded-xl border outline-none cursor-pointer ${
                                isDark 
                                  ? 'bg-[#0b1326] border-[#2b3a58] text-cyan-300' 
                                  : 'bg-white border-slate-300 text-cyan-800'
                              }`}
                            >
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>

                            {item.isDirectTask && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <input
                                  type="date"
                                  value={item.assignedDate || new Date().toISOString().split('T')[0]}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setProcessedItems(prev => prev.map(i => i.id === item.id ? { ...i, assignedDate: val } : i));
                                  }}
                                  className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border outline-none cursor-pointer ${
                                    isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
                                  }`}
                                />
                                <input
                                  type="time"
                                  value={item.timeSlot || '16:00'}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setProcessedItems(prev => prev.map(i => i.id === item.id ? { ...i, timeSlot: val } : i));
                                  }}
                                  className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border outline-none cursor-pointer ${
                                    isDark ? 'bg-slate-800 border-slate-700 text-emerald-400 font-bold' : 'bg-slate-100 border-slate-300 text-emerald-700 font-bold'
                                  }`}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-12 text-center space-y-4 animate-scale-up">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-[#00363a] mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <div>
                <h4 className="text-xl font-black text-white">¡Brain Dump Organizado con Éxito!</h4>
                <p className="text-sm text-slate-300 mt-1">
                  Se asignaron <span className="font-bold text-amber-300">{summaryStats.ideasCount} ideas</span> en sus colecciones y <span className="font-bold text-emerald-300">{summaryStats.tasksCount} tareas</span> en tu calendario.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {step !== 'success' && (
          <div className={`px-6 py-4 border-t flex items-center justify-between ${
            isDark ? 'border-[#1e293b] bg-[#111c35]' : 'border-slate-100 bg-slate-50'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            {step === 'input' ? (
              <button
                type="button"
                onClick={handleProcessDump}
                disabled={isProcessing || !rawInput.trim()}
                className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-lg ${
                  isProcessing || !rawInput.trim()
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 hover:brightness-110 text-[#00363a] shadow-amber-500/20 hover:scale-[1.02]'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#00363a]" />
                    <span>Gemini Organizando tus Ideas...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#00363a]" />
                    <span>Procesar y Reasignar con IA</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmAndSave}
                className="px-6 py-2.5 bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] hover:brightness-110 text-[#00363a] font-black text-xs rounded-xl shadow-lg shadow-[#00f2ff]/20 transition-all flex items-center space-x-2 cursor-pointer hover:scale-[1.02]"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Guardar Todas en sus Áreas</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
