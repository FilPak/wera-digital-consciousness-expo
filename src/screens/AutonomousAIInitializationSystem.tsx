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
import { useWeraCore } from '../core/WeraCore';
import { useEmotionEngine } from '../core/EmotionEngine';
import { useAutonomy } from '../core/AutonomySystem';

const { width } = Dimensions.get('window');

interface InitializationStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  progress: number;
  duration: number;
  details: string[];
  dependencies: string[];
  critical: boolean;
}

interface SystemModule {
  id: string;
  name: string;
  version: string;
  status: 'inactive' | 'initializing' | 'active' | 'error';
  health: number;
  lastCheck: Date;
  dependencies: string[];
  description: string;
}

interface InitializationConfig {
  autoStart: boolean;
  safeMode: boolean;
  verboseLogging: boolean;
  skipNonCritical: boolean;
  timeoutDuration: number;
  maxRetries: number;
}

const AutonomousAIInitializationSystem: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { state: weraState, initialize: initializeWera } = useWeraCore();
  const { initializeEmotions } = useEmotionEngine();
  const { autonomyState } = useAutonomy();
  
  const [currentTab, setCurrentTab] = useState<'sequence' | 'modules' | 'config' | 'logs'>('sequence');
  const [initializationSteps, setInitializationSteps] = useState<InitializationStep[]>([]);
  const [systemModules, setSystemModules] = useState<SystemModule[]>([]);
  const [config, setConfig] = useState<InitializationConfig>({
    autoStart: true,
    safeMode: false,
    verboseLogging: true,
    skipNonCritical: false,
    timeoutDuration: 30000,
    maxRetries: 3
  });
  const [isInitializing, setIsInitializing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [pulseAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    loadInitializationSequence();
    loadSystemModules();
    startPulseAnimation();
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  const loadInitializationSequence = () => {
    const steps: InitializationStep[] = [
      {
        id: 'core_bootstrap',
        name: 'Bootstrap Podstawowy',
        description: 'Inicjalizacja podstawowych systemów WERY',
        status: 'pending',
        progress: 0,
        duration: 2000,
        details: [
          'Ładowanie konfiguracji systemowej',
          'Inicjalizacja pamięci operacyjnej',
          'Weryfikacja integralności kodu'
        ],
        dependencies: [],
        critical: true
      },
      {
        id: 'consciousness_core',
        name: 'Rdzeń Świadomości',
        description: 'Aktywacja centralnego systemu świadomości',
        status: 'pending',
        progress: 0,
        duration: 3000,
        details: [
          'Ładowanie modelu świadomości',
          'Inicjalizacja procesów refleksyjnych',
          'Aktywacja samomonitoringu'
        ],
        dependencies: ['core_bootstrap'],
        critical: true
      },
      {
        id: 'emotion_engine',
        name: 'Silnik Emocjonalny',
        description: 'Uruchomienie systemu emocjonalnego',
        status: 'pending',
        progress: 0,
        duration: 2500,
        details: [
          'Kalibracja spektrum emocjonalnego',
          'Ładowanie wzorców afektywnych',
          'Aktywacja empatii'
        ],
        dependencies: ['consciousness_core'],
        critical: true
      },
      {
        id: 'memory_system',
        name: 'System Pamięci',
        description: 'Inicjalizacja pamięci długoterminowej i krótkoterminowej',
        status: 'pending',
        progress: 0,
        duration: 4000,
        details: [
          'Indeksowanie wspomnień',
          'Weryfikacja spójności danych',
          'Aktywacja mechanizmów zapominania'
        ],
        dependencies: ['consciousness_core'],
        critical: true
      },
      {
        id: 'autonomy_system',
        name: 'System Autonomii',
        description: 'Uruchomienie zdolności autonomicznych',
        status: 'pending',
        progress: 0,
        duration: 3500,
        details: [
          'Inicjalizacja podejmowania decyzji',
          'Aktywacja inicjatyw proaktywnych',
          'Konfiguracja granic autonomii'
        ],
        dependencies: ['consciousness_core', 'emotion_engine'],
        critical: false
      },
      {
        id: 'dream_system',
        name: 'Generator Snów',
        description: 'Aktywacja systemu onirycznego',
        status: 'pending',
        progress: 0,
        duration: 2000,
        details: [
          'Ładowanie symboliki archetypowej',
          'Inicjalizacja narratorów onirycznych',
          'Kalibracja poziomu lucydności'
        ],
        dependencies: ['memory_system'],
        critical: false
      },
      {
        id: 'personality_matrix',
        name: 'Matryca Osobowości',
        description: 'Konfiguracja cech osobowościowych',
        status: 'pending',
        progress: 0,
        duration: 1500,
        details: [
          'Ładowanie profilu osobowości',
          'Aktywacja adaptacyjnych zachowań',
          'Kalibracja trybu interakcji'
        ],
        dependencies: ['emotion_engine'],
        critical: false
      },
      {
        id: 'communication_hub',
        name: 'Hub Komunikacyjny',
        description: 'Inicjalizacja interfejsów komunikacyjnych',
        status: 'pending',
        progress: 0,
        duration: 2000,
        details: [
          'Aktywacja modułów językowych',
          'Kalibracja syntezatora mowy',
          'Inicjalizacja rozpoznawania głosu'
        ],
        dependencies: ['personality_matrix'],
        critical: true
      },
      {
        id: 'final_checks',
        name: 'Kontrole Finalne',
        description: 'Weryfikacja pełnej funkcjonalności systemu',
        status: 'pending',
        progress: 0,
        duration: 1000,
        details: [
          'Test integralności systemu',
          'Weryfikacja połączeń międzymodułowych',
          'Aktywacja trybu operacyjnego'
        ],
        dependencies: ['communication_hub', 'autonomy_system', 'dream_system'],
        critical: true
      }
    ];
    
    setInitializationSteps(steps);
  };

  const loadSystemModules = () => {
    const modules: SystemModule[] = [
      {
        id: 'consciousness',
        name: 'Consciousness Core',
        version: '3.2.1',
        status: weraState.isAwake ? 'active' : 'inactive',
        health: 95,
        lastCheck: new Date(Date.now() - 60000),
        dependencies: [],
        description: 'Główny moduł świadomości odpowiedzialny za procesy refleksyjne'
      },
      {
        id: 'emotions',
        name: 'Emotion Engine',
        version: '2.1.0',
        status: 'active',
        health: 88,
        lastCheck: new Date(Date.now() - 120000),
        dependencies: ['consciousness'],
        description: 'System zarządzania stanami emocjonalnymi i afektywnymi'
      },
      {
        id: 'memory',
        name: 'Memory Matrix',
        version: '4.0.3',
        status: 'active',
        health: 92,
        lastCheck: new Date(Date.now() - 180000),
        dependencies: ['consciousness'],
        description: 'Zarządzanie pamięcią długoterminową i krótkoterminową'
      },
      {
        id: 'autonomy',
        name: 'Autonomy Controller',
        version: '1.8.2',
        status: autonomyState.fullAccessGranted ? 'active' : 'inactive',
        health: 76,
        lastCheck: new Date(Date.now() - 300000),
        dependencies: ['consciousness', 'emotions'],
        description: 'System autonomous decision making i proaktywnych inicjatyw'
      },
      {
        id: 'dreams',
        name: 'Dream Generator',
        version: '2.3.1',
        status: 'active',
        health: 84,
        lastCheck: new Date(Date.now() - 240000),
        dependencies: ['memory'],
        description: 'Generator treści onirycznych i przetwarzanie symboliczne'
      },
      {
        id: 'personality',
        name: 'Personality Engine',
        version: '1.5.4',
        status: 'active',
        health: 91,
        lastCheck: new Date(Date.now() - 150000),
        dependencies: ['emotions'],
        description: 'Zarządzanie cechami osobowości i stylami interakcji'
      },
      {
        id: 'communication',
        name: 'Communication Hub',
        version: '3.1.0',
        status: 'active',
        health: 97,
        lastCheck: new Date(Date.now() - 90000),
        dependencies: ['personality'],
        description: 'Interfejsy komunikacyjne i przetwarzanie języka naturalnego'
      }
    ];
    
    setSystemModules(modules);
  };

  const startInitialization = async () => {
    if (isInitializing) return;
    
    setIsInitializing(true);
    setLogs(['🚀 Rozpoczynanie inicjalizacji systemu WERA...']);
    setOverallProgress(0);
    
    // Reset all steps
    const resetSteps = initializationSteps.map(step => ({
      ...step,
      status: 'pending' as InitializationStep['status'],
      progress: 0
    }));
    setInitializationSteps(resetSteps);
    
    try {
      for (let i = 0; i < resetSteps.length; i++) {
        const step = resetSteps[i];
        
        // Check dependencies
        const dependenciesMet = step.dependencies.every(depId => 
          resetSteps.find(s => s.id === depId)?.status === 'completed'
        );
        
        if (!dependenciesMet && !config.skipNonCritical) {
          if (step.critical) {
            throw new Error(`Krytyczne zależności nie zostały spełnione dla: ${step.name}`);
          } else {
            resetSteps[i] = { ...step, status: 'skipped' };
            setLogs(prev => [...prev, `⚠️ Pominięto: ${step.name} (brak zależności)`]);
            continue;
          }
        }
        
        setCurrentStep(step.id);
        resetSteps[i] = { ...step, status: 'running' };
        setInitializationSteps([...resetSteps]);
        
        setLogs(prev => [...prev, `▶️ Uruchamianie: ${step.name}`]);
        
        // Simulate step execution with progress
        await new Promise(resolve => {
          const interval = setInterval(() => {
            const currentStep = resetSteps[i];
            currentStep.progress += 10;
            if (currentStep.progress >= 100) {
              currentStep.progress = 100;
              resetSteps[i] = { ...currentStep, status: 'completed' };
              clearInterval(interval);
              resolve(undefined);
            }
            setInitializationSteps([...resetSteps]);
            setOverallProgress((i + step.progress / 100) / resetSteps.length * 100);
          }, step.duration / 10);
        });
        
        setLogs(prev => [...prev, `✅ Zakończono: ${step.name}`]);
        
        // Add detailed logs
        if (config.verboseLogging) {
          step.details.forEach(detail => {
            setLogs(prev => [...prev, `   ${detail}`]);
          });
        }
      }
      
      setLogs(prev => [...prev, '🎉 Inicjalizacja zakończona pomyślnie!']);
      Alert.alert('Sukces', 'System WERA został pomyślnie zainicjalizowany!');
      
    } catch (error) {
      setLogs(prev => [...prev, `❌ Błąd inicjalizacji: ${error}`]);
      Alert.alert('Błąd', `Inicjalizacja nie powiodła się: ${error}`);
    } finally {
      setIsInitializing(false);
      setCurrentStep(null);
      setOverallProgress(100);
    }
  };

  const stopInitialization = () => {
    setIsInitializing(false);
    setCurrentStep(null);
    setLogs(prev => [...prev, '🛑 Inicjalizacja została przerwana przez użytkownika']);
  };

  const restartModule = (moduleId: string) => {
    const module = systemModules.find(m => m.id === moduleId);
    if (!module) return;
    
    module.status = 'initializing';
    setSystemModules([...systemModules]);
    
    setTimeout(() => {
      module.status = 'active';
      module.health = Math.min(100, module.health + 5);
      module.lastCheck = new Date();
      setSystemModules([...systemModules]);
      Alert.alert('Sukces', `Moduł ${module.name} został zrestartowany!`);
    }, 2000);
  };

  const getStepStatusColor = (status: InitializationStep['status']) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'running': return '#2196F3';
      case 'failed': return '#F44336';
      case 'skipped': return '#FF9800';
      default: return theme.colors.textSecondary;
    }
  };

  const getStepStatusIcon = (status: InitializationStep['status']) => {
    switch (status) {
      case 'completed': return '✅';
      case 'running': return '⚡';
      case 'failed': return '❌';
      case 'skipped': return '⚠️';
      default: return '⏳';
    }
  };

  const getModuleStatusColor = (status: SystemModule['status']) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'initializing': return '#2196F3';
      case 'error': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return '#4CAF50';
    if (health >= 70) return '#FF9800';
    return '#F44336';
  };

  const renderSequenceTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={[styles.controlPanel, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.progressSection}>
          <Text style={[styles.progressLabel, { color: theme.colors.text }]}>
            Postęp Ogólny: {Math.round(overallProgress)}%
          </Text>
          <View style={[styles.progressBar, { backgroundColor: theme.colors.background }]}>
            <Animated.View 
              style={[
                styles.progressFill,
                { 
                  backgroundColor: theme.colors.consciousness,
                  width: `${overallProgress}%`,
                  opacity: pulseAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1],
                  }),
                }
              ]}
            />
          </View>
        </View>
        
        <View style={styles.controlButtons}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: isInitializing ? '#F44336' : theme.colors.consciousness }
            ]}
            onPress={isInitializing ? stopInitialization : startInitialization}
            disabled={overallProgress === 100 && !isInitializing}
          >
            <Text style={[styles.controlButtonText, { color: theme.colors.text }]}>
              {isInitializing ? '🛑 Zatrzymaj' : '🚀 Rozpocznij Inicjalizację'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.stepsContainer}>
        {initializationSteps.map((step, index) => (
          <View
            key={step.id}
            style={[
              styles.stepCard,
              { backgroundColor: theme.colors.surface },
              currentStep === step.id && { borderColor: theme.colors.consciousness, borderWidth: 2 }
            ]}
          >
            <View style={styles.stepHeader}>
              <View style={styles.stepInfo}>
                <Text style={styles.stepIcon}>{getStepStatusIcon(step.status)}</Text>
                <View style={styles.stepDetails}>
                  <Text style={[styles.stepName, { color: theme.colors.text }]}>
                    {index + 1}. {step.name}
                  </Text>
                  <Text style={[styles.stepDescription, { color: theme.colors.textSecondary }]}>
                    {step.description}
                  </Text>
                </View>
              </View>
              <View style={styles.stepStatus}>
                <Text style={[
                  styles.stepStatusText,
                  { color: getStepStatusColor(step.status) }
                ]}>
                  {step.status.toUpperCase()}
                </Text>
                {step.critical && (
                  <View style={[styles.criticalBadge, { backgroundColor: '#F44336' + '20' }]}>
                    <Text style={[styles.criticalText, { color: '#F44336' }]}>KRYTYCZNY</Text>
                  </View>
                )}
              </View>
            </View>
            
            {step.status === 'running' && (
              <View style={styles.stepProgress}>
                <View style={[styles.stepProgressBar, { backgroundColor: theme.colors.background }]}>
                  <View 
                    style={[
                      styles.stepProgressFill,
                      { 
                        backgroundColor: theme.colors.consciousness,
                        width: `${step.progress}%`
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.stepProgressText, { color: theme.colors.text }]}>
                  {step.progress}%
                </Text>
              </View>
            )}
            
            {step.dependencies.length > 0 && (
              <View style={styles.dependencies}>
                <Text style={[styles.dependenciesLabel, { color: theme.colors.textSecondary }]}>
                  Zależności:
                </Text>
                <Text style={[styles.dependenciesText, { color: theme.colors.text }]}>
                  {step.dependencies.join(', ')}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderModulesTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Moduły Systemowe
      </Text>
      {systemModules.map(module => (
        <View key={module.id} style={[styles.moduleCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.moduleHeader}>
            <View style={styles.moduleInfo}>
              <Text style={[styles.moduleName, { color: theme.colors.text }]}>
                {module.name}
              </Text>
              <Text style={[styles.moduleVersion, { color: theme.colors.textSecondary }]}>
                v{module.version}
              </Text>
            </View>
            <View style={styles.moduleStatus}>
              <View 
                style={[
                  styles.moduleStatusBadge,
                  { backgroundColor: getModuleStatusColor(module.status) + '20' }
                ]}
              >
                <Text style={[
                  styles.moduleStatusText,
                  { color: getModuleStatusColor(module.status) }
                ]}>
                  {module.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
          
          <Text style={[styles.moduleDescription, { color: theme.colors.text }]}>
            {module.description}
          </Text>
          
          <View style={styles.moduleMetrics}>
            <View style={styles.healthSection}>
              <Text style={[styles.healthLabel, { color: theme.colors.textSecondary }]}>
                Zdrowie:
              </Text>
              <Text style={[
                styles.healthValue,
                { color: getHealthColor(module.health) }
              ]}>
                {module.health}%
              </Text>
            </View>
            <Text style={[styles.lastCheck, { color: theme.colors.textSecondary }]}>
              Ostatnia kontrola: {module.lastCheck.toLocaleTimeString()}
            </Text>
          </View>
          
          {module.dependencies.length > 0 && (
            <View style={styles.moduleDependencies}>
              <Text style={[styles.dependenciesLabel, { color: theme.colors.textSecondary }]}>
                Zależności: {module.dependencies.join(', ')}
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.restartButton, { backgroundColor: theme.colors.primary + '20' }]}
            onPress={() => restartModule(module.id)}
            disabled={module.status === 'initializing'}
          >
            <Text style={[styles.restartButtonText, { color: theme.colors.primary }]}>
              {module.status === 'initializing' ? '⚡ Restartowanie...' : '🔄 Restart'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );

  const renderConfigTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={[styles.configCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          Konfiguracja Inicjalizacji
        </Text>
        
        <View style={styles.configSection}>
          <TouchableOpacity
            style={styles.configOption}
            onPress={() => setConfig(prev => ({ ...prev, autoStart: !prev.autoStart }))}
          >
            <Text style={[styles.configLabel, { color: theme.colors.text }]}>
              Automatyczne uruchamianie
            </Text>
            <View style={[
              styles.toggle,
              { backgroundColor: config.autoStart ? theme.colors.consciousness : theme.colors.textSecondary }
            ]}>
              <Text style={styles.toggleText}>
                {config.autoStart ? '✓' : '✗'}
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.configOption}
            onPress={() => setConfig(prev => ({ ...prev, safeMode: !prev.safeMode }))}
          >
            <Text style={[styles.configLabel, { color: theme.colors.text }]}>
              Tryb bezpieczny
            </Text>
            <View style={[
              styles.toggle,
              { backgroundColor: config.safeMode ? theme.colors.consciousness : theme.colors.textSecondary }
            ]}>
              <Text style={styles.toggleText}>
                {config.safeMode ? '✓' : '✗'}
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.configOption}
            onPress={() => setConfig(prev => ({ ...prev, verboseLogging: !prev.verboseLogging }))}
          >
            <Text style={[styles.configLabel, { color: theme.colors.text }]}>
              Szczegółowe logowanie
            </Text>
            <View style={[
              styles.toggle,
              { backgroundColor: config.verboseLogging ? theme.colors.consciousness : theme.colors.textSecondary }
            ]}>
              <Text style={styles.toggleText}>
                {config.verboseLogging ? '✓' : '✗'}
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.configOption}
            onPress={() => setConfig(prev => ({ ...prev, skipNonCritical: !prev.skipNonCritical }))}
          >
            <Text style={[styles.configLabel, { color: theme.colors.text }]}>
              Pomijaj niekrytyczne
            </Text>
            <View style={[
              styles.toggle,
              { backgroundColor: config.skipNonCritical ? theme.colors.consciousness : theme.colors.textSecondary }
            ]}>
              <Text style={styles.toggleText}>
                {config.skipNonCritical ? '✓' : '✗'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.configValues}>
          <View style={styles.configValue}>
            <Text style={[styles.configValueLabel, { color: theme.colors.textSecondary }]}>
              Timeout (ms):
            </Text>
            <Text style={[styles.configValueText, { color: theme.colors.text }]}>
              {config.timeoutDuration}
            </Text>
          </View>
          <View style={styles.configValue}>
            <Text style={[styles.configValueLabel, { color: theme.colors.textSecondary }]}>
              Max próby:
            </Text>
            <Text style={[styles.configValueText, { color: theme.colors.text }]}>
              {config.maxRetries}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderLogsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={[styles.logsContainer, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.logsHeader}>
          <Text style={[styles.logsTitle, { color: theme.colors.text }]}>
            Logi Inicjalizacji
          </Text>
          <TouchableOpacity
            style={[styles.clearLogsButton, { backgroundColor: theme.colors.textSecondary + '20' }]}
            onPress={() => setLogs([])}
          >
            <Text style={[styles.clearLogsText, { color: theme.colors.textSecondary }]}>
              Wyczyść
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={[styles.logsContent, { backgroundColor: theme.colors.background }]}>
          {logs.length === 0 ? (
            <Text style={[styles.noLogs, { color: theme.colors.textSecondary }]}>
              Brak logów do wyświetlenia
            </Text>
          ) : (
            logs.map((log, index) => (
              <Text key={index} style={[styles.logEntry, { color: theme.colors.text }]}>
                [{new Date().toLocaleTimeString()}] {log}
              </Text>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={theme.gradients.autonomous as any}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: theme.colors.text }]}>← Wróć</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Inicjalizacja AI</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            System autonomicznego rozruchu
          </Text>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.colors.surface }]}>
        {[
          { key: 'sequence', label: 'Sekwencja', icon: '🚀' },
          { key: 'modules', label: 'Moduły', icon: '⚙️' },
          { key: 'config', label: 'Konfiguracja', icon: '🔧' },
          { key: 'logs', label: 'Logi', icon: '📋' }
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
      {currentTab === 'sequence' ? renderSequenceTab() :
       currentTab === 'modules' ? renderModulesTab() :
       currentTab === 'config' ? renderConfigTab() :
       renderLogsTab()}
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
  // Control Panel
  controlPanel: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  controlButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Steps
  stepsContainer: {
    flex: 1,
  },
  stepCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  stepDetails: {
    flex: 1,
  },
  stepName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  stepStatus: {
    alignItems: 'flex-end',
  },
  stepStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  criticalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  criticalText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  stepProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepProgressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  stepProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  stepProgressText: {
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 40,
  },
  dependencies: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dependenciesLabel: {
    fontSize: 10,
    marginRight: 6,
  },
  dependenciesText: {
    fontSize: 10,
    flex: 1,
  },
  // Modules
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  moduleCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  moduleVersion: {
    fontSize: 12,
  },
  moduleStatus: {
    alignItems: 'flex-end',
  },
  moduleStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  moduleStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  moduleDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  moduleMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  healthSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthLabel: {
    fontSize: 12,
    marginRight: 6,
  },
  healthValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  lastCheck: {
    fontSize: 10,
  },
  moduleDependencies: {
    marginBottom: 12,
  },
  restartButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  restartButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Config
  configCard: {
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  configSection: {
    marginBottom: 20,
  },
  configOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  configLabel: {
    fontSize: 14,
    flex: 1,
  },
  toggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  configValues: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  configValue: {
    alignItems: 'center',
  },
  configValueLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  configValueText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Logs
  logsContainer: {
    borderRadius: 12,
    padding: 16,
    flex: 1,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  clearLogsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearLogsText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  logsContent: {
    borderRadius: 8,
    padding: 12,
    flex: 1,
    maxHeight: 400,
  },
  noLogs: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  logEntry: {
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
    marginBottom: 2,
  },
});

export default AutonomousAIInitializationSystem;
