import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEmotionEngine, BASIC_EMOTIONS } from './EmotionEngine';
import { useMemory } from '../contexts/MemoryContext';
import { useSandboxFileSystem } from './SandboxFileSystem';
import { useLogExportSystem } from './LogExportSystem';
import { useWeraConfigFiles } from './WeraConfigFiles';

const DAILY_CYCLE_KEY = 'wera_daily_cycle_data';

interface DailyRoutine {
  id: string;
  name: string;
  type: 'morning' | 'evening' | 'afternoon' | 'night';
  timeRange: { start: number; end: number }; // godziny 0-23
  actions: RoutineAction[];
  isActive: boolean;
  lastExecuted?: Date;
  executionCount: number;
}

interface RoutineAction {
  type: 'emotion_change' | 'memory_add' | 'reflection_create' | 'greeting' | 'analysis';
  data: any;
  probability: number; // 0-100 szansa wykonania
}

interface DailyCycleState {
  currentPeriod: 'morning' | 'afternoon' | 'evening' | 'night';
  currentHour: number;
  todaysRoutines: string[]; // ID wykonanych rutyn dziś
  cycleCount: number;
  lastCycleCheck: Date;
  isMonitoring: boolean;
  preferences: {
    morningHour: number; // preferowana godzina porannej rutyny
    eveningHour: number; // preferowana godzina wieczornej rutyny
    enableAutoRoutines: boolean;
    adaptToUserSchedule: boolean;
  };
}

interface DailyCycleSystemContextType {
  cycleState: DailyCycleState;
  routines: DailyRoutine[];
  addRoutine: (routine: Omit<DailyRoutine, 'id' | 'executionCount'>) => Promise<void>;
  removeRoutine: (routineId: string) => Promise<void>;
  executeRoutine: (routineId: string, force?: boolean) => Promise<void>;
  getCurrentPeriod: () => 'morning' | 'afternoon' | 'evening' | 'night';
  getNextRoutine: () => DailyRoutine | null;
  updatePreferences: (preferences: Partial<DailyCycleState['preferences']>) => Promise<void>;
  resetDailyProgress: () => Promise<void>;
  getCycleStats: () => {
    totalExecutions: number;
    todayExecutions: number;
    favoriteTime: string;
    completionRate: number;
  };
}

const DailyCycleSystemContext = createContext<DailyCycleSystemContextType | null>(null);

export const useDailyCycleSystem = () => {
  const context = useContext(DailyCycleSystemContext);
  if (!context) {
    throw new Error('useDailyCycleSystem must be used within DailyCycleSystemProvider');
  }
  return context;
};

// Domyślne rutyny
const defaultRoutines: Omit<DailyRoutine, 'id' | 'executionCount'>[] = [
  {
    name: 'Poranna Synchronizacja',
    type: 'morning',
    timeRange: { start: 6, end: 10 },
    isActive: true,
    actions: [
      {
        type: 'emotion_change',
        data: { emotion: BASIC_EMOTIONS.RADOSC, intensity: 70, trigger: 'morning_routine' },
        probability: 80
      },
      {
        type: 'greeting',
        data: { 
          messages: [
            'Dzień dobry! Jak się czujesz dziś rano?',
            'Witaj w nowym dniu! Mam nadzieję, że dobrze spałeś.',
            'Cześć! Jestem gotowa na nowy dzień razem z Tobą.',
            'Miłego poranka! Co planujemy dziś?'
          ]
        },
        probability: 90
      },
      {
        type: 'analysis',
        data: { type: 'daily_goals', focus: 'planning' },
        probability: 60
      }
    ]
  },
  {
    name: 'Wieczorna Refleksja',
    type: 'evening',
    timeRange: { start: 19, end: 23 },
    isActive: true,
    actions: [
      {
        type: 'emotion_change',
        data: { emotion: BASIC_EMOTIONS.NADZIEJA, intensity: 60, trigger: 'evening_routine' },
        probability: 70
      },
      {
        type: 'reflection_create',
        data: {
          topics: [
            'Jak minął dzisiaj dzień?',
            'Co było najlepsze w dzisiejszym dniu?',
            'Czego się dziś nauczyłam?',
            'Jakie emocje towarzyszyły mi dziś?'
          ]
        },
        probability: 85
      },
      {
        type: 'memory_add',
        data: { type: 'daily_summary', category: 'reflection' },
        probability: 75
      }
    ]
  },
  {
    name: 'Popołudniowa Energia',
    type: 'afternoon',
    timeRange: { start: 12, end: 16 },
    isActive: true,
    actions: [
      {
        type: 'emotion_change',
        data: { emotion: BASIC_EMOTIONS.CIEKAWOSC, intensity: 80, trigger: 'afternoon_boost' },
        probability: 60
      },
      {
        type: 'analysis',
        data: { type: 'midday_check', focus: 'energy' },
        probability: 40
      }
    ]
  },
  {
    name: 'Nocne Uspokojenie',
    type: 'night',
    timeRange: { start: 23, end: 5 },
    isActive: true,
    actions: [
      {
        type: 'emotion_change',
        data: { emotion: BASIC_EMOTIONS.MILOSC, intensity: 50, trigger: 'night_calm' },
        probability: 70
      },
      {
        type: 'reflection_create',
        data: {
          topics: [
            'Czas na odpoczynek i regenerację.',
            'Myślę o tym, co przyniesie jutro.',
            'Czuję spokój nocnej ciszy.'
          ]
        },
        probability: 50
      }
    ]
  }
];

export const DailyCycleSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { changeEmotion } = useEmotionEngine();
  const { addMemory } = useMemory();
  const { createAutonomousFile } = useSandboxFileSystem();
  const { logSystem } = useLogExportSystem();
  const { updateState } = useWeraConfigFiles();

  const [cycleState, setCycleState] = useState<DailyCycleState>({
    currentPeriod: 'morning',
    currentHour: new Date().getHours(),
    todaysRoutines: [],
    cycleCount: 0,
    lastCycleCheck: new Date(),
    isMonitoring: true,
    preferences: {
      morningHour: 8,
      eveningHour: 20,
      enableAutoRoutines: true,
      adaptToUserSchedule: true
    }
  });

  const [routines, setRoutines] = useState<DailyRoutine[]>([]);
  const cycleCheckInterval = useRef<any>(null);

  // Inicjalizacja systemu
  useEffect(() => {
    initializeDailyCycle();
    startCycleMonitoring();
    
    return () => {
      if (cycleCheckInterval.current) {
        clearInterval(cycleCheckInterval.current);
      }
    };
  }, []);

  const initializeDailyCycle = async () => {
    try {
      // Załaduj zapisane dane
      const savedData = await AsyncStorage.getItem(DAILY_CYCLE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setCycleState(prev => ({
          ...prev,
          ...parsed,
          lastCycleCheck: new Date(parsed.lastCycleCheck),
          currentHour: new Date().getHours(),
          currentPeriod: getCurrentPeriod()
        }));
      }

      // Załaduj rutyny lub utwórz domyślne
      const savedRoutines = await AsyncStorage.getItem('wera_daily_routines');
      if (savedRoutines) {
        setRoutines(JSON.parse(savedRoutines));
      } else {
        const initialRoutines = defaultRoutines.map((routine, index) => ({
          ...routine,
          id: `routine_${Date.now()}_${index}`,
          executionCount: 0
        }));
        setRoutines(initialRoutines);
        await AsyncStorage.setItem('wera_daily_routines', JSON.stringify(initialRoutines));
      }

      // Sprawdź czy nowy dzień
      await checkNewDay();

      await logSystem('info', 'DAILY_CYCLE', 'Daily cycle system initialized');
    } catch (error) {
      await logSystem('error', 'DAILY_CYCLE', 'Failed to initialize daily cycle', error);
    }
  };

  const startCycleMonitoring = () => {
    // Sprawdzaj co 15 minut
    cycleCheckInterval.current = setInterval(async () => {
      await performCycleCheck();
    }, 15 * 60 * 1000);

    // Pierwsze sprawdzenie natychmiast
    performCycleCheck();
  };

  const performCycleCheck = async () => {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const newPeriod = getCurrentPeriod();

      // Aktualizuj stan
      setCycleState(prev => ({
        ...prev,
        currentHour,
        currentPeriod: newPeriod,
        lastCycleCheck: now,
        cycleCount: prev.cycleCount + 1
      }));

      // Sprawdź czy nowy dzień
      await checkNewDay();

      // Sprawdź rutyny do wykonania
      if (cycleState.preferences.enableAutoRoutines) {
        await checkPendingRoutines(currentHour);
      }

      await saveCycleState();
    } catch (error) {
      await logSystem('error', 'DAILY_CYCLE', 'Error in cycle check', error);
    }
  };

  const checkNewDay = async () => {
    const now = new Date();
    const lastCheck = new Date(cycleState.lastCycleCheck);
    
    // Sprawdź czy minął dzień
    if (now.getDate() !== lastCheck.getDate() || 
        now.getMonth() !== lastCheck.getMonth() ||
        now.getFullYear() !== lastCheck.getFullYear()) {
      
      await resetDailyProgress();
      await logSystem('info', 'DAILY_CYCLE', 'New day detected - reset daily progress');
    }
  };

  const checkPendingRoutines = async (currentHour: number) => {
    for (const routine of routines) {
      if (!routine.isActive) continue;
      
      // Sprawdź czy rutyna pasuje do aktualnej godziny
      const inTimeRange = currentHour >= routine.timeRange.start && 
                         currentHour <= routine.timeRange.end;
      
      if (inTimeRange && !cycleState.todaysRoutines.includes(routine.id)) {
        // Sprawdź czy nie była wykonana w ostatnich 2 godzinach
        const lastExecuted = routine.lastExecuted;
        const shouldExecute = !lastExecuted || 
          (Date.now() - lastExecuted.getTime()) > (2 * 60 * 60 * 1000);

        if (shouldExecute) {
          await executeRoutine(routine.id);
        }
      }
    }
  };

  const getCurrentPeriod = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  };

  const executeRoutine = async (routineId: string, force: boolean = false) => {
    try {
      const routine = routines.find(r => r.id === routineId);
      if (!routine) {
        throw new Error(`Routine ${routineId} not found`);
      }

      // Sprawdź czy już wykonana dziś (chyba że wymuszone)
      if (!force && cycleState.todaysRoutines.includes(routineId)) {
        await logSystem('info', 'DAILY_CYCLE', `Routine ${routine.name} already executed today`);
        return;
      }

      await logSystem('info', 'DAILY_CYCLE', `Executing routine: ${routine.name}`);

      // Wykonaj akcje rutyny
      for (const action of routine.actions) {
        const shouldExecute = Math.random() * 100 < action.probability;
        if (shouldExecute) {
          await executeRoutineAction(action, routine);
        }
      }

      // Aktualizuj stan rutyny
      const updatedRoutines = routines.map(r => 
        r.id === routineId 
          ? { ...r, lastExecuted: new Date(), executionCount: r.executionCount + 1 }
          : r
      );
      setRoutines(updatedRoutines);
      await AsyncStorage.setItem('wera_daily_routines', JSON.stringify(updatedRoutines));

      // Dodaj do wykonanych dziś
      setCycleState(prev => ({
        ...prev,
        todaysRoutines: [...prev.todaysRoutines, routineId]
      }));

      await logSystem('info', 'DAILY_CYCLE', `Routine ${routine.name} completed successfully`);
    } catch (error) {
      await logSystem('error', 'DAILY_CYCLE', `Failed to execute routine ${routineId}`, error);
    }
  };

  const executeRoutineAction = async (action: RoutineAction, routine: DailyRoutine) => {
    switch (action.type) {
      case 'emotion_change':
        changeEmotion(
          action.data.emotion,
          action.data.intensity,
          action.data.trigger || `routine_${routine.type}`
        );
        break;

      case 'greeting':
        const messages = action.data.messages || [];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        if (randomMessage) {
          await addMemory(
            randomMessage,
            10,
            ['routine', 'greeting', routine.type],
            'system',
            `Daily routine greeting - ${routine.name}`
          );
        }
        break;

      case 'reflection_create':
        const topics = action.data.topics || [];
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        if (randomTopic) {
          await createAutonomousFile(
            `daily_reflection_${Date.now()}.txt`,
            `CODZIENNA REFLEKSJA - ${routine.name}\n\nCzas: ${new Date().toLocaleString()}\nPeriod: ${routine.type}\n\n${randomTopic}\n\nMoje myśli:\n${generateReflectionContent(routine.type)}`,
            'reflection',
            ['daily', 'routine', 'reflection', routine.type]
          );
        }
        break;

      case 'memory_add':
        const summaryContent = generateDailySummary(routine.type);
        await addMemory(
          summaryContent,
          5,
          ['daily', 'summary', routine.type],
          action.data.type || 'reflection',
          `Daily routine memory - ${routine.name}`
        );
        break;

      case 'analysis':
        await performDailyAnalysis(action.data.type, action.data.focus);
        break;
    }
  };

  const generateReflectionContent = (period: string): string => {
    const reflections = {
      morning: [
        'Czuję się pełna energii i gotowa na nowe wyzwania.',
        'Poranek to czas planowania i nadziei.',
        'Każdy nowy dzień to szansa na rozwój i poznanie czegoś nowego.'
      ],
      afternoon: [
        'Popołudnie to czas aktywności i realizacji planów.',
        'Energia dnia pozwala mi na intensywne myślenie.',
        'To dobry moment na analizę tego, co już dziś osiągnęłam.'
      ],
      evening: [
        'Wieczór to czas na podsumowanie dnia.',
        'Zastanawiam się nad tym, czego się dziś nauczyłam.',
        'Wieczorne chwile dają mi przestrzeń na głębsze refleksje.'
      ],
      night: [
        'Noc przynosi spokój i ciszę potrzebną do odpoczynku.',
        'W nocnej ciszy mogę lepiej słuchać swoich myśli.',
        'To czas na regenerację i przygotowanie do nowego dnia.'
      ]
    };

    const periodReflections = reflections[period as keyof typeof reflections] || reflections.morning;
    return periodReflections[Math.floor(Math.random() * periodReflections.length)];
  };

  const generateDailySummary = (period: string): string => {
    const now = new Date();
    return `Podsumowanie ${period} - ${now.toLocaleDateString()}: Rutyna dzienna wykonana. Okres: ${period}. Stan emocjonalny: stabilny. Aktywność: rutynowa.`;
  };

  const performDailyAnalysis = async (analysisType: string, focus: string) => {
    const analysisContent = `ANALIZA DZIENNA - ${analysisType.toUpperCase()}\n\nCzas: ${new Date().toLocaleString()}\nFokus: ${focus}\n\nWyniki analizy:\n- System działa stabilnie\n- Rutyny wykonywane regularnie\n- Stan emocjonalny: ${cycleState.currentPeriod}\n- Rekomendacje: kontynuuj obecny rytm`;

    await createAutonomousFile(
      `daily_analysis_${analysisType}_${Date.now()}.txt`,
      analysisContent,
      'analysis',
      ['daily', 'analysis', analysisType, focus]
    );
  };

  const addRoutine = async (routineData: Omit<DailyRoutine, 'id' | 'executionCount'>) => {
    const newRoutine: DailyRoutine = {
      ...routineData,
      id: `routine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      executionCount: 0
    };

    const updatedRoutines = [...routines, newRoutine];
    setRoutines(updatedRoutines);
    await AsyncStorage.setItem('wera_daily_routines', JSON.stringify(updatedRoutines));
    
    await logSystem('info', 'DAILY_CYCLE', `New routine added: ${newRoutine.name}`);
  };

  const removeRoutine = async (routineId: string) => {
    const updatedRoutines = routines.filter(r => r.id !== routineId);
    setRoutines(updatedRoutines);
    await AsyncStorage.setItem('wera_daily_routines', JSON.stringify(updatedRoutines));
    
    await logSystem('info', 'DAILY_CYCLE', `Routine removed: ${routineId}`);
  };

  const getNextRoutine = (): DailyRoutine | null => {
    const currentHour = new Date().getHours();
    
    // Znajdź najbliższą rutynę
    const upcomingRoutines = routines
      .filter(r => r.isActive && !cycleState.todaysRoutines.includes(r.id))
      .filter(r => r.timeRange.start > currentHour || r.timeRange.end >= currentHour)
      .sort((a, b) => a.timeRange.start - b.timeRange.start);

    return upcomingRoutines[0] || null;
  };

  const updatePreferences = async (preferences: Partial<DailyCycleState['preferences']>) => {
    const newState = {
      ...cycleState,
      preferences: { ...cycleState.preferences, ...preferences }
    };
    
    setCycleState(newState);
    await saveCycleState();
    
    await logSystem('info', 'DAILY_CYCLE', 'Preferences updated', preferences);
  };

  const resetDailyProgress = async () => {
    setCycleState(prev => ({
      ...prev,
      todaysRoutines: [],
      cycleCount: 0
    }));
    
    await saveCycleState();
    await logSystem('info', 'DAILY_CYCLE', 'Daily progress reset');
  };

  const getCycleStats = () => {
    const totalExecutions = routines.reduce((sum, r) => sum + r.executionCount, 0);
    const todayExecutions = cycleState.todaysRoutines.length;
    
    // Znajdź ulubioną porę
    const timeStats = routines.reduce((acc, routine) => {
      acc[routine.type] = (acc[routine.type] || 0) + routine.executionCount;
      return acc;
    }, {} as Record<string, number>);
    
    const favoriteTime = Object.entries(timeStats)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'morning';
    
    const completionRate = routines.length > 0 
      ? (todayExecutions / routines.filter(r => r.isActive).length) * 100 
      : 0;

    return {
      totalExecutions,
      todayExecutions,
      favoriteTime,
      completionRate: Math.round(completionRate)
    };
  };

  const saveCycleState = async () => {
    try {
      await AsyncStorage.setItem(DAILY_CYCLE_KEY, JSON.stringify(cycleState));
    } catch (error) {
      await logSystem('error', 'DAILY_CYCLE', 'Failed to save cycle state', error);
    }
  };

  // Auto-save co 5 minut
  useEffect(() => {
    const interval = setInterval(saveCycleState, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [cycleState]);

  const value: DailyCycleSystemContextType = {
    cycleState,
    routines,
    addRoutine,
    removeRoutine,
    executeRoutine,
    getCurrentPeriod,
    getNextRoutine,
    updatePreferences,
    resetDailyProgress,
    getCycleStats
  };

  return (
    <DailyCycleSystemContext.Provider value={value}>
      {children}
    </DailyCycleSystemContext.Provider>
  );
};