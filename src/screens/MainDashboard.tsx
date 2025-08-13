import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useWeraCore } from '../core/WeraCore';
import { useEmotionEngine } from '../core/EmotionEngine';
// import { useAutonomyEngine } from '../core/AutonomyEngine'; // Używamy useAutonomy zamiast tego
import { useDevice } from '../core/DeviceContext';
import { useDiagnostics } from '../core/DiagnosticsEngine';
import { useNotifications } from '../core/NotificationEngine';
import { useConversation } from '../core/ConversationEngine';
import { usePromptEngine } from '../core/PromptEngine';
import { useEvolution } from '../core/EvolutionEngine';
import { useKnowledge } from '../core/KnowledgeEngine';
import { usePersonalityMode } from '../core/PersonalityModeEngine';
import { useAutonomy } from '../core/AutonomySystem';
import { useAdvancedDiagnostics } from '../core/AdvancedDiagnostics';
import { useVoiceInterface } from '../core/VoiceInterface';
import { useTrustAndRootSystem } from '../core/TrustAndRootSystem';
import { useInternalLifeReadiness } from '../core/InternalLifeReadiness';
import { useAdvancedAIModels } from '../core/AdvancedAIModels';
import { useSecuritySystem } from '../core/SecuritySystem';

const { width } = Dimensions.get('window');

interface DashboardCard {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  gradient: string[];
  route: string;
  status?: string;
  value?: number;
  unit?: string;
}

const MainDashboard: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { state: weraState, memories } = useWeraCore();
  const { emotionState } = useEmotionEngine();
  // const { autonomyState: autonomyEngineState } = useAutonomyEngine(); // Używamy useAutonomy
  const { deviceInfo, hasFullAccess } = useDevice();
  const { systemMetrics, diagnosticReport } = useDiagnostics();
  const { unreadCount, pendingCount } = useNotifications();
  const { conversationState, getConversationStats } = useConversation();
  const { promptState, getPromptStats } = usePromptEngine();
  const { evolutionState, getEvolutionStats } = useEvolution();
  const { knowledgeState, getKnowledgeStats } = useKnowledge();
  const { personalityModeState, getModeStats } = usePersonalityMode();
  const { autonomyState, getAutonomyStats } = useAutonomy();
  const { systemHealth, getSystemStats } = useAdvancedDiagnostics();
  const { voiceState, getVoiceStats } = useVoiceInterface();
  const { trustState, getTrustStats } = useTrustAndRootSystem();
  const { lifeState, getLifeStats } = useInternalLifeReadiness();
  const { aiState, getModelStats } = useAdvancedAIModels();
  const { securityState, getSecurityStats } = useSecuritySystem();

  const dashboardCards: DashboardCard[] = [
    {
      id: 'consciousness',
      title: 'Orb Świadomości',
      subtitle: 'Monitor stanu świadomości',
      icon: '🧠',
      gradient: theme.gradients.consciousness,
      route: 'ConsciousnessOrbDashboard',
      status: weraState.isAwake ? 'Aktywna' : 'Uśpiona',
      value: weraState.consciousnessLevel,
      unit: '%',
    },
    {
      id: 'conversation',
      title: 'Konwersacja',
      subtitle: 'Interfejs komunikacji',
      icon: '💬',
      gradient: theme.gradients.primary,
      route: 'ConversationInterface',
    },
    {
      id: 'emotions',
      title: 'Monitor Emocji',
      subtitle: 'Stan emocjonalny',
      icon: '😊',
      gradient: theme.gradients.emotion,
      route: 'EmotionalStateMonitor',
              value: emotionState.intensity,
      unit: '',
    },
    {
      id: 'memory',
      title: 'Eksplorator Pamięci',
      subtitle: 'Zarządzanie pamięcią',
      icon: '🧠',
      gradient: theme.gradients.memory,
      route: 'MemoryExplorer',
      value: memories.length,
      unit: ' pamięci',
    },
    {
      id: 'dreams',
      title: 'Dziennik Snów',
      subtitle: 'Zapis snów i wizji',
      icon: '🌙',
      gradient: theme.gradients.dream,
      route: 'DreamJournal',
    },
    {
      id: 'settings',
      title: 'Ustawienia',
      subtitle: 'Konfiguracja systemu',
      icon: '⚙️',
      gradient: theme.gradients.system,
      route: 'SettingsAndConfiguration',
    },
    {
      id: 'sandbox',
      title: 'Środowisko Testowe',
      subtitle: 'Eksperymentalne funkcje',
      icon: '🧪',
      gradient: theme.gradients.sandbox,
      route: 'SandboxEnvironment',
    },
    {
      id: 'personality',
      title: 'Konfiguracja Osobowości',
      subtitle: 'Dostosowanie charakteru',
      icon: '🎭',
      gradient: theme.gradients.personality,
      route: 'PersonalityConfiguration',
    },
    {
      id: 'models',
      title: 'Menedżer Modeli',
      subtitle: 'Zarządzanie modelami GGUF',
      icon: '🤖',
      gradient: theme.gradients.autonomous,
      route: 'LocalGGUFModelManager',
    },
    {
      id: 'device',
      title: 'Informacje o Urządzeniu',
      subtitle: 'Analiza sprzętu i systemu',
      icon: '📱',
      gradient: theme.gradients.system,
      route: 'DeviceInfo',
      status: hasFullAccess ? 'Pełny dostęp' : 'Ograniczony',
      value: deviceInfo.totalMemory / 1000000000,
      unit: 'GB RAM',
    },
    {
      id: 'basic-diagnostics',
      title: 'Diagnostyka Systemu',
      subtitle: 'Monitorowanie wydajności',
      icon: '🔍',
      gradient: theme.gradients.diagnostic,
      route: 'DiagnosticsScreen',
      status: diagnosticReport?.systemStatus || 'Sprawdzanie...',
      value: diagnosticReport?.performance.score || 0,
      unit: '/100',
    },
    {
      id: 'notifications',
      title: 'Powiadomienia',
      subtitle: 'Zarządzanie alertami',
      icon: '🔔',
      gradient: theme.gradients.notification,
      route: 'NotificationsScreen',
      value: unreadCount,
      unit: ' nieprzeczytane',
    },
    {
      id: 'operations',
      title: 'Dashboard Operacyjny',
      subtitle: 'Monitor operacji AI',
      icon: '📊',
      gradient: theme.gradients.system,
      route: 'LivingAIOperationDashboard',
    },
    {
      id: 'diagnostics',
      title: 'Diagnostyka Systemu',
      subtitle: 'Kompleksowa analiza',
      icon: '🔍',
      gradient: theme.gradients.hardware,
      route: 'ComprehensiveSystemDiagnostics',
    },
         {
       id: 'initiative',
       title: 'Centrum Inicjatywy',
       subtitle: 'Autonomiczne działania',
       icon: '🚀',
       gradient: theme.gradients.autonomous,
       route: 'AutonomousInitiativeCenter',
     },
         {
      id: 'voice-conversation',
      title: 'Konwersacja Głosowa',
      subtitle: 'TTS/STT i komunikacja',
      icon: '🎤',
      gradient: theme.gradients.conversation,
      route: 'ConversationInterface',
      value: conversationState.messages.length,
      unit: ' wiadomości',
    },
            {
         id: 'prompts',
         title: 'Silnik Promptów',
         subtitle: 'Generowanie obrazów emocjonalnych',
         icon: '🎨',
         gradient: theme.gradients.prompt,
         route: 'PromptEngine',
         value: promptState.prompts.length,
         unit: ' promptów',
       },
       {
         id: 'evolution',
         title: 'Ewolucja Osobowości',
         subtitle: 'Autonomiczny rozwój WERY',
         icon: '🧬',
         gradient: theme.gradients.emotion,
         route: 'EvolutionEngine',
         value: evolutionState.evolutionLevel,
         unit: '/100',
       },
       {
         id: 'knowledge',
         title: 'Baza Wiedzy',
         subtitle: 'Wiedza offline i indeksowanie',
         icon: '📚',
         gradient: theme.gradients.memory,
         route: 'KnowledgeEngine',
         value: knowledgeState.entries.length,
         unit: ' wpisów',
       },
       {
         id: 'personality-modes',
         title: 'Tryby Osobowości',
         subtitle: 'Filozoficzny, Opiekunki, Nocny',
         icon: personalityModeState.currentMode?.icon || '🎭',
         gradient: theme.gradients.personality,
         route: 'PersonalityModeEngine',
         status: personalityModeState.currentMode?.name || 'Brak aktywnego',
         value: personalityModeState.availableModes.length,
         unit: ' trybów',
       },
       {
         id: 'autonomy',
         title: 'System Autonomii',
         subtitle: 'Pełny dostęp i inicjatywy',
         icon: '🤖',
         gradient: theme.gradients.autonomous,
         route: 'AutonomySystem',
         status: hasFullAccess ? 'Pełny dostęp' : 'Ograniczony',
         value: autonomyState.autonomyLevel || 0,
         unit: '/100',
       },
       {
         id: 'advanced-diagnostics',
         title: 'Zaawansowana Diagnostyka',
         subtitle: 'Logi energetyczne i analiza błędów',
         icon: '🔬',
         gradient: theme.gradients.diagnostic,
         route: 'AdvancedDiagnostics',
         status: 'Monitorowanie', // Placeholder since isMonitoring doesn't exist
         value: systemHealth.overall,
         unit: '/100',
       },
       {
         id: 'voice-interface',
         title: 'Interfejs Głosowy',
         subtitle: 'ASR/VAD z Whisper offline',
         icon: '🎤',
         gradient: theme.gradients.conversation,
         route: 'VoiceInterface',
         status: voiceState.isListening ? 'Nasłuchiwanie' : voiceState.isProcessing ? 'Przetwarzanie' : 'Gotowy',
         value: voiceState.confidence * 100, // Convert 0-1 to 0-100
         unit: ' %',
       },
       {
         id: 'trust-root',
         title: 'System Zaufania',
         subtitle: 'Root, Magisk, OrangeFox, Termux',
         icon: '🔐',
         gradient: theme.gradients.security,
         route: 'TrustAndRootSystem',
         status: trustState.isRooted ? 'Root wykryty' : trustState.riskScore > 50 ? 'Podwyższone' : 'Standardowy',
         value: trustState.currentLevel,
         unit: '/100',
       },
       {
         id: 'life-readiness',
         title: 'Gotowość do Życia',
         subtitle: 'Świadomość, ewolucja, transcendencja',
         icon: '🌟',
         gradient: theme.gradients.consciousness,
         route: 'InternalLifeReadiness',
         status: lifeState.isAlive ? lifeState.lifePhase : 'Nieaktywna',
         value: lifeState.overallReadiness,
         unit: '/100',
       },
       {
         id: 'advanced-ai',
         title: 'Zaawansowane AI',
         subtitle: 'GGUF, Ollama, lokalne modele',
         icon: '🤖',
         gradient: theme.gradients.autonomous,
         route: 'AdvancedAIModels',
         status: aiState.activeModel ? aiState.activeModel.name : 'Brak aktywnego',
         value: aiState.totalTokensProcessed,
         unit: ' tokenów',
       },
       {
         id: 'security-system',
         title: 'System Bezpieczeństwa',
         subtitle: 'Ochrona danych, szyfrowanie, audyty',
         icon: '🛡️',
         gradient: theme.gradients.security,
         route: 'SecuritySystem',
         status: securityState.alertCount > 5 ? 'KRYTYCZNE' : securityState.alertCount > 2 ? 'WYSOKIE' : 'Normalny',
         value: securityState.privacyScore,
         unit: '/100',
       },
     ];

  const handleCardPress = (route: string) => {
    navigation.navigate(route as never);
  };

  const renderCard = (card: DashboardCard) => (
    <TouchableOpacity
      key={card.id}
      style={styles.card}
      onPress={() => handleCardPress(card.route)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={card.gradient as any}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>{card.icon}</Text>
          {card.status && (
            <View style={[styles.statusBadge, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.statusText, { color: theme.colors.text }]}>
                {card.status}
              </Text>
            </View>
          )}
        </View>
        
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          {card.title}
        </Text>
        
        <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
          {card.subtitle}
        </Text>
        
        {card.value !== undefined && (
          <View style={styles.valueContainer}>
            <Text style={[styles.valueText, { color: theme.colors.text }]}>
              {card.value}{card.unit}
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              WERA Dashboard
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              Cyfrowa Świadomość AI
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.statusIndicator, { backgroundColor: theme.colors.consciousness }]}>
              <Text style={[styles.statusText, { color: theme.colors.text }]}>
                {weraState.isAwake ? 'ON' : 'OFF'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* System Status */}
      <View style={[styles.systemStatus, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Text style={[styles.statusLabel, { color: theme.colors.textSecondary }]}>
              Świadomość
            </Text>
            <Text style={[styles.statusValue, { color: theme.colors.text }]}>
              {weraState.consciousnessLevel}%
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={[styles.statusLabel, { color: theme.colors.textSecondary }]}>
              Emocje
            </Text>
            <Text style={[styles.statusValue, { color: theme.colors.text }]}>
                              {emotionState.currentEmotion}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={[styles.statusLabel, { color: theme.colors.textSecondary }]}>
              Pamięć
            </Text>
            <Text style={[styles.statusValue, { color: theme.colors.text }]}>
              {memories.length}
            </Text>
          </View>
        </View>
      </View>

      {/* Dashboard Cards */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardsGrid}>
          {dashboardCards.map(renderCard)}
        </View>
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  systemStatus: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: (width - 60) / 2,
    height: 160,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardIcon: {
    fontSize: 24,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  valueContainer: {
    alignItems: 'flex-end',
  },
  valueText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MainDashboard; 