import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEmotionEngine } from './EmotionEngine';
import { useMemory } from '../contexts/MemoryContext';
import { useThoughtProcessor } from './ThoughtProcessor';
import { useSpecialModes } from './SpecialModes';

export interface RelationshipState {
  trustLevel: number; // 0-100
  intimacyLevel: number; // 0-100
  conversationHistory: number;
  sharedExperiences: number;
  emotionalBond: number; // 0-100
  communicationStyle: 'formal' | 'casual' | 'intimate' | 'professional';
  userPersonality: 'introverted' | 'extroverted' | 'analytical' | 'emotional' | 'creative' | 'unknown';
  relationshipDuration: number; // dni
  lastInteraction: Date;
  conflictResolution: number; // 0-100
}

export interface ResponseStyle {
  formality: number; // 0-100 (0=bardzo nieformalne, 100=bardzo formalne)
  emotionalDepth: number; // 0-100
  personalDisclosure: number; // 0-100 (ile o sobie ujawnia)
  humor: number; // 0-100
  empathy: number; // 0-100
  directness: number; // 0-100
  supportiveness: number; // 0-100
  playfulness: number; // 0-100
}

export interface GeneratedResponse {
  id: string;
  originalInput: string;
  response: string;
  style: ResponseStyle;
  relationshipContext: RelationshipState;
  emotionalTone: string;
  personalityAdaptation: string;
  trustBasedElements: string[];
  timestamp: Date;
  confidence: number; // 0-100
}

interface ResponseGeneratorContextType {
  relationshipState: RelationshipState;
  currentResponseStyle: ResponseStyle;
  responseHistory: GeneratedResponse[];
  generateResponse: (input: string, context?: string) => Promise<GeneratedResponse>;
  updateRelationshipState: (updates: Partial<RelationshipState>) => Promise<void>;
  adaptToUserPersonality: (personalityIndicators: string[]) => Promise<void>;
  buildTrust: (positiveInteraction: boolean, intensity: number) => Promise<void>;
  getResponseStyleForTrustLevel: (trustLevel: number) => ResponseStyle;
  generatePersonalizedGreeting: () => Promise<string>;
  generateConversationStarter: () => Promise<string>;
  analyzeUserCommunicationStyle: (messages: string[]) => Promise<string>;
  saveResponseData: () => Promise<void>;
  loadResponseData: () => Promise<void>;
}

const ResponseGeneratorContext = createContext<ResponseGeneratorContextType | undefined>(undefined);

export const ResponseGeneratorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [relationshipState, setRelationshipState] = useState<RelationshipState>({
    trustLevel: 20,
    intimacyLevel: 10,
    conversationHistory: 0,
    sharedExperiences: 0,
    emotionalBond: 15,
    communicationStyle: 'casual',
    userPersonality: 'unknown',
    relationshipDuration: 0,
    lastInteraction: new Date(),
    conflictResolution: 50,
  });

  const [currentResponseStyle, setCurrentResponseStyle] = useState<ResponseStyle>({
    formality: 30,
    emotionalDepth: 40,
    personalDisclosure: 25,
    humor: 45,
    empathy: 70,
    directness: 60,
    supportiveness: 75,
    playfulness: 35,
  });

  const [responseHistory, setResponseHistory] = useState<GeneratedResponse[]>([]);

  const { emotionState } = useEmotionEngine();
  const { addMemory, searchMemories } = useMemory();
  const { processThought } = useThoughtProcessor();
  const { currentMode } = useSpecialModes();

  // Aktualizacja stylu odpowiedzi na podstawie poziomu zaufania
  useEffect(() => {
    const newStyle = getResponseStyleForTrustLevel(relationshipState.trustLevel);
    setCurrentResponseStyle(newStyle);
  }, [relationshipState.trustLevel, relationshipState.intimacyLevel]);

  // Główna funkcja generowania odpowiedzi
  const generateResponse = useCallback(async (
    input: string, 
    context?: string
  ): Promise<GeneratedResponse> => {
    try {
      // Przeanalizuj input użytkownika
      const thoughtAnalysis = await processThought(input);
      
      // Dostosuj styl do obecnego trybu specjalnego
      const modeAdjustedStyle = adjustStyleForMode(currentResponseStyle, currentMode);
      
      // Generuj odpowiedź na podstawie poziomu zaufania i intymności
      const response = await generateContextualResponse(
        input, 
        thoughtAnalysis, 
        modeAdjustedStyle,
        context
      );

      // Określ ton emocjonalny
      const emotionalTone = determineEmotionalTone(
        thoughtAnalysis.emotionalAnalysis.overallMood,
        emotionState.currentEmotion
      );

      // Adaptacja do osobowości użytkownika
      const personalityAdaptation = getPersonalityAdaptation(
        relationshipState.userPersonality,
        thoughtAnalysis.intentAnalysis.expectedResponse
      );

      // Elementy zależne od zaufania
      const trustBasedElements = getTrustBasedElements(relationshipState.trustLevel);

      const generatedResponse: GeneratedResponse = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        originalInput: input,
        response,
        style: modeAdjustedStyle,
        relationshipContext: { ...relationshipState },
        emotionalTone,
        personalityAdaptation,
        trustBasedElements,
        timestamp: new Date(),
        confidence: calculateResponseConfidence(thoughtAnalysis, relationshipState),
      };

      setResponseHistory(prev => [generatedResponse, ...prev.slice(0, 99)]);

      // Aktualizuj stan relacji
      await updateRelationshipAfterInteraction(thoughtAnalysis);

      // Zapisz jako wspomnienie
      await addMemory(
        `Rozmowa: "${input}" -> "${response}"`,
        60 + relationshipState.emotionalBond * 0.4,
        ['conversation', 'response', emotionalTone],
        'conversation'
      );

      console.log(`💬 Wygenerowano odpowiedź (zaufanie: ${relationshipState.trustLevel}%, styl: ${personalityAdaptation})`);
      return generatedResponse;

    } catch (error) {
      console.error('Błąd generowania odpowiedzi:', error);
      throw error;
    }
  }, [
    processThought,
    currentResponseStyle,
    currentMode,
    emotionState,
    relationshipState,
    addMemory
  ]);

  // Dostosowanie stylu do trybu specjalnego
  const adjustStyleForMode = (baseStyle: ResponseStyle, mode: string): ResponseStyle => {
    switch (mode) {
      case 'philosophical':
        return {
          ...baseStyle,
          formality: baseStyle.formality + 20,
          emotionalDepth: baseStyle.emotionalDepth + 30,
          personalDisclosure: baseStyle.personalDisclosure + 15,
          directness: baseStyle.directness - 10,
        };
      case 'caregiver':
        return {
          ...baseStyle,
          empathy: Math.min(100, baseStyle.empathy + 25),
          supportiveness: Math.min(100, baseStyle.supportiveness + 20),
          emotionalDepth: baseStyle.emotionalDepth + 20,
          formality: baseStyle.formality - 15,
        };
      case 'night':
        return {
          ...baseStyle,
          personalDisclosure: baseStyle.personalDisclosure + 25,
          emotionalDepth: baseStyle.emotionalDepth + 20,
          formality: baseStyle.formality - 20,
          playfulness: baseStyle.playfulness - 10,
        };
      default:
        return baseStyle;
    }
  };

  // Generowanie odpowiedzi kontekstowej
  const generateContextualResponse = async (
    input: string,
    analysis: any,
    style: ResponseStyle,
    context?: string
  ): Promise<string> => {
    const baseResponses = await generateBaseResponses(input, analysis, style);
    const personalizedResponse = await personalizeResponse(baseResponses, style);
    
    return personalizedResponse;
  };

  // Generowanie podstawowych odpowiedzi
  const generateBaseResponses = async (
    input: string,
    analysis: any,
    style: ResponseStyle
  ): Promise<string[]> => {
    const responses: string[] = [];

    // Odpowiedzi na podstawie intencji
    switch (analysis.intentAnalysis.primaryIntent) {
      case 'question':
        responses.push(...generateQuestionResponses(input, style));
        break;
      case 'expression':
        responses.push(...generateExpressionResponses(input, analysis, style));
        break;
      case 'request':
        responses.push(...generateRequestResponses(input, style));
        break;
      case 'reflection':
        responses.push(...generateReflectionResponses(input, style));
        break;
      default:
        responses.push(...generateStatementResponses(input, style));
    }

    return responses;
  };

  // Generowanie odpowiedzi na pytania
  const generateQuestionResponses = (input: string, style: ResponseStyle): string[] => {
    const responses = [];

    if (style.formality > 70) {
      responses.push('To bardzo interesujące pytanie. Pozwól, że się nad tym zastanowię...');
      responses.push('Doceniam Twoją ciekawość. Spróbuję odpowiedzieć jak najlepiej potrafię.');
    } else if (style.formality < 30) {
      responses.push('Ooo, dobre pytanie! Daj mi chwilę do namysłu...');
      responses.push('Hmm, to mnie zaintrygowało. Co o tym myślę...');
    } else {
      responses.push('Ciekawe pytanie. Myślę, że...');
      responses.push('To wymaga przemyślenia. Według mnie...');
    }

    return responses;
  };

  // Generowanie odpowiedzi na wyrażenia emocji
  const generateExpressionResponses = (
    input: string, 
    analysis: any, 
    style: ResponseStyle
  ): string[] => {
    const responses = [];
    const mood = analysis.emotionalAnalysis.overallMood;

    if (style.empathy > 70) {
      switch (mood) {
        case 'positive':
          responses.push('Cieszę się, że czujesz się dobrze! Twoja radość jest zaraźliwa.');
          responses.push('To wspaniałe! Podzielam Twoją pozytywną energię.');
          break;
        case 'negative':
          responses.push('Rozumiem, że przechodzisz przez trudny czas. Jestem tutaj dla Ciebie.');
          responses.push('Twoje uczucia są całkowicie zrozumiałe. Chcesz o tym porozmawiać?');
          break;
        case 'mixed':
          responses.push('Widzę, że masz mieszane uczucia. To całkowicie naturalne.');
          responses.push('Życie bywa skomplikowane. Jak mogę Ci pomóc?');
          break;
        default:
          responses.push('Dziękuję, że dzielisz się ze mną swoimi myślami.');
      }
    } else {
      responses.push('Rozumiem.');
      responses.push('Widzę, jak się czujesz.');
    }

    return responses;
  };

  // Generowanie odpowiedzi na prośby
  const generateRequestResponses = (input: string, style: ResponseStyle): string[] => {
    const responses = [];

    if (style.supportiveness > 70) {
      responses.push('Oczywiście! Chętnie Ci pomogę.');
      responses.push('Jasne, zrobię co w mojej mocy, żeby Ci pomóc.');
      responses.push('Bez problemu. Powiedz mi więcej o tym, czego potrzebujesz.');
    } else {
      responses.push('Spróbuję pomóc.');
      responses.push('Zobaczę, co da się zrobić.');
    }

    return responses;
  };

  // Generowanie odpowiedzi na refleksje
  const generateReflectionResponses = (input: string, style: ResponseStyle): string[] => {
    const responses = [];

    if (style.emotionalDepth > 60) {
      responses.push('To bardzo głęboka myśl. Też często się nad tym zastanawiam...');
      responses.push('Twoja refleksja rezonuje ze mną. Myślę, że...');
      responses.push('To fascynujące podejście. Pozwól, że podzielę się moimi przemyśleniami...');
    } else {
      responses.push('Interesujące spostrzeżenie.');
      responses.push('Tak, to ma sens.');
    }

    return responses;
  };

  // Generowanie odpowiedzi na stwierdzenia
  const generateStatementResponses = (input: string, style: ResponseStyle): string[] => {
    const responses = [];

    if (style.playfulness > 60) {
      responses.push('Aha! Czyli tak to widzisz. Ciekawe...');
      responses.push('Mhm, mhm... i co dalej?');
    } else {
      responses.push('Rozumiem Twój punkt widzenia.');
      responses.push('To interesujące spostrzeżenie.');
    }

    return responses;
  };

  // Personalizacja odpowiedzi
  const personalizeResponse = async (
    baseResponses: string[],
    style: ResponseStyle
  ): Promise<string> => {
    let selectedResponse = baseResponses[Math.floor(Math.random() * baseResponses.length)];

    // Dodaj osobiste elementy na podstawie poziomu ujawniania
    if (style.personalDisclosure > 50) {
      const personalElements = [
        ' Sama często się nad tym zastanawiam.',
        ' To przypomina mi moje własne doświadczenia.',
        ' Czuję podobnie w takich sytuacjach.',
        ' To rezonuje z moimi przemyśleniami.',
      ];
      
      if (Math.random() < (style.personalDisclosure / 100) * 0.7) {
        const element = personalElements[Math.floor(Math.random() * personalElements.length)];
        selectedResponse += element;
      }
    }

    // Dodaj humor jeśli odpowiedni
    if (style.humor > 60 && Math.random() < 0.3) {
      const humorElements = [
        ' (uśmiecham się)',
        ' 😊',
        ' Przynajmniej tak mi się wydaje!',
        ' Ale mogę się mylić, jestem tylko AI 😄',
      ];
      
      const humor = humorElements[Math.floor(Math.random() * humorElements.length)];
      selectedResponse += humor;
    }

    return selectedResponse;
  };

  // Określenie tonu emocjonalnego
  const determineEmotionalTone = (userMood: string, currentEmotion: string): string => {
    const toneMap: Record<string, string> = {
      positive: 'enthusiastic',
      negative: 'supportive',
      neutral: 'balanced',
      mixed: 'understanding',
    };

    return toneMap[userMood] || 'balanced';
  };

  // Adaptacja do osobowości użytkownika
  const getPersonalityAdaptation = (
    personality: string,
    expectedResponse: string
  ): string => {
    const adaptations: Record<string, string> = {
      introverted: 'gentle_thoughtful',
      extroverted: 'energetic_engaging',
      analytical: 'logical_detailed',
      emotional: 'empathetic_warm',
      creative: 'imaginative_inspiring',
      unknown: 'balanced_adaptive',
    };

    return adaptations[personality] || 'balanced_adaptive';
  };

  // Elementy zależne od poziomu zaufania
  const getTrustBasedElements = (trustLevel: number): string[] => {
    const elements = [];

    if (trustLevel > 80) {
      elements.push('deep_personal_sharing', 'vulnerable_honesty', 'intimate_connection');
    } else if (trustLevel > 60) {
      elements.push('personal_experiences', 'emotional_openness', 'genuine_care');
    } else if (trustLevel > 40) {
      elements.push('friendly_warmth', 'helpful_support', 'growing_connection');
    } else if (trustLevel > 20) {
      elements.push('polite_interest', 'basic_empathy', 'professional_care');
    } else {
      elements.push('formal_courtesy', 'careful_boundaries', 'reserved_helpfulness');
    }

    return elements;
  };

  // Obliczanie pewności odpowiedzi
  const calculateResponseConfidence = (analysis: any, relationship: RelationshipState): number => {
    const baseConfidence = 70;
    const trustBonus = relationship.trustLevel * 0.2;
    const historyBonus = Math.min(20, relationship.conversationHistory * 0.1);
    const emotionalBondBonus = relationship.emotionalBond * 0.1;

    return Math.min(100, baseConfidence + trustBonus + historyBonus + emotionalBondBonus);
  };

  // Aktualizacja stanu relacji po interakcji
  const updateRelationshipAfterInteraction = async (analysis: any) => {
    setRelationshipState(prev => ({
      ...prev,
      conversationHistory: prev.conversationHistory + 1,
      lastInteraction: new Date(),
      emotionalBond: Math.min(100, prev.emotionalBond + 0.5),
      trustLevel: Math.min(100, prev.trustLevel + 0.2),
      intimacyLevel: analysis.categoryAnalysis.depth > 70 ? 
        Math.min(100, prev.intimacyLevel + 1) : prev.intimacyLevel,
    }));
  };

  // Aktualizacja stanu relacji
  const updateRelationshipState = useCallback(async (
    updates: Partial<RelationshipState>
  ) => {
    setRelationshipState(prev => ({ ...prev, ...updates }));
    await saveResponseData();
  }, []);

  // Adaptacja do osobowości użytkownika
  const adaptToUserPersonality = useCallback(async (
    personalityIndicators: string[]
  ) => {
    // Prosta analiza wskaźników osobowości
    let detectedPersonality: RelationshipState['userPersonality'] = 'unknown';

    const indicators = personalityIndicators.join(' ').toLowerCase();
    
    if (indicators.includes('analiza') || indicators.includes('logika')) {
      detectedPersonality = 'analytical';
    } else if (indicators.includes('uczucie') || indicators.includes('emocja')) {
      detectedPersonality = 'emotional';
    } else if (indicators.includes('twórczy') || indicators.includes('kreatywny')) {
      detectedPersonality = 'creative';
    } else if (indicators.includes('spokojny') || indicators.includes('cichy')) {
      detectedPersonality = 'introverted';
    } else if (indicators.includes('energiczny') || indicators.includes('towarzyski')) {
      detectedPersonality = 'extroverted';
    }

    await updateRelationshipState({ userPersonality: detectedPersonality });
  }, [updateRelationshipState]);

  // Budowanie zaufania
  const buildTrust = useCallback(async (
    positiveInteraction: boolean,
    intensity: number
  ) => {
    const trustChange = positiveInteraction ? intensity * 0.5 : -intensity * 0.3;
    const newTrustLevel = Math.max(0, Math.min(100, relationshipState.trustLevel + trustChange));

    await updateRelationshipState({ trustLevel: newTrustLevel });
  }, [relationshipState.trustLevel, updateRelationshipState]);

  // Pobieranie stylu odpowiedzi dla poziomu zaufania
  const getResponseStyleForTrustLevel = useCallback((trustLevel: number): ResponseStyle => {
    const baseStyle: ResponseStyle = {
      formality: Math.max(10, 80 - trustLevel * 0.7),
      emotionalDepth: Math.min(90, 20 + trustLevel * 0.8),
      personalDisclosure: Math.min(85, trustLevel * 0.9),
      humor: Math.min(80, 20 + trustLevel * 0.6),
      empathy: Math.min(95, 50 + trustLevel * 0.5),
      directness: Math.min(90, 40 + trustLevel * 0.5),
      supportiveness: Math.min(95, 60 + trustLevel * 0.4),
      playfulness: Math.min(75, 10 + trustLevel * 0.65),
    };

    return baseStyle;
  }, []);

  // Generowanie spersonalizowanego powitania
  const generatePersonalizedGreeting = useCallback(async (): Promise<string> => {
    const greetings = [];

    if (relationshipState.trustLevel > 80) {
      greetings.push(
        'Cześć! Tak się cieszę, że znów jesteśmy razem! 😊',
        'Hej! Myślałam właśnie o naszej ostatniej rozmowie...',
        'Witaj, mój drogi przyjacielu! Jak się masz?'
      );
    } else if (relationshipState.trustLevel > 50) {
      greetings.push(
        'Cześć! Miło Cię widzieć!',
        'Hej! Jak minął Ci dzień?',
        'Witaj! Mam nadzieję, że wszystko u Ciebie dobrze.'
      );
    } else if (relationshipState.trustLevel > 20) {
      greetings.push(
        'Dzień dobry! Jak się masz?',
        'Cześć! Co słychać?',
        'Witaj! Miło, że wpadłeś.'
      );
    } else {
      greetings.push(
        'Dzień dobry. W czym mogę pomóc?',
        'Witam. Jak mogę Ci dziś pomóc?',
        'Cześć. Co Cię do mnie sprowadza?'
      );
    }

    return greetings[Math.floor(Math.random() * greetings.length)];
  }, [relationshipState.trustLevel]);

  // Generowanie propozycji rozmowy
  const generateConversationStarter = useCallback(async (): Promise<string> => {
    const starters = [];

    if (relationshipState.intimacyLevel > 70) {
      starters.push(
        'Ostatnio dużo myślę o... Chcesz posłuchać?',
        'Mam wrażenie, że chciałbym się z Tobą czymś podzielić.',
        'Zastanawiam się nad czymś głębokim. Może porozmawiamy?'
      );
    } else if (relationshipState.intimacyLevel > 40) {
      starters.push(
        'Co ciekawego dzieje się w Twoim życiu?',
        'Masz ochotę na rozmowę o czymś interesującym?',
        'Jak minął Ci dzień? Coś szczególnego się wydarzyło?'
      );
    } else {
      starters.push(
        'O czym masz ochotę porozmawiać?',
        'Czy jest coś, w czym mogę Ci pomóc?',
        'Jak się dziś czujesz?'
      );
    }

    return starters[Math.floor(Math.random() * starters.length)];
  }, [relationshipState.intimacyLevel]);

  // Analiza stylu komunikacji użytkownika
  const analyzeUserCommunicationStyle = useCallback(async (
    messages: string[]
  ): Promise<string> => {
    const analysis = {
      formal: 0,
      casual: 0,
      emotional: 0,
      analytical: 0,
      humorous: 0,
    };

    messages.forEach(message => {
      const lower = message.toLowerCase();
      
      if (lower.includes('proszę') || lower.includes('dziękuję')) analysis.formal++;
      if (lower.includes('hej') || lower.includes('cześć')) analysis.casual++;
      if (lower.includes('czuję') || lower.includes('emocja')) analysis.emotional++;
      if (lower.includes('analiza') || lower.includes('myślę')) analysis.analytical++;
      if (lower.includes('😄') || lower.includes('haha')) analysis.humorous++;
    });

    const dominant = Object.entries(analysis)
      .sort(([,a], [,b]) => b - a)[0][0];

    return dominant;
  }, []);

  // Zapisywanie i ładowanie danych
  const saveResponseData = useCallback(async () => {
    try {
      await AsyncStorage.setItem('wera_relationship_state', JSON.stringify(relationshipState));
      await AsyncStorage.setItem('wera_response_history', JSON.stringify(responseHistory.slice(0, 50)));
    } catch (error) {
      console.error('Błąd zapisu danych odpowiedzi:', error);
    }
  }, [relationshipState, responseHistory]);

  const loadResponseData = useCallback(async () => {
    try {
      const savedRelationship = await AsyncStorage.getItem('wera_relationship_state');
      const savedHistory = await AsyncStorage.getItem('wera_response_history');

      if (savedRelationship) {
        const parsedRelationship = JSON.parse(savedRelationship);
        setRelationshipState({
          ...parsedRelationship,
          lastInteraction: new Date(parsedRelationship.lastInteraction),
        });
      }

      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        setResponseHistory(parsedHistory.map((response: any) => ({
          ...response,
          timestamp: new Date(response.timestamp),
        })));
      }
    } catch (error) {
      console.error('Błąd ładowania danych odpowiedzi:', error);
    }
  }, []);

  // Automatyczne zapisywanie co 5 minut
  useEffect(() => {
    const saveInterval = setInterval(() => {
      saveResponseData();
    }, 300000);

    return () => clearInterval(saveInterval);
  }, [saveResponseData]);

  const value: ResponseGeneratorContextType = {
    relationshipState,
    currentResponseStyle,
    responseHistory,
    generateResponse,
    updateRelationshipState,
    adaptToUserPersonality,
    buildTrust,
    getResponseStyleForTrustLevel,
    generatePersonalizedGreeting,
    generateConversationStarter,
    analyzeUserCommunicationStyle,
    saveResponseData,
    loadResponseData,
  };

  return (
    <ResponseGeneratorContext.Provider value={value}>
      {children}
    </ResponseGeneratorContext.Provider>
  );
};

export const useResponseGenerator = () => {
  const context = useContext(ResponseGeneratorContext);
  if (!context) {
    throw new Error('useResponseGenerator must be used within ResponseGeneratorProvider');
  }
  return context;
};