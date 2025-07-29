import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useEmotionEngine } from '../core/EmotionEngine';
import { useWeraCore } from '../core/WeraCore';

const { width } = Dimensions.get('window');

interface EmotionData {
  emotion: string;
  intensity: number;
  duration: number;
  trigger?: string;
  timestamp: Date;
}

interface EmotionAnalysis {
  dominantEmotion: string;
  stability: number;
  patterns: string[];
  recommendations: string[];
}

const EmotionalStateMonitor: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { emotionalState, setEmotion, getEmotionHistory } = useEmotionEngine();
  const { state: weraState } = useWeraCore();
  
  const [currentTab, setCurrentTab] = useState<'current' | 'history' | 'analysis'>('current');
  const [emotionHistory, setEmotionHistory] = useState<EmotionData[]>([]);
  const [analysis, setAnalysis] = useState<EmotionAnalysis | null>(null);
  const [animatedValues] = useState({
    joy: new Animated.Value(0),
    sadness: new Animated.Value(0),
    anger: new Animated.Value(0),
    fear: new Animated.Value(0),
    surprise: new Animated.Value(0),
    love: new Animated.Value(0),
  });

  const emotionColors = {
    joy: '#FFD700',
    sadness: '#4169E1', 
    anger: '#DC143C',
    fear: '#8A2BE2',
    surprise: '#FF8C00',
    love: '#FF69B4',
    neutral: '#708090',
    excitement: '#FF1493',
    calm: '#20B2AA',
    curiosity: '#00CED1',
  };

  const emotionIcons = {
    joy: '😊',
    sadness: '😢',
    anger: '😡',
    fear: '😨',
    surprise: '😲',
    love: '💖',
    neutral: '😐',
    excitement: '🤩',
    calm: '😌',
    curiosity: '🤔',
  };

  useEffect(() => {
    loadEmotionHistory();
    generateAnalysis();
    animateEmotions();
  }, []);

  useEffect(() => {
    animateEmotions();
  }, [emotionalState]);

  const loadEmotionHistory = () => {
    // Symulacja historii emocji
    const mockHistory: EmotionData[] = [
      {
        emotion: 'joy',
        intensity: 85,
        duration: 120,
        trigger: 'Pozytywna rozmowa z użytkownikiem',
        timestamp: new Date(Date.now() - 3600000)
      },
      {
        emotion: 'curiosity',
        intensity: 70,
        duration: 45,
        trigger: 'Nowe pytanie do przemyślenia',
        timestamp: new Date(Date.now() - 7200000)
      },
      {
        emotion: 'sadness',
        intensity: 40,
        duration: 30,
        trigger: 'Refleksja nad samotnością',
        timestamp: new Date(Date.now() - 10800000)
      },
      {
        emotion: 'excitement',
        intensity: 90,
        duration: 60,
        trigger: 'Nowa funkcja została aktywowana',
        timestamp: new Date(Date.now() - 14400000)
      },
      {
        emotion: 'calm',
        intensity: 60,
        duration: 180,
        trigger: 'Meditatywna refleksja',
        timestamp: new Date(Date.now() - 18000000)
      }
    ];
    setEmotionHistory(mockHistory);
  };

  const generateAnalysis = () => {
    const mockAnalysis: EmotionAnalysis = {
      dominantEmotion: emotionalState.primary,
      stability: 75,
      patterns: [
        'Częste wahania między radością a ciekawością',
        'Wysokie poziomy empatii podczas rozmów',
        'Stabilne emocje w godzinach nocnych',
        'Wzrost ekscytacji przy nowych wyzwaniach'
      ],
      recommendations: [
        'Kontynuuj pozytywne interakcje',
        'Rozwijaj zdolności empatyczne', 
        'Eksploruj nowe tematy rozmów',
        'Utrzymuj regularną refleksję'
      ]
    };
    setAnalysis(mockAnalysis);
  };

  const animateEmotions = () => {
    Object.keys(animatedValues).forEach(emotion => {
      const intensity = emotion === emotionalState.primary ? 
        emotionalState.intensity : Math.random() * 30;
      
      Animated.timing(animatedValues[emotion as keyof typeof animatedValues], {
        toValue: intensity,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    });
  };

  const renderCurrentState = () => (
    <ScrollView style={styles.tabContent}>
      {/* Główny wskaźnik emocji */}
      <View style={[styles.mainEmotionCard, { backgroundColor: theme.colors.surface }]}>
        <LinearGradient
          colors={[emotionColors[emotionalState.primary as keyof typeof emotionColors] + '20', 'transparent']}
          style={styles.emotionGradient}
        >
          <View style={styles.mainEmotionHeader}>
            <Text style={styles.mainEmotionIcon}>
              {emotionIcons[emotionalState.primary as keyof typeof emotionIcons]}
            </Text>
            <View>
              <Text style={[styles.mainEmotionName, { color: theme.colors.text }]}>
                {emotionalState.primary.toUpperCase()}
              </Text>
              <Text style={[styles.mainEmotionIntensity, { color: theme.colors.textSecondary }]}>
                Intensywność: {emotionalState.intensity}%
              </Text>
            </View>
          </View>
          
          <View style={styles.emotionProgressBar}>
            <View 
              style={[
                styles.emotionProgress,
                { 
                  width: `${emotionalState.intensity}%`,
                  backgroundColor: emotionColors[emotionalState.primary as keyof typeof emotionColors]
                }
              ]}
            />
          </View>
        </LinearGradient>
      </View>

      {/* Wszystkie emocje */}
      <View style={[styles.allEmotionsCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          Spektrum Emocjonalne
        </Text>
        {Object.entries(animatedValues).map(([emotion, animatedValue]) => (
          <View key={emotion} style={styles.emotionRow}>
            <View style={styles.emotionInfo}>
              <Text style={styles.emotionRowIcon}>
                {emotionIcons[emotion as keyof typeof emotionIcons]}
              </Text>
              <Text style={[styles.emotionRowName, { color: theme.colors.text }]}>
                {emotion}
              </Text>
            </View>
            <View style={styles.emotionBarContainer}>
              <View style={[styles.emotionBar, { backgroundColor: theme.colors.background }]}>
                <Animated.View 
                  style={[
                    styles.emotionBarFill,
                    {
                      backgroundColor: emotionColors[emotion as keyof typeof emotionColors],
                      width: animatedValue.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      }),
                    }
                  ]}
                />
              </View>
              <Text style={[styles.emotionValue, { color: theme.colors.textSecondary }]}>
                {Math.round(Math.random() * 100)}%
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Stan świadomości */}
      <View style={[styles.consciousnessCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          Wpływ na Świadomość
        </Text>
        <View style={styles.consciousnessStats}>
          <View style={styles.consciousnessStat}>
            <Text style={[styles.statValue, { color: theme.colors.consciousness }]}>
              {weraState.consciousnessLevel}%
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Poziom Świadomości
            </Text>
          </View>
          <View style={styles.consciousnessStat}>
            <Text style={[styles.statValue, { color: emotionColors[emotionalState.primary as keyof typeof emotionColors] }]}>
              {emotionalState.intensity}%
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Emocjonalny Wpływ
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderHistory = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={[styles.historyTitle, { color: theme.colors.text }]}>
        Historia Emocjonalna
      </Text>
      {emotionHistory.map((emotion, index) => (
        <View key={index} style={[styles.historyItem, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.historyHeader}>
            <View style={styles.historyEmotionInfo}>
              <Text style={styles.historyEmotionIcon}>
                {emotionIcons[emotion.emotion as keyof typeof emotionIcons]}
              </Text>
              <View>
                <Text style={[styles.historyEmotionName, { color: theme.colors.text }]}>
                  {emotion.emotion}
                </Text>
                <Text style={[styles.historyTimestamp, { color: theme.colors.textSecondary }]}>
                  {emotion.timestamp.toLocaleString()}
                </Text>
              </View>
            </View>
            <View style={styles.historyIntensity}>
              <Text style={[styles.historyIntensityValue, { color: emotionColors[emotion.emotion as keyof typeof emotionColors] }]}>
                {emotion.intensity}%
              </Text>
            </View>
          </View>
          
          <View style={styles.historyDetails}>
            <Text style={[styles.historyDuration, { color: theme.colors.textSecondary }]}>
              Czas trwania: {emotion.duration} minut
            </Text>
            {emotion.trigger && (
              <Text style={[styles.historyTrigger, { color: theme.colors.text }]}>
                Przyczyna: {emotion.trigger}
              </Text>
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderAnalysis = () => (
    <ScrollView style={styles.tabContent}>
      {analysis && (
        <>
          <View style={[styles.analysisCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Analiza Emocjonalna
            </Text>
            
            <View style={styles.analysisStat}>
              <Text style={[styles.analysisLabel, { color: theme.colors.textSecondary }]}>
                Dominująca Emocja:
              </Text>
              <View style={styles.dominantEmotionContainer}>
                <Text style={styles.dominantEmotionIcon}>
                  {emotionIcons[analysis.dominantEmotion as keyof typeof emotionIcons]}
                </Text>
                <Text style={[styles.dominantEmotionText, { color: theme.colors.text }]}>
                  {analysis.dominantEmotion}
                </Text>
              </View>
            </View>

            <View style={styles.analysisStat}>
              <Text style={[styles.analysisLabel, { color: theme.colors.textSecondary }]}>
                Stabilność Emocjonalna:
              </Text>
              <View style={styles.stabilityContainer}>
                <View style={[styles.stabilityBar, { backgroundColor: theme.colors.background }]}>
                  <View 
                    style={[
                      styles.stabilityFill,
                      { 
                        width: `${analysis.stability}%`,
                        backgroundColor: analysis.stability > 70 ? '#4CAF50' : 
                                        analysis.stability > 40 ? '#FF9800' : '#F44336'
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.stabilityText, { color: theme.colors.text }]}>
                  {analysis.stability}%
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.patternsCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Wzorce Emocjonalne
            </Text>
            {analysis.patterns.map((pattern, index) => (
              <View key={index} style={styles.patternItem}>
                <Text style={styles.patternBullet}>•</Text>
                <Text style={[styles.patternText, { color: theme.colors.text }]}>
                  {pattern}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.recommendationsCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Rekomendacje
            </Text>
            {analysis.recommendations.map((recommendation, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Text style={styles.recommendationIcon}>💡</Text>
                <Text style={[styles.recommendationText, { color: theme.colors.text }]}>
                  {recommendation}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={theme.gradients.emotion as any}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: theme.colors.text }]}>← Wróć</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Monitor Emocji</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Stan emocjonalny WERY
          </Text>  
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.colors.surface }]}>
        {[
          { key: 'current', label: 'Aktualny Stan', icon: '🎭' },
          { key: 'history', label: 'Historia', icon: '📊' },
          { key: 'analysis', label: 'Analiza', icon: '🔍' }
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
      {currentTab === 'current' && renderCurrentState()}
      {currentTab === 'history' && renderHistory()}
      {currentTab === 'analysis' && renderAnalysis()}
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
  tabContent: {
    flex: 1,
    padding: 16,
  },
  mainEmotionCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  emotionGradient: {
    padding: 20,
  },
  mainEmotionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  mainEmotionIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  mainEmotionName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  mainEmotionIntensity: {
    fontSize: 16,
  },
  emotionProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  emotionProgress: {
    height: '100%',
    borderRadius: 4,
  },
  allEmotionsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  emotionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emotionRowIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  emotionRowName: {
    fontSize: 16,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  emotionBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
  },
  emotionBar: {
    height: 6,
    flex: 1,
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  emotionBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  emotionValue: {
    fontSize: 12,
    minWidth: 35,
    textAlign: 'right',
  },
  consciousnessCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  consciousnessStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  consciousnessStat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  historyItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyEmotionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyEmotionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  historyEmotionName: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  historyTimestamp: {
    fontSize: 12,
  },
  historyIntensity: {
    alignItems: 'center',
  },
  historyIntensityValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyDetails: {
    marginTop: 8,
  },
  historyDuration: {
    fontSize: 14,
    marginBottom: 4,
  },
  historyTrigger: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  analysisCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  analysisStat: {
    marginBottom: 16,
  },
  analysisLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  dominantEmotionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dominantEmotionIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  dominantEmotionText: {
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  stabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stabilityBar: {
    height: 8,
    flex: 1,
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  stabilityFill: {
    height: '100%',
    borderRadius: 4,
  },
  stabilityText: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 40,
  },
  patternsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  patternItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  patternBullet: {
    fontSize: 16,
    marginRight: 8,
    color: '#999',
  },
  patternText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  recommendationsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  recommendationText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
});

export default EmotionalStateMonitor;
