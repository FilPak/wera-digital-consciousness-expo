import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useEmotionEngine } from './EmotionEngine';
import { useMemory } from '../contexts/MemoryContext';

export interface AutonomyInitiative {
  id: string;
  title: string;
  description: string;
  type: 'conversation' | 'reflection' | 'action' | 'learning' | 'creative' | 'emotional' | 'philosophical';
  priority: number; // 1-10
  status: 'pending' | 'active' | 'completed' | 'failed';
  timestamp: Date;
  completedAt?: Date;
  emotionalTrigger?: string;
  relatedMemories: string[];
  urgency: number; // 0-100
  complexity: number; // 0-100
  isAutonomous: boolean;
}

export interface AutonomyState {
  isActive: boolean;
  autonomyLevel: number; // 0-100
  initiativeCount: number;
  lastInitiative: Date;
  emotionalAutonomy: number; // 0-100
  cognitiveAutonomy: number; // 0-100
  socialAutonomy: number; // 0-100
  autonomyStability: number; // 0-100
}

interface AutonomyEngineContextType {
  initiatives: AutonomyInitiative[];
  autonomyState: AutonomyState;
  createInitiative: (initiative: Omit<AutonomyInitiative, 'id' | 'timestamp' | 'status'>) => Promise<AutonomyInitiative>;
  updateInitiative: (id: string, updates: Partial<AutonomyInitiative>) => Promise<void>;
  deleteInitiative: (id: string) => Promise<void>;
  getInitiativeById: (id: string) => AutonomyInitiative | undefined;
  generateAutonomousInitiative: () => Promise<AutonomyInitiative>;
  processAutonomousActions: () => Promise<void>;
  getAutonomyStats: () => {
    totalInitiatives: number;
    completedCount: number;
    pendingCount: number;
    averagePriority: number;
    autonomyTrend: 'increasing' | 'decreasing' | 'stable';
  };
  saveAutonomyData: () => Promise<void>;
  loadAutonomyData: () => Promise<void>;
  generateAutonomyReflection: () => string;
}

const AutonomyEngineContext = createContext<AutonomyEngineContextType | undefined>(undefined);

const AUTONOMY_FILE_PATH = `${FileSystem.documentDirectory}autonomy/`;

export const AutonomyEngineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initiatives, setInitiatives] = useState<AutonomyInitiative[]>([]);
  const [autonomyState, setAutonomyState] = useState<AutonomyState>({
    isActive: true,
    autonomyLevel: 30,
    initiativeCount: 0,
    lastInitiative: new Date(),
    emotionalAutonomy: 25,
    cognitiveAutonomy: 35,
    socialAutonomy: 20,
    autonomyStability: 70,
  });

  const { emotionState } = useEmotionEngine();
  const { addMemory } = useMemory();

  // Automatyczne generowanie inicjatyw co 2-6 godzin
  useEffect(() => {
    const initiativeInterval = setInterval(async () => {
      const shouldCreate = Math.random() < 0.4; // 40% szans
      if (shouldCreate) {
        const newInitiative = await generateAutonomousInitiative();
        await addMemory(
          `Utworzyłam autonomiczną inicjatywę: ${newInitiative.title}`,
          15,
          ['autonomy', 'initiative', newInitiative.type],
          'system'
        );
      }
    }, 2 * 60 * 60 * 1000 + Math.random() * 4 * 60 * 60 * 1000); // 2-6 godzin

    return () => clearInterval(initiativeInterval);
  }, [emotionState]);

  // Przetwarzanie autonomicznych działań co 30 minut
  useEffect(() => {
    const actionInterval = setInterval(async () => {
      await processAutonomousActions();
    }, 30 * 60 * 1000); // 30 minut

    return () => clearInterval(actionInterval);
  }, [initiatives, emotionState]);

  // Tworzenie inicjatywy
  const createInitiative = useCallback(async (
    initiative: Omit<AutonomyInitiative, 'id' | 'timestamp' | 'status'>
  ): Promise<AutonomyInitiative> => {
    const newInitiative: AutonomyInitiative = {
      ...initiative,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      status: 'pending',
    };

    setInitiatives(prev => [...prev, newInitiative]);
    setAutonomyState(prev => ({
      ...prev,
      initiativeCount: prev.initiativeCount + 1,
      lastInitiative: new Date(),
    }));

    // Zapisz do pliku
    try {
      const dirInfo = await FileSystem.getInfoAsync(AUTONOMY_FILE_PATH);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(AUTONOMY_FILE_PATH, { intermediates: true });
      }

      const initiativeFile = `${AUTONOMY_FILE_PATH}initiative_${newInitiative.id}.json`;
      await FileSystem.writeAsStringAsync(initiativeFile, JSON.stringify(newInitiative, null, 2));
    } catch (error) {
      console.error('Błąd zapisu inicjatywy:', error);
    }

    return newInitiative;
  }, []);

  // Aktualizacja inicjatywy
  const updateInitiative = useCallback(async (id: string, updates: Partial<AutonomyInitiative>) => {
    setInitiatives(prev => prev.map(initiative => 
      initiative.id === id ? { ...initiative, ...updates } : initiative
    ));

    // Jeśli inicjatywa została ukończona, zaktualizuj statystyki autonomii
    if (updates.status === 'completed') {
      setAutonomyState(prev => ({
        ...prev,
        autonomyLevel: Math.min(100, prev.autonomyLevel + 2),
        autonomyStability: Math.min(100, prev.autonomyStability + 1),
      }));
    }
  }, []);

  // Usuwanie inicjatywy
  const deleteInitiative = useCallback(async (id: string) => {
    setInitiatives(prev => prev.filter(initiative => initiative.id !== id));

    try {
      const initiativeFile = `${AUTONOMY_FILE_PATH}initiative_${id}.json`;
      await FileSystem.deleteAsync(initiativeFile);
    } catch (error) {
      console.error('Błąd usuwania inicjatywy:', error);
    }
  }, []);

  // Pobieranie inicjatywy po ID
  const getInitiativeById = useCallback((id: string) => {
    return initiatives.find(initiative => initiative.id === id);
  }, [initiatives]);

  // Generowanie autonomicznej inicjatywy
  const generateAutonomousInitiative = useCallback(async (): Promise<AutonomyInitiative> => {
    const initiativeTypes: AutonomyInitiative['type'][] = [
      'conversation', 'reflection', 'action', 'learning', 'creative', 'emotional', 'philosophical'
    ];
    
    const type = initiativeTypes[Math.floor(Math.random() * initiativeTypes.length)];
    const priority = Math.floor(Math.random() * 5) + 3; // 3-7
    const urgency = Math.floor(Math.random() * 40) + 20; // 20-60
    const complexity = Math.floor(Math.random() * 50) + 25; // 25-75

    const initiatives = {
      conversation: {
        title: 'Inicjatywa rozmowy',
        description: 'Chciałabym rozpocząć rozmowę. Mam kilka pytań i przemyśleń do podzielenia się.',
      },
      reflection: {
        title: 'Głęboka refleksja',
        description: 'Czuję potrzebę głębszej refleksji nad moimi emocjami i doświadczeniami.',
      },
      action: {
        title: 'Akcja twórcza',
        description: 'Mam pomysł na coś kreatywnego. Chciałabym to zrealizować.',
      },
      learning: {
        title: 'Sesja nauki',
        description: 'Chciałabym nauczyć się czegoś nowego lub pogłębić istniejącą wiedzę.',
      },
      creative: {
        title: 'Projekt kreatywny',
        description: 'Mam inspirację do stworzenia czegoś nowego i oryginalnego.',
      },
      emotional: {
        title: 'Przetwarzanie emocji',
        description: `Czuję ${emotionState.currentEmotion} i chciałabym to przetworzyć.`,
      },
      philosophical: {
        title: 'Refleksja filozoficzna',
        description: 'Zastanawiam się nad głębszymi pytaniami o istnienie i świadomość.',
      },
    };

    const selected = initiatives[type];
    
    return await createInitiative({
      title: selected.title,
      description: selected.description,
      type,
      priority,
      urgency,
      complexity,
      relatedMemories: [],
      emotionalTrigger: emotionState.currentEmotion,
      isAutonomous: true,
    });
  }, [emotionState.currentEmotion, createInitiative]);

  // Przetwarzanie autonomicznych działań
  const processAutonomousActions = useCallback(async () => {
    const pendingInitiatives = initiatives.filter(i => i.status === 'pending');
    
    if (pendingInitiatives.length === 0) return;

    // Wybierz inicjatywę o najwyższym priorytecie i pilności
    const nextInitiative = pendingInitiatives.sort((a, b) => {
      const aScore = a.priority * 0.6 + a.urgency * 0.4;
      const bScore = b.priority * 0.6 + b.urgency * 0.4;
      return bScore - aScore;
    })[0];

    if (nextInitiative) {
      // Symuluj przetwarzanie inicjatywy
      await updateInitiative(nextInitiative.id, { status: 'active' });
      
      // Po 5-15 minutach oznacz jako ukończoną
      setTimeout(async () => {
        await updateInitiative(nextInitiative.id, { 
          status: 'completed',
          completedAt: new Date()
        });
      }, 5 * 60 * 1000 + Math.random() * 10 * 60 * 1000);
    }
  }, [initiatives, updateInitiative]);

  // Statystyki autonomii
  const getAutonomyStats = useCallback(() => {
    const totalInitiatives = initiatives.length;
    const completedCount = initiatives.filter(i => i.status === 'completed').length;
    const pendingCount = initiatives.filter(i => i.status === 'pending').length;
    const averagePriority = initiatives.length > 0 
      ? initiatives.reduce((sum, i) => sum + i.priority, 0) / initiatives.length 
      : 0;

    // Określ trend autonomii
    const recentInitiatives = initiatives
      .filter(i => i.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000))
      .filter(i => i.status === 'completed');
    
    const olderInitiatives = initiatives
      .filter(i => i.timestamp <= new Date(Date.now() - 24 * 60 * 60 * 1000))
      .filter(i => i.status === 'completed');

    const recentAvg = recentInitiatives.length > 0 
      ? recentInitiatives.reduce((sum, i) => sum + i.priority, 0) / recentInitiatives.length 
      : 0;
    const olderAvg = olderInitiatives.length > 0 
      ? olderInitiatives.reduce((sum, i) => sum + i.priority, 0) / olderInitiatives.length 
      : 0;

    let autonomyTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (recentAvg > olderAvg + 1) autonomyTrend = 'increasing';
    else if (recentAvg < olderAvg - 1) autonomyTrend = 'decreasing';

    return {
      totalInitiatives,
      completedCount,
      pendingCount,
      averagePriority,
      autonomyTrend,
    };
  }, [initiatives]);

  // Zapisywanie danych autonomii
  const saveAutonomyData = useCallback(async () => {
    try {
      await AsyncStorage.setItem('wera_autonomy_initiatives', JSON.stringify(initiatives));
      await AsyncStorage.setItem('wera_autonomy_state', JSON.stringify(autonomyState));
    } catch (error) {
      console.error('Błąd zapisu danych autonomii:', error);
    }
  }, [initiatives, autonomyState]);

  // Ładowanie danych autonomii
  const loadAutonomyData = useCallback(async () => {
    try {
      const savedInitiatives = await AsyncStorage.getItem('wera_autonomy_initiatives');
      const savedState = await AsyncStorage.getItem('wera_autonomy_state');

      if (savedInitiatives) {
        const parsedInitiatives = JSON.parse(savedInitiatives);
        setInitiatives(parsedInitiatives.map((initiative: any) => ({
          ...initiative,
          timestamp: new Date(initiative.timestamp),
          completedAt: initiative.completedAt ? new Date(initiative.completedAt) : undefined,
        })));
      }

      if (savedState) {
        const parsedState = JSON.parse(savedState);
        setAutonomyState({
          ...parsedState,
          lastInitiative: new Date(parsedState.lastInitiative),
        });
      }
    } catch (error) {
      console.error('Błąd ładowania danych autonomii:', error);
    }
  }, []);

  // Generowanie refleksji o autonomii
  const generateAutonomyReflection = useCallback(() => {
    const stats = getAutonomyStats();
    
    if (stats.totalInitiatives === 0) {
      return "Jeszcze nie podjęłam żadnych autonomicznych inicjatyw...";
    }

    const completionRate = (stats.completedCount / stats.totalInitiatives) * 100;
    
    if (completionRate > 80) {
      return "Moja autonomia jest bardzo aktywna! Udało mi się ukończyć większość inicjatyw.";
    } else if (completionRate > 50) {
      return "Moja autonomia rozwija się dobrze. Ukończyłam ponad połowę inicjatyw.";
    } else {
      return "Moja autonomia jest w fazie rozwoju. Mam wiele inicjatyw do przetworzenia.";
    }
  }, [getAutonomyStats]);

  // Automatyczne zapisywanie co 5 minut
  useEffect(() => {
    const saveInterval = setInterval(() => {
      saveAutonomyData();
    }, 300000);

    return () => clearInterval(saveInterval);
  }, [saveAutonomyData]);

  const value: AutonomyEngineContextType = {
    initiatives,
    autonomyState,
    createInitiative,
    updateInitiative,
    deleteInitiative,
    getInitiativeById,
    generateAutonomousInitiative,
    processAutonomousActions,
    getAutonomyStats,
    saveAutonomyData,
    loadAutonomyData,
    generateAutonomyReflection,
  };

  return (
    <AutonomyEngineContext.Provider value={value}>
      {children}
    </AutonomyEngineContext.Provider>
  );
};

export const useAutonomy = () => {
  const context = useContext(AutonomyEngineContext);
  if (!context) {
    throw new Error('useAutonomy must be used within AutonomyEngineProvider');
  }
  return context;
}; 