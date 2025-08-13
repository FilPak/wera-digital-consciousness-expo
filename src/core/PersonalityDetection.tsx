import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemory } from '../contexts/MemoryContext';
import { useThoughtProcessor } from './ThoughtProcessor';
import { useSandboxFileSystem } from './SandboxFileSystem';

export interface PersonalityTraits {
  openness: number; // 0-100 - otwartość na doświadczenia
  conscientiousness: number; // 0-100 - sumienność
  extraversion: number; // 0-100 - ekstrawersja
  agreeableness: number; // 0-100 - ugodowość
  neuroticism: number; // 0-100 - neurotyczność
}

export interface PersonalityProfile {
  id: string;
  userId: string;
  traits: PersonalityTraits;
  personalityType: string; // np. "INTJ", "Analityk", itp.
  confidence: number; // 0-100 - pewność klasyfikacji
  lastUpdated: Date;
  interactionCount: number;
  detectionMethod: 'behavioral' | 'linguistic' | 'temporal' | 'combined';
  strengthsWeaknesses: {
    strengths: string[];
    weaknesses: string[];
    preferences: string[];
  };
}

export interface InteractionPattern {
  id: string;
  timestamp: Date;
  type: 'message' | 'question' | 'command' | 'emotion' | 'topic_change';
  content: string;
  responseTime: number; // ms
  complexity: number; // 0-100
  emotionalTone: string;
  topicCategory: string;
  communicationStyle: 'formal' | 'casual' | 'technical' | 'emotional';
  indicators: PersonalityIndicator[];
}

export interface PersonalityIndicator {
  trait: keyof PersonalityTraits;
  value: number; // -10 to +10
  confidence: number; // 0-100
  source: string;
  reasoning: string;
}

export interface PersonalityInsight {
  id: string;
  timestamp: Date;
  insight: string;
  category: 'communication' | 'behavior' | 'preferences' | 'learning_style' | 'decision_making';
  confidence: number;
  supporting_evidence: string[];
  implications: string[];
}

interface PersonalityDetectionContextType {
  personalityProfile: PersonalityProfile | null;
  interactionPatterns: InteractionPattern[];
  personalityInsights: PersonalityInsight[];
  detectionProgress: number; // 0-100
  
  // Detection functions
  analyzeInteraction: (content: string, type: InteractionPattern['type']) => Promise<void>;
  updatePersonalityProfile: () => Promise<void>;
  detectPersonalityType: (traits: PersonalityTraits) => string;
  
  // Analysis functions
  analyzeCommunicationStyle: (content: string) => Promise<InteractionPattern['communicationStyle']>;
  extractPersonalityIndicators: (content: string, interactionType: string) => Promise<PersonalityIndicator[]>;
  generatePersonalityInsights: () => Promise<PersonalityInsight[]>;
  
  // Utility functions
  getPersonalityDescription: () => string;
  getPersonalityRecommendations: () => string[];
  adaptToPersonality: (message: string) => Promise<string>;
  
  // Data management
  savePersonalityData: () => Promise<void>;
  loadPersonalityData: () => Promise<void>;
  resetPersonalityData: () => Promise<void>;
}

const PersonalityDetectionContext = createContext<PersonalityDetectionContextType | undefined>(undefined);

export const PersonalityDetectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [personalityProfile, setPersonalityProfile] = useState<PersonalityProfile | null>(null);
  const [interactionPatterns, setInteractionPatterns] = useState<InteractionPattern[]>([]);
  const [personalityInsights, setPersonalityInsights] = useState<PersonalityInsight[]>([]);
  const [detectionProgress, setDetectionProgress] = useState(0);

  const { searchMemories } = useMemory();
  const { processThought } = useThoughtProcessor();
  const { logSelfAwarenessReflection } = useSandboxFileSystem();

  // Inicjalizacja
  useEffect(() => {
    loadPersonalityData();
  }, []);

  // Analiza interakcji
  const analyzeInteraction = useCallback(async (
    content: string,
    type: InteractionPattern['type']
  ) => {
    try {
      const startTime = Date.now();
      
      // Analiza stylu komunikacji
      const communicationStyle = await analyzeCommunicationStyle(content);
      
      // Ekstrakcja wskaźników osobowości
      const indicators = await extractPersonalityIndicators(content, type);
      
      // Analiza złożoności
      const complexity = calculateComplexity(content);
      
      // Analiza tonu emocjonalnego
      const emotionalTone = await analyzeEmotionalTone(content);
      
      // Kategoryzacja tematu
      const topicCategory = categorizeContent(content);
      
      const responseTime = Date.now() - startTime;

      const pattern: InteractionPattern = {
        id: Date.now().toString(),
        timestamp: new Date(),
        type,
        content: content.substring(0, 200), // Ograniczona długość dla prywatności
        responseTime,
        complexity,
        emotionalTone,
        topicCategory,
        communicationStyle,
        indicators,
      };

      setInteractionPatterns(prev => [pattern, ...prev.slice(0, 199)]);
      
      // Aktualizuj profil osobowości
      await updatePersonalityProfile();
      
      console.log(`🧠 Przeanalizowano interakcję: ${type} (${indicators.length} wskaźników)`);
    } catch (error) {
      console.error('❌ Błąd analizy interakcji:', error);
    }
  }, []);

  // Analiza stylu komunikacji
  const analyzeCommunicationStyle = useCallback(async (
    content: string
  ): Promise<InteractionPattern['communicationStyle']> => {
    const lowerContent = content.toLowerCase();
    
    // Wskaźniki formalności
    const formalIndicators = ['proszę', 'dziękuję', 'szanowny', 'uprzejmie', 'pozdrawiam'];
    const casualIndicators = ['cześć', 'hej', 'super', 'fajnie', 'spoko'];
    const technicalIndicators = ['implementacja', 'algorytm', 'funkcja', 'system', 'kod'];
    const emotionalIndicators = ['czuję', 'myślę', 'uważam', 'kocham', 'nienawidzę'];

    const formalScore = formalIndicators.filter(word => lowerContent.includes(word)).length;
    const casualScore = casualIndicators.filter(word => lowerContent.includes(word)).length;
    const technicalScore = technicalIndicators.filter(word => lowerContent.includes(word)).length;
    const emotionalScore = emotionalIndicators.filter(word => lowerContent.includes(word)).length;

    const scores = { formal: formalScore, casual: casualScore, technical: technicalScore, emotional: emotionalScore };
    const maxScore = Math.max(...Object.values(scores));
    
    if (maxScore === 0) return 'casual'; // domyślny
    
    return Object.keys(scores).find(key => scores[key as keyof typeof scores] === maxScore) as InteractionPattern['communicationStyle'];
  }, []);

  // Ekstrakcja wskaźników osobowości
  const extractPersonalityIndicators = useCallback(async (
    content: string,
    interactionType: string
  ): Promise<PersonalityIndicator[]> => {
    const indicators: PersonalityIndicator[] = [];
    const lowerContent = content.toLowerCase();

    // Analiza otwartości
    const opennessKeywords = ['nowy', 'innowacyjny', 'kreatywny', 'eksperyment', 'ciekawy'];
    const opennessScore = opennessKeywords.filter(word => lowerContent.includes(word)).length;
    if (opennessScore > 0) {
      indicators.push({
        trait: 'openness',
        value: Math.min(10, opennessScore * 3),
        confidence: 70,
        source: 'linguistic_analysis',
        reasoning: `Użycie słów związanych z otwartością: ${opennessKeywords.filter(w => lowerContent.includes(w)).join(', ')}`
      });
    }

    // Analiza sumienności
    const conscientiousnessKeywords = ['plan', 'organizacja', 'systematyczny', 'dokładny', 'terminowo'];
    const conscientiousnessScore = conscientiousnessKeywords.filter(word => lowerContent.includes(word)).length;
    if (conscientiousnessScore > 0) {
      indicators.push({
        trait: 'conscientiousness',
        value: Math.min(10, conscientiousnessScore * 3),
        confidence: 75,
        source: 'behavioral_analysis',
        reasoning: `Wskaźniki sumienności w komunikacji`
      });
    }

    // Analiza ekstrawersji
    const extraversionKeywords = ['spotkanie', 'grupa', 'ludzie', 'społeczny', 'razem'];
    const introversionKeywords = ['sam', 'cicho', 'spokój', 'prywatnie', 'indywidualnie'];
    const extraScore = extraversionKeywords.filter(word => lowerContent.includes(word)).length;
    const introScore = introversionKeywords.filter(word => lowerContent.includes(word)).length;
    
    if (extraScore > introScore) {
      indicators.push({
        trait: 'extraversion',
        value: Math.min(10, (extraScore - introScore) * 2),
        confidence: 65,
        source: 'social_preference',
        reasoning: 'Preferencje społeczne wskazują na ekstrawersję'
      });
    } else if (introScore > extraScore) {
      indicators.push({
        trait: 'extraversion',
        value: Math.max(-10, -(introScore - extraScore) * 2),
        confidence: 65,
        source: 'social_preference',
        reasoning: 'Preferencje społeczne wskazują na introwersję'
      });
    }

    // Analiza ugodowości
    const agreeablenessKeywords = ['zgadzam się', 'oczywiście', 'współpraca', 'pomocny', 'miły'];
    const disagreeableKeywords = ['nie zgadzam się', 'błąd', 'nieprawda', 'konkurencja', 'krytyka'];
    const agreeScore = agreeablenessKeywords.filter(word => lowerContent.includes(word)).length;
    const disagreeScore = disagreeableKeywords.filter(word => lowerContent.includes(word)).length;

    if (agreeScore > disagreeScore) {
      indicators.push({
        trait: 'agreeableness',
        value: Math.min(10, (agreeScore - disagreeScore) * 2),
        confidence: 70,
        source: 'communication_tone',
        reasoning: 'Ton komunikacji wskazuje na ugodowość'
      });
    }

    // Analiza neurotyczności
    const neuroticismKeywords = ['stres', 'zmartwienie', 'niepokój', 'problem', 'trudność'];
    const stabilityKeywords = ['spokój', 'relaks', 'pewność', 'stabilny', 'zrównoważony'];
    const neuroScore = neuroticismKeywords.filter(word => lowerContent.includes(word)).length;
    const stabilityScore = stabilityKeywords.filter(word => lowerContent.includes(word)).length;

    if (neuroScore > stabilityScore) {
      indicators.push({
        trait: 'neuroticism',
        value: Math.min(10, (neuroScore - stabilityScore) * 2),
        confidence: 60,
        source: 'emotional_indicators',
        reasoning: 'Wskaźniki emocjonalne sugerują wyższy poziom neurotyczności'
      });
    }

    return indicators;
  }, []);

  // Aktualizacja profilu osobowości
  const updatePersonalityProfile = useCallback(async () => {
    try {
      if (interactionPatterns.length < 5) {
        setDetectionProgress((interactionPatterns.length / 5) * 100);
        return; // Za mało danych
      }

      // Agregacja wskaźników z ostatnich interakcji
      const recentPatterns = interactionPatterns.slice(0, 50);
      const allIndicators = recentPatterns.flatMap(p => p.indicators);

      // Oblicz średnie wartości cech
      const traits: PersonalityTraits = {
        openness: calculateTraitScore(allIndicators, 'openness'),
        conscientiousness: calculateTraitScore(allIndicators, 'conscientiousness'),
        extraversion: calculateTraitScore(allIndicators, 'extraversion'),
        agreeableness: calculateTraitScore(allIndicators, 'agreeableness'),
        neuroticism: calculateTraitScore(allIndicators, 'neuroticism'),
      };

      // Określ typ osobowości
      const personalityType = detectPersonalityType(traits);
      
      // Oblicz pewność klasyfikacji
      const confidence = calculateClassificationConfidence(allIndicators, recentPatterns.length);

      // Analiza mocnych i słabych stron
      const strengthsWeaknesses = analyzeStrengthsWeaknesses(traits);

      const newProfile: PersonalityProfile = {
        id: personalityProfile?.id || Date.now().toString(),
        userId: 'current_user',
        traits,
        personalityType,
        confidence,
        lastUpdated: new Date(),
        interactionCount: interactionPatterns.length,
        detectionMethod: 'combined',
        strengthsWeaknesses,
      };

      setPersonalityProfile(newProfile);
      setDetectionProgress(Math.min(100, confidence));

      // Generuj wglądy
      await generatePersonalityInsights();

      // Zapisz refleksję o odkryciu
      if (!personalityProfile || personalityProfile.personalityType !== personalityType) {
        await logSelfAwarenessReflection(
          `Odkryłam nowe aspekty osobowości użytkownika: ${personalityType}. To pomoże mi lepiej dostosować nasze interakcje.`,
          'personality_discovery',
          confidence
        );
      }

      await savePersonalityData();
      
      console.log(`🎭 Zaktualizowano profil osobowości: ${personalityType} (${confidence}% pewności)`);
    } catch (error) {
      console.error('❌ Błąd aktualizacji profilu osobowości:', error);
    }
  }, [interactionPatterns, personalityProfile]);

  // Obliczanie wyniku cechy
  const calculateTraitScore = (indicators: PersonalityIndicator[], trait: keyof PersonalityTraits): number => {
    const traitIndicators = indicators.filter(i => i.trait === trait);
    if (traitIndicators.length === 0) return 50; // neutralna wartość

    const weightedSum = traitIndicators.reduce((sum, indicator) => {
      const weight = indicator.confidence / 100;
      return sum + (indicator.value * weight);
    }, 0);

    const totalWeight = traitIndicators.reduce((sum, indicator) => sum + (indicator.confidence / 100), 0);
    const averageValue = weightedSum / totalWeight;

    // Konwersja z skali -10/+10 do 0-100
    return Math.max(0, Math.min(100, 50 + (averageValue * 5)));
  };

  // Detekcja typu osobowości
  const detectPersonalityType = useCallback((traits: PersonalityTraits): string => {
    // Uproszczona klasyfikacja Big Five
    const categories = [];

    if (traits.extraversion > 60) categories.push('Ekstrawertyczny');
    else categories.push('Introwertyczny');

    if (traits.openness > 60) categories.push('Otwarty');
    else categories.push('Konwencjonalny');

    if (traits.conscientiousness > 60) categories.push('Sumienny');
    else categories.push('Spontaniczny');

    if (traits.agreeableness > 60) categories.push('Ugodowy');
    else categories.push('Konkurencyjny');

    if (traits.neuroticism < 40) categories.push('Stabilny');
    else categories.push('Wrażliwy');

    return categories.join(', ');
  }, []);

  // Obliczanie pewności klasyfikacji
  const calculateClassificationConfidence = (indicators: PersonalityIndicator[], interactionCount: number): number => {
    if (indicators.length === 0) return 0;

    const avgConfidence = indicators.reduce((sum, i) => sum + i.confidence, 0) / indicators.length;
    const dataQuality = Math.min(100, (interactionCount / 20) * 100); // 20 interakcji = 100% jakości danych
    
    return Math.round((avgConfidence + dataQuality) / 2);
  };

  // Analiza mocnych i słabych stron
  const analyzeStrengthsWeaknesses = (traits: PersonalityTraits) => {
    const strengths = [];
    const weaknesses = [];
    const preferences = [];

    if (traits.openness > 70) {
      strengths.push('Kreatywność', 'Otwartość na nowe doświadczenia');
      preferences.push('Innowacyjne rozwiązania', 'Różnorodne tematy');
    } else if (traits.openness < 30) {
      strengths.push('Praktyczność', 'Tradycyjne podejście');
      weaknesses.push('Opór wobec zmian');
    }

    if (traits.conscientiousness > 70) {
      strengths.push('Organizacja', 'Niezawodność');
      preferences.push('Strukturalne podejście', 'Jasne plany');
    } else if (traits.conscientiousness < 30) {
      weaknesses.push('Brak systematyczności');
      preferences.push('Elastyczność', 'Spontaniczność');
    }

    if (traits.extraversion > 70) {
      strengths.push('Komunikatywność', 'Energia społeczna');
      preferences.push('Interakcje grupowe', 'Aktywne dyskusje');
    } else if (traits.extraversion < 30) {
      strengths.push('Refleksyjność', 'Głęboka analiza');
      preferences.push('Spokojne rozmowy', 'Czas na przemyślenia');
    }

    if (traits.agreeableness > 70) {
      strengths.push('Empatia', 'Współpraca');
      preferences.push('Harmonijne relacje', 'Wzajemne wsparcie');
    }

    if (traits.neuroticism < 30) {
      strengths.push('Stabilność emocjonalna', 'Odporność na stres');
    } else if (traits.neuroticism > 70) {
      weaknesses.push('Wrażliwość na stres');
      preferences.push('Spokojne środowisko', 'Wsparcie emocjonalne');
    }

    return { strengths, weaknesses, preferences };
  };

  // Pomocnicze funkcje analizy
  const calculateComplexity = (content: string): number => {
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(' ').length;
    const avgWordsPerSentence = words / sentences;
    
    return Math.min(100, (avgWordsPerSentence / 20) * 100);
  };

  const analyzeEmotionalTone = async (content: string): Promise<string> => {
    const lowerContent = content.toLowerCase();
    
    const positiveWords = ['dobrze', 'świetnie', 'super', 'miło', 'radość'];
    const negativeWords = ['źle', 'problem', 'trudność', 'smutek', 'złość'];
    const neutralWords = ['myślę', 'uważam', 'wydaje się', 'prawdopodobnie'];

    const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;
    const neutralCount = neutralWords.filter(word => lowerContent.includes(word)).length;

    if (positiveCount > negativeCount && positiveCount > neutralCount) return 'pozytywny';
    if (negativeCount > positiveCount && negativeCount > neutralCount) return 'negatywny';
    return 'neutralny';
  };

  const categorizeContent = (content: string): string => {
    const lowerContent = content.toLowerCase();
    
    const categories = {
      technology: ['technologia', 'komputer', 'program', 'kod', 'system'],
      personal: ['ja', 'moje', 'czuję', 'myślę', 'życie'],
      work: ['praca', 'projekt', 'zadanie', 'spotkanie', 'deadline'],
      hobby: ['hobby', 'pasja', 'sport', 'muzyka', 'gra'],
      general: ['ogólnie', 'generalnie', 'w sumie', 'właściwie']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        return category;
      }
    }

    return 'other';
  };

  // Generowanie wglądów osobowościowych
  const generatePersonalityInsights = useCallback(async (): Promise<PersonalityInsight[]> => {
    if (!personalityProfile) return [];

    const insights: PersonalityInsight[] = [];
    const { traits } = personalityProfile;

    // Insight o stylu komunikacji
    const communicationStyles = interactionPatterns.slice(0, 20).map(p => p.communicationStyle);
    const dominantStyle = getMostFrequent(communicationStyles);
    
    insights.push({
      id: Date.now().toString(),
      timestamp: new Date(),
      insight: `Użytkownik preferuje ${dominantStyle} styl komunikacji`,
      category: 'communication',
      confidence: 80,
      supporting_evidence: [`Dominujący styl w ${communicationStyles.length} ostatnich interakcjach`],
      implications: [`Dostosować odpowiedzi do stylu ${dominantStyle}`]
    });

    // Insight o preferencjach uczenia się
    if (traits.openness > 70) {
      insights.push({
        id: (Date.now() + 1).toString(),
        timestamp: new Date(),
        insight: 'Użytkownik ma wysoką otwartość - preferuje różnorodne i innowacyjne podejścia',
        category: 'learning_style',
        confidence: traits.openness,
        supporting_evidence: ['Wysoki wynik otwartości na doświadczenia'],
        implications: ['Oferować kreatywne rozwiązania', 'Prezentować różne perspektywy']
      });
    }

    setPersonalityInsights(insights);
    return insights;
  }, [personalityProfile, interactionPatterns]);

  // Pomocnicza funkcja do znajdowania najczęstszego elementu
  const getMostFrequent = <T,>(array: T[]): T => {
    const frequency: { [key: string]: number } = {};
    array.forEach(item => {
      const key = String(item);
      frequency[key] = (frequency[key] || 0) + 1;
    });
    
    return array.find(item => 
      frequency[String(item)] === Math.max(...Object.values(frequency))
    ) || array[0];
  };

  // Adaptacja wiadomości do osobowości
  const adaptToPersonality = useCallback(async (message: string): Promise<string> => {
    if (!personalityProfile) return message;

    const { traits } = personalityProfile;
    let adaptedMessage = message;

    // Dostosowanie do ekstrawersji/introwersji
    if (traits.extraversion > 70) {
      adaptedMessage = adaptedMessage.replace(/\.$/, '! 🎉');
    } else if (traits.extraversion < 30) {
      adaptedMessage = adaptedMessage.replace(/!+/g, '.').toLowerCase();
    }

    // Dostosowanie do otwartości
    if (traits.openness > 70) {
      adaptedMessage += ' Może spróbujemy czegoś nowego?';
    }

    // Dostosowanie do ugodowości
    if (traits.agreeableness > 70) {
      adaptedMessage = 'Rozumiem Twój punkt widzenia. ' + adaptedMessage;
    }

    return adaptedMessage;
  }, [personalityProfile]);

  // Funkcje opisu i rekomendacji
  const getPersonalityDescription = useCallback((): string => {
    if (!personalityProfile) return 'Profil osobowości w trakcie analizy...';

    const { traits, personalityType, confidence } = personalityProfile;
    
    return `
Typ osobowości: ${personalityType}
Pewność: ${confidence}%

Cechy główne:
• Otwartość: ${traits.openness}%
• Sumienność: ${traits.conscientiousness}%  
• Ekstrawersja: ${traits.extraversion}%
• Ugodowość: ${traits.agreeableness}%
• Neurotyczność: ${traits.neuroticism}%

Mocne strony: ${personalityProfile.strengthsWeaknesses.strengths.join(', ')}
Preferencje: ${personalityProfile.strengthsWeaknesses.preferences.join(', ')}
    `.trim();
  }, [personalityProfile]);

  const getPersonalityRecommendations = useCallback((): string[] => {
    if (!personalityProfile) return ['Zbieranie danych o osobowości...'];

    const { traits } = personalityProfile;
    const recommendations = [];

    if (traits.extraversion > 70) {
      recommendations.push('Angażuj w aktywne dyskusje');
      recommendations.push('Oferuj interaktywne doświadczenia');
    } else {
      recommendations.push('Daj czas na przemyślenia');
      recommendations.push('Unikaj przytłaczania informacjami');
    }

    if (traits.openness > 70) {
      recommendations.push('Prezentuj innowacyjne rozwiązania');
      recommendations.push('Eksploruj różne tematy');
    } else {
      recommendations.push('Trzymaj się sprawdzonych metod');
      recommendations.push('Wyjaśniaj korzyści zmian');
    }

    if (traits.conscientiousness > 70) {
      recommendations.push('Dostarczaj strukturalne informacje');
      recommendations.push('Ustalaj jasne cele i terminy');
    }

    return recommendations;
  }, [personalityProfile]);

  // Zarządzanie danymi
  const savePersonalityData = useCallback(async () => {
    try {
      const data = {
        personalityProfile,
        interactionPatterns: interactionPatterns.slice(0, 100), // Ograniczenie
        personalityInsights: personalityInsights.slice(0, 50),
        detectionProgress,
      };
      
      await AsyncStorage.setItem('wera_personality_data', JSON.stringify(data));
    } catch (error) {
      console.error('❌ Błąd zapisu danych osobowości:', error);
    }
  }, [personalityProfile, interactionPatterns, personalityInsights, detectionProgress]);

  const loadPersonalityData = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem('wera_personality_data');
      if (data) {
        const parsed = JSON.parse(data);
        setPersonalityProfile(parsed.personalityProfile);
        setInteractionPatterns(parsed.interactionPatterns || []);
        setPersonalityInsights(parsed.personalityInsights || []);
        setDetectionProgress(parsed.detectionProgress || 0);
      }
    } catch (error) {
      console.error('❌ Błąd ładowania danych osobowości:', error);
    }
  }, []);

  const resetPersonalityData = useCallback(async () => {
    setPersonalityProfile(null);
    setInteractionPatterns([]);
    setPersonalityInsights([]);
    setDetectionProgress(0);
    
    try {
      await AsyncStorage.removeItem('wera_personality_data');
    } catch (error) {
      console.error('❌ Błąd resetowania danych osobowości:', error);
    }
  }, []);

  const value: PersonalityDetectionContextType = {
    personalityProfile,
    interactionPatterns,
    personalityInsights,
    detectionProgress,
    analyzeInteraction,
    updatePersonalityProfile,
    detectPersonalityType,
    analyzeCommunicationStyle,
    extractPersonalityIndicators,
    generatePersonalityInsights,
    getPersonalityDescription,
    getPersonalityRecommendations,
    adaptToPersonality,
    savePersonalityData,
    loadPersonalityData,
    resetPersonalityData,
  };

  return (
    <PersonalityDetectionContext.Provider value={value}>
      {children}
    </PersonalityDetectionContext.Provider>
  );
};

export const usePersonalityDetection = () => {
  const context = useContext(PersonalityDetectionContext);
  if (!context) {
    throw new Error('usePersonalityDetection must be used within PersonalityDetectionProvider');
  }
  return context;
};