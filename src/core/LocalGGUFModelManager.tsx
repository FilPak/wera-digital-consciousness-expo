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
  tokensPerSecond?: number; // rzeczywista szybkość w tokenach/sekundę
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
      console.log('🔍 Rozpoczynam automatyczne skanowanie modeli GGUF...');
      
      // Rozszerzona lista ścieżek do przeszukania
      const searchPaths = [
        // Podstawowe ścieżki aplikacji
        MODELS_FILE_PATH,
        `${FileSystem.documentDirectory}`,
        `${FileSystem.cacheDirectory}`,
        
        // Pamięć zewnętrzna - popularne lokalizacje
        EXTERNAL_STORAGE_PATH,
        '/storage/emulated/0/',
        '/storage/emulated/0/Documents/',
        '/storage/emulated/0/Android/data/',
        '/sdcard/',
        '/sdcard/Download/',
        '/sdcard/Documents/',
        '/sdcard/Models/',
        '/sdcard/AI/',
        '/sdcard/GGUF/',
        
        // Popularne aplikacje AI
        '/storage/emulated/0/Android/data/com.termux/files/home/',
        '/storage/emulated/0/Android/data/org.pytorch.live/files/',
        '/storage/emulated/0/Android/data/com.llamacpp/files/',
        '/storage/emulated/0/Android/data/com.openai/files/',
        '/storage/emulated/0/Android/data/com.anthropic/files/',
        
        // Foldery użytkownika
        '/storage/emulated/0/DCIM/',
        '/storage/emulated/0/Pictures/',
        '/storage/emulated/0/Music/', // Czasami modele są błędnie kategoryzowane
        '/storage/emulated/0/Videos/',
        
        // Karty SD i pamięć zewnętrzna
        '/storage/sdcard1/',
        '/storage/extSdCard/',
        '/mnt/sdcard/',
        '/mnt/external_sd/',
        
        // Systemowe lokalizacje (jeśli root)
        '/data/data/',
        '/system/usr/share/models/',
        '/vendor/etc/models/',
      ];

      // Dodatkowe wzorce nazw plików GGUF
      const ggufPatterns = [
        /\.gguf$/i,
        /\.ggml$/i,
        /\.bin$/i, // Stare formaty
        /llama.*\.bin$/i,
        /mistral.*\.bin$/i,
        /phi.*\.bin$/i,
        /gemma.*\.bin$/i,
        /qwen.*\.bin$/i,
        /chat.*\.bin$/i,
        /instruct.*\.bin$/i,
        /base.*\.bin$/i,
      ];

      // Inteligentne wyszukiwanie z wykorzystaniem metadanych
      for (const searchPath of searchPaths) {
        try {
          console.log(`📂 Przeszukuję: ${searchPath}`);
          const modelsInPath = await deepScanDirectory(searchPath, ggufPatterns, 0, 5); // Max 5 poziomów w głąb
          foundModels.push(...modelsInPath);
        } catch (error) {
          console.warn(`⚠️ Nie można przeszukać ${searchPath}:`, error);
        }
      }

      // Dodatkowe skanowanie na podstawie nazw plików w całym systemie
      const additionalModels = await scanByFileNames();
      foundModels.push(...additionalModels);

      // Skanowanie aplikacji AI w poszukiwaniu modeli
      const appModels = await scanAIApplications();
      foundModels.push(...appModels);

      // Usuń duplikaty na podstawie ścieżki
      const uniqueModels = foundModels.filter((model, index, self) => 
        index === self.findIndex(m => m.path === model.path)
      );

      console.log(`✅ Znaleziono ${uniqueModels.length} unikalnych modeli GGUF`);
      setModels(uniqueModels);
      
      // Automatycznie wybierz najlepszy model dla urządzenia
      if (uniqueModels.length > 0) {
        const recommended = await selectBestModelForDevice(uniqueModels);
        if (recommended) {
          console.log(`🎯 Rekomendowany model: ${recommended.name}`);
          setCurrentModel(recommended);
        }
      }

      return uniqueModels;
    } catch (error) {
      console.error('❌ Błąd podczas skanowania modeli:', error);
      return [];
    }
  }, []);

  // Głębokie skanowanie katalogu z rekurencją
  const deepScanDirectory = async (
    dirPath: string, 
    patterns: RegExp[], 
    currentDepth: number = 0, 
    maxDepth: number = 3
  ): Promise<GGUFModel[]> => {
    const models: GGUFModel[] = [];
    
    if (currentDepth > maxDepth) return models;

    try {
      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      if (!dirInfo.exists || !dirInfo.isDirectory) return models;

      const dirContents = await FileSystem.readDirectoryAsync(dirPath);
      
      for (const item of dirContents) {
        const itemPath = `${dirPath}/${item}`;
        
        try {
          const itemInfo = await FileSystem.getInfoAsync(itemPath);
          
          if (itemInfo.isDirectory) {
            // Rekurencyjnie przeszukaj podkatalogi
            const subModels = await deepScanDirectory(itemPath, patterns, currentDepth + 1, maxDepth);
            models.push(...subModels);
          } else {
            // Sprawdź czy plik pasuje do wzorców GGUF
            const matchesPattern = patterns.some(pattern => pattern.test(item));
            const fileSize = 'size' in itemInfo ? itemInfo.size : 0;
            const isLargeFile = fileSize && fileSize > 100 * 1024 * 1024; // Większy niż 100MB
            
            if (matchesPattern || (isLargeFile && couldBeModel(item))) {
              const model = await analyzeModelFile(itemPath, item, fileSize);
              if (model) {
                models.push(model);
                console.log(`🔍 Znaleziono model: ${model.name} (${formatFileSize(model.size)})`);
              }
            }
          }
        } catch (itemError) {
          // Ignoruj błędy pojedynczych plików
          continue;
        }
      }
    } catch (error) {
      console.warn(`Nie można przeszukać katalogu ${dirPath}:`, error);
    }

    return models;
  };

  // Sprawdź czy plik może być modelem na podstawie nazwy i rozmiaru
  const couldBeModel = (filename: string): boolean => {
    const lowerName = filename.toLowerCase();
    
    // Popularne nazwy modeli
    const modelKeywords = [
      'llama', 'mistral', 'phi', 'gemma', 'qwen', 'alpaca', 'vicuna', 'wizard', 'orca',
      'chat', 'instruct', 'base', 'finetune', 'lora', 'gptq', 'awq', 'ggml', 'gguf',
      'q2_k', 'q3_k', 'q4_k', 'q5_k', 'q6_k', 'q8_0', 'fp16', 'fp32',
      '7b', '13b', '30b', '65b', '70b', '1.3b', '2.7b', '6.7b', '8b', '22b', '34b'
    ];

    return modelKeywords.some(keyword => lowerName.includes(keyword));
  };

  // Skanowanie na podstawie typowych nazw plików modeli
  const scanByFileNames = async (): Promise<GGUFModel[]> => {
    const models: GGUFModel[] = [];
    
    try {
      console.log('🔎 Skanowanie na podstawie nazw plików...');
      
      // Popularne nazwy modeli do wyszukania
      const commonModelNames = [
        'llama-2-7b-chat.gguf',
        'llama-2-13b-chat.gguf',
        'mistral-7b-instruct.gguf',
        'phi-2.gguf',
        'gemma-7b-it.gguf',
        'qwen-7b-chat.gguf',
        'deepseek-coder-6.7b-instruct.gguf',
        'codellama-7b-instruct.gguf',
        'wizardcoder-15b.gguf',
        'orca-mini-7b.gguf',
        'alpaca-7b.gguf',
        'vicuna-7b.gguf',
      ];

      // Użyj find command jeśli dostępny (wymaga roota lub specjalnych uprawnień)
      for (const modelName of commonModelNames) {
        try {
          const foundPaths = await findFilesByName(modelName);
          for (const path of foundPaths) {
            const fileInfo = await FileSystem.getInfoAsync(path);
            if (fileInfo.exists && !fileInfo.isDirectory) {
              const model = await analyzeModelFile(path, modelName, fileInfo.size || 0);
              if (model) {
                models.push(model);
                console.log(`🎯 Znaleziono model po nazwie: ${model.name}`);
              }
            }
          }
        } catch (error) {
          // Ignoruj błędy wyszukiwania konkretnych plików
        }
      }
    } catch (error) {
      console.warn('Błąd skanowania po nazwach:', error);
    }

    return models;
  };

  // Symulacja wyszukiwania plików po nazwie (w rzeczywistości wymagałoby natywnego modułu)
  const findFilesByName = async (filename: string): Promise<string[]> => {
    // W rzeczywistej implementacji użyłbyś natywnego modułu do wyszukiwania
    // Tutaj symulujemy sprawdzenie popularnych lokalizacji
    const possiblePaths = [
      `/storage/emulated/0/Download/${filename}`,
      `/storage/emulated/0/Documents/${filename}`,
      `/storage/emulated/0/Models/${filename}`,
      `/sdcard/Download/${filename}`,
      `/sdcard/AI/${filename}`,
      `${FileSystem.documentDirectory}${filename}`,
    ];

    const existingPaths: string[] = [];
    
    for (const path of possiblePaths) {
      try {
        const info = await FileSystem.getInfoAsync(path);
        if (info.exists) {
          existingPaths.push(path);
        }
      } catch (error) {
        // Ignoruj błędy
      }
    }

    return existingPaths;
  };

  // Skanowanie aplikacji AI w poszukiwaniu modeli
  const scanAIApplications = async (): Promise<GGUFModel[]> => {
    const models: GGUFModel[] = [];
    
    try {
      console.log('🤖 Skanowanie aplikacji AI...');
      
      // Popularne aplikacje AI i ich katalogi z modelami
      const aiApps = [
        {
          name: 'Termux',
          paths: [
            '/storage/emulated/0/Android/data/com.termux/files/home/models/',
            '/storage/emulated/0/Android/data/com.termux/files/usr/share/models/',
          ]
        },
        {
          name: 'LlamaChat',
          paths: [
            '/storage/emulated/0/Android/data/com.llamachat/files/models/',
          ]
        },
        {
          name: 'Ollama',
          paths: [
            '/storage/emulated/0/Android/data/com.ollama/files/models/',
          ]
        },
        {
          name: 'GPT4All',
          paths: [
            '/storage/emulated/0/Android/data/com.gpt4all/files/models/',
          ]
        },
        {
          name: 'LocalAI',
          paths: [
            '/storage/emulated/0/Android/data/com.localai/files/models/',
          ]
        }
      ];

      for (const app of aiApps) {
        for (const path of app.paths) {
          try {
            const appModels = await deepScanDirectory(path, [/\.gguf$/i, /\.ggml$/i], 0, 2);
            if (appModels.length > 0) {
              console.log(`📱 Znaleziono ${appModels.length} modeli w ${app.name}`);
              models.push(...appModels.map(model => ({
                ...model,
                tags: [...model.tags, app.name.toLowerCase(), 'external_app']
              })));
            }
          } catch (error) {
            // Ignoruj błędy aplikacji
          }
        }
      }
    } catch (error) {
      console.warn('Błąd skanowania aplikacji AI:', error);
    }

    return models;
  };

  // Wybór najlepszego modelu dla urządzenia
  const selectBestModelForDevice = async (availableModels: GGUFModel[]): Promise<GGUFModel | null> => {
    if (availableModels.length === 0) return null;

    try {
      // Aktualizuj możliwości urządzenia
      await updateDeviceCapabilities();

      // Kryteria wyboru modelu
      const scoredModels = availableModels.map(model => {
        let score = 0;

        // Rozmiar modelu vs dostępna pamięć
        const sizeGB = model.size / (1024 * 1024 * 1024);
        if (sizeGB <= deviceCapabilities.maxModelSize) {
          score += 30; // Pasuje do pamięci
          
          // Bonus za optymalne wykorzystanie pamięci
          const memoryUtilization = sizeGB / deviceCapabilities.maxModelSize;
          if (memoryUtilization > 0.5 && memoryUtilization < 0.8) {
            score += 20; // Optymalne wykorzystanie 50-80%
          }
        } else {
          score -= 50; // Za duży model
        }

        // Typ modelu - preferuj chat/instruct
        if (model.name.toLowerCase().includes('chat') || 
            model.name.toLowerCase().includes('instruct')) {
          score += 25;
        }

        // Kwantyzacja - preferuj Q4_K dla balansu
        if (model.quantization === 'Q4_K') {
          score += 20;
        } else if (model.quantization === 'Q5_K') {
          score += 15;
        } else if (model.quantization === 'Q3_K') {
          score += 10;
        }

        // Popularność modelu
        const popularModels = ['llama', 'mistral', 'phi', 'gemma'];
        if (popularModels.some(popular => model.name.toLowerCase().includes(popular))) {
          score += 15;
        }

        // Ostatnie użycie
        if (model.usageCount > 0) {
          score += 10;
        }

        // Performance jeśli dostępne
        if (model.performance.speed > 0) {
          score += model.performance.speed * 0.1;
          score += model.performance.quality * 0.1;
          score -= model.performance.memoryUsage * 0.05;
          score -= model.performance.batteryImpact * 0.05;
        }

        return { model, score };
      });

      // Sortuj według wyniku
      scoredModels.sort((a, b) => b.score - a.score);

      const bestModel = scoredModels[0]?.model;
      if (bestModel) {
        // Oznacz jako rekomendowany
        bestModel.isRecommended = true;
        console.log(`🏆 Najlepszy model dla urządzenia: ${bestModel.name} (wynik: ${scoredModels[0].score.toFixed(1)})`);
      }

      return bestModel;
    } catch (error) {
      console.error('Błąd wyboru najlepszego modelu:', error);
      return availableModels[0]; // Zwróć pierwszy dostępny
    }
  };

  // Formatowanie rozmiaru pliku
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Analiza pliku modelu
  const analyzeModelFile = useCallback(async (
    path: string, 
    filename: string, 
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
  const updateDeviceCapabilities = useCallback(async () => {
    try {
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const isCharging = false; // Battery.isChargingAsync not available in current Expo SDK
      
      setDeviceCapabilities(prev => ({
        ...prev,
        batteryLevel: batteryLevel * 100,
        isCharging,
        timestamp: new Date(),
      }));
    } catch (error) {
      console.error('Błąd aktualizacji capabilities:', error);
    }
  }, []);

  // Aktualizacja możliwości urządzenia
  useEffect(() => {
    updateDeviceCapabilities();
    const interval = setInterval(updateDeviceCapabilities, 60000); // co minutę

    return () => clearInterval(interval);
  }, [updateDeviceCapabilities]);

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