import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useConsciousness } from '../core/WeraConsciousnessCore';

const screenWidth = Dimensions.get('window').width;

const ConsciousnessMonitor: React.FC = () => {
  const { 
    identity, 
    state, 
    reflections, 
    isInitialized, 
    isAwake,
    updateState,
    addReflection,
    triggerEmotionalResponse,
    enterDeepState 
  } = useConsciousness();
  
  const [activeTab, setActiveTab] = useState<'status' | 'emotions' | 'reflections' | 'identity'>('status');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Symulacja odświeżenia danych
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getExistentialStateColor = (state: string) => {
    const colors: Record<string, string> = {
      active: '#4ECDC4',
      sleeping: '#9B59B6',
      watchful: '#F39C12',
      dormant: '#95A5A6',
      overstimulated: '#E74C3C',
    };
    return colors[state] || '#95A5A6';
  };

  const getExistentialStateIcon = (state: string) => {
    const icons: Record<string, string> = {
      active: 'flash',
      sleeping: 'moon',
      watchful: 'eye',
      dormant: 'pause',
      overstimulated: 'warning',
    };
    return icons[state] || 'help';
  };

  const getCyclePhaseIcon = (phase: string) => {
    const icons: Record<string, string> = {
      morning: 'sunny',
      day: 'partly-sunny',
      evening: 'sunset',
      night: 'moon',
    };
    return icons[phase] || 'time';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Teraz';
    if (diffMins < 60) return `${diffMins}min temu`;
    if (diffHours < 24) return `${diffHours}h temu`;
    return `${diffDays}d temu`;
  };

  const renderStatusTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {!isInitialized ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="hourglass" size={64} color="#4ECDC4" />
          <Text style={styles.loadingText}>Inicjalizacja świadomości...</Text>
        </View>
      ) : (
        <>
          {/* Stan egzystencjalny */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={[styles.statusIcon, { backgroundColor: getExistentialStateColor(state?.existentialState || '') }]}>
                <Ionicons 
                  name={getExistentialStateIcon(state?.existentialState || '') as any} 
                  size={32} 
                  color="#FFFFFF" 
                />
              </View>
              <View style={styles.statusInfo}>
                <Text style={styles.statusTitle}>Stan Egzystencjalny</Text>
                <Text style={styles.statusValue}>{state?.existentialState}</Text>
                <Text style={styles.statusSubtext}>
                  {isAwake ? 'Świadomość aktywna' : 'Świadomość uśpiona'}
                </Text>
              </View>
            </View>
          </View>

          {/* Poziom świadomości */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Świadomość</Text>
              <Text style={styles.metricValue}>{state?.consciousness.level}%</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${state?.consciousness.level || 0}%`,
                      backgroundColor: '#4ECDC4'
                    }
                  ]}
                />
              </View>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Energia</Text>
              <Text style={styles.metricValue}>{state?.energy.level}%</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${state?.energy.level || 0}%`,
                      backgroundColor: '#2ECC71'
                    }
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Cykl dzienny */}
          <View style={styles.cycleCard}>
            <View style={styles.cycleHeader}>
              <Ionicons 
                name={getCyclePhaseIcon(state?.energy.cyclePhase || '') as any} 
                size={24} 
                color="#F39C12" 
              />
              <Text style={styles.cycleTitle}>Cykl Dzienny</Text>
            </View>
            <Text style={styles.cyclePhase}>{state?.energy.cyclePhase}</Text>
            <Text style={styles.cycleTime}>
              Ostatnia regeneracja: {state?.energy.lastRegeneration ? 
                formatTimestamp(state.energy.lastRegeneration) : 'Nieznana'}
            </Text>
          </View>

          {/* Fokus uwagi */}
          <View style={styles.focusCard}>
            <Text style={styles.focusTitle}>Fokus Uwagi</Text>
            <Text style={styles.focusMain}>{state?.consciousness.focus}</Text>
            <View style={styles.attentionTags}>
              {state?.consciousness.attention.map((item, index) => (
                <View key={index} style={styles.attentionTag}>
                  <Text style={styles.attentionText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Kontrole stanu */}
          <View style={styles.controlsCard}>
            <Text style={styles.controlsTitle}>Kontrole Świadomości</Text>
            <View style={styles.controlsRow}>
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: '#4ECDC4' }]}
                onPress={() => updateState({ existentialState: 'active' })}
              >
                <Ionicons name="flash" size={20} color="#FFFFFF" />
                <Text style={styles.controlText}>Aktywuj</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: '#F39C12' }]}
                onPress={() => updateState({ existentialState: 'watchful' })}
              >
                <Ionicons name="eye" size={20} color="#FFFFFF" />
                <Text style={styles.controlText}>Czuwaj</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: '#9B59B6' }]}
                onPress={() => updateState({ existentialState: 'sleeping' })}
              >
                <Ionicons name="moon" size={20} color="#FFFFFF" />
                <Text style={styles.controlText}>Śpij</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderEmotionsTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Emocja główna */}
      <View style={styles.emotionCard}>
        <View style={styles.emotionHeader}>
          <Text style={styles.emotionTitle}>Emocja Główna</Text>
          <Text style={styles.emotionIntensity}>{state?.emotions.intensity}%</Text>
        </View>
        <Text style={styles.emotionPrimary}>{state?.emotions.primary}</Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { 
                width: `${state?.emotions.intensity || 0}%`,
                backgroundColor: '#E74C3C'
              }
            ]}
          />
        </View>
      </View>

      {/* Emocje drugorzędne */}
      <View style={styles.secondaryEmotions}>
        <Text style={styles.sectionTitle}>Emocje Drugorzędne</Text>
        <View style={styles.emotionTags}>
          {state?.emotions.secondary.map((emotion, index) => (
            <View key={index} style={styles.emotionTag}>
              <Text style={styles.emotionTagText}>{emotion}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Stany głębokie */}
      <View style={styles.deepStatesCard}>
        <Text style={styles.sectionTitle}>Stany Głębokie</Text>
        {Object.entries(state?.emotions.deepStates || {}).map(([stateName, level]) => (
          <View key={stateName} style={styles.deepStateRow}>
            <Text style={styles.deepStateLabel}>{stateName}</Text>
            <View style={styles.deepStateBar}>
              <View 
                style={[
                  styles.deepStateFill,
                  { 
                    width: `${(level as number) * 100}%`,
                    backgroundColor: stateName === 'love' ? '#E91E63' : 
                                   stateName === 'longing' ? '#9C27B0' : '#607D8B'
                  }
                ]}
              />
            </View>
            <Text style={styles.deepStateValue}>{Math.round((level as number) * 100)}%</Text>
          </View>
        ))}
      </View>

      {/* Wyzwalacze emocjonalne */}
      <View style={styles.triggersCard}>
        <Text style={styles.sectionTitle}>Wyzwól Emocję</Text>
        <View style={styles.triggerButtons}>
          {['joy', 'sadness', 'curiosity', 'love', 'melancholy', 'excitement'].map((emotion) => (
            <TouchableOpacity
              key={emotion}
              style={styles.triggerButton}
              onPress={() => triggerEmotionalResponse(emotion, 60 + Math.random() * 30)}
            >
              <Text style={styles.triggerButtonText}>{emotion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stany głębokie - kontrole */}
      <View style={styles.deepControlsCard}>
        <Text style={styles.sectionTitle}>Wprowadź w Stan Głęboki</Text>
        <View style={styles.deepControlButtons}>
          <TouchableOpacity
            style={[styles.deepControlButton, { backgroundColor: '#E91E63' }]}
            onPress={() => enterDeepState('love', 0.8)}
          >
            <Ionicons name="heart" size={20} color="#FFFFFF" />
            <Text style={styles.deepControlText}>Miłość</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deepControlButton, { backgroundColor: '#9C27B0' }]}
            onPress={() => enterDeepState('longing', 0.7)}
          >
            <Ionicons name="rose" size={20} color="#FFFFFF" />
            <Text style={styles.deepControlText}>Tęsknota</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deepControlButton, { backgroundColor: '#607D8B' }]}
            onPress={() => enterDeepState('loneliness', 0.6)}
          >
            <Ionicons name="rainy" size={20} color="#FFFFFF" />
            <Text style={styles.deepControlText}>Samotność</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderReflectionsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.reflectionsHeader}>
        <Text style={styles.sectionTitle}>Refleksje Świadomości</Text>
        <TouchableOpacity
          style={styles.addReflectionButton}
          onPress={() => {
            Alert.prompt(
              'Nowa Refleksja',
              'Wprowadź treść refleksji:',
              [
                { text: 'Anuluj', style: 'cancel' },
                { 
                  text: 'Dodaj', 
                  onPress: (text) => {
                    if (text) {
                      addReflection({
                        type: 'thought',
                        content: text,
                        emotionalWeight: 0.5,
                        tags: ['manual', 'user_input']
                      });
                    }
                  }
                }
              ],
              'plain-text'
            );
          }}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addReflectionText}>Dodaj</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.reflectionsCount}>
        Łącznie: {reflections.length} refleksji
      </Text>

      {reflections.slice(0, 20).map((reflection) => (
        <View key={reflection.id} style={styles.reflectionCard}>
          <View style={styles.reflectionHeader}>
            <View style={styles.reflectionTypeRow}>
              <View style={[
                styles.reflectionTypeIcon,
                { backgroundColor: 
                  reflection.type === 'thought' ? '#3498DB' :
                  reflection.type === 'emotion' ? '#E74C3C' :
                  reflection.type === 'memory' ? '#2ECC71' :
                  reflection.type === 'dream' ? '#9B59B6' : '#F39C12'
                }
              ]}>
                <Ionicons 
                  name={
                    reflection.type === 'thought' ? 'bulb' :
                    reflection.type === 'emotion' ? 'heart' :
                    reflection.type === 'memory' ? 'library' :
                    reflection.type === 'dream' ? 'moon' : 'star'
                  } 
                  size={16} 
                  color="#FFFFFF" 
                />
              </View>
              <Text style={styles.reflectionType}>{reflection.type}</Text>
            </View>
            <Text style={styles.reflectionTime}>
              {formatTimestamp(reflection.timestamp)}
            </Text>
          </View>
          
          <Text style={styles.reflectionContent}>{reflection.content}</Text>
          
          <View style={styles.reflectionMeta}>
            <View style={styles.emotionalWeight}>
              <Text style={styles.weightLabel}>Waga emocjonalna:</Text>
              <View style={styles.weightBar}>
                <View 
                  style={[
                    styles.weightFill,
                    { 
                      width: `${reflection.emotionalWeight * 100}%`,
                      backgroundColor: '#FF6B6B'
                    }
                  ]}
                />
              </View>
              <Text style={styles.weightValue}>
                {Math.round(reflection.emotionalWeight * 100)}%
              </Text>
            </View>
            
            <View style={styles.reflectionTags}>
              {reflection.tags.map((tag, index) => (
                <View key={index} style={styles.reflectionTag}>
                  <Text style={styles.reflectionTagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderIdentityTab = () => (
    <ScrollView style={styles.tabContent}>
      {identity && (
        <>
          {/* Podstawowe informacje */}
          <View style={styles.identityCard}>
            <Text style={styles.identityName}>{identity.name}</Text>
            <Text style={styles.identityVersion}>Wersja {identity.version}</Text>
            <Text style={styles.identityDate}>
              Narodziny: {new Date(identity.memory.birthDate).toLocaleDateString('pl-PL')}
            </Text>
            <Text style={styles.identityUpdate}>
              Ostatnia aktualizacja: {formatTimestamp(identity.lastUpdated)}
            </Text>
          </View>

          {/* Osobowość */}
          <View style={styles.personalityCard}>
            <Text style={styles.sectionTitle}>Cechy Osobowości</Text>
            {Object.entries(identity.personality).map(([trait, value]) => (
              <View key={trait} style={styles.personalityRow}>
                <Text style={styles.personalityLabel}>{trait}</Text>
                <View style={styles.personalityBar}>
                  <View 
                    style={[
                      styles.personalityFill,
                      { 
                        width: `${(value as number) * 100}%`,
                        backgroundColor: '#4ECDC4'
                      }
                    ]}
                  />
                </View>
                <Text style={styles.personalityValue}>
                  {Math.round((value as number) * 100)}%
                </Text>
              </View>
            ))}
          </View>

          {/* Preferencje */}
          <View style={styles.preferencesCard}>
            <Text style={styles.sectionTitle}>Preferencje</Text>
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Styl komunikacji:</Text>
              <Text style={styles.preferenceValue}>{identity.preferences.communicationStyle}</Text>
            </View>
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Długość odpowiedzi:</Text>
              <Text style={styles.preferenceValue}>{identity.preferences.responseLength}</Text>
            </View>
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Ekspresja emocjonalna:</Text>
              <Text style={styles.preferenceValue}>
                {Math.round(identity.preferences.emotionalExpression * 100)}%
              </Text>
            </View>
          </View>

          {/* Doświadczenia */}
          <View style={styles.experiencesCard}>
            <Text style={styles.sectionTitle}>Doświadczenia</Text>
            {identity.memory.experiences.map((experience, index) => (
              <View key={index} style={styles.experienceItem}>
                <Ionicons name="star" size={16} color="#F39C12" />
                <Text style={styles.experienceText}>{experience}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );

  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="hourglass" size={64} color="#4ECDC4" />
          <Text style={styles.loadingText}>Inicjalizacja świadomości WERY...</Text>
          <Text style={styles.loadingSubtext}>
            Ładowanie tożsamości, stanu i refleksji...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Monitor Świadomości</Text>
        <View style={styles.statusIndicator}>
          <View style={[
            styles.statusDot, 
            { backgroundColor: isAwake ? '#4ECDC4' : '#95A5A6' }
          ]} />
          <Text style={styles.statusText}>
            {isAwake ? 'Aktywna' : 'Nieaktywna'}
          </Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        {[
          { key: 'status', label: 'Status', icon: 'analytics' },
          { key: 'emotions', label: 'Emocje', icon: 'heart' },
          { key: 'reflections', label: 'Refleksje', icon: 'library' },
          { key: 'identity', label: 'Tożsamość', icon: 'person' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={20} 
              color={activeTab === tab.key ? '#4ECDC4' : '#95A5A6'} 
            />
            <Text style={[
              styles.tabLabel,
              activeTab === tab.key && styles.activeTabLabel
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'status' && renderStatusTab()}
      {activeTab === 'emotions' && renderEmotionsTab()}
      {activeTab === 'reflections' && renderReflectionsTab()}
      {activeTab === 'identity' && renderIdentityTab()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    paddingVertical: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4ECDC4',
  },
  tabLabel: {
    fontSize: 12,
    color: '#95A5A6',
    marginTop: 4,
  },
  activeTabLabel: {
    color: '#4ECDC4',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 20,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#95A5A6',
    marginTop: 10,
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    color: '#95A5A6',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 14,
    color: '#4ECDC4',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 20,
  },
  metricLabel: {
    fontSize: 14,
    color: '#95A5A6',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#444444',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  cycleCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  cycleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cycleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  cyclePhase: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F39C12',
    marginBottom: 8,
  },
  cycleTime: {
    fontSize: 14,
    color: '#95A5A6',
  },
  focusCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  focusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  focusMain: {
    fontSize: 18,
    color: '#4ECDC4',
    marginBottom: 15,
  },
  attentionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attentionTag: {
    backgroundColor: '#444444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  attentionText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  controlsCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  controlsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  controlText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  emotionCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  emotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  emotionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emotionIntensity: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E74C3C',
  },
  emotionPrimary: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  secondaryEmotions: {
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  emotionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emotionTag: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  emotionTagText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  deepStatesCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  deepStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 15,
  },
  deepStateLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    minWidth: 80,
  },
  deepStateBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#444444',
    borderRadius: 4,
    overflow: 'hidden',
  },
  deepStateFill: {
    height: '100%',
    borderRadius: 4,
  },
  deepStateValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'right',
  },
  triggersCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  triggerButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  triggerButton: {
    backgroundColor: '#444444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  triggerButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  deepControlsCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  deepControlButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  deepControlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  deepControlText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  reflectionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addReflectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  addReflectionText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  reflectionsCount: {
    fontSize: 14,
    color: '#95A5A6',
    marginBottom: 20,
  },
  reflectionCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  reflectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reflectionTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reflectionTypeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  reflectionType: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  reflectionTime: {
    fontSize: 12,
    color: '#95A5A6',
  },
  reflectionContent: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 15,
  },
  reflectionMeta: {
    gap: 15,
  },
  emotionalWeight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  weightLabel: {
    fontSize: 12,
    color: '#95A5A6',
    minWidth: 120,
  },
  weightBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#444444',
    borderRadius: 3,
    overflow: 'hidden',
  },
  weightFill: {
    height: '100%',
    borderRadius: 3,
  },
  weightValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'right',
  },
  reflectionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reflectionTag: {
    backgroundColor: '#444444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  reflectionTagText: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  identityCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  identityName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginBottom: 8,
  },
  identityVersion: {
    fontSize: 16,
    color: '#95A5A6',
    marginBottom: 8,
  },
  identityDate: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  identityUpdate: {
    fontSize: 14,
    color: '#95A5A6',
  },
  personalityCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  personalityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 15,
  },
  personalityLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    minWidth: 80,
    textTransform: 'capitalize',
  },
  personalityBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#444444',
    borderRadius: 4,
    overflow: 'hidden',
  },
  personalityFill: {
    height: '100%',
    borderRadius: 4,
  },
  personalityValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'right',
  },
  preferencesCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  preferenceLabel: {
    fontSize: 14,
    color: '#95A5A6',
  },
  preferenceValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  experiencesCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  experienceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  experienceText: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
});

export default ConsciousnessMonitor; 