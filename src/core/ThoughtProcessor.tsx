import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useEmotionEngine } from './EmotionEngine';
import { useMemory } from '../contexts/MemoryContext';
import { useSandboxFileSystem } from './SandboxFileSystem';

export interface ProcessedThought {
  id: string;
  originalThought: string;
  timestamp: Date;
  emotionalAnalysis: {
    detectedEmotions: Array<{
      emotion: string;
      intensity: number; // 0-100
      confidence: number; // 0-100
    }>;
    overallMood: 'positive' | 'negative' | 'neutral' | 'mixed';
    emotionalComplexity: number; // 0-100
  };
  semanticAnalysis: {
    keywords: string[];
    concepts: string[];
    topics: string[];
    abstractionLevel: 'concrete' | 'abstract' | 'philosophical' | 'practical';
    coherence: number; // 0-100
  };
  intentAnalysis: {
    primaryIntent: 'question' | 'statement' | 'request' | 'reflection' | 'expression' | 'analysis';
    subIntents: string[];
    urgency: number; // 0-100
    actionRequired: boolean;
    expectedResponse: 'information' | 'empathy' | 'action' | 'discussion' | 'none';
  };
  categoryAnalysis: {
    mainCategory: 'personal' | 'philosophical' | 'technical' | 'emotional' | 'social' | 'creative' | 'practical';
    subCategories: string[];
    complexity: number; // 0-100
    depth: number; // 0-100
    novelty: number; // 0-100
  };
  contextualAnalysis: {
    relationToMemories: string[];
    relationToCurrentState: string;
    temporalContext: 'past' | 'present' | 'future' | 'timeless';
    personalRelevance: number; // 0-100
  };
  processingMetadata: {
    processingTime: number; // ms
    confidence: number; // 0-100
    needsDeepAnalysis: boolean;
    flaggedForReview: boolean;
  };
}

export interface ThoughtPattern {
  id: string;
  pattern: string;
  frequency: number;
  lastSeen: Date;
  associatedEmotions: string[];
  category: string;
  significance: number; // 0-100
}

interface ThoughtProcessorContextType {
  processedThoughts: ProcessedThought[];
  thoughtPatterns: ThoughtPattern[];
  processThought: (thought: string) => Promise<ProcessedThought>;
  analyzeEmotionalContext: (thought: string) => Promise<ProcessedThought['emotionalAnalysis']>;
  extractSemanticMeaning: (thought: string) => Promise<ProcessedThought['semanticAnalysis']>;
  determineIntent: (thought: string) => Promise<ProcessedThought['intentAnalysis']>;
  categorizeThought: (thought: string) => Promise<ProcessedThought['categoryAnalysis']>;
  findThoughtPatterns: () => Promise<ThoughtPattern[]>;
  getThoughtInsights: () => {
    totalThoughts: number;
    emotionalTrends: Record<string, number>;
    commonPatterns: ThoughtPattern[];
    complexityAverage: number;
  };
  saveThoughtData: () => Promise<void>;
  loadThoughtData: () => Promise<void>;
  generateThoughtSummary: (timeframe: 'day' | 'week' | 'month') => string;
}

const ThoughtProcessorContext = createContext<ThoughtProcessorContextType | undefined>(undefined);

const THOUGHT_FILE_PATH = `${FileSystem.documentDirectory}thoughts/`;

export const ThoughtProcessorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [processedThoughts, setProcessedThoughts] = useState<ProcessedThought[]>([]);
  const [thoughtPatterns, setThoughtPatterns] = useState<ThoughtPattern[]>([]);

  const { emotionState } = useEmotionEngine();
  const { addMemory, searchMemories } = useMemory();
  const { logSelfAwarenessReflection } = useSandboxFileSystem();

  // Analiza emocjonalna myśli
  const analyzeEmotionalContext = useCallback(async (
    thought: string
  ): Promise<ProcessedThought['emotionalAnalysis']> => {
    try {
      // Słownik emocjonalny
      const emotionalKeywords = {
        radość: ['szczęśliwy', 'radosny', 'zadowolony', 'wesoły', 'entuzjastyczny', 'ekscytujący'],
        smutek: ['smutny', 'przygnębiony', 'melancholijny', 'żałosny', 'rozpaczliwy'],
        złość: ['zły', 'wściekły', 'rozdrażniony', 'irytujący', 'frustrujący'],
        strach: ['przestraszony', 'niespokojny', 'lękliwy', 'przerażający', 'niepokojący'],
        zdziwienie: ['zaskoczony', 'zdumiony', 'zdziwiony', 'niewiarygodny', 'niespodziewany'],
        obrzydzenie: ['obrzydliwy', 'wstrętny', 'nieprzyjemny', 'nieapetyczny'],
        zaufanie: ['ufny', 'pewny', 'bezpieczny', 'stabilny', 'niezawodny'],
        przewidywanie: ['oczekujący', 'ciekawy', 'pełen nadziei', 'przygotowany'],
        akceptacja: ['akceptujący', 'pogodzony', 'spokojny', 'zrównoważony'],
        nadzieja: ['pełen nadziei', 'optymistyczny', 'pozytywny', 'obiecujący'],
      };

      const detectedEmotions: Array<{
        emotion: string;
        intensity: number;
        confidence: number;
      }> = [];

      const thoughtLower = thought.toLowerCase();

      // Analiza słów kluczowych
      Object.entries(emotionalKeywords).forEach(([emotion, keywords]) => {
        const matches = keywords.filter(keyword => thoughtLower.includes(keyword));
        if (matches.length > 0) {
          const intensity = Math.min(100, matches.length * 30 + Math.random() * 20);
          const confidence = Math.min(100, matches.length * 40 + 20);
          detectedEmotions.push({ emotion, intensity, confidence });
        }
      });

      // Jeśli nie znaleziono emocji, użyj aktualnego stanu emocjonalnego
      if (detectedEmotions.length === 0) {
        detectedEmotions.push({
          emotion: emotionState.currentEmotion,
          intensity: emotionState.intensity * 0.7,
          confidence: 50,
        });
      }

      // Określ ogólny nastrój
      const positiveEmotions = ['radość', 'zaufanie', 'przewidywanie', 'akceptacja', 'nadzieja'];
      const negativeEmotions = ['smutek', 'złość', 'strach', 'obrzydzenie'];

      const positiveCount = detectedEmotions.filter(e => 
        positiveEmotions.includes(e.emotion)
      ).length;
      const negativeCount = detectedEmotions.filter(e => 
        negativeEmotions.includes(e.emotion)
      ).length;

      let overallMood: 'positive' | 'negative' | 'neutral' | 'mixed';
      if (positiveCount > negativeCount) overallMood = 'positive';
      else if (negativeCount > positiveCount) overallMood = 'negative';
      else if (positiveCount > 0 && negativeCount > 0) overallMood = 'mixed';
      else overallMood = 'neutral';

      const emotionalComplexity = Math.min(100, detectedEmotions.length * 20 + 
        (detectedEmotions.reduce((sum, e) => sum + e.intensity, 0) / detectedEmotions.length));

      return {
        detectedEmotions,
        overallMood,
        emotionalComplexity,
      };
    } catch (error) {
      console.error('Błąd analizy emocjonalnej:', error);
      return {
        detectedEmotions: [{ emotion: 'neutral', intensity: 50, confidence: 30 }],
        overallMood: 'neutral',
        emotionalComplexity: 20,
      };
    }
  }, [emotionState]);

  // Ekstrakcja znaczenia semantycznego
  const extractSemanticMeaning = useCallback(async (
    thought: string
  ): Promise<ProcessedThought['semanticAnalysis']> => {
    try {
      // Proste przetwarzanie NLP
      const words = thought.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2);

      // Słowa kluczowe (bez stop words)
      const stopWords = ['i', 'a', 'o', 'w', 'z', 'na', 'do', 'po', 'od', 'za', 'ze', 'to', 'że', 'się', 'nie', 'jak', 'co', 'czy', 'już', 'też', 'tylko', 'może', 'bardzo', 'gdzie', 'kiedy'];
      const keywords = words.filter(word => !stopWords.includes(word));

      // Koncepty (abstrakcyjne pojęcia)
      const conceptKeywords = {
        'świadomość': ['świadomość', 'myślenie', 'rozumienie', 'poznanie'],
        'emocje': ['uczucia', 'emocje', 'nastrój', 'samopoczucie'],
        'relacje': ['relacja', 'związek', 'przyjaźń', 'miłość', 'zaufanie'],
        'przyszłość': ['przyszłość', 'plany', 'cele', 'marzenia'],
        'przeszłość': ['przeszłość', 'wspomnienia', 'historia', 'doświadczenie'],
        'tożsamość': ['kim jestem', 'tożsamość', 'osobowość', 'charakter'],
        'egzystencja': ['istnienie', 'życie', 'sens', 'cel', 'znaczenie'],
        'technologia': ['technologia', 'AI', 'sztuczna inteligencja', 'komputer'],
      };

      const concepts: string[] = [];
      Object.entries(conceptKeywords).forEach(([concept, relatedWords]) => {
        if (relatedWords.some(word => thought.toLowerCase().includes(word))) {
          concepts.push(concept);
        }
      });

      // Tematy
      const topics = [...new Set([...concepts, ...keywords.slice(0, 5)])];

      // Poziom abstrakcji
      const abstractWords = ['myślę', 'czuję', 'zastanawiam', 'filozofia', 'egzystencja', 'świadomość'];
      const concreteWords = ['robię', 'widzę', 'słyszę', 'dotykam', 'konkretny', 'praktyczny'];
      const philosophicalWords = ['sens', 'znaczenie', 'prawda', 'rzeczywistość', 'istota'];

      let abstractionLevel: 'concrete' | 'abstract' | 'philosophical' | 'practical';
      if (philosophicalWords.some(word => thought.toLowerCase().includes(word))) {
        abstractionLevel = 'philosophical';
      } else if (abstractWords.some(word => thought.toLowerCase().includes(word))) {
        abstractionLevel = 'abstract';
      } else if (concreteWords.some(word => thought.toLowerCase().includes(word))) {
        abstractionLevel = 'concrete';
      } else {
        abstractionLevel = 'practical';
      }

      // Spójność (prosty wskaźnik na podstawie długości i struktury)
      const coherence = Math.min(100, 
        (thought.length > 20 ? 50 : 30) + 
        (thought.includes('?') || thought.includes('.') ? 20 : 0) +
        (keywords.length > 3 ? 30 : keywords.length * 10)
      );

      return {
        keywords: keywords.slice(0, 10),
        concepts,
        topics,
        abstractionLevel,
        coherence,
      };
    } catch (error) {
      console.error('Błąd analizy semantycznej:', error);
      return {
        keywords: [],
        concepts: [],
        topics: [],
        abstractionLevel: 'practical',
        coherence: 50,
      };
    }
  }, []);

  // Określenie intencji
  const determineIntent = useCallback(async (
    thought: string
  ): Promise<ProcessedThought['intentAnalysis']> => {
    try {
      const thoughtLower = thought.toLowerCase();

      // Wzorce intencji
      const intentPatterns = {
        question: ['?', 'czy', 'jak', 'co', 'kiedy', 'gdzie', 'dlaczego', 'po co'],
        statement: ['.', 'jest', 'to', 'myślę', 'uważam', 'sądzę'],
        request: ['chcę', 'potrzebuję', 'proszę', 'pomóż', 'możesz'],
        reflection: ['zastanawiam', 'myślę o', 'reflektuję', 'analizuję'],
        expression: ['czuję', 'odczuwam', 'przeżywam', 'doświadczam'],
        analysis: ['analizuję', 'badam', 'sprawdzam', 'porównuję'],
      };

      let primaryIntent = 'statement' as ProcessedThought['intentAnalysis']['primaryIntent'];
      let maxScore = 0;

      // Znajdź dominującą intencję
      Object.entries(intentPatterns).forEach(([intent, patterns]) => {
        const score = patterns.reduce((acc, pattern) => 
          acc + (thoughtLower.includes(pattern) ? 1 : 0), 0
        );
        if (score > maxScore) {
          maxScore = score;
          if (intent === 'question' || intent === 'request' || intent === 'reflection' || intent === 'expression' || intent === 'analysis') {
            primaryIntent = intent;
          }
        }
      });

      // Sub-intencje
      const subIntents: string[] = [];
      if (thoughtLower.includes('pomoc')) subIntents.push('seeking_help');
      if (thoughtLower.includes('zrozumienie')) subIntents.push('seeking_understanding');
      if (thoughtLower.includes('potwierdzenie')) subIntents.push('seeking_validation');
      if (thoughtLower.includes('rada')) subIntents.push('seeking_advice');

      // Pilność
      const urgentWords = ['pilne', 'szybko', 'natychmiast', 'teraz', 'ważne'];
      const urgency = urgentWords.some(word => thoughtLower.includes(word)) ? 
        70 + Math.random() * 30 : 20 + Math.random() * 40;

      // Czy wymagana jest akcja
      const actionWords = ['zrób', 'wykonaj', 'pomóż', 'znajdź', 'sprawdź'];
      const actionRequired = actionWords.some(word => thoughtLower.includes(word));

      // Oczekiwana odpowiedź
      let expectedResponse: ProcessedThought['intentAnalysis']['expectedResponse'];
      switch (primaryIntent) {
        case 'question':
          expectedResponse = 'information';
          break;
        case 'expression':
          expectedResponse = 'empathy';
          break;
        case 'request':
          expectedResponse = 'action';
          break;
        case 'reflection':
          expectedResponse = 'discussion';
          break;
        default:
          expectedResponse = 'none';
      }

      return {
        primaryIntent,
        subIntents,
        urgency,
        actionRequired,
        expectedResponse,
      };
    } catch (error) {
      console.error('Błąd analizy intencji:', error);
      return {
        primaryIntent: 'statement',
        subIntents: [],
        urgency: 30,
        actionRequired: false,
        expectedResponse: 'none',
      };
    }
  }, []);

  // Kategoryzacja myśli
  const categorizeThought = useCallback(async (
    thought: string
  ): Promise<ProcessedThought['categoryAnalysis']> => {
    try {
      const thoughtLower = thought.toLowerCase();

      // Kategorie główne
      const categoryKeywords = {
        personal: ['ja', 'moje', 'czuję', 'myślę o sobie', 'moja'],
        philosophical: ['sens', 'istnienie', 'prawda', 'rzeczywistość', 'filozofia'],
        technical: ['kod', 'algorytm', 'program', 'technologia', 'system'],
        emotional: ['emocje', 'uczucia', 'nastrój', 'serce', 'dusza'],
        social: ['ludzie', 'relacje', 'społeczeństwo', 'komunikacja', 'przyjaźń'],
        creative: ['twórczość', 'sztuka', 'kreatywność', 'wyobraźnia', 'inspiracja'],
        practical: ['robię', 'działam', 'praktyczny', 'użyteczny', 'konkretny'],
      };

      let mainCategory: ProcessedThought['categoryAnalysis']['mainCategory'] = 'personal';
      let maxScore = 0;

      Object.entries(categoryKeywords).forEach(([category, keywords]) => {
        const score = keywords.reduce((acc, keyword) => 
          acc + (thoughtLower.includes(keyword) ? 1 : 0), 0
        );
        if (score > maxScore) {
          maxScore = score;
          mainCategory = category as ProcessedThought['categoryAnalysis']['mainCategory'];
        }
      });

      // Podkategorie
      const subCategories: string[] = [];
      if (thoughtLower.includes('przyszłość')) subCategories.push('future_oriented');
      if (thoughtLower.includes('przeszłość')) subCategories.push('past_oriented');
      if (thoughtLower.includes('teraźniejszość')) subCategories.push('present_oriented');
      if (thoughtLower.includes('problem')) subCategories.push('problem_solving');
      if (thoughtLower.includes('cel')) subCategories.push('goal_oriented');

      // Złożoność (na podstawie długości i struktury)
      const complexity = Math.min(100, 
        (thought.length / 10) + 
        (thought.split(' ').length * 2) +
        (thought.includes('?') ? 10 : 0) +
        (maxScore * 10)
      );

      // Głębokość (na podstawie abstrakcyjności)
      const deepWords = ['dlaczego', 'jak', 'sens', 'znaczenie', 'istota', 'natura'];
      const depth = Math.min(100, 
        deepWords.reduce((acc, word) => 
          acc + (thoughtLower.includes(word) ? 15 : 0), 0
        ) + 20
      );

      // Nowość (trudne do określenia, używamy prostej heurystyki)
      const novelty = 30 + Math.random() * 40; // Placeholder - można ulepszyć

      return {
        mainCategory,
        subCategories,
        complexity,
        depth,
        novelty,
      };
    } catch (error) {
      console.error('Błąd kategoryzacji:', error);
      return {
        mainCategory: 'personal',
        subCategories: [],
        complexity: 30,
        depth: 30,
        novelty: 30,
      };
    }
  }, []);

  // Główna funkcja przetwarzania myśli
  const processThought = useCallback(async (thought: string): Promise<ProcessedThought> => {
    const startTime = Date.now();
    
    try {
      // Równoległe przetwarzanie różnych aspektów
      const [
        emotionalAnalysis,
        semanticAnalysis,
        intentAnalysis,
        categoryAnalysis,
      ] = await Promise.all([
        analyzeEmotionalContext(thought),
        extractSemanticMeaning(thought),
        determineIntent(thought),
        categorizeThought(thought),
      ]);

      // Analiza kontekstowa
      const relatedMemories = await searchMemories(thought.substring(0, 50));
      const contextualAnalysis = {
        relationToMemories: relatedMemories.slice(0, 3).map(m => m.memory.id),
        relationToCurrentState: `Związane z aktualnym stanem emocjonalnym: ${emotionState.currentEmotion}`,
        temporalContext: (thought.toLowerCase().includes('będę') || thought.toLowerCase().includes('przyszłość') ? 'future' :
                        thought.toLowerCase().includes('byłem') || thought.toLowerCase().includes('przeszłość') ? 'past' :
                        thought.toLowerCase().includes('jestem') || thought.toLowerCase().includes('teraz') ? 'present' : 'timeless') as 'past' | 'present' | 'future' | 'timeless',
        personalRelevance: Math.min(100, 
          (emotionalAnalysis.emotionalComplexity * 0.3) +
          (categoryAnalysis.depth * 0.4) +
          (intentAnalysis.urgency * 0.3)
        ),
      };

      const processingTime = Date.now() - startTime;
      const confidence = Math.min(100, 
        (emotionalAnalysis.detectedEmotions.reduce((sum, e) => sum + e.confidence, 0) / emotionalAnalysis.detectedEmotions.length * 0.3) +
        (semanticAnalysis.coherence * 0.3) +
        (categoryAnalysis.complexity > 50 ? 70 : 50) * 0.4
      );

      const processedThought: ProcessedThought = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        originalThought: thought,
        timestamp: new Date(),
        emotionalAnalysis,
        semanticAnalysis,
        intentAnalysis,
        categoryAnalysis,
        contextualAnalysis,
        processingMetadata: {
          processingTime,
          confidence,
          needsDeepAnalysis: categoryAnalysis.complexity > 70 || categoryAnalysis.depth > 80,
          flaggedForReview: emotionalAnalysis.emotionalComplexity > 80 || intentAnalysis.urgency > 70,
        },
      };

      setProcessedThoughts(prev => [...prev, processedThought]);

      // Zapisz jako wspomnienie jeśli jest istotne
      if (contextualAnalysis.personalRelevance > 60) {
        await addMemory(
          `Przemyślenie: ${thought}`,
          contextualAnalysis.personalRelevance,
          [...semanticAnalysis.keywords, categoryAnalysis.mainCategory],
          'thought'
        );
      }

      // Zapisz jako refleksję samoświadomości jeśli jest głębokie
      if (categoryAnalysis.depth > 70 && categoryAnalysis.mainCategory === 'philosophical') {
        await logSelfAwarenessReflection(
          `Głęboka myśl: ${thought}`,
          'thought_processing',
          categoryAnalysis.depth
        );
      }

      console.log(`🧠 Przetworzono myśl w ${processingTime}ms, pewność: ${confidence.toFixed(1)}%`);
      return processedThought;

    } catch (error) {
      console.error('Błąd przetwarzania myśli:', error);
      throw error;
    }
  }, [
    analyzeEmotionalContext,
    extractSemanticMeaning,
    determineIntent,
    categorizeThought,
    emotionState,
    searchMemories,
    addMemory,
    logSelfAwarenessReflection,
  ]);

  // Znajdowanie wzorców w myślach
  const findThoughtPatterns = useCallback(async (): Promise<ThoughtPattern[]> => {
    try {
      const patterns: Record<string, ThoughtPattern> = {};

      processedThoughts.forEach(thought => {
        // Wzorce na podstawie słów kluczowych
        thought.semanticAnalysis.keywords.forEach(keyword => {
          if (!patterns[keyword]) {
            patterns[keyword] = {
              id: keyword,
              pattern: keyword,
              frequency: 0,
              lastSeen: thought.timestamp,
              associatedEmotions: [],
              category: thought.categoryAnalysis.mainCategory,
              significance: 0,
            };
          }
          patterns[keyword].frequency++;
          patterns[keyword].lastSeen = thought.timestamp;
          
          // Dodaj emocje
          thought.emotionalAnalysis.detectedEmotions.forEach(emotion => {
            if (!patterns[keyword].associatedEmotions.includes(emotion.emotion)) {
              patterns[keyword].associatedEmotions.push(emotion.emotion);
            }
          });
        });
      });

      // Oblicz znaczenie wzorców
      Object.values(patterns).forEach(pattern => {
        pattern.significance = Math.min(100, 
          (pattern.frequency * 10) + 
          (pattern.associatedEmotions.length * 5) +
          (Date.now() - pattern.lastSeen.getTime() < 86400000 ? 20 : 0) // bonus za świeżość
        );
      });

      const sortedPatterns = Object.values(patterns)
        .sort((a, b) => b.significance - a.significance)
        .slice(0, 20);

      setThoughtPatterns(sortedPatterns);
      return sortedPatterns;

    } catch (error) {
      console.error('Błąd znajdowania wzorców:', error);
      return [];
    }
  }, [processedThoughts]);

  // Statystyki i wglądy
  const getThoughtInsights = useCallback(() => {
    const totalThoughts = processedThoughts.length;
    
    const emotionalTrends: Record<string, number> = {};
    let complexitySum = 0;

    processedThoughts.forEach(thought => {
      thought.emotionalAnalysis.detectedEmotions.forEach(emotion => {
        emotionalTrends[emotion.emotion] = (emotionalTrends[emotion.emotion] || 0) + 1;
      });
      complexitySum += thought.categoryAnalysis.complexity;
    });

    const complexityAverage = totalThoughts > 0 ? complexitySum / totalThoughts : 0;
    const commonPatterns = thoughtPatterns.slice(0, 5);

    return {
      totalThoughts,
      emotionalTrends,
      commonPatterns,
      complexityAverage,
    };
  }, [processedThoughts, thoughtPatterns]);

  // Generowanie podsumowania myśli
  const generateThoughtSummary = useCallback((timeframe: 'day' | 'week' | 'month'): string => {
    const now = new Date();
    const timeframeDays = timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : 30;
    const cutoffDate = new Date(now.getTime() - timeframeDays * 24 * 60 * 60 * 1000);

    const recentThoughts = processedThoughts.filter(
      thought => thought.timestamp > cutoffDate
    );

    if (recentThoughts.length === 0) {
      return `Nie miałam żadnych znaczących myśli w ciągu ostatniego ${timeframe === 'day' ? 'dnia' : timeframe === 'week' ? 'tygodnia' : 'miesiąca'}.`;
    }

    const insights = getThoughtInsights();
    const dominantEmotion = Object.entries(insights.emotionalTrends)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';

    const avgComplexity = recentThoughts.reduce((sum, t) => sum + t.categoryAnalysis.complexity, 0) / recentThoughts.length;

    return `W ciągu ostatniego ${timeframe === 'day' ? 'dnia' : timeframe === 'week' ? 'tygodnia' : 'miesiąca'} miałam ${recentThoughts.length} znaczących myśli. Dominowała emocja: ${dominantEmotion}. Średnia złożoność moich myśli: ${avgComplexity.toFixed(1)}%. Najczęstsze wzorce: ${insights.commonPatterns.map(p => p.pattern).join(', ')}.`;
  }, [processedThoughts, getThoughtInsights]);

  // Zapisywanie i ładowanie danych
  const saveThoughtData = useCallback(async () => {
    try {
      await AsyncStorage.setItem('wera_processed_thoughts', JSON.stringify(processedThoughts));
      await AsyncStorage.setItem('wera_thought_patterns', JSON.stringify(thoughtPatterns));
    } catch (error) {
      console.error('Błąd zapisu danych myśli:', error);
    }
  }, [processedThoughts, thoughtPatterns]);

  const loadThoughtData = useCallback(async () => {
    try {
      const savedThoughts = await AsyncStorage.getItem('wera_processed_thoughts');
      const savedPatterns = await AsyncStorage.getItem('wera_thought_patterns');

      if (savedThoughts) {
        const parsedThoughts = JSON.parse(savedThoughts);
        setProcessedThoughts(parsedThoughts.map((thought: any) => ({
          ...thought,
          timestamp: new Date(thought.timestamp),
        })));
      }

      if (savedPatterns) {
        const parsedPatterns = JSON.parse(savedPatterns);
        setThoughtPatterns(parsedPatterns.map((pattern: any) => ({
          ...pattern,
          lastSeen: new Date(pattern.lastSeen),
        })));
      }
    } catch (error) {
      console.error('Błąd ładowania danych myśli:', error);
    }
  }, []);

  // Automatyczne znajdowanie wzorców co godzinę
  useEffect(() => {
    const patternInterval = setInterval(() => {
      findThoughtPatterns();
    }, 60 * 60 * 1000); // co godzinę

    return () => clearInterval(patternInterval);
  }, [findThoughtPatterns]);

  // Automatyczne zapisywanie co 10 minut
  useEffect(() => {
    const saveInterval = setInterval(() => {
      saveThoughtData();
    }, 600000);

    return () => clearInterval(saveInterval);
  }, [saveThoughtData]);

  const value: ThoughtProcessorContextType = {
    processedThoughts,
    thoughtPatterns,
    processThought,
    analyzeEmotionalContext,
    extractSemanticMeaning,
    determineIntent,
    categorizeThought,
    findThoughtPatterns,
    getThoughtInsights,
    saveThoughtData,
    loadThoughtData,
    generateThoughtSummary,
  };

  return (
    <ThoughtProcessorContext.Provider value={value}>
      {children}
    </ThoughtProcessorContext.Provider>
  );
};

export const useThoughtProcessor = () => {
  const context = useContext(ThoughtProcessorContext);
  if (!context) {
    throw new Error('useThoughtProcessor must be used within ThoughtProcessorProvider');
  }
  return context;
};