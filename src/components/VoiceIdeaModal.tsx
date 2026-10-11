import React, { useState, useEffect, useRef } from 'react';
import { CategoryInfo, IdeaItem, IdeaType } from '../types';
import { classifyVoiceIdea, VoiceClassificationResult } from '../utils/voiceClassifier';
import { 
  speakAssistantMessage, 
  isAssistantVoiceEnabled, 
  setAssistantVoiceEnabled,
  formatIdeaAssignmentAnnouncement,
  cancelAssistantSpeech
} from '../utils/speechHelper';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  Check, 
  X, 
  FolderPlus, 
  Volume2, 
  VolumeX,
  AlertCircle,
  Lightbulb,
  Tv,
  Dumbbell,
  Heart,
  DollarSign,
  Paintbrush,
  Bot,
  Smartphone
} from 'lucide-react';

interface VoiceIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryInfo[];
  defaultCategoryId?: string;
  onAddIdea: (idea: Omit<IdeaItem, 'id' | 'createdAt'>) => void;
  onOpenAssistantIntegration?: () => void;
}

export const VoiceIdeaModal: React.FC<VoiceIdeaModalProps> = ({
  isOpen,
  onClose,
  categories,
  defaultCategoryId,
  onAddIdea,
  onOpenAssistantIntegration,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [voiceAudioEnabled, setVoiceAudioEnabled] = useState(isAssistantVoiceEnabled());
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);

  // Classified result states (editable before save)
  const [classifiedData, setClassifiedData] = useState<VoiceClassificationResult | null>(null);
  const [editableCategory, setEditableCategory] = useState<string>('salud_deporte');
  const [editableType, setEditableType] = useState<IdeaType>('idea');
  const [editableTitle, setEditableTitle] = useState<string>('');
  const [editableDesc, setEditableDesc] = useState<string>('');

  const recognitionRef = useRef<any>(null);

  // Check speech recognition support on mount
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setHasSpeechSupport(false);
    }
  }, []);

  // Reset states when opening
  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setInterimText('');
      setErrorMsg(null);
      setSavedSuccess(false);
      setClassifiedData(null);
      setEditableCategory(defaultCategoryId || 'salud_deporte');
      setEditableType('idea');
      setEditableTitle('');
      setEditableDesc('');
      setIsAssistantSpeaking(false);
      
      // Auto-start listening on open if supported
      setTimeout(() => {
        startListening();
      }, 300);
    } else {
      stopListening();
      cancelAssistantSpeech();
    }
  }, [isOpen, defaultCategoryId]);

  const getCategoryName = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.name : 'Categoría';
  };

  const processAndClassify = (text: string) => {
    if (!text || text.trim().length === 0) return;
    const result = classifyVoiceIdea(text, defaultCategoryId);
    setClassifiedData(result);
    setEditableCategory(result.categoryId);
    setEditableType(result.type);
    setEditableTitle(result.title);
    setEditableDesc(result.description);

    // Speak aloud where the idea was assigned
    const targetCatName = getCategoryName(result.categoryId);
    const speechMessage = formatIdeaAssignmentAnnouncement(result.title, targetCatName);
    
    if (voiceAudioEnabled) {
      setIsAssistantSpeaking(true);
      speakAssistantMessage(speechMessage, {
        onStart: () => setIsAssistantSpeaking(true),
        onEnd: () => setIsAssistantSpeaking(false),
      });
    }
  };

  const handleToggleVoiceAudio = () => {
    const next = !voiceAudioEnabled;
    setVoiceAudioEnabled(next);
    setAssistantVoiceEnabled(next);
    if (!next) {
      cancelAssistantSpeech();
      setIsAssistantSpeaking(false);
    }
  };

  const handleReplayVoiceFeedback = () => {
    const currentTitle = editableTitle.trim() || transcript.trim() || 'tu idea';
    const targetCatName = getCategoryName(editableCategory);
    const speechMessage = formatIdeaAssignmentAnnouncement(currentTitle, targetCatName);
    
    setIsAssistantSpeaking(true);
    speakAssistantMessage(speechMessage, {
      force: true,
      onStart: () => setIsAssistantSpeaking(true),
      onEnd: () => setIsAssistantSpeaking(false),
    });
  };

  const startListening = () => {
    setErrorMsg(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setHasSpeechSupport(false);
      setErrorMsg('Tu navegador no soporta reconocimiento de voz nativo. Puedes escribir o usar los ejemplos rápidos.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES'; // Spanish (also handles Latin American Spanish)
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMsg(null);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }

        if (currentInterim) {
          setInterimText(currentInterim);
        }

        if (finalTranscript) {
          setTranscript(finalTranscript);
          setInterimText('');
          processAndClassify(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMsg('Acceso al micrófono denegado. Permite el micrófono en tu navegador o escribe tu idea abajo.');
        } else if (event.error === 'no-speech') {
          setErrorMsg('No se detectó voz. Haz clic en el micrófono para intentar de nuevo.');
        } else {
          setErrorMsg(`Aviso: ${event.error}. Puedes probar de nuevo o usar los ejemplos.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Error starting speech recognition:', err);
      setIsListening(false);
      setErrorMsg('No se pudo activar el micrófono. Puedes escribir la idea manualmente.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleApplyPreset = (presetText: string) => {
    setTranscript(presetText);
    setInterimText('');
    stopListening();
    processAndClassify(presetText);
  };

  const handleSaveIdea = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const titleToSave = editableTitle.trim() || transcript.trim() || 'Nueva Idea Grabada';
    if (!titleToSave) return;
    
    onAddIdea({
      categoryId: editableCategory,
      title: titleToSave,
      description: editableDesc.trim() || (transcript ? `Dictado por voz: "${transcript}"` : ''),
      type: editableType,
    });

    setSavedSuccess(true);
    
    const catName = getCategoryName(editableCategory);
    if (voiceAudioEnabled) {
      speakAssistantMessage(`¡Guardado! Tu idea ya está lista en ${catName}.`);
    }

    setTimeout(() => {
      onClose();
    }, 700);
  };

  if (!isOpen) return null;

  const currentCategoryObj = categories.find((c) => c.id === editableCategory);
  const currentCategoryName = currentCategoryObj ? currentCategoryObj.name : 'tu categoría';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[#0b1326] border border-[#2d3a58] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#2d3a58] flex items-center justify-between bg-[#10172b]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00f2ff]/20 to-teal-500/20 border border-[#00f2ff]/30 flex items-center justify-center text-[#00f2ff]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <span>Captura de Ideas por Voz</span>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/20 rounded-full">
                  Auto-Clasificación IA
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Habla con naturalidad y el Asistente LifeBlocks asignará tu idea a su categoría exacta
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Assistant / Siri Shortcuts setup trigger */}
            {onOpenAssistantIntegration && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAssistantIntegration();
                }}
                className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 transition-colors cursor-pointer flex items-center space-x-1.5 text-xs font-mono"
                title="Integrar con Siri / Hey Google / Gemini Móvil"
              >
                <Smartphone className="w-4 h-4 text-[#00f2ff]" />
                <span className="hidden sm:inline">Siri / Asistente</span>
              </button>
            )}

            {/* Voice Mute / Unmute Toggle */}
            <button
              type="button"
              onClick={handleToggleVoiceAudio}
              className={`p-2 rounded-xl border transition-colors cursor-pointer flex items-center space-x-1 text-xs font-mono ${
                voiceAudioEnabled
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
              title={voiceAudioEnabled ? 'Voz del Asistente activada' : 'Voz del Asistente silenciada'}
            >
              {voiceAudioEnabled ? <Volume2 className="w-4 h-4 text-[#00f2ff]" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{voiceAudioEnabled ? 'Voz activa' : 'Silencio'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin">
          
          {/* Main Visual Recording Card */}
          <div className="relative p-6 rounded-2xl bg-gradient-to-b from-[#131d33] to-[#0d1424] border border-[#232e4a] text-center flex flex-col items-center justify-center overflow-hidden">
            
            {/* Animated Wave Background when Listening */}
            {isListening && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                <div className="w-48 h-48 rounded-full bg-[#00f2ff]/20 animate-ping" />
                <div className="w-32 h-32 rounded-full bg-emerald-400/20 animate-pulse" />
              </div>
            )}

            {/* Big Friendly Mic Button */}
            <button
              onClick={isListening ? stopListening : startListening}
              className={`relative z-10 w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-300 cursor-pointer shadow-xl ${
                isListening
                  ? 'bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-rose-500/40 scale-105 ring-4 ring-rose-400/30 animate-pulse'
                  : 'bg-gradient-to-tr from-[#00f2ff] via-teal-400 to-[#38ef7d] text-[#00363a] shadow-[#00f2ff]/30 hover:scale-105'
              }`}
              title={isListening ? 'Detener grabación' : 'Iniciar grabación de voz'}
            >
              {isListening ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>

            {/* Status Label */}
            <div className="mt-4 space-y-1">
              <div className="flex items-center justify-center space-x-2 text-sm font-semibold">
                {isListening ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-rose-300">Escuchando tu voz... Habla ahora</span>
                  </>
                ) : (
                  <span className="text-slate-300">
                    {transcript ? 'Voz procesada ✓ Haz clic para volver a grabar' : 'Haz clic en el micrófono y di tu idea'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-sans">
                {isListening 
                  ? 'Ejemplo: "Pintar la casa y comprar brochas en la ferretería"'
                  : 'Detecta y anuncia automáticamente la categoría: Ocio, Actividades pendientes, Salud, Finanzas, etc.'}
              </p>
            </div>

            {/* Live Transcript Display Box */}
            {(transcript || interimText) && (
              <div className="mt-4 w-full p-4 rounded-xl bg-[#090d18] border border-[#2d3a58] text-left">
                <div className="text-[10px] font-mono uppercase text-[#00f2ff] font-bold mb-1 flex items-center space-x-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Transcripción en Vivo</span>
                </div>
                <p className="text-sm text-slate-100 font-sans leading-relaxed">
                  <span className="font-semibold text-white">{transcript}</span>
                  {interimText && <span className="text-slate-400 italic ml-1">{interimText}...</span>}
                </p>
              </div>
            )}

            {/* Error / Warning Notice if any */}
            {errorMsg && (
              <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Assistant Voice & Category Spoken Announcement Banner */}
          {(classifiedData || transcript) && (
            <div className="p-4 rounded-2xl bg-[#0c1a2e] border-2 border-[#00f2ff]/50 shadow-lg shadow-[#00f2ff]/15 flex items-start space-x-3.5 animate-in slide-in-from-top-3 fade-in duration-300">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00f2ff]/20 to-teal-400/20 border border-[#00f2ff]/40 flex items-center justify-center text-[#00f2ff] shrink-0 mt-0.5">
                <Bot className={`w-5 h-5 ${isAssistantSpeaking ? 'animate-bounce text-[#38ef7d]' : ''}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#00f2ff] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Asistente de Asignación IA
                  </span>
                  <button
                    type="button"
                    onClick={handleReplayVoiceFeedback}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 text-[#00f2ff] text-[11px] font-mono transition-colors cursor-pointer"
                    title="Escuchar locución del asistente"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>{isAssistantSpeaking ? 'Hablando...' : 'Escuchar'}</span>
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-slate-100 mt-1 leading-snug">
                  🤖 He asignado tu idea <span className="font-bold text-white">"{editableTitle || transcript}"</span> a la categoría de{' '}
                  <span className="font-extrabold text-[#00f2ff] bg-cyan-950/70 px-1.5 py-0.5 rounded border border-cyan-500/40">
                    {currentCategoryName}
                  </span>.
                </p>
              </div>
            </div>
          )}

          {/* Quick Voice Simulation / Presets for User Guidance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="flex items-center space-x-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Pruebas Rápidas con 1 Clic (o dicta tu propia frase):</span>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleApplyPreset('Pintar la casa y organizar el estudio comprar pinceles')}
                className="p-2.5 rounded-xl bg-[#131b2e] hover:bg-[#1a2642] border border-[#232e4a] hover:border-orange-500/40 text-left transition-all flex items-center space-x-2 text-slate-300 hover:text-white cursor-pointer group"
              >
                <Paintbrush className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="truncate">"Pintar la casa, organizar estudio, comprar pinceles..."</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('Quiero ver la serie For All Mankind la dan en Apple TV')}
                className="p-2.5 rounded-xl bg-[#131b2e] hover:bg-[#1a2642] border border-[#232e4a] hover:border-pink-500/40 text-left transition-all flex items-center space-x-2 text-slate-300 hover:text-white cursor-pointer group"
              >
                <Tv className="w-4 h-4 text-pink-400 shrink-0" />
                <span className="truncate">"Quiero ver la serie For All Mankind..."</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('Rutina de pesas para espalda y bíceps en el gimnasio')}
                className="p-2.5 rounded-xl bg-[#131b2e] hover:bg-[#1a2642] border border-[#232e4a] hover:border-teal-500/40 text-left transition-all flex items-center space-x-2 text-slate-300 hover:text-white cursor-pointer group"
              >
                <Dumbbell className="w-4 h-4 text-teal-400 shrink-0" />
                <span className="truncate">"Rutina de pesas para espalda y bíceps..."</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('Ahorrar 200 dólares al mes para el fondo de emergencia')}
                className="p-2.5 rounded-xl bg-[#131b2e] hover:bg-[#1a2642] border border-[#232e4a] hover:border-amber-500/40 text-left transition-all flex items-center space-x-2 text-slate-300 hover:text-white cursor-pointer group"
              >
                <DollarSign className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">"Ahorrar $200 al mes para fondo de emergencia..."</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('Noche de pizza artesanal y juegos de mesa en familia')}
                className="p-2.5 rounded-xl bg-[#131b2e] hover:bg-[#1a2642] border border-[#232e4a] hover:border-rose-500/40 text-left transition-all flex items-center space-x-2 text-slate-300 hover:text-white cursor-pointer group"
              >
                <Heart className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="truncate">"Noche de pizza y juegos en familia..."</span>
              </button>
            </div>
          </div>

          {/* Auto-Classified Result Form (Editable preview before saving) */}
          {(classifiedData || transcript) && (
            <div className="p-5 rounded-2xl bg-[#10172b] border border-[#00f2ff]/30 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-[#232e4a]">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-[#00f2ff]" />
                  <h4 className="text-xs font-bold font-mono uppercase text-cyan-200">
                    Ajustar o Personalizar Asignación
                  </h4>
                </div>
                {classifiedData?.confidenceReason && (
                  <span className="text-[11px] font-sans px-2.5 py-0.5 rounded-full bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/25 font-medium">
                    {classifiedData.confidenceReason}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-slate-300 font-bold">
                    Área Asignada
                  </label>
                  <select
                    value={editableCategory}
                    onChange={(e) => setEditableCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#131b2e] border border-[#2d3a58] focus:border-[#00f2ff] rounded-xl text-white text-xs font-medium focus:outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Element Type Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-slate-300 font-bold">
                    Tipo de Elemento
                  </label>
                  <select
                    value={editableType}
                    onChange={(e) => setEditableType(e.target.value as IdeaType)}
                    className="w-full px-3 py-2 bg-[#131b2e] border border-[#00f2ff]/40 focus:border-[#00f2ff] rounded-xl text-[#00f2ff] text-xs font-bold focus:outline-none"
                  >
                    {/* Specific to selected category */}
                    {editableCategory === 'actividades_pendientes' ? (
                      <>
                        <option value="pintura_mejora">🎨 Pintura & Reparación</option>
                        <option value="organizacion_espacio">📦 Organización & Espacio</option>
                        <option value="compra_materiales">🖌️ Compra de Materiales</option>
                        <option value="mantenimiento_hogar">🛠️ Mantenimiento Hogar</option>
                        <option value="diligencia_tramite">📋 Diligencia / Trámite</option>
                        <option value="otro">✨ Otro</option>
                      </>
                    ) : editableCategory === 'ocio_entretenimiento' ? (
                      <>
                        <option value="serie">📺 Serie / Anime</option>
                        <option value="pelicula">🎬 Película / Cine</option>
                        <option value="videojuego">🎮 Videojuego</option>
                        <option value="musica">🎵 Música</option>
                        <option value="evento">🎉 Evento / Salida</option>
                        <option value="otro">✨ Otro</option>
                      </>
                    ) : editableCategory === 'salud_deporte' ? (
                      <>
                        <option value="cardio">🏃 Cardio & Resistencia</option>
                        <option value="pesas">🏋️ Pesas & Fuerza</option>
                        <option value="deporte">⚽ Deporte & Partidos</option>
                        <option value="rutina">🧘 Rutina & Movilidad</option>
                        <option value="nutricion">🥗 Nutrición Saludable</option>
                        <option value="otro">✨ Otro</option>
                      </>
                    ) : editableCategory === 'finanzas_hogar' ? (
                      <>
                        <option value="ahorro">💰 Meta de Ahorro</option>
                        <option value="inversion">📈 Inversión</option>
                        <option value="compra">🛒 Compra / Hogar</option>
                        <option value="presupuesto">📊 Presupuesto</option>
                        <option value="otro">✨ Otro</option>
                      </>
                    ) : editableCategory === 'familia_relaciones' ? (
                      <>
                        <option value="plan_familiar">👨‍👩‍👧 Plan Familiar</option>
                        <option value="cita">❤️ Cita en Pareja</option>
                        <option value="viaje">✈️ Paseo / Viaje</option>
                        <option value="proyecto_hogar">🏡 Proyecto en Hogar</option>
                        <option value="otro">✨ Otro</option>
                      </>
                    ) : editableCategory === 'bienestar_mente' ? (
                      <>
                        <option value="meditacion">🧘 Meditación</option>
                        <option value="lectura_reflexiva">📖 Lectura Reflexiva</option>
                        <option value="descanso">🌙 Sueño & Descanso</option>
                        <option value="habito_saludable">✨ Diario & Gratitud</option>
                        <option value="paseo_naturaleza">🌲 Naturaleza</option>
                        <option value="otro">✨ Otro</option>
                      </>
                    ) : (
                      <>
                        <option value="habilidad">⚡ Habilidad Técnica</option>
                        <option value="curso">🎓 Curso / Taller</option>
                        <option value="libro">📖 Libro de Estudio</option>
                        <option value="idioma">🗣️ Idioma</option>
                        <option value="proyecto">🛠️ Proyecto Práctico</option>
                        <option value="otro">✨ Otro</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-slate-300 font-bold">
                  Título Extraído
                </label>
                <input
                  type="text"
                  value={editableTitle}
                  onChange={(e) => setEditableTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#2d3a58] focus:border-[#00f2ff] rounded-xl text-white font-semibold text-sm focus:outline-none"
                  placeholder="Título de la idea..."
                />
              </div>

              {/* Description Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-slate-300 font-bold">
                  Notas / Detalles Adicionales
                </label>
                <textarea
                  rows={2}
                  value={editableDesc}
                  onChange={(e) => setEditableDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#2d3a58] focus:border-[#00f2ff] rounded-xl text-slate-200 text-xs focus:outline-none resize-none"
                  placeholder="Detalles, plataforma o notas..."
                />
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#2d3a58] bg-[#10172b] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={() => handleSaveIdea()}
            disabled={(!editableTitle && !transcript) || savedSuccess}
            className={`px-6 py-2.5 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2 cursor-pointer ${
              savedSuccess
                ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                : (!editableTitle && !transcript)
                ? 'bg-slate-700 text-slate-400 opacity-50 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#00f2ff] via-teal-300 to-[#38ef7d] text-[#00363a] hover:brightness-110 shadow-[#00f2ff]/25'
            }`}
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>¡Idea Guardada en {currentCategoryName}!</span>
              </>
            ) : (
              <>
                <FolderPlus className="w-4 h-4" />
                <span>Guardar en {currentCategoryName}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
