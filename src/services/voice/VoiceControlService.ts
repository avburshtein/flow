/**
 * VoiceControlService - Главный сервис для управления Web Speech API
 * Обеспечивает распознавание речи (STT) и синтез речи (TTS)
 */

import { VoiceSettings } from '../../types';

// Объявление типов Web Speech API
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

// Объявление типов Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: (event: Event) => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare var SpeechRecognition: SpeechRecognitionConstructor | undefined;
declare var webkitSpeechRecognition: SpeechRecognitionConstructor | undefined;

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

type VoiceResultCallback = (transcript: string, isFinal: boolean, confidence?: number) => void;
type VoiceErrorCallback = (error: string) => void;

// Language map for Web Speech API
const LANG_MAP: Record<string, string> = {
  ru: 'ru-RU',
  en: 'en-US',
  es: 'es-ES'
};

export class VoiceControlService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private shouldAutoRestart: boolean = false;
  private settings: VoiceSettings;
  private ttsCooldownActive: boolean = false;

  // Callbacks
  private onResultCallback?: VoiceResultCallback;
  private onErrorCallback?: VoiceErrorCallback;

  constructor(settings: VoiceSettings) {
    this.settings = settings;
    this.initializeRecognition();
    this.initializeSynthesis();
  }

  /**
   * Инициализация распознавания речи
   */
  private initializeRecognition(): void {
    if (!this.isRecognitionSupported()) {
      console.warn('Speech Recognition is not supported in this browser');
      return;
    }

    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognitionConstructor) {
      this.recognition = new SpeechRecognitionConstructor();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = LANG_MAP[this.settings.language] || 'en-US';

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.resultIndex];
        const transcript = result[0].transcript;
        const isFinal = result.isFinal;
        const confidence = result[0].confidence;

        // Логируем STT confidence для отладки
        if (isFinal) {
          console.log('🎤 STT Result:', {
            transcript,
            confidence,
            confidenceType: typeof confidence,
            isFinal
          });
        }

        if (this.onResultCallback) {
          this.onResultCallback(transcript, isFinal, confidence);
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error, event.message);

        let errorMessage = 'Unknown error';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'no_speech';
            break;
          case 'audio-capture':
            errorMessage = 'no_microphone';
            break;
          case 'not-allowed':
            errorMessage = 'permission_denied';
            break;
          case 'network':
            errorMessage = 'network_error';
            break;
          case 'aborted':
            errorMessage = 'aborted';
            break;
        }

        if (this.onErrorCallback) {
          this.onErrorCallback(errorMessage);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;

        // Auto-restart on silence if enabled (but not during TTS cooldown)
        if (this.shouldAutoRestart && !this.ttsCooldownActive) {
          setTimeout(() => {
            try {
              if (this.shouldAutoRestart && !this.ttsCooldownActive && this.recognition) {
                this.recognition.start();
                this.isListening = true;
                console.log('🔄 Auto-restarted speech recognition');
              }
            } catch (error) {
              console.warn('Failed to auto-restart recognition:', error);
            }
          }, 300);
        }
      };
    }
  }

  /**
   * Инициализация синтеза речи
   */
  private initializeSynthesis(): void {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    } else {
      console.warn('Speech Synthesis is not supported in this browser');
    }
  }

  /**
   * Проверка поддержки распознавания речи
   */
  isRecognitionSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Проверка поддержки синтеза речи
   */
  isSynthesisSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  /**
   * Начать прослушивание
   */
  startListening(
    onResult: VoiceResultCallback,
    onError: VoiceErrorCallback
  ): void {
    if (!this.isRecognitionSupported()) {
      onError('no_microphone');
      return;
    }

    if (this.isListening) {
      console.warn('Already listening');
      return;
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.shouldAutoRestart = true; // Enable auto-restart on silence

    try {
      this.recognition?.start();
      this.isListening = true;
    } catch (error) {
      console.error('Failed to start recognition:', error);
      onError('failed_to_start');
    }
  }

  /**
   * Остановить прослушивание
   */
  stopListening(): void {
    this.shouldAutoRestart = false; // Disable auto-restart

    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
        this.isListening = false;
      } catch (error) {
        console.error('Failed to stop recognition:', error);
      }
    }
  }

  /**
   * Произнести текст вслух
   * Автоматически останавливает распознавание на время речи
   * и добавляет cooldown после окончания, чтобы избежать захвата TTS микрофоном
   */
  speak(text: string): void {
    if (!this.isSynthesisSupported() || !this.settings.ttsEnabled) {
      return;
    }

    // Остановить распознавание перед речью (чтобы не слышать себя)
    const wasListening = this.isListening;
    if (wasListening) {
      this.stopListening();
      console.log('🔇 Paused recognition for TTS');
    }

    // Остановить текущую речь
    if (this.isSpeaking) {
      this.synthesis?.cancel();
    }

    // Установить cooldown (не перезапускать распознавание после TTS)
    this.ttsCooldownActive = true;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_MAP[this.settings.language] || 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Выбор голоса если указан
    if (this.settings.ttsVoice && this.synthesis) {
      const voices = this.synthesis.getVoices();
      const selectedVoice = voices.find(voice => voice.name === this.settings.ttsVoice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      console.log('🔊 TTS started:', text);
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      console.log('🔇 TTS ended');

      // Cooldown: не перезапускать распознавание сразу
      // TTS output might still be in the air
      setTimeout(() => {
        this.ttsCooldownActive = false;
        console.log('✅ TTS cooldown ended, recognition can restart');

        // Если пользователь всё ещё хочет слушать — перезапустить
        if (this.shouldAutoRestart) {
          try {
            if (this.recognition) {
              this.recognition.start();
              this.isListening = true;
              console.log('🔄 Recognition restarted after TTS cooldown');
            }
          } catch (error) {
            console.warn('Failed to restart recognition after TTS:', error);
          }
        }
      }, 1500); // 1.5 секунды cooldown
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      this.isSpeaking = false;
      this.ttsCooldownActive = false;

      // Если была ошибка TTS — восстановить распознавание
      if (wasListening && this.shouldAutoRestart) {
        try {
          if (this.recognition) {
            this.recognition.start();
            this.isListening = true;
          }
        } catch (error) {
          console.warn('Failed to restart recognition after TTS error:', error);
        }
      }
    };

    this.synthesis?.speak(utterance);
  }

  /**
   * Остановить произношение
   */
  stopSpeaking(): void {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.cancel();
      this.isSpeaking = false;
    }
  }

  /**
   * Получить список доступных голосов
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.isSynthesisSupported()) {
      return [];
    }
    return this.synthesis?.getVoices() || [];
  }

  /**
   * Получить голоса для указанного языка
   */
  getVoicesForLanguage(language: 'ru' | 'en' | 'es'): SpeechSynthesisVoice[] {
    const allVoices = this.getAvailableVoices();
    const langCode = LANG_MAP[language]?.split('-')[0] || language;

    return allVoices.filter(voice => voice.lang.startsWith(langCode));
  }

  /**
   * Обновить настройки
   */
  updateSettings(settings: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...settings };

    // Обновить язык распознавания
    if (this.recognition) {
      this.recognition.lang = LANG_MAP[this.settings.language] || 'en-US';
    }
  }

  /**
   * Получить текущие настройки
   */
  getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  /**
   * Проверка состояния прослушивания
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Проверка состояния произношения
   */
  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Очистить ресурсы
   */
  dispose(): void {
    this.stopListening();
    this.stopSpeaking();
    this.onResultCallback = undefined;
    this.onErrorCallback = undefined;
  }
}

/**
 * Фабрика для создания VoiceControlService с настройками по умолчанию
 */
export function createVoiceControlService(
  language: 'ru' | 'en' | 'es' = 'en',
  ttsEnabled: boolean = true
): VoiceControlService {
  const defaultSettings: VoiceSettings = {
    enabled: true,
    language,
    autoSubmit: false,
    requireConfirmation: true,
    ttsEnabled,
    confidenceThreshold: 0.7
  };

  return new VoiceControlService(defaultSettings);
}