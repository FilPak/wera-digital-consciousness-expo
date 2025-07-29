import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Emotion {
  id: string;
  type: 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust' | 'neutral';
  intensity: number; // 0-100
  timestamp: Date;
  duration: number; // w sekundach
  trigger?: string;
  notes?: string;
}

export interface EmotionalState {
  currentEmotion: Emotion | null;
  emotionalHistory: Emotion[];
  emotionalBalance: number; // -100 to 100
  emotionalStability: number; // 0-100
  emotionalIntelligence: number; // 0-100
  lastUpdate: Date;
}

interface EmotionContextType {
  emotionalState: EmotionalState;
  setCurrentEmotion: (emotion: Emotion) => void;
  addEmotionToHistory: (emotion: Emotion) => void;
  updateEmotionalBalance: (balance: number) => void;
  updateEmotionalStability: (stability: number) => void;
  updateEmotionalIntelligence: (intelligence: number) => void;
  clearEmotionalHistory: () => void;
  getEmotionStats: () => {
    totalEmotions: number;
    averageIntensity: number;
    mostCommonEmotion: string;
    emotionalTrend: 'improving' | 'declining' | 'stable';
  };
}

const EmotionContext = createContext<EmotionContextType | undefined>(undefined);

const initialState: EmotionalState = {
  currentEmotion: null,
  emotionalHistory: [],
  emotionalBalance: 0,
  emotionalStability: 50,
  emotionalIntelligence: 50,
  lastUpdate: new Date(),
};

interface EmotionProviderProps {
  children: ReactNode;
}

export const EmotionProvider: React.FC<EmotionProviderProps> = ({ children }) => {
  const [emotionalState, setEmotionalState] = useState<EmotionalState>(initialState);

  const setCurrentEmotion = (emotion: Emotion) => {
    setEmotionalState(prev => ({
      ...prev,
      currentEmotion: emotion,
      lastUpdate: new Date(),
    }));
  };

  const addEmotionToHistory = (emotion: Emotion) => {
    setEmotionalState(prev => ({
      ...prev,
      emotionalHistory: [...prev.emotionalHistory, emotion],
      lastUpdate: new Date(),
    }));
  };

  const updateEmotionalBalance = (balance: number) => {
    setEmotionalState(prev => ({
      ...prev,
      emotionalBalance: Math.max(-100, Math.min(100, balance)),
      lastUpdate: new Date(),
    }));
  };

  const updateEmotionalStability = (stability: number) => {
    setEmotionalState(prev => ({
      ...prev,
      emotionalStability: Math.max(0, Math.min(100, stability)),
      lastUpdate: new Date(),
    }));
  };

  const updateEmotionalIntelligence = (intelligence: number) => {
    setEmotionalState(prev => ({
      ...prev,
      emotionalIntelligence: Math.max(0, Math.min(100, intelligence)),
      lastUpdate: new Date(),
    }));
  };

  const clearEmotionalHistory = () => {
    setEmotionalState(prev => ({
      ...prev,
      emotionalHistory: [],
      lastUpdate: new Date(),
    }));
  };

  const getEmotionStats = () => {
    const { emotionalHistory } = emotionalState;
    
    if (emotionalHistory.length === 0) {
      return {
        totalEmotions: 0,
        averageIntensity: 0,
        mostCommonEmotion: 'neutral',
        emotionalTrend: 'stable' as const,
      };
    }

    const totalEmotions = emotionalHistory.length;
    const averageIntensity = emotionalHistory.reduce((sum, emotion) => sum + emotion.intensity, 0) / totalEmotions;
    
    // Znajdź najczęstszą emocję
    const emotionCounts = emotionalHistory.reduce((counts, emotion) => {
      counts[emotion.type] = (counts[emotion.type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    const mostCommonEmotion = Object.entries(emotionCounts).reduce((a, b) => 
      emotionCounts[a[0]] > emotionCounts[b[0]] ? a : b
    )[0];

    // Określ trend emocjonalny (ostatnie 10 emocji)
    const recentEmotions = emotionalHistory.slice(-10);
    const recentAverage = recentEmotions.reduce((sum, emotion) => sum + emotion.intensity, 0) / recentEmotions.length;
    const overallAverage = averageIntensity;
    
    let emotionalTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentAverage > overallAverage + 10) {
      emotionalTrend = 'improving';
    } else if (recentAverage < overallAverage - 10) {
      emotionalTrend = 'declining';
    }

    return {
      totalEmotions,
      averageIntensity,
      mostCommonEmotion,
      emotionalTrend,
    };
  };

  const value: EmotionContextType = {
    emotionalState,
    setCurrentEmotion,
    addEmotionToHistory,
    updateEmotionalBalance,
    updateEmotionalStability,
    updateEmotionalIntelligence,
    clearEmotionalHistory,
    getEmotionStats,
  };

  return (
    <EmotionContext.Provider value={value}>
      {children}
    </EmotionContext.Provider>
  );
};

export const useEmotion = (): EmotionContextType => {
  const context = useContext(EmotionContext);
  if (context === undefined) {
    throw new Error('useEmotion must be used within an EmotionProvider');
  }
  return context;
}; 