import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Copy, 
  Check, 
  Smartphone, 
  Bot, 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  ArrowRight, 
  ExternalLink,
  Lightbulb,
  Cpu,
  Layers,
  HelpCircle,
  Play,
  Bell,
  Heart,
  Users,
  CalendarDays
} from 'lucide-react';
import { CategoryInfo, IdeaItem } from '../types';
import { speakAssistantMessage } from '../utils/speechHelper';
import { connectGoogleCalendar, getGoogleCalendarToken } from '../lib/googleCalendar';

interface VoiceAssistantIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryInfo[];
  userId?: string;
  onAddIdeaDirectly: (idea: Omit<IdeaItem, 'id' | 'createdAt'>) => void;
}

export const VoiceAssistantIntegrationModal: React.FC<VoiceAssistantIntegrationModalProps> = ({
  isOpen,
  onClose,
  categories,
  userId,
  onAddIdeaDirectly,
}) => {
  const [activeGuideTab, setActiveGuideTab] = useState<'telegram' | 'pareja' | 'siri' | 'google' | 'gemini_gem' | 'curl'>('telegram');
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedTelegramHook, setCopiedTelegramHook] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedOpenApi, setCopiedOpenApi] = useState(false);

  // Partner Config state (Modo Pareja: Liz & Miguel)
  const [partnerOwnerName, setPartnerOwnerName] = useState('Miguel');
  const [partnerOwnerChatId, setPartnerOwnerChatId] = useState('');
  const [partnerName, setPartnerName] = useState('Liz');
  const [partnerChatId, setPartnerChatId] = useState('');
  const [partnerUsername, setPartnerUsername] = useState('');
  const [isSavingPartnerConfig, setIsSavingPartnerConfig] = useState(false);
  const [partnerConfigMsg, setPartnerConfigMsg] = useState<{ text: string; success: boolean } | null>(null);

  // Partner test task simulation
  const [partnerTaskTitle, setPartnerTaskTitle] = useState('Limpiar la casa y ordenar la sala');
  const [partnerTaskTime, setPartnerTaskTime] = useState('16:00 - 17:00');
  const [partnerTaskCategory, setPartnerTaskCategory] = useState('finanzas_hogar');
  const [isSimulatingPartnerTask, setIsSimulatingPartnerTask] = useState(false);
  const [partnerTaskFeedback, setPartnerTaskFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/partner/config')
        .then(res => res.json())
        .then(data => {
          if (data && data.success && data.partnerConfig) {
            const cfg = data.partnerConfig;
            if (cfg.ownerName) setPartnerOwnerName(cfg.ownerName);
            if (cfg.ownerChatId) setPartnerOwnerChatId(String(cfg.ownerChatId));
            if (cfg.partnerName) setPartnerName(cfg.partnerName);
            if (cfg.partnerChatId) setPartnerChatId(String(cfg.partnerChatId));
            if (cfg.partnerUsername) setPartnerUsername(cfg.partnerUsername);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleSavePartnerConfig = async () => {
    setIsSavingPartnerConfig(true);
    setPartnerConfigMsg(null);
    try {
      const res = await fetch('/api/partner/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerName: partnerOwnerName,
          ownerChatId: partnerOwnerChatId || null,
          partnerName: partnerName,
          partnerChatId: partnerChatId || null,
          partnerUsername: partnerUsername || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPartnerConfigMsg({ text: '✅ ¡Configuración de Modo Pareja guardada exitosamente!', success: true });
      } else {
        setPartnerConfigMsg({ text: '⚠️ Error al guardar configuración.', success: false });
      }
    } catch {
      setPartnerConfigMsg({ text: '⚠️ Error de conexión con el servidor.', success: false });
    } finally {
      setIsSavingPartnerConfig(false);
    }
  };

  const handleSimulatePartnerTask = async () => {
    setIsSimulatingPartnerTask(true);
    setPartnerTaskFeedback(null);
    try {
      const res = await fetch('/api/partner/test-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: partnerTaskTitle,
          timeSlot: partnerTaskTime,
          category: partnerTaskCategory,
          partnerName: partnerName || 'Liz',
          ownerName: partnerOwnerName || 'Miguel',
          userId: userId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPartnerTaskFeedback(
          data.deliveredToTelegram
            ? `🚀 ¡Tarea asignada y notificada en vivo al Telegram de ${partnerOwnerName}! Ya está en tu calendario.`
            : `✅ Tarea creada con la insignia "Asignado por ${partnerName}". Aparecerá en tu calendario en ${partnerTaskTime}.`
        );
      } else {
        setPartnerTaskFeedback('⚠️ Error al simular la asignación de tarea.');
      }
    } catch {
      setPartnerTaskFeedback('⚠️ Error de conexión con el servidor.');
    } finally {
      setIsSimulatingPartnerTask(false);
    }
  };

  // Google Calendar Integration state
  const [isConnectingGoogleCal, setIsConnectingGoogleCal] = useState(false);
  const [googleCalFeedback, setGoogleCalFeedback] = useState<string | null>(null);

  const handleConnectGoogleCal = async () => {
    setIsConnectingGoogleCal(true);
    setGoogleCalFeedback(null);
    try {
      const token = await connectGoogleCalendar();
      if (token) {
        setGoogleCalFeedback('¡Google Calendar conectado exitosamente! Tus tareas y recordatorios se sincronizarán con alarma a 10 min.');
      } else {
        setGoogleCalFeedback('No se completó la autorización de Google Calendar.');
      }
    } catch (err: any) {
      setGoogleCalFeedback(err?.message || 'Error al conectar con Google Calendar.');
    } finally {
      setIsConnectingGoogleCal(false);
    }
  };

  // Telegram bot state
  const [telegramTokenInput, setTelegramTokenInput] = useState('');
  const [isRegisteringWebhook, setIsRegisteringWebhook] = useState(false);
  const [telegramStatusMessage, setTelegramStatusMessage] = useState<{ text: string; success: boolean } | null>(null);
  
  // Telegram interactive simulator
  const [telegramSimInput, setTelegramSimInput] = useState('¿Qué tengo para hoy?');
  const [telegramSimChat, setTelegramSimChat] = useState<Array<{ from: 'user' | 'bot'; text: string; time: string; replyMarkup?: { inline_keyboard?: Array<Array<{ text: string; callback_data: string }>> } }>>([
    {
      from: 'bot',
      text: '👋 ¡Hola! Soy tu asistente de LifeGlow 🚀\nEnvíame cualquier idea o tarea en texto o nota de voz y la organizaré automáticamente en tu tablero con Inteligencia Artificial.\n\n💡 Prueba preguntar: "¿Qué tengo para hoy?" o "¿Cuáles son mis hábitos?" para ver tus compromisos y marcar hábitos en 1 toque.',
      time: '12:00'
    }
  ]);
  const [isTelegramSimulating, setIsTelegramSimulating] = useState(false);
  const [isSendingTestAlert, setIsSendingTestAlert] = useState(false);
  const [isSendingTestFollowup, setIsSendingTestFollowup] = useState(false);
  const [alertFeedback, setAlertFeedback] = useState<string | null>(null);
  const [followupFeedback, setFollowupFeedback] = useState<string | null>(null);

  // Live Simulator state
  const [simulatorText, setSimulatorText] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedResult, setSimulatedResult] = useState<any | null>(null);
  const [simulatorError, setSimulatorError] = useState<string | null>(null);
  const [isListeningSim, setIsListeningSim] = useState(false);

  const recognitionRef = useRef<any>(null);

  if (!isOpen) return null;

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://lifeglow.ai.studio';
  const webhookUrl = `${originUrl}/api/webhook/idea${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`;
  const telegramWebhookUrl = `${originUrl}/api/telegram/webhook${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`;
  const getUrlExample = `${originUrl}/api/webhook/idea?text=Correr+5km+manana${userId ? `&userId=${encodeURIComponent(userId)}` : ''}`;

  const curlSnippet = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Comprar repuestos de aceite para el carro a los 40 mil km",
    "source": "Gemini / Asistente Móvil"
  }'`;

  const handleRegisterTelegramWebhook = async () => {
    if (!telegramTokenInput.trim()) {
      setTelegramStatusMessage({
        text: 'Por favor ingresa tu Token de Bot de Telegram obtenido de @BotFather.',
        success: false,
      });
      return;
    }

    setIsRegisteringWebhook(true);
    setTelegramStatusMessage(null);

    try {
      const res = await fetch('/api/telegram/set-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: telegramTokenInput.trim(),
          webhookUrl: telegramWebhookUrl,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTelegramStatusMessage({
          text: '🎉 ¡Webhook vinculado con éxito a tu Bot de Telegram! Ya puedes enviarle mensajes.',
          success: true,
        });
      } else {
        setTelegramStatusMessage({
          text: data.error || data.telegramResponse?.description || 'Error al vincular el webhook de Telegram.',
          success: false,
        });
      }
    } catch (err: any) {
      setTelegramStatusMessage({
        text: err?.message || 'Error de conexión con el servidor.',
        success: false,
      });
    } finally {
      setIsRegisteringWebhook(false);
    }
  };

  const handleSendTelegramSimMessage = async () => {
    if (!telegramSimInput.trim() || isTelegramSimulating) return;
    const userMsg = telegramSimInput.trim();
    setTelegramSimInput('');
    setIsTelegramSimulating(true);

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTelegramSimChat(prev => [...prev, { from: 'user', text: userMsg, time: nowTime }]);

    try {
      const res = await fetch('/api/telegram/test-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: userMsg,
          username: 'usuario',
          userId: userId || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTelegramSimChat(prev => [
          ...prev,
          {
            from: 'bot',
            text: data.telegramReply || (data.isExtraExpense ? `🧾 Factura procesada: ${data.extraExpense?.name}` : `✅ Guardado en ${data.readableCategory}`),
            replyMarkup: data.replyMarkup,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);

        if (data.idea && !data.isExtraExpense && !data.isQuery) {
          onAddIdeaDirectly({
            title: data.idea.title,
            description: data.idea.description,
            categoryId: data.idea.categoryId,
            type: data.idea.type,
          });
        }
      } else {
        setTelegramSimChat(prev => [
          ...prev,
          {
            from: 'bot',
            text: '⚠️ No pude procesar el mensaje en el servidor.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch {
      setTelegramSimChat(prev => [
        ...prev,
        {
          from: 'bot',
          text: '⚠️ Error al conectar con el servidor de LifeBlocks.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTelegramSimulating(false);
    }
  };

  const handleTelegramCallbackClick = async (callbackData: string, btnText: string) => {
    if (isTelegramSimulating) return;
    setIsTelegramSimulating(true);

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTelegramSimChat(prev => [...prev, { from: 'user', text: `👉 ${btnText}`, time: nowTime }]);

    try {
      const res = await fetch('/api/telegram/test-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callbackData,
          username: 'usuario',
          userId: userId || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTelegramSimChat(prev => [
          ...prev,
          {
            from: 'bot',
            text: data.telegramReply || '✅ Acción completada.',
            replyMarkup: data.replyMarkup,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setTelegramSimChat(prev => [
          ...prev,
          {
            from: 'bot',
            text: '⚠️ No se pudo procesar la acción del botón.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch {
      setTelegramSimChat(prev => [
        ...prev,
        {
          from: 'bot',
          text: '⚠️ Error al conectar con el servidor.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTelegramSimulating(false);
    }
  };

  const handleSimulatePhotoUpload = async (customCaption?: string) => {
    if (isTelegramSimulating) return;
    const caption = customCaption || 'Factura veterinaria juguete para mascota $45.000 pagado';
    setIsTelegramSimulating(true);

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTelegramSimChat(prev => [...prev, { from: 'user', text: `📸 [Foto Factura] ${caption}`, time: nowTime }]);

    try {
      const res = await fetch('/api/telegram/simulate-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption,
          username: 'miguel',
          userId: userId || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTelegramSimChat(prev => [
          ...prev,
          {
            from: 'bot',
            text: data.telegramReply || '🧾 Factura procesada e incluida en Gastos Adicionales.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setTelegramSimChat(prev => [
          ...prev,
          {
            from: 'bot',
            text: '⚠️ Error procesando la imagen de la factura.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch {
      setTelegramSimChat(prev => [
        ...prev,
        {
          from: 'bot',
          text: '⚠️ Error de conexión con el servidor.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTelegramSimulating(false);
    }
  };

  const handleSendTestAlert = async () => {
    setIsSendingTestAlert(true);
    setAlertFeedback(null);
    try {
      const res = await fetch('/api/telegram/send-instant-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Hacer 50 Flexiones de Pecho',
          category: 'salud_deporte',
          eventTime: new Date(Date.now() + 10 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          advanceMinutes: 10,
          userId: userId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAlertFeedback(data.deliveredToTelegram ? '🚀 ¡Notificación enviada exitosamente a tu Telegram en vivo!' : '🔔 Notificación de prueba generada con éxito.');
        setTelegramSimChat(prev => [
          ...prev,
          {
            from: 'bot',
            text: `⏰ *¡Recordatorio Proactivo de LifeBlocks!* (en 10 minutos)\n\n🏃‍♂️ *Compromiso:* Hacer 50 Flexiones de Pecho\n🕐 *Hora programada:* ${new Date(Date.now() + 10 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n\n💡 _¡Prepárate, toma agua y comienza a calentar!_`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      } else {
        setAlertFeedback('Error al enviar la notificación de prueba.');
      }
    } catch {
      setAlertFeedback('Error de conexión al disparar el recordatorio.');
    } finally {
      setIsSendingTestAlert(false);
    }
  };

  const handleSendTestFollowup = async () => {
    setIsSendingTestFollowup(true);
    setFollowupFeedback(null);
    try {
      const res = await fetch('/api/telegram/send-instant-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Hacer 50 Flexiones de Pecho',
          category: 'salud_deporte',
          eventTime: '11:00 - 11:20 (Pregunta enviada 11:30)',
          userId: userId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFollowupFeedback(data.deliveredToTelegram ? '🚀 ¡Pregunta de verificación enviada a tu Telegram con botones Sí/No!' : '🔔 Pregunta de verificación generada con éxito.');
        setTelegramSimChat(prev => [
          ...prev,
          {
            from: 'bot',
            text: `🔔 *¡Seguimiento de LifeBlocks!* (10 min después)\n\n🏃‍♂️ *¿Lograste hacer tu compromiso:* "Hacer 50 Flexiones de Pecho"?\n🕐 *Horario programado:* 11:00 - 11:20\n\nResponde *"Sí"* o *"No"* directamente en este chat para actualizar tu página.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      } else {
        setFollowupFeedback('Error al enviar la pregunta de seguimiento.');
      }
    } catch {
      setFollowupFeedback('Error de conexión con el servidor.');
    } finally {
      setIsSendingTestFollowup(false);
    }
  };

  const openApiSchema = {
    openapi: "3.0.0",
    info: {
      title: "LifeBlocks Idea Ingestion API",
      description: "Guarda ideas analizadas y clasificadas con IA en LifeBlocks",
      version: "1.0.0"
    },
    servers: [{ url: originUrl }],
    paths: {
      "/api/webhook/idea": {
        post: {
          summary: "Guardar idea dictada",
          operationId: "saveIdea",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    text: {
                      type: "string",
                      description: "El contenido o transcripción de la idea dictada"
                    },
                    source: {
                      type: "string",
                      description: "Origen (ej: Asistente Gemini, Siri, Voz)",
                      default: "Gemini Assistant"
                    }
                  },
                  required: ["text"]
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Idea guardada y clasificada",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      message: { type: "string" },
                      spokenResponse: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  const copyToClipboard = (text: string, type: 'url' | 'telegram' | 'curl' | 'openapi') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    } else if (type === 'telegram') {
      setCopiedTelegramHook(true);
      setTimeout(() => setCopiedTelegramHook(false), 2000);
    } else if (type === 'curl') {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } else if (type === 'openapi') {
      setCopiedOpenApi(true);
      setTimeout(() => setCopiedOpenApi(false), 2000);
    }
  };

  const toggleMicSimulator = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta reconocimiento por voz nativo. Escribe tu texto en la casilla.');
      return;
    }

    if (isListeningSim) {
      recognitionRef.current?.stop();
      setIsListeningSim(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => setIsListeningSim(true);
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setSimulatorText(transcript);
      };
      recognition.onerror = () => setIsListeningSim(false);
      recognition.onend = () => setIsListeningSim(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      setIsListeningSim(false);
    }
  };

  const handleRunSimulator = async () => {
    if (!simulatorText.trim() || isSimulating) return;
    setIsSimulating(true);
    setSimulatorError(null);
    setSimulatedResult(null);

    try {
      const res = await fetch('/api/webhook/idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: simulatorText.trim(),
          source: 'Simulador Asistente Gemini',
          userId: userId || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.idea) {
        setSimulatedResult(data);
        
        // Add to client state
        onAddIdeaDirectly({
          title: data.idea.title,
          description: data.idea.description,
          categoryId: data.idea.categoryId,
          type: data.idea.type,
        });

        // Spoken audio confirmation
        if (data.spokenResponse) {
          speakAssistantMessage(data.spokenResponse);
        }
      } else {
        setSimulatorError(data.error || 'Error al procesar la idea en el servidor');
      }
    } catch (err: any) {
      setSimulatorError(err?.message || 'No se pudo conectar con el servidor.');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-[#0b1326] border border-[#2d3a58] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#243354] bg-[#10172b] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00f2ff] via-teal-400 to-[#38ef7d] text-[#00363a] flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Bot className="w-5 h-5 font-black" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Guardar Ideas & Tareas por Telegram y Voz</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Telegram, Siri & Gemini AI
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Envía notas de voz o mensajes a tu Bot de Telegram, o usa "Oye Siri" y "Hey Google / Gemini"
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin">
          
          {/* Webhook Endpoint Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#111c38] via-[#0d162a] to-[#121f3f] border border-cyan-500/40 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                  Tu Endpoint Webhook de Ingesta Inteligente
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Soporta POST (JSON) y GET (URL params)
              </span>
            </div>

            <div className="flex items-center gap-2 bg-[#080d1a] p-2 rounded-xl border border-[#243354]">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="bg-transparent text-xs font-mono text-cyan-200 flex-1 outline-none truncate select-all px-2"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(webhookUrl, 'url')}
                className="px-3 py-1.5 rounded-lg bg-[#00f2ff] hover:bg-[#00dbe7] text-[#00363a] font-extrabold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-md"
              >
                {copiedWebhook ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedWebhook ? '¡Copiado!' : 'Copiar URL'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Live Simulator (Test it in 1 Click) */}
          <div className="p-5 rounded-2xl bg-[#0f1830] border border-[#293a61] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">
                  Probador en Vivo: Simula cómo tu Asistente envía una idea
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                Gemini 3.7 Flash
              </span>
            </div>

            <p className="text-xs text-slate-300">
              Imagina que vas caminando por la calle y dices: <em>"Tengo que agendar cambio de aceite para la moto y comprar filtro de aire"</em>.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={simulatorText}
                  onChange={(e) => setSimulatorText(e.target.value)}
                  placeholder="Escribe o dicta tu idea tal como la dirías en la calle..."
                  className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#090e1c] border text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all ${
                    isListeningSim ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-[#263763] focus:border-[#00f2ff]'
                  }`}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunSimulator()}
                />
                <button
                  type="button"
                  onClick={toggleMicSimulator}
                  title="Dictar con micrófono"
                  className={`absolute right-1.5 top-1.5 p-1.5 rounded-lg transition-all ${
                    isListeningSim ? 'bg-rose-500 text-white animate-bounce' : 'text-slate-400 hover:text-amber-300 hover:bg-[#1c2c54]'
                  }`}
                >
                  {isListeningSim ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleRunSimulator}
                disabled={!simulatorText.trim() || isSimulating}
                className="px-5 py-2.5 bg-gradient-to-r from-[#00f2ff] via-teal-400 to-[#38ef7d] hover:brightness-110 disabled:opacity-40 text-[#00363a] font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
              >
                {isSimulating ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Procesando con Gemini...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar como Asistente</span>
                  </>
                )}
              </button>
            </div>

            {/* Simulator Response Card */}
            {simulatedResult && (
              <div className="p-4 rounded-xl bg-[#091b2e] border-2 border-[#00f2ff]/60 space-y-2 animate-in slide-in-from-top-2 fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>¡Idea procesada y guardada en LifeGlow!</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-[#00f2ff] font-mono text-[10px] border border-cyan-500/40">
                    Área: {categories.find(c => c.id === simulatedResult.idea.categoryId)?.name || simulatedResult.idea.categoryId}
                  </span>
                </div>
                <div className="text-sm font-extrabold text-white">
                  "{simulatedResult.idea.title}"
                </div>
                <p className="text-xs text-slate-300">
                  {simulatedResult.idea.description}
                </p>
                {simulatedResult.spokenResponse && (
                  <div className="mt-2 pt-2 border-t border-[#1a2f4c] flex items-center space-x-2 text-xs text-emerald-300 font-mono">
                    <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Locución: "{simulatedResult.spokenResponse}"</span>
                  </div>
                )}
              </div>
            )}

            {simulatorError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {simulatorError}
              </div>
            )}
          </div>

          {/* Integration Guides Tabs */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>Instrucciones Paso a Paso para Conectar tu Teléfono / Asistente:</span>
            </h4>

            <div className="flex items-center space-x-2 border-b border-[#243354] pb-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveGuideTab('telegram')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeGuideTab === 'telegram'
                    ? 'bg-[#0088cc] text-white shadow-lg shadow-sky-500/25 ring-1 ring-white/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>✈️ Bot de Telegram (Recomendado)</span>
                <span className="px-1.5 py-0.2 bg-sky-400/20 text-sky-200 text-[10px] rounded">Nativo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveGuideTab('pareja')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeGuideTab === 'pareja'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25 ring-1 ring-white/20'
                    : 'text-pink-300 hover:text-white hover:bg-pink-950/40 border border-pink-500/20'
                }`}
              >
                <Heart className="w-3.5 h-3.5 fill-current text-pink-300" />
                <span>Modo Pareja (Liz & Miguel)</span>
                <span className="px-1.5 py-0.2 bg-pink-400/20 text-pink-200 text-[10px] rounded font-mono">Nuevo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveGuideTab('siri')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeGuideTab === 'siri'
                    ? 'bg-[#00f2ff] text-[#00363a] shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                🍎 Atajos de Siri (iPhone / Apple Watch)
              </button>

              <button
                type="button"
                onClick={() => setActiveGuideTab('google')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeGuideTab === 'google'
                    ? 'bg-[#00f2ff] text-[#00363a] shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                🤖 Google Assistant / Android
              </button>

              <button
                type="button"
                onClick={() => setActiveGuideTab('gemini_gem')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeGuideTab === 'gemini_gem'
                    ? 'bg-[#00f2ff] text-[#00363a] shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                💎 Gemini Custom Gem (OpenAPI)
              </button>

              <button
                type="button"
                onClick={() => setActiveGuideTab('curl')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeGuideTab === 'curl'
                    ? 'bg-[#00f2ff] text-[#00363a] shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                ⚡ cURL / Make / Zapier
              </button>
            </div>

            {/* Guide Content: Telegram Bot (Native) */}
            {activeGuideTab === 'telegram' && (
              <div className="p-5 rounded-2xl bg-[#0c1426] border border-sky-500/40 space-y-6 text-xs text-slate-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1c2c50] pb-3">
                  <div>
                    <h5 className="text-sm font-black text-white flex items-center gap-2">
                      <span className="text-lg">✈️</span>
                      <span>Bot Nativo de Telegram con Inteligencia Artificial</span>
                    </h5>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Envía mensajes de texto, audios de voz o <strong>fotos (stickers de cambio de aceite, recibos, recetas)</strong> a tu bot de Telegram y Gemini los analizará con Visión IA para organizarlos automáticamente.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-mono shrink-0">
                    Gemini 3.7 + Visión OCR + Audio Ready
                  </span>
                </div>

                {/* Paso a paso */}
                <div className="space-y-3">
                  <div className="font-bold text-white text-xs uppercase tracking-wider text-sky-400">
                    Guía de Activación en 3 Pasos Sencillos:
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Paso 1 */}
                    <div className="p-3.5 rounded-xl bg-[#080e1e] border border-[#223356] space-y-2 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 font-black text-[10px] flex items-center justify-center border border-sky-500/40">1</span>
                          <span className="text-[10px] text-slate-400 font-mono">Telegram</span>
                        </div>
                        <div className="font-bold text-white text-xs">Habla con @BotFather</div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Abre Telegram y busca <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-sky-400 underline font-semibold">@BotFather</a>. Escribe el comando <code className="bg-[#121c33] px-1 py-0.5 rounded text-amber-300">/newbot</code>.
                        </p>
                      </div>
                      <div className="pt-2">
                        <a
                          href="https://t.me/BotFather"
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-1.5 px-2 bg-sky-600/30 hover:bg-sky-600/50 border border-sky-500/40 text-sky-200 font-bold text-[10px] rounded-lg flex items-center justify-center gap-1 transition-all"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Abrir @BotFather</span>
                        </a>
                      </div>
                    </div>

                    {/* Paso 2 */}
                    <div className="p-3.5 rounded-xl bg-[#080e1e] border border-[#223356] space-y-2 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 font-black text-[10px] flex items-center justify-center border border-sky-500/40">2</span>
                          <span className="text-[10px] text-slate-400 font-mono">Token</span>
                        </div>
                        <div className="font-bold text-white text-xs">Copia el Token de tu Bot</div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Elige un nombre (ej. <em>Mi LifeGlow</em>) y un usuario (ej. <em>miguel_lifeglow_bot</em>). @BotFather te dará tu <strong>Token API</strong>.
                        </p>
                      </div>
                      <div className="text-[10px] text-slate-500 italic bg-[#0f172b] p-1.5 rounded border border-[#1a2948]">
                        Ejemplo: <code>718293849:AAH...</code>
                      </div>
                    </div>

                    {/* Paso 3 */}
                    <div className="p-3.5 rounded-xl bg-[#080e1e] border border-[#223356] space-y-2 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 font-black text-[10px] flex items-center justify-center border border-sky-500/40">3</span>
                          <span className="text-[10px] text-slate-400 font-mono">1 Clic</span>
                        </div>
                        <div className="font-bold text-white text-xs">Vincular Webhook</div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Pega el token abajo o en la variable <code className="text-cyan-300">TELEGRAM_BOT_TOKEN</code> y presiona Vincular. ¡Y listo para usar!
                        </p>
                      </div>
                      <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                        <Check className="w-3 h-3" />
                        <span>Texto, Audios y Fotos con OCR</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Formulario de Registro Rápido */}
                <div className="p-4 rounded-xl bg-[#091124] border border-[#203254] space-y-3">
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>Vincular Bot de Telegram con 1 Clic:</span>
                    <span className="text-[10px] font-mono text-slate-400">Endpoint: /api/telegram/webhook</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={telegramTokenInput}
                      onChange={(e) => setTelegramTokenInput(e.target.value)}
                      placeholder="Pega aquí el Token de tu Bot (ej: 729182938:AAG7vY8u...)"
                      className="flex-1 px-3.5 py-2 rounded-xl bg-[#050914] border border-[#23355a] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                    />
                    <button
                      type="button"
                      onClick={handleRegisterTelegramWebhook}
                      disabled={isRegisteringWebhook}
                      className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isRegisteringWebhook ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5 animate-spin" />
                          <span>Vinculando...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Vincular Webhook</span>
                        </>
                      )}
                    </button>
                  </div>

                  {telegramStatusMessage && (
                    <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                      telegramStatusMessage.success
                        ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                    }`}>
                      {telegramStatusMessage.success ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <X className="w-4 h-4 text-rose-400 shrink-0" />}
                      <span>{telegramStatusMessage.text}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="truncate pr-2">Tu URL Webhook para Telegram: <code className="text-sky-300 font-mono select-all">{telegramWebhookUrl}</code></span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(telegramWebhookUrl, 'telegram')}
                      className="text-sky-400 hover:text-sky-300 font-bold shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      {copiedTelegramHook ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedTelegramHook ? '¡Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                {/* Simulador Interactivo de Chat de Telegram */}
                <div className="p-4 rounded-xl bg-[#080e1c] border border-[#1e2f50] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-bold">
                        ✈️
                      </div>
                      <span className="font-bold text-white text-xs">Simulador en Vivo: Prueba enviar un mensaje como si estuvieras en Telegram</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono bg-[#111a30] px-2 py-0.5 rounded">
                      Prueba en tiempo real
                    </span>
                  </div>

                  {/* Ventana de chat simulada */}
                  <div className="p-3 rounded-xl bg-[#0a1020] border border-[#182642] space-y-2 max-h-48 overflow-y-auto font-sans">
                    {telegramSimChat.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col ${msg.from === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] p-2.5 rounded-2xl text-xs whitespace-pre-line leading-relaxed shadow-sm ${
                            msg.from === 'user'
                              ? 'bg-sky-600 text-white rounded-br-none'
                              : 'bg-[#152340] border border-[#273a63] text-slate-200 rounded-bl-none'
                          }`}
                        >
                          <div>{msg.text}</div>
                          {msg.replyMarkup?.inline_keyboard && msg.replyMarkup.inline_keyboard.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-sky-500/20 flex flex-col gap-1.5 w-full">
                              {msg.replyMarkup.inline_keyboard.map((row, rIdx) => (
                                <div key={rIdx} className="flex flex-col gap-1">
                                  {row.map((btn, bIdx) => (
                                    <button
                                      key={bIdx}
                                      type="button"
                                      disabled={isTelegramSimulating}
                                      onClick={() => handleTelegramCallbackClick(btn.callback_data, btn.text)}
                                      className="w-full text-left px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/40 border border-sky-400/40 text-sky-200 font-semibold text-[11px] transition-all flex items-center justify-between cursor-pointer active:scale-[0.98] disabled:opacity-50"
                                    >
                                      <span className="truncate">{btn.text}</span>
                                      <span className="text-[10px] text-sky-400 shrink-0 font-mono">Tocar ⚡</span>
                                    </button>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-500 px-1 mt-0.5">{msg.time}</span>
                      </div>
                    ))}

                    {isTelegramSimulating && (
                      <div className="flex items-start">
                        <div className="p-2.5 rounded-2xl bg-[#152340] border border-[#273a63] text-sky-300 text-xs flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 animate-spin" />
                          <span>Gemini está clasificando la idea...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input del simulador de chat */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={telegramSimInput}
                      onChange={(e) => setTelegramSimInput(e.target.value)}
                      placeholder="Escribe una tarea o factura (ej: Factura veterinaria juguete $45.000 pagado)..."
                      className="flex-1 px-3 py-2 rounded-xl bg-[#050914] border border-[#203154] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                      onKeyDown={(e) => e.key === 'Enter' && handleSendTelegramSimMessage()}
                    />
                    <button
                      type="button"
                      onClick={handleSendTelegramSimMessage}
                      disabled={!telegramSimInput.trim() || isTelegramSimulating}
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-sky-500/20"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar</span>
                    </button>
                  </div>

                  {/* Ejemplos rápidos y simulación de foto */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 font-semibold">Probar ejemplos:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setTelegramSimInput('¿Qué tengo para hoy?');
                      }}
                      className="px-2 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 text-[11px] font-bold transition-all cursor-pointer"
                    >
                      ☀️ ¿Qué tengo para hoy?
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTelegramSimInput('¿Cuáles son mis hábitos de hoy?');
                      }}
                      className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-[11px] font-bold transition-all cursor-pointer"
                    >
                      🔥 Mis Hábitos de Hoy
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulatePhotoUpload('Factura veterinaria juguete perro $45.000 pagado con tarjeta')}
                      disabled={isTelegramSimulating}
                      className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>📸 Foto Factura ($45k)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTelegramSimInput('Salir a trotar 5km el lunes a las 6am');
                      }}
                      className="px-2 py-1 rounded bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium transition-all cursor-pointer"
                    >
                      📅 Tarea con Hora
                    </button>
                  </div>
                </div>

                {/* Proactive Notification Feature (Recordatorios 10 min antes) */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-purple-950/20 to-sky-950/30 border border-amber-500/30 text-xs text-slate-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-base">⏰</span>
                      <span className="font-bold text-amber-200 text-sm">Alertas y Notificaciones Proactivas (10 min antes)</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Activado
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Tu bot de Telegram te avisará proactivamente <strong>10 minutos antes</strong> de tus compromisos, rutinas (ej: <em>"Hacer flexiones de pecho"</em> o <em>"Reunión de proyecto"</em>) para que alcances a prepararte sin depender de alarmas ruidosas.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSendTestAlert}
                      disabled={isSendingTestAlert}
                      className="px-3.5 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-medium text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>{isSendingTestAlert ? 'Disparando alerta...' : 'Probar Notificación de Ejemplo (Flexiones)'}</span>
                    </button>
                    {alertFeedback && (
                      <span className="text-xs text-emerald-300 font-medium animate-fade-in">
                        {alertFeedback}
                      </span>
                    )}
                  </div>
                </div>

                {/* Post-Task Follow-Up & Feedback Loop (Pregunta 10 min después) */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-sky-950/30 border border-emerald-500/30 text-xs text-slate-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-base">✅</span>
                      <span className="font-bold text-emerald-200 text-sm">Seguimiento Post-Tarea & Retroalimentación con IA</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Automático
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Minutos después de la hora fijada para terminar tu actividad (ej: a las <strong>11:30</strong> si hacías flexiones de 11:00 a 11:20), el bot te preguntará por Telegram: <em>"¿Lograste hacer tu compromiso?"</em> con botones <strong>[✅ Sí / ❌ No]</strong>.
                  </p>
                  <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside bg-[#091428] p-2.5 rounded-lg border border-[#1b2d52]">
                    <li><strong>Si respondes "Sí":</strong> Se marca automáticamente como completada en tu página y recibes una felicitación motivadora.</li>
                    <li><strong>Si respondes "No":</strong> El bot te pregunta con empatía por qué no pudiste hacerla y Gemini IA te da un consejo para reprogramar sin culpa.</li>
                  </ul>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSendTestFollowup}
                      disabled={isSendingTestFollowup}
                      className="px-3.5 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 font-medium text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                      <span>{isSendingTestFollowup ? 'Enviando pregunta...' : 'Probar Pregunta de Seguimiento (11:30)'}</span>
                    </button>
                    {followupFeedback && (
                      <span className="text-xs text-cyan-300 font-medium animate-fade-in">
                        {followupFeedback}
                      </span>
                    )}
                  </div>
                </div>

                {/* Comandos de Telegram Disponibles */}
                <div className="p-3 rounded-xl bg-[#091124] border border-[#1d2d4c] text-[11px] text-slate-300 space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-1 text-xs">
                    <span>✨ Comandos Rápidos que puedes usar en tu Bot de Telegram:</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-400 font-mono pt-1">
                    <div className="p-1.5 bg-[#0e172e] rounded border border-[#1b2b4d]">
                      <span className="text-sky-300 font-bold">/start</span> - Iniciar bot
                    </div>
                    <div className="p-1.5 bg-[#0e172e] rounded border border-[#1b2b4d]">
                      <span className="text-sky-300 font-bold">/status</span> - Estado del server
                    </div>
                    <div className="p-1.5 bg-[#0e172e] rounded border border-[#1b2b4d]">
                      <span className="text-sky-300 font-bold">/categories</span> - Ver 8 áreas
                    </div>
                    <div className="p-1.5 bg-[#0e172e] rounded border border-[#1b2b4d]">
                      <span className="text-sky-300 font-bold">/help</span> - Ver ejemplos
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Guide Content: Modo Pareja (Liz & Miguel) */}
            {activeGuideTab === 'pareja' && (
              <div className="p-5 rounded-2xl bg-[#0c1426] border border-pink-500/40 space-y-6 text-xs text-slate-300 animate-in fade-in">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2d1b3d] pb-3">
                  <div>
                    <h5 className="text-sm font-black text-white flex items-center gap-2">
                      <Heart className="w-4 h-4 fill-pink-400 text-pink-400" />
                      <span>Modo Pareja: Tareas y Compromisos Asignados por Liz</span>
                    </h5>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Permite que Liz te asigne tareas directamente desde Telegram dictando audios o mensajes. La IA las agenda en tu calendario con la insignia especial y te avisa a tiempo.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] font-mono shrink-0">
                    Sincronización Bidireccional
                  </span>
                </div>

                {/* Configuration Panel */}
                <div className="p-4 rounded-xl bg-[#090f20] border border-pink-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-pink-400" />
                      <span className="font-bold text-white text-xs">Ajustes de la Pareja</span>
                    </div>
                    <span className="text-[10px] text-pink-300 font-mono bg-pink-950/60 px-2 py-0.5 rounded border border-pink-500/20">
                      Telegram IDs
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Miguel / Titular */}
                    <div className="p-3 rounded-lg bg-[#0e172e] border border-[#1b2b4d] space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-sky-300">👤 Titular (Tú / Miguel)</label>
                        <span className="text-[10px] text-slate-400">Recibe notificaciones</span>
                      </div>
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={partnerOwnerName}
                          onChange={(e) => setPartnerOwnerName(e.target.value)}
                          placeholder="Nombre (ej: Miguel)"
                          className="w-full bg-[#070c18] border border-[#243354] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-sky-400"
                        />
                        <input
                          type="text"
                          value={partnerOwnerChatId}
                          onChange={(e) => setPartnerOwnerChatId(e.target.value)}
                          placeholder="Chat ID de Telegram (ej: 123456789)"
                          className="w-full bg-[#070c18] border border-[#243354] rounded-lg px-2.5 py-1.5 text-xs font-mono text-sky-200 outline-none focus:border-sky-400"
                        />
                        <p className="text-[10px] text-slate-400">
                          Tip: Escribe <code className="text-sky-300">/soymiguel</code> en tu chat de Telegram para autovincular tu ID.
                        </p>
                      </div>
                    </div>

                    {/* Liz / Pareja */}
                    <div className="p-3 rounded-lg bg-[#160e24] border border-pink-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-pink-300">💜 Pareja (Liz)</label>
                        <span className="text-[10px] text-pink-400">Asigna tareas</span>
                      </div>
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={partnerName}
                          onChange={(e) => setPartnerName(e.target.value)}
                          placeholder="Nombre (ej: Liz)"
                          className="w-full bg-[#070c18] border border-[#243354] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-pink-400"
                        />
                        <input
                          type="text"
                          value={partnerChatId}
                          onChange={(e) => setPartnerChatId(e.target.value)}
                          placeholder="Chat ID de Telegram de Liz"
                          className="w-full bg-[#070c18] border border-[#243354] rounded-lg px-2.5 py-1.5 text-xs font-mono text-pink-200 outline-none focus:border-pink-400"
                        />
                        <p className="text-[10px] text-slate-400">
                          Tip: Pídele a Liz que escriba <code className="text-pink-300">/soyliz</code> en el bot para vincularse de inmediato.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleSavePartnerConfig}
                      disabled={isSavingPartnerConfig}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isSavingPartnerConfig ? 'Guardando...' : 'Guardar Configuración'}</span>
                    </button>
                    {partnerConfigMsg && (
                      <span className={`text-xs font-medium ${partnerConfigMsg.success ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {partnerConfigMsg.text}
                      </span>
                    )}
                  </div>
                </div>

                {/* Simulator Card: Probar Asignación en Vivo */}
                <div className="p-4 rounded-xl bg-[#090f20] border border-[#233556] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span className="font-bold text-white text-xs">Simulador: Probar cómo Liz te asigna una tarea</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono bg-[#111a30] px-2 py-0.5 rounded">
                      Prueba en vivo
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    Simula que Liz escribe al bot: <em>"Limpiar la casa hoy a las 4pm"</em>. Verás cómo se agenda en tu calendario y cómo te notifica a ti con anticipación precisa.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={partnerTaskTitle}
                      onChange={(e) => setPartnerTaskTitle(e.target.value)}
                      placeholder="Título de la tarea"
                      className="sm:col-span-2 bg-[#070c18] border border-[#243354] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-pink-400"
                    />
                    <input
                      type="text"
                      value={partnerTaskTime}
                      onChange={(e) => setPartnerTaskTime(e.target.value)}
                      placeholder="Horario (ej: 16:00 - 17:00)"
                      className="bg-[#070c18] border border-[#243354] rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-200 outline-none focus:border-pink-400"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleSimulatePartnerTask}
                      disabled={isSimulatingPartnerTask}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:opacity-90 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Heart className="w-3.5 h-3.5 fill-white" />
                      <span>{isSimulatingPartnerTask ? 'Asignando tarea...' : `Simular Asignación (${partnerName} ➔ ${partnerOwnerName})`}</span>
                    </button>
                    {partnerTaskFeedback && (
                      <span className="text-xs text-pink-300 font-medium animate-fade-in">
                        {partnerTaskFeedback}
                      </span>
                    )}
                  </div>
                </div>

                {/* Instructions & Timing Explanations */}
                <div className="p-4 rounded-xl bg-[#091124] border border-[#1d2d4c] text-xs text-slate-300 space-y-3">
                  <div className="font-bold text-white text-xs flex items-center gap-2">
                    <span>💡 ¿Cómo funciona la asignación de tareas por Liz?</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                    <div className="p-2.5 bg-[#0e172e] rounded-lg border border-[#1b2b4d] space-y-1">
                      <div className="font-bold text-pink-300">1. ¿Cómo manda Liz las tareas?</div>
                      <p className="text-slate-400">
                        Liz solo necesita abrir el chat con el bot de Telegram y dictarle un audio o escribir: <em>"Limpiar la casa hoy a las 4 de la tarde"</em>.
                      </p>
                    </div>

                    <div className="p-2.5 bg-[#0e172e] rounded-lg border border-[#1b2b4d] space-y-1">
                      <div className="font-bold text-sky-300">2. Notificación en tu Telegram</div>
                      <p className="text-slate-400">
                        Al recibir la tarea, el bot te avisa a ti con el mensaje: <em>"💜 ¡Nueva tarea asignada por tu pareja (Liz)!"</em>.
                      </p>
                    </div>

                    <div className="p-2.5 bg-[#0e172e] rounded-lg border border-[#1b2b4d] space-y-1">
                      <div className="font-bold text-emerald-300">3. Aparece en tu Calendario</div>
                      <p className="text-slate-400">
                        En tu vista de Mes, Semana y Día, la tarea aparecerá destacada con un corazón rosa y la etiqueta <strong>"Asignado por Liz"</strong>.
                      </p>
                    </div>

                    <div className="p-2.5 bg-[#0e172e] rounded-lg border border-[#1b2b4d] space-y-1">
                      <div className="font-bold text-amber-300">4. Recordatorios con Google Calendar</div>
                      <p className="text-slate-400">
                        El recordatorio se sincroniza con tu Google Calendar y Telegram con alarma nativa exactamente <strong>10 minutos antes</strong> de la hora fijada (ej: 3:50 PM para una cita de las 4:00 PM).
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#121c33] rounded-lg border border-[#233556] text-[11px] text-slate-300 flex items-center gap-2">
                    <span className="text-pink-400 font-bold">Comandos de Pareja:</span>
                    <code className="text-pink-300 font-mono">/soyliz</code>
                    <span className="text-slate-500">|</span>
                    <code className="text-sky-300 font-mono">/soymiguel</code>
                    <span className="text-slate-500">|</span>
                    <code className="text-amber-300 font-mono">/pareja</code>
                  </div>
                </div>
              </div>
            )}

            {/* Guide Content: Siri */}
            {activeGuideTab === 'siri' && (
              <div className="p-5 rounded-2xl bg-[#0c1426] border border-[#202e4d] space-y-4 text-xs text-slate-300">
                <div className="flex items-center space-x-2 text-cyan-300 font-bold text-sm">
                  <span>Cómo crear el atajo "Oye Siri, Anotar Idea" (Solo toma 1 minuto):</span>
                </div>

                <ol className="list-decimal list-inside space-y-3 leading-relaxed text-slate-300">
                  <li>
                    Abre la app <strong>Atajos (Shortcuts)</strong> en tu iPhone o iPad y presiona <strong>+</strong> para crear un atajo nuevo con el nombre <strong>"Anotar Idea"</strong> o <strong>"Guardar en LifeBlocks"</strong>.
                  </li>
                  <li>
                    Agrega la acción <strong>"Dictar texto"</strong> (Idioma: Español).
                  </li>
                  <li>
                    Agrega la acción <strong>"Obtener contenido de URL"</strong> con:
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-slate-400 font-mono">
                      <li>URL: <span className="text-cyan-300 select-all">{webhookUrl}</span></li>
                      <li>Método: <strong>POST</strong></li>
                      <li>Cuerpo de la petición: <strong>JSON</strong></li>
                      <li>Campo 1: Clave <span className="text-amber-300 font-bold">text</span> = Variable <em>[Texto dictado]</em></li>
                      <li>Campo 2: Clave <span className="text-amber-300 font-bold">source</span> = <em>"Siri / iPhone"</em></li>
                    </ul>
                  </li>
                  <li>
                    Agrega la acción <strong>"Leer texto con voz"</strong> para que Siri te diga en voz alta la confirmación devuelta por LifeBlocks.
                  </li>
                </ol>

                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200">
                  ✨ <strong>¡Listo!</strong> Ahora cuando vayas caminando con tus AirPods o Apple Watch, solo dices: <em>"Oye Siri, Anotar Idea"</em>, dictas tu pensamiento, y aparecerá organizada automáticamente en LifeBlocks.
                </div>
              </div>
            )}

            {/* Guide Content: Google Assistant */}
            {activeGuideTab === 'google' && (
              <div className="p-5 rounded-2xl bg-[#0c1426] border border-[#202e4d] space-y-4 text-xs text-slate-300">
                <div className="text-cyan-300 font-bold text-sm">
                  Configuración con Google Assistant / Android:
                </div>

                <p className="leading-relaxed">
                  En Android puedes usar <strong>HTTP Shortcuts</strong> (Gratis en Google Play), <strong>Tasker</strong>, o una Rutina de Google Assistant:
                </p>

                <div className="space-y-2">
                  <div className="font-bold text-white">Opción 1: Método Rápido con HTTP Shortcuts / Tasker</div>
                  <p className="text-slate-400">
                    Crea un atajo que pida entrada de voz y haga una petición HTTP POST a:
                  </p>
                  <div className="p-2.5 rounded-lg bg-[#080d1a] border border-[#243354] font-mono text-cyan-300 select-all">
                    {webhookUrl}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-bold text-white">Opción 2: Petición GET simple mediante navegador o Widget</div>
                  <p className="text-slate-400">
                    También puedes llamar por GET pasando el parámetro <code className="text-amber-300 font-bold">?text=...</code>:
                  </p>
                  <div className="p-2.5 rounded-lg bg-[#080d1a] border border-[#243354] font-mono text-cyan-300 text-[11px] truncate select-all">
                    {getUrlExample}
                  </div>
                </div>

                {/* Google Calendar Reminders Banner */}
                <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/40 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#4285F4]/20 border border-[#4285F4]/40 flex items-center justify-center text-[#4285F4] shrink-0">
                        <CalendarDays className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">
                          Recordatorios Nativos con Google Calendar
                        </span>
                        <span className="text-[11px] text-blue-300">
                          Alarmas y notificaciones nativas 10 minutos antes en Android, WearOS y Smartwatch
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleConnectGoogleCal}
                      disabled={isConnectingGoogleCal}
                      className="px-3.5 py-1.5 rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center space-x-1.5 shrink-0"
                    >
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>{isConnectingGoogleCal ? 'Conectando...' : 'Conectar Google Calendar'}</span>
                    </button>
                  </div>

                  {googleCalFeedback && (
                    <div className="text-[11px] text-emerald-300 font-medium p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                      {googleCalFeedback}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Guide Content: Gemini Custom Gem */}
            {activeGuideTab === 'gemini_gem' && (
              <div className="p-5 rounded-2xl bg-[#0c1426] border border-[#202e4d] space-y-4 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-300 font-bold text-sm">
                    OpenAPI 3.0 Schema para Gemini Custom Gem / GPT Actions:
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(JSON.stringify(openApiSchema, null, 2), 'openapi')}
                    className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-[#00363a] font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedOpenApi ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedOpenApi ? '¡Copiado!' : 'Copiar OpenAPI JSON'}</span>
                  </button>
                </div>

                <p className="text-slate-400">
                  En la configuración de tu Gem personalizado o GPT, crea una Acción y pega el siguiente esquema JSON para que el modelo pueda llamar directamente a tu LifeBlocks:
                </p>

                <pre className="p-3 rounded-xl bg-[#080d1a] border border-[#243354] font-mono text-[10px] text-cyan-200 overflow-x-auto max-h-48 scrollbar-thin">
                  {JSON.stringify(openApiSchema, null, 2)}
                </pre>
              </div>
            )}

            {/* Guide Content: cURL */}
            {activeGuideTab === 'curl' && (
              <div className="p-5 rounded-2xl bg-[#0c1426] border border-[#202e4d] space-y-4 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-300 font-bold text-sm">
                    Comando de Terminal / Script cURL:
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(curlSnippet, 'curl')}
                    className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-[#00363a] font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCurl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCurl ? '¡Copiado!' : 'Copiar cURL'}</span>
                  </button>
                </div>

                <pre className="p-3 rounded-xl bg-[#080d1a] border border-[#243354] font-mono text-[11px] text-cyan-200 overflow-x-auto">
                  {curlSnippet}
                </pre>
              </div>
            )}

          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#243354] bg-[#10172b] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-slate-800 to-slate-700 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
