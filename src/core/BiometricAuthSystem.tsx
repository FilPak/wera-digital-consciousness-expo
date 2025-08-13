import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { Platform, Alert } from 'react-native';
import { useMemory } from '../contexts/MemoryContext';
import { useNetworkEngine } from './NetworkEngine';

export interface BiometricConfig {
  enabled: boolean;
  methods: ('fingerprint' | 'face' | 'pin')[];
  fallbackToPin: boolean;
  requireBiometricForSensitive: boolean;
  autoLockTimeout: number; // w minutach
  maxFailedAttempts: number;
  lockoutDuration: number; // w minutach
  encryptionLevel: 'basic' | 'standard' | 'high';
  backupRecovery: boolean;
  emergencyAccess: boolean;
}

export interface SecurityLevel {
  level: 'public' | 'private' | 'sensitive' | 'critical';
  requiresAuth: boolean;
  timeout: number; // w minutach
  encryption: boolean;
  audit: boolean;
}

export interface AuthSession {
  id: string;
  timestamp: Date;
  method: 'fingerprint' | 'face' | 'pin' | 'emergency';
  success: boolean;
  context: string;
  ipAddress?: string;
  deviceInfo?: string;
}

export interface EncryptionKey {
  id: string;
  algorithm: 'AES-256' | 'ChaCha20' | 'RSA-2048';
  keySize: number;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

interface BiometricAuthSystemContextType {
  biometricConfig: BiometricConfig;
  isAuthenticated: boolean;
  currentSession?: AuthSession;
  failedAttempts: number;
  isLocked: boolean;
  lockoutUntil?: Date;
  
  // Główne funkcje autoryzacji
  authenticate: (method: BiometricConfig['methods'][0], context?: string) => Promise<boolean>;
  authenticateWithPin: (pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<boolean>;
  
  // Konfiguracja bezpieczeństwa
  updateBiometricConfig: (config: Partial<BiometricConfig>) => Promise<void>;
  setSecurityLevel: (level: SecurityLevel) => Promise<void>;
  generateEncryptionKey: () => Promise<EncryptionKey>;
  
  // Szyfrowanie i deszyfrowanie
  encryptData: (data: string, level: SecurityLevel['level']) => Promise<string>;
  decryptData: (encryptedData: string, level: SecurityLevel['level']) => Promise<string>;
  
  // Monitoring i audyt
  getAuthHistory: () => AuthSession[];
  clearAuthHistory: () => Promise<void>;
  exportSecurityLogs: () => Promise<string>;
  
  // Funkcje awaryjne
  emergencyAccess: (code: string) => Promise<boolean>;
  resetSecurity: () => Promise<void>;
  
  // Zapisywanie i ładowanie
  saveSecurityData: () => Promise<void>;
  loadSecurityData: () => Promise<void>;
}

const BiometricAuthSystemContext = createContext<BiometricAuthSystemContextType | undefined>(undefined);

const SECURITY_DATA_FILE = `${FileSystem.documentDirectory}security/auth_data.json`;
const ENCRYPTION_KEYS_FILE = `${FileSystem.documentDirectory}security/keys.json`;

export const BiometricAuthSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [biometricConfig, setBiometricConfig] = useState<BiometricConfig>({
    enabled: true,
    methods: ['fingerprint', 'pin'],
    fallbackToPin: true,
    requireBiometricForSensitive: true,
    autoLockTimeout: 30, // 30 minut
    maxFailedAttempts: 5,
    lockoutDuration: 15, // 15 minut
    encryptionLevel: 'standard',
    backupRecovery: true,
    emergencyAccess: true
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentSession, setCurrentSession] = useState<AuthSession | undefined>();
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutUntil, setLockoutUntil] = useState<Date | undefined>();
  const [authHistory, setAuthHistory] = useState<AuthSession[]>([]);
  const [encryptionKeys, setEncryptionKeys] = useState<EncryptionKey[]>([]);
  const [securityLevels, setSecurityLevels] = useState<Record<string, SecurityLevel>>({
    public: { level: 'public', requiresAuth: false, timeout: 0, encryption: false, audit: false },
    private: { level: 'private', requiresAuth: true, timeout: 30, encryption: true, audit: true },
    sensitive: { level: 'sensitive', requiresAuth: true, timeout: 15, encryption: true, audit: true },
    critical: { level: 'critical', requiresAuth: true, timeout: 5, encryption: true, audit: true }
  });

  const { addMemory } = useMemory();
  const { networkAccess } = useNetworkEngine();

  // Inicjalizacja systemu
  useEffect(() => {
    loadSecurityData();
    setupAutoLock();
    checkLockoutStatus();
  }, []);

  // Sprawdzanie statusu blokady
  const checkLockoutStatus = useCallback(() => {
    if (lockoutUntil && new Date() > lockoutUntil) {
      setIsLocked(false);
      setLockoutUntil(undefined);
      setFailedAttempts(0);
      console.log('🔓 Blokada wygasła');
    }
  }, [lockoutUntil]);

  // Ustawienie auto-lock
  const setupAutoLock = useCallback(() => {
    const checkAutoLock = () => {
      if (isAuthenticated && currentSession) {
        const timeSinceAuth = Date.now() - currentSession.timestamp.getTime();
        const timeoutMs = biometricConfig.autoLockTimeout * 60 * 1000;
        
        if (timeSinceAuth > timeoutMs) {
          console.log('⏰ Auto-lock: sesja wygasła');
          logout();
        }
      }
    };

    const interval = setInterval(checkAutoLock, 60000); // sprawdzaj co minutę
    return () => clearInterval(interval);
  }, [isAuthenticated, currentSession, biometricConfig.autoLockTimeout]);

  // Główna funkcja autoryzacji
  const authenticate = useCallback(async (
    method: BiometricConfig['methods'][0], 
    context: string = 'general'
  ): Promise<boolean> => {
    // Sprawdź blokadę
    if (isLocked) {
      console.log('🚫 System zablokowany');
      return false;
    }

    // Sprawdź czy metoda jest dostępna
    if (!biometricConfig.methods.includes(method)) {
      console.log(`❌ Metoda ${method} niedostępna`);
      return false;
    }

    // Symulacja autoryzacji biometrycznej
    const success = await simulateBiometricAuth(method);
    
    const session: AuthSession = {
      id: `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      method,
      success,
      context,
      deviceInfo: Platform.OS
    };

    setAuthHistory(prev => [session, ...prev.slice(0, 99)]); // Zachowaj ostatnie 100 sesji

    if (success) {
      setIsAuthenticated(true);
      setCurrentSession(session);
      setFailedAttempts(0);
      
      await addMemory(
        `Autoryzacja biometryczna udana: ${method}`,
        60,
        ['security', 'auth', 'success', method],
        'system'
      );

      console.log(`✅ Autoryzacja ${method} udana`);
      return true;
    } else {
      setFailedAttempts(prev => prev + 1);
      
      // Sprawdź limit prób
      if (failedAttempts + 1 >= biometricConfig.maxFailedAttempts) {
        const lockoutTime = new Date(Date.now() + biometricConfig.lockoutDuration * 60 * 1000);
        setIsLocked(true);
        setLockoutUntil(lockoutTime);
        
        await addMemory(
          `System zablokowany po ${biometricConfig.maxFailedAttempts} nieudanych próbach`,
          90,
          ['security', 'lockout', 'failed'],
          'system'
        );

        console.log(`🚫 System zablokowany do ${lockoutTime.toLocaleTimeString()}`);
      }

      await addMemory(
        `Autoryzacja biometryczna nieudana: ${method}`,
        70,
        ['security', 'auth', 'failed', method],
        'system'
      );

      console.log(`❌ Autoryzacja ${method} nieudana`);
      return false;
    }
  }, [biometricConfig, isLocked, failedAttempts, addMemory]);

  // Symulacja autoryzacji biometrycznej
  const simulateBiometricAuth = async (method: BiometricConfig['methods'][0]): Promise<boolean> => {
    // W rzeczywistości byłaby to integracja z expo-local-authentication
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Symulacja różnych wskaźników sukcesu
    const successRates = {
      fingerprint: 0.95, // 95% szans
      face: 0.90,        // 90% szans
      pin: 0.85          // 85% szans
    };

    return Math.random() < successRates[method];
  };

  // Autoryzacja PIN-em
  const authenticateWithPin = useCallback(async (pin: string): Promise<boolean> => {
    // Sprawdź czy PIN jest włączony
    if (!biometricConfig.methods.includes('pin')) {
      return false;
    }

    // W rzeczywistości byłaby to weryfikacja z zapisanym hashem PIN
    const correctPin = '1234'; // Przykładowy PIN
    const success = pin === correctPin;

    if (success) {
      return await authenticate('pin', 'pin_auth');
    } else {
      setFailedAttempts(prev => prev + 1);
      return false;
    }
  }, [biometricConfig, authenticate]);

  // Wylogowanie
  const logout = useCallback(async () => {
    setIsAuthenticated(false);
    setCurrentSession(undefined);
    
    await addMemory(
      'Wylogowanie z systemu',
      50,
      ['security', 'logout'],
      'system'
    );

    console.log('👋 Wylogowano z systemu');
  }, [addMemory]);

  // Sprawdzenie statusu autoryzacji
  const checkAuthStatus = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) return false;
    
    // Sprawdź czy sesja nie wygasła
    if (currentSession) {
      const timeSinceAuth = Date.now() - currentSession.timestamp.getTime();
      const timeoutMs = biometricConfig.autoLockTimeout * 60 * 1000;
      
      if (timeSinceAuth > timeoutMs) {
        await logout();
        return false;
      }
    }
    
    return true;
  }, [isAuthenticated, currentSession, biometricConfig.autoLockTimeout, logout]);

  // Aktualizacja konfiguracji biometrycznej
  const updateBiometricConfig = useCallback(async (config: Partial<BiometricConfig>) => {
    setBiometricConfig(prev => ({ ...prev, ...config }));
    await saveSecurityData();
    
    console.log('🔧 Konfiguracja bezpieczeństwa zaktualizowana');
  }, []);

  // Ustawienie poziomu bezpieczeństwa
  const setSecurityLevel = useCallback(async (level: SecurityLevel) => {
    setSecurityLevels(prev => ({ ...prev, [level.level]: level }));
    await saveSecurityData();
  }, []);

  // Generowanie klucza szyfrowania
  const generateEncryptionKey = useCallback(async (): Promise<EncryptionKey> => {
    const key: EncryptionKey = {
      id: `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      algorithm: 'AES-256',
      keySize: 256,
      createdAt: new Date(),
      isActive: true
    };

    setEncryptionKeys(prev => [key, ...prev]);
    await saveSecurityData();
    
    console.log(`🔑 Wygenerowano klucz szyfrowania: ${key.id}`);
    return key;
  }, []);

  // Szyfrowanie danych
  const encryptData = useCallback(async (data: string, level: SecurityLevel['level']): Promise<string> => {
    const securityLevel = securityLevels[level];
    
    if (!securityLevel.encryption) {
      return data; // Brak szyfrowania
    }

    // W rzeczywistości byłoby to prawdziwe szyfrowanie
    const key = encryptionKeys.find(k => k.isActive);
    if (!key) {
      throw new Error('Brak aktywnego klucza szyfrowania');
    }

    // Symulacja szyfrowania (w rzeczywistości użyj Crypto.digestStringAsync)
    const encrypted = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data + key.id
    );

    return `ENCRYPTED:${encrypted}:${level}`;
  }, [securityLevels, encryptionKeys]);

  // Deszyfrowanie danych
  const decryptData = useCallback(async (encryptedData: string, level: SecurityLevel['level']): Promise<string> => {
    if (!encryptedData.startsWith('ENCRYPTED:')) {
      return encryptedData; // Nie zaszyfrowane
    }

    // W rzeczywistości byłoby to prawdziwe deszyfrowanie
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Nieprawidłowy format zaszyfrowanych danych');
    }

    // Symulacja deszyfrowania
    return `DECRYPTED_DATA_${level}`;
  }, []);

  // Dostęp awaryjny
  const emergencyAccess = useCallback(async (code: string): Promise<boolean> => {
    if (!biometricConfig.emergencyAccess) {
      return false;
    }

    // W rzeczywistości byłaby to weryfikacja kodu awaryjnego
    const emergencyCode = '9999'; // Przykładowy kod
    const success = code === emergencyCode;

    if (success) {
      const session: AuthSession = {
        id: `emergency_${Date.now()}`,
        timestamp: new Date(),
        method: 'emergency',
        success: true,
        context: 'emergency_access'
      };

      setIsAuthenticated(true);
      setCurrentSession(session);
      setAuthHistory(prev => [session, ...prev]);

      await addMemory(
        'Dostęp awaryjny udzielony',
        100,
        ['security', 'emergency', 'access'],
        'system'
      );

      console.log('🚨 Dostęp awaryjny udzielony');
    }

    return success;
  }, [biometricConfig, addMemory]);

  // Reset bezpieczeństwa
  const resetSecurity = useCallback(async () => {
    setIsAuthenticated(false);
    setCurrentSession(undefined);
    setFailedAttempts(0);
    setIsLocked(false);
    setLockoutUntil(undefined);
    setAuthHistory([]);
    setEncryptionKeys([]);

    await addMemory(
      'Reset systemu bezpieczeństwa',
      100,
      ['security', 'reset'],
      'system'
    );

    console.log('🔄 Reset systemu bezpieczeństwa');
  }, [addMemory]);

  // Eksport logów bezpieczeństwa
  const exportSecurityLogs = useCallback(async (): Promise<string> => {
    const logs = authHistory.map(session => `
Sesja: ${session.id}
Metoda: ${session.method}
Status: ${session.success ? 'SUKCES' : 'BŁĄD'}
Kontekst: ${session.context}
Czas: ${session.timestamp.toISOString()}
Urządzenie: ${session.deviceInfo || 'N/A'}
    `).join('\n');

    return `=== LOGI BEZPIECZEŃSTWA ===\n${logs}`;
  }, [authHistory]);

  // Zapisywanie danych bezpieczeństwa
  const saveSecurityData = useCallback(async () => {
    try {
      const data = {
        biometricConfig,
        authHistory,
        encryptionKeys,
        securityLevels
      };
      
      await FileSystem.makeDirectoryAsync(SECURITY_DATA_FILE.replace('/auth_data.json', ''), { intermediates: true });
      await AsyncStorage.setItem('security_data', JSON.stringify(data));
      
      console.log('💾 Dane bezpieczeństwa zapisane');
    } catch (error) {
      console.error('Błąd zapisywania danych bezpieczeństwa:', error);
    }
  }, [biometricConfig, authHistory, encryptionKeys, securityLevels]);

  // Ładowanie danych bezpieczeństwa
  const loadSecurityData = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem('security_data');
      if (data) {
        const parsed = JSON.parse(data);
        setBiometricConfig(parsed.biometricConfig || biometricConfig);
        setAuthHistory(parsed.authHistory || []);
        setEncryptionKeys(parsed.encryptionKeys || []);
        setSecurityLevels(parsed.securityLevels || securityLevels);
      }
    } catch (error) {
      console.error('Błąd ładowania danych bezpieczeństwa:', error);
    }
  }, []);

  const contextValue: BiometricAuthSystemContextType = {
    biometricConfig,
    isAuthenticated,
    currentSession,
    failedAttempts,
    isLocked,
    lockoutUntil,
    authenticate,
    authenticateWithPin,
    logout,
    checkAuthStatus,
    updateBiometricConfig,
    setSecurityLevel,
    generateEncryptionKey,
    encryptData,
    decryptData,
    getAuthHistory: () => authHistory,
    clearAuthHistory: async () => {
      setAuthHistory([]);
      await saveSecurityData();
    },
    exportSecurityLogs,
    emergencyAccess,
    resetSecurity,
    saveSecurityData,
    loadSecurityData
  };

  return (
    <BiometricAuthSystemContext.Provider value={contextValue}>
      {children}
    </BiometricAuthSystemContext.Provider>
  );
};

export const useBiometricAuth = () => {
  const context = useContext(BiometricAuthSystemContext);
  if (!context) {
    throw new Error('useBiometricAuth must be used within BiometricAuthSystemProvider');
  }
  return context;
}; 