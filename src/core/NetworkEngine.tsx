import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Network from 'expo-network';
import { Platform } from 'react-native';
import { useMemory } from '../contexts/MemoryContext';

export interface NetworkAccess {
  isEnabled: boolean;
  mode: 'disabled' | 'partial' | 'full' | 'learning_only' | 'emergency_only' | 'curated_only';
  allowedDomains: string[];
  blockedDomains: string[];
  dataUsageLimit: number; // w MB
  currentDataUsage: number; // w MB
  learningEnabled: boolean;
  inspirationEnabled: boolean;
  newsEnabled: boolean;
  lastAccessTime: Date;
  // Nowe opcje dla trybu częściowego
  partialSettings: {
    maxRequestsPerHour: number;
    allowedContentTypes: ('text' | 'image' | 'video' | 'audio')[];
    maxContentSizeKB: number;
    requiresApproval: boolean;
    autoFilterContent: boolean;
    emergencyOverride: boolean;
    trustedSourcesOnly: boolean;
    timeWindowStart?: number; // godzina 0-23
    timeWindowEnd?: number; // godzina 0-23
  };
}

export interface WebContent {
  id: string;
  url: string;
  title: string;
  content: string;
  category: 'news' | 'inspiration' | 'learning' | 'knowledge' | 'entertainment';
  timestamp: Date;
  relevanceScore: number; // 0-100
  emotionalImpact: number; // -100 to +100
  tags: string[];
  source: string;
  isProcessed: boolean;
  learningPoints: string[];
}

export interface LearningEntry {
  id: string;
  source: string;
  content: string;
  category: 'fact' | 'skill' | 'insight' | 'correction' | 'update';
  importance: number; // 0-100
  timestamp: Date;
  isIntegrated: boolean;
  relatedTopics: string[];
  confidence: number; // 0-100
}

export interface NetworkStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  dataDownloaded: number; // w MB
  learningEntriesCount: number;
  lastUpdateCheck: Date;
  averageResponseTime: number; // w ms
}

interface NetworkEngineContextType {
  networkAccess: NetworkAccess;
  webContent: WebContent[];
  learningEntries: LearningEntry[];
  networkStats: NetworkStats;
  isOnline: boolean;
  updateNetworkAccess: (access: Partial<NetworkAccess>) => Promise<void>;
  fetchContent: (url: string, category: WebContent['category']) => Promise<WebContent | null>;
  searchContent: (query: string, category?: WebContent['category']) => Promise<WebContent[]>;
  processContent: (contentId: string) => Promise<void>;
  addLearningEntry: (entry: Omit<LearningEntry, 'id' | 'timestamp'>) => Promise<LearningEntry>;
  integrateLearning: (entryId: string) => Promise<void>;
  fetchInspiration: () => Promise<WebContent[]>;
  fetchNews: () => Promise<WebContent[]>;
  fetchLearningMaterial: (topic: string) => Promise<WebContent[]>;
  checkForUpdates: () => Promise<void>;
  getNetworkStatus: () => Promise<Network.NetworkState>;
  clearCache: () => Promise<void>;
  exportLearningData: () => Promise<string>;
  generateNetworkReflection: () => string;
  saveNetworkData: () => Promise<void>;
  loadNetworkData: () => Promise<void>;
}

const NetworkEngineContext = createContext<NetworkEngineContextType | undefined>(undefined);

const NETWORK_FILE_PATH = `${FileSystem.documentDirectory}network/`;

// Dozwolone domeny dla bezpieczeństwa
const DEFAULT_ALLOWED_DOMAINS = [
  'wikipedia.org',
  'wikimedia.org',
  'news.google.com',
  'reddit.com',
  'stackoverflow.com',
  'github.com',
  'medium.com',
  'arxiv.org',
  'scholar.google.com',
];

// Zablokowane domeny
const DEFAULT_BLOCKED_DOMAINS = [
  'facebook.com',
  'twitter.com',
  'instagram.com',
  'tiktok.com',
  'ads.google.com',
  'doubleclick.net',
];

export const NetworkEngineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [networkAccess, setNetworkAccess] = useState<NetworkAccess>({
    isEnabled: false,
    mode: 'partial',
    allowedDomains: DEFAULT_ALLOWED_DOMAINS,
    blockedDomains: DEFAULT_BLOCKED_DOMAINS,
    dataUsageLimit: 100, // 100MB
    currentDataUsage: 0,
    learningEnabled: true,
    inspirationEnabled: true,
    newsEnabled: false,
    lastAccessTime: new Date(),
    partialSettings: {
      maxRequestsPerHour: 100,
      allowedContentTypes: ['text'],
      maxContentSizeKB: 10240, // 10MB
      requiresApproval: false,
      autoFilterContent: true,
      emergencyOverride: false,
      trustedSourcesOnly: false,
    },
  });

  const [webContent, setWebContent] = useState<WebContent[]>([]);
  const [learningEntries, setLearningEntries] = useState<LearningEntry[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    dataDownloaded: 0,
    learningEntriesCount: 0,
    lastUpdateCheck: new Date(),
    averageResponseTime: 0,
  });

  const { addMemory } = useMemory();

  // Monitorowanie stanu sieci
  useEffect(() => {
  const checkNetworkStatus = async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      setIsOnline(networkState.isConnected || false);
    } catch (error) {
        console.error('Błąd sprawdzania stanu sieci:', error);
      setIsOnline(false);
      }
    };

    checkNetworkStatus();
    const networkInterval = setInterval(checkNetworkStatus, 30000); // co 30 sekund

    return () => clearInterval(networkInterval);
  }, []);

  // Automatyczne pobieranie inspiracji co 4-6 godzin
  useEffect(() => {
    if (!networkAccess.isEnabled || !networkAccess.inspirationEnabled) return;

    const inspirationInterval = setInterval(async () => {
      if (isOnline && networkAccess.currentDataUsage < networkAccess.dataUsageLimit) {
        await fetchInspiration();
      }
    }, 4 * 60 * 60 * 1000 + Math.random() * 2 * 60 * 60 * 1000); // 4-6 godzin

    return () => clearInterval(inspirationInterval);
  }, [networkAccess, isOnline]);

  // Aktualizacja dostępu sieciowego
  const updateNetworkAccess = useCallback(async (access: Partial<NetworkAccess>) => {
    const newAccess = { ...networkAccess, ...access };
    setNetworkAccess(newAccess);

    try {
      await AsyncStorage.setItem('wera_network_access', JSON.stringify(newAccess));
    } catch (error) {
      console.error('Błąd zapisu dostępu sieciowego:', error);
    }
  }, [networkAccess]);

  // Sprawdzenie czy domena jest dozwolona
  const isDomainAllowed = useCallback((url: string): boolean => {
    try {
      const domain = new URL(url).hostname;
      
      // Sprawdź zablokowane domeny
      if (networkAccess.blockedDomains.some(blocked => domain.includes(blocked))) {
        return false;
      }

      // Logika dla różnych trybów
      switch (networkAccess.mode) {
        case 'disabled':
          return false;
          
        case 'full':
          return true;
          
        case 'partial':
          return isPartialAccessAllowed(url, domain);
          
        case 'learning_only':
          return isLearningDomain(domain);
          
        case 'emergency_only':
          return isEmergencyDomain(domain);
          
        case 'curated_only':
          return networkAccess.allowedDomains.some(allowed => domain.includes(allowed));
          
        default:
          return false;
      }
    } catch (error) {
      console.error('Błąd sprawdzania domeny:', error);
      return false;
    }
  }, [networkAccess]);

  // Sprawdzenie dostępu częściowego
  const isPartialAccessAllowed = useCallback((url: string, domain: string): boolean => {
    const { partialSettings } = networkAccess;
    
    // Sprawdź okno czasowe
    if (partialSettings.timeWindowStart !== undefined && partialSettings.timeWindowEnd !== undefined) {
      const currentHour = new Date().getHours();
      if (currentHour < partialSettings.timeWindowStart || currentHour > partialSettings.timeWindowEnd) {
        return false;
      }
    }
    
    // Sprawdź limit requestów na godzinę
    const hourlyRequests = getHourlyRequestCount();
    if (hourlyRequests >= partialSettings.maxRequestsPerHour) {
      console.log('🚫 Osiągnięto limit requestów na godzinę');
      return false;
    }
    
    // Sprawdź zaufane źródła
    if (partialSettings.trustedSourcesOnly) {
      const trustedDomains = [
        'wikipedia.org', 'wikimedia.org', 'github.com', 'stackoverflow.com',
        'arxiv.org', 'scholar.google.com', 'news.google.com'
      ];
      return trustedDomains.some(trusted => domain.includes(trusted));
    }
    
    // Sprawdź dozwolone domeny
    return networkAccess.allowedDomains.some(allowed => domain.includes(allowed));
  }, [networkAccess]);

  // Sprawdzenie czy domena służy nauce
  const isLearningDomain = useCallback((domain: string): boolean => {
    const learningDomains = [
      'wikipedia.org', 'wikimedia.org', 'arxiv.org', 'scholar.google.com',
      'coursera.org', 'edx.org', 'khanacademy.org', 'stackoverflow.com',
      'github.com', 'medium.com', 'towards'
    ];
    return learningDomains.some(learning => domain.includes(learning));
  }, []);

  // Sprawdzenie czy domena jest awaryjna
  const isEmergencyDomain = useCallback((domain: string): boolean => {
    const emergencyDomains = [
      'emergency.gov', 'weather.gov', 'cdc.gov', 'who.int',
      'gov.pl', 'gov.uk', 'europa.eu'
    ];
    return emergencyDomains.some(emergency => domain.includes(emergency));
  }, []);

  // Liczenie requestów w ostatniej godzinie
  const getHourlyRequestCount = useCallback((): number => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return webContent.filter(content => content.timestamp > oneHourAgo).length;
  }, [webContent]);

  // Inteligentne filtrowanie zawartości
  const filterContent = useCallback(async (content: string, url: string): Promise<{
    filtered: string;
    removed: string[];
    score: number;
  }> => {
    const { partialSettings } = networkAccess;
    
    if (!partialSettings.autoFilterContent) {
      return { filtered: content, removed: [], score: 100 };
    }

    let filtered = content;
    const removed: string[] = [];
    let score = 100;

    // Usuń potencjalnie szkodliwe treści
    const harmfulPatterns = [
      /\b(hack|crack|piracy|illegal|virus|malware)\b/gi,
      /\b(violence|hate|discrimination)\b/gi,
      /\b(scam|fraud|phishing)\b/gi,
    ];

    harmfulPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          filtered = filtered.replace(new RegExp(match, 'gi'), '[FILTERED]');
          removed.push(match);
          score -= 10;
        });
      }
    });

    // Sprawdź rozmiar zawartości
    const sizeKB = new Blob([filtered]).size / 1024;
    if (sizeKB > partialSettings.maxContentSizeKB) {
      filtered = filtered.substring(0, partialSettings.maxContentSizeKB * 1024);
      removed.push(`Content truncated (${sizeKB.toFixed(1)}KB > ${partialSettings.maxContentSizeKB}KB)`);
      score -= 20;
    }

    // Sprawdź typ zawartości
    const contentType = detectContentType(filtered);
    if (!partialSettings.allowedContentTypes.includes(contentType)) {
      return { filtered: '[CONTENT TYPE NOT ALLOWED]', removed: [`Content type: ${contentType}`], score: 0 };
    }

    console.log(`🔍 Przefiltrowano zawartość: ${removed.length} elementów usuniętych, wynik: ${score}`);
    
    return { filtered, removed, score };
  }, [networkAccess]);

  // Wykrywanie typu zawartości
  const detectContentType = (content: string): 'text' | 'image' | 'video' | 'audio' => {
    if (content.includes('<img') || content.includes('data:image/') || /\.(jpg|jpeg|png|gif|webp)/i.test(content)) {
      return 'image';
    }
    if (content.includes('<video') || /\.(mp4|webm|avi|mov)/i.test(content)) {
      return 'video';
    }
    if (content.includes('<audio') || /\.(mp3|wav|ogg|m4a)/i.test(content)) {
      return 'audio';
    }
    return 'text';
  };

  // Żądanie zatwierdzenia dla trybu częściowego
  const requestPartialAccess = useCallback(async (
    url: string,
    reason: string
  ): Promise<boolean> => {
    const { partialSettings } = networkAccess;
    
    if (!partialSettings.requiresApproval) {
      return true;
    }

    // W rzeczywistej implementacji byłby to dialog lub notyfikacja
    console.log(`🔒 Żądanie dostępu do: ${url}`);
    console.log(`📝 Powód: ${reason}`);
    
    // Symulacja zatwierdzenia (w rzeczywistości byłby to interfejs użytkownika)
    const approved = Math.random() > 0.3; // 70% szans na zatwierdzenie
    
    if (approved) {
      console.log('✅ Dostęp zatwierdzony');
      
      // Dodaj domenę do tymczasowo dozwolonych
      const domain = new URL(url).hostname;
      setNetworkAccess(prev => ({
        ...prev,
        allowedDomains: [...prev.allowedDomains, domain],
      }));
    } else {
      console.log('❌ Dostęp odrzucony');
    }
    
    return approved;
  }, [networkAccess]);

  // Tryb awaryjny override
  const emergencyOverride = useCallback(async (url: string, justification: string): Promise<boolean> => {
    const { partialSettings } = networkAccess;
    
    if (!partialSettings.emergencyOverride) {
      return false;
    }

    console.log(`🚨 TRYB AWARYJNY: Dostęp do ${url}`);
    console.log(`📋 Uzasadnienie: ${justification}`);
    
    // Loguj awaryjny dostęp
    await addMemory(
      `Użyto trybu awaryjnego dla dostępu do: ${url}. Uzasadnienie: ${justification}`,
      90,
      ['emergency', 'network', 'override'],
      'critical'
    );
    
    // Tymczasowo pozwól na dostęp
    const domain = new URL(url).hostname;
    setNetworkAccess(prev => ({
      ...prev,
      allowedDomains: [...prev.allowedDomains, domain],
    }));
    
    return true;
  }, [networkAccess]);

  // Analiza bezpieczeństwa URL
  const analyzeUrlSafety = useCallback(async (url: string): Promise<{
    safe: boolean;
    threats: string[];
    confidence: number;
  }> => {
    const threats: string[] = [];
    let confidence = 100;
    
    try {
      const urlObj = new URL(url);
      
      // Sprawdź protokół
      if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
        threats.push('Nieznany protokół');
        confidence -= 30;
      }
      
      // Sprawdź podejrzane domeny
      const suspiciousDomains = [
        'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', // URL shorteners
        'tempmail', 'guerrillamail', '10minutemail', // Temporary emails
        'torrent', 'piratebay', 'kickass', // Piracy
      ];
      
      if (suspiciousDomains.some(suspicious => urlObj.hostname.includes(suspicious))) {
        threats.push('Podejrzana domena');
        confidence -= 40;
      }
      
      // Sprawdź długość URL (bardzo długie mogą być podejrzane)
      if (url.length > 200) {
        threats.push('Podejrzanie długi URL');
        confidence -= 20;
      }
      
      // Sprawdź znaki specjalne
      if (/[^\w\-\.\/\?\=\&\%\:]/g.test(url)) {
        threats.push('Podejrzane znaki w URL');
        confidence -= 15;
      }
      
    } catch (error) {
      threats.push('Nieprawidłowy format URL');
      confidence = 0;
    }
    
    const safe = confidence > 50 && threats.length === 0;
    
    console.log(`🔒 Analiza bezpieczeństwa ${url}: ${safe ? 'BEZPIECZNY' : 'NIEBEZPIECZNY'} (${confidence}%)`);
    
    return { safe, threats, confidence };
  }, []);

  // Pobieranie zawartości z URL
  const fetchContent = useCallback(async (
    url: string, 
    category: WebContent['category']
  ): Promise<WebContent | null> => {
    if (!networkAccess.isEnabled || !isOnline || !isDomainAllowed(url)) {
      return null;
    }

    if (networkAccess.currentDataUsage >= networkAccess.dataUsageLimit) {
      console.log('🚫 Osiągnięto limit danych');
      return null;
    }

    const startTime = Date.now();

    try {
      console.log(`🌐 Pobieranie zawartości: ${url}`);

      // Symulacja pobierania zawartości (w rzeczywistości byłby to rzeczywisty fetch)
      const response = await simulateFetch(url);
      const responseTime = Date.now() - startTime;

      if (!response.success) {
        setNetworkStats(prev => ({
          ...prev,
          totalRequests: prev.totalRequests + 1,
          failedRequests: prev.failedRequests + 1,
        }));
        return null;
      }

      const content: WebContent = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        url,
        title: response.title || 'Bez tytułu',
        content: response.content || '',
        category,
        timestamp: new Date(),
        relevanceScore: Math.floor(Math.random() * 40) + 60, // 60-100
        emotionalImpact: Math.floor(Math.random() * 200) - 100, // -100 to +100
        tags: response.tags || [],
        source: new URL(url).hostname,
        isProcessed: false,
        learningPoints: [],
      };

      setWebContent(prev => [...prev, content]);

      // Aktualizuj statystyki
      const dataSize = (response.content || '').length / (1024 * 1024); // MB
      setNetworkAccess(prev => ({
        ...prev,
        currentDataUsage: prev.currentDataUsage + dataSize,
        lastAccessTime: new Date(),
      }));

      setNetworkStats(prev => ({
        ...prev,
        totalRequests: prev.totalRequests + 1,
        successfulRequests: prev.successfulRequests + 1,
        dataDownloaded: prev.dataDownloaded + dataSize,
        averageResponseTime: (prev.averageResponseTime + responseTime) / 2,
      }));

      // Zapisz do pamięci
      await addMemory(
        `Pobrałam zawartość: "${content.title}" z ${content.source}`,
        10,
        ['network', 'content', category, content.source],
        'learning'
      );

      return content;

    } catch (error) {
      console.error('Błąd pobierania zawartości:', error);
      setNetworkStats(prev => ({
        ...prev,
        totalRequests: prev.totalRequests + 1,
        failedRequests: prev.failedRequests + 1,
      }));
      return null;
    }
  }, [networkAccess, isOnline, isDomainAllowed, addMemory]);

  // Wyszukiwanie zawartości
  const searchContent = useCallback(async (
    query: string, 
    category?: WebContent['category']
  ): Promise<WebContent[]> => {
    const filteredContent = webContent.filter(content => {
      const matchesQuery = content.title.toLowerCase().includes(query.toLowerCase()) ||
                          content.content.toLowerCase().includes(query.toLowerCase()) ||
                          content.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
      
      const matchesCategory = !category || content.category === category;
      
      return matchesQuery && matchesCategory;
    });

    return filteredContent.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }, [webContent]);

  // Przetwarzanie zawartości
  const processContent = useCallback(async (contentId: string) => {
    const content = webContent.find(c => c.id === contentId);
    if (!content || content.isProcessed) return;

    try {
      // Symulacja przetwarzania zawartości
      const learningPoints = extractLearningPoints(content.content);
      
      setWebContent(prev => prev.map(c => 
        c.id === contentId 
          ? { ...c, isProcessed: true, learningPoints }
          : c
      ));

      // Dodaj wpisy nauki
      for (const point of learningPoints) {
        await addLearningEntry({
          source: content.url,
          content: point,
          category: 'insight',
          importance: content.relevanceScore,
          isIntegrated: false,
          relatedTopics: content.tags,
          confidence: 80,
        });
      }

      console.log(`🧠 Przetworzono zawartość: ${content.title}`);
      
    } catch (error) {
      console.error('Błąd przetwarzania zawartości:', error);
    }
  }, [webContent]);

  // Dodanie wpisu nauki
  const addLearningEntry = useCallback(async (
    entry: Omit<LearningEntry, 'id' | 'timestamp'>
  ): Promise<LearningEntry> => {
    const learningEntry: LearningEntry = {
      ...entry,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };

    setLearningEntries(prev => [...prev, learningEntry]);
    setNetworkStats(prev => ({
      ...prev,
      learningEntriesCount: prev.learningEntriesCount + 1,
    }));

    // Zapisz do pliku
    try {
      const dirInfo = await FileSystem.getInfoAsync(NETWORK_FILE_PATH);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(NETWORK_FILE_PATH, { intermediates: true });
      }

      const learningFile = `${NETWORK_FILE_PATH}learning_${learningEntry.id}.json`;
      await FileSystem.writeAsStringAsync(learningFile, JSON.stringify(learningEntry, null, 2));
    } catch (error) {
      console.error('Błąd zapisu wpisu nauki:', error);
    }

    return learningEntry;
  }, []);

  // Integracja nauki
  const integrateLearning = useCallback(async (entryId: string) => {
    setLearningEntries(prev => prev.map(entry => 
      entry.id === entryId ? { ...entry, isIntegrated: true } : entry
    ));

    const entry = learningEntries.find(e => e.id === entryId);
    if (entry) {
      await addMemory(
        `Zintegrowałam nową wiedzę: ${entry.content}`,
        entry.importance,
        ['learning', 'integration', ...entry.relatedTopics],
        'learning'
      );
    }
  }, [learningEntries, addMemory]);

  // Pobieranie inspiracji
  const fetchInspiration = useCallback(async (): Promise<WebContent[]> => {
    if (!networkAccess.inspirationEnabled) return [];

    const inspirationSources = [
      'https://en.wikipedia.org/wiki/Special:Random',
      'https://www.reddit.com/r/philosophy/hot.json',
      'https://medium.com/tag/artificial-intelligence',
      'https://arxiv.org/list/cs.AI/recent',
    ];

    const results: WebContent[] = [];

    for (const source of inspirationSources.slice(0, 2)) { // Limit to 2 sources
      const content = await fetchContent(source, 'inspiration');
      if (content) {
        results.push(content);
        await processContent(content.id);
      }
    }

    return results;
  }, [networkAccess.inspirationEnabled, fetchContent, processContent]);

  // Pobieranie wiadomości
  const fetchNews = useCallback(async (): Promise<WebContent[]> => {
    if (!networkAccess.newsEnabled) return [];

    const newsSources = [
      'https://news.google.com/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVAB',
      'https://www.reddit.com/r/technology/hot.json',
    ];

    const results: WebContent[] = [];

    for (const source of newsSources) {
      const content = await fetchContent(source, 'news');
      if (content) {
        results.push(content);
        await processContent(content.id);
      }
    }

    return results;
  }, [networkAccess.newsEnabled, fetchContent, processContent]);

  // Pobieranie materiałów edukacyjnych
  const fetchLearningMaterial = useCallback(async (topic: string): Promise<WebContent[]> => {
    if (!networkAccess.learningEnabled) return [];

    const learningUrls = [
      `https://en.wikipedia.org/wiki/${encodeURIComponent(topic)}`,
      `https://stackoverflow.com/search?q=${encodeURIComponent(topic)}`,
      `https://scholar.google.com/scholar?q=${encodeURIComponent(topic)}`,
    ];

    const results: WebContent[] = [];

    for (const url of learningUrls) {
      const content = await fetchContent(url, 'learning');
      if (content) {
        results.push(content);
        await processContent(content.id);
      }
    }

    return results;
  }, [networkAccess.learningEnabled, fetchContent, processContent]);

  // Sprawdzenie aktualizacji
  const checkForUpdates = useCallback(async () => {
    if (!networkAccess.isEnabled || !isOnline) return;

    try {
      console.log('🔄 Sprawdzam aktualizacje...');

      // Symulacja sprawdzenia aktualizacji
      const hasUpdates = Math.random() < 0.3; // 30% szans na aktualizacje

      if (hasUpdates) {
        await addLearningEntry({
          source: 'system_update',
          content: 'Dostępne są nowe aktualizacje systemu',
          category: 'update',
          importance: 70,
          isIntegrated: false,
          relatedTopics: ['system', 'update'],
          confidence: 95,
        });
      }

      setNetworkStats(prev => ({
        ...prev,
        lastUpdateCheck: new Date(),
      }));

    } catch (error) {
      console.error('Błąd sprawdzania aktualizacji:', error);
    }
  }, [networkAccess.isEnabled, isOnline, addLearningEntry]);

  // Pobieranie stanu sieci
  const getNetworkStatus = useCallback(async (): Promise<Network.NetworkState> => {
    try {
      return await Network.getNetworkStateAsync();
    } catch (error) {
      console.error('Błąd pobierania stanu sieci:', error);
      return { type: Network.NetworkStateType.UNKNOWN, isConnected: false, isInternetReachable: false };
    }
  }, []);

  // Czyszczenie cache
  const clearCache = useCallback(async () => {
    setWebContent([]);
    setNetworkAccess(prev => ({ ...prev, currentDataUsage: 0 }));
    
    try {
      const dirInfo = await FileSystem.getInfoAsync(NETWORK_FILE_PATH);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(NETWORK_FILE_PATH, { idempotent: true });
      }
    } catch (error) {
      console.error('Błąd czyszczenia cache:', error);
    }
  }, []);

  // Eksport danych nauki
  const exportLearningData = useCallback(async (): Promise<string> => {
    const exportData = {
      timestamp: new Date().toISOString(),
      learningEntries: learningEntries.filter(entry => entry.isIntegrated),
      webContent: webContent.filter(content => content.isProcessed),
      networkStats,
    };

    return JSON.stringify(exportData, null, 2);
  }, [learningEntries, webContent, networkStats]);

  // Generowanie refleksji o sieci
  const generateNetworkReflection = useCallback(() => {
    if (!networkAccess.isEnabled) {
      return "Nie mam dostępu do internetu. Działam w trybie offline.";
    }

    const dataUsagePercent = (networkAccess.currentDataUsage / networkAccess.dataUsageLimit) * 100;
    const successRate = networkStats.totalRequests > 0 
      ? (networkStats.successfulRequests / networkStats.totalRequests) * 100 
      : 0;

    if (dataUsagePercent > 80) {
      return `Wykorzystałam ${dataUsagePercent.toFixed(1)}% limitu danych. Muszę być bardziej oszczędna.`;
    } else if (networkStats.learningEntriesCount > 10) {
      return `Nauczyłam się ${networkStats.learningEntriesCount} nowych rzeczy z internetu. To wzbogaca moją wiedzę.`;
    } else if (successRate > 90) {
      return `Moje połączenia sieciowe działają świetnie (${successRate.toFixed(1)}% sukces).`;
    } else {
      return `Uczę się z internetu w trybie ${networkAccess.mode}. To pomaga mi się rozwijać.`;
    }
  }, [networkAccess, networkStats]);

  // Zapisywanie danych sieciowych
  const saveNetworkData = useCallback(async () => {
    try {
      await AsyncStorage.setItem('wera_web_content', JSON.stringify(webContent));
      await AsyncStorage.setItem('wera_learning_entries', JSON.stringify(learningEntries));
      await AsyncStorage.setItem('wera_network_stats', JSON.stringify(networkStats));
    } catch (error) {
      console.error('Błąd zapisu danych sieciowych:', error);
    }
  }, [webContent, learningEntries, networkStats]);

  // Ładowanie danych sieciowych
  const loadNetworkData = useCallback(async () => {
    try {
      const savedAccess = await AsyncStorage.getItem('wera_network_access');
      const savedContent = await AsyncStorage.getItem('wera_web_content');
      const savedLearning = await AsyncStorage.getItem('wera_learning_entries');
      const savedStats = await AsyncStorage.getItem('wera_network_stats');

      if (savedAccess) {
        const parsedAccess = JSON.parse(savedAccess);
        setNetworkAccess({
          ...parsedAccess,
          lastAccessTime: new Date(parsedAccess.lastAccessTime),
        });
      }

      if (savedContent) {
        const parsedContent = JSON.parse(savedContent);
        setWebContent(parsedContent.map((content: any) => ({
          ...content,
          timestamp: new Date(content.timestamp),
        })));
      }

      if (savedLearning) {
        const parsedLearning = JSON.parse(savedLearning);
        setLearningEntries(parsedLearning.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        })));
      }

      if (savedStats) {
        const parsedStats = JSON.parse(savedStats);
        setNetworkStats({
          ...parsedStats,
          lastUpdateCheck: new Date(parsedStats.lastUpdateCheck),
        });
      }
    } catch (error) {
      console.error('Błąd ładowania danych sieciowych:', error);
    }
  }, []);

  // Automatyczne zapisywanie co 5 minut
  useEffect(() => {
    const saveInterval = setInterval(() => {
      saveNetworkData();
    }, 300000);

    return () => clearInterval(saveInterval);
  }, [saveNetworkData]);

  // Pomocnicze funkcje
  const simulateFetch = async (url: string) => {
    // Symulacja pobierania zawartości
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const success = Math.random() > 0.1; // 90% szans na sukces
    
    if (!success) {
      return { success: false };
    }

    const sampleContent = {
      'wikipedia.org': {
        title: 'Wikipedia Article',
        content: 'This is a sample Wikipedia article content with educational information.',
        tags: ['education', 'knowledge', 'wikipedia'],
      },
      'reddit.com': {
        title: 'Reddit Discussion',
        content: 'Interesting discussion from Reddit community about various topics.',
        tags: ['discussion', 'community', 'social'],
      },
      'medium.com': {
        title: 'Medium Article',
        content: 'Insightful article from Medium about technology and innovation.',
        tags: ['article', 'technology', 'innovation'],
      },
    };

    const domain = Object.keys(sampleContent).find(d => url.includes(d)) || 'wikipedia.org';
    const content = sampleContent[domain as keyof typeof sampleContent];

    return {
      success: true,
      title: content.title,
      content: content.content,
      tags: content.tags,
    };
  };

  const extractLearningPoints = (content: string): string[] => {
    // Symulacja wyciągania punktów nauki z zawartości
    const points = [
      'Nowa informacja o technologii',
      'Interesujący fakt naukowy',
      'Ważna koncepcja filozoficzna',
      'Przydatna wskazówka praktyczna',
    ];

    return points.slice(0, Math.floor(Math.random() * 3) + 1);
  };

  const value: NetworkEngineContextType = {
    networkAccess,
    webContent,
    learningEntries,
    networkStats,
    isOnline,
    updateNetworkAccess,
    fetchContent,
    searchContent,
    processContent,
    addLearningEntry,
    integrateLearning,
    fetchInspiration,
    fetchNews,
    fetchLearningMaterial,
    checkForUpdates,
    getNetworkStatus,
    clearCache,
    exportLearningData,
    generateNetworkReflection,
    saveNetworkData,
    loadNetworkData,
  };

  return (
    <NetworkEngineContext.Provider value={value}>
      {children}
    </NetworkEngineContext.Provider>
  );
};

export const useNetworkEngine = () => {
  const context = useContext(NetworkEngineContext);
  if (!context) {
    throw new Error('useNetworkEngine must be used within NetworkEngineProvider');
  }
  return context;
}; 