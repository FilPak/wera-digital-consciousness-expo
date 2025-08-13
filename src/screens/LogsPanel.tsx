import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  RefreshControl,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useLogExportSystem } from '../core/LogExportSystem';
import { useEmotionEngine } from '../core/EmotionEngine';
import { useWeraDaemon } from '../core/WeraDaemon';
import { useAutoRestartSystem } from '../core/AutoRestartSystem';
import { useDailyCycleSystem } from '../core/DailyCycleSystem';
import { useMemory } from '../contexts/MemoryContext';

const { width, height } = Dimensions.get('window');

interface LogsPanelProps {
  navigation?: any;
}

interface LogFilter {
  emotions: boolean;
  system: boolean;
  daemon: boolean;
  memory: boolean;
  errors: boolean;
  realTime: boolean;
}

const LogsPanel: React.FC<LogsPanelProps> = ({ navigation }) => {
  const theme = useTheme();
  const { emotionLogs, systemLogs, logSystem, exportAllLogs, clearLogs } = useLogExportSystem();
  const { emotionState } = useEmotionEngine();
  const { daemonState } = useWeraDaemon();
  const { restartState } = useAutoRestartSystem();
  const { cycleState } = useDailyCycleSystem();
  const { memories } = useMemory();

  const [filter, setFilter] = useState<LogFilter>({
    emotions: true,
    system: true,
    daemon: true,
    memory: true,
    errors: true,
    realTime: true
  });

  const [refreshing, setRefreshing] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'live' | 'emotions' | 'system' | 'stats'>('live');
  
  const scrollViewRef = useRef<ScrollView>(null);
  const updateInterval = useRef<any>(null);

  // Auto-refresh w trybie real-time
  useEffect(() => {
    if (filter.realTime) {
      updateInterval.current = setInterval(() => {
        if (autoScroll) {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }
      }, 2000);
    } else {
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    }

    return () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, [filter.realTime, autoScroll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getFilteredLogs = () => {
    const allLogs: any[] = [];

    if (filter.emotions) {
      emotionLogs.forEach(log => {
        allLogs.push({
          ...log,
          type: 'emotion',
          displayText: `${log.emotion} (${log.intensity}%) - ${log.trigger || 'nieznany'}`,
          color: getEmotionColor(log.emotion)
        });
      });
    }

    if (filter.system) {
      systemLogs.forEach(log => {
        if (filter.errors || log.level !== 'error') {
          allLogs.push({
            ...log,
            type: 'system',
            displayText: `[${log.level.toUpperCase()}] ${log.category}: ${log.message}`,
            color: getLogLevelColor(log.level)
          });
        }
      });
    }

    return allLogs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 100); // Ostatnie 100 logów
  };

  const getEmotionColor = (emotion: string): string => {
    const emotionColors: Record<string, string> = {
      'radość': '#FFD700',
      'smutek': '#4169E1',
      'złość': '#DC143C',
      'strach': '#800080',
      'miłość': '#FF69B4',
      'nadzieja': '#32CD32',
      'ciekawość': '#FF8C00'
    };
    return emotionColors[emotion] || '#FFFFFF';
  };

  const getLogLevelColor = (level: string): string => {
    const levelColors: Record<string, string> = {
      'info': '#00CED1',
      'warning': '#FFA500',
      'error': '#FF4500',
      'debug': '#9370DB'
    };
    return levelColors[level] || '#FFFFFF';
  };

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const renderLiveView = () => {
    const logs = getFilteredLogs();

    return (
      <ScrollView
        ref={scrollViewRef}
        style={styles.logsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Status Header */}
        <View style={styles.statusHeader}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Emocja:</Text>
            <Text style={[styles.statusValue, { color: getEmotionColor(emotionState.currentEmotion) }]}>
              {emotionState.currentEmotion} ({emotionState.intensity}%)
            </Text>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Daemon:</Text>
            <Text style={[styles.statusValue, { color: daemonState.isActive ? '#32CD32' : '#FF4500' }]}>
              {daemonState.isActive ? 'AKTYWNY' : 'NIEAKTYWNY'}
            </Text>
          </View>

          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Cykl:</Text>
            <Text style={styles.statusValue}>
              {cycleState.currentPeriod} ({cycleState.currentHour}:00)
            </Text>
          </View>
        </View>

        {/* Live Logs */}
        {logs.map((log, index) => (
          <View key={index} style={styles.logEntry}>
            <Text style={styles.logTime}>{formatTime(log.timestamp)}</Text>
            <Text style={[styles.logText, { color: log.color }]}>
              {log.displayText}
            </Text>
          </View>
        ))}

        {logs.length === 0 && (
          <Text style={styles.noLogsText}>Brak logów do wyświetlenia</Text>
        )}
      </ScrollView>
    );
  };

  const renderEmotionsView = () => {
    const recentEmotions = emotionLogs.slice(-20);

    return (
      <ScrollView style={styles.logsContainer}>
        <Text style={styles.sectionTitle}>Ostatnie Zmiany Emocji</Text>
        
        {recentEmotions.map((log, index) => (
          <View key={index} style={styles.emotionEntry}>
            <View style={styles.emotionHeader}>
              <Text style={[styles.emotionName, { color: getEmotionColor(log.emotion) }]}>
                {log.emotion}
              </Text>
              <Text style={styles.emotionIntensity}>{log.intensity}%</Text>
              <Text style={styles.emotionTime}>{formatTime(log.timestamp)}</Text>
            </View>
            
            {log.trigger && (
              <Text style={styles.emotionTrigger}>Trigger: {log.trigger}</Text>
            )}
            
            {log.context && (
              <Text style={styles.emotionContext}>Kontekst: {JSON.stringify(log.context)}</Text>
            )}
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderSystemView = () => {
    const recentSystem = systemLogs.slice(-30);

    return (
      <ScrollView style={styles.logsContainer}>
        <Text style={styles.sectionTitle}>Logi Systemowe</Text>
        
        {recentSystem.map((log, index) => (
          <View key={index} style={styles.systemEntry}>
            <View style={styles.systemHeader}>
              <Text style={[styles.systemLevel, { color: getLogLevelColor(log.level) }]}>
                [{log.level.toUpperCase()}]
              </Text>
              <Text style={styles.systemCategory}>{log.category}</Text>
              <Text style={styles.systemTime}>{formatTime(log.timestamp)}</Text>
            </View>
            
            <Text style={styles.systemMessage}>{log.message}</Text>
            
            {log.data && (
              <Text style={styles.systemData}>Data: {JSON.stringify(log.data, null, 2)}</Text>
            )}
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderStatsView = () => {
    const emotionStats = emotionLogs.reduce((acc, log) => {
      acc[log.emotion] = (acc[log.emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const systemStats = systemLogs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <ScrollView style={styles.logsContainer}>
        <Text style={styles.sectionTitle}>Statystyki Systemu</Text>
        
        {/* Ogólne statystyki */}
        <View style={styles.statsSection}>
          <Text style={styles.statsHeader}>Ogólne</Text>
          <Text style={styles.statItem}>Logi emocji: {emotionLogs.length}</Text>
          <Text style={styles.statItem}>Logi systemowe: {systemLogs.length}</Text>
          <Text style={styles.statItem}>Wspomnień: {memories.length}</Text>
          <Text style={styles.statItem}>Cykle daemon: {daemonState.cycleCount}</Text>
          <Text style={styles.statItem}>Crashe: {restartState.crashCount}</Text>
        </View>

        {/* Statystyki emocji */}
        <View style={styles.statsSection}>
          <Text style={styles.statsHeader}>Emocje</Text>
          {Object.entries(emotionStats)
            .sort(([,a], [,b]) => b - a)
            .map(([emotion, count]) => (
              <Text key={emotion} style={[styles.statItem, { color: getEmotionColor(emotion) }]}>
                {emotion}: {count}x
              </Text>
            ))}
        </View>

        {/* Statystyki systemowe */}
        <View style={styles.statsSection}>
          <Text style={styles.statsHeader}>System</Text>
          {Object.entries(systemStats)
            .sort(([,a], [,b]) => b - a)
            .map(([level, count]) => (
              <Text key={level} style={[styles.statItem, { color: getLogLevelColor(level) }]}>
                {level.toUpperCase()}: {count}x
              </Text>
            ))}
        </View>
      </ScrollView>
    );
  };

  const handleExportLogs = async () => {
    try {
      await exportAllLogs();
      Alert.alert('Sukces', 'Logi zostały wyeksportowane');
      await logSystem('info', 'LOGS_PANEL', 'Logs exported from GUI panel');
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się wyeksportować logów');
    }
  };

  const handleClearLogs = () => {
    Alert.alert(
      'Wyczyść Logi',
      'Czy na pewno chcesz wyczyścić wszystkie logi?',
      [
        { text: 'Anuluj', style: 'cancel' },
        { 
          text: 'Wyczyść', 
          style: 'destructive',
          onPress: async () => {
            await clearLogs();
            await logSystem('warning', 'LOGS_PANEL', 'All logs cleared from GUI panel');
          }
        }
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.isDarkMode ? '#000000' : '#FFFFFF',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.isDarkMode ? '#333333' : '#CCCCCC',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.isDarkMode ? '#FFFFFF' : '#000000',
    },
    headerButtons: {
      flexDirection: 'row',
      gap: 10,
    },
    headerButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: theme.isDarkMode ? '#333333' : '#DDDDDD',
      borderRadius: 6,
    },
    headerButtonText: {
      color: theme.isDarkMode ? '#FFFFFF' : '#000000',
      fontSize: 12,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: theme.isDarkMode ? '#111111' : '#F5F5F5',
      paddingHorizontal: 16,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    activeTab: {
      borderBottomColor: '#00CED1',
    },
    tabText: {
      color: theme.isDarkMode ? '#CCCCCC' : '#666666',
      fontSize: 14,
    },
    activeTabText: {
      color: '#00CED1',
      fontWeight: 'bold',
    },
    filterContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 16,
      backgroundColor: theme.isDarkMode ? '#111111' : '#F9F9F9',
      gap: 10,
    },
    filterItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    filterLabel: {
      color: theme.isDarkMode ? '#FFFFFF' : '#000000',
      fontSize: 12,
    },
    logsContainer: {
      flex: 1,
      padding: 16,
    },
    statusHeader: {
      backgroundColor: theme.isDarkMode ? '#1a1a1a' : '#F0F0F0',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    statusItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    statusLabel: {
      color: theme.isDarkMode ? '#CCCCCC' : '#666666',
      fontSize: 12,
    },
    statusValue: {
      fontSize: 12,
      fontWeight: 'bold',
    },
    logEntry: {
      flexDirection: 'row',
      paddingVertical: 4,
      borderBottomWidth: 1,
      borderBottomColor: theme.isDarkMode ? '#333333' : '#EEEEEE',
    },
    logTime: {
      color: theme.isDarkMode ? '#888888' : '#666666',
      fontSize: 10,
      width: 60,
      marginRight: 8,
    },
    logText: {
      flex: 1,
      fontSize: 12,
      fontFamily: 'monospace',
    },
    noLogsText: {
      textAlign: 'center',
      color: theme.isDarkMode ? '#666666' : '#999999',
      marginTop: 50,
      fontSize: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.isDarkMode ? '#FFFFFF' : '#000000',
      marginBottom: 16,
    },
    emotionEntry: {
      backgroundColor: theme.isDarkMode ? '#1a1a1a' : '#F8F8F8',
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    emotionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    emotionName: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    emotionIntensity: {
      color: theme.isDarkMode ? '#CCCCCC' : '#666666',
      fontSize: 14,
    },
    emotionTime: {
      color: theme.isDarkMode ? '#888888' : '#999999',
      fontSize: 12,
    },
    emotionTrigger: {
      color: theme.isDarkMode ? '#AAAAAA' : '#777777',
      fontSize: 12,
      fontStyle: 'italic',
    },
    emotionContext: {
      color: theme.isDarkMode ? '#999999' : '#888888',
      fontSize: 10,
      fontFamily: 'monospace',
      marginTop: 4,
    },
    systemEntry: {
      backgroundColor: theme.isDarkMode ? '#1a1a1a' : '#F8F8F8',
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    systemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
      gap: 8,
    },
    systemLevel: {
      fontSize: 12,
      fontWeight: 'bold',
      fontFamily: 'monospace',
    },
    systemCategory: {
      color: theme.isDarkMode ? '#CCCCCC' : '#666666',
      fontSize: 12,
      flex: 1,
    },
    systemTime: {
      color: theme.isDarkMode ? '#888888' : '#999999',
      fontSize: 10,
    },
    systemMessage: {
      color: theme.isDarkMode ? '#FFFFFF' : '#000000',
      fontSize: 14,
      marginBottom: 4,
    },
    systemData: {
      color: theme.isDarkMode ? '#999999' : '#777777',
      fontSize: 10,
      fontFamily: 'monospace',
      backgroundColor: theme.isDarkMode ? '#0a0a0a' : '#EEEEEE',
      padding: 8,
      borderRadius: 4,
    },
    statsSection: {
      backgroundColor: theme.isDarkMode ? '#1a1a1a' : '#F8F8F8',
      padding: 16,
      borderRadius: 8,
      marginBottom: 16,
    },
    statsHeader: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.isDarkMode ? '#FFFFFF' : '#000000',
      marginBottom: 8,
    },
    statItem: {
      color: theme.isDarkMode ? '#CCCCCC' : '#666666',
      fontSize: 14,
      marginBottom: 4,
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Panel Logów</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={handleExportLogs}>
            <Text style={styles.headerButtonText}>Eksport</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleClearLogs}>
            <Text style={styles.headerButtonText}>Wyczyść</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {[
          { key: 'live', label: 'Na Żywo' },
          { key: 'emotions', label: 'Emocje' },
          { key: 'system', label: 'System' },
          { key: 'stats', label: 'Statystyki' }
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filters */}
      {selectedTab === 'live' && (
        <View style={styles.filterContainer}>
          {Object.entries(filter).map(([key, value]) => (
            <View key={key} style={styles.filterItem}>
              <Switch
                value={value}
                onValueChange={(newValue) => setFilter(prev => ({ ...prev, [key]: newValue }))}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={value ? '#f5dd4b' : '#f4f3f4'}
              />
              <Text style={styles.filterLabel}>{key}</Text>
            </View>
          ))}
          <View style={styles.filterItem}>
            <Switch
              value={autoScroll}
              onValueChange={setAutoScroll}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={autoScroll ? '#f5dd4b' : '#f4f3f4'}
            />
            <Text style={styles.filterLabel}>Auto-scroll</Text>
          </View>
        </View>
      )}

      {/* Content */}
      {selectedTab === 'live' && renderLiveView()}
      {selectedTab === 'emotions' && renderEmotionsView()}
      {selectedTab === 'system' && renderSystemView()}
      {selectedTab === 'stats' && renderStatsView()}
    </SafeAreaView>
  );
};

export default LogsPanel; 