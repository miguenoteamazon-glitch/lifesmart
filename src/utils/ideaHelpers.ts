import { IdeaStatus } from '../types';

/**
 * Calculates calendar days elapsed between createdAt and now
 */
export function getIdeaAgeDays(createdAt: string): number {
  if (!createdAt) return 0;
  try {
    const createdDate = new Date(createdAt);
    if (isNaN(createdDate.getTime())) return 0;
    
    const now = new Date();
    // Compare dates based on UTC calendar midnight to avoid hour timezone drift
    const utcCreated = Date.UTC(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
    const utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffMs = utcNow - utcCreated;
    const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    return diffDays;
  } catch {
    return 0;
  }
}

export type IdeaAgeCategory = 'recent' | 'moderate' | 'aged';

/**
 * Determines aging tier:
 * - 'recent': < 7 days (fresh)
 * - 'moderate': 7 to 29 days (normal)
 * - 'aged': >= 30 days (CRITICAL COLOR CHANGE to alert the user)
 */
export function getIdeaAgeCategory(days: number): IdeaAgeCategory {
  if (days >= 30) return 'aged';
  if (days >= 7) return 'moderate';
  return 'recent';
}

/**
 * Returns formatted text label for elapsed age
 */
export function formatIdeaAge(days: number): string {
  if (days === 0) return 'Hoy (< 24h)';
  if (days === 1) return 'Hace 1 día';
  if (days >= 30) {
    const months = Math.floor(days / 30);
    return `${days} días (+${months}m)`;
  }
  return `${days} días`;
}

/**
 * Visual styling classes for the time counter badge
 */
export function getIdeaAgeBadgeStyle(days: number, isDark: boolean): {
  containerClass: string;
  badgeClass: string;
  dotClass: string;
  icon: string;
  iconColor: string;
  label: string;
  isOver30Days: boolean;
} {
  const category = getIdeaAgeCategory(days);

  if (category === 'aged') {
    const cls = isDark
      ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 shadow-sm shadow-rose-500/20 ring-1 ring-rose-500/40 animate-pulse'
      : 'bg-rose-50 text-rose-800 border-rose-400 shadow-sm ring-1 ring-rose-300 animate-pulse';
    return {
      containerClass: cls,
      badgeClass: cls,
      dotClass: 'bg-rose-500 animate-ping',
      icon: '🔥',
      iconColor: 'text-rose-400',
      label: `${days} días (¡+30d!)`,
      isOver30Days: true,
    };
  }

  if (category === 'moderate') {
    const cls = isDark
      ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
      : 'bg-amber-50 text-amber-800 border-amber-300';
    return {
      containerClass: cls,
      badgeClass: cls,
      dotClass: 'bg-amber-400',
      icon: '⏳',
      iconColor: 'text-amber-400',
      label: `${days} días`,
      isOver30Days: false,
    };
  }

  const cls = isDark
    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    : 'bg-emerald-50 text-emerald-800 border-emerald-300';
  return {
    containerClass: cls,
    badgeClass: cls,
    dotClass: 'bg-emerald-400',
    icon: '🌱',
    iconColor: 'text-emerald-400',
    label: days === 0 ? 'Hoy' : `${days} días`,
    isOver30Days: false,
  };
}

/**
 * Returns visual config for status (pendiente, 50%, hecha)
 */
export function getIdeaStatusConfig(status?: IdeaStatus, isDark?: boolean) {
  const normalized: IdeaStatus = status || 'pendiente';

  switch (normalized) {
    case 'hecha':
      return {
        key: 'hecha' as const,
        label: 'Hecha',
        shortLabel: 'Hecha',
        badgeClass: isDark
          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          : 'bg-emerald-100 text-emerald-800 border-emerald-300',
        activeBtnClass: isDark
          ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500 font-bold shadow-sm'
          : 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm',
        iconName: 'check-circle' as const,
        colorHex: '#10b981',
      };
    case '50%':
      return {
        key: '50%' as const,
        label: '50% (En Proceso)',
        shortLabel: '50%',
        badgeClass: isDark
          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          : 'bg-amber-100 text-amber-800 border-amber-300',
        activeBtnClass: isDark
          ? 'bg-amber-500/30 text-amber-300 border-amber-500 font-bold shadow-sm'
          : 'bg-amber-500 text-white border-amber-500 font-bold shadow-sm',
        iconName: 'half-circle' as const,
        colorHex: '#f59e0b',
      };
    case 'pendiente':
    default:
      return {
        key: 'pendiente' as const,
        label: 'Pendiente',
        shortLabel: 'Pendiente',
        badgeClass: isDark
          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
          : 'bg-sky-100 text-sky-800 border-sky-300',
        activeBtnClass: isDark
          ? 'bg-sky-500/30 text-sky-300 border-sky-500 font-bold shadow-sm'
          : 'bg-sky-600 text-white border-sky-600 font-bold shadow-sm',
        iconName: 'clock' as const,
        colorHex: '#0284c7',
      };
  }
}
