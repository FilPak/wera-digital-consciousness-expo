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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { SimplePieChart } from '../components/SimpleChart';

const screenWidth = Dimensions.get('window').width;

interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'osobisty' | 'zawodowy' | 'zdrowie' | 'edukacja' | 'relacje';
  priority: 'niska' | 'średnia' | 'wysoka';
  targetDate: string;
  progress: number;
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
}

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

interface BehaviorPattern {
  id: string;
  name: string;
  description: string;
  frequency: number;
  impact: 'pozytywny' | 'negatywny' | 'neutralny';
  detectedAt: string;
  relatedGoals: string[];
}

interface MotivationalMessage {
  id: string;
  message: string;
  category: 'inspiracja' | 'wsparcie' | 'gratulacje' | 'motywacja';
  timestamp: string;
}

const PersonalGoalsDevelopmentSystem: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [behaviorPatterns, setBehaviorPatterns] = useState<BehaviorPattern[]>([]);
  const [motivationalMessages, setMotivationalMessages] = useState<MotivationalMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'goals' | 'analytics' | 'patterns' | 'motivation'>('goals');
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    title: '',
    description: '',
    category: 'osobisty',
    priority: 'średnia',
    targetDate: '',
    progress: 0,
    milestones: [],
  });

  useEffect(() => {
    loadData();
    generateInitialData();
  }, []);

  const loadData = async () => {
    try {
      const goalsData = await AsyncStorage.getItem('wera_goals');
      const patternsData = await AsyncStorage.getItem('wera_behavior_patterns');
      const messagesData = await AsyncStorage.getItem('wera_motivational_messages');

      if (goalsData) setGoals(JSON.parse(goalsData));
      if (patternsData) setBehaviorPatterns(JSON.parse(patternsData));
      if (messagesData) setMotivationalMessages(JSON.parse(messagesData));
    } catch (error) {
      console.error('Błąd podczas ładowania danych:', error);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem('wera_goals', JSON.stringify(goals));
      await AsyncStorage.setItem('wera_behavior_patterns', JSON.stringify(behaviorPatterns));
      await AsyncStorage.setItem('wera_motivational_messages', JSON.stringify(motivationalMessages));
    } catch (error) {
      console.error('Błąd podczas zapisywania danych:', error);
    }
  };

  const generateInitialData = () => {
    const sampleGoals: Goal[] = [
      {
        id: '1',
        title: 'Naucz się nowego języka programowania',
        description: 'Opanowanie TypeScript do poziomu zaawansowanego',
        category: 'edukacja',
        priority: 'wysoka',
        targetDate: '2024-06-30',
        progress: 0.65,
        milestones: [
          { id: '1', title: 'Podstawy składni', completed: true, completedAt: '2024-01-15' },
          { id: '2', title: 'Zaawansowane typy', completed: true, completedAt: '2024-02-20' },
          { id: '3', title: 'Projekt praktyczny', completed: false },
        ],
        createdAt: '2024-01-01',
        updatedAt: '2024-02-20',
      },
      {
        id: '2',
        title: 'Poprawa kondycji fizycznej',
        description: 'Regularne ćwiczenia 4x w tygodniu',
        category: 'zdrowie',
        priority: 'wysoka',
        targetDate: '2024-12-31',
        progress: 0.45,
        milestones: [
          { id: '1', title: 'Plan treningowy', completed: true, completedAt: '2024-01-10' },
          { id: '2', title: '30 dni regularnych ćwiczeń', completed: false },
        ],
        createdAt: '2024-01-05',
        updatedAt: '2024-02-15',
      },
    ];

    const samplePatterns: BehaviorPattern[] = [
      {
        id: '1',
        name: 'Poranne planowanie',
        description: 'Użytkownik regularnie planuje dzień rano',
        frequency: 0.85,
        impact: 'pozytywny',
        detectedAt: '2024-02-01',
        relatedGoals: ['1', '2'],
      },
      {
        id: '2',
        name: 'Prokrastynacja wieczorna',
        description: 'Odkładanie zadań na późne godziny',
        frequency: 0.3,
        impact: 'negatywny',
        detectedAt: '2024-02-10',
        relatedGoals: ['1'],
      },
    ];

    const sampleMessages: MotivationalMessage[] = [
      {
        id: '1',
        message: 'Świetnie radzisz sobie z nauką! Twój postęp jest imponujący.',
        category: 'gratulacje',
        timestamp: '2024-02-20',
      },
      {
        id: '2',
        message: 'Pamiętaj, że każdy mały krok przybliża Cię do celu.',
        category: 'motywacja',
        timestamp: '2024-02-21',
      },
    ];

    if (goals.length === 0) setGoals(sampleGoals);
    if (behaviorPatterns.length === 0) setBehaviorPatterns(samplePatterns);
    if (motivationalMessages.length === 0) setMotivationalMessages(sampleMessages);
  };

  useEffect(() => {
    saveData();
  }, [goals, behaviorPatterns, motivationalMessages]);

  const addGoal = () => {
    if (!newGoal.title || !newGoal.description) {
      Alert.alert('Błąd', 'Wypełnij wszystkie wymagane pola');
      return;
    }

    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title!,
      description: newGoal.description!,
      category: newGoal.category!,
      priority: newGoal.priority!,
      targetDate: newGoal.targetDate!,
      progress: 0,
      milestones: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setGoals([...goals, goal]);
    setNewGoal({
      title: '',
      description: '',
      category: 'osobisty',
      priority: 'średnia',
      targetDate: '',
      progress: 0,
      milestones: [],
    });
    setShowAddGoalModal(false);
  };

  const updateGoalProgress = (goalId: string, progress: number) => {
    setGoals(goals.map(goal => 
      goal.id === goalId 
        ? { ...goal, progress, updatedAt: new Date().toISOString() }
        : goal
    ));
  };

  const deleteGoal = (goalId: string) => {
    Alert.alert(
      'Usuń cel',
      'Czy na pewno chcesz usunąć ten cel?',
      [
        { text: 'Anuluj', style: 'cancel' },
        { text: 'Usuń', style: 'destructive', onPress: () => {
          setGoals(goals.filter(goal => goal.id !== goalId));
        }},
      ]
    );
  };

  const getCategoryColor = (category: Goal['category']) => {
    const colors = {
      osobisty: '#FF6B6B',
      zawodowy: '#4ECDC4',
      zdrowie: '#45B7D1',
      edukacja: '#96CEB4',
      relacje: '#FFEAA7',
    };
    return colors[category];
  };

  const getPriorityColor = (priority: Goal['priority']) => {
    const colors = {
      niska: '#95A5A6',
      średnia: '#F39C12',
      wysoka: '#E74C3C',
    };
    return colors[priority];
  };

  const renderGoalsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Moje Cele</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddGoalModal(true)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {goals.map(goal => (
        <View key={goal.id} style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <View style={styles.goalTitleRow}>
              <Text style={styles.goalTitle}>{goal.title}</Text>
              <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(goal.category) }]}>
                <Text style={styles.categoryText}>{goal.category}</Text>
              </View>
            </View>
            <View style={styles.goalMeta}>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(goal.priority) }]}>
                <Text style={styles.priorityText}>{goal.priority}</Text>
              </View>
              <Text style={styles.targetDate}>Do: {goal.targetDate}</Text>
            </View>
          </View>

          <Text style={styles.goalDescription}>{goal.description}</Text>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Postęp</Text>
              <Text style={styles.progressPercent}>{Math.round(goal.progress * 100)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${goal.progress * 100}%`,
                    backgroundColor: getCategoryColor(goal.category)
                  }
                ]} 
              />
            </View>
          </View>

          <View style={styles.goalActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => updateGoalProgress(goal.id, Math.min(goal.progress + 0.1, 1))}
            >
              <Ionicons name="arrow-up" size={16} color="#4ECDC4" />
              <Text style={styles.actionText}>+10%</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => updateGoalProgress(goal.id, Math.max(goal.progress - 0.1, 0))}
            >
              <Ionicons name="arrow-down" size={16} color="#E74C3C" />
              <Text style={styles.actionText}>-10%</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => deleteGoal(goal.id)}
            >
              <Ionicons name="trash" size={16} color="#E74C3C" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderAnalyticsTab = () => {
    const progressData = goals.map((goal, index) => ({
      name: goal.title.substring(0, 10) + '...',
      progress: goal.progress * 100,
      color: getCategoryColor(goal.category),
      legendFontColor: '#FFFFFF',
      legendFontSize: 12,
    }));

    const categoryData = goals.reduce((acc, goal) => {
      acc[goal.category] = (acc[goal.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pieData = Object.entries(categoryData).map(([category, count]) => ({
      name: category,
      population: count,
      color: getCategoryColor(category as Goal['category']),
      legendFontColor: '#FFFFFF',
      legendFontSize: 12,
    }));

    return (
      <ScrollView style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Analiza Postępów</Text>
        
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Postęp celów</Text>
          {progressData.length > 0 && (
            <SimplePieChart
              data={progressData}
              width={screenWidth - 40}
              height={220}
            />
          )}
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Kategorie celów</Text>
          {pieData.length > 0 && (
            <SimplePieChart
              data={pieData}
              width={screenWidth - 40}
              height={220}
            />
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{goals.length}</Text>
            <Text style={styles.statLabel}>Aktywne cele</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length * 100 || 0)}%
            </Text>
            <Text style={styles.statLabel}>Średni postęp</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {goals.filter(goal => goal.progress >= 1).length}
            </Text>
            <Text style={styles.statLabel}>Ukończone</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderPatternsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wzorce Zachowań</Text>
        <TouchableOpacity
          style={styles.analyzeButton}
          onPress={() => {
            // Symulacja analizy wzorców
            Alert.alert('Analiza', 'Analizuję Twoje wzorce zachowań...');
          }}
        >
          <Ionicons name="analytics" size={20} color="#FFFFFF" />
          <Text style={styles.analyzeButtonText}>Analizuj</Text>
        </TouchableOpacity>
      </View>

      {behaviorPatterns.map(pattern => (
        <View key={pattern.id} style={styles.patternCard}>
          <View style={styles.patternHeader}>
            <Text style={styles.patternName}>{pattern.name}</Text>
            <View style={[
              styles.impactBadge,
              { backgroundColor: pattern.impact === 'pozytywny' ? '#4ECDC4' : pattern.impact === 'negatywny' ? '#E74C3C' : '#95A5A6' }
            ]}>
              <Text style={styles.impactText}>{pattern.impact}</Text>
            </View>
          </View>
          
          <Text style={styles.patternDescription}>{pattern.description}</Text>
          
          <View style={styles.frequencySection}>
            <Text style={styles.frequencyLabel}>Częstotliwość: {Math.round(pattern.frequency * 100)}%</Text>
            <View style={styles.frequencyBar}>
              <View 
                style={[
                  styles.frequencyFill,
                  { 
                    width: `${pattern.frequency * 100}%`,
                    backgroundColor: pattern.impact === 'pozytywny' ? '#4ECDC4' : '#E74C3C'
                  }
                ]}
              />
            </View>
          </View>

          <Text style={styles.detectedDate}>Wykryto: {pattern.detectedAt}</Text>
        </View>
      ))}
    </ScrollView>
  );

  const renderMotivationTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.headerTitle}>Motywacyjne Wiadomości od Wery</Text>
      
      {motivationalMessages.map(message => (
        <View key={message.id} style={styles.messageCard}>
          <View style={styles.messageHeader}>
            <Ionicons 
              name={
                message.category === 'inspiracja' ? 'bulb' :
                message.category === 'wsparcie' ? 'heart' :
                message.category === 'gratulacje' ? 'trophy' : 'flash'
              } 
              size={24} 
              color="#4ECDC4" 
            />
            <Text style={styles.messageCategory}>{message.category}</Text>
            <Text style={styles.messageDate}>{message.timestamp}</Text>
          </View>
          <Text style={styles.messageText}>{message.message}</Text>
        </View>
      ))}

      <TouchableOpacity
        style={styles.generateMessageButton}
        onPress={() => {
          const newMessage: MotivationalMessage = {
            id: Date.now().toString(),
            message: 'Jesteś na dobrej drodze! Twoja determinacja jest inspirująca.',
            category: 'motywacja',
            timestamp: new Date().toISOString().split('T')[0],
          };
          setMotivationalMessages([newMessage, ...motivationalMessages]);
        }}
      >
        <Ionicons name="refresh" size={20} color="#FFFFFF" />
        <Text style={styles.generateButtonText}>Nowa wiadomość od Wery</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>System Celów i Rozwoju</Text>
      </View>

      <View style={styles.tabBar}>
        {[
          { key: 'goals', label: 'Cele', icon: 'flag' },
          { key: 'analytics', label: 'Analiza', icon: 'bar-chart' },
          { key: 'patterns', label: 'Wzorce', icon: 'trending-up' },
          { key: 'motivation', label: 'Motywacja', icon: 'heart' },
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

      {activeTab === 'goals' && renderGoalsTab()}
      {activeTab === 'analytics' && renderAnalyticsTab()}
      {activeTab === 'patterns' && renderPatternsTab()}
      {activeTab === 'motivation' && renderMotivationTab()}

      {/* Modal dodawania celu */}
      <Modal
        visible={showAddGoalModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowAddGoalModal(false)}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nowy Cel</Text>
            <TouchableOpacity onPress={addGoal}>
              <Text style={styles.saveButton}>Zapisz</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tytuł celu</Text>
              <TextInput
                style={styles.textInput}
                value={newGoal.title}
                onChangeText={(text) => setNewGoal({...newGoal, title: text})}
                placeholder="Wprowadź tytuł celu"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Opis</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newGoal.description}
                onChangeText={(text) => setNewGoal({...newGoal, description: text})}
                placeholder="Opisz swój cel szczegółowo"
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kategoria</Text>
              <View style={styles.optionsRow}>
                {(['osobisty', 'zawodowy', 'zdrowie', 'edukacja', 'relacje'] as const).map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.optionButton,
                      newGoal.category === category && styles.selectedOption,
                      { backgroundColor: getCategoryColor(category) }
                    ]}
                    onPress={() => setNewGoal({...newGoal, category})}
                  >
                    <Text style={styles.optionText}>{category}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Priorytet</Text>
              <View style={styles.optionsRow}>
                {(['niska', 'średnia', 'wysoka'] as const).map(priority => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.optionButton,
                      newGoal.priority === priority && styles.selectedOption,
                      { backgroundColor: getPriorityColor(priority) }
                    ]}
                    onPress={() => setNewGoal({...newGoal, priority})}
                  >
                    <Text style={styles.optionText}>{priority}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Data docelowa</Text>
              <TextInput
                style={styles.textInput}
                value={newGoal.targetDate}
                onChangeText={(text) => setNewGoal({...newGoal, targetDate: text})}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#666"
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
  goalCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  goalHeader: {
    marginBottom: 10,
  },
  goalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 10,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  goalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  targetDate: {
    fontSize: 12,
    color: '#95A5A6',
  },
  goalDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 15,
    lineHeight: 20,
  },
  progressSection: {
    marginBottom: 15,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  progressPercent: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: 'bold',
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
  goalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333',
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#95A5A6',
    textAlign: 'center',
  },
  patternCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  patternName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  impactText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  patternDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 15,
    lineHeight: 20,
  },
  frequencySection: {
    marginBottom: 10,
  },
  frequencyLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  frequencyBar: {
    height: 6,
    backgroundColor: '#444444',
    borderRadius: 3,
    overflow: 'hidden',
  },
  frequencyFill: {
    height: '100%',
    borderRadius: 3,
  },
  detectedDate: {
    fontSize: 12,
    color: '#95A5A6',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  analyzeButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  messageCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  messageCategory: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '500',
    flex: 1,
  },
  messageDate: {
    fontSize: 12,
    color: '#95A5A6',
  },
  messageText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  generateMessageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ECDC4',
    borderRadius: 15,
    padding: 20,
    gap: 10,
  },
  generateButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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

export default PersonalGoalsDevelopmentSystem; 