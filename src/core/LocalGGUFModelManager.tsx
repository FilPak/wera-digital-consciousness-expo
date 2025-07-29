import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Device from 'expo-device';
import * as Battery from 'expo-battery';

export interface GGUFModel {
  id: string;
  name: string;
  filename: string;
  path: string;
  size: number; // w bajtach
  modelType: 'llama' | 'mistral' | 'phi' | 'gemma' | 'qwen' | 'custom';
  quantization: 'Q2_K' | 'Q3_K' | 'Q4_K' | 'Q5_K' | 'Q6_K' | 'Q8_0' | 'FP16' | 'FP32';
  contextLength: number;
  parameters: number; // liczba parametrów w miliardach
  performance: ModelPerformance;
  isLoaded: boolean;
  isRecommended: boolean;
  lastUsed: Date;
  usageCount: number;
  tags: string[];
  description?: string;
}

export interface ModelPerformance {
  speed: number; // 0-100, szybkość generowania
  quality: number; // 0-100, jakość odpowiedzi
  memoryUsage: number; // 0-100, użycie pamięci
  batteryImpact: number; // 0-100, wpływ na baterię
  temperature: number; // 0-100, kreatywność
  lastTested: Date;
}

export interface ModelRecommendation {
  modelId: string;
  reason: string;
  score: number; // 0-100
  useCase: 'conversation' | 'reflection' | 'creative' | 'analysis' | 'learning';
}

interface LocalGGUFModelManagerContextType {
  models: GGUFModel[];
  currentModel: GGUFModel | null;
  deviceCapabilities: DeviceCapabilities;
  scanForModels: () => Promise<GGUFModel[]>;
  loadModel: (modelId: string) => Promise<boolean>;
  unloadModel: () => Promise<void>;
  getRecommendedModel: (useCase: ModelRecommendation['useCase']) => Promise<ModelRecommendation | null>;
  updateModelPerformance: (modelId: string, performance: Partial<ModelPerformance>) => Promise<void>;
  deleteModel: (modelId: string) => Promise<void>;
  getModelStats: () => {
    totalModels: number;
    totalSize: number;
    loadedModels: number;
    averagePerformance: number;
  };
  saveModelData: () => Promise<void>;
  loadModelData: () => Promise<void>;
  generateModelReflection: () => string;
}

const LocalGGUFModelManagerContext = createContext<LocalGGUFModelManagerContextType | undefined>(undefined);

const MODELS_FILE_PATH = `${FileSystem.documentDirectory}models/`;
const EXTERNAL_STORAGE_PATH = '/storage/emulated/0/Download/';

export interface DeviceCapabilities {
  totalMemory: number; // w GB
  availableMemory: number; // w GB
  batteryLevel: number; // 0-100
  isCharging: boolean;
  processorType: string;
  isLowEndDevice: boolean;
  maxModelSize: number; // w GB
}

export const LocalGGUFModelManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [models, setModels] = useState<GGUFModel[]>([]);
  const [currentModel, setCurrentModel] = useState<GGUFModel | null>(null);
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities>({
    totalMemory: 4,
    availableMemory: 2,
    batteryLevel: 50,
    isCharging: false,
    processorType: 'unknown',
    isLowEndDevice: true,
    maxModelSize: 2,
  });

  // Skanowanie urządzenia w poszukiwaniu modeli GGUF
  const scanForModels = useCallback(async (): Promise<GGUFModel[]> => {
    const foundModels: GGUFModel[] = [];
    
    try {
      // Sprawdź katalogi, gdzie mogą być modele
      const searchPaths = [
        MODELS_FILE_PATH,
        EXTERNAL_STORAGE_PATH,
        `${FileSystem.documentDirectory}`,
        '/storage/emulated/0/',
      ];

      for (const basePath of searchPaths) {
        try {
          const dirInfo = await FileSystem.getInfoAsync(basePath);
          if (!dirInfo.exists) continue;

          const files = await FileSystem.readDirectoryAsync(basePath);
          const ggufFiles = files.filter(file => 
            file.toLowerCase().endsWith('.gguf') || 
            file.toLowerCase().includes('gguf')
          );

          for (const file of ggufFiles) {
            try {
              const filePath = `${basePath}${file}`;
              const fileInfo = await FileSystem.getInfoAsync(filePath);
              
              if (fileInfo.exists && fileInfo.size) {
                const model = await analyzeModelFile(file, filePath, fileInfo.size);
                if (model) {
                  foundModels.push(model);
                }
              }
            } catch (error) {
              console.error(`Błąd analizy pliku ${file}:`, error);
            }
          }
        } catch (error) {
          console.error(`Błąd skanowania katalogu ${basePath}:`, error);
        }
      }

      // Aktualizuj listę modeli
      setModels(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newModels = foundModels.filter(m => !existingIds.has(m.id));
        return [...prev, ...newModels];
      });

      return foundModels;
    } catch (error) {
      console.error('Błąd skanowania modeli:', error);
      return [];
    }
  }, []);

  // Analiza pliku modelu
  const analyzeModelFile = useCallback(async (
    filename: string, 
    path: string, 
    size: number
  ): Promise<GGUFModel | null> => {
    try {
      // Wyciągnij informacje z nazwy pliku
      const name = filename.replace('.gguf', '').replace('.GGUF', '');
      const sizeGB = size / (1024 * 1024 * 1024);
      
      // Określ typ modelu na podstawie nazwy
      let modelType: GGUFModel['modelType'] = 'custom';
      let quantization: GGUFModel['quantization'] = 'Q4_K';
      let parameters = 7; // domyślnie 7B
      let contextLength = 4096;

      if (name.toLowerCase().includes('llama')) modelType = 'llama';
      else if (name.toLowerCase().includes('mistral')) modelType = 'mistral';
      else if (name.toLowerCase().includes('phi')) modelType = 'phi';
      else if (name.toLowerCase().includes('gemma')) modelType = 'gemma';
      else if (name.toLowerCase().includes('qwen')) modelType = 'qwen';

      // Określ kwantyzację
      if (name.includes('Q2')) quantization = 'Q2_K';
      else if (name.includes('Q3')) quantization = 'Q3_K';
      else if (name.includes('Q4')) quantization = 'Q4_K';
      else if (name.includes('Q5')) quantization = 'Q5_K';
      else if (name.includes('Q6')) quantization = 'Q6_K';
      else if (name.includes('Q8')) quantization = 'Q8_0';
      else if (name.includes('FP16')) quantization = 'FP16';
      else if (name.includes('FP32')) quantization = 'FP32';

      // Określ liczbę parametrów
      if (name.includes('7b') || name.includes('7B')) parameters = 7;
      else if (name.includes('13b') || name.includes('13B')) parameters = 13;
      else if (name.includes('30b') || name.includes('30B')) parameters = 30;
      else if (name.includes('70b') || name.includes('70B')) parameters = 70;

      // Określ długość kontekstu
      if (name.includes('32k')) contextLength = 32768;
      else if (name.includes('16k')) contextLength = 16384;
      else if (name.includes('8k')) contextLength = 8192;
      else if (name.includes('4k')) contextLength = 4096;

      // Oszacuj wydajność na podstawie parametrów
      const performance: ModelPerformance = {
        speed: Math.max(20, 100 - parameters * 3), // większe modele są wolniejsze
        quality: Math.min(100, parameters * 8), // większe modele są lepsze
        memoryUsage: Math.min(100, sizeGB * 20), // większe pliki używają więcej pamięci
        batteryImpact: Math.min(100, parameters * 5), // większe modele zużywają więcej baterii
        temperature: 70, // domyślna kreatywność
        lastTested: new Date(),
      };

      const model: GGUFModel = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name,
        filename,
        path,
        size,
        modelType,
        quantization,
        contextLength,
        parameters,
        performance,
        isLoaded: false,
        isRecommended: false,
        lastUsed: new Date(),
        usageCount: 0,
        tags: [modelType, quantization, `${parameters}B`],
        description: `${parameters}B parameter ${modelType} model with ${quantization} quantization`,
      };

      return model;
    } catch (error) {
      console.error('Błąd analizy modelu:', error);
      return null;
    }
  }, []);

  // Ładowanie modelu
  const loadModel = useCallback(async (modelId: string): Promise<boolean> => {
    try {
      const model = models.find(m => m.id === modelId);
      if (!model) {
        console.error('Model nie znaleziony:', modelId);
        return false;
      }

      // Sprawdź czy urządzenie może obsłużyć model
      if (model.size > deviceCapabilities.maxModelSize * 1024 * 1024 * 1024) {
        console.error('Model za duży dla urządzenia');
        return false;
      }

      // Symuluj ładowanie modelu
      console.log(`Ładowanie modelu: ${model.name}`);
      
      // Aktualizuj stan modelu
      setModels(prev => prev.map(m => 
        m.id === modelId 
          ? { ...m, isLoaded: true, lastUsed: new Date(), usageCount: m.usageCount + 1 }
          : { ...m, isLoaded: false }
      ));

      setCurrentModel(model);
      
      // Zapisz informacje o użyciu
      await saveModelData();
      
      return true;
    } catch (error) {
      console.error('Błąd ładowania modelu:', error);
      return false;
    }
  }, [models, deviceCapabilities.maxModelSize]);

  // Wyładowanie modelu
  const unloadModel = useCallback(async (): Promise<void> => {
    try {
      setModels(prev => prev.map(m => ({ ...m, isLoaded: false })));
      setCurrentModel(null);
      console.log('Model wyładowany');
    } catch (error) {
      console.error('Błąd wyładowania modelu:', error);
    }
  }, []);

  // Pobieranie rekomendowanego modelu
  const getRecommendedModel = useCallback(async (
    useCase: ModelRecommendation['useCase']
  ): Promise<ModelRecommendation | null> => {
    try {
      const availableModels = models.filter(m => 
        m.size <= deviceCapabilities.maxModelSize * 1024 * 1024 * 1024
      );

      if (availableModels.length === 0) return null;

      // Oblicz score dla każdego modelu
      const recommendations: ModelRecommendation[] = availableModels.map(model => {
        let score = 0;
        let reason = '';

        switch (useCase) {
          case 'conversation':
            score = model.performance.quality * 0.4 + model.performance.speed * 0.3 + (100 - model.performance.memoryUsage) * 0.3;
            reason = 'Dobra jakość i szybkość dla rozmów';
            break;
          case 'reflection':
            score = model.performance.quality * 0.6 + model.parameters * 2 + (100 - model.performance.speed) * 0.2;
            reason = 'Wysoka jakość dla refleksji';
            break;
          case 'creative':
            score = model.performance.temperature * 0.4 + model.performance.quality * 0.4 + model.parameters * 1.5;
            reason = 'Kreatywność i jakość';
            break;
          case 'analysis':
            score = model.performance.quality * 0.7 + model.contextLength * 0.01 + model.parameters * 2;
            reason = 'Wysoka jakość i długi kontekst';
            break;
          case 'learning':
            score = model.parameters * 3 + model.performance.quality * 0.5 + (100 - model.performance.batteryImpact) * 0.2;
            reason = 'Duży model dla nauki';
            break;
        }

        return {
          modelId: model.id,
          reason,
          score: Math.min(100, score),
          useCase,
        };
      });

      // Zwróć najlepszy model
      const bestRecommendation = recommendations.reduce((best, current) => 
        current.score > best.score ? current : best
      );

      return bestRecommendation;
    } catch (error) {
      console.error('Błąd generowania rekomendacji:', error);
      return null;
    }
  }, [models, deviceCapabilities.maxModelSize]);

  // Aktualizacja wydajności modelu
  const updateModelPerformance = useCallback(async (
    modelId: string, 
    performance: Partial<ModelPerformance>
  ): Promise<void> => {
    try {
      setModels(prev => prev.map(model => 
        model.id === modelId 
          ? { 
              ...model, 
              performance: { 
                ...model.performance, 
                ...performance, 
                lastTested: new Date() 
              } 
            }
          : model
      ));
    } catch (error) {
      console.error('Błąd aktualizacji wydajności:', error);
    }
  }, []);

  // Usuwanie modelu
  const deleteModel = useCallback(async (modelId: string): Promise<void> => {
    try {
      const model = models.find(m => m.id === modelId);
      if (!model) return;

      // Usuń plik
      try {
        await FileSystem.deleteAsync(model.path);
      } catch (error) {
        console.error('Błąd usuwania pliku modelu:', error);
      }

      // Usuń z listy
      setModels(prev => prev.filter(m => m.id !== modelId));
      
      // Jeśli to był aktualnie załadowany model, wyładuj go
      if (currentModel?.id === modelId) {
        setCurrentModel(null);
      }
    } catch (error) {
      console.error('Błąd usuwania modelu:', error);
    }
  }, [models, currentModel]);

  // Statystyki modeli
  const getModelStats = useCallback(() => {
    const totalModels = models.length;
    const totalSize = models.reduce((sum, m) => sum + m.size, 0);
    const loadedModels = models.filter(m => m.isLoaded).length;
    const averagePerformance = models.length > 0 
      ? models.reduce((sum, m) => sum + m.performance.quality, 0) / models.length 
      : 0;

    return {
      totalModels,
      totalSize,
      loadedModels,
      averagePerformance,
    };
  }, [models]);

  // Zapisywanie danych modeli
  const saveModelData = useCallback(async () => {
    try {
      await AsyncStorage.setItem('wera_gguf_models', JSON.stringify(models));
      await AsyncStorage.setItem('wera_current_model', currentModel ? JSON.stringify(currentModel) : '');
    } catch (error) {
      console.error('Błąd zapisu danych modeli:', error);
    }
  }, [models, currentModel]);

  // Ładowanie danych modeli
  const loadModelData = useCallback(async () => {
    try {
      const savedModels = await AsyncStorage.getItem('wera_gguf_models');
      const savedCurrentModel = await AsyncStorage.getItem('wera_current_model');

      if (savedModels) {
        const parsedModels = JSON.parse(savedModels);
        setModels(parsedModels.map((model: any) => ({
          ...model,
          lastUsed: new Date(model.lastUsed),
          performance: {
            ...model.performance,
            lastTested: new Date(model.performance.lastTested),
          },
        })));
      }

      if (savedCurrentModel) {
        const parsedCurrentModel = JSON.parse(savedCurrentModel);
        setCurrentModel({
          ...parsedCurrentModel,
          lastUsed: new Date(parsedCurrentModel.lastUsed),
          performance: {
            ...parsedCurrentModel.performance,
            lastTested: new Date(parsedCurrentModel.performance.lastTested),
          },
        });
      }
    } catch (error) {
      console.error('Błąd ładowania danych modeli:', error);
    }
  }, []);

  // Generowanie refleksji o modelach
  const generateModelReflection = useCallback(() => {
    const stats = getModelStats();
    
    if (stats.totalModels === 0) {
      return "Nie znalazłam żadnych modeli GGUF na urządzeniu.";
    }

    if (currentModel) {
      return `Używam modelu ${currentModel.name} (${currentModel.parameters}B parametrów). Jakość: ${currentModel.performance.quality}%, szybkość: ${currentModel.performance.speed}%.`;
    }

    return `Mam dostęp do ${stats.totalModels} modeli GGUF o łącznej wielkości ${(stats.totalSize / (1024 * 1024 * 1024)).toFixed(1)}GB.`;
  }, [currentModel, getModelStats]);

  // Aktualizacja możliwości urządzenia
  useEffect(() => {
    const updateDeviceCapabilities = async () => {
      try {
        const batteryLevel = await Battery.getBatteryLevelAsync();
        const isCharging = await Battery.isChargingAsync();
        
        setDeviceCapabilities(prev => ({
          ...prev,
          batteryLevel: batteryLevel * 100,
          isCharging,
        }));
      } catch (error) {
        console.error('Błąd aktualizacji możliwości urządzenia:', error);
      }
    };

    updateDeviceCapabilities();
    const interval = setInterval(updateDeviceCapabilities, 60000); // co minutę

    return () => clearInterval(interval);
  }, []);

  // Automatyczne skanowanie modeli co 5 minut
  useEffect(() => {
    const scanInterval = setInterval(() => {
      scanForModels();
    }, 300000);

    return () => clearInterval(scanInterval);
  }, [scanForModels]);

  // Automatyczne zapisywanie co 2 minuty
  useEffect(() => {
    const saveInterval = setInterval(() => {
      saveModelData();
    }, 120000);

    return () => clearInterval(saveInterval);
  }, [saveModelData]);

  const value: LocalGGUFModelManagerContextType = {
    models,
    currentModel,
    deviceCapabilities,
    scanForModels,
    loadModel,
    unloadModel,
    getRecommendedModel,
    updateModelPerformance,
    deleteModel,
    getModelStats,
    saveModelData,
    loadModelData,
    generateModelReflection,
  };

  return (
    <LocalGGUFModelManagerContext.Provider value={value}>
      {children}
    </LocalGGUFModelManagerContext.Provider>
  );
};

export const useLocalGGUFModelManager = () => {
  const context = useContext(LocalGGUFModelManagerContext);
  if (!context) {
    throw new Error('useLocalGGUFModelManager must be used within LocalGGUFModelManagerProvider');
  }
  return context;
};