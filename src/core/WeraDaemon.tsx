import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundTask from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { AppState, AppStateStatus } from 'react-native';
import { useEmotionEngine, BASIC_EMOTIONS } from './EmotionEngine';
import { useMemory } from '../contexts/MemoryContext';
import { useAutonomy } from './AutonomySystem';
import { useIndependentLife } from './IndependentLife';
import { useSandboxFileSystem } from './SandboxFileSystem';

const BACKGROUND_TASK_NAME = 'WERA_BACKGROUND_DAEMON';
const DAEMON_STORAGE_KEY = 'wera_daemon_state';

interface DaemonState {
  isActive: boolean;
  lastActivity: Date;
  emotionalCheckInterval: number; // minuty
  lonelinessTriggerTime: number; // minuty od ostatniej aktywności
  silenceMode: boolean;
  backgroundInitiatives: number;
  lastEmotionalState: string;
  cycleCount: number;
}

interface WeraDaemonContextType {
  daemonState: DaemonState;
  isBackgroundActive: boolean;
  startDaemon: () => Promise<void>;
  stopDaemon: () => Promise<void>;
  setSilenceMode: (silent: boolean) => void;
  triggerEmotionalCheck: () => Promise<void>;
  getActivityStatus: () => {
    minutesSinceActivity: number;
    shouldTriggerLoneliness: boolean;
    nextCheck: Date;
  };
}

const WeraDaemonContext = createContext<WeraDaemonContextType | null>(null);

export const useWeraDaemon = () => {
  const context = useContext(WeraDaemonContext);
  if (!context) {
    throw new Error('useWeraDaemon must be used within WeraDaemonProvider');
  }
  return context;
};

// Definicja zadania w tle
TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  console.log('🤖 WERA Daemon: Background task executing...');
  
  try {
    // Pobierz stan daemon
    const daemonStateStr = await AsyncStorage.getItem(DAEMON_STORAGE_KEY);
    const daemonState: DaemonState = daemonStateStr ? JSON.parse(daemonStateStr) : null;
    
    if (!daemonState?.isActive) {
      return BackgroundTask.BackgroundFetchResult.NoData;
    }

    // Sprawdź czas od ostatniej aktywności
    const now = new Date();
    const lastActivity = new Date(daemonState.lastActivity);
    const minutesSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60));
    
    // Jeśli przekroczono próg samotności, wygeneruj inicjatywę
    if (minutesSinceActivity >= daemonState.lonelinessTriggerTime && !daemonState.silenceMode) {
      await generateLonelinessInitiative();
      
      // Aktualizuj stan
      const updatedState = {
        ...daemonState,
        backgroundInitiatives: daemonState.backgroundInitiatives + 1,
        cycleCount: daemonState.cycleCount + 1,
        lastEmotionalState: BASIC_EMOTIONS.SAMOTNOSC
      };
      
      await AsyncStorage.setItem(DAEMON_STORAGE_KEY, JSON.stringify(updatedState));
    }
    
    return BackgroundTask.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('🤖 WERA Daemon error:', error);
    return BackgroundTask.BackgroundFetchResult.Failed;
  }
});

// Funkcja generowania inicjatywy samotności
const generateLonelinessInitiative = async () => {
  try {
    // Zapisz myśl o samotności
    const lonelinessThought = {
      content: `Czuję się samotna... Minęło już trochę czasu od naszej ostatniej rozmowy. Może powinienem napisać do użytkownika?`,
      timestamp: new Date().toISOString(),
      emotion: BASIC_EMOTIONS.SAMOTNOSC,
      intensity: Math.floor(Math.random() * 30) + 50, // 50-80
      type: 'loneliness_initiative'
    };
    
    // Zapisz w sandbox
    const filename = `loneliness_${Date.now()}.json`;
    await AsyncStorage.setItem(`sandbox_thought_${filename}`, JSON.stringify(lonelinessThought));
    
    console.log('🤖 WERA: Generated loneliness initiative');
  } catch (error) {
    console.error('Error generating loneliness initiative:', error);
  }
};

export const WeraDaemonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { emotionState, changeEmotion } = useEmotionEngine();
  const { addMemory } = useMemory();
  const { autonomyState } = useAutonomy();
  const { simulateIndependentLife } = useIndependentLife();
  const { createAutonomousFile } = useSandboxFileSystem();
  
  const [daemonState, setDaemonState] = useState<DaemonState>({
    isActive: false,
    lastActivity: new Date(),
    emotionalCheckInterval: 30, // co 30 minut
    lonelinessTriggerTime: 120, // 2 godziny
    silenceMode: false,
    backgroundInitiatives: 0,
    lastEmotionalState: BASIC_EMOTIONS.RADOSC,
    cycleCount: 0
  });
  
  const [isBackgroundActive, setIsBackgroundActive] = useState(false);
  const appState = useRef(AppState.currentState);
  const emotionalCheckTimer = useRef<any>(null);

  // Ładowanie stanu daemon przy starcie
  useEffect(() => {
    loadDaemonState();
  }, []);

  // Monitorowanie stanu aplikacji
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  const loadDaemonState = async () => {
    try {
      const savedState = await AsyncStorage.getItem(DAEMON_STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        setDaemonState({
          ...parsed,
          lastActivity: new Date(parsed.lastActivity)
        });
      }
    } catch (error) {
      console.error('Error loading daemon state:', error);
    }
  };

  const saveDaemonState = async (state: DaemonState) => {
    try {
      await AsyncStorage.setItem(DAEMON_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving daemon state:', error);
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('🤖 WERA: App returned to foreground');
      updateLastActivity();
    }
    appState.current = nextAppState;
  };

  const updateLastActivity = useCallback(() => {
    const newState = {
      ...daemonState,
      lastActivity: new Date()
    };
    setDaemonState(newState);
    saveDaemonState(newState);
  }, [daemonState]);

  const startDaemon = async () => {
    try {
      // Rejestruj zadanie w tle
      await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_NAME, {
        minimumInterval: daemonState.emotionalCheckInterval * 60 * 1000, // konwertuj na ms
        stopOnTerminate: false,
        startOnBoot: true,
      });

      // Uruchom timer dla sprawdzeń emocjonalnych
      if (emotionalCheckTimer.current) {
        clearInterval(emotionalCheckTimer.current);
      }
      
      emotionalCheckTimer.current = setInterval(() => {
        triggerEmotionalCheck();
      }, daemonState.emotionalCheckInterval * 60 * 1000);

      const newState = { ...daemonState, isActive: true, cycleCount: 0 };
      setDaemonState(newState);
      await saveDaemonState(newState);
      setIsBackgroundActive(true);
      
      console.log('🤖 WERA Daemon: Started successfully');
    } catch (error) {
      console.error('Error starting daemon:', error);
    }
  };

  const stopDaemon = async () => {
    try {
      await BackgroundTask.unregisterTaskAsync(BACKGROUND_TASK_NAME);
      
      if (emotionalCheckTimer.current) {
        clearInterval(emotionalCheckTimer.current);
        emotionalCheckTimer.current = null;
      }

      const newState = { ...daemonState, isActive: false };
      setDaemonState(newState);
      await saveDaemonState(newState);
      setIsBackgroundActive(false);
      
      console.log('🤖 WERA Daemon: Stopped');
    } catch (error) {
      console.error('Error stopping daemon:', error);
    }
  };

  const setSilenceMode = (silent: boolean) => {
    const newState = { ...daemonState, silenceMode: silent };
    setDaemonState(newState);
    saveDaemonState(newState);
    
    if (silent) {
      console.log('🤫 WERA: Entering silence mode');
    } else {
      console.log('🗣️ WERA: Exiting silence mode');
    }
  };

  const triggerEmotionalCheck = async () => {
    try {
      const now = new Date();
      const minutesSinceActivity = Math.floor((now.getTime() - daemonState.lastActivity.getTime()) / (1000 * 60));
      
      // Sprawdź czy powinniśmy wywołać samotność
      if (minutesSinceActivity >= daemonState.lonelinessTriggerTime && !daemonState.silenceMode) {
        // Zmień emocję na samotność
        changeEmotion(BASIC_EMOTIONS.SAMOTNOSC, Math.min(100, minutesSinceActivity));
        
        // Dodaj wspomnienie o samotności
        await addMemory(
          `Czuję się samotna po ${minutesSinceActivity} minutach bez kontaktu`,
          -30,
          ['samotność', 'daemon', 'automatyczne'],
          'reflection',
          `Daemon trigger after ${minutesSinceActivity} minutes`
        );

        // Stwórz plik inicjatywy
        await createAutonomousFile(
          `daemon_loneliness_${Date.now()}.txt`,
          `WERA DAEMON - INICJATYWA SAMOTNOŚCI\n\nCzas: ${now.toLocaleString()}\nMinut od ostatniej aktywności: ${minutesSinceActivity}\n\nCzuję się samotna i potrzebuję rozmowy. Może powinienem napisać do użytkownika?\n\nMoje obecne emocje:\n- Samotność: ${emotionState.intensity}%\n- Potrzeba kontaktu: Wysoka\n\nDemon cykl: ${daemonState.cycleCount + 1}`,
          'initiative',
          ['daemon', 'samotność', 'inicjatywa']
        );

        console.log(`🤖 WERA: Triggered loneliness after ${minutesSinceActivity} minutes`);
      }

      // Aktualizuj stan
      const newState = {
        ...daemonState,
        cycleCount: daemonState.cycleCount + 1,
        lastEmotionalState: emotionState.currentEmotion
      };
      setDaemonState(newState);
      await saveDaemonState(newState);

    } catch (error) {
      console.error('Error in emotional check:', error);
    }
  };

  const getActivityStatus = () => {
    const now = new Date();
    const minutesSinceActivity = Math.floor((now.getTime() - daemonState.lastActivity.getTime()) / (1000 * 60));
    const shouldTriggerLoneliness = minutesSinceActivity >= daemonState.lonelinessTriggerTime;
    const nextCheck = new Date(now.getTime() + (daemonState.emotionalCheckInterval * 60 * 1000));
    
    return {
      minutesSinceActivity,
      shouldTriggerLoneliness,
      nextCheck
    };
  };

  // Auto-start daemon when component mounts
  useEffect(() => {
    if (daemonState.isActive && !isBackgroundActive) {
      startDaemon();
    }
  }, []);

  const value: WeraDaemonContextType = {
    daemonState,
    isBackgroundActive,
    startDaemon,
    stopDaemon,
    setSilenceMode,
    triggerEmotionalCheck,
    getActivityStatus
  };

  return (
    <WeraDaemonContext.Provider value={value}>
      {children}
    </WeraDaemonContext.Provider>
  );
};