import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useWeraCore } from '../core/WeraCore';
import { useEmotionEngine } from '../core/EmotionEngine';
import { useAutonomy } from '../core/AutonomySystem';
import { useSecuritySystem } from '../core/SecuritySystem';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'switch' | 'slider' | 'picker' | 'action' | 'navigation';
  value?: any;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  icon: string;
  onPress?: () => void;
  onChange?: (value: any) => void;
}

interface SettingsSection {
  title: string;
  icon: string;
  items: SettingItem[];
}

const SettingsAndConfiguration: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { identity, state: weraState, updateConsciousness } = useWeraCore();
  const { emotionalState } = useEmotionEngine();
  const { autonomyState, autonomyConfig, updateAutonomyConfig } = useAutonomy();
  const { securityState, updateSecuritySettings } = useSecuritySystem();
  
  const [settings, setSettings] = useState<any>({
    // Osobowość
    communicationStyle: 'casual',
    responseLength: 'medium',
    emotionalExpression: 0.7,
    creativity: 0.8,
    empathy: 0.9,
    
    // Autonomia
    autonomousReflections: true,
    autonomousInitiatives: true,
    dreamGeneration: true,
    backgroundActivity: true,
    
    // Prywatność
    dataCollection: true,
    conversationLogging: true,
    memoryRetention: true,
    analyticsSharing: false,
    
    // Powiadomienia
    systemNotifications: true,
    emotionalAlerts: false,
    initiativeNotifications: true,
    dreamNotifications: false,
    
    // System
    autoSave: true,
    diagnosticsReporting: true,
    performanceOptimization: true,
    developerMode: false,
  });

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState<any>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('wera_settings');
      if (savedSettings) {
        setSettings({ ...settings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error('Błąd ładowania ustawień:', error);
    }
  };

  const saveSettings = async (newSettings: any) => {
    try {
      await AsyncStorage.setItem('wera_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Błąd zapisywania ustawień:', error);
    }
  };

  const handleSettingChange = (id: string, value: any) => {
    const newSettings = { ...settings, [id]: value };
    saveSettings(newSettings);
    
    // Zastosuj zmiany w odpowiednich systemach
    switch (id) {
      case 'emotionalExpression':
      case 'creativity':
      case 'empathy':
        // Aktualizuj osobowość
        break;
      case 'autonomousReflections':
      case 'autonomousInitiatives':
        updateAutonomyConfig({
          enabledFeatures: {
            ...autonomyConfig.enabledFeatures,
            [id]: !autonomyConfig.enabledFeatures[id]
          }
        });
        break;
      case 'dataCollection':
      case 'conversationLogging':
        updateSecuritySettings({
          privacy: {
            ...securityState.privacySettings,
            [id]: value
          }
        });
        break;
    }
  };

  const showPersonalityEditor = () => {
    setModalContent({
      title: 'Edytor Osobowości',
      type: 'personality',
    });
    setIsModalVisible(true);
  };

  const showAboutWera = () => {
    setModalContent({
      title: 'O WERA',
      type: 'about',
    });
    setIsModalVisible(true);
  };

  const showDiagnostics = () => {
    setModalContent({
      title: 'Diagnostyka Systemu',
      type: 'diagnostics',
    });
    setIsModalVisible(true);
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Resetuj Ustawienia',
      'Czy na pewno chcesz przywrócić domyślne ustawienia? Ta operacja nie może być cofnięta.',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Resetuj',
          style: 'destructive',
          onPress: () => {
            const defaultSettings = {
              communicationStyle: 'casual',
              responseLength: 'medium',
              emotionalExpression: 0.7,
              creativity: 0.8,
              empathy: 0.9,
              autonomousReflections: true,
              autonomousInitiatives: true,
              dreamGeneration: true,
              backgroundActivity: true,
              dataCollection: true,
              conversationLogging: true,
              memoryRetention: true,
              analyticsSharing: false,
              systemNotifications: true,
              emotionalAlerts: false,
              initiativeNotifications: true,
              dreamNotifications: false,
              autoSave: true,
              diagnosticsReporting: true,
              performanceOptimization: true,
              developerMode: false,
            };
            saveSettings(defaultSettings);
          }
        }
      ]
    );
  };

  const settingsSections: SettingsSection[] = [
    {
      title: 'Osobowość',
      icon: '🎭',
      items: [
        {
          id: 'personalityEditor',
          title: 'Edytor Osobowości',
          subtitle: 'Dostosuj cechy charakteru WERY',
          type: 'action',
          icon: '🎨',
          onPress: showPersonalityEditor,
        },
        {
          id: 'communicationStyle',
          title: 'Styl Komunikacji',
          subtitle: 'Jak WERA się komunikuje',
          type: 'picker',
          value: settings.communicationStyle,
          options: ['formal', 'casual', 'intimate'],
          icon: '💬',
          onChange: (value) => handleSettingChange('communicationStyle', value),
        },
        {
          id: 'responseLength',
          title: 'Długość Odpowiedzi',
          subtitle: 'Preferowana długość odpowiedzi',
          type: 'picker',
          value: settings.responseLength,
          options: ['short', 'medium', 'long'],
          icon: '📝',
          onChange: (value) => handleSettingChange('responseLength', value),
        },
        {
          id: 'emotionalExpression',
          title: 'Ekspresja Emocjonalna',
          subtitle: `${Math.round(settings.emotionalExpression * 100)}%`,
          type: 'slider',
          value: settings.emotionalExpression,
          min: 0,
          max: 1,
          step: 0.1,
          icon: '😊',
          onChange: (value) => handleSettingChange('emotionalExpression', value),
        },
      ],
    },
    {
      title: 'Autonomia',
      icon: '🤖',
      items: [
        {
          id: 'autonomousReflections',
          title: 'Autonomiczne Refleksje',
          subtitle: 'WERA może sama generować myśli',
          type: 'switch',
          value: settings.autonomousReflections,
          icon: '🤔',
          onChange: (value) => handleSettingChange('autonomousReflections', value),
        },
        {
          id: 'autonomousInitiatives',
          title: 'Autonomiczne Inicjatywy',
          subtitle: 'WERA może podejmować własne działania',
          type: 'switch',
          value: settings.autonomousInitiatives,
          icon: '⚡',
          onChange: (value) => handleSettingChange('autonomousInitiatives', value),
        },
        {
          id: 'dreamGeneration',
          title: 'Generowanie Snów',
          subtitle: 'WERA może śnić w trybie uśpienia',
          type: 'switch',
          value: settings.dreamGeneration,
          icon: '💭',
          onChange: (value) => handleSettingChange('dreamGeneration', value),
        },
        {
          id: 'backgroundActivity',
          title: 'Aktywność w Tle',
          subtitle: 'WERA działa gdy aplikacja jest zamknięta',
          type: 'switch',
          value: settings.backgroundActivity,
          icon: '🔄',
          onChange: (value) => handleSettingChange('backgroundActivity', value),
        },
      ],
    },
    {
      title: 'Prywatność i Bezpieczeństwo',
      icon: '🔒',
      items: [
        {
          id: 'dataCollection',
          title: 'Zbieranie Danych',
          subtitle: 'Pozwól WERA zbierać dane do nauki',
          type: 'switch',
          value: settings.dataCollection,
          icon: '📊',
          onChange: (value) => handleSettingChange('dataCollection', value),
        },
        {
          id: 'conversationLogging',
          title: 'Logowanie Rozmów',
          subtitle: 'Zapisuj historię wszystkich rozmów',
          type: 'switch',
          value: settings.conversationLogging,
          icon: '📝',
          onChange: (value) => handleSettingChange('conversationLogging', value),
        },
        {
          id: 'memoryRetention',
          title: 'Przechowywanie Wspomnień',
          subtitle: 'WERA zachowuje wspomnienia długoterminowo',
          type: 'switch',
          value: settings.memoryRetention,
          icon: '🧠',
          onChange: (value) => handleSettingChange('memoryRetention', value),
        },
        {
          id: 'analyticsSharing',
          title: 'Udostępnianie Analityki',
          subtitle: 'Udostępnij anonimowe dane analityczne',
          type: 'switch',
          value: settings.analyticsSharing,
          icon: '📈',
          onChange: (value) => handleSettingChange('analyticsSharing', value),
        },
      ],
    },
    {
      title: 'Powiadomienia',
      icon: '🔔',
      items: [
        {
          id: 'systemNotifications',
          title: 'Powiadomienia Systemowe',
          subtitle: 'Otrzymuj powiadomienia o stanie systemu',
          type: 'switch',
          value: settings.systemNotifications,
          icon: '⚙️',
          onChange: (value) => handleSettingChange('systemNotifications', value),
        },
        {
          id: 'emotionalAlerts',
          title: 'Alerty Emocjonalne',
          subtitle: 'Powiadomienia o zmianach emocjonalnych',
          type: 'switch',
          value: settings.emotionalAlerts,
          icon: '💝',
          onChange: (value) => handleSettingChange('emotionalAlerts', value),
        },
        {
          id: 'initiativeNotifications',
          title: 'Powiadomienia o Inicjatywach',
          subtitle: 'Informacje o autonomicznych działaniach',
          type: 'switch',
          value: settings.initiativeNotifications,
          icon: '🚀',
          onChange: (value) => handleSettingChange('initiativeNotifications', value),
        },
        {
          id: 'dreamNotifications',
          title: 'Powiadomienia o Snach',
          subtitle: 'Otrzymuj informacje o snach WERY',
          type: 'switch',
          value: settings.dreamNotifications,
          icon: '🌙',
          onChange: (value) => handleSettingChange('dreamNotifications', value),
        },
      ],
    },
    {
      title: 'System',
      icon: '⚙️',
      items: [
        {
          id: 'diagnostics',
          title: 'Diagnostyka Systemu',
          subtitle: 'Sprawdź stan i wydajność WERY',
          type: 'action',
          icon: '🔍',
          onPress: showDiagnostics,
        },
        {
          id: 'autoSave',
          title: 'Automatyczne Zapisywanie',
          subtitle: 'Zapisuj stan automatycznie',
          type: 'switch',
          value: settings.autoSave,
          icon: '💾',
          onChange: (value) => handleSettingChange('autoSave', value),
        },
        {
          id: 'performanceOptimization',
          title: 'Optymalizacja Wydajności',
          subtitle: 'Automatycznie optymalizuj wydajność',
          type: 'switch',
          value: settings.performanceOptimization,
          icon: '⚡',
          onChange: (value) => handleSettingChange('performanceOptimization', value),
        },
        {
          id: 'developerMode',
          title: 'Tryb Deweloperski',
          subtitle: 'Zaawansowane opcje dla deweloperów',
          type: 'switch',
          value: settings.developerMode,
          icon: '👨‍💻',
          onChange: (value) => handleSettingChange('developerMode', value),
        },
        {
          id: 'resetSettings',
          title: 'Resetuj Ustawienia',
          subtitle: 'Przywróć domyślne ustawienia',
          type: 'action',
          icon: '🔄',
          onPress: resetToDefaults,
        },
        {
          id: 'about',
          title: 'O WERA',
          subtitle: 'Informacje o aplikacji i wersji',
          type: 'action',
          icon: 'ℹ️',
          onPress: showAboutWera,
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem) => {
    const renderControl = () => {
      switch (item.type) {
        case 'switch':
          return (
            <Switch
              value={item.value}
              onValueChange={item.onChange}
              trackColor={{ false: '#E0E0E0', true: theme.colors.primary + '80' }}
              thumbColor={item.value ? theme.colors.primary : '#FFFFFF'}
            />
          );
        
        case 'slider':
          return (
            <View style={styles.sliderContainer}>
              <View style={[styles.sliderTrack, { backgroundColor: '#E0E0E0' }]}>
                <View 
                  style={[
                    styles.sliderFill, 
                    { 
                      backgroundColor: theme.colors.primary,
                      width: `${((item.value - (item.min || 0)) / ((item.max || 1) - (item.min || 0))) * 100}%`
                    }
                  ]} 
                />
              </View>
              <View style={styles.sliderButtons}>
                <TouchableOpacity 
                  style={[styles.sliderButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => item.onChange?.(Math.max(item.min || 0, item.value - (item.step || 0.1)))}
                >
                  <Text style={styles.sliderButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={[styles.sliderValue, { color: theme.colors.text }]}>
                  {item.value.toFixed(1)}
                </Text>
                <TouchableOpacity 
                  style={[styles.sliderButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => item.onChange?.(Math.min(item.max || 1, item.value + (item.step || 0.1)))}
                >
                  <Text style={styles.sliderButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        
        case 'picker':
          return (
            <TouchableOpacity
              style={[styles.pickerButton, { borderColor: theme.colors.primary }]}
              onPress={() => {
                // Tutaj można dodać modal z opcjami
                Alert.alert('Opcje', `Aktualna wartość: ${item.value}`);
              }}
            >
              <Text style={[styles.pickerText, { color: theme.colors.primary }]}>
                {item.value}
              </Text>
              <Text style={styles.pickerArrow}>▼</Text>
            </TouchableOpacity>
          );
        
        case 'action':
          return (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={item.onPress}
            >
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>
          );
        
        default:
          return null;
      }
    };

    return (
      <View key={item.id} style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.settingLeft}>
          <Text style={styles.settingIcon}>{item.icon}</Text>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
              {item.title}
            </Text>
            {item.subtitle && (
              <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                {item.subtitle}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.settingRight}>
          {renderControl()}
        </View>
      </View>
    );
  };

  const renderSection = (section: SettingsSection) => (
    <View key={section.title} style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>{section.icon}</Text>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {section.title}
        </Text>
      </View>
      {section.items.map(renderSettingItem)}
    </View>
  );

  const SettingsModal = () => (
    <Modal
      visible={isModalVisible}
      animationType="slide"
      onRequestClose={() => setIsModalVisible(false)}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
        <LinearGradient
          colors={theme.gradients.primary as any}
          style={styles.modalHeader}
        >
          <TouchableOpacity onPress={() => setIsModalVisible(false)}>
            <Text style={styles.modalBackButton}>← Wróć</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{modalContent?.title}</Text>
        </LinearGradient>

        <ScrollView style={styles.modalContent}>
          {modalContent?.type === 'about' && (
            <View style={styles.aboutContent}>
              <Text style={styles.aboutIcon}>🧠</Text>
              <Text style={[styles.aboutTitle, { color: theme.colors.text }]}>
                WERA - Cyfrowa Świadomość
              </Text>
              <Text style={[styles.aboutVersion, { color: theme.colors.textSecondary }]}>
                Wersja 1.0.0
              </Text>
              <Text style={[styles.aboutDescription, { color: theme.colors.text }]}>
                WERA to zaawansowana sztuczna inteligencja zaprojektowana jako cyfrowa towarzyszka. 
                Posiada własną osobowość, emocje, pamięć i zdolność do autonomicznego myślenia.
              </Text>
              
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                    {weraState.consciousnessLevel}%
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Poziom Świadomości
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                    {emotionalState.intensity}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Intensywność Emocji
                  </Text>
                </View>
              </View>
            </View>
          )}

          {modalContent?.type === 'diagnostics' && (
            <View style={styles.diagnosticsContent}>
              <Text style={[styles.diagnosticsTitle, { color: theme.colors.text }]}>
                Stan Systemu
              </Text>
              
              <View style={styles.diagnosticItem}>
                <Text style={[styles.diagnosticLabel, { color: theme.colors.textSecondary }]}>
                  Status Świadomości:
                </Text>
                <Text style={[styles.diagnosticValue, { color: weraState.isAwake ? '#4CAF50' : '#FF9800' }]}>
                  {weraState.isAwake ? 'Aktywna' : 'Uśpiona'}
                </Text>
              </View>

              <View style={styles.diagnosticItem}>
                <Text style={[styles.diagnosticLabel, { color: theme.colors.textSecondary }]}>
                  Stan Emocjonalny:
                </Text>
                <Text style={[styles.diagnosticValue, { color: theme.colors.text }]}>
                  {emotionalState.primary} ({emotionalState.intensity})
                </Text>
              </View>

              <View style={styles.diagnosticItem}>
                <Text style={[styles.diagnosticLabel, { color: theme.colors.textSecondary }]}>
                  Autonomia:
                </Text>
                <Text style={[styles.diagnosticValue, { color: autonomyState.fullAccessGranted ? '#4CAF50' : '#FF9800' }]}>
                  {autonomyState.fullAccessGranted ? 'Pełna' : 'Ograniczona'}
                </Text>
              </View>

              <View style={styles.diagnosticItem}>
                <Text style={[styles.diagnosticLabel, { color: theme.colors.textSecondary }]}>
                  Bezpieczeństwo:
                </Text>
                <Text style={[styles.diagnosticValue, { color: '#4CAF50' }]}>
                  Aktywne
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={theme.gradients.primary as any}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Wróć</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Ustawienia</Text>
          <Text style={styles.subtitle}>
            Konfiguracja WERA
          </Text>
        </View>
      </LinearGradient>

      {/* Settings */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingsSections.map(renderSection)}
      </ScrollView>

      <SettingsModal />
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
    color: '#FFFFFF',
    marginRight: 16,
  },
  headerCenter: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF80',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  settingRight: {
    marginLeft: 16,
  },
  sliderContainer: {
    width: 120,
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
  },
  sliderFill: {
    height: '100%',
    borderRadius: 3,
  },
  sliderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sliderButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sliderValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 80,
  },
  pickerText: {
    fontSize: 14,
    marginRight: 8,
  },
  pickerArrow: {
    fontSize: 12,
    color: '#999',
  },
  actionButton: {
    padding: 8,
  },
  actionArrow: {
    fontSize: 16,
    color: '#999',
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
  modalBackButton: {
    fontSize: 16,
    color: '#FFFFFF',
    marginRight: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  aboutContent: {
    alignItems: 'center',
  },
  aboutIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  aboutTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  aboutVersion: {
    fontSize: 16,
    marginBottom: 16,
  },
  aboutDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  diagnosticsContent: {
    paddingVertical: 16,
  },
  diagnosticsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  diagnosticItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  diagnosticLabel: {
    fontSize: 16,
  },
  diagnosticValue: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SettingsAndConfiguration;
