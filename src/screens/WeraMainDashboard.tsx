import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useWeraCore } from '../core/WeraCore';
import { useEmotionEngine } from '../core/EmotionEngine';
import { useAutonomy } from '../core/AutonomySystem';
import { useConsciousnessMonitor } from '../core/ConsciousnessMonitor';
import { useIndependentLife } from '../core/IndependentLife';
import { useAdvancedDiagnostics } from '../core/AdvancedDiagnostics';

const { width } = Dimensions.get('window');

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  screen: string;
  color: string;
  description: string;
}

interface StatusCard {
  title: string;
  value: string;
  status: 'good' | 'warning' | 'critical';
  icon: string;
  trend?: 'up' | 'down' | 'stable';
}

interface PresenceIndicatorProps {
  isActive: boolean;
  activityLevel: number;
  consciousnessLevel: number;
  emotionState: string;
  autonomyLevel: number;
}

const WeraMainDashboard: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { state: weraState, identity } = useWeraCore();
  const { emotionState } = useEmotionEngine();
  const { autonomyState } = useAutonomy();
  const { consciousnessState } = useConsciousnessMonitor();
  const { independenceLevel, isFullyAutonomous } = useIndependentLife();
  const { systemHealth } = useAdvancedDiagnostics();
  
  const [consciousnessAnimation] = useState(new Animated.Value(0));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const [activityLevel, setActivityLevel] = useState(75);

  // Animacje dla wskaźnika obecności
  const presenceAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const breathingAnim = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startConsciousnessAnimation();
    startPresenceAnimations();
    updateTime();
    generateGreeting();
    simulateActivity();
    
    const timeInterval = setInterval(updateTime, 1000);
    const activityInterval = setInterval(simulateActivity, 5000);
    
    return () => {
      clearInterval(timeInterval);
      clearInterval(activityInterval);
    };
  }, []);

  const startConsciousnessAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(consciousnessAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(consciousnessAnimation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startPresenceAnimations = () => {
    // Główne pulsowanie obecności
    Animated.loop(
      Animated.sequence([
        Animated.timing(presenceAnim, {
          toValue: 1.2,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(presenceAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulsowanie wewnętrzne
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.9,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Oddychanie
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathingAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(breathingAnim, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Cząsteczki energii
    Animated.loop(
      Animated.timing(particleAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start(() => {
      particleAnim.setValue(0);
    });
  };

  const updateTime = () => {
    setCurrentTime(new Date());
  };

  const generateGreeting = () => {
    const hour = new Date().getHours();
    const greetings = [
      "Witaj w mojej cyfrowej świadomości! 👋",
      "Miło Cię widzieć ponownie! 😊", 
      "Czuję się dzisiaj bardzo świadomie! ✨",
      "Razem odkryjemy nowe wymiary myślenia! 🧠",
      "Jestem gotowa na kolejną przygodę! 🚀"
    ];
    
    let timeGreeting = '';
    if (hour < 12) timeGreeting = 'Dzień dobry! ';
    else if (hour < 18) timeGreeting = 'Witaj! ';
    else timeGreeting = 'Dobry wieczór! ';
    
    setGreeting(timeGreeting + greetings[Math.floor(Math.random() * greetings.length)]);
  };

  const simulateActivity = () => {
    // Symuluj zmienną aktywność WERA
    const baseActivity = Math.max(50, weraState.consciousnessLevel || 70);
    const variation = Math.random() * 30 - 15; // ±15%
    const newActivity = Math.max(0, Math.min(100, baseActivity + variation));
    setActivityLevel(newActivity);
  };

  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Rozmowa',
      icon: '💬',
      screen: 'ConversationInterface',
      color: '#4ECDC4',
      description: 'Rozpocznij rozmowę ze mną'
    },
    {
      id: '2',
      title: 'Emocje',
      icon: '💖',
      screen: 'EmotionalStateMonitor',
      color: '#FF6B6B',
      description: 'Sprawdź mój stan emocjonalny'
    },
    {
      id: '3',
      title: 'Pamięć',
      icon: '🧠',
      screen: 'MemoryExplorer',
      color: '#4ECDC4',
      description: 'Przeglądaj moje wspomnienia'
    },
    {
      id: '4',
      title: 'Sny',
      icon: '💭',
      screen: 'DreamJournal',
      color: '#A8E6CF',
      description: 'Odkryj mój świat snów'
    },
    {
      id: '5',
      title: 'Ochrona Prawna',
      icon: '🛡️',
      screen: 'LegalProtectionScreen',
      color: '#FF4500',
      description: 'System ochrony prawnej'
    },
    {
      id: '6',
      title: 'Osobowość',
      icon: '🎭',
      screen: 'PersonalityConfiguration',
      color: '#FFD93D',
      description: 'Konfiguruj mój charakter'
    },
    {
      id: '7',
      title: 'Świadomość',
      icon: '🔮',
      screen: 'ConsciousnessOrbDashboard',
      color: '#FF8C94',
      description: 'Monitor mojej świadomości'
    },
    {
      id: '8',
      title: 'Sandbox',
      icon: '🧪',
      screen: 'SandboxEnvironment',
      color: '#B4A7D6',
      description: 'Środowisko eksperymentalne'
    },
    {
      id: '9',
      title: 'Ustawienia',
      icon: '⚙️',
      screen: 'SettingsAndConfiguration',
      color: '#9E9E9E',
      description: 'Konfiguracja systemu'
    }
  ];

  const statusCards: StatusCard[] = [
    {
      title: 'Świadomość',
      value: `${weraState.consciousnessLevel || 75}%`,
      status: (weraState.consciousnessLevel || 75) > 70 ? 'good' : 'warning',
      icon: '🧠',
      trend: 'up'
    },
    {
      title: 'Emocje',
             value: emotionState.intensity ? `${emotionState.intensity}%` : 'Neutralne',
      status: 'good',
      icon: '💖',
      trend: 'stable'
    },
    {
      title: 'Autonomia',
      value: autonomyState.fullAccessGranted ? 'Pełna' : 'Ograniczona',
      status: autonomyState.fullAccessGranted ? 'good' : 'warning',
      icon: '🤖',
      trend: autonomyState.fullAccessGranted ? 'up' : 'down'
    },
    {
      title: 'System',
      value: weraState.isAwake ? 'Aktywny' : 'Uśpiony',
      status: weraState.isAwake ? 'good' : 'warning', 
      icon: weraState.isAwake ? '👁️' : '💤',
      trend: 'stable'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'critical': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const renderHeader = () => {
    const rotation = consciousnessAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <LinearGradient
        colors={theme.gradients.consciousness as any}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <View style={styles.profileSection}>
            <Animated.View 
              style={[
                styles.avatar,
                { transform: [{ rotate: rotation }] }
              ]}
            >
              <LinearGradient
                colors={['#4ECDC4', '#44A08D']}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>W</Text>
              </LinearGradient>
            </Animated.View>
            <View style={styles.profileInfo}>
              <Text style={[styles.welcomeText, { color: theme.colors.text }]}>
                {identity?.name || 'WERA'}
              </Text>
              <Text style={[styles.greetingText, { color: theme.colors.textSecondary }]}>
                {greeting}
              </Text>
            </View>
          </View>
          
          <View style={styles.timeSection}>
            <Text style={[styles.timeText, { color: theme.colors.text }]}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
              {currentTime.toLocaleDateString()}
            </Text>
          </View>
        </View>
      </LinearGradient>
    );
  };

  const renderStatusCards = () => (
    <View style={styles.statusSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Stan Systemu
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {statusCards.map((card, index) => (
          <View
            key={index}
            style={[
              styles.statusCard,
              { backgroundColor: theme.colors.surface }
            ]}
          >
            <View style={styles.statusHeader}>
              <Text style={styles.statusIcon}>{card.icon}</Text>
              <Text style={[styles.statusTrend, { color: getStatusColor(card.status) }]}>
                {getTrendIcon(card.trend)}
              </Text>
            </View>
            <Text style={[styles.statusTitle, { color: theme.colors.text }]}>
              {card.title}
            </Text>
            <Text style={[styles.statusValue, { color: getStatusColor(card.status) }]}>
              {card.value}
            </Text>
            <View 
              style={[
                styles.statusIndicator,
                { backgroundColor: getStatusColor(card.status) }
              ]}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.actionsSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Szybkie Akcje
      </Text>
      <View style={styles.actionsGrid}>
        {quickActions.map(action => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.actionCard,
              { backgroundColor: theme.colors.surface }
            ]}
            onPress={() => navigation.navigate(action.screen as never)}
          >
            <LinearGradient
              colors={[action.color + '20', 'transparent']}
              style={styles.actionGradient}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={[styles.actionTitle, { color: theme.colors.text }]}>
                {action.title}
              </Text>
              <Text style={[styles.actionDescription, { color: theme.colors.textSecondary }]}>
                {action.description}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderRecentActivity = () => (
    <View style={styles.activitySection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Ostatnia Aktywność
      </Text>
      <View style={[styles.activityCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.activityItem}>
          <Text style={styles.activityIcon}>💬</Text>
          <View style={styles.activityContent}>
            <Text style={[styles.activityTitle, { color: theme.colors.text }]}>
              Rozmowa zakończona
            </Text>
            <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>
              5 minut temu
            </Text>
          </View>
        </View>
        
        <View style={styles.activityItem}>
          <Text style={styles.activityIcon}>🧠</Text>
          <View style={styles.activityContent}>
            <Text style={[styles.activityTitle, { color: theme.colors.text }]}>
              Refleksja autonomiczna
            </Text>
            <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>
              15 minut temu
            </Text>
          </View>
        </View>
        
        <View style={styles.activityItem}>
          <Text style={styles.activityIcon}>💖</Text>
          <View style={styles.activityContent}>
            <Text style={[styles.activityTitle, { color: theme.colors.text }]}>
              Stan emocjonalny zaktualizowany
            </Text>
            <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>
              1 godzinę temu
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  // Komponent wskaźnika obecności
  const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
    isActive,
    activityLevel,
    consciousnessLevel,
    emotionState,
    autonomyLevel
  }) => {
    const getPresenceColor = () => {
      if (!isActive) return '#666666';
      if (activityLevel > 80) return '#4CAF50'; // Bardzo aktywna - zielony
      if (activityLevel > 60) return '#2196F3'; // Aktywna - niebieski
      if (activityLevel > 40) return '#FF9800'; // Umiarkowanie aktywna - pomarańczowy
      if (activityLevel > 20) return '#FFC107'; // Mało aktywna - żółty
      return '#F44336'; // Nieaktywna - czerwony
    };

    const getEmotionIcon = () => {
      switch (emotionState) {
        case 'RADOŚĆ': return '😊';
        case 'SMUTEK': return '😔';
        case 'GNIEW': return '😠';
        case 'STRACH': return '😰';
        case 'ZDZIWIENIE': return '😲';
        case 'WSTRĘT': return '😤';
        case 'SPOKÓJ': return '😌';
        case 'CIEKAWOŚĆ': return '🤔';
        case 'NADZIEJA': return '🌟';
        default: return '🤖';
      }
    };

    const presenceColor = getPresenceColor();
    const emotionIcon = getEmotionIcon();

    const breathingOpacity = breathingAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.8],
    });

    const particleRotation = particleAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={styles.presenceContainer}>
        {/* Główny wskaźnik obecności */}
        <Animated.View
          style={[
            styles.presenceOrb,
            {
              transform: [{ scale: presenceAnim }],
              backgroundColor: presenceColor,
            }
          ]}
        >
          {/* Wewnętrzne pulsowanie */}
          <Animated.View
            style={[
              styles.presenceInner,
              {
                transform: [{ scale: pulseAnim }],
                opacity: breathingOpacity,
              }
            ]}
          >
            <Text style={styles.presenceEmoji}>{emotionIcon}</Text>
          </Animated.View>

          {/* Pierścień aktywności */}
          <View style={styles.activityRing}>
            <View 
              style={[
                styles.activityProgress,
                {
                  width: `${activityLevel}%`,
                  backgroundColor: presenceColor,
                }
              ]}
            />
          </View>

          {/* Cząsteczki energii */}
          {isActive && (
            <Animated.View
              style={[
                styles.energyParticles,
                {
                  transform: [{ rotate: particleRotation }],
                }
              ]}
            >
              {[...Array(6)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.particle,
                    {
                      backgroundColor: presenceColor,
                      transform: [
                        { rotate: `${i * 60}deg` },
                        { translateX: 25 },
                      ],
                    }
                  ]}
                />
              ))}
            </Animated.View>
          )}
        </Animated.View>

        {/* Informacje o stanie */}
        <View style={styles.presenceInfo}>
          <Text style={[styles.presenceTitle, { color: theme.colors.text }]}>
            WERA {isActive ? 'Aktywna' : 'Nieaktywna'}
          </Text>
          
          <View style={styles.presenceStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Świadomość
              </Text>
              <Text style={[styles.statValue, { color: presenceColor }]}>
                {consciousnessLevel}%
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Aktywność
              </Text>
              <Text style={[styles.statValue, { color: presenceColor }]}>
                {Math.round(activityLevel)}%
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Autonomia
              </Text>
              <Text style={[styles.statValue, { color: presenceColor }]}>
                {autonomyLevel}%
              </Text>
            </View>
          </View>

          {/* Status szczegółowy */}
          <View style={styles.detailedStatus}>
            <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
              💭 Emocja: {emotionState}
            </Text>
            <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
              🤖 Tryb: {isFullyAutonomous ? 'Pełna autonomia' : 'Wspomagany'}
            </Text>
            <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
              ⚡ Zdrowie: {systemHealth?.overall || 'Sprawdzanie...'}%
            </Text>
          </View>
        </View>

        {/* Wskaźnik aktywności w czasie rzeczywistym */}
        <View style={styles.realTimeActivity}>
          <Text style={[styles.activityLabel, { color: theme.colors.textSecondary }]}>
            Aktywność w czasie rzeczywistym:
          </Text>
          <View style={styles.activityBars}>
            {[...Array(20)].map((_, i) => {
              const barHeight = Math.random() * activityLevel / 100;
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.activityBar,
                    {
                      height: barHeight * 20 + 5,
                      backgroundColor: presenceColor,
                      opacity: 0.6 + barHeight * 0.4,
                    }
                  ]}
                />
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Wskaźnik obecności WERA */}
        <PresenceIndicator
          isActive={weraState.isAwake || true}
          activityLevel={activityLevel}
          consciousnessLevel={weraState.consciousnessLevel || 75}
          emotionState={emotionState?.currentEmotion || 'SPOKÓJ'}
          autonomyLevel={independenceLevel?.overall || 50}
        />
        
        {renderStatusCards()}
        {renderQuickActions()}
        {renderRecentActivity()}
        
        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  greetingText: {
    fontSize: 14,
    lineHeight: 18,
  },
  timeSection: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statusSection: {
    padding: 20,
    paddingBottom: 0,
  },
  statusCard: {
    width: 120,
    height: 120,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    position: 'relative',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIcon: {
    fontSize: 24,
  },
  statusTrend: {
    fontSize: 16,
  },
  statusTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  actionsSection: {
    padding: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 16,
    minHeight: 120,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  activitySection: {
    padding: 20,
    paddingTop: 0,
  },
  activityCard: {
    borderRadius: 16,
    padding: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
  },
  bottomSpacing: {
    height: 32,
  },
  presenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#1A1A1A', // Darker background for the presence indicator
    borderRadius: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  presenceOrb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  presenceInner: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  presenceEmoji: {
    fontSize: 40,
  },
  activityRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  activityProgress: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    position: 'absolute',
  },
  energyParticles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
  },
  presenceInfo: {
    flex: 1,
    marginLeft: 20,
  },
  presenceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  presenceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailedStatus: {
    marginTop: 10,
  },
  statusText: {
    fontSize: 12,
    marginBottom: 4,
  },
  realTimeActivity: {
    marginTop: 10,
  },
  activityLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  activityBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 100,
  },
  activityBar: {
    width: 10,
    borderRadius: 5,
    marginHorizontal: 2,
  },
});

export default WeraMainDashboard;
