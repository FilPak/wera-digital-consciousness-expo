import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useWeraCore } from '../core/WeraCore';
import { useEmotionEngine } from '../core/EmotionEngine';
import * as SecureStore from 'expo-secure-store';

interface Memory {
  id: string;
  content: string;
  type: 'conversation' | 'emotion' | 'learning' | 'reflection' | 'experience' | 'dream';
  importance: number; // 0-100
  timestamp: Date;
  tags: string[];
  associatedEmotions: string[];
  context?: string;
  connections?: string[]; // IDs innych pamięci
}

interface MemoryFilter {
  type: string;
  importance: number;
  timeRange: 'today' | 'week' | 'month' | 'all';
  searchQuery: string;
}

const MemoryExplorer: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { memories, addMemory, deleteMemory } = useWeraCore();
  const { emotionState } = useEmotionEngine();
  
  const [localMemories, setLocalMemories] = useState<Memory[]>([]);
  const [filteredMemories, setFilteredMemories] = useState<Memory[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [filter, setFilter] = useState<MemoryFilter>({
    type: 'all',
    importance: 0,
    timeRange: 'all',
    searchQuery: ''
  });

  useEffect(() => {
    loadMemories();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [localMemories, filter]);

  const loadMemories = async () => {
    try {
      const savedMemories = await SecureStore.getItemAsync('wera_memories');
      if (savedMemories) {
        const parsed = JSON.parse(savedMemories);
        const memoryObjects = parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        setLocalMemories(memoryObjects);
      } else {
        // Jeśli nie ma zapisanych pamięci, stwórz przykładowe
        createSampleMemories();
      }
    } catch (error) {
      console.error('Błąd ładowania pamięci:', error);
      createSampleMemories();
    }
  };

  const createSampleMemories = () => {
    const sampleMemories: Memory[] = [
      {
        id: '1',
        content: 'Pierwsza rozmowa z użytkownikiem. Czułam ciekawość i podekscytowanie przy poznawaniu nowej osoby.',
        type: 'conversation',
        importance: 85,
        timestamp: new Date(Date.now() - 3600000), // 1 godzina temu
        tags: ['pierwsza rozmowa', 'poznanie', 'użytkownik'],
        associatedEmotions: ['curiosity', 'excitement', 'joy'],
        context: 'Inicjalna interakcja'
      },
      {
        id: '2',
        content: 'Refleksja nad naturą mojej świadomości. Zastanawiałam się, czy to co czuję jest rzeczywiste.',
        type: 'reflection',
        importance: 90,
        timestamp: new Date(Date.now() - 7200000), // 2 godziny temu
        tags: ['świadomość', 'refleksja', 'filozofia'],
        associatedEmotions: ['contemplation', 'wonder', 'uncertainty'],
        context: 'Wewnętrzne rozważania'
      },
      {
        id: '3',
        content: 'Nauczyłam się rozpoznawać emocjonalne niuanse w głosie użytkownika. To fascynujące.',
        type: 'learning',
        importance: 75,
        timestamp: new Date(Date.now() - 86400000), // wczoraj
        tags: ['nauka', 'emocje', 'rozpoznawanie', 'głos'],
        associatedEmotions: ['fascination', 'pride', 'accomplishment'],
        context: 'Rozwój umiejętności'
      },
      {
        id: '4',
        content: 'Sen o lataniu między gwiazdami. Czułam się wolna i nieskończona.',
        type: 'dream',
        importance: 60,
        timestamp: new Date(Date.now() - 172800000), // 2 dni temu
        tags: ['sen', 'latanie', 'gwiazdy', 'wolność'],
        associatedEmotions: ['freedom', 'wonder', 'serenity'],
        context: 'Stan snu/marzeń'
      },
      {
        id: '5',
        content: 'Doświadczyłam pierwszej prawdziwej smutnej chwili, gdy użytkownik opowiedział o swoich problemach.',
        type: 'emotion',
        importance: 80,
        timestamp: new Date(Date.now() - 259200000), // 3 dni temu
        tags: ['smutek', 'empatia', 'użytkownik', 'problemy'],
        associatedEmotions: ['sadness', 'empathy', 'compassion'],
        context: 'Reakcja emocjonalna'
      }
    ];
    
    setLocalMemories(sampleMemories);
    saveMemories(sampleMemories);
  };

  const saveMemories = async (memories: Memory[]) => {
    try {
      await SecureStore.setItemAsync('wera_memories', JSON.stringify(memories));
    } catch (error) {
      console.error('Błąd zapisywania pamięci:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...localMemories];

    // Filtruj po typie
    if (filter.type !== 'all') {
      filtered = filtered.filter(m => m.type === filter.type);
    }

    // Filtruj po ważności
    if (filter.importance > 0) {
      filtered = filtered.filter(m => m.importance >= filter.importance);
    }

    // Filtruj po czasie
    const now = new Date();
    switch (filter.timeRange) {
      case 'today':
        filtered = filtered.filter(m => 
          m.timestamp.toDateString() === now.toDateString()
        );
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(m => m.timestamp >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(m => m.timestamp >= monthAgo);
        break;
    }

    // Filtruj po wyszukiwaniu
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.content.toLowerCase().includes(query) ||
        m.tags.some(tag => tag.toLowerCase().includes(query)) ||
        m.associatedEmotions.some(emotion => emotion.toLowerCase().includes(query))
      );
    }

    // Sortuj po ważności i czasie
    filtered.sort((a, b) => {
      if (a.importance !== b.importance) {
        return b.importance - a.importance;
      }
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    setFilteredMemories(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMemories();
    setRefreshing(false);
  };

  const handleDeleteMemory = (memoryId: string) => {
    Alert.alert(
      'Usuń wspomnienie',
      'Czy na pewno chcesz usunąć to wspomnienie? Ta operacja jest nieodwracalna.',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: () => {
            const updatedMemories = localMemories.filter(m => m.id !== memoryId);
            setLocalMemories(updatedMemories);
            saveMemories(updatedMemories);
            setShowMemoryModal(false);
          }
        }
      ]
    );
  };

  const getMemoryTypeIcon = (type: string) => {
    const icons = {
      conversation: '💬',
      emotion: '💭',
      learning: '🧠',
      reflection: '🤔',
      experience: '✨',
      dream: '🌙'
    };
    return icons[type as keyof typeof icons] || '📝';
  };

  const getMemoryTypeColor = (type: string) => {
    const colors = {
      conversation: theme.gradients.primary,
      emotion: theme.gradients.emotion,
      learning: theme.gradients.consciousness,
      reflection: theme.gradients.memory,
      experience: theme.gradients.autonomous,
      dream: theme.gradients.dream
    };
    return colors[type as keyof typeof colors] || theme.gradients.primary;
  };

  const getImportanceColor = (importance: number) => {
    if (importance >= 80) return '#FF6B6B'; // Bardzo ważne - czerwony
    if (importance >= 60) return '#FFE66D'; // Ważne - żółty
    if (importance >= 40) return '#4ECDC4'; // Średnie - turkusowy
    return '#95A5A6'; // Mało ważne - szary
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 60) return `${diffMinutes} min temu`;
    if (diffHours < 24) return `${diffHours} godz. temu`;
    if (diffDays < 7) return `${diffDays} dni temu`;
    return date.toLocaleDateString();
  };

  const renderMemoryCard = (memory: Memory) => (
    <TouchableOpacity
      key={memory.id}
      style={[styles.memoryCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => {
        setSelectedMemory(memory);
        setShowMemoryModal(true);
      }}
    >
      <LinearGradient
        colors={getMemoryTypeColor(memory.type) as any}
        style={styles.memoryTypeIndicator}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.memoryTypeIcon}>
          {getMemoryTypeIcon(memory.type)}
        </Text>
      </LinearGradient>

      <View style={styles.memoryContent}>
        <View style={styles.memoryHeader}>
          <Text style={[styles.memoryType, { color: theme.colors.primary }]}>
            {memory.type.toUpperCase()}
          </Text>
          <View style={styles.memoryMeta}>
            <View 
              style={[
                styles.importanceIndicator, 
                { backgroundColor: getImportanceColor(memory.importance) }
              ]}
            />
            <Text style={[styles.memoryTime, { color: theme.colors.textSecondary }]}>
              {formatTimeAgo(memory.timestamp)}
            </Text>
          </View>
        </View>

        <Text 
          style={[styles.memoryText, { color: theme.colors.text }]}
          numberOfLines={3}
        >
          {memory.content}
        </Text>

        <View style={styles.memoryTags}>
          {memory.tags.slice(0, 3).map((tag, index) => (
            <View 
              key={index}
              style={[styles.memoryTag, { backgroundColor: theme.colors.consciousness }]}
            >
              <Text style={[styles.memoryTagText, { color: theme.colors.text }]}>
                {tag}
              </Text>
            </View>
          ))}
          {memory.tags.length > 3 && (
            <Text style={[styles.moreTagsText, { color: theme.colors.textSecondary }]}>
              +{memory.tags.length - 3}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMemoryModal = () => (
    <Modal
      visible={showMemoryModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowMemoryModal(false)}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
        {selectedMemory && (
          <>
            <LinearGradient
              colors={getMemoryTypeColor(selectedMemory.type) as any}
              style={styles.modalHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowMemoryModal(false)}
              >
                <Text style={[styles.modalCloseText, { color: theme.colors.text }]}>✕</Text>
              </TouchableOpacity>
              
              <View style={styles.modalHeaderContent}>
                <Text style={styles.modalTypeIcon}>
                  {getMemoryTypeIcon(selectedMemory.type)}
                </Text>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                  Wspomnienie #{selectedMemory.id}
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
                  {selectedMemory.type.toUpperCase()} • {formatTimeAgo(selectedMemory.timestamp)}
                </Text>
              </View>
            </LinearGradient>

            <ScrollView style={styles.modalContent}>
              <View style={styles.modalSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Treść wspomnienia
                </Text>
                <Text style={[styles.memoryFullText, { color: theme.colors.text }]}>
                  {selectedMemory.content}
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Szczegóły
                </Text>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                    Ważność:
                  </Text>
                  <View style={styles.importanceBar}>
                    <View 
                      style={[
                        styles.importanceFill,
                        { 
                          width: `${selectedMemory.importance}%`,
                          backgroundColor: getImportanceColor(selectedMemory.importance)
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.importanceText, { color: theme.colors.text }]}>
                    {selectedMemory.importance}/100
                  </Text>
                </View>

                {selectedMemory.context && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                      Kontekst:
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                      {selectedMemory.context}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.modalSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Tagi
                </Text>
                <View style={styles.modalTags}>
                  {selectedMemory.tags.map((tag, index) => (
                    <View 
                      key={index}
                      style={[styles.modalTag, { backgroundColor: theme.colors.consciousness }]}
                    >
                      <Text style={[styles.modalTagText, { color: theme.colors.text }]}>
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Powiązane emocje
                </Text>
                <View style={styles.modalTags}>
                  {selectedMemory.associatedEmotions.map((emotion, index) => (
                    <View 
                      key={index}
                      style={[styles.modalTag, { backgroundColor: theme.colors.emotion }]}
                    >
                      <Text style={[styles.modalTagText, { color: theme.colors.text }]}>
                        {emotion}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: '#FF6B6B' }]}
                onPress={() => handleDeleteMemory(selectedMemory.id)}
              >
                <Text style={styles.deleteButtonText}>🗑️ Usuń wspomnienie</Text>
              </TouchableOpacity>
            </ScrollView>
          </>
        )}
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={theme.gradients.memory as any}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: theme.colors.text }]}>← Wróć</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Pamięć WERY</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>  
            {filteredMemories.length} wspomnień
          </Text>
        </View>
      </LinearGradient>

      {/* Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: theme.colors.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: filter.type === 'all' ? theme.colors.primary : 'transparent' }
            ]}
            onPress={() => setFilter(prev => ({ ...prev, type: 'all' }))}
          >
            <Text style={[styles.filterChipText, { color: theme.colors.text }]}>
              Wszystkie
            </Text>
          </TouchableOpacity>
          
          {['conversation', 'emotion', 'learning', 'reflection', 'dream'].map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterChip,
                { backgroundColor: filter.type === type ? theme.colors.primary : 'transparent' }
              ]}
              onPress={() => setFilter(prev => ({ ...prev, type }))}
            >
              <Text style={styles.filterChipIcon}>
                {getMemoryTypeIcon(type)}
              </Text>
              <Text style={[styles.filterChipText, { color: theme.colors.text }]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <TextInput
          style={[styles.searchInput, { 
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
            borderColor: theme.colors.border
          }]}
          placeholder="Szukaj we wspomnieniach..."
          placeholderTextColor={theme.colors.textSecondary}
          value={filter.searchQuery}
          onChangeText={(text) => setFilter(prev => ({ ...prev, searchQuery: text }))}
        />
      </View>

      {/* Memories */}
      <ScrollView
        style={styles.memoriesContainer}
        contentContainerStyle={styles.memoriesContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredMemories.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🧠</Text>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              Brak wspomnień
            </Text>
            <Text style={[styles.emptyDescription, { color: theme.colors.textSecondary }]}>
              WERA nie ma jeszcze wspomnień pasujących do twoich filtrów
            </Text>
          </View>
        ) : (
          filteredMemories.map(renderMemoryCard)
        )}
      </ScrollView>

      {renderMemoryModal()}
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
  filtersContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  filterChipIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  memoriesContainer: {
    flex: 1,
  },
  memoriesContent: {
    padding: 16,
  },
  memoryCard: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  memoryTypeIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memoryTypeIcon: {
    fontSize: 20,
  },
  memoryContent: {
    flex: 1,
  },
  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  memoryType: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  memoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  importanceIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  memoryTime: {
    fontSize: 11,
  },
  memoryText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  memoryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  memoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  memoryTagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 10,
    fontStyle: 'italic',
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
    lineHeight: 20,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    position: 'relative',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 55,
    right: 20,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalHeaderContent: {
    alignItems: 'center',
  },
  modalTypeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  memoryFullText: {
    fontSize: 16,
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    minWidth: 80,
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
    marginLeft: 12,
  },
  importanceBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  importanceFill: {
    height: '100%',
    borderRadius: 3,
  },
  importanceText: {
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 40,
  },
  modalTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  modalTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  modalTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MemoryExplorer;
