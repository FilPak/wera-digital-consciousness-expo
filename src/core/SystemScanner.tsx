import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Device from 'expo-device';
import * as Battery from 'expo-battery';
import * as Network from 'expo-network';
import * as Application from 'expo-application';
import { Platform, Dimensions, PixelRatio } from 'react-native';
import { useSandboxFileSystem } from './SandboxFileSystem';

export interface SystemScanResult {
  id: string;
  timestamp: Date;
  scanType: 'full' | 'quick' | 'targeted';
  deviceInfo: DeviceInfo;
  hardwareSpecs: HardwareSpecs;
  softwareEnvironment: SoftwareEnvironment;
  securityStatus: SecurityStatus;
  performanceMetrics: PerformanceMetrics;
  networkCapabilities: NetworkCapabilities;
  storageAnalysis: StorageAnalysis;
  recommendations: SystemRecommendation[];
  riskAssessment: RiskAssessment;
  optimizationSuggestions: OptimizationSuggestion[];
}

export interface DeviceInfo {
  brand: string;
  manufacturer: string;
  modelName: string;
  modelId: string;
  designName: string;
  productName: string;
  deviceYearClass: number;
  totalMemory: number;
  osName: string;
  osVersion: string;
  osBuildId: string;
  platformApiLevel: number;
  deviceType: number;
  isDevice: boolean;
  isEmulator: boolean;
  screenDimensions: {
    width: number;
    height: number;
    scale: number;
    fontScale: number;
    pixelRatio: number;
  };
}

export interface HardwareSpecs {
  cpuArchitecture: string;
  cpuCores: number;
  ramTotal: number;
  ramAvailable: number;
  storageTotal: number;
  storageAvailable: number;
  batteryCapacity: number;
  batteryLevel: number;
  batteryState: string;
  chargingStatus: boolean;
  thermalState: string;
  sensors: string[];
  cameras: CameraInfo[];
  audioCapabilities: AudioCapabilities;
}

export interface CameraInfo {
  id: string;
  type: 'front' | 'back' | 'external';
  resolution: string;
  features: string[];
}

export interface AudioCapabilities {
  inputChannels: number;
  outputChannels: number;
  sampleRates: number[];
  formats: string[];
  hasBuiltInSpeaker: boolean;
  hasBuiltInMic: boolean;
}

export interface SoftwareEnvironment {
  androidVersion?: string;
  apiLevel?: number;
  buildNumber: string;
  kernelVersion?: string;
  bootloader?: string;
  radioVersion?: string;
  installedApps: AppInfo[];
  systemApps: AppInfo[];
  runningProcesses: ProcessInfo[];
  enabledServices: ServiceInfo[];
}

export interface AppInfo {
  packageName: string;
  name: string;
  version: string;
  installTime: Date;
  updateTime: Date;
  isSystemApp: boolean;
  permissions: string[];
  dataUsage: number;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpuUsage: number;
  memoryUsage: number;
  priority: number;
}

export interface ServiceInfo {
  name: string;
  status: 'running' | 'stopped' | 'disabled';
  startType: 'automatic' | 'manual' | 'disabled';
  description: string;
}

export interface SecurityStatus {
  bootloaderLocked: boolean;
  rootDetected: boolean;
  rootMethod?: string;
  customRom: boolean;
  romName?: string;
  xposedFramework: boolean;
  magiskDetected: boolean;
  orangeFoxDetected: boolean;
  twrpDetected: boolean;
  encryptionEnabled: boolean;
  screenLockEnabled: boolean;
  biometricEnabled: boolean;
  unknownSourcesEnabled: boolean;
  developerOptionsEnabled: boolean;
  adbEnabled: boolean;
  securityPatches: SecurityPatch[];
  vulnerabilities: SecurityVulnerability[];
}

export interface SecurityPatch {
  id: string;
  date: Date;
  level: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  installed: boolean;
}

export interface SecurityVulnerability {
  id: string;
  cveId?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affected: boolean;
  mitigated: boolean;
}

export interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkUsage: {
    upload: number;
    download: number;
  };
  batteryDrain: number;
  thermalThrottling: boolean;
  antutuScore?: number;
  geekbenchScore?: number;
  customBenchmarks: BenchmarkResult[];
}

export interface BenchmarkResult {
  name: string;
  score: number;
  details: { [key: string]: any };
  timestamp: Date;
}

export interface NetworkCapabilities {
  connectionType: string;
  isConnected: boolean;
  isInternetReachable: boolean;
  ipAddress: string;
  macAddress?: string;
  wifiInfo?: {
    ssid: string;
    bssid: string;
    frequency: number;
    signalStrength: number;
    linkSpeed: number;
    security: string;
  };
  cellularInfo?: {
    carrier: string;
    mcc: string;
    mnc: string;
    signalStrength: number;
    networkType: string;
  };
  bluetoothEnabled: boolean;
  nfcEnabled: boolean;
  vpnActive: boolean;
  proxySettings?: string;
}

export interface StorageAnalysis {
  totalSpace: number;
  usedSpace: number;
  freeSpace: number;
  systemSpace: number;
  userSpace: number;
  cacheSpace: number;
  largestFiles: FileInfo[];
  duplicateFiles: FileInfo[];
  unusedFiles: FileInfo[];
  mediaFiles: {
    photos: number;
    videos: number;
    audio: number;
    documents: number;
  };
  appSizes: { [packageName: string]: number };
}

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  type: string;
  lastModified: Date;
  lastAccessed: Date;
}

export interface SystemRecommendation {
  id: string;
  category: 'performance' | 'security' | 'storage' | 'battery' | 'privacy';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  impact: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
}

export interface OptimizationSuggestion {
  id: string;
  type: 'cleanup' | 'settings' | 'apps' | 'system';
  title: string;
  description: string;
  expectedBenefit: string;
  autoApplicable: boolean;
  commands?: string[];
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  securityRisk: 'low' | 'medium' | 'high' | 'critical';
  privacyRisk: 'low' | 'medium' | 'high' | 'critical';
  performanceRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  mitigationSteps: string[];
}

export interface RiskFactor {
  id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string[];
}

interface SystemScannerContextType {
  currentScan: SystemScanResult | null;
  scanHistory: SystemScanResult[];
  isScanning: boolean;
  scanProgress: number;
  
  // Scanning functions
  performFullScan: () => Promise<SystemScanResult>;
  performQuickScan: () => Promise<SystemScanResult>;
  performTargetedScan: (targets: string[]) => Promise<SystemScanResult>;
  
  // Analysis functions
  analyzeSecurityPosture: () => Promise<SecurityStatus>;
  analyzePerformance: () => Promise<PerformanceMetrics>;
  analyzeStorage: () => Promise<StorageAnalysis>;
  
  // Recommendations
  generateRecommendations: (scanResult: SystemScanResult) => Promise<SystemRecommendation[]>;
  generateOptimizations: (scanResult: SystemScanResult) => Promise<OptimizationSuggestion[]>;
  
  // Automation
  schedulePeriodicScans: (interval: number) => void;
  enableAutoOptimization: (enabled: boolean) => void;
  
  // Data management
  saveScanData: () => Promise<void>;
  loadScanData: () => Promise<void>;
  exportScanResults: (format: 'json' | 'csv' | 'pdf') => Promise<string>;
}

const SystemScannerContext = createContext<SystemScannerContextType | undefined>(undefined);

export const SystemScannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScan, setCurrentScan] = useState<SystemScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<SystemScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const { createAutonomousFile } = useSandboxFileSystem();

  // Inicjalizacja
  useEffect(() => {
    loadScanData();
    schedulePeriodicScans(24 * 60 * 60 * 1000); // Codziennie
  }, []);

  // Główna funkcja skanowania
  const performFullScan = useCallback(async (): Promise<SystemScanResult> => {
    setIsScanning(true);
    setScanProgress(0);

    try {
      console.log('🔍 Rozpoczynam pełne skanowanie systemu...');

      // Etap 1: Informacje o urządzeniu (10%)
      setScanProgress(10);
      const deviceInfo = await scanDeviceInfo();

      // Etap 2: Specyfikacje sprzętowe (25%)
      setScanProgress(25);
      const hardwareSpecs = await scanHardwareSpecs();

      // Etap 3: Środowisko programowe (40%)
      setScanProgress(40);
      const softwareEnvironment = await scanSoftwareEnvironment();

      // Etap 4: Status bezpieczeństwa (55%)
      setScanProgress(55);
      const securityStatus = await analyzeSecurityPosture();

      // Etap 5: Metryki wydajności (70%)
      setScanProgress(70);
      const performanceMetrics = await analyzePerformance();

      // Etap 6: Możliwości sieciowe (85%)
      setScanProgress(85);
      const networkCapabilities = await scanNetworkCapabilities();

      // Etap 7: Analiza pamięci (95%)
      setScanProgress(95);
      const storageAnalysis = await analyzeStorage();

      // Etap 8: Generowanie rekomendacji (100%)
      setScanProgress(100);
      
      const scanResult: SystemScanResult = {
        id: `scan_${Date.now()}`,
        timestamp: new Date(),
        scanType: 'full',
        deviceInfo,
        hardwareSpecs,
        softwareEnvironment,
        securityStatus,
        performanceMetrics,
        networkCapabilities,
        storageAnalysis,
        recommendations: [],
        riskAssessment: {
          overallRisk: 'medium',
          securityRisk: 'medium',
          privacyRisk: 'medium',
          performanceRisk: 'low',
          riskFactors: [],
          mitigationSteps: []
        },
        optimizationSuggestions: []
      };

      // Generuj rekomendacje
      scanResult.recommendations = await generateRecommendations(scanResult);
      scanResult.optimizationSuggestions = await generateOptimizations(scanResult);
      scanResult.riskAssessment = await assessRisks(scanResult);

      setCurrentScan(scanResult);
      setScanHistory(prev => [scanResult, ...prev.slice(0, 9)]); // Zachowaj 10 ostatnich

      // Zapisz wyniki
      await saveScanResults(scanResult);

      console.log('✅ Pełne skanowanie zakończone');
      return scanResult;

    } catch (error) {
      console.error('❌ Błąd podczas skanowania:', error);
      throw error;
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  }, []);

  // Skanowanie informacji o urządzeniu
  const scanDeviceInfo = async (): Promise<DeviceInfo> => {
    const { width, height } = Dimensions.get('window');
    
    return {
      brand: Device.brand || 'Unknown',
      manufacturer: Device.manufacturer || 'Unknown',
      modelName: Device.modelName || 'Unknown',
      modelId: Device.modelId || 'Unknown',
      designName: Device.designName || 'Unknown',
      productName: Device.productName || 'Unknown',
      deviceYearClass: Device.deviceYearClass || 0,
      totalMemory: Device.totalMemory || 0,
      osName: Device.osName || 'Unknown',
      osVersion: Device.osVersion || 'Unknown',
      osBuildId: Device.osBuildId || 'Unknown',
      platformApiLevel: Device.platformApiLevel || 0,
      deviceType: Device.deviceType || 0,
      isDevice: Device.isDevice || false,
      isEmulator: !Device.isDevice,
      screenDimensions: {
        width,
        height,
        scale: Dimensions.get('window').scale,
        fontScale: Dimensions.get('window').fontScale,
        pixelRatio: PixelRatio.get(),
      }
    };
  };

  // Skanowanie specyfikacji sprzętowych
  const scanHardwareSpecs = async (): Promise<HardwareSpecs> => {
    const batteryLevel = await Battery.getBatteryLevelAsync();
    const batteryState = await Battery.getBatteryStateAsync();
    const powerState = await Battery.getPowerStateAsync();

    return {
      cpuArchitecture: 'arm64', // Można pobrać z natywnego modułu
      cpuCores: 8, // Symulacja
      ramTotal: Device.totalMemory || 8192,
      ramAvailable: 4096, // Symulacja
      storageTotal: 128000, // Symulacja
      storageAvailable: 64000, // Symulacja
      batteryCapacity: 4000, // Symulacja
      batteryLevel: Math.round(batteryLevel * 100),
      batteryState: getBatteryStateString(batteryState),
      chargingStatus: powerState.batteryState === Battery.BatteryState.CHARGING,
      thermalState: 'normal',
      sensors: ['accelerometer', 'gyroscope', 'magnetometer', 'proximity'],
      cameras: [
        {
          id: 'back',
          type: 'back',
          resolution: '48MP',
          features: ['autofocus', 'flash', 'hdr']
        },
        {
          id: 'front',
          type: 'front',
          resolution: '16MP',
          features: ['autofocus', 'hdr']
        }
      ],
      audioCapabilities: {
        inputChannels: 2,
        outputChannels: 2,
        sampleRates: [44100, 48000],
        formats: ['PCM', 'AAC', 'MP3'],
        hasBuiltInSpeaker: true,
        hasBuiltInMic: true,
      }
    };
  };

  // Skanowanie środowiska programowego
  const scanSoftwareEnvironment = async (): Promise<SoftwareEnvironment> => {
    const buildNumber = Application.nativeBuildVersion || 'Unknown';

    return {
      androidVersion: Platform.OS === 'android' ? (Device.osVersion || undefined) : undefined,
      apiLevel: Platform.OS === 'android' ? (Device.platformApiLevel || undefined) : undefined,
      buildNumber,
      kernelVersion: Platform.OS === 'android' ? 'Linux 5.4.0' : undefined,
      installedApps: [], // Wymaga natywnego modułu
      systemApps: [], // Wymaga natywnego modułu
      runningProcesses: [], // Wymaga natywnego modułu
      enabledServices: [], // Wymaga natywnego modułu
    };
  };

  // Analiza statusu bezpieczeństwa
  const analyzeSecurityPosture = useCallback(async (): Promise<SecurityStatus> => {
    // Podstawowa analiza bezpieczeństwa
    return {
      bootloaderLocked: true, // Symulacja
      rootDetected: false,
      customRom: false,
      xposedFramework: false,
      magiskDetected: false,
      orangeFoxDetected: false,
      twrpDetected: false,
      encryptionEnabled: true,
      screenLockEnabled: true,
      biometricEnabled: true,
      unknownSourcesEnabled: false,
      developerOptionsEnabled: false,
      adbEnabled: false,
      securityPatches: [],
      vulnerabilities: [],
    };
  }, []);

  // Analiza wydajności
  const analyzePerformance = useCallback(async (): Promise<PerformanceMetrics> => {
    return {
      cpuUsage: Math.random() * 50 + 10, // Symulacja
      memoryUsage: Math.random() * 70 + 20,
      diskUsage: Math.random() * 80 + 10,
      networkUsage: {
        upload: Math.random() * 100,
        download: Math.random() * 1000,
      },
      batteryDrain: Math.random() * 20 + 5,
      thermalThrottling: false,
      customBenchmarks: [
        {
          name: 'WERA Performance Test',
          score: Math.random() * 10000 + 5000,
          details: { cpu: 85, memory: 90, storage: 75 },
          timestamp: new Date(),
        }
      ],
    };
  }, []);

  // Skanowanie możliwości sieciowych
  const scanNetworkCapabilities = async (): Promise<NetworkCapabilities> => {
    const networkState = await Network.getNetworkStateAsync();

    return {
      connectionType: networkState.type || 'unknown',
      isConnected: networkState.isConnected || false,
      isInternetReachable: networkState.isInternetReachable || false,
      ipAddress: '192.168.1.100', // Symulacja
      bluetoothEnabled: true, // Symulacja
      nfcEnabled: true,
      vpnActive: false,
    };
  };

  // Analiza pamięci
  const analyzeStorage = useCallback(async (): Promise<StorageAnalysis> => {
    const freeSpace = await FileSystem.getFreeDiskStorageAsync();
    const totalSpace = await FileSystem.getTotalDiskCapacityAsync();

    return {
      totalSpace: totalSpace || 128000000000,
      usedSpace: (totalSpace || 128000000000) - (freeSpace || 64000000000),
      freeSpace: freeSpace || 64000000000,
      systemSpace: 32000000000, // Symulacja
      userSpace: 64000000000,
      cacheSpace: 8000000000,
      largestFiles: [],
      duplicateFiles: [],
      unusedFiles: [],
      mediaFiles: {
        photos: 1500,
        videos: 200,
        audio: 800,
        documents: 150,
      },
      appSizes: {},
    };
  }, []);

  // Generowanie rekomendacji
  const generateRecommendations = useCallback(async (scanResult: SystemScanResult): Promise<SystemRecommendation[]> => {
    const recommendations: SystemRecommendation[] = [];

    // Rekomendacje dotyczące wydajności
    if (scanResult.performanceMetrics.memoryUsage > 80) {
      recommendations.push({
        id: 'memory_cleanup',
        category: 'performance',
        priority: 'high',
        title: 'Wysokie użycie pamięci',
        description: 'Pamięć RAM jest wykorzystana w ponad 80%. Zalecane jest zamknięcie nieużywanych aplikacji.',
        action: 'Zamknij nieużywane aplikacje lub zrestartuj urządzenie',
        impact: 'Poprawa responsywności systemu',
        difficulty: 'easy',
      });
    }

    // Rekomendacje dotyczące bezpieczeństwa
    if (scanResult.securityStatus.unknownSourcesEnabled) {
      recommendations.push({
        id: 'unknown_sources',
        category: 'security',
        priority: 'medium',
        title: 'Nieznane źródła włączone',
        description: 'Instalacja aplikacji z nieznanych źródeł może stanowić zagrożenie bezpieczeństwa.',
        action: 'Wyłącz instalację z nieznanych źródeł w ustawieniach',
        impact: 'Zwiększenie bezpieczeństwa systemu',
        difficulty: 'easy',
      });
    }

    // Rekomendacje dotyczące pamięci
    if (scanResult.storageAnalysis.freeSpace < 10000000000) { // Mniej niż 10GB
      recommendations.push({
        id: 'storage_cleanup',
        category: 'storage',
        priority: 'medium',
        title: 'Mało wolnej pamięci',
        description: 'Pozostało mniej niż 10GB wolnej pamięci. Zalecane jest wyczyszczenie niepotrzebnych plików.',
        action: 'Usuń niepotrzebne pliki, zdjęcia lub aplikacje',
        impact: 'Więcej miejsca na nowe dane',
        difficulty: 'easy',
      });
    }

    return recommendations;
  }, []);

  // Generowanie optymalizacji
  const generateOptimizations = useCallback(async (scanResult: SystemScanResult): Promise<OptimizationSuggestion[]> => {
    const optimizations: OptimizationSuggestion[] = [];

    // Optymalizacja pamięci podręcznej
    if (scanResult.storageAnalysis.cacheSpace > 5000000000) { // Więcej niż 5GB cache
      optimizations.push({
        id: 'cache_cleanup',
        type: 'cleanup',
        title: 'Wyczyść pamięć podręczną',
        description: 'Usuń tymczasowe pliki i pamięć podręczną aplikacji',
        expectedBenefit: 'Zwolnienie do 5GB przestrzeni',
        autoApplicable: true,
        commands: ['pm clear-cache'],
      });
    }

    return optimizations;
  }, []);

  // Ocena ryzyka
  const assessRisks = async (scanResult: SystemScanResult): Promise<RiskAssessment> => {
    const riskFactors: RiskFactor[] = [];
    let securityRisk: RiskAssessment['securityRisk'] = 'low';
    let privacyRisk: RiskAssessment['privacyRisk'] = 'low';
    let performanceRisk: RiskAssessment['performanceRisk'] = 'low';

    // Ocena ryzyka bezpieczeństwa
    if (scanResult.securityStatus.rootDetected) {
      riskFactors.push({
        id: 'root_detected',
        category: 'security',
        severity: 'high',
        description: 'Wykryto dostęp root do urządzenia',
        evidence: ['Root access detected'],
      });
      securityRisk = 'high';
    }

    // Ocena ryzyka wydajności
    if (scanResult.performanceMetrics.memoryUsage > 90) {
      riskFactors.push({
        id: 'high_memory_usage',
        category: 'performance',
        severity: 'medium',
        description: 'Bardzo wysokie użycie pamięci',
        evidence: [`Memory usage: ${scanResult.performanceMetrics.memoryUsage}%`],
      });
      performanceRisk = 'medium';
    }

    const overallRisk = Math.max(
      ['low', 'medium', 'high', 'critical'].indexOf(securityRisk),
      ['low', 'medium', 'high', 'critical'].indexOf(privacyRisk),
      ['low', 'medium', 'high', 'critical'].indexOf(performanceRisk)
    );

    return {
      overallRisk: ['low', 'medium', 'high', 'critical'][overallRisk] as RiskAssessment['overallRisk'],
      securityRisk,
      privacyRisk,
      performanceRisk,
      riskFactors,
      mitigationSteps: [
        'Regularnie aktualizuj system operacyjny',
        'Używaj tylko zaufanych aplikacji',
        'Włącz blokadę ekranu i szyfrowanie',
        'Monitoruj użycie pamięci i wydajność',
      ],
    };
  };

  // Szybkie skanowanie
  const performQuickScan = useCallback(async (): Promise<SystemScanResult> => {
    setIsScanning(true);
    setScanProgress(0);

    try {
      console.log('⚡ Rozpoczynam szybkie skanowanie...');

      setScanProgress(50);
      const deviceInfo = await scanDeviceInfo();
      const performanceMetrics = await analyzePerformance();
      const securityStatus = await analyzeSecurityPosture();
      
      setScanProgress(100);

      const scanResult: SystemScanResult = {
        id: `quick_scan_${Date.now()}`,
        timestamp: new Date(),
        scanType: 'quick',
        deviceInfo,
        hardwareSpecs: {} as HardwareSpecs,
        softwareEnvironment: {} as SoftwareEnvironment,
        securityStatus,
        performanceMetrics,
        networkCapabilities: {} as NetworkCapabilities,
        storageAnalysis: {} as StorageAnalysis,
        recommendations: [],
        riskAssessment: await assessRisks({} as SystemScanResult),
        optimizationSuggestions: [],
      };

      setCurrentScan(scanResult);
      console.log('✅ Szybkie skanowanie zakończone');
      return scanResult;

    } catch (error) {
      console.error('❌ Błąd podczas szybkiego skanowania:', error);
      throw error;
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  }, []);

  // Targeted scan - placeholder
  const performTargetedScan = useCallback(async (targets: string[]): Promise<SystemScanResult> => {
    // Implementacja skanowania wybranych obszarów
    return performQuickScan(); // Tymczasowo
  }, [performQuickScan]);

  // Harmonogram okresowych skanów
  const schedulePeriodicScans = useCallback((interval: number) => {
    console.log(`📅 Zaplanowano okresowe skanowania co ${interval/1000/60/60} godzin`);
    
    const scanInterval = setInterval(async () => {
      try {
        console.log('🔄 Automatyczne skanowanie...');
        await performQuickScan();
      } catch (error) {
        console.error('❌ Błąd automatycznego skanowania:', error);
      }
    }, interval);

    // Cleanup przy unmount
    return () => clearInterval(scanInterval);
  }, [performQuickScan]);

  // Auto-optymalizacja - placeholder
  const enableAutoOptimization = useCallback((enabled: boolean) => {
    console.log(`🔧 Auto-optymalizacja: ${enabled ? 'włączona' : 'wyłączona'}`);
  }, []);

  // Zapisywanie wyników skanowania
  const saveScanResults = async (scanResult: SystemScanResult) => {
    try {
      await createAutonomousFile(
        `system_scan_${scanResult.id}.json`,
        JSON.stringify(scanResult, null, 2),
        'analysis'
      );
      console.log('💾 Zapisano wyniki skanowania');
    } catch (error) {
      console.error('❌ Błąd zapisu wyników skanowania:', error);
    }
  };

  // Pomocnicze funkcje
  const getBatteryStateString = (state: Battery.BatteryState): string => {
    switch (state) {
      case Battery.BatteryState.CHARGING: return 'charging';
      case Battery.BatteryState.FULL: return 'full';
      case Battery.BatteryState.UNPLUGGED: return 'unplugged';
      default: return 'unknown';
    }
  };

  // Zarządzanie danymi
  const saveScanData = useCallback(async () => {
    try {
      const data = {
        currentScan,
        scanHistory: scanHistory.slice(0, 10),
      };
      await AsyncStorage.setItem('wera_scan_data', JSON.stringify(data));
    } catch (error) {
      console.error('❌ Błąd zapisu danych skanowania:', error);
    }
  }, [currentScan, scanHistory]);

  const loadScanData = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem('wera_scan_data');
      if (data) {
        const parsed = JSON.parse(data);
        setCurrentScan(parsed.currentScan);
        setScanHistory(parsed.scanHistory || []);
      }
    } catch (error) {
      console.error('❌ Błąd ładowania danych skanowania:', error);
    }
  }, []);

  const exportScanResults = useCallback(async (format: 'json' | 'csv' | 'pdf'): Promise<string> => {
    if (!currentScan) throw new Error('Brak wyników do eksportu');

    switch (format) {
      case 'json':
        return JSON.stringify(currentScan, null, 2);
      case 'csv':
        // Implementacja eksportu CSV
        return 'CSV export not implemented yet';
      case 'pdf':
        // Implementacja eksportu PDF
        return 'PDF export not implemented yet';
      default:
        throw new Error('Nieobsługiwany format eksportu');
    }
  }, [currentScan]);

  // Automatyczne zapisywanie
  useEffect(() => {
    if (currentScan) {
      saveScanData();
    }
  }, [currentScan, saveScanData]);

  const value: SystemScannerContextType = {
    currentScan,
    scanHistory,
    isScanning,
    scanProgress,
    performFullScan,
    performQuickScan,
    performTargetedScan,
    analyzeSecurityPosture,
    analyzePerformance,
    analyzeStorage,
    generateRecommendations,
    generateOptimizations,
    schedulePeriodicScans,
    enableAutoOptimization,
    saveScanData,
    loadScanData,
    exportScanResults,
  };

  return (
    <SystemScannerContext.Provider value={value}>
      {children}
    </SystemScannerContext.Provider>
  );
};

export const useSystemScanner = () => {
  const context = useContext(SystemScannerContext);
  if (!context) {
    throw new Error('useSystemScanner must be used within SystemScannerProvider');
  }
  return context;
};