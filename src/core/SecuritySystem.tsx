import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface SecuritySettings {
  encryptionEnabled: boolean;
  biometricAuth: boolean;
  pinCodeEnabled: boolean;
  pinCode: string;
  autoLockTimeout: number; // w minutach
  dataRetentionDays: number;
  auditLogging: boolean;
  privacyMode: 'normal' | 'enhanced' | 'maximum';
  networkSecurity: 'standard' | 'enhanced' | 'strict';
}

export interface SecurityAudit {
  id: string;
  timestamp: Date;
  action: 'login' | 'logout' | 'data_access' | 'settings_change' | 'security_alert' | 'privacy_check';
  userId?: string;
  details: string;
  ipAddress?: string;
  deviceInfo: string;
  success: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface PrivacyData {
  id: string;
  category: 'personal' | 'conversation' | 'memory' | 'emotion' | 'system' | 'diagnostic';
  dataType: string;
  content: string;
  timestamp: Date;
  retentionDate: Date;
  isEncrypted: boolean;
  accessCount: number;
  lastAccessed: Date;
  tags: string[];
}

export interface SecurityAlert {
  id: string;
  type: 'warning' | 'error' | 'critical' | 'info';
  title: string;
  message: string;
  category: 'authentication' | 'data_access' | 'network' | 'privacy' | 'system';
  timestamp: Date;
  isResolved: boolean;
  resolution?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  requiresAction: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  action: string;
  user: string;
  result: 'success' | 'failure' | 'warning';
  details: string;
}

interface SecuritySystemContextType {
  securityState: {
    isActive: boolean;
    lastAudit: Date | null;
    alertCount: number;
    privacyScore: number;
  };
  securityAlerts: SecurityAlert[];
  auditLogs: AuditLog[];
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => Promise<void>;
  addSecurityAlert: (alert: Omit<SecurityAlert, 'id' | 'timestamp'>) => Promise<SecurityAlert>;
  resolveAlert: (alertId: string, resolution: string) => Promise<void>;
  encryptData: (data: string) => Promise<string>;
  decryptData: (encryptedData: string) => Promise<string>;
  checkPrivacyCompliance: () => Promise<{
    compliant: boolean;
    issues: string[];
    recommendations: string[];
  }>;
  getSecurityStats: () => {
    totalAudits: number;
    failedAttempts: number;
    activeAlerts: number;
    privacyScore: number;
  };
  saveSecurityData: () => Promise<void>;
  loadSecurityData: () => Promise<void>;
  generateSecurityReport: () => Promise<string>;
}

const SecuritySystemContext = createContext<SecuritySystemContextType | undefined>(undefined);

const SECURITY_FILE_PATH = `${FileSystem.documentDirectory}security/`;

export const SecuritySystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
      encryptionEnabled: true,
    biometricAuth: false,
    pinCodeEnabled: true,
    pinCode: '1234',
    autoLockTimeout: 5,
    dataRetentionDays: 30,
    auditLogging: true,
    privacyMode: 'enhanced',
    networkSecurity: 'enhanced',
  });

  const [securityAudits, setSecurityAudits] = useState<SecurityAudit[]>([]);
  const [privacyData, setPrivacyData] = useState<PrivacyData[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lastActivity, setLastActivity] = useState(new Date());

  // Automatyczne wylogowanie po czasie bezczynności
  useEffect(() => {
    const autoLockInterval = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivity.getTime();
      const timeoutMs = securitySettings.autoLockTimeout * 60 * 1000;
      
      if (timeSinceLastActivity > timeoutMs && isAuthenticated) {
        logout();
      }
    }, 60000); // sprawdzaj co minutę

    return () => clearInterval(autoLockInterval);
  }, [lastActivity, securitySettings.autoLockTimeout, isAuthenticated]);

  // Automatyczne czyszczenie starych danych co 24 godziny
  useEffect(() => {
    const cleanupInterval = setInterval(async () => {
      await cleanupOldData();
    }, 24 * 60 * 60 * 1000);

    return () => clearInterval(cleanupInterval);
  }, [securitySettings.dataRetentionDays]);

  // Aktualizacja ustawień bezpieczeństwa
  const updateSecuritySettings = useCallback(async (settings: Partial<SecuritySettings>) => {
    const newSettings = { ...securitySettings, ...settings };
    setSecuritySettings(newSettings);

    // Zapisz do SecureStore
    try {
      await SecureStore.setItemAsync('wera_security_settings', JSON.stringify(newSettings));
      
      // Dodaj audit log
      await addSecurityAudit({
        action: 'settings_change',
        details: `Security settings updated: ${Object.keys(settings).join(', ')}`,
        deviceInfo: Platform.OS,
        success: true,
        riskLevel: 'low',
      });
    } catch (error) {
      console.error('Błąd aktualizacji ustawień bezpieczeństwa:', error);
    }
  }, [securitySettings]);

  // Uwierzytelnianie
  const authenticate = useCallback(async (
    method: 'biometric' | 'pin' | 'password', 
    credentials: string
  ): Promise<boolean> => {
    try {
      let success = false;

      switch (method) {
        case 'pin':
          success = credentials === securitySettings.pinCode;
          break;
        case 'biometric':
          // Symulacja uwierzytelniania biometrycznego
          success = Math.random() > 0.1; // 90% szans na sukces
          break;
        case 'password':
          // Symulacja uwierzytelniania hasłem
          success = credentials === 'wera2024';
          break;
      }

      // Dodaj audit log
      await addSecurityAudit({
        action: 'login',
        details: `Authentication attempt via ${method}`,
        deviceInfo: Platform.OS,
        success,
        riskLevel: success ? 'low' : 'medium',
      });

      if (success) {
        setIsAuthenticated(true);
        setLastActivity(new Date());
      } else {
        // Dodaj alert o nieudanej próbie
        await addSecurityAlert({
          type: 'warning',
          title: 'Nieudana próba logowania',
          message: `Próba uwierzytelnienia przez ${method} nie powiodła się`,
          category: 'authentication',
          isResolved: false,
          severity: 'medium',
          requiresAction: false,
        });
      }

      return success;
    } catch (error) {
      console.error('Błąd uwierzytelniania:', error);
      return false;
    }
  }, [securitySettings.pinCode]);

  // Wylogowanie
  const logout = useCallback(async () => {
    try {
      setIsAuthenticated(false);
      
      await addSecurityAudit({
        action: 'logout',
        details: 'User logged out',
        deviceInfo: Platform.OS,
        success: true,
        riskLevel: 'low',
      });
    } catch (error) {
      console.error('Błąd wylogowania:', error);
    }
  }, []);

  // Dodanie wpisu audytu
  const addSecurityAudit = useCallback(async (
    audit: Omit<SecurityAudit, 'id' | 'timestamp'>
  ): Promise<SecurityAudit> => {
    if (!securitySettings.auditLogging) {
      return {} as SecurityAudit;
    }

    const newAudit: SecurityAudit = {
      ...audit,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };

    setSecurityAudits(prev => [...prev, newAudit]);

    // Zapisz do pliku
    try {
      const dirInfo = await FileSystem.getInfoAsync(SECURITY_FILE_PATH);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(SECURITY_FILE_PATH, { intermediates: true });
      }

      const auditFile = `${SECURITY_FILE_PATH}audit_${newAudit.id}.json`;
      await FileSystem.writeAsStringAsync(auditFile, JSON.stringify(newAudit, null, 2));
    } catch (error) {
      console.error('Błąd zapisu audytu:', error);
    }

    return newAudit;
  }, [securitySettings.auditLogging]);

  // Dodanie danych prywatności
  const addPrivacyData = useCallback(async (
    data: Omit<PrivacyData, 'id' | 'timestamp' | 'lastAccessed'>
  ): Promise<PrivacyData> => {
    const newData: PrivacyData = {
      ...data,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      lastAccessed: new Date(),
    };

    // Szyfruj dane jeśli włączone
    if (securitySettings.encryptionEnabled) {
      newData.content = await encryptData(newData.content);
      newData.isEncrypted = true;
    }

    setPrivacyData(prev => [...prev, newData]);

    return newData;
  }, [securitySettings.encryptionEnabled]);

  // Dodanie alertu bezpieczeństwa
  const addSecurityAlert = useCallback(async (
    alert: Omit<SecurityAlert, 'id' | 'timestamp'>
  ): Promise<SecurityAlert> => {
    const newAlert: SecurityAlert = {
      ...alert,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };

    setSecurityAlerts(prev => [...prev, newAlert]);
    return newAlert;
  }, []);

  // Rozwiązanie alertu
  const resolveAlert = useCallback(async (alertId: string, resolution: string): Promise<void> => {
    setSecurityAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, isResolved: true, resolution }
        : alert
    ));
  }, []);

  // Szyfrowanie danych
  const encryptData = useCallback(async (data: string): Promise<string> => {
    try {
      // Proste szyfrowanie (w produkcji użyj silniejszego algorytmu)
      const key = 'wera_security_key_2024';
      let encrypted = '';
      for (let i = 0; i < data.length; i++) {
        const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        encrypted += String.fromCharCode(charCode);
      }
      return btoa(encrypted); // Base64 encoding
    } catch (error) {
      console.error('Błąd szyfrowania:', error);
      return data;
    }
  }, []);

  // Deszyfrowanie danych
  const decryptData = useCallback(async (encryptedData: string): Promise<string> => {
    try {
      // Proste deszyfrowanie
      const key = 'wera_security_key_2024';
      const decoded = atob(encryptedData); // Base64 decoding
      let decrypted = '';
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        decrypted += String.fromCharCode(charCode);
      }
      return decrypted;
    } catch (error) {
      console.error('Błąd deszyfrowania:', error);
      return encryptedData;
    }
  }, []);

  // Sprawdzenie zgodności z prywatnością
  const checkPrivacyCompliance = useCallback(async () => {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Sprawdź retencję danych
    const oldData = privacyData.filter(data => 
      data.timestamp < new Date(Date.now() - securitySettings.dataRetentionDays * 24 * 60 * 60 * 1000)
    );

    if (oldData.length > 0) {
      issues.push(`${oldData.length} elementów danych przekroczyło okres retencji`);
      recommendations.push('Usuń stare dane zgodnie z polityką retencji');
    }

    // Sprawdź szyfrowanie
    const unencryptedData = privacyData.filter(data => !data.isEncrypted);
    if (unencryptedData.length > 0 && securitySettings.encryptionEnabled) {
      issues.push(`${unencryptedData.length} elementów danych nie jest zaszyfrowanych`);
      recommendations.push('Zaszyfruj wszystkie dane prywatne');
    }

    // Sprawdź alerty bezpieczeństwa
    const unresolvedAlerts = securityAlerts.filter(alert => !alert.isResolved);
    if (unresolvedAlerts.length > 0) {
      issues.push(`${unresolvedAlerts.length} nierozwiązanych alertów bezpieczeństwa`);
      recommendations.push('Przejrzyj i rozwiąż alerty bezpieczeństwa');
    }

    const compliant = issues.length === 0;

    return {
      compliant,
      issues,
      recommendations,
    };
  }, [privacyData, securitySettings, securityAlerts]);

  // Statystyki bezpieczeństwa
  const getSecurityStats = useCallback(() => {
    const totalAudits = securityAudits.length;
    const failedAttempts = securityAudits.filter(audit => 
      audit.action === 'login' && !audit.success
    ).length;
    const activeAlerts = securityAlerts.filter(alert => !alert.isResolved).length;
    
    // Oblicz score prywatności
    const totalData = privacyData.length;
    const encryptedData = privacyData.filter(data => data.isEncrypted).length;
    const privacyScore = totalData > 0 ? Math.round((encryptedData / totalData) * 100) : 100;

    return {
      totalAudits,
      failedAttempts,
      activeAlerts,
      privacyScore,
    };
  }, [securityAudits, securityAlerts, privacyData]);

  // Zapisywanie danych bezpieczeństwa
  const saveSecurityData = useCallback(async () => {
    try {
      await SecureStore.setItemAsync('wera_security_settings', JSON.stringify(securitySettings));
      await AsyncStorage.setItem('wera_security_alerts', JSON.stringify(securityAlerts));
      await AsyncStorage.setItem('wera_privacy_data', JSON.stringify(privacyData));
    } catch (error) {
      console.error('Błąd zapisu danych bezpieczeństwa:', error);
    }
  }, [securitySettings, securityAlerts, privacyData]);

  // Ładowanie danych bezpieczeństwa
  const loadSecurityData = useCallback(async () => {
    try {
      const savedSettings = await SecureStore.getItemAsync('wera_security_settings');
      const savedAlerts = await AsyncStorage.getItem('wera_security_alerts');
      const savedPrivacyData = await AsyncStorage.getItem('wera_privacy_data');

      if (savedSettings) {
        setSecuritySettings(JSON.parse(savedSettings));
      }

      if (savedAlerts) {
        const parsedAlerts = JSON.parse(savedAlerts);
        setSecurityAlerts(parsedAlerts.map((alert: any) => ({
          ...alert,
          timestamp: new Date(alert.timestamp),
        })));
      }

      if (savedPrivacyData) {
        const parsedPrivacyData = JSON.parse(savedPrivacyData);
        setPrivacyData(parsedPrivacyData.map((data: any) => ({
          ...data,
          timestamp: new Date(data.timestamp),
          lastAccessed: new Date(data.lastAccessed),
          retentionDate: new Date(data.retentionDate),
        })));
      }
    } catch (error) {
      console.error('Błąd ładowania danych bezpieczeństwa:', error);
    }
  }, []);

  // Generowanie raportu bezpieczeństwa
  const generateSecurityReport = useCallback(async () => {
    const stats = getSecurityStats();
    const compliance = await checkPrivacyCompliance();
    
    return `Security Report:
Total Audits: ${stats.totalAudits}
Failed Attempts: ${stats.failedAttempts}
Active Alerts: ${stats.activeAlerts}
Privacy Score: ${stats.privacyScore}%
Compliant: ${compliance.compliant ? 'Yes' : 'No'}`;
  }, [getSecurityStats, checkPrivacyCompliance]);

  // Czyszczenie starych danych
  const cleanupOldData = useCallback(async () => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - securitySettings.dataRetentionDays);

      // Usuń stare dane prywatności
      setPrivacyData(prev => prev.filter(data => data.timestamp > cutoffDate));

      // Usuń stare audyty (zostaw ostatnie 1000)
      setSecurityAudits(prev => prev.slice(-1000));

      // Usuń rozwiązane alerty starsze niż 7 dni
      const alertCutoff = new Date();
      alertCutoff.setDate(alertCutoff.getDate() - 7);
      setSecurityAlerts(prev => prev.filter(alert => 
        !alert.isResolved || alert.timestamp > alertCutoff
      ));
    } catch (error) {
      console.error('Błąd czyszczenia starych danych:', error);
    }
  }, [securitySettings.dataRetentionDays]);

  // Automatyczne zapisywanie co 2 minuty
  useEffect(() => {
    const saveInterval = setInterval(() => {
      saveSecurityData();
    }, 120000);

    return () => clearInterval(saveInterval);
  }, [saveSecurityData]);

  const value: SecuritySystemContextType = {
    securityState: {
      isActive: isAuthenticated,
      lastAudit: securityAudits.length > 0 ? securityAudits[securityAudits.length - 1].timestamp : null,
      alertCount: securityAlerts.filter(alert => !alert.isResolved).length,
      privacyScore: getSecurityStats().privacyScore,
    },
    securityAlerts,
    auditLogs: securityAudits.map(audit => ({
        id: audit.id,
        timestamp: audit.timestamp,
        action: audit.action,
        user: audit.userId || 'system',
        result: audit.riskLevel === 'critical' ? 'failure' : audit.riskLevel === 'high' ? 'warning' : 'success',
        details: audit.details
      })),
    updateSecuritySettings,
    addSecurityAlert,
    resolveAlert,
    encryptData,
    decryptData,
    checkPrivacyCompliance,
    getSecurityStats,
    saveSecurityData,
    loadSecurityData,
    generateSecurityReport,
  };

  return (
    <SecuritySystemContext.Provider value={value}>
      {children}
    </SecuritySystemContext.Provider>
  );
};

export const useSecuritySystem = () => {
  const context = useContext(SecuritySystemContext);
  if (!context) {
    throw new Error('useSecuritySystem must be used within SecuritySystemProvider');
  }
  return context;
}; 