import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEmotionEngine } from './EmotionEngine';
import { useMemory } from '../contexts/MemoryContext';
import { useAutonomy } from './AutonomySystem';

const LOGS_DIR = FileSystem.documentDirectory + 'wera_logs/';
const EMOTION_LOG_KEY = 'wera_emotion_log_buffer';
const SYSTEM_LOG_KEY = 'wera_system_log_buffer';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  category: string;
  message: string;
  data?: any;
}

interface EmotionLogEntry {
  timestamp: string;
  emotion: string;
  intensity: number;
  trigger?: string;
  previousEmotion?: string;
  duration?: number;
  context?: string;
}

interface LogExportSystemContextType {
  emotionLogs: EmotionLogEntry[];
  systemLogs: LogEntry[];
  logEmotion: (emotion: string, intensity: number, trigger?: string, context?: string) => Promise<void>;
  logSystem: (level: LogEntry['level'], category: string, message: string, data?: any) => Promise<void>;
  exportEmotionLog: () => Promise<string>;
  exportSystemLog: () => Promise<string>;
  exportAllLogs: () => Promise<string>;
  shareLogFiles: () => Promise<void>;
  clearLogs: (type?: 'emotion' | 'system' | 'all') => Promise<void>;
  getLogStats: () => {
    emotionEntries: number;
    systemEntries: number;
    oldestEntry: string | null;
    newestEntry: string | null;
    totalSize: number;
  };
}

const LogExportSystemContext = createContext<LogExportSystemContextType | null>(null);

export const useLogExportSystem = () => {
  const context = useContext(LogExportSystemContext);
  if (!context) {
    throw new Error('useLogExportSystem must be used within LogExportSystemProvider');
  }
  return context;
};

export const LogExportSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { emotionState } = useEmotionEngine();
  const { memories } = useMemory();
  const { autonomyState } = useAutonomy();

  const [emotionLogs, setEmotionLogs] = useState<EmotionLogEntry[]>([]);
  const [systemLogs, setSystemLogs] = useState<LogEntry[]>([]);
  const previousEmotion = useRef<string>('');
  const emotionStartTime = useRef<Date>(new Date());

  // Inicjalizacja - tworzenie katalogów i ładowanie logów
  useEffect(() => {
    initializeLogSystem();
  }, []);

  // Monitorowanie zmian emocji
  useEffect(() => {
    if (emotionState.currentEmotion !== previousEmotion.current) {
      const now = new Date();
      const duration = Math.floor((now.getTime() - emotionStartTime.current.getTime()) / 1000);
      
      logEmotion(
        emotionState.currentEmotion,
        emotionState.intensity,
        'automatic_change',
        `Zmiana z ${previousEmotion.current} po ${duration}s`
      );

      previousEmotion.current = emotionState.currentEmotion;
      emotionStartTime.current = now;
    }
  }, [emotionState.currentEmotion, emotionState.intensity]);

  // Automatyczne zapisywanie logów co 5 minut
  useEffect(() => {
    const interval = setInterval(() => {
      saveLogsToFiles();
    }, 5 * 60 * 1000); // 5 minut

    return () => clearInterval(interval);
  }, [emotionLogs, systemLogs]);

  const initializeLogSystem = async () => {
    try {
      // Stwórz katalog logów
      const dirInfo = await FileSystem.getInfoAsync(LOGS_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(LOGS_DIR, { intermediates: true });
      }

      // Załaduj logi z AsyncStorage
      await loadLogsFromStorage();

      // Log inicjalizacji systemu
      await logSystem('info', 'SYSTEM', 'WERA Log Export System initialized');
      
    } catch (error) {
      console.error('Error initializing log system:', error);
    }
  };

  const loadLogsFromStorage = async () => {
    try {
      const [emotionData, systemData] = await Promise.all([
        AsyncStorage.getItem(EMOTION_LOG_KEY),
        AsyncStorage.getItem(SYSTEM_LOG_KEY)
      ]);

      if (emotionData) {
        setEmotionLogs(JSON.parse(emotionData));
      }

      if (systemData) {
        setSystemLogs(JSON.parse(systemData));
      }
    } catch (error) {
      console.error('Error loading logs from storage:', error);
    }
  };

  const saveLogsToStorage = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(EMOTION_LOG_KEY, JSON.stringify(emotionLogs.slice(-1000))), // Ostatnie 1000 wpisów
        AsyncStorage.setItem(SYSTEM_LOG_KEY, JSON.stringify(systemLogs.slice(-2000))) // Ostatnie 2000 wpisów
      ]);
    } catch (error) {
      console.error('Error saving logs to storage:', error);
    }
  };

  const logEmotion = async (
    emotion: string,
    intensity: number,
    trigger?: string,
    context?: string
  ) => {
    const entry: EmotionLogEntry = {
      timestamp: new Date().toISOString(),
      emotion,
      intensity,
      trigger,
      previousEmotion: previousEmotion.current || undefined,
      context
    };

    setEmotionLogs(prev => [...prev, entry].slice(-1000)); // Zachowaj ostatnie 1000 wpisów
    
    // Automatycznie zapisz do AsyncStorage
    setTimeout(() => saveLogsToStorage(), 100);
  };

  const logSystem = async (
    level: LogEntry['level'],
    category: string,
    message: string,
    data?: any
  ) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data: data ? JSON.stringify(data) : undefined
    };

    setSystemLogs(prev => [...prev, entry].slice(-2000)); // Zachowaj ostatnie 2000 wpisów
    
    // Console log dla rozwoju
    const logMessage = `[${level.toUpperCase()}] ${category}: ${message}`;
    switch (level) {
      case 'error':
        console.error(logMessage, data);
        break;
      case 'warning':
        console.warn(logMessage, data);
        break;
      case 'debug':
        console.debug(logMessage, data);
        break;
      default:
        console.log(logMessage, data);
    }

    // Automatycznie zapisz do AsyncStorage
    setTimeout(() => saveLogsToStorage(), 100);
  };

  const saveLogsToFiles = async () => {
    try {
      const emotionLogPath = LOGS_DIR + 'emotion_log.txt';
      const systemLogPath = LOGS_DIR + 'system_logs.txt';

      // Generuj zawartość emotion_log.txt
      const emotionLogContent = generateEmotionLogContent();
      
      // Generuj zawartość system_logs.txt
      const systemLogContent = generateSystemLogContent();

      await Promise.all([
        FileSystem.writeAsStringAsync(emotionLogPath, emotionLogContent),
        FileSystem.writeAsStringAsync(systemLogPath, systemLogContent)
      ]);

      console.log('📝 WERA: Log files saved to:', LOGS_DIR);
    } catch (error) {
      console.error('Error saving log files:', error);
    }
  };

  const generateEmotionLogContent = (): string => {
    const header = `# WERA EMOTION LOG
# Generated: ${new Date().toLocaleString()}
# Total entries: ${emotionLogs.length}
# Format: [TIMESTAMP] EMOTION(INTENSITY%) [TRIGGER] - CONTEXT
# ================================================================

`;

    const entries = emotionLogs.map(entry => {
      const timestamp = new Date(entry.timestamp).toLocaleString();
      const trigger = entry.trigger ? ` [${entry.trigger}]` : '';
      const context = entry.context ? ` - ${entry.context}` : '';
      const previous = entry.previousEmotion ? ` (poprz: ${entry.previousEmotion})` : '';
      
      return `[${timestamp}] ${entry.emotion}(${entry.intensity}%)${trigger}${context}${previous}`;
    }).join('\n');

    return header + entries + '\n\n# End of emotion log\n';
  };

  const generateSystemLogContent = (): string => {
    const header = `# WERA SYSTEM LOG
# Generated: ${new Date().toLocaleString()}
# Total entries: ${systemLogs.length}
# Format: [TIMESTAMP] [LEVEL] CATEGORY: MESSAGE
# ================================================================

`;

    const entries = systemLogs.map(entry => {
      const timestamp = new Date(entry.timestamp).toLocaleString();
      const data = entry.data ? ` | Data: ${entry.data}` : '';
      
      return `[${timestamp}] [${entry.level.toUpperCase()}] ${entry.category}: ${entry.message}${data}`;
    }).join('\n');

    return header + entries + '\n\n# End of system log\n';
  };

  const exportEmotionLog = async (): Promise<string> => {
    const content = generateEmotionLogContent();
    const filePath = LOGS_DIR + `emotion_log_export_${Date.now()}.txt`;
    
    await FileSystem.writeAsStringAsync(filePath, content);
    return filePath;
  };

  const exportSystemLog = async (): Promise<string> => {
    const content = generateSystemLogContent();
    const filePath = LOGS_DIR + `system_log_export_${Date.now()}.txt`;
    
    await FileSystem.writeAsStringAsync(filePath, content);
    return filePath;
  };

  const exportAllLogs = async (): Promise<string> => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = LOGS_DIR + `wera_complete_log_${timestamp}.txt`;
    
    const stats = getLogStats();
    
    const content = `# WERA COMPLETE LOG EXPORT
# Generated: ${new Date().toLocaleString()}
# Export Statistics:
#   - Emotion entries: ${stats.emotionEntries}
#   - System entries: ${stats.systemEntries}  
#   - Oldest entry: ${stats.oldestEntry}
#   - Newest entry: ${stats.newestEntry}
#   - Total size: ${stats.totalSize} bytes
# ================================================================

${generateEmotionLogContent()}

# ================================================================
# SYSTEM LOGS
# ================================================================

${generateSystemLogContent()}

# ================================================================
# MEMORY STATISTICS
# ================================================================

Total memories: ${memories.length}
Active memories: ${memories.filter(m => m.accessCount > 0).length}

# ================================================================
# AUTONOMY STATISTICS  
# ================================================================

Autonomy level: ${autonomyState.autonomyLevel}%
Trust level: ${autonomyState.trustLevel}%
Total initiatives: ${autonomyState.initiativeCount}

# End of complete log export
`;

    await FileSystem.writeAsStringAsync(filePath, content);
    return filePath;
  };

  const shareLogFiles = async () => {
    try {
      const allLogsPath = await exportAllLogs();
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(allLogsPath, {
          mimeType: 'text/plain',
          dialogTitle: 'Eksportuj logi WERA'
        });
      } else {
        await logSystem('warning', 'EXPORT', 'Sharing not available on this device');
      }
    } catch (error) {
      await logSystem('error', 'EXPORT', 'Failed to share log files', error);
    }
  };

  const clearLogs = async (type: 'emotion' | 'system' | 'all' = 'all') => {
    try {
      if (type === 'emotion' || type === 'all') {
        setEmotionLogs([]);
        await AsyncStorage.removeItem(EMOTION_LOG_KEY);
      }

      if (type === 'system' || type === 'all') {
        setSystemLogs([]);
        await AsyncStorage.removeItem(SYSTEM_LOG_KEY);
      }

      await logSystem('info', 'SYSTEM', `Cleared ${type} logs`);
    } catch (error) {
      await logSystem('error', 'SYSTEM', 'Failed to clear logs', error);
    }
  };

  const getLogStats = () => {
    const allEntries = [
      ...emotionLogs.map(e => e.timestamp),
      ...systemLogs.map(s => s.timestamp)
    ].sort();

    const totalSize = JSON.stringify(emotionLogs).length + JSON.stringify(systemLogs).length;

    return {
      emotionEntries: emotionLogs.length,
      systemEntries: systemLogs.length,
      oldestEntry: allEntries.length > 0 ? allEntries[0] : null,
      newestEntry: allEntries.length > 0 ? allEntries[allEntries.length - 1] : null,
      totalSize
    };
  };

  // Auto-save logs when component unmounts
  useEffect(() => {
    return () => {
      saveLogsToFiles();
    };
  }, []);

  const value: LogExportSystemContextType = {
    emotionLogs,
    systemLogs,
    logEmotion,
    logSystem,
    exportEmotionLog,
    exportSystemLog,
    exportAllLogs,
    shareLogFiles,
    clearLogs,
    getLogStats
  };

  return (
    <LogExportSystemContext.Provider value={value}>
      {children}
    </LogExportSystemContext.Provider>
  );
};