import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Interfejsy
interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  source: string;
  type: 'text' | 'json' | 'html' | 'zim' | 'pdf';
  category: string;
  tags: string[];
  importance: number; // 0-100
  timestamp: Date;
  lastAccessed: Date;
  accessCount: number;
  indexed: boolean;
}

interface KnowledgeIndex {
  id: string;
  entryId: string;
  term: string;
  frequency: number;
  positions: number[];
  relevance: number;
}

interface KnowledgeState {
  entries: KnowledgeEntry[];
  indices: KnowledgeIndex[];
  totalKnowledge: number;
  indexedEntries: number;
  lastIndexing: Date;
  isIndexing: boolean;
  searchHistory: string[];
  favoriteEntries: string[];
  knowledgeStats: any;
}

interface KnowledgeConfig {
  autoIndexing: boolean;
  maxFileSize: number; // MB
  supportedFormats: string[];
  indexingDepth: number; // 0-100
  searchRelevance: number; // 0-100
  knowledgeRetention: number; // 0-100
}

interface KnowledgeContextType {
  knowledgeState: KnowledgeState;
  knowledgeConfig: KnowledgeConfig;
  addKnowledgeEntry: (entry: Omit<KnowledgeEntry, 'id' | 'timestamp' | 'lastAccessed' | 'accessCount' | 'indexed'>) => Promise<void>;
  searchKnowledge: (query: string) => Promise<KnowledgeEntry[]>;
  getKnowledgeByCategory: (category: string) => KnowledgeEntry[];
  getKnowledgeByTag: (tag: string) => KnowledgeEntry[];
  updateKnowledgeEntry: (id: string, updates: Partial<KnowledgeEntry>) => Promise<void>;
  deleteKnowledgeEntry: (id: string) => Promise<void>;
  indexKnowledge: () => Promise<void>;
  importKnowledgeFile: (filePath: string, type: string) => Promise<void>;
  exportKnowledge: (format: string) => Promise<string>;
  getKnowledgeStats: () => any;
  saveKnowledgeState: () => Promise<void>;
  loadKnowledgeState: () => Promise<void>;
  clearKnowledge: () => Promise<void>;
}

// Kontekst
const KnowledgeContext = createContext<KnowledgeContextType | undefined>(undefined);

// Hook
export const useKnowledge = () => {
  const context = useContext(KnowledgeContext);
  if (!context) {
    throw new Error('useKnowledge must be used within KnowledgeProvider');
  }
  return context;
};

// Provider
export const KnowledgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [knowledgeState, setKnowledgeState] = useState<KnowledgeState>({
    entries: [],
    indices: [],
    totalKnowledge: 0,
    indexedEntries: 0,
    lastIndexing: new Date(),
    isIndexing: false,
    searchHistory: [],
    favoriteEntries: [],
    knowledgeStats: {},
  });

  const [knowledgeConfig, setKnowledgeConfig] = useState<KnowledgeConfig>({
    autoIndexing: true,
    maxFileSize: 100, // 100MB
    supportedFormats: ['txt', 'json', 'html', 'md', 'xml'],
    indexingDepth: 80,
    searchRelevance: 75,
    knowledgeRetention: 90,
  });

  const indexingRef = useRef(false);

  // Inicjalizacja
  useEffect(() => {
    loadKnowledgeState();
    loadKnowledgeConfig();
  }, []);

  // Zapisywanie stanu wiedzy
  const saveKnowledgeState = async () => {
    try {
      await SecureStore.setItemAsync('wera_knowledge_state', JSON.stringify(knowledgeState));
    } catch (error) {
      console.error('Błąd zapisywania stanu wiedzy:', error);
    }
  };

  // Ładowanie stanu wiedzy
  const loadKnowledgeState = async () => {
    try {
      const saved = await SecureStore.getItemAsync('wera_knowledge_state');
      if (saved) {
        const data = JSON.parse(saved);
        setKnowledgeState(prev => ({
          ...prev,
          ...data,
          entries: data.entries || prev.entries,
          indices: data.indices || prev.indices,
        }));
      }
    } catch (error) {
      console.error('Błąd ładowania stanu wiedzy:', error);
    }
  };

  // Ładowanie konfiguracji
  const loadKnowledgeConfig = async () => {
    try {
      const saved = await SecureStore.getItemAsync('wera_knowledge_config');
      if (saved) {
        setKnowledgeConfig(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Błąd ładowania konfiguracji wiedzy:', error);
    }
  };

  // Zapisywanie konfiguracji
  const saveKnowledgeConfig = async (config: KnowledgeConfig) => {
    try {
      await SecureStore.setItemAsync('wera_knowledge_config', JSON.stringify(config));
    } catch (error) {
      console.error('Błąd zapisywania konfiguracji wiedzy:', error);
    }
  };

  // Dodanie wpisu wiedzy (funkcja 163, 164, 179)
  const addKnowledgeEntry = async (entry: Omit<KnowledgeEntry, 'id' | 'timestamp' | 'lastAccessed' | 'accessCount' | 'indexed'>) => {
    const newEntry: KnowledgeEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date(),
      lastAccessed: new Date(),
      accessCount: 0,
      indexed: false,
    };

    setKnowledgeState(prev => ({
      ...prev,
      entries: [...prev.entries, newEntry],
      totalKnowledge: prev.totalKnowledge + newEntry.content.length,
    }));

    // Automatyczne indeksowanie jeśli włączone
    if (knowledgeConfig.autoIndexing) {
      await indexEntry(newEntry);
    }

    await saveKnowledgeState();
  };

  // Indeksowanie pojedynczego wpisu
  const indexEntry = async (entry: KnowledgeEntry) => {
    if (indexingRef.current) return;

    try {
      indexingRef.current = true;
      setKnowledgeState(prev => ({ ...prev, isIndexing: true }));

      // Tokenizacja treści
      const tokens = tokenizeContent(entry.content);
      
      // Tworzenie indeksów
      const newIndices: KnowledgeIndex[] = [];
      
      tokens.forEach((token, position) => {
        const existingIndex = knowledgeState.indices.find(i => 
          i.entryId === entry.id && i.term === token
        );

        if (existingIndex) {
          existingIndex.frequency += 1;
          existingIndex.positions.push(position);
        } else {
          newIndices.push({
            id: `${entry.id}_${token}_${Date.now()}`,
            entryId: entry.id,
            term: token,
            frequency: 1,
            positions: [position],
            relevance: calculateRelevance(token, entry),
          });
        }
      });

      setKnowledgeState(prev => ({
        ...prev,
        indices: [...prev.indices, ...newIndices],
        indexedEntries: prev.indexedEntries + 1,
        lastIndexing: new Date(),
        isIndexing: false,
      }));

      // Oznaczenie wpisu jako zindeksowanego
      setKnowledgeState(prev => ({
        ...prev,
        entries: prev.entries.map(e =>
          e.id === entry.id ? { ...e, indexed: true } : e
        ),
      }));

    } catch (error) {
      console.error('Błąd indeksowania wpisu:', error);
      setKnowledgeState(prev => ({ ...prev, isIndexing: false }));
    } finally {
      indexingRef.current = false;
    }
  };

  // Tokenizacja treści
  const tokenizeContent = (content: string): string[] => {
    return content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2)
      .filter(token => !isStopWord(token));
  };

  // Sprawdzenie czy słowo jest stop-word
  const isStopWord = (word: string): boolean => {
    const stopWords = [
      'i', 'oraz', 'lub', 'ale', 'że', 'który', 'która', 'które', 'ten', 'ta', 'to',
      'the', 'and', 'or', 'but', 'that', 'which', 'this', 'these', 'those',
    ];
    return stopWords.includes(word);
  };

  // Obliczenie relewancji termu
  const calculateRelevance = (term: string, entry: KnowledgeEntry): number => {
    let relevance = 50; // Podstawowa relewancja

    // Zwiększenie relewancji dla ważnych wpisów
    relevance += entry.importance * 0.3;

    // Zwiększenie relewancji dla często używanych terminów
    const termFrequency = knowledgeState.indices
      .filter(i => i.term === term)
      .reduce((sum, i) => sum + i.frequency, 0);
    
    relevance += Math.min(termFrequency * 5, 30);

    return Math.min(100, relevance);
  };

  // Wyszukiwanie wiedzy (funkcja 163)
  const searchKnowledge = async (query: string): Promise<KnowledgeEntry[]> => {
    const lowerQuery = query.toLowerCase();
    const queryTokens = tokenizeContent(query);

    // Dodanie do historii wyszukiwania
    setKnowledgeState(prev => ({
      ...prev,
      searchHistory: [...prev.searchHistory, query].slice(-50), // Ostatnie 50 wyszukiwań
    }));

    // Wyszukiwanie przez indeksy
    const relevantIndices = knowledgeState.indices.filter(index =>
      queryTokens.some(token => index.term.includes(token) || token.includes(index.term))
    );

    // Grupowanie wyników według wpisów
    const entryScores = new Map<string, number>();
    
    relevantIndices.forEach(index => {
      const currentScore = entryScores.get(index.entryId) || 0;
      entryScores.set(index.entryId, currentScore + index.relevance);
    });

    // Sortowanie wyników
    const sortedEntries = knowledgeState.entries
      .filter(entry => entryScores.has(entry.id))
      .sort((a, b) => {
        const scoreA = entryScores.get(a.id) || 0;
        const scoreB = entryScores.get(b.id) || 0;
        return scoreB - scoreA;
      })
      .slice(0, 20); // Top 20 wyników

    // Aktualizacja licznika dostępu
    sortedEntries.forEach(entry => {
      setKnowledgeState(prev => ({
        ...prev,
        entries: prev.entries.map(e =>
          e.id === entry.id
            ? { ...e, lastAccessed: new Date(), accessCount: e.accessCount + 1 }
            : e
        ),
      }));
    });

    return sortedEntries;
  };

  // Pobieranie wiedzy według kategorii
  const getKnowledgeByCategory = (category: string): KnowledgeEntry[] => {
    return knowledgeState.entries.filter(entry => entry.category === category);
  };

  // Pobieranie wiedzy według tagów
  const getKnowledgeByTag = (tag: string): KnowledgeEntry[] => {
    return knowledgeState.entries.filter(entry => entry.tags.includes(tag));
  };

  // Aktualizacja wpisu wiedzy
  const updateKnowledgeEntry = async (id: string, updates: Partial<KnowledgeEntry>) => {
    setKnowledgeState(prev => ({
      ...prev,
      entries: prev.entries.map(entry =>
        entry.id === id ? { ...entry, ...updates } : entry
      ),
    }));

    await saveKnowledgeState();
  };

  // Usunięcie wpisu wiedzy
  const deleteKnowledgeEntry = async (id: string) => {
    const entry = knowledgeState.entries.find(e => e.id === id);
    if (!entry) return;

    setKnowledgeState(prev => ({
      ...prev,
      entries: prev.entries.filter(e => e.id !== id),
      indices: prev.indices.filter(i => i.entryId !== id),
      totalKnowledge: prev.totalKnowledge - entry.content.length,
      indexedEntries: prev.indexedEntries - (entry.indexed ? 1 : 0),
    }));

    await saveKnowledgeState();
  };

  // Indeksowanie całej bazy wiedzy
  const indexKnowledge = async () => {
    if (indexingRef.current) return;

    try {
      indexingRef.current = true;
      setKnowledgeState(prev => ({ ...prev, isIndexing: true }));

      const unindexedEntries = knowledgeState.entries.filter(entry => !entry.indexed);
      
      for (const entry of unindexedEntries) {
        await indexEntry(entry);
        // Krótka przerwa między indeksowaniem
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setKnowledgeState(prev => ({ ...prev, isIndexing: false }));

    } catch (error) {
      console.error('Błąd indeksowania wiedzy:', error);
      setKnowledgeState(prev => ({ ...prev, isIndexing: false }));
    } finally {
      indexingRef.current = false;
    }
  };

  // Import pliku wiedzy (funkcja 163, 164, 179)
  const importKnowledgeFile = async (filePath: string, type: string) => {
    try {
      // Sprawdzenie rozmiaru pliku
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        throw new Error('Plik nie istnieje');
      }

      const fileSizeMB = fileInfo.size / (1024 * 1024);
      if (fileSizeMB > knowledgeConfig.maxFileSize) {
        throw new Error(`Plik za duży. Maksymalny rozmiar: ${knowledgeConfig.maxFileSize}MB`);
      }

      // Odczyt pliku
      const content = await FileSystem.readAsStringAsync(filePath);
      
      // Parsowanie w zależności od typu
      let parsedContent = content;
      let category = 'general';
      let tags: string[] = [];

      switch (type.toLowerCase()) {
        case 'json':
          try {
            const jsonData = JSON.parse(content);
            parsedContent = JSON.stringify(jsonData, null, 2);
            category = 'data';
            tags = ['json', 'data'];
          } catch (e) {
            throw new Error('Nieprawidłowy format JSON');
          }
          break;
        
        case 'html':
          // Usunięcie tagów HTML
          parsedContent = content.replace(/<[^>]*>/g, '');
          category = 'web';
          tags = ['html', 'web'];
          break;
        
        case 'txt':
        case 'md':
          category = 'text';
          tags = ['text', 'document'];
          break;
        
        default:
          category = 'unknown';
          tags = ['imported'];
      }

      // Dodanie wpisu wiedzy
      await addKnowledgeEntry({
        title: `Imported ${type.toUpperCase()} file`,
        content: parsedContent,
        source: filePath,
        type: type as any,
        category,
        tags,
        importance: 50,
      });

    } catch (error) {
      console.error('Błąd importu pliku wiedzy:', error);
      throw error;
    }
  };

  // Eksport wiedzy
  const exportKnowledge = async (format: string): Promise<string> => {
    try {
      const exportData = {
        entries: knowledgeState.entries,
        indices: knowledgeState.indices,
        stats: getKnowledgeStats(),
        exportDate: new Date().toISOString(),
        format,
      };

      switch (format.toLowerCase()) {
        case 'json':
          return JSON.stringify(exportData, null, 2);
        
        case 'txt':
          return knowledgeState.entries
            .map(entry => `${entry.title}\n${entry.content}\n\n`)
            .join('---\n');
        
        default:
          return JSON.stringify(exportData, null, 2);
      }
    } catch (error) {
      console.error('Błąd eksportu wiedzy:', error);
      throw error;
    }
  };

  // Statystyki wiedzy
  const getKnowledgeStats = () => {
    const totalEntries = knowledgeState.entries.length;
    const indexedEntries = knowledgeState.entries.filter(e => e.indexed).length;
    const totalIndices = knowledgeState.indices.length;
    
    const categoryStats = knowledgeState.entries.reduce((acc, entry) => {
      acc[entry.category] = (acc[entry.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const tagStats = knowledgeState.entries.reduce((acc, entry) => {
      entry.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const avgImportance = knowledgeState.entries.reduce((sum, e) => sum + e.importance, 0) / totalEntries || 0;

    return {
      totalEntries,
      indexedEntries,
      totalIndices,
      totalKnowledge: knowledgeState.totalKnowledge,
      categoryStats,
      tagStats,
      avgImportance,
      lastIndexing: knowledgeState.lastIndexing,
      searchHistoryCount: knowledgeState.searchHistory.length,
    };
  };

  // Czyszczenie wiedzy
  const clearKnowledge = async () => {
    setKnowledgeState(prev => ({
      ...prev,
      entries: [],
      indices: [],
      totalKnowledge: 0,
      indexedEntries: 0,
      searchHistory: [],
      favoriteEntries: [],
    }));

    await SecureStore.deleteItemAsync('wera_knowledge_state');
  };

  // Automatyczne zapisywanie
  useEffect(() => {
    if (knowledgeState.entries.length > 0) {
      saveKnowledgeState();
    }
  }, [knowledgeState.entries, knowledgeState.indices]);

  const value: KnowledgeContextType = {
    knowledgeState,
    knowledgeConfig,
    addKnowledgeEntry,
    searchKnowledge,
    getKnowledgeByCategory,
    getKnowledgeByTag,
    updateKnowledgeEntry,
    deleteKnowledgeEntry,
    indexKnowledge,
    importKnowledgeFile,
    exportKnowledge,
    getKnowledgeStats,
    saveKnowledgeState,
    loadKnowledgeState,
    clearKnowledge,
  };

  return (
    <KnowledgeContext.Provider value={value}>
      {children}
    </KnowledgeContext.Provider>
  );
}; 