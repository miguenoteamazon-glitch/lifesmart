import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Lightbulb, 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  X, 
  Check, 
  Share2, 
  Key, 
  Copy, 
  Terminal, 
  Smartphone,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { IdeaItem, CategoryInfo } from '../types';
import { classifyVoiceIdea } from '../utils/voiceClassifier';

interface FloatingAgentWidgetProps {
  onOpenAgentChat: () => void;
  onOpenVoiceIdeaModal: () => void;
  onOpenAssistantIntegration?: () => void;
  onSaveIdeaDirectly: (idea: Omit<IdeaItem, 'id' | 'createdAt'>) => void;
  onConvertIdeaToTask: (idea: IdeaItem) => void;
  categories: CategoryInfo[];
  todayTasksCount: number;
}

export const FloatingAgentWidget: React.FC<FloatingAgentWidgetProps> = ({
  onOpenAgentChat,
  onOpenVoiceIdeaModal,
  onOpenAssistantIntegration,
  onSaveIdeaDirectly,
  onConvertIdeaToTask,
  categories,
  todayTasksCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showWebhookGuide, setShowWebhookGuide] = useState(false);
  const [quickText, setQuickText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [lastCreatedIdea, setLastCreatedIdea] = useState<any | null>(null);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/webhook/idea` : 'https://lifeblocks.ai.studio/api/webhook/idea';

  // Focus input when popover opens
  useEffect(() => {
    if (isOpen && inputRef.current && !showWebhookGuide) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, showWebhookGuide]);

  // Voice recording handler
  const toggleVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta reconocimiento por voz. Puedes escribir tu idea directamente.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setQuickText(currentTranscript);
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  // Submit quick idea directly to the assistant
  const handleSubmitIdea = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickText.trim() || isProcessing) return;

    const rawText = quickText.trim();
    setIsProcessing(true);

    try {
      // Analyze & classify with rule-based NLP + smart keywords
      const analysis = classifyVoiceIdea(rawText);

      const ideaToSave = {
        title: analysis.title || rawText,
        description: analysis.description || `Capturado para el asistente: "${rawText}"`,
        categoryId: analysis.categoryId || 'salud_deporte',
        type: analysis.type || 'idea',
      };

      onSaveIdeaDirectly(ideaToSave);
      setLastCreatedIdea({
        ...ideaToSave,
        id: `idea-${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0],
      });
      setQuickText('');
      setShowSuccessNotification(true);

      setTimeout(() => {
        setShowSuccessNotification(false);
      }, 5000);
    } catch (err) {
      console.error('Error saving floating idea:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyWebhookSnippet = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      
      {/* Expanded Quick Idea & Assistant Popover */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 rounded-2xl bg-[#0e172e] border border-cyan-500/40 shadow-2xl shadow-cyan-950/70 p-4 animate-in slide-in-from-bottom-3 duration-200 backdrop-blur-md">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#1e2c52]">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-slate-950 shadow-md">
                <Lightbulb className="w-4 h-4 font-bold" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>Captura de Ideas con IA</span>
                  <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
                </h4>
                <p className="text-[10px] text-slate-400">
                  Dísela al asistente y la estructurará
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => {
                  if (onOpenAssistantIntegration) {
                    onOpenAssistantIntegration();
                    setIsOpen(false);
                  } else {
                    setShowWebhookGuide(!showWebhookGuide);
                  }
                }}
                title="Configurar Bot de Telegram, Gemini, Siri o Google Assistant"
                className="px-2 py-1 rounded-lg text-xs flex items-center gap-1.5 transition-all bg-[#0088cc]/20 hover:bg-[#0088cc]/30 text-sky-200 border border-[#0088cc]/40 cursor-pointer"
              >
                <span>✈️</span>
                <span className="text-[10px] font-bold text-white">Bot Telegram</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Webhook & Gemini External Integration Guide */}
          {showWebhookGuide ? (
            <div className="mt-3 space-y-3 text-xs animate-in fade-in">
              <div className="p-3 rounded-xl bg-[#131f3f] border border-cyan-500/30 text-slate-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Webhook para Google Assistant / Gemini
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                    POST ACTIVO
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Envía cualquier texto o nota a esta URL y LifeBlocks lo analizará y guardará como idea organizada con Gemini 3.7.
                </p>

                <div className="flex items-center gap-1.5 bg-[#0b1326] p-2 rounded-lg border border-[#24345c]">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="bg-transparent text-[10px] font-mono text-cyan-200 flex-1 outline-none truncate select-all"
                  />
                  <button
                    type="button"
                    onClick={copyWebhookSnippet}
                    className="p-1 px-2 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10px] flex items-center gap-1 shrink-0"
                  >
                    {copiedWebhook ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedWebhook ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>

                {onOpenAssistantIntegration && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAssistantIntegration();
                      setIsOpen(false);
                    }}
                    className="w-full py-2 bg-gradient-to-r from-[#00f2ff] to-[#38ef7d] text-[#00363a] font-extrabold text-[11px] rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Ver Guía Completa de Atajos Siri & Android</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowWebhookGuide(false)}
                className="w-full py-1.5 text-center text-[11px] text-cyan-400 hover:underline font-semibold"
              >
                ← Volver a dictado rápido
              </button>
            </div>
          ) : (
            <>
              {/* Quick Input Form */}
              <form onSubmit={handleSubmitIdea} className="mt-3 space-y-2.5">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={quickText}
                    onChange={(e) => setQuickText(e.target.value)}
                    placeholder={isListening ? 'Escuchando tu voz...' : 'Ej: Correr 5km por las tardes, Aprender Figma...'}
                    className={`w-full pl-3.5 pr-11 py-2.5 rounded-xl bg-[#131f3f] border text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all ${
                      isListening
                        ? 'border-amber-400 ring-2 ring-amber-400/30 animate-pulse'
                        : 'border-[#263763] focus:border-cyan-400'
                    }`}
                  />

                  {/* Dictate Button inside input */}
                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    title={isListening ? 'Detener grabación' : 'Dictar idea por voz'}
                    className={`absolute right-1.5 top-1.5 p-1.5 rounded-lg transition-all ${
                      isListening
                        ? 'bg-rose-500 text-white animate-bounce'
                        : 'text-slate-400 hover:text-amber-300 hover:bg-[#1c2c54]'
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>

                {/* Quick action buttons */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenVoiceIdeaModal();
                    }}
                    className="text-[11px] font-semibold text-slate-400 hover:text-cyan-300 flex items-center space-x-1 py-1"
                  >
                    <span>Modo voz guiado</span>
                  </button>

                  <button
                    type="submit"
                    disabled={!quickText.trim() || isProcessing}
                    className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
                  >
                    {isProcessing ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        <span>Analizando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Guardar Idea</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Success card if idea created */}
          {showSuccessNotification && lastCreatedIdea && (
            <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center space-x-2 truncate">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate font-medium">"{lastCreatedIdea.title}" guardada</span>
              </div>
              <button
                onClick={() => {
                  onConvertIdeaToTask(lastCreatedIdea);
                  setShowSuccessNotification(false);
                  setIsOpen(false);
                }}
                className="px-2 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-[10px] whitespace-nowrap shadow"
              >
                Convertir a Bloque
              </button>
            </div>
          )}

          {/* Bottom Link to open full Assistant Coach */}
          <div className="mt-3 pt-2.5 border-t border-[#1a2647] flex items-center justify-between">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenAgentChat();
              }}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1.5 py-0.5"
            >
              <Bot className="w-3.5 h-3.5 text-[#00f2ff]" />
              <span>Abrir Chat con Agente Coach</span>
            </button>
            <span className="text-[10px] text-slate-500">
              {todayTasksCount} evento(s) hoy
            </span>
          </div>

        </div>
      )}

      {/* Floating Action Button Dock */}
      <div className="flex items-center gap-2">
        
        {/* Quick Idea Capture Floating Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`h-12 px-3.5 sm:px-4 rounded-full shadow-2xl flex items-center space-x-2 font-black transition-all hover:scale-105 active:scale-95 border-2 ${
            isOpen
              ? 'bg-amber-400 text-slate-950 border-amber-300 ring-4 ring-amber-400/20'
              : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 border-yellow-300/40 shadow-amber-500/30'
          }`}
          title="Capturar idea rápida o configurar Webhook de Gemini"
        >
          <div className="relative flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-slate-950 font-black animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
          </div>
          <span className="text-xs uppercase tracking-wider font-extrabold hidden sm:inline">
            + Idea Rápida
          </span>
        </button>

        {/* Primary Agent Coach Floating Button */}
        <button
          onClick={onOpenAgentChat}
          className="h-12 px-3.5 sm:px-4.5 rounded-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-[#0b1326] shadow-2xl shadow-cyan-500/40 flex items-center space-x-2 font-black transition-all hover:scale-105 active:scale-95 border-2 border-white/30"
          title="Abrir Agente Coach de LifeBlocks"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-[#0b1326]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-[#0b1326] animate-ping" />
          </div>
          <span className="hidden sm:inline text-xs tracking-wider uppercase font-extrabold text-[#0b1326]">
            Agente LifeBlocks
          </span>
          <Sparkles className="w-3.5 h-3.5 text-[#0b1326] opacity-90" />
        </button>

      </div>

    </div>
  );
};
