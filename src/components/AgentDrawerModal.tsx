import React, { useState, useEffect, useRef } from 'react';
import { Task, CategoryInfo } from '../types';
import { 
  getTodayTasks, 
  askAgent, 
  fetchTaskRecommendations, 
  AgentRecommendation,
  sendAgentNotification,
  requestNotificationPermission 
} from '../utils/agentHelper';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  Bell, 
  Lightbulb, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Check
} from 'lucide-react';

interface AgentDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  categories: CategoryInfo[];
  initialTask?: Task | null;
  onOpenLogHours: (task: Task) => void;
}

interface ChatMessage {
  id: string;
  sender: 'agent' | 'user';
  text: string;
  timestamp: string;
  recommendation?: AgentRecommendation;
  taskRef?: Task;
}

export const AgentDrawerModal: React.FC<AgentDrawerModalProps> = ({
  isOpen,
  onClose,
  tasks,
  categories,
  initialTask,
  onOpenLogHours,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const todayTasks = getTodayTasks(tasks);

  // Initialize or reset when opened
  useEffect(() => {
    if (isOpen) {
      if ('Notification' in window && Notification.permission === 'granted') {
        setNotificationsGranted(true);
      }

      if (initialTask) {
        setSelectedTask(initialTask);
        loadTaskRecommendation(initialTask);
      } else {
        const welcomeText = todayTasks.length > 0
          ? `¡Hola! Soy tu Agente LifeBlocks. Tienes **${todayTasks.length} actividad(es) agendada(s) para hoy**. ¿En qué puedo ayudarte a enfocar tu energía o qué bloque deseas preparar?`
          : `¡Hola! Soy tu Agente LifeBlocks. Hoy no tienes actividades fijas en el calendario, pero puedo ayudarte a planificar bloques de vida o revisar tus metas pendientes.`;

        setMessages([
          {
            id: '1',
            sender: 'agent',
            text: welcomeText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    }
  }, [isOpen, initialTask?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const loadTaskRecommendation = async (task: Task) => {
    setIsTyping(true);
    try {
      const rec = await fetchTaskRecommendations(task);
      setMessages([
        {
          id: Date.now().toString(),
          sender: 'agent',
          text: `Aquí tienes mi análisis y consejos para tu bloque de **"${task.title}"** (${task.timeSlot || 'Hoy'}):`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          recommendation: rec,
          taskRef: task,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputValue;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputValue('');
    setIsTyping(true);

    try {
      const reply = await askAgent(textToSend, todayTasks, tasks);
      const agentMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, agentMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleTestNotification = async (taskToRemind?: Task) => {
    const target = taskToRemind || todayTasks[0] || tasks[0];
    const granted = await requestNotificationPermission();
    setNotificationsGranted(granted);
    if (granted && target) {
      sendAgentNotification(
        `🔔 Recordatorio LifeBlocks: ${target.title}`,
        `Horario programado: ${target.timeSlot || 'Hoy'}. Meta: ${target.finalGoal || 'Cumplir objetivo'}`
      );
    }
  };

  if (!isOpen) return null;

  const quickPrompts = [
    '¿Qué actividades tengo para hoy y a qué hora?',
    'Dame el resumen y preparación para el resto de la semana (plan nocturno)',
    '¿Cómo me preparo para andar en bicicleta de noche a las 9 PM?',
    'Dame una rutina de enfoque de 25 minutos',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-lg h-full bg-[#0b1326] border-l border-cyan-500/30 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1e294b] bg-gradient-to-r from-[#0e1730] to-[#121e42] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00f2ff] to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#0b1326] rounded-[14px] flex items-center justify-center text-[#00f2ff]">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-white tracking-tight">Agente LifeBlocks</h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Coach Inteligente de Calendario, Hábitos y Metas
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleTestNotification()}
              title="Probar notificación en navegador"
              className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-xl transition-all"
            >
              <Bell className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Agenda Status Bar for Today */}
        <div className="bg-[#0e1730] px-4 py-2.5 border-b border-[#1b2542] flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center space-x-2">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-white">Hoy:</span>
            <span>{todayTasks.length} bloque(s) programado(s)</span>
          </div>
          {todayTasks.length > 0 && (
            <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/60">
              {todayTasks[0].timeSlot || 'Flexible'}
            </span>
          )}
        </div>

        {/* Chat Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-cyan-500 text-[#0b1326] font-medium shadow-md shadow-cyan-500/20'
                    : 'bg-[#131d38] text-slate-200 border border-[#233156] shadow-lg'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Rich Recommendation Card */}
                {msg.recommendation && (
                  <div className="mt-3 pt-3 border-t border-cyan-500/20 space-y-3">
                    
                    {/* Header greeting */}
                    <div className="bg-[#0b1326] p-2.5 rounded-xl border border-cyan-500/30 text-xs text-cyan-200">
                      {msg.recommendation.greeting}
                    </div>

                    {/* Tips List */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Consejos de Preparación</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {msg.recommendation.tips.map((tip, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <span className="text-cyan-400 font-bold">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Prep Checklist */}
                    {msg.recommendation.prepChecklist && msg.recommendation.prepChecklist.length > 0 && (
                      <div className="space-y-1.5 bg-[#0b1326]/70 p-2.5 rounded-xl border border-[#202c4f]">
                        <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Elementos a Alistar</span>
                        </div>
                        <div className="space-y-1">
                          {msg.recommendation.prepChecklist.map((item, idx) => (
                            <div key={idx} className="text-xs text-slate-300 flex items-center space-x-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action button */}
                    {msg.taskRef && (
                      <div className="pt-1 flex items-center justify-between">
                        <button
                          onClick={() => {
                            onClose();
                            onOpenLogHours(msg.taskRef!);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-bold transition-all flex items-center space-x-1.5"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Registrar horas en este bloque</span>
                        </button>
                      </div>
                    )}

                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center space-x-2 text-cyan-400 text-xs bg-[#131d38] p-3 rounded-2xl w-max border border-[#233156]">
              <Sparkles className="w-4 h-4 animate-spin text-[#00f2ff]" />
              <span>El Agente LifeBlocks está analizando tu consulta...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="p-3 bg-[#0d162e] border-t border-[#1a2544] overflow-x-auto">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold whitespace-nowrap flex items-center space-x-1">
              <Lightbulb className="w-3 h-3 text-amber-400" />
              <span>Sugerencias:</span>
            </span>
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-[#142040] hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 text-[11px] border border-[#263760] transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <div className="p-4 bg-[#0b1326] border-t border-[#1e294b]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Pregúntale al agente sobre tus horarios, metas o tips..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#121c38] border border-[#2a3860] focus:border-cyan-400 focus:outline-none text-white text-xs sm:text-sm placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="p-2.5 rounded-xl bg-[#00f2ff] text-[#0b1326] hover:bg-[#38ef7d] disabled:opacity-40 font-bold transition-all shadow-md shadow-cyan-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
