import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useWeraCore } from '../core/WeraCore';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';

interface GGUFModel {
  id: string;
  name: string;
  size: string;
  description: string;
  version: string;
  downloadUrl: string;
  status: 'available' | 'downloading' | 'installed' | 'active' | 'error';
  downloadProgress?: number;
  localPath?: string;
  quantization: string;
  parameters: string;
}

const LocalGGUFModelManager: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { state: weraState } = useWeraCore();
  
  const [currentTab, setCurrentTab] = useState<'available' | 'installed' | 'active'>('available');
  const [models, setModels] = useState<GGUFModel[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAvailableModels();
    loadInstalledModels();
    scanForLocalGGUFModels();
  }, []);

  const loadAvailableModels = () => {
    const availableModels: GGUFModel[] = [
      {
        id: '1',
        name: 'Llama-2-7B-Chat-GGUF',
        size: '3.8GB',
        description: 'Meta\'s Llama 2 7B model optimized for conversation',
        version: 'Q5_K_M',
        downloadUrl: 'https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF',
        status: 'available',
        quantization: 'Q5_K_M',
        parameters: '7B'
      },
      {
        id: '2',
        name: 'CodeLlama-7B-Instruct-GGUF',
        size: '4.1GB',
        description: 'Code generation and understanding model',
        version: 'Q5_K_M',
        downloadUrl: 'https://huggingface.co/TheBloke/CodeLlama-7B-Instruct-GGUF',
        status: 'installed',
        quantization: 'Q5_K_M',
        parameters: '7B',
        localPath: '/models/codellama-7b.gguf'
      },
      {
        id: '3',
        name: 'Mistral-7B-Instruct-GGUF',
        size: '3.9GB',
        description: 'High-performance instruction-following model',
        version: 'Q5_K_M',
        downloadUrl: 'https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF',
        status: 'active',
        quantization: 'Q5_K_M',
        parameters: '7B',
        localPath: '/models/mistral-7b.gguf'
      },
      {
        id: '4',
        name: 'Orca-2-7B-GGUF',
        size: '3.7GB',
        description: 'Microsoft\'s Orca 2 model for reasoning tasks',
        version: 'Q5_K_M',
        downloadUrl: 'https://huggingface.co/TheBloke/Orca-2-7B-GGUF',
        status: 'downloading',
        downloadProgress: 65,
        quantization: 'Q5_K_M',
        parameters: '7B'
      },
      {
        id: '5',
        name: 'Phi-2-GGUF',
        size: '1.6GB',
        description: 'Compact yet powerful model for various tasks',
        version: 'Q5_K_M',
        downloadUrl: 'https://huggingface.co/TheBloke/phi-2-GGUF',
        status: 'available',
        quantization: 'Q5_K_M',
        parameters: '2.7B'
      },
      {
        id: '6',
        name: 'Neural-Chat-7B-GGUF',
        size: '3.8GB',
        description: 'Specialized conversational AI model',
        version: 'Q5_K_M',
        downloadUrl: 'https://huggingface.co/TheBloke/neural-chat-7b-v3-1-GGUF',
        status: 'installed',
        quantization: 'Q5_K_M',
        parameters: '7B',
        localPath: '/models/neural-chat-7b.gguf'
      }
    ];
    setModels(availableModels);
  };

  const scanForLocalGGUFModels = async () => {
    try {
      setIsLoading(true);
      
      // Skanuj główny katalog dokumentów
      const documentDir = FileSystem.documentDirectory;
      // downloadDirectory nie jest dostępne we wszystkich wersjach Expo
      let downloadDir: string | null = null;
      try {
        downloadDir = (FileSystem as any).downloadDirectory || null;
      } catch (error) {
        downloadDir = null;
      }
      
      const scannedModels: GGUFModel[] = [];
      
      // Skanuj katalog dokumentów
      if (documentDir) {
        try {
          const files = await FileSystem.readDirectoryAsync(documentDir);
          const ggufFiles = files.filter(file => file.toLowerCase().endsWith('.gguf'));
          
          for (const file of ggufFiles) {
            const filePath = documentDir + file;
            const fileInfo = await FileSystem.getInfoAsync(filePath);
            
            if (fileInfo.exists && fileInfo.size) {
              const sizeInMB = (fileInfo.size / (1024 * 1024)).toFixed(1);
              const model: GGUFModel = {
                id: `local_${file.replace('.gguf', '')}`,
                name: file.replace('.gguf', '').replace(/-/g, ' '),
                size: `${sizeInMB}MB`,
                description: `Lokalny model GGUF znaleziony w systemie`,
                version: 'Lokalny',
                downloadUrl: 'local',
                status: 'installed',
                localPath: filePath,
                quantization: 'Unknown',
                parameters: 'Unknown'
              };
              scannedModels.push(model);
            }
          }
        } catch (error) {
          console.log('Nie można skanować katalogu dokumentów:', error);
        }
      }
      
      // Skanuj katalog pobieranych plików (jeśli dostępny)
      if (downloadDir) {
        try {
          const files = await FileSystem.readDirectoryAsync(downloadDir);
          const ggufFiles = files.filter(file => file.toLowerCase().endsWith('.gguf'));
          
          for (const file of ggufFiles) {
            const filePath = downloadDir + file;
            const fileInfo = await FileSystem.getInfoAsync(filePath);
            
            if (fileInfo.exists && fileInfo.size) {
              const sizeInMB = (fileInfo.size / (1024 * 1024)).toFixed(1);
              const model: GGUFModel = {
                id: `local_dl_${file.replace('.gguf', '')}`,
                name: file.replace('.gguf', '').replace(/-/g, ' '),
                size: `${sizeInMB}MB`,
                description: `Lokalny model GGUF z katalogu pobieranych`,
                version: 'Lokalny',
                downloadUrl: 'local',
                status: 'installed',
                localPath: filePath,
                quantization: 'Unknown',
                parameters: 'Unknown'
              };
              scannedModels.push(model);
            }
          }
        } catch (error) {
          console.log('Nie można skanować katalogu pobieranych:', error);
        }
      }
      
      // Skanuj główny katalog aplikacji (jeśli dostępny)
      const rootPath = '/storage/emulated/0/';
      try {
        const rootInfo = await FileSystem.getInfoAsync(rootPath);
        if (rootInfo.exists) {
          const searchPaths = [
            '/storage/emulated/0/Download/',
            '/storage/emulated/0/Documents/',
            '/storage/emulated/0/Models/',
            '/storage/emulated/0/WERA/',
          ];
          
          for (const searchPath of searchPaths) {
            try {
              const pathInfo = await FileSystem.getInfoAsync(searchPath);
              if (pathInfo.exists && pathInfo.isDirectory) {
                const files = await FileSystem.readDirectoryAsync(searchPath);
                const ggufFiles = files.filter(file => file.toLowerCase().endsWith('.gguf'));
                
                for (const file of ggufFiles) {
                  const filePath = searchPath + file;
                  const fileInfo = await FileSystem.getInfoAsync(filePath);
                  
                  if (fileInfo.exists && fileInfo.size) {
                    const sizeInGB = (fileInfo.size / (1024 * 1024 * 1024));
                    const sizeStr = sizeInGB > 1 ? `${sizeInGB.toFixed(1)}GB` : `${(fileInfo.size / (1024 * 1024)).toFixed(1)}MB`;
                    
                    const model: GGUFModel = {
                      id: `system_${file.replace('.gguf', '')}`,
                      name: file.replace('.gguf', '').replace(/-/g, ' '),
                      size: sizeStr,
                      description: `Znaleziony w ${searchPath}`,
                      version: 'Lokalny',
                      downloadUrl: 'local',
                      status: 'installed',
                      localPath: filePath,
                      quantization: 'Q5_K_M', // Domyślne założenie
                      parameters: sizeInGB > 5 ? '7B+' : sizeInGB > 2 ? '3B-7B' : '1B-3B'
                    };
                    scannedModels.push(model);
                  }
                }
              }
            } catch (error) {
              // Ignoruj błędy dostępu do poszczególnych katalogów
            }
          }
        }
      } catch (error) {
        console.log('Nie można skanować głównego katalogu:', error);
      }
      
      // Dodaj znalezione modele do listy
      if (scannedModels.length > 0) {
        setModels(prev => {
          const existingIds = prev.map(m => m.id);
          const newModels = scannedModels.filter(m => !existingIds.includes(m.id));
          return [...prev, ...newModels];
        });
        
        console.log(`✅ Znaleziono ${scannedModels.length} lokalnych modeli GGUF`);
      } else {
        console.log('❌ Nie znaleziono lokalnych modeli GGUF');
      }
      
    } catch (error) {
      console.error('Błąd skanowania modeli GGUF:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInstalledModels = async () => {
    try {
      const savedModels = await SecureStore.getItemAsync('installed_models');
      if (savedModels) {
        const parsed = JSON.parse(savedModels);
        // Aktualizuj status zainstalowanych modeli
        setModels(prev => prev.map(model => {
          const saved = parsed.find((m: any) => m.id === model.id);
          return saved ? { ...model, ...saved } : model;
        }));
      }
    } catch (error) {
      console.error('Błąd ładowania modeli:', error);
    }
  };

  const downloadModel = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (!model) return;

    Alert.alert(
      'Pobierz Model',
      `Czy chcesz pobrać ${model.name} (${model.size})?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Pobierz',
          onPress: () => startDownload(modelId)
        }
      ]
    );
  };

  const startDownload = (modelId: string) => {
    setModels(prev => prev.map(model =>
      model.id === modelId
        ? { ...model, status: 'downloading', downloadProgress: 0 }
        : model
    ));

    // Symulacja pobierania
    const interval = setInterval(() => {
      setModels(prev => prev.map(model => {
        if (model.id === modelId && model.status === 'downloading') {
          const newProgress = (model.downloadProgress || 0) + Math.random() * 15;
          if (newProgress >= 100) {
            clearInterval(interval);
            return {
              ...model,
              status: 'installed',
              downloadProgress: 100,
              localPath: `/models/${model.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.gguf`
            };
          }
          return { ...model, downloadProgress: newProgress };
        }
        return model;
      }));
    }, 500);
  };

  const activateModel = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (!model || model.status !== 'installed') return;

    Alert.alert(
      'Aktywuj Model',
      `Czy chcesz aktywować ${model.name} jako główny model WERY?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Aktywuj',
          onPress: () => {
            setModels(prev => prev.map(m => ({
              ...m,
              status: m.id === modelId ? 'active' : m.status === 'active' ? 'installed' : m.status
            })));
            Alert.alert('Sukces', `${model.name} został aktywowany jako główny model WERY.`);
          }
        }
      ]
    );
  };

  const deleteModel = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (!model) return;

    Alert.alert(
      'Usuń Model',
      `Czy na pewno chcesz usunąć ${model.name}?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: () => {
            setModels(prev => prev.map(m =>
              m.id === modelId
                ? { ...m, status: 'available', localPath: undefined, downloadProgress: undefined }
                : m
            ));
            Alert.alert('Sukces', 'Model został usunięty.');
          }
        }
      ]
    );
  };

  const addCustomModel = () => {
    if (!customUrl.trim()) {
      Alert.alert('Błąd', 'Podaj URL do modelu GGUF');
      return;
    }

    const customModel: GGUFModel = {
      id: Date.now().toString(),
      name: 'Custom Model',
      size: 'Unknown',
      description: 'Własny model dodany przez użytkownika',
      version: 'Custom',
      downloadUrl: customUrl,
      status: 'available',
      quantization: 'Unknown',
      parameters: 'Unknown'
    };

    setModels(prev => [...prev, customModel]);
    setCustomUrl('');
    setShowAddModal(false);
    Alert.alert('Sukces', 'Model został dodany do listy dostępnych.');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'installed': return '#2196F3';
      case 'downloading': return '#FF9800';
      case 'error': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢';
      case 'installed': return '💾';
      case 'downloading': return '⬇️';
      case 'error': return '❌';
      default: return '📦';
    }
  };

  const filteredModels = models.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         model.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    switch (currentTab) {
      case 'available':
        return matchesSearch && model.status === 'available';
      case 'installed':
        return matchesSearch && (model.status === 'installed' || model.status === 'downloading');
      case 'active':
        return matchesSearch && model.status === 'active';
      default:
        return matchesSearch;
    }
  });

  const renderModelCard = (model: GGUFModel) => (
    <View key={model.id} style={[styles.modelCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.modelHeader}>
        <View style={styles.modelInfo}>
          <Text style={styles.statusIcon}>{getStatusIcon(model.status)}</Text>
          <View style={styles.modelDetails}>
            <Text style={[styles.modelName, { color: theme.colors.text }]}>
              {model.name}
            </Text>
            <Text style={[styles.modelDescription, { color: theme.colors.textSecondary }]}>
              {model.description}
            </Text>
            <View style={styles.modelMeta}>
              <Text style={[styles.modelSize, { color: theme.colors.textSecondary }]}>
                {model.size} • {model.parameters} • {model.quantization}
              </Text>
            </View>
          </View>
        </View>
        <View 
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(model.status) + '20' }
          ]}
        >
          <Text 
            style={[
              styles.statusText,
              { color: getStatusColor(model.status) }
            ]}
          >
            {model.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {model.status === 'downloading' && model.downloadProgress !== undefined && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.colors.background }]}>
            <View 
              style={[
                styles.progressFill,
                { 
                  backgroundColor: theme.colors.primary,
                  width: `${model.downloadProgress}%`
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
            {Math.round(model.downloadProgress)}%
          </Text>
        </View>
      )}

      <View style={styles.modelActions}>
        {model.status === 'available' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => downloadModel(model.id)}
          >
            <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
              ⬇️ Pobierz
            </Text>
          </TouchableOpacity>
        )}

        {model.status === 'installed' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.consciousness }]}
              onPress={() => activateModel(model.id)}
            >
              <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
                ⚡ Aktywuj
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#F44336' }]}
              onPress={() => deleteModel(model.id)}
            >
              <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
                🗑️ Usuń
              </Text>
            </TouchableOpacity>
          </>
        )}

        {model.status === 'active' && (
          <View style={[styles.activeIndicator, { backgroundColor: '#4CAF50' }]}>
            <Text style={styles.activeText}>✅ Aktywny Model</Text>
          </View>
        )}

        {model.status === 'downloading' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.textSecondary }]}
            onPress={() => {
              setModels(prev => prev.map(m =>
                m.id === model.id ? { ...m, status: 'available', downloadProgress: undefined } : m
              ));
            }}
          >
            <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
              ⏹️ Anuluj
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={theme.gradients.primary as any}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: theme.colors.text }]}>← Wróć</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Menedżer Modeli</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Lokalne modele GGUF
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Text style={[styles.addButton, { color: theme.colors.text }]}>+ Dodaj</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <TextInput
          style={[styles.searchInput, { 
            backgroundColor: theme.colors.background,
            color: theme.colors.text 
          }]}
          placeholder="Szukaj modeli..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.colors.surface }]}>
        {[
          { key: 'available', label: 'Dostępne', icon: '📦' },
          { key: 'installed', label: 'Zainstalowane', icon: '💾' },
          { key: 'active', label: 'Aktywne', icon: '🟢' }
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

      {/* Models List */}
      <ScrollView style={styles.modelsList}>
        {filteredModels.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🤖</Text>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              Brak modeli
            </Text>
            <Text style={[styles.emptyDescription, { color: theme.colors.textSecondary }]}>
              {currentTab === 'available' 
                ? 'Nie znaleziono dostępnych modeli'
                : currentTab === 'installed'
                ? 'Nie masz zainstalowanych modeli'
                : 'Brak aktywnych modeli'
              }
            </Text>
          </View>
        ) : (
          filteredModels.map(renderModelCard)
        )}
      </ScrollView>

      {/* Add Custom Model Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Dodaj Własny Model
            </Text>
            
            <TextInput
              style={[styles.modalInput, { 
                backgroundColor: theme.colors.background,
                color: theme.colors.text 
              }]}
              placeholder="URL do pliku GGUF..."
              placeholderTextColor={theme.colors.textSecondary}
              value={customUrl}
              onChangeText={setCustomUrl}
              multiline
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.colors.textSecondary }]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalButtonText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={addCustomModel}
              >
                <Text style={styles.modalButtonText}>Dodaj</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  addButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
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
  modelsList: {
    flex: 1,
    padding: 16,
  },
  modelCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  modelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modelInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  modelDetails: {
    flex: 1,
  },
  modelName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modelDescription: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
  },
  modelMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modelSize: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 40,
  },
  modelActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeIndicator: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flex: 1,
    alignItems: 'center',
  },
  activeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    width: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default LocalGGUFModelManager;
