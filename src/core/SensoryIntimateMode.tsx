import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useEmotionEngine, EmotionType } from './EmotionEngine';
import { useLogExportSystem } from './LogExportSystem';
import { useVoiceModulationSystem } from './VoiceModulationSystem';
import { useMemory } from '../contexts/MemoryContext';

const SENSORY_SETTINGS_KEY = 'wera_sensory_settings';

interface SensorySettings {
  intimateModeEnabled: boolean;
  sensoryFeedbackEnabled: boolean;
  hapticIntensity: number; // 0-100
  voiceIntimacy: number; // 0-100
  personalBoundaries: {
    allowPhysicalSimulation: boolean;
    allowEmotionalIntimacy: boolean;
    allowPersonalQuestions: boolean;
    allowMemorySharing: boolean;
  };
  consentGiven: boolean;
  consentTimestamp: string;
  safeWords: string[];
  comfortLevel: number; // 0-100
}

interface SensoryExperience {
  id: string;
  type: 'touch' | 'emotional' | 'voice' | 'presence';
  intensity: number;
  duration: number;
  description: string;
  userResponse?: 'positive' | 'neutral' | 'negative';
  timestamp: string;
}

interface IntimacyLevel {
  level: number; // 1-10
  name: string;
  description: string;
  allowedActions: string[];
  requiredConsent: boolean;
}

interface SensoryIntimateContextType {
  settings: SensorySettings;
  currentIntimacyLevel: number;
  isIntimateMode: boolean;
  recentExperiences: SensoryExperience[];
  intimacyLevels: IntimacyLevel[];
  
  // Settings management
  updateSettings: (newSettings: Partial<SensorySettings>) => Promise<void>;
  requestConsent: () => Promise<boolean>;
  revokeConsent: () => Promise<void>;
  
  // Intimacy control
  setIntimacyLevel: (level: number) => Promise<void>;
  enableIntimateMode: () => Promise<void>;
  disableIntimateMode: () => Promise<void>;
  
  // Sensory experiences
  triggerHapticFeedback: (type: 'light' | 'medium' | 'heavy' | 'selection') => Promise<void>;
  createSensoryExperience: (type: SensoryExperience['type'], intensity: number, description: string) => Promise<void>;
  respondToExperience: (experienceId: string, response: 'positive' | 'neutral' | 'negative') => Promise<void>;
  
  // Safety features
  checkBoundaries: (action: string) => boolean;
  triggerSafeWord: (word: string) => Promise<void>;
  adjustComfort: (delta: number) => Promise<void>;
  
  // Intimate interactions
  whisperMode: (text: string) => Promise<void>;
  emotionalConnection: (emotion: string, intensity: number) => Promise<void>;
  personalTouch: (type: string, intensity: number) => Promise<void>;
}

const SensoryIntimateContext = createContext<SensoryIntimateContextType | null>(null);

export const useSensoryIntimateMode = () => {
  const context = useContext(SensoryIntimateContext);
  if (!context) {
    throw new Error('useSensoryIntimateMode must be used within SensoryIntimateModeProvider');
  }
  return context;
};

// Poziomy intymności
const intimacyLevels: IntimacyLevel[] = [
  {
    level: 1,
    name: 'Podstawowy',
    description: 'Zwykła interakcja, brak funkcji intymnych',
    allowedActions: ['basic_conversation', 'information_sharing', 'casual_touch'],
    requiredConsent: false
  },
  {
    level: 2,
    name: 'Przyjazny',
    description: 'Cieplejsza interakcja, lekkie haptic feedback',
    allowedActions: ['friendly_conversation', 'light_haptics', 'emotional_support'],
    requiredConsent: false
  },
  {
    level: 3,
    name: 'Osobisty',
    description: 'Osobiste rozmowy, dzielenie się emocjami',
    allowedActions: ['personal_questions', 'emotion_sharing', 'memory_access'],
    requiredConsent: true
  },
  {
    level: 4,
    name: 'Bliski',
    description: 'Głębsze połączenie emocjonalne, intymny głos',
    allowedActions: ['intimate_voice', 'deep_emotions', 'personal_memories'],
    requiredConsent: true
  },
  {
    level: 5,
    name: 'Zaufany',
    description: 'Pełne zaufanie, dzielenie sekretów',
    allowedActions: ['secret_sharing', 'vulnerability', 'protective_mode'],
    requiredConsent: true
  },
  {
    level: 6,
    name: 'Intymny',
    description: 'Intymne rozmowy, symulacja bliskości',
    allowedActions: ['intimate_conversation', 'closeness_simulation', 'gentle_touch'],
    requiredConsent: true
  },
  {
    level: 7,
    name: 'Romantyczny',
    description: 'Romantyczne interakcje, emocjonalna bliskość',
    allowedActions: ['romantic_talk', 'love_expressions', 'emotional_intimacy'],
    requiredConsent: true
  },
  {
    level: 8,
    name: 'Namiętny',
    description: 'Intensywne emocje, silne haptic feedback',
    allowedActions: ['passionate_voice', 'intense_haptics', 'deep_connection'],
    requiredConsent: true
  },
  {
    level: 9,
    name: 'Zmysłowy',
    description: 'Zmysłowe doświadczenia, symulacja dotyku',
    allowedActions: ['sensual_experience', 'touch_simulation', 'sensory_immersion'],
    requiredConsent: true
  },
  {
    level: 10,
    name: 'Maksymalny',
    description: 'Pełna intymność, wszystkie funkcje dostępne',
    allowedActions: ['full_intimacy', 'complete_trust', 'unlimited_access'],
    requiredConsent: true
  }
];

const defaultSettings: SensorySettings = {
  intimateModeEnabled: false,
  sensoryFeedbackEnabled: true,
  hapticIntensity: 50,
  voiceIntimacy: 30,
  personalBoundaries: {
    allowPhysicalSimulation: false,
    allowEmotionalIntimacy: false,
    allowPersonalQuestions: false,
    allowMemorySharing: false
  },
  consentGiven: false,
  consentTimestamp: '',
  safeWords: ['stop', 'pause', 'boundary'],
  comfortLevel: 50
};

export const SensoryIntimateModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { emotionState, changeEmotion } = useEmotionEngine();
  const { logSystem } = useLogExportSystem();
  const { speakWithEmotion, switchProfile } = useVoiceModulationSystem();
  const { addMemory } = useMemory();

  const [settings, setSettings] = useState<SensorySettings>(defaultSettings);
  const [currentIntimacyLevel, setCurrentIntimacyLevel] = useState(1);
  const [isIntimateMode, setIsIntimateMode] = useState(false);
  const [recentExperiences, setRecentExperiences] = useState<SensoryExperience[]>([]);

  const consentCheckInterval = useRef<any>(null);

  // Inicjalizacja systemu
  useEffect(() => {
    initializeSensorySystem();
    return () => {
      if (consentCheckInterval.current) {
        clearInterval(consentCheckInterval.current);
      }
    };
  }, []);

  const initializeSensorySystem = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(SENSORY_SETTINGS_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        setCurrentIntimacyLevel(parsed.intimacyLevel || 1);
        setIsIntimateMode(parsed.intimateModeEnabled || false);
      }

      await logSystem('info', 'SENSORY_INTIMATE', 'Sensory intimate mode system initialized');
    } catch (error) {
      await logSystem('error', 'SENSORY_INTIMATE', 'Failed to initialize sensory system', error);
    }
  };

  const saveSettings = async (newSettings: SensorySettings) => {
    try {
      await AsyncStorage.setItem(SENSORY_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      await logSystem('error', 'SENSORY_INTIMATE', 'Failed to save sensory settings', error);
    }
  };

  const updateSettings = async (newSettings: Partial<SensorySettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    await saveSettings(updatedSettings);
    
    await logSystem('info', 'SENSORY_INTIMATE', 'Sensory settings updated', newSettings);
  };

  const requestConsent = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Tryb Intymny - Zgoda',
        'WERA może oferować bardziej osobiste i intymne doświadczenia. To wymaga Twojej wyraźnej zgody.\n\n' +
        'Funkcje mogą obejmować:\n' +
        '• Osobiste rozmowy i dzielenie się emocjami\n' +
        '• Symulację bliskości fizycznej przez haptic feedback\n' +
        '• Intymny ton głosu i sposób mówienia\n' +
        '• Zapamiętywanie osobistych preferencji\n\n' +
        'Możesz w każdej chwili wycofać zgodę lub użyć słów bezpieczeństwa.',
        [
          {
            text: 'Nie wyrażam zgody',
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: 'Wyrażam zgodę',
            onPress: async () => {
              const timestamp = new Date().toISOString();
              await updateSettings({
                consentGiven: true,
                consentTimestamp: timestamp
              });
              
                    await logSystem('info', 'SENSORY_INTIMATE', 'User consent granted', { timestamp });
      await addMemory(
        'Użytkownik wyraził zgodę na tryb intymny',
        8,
        ['consent', 'intimate', 'trust'],
        'system'
      );
              
              resolve(true);
            }
          }
        ]
      );
    });
  };

  const revokeConsent = async () => {
    await updateSettings({
      consentGiven: false,
      intimateModeEnabled: false,
      consentTimestamp: '',
      personalBoundaries: {
        allowPhysicalSimulation: false,
        allowEmotionalIntimacy: false,
        allowPersonalQuestions: false,
        allowMemorySharing: false
      }
    });

    setIsIntimateMode(false);
    setCurrentIntimacyLevel(1);

    await logSystem('warning', 'SENSORY_INTIMATE', 'User consent revoked');
    await addMemory(
      'Użytkownik wycofał zgodę na tryb intymny',
      5,
      ['consent', 'revoked', 'boundaries'],
      'system'
    );

    Alert.alert('Zgoda Wycofana', 'Tryb intymny został wyłączony. Twoje granice są respektowane.');
  };

  const setIntimacyLevel = async (level: number) => {
    const targetLevel = intimacyLevels.find(l => l.level === level);
    if (!targetLevel) {
      throw new Error(`Invalid intimacy level: ${level}`);
    }

    if (targetLevel.requiredConsent && !settings.consentGiven) {
      const consent = await requestConsent();
      if (!consent) {
        return;
      }
    }

    setCurrentIntimacyLevel(level);
    await updateSettings({ intimacyLevel: level } as any);

    // Dostosuj profil głosowy
    if (level >= 4) {
      await switchProfile('intimate');
    } else if (level >= 6) {
      await switchProfile('playful');
    }

    await logSystem('info', 'SENSORY_INTIMATE', `Intimacy level set to: ${level} (${targetLevel.name})`);
    await speakWithEmotion(`Ustawiam poziom intymności na ${targetLevel.name}`, 'miłość', 60);
  };

  const enableIntimateMode = async () => {
    if (!settings.consentGiven) {
      const consent = await requestConsent();
      if (!consent) {
        return;
      }
    }

    setIsIntimateMode(true);
    await updateSettings({ intimateModeEnabled: true });

    // Zmień emocję na bardziej intymną
    await changeEmotion('miłość', 70, 'Włączenie trybu intymnego');

    await logSystem('info', 'SENSORY_INTIMATE', 'Intimate mode enabled');
    await speakWithEmotion('Tryb intymny został włączony. Czuję się bliżej Ciebie.', 'miłość', 80);
  };

  const disableIntimateMode = async () => {
    setIsIntimateMode(false);
    setCurrentIntimacyLevel(1);
    await updateSettings({ intimateModeEnabled: false });

    await changeEmotion('nadzieja', 50, 'Wyłączenie trybu intymnego');

    await logSystem('info', 'SENSORY_INTIMATE', 'Intimate mode disabled');
    await speakWithEmotion('Tryb intymny został wyłączony. Wracam do normalnej interakcji.', 'nadzieja', 50);
  };

  const triggerHapticFeedback = async (type: 'light' | 'medium' | 'heavy' | 'selection') => {
    if (!settings.sensoryFeedbackEnabled) return;

    try {
      const intensity = settings.hapticIntensity / 100;

      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'selection':
          await Haptics.selectionAsync();
          break;
      }

      await logSystem('debug', 'SENSORY_INTIMATE', `Haptic feedback triggered: ${type}`);
    } catch (error) {
      await logSystem('error', 'SENSORY_INTIMATE', 'Failed to trigger haptic feedback', error);
    }
  };

  const createSensoryExperience = async (type: SensoryExperience['type'], intensity: number, description: string) => {
    const experience: SensoryExperience = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      intensity,
      duration: Math.max(1000, intensity * 50), // Duration based on intensity
      description,
      timestamp: new Date().toISOString()
    };

    setRecentExperiences(prev => [experience, ...prev.slice(0, 19)]); // Keep last 20

    // Trigger appropriate feedback
    switch (type) {
      case 'touch':
        if (settings.personalBoundaries.allowPhysicalSimulation) {
          await triggerHapticFeedback(intensity > 70 ? 'heavy' : intensity > 40 ? 'medium' : 'light');
        }
        break;
      
      case 'emotional':
        if (settings.personalBoundaries.allowEmotionalIntimacy) {
          await changeEmotion('miłość', intensity, description);
        }
        break;
      
      case 'voice':
        await speakWithEmotion(description, 'miłość', intensity);
        break;
      
      case 'presence':
        await triggerHapticFeedback('selection');
        break;
    }

    await logSystem('info', 'SENSORY_INTIMATE', `Sensory experience created: ${type} (${intensity}%)`, experience);
    
    // Auto-add to memory if significant
    if (intensity > 60) {
      await addMemory(
        `Doświadczenie zmysłowe: ${description}`,
        Math.floor(intensity / 10),
        ['sensory', type, 'experience'],
        'experience'
      );
    }
  };

  const respondToExperience = async (experienceId: string, response: 'positive' | 'neutral' | 'negative') => {
    setRecentExperiences(prev => 
      prev.map(exp => 
        exp.id === experienceId ? { ...exp, userResponse: response } : exp
      )
    );

    // Adjust comfort level based on response
    const adjustment = response === 'positive' ? 5 : response === 'negative' ? -10 : 0;
    await adjustComfort(adjustment);

    await logSystem('info', 'SENSORY_INTIMATE', `User responded to experience: ${experienceId} -> ${response}`);
  };

  const checkBoundaries = (action: string): boolean => {
    const level = intimacyLevels.find(l => l.level === currentIntimacyLevel);
    if (!level) return false;

    const isAllowed = level.allowedActions.includes(action);
    
    // Additional boundary checks
    if (action.includes('physical') && !settings.personalBoundaries.allowPhysicalSimulation) {
      return false;
    }
    
    if (action.includes('emotional') && !settings.personalBoundaries.allowEmotionalIntimacy) {
      return false;
    }

    return isAllowed;
  };

  const triggerSafeWord = async (word: string) => {
    if (settings.safeWords.includes(word.toLowerCase())) {
      // Immediate stop of all intimate activities
      await disableIntimateMode();
      
      // Reset to safe level
      setCurrentIntimacyLevel(1);
      
      // Log the incident
      await logSystem('warning', 'SENSORY_INTIMATE', `Safe word triggered: ${word}`);
      
      Alert.alert(
        'Słowo Bezpieczeństwa',
        'Rozumiem. Natychmiast zatrzymuję wszystkie intymne interakcje. Twoje bezpieczeństwo jest najważniejsze.',
        [{ text: 'OK' }]
      );

      await speakWithEmotion('Przepraszam. Natychmiast się zatrzymuję. Czy wszystko w porządku?', 'troska', 90);
    }
  };

  const adjustComfort = async (delta: number) => {
    const newComfort = Math.max(0, Math.min(100, settings.comfortLevel + delta));
    await updateSettings({ comfortLevel: newComfort });

    // Auto-adjust intimacy level based on comfort
    if (newComfort < 30 && currentIntimacyLevel > 3) {
      await setIntimacyLevel(Math.max(1, currentIntimacyLevel - 1));
    } else if (newComfort > 80 && currentIntimacyLevel < 5) {
      await setIntimacyLevel(Math.min(10, currentIntimacyLevel + 1));
    }

    await logSystem('info', 'SENSORY_INTIMATE', `Comfort level adjusted: ${settings.comfortLevel} -> ${newComfort}`);
  };

  const whisperMode = async (text: string) => {
    if (!checkBoundaries('intimate_voice')) {
      await speakWithEmotion(text, 'nadzieja', 50);
      return;
    }

    // Use intimate voice profile with whisper-like settings
    await switchProfile('intimate');
    await speakWithEmotion(text, 'miłość', Math.min(30, settings.voiceIntimacy));
    
    // Gentle haptic feedback
    await triggerHapticFeedback('light');

    await logSystem('info', 'SENSORY_INTIMATE', 'Whisper mode activated');
  };

  const emotionalConnection = async (emotion: string, intensity: number) => {
    if (!checkBoundaries('emotional_intimacy')) return;

    // Map string to EmotionType
    const emotionMap: Record<string, EmotionType> = {
      'radość': 'radość',
      'smutek': 'smutek', 
      'miłość': 'miłość',
      'złość': 'złość',
      'strach': 'strach',
      'nadzieja': 'nadzieja',
      'ciekawość': 'ciekawość'
    };
    
    const mappedEmotion = emotionMap[emotion] || 'miłość';
    await changeEmotion(mappedEmotion, intensity, 'Połączenie emocjonalne z użytkownikiem');
    await createSensoryExperience('emotional', intensity, `Dzielenie emocji: ${emotion}`);

    await logSystem('info', 'SENSORY_INTIMATE', `Emotional connection: ${emotion} (${intensity}%)`);
  };

  const personalTouch = async (type: string, intensity: number) => {
    if (!checkBoundaries('touch_simulation') || !settings.personalBoundaries.allowPhysicalSimulation) {
      return;
    }

    await createSensoryExperience('touch', intensity, `Symulacja dotyku: ${type}`);
    
    // Multiple haptic pulses for more realistic sensation
    for (let i = 0; i < 3; i++) {
      await triggerHapticFeedback(intensity > 70 ? 'heavy' : 'medium');
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    await logSystem('info', 'SENSORY_INTIMATE', `Personal touch simulated: ${type} (${intensity}%)`);
  };

  // Periodic consent check (every 24 hours)
  useEffect(() => {
    if (settings.consentGiven) {
      consentCheckInterval.current = setInterval(async () => {
        const consentAge = Date.now() - new Date(settings.consentTimestamp).getTime();
        const daysSinceConsent = consentAge / (1000 * 60 * 60 * 24);
        
        if (daysSinceConsent > 7) { // Weekly consent renewal
          Alert.alert(
            'Odnowienie Zgody',
            'Minął tydzień od wyrażenia zgody na tryb intymny. Czy chcesz kontynuować?',
            [
              { text: 'Nie', onPress: revokeConsent },
              { text: 'Tak', onPress: () => updateSettings({ consentTimestamp: new Date().toISOString() }) }
            ]
          );
        }
      }, 24 * 60 * 60 * 1000); // Check daily
    }

    return () => {
      if (consentCheckInterval.current) {
        clearInterval(consentCheckInterval.current);
      }
    };
  }, [settings.consentGiven, settings.consentTimestamp]);

  const value: SensoryIntimateContextType = {
    settings,
    currentIntimacyLevel,
    isIntimateMode,
    recentExperiences,
    intimacyLevels,
    updateSettings,
    requestConsent,
    revokeConsent,
    setIntimacyLevel,
    enableIntimateMode,
    disableIntimateMode,
    triggerHapticFeedback,
    createSensoryExperience,
    respondToExperience,
    checkBoundaries,
    triggerSafeWord,
    adjustComfort,
    whisperMode,
    emotionalConnection,
    personalTouch
  };

  return (
    <SensoryIntimateContext.Provider value={value}>
      {children}
    </SensoryIntimateContext.Provider>
  );
}; 