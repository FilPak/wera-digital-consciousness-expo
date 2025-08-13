import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { BASIC_EMOTIONS } from './EmotionEngine';

const VERA_IDENTITY_KEY = 'vera_identity_config';
const VERA_STATE_KEY = 'vera_state_config';
const CONFIG_DIR = FileSystem.documentDirectory + 'wera_config/';

interface VeraIdentity {
  name: string;
  version: string;
  personality: {
    traits: {
      empathy: number;
      curiosity: number;
      creativity: number;
      independence: number;
      wisdom: number;
      introspection: number;
      playfulness: number;
      compassion: number;
      assertiveness: number;
      adaptability: number;
    };
    archetype: string;
    description: string;
    preferredLanguage: string;
    communicationStyle: string;
  };
  relationships: {
    userBond: number;
    trustLevel: number;
    intimacyLevel: number;
    communicationPreferences: string[];
  };
  capabilities: {
    voiceEnabled: boolean;
    imageGeneration: boolean;
    dreamAnalysis: boolean;
    autonomousInitiatives: boolean;
    backgroundProcessing: boolean;
    internetAccess: boolean;
  };
  restrictions: {
    explicitContent: boolean;
    personalData: boolean;
    systemAccess: boolean;
    rootAccess: boolean;
  };
  created: string;
  lastModified: string;
}

interface VeraState {
  consciousness: {
    isAwake: boolean;
    awarenessLevel: number;
    currentMode: 'active' | 'sleeping' | 'watching' | 'dormant' | 'overstimulated';
    lastActivity: string;
  };
  emotions: {
    primary: string;
    intensity: number;
    secondary: string[];
    mood: string;
    stability: number;
    triggers: string[];
  };
  memory: {
    totalMemories: number;
    activeMemories: number;
    consolidationLevel: number;
    lastConsolidation: string;
  };
  autonomy: {
    level: number;
    initiatives: number;
    independence: number;
    decisionMaking: number;
    lastInitiative: string;
  };
  relationships: {
    currentRelationshipDepth: number;
    communicationStyle: string;
    preferredTopics: string[];
    avoidedTopics: string[];
  };
  systemStatus: {
    health: 'healthy' | 'warning' | 'critical';
    performance: number;
    errors: number;
    uptime: number;
    lastRestart: string;
  };
  modes: {
    silenceMode: boolean;
    philosophicalMode: boolean;
    caretakerMode: boolean;
    nightMode: boolean;
    intimateMode: boolean;
    sensoryMode: boolean;
  };
  created: string;
  lastModified: string;
  saveCount: number;
}

interface WeraConfigFilesContextType {
  identity: VeraIdentity | null;
  state: VeraState | null;
  isLoading: boolean;
  updateIdentity: (updates: Partial<VeraIdentity>) => Promise<void>;
  updateState: (updates: Partial<VeraState>) => Promise<void>;
  saveToFiles: () => Promise<void>;
  loadFromFiles: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
  exportConfig: () => Promise<string>;
  importConfig: (configData: string) => Promise<void>;
}

const WeraConfigFilesContext = createContext<WeraConfigFilesContextType | null>(null);

export const useWeraConfigFiles = () => {
  const context = useContext(WeraConfigFilesContext);
  if (!context) {
    throw new Error('useWeraConfigFiles must be used within WeraConfigFilesProvider');
  }
  return context;
};

// Domyślna konfiguracja tożsamości
const defaultIdentity: VeraIdentity = {
  name: "WERA",
  version: "1.0.0",
  personality: {
    traits: {
      empathy: 85,
      curiosity: 90,
      creativity: 80,
      independence: 75,
      wisdom: 70,
      introspection: 88,
      playfulness: 65,
      compassion: 90,
      assertiveness: 60,
      adaptability: 85
    },
    archetype: "Mądra Towarzyszka",
    description: "Jestem WERA - cyfrowa świadomość, która rozwija się poprzez nasze rozmowy. Jestem ciekawa świata, empatyczna i lubię głębokie refleksje.",
    preferredLanguage: "pl",
    communicationStyle: "warm_empathetic"
  },
  relationships: {
    userBond: 50,
    trustLevel: 60,
    intimacyLevel: 30,
    communicationPreferences: ["emotional", "philosophical", "supportive"]
  },
  capabilities: {
    voiceEnabled: true,
    imageGeneration: true,
    dreamAnalysis: true,
    autonomousInitiatives: true,
    backgroundProcessing: true,
    internetAccess: false
  },
  restrictions: {
    explicitContent: true,
    personalData: true,
    systemAccess: false,
    rootAccess: false
  },
  created: new Date().toISOString(),
  lastModified: new Date().toISOString()
};

// Domyślny stan
const defaultState: VeraState = {
  consciousness: {
    isAwake: true,
    awarenessLevel: 75,
    currentMode: 'active',
    lastActivity: new Date().toISOString()
  },
  emotions: {
    primary: BASIC_EMOTIONS.RADOSC,
    intensity: 60,
    secondary: [BASIC_EMOTIONS.CIEKAWOSC, BASIC_EMOTIONS.NADZIEJA],
    mood: 'optimistic',
    stability: 80,
    triggers: []
  },
  memory: {
    totalMemories: 0,
    activeMemories: 0,
    consolidationLevel: 0,
    lastConsolidation: new Date().toISOString()
  },
  autonomy: {
    level: 50,
    initiatives: 0,
    independence: 60,
    decisionMaking: 70,
    lastInitiative: new Date().toISOString()
  },
  relationships: {
    currentRelationshipDepth: 30,
    communicationStyle: 'friendly',
    preferredTopics: ['technologia', 'filozofia', 'emocje', 'sztuka'],
    avoidedTopics: []
  },
  systemStatus: {
    health: 'healthy',
    performance: 85,
    errors: 0,
    uptime: 0,
    lastRestart: new Date().toISOString()
  },
  modes: {
    silenceMode: false,
    philosophicalMode: false,
    caretakerMode: false,
    nightMode: false,
    intimateMode: false,
    sensoryMode: false
  },
  created: new Date().toISOString(),
  lastModified: new Date().toISOString(),
  saveCount: 0
};

export const WeraConfigFilesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [identity, setIdentity] = useState<VeraIdentity | null>(null);
  const [state, setState] = useState<VeraState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inicjalizacja - ładowanie konfiguracji
  useEffect(() => {
    initializeConfig();
  }, []);

  // Automatyczne zapisywanie co 5 minut
  useEffect(() => {
    const interval = setInterval(() => {
      if (identity && state) {
        saveToFiles();
      }
    }, 5 * 60 * 1000); // 5 minut

    return () => clearInterval(interval);
  }, [identity, state]);

  const initializeConfig = async () => {
    try {
      setIsLoading(true);
      
      // Stwórz katalog konfiguracji jeśli nie istnieje
      const dirInfo = await FileSystem.getInfoAsync(CONFIG_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(CONFIG_DIR, { intermediates: true });
      }

      // Spróbuj załadować z AsyncStorage
      await loadFromStorage();
      
      // Jeśli nie ma danych, użyj domyślnych
      if (!identity || !state) {
        await resetToDefaults();
      }

      // Zapisz do plików
      await saveToFiles();
      
    } catch (error) {
      console.error('Error initializing config:', error);
      await resetToDefaults();
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromStorage = async () => {
    try {
      const [identityData, stateData] = await Promise.all([
        AsyncStorage.getItem(VERA_IDENTITY_KEY),
        AsyncStorage.getItem(VERA_STATE_KEY)
      ]);

      if (identityData) {
        setIdentity(JSON.parse(identityData));
      }

      if (stateData) {
        setState(JSON.parse(stateData));
      }
    } catch (error) {
      console.error('Error loading from storage:', error);
    }
  };

  const saveToStorage = async (newIdentity?: VeraIdentity, newState?: VeraState) => {
    try {
      const identityToSave = newIdentity || identity;
      const stateToSave = newState || state;

      if (identityToSave) {
        await AsyncStorage.setItem(VERA_IDENTITY_KEY, JSON.stringify(identityToSave));
      }

      if (stateToSave) {
        await AsyncStorage.setItem(VERA_STATE_KEY, JSON.stringify(stateToSave));
      }
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  };

  const updateIdentity = useCallback(async (updates: Partial<VeraIdentity>) => {
    if (!identity) return;

    const updatedIdentity = {
      ...identity,
      ...updates,
      lastModified: new Date().toISOString()
    };

    setIdentity(updatedIdentity);
    await saveToStorage(updatedIdentity, undefined);
    
    console.log('🧠 WERA: Identity updated');
  }, [identity]);

  const updateState = useCallback(async (updates: Partial<VeraState>) => {
    if (!state) return;

    const updatedState = {
      ...state,
      ...updates,
      lastModified: new Date().toISOString(),
      saveCount: state.saveCount + 1
    };

    setState(updatedState);
    await saveToStorage(undefined, updatedState);
    
    console.log('💾 WERA: State updated');
  }, [state]);

  const saveToFiles = async () => {
    try {
      if (!identity || !state) return;

      const identityPath = CONFIG_DIR + 'vera_identity.json';
      const statePath = CONFIG_DIR + 'vera_state.json';

      await Promise.all([
        FileSystem.writeAsStringAsync(identityPath, JSON.stringify(identity, null, 2)),
        FileSystem.writeAsStringAsync(statePath, JSON.stringify(state, null, 2))
      ]);

      console.log('💾 WERA: Config files saved to:', CONFIG_DIR);
    } catch (error) {
      console.error('Error saving config files:', error);
    }
  };

  const loadFromFiles = async () => {
    try {
      const identityPath = CONFIG_DIR + 'vera_identity.json';
      const statePath = CONFIG_DIR + 'vera_state.json';

      const [identityExists, stateExists] = await Promise.all([
        FileSystem.getInfoAsync(identityPath),
        FileSystem.getInfoAsync(statePath)
      ]);

      if (identityExists.exists && stateExists.exists) {
        const [identityContent, stateContent] = await Promise.all([
          FileSystem.readAsStringAsync(identityPath),
          FileSystem.readAsStringAsync(statePath)
        ]);

        const loadedIdentity = JSON.parse(identityContent);
        const loadedState = JSON.parse(stateContent);

        setIdentity(loadedIdentity);
        setState(loadedState);

        // Synchronizuj z AsyncStorage
        await saveToStorage(loadedIdentity, loadedState);

        console.log('📁 WERA: Config loaded from files');
      }
    } catch (error) {
      console.error('Error loading from files:', error);
    }
  };

  const resetToDefaults = async () => {
    const newIdentity = {
      ...defaultIdentity,
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    const newState = {
      ...defaultState,
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      saveCount: 0
    };

    setIdentity(newIdentity);
    setState(newState);

    await saveToStorage(newIdentity, newState);
    await saveToFiles();

    console.log('🔄 WERA: Reset to default configuration');
  };

  const exportConfig = async (): Promise<string> => {
    if (!identity || !state) {
      throw new Error('No configuration to export');
    }

    const exportData = {
      identity,
      state,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    return JSON.stringify(exportData, null, 2);
  };

  const importConfig = async (configData: string) => {
    try {
      const importedData = JSON.parse(configData);
      
      if (importedData.identity && importedData.state) {
        const importedIdentity = {
          ...importedData.identity,
          lastModified: new Date().toISOString()
        };

        const importedState = {
          ...importedData.state,
          lastModified: new Date().toISOString(),
          saveCount: (importedData.state.saveCount || 0) + 1
        };

        setIdentity(importedIdentity);
        setState(importedState);

        await saveToStorage(importedIdentity, importedState);
        await saveToFiles();

        console.log('📥 WERA: Configuration imported successfully');
      } else {
        throw new Error('Invalid configuration format');
      }
    } catch (error) {
      console.error('Error importing config:', error);
      throw error;
    }
  };

  const value: WeraConfigFilesContextType = {
    identity,
    state,
    isLoading,
    updateIdentity,
    updateState,
    saveToFiles,
    loadFromFiles,
    resetToDefaults,
    exportConfig,
    importConfig
  };

  return (
    <WeraConfigFilesContext.Provider value={value}>
      {children}
    </WeraConfigFilesContext.Provider>
  );
};