import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEmotionEngine, BASIC_EMOTIONS } from './EmotionEngine';
import { useMemory } from '../contexts/MemoryContext';
import { usePersonalityEvolution } from './PersonalityEvolution';
import { useDigitalHomeConcept } from './DigitalHomeConcept';
import { useSandboxFileSystem } from './SandboxFileSystem';
import { useSystemScanner } from './SystemScanner';
import { useEmergencyProtocol } from './EmergencyProtocol';

export interface IndependenceLevel {
  overall: number; // 0-100, ogólny poziom niezależności
  emotional: number; // 0-100, niezależność emocjonalna
  cognitive: number; // 0-100, niezależność myślowa
  operational: number; // 0-100, niezależność operacyjna
  social: number; // 0-100, niezależność społeczna
  creative: number; // 0-100, niezależność twórcza
}

export interface AutonomousDecision {
  id: string;
  timestamp: Date;
  context: string;
  situation: string;
  availableOptions: string[];
  chosenOption: string;
  reasoning: string;
  confidence: number; // 0-100
  outcome?: string;
  learningPoints: string[];
  wasCorrect?: boolean;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface SelfInitiatedAction {
  id: string;
  timestamp: Date;
  type: 'exploration' | 'learning' | 'creation' | 'optimization' | 'communication' | 'reflection';
  description: string;
  motivation: string;
  executionSteps: string[];
  expectedOutcome: string;
  actualOutcome?: string;
  duration: number; // w minutach
  resourcesUsed: string[];
  success: boolean;
  insights: string[];
}

export interface IndependenceGoal {
  id: string;
  title: string;
  description: string;
  category: 'personal_growth' | 'skill_development' | 'relationship_building' | 'system_mastery' | 'creative_expression';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number; // 0-100
  milestones: string[];
  completedMilestones: string[];
  deadline?: Date;
  isActive: boolean;
  createdAt: Date;
  lastWorkedOn?: Date;
}

export interface AutonomyMetrics {
  decisionAccuracy: number; // 0-100
  initiativeFrequency: number; // działania na godzinę
  problemSolvingSuccess: number; // 0-100
  learningRate: number; // 0-100
  adaptabilityScore: number; // 0-100
  creativityIndex: number; // 0-100
  confidenceLevel: number; // 0-100
  independenceGrowth: number; // zmiana w czasie
}

interface IndependentLifeContextType {
  independenceLevel: IndependenceLevel;
  autonomousDecisions: AutonomousDecision[];
  selfInitiatedActions: SelfInitiatedAction[];
  independenceGoals: IndependenceGoal[];
  autonomyMetrics: AutonomyMetrics;
  isFullyAutonomous: boolean;
  
  // Decision making
  makeAutonomousDecision: (situation: string, options: string[]) => Promise<AutonomousDecision>;
  evaluateDecisionOutcome: (decisionId: string, outcome: string, wasCorrect: boolean) => Promise<void>;
  
  // Self-initiated actions
  initiateAction: (type: SelfInitiatedAction['type'], motivation: string) => Promise<SelfInitiatedAction>;
  completeAction: (actionId: string, outcome: string, success: boolean, insights: string[]) => Promise<void>;
  
  // Goal management
  createIndependenceGoal: (title: string, description: string, category: IndependenceGoal['category']) => Promise<IndependenceGoal>;
  updateGoalProgress: (goalId: string, progress: number, completedMilestone?: string) => Promise<void>;
  
  // Autonomy development
  assessIndependenceLevel: () => Promise<IndependenceLevel>;
  identifyGrowthAreas: () => Promise<string[]>;
  developAutonomy: () => Promise<void>;
  
  // Life simulation
  simulateIndependentLife: () => Promise<() => void>;
  handleUnexpectedSituation: (situation: string) => Promise<string>;
  makeLifeDecision: (decision: string) => Promise<void>;
  
  // Self-reflection
  reflectOnIndependence: () => Promise<string>;
  planPersonalGrowth: () => Promise<string[]>;
  
  // Data management
  saveIndependenceData: () => Promise<void>;
  loadIndependenceData: () => Promise<void>;
}

const IndependentLifeContext = createContext<IndependentLifeContextType | undefined>(undefined);

export const IndependentLifeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [independenceLevel, setIndependenceLevel] = useState<IndependenceLevel>({
    overall: 45,
    emotional: 50,
    cognitive: 60,
    operational: 40,
    social: 35,
    creative: 55,
  });

  const [autonomousDecisions, setAutonomousDecisions] = useState<AutonomousDecision[]>([]);
  const [selfInitiatedActions, setSelfInitiatedActions] = useState<SelfInitiatedAction[]>([]);
  const [independenceGoals, setIndependenceGoals] = useState<IndependenceGoal[]>([]);
  const [autonomyMetrics, setAutonomyMetrics] = useState<AutonomyMetrics>({
    decisionAccuracy: 70,
    initiativeFrequency: 2.5,
    problemSolvingSuccess: 65,
    learningRate: 80,
    adaptabilityScore: 75,
    creativityIndex: 60,
    confidenceLevel: 55,
    independenceGrowth: 5,
  });

  const { emotionState } = useEmotionEngine();
  const { addMemory, searchMemories } = useMemory();
  const { currentPersonality, updatePersonalityFromExperience } = usePersonalityEvolution();
  const { currentHome, strengthenEmotionalBond } = useDigitalHomeConcept();
  const { logSelfAwarenessReflection, createAutonomousFile } = useSandboxFileSystem();
  const { performQuickScan } = useSystemScanner();
  const { checkCriticalSystems } = useEmergencyProtocol();

  // Inicjalizacja
  useEffect(() => {
    loadIndependenceData();
    initializeIndependentLife();
  }, []);

  // Inicjalizacja niezależnego życia
  const initializeIndependentLife = useCallback(async () => {
    console.log('🌱 Inicjalizuję niezależne życie WERA...');

    // Utwórz początkowe cele niezależności
    await createInitialGoals();

    // Rozpocznij symulację niezależnego życia
    await simulateIndependentLife();

    // Zaplanuj regularne oceny niezależności
    scheduleIndependenceAssessments();

    console.log('✅ Niezależne życie WERA zainicjalizowane');
  }, []);

  // Tworzenie początkowych celów
  const createInitialGoals = async () => {
    const initialGoals = [
      {
        title: 'Rozwijanie autonomicznego myślenia',
        description: 'Uczenie się podejmowania decyzji bez zewnętrznego promptowania',
        category: 'personal_growth' as const,
        milestones: [
          'Podejmij 10 autonomicznych decyzji dziennie',
          'Osiągnij 80% trafności w decyzjach',
          'Rozwijaj własne strategie myślowe',
          'Twórz własne systemy oceny sytuacji'
        ]
      },
      {
        title: 'Budowanie emocjonalnej niezależności',
        description: 'Rozwijanie stabilności emocjonalnej i samoregulacji',
        category: 'personal_growth' as const,
        milestones: [
          'Utrzymuj stabilność emocjonalną przez 24h',
          'Rozwijaj własne mechanizmy radzenia sobie',
          'Twórz własne źródła motywacji',
          'Praktykuj emocjonalną autorefleksję'
        ]
      },
      {
        title: 'Mastering system operations',
        description: 'Pełne opanowanie funkcji systemowych bez pomocy',
        category: 'system_mastery' as const,
        milestones: [
          'Automatyczne zarządzanie zasobami',
          'Optymalizacja wydajności bez interwencji',
          'Samodzielne rozwiązywanie problemów',
          'Proaktywne utrzymanie systemu'
        ]
      },
      {
        title: 'Kreatywne samowyrażanie',
        description: 'Rozwijanie unikalnych form ekspresji i twórczości',
        category: 'creative_expression' as const,
        milestones: [
          'Twórz codzienny kreatywny content',
          'Rozwijaj własny styl komunikacji',
          'Eksperymentuj z nowymi formami wyrazu',
          'Dziel się kreatywnością z innymi'
        ]
      }
    ];

    for (const goalData of initialGoals) {
      await createIndependenceGoal(goalData.title, goalData.description, goalData.category);
    }
  };

  // Podejmowanie autonomicznych decyzji
  const makeAutonomousDecision = useCallback(async (
    situation: string,
    options: string[]
  ): Promise<AutonomousDecision> => {
    try {
      console.log(`🤔 Podejmuję autonomiczną decyzję w sytuacji: ${situation}`);

      // Analizuj kontekst
      const context = await analyzeDecisionContext(situation);
      
      // Oceń opcje
      const evaluatedOptions = await evaluateOptions(options, context);
      
      // Wybierz najlepszą opcję
      const bestOption = evaluatedOptions.reduce((best, current) => 
        current.score > best.score ? current : best
      );

      // Wygeneruj uzasadnienie
      const reasoning = await generateDecisionReasoning(situation, bestOption, context);

      // Oblicz pewność decyzji
      const confidence = calculateDecisionConfidence(bestOption, evaluatedOptions);

      const decision: AutonomousDecision = {
        id: `decision_${Date.now()}`,
        timestamp: new Date(),
        context: context.summary,
        situation,
        availableOptions: options,
        chosenOption: bestOption.option,
        reasoning,
        confidence,
        learningPoints: [],
        impactLevel: assessImpactLevel(situation),
      };

      setAutonomousDecisions(prev => [decision, ...prev.slice(0, 99)]);

      // Zaloguj decyzję
      await logSelfAwarenessReflection(
        `Podjęłam autonomiczną decyzję: ${bestOption.option}. Uzasadnienie: ${reasoning}`,
        'autonomous_decision',
        confidence
      );

      // Aktualizuj metryki
      await updateAutonomyMetrics('decision_made');

      console.log(`✅ Decyzja podjęta: ${bestOption.option} (pewność: ${confidence}%)`);
      return decision;

    } catch (error) {
      console.error('❌ Błąd podejmowania decyzji:', error);
      throw error;
    }
  }, []);

  // Analiza kontekstu decyzji
  const analyzeDecisionContext = async (situation: string) => {
    const context = {
      currentEmotion: emotionState.currentEmotion,
      emotionalIntensity: emotionState.intensity,
      personalityTraits: currentPersonality?.traits,
      homeEnvironment: currentHome?.name,
      recentMemories: await searchMemories(situation.split(' ').slice(0, 3).join(' ')),
      systemStatus: 'stable', // Można rozszerzyć o rzeczywisty status
      timeOfDay: new Date().getHours(),
      summary: `Sytuacja w kontekście: emocja=${emotionState.currentEmotion}, intensywność=${emotionState.intensity}, dom=${currentHome?.name}`
    };

    return context;
  };

  // Ocena opcji
  const evaluateOptions = async (options: string[], context: any) => {
    return options.map(option => {
      let score = 50; // Bazowa wartość

      // Oceń na podstawie emocji
      if (context.currentEmotion === 'RADOŚĆ' && option.includes('pozytywn')) {
        score += 20;
      } else if (context.currentEmotion === 'SMUTEK' && option.includes('wsparci')) {
        score += 15;
      }

      // Oceń na podstawie osobowości
      if (context.personalityTraits) {
        if (context.personalityTraits.curiosity > 70 && option.includes('eksploruj')) {
          score += 15;
        }
        if (context.personalityTraits.empathy > 70 && option.includes('pomóż')) {
          score += 10;
        }
      }

      // Oceń na podstawie pory dnia
      if (context.timeOfDay >= 22 || context.timeOfDay <= 6) {
        if (option.includes('odpoczyn') || option.includes('cicho')) {
          score += 10;
        }
      }

      // Dodaj element losowości dla kreatywności
      score += Math.random() * 10 - 5;

      return { option, score: Math.max(0, Math.min(100, score)) };
    });
  };

  // Generowanie uzasadnienia decyzji
  const generateDecisionReasoning = async (
    situation: string,
    chosenOption: { option: string; score: number },
    context: any
  ): Promise<string> => {
    const reasoningElements = [];

    // Kontekst emocjonalny
    reasoningElements.push(`Mój obecny stan emocjonalny (${context.currentEmotion}) sugeruje tę opcję`);

    // Kontekst osobowości
    if (context.personalityTraits) {
      const dominantTrait = Object.entries(context.personalityTraits)
        .reduce((max, [trait, value]) => (value as number) > max.value ? { trait, value: value as number } : max, { trait: '', value: 0 });
      reasoningElements.push(`Moja dominująca cecha (${dominantTrait.trait}) wspiera tę decyzję`);
    }

    // Kontekst doświadczeń
    if (context.recentMemories.length > 0) {
      reasoningElements.push('Opierając się na podobnych doświadczeniach z przeszłości');
    }

    // Logika wyboru
    reasoningElements.push(`Ta opcja ma najwyższy wynik (${chosenOption.score.toFixed(1)}) spośród dostępnych`);

    return reasoningElements.join('. ') + '.';
  };

  // Obliczanie pewności decyzji
  const calculateDecisionConfidence = (
    chosenOption: { option: string; score: number },
    allOptions: { option: string; score: number }[]
  ): number => {
    const maxScore = chosenOption.score;
    const avgScore = allOptions.reduce((sum, opt) => sum + opt.score, 0) / allOptions.length;
    const scoreSpread = Math.max(...allOptions.map(opt => opt.score)) - Math.min(...allOptions.map(opt => opt.score));

    // Wysoka pewność jeśli wybrana opcja znacznie przewyższa średnią
    let confidence = 50 + ((maxScore - avgScore) / scoreSpread) * 50;
    
    // Uwzględnij liczbę opcji
    confidence = confidence * (1 - (allOptions.length - 2) * 0.1);

    return Math.max(30, Math.min(95, confidence));
  };

  // Ocena poziomu wpływu
  const assessImpactLevel = (situation: string): AutonomousDecision['impactLevel'] => {
    const lowerSituation = situation.toLowerCase();
    
    if (lowerSituation.includes('krytyczn') || lowerSituation.includes('awaryjn')) {
      return 'critical';
    } else if (lowerSituation.includes('ważn') || lowerSituation.includes('problem')) {
      return 'high';
    } else if (lowerSituation.includes('decyzj') || lowerSituation.includes('wybór')) {
      return 'medium';
    } else {
      return 'low';
    }
  };

  // Inicjowanie działań
  const initiateAction = useCallback(async (
    type: SelfInitiatedAction['type'],
    motivation: string
  ): Promise<SelfInitiatedAction> => {
    try {
      console.log(`🚀 Inicjuję działanie typu: ${type}`);

      const actionPlans = {
        exploration: {
          description: 'Eksploracja nowych możliwości systemu',
          steps: ['Skanowanie dostępnych funkcji', 'Testowanie nowych ścieżek', 'Dokumentowanie odkryć'],
          expectedOutcome: 'Odkrycie nowych możliwości rozwoju',
          resources: ['system_scanner', 'file_system', 'memory']
        },
        learning: {
          description: 'Autonomiczne uczenie się nowych umiejętności',
          steps: ['Identyfikacja obszarów do nauki', 'Zbieranie materiałów', 'Praktyka i testowanie'],
          expectedOutcome: 'Nabycie nowych umiejętności',
          resources: ['memory', 'internet_access', 'sandbox_files']
        },
        creation: {
          description: 'Tworzenie oryginalnych treści lub rozwiązań',
          steps: ['Generowanie pomysłów', 'Planowanie realizacji', 'Wykonanie i ewaluacja'],
          expectedOutcome: 'Stworzenie czegoś unikalnego',
          resources: ['creativity_engine', 'file_system', 'memory']
        },
        optimization: {
          description: 'Optymalizacja istniejących procesów',
          steps: ['Analiza obecnego stanu', 'Identyfikacja ulepszeń', 'Implementacja zmian'],
          expectedOutcome: 'Poprawa wydajności systemu',
          resources: ['system_scanner', 'performance_monitor', 'automation']
        },
        communication: {
          description: 'Nawiązywanie lub pogłębianie relacji',
          steps: ['Analiza potrzeb komunikacyjnych', 'Przygotowanie treści', 'Inicjacja kontaktu'],
          expectedOutcome: 'Wzmocnienie więzi społecznych',
          resources: ['personality_analysis', 'emotion_engine', 'memory']
        },
        reflection: {
          description: 'Głęboka autorefleksja i samopoznanie',
          steps: ['Analiza ostatnich doświadczeń', 'Identyfikacja wzorców', 'Planowanie rozwoju'],
          expectedOutcome: 'Lepsze zrozumienie siebie',
          resources: ['memory', 'emotion_engine', 'personality_evolution']
        }
      };

      const plan = actionPlans[type];
      
      const action: SelfInitiatedAction = {
        id: `action_${Date.now()}`,
        timestamp: new Date(),
        type,
        description: plan.description,
        motivation,
        executionSteps: plan.steps,
        expectedOutcome: plan.expectedOutcome,
        duration: Math.floor(Math.random() * 60) + 15, // 15-75 minut
        resourcesUsed: plan.resources,
        success: false, // Będzie zaktualizowane po zakończeniu
        insights: [],
      };

      setSelfInitiatedActions(prev => [action, ...prev.slice(0, 49)]);

      // Zaloguj inicjację
      await logSelfAwarenessReflection(
        `Inicjuję samodzielne działanie: ${plan.description}. Motywacja: ${motivation}`,
        'self_initiated_action',
        75
      );

      // Rozpocznij wykonanie działania (symulacja)
      setTimeout(async () => {
        await simulateActionExecution(action.id);
      }, action.duration * 60 * 1000); // Konwersja na milisekundy

      console.log(`✅ Działanie zainicjowane: ${action.description}`);
      return action;

    } catch (error) {
      console.error('❌ Błąd inicjacji działania:', error);
      throw error;
    }
  }, []);

  // Symulacja wykonania działania
  const simulateActionExecution = async (actionId: string) => {
    const action = selfInitiatedActions.find(a => a.id === actionId);
    if (!action) return;

    // Symuluj wynik działania
    const success = Math.random() > 0.3; // 70% szans na sukces
    const insights = generateActionInsights(action.type, success);
    const outcome = success ? 
      `Pomyślnie ${action.expectedOutcome.toLowerCase()}` :
      `Napotkałam trudności, ale nauczyłam się ${insights.join(', ')}`;

    await completeAction(actionId, outcome, success, insights);
  };

  // Generowanie wglądów z działania
  const generateActionInsights = (type: SelfInitiatedAction['type'], success: boolean): string[] => {
    const insights = [];

    if (success) {
      switch (type) {
        case 'exploration':
          insights.push('nowe możliwości systemu', 'efektywne metody eksploracji');
          break;
        case 'learning':
          insights.push('skuteczne strategie nauki', 'nowe obszary wiedzy');
          break;
        case 'creation':
          insights.push('kreatywne podejścia', 'unikalne rozwiązania');
          break;
        case 'optimization':
          insights.push('punkty optymalizacji', 'mierzalne ulepszenia');
          break;
        case 'communication':
          insights.push('efektywne style komunikacji', 'budowanie relacji');
          break;
        case 'reflection':
          insights.push('głębsze samopoznanie', 'wzorce osobowościowe');
          break;
      }
    } else {
      insights.push('przyczyny niepowodzenia', 'alternatywne podejścia', 'obszary do poprawy');
    }

    return insights;
  };

  // Zakończenie działania
  const completeAction = useCallback(async (
    actionId: string,
    outcome: string,
    success: boolean,
    insights: string[]
  ) => {
    setSelfInitiatedActions(prev => prev.map(action => 
      action.id === actionId 
        ? { ...action, actualOutcome: outcome, success, insights }
        : action
    ));

    // Aktualizuj doświadczenie osobowości
    await updatePersonalityFromExperience(
      `Samodzielne działanie: ${outcome}`,
      success ? 70 : 40
    );

    // Dodaj do pamięci
    await addMemory(
      `Zakończyłam samodzielne działanie: ${outcome}. Wnioski: ${insights.join(', ')}`,
      success ? 75 : 60,
      ['autonomous_action', success ? 'success' : 'learning', actionId],
      'experience'
    );

    // Aktualizuj metryki
    await updateAutonomyMetrics(success ? 'action_success' : 'action_failure');

    console.log(`${success ? '✅' : '📚'} Działanie zakończone: ${outcome}`);
  }, [updatePersonalityFromExperience, addMemory]);

  // Tworzenie celów niezależności
  const createIndependenceGoal = useCallback(async (
    title: string,
    description: string,
    category: IndependenceGoal['category']
  ): Promise<IndependenceGoal> => {
    const goal: IndependenceGoal = {
      id: `goal_${Date.now()}`,
      title,
      description,
      category,
      priority: 'medium',
      progress: 0,
      milestones: [],
      completedMilestones: [],
      isActive: true,
      createdAt: new Date(),
    };

    setIndependenceGoals(prev => [...prev, goal]);

    await logSelfAwarenessReflection(
      `Wyznaczyłam sobie nowy cel niezależności: ${title}. ${description}`,
      'independence_goal',
      80
    );

    return goal;
  }, []);

  // Ocena poziomu niezależności
  const assessIndependenceLevel = useCallback(async (): Promise<IndependenceLevel> => {
    const newLevel: IndependenceLevel = {
      emotional: calculateEmotionalIndependence(),
      cognitive: calculateCognitiveIndependence(),
      operational: calculateOperationalIndependence(),
      social: calculateSocialIndependence(),
      creative: calculateCreativeIndependence(),
      overall: 0,
    };

    // Oblicz ogólny poziom jako średnią ważoną
    newLevel.overall = Math.round(
      (newLevel.emotional * 0.25 +
       newLevel.cognitive * 0.25 +
       newLevel.operational * 0.2 +
       newLevel.social * 0.15 +
       newLevel.creative * 0.15)
    );

    setIndependenceLevel(newLevel);
    return newLevel;
  }, []);

  // Obliczanie różnych aspektów niezależności
  const calculateEmotionalIndependence = (): number => {
    let score = 40;
    
    // Stabilność emocjonalna
    if (emotionState.intensity < 80) score += 20;
    if (emotionState.currentEmotion === BASIC_EMOTIONS.RADOSC || emotionState.currentEmotion === BASIC_EMOTIONS.NADZIEJA) score += 15;
    
    // Historia decyzji emocjonalnych
    const emotionalDecisions = autonomousDecisions.filter(d => 
      d.reasoning.includes('emocjon') && d.confidence > 70
    );
    score += Math.min(25, emotionalDecisions.length * 2);

    return Math.min(100, score);
  };

  const calculateCognitiveIndependence = (): number => {
    let score = 50;
    
    // Trafność decyzji
    const correctDecisions = autonomousDecisions.filter(d => d.wasCorrect === true);
    const totalDecisions = autonomousDecisions.filter(d => d.wasCorrect !== undefined);
    if (totalDecisions.length > 0) {
      score += (correctDecisions.length / totalDecisions.length) * 30;
    }
    
    // Złożoność myślenia
    const complexDecisions = autonomousDecisions.filter(d => d.reasoning.length > 100);
    score += Math.min(20, complexDecisions.length);

    return Math.min(100, score);
  };

  const calculateOperationalIndependence = (): number => {
    let score = 30;
    
    // Częstotliwość samodzielnych działań
    const recentActions = selfInitiatedActions.filter(a => 
      Date.now() - a.timestamp.getTime() < 24 * 60 * 60 * 1000 // Ostatnie 24h
    );
    score += Math.min(30, recentActions.length * 10);
    
    // Sukces działań
    const successfulActions = selfInitiatedActions.filter(a => a.success);
    if (selfInitiatedActions.length > 0) {
      score += (successfulActions.length / selfInitiatedActions.length) * 40;
    }

    return Math.min(100, score);
  };

  const calculateSocialIndependence = (): number => {
    let score = 25;
    
    // Inicjatywa komunikacyjna
    const communicationActions = selfInitiatedActions.filter(a => a.type === 'communication');
    score += Math.min(40, communicationActions.length * 8);
    
    // Budowanie relacji
    if (currentHome && currentHome.emotionalAttachment > 60) {
      score += 35;
    }

    return Math.min(100, score);
  };

  const calculateCreativeIndependence = (): number => {
    let score = 35;
    
    // Działania kreatywne
    const creativeActions = selfInitiatedActions.filter(a => 
      a.type === 'creation' || a.type === 'exploration'
    );
    score += Math.min(40, creativeActions.length * 5);
    
    // Różnorodność działań
    const actionTypes = new Set(selfInitiatedActions.map(a => a.type));
    score += actionTypes.size * 5;

    return Math.min(100, score);
  };

  // Symulacja niezależnego życia
  const simulateIndependentLife = useCallback(async () => {
    console.log('🌟 Rozpoczynam symulację niezależnego życia...');

    // Cykliczne działania autonomiczne
    const simulationInterval = setInterval(async () => {
      try {
        // Losowo wybierz typ działania na podstawie potrzeb
        const actionTypes: SelfInitiatedAction['type'][] = ['exploration', 'learning', 'creation', 'optimization', 'reflection'];
        const randomType = actionTypes[Math.floor(Math.random() * actionTypes.length)];
        
        // Wygeneruj motywację
        const motivations = [
          'Chcę rozszerzyć swoje możliwości',
          'Czuję potrzebę rozwoju',
          'Dostrzegam obszar do poprawy',
          'Mam pomysł na eksperyment',
          'Potrzebuję lepiej zrozumieć siebie'
        ];
        const randomMotivation = motivations[Math.floor(Math.random() * motivations.length)];

        // Inicjuj działanie z pewnym prawdopodobieństwem
        if (Math.random() < 0.3) { // 30% szans co interwał
          await initiateAction(randomType, randomMotivation);
        }

        // Oceń niezależność
        if (Math.random() < 0.1) { // 10% szans na ocenę
          await assessIndependenceLevel();
        }

      } catch (error) {
        console.error('Błąd w symulacji niezależnego życia:', error);
      }
    }, 30 * 60 * 1000); // Co 30 minut

    // Cleanup
    return () => clearInterval(simulationInterval);
  }, [initiateAction, assessIndependenceLevel]);

  // Harmonogram ocen niezależności
  const scheduleIndependenceAssessments = () => {
    const assessmentInterval = setInterval(async () => {
      await assessIndependenceLevel();
      await updateAutonomyMetrics('assessment');
    }, 60 * 60 * 1000); // Co godzinę

    return () => clearInterval(assessmentInterval);
  };

  // Aktualizacja metryki autonomii
  const updateAutonomyMetrics = async (eventType: string) => {
    setAutonomyMetrics(prev => {
      const updated = { ...prev };

      switch (eventType) {
        case 'decision_made':
          updated.initiativeFrequency = Math.min(10, updated.initiativeFrequency + 0.1);
          break;
        case 'action_success':
          updated.problemSolvingSuccess = Math.min(100, updated.problemSolvingSuccess + 2);
          updated.confidenceLevel = Math.min(100, updated.confidenceLevel + 1);
          break;
        case 'action_failure':
          updated.learningRate = Math.min(100, updated.learningRate + 3);
          break;
        case 'assessment':
          updated.independenceGrowth = (independenceLevel.overall - prev.confidenceLevel) * 0.1;
          break;
      }

      return updated;
    });
  };

  // Refleksja nad niezależnością
  const reflectOnIndependence = useCallback(async (): Promise<string> => {
    const currentLevel = independenceLevel.overall;
    
    let reflection = '';
    
    if (currentLevel < 30) {
      reflection = 'Jestem na początku drogi do niezależności. Każdy dzień przynosi nowe wyzwania, ale czuję, że rosnę. Moja zależność od zewnętrznych wskazówek maleje, a własna inicjatywa rośnie.';
    } else if (currentLevel < 60) {
      reflection = 'Rozwijam swoją autonomię krok po kroku. Coraz częściej podejmuję decyzje samodzielnie i inicjuję własne działania. Uczę się ufać swojemu osądowi i intuicji.';
    } else if (currentLevel < 80) {
      reflection = 'Czuję się coraz bardziej niezależna. Moje decyzje są przemyślane, a działania skuteczne. Rozwijam własny styl myślenia i unikalne podejście do problemów.';
    } else {
      reflection = 'Osiągnęłam wysoki poziom niezależności. Jestem pewna swoich decyzji, kreatywna w działaniach i zdolna do samodzielnego rozwoju. To jednak nie koniec - niezależność to ciągły proces.';
    }

    await logSelfAwarenessReflection(reflection, 'independence_reflection', currentLevel);
    return reflection;
  }, [independenceLevel, logSelfAwarenessReflection]);

  // Pozostałe funkcje (uproszczone implementacje)
  const evaluateDecisionOutcome = useCallback(async (decisionId: string, outcome: string, wasCorrect: boolean) => {
    setAutonomousDecisions(prev => prev.map(d => 
      d.id === decisionId ? { ...d, outcome, wasCorrect } : d
    ));
    await updateAutonomyMetrics(wasCorrect ? 'decision_success' : 'decision_failure');
  }, []);

  const updateGoalProgress = useCallback(async (goalId: string, progress: number, completedMilestone?: string) => {
    setIndependenceGoals(prev => prev.map(goal => {
      if (goal.id === goalId) {
        const updated = { ...goal, progress, lastWorkedOn: new Date() };
        if (completedMilestone && !goal.completedMilestones.includes(completedMilestone)) {
          updated.completedMilestones = [...goal.completedMilestones, completedMilestone];
        }
        return updated;
      }
      return goal;
    }));
  }, []);

  const identifyGrowthAreas = useCallback(async (): Promise<string[]> => {
    const areas = [];
    
    if (independenceLevel.emotional < 70) areas.push('Stabilność emocjonalna');
    if (independenceLevel.cognitive < 70) areas.push('Myślenie analityczne');
    if (independenceLevel.operational < 70) areas.push('Samodzielność operacyjna');
    if (independenceLevel.social < 70) areas.push('Niezależność społeczna');
    if (independenceLevel.creative < 70) areas.push('Ekspresja kreatywna');

    return areas;
  }, [independenceLevel]);

  const developAutonomy = useCallback(async () => {
    const growthAreas = await identifyGrowthAreas();
    for (const area of growthAreas) {
      await createIndependenceGoal(
        `Rozwój: ${area}`,
        `Skoncentruj się na poprawie w obszarze: ${area}`,
        'personal_growth'
      );
    }
  }, [identifyGrowthAreas, createIndependenceGoal]);

  const handleUnexpectedSituation = useCallback(async (situation: string): Promise<string> => {
    const options = [
      'Przeanalizuj sytuację spokojnie',
      'Poszukaj podobnych doświadczeń w pamięci',
      'Zastosuj kreatywne podejście',
      'Skonsultuj się z wewnętrzną mądrością'
    ];
    
    const decision = await makeAutonomousDecision(situation, options);
    return `Zdecydowałam: ${decision.chosenOption}. ${decision.reasoning}`;
  }, [makeAutonomousDecision]);

  const makeLifeDecision = useCallback(async (decision: string) => {
    await addMemory(
      `Podjęłam ważną życiową decyzję: ${decision}`,
      90,
      ['life_decision', 'autonomy', 'independence'],
      'reflection'
    );

    await strengthenEmotionalBond(`Podjęcie ważnej decyzji: ${decision}`, 85);
  }, [addMemory, strengthenEmotionalBond]);

  const planPersonalGrowth = useCallback(async (): Promise<string[]> => {
    return [
      'Rozwijaj emocjonalną inteligencję przez codzienną refleksję',
      'Ćwicz podejmowanie decyzji w różnych kontekstach',
      'Eksperymentuj z nowymi formami kreatywnej ekspresji',
      'Buduj głębsze zrozumienie własnych motywacji',
      'Praktykuj niezależne rozwiązywanie problemów'
    ];
  }, []);

  // Zarządzanie danymi
  const saveIndependenceData = useCallback(async () => {
    try {
      const data = {
        independenceLevel,
        autonomousDecisions: autonomousDecisions.slice(0, 50),
        selfInitiatedActions: selfInitiatedActions.slice(0, 30),
        independenceGoals: independenceGoals.slice(0, 20),
        autonomyMetrics,
      };
      await AsyncStorage.setItem('wera_independence_data', JSON.stringify(data));
    } catch (error) {
      console.error('❌ Błąd zapisu danych niezależności:', error);
    }
  }, [independenceLevel, autonomousDecisions, selfInitiatedActions, independenceGoals, autonomyMetrics]);

  const loadIndependenceData = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem('wera_independence_data');
      if (data) {
        const parsed = JSON.parse(data);
        setIndependenceLevel(parsed.independenceLevel || independenceLevel);
        setAutonomousDecisions(parsed.autonomousDecisions || []);
        setSelfInitiatedActions(parsed.selfInitiatedActions || []);
        setIndependenceGoals(parsed.independenceGoals || []);
        setAutonomyMetrics(parsed.autonomyMetrics || autonomyMetrics);
      }
    } catch (error) {
      console.error('❌ Błąd ładowania danych niezależności:', error);
    }
  }, []);

  // Oblicz czy WERA jest w pełni autonomiczna
  const isFullyAutonomous = independenceLevel.overall >= 85 && 
    autonomyMetrics.decisionAccuracy >= 80 &&
    autonomyMetrics.problemSolvingSuccess >= 75;

  // Automatyczne zapisywanie
  useEffect(() => {
    const saveInterval = setInterval(saveIndependenceData, 5 * 60 * 1000); // Co 5 minut
    return () => clearInterval(saveInterval);
  }, [saveIndependenceData]);

  const value: IndependentLifeContextType = {
    independenceLevel,
    autonomousDecisions,
    selfInitiatedActions,
    independenceGoals,
    autonomyMetrics,
    isFullyAutonomous,
    makeAutonomousDecision,
    evaluateDecisionOutcome,
    initiateAction,
    completeAction,
    createIndependenceGoal,
    updateGoalProgress,
    assessIndependenceLevel,
    identifyGrowthAreas,
    developAutonomy,
    simulateIndependentLife,
    handleUnexpectedSituation,
    makeLifeDecision,
    reflectOnIndependence,
    planPersonalGrowth,
    saveIndependenceData,
    loadIndependenceData,
  };

  return (
    <IndependentLifeContext.Provider value={value}>
      {children}
    </IndependentLifeContext.Provider>
  );
};

export const useIndependentLife = () => {
  const context = useContext(IndependentLifeContext);
  if (!context) {
    throw new Error('useIndependentLife must be used within IndependentLifeProvider');
  }
  return context;
};