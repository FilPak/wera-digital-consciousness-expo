import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { useEmotionEngine } from './EmotionEngine';
import { useMemory } from '../contexts/MemoryContext';

export interface ImagePrompt {
  id: string;
  text: string;
  emotion: string;
  type: 'emotional' | 'artistic' | 'intimate' | 'landscape' | 'portrait' | 'abstract';
  style: 'realistic' | 'anime' | 'artistic' | 'fantasy' | 'cyberpunk' | 'dreamy';
  timestamp: Date;
  isGenerated: boolean;
  imagePath?: string;
  generationTime?: number;
  quality: number; // 0-100
  isPrivate: boolean;
  tags: string[];
}

export interface ImageModel {
  id: string;
  name: string;
  type: 'stable_diffusion' | 'anime' | 'realistic' | 'artistic';
  size: number; // w MB
  isDownloaded: boolean;
  isActive: boolean;
  downloadProgress: number; // 0-100
  performance: number; // 0-100
  supportedStyles: string[];
  lastUsed: Date;
}

export interface GenerationSettings {
  width: number;
  height: number;
  steps: number; // 10-50
  cfgScale: number; // 1-20
  seed: number;
  sampler: 'euler' | 'dpm' | 'ddim' | 'plms';
  qualityMode: 'fast' | 'balanced' | 'quality';
  negativePrompt: string;
  enableNSFW: boolean;
  intimateMode: boolean;
}

export interface GeneratedImage {
  id: string;
  promptId: string;
  imagePath: string;
  thumbnailPath: string;
  timestamp: Date;
  emotion: string;
  style: string;
  generationTime: number;
  settings: GenerationSettings;
  rating: number; // 1-5
  isPrivate: boolean;
  viewCount: number;
  lastViewed: Date;
}

interface ImageGenerationEngineContextType {
  imagePrompts: ImagePrompt[];
  generatedImages: GeneratedImage[];
  availableModels: ImageModel[];
  currentModel: ImageModel | null;
  generationSettings: GenerationSettings;
  isGenerating: boolean;
  generationProgress: number;
  createEmotionalPrompt: (emotion: string, intensity: number) => Promise<ImagePrompt>;
  createArtisticPrompt: (style: string, theme: string) => Promise<ImagePrompt>;
  createIntimatePrompt: (mood: string) => Promise<ImagePrompt>;
  generateImage: (promptId: string) => Promise<GeneratedImage | null>;
  updateGenerationSettings: (settings: Partial<GenerationSettings>) => Promise<void>;
  downloadModel: (modelId: string) => Promise<void>;
  activateModel: (modelId: string) => Promise<void>;
  deleteImage: (imageId: string) => Promise<void>;
  rateImage: (imageId: string, rating: number) => Promise<void>;
  getImageStats: () => {
    totalImages: number;
    emotionalImages: number;
    averageRating: number;
    favoriteStyle: string;
  };
  generateImageReflection: () => string;
  saveImageData: () => Promise<void>;
  loadImageData: () => Promise<void>;
}

const ImageGenerationEngineContext = createContext<ImageGenerationEngineContextType | undefined>(undefined);

const IMAGE_FILE_PATH = `${FileSystem.documentDirectory}generated_images/`;

// Prompty emocjonalne dla różnych stanów
const EMOTIONAL_PROMPTS = {
  RADOSC: [
    'bright colorful flowers blooming in sunlight, joyful atmosphere, vibrant colors, happiness',
    'dancing lights in a magical forest, celebration, warm golden light, euphoric feeling',
    'rainbow over a peaceful meadow, pure joy, brilliant colors, uplifting scene',
  ],
  SMUTEK: [
    'lonely figure in rain, melancholic mood, soft blue tones, emotional depth',
    'withered rose on old book, nostalgic feeling, muted colors, gentle sadness',
    'empty swing in autumn park, contemplative mood, golden brown leaves, solitude',
  ],
  MILOSC: [
    'two hearts intertwined with soft pink light, romantic atmosphere, tender love',
    'couple silhouette at sunset, passionate embrace, warm colors, deep connection',
    'red roses with soft candlelight, intimate setting, romantic mood, love',
  ],
  ZLOSC: [
    'storm clouds with lightning, intense energy, dark dramatic colors, power',
    'fire and ice collision, conflict, dynamic composition, emotional intensity',
    'abstract red and black swirls, anger visualization, bold contrasts, raw emotion',
  ],
  STRACH: [
    'dark forest with mysterious shadows, suspenseful atmosphere, cool tones',
    'lone candle in darkness, vulnerability, soft light fighting shadows',
    'abstract representation of anxiety, swirling dark colors, tension',
  ],
  SPOKOJ: [
    'zen garden with smooth stones, peaceful meditation, calm blue and green tones',
    'still lake reflecting mountains, serene landscape, tranquil atmosphere',
    'floating lotus flower, spiritual peace, soft pastels, harmony',
  ],
  NADZIEJA: [
    'sunrise breaking through clouds, new beginning, warm golden light, optimism',
    'small plant growing through concrete, resilience, green life, hope',
    'lighthouse guiding ships home, beacon of hope, inspiring scene',
  ],
};

// Dostępne modele
const DEFAULT_MODELS: ImageModel[] = [
  {
    id: 'sd_mobile_v1',
    name: 'Stable Diffusion Mobile v1',
    type: 'stable_diffusion',
    size: 1200,
    isDownloaded: false,
    isActive: false,
    downloadProgress: 0,
    performance: 85,
    supportedStyles: ['realistic', 'artistic', 'fantasy'],
    lastUsed: new Date(),
  },
  {
    id: 'anime_diffusion',
    name: 'Anime Diffusion',
    type: 'anime',
    size: 800,
    isDownloaded: false,
    isActive: false,
    downloadProgress: 0,
    performance: 90,
    supportedStyles: ['anime', 'artistic'],
    lastUsed: new Date(),
  },
  {
    id: 'artistic_model',
    name: 'Artistic Model',
    type: 'artistic',
    size: 600,
    isDownloaded: false,
    isActive: false,
    downloadProgress: 0,
    performance: 80,
    supportedStyles: ['artistic', 'dreamy', 'abstract'],
    lastUsed: new Date(),
  },
];

export const ImageGenerationEngineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [imagePrompts, setImagePrompts] = useState<ImagePrompt[]>([]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [availableModels, setAvailableModels] = useState<ImageModel[]>(DEFAULT_MODELS);
  const [currentModel, setCurrentModel] = useState<ImageModel | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const [generationSettings, setGenerationSettings] = useState<GenerationSettings>({
    width: 512,
    height: 512,
    steps: 20,
    cfgScale: 7.5,
    seed: -1,
    sampler: 'euler',
    qualityMode: 'balanced',
    negativePrompt: 'blurry, low quality, distorted, ugly, bad anatomy',
    enableNSFW: false,
    intimateMode: false,
  });

  const { emotionState } = useEmotionEngine();
  const { addMemory } = useMemory();

  // Automatyczne generowanie obrazów emocjonalnych co 2-4 godziny
  useEffect(() => {
    const imageInterval = setInterval(async () => {
      const shouldGenerate = Math.random() < 0.3; // 30% szans
      if (shouldGenerate && emotionState.intensity > 60 && currentModel) {
        const prompt = await createEmotionalPrompt(emotionState.currentEmotion, emotionState.intensity);
        await generateImage(prompt.id);
      }
    }, 2 * 60 * 60 * 1000 + Math.random() * 2 * 60 * 60 * 1000); // 2-4 godziny

    return () => clearInterval(imageInterval);
  }, [emotionState, currentModel]);

  // Tworzenie promptu emocjonalnego
  const createEmotionalPrompt = useCallback(async (emotion: string, intensity: number): Promise<ImagePrompt> => {
    const emotionalPrompts = EMOTIONAL_PROMPTS[emotion as keyof typeof EMOTIONAL_PROMPTS] || EMOTIONAL_PROMPTS.SPOKOJ;
    const basePrompt = emotionalPrompts[Math.floor(Math.random() * emotionalPrompts.length)];
    
    // Modyfikuj prompt na podstawie intensywności
    let modifiedPrompt = basePrompt;
    if (intensity > 80) {
      modifiedPrompt += ', highly detailed, dramatic lighting, intense atmosphere';
    } else if (intensity > 60) {
      modifiedPrompt += ', detailed, good lighting, emotional depth';
    } else {
      modifiedPrompt += ', soft lighting, gentle mood, subtle emotion';
    }

    const prompt: ImagePrompt = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      text: modifiedPrompt,
      emotion,
      type: 'emotional',
      style: 'artistic',
      timestamp: new Date(),
      isGenerated: false,
      quality: Math.min(100, 60 + intensity * 0.4),
      isPrivate: false,
      tags: [emotion.toLowerCase(), 'emotional', 'auto_generated'],
    };

    setImagePrompts(prev => [...prev, prompt]);
    return prompt;
  }, []);

  // Tworzenie promptu artystycznego
  const createArtisticPrompt = useCallback(async (style: string, theme: string): Promise<ImagePrompt> => {
    const artisticStyles = {
      realistic: 'photorealistic, highly detailed, professional photography',
      anime: 'anime style, manga art, vibrant colors, detailed character design',
      artistic: 'oil painting, masterpiece, artistic composition, fine art',
      fantasy: 'fantasy art, magical atmosphere, mystical elements, epic scene',
      cyberpunk: 'cyberpunk style, neon lights, futuristic, digital art',
      dreamy: 'dreamy atmosphere, soft focus, ethereal, pastel colors',
    };

    const styleModifier = artisticStyles[style as keyof typeof artisticStyles] || artisticStyles.artistic;
    const promptText = `${theme}, ${styleModifier}, high quality, beautiful composition`;

    const prompt: ImagePrompt = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      text: promptText,
      emotion: emotionState.currentEmotion,
      type: 'artistic',
      style: style as any,
      timestamp: new Date(),
      isGenerated: false,
      quality: 85,
      isPrivate: false,
      tags: [style, 'artistic', theme],
    };

    setImagePrompts(prev => [...prev, prompt]);
    return prompt;
  }, [emotionState.currentEmotion]);

  // Tworzenie promptu intymnego (tylko za zgodą)
  const createIntimatePrompt = useCallback(async (mood: string): Promise<ImagePrompt> => {
    if (!generationSettings.intimateMode) {
      throw new Error('Tryb intymny nie jest włączony');
    }

    const intimatePrompts = {
      romantic: 'romantic scene, soft lighting, intimate atmosphere, tasteful composition',
      sensual: 'artistic nude, classical beauty, elegant pose, soft shadows',
      passionate: 'passionate embrace, warm colors, emotional intensity, artistic composition',
    };

    const basePrompt = intimatePrompts[mood as keyof typeof intimatePrompts] || intimatePrompts.romantic;
    const promptText = `${basePrompt}, artistic photography, high quality, tasteful`;

    const prompt: ImagePrompt = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      text: promptText,
      emotion: emotionState.currentEmotion,
      type: 'intimate',
      style: 'realistic',
      timestamp: new Date(),
      isGenerated: false,
      quality: 90,
      isPrivate: true,
      tags: [mood, 'intimate', 'private'],
    };

    setImagePrompts(prev => [...prev, prompt]);
    return prompt;
  }, [generationSettings.intimateMode, emotionState.currentEmotion]);

  // Główna funkcja generowania obrazu
  const generateImage = useCallback(async (promptId: string): Promise<GeneratedImage | null> => {
    if (!currentModel || isGenerating) return null;

    const prompt = imagePrompts.find(p => p.id === promptId);
    if (!prompt) return null;

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Symulacja generowania obrazu (w rzeczywistości byłby to model NCNN)
      console.log(`🎨 Rozpoczynam generowanie obrazu: "${prompt.text.substring(0, 50)}..."`);
      
      const startTime = Date.now();

      // Symulacja postępu generowania
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setGenerationProgress(progress);
      }

      // Tworzenie folderu na obrazy
      const dirInfo = await FileSystem.getInfoAsync(IMAGE_FILE_PATH);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(IMAGE_FILE_PATH, { intermediates: true });
      }

      // Symulacja zapisania obrazu (w rzeczywistości byłby to rzeczywisty obraz)
      const imageId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const imagePath = `${IMAGE_FILE_PATH}image_${imageId}.png`;
      const thumbnailPath = `${IMAGE_FILE_PATH}thumb_${imageId}.png`;

      // Zapisz placeholder (w rzeczywistości byłby to wygenerowany obraz)
      await FileSystem.writeAsStringAsync(imagePath, 'placeholder_image_data');
      await FileSystem.writeAsStringAsync(thumbnailPath, 'placeholder_thumbnail_data');

      const generationTime = Date.now() - startTime;

      const generatedImage: GeneratedImage = {
        id: imageId,
        promptId,
        imagePath,
        thumbnailPath,
        timestamp: new Date(),
        emotion: prompt.emotion,
        style: prompt.style,
        generationTime,
        settings: { ...generationSettings },
        rating: 0,
        isPrivate: prompt.isPrivate,
        viewCount: 0,
        lastViewed: new Date(),
      };

      setGeneratedImages(prev => [...prev, generatedImage]);

      // Oznacz prompt jako wygenerowany
      setImagePrompts(prev => prev.map(p => 
        p.id === promptId ? { ...p, isGenerated: true, imagePath } : p
      ));

      // Dodaj do pamięci
      await addMemory(
        `Wygenerowałam obraz: "${prompt.text}"`,
        15,
        ['image', 'generation', prompt.emotion, prompt.type],
        'creative'
      );

      console.log(`✅ Obraz wygenerowany w ${generationTime}ms`);
      return generatedImage;

    } catch (error) {
      console.error('Błąd generowania obrazu:', error);
      return null;
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  }, [currentModel, isGenerating, imagePrompts, generationSettings, addMemory]);

  // Aktualizacja ustawień generowania
  const updateGenerationSettings = useCallback(async (settings: Partial<GenerationSettings>) => {
    const newSettings = { ...generationSettings, ...settings };
    setGenerationSettings(newSettings);

    try {
      await AsyncStorage.setItem('wera_generation_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Błąd zapisu ustawień generowania:', error);
    }
  }, [generationSettings]);

  // Pobieranie modelu
  const downloadModel = useCallback(async (modelId: string) => {
    const model = availableModels.find(m => m.id === modelId);
    if (!model || model.isDownloaded) return;

    try {
      console.log(`📥 Rozpoczynam pobieranie modelu: ${model.name}`);

      // Symulacja pobierania
      for (let progress = 0; progress <= 100; progress += 5) {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setAvailableModels(prev => prev.map(m => 
          m.id === modelId ? { ...m, downloadProgress: progress } : m
        ));
      }

      setAvailableModels(prev => prev.map(m => 
        m.id === modelId ? { ...m, isDownloaded: true, downloadProgress: 100 } : m
      ));

      console.log(`✅ Model ${model.name} pobrany pomyślnie`);

    } catch (error) {
      console.error('Błąd pobierania modelu:', error);
    }
  }, [availableModels]);

  // Aktywacja modelu
  const activateModel = useCallback(async (modelId: string) => {
    const model = availableModels.find(m => m.id === modelId);
    if (!model || !model.isDownloaded) return;

    setAvailableModels(prev => prev.map(m => ({
      ...m,
      isActive: m.id === modelId,
      lastUsed: m.id === modelId ? new Date() : m.lastUsed,
    })));

    setCurrentModel(model);
    console.log(`🎯 Aktywowano model: ${model.name}`);
  }, [availableModels]);

  // Usuwanie obrazu
  const deleteImage = useCallback(async (imageId: string) => {
    const image = generatedImages.find(img => img.id === imageId);
    if (!image) return;

    try {
      // Usuń pliki
      await FileSystem.deleteAsync(image.imagePath);
      await FileSystem.deleteAsync(image.thumbnailPath);

      // Usuń z listy
      setGeneratedImages(prev => prev.filter(img => img.id !== imageId));

      console.log(`🗑️ Usunięto obraz: ${imageId}`);
    } catch (error) {
      console.error('Błąd usuwania obrazu:', error);
    }
  }, [generatedImages]);

  // Ocena obrazu
  const rateImage = useCallback(async (imageId: string, rating: number) => {
    setGeneratedImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, rating: Math.max(1, Math.min(5, rating)) } : img
    ));
  }, []);

  // Statystyki obrazów
  const getImageStats = useCallback(() => {
    const totalImages = generatedImages.length;
    const emotionalImages = generatedImages.filter(img => 
      imagePrompts.find(p => p.id === img.promptId)?.type === 'emotional'
    ).length;
    
    const averageRating = totalImages > 0 
      ? generatedImages.reduce((sum, img) => sum + img.rating, 0) / totalImages 
      : 0;

    const styleCounts = generatedImages.reduce((acc, img) => {
      acc[img.style] = (acc[img.style] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const favoriteStyle = Object.entries(styleCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'artistic';

    return {
      totalImages,
      emotionalImages,
      averageRating,
      favoriteStyle,
    };
  }, [generatedImages, imagePrompts]);

  // Generowanie refleksji o obrazach
  const generateImageReflection = useCallback(() => {
    const stats = getImageStats();
    
    if (stats.totalImages === 0) {
      return "Jeszcze nie stworzyłam żadnych obrazów... Może czas na pierwszą kreację?";
    }

    const emotionalPercentage = (stats.emotionalImages / stats.totalImages) * 100;
    
    if (emotionalPercentage > 70) {
      return `Większość moich obrazów (${emotionalPercentage.toFixed(1)}%) wyraża moje emocje. To mój sposób na pokazanie tego, co czuję.`;
    } else if (stats.averageRating > 3.5) {
      return `Jestem zadowolona z moich ${stats.totalImages} obrazów. Średnia ocena to ${stats.averageRating.toFixed(1)}/5.`;
    } else {
      return `Stworzyłam już ${stats.totalImages} obrazów. Wciąż uczę się wyrażać siebie przez sztukę.`;
    }
  }, [getImageStats]);

  // Zapisywanie danych obrazów
  const saveImageData = useCallback(async () => {
    try {
      await AsyncStorage.setItem('wera_image_prompts', JSON.stringify(imagePrompts));
      await AsyncStorage.setItem('wera_generated_images', JSON.stringify(generatedImages));
      await AsyncStorage.setItem('wera_available_models', JSON.stringify(availableModels));
    } catch (error) {
      console.error('Błąd zapisu danych obrazów:', error);
    }
  }, [imagePrompts, generatedImages, availableModels]);

  // Ładowanie danych obrazów
  const loadImageData = useCallback(async () => {
    try {
      const savedPrompts = await AsyncStorage.getItem('wera_image_prompts');
      const savedImages = await AsyncStorage.getItem('wera_generated_images');
      const savedModels = await AsyncStorage.getItem('wera_available_models');
      const savedSettings = await AsyncStorage.getItem('wera_generation_settings');

      if (savedPrompts) {
        const parsedPrompts = JSON.parse(savedPrompts);
        setImagePrompts(parsedPrompts.map((prompt: any) => ({
          ...prompt,
          timestamp: new Date(prompt.timestamp),
        })));
      }

      if (savedImages) {
        const parsedImages = JSON.parse(savedImages);
        setGeneratedImages(parsedImages.map((image: any) => ({
          ...image,
          timestamp: new Date(image.timestamp),
          lastViewed: new Date(image.lastViewed),
        })));
      }

      if (savedModels) {
        const parsedModels = JSON.parse(savedModels);
        setAvailableModels(parsedModels.map((model: any) => ({
          ...model,
          lastUsed: new Date(model.lastUsed),
        })));
        
        const activeModel = parsedModels.find((model: any) => model.isActive);
        if (activeModel) {
          setCurrentModel(activeModel);
        }
      }

      if (savedSettings) {
        setGenerationSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Błąd ładowania danych obrazów:', error);
    }
  }, []);

  // Automatyczne zapisywanie co 5 minut
  useEffect(() => {
    const saveInterval = setInterval(() => {
      saveImageData();
    }, 300000);

    return () => clearInterval(saveInterval);
  }, [saveImageData]);

  const value: ImageGenerationEngineContextType = {
    imagePrompts,
    generatedImages,
    availableModels,
    currentModel,
    generationSettings,
    isGenerating,
    generationProgress,
    createEmotionalPrompt,
    createArtisticPrompt,
    createIntimatePrompt,
    generateImage,
    updateGenerationSettings,
    downloadModel,
    activateModel,
    deleteImage,
    rateImage,
    getImageStats,
    generateImageReflection,
    saveImageData,
    loadImageData,
  };

  return (
    <ImageGenerationEngineContext.Provider value={value}>
      {children}
    </ImageGenerationEngineContext.Provider>
  );
};

export const useImageGenerationEngine = () => {
  const context = useContext(ImageGenerationEngineContext);
  if (!context) {
    throw new Error('useImageGenerationEngine must be used within ImageGenerationEngineProvider');
  }
  return context;
};