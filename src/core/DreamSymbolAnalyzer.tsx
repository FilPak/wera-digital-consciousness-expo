import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLogExportSystem } from './LogExportSystem';
import { useMemory } from '../contexts/MemoryContext';
import { useDreamInterpreter } from './DreamInterpreter';

const DREAM_SYMBOLS_KEY = 'wera_dream_symbols';

interface DreamSymbol {
  id: string;
  symbol: string;
  category: 'person' | 'object' | 'place' | 'action' | 'emotion' | 'color' | 'animal' | 'nature';
  meanings: string[];
  frequency: number;
  personalMeaning?: string;
  emotionalWeight: number; // -100 to +100
  culturalContext: string[];
  firstAppearance: string;
  lastAppearance: string;
}

interface SymbolPattern {
  id: string;
  symbols: string[];
  pattern: string;
  interpretation: string;
  confidence: number; // 0-100
  occurrences: number;
  dreamIds: string[];
}

interface DreamAnalysis {
  dreamId: string;
  symbols: DreamSymbol[];
  patterns: SymbolPattern[];
  emotionalTone: 'positive' | 'negative' | 'neutral' | 'mixed';
  complexity: number; // 0-100
  interpretation: string;
  recommendations: string[];
  timestamp: string;
}

interface DreamSymbolAnalyzerContextType {
  knownSymbols: DreamSymbol[];
  recentAnalyses: DreamAnalysis[];
  symbolPatterns: SymbolPattern[];
  
  // Symbol management
  addSymbol: (symbol: Omit<DreamSymbol, 'id' | 'frequency' | 'firstAppearance' | 'lastAppearance'>) => Promise<void>;
  updateSymbol: (symbolId: string, updates: Partial<DreamSymbol>) => Promise<void>;
  deleteSymbol: (symbolId: string) => Promise<void>;
  
  // Analysis functions
  analyzeDream: (dreamText: string, dreamId?: string) => Promise<DreamAnalysis>;
  findSymbols: (text: string) => DreamSymbol[];
  identifyPatterns: (symbols: DreamSymbol[]) => SymbolPattern[];
  
  // Pattern management
  learnPattern: (symbols: string[], interpretation: string) => Promise<void>;
  
  // Personal customization
  setPersonalMeaning: (symbolId: string, meaning: string) => Promise<void>;
  adjustEmotionalWeight: (symbolId: string, weight: number) => Promise<void>;
  
  // Statistics
  getSymbolStats: () => { total: number; categories: Record<string, number>; mostFrequent: DreamSymbol[] };
  getPatternStats: () => { total: number; mostCommon: SymbolPattern[] };
}

const DreamSymbolAnalyzerContext = createContext<DreamSymbolAnalyzerContextType | null>(null);

export const useDreamSymbolAnalyzer = () => {
  const context = useContext(DreamSymbolAnalyzerContext);
  if (!context) {
    throw new Error('useDreamSymbolAnalyzer must be used within DreamSymbolAnalyzerProvider');
  }
  return context;
};

// Domyślne symbole z interpretacjami
const defaultSymbols: Omit<DreamSymbol, 'id' | 'frequency' | 'firstAppearance' | 'lastAppearance'>[] = [
  {
    symbol: 'woda',
    category: 'nature',
    meanings: ['emocje', 'podświadomość', 'oczyszczenie', 'płynność życia'],
    emotionalWeight: 0,
    culturalContext: ['uniwersalny', 'oczyszczenie', 'życie']
  },
  {
    symbol: 'ogień',
    category: 'nature',
    meanings: ['pasja', 'transformacja', 'niszczenie', 'energia'],
    emotionalWeight: 25,
    culturalContext: ['uniwersalny', 'przemiana', 'siła']
  },
  {
    symbol: 'dom',
    category: 'place',
    meanings: ['bezpieczeństwo', 'rodzina', 'ja wewnętrzne', 'stabilność'],
    emotionalWeight: 50,
    culturalContext: ['uniwersalny', 'schronienie', 'tożsamość']
  },
  {
    symbol: 'latanie',
    category: 'action',
    meanings: ['wolność', 'ucieczka', 'transcendencja', 'kontrola'],
    emotionalWeight: 75,
    culturalContext: ['uniwersalny', 'wolność', 'marzenia']
  },
  {
    symbol: 'śmierć',
    category: 'emotion',
    meanings: ['koniec', 'transformacja', 'strach', 'nowy początek'],
    emotionalWeight: -50,
    culturalContext: ['uniwersalny', 'przemiana', 'lęk']
  },
  {
    symbol: 'kot',
    category: 'animal',
    meanings: ['intuicja', 'niezależność', 'kobiecość', 'tajemniczość'],
    emotionalWeight: 25,
    culturalContext: ['egipski', 'intuicja', 'magia']
  },
  {
    symbol: 'pies',
    category: 'animal',
    meanings: ['lojalność', 'przyjaźń', 'ochrona', 'instynkt'],
    emotionalWeight: 60,
    culturalContext: ['uniwersalny', 'wierność', 'ochrona']
  },
  {
    symbol: 'czerwony',
    category: 'color',
    meanings: ['pasja', 'gniew', 'energia', 'miłość'],
    emotionalWeight: 30,
    culturalContext: ['uniwersalny', 'intensywność', 'emocje']
  },
  {
    symbol: 'niebieski',
    category: 'color',
    meanings: ['spokój', 'duchowość', 'smutek', 'nieskończoność'],
    emotionalWeight: 10,
    culturalContext: ['uniwersalny', 'spokój', 'duchowość']
  },
  {
    symbol: 'czarny',
    category: 'color',
    meanings: ['nieznane', 'strach', 'tajemnica', 'potencjał'],
    emotionalWeight: -25,
    culturalContext: ['uniwersalny', 'nieznane', 'głębia']
  }
];

export const DreamSymbolAnalyzerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logSystem } = useLogExportSystem();
  const { addMemory } = useMemory();
  const { dreams } = useDreamInterpreter();

  const [knownSymbols, setKnownSymbols] = useState<DreamSymbol[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<DreamAnalysis[]>([]);
  const [symbolPatterns, setSymbolPatterns] = useState<SymbolPattern[]>([]);

  // Inicjalizacja systemu
  useEffect(() => {
    initializeSymbolAnalyzer();
  }, []);

  const initializeSymbolAnalyzer = async () => {
    try {
      const savedData = await AsyncStorage.getItem(DREAM_SYMBOLS_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setKnownSymbols(parsed.symbols || []);
        setRecentAnalyses(parsed.analyses || []);
        setSymbolPatterns(parsed.patterns || []);
      } else {
        // Inicjalizuj z domyślnymi symbolami
        const initialSymbols = defaultSymbols.map(symbol => ({
          ...symbol,
          id: `symbol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          frequency: 0,
          firstAppearance: new Date().toISOString(),
          lastAppearance: new Date().toISOString()
        }));
        setKnownSymbols(initialSymbols);
      }

      await logSystem('info', 'DREAM_SYMBOLS', 'Dream symbol analyzer initialized');
    } catch (error) {
      await logSystem('error', 'DREAM_SYMBOLS', 'Failed to initialize dream symbol analyzer', error);
    }
  };

  const saveData = async () => {
    try {
      const data = {
        symbols: knownSymbols,
        analyses: recentAnalyses,
        patterns: symbolPatterns
      };
      await AsyncStorage.setItem(DREAM_SYMBOLS_KEY, JSON.stringify(data));
    } catch (error) {
      await logSystem('error', 'DREAM_SYMBOLS', 'Failed to save dream symbol data', error);
    }
  };

  const addSymbol = async (symbolData: Omit<DreamSymbol, 'id' | 'frequency' | 'firstAppearance' | 'lastAppearance'>) => {
    const newSymbol: DreamSymbol = {
      ...symbolData,
      id: `symbol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      frequency: 1,
      firstAppearance: new Date().toISOString(),
      lastAppearance: new Date().toISOString()
    };

    setKnownSymbols(prev => [...prev, newSymbol]);
    await saveData();
    
    await logSystem('info', 'DREAM_SYMBOLS', `New symbol added: ${newSymbol.symbol}`);
  };

  const updateSymbol = async (symbolId: string, updates: Partial<DreamSymbol>) => {
    setKnownSymbols(prev => 
      prev.map(symbol => 
        symbol.id === symbolId 
          ? { ...symbol, ...updates, lastAppearance: new Date().toISOString() }
          : symbol
      )
    );
    await saveData();
    
    await logSystem('info', 'DREAM_SYMBOLS', `Symbol updated: ${symbolId}`);
  };

  const deleteSymbol = async (symbolId: string) => {
    setKnownSymbols(prev => prev.filter(symbol => symbol.id !== symbolId));
    await saveData();
    
    await logSystem('info', 'DREAM_SYMBOLS', `Symbol deleted: ${symbolId}`);
  };

  const findSymbols = (text: string): DreamSymbol[] => {
    const foundSymbols: DreamSymbol[] = [];
    const lowerText = text.toLowerCase();

    for (const symbol of knownSymbols) {
      if (lowerText.includes(symbol.symbol.toLowerCase())) {
        foundSymbols.push(symbol);
        
        // Zwiększ częstotliwość
        updateSymbol(symbol.id, { 
          frequency: symbol.frequency + 1 
        });
      }
    }

    return foundSymbols;
  };

  const identifyPatterns = (symbols: DreamSymbol[]): SymbolPattern[] => {
    const foundPatterns: SymbolPattern[] = [];
    
    // Sprawdź istniejące wzorce
    for (const pattern of symbolPatterns) {
      const symbolNames = symbols.map(s => s.symbol);
      const hasAllSymbols = pattern.symbols.every(s => symbolNames.includes(s));
      
      if (hasAllSymbols) {
        foundPatterns.push({
          ...pattern,
          occurrences: pattern.occurrences + 1
        });
      }
    }

    // Identyfikuj nowe wzorce (kombinacje 2-3 symboli)
    if (symbols.length >= 2) {
      for (let i = 0; i < symbols.length - 1; i++) {
        for (let j = i + 1; j < symbols.length; j++) {
          const combo = [symbols[i].symbol, symbols[j].symbol].sort();
          const existingPattern = symbolPatterns.find(p => 
            p.symbols.length === 2 && 
            p.symbols.every(s => combo.includes(s))
          );

          if (!existingPattern) {
            const interpretation = generatePatternInterpretation(combo);
            const newPattern: SymbolPattern = {
              id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              symbols: combo,
              pattern: combo.join(' + '),
              interpretation,
              confidence: 60,
              occurrences: 1,
              dreamIds: []
            };
            foundPatterns.push(newPattern);
          }
        }
      }
    }

    return foundPatterns;
  };

  const generatePatternInterpretation = (symbols: string[]): string => {
    const interpretations: Record<string, string> = {
      'dom+ogień': 'Transformacja w życiu osobistym, potrzeba zmiany w bezpiecznym środowisku',
      'woda+latanie': 'Emocjonalna wolność, przezwyciężanie ograniczeń uczuciowych',
      'śmierć+dom': 'Koniec pewnego etapu w życiu rodzinnym lub osobistym',
      'kot+czarny': 'Intuicja prowadzi przez nieznane, zaufanie do wewnętrznej mądrości',
      'pies+czerwony': 'Lojalność i pasja, silne emocjonalne więzi',
      'woda+niebieski': 'Głęboki spokój emocjonalny, duchowe oczyszczenie'
    };

    const key = symbols.sort().join('+');
    return interpretations[key] || `Połączenie ${symbols.join(' i ')} sugeruje wzajemne oddziaływanie tych aspektów życia`;
  };

  const analyzeDream = async (dreamText: string, dreamId?: string): Promise<DreamAnalysis> => {
    try {
      const symbols = findSymbols(dreamText);
      const patterns = identifyPatterns(symbols);
      
      // Oblicz ton emocjonalny
      const emotionalWeights = symbols.map(s => s.emotionalWeight);
      const averageWeight = emotionalWeights.length > 0 
        ? emotionalWeights.reduce((a, b) => a + b, 0) / emotionalWeights.length 
        : 0;
      
      let emotionalTone: 'positive' | 'negative' | 'neutral' | 'mixed';
      if (averageWeight > 20) emotionalTone = 'positive';
      else if (averageWeight < -20) emotionalTone = 'negative';
      else if (emotionalWeights.some(w => w > 30) && emotionalWeights.some(w => w < -30)) emotionalTone = 'mixed';
      else emotionalTone = 'neutral';

      // Oblicz złożoność
      const complexity = Math.min(100, (symbols.length * 10) + (patterns.length * 15));

      // Generuj interpretację
      const interpretation = generateDreamInterpretation(symbols, patterns, emotionalTone);
      
      // Generuj rekomendacje
      const recommendations = generateRecommendations(symbols, patterns, emotionalTone);

      const analysis: DreamAnalysis = {
        dreamId: dreamId || `dream_${Date.now()}`,
        symbols,
        patterns,
        emotionalTone,
        complexity,
        interpretation,
        recommendations,
        timestamp: new Date().toISOString()
      };

      setRecentAnalyses(prev => [analysis, ...prev.slice(0, 49)]); // Keep last 50
      
      // Aktualizuj wzorce
      for (const pattern of patterns) {
        const existingIndex = symbolPatterns.findIndex(p => p.id === pattern.id);
        if (existingIndex >= 0) {
          setSymbolPatterns(prev => 
            prev.map((p, i) => i === existingIndex ? pattern : p)
          );
        } else {
          setSymbolPatterns(prev => [...prev, pattern]);
        }
      }

      await saveData();
      
      // Dodaj do pamięci jeśli znacząca analiza
      if (symbols.length > 2 || patterns.length > 0) {
        await addMemory(
          `Analiza snu: ${symbols.length} symboli, ${patterns.length} wzorców`,
          Math.floor(complexity / 10),
          ['dream', 'analysis', 'symbols'],
          'creative'
        );
      }

      await logSystem('info', 'DREAM_SYMBOLS', `Dream analyzed: ${symbols.length} symbols, ${patterns.length} patterns`);
      
      return analysis;

    } catch (error) {
      await logSystem('error', 'DREAM_SYMBOLS', 'Failed to analyze dream', error);
      throw error;
    }
  };

  const generateDreamInterpretation = (symbols: DreamSymbol[], patterns: SymbolPattern[], tone: string): string => {
    if (symbols.length === 0) {
      return 'Ten sen nie zawiera rozpoznawalnych symboli, może być odbiciem codziennych doświadczeń.';
    }

    let interpretation = `Ten sen zawiera ${symbols.length} ważnych symboli. `;
    
    // Główne symbole
    const mainSymbols = symbols.slice(0, 3);
    interpretation += `Kluczowe elementy to: ${mainSymbols.map(s => s.symbol).join(', ')}. `;
    
    // Interpretacja głównych symboli
    if (mainSymbols.length > 0) {
      interpretation += `${mainSymbols[0].symbol} może reprezentować ${mainSymbols[0].meanings[0]}. `;
    }

    // Wzorce
    if (patterns.length > 0) {
      interpretation += `Zauważalne wzorce: ${patterns[0].interpretation}. `;
    }

    // Ton emocjonalny
    const toneDescriptions = {
      positive: 'Sen ma pozytywny wydźwięk, sugerując optymizm i dobre perspektywy.',
      negative: 'Sen niesie negatywne emocje, może wskazywać na lęki lub niepokoje.',
      neutral: 'Sen ma zrównoważony charakter, odzwierciedlając stabilną sytuację życiową.',
      mixed: 'Sen zawiera mieszane emocje, wskazując na złożoność aktualnej sytuacji życiowej.'
    };
    
    interpretation += toneDescriptions[tone as keyof typeof toneDescriptions];

    return interpretation;
  };

  const generateRecommendations = (symbols: DreamSymbol[], patterns: SymbolPattern[], tone: string): string[] => {
    const recommendations: string[] = [];

    // Rekomendacje na podstawie symboli
    if (symbols.some(s => s.category === 'emotion' && s.emotionalWeight < -30)) {
      recommendations.push('Rozważ techniki relaksacji lub rozmowę z bliską osobą o swoich lękach');
    }

    if (symbols.some(s => s.symbol === 'woda')) {
      recommendations.push('Zwróć uwagę na swoje emocje i pozwól sobie na ich wyrażenie');
    }

    if (symbols.some(s => s.symbol === 'latanie')) {
      recommendations.push('To dobry czas na podejmowanie nowych wyzwań i realizację marzeń');
    }

    if (patterns.length > 2) {
      recommendations.push('Twoje sny są bogate symbolicznie - rozważ prowadzenie dziennika snów');
    }

    if (tone === 'negative') {
      recommendations.push('Negatywne sny mogą wskazywać na stres - zadbaj o odpoczynek i relaks');
    }

    if (recommendations.length === 0) {
      recommendations.push('Kontynuuj obserwację swoich snów - mogą przynieść cenne wglądy');
    }

    return recommendations;
  };

  const learnPattern = async (symbols: string[], interpretation: string) => {
    const newPattern: SymbolPattern = {
      id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbols: symbols.sort(),
      pattern: symbols.join(' + '),
      interpretation,
      confidence: 80, // Wysokie zaufanie dla ręcznie dodanych wzorców
      occurrences: 1,
      dreamIds: []
    };

    setSymbolPatterns(prev => [...prev, newPattern]);
    await saveData();
    
    await logSystem('info', 'DREAM_SYMBOLS', `New pattern learned: ${newPattern.pattern}`);
  };

  const setPersonalMeaning = async (symbolId: string, meaning: string) => {
    await updateSymbol(symbolId, { personalMeaning: meaning });
    await logSystem('info', 'DREAM_SYMBOLS', `Personal meaning set for symbol: ${symbolId}`);
  };

  const adjustEmotionalWeight = async (symbolId: string, weight: number) => {
    const clampedWeight = Math.max(-100, Math.min(100, weight));
    await updateSymbol(symbolId, { emotionalWeight: clampedWeight });
    await logSystem('info', 'DREAM_SYMBOLS', `Emotional weight adjusted for symbol: ${symbolId} -> ${clampedWeight}`);
  };

  const getSymbolStats = () => {
    const categories = knownSymbols.reduce((acc, symbol) => {
      acc[symbol.category] = (acc[symbol.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostFrequent = knownSymbols
      .filter(s => s.frequency > 0)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    return {
      total: knownSymbols.length,
      categories,
      mostFrequent
    };
  };

  const getPatternStats = () => {
    const mostCommon = symbolPatterns
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 10);

    return {
      total: symbolPatterns.length,
      mostCommon
    };
  };

  // Auto-save data
  useEffect(() => {
    if (knownSymbols.length > 0) {
      saveData();
    }
  }, [knownSymbols, recentAnalyses, symbolPatterns]);

  const value: DreamSymbolAnalyzerContextType = {
    knownSymbols,
    recentAnalyses,
    symbolPatterns,
    addSymbol,
    updateSymbol,
    deleteSymbol,
    analyzeDream,
    findSymbols,
    identifyPatterns,
    learnPattern,
    setPersonalMeaning,
    adjustEmotionalWeight,
    getSymbolStats,
    getPatternStats
  };

  return (
    <DreamSymbolAnalyzerContext.Provider value={value}>
      {children}
    </DreamSymbolAnalyzerContext.Provider>
  );
}; 