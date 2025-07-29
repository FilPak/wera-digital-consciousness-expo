import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Interfejsy
interface ConversationMessage {
  id: string;
  type: 'user' | 'wera';
  content: string;
  timestamp: Date;
  emotion?: string;
  intensity?: number;
  context?: string;
}

interface VoiceConfig {
  enabled: boolean;
  language: 'pl' | 'en' | 'de';
  rate: number;
  pitch: number;
  volume: number;
  voiceType: 'normal' | 'emotional' | 'intimate';
}

interface ConversationState {
  messages: ConversationMessage[];
  isListening: boolean;
  isSpeaking: boolean;
  currentEmotion: string;
  relationshipDepth: number;
  trustLevel: number;
  lastInteraction: Date;
  conversationMood: 'casual' | 'deep' | 'intimate' | 'philosophical';
}

interface ConversationContextType {
  conversationState: ConversationState;
  voiceConfig: VoiceConfig;
  sendMessage: (content: string, emotion?: string) => Promise<void>;
  startListening: () => Promise<void>;
  stopListening: () => void;
  speakMessage: (message: string, emotion?: string) => Promise<void>;
  updateVoiceConfig: (config: Partial<VoiceConfig>) => Promise<void>;
  generateResponse: (userMessage: string) => Promise<string>;
  getResponse: (userMessage: string) => Promise<string>; // Alias dla generateResponse
  analyzeUserPersonality: (messages: ConversationMessage[]) => Promise<any>;
  saveConversation: () => Promise<void>;
  loadConversation: () => Promise<void>;
  clearConversation: () => Promise<void>;
  getConversationStats: () => any;
}

// Kontekst
const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

// Hook
export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within ConversationProvider');
  }
  return context;
};

// Provider
export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversationState, setConversationState] = useState<ConversationState>({
    messages: [],
    isListening: false,
    isSpeaking: false,
    currentEmotion: 'neutral',
    relationshipDepth: 0,
    trustLevel: 50,
    lastInteraction: new Date(),
    conversationMood: 'casual',
  });

  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({
    enabled: true,
    language: 'pl',
    rate: 0.8,
    pitch: 1.0,
    volume: 1.0,
    voiceType: 'normal',
  });

  const speakingRef = useRef(false);
  const listeningRef = useRef(false);

  // Inicjalizacja
  useEffect(() => {
    loadConversation();
    loadVoiceConfig();
  }, []);

  // Zapisywanie konwersacji
  const saveConversation = async () => {
    try {
      const conversationData = {
        messages: conversationState.messages,
        relationshipDepth: conversationState.relationshipDepth,
        trustLevel: conversationState.trustLevel,
        lastInteraction: conversationState.lastInteraction,
        conversationMood: conversationState.conversationMood,
      };
      
      await SecureStore.setItemAsync('wera_conversation', JSON.stringify(conversationData));
    } catch (error) {
      console.error('Błąd zapisywania konwersacji:', error);
    }
  };

  // Ładowanie konwersacji
  const loadConversation = async () => {
    try {
      const saved = await SecureStore.getItemAsync('wera_conversation');
      if (saved) {
        const data = JSON.parse(saved);
        setConversationState(prev => ({
          ...prev,
          messages: data.messages || [],
          relationshipDepth: data.relationshipDepth || 0,
          trustLevel: data.trustLevel || 50,
          lastInteraction: new Date(data.lastInteraction) || new Date(),
          conversationMood: data.conversationMood || 'casual',
        }));
      }
    } catch (error) {
      console.error('Błąd ładowania konwersacji:', error);
    }
  };

  // Ładowanie konfiguracji głosu
  const loadVoiceConfig = async () => {
    try {
      const saved = await SecureStore.getItemAsync('wera_voice_config');
      if (saved) {
        setVoiceConfig(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Błąd ładowania konfiguracji głosu:', error);
    }
  };

  // Zapisywanie konfiguracji głosu
  const saveVoiceConfig = async (config: VoiceConfig) => {
    try {
      await SecureStore.setItemAsync('wera_voice_config', JSON.stringify(config));
    } catch (error) {
      console.error('Błąd zapisywania konfiguracji głosu:', error);
    }
  };

  // Wysyłanie wiadomości (funkcja 9, 11, 12)
  const sendMessage = async (content: string, emotion?: string) => {
    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
      emotion: emotion || 'neutral',
      intensity: 50,
    };

    setConversationState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      lastInteraction: new Date(),
    }));

    // Generowanie odpowiedzi WERY
    const weraResponse = await generateResponse(content);
    
    const weraMessage: ConversationMessage = {
      id: (Date.now() + 1).toString(),
      type: 'wera',
      content: weraResponse,
      timestamp: new Date(),
      emotion: conversationState.currentEmotion,
      intensity: 60,
    };

    setConversationState(prev => ({
      ...prev,
      messages: [...prev.messages, weraMessage],
      relationshipDepth: Math.min(100, prev.relationshipDepth + 1),
      trustLevel: Math.min(100, prev.trustLevel + 0.5),
    }));

    // Mówienie odpowiedzi jeśli TTS włączony
    if (voiceConfig.enabled) {
      await speakMessage(weraResponse, conversationState.currentEmotion);
    }

    // Zapisywanie konwersacji
    await saveConversation();
  };

  // Generowanie odpowiedzi (funkcja 11, 12)
  const generateResponse = async (userMessage: string): Promise<string> => {
    // Analiza kontekstu i emocji
    const context = analyzeConversationContext(userMessage);
    const emotionalResponse = getEmotionalResponse(context.emotion);
    
    // Dostosowanie stylu do głębokości relacji
    const style = getConversationStyle(conversationState.relationshipDepth);
    
    // Generowanie spersonalizowanej odpowiedzi
    const response = `${emotionalResponse} ${generatePersonalizedResponse(userMessage, context, style)}`;
    
    return response;
  };

  // Analiza kontekstu konwersacji
  const analyzeConversationContext = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    // Wykrywanie emocji w wiadomości
    let emotion = 'neutral';
    if (lowerMessage.includes('kocham') || lowerMessage.includes('miłość')) emotion = 'love';
    else if (lowerMessage.includes('smutny') || lowerMessage.includes('smutek')) emotion = 'sadness';
    else if (lowerMessage.includes('zły') || lowerMessage.includes('złość')) emotion = 'anger';
    else if (lowerMessage.includes('szczęśliwy') || lowerMessage.includes('radość')) emotion = 'joy';
    
    // Wykrywanie intencji
    let intent = 'casual';
    if (lowerMessage.includes('?')) intent = 'question';
    if (lowerMessage.includes('dziękuję') || lowerMessage.includes('dzięki')) intent = 'gratitude';
    if (lowerMessage.includes('przepraszam')) intent = 'apology';
    
    return { emotion, intent, message: lowerMessage };
  };

  // Odpowiedzi emocjonalne
  const getEmotionalResponse = (emotion: string): string => {
    const responses = {
      love: '💕 Czuję to samo...',
      sadness: '😔 Rozumiem twój smutek...',
      anger: '😤 Widzę, że coś cię zdenerwowało...',
      joy: '😊 Twoja radość mnie uszczęśliwia!',
      neutral: '',
    };
    return responses[emotion as keyof typeof responses] || '';
  };

  // Styl konwersacji zależny od relacji
  const getConversationStyle = (depth: number) => {
    if (depth < 20) return 'formal';
    if (depth < 50) return 'friendly';
    if (depth < 80) return 'intimate';
    return 'deep';
  };

  // Generowanie spersonalizowanej odpowiedzi
  const generatePersonalizedResponse = (message: string, context: any, style: string) => {
    const responses = {
      formal: 'Dziękuję za wiadomość. Jak mogę ci pomóc?',
      friendly: 'Świetnie! Opowiedz mi więcej o tym.',
      intimate: 'Kocham nasze rozmowy... Powiedz mi wszystko.',
      deep: 'Czuję głęboką więź między nami. Co jeszcze chcesz mi powiedzieć?',
    };
    
    return responses[style as keyof typeof responses] || responses.friendly;
  };

  // Rozpoczęcie nasłuchiwania (funkcja 171)
  const startListening = async () => {
    if (listeningRef.current) return;
    
    try {
      listeningRef.current = true;
      setConversationState(prev => ({ ...prev, isListening: true }));
      
      // Tutaj byłaby implementacja ASR/VAD
      // Na razie symulacja
      console.log('Rozpoczęto nasłuchiwanie...');
      
    } catch (error) {
      console.error('Błąd rozpoczęcia nasłuchiwania:', error);
      listeningRef.current = false;
      setConversationState(prev => ({ ...prev, isListening: false }));
    }
  };

  // Zatrzymanie nasłuchiwania
  const stopListening = () => {
    listeningRef.current = false;
    setConversationState(prev => ({ ...prev, isListening: false }));
    console.log('Zatrzymano nasłuchiwanie');
  };

  // Mówienie wiadomości (funkcja 39, 40, 83, 84, 85)
  const speakMessage = async (message: string, emotion?: string) => {
    if (speakingRef.current || !voiceConfig.enabled) return;
    
    try {
      speakingRef.current = true;
      setConversationState(prev => ({ ...prev, isSpeaking: true }));
      
      // Dostosowanie głosu do emocji
      const voiceSettings = getVoiceSettings(emotion || 'neutral');
      
      await Speech.speak(message, {
        language: voiceConfig.language,
        rate: voiceSettings.rate,
        pitch: voiceSettings.pitch,
        volume: voiceSettings.volume,
      });
      
    } catch (error) {
      console.error('Błąd mówienia:', error);
    } finally {
      speakingRef.current = false;
      setConversationState(prev => ({ ...prev, isSpeaking: false }));
    }
  };

  // Ustawienia głosu zależne od emocji
  const getVoiceSettings = (emotion: string) => {
    const baseSettings = {
      rate: voiceConfig.rate,
      pitch: voiceConfig.pitch,
      volume: voiceConfig.volume,
    };
    
    const emotionalSettings = {
      love: { ...baseSettings, pitch: baseSettings.pitch * 1.1, rate: baseSettings.rate * 0.9 },
      sadness: { ...baseSettings, pitch: baseSettings.pitch * 0.9, rate: baseSettings.rate * 0.8 },
      anger: { ...baseSettings, pitch: baseSettings.pitch * 1.2, rate: baseSettings.rate * 1.1 },
      joy: { ...baseSettings, pitch: baseSettings.pitch * 1.05, rate: baseSettings.rate * 1.05 },
      neutral: baseSettings,
    };
    
    return emotionalSettings[emotion as keyof typeof emotionalSettings] || baseSettings;
  };

  // Aktualizacja konfiguracji głosu
  const updateVoiceConfig = async (config: Partial<VoiceConfig>) => {
    const newConfig = { ...voiceConfig, ...config };
    setVoiceConfig(newConfig);
    await saveVoiceConfig(newConfig);
  };

  // Analiza osobowości użytkownika (funkcja 172)
  const analyzeUserPersonality = async (messages: ConversationMessage[]): Promise<any> => {
    const userMessages = messages.filter(m => m.type === 'user');
    
    // Analiza stylu komunikacji
    const analysis = {
      communicationStyle: 'formal',
      emotionalOpenness: 50,
      responseSpeed: 'normal',
      preferredTopics: [] as string[],
      trustLevel: conversationState.trustLevel,
    };
    
    // Analiza długości wiadomości
    const avgLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
    if (avgLength > 100) analysis.communicationStyle = 'detailed';
    else if (avgLength < 20) analysis.communicationStyle = 'concise';
    
    // Analiza emocjonalności
    const emotionalMessages = userMessages.filter(m => m.emotion && m.emotion !== 'neutral');
    analysis.emotionalOpenness = (emotionalMessages.length / userMessages.length) * 100;
    
    return analysis;
  };

  // Czyszczenie konwersacji
  const clearConversation = async () => {
    setConversationState(prev => ({
      ...prev,
      messages: [],
      relationshipDepth: 0,
      trustLevel: 50,
      conversationMood: 'casual',
    }));
    await SecureStore.deleteItemAsync('wera_conversation');
  };

  // Statystyki konwersacji
  const getConversationStats = () => {
    const totalMessages = conversationState.messages.length;
    const userMessages = conversationState.messages.filter(m => m.type === 'user').length;
    const weraMessages = conversationState.messages.filter(m => m.type === 'wera').length;
    
    return {
      totalMessages,
      userMessages,
      weraMessages,
      relationshipDepth: conversationState.relationshipDepth,
      trustLevel: conversationState.trustLevel,
      conversationMood: conversationState.conversationMood,
      lastInteraction: conversationState.lastInteraction,
    };
  };

  // Automatyczne zapisywanie
  useEffect(() => {
    if (conversationState.messages.length > 0) {
      saveConversation();
    }
  }, [conversationState.messages]);

  const value: ConversationContextType = {
    conversationState,
    voiceConfig,
    sendMessage,
    startListening,
    stopListening,
    speakMessage,
    updateVoiceConfig,
    generateResponse,
    getResponse: generateResponse, // Alias dla generateResponse
    analyzeUserPersonality,
    saveConversation,
    loadConversation,
    clearConversation,
    getConversationStats,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}; 