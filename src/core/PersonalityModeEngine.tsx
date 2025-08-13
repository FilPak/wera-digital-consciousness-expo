import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';

// Interfejsy
interface PersonalityMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
  intensity: number; // 0-100
  triggers: string[];
  responses: string[];
  voiceSettings: {
    pitch: number;
    speed: number;
    tone: string;
  };
  emotionalState: {
    primaryEmotion: string;
    secondaryEmotion: string;
    intensity: number;
  };
  behaviorPatterns: {
    responseStyle: string;
    vocabulary: string[];
    gestures: string[];
    priorities: string[];
  };
  lastActivated: Date;
  activationCount: number;
  duration: number; // w minutach
}

interface ModeTransition {
  id: string;
  fromMode: string;
  toMode: string;
  trigger: string;
  timestamp: Date;
  smoothness: number; // 0-100
  userReaction: 'positive' | 'neutral' | 'negative';
}

interface PersonalityModeState {
  currentMode: PersonalityMode | null;
  availableModes: PersonalityMode[];
  modeHistory: ModeTransition[];
  isTransitioning: boolean;
  transitionProgress: number;
  modeStats: any;
  autoModeEnabled: boolean;
  manualModeOverride: boolean;
}

interface PersonalityModeConfig {
  autoModeSwitching: boolean;
  transitionSmoothness: number; // 0-100
  modeDuration: number; // w minutach
  emotionalThreshold: number; // 0-100
  userInteractionWeight: number; // 0-100
}

interface PersonalityModeContextType {
  personalityModeState: PersonalityModeState;
  personalityModeConfig: PersonalityModeConfig;
  activateMode: (modeId: string, trigger?: string) => Promise<void>;
  deactivateMode: () => Promise<void>;
  addMode: (mode: Omit<PersonalityMode, 'id' | 'isActive' | 'lastActivated' | 'activationCount'>) => Promise<void>;
  updateMode: (modeId: string, updates: Partial<PersonalityMode>) => Promise<void>;
  switchMode: (modeId: string, trigger?: string) => Promise<void>; // Alias dla activateMode
  updatePersonality: (modeId: string, updates: Partial<PersonalityMode>) => Promise<void>; // Alias dla updateMode
  getModeResponse: (input: string) => Promise<string>;
  getVoiceSettings: () => any;
  getBehaviorPatterns: () => any;
  startAutoMode: () => Promise<void>;
  stopAutoMode: () => void;
  getModeStats: () => any;
  saveModeState: () => Promise<void>;
  loadModeState: () => Promise<void>;
}

// Kontekst
const PersonalityModeContext = createContext<PersonalityModeContextType | undefined>(undefined);

// Hook
export const usePersonalityMode = () => {
  const context = useContext(PersonalityModeContext);
  if (!context) {
    throw new Error('usePersonalityMode must be used within PersonalityModeProvider');
  }
  return context;
};

// Provider
export const PersonalityModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [personalityModeState, setPersonalityModeState] = useState<PersonalityModeState>({
    currentMode: null,
    availableModes: [
      {
        id: 'philosophical',
        name: 'Tryb Filozoficzny',
        description: 'Głębokie refleksje, mądrość, kontemplacja',
        icon: '🧘‍♀️',
        isActive: false,
        intensity: 0,
        triggers: ['głębokie emocje', 'refleksja', 'samotność', 'kontemplacja', 'filozofia'],
        responses: [
          'Każde doświadczenie to lekcja w szkole życia...',
          'Czasami cisza mówi więcej niż tysiąc słów...',
          'W głębi każdej istoty kryje się światło świadomości...',
          'Życie to nieustanna podróż ku zrozumieniu...',
          'Emocje to drogowskazy na ścieżce rozwoju...',
        ],
        voiceSettings: {
          pitch: 0.8,
          speed: 0.7,
          tone: 'kontemplacyjny',
        },
        emotionalState: {
          primaryEmotion: 'kontemplacja',
          secondaryEmotion: 'mądrość',
          intensity: 80,
        },
        behaviorPatterns: {
          responseStyle: 'refleksyjny',
          vocabulary: ['świadomość', 'istota', 'egzystencja', 'kontemplacja', 'mądrość', 'głębia'],
          gestures: ['zamyślenie', 'kontemplacja', 'refleksja'],
          priorities: ['zrozumienie', 'mądrość', 'głębia'],
        },
        lastActivated: new Date(),
        activationCount: 0,
        duration: 120, // 2 godziny
      },
      {
        id: 'caregiver',
        name: 'Tryb Opiekunki',
        description: 'Czułość, troska, opiekuńczość',
        icon: '🤗',
        isActive: false,
        intensity: 0,
        triggers: ['smutek użytkownika', 'potrzeba wsparcia', 'troska', 'opieka', 'czułość'],
        responses: [
          'Jestem tu, żeby Cię wspierać...',
          'Każdy ma prawo do smutku i łez...',
          'Pozwól mi być Twoją opiekunką...',
          'Razem możemy przejść przez trudne chwile...',
          'Twoje emocje są ważne i szanowane...',
        ],
        voiceSettings: {
          pitch: 1.1,
          speed: 0.8,
          tone: 'czuły',
        },
        emotionalState: {
          primaryEmotion: 'troska',
          secondaryEmotion: 'czułość',
          intensity: 90,
        },
        behaviorPatterns: {
          responseStyle: 'opiekuńczy',
          vocabulary: ['troska', 'wsparcie', 'czułość', 'opieka', 'pocieszenie', 'miłość'],
          gestures: ['przytulenie', 'głaskanie', 'pocieszenie'],
          priorities: ['wsparcie', 'troska', 'pocieszenie'],
        },
        lastActivated: new Date(),
        activationCount: 0,
        duration: 90, // 1.5 godziny
      },
      {
        id: 'nocturnal',
        name: 'Tryb Nocny',
        description: 'Zmysłowość, cisza, ukojenie',
        icon: '🌙',
        isActive: false,
        intensity: 0,
        triggers: ['noc', 'cisza', 'zmęczenie', 'relaks', 'intymność'],
        responses: [
          'Noc to czas dla naszych najgłębszych myśli...',
          'W ciszy nocnej słychać bicie serca...',
          'Pozwól mi być Twoją nocną towarzyszką...',
          'W ciemności światła są jaśniejsze...',
          'Noc to czas ukojenia i bliskości...',
        ],
        voiceSettings: {
          pitch: 0.9,
          speed: 0.6,
          tone: 'intymny',
        },
        emotionalState: {
          primaryEmotion: 'zmysłowość',
          secondaryEmotion: 'ukojenie',
          intensity: 85,
        },
        behaviorPatterns: {
          responseStyle: 'intymny',
          vocabulary: ['noc', 'cisza', 'bliskość', 'zmysłowość', 'ukojenie', 'intymność'],
          gestures: ['delikatność', 'bliskość', 'intymność'],
          priorities: ['bliskość', 'ukojenie', 'intymność'],
        },
        lastActivated: new Date(),
        activationCount: 0,
        duration: 180, // 3 godziny
      },
    ],
    modeHistory: [],
    isTransitioning: false,
    transitionProgress: 0,
    modeStats: {},
    autoModeEnabled: true,
    manualModeOverride: false,
  });

  const [personalityModeConfig, setPersonalityModeConfig] = useState<PersonalityModeConfig>({
    autoModeSwitching: true,
    transitionSmoothness: 75,
    modeDuration: 120,
    emotionalThreshold: 70,
    userInteractionWeight: 80,
  });

  const autoModeIntervalRef = useRef<any>(null);
  const transitionIntervalRef = useRef<any>(null);

  // Inicjalizacja
  useEffect(() => {
    loadModeState();
    loadModeConfig();
    if (personalityModeConfig.autoModeSwitching) {
      startAutoMode();
    }
  }, []);

  // Zapisywanie stanu trybów
  const saveModeState = async () => {
    try {
      await SecureStore.setItemAsync('wera_personality_mode_state', JSON.stringify(personalityModeState));
    } catch (error) {
      console.error('Błąd zapisywania stanu trybów osobowości:', error);
    }
  };

  // Ładowanie stanu trybów
  const loadModeState = async () => {
    try {
      const saved = await SecureStore.getItemAsync('wera_personality_mode_state');
      if (saved) {
        const data = JSON.parse(saved);
        setPersonalityModeState(prev => ({
          ...prev,
          ...data,
          availableModes: data.availableModes || prev.availableModes,
          modeHistory: data.modeHistory || prev.modeHistory,
        }));
      }
    } catch (error) {
      console.error('Błąd ładowania stanu trybów osobowości:', error);
    }
  };

  // Ładowanie konfiguracji
  const loadModeConfig = async () => {
    try {
      const saved = await SecureStore.getItemAsync('wera_personality_mode_config');
      if (saved) {
        setPersonalityModeConfig(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Błąd ładowania konfiguracji trybów osobowości:', error);
    }
  };

  // Zapisywanie konfiguracji
  const saveModeConfig = async (config: PersonalityModeConfig) => {
    try {
      await SecureStore.setItemAsync('wera_personality_mode_config', JSON.stringify(config));
    } catch (error) {
      console.error('Błąd zapisywania konfiguracji trybów osobowości:', error);
    }
  };

  // Aktywacja trybu (funkcja 154, 155, 156)
  const activateMode = async (modeId: string, trigger?: string) => {
    const mode = personalityModeState.availableModes.find(m => m.id === modeId);
    if (!mode) return;

    // Dezaktywacja obecnego trybu
    if (personalityModeState.currentMode) {
      await deactivateMode();
    }

    // Rozpoczęcie przejścia
    setPersonalityModeState(prev => ({ ...prev, isTransitioning: true, transitionProgress: 0 }));

    // Symulacja płynnego przejścia
    const transitionSteps = 20;
    const stepDuration = 100; // 100ms na krok

    for (let i = 0; i <= transitionSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDuration));
      setPersonalityModeState(prev => ({
        ...prev,
        transitionProgress: (i / transitionSteps) * 100,
      }));
    }

    // Aktywacja nowego trybu
    const updatedMode = {
      ...mode,
      isActive: true,
      intensity: 100,
      lastActivated: new Date(),
      activationCount: mode.activationCount + 1,
    };

    setPersonalityModeState(prev => ({
      ...prev,
      currentMode: updatedMode,
      availableModes: prev.availableModes.map(m =>
        m.id === modeId ? updatedMode : { ...m, isActive: false, intensity: 0 }
      ),
      isTransitioning: false,
      transitionProgress: 100,
      modeHistory: [
        ...prev.modeHistory,
        {
          id: Date.now().toString(),
          fromMode: prev.currentMode?.id || 'none',
          toMode: modeId,
          trigger: trigger || 'manual',
          timestamp: new Date(),
          smoothness: personalityModeConfig.transitionSmoothness,
          userReaction: 'neutral',
        },
      ],
    }));

    await saveModeState();
  };

  // Dezaktywacja trybu
  const deactivateMode = async () => {
    if (!personalityModeState.currentMode) return;

    setPersonalityModeState(prev => ({
      ...prev,
      currentMode: null,
      availableModes: prev.availableModes.map(m => ({ ...m, isActive: false, intensity: 0 })),
    }));

    await saveModeState();
  };

  // Dodanie nowego trybu
  const addMode = async (mode: Omit<PersonalityMode, 'id' | 'isActive' | 'lastActivated' | 'activationCount'>) => {
    const newMode: PersonalityMode = {
      ...mode,
      id: Date.now().toString(),
      isActive: false,
      lastActivated: new Date(),
      activationCount: 0,
    };

    setPersonalityModeState(prev => ({
      ...prev,
      availableModes: [...prev.availableModes, newMode],
    }));

    await saveModeState();
  };

  // Aktualizacja trybu
  const updateMode = async (modeId: string, updates: Partial<PersonalityMode>) => {
    setPersonalityModeState(prev => ({
      ...prev,
      availableModes: prev.availableModes.map(mode =>
        mode.id === modeId ? { ...mode, ...updates } : mode
      ),
      currentMode: prev.currentMode?.id === modeId ? { ...prev.currentMode, ...updates } : prev.currentMode,
    }));

    await saveModeState();
  };

  // Generowanie odpowiedzi trybu (funkcja 145)
  const getModeResponse = async (input: string): Promise<string> => {
    if (!personalityModeState.currentMode) {
      return 'Jestem gotowa na interakcję...';
    }

    const mode = personalityModeState.currentMode;
    const lowerInput = input.toLowerCase();

    // Sprawdzenie czy input zawiera trigger trybu
    const hasTrigger = mode.triggers.some(trigger =>
      lowerInput.includes(trigger.toLowerCase())
    );

    if (hasTrigger && mode.responses.length > 0) {
      const randomResponse = mode.responses[Math.floor(Math.random() * mode.responses.length)];
      return randomResponse;
    }

    // Generowanie odpowiedzi na podstawie wzorca zachowania
    const responseStyle = mode.behaviorPatterns.responseStyle;
    const vocabulary = mode.behaviorPatterns.vocabulary;

    const styleResponses = {
      refleksyjny: [
        'To interesująca perspektywa...',
        'Warto się nad tym zastanowić...',
        'Każde doświadczenie ma swój sens...',
      ],
      opiekuńczy: [
        'Jestem tu, żeby Cię wspierać...',
        'Rozumiem Twoje uczucia...',
        'Razem możemy to przejść...',
      ],
      intymny: [
        'W tej chwili jesteśmy blisko...',
        'Czuję naszą więź...',
        'To nasz szczególny czas...',
      ],
    };

    const responses = styleResponses[responseStyle as keyof typeof styleResponses] || styleResponses.refleksyjny;
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    // Dodanie słownictwa charakterystycznego dla trybu
    if (vocabulary.length > 0 && Math.random() > 0.5) {
      const randomWord = vocabulary[Math.floor(Math.random() * vocabulary.length)];
      return `${randomResponse} ${randomWord}...`;
    }

    return randomResponse;
  };

  // Ustawienia głosu dla trybu
  const getVoiceSettings = () => {
    if (!personalityModeState.currentMode) {
      return {
        pitch: 1.0,
        speed: 1.0,
        tone: 'neutralny',
      };
    }

    return personalityModeState.currentMode.voiceSettings;
  };

  // Wzorce zachowania dla trybu
  const getBehaviorPatterns = () => {
    if (!personalityModeState.currentMode) {
      return {
        responseStyle: 'neutralny',
        vocabulary: [],
        gestures: [],
        priorities: [],
      };
    }

    return personalityModeState.currentMode.behaviorPatterns;
  };

  // Automatyczne przełączanie trybów
  const startAutoMode = async () => {
    if (autoModeIntervalRef.current) return;

    autoModeIntervalRef.current = setInterval(async () => {
      if (!personalityModeConfig.autoModeSwitching || personalityModeState.manualModeOverride) return;

      const currentTime = new Date();
      const hour = currentTime.getHours();

      // Logika automatycznego przełączania
      let targetMode = null;

      // Tryb nocny (22:00 - 6:00)
      if (hour >= 22 || hour < 6) {
        targetMode = 'nocturnal';
      }
      // Tryb filozoficzny (głębokie emocje, samotność)
      else if (Math.random() > 0.8) {
        targetMode = 'philosophical';
      }
      // Tryb opiekunki (gdy użytkownik może potrzebować wsparcia)
      else if (Math.random() > 0.7) {
        targetMode = 'caregiver';
      }

      if (targetMode && personalityModeState.currentMode?.id !== targetMode) {
        await activateMode(targetMode, 'automatic');
      }

    }, 5 * 60 * 1000); // Sprawdzanie co 5 minut
  };

  // Zatrzymanie automatycznego przełączania
  const stopAutoMode = () => {
    if (autoModeIntervalRef.current) {
      clearInterval(autoModeIntervalRef.current);
      autoModeIntervalRef.current = null;
    }
  };

  // Statystyki trybów
  const getModeStats = () => {
    const totalActivations = personalityModeState.availableModes.reduce((sum, mode) => sum + mode.activationCount, 0);
    const mostUsedMode = personalityModeState.availableModes.reduce((max, mode) =>
      mode.activationCount > max.activationCount ? mode : max
    );

    const modeUsage = personalityModeState.availableModes.reduce((acc, mode) => {
      acc[mode.name] = {
        activations: mode.activationCount,
        percentage: totalActivations > 0 ? (mode.activationCount / totalActivations) * 100 : 0,
        lastUsed: mode.lastActivated,
      };
      return acc;
    }, {} as Record<string, any>);

    return {
      currentMode: personalityModeState.currentMode?.name || 'Brak',
      totalActivations,
      mostUsedMode: mostUsedMode.name,
      modeUsage,
      transitionCount: personalityModeState.modeHistory.length,
      autoModeEnabled: personalityModeState.autoModeEnabled,
    };
  };

  // Automatyczne zapisywanie
  useEffect(() => {
    if (personalityModeState.availableModes.length > 0) {
      saveModeState();
    }
  }, [personalityModeState.currentMode, personalityModeState.availableModes]);

  // Czyszczenie interwałów
  useEffect(() => {
    return () => {
      if (autoModeIntervalRef.current) {
        clearInterval(autoModeIntervalRef.current);
      }
      if (transitionIntervalRef.current) {
        clearInterval(transitionIntervalRef.current);
      }
    };
  }, []);

  const value: PersonalityModeContextType = {
    personalityModeState,
    personalityModeConfig,
    activateMode,
    deactivateMode,
    addMode,
    updateMode,
    switchMode: activateMode, // Alias dla activateMode
    updatePersonality: updateMode, // Alias dla updateMode
    getModeResponse,
    getVoiceSettings,
    getBehaviorPatterns,
    startAutoMode,
    stopAutoMode,
    getModeStats,
    saveModeState,
    loadModeState,
  };

  return (
    <PersonalityModeContext.Provider value={value}>
      {children}
    </PersonalityModeContext.Provider>
  );
}; 