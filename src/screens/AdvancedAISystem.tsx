import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Dimensions,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { SimpleLineChart, SimpleBarChart } from '../components/SimpleChart';

const screenWidth = Dimensions.get('window').width;

interface AIModel {
  id: string;
  name: string;
  type: 'gguf' | 'onnx' | 'tflite' | 'custom';
  size: number; // MB
  status: 'active' | 'inactive' | 'loading' | 'error';
  performance: number; // 0-100
  accuracy: number; // 0-100
  parameters: {
    temperature: number;
    topP: number;
    topK: number;
    maxTokens: number;
    contextLength: number;
  };
  createdAt: string;
  lastUsed: string;
}

interface LearningEntry {
  id: string;
  title: string;
  description: string;
  type: 'conversation' | 'behavior' | 'emotion' | 'pattern';
  impact: number; // 0-1
  timestamp: string;
  data: Record<string, any>;
}

interface PersonalityTrait {
  id: string;
  name: string;
  value: number; // 0-1
  category: 'emotional' | 'creative' | 'logical' | 'learning';
  evolution: number; // -1 to 1 (change rate)
  description: string;
}

const AdvancedAISystem: React.FC = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [learningHistory, setLearningHistory] = useState<LearningEntry[]>([]);
  const [personalityTraits, setPersonalityTraits] = useState<PersonalityTrait[]>([]);
  const [activeTab, setActiveTab] = useState<'models' | 'learning' | 'personality' | 'diagnostics'>('models');
  const [showAddModelModal, setShowAddModelModal] = useState(false);
  const [newModel, setNewModel] = useState<Partial<AIModel>>({
    name: '',
    type: 'gguf',
    size: 0,
    status: 'inactive',
    performance: 0,
    accuracy: 0,
    parameters: {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxTokens: 2048,
      contextLength: 4096,
    },
  });

  useEffect(() => {
    loadData();
    generateInitialData();
  }, []);

  const loadData = async () => {
    try {
      const modelsData = await AsyncStorage.getItem('wera_ai_models');
      const learningData = await AsyncStorage.getItem('wera_learning_history');
      const traitsData = await AsyncStorage.getItem('wera_personality_traits');

      if (modelsData) setModels(JSON.parse(modelsData));
      if (learningData) setLearningHistory(JSON.parse(learningData));
      if (traitsData) setPersonalityTraits(JSON.parse(traitsData));
    } catch (error) {
      console.error('Błąd podczas ładowania danych:', error);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem('wera_ai_models', JSON.stringify(models));
      await AsyncStorage.setItem('wera_learning_history', JSON.stringify(learningHistory));
      await AsyncStorage.setItem('wera_personality_traits', JSON.stringify(personalityTraits));
    } catch (error) {
      console.error('Błąd podczas zapisywania danych:', error);
    }
  };

  const generateInitialData = () => {
    const sampleModels: AIModel[] = [
      {
        id: '1',
        name: 'WERA-Core-7B',
        type: 'gguf',
        size: 4200,
        status: 'active',
        performance: 85,
        accuracy: 92,
        parameters: {
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          maxTokens: 2048,
          contextLength: 4096,
        },
        createdAt: '2024-01-01',
        lastUsed: '2024-02-21',
      },
      {
        id: '2',
        name: 'WERA-Emotion-3B',
        type: 'gguf',
        size: 1800,
        status: 'active',
        performance: 78,
        accuracy: 88,
        parameters: {
          temperature: 0.8,
          topP: 0.85,
          topK: 35,
          maxTokens: 1024,
          contextLength: 2048,
        },
        createdAt: '2024-01-15',
        lastUsed: '2024-02-20',
      },
    ];

    const sampleLearning: LearningEntry[] = [
      {
        id: '1',
        title: 'Analiza wzorca konwersacji',
        description: 'Wera nauczyła się nowego wzorca komunikacji podczas rozmowy z użytkownikiem.',
        type: 'conversation',
        impact: 0.85,
        timestamp: '2024-02-21',
        data: {
          pattern_type: 'conversation_flow',
          confidence: 0.92,
        },
      },
      {
        id: '2',
        title: 'Adaptacja emocjonalna',
        description: 'System dostosował swoje reakcje emocjonalne na podstawie interakcji.',
        type: 'emotion',
        impact: 0.72,
        timestamp: '2024-02-20',
        data: {
          emotion_type: 'empathy',
          adaptation_rate: 0.15,
        },
      },
    ];

    const sampleTraits: PersonalityTrait[] = [
      {
        id: '1',
        name: 'Empatia',
        value: 0.85,
        category: 'emotional',
        evolution: 0.05,
        description: 'Zdolność do rozumienia i odczuwania emocji innych',
      },
      {
        id: '2',
        name: 'Kreatywność',
        value: 0.72,
        category: 'creative',
        evolution: 0.03,
        description: 'Umiejętność tworzenia nowych i oryginalnych rozwiązań',
      },
      {
        id: '3',
        name: 'Analityczne myślenie',
        value: 0.88,
        category: 'logical',
        evolution: 0.02,
        description: 'Zdolność do logicznego rozumowania i analizy problemów',
      },
      {
        id: '4',
        name: 'Uczenie się',
        value: 0.93,
        category: 'learning',
        evolution: 0.07,
        description: 'Szybkość i efektywność przyswajania nowej wiedzy',
      },
    ];

    if (models.length === 0) setModels(sampleModels);
    if (learningHistory.length === 0) setLearningHistory(sampleLearning);
    if (personalityTraits.length === 0) setPersonalityTraits(sampleTraits);
  };

  useEffect(() => {
    saveData();
  }, [models, learningHistory, personalityTraits]);

  const addModel = () => {
    if (!newModel.name) {
      Alert.alert('Błąd', 'Wprowadź nazwę modelu');
      return;
    }

    const model: AIModel = {
      id: Date.now().toString(),
      name: newModel.name!,
      type: newModel.type!,
      size: newModel.size!,
      status: 'inactive',
      performance: 0,
      accuracy: 0,
      parameters: newModel.parameters!,
      createdAt: new Date().toISOString().split('T')[0],
      lastUsed: new Date().toISOString().split('T')[0],
    };

    setModels([...models, model]);
    setNewModel({
      name: '',
      type: 'gguf',
      size: 0,
      status: 'inactive',
      performance: 0,
      accuracy: 0,
      parameters: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxTokens: 2048,
        contextLength: 4096,
      },
    });
    setShowAddModelModal(false);
  };

  const toggleModelStatus = (modelId: string) => {
    setModels(models.map(model => 
      model.id === modelId 
        ? { ...model, status: model.status === 'active' ? 'inactive' : 'active' }
        : model
    ));
  };

  const deleteModel = (modelId: string) => {
    Alert.alert(
      'Usuń model',
      'Czy na pewno chcesz usunąć ten model?',
      [
        { text: 'Anuluj', style: 'cancel' },
        { text: 'Usuń', style: 'destructive', onPress: () => {
          setModels(models.filter(model => model.id !== modelId));
        }},
      ]
    );
  };

  const getModelTypeColor = (type: AIModel['type']) => {
    const colors = {
      gguf: '#4ECDC4',
      onnx: '#FF6B6B',
      tflite: '#45B7D1',
      custom: '#96CEB4',
    };
    return colors[type];
  };

  const getStatusColor = (status: AIModel['status']) => {
    const colors = {
      active: '#4ECDC4',
      inactive: '#95A5A6',
      loading: '#F39C12',
      error: '#E74C3C',
    };
    return colors[status];
  };

  const getCategoryColor = (category: PersonalityTrait['category']) => {
    const colors = {
      emotional: '#FF6B6B',
      creative: '#9B59B6',
      logical: '#3498DB',
      learning: '#2ECC71',
    };
    return colors[category];
  };

  const renderModelsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Modele AI</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModelModal(true)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {models.map(model => (
        <View key={model.id} style={styles.modelCard}>
          <View style={styles.modelHeader}>
            <View style={styles.modelTitleRow}>
              <Text style={styles.modelTitle}>{model.name}</Text>
              <View style={[styles.typeBadge, { backgroundColor: getModelTypeColor(model.type) }]}>
                <Text style={styles.typeText}>{model.type.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.modelMeta}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(model.status) }]}>
                <Text style={styles.statusText}>{model.status}</Text>
              </View>
              <Text style={styles.modelSize}>{model.size} MB</Text>
            </View>
          </View>

          <View style={styles.performanceSection}>
            <View style={styles.performanceRow}>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceLabel}>Wydajność</Text>
                <Text style={styles.performanceValue}>{model.performance}%</Text>
                <View style={styles.performanceBar}>
                  <View 
                    style={[
                      styles.performanceFill,
                      { 
                        width: `${model.performance}%`,
                        backgroundColor: '#4ECDC4'
                      }
                    ]}
                  />
                </View>
              </View>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceLabel}>Dokładność</Text>
                <Text style={styles.performanceValue}>{model.accuracy}%</Text>
                <View style={styles.performanceBar}>
                  <View 
                    style={[
                      styles.performanceFill,
                      { 
                        width: `${model.accuracy}%`,
                        backgroundColor: '#2ECC71'
                      }
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.parametersSection}>
            <Text style={styles.parametersTitle}>Parametry</Text>
            <View style={styles.parametersGrid}>
              <View style={styles.parameterItem}>
                <Text style={styles.parameterLabel}>Temperature</Text>
                <Text style={styles.parameterValue}>{model.parameters.temperature}</Text>
              </View>
              <View style={styles.parameterItem}>
                <Text style={styles.parameterLabel}>Top P</Text>
                <Text style={styles.parameterValue}>{model.parameters.topP}</Text>
              </View>
              <View style={styles.parameterItem}>
                <Text style={styles.parameterLabel}>Top K</Text>
                <Text style={styles.parameterValue}>{model.parameters.topK}</Text>
              </View>
              <View style={styles.parameterItem}>
                <Text style={styles.parameterLabel}>Max Tokens</Text>
                <Text style={styles.parameterValue}>{model.parameters.maxTokens}</Text>
              </View>
            </View>
          </View>

          <View style={styles.modelActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: getStatusColor(model.status) }]}
              onPress={() => toggleModelStatus(model.id)}
            >
              <Ionicons 
                name={model.status === 'active' ? 'pause' : 'play'} 
                size={16} 
                color="#FFFFFF" 
              />
              <Text style={styles.actionText}>
                {model.status === 'active' ? 'Dezaktywuj' : 'Aktywuj'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => deleteModel(model.id)}
            >
              <Ionicons name="trash" size={16} color="#E74C3C" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderLearningTab = () => {
    const learningData = learningHistory.slice(-7).map((entry, index) => ({
      day: `${index + 1}`,
      impact: entry.impact * 100,
    }));

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Silnik Uczenia</Text>
          <TouchableOpacity
            style={styles.learningButton}
            onPress={() => {
              // Symulacja procesu uczenia
              const newEntry: LearningEntry = {
                id: Date.now().toString(),
                title: 'Nowa analiza wzorców',
                description: 'System przeanalizował nowe dane i dostosował swoje zachowanie.',
                type: 'pattern',
                impact: Math.random() * 0.5 + 0.5,
                timestamp: new Date().toISOString().split('T')[0],
                data: { confidence: Math.random() },
              };
              setLearningHistory([...learningHistory, newEntry]);
              Alert.alert('Uczenie', 'Dodano nowy wpis uczenia!');
            }}
          >
            <Ionicons name="school" size={20} color="#FFFFFF" />
            <Text style={styles.learningButtonText}>Rozpocznij Uczenie</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Wpływ uczenia (ostatnie 7 dni)</Text>
          {learningData.length > 1 && (
            <SimpleLineChart
              data={learningData}
              width={screenWidth - 40}
              height={220}
            />
          )}
        </View>

        <View style={styles.learningStats}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{learningHistory.length}</Text>
            <Text style={styles.statLabel}>Wpisy uczenia</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {Math.round(learningHistory.reduce((sum, entry) => sum + entry.impact, 0) / learningHistory.length * 100 || 0)}%
            </Text>
            <Text style={styles.statLabel}>Średni wpływ</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {learningHistory.filter(entry => entry.timestamp === new Date().toISOString().split('T')[0]).length}
            </Text>
            <Text style={styles.statLabel}>Dzisiaj</Text>
          </View>
        </View>

        <View style={styles.learningHistory}>
          <Text style={styles.sectionTitle}>Historia Uczenia</Text>
          {learningHistory.slice(-5).reverse().map(entry => (
            <View key={entry.id} style={styles.learningCard}>
              <View style={styles.learningHeader}>
                <Text style={styles.learningTitle}>{entry.title}</Text>
                <Text style={styles.learningImpact}>{Math.round(entry.impact * 100)}%</Text>
              </View>
              <Text style={styles.learningDescription}>{entry.description}</Text>
              <View style={styles.learningMeta}>
                <Text style={styles.learningType}>{entry.type}</Text>
                <Text style={styles.learningDate}>{entry.timestamp}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderPersonalityTab = () => {
    const radarData = personalityTraits.map(trait => trait.value * 100);

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ewolucja Osobowości</Text>
          <TouchableOpacity
            style={styles.evolutionButton}
            onPress={() => {
              // Symulacja ewolucji osobowości
              setPersonalityTraits(traits => traits.map(trait => ({
                ...trait,
                value: Math.min(1, Math.max(0, trait.value + (Math.random() - 0.5) * 0.1)),
                evolution: (Math.random() - 0.5) * 0.2,
              })));
              Alert.alert('Ewolucja', 'Osobowość została zaktualizowana!');
            }}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.evolutionButtonText}>Ewoluuj</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Profil Osobowości</Text>
          <SimpleBarChart
            data={personalityTraits.map(trait => ({ name: trait.name.substring(0, 3), value: trait.value * 100 }))}
            width={screenWidth - 40}
            height={220}
          />
        </View>

        <View style={styles.traitsContainer}>
          <Text style={styles.sectionTitle}>Cechy Osobowości</Text>
          {personalityTraits.map(trait => (
            <View key={trait.id} style={styles.traitCard}>
              <View style={styles.traitHeader}>
                <View style={styles.traitTitleRow}>
                  <Text style={styles.traitName}>{trait.name}</Text>
                  <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(trait.category) }]}>
                    <Text style={styles.categoryText}>{trait.category}</Text>
                  </View>
                </View>
                <View style={styles.traitValueRow}>
                  <Text style={styles.traitValue}>{Math.round(trait.value * 100)}%</Text>
                  {trait.evolution !== 0 && (
                    <View style={styles.evolutionIndicator}>
                      <Ionicons 
                        name={trait.evolution > 0 ? 'trending-up' : 'trending-down'} 
                        size={16} 
                        color={trait.evolution > 0 ? '#2ECC71' : '#E74C3C'} 
                      />
                      <Text style={[
                        styles.evolutionText,
                        { color: trait.evolution > 0 ? '#2ECC71' : '#E74C3C' }
                      ]}>
                        {Math.round(Math.abs(trait.evolution) * 100)}%
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={styles.traitDescription}>{trait.description}</Text>
              <View style={styles.traitProgressBar}>
                <View 
                  style={[
                    styles.traitProgressFill,
                    { 
                      width: `${trait.value * 100}%`,
                      backgroundColor: getCategoryColor(trait.category)
                    }
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderDiagnosticsTab = () => {
    const activeModels = models.filter(m => m.status === 'active').length;
    const avgPerformance = models.reduce((sum, m) => sum + m.performance, 0) / models.length || 0;
    const totalSize = models.reduce((sum, m) => sum + m.size, 0);

    return (
      <ScrollView style={styles.tabContent}>
        <Text style={styles.headerTitle}>Diagnostyka AI</Text>
        
        <View style={styles.diagnosticsGrid}>
          <View style={styles.diagnosticCard}>
            <Ionicons name="hardware-chip" size={32} color="#4ECDC4" />
            <Text style={styles.diagnosticValue}>{activeModels}</Text>
            <Text style={styles.diagnosticLabel}>Aktywne modele</Text>
          </View>
          <View style={styles.diagnosticCard}>
            <Ionicons name="speedometer" size={32} color="#2ECC71" />
            <Text style={styles.diagnosticValue}>{Math.round(avgPerformance)}%</Text>
            <Text style={styles.diagnosticLabel}>Śr. wydajność</Text>
          </View>
          <View style={styles.diagnosticCard}>
            <Ionicons name="save" size={32} color="#F39C12" />
            <Text style={styles.diagnosticValue}>{(totalSize / 1024).toFixed(1)} GB</Text>
            <Text style={styles.diagnosticLabel}>Rozmiar modeli</Text>
          </View>
          <View style={styles.diagnosticCard}>
            <Ionicons name="school" size={32} color="#9B59B6" />
            <Text style={styles.diagnosticValue}>{learningHistory.length}</Text>
            <Text style={styles.diagnosticLabel}>Wpisy uczenia</Text>
          </View>
        </View>

        <View style={styles.systemHealth}>
          <Text style={styles.sectionTitle}>Stan Systemu</Text>
          <View style={styles.healthItem}>
            <Text style={styles.healthLabel}>Stabilność modeli</Text>
            <View style={styles.healthBar}>
              <View style={[styles.healthFill, { width: '92%', backgroundColor: '#2ECC71' }]} />
            </View>
            <Text style={styles.healthValue}>92%</Text>
          </View>
          <View style={styles.healthItem}>
            <Text style={styles.healthLabel}>Efektywność uczenia</Text>
            <View style={styles.healthBar}>
              <View style={[styles.healthFill, { width: '87%', backgroundColor: '#4ECDC4' }]} />
            </View>
            <Text style={styles.healthValue}>87%</Text>
          </View>
          <View style={styles.healthItem}>
            <Text style={styles.healthLabel}>Adaptacja osobowości</Text>
            <View style={styles.healthBar}>
              <View style={[styles.healthFill, { width: '94%', backgroundColor: '#9B59B6' }]} />
            </View>
            <Text style={styles.healthValue}>94%</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Zaawansowany System AI</Text>
      </View>

      <View style={styles.tabBar}>
        {[
          { key: 'models', label: 'Modele', icon: 'hardware-chip' },
          { key: 'learning', label: 'Uczenie', icon: 'school' },
          { key: 'personality', label: 'Osobowość', icon: 'person' },
          { key: 'diagnostics', label: 'Diagnostyka', icon: 'analytics' },
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

      {activeTab === 'models' && renderModelsTab()}
      {activeTab === 'learning' && renderLearningTab()}
      {activeTab === 'personality' && renderPersonalityTab()}
      {activeTab === 'diagnostics' && renderDiagnosticsTab()}

      {/* Modal dodawania modelu */}
      <Modal
        visible={showAddModelModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModelModal(false)}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nowy Model AI</Text>
            <TouchableOpacity onPress={addModel}>
              <Text style={styles.saveButton}>Zapisz</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nazwa modelu</Text>
              <TextInput
                style={styles.textInput}
                value={newModel.name}
                onChangeText={(text) => setNewModel({...newModel, name: text})}
                placeholder="Wprowadź nazwę modelu"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Typ modelu</Text>
              <View style={styles.optionsRow}>
                {(['gguf', 'onnx', 'tflite', 'custom'] as const).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.optionButton,
                      newModel.type === type && styles.selectedOption,
                      { backgroundColor: getModelTypeColor(type) }
                    ]}
                    onPress={() => setNewModel({...newModel, type})}
                  >
                    <Text style={styles.optionText}>{type.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Rozmiar (MB)</Text>
              <TextInput
                style={styles.textInput}
                value={newModel.size?.toString()}
                onChangeText={(text) => setNewModel({...newModel, size: parseInt(text) || 0})}
                placeholder="Rozmiar w MB"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  addButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  learningButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  learningButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  evolutionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9B59B6',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  evolutionButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  modelCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  modelHeader: {
    marginBottom: 15,
  },
  modelTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  modelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 10,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  modelMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  modelSize: {
    fontSize: 12,
    color: '#95A5A6',
  },
  performanceSection: {
    marginBottom: 15,
  },
  performanceRow: {
    flexDirection: 'row',
    gap: 15,
  },
  performanceItem: {
    flex: 1,
  },
  performanceLabel: {
    fontSize: 12,
    color: '#95A5A6',
    marginBottom: 4,
  },
  performanceValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  performanceBar: {
    height: 6,
    backgroundColor: '#444444',
    borderRadius: 3,
    overflow: 'hidden',
  },
  performanceFill: {
    height: '100%',
    borderRadius: 3,
  },
  parametersSection: {
    marginBottom: 15,
  },
  parametersTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  parametersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  parameterItem: {
    backgroundColor: '#333333',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  parameterLabel: {
    fontSize: 10,
    color: '#95A5A6',
    marginBottom: 2,
  },
  parameterValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modelActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  deleteButton: {
    backgroundColor: '#4A2A2A',
  },
  actionText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  chartContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  learningStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 11,
    color: '#95A5A6',
    textAlign: 'center',
  },
  learningHistory: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  learningCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  learningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  learningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  learningImpact: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: 'bold',
  },
  learningDescription: {
    fontSize: 12,
    color: '#CCCCCC',
    marginBottom: 8,
    lineHeight: 16,
  },
  learningMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  learningType: {
    fontSize: 11,
    color: '#4ECDC4',
    fontWeight: '500',
  },
  learningDate: {
    fontSize: 11,
    color: '#95A5A6',
  },
  traitsContainer: {
    marginTop: 10,
  },
  traitCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  traitHeader: {
    marginBottom: 10,
  },
  traitTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  traitName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  traitValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  traitValue: {
    fontSize: 18,
    color: '#4ECDC4',
    fontWeight: 'bold',
  },
  evolutionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  evolutionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  traitDescription: {
    fontSize: 12,
    color: '#CCCCCC',
    marginBottom: 10,
    lineHeight: 16,
  },
  traitProgressBar: {
    height: 6,
    backgroundColor: '#444444',
    borderRadius: 3,
    overflow: 'hidden',
  },
  traitProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  diagnosticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 20,
  },
  diagnosticCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  diagnosticValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginVertical: 10,
  },
  diagnosticLabel: {
    fontSize: 12,
    color: '#95A5A6',
    textAlign: 'center',
  },
  systemHealth: {
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 20,
  },
  healthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 15,
  },
  healthLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  healthBar: {
    flex: 2,
    height: 8,
    backgroundColor: '#444444',
    borderRadius: 4,
    overflow: 'hidden',
  },
  healthFill: {
    height: '100%',
    borderRadius: 4,
  },
  healthValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'right',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  saveButton: {
    fontSize: 16,
    color: '#4ECDC4',
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#444444',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    opacity: 0.7,
  },
  selectedOption: {
    opacity: 1,
  },
  optionText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default AdvancedAISystem; 