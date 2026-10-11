export interface Habit {
  id: string;
  title: string;
  description?: string;
  category: string; // e.g. 'actividades_pendientes', 'salud_deporte', 'bienestar_mente', etc.
  icon?: string; // emoji or icon name
  frequency: 'daily' | 'weekdays' | 'weekends' | 'custom';
  targetDaysPerWeek?: number; // default 7 for daily
  targetTime?: string; // '08:00', '19:00', etc.
  targetDurationMinutes?: number; // e.g. 30 for walking 30 min, 15 for sweeping
  completedDates: string[]; // List of 'YYYY-MM-DD' strings when this habit was completed
  streak: number; // Current continuous streak in days
  bestStreak: number; // Highest continuous streak achieved
  color?: string; // Hex color or badge accent
  createdAt: string; // YYYY-MM-DD
  archived?: boolean;
  userId?: string;
}

export type HabitFilter = 'all' | 'today_pending' | 'today_completed' | 'archived';
