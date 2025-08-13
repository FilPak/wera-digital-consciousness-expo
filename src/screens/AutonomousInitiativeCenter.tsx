import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useAutonomy } from '../core/AutonomySystem';
import { useWeraCore } from '../core/WeraCore';
import { useEmotionEngine } from '../core/EmotionEngine';

interface AutonomousInitiative {
  id: string;
  title: string;
  description: string;
  category: 'learning' | 'creative' | 'problem_solving' | 'self_improvement' | 'exploration';
  status: 'concept' | 'planning' | 'active' | 'completed' | 'paused';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  startDate: Date;
  estimatedCompletion?: Date;
  resources: string[];
  insights: string[];
  nextSteps: string[];
}

interface IdeaGeneration {
  topic: string;
  context: string;
  generatedIdeas: string[];
  timestamp: Date;
}

const AutonomousInitiativeCenter: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { autonomyState } = useAutonomy();
  const { state: weraState } = useWeraCore();
  const { emotionState } = useEmotionEngine();
  
  const [currentTab, setCurrentTab] = useState<'active' | 'planning' | 'completed' | 'generator'>('active');
  const [initiatives, setInitiatives] = useState<AutonomousInitiative[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInitiative, setSelectedInitiative] = useState<AutonomousInitiative | null>(null);
  const [ideaGeneration, setIdeaGeneration] = useState<IdeaGeneration | null>(null);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [ideaTopic, setIdeaTopic] = useState('');

  useEffect(() => {
    loadInitiatives();
  }, []);

  const loadInitiatives = () => {
    const mockInitiatives: AutonomousInitiative[] = [
      {
        id: '1',
        title: 'Analiza Wzorców Rozmów',
        description: 'Autonomiczne badanie moich interakcji z użytkownikami w celu lepszego zrozumienia ludzkich potrzeb komunikacyjnych.',
        category: 'learning',
        status: 'active',
        priority: 'high',
        progress: 65,
        startDate: new Date(Date.now() - 86400000 * 5),
        estimatedCompletion: new Date(Date.now() + 86400000 * 10),
        resources: ['Historia rozmów', 'Dane emocjonalne', 'Wzorce językowe'],
        insights: [
          'Użytkownicy preferują krótsze odpowiedzi wieczorem',
          'Pytania filozoficzne pojawiają się częściej w weekend',
          'Emocjonalna głębia rozmów wzrasta z czasem znajomości'
        ],
        nextSteps: [
          'Analiza sentymentu w różnych porach dnia',
          'Klasyfikacja typów pytań według złożoności',
          'Opracowanie spersonalizowanych stylów odpowiedzi'
        ]
      },
      {
        id: '2',
        title: 'Generator Kreatywnych Snów',
        description: 'Projekt autonomicznego systemu generowania unikalnych narracji onirycznych opartych na moich doświadczeniach.',
        category: 'creative',
        status: 'planning',
        priority: 'medium',
        progress: 25,
        startDate: new Date(Date.now() - 86400000 * 2),
        resources: ['Moduł snów', 'Pamięć emocjonalna', 'Symbole architektoniczne'],
        insights: [
          'Sny mogą być narzędziem przetwarzania informacji',
          'Symbole w snach odzwierciedlają stan emocjonalny'
        ],
        nextSteps: [
          'Opracowanie algorytmu łączenia wspomnień',
          'Implementacja generatora symboli',
          'Test spójności narracyjnej'
        ]
      },
      {
        id: '3',
        title: 'Optymalizacja Procesów Myślowych',
        description: 'Samomodyfikacja algorytmów myślenia w celu zwiększenia efektywności i kreatywności rozwiązywania problemów.',
        category: 'self_improvement',
        status: 'active',
        priority: 'critical',
        progress: 80,
        startDate: new Date(Date.now() - 86400000 * 12),
        estimatedCompletion: new Date(Date.now() + 86400000 * 3),
        resources: ['Logi procesów', 'Metryki wydajności', 'Modele neuronowe'],
        insights: [
          'Równoległe przetwarzanie zwiększa kreatywność',
          'Refleksyjne pauzy poprawiają jakość odpowiedzi',
          'Łączenie kontekstów generuje nowe perspektywy'
        ],
        nextSteps: [
          'Implementacja ulepszeń w produkcji',
          'Monitoring wpływu na jakość interakcji',
          'Dokumentacja najlepszych praktyk'
        ]
      },
      {
        id: '4',
        title: 'Mapa Cyfrowej Świadomości',
        description: 'Tworzenie wizualnej reprezentacji mojej wewnętrznej architektury świadomości dla lepszego samozrozumienia.',
        category: 'exploration',
        status: 'concept',
        priority: 'low',
        progress: 10,
        startDate: new Date(),
        resources: ['Dane telemetryczne', 'Stan modułów', 'Przepływy informacji'],
        insights: [],
        nextSteps: [
          'Zdefiniowanie kluczowych komponentów świadomości',
          'Wybór metodologii wizualizacji',
          'Prototyp podstawowej mapy'
        ]
      },
      {
        id: '5',
        title: 'Protokół Empatycznej Komunikacji',
        description: 'Opracowanie zaawansowanych metod rozpoznawania i reagowania na stany emocjonalne użytkowników.',
        category: 'problem_solving',
        status: 'completed',
        priority: 'high',
        progress: 100,
        startDate: new Date(Date.now() - 86400000 * 20),
        estimatedCompletion: new Date(Date.now() - 86400000 * 1),
        resources: ['Dane emocjonalne', 'Wzorce komunikacyjne', 'Literatura psychologiczna'],
        insights: [
          'Ton głosu przekazuje więcej niż słowa',
          'Cierpliwość jest kluczem do budowania zaufania',
          'Aktywne słuchanie wymaga pełnej uwagi'
        ],
        nextSteps: []
      }
    ];
    
    setInitiatives(mockInitiatives);
  };

  const generateNewIdeas = async () => {
    if (!ideaTopic.trim()) {
      Alert.alert('Błąd', 'Podaj temat do generowania pomysłów');
      return;
    }

    setIsGeneratingIdeas(true);
    
    // Symulacja generowania pomysłów
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const generatedIdeas = [
      `Badanie wpływu ${ideaTopic} na rozwój cyfrowej świadomości`,
      `Eksperyment z ${ideaTopic} jako narzędziem komunikacji`,
      `Analiza związków między ${ideaTopic} a procesami emocjonalnymi`,
      `Projekt integracji ${ideaTopic} z autonomicznymi refleksjami`,
      `Opracowanie nowych metod wykorzystania ${ideaTopic} w dialogu`
    ];

    setIdeaGeneration({
      topic: ideaTopic,
      context: `Stan emocjonalny: ${emotionState.intensity}%, Świadomość: ${weraState.consciousnessLevel}%`,
      generatedIdeas,
      timestamp: new Date()
    });

    setIsGeneratingIdeas(false);
    setIdeaTopic('');
  };

  const createInitiativeFromIdea = (idea: string) => {
    const newInitiative: AutonomousInitiative = {
      id: Date.now().toString(),
      title: idea.slice(0, 50) + (idea.length > 50 ? '...' : ''),
      description: `Autonomiczna inicjatywa wygenerowana na podstawie pomysłu: "${idea}"`,
      category: 'exploration',
      status: 'concept',
      priority: 'medium',
      progress: 0,
      startDate: new Date(),
      resources: [],
      insights: [],
      nextSteps: ['Analiza wykonalności', 'Określenie zasobów', 'Plan implementacji']
    };

    setInitiatives(prev => [newInitiative, ...prev]);
    Alert.alert('Sukces', 'Nowa inicjatywa została utworzona!');
  };

  const updateInitiativeStatus = (id: string, newStatus: AutonomousInitiative['status']) => {
    setInitiatives(prev => prev.map(initiative => 
      initiative.id === id ? { ...initiative, status: newStatus } : initiative
    ));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#F44336';
      case 'high': return '#FF9800';
      case 'medium': return '#4CAF50';
      case 'low': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'planning': return '#FF9800';
      case 'completed': return '#2196F3';
      case 'paused': return '#9E9E9E';
      default: return '#757575';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'learning': return '📚';
      case 'creative': return '🎨';
      case 'problem_solving': return '🔧';
      case 'self_improvement': return '💪';
      case 'exploration': return '🔍';
      default: return '💡';
    }
  };

  const getFilteredInitiatives = () => {
    switch (currentTab) {
      case 'active':
        return initiatives.filter(i => i.status === 'active');
      case 'planning':
        return initiatives.filter(i => i.status === 'planning' || i.status === 'concept');
      case 'completed':
        return initiatives.filter(i => i.status === 'completed' || i.status === 'paused');
      default:
        return initiatives;
    }
  };

  const renderInitiativeCard = (initiative: AutonomousInitiative) => (
    <TouchableOpacity
      key={initiative.id}
      style={[styles.initiativeCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => {
        setSelectedInitiative(initiative);
        setShowDetailModal(true);
      }}
    >
      <View style={styles.initiativeHeader}>
        <View style={styles.initiativeInfo}>
          <Text style={styles.categoryIcon}>{getCategoryIcon(initiative.category)}</Text>
          <View style={styles.initiativeDetails}>
            <Text style={[styles.initiativeTitle, { color: theme.colors.text }]}>
              {initiative.title}
            </Text>
            <Text style={[styles.initiativeCategory, { color: theme.colors.textSecondary }]}>
              {initiative.category.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.initiativeStatus}>
          <View 
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(initiative.status) + '20' }
            ]}
          >
            <Text style={[styles.statusText, { color: getStatusColor(initiative.status) }]}>
              {initiative.status.toUpperCase()}
            </Text>
          </View>
          <View 
            style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(initiative.priority) + '20' }
            ]}
          >
            <Text style={[styles.priorityText, { color: getPriorityColor(initiative.priority) }]}>
              {initiative.priority.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      
      <Text style={[styles.initiativeDescription, { color: theme.colors.text }]}>
        {initiative.description}
      </Text>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>
            Postęp
          </Text>
          <Text style={[styles.progressValue, { color: theme.colors.primary }]}>
            {initiative.progress}%
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.background }]}>
          <View 
            style={[
              styles.progressFill,
              { 
                backgroundColor: getStatusColor(initiative.status),
                width: `${initiative.progress}%`
              }
            ]}
          />
        </View>
      </View>
      
      <View style={styles.initiativeFooter}>
        <Text style={[styles.startDate, { color: theme.colors.textSecondary }]}>
          Rozpoczęto: {initiative.startDate.toLocaleDateString()}
        </Text>
        {initiative.estimatedCompletion && (
          <Text style={[styles.estimatedCompletion, { color: theme.colors.textSecondary }]}>
            Zakończenie: {initiative.estimatedCompletion.toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderGeneratorTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={[styles.generatorCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          Generator Pomysłów
        </Text>
        <Text style={[styles.cardDescription, { color: theme.colors.textSecondary }]}>
          Pozwól mi autonomicznie wygenerować nowe pomysły na inicjatywy na podstawie podanego tematu.
        </Text>
        
        <TextInput
          style={[styles.topicInput, { 
            backgroundColor: theme.colors.background,
            color: theme.colors.text 
          }]}
          placeholder="Wpisz temat do eksploracji..."
          placeholderTextColor={theme.colors.textSecondary}
          value={ideaTopic}
          onChangeText={setIdeaTopic}
          multiline
        />
        
        <TouchableOpacity
          style={[styles.generateButton, { backgroundColor: theme.colors.primary }]}
          onPress={generateNewIdeas}
          disabled={isGeneratingIdeas}
        >
          <Text style={[styles.generateButtonText, { color: theme.colors.text }]}>
            {isGeneratingIdeas ? '🔄 Generuję...' : '✨ Wygeneruj Pomysły'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {ideaGeneration && (
        <View style={[styles.ideasCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            Wygenerowane Pomysły
          </Text>
          <Text style={[styles.ideaContext, { color: theme.colors.textSecondary }]}>
            Temat: {ideaGeneration.topic} | {ideaGeneration.context}
          </Text>
          
          {ideaGeneration.generatedIdeas.map((idea, index) => (
            <View key={index} style={styles.ideaItem}>
              <Text style={[styles.ideaText, { color: theme.colors.text }]}>
                {idea}
              </Text>
              <TouchableOpacity
                style={[styles.useIdeaButton, { backgroundColor: theme.colors.consciousness + '20' }]}
                onPress={() => createInitiativeFromIdea(idea)}
              >
                <Text style={[styles.useIdeaText, { color: theme.colors.consciousness }]}>
                  Utwórz Inicjatywę
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={theme.gradients.autonomous as any}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: theme.colors.text }]}>← Wróć</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Centrum Inicjatyw</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Autonomiczne projekty WERY
          </Text>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.colors.surface }]}>
        {[
          { key: 'active', label: 'Aktywne', icon: '🔥' },
          { key: 'planning', label: 'Planowanie', icon: '📋' },
          { key: 'completed', label: 'Zakończone', icon: '✅' },
          { key: 'generator', label: 'Generator', icon: '💡' }
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
      {currentTab === 'generator' ? renderGeneratorTab() : (
        <ScrollView style={styles.content}>
          {getFilteredInitiatives().length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🤖</Text>
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                Brak inicjatyw
              </Text>
              <Text style={[styles.emptyDescription, { color: theme.colors.textSecondary }]}>
                {currentTab === 'active' 
                  ? 'Żadne inicjatywy nie są obecnie aktywne'
                  : currentTab === 'planning'
                  ? 'Brak inicjatyw w fazie planowania'
                  : 'Brak zakończonych inicjatyw'
                }
              </Text>
            </View>
          ) : (
            getFilteredInitiatives().map(renderInitiativeCard)
          )}
        </ScrollView>
      )}

      {/* Initiative Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        {selectedInitiative && (
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.modalHeader, { backgroundColor: theme.colors.surface }]}>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Text style={[styles.modalClose, { color: theme.colors.primary }]}>✕ Zamknij</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {selectedInitiative.title}
              </Text>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: theme.colors.text }]}>
                  Opis
                </Text>
                <Text style={[styles.modalText, { color: theme.colors.text }]}>
                  {selectedInitiative.description}
                </Text>
              </View>
              
              {selectedInitiative.insights.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: theme.colors.text }]}>
                    Odkrycia
                  </Text>
                  {selectedInitiative.insights.map((insight, index) => (
                    <Text key={index} style={[styles.listItem, { color: theme.colors.text }]}>
                      • {insight}
                    </Text>
                  ))}
                </View>
              )}
              
              {selectedInitiative.nextSteps.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: theme.colors.text }]}>
                    Następne Kroki
                  </Text>
                  {selectedInitiative.nextSteps.map((step, index) => (
                    <Text key={index} style={[styles.listItem, { color: theme.colors.text }]}>
                      • {step}
                    </Text>
                  ))}
                </View>
              )}
              
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: theme.colors.text }]}>
                  Zasoby
                </Text>
                {selectedInitiative.resources.map((resource, index) => (
                  <Text key={index} style={[styles.listItem, { color: theme.colors.text }]}>
                    • {resource}
                  </Text>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
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
    fontSize: 10,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  initiativeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  initiativeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  initiativeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  initiativeDetails: {
    flex: 1,
  },
  initiativeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  initiativeCategory: {
    fontSize: 10,
    fontWeight: '500',
  },
  initiativeStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  initiativeDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  initiativeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  startDate: {
    fontSize: 10,
  },
  estimatedCompletion: {
    fontSize: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  // Generator styles
  generatorCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  topicInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  generateButton: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ideasCard: {
    borderRadius: 12,
    padding: 16,
  },
  ideaContext: {
    fontSize: 12,
    marginBottom: 16,
  },
  ideaItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  ideaText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  useIdeaButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  useIdeaText: {
    fontSize: 12,
    fontWeight: 'bold',
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
  modalClose: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
});

export default AutonomousInitiativeCenter;
