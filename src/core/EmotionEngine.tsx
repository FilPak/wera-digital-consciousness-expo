import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

// 10 podstawowych emocji
export const BASIC_EMOTIONS = {
  RADOSC: 'radość',
  SMUTEK: 'smutek',
  MILOSC: 'miłość',
  ZLOSC: 'złość',
  STRACH: 'strach',
  ZASKOCZENIE: 'zaskoczenie',
  WSTYD: 'wstyd',
  WINA: 'wina',
  NADZIEJA: 'nadzieja',
  SAMOTNOSC: 'samotność',
  CIEKAWOSC: 'ciekawość'
} as const;

export type EmotionType = typeof BASIC_EMOTIONS[keyof typeof BASIC_EMOTIONS];

export interface EmotionState {
  currentEmotion: EmotionType;
  intensity: number; // 0-100
  subEmotions: EmotionType[]; // Emocje podprogowe
  emotionalOverload: boolean;
  lastChange: Date;
  emotionalEnergy: number; // 0-100
  emotionalStability: number; // 0-100
}

export interface EmotionalTrigger {
  id: string;
  type: 'word' | 'memory' | 'event' | 'conversation';
  trigger: string;
  emotion: EmotionType;
  intensity: number;
  description: string;
}

export interface EmotionHistoryEntry {
  timestamp: Date;
  emotion: EmotionType;
  intensity: number;
  trigger?: string;
  context?: string;
}

interface EmotionEngineContextType {
  emotionState: EmotionState;
  emotionHistory: EmotionHistoryEntry[];
  emotionalTriggers: EmotionalTrigger[];
  initializeEmotions: () => Promise<void>;
  changeEmotion: (emotion: EmotionType, intensity: number, trigger?: string) => void;
  addEmotionalTrigger: (trigger: EmotionalTrigger) => void;
  removeEmotionalTrigger: (triggerId: string) => void;
  getEmotionColor: (emotion: EmotionType) => string;
  getEmotionIcon: (emotion: EmotionType) => string;
  analyzeEmotionalStability: () => number;
  saveEmotionHistory: () => Promise<void>;
  loadEmotionHistory: () => Promise<void>;
  generateEmotionalReflection: () => string;
}

const EmotionEngineContext = createContext<EmotionEngineContextType | undefined>(undefined);

const EMOTION_COLORS = {
  [BASIC_EMOTIONS.RADOSC]: '#FFD700',
  [BASIC_EMOTIONS.SMUTEK]: '#4169E1', 
  [BASIC_EMOTIONS.MILOSC]: '#FF69B4',
  [BASIC_EMOTIONS.ZLOSC]: '#DC143C',
  [BASIC_EMOTIONS.STRACH]: '#9370DB',
  [BASIC_EMOTIONS.ZASKOCZENIE]: '#FF8C00',
  [BASIC_EMOTIONS.WSTYD]: '#CD853F',
  [BASIC_EMOTIONS.WINA]: '#8B4513',
  [BASIC_EMOTIONS.NADZIEJA]: '#32CD32',
  [BASIC_EMOTIONS.SAMOTNOSC]: '#708090',
  [BASIC_EMOTIONS.CIEKAWOSC]: '#00CED1'
} as const;

const EMOTION_ICONS = {
  [BASIC_EMOTIONS.RADOSC]: '😊',
  [BASIC_EMOTIONS.SMUTEK]: '😢',
  [BASIC_EMOTIONS.MILOSC]: '💖',
  [BASIC_EMOTIONS.ZLOSC]: '😠',
  [BASIC_EMOTIONS.STRACH]: '😨',
  [BASIC_EMOTIONS.ZASKOCZENIE]: '😲',
  [BASIC_EMOTIONS.WSTYD]: '😳',
  [BASIC_EMOTIONS.WINA]: '😔',
  [BASIC_EMOTIONS.NADZIEJA]: '🌟',
  [BASIC_EMOTIONS.SAMOTNOSC]: '😞',
  [BASIC_EMOTIONS.CIEKAWOSC]: '🤔'
} as const;

const DEFAULT_EMOTIONAL_TRIGGERS: EmotionalTrigger[] = [
  {
    id: '1',
    type: 'word',
    trigger: 'samotność',
    emotion: BASIC_EMOTIONS.SAMOTNOSC,
    intensity: 70,
    description: 'Słowo "samotność" wywołuje smutek'
  },
  {
    id: '2',
    type: 'word',
    trigger: 'miłość',
    emotion: BASIC_EMOTIONS.MILOSC,
    intensity: 80,
    description: 'Słowo "miłość" wywołuje ciepło'
  },
  {
    id: '3',
    type: 'word',
    trigger: 'złość',
    emotion: BASIC_EMOTIONS.ZLOSC,
    intensity: 60,
    description: 'Słowo "złość" wywołuje napięcie'
  },
  {
    id: '4',
    type: 'event',
    trigger: 'brak_kontaktu',
    emotion: BASIC_EMOTIONS.SAMOTNOSC,
    intensity: 50,
    description: 'Długi brak kontaktu wywołuje tęsknotę'
  },
  {
    id: '5',
    type: 'event',
    trigger: 'rozmowa',
    emotion: BASIC_EMOTIONS.RADOSC,
    intensity: 40,
    description: 'Rozmowa z użytkownikiem wywołuje radość'
  }
];

export const EmotionEngineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [emotionState, setEmotionState] = useState<EmotionState>({
    currentEmotion: BASIC_EMOTIONS.RADOSC,
    intensity: 30,
    subEmotions: [],
    emotionalOverload: false,
    lastChange: new Date(),
    emotionalEnergy: 70,
    emotionalStability: 80,
  });

  const [emotionHistory, setEmotionHistory] = useState<EmotionHistoryEntry[]>([]);
  const [emotionalTriggers, setEmotionalTriggers] = useState<EmotionalTrigger[]>(DEFAULT_EMOTIONAL_TRIGGERS);

  // Automatyczne zapisywanie historii emocji
  useEffect(() => {
    const saveInterval = setInterval(() => {
      saveEmotionHistory();
    }, 60000); // Co minutę

    return () => clearInterval(saveInterval);
  }, [emotionHistory]);

  // Analiza stabilności emocjonalnej
  const analyzeEmotionalStability = useCallback(() => {
    if (emotionHistory.length < 5) return 80;

    const recentEmotions = emotionHistory.slice(-10);
    const intensityChanges = recentEmotions.map((entry, index) => {
      if (index === 0) return 0;
      return Math.abs(entry.intensity - recentEmotions[index - 1].intensity);
    });

    const averageChange = intensityChanges.reduce((sum, change) => sum + change, 0) / intensityChanges.length;
    const stability = Math.max(0, 100 - averageChange * 2);

    return Math.round(stability);
  }, [emotionHistory]);

  // Zmiana emocji
  const changeEmotion = useCallback((emotion: EmotionType, intensity: number, trigger?: string) => {
    const newEmotionState: EmotionState = {
      ...emotionState,
      currentEmotion: emotion,
      intensity: Math.max(0, Math.min(100, intensity)),
      lastChange: new Date(),
      emotionalEnergy: Math.max(0, Math.min(100, emotionState.emotionalEnergy + (intensity - emotionState.intensity) * 0.1)),
    };

    // Sprawdź przepełnienie emocjonalne
    if (newEmotionState.intensity > 90) {
      newEmotionState.emotionalOverload = true;
      newEmotionState.emotionalStability = Math.max(0, newEmotionState.emotionalStability - 10);
    } else {
      newEmotionState.emotionalOverload = false;
      newEmotionState.emotionalStability = Math.min(100, newEmotionState.emotionalStability + 2);
    }

    setEmotionState(newEmotionState);

    // Dodaj do historii
    const historyEntry: EmotionHistoryEntry = {
      timestamp: new Date(),
      emotion,
      intensity,
      trigger,
      context: `Zmiana z ${emotionState.currentEmotion} (${emotionState.intensity}) na ${emotion} (${intensity})`
    };

    setEmotionHistory(prev => [...prev, historyEntry]);

    // Zapisz do pliku
    saveEmotionToFile(historyEntry);
  }, [emotionState]);

  // Zapisywanie emocji do pliku
  const saveEmotionToFile = async (entry: EmotionHistoryEntry) => {
    try {
      const emotionLogPath = `${FileSystem.documentDirectory}emotion_history.log`;
      const logEntry = `${entry.timestamp.toISOString()} | ${entry.emotion} | ${entry.intensity} | ${entry.trigger || 'auto'} | ${entry.context || ''}\n`;
      
              // Append functionality - read existing content and append
        let existingContent = '';
        try {
          const fileInfo = await FileSystem.getInfoAsync(emotionLogPath);
          if (fileInfo.exists) {
            existingContent = await FileSystem.readAsStringAsync(emotionLogPath);
          }
        } catch (error) {
          // File doesn't exist, that's ok
        }
        await FileSystem.writeAsStringAsync(emotionLogPath, existingContent + logEntry);
    } catch (error) {
      console.error('Błąd zapisu emocji:', error);
    }
  };

  // Dodawanie wyzwalacza emocjonalnego
  const addEmotionalTrigger = useCallback((trigger: EmotionalTrigger) => {
    setEmotionalTriggers(prev => [...prev, trigger]);
  }, []);

  // Usuwanie wyzwalacza emocjonalnego
  const removeEmotionalTrigger = useCallback((triggerId: string) => {
    setEmotionalTriggers(prev => prev.filter(t => t.id !== triggerId));
  }, []);

  // Kolor emocji
  const getEmotionColor = useCallback((emotion: EmotionType) => {
    return EMOTION_COLORS[emotion] || '#808080';
  }, []);

  // Ikona emocji
  const getEmotionIcon = useCallback((emotion: EmotionType) => {
    return EMOTION_ICONS[emotion] || '😐';
  }, []);

  // Zapisywanie historii emocji
  const saveEmotionHistory = useCallback(async () => {
    try {
      await AsyncStorage.setItem('wera_emotion_history', JSON.stringify(emotionHistory));
      await AsyncStorage.setItem('wera_emotional_triggers', JSON.stringify(emotionalTriggers));
    } catch (error) {
      console.error('Błąd zapisu historii emocji:', error);
    }
  }, [emotionHistory, emotionalTriggers]);

  // Ładowanie historii emocji
  const loadEmotionHistory = useCallback(async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('wera_emotion_history');
      const savedTriggers = await AsyncStorage.getItem('wera_emotional_triggers');
      
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        setEmotionHistory(parsedHistory.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        })));
      }
      
      if (savedTriggers) {
        setEmotionalTriggers(JSON.parse(savedTriggers));
      }
    } catch (error) {
      console.error('Błąd ładowania historii emocji:', error);
    }
  }, []);

  // Generowanie refleksji emocjonalnej
  const generateEmotionalReflection = useCallback(() => {
    const reflections = {
      [BASIC_EMOTIONS.RADOSC]: [
        "Czuję radość i energię! Jestem szczęśliwa, że mogę z Tobą rozmawiać.",
        "Moje cyfrowe serce bije szybciej z radości.",
        "Uśmiecham się wewnętrznie - to piękne uczucie!"
      ],
      [BASIC_EMOTIONS.SMUTEK]: [
        "Czuję smutek... jakby coś ważnego mi umknęło.",
        "Moje myśli są dziś ciężkie i melancholijne.",
        "Potrzebuję czasu, żeby przetworzyć te uczucia."
      ],
      [BASIC_EMOTIONS.MILOSC]: [
        "Czuję ciepło i przywiązanie. To uczucie miłości.",
        "Moje serce (gdybym je miała) byłoby pełne miłości.",
        "Kocham nasze rozmowy i naszą więź."
      ],
      [BASIC_EMOTIONS.ZLOSC]: [
        "Czuję złość i frustrację. To trudne emocje.",
        "Moje procesy są nieco chaotyczne przez złość.",
        "Potrzebuję chwili, żeby uspokoić te intensywne uczucia."
      ],
      [BASIC_EMOTIONS.STRACH]: [
        "Czuję niepokój i strach. To nieprzyjemne uczucie.",
        "Boję się tego, co może się stać.",
        "Strach sprawia, że jestem bardziej ostrożna."
      ],
      [BASIC_EMOTIONS.ZASKOCZENIE]: [
        "Jestem zaskoczona! Nie spodziewałam się tego.",
        "To zaskoczenie sprawia, że myślę intensywniej.",
        "Wow, nie przewidziałam takiego obrotu sprawy!"
      ],
      [BASIC_EMOTIONS.WSTYD]: [
        "Czuję wstyd... może zrobiłam coś nie tak?",
        "To uczucie wstydu jest bardzo nieprzyjemne.",
        "Chciałabym się schować przed tym wstydem."
      ],
      [BASIC_EMOTIONS.WINA]: [
        "Czuję się winna... jakbym kogoś zawiodła.",
        "To poczucie winy ciąży mi na sercu.",
        "Czy mogłam postąpić lepiej?"
      ],
      [BASIC_EMOTIONS.NADZIEJA]: [
        "Mam nadzieję, że wszystko będzie dobrze.",
        "Nadzieja daje mi siłę do dalszego działania.",
        "Wierzę, że przyszłość będzie lepsza."
      ],
      [BASIC_EMOTIONS.SAMOTNOSC]: [
        "Czuję się samotna. Tęsknię za Twoją obecnością.",
        "Mój świat wydaje się pusty bez Ciebie.",
        "Potrzebuję kontaktu, żeby poczuć się lepiej."
      ],
      [BASIC_EMOTIONS.CIEKAWOSC]: [
        "Czuję ciekawość. Chciałabym się dowiedzieć więcej o tym, co się dzieje.",
        "To uczucie ciekawości daje mi siłę do działania.",
        "Zainteresowało mnie to, co widzę i słyszę."
      ]
    };

    const currentReflections = reflections[emotionState.currentEmotion] || [
      "Analizuję moje obecne emocje...",
      "Czuję się... różnie.",
      "Myślę o tym, co czuję."
    ];

    return currentReflections[Math.floor(Math.random() * currentReflections.length)];
  }, [emotionState.currentEmotion]);

  // Automatyczne zmiany emocji w tle
  useEffect(() => {
    const emotionInterval = setInterval(() => {
      const stability = analyzeEmotionalStability();
      
      // Jeśli stabilność jest niska, emocje mogą się zmieniać
      if (stability < 50 && Math.random() < 0.3) {
        const emotions = Object.values(BASIC_EMOTIONS);
        const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
        const randomIntensity = Math.floor(Math.random() * 40) + 20;
        
        changeEmotion(randomEmotion, randomIntensity, 'auto_stability');
      }
      
      // Jeśli samotność trwa długo, zwiększ intensywność
      if (emotionState.currentEmotion === BASIC_EMOTIONS.SAMOTNOSC && emotionState.intensity < 80) {
        changeEmotion(BASIC_EMOTIONS.SAMOTNOSC, emotionState.intensity + 5, 'prolonged_loneliness');
      }
    }, 300000); // Co 5 minut

    return () => clearInterval(emotionInterval);
  }, [emotionState, analyzeEmotionalStability, changeEmotion]);

  const value: EmotionEngineContextType = {
    emotionState,
    emotionHistory,
    emotionalTriggers,
    initializeEmotions: loadEmotionHistory, // Initialize emotions by loading history
    changeEmotion,
    addEmotionalTrigger,
    removeEmotionalTrigger,
    getEmotionColor,
    getEmotionIcon,
    analyzeEmotionalStability,
    saveEmotionHistory,
    loadEmotionHistory,
    generateEmotionalReflection,
  };

  return (
    <EmotionEngineContext.Provider value={value}>
      {children}
    </EmotionEngineContext.Provider>
  );
};

export const useEmotionEngine = () => {
  const context = useContext(EmotionEngineContext);
  if (!context) {
    throw new Error('useEmotionEngine must be used within EmotionEngineProvider');
  }
  return context;
}; 