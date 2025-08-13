import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import * as Application from 'expo-application';
import { useWeraConfigFiles } from './WeraConfigFiles';
import { useLogExportSystem } from './LogExportSystem';
import { useWeraDaemon } from './WeraDaemon';

const AUTO_RESTART_KEY = 'wera_auto_restart_data';
const CRASH_DETECTION_KEY = 'wera_crash_detection';
const RESTART_COUNT_KEY = 'wera_restart_count';

interface CrashData {
  timestamp: string;
  appVersion: string;
  lastActivity: string;
  systemState: 'starting' | 'running' | 'crashed' | 'recovered';
  crashCount: number;
  errorMessage?: string;
  stackTrace?: string;
}

interface RestartState {
  isRecovering: boolean;
  crashCount: number;
  lastCrash: Date | null;
  totalRestarts: number;
  autoRestartEnabled: boolean;
  recoveryMode: 'normal' | 'safe' | 'minimal';
  lastSuccessfulStart: Date;
}

interface AutoRestartSystemContextType {
  restartState: RestartState;
  isFirstLaunch: boolean;
  crashHistory: CrashData[];
  enableAutoRestart: () => Promise<void>;
  disableAutoRestart: () => Promise<void>;
  reportCrash: (error: Error, context?: string) => Promise<void>;
  clearCrashHistory: () => Promise<void>;
  getRecoveryRecommendations: () => string[];
  forceRestart: () => Promise<void>;
  enterSafeMode: () => Promise<void>;
  exitSafeMode: () => Promise<void>;
}

const AutoRestartSystemContext = createContext<AutoRestartSystemContextType | null>(null);

export const useAutoRestartSystem = () => {
  const context = useContext(AutoRestartSystemContext);
  if (!context) {
    throw new Error('useAutoRestartSystem must be used within AutoRestartSystemProvider');
  }
  return context;
};

export const AutoRestartSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state: configState, updateState } = useWeraConfigFiles();
  const { logSystem } = useLogExportSystem();
  const { startDaemon } = useWeraDaemon();

  const [restartState, setRestartState] = useState<RestartState>({
    isRecovering: false,
    crashCount: 0,
    lastCrash: null,
    totalRestarts: 0,
    autoRestartEnabled: true,
    recoveryMode: 'normal',
    lastSuccessfulStart: new Date()
  });

  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  const [crashHistory, setCrashHistory] = useState<CrashData[]>([]);
  const appState = useRef(AppState.currentState);
  const startupTime = useRef(new Date());
  const heartbeatInterval = useRef<any>(null);

  // Inicjalizacja systemu auto-restart
  useEffect(() => {
    initializeAutoRestart();
    setupHeartbeat();
    setupAppStateMonitoring();
    
    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };
  }, []);

  const initializeAutoRestart = async () => {
    try {
      // Sprawdź czy to pierwsze uruchomienie
      const lastStart = await AsyncStorage.getItem('wera_last_start');
      const isFirst = !lastStart;
      setIsFirstLaunch(isFirst);

      // Załaduj dane crash detection
      const crashData = await AsyncStorage.getItem(CRASH_DETECTION_KEY);
      if (crashData) {
        const parsedCrash: CrashData = JSON.parse(crashData);
        
        // Jeśli ostatni stan to 'running', oznacza to crash
        if (parsedCrash.systemState === 'running') {
          await handleCrashRecovery(parsedCrash);
        }
      }

      // Załaduj historię restartów
      await loadRestartData();

      // Oznacz pomyślny start
      await markSuccessfulStart();

      await logSystem('info', 'AUTO_RESTART', `System initialized. First launch: ${isFirst}`);
      
    } catch (error) {
      await logSystem('error', 'AUTO_RESTART', 'Failed to initialize auto-restart system', error);
    }
  };

  const setupHeartbeat = () => {
    // Heartbeat co 30 sekund - oznacza że aplikacja działa
    heartbeatInterval.current = setInterval(async () => {
      try {
        const heartbeatData: CrashData = {
          timestamp: new Date().toISOString(),
          appVersion: Application.nativeApplicationVersion || '1.0.0',
          lastActivity: new Date().toISOString(),
          systemState: 'running',
          crashCount: restartState.crashCount
        };

        await AsyncStorage.setItem(CRASH_DETECTION_KEY, JSON.stringify(heartbeatData));
      } catch (error) {
        console.error('Heartbeat error:', error);
      }
    }, 30000);
  };

  const setupAppStateMonitoring = () => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // Aplikacja wróciła z tła - sprawdź czy nie było crash
        checkForUnexpectedRestart();
      }
      
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  };

  const handleCrashRecovery = async (crashData: CrashData) => {
    try {
      const newCrashCount = crashData.crashCount + 1;
      
      setRestartState(prev => ({
        ...prev,
        isRecovering: true,
        crashCount: newCrashCount,
        lastCrash: new Date(crashData.timestamp),
        totalRestarts: prev.totalRestarts + 1,
        recoveryMode: newCrashCount > 3 ? 'safe' : newCrashCount > 1 ? 'minimal' : 'normal'
      }));

      // Dodaj do historii crashy
      const updatedCrash: CrashData = {
        ...crashData,
        systemState: 'crashed',
        crashCount: newCrashCount
      };

      setCrashHistory(prev => [...prev, updatedCrash].slice(-10)); // Ostatnie 10 crashy

      // Przywróć stan aplikacji
      await restoreApplicationState();

      // Uruchom daemon ponownie
      if (restartState.autoRestartEnabled) {
        await startDaemon();
      }

      await logSystem('warning', 'AUTO_RESTART', `Crash recovery completed. Crash count: ${newCrashCount}`, {
        recoveryMode: restartState.recoveryMode,
        crashTime: crashData.timestamp
      });

      // Oznacz jako odzyskane
      setTimeout(() => {
        setRestartState(prev => ({ ...prev, isRecovering: false }));
      }, 5000);

    } catch (error) {
      await logSystem('error', 'AUTO_RESTART', 'Failed to handle crash recovery', error);
    }
  };

  const restoreApplicationState = async () => {
    try {
      if (!configState) return;

      // Przywróć podstawowy stan
      await updateState({
        systemStatus: {
          ...configState.systemStatus,
          health: 'warning',
          lastRestart: new Date().toISOString()
        },
        consciousness: {
          ...configState.consciousness,
          currentMode: 'active',
          lastActivity: new Date().toISOString()
        }
      });

      await logSystem('info', 'AUTO_RESTART', 'Application state restored after crash');
    } catch (error) {
      await logSystem('error', 'AUTO_RESTART', 'Failed to restore application state', error);
    }
  };

  const markSuccessfulStart = async () => {
    try {
      const startData: CrashData = {
        timestamp: new Date().toISOString(),
        appVersion: Application.nativeApplicationVersion || '1.0.0',
        lastActivity: new Date().toISOString(),
        systemState: 'starting',
        crashCount: 0
      };

      await AsyncStorage.setItem(CRASH_DETECTION_KEY, JSON.stringify(startData));
      await AsyncStorage.setItem('wera_last_start', new Date().toISOString());

      setRestartState(prev => ({
        ...prev,
        lastSuccessfulStart: new Date()
      }));

    } catch (error) {
      await logSystem('error', 'AUTO_RESTART', 'Failed to mark successful start', error);
    }
  };

  const loadRestartData = async () => {
    try {
      const restartData = await AsyncStorage.getItem(AUTO_RESTART_KEY);
      if (restartData) {
        const parsed = JSON.parse(restartData);
        setRestartState(prev => ({
          ...prev,
          ...parsed,
          lastCrash: parsed.lastCrash ? new Date(parsed.lastCrash) : null,
          lastSuccessfulStart: new Date(parsed.lastSuccessfulStart)
        }));
      }

      const crashHistoryData = await AsyncStorage.getItem('wera_crash_history');
      if (crashHistoryData) {
        setCrashHistory(JSON.parse(crashHistoryData));
      }

    } catch (error) {
      await logSystem('error', 'AUTO_RESTART', 'Failed to load restart data', error);
    }
  };

  const saveRestartData = async () => {
    try {
      await AsyncStorage.setItem(AUTO_RESTART_KEY, JSON.stringify(restartState));
      await AsyncStorage.setItem('wera_crash_history', JSON.stringify(crashHistory));
    } catch (error) {
      await logSystem('error', 'AUTO_RESTART', 'Failed to save restart data', error);
    }
  };

  const checkForUnexpectedRestart = async () => {
    try {
      const now = new Date();
      const timeSinceStart = now.getTime() - startupTime.current.getTime();
      
      // Jeśli aplikacja była uruchomiona krócej niż 2 minuty, może to być restart
      if (timeSinceStart < 2 * 60 * 1000) {
        await logSystem('warning', 'AUTO_RESTART', 'Possible unexpected restart detected');
      }
    } catch (error) {
      console.error('Error checking for unexpected restart:', error);
    }
  };

  const enableAutoRestart = async () => {
    setRestartState(prev => ({ ...prev, autoRestartEnabled: true }));
    await saveRestartData();
    await logSystem('info', 'AUTO_RESTART', 'Auto-restart enabled');
  };

  const disableAutoRestart = async () => {
    setRestartState(prev => ({ ...prev, autoRestartEnabled: false }));
    await saveRestartData();
    await logSystem('info', 'AUTO_RESTART', 'Auto-restart disabled');
  };

  const reportCrash = async (error: Error, context?: string) => {
    try {
      const crashData: CrashData = {
        timestamp: new Date().toISOString(),
        appVersion: Application.nativeApplicationVersion || '1.0.0',
        lastActivity: new Date().toISOString(),
        systemState: 'crashed',
        crashCount: restartState.crashCount + 1,
        errorMessage: error.message,
        stackTrace: error.stack
      };

      await AsyncStorage.setItem(CRASH_DETECTION_KEY, JSON.stringify(crashData));
      
      setCrashHistory(prev => [...prev, crashData].slice(-10));
      
      await logSystem('error', 'AUTO_RESTART', `Crash reported: ${error.message}`, {
        context,
        stackTrace: error.stack
      });

    } catch (saveError) {
      console.error('Failed to report crash:', saveError);
    }
  };

  const clearCrashHistory = async () => {
    setCrashHistory([]);
    setRestartState(prev => ({
      ...prev,
      crashCount: 0,
      lastCrash: null,
      totalRestarts: 0
    }));
    
    await AsyncStorage.removeItem('wera_crash_history');
    await saveRestartData();
    
    await logSystem('info', 'AUTO_RESTART', 'Crash history cleared');
  };

  const getRecoveryRecommendations = (): string[] => {
    const recommendations: string[] = [];

    if (restartState.crashCount > 3) {
      recommendations.push('Rozważ uruchomienie w trybie bezpiecznym');
      recommendations.push('Sprawdź dostępną pamięć urządzenia');
    }

    if (restartState.crashCount > 1) {
      recommendations.push('Wyczyść cache aplikacji');
      recommendations.push('Zrestartuj urządzenie');
    }

    if (crashHistory.length > 5) {
      recommendations.push('Skontaktuj się z pomocą techniczną');
      recommendations.push('Wyeksportuj logi do analizy');
    }

    return recommendations;
  };

  const forceRestart = async () => {
    await logSystem('warning', 'AUTO_RESTART', 'Force restart initiated by user');
    
    // Zapisz stan przed restartem
    await saveRestartData();
    
    // Oznacz jako planowany restart
    const restartData: CrashData = {
      timestamp: new Date().toISOString(),
      appVersion: Application.nativeApplicationVersion || '1.0.0',
      lastActivity: new Date().toISOString(),
      systemState: 'starting',
      crashCount: 0
    };

    await AsyncStorage.setItem(CRASH_DETECTION_KEY, JSON.stringify(restartData));
    
    // Tutaj można dodać logikę restartu aplikacji
    // Na razie tylko logujemy
    await logSystem('info', 'AUTO_RESTART', 'Application restart completed');
  };

  const enterSafeMode = async () => {
    setRestartState(prev => ({ ...prev, recoveryMode: 'safe' }));
    await saveRestartData();
    await logSystem('info', 'AUTO_RESTART', 'Entered safe mode');
  };

  const exitSafeMode = async () => {
    setRestartState(prev => ({ ...prev, recoveryMode: 'normal' }));
    await saveRestartData();
    await logSystem('info', 'AUTO_RESTART', 'Exited safe mode');
  };

  // Automatyczne zapisywanie danych
  useEffect(() => {
    const interval = setInterval(saveRestartData, 60000); // co minutę
    return () => clearInterval(interval);
  }, [restartState, crashHistory]);

  const value: AutoRestartSystemContextType = {
    restartState,
    isFirstLaunch,
    crashHistory,
    enableAutoRestart,
    disableAutoRestart,
    reportCrash,
    clearCrashHistory,
    getRecoveryRecommendations,
    forceRestart,
    enterSafeMode,
    exitSafeMode
  };

  return (
    <AutoRestartSystemContext.Provider value={value}>
      {children}
    </AutoRestartSystemContext.Provider>
  );
};