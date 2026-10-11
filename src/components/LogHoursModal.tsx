import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { X, Clock, Target, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LogHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onUpdateProgress: (taskId: string, newHours: number, newMetric: number, markCompleted?: boolean) => void;
}

export const LogHoursModal: React.FC<LogHoursModalProps> = ({
  isOpen,
  onClose,
  task,
  onUpdateProgress,
}) => {
  const [hours, setHours] = useState(0);
  const [metricValue, setMetricValue] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (task) {
      setHours(task.completedHours || 0);
      setMetricValue(task.currentMetricValue || 0);
      setIsCompleted(task.status === 'completada');
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const willBeCompleted = isCompleted || (task.targetMetricValue ? metricValue >= task.targetMetricValue : false);
    
    if (willBeCompleted && task.status !== 'completada') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    onUpdateProgress(task.id, Number(hours) || 0, Number(metricValue) || 0, willBeCompleted);
    onClose();
  };

  const progressPct = task.estimatedHours > 0 
    ? Math.min(100, Math.round((hours / task.estimatedHours) * 100))
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#131b2e] border border-[#2d3449] w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-[#2d3449] pb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-base">Registrar Avance & Horas</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <p className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-1">Tarea Seleccionada</p>
          <p className="font-semibold text-slate-100 text-sm">{task.title}</p>
          {task.finalGoal && (
            <p className="text-xs text-cyan-300 mt-1 flex items-center space-x-1">
              <Target className="w-3.5 h-3.5 inline mr-1" />
              <span>Meta: {task.finalGoal}</span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-[#0b1326] border border-[#2d3449] rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-mono text-emerald-400 font-bold">Horas Invertidas Actuales</label>
              <span className="text-slate-400">Total Est.: {task.estimatedHours}h ({progressPct}%)</span>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="0"
                step="0.5"
                max={task.estimatedHours * 3}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="flex-1 px-3 py-2 bg-[#171f33] border border-[#2d3449] focus:border-emerald-400 rounded-lg text-slate-100 font-mono text-sm"
              />
              <span className="text-xs font-mono text-slate-400">horas</span>
            </div>
            {/* Quick adjust buttons */}
            <div className="flex space-x-2 pt-1">
              {[+0.5, +1, +2, +4].map((add) => (
                <button
                  key={add}
                  type="button"
                  onClick={() => setHours((prev) => Math.max(0, prev + add))}
                  className="px-2 py-1 bg-[#171f33] hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-xs font-mono"
                >
                  +{add}h
                </button>
              ))}
            </div>
          </div>

          {task.targetMetricValue && task.targetMetricValue > 0 && (
            <div className="p-3 bg-[#0b1326] border border-[#2d3449] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-mono text-cyan-400 font-bold">Avance de Meta Final</label>
                <span className="text-slate-400">Objetivo: {task.targetMetricValue} {task.metricUnit}</span>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  min="0"
                  max={task.targetMetricValue * 2}
                  value={metricValue}
                  onChange={(e) => setMetricValue(Number(e.target.value))}
                  className="flex-1 px-3 py-2 bg-[#171f33] border border-[#2d3449] focus:border-[#00f2ff] rounded-lg text-slate-100 font-mono text-sm"
                />
                <span className="text-xs font-mono text-slate-400">{task.metricUnit}</span>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="markCompleted"
              checked={isCompleted}
              onChange={(e) => setIsCompleted(e.target.checked)}
              className="w-4 h-4 accent-[#00f2ff] rounded cursor-pointer"
            />
            <label htmlFor="markCompleted" className="text-xs text-slate-200 cursor-pointer select-none font-medium">
              Marcar tarea y meta como COMPLETADA 🎉
            </label>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-1"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar Avance</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
