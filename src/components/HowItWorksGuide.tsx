import React, { useState } from 'react';
import { 
  Target, 
  CalendarDays, 
  Timer, 
  BarChart3, 
  Lightbulb, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Zap
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HowItWorksGuideProps {
  onOpenNewTaskModal?: () => void;
  onScrollToCollections?: () => void;
}

export function HowItWorksGuide({ onOpenNewTaskModal, onScrollToCollections }: HowItWorksGuideProps) {
  const { isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeflow_guide_expanded_v1');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const toggleExpanded = () => {
    setIsExpanded((prev: boolean) => {
      const next = !prev;
      try {
        localStorage.setItem('lifeflow_guide_expanded_v1', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const steps = [
    {
      step: '01',
      title: 'Banco de Ideas & Colecciones',
      desc: 'Anota al instante cualquier idea, recomendación (series, libros, videojuegos, planes de ahorro) o proyecto espontáneo en la sección Colecciones para no olvidarlo.',
      icon: Lightbulb,
      iconColor: isDark ? 'text-[#00f2ff]' : 'text-sky-600',
      borderColor: isDark ? 'border-[#00f2ff]/30' : 'border-sky-200',
      bgColor: isDark ? 'bg-[#00f2ff]/5' : 'bg-sky-50/80',
      badgeBg: isDark ? 'bg-[#00f2ff]/15 text-[#00f2ff]' : 'bg-sky-100 text-sky-800 border border-sky-300 font-bold',
      iconContainer: isDark ? 'bg-[#0b1326]/80 border-slate-700/60' : 'bg-white border-sky-200 shadow-xs'
    },
    {
      step: '02',
      title: 'Define tus Metas & Sub-objetivos',
      desc: 'Convierte tus ideas en metas claras dentro de las 6 áreas de vida (Salud, Familia, Aprendizaje, Mente, Ocio y Finanzas) y desglósalas en pasos concretos.',
      icon: Target,
      iconColor: isDark ? 'text-[#38ef7d]' : 'text-emerald-600',
      borderColor: isDark ? 'border-[#38ef7d]/30' : 'border-emerald-200',
      bgColor: isDark ? 'bg-[#38ef7d]/5' : 'bg-emerald-50/80',
      badgeBg: isDark ? 'bg-[#38ef7d]/15 text-[#38ef7d]' : 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold',
      iconContainer: isDark ? 'bg-[#0b1326]/80 border-slate-700/60' : 'bg-white border-emerald-200 shadow-xs'
    },
    {
      step: '03',
      title: 'Planifica & Agenda en el Calendario',
      desc: 'Asigna fecha y bloque horario a tus tareas para apartar tiempo real en tu semana y visualízalas organizadas en la pestaña Calendario.',
      icon: CalendarDays,
      iconColor: isDark ? 'text-amber-400' : 'text-amber-600',
      borderColor: isDark ? 'border-amber-500/30' : 'border-amber-200',
      bgColor: isDark ? 'bg-amber-500/5' : 'bg-amber-50/80',
      badgeBg: isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-100 text-amber-800 border border-amber-300 font-bold',
      iconContainer: isDark ? 'bg-[#0b1326]/80 border-slate-700/60' : 'bg-white border-amber-200 shadow-xs'
    },
    {
      step: '04',
      title: 'Registra tus Horas & Analiza',
      desc: 'Haz clic en "Registrar Horas" para contabilizar el tiempo real invertido en cada meta y consulta tus gráficos de equilibrio de vida en Métricas.',
      icon: Timer,
      iconColor: isDark ? 'text-pink-400' : 'text-rose-600',
      borderColor: isDark ? 'border-pink-500/30' : 'border-rose-200',
      bgColor: isDark ? 'bg-pink-500/5' : 'bg-rose-50/80',
      badgeBg: isDark ? 'bg-pink-500/15 text-pink-300' : 'bg-rose-100 text-rose-800 border border-rose-300 font-bold',
      iconContainer: isDark ? 'bg-[#0b1326]/80 border-slate-700/60' : 'bg-white border-rose-200 shadow-xs'
    }
  ];

  return (
    <div className={`rounded-3xl p-5 sm:p-6 transition-all ${
      isDark 
        ? 'bg-[#131b2e]/90 border border-[#2d3449] shadow-xl backdrop-blur-md' 
        : 'bg-gradient-to-br from-white via-slate-50 to-sky-50/40 border border-slate-200 shadow-md'
    }`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-inner ${
            isDark 
              ? 'bg-gradient-to-br from-[#00f2ff]/20 to-[#38ef7d]/20 border-[#00f2ff]/40 text-[#00f2ff]' 
              : 'bg-gradient-to-br from-sky-500/15 to-teal-500/15 border-sky-400/40 text-sky-600'
          }`}>
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                ¿Cómo funciona LifeBlocks?
              </h3>
              <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full border ${
                isDark 
                  ? 'bg-[#00f2ff]/15 text-[#00f2ff] border-[#00f2ff]/30' 
                  : 'bg-sky-100 text-sky-800 border-sky-300'
              }`}>
                Guía de uso
              </span>
            </div>
            <p className={`text-xs font-sans hidden sm:block ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
              Aprende cómo estructurar tus metas, reservar tiempo y equilibrar todas tus áreas de vida.
            </p>
          </div>
        </div>

        <button
          onClick={toggleExpanded}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer shrink-0 ${
            isDark 
              ? 'bg-[#0b1326] border-[#2d3449] hover:border-[#00f2ff]/50 text-slate-300 hover:text-white' 
              : 'bg-white border-slate-300 hover:border-sky-400 text-slate-700 hover:text-slate-900 shadow-xs'
          }`}
        >
          <span>{isExpanded ? 'Ocultar guía' : 'Ver cómo funciona'}</span>
          {isExpanded ? (
            <ChevronUp className={`w-3.5 h-3.5 ${isDark ? 'text-[#00f2ff]' : 'text-sky-600'}`} />
          ) : (
            <ChevronDown className={`w-3.5 h-3.5 ${isDark ? 'text-[#00f2ff]' : 'text-sky-600'}`} />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className={`mt-5 space-y-4 pt-4 border-t ${isDark ? 'border-[#2d3449]/70' : 'border-slate-200'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {steps.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border ${item.borderColor} ${item.bgColor} flex flex-col justify-between space-y-3 hover:scale-[1.01] transition-all`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-mono font-black px-2 py-0.5 rounded-lg ${item.badgeBg}`}>
                      Paso {item.step}
                    </span>
                    <div className={`p-2 rounded-xl border ${item.iconContainer} ${item.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className={`text-sm font-bold leading-snug ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      {item.title}
                    </h4>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`flex flex-wrap items-center justify-between gap-3 pt-3 px-1 text-xs border-t ${
            isDark ? 'text-slate-300 border-[#2d3449]/50' : 'text-slate-700 border-slate-200 font-medium'
          }`}>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${isDark ? 'text-[#38ef7d]' : 'text-emerald-600'}`} />
              <span>
                <strong className={isDark ? 'text-white' : 'text-slate-900 font-bold'}>Consejo Pro:</strong> Puedes sincronizar tus datos con tu cuenta para acceder desde cualquier dispositivo.
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onScrollToCollections && (
                <button
                  onClick={onScrollToCollections}
                  className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl border font-mono text-xs transition-all cursor-pointer ${
                    isDark 
                      ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-[#2d3449]' 
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
                  }`}
                >
                  <Lightbulb className={`w-3.5 h-3.5 ${isDark ? 'text-[#00f2ff]' : 'text-sky-600'}`} />
                  <span>Ir al Banco de Ideas</span>
                </button>
              )}
              {onOpenNewTaskModal && (
                <button
                  onClick={onOpenNewTaskModal}
                  className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl border font-bold transition-all cursor-pointer ${
                    isDark 
                      ? 'bg-[#00f2ff]/15 hover:bg-[#00f2ff]/25 text-[#00f2ff] border-[#00f2ff]/30' 
                      : 'bg-sky-600 hover:bg-sky-700 text-white border-sky-600 shadow-xs'
                  }`}
                >
                  <span>Crear meta ahora</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
