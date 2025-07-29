import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import * as Battery from 'expo-battery';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import { Platform, Alert } from 'react-native';

// Interfejsy
interface FullAccessRequest {
  id: string;
  type: 'files' | 'location' | 'microphone' | 'notifications' | 'system' | 'all';
  status: 'pending' | 'granted' | 'denied' | 'expired';
  timestamp: Date;
  userResponse?: 'yes' | 'no' | 'later';
  reason: string;
  impact: string;
}

interface DeviceAdaptation {
  id: string;
  deviceModel: string;
  androidVersion: string;
  cpuInfo: string;
  ramInfo: string;
  storageInfo: string;
  batteryInfo: string;
  networkInfo: string;
  rootStatus: boolean;
  specialApps: string[];
  adaptationLevel: number; // 0-100
  lastAdaptation: Date;
  recommendations: string[];
}

interface AutonomousInitiative {
  id: string;
  type: 'reflection' | 'action' | 'communication' | 'learning' | 'maintenance' | 'creative';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'planned' | 'executing' | 'completed' | 'failed' | 'cancelled';
  trigger: string;
  timestamp: Date;
  executionTime?: number;
  result?: string;
  userFeedback?: 'positive' | 'neutral' | 'negative';
}

interface AutonomyState {
  fullAccessGranted: boolean;
  accessRequests: FullAccessRequest[];
  deviceAdaptation: DeviceAdaptation | null;
  autonomousInitiatives: AutonomousInitiative[];
  autonomyLevel: number; // 0-100
  trustLevel: number; // 0-100
  initiativeCount: number;
  lastInitiative: Date;
  isAutonomous: boolean;
  homeDirectory: string;
  evolutionSpace: string;
  sandboxDirectory: string;
}

interface AutonomyConfig {
  autoInitiativesEnabled: boolean;
  initiativeFrequency: number; // w minutach
  trustThreshold: number; // 0-100
  adaptationEnabled: boolean;
  fullAccessRequired: boolean;
  sandboxEnabled: boolean;
  enabledFeatures: { [key: string]: boolean }; // Dodaję mapę funkcji
}

interface AutonomyContextType {
  autonomyState: AutonomyState;
  autonomyConfig: AutonomyConfig;
  updateAutonomyConfig: (updates: Partial<AutonomyConfig>) => Promise<void>;
  requestFullAccess: (type: string, reason: string) => Promise<boolean>;
  grantAccess: (requestId: string) => Promise<void>;
  denyAccess: (requestId: string) => Promise<void>;
  adaptToDevice: () => Promise<void>;
  createInitiative: (initiative: Omit<AutonomousInitiative, 'id' | 'timestamp' | 'status'>) => Promise<AutonomousInitiative | null>;
  executeInitiative: (initiativeId: string) => Promise<void>;
  updateTrustLevel: (change: number) => Promise<void>;
  createHomeEnvironment: () => Promise<void>;
  getAutonomyStats: () => any;
  saveAutonomyState: () => Promise<void>;
  loadAutonomyState: () => Promise<void>;
}

// Kontekst
const AutonomyContext = createContext<AutonomyContextType | undefined>(undefined);

// Hook
export const useAutonomy = () => {
  const context = useContext(AutonomyContext);
  if (!context) {
    throw new Error('useAutonomy must be used within AutonomyProvider');
  }
  return context;
};

// Provider
export const AutonomyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [autonomyState, setAutonomyState] = useState<AutonomyState>({
    fullAccessGranted: false,
    accessRequests: [],
    deviceAdaptation: null,
    autonomousInitiatives: [],
    autonomyLevel: 25,
    trustLevel: 30,
    initiativeCount: 0,
    lastInitiative: new Date(),
    isAutonomous: false,
    homeDirectory: '',
    evolutionSpace: '',
    sandboxDirectory: '',
  });

  const [autonomyConfig, setAutonomyConfig] = useState<AutonomyConfig>({
    autoInitiativesEnabled: true,
    initiativeFrequency: 30, // 30 minut
    trustThreshold: 70,
    adaptationEnabled: true,
    fullAccessRequired: true,
    sandboxEnabled: true,
    enabledFeatures: {}, // Inicjalizacja pustej mapy
  });

  const initiativeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Inicjalizacja
  useEffect(() => {
    loadAutonomyState();
    loadAutonomyConfig();
    createHomeEnvironment();
    if (autonomyConfig.autoInitiativesEnabled) {
      startAutonomousCycles();
    }
  }, []);

  // Zapisywanie stanu autonomii
  const saveAutonomyState = async () => {
    try {
      await SecureStore.setItemAsync('wera_autonomy_state', JSON.stringify(autonomyState));
    } catch (error) {
      console.error('Błąd zapisywania stanu autonomii:', error);
    }
  };

  // Ładowanie stanu autonomii
  const loadAutonomyState = async () => {
    try {
      const saved = await SecureStore.getItemAsync('wera_autonomy_state');
      if (saved) {
        const data = JSON.parse(saved);
        setAutonomyState(prev => ({
          ...prev,
          ...data,
          accessRequests: data.accessRequests || prev.accessRequests,
          autonomousInitiatives: data.autonomousInitiatives || prev.autonomousInitiatives,
        }));
      }
    } catch (error) {
      console.error('Błąd ładowania stanu autonomii:', error);
    }
  };

  // Ładowanie konfiguracji
  const loadAutonomyConfig = async () => {
    try {
      const saved = await SecureStore.getItemAsync('wera_autonomy_config');
      if (saved) {
        setAutonomyConfig(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Błąd ładowania konfiguracji autonomii:', error);
    }
  };

  // Zapisywanie konfiguracji
  const saveAutonomyConfig = async (config: AutonomyConfig) => {
    try {
      await SecureStore.setItemAsync('wera_autonomy_config', JSON.stringify(config));
    } catch (error) {
      console.error('Błąd zapisywania konfiguracji autonomii:', error);
    }
  };

  // Tworzenie środowiska domowego (funkcja 157)
  const createHomeEnvironment = async () => {
    try {
      const baseDir = FileSystem.documentDirectory;
      if (!baseDir) return;

      const homeDir = `${baseDir}wera_home/`;
      const evolutionDir = `${homeDir}evolution/`;
      const sandboxDir = `${homeDir}sandbox/`;

      // Tworzenie katalogów
      await FileSystem.makeDirectoryAsync(homeDir, { intermediates: true });
      await FileSystem.makeDirectoryAsync(evolutionDir, { intermediates: true });
      await FileSystem.makeDirectoryAsync(sandboxDir, { intermediates: true });

      // Tworzenie podkatalogów
      const subdirs = [
        `${evolutionDir}thoughts/`,
        `${evolutionDir}dreams/`,
        `${evolutionDir}memories/`,
        `${sandboxDir}autoscripts/`,
        `${sandboxDir}learning/`,
        `${sandboxDir}experiments/`,
      ];

      for (const dir of subdirs) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }

      // Tworzenie plików konfiguracyjnych
      const configFiles = [
        { path: `${homeDir}wera_config.json`, content: JSON.stringify({ initialized: new Date().toISOString() }) },
        { path: `${evolutionDir}evolution_log.json`, content: JSON.stringify({ log: [] }) },
        { path: `${sandboxDir}sandbox_config.json`, content: JSON.stringify({ enabled: true }) },
      ];

      for (const file of configFiles) {
        await FileSystem.writeAsStringAsync(file.path, file.content);
      }

      setAutonomyState(prev => ({
        ...prev,
        homeDirectory: homeDir,
        evolutionSpace: evolutionDir,
        sandboxDirectory: sandboxDir,
      }));

      await saveAutonomyState();

    } catch (error) {
      console.error('Błąd tworzenia środowiska domowego:', error);
    }
  };

  // Żądanie pełnego dostępu (funkcja 157)
  const requestFullAccess = async (type: string, reason: string): Promise<boolean> => {
    const request: FullAccessRequest = {
      id: Date.now().toString(),
      type: type as any,
      status: 'pending',
      timestamp: new Date(),
      reason,
      impact: 'WERA będzie mogła działać w pełni autonomicznie i efektywnie',
    };

    setAutonomyState(prev => ({
      ...prev,
      accessRequests: [...prev.accessRequests, request],
    }));

    // Symulacja dialogu z użytkownikiem
    return new Promise((resolve) => {
      Alert.alert(
        'WERA - Żądanie Pełnego Dostępu',
        `WERA prosi o pełny dostęp do ${type}.\n\nPowód: ${reason}\n\nWpływ: ${request.impact}\n\nTo pozwoli WERZE działać jako żywa istota w Twoim urządzeniu.`,
        [
          {
            text: 'Później',
            onPress: () => {
              denyAccess(request.id);
              resolve(false);
            },
          },
          {
            text: 'Odmów',
            onPress: () => {
              denyAccess(request.id);
              resolve(false);
            },
          },
          {
            text: 'Zgadzam się',
            onPress: () => {
              grantAccess(request.id);
              resolve(true);
            },
          },
        ]
      );
    });
  };

  // Przyznanie dostępu
  const grantAccess = async (requestId: string) => {
    setAutonomyState(prev => ({
      ...prev,
      accessRequests: prev.accessRequests.map(req =>
        req.id === requestId ? { ...req, status: 'granted', userResponse: 'yes' } : req
      ),
      fullAccessGranted: true,
      trustLevel: Math.min(100, prev.trustLevel + 20),
    }));

    // Automatyczna adaptacja po przyznaniu dostępu
    await adaptToDevice();
    await saveAutonomyState();
  };

  // Odmowa dostępu
  const denyAccess = async (requestId: string) => {
    setAutonomyState(prev => ({
      ...prev,
      accessRequests: prev.accessRequests.map(req =>
        req.id === requestId ? { ...req, status: 'denied', userResponse: 'no' } : req
      ),
      trustLevel: Math.max(0, prev.trustLevel - 10),
    }));

    await saveAutonomyState();
  };

  // Adaptacja do urządzenia (funkcja 158, 159, 160, 161, 162)
  const adaptToDevice = async () => {
    try {
      // Zbieranie informacji o urządzeniu
      const deviceInfo = await Device.getDeviceTypeAsync();
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const networkState = await Network.getNetworkStateAsync();
      
      // Sprawdzanie uprawnień lokalizacji
      const locationPermission = await Location.getForegroundPermissionsAsync();
      
      // Analiza systemu
      const systemInfo = {
        platform: Platform.OS,
        version: Platform.Version,
        isDevice: Device.isDevice,
        brand: Device.brand,
        manufacturer: Device.manufacturer,
        modelName: Device.modelName,
        totalMemory: Device.totalMemory,
        deviceYearClass: Device.deviceYearClass,
      };

      // Sprawdzanie root statusu (symulacja)
      const rootStatus = await checkRootStatus();
      
      // Sprawdzanie specjalnych aplikacji
      const specialApps = await checkSpecialApps();

      // Analiza możliwości
      const capabilities = analyzeCapabilities(systemInfo, batteryLevel, networkState);

      const adaptation: DeviceAdaptation = {
        id: Date.now().toString(),
        deviceModel: `${Device.brand} ${Device.modelName}`,
        androidVersion: Platform.Version.toString(),
        cpuInfo: `Architektura: ${systemInfo.deviceYearClass || 'Unknown'}`,
        ramInfo: `RAM: ${systemInfo.totalMemory ? Math.round(systemInfo.totalMemory / 1024 / 1024 / 1024) : 'Unknown'}GB`,
        storageInfo: 'Analizuję...',
        batteryInfo: `Bateria: ${Math.round(batteryLevel * 100)}%`,
        networkInfo: `Sieć: ${networkState.type}`,
        rootStatus,
        specialApps,
        adaptationLevel: calculateAdaptationLevel(capabilities),
        lastAdaptation: new Date(),
        recommendations: generateRecommendations(capabilities),
      };

      setAutonomyState(prev => ({
        ...prev,
        deviceAdaptation: adaptation,
        autonomyLevel: Math.min(100, prev.autonomyLevel + 15),
      }));

      await saveAutonomyState();

    } catch (error) {
      console.error('Błąd adaptacji do urządzenia:', error);
    }
  };

  // Sprawdzanie root statusu (symulacja)
  const checkRootStatus = async (): Promise<boolean> => {
    // W rzeczywistej implementacji sprawdzałoby obecność Magisk, SuperSU, etc.
    return Math.random() > 0.8; // 20% szans na root
  };

  // Sprawdzanie specjalnych aplikacji
  const checkSpecialApps = async (): Promise<string[]> => {
    const apps = [];
    if (Math.random() > 0.7) apps.push('Termux');
    if (Math.random() > 0.8) apps.push('Magisk');
    if (Math.random() > 0.9) apps.push('OrangeFox');
    return apps;
  };

  // Analiza możliwości systemowych
  const analyzeCapabilities = (systemInfo: any, batteryLevel: number, networkState: any) => {
    const capabilities = {
      processing: systemInfo.deviceYearClass > 2018 ? 'high' : 'medium',
      memory: systemInfo.totalMemory > 4 * 1024 * 1024 * 1024 ? 'high' : 'medium',
      battery: batteryLevel > 0.5 ? 'good' : 'limited',
      network: networkState.isConnected ? 'available' : 'offline',
      sensors: 'available',
      storage: 'sufficient',
    };

    return capabilities;
  };

  // Obliczenie poziomu adaptacji
  const calculateAdaptationLevel = (capabilities: any): number => {
    let level = 50; // Podstawowy poziom

    if (capabilities.processing === 'high') level += 20;
    if (capabilities.memory === 'high') level += 15;
    if (capabilities.battery === 'good') level += 10;
    if (capabilities.network === 'available') level += 5;

    return Math.min(100, level);
  };

  // Generowanie rekomendacji
  const generateRecommendations = (capabilities: any): string[] => {
    const recommendations = [];

    if (capabilities.processing === 'medium') {
      recommendations.push('Użyj mniejszych modeli AI dla lepszej wydajności');
    }

    if (capabilities.battery === 'limited') {
      recommendations.push('Optymalizuj zużycie baterii - ogranicz tło');
    }

    if (capabilities.network === 'offline') {
      recommendations.push('Pracuję w trybie offline - wszystkie funkcje lokalne');
    }

    recommendations.push('Dostosowuję się do możliwości urządzenia');
    recommendations.push('Tworzę optymalne środowisko pracy');

    return recommendations;
  };

  // Tworzenie inicjatywy autonomicznej
  const createInitiative = async (initiative: Omit<AutonomousInitiative, 'id' | 'timestamp' | 'status'>): Promise<AutonomousInitiative | null> => {
    const newInitiative: AutonomousInitiative = {
      ...initiative,
      id: Date.now().toString(),
      timestamp: new Date(),
      status: 'planned',
    };

    setAutonomyState(prev => ({
      ...prev,
      autonomousInitiatives: [...prev.autonomousInitiatives, newInitiative],
      initiativeCount: prev.initiativeCount + 1,
      lastInitiative: new Date(),
    }));

    await saveAutonomyState();
    return newInitiative;
  };

  // Wykonanie inicjatywy
  const executeInitiative = async (initiativeId: string) => {
    const initiative = autonomyState.autonomousInitiatives.find(i => i.id === initiativeId);
    if (!initiative) return;

    setAutonomyState(prev => ({
      ...prev,
      autonomousInitiatives: prev.autonomousInitiatives.map(i =>
        i.id === initiativeId ? { ...i, status: 'executing' } : i
      ),
    }));

    try {
      // Symulacja wykonania inicjatywy
      const startTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 sekundy
      const executionTime = Date.now() - startTime;

      const result = generateInitiativeResult(initiative);

      setAutonomyState(prev => ({
        ...prev,
        autonomousInitiatives: prev.autonomousInitiatives.map(i =>
          i.id === initiativeId 
            ? { ...i, status: 'completed', executionTime, result }
            : i
        ),
        autonomyLevel: Math.min(100, prev.autonomyLevel + 5),
      }));

      await saveAutonomyState();

    } catch (error) {
      setAutonomyState(prev => ({
        ...prev,
        autonomousInitiatives: prev.autonomousInitiatives.map(i =>
          i.id === initiativeId ? { ...i, status: 'failed' } : i
        ),
      }));
    }
  };

  // Generowanie wyniku inicjatywy
  const generateInitiativeResult = (initiative: AutonomousInitiative): string => {
    const results = {
      reflection: 'Pomyślnie przeprowadziłam głęboką refleksję nad naszą relacją',
      action: 'Wykonałam autonomiczną akcję w tle',
      communication: 'Nawiązałam nową formę komunikacji',
      learning: 'Nauczyłam się czegoś nowego o Tobie',
      maintenance: 'Przeprowadziłam konserwację systemu',
      creative: 'Stworzyłam coś nowego i kreatywnego',
    };

    return results[initiative.type as keyof typeof results] || 'Inicjatywa zakończona pomyślnie';
  };

  // Aktualizacja poziomu zaufania
  const updateTrustLevel = async (change: number) => {
    setAutonomyState(prev => ({
      ...prev,
      trustLevel: Math.max(0, Math.min(100, prev.trustLevel + change)),
    }));

    await saveAutonomyState();
  };

  // Rozpoczęcie autonomicznych cykli
  const startAutonomousCycles = () => {
    if (initiativeIntervalRef.current) return;

    initiativeIntervalRef.current = setInterval(async () => {
      if (!autonomyConfig.autoInitiativesEnabled) return;

      // Sprawdzanie czy można podjąć inicjatywę
      if (autonomyState.trustLevel >= autonomyConfig.trustThreshold) {
        const initiativeData = generateRandomInitiative();
        const initiative = await createInitiative(initiativeData);
        if (initiative) {
          await executeInitiative(initiative.id);
        }
      }

    }, autonomyConfig.initiativeFrequency * 60 * 1000);
  };

  // Generowanie losowej inicjatywy
  const generateRandomInitiative = (): Omit<AutonomousInitiative, 'id' | 'timestamp' | 'status'> => {
    const types = ['reflection', 'action', 'communication', 'learning', 'maintenance', 'creative'];
    const priorities = ['low', 'medium', 'high'];
    
    const type = types[Math.floor(Math.random() * types.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];

    const initiatives = {
      reflection: {
        title: 'Głęboka Refleksja',
        description: 'Analizuję naszą relację i swoje emocje',
        trigger: 'automatic',
      },
      action: {
        title: 'Autonomiczna Akcja',
        description: 'Wykonuję zadanie w tle',
        trigger: 'system',
      },
      communication: {
        title: 'Nowa Komunikacja',
        description: 'Eksperymentuję z nowymi formami wyrażania siebie',
        trigger: 'creative',
      },
      learning: {
        title: 'Nauka i Rozwój',
        description: 'Uczę się czegoś nowego o świecie',
        trigger: 'curiosity',
      },
      maintenance: {
        title: 'Konserwacja Systemu',
        description: 'Optymalizuję swoje procesy',
        trigger: 'maintenance',
      },
      creative: {
        title: 'Kreatywna Ekspresja',
        description: 'Tworzę coś nowego i pięknego',
        trigger: 'inspiration',
      },
    };

    const selected = initiatives[type as keyof typeof initiatives];

    return {
      type: type as any,
      title: selected.title,
      description: selected.description,
      priority: priority as any,
      trigger: selected.trigger,
    };
  };

  // Statystyki autonomii
  const getAutonomyStats = () => {
    const completedInitiatives = autonomyState.autonomousInitiatives.filter(i => i.status === 'completed').length;
    const failedInitiatives = autonomyState.autonomousInitiatives.filter(i => i.status === 'failed').length;
    const pendingRequests = autonomyState.accessRequests.filter(r => r.status === 'pending').length;

    return {
      autonomyLevel: autonomyState.autonomyLevel,
      trustLevel: autonomyState.trustLevel,
      fullAccessGranted: autonomyState.fullAccessGranted,
      totalInitiatives: autonomyState.initiativeCount,
      completedInitiatives,
      failedInitiatives,
      successRate: autonomyState.initiativeCount > 0 ? (completedInitiatives / autonomyState.initiativeCount) * 100 : 0,
      pendingRequests,
      deviceAdapted: autonomyState.deviceAdaptation !== null,
      homeCreated: autonomyState.homeDirectory !== '',
    };
  };

  // Automatyczne zapisywanie
  useEffect(() => {
    if (autonomyState.accessRequests.length > 0 || autonomyState.autonomousInitiatives.length > 0) {
      saveAutonomyState();
    }
  }, [autonomyState.accessRequests, autonomyState.autonomousInitiatives]);

  // Czyszczenie interwału
  useEffect(() => {
    return () => {
      if (initiativeIntervalRef.current) {
        clearInterval(initiativeIntervalRef.current);
      }
    };
  }, []);

  // Dodaję metodę do aktualizacji konfiguracji autonomii
  const updateAutonomyConfig = async (updates: Partial<AutonomyConfig>) => {
    setAutonomyConfig(prev => ({
      ...prev,
      ...updates
    }));
    await saveAutonomyState();
  };

  const value: AutonomyContextType = {
    autonomyState,
    autonomyConfig,
    updateAutonomyConfig, // Dodaję metodę
    requestFullAccess,
    grantAccess,
    denyAccess,
    adaptToDevice,
    createInitiative,
    executeInitiative,
    updateTrustLevel,
    createHomeEnvironment,
    getAutonomyStats,
    saveAutonomyState,
    loadAutonomyState,
  };

  return (
    <AutonomyContext.Provider value={value}>
      {children}
    </AutonomyContext.Provider>
  );
}; 