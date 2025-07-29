import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';

// Interfejsy
interface RootDetection {
  id: string;
  type: 'magisk' | 'orangefox' | 'termux' | 'custom_rom' | 'other';
  name: string;
  description: string;
  detected: boolean;
  confidence: number; // 0-100
  path?: string;
  version?: string;
  lastCheck: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  capabilities: string[];
}

interface TrustLevel {
  id: string;
  name: string;
  description: string;
  currentLevel: number; // 0-100
  maxLevel: number; // 0-100
  requirements: string[];
  granted: boolean;
  grantedAt?: Date;
  expiresAt?: Date;
  userConsent: boolean;
  systemConsent: boolean;
  lastVerified: Date;
}

interface SystemAccess {
  id: string;
  type: 'filesystem' | 'network' | 'system' | 'hardware' | 'security';
  name: string;
  description: string;
  status: 'denied' | 'limited' | 'granted' | 'full';
  permissions: string[];
  restrictions: string[];
  lastAccess: Date;
  accessCount: number;
  isActive: boolean;
}

interface TrustSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // ms
  trustLevel: number;
  activities: string[];
  securityEvents: number;
  userInteractions: number;
  systemCalls: number;
  riskScore: number; // 0-100
}

interface TrustAndRootState {
  rootDetections: RootDetection[];
  trustLevels: TrustLevel[];
  systemAccess: SystemAccess[];
  activeSessions: TrustSession[];
  overallTrustScore: number; // 0-100
  rootStatus: boolean;
  elevatedPrivileges: boolean;
  securityLevel: 'low' | 'medium' | 'high' | 'maximum';
  lastSecurityScan: Date;
  securityThreats: number;
  trustViolations: number;
  isTrusted: boolean;
  trustExpiration: Date;
}

interface TrustAndRootConfig {
  autoRootDetection: boolean;
  securityScanInterval: number; // ms
  trustVerificationEnabled: boolean;
  elevatedAccessRequired: boolean;
  securityLogging: boolean;
  threatDetection: boolean;
  trustExpirationDays: number;
}

interface TrustAndRootContextType {
  trustState: TrustAndRootState;
  trustConfig: TrustAndRootConfig;
  detectRoot: () => Promise<void>;
  requestTrustLevel: (levelId: string) => Promise<boolean>;
  grantSystemAccess: (accessId: string) => Promise<void>;
  revokeSystemAccess: (accessId: string) => Promise<void>;
  startTrustSession: () => Promise<void>;
  endTrustSession: (sessionId: string) => Promise<void>;
  verifyTrust: () => Promise<boolean>;
  scanSecurity: () => Promise<void>;
  updateTrustScore: (change: number) => Promise<void>;
  getTrustStats: () => any;
  saveTrustState: () => Promise<void>;
  loadTrustState: () => Promise<void>;
}

// Kontekst
const TrustAndRootContext = createContext<TrustAndRootContextType | undefined>(undefined);

// Hook
export const useTrustAndRoot = () => {
  const context = useContext(TrustAndRootContext);
  if (!context) {
    throw new Error('useTrustAndRoot must be used within TrustAndRootProvider');
  }
  return context;
};

// Provider
export const TrustAndRootProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trustState, setTrustState] = useState<TrustAndRootState>({
    rootDetections: [
      {
        id: 'magisk',
        type: 'magisk',
        name: 'Magisk Manager',
        description: 'Systemless root solution',
        detected: false,
        confidence: 0,
        lastCheck: new Date(),
        riskLevel: 'high',
        capabilities: ['root_access', 'system_modification', 'module_management'],
      },
      {
        id: 'orangefox',
        type: 'orangefox',
        name: 'OrangeFox Recovery',
        description: 'Custom recovery with root capabilities',
        detected: false,
        confidence: 0,
        lastCheck: new Date(),
        riskLevel: 'medium',
        capabilities: ['recovery_access', 'system_backup', 'partition_management'],
      },
      {
        id: 'termux',
        type: 'termux',
        name: 'Termux',
        description: 'Terminal emulator with advanced capabilities',
        detected: false,
        confidence: 0,
        lastCheck: new Date(),
        riskLevel: 'low',
        capabilities: ['terminal_access', 'package_management', 'script_execution'],
      },
      {
        id: 'custom_rom',
        type: 'custom_rom',
        name: 'Custom ROM',
        description: 'Modified Android system',
        detected: false,
        confidence: 0,
        lastCheck: new Date(),
        riskLevel: 'medium',
        capabilities: ['system_modification', 'enhanced_features', 'custom_kernel'],
      },
    ],
    trustLevels: [
      {
        id: 'basic',
        name: 'Podstawowy Dostęp',
        description: 'Standardowe uprawnienia aplikacji',
        currentLevel: 25,
        maxLevel: 30,
        requirements: ['user_consent'],
        granted: true,
        grantedAt: new Date(),
        userConsent: true,
        systemConsent: true,
        lastVerified: new Date(),
      },
      {
        id: 'elevated',
        name: 'Podwyższone Uprawnienia',
        description: 'Dostęp do systemu i sprzętu',
        currentLevel: 50,
        maxLevel: 70,
        requirements: ['user_consent', 'system_consent', 'security_verification'],
        granted: false,
        userConsent: false,
        systemConsent: false,
        lastVerified: new Date(),
      },
      {
        id: 'full',
        name: 'Pełny Dostęp',
        description: 'Administrator systemu',
        currentLevel: 75,
        maxLevel: 100,
        requirements: ['user_consent', 'system_consent', 'root_access', 'security_clearance'],
        granted: false,
        userConsent: false,
        systemConsent: false,
        lastVerified: new Date(),
      },
    ],
    systemAccess: [
      {
        id: 'filesystem',
        type: 'filesystem',
        name: 'Dostęp do Systemu Plików',
        description: 'Pełny dostęp do wszystkich katalogów',
        status: 'limited',
        permissions: ['read', 'write', 'execute'],
        restrictions: ['system_directories'],
        lastAccess: new Date(),
        accessCount: 0,
        isActive: false,
      },
      {
        id: 'network',
        type: 'network',
        name: 'Dostęp Sieciowy',
        description: 'Kontrola połączeń sieciowych',
        status: 'granted',
        permissions: ['internet', 'local_network'],
        restrictions: ['vpn_control'],
        lastAccess: new Date(),
        accessCount: 0,
        isActive: true,
      },
      {
        id: 'system',
        type: 'system',
        name: 'Dostęp Systemowy',
        description: 'Kontrola procesów i usług',
        status: 'denied',
        permissions: ['process_control', 'service_management'],
        restrictions: ['system_processes'],
        lastAccess: new Date(),
        accessCount: 0,
        isActive: false,
      },
      {
        id: 'hardware',
        type: 'hardware',
        name: 'Dostęp Sprzętowy',
        description: 'Kontrola urządzeń sprzętowych',
        status: 'limited',
        permissions: ['sensors', 'camera', 'microphone'],
        restrictions: ['bootloader', 'recovery'],
        lastAccess: new Date(),
        accessCount: 0,
        isActive: false,
      },
      {
        id: 'security',
        type: 'security',
        name: 'Dostęp Bezpieczeństwa',
        description: 'Kontrola ustawień bezpieczeństwa',
        status: 'denied',
        permissions: ['security_settings', 'encryption'],
        restrictions: ['biometric_data'],
        lastAccess: new Date(),
        accessCount: 0,
        isActive: false,
      },
    ],
    activeSessions: [],
    overallTrustScore: 30,
    rootStatus: false,
    elevatedPrivileges: false,
    securityLevel: 'low',
    lastSecurityScan: new Date(),
    securityThreats: 0,
    trustViolations: 0,
    isTrusted: false,
    trustExpiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dni
  });

  const [trustConfig, setTrustConfig] = useState<TrustAndRootConfig>({
    autoRootDetection: true,
    securityScanInterval: 300000, // 5 minut
    trustVerificationEnabled: true,
    elevatedAccessRequired: true,
    securityLogging: true,
    threatDetection: true,
    trustExpirationDays: 30,
  });

  const securityScanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Inicjalizacja
  useEffect(() => {
    loadTrustState();
    loadTrustConfig();
    if (trustConfig.autoRootDetection) {
      detectRoot();
    }
    if (trustConfig.threatDetection) {
      startSecurityScanning();
    }
  }, []);

  // Zapisywanie stanu zaufania
  const saveTrustState = async () => {
    try {
      await SecureStore.setItemAsync('wera_trust_state', JSON.stringify(trustState));
    } catch (error) {
      console.error('Błąd zapisywania stanu zaufania:', error);
    }
  };

  // Ładowanie stanu zaufania
  const loadTrustState = async () => {
    try {
      const saved = await SecureStore.getItemAsync('wera_trust_state');
      if (saved) {
        const data = JSON.parse(saved);
        setTrustState(prev => ({
          ...prev,
          ...data,
          rootDetections: data.rootDetections || prev.rootDetections,
          trustLevels: data.trustLevels || prev.trustLevels,
          systemAccess: data.systemAccess || prev.systemAccess,
        }));
      }
    } catch (error) {
      console.error('Błąd ładowania stanu zaufania:', error);
    }
  };

  // Ładowanie konfiguracji
  const loadTrustConfig = async () => {
    try {
      const saved = await SecureStore.getItemAsync('wera_trust_config');
      if (saved) {
        setTrustConfig(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Błąd ładowania konfiguracji zaufania:', error);
    }
  };

  // Zapisywanie konfiguracji
  const saveTrustConfig = async (config: TrustAndRootConfig) => {
    try {
      await SecureStore.setItemAsync('wera_trust_config', JSON.stringify(config));
    } catch (error) {
      console.error('Błąd zapisywania konfiguracji zaufania:', error);
    }
  };

  // Wykrywanie root (funkcja 174, 175, 176)
  const detectRoot = async () => {
    try {
      const updatedDetections = await Promise.all(
        trustState.rootDetections.map(async (detection) => {
          let detected = false;
          let confidence = 0;
          let path = '';
          let version = '';

          switch (detection.type) {
            case 'magisk':
              // Sprawdzanie Magisk
              const magiskPaths = [
                '/sbin/.magisk',
                '/cache/.disable_magisk',
                '/data/adb/magisk',
                '/data/magisk',
                '/dev/.magisk.unblock',
              ];

              for (const magiskPath of magiskPaths) {
                try {
                  const exists = await FileSystem.getInfoAsync(magiskPath);
                  if (exists.exists) {
                    detected = true;
                    confidence = 95;
                    path = magiskPath;
                    break;
                  }
                } catch (error) {
                  // Ignoruj błędy dostępu
                }
              }

              // Sprawdzanie aplikacji Magisk
              try {
                const magiskApp = await FileSystem.getInfoAsync('/data/app/com.topjohnwu.magisk');
                if (magiskApp.exists) {
                  detected = true;
                  confidence = 90;
                  path = '/data/app/com.topjohnwu.magisk';
                }
              } catch (error) {
                // Ignoruj błędy dostępu
              }
              break;

            case 'orangefox':
              // Sprawdzanie OrangeFox Recovery
              const orangefoxPaths = [
                '/sbin/.magisk/mirror/data/unencrypted/keyguide',
                '/data/unencrypted/keyguide',
                '/sdcard/Fox',
                '/sdcard/OrangeFox',
              ];

              for (const orangefoxPath of orangefoxPaths) {
                try {
                  const exists = await FileSystem.getInfoAsync(orangefoxPath);
                  if (exists.exists) {
                    detected = true;
                    confidence = 85;
                    path = orangefoxPath;
                    break;
                  }
                } catch (error) {
                  // Ignoruj błędy dostępu
                }
              }
              break;

            case 'termux':
              // Sprawdzanie Termux
              try {
                const termuxPaths = [
                  '/data/data/com.termux',
                  '/data/data/com.termux.api',
                  '/data/data/com.termux.boot',
                ];

                for (const termuxPath of termuxPaths) {
                  const exists = await FileSystem.getInfoAsync(termuxPath);
                  if (exists.exists) {
                    detected = true;
                    confidence = 80;
                    path = termuxPath;
                    break;
                  }
                }
              } catch (error) {
                // Ignoruj błędy dostępu
              }
              break;

            case 'custom_rom':
              // Sprawdzanie Custom ROM
              try {
                const buildProp = await FileSystem.readAsStringAsync('/system/build.prop');
                const customIndicators = [
                  'ro.build.fingerprint',
                  'ro.build.description',
                  'ro.build.version.release',
                ];

                for (const indicator of customIndicators) {
                  if (buildProp.includes(indicator)) {
                    detected = true;
                    confidence = 70;
                    path = '/system/build.prop';
                    break;
                  }
                }
              } catch (error) {
                // Ignoruj błędy dostępu
              }
              break;
          }

          return {
            ...detection,
            detected,
            confidence,
            path: detected ? path : undefined,
            version: detected ? version : undefined,
            lastCheck: new Date(),
          };
        })
      );

      // Aktualizacja stanu
      const hasRoot = updatedDetections.some(d => d.detected);
      const rootCount = updatedDetections.filter(d => d.detected).length;

      setTrustState(prev => ({
        ...prev,
        rootDetections: updatedDetections,
        rootStatus: hasRoot,
        elevatedPrivileges: hasRoot,
        securityLevel: hasRoot ? 'high' : 'low',
        securityThreats: rootCount,
        lastSecurityScan: new Date(),
      }));

      await saveTrustState();

    } catch (error) {
      console.error('Błąd wykrywania root:', error);
    }
  };

  // Żądanie poziomu zaufania
  const requestTrustLevel = async (levelId: string): Promise<boolean> => {
    const trustLevel = trustState.trustLevels.find(t => t.id === levelId);
    if (!trustLevel) return false;

    return new Promise((resolve) => {
      Alert.alert(
        'WERA - Żądanie Poziomu Zaufania',
        `WERA prosi o podniesienie poziomu zaufania do: ${trustLevel.name}\n\nOpis: ${trustLevel.description}\n\nWymagania: ${trustLevel.requirements.join(', ')}\n\nTo pozwoli WERZE działać z większą autonomią i efektywnością.`,
        [
          {
            text: 'Odmów',
            onPress: () => {
              resolve(false);
            },
          },
          {
            text: 'Zgadzam się',
            onPress: () => {
              grantTrustLevel(levelId);
              resolve(true);
            },
          },
        ]
      );
    });
  };

  // Przyznanie poziomu zaufania
  const grantTrustLevel = async (levelId: string) => {
    setTrustState(prev => ({
      ...prev,
      trustLevels: prev.trustLevels.map(level =>
        level.id === levelId
          ? {
              ...level,
              granted: true,
              grantedAt: new Date(),
              userConsent: true,
              currentLevel: level.maxLevel,
            }
          : level
      ),
      overallTrustScore: Math.min(100, prev.overallTrustScore + 20),
      isTrusted: true,
    }));

    await saveTrustState();
  };

  // Przyznanie dostępu systemowego
  const grantSystemAccess = async (accessId: string) => {
    setTrustState(prev => ({
      ...prev,
      systemAccess: prev.systemAccess.map(access =>
        access.id === accessId
          ? {
              ...access,
              status: 'granted',
              isActive: true,
              lastAccess: new Date(),
              accessCount: access.accessCount + 1,
            }
          : access
      ),
    }));

    await saveTrustState();
  };

  // Cofnięcie dostępu systemowego
  const revokeSystemAccess = async (accessId: string) => {
    setTrustState(prev => ({
      ...prev,
      systemAccess: prev.systemAccess.map(access =>
        access.id === accessId
          ? {
              ...access,
              status: 'denied',
              isActive: false,
            }
          : access
      ),
    }));

    await saveTrustState();
  };

  // Rozpoczęcie sesji zaufania
  const startTrustSession = async () => {
    const session: TrustSession = {
      id: Date.now().toString(),
      startTime: new Date(),
      duration: 0,
      trustLevel: trustState.overallTrustScore,
      activities: [],
      securityEvents: 0,
      userInteractions: 0,
      systemCalls: 0,
      riskScore: 0,
    };

    setTrustState(prev => ({
      ...prev,
      activeSessions: [...prev.activeSessions, session],
    }));

    await saveTrustState();
  };

  // Zakończenie sesji zaufania
  const endTrustSession = async (sessionId: string) => {
    const session = trustState.activeSessions.find(s => s.id === sessionId);
    if (!session) return;

    const endedSession = {
      ...session,
      endTime: new Date(),
      duration: Date.now() - session.startTime.getTime(),
    };

    setTrustState(prev => ({
      ...prev,
      activeSessions: prev.activeSessions.filter(s => s.id !== sessionId),
    }));

    await saveTrustState();
  };

  // Weryfikacja zaufania
  const verifyTrust = async (): Promise<boolean> => {
    try {
      // Sprawdzenie czy zaufanie nie wygasło
      if (new Date() > trustState.trustExpiration) {
        setTrustState(prev => ({
          ...prev,
          isTrusted: false,
          overallTrustScore: Math.max(0, prev.overallTrustScore - 10),
        }));
        return false;
      }

      // Sprawdzenie poziomów zaufania
      const grantedLevels = trustState.trustLevels.filter(t => t.granted);
      const hasElevatedAccess = grantedLevels.some(t => t.id === 'elevated' || t.id === 'full');

      setTrustState(prev => ({
        ...prev,
        elevatedPrivileges: hasElevatedAccess,
        isTrusted: grantedLevels.length > 0,
      }));

      await saveTrustState();
      return grantedLevels.length > 0;

    } catch (error) {
      console.error('Błąd weryfikacji zaufania:', error);
      return false;
    }
  };

  // Skanowanie bezpieczeństwa
  const scanSecurity = async () => {
    try {
      // Ponowne wykrycie root
      await detectRoot();

      // Sprawdzenie aktywnych sesji
      const activeSessions = trustState.activeSessions.length;
      const securityEvents = trustState.securityThreats;

      // Obliczenie ryzyka
      const riskScore = Math.min(100, securityEvents * 10 + activeSessions * 5);

      setTrustState(prev => ({
        ...prev,
        lastSecurityScan: new Date(),
        securityLevel: riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low',
      }));

      await saveTrustState();

    } catch (error) {
      console.error('Błąd skanowania bezpieczeństwa:', error);
    }
  };

  // Rozpoczęcie skanowania bezpieczeństwa
  const startSecurityScanning = () => {
    if (securityScanIntervalRef.current) return;

    securityScanIntervalRef.current = setInterval(async () => {
      if (trustConfig.threatDetection) {
        await scanSecurity();
      }
    }, trustConfig.securityScanInterval);
  };

  // Aktualizacja wyniku zaufania
  const updateTrustScore = async (change: number) => {
    setTrustState(prev => ({
      ...prev,
      overallTrustScore: Math.max(0, Math.min(100, prev.overallTrustScore + change)),
    }));

    await saveTrustState();
  };

  // Statystyki zaufania
  const getTrustStats = () => {
    const detectedRoots = trustState.rootDetections.filter(d => d.detected).length;
    const grantedLevels = trustState.trustLevels.filter(t => t.granted).length;
    const activeAccess = trustState.systemAccess.filter(a => a.isActive).length;
    const activeSessions = trustState.activeSessions.length;

    const rootDetails = trustState.rootDetections
      .filter(d => d.detected)
      .map(d => ({
        name: d.name,
        confidence: d.confidence,
        riskLevel: d.riskLevel,
      }));

    const accessDetails = trustState.systemAccess
      .filter(a => a.status === 'granted')
      .map(a => ({
        name: a.name,
        permissions: a.permissions,
        accessCount: a.accessCount,
      }));

    return {
      overallTrustScore: trustState.overallTrustScore,
      rootStatus: trustState.rootStatus,
      elevatedPrivileges: trustState.elevatedPrivileges,
      securityLevel: trustState.securityLevel,
      detectedRoots,
      grantedLevels,
      activeAccess,
      activeSessions,
      securityThreats: trustState.securityThreats,
      trustViolations: trustState.trustViolations,
      isTrusted: trustState.isTrusted,
      rootDetails,
      accessDetails,
      lastSecurityScan: trustState.lastSecurityScan,
    };
  };

  // Automatyczne zapisywanie
  useEffect(() => {
    if (trustState.rootDetections.length > 0) {
      saveTrustState();
    }
  }, [trustState.rootDetections, trustState.trustLevels, trustState.systemAccess]);

  // Czyszczenie interwału
  useEffect(() => {
    return () => {
      if (securityScanIntervalRef.current) {
        clearInterval(securityScanIntervalRef.current);
      }
    };
  }, []);

  const value: TrustAndRootContextType = {
    trustState,
    trustConfig,
    detectRoot,
    requestTrustLevel,
    grantSystemAccess,
    revokeSystemAccess,
    startTrustSession,
    endTrustSession,
    verifyTrust,
    scanSecurity,
    updateTrustScore,
    getTrustStats,
    saveTrustState,
    loadTrustState,
  };

  return (
    <TrustAndRootContext.Provider value={value}>
      {children}
    </TrustAndRootContext.Provider>
  );
}; 