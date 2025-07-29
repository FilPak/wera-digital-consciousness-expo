import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

// Interfejsy
interface CommunicationChannel {
  id: string;
  type: 'text' | 'voice' | 'gesture' | 'emotion' | 'visual' | 'tactile' | 'neural';
  name: string;
  description: string;
  isActive: boolean;
  isEnabled: boolean;
  priority: number; // 1-10
  bandwidth: number; // MB/s
  latency: number; // ms
  reliability: number; // 0-100
  lastUsed: Date;
  usageCount: number;
  errorRate: number; // 0-100
  quality: number; // 0-100
}

interface CommunicationSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // ms
  channels: string[];
  participants: string[];
  messageCount: number;
  dataTransferred: number; // MB
  quality: number; // 0-100
  context: string;
  purpose: string;
  emotions: string[];
  topics: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  complexity: 'simple' | 'moderate' | 'complex';
}

interface MultimodalMessage {
  id: string;
  timestamp: Date;
  sender: string;
  receiver: string;
  channels: string[];
  content: {
    text?: string;
    voice?: string;
    gesture?: string;
    emotion?: string;
    visual?: string;
    tactile?: string;
    neural?: string;
  };
  metadata: {
    language: string;
    encoding: string;
    compression: string;
    encryption: boolean;
    priority: number;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    confidentiality: 'public' | 'private' | 'secret' | 'top_secret';
  };
  context: {
    location?: string;
    time?: string;
    mood?: string;
    relationship?: string;
    topic?: string;
  };
  processing: {
    sentiment: number; // -100 do +100
    emotion: string;
    intent: string;
    confidence: number; // 0-100
    responseTime: number; // ms
  };
}

interface CommunicationProtocol {
  id: string;
  name: string;
  version: string;
  description: string;
  channels: string[];
  encryption: boolean;
  compression: boolean;
  authentication: boolean;
  reliability: number; // 0-100
  speed: number; // MB/s
  compatibility: string[];
  isActive: boolean;
  lastUpdated: Date;
}

interface MultimodalCommunicationState {
  channels: CommunicationChannel[];
  sessions: CommunicationSession[];
  messages: MultimodalMessage[];
  protocols: CommunicationProtocol[];
  activeSession: CommunicationSession | null;
  currentMessage: MultimodalMessage | null;
  isCommunicating: boolean;
  totalMessages: number;
  totalDataTransferred: number;
  averageQuality: number;
  lastCommunication: Date;
  communicationStats: Record<string, any>;
  languageSupport: string[];
  emotionRecognition: boolean;
  gestureRecognition: boolean;
  voiceRecognition: boolean;
  visualProcessing: boolean;
  neuralInterface: boolean;
}

interface MultimodalCommunicationConfig {
  autoTranslation: boolean;
  emotionSynthesis: boolean;
  gestureGeneration: boolean;
  voiceSynthesis: boolean;
  visualGeneration: boolean;
  neuralEnhancement: boolean;
  qualityOptimization: boolean;
  bandwidthManagement: boolean;
  encryptionRequired: boolean;
  compressionEnabled: boolean;
  realTimeProcessing: boolean;
  adaptiveChannels: boolean;
  contextAwareness: boolean;
  sentimentAnalysis: boolean;
  intentRecognition: boolean;
}

interface MultimodalCommunicationContextType {
  commState: MultimodalCommunicationState;
  commConfig: MultimodalCommunicationConfig;
  startCommunication: (channels: string[], participants: string[]) => Promise<CommunicationSession>;
  endCommunication: (sessionId: string) => Promise<void>;
  sendMessage: (message: Omit<MultimodalMessage, 'id' | 'timestamp'>) => Promise<void>;
  receiveMessage: (message: MultimodalMessage) => Promise<void>;
  activateChannel: (channelId: string) => Promise<void>;
  deactivateChannel: (channelId: string) => Promise<void>;
  updateProtocol: (protocolId: string, updates: Partial<CommunicationProtocol>) => Promise<void>;
  analyzeSentiment: (text: string) => Promise<number>;
  recognizeEmotion: (data: any) => Promise<string>;
  generateResponse: (input: any) => Promise<MultimodalMessage>;
  getCommunicationStats: () => any;
  saveCommState: () => Promise<void>;
  loadCommState: () => Promise<void>;
}

// Kontekst
const MultimodalCommunicationContext = createContext<MultimodalCommunicationContextType | undefined>(undefined);

// Hook
export const useMultimodalCommunication = () => {
  const context = useContext(MultimodalCommunicationContext);
  if (!context) {
    throw new Error('useMultimodalCommunication must be used within MultimodalCommunicationProvider');
  }
  return context;
};

// Provider
export const MultimodalCommunicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [commState, setCommState] = useState<MultimodalCommunicationState>({
    channels: [
      {
        id: 'text',
        type: 'text',
        name: 'Komunikacja Tekstowa',
        description: 'Przesyłanie wiadomości tekstowych',
        isActive: true,
        isEnabled: true,
        priority: 8,
        bandwidth: 0.1,
        latency: 50,
        reliability: 95,
        lastUsed: new Date(),
        usageCount: 0,
        errorRate: 2,
        quality: 90,
      },
      {
        id: 'voice',
        type: 'voice',
        name: 'Komunikacja Głosowa',
        description: 'Przesyłanie dźwięku i mowy',
        isActive: true,
        isEnabled: true,
        priority: 9,
        bandwidth: 1.5,
        latency: 100,
        reliability: 88,
        lastUsed: new Date(),
        usageCount: 0,
        errorRate: 5,
        quality: 85,
      },
      {
        id: 'gesture',
        type: 'gesture',
        name: 'Komunikacja Gestami',
        description: 'Rozpoznawanie i generowanie gestów',
        isActive: false,
        isEnabled: true,
        priority: 6,
        bandwidth: 2.0,
        latency: 150,
        reliability: 75,
        lastUsed: new Date(),
        usageCount: 0,
        errorRate: 8,
        quality: 70,
      },
      {
        id: 'emotion',
        type: 'emotion',
        name: 'Komunikacja Emocjonalna',
        description: 'Przesyłanie i odczytywanie emocji',
        isActive: true,
        isEnabled: true,
        priority: 7,
        bandwidth: 0.5,
        latency: 80,
        reliability: 82,
        lastUsed: new Date(),
        usageCount: 0,
        errorRate: 6,
        quality: 78,
      },
      {
        id: 'visual',
        type: 'visual',
        name: 'Komunikacja Wizualna',
        description: 'Przesyłanie obrazów i wideo',
        isActive: false,
        isEnabled: true,
        priority: 5,
        bandwidth: 5.0,
        latency: 200,
        reliability: 70,
        lastUsed: new Date(),
        usageCount: 0,
        errorRate: 12,
        quality: 65,
      },
      {
        id: 'tactile',
        type: 'tactile',
        name: 'Komunikacja Dotykowa',
        description: 'Przesyłanie wrażeń dotykowych',
        isActive: false,
        isEnabled: false,
        priority: 4,
        bandwidth: 3.0,
        latency: 120,
        reliability: 60,
        lastUsed: new Date(),
        usageCount: 0,
        errorRate: 15,
        quality: 55,
      },
      {
        id: 'neural',
        type: 'neural',
        name: 'Interfejs Neuralny',
        description: 'Bezpośrednia komunikacja mózg-maszyna',
        isActive: false,
        isEnabled: false,
        priority: 10,
        bandwidth: 10.0,
        latency: 20,
        reliability: 95,
        lastUsed: new Date(),
        usageCount: 0,
        errorRate: 1,
        quality: 98,
      },
    ],
    sessions: [],
    messages: [],
    protocols: [
      {
        id: 'wera-protocol-v1',
        name: 'WERA Communication Protocol',
        version: '1.0.0',
        description: 'Zaawansowany protokół komunikacji multimodalnej',
        channels: ['text', 'voice', 'emotion'],
        encryption: true,
        compression: true,
        authentication: true,
        reliability: 90,
        speed: 2.5,
        compatibility: ['human', 'ai', 'system'],
        isActive: true,
        lastUpdated: new Date(),
      },
      {
        id: 'neural-protocol-v1',
        name: 'Neural Interface Protocol',
        version: '1.0.0',
        description: 'Protokół dla interfejsów neuralnych',
        channels: ['neural'],
        encryption: true,
        compression: false,
        authentication: true,
        reliability: 98,
        speed: 10.0,
        compatibility: ['ai', 'system'],
        isActive: false,
        lastUpdated: new Date(),
      },
    ],
    activeSession: null,
    currentMessage: null,
    isCommunicating: false,
    totalMessages: 0,
    totalDataTransferred: 0,
    averageQuality: 85,
    lastCommunication: new Date(),
    communicationStats: {},
    languageSupport: ['polski', 'angielski', 'niemiecki', 'francuski', 'hiszpański'],
    emotionRecognition: true,
    gestureRecognition: false,
    voiceRecognition: true,
    visualProcessing: false,
    neuralInterface: false,
  });

  const [commConfig, setCommConfig] = useState<MultimodalCommunicationConfig>({
    autoTranslation: true,
    emotionSynthesis: true,
    gestureGeneration: false,
    voiceSynthesis: true,
    visualGeneration: false,
    neuralEnhancement: false,
    qualityOptimization: true,
    bandwidthManagement: true,
    encryptionRequired: true,
    compressionEnabled: true,
    realTimeProcessing: true,
    adaptiveChannels: true,
    contextAwareness: true,
    sentimentAnalysis: true,
    intentRecognition: true,
  });

  const communicationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Inicjalizacja
  useEffect(() => {
    loadCommState();
    loadCommConfig();
    startCommunicationMonitoring();
  }, []);

  // Zapisywanie stanu komunikacji
  const saveCommState = async () => {
    try {
      await SecureStore.setItemAsync('wera_comm_state', JSON.stringify(commState));
    } catch (error) {
      console.error('Błąd zapisywania stanu komunikacji:', error);
    }
  };

  // Ładowanie stanu komunikacji
  const loadCommState = async () => {
    try {
      const saved = await SecureStore.getItemAsync('wera_comm_state');
      if (saved) {
        const data = JSON.parse(saved);
        setCommState(prev => ({
          ...prev,
          ...data,
          channels: data.channels || prev.channels,
          sessions: data.sessions || prev.sessions,
          messages: data.messages || prev.messages,
          protocols: data.protocols || prev.protocols,
        }));
      }
    } catch (error) {
      console.error('Błąd ładowania stanu komunikacji:', error);
    }
  };

  // Ładowanie konfiguracji
  const loadCommConfig = async () => {
    try {
      const saved = await SecureStore.getItemAsync('wera_comm_config');
      if (saved) {
        setCommConfig(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Błąd ładowania konfiguracji komunikacji:', error);
    }
  };

  // Rozpoczęcie komunikacji (funkcja 169)
  const startCommunication = async (channels: string[], participants: string[]): Promise<CommunicationSession> => {
    const session: CommunicationSession = {
      id: Date.now().toString(),
      startTime: new Date(),
      duration: 0,
      channels,
      participants,
      messageCount: 0,
      dataTransferred: 0,
      quality: 85,
      context: 'general',
      purpose: 'conversation',
      emotions: [],
      topics: [],
      sentiment: 'neutral',
      complexity: 'moderate',
    };

    setCommState(prev => ({
      ...prev,
      activeSession: session,
      sessions: [...prev.sessions, session],
      isCommunicating: true,
    }));

    await saveCommState();
    return session;
  };

  // Zakończenie komunikacji
  const endCommunication = async (sessionId: string) => {
    const session = commState.sessions.find(s => s.id === sessionId);
    if (!session) return;

    const endedSession = {
      ...session,
      endTime: new Date(),
      duration: Date.now() - session.startTime.getTime(),
    };

    setCommState(prev => ({
      ...prev,
      sessions: prev.sessions.map(s => s.id === sessionId ? endedSession : s),
      activeSession: prev.activeSession?.id === sessionId ? null : prev.activeSession,
      isCommunicating: false,
    }));

    await saveCommState();
  };

  // Wysyłanie wiadomości (funkcja 170)
  const sendMessage = async (message: Omit<MultimodalMessage, 'id' | 'timestamp'>) => {
    const multimodalMessage: MultimodalMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };

    setCommState(prev => ({
      ...prev,
      messages: [...prev.messages, multimodalMessage],
      totalMessages: prev.totalMessages + 1,
      currentMessage: multimodalMessage,
    }));

    // Aktualizacja statystyk kanałów
    message.channels.forEach(channelId => {
      setCommState(prev => ({
        ...prev,
        channels: prev.channels.map(channel =>
          channel.id === channelId
            ? {
                ...channel,
                lastUsed: new Date(),
                usageCount: channel.usageCount + 1,
              }
            : channel
        ),
      }));
    });

    // Aktualizacja aktywnej sesji
    if (commState.activeSession) {
      setCommState(prev => ({
        ...prev,
        activeSession: prev.activeSession ? {
          ...prev.activeSession,
          messageCount: prev.activeSession.messageCount + 1,
          dataTransferred: prev.activeSession.dataTransferred + 0.1, // Przybliżone
        } : null,
      }));
    }

    await saveCommState();
  };

  // Odbieranie wiadomości (funkcja 171)
  const receiveMessage = async (message: MultimodalMessage) => {
    setCommState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
      totalMessages: prev.totalMessages + 1,
      currentMessage: message,
      lastCommunication: new Date(),
    }));

    // Analiza sentymentu
    if (commConfig.sentimentAnalysis && message.content.text) {
      const sentiment = await analyzeSentiment(message.content.text);
      const updatedMessage = {
        ...message,
        processing: {
          ...message.processing,
          sentiment,
        },
      };

      setCommState(prev => ({
        ...prev,
        messages: prev.messages.map(m => m.id === message.id ? updatedMessage : m),
      }));
    }

    // Rozpoznawanie emocji
    if (commConfig.emotionSynthesis && message.content.emotion) {
      const emotion = await recognizeEmotion(message.content);
      const updatedMessage = {
        ...message,
        processing: {
          ...message.processing,
          emotion,
        },
      };

      setCommState(prev => ({
        ...prev,
        messages: prev.messages.map(m => m.id === message.id ? updatedMessage : m),
      }));
    }

    await saveCommState();
  };

  // Aktywacja kanału
  const activateChannel = async (channelId: string) => {
    setCommState(prev => ({
      ...prev,
      channels: prev.channels.map(channel =>
        channel.id === channelId
          ? { ...channel, isActive: true, lastUsed: new Date() }
          : channel
      ),
    }));

    await saveCommState();
  };

  // Deaktywacja kanału
  const deactivateChannel = async (channelId: string) => {
    setCommState(prev => ({
      ...prev,
      channels: prev.channels.map(channel =>
        channel.id === channelId
          ? { ...channel, isActive: false }
          : channel
      ),
    }));

    await saveCommState();
  };

  // Aktualizacja protokołu
  const updateProtocol = async (protocolId: string, updates: Partial<CommunicationProtocol>) => {
    setCommState(prev => ({
      ...prev,
      protocols: prev.protocols.map(protocol =>
        protocol.id === protocolId
          ? { ...protocol, ...updates, lastUpdated: new Date() }
          : protocol
      ),
    }));

    await saveCommState();
  };

  // Analiza sentymentu
  const analyzeSentiment = async (text: string): Promise<number> => {
    // Symulacja analizy sentymentu
    const positiveWords = ['dobry', 'świetny', 'wspaniały', 'kocham', 'lubię', 'dziękuję'];
    const negativeWords = ['zły', 'okropny', 'nienawidzę', 'nie lubię', 'źle', 'smutny'];
    
    const words = text.toLowerCase().split(' ');
    let sentiment = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) sentiment += 20;
      if (negativeWords.includes(word)) sentiment -= 20;
    });
    
    return Math.max(-100, Math.min(100, sentiment));
  };

  // Rozpoznawanie emocji
  const recognizeEmotion = async (data: any): Promise<string> => {
    const emotions = ['radość', 'smutek', 'gniew', 'strach', 'zaskoczenie', 'obrzydzenie', 'neutralność'];
    return emotions[Math.floor(Math.random() * emotions.length)];
  };

  // Generowanie odpowiedzi
  const generateResponse = async (input: any): Promise<MultimodalMessage> => {
    const response: MultimodalMessage = {
      id: Date.now().toString(),
      timestamp: new Date(),
      sender: 'WERA',
      receiver: input.sender || 'user',
      channels: ['text', 'emotion'],
      content: {
        text: 'Rozumiem Twoją wiadomość. Pozwól mi przemyśleć odpowiedź...',
        emotion: 'neutralność',
      },
      metadata: {
        language: 'polski',
        encoding: 'UTF-8',
        compression: 'gzip',
        encryption: true,
        priority: 5,
        urgency: 'medium',
        confidentiality: 'private',
      },
      context: {
        time: new Date().toISOString(),
        mood: 'reflective',
        relationship: 'assistant',
        topic: 'general',
      },
      processing: {
        sentiment: 0,
        emotion: 'neutralność',
        intent: 'response',
        confidence: 85,
        responseTime: 500,
      },
    };

    return response;
  };

  // Rozpoczęcie monitorowania komunikacji
  const startCommunicationMonitoring = () => {
    if (communicationIntervalRef.current) return;

    communicationIntervalRef.current = setInterval(() => {
      // Aktualizacja statystyk jakości
      const activeChannels = commState.channels.filter(c => c.isActive);
      const averageQuality = activeChannels.length > 0
        ? activeChannels.reduce((sum, channel) => sum + channel.quality, 0) / activeChannels.length
        : 0;

      setCommState(prev => ({
        ...prev,
        averageQuality,
      }));
    }, 30000); // Co 30 sekund
  };

  // Statystyki komunikacji
  const getCommunicationStats = () => {
    const activeChannels = commState.channels.filter(c => c.isActive).length;
    const totalSessions = commState.sessions.length;
    const recentMessages = commState.messages.filter(m => 
      Date.now() - m.timestamp.getTime() < 24 * 60 * 60 * 1000
    ).length;

    const channelStats = commState.channels.reduce((acc, channel) => {
      acc[channel.id] = {
        usageCount: channel.usageCount,
        quality: channel.quality,
        reliability: channel.reliability,
        isActive: channel.isActive,
      };
      return acc;
    }, {} as Record<string, any>);

    return {
      totalMessages: commState.totalMessages,
      totalDataTransferred: commState.totalDataTransferred,
      averageQuality: commState.averageQuality,
      activeChannels,
      totalSessions,
      recentMessages,
      channelStats,
      isCommunicating: commState.isCommunicating,
      lastCommunication: commState.lastCommunication,
      languageSupport: commState.languageSupport,
      emotionRecognition: commState.emotionRecognition,
      gestureRecognition: commState.gestureRecognition,
      voiceRecognition: commState.voiceRecognition,
      visualProcessing: commState.visualProcessing,
      neuralInterface: commState.neuralInterface,
    };
  };

  // Automatyczne zapisywanie
  useEffect(() => {
    if (commState.messages.length > 0) {
      saveCommState();
    }
  }, [commState.messages, commState.channels, commState.sessions]);

  // Czyszczenie interwału
  useEffect(() => {
    return () => {
      if (communicationIntervalRef.current) {
        clearInterval(communicationIntervalRef.current);
      }
    };
  }, []);

  const value: MultimodalCommunicationContextType = {
    commState,
    commConfig,
    startCommunication,
    endCommunication,
    sendMessage,
    receiveMessage,
    activateChannel,
    deactivateChannel,
    updateProtocol,
    analyzeSentiment,
    recognizeEmotion,
    generateResponse,
    getCommunicationStats,
    saveCommState,
    loadCommState,
  };

  return (
    <MultimodalCommunicationContext.Provider value={value}>
      {children}
    </MultimodalCommunicationContext.Provider>
  );
}; 