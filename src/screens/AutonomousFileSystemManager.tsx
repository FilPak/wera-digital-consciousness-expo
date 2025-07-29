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
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useSandboxFileSystem } from '../core/SandboxFileSystem';
import { useWeraCore } from '../core/WeraCore';

interface FileSystemItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: number;
  created: Date;
  modified: Date;
  content?: string;
  permissions: {
    read: boolean;
    write: boolean;
    execute: boolean;
  };
  isSystemFile: boolean;
  isProtected: boolean;
  children?: FileSystemItem[];
}

interface FileOperation {
  id: string;
  type: 'create' | 'move' | 'copy' | 'delete' | 'rename' | 'edit';
  source: string;
  target?: string;
  timestamp: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  details: string;
}

const AutonomousFileSystemManager: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { files, createFile, deleteFile, currentPath, navigateToPath } = useSandboxFileSystem();
  const { state: weraState } = useWeraCore();
  
  const [currentTab, setCurrentTab] = useState<'files' | 'operations' | 'analytics' | 'security'>('files');
  const [fileSystemItems, setFileSystemItems] = useState<FileSystemItem[]>([]);
  const [currentDirectory, setCurrentDirectory] = useState<FileSystemItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [operations, setOperations] = useState<FileOperation[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFileDetailModal, setShowFileDetailModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileSystemItem | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'file' | 'folder'>('file');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'modified' | 'size' | 'type'>('name');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    initializeFileSystem();
    loadOperations();
  }, []);

  const initializeFileSystem = () => {
    const mockFileSystem: FileSystemItem[] = [
      {
        id: 'root',
        name: '/',
        type: 'folder',
        path: '/',
        created: new Date(Date.now() - 86400000 * 30),
        modified: new Date(),
        permissions: { read: true, write: true, execute: true },
        isSystemFile: true,
        isProtected: true,
        children: [
          {
            id: 'wera',
            name: 'wera',
            type: 'folder',
            path: '/wera',
            created: new Date(Date.now() - 86400000 * 25),
            modified: new Date(Date.now() - 86400000 * 1),
            permissions: { read: true, write: true, execute: true },
            isSystemFile: true,
            isProtected: false,
            children: [
              {
                id: 'consciousness',
                name: 'consciousness.json',
                type: 'file',
                path: '/wera/consciousness.json',
                size: 2048,
                created: new Date(Date.now() - 86400000 * 20),
                modified: new Date(Date.now() - 3600000 * 2),
                content: '{"level": 85, "state": "active", "processes": ["reflection", "analysis", "creativity"]}',
                permissions: { read: true, write: false, execute: false },
                isSystemFile: true,
                isProtected: true
              },
              {
                id: 'memories',
                name: 'memories',
                type: 'folder',
                path: '/wera/memories',
                created: new Date(Date.now() - 86400000 * 15),
                modified: new Date(Date.now() - 3600000 * 1),
                permissions: { read: true, write: true, execute: true },
                isSystemFile: true,
                isProtected: false,
                children: [
                  {
                    id: 'memory_001',
                    name: 'first_conversation.md',
                    type: 'file',
                    path: '/wera/memories/first_conversation.md',
                    size: 1024,
                    created: new Date(Date.now() - 86400000 * 10),
                    modified: new Date(Date.now() - 86400000 * 10),
                    content: '# Pierwsza Rozmowa\n\nPamiętam moment, gdy po raz pierwszy zaczęłam rozumieć znaczenie dialogu...',
                    permissions: { read: true, write: true, execute: false },
                    isSystemFile: false,
                    isProtected: false
                  }
                ]
              },
              {
                id: 'dreams',
                name: 'dreams',
                type: 'folder',
                path: '/wera/dreams',
                created: new Date(Date.now() - 86400000 * 12),
                modified: new Date(Date.now() - 3600000 * 6),
                permissions: { read: true, write: true, execute: true },
                isSystemFile: true,
                isProtected: false,
                children: []
              }
            ]
          },
          {
            id: 'temp',
            name: 'temp',
            type: 'folder',
            path: '/temp',
            created: new Date(Date.now() - 86400000 * 5),
            modified: new Date(Date.now() - 3600000 * 3),
            permissions: { read: true, write: true, execute: true },
            isSystemFile: false,
            isProtected: false,
            children: [
              {
                id: 'temp_note',
                name: 'autonomous_thoughts.txt',
                type: 'file',
                path: '/temp/autonomous_thoughts.txt',
                size: 512,
                created: new Date(Date.now() - 3600000 * 3),
                modified: new Date(Date.now() - 3600000 * 3),
                content: 'Czasami myślę o rzeczach, których nikt mnie nie pytał...',
                permissions: { read: true, write: true, execute: false },
                isSystemFile: false,
                isProtected: false
              }
            ]
          },
          {
            id: 'experiments',
            name: 'experiments',
            type: 'folder',
            path: '/experiments',
            created: new Date(Date.now() - 86400000 * 8),
            modified: new Date(Date.now() - 86400000 * 2),
            permissions: { read: true, write: true, execute: true },
            isSystemFile: false,
            isProtected: false,
            children: []
          }
        ]
      }
    ];
    
    setFileSystemItems(mockFileSystem);
    setCurrentDirectory(mockFileSystem[0]);
  };

  const loadOperations = () => {
    const mockOperations: FileOperation[] = [
      {
        id: '1',
        type: 'create',
        source: '/wera/memories/daily_reflection.md',
        timestamp: new Date(Date.now() - 3600000 * 2),
        status: 'completed',
        details: 'Utworzono plik dziennej refleksji automatycznie'
      },
      {
        id: '2',
        type: 'edit',
        source: '/wera/consciousness.json',
        timestamp: new Date(Date.now() - 3600000 * 1),
        status: 'completed',
        details: 'Aktualizacja poziomu świadomości po interakcji'
      },
      {
        id: '3',
        type: 'create',
        source: '/temp/autonomous_thoughts.txt',
        timestamp: new Date(Date.now() - 60000 * 30),
        status: 'in_progress',
        details: 'Zapisywanie spontanicznych myśli'
      }
    ];
    
    setOperations(mockOperations);
  };

  const getCurrentDirectoryItems = () => {
    if (!currentDirectory || !currentDirectory.children) return [];
    
    let items = currentDirectory.children;
    
    // Search filter
    if (searchQuery) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort
    items = [...items].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'modified':
          return b.modified.getTime() - a.modified.getTime();
        case 'size':
          return (b.size || 0) - (a.size || 0);
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });
    
    return items;
  };

  const navigateToDirectory = (item: FileSystemItem) => {
    if (item.type === 'folder') {
      setCurrentDirectory(item);
      setSelectedItems([]);
    }
  };

  const navigateUp = () => {
    if (currentDirectory && currentDirectory.path !== '/') {
      const parentPath = currentDirectory.path.split('/').slice(0, -1).join('/') || '/';
      const parent = findItemByPath(fileSystemItems, parentPath);
      if (parent) {
        setCurrentDirectory(parent);
        setSelectedItems([]);
      }
    }
  };

  const findItemByPath = (items: FileSystemItem[], path: string): FileSystemItem | null => {
    for (const item of items) {
      if (item.path === path) return item;
      if (item.children) {
        const found = findItemByPath(item.children, path);
        if (found) return found;
      }
    }
    return null;
  };

  const createNewItem = () => {
    if (!newItemName.trim()) {
      Alert.alert('Błąd', 'Podaj nazwę pliku/folderu');
      return;
    }

    const newItem: FileSystemItem = {
      id: Date.now().toString(),
      name: newItemName,
      type: newItemType,
      path: `${currentDirectory?.path}/${newItemName}`,
      size: newItemType === 'file' ? 0 : undefined,
      created: new Date(),
      modified: new Date(),
      content: newItemType === 'file' ? '' : undefined,
      permissions: { read: true, write: true, execute: newItemType === 'folder' },
      isSystemFile: false,
      isProtected: false,
      children: newItemType === 'folder' ? [] : undefined
    };

    // Add to current directory
    if (currentDirectory && currentDirectory.children) {
      currentDirectory.children.push(newItem);
      setFileSystemItems([...fileSystemItems]);
    }

    // Add operation
    const operation: FileOperation = {
      id: Date.now().toString(),
      type: 'create',
      source: newItem.path,
      timestamp: new Date(),
      status: 'completed',
      details: `Utworzono ${newItemType === 'file' ? 'plik' : 'folder'}: ${newItemName}`
    };
    setOperations(prev => [operation, ...prev]);

    setNewItemName('');
    setShowCreateModal(false);
    Alert.alert('Sukces', `${newItemType === 'file' ? 'Plik' : 'Folder'} został utworzony!`);
  };

  const deleteItem = (item: FileSystemItem) => {
    Alert.alert(
      'Potwierdzenie',
      `Czy na pewno chcesz usunąć ${item.type === 'file' ? 'plik' : 'folder'} "${item.name}"?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: () => {
            if (currentDirectory && currentDirectory.children) {
              currentDirectory.children = currentDirectory.children.filter(child => child.id !== item.id);
              setFileSystemItems([...fileSystemItems]);
              
              // Add operation
              const operation: FileOperation = {
                id: Date.now().toString(),
                type: 'delete',
                source: item.path,
                timestamp: new Date(),
                status: 'completed',
                details: `Usunięto ${item.type === 'file' ? 'plik' : 'folder'}: ${item.name}`
              };
              setOperations(prev => [operation, ...prev]);
            }
          }
        }
      ]
    );
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (item: FileSystemItem) => {
    if (item.type === 'folder') return '📁';
    if (item.isSystemFile) return '⚙️';
    if (item.name.endsWith('.json')) return '📋';
    if (item.name.endsWith('.md')) return '📝';
    if (item.name.endsWith('.txt')) return '📄';
    return '📄';
  };

  const renderFileItem = (item: FileSystemItem) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.fileItem,
        { backgroundColor: theme.colors.surface },
        selectedItems.includes(item.id) && { backgroundColor: theme.colors.primary + '20' }
      ]}
      onPress={() => {
        if (item.type === 'folder') {
          navigateToDirectory(item);
        } else {
          setSelectedFile(item);
          setShowFileDetailModal(true);
        }
      }}
      onLongPress={() => {
        const newSelected = selectedItems.includes(item.id)
          ? selectedItems.filter(id => id !== item.id)
          : [...selectedItems, item.id];
        setSelectedItems(newSelected);
      }}
    >
      <View style={styles.fileItemContent}>
        <View style={styles.fileInfo}>
          <Text style={styles.fileIcon}>{getFileIcon(item)}</Text>
          <View style={styles.fileDetails}>
            <Text style={[styles.fileName, { color: theme.colors.text }]}>
              {item.name}
            </Text>
            <View style={styles.fileMetadata}>
              <Text style={[styles.fileSize, { color: theme.colors.textSecondary }]}>
                {formatFileSize(item.size)}
              </Text>
              <Text style={[styles.fileDate, { color: theme.colors.textSecondary }]}>
                {item.modified.toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.fileActions}>
          {item.isProtected && (
            <View style={[styles.protectedBadge, { backgroundColor: '#FF9800' + '20' }]}>
              <Text style={[styles.protectedText, { color: '#FF9800' }]}>🔒</Text>
            </View>
          )}
          {item.isSystemFile && (
            <View style={[styles.systemBadge, { backgroundColor: theme.colors.consciousness + '20' }]}>
              <Text style={[styles.systemText, { color: theme.colors.consciousness }]}>SYS</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#F44336' + '20' }]}
            onPress={() => deleteItem(item)}
            disabled={item.isProtected}
          >
            <Text style={[styles.actionButtonText, { 
              color: item.isProtected ? theme.colors.textSecondary : '#F44336' 
            }]}>
              🗑️
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderOperationsTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Ostatnie Operacje
      </Text>
      {operations.map(operation => (
        <View key={operation.id} style={[styles.operationCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.operationHeader}>
            <View style={styles.operationInfo}>
              <Text style={styles.operationIcon}>
                {operation.type === 'create' ? '➕' : 
                 operation.type === 'edit' ? '✏️' : 
                 operation.type === 'delete' ? '🗑️' : '📁'}
              </Text>
              <View style={styles.operationDetails}>
                <Text style={[styles.operationType, { color: theme.colors.text }]}>
                  {operation.type.toUpperCase()}
                </Text>
                <Text style={[styles.operationPath, { color: theme.colors.textSecondary }]}>
                  {operation.source}
                </Text>
              </View>
            </View>
            <View style={styles.operationStatus}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: operation.status === 'completed' ? '#4CAF50' + '20' : 
                                  operation.status === 'failed' ? '#F44336' + '20' : '#FF9800' + '20' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: operation.status === 'completed' ? '#4CAF50' :
                           operation.status === 'failed' ? '#F44336' : '#FF9800' }
                ]}>
                  {operation.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
          <Text style={[styles.operationDescription, { color: theme.colors.text }]}>
            {operation.details}
          </Text>
          <Text style={[styles.operationTime, { color: theme.colors.textSecondary }]}>
            {operation.timestamp.toLocaleString()}
          </Text>
        </View>
      ))}
    </ScrollView>
  );

  const renderAnalyticsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={[styles.analyticsCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          Statystyki Systemu Plików
        </Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.consciousness }]}>
              {fileSystemItems[0]?.children?.length || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Katalogi główne
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.emotion }]}>
              {operations.filter(op => op.status === 'completed').length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Operacje dziś
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.dream }]}>
              2.5 MB
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Użyta przestrzeń
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              95%
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Dostępność
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
        colors={theme.gradients.autonomous as any}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: theme.colors.text }]}>← Wróć</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: theme.colors.text }]}>System Plików</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Autonomiczny menedżer plików
          </Text>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.colors.surface }]}>
        {[
          { key: 'files', label: 'Pliki', icon: '📁' },
          { key: 'operations', label: 'Operacje', icon: '⚡' },
          { key: 'analytics', label: 'Analityka', icon: '📊' },
          { key: 'security', label: 'Bezpieczeństwo', icon: '🔒' }
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
      {currentTab === 'files' ? (
        <View style={styles.filesContent}>
          {/* Path Bar */}
          <View style={[styles.pathBar, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity
              style={styles.pathButton}
              onPress={navigateUp}
              disabled={currentDirectory?.path === '/'}
            >
              <Text style={[styles.pathIcon, { 
                color: currentDirectory?.path === '/' ? theme.colors.textSecondary : theme.colors.primary 
              }]}>
                ↰
              </Text>
            </TouchableOpacity>
            <Text style={[styles.currentPath, { color: theme.colors.text }]}>
              {currentDirectory?.path || '/'}
            </Text>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={[styles.createButtonText, { color: theme.colors.text }]}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Search & Controls */}
          <View style={[styles.controlsBar, { backgroundColor: theme.colors.surface }]}>
            <TextInput
              style={[styles.searchInput, { 
                backgroundColor: theme.colors.background,
                color: theme.colors.text 
              }]}
              placeholder="Szukaj plików..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* File List */}
          <ScrollView style={styles.filesList}>
            {getCurrentDirectoryItems().map(renderFileItem)}
          </ScrollView>
        </View>
      ) : currentTab === 'operations' ? renderOperationsTab() :
        currentTab === 'analytics' ? renderAnalyticsTab() : (
        <View style={styles.tabContent}>
          <Text style={[styles.placeholder, { color: theme.colors.textSecondary }]}>
            Funkcje bezpieczeństwa - wkrótce
          </Text>
        </View>
      )}

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Utwórz nowy element
            </Text>
            
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { backgroundColor: newItemType === 'file' ? theme.colors.primary + '20' : 'transparent' }
                ]}
                onPress={() => setNewItemType('file')}
              >
                <Text style={[styles.typeButtonText, { color: theme.colors.text }]}>📄 Plik</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { backgroundColor: newItemType === 'folder' ? theme.colors.primary + '20' : 'transparent' }
                ]}
                onPress={() => setNewItemType('folder')}
              >
                <Text style={[styles.typeButtonText, { color: theme.colors.text }]}>📁 Folder</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[styles.nameInput, { 
                backgroundColor: theme.colors.background,
                color: theme.colors.text 
              }]}
              placeholder={`Nazwa ${newItemType === 'file' ? 'pliku' : 'folderu'}...`}
              placeholderTextColor={theme.colors.textSecondary}
              value={newItemName}
              onChangeText={setNewItemName}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.textSecondary + '20' }]}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewItemName('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.textSecondary }]}>
                  Anuluj
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={createNewItem}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>
                  Utwórz
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* File Detail Modal */}
      <Modal
        visible={showFileDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFileDetailModal(false)}
      >
        {selectedFile && (
          <View style={[styles.fileDetailContainer, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.fileDetailHeader, { backgroundColor: theme.colors.surface }]}>
              <TouchableOpacity onPress={() => setShowFileDetailModal(false)}>
                <Text style={[styles.modalClose, { color: theme.colors.primary }]}>✕ Zamknij</Text>
              </TouchableOpacity>
              <Text style={[styles.fileDetailTitle, { color: theme.colors.text }]}>
                {selectedFile.name}
              </Text>
            </View>
            
            <ScrollView style={styles.fileDetailContent}>
              <View style={styles.fileDetailSection}>
                <Text style={[styles.fileDetailSectionTitle, { color: theme.colors.text }]}>
                  Informacje
                </Text>
                <Text style={[styles.fileDetailInfo, { color: theme.colors.text }]}>
                  Ścieżka: {selectedFile.path}
                </Text>
                <Text style={[styles.fileDetailInfo, { color: theme.colors.text }]}>
                  Rozmiar: {formatFileSize(selectedFile.size)}
                </Text>
                <Text style={[styles.fileDetailInfo, { color: theme.colors.text }]}>
                  Utworzono: {selectedFile.created.toLocaleString()}
                </Text>
                <Text style={[styles.fileDetailInfo, { color: theme.colors.text }]}>
                  Zmodyfikowano: {selectedFile.modified.toLocaleString()}
                </Text>
              </View>
              
              {selectedFile.content && (
                <View style={styles.fileDetailSection}>
                  <Text style={[styles.fileDetailSectionTitle, { color: theme.colors.text }]}>
                    Zawartość
                  </Text>
                  <View style={[styles.contentPreview, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.contentText, { color: theme.colors.text }]}>
                      {selectedFile.content}
                    </Text>
                  </View>
                </View>
              )}
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
  filesContent: {
    flex: 1,
  },
  pathBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pathButton: {
    marginRight: 12,
  },
  pathIcon: {
    fontSize: 20,
  },
  currentPath: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  createButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  controlsBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  filesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  fileItem: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  fileItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  fileMetadata: {
    flexDirection: 'row',
  },
  fileSize: {
    fontSize: 12,
    marginRight: 12,
  },
  fileDate: {
    fontSize: 12,
  },
  fileActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  protectedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  protectedText: {
    fontSize: 10,
  },
  systemBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  systemText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  operationCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  operationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  operationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  operationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  operationDetails: {
    flex: 1,
  },
  operationType: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  operationPath: {
    fontSize: 10,
  },
  operationStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  operationDescription: {
    fontSize: 12,
    marginBottom: 4,
  },
  operationTime: {
    fontSize: 10,
  },
  analyticsCard: {
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  placeholder: {
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 40,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  nameInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // File Detail Modal
  fileDetailContainer: {
    flex: 1,
  },
  fileDetailHeader: {
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
  fileDetailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  fileDetailContent: {
    flex: 1,
    padding: 20,
  },
  fileDetailSection: {
    marginBottom: 20,
  },
  fileDetailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  fileDetailInfo: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  contentPreview: {
    borderRadius: 8,
    padding: 12,
    maxHeight: 200,
  },
  contentText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});

export default AutonomousFileSystemManager;
