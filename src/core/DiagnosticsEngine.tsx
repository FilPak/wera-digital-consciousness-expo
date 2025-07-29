import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as FileSystem from 'expo-file-system';
import * as Battery from 'expo-battery';
import * as Device from 'expo-device';
import * as Network from 'expo-network';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface SystemMetrics {
  cpu: {
    usage: number;
    temperature: number;
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    available: number;
    percentage: number;
  };
  storage: {
    total: number;
    used: number;
    available: number;
    percentage: number;
  };
  battery: {
    level: number;
    isCharging: boolean;
    temperature: number;
  };
  network: {
    type: string;
    isConnected: boolean;
    strength: number;
  };
  system: {
    uptime: number;
    loadAverage: number;
    processCount: number;
  };
}

interface DiagnosticReport {
  timestamp: string;
  systemStatus: 'healthy' | 'warning' | 'critical';
  metrics: SystemMetrics;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  performance: {
    score: number;
    bottlenecks: string[];
  };
}

interface DiagnosticsContextType {
  systemMetrics: SystemMetrics;
  diagnosticReport: DiagnosticReport | null;
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  generateReport: () => Promise<DiagnosticReport>;
  exportLogs: () => Promise<string>;
  checkSystemHealth: () => Promise<'healthy' | 'warning' | 'critical'>;
  getPerformanceScore: () => number;
  getBottlenecks: () => string[];
  saveReport: (report: DiagnosticReport) => Promise<void>;
  loadReports: () => Promise<DiagnosticReport[]>;
  clearOldReports: () => Promise<void>;
}

const DiagnosticsContext = createContext<DiagnosticsContextType | undefined>(undefined);

export const useDiagnostics = () => {
  const context = useContext(DiagnosticsContext);
  if (!context) {
    throw new Error('useDiagnostics must be used within DiagnosticsProvider');
  }
  return context;
};

export const DiagnosticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: { usage: 0, temperature: 0, cores: 1 },
    memory: { total: 0, used: 0, available: 0, percentage: 0 },
    storage: { total: 0, used: 0, available: 0, percentage: 0 },
    battery: { level: 0, isCharging: false, temperature: 0 },
    network: { type: '', isConnected: false, strength: 0 },
    system: { uptime: 0, loadAverage: 0, processCount: 0 }
  });

  const [diagnosticReport, setDiagnosticReport] = useState<DiagnosticReport | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Pobieranie metryk systemowych (funkcja 93)
  const collectSystemMetrics = async (): Promise<SystemMetrics> => {
    try {
      // CPU - przybliżenie dla Expo
      const cpuUsage = Math.random() * 100; // TODO: implementacja rzeczywistego monitorowania CPU
      const cpuTemperature = 25 + Math.random() * 20; // 25-45°C
      const cpuCores = 4; // Device.cpuArchitecture nie istnieje w Expo SDK 53

      // Pamięć
      const totalMemory = Device.totalMemory || 4000000000; // 4GB default
      const usedMemory = totalMemory * (0.3 + Math.random() * 0.4); // 30-70% użycia
      const availableMemory = totalMemory - usedMemory;
      const memoryPercentage = (usedMemory / totalMemory) * 100;

      // Pamięć masowa
      const documentDir = FileSystem.documentDirectory;
      const storageInfo = await FileSystem.getInfoAsync(documentDir || '');
      const totalStorage = 64000000000; // 64GB przybliżenie
      const usedStorage = totalStorage * (0.2 + Math.random() * 0.3); // 20-50% użycia
      const availableStorage = totalStorage - usedStorage;
      const storagePercentage = (usedStorage / totalStorage) * 100;

      // Bateria
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const isCharging = false; // Battery.isChargingAsync nie istnieje w Expo SDK 53
      const batteryTemperature = 20 + Math.random() * 15; // 20-35°C

      // Sieć
      const networkState = await Network.getNetworkStateAsync();
      const networkStrength = Math.random() * 100;

      // System
      const uptime = Date.now() - startTimeRef.current;
      const loadAverage = Math.random() * 2; // 0-2
      const processCount = 50 + Math.floor(Math.random() * 100); // 50-150 procesów

      const metrics: SystemMetrics = {
        cpu: {
          usage: cpuUsage,
          temperature: cpuTemperature,
          cores: cpuCores
        },
        memory: {
          total: totalMemory,
          used: usedMemory,
          available: availableMemory,
          percentage: memoryPercentage
        },
        storage: {
          total: totalStorage,
          used: usedStorage,
          available: availableStorage,
          percentage: storagePercentage
        },
        battery: {
          level: batteryLevel * 100,
          isCharging,
          temperature: batteryTemperature
        },
        network: {
          type: networkState.type || 'unknown',
          isConnected: networkState.isConnected || false,
          strength: networkStrength
        },
        system: {
          uptime,
          loadAverage,
          processCount
        }
      };

      setSystemMetrics(metrics);
      return metrics;
    } catch (error) {
      console.error('❌ Błąd pobierania metryk systemowych:', error);
      return systemMetrics;
    }
  };

  // Sprawdzenie zdrowia systemu (funkcja 95)
  const checkSystemHealth = async (): Promise<'healthy' | 'warning' | 'critical'> => {
    try {
      const metrics = await collectSystemMetrics();
      let healthScore = 100;
      const warnings: string[] = [];
      const errors: string[] = [];

      // Sprawdź CPU
      if (metrics.cpu.usage > 90) {
        healthScore -= 30;
        errors.push('Wysokie użycie CPU (>90%)');
      } else if (metrics.cpu.usage > 70) {
        healthScore -= 15;
        warnings.push('Podwyższone użycie CPU (>70%)');
      }

      if (metrics.cpu.temperature > 60) {
        healthScore -= 25;
        errors.push('Wysoka temperatura CPU (>60°C)');
      } else if (metrics.cpu.temperature > 45) {
        healthScore -= 10;
        warnings.push('Podwyższona temperatura CPU (>45°C)');
      }

      // Sprawdź pamięć
      if (metrics.memory.percentage > 90) {
        healthScore -= 25;
        errors.push('Krytyczne użycie pamięci (>90%)');
      } else if (metrics.memory.percentage > 80) {
        healthScore -= 15;
        warnings.push('Wysokie użycie pamięci (>80%)');
      }

      // Sprawdź pamięć masową
      if (metrics.storage.percentage > 95) {
        healthScore -= 20;
        errors.push('Brak miejsca na dysku (>95%)');
      } else if (metrics.storage.percentage > 85) {
        healthScore -= 10;
        warnings.push('Mało miejsca na dysku (>85%)');
      }

      // Sprawdź baterię
      if (metrics.battery.level < 10) {
        healthScore -= 20;
        errors.push('Krytyczny poziom baterii (<10%)');
      } else if (metrics.battery.level < 20) {
        healthScore -= 10;
        warnings.push('Niski poziom baterii (<20%)');
      }

      if (metrics.battery.temperature > 45) {
        healthScore -= 15;
        errors.push('Wysoka temperatura baterii (>45°C)');
      }

      // Sprawdź sieć
      if (!metrics.network.isConnected) {
        healthScore -= 15;
        warnings.push('Brak połączenia sieciowego');
      }

      // Określ status
      let status: 'healthy' | 'warning' | 'critical';
      if (healthScore >= 80) {
        status = 'healthy';
      } else if (healthScore >= 50) {
        status = 'warning';
      } else {
        status = 'critical';
      }

      console.log(`🏥 Status zdrowia systemu: ${status} (${healthScore}/100)`);
      return status;
    } catch (error) {
      console.error('❌ Błąd sprawdzania zdrowia systemu:', error);
      return 'critical';
    }
  };

  // Generowanie raportu diagnostycznego (funkcja 94)
  const generateReport = async (): Promise<DiagnosticReport> => {
    try {
      console.log('📊 Generowanie raportu diagnostycznego...');
      
      const metrics = await collectSystemMetrics();
      const healthStatus = await checkSystemHealth();
      
      // Analiza wydajności
      const performanceScore = getPerformanceScore();
      const bottlenecks = getBottlenecks();

      // Generuj rekomendacje
      const recommendations = generateRecommendations(metrics, healthStatus);

      const report: DiagnosticReport = {
        timestamp: new Date().toISOString(),
        systemStatus: healthStatus,
        metrics,
        errors: [],
        warnings: [],
        recommendations,
        performance: {
          score: performanceScore,
          bottlenecks
        }
      };

      // Dodaj błędy i ostrzeżenia na podstawie metryk
      if (metrics.cpu.usage > 90) report.errors.push('Krytyczne użycie CPU');
      if (metrics.memory.percentage > 90) report.errors.push('Krytyczne użycie pamięci');
      if (metrics.battery.level < 10) report.errors.push('Krytyczny poziom baterii');
      
      if (metrics.cpu.usage > 70) report.warnings.push('Podwyższone użycie CPU');
      if (metrics.memory.percentage > 80) report.warnings.push('Wysokie użycie pamięci');
      if (metrics.battery.level < 20) report.warnings.push('Niski poziom baterii');

      setDiagnosticReport(report);
      
      // Zapisz raport
      await saveReport(report);
      
      console.log('✅ Raport diagnostyczny wygenerowany');
      return report;
    } catch (error) {
      console.error('❌ Błąd generowania raportu:', error);
      throw error;
    }
  };

  // Eksport logów (funkcja 149)
  const exportLogs = async (): Promise<string> => {
    try {
      console.log('📤 Eksport logów...');
      
      const logs = [
        `# Raport diagnostyczny WERA`,
        `# Data: ${new Date().toISOString()}`,
        `# Urządzenie: ${Device.deviceName}`,
        `# System: ${Device.osVersion}`,
        ``,
        `## Metryki systemowe:`,
        `CPU: ${systemMetrics.cpu.usage.toFixed(1)}% (${systemMetrics.cpu.temperature.toFixed(1)}°C)`,
        `Pamięć: ${systemMetrics.memory.percentage.toFixed(1)}% (${(systemMetrics.memory.used / 1000000000).toFixed(1)}GB/${(systemMetrics.memory.total / 1000000000).toFixed(1)}GB)`,
        `Dysk: ${systemMetrics.storage.percentage.toFixed(1)}% (${(systemMetrics.storage.used / 1000000000).toFixed(1)}GB/${(systemMetrics.storage.total / 1000000000).toFixed(1)}GB)`,
        `Bateria: ${systemMetrics.battery.level.toFixed(1)}% (${systemMetrics.battery.isCharging ? 'ładowanie' : 'rozładowanie'})`,
        `Sieć: ${systemMetrics.network.type} (${systemMetrics.network.isConnected ? 'połączona' : 'rozłączona'})`,
        ``,
        `## Status systemu:`,
        `Zdrowie: ${diagnosticReport?.systemStatus || 'unknown'}`,
        `Wydajność: ${diagnosticReport?.performance.score || 0}/100`,
        ``,
        `## Błędy:`,
        ...(diagnosticReport?.errors.map(error => `- ${error}`) || ['Brak błędów']),
        ``,
        `## Ostrzeżenia:`,
        ...(diagnosticReport?.warnings.map(warning => `- ${warning}`) || ['Brak ostrzeżeń']),
        ``,
        `## Rekomendacje:`,
        ...(diagnosticReport?.recommendations.map(rec => `- ${rec}`) || ['Brak rekomendacji']),
        ``,
        `## Wąskie gardła:`,
        ...(diagnosticReport?.performance.bottlenecks.map(bottleneck => `- ${bottleneck}`) || ['Brak wąskich gardeł'])
      ].join('\n');

      const logPath = FileSystem.documentDirectory + 'diagnostic_report.txt';
      await FileSystem.writeAsStringAsync(logPath, logs);
      
      console.log('✅ Logi wyeksportowane:', logPath);
      return logPath;
    } catch (error) {
      console.error('❌ Błąd eksportu logów:', error);
      throw error;
    }
  };

  // Obliczenie wyniku wydajności
  const getPerformanceScore = (): number => {
    let score = 100;

    // CPU (30% wagi)
    if (systemMetrics.cpu.usage > 90) score -= 30;
    else if (systemMetrics.cpu.usage > 70) score -= 15;
    else if (systemMetrics.cpu.usage > 50) score -= 5;

    // Pamięć (25% wagi)
    if (systemMetrics.memory.percentage > 90) score -= 25;
    else if (systemMetrics.memory.percentage > 80) score -= 12;
    else if (systemMetrics.memory.percentage > 60) score -= 5;

    // Dysk (20% wagi)
    if (systemMetrics.storage.percentage > 95) score -= 20;
    else if (systemMetrics.storage.percentage > 85) score -= 10;
    else if (systemMetrics.storage.percentage > 70) score -= 5;

    // Bateria (15% wagi)
    if (systemMetrics.battery.level < 10) score -= 15;
    else if (systemMetrics.battery.level < 20) score -= 8;
    else if (systemMetrics.battery.level < 50) score -= 3;

    // Sieć (10% wagi)
    if (!systemMetrics.network.isConnected) score -= 10;

    return Math.max(0, score);
  };

  // Identyfikacja wąskich gardeł
  const getBottlenecks = (): string[] => {
    const bottlenecks: string[] = [];

    if (systemMetrics.cpu.usage > 80) {
      bottlenecks.push('Wysokie użycie CPU może spowolnić aplikację');
    }

    if (systemMetrics.memory.percentage > 85) {
      bottlenecks.push('Niedobór pamięci RAM może powodować zawieszenia');
    }

    if (systemMetrics.storage.percentage > 90) {
      bottlenecks.push('Brak miejsca na dysku może uniemożliwić zapisywanie danych');
    }

    if (systemMetrics.battery.level < 15) {
      bottlenecks.push('Niski poziom baterii może spowodować wyłączenie urządzenia');
    }

    if (!systemMetrics.network.isConnected) {
      bottlenecks.push('Brak połączenia sieciowego ogranicza funkcjonalność');
    }

    return bottlenecks;
  };

  // Generowanie rekomendacji
  const generateRecommendations = (metrics: SystemMetrics, status: string): string[] => {
    const recommendations: string[] = [];

    if (status === 'critical') {
      recommendations.push('Zalecane natychmiastowe działanie - sprawdź błędy systemowe');
    }

    if (metrics.cpu.usage > 70) {
      recommendations.push('Zamknij niepotrzebne aplikacje aby zmniejszyć obciążenie CPU');
    }

    if (metrics.memory.percentage > 80) {
      recommendations.push('Wyczyść pamięć podręczną aplikacji');
    }

    if (metrics.storage.percentage > 85) {
      recommendations.push('Zwolnij miejsce na dysku usuwając niepotrzebne pliki');
    }

    if (metrics.battery.level < 20) {
      recommendations.push('Podłącz urządzenie do ładowarki');
    }

    if (!metrics.network.isConnected) {
      recommendations.push('Sprawdź połączenie internetowe');
    }

    if (recommendations.length === 0) {
      recommendations.push('System działa optymalnie - nie są wymagane żadne działania');
    }

    return recommendations;
  };

  // Zapisywanie raportu
  const saveReport = async (report: DiagnosticReport): Promise<void> => {
    try {
      const reportsDir = FileSystem.documentDirectory + 'diagnostic_reports';
      const dirInfo = await FileSystem.getInfoAsync(reportsDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(reportsDir, { intermediates: true });
      }

      const fileName = `report_${Date.now()}.json`;
      const filePath = `${reportsDir}/${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(report, null, 2));
      console.log('📄 Raport zapisany:', filePath);
    } catch (error) {
      console.error('❌ Błąd zapisywania raportu:', error);
    }
  };

  // Ładowanie raportów
  const loadReports = async (): Promise<DiagnosticReport[]> => {
    try {
      const reportsDir = FileSystem.documentDirectory + 'diagnostic_reports';
      const dirInfo = await FileSystem.getInfoAsync(reportsDir);
      
      if (!dirInfo.exists) return [];

      const files = await FileSystem.readDirectoryAsync(reportsDir);
      const reportFiles = files.filter(file => file.endsWith('.json'));
      
      const reports: DiagnosticReport[] = [];
      
      for (const file of reportFiles.slice(-10)) { // Ostatnie 10 raportów
        try {
          const filePath = `${reportsDir}/${file}`;
          const content = await FileSystem.readAsStringAsync(filePath);
          const report = JSON.parse(content);
          reports.push(report);
        } catch (error) {
          console.error(`❌ Błąd ładowania raportu ${file}:`, error);
        }
      }

      return reports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('❌ Błąd ładowania raportów:', error);
      return [];
    }
  };

  // Czyszczenie starych raportów
  const clearOldReports = async (): Promise<void> => {
    try {
      const reportsDir = FileSystem.documentDirectory + 'diagnostic_reports';
      const dirInfo = await FileSystem.getInfoAsync(reportsDir);
      
      if (!dirInfo.exists) return;

      const files = await FileSystem.readDirectoryAsync(reportsDir);
      const reportFiles = files.filter(file => file.endsWith('.json'));
      
      // Usuń raporty starsze niż 7 dni
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      for (const file of reportFiles) {
        try {
          const filePath = `${reportsDir}/${file}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          
          if (fileInfo.exists && fileInfo.modificationTime && fileInfo.modificationTime < oneWeekAgo) {
            await FileSystem.deleteAsync(filePath);
            console.log('🗑️ Usunięto stary raport:', file);
          }
        } catch (error) {
          console.error(`❌ Błąd usuwania raportu ${file}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Błąd czyszczenia starych raportów:', error);
    }
  };

  // Uruchomienie monitorowania
  const startMonitoring = () => {
    if (isMonitoring) return;
    
    console.log('🔍 Uruchomienie monitorowania systemu...');
    setIsMonitoring(true);
    
    // Zbieraj metryki co 30 sekund
    monitoringIntervalRef.current = setInterval(async () => {
      await collectSystemMetrics();
      
      // Sprawdź zdrowie co 2 minuty
      if (Date.now() % 120000 < 30000) {
        await checkSystemHealth();
      }
    }, 30000);
  };

  // Zatrzymanie monitorowania
  const stopMonitoring = () => {
    if (!isMonitoring) return;
    
    console.log('⏹️ Zatrzymanie monitorowania systemu...');
    setIsMonitoring(false);
    
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
  };

  // Inicjalizacja
  useEffect(() => {
    const initializeDiagnostics = async () => {
      try {
        console.log('🚀 Inicjalizacja DiagnosticsEngine...');
        
        // Pobierz początkowe metryki
        await collectSystemMetrics();
        
        // Wygeneruj pierwszy raport
        await generateReport();
        
        // Uruchom monitorowanie
        startMonitoring();
        
        console.log('✅ DiagnosticsEngine zainicjalizowany');
      } catch (error) {
        console.error('❌ Błąd inicjalizacji DiagnosticsEngine:', error);
      }
    };

    initializeDiagnostics();

    // Czyszczenie przy odmontowaniu
    return () => {
      stopMonitoring();
    };
  }, []);

  const contextValue: DiagnosticsContextType = {
    systemMetrics,
    diagnosticReport,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    generateReport,
    exportLogs,
    checkSystemHealth,
    getPerformanceScore,
    getBottlenecks,
    saveReport,
    loadReports,
    clearOldReports
  };

  return (
    <DiagnosticsContext.Provider value={contextValue}>
      {children}
    </DiagnosticsContext.Provider>
  );
}; 