import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { Timer, Clock } from 'lucide-react';

interface TaskLiveTimerProps {
  task: Task;
  compact?: boolean;
  className?: string;
  showLabel?: boolean;
}

export function formatDurationSeconds(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0s';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

export function getTaskStartTime(task: Task): number {
  if (!task.createdAt) return Date.now();
  // If ISO string like 2026-10-01T...
  const parsed = new Date(task.createdAt).getTime();
  if (!isNaN(parsed) && parsed > 0) {
    // If it's just a date like "2026-10-01", it parses to 00:00:00 UTC.
    // If the difference is huge (> 30 days) or in the future, clamp
    const now = Date.now();
    if (parsed > now) return now;
    return parsed;
  }
  return Date.now();
}

export const TaskLiveTimer: React.FC<TaskLiveTimerProps> = ({
  task,
  compact = false,
  className = '',
  showLabel = true,
}) => {
  const isCompleted = task.status === 'completada';

  // Calculate initial elapsed
  const getElapsedSeconds = () => {
    if (isCompleted) {
      if (task.durationSeconds && task.durationSeconds > 0) {
        return task.durationSeconds;
      }
      if (task.resolutionMinutes && task.resolutionMinutes > 0) {
        return task.resolutionMinutes * 60;
      }
      // If completedAt and createdAt are available
      if (task.completedAtTimestamp && task.createdAt) {
        const compTime = new Date(task.completedAtTimestamp).getTime();
        const start = getTaskStartTime(task);
        if (compTime > start) {
          return Math.floor((compTime - start) / 1000);
        }
      }
      return 1800; // default 30m if completed with no record
    }

    const start = getTaskStartTime(task);
    const now = Date.now();
    return Math.max(0, Math.floor((now - start) / 1000));
  };

  const [elapsed, setElapsed] = useState<number>(getElapsedSeconds);

  useEffect(() => {
    // If completed, no need to tick interval
    if (isCompleted) {
      setElapsed(getElapsedSeconds());
      return;
    }

    // Tick every second for pending / in-progress tasks
    setElapsed(getElapsedSeconds());
    const interval = setInterval(() => {
      setElapsed(getElapsedSeconds());
    }, 1000);

    return () => clearInterval(interval);
  }, [isCompleted, task.createdAt, task.durationSeconds, task.resolutionMinutes]);

  const formattedTime = formatDurationSeconds(elapsed);

  if (isCompleted) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md font-mono text-[9px] sm:text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/50 shadow-[0_0_8px_rgba(249,115,22,0.3)] transition-all shrink-0 ${className}`}
        title={`Duración final de la tarea: ${formattedTime}`}
      >
        <Timer className="w-3 h-3 text-orange-400 shrink-0" />
        <span>{showLabel ? `Duración: ${formattedTime}` : formattedTime}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 rounded-md font-mono text-[9px] sm:text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-400/40 shadow-xs transition-all shrink-0 ${className}`}
      title="Cronómetro en vivo: Tiempo transcurrido desde que se creó la tarea (se congelará al completarla)"
    >
      <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-cyan-400"></span>
      </span>
      <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-400 shrink-0" />
      <span>{showLabel ? (!compact ? `En curso: ${formattedTime}` : formattedTime) : formattedTime}</span>
    </span>
  );
};
