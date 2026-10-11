import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Download, 
  Share, 
  PlusSquare, 
  CheckCircle2, 
  X, 
  Sparkles, 
  Zap, 
  WifiOff, 
  Bell, 
  ExternalLink 
} from 'lucide-react';
import { APP_LOGO } from '../data/initialData';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios'>('android');

  useEffect(() => {
    // Detect if running on iOS
    const isIosDevice = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    if (isIosDevice) {
      setActivePlatform('ios');
    }

    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-[#0d1527] border border-[#24345c] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="relative p-6 bg-gradient-to-br from-[#121f3d] via-[#0e1933] to-[#091024] border-b border-[#24345c] overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-3.5">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-cyan-400/40 shadow-lg shadow-cyan-500/20 bg-[#0b1326] p-1 shrink-0">
              <img src={APP_LOGO} alt="LifeBlocks" className="w-full h-full object-cover rounded-xl" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  PWA OFICIAL
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">● DISPONIBLE</span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight mt-1 font-mono">
                Instalar LifeBlocks en tu Celular
              </h2>
              <p className="text-xs text-slate-300 font-sans">
                Acceso directo desde tu pantalla de inicio, a pantalla completa y sin barras de navegador.
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto scrollbar-thin">
          
          {/* Features Strip */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#131f3f] border border-[#233256] text-center">
              <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <div className="text-[11px] font-bold text-white">100% Rápida</div>
              <div className="text-[9px] text-slate-400">Carga instantánea</div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#131f3f] border border-[#233256] text-center">
              <Smartphone className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
              <div className="text-[11px] font-bold text-white">Full Screen</div>
              <div className="text-[9px] text-slate-400">Experiencia nativa</div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#131f3f] border border-[#233256] text-center">
              <Sparkles className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <div className="text-[11px] font-bold text-white">Asistente IA</div>
              <div className="text-[9px] text-slate-400">Captura por voz</div>
            </div>
          </div>

          {/* Platform Switcher */}
          <div className="flex items-center p-1 bg-[#10192e] rounded-2xl border border-[#24345c]">
            <button
              onClick={() => setActivePlatform('android')}
              className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                activePlatform === 'android'
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🤖 Android (Google Chrome)</span>
            </button>
            <button
              onClick={() => setActivePlatform('ios')}
              className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                activePlatform === 'ios'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🍎 iPhone / iPad (Safari)</span>
            </button>
          </div>

          {/* Android Direct Prompt if available */}
          {activePlatform === 'android' && deferredPrompt && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border border-emerald-500/40 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-emerald-300 font-mono">¡Instalación 1-Clic Lista!</div>
                <div className="text-[11px] text-slate-300">Tu navegador permite instalar LifeBlocks directamente.</div>
              </div>
              <button
                onClick={handleNativeInstall}
                className="px-4 py-2 bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] text-[#00363a] font-extrabold text-xs font-mono rounded-xl shadow-lg shadow-emerald-500/30 flex items-center space-x-1.5 shrink-0 hover:brightness-110 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar Ahora</span>
              </button>
            </div>
          )}

          {/* Platform Step-by-Step Instructions */}
          {activePlatform === 'android' ? (
            <div className="space-y-2.5 text-xs text-slate-300 font-sans">
              <div className="p-3.5 rounded-2xl bg-[#111c36] border border-[#213054] flex items-start space-x-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-500/30">
                  1
                </span>
                <div>
                  <div className="font-bold text-white font-mono">Abre en Google Chrome</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Abre el enlace de LifeBlocks en tu navegador Chrome o Brave en Android.
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#111c36] border border-[#213054] flex items-start space-x-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-500/30">
                  2
                </span>
                <div>
                  <div className="font-bold text-white font-mono">Toca los 3 puntos (⋮) arriba</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Abre el menú de opciones en la esquina superior derecha del navegador.
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#111c36] border border-[#213054] flex items-start space-x-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-500/30">
                  3
                </span>
                <div>
                  <div className="font-bold text-white font-mono">Selecciona «Instalar aplicación»</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    O «Agregar a la pantalla principal». Se creará el icono oficial en tu escritorio.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 text-xs text-slate-300 font-sans">
              <div className="p-3.5 rounded-2xl bg-[#111c36] border border-[#213054] flex items-start space-x-3">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-cyan-500/30">
                  1
                </span>
                <div>
                  <div className="font-bold text-white font-mono">Abre en Safari</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Asegúrate de estar en el navegador Safari de tu iPhone o iPad.
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#111c36] border border-[#213054] flex items-start space-x-3">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-cyan-500/30">
                  2
                </span>
                <div>
                  <div className="font-bold text-white font-mono flex items-center space-x-1">
                    <span>Toca el botón «Compartir»</span>
                    <Share className="w-3.5 h-3.5 text-cyan-400 inline" />
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Es el icono del cuadrado con la flecha hacia arriba en la barra inferior de Safari.
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#111c36] border border-[#213054] flex items-start space-x-3">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-cyan-500/30">
                  3
                </span>
                <div>
                  <div className="font-bold text-white font-mono flex items-center space-x-1">
                    <span>Elige «Agregar a Inicio»</span>
                    <PlusSquare className="w-3.5 h-3.5 text-cyan-400 inline" />
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Desplázate hacia abajo en el menú y presiona «Agregar a Inicio» (Add to Home Screen).
                  </div>
                </div>
              </div>
            </div>
          )}

          {isInstalled && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center space-x-2 text-xs font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>LifeBlocks ya se encuentra instalada en este dispositivo.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#090f1d] border-t border-[#24345c] flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            Sin ocupar espacio extra • Actualizaciones automáticas
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
