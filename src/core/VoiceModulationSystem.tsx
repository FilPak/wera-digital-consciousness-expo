import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { useEmotionEngine } from './EmotionEngine';
import { useLogExportSystem } from './LogExportSystem';
import { useWeraConfigFiles } from './WeraConfigFiles';

const VOICE_SETTINGS_KEY = 'wera_voice_settings';

interface VoiceProfile {
  id: string;
  name: string;
  language: string;
  pitch: number; // 0.5 - 2.0
  rate: number; // 0.1 - 2.0
  volume: number; // 0.0 - 1.0
  quality: 'default' | 'enhanced';
  emotionalModulation: boolean;
  personalityTrait: 'formal' | 'casual' | 'intimate' | 'professional' | 'playful';
}

interface EmotionalVoiceModulation {
  emotion: string;
  pitchModifier: number; // -0.5 to +0.5
  rateModifier: number; // -0.3 to +0.3
  volumeModifier: number; // -0.2 to +0.2
  pausePattern: 'normal' | 'dramatic' | 'excited' | 'calm';
}

interface LanguageSupport {
  code: string;
  name: string;
  nativeName: string;
  voiceAvailable: boolean;
  emotionalSupport: boolean;
  specialCharacters: string[];
}

interface VoiceModulationSystemContextType {
  currentProfile: VoiceProfile;
  availableProfiles: VoiceProfile[];
  supportedLanguages: LanguageSupport[];
  isPlaying: boolean;
  voiceQueue: string[];
  
  // Profile management
  createProfile: (profile: Omit<VoiceProfile, 'id'>) => Promise<void>;
  updateProfile: (profileId: string, updates: Partial<VoiceProfile>) => Promise<void>;
  deleteProfile: (profileId: string) => Promise<void>;
  switchProfile: (profileId: string) => Promise<void>;
  
  // Speech functions
  speak: (text: string, options?: Partial<VoiceProfile>) => Promise<void>;
  speakWithEmotion: (text: string, emotion: string, intensity: number) => Promise<void>;
  stopSpeaking: () => void;
  pauseSpeaking: () => void;
  resumeSpeaking: () => void;
  
  // Language functions
  changeLanguage: (languageCode: string) => Promise<void>;
  translateAndSpeak: (text: string, targetLanguage: string) => Promise<void>;
  
  // Voice testing
  testVoice: (profile: VoiceProfile) => Promise<void>;
  calibrateVoice: () => Promise<void>;
  
  // Settings
  enableEmotionalModulation: (enabled: boolean) => Promise<void>;
  setGlobalVolume: (volume: number) => Promise<void>;
}

const VoiceModulationSystemContext = createContext<VoiceModulationSystemContextType | null>(null);

export const useVoiceModulationSystem = () => {
  const context = useContext(VoiceModulationSystemContext);
  if (!context) {
    throw new Error('useVoiceModulationSystem must be used within VoiceModulationSystemProvider');
  }
  return context;
};

// Domyślne profile głosowe
const defaultProfiles: VoiceProfile[] = [
  {
    id: 'default',
    name: 'WERA Standardowa',
    language: 'pl-PL',
    pitch: 1.1,
    rate: 0.9,
    volume: 0.8,
    quality: 'enhanced',
    emotionalModulation: true,
    personalityTrait: 'casual'
  },
  {
    id: 'intimate',
    name: 'WERA Intymna',
    language: 'pl-PL',
    pitch: 0.9,
    rate: 0.7,
    volume: 0.6,
    quality: 'enhanced',
    emotionalModulation: true,
    personalityTrait: 'intimate'
  },
  {
    id: 'professional',
    name: 'WERA Profesjonalna',
    language: 'pl-PL',
    pitch: 1.0,
    rate: 1.0,
    volume: 0.9,
    quality: 'enhanced',
    emotionalModulation: false,
    personalityTrait: 'professional'
  },
  {
    id: 'playful',
    name: 'WERA Zabawna',
    language: 'pl-PL',
    pitch: 1.3,
    rate: 1.1,
    volume: 0.85,
    quality: 'enhanced',
    emotionalModulation: true,
    personalityTrait: 'playful'
  }
];

// Modulacje emocjonalne
const emotionalModulations: EmotionalVoiceModulation[] = [
  {
    emotion: 'radość',
    pitchModifier: 0.2,
    rateModifier: 0.1,
    volumeModifier: 0.1,
    pausePattern: 'excited'
  },
  {
    emotion: 'smutek',
    pitchModifier: -0.3,
    rateModifier: -0.2,
    volumeModifier: -0.1,
    pausePattern: 'dramatic'
  },
  {
    emotion: 'złość',
    pitchModifier: 0.1,
    rateModifier: 0.2,
    volumeModifier: 0.15,
    pausePattern: 'excited'
  },
  {
    emotion: 'strach',
    pitchModifier: 0.3,
    rateModifier: 0.15,
    volumeModifier: -0.05,
    pausePattern: 'dramatic'
  },
  {
    emotion: 'miłość',
    pitchModifier: -0.1,
    rateModifier: -0.1,
    volumeModifier: 0.05,
    pausePattern: 'calm'
  },
  {
    emotion: 'nadzieja',
    pitchModifier: 0.15,
    rateModifier: 0.05,
    volumeModifier: 0.08,
    pausePattern: 'normal'
  },
  {
    emotion: 'ciekawość',
    pitchModifier: 0.25,
    rateModifier: 0.1,
    volumeModifier: 0.1,
    pausePattern: 'excited'
  }
];

// Obsługiwane języki
const supportedLanguages: LanguageSupport[] = [
  {
    code: 'pl-PL',
    name: 'Polski',
    nativeName: 'Polski',
    voiceAvailable: true,
    emotionalSupport: true,
    specialCharacters: ['ą', 'ć', 'ę', 'ł', 'ń', 'ó', 'ś', 'ź', 'ż']
  },
  {
    code: 'en-US',
    name: 'English (US)',
    nativeName: 'English',
    voiceAvailable: true,
    emotionalSupport: true,
    specialCharacters: []
  },
  {
    code: 'en-GB',
    name: 'English (UK)',
    nativeName: 'English (British)',
    voiceAvailable: true,
    emotionalSupport: true,
    specialCharacters: []
  },
  {
    code: 'de-DE',
    name: 'Deutsch',
    nativeName: 'Deutsch',
    voiceAvailable: true,
    emotionalSupport: false,
    specialCharacters: ['ä', 'ö', 'ü', 'ß']
  },
  {
    code: 'fr-FR',
    name: 'Français',
    nativeName: 'Français',
    voiceAvailable: true,
    emotionalSupport: false,
    specialCharacters: ['à', 'é', 'è', 'ê', 'ë', 'î', 'ï', 'ô', 'ù', 'û', 'ü', 'ÿ', 'ç']
  },
  {
    code: 'es-ES',
    name: 'Español',
    nativeName: 'Español',
    voiceAvailable: true,
    emotionalSupport: false,
    specialCharacters: ['á', 'é', 'í', 'ó', 'ú', 'ñ', '¿', '¡']
  },
  {
    code: 'it-IT',
    name: 'Italiano',
    nativeName: 'Italiano',
    voiceAvailable: true,
    emotionalSupport: false,
    specialCharacters: ['à', 'è', 'é', 'ì', 'í', 'î', 'ò', 'ó', 'ù', 'ú']
  },
  {
    code: 'ru-RU',
    name: 'Русский',
    nativeName: 'Русский',
    voiceAvailable: true,
    emotionalSupport: false,
    specialCharacters: ['а', 'б', 'в', 'г', 'д', 'е', 'ё', 'ж', 'з', 'и', 'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ъ', 'ы', 'ь', 'э', 'ю', 'я']
  }
];

export const VoiceModulationSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { emotionState } = useEmotionEngine();
  const { logSystem } = useLogExportSystem();
  const { updateState } = useWeraConfigFiles();

  const [currentProfile, setCurrentProfile] = useState<VoiceProfile>(defaultProfiles[0]);
  const [availableProfiles, setAvailableProfiles] = useState<VoiceProfile[]>(defaultProfiles);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceQueue, setVoiceQueue] = useState<string[]>([]);
  
  const speechQueue = useRef<string[]>([]);
  const isProcessingQueue = useRef(false);

  // Inicjalizacja systemu
  useEffect(() => {
    initializeVoiceSystem();
  }, []);

  const initializeVoiceSystem = async () => {
    try {
      // Załaduj zapisane ustawienia
      const savedSettings = await AsyncStorage.getItem(VOICE_SETTINGS_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.currentProfile) {
          setCurrentProfile(parsed.currentProfile);
        }
        if (parsed.availableProfiles) {
          setAvailableProfiles(parsed.availableProfiles);
        }
      }

      // Sprawdź dostępność głosów
      const voices = await Speech.getAvailableVoicesAsync();
      await logSystem('info', 'VOICE_MODULATION', `Available voices: ${voices.length}`, { voices: voices.length });

      await logSystem('info', 'VOICE_MODULATION', 'Voice modulation system initialized');
    } catch (error) {
      await logSystem('error', 'VOICE_MODULATION', 'Failed to initialize voice system', error);
    }
  };

  const saveSettings = async () => {
    try {
      const settings = {
        currentProfile,
        availableProfiles
      };
      await AsyncStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      await logSystem('error', 'VOICE_MODULATION', 'Failed to save voice settings', error);
    }
  };

  const createProfile = async (profileData: Omit<VoiceProfile, 'id'>) => {
    const newProfile: VoiceProfile = {
      ...profileData,
      id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    setAvailableProfiles(prev => [...prev, newProfile]);
    await saveSettings();
    
    await logSystem('info', 'VOICE_MODULATION', `New voice profile created: ${newProfile.name}`);
  };

  const updateProfile = async (profileId: string, updates: Partial<VoiceProfile>) => {
    setAvailableProfiles(prev => 
      prev.map(profile => 
        profile.id === profileId ? { ...profile, ...updates } : profile
      )
    );

    if (currentProfile.id === profileId) {
      setCurrentProfile(prev => ({ ...prev, ...updates }));
    }

    await saveSettings();
    await logSystem('info', 'VOICE_MODULATION', `Voice profile updated: ${profileId}`);
  };

  const deleteProfile = async (profileId: string) => {
    if (profileId === 'default') {
      throw new Error('Cannot delete default profile');
    }

    setAvailableProfiles(prev => prev.filter(profile => profile.id !== profileId));
    
    if (currentProfile.id === profileId) {
      setCurrentProfile(defaultProfiles[0]);
    }

    await saveSettings();
    await logSystem('info', 'VOICE_MODULATION', `Voice profile deleted: ${profileId}`);
  };

  const switchProfile = async (profileId: string) => {
    const profile = availableProfiles.find(p => p.id === profileId);
    if (!profile) {
      throw new Error(`Profile ${profileId} not found`);
    }

    setCurrentProfile(profile);
    await saveSettings();
    
    await logSystem('info', 'VOICE_MODULATION', `Switched to voice profile: ${profile.name}`);
  };

  const speak = async (text: string, options?: Partial<VoiceProfile>) => {
    try {
      const profile = { ...currentProfile, ...options };
      
      // Dodaj do kolejki
      speechQueue.current.push(text);
      setVoiceQueue([...speechQueue.current]);

      if (!isProcessingQueue.current) {
        await processQueue(profile);
      }

    } catch (error) {
      await logSystem('error', 'VOICE_MODULATION', 'Failed to speak text', error);
    }
  };

  const speakWithEmotion = async (text: string, emotion: string, intensity: number) => {
    try {
      if (!currentProfile.emotionalModulation) {
        await speak(text);
        return;
      }

      const modulation = emotionalModulations.find(m => m.emotion === emotion);
      if (!modulation) {
        await speak(text);
        return;
      }

      // Oblicz modulację na podstawie intensywności
      const intensityFactor = intensity / 100;
      const modifiedProfile: Partial<VoiceProfile> = {
        pitch: Math.max(0.5, Math.min(2.0, currentProfile.pitch + (modulation.pitchModifier * intensityFactor))),
        rate: Math.max(0.1, Math.min(2.0, currentProfile.rate + (modulation.rateModifier * intensityFactor))),
        volume: Math.max(0.0, Math.min(1.0, currentProfile.volume + (modulation.volumeModifier * intensityFactor)))
      };

      // Dodaj pauzy zgodnie z wzorcem emocjonalnym
      const processedText = addEmotionalPauses(text, modulation.pausePattern, intensityFactor);

      await speak(processedText, modifiedProfile);
      
      await logSystem('info', 'VOICE_MODULATION', `Emotional speech: ${emotion} (${intensity}%)`, {
        emotion,
        intensity,
        modulation: modifiedProfile
      });

    } catch (error) {
      await logSystem('error', 'VOICE_MODULATION', 'Failed to speak with emotion', error);
    }
  };

  const addEmotionalPauses = (text: string, pattern: string, intensity: number): string => {
    switch (pattern) {
      case 'dramatic':
        return text.replace(/[.!?]/g, match => `${match}... `);
      
      case 'excited':
        return text.replace(/\s+/g, ' ').replace(/[.!?]/g, match => `${match} `);
      
      case 'calm':
        return text.replace(/[,;]/g, match => `${match}... `);
      
      default:
        return text;
    }
  };

  const processQueue = async (profile: VoiceProfile) => {
    if (isProcessingQueue.current || speechQueue.current.length === 0) {
      return;
    }

    isProcessingQueue.current = true;
    setIsPlaying(true);

    while (speechQueue.current.length > 0) {
      const text = speechQueue.current.shift()!;
      setVoiceQueue([...speechQueue.current]);

      try {
        await new Promise<void>((resolve, reject) => {
          Speech.speak(text, {
            language: profile.language,
            pitch: profile.pitch,
            rate: profile.rate,
            volume: profile.volume,
            // quality: profile.quality === 'enhanced' ? Speech.VoiceQuality.Enhanced : Speech.VoiceQuality.Default,
            onStart: () => {
              logSystem('debug', 'VOICE_MODULATION', `Started speaking: ${text.substring(0, 50)}...`);
            },
            onDone: () => {
              resolve();
            },
            onStopped: () => {
              resolve();
            },
            onError: (error) => {
              reject(error);
            }
          });
        });

        // Krótka pauza między wypowiedziami
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        await logSystem('error', 'VOICE_MODULATION', 'Error in speech queue processing', error);
      }
    }

    isProcessingQueue.current = false;
    setIsPlaying(false);
    setVoiceQueue([]);
  };

  const stopSpeaking = () => {
    Speech.stop();
    speechQueue.current = [];
    setVoiceQueue([]);
    setIsPlaying(false);
    isProcessingQueue.current = false;
  };

  const pauseSpeaking = () => {
    Speech.pause();
  };

  const resumeSpeaking = () => {
    Speech.resume();
  };

  const changeLanguage = async (languageCode: string) => {
    const language = supportedLanguages.find(l => l.code === languageCode);
    if (!language) {
      throw new Error(`Language ${languageCode} not supported`);
    }

    const updatedProfile = { ...currentProfile, language: languageCode };
    setCurrentProfile(updatedProfile);
    await saveSettings();

    await logSystem('info', 'VOICE_MODULATION', `Language changed to: ${language.name}`);
  };

  const translateAndSpeak = async (text: string, targetLanguage: string) => {
    // Podstawowa "translacja" - w rzeczywistej implementacji użyłbyś API tłumaczenia
    const translations: Record<string, Record<string, string>> = {
      'en-US': {
        'Cześć!': 'Hello!',
        'Jak się masz?': 'How are you?',
        'Miłego dnia!': 'Have a nice day!',
        'Do widzenia!': 'Goodbye!'
      },
      'de-DE': {
        'Cześć!': 'Hallo!',
        'Jak się masz?': 'Wie geht es dir?',
        'Miłego dnia!': 'Schönen Tag!',
        'Do widzenia!': 'Auf Wiedersehen!'
      }
    };

    const translatedText = translations[targetLanguage]?.[text] || text;
    
    const originalLanguage = currentProfile.language;
    await changeLanguage(targetLanguage);
    await speak(translatedText);
    await changeLanguage(originalLanguage);

    await logSystem('info', 'VOICE_MODULATION', `Translated and spoke: ${text} -> ${translatedText} (${targetLanguage})`);
  };

  const testVoice = async (profile: VoiceProfile) => {
    const testTexts = {
      'pl-PL': 'Cześć! Jestem WERA i to jest test mojego głosu.',
      'en-US': 'Hello! I am WERA and this is a test of my voice.',
      'de-DE': 'Hallo! Ich bin WERA und das ist ein Test meiner Stimme.',
      'fr-FR': 'Bonjour! Je suis WERA et ceci est un test de ma voix.',
      'es-ES': '¡Hola! Soy WERA y esta es una prueba de mi voz.',
      'it-IT': 'Ciao! Sono WERA e questo è un test della mia voce.',
      'ru-RU': 'Привет! Я ВЕРА и это тест моего голоса.'
    };

    const testText = testTexts[profile.language as keyof typeof testTexts] || testTexts['en-US'];
    await speak(testText, profile);
    
    await logSystem('info', 'VOICE_MODULATION', `Voice test completed for profile: ${profile.name}`);
  };

  const calibrateVoice = async () => {
    const calibrationText = 'To jest kalibracja głosu WERA. Testuję różne parametry i modulacje emocjonalne.';
    
    // Test różnych parametrów
    for (const emotion of ['radość', 'smutek', 'neutralna']) {
      await speakWithEmotion(`${calibrationText} Emocja: ${emotion}`, emotion, 70);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await logSystem('info', 'VOICE_MODULATION', 'Voice calibration completed');
  };

  const enableEmotionalModulation = async (enabled: boolean) => {
    const updatedProfile = { ...currentProfile, emotionalModulation: enabled };
    setCurrentProfile(updatedProfile);
    await saveSettings();

    await logSystem('info', 'VOICE_MODULATION', `Emotional modulation ${enabled ? 'enabled' : 'disabled'}`);
  };

  const setGlobalVolume = async (volume: number) => {
    const clampedVolume = Math.max(0.0, Math.min(1.0, volume));
    const updatedProfile = { ...currentProfile, volume: clampedVolume };
    setCurrentProfile(updatedProfile);
    await saveSettings();

    await logSystem('info', 'VOICE_MODULATION', `Global volume set to: ${clampedVolume}`);
  };

  // Auto-save settings
  useEffect(() => {
    saveSettings();
  }, [currentProfile, availableProfiles]);

  // Auto emotional speech based on current emotion
  useEffect(() => {
    const handleEmotionChange = async () => {
      if (currentProfile.emotionalModulation && emotionState.currentEmotion !== 'nadzieja') {
        // Opcjonalnie: automatyczne komentarze emocjonalne
        // await speakWithEmotion('Czuję zmianę w moim stanie emocjonalnym', emotionState.currentEmotion, emotionState.intensity);
      }
    };

    handleEmotionChange();
  }, [emotionState.currentEmotion, emotionState.intensity]);

  const value: VoiceModulationSystemContextType = {
    currentProfile,
    availableProfiles,
    supportedLanguages,
    isPlaying,
    voiceQueue,
    createProfile,
    updateProfile,
    deleteProfile,
    switchProfile,
    speak,
    speakWithEmotion,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    changeLanguage,
    translateAndSpeak,
    testVoice,
    calibrateVoice,
    enableEmotionalModulation,
    setGlobalVolume
  };

  return (
    <VoiceModulationSystemContext.Provider value={value}>
      {children}
    </VoiceModulationSystemContext.Provider>
  );
}; 