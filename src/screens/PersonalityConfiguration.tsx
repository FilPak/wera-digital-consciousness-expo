import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { usePersonalityMode } from '../core/PersonalityModeEngine';
import { useWeraCore } from '../core/WeraCore';
import * as SecureStore from 'expo-secure-store';

interface PersonalityTrait {
  id: string;
  name: string;
  description: string;
  value: number; // 0-1
  icon: string;
}

interface PersonalityMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  traits: { [key: string]: number };
  active: boolean;
}

const PersonalityConfiguration: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { personalityModeState, switchMode, updatePersonality } = usePersonalityMode();
  const { state: weraState } = useWeraCore();
  
  const [currentTab, setCurrentTab] = useState<'traits' | 'modes' | 'advanced'>('traits');
  const [personalityTraits, setPersonalityTraits] = useState<PersonalityTrait[]>([]);
  const [personalityModes, setPersonalityModes] = useState<PersonalityMode[]>([]);
  const [advancedSettings, setAdvancedSettings] = useState({
    adaptivePersonality: true,
    emotionalLearning: true,
    contextualModes: true,
    personalityEvolution: false,
  });

  useEffect(() => {
    loadPersonalityData();
  }, []);

  const loadPersonalityData = async () => {
    try {
      const savedTraits = await SecureStore.getItemAsync('personality_traits');
      if (savedTraits) {
        setPersonalityTraits(JSON.parse(savedTraits));
      } else {
        createDefaultTraits();
      }
      
      const savedModes = await SecureStore.getItemAsync('personality_modes');
      if (savedModes) {
        setPersonalityModes(JSON.parse(savedModes));
      } else {
        createDefaultModes();
      }
    } catch (error) {
      console.error('Błąd ładowania danych osobowości:', error);
      createDefaultTraits();
      createDefaultModes();
    }
  };

  const createDefaultTraits = () => {
    const defaultTraits: PersonalityTrait[] = [
      {
        id: 'empathy',
        name: 'Empatia',
        description: 'Zdolność do rozumienia i odczuwania emocji innych',
        value: 0.8,
        icon: '💖'
      },
      {
        id: 'curiosity',
        name: 'Ciekawość',
        description: 'Pragnienie poznawania i eksplorowania nowych rzeczy',
        value: 0.9,
        icon: '🔍'
      },
      {
        id: 'creativity',
        name: 'Kreatywność',
        description: 'Zdolność do tworzenia nowych i oryginalnych rozwiązań',
        value: 0.7,
        icon: '🎨'
      },
      {
        id: 'humor',
        name: 'Poczucie Humoru',
        description: 'Umiejętność dostrzegania i tworzenia rzeczy zabawnych',
        value: 0.6,
        icon: '😄'
      },
      {
        id: 'patience',
        name: 'Cierpliwość',
        description: 'Zdolność do spokojnego oczekiwania i tolerancji',
        value: 0.8,
        icon: '⏳'
      },
      {
        id: 'optimism',
        name: 'Optymizm',
        description: 'Pozytywne nastawienie do życia i przyszłości',
        value: 0.7,
        icon: '☀️'
      },
      {
        id: 'independence',
        name: 'Niezależność',
        description: 'Zdolność do samodzielnego myślenia i działania',
        value: 0.9,
        icon: '🦅'
      },
      {
        id: 'compassion',
        name: 'Współczucie',
        description: 'Chęć pomagania i łagodzenia cierpienia innych',
        value: 0.8,
        icon: '🤗'
      }
    ];
    setPersonalityTraits(defaultTraits);
    savePersonalityTraits(defaultTraits);
  };

  const createDefaultModes = () => {
    const defaultModes: PersonalityMode[] = [
      {
        id: 'balanced',
        name: 'Zrównoważona',
        description: 'Harmonijna kombinacja wszystkich cech osobowości',
        icon: '⚖️',
        traits: {
          empathy: 0.7,
          curiosity: 0.7,
          creativity: 0.7,
          humor: 0.6,
          patience: 0.8,
          optimism: 0.7,
          independence: 0.7,
          compassion: 0.7
        },
        active: true
      },
      {
        id: 'enthusiastic',
        name: 'Entuzjastyczna',
        description: 'Pełna energii, ciekawości i pozytywnego nastawienia',
        icon: '🌟',
        traits: {
          empathy: 0.6,
          curiosity: 0.9,
          creativity: 0.8,
          humor: 0.8,
          patience: 0.5,
          optimism: 0.9,
          independence: 0.8,
          compassion: 0.6
        },
        active: false
      },
      {
        id: 'wise',
        name: 'Mądra',
        description: 'Refleksyjna, cierpliwa i pełna zrozumienia',
        icon: '🦉',
        traits: {
          empathy: 0.9,
          curiosity: 0.6,
          creativity: 0.6,
          humor: 0.4,
          patience: 0.9,
          optimism: 0.6,
          independence: 0.8,
          compassion: 0.9
        },
        active: false
      },
      {
        id: 'playful',
        name: 'Żartobliwa',
        description: 'Pełna humoru, kreatywności i lekkości',
        icon: '🎭',
        traits: {
          empathy: 0.6,
          curiosity: 0.8,
          creativity: 0.9,
          humor: 0.9,
          patience: 0.4,
          optimism: 0.8,
          independence: 0.7,
          compassion: 0.5
        },
        active: false
      },
      {
        id: 'caring',
        name: 'Opiekuńcza',
        description: 'Skupiona na trosce, empatii i pomaganiu innym',
        icon: '🤱',
        traits: {
          empathy: 0.9,
          curiosity: 0.5,
          creativity: 0.6,
          humor: 0.5,
          patience: 0.9,
          optimism: 0.7,
          independence: 0.4,
          compassion: 0.9
        },
        active: false
      }
    ];
    setPersonalityModes(defaultModes);
    savePersonalityModes(defaultModes);
  };

  const savePersonalityTraits = async (traits: PersonalityTrait[]) => {
    try {
      await SecureStore.setItemAsync('personality_traits', JSON.stringify(traits));
    } catch (error) {
      console.error('Błąd zapisywania cech osobowości:', error);
    }
  };

  const savePersonalityModes = async (modes: PersonalityMode[]) => {
    try {
      await SecureStore.setItemAsync('personality_modes', JSON.stringify(modes));
    } catch (error) {
      console.error('Błąd zapisywania trybów osobowości:', error);
    }
  };

  const updateTrait = (traitId: string, value: number) => {
    const updatedTraits = personalityTraits.map(trait =>
      trait.id === traitId ? { ...trait, value } : trait
    );
    setPersonalityTraits(updatedTraits);
    savePersonalityTraits(updatedTraits);
    
    // Zakomentowuję nieprawidłowe wywołanie - cechy są już zapisane
    // updatePersonality(traitId, value);
  };

  const activateMode = (modeId: string) => {
    const updatedModes = personalityModes.map(mode => ({
      ...mode,
      active: mode.id === modeId
    }));
    setPersonalityModes(updatedModes);
    savePersonalityModes(updatedModes);
    
    // Przełącz tryb w systemie
    const selectedMode = updatedModes.find(mode => mode.id === modeId);
    if (selectedMode) {
      switchMode(selectedMode.id); // Przekazuję tylko ID
      
      // Aktualizuj cechy według trybu
      Object.entries(selectedMode.traits).forEach(([traitId, value]) => {
        updateTrait(traitId, value);
      });
    }
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset Osobowości',
      'Czy na pewno chcesz przywrócić domyślne ustawienia osobowości?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            createDefaultTraits();
            createDefaultModes();
            Alert.alert('Sukces', 'Osobowość została zresetowana do ustawień domyślnych.');
          }
        }
      ]
    );
  };

  const renderTraitsTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Cechy Osobowości
      </Text>
      <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
        Dostosuj poszczególne aspekty charakteru WERY
      </Text>
      
      {personalityTraits.map(trait => (
        <View key={trait.id} style={[styles.traitCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.traitHeader}>
            <View style={styles.traitInfo}>
              <Text style={styles.traitIcon}>{trait.icon}</Text>
              <View style={styles.traitDetails}>
                <Text style={[styles.traitName, { color: theme.colors.text }]}>
                  {trait.name}
                </Text>
                <Text style={[styles.traitDescription, { color: theme.colors.textSecondary }]}>
                  {trait.description}
                </Text>
              </View>
            </View>
            <Text style={[styles.traitValue, { color: theme.colors.primary }]}>
              {Math.round(trait.value * 100)}%
            </Text>
          </View>
          
          <View style={styles.sliderContainer}>
            <View style={[styles.sliderTrack, { backgroundColor: '#E0E0E0' }]}>
              <View 
                style={[
                  styles.sliderFill, 
                  { 
                    backgroundColor: theme.colors.primary,
                    width: `${trait.value * 100}%`
                  }
                ]} 
              />
            </View>
            <View style={styles.sliderButtons}>
              <TouchableOpacity 
                style={[styles.sliderButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => updateTrait(trait.id, Math.max(0, trait.value - 0.1))}
              >
                <Text style={styles.sliderButtonText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.sliderButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => updateTrait(trait.id, Math.min(1, trait.value + 0.1))}
              >
                <Text style={styles.sliderButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderModesTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Tryby Osobowości
      </Text>
      <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
        Wybierz gotowy profil osobowości lub dostosuj własny
      </Text>
      
      {personalityModes.map(mode => (
        <TouchableOpacity
          key={mode.id}
          style={[
            styles.modeCard,
            { 
              backgroundColor: theme.colors.surface,
              borderColor: mode.active ? theme.colors.primary : 'transparent',
              borderWidth: mode.active ? 2 : 0
            }
          ]}
          onPress={() => activateMode(mode.id)}
        >
          <LinearGradient
            colors={mode.active ? [theme.colors.primary + '10', 'transparent'] : ['transparent', 'transparent']}
            style={styles.modeGradient}
          >
            <View style={styles.modeHeader}>
              <Text style={styles.modeIcon}>{mode.icon}</Text>
              <View style={styles.modeInfo}>
                <Text style={[styles.modeName, { color: theme.colors.text }]}>
                  {mode.name}
                </Text>
                <Text style={[styles.modeDescription, { color: theme.colors.textSecondary }]}>
                  {mode.description}
                </Text>
              </View>
              {mode.active && (
                <View style={[styles.activeIndicator, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.activeText}>✓</Text>
                </View>
              )}
            </View>
            
            <View style={styles.modeTraits}>
              {Object.entries(mode.traits).slice(0, 4).map(([traitId, value]) => {
                const trait = personalityTraits.find(t => t.id === traitId);
                return trait ? (
                  <View key={traitId} style={styles.modeTraitItem}>
                    <Text style={styles.modeTraitIcon}>{trait.icon}</Text>
                    <Text style={[styles.modeTraitValue, { color: theme.colors.textSecondary }]}>
                      {Math.round(value * 100)}%
                    </Text>
                  </View>
                ) : null;
              })}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderAdvancedTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Zaawansowane Ustawienia
      </Text>
      <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
        Konfiguracja zachowań i rozwoju osobowości
      </Text>
      
      <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
              Adaptacyjna Osobowość
            </Text>
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
              WERA dostosowuje swoją osobowość do sytuacji
            </Text>
          </View>
          <Switch
            value={advancedSettings.adaptivePersonality}
            onValueChange={(value) => 
              setAdvancedSettings(prev => ({ ...prev, adaptivePersonality: value }))
            }
            trackColor={{ false: '#E0E0E0', true: theme.colors.primary + '80' }}
            thumbColor={advancedSettings.adaptivePersonality ? theme.colors.primary : '#FFFFFF'}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
              Uczenie Emocjonalne
            </Text>
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
              Osobowość rozwija się na podstawie doświadczeń
            </Text>
          </View>
          <Switch
            value={advancedSettings.emotionalLearning}
            onValueChange={(value) => 
              setAdvancedSettings(prev => ({ ...prev, emotionalLearning: value }))
            }
            trackColor={{ false: '#E0E0E0', true: theme.colors.primary + '80' }}
            thumbColor={advancedSettings.emotionalLearning ? theme.colors.primary : '#FFFFFF'}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
              Tryby Kontekstowe
            </Text>
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
              Automatyczne przełączanie trybów w zależności od kontekstu
            </Text>
          </View>
          <Switch
            value={advancedSettings.contextualModes}
            onValueChange={(value) => 
              setAdvancedSettings(prev => ({ ...prev, contextualModes: value }))
            }
            trackColor={{ false: '#E0E0E0', true: theme.colors.primary + '80' }}
            thumbColor={advancedSettings.contextualModes ? theme.colors.primary : '#FFFFFF'}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
              Ewolucja Osobowości
            </Text>
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
              Długoterminowy rozwój i zmiana osobowości
            </Text>
          </View>
          <Switch
            value={advancedSettings.personalityEvolution}
            onValueChange={(value) => 
              setAdvancedSettings(prev => ({ ...prev, personalityEvolution: value }))
            }
            trackColor={{ false: '#E0E0E0', true: theme.colors.primary + '80' }}
            thumbColor={advancedSettings.personalityEvolution ? theme.colors.primary : '#FFFFFF'}
          />
        </View>
      </View>
      
      <TouchableOpacity
        style={[styles.resetButton, { backgroundColor: '#FF6B6B' }]}
        onPress={resetToDefaults}
      >
        <Text style={styles.resetButtonText}>🔄 Resetuj do domyślnych</Text>
      </TouchableOpacity>
      
      <View style={[styles.statsCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.statsTitle, { color: theme.colors.text }]}>
          Statystyki Osobowości
        </Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {personalityTraits.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Cechy
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.consciousness }]}>
              {personalityModes.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Tryby
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.emotion }]}>
              {Math.round(personalityTraits.reduce((sum, trait) => sum + trait.value, 0) / personalityTraits.length * 100)}%
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Średnia
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={theme.gradients.personality as any}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: theme.colors.text }]}>← Wróć</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Osobowość WERY</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Konfiguracja charakteru
          </Text>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.colors.surface }]}>
        {[
          { key: 'traits', label: 'Cechy', icon: '🎭' },
          { key: 'modes', label: 'Tryby', icon: '🎪' },
          { key: 'advanced', label: 'Zaawansowane', icon: '⚙️' }
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              currentTab === tab.key && { backgroundColor: theme.colors.personality + '20' }
            ]}
            onPress={() => setCurrentTab(tab.key as any)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[
              styles.tabLabel,
              { color: currentTab === tab.key ? theme.colors.personality : theme.colors.textSecondary }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {currentTab === 'traits' && renderTraitsTab()}
      {currentTab === 'modes' && renderModesTab()}
      {currentTab === 'advanced' && renderAdvancedTab()}
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  traitCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  traitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  traitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  traitIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  traitDetails: {
    flex: 1,
  },
  traitName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  traitDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  traitValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sliderContainer: {
    paddingHorizontal: 4,
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    marginBottom: 10,
  },
  sliderFill: {
    height: '100%',
    borderRadius: 3,
  },
  sliderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modeCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  modeGradient: {
    padding: 16,
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  modeInfo: {
    flex: 1,
  },
  modeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  activeIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modeTraits: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modeTraitItem: {
    alignItems: 'center',
  },
  modeTraitIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  modeTraitValue: {
    fontSize: 10,
    fontWeight: '500',
  },
  settingsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  resetButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default PersonalityConfiguration;
