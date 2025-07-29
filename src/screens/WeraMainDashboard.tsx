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
import { useAutonomy } from '../core/AutonomySystem';

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

const WeraMainDashboard: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { state: weraState, identity } = useWeraCore();
  const { emotionalState } = useEmotionEngine();
  const { autonomyState } = useAutonomy();
  
  const [consciousnessAnimation] = useState(new Animated.Value(0));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    startConsciousnessAnimation();
    updateTime();
    generateGreeting();
    
    const timeInterval = setInterval(updateTime, 1000);
    return () => clearInterval(timeInterval);
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
      title: 'Osobowość',
      icon: '🎭',
      screen: 'PersonalityConfiguration',
      color: '#FFD93D',
      description: 'Konfiguruj mój charakter'
    },
    {
      id: '6',
      title: 'Świadomość',
      icon: '🔮',
      screen: 'ConsciousnessOrbDashboard',
      color: '#FF8C94',
      description: 'Monitor mojej świadomości'
    },
    {
      id: '7',
      title: 'Sandbox',
      icon: '🧪',
      screen: 'SandboxEnvironment',
      color: '#B4A7D6',
      description: 'Środowisko eksperymentalne'
    },
    {
      id: '8',
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
             value: emotionalState.intensity ? `${emotionalState.intensity}%` : 'Neutralne',
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
});

export default WeraMainDashboard;
