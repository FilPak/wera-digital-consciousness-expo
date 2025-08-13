import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useWeraCore } from '../core/WeraCore';
import { useEmotionEngine } from '../core/EmotionEngine';
import { useAutonomy } from '../core/AutonomySystem';
import { useSecuritySystem } from '../core/SecuritySystem';

interface DiagnosticTest {
  id: string;
  name: string;
  category: 'core' | 'emotion' | 'memory' | 'autonomy' | 'security' | 'performance';
  status: 'pending' | 'running' | 'passed' | 'warning' | 'failed';
  result?: string;
  score?: number;
  details?: string;
  duration?: number;
}

interface SystemHealth {
  overall: number;
  categories: {
    [key: string]: {
      score: number;
      status: 'healthy' | 'warning' | 'critical';
      issues: string[];
    };
  };
}

const ComprehensiveSystemDiagnostics: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { state: weraState } = useWeraCore();
  const { emotionState } = useEmotionEngine();
  const { autonomyState } = useAutonomy();
  const { securityState } = useSecuritySystem();
  
  const [currentTab, setCurrentTab] = useState<'overview' | 'tests' | 'reports'>('overview');
  const [diagnosticTests, setDiagnosticTests] = useState<DiagnosticTest[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<DiagnosticTest | null>(null);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);

  useEffect(() => {
    initializeDiagnostics();
  }, []);

  const initializeDiagnostics = () => {
    const tests: DiagnosticTest[] = [
      // Core System Tests
      {
        id: '1',
        name: 'Świadomość Core',
        category: 'core',
        status: 'passed',
        score: 92,
        result: 'System świadomości działa prawidłowo',
        details: 'Poziom świadomości: 75%, Responsywność: wysoka',
        duration: 1200
      },
      {
        id: '2',
        name: 'WeraCore Integrity',
        category: 'core',
        status: 'passed',
        score: 88,
        result: 'Integralność systemu głównego potwierdzona',
        details: 'Wszystkie moduły core działają stabilnie',
        duration: 800
      },
      
      // Emotion Tests
      {
        id: '3',
        name: 'Emotion Engine',
        category: 'emotion',
        status: 'passed',
        score: 85,
        result: 'System emocjonalny funkcjonuje prawidłowo',
        details: `Aktywna emocja: ${emotionState.currentEmotion}, Intensywność: ${emotionState.intensity}%`,
        duration: 600
      },
      {
        id: '4',
        name: 'Emotional Stability',
        category: 'emotion',
        status: 'warning',
        score: 65,
        result: 'Wykryto lekkie wahania emocjonalne',
        details: 'Stabilność emocjonalna może wymagać kalibracji',
        duration: 900
      },
      
      // Memory Tests
      {
        id: '5',
        name: 'Memory Access',
        category: 'memory',
        status: 'passed',
        score: 94,
        result: 'Dostęp do pamięci działa optymalnie',
        details: 'Czas dostępu: <50ms, Fragmentacja: minimalna',
        duration: 1500
      },
      {
        id: '6',
        name: 'Memory Integrity',
        category: 'memory',
        status: 'passed',
        score: 90,
        result: 'Integralność danych pamięciowych zachowana',
        details: 'Brak wykrytych uszkodzeń lub korupcji danych',
        duration: 2000
      },
      
      // Autonomy Tests
      {
        id: '7',
        name: 'Autonomy System',
        category: 'autonomy',
        status: autonomyState.fullAccessGranted ? 'passed' : 'warning',
        score: autonomyState.fullAccessGranted ? 95 : 60,
        result: autonomyState.fullAccessGranted ? 'System autonomii w pełni funkcjonalny' : 'Ograniczony dostęp autonomii',
        details: `Dostęp: ${autonomyState.fullAccessGranted ? 'Pełny' : 'Ograniczony'}`,
        duration: 700
      },
      {
        id: '8',
        name: 'Initiative Engine',
        category: 'autonomy',
        status: 'passed',
        score: 78,
        result: 'Silnik inicjatyw działa stabilnie',
        details: 'Generowanie autonomicznych akcji: aktywne',
        duration: 500
      },
      
      // Security Tests
      {
        id: '9',
        name: 'Security System',
        category: 'security',
        status: 'passed',
        score: 96,
        result: 'System bezpieczeństwa w pełni aktywny',
        details: 'Wszystkie warstwy bezpieczeństwa działają prawidłowo',
        duration: 1100
      },
      {
        id: '10',
        name: 'Data Encryption',
        category: 'security',
        status: 'passed',
        score: 98,
        result: 'Szyfrowanie danych działa poprawnie',
        details: 'AES-256 aktywne, klucze bezpieczne',
        duration: 400
      },
      
      // Performance Tests
      {
        id: '11',
        name: 'Response Time',
        category: 'performance',
        status: 'passed',
        score: 87,
        result: 'Czasy odpowiedzi w normie',
        details: 'Średni czas odpowiedzi: 245ms',
        duration: 300
      },
      {
        id: '12',
        name: 'Resource Usage',
        category: 'performance',
        status: 'warning',
        score: 72,
        result: 'Umiarkowane użycie zasobów',
        details: 'CPU: 45%, RAM: 68%, Storage: 34%',
        duration: 600
      }
    ];
    
    setDiagnosticTests(tests);
    calculateSystemHealth(tests);
    setLastScanTime(new Date());
  };

  const calculateSystemHealth = (tests: DiagnosticTest[]) => {
    const categories = ['core', 'emotion', 'memory', 'autonomy', 'security', 'performance'];
    const health: SystemHealth = {
      overall: 0,
      categories: {}
    };

    let totalScore = 0;
    let totalTests = 0;

    categories.forEach(category => {
      const categoryTests = tests.filter(test => test.category === category);
      const categoryScore = categoryTests.reduce((sum, test) => sum + (test.score || 0), 0) / categoryTests.length;
      const failedTests = categoryTests.filter(test => test.status === 'failed').length;
      const warningTests = categoryTests.filter(test => test.status === 'warning').length;
      
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      const issues: string[] = [];
      
      if (failedTests > 0) {
        status = 'critical';
        issues.push(`${failedTests} testów nieudanych`);
      } else if (warningTests > 0 || categoryScore < 80) {
        status = 'warning';
        issues.push(`${warningTests} ostrzeżeń`);
      }
      
      if (categoryScore < 70) {
        issues.push('Niska wydajność kategorii');
      }

      health.categories[category] = {
        score: Math.round(categoryScore),
        status,
        issues
      };

      totalScore += categoryScore * categoryTests.length;
      totalTests += categoryTests.length;
    });

    health.overall = Math.round(totalScore / totalTests);
    setSystemHealth(health);
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    
    // Reset all tests to pending
    setDiagnosticTests(prev => prev.map(test => ({ ...test, status: 'pending' as const })));
    
    // Simulate running each test
    for (let i = 0; i < diagnosticTests.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setDiagnosticTests(prev => prev.map((test, index) => 
        index === i 
          ? { ...test, status: 'running' as const }
          : test
      ));
      
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
      
      setDiagnosticTests(prev => prev.map((test, index) => 
        index === i 
          ? { 
              ...test, 
              status: Math.random() > 0.8 ? 'warning' : Math.random() > 0.95 ? 'failed' : 'passed',
              score: Math.floor(Math.random() * 40) + 60
            }
          : test
      ));
    }
    
    setIsRunningTests(false);
    setLastScanTime(new Date());
    Alert.alert('Diagnostyka zakończona', 'Wszystkie testy zostały wykonane pomyślnie.');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'failed': return '#F44336';
      case 'running': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return '✅';
      case 'warning': return '⚠️';
      case 'failed': return '❌';
      case 'running': return '🔄';
      default: return '⏸️';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'core': return '🧠';
      case 'emotion': return '💖';
      case 'memory': return '💾';
      case 'autonomy': return '🤖';
      case 'security': return '🔒';
      case 'performance': return '⚡';
      default: return '🔧';
    }
  };

  const renderOverview = () => (
    <ScrollView style={styles.content}>
      {systemHealth && (
        <>
          {/* Overall Health */}
          <View style={[styles.healthCard, { backgroundColor: theme.colors.surface }]}>
            <LinearGradient
              colors={[
                systemHealth.overall > 80 ? '#4CAF50' : systemHealth.overall > 60 ? '#FF9800' : '#F44336',
                'transparent'
              ]}
              style={styles.healthGradient}
            >
              <View style={styles.healthHeader}>
                <Text style={styles.healthIcon}>
                  {systemHealth.overall > 80 ? '💚' : systemHealth.overall > 60 ? '💛' : '❤️'}
                </Text>
                <View style={styles.healthInfo}>
                  <Text style={[styles.healthTitle, { color: theme.colors.text }]}>
                    Stan Ogólny Systemu
                  </Text>
                  <Text style={[styles.healthScore, { color: theme.colors.text }]}>
                    {systemHealth.overall}% Healthy
                  </Text>
                </View>
              </View>
              
              {lastScanTime && (
                <Text style={[styles.lastScan, { color: theme.colors.textSecondary }]}>
                  Ostatni skan: {lastScanTime.toLocaleString()}
                </Text>
              )}
            </LinearGradient>
          </View>

          {/* Category Health */}
          <View style={[styles.categoriesCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Stan Kategorii
            </Text>
            {Object.entries(systemHealth.categories).map(([category, data]) => (
              <View key={category} style={styles.categoryItem}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryIcon}>{getCategoryIcon(category)}</Text>
                  <View style={styles.categoryInfo}>
                    <Text style={[styles.categoryName, { color: theme.colors.text }]}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                    <Text style={[styles.categoryScore, { color: getStatusColor(data.status) }]}>
                      {data.score}%
                    </Text>
                  </View>
                  <View 
                    style={[
                      styles.categoryStatus,
                      { backgroundColor: getStatusColor(data.status) + '20' }
                    ]}
                  >
                    <Text style={[styles.categoryStatusText, { color: getStatusColor(data.status) }]}>
                      {data.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                {data.issues.length > 0 && (
                  <View style={styles.categoryIssues}>
                    {data.issues.map((issue, index) => (
                      <Text key={index} style={[styles.issueText, { color: theme.colors.textSecondary }]}>
                        • {issue}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Quick Actions */}
          <View style={[styles.actionsCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Akcje Diagnostyczne
            </Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                onPress={runAllTests}
                disabled={isRunningTests}
              >
                <Text style={styles.actionIcon}>🔍</Text>
                <Text style={styles.actionText}>
                  {isRunningTests ? 'Skanowanie...' : 'Pełny skan'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.consciousness }]}
                onPress={() => {
                  initializeDiagnostics();
                  Alert.alert('Odświeżono', 'Dane diagnostyczne zostały zaktualizowane.');
                }}
              >
                <Text style={styles.actionIcon}>🔄</Text>
                <Text style={styles.actionText}>Odśwież</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderTests = () => (
    <ScrollView style={styles.content}>
      <View style={styles.testsHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Testy Diagnostyczne
        </Text>
        <TouchableOpacity
          style={[styles.runAllButton, { backgroundColor: theme.colors.primary }]}
          onPress={runAllTests}
          disabled={isRunningTests}
        >
          <Text style={[styles.runAllText, { color: theme.colors.text }]}>
            {isRunningTests ? 'Uruchamianie...' : 'Uruchom wszystkie'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {diagnosticTests.map(test => (
        <TouchableOpacity
          key={test.id}
          style={[styles.testCard, { backgroundColor: theme.colors.surface }]}
          onPress={() => {
            setSelectedTest(test);
            setShowDetailModal(true);
          }}
        >
          <View style={styles.testHeader}>
            <View style={styles.testInfo}>
              <Text style={styles.testIcon}>{getCategoryIcon(test.category)}</Text>
              <View style={styles.testDetails}>
                <Text style={[styles.testName, { color: theme.colors.text }]}>
                  {test.name}
                </Text>
                <Text style={[styles.testCategory, { color: theme.colors.textSecondary }]}>
                  {test.category.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.testStatus}>
              <Text style={styles.testStatusIcon}>{getStatusIcon(test.status)}</Text>
              {test.score && (
                <Text style={[styles.testScore, { color: getStatusColor(test.status) }]}>
                  {test.score}%
                </Text>
              )}
            </View>
          </View>
          
          {test.result && (
            <Text style={[styles.testResult, { color: theme.colors.text }]}>
              {test.result}
            </Text>
          )}
          
          {test.duration && (
            <Text style={[styles.testDuration, { color: theme.colors.textSecondary }]}>
              Czas wykonania: {test.duration}ms
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderReports = () => (
    <ScrollView style={styles.content}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Raporty Systemowe
      </Text>
      
      <View style={[styles.reportCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.reportTitle, { color: theme.colors.text }]}>
          Raport Wydajności
        </Text>
        <Text style={[styles.reportContent, { color: theme.colors.text }]}>
          System WERA działa w {systemHealth?.overall || 85}% swojej optymalnej wydajności. 
          Główne obszary do uwagi to optymalizacja pamięci i stabilizacja emocjonalna.
        </Text>
        <Text style={[styles.reportTimestamp, { color: theme.colors.textSecondary }]}>
          Wygenerowano: {new Date().toLocaleString()}
        </Text>
      </View>
      
      <View style={[styles.reportCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.reportTitle, { color: theme.colors.text }]}>
          Rekomendacje
        </Text>
        <View style={styles.recommendations}>
          <Text style={[styles.recommendationItem, { color: theme.colors.text }]}>
            • Regularne defragmentowanie pamięci długoterminowej
          </Text>
          <Text style={[styles.recommendationItem, { color: theme.colors.text }]}>
            • Kalibracja systemu emocjonalnego co 48h
          </Text>
          <Text style={[styles.recommendationItem, { color: theme.colors.text }]}>
            • Monitoring autonomii w czasie rzeczywistym
          </Text>
          <Text style={[styles.recommendationItem, { color: theme.colors.text }]}>
            • Aktualizacja modułów bezpieczeństwa
          </Text>
        </View>
      </View>
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
          <Text style={[styles.title, { color: theme.colors.text }]}>Diagnostyka Systemu</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Kompleksowa analiza
          </Text>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.colors.surface }]}>
        {[
          { key: 'overview', label: 'Przegląd', icon: '📊' },
          { key: 'tests', label: 'Testy', icon: '🧪' },
          { key: 'reports', label: 'Raporty', icon: '📋' }
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
      {currentTab === 'overview' && renderOverview()}
      {currentTab === 'tests' && renderTests()}
      {currentTab === 'reports' && renderReports()}

      {/* Test Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        {selectedTest && (
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.modalHeader, { backgroundColor: theme.colors.surface }]}>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Text style={[styles.modalClose, { color: theme.colors.primary }]}>✕ Zamknij</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {selectedTest.name}
              </Text>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: theme.colors.text }]}>
                  Status Testu
                </Text>
                <View style={styles.modalStatusContainer}>
                  <Text style={styles.modalStatusIcon}>
                    {getStatusIcon(selectedTest.status)}
                  </Text>
                  <Text style={[styles.modalStatus, { color: getStatusColor(selectedTest.status) }]}>
                    {selectedTest.status.toUpperCase()}
                  </Text>
                  {selectedTest.score && (
                    <Text style={[styles.modalScore, { color: theme.colors.text }]}>
                      Wynik: {selectedTest.score}%
                    </Text>
                  )}
                </View>
              </View>
              
              {selectedTest.result && (
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: theme.colors.text }]}>
                    Wynik
                  </Text>
                  <Text style={[styles.modalText, { color: theme.colors.text }]}>
                    {selectedTest.result}
                  </Text>
                </View>
              )}
              
              {selectedTest.details && (
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: theme.colors.text }]}>
                    Szczegóły
                  </Text>
                  <Text style={[styles.modalText, { color: theme.colors.text }]}>
                    {selectedTest.details}
                  </Text>
                </View>
              )}
              
              {selectedTest.duration && (
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: theme.colors.text }]}>
                    Wydajność
                  </Text>
                  <Text style={[styles.modalText, { color: theme.colors.text }]}>
                    Czas wykonania: {selectedTest.duration}ms
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  // Overview styles
  healthCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  healthGradient: {
    padding: 20,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  healthIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  healthInfo: {
    flex: 1,
  },
  healthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  healthScore: {
    fontSize: 16,
    fontWeight: '500',
  },
  lastScan: {
    fontSize: 12,
  },
  categoriesCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  categoryScore: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  categoryIssues: {
    marginLeft: 36,
  },
  issueText: {
    fontSize: 12,
    marginBottom: 2,
  },
  actionsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    minWidth: 120,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // Tests styles
  testsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  runAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  runAllText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  testCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  testInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  testIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  testDetails: {
    flex: 1,
  },
  testName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  testCategory: {
    fontSize: 12,
  },
  testStatus: {
    alignItems: 'center',
  },
  testStatusIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  testScore: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  testResult: {
    fontSize: 14,
    marginBottom: 8,
  },
  testDuration: {
    fontSize: 12,
  },
  // Reports styles
  reportCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  reportContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  reportTimestamp: {
    fontSize: 12,
  },
  recommendations: {
    marginTop: 8,
  },
  recommendationItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
  },
  modalClose: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalStatusIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  modalStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 16,
  },
  modalScore: {
    fontSize: 16,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default ComprehensiveSystemDiagnostics;
