import React, { useEffect, useState } from 'react';
import { Sparkles, X, ArrowRight, Volume2, VolumeX, Bot, CheckCircle2 } from 'lucide-react';
import { 
  speakAssistantMessage, 
  isAssistantVoiceEnabled, 
  setAssistantVoiceEnabled,
  formatIdeaAssignmentAnnouncement
} from '../utils/speechHelper';

export interface IdeaAnnouncementData {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  typeLabel?: string;
  timestamp: number;
}

interface AssistantIdeaAnnouncementToastProps {
  announcement: IdeaAnnouncementData | null;
  onClose: () => void;
  onNavigateToCategory?: (categoryId: string) => void;
}

export const AssistantIdeaAnnouncementToast: React.FC<AssistantIdeaAnnouncementToastProps> = ({
  announcement,
  onClose,
  onNavigateToCategory,
}) => {
  const [voiceEnabled, setVoiceEnabled] = useState(isAssistantVoiceEnabled());
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!announcement) return;

    // Trigger spoken announcement
    const textToSpeak = formatIdeaAssignmentAnnouncement(
      announcement.title,
      announcement.categoryName,
      announcement.typeLabel
    );

    if (voiceEnabled) {
      setIsSpeaking(true);
      speakAssistantMessage(textToSpeak, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
      });
    }

    // Auto dismiss toast after 6.5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 6500);

    return () => clearTimeout(timer);
  }, [announcement?.id]);

  if (!announcement) return null;

  const handleReplayVoice = () => {
    const textToSpeak = formatIdeaAssignmentAnnouncement(
      announcement.title,
      announcement.categoryName,
      announcement.typeLabel
    );
    setIsSpeaking(true);
    speakAssistantMessage(textToSpeak, {
      force: true,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  };

  const handleToggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    setAssistantVoiceEnabled(next);
  };

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="relative p-4 sm:p-5 rounded-2xl bg-[#0e1629]/95 backdrop-blur-xl border-2 border-[#00f2ff]/60 shadow-2xl shadow-[#00f2ff]/25 text-slate-100 overflow-hidden">
        
        {/* Glowing top line accent */}
        <div 
          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00f2ff] via-emerald-400 to-[#00f2ff] animate-pulse"
        />

        <div className="flex items-start space-x-3.5">
          {/* AI Coach Animated Avatar */}
          <div className="relative shrink-0 mt-0.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00f2ff]/20 to-teal-400/20 border border-[#00f2ff]/50 flex items-center justify-center text-[#00f2ff] shadow-md shadow-[#00f2ff]/30">
              <Bot className={`w-5 h-5 ${isSpeaking ? 'animate-bounce text-[#38ef7d]' : 'animate-pulse'}`} />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0e1629] flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </span>
          </div>

          {/* Main Message Content */}
          <div className="flex-1 min-w-0 pr-1 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00f2ff] to-emerald-300 font-mono uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#00f2ff]" />
                  Asistente LifeBlocks
                </span>
                {isSpeaking && (
                  <span className="px-1.5 py-0.2 rounded-md bg-[#00f2ff]/20 text-[#00f2ff] text-[9px] font-mono font-bold animate-pulse">
                    Hablando 🎙️
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={handleReplayVoice}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-[#00f2ff] transition-colors cursor-pointer"
                  title="Escuchar de nuevo con voz"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                    voiceEnabled ? 'text-cyan-300 hover:bg-cyan-900/30' : 'text-slate-500 hover:bg-slate-800'
                  }`}
                  title={voiceEnabled ? 'Voz activada (clic para silenciar)' : 'Voz silenciada (clic para activar)'}
                >
                  {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Spoken Announcement Text */}
            <p className="text-xs sm:text-sm text-slate-200 font-sans leading-snug">
              He asignado tu idea <span className="font-bold text-white">"{announcement.title}"</span> a la categoría de{' '}
              <span 
                className="font-extrabold px-1.5 py-0.5 rounded-md text-[#00f2ff] bg-cyan-950/60 border border-cyan-500/30 inline-block"
              >
                {announcement.categoryName}
              </span>
              {announcement.typeLabel && (
                <span className="text-slate-400 text-xs ml-1">
                  ({announcement.typeLabel})
                </span>
              )}
            </p>

            {/* Quick Action Navigation to the Category */}
            {onNavigateToCategory && (
              <div className="pt-1 flex items-center justify-between">
                <span className="text-[11px] text-emerald-400 flex items-center space-x-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Guardada en el banco</span>
                </span>

                <button
                  type="button"
                  onClick={() => {
                    onNavigateToCategory(announcement.categoryId);
                    onClose();
                  }}
                  className="inline-flex items-center space-x-1 text-xs font-bold text-[#00f2ff] hover:text-cyan-200 transition-colors cursor-pointer group"
                >
                  <span>Abrir colección</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
