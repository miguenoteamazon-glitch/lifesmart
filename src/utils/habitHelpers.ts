import { Habit } from '../types';

/**
 * Returns formatted YYYY-MM-DD string for today or offset date
 */
export function getTodayDateString(offsetDays: number = 0): string {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the last N dates including today formatted as YYYY-MM-DD
 */
export function getLastNDays(count: number = 7): { dateStr: string; dayName: string; dayNumber: number; isToday: boolean }[] {
  const result = [];
  const daysShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const todayStr = getTodayDateString();

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    result.push({
      dateStr,
      dayName: daysShort[d.getDay()],
      dayNumber: d.getDate(),
      isToday: dateStr === todayStr,
    });
  }
  return result;
}

/**
 * Checks if a habit was completed on a specific date
 */
export function isHabitCompletedOn(habit: Habit, dateStr: string): boolean {
  if (!habit.completedDates || !Array.isArray(habit.completedDates)) return false;
  return habit.completedDates.includes(dateStr);
}

/**
 * Calculates current streak and best streak based on completed dates
 */
export function calculateHabitStreak(completedDates: string[]): { streak: number; bestStreak: number } {
  if (!completedDates || completedDates.length === 0) {
    return { streak: 0, bestStreak: 0 };
  }

  const sorted = Array.from(new Set(completedDates)).sort();
  const todayStr = getTodayDateString();
  const yesterdayStr = getTodayDateString(-1);

  // Check if today or yesterday is completed
  const hasToday = sorted.includes(todayStr);
  const hasYesterday = sorted.includes(yesterdayStr);

  let currentStreak = 0;
  if (hasToday || hasYesterday) {
    let checkDate = new Date();
    if (!hasToday && hasYesterday) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const year = checkDate.getFullYear();
      const month = String(checkDate.getMonth() + 1).padStart(2, '0');
      const day = String(checkDate.getDate()).padStart(2, '0');
      const checkStr = `${year}-${month}-${day}`;

      if (sorted.includes(checkStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate maximum all-time streak
  let maxStreak = 0;
  let running = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      running = 1;
    } else {
      const prev = new Date(sorted[i - 1] + 'T00:00:00');
      const curr = new Date(sorted[i] + 'T00:00:00');
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        running++;
      } else if (diffDays > 1) {
        running = 1;
      }
    }
    if (running > maxStreak) {
      maxStreak = running;
    }
  }

  return {
    streak: currentStreak,
    bestStreak: Math.max(maxStreak, currentStreak),
  };
}

/**
 * Calculates overall today completion rate for active habits
 */
export function getHabitsTodayStats(habits: Habit[]) {
  const activeHabits = habits.filter((h) => !h.archived);
  const todayStr = getTodayDateString();
  const total = activeHabits.length;
  const completedCount = activeHabits.filter((h) => isHabitCompletedOn(h, todayStr)).length;
  const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const totalCompletedAllTime = activeHabits.reduce(
    (sum, h) => sum + (Array.isArray(h.completedDates) ? h.completedDates.length : 0),
    0
  );

  const bestStreakOverall = activeHabits.reduce(
    (max, h) => Math.max(max, h.bestStreak || 0, h.streak || 0),
    0
  );

  return {
    total,
    completedCount,
    pendingCount: total - completedCount,
    percentage,
    totalCompletedAllTime,
    bestStreakOverall,
  };
}
