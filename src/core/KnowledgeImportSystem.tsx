import React, { createContext, useContext, useState, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useKnowledge } from './KnowledgeEngine';
import { useLogExportSystem } from './LogExportSystem';

const KNOWLEDGE_IMPORT_KEY = 'wera_imported_knowledge';
const IMPORT_DIR = FileSystem.documentDirectory + 'wera_knowledge_imports/';

interface ImportedKnowledgeFile {
  id: string;
  name: string;
  type: 'json' | 'txt' | 'zip' | 'html' | 'md' | 'pdf';
  size: number;
  importDate: string;
  processedDate?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  extractedEntries: number;
  tags: string[];
  description?: string;
}

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  source: string;
  category: string;
  tags: string[];
  importance: number; // 0-100
  dateAdded: string;
  lastAccessed?: string;
}

interface KnowledgeImportSystemContextType {
  importedFiles: ImportedKnowledgeFile[];
  isProcessing: boolean;
  importFile: () => Promise<ImportedKnowledgeFile | null>;
  processFile: (fileId: string) => Promise<void>;
  deleteImport: (fileId: string) => Promise<void>;
  getImportStats: () => {
    totalFiles: number;
    totalEntries: number;
    pendingFiles: number;
    completedFiles: number;
    totalSize: number;
  };
  searchImportedKnowledge: (query: string) => KnowledgeEntry[];
  exportKnowledgeBase: () => Promise<string>;
}

const KnowledgeImportSystemContext = createContext<KnowledgeImportSystemContextType | null>(null);

export const useKnowledgeImportSystem = () => {
  const context = useContext(KnowledgeImportSystemContext);
  if (!context) {
    throw new Error('useKnowledgeImportSystem must be used within KnowledgeImportSystemProvider');
  }
  return context;
};

export const KnowledgeImportSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addKnowledgeEntry } = useKnowledge();
  const { logSystem } = useLogExportSystem();

  const [importedFiles, setImportedFiles] = useState<ImportedKnowledgeFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);

  // Inicjalizacja - ładowanie importowanych plików
  React.useEffect(() => {
    initializeImportSystem();
  }, []);

  const initializeImportSystem = async () => {
    try {
      // Stwórz katalog importów
      const dirInfo = await FileSystem.getInfoAsync(IMPORT_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(IMPORT_DIR, { intermediates: true });
      }

      // Załaduj listę importowanych plików
      const savedFiles = await AsyncStorage.getItem(KNOWLEDGE_IMPORT_KEY);
      if (savedFiles) {
        setImportedFiles(JSON.parse(savedFiles));
      }

      await logSystem('info', 'KNOWLEDGE_IMPORT', 'Knowledge import system initialized');
    } catch (error) {
      await logSystem('error', 'KNOWLEDGE_IMPORT', 'Failed to initialize import system', error);
    }
  };

  const saveImportedFiles = async (files: ImportedKnowledgeFile[]) => {
    try {
      await AsyncStorage.setItem(KNOWLEDGE_IMPORT_KEY, JSON.stringify(files));
    } catch (error) {
      await logSystem('error', 'KNOWLEDGE_IMPORT', 'Failed to save imported files list', error);
    }
  };

  const importFile = async (): Promise<ImportedKnowledgeFile | null> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'application/json', 'application/zip', 'text/html', 'text/markdown'],
        copyToCacheDirectory: true,
        multiple: false
      });

      if (result.canceled) {
        return null;
      }

      const file = result.assets[0];
      const fileId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Skopiuj plik do katalogu importów
      const destinationPath = IMPORT_DIR + fileId + '_' + file.name;
      await FileSystem.copyAsync({
        from: file.uri,
        to: destinationPath
      });

      // Określ typ pliku
      const fileType = determineFileType(file.name, file.mimeType);
      
      const importedFile: ImportedKnowledgeFile = {
        id: fileId,
        name: file.name,
        type: fileType,
        size: file.size || 0,
        importDate: new Date().toISOString(),
        status: 'pending',
        extractedEntries: 0,
        tags: [],
        description: `Imported ${fileType.toUpperCase()} file: ${file.name}`
      };

      const updatedFiles = [...importedFiles, importedFile];
      setImportedFiles(updatedFiles);
      await saveImportedFiles(updatedFiles);

      await logSystem('info', 'KNOWLEDGE_IMPORT', `File imported: ${file.name}`, { fileId, size: file.size });
      
      return importedFile;
    } catch (error) {
      await logSystem('error', 'KNOWLEDGE_IMPORT', 'Failed to import file', error);
      return null;
    }
  };

  const determineFileType = (filename: string, mimeType?: string): ImportedKnowledgeFile['type'] => {
    const ext = filename.toLowerCase().split('.').pop();
    
    if (ext === 'json' || mimeType?.includes('json')) return 'json';
    if (ext === 'zip' || mimeType?.includes('zip')) return 'zip';
    if (ext === 'html' || mimeType?.includes('html')) return 'html';
    if (ext === 'md' || ext === 'markdown') return 'md';
    if (ext === 'pdf' || mimeType?.includes('pdf')) return 'pdf';
    
    return 'txt';
  };

  const processFile = async (fileId: string) => {
    try {
      setIsProcessing(true);
      
      const fileIndex = importedFiles.findIndex(f => f.id === fileId);
      if (fileIndex === -1) {
        throw new Error('File not found');
      }

      const file = importedFiles[fileIndex];
      const filePath = IMPORT_DIR + fileId + '_' + file.name;

      // Aktualizuj status na "processing"
      const updatedFiles = [...importedFiles];
      updatedFiles[fileIndex] = { ...file, status: 'processing' };
      setImportedFiles(updatedFiles);

      await logSystem('info', 'KNOWLEDGE_IMPORT', `Processing file: ${file.name}`);

      let extractedEntries = 0;
      let entries: KnowledgeEntry[] = [];

      switch (file.type) {
        case 'json':
          entries = await processJsonFile(filePath, file);
          break;
        case 'txt':
          entries = await processTextFile(filePath, file);
          break;
        case 'html':
          entries = await processHtmlFile(filePath, file);
          break;
        case 'md':
          entries = await processMarkdownFile(filePath, file);
          break;
        default:
          throw new Error(`Unsupported file type: ${file.type}`);
      }

      extractedEntries = entries.length;

      // Dodaj wpisy do bazy wiedzy
      for (const entry of entries) {
        await addKnowledgeEntry({
          title: entry.title,
          content: entry.content,
          category: entry.category,
          tags: entry.tags,
          source: `imported_${file.name}`,
          importance: entry.importance,
          type: 'text'
        });
      }

      // Aktualizuj status na "completed"
      updatedFiles[fileIndex] = {
        ...file,
        status: 'completed',
        processedDate: new Date().toISOString(),
        extractedEntries
      };
      
      setImportedFiles(updatedFiles);
      await saveImportedFiles(updatedFiles);

      await logSystem('info', 'KNOWLEDGE_IMPORT', `File processed successfully: ${file.name}`, { 
        extractedEntries 
      });

    } catch (error) {
      // Aktualizuj status na "error"
      const fileIndex = importedFiles.findIndex(f => f.id === fileId);
      if (fileIndex !== -1) {
        const updatedFiles = [...importedFiles];
        updatedFiles[fileIndex] = {
          ...updatedFiles[fileIndex],
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        };
        setImportedFiles(updatedFiles);
        await saveImportedFiles(updatedFiles);
      }

      await logSystem('error', 'KNOWLEDGE_IMPORT', 'Failed to process file', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const processJsonFile = async (filePath: string, file: ImportedKnowledgeFile): Promise<KnowledgeEntry[]> => {
    const content = await FileSystem.readAsStringAsync(filePath);
    const data = JSON.parse(content);
    const entries: KnowledgeEntry[] = [];

    if (Array.isArray(data)) {
      // Tablica obiektów
      data.forEach((item, index) => {
        if (typeof item === 'object' && item.title && item.content) {
          entries.push({
            id: `${file.id}_entry_${index}`,
            title: item.title,
            content: item.content,
            source: file.name,
            category: item.category || 'imported',
            tags: item.tags || ['import', 'json'],
            importance: item.importance || 50,
            dateAdded: new Date().toISOString()
          });
        }
      });
    } else if (typeof data === 'object') {
      // Pojedynczy obiekt lub obiekt z kluczami
      Object.entries(data).forEach(([key, value], index) => {
        if (typeof value === 'object' && (value as any).title && (value as any).content) {
          const item = value as any;
          entries.push({
            id: `${file.id}_entry_${index}`,
            title: item.title,
            content: item.content,
            source: file.name,
            category: item.category || 'imported',
            tags: item.tags || ['import', 'json'],
            importance: item.importance || 50,
            dateAdded: new Date().toISOString()
          });
        } else if (typeof value === 'string') {
          entries.push({
            id: `${file.id}_entry_${index}`,
            title: key,
            content: value,
            source: file.name,
            category: 'imported',
            tags: ['import', 'json', 'key-value'],
            importance: 40,
            dateAdded: new Date().toISOString()
          });
        }
      });
    }

    return entries;
  };

  const processTextFile = async (filePath: string, file: ImportedKnowledgeFile): Promise<KnowledgeEntry[]> => {
    const content = await FileSystem.readAsStringAsync(filePath);
    const entries: KnowledgeEntry[] = [];

    // Podziel na sekcje (np. po pustych liniach lub nagłówkach)
    const sections = content.split(/\n\s*\n/).filter(section => section.trim().length > 0);

    sections.forEach((section, index) => {
      const lines = section.trim().split('\n');
      const title = lines[0].substring(0, 100) + (lines[0].length > 100 ? '...' : '');
      
      entries.push({
        id: `${file.id}_section_${index}`,
        title: title,
        content: section.trim(),
        source: file.name,
        category: 'text_import',
        tags: ['import', 'text', 'section'],
        importance: Math.min(100, section.length / 10), // Ważność na podstawie długości
        dateAdded: new Date().toISOString()
      });
    });

    return entries;
  };

  const processHtmlFile = async (filePath: string, file: ImportedKnowledgeFile): Promise<KnowledgeEntry[]> => {
    const content = await FileSystem.readAsStringAsync(filePath);
    const entries: KnowledgeEntry[] = [];

    // Prosta ekstrakcja tekstu z HTML (bez pełnego parsera DOM)
    const textContent = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Podziel na sekcje
    const sections = textContent.split(/\.\s+/).filter(section => section.trim().length > 50);

    sections.forEach((section, index) => {
      const title = section.substring(0, 100) + (section.length > 100 ? '...' : '');
      
      entries.push({
        id: `${file.id}_html_${index}`,
        title: title,
        content: section.trim(),
        source: file.name,
        category: 'html_import',
        tags: ['import', 'html', 'web'],
        importance: 60,
        dateAdded: new Date().toISOString()
      });
    });

    return entries;
  };

  const processMarkdownFile = async (filePath: string, file: ImportedKnowledgeFile): Promise<KnowledgeEntry[]> => {
    const content = await FileSystem.readAsStringAsync(filePath);
    const entries: KnowledgeEntry[] = [];

    // Podziel na sekcje na podstawie nagłówków
    const sections = content.split(/^#+\s+/m).filter(section => section.trim().length > 0);

    sections.forEach((section, index) => {
      const lines = section.trim().split('\n');
      const title = lines[0].replace(/#+\s*/, '').substring(0, 100);
      const content = lines.slice(1).join('\n').trim();
      
      if (content.length > 20) {
        entries.push({
          id: `${file.id}_md_${index}`,
          title: title || `Section ${index + 1}`,
          content: content,
          source: file.name,
          category: 'markdown_import',
          tags: ['import', 'markdown', 'documentation'],
          importance: 70,
          dateAdded: new Date().toISOString()
        });
      }
    });

    return entries;
  };

  const deleteImport = async (fileId: string) => {
    try {
      const file = importedFiles.find(f => f.id === fileId);
      if (!file) return;

      // Usuń plik
      const filePath = IMPORT_DIR + fileId + '_' + file.name;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
      }

      // Usuń z listy
      const updatedFiles = importedFiles.filter(f => f.id !== fileId);
      setImportedFiles(updatedFiles);
      await saveImportedFiles(updatedFiles);

      await logSystem('info', 'KNOWLEDGE_IMPORT', `Deleted import: ${file.name}`);
    } catch (error) {
      await logSystem('error', 'KNOWLEDGE_IMPORT', 'Failed to delete import', error);
    }
  };

  const getImportStats = () => {
    const totalFiles = importedFiles.length;
    const totalEntries = importedFiles.reduce((sum, file) => sum + file.extractedEntries, 0);
    const pendingFiles = importedFiles.filter(f => f.status === 'pending').length;
    const completedFiles = importedFiles.filter(f => f.status === 'completed').length;
    const totalSize = importedFiles.reduce((sum, file) => sum + file.size, 0);

    return {
      totalFiles,
      totalEntries,
      pendingFiles,
      completedFiles,
      totalSize
    };
  };

  const searchImportedKnowledge = (query: string): KnowledgeEntry[] => {
    const searchTerms = query.toLowerCase().split(' ');
    
    return knowledgeEntries.filter(entry => {
      const searchableText = `${entry.title} ${entry.content} ${entry.tags.join(' ')}`.toLowerCase();
      return searchTerms.every(term => searchableText.includes(term));
    });
  };

  const exportKnowledgeBase = async (): Promise<string> => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalEntries: knowledgeEntries.length,
      entries: knowledgeEntries,
      importedFiles: importedFiles.map(f => ({
        name: f.name,
        type: f.type,
        importDate: f.importDate,
        extractedEntries: f.extractedEntries,
        tags: f.tags
      }))
    };

    const filePath = IMPORT_DIR + `knowledge_export_${Date.now()}.json`;
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(exportData, null, 2));
    
    return filePath;
  };

  const value: KnowledgeImportSystemContextType = {
    importedFiles,
    isProcessing,
    importFile,
    processFile,
    deleteImport,
    getImportStats,
    searchImportedKnowledge,
    exportKnowledgeBase
  };

  return (
    <KnowledgeImportSystemContext.Provider value={value}>
      {children}
    </KnowledgeImportSystemContext.Provider>
  );
};