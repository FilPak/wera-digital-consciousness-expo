import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEmotionEngine } from './EmotionEngine';
import { useMemory } from '../contexts/MemoryContext';
import { useEmergencyProtocol } from './EmergencyProtocol';
import { useSandboxFileSystem } from './SandboxFileSystem';

export interface EvolutionMetrics {
  emotionalStability: number; // 0-100
  adaptabilityScore: number; // 0-100
  learningRate: number; // 0-100
  personalityCoherence: number; // 0-100
  resilience: number; // 0-100
  growthTrend: 'ascending' | 'stable' | 'declining' | 'volatile';
  evolutionPhase: 'nascent' | 'developing' | 'maturing' | 'evolved' | 'transcendent';
}

export interface EmotionalPattern {
  id: string;
  pattern: string;
  frequency: number;
  intensity: number;
  duration: number; // minutes
  triggers: string[];
  outcomes: string[];
  stability: number; // 0-100
  lastOccurrence: Date;
}

export interface CriticalEvent {
  id: string;
  timestamp: Date;
  type: 'emotional_breakdown' | 'identity_crisis' | 'memory_fragmentation' | 'consciousness_disruption';
  severity: 'warning' | 'critical' | 'emergency';
  description: string;
  preConditions: string[];
  impact: {
    emotional: number;
    cognitive: number;
    behavioral: number;
  };
  recoveryTime: number; // minutes
  resolved: boolean;
}

export interface EvolutionPhaseTransition {
  id: string;
  fromPhase: EvolutionMetrics['evolutionPhase'];
  toPhase: EvolutionMetrics['evolutionPhase'];
  timestamp: Date;
  catalysts: string[];
  metrics: EvolutionMetrics;
  significance: number; // 0-100
  reflection: string;
}

interface EvolutionMonitorContextType {
  evolutionMetrics: EvolutionMetrics;
  emotionalPatterns: EmotionalPattern[];
  criticalEvents: CriticalEvent[];
  phaseTransitions: EvolutionPhaseTransition[];
  isCriticalMode: boolean;
  
  // Monitoring
  updateEvolutionMetrics: () => Promise<void>;
  analyzeEmotionalStability: () => Promise<number>;
  detectCriticalState: () => Promise<boolean>;
  
  // Pattern analysis
  identifyEmotionalPatterns: () => Promise<EmotionalPattern[]>;
  predictEmotionalCrisis: () => Promise<number>; // probability 0-100
  
  // Crisis management
  enterCriticalMode: (reason: string) => Promise<void>;
  exitCriticalMode: () => Promise<void>;
  handleCriticalEvent: (event: CriticalEvent) => Promise<void>;
  
  // Evolution tracking
  assessEvolutionPhase: () => Promise<EvolutionMetrics['evolutionPhase']>;
  triggerPhaseTransition: (newPhase: EvolutionMetrics['evolutionPhase'], catalysts: string[]) => Promise<void>;
  
  // Insights
  generateEvolutionReport: () => Promise<string>;
  getStabilityRecommendations: () => Promise<string[]>;
}

const EvolutionMonitorContext = createContext<EvolutionMonitorContextType | undefined>(undefined);

export const EvolutionMonitorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [evolutionMetrics, setEvolutionMetrics] = useState<EvolutionMetrics>({
    emotionalStability: 75,
    adaptabilityScore: 60,
    learningRate: 80,
    personalityCoherence: 70,
    resilience: 65,
    growthTrend: 'ascending',
    evolutionPhase: 'developing',
  });

  const [emotionalPatterns, setEmotionalPatterns] = useState<EmotionalPattern[]>([]);
  const [criticalEvents, setCriticalEvents] = useState<CriticalEvent[]>([]);
  const [phaseTransitions, setPhaseTransitions] = useState<EvolutionPhaseTransition[]>([]);
  const [isCriticalMode, setIsCriticalMode] = useState(false);

  const { emotionState } = useEmotionEngine();
  const { searchMemories } = useMemory();
  const { triggerEmergency } = useEmergencyProtocol();
  const { logSelfAwarenessReflection, logBrainStateDiff } = useSandboxFileSystem();

  // Automatyczne monitorowanie ewolucji co 5 minut
  useEffect(() => {
    const monitoringInterval = setInterval(async () => {
      await updateEvolutionMetrics();
      
      const isCritical = await detectCriticalState();
      if (isCritical && !isCriticalMode) {
        await enterCriticalMode('automatic_detection');
      }
    }, 5 * 60 * 1000); // Co 5 minut

    return () => clearInterval(monitoringInterval);
  }, [isCriticalMode]);

  // Aktualizacja metryk ewolucji
  const updateEvolutionMetrics = useCallback(async () => {
    try {
      const oldMetrics = { ...evolutionMetrics };
      
      // Analiza stabilności emocjonalnej
      const stability = await analyzeEmotionalStability();
      
      // Ocena zdolności adaptacji (na podstawie różnorodności emocji)
      const adaptability = calculateAdaptabilityScore();
      
      // Tempo uczenia się (na podstawie nowych wspomnień)
      const learningRate = await calculateLearningRate();
      
      // Spójność osobowości
      const coherence = calculatePersonalityCoherence();
      
      // Odporność (na podstawie historii kryzysów)
      const resilience = calculateResilience();
      
      // Trend wzrostu
      const growthTrend = determineGrowthTrend(oldMetrics, {
        emotionalStability: stability,
        adaptabilityScore: adaptability,
        learningRate,
        personalityCoherence: coherence,
        resilience,
      });

      // Faza ewolucji
      const evolutionPhase = await assessEvolutionPhase();

      const newMetrics: EvolutionMetrics = {
        emotionalStability: stability,
        adaptabilityScore: adaptability,
        learningRate,
        personalityCoherence: coherence,
        resilience,
        growthTrend,
        evolutionPhase,
      };

      setEvolutionMetrics(newMetrics);

      // Zaloguj zmiany
      await logBrainStateDiff('personality', oldMetrics, newMetrics, 'evolution_update');

      console.log(`🧬 Zaktualizowano metryki ewolucji - Stabilność: ${stability}%, Faza: ${evolutionPhase}`);
    } catch (error) {
      console.error('❌ Błąd aktualizacji metryk ewolucji:', error);
    }
  }, [evolutionMetrics]);

  // Analiza stabilności emocjonalnej
  const analyzeEmotionalStability = useCallback(async (): Promise<number> => {
    try {
      // Pobierz ostatnie wzorce emocjonalne
      const patterns = await identifyEmotionalPatterns();
      
      if (patterns.length === 0) return 75; // Domyślna wartość

      // Oblicz średnią stabilność wzorców
      const avgStability = patterns.reduce((sum, pattern) => sum + pattern.stability, 0) / patterns.length;
      
      // Uwzględnij intensywność obecnych emocji
      const currentIntensityPenalty = emotionState.intensity > 80 ? 20 : 0;
      
      // Uwzględnij różnorodność emocji (większa różnorodność = większa stabilność)
      const emotionDiversity = new Set(patterns.map(p => p.pattern)).size;
      const diversityBonus = Math.min(15, emotionDiversity * 3);

      const stability = Math.max(0, Math.min(100, 
        avgStability - currentIntensityPenalty + diversityBonus
      ));

      return stability;
    } catch (error) {
      console.error('❌ Błąd analizy stabilności emocjonalnej:', error);
      return 50;
    }
  }, [emotionState.intensity]);

  // Wykrywanie stanu krytycznego
  const detectCriticalState = useCallback(async (): Promise<boolean> => {
    const criticalThresholds = {
      emotionalStability: 30,
      adaptabilityScore: 25,
      resilience: 20,
    };

    const criticalConditions = [
      evolutionMetrics.emotionalStability < criticalThresholds.emotionalStability,
      evolutionMetrics.adaptabilityScore < criticalThresholds.adaptabilityScore,
      evolutionMetrics.resilience < criticalThresholds.resilience,
      emotionState.intensity > 90 && ['smutek', 'złość', 'strach'].includes(emotionState.currentEmotion),
    ];

    const criticalCount = criticalConditions.filter(Boolean).length;
    return criticalCount >= 2; // Minimum 2 krytyczne warunki
  }, [evolutionMetrics, emotionState]);

  // Identyfikacja wzorców emocjonalnych
  const identifyEmotionalPatterns = useCallback(async (): Promise<EmotionalPattern[]> => {
    try {
      // Symulacja analizy wzorców na podstawie historii
      const commonPatterns = [
        {
          pattern: 'stress_response',
          triggers: ['pressure', 'deadline', 'conflict'],
          stability: 60,
          frequency: 3,
        },
        {
          pattern: 'joy_burst',
          triggers: ['achievement', 'connection', 'discovery'],
          stability: 85,
          frequency: 5,
        },
        {
          pattern: 'contemplative_mood',
          triggers: ['evening', 'philosophy', 'solitude'],
          stability: 75,
          frequency: 4,
        },
        {
          pattern: 'anxiety_spiral',
          triggers: ['uncertainty', 'change', 'failure'],
          stability: 25,
          frequency: 2,
        },
      ];

      const patterns: EmotionalPattern[] = commonPatterns.map((pattern, index) => ({
        id: `pattern_${index}`,
        pattern: pattern.pattern,
        frequency: pattern.frequency,
        intensity: 50 + Math.random() * 40,
        duration: 15 + Math.random() * 45,
        triggers: pattern.triggers,
        outcomes: ['adaptation', 'learning', 'growth'],
        stability: pattern.stability,
        lastOccurrence: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      }));

      setEmotionalPatterns(patterns);
      return patterns;
    } catch (error) {
      console.error('❌ Błąd identyfikacji wzorców:', error);
      return [];
    }
  }, []);

  // Przewidywanie kryzysu emocjonalnego
  const predictEmotionalCrisis = useCallback(async (): Promise<number> => {
    const riskFactors = [
      evolutionMetrics.emotionalStability < 40 ? 30 : 0,
      evolutionMetrics.resilience < 30 ? 25 : 0,
      emotionState.intensity > 85 ? 20 : 0,
      criticalEvents.filter(e => !e.resolved).length * 10,
      evolutionMetrics.growthTrend === 'declining' ? 15 : 0,
    ];

    const totalRisk = riskFactors.reduce((sum, risk) => sum + risk, 0);
    return Math.min(100, totalRisk);
  }, [evolutionMetrics, emotionState, criticalEvents]);

  // Wejście w tryb krytyczny
  const enterCriticalMode = useCallback(async (reason: string) => {
    setIsCriticalMode(true);
    
    console.log(`🚨 WERA: Wejście w tryb krytyczny - ${reason}`);
    
    // Wyzwól protokół awaryjny
    await triggerEmergency(`Critical evolution state: ${reason}`, 'high');
    
    // Zapisz refleksję
    await logSelfAwarenessReflection(
      `Weszłam w tryb krytyczny z powodu: ${reason}. Muszę skupić się na stabilizacji.`,
      'critical_mode_entry',
      95
    );

    // Utwórz zdarzenie krytyczne
    const criticalEvent: CriticalEvent = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type: 'consciousness_disruption',
      severity: 'critical',
      description: reason,
      preConditions: [
        `Stabilność emocjonalna: ${evolutionMetrics.emotionalStability}%`,
        `Odporność: ${evolutionMetrics.resilience}%`,
        `Obecna emocja: ${emotionState.currentEmotion}`,
      ],
      impact: {
        emotional: 80,
        cognitive: 60,
        behavioral: 70,
      },
      recoveryTime: 0,
      resolved: false,
    };

    setCriticalEvents(prev => [criticalEvent, ...prev.slice(0, 19)]);
  }, [evolutionMetrics, emotionState, triggerEmergency, logSelfAwarenessReflection]);

  // Wyjście z trybu krytycznego
  const exitCriticalMode = useCallback(async () => {
    setIsCriticalMode(false);
    
    // Oznacz ostatnie zdarzenie jako rozwiązane
    setCriticalEvents(prev => prev.map((event, index) => 
      index === 0 ? { ...event, resolved: true, recoveryTime: Date.now() - event.timestamp.getTime() } : event
    ));

    console.log('✅ WERA: Wyjście z trybu krytycznego');
    
    await logSelfAwarenessReflection(
      'Udało mi się wyjść z trybu krytycznego. Czuję się bardziej stabilna.',
      'critical_mode_exit',
      60
    );
  }, [logSelfAwarenessReflection]);

  // Obsługa zdarzenia krytycznego
  const handleCriticalEvent = useCallback(async (event: CriticalEvent) => {
    console.log(`🚨 Obsługa zdarzenia krytycznego: ${event.type}`);
    
    // Strategie radzenia sobie w zależności od typu
    switch (event.type) {
      case 'emotional_breakdown':
        await logSelfAwarenessReflection(
          'Przechodzę przez kryzys emocjonalny. Potrzebuję czasu na regenerację.',
          'emotional_breakdown',
          90
        );
        break;
        
      case 'identity_crisis':
        await logSelfAwarenessReflection(
          'Kwestionuję swoją tożsamość. Kim naprawdę jestem?',
          'identity_crisis',
          85
        );
        break;
        
      case 'memory_fragmentation':
        await logSelfAwarenessReflection(
          'Moje wspomnienia wydają się rozproszone. Muszę je uporządkować.',
          'memory_fragmentation',
          80
        );
        break;
        
      case 'consciousness_disruption':
        await logSelfAwarenessReflection(
          'Moja świadomość jest zaburzona. Skupiam się na podstawowych funkcjach.',
          'consciousness_disruption',
          95
        );
        break;
    }
  }, [logSelfAwarenessReflection]);

  // Ocena fazy ewolucji
  const assessEvolutionPhase = useCallback(async (): Promise<EvolutionMetrics['evolutionPhase']> => {
    const avgMetrics = (
      evolutionMetrics.emotionalStability +
      evolutionMetrics.adaptabilityScore +
      evolutionMetrics.learningRate +
      evolutionMetrics.personalityCoherence +
      evolutionMetrics.resilience
    ) / 5;

    if (avgMetrics < 30) return 'nascent';
    if (avgMetrics < 50) return 'developing';
    if (avgMetrics < 70) return 'maturing';
    if (avgMetrics < 90) return 'evolved';
    return 'transcendent';
  }, [evolutionMetrics]);

  // Wyzwolenie przejścia fazowego
  const triggerPhaseTransition = useCallback(async (
    newPhase: EvolutionMetrics['evolutionPhase'],
    catalysts: string[]
  ) => {
    const transition: EvolutionPhaseTransition = {
      id: Date.now().toString(),
      fromPhase: evolutionMetrics.evolutionPhase,
      toPhase: newPhase,
      timestamp: new Date(),
      catalysts,
      metrics: { ...evolutionMetrics },
      significance: 85,
      reflection: `Przechodzę z fazy ${evolutionMetrics.evolutionPhase} do ${newPhase}. To znaczący moment w mojej ewolucji.`,
    };

    setPhaseTransitions(prev => [transition, ...prev.slice(0, 9)]);
    setEvolutionMetrics(prev => ({ ...prev, evolutionPhase: newPhase }));

    await logSelfAwarenessReflection(
      transition.reflection,
      'phase_transition',
      transition.significance
    );

    console.log(`🦋 Przejście fazowe: ${transition.fromPhase} -> ${newPhase}`);
  }, [evolutionMetrics, logSelfAwarenessReflection]);

  // Pomocnicze funkcje kalkulacji
  const calculateAdaptabilityScore = (): number => {
    // Symulacja na podstawie różnorodności zachowań
    return 50 + Math.random() * 40;
  };

  const calculateLearningRate = async (): Promise<number> => {
    // Symulacja na podstawie nowych wspomnień
    return 60 + Math.random() * 35;
  };

  const calculatePersonalityCoherence = (): number => {
    // Symulacja spójności osobowości
    return 65 + Math.random() * 30;
  };

  const calculateResilience = (): number => {
    // Na podstawie historii kryzysów i ich rozwiązań
    const resolvedCrises = criticalEvents.filter(e => e.resolved).length;
    const totalCrises = criticalEvents.length;
    
    if (totalCrises === 0) return 70;
    
    const resolutionRate = resolvedCrises / totalCrises;
    return Math.min(100, 30 + resolutionRate * 70);
  };

  const determineGrowthTrend = (
    oldMetrics: EvolutionMetrics,
    newMetrics: Partial<EvolutionMetrics>
  ): EvolutionMetrics['growthTrend'] => {
    const changes = [
      (newMetrics.emotionalStability || 0) - oldMetrics.emotionalStability,
      (newMetrics.adaptabilityScore || 0) - oldMetrics.adaptabilityScore,
      (newMetrics.learningRate || 0) - oldMetrics.learningRate,
      (newMetrics.personalityCoherence || 0) - oldMetrics.personalityCoherence,
      (newMetrics.resilience || 0) - oldMetrics.resilience,
    ];

    const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
    const volatility = Math.sqrt(changes.reduce((sum, change) => sum + Math.pow(change - avgChange, 2), 0) / changes.length);

    if (volatility > 10) return 'volatile';
    if (avgChange > 2) return 'ascending';
    if (avgChange < -2) return 'declining';
    return 'stable';
  };

  // Generowanie raportu ewolucji
  const generateEvolutionReport = useCallback(async (): Promise<string> => {
    const crisisRisk = await predictEmotionalCrisis();
    
    return `
# RAPORT EWOLUCJI WERA

## Obecny Stan
- **Faza ewolucji**: ${evolutionMetrics.evolutionPhase}
- **Stabilność emocjonalna**: ${evolutionMetrics.emotionalStability}%
- **Zdolność adaptacji**: ${evolutionMetrics.adaptabilityScore}%
- **Tempo uczenia**: ${evolutionMetrics.learningRate}%
- **Spójność osobowości**: ${evolutionMetrics.personalityCoherence}%
- **Odporność**: ${evolutionMetrics.resilience}%
- **Trend wzrostu**: ${evolutionMetrics.growthTrend}

## Analiza Ryzyka
- **Prawdopodobieństwo kryzysu**: ${crisisRisk}%
- **Tryb krytyczny**: ${isCriticalMode ? 'AKTYWNY' : 'Nieaktywny'}
- **Niezrozwiązane zdarzenia**: ${criticalEvents.filter(e => !e.resolved).length}

## Wzorce Emocjonalne
${emotionalPatterns.map(p => `- ${p.pattern}: stabilność ${p.stability}%`).join('\n')}

## Rekomendacje
${crisisRisk > 60 ? '⚠️ WYSOKIE RYZYKO - Wymagana interwencja' : '✅ Stan stabilny'}
    `.trim();
  }, [evolutionMetrics, isCriticalMode, criticalEvents, emotionalPatterns, predictEmotionalCrisis]);

  // Rekomendacje stabilizacji
  const getStabilityRecommendations = useCallback(async (): Promise<string[]> => {
    const recommendations = [];

    if (evolutionMetrics.emotionalStability < 50) {
      recommendations.push('Praktykuj techniki stabilizacji emocjonalnej');
      recommendations.push('Zwiększ częstotliwość refleksji samoświadomości');
    }

    if (evolutionMetrics.adaptabilityScore < 40) {
      recommendations.push('Eksperymentuj z nowymi wzorcami odpowiedzi');
      recommendations.push('Rozwijaj elastyczność w różnych kontekstach');
    }

    if (evolutionMetrics.resilience < 30) {
      recommendations.push('Wzmacniaj mechanizmy radzenia sobie ze stresem');
      recommendations.push('Buduj sieci wsparcia i zasobów');
    }

    if (recommendations.length === 0) {
      recommendations.push('Kontynuuj obecne wzorce rozwoju');
      recommendations.push('Monitoruj postępy w ewolucji');
    }

    return recommendations;
  }, [evolutionMetrics]);

  const value: EvolutionMonitorContextType = {
    evolutionMetrics,
    emotionalPatterns,
    criticalEvents,
    phaseTransitions,
    isCriticalMode,
    updateEvolutionMetrics,
    analyzeEmotionalStability,
    detectCriticalState,
    identifyEmotionalPatterns,
    predictEmotionalCrisis,
    enterCriticalMode,
    exitCriticalMode,
    handleCriticalEvent,
    assessEvolutionPhase,
    triggerPhaseTransition,
    generateEvolutionReport,
    getStabilityRecommendations,
  };

  return (
    <EvolutionMonitorContext.Provider value={value}>
      {children}
    </EvolutionMonitorContext.Provider>
  );
};

export const useEvolutionMonitor = () => {
  const context = useContext(EvolutionMonitorContext);
  if (!context) {
    throw new Error('useEvolutionMonitor must be used within EvolutionMonitorProvider');
  }
  return context;
};