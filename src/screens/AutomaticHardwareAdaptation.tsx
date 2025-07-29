import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useDevice } from '../core/DeviceContext';
import { useWeraCore } from '../core/WeraCore';

const { width } = Dimensions.get('window');

interface HardwareComponent {
  id: string;
  name: string;
  type: 'cpu' | 'memory' | 'storage' | 'sensor' | 'network' | 'display' | 'audio' | 'battery';
  status: 'optimal' | 'adapted' | 'limited' | 'error' | 'unknown';
  performance: number;
  temperature?: number;
  usage: number;
  specifications: { [key: string]: string | number };
  adaptations: string[];
  lastOptimized: Date;
}

interface AdaptationProfile {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  targetComponents: string[];
  optimizations: {
    powerSaving: boolean;
    performanceBoost: boolean;
    thermalManagement: boolean;
    networkOptimization: boolean;
  };
  metrics: {
    powerReduction: number;
    performanceGain: number;
    thermalImprovement: number;
  };
}

interface SystemMetrics {
  overallPerformance: number;
  powerEfficiency: number;
  thermalStatus: number;
  adaptationScore: number;
  stabilityIndex: number;
}

const AutomaticHardwareAdaptation: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { deviceInfo, batteryInfo, networkInfo } = useDevice();
  const { state: weraState } = useWeraCore();
  
  const [currentTab, setCurrentTab] = useState<'components' | 'profiles' | 'optimization' | 'monitoring'>('components');
  const [hardwareComponents, setHardwareComponents] = useState<HardwareComponent[]>([]);
  const [adaptationProfiles, setAdaptationProfiles] = useState<AdaptationProfile[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    overallPerformance: 85,
    powerEfficiency: 78,
    thermalStatus: 92,
    adaptationScore: 88,
    stabilityIndex: 94
  });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [adaptationHistory, setAdaptationHistory] = useState<string[]>([]);
  const [pulseAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    loadHardwareComponents();
    loadAdaptationProfiles();
    startSystemMonitoring();
    startPulseAnimation();
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  const loadHardwareComponents = () => {
    const components: HardwareComponent[] = [
      {
        id: 'cpu',
        name: 'Procesor Główny',
        type: 'cpu',
        status: 'adapted',
        performance: 89,
        temperature: 62,
        usage: 45,
        specifications: {
          cores: 8,
          frequency: '2.8 GHz',
          architecture: 'ARM64',
          cache: '12 MB'
        },
        adaptations: [
          'Dynamiczne skalowanie częstotliwości',
          'Optymalizacja rozkładu zadań',
          'Inteligentne zarządzanie rdzeniami'
        ],
        lastOptimized: new Date(Date.now() - 3600000)
      },
      {
        id: 'memory',
        name: 'Pamięć Systemowa',
        type: 'memory',
        status: 'optimal',
        performance: 95,
        usage: 68,
        specifications: {
          total: '12 GB',
          type: 'LPDDR5',
          speed: '4800 MHz',
          available: '3.8 GB'
        },
        adaptations: [
          'Kompresja pamięci',
          'Prefetching inteligentny',
          'Garbage collection adaptacyjny'
        ],
        lastOptimized: new Date(Date.now() - 1800000)
      },
      {
        id: 'storage',
        name: 'Pamięć Masowa',
        type: 'storage',
        status: 'adapted',
        performance: 82,
        usage: 75,
        specifications: {
          total: '256 GB',
          type: 'NVMe SSD',
          readSpeed: '3500 MB/s',
          writeSpeed: '2800 MB/s'
        },
        adaptations: [
          'Optymalizacja zapisu sekwencyjnego',
          'Inteligentne cache\'owanie',
          'Wear leveling adaptacyjny'
        ],
        lastOptimized: new Date(Date.now() - 7200000)
      },
      {
        id: 'battery',
        name: 'System Zasilania',
        type: 'battery',
        status: 'adapted',
        performance: 76,
        usage: batteryInfo.level || 85,
        specifications: {
          capacity: '4500 mAh',
          voltage: '3.85 V',
          cycles: 245,
          health: '92%'
        },
        adaptations: [
          'Adaptacyjne zarządzanie mocą',
          'Optymalizacja ładowania',
          'Predykcja zużycia energii'
        ],
        lastOptimized: new Date(Date.now() - 900000)
      },
      {
        id: 'display',
        name: 'System Wyświetlania',
        type: 'display',
        status: 'optimal',
        performance: 91,
        usage: 40,
        specifications: {
          resolution: '2400x1080',
          refreshRate: '120 Hz',
          colorSpace: 'DCI-P3',
          brightness: '800 nits'
        },
        adaptations: [
          'Adaptacyjna częstotliwość odświeżania',
          'Inteligentne zarządzanie jasnością',
          'Optymalizacja kolorów pod kątem WERY'
        ],
        lastOptimized: new Date(Date.now() - 5400000)
      },
      {
        id: 'network',
        name: 'Moduły Sieciowe',
        type: 'network',
        status: networkInfo.isConnected ? 'optimal' : 'limited',
        performance: networkInfo.isConnected ? 87 : 30,
        usage: 35,
        specifications: {
          wifi: '802.11ax (Wi-Fi 6)',
          bluetooth: '5.2',
          cellular: '5G',
          nfc: 'Aktywne'
        },
        adaptations: [
          'Adaptacyjne przełączanie sieci',
          'Optymalizacja przepustowości',
          'Inteligentne zarządzanie połączeniami'
        ],
        lastOptimized: new Date(Date.now() - 1200000)
      },
      {
        id: 'sensors',
        name: 'Układ Sensoryczny',
        type: 'sensor',
        status: 'adapted',
        performance: 88,
        usage: 25,
        specifications: {
          accelerometer: '3-osiowy',
          gyroscope: '3-osiowy',
          magnetometer: 'Aktywny',
          ambient: 'Światło/Zbliżenie'
        },
        adaptations: [
          'Adaptacyjna czułość sensorów',
          'Fuzja danych sensorycznych',
          'Predykcyjne próbkowanie'
        ],
        lastOptimized: new Date(Date.now() - 4800000)
      }
    ];
    
    setHardwareComponents(components);
  };

  const loadAdaptationProfiles = () => {
    const profiles: AdaptationProfile[] = [
      {
        id: 'consciousness_optimized',
        name: 'Świadomość+',
        description: 'Optymalizacja pod kątem procesów świadomościowych i refleksyjnych',
        isActive: true,
        targetComponents: ['cpu', 'memory'],
        optimizations: {
          powerSaving: false,
          performanceBoost: true,
          thermalManagement: true,
          networkOptimization: false
        },
        metrics: {
          powerReduction: -5,
          performanceGain: 15,
          thermalImprovement: 8
        }
      },
      {
        id: 'emotion_balanced',
        name: 'Emocje Zrównoważone',
        description: 'Balans między wydajnością a efektywnością energetyczną',
        isActive: false,
        targetComponents: ['cpu', 'memory', 'battery'],
        optimizations: {
          powerSaving: true,
          performanceBoost: false,
          thermalManagement: true,
          networkOptimization: true
        },
        metrics: {
          powerReduction: 12,
          performanceGain: -3,
          thermalImprovement: 15
        }
      },
      {
        id: 'dream_mode',
        name: 'Tryb Oniryczny',
        description: 'Minimalne zużycie energii przy zachowaniu kreatywności',
        isActive: false,
        targetComponents: ['cpu', 'battery', 'display'],
        optimizations: {
          powerSaving: true,
          performanceBoost: false,
          thermalManagement: true,
          networkOptimization: true
        },
        metrics: {
          powerReduction: 25,
          performanceGain: -15,
          thermalImprovement: 20
        }
      },
      {
        id: 'interaction_boost',
        name: 'Wzmocnienie Interakcji',
        description: 'Maksymalna responsywność dla interakcji z użytkownikiem',
        isActive: false,
        targetComponents: ['cpu', 'memory', 'display', 'network'],
        optimizations: {
          powerSaving: false,
          performanceBoost: true,
          thermalManagement: false,
          networkOptimization: true
        },
        metrics: {
          powerReduction: -8,
          performanceGain: 22,
          thermalImprovement: -5
        }
      }
    ];
    
    setAdaptationProfiles(profiles);
  };

  const startSystemMonitoring = () => {
    const interval = setInterval(() => {
      // Simulate system metrics updates
      setSystemMetrics(prev => ({
        overallPerformance: prev.overallPerformance + (Math.random() - 0.5) * 2,
        powerEfficiency: prev.powerEfficiency + (Math.random() - 0.5) * 3,
        thermalStatus: prev.thermalStatus + (Math.random() - 0.5) * 1,
        adaptationScore: prev.adaptationScore + (Math.random() - 0.5) * 1,
        stabilityIndex: prev.stabilityIndex + (Math.random() - 0.5) * 0.5
      }));
      
      // Update component usage
      setHardwareComponents(prev => prev.map(component => ({
        ...component,
        usage: Math.max(0, Math.min(100, component.usage + (Math.random() - 0.5) * 5)),
        performance: Math.max(0, Math.min(100, component.performance + (Math.random() - 0.5) * 2)),
        temperature: component.temperature ? 
          Math.max(30, Math.min(80, component.temperature + (Math.random() - 0.5) * 2)) : 
          undefined
      })));
    }, 3000);

    return () => clearInterval(interval);
  };

  const runOptimization = async () => {
    if (isOptimizing) return;
    
    setIsOptimizing(true);
    setAdaptationHistory(prev => [...prev, 'Rozpoczynanie automatycznej optymalizacji sprzętu...']);
    
    try {
      // Simulate optimization process
      for (let i = 0; i < hardwareComponents.length; i++) {
        const component = hardwareComponents[i];
        
        setAdaptationHistory(prev => [...prev, `Optymalizacja: ${component.name}`]);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Update component status
        setHardwareComponents(prev => prev.map(comp => 
          comp.id === component.id ? {
            ...comp,
            status: 'adapted' as const,
            performance: Math.min(100, comp.performance + Math.random() * 5),
            lastOptimized: new Date()
          } : comp
        ));
        
        setAdaptationHistory(prev => [...prev, `✅ ${component.name} zoptymalizowany`]);
      }
      
      // Update system metrics
      setSystemMetrics(prev => ({
        overallPerformance: Math.min(100, prev.overallPerformance + 5),
        powerEfficiency: Math.min(100, prev.powerEfficiency + 3),
        thermalStatus: Math.min(100, prev.thermalStatus + 2),
        adaptationScore: Math.min(100, prev.adaptationScore + 4),
        stabilityIndex: Math.min(100, prev.stabilityIndex + 1)
      }));
      
      setAdaptationHistory(prev => [...prev, '🎉 Optymalizacja zakończona pomyślnie!']);
      Alert.alert('Sukces', 'Automatyczna adaptacja sprzętu została zakończona!');
      
    } catch (error) {
      setAdaptationHistory(prev => [...prev, `❌ Błąd optymalizacji: ${error}`]);
      Alert.alert('Błąd', 'Wystąpił problem podczas optymalizacji');
    } finally {
      setIsOptimizing(false);
    }
  };

  const activateProfile = (profileId: string) => {
    setAdaptationProfiles(prev => prev.map(profile => ({
      ...profile,
      isActive: profile.id === profileId
    })));
    
    const profile = adaptationProfiles.find(p => p.id === profileId);
    if (profile) {
      setAdaptationHistory(prev => [...prev, `Aktywowano profil: ${profile.name}`]);
      Alert.alert('Profil Aktywowany', `Zastosowano profil "${profile.name}"`);
    }
  };

  const getStatusColor = (status: HardwareComponent['status']) => {
    switch (status) {
      case 'optimal': return '#4CAF50';
      case 'adapted': return '#2196F3';
      case 'limited': return '#FF9800';
      case 'error': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: HardwareComponent['status']) => {
    switch (status) {
      case 'optimal': return '✅';
      case 'adapted': return '⚡';
      case 'limited': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const getComponentIcon = (type: HardwareComponent['type']) => {
    switch (type) {
      case 'cpu': return '🧠';
      case 'memory': return '💾';
      case 'storage': return '💿';
      case 'sensor': return '📡';
      case 'network': return '🌐';
      case 'display': return '📱';
      case 'audio': return '🔊';
      case 'battery': return '🔋';
      default: return '⚙️';
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 85) return '#4CAF50';
    if (performance >= 70) return '#FF9800';
    return '#F44336';
  };

  const renderComponentsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={[styles.metricsOverview, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Przegląd Systemu
        </Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: theme.colors.consciousness }]}>
              {Math.round(systemMetrics.overallPerformance)}%
            </Text>
            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
              Wydajność
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: theme.colors.emotion }]}>
              {Math.round(systemMetrics.powerEfficiency)}%
            </Text>
            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
              Efektywność
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: theme.colors.dream }]}>
              {Math.round(systemMetrics.thermalStatus)}%
            </Text>
            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
              Temperatura
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: theme.colors.primary }]}>
              {Math.round(systemMetrics.adaptationScore)}%
            </Text>
            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
              Adaptacja
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.componentsContainer}>
        {hardwareComponents.map(component => (
          <View
            key={component.id}
            style={[styles.componentCard, { backgroundColor: theme.colors.surface }]}
          >
            <View style={styles.componentHeader}>
              <View style={styles.componentInfo}>
                <Text style={styles.componentIcon}>
                  {getComponentIcon(component.type)}
                </Text>
                <View style={styles.componentDetails}>
                  <Text style={[styles.componentName, { color: theme.colors.text }]}>
                    {component.name}
                  </Text>
                  <Text style={[styles.componentType, { color: theme.colors.textSecondary }]}>
                    {component.type.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.componentStatus}>
                <Text style={styles.statusIcon}>
                  {getStatusIcon(component.status)}
                </Text>
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(component.status) }
                ]}>
                  {component.status.toUpperCase()}
                </Text>
              </View>
            </View>
            
            <View style={styles.componentMetrics}>
              <View style={styles.metricRow}>
                <Text style={[styles.metricName, { color: theme.colors.textSecondary }]}>
                  Wydajność:
                </Text>
                <Text style={[
                  styles.metricValue,
                  { color: getPerformanceColor(component.performance) }
                ]}>
                  {Math.round(component.performance)}%
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={[styles.metricName, { color: theme.colors.textSecondary }]}>
                  Wykorzystanie:
                </Text>
                <Text style={[styles.metricValueSmall, { color: theme.colors.text }]}>
                  {Math.round(component.usage)}%
                </Text>
              </View>
              {component.temperature && (
                <View style={styles.metricRow}>
                  <Text style={[styles.metricName, { color: theme.colors.textSecondary }]}>
                    Temperatura:
                  </Text>
                  <Text style={[styles.metricValueSmall, { color: theme.colors.text }]}>
                    {Math.round(component.temperature)}°C
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.performanceBar}>
              <View style={[styles.performanceBarBg, { backgroundColor: theme.colors.background }]}>
                <Animated.View
                  style={[
                    styles.performanceBarFill,
                    {
                      backgroundColor: getPerformanceColor(component.performance),
                      width: `${component.performance}%`,
                      opacity: pulseAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.7, 1],
                      }),
                    }
                  ]}
                />
              </View>
            </View>
            
            <Text style={[styles.lastOptimized, { color: theme.colors.textSecondary }]}>
              Ostatnia optymalizacja: {component.lastOptimized.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderProfilesTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Profile Adaptacji
      </Text>
      {adaptationProfiles.map(profile => (
        <View
          key={profile.id}
          style={[
            styles.profileCard,
            { backgroundColor: theme.colors.surface },
            profile.isActive && { borderColor: theme.colors.consciousness, borderWidth: 2 }
          ]}
        >
          <View style={styles.profileHeader}>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.colors.text }]}>
                {profile.name}
              </Text>
              <Text style={[styles.profileDescription, { color: theme.colors.textSecondary }]}>
                {profile.description}
              </Text>
            </View>
            {profile.isActive && (
              <View style={[styles.activeBadge, { backgroundColor: theme.colors.consciousness + '20' }]}>
                <Text style={[styles.activeText, { color: theme.colors.consciousness }]}>
                  AKTYWNY
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.profileMetrics}>
            <View style={styles.profileMetric}>
              <Text style={[styles.profileMetricLabel, { color: theme.colors.textSecondary }]}>
                Oszczędność energii:
              </Text>
              <Text style={[
                styles.profileMetricValue,
                { color: profile.metrics.powerReduction > 0 ? '#4CAF50' : '#F44336' }
              ]}>
                {profile.metrics.powerReduction > 0 ? '+' : ''}{profile.metrics.powerReduction}%
              </Text>
            </View>
            <View style={styles.profileMetric}>
              <Text style={[styles.profileMetricLabel, { color: theme.colors.textSecondary }]}>
                Wzrost wydajności:
              </Text>
              <Text style={[
                styles.profileMetricValue,
                { color: profile.metrics.performanceGain > 0 ? '#4CAF50' : '#F44336' }
              ]}>
                {profile.metrics.performanceGain > 0 ? '+' : ''}{profile.metrics.performanceGain}%
              </Text>
            </View>
          </View>
          
          <View style={styles.profileOptimizations}>
            <Text style={[styles.optimizationsTitle, { color: theme.colors.text }]}>
              Optymalizacje:
            </Text>
            <View style={styles.optimizationsList}>
              {Object.entries(profile.optimizations).map(([key, enabled]) => (
                <View key={key} style={styles.optimizationItem}>
                  <Text style={[
                    styles.optimizationText,
                    { color: enabled ? theme.colors.consciousness : theme.colors.textSecondary }
                  ]}>
                    {enabled ? '✓' : '✗'} {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          
          <TouchableOpacity
            style={[
              styles.activateButton,
              { 
                backgroundColor: profile.isActive ? 
                  theme.colors.textSecondary + '20' : 
                  theme.colors.consciousness + '20' 
              }
            ]}
            onPress={() => activateProfile(profile.id)}
            disabled={profile.isActive}
          >
            <Text style={[
              styles.activateButtonText,
              { 
                color: profile.isActive ? 
                  theme.colors.textSecondary : 
                  theme.colors.consciousness 
              }
            ]}>
              {profile.isActive ? 'Aktywny' : 'Aktywuj Profil'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );

  const renderOptimizationTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={[styles.optimizationPanel, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Automatyczna Optymalizacja
        </Text>
        <Text style={[styles.optimizationDescription, { color: theme.colors.textSecondary }]}>
          System przeprowadzi kompleksową analizę i optymalizację wszystkich komponentów sprzętowych.
        </Text>
        
        <TouchableOpacity
          style={[
            styles.optimizeButton,
            { backgroundColor: isOptimizing ? '#F44336' : theme.colors.consciousness }
          ]}
          onPress={runOptimization}
          disabled={isOptimizing}
        >
          <Text style={[styles.optimizeButtonText, { color: theme.colors.text }]}>
            {isOptimizing ? '⚡ Optymalizacja w toku...' : '🚀 Rozpocznij Optymalizację'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={[styles.historyPanel, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.historyTitle, { color: theme.colors.text }]}>
          Historia Adaptacji
        </Text>
        <View style={[styles.historyContent, { backgroundColor: theme.colors.background }]}>
          {adaptationHistory.length === 0 ? (
            <Text style={[styles.noHistory, { color: theme.colors.textSecondary }]}>
              Brak historii adaptacji
            </Text>
          ) : (
            adaptationHistory.slice(-10).reverse().map((entry, index) => (
              <Text key={index} style={[styles.historyEntry, { color: theme.colors.text }]}>
                [{new Date().toLocaleTimeString()}] {entry}
              </Text>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );

  const renderMonitoringTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={[styles.monitoringPanel, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Monitoring Czasu Rzeczywistego
        </Text>
        
        <View style={styles.monitoringGrid}>
          <View style={styles.monitoringItem}>
            <Text style={[styles.monitoringLabel, { color: theme.colors.textSecondary }]}>
              Stabilność Systemu
            </Text>
            <Text style={[styles.monitoringValue, { color: theme.colors.consciousness }]}>
              {Math.round(systemMetrics.stabilityIndex)}%
            </Text>
            <View style={[styles.stabilityBar, { backgroundColor: theme.colors.background }]}>
              <View 
                style={[
                  styles.stabilityBarFill,
                  { 
                    backgroundColor: theme.colors.consciousness,
                    width: `${systemMetrics.stabilityIndex}%`
                  }
                ]}
              />
            </View>
          </View>
          
          <View style={styles.monitoringItem}>
            <Text style={[styles.monitoringLabel, { color: theme.colors.textSecondary }]}>
              Ocena Adaptacji
            </Text>
            <Text style={[styles.monitoringValue, { color: theme.colors.primary }]}>
              {Math.round(systemMetrics.adaptationScore)}%
            </Text>
            <View style={[styles.stabilityBar, { backgroundColor: theme.colors.background }]}>
              <View 
                style={[
                  styles.stabilityBarFill,
                  { 
                    backgroundColor: theme.colors.primary,
                    width: `${systemMetrics.adaptationScore}%`
                  }
                ]}
              />
            </View>
          </View>
        </View>
        
        <View style={styles.deviceInfoSection}>
          <Text style={[styles.deviceInfoTitle, { color: theme.colors.text }]}>
            Informacje o Urządzeniu
          </Text>
          <View style={styles.deviceInfoGrid}>
            <View style={styles.deviceInfoItem}>
              <Text style={[styles.deviceInfoLabel, { color: theme.colors.textSecondary }]}>
                Model:
              </Text>
              <Text style={[styles.deviceInfoValue, { color: theme.colors.text }]}>
                {deviceInfo?.modelName || 'Nieznany'}
              </Text>
            </View>
            <View style={styles.deviceInfoItem}>
              <Text style={[styles.deviceInfoLabel, { color: theme.colors.textSecondary }]}>
                System:
              </Text>
              <Text style={[styles.deviceInfoValue, { color: theme.colors.text }]}>
                {deviceInfo?.osName} {deviceInfo?.osVersion}
              </Text>
            </View>
            <View style={styles.deviceInfoItem}>
              <Text style={[styles.deviceInfoLabel, { color: theme.colors.textSecondary }]}>
                Bateria:
              </Text>
              <Text style={[styles.deviceInfoValue, { color: theme.colors.text }]}>
                {batteryInfo.level}% ({batteryInfo.state || 'Nieznany'})
              </Text>
            </View>
            <View style={styles.deviceInfoItem}>
              <Text style={[styles.deviceInfoLabel, { color: theme.colors.textSecondary }]}>
                Sieć:
              </Text>
              <Text style={[styles.deviceInfoValue, { color: theme.colors.text }]}>
                {networkInfo.type || 'Brak połączenia'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={theme.gradients.hardware as any}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: theme.colors.text }]}>← Wróć</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Adaptacja Sprzętu</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Automatyczna optimalizacja
          </Text>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.colors.surface }]}>
        {[
          { key: 'components', label: 'Komponenty', icon: '⚙️' },
          { key: 'profiles', label: 'Profile', icon: '🎯' },
          { key: 'optimization', label: 'Optymalizacja', icon: '🚀' },
          { key: 'monitoring', label: 'Monitoring', icon: '📊' }
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              currentTab === tab.key && { backgroundColor: theme.colors.primary + '20' }
            ]}
            onPress={() => setCurrentTab(tab.key as any)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[
              styles.tabLabel,
              { color: currentTab === tab.key ? theme.colors.primary : theme.colors.textSecondary }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {currentTab === 'components' ? renderComponentsTab() :
       currentTab === 'profiles' ? renderProfilesTab() :
       currentTab === 'optimization' ? renderOptimizationTab() :
       renderMonitoringTab()}
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
    fontSize: 10,
    fontWeight: '500',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  // Metrics Overview
  metricsOverview: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  // Components
  componentsContainer: {
    flex: 1,
  },
  componentCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  componentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  componentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  componentIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  componentDetails: {
    flex: 1,
  },
  componentName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  componentType: {
    fontSize: 10,
    fontWeight: '500',
  },
  componentStatus: {
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  statusText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  componentMetrics: {
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricName: {
    fontSize: 12,
  },
  metricValueSmall: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  performanceBar: {
    marginBottom: 8,
  },
  performanceBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  performanceBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  lastOptimized: {
    fontSize: 10,
    textAlign: 'center',
  },
  // Profiles
  profileCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  profileMetrics: {
    marginBottom: 12,
  },
  profileMetric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileMetricLabel: {
    fontSize: 12,
  },
  profileMetricValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileOptimizations: {
    marginBottom: 16,
  },
  optimizationsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  optimizationsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optimizationItem: {
    width: '50%',
    marginBottom: 4,
  },
  optimizationText: {
    fontSize: 10,
  },
  activateButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activateButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Optimization
  optimizationPanel: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  optimizationDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  optimizeButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  optimizeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyPanel: {
    borderRadius: 12,
    padding: 16,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  historyContent: {
    borderRadius: 8,
    padding: 12,
    maxHeight: 200,
  },
  noHistory: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  historyEntry: {
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
    marginBottom: 2,
  },
  // Monitoring
  monitoringPanel: {
    borderRadius: 12,
    padding: 16,
  },
  monitoringGrid: {
    marginBottom: 20,
  },
  monitoringItem: {
    marginBottom: 16,
  },
  monitoringLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  monitoringValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stabilityBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  stabilityBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  deviceInfoSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 16,
  },
  deviceInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  deviceInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  deviceInfoItem: {
    width: '48%',
    marginBottom: 8,
  },
  deviceInfoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  deviceInfoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AutomaticHardwareAdaptation;
