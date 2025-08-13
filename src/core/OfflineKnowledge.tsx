import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { useSandboxFileSystem } from './SandboxFileSystem';
import { useNetworkEngine } from './NetworkEngine';

export interface KnowledgeFile {
  id: string;
  name: string;
  type: 'zim' | 'pdf' | 'html' | 'txt' | 'json' | 'epub' | 'md';
  path: string;
  size: number;
  addedAt: Date;
  lastAccessed?: Date;
  accessCount: number;
  isIndexed: boolean;
  metadata: {
    title?: string;
    author?: string;
    language?: string;
    description?: string;
    version?: string;
    articleCount?: number;
    categories?: string[];
  };
  searchIndex?: KnowledgeSearchIndex;
}

export interface KnowledgeSearchIndex {
  words: Map<string, number[]>; // słowo -> [pozycje w tekście]
  articles: KnowledgeArticle[];
  categories: Map<string, string[]>; // kategoria -> [id artykułów]
  lastUpdated: Date;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  categories: string[];
  links: string[];
  images: string[];
  lastModified?: Date;
  wordCount: number;
  readingTime: number; // w minutach
}

export interface KnowledgeQuery {
  query: string;
  type: 'fulltext' | 'title' | 'category' | 'semantic';
  limit?: number;
  filters?: {
    fileTypes?: KnowledgeFile['type'][];
    categories?: string[];
    dateRange?: {
      from: Date;
      to: Date;
    };
    minWordCount?: number;
    maxWordCount?: number;
  };
}

export interface KnowledgeSearchResult {
  article: KnowledgeArticle;
  relevanceScore: number;
  matchedTerms: string[];
  context: string; // Fragment tekstu z podświetleniem
  file: KnowledgeFile;
}

interface OfflineKnowledgeContextType {
  knowledgeFiles: KnowledgeFile[];
  totalArticles: number;
  totalSize: number;
  isIndexing: boolean;
  indexingProgress: number;
  
  // File management
  addKnowledgeFile: (uri: string, type?: KnowledgeFile['type']) => Promise<KnowledgeFile>;
  removeKnowledgeFile: (fileId: string) => Promise<void>;
  updateFileMetadata: (fileId: string, metadata: Partial<KnowledgeFile['metadata']>) => Promise<void>;
  
  // Content access
  searchKnowledge: (query: KnowledgeQuery) => Promise<KnowledgeSearchResult[]>;
  getArticle: (fileId: string, articleId: string) => Promise<KnowledgeArticle | null>;
  getRandomArticle: (fileId?: string) => Promise<KnowledgeArticle | null>;
  
  // Indexing
  indexFile: (fileId: string) => Promise<void>;
  reindexAll: () => Promise<void>;
  
  // Import/Export
  importKnowledgePackage: (packagePath: string) => Promise<void>;
  exportKnowledgeIndex: () => Promise<string>;
  
  // Statistics
  getUsageStats: () => Promise<{
    totalQueries: number;
    popularTerms: string[];
    mostAccessedFiles: KnowledgeFile[];
    categoryDistribution: Map<string, number>;
  }>;
  
  // Data management
  saveKnowledgeData: () => Promise<void>;
  loadKnowledgeData: () => Promise<void>;
}

const OfflineKnowledgeContext = createContext<OfflineKnowledgeContextType | undefined>(undefined);

export const OfflineKnowledgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexingProgress, setIndexingProgress] = useState(0);

  const { createAutonomousFile } = useSandboxFileSystem();
  const { isOnline } = useNetworkEngine();

  // Inicjalizacja
  useEffect(() => {
    loadKnowledgeData();
    scanForExistingFiles();
  }, []);

  // Skanowanie istniejących plików
  const scanForExistingFiles = async () => {
    try {
      console.log('🔍 Skanowanie istniejących plików wiedzy...');
      
      const knowledgePaths = [
        `${FileSystem.documentDirectory}knowledge/`,
        `${FileSystem.documentDirectory}downloads/`,
        '/storage/emulated/0/Download/',
        '/storage/emulated/0/Documents/',
        '/storage/emulated/0/Books/',
        '/storage/emulated/0/Wikipedia/',
      ];

      const supportedExtensions = ['.zim', '.pdf', '.html', '.htm', '.txt', '.json', '.epub', '.md'];
      
      for (const basePath of knowledgePaths) {
        try {
          const dirInfo = await FileSystem.getInfoAsync(basePath);
          if (!dirInfo.exists) continue;

          const files = await FileSystem.readDirectoryAsync(basePath);
          
          for (const file of files) {
            const filePath = `${basePath}${file}`;
            const isSupported = supportedExtensions.some(ext => 
              file.toLowerCase().endsWith(ext)
            );
            
            if (isSupported) {
              const fileInfo = await FileSystem.getInfoAsync(filePath);
              if (fileInfo.exists && fileInfo.size && fileInfo.size > 1024) { // Większy niż 1KB
                await addKnowledgeFile(filePath, detectFileType(file));
              }
            }
          }
        } catch (error) {
          console.warn(`Nie można przeszukać ${basePath}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Błąd skanowania plików wiedzy:', error);
    }
  };

  // Wykrywanie typu pliku
  const detectFileType = (filename: string): KnowledgeFile['type'] => {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'zim': return 'zim';
      case 'pdf': return 'pdf';
      case 'html':
      case 'htm': return 'html';
      case 'json': return 'json';
      case 'epub': return 'epub';
      case 'md': return 'md';
      default: return 'txt';
    }
  };

  // Dodawanie pliku wiedzy
  const addKnowledgeFile = useCallback(async (
    uri: string, 
    type?: KnowledgeFile['type']
  ): Promise<KnowledgeFile> => {
    try {
      console.log(`📚 Dodaję plik wiedzy: ${uri}`);

      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('Plik nie istnieje');
      }

      const filename = uri.split('/').pop() || 'unknown';
      const detectedType = type || detectFileType(filename);
      
      // Sprawdź czy plik już istnieje
      const existingFile = knowledgeFiles.find(f => f.path === uri);
      if (existingFile) {
        console.log('📝 Plik już istnieje, aktualizuję metadane');
        return existingFile;
      }

      // Utwórz obiekt pliku wiedzy
      const knowledgeFile: KnowledgeFile = {
        id: `knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: filename,
        type: detectedType,
        path: uri,
        size: fileInfo.size || 0,
        addedAt: new Date(),
        accessCount: 0,
        isIndexed: false,
        metadata: await extractMetadata(uri, detectedType),
      };

      setKnowledgeFiles(prev => [...prev, knowledgeFile]);

      // Automatycznie indeksuj plik w tle
      setTimeout(() => {
        indexFile(knowledgeFile.id);
      }, 1000);

      console.log(`✅ Dodano plik wiedzy: ${filename} (${detectedType})`);
      return knowledgeFile;

    } catch (error) {
      console.error('❌ Błąd dodawania pliku wiedzy:', error);
      throw error;
    }
  }, [knowledgeFiles]);

  // Wyodrębnianie metadanych z pliku
  const extractMetadata = async (
    filePath: string, 
    type: KnowledgeFile['type']
  ): Promise<KnowledgeFile['metadata']> => {
    const metadata: KnowledgeFile['metadata'] = {};

    try {
      switch (type) {
        case 'zim':
          metadata.title = 'Wikipedia Offline';
          metadata.description = 'Offline Wikipedia archive';
          metadata.language = 'pl'; // Domyślnie polski
          break;
          
        case 'pdf':
          metadata.title = filePath.split('/').pop()?.replace('.pdf', '');
          metadata.description = 'PDF document';
          break;
          
        case 'html':
          // Spróbuj wyodrębnić tytuł z HTML
          const htmlContent = await FileSystem.readAsStringAsync(filePath, {
            length: 2048 // Przeczytaj tylko początek
          });
          const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
          if (titleMatch) {
            metadata.title = titleMatch[1];
          }
          break;
          
        case 'json':
          // Spróbuj przeczytać metadane z JSON
          const jsonContent = await FileSystem.readAsStringAsync(filePath, {
            length: 1024
          });
          try {
            const jsonData = JSON.parse(jsonContent);
            metadata.title = jsonData.title || jsonData.name;
            metadata.author = jsonData.author;
            metadata.description = jsonData.description;
            metadata.version = jsonData.version;
          } catch (e) {
            // Ignoruj błędy parsowania
          }
          break;
          
        case 'md':
          // Wyodrębnij tytuł z pierwszej linii Markdown
          const mdContent = await FileSystem.readAsStringAsync(filePath, {
            length: 512
          });
          const mdTitleMatch = mdContent.match(/^#\s+(.+)$/m);
          if (mdTitleMatch) {
            metadata.title = mdTitleMatch[1];
          }
          break;
      }

      // Dodaj podstawowe informacje
      if (!metadata.title) {
        metadata.title = filePath.split('/').pop()?.split('.')[0];
      }

    } catch (error) {
      console.warn('⚠️ Nie można wyodrębnić metadanych:', error);
    }

    return metadata;
  };

  // Indeksowanie pliku
  const indexFile = useCallback(async (fileId: string): Promise<void> => {
    const file = knowledgeFiles.find(f => f.id === fileId);
    if (!file) return;

    try {
      console.log(`🔍 Indeksuję plik: ${file.name}`);
      setIsIndexing(true);
      setIndexingProgress(0);

      const articles = await extractArticles(file);
      const searchIndex = await buildSearchIndex(articles);

      // Aktualizuj plik z indeksem
      setKnowledgeFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, isIndexed: true, searchIndex, metadata: { ...f.metadata, articleCount: articles.length } }
          : f
      ));

      // Zapisz artykuły do sandbox
      await createAutonomousFile(
        `knowledge_index_${fileId}.json`,
        JSON.stringify({
          fileId,
          fileName: file.name,
          articles: articles.slice(0, 100), // Ogranicz do 100 artykułów dla wydajności
          indexedAt: new Date(),
          totalArticles: articles.length
        }),
        'json'
      );

      console.log(`✅ Zaindeksowano ${articles.length} artykułów z ${file.name}`);

    } catch (error) {
      console.error(`❌ Błąd indeksowania ${file.name}:`, error);
    } finally {
      setIsIndexing(false);
      setIndexingProgress(0);
    }
  }, [knowledgeFiles, createAutonomousFile]);

  // Wyodrębnianie artykułów z pliku
  const extractArticles = async (file: KnowledgeFile): Promise<KnowledgeArticle[]> => {
    const articles: KnowledgeArticle[] = [];

    try {
      switch (file.type) {
        case 'html':
          const htmlArticles = await extractFromHTML(file.path);
          articles.push(...htmlArticles);
          break;
          
        case 'txt':
        case 'md':
          const textArticles = await extractFromText(file.path, file.type);
          articles.push(...textArticles);
          break;
          
        case 'json':
          const jsonArticles = await extractFromJSON(file.path);
          articles.push(...jsonArticles);
          break;
          
        case 'zim':
          // ZIM files wymagają specjalnej biblioteki
          // Na razie symulujemy wyodrębnianie
          const zimArticles = await simulateZIMExtraction(file);
          articles.push(...zimArticles);
          break;
          
        case 'pdf':
          // PDF wymagałby biblioteki do wyodrębniania tekstu
          // Na razie tworzymy placeholder
          articles.push(await createPDFPlaceholder(file));
          break;
      }

      setIndexingProgress(100);

    } catch (error) {
      console.error('❌ Błąd wyodrębniania artykułów:', error);
    }

    return articles;
  };

  // Wyodrębnianie z HTML
  const extractFromHTML = async (filePath: string): Promise<KnowledgeArticle[]> => {
    const articles: KnowledgeArticle[] = [];
    
    try {
      const content = await FileSystem.readAsStringAsync(filePath);
      
      // Usuń tagi HTML i wyodrębnij tekst
      const textContent = content
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Wyodrębnij tytuł
      const titleMatch = content.match(/<title>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : filePath.split('/').pop() || 'Untitled';

      // Podziel na sekcje (uproszczone)
      const sections = textContent.split(/\n\n+/).filter(section => section.length > 100);
      
      sections.forEach((section, index) => {
        const words = section.split(/\s+/);
        const wordCount = words.length;
        
        articles.push({
          id: `html_${index}`,
          title: index === 0 ? title : `${title} - Sekcja ${index + 1}`,
          content: section,
          summary: section.substring(0, 200) + '...',
          categories: ['html', 'document'],
          links: [],
          images: [],
          wordCount,
          readingTime: Math.ceil(wordCount / 200), // 200 słów na minutę
        });
      });

    } catch (error) {
      console.error('❌ Błąd wyodrębniania HTML:', error);
    }

    return articles;
  };

  // Wyodrębnianie z tekstu
  const extractFromText = async (filePath: string, type: 'txt' | 'md'): Promise<KnowledgeArticle[]> => {
    const articles: KnowledgeArticle[] = [];
    
    try {
      const content = await FileSystem.readAsStringAsync(filePath);
      
      if (type === 'md') {
        // Podziel na sekcje według nagłówków
        const sections = content.split(/^#+\s+/m).filter(section => section.trim().length > 0);
        
        sections.forEach((section, index) => {
          const lines = section.split('\n');
          const title = lines[0] || `Sekcja ${index + 1}`;
          const body = lines.slice(1).join('\n').trim();
          
          if (body.length > 50) {
            const wordCount = body.split(/\s+/).length;
            
            articles.push({
              id: `md_${index}`,
              title: title.trim(),
              content: body,
              summary: body.substring(0, 200) + '...',
              categories: ['markdown', 'document'],
              links: [],
              images: [],
              wordCount,
              readingTime: Math.ceil(wordCount / 200),
            });
          }
        });
      } else {
        // Podziel na paragrafy dla zwykłego tekstu
        const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 100);
        
        paragraphs.forEach((paragraph, index) => {
          const wordCount = paragraph.split(/\s+/).length;
          
          articles.push({
            id: `txt_${index}`,
            title: `Paragraf ${index + 1}`,
            content: paragraph.trim(),
            summary: paragraph.substring(0, 150) + '...',
            categories: ['text', 'document'],
            links: [],
            images: [],
            wordCount,
            readingTime: Math.ceil(wordCount / 200),
          });
        });
      }

    } catch (error) {
      console.error('❌ Błąd wyodrębniania tekstu:', error);
    }

    return articles;
  };

  // Wyodrębnianie z JSON
  const extractFromJSON = async (filePath: string): Promise<KnowledgeArticle[]> => {
    const articles: KnowledgeArticle[] = [];
    
    try {
      const content = await FileSystem.readAsStringAsync(filePath);
      const data = JSON.parse(content);
      
      // Spróbuj różne struktury JSON
      if (Array.isArray(data)) {
        data.forEach((item, index) => {
          if (typeof item === 'object' && item.title && item.content) {
            const wordCount = item.content.split(/\s+/).length;
            
            articles.push({
              id: `json_${index}`,
              title: item.title,
              content: item.content,
              summary: item.summary || item.content.substring(0, 200) + '...',
              categories: item.categories || ['json', 'data'],
              links: item.links || [],
              images: item.images || [],
              wordCount,
              readingTime: Math.ceil(wordCount / 200),
            });
          }
        });
      } else if (data.articles && Array.isArray(data.articles)) {
        // Format z zagnieżdżonymi artykułami
        data.articles.forEach((article: any, index: number) => {
          const wordCount = article.content.split(/\s+/).length;
          
          articles.push({
            id: `json_nested_${index}`,
            title: article.title,
            content: article.content,
            summary: article.summary || article.content.substring(0, 200) + '...',
            categories: article.categories || ['json'],
            links: article.links || [],
            images: article.images || [],
            wordCount,
            readingTime: Math.ceil(wordCount / 200),
          });
        });
      }

    } catch (error) {
      console.error('❌ Błąd wyodrębniania JSON:', error);
    }

    return articles;
  };

  // Symulacja wyodrębniania ZIM (Wikipedia offline)
  const simulateZIMExtraction = async (file: KnowledgeFile): Promise<KnowledgeArticle[]> => {
    // W rzeczywistej implementacji użyłbyś biblioteki do czytania ZIM
    // Na razie tworzymy przykładowe artykuły Wikipedia
    const sampleArticles = [
      {
        title: 'Sztuczna inteligencja',
        content: 'Sztuczna inteligencja (AI) to dziedzina informatyki zajmująca się tworzeniem systemów komputerowych zdolnych do wykonywania zadań wymagających inteligencji...',
        categories: ['technologia', 'informatyka', 'AI']
      },
      {
        title: 'Machine Learning',
        content: 'Uczenie maszynowe to poddziedzina sztucznej inteligencji, która koncentruje się na algorytmach umożliwiających komputerom uczenie się...',
        categories: ['technologia', 'algorytmy', 'nauka']
      },
      {
        title: 'React Native',
        content: 'React Native to framework do tworzenia aplikacji mobilnych opracowany przez Facebook...',
        categories: ['programowanie', 'mobile', 'javascript']
      }
    ];

    return sampleArticles.map((article, index) => {
      const wordCount = article.content.split(/\s+/).length;
      
      return {
        id: `zim_${index}`,
        title: article.title,
        content: article.content,
        summary: article.content.substring(0, 150) + '...',
        categories: article.categories,
        links: [],
        images: [],
        wordCount,
        readingTime: Math.ceil(wordCount / 200),
      };
    });
  };

  // Placeholder dla PDF
  const createPDFPlaceholder = async (file: KnowledgeFile): Promise<KnowledgeArticle> => {
    return {
      id: 'pdf_placeholder',
      title: file.metadata.title || file.name,
      content: `To jest plik PDF: ${file.name}. Aby w pełni wykorzystać zawartość PDF, potrzebna jest biblioteka do wyodrębniania tekstu.`,
      summary: 'Dokument PDF - wymagana dodatkowa biblioteka do pełnego odczytu',
      categories: ['pdf', 'document'],
      links: [],
      images: [],
      wordCount: 20,
      readingTime: 1,
    };
  };

  // Budowanie indeksu wyszukiwania
  const buildSearchIndex = async (articles: KnowledgeArticle[]): Promise<KnowledgeSearchIndex> => {
    const words = new Map<string, number[]>();
    const categories = new Map<string, string[]>();

    articles.forEach((article, articleIndex) => {
      // Indeksuj słowa
      const text = (article.title + ' ' + article.content).toLowerCase();
      const wordList = text.match(/\b\w+\b/g) || [];
      
      wordList.forEach((word, wordIndex) => {
        if (word.length > 2) { // Ignoruj bardzo krótkie słowa
          if (!words.has(word)) {
            words.set(word, []);
          }
          words.get(word)!.push(articleIndex * 1000 + wordIndex); // Pozycja w całej kolekcji
        }
      });

      // Indeksuj kategorie
      article.categories.forEach(category => {
        if (!categories.has(category)) {
          categories.set(category, []);
        }
        categories.get(category)!.push(article.id);
      });
    });

    return {
      words,
      articles,
      categories,
      lastUpdated: new Date(),
    };
  };

  // Wyszukiwanie w wiedzy
  const searchKnowledge = useCallback(async (
    query: KnowledgeQuery
  ): Promise<KnowledgeSearchResult[]> => {
    const results: KnowledgeSearchResult[] = [];
    
    try {
      console.log(`🔍 Wyszukuję: "${query.query}"`);
      
      const searchTerms = query.query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
      
      for (const file of knowledgeFiles) {
        if (!file.isIndexed || !file.searchIndex) continue;
        
        // Filtruj według typu pliku
        if (query.filters?.fileTypes && !query.filters.fileTypes.includes(file.type)) {
          continue;
        }

        const { articles, words, categories } = file.searchIndex;
        
        articles.forEach(article => {
          let relevanceScore = 0;
          const matchedTerms: string[] = [];
          
          // Wyszukiwanie w tytule (wyższa waga)
          searchTerms.forEach(term => {
            if (article.title.toLowerCase().includes(term)) {
              relevanceScore += 10;
              matchedTerms.push(term);
            }
          });
          
          // Wyszukiwanie w treści
          searchTerms.forEach(term => {
            const positions = words.get(term) || [];
            if (positions.length > 0) {
              relevanceScore += positions.length;
              matchedTerms.push(term);
            }
          });
          
          // Wyszukiwanie w kategoriach
          if (query.filters?.categories) {
            query.filters.categories.forEach(category => {
              if (article.categories.includes(category)) {
                relevanceScore += 5;
              }
            });
          }
          
          // Filtruj według liczby słów
          if (query.filters?.minWordCount && article.wordCount < query.filters.minWordCount) {
            return;
          }
          if (query.filters?.maxWordCount && article.wordCount > query.filters.maxWordCount) {
            return;
          }
          
          if (relevanceScore > 0) {
            // Utwórz kontekst z podświetleniem
            const context = createSearchContext(article.content, searchTerms);
            
            results.push({
              article,
              relevanceScore,
              matchedTerms: [...new Set(matchedTerms)],
              context,
              file,
            });
          }
        });
      }
      
      // Sortuj według relevancji
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      // Ogranicz wyniki
      const limit = query.limit || 20;
      const limitedResults = results.slice(0, limit);
      
      console.log(`✅ Znaleziono ${limitedResults.length} wyników`);
      return limitedResults;

    } catch (error) {
      console.error('❌ Błąd wyszukiwania:', error);
      return [];
    }
  }, [knowledgeFiles]);

  // Tworzenie kontekstu wyszukiwania
  const createSearchContext = (content: string, searchTerms: string[]): string => {
    const contextLength = 200;
    let bestMatch = '';
    let bestScore = 0;
    
    // Znajdź najlepszy fragment z największą liczbą dopasowań
    for (let i = 0; i < content.length - contextLength; i += 50) {
      const fragment = content.substring(i, i + contextLength);
      const fragmentLower = fragment.toLowerCase();
      
      let score = 0;
      searchTerms.forEach(term => {
        const matches = (fragmentLower.match(new RegExp(term, 'g')) || []).length;
        score += matches;
      });
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = fragment;
      }
    }
    
    // Podświetl znalezione terminy
    let highlightedContext = bestMatch;
    searchTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedContext = highlightedContext.replace(regex, '**$1**');
    });
    
    return highlightedContext + '...';
  };

  // Pozostałe funkcje (uproszczone implementacje)
  const removeKnowledgeFile = useCallback(async (fileId: string) => {
    setKnowledgeFiles(prev => prev.filter(f => f.id !== fileId));
    console.log(`🗑️ Usunięto plik wiedzy: ${fileId}`);
  }, []);

  const updateFileMetadata = useCallback(async (
    fileId: string, 
    metadata: Partial<KnowledgeFile['metadata']>
  ) => {
    setKnowledgeFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, metadata: { ...f.metadata, ...metadata } } : f
    ));
  }, []);

  const getArticle = useCallback(async (
    fileId: string, 
    articleId: string
  ): Promise<KnowledgeArticle | null> => {
    const file = knowledgeFiles.find(f => f.id === fileId);
    if (!file?.searchIndex) return null;
    
    const article = file.searchIndex.articles.find(a => a.id === articleId);
    if (article) {
      // Aktualizuj statystyki dostępu
      setKnowledgeFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, lastAccessed: new Date(), accessCount: f.accessCount + 1 } : f
      ));
    }
    
    return article || null;
  }, [knowledgeFiles]);

  const getRandomArticle = useCallback(async (fileId?: string): Promise<KnowledgeArticle | null> => {
    const availableFiles = fileId 
      ? knowledgeFiles.filter(f => f.id === fileId && f.isIndexed)
      : knowledgeFiles.filter(f => f.isIndexed);
    
    if (availableFiles.length === 0) return null;
    
    const randomFile = availableFiles[Math.floor(Math.random() * availableFiles.length)];
    const articles = randomFile.searchIndex?.articles || [];
    
    if (articles.length === 0) return null;
    
    const randomArticle = articles[Math.floor(Math.random() * articles.length)];
    
    // Aktualizuj statystyki
    setKnowledgeFiles(prev => prev.map(f => 
      f.id === randomFile.id ? { ...f, lastAccessed: new Date(), accessCount: f.accessCount + 1 } : f
    ));
    
    return randomArticle;
  }, [knowledgeFiles]);

  const reindexAll = useCallback(async () => {
    console.log('🔄 Ponowne indeksowanie wszystkich plików...');
    for (const file of knowledgeFiles) {
      await indexFile(file.id);
    }
  }, [knowledgeFiles, indexFile]);

  const importKnowledgePackage = useCallback(async (packagePath: string) => {
    // Implementacja importu paczek wiedzy (ZIP/JSON)
    console.log(`📦 Importuję paczkę wiedzy: ${packagePath}`);
    // TODO: Implementacja
  }, []);

  const exportKnowledgeIndex = useCallback(async (): Promise<string> => {
    const exportData = {
      files: knowledgeFiles.map(f => ({
        ...f,
        searchIndex: undefined // Nie eksportuj indeksu (za duży)
      })),
      exportedAt: new Date(),
      version: '1.0'
    };
    
    const exportPath = `${FileSystem.documentDirectory}knowledge_export.json`;
    await FileSystem.writeAsStringAsync(exportPath, JSON.stringify(exportData, null, 2));
    
    return exportPath;
  }, [knowledgeFiles]);

  const getUsageStats = useCallback(async () => {
    // Symulacja statystyk użycia
    return {
      totalQueries: 0,
      popularTerms: [],
      mostAccessedFiles: knowledgeFiles.sort((a, b) => b.accessCount - a.accessCount).slice(0, 5),
      categoryDistribution: new Map<string, number>(),
    };
  }, [knowledgeFiles]);

  // Zarządzanie danymi
  const saveKnowledgeData = useCallback(async () => {
    try {
      const data = {
        knowledgeFiles: knowledgeFiles.map(f => ({
          ...f,
          searchIndex: undefined // Nie zapisuj indeksu do AsyncStorage (za duży)
        })),
      };
      await AsyncStorage.setItem('wera_knowledge_data', JSON.stringify(data));
    } catch (error) {
      console.error('❌ Błąd zapisu danych wiedzy:', error);
    }
  }, [knowledgeFiles]);

  const loadKnowledgeData = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem('wera_knowledge_data');
      if (data) {
        const parsed = JSON.parse(data);
        setKnowledgeFiles(parsed.knowledgeFiles || []);
      }
    } catch (error) {
      console.error('❌ Błąd ładowania danych wiedzy:', error);
    }
  }, []);

  // Automatyczne zapisywanie
  useEffect(() => {
    const saveInterval = setInterval(saveKnowledgeData, 5 * 60 * 1000); // Co 5 minut
    return () => clearInterval(saveInterval);
  }, [saveKnowledgeData]);

  // Oblicz statystyki
  const totalArticles = knowledgeFiles.reduce((sum, file) => 
    sum + (file.metadata.articleCount || 0), 0
  );
  
  const totalSize = knowledgeFiles.reduce((sum, file) => sum + file.size, 0);

  const value: OfflineKnowledgeContextType = {
    knowledgeFiles,
    totalArticles,
    totalSize,
    isIndexing,
    indexingProgress,
    addKnowledgeFile,
    removeKnowledgeFile,
    updateFileMetadata,
    searchKnowledge,
    getArticle,
    getRandomArticle,
    indexFile,
    reindexAll,
    importKnowledgePackage,
    exportKnowledgeIndex,
    getUsageStats,
    saveKnowledgeData,
    loadKnowledgeData,
  };

  return (
    <OfflineKnowledgeContext.Provider value={value}>
      {children}
    </OfflineKnowledgeContext.Provider>
  );
};

export const useOfflineKnowledge = () => {
  const context = useContext(OfflineKnowledgeContext);
  if (!context) {
    throw new Error('useOfflineKnowledge must be used within OfflineKnowledgeProvider');
  }
  return context;
};