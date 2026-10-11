import React, { useState } from 'react';
import { IdeaItem, CategoryInfo, IdeaType } from '../types';
import { VoiceIdeaModal } from './VoiceIdeaModal';
import { getCategoryContrastColor } from './CollectionDoodleBackground';
import { useTheme } from '../context/ThemeContext';
import { 
  Sparkles, 
  Plus, 
  BookOpen, 
  Lightbulb, 
  Zap, 
  Compass, 
  FolderPlus, 
  Trash2, 
  ArrowRight, 
  CheckCircle2, 
  X,
  Layers,
  Heart,
  Activity,
  Smile,
  Home,
  Tag,
  Gamepad2,
  Gamepad,
  Clapperboard,
  Film,
  Tv,
  PiggyBank,
  Coins,
  Wallet,
  CircleDollarSign,
  Dumbbell,
  Mic,
  Flame,
  Clock,
  ListFilter
} from 'lucide-react';
import { getIdeaAgeDays, getIdeaAgeBadgeStyle, getIdeaStatusConfig } from '../utils/ideaHelpers';

interface CollectionsSectionProps {
  ideas: IdeaItem[];
  categories: CategoryInfo[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  onAddIdea: (idea: Omit<IdeaItem, 'id' | 'createdAt'>) => void;
  onDeleteIdea: (ideaId: string) => void;
  onConvertIdeaToTask: (idea: IdeaItem) => void;
  onNavigateToTab?: (tab: any) => void;
  onUpdateIdeaStatus?: (ideaId: string, status: any) => void;
}

interface CategoryOptionConfig {
  type: IdeaType;
  label: string;
  placeholderTitle: string;
  placeholderDesc: string;
}

const CATEGORY_TYPE_OPTIONS: Record<string, CategoryOptionConfig[]> = {
  job_things: [
    {
      type: 'trabajo_entregable',
      label: '📦 Entregable / Tarea Diaria de Trabajo',
      placeholderTitle: 'Ej. Informe de KPIs, propuesta comercial, mockups de diseño...',
      placeholderDesc: 'Entregables clave, requisitos de cliente o fecha compromiso...',
    },
    {
      type: 'trabajo_reunion',
      label: '👥 Reunión / Sync / Llamada con Cliente o Equipo',
      placeholderTitle: 'Ej. Sincronización semanal, revisión de requerimientos con cliente...',
      placeholderDesc: 'Objetivo de la llamada, agenda, minuta o personas involucradas...',
    },
    {
      type: 'trabajo_reporte',
      label: '📊 Reporte / Informe / Análisis de Métricas',
      placeholderTitle: 'Ej. Resumen financiero mensual, métricas de conversión Q3...',
      placeholderDesc: 'Fuentes de datos, conclusiones clave o destinatarios...',
    },
    {
      type: 'trabajo_soporte',
      label: '🛠️ Soporte / Ticket / Solución de Incidencia',
      placeholderTitle: 'Ej. Resolver bug en pasarela de pagos, atender ticket #1048...',
      placeholderDesc: 'Prioridad del ticket, pasos de reproducción o tiempo estimado...',
    },
    {
      type: 'trabajo_mejora',
      label: '⚡ Automatización / Optimización de Proceso',
      placeholderTitle: 'Ej. Script para automatizar facturación, limpieza de bases de datos...',
      placeholderDesc: 'Beneficio esperado, tiempo ahorrado o herramientas necesarias...',
    },
    {
      type: 'trabajo_cliente',
      label: '🤝 Gestión de Cliente / Cotización / Propuesta',
      placeholderTitle: 'Ej. Enviar cotización a nuevo prospecto, seguimiento de contrato...',
      placeholderDesc: 'Nombre de empresa, valor presupuestado o términos a acordar...',
    },
    {
      type: 'otro',
      label: '✨ Otra Tarea Laboral',
      placeholderTitle: 'Ej. Ordenar correos pendientes, revisar documentación técnica...',
      placeholderDesc: 'Detalles y notas adicionales de trabajo...',
    },
  ],

  salud_deporte: [
    { 
      type: 'cardio', 
      label: '🏃 Cardio (Running / Ciclismo / Caminata / HIIT)', 
      placeholderTitle: 'Ej. Rutina de Running 5K, Salida dominical en bicicleta...', 
      placeholderDesc: 'Distancia objetivo, ritmo por km, frecuencia cardíaca o ruta...' 
    },
    { 
      type: 'pesas', 
      label: '🏋️ Pesas & Gimnasio (Fuerza / Hipertrofia / Calistenia)', 
      placeholderTitle: 'Ej. Rutina Push-Pull-Legs, Subir peso en sentadilla a 80kg...', 
      placeholderDesc: 'Ejercicios clave, series, repeticiones o días de gimnasio...' 
    },
    { 
      type: 'deporte', 
      label: '⚽ Deporte & Disciplina (Fútbol / Natación / Pádel / Artes Marciales)', 
      placeholderTitle: 'Ej. Partido semanal con amigos, Aprender natación estilo mariposa...', 
      placeholderDesc: 'Lugar de práctica, equipo, amigos con los que jugar o instructor...' 
    },
    { 
      type: 'rutina', 
      label: '🧘 Rutina de Salud / Movilidad & Estiramientos', 
      placeholderTitle: 'Ej. 15 min de estiramientos al despertar, Movilidad de espalda y cadera...', 
      placeholderDesc: 'Horario, duración o ejercicios para aliviar postura...' 
    },
    { 
      type: 'nutricion', 
      label: '🥗 Nutrición / Receta Saludable & Meal Prep', 
      placeholderTitle: 'Ej. Plan de meal prep domingos, Recetas altas en proteína, Tomar 2.5L de agua...', 
      placeholderDesc: 'Ingredientes, macros, recetas favoritas o metas de hidratación...' 
    },
    { 
      type: 'otro', 
      label: '✨ Otra Idea de Salud', 
      placeholderTitle: 'Ej. Chequeo médico anual, Comprar zapatillas de running...', 
      placeholderDesc: 'Notas adicionales de salud o estado físico...' 
    },
  ],

  familia_relaciones: [
    { 
      type: 'plan_familiar', 
      label: '👨‍👩‍👧 Plan Familiar / Cena / Noche de Juegos', 
      placeholderTitle: 'Ej. Noche de pizza artesanal y juegos de mesa familiares...', 
      placeholderDesc: 'Detalles del plan, comida o actividades sin pantallas...' 
    },
    { 
      type: 'cita', 
      label: '❤️ Cita en Pareja / Salida Especial', 
      placeholderTitle: 'Ej. Cena romántica en restaurante nuevo, Tarde de café y charla...', 
      placeholderDesc: 'Lugar, fecha ideal, reservas o detalles especiales...' 
    },
    { 
      type: 'viaje', 
      label: '✈️ Paseo / Camping / Viaje Familiar', 
      placeholderTitle: 'Ej. Fin de semana de camping y fogata en la montaña...', 
      placeholderDesc: 'Destino, equipaje, itinerario o lugares por visitar...' 
    },
    { 
      type: 'proyecto_hogar', 
      label: '🏡 Proyecto en Familia / Jardín / Hogar', 
      placeholderTitle: 'Ej. Construir un huerto urbano de especias en familia...', 
      placeholderDesc: 'Materiales, roles de cada integrante o fotos de inspiración...' 
    },
    { 
      type: 'otro', 
      label: '✨ Otra Idea Familiar', 
      placeholderTitle: 'Ej. Visitar a los abuelos el fin de semana, Álbum de fotos...', 
      placeholderDesc: 'Notas y recordatorios familiares...' 
    },
  ],

  aprendizaje: [
    { 
      type: 'habilidad', 
      label: '⚡ Habilidad Técnica / Manual (Arduino, Cameo, Diseño...)', 
      placeholderTitle: 'Ej. Aprender a programar en Arduino, Silhouette Cameo 4...', 
      placeholderDesc: 'Software, herramientas requeridas o tutoriales de referencia...' 
    },
    { 
      type: 'curso', 
      label: '🎓 Curso / Taller / Certificación', 
      placeholderTitle: 'Ej. Curso de DaVinci Resolve, Certificación en Cloud...', 
      placeholderDesc: 'Plataforma (Coursera/Udemy/YouTube), duración o módulos clave...' 
    },
    { 
      type: 'libro', 
      label: '📖 Libro Técnico o de Estudio', 
      placeholderTitle: 'Ej. Leer "Clean Code", Manual de electrónica básica...', 
      placeholderDesc: 'Autor, páginas o temas clave por dominar...' 
    },
    { 
      type: 'idioma', 
      label: '🗣️ Idioma / Vocabulario & Conversación', 
      placeholderTitle: 'Ej. Practicar conversación en Italiano nivel B1...', 
      placeholderDesc: 'App (Duolingo), podcast de práctica o temas de conversación...' 
    },
    { 
      type: 'proyecto', 
      label: '🛠️ Proyecto Práctico / Portafolio', 
      placeholderTitle: 'Ej. Automatizar luces de la sala con relé...', 
      placeholderDesc: 'Pasos de implementación, entregable final o materiales...' 
    },
    { 
      type: 'otro', 
      label: '✨ Otra Idea de Aprendizaje', 
      placeholderTitle: 'Ej. Suscripción a newsletter de tecnología...', 
      placeholderDesc: 'Notas de estudio...' 
    },
  ],

  bienestar_mente: [
    { 
      type: 'meditacion', 
      label: '🧘 Meditación / Mindfulness & Respiración', 
      placeholderTitle: 'Ej. Sesión de 10 min de respiración diafragmática al amanecer...', 
      placeholderDesc: 'Momento del día, app o técnica de respiración...' 
    },
    { 
      type: 'lectura_reflexiva', 
      label: '📖 Lectura Reflexiva & Crecimiento Personal', 
      placeholderTitle: 'Ej. Leer "El Poder del Ahora", "Hábitos Atómicos"...', 
      placeholderDesc: 'Autor, ideas principales por aplicar a mi vida cotidiana...' 
    },
    { 
      type: 'descanso', 
      label: '🌙 Descanso / Higiene del Sueño & Desconexión', 
      placeholderTitle: 'Ej. Noche sin pantallas 1 hora antes de dormir...', 
      placeholderDesc: 'Hábito nocturno, horario de acostarse, ambiente relajante...' 
    },
    { 
      type: 'habito_saludable', 
      label: '✨ Hábito / Gratitud & Diario Personal', 
      placeholderTitle: 'Ej. Escribir 3 cosas por las que agradezco hoy...', 
      placeholderDesc: 'Preguntas guía del diario o propósito del hábito...' 
    },
    { 
      type: 'paseo_naturaleza', 
      label: '🌲 Paseo en Naturaleza & Desconexión', 
      placeholderTitle: 'Ej. Caminata consciente en el parque natural sin auriculares...', 
      placeholderDesc: 'Lugar, sensación buscada o tiempo de desconexión...' 
    },
    { 
      type: 'otro', 
      label: '✨ Otra Idea de Bienestar', 
      placeholderTitle: 'Ej. Taller de alfarería en torno, Día de spa en casa...', 
      placeholderDesc: 'Notas de cuidado personal...' 
    },
  ],

  ocio_entretenimiento: [
    { 
      type: 'videojuego', 
      label: '🎮 Videojuego / Gaming', 
      placeholderTitle: 'Ej. The Legend of Zelda: Tears of the Kingdom, Elden Ring...', 
      placeholderDesc: 'Plataforma (PC/PS5/Switch), horas estimadas o género...' 
    },
    { 
      type: 'serie', 
      label: '📺 Serie / Anime / Temporada', 
      placeholderTitle: 'Ej. Stranger Things temp. 5, Shingeki no Kyojin, Severance...', 
      placeholderDesc: 'Plataforma (Netflix/HBO/Prime/Crunchyroll), episodios...' 
    },
    { 
      type: 'pelicula', 
      label: '🎬 Película / Cine / Maratón', 
      placeholderTitle: 'Ej. Interstellar, Oppenheimer, Trilogía El Señor de los Anillos...', 
      placeholderDesc: 'Director, estreno en cine o velada con amigos...' 
    },
    { 
      type: 'musica', 
      label: '🎵 Música / Concierto / Podcast de Ocio', 
      placeholderTitle: 'Ej. Concierto de banda favorita, Escuchar nuevo álbum...', 
      placeholderDesc: 'Fecha del evento, artista o lista de reproducción...' 
    },
    { 
      type: 'evento', 
      label: '🎉 Salida / Plan de Ocio con Amigos', 
      placeholderTitle: 'Ej. Tarde de karts con amigos, Noche de bolos o escape room...', 
      placeholderDesc: 'Grupo de amigos, presupuesto o lugar...' 
    },
    { 
      type: 'otro', 
      label: '✨ Otra Idea de Ocio', 
      placeholderTitle: 'Ej. Leer cómic / novela gráfica, Juego de cartas nuevo...', 
      placeholderDesc: 'Notas de entretenimiento...' 
    },
  ],

  finanzas_hogar: [
    { 
      type: 'ahorro', 
      label: '💰 Meta de Ahorro Familiar / Fondo de Emergencia', 
      placeholderTitle: 'Ej. Fondo de emergencia de 6 meses, Ahorro para vacaciones familiares...', 
      placeholderDesc: 'Monto meta, ahorro mensual programado, banco o cuenta...' 
    },
    { 
      type: 'inversion', 
      label: '📈 Inversión / Fondo Indexado / Patrimonio', 
      placeholderTitle: 'Ej. Invertir $200 mensuales en ETF S&P500, Cuenta de inversión...', 
      placeholderDesc: 'Broker, horizonte temporal (5-10 años), nivel de riesgo...' 
    },
    { 
      type: 'compra', 
      label: '🛒 Compra Planificada / Mejora del Hogar', 
      placeholderTitle: 'Ej. Renovar iluminación LED del hogar, Pintura de sala...', 
      placeholderDesc: 'Presupuesto estimado, cotizaciones o tiendas donde comprar...' 
    },
    { 
      type: 'presupuesto', 
      label: '📊 Presupuesto / Optimización de Gastos', 
      placeholderTitle: 'Ej. Cancelar suscripciones no utilizadas, Auditar gastos en comida fuera...', 
      placeholderDesc: 'Ahorro estimado al mes, categorías a reducir...' 
    },
    { 
      type: 'otro', 
      label: '✨ Otra Idea Financiera', 
      placeholderTitle: 'Ej. Plan de pago anticipado de tarjeta, Asesoría contable...', 
      placeholderDesc: 'Notas financieras familiares...' 
    },
  ],

  actividades_pendientes: [
    { 
      type: 'pintura_mejora', 
      label: '🎨 Pintura & Reparación (Pintar casa / Lijar / Fachada)', 
      placeholderTitle: 'Ej. Pintar la casa, paredes de la sala y estudio, reparar marcos...', 
      placeholderDesc: 'Colores de pintura, preparación de paredes, áreas a pintar...' 
    },
    { 
      type: 'organizacion_espacio', 
      label: '📦 Organización de Espacio (Estudio / Taller / Closet)', 
      placeholderTitle: 'Ej. Organizar el estudio, ordenar escritorio y cables, clasificar bodega...', 
      placeholderDesc: 'Cajones a ordenar, estanterías, muebles o método de organización...' 
    },
    { 
      type: 'compra_materiales', 
      label: '🖌️ Compra de Materiales & Herramientas (Pinceles / Ferretería)', 
      placeholderTitle: 'Ej. Comprar pinceles, brochas, rodillo, cinta de pintor, lija...', 
      placeholderDesc: 'Lista de compras en ferretería o tienda de arte/hogar...' 
    },
    { 
      type: 'mantenimiento_hogar', 
      label: '🛠️ Mantenimiento & Limpieza Profunda del Hogar', 
      placeholderTitle: 'Ej. Limpieza profunda de ventanas, mantenimiento de aire/caldera...', 
      placeholderDesc: 'Tareas de mantenimiento preventivo, reparaciones o limpieza...' 
    },
    { 
      type: 'diligencia_tramite', 
      label: '📋 Diligencia / Trámite / Encargo Pendiente', 
      placeholderTitle: 'Ej. Renovar licencia de conducir, trámite de documentos, notaría...', 
      placeholderDesc: 'Requisitos, citas previas, oficina o documentos necesarios...' 
    },
    { 
      type: 'otro', 
      label: '✨ Otra Tarea Pendiente', 
      placeholderTitle: 'Ej. Llevar ropa a tintorería, instalar cuadro en sala...', 
      placeholderDesc: 'Detalles de la tarea...' 
    },
  ],
};

const DEFAULT_OPTIONS: CategoryOptionConfig[] = [
  { type: 'idea', label: '💡 Idea General', placeholderTitle: 'Escribe el título de tu idea...', placeholderDesc: 'Detalles y notas adicionales...' },
  { type: 'proyecto', label: '🛠️ Proyecto Personal', placeholderTitle: 'Título del proyecto...', placeholderDesc: 'Pasos de ejecución...' },
  { type: 'otro', label: '✨ Otro', placeholderTitle: 'Título...', placeholderDesc: 'Notas...' },
];

export const CollectionsSection: React.FC<CollectionsSectionProps> = ({
  ideas,
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddIdea,
  onDeleteIdea,
  onConvertIdeaToTask,
  onNavigateToTab,
  onUpdateIdeaStatus,
}) => {
  const { isDark } = useTheme();
  const [isAdding, setIsAdding] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState(
    selectedCategoryId !== 'all' ? selectedCategoryId : categories[0]?.id || 'salud_deporte'
  );
  const [newType, setNewType] = useState<IdeaType>('cardio');

  // Filter ideas safely
  const safeIdeas = Array.isArray(ideas) ? ideas : [];
  const filteredIdeas = selectedCategoryId === 'all'
    ? safeIdeas
    : safeIdeas.filter((i) => i && i.categoryId === selectedCategoryId);

  // Get valid options for the currently selected category in modal
  const availableTypeOptions = CATEGORY_TYPE_OPTIONS[newCategory] || DEFAULT_OPTIONS;
  const currentOptionConfig = availableTypeOptions.find((opt) => opt.type === newType) || availableTypeOptions[0];

  const getTypeBadge = (type: IdeaType) => {
    switch (type) {
      // Salud & Deporte
      case 'cardio':
        return { 
          label: '🏃 Cardio & Resistencia', 
          bg: isDark ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold' 
        };
      case 'pesas':
        return { 
          label: '🏋️ Pesas & Fuerza', 
          bg: isDark ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' : 'bg-teal-100 text-teal-800 border-teal-300 font-semibold' 
        };
      case 'deporte':
        return { 
          label: '⚽ Deporte & Partidos', 
          bg: isDark ? 'bg-green-500/15 text-green-300 border-green-500/30' : 'bg-green-100 text-green-800 border-green-300 font-semibold' 
        };
      case 'rutina':
        return { 
          label: '🧘 Rutina & Movilidad', 
          bg: isDark ? 'bg-lime-500/15 text-lime-300 border-lime-500/30' : 'bg-lime-100 text-lime-800 border-lime-300 font-semibold' 
        };
      case 'nutricion':
        return { 
          label: '🥗 Nutrición Saludable', 
          bg: isDark ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold' 
        };

      // Aprendizaje
      case 'habilidad':
        return { 
          label: '⚡ Habilidad Técnica', 
          bg: isDark ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' : 'bg-sky-100 text-sky-800 border-sky-300 font-semibold' 
        };
      case 'curso':
        return { 
          label: '🎓 Curso / Taller', 
          bg: isDark ? 'bg-sky-500/15 text-sky-300 border-sky-500/30' : 'bg-sky-100 text-sky-800 border-sky-300 font-semibold' 
        };
      case 'libro':
        return { 
          label: '📖 Libro de Estudio', 
          bg: isDark ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' : 'bg-blue-100 text-blue-800 border-blue-300 font-semibold' 
        };
      case 'idioma':
        return { 
          label: '🗣️ Idioma', 
          bg: isDark ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' : 'bg-indigo-100 text-indigo-800 border-indigo-300 font-semibold' 
        };
      case 'proyecto':
        return { 
          label: '🛠️ Proyecto Práctico', 
          bg: isDark ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' : 'bg-teal-100 text-teal-800 border-teal-300 font-semibold' 
        };

      // Bienestar & Mente
      case 'meditacion':
        return { 
          label: '🧘 Meditación & Paz', 
          bg: isDark ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-800 border-purple-300 font-semibold' 
        };
      case 'lectura_reflexiva':
        return { 
          label: '📖 Lectura Reflexiva', 
          bg: isDark ? 'bg-violet-500/15 text-violet-300 border-violet-500/30' : 'bg-violet-100 text-violet-800 border-violet-300 font-semibold' 
        };
      case 'descanso':
        return { 
          label: '🌙 Sueño & Desconexión', 
          bg: isDark ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' : 'bg-indigo-100 text-indigo-800 border-indigo-300 font-semibold' 
        };
      case 'habito_saludable':
        return { 
          label: '✨ Diario & Gratitud', 
          bg: isDark ? 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30' : 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300 font-semibold' 
        };
      case 'paseo_naturaleza':
        return { 
          label: '🌲 Naturaleza & Calma', 
          bg: isDark ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold' 
        };

      // Ocio
      case 'videojuego':
        return { 
          label: '🎮 Videojuego', 
          bg: isDark ? 'bg-pink-500/15 text-pink-300 border-pink-500/30' : 'bg-pink-100 text-pink-800 border-pink-300 font-semibold' 
        };
      case 'serie':
        return { 
          label: '📺 Serie / Temporada', 
          bg: isDark ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-800 border-purple-300 font-semibold' 
        };
      case 'pelicula':
        return { 
          label: '🎬 Película', 
          bg: isDark ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' : 'bg-indigo-100 text-indigo-800 border-indigo-300 font-semibold' 
        };
      case 'musica':
        return { 
          label: '🎵 Música / Podcast', 
          bg: isDark ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' : 'bg-rose-100 text-rose-800 border-rose-300 font-semibold' 
        };
      case 'evento':
        return { 
          label: '🎉 Salida & Plan', 
          bg: isDark ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-800 border-amber-300 font-semibold' 
        };

      // Finanzas & Hogar
      case 'ahorro':
        return { 
          label: '💰 Meta de Ahorro', 
          bg: isDark ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold' 
        };
      case 'inversion':
        return { 
          label: '📈 Inversión / Finanzas', 
          bg: isDark ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' : 'bg-teal-100 text-teal-800 border-teal-300 font-semibold' 
        };
      case 'compra':
        return { 
          label: '🛋️ Compra para el Hogar', 
          bg: isDark ? 'bg-sky-500/15 text-sky-300 border-sky-500/30' : 'bg-sky-100 text-sky-800 border-sky-300 font-semibold' 
        };
      case 'presupuesto':
        return { 
          label: '📊 Presupuesto / Plan', 
          bg: isDark ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-800 border-amber-300 font-semibold' 
        };

      // Familia & Relaciones
      case 'cita':
        return { 
          label: '💖 Cita en Pareja / Salida', 
          bg: isDark ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' : 'bg-rose-100 text-rose-800 border-rose-300 font-semibold' 
        };
      case 'plan_familiar':
        return { 
          label: '👨‍👩‍👧 Evento Familiar', 
          bg: isDark ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-800 border-amber-300 font-semibold' 
        };
      case 'viaje':
        return { 
          label: '✈️ Viaje o Escapada', 
          bg: isDark ? 'bg-sky-500/15 text-sky-300 border-sky-500/30' : 'bg-sky-100 text-sky-800 border-sky-300 font-semibold' 
        };
      case 'proyecto_hogar':
        return { 
          label: '🏡 Proyecto Familiar', 
          bg: isDark ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-800 border-purple-300 font-semibold' 
        };

      // Actividades Pendientes
      case 'organizacion_espacio':
        return { 
          label: '📦 Organización de Espacio', 
          bg: isDark ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-800 border-amber-300 font-semibold' 
        };
      case 'pintura_mejora':
        return { 
          label: '🎨 Pintura & Renovación', 
          bg: isDark ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' : 'bg-teal-100 text-teal-800 border-teal-300 font-semibold' 
        };
      case 'compra_materiales':
        return { 
          label: '🖌️ Compra de Materiales', 
          bg: isDark ? 'bg-sky-500/15 text-sky-300 border-sky-500/30' : 'bg-sky-100 text-sky-800 border-sky-300 font-semibold' 
        };
      case 'mantenimiento_hogar':
        return { 
          label: '🛠️ Mantenimiento del Hogar', 
          bg: isDark ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' : 'bg-indigo-100 text-indigo-800 border-indigo-300 font-semibold' 
        };
      case 'diligencia_tramite':
        return { 
          label: '📋 Diligencia / Trámite', 
          bg: isDark ? 'bg-violet-500/15 text-violet-300 border-violet-500/30' : 'bg-violet-100 text-violet-800 border-violet-300 font-semibold' 
        };

      // Job Things
      case 'trabajo_entregable':
        return { 
          label: '📦 Entregable Laboral', 
          bg: isDark ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' : 'bg-indigo-100 text-indigo-800 border-indigo-300 font-semibold' 
        };
      case 'trabajo_reunion':
        return { 
          label: '👥 Reunión / Sync', 
          bg: isDark ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' : 'bg-blue-100 text-blue-800 border-blue-300 font-semibold' 
        };
      case 'trabajo_reporte':
        return { 
          label: '📊 Reporte & KPIs', 
          bg: isDark ? 'bg-violet-500/15 text-violet-300 border-violet-500/30' : 'bg-violet-100 text-violet-800 border-violet-300 font-semibold' 
        };
      case 'trabajo_soporte':
        return { 
          label: '🛠️ Ticket / Soporte', 
          bg: isDark ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' : 'bg-rose-100 text-rose-800 border-rose-300 font-semibold' 
        };
      case 'trabajo_mejora':
        return { 
          label: '⚡ Automatización', 
          bg: isDark ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' : 'bg-cyan-100 text-cyan-800 border-cyan-300 font-semibold' 
        };
      case 'trabajo_cliente':
        return { 
          label: '🤝 Cliente / Propuesta', 
          bg: isDark ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-800 border-amber-300 font-semibold' 
        };

      default:
        return { 
          label: '💡 Idea General', 
          bg: isDark ? 'bg-[#00f2ff]/15 text-[#00f2ff] border-[#00f2ff]/30' : 'bg-sky-100 text-sky-800 border-sky-300 font-semibold' 
        };
    }
  };

  const handleOpenModal = () => {
    const catToSet = selectedCategoryId !== 'all' ? selectedCategoryId : categories[0]?.id || 'salud_deporte';
    setNewCategory(catToSet);
    const opts = CATEGORY_TYPE_OPTIONS[catToSet] || DEFAULT_OPTIONS;
    setNewType(opts[0]?.type || 'idea');
    setIsAdding(true);
  };

  const handleCategoryChange = (catId: string) => {
    setNewCategory(catId);
    const opts = CATEGORY_TYPE_OPTIONS[catId] || DEFAULT_OPTIONS;
    const isCurrentTypeValid = opts.some((o) => o.type === newType);
    if (!isCurrentTypeValid) {
      setNewType(opts[0]?.type || 'idea');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddIdea({
      title: newTitle.trim(),
      description: newDescription.trim(),
      categoryId: newCategory,
      type: newType,
    });

    setNewTitle('');
    setNewDescription('');
    setIsAdding(false);
  };

  const currentCategoryObj = categories.find((c) => c.id === selectedCategoryId);

  return (
    <div id="banco-de-ideas-section" className={`rounded-3xl p-6 sm:p-7 transition-all scroll-mt-24 space-y-6 ${
      isDark 
        ? 'bg-[#131b2e] border border-[#2d3449] shadow-2xl' 
        : 'bg-white border border-slate-200 shadow-md'
    }`}>
      
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 ${
        isDark ? 'border-[#2d3449]' : 'border-slate-200'
      }`}>
        <div>
          <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono font-bold mb-1 border ${
            isDark 
              ? 'text-[#00f2ff] bg-[#00f2ff]/10 border-[#00f2ff]/30' 
              : 'text-sky-700 bg-sky-50 border-sky-200'
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>Colecciones & Banco de Ideas</span>
          </div>
          <h3 className={`text-xl font-bold tracking-tight flex items-center space-x-2 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            <span>Inspiración & Ideas por Categoría</span>
          </h3>
          <p className={`text-xs mt-1 max-w-xl ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
            Guarda tus rutinas de deporte (cardio, pesas, partidos), libros por leer, series, videojuegos o metas de ahorro. ¡Conviértelos en metas activas cuando estés listo!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-auto">
          {/* Voice Idea Capture Button */}
          <button
            onClick={() => setIsVoiceModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer ring-1 ring-white/20 animate-pulse hover:animate-none"
            title="Dictar y capturar idea con voz"
          >
            <Mic className="w-4 h-4 text-pink-200" />
            <span>Hablar mi Idea (Voz) 🎙️</span>
          </button>

          {/* Manual Add Button */}
          <button
            onClick={handleOpenModal}
            className="px-4 py-2.5 bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] hover:brightness-110 text-[#00363a] font-bold text-xs rounded-xl shadow-lg shadow-[#00f2ff]/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>
              {selectedCategoryId === 'job_things'
                ? 'Escribir Tarea de Trabajo'
                : selectedCategoryId === 'salud_deporte' 
                ? 'Escribir Deporte / Salud'
                : selectedCategoryId === 'actividades_pendientes'
                ? 'Escribir Actividad Pendiente'
                : selectedCategoryId === 'ocio_entretenimiento'
                ? 'Escribir Ocio / Serie'
                : selectedCategoryId === 'finanzas_hogar'
                ? 'Escribir Ahorro / Finanzas'
                : selectedCategoryId === 'familia_relaciones'
                ? 'Escribir Plan Familiar'
                : selectedCategoryId === 'aprendizaje'
                ? 'Escribir Habilidad / Curso'
                : selectedCategoryId === 'bienestar_mente'
                ? 'Escribir Bienestar'
                : 'Escribir Nueva Idea'}
            </span>
          </button>

          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('ideas')}
              className={`px-3 sm:px-3.5 py-2 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer border shadow-sm ${
                isDark 
                  ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/35 hover:scale-[1.02]' 
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 hover:scale-[1.02]'
              }`}
              title="Abrir vista tipo lista con estados (Pendiente / 50% / Hecha) y contador de 30 días"
            >
              <ListFilter className="w-3.5 h-3.5 text-amber-400" />
              <span>Vista Lista & Estados (+30d)</span>
            </button>
          )}
        </div>
      </div>

      {/* Category filter pills inside Collections */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs font-mono">
        <button
          onClick={() => onSelectCategory('all')}
          className={`px-3.5 py-2 rounded-xl border transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 shrink-0 ${
            selectedCategoryId === 'all'
              ? isDark
                ? 'bg-[#00f2ff] text-[#00363a] border-[#00f2ff] font-bold shadow-md shadow-[#00f2ff]/20'
                : 'bg-sky-600 text-white border-sky-600 font-bold shadow-md'
              : isDark
                ? 'bg-[#0b1326] text-slate-300 border-[#2d3449] hover:border-slate-500 hover:text-white'
                : 'bg-slate-100 text-slate-700 border-slate-300 hover:border-slate-400 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Todas ({ideas.length})</span>
        </button>

        {categories.map((cat) => {
          const count = ideas.filter((i) => i.categoryId === cat.id).length;
          const isSel = selectedCategoryId === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl border transition-all whitespace-nowrap cursor-pointer flex items-center space-x-2 shrink-0 ${
                isSel
                  ? isDark
                    ? 'bg-slate-800 text-white font-bold shadow-md'
                    : 'bg-slate-900 text-white font-bold shadow-md'
                  : isDark
                    ? 'bg-[#0b1326] text-slate-300 border-[#2d3449] hover:border-slate-500 hover:text-white'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:border-slate-400 hover:text-slate-900'
              }`}
              style={isSel ? { borderColor: cat.color, boxShadow: `0 0 12px ${cat.color}25` } : {}}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="font-sans font-medium">{cat.name}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                isDark ? 'bg-[#131b2e] text-slate-400' : 'bg-slate-200 text-slate-700'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Modal / Form for adding a new idea */}
      {isAdding && (
        <form onSubmit={handleSubmit} className={`p-5 sm:p-6 border rounded-2xl space-y-4 animate-in fade-in shadow-xl ${
          isDark ? 'bg-[#0b1326] border-[#00f2ff]/40' : 'bg-slate-50 border-sky-300'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-[#2d3449]' : 'border-slate-200'}`}>
            <h4 className={`text-sm font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <FolderPlus className={`w-4 h-4 ${isDark ? 'text-[#00f2ff]' : 'text-sky-600'}`} />
              <span>
                {newCategory === 'salud_deporte'
                  ? '🏃 Agregar Ejercicio / Deporte / Nutrición'
                  : newCategory === 'ocio_entretenimiento'
                  ? '🎮 Agregar Videojuego, Serie o Película'
                  : newCategory === 'finanzas_hogar'
                  ? '💰 Agregar Meta de Ahorro / Finanzas Familiares'
                  : newCategory === 'familia_relaciones'
                  ? '👨‍👩‍👧 Agregar Plan Familiar o Cita Especial'
                  : newCategory === 'bienestar_mente'
                  ? '🧘 Agregar Idea de Bienestar, Mente o Hábitos'
                  : newCategory === 'aprendizaje'
                  ? '⚡ Agregar Habilidad, Curso o Libro'
                  : 'Agregar Idea a la Colección'}
              </span>
            </h4>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className={`cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Category Select */}
            <div className="space-y-1.5">
              <label className={`text-[11px] font-mono uppercase font-bold flex items-center space-x-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <span>Área de Vida / Categoría</span>
              </label>
              <select
                value={newCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-xl text-xs focus:outline-none transition-colors font-medium cursor-pointer ${
                  isDark 
                    ? 'bg-[#131b2e] border-[#2d3449] focus:border-[#00f2ff] text-slate-100' 
                    : 'bg-white border-slate-300 focus:border-sky-500 text-slate-900'
                }`}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Scoped Dynamic Element Type Select */}
            <div className="space-y-1.5">
              <label className={`text-[11px] font-mono uppercase font-bold flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <span>Tipo de Elemento</span>
                <span className={`text-[10px] lowercase font-normal ${isDark ? 'text-[#00f2ff]' : 'text-sky-600'}`}>
                  (específico de {categories.find((c) => c.id === newCategory)?.name || 'categoría'})
                </span>
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as IdeaType)}
                className={`w-full px-3.5 py-2.5 border rounded-xl text-xs focus:outline-none transition-colors font-semibold cursor-pointer ring-1 ${
                  isDark 
                    ? 'bg-[#131b2e] border-[#00f2ff]/40 focus:border-[#00f2ff] text-slate-100 ring-[#00f2ff]/20' 
                    : 'bg-white border-sky-300 focus:border-sky-500 text-slate-900 ring-sky-200'
                }`}
              >
                {availableTypeOptions.map((opt) => (
                  <option key={opt.type} value={opt.type}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic Title Input */}
          <div className="space-y-1.5">
            <label className={`text-[11px] font-mono uppercase font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Título del Elemento
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={currentOptionConfig.placeholderTitle}
              className={`w-full px-3.5 py-2.5 border rounded-xl text-xs focus:outline-none transition-colors ${
                isDark 
                  ? 'bg-[#131b2e] border-[#2d3449] focus:border-[#00f2ff] text-slate-100 placeholder-slate-500' 
                  : 'bg-white border-slate-300 focus:border-sky-500 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Dynamic Description / Notes Input */}
          <div className="space-y-1.5">
            <label className={`text-[11px] font-mono uppercase font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Detalles / Notas / Enlaces o Referencias
            </label>
            <textarea
              rows={2}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder={currentOptionConfig.placeholderDesc}
              className={`w-full px-3.5 py-2.5 border rounded-xl text-xs focus:outline-none resize-none transition-colors ${
                isDark 
                  ? 'bg-[#131b2e] border-[#2d3449] focus:border-[#00f2ff] text-slate-100 placeholder-slate-500' 
                  : 'bg-white border-slate-300 focus:border-sky-500 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          <div className="flex justify-end space-x-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className={`px-4 py-2 font-bold text-xs rounded-xl transition-colors cursor-pointer ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] hover:brightness-110 text-[#00363a] font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Guardar en Colección
            </button>
          </div>
        </form>
      )}

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIdeas.length === 0 ? (
          <div className={`col-span-full py-8 text-center border rounded-2xl p-6 ${
            isDark ? 'bg-[#0b1326] border-[#2d3449]' : 'bg-slate-50 border-slate-200'
          }`}>
            <Lightbulb className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <h4 className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>No hay ideas guardadas en esta categoría</h4>
            <p className={`text-xs mt-1 mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {selectedCategoryId === 'salud_deporte'
                ? 'Anota tus rutinas de cardio, planes de pesas, partidos de fútbol/pádel o recetas de nutrición.'
                : selectedCategoryId === 'actividades_pendientes'
                ? 'Anota tareas pendientes como pintar la casa, organizar el estudio, compras de materiales o trámites.'
                : selectedCategoryId === 'ocio_entretenimiento'
                ? 'Anota videojuegos por jugar, películas pendientes, series o planes de ocio.'
                : selectedCategoryId === 'finanzas_hogar'
                ? 'Anota metas de ahorro, planes de inversión o compras para el hogar.'
                : 'Anota tus lecturas pendientes, cursos, proyectos o habilidades que desees explorar.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setIsVoiceModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 hover:brightness-110 text-white font-bold text-xs rounded-xl inline-flex items-center space-x-1.5 cursor-pointer shadow-md"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Hablar Idea con Voz 🎙️</span>
              </button>

              <button
                onClick={handleOpenModal}
                className={`px-3.5 py-2 font-bold text-xs rounded-xl inline-flex items-center space-x-1.5 cursor-pointer transition-colors ${
                  isDark 
                    ? 'bg-[#00f2ff]/20 hover:bg-[#00f2ff]/30 text-[#00f2ff]' 
                    : 'bg-sky-100 hover:bg-sky-200 text-sky-800'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Escribir Manualmente</span>
              </button>
            </div>
          </div>
        ) : (
          filteredIdeas.map((idea) => {
            const cat = categories.find((c) => c.id === idea.categoryId);
            const badge = getTypeBadge(idea.type);
            const contrastColor = getCategoryContrastColor(idea.categoryId, isDark, cat?.color || '#0284c7');

            return (
              <div
                key={idea.id}
                className={`border rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all duration-200 shadow-sm group ${
                  isDark 
                    ? 'bg-[#0b1326] hover:bg-[#0e1830] border-[#2d3449] hover:border-[#00f2ff]/40' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-sky-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase"
                        style={{
                          backgroundColor: isDark ? `${cat?.color || '#0284c7'}20` : `${contrastColor}15`,
                          color: contrastColor,
                          border: `1px solid ${isDark ? (cat?.color || '#0284c7') + '40' : contrastColor + '40'}`,
                        }}
                      >
                        {cat?.name || idea.categoryId}
                      </span>

                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono border font-semibold ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Age Counter & 30-Day Alert Badge */}
                    {(() => {
                      const ageDays = getIdeaAgeDays(idea.createdAt);
                      const ageBadge = getIdeaAgeBadgeStyle(ageDays, isDark);
                      return (
                        <span 
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono border font-bold flex items-center space-x-1 ${ageBadge.badgeClass}`}
                          title={`Creada hace ${ageDays} días (${idea.createdAt || 'reciente'}). ${ageDays >= 30 ? '¡Alerta de más de 30 días acumulada!' : ''}`}
                        >
                          <Clock className={`w-2.5 h-2.5 ${ageBadge.iconColor}`} />
                          <span>{ageBadge.label}</span>
                        </span>
                      );
                    })()}
                  </div>

                  <h4 className={`font-bold text-sm leading-snug transition-colors ${
                    isDark ? 'text-slate-100 group-hover:text-[#00f2ff]' : 'text-slate-900 group-hover:text-sky-700'
                  }`}>
                    {idea.title}
                  </h4>

                  {idea.description && (
                    <p className={`text-xs line-clamp-3 leading-relaxed ${
                      isDark ? 'text-slate-400' : 'text-slate-600 font-medium'
                    }`}>
                      {idea.description}
                    </p>
                  )}

                  {/* Status selector (Pendiente / 50% / Hecha) */}
                  {onUpdateIdeaStatus && (
                    <div className="pt-1 flex items-center gap-1.5">
                      <span className={`text-[10px] font-mono font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Estado:</span>
                      {(['pendiente', '50%', 'hecha'] as const).map((st) => {
                        const isCurrent = (idea.status || 'pendiente') === st;
                        const cfg = getIdeaStatusConfig(st, isDark);
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => onUpdateIdeaStatus(idea.id, st)}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-all border cursor-pointer ${
                              isCurrent
                                ? `${cfg.badgeClass} ring-1 ring-offset-1 ${isDark ? 'ring-offset-[#0b1326]' : 'ring-offset-white'}`
                                : isDark
                                  ? 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
                                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-800'
                            }`}
                          >
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className={`pt-3 border-t flex items-center justify-between ${
                  isDark ? 'border-[#2d3449]/60' : 'border-slate-200'
                }`}>
                  <button
                    onClick={() => onDeleteIdea(idea.id)}
                    className={`p-1.5 transition-colors cursor-pointer ${
                      isDark ? 'text-slate-500 hover:text-red-400' : 'text-slate-400 hover:text-red-600'
                    }`}
                    title="Eliminar idea"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onConvertIdeaToTask(idea)}
                    className={`px-3 py-1.5 border rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs ${
                      isDark 
                        ? 'bg-gradient-to-r from-[#00f2ff]/20 to-[#38ef7d]/20 hover:from-[#00f2ff]/30 hover:to-[#38ef7d]/30 text-cyan-200 border-[#00f2ff]/30 hover:border-[#00f2ff]/60' 
                        : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-200 hover:border-sky-300'
                    }`}
                  >
                    <span>Convertir en Meta</span>
                    <ArrowRight className={`w-3.5 h-3.5 ${isDark ? 'text-[#00f2ff]' : 'text-sky-600'}`} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Voice Idea Modal */}
      <VoiceIdeaModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        categories={categories}
        defaultCategoryId={selectedCategoryId !== 'all' ? selectedCategoryId : undefined}
        onAddIdea={onAddIdea}
      />

    </div>
  );
};

