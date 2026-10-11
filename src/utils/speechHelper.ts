// Helper for AI Coach Voice Announcements & Speech Synthesis in Spanish

const SPEECH_ENABLED_KEY = 'lifeflow_assistant_voice_enabled_v1';

export function isSpeechSynthesisAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function isAssistantVoiceEnabled(): boolean {
  try {
    const saved = localStorage.getItem(SPEECH_ENABLED_KEY);
    return saved === null ? true : saved === 'true'; // Enabled by default
  } catch {
    return true;
  }
}

export function setAssistantVoiceEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SPEECH_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch (e) {
    console.error('Error saving voice enabled state', e);
  }
}

export function playAssistantChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Smooth pleasant chime: dual sine frequency
    const now = ctx.currentTime;
    
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15); // D6

    gainNode.gain.setValueAtTime(0.08, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.36);
    osc2.stop(now + 0.36);
  } catch (e) {
    // Non-blocking audio fallback
  }
}

export function speakAssistantMessage(
  text: string, 
  options?: { 
    force?: boolean; 
    onStart?: () => void; 
    onEnd?: () => void;
    rate?: number;
    pitch?: number;
  }
): boolean {
  if (!isSpeechSynthesisAvailable()) return false;
  if (!options?.force && !isAssistantVoiceEnabled()) return false;

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = options?.rate || 1.05;
    utterance.pitch = options?.pitch || 1.0;

    // Look for Spanish voices
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => 
      v.lang === 'es-ES' || 
      v.lang === 'es-MX' || 
      v.lang.startsWith('es') ||
      v.name.toLowerCase().includes('spanish')
    );

    if (esVoice) {
      utterance.voice = esVoice;
    }

    if (options?.onStart) {
      utterance.onstart = options.onStart;
    }

    if (options?.onEnd) {
      utterance.onend = options.onEnd;
      utterance.onerror = options.onEnd;
    }

    playAssistantChime();
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (e) {
    console.warn('Speech synthesis error:', e);
    return false;
  }
}

export function cancelAssistantSpeech(): void {
  if (isSpeechSynthesisAvailable()) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

export function formatIdeaAssignmentAnnouncement(title: string, categoryName: string, typeLabel?: string): string {
  const cleanTitle = title.length > 50 ? `${title.substring(0, 48)}...` : title;
  if (typeLabel && typeLabel !== 'Otro' && typeLabel !== 'Idea') {
    return `He asignado tu idea "${cleanTitle}" a la categoría de ${categoryName}, como ${typeLabel}.`;
  }
  return `He asignado tu idea "${cleanTitle}" a la categoría de ${categoryName}.`;
}
