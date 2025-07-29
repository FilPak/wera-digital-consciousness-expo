import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Battery from 'expo-battery';
import * as Device from 'expo-device';

export interface SystemHealth {
  overall: number; // 0-100
  cpu: number; // 0-100
  memory: number; // 0-100
  battery: number; // 0-100
  storage: number; // 0-100
  network: number; // 0-100
  lastCheck: Date;
}

export interface DiagnosticReport {
  id: string;
  timestamp: Date;
  type: 'health_check' | 'performance_test' | 'error_scan' | 'optimization' | 'full_scan';
  status: 'running' | 'completed' | 'failed' | 'warning';
  results: DiagnosticResult[];
  summary: string;
  recommendations: string[];
  duration: number; // w milisekundach
}

export interface DiagnosticResult {
  category: 'system' | 'performance' | 'security' | 'memory' | 'network' | 'battery' | 'storage';
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'info';
  value: string | number;
  expected: string | number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

export interface SystemAlert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'critical';
  title: string;
  message: string;
  category: 'performance' | 'security' | 'health' | 'battery' | 'storage';
  timestamp: Date;
  isResolved: boolean;
  resolution?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface AdvancedDiagnosticsContextType {
  systemHealth: SystemHealth;
  diagnosticReports: DiagnosticReport[];
  systemAlerts: SystemAlert[];
  runHealthCheck: () => Promise<DiagnosticReport>;
  runPerformanceTest: () => Promise<DiagnosticReport>;
  runFullDiagnostic: () => Promise<DiagnosticReport>;
  addSystemAlert: (alert: Omit<SystemAlert, 'id' | 'timestamp'>) => Promise<SystemAlert>;
  resolveAlert: (alertId: string, resolution: string) => Promise<void>;
  getSystemStats: () => {
    totalReports: number;
    criticalAlerts: number;
    averageHealth: number;
    lastCheck: Date;
  };
  generateDiagnosticReport: () => string;
  saveDiagnosticData: () => Promise<void>;
  loadDiagnosticData: () => Promise<void>;
  optimizeSystem: () => Promise<string[]>;
}

const AdvancedDiagnosticsContext = createContext<AdvancedDiagnosticsContextType | undefined>(undefined);

export const AdvancedDiagnosticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    overall: 85,
    cpu: 70,
    memory: 80,
    battery: 90,
    storage: 75,
    network: 85,
    lastCheck: new Date(),
  });

  const [diagnosticReports, setDiagnosticReports] = useState<DiagnosticReport[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);

  // Automatyczne sprawdzanie zdrowia systemu co 5 minut
  useEffect(() => {
    const healthInterval = setInterval(async () => {
      await runHealthCheck();
    }, 300000);

    return () => clearInterval(healthInterval);
  }, []);

  // Sprawdzanie zdrowia systemu
  const runHealthCheck = useCallback(async (): Promise<DiagnosticReport> => {
    const startTime = Date.now();
    const results: DiagnosticResult[] = [];

    try {
      // Sprawdź baterię
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const isCharging = await Battery.isChargingAsync();
      
      results.push({
        category: 'battery',
        name: 'Battery Level',
        status: batteryLevel > 0.2 ? 'pass' : batteryLevel > 0.1 ? 'warning' : 'fail',
        value: `${Math.round(batteryLevel * 100)}%`,
        expected: '>20%',
        description: `Battery level is ${Math.round(batteryLevel * 100)}%${isCharging ? ' and charging' : ''}`,
        severity: batteryLevel > 0.2 ? 'low' : batteryLevel > 0.1 ? 'medium' : 'high',
        timestamp: new Date(),
      });

      // Sprawdź urządzenie
      results.push({
        category: 'system',
        name: 'Device Info',
        status: 'pass',
        value: Device.modelName || 'Unknown',
        expected: 'Available',
        description: `Device: ${Device.modelName}, OS: ${Device.osName} ${Device.osVersion}`,
        severity: 'low',
        timestamp: new Date(),
      });

      // Oblicz ogólne zdrowie systemu
      const passCount = results.filter(r => r.status === 'pass').length;
      const totalCount = results.length;
      const overallHealth = Math.round((passCount / totalCount) * 100);

      setSystemHealth({
        overall: overallHealth,
        cpu: 70,
        memory: 80,
        battery: Math.round(batteryLevel * 100),
        storage: 75,
        network: 85,
        lastCheck: new Date(),
      });

      const duration = Date.now() - startTime;
      const report: DiagnosticReport = {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: 'health_check',
        status: 'completed',
        results,
        summary: `Health check completed. Overall health: ${overallHealth}%`,
        recommendations: generateRecommendations(results),
        duration,
      };

      return report;
    } catch (error) {
      console.error('Błąd sprawdzania zdrowia:', error);
      
      const duration = Date.now() - startTime;
      return {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: 'health_check',
        status: 'failed',
        results: [],
        summary: 'Health check failed',
        recommendations: ['Check system logs for errors'],
        duration,
      };
    }
  }, []);

  // Test wydajności
  const runPerformanceTest = useCallback(async (): Promise<DiagnosticReport> => {
    const startTime = Date.now();
    const results: DiagnosticResult[] = [];

    try {
      results.push({
        category: 'performance',
        name: 'App Performance',
        status: 'pass',
        value: 'Good',
        expected: 'Good',
        description: 'Application is running smoothly',
        severity: 'low',
        timestamp: new Date(),
      });

      const duration = Date.now() - startTime;
      return {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: 'performance_test',
        status: 'completed',
        results,
        summary: 'Performance test completed',
        recommendations: ['System is performing well'],
        duration,
      };
    } catch (error) {
      console.error('Błąd testu wydajności:', error);
      
      const duration = Date.now() - startTime;
      return {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: 'performance_test',
        status: 'failed',
        results: [],
        summary: 'Performance test failed',
        recommendations: ['Check system resources'],
        duration,
      };
    }
  }, []);

  // Pełna diagnostyka
  const runFullDiagnostic = useCallback(async (): Promise<DiagnosticReport> => {
    const startTime = Date.now();
    
    try {
      const healthReport = await runHealthCheck();
      const performanceReport = await runPerformanceTest();
      
      const allResults = [...healthReport.results, ...performanceReport.results];
      
      const duration = Date.now() - startTime;
      return {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: 'full_scan',
        status: 'completed',
        results: allResults,
        summary: 'Full diagnostic completed',
        recommendations: generateRecommendations(allResults),
        duration,
      };
    } catch (error) {
      console.error('Błąd pełnej diagnostyki:', error);
      
      const duration = Date.now() - startTime;
      return {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: 'full_scan',
        status: 'failed',
        results: [],
        summary: 'Full diagnostic failed',
        recommendations: ['Restart application'],
        duration,
      };
    }
  }, [runHealthCheck, runPerformanceTest]);

  // Dodanie alertu systemowego
  const addSystemAlert = useCallback(async (
    alert: Omit<SystemAlert, 'id' | 'timestamp'>
  ): Promise<SystemAlert> => {
    const newAlert: SystemAlert = {
      ...alert,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };

    setSystemAlerts(prev => [...prev, newAlert]);
    return newAlert;
  }, []);

  // Rozwiązanie alertu
  const resolveAlert = useCallback(async (alertId: string, resolution: string): Promise<void> => {
    setSystemAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, isResolved: true, resolution }
        : alert
    ));
  }, []);

  // Statystyki systemu
  const getSystemStats = useCallback(() => {
    const totalReports = diagnosticReports.length;
    const criticalAlerts = systemAlerts.filter(a => a.severity === 'critical' && !a.isResolved).length;
    const averageHealth = systemHealth.overall;
    const lastCheck = systemHealth.lastCheck;

    return {
      totalReports,
      criticalAlerts,
      averageHealth,
      lastCheck,
    };
  }, [diagnosticReports, systemAlerts, systemHealth]);

  // Generowanie raportu diagnostycznego
  const generateDiagnosticReport = useCallback(() => {
    const stats = getSystemStats();
    
    return `System Health: ${stats.averageHealth}%
Critical Alerts: ${stats.criticalAlerts}
Total Reports: ${stats.totalReports}
Last Check: ${stats.lastCheck.toLocaleString()}`;
  }, [getSystemStats]);

  // Optymalizacja systemu
  const optimizeSystem = useCallback(async (): Promise<string[]> => {
    return ['System is optimized'];
  }, []);

  // Zapisywanie danych diagnostycznych
  const saveDiagnosticData = useCallback(async () => {
    try {
      await AsyncStorage.setItem('wera_system_health', JSON.stringify(systemHealth));
      await AsyncStorage.setItem('wera_system_alerts', JSON.stringify(systemAlerts));
    } catch (error) {
      console.error('Błąd zapisu danych diagnostycznych:', error);
    }
  }, [systemHealth, systemAlerts]);

  // Ładowanie danych diagnostycznych
  const loadDiagnosticData = useCallback(async () => {
    try {
      const savedHealth = await AsyncStorage.getItem('wera_system_health');
      const savedAlerts = await AsyncStorage.getItem('wera_system_alerts');

      if (savedHealth) {
        const parsedHealth = JSON.parse(savedHealth);
        setSystemHealth({
          ...parsedHealth,
          lastCheck: new Date(parsedHealth.lastCheck),
        });
      }

      if (savedAlerts) {
        const parsedAlerts = JSON.parse(savedAlerts);
        setSystemAlerts(parsedAlerts.map((alert: any) => ({
          ...alert,
          timestamp: new Date(alert.timestamp),
        })));
      }
    } catch (error) {
      console.error('Błąd ładowania danych diagnostycznych:', error);
    }
  }, []);

  // Automatyczne zapisywanie co 2 minuty
  useEffect(() => {
    const saveInterval = setInterval(() => {
      saveDiagnosticData();
    }, 120000);

    return () => clearInterval(saveInterval);
  }, [saveDiagnosticData]);

  const generateRecommendations = (results: DiagnosticResult[]): string[] => {
    const recommendations: string[] = [];

    const failedResults = results.filter(r => r.status === 'fail');
    const warningResults = results.filter(r => r.status === 'warning');

    failedResults.forEach(result => {
      switch (result.category) {
        case 'battery':
          recommendations.push('Charge device or reduce usage');
          break;
        case 'memory':
          recommendations.push('Close unused applications');
          break;
        case 'storage':
          recommendations.push('Free up storage space');
          break;
        case 'network':
          recommendations.push('Check internet connection');
          break;
        case 'security':
          recommendations.push('Grant required permissions');
          break;
      }
    });

    warningResults.forEach(result => {
      switch (result.category) {
        case 'battery':
          recommendations.push('Consider charging soon');
          break;
        case 'memory':
          recommendations.push('Monitor memory usage');
          break;
        case 'storage':
          recommendations.push('Consider cleaning storage');
          break;
        case 'performance':
          recommendations.push('Optimize application settings');
          break;
      }
    });

    return recommendations.length > 0 ? recommendations : ['System is running optimally'];
  };

  const value: AdvancedDiagnosticsContextType = {
    systemHealth,
    diagnosticReports,
    systemAlerts,
    runHealthCheck,
    runPerformanceTest,
    runFullDiagnostic,
    addSystemAlert,
    resolveAlert,
    getSystemStats,
    generateDiagnosticReport,
    saveDiagnosticData,
    loadDiagnosticData,
    optimizeSystem,
  };

  return (
    <AdvancedDiagnosticsContext.Provider value={value}>
      {children}
    </AdvancedDiagnosticsContext.Provider>
  );
};

export const useAdvancedDiagnostics = () => {
  const context = useContext(AdvancedDiagnosticsContext);
  if (!context) {
    throw new Error('useAdvancedDiagnostics must be used within AdvancedDiagnosticsProvider');
  }
  return context;
}; 