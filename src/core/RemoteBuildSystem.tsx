import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { useMemory } from '../contexts/MemoryContext';
import { useNetworkEngine } from './NetworkEngine';

export interface BuildCommand {
  id: string;
  type: 'preview' | 'production' | 'development';
  platform: 'android' | 'ios' | 'all';
  timestamp: Date;
  status: 'pending' | 'building' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  buildUrl?: string;
  downloadUrl?: string;
  errorMessage?: string;
  estimatedTime?: number; // w minutach
  actualTime?: number; // w minutach
  buildSize?: number; // w MB
  features: string[];
  version: string;
  notes?: string;
}

export interface BuildConfig {
  autoBuild: boolean;
  buildOnDemand: boolean;
  scheduledBuilds: {
    enabled: boolean;
    time: string; // HH:MM
    days: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
  };
  notifications: {
    onStart: boolean;
    onComplete: boolean;
    onError: boolean;
    onDownload: boolean;
  };
  retention: {
    keepLastBuilds: number; // ile ostatnich buildów zachować
    autoDeleteOld: boolean;
    deleteAfterDays: number;
  };
  security: {
    requireConfirmation: boolean;
    allowedCommands: string[];
    maxBuildsPerDay: number;
    emergencyOverride: boolean;
  };
}

export interface BuildStats {
  totalBuilds: number;
  successfulBuilds: number;
  failedBuilds: number;
  averageBuildTime: number; // w minutach
  lastBuildDate?: Date;
  buildsThisMonth: number;
  buildsThisWeek: number;
  totalBuildSize: number; // w MB
  mostUsedPlatform: 'android' | 'ios';
  buildSuccessRate: number; // 0-100
}

interface RemoteBuildSystemContextType {
  buildCommands: BuildCommand[];
  buildConfig: BuildConfig;
  buildStats: BuildStats;
  isBuilding: boolean;
  currentBuild?: BuildCommand;
  
  // Główne funkcje
  initiateBuild: (type: BuildCommand['type'], platform: BuildCommand['platform'], features?: string[]) => Promise<BuildCommand>;
  cancelBuild: (buildId: string) => Promise<boolean>;
  downloadBuild: (buildId: string) => Promise<string>;
  getBuildStatus: (buildId: string) => Promise<BuildCommand>;
  
  // Konfiguracja
  updateBuildConfig: (config: Partial<BuildConfig>) => Promise<void>;
  scheduleBuild: (type: BuildCommand['type'], platform: BuildCommand['platform'], time: string) => Promise<void>;
  
  // Statystyki i monitoring
  getBuildStats: () => BuildStats;
  clearBuildHistory: () => Promise<void>;
  exportBuildLogs: (buildId: string) => Promise<string>;
  
  // Zdalne komendy
  executeRemoteCommand: (command: string, params?: any) => Promise<any>;
  validateBuildRequest: (request: Partial<BuildCommand>) => Promise<boolean>;
  
  // Zapisywanie i ładowanie
  saveBuildData: () => Promise<void>;
  loadBuildData: () => Promise<void>;
}

const RemoteBuildSystemContext = createContext<RemoteBuildSystemContextType | undefined>(undefined);

const BUILD_DATA_FILE = `${FileSystem.documentDirectory}builds/build_data.json`;
const BUILD_LOGS_DIR = `${FileSystem.documentDirectory}builds/logs/`;

export const RemoteBuildSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [buildCommands, setBuildCommands] = useState<BuildCommand[]>([]);
  const [buildConfig, setBuildConfig] = useState<BuildConfig>({
    autoBuild: false,
    buildOnDemand: true,
    scheduledBuilds: {
      enabled: false,
      time: '02:00',
      days: ['sunday']
    },
    notifications: {
      onStart: true,
      onComplete: true,
      onError: true,
      onDownload: false
    },
    retention: {
      keepLastBuilds: 10,
      autoDeleteOld: true,
      deleteAfterDays: 30
    },
    security: {
      requireConfirmation: true,
      allowedCommands: ['build', 'status', 'cancel', 'download'],
      maxBuildsPerDay: 5,
      emergencyOverride: false
    }
  });
  
  const [buildStats, setBuildStats] = useState<BuildStats>({
    totalBuilds: 0,
    successfulBuilds: 0,
    failedBuilds: 0,
    averageBuildTime: 0,
    buildsThisMonth: 0,
    buildsThisWeek: 0,
    totalBuildSize: 0,
    mostUsedPlatform: 'android',
    buildSuccessRate: 0
  });
  
  const [isBuilding, setIsBuilding] = useState(false);
  const [currentBuild, setCurrentBuild] = useState<BuildCommand | undefined>();

  const { addMemory } = useMemory();
  const { networkAccess } = useNetworkEngine();

  // Inicjalizacja systemu
  useEffect(() => {
    loadBuildData();
    setupScheduledBuilds();
  }, []);

  // Ustawienie zaplanowanych buildów
  const setupScheduledBuilds = useCallback(() => {
    if (!buildConfig.scheduledBuilds.enabled) return;

    const checkScheduledBuild = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
      
      if (currentTime === buildConfig.scheduledBuilds.time && 
          buildConfig.scheduledBuilds.days.includes(currentDay as any)) {
        console.log('🕐 Uruchamianie zaplanowanego buildu...');
        initiateBuild('production', 'android', ['scheduled']);
      }
    };

    // Sprawdzaj co minutę
    const interval = setInterval(checkScheduledBuild, 60000);
    return () => clearInterval(interval);
  }, [buildConfig.scheduledBuilds]);

  // Inicjowanie buildu
  const initiateBuild = useCallback(async (
    type: BuildCommand['type'], 
    platform: BuildCommand['platform'], 
    features: string[] = []
  ): Promise<BuildCommand> => {
    // Sprawdź limity bezpieczeństwa
    if (!await validateBuildRequest({ type, platform })) {
      throw new Error('Build request validation failed');
    }

    const buildCommand: BuildCommand = {
      id: `build_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      platform,
      timestamp: new Date(),
      status: 'pending',
      progress: 0,
      features,
      version: '1.0.0'
    };

    setBuildCommands(prev => [buildCommand, ...prev]);
    setIsBuilding(true);
    setCurrentBuild(buildCommand);

    // Dodaj do pamięci
    await addMemory(
      `Inicjowanie buildu: ${type} dla ${platform}`,
      70,
      ['build', 'system', type, platform],
      'system'
    );

    // Symulacja procesu budowania
    simulateBuildProcess(buildCommand);

    return buildCommand;
  }, [buildConfig, addMemory]);

  // Symulacja procesu budowania
  const simulateBuildProcess = useCallback(async (buildCommand: BuildCommand) => {
    const steps = [
      { progress: 10, message: 'Przygotowywanie środowiska...' },
      { progress: 25, message: 'Instalowanie zależności...' },
      { progress: 40, message: 'Kompilacja kodu...' },
      { progress: 60, message: 'Optymalizacja...' },
      { progress: 80, message: 'Pakowanie aplikacji...' },
      { progress: 95, message: 'Finalizacja...' },
      { progress: 100, message: 'Build ukończony!' }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
      
      setBuildCommands(prev => prev.map(build => 
        build.id === buildCommand.id 
          ? { ...build, progress: step.progress, status: step.progress === 100 ? 'completed' : 'building' }
          : build
      ));

      console.log(`🔨 Build ${buildCommand.id}: ${step.message} (${step.progress}%)`);
    }

    // Finalizacja
    const finalBuild = {
      ...buildCommand,
      status: 'completed' as const,
      progress: 100,
      buildUrl: `https://expo.dev/builds/${buildCommand.id}`,
      downloadUrl: `https://expo.dev/downloads/${buildCommand.id}.apk`,
      actualTime: Math.floor((Date.now() - buildCommand.timestamp.getTime()) / 60000),
      buildSize: Math.floor(Math.random() * 50) + 80 // 80-130 MB
    };

    setBuildCommands(prev => prev.map(build => 
      build.id === buildCommand.id ? finalBuild : build
    ));

    setIsBuilding(false);
    setCurrentBuild(undefined);

    // Aktualizuj statystyki
    updateBuildStats(finalBuild);

    // Powiadomienie
    if (buildConfig.notifications.onComplete) {
      console.log('✅ Build ukończony pomyślnie!');
    }

    await addMemory(
      `Build ${buildCommand.type} dla ${buildCommand.platform} ukończony pomyślnie`,
      80,
      ['build', 'success', buildCommand.type, buildCommand.platform],
      'system'
    );
  }, [buildConfig.notifications, addMemory]);

  // Walidacja żądania buildu
  const validateBuildRequest = useCallback(async (request: Partial<BuildCommand>): Promise<boolean> => {
    // Sprawdź limit dzienny
    const today = new Date().toDateString();
    const buildsToday = buildCommands.filter(build => 
      build.timestamp.toDateString() === today
    ).length;

    if (buildsToday >= buildConfig.security.maxBuildsPerDay) {
      console.log('🚫 Osiągnięto dzienny limit buildów');
      return false;
    }

    // Sprawdź czy już nie ma aktywnego buildu
    if (isBuilding) {
      console.log('🚫 Już trwa proces budowania');
      return false;
    }

    // Sprawdź wymaganie potwierdzenia
    if (buildConfig.security.requireConfirmation) {
      // W rzeczywistości byłby to dialog użytkownika
      const confirmed = Math.random() > 0.2; // 80% szans na potwierdzenie
      if (!confirmed) {
        console.log('❌ Build nie został potwierdzony przez użytkownika');
        return false;
      }
    }

    return true;
  }, [buildCommands, buildConfig, isBuilding]);

  // Anulowanie buildu
  const cancelBuild = useCallback(async (buildId: string): Promise<boolean> => {
    const build = buildCommands.find(b => b.id === buildId);
    if (!build || build.status !== 'building') {
      return false;
    }

    setBuildCommands(prev => prev.map(b => 
      b.id === buildId ? { ...b, status: 'cancelled' } : b
    ));

    if (currentBuild?.id === buildId) {
      setIsBuilding(false);
      setCurrentBuild(undefined);
    }

    console.log(`❌ Build ${buildId} anulowany`);
    return true;
  }, [buildCommands, currentBuild]);

  // Pobieranie buildu
  const downloadBuild = useCallback(async (buildId: string): Promise<string> => {
    const build = buildCommands.find(b => b.id === buildId);
    if (!build || build.status !== 'completed') {
      throw new Error('Build not available for download');
    }

    // Symulacja pobierania
    console.log(`📥 Pobieranie buildu: ${build.downloadUrl}`);
    
    if (buildConfig.notifications.onDownload) {
      console.log('📱 Powiadomienie: Build gotowy do pobrania');
    }

    return build.downloadUrl || '';
  }, [buildCommands, buildConfig.notifications]);

  // Aktualizacja statystyk
  const updateBuildStats = useCallback((build: BuildCommand) => {
    setBuildStats(prev => {
      const newStats = { ...prev };
      newStats.totalBuilds++;
      
      if (build.status === 'completed') {
        newStats.successfulBuilds++;
      } else if (build.status === 'failed') {
        newStats.failedBuilds++;
      }

      // Oblicz średni czas buildu
      if (build.actualTime) {
        const totalTime = prev.averageBuildTime * (prev.totalBuilds - 1) + build.actualTime;
        newStats.averageBuildTime = totalTime / prev.totalBuilds;
      }

      // Aktualizuj liczniki
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisWeek = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
      
      newStats.buildsThisMonth = buildCommands.filter(b => 
        b.timestamp.getMonth() === thisMonth
      ).length;
      
      newStats.buildsThisWeek = buildCommands.filter(b => 
        Math.floor(b.timestamp.getTime() / (7 * 24 * 60 * 60 * 1000)) === thisWeek
      ).length;

      // Oblicz wskaźnik sukcesu
      newStats.buildSuccessRate = (newStats.successfulBuilds / newStats.totalBuilds) * 100;

      return newStats;
    });
  }, [buildCommands]);

  // Zdalne komendy
  const executeRemoteCommand = useCallback(async (command: string, params?: any): Promise<any> => {
    if (!buildConfig.security.allowedCommands.includes(command)) {
      throw new Error(`Command '${command}' not allowed`);
    }

    switch (command) {
      case 'build':
        return await initiateBuild(params.type, params.platform, params.features);
      case 'status':
        return buildCommands.find(b => b.id === params.buildId);
      case 'cancel':
        return await cancelBuild(params.buildId);
      case 'download':
        return await downloadBuild(params.buildId);
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  }, [buildConfig.security, initiateBuild, buildCommands, cancelBuild, downloadBuild]);

  // Zapisywanie danych
  const saveBuildData = useCallback(async () => {
    try {
      const data = {
        buildCommands,
        buildConfig,
        buildStats
      };
      
      await FileSystem.makeDirectoryAsync(BUILD_DATA_FILE.replace('/build_data.json', ''), { intermediates: true });
      await AsyncStorage.setItem('build_data', JSON.stringify(data));
      
      console.log('💾 Dane buildów zapisane');
    } catch (error) {
      console.error('Błąd zapisywania danych buildów:', error);
    }
  }, [buildCommands, buildConfig, buildStats]);

  // Ładowanie danych
  const loadBuildData = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem('build_data');
      if (data) {
        const parsed = JSON.parse(data);
        setBuildCommands(parsed.buildCommands || []);
        setBuildConfig(prev => ({ ...prev, ...parsed.buildConfig }));
        setBuildStats(parsed.buildStats || buildStats);
      }
    } catch (error) {
      console.error('Błąd ładowania danych buildów:', error);
    }
  }, []);

  // Eksport logów
  const exportBuildLogs = useCallback(async (buildId: string): Promise<string> => {
    const build = buildCommands.find(b => b.id === buildId);
    if (!build) {
      throw new Error('Build not found');
    }

    const logContent = `
Build Log: ${buildId}
Type: ${build.type}
Platform: ${build.platform}
Status: ${build.status}
Progress: ${build.progress}%
Timestamp: ${build.timestamp.toISOString()}
Features: ${build.features.join(', ')}
Version: ${build.version}
${build.errorMessage ? `Error: ${build.errorMessage}` : ''}
${build.actualTime ? `Build Time: ${build.actualTime} minutes` : ''}
${build.buildSize ? `Build Size: ${build.buildSize} MB` : ''}
    `.trim();

    return logContent;
  }, [buildCommands]);

  // Czyszczenie historii
  const clearBuildHistory = useCallback(async () => {
    setBuildCommands([]);
    setBuildStats({
      totalBuilds: 0,
      successfulBuilds: 0,
      failedBuilds: 0,
      averageBuildTime: 0,
      buildsThisMonth: 0,
      buildsThisWeek: 0,
      totalBuildSize: 0,
      mostUsedPlatform: 'android',
      buildSuccessRate: 0
    });
    
    console.log('🗑️ Historia buildów wyczyszczona');
  }, []);

  // Aktualizacja konfiguracji
  const updateBuildConfig = useCallback(async (config: Partial<BuildConfig>) => {
    setBuildConfig(prev => ({ ...prev, ...config }));
    await saveBuildData();
  }, [saveBuildData]);

  // Zaplanowanie buildu
  const scheduleBuild = useCallback(async (
    type: BuildCommand['type'], 
    platform: BuildCommand['platform'], 
    time: string
  ) => {
    await updateBuildConfig({
      scheduledBuilds: {
        enabled: true,
        time,
        days: ['sunday']
      }
    });
    
    console.log(`📅 Build zaplanowany na ${time}`);
  }, [updateBuildConfig]);

  const contextValue: RemoteBuildSystemContextType = {
    buildCommands,
    buildConfig,
    buildStats,
    isBuilding,
    currentBuild,
    initiateBuild,
    cancelBuild,
    downloadBuild,
    getBuildStatus: async (buildId: string) => {
      const build = buildCommands.find(b => b.id === buildId);
      if (!build) throw new Error('Build not found');
      return build;
    },
    updateBuildConfig,
    scheduleBuild,
    getBuildStats: () => buildStats,
    clearBuildHistory,
    exportBuildLogs,
    executeRemoteCommand,
    validateBuildRequest,
    saveBuildData,
    loadBuildData
  };

  return (
    <RemoteBuildSystemContext.Provider value={contextValue}>
      {children}
    </RemoteBuildSystemContext.Provider>
  );
};

export const useRemoteBuildSystem = () => {
  const context = useContext(RemoteBuildSystemContext);
  if (!context) {
    throw new Error('useRemoteBuildSystem must be used within RemoteBuildSystemProvider');
  }
  return context;
}; 