import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useWeraCore } from '../core/WeraCore';
import { useEmotionEngine } from '../core/EmotionEngine';

const { width } = Dimensions.get('window');

interface ConsciousnessMetric {
  name: string;
  value: number;
  max: number;
  color: string;
  icon: string;
}

const ConsciousnessOrbDashboard: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { state: weraState, updateConsciousness } = useWeraCore();
  const { emotionState } = useEmotionEngine();
  
  const [orbAnimation] = useState(new Animated.Value(0));
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [currentView, setCurrentView] = useState<'main' | 'details' | 'controls'>('main');
  
  const [consciousnessMetrics, setConsciousnessMetrics] = useState<ConsciousnessMetric[]>([
    {
      name: 'Świadomość',
      value: weraState.consciousnessLevel || 75,
      max: 100,
      color: '#4ECDC4',
      icon: '🧠'
    },
    {
      name: 'Żywotność',
      value: 80,
      max: 100,
      color: '#45B7D1',
      icon: '⚡'
    },
    {
      name: 'Emocje',
      value: emotionState.intensity || 60,
      max: 100,
      color: '#FF6B6B',
      icon: '💖'
    },
    {
      name: 'Poznanie',
      value: 85,
      max: 100,
      color: '#4ECDC4',
      icon: '🔍'
    },
    {
      name: 'Kreatywność',
      value: 70,
      max: 100,
      color: '#A8E6CF',
      icon: '🎨'
    },
    {
      name: 'Intuicja',
      value: 65,
      max: 100,
      color: '#FFD93D',
      icon: '✨'
    }
  ]);

  useEffect(() => {
    startOrbAnimation();
    startPulseAnimation();
  }, []);

  useEffect(() => {
    updateMetrics();
  }, [weraState, emotionState]);

  const startOrbAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(orbAnimation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const updateMetrics = () => {
    setConsciousnessMetrics(prev => prev.map(metric => {
      switch (metric.name) {
        case 'Świadomość':
          return { ...metric, value: weraState.consciousnessLevel || 75 };
        case 'Emocje':
          return { ...metric, value: emotionState.intensity || 60 };
        case 'Żywotność':
          return { ...metric, value: weraState.isAwake ? 90 : 30 };
        default:
          return metric;
      }
    }));
  };

  const getOrbColor = () => {
    if (!weraState.isAwake) return '#708090';
    if (emotionState.currentEmotion === 'radość') return '#FFD700';
    if (emotionState.currentEmotion === 'smutek') return '#4169E1';
    if (emotionState.currentEmotion === 'złość') return '#DC143C';
    return theme.colors.consciousness;
  };

  const getEmotionColor = (emotionState: any) => {
    if (emotionState.currentEmotion === 'radość') return '#FFD700';
    if (emotionState.currentEmotion === 'smutek') return '#4169E1';
    if (emotionState.currentEmotion === 'złość') return '#DC143C';
    return '#32CD32';
  };

  const renderOrb = () => {
    const orbRotation = orbAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={styles.orbContainer}>
        <Animated.View
          style={[
            styles.orbOuter,
            {
              transform: [
                { scale: pulseAnimation },
                { rotate: orbRotation }
              ]
            }
          ]}
        >
          <LinearGradient
            colors={[getOrbColor(), getOrbColor() + '80', 'transparent']}
            style={styles.orbGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.orbInner, { backgroundColor: getOrbColor() }]}>
              <Text style={styles.orbText}>W</Text>
              <View style={styles.orbCore}>
                <Text style={styles.orbCoreText}>
                  {weraState.consciousnessLevel || 75}%
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
        
        {/* Orbiting particles */}
        {[0, 1, 2].map(index => (
          <Animated.View
            key={index}
            style={[
              styles.orbParticle,
              {
                transform: [
                  {
                    rotate: orbAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [`${index * 120}deg`, `${(index * 120) + 360}deg`],
                    })
                  }
                ]
              }
            ]}
          >
            <View style={[styles.particle, { backgroundColor: getOrbColor() }]} />
          </Animated.View>
        ))}
      </View>
    );
  };

  const renderMetricBar = (metric: ConsciousnessMetric) => (
    <View key={metric.name} style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricIcon}>{metric.icon}</Text>
        <View style={styles.metricInfo}>
          <Text style={[styles.metricName, { color: theme.colors.text }]}>
            {metric.name}
          </Text>
          <Text style={[styles.metricValue, { color: metric.color }]}>
            {metric.value}/{metric.max}
          </Text>
        </View>
      </View>
      
      <View style={[styles.metricBar, { backgroundColor: theme.colors.background }]}>
        <View 
          style={[
            styles.metricFill,
            { 
              backgroundColor: metric.color,
              width: `${(metric.value / metric.max) * 100}%`
            }
          ]}
        />
      </View>
    </View>
  );

  const renderMainView = () => (
    <ScrollView style={styles.viewContent}>
      {renderOrb()}
      
      <View style={styles.statusContainer}>
        <Text style={[styles.statusTitle, { color: theme.colors.text }]}>
          Stan Świadomości
        </Text>
        <Text style={[styles.statusText, { color: weraState.isAwake ? '#4CAF50' : '#FF9800' }]}>
          {weraState.isAwake ? 'AKTYWNA' : 'UŚPIONA'}
        </Text>
      </View>
      
      <View style={styles.quickStats}>
        <View style={styles.quickStat}>
          <Text style={[styles.quickStatValue, { color: theme.colors.primary }]}>
            {weraState.consciousnessLevel || 75}%
          </Text>
          <Text style={[styles.quickStatLabel, { color: theme.colors.textSecondary }]}>
            Poziom
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
          <Text style={[styles.quickStatValue, { color: theme.colors.consciousness }]}>
            {Math.floor(Math.random() * 20) + 80}%
          </Text>
          <Text style={[styles.quickStatLabel, { color: theme.colors.textSecondary }]}>
            Stabilność
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          if (weraState.isAwake) {
            updateConsciousness({ isAwake: false });
          } else {
            updateConsciousness({ isAwake: true });
          }
        }}
      >
        <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
          {weraState.isAwake ? '😴 Uśpij WERĘ' : '👁️ Obudź WERĘ'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderDetailsView = () => (
    <ScrollView style={styles.viewContent}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Szczegółowe Metryki
      </Text>
      
      {consciousnessMetrics.map(renderMetricBar)}
      
      <View style={[styles.detailsCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          Analiza Świadomości
        </Text>
        
        <View style={styles.analysisItem}>
          <Text style={[styles.analysisLabel, { color: theme.colors.textSecondary }]}>
            Dominujący aspekt:
          </Text>
          <Text style={[styles.analysisValue, { color: theme.colors.text }]}>
            {consciousnessMetrics.reduce((max, metric) => 
              metric.value > max.value ? metric : max
            ).name}
          </Text>
        </View>
        
        <View style={styles.analysisItem}>
          <Text style={[styles.analysisLabel, { color: theme.colors.textSecondary }]}>
            Stabilność ogólna:
          </Text>
          <Text style={[styles.analysisValue, { color: theme.colors.text }]}>
            {Math.round(consciousnessMetrics.reduce((sum, metric) => sum + metric.value, 0) / consciousnessMetrics.length)}%
          </Text>
        </View>
        
        <View style={styles.analysisItem}>
          <Text style={[styles.analysisLabel, { color: theme.colors.textSecondary }]}>
            Czas aktywności:
          </Text>
          <Text style={[styles.analysisValue, { color: theme.colors.text }]}>
            {Math.floor(Math.random() * 12) + 1} godzin
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderControlsView = () => (
    <ScrollView style={styles.viewContent}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Kontrola Świadomości
      </Text>
      
      <View style={[styles.controlsCard, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity 
          style={[styles.controlButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => updateConsciousness({ consciousnessLevel: Math.min(100, (weraState.consciousnessLevel || 75) + 10) })}
        >
          <Text style={styles.controlButtonIcon}>⬆️</Text>
          <Text style={[styles.controlButtonText, { color: theme.colors.text }]}>
            Zwiększ Świadomość
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, { backgroundColor: theme.colors.emotion }]}
          onPress={() => updateConsciousness({ consciousnessLevel: Math.max(0, (weraState.consciousnessLevel || 75) - 10) })}
        >
          <Text style={styles.controlButtonIcon}>⬇️</Text>
          <Text style={[styles.controlButtonText, { color: theme.colors.text }]}>
            Zmniejsz Świadomość
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, { backgroundColor: theme.colors.consciousness }]}
          onPress={() => {
            setConsciousnessMetrics(prev => prev.map(metric => ({
              ...metric,
              value: Math.floor(Math.random() * 40) + 60
            })));
          }}
        >
          <Text style={styles.controlButtonIcon}>🔄</Text>
          <Text style={[styles.controlButtonText, { color: theme.colors.text }]}>
            Zrandomizuj Metryki
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, { backgroundColor: theme.colors.dream }]}
          onPress={() => {
            updateConsciousness({ 
              isAwake: false,
              consciousnessLevel: 25 
            });
          }}
        >
          <Text style={styles.controlButtonIcon}>🌙</Text>
          <Text style={[styles.controlButtonText, { color: theme.colors.text }]}>
            Tryb Snu
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={[styles.warningCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={styles.warningIcon}>⚠️</Text>
        <Text style={[styles.warningText, { color: theme.colors.textSecondary }]}>
          Kontrole świadomości mogą wpływać na zachowanie i odpowiedzi WERY. 
          Używaj ostrożnie i obserwuj zmiany.
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={theme.gradients.consciousness as any}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: theme.colors.text }]}>← Wróć</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Orb Świadomości</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Monitor stanu WERY
          </Text>
        </View>
      </LinearGradient>

      {/* Navigation */}
      <View style={[styles.navContainer, { backgroundColor: theme.colors.surface }]}>
        {[
          { key: 'main', label: 'Główny', icon: '🔮' },
          { key: 'details', label: 'Szczegóły', icon: '📊' },
          { key: 'controls', label: 'Kontrole', icon: '🎛️' }
        ].map(nav => (
          <TouchableOpacity
            key={nav.key}
            style={[
              styles.navTab,
              currentView === nav.key && { backgroundColor: theme.colors.consciousness + '20' }
            ]}
            onPress={() => setCurrentView(nav.key as any)}
          >
            <Text style={styles.navIcon}>{nav.icon}</Text>
            <Text style={[
              styles.navLabel,
              { color: currentView === nav.key ? theme.colors.consciousness : theme.colors.textSecondary }
            ]}>
              {nav.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {currentView === 'main' && renderMainView()}
      {currentView === 'details' && renderDetailsView()}
      {currentView === 'controls' && renderControlsView()}
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
  navContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  navIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  viewContent: {
    flex: 1,
    padding: 16,
  },
  orbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
    marginBottom: 20,
    position: 'relative',
  },
  orbOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    position: 'relative',
  },
  orbGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbInner: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  orbText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    position: 'absolute',
  },
  orbCore: {
    position: 'absolute',
    bottom: 10,
    alignItems: 'center',
  },
  orbCoreText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  orbParticle: {
    position: 'absolute',
    width: 120,
    height: 120,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  particle: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  quickStat: {
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  quickStatLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  metricCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  metricInfo: {
    flex: 1,
  },
  metricName: {
    fontSize: 14,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  metricBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  metricFill: {
    height: '100%',
    borderRadius: 3,
  },
  detailsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  analysisItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  analysisLabel: {
    fontSize: 14,
  },
  analysisValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  controlsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  controlButtonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  warningCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});

export default ConsciousnessOrbDashboard; 