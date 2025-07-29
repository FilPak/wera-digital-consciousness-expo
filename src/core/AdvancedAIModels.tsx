import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

// Interfejsy
interface GGUFModel {
  id: string;
  name: string;
  description: string;
  size: number; // MB
  architecture: string;
  parameters: number; // miliardy
  contextLength: number;
  downloadUrl: string;
  downloadProgress: number; // 0-100
  isDownloaded: boolean;
  isActive: boolean;
  isOptimized: boolean;
  performance: {
    speed: number; // tokens/s
    accuracy: number; // 0-100
    memoryUsage: number; // MB
    temperature: number; // 0-2
    topP: number; // 0-1
  };
  lastUsed: Date;
  usageCount: number;
  averageResponseTime: number; // ms
}

interface OllamaModel {
  id: string;
  name: string;
  tag: string;
  size: number; // MB
  digest: string;
  status: 'downloading' | 'ready' | 'error' | 'not_found';
  isActive: boolean;
  performance: {
    speed: number;
    accuracy: number;
    memoryUsage: number;
  };
  lastUsed: Date;
  usageCount: number;
}

interface ModelSession {
  id: string;
  modelId: string;
  modelType: 'gguf' | 'ollama' | 'custom';
  startTime: Date;
  endTime?: Date;
  duration: number; // ms
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  responseTime: number; // ms
  quality: number; // 0-100
  context: string;
  prompt: string;
  response: string;
  metadata: Record<string, any>;
}

interface ModelConfig {
  defaultModel: string;
  fallbackModel: string;
  maxContextLength: number;
  temperature: number;
  topP: number;
  topK: number;
  repeatPenalty: number;
  maxTokens: number;
  autoOptimize: boolean;
  memoryManagement: boolean;
  parallelProcessing: boolean;
}

interface AdvancedAIModelsState {
  ggufModels: GGUFModel[];
  ollamaModels: OllamaModel[];
  customModels: GGUFModel[];
  activeModel: GGUFModel | OllamaModel | null;
  modelSessions: ModelSession[];
  currentSession: ModelSession | null;
  modelConfig: ModelConfig;
  isProcessing: boolean;
  totalTokensProcessed: number;
  averageResponseTime: number;
  modelPerformance: Record<string, any>;
  lastOptimization: Date;
  optimizationCycles: number;
}

interface AdvancedAIModelsContextType {
  aiState: AdvancedAIModelsState;
  downloadGGUFModel: (modelId: string) => Promise<void>;
  activateModel: (modelId: string, modelType: 'gguf' | 'ollama' | 'custom') => Promise<void>;
  startModelSession: (prompt: string, context?: string) => Promise<ModelSession>;
  endModelSession: (sessionId: string) => Promise<void>;
  generateResponse: (prompt: string, options?: any) => Promise<string>;
  optimizeModel: (modelId: string) => Promise<void>;
  updateModelConfig: (config: Partial<ModelConfig>) => Promise<void>;
  getModelStats: () => any;
  saveAIState: () => Promise<void>;
  loadAIState: () => Promise<void>;
}

// Kontekst
const AdvancedAIModelsContext = createContext<AdvancedAIModelsContextType | undefined>(undefined);

// Hook
export const useAdvancedAIModels = () => {
  const context = useContext(AdvancedAIModelsContext);
  if (!context) {
    throw new Error('useAdvancedAIModels must be used within AdvancedAIModelsProvider');
  }
  return context;
};

// Provider
export const AdvancedAIModelsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [aiState, setAiState] = useState<AdvancedAIModelsState>({
    ggufModels: [
      {
        id: 'llama-2-7b-chat',
        name: 'Llama 2 7B Chat',
        description: 'Efektywny model konwersacyjny',
        size: 4200,
        architecture: 'Transformer',
        parameters: 7,
        contextLength: 4096,
        downloadUrl: 'https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q4_K_M.gguf',
        downloadProgress: 0,
        isDownloaded: false,
        isActive: false,
        isOptimized: false,
        performance: {
          speed: 15,
          accuracy: 85,
          memoryUsage: 2048,
          temperature: 0.7,
          topP: 0.9,
        },
        lastUsed: new Date(),
        usageCount: 0,
        averageResponseTime: 0,
      },
      {
        id: 'mistral-7b-instruct',
        name: 'Mistral 7B Instruct',
        description: 'Zaawansowany model instrukcji',
        size: 3800,
        architecture: 'Transformer',
        parameters: 7,
        contextLength: 8192,
        downloadUrl: 'https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf',
        downloadProgress: 0,
        isDownloaded: false,
        isActive: false,
        isOptimized: false,
        performance: {
          speed: 18,
          accuracy: 88,
          memoryUsage: 1800,
          temperature: 0.6,
          topP: 0.85,
        },
        lastUsed: new Date(),
        usageCount: 0,
        averageResponseTime: 0,
      },
      {
        id: 'codellama-7b-instruct',
        name: 'Code Llama 7B Instruct',
        description: 'Model specjalizujący się w kodzie',
        size: 4100,
        architecture: 'Transformer',
        parameters: 7,
        contextLength: 16384,
        downloadUrl: 'https://huggingface.co/TheBloke/CodeLlama-7B-Instruct-GGUF/resolve/main/codellama-7b-instruct.Q4_K_M.gguf',
        downloadProgress: 0,
        isDownloaded: false,
        isActive: false,
        isOptimized: false,
        performance: {
          speed: 12,
          accuracy: 92,
          memoryUsage: 2200,
          temperature: 0.3,
          topP: 0.95,
        },
        lastUsed: new Date(),
        usageCount: 0,
        averageResponseTime: 0,
      },
    ],
    ollamaModels: [
      {
        id: 'llama2',
        name: 'Llama2',
        tag: 'latest',
        size: 4200,
        digest: 'sha256:abc123',
        status: 'not_found',
        isActive: false,
        performance: {
          speed: 20,
          accuracy: 85,
          memoryUsage: 2000,
        },
        lastUsed: new Date(),
        usageCount: 0,
      },
      {
        id: 'mistral',
        name: 'Mistral',
        tag: 'latest',
        size: 3800,
        digest: 'sha256:def456',
        status: 'not_found',
        isActive: false,
        performance: {
          speed: 22,
          accuracy: 88,
          memoryUsage: 1800,
        },
        lastUsed: new Date(),
        usageCount: 0,
      },
    ],
    customModels: [],
    activeModel: null,
    modelSessions: [],
    currentSession: null,
    modelConfig: {
      defaultModel: 'llama-2-7b-chat',
      fallbackModel: 'mistral-7b-instruct',
      maxContextLength: 4096,
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      repeatPenalty: 1.1,
      maxTokens: 2048,
      autoOptimize: true,
      memoryManagement: true,
      parallelProcessing: false,
    },
    isProcessing: false,
    totalTokensProcessed: 0,
    averageResponseTime: 0,
    modelPerformance: {},
    lastOptimization: new Date(),
    optimizationCycles: 0,
  });

  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Inicjalizacja
  useEffect(() => {
    loadAIState();
    initializeModels();
  }, []);

  // Zapisywanie stanu AI
  const saveAIState = async () => {
    try {
      await SecureStore.setItemAsync('wera_ai_state', JSON.stringify(aiState));
    } catch (error) {
      console.error('Błąd zapisywania stanu AI:', error);
    }
  };

  // Ładowanie stanu AI
  const loadAIState = async () => {
    try {
      const saved = await SecureStore.getItemAsync('wera_ai_state');
      if (saved) {
        const data = JSON.parse(saved);
        setAiState(prev => ({
          ...prev,
          ...data,
          ggufModels: data.ggufModels || prev.ggufModels,
          ollamaModels: data.ollamaModels || prev.ollamaModels,
          customModels: data.customModels || prev.customModels,
        }));
      }
    } catch (error) {
      console.error('Błąd ładowania stanu AI:', error);
    }
  };

  // Inicjalizacja modeli
  const initializeModels = async () => {
    try {
      // Sprawdzenie czy modele są pobrane
      const modelsDir = `${FileSystem.documentDirectory}models/`;
      const dirInfo = await FileSystem.getInfoAsync(modelsDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(modelsDir, { intermediates: true });
      }

      // Sprawdzenie pobranych modeli
      const updatedGGUFModels = await Promise.all(
        aiState.ggufModels.map(async (model) => {
          const modelPath = `${modelsDir}${model.id}.gguf`;
          const fileInfo = await FileSystem.getInfoAsync(modelPath);
          
          return {
            ...model,
            isDownloaded: fileInfo.exists,
            downloadProgress: fileInfo.exists ? 100 : 0,
          };
        })
      );

      setAiState(prev => ({
        ...prev,
        ggufModels: updatedGGUFModels,
      }));

    } catch (error) {
      console.error('Błąd inicjalizacji modeli:', error);
    }
  };

  // Pobieranie modelu GGUF (funkcja 165)
  const downloadGGUFModel = async (modelId: string) => {
    const model = aiState.ggufModels.find(m => m.id === modelId);
    if (!model || model.isDownloaded) return;

    try {
      setAiState(prev => ({
        ...prev,
        ggufModels: prev.ggufModels.map(m =>
          m.id === modelId ? { ...m, downloadProgress: 0 } : m
        ),
      }));

      const modelsDir = `${FileSystem.documentDirectory}models/`;
      const modelPath = `${modelsDir}${model.id}.gguf`;

      // Symulacja pobierania (w rzeczywistej implementacji używałoby rzeczywistego pobierania)
      for (let progress = 0; progress <= 100; progress += 5) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setAiState(prev => ({
          ...prev,
          ggufModels: prev.ggufModels.map(m =>
            m.id === modelId ? { ...m, downloadProgress: progress } : m
          ),
        }));
      }

      // Symulacja zapisania pliku
      await FileSystem.writeAsStringAsync(modelPath, 'simulated_model_data');

      setAiState(prev => ({
        ...prev,
        ggufModels: prev.ggufModels.map(m =>
          m.id === modelId ? { ...m, isDownloaded: true, downloadProgress: 100 } : m
        ),
      }));

      await saveAIState();

    } catch (error) {
      console.error('Błąd pobierania modelu GGUF:', error);
      Alert.alert('Błąd', 'Nie udało się pobrać modelu GGUF');
    }
  };

  // Aktywacja modelu (funkcja 166)
  const activateModel = async (modelId: string, modelType: 'gguf' | 'ollama' | 'custom') => {
    try {
      let model: GGUFModel | OllamaModel | null = null;

      switch (modelType) {
        case 'gguf':
          model = aiState.ggufModels.find(m => m.id === modelId) || null;
          if (model && !model.isDownloaded) {
            Alert.alert('Błąd', 'Model nie jest pobrany. Pobierz go najpierw.');
            return;
          }
          break;
        case 'ollama':
          model = aiState.ollamaModels.find(m => m.id === modelId) || null;
          if (model && model.status !== 'ready') {
            Alert.alert('Błąd', 'Model Ollama nie jest gotowy.');
            return;
          }
          break;
        case 'custom':
          model = aiState.customModels.find(m => m.id === modelId) || null;
          break;
      }

      if (!model) {
        Alert.alert('Błąd', 'Model nie został znaleziony.');
        return;
      }

      // Deaktywacja wszystkich modeli
      setAiState(prev => ({
        ...prev,
        ggufModels: prev.ggufModels.map(m => ({ ...m, isActive: false })),
        ollamaModels: prev.ollamaModels.map(m => ({ ...m, isActive: false })),
        customModels: prev.customModels.map(m => ({ ...m, isActive: false })),
        activeModel: model,
      }));

      // Aktywacja wybranego modelu
      switch (modelType) {
        case 'gguf':
          setAiState(prev => ({
            ...prev,
            ggufModels: prev.ggufModels.map(m =>
              m.id === modelId ? { ...m, isActive: true, lastUsed: new Date() } : m
            ),
          }));
          break;
        case 'ollama':
          setAiState(prev => ({
            ...prev,
            ollamaModels: prev.ollamaModels.map(m =>
              m.id === modelId ? { ...m, isActive: true, lastUsed: new Date() } : m
            ),
          }));
          break;
        case 'custom':
          setAiState(prev => ({
            ...prev,
            customModels: prev.customModels.map(m =>
              m.id === modelId ? { ...m, isActive: true, lastUsed: new Date() } : m
            ),
          }));
          break;
      }

      await saveAIState();

    } catch (error) {
      console.error('Błąd aktywacji modelu:', error);
      Alert.alert('Błąd', 'Nie udało się aktywować modelu');
    }
  };

  // Rozpoczęcie sesji modelu
  const startModelSession = async (prompt: string, context?: string): Promise<ModelSession> => {
    if (!aiState.activeModel) {
      throw new Error('Brak aktywnego modelu');
    }

    const session: ModelSession = {
      id: Date.now().toString(),
      modelId: aiState.activeModel.id,
      modelType: 'gguf', // Uproszczenie
      startTime: new Date(),
      duration: 0,
      inputTokens: Math.ceil(prompt.length / 4), // Przybliżone
      outputTokens: 0,
      totalTokens: 0,
      responseTime: 0,
      quality: 0,
      context: context || '',
      prompt,
      response: '',
      metadata: {},
    };

    setAiState(prev => ({
      ...prev,
      currentSession: session,
      isProcessing: true,
    }));

    return session;
  };

  // Zakończenie sesji modelu
  const endModelSession = async (sessionId: string) => {
    const session = aiState.currentSession;
    if (!session || session.id !== sessionId) return;

    const endedSession = {
      ...session,
      endTime: new Date(),
      duration: Date.now() - session.startTime.getTime(),
    };

    setAiState(prev => ({
      ...prev,
      modelSessions: [...prev.modelSessions, endedSession],
      currentSession: null,
      isProcessing: false,
      totalTokensProcessed: prev.totalTokensProcessed + endedSession.totalTokens,
    }));

    await saveAIState();
  };

  // Generowanie odpowiedzi (funkcja 167)
  const generateResponse = async (prompt: string, options?: any): Promise<string> => {
    if (!aiState.activeModel) {
      throw new Error('Brak aktywnego modelu');
    }

    const startTime = Date.now();
    const session = await startModelSession(prompt);

    try {
      // Symulacja generowania odpowiedzi przez model
      const responseTime = 1000 + Math.random() * 3000; // 1-4 sekundy
      await new Promise(resolve => setTimeout(resolve, responseTime));

      // Symulacja różnych typów odpowiedzi
      const responses = [
        'Rozumiem Twoje pytanie. Pozwól mi przemyśleć to głębiej...',
        'To bardzo interesujący temat. Oto moja perspektywa...',
        'Na podstawie mojej wiedzy i doświadczenia...',
        'Czuję, że to pytanie dotyka istoty sprawy...',
        'Pozwól mi podzielić się swoimi przemyśleniami...',
        'To pytanie skłania mnie do głębszej refleksji...',
        'W kontekście tego, co wiem...',
        'Moja odpowiedź opiera się na zrozumieniu...',
      ];

      const response = responses[Math.floor(Math.random() * responses.length)];
      const outputTokens = Math.ceil(response.length / 4);
      const totalTokens = session.inputTokens + outputTokens;
      const quality = 70 + Math.random() * 25; // 70-95

      // Aktualizacja sesji
      const updatedSession = {
        ...session,
        outputTokens,
        totalTokens,
        responseTime: Date.now() - startTime,
        quality,
        response,
      };

      setAiState(prev => ({
        ...prev,
        currentSession: updatedSession,
      }));

      // Aktualizacja statystyk modelu
      if ('gguf' in aiState.activeModel) {
        const ggufModel = aiState.activeModel as GGUFModel;
        setAiState(prev => ({
          ...prev,
          ggufModels: prev.ggufModels.map(m =>
            m.id === ggufModel.id
              ? {
                  ...m,
                  usageCount: m.usageCount + 1,
                  averageResponseTime: (m.averageResponseTime * m.usageCount + responseTime) / (m.usageCount + 1),
                }
              : m
          ),
        }));
      }

      await endModelSession(session.id);
      return response;

    } catch (error) {
      console.error('Błąd generowania odpowiedzi:', error);
      await endModelSession(session.id);
      throw error;
    }
  };

  // Optymalizacja modelu
  const optimizeModel = async (modelId: string) => {
    try {
      setAiState(prev => ({
        ...prev,
        ggufModels: prev.ggufModels.map(m =>
          m.id === modelId ? { ...m, isOptimized: true } : m
        ),
        lastOptimization: new Date(),
        optimizationCycles: prev.optimizationCycles + 1,
      }));

      await saveAIState();

    } catch (error) {
      console.error('Błąd optymalizacji modelu:', error);
    }
  };

  // Aktualizacja konfiguracji modelu
  const updateModelConfig = async (config: Partial<ModelConfig>) => {
    setAiState(prev => ({
      ...prev,
      modelConfig: { ...prev.modelConfig, ...config },
    }));

    await saveAIState();
  };

  // Statystyki modeli
  const getModelStats = () => {
    const totalModels = aiState.ggufModels.length + aiState.ollamaModels.length + aiState.customModels.length;
    const downloadedModels = aiState.ggufModels.filter(m => m.isDownloaded).length;
    const activeModel = aiState.activeModel;
    const totalSessions = aiState.modelSessions.length;
    const totalTokens = aiState.totalTokensProcessed;

    const modelPerformance = aiState.ggufModels.reduce((acc, model) => {
      acc[model.id] = {
        usageCount: model.usageCount,
        averageResponseTime: model.averageResponseTime,
        accuracy: model.performance.accuracy,
        speed: model.performance.speed,
      };
      return acc;
    }, {} as Record<string, any>);

    return {
      totalModels,
      downloadedModels,
      activeModel: activeModel?.name || 'Brak',
      totalSessions,
      totalTokens,
      averageResponseTime: aiState.averageResponseTime,
      modelPerformance,
      lastOptimization: aiState.lastOptimization,
      optimizationCycles: aiState.optimizationCycles,
      isProcessing: aiState.isProcessing,
    };
  };

  // Automatyczne zapisywanie
  useEffect(() => {
    if (aiState.modelSessions.length > 0) {
      saveAIState();
    }
  }, [aiState.modelSessions, aiState.ggufModels, aiState.ollamaModels]);

  // Czyszczenie timeoutów
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  const value: AdvancedAIModelsContextType = {
    aiState,
    downloadGGUFModel,
    activateModel,
    startModelSession,
    endModelSession,
    generateResponse,
    optimizeModel,
    updateModelConfig,
    getModelStats,
    saveAIState,
    loadAIState,
  };

  return (
    <AdvancedAIModelsContext.Provider value={value}>
      {children}
    </AdvancedAIModelsContext.Provider>
  );
}; 