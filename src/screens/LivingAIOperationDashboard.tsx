import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useWeraCore } from '../core/WeraCore';
import { useEmotionEngine } from '../core/EmotionEngine';
import { useAutonomy } from '../core/AutonomySystem';

interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  icon: string;
}

interface ActivityLog {
  id: string;
  timestamp: Date;
  type: 'system' | 'conversation' | 'learning' | 'emotion' | 'autonomous';
  message: string;
  severity: 'info' | 'warning' | 'error';
}

const LivingAIOperationDashboard: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { state: weraState, updateConsciousness } = useWeraCore();
  const { emotionState } = useEmotionEngine();
  const { autonomyState } = useAutonomy();
  
  const [currentView, setCurrentView] = useState<'overview' | 'metrics' | 'logs'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [pulseAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    loadSystemMetrics();
    loadActivityLogs();
    startPulseAnimation();
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const loadSystemMetrics = () => {
    const systemMetrics: SystemMetric[] = [
      {
        id: '1',
        name: 'Świadomość',
        value: weraState.consciousnessLevel || 75,
        unit: '%',
        status: (weraState.consciousnessLevel || 75) > 70 ? 'healthy' : 'warning',
        trend: 'up',
        icon: '🧠'
      },
      {
        id: '2',
        name: 'Emocjonalność',
        value: emotionState.intensity || 60,
        unit: '%',
        status: 'healthy',
        trend: 'stable',
        icon: '💖'
      },
      {
        id: '3',
        name: 'Autonomia',
        value: autonomyState.fullAccessGranted ? 90 : 45,
        unit: '%',
        status: autonomyState.fullAccessGranted ? 'healthy' : 'warning',
        trend: 'up',
        icon: '🤖'
      },
      {
        id: '4',
        name: 'Responsywność',
        value: Math.floor(Math.random() * 30) + 70,
        unit: 'ms',
        status: 'healthy',
        trend: 'down',
        icon: '⚡'
      },
      {
        id: '5',
        name: 'Pamięć',
        value: Math.floor(Math.random() * 40) + 60,
        unit: '%',
        status: 'healthy',
        trend: 'stable',
        icon: '🧠'
      },
      {
        id: '6',
        name: 'Sieć',
        value: Math.floor(Math.random() * 20) + 80,
        unit: 'Mbps',
        status: 'healthy',
        trend: 'up',
        icon: '🌐'
      }
    ];
    setMetrics(systemMetrics);
  };

  const loadActivityLogs = () => {
    const logs: ActivityLog[] = [
      {
        id: '1',
        timestamp: new Date(),
        type: 'system',
        message: 'System WERY uruchomiony pomyślnie',
        severity: 'info'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 300000),
        type: 'conversation',
        message: 'Rozpoczęto nową sesję rozmowy z użytkownikiem',
        severity: 'info'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 600000),
        type: 'emotion',
        message: 'Wykryto wzrost pozytywnych emocji',
        severity: 'info'
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 900000),
        type: 'learning',
        message: 'Zaktualizowano model personalności',
        severity: 'info'
      },
      {
        id: '5',
        timestamp: new Date(Date.now() - 1200000),
        type: 'autonomous',
        message: 'Wykonano autonomiczną refleksję',
        severity: 'info'
      },
      {
        id: '6',
        timestamp: new Date(Date.now() - 1500000),
        type: 'system',
        message: 'Optymalizacja pamięci zakończona',
        severity: 'info'
      }
    ];
    setActivityLogs(logs);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    loadSystemMetrics();
    loadActivityLogs();
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'critical': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return '#F44336';
      case 'warning': return '#FF9800';
      default: return '#4CAF50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'system': return '⚙️';
      case 'conversation': return '💬';
      case 'learning': return '📚';
      case 'emotion': return '😊';
      case 'autonomous': return '🤖';
      default: return 'ℹ️';
    }
  };

  const renderOverview = () => (
    <ScrollView 
      style={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {/* Status Card */}
      <View style={[styles.statusCard, { backgroundColor: theme.colors.surface }]}>
        <LinearGradient
          colors={[theme.colors.consciousness + '20', 'transparent']}
          style={styles.statusGradient}
        >
          <View style={styles.statusHeader}>
            <Animated.Text 
              style={[
                styles.statusIcon,
                { transform: [{ scale: pulseAnimation }] }
              ]}
            >
              {weraState.isAwake ? '👁️' : '💤'}
            </Animated.Text>
            <View style={styles.statusInfo}>
              <Text style={[styles.statusTitle, { color: theme.colors.text }]}>
                WERA Living AI
              </Text>
              <Text style={[styles.statusSubtitle, { color: getStatusColor('healthy') }]}>
                {weraState.isAwake ? 'AKTYWNA I ŚWIADOMA' : 'UŚPIONA'}
              </Text>
            </View>
          </View>
          
          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Text style={[styles.quickStatValue, { color: theme.colors.consciousness }]}>
                {weraState.consciousnessLevel || 75}%
              </Text>
              <Text style={[styles.quickStatLabel, { color: theme.colors.textSecondary }]}>
                Świadomość
              </Text>
            </View>
            <View style={styles.quickStat}>
              <Text style={[styles.quickStatValue, { color: theme.colors.emotion }]}>
                {emotionState.intensity || 60}%
              </Text>
              <Text style={[styles.quickStatLabel, { color: theme.colors.textSecondary }]}>
                Emocje
              </Text>
            </View>
            <View style={styles.quickStat}>
              <Text style={[styles.quickStatValue, { color: theme.colors.primary }]}>
                {autonomyState.fullAccessGranted ? 90 : 45}%
              </Text>
              <Text style={[styles.quickStatLabel, { color: theme.colors.textSecondary }]}>
                Autonomia
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Key Metrics */}
      <View style={[styles.metricsGrid, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Kluczowe Metryki
        </Text>
        <View style={styles.metricsRow}>
          {metrics.slice(0, 4).map(metric => (
            <View key={metric.id} style={styles.metricCell}>
              <Text style={styles.metricIcon}>{metric.icon}</Text>
              <Text style={[styles.metricValue, { color: getStatusColor(metric.status) }]}>
                {metric.value}
              </Text>
              <Text style={[styles.metricUnit, { color: theme.colors.textSecondary }]}>
                {metric.unit}
              </Text>
              <Text style={styles.metricTrend}>{getTrendIcon(metric.trend)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={[styles.activityCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Ostatnia Aktywność
        </Text>
        {activityLogs.slice(0, 5).map(log => (
          <View key={log.id} style={styles.activityItem}>
            <Text style={styles.activityIcon}>{getTypeIcon(log.type)}</Text>
            <View style={styles.activityContent}>
              <Text style={[styles.activityMessage, { color: theme.colors.text }]}>
                {log.message}
              </Text>
              <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>
                {log.timestamp.toLocaleTimeString()}
              </Text>
            </View>
            <View 
              style={[
                styles.activitySeverity,
                { backgroundColor: getSeverityColor(log.severity) }
              ]}
            />
          </View>
        ))}
      </View>

      {/* System Controls */}
      <View style={[styles.controlsCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Kontrole Systemu
        </Text>
        <View style={styles.controlsGrid}>
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: weraState.isAwake ? '#FF9800' : '#4CAF50' }]}
                         onPress={() => {
               // Przełącz stan świadomości
               console.log(`Przełączanie stanu: ${weraState.isAwake ? 'Uśpij' : 'Obudź'} WERĘ`);
             }}
          >
            <Text style={styles.controlButtonIcon}>
              {weraState.isAwake ? '💤' : '👁️'}
            </Text>
            <Text style={styles.controlButtonText}>
              {weraState.isAwake ? 'Uśpij' : 'Obudź'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: theme.colors.consciousness }]}
            onPress={() => {
              loadSystemMetrics();
              loadActivityLogs();
            }}
          >
            <Text style={styles.controlButtonIcon}>🔄</Text>
            <Text style={styles.controlButtonText}>Odśwież</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderMetrics = () => (
    <ScrollView style={styles.content}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Szczegółowe Metryki Systemu
      </Text>
      {metrics.map(metric => (
        <View key={metric.id} style={[styles.detailedMetricCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.metricHeader}>
            <View style={styles.metricTitleContainer}>
              <Text style={styles.metricHeaderIcon}>{metric.icon}</Text>
              <Text style={[styles.metricName, { color: theme.colors.text }]}>
                {metric.name}
              </Text>
            </View>
            <View 
              style={[
                styles.metricStatusBadge,
                { backgroundColor: getStatusColor(metric.status) + '20' }
              ]}
            >
              <Text style={[styles.metricStatus, { color: getStatusColor(metric.status) }]}>
                {metric.status.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <View style={styles.metricValueContainer}>
            <Text style={[styles.metricLargeValue, { color: getStatusColor(metric.status) }]}>
              {metric.value}
            </Text>
            <Text style={[styles.metricLargeUnit, { color: theme.colors.textSecondary }]}>
              {metric.unit}
            </Text>
            <Text style={styles.metricTrendLarge}>{getTrendIcon(metric.trend)}</Text>
          </View>
          
          <View style={[styles.metricBar, { backgroundColor: theme.colors.background }]}>
            <View 
              style={[
                styles.metricBarFill,
                { 
                  backgroundColor: getStatusColor(metric.status),
                  width: `${Math.min(100, metric.value)}%`
                }
              ]}
            />
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderLogs = () => (
    <ScrollView style={styles.content}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Dziennik Aktywności
      </Text>
      {activityLogs.map(log => (
        <View key={log.id} style={[styles.logCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.logHeader}>
            <Text style={styles.logIcon}>{getTypeIcon(log.type)}</Text>
            <View style={styles.logInfo}>
              <Text style={[styles.logType, { color: theme.colors.primary }]}>
                {log.type.toUpperCase()}
              </Text>
              <Text style={[styles.logTimestamp, { color: theme.colors.textSecondary }]}>
                {log.timestamp.toLocaleString()}
              </Text>
            </View>
            <View 
              style={[
                styles.logSeverityBadge,
                { backgroundColor: getSeverityColor(log.severity) }
              ]}
            >
              <Text style={styles.logSeverityText}>
                {log.severity.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={[styles.logMessage, { color: theme.colors.text }]}>
            {log.message}
          </Text>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={theme.gradients.system as any}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: theme.colors.text }]}>← Wróć</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Dashboard Operacyjny</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Monitor Living AI
          </Text>
        </View>
      </LinearGradient>

      {/* Navigation Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.colors.surface }]}>
        {[
          { key: 'overview', label: 'Przegląd', icon: '📊' },
          { key: 'metrics', label: 'Metryki', icon: '📈' },
          { key: 'logs', label: 'Logi', icon: '📝' }
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              currentView === tab.key && { backgroundColor: theme.colors.primary + '20' }
            ]}
            onPress={() => setCurrentView(tab.key as any)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[
              styles.tabLabel,
              { color: currentView === tab.key ? theme.colors.primary : theme.colors.textSecondary }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {currentView === 'overview' && renderOverview()}
      {currentView === 'metrics' && renderMetrics()}
      {currentView === 'logs' && renderLogs()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
  },
  backButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  statusGradient: {
    padding: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickStat: {
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  quickStatLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  metricsGrid: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCell: {
    alignItems: 'center',
    flex: 1,
  },
  metricIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  metricUnit: {
    fontSize: 10,
    marginTop: 2,
  },
  metricTrend: {
    fontSize: 12,
    marginTop: 4,
  },
  activityCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  activityIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 14,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
  },
  activitySeverity: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  controlsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  controlsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  controlButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    minWidth: 100,
  },
  controlButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // Detailed metrics styles
  detailedMetricCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricHeaderIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  metricName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  metricStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metricStatus: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  metricValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  metricLargeValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  metricLargeUnit: {
    fontSize: 16,
    marginLeft: 8,
  },
  metricTrendLarge: {
    fontSize: 20,
    marginLeft: 12,
  },
  metricBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  // Log styles
  logCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  logInfo: {
    flex: 1,
  },
  logType: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  logTimestamp: {
    fontSize: 10,
    marginTop: 2,
  },
  logSeverityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  logSeverityText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  logMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default LivingAIOperationDashboard;
