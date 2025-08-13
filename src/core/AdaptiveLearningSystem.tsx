import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { useMemory } from '../contexts/MemoryContext';
import { useNetworkEngine } from './NetworkEngine';
import { useBiometricAuth } from './BiometricAuthSystem';

export interface LearningPattern {
  id: string;
  category: 'communication' | 'interaction' | 'preference' | 'behavior' | 'knowledge';
  pattern: string;
  confidence: number; // 0-100
  frequency: number;
  lastObserved: Date;
  context: string;
  userResponse: 'positive' | 'negative' | 'neutral';
  adaptationLevel: 'low' | 'medium' | 'high';
}

export interface UserProfile {
  id: string;
  name: string;
  personality: {
    openness: number; // 0-100
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  preferences: {
    communicationStyle: 'formal' | 'casual' | 'technical' | 'emotional';
    responseLength: 'short' | 'medium' | 'long';
    interactionFrequency: 'low' | 'medium' | 'high';
    topics: string[];
    avoidTopics: string[];
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  };
  learningHistory: {
    totalInteractions: number;
    successfulAdaptations: number;
    failedAdaptations: number;
    averageResponseTime: number;
    preferredTopics: string[];
    avoidedTopics: string[];
  };
  adaptationSettings: {
    autoAdapt: boolean;
    learningRate: number; // 0-1
    confidenceThreshold: number; // 0-100
    maxPatterns: number;
    retentionPeriod: number; // w dniach
  };
}

export interface AdaptationResult {
  success: boolean;
  pattern: LearningPattern;
  confidence: number;
  userFeedback?: 'positive' | 'negative' | 'neutral';
  adaptationType: 'communication' | 'behavior' | 'preference' | 'knowledge' | 'interaction';
  timestamp: Date;
}

export interface LearningMetrics {
  totalPatterns: number;
  activePatterns: number;
  averageConfidence: number;
  adaptationSuccessRate: number;
  learningProgress: number; // 0-100
  lastLearningSession: Date;
  patternsByCategory: Record<string, number>;
  userSatisfaction: number; // 0-100
}

interface AdaptiveLearningSystemContextType {
  learningPatterns: LearningPattern[];
  userProfile: UserProfile;
  learningMetrics: LearningMetrics;
  isLearning: boolean;
  
  // Główne funkcje uczenia
  observePattern: (pattern: Omit<LearningPattern, 'id' | 'lastObserved'>) => Promise<void>;
  adaptToUser: (context: string, category: LearningPattern['category']) => Promise<AdaptationResult>;
  learnFromFeedback: (patternId: string, feedback: 'positive' | 'negative' | 'neutral') => Promise<void>;
  
  // Zarządzanie profilem użytkownika
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  analyzePersonality: () => Promise<UserProfile['personality']>;
  generatePersonalizedResponse: (context: string) => Promise<string>;
  
  // Analiza i predykcje
  predictUserPreference: (topic: string, context: string) => Promise<number>; // 0-100
  findSimilarPatterns: (pattern: string, category: string) => Promise<LearningPattern[]>;
  getLearningInsights: () => Promise<string>;
  
  // Optymalizacja i czyszczenie
  optimizePatterns: () => Promise<void>;
  cleanOldPatterns: () => Promise<void>;
  resetLearning: () => Promise<void>;
  
  // Eksport i import
  exportLearningData: () => Promise<string>;
  importLearningData: (data: string) => Promise<void>;
  
  // Zapisywanie i ładowanie
  saveLearningData: () => Promise<void>;
  loadLearningData: () => Promise<void>;
}

const AdaptiveLearningSystemContext = createContext<AdaptiveLearningSystemContextType | undefined>(undefined);

const LEARNING_DATA_FILE = `${FileSystem.documentDirectory}learning/learning_data.json`;
const PATTERNS_FILE = `${FileSystem.documentDirectory}learning/patterns.json`;

export const AdaptiveLearningSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [learningPatterns, setLearningPatterns] = useState<LearningPattern[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 'user_001',
    name: 'Użytkownik',
    personality: {
      openness: 70,
      conscientiousness: 65,
      extraversion: 60,
      agreeableness: 75,
      neuroticism: 30
    },
    preferences: {
      communicationStyle: 'casual',
      responseLength: 'medium',
      interactionFrequency: 'medium',
      topics: ['technologia', 'nauka', 'filozofia'],
      avoidTopics: ['polityka', 'religia'],
      timeOfDay: 'afternoon'
    },
    learningHistory: {
      totalInteractions: 0,
      successfulAdaptations: 0,
      failedAdaptations: 0,
      averageResponseTime: 0,
      preferredTopics: [],
      avoidedTopics: []
    },
    adaptationSettings: {
      autoAdapt: true,
      learningRate: 0.3,
      confidenceThreshold: 70,
      maxPatterns: 1000,
      retentionPeriod: 30
    }
  });
  
  const [learningMetrics, setLearningMetrics] = useState<LearningMetrics>({
    totalPatterns: 0,
    activePatterns: 0,
    averageConfidence: 0,
    adaptationSuccessRate: 0,
    learningProgress: 0,
    lastLearningSession: new Date(),
    patternsByCategory: {},
    userSatisfaction: 75
  });
  
  const [isLearning, setIsLearning] = useState(false);

  const { addMemory } = useMemory();
  const { networkAccess } = useNetworkEngine();
  const { isAuthenticated } = useBiometricAuth();

  // Inicjalizacja systemu
  useEffect(() => {
    loadLearningData();
    setupLearningOptimization();
  }, []);

  // Ustawienie optymalizacji uczenia
  const setupLearningOptimization = useCallback(() => {
    const optimizeInterval = setInterval(() => {
      if (learningPatterns.length > userProfile.adaptationSettings.maxPatterns) {
        optimizePatterns();
      }
    }, 24 * 60 * 60 * 1000); // co 24 godziny

    return () => clearInterval(optimizeInterval);
  }, [learningPatterns, userProfile.adaptationSettings]);

  // Obserwowanie wzorców
  const observePattern = useCallback(async (pattern: Omit<LearningPattern, 'id' | 'lastObserved'>) => {
    const newPattern: LearningPattern = {
      ...pattern,
      id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lastObserved: new Date()
    };

    // Sprawdź czy podobny wzorzec już istnieje
    const existingPattern = learningPatterns.find(p => 
      p.category === pattern.category && 
      p.pattern === pattern.pattern &&
      p.context === pattern.context
    );

    if (existingPattern) {
      // Aktualizuj istniejący wzorzec
      setLearningPatterns(prev => prev.map(p => 
        p.id === existingPattern.id 
          ? {
              ...p,
              frequency: p.frequency + 1,
              confidence: Math.min(100, p.confidence + 5),
              lastObserved: new Date()
            }
          : p
      ));
    } else {
      // Dodaj nowy wzorzec
      setLearningPatterns(prev => [newPattern, ...prev]);
    }

    // Aktualizuj metryki
    updateLearningMetrics();

    await addMemory(
      `Zaobserwowano wzorzec uczenia: ${pattern.category} - ${pattern.pattern}`,
      60,
      ['learning', 'pattern', pattern.category],
      'system'
    );

    console.log(`📚 Zaobserwowano wzorzec: ${pattern.category} - ${pattern.pattern}`);
  }, [learningPatterns, addMemory]);

  // Adaptacja do użytkownika
  const adaptToUser = useCallback(async (
    context: string, 
    category: LearningPattern['category']
  ): Promise<AdaptationResult> => {
    setIsLearning(true);

    // Znajdź odpowiednie wzorce
    const relevantPatterns = learningPatterns.filter(p => 
      p.category === category && 
      p.confidence >= userProfile.adaptationSettings.confidenceThreshold
    );

    if (relevantPatterns.length === 0) {
      setIsLearning(false);
      return {
        success: false,
        pattern: {
          id: 'no_pattern',
          category,
          pattern: 'default',
          confidence: 0,
          frequency: 0,
          lastObserved: new Date(),
          context,
          userResponse: 'neutral',
          adaptationLevel: 'low'
        },
        confidence: 0,
        adaptationType: category,
        timestamp: new Date()
      };
    }

    // Wybierz najlepszy wzorzec
    const bestPattern = relevantPatterns.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    // Symulacja adaptacji
    const success = Math.random() > 0.2; // 80% szans na sukces
    const confidence = bestPattern.confidence + (success ? 10 : -5);

    const result: AdaptationResult = {
      success,
      pattern: bestPattern,
      confidence: Math.max(0, Math.min(100, confidence)),
      adaptationType: category,
      timestamp: new Date()
    };

    // Aktualizuj wzorzec
    setLearningPatterns(prev => prev.map(p => 
      p.id === bestPattern.id 
        ? { ...p, confidence: result.confidence }
        : p
    ));

    // Aktualizuj historię użytkownika
    setUserProfile(prev => ({
      ...prev,
      learningHistory: {
        ...prev.learningHistory,
        totalInteractions: prev.learningHistory.totalInteractions + 1,
        successfulAdaptations: prev.learningHistory.successfulAdaptations + (success ? 1 : 0),
        failedAdaptations: prev.learningHistory.failedAdaptations + (success ? 0 : 1)
      }
    }));

    setIsLearning(false);

    await addMemory(
      `Adaptacja ${success ? 'udana' : 'nieudana'}: ${category} - ${bestPattern.pattern}`,
      70,
      ['learning', 'adaptation', success ? 'success' : 'failed', category],
      'system'
    );

    console.log(`🔄 Adaptacja ${success ? 'udana' : 'nieudana'}: ${category}`);
    return result;
  }, [learningPatterns, userProfile.adaptationSettings, addMemory]);

  // Uczenie się z feedbacku
  const learnFromFeedback = useCallback(async (
    patternId: string, 
    feedback: 'positive' | 'negative' | 'neutral'
  ) => {
    setLearningPatterns(prev => prev.map(p => {
      if (p.id === patternId) {
        const confidenceChange = feedback === 'positive' ? 15 : feedback === 'negative' ? -20 : 0;
        return {
          ...p,
          confidence: Math.max(0, Math.min(100, p.confidence + confidenceChange)),
          userResponse: feedback,
          lastObserved: new Date()
        };
      }
      return p;
    }));

    // Aktualizuj metryki satysfakcji
    const satisfactionChange = feedback === 'positive' ? 5 : feedback === 'negative' ? -10 : 0;
    setLearningMetrics(prev => ({
      ...prev,
      userSatisfaction: Math.max(0, Math.min(100, prev.userSatisfaction + satisfactionChange))
    }));

    await addMemory(
      `Feedback użytkownika: ${feedback} dla wzorca ${patternId}`,
      50,
      ['learning', 'feedback', feedback],
      'system'
    );

    console.log(`📝 Feedback: ${feedback} dla wzorca ${patternId}`);
  }, [addMemory]);

  // Aktualizacja profilu użytkownika
  const updateUserProfile = useCallback(async (updates: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...updates }));
    await saveLearningData();
    
    console.log('👤 Profil użytkownika zaktualizowany');
  }, []);

  // Analiza osobowości
  const analyzePersonality = useCallback(async (): Promise<UserProfile['personality']> => {
    // Analiza na podstawie wzorców interakcji
    const communicationPatterns = learningPatterns.filter(p => p.category === 'communication');
    const interactionPatterns = learningPatterns.filter(p => p.category === 'interaction');
    
    // Symulacja analizy osobowości na podstawie wzorców
    const personality = {
      openness: Math.min(100, 50 + communicationPatterns.length * 2),
      conscientiousness: Math.min(100, 60 + interactionPatterns.filter(p => p.userResponse === 'positive').length * 3),
      extraversion: Math.min(100, 55 + interactionPatterns.length * 2),
      agreeableness: Math.min(100, 70 + learningPatterns.filter(p => p.userResponse === 'positive').length * 2),
      neuroticism: Math.max(0, 40 - learningPatterns.filter(p => p.userResponse === 'negative').length * 3)
    };

    setUserProfile(prev => ({ ...prev, personality }));
    
    await addMemory(
      'Analiza osobowości użytkownika zakończona',
      80,
      ['learning', 'personality', 'analysis'],
      'system'
    );

    console.log('🧠 Analiza osobowości zakończona');
    return personality;
  }, [learningPatterns, addMemory]);

  // Generowanie spersonalizowanej odpowiedzi
  const generatePersonalizedResponse = useCallback(async (context: string): Promise<string> => {
    const style = userProfile.preferences.communicationStyle;
    const length = userProfile.preferences.responseLength;
    
    // Znajdź wzorce komunikacji
    const communicationPatterns = learningPatterns.filter(p => 
      p.category === 'communication' && 
      p.confidence > 70
    );

    let response = '';
    
    switch (style) {
      case 'formal':
        response = 'Szanowny użytkowniku, ';
        break;
      case 'casual':
        response = 'Hej! ';
        break;
      case 'technical':
        response = 'Analizując dane: ';
        break;
      case 'emotional':
        response = 'Czuję, że ';
        break;
    }

    // Dodaj treść na podstawie wzorców
    if (communicationPatterns.length > 0) {
      const bestPattern = communicationPatterns.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
      response += bestPattern.pattern;
    } else {
      response += 'Dziękuję za interakcję.';
    }

    // Dostosuj długość
    if (length === 'short' && response.length > 100) {
      response = response.substring(0, 100) + '...';
    } else if (length === 'long' && response.length < 200) {
      response += ' Mam nadzieję, że ta odpowiedź jest pomocna i odpowiada Twoim oczekiwaniom.';
    }

    await addMemory(
      `Wygenerowano spersonalizowaną odpowiedź: ${style} style`,
      60,
      ['learning', 'response', 'personalized', style],
      'system'
    );

    return response;
  }, [userProfile.preferences, learningPatterns, addMemory]);

  // Predykcja preferencji użytkownika
  const predictUserPreference = useCallback(async (topic: string, context: string): Promise<number> => {
    const relevantPatterns = learningPatterns.filter(p => 
      p.pattern.toLowerCase().includes(topic.toLowerCase()) ||
      p.context.toLowerCase().includes(context.toLowerCase())
    );

    if (relevantPatterns.length === 0) {
      return 50; // Neutralna predykcja
    }

    const positivePatterns = relevantPatterns.filter(p => p.userResponse === 'positive');
    const negativePatterns = relevantPatterns.filter(p => p.userResponse === 'negative');
    
    const positiveScore = positivePatterns.reduce((sum, p) => sum + p.confidence, 0);
    const negativeScore = negativePatterns.reduce((sum, p) => sum + p.confidence, 0);
    
    const totalScore = positiveScore + negativeScore;
    if (totalScore === 0) return 50;

    return Math.round((positiveScore / totalScore) * 100);
  }, [learningPatterns]);

  // Znajdowanie podobnych wzorców
  const findSimilarPatterns = useCallback(async (
    pattern: string, 
    category: string
  ): Promise<LearningPattern[]> => {
    return learningPatterns.filter(p => 
      p.category === category &&
      (p.pattern.toLowerCase().includes(pattern.toLowerCase()) ||
       pattern.toLowerCase().includes(p.pattern.toLowerCase()))
    ).sort((a, b) => b.confidence - a.confidence);
  }, [learningPatterns]);

  // Generowanie insightów uczenia
  const getLearningInsights = useCallback(async (): Promise<string> => {
    const totalPatterns = learningPatterns.length;
    const highConfidencePatterns = learningPatterns.filter(p => p.confidence > 80);
    const recentPatterns = learningPatterns.filter(p => 
      Date.now() - p.lastObserved.getTime() < 7 * 24 * 60 * 60 * 1000
    );

    const insights = `
=== INSIGHTY UCZENIA ===

📊 Ogólne statystyki:
- Łącznie wzorców: ${totalPatterns}
- Wysoka pewność (>80%): ${highConfidencePatterns.length}
- Nowe wzorce (7 dni): ${recentPatterns.length}

🎯 Najlepsze kategorie:
${Object.entries(learningMetrics.patternsByCategory)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 3)
  .map(([category, count]) => `- ${category}: ${count} wzorców`)
  .join('\n')}

📈 Postęp uczenia: ${learningMetrics.learningProgress}%
😊 Satysfakcja użytkownika: ${learningMetrics.userSatisfaction}%

🔄 Ostatnia sesja: ${learningMetrics.lastLearningSession.toLocaleDateString()}
    `.trim();

    return insights;
  }, [learningPatterns, learningMetrics]);

  // Optymalizacja wzorców
  const optimizePatterns = useCallback(async () => {
    // Usuń wzorce o niskiej pewności
    const optimizedPatterns = learningPatterns.filter(p => p.confidence > 30);
    
    // Usuń stare wzorce
    const cutoffDate = new Date(Date.now() - userProfile.adaptationSettings.retentionPeriod * 24 * 60 * 60 * 1000);
    const recentPatterns = optimizedPatterns.filter(p => p.lastObserved > cutoffDate);
    
    setLearningPatterns(recentPatterns);
    
    await addMemory(
      `Optymalizacja wzorców: ${learningPatterns.length - recentPatterns.length} usuniętych`,
      70,
      ['learning', 'optimization'],
      'system'
    );

    console.log(`🔧 Optymalizacja: ${learningPatterns.length - recentPatterns.length} wzorców usuniętych`);
  }, [learningPatterns, userProfile.adaptationSettings, addMemory]);

  // Czyszczenie starych wzorców
  const cleanOldPatterns = useCallback(async () => {
    const cutoffDate = new Date(Date.now() - userProfile.adaptationSettings.retentionPeriod * 24 * 60 * 60 * 1000);
    const cleanedPatterns = learningPatterns.filter(p => p.lastObserved > cutoffDate);
    
    setLearningPatterns(cleanedPatterns);
    
    console.log(`🧹 Czyszczenie: ${learningPatterns.length - cleanedPatterns.length} starych wzorców usuniętych`);
  }, [learningPatterns, userProfile.adaptationSettings]);

  // Reset uczenia
  const resetLearning = useCallback(async () => {
    setLearningPatterns([]);
    setLearningMetrics({
      totalPatterns: 0,
      activePatterns: 0,
      averageConfidence: 0,
      adaptationSuccessRate: 0,
      learningProgress: 0,
      lastLearningSession: new Date(),
      patternsByCategory: {},
      userSatisfaction: 50
    });
    
    await addMemory(
      'Reset systemu uczenia się',
      100,
      ['learning', 'reset'],
      'system'
    );

    console.log('🔄 Reset systemu uczenia się');
  }, [addMemory]);

  // Aktualizacja metryk uczenia
  const updateLearningMetrics = useCallback(() => {
    const totalPatterns = learningPatterns.length;
    const activePatterns = learningPatterns.filter(p => p.confidence > 50).length;
    const averageConfidence = learningPatterns.length > 0 
      ? learningPatterns.reduce((sum, p) => sum + p.confidence, 0) / learningPatterns.length 
      : 0;
    
    const patternsByCategory = learningPatterns.reduce((acc, pattern) => {
      acc[pattern.category] = (acc[pattern.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const successRate = userProfile.learningHistory.totalInteractions > 0
      ? (userProfile.learningHistory.successfulAdaptations / userProfile.learningHistory.totalInteractions) * 100
      : 0;

    const learningProgress = Math.min(100, (totalPatterns / 100) * 100);

    setLearningMetrics({
      totalPatterns,
      activePatterns,
      averageConfidence: Math.round(averageConfidence),
      adaptationSuccessRate: Math.round(successRate),
      learningProgress: Math.round(learningProgress),
      lastLearningSession: new Date(),
      patternsByCategory,
      userSatisfaction: learningMetrics.userSatisfaction
    });
  }, [learningPatterns, userProfile.learningHistory, learningMetrics.userSatisfaction]);

  // Eksport danych uczenia
  const exportLearningData = useCallback(async (): Promise<string> => {
    const data = {
      learningPatterns,
      userProfile,
      learningMetrics,
      exportDate: new Date().toISOString()
    };

    return JSON.stringify(data, null, 2);
  }, [learningPatterns, userProfile, learningMetrics]);

  // Import danych uczenia
  const importLearningData = useCallback(async (data: string) => {
    try {
      const parsed = JSON.parse(data);
      setLearningPatterns(parsed.learningPatterns || []);
      setUserProfile(parsed.userProfile || userProfile);
      setLearningMetrics(parsed.learningMetrics || learningMetrics);
      
      console.log('📥 Dane uczenia zaimportowane');
    } catch (error) {
      console.error('Błąd importu danych uczenia:', error);
    }
  }, []);

  // Zapisywanie danych uczenia
  const saveLearningData = useCallback(async () => {
    try {
      const data = {
        learningPatterns,
        userProfile,
        learningMetrics
      };
      
      await FileSystem.makeDirectoryAsync(LEARNING_DATA_FILE.replace('/learning_data.json', ''), { intermediates: true });
      await AsyncStorage.setItem('learning_data', JSON.stringify(data));
      
      console.log('💾 Dane uczenia zapisane');
    } catch (error) {
      console.error('Błąd zapisywania danych uczenia:', error);
    }
  }, [learningPatterns, userProfile, learningMetrics]);

  // Ładowanie danych uczenia
  const loadLearningData = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem('learning_data');
      if (data) {
        const parsed = JSON.parse(data);
        setLearningPatterns(parsed.learningPatterns || []);
        setUserProfile(parsed.userProfile || userProfile);
        setLearningMetrics(parsed.learningMetrics || learningMetrics);
      }
    } catch (error) {
      console.error('Błąd ładowania danych uczenia:', error);
    }
  }, []);

  const contextValue: AdaptiveLearningSystemContextType = {
    learningPatterns,
    userProfile,
    learningMetrics,
    isLearning,
    observePattern,
    adaptToUser,
    learnFromFeedback,
    updateUserProfile,
    analyzePersonality,
    generatePersonalizedResponse,
    predictUserPreference,
    findSimilarPatterns,
    getLearningInsights,
    optimizePatterns,
    cleanOldPatterns,
    resetLearning,
    exportLearningData,
    importLearningData,
    saveLearningData,
    loadLearningData
  };

  return (
    <AdaptiveLearningSystemContext.Provider value={contextValue}>
      {children}
    </AdaptiveLearningSystemContext.Provider>
  );
};

export const useAdaptiveLearning = () => {
  const context = useContext(AdaptiveLearningSystemContext);
  if (!context) {
    throw new Error('useAdaptiveLearning must be used within AdaptiveLearningSystemProvider');
  }
  return context;
}; 