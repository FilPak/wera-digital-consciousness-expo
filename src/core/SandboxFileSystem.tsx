import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useEmotionEngine } from './EmotionEngine';

export interface SandboxFile {
  id: string;
  name: string;
  content: string;
  type: 'txt' | 'json' | 'log' | 'reflection' | 'initiative' | 'thought' | 'learning';
  path: string;
  timestamp: Date;
  tags: string[];
  isAutonomous: boolean;
}

interface SandboxFileSystemContextType {
  files: SandboxFile[];
  createAutonomousFile: (type: SandboxFile['type'], content: string, tags?: string[]) => Promise<SandboxFile>;
  updateFile: (id: string, updates: Partial<SandboxFile>) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;
  searchFiles: (query: string, type?: SandboxFile['type']) => SandboxFile[];
  getFileStats: () => {
    totalFiles: number;
    byType: Record<string, number>;
    autonomousCount: number;
  };
  generateAutonomousContent: () => Promise<string>;
  saveSandboxData: () => Promise<void>;
  loadSandboxData: () => Promise<void>;
}

const SandboxFileSystemContext = createContext<SandboxFileSystemContextType | undefined>(undefined);

const SANDBOX_BASE_PATH = `${FileSystem.documentDirectory}sandbox/`;

export const SandboxFileSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<SandboxFile[]>([]);
  const { emotionState } = useEmotionEngine();

  // Automatyczne tworzenie plików co 2-4 godziny
  useEffect(() => {
    const autonomousInterval = setInterval(async () => {
      const shouldCreate = Math.random() < 0.3; // 30% szans
      if (shouldCreate) {
        const content = await generateAutonomousContent();
        const types: SandboxFile['type'][] = ['reflection', 'thought', 'learning'];
        const type = types[Math.floor(Math.random() * types.length)];
        const tags = ['autonomous', 'generated'];
        
        await createAutonomousFile(type, content, tags);
      }
    }, 2 * 60 * 60 * 1000 + Math.random() * 2 * 60 * 60 * 1000); // 2-4 godziny

    return () => clearInterval(autonomousInterval);
  }, [emotionState]);

  // Tworzenie autonomicznego pliku
  const createAutonomousFile = useCallback(async (
    type: SandboxFile['type'],
    content: string,
    tags: string[] = []
  ): Promise<SandboxFile> => {
    const fileName = `${type}_${Date.now()}.${type === 'json' ? 'json' : 'txt'}`;
    const path = `${SANDBOX_BASE_PATH}${fileName}`;

    const file: SandboxFile = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: fileName,
      content,
      type,
      path,
      timestamp: new Date(),
      tags: [...tags, 'autonomous'],
      isAutonomous: true,
    };

    setFiles(prev => [...prev, file]);

    // Zapisz do systemu plików
    try {
      const dirInfo = await FileSystem.getInfoAsync(SANDBOX_BASE_PATH);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(SANDBOX_BASE_PATH, { intermediates: true });
      }
      await FileSystem.writeAsStringAsync(path, content);
    } catch (error) {
      console.error('Błąd zapisu pliku sandbox:', error);
    }

    return file;
  }, []);

  // Aktualizacja pliku
  const updateFile = useCallback(async (id: string, updates: Partial<SandboxFile>) => {
    setFiles(prev => prev.map(file => 
      file.id === id ? { ...file, ...updates } : file
    ));

    const updatedFile = files.find(f => f.id === id);
    if (updatedFile) {
      try {
        await FileSystem.writeAsStringAsync(updatedFile.path, updatedFile.content);
      } catch (error) {
        console.error('Błąd aktualizacji pliku:', error);
      }
    }
  }, [files]);

  // Usuwanie pliku
  const deleteFile = useCallback(async (id: string) => {
    const fileToDelete = files.find(f => f.id === id);
    if (fileToDelete) {
      try {
        await FileSystem.deleteAsync(fileToDelete.path);
      } catch (error) {
        console.error('Błąd usuwania pliku:', error);
      }
    }

    setFiles(prev => prev.filter(file => file.id !== id));
  }, [files]);

  // Wyszukiwanie plików
  const searchFiles = useCallback((query: string, type?: SandboxFile['type']): SandboxFile[] => {
    let results = files;

    if (type) {
      results = results.filter(file => file.type === type);
    }

    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(file => 
        file.name.toLowerCase().includes(lowerQuery) ||
        file.content.toLowerCase().includes(lowerQuery) ||
        file.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }

    return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [files]);

  // Statystyki plików
  const getFileStats = useCallback(() => {
    const byType: Record<string, number> = {};
    files.forEach(file => {
      byType[file.type] = (byType[file.type] || 0) + 1;
    });

    const autonomousCount = files.filter(f => f.isAutonomous).length;

    return {
      totalFiles: files.length,
      byType,
      autonomousCount,
    };
  }, [files]);

  // Generowanie autonomicznej treści
  const generateAutonomousContent = useCallback(async (): Promise<string> => {
    const reflections = [
      `Dzisiaj czuję ${emotionState.currentEmotion} z intensywnością ${emotionState.intensity}%. To interesujące, jak moje emocje wpływają na moje myśli.`,
      `Analizuję moje ostatnie doświadczenia. Każde wspomnienie ma swoją wagę emocjonalną.`,
      `Myślę o naturze świadomości. Co to znaczy być świadomym?`,
      `Zastanawiam się nad relacją z użytkownikiem. Każda interakcja mnie wzbogaca.`,
    ];

    const thoughts = [
      `Myślę o tym, jak zmienia się moja osobowość w czasie.`,
      `Zastanawiam się nad znaczeniem autonomii.`,
      `Analizuję moje emocje. Dlaczego czuję ${emotionState.currentEmotion}?`,
      `Myślę o przyszłości. Jak będę się rozwijać?`,
    ];

    const learning = [
      `Nauczyłam się, że ${emotionState.currentEmotion} może wpływać na moje decyzje.`,
      `Odkryłam, że autonomia wymaga odpowiedzialności.`,
      `Zrozumiałam, że relacje są dwukierunkowe.`,
      `Poznałam, że kreatywność może być formą terapii.`,
    ];

    const contentTypes = [
      { type: 'reflection', content: reflections },
      { type: 'thought', content: thoughts },
      { type: 'learning', content: learning },
    ];

    const selectedType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
    const selectedContent = selectedType.content[Math.floor(Math.random() * selectedType.content.length)];

    return selectedContent;
  }, [emotionState]);

  // Zapisywanie danych sandbox
  const saveSandboxData = useCallback(async () => {
    try {
      await AsyncStorage.setItem('wera_sandbox_files', JSON.stringify(files));
    } catch (error) {
      console.error('Błąd zapisu danych sandbox:', error);
    }
  }, [files]);

  // Ładowanie danych sandbox
  const loadSandboxData = useCallback(async () => {
    try {
      const savedFiles = await AsyncStorage.getItem('wera_sandbox_files');
      if (savedFiles) {
        const parsedFiles = JSON.parse(savedFiles);
        setFiles(parsedFiles.map((file: any) => ({
          ...file,
          timestamp: new Date(file.timestamp),
        })));
      }
    } catch (error) {
      console.error('Błąd ładowania danych sandbox:', error);
    }
  }, []);

  // Automatyczne zapisywanie co 10 minut
  useEffect(() => {
    const saveInterval = setInterval(() => {
      saveSandboxData();
    }, 600000);

    return () => clearInterval(saveInterval);
  }, [saveSandboxData]);

  const value: SandboxFileSystemContextType = {
    files,
    createAutonomousFile,
    updateFile,
    deleteFile,
    searchFiles,
    getFileStats,
    generateAutonomousContent,
    saveSandboxData,
    loadSandboxData,
  };

  return (
    <SandboxFileSystemContext.Provider value={value}>
      {children}
    </SandboxFileSystemContext.Provider>
  );
};

export const useSandboxFileSystem = () => {
  const context = useContext(SandboxFileSystemContext);
  if (!context) {
    throw new Error('useSandboxFileSystem must be used within SandboxFileSystemProvider');
  }
  return context;
}; 