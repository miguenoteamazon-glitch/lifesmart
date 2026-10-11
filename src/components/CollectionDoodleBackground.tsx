import React from 'react';

export interface CategoryDoodleProps {
  categoryId: string;
  className?: string;
  isDark?: boolean;
  opacity?: number;
}

/**
 * Returns a high-contrast, accessible color for any category
 * depending on whether the UI is in dark or light mode.
 */
export function getCategoryContrastColor(categoryId: string, isDark: boolean, fallbackColor?: string): string {
  if (isDark) {
    // Dark mode: Vibrant, glowing, rich tones
    switch (categoryId) {
      case 'job_things': return '#818cf8'; // Vibrant Indigo / Electric Violet for Job Things
      case 'salud_deporte': return '#10b981'; // Emerald
      case 'vehiculos': return '#0ea5e9'; // Sky / Electric Blue
      case 'actividades_pendientes': return '#f97316'; // Vibrant Orange
      case 'familia_relaciones': return '#f43f5e'; // Rose
      case 'aprendizaje':
      case 'aprendizaje_habilidades': return '#3b82f6'; // Royal Blue
      case 'bienestar_mente': return '#a855f7'; // Purple / Lavender
      case 'ocio_entretenimiento': return '#ec4899'; // Hot Pink
      case 'finanzas_hogar': return '#f59e0b'; // Amber Gold
      default: return fallbackColor || '#0ea5e9';
    }
  } else {
    // Light mode: High contrast, dark accessible tones (WCAG AA compliant against white/light gray)
    switch (categoryId) {
      case 'job_things': return '#4338ca'; // Deep High-Contrast Indigo
      case 'salud_deporte': return '#047857'; // Deep Emerald (High contrast)
      case 'vehiculos': return '#0369a1'; // Deep Blue / Slate Cyan
      case 'actividades_pendientes': return '#c2410c'; // Deep Amber Rust
      case 'familia_relaciones': return '#be123c'; // Deep Rose
      case 'aprendizaje':
      case 'aprendizaje_habilidades': return '#1d4ed8'; // Deep Royal Blue
      case 'bienestar_mente': return '#7e22ce'; // Deep Purple
      case 'ocio_entretenimiento': return '#be185d'; // Deep Pink
      case 'finanzas_hogar': return '#b45309'; // Deep Amber
      default: return fallbackColor ? '#1e293b' : '#0369a1';
    }
  }
}

/**
 * Topic Chips / Sub-features highlighted on collection cards
 */
export function getCategoryDoodleTags(categoryId: string): string[] {
  switch (categoryId) {
    case 'job_things':
      return ['💼 Tareas Diarias', '⚡ Urgentes & Prioridad', '⏱️ Tiempo Solución', '⏳ Rollover Mañana'];
    case 'salud_deporte':
      return ['🏃 5K Running', '🏋️ Gym & Pesas', '🩺 Citas Médicas', '🥗 Nutrición'];
    case 'vehiculos':
      return ['🚗 Odómetro', '🛢️ Aceite', '🛠️ Mantenimiento', '🛡️ Póliza'];
    case 'actividades_pendientes':
      return ['🎨 Pintura Hogar', '🔧 Reparaciones', '📦 Organización', '🖨️ Proyectos 3D'];
    case 'familia_relaciones':
      return ['👨‍👩‍👧 Noche Familiar', '❤️ Citas Especiales', '✈️ Destinos & Viajes', '📸 Recuerdos'];
    case 'aprendizaje':
    case 'aprendizaje_habilidades':
      return ['💻 Programación', '🤖 Arduino & IoT', '🎨 Silhouette Cameo', '📚 Cursos'];
    case 'bienestar_mente':
      return ['🧘 Meditación & Calma', '🌙 Sueño', '🍵 Desconexión', '🕯️ Autocuidado'];
    case 'ocio_entretenimiento':
      return ['🎮 Videojuegos', '🍿 Cine & Series', '🎧 Música & Podcast', '⭐ Reseñas'];
    case 'finanzas_hogar':
      return ['💰 Fondo Ahorro', '💳 Presupuesto', '📈 Inversiones', '🏡 Metas Hogar'];
    default:
      return ['💡 Banco de Ideas', '🎯 Metas Activas', '⏱️ Registro Horas'];
  }
}

/**
 * Fun hand-drawn doodle stamp badge for category headers
 */
export function getCategoryDoodleBadge(categoryId: string): { label: string; emoji: string; highlight: string } {
  switch (categoryId) {
    case 'job_things':
      return { label: 'TRABAJO & PRODUCTIVIDAD', emoji: '💼', highlight: 'from-indigo-500/20 to-violet-500/20 border-indigo-500/40 text-indigo-400' };
    case 'salud_deporte':
      return { label: 'VITALIDAD & SALUD', emoji: '⚡', highlight: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-400' };
    case 'vehiculos':
      return { label: 'MOTOR & GARAJE', emoji: '🏎️', highlight: 'from-sky-500/20 to-cyan-500/20 border-sky-500/40 text-sky-400' };
    case 'actividades_pendientes':
      return { label: 'PROYECTOS & HOGAR', emoji: '🔨', highlight: 'from-orange-500/20 to-amber-500/20 border-orange-500/40 text-orange-400' };
    case 'familia_relaciones':
      return { label: 'MOMENTOS JUNTOS', emoji: '💖', highlight: 'from-rose-500/20 to-pink-500/20 border-rose-500/40 text-rose-400' };
    case 'aprendizaje':
    case 'aprendizaje_habilidades':
      return { label: 'CONOCIMIENTO & SKILLS', emoji: '🚀', highlight: 'from-blue-500/20 to-indigo-500/20 border-blue-500/40 text-blue-400' };
    case 'bienestar_mente':
      return { label: 'PAZ INTERIOR & CALMA', emoji: '✨', highlight: 'from-purple-500/20 to-violet-500/20 border-purple-500/40 text-purple-400' };
    case 'ocio_entretenimiento':
      return { label: 'DIVERSIÓN & PLAY', emoji: '🎮', highlight: 'from-pink-500/20 to-fuchsia-500/20 border-pink-500/40 text-pink-400' };
    case 'finanzas_hogar':
      return { label: 'PROSPERIDAD & METAS', emoji: '💎', highlight: 'from-amber-500/20 to-yellow-500/20 border-amber-500/40 text-amber-400' };
    default:
      return { label: 'COLECCIÓN ESPECIAL', emoji: '✦', highlight: 'from-sky-500/20 to-cyan-500/20 border-sky-500/40 text-sky-400' };
  }
}

/**
 * Thematic Rich Doodle SVG Artwork Patterns for each collection card
 */
export const CollectionDoodleBackground: React.FC<CategoryDoodleProps> = ({
  categoryId,
  className = '',
  isDark = true,
  opacity = 0.38,
}) => {
  const strokeColor = isDark ? 'currentColor' : '#0f172a';

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none transition-opacity duration-300 ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* 0. Job Things (Briefcase, Laptop, Checklist, Clock Stopwatch, Growth Target Chart, Coffee Mug) */}
      {(categoryId === 'job_things') && (
        <svg className="w-full h-full text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 250" fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {/* Sparkles & Star Doodles */}
          <path d="M45 15 Q45 25 35 25 Q45 25 45 35 Q45 25 55 25 Q45 25 45 15 Z" fill="currentColor" fillOpacity="0.35" strokeWidth="1.5" />
          <path d="M380 35 Q380 43 372 43 Q380 43 380 51 Q380 43 388 43 Q380 43 380 35 Z" fill="currentColor" fillOpacity="0.35" strokeWidth="1.5" />
          <circle cx="210" cy="18" r="2.5" fill="currentColor" />
          <circle cx="395" cy="115" r="2" fill="currentColor" />

          {/* Hand-drawn Work Briefcase */}
          <g transform="translate(20, 24) rotate(-6) scale(0.95)">
            <rect x="2" y="10" width="46" height="32" rx="4" fill="currentColor" fillOpacity="0.25" strokeWidth="2" />
            <path d="M16 10 V6 C16 4, 18 3, 20 3 H30 C32 3, 34 4, 34 6 V10" strokeWidth="2.2" />
            <line x1="2" y1="22" x2="48" y2="22" strokeWidth="1.6" strokeDasharray="3 2" />
            <rect x="22" y="20" width="6" height="5" rx="1" fill="currentColor" />
          </g>

          {/* Laptop & Workspace Screen */}
          <g transform="translate(130, 18) scale(0.92)">
            <rect x="6" y="4" width="48" height="30" rx="3" fill="currentColor" fillOpacity="0.2" strokeWidth="2" />
            <polygon points="2,34 58,34 54,39 6,39" fill="currentColor" fillOpacity="0.4" strokeWidth="2" />
            <path d="M14 12 L22 18 L14 24" strokeWidth="2" />
            <line x1="26" y1="24" x2="44" y2="24" strokeWidth="2.2" />
          </g>

          {/* Checklist & Tasks Completed */}
          <g transform="translate(260, 20) scale(0.9)">
            <rect x="4" y="2" width="38" height="46" rx="4" fill="currentColor" fillOpacity="0.2" strokeWidth="2" />
            <circle cx="12" cy="12" r="3.5" fill="currentColor" />
            <path d="M10 12 L12 14 L17 9" strokeWidth="2" stroke="white" />
            <line x1="20" y1="12" x2="36" y2="12" strokeWidth="2" />
            
            <circle cx="12" cy="24" r="3.5" fill="currentColor" fillOpacity="0.4" />
            <line x1="20" y1="24" x2="36" y2="24" strokeWidth="2" />

            <circle cx="12" cy="36" r="3.5" fill="currentColor" fillOpacity="0.4" />
            <line x1="20" y1="36" x2="32" y2="36" strokeWidth="2" />
          </g>

          {/* Coffee Mug for Work */}
          <g transform="translate(365, 55) scale(0.85)">
            <rect x="2" y="8" width="22" height="26" rx="3" fill="currentColor" fillOpacity="0.3" strokeWidth="2" />
            <path d="M24 12 C30 12, 30 22, 24 22" strokeWidth="2" />
            <path d="M7 3 Q10 0 10 -4" strokeWidth="1.5" strokeDasharray="2 1" />
            <path d="M15 3 Q18 0 18 -4" strokeWidth="1.5" strokeDasharray="2 1" />
          </g>

          {/* Clock Stopwatch (Tiempo de Solución) */}
          <g transform="translate(40, 130) scale(0.92)">
            <circle cx="20" cy="22" r="18" fill="currentColor" fillOpacity="0.25" strokeWidth="2" />
            <line x1="20" y1="22" x2="20" y2="12" strokeWidth="2.2" />
            <line x1="20" y1="22" x2="28" y2="22" strokeWidth="2.2" />
            <path d="M16 4 H24" strokeWidth="2.2" />
            <path d="M32 9 L35 6" strokeWidth="2" />
          </g>

          {/* Productivity Target Bar Graph */}
          <g transform="translate(170, 130) scale(0.9)">
            <line x1="4" y1="38" x2="56" y2="38" strokeWidth="2" />
            <rect x="10" y="24" width="7" height="14" rx="1.5" fill="currentColor" fillOpacity="0.35" strokeWidth="1.5" />
            <rect x="22" y="16" width="7" height="22" rx="1.5" fill="currentColor" fillOpacity="0.5" strokeWidth="1.5" />
            <rect x="34" y="8" width="7" height="30" rx="1.5" fill="currentColor" fillOpacity="0.75" strokeWidth="1.5" />
            <path d="M8 22 L24 14 L36 6 L52 2" strokeWidth="2.5" strokeDasharray="4 2" />
            <polyline points="48,2 52,2 52,6" strokeWidth="2" />
          </g>

          {/* Priority / Target Pin */}
          <g transform="translate(290, 135) scale(0.9)">
            <circle cx="20" cy="20" r="16" fill="currentColor" fillOpacity="0.2" strokeWidth="2" />
            <circle cx="20" cy="20" r="9" fill="currentColor" fillOpacity="0.4" strokeWidth="1.8" />
            <circle cx="20" cy="20" r="3.5" fill="currentColor" />
          </g>
        </svg>
      )}

      {/* 1. Salud & Deporte (Dumbbells, Sneakers, Heart pulse, Water bottle, Apple, Stars, Scribbles) */}
      {(categoryId === 'salud_deporte') && (
        <svg className="w-full h-full text-emerald-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 250" fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {/* Hand-drawn Sparkle Stars */}
          <path d="M45 15 Q45 25 35 25 Q45 25 45 35 Q45 25 55 25 Q45 25 45 15 Z" fill="currentColor" fillOpacity="0.4" strokeWidth="1.5" />
          <path d="M380 40 Q380 48 372 48 Q380 48 380 56 Q380 48 388 48 Q380 48 380 40 Z" fill="currentColor" fillOpacity="0.4" strokeWidth="1.5" />
          <circle cx="210" cy="18" r="2.5" fill="currentColor" />
          <circle cx="395" cy="115" r="2" fill="currentColor" />
          
          {/* Dumbbell with motion lines */}
          <g transform="translate(18, 28) rotate(-12) scale(0.95)">
            <rect x="0" y="6" width="7" height="22" rx="2.5" fill="currentColor" fillOpacity="0.3" />
            <rect x="7" y="10" width="5" height="14" rx="1.5" fill="currentColor" fillOpacity="0.3" />
            <line x1="12" y1="17" x2="42" y2="17" strokeWidth="3.5" />
            <rect x="42" y="10" width="5" height="14" rx="1.5" fill="currentColor" fillOpacity="0.3" />
            <rect x="47" y="6" width="7" height="22" rx="2.5" fill="currentColor" fillOpacity="0.3" />
            {/* Motion rays */}
            <path d="M16 8 L18 4 M38 8 L36 4 M27 6 L27 2" strokeWidth="1.6" />
          </g>

          {/* Running Sneaker */}
          <g transform="translate(125, 20) scale(0.9)">
            <path d="M5 28 C12 16, 28 16, 38 22 L60 22 C68 22, 75 27, 78 33 L5 33 Z" fill="currentColor" fillOpacity="0.25" />
            <path d="M5 33 L80 33 C84 33, 84 39, 78 39 L5 39 Z" fill="currentColor" fillOpacity="0.4" />
            <path d="M25 19 L32 28 M34 20 L41 28 M43 21 L50 28" strokeWidth="2" />
            <circle cx="16" cy="24" r="2.5" fill="currentColor" />
            {/* Speed trails */}
            <line x1="84" y1="28" x2="94" y2="28" strokeDasharray="3 2" />
            <line x1="82" y1="34" x2="92" y2="34" strokeDasharray="3 2" />
          </g>

          {/* Heart Pulse Rate & ECG */}
          <g transform="translate(255, 24) scale(0.9)">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" fillOpacity="0.2" />
            <polyline points="0,14 6,14 10,6 14,22 18,14 26,14" strokeWidth="2.4" />
          </g>

          {/* Stopwatch */}
          <g transform="translate(340, 26) scale(0.85)">
            <circle cx="20" cy="22" r="16" fill="currentColor" fillOpacity="0.2" />
            <line x1="20" y1="6" x2="20" y2="2" strokeWidth="2.5" />
            <rect x="16" y="0" width="8" height="4" rx="1.5" fill="currentColor" fillOpacity="0.4" />
            <polyline points="20,22 20,13 27,17" strokeWidth="2.4" />
            <path d="M30 10 L34 7" strokeWidth="2" />
          </g>

          {/* Water Bottle with droplet */}
          <g transform="translate(30, 130) rotate(10) scale(0.9)">
            <rect x="7" y="1" width="14" height="7" rx="2" fill="currentColor" fillOpacity="0.4" />
            <rect x="4" y="8" width="20" height="42" rx="5" fill="currentColor" fillOpacity="0.25" />
            <line x1="4" y1="20" x2="24" y2="20" strokeWidth="1.8" />
            <line x1="4" y1="34" x2="24" y2="34" strokeWidth="1.8" />
            {/* Water Wave */}
            <path d="M8 26 C12 23, 16 29, 20 26" strokeWidth="2" />
            {/* Mini water drop */}
            <path d="M28 14 C28 12, 31 9, 31 9 C31 9, 34 12, 34 14 C34 16, 32.5 17.5, 31 17.5 C29.5 17.5, 28 16, 28 14 Z" fill="currentColor" fillOpacity="0.4" />
          </g>

          {/* Bicycle Chain / Wheel */}
          <g transform="translate(145, 132) scale(0.85)">
            <circle cx="22" cy="22" r="20" strokeDasharray="4 3" strokeWidth="2" />
            <circle cx="22" cy="22" r="20" fill="currentColor" fillOpacity="0.15" />
            <circle cx="22" cy="22" r="5" fill="currentColor" />
            <line x1="22" y1="2" x2="22" y2="42" strokeWidth="1.6" />
            <line x1="2" y1="22" x2="42" y2="22" strokeWidth="1.6" />
            <line x1="8" y1="8" x2="36" y2="36" strokeWidth="1.6" />
            <line x1="8" y1="36" x2="36" y2="8" strokeWidth="1.6" />
          </g>

          {/* Crisp Apple & Leaf */}
          <g transform="translate(265, 135) scale(0.9)">
            <path d="M19 11 C10 11, 4 17, 4 26 C4 37, 12 43, 19 43 C26 43, 34 37, 34 26 C34 17, 28 11, 19 11 Z" fill="currentColor" fillOpacity="0.25" />
            <path d="M19 11 C19 5, 23 3, 25 3" strokeWidth="2.5" />
            <path d="M23 5 C28 3, 30 7, 27 9" fill="currentColor" fillOpacity="0.5" strokeWidth="1.8" />
          </g>

          {/* Calorie Flame / Energy */}
          <g transform="translate(350, 135) scale(0.9)">
            <path d="M14 2c0 5-5 7-5 12 0 5 4 10 9 10s9-5 9-10c0-6-7-10-7-12 0 0-2 2-2 5-1-2-4-5-4-5z" fill="currentColor" fillOpacity="0.35" strokeWidth="2" />
            <path d="M14 16 c0 2-2 3-2 5 0 2 1.5 3.5 3.5 3.5s3.5-1.5 3.5-3.5c0-2-3-3.5-3-3.5 0 0-1 1-1 2-0.5-1-1-2-1-2z" fill="currentColor" />
          </g>
        </svg>
      )}

      {/* 2. Vehículos & Garaje (Cars, Wrench, Speedometer, Spark plug, Oil can, Piston, Gears) */}
      {(categoryId === 'vehiculos') && (
        <svg className="w-full h-full text-sky-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 250" fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {/* Hand-drawn Sparkle Stars */}
          <path d="M20 20 Q20 30 10 30 Q20 30 20 40 Q20 30 30 30 Q20 30 20 20 Z" fill="currentColor" fillOpacity="0.4" strokeWidth="1.5" />
          <path d="M375 25 Q375 35 365 35 Q375 35 375 45 Q375 35 385 35 Q375 35 375 25 Z" fill="currentColor" fillOpacity="0.4" strokeWidth="1.5" />
          
          {/* Fast Car Silhouette with spoiler */}
          <g transform="translate(25, 25) scale(0.95)">
            <path d="M4 28 L18 14 C23 9, 36 7, 52 7 L72 11 L86 22 L98 25 C101 26, 102 29, 100 32 L4 32 Z" fill="currentColor" fillOpacity="0.25" />
            <circle cx="28" cy="32" r="9" fill="currentColor" fillOpacity="0.4" strokeWidth="2" />
            <circle cx="28" cy="32" r="3.5" fill={strokeColor} />
            <circle cx="78" cy="32" r="9" fill="currentColor" fillOpacity="0.4" strokeWidth="2" />
            <circle cx="78" cy="32" r="3.5" fill={strokeColor} />
            {/* Window & Roof */}
            <path d="M26 14 L44 10 L68 14 L80 22 L26 22 Z" fill="currentColor" fillOpacity="0.2" strokeWidth="1.6" />
            {/* Speed exhaust puffs */}
            <path d="M-6 26 Q-12 24 -16 28 M-8 32 Q-14 30 -20 34" strokeDasharray="3 2" />
          </g>

          {/* Wrench & Sparkle */}
          <g transform="translate(180, 18) rotate(25) scale(0.9)">
            <path d="M16 2 L24 10 L18 17 L30 29 C32 31, 32 35, 30 38 L26 42 C23 44, 19 44, 17 42 L4 29 L11 23 L2 15 C1 13, 1 8, 5 5 C9 2, 13 1, 16 2 Z" fill="currentColor" fillOpacity="0.3" />
            <circle cx="25" cy="38" r="2.5" fill="currentColor" />
          </g>

          {/* Speedometer / Tachometer */}
          <g transform="translate(275, 20) scale(0.9)">
            <path d="M6 34 A 20 20 0 1 1 42 34" strokeWidth="2.8" />
            <path d="M6 34 A 20 20 0 1 1 42 34" fill="currentColor" fillOpacity="0.2" />
            <line x1="24" y1="24" x2="35" y2="15" strokeWidth="3" />
            <circle cx="24" cy="24" r="3.5" fill="currentColor" />
            <line x1="12" y1="15" x2="15" y2="18" strokeWidth="2" />
            <line x1="24" y1="6" x2="24" y2="10" strokeWidth="2" />
            <line x1="36" y1="15" x2="33" y2="18" strokeWidth="2" />
          </g>

          {/* Spark Plug with electrical spark */}
          <g transform="translate(355, 22) rotate(-18) scale(0.85)">
            <rect x="6" y="2" width="7" height="5" rx="1" fill="currentColor" fillOpacity="0.3" />
            <rect x="4" y="7" width="11" height="14" rx="2" fill="currentColor" fillOpacity="0.35" />
            <rect x="7" y="21" width="5" height="15" fill="currentColor" fillOpacity="0.2" />
            <line x1="5" y1="25" x2="14" y2="25" strokeWidth="1.8" />
            <line x1="5" y1="29" x2="14" y2="29" strokeWidth="1.8" />
            <line x1="9.5" y1="36" x2="9.5" y2="42" strokeWidth="2.5" />
            {/* Mini spark bolt */}
            <polyline points="15,40 18,37 15,35 19,32" strokeWidth="1.8" />
          </g>

          {/* Oil Can with smooth drip */}
          <g transform="translate(30, 135) scale(0.9)">
            <path d="M14 4 L24 15 C29 20, 29 28, 24 33 C19 38, 10 38, 5 33 C1 28, 1 20, 5 15 Z" fill="currentColor" fillOpacity="0.3" />
            <circle cx="16" cy="24" r="3.5" fill="currentColor" fillOpacity="0.6" />
            {/* Oil drop */}
            <path d="M30 20 C30 17, 33 13, 33 13 C33 13, 36 17, 36 20 C36 22.5, 34.5 24, 33 24 C31.5 24, 30 22.5, 30 20 Z" fill="currentColor" fillOpacity="0.5" />
          </g>

          {/* Mechanical Gear */}
          <g transform="translate(145, 135) scale(0.85)">
            <circle cx="24" cy="24" r="18" fill="currentColor" fillOpacity="0.2" strokeWidth="2" />
            <circle cx="24" cy="24" r="7" fill="currentColor" fillOpacity="0.5" />
            <path d="M22 2 L26 2 L25 7 L23 7 Z M22 41 L26 41 L25 46 L23 46 Z M2 22 L2 26 L7 25 L7 23 Z M41 22 L41 26 L46 25 L46 23 Z" fill="currentColor" />
            <path d="M8 8 L12 6 L14 10 L10 12 Z M34 34 L38 32 L40 36 L36 38 Z M8 40 L6 36 L10 34 L12 38 Z M40 8 L36 6 L34 10 L38 12 Z" fill="currentColor" />
          </g>

          {/* Piston & Con-rod */}
          <g transform="translate(265, 135) scale(0.9)">
            <rect x="4" y="2" width="22" height="16" rx="3" fill="currentColor" fillOpacity="0.3" />
            <line x1="4" y1="7" x2="26" y2="7" strokeWidth="1.8" />
            <line x1="4" y1="12" x2="26" y2="12" strokeWidth="1.8" />
            <line x1="15" y1="18" x2="15" y2="38" strokeWidth="3.5" />
            <circle cx="15" cy="38" r="4.5" fill="currentColor" fillOpacity="0.5" />
          </g>

          {/* Tire Tread Pattern */}
          <g transform="translate(350, 135) scale(0.85)">
            <rect x="4" y="2" width="26" height="42" rx="5" fill="currentColor" fillOpacity="0.2" strokeWidth="2" />
            <path d="M8 8 L17 15 L8 22 M26 15 L17 22 L26 29 M8 29 L17 36 L8 43" strokeWidth="2.5" />
          </g>
        </svg>
      )}

      {/* 3. Actividades Pendientes (Checklists, Paint roller, Boxes, Hammer, Sticky notes, Clock) */}
      {(categoryId === 'actividades_pendientes') && (
        <svg className="w-full h-full text-orange-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 250" fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {/* Hand-drawn Sparkle Stars */}
          <path d="M35 15 Q35 25 25 25 Q35 25 35 35 Q35 25 45 25 Q35 25 35 15 Z" fill="currentColor" fillOpacity="0.4" strokeWidth="1.5" />
          <path d="M385 30 Q385 40 375 40 Q385 40 385 50 Q385 40 395 40 Q385 40 385 30 Z" fill="currentColor" fillOpacity="0.4" strokeWidth="1.5" />
          
          {/* Clipboard with Hand-Checked Marks */}
          <g transform="translate(25, 25) scale(0.95)">
            <rect x="4" y="8" width="34" height="46" rx="4" fill="currentColor" fillOpacity="0.25" />
            <rect x="13" y="2" width="16" height="9" rx="2.5" fill="currentColor" fillOpacity="0.4" />
            {/* Check 1 */}
            <polyline points="10,21 14,25 20,18" strokeWidth="2.4" />
            <line x1="24" y1="21" x2="32" y2="21" strokeWidth="2" />
            {/* Check 2 */}
            <polyline points="10,32 14,36 20,29" strokeWidth="2.4" />
            <line x1="24" y1="32" x2="32" y2="32" strokeWidth="2" />
            {/* Square 3 */}
            <rect x="9" y="39" width="6" height="6" rx="1.5" strokeWidth="1.8" />
            <line x1="19" y1="42" x2="32" y2="42" strokeWidth="2" />
          </g>

          {/* Paint Roller with Drips */}
          <g transform="translate(150, 18) rotate(-10) scale(0.9)">
            <rect x="4" y="2" width="30" height="13" rx="3.5" fill="currentColor" fillOpacity="0.35" />
            <path d="M34 8 L40 8 L40 26 L23 26 L23 37" strokeWidth="2.4" />
            <rect x="20" y="37" width="7" height="15" rx="2" fill="currentColor" fillOpacity="0.5" />
            {/* Paint drip */}
            <path d="M8 15 Q9 20 11 20 Q13 20 14 15" fill="currentColor" />
          </g>

          {/* Delivery / Storage Box */}
          <g transform="translate(265, 20) scale(0.9)">
            <path d="M6 15 L23 4 L40 15 L23 26 Z" fill="currentColor" fillOpacity="0.3" />
            <path d="M6 15 L6 36 L23 47 L23 26 Z" fill="currentColor" fillOpacity="0.4" />
            <path d="M40 15 L40 36 L23 47 L23 26 Z" fill="currentColor" fillOpacity="0.2" />
            <line x1="23" y1="4" x2="23" y2="26" strokeWidth="2.2" />
            {/* Fragile / Tape line */}
            <line x1="16" y1="21" x2="30" y2="12" strokeWidth="2" strokeDasharray="2 2" />
          </g>

          {/* Sticky Notes with Pushpin */}
          <g transform="translate(350, 20) rotate(6) scale(0.9)">
            <path d="M4 4 L32 4 L32 25 L23 34 L4 34 Z" fill="currentColor" fillOpacity="0.3" />
            <path d="M23 25 L32 25 L23 34 Z" fill="currentColor" fillOpacity="0.6" />
            <circle cx="18" cy="8" r="2.5" fill="currentColor" />
            <line x1="9" y1="14" x2="27" y2="14" strokeWidth="2" />
            <line x1="9" y1="20" x2="22" y2="20" strokeWidth="2" />
          </g>

          {/* Hammer / Workshop Tool */}
          <g transform="translate(35, 135) rotate(-20) scale(0.9)">
            <rect x="2" y="2" width="22" height="11" rx="2.5" fill="currentColor" fillOpacity="0.4" />
            <path d="M24 2 C29 2, 31 8, 27 13 L2 13" />
            <rect x="10" y="13" width="7" height="32" rx="2.5" fill="currentColor" fillOpacity="0.3" />
          </g>

          {/* Alarm Clock */}
          <g transform="translate(150, 135) scale(0.9)">
            <circle cx="21" cy="23" r="16" fill="currentColor" fillOpacity="0.2" strokeWidth="2" />
            <polyline points="21,23 21,13 27,18" strokeWidth="2.4" />
            <path d="M7 8 L13 4 M35 8 L29 4" strokeWidth="2.8" />
            <line x1="10" y1="38" x2="7" y2="43" strokeWidth="2.2" />
            <line x1="32" y1="38" x2="35" y2="43" strokeWidth="2.2" />
          </g>

          {/* 3D Printer / Tech Extruder */}
          <g transform="translate(265, 135) scale(0.9)">
            <rect x="8" y="2" width="18" height="13" fill="currentColor" fillOpacity="0.3" />
            <path d="M8 15 L17 28 L26 15 Z" fill="currentColor" fillOpacity="0.45" />
            <circle cx="17" cy="32" r="2.5" fill="currentColor" />
            <path d="M5 36 C12 32, 22 40, 29 36" strokeWidth="2.4" />
          </g>

          {/* Star Target Goal */}
          <g transform="translate(350, 140) scale(0.9)">
            <polygon points="18,2 22,12 34,14 25,22 28,34 18,28 8,34 11,22 2,14 14,12" fill="currentColor" fillOpacity="0.3" strokeWidth="2" />
          </g>
        </svg>
      )}

      {/* 4. Familia & Relaciones (Hearts, Cozy Home, Boardgames, Camera, Coffee, Vacation Palm) */}
      {(categoryId === 'familia_relaciones') && (
        <svg className="w-full h-full text-rose-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 250" fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {/* Hand-drawn Sparkle Stars */}
          <path d="M30 15 Q30 25 20 25 Q30 25 30 35 Q30 25 40 25 Q30 25 30 15 Z" fill="currentColor" fillOpacity="0.4" strokeWidth="1.5" />
          <path d="M380 25 Q380 35 370 35 Q380 35 380 45 Q380 35 390 35 Q380 35 380 25 Z" fill="currentColor" fillOpacity="0.4" strokeWidth="1.5" />
          
          {/* Big Warm Heart with Radiating Love */}
          <g transform="translate(25, 25) scale(0.95)">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" fillOpacity="0.3" transform="scale(1.6)" />
            {/* Love sparkle rays */}
            <path d="M4 8 L0 6 M34 8 L38 6 M19 0 L19 -4" strokeWidth="2" />
          </g>

          {/* Cozy Home with Chimney Smoke */}
          <g transform="translate(145, 18) scale(0.9)">
            <path d="M4 23 L25 4 L46 23 L40 23 L40 42 L10 42 L10 23 Z" fill="currentColor" fillOpacity="0.25" />
            <rect x="21" y="25" width="9" height="17" rx="1.5" fill="currentColor" fillOpacity="0.45" />
            <path d="M36 11 L36 6 L40 6 L40 15" strokeWidth="2" />
            {/* Smoke curl */}
            <path d="M38 4 Q41 1 39 -2" strokeWidth="1.8" />
          </g>

          {/* Board Game Dice */}
          <g transform="translate(265, 20) scale(0.9)">
            <rect x="4" y="4" width="30" height="30" rx="5" fill="currentColor" fillOpacity="0.3" strokeWidth="2" />
            <circle cx="11" cy="11" r="2.5" fill="currentColor" />
            <circle cx="19" cy="19" r="2.5" fill="currentColor" />
            <circle cx="27" cy="27" r="2.5" fill="currentColor" />
            <circle cx="11" cy="27" r="2.5" fill="currentColor" />
            <circle cx="27" cy="11" r="2.5" fill="currentColor" />
          </g>

          {/* Camera Memory with Flash */}
          <g transform="translate(350, 20) scale(0.9)">
            <rect x="2" y="9" width="36" height="28" rx="4" fill="currentColor" fillOpacity="0.3" />
            <path d="M13 9 L16 4 L24 4 L27 9 Z" fill="currentColor" fillOpacity="0.45" />
            <circle cx="20" cy="23" r="8" fill="currentColor" fillOpacity="0.25" strokeWidth="2" />
            <circle cx="20" cy="23" r="3.5" fill={strokeColor} />
            {/* Flash burst */}
            <path d="M32 4 L35 1" strokeWidth="2" />
          </g>

          {/* Coffee Mug with Aromatic Steam */}
          <g transform="translate(35, 135) scale(0.9)">
            <rect x="4" y="11" width="24" height="26" rx="5" fill="currentColor" fillOpacity="0.3" />
            <path d="M28 15 C35 15, 35 26, 28 26" strokeWidth="2.4" />
            {/* Steam curls */}
            <path d="M9 3 C12 6, 9 8, 12 11 M16 2 C19 5, 16 7, 19 10" strokeWidth="2" />
          </g>

          {/* Palm Tree / Family Vacation */}
          <g transform="translate(150, 135) scale(0.9)">
            <path d="M19 40 C19 28, 17 19, 15 10" strokeWidth="3.5" />
            <path d="M15 10 C8 4, 2 8, 2 13 M15 10 C22 4, 30 7, 30 13 M15 10 C20 17, 26 21, 28 26 M15 10 C10 17, 4 21, 2 26" strokeWidth="2.4" fill="currentColor" fillOpacity="0.2" />
          </g>

          {/* Pizza Slice / Family Dinner */}
          <g transform="translate(265, 135) rotate(-12) scale(0.9)">
            <path d="M4 8 C19 4, 30 13, 36 24 L6 34 Z" fill="currentColor" fillOpacity="0.35" />
            <circle cx="15" cy="17" r="2.5" fill="currentColor" />
            <circle cx="24" cy="21" r="2.5" fill="currentColor" />
            <circle cx="13" cy="26" r="2.5" fill="currentColor" />
          </g>

          {/* Smiling Sun with Rays */}
          <g transform="translate(350, 140) scale(0.9)">
            <circle cx="19" cy="19" r="11" fill="currentColor" fillOpacity="0.3" strokeWidth="2" />
            <path d="M15 18 Q19 23 23 18" strokeWidth="2" />
            <line x1="19" y1="2" x2="19" y2="5" strokeWidth="2.5" />
            <line x1="19" y1="33" x2="19" y2="36" strokeWidth="2.5" />
            <line x1="2" y1="19" x2="5" y2="19" strokeWidth="2.5" />
            <line x1="33" y1="19" x2="36" y2="19" strokeWidth="2.5" />
          </g>
        </svg>
      )}

      {/* 5. Aprendizaje & Habilidades (Books, Grad Cap, Code, Rocket, Brain, Lightbulb, Pencil) */}
      {(categoryId === 'aprendizaje' || categoryId === 'aprendizaje_habilidades') && (
        <svg className="w-full h-full text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 250" fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {/* Hand-drawn Sparkle Stars */}
          <path d="M35 15 Q35 25 25 25 Q35 25 35 35 Q35 25 45 25 Q35 25 35 15 Z" fill="currentColor" fillOpacity="0.4" strokeWidth="1.5" />
          <path d="M380 25 Q380 35 370 35 Q380 35 380 45 Q380 35 390 35 Q380 35 380 25 Z" fill="currentColor" fillOpacity="0.4" strokeWidth="1.5" />
          
          {/* Open Book with Knowledge Rays */}
          <g transform="translate(25, 25) scale(0.95)">
            <path d="M4 30 C13 26, 21 26, 25 28 C29 26, 37 26, 46 30 L46 9 C37 5, 29 5, 25 7 C21 5, 13 5, 4 9 Z" fill="currentColor" fillOpacity="0.3" />
            <line x1="25" y1="7" x2="25" y2="28" strokeWidth="2.4" />
            <line x1="10" y1="14" x2="19" y2="12" strokeWidth="1.8" />
            <line x1="10" y1="19" x2="19" y2="17" strokeWidth="1.8" />
            <line x1="31" y1="12" x2="40" y2="14" strokeWidth="1.8" />
            <line x1="31" y1="17" x2="40" y2="19" strokeWidth="1.8" />
          </g>

          {/* Graduation Cap */}
          <g transform="translate(145, 18) scale(0.9)">
            <path d="M4 15 L25 4 L46 15 L25 26 Z" fill="currentColor" fillOpacity="0.35" />
            <path d="M13 19 L13 32 C13 37, 37 37, 37 32 L37 19" fill="currentColor" fillOpacity="0.2" />
            <path d="M42 17 L42 30" strokeWidth="2.2" />
            <circle cx="42" cy="30" r="2.5" fill="currentColor" />
          </g>

          {/* Code Brackets </> with glowing terminal */}
          <g transform="translate(265, 20) scale(0.9)">
            <rect x="2" y="4" width="40" height="30" rx="5" fill="currentColor" fillOpacity="0.25" />
            <polyline points="12,12 7,19 12,26" strokeWidth="2.5" />
            <polyline points="30,12 35,19 30,26" strokeWidth="2.5" />
            <line x1="23" y1="10" x2="19" y2="28" strokeWidth="2.5" />
          </g>

          {/* Idea Lightbulb with Radiating Rays */}
          <g transform="translate(350, 18) scale(0.9)">
            <path d="M13 28 C9 24, 7 17, 7 13 C7 6, 13 0, 20 0 C27 0, 33 6, 33 13 C33 17, 31 24, 27 28 Z" fill="currentColor" fillOpacity="0.3" />
            <line x1="13" y1="32" x2="27" y2="32" strokeWidth="2.5" />
            <line x1="15" y1="36" x2="25" y2="36" strokeWidth="2.5" />
            {/* Rays */}
            <line x1="20" y1="-5" x2="20" y2="-9" strokeWidth="2" />
            <line x1="36" y1="5" x2="40" y2="2" strokeWidth="2" />
            <line x1="4" y1="5" x2="0" y2="2" strokeWidth="2" />
          </g>

          {/* Language Speech Bubble */}
          <g transform="translate(35, 135) scale(0.9)">
            <path d="M4 4 L34 4 C38 4, 40 6, 40 10 L40 26 C40 30, 38 32, 34 32 L17 32 L9 40 L9 32 L4 32 C1 32, 0 30, 0 26 L0 10 C0 6, 1 4, 4 4 Z" fill="currentColor" fillOpacity="0.3" />
            <text x="9" y="23" fill="currentColor" fontSize="16" fontWeight="bold" fontFamily="sans-serif">A</text>
            <text x="23" y="23" fill="currentColor" fontSize="14" fontWeight="bold" fontFamily="sans-serif">文</text>
          </g>

          {/* Brain / Synapse Spark */}
          <g transform="translate(150, 135) scale(0.9)">
            <circle cx="15" cy="17" r="11" fill="currentColor" fillOpacity="0.3" />
            <circle cx="28" cy="17" r="11" fill="currentColor" fillOpacity="0.3" />
            <path d="M9 25 C9 34, 34 34, 34 25" fill="currentColor" fillOpacity="0.15" />
            <circle cx="21" cy="15" r="3.5" fill="currentColor" />
          </g>

          {/* Pencil & Measuring Ruler */}
          <g transform="translate(265, 135) rotate(-28) scale(0.9)">
            <rect x="4" y="4" width="9" height="36" rx="2" fill="currentColor" fillOpacity="0.3" />
            <polygon points="4,40 8.5,47 13,40" fill="currentColor" />
            <line x1="4" y1="13" x2="13" y2="13" strokeWidth="1.6" />
            <line x1="4" y1="21" x2="13" y2="21" strokeWidth="1.6" />
            <line x1="4" y1="29" x2="13" y2="29" strokeWidth="1.6" />
          </g>

          {/* Rocket Ship Launch */}
          <g transform="translate(350, 135) rotate(45) scale(0.9)">
            <path d="M12 2 C12 2, 22 6, 22 16 L22 28 L2 28 L2 16 C2 6, 12 2, 12 2 Z" fill="currentColor" fillOpacity="0.35" />
            <circle cx="12" cy="15" r="3.5" fill={strokeColor} />
            <path d="M2 22 L-3 28 L2 28 Z M22 22 L27 28 L22 28 Z" fill="currentColor" />
            <path d="M7 28 L12 36 L17 28 Z" fill="currentColor" fillOpacity="0.6" />
          </g>
        </svg>
      )}

      {/* 6. Bienestar & Mente (Lotus, Moon & Stars, Zen Stones, Tea, Candle, Sprout) */}
      {(categoryId === 'bienestar_mente') && (
        <svg className="w-full h-full text-purple-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 250" fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {/* Hand-drawn Sparkle Stars */}
          <path d="M35 15 Q35 25 25 25 Q35 25 35 35 Q35 25 45 25 Q35 25 35 15 Z" fill="currentColor" fillOpacity="0.4" strokeWidth="1.5" />
          <path d="M380 25 Q380 35 370 35 Q380 35 380 45 Q380 35 390 35 Q380 35 380 25 Z" fill="currentColor" fillOpacity="0.4" strokeWidth="1.5" />
          
          {/* Lotus Flower Bloom */}
          <g transform="translate(25, 22) scale(0.95)">
            <path d="M23 6 C23 19, 11 27, 23 35 C35 27, 23 19, 23 6 Z" fill="currentColor" fillOpacity="0.4" />
            <path d="M13 17 C7 25, 11 33, 23 35 C17 29, 15 21, 13 17 Z" fill="currentColor" fillOpacity="0.25" />
            <path d="M33 17 C39 25, 35 33, 23 35 C29 29, 31 21, 33 17 Z" fill="currentColor" fillOpacity="0.25" />
          </g>

          {/* Crescent Moon & Constellation Stars */}
          <g transform="translate(145, 18) scale(0.9)">
            <path d="M25 4 C15 4, 6 13, 6 23 C6 33, 15 42, 25 42 C29 42, 33 40, 37 38 C25 36, 19 25, 21 13 C22 9, 24 7, 25 4 Z" fill="currentColor" fillOpacity="0.35" />
            <circle cx="36" cy="11" r="2" fill="currentColor" />
            <circle cx="40" cy="22" r="2.5" fill="currentColor" />
          </g>

          {/* Zen Balanced Stones Stack */}
          <g transform="translate(265, 20) scale(0.9)">
            <ellipse cx="21" cy="35" rx="17" ry="6.5" fill="currentColor" fillOpacity="0.4" strokeWidth="2" />
            <ellipse cx="21" cy="24" rx="13" ry="5.5" fill="currentColor" fillOpacity="0.3" strokeWidth="2" />
            <ellipse cx="21" cy="15" rx="9" ry="4.5" fill="currentColor" fillOpacity="0.25" strokeWidth="2" />
            <ellipse cx="21" cy="8" rx="4.5" ry="3" fill="currentColor" fillOpacity="0.5" strokeWidth="2" />
          </g>

          {/* Soothing Tea Cup with Steam */}
          <g transform="translate(350, 20) scale(0.9)">
            <path d="M4 15 L7 29 C7 35, 27 35, 27 29 L30 15 Z" fill="currentColor" fillOpacity="0.3" />
            <path d="M30 17 C36 17, 36 25, 30 25" strokeWidth="2.2" />
            {/* Steam curves */}
            <path d="M12 4 Q14 9 12 13 M19 4 Q21 9 19 13" strokeWidth="2" />
          </g>

          {/* Meditation Breath Wave */}
          <g transform="translate(30, 135) scale(0.9)">
            <path d="M2 21 C11 11, 21 31, 31 21 C41 11, 51 31, 61 21" strokeWidth="2.8" />
            <path d="M7 29 C15 19, 25 39, 35 29 C45 19, 55 39, 65 29" strokeWidth="1.8" strokeDasharray="3 3" />
          </g>

          {/* Aromatherapy Candle with Warm Glow */}
          <g transform="translate(155, 135) scale(0.9)">
            <rect x="8" y="17" width="18" height="25" rx="3.5" fill="currentColor" fillOpacity="0.3" />
            <line x1="17" y1="17" x2="17" y2="11" strokeWidth="2.4" />
            <path d="M17 4 C15 7, 15 10, 17 11 C19 10, 19 7, 17 4 Z" fill="currentColor" />
          </g>

          {/* Fresh Plant Sprout of Growth */}
          <g transform="translate(265, 135) scale(0.9)">
            <path d="M17 40 L17 19" strokeWidth="3" />
            <path d="M17 27 C9 25, 4 17, 8 11 C15 11, 17 19, 17 27 Z" fill="currentColor" fillOpacity="0.4" strokeWidth="2" />
            <path d="M17 21 C25 19, 30 11, 26 5 C19 5, 17 13, 17 21 Z" fill="currentColor" fillOpacity="0.3" strokeWidth="2" />
          </g>

          {/* Sacred Mandala / Sunburst */}
          <g transform="translate(350, 140) scale(0.9)">
            <circle cx="19" cy="19" r="9" fill="currentColor" fillOpacity="0.3" />
            <circle cx="19" cy="19" r="15" strokeDasharray="3 3" strokeWidth="1.8" />
          </g>
        </svg>
      )}

      {/* 7. Ocio & Entretenimiento (Game Controller, Movies, Popcorn, Headphones, Joystick, Music Notes) */}
      {(categoryId === 'ocio_entretenimiento') && (
        <svg className="w-full h-full text-pink-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 250" fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {/* Hand-drawn Sparkle Stars */}
          <path d="M35 15 Q35 25 25 25 Q35 25 35 35 Q35 25 45 25 Q35 25 35 15 Z" fill="currentColor" fillOpacity="0.4" strokeWidth="1.5" />
          <path d="M380 25 Q380 35 370 35 Q380 35 380 45 Q380 35 390 35 Q380 35 380 25 Z" fill="currentColor" fillOpacity="0.4" strokeWidth="1.5" />
          
          {/* Game Controller */}
          <g transform="translate(25, 22) scale(0.95)">
            <path d="M9 13 C15 9, 36 9, 42 13 C47 15, 51 32, 45 38 C40 43, 34 36, 32 30 L19 30 C17 36, 11 43, 6 38 C0 32, 4 15, 9 13 Z" fill="currentColor" fillOpacity="0.3" />
            {/* D-pad */}
            <path d="M13 19 L17 19 M15 17 L15 21" strokeWidth="2.8" />
            {/* Action Buttons */}
            <circle cx="34" cy="18" r="2" fill="currentColor" />
            <circle cx="38" cy="22" r="2" fill="currentColor" />
          </g>

          {/* Clapperboard / Movie Scene */}
          <g transform="translate(145, 18) scale(0.9)">
            <rect x="4" y="11" width="36" height="28" rx="3.5" fill="currentColor" fillOpacity="0.25" />
            <path d="M4 11 L40 11 L36 3 L8 3 Z" fill="currentColor" fillOpacity="0.4" />
            <line x1="15" y1="3" x2="11" y2="11" strokeWidth="2" />
            <line x1="25" y1="3" x2="21" y2="11" strokeWidth="2" />
            <line x1="35" y1="3" x2="31" y2="11" strokeWidth="2" />
          </g>

          {/* Popcorn Bucket with Flying Popcorn */}
          <g transform="translate(265, 20) scale(0.9)">
            <path d="M8 17 L13 42 L29 42 L34 17 Z" fill="currentColor" fillOpacity="0.3" />
            <line x1="17" y1="17" x2="19" y2="42" strokeWidth="2" />
            <line x1="25" y1="17" x2="23" y2="42" strokeWidth="2" />
            <circle cx="15" cy="13" r="4.5" fill="currentColor" fillOpacity="0.5" />
            <circle cx="21" cy="11" r="4.5" fill="currentColor" fillOpacity="0.5" />
            <circle cx="27" cy="13" r="4.5" fill="currentColor" fillOpacity="0.5" />
          </g>

          {/* Headphones with Soundwaves */}
          <g transform="translate(350, 20) scale(0.9)">
            <path d="M6 23 A 15 15 0 0 1 36 23" strokeWidth="3" />
            <rect x="4" y="21" width="7" height="13" rx="3.5" fill="currentColor" />
            <rect x="31" y="21" width="7" height="13" rx="3.5" fill="currentColor" />
            {/* Audio wave sparks */}
            <path d="M42 22 Q45 25 42 28" strokeWidth="2" />
          </g>

          {/* Arcade Joystick */}
          <g transform="translate(35, 135) scale(0.9)">
            <rect x="4" y="23" width="34" height="17" rx="3.5" fill="currentColor" fillOpacity="0.25" />
            <line x1="15" y1="23" x2="15" y2="8" strokeWidth="3.5" />
            <circle cx="15" cy="8" r="5.5" fill="currentColor" fillOpacity="0.6" />
            <circle cx="27" cy="30" r="2.8" fill="currentColor" />
            <circle cx="33" cy="30" r="2.8" fill="currentColor" />
          </g>

          {/* VR Headset */}
          <g transform="translate(150, 135) scale(0.9)">
            <rect x="4" y="11" width="36" height="22" rx="7" fill="currentColor" fillOpacity="0.3" />
            <line x1="4" y1="22" x2="40" y2="22" strokeWidth="2.2" />
            <path d="M17 33 Q22 26 27 33" strokeWidth="2.2" />
          </g>

          {/* Star Review Rating */}
          <g transform="translate(265, 135) scale(0.9)">
            <polygon points="19,2 23,13 35,15 26,24 29,36 19,30 9,36 12,24 3,15 15,13" fill="currentColor" fillOpacity="0.35" strokeWidth="2" />
          </g>

          {/* Musical Notes & Melodies */}
          <g transform="translate(350, 140) scale(0.9)">
            <circle cx="11" cy="27" r="4.5" fill="currentColor" />
            <circle cx="28" cy="23" r="4.5" fill="currentColor" />
            <line x1="15" y1="27" x2="15" y2="10" strokeWidth="2.5" />
            <line x1="32" y1="23" x2="32" y2="6" strokeWidth="2.5" />
            <line x1="15" y1="10" x2="32" y2="6" strokeWidth="3.5" />
          </g>
        </svg>
      )}

      {/* 8. Finanzas Familiares & Hogar (Piggy bank, Coin stacks, Growth chart, Dollar shield, Vault, Key) */}
      {(categoryId === 'finanzas_hogar') && (
        <svg className="w-full h-full text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 250" fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {/* Hand-drawn Sparkle Stars */}
          <path d="M35 15 Q35 25 25 25 Q35 25 35 35 Q35 25 45 25 Q35 25 35 15 Z" fill="currentColor" fillOpacity="0.4" strokeWidth="1.5" />
          <path d="M380 25 Q380 35 370 35 Q380 35 380 45 Q380 35 390 35 Q380 35 380 25 Z" fill="currentColor" fillOpacity="0.4" strokeWidth="1.5" />
          
          {/* Piggy Bank with Coin Entry */}
          <g transform="translate(25, 22) scale(0.95)">
            <path d="M36 23 C36 12, 25 8, 15 11 C7 13, 2 19, 2 26 C2 34, 11 38, 21 38 L21 42 L27 42 L27 38 L32 38 L32 42 L38 42 L38 36 C40 34, 42 30, 42 26 Z" fill="currentColor" fillOpacity="0.3" />
            <circle cx="11" cy="20" r="2" fill="currentColor" />
            <line x1="17" y1="8" x2="26" y2="8" strokeWidth="3" />
            {/* Falling coin */}
            <circle cx="21.5" cy="2" r="3.5" fill="currentColor" fillOpacity="0.5" />
          </g>

          {/* Stacks of Golden Coins */}
          <g transform="translate(145, 18) scale(0.9)">
            <ellipse cx="21" cy="13" rx="15" ry="5.5" fill="currentColor" fillOpacity="0.4" strokeWidth="2" />
            <path d="M6 13 L6 22 C6 25, 36 25, 36 22 L36 13" fill="currentColor" fillOpacity="0.25" strokeWidth="2" />
            <path d="M6 22 L6 31 C6 34, 36 34, 36 31 L36 22" fill="currentColor" fillOpacity="0.25" strokeWidth="2" />
            <path d="M6 31 L6 40 C6 43, 36 43, 36 40 L36 31" fill="currentColor" fillOpacity="0.25" strokeWidth="2" />
          </g>

          {/* Growth Chart with Upward Trending Rocket/Arrow */}
          <g transform="translate(265, 20) scale(0.9)">
            <line x1="4" y1="38" x2="40" y2="38" strokeWidth="2.4" />
            <line x1="4" y1="4" x2="4" y2="38" strokeWidth="2.4" />
            <polyline points="6,32 17,23 25,28 38,10" strokeWidth="3" />
            <polyline points="30,10 38,10 38,18" strokeWidth="3" />
          </g>

          {/* Dollar Shield */}
          <g transform="translate(350, 20) scale(0.9)">
            <path d="M19 4 L36 11 L36 24 C36 35, 19 41, 19 41 C19 41, 2 35, 2 24 L2 11 Z" fill="currentColor" fillOpacity="0.3" strokeWidth="2" />
            <text x="13" y="27" fill="currentColor" fontSize="16" fontWeight="bold" fontFamily="sans-serif">$</text>
          </g>

          {/* Leather Wallet with Card */}
          <g transform="translate(35, 135) scale(0.9)">
            <rect x="4" y="11" width="36" height="26" rx="4.5" fill="currentColor" fillOpacity="0.25" />
            <path d="M28 20 C32 20, 40 20, 40 24 C40 28, 32 28, 28 28 Z" fill="currentColor" fillOpacity="0.5" strokeWidth="2" />
            <circle cx="34" cy="24" r="2" fill="currentColor" />
          </g>

          {/* Safe Vault Dial */}
          <g transform="translate(150, 135) scale(0.9)">
            <rect x="4" y="6" width="34" height="34" rx="5" fill="currentColor" fillOpacity="0.25" strokeWidth="2" />
            <circle cx="21" cy="23" r="9" fill="currentColor" fillOpacity="0.2" strokeWidth="2" />
            <circle cx="21" cy="23" r="3.5" fill="currentColor" />
            <line x1="21" y1="14" x2="21" y2="17" strokeWidth="2" />
            <line x1="21" y1="29" x2="21" y2="32" strokeWidth="2" />
            <line x1="12" y1="23" x2="15" y2="23" strokeWidth="2" />
            <line x1="27" y1="23" x2="30" y2="23" strokeWidth="2" />
          </g>

          {/* Home with House Key */}
          <g transform="translate(265, 135) scale(0.9)">
            <path d="M6 19 L21 6 L36 19 L32 19 L32 36 L10 36 L10 19 Z" fill="currentColor" fillOpacity="0.25" strokeWidth="2" />
            <circle cx="21" cy="25" r="3.5" fill="currentColor" fillOpacity="0.5" />
            <line x1="21" y1="28.5" x2="21" y2="34" strokeWidth="2.5" />
          </g>

          {/* Percentage % Badge */}
          <g transform="translate(350, 140) scale(0.9)">
            <circle cx="19" cy="19" r="15" fill="currentColor" fillOpacity="0.25" strokeWidth="2" />
            <line x1="25" y1="13" x2="13" y2="25" strokeWidth="2.4" />
            <circle cx="14" cy="14" r="2.5" fill="currentColor" />
            <circle cx="24" cy="24" r="2.5" fill="currentColor" />
          </g>
        </svg>
      )}
    </div>
  );
};
