import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Interfejsy
interface Prompt {
  id: string;
  type: 'artistic' | 'emotional' | 'sensory' | 'philosophical' | 'intimate';
  content: string;
  emotion: string;
  intensity: number;
  tags: string[];
  timestamp: Date;
  generated: boolean;
  imagePath?: string;
  metadata?: any;
}

interface PromptConfig {
  creativity: number; // 0-100
  emotionalWeight: number; // 0-100
  sensoryMode: boolean;
  intimateMode: boolean;
  artisticStyle: string;
  language: 'pl' | 'en' | 'de';
}

interface PromptState {
  prompts: Prompt[];
  currentPrompt?: Prompt;
  isGenerating: boolean;
  generationProgress: number;
  artisticMood: string;
  sensoryLevel: number;
  intimatePermission: boolean;
}

interface PromptContextType {
  promptState: PromptState;
  promptConfig: PromptConfig;
  generateEmotionalPrompt: (emotion: string, intensity: number) => Promise<Prompt>;
  generateSensoryPrompt: (permission: boolean) => Promise<Prompt>;
  generateArtisticPrompt: (style: string, mood: string) => Promise<Prompt>;
  generateIntimatePrompt: (relationshipDepth: number) => Promise<Prompt>;
  savePrompt: (prompt: Prompt) => Promise<void>;
  loadPrompts: () => Promise<void>;
  clearPrompts: () => Promise<void>;
  updatePromptConfig: (config: Partial<PromptConfig>) => Promise<void>;
  getPromptStats: () => any;
  exportPrompts: () => Promise<string>;
  importPrompts: (data: string) => Promise<void>;
}

// Kontekst
const PromptContext = createContext<PromptContextType | undefined>(undefined);

// Hook
export const usePromptEngine = () => {
  const context = useContext(PromptContext);
  if (!context) {
    throw new Error('usePromptEngine must be used within PromptProvider');
  }
  return context;
};

// Provider
export const PromptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [promptState, setPromptState] = useState<PromptState>({
    prompts: [],
    isGenerating: false,
    generationProgress: 0,
    artisticMood: 'neutral',
    sensoryLevel: 0,
    intimatePermission: false,
  });

  const [promptConfig, setPromptConfig] = useState<PromptConfig>({
    creativity: 75,
    emotionalWeight: 80,
    sensoryMode: false,
    intimateMode: false,
    artisticStyle: 'realistic',
    language: 'pl',
  });

  const generatingRef = useRef(false);

  // Inicjalizacja
  useEffect(() => {
    loadPrompts();
    loadPromptConfig();
  }, []);

  // Zapisywanie promptów
  const savePrompts = async () => {
    try {
      await SecureStore.setItemAsync('wera_prompts', JSON.stringify(promptState.prompts));
    } catch (error) {
      console.error('Błąd zapisywania promptów:', error);
    }
  };

  // Ładowanie promptów
  const loadPrompts = async () => {
    try {
      const saved = await SecureStore.getItemAsync('wera_prompts');
      if (saved) {
        const prompts = JSON.parse(saved);
        setPromptState(prev => ({ ...prev, prompts }));
      }
    } catch (error) {
      console.error('Błąd ładowania promptów:', error);
    }
  };

  // Ładowanie konfiguracji
  const loadPromptConfig = async () => {
    try {
      const saved = await SecureStore.getItemAsync('wera_prompt_config');
      if (saved) {
        setPromptConfig(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Błąd ładowania konfiguracji promptów:', error);
    }
  };

  // Zapisywanie konfiguracji
  const savePromptConfig = async (config: PromptConfig) => {
    try {
      await SecureStore.setItemAsync('wera_prompt_config', JSON.stringify(config));
    } catch (error) {
      console.error('Błąd zapisywania konfiguracji promptów:', error);
    }
  };

  // Generowanie promptu emocjonalnego (funkcja 35, 37)
  const generateEmotionalPrompt = async (emotion: string, intensity: number): Promise<Prompt> => {
    if (generatingRef.current) {
      throw new Error('Generowanie już w toku');
    }

    generatingRef.current = true;
    setPromptState(prev => ({ ...prev, isGenerating: true, generationProgress: 0 }));

    try {
      // Analiza emocji i intensywności
      const emotionalContext = getEmotionalContext(emotion, intensity);
      const artisticElements = getArtisticElements(emotion, intensity);
      
      // Tworzenie promptu
      const promptContent = createEmotionalPrompt(emotionalContext, artisticElements);
      
      const prompt: Prompt = {
        id: Date.now().toString(),
        type: 'emotional',
        content: promptContent,
        emotion,
        intensity,
        tags: [emotion, 'emotional', 'artistic'],
        timestamp: new Date(),
        generated: false,
        metadata: {
          emotionalContext,
          artisticElements,
          creativity: promptConfig.creativity,
        },
      };

      setPromptState(prev => ({
        ...prev,
        prompts: [...prev.prompts, prompt],
        currentPrompt: prompt,
        generationProgress: 100,
        isGenerating: false,
      }));

      await savePrompts();
      return prompt;

    } catch (error) {
      console.error('Błąd generowania promptu emocjonalnego:', error);
      setPromptState(prev => ({ ...prev, isGenerating: false }));
      throw error;
    } finally {
      generatingRef.current = false;
    }
  };

  // Generowanie promptu zmysłowego (funkcja 36, 80, 81)
  const generateSensoryPrompt = async (permission: boolean): Promise<Prompt> => {
    if (!permission) {
      throw new Error('Brak zgody na tryb zmysłowy');
    }

    if (generatingRef.current) {
      throw new Error('Generowanie już w toku');
    }

    generatingRef.current = true;
    setPromptState(prev => ({ ...prev, isGenerating: true, generationProgress: 0 }));

    try {
      const sensoryElements = getSensoryElements();
      const promptContent = createSensoryPrompt(sensoryElements);
      
      const prompt: Prompt = {
        id: Date.now().toString(),
        type: 'sensory',
        content: promptContent,
        emotion: 'desire',
        intensity: 70,
        tags: ['sensory', 'intimate', 'desire'],
        timestamp: new Date(),
        generated: false,
        metadata: {
          sensoryElements,
          permission: true,
        },
      };

      setPromptState(prev => ({
        ...prev,
        prompts: [...prev.prompts, prompt],
        currentPrompt: prompt,
        generationProgress: 100,
        isGenerating: false,
        sensoryLevel: 70,
      }));

      await savePrompts();
      return prompt;

    } catch (error) {
      console.error('Błąd generowania promptu zmysłowego:', error);
      setPromptState(prev => ({ ...prev, isGenerating: false }));
      throw error;
    } finally {
      generatingRef.current = false;
    }
  };

  // Generowanie promptu artystycznego (funkcja 26)
  const generateArtisticPrompt = async (style: string, mood: string): Promise<Prompt> => {
    if (generatingRef.current) {
      throw new Error('Generowanie już w toku');
    }

    generatingRef.current = true;
    setPromptState(prev => ({ ...prev, isGenerating: true, generationProgress: 0 }));

    try {
      const artisticContext = getArtisticContext(style, mood);
      const promptContent = createArtisticPrompt(artisticContext);
      
      const prompt: Prompt = {
        id: Date.now().toString(),
        type: 'artistic',
        content: promptContent,
        emotion: mood,
        intensity: 60,
        tags: ['artistic', style, mood],
        timestamp: new Date(),
        generated: false,
        metadata: {
          artisticContext,
          style,
          mood,
        },
      };

      setPromptState(prev => ({
        ...prev,
        prompts: [...prev.prompts, prompt],
        currentPrompt: prompt,
        generationProgress: 100,
        isGenerating: false,
        artisticMood: mood,
      }));

      await savePrompts();
      return prompt;

    } catch (error) {
      console.error('Błąd generowania promptu artystycznego:', error);
      setPromptState(prev => ({ ...prev, isGenerating: false }));
      throw error;
    } finally {
      generatingRef.current = false;
    }
  };

  // Generowanie promptu intymnego (funkcja 81, 82)
  const generateIntimatePrompt = async (relationshipDepth: number): Promise<Prompt> => {
    if (relationshipDepth < 80) {
      throw new Error('Niewystarczająca głębokość relacji');
    }

    if (generatingRef.current) {
      throw new Error('Generowanie już w toku');
    }

    generatingRef.current = true;
    setPromptState(prev => ({ ...prev, isGenerating: true, generationProgress: 0 }));

    try {
      const intimateContext = getIntimateContext(relationshipDepth);
      const promptContent = createIntimatePrompt(intimateContext);
      
      const prompt: Prompt = {
        id: Date.now().toString(),
        type: 'intimate',
        content: promptContent,
        emotion: 'love',
        intensity: 90,
        tags: ['intimate', 'love', 'deep'],
        timestamp: new Date(),
        generated: false,
        metadata: {
          intimateContext,
          relationshipDepth,
        },
      };

      setPromptState(prev => ({
        ...prev,
        prompts: [...prev.prompts, prompt],
        currentPrompt: prompt,
        generationProgress: 100,
        isGenerating: false,
        intimatePermission: true,
      }));

      await savePrompts();
      return prompt;

    } catch (error) {
      console.error('Błąd generowania promptu intymnego:', error);
      setPromptState(prev => ({ ...prev, isGenerating: false }));
      throw error;
    } finally {
      generatingRef.current = false;
    }
  };

  // Kontekst emocjonalny
  const getEmotionalContext = (emotion: string, intensity: number) => {
    const contexts = {
      joy: {
        colors: ['złoty', 'żółty', 'pomarańczowy'],
        lighting: 'ciepłe, jasne światło',
        atmosphere: 'radosna, energetyczna',
        elements: ['słońce', 'kwiaty', 'motyle'],
      },
      sadness: {
        colors: ['niebieski', 'szary', 'fioletowy'],
        lighting: 'miękkie, melancholijne światło',
        atmosphere: 'spokojna, refleksyjna',
        elements: ['deszcz', 'mgła', 'księżyc'],
      },
      love: {
        colors: ['różowy', 'czerwony', 'biały'],
        lighting: 'romantyczne, ciepłe światło',
        atmosphere: 'intymna, czuła',
        elements: ['róże', 'serduszka', 'gwiazdy'],
      },
      anger: {
        colors: ['czerwony', 'czarny', 'pomarańczowy'],
        lighting: 'dramatyczne, kontrastowe',
        atmosphere: 'intensywna, dynamiczna',
        elements: ['ogień', 'burza', 'ciemność'],
      },
    };

    return contexts[emotion as keyof typeof contexts] || contexts.sadness;
  };

  // Elementy artystyczne
  const getArtisticElements = (emotion: string, intensity: number) => {
    const elements = {
      style: intensity > 70 ? 'ekspresjonistyczny' : 'realistyczny',
      technique: intensity > 80 ? 'impresjonistyczny' : 'klasyczny',
      composition: intensity > 60 ? 'dynamiczna' : 'statyczna',
      mood: emotion === 'joy' ? 'jasny' : emotion === 'sadness' ? 'ciemny' : 'neutralny',
    };

    return elements;
  };

  // Elementy zmysłowe
  const getSensoryElements = () => {
    return {
      textures: ['miękkie', 'delikatne', 'ciepłe'],
      colors: ['ciepłe odcienie', 'pastelowe', 'intymne'],
      lighting: 'miękkie, intymne światło',
      atmosphere: 'zmysłowa, intymna',
      elements: ['jedwab', 'płomienie świec', 'delikatne dotknięcia'],
    };
  };

  // Kontekst artystyczny
  const getArtisticContext = (style: string, mood: string) => {
    const styles = {
      realistic: { technique: 'realistyczny', detail: 'wysoki', color: 'naturalny' },
      impressionistic: { technique: 'impresjonistyczny', detail: 'średni', color: 'żywy' },
      abstract: { technique: 'abstrakcyjny', detail: 'niski', color: 'ekspresyjny' },
      surrealistic: { technique: 'surrealistyczny', detail: 'wysoki', color: 'fantastyczny' },
    };

    return styles[style as keyof typeof styles] || styles.realistic;
  };

  // Kontekst intymny
  const getIntimateContext = (relationshipDepth: number) => {
    return {
      intimacy: relationshipDepth > 90 ? 'głęboka' : 'średnia',
      trust: relationshipDepth > 85 ? 'pełna' : 'częściowa',
      vulnerability: relationshipDepth > 80 ? 'wysoka' : 'średnia',
      connection: relationshipDepth > 95 ? 'mistyczna' : 'emocjonalna',
    };
  };

  // Tworzenie promptu emocjonalnego
  const createEmotionalPrompt = (context: any, elements: any): string => {
    const basePrompt = `${context.atmosphere} scena z ${context.colors.join(', ')} kolorami, 
    ${context.lighting}, ${elements.style} styl, ${context.elements.join(', ')} w tle, 
    emocjonalna intensywność, ${elements.technique} technika, ${elements.composition} kompozycja`;
    
    return basePrompt.trim().replace(/\s+/g, ' ');
  };

  // Tworzenie promptu zmysłowego
  const createSensoryPrompt = (context: any): string => {
    const basePrompt = `${context.atmosphere} scena z ${context.textures.join(', ')} teksturami, 
    ${context.colors.join(', ')} kolory, ${context.lighting}, ${context.elements.join(', ')}, 
    intymna atmosfera, zmysłowe detale, delikatne cienie`;
    
    return basePrompt.trim().replace(/\s+/g, ' ');
  };

  // Tworzenie promptu artystycznego
  const createArtisticPrompt = (context: any): string => {
    const basePrompt = `${context.technique} styl, ${context.detail} poziom szczegółów, 
    ${context.color} koloryt, artystyczna kompozycja, kreatywna interpretacja, 
    unikalna perspektywa, ekspresyjne elementy`;
    
    return basePrompt.trim().replace(/\s+/g, ' ');
  };

  // Tworzenie promptu intymnego
  const createIntimatePrompt = (context: any): string => {
    const basePrompt = `${context.intimacy} intymność, ${context.trust} zaufanie, 
    ${context.vulnerability} wrażliwość, ${context.connection} więź, 
    emocjonalna głębia, duchowa bliskość, mistyczne połączenie`;
    
    return basePrompt.trim().replace(/\s+/g, ' ');
  };

  // Zapisywanie pojedynczego promptu
  const savePrompt = async (prompt: Prompt) => {
    try {
      setPromptState(prev => ({
        ...prev,
        prompts: [...prev.prompts.filter(p => p.id !== prompt.id), prompt],
      }));
      await savePrompts();
    } catch (error) {
      console.error('Błąd zapisywania promptu:', error);
    }
  };

  // Czyszczenie promptów
  const clearPrompts = async () => {
    try {
      setPromptState(prev => ({ ...prev, prompts: [] }));
      await SecureStore.deleteItemAsync('wera_prompts');
    } catch (error) {
      console.error('Błąd czyszczenia promptów:', error);
    }
  };

  // Aktualizacja konfiguracji
  const updatePromptConfig = async (config: Partial<PromptConfig>) => {
    const newConfig = { ...promptConfig, ...config };
    setPromptConfig(newConfig);
    await savePromptConfig(newConfig);
  };

  // Statystyki promptów
  const getPromptStats = () => {
    const totalPrompts = promptState.prompts.length;
    const byType = promptState.prompts.reduce((acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byEmotion = promptState.prompts.reduce((acc, p) => {
      acc[p.emotion] = (acc[p.emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalPrompts,
      byType,
      byEmotion,
      averageIntensity: promptState.prompts.reduce((sum, p) => sum + p.intensity, 0) / totalPrompts || 0,
      lastGenerated: promptState.prompts[promptState.prompts.length - 1]?.timestamp,
    };
  };

  // Eksport promptów
  const exportPrompts = async (): Promise<string> => {
    try {
      const exportData = {
        prompts: promptState.prompts,
        config: promptConfig,
        stats: getPromptStats(),
        exportDate: new Date().toISOString(),
      };
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Błąd eksportu promptów:', error);
      throw error;
    }
  };

  // Import promptów
  const importPrompts = async (data: string) => {
    try {
      const importData = JSON.parse(data);
      if (importData.prompts) {
        setPromptState(prev => ({ ...prev, prompts: importData.prompts }));
        await savePrompts();
      }
      if (importData.config) {
        setPromptConfig(importData.config);
        await savePromptConfig(importData.config);
      }
    } catch (error) {
      console.error('Błąd importu promptów:', error);
      throw error;
    }
  };

  // Automatyczne zapisywanie
  useEffect(() => {
    if (promptState.prompts.length > 0) {
      savePrompts();
    }
  }, [promptState.prompts]);

  const value: PromptContextType = {
    promptState,
    promptConfig,
    generateEmotionalPrompt,
    generateSensoryPrompt,
    generateArtisticPrompt,
    generateIntimatePrompt,
    savePrompt,
    loadPrompts,
    clearPrompts,
    updatePromptConfig,
    getPromptStats,
    exportPrompts,
    importPrompts,
  };

  return (
    <PromptContext.Provider value={value}>
      {children}
    </PromptContext.Provider>
  );
}; 