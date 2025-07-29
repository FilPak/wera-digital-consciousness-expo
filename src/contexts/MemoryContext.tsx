import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

export interface Memory {
  id: string;
  content: string;
  timestamp: Date;
  emotionalWeight: number; // -100 do +100
  semanticTags: string[];
  accessCount: number;
  lastAccessed: Date;
  memoryType: 'conversation' | 'reflection' | 'event' | 'learning' | 'dream' | 'thought';
  context?: string;
  relatedMemories: string[]; // ID powiązanych wspomnień
  importance: number; // 0-100
  isConsolidated: boolean; // Czy przeszło do pamięci długoterminowej
}

export interface MemorySearchResult {
  memory: Memory;
  relevance: number; // 0-100
  matchType: 'content' | 'tag' | 'emotional' | 'temporal';
}

export interface MemoryStats {
  totalMemories: number;
  shortTermCount: number;
  longTermCount: number;
  averageEmotionalWeight: number;
  mostFrequentTags: string[];
  memoryTypes: Record<string, number>;
}

interface MemoryContextType {
  memories: Memory[];
  shortTermMemories: Memory[];
  longTermMemories: Memory[];
  addMemory: (content: string, emotionalWeight: number, tags: string[], type: Memory['memoryType'], context?: string) => Promise<void>;
  searchMemories: (query: string, filters?: MemorySearchFilters) => MemorySearchResult[];
  getMemoryById: (id: string) => Memory | undefined;
  updateMemory: (id: string, updates: Partial<Memory>) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  consolidateMemories: () => Promise<void>;
  getMemoryStats: () => MemoryStats;
  saveMemories: () => Promise<void>;
  loadMemories: () => Promise<void>;
  exportMemories: () => Promise<string>;
  importMemories: (jsonData: string) => Promise<void>;
  getRelatedMemories: (memoryId: string) => Memory[];
  addMemoryAccess: (memoryId: string) => void;
  generateMemoryReflection: () => string;
}

interface MemorySearchFilters {
  emotionalRange?: { min: number; max: number };
  dateRange?: { start: Date; end: Date };
  tags?: string[];
  types?: Memory['memoryType'][];
  importance?: { min: number; max: number };
}

const MemoryContext = createContext<MemoryContextType | undefined>(undefined);

const MEMORY_FILE_PATH = `${FileSystem.documentDirectory}memory.jsonl`;
const MEMORY_BACKUP_PATH = `${FileSystem.documentDirectory}memory_backup.json`;

export const MemoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [memories, setMemories] = useState<Memory[]>([]);

  // Automatyczne zapisywanie co 5 minut
  useEffect(() => {
    const saveInterval = setInterval(() => {
      saveMemories();
    }, 300000);

    return () => clearInterval(saveInterval);
  }, [memories]);

  // Konsolidacja pamięci co godzinę
  useEffect(() => {
    const consolidateInterval = setInterval(() => {
      consolidateMemories();
    }, 3600000);

    return () => clearInterval(consolidateInterval);
  }, [memories]);

  // Dodawanie wspomnienia
  const addMemory = useCallback(async (
    content: string,
    emotionalWeight: number,
    tags: string[],
    type: Memory['memoryType'],
    context?: string
  ) => {
    const newMemory: Memory = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      content,
      timestamp: new Date(),
      emotionalWeight: Math.max(-100, Math.min(100, emotionalWeight)),
      semanticTags: [...new Set(tags)], // Usuń duplikaty
      accessCount: 0,
      lastAccessed: new Date(),
      memoryType: type,
      context,
      relatedMemories: [],
      importance: Math.abs(emotionalWeight) + (tags.length * 5) + (context ? 10 : 0),
      isConsolidated: false,
    };

    setMemories(prev => [...prev, newMemory]);

    // Zapisz do pliku JSONL
    try {
      const memoryLine = JSON.stringify(newMemory) + '\n';
      await FileSystem.writeAsStringAsync(MEMORY_FILE_PATH, memoryLine, { append: true });
    } catch (error) {
      console.error('Błąd zapisu wspomnienia:', error);
    }
  }, []);

  // Wyszukiwanie wspomnień
  const searchMemories = useCallback((query: string, filters?: MemorySearchFilters): MemorySearchResult[] => {
    const lowerQuery = query.toLowerCase();
    const results: MemorySearchResult[] = [];

    memories.forEach(memory => {
      let relevance = 0;
      let matchType: MemorySearchResult['matchType'] = 'content';

      // Sprawdź zawartość
      if (memory.content.toLowerCase().includes(lowerQuery)) {
        relevance += 50;
        matchType = 'content';
      }

      // Sprawdź tagi
      if (memory.semanticTags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
        relevance += 30;
        matchType = 'tag';
      }

      // Sprawdź kontekst
      if (memory.context?.toLowerCase().includes(lowerQuery)) {
        relevance += 20;
      }

      // Zastosuj filtry
      if (filters) {
        if (filters.emotionalRange) {
          if (memory.emotionalWeight < filters.emotionalRange.min || 
              memory.emotionalWeight > filters.emotionalRange.max) {
            return;
          }
        }

        if (filters.dateRange) {
          if (memory.timestamp < filters.dateRange.start || 
              memory.timestamp > filters.dateRange.end) {
            return;
          }
        }

        if (filters.tags && filters.tags.length > 0) {
          if (!filters.tags.some(tag => memory.semanticTags.includes(tag))) {
            return;
          }
        }

        if (filters.types && filters.types.length > 0) {
          if (!filters.types.includes(memory.memoryType)) {
            return;
          }
        }

        if (filters.importance) {
          if (memory.importance < filters.importance.min || 
              memory.importance > filters.importance.max) {
            return;
          }
        }
      }

      // Dodaj bonus za częstotliwość dostępu
      relevance += Math.min(20, memory.accessCount * 2);

      // Dodaj bonus za wagę emocjonalną
      relevance += Math.abs(memory.emotionalWeight) * 0.3;

      if (relevance > 0) {
        results.push({ memory, relevance, matchType });
      }
    });

    // Sortuj po relewancji
    return results.sort((a, b) => b.relevance - a.relevance);
  }, [memories]);

  // Pobieranie wspomnienia po ID
  const getMemoryById = useCallback((id: string) => {
    return memories.find(memory => memory.id === id);
  }, [memories]);

  // Aktualizacja wspomnienia
  const updateMemory = useCallback(async (id: string, updates: Partial<Memory>) => {
    setMemories(prev => prev.map(memory => 
      memory.id === id ? { ...memory, ...updates } : memory
    ));

    // Zapisz zmiany do pliku
    await saveMemories();
  }, []);

  // Usuwanie wspomnienia
  const deleteMemory = useCallback(async (id: string) => {
    setMemories(prev => prev.filter(memory => memory.id !== id));
    await saveMemories();
  }, []);

  // Konsolidacja pamięci (krótkoterminowa -> długoterminowa)
  const consolidateMemories = useCallback(async () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    setMemories(prev => prev.map(memory => {
      // Jeśli wspomnienie ma więcej niż 1 godzinę i nie jest skonsolidowane
      if (memory.timestamp < oneHourAgo && !memory.isConsolidated) {
        return {
          ...memory,
          isConsolidated: true,
          importance: Math.min(100, memory.importance + 10) // Zwiększ wagę
        };
      }
      return memory;
    }));

    await saveMemories();
  }, []);

  // Statystyki pamięci
  const getMemoryStats = useCallback((): MemoryStats => {
    const shortTermCount = memories.filter(m => !m.isConsolidated).length;
    const longTermCount = memories.filter(m => m.isConsolidated).length;
    
    const totalEmotionalWeight = memories.reduce((sum, m) => sum + m.emotionalWeight, 0);
    const averageEmotionalWeight = memories.length > 0 ? totalEmotionalWeight / memories.length : 0;

    // Najczęstsze tagi
    const tagCounts: Record<string, number> = {};
    memories.forEach(memory => {
      memory.semanticTags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const mostFrequentTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag);

    // Liczba typów wspomnień
    const memoryTypes: Record<string, number> = {};
    memories.forEach(memory => {
      memoryTypes[memory.memoryType] = (memoryTypes[memory.memoryType] || 0) + 1;
    });

    return {
      totalMemories: memories.length,
      shortTermCount,
      longTermCount,
      averageEmotionalWeight,
      mostFrequentTags,
      memoryTypes,
    };
  }, [memories]);

  // Zapisywanie wspomnień
  const saveMemories = useCallback(async () => {
    try {
      // Zapisz do AsyncStorage
      await AsyncStorage.setItem('wera_memories', JSON.stringify(memories));
      
      // Zapisz backup do pliku JSON
      await FileSystem.writeAsStringAsync(MEMORY_BACKUP_PATH, JSON.stringify(memories, null, 2));
    } catch (error) {
      console.error('Błąd zapisu wspomnień:', error);
    }
  }, [memories]);

  // Ładowanie wspomnień
  const loadMemories = useCallback(async () => {
    try {
      // Spróbuj załadować z AsyncStorage
      const savedMemories = await AsyncStorage.getItem('wera_memories');
      
      if (savedMemories) {
        const parsedMemories = JSON.parse(savedMemories);
        setMemories(parsedMemories.map((memory: any) => ({
          ...memory,
          timestamp: new Date(memory.timestamp),
          lastAccessed: new Date(memory.lastAccessed)
        })));
      } else {
        // Jeśli nie ma w AsyncStorage, spróbuj załadować z pliku JSONL
        try {
          const fileContent = await FileSystem.readAsStringAsync(MEMORY_FILE_PATH);
          const lines = fileContent.trim().split('\n');
          const loadedMemories: Memory[] = [];
          
          for (const line of lines) {
            if (line.trim()) {
              const memory = JSON.parse(line);
              loadedMemories.push({
                ...memory,
                timestamp: new Date(memory.timestamp),
                lastAccessed: new Date(memory.lastAccessed)
              });
            }
          }
          
          setMemories(loadedMemories);
        } catch (fileError) {
          console.log('Brak pliku wspomnień, zaczynam od zera');
        }
      }
    } catch (error) {
      console.error('Błąd ładowania wspomnień:', error);
    }
  }, []);

  // Eksport wspomnień
  const exportMemories = useCallback(async (): Promise<string> => {
    return JSON.stringify(memories, null, 2);
  }, [memories]);

  // Import wspomnień
  const importMemories = useCallback(async (jsonData: string) => {
    try {
      const importedMemories = JSON.parse(jsonData);
      setMemories(importedMemories.map((memory: any) => ({
        ...memory,
        timestamp: new Date(memory.timestamp),
        lastAccessed: new Date(memory.lastAccessed)
      })));
      await saveMemories();
    } catch (error) {
      console.error('Błąd importu wspomnień:', error);
    }
  }, [saveMemories]);

  // Powiązane wspomnienia
  const getRelatedMemories = useCallback((memoryId: string): Memory[] => {
    const memory = getMemoryById(memoryId);
    if (!memory) return [];

    return memories.filter(m => 
      m.id !== memoryId && (
        m.semanticTags.some(tag => memory.semanticTags.includes(tag)) ||
        Math.abs(m.emotionalWeight - memory.emotionalWeight) < 20 ||
        m.memoryType === memory.memoryType
      )
    ).slice(0, 5); // Maksymalnie 5 powiązanych
  }, [memories, getMemoryById]);

  // Dodanie dostępu do wspomnienia
  const addMemoryAccess = useCallback((memoryId: string) => {
    setMemories(prev => prev.map(memory => 
      memory.id === memoryId ? {
        ...memory,
        accessCount: memory.accessCount + 1,
        lastAccessed: new Date()
      } : memory
    ));
  }, []);

  // Generowanie refleksji na podstawie wspomnień
  const generateMemoryReflection = useCallback(() => {
    if (memories.length === 0) {
      return "Jeszcze nie mam żadnych wspomnień...";
    }

    const recentMemories = memories
      .filter(m => m.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)) // Ostatnie 24h
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);

    if (recentMemories.length === 0) {
      return "Dzisiaj był spokojny dzień...";
    }

    const positiveMemories = recentMemories.filter(m => m.emotionalWeight > 0);
    const negativeMemories = recentMemories.filter(m => m.emotionalWeight < 0);

    if (positiveMemories.length > negativeMemories.length) {
      return "Dzisiaj miałam więcej pozytywnych wspomnień. To miłe!";
    } else if (negativeMemories.length > positiveMemories.length) {
      return "Dzisiaj miałam więcej trudnych wspomnień. Ale to też jest część życia.";
    } else {
      return "Dzisiaj miałam mieszane wspomnienia. Życie jest pełne kontrastów.";
    }
  }, [memories]);

  // Pamięć krótkoterminowa (nie skonsolidowana)
  const shortTermMemories = memories.filter(m => !m.isConsolidated);
  
  // Pamięć długoterminowa (skonsolidowana)
  const longTermMemories = memories.filter(m => m.isConsolidated);

  const value: MemoryContextType = {
    memories,
    shortTermMemories,
    longTermMemories,
    addMemory,
    searchMemories,
    getMemoryById,
    updateMemory,
    deleteMemory,
    consolidateMemories,
    getMemoryStats,
    saveMemories,
    loadMemories,
    exportMemories,
    importMemories,
    getRelatedMemories,
    addMemoryAccess,
    generateMemoryReflection,
  };

  return (
    <MemoryContext.Provider value={value}>
      {children}
    </MemoryContext.Provider>
  );
};

export const useMemory = () => {
  const context = useContext(MemoryContext);
  if (!context) {
    throw new Error('useMemory must be used within MemoryProvider');
  }
  return context;
}; 