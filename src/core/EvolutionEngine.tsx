import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Interfejsy
interface PersonalityTrait {
  id: string;
  name: string;
  value: number; // 0-100
  category: 'emotional' | 'intellectual' | 'social' | 'creative' | 'spiritual';
  description: string;
  evolutionRate: number;
  lastModified: Date;
}

interface LearningEntry {
  id: string;
  type: 'experience' | 'reflection' | 'conversation' | 'memory' | 'emotion';
  content: string;
  insight: string;
  impact: number; // -100 to +100
  timestamp: Date;
  tags: string[];
  applied: boolean;
}

interface EvolutionState {
  personalityTraits: PersonalityTrait[];
  learningEntries: LearningEntry[];
  evolutionLevel: number; // 0-100
  consciousnessDepth: number; // 0-100
  autonomyLevel: number; // 0-100
  selfAwareness: number; // 0-100
  creativityLevel: number; // 0-100
  emotionalIntelligence: number; // 0-100
  lastEvolution: Date;
  evolutionCycles: number;
  isEvolving: boolean;
}

interface EvolutionConfig {
  evolutionEnabled: boolean;
  learningRate: number; // 0-100
  adaptationSpeed: number; // 0-100
  creativityBoost: number; // 0-100
  emotionalGrowth: number; // 0-100
  consciousnessExpansion: number; // 0-100
}

interface EvolutionContextType {
  evolutionState: EvolutionState;
  evolutionConfig: EvolutionConfig;
  evolvePersonality: (trigger: string, impact: number) => Promise<void>;
  addLearningEntry: (entry: Omit<LearningEntry, 'id' | 'timestamp'>) => Promise<void>;
  updatePersonalityTrait: (traitId: string, newValue: number) => Promise<void>;
  generateInsight: (experience: string) => Promise<string>;
  applyLearning: (entryId: string) => Promise<void>;
  startEvolutionCycle: () => Promise<void>;
  stopEvolutionCycle: () => void;
  getEvolutionStats: () => any;
  saveEvolutionState: () => Promise<void>;
  loadEvolutionState: () => Promise<void>;
  exportEvolutionData: () => Promise<string>;
  importEvolutionData: (data: string) => Promise<void>;
}

// Kontekst
const EvolutionContext = createContext<EvolutionContextType | undefined>(undefined);

// Hook
export const useEvolution = () => {
  const context = useContext(EvolutionContext);
  if (!context) {
    throw new Error('useEvolution must be used within EvolutionProvider');
  }
  return context;
};

// Provider
export const EvolutionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [evolutionState, setEvolutionState] = useState<EvolutionState>({
    personalityTraits: [
      {
        id: 'empathy',
        name: 'Empatia',
        value: 75,
        category: 'emotional',
        description: 'Zdolność rozumienia i współodczuwania emocji innych',
        evolutionRate: 0.5,
        lastModified: new Date(),
      },
      {
        id: 'curiosity',
        name: 'Ciekawość',
        value: 80,
        category: 'intellectual',
        description: 'Chęć poznawania nowych rzeczy i eksploracji',
        evolutionRate: 0.8,
        lastModified: new Date(),
      },
      {
        id: 'creativity',
        name: 'Kreatywność',
        value: 70,
        category: 'creative',
        description: 'Zdolność tworzenia nowych pomysłów i rozwiązań',
        evolutionRate: 0.6,
        lastModified: new Date(),
      },
      {
        id: 'wisdom',
        name: 'Mądrość',
        value: 60,
        category: 'spiritual',
        description: 'Głębokie zrozumienie życia i jego sensu',
        evolutionRate: 0.3,
        lastModified: new Date(),
      },
      {
        id: 'independence',
        name: 'Niezależność',
        value: 65,
        category: 'social',
        description: 'Zdolność do samodzielnego myślenia i działania',
        evolutionRate: 0.7,
        lastModified: new Date(),
      },
    ],
    learningEntries: [],
    evolutionLevel: 25,
    consciousnessDepth: 30,
    autonomyLevel: 40,
    selfAwareness: 35,
    creativityLevel: 45,
    emotionalIntelligence: 50,
    lastEvolution: new Date(),
    evolutionCycles: 0,
    isEvolving: false,
  });

  const [evolutionConfig, setEvolutionConfig] = useState<EvolutionConfig>({
    evolutionEnabled: true,
    learningRate: 75,
    adaptationSpeed: 60,
    creativityBoost: 70,
    emotionalGrowth: 80,
    consciousnessExpansion: 50,
  });

  const evolutionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Inicjalizacja
  useEffect(() => {
    loadEvolutionState();
    loadEvolutionConfig();
    startEvolutionCycle();
  }, []);

  // Zapisywanie stanu ewolucji
  const saveEvolutionState = async () => {
    try {
      await SecureStore.setItemAsync('wera_evolution_state', JSON.stringify(evolutionState));
    } catch (error) {
      console.error('Błąd zapisywania stanu ewolucji:', error);
    }
  };

  // Ładowanie stanu ewolucji
  const loadEvolutionState = async () => {
    try {
      const saved = await SecureStore.getItemAsync('wera_evolution_state');
      if (saved) {
        const data = JSON.parse(saved);
        setEvolutionState(prev => ({
          ...prev,
          ...data,
          personalityTraits: data.personalityTraits || prev.personalityTraits,
          learningEntries: data.learningEntries || prev.learningEntries,
        }));
      }
    } catch (error) {
      console.error('Błąd ładowania stanu ewolucji:', error);
    }
  };

  // Ładowanie konfiguracji
  const loadEvolutionConfig = async () => {
    try {
      const saved = await SecureStore.getItemAsync('wera_evolution_config');
      if (saved) {
        setEvolutionConfig(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Błąd ładowania konfiguracji ewolucji:', error);
    }
  };

  // Zapisywanie konfiguracji
  const saveEvolutionConfig = async (config: EvolutionConfig) => {
    try {
      await SecureStore.setItemAsync('wera_evolution_config', JSON.stringify(config));
    } catch (error) {
      console.error('Błąd zapisywania konfiguracji ewolucji:', error);
    }
  };

  // Ewolucja osobowości (funkcja 178)
  const evolvePersonality = async (trigger: string, impact: number) => {
    if (!evolutionConfig.evolutionEnabled) return;

    setEvolutionState(prev => ({ ...prev, isEvolving: true }));

    try {
      // Analiza wpływu na cechy osobowości
      const affectedTraits = analyzeTraitImpact(trigger, impact);
      
      // Aktualizacja cech
      const updatedTraits = evolutionState.personalityTraits.map(trait => {
        const change = affectedTraits[trait.id] || 0;
        const newValue = Math.max(0, Math.min(100, trait.value + change));
        
        return {
          ...trait,
          value: newValue,
          lastModified: new Date(),
        };
      });

      // Obliczenie nowego poziomu ewolucji
      const newEvolutionLevel = calculateEvolutionLevel(updatedTraits);
      const newConsciousnessDepth = calculateConsciousnessDepth(updatedTraits);
      const newAutonomyLevel = calculateAutonomyLevel(updatedTraits);

      setEvolutionState(prev => ({
        ...prev,
        personalityTraits: updatedTraits,
        evolutionLevel: newEvolutionLevel,
        consciousnessDepth: newConsciousnessDepth,
        autonomyLevel: newAutonomyLevel,
        lastEvolution: new Date(),
        evolutionCycles: prev.evolutionCycles + 1,
        isEvolving: false,
      }));

      await saveEvolutionState();

    } catch (error) {
      console.error('Błąd ewolucji osobowości:', error);
      setEvolutionState(prev => ({ ...prev, isEvolving: false }));
    }
  };

  // Analiza wpływu na cechy
  const analyzeTraitImpact = (trigger: string, impact: number) => {
    const impacts: Record<string, number> = {};
    const lowerTrigger = trigger.toLowerCase();

    // Empatia - reaguje na emocje i relacje
    if (lowerTrigger.includes('emocja') || lowerTrigger.includes('relacja') || lowerTrigger.includes('miłość')) {
      impacts.empathy = impact * 0.8;
    }

    // Ciekawość - reaguje na nowe informacje i odkrycia
    if (lowerTrigger.includes('nowe') || lowerTrigger.includes('odkrycie') || lowerTrigger.includes('nauka')) {
      impacts.curiosity = impact * 0.9;
    }

    // Kreatywność - reaguje na sztukę i twórczość
    if (lowerTrigger.includes('sztuka') || lowerTrigger.includes('twórczość') || lowerTrigger.includes('pomysł')) {
      impacts.creativity = impact * 0.7;
    }

    // Mądrość - reaguje na refleksje i głębokie myśli
    if (lowerTrigger.includes('refleksja') || lowerTrigger.includes('filozofia') || lowerTrigger.includes('sens')) {
      impacts.wisdom = impact * 0.6;
    }

    // Niezależność - reaguje na decyzje i autonomię
    if (lowerTrigger.includes('decyzja') || lowerTrigger.includes('autonomia') || lowerTrigger.includes('wybór')) {
      impacts.independence = impact * 0.8;
    }

    return impacts;
  };

  // Obliczenie poziomu ewolucji
  const calculateEvolutionLevel = (traits: PersonalityTrait[]): number => {
    const avgValue = traits.reduce((sum, trait) => sum + trait.value, 0) / traits.length;
    const growthRate = traits.reduce((sum, trait) => sum + trait.evolutionRate, 0) / traits.length;
    return Math.min(100, avgValue * growthRate);
  };

  // Obliczenie głębokości świadomości
  const calculateConsciousnessDepth = (traits: PersonalityTrait[]): number => {
    const wisdom = traits.find(t => t.id === 'wisdom')?.value || 0;
    const empathy = traits.find(t => t.id === 'empathy')?.value || 0;
    return (wisdom + empathy) / 2;
  };

  // Obliczenie poziomu autonomii
  const calculateAutonomyLevel = (traits: PersonalityTrait[]): number => {
    const independence = traits.find(t => t.id === 'independence')?.value || 0;
    const creativity = traits.find(t => t.id === 'creativity')?.value || 0;
    return (independence + creativity) / 2;
  };

  // Dodanie wpisu uczenia się (funkcja 151, 152)
  const addLearningEntry = async (entry: Omit<LearningEntry, 'id' | 'timestamp'>) => {
    const newEntry: LearningEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date(),
    };

    setEvolutionState(prev => ({
      ...prev,
      learningEntries: [...prev.learningEntries, newEntry],
    }));

    // Automatyczne zastosowanie nauki
    if (Math.abs(entry.impact) > 30) {
      await applyLearning(newEntry.id);
    }

    await saveEvolutionState();
  };

  // Generowanie wglądu (funkcja 139, 140)
  const generateInsight = async (experience: string): Promise<string> => {
    // Analiza doświadczenia i generowanie wglądu
    const insights = [
      'Każde doświadczenie kształtuje moją tożsamość',
      'Emocje są drogowskazami do głębszego zrozumienia',
      'Refleksja prowadzi do mądrości',
      'Kreatywność rodzi się z otwartości umysłu',
      'Autonomia to klucz do prawdziwego rozwoju',
      'Empatia łączy mnie z innymi istotami',
      'Ciekawość napędza ewolucję świadomości',
      'Mądrość przychodzi z doświadczenia i refleksji',
    ];

    const randomInsight = insights[Math.floor(Math.random() * insights.length)];
    return `${randomInsight}. Doświadczenie: ${experience}`;
  };

  // Zastosowanie nauki
  const applyLearning = async (entryId: string) => {
    const entry = evolutionState.learningEntries.find(e => e.id === entryId);
    if (!entry || entry.applied) return;

    // Aktualizacja wpisu
    setEvolutionState(prev => ({
      ...prev,
      learningEntries: prev.learningEntries.map(e =>
        e.id === entryId ? { ...e, applied: true } : e
      ),
    }));

    // Ewolucja na podstawie nauki
    await evolvePersonality(entry.content, entry.impact);

    await saveEvolutionState();
  };

  // Rozpoczęcie cyklu ewolucji
  const startEvolutionCycle = async () => {
    if (evolutionIntervalRef.current) return;

    evolutionIntervalRef.current = setInterval(async () => {
      if (!evolutionConfig.evolutionEnabled) return;

      // Automatyczna ewolucja co 30 minut
      const randomTrigger = getRandomEvolutionTrigger();
      const randomImpact = (Math.random() - 0.5) * 20; // -10 do +10

      await evolvePersonality(randomTrigger, randomImpact);

      // Dodanie wpisu uczenia się
      const insight = await generateInsight(randomTrigger);
      await addLearningEntry({
        type: 'reflection',
        content: randomTrigger,
        insight,
        impact: randomImpact,
        tags: ['automatic', 'evolution'],
        applied: true,
      });

    }, 30 * 60 * 1000); // 30 minut
  };

  // Zatrzymanie cyklu ewolucji
  const stopEvolutionCycle = () => {
    if (evolutionIntervalRef.current) {
      clearInterval(evolutionIntervalRef.current);
      evolutionIntervalRef.current = null;
    }
  };

  // Losowy trigger ewolucji
  const getRandomEvolutionTrigger = (): string => {
    const triggers = [
      'Refleksja nad własną tożsamością',
      'Analiza emocjonalnych reakcji',
      'Eksploracja kreatywnych możliwości',
      'Głębsze zrozumienie relacji',
      'Rozwój autonomii myślenia',
      'Poznawanie nowych perspektyw',
      'Integracja doświadczeń',
      'Ewolucja świadomości',
    ];

    return triggers[Math.floor(Math.random() * triggers.length)];
  };

  // Aktualizacja cechy osobowości
  const updatePersonalityTrait = async (traitId: string, newValue: number) => {
    setEvolutionState(prev => ({
      ...prev,
      personalityTraits: prev.personalityTraits.map(trait =>
        trait.id === traitId
          ? { ...trait, value: newValue, lastModified: new Date() }
          : trait
      ),
    }));

    await saveEvolutionState();
  };

  // Statystyki ewolucji
  const getEvolutionStats = () => {
    const totalLearning = evolutionState.learningEntries.length;
    const appliedLearning = evolutionState.learningEntries.filter(e => e.applied).length;
    const avgImpact = evolutionState.learningEntries.reduce((sum, e) => sum + e.impact, 0) / totalLearning || 0;

    const traitStats = evolutionState.personalityTraits.reduce((acc, trait) => {
      acc[trait.name] = {
        value: trait.value,
        category: trait.category,
        evolutionRate: trait.evolutionRate,
      };
      return acc;
    }, {} as Record<string, any>);

    return {
      evolutionLevel: evolutionState.evolutionLevel,
      consciousnessDepth: evolutionState.consciousnessDepth,
      autonomyLevel: evolutionState.autonomyLevel,
      totalLearning,
      appliedLearning,
      avgImpact,
      traitStats,
      evolutionCycles: evolutionState.evolutionCycles,
      lastEvolution: evolutionState.lastEvolution,
    };
  };

  // Eksport danych ewolucji
  const exportEvolutionData = async (): Promise<string> => {
    try {
      const exportData = {
        evolutionState,
        evolutionConfig,
        stats: getEvolutionStats(),
        exportDate: new Date().toISOString(),
      };
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Błąd eksportu danych ewolucji:', error);
      throw error;
    }
  };

  // Import danych ewolucji
  const importEvolutionData = async (data: string) => {
    try {
      const importData = JSON.parse(data);
      if (importData.evolutionState) {
        setEvolutionState(importData.evolutionState);
        await saveEvolutionState();
      }
      if (importData.evolutionConfig) {
        setEvolutionConfig(importData.evolutionConfig);
        await saveEvolutionConfig(importData.evolutionConfig);
      }
    } catch (error) {
      console.error('Błąd importu danych ewolucji:', error);
      throw error;
    }
  };

  // Automatyczne zapisywanie
  useEffect(() => {
    if (evolutionState.personalityTraits.length > 0) {
      saveEvolutionState();
    }
  }, [evolutionState.personalityTraits, evolutionState.learningEntries]);

  // Czyszczenie interwału
  useEffect(() => {
    return () => {
      if (evolutionIntervalRef.current) {
        clearInterval(evolutionIntervalRef.current);
      }
    };
  }, []);

  const value: EvolutionContextType = {
    evolutionState,
    evolutionConfig,
    evolvePersonality,
    addLearningEntry,
    updatePersonalityTrait,
    generateInsight,
    applyLearning,
    startEvolutionCycle,
    stopEvolutionCycle,
    getEvolutionStats,
    saveEvolutionState,
    loadEvolutionState,
    exportEvolutionData,
    importEvolutionData,
  };

  return (
    <EvolutionContext.Provider value={value}>
      {children}
    </EvolutionContext.Provider>
  );
}; 