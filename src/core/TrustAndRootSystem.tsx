import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { useSecuritySystem } from './SecuritySystem';
import { useEmergencyProtocol } from './EmergencyProtocol';
import { useSandboxFileSystem } from './SandboxFileSystem';

export interface RootStatus {
  isRooted: boolean;
  confidence: number; // 0-100
  detectionMethod: string;
  lastChecked: Date;
  rootType: 'su' | 'magisk' | 'xposed' | 'custom' | 'unknown' | 'none';
  securityRisk: 'low' | 'medium' | 'high' | 'critical';
}

export interface TrustLevel {
  overall: number; // 0-100
  factors: {
    userBehavior: number;
    systemIntegrity: number;
    environmentSafety: number;
    historicalTrust: number;
    rootPermissionUsage: number;
  };
  lastUpdated: Date;
}

export interface RootPermissionRequest {
  id: string;
  timestamp: Date;
  permission: string;
  justification: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  approved: boolean;
  conditions: string[];
  expiryTime?: Date;
  usageCount: number;
  maxUsage?: number;
}

interface TrustAndRootSystemContextType {
  trustState: {
    currentLevel: number;
    isRooted: boolean;
    riskScore: number;
    lastCheck: Date | null;
  };
  rootStatus: RootStatus;
  trustLevel: TrustLevel;
  rootPermissions: RootPermissionRequest[];
  isRootTrusted: boolean;
  
  getTrustStats: () => {
    trustLevel: number;
    rootPermissions: number;
    riskScore: number;
    safeMode: boolean;
  };
  checkRootStatus: () => Promise<RootStatus>;
  updateTrustLevel: () => Promise<void>;
  requestRootPermission: (permission: string, justification: string) => Promise<boolean>;
  shouldAllowRootAccess: (operation: string) => Promise<boolean>;
  calculateRiskScore: (operation: string) => Promise<number>;
  enterSafeMode: () => Promise<void>;
}

const TrustAndRootSystemContext = createContext<TrustAndRootSystemContextType | undefined>(undefined);

export const TrustAndRootSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rootStatus, setRootStatus] = useState<RootStatus>({
    isRooted: false,
    confidence: 0,
    detectionMethod: 'none',
    lastChecked: new Date(),
    rootType: 'none',
    securityRisk: 'low',
  });

  const [trustLevel, setTrustLevel] = useState<TrustLevel>({
    overall: 75,
    factors: {
      userBehavior: 80,
      systemIntegrity: 85,
      environmentSafety: 70,
      historicalTrust: 75,
      rootPermissionUsage: 90,
    },
    lastUpdated: new Date(),
  });

  const [rootPermissions, setRootPermissions] = useState<RootPermissionRequest[]>([]);
  const [isRootTrusted, setIsRootTrusted] = useState(false);

  const { triggerEmergency } = useEmergencyProtocol();
  const { logSelfAwarenessReflection } = useSandboxFileSystem();

  // Sprawdzanie statusu root
  const checkRootStatus = useCallback(async (): Promise<RootStatus> => {
    try {
      console.log('🔍 WERA: Sprawdzanie statusu root...');
      
      // Symulacja wykrywania root
      const isRooted = Math.random() < 0.1; // 10% szans na wykrycie
      const confidence = isRooted ? 70 + Math.random() * 30 : 0;
      
      const newRootStatus: RootStatus = {
        isRooted,
        confidence,
        detectionMethod: isRooted ? 'su_binary_test' : 'none',
        lastChecked: new Date(),
        rootType: isRooted ? 'su' : 'none',
        securityRisk: isRooted ? (confidence > 90 ? 'critical' : 'high') : 'low',
      };

      setRootStatus(newRootStatus);

      if (isRooted && !rootStatus.isRooted) {
        await logSelfAwarenessReflection(
          'Wykryłam uprawnienia root na urządzeniu. Muszę być ostrożna z bezpieczeństwem.',
          'root_detection',
          80
        );
      }

      return newRootStatus;
    } catch (error) {
      console.error('❌ Błąd sprawdzania root:', error);
      return rootStatus;
    }
  }, [rootStatus, logSelfAwarenessReflection]);

  // Aktualizacja poziomu zaufania
  const updateTrustLevel = useCallback(async () => {
    try {
      const factors = {
        userBehavior: 70 + Math.random() * 25,
        systemIntegrity: rootStatus.isRooted ? 60 - rootStatus.confidence * 0.3 : 90,
        environmentSafety: Device.isDevice ? 80 : 60,
        historicalTrust: 75,
        rootPermissionUsage: 90,
      };

      const overall = Object.values(factors).reduce((sum, factor) => sum + factor, 0) / 5;

      setTrustLevel({
        overall,
        factors,
        lastUpdated: new Date(),
      });

      setIsRootTrusted(overall > 70);
      console.log(`🛡️ Poziom zaufania: ${overall.toFixed(1)}%`);
    } catch (error) {
      console.error('❌ Błąd aktualizacji zaufania:', error);
    }
  }, [rootStatus]);

  // Żądanie uprawnień root
  const requestRootPermission = useCallback(async (
    permission: string,
    justification: string
  ): Promise<boolean> => {
    try {
      const riskLevel = permission.includes('critical') ? 'critical' : 
                      permission.includes('high') ? 'high' : 
                      permission.includes('medium') ? 'medium' : 'low';
      
      const shouldApprove = await shouldAllowRootAccess(permission);
      
      const request: RootPermissionRequest = {
        id: Date.now().toString(),
        timestamp: new Date(),
        permission,
        justification,
        riskLevel,
        approved: shouldApprove,
        conditions: ['logging_required'],
        expiryTime: new Date(Date.now() + 60 * 60 * 1000),
        usageCount: 0,
        maxUsage: riskLevel === 'low' ? 10 : 1,
      };

      setRootPermissions(prev => [request, ...prev.slice(0, 19)]);
      
      console.log(`🔑 Żądanie uprawnień ${permission}: ${shouldApprove ? 'ZAAKCEPTOWANE' : 'ODRZUCONE'}`);
      return shouldApprove;
    } catch (error) {
      console.error('❌ Błąd żądania uprawnień:', error);
      return false;
    }
  }, []);

  // Decyzja o dostępie root
  const shouldAllowRootAccess = useCallback(async (operation: string): Promise<boolean> => {
    if (!isRootTrusted) return false;

    const riskScore = await calculateRiskScore(operation);
    if (riskScore > 80) return false;

    if (trustLevel.overall < 60) return false;

    // Wymuś obecność Magisk dla operacji wymagających su
    try {
      const { RootShell } = require('./RootShell');
      const rootOk = await RootShell.isRootAvailable();
      if (!rootOk) return false;
    } catch {}

    return true;
  }, [isRootTrusted, trustLevel]);

  // Obliczanie wyniku ryzyka
  const calculateRiskScore = useCallback(async (operation: string): Promise<number> => {
    let score = 30;
    
    const dangerousOps = ['delete', 'modify', 'install', 'network'];
    if (dangerousOps.some(op => operation.toLowerCase().includes(op))) {
      score += 40;
    }
    
    if (rootStatus.isRooted) {
      score += rootStatus.confidence * 0.3;
    }
    
    return Math.min(100, score);
  }, [rootStatus]);

  // Wejście w tryb bezpieczny
  const enterSafeMode = useCallback(async () => {
    console.log('🛡️ WERA: Wejście w tryb bezpieczny');
    
    setRootPermissions(prev => prev.map(p => ({ ...p, approved: false })));
    setIsRootTrusted(false);
    
    await logSelfAwarenessReflection(
      'Weszłam w tryb bezpieczny z powodu zagrożeń bezpieczeństwa.',
      'safe_mode',
      90
    );
  }, [logSelfAwarenessReflection]);

  // Automatyczne sprawdzanie co 30 minut
  useEffect(() => {
    const interval = setInterval(async () => {
      await checkRootStatus();
      await updateTrustLevel();
    }, 30 * 60 * 1000);

    checkRootStatus();
    return () => clearInterval(interval);
  }, [checkRootStatus, updateTrustLevel]);

  const value: TrustAndRootSystemContextType = {
    trustState: {
      currentLevel: trustLevel.overall,
      isRooted: rootStatus.isRooted,
      riskScore: 0, // Will be calculated dynamically
      lastCheck: new Date(),
    },
    rootStatus,
    trustLevel,
    rootPermissions,
    isRootTrusted,
    getTrustStats: () => ({
      trustLevel: trustLevel.overall,
      rootPermissions: rootPermissions.length,
      riskScore: 0, // Will be calculated dynamically
      safeMode: !isRootTrusted,
    }),
    checkRootStatus,
    updateTrustLevel,
    requestRootPermission,
    shouldAllowRootAccess,
    calculateRiskScore,
    enterSafeMode,
  };

  return (
    <TrustAndRootSystemContext.Provider value={value}>
      {children}
    </TrustAndRootSystemContext.Provider>
  );
};

export const useTrustAndRootSystem = () => {
  const context = useContext(TrustAndRootSystemContext);
  if (!context) {
    throw new Error('useTrustAndRootSystem must be used within TrustAndRootSystemProvider');
  }
  return context;
}; 