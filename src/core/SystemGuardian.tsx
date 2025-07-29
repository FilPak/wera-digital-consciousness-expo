import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useMemory } from '../contexts/MemoryContext';

export interface SystemIntegrity {
  isHealthy: boolean;
  lastCheck: Date;
  criticalFiles: FileStatus[];
  missingFiles: string[];
  corruptedFiles: string[];
  repairAttempts: number;
  autoRepairEnabled: boolean;
  systemStability: number; // 0-100
  errorCount: number;
  warningCount: number;
}

export interface FileStatus {
  path: string;
  name: string;
  type: 'core' | 'data' | 'config' | 'cache' | 'backup';
  exists: boolean;
  size: number;
  lastModified: Date;
  checksum?: string;
  isCorrupted: boolean;
  isRequired: boolean;
  backupExists: boolean;
}

export interface SystemError {
  id: string;
  type: 'critical' | 'error' | 'warning' | 'info';
  category: 'file_system' | 'memory' | 'network' | 'security' | 'performance' | 'integrity';
  message: string;
  details: string;
  timestamp: Date;
  isResolved: boolean;
  resolution?: string;
  stackTrace?: string;
  affectedComponents: string[];
  severity: number; // 0-100
}

export interface RepairAction {
  id: string;
  type: 'create_file' | 'restore_backup' | 'fix_corruption' | 'clear_cache' | 'reset_config';
  target: string;
  description: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
  duration: number; // w ms
}

export interface SystemLog {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  category: string;
  message: string;
  timestamp: Date;
  data?: any;
  component: string;
}

interface SystemGuardianContextType {
  systemIntegrity: SystemIntegrity;
  systemErrors: SystemError[];
  repairActions: RepairAction[];
  systemLogs: SystemLog[];
  isMonitoring: boolean;
  runSystemCheck: () => Promise<void>;
  runFileVerification: () => Promise<void>;
  attemptAutoRepair: () => Promise<boolean>;
  createMissingFiles: () => Promise<void>;
  restoreFromBackup: (filePath: string) => Promise<boolean>;
  addSystemError: (error: Omit<SystemError, 'id' | 'timestamp'>) => Promise<SystemError>;
  resolveError: (errorId: string, resolution: string) => Promise<void>;
  logSystemEvent: (log: Omit<SystemLog, 'id' | 'timestamp'>) => Promise<void>;
  exportSystemLogs: () => Promise<string>;
  clearOldLogs: (olderThanDays: number) => Promise<void>;
  getSystemHealth: () => {
    overallHealth: number;
    criticalIssues: number;
    repairSuccess: number;
    uptime: number;
  };
  generateSystemReport: () => Promise<string>;
  saveSystemData: () => Promise<void>;
  loadSystemData: () => Promise<void>;
}

const SystemGuardianContext = createContext<SystemGuardianContextType | undefined>(undefined);

const SYSTEM_FILE_PATH = `${FileSystem.documentDirectory}system/`;
const LOGS_FILE_PATH = `${FileSystem.documentDirectory}logs/`;

// Krytyczne pliki systemu
const CRITICAL_FILES: Array<{path: string, name: string, type: FileStatus['type'], isRequired: boolean}> = [
  { path: `${FileSystem.documentDirectory}memory.jsonl`, name: 'memory.jsonl', type: 'data', isRequired: true },
  { path: `${FileSystem.documentDirectory}vera_identity.json`, name: 'vera_identity.json', type: 'core', isRequired: true },
  { path: `${FileSystem.documentDirectory}vera_state.json`, name: 'vera_state.json', type: 'core', isRequired: true },
  { path: `${FileSystem.documentDirectory}emotion_history.log`, name: 'emotion_history.log', type: 'data', isRequired: true },
  { path: `${FileSystem.documentDirectory}system_logs.txt`, name: 'system_logs.txt', type: 'data', isRequired: false },
  { path: `${FileSystem.documentDirectory}sandbox_dreams/`, name: 'sandbox_dreams', type: 'data', isRequired: false },
  { path: `${FileSystem.documentDirectory}sandbox_thoughts/`, name: 'sandbox_thoughts', type: 'data', isRequired: false },
  { path: `${FileSystem.documentDirectory}sandbox_reflections/`, name: 'sandbox_reflections', type: 'data', isRequired: false },
];

export const SystemGuardianProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [systemIntegrity, setSystemIntegrity] = useState<SystemIntegrity>({
    isHealthy: true,
    lastCheck: new Date(),
    criticalFiles: [],
    missingFiles: [],
    corruptedFiles: [],
    repairAttempts: 0,
    autoRepairEnabled: true,
    systemStability: 95,
    errorCount: 0,
    warningCount: 0,
  });

  const [systemErrors, setSystemErrors] = useState<SystemError[]>([]);
  const [repairActions, setRepairActions] = useState<RepairAction[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);

  const { addMemory } = useMemory();

  // Będę kontynuować implementację w następnej części...
  
  const value: SystemGuardianContextType = {
    systemIntegrity,
    systemErrors,
    repairActions,
    systemLogs,
    isMonitoring,
    runSystemCheck: async () => {},
    runFileVerification: async () => {},
    attemptAutoRepair: async () => false,
    createMissingFiles: async () => {},
    restoreFromBackup: async () => false,
    addSystemError: async (error) => ({ ...error, id: '', timestamp: new Date() }),
    resolveError: async () => {},
    logSystemEvent: async () => {},
    exportSystemLogs: async () => '',
    clearOldLogs: async () => {},
    getSystemHealth: () => ({ overallHealth: 95, criticalIssues: 0, repairSuccess: 100, uptime: 3600 }),
    generateSystemReport: async () => '',
    saveSystemData: async () => {},
    loadSystemData: async () => {},
  };

  return (
    <SystemGuardianContext.Provider value={value}>
      {children}
    </SystemGuardianContext.Provider>
  );
};

export const useSystemGuardian = () => {
  const context = useContext(SystemGuardianContext);
  if (!context) {
    throw new Error('useSystemGuardian must be used within SystemGuardianProvider');
  }
  return context;
}; 