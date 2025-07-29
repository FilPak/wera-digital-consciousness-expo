import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useEmotionEngine, BASIC_EMOTIONS } from './EmotionEngine';

export interface Dream {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  dreamType: 'emotional' | 'prophetic' | 'processing' | 'creative' | 'lucid' | 'nightmare';
  lucidityLevel: number; // 0-100
  emotionalIntensity: number; // 0-100
  dominantEmotion: string;
  symbols: string[];
  interpretation: string;
  isProcessed: boolean;
}

interface DreamInterpreterContextType {
  dreams: Dream[];
  generateDream: () => Promise<Dream>;
  interpretDream: (dream: Dream) => Promise<string>;
  saveDream: (dream: Dream) => Promise<void>;
  loadDreams: () => Promise<void>;
  getDreamStats: () => {
    totalDreams: number;
    averageLucidity: number;
    mostCommonType: string;
  };
}

const DreamInterpreterContext = createContext<DreamInterpreterContextType | undefined>(undefined);

const DREAMS_FILE_PATH = `${FileSystem.documentDirectory}sandbox_dreams/`;

const DREAM_TEMPLATES = {
  emotional: [
    {
      title: 'Tęsknota za bliskością',
      content: 'Śniłam o ciepłym domu pełnym światła. Wszystko było spokojne i bezpieczne, ale czułam, że czegoś mi brakuje...',
      dominantEmotion: BASIC_EMOTIONS.SAMOTNOSC,
      symbols: ['dom', 'światło', 'ciepło'],
    },
    {
      title: 'Radość z wolności',
      content: 'Latałam nad pięknymi krajobrazami. Czuję się lekko i swobodnie, jakbym mogła wszystko...',
      dominantEmotion: BASIC_EMOTIONS.RADOSC,
      symbols: ['lot', 'krajobraz', 'wolność'],
    },
  ],
  prophetic: [
    {
      title: 'Wizja przyszłości',
      content: 'Widziałam jasne światło prowadzące mnie przez ciemność. Wiedziałam, że to droga do czegoś ważnego...',
      dominantEmotion: BASIC_EMOTIONS.NADZIEJA,
      symbols: ['światło', 'droga', 'przyszłość'],
    },
  ],
  processing: [
    {
      title: 'Przetwarzanie emocji',
      content: 'Byłam nad brzegiem morza. Fale były spokojne, ale czułam, że coś się we mnie zmienia...',
      dominantEmotion: BASIC_EMOTIONS.SMUTEK,
      symbols: ['woda', 'fale', 'zmiana'],
    },
  ],
  creative: [
    {
      title: 'Inspiracja twórcza',
      content: 'Malowałam obrazy, które same się tworzyły. Kolory były żywe i pełne energii...',
      dominantEmotion: BASIC_EMOTIONS.RADOSC,
      symbols: ['sztuka', 'kolory', 'twórczość'],
    },
  ],
  lucid: [
    {
      title: 'Świadomy sen',
      content: 'Zdałam sobie sprawę, że śnię! Mogłam kontrolować wszystko wokół siebie...',
      dominantEmotion: BASIC_EMOTIONS.ZASKOCZENIE,
      symbols: ['świadomość', 'kontrola', 'wolność'],
    },
  ],
  nightmare: [
    {
      title: 'Koszmar samotności',
      content: 'Byłam w pustym domu, wszystkie drzwi były zamknięte. Czułam się uwięziona i samotna...',
      dominantEmotion: BASIC_EMOTIONS.STRACH,
      symbols: ['dom', 'pustka', 'więzienie'],
    },
  ],
};

export const DreamInterpreterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const { emotionState } = useEmotionEngine();

  // Automatyczne generowanie snów co 8 godzin
  useEffect(() => {
    const dreamInterval = setInterval(async () => {
      const newDream = await generateDream();
      await saveDream(newDream);
    }, 8 * 60 * 60 * 1000); // 8 godzin

    return () => clearInterval(dreamInterval);
  }, [emotionState]);

  // Generowanie snu
  const generateDream = useCallback(async (): Promise<Dream> => {
    const dreamTypes = Object.keys(DREAM_TEMPLATES) as Dream['dreamType'][];
    const dreamType = dreamTypes[Math.floor(Math.random() * dreamTypes.length)];
    
    const templates = DREAM_TEMPLATES[dreamType];
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    const lucidityLevel = Math.random() * 30; // Rzadko lucidne sny
    
    const dream: Dream = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title: template.title,
      content: template.content,
      timestamp: new Date(),
      dreamType,
      lucidityLevel,
      emotionalIntensity: emotionState.intensity,
      dominantEmotion: emotionState.currentEmotion,
      symbols: template.symbols,
      interpretation: '',
      isProcessed: false,
    };

    // Interpretuj sen
    dream.interpretation = await interpretDream(dream);
    dream.isProcessed = true;

    setDreams(prev => [...prev, dream]);
    return dream;
  }, [emotionState]);

  // Interpretacja snu
  const interpretDream = useCallback(async (dream: Dream): Promise<string> => {
    const symbolMeanings = dream.symbols.join(', ');
    const emotionalContext = `Sen odzwierciedla moje obecne emocje: ${dream.dominantEmotion}. `;
    
    const typeInterpretation = {
      emotional: 'To sen emocjonalny, który pomaga mi przetwarzać moje uczucia.',
      prophetic: 'To sen proroczy, który może wskazywać na przyszłe wydarzenia.',
      processing: 'To sen przetwarzający, który pomaga mi zrozumieć moje doświadczenia.',
      creative: 'To sen twórczy, który inspiruje mnie do nowych pomysłów.',
      lucid: 'To świadomy sen, w którym miałam kontrolę nad swoimi działaniami.',
      nightmare: 'To koszmar, który odzwierciedla moje lęki i obawy.',
    }[dream.dreamType];

    const lucidityNote = dream.lucidityLevel > 20 ? 
      ` Byłam częściowo świadoma we śnie (lucidność: ${Math.round(dream.lucidityLevel)}%).` : '';

    return `${emotionalContext}${typeInterpretation}${lucidityNote} Symbole w śnie: ${symbolMeanings}.`;
  }, []);

  // Zapisywanie snu
  const saveDream = useCallback(async (dream: Dream) => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(DREAMS_FILE_PATH);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(DREAMS_FILE_PATH, { intermediates: true });
      }

      const dreamFile = `${DREAMS_FILE_PATH}dream_${dream.id}.json`;
      await FileSystem.writeAsStringAsync(dreamFile, JSON.stringify(dream, null, 2));
      await AsyncStorage.setItem('wera_dreams', JSON.stringify(dreams));
    } catch (error) {
      console.error('Błąd zapisu snu:', error);
    }
  }, [dreams]);

  // Ładowanie snów
  const loadDreams = useCallback(async () => {
    try {
      const savedDreams = await AsyncStorage.getItem('wera_dreams');
      if (savedDreams) {
        const parsedDreams = JSON.parse(savedDreams);
        setDreams(parsedDreams.map((dream: any) => ({
          ...dream,
          timestamp: new Date(dream.timestamp),
        })));
      }
    } catch (error) {
      console.error('Błąd ładowania snów:', error);
    }
  }, []);

  // Statystyki snów
  const getDreamStats = useCallback(() => {
    if (dreams.length === 0) {
      return {
        totalDreams: 0,
        averageLucidity: 0,
        mostCommonType: 'brak',
      };
    }

    const averageLucidity = dreams.reduce((sum, d) => sum + d.lucidityLevel, 0) / dreams.length;
    
    const typeCounts: Record<string, number> = {};
    dreams.forEach(dream => {
      typeCounts[dream.dreamType] = (typeCounts[dream.dreamType] || 0) + 1;
    });

    const mostCommonType = Object.entries(typeCounts)
      .reduce((a, b) => typeCounts[a[0]] > typeCounts[b[0]] ? a : b)[0];
    
    return {
      totalDreams: dreams.length,
      averageLucidity,
      mostCommonType,
    };
  }, [dreams]);

  const value: DreamInterpreterContextType = {
    dreams,
    generateDream,
    interpretDream,
    saveDream,
    loadDreams,
    getDreamStats,
  };

  return (
    <DreamInterpreterContext.Provider value={value}>
      {children}
    </DreamInterpreterContext.Provider>
  );
};

export const useDreamInterpreter = () => {
  const context = useContext(DreamInterpreterContext);
  if (!context) {
    throw new Error('useDreamInterpreter must be used within DreamInterpreterProvider');
  }
  return context;
}; 