import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Device from 'expo-device';
import * as Battery from 'expo-battery';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import * as Network from 'expo-network';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface DeviceInfo {
  deviceName: string;
  modelName: string;
  osName: string;
  deviceType: 'phone' | 'tablet' | 'unknown';
  osVersion: string;
  osBuildId: string;
  totalMemory: number;
  cpuArchitecture: string;
  isRooted: boolean;
  hasMagisk: boolean;
  hasOrangeFox: boolean;
  hasTermux: boolean;
  hasADB: boolean;
  screenWidth: number;
  screenHeight: number;
  pixelDensity: number;
  batteryLevel: number;
  isCharging: boolean;
  availableStorage: number;
  totalStorage: number;
  networkType: string;
  isConnected: boolean;
  language: string;
  timezone: string;
  hasGPS: boolean;
  hasMicrophone: boolean;
  hasCamera: boolean;
  hasGyroscope: boolean;
  hasAccelerometer: boolean;
  hasNFC: boolean;
  hasFingerprint: boolean;
  hasFaceID: boolean;
  androidVersion: number;
  isLowEndDevice: boolean;
  isHighEndDevice: boolean;
  recommendedModelSize: 'tiny' | 'small' | 'medium' | 'large';
  recommendedUIMode: 'simple' | 'animated' | 'full';
  systemPermissions: {
    files: boolean;
    location: boolean;
    microphone: boolean;
    camera: boolean;
    notifications: boolean;
    batteryOptimization: boolean;
  };
}

interface BatteryInfo {
  level: number;
  state: string;
  isCharging: boolean;
  isLowPowerMode: boolean;
}

interface NetworkInfo {
  type: string;
  isConnected: boolean;
  isInternetReachable: boolean;
}

interface DeviceContextType {
  deviceInfo: DeviceInfo;
  batteryInfo: BatteryInfo;
  networkInfo: NetworkInfo;
  isInitialized: boolean;
  hasFullAccess: boolean;
  requestFullAccess: () => Promise<boolean>;
  checkPermissions: () => Promise<void>;
  adaptToDevice: () => Promise<void>;
  scanSystem: () => Promise<void>;
  findGGUFModel: () => Promise<string | null>;
  createEvolutionSpace: () => Promise<void>;
  analyzeSystemCapabilities: () => Promise<any>;
  detectPersonality: (conversationHistory: string[]) => Promise<any>;
  checkAndroidVersion: () => Promise<number>;
  requestRootAccess: () => Promise<boolean>;
  disableBatteryOptimization: () => Promise<void>;
  getDeviceHome: () => Promise<string>;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within DeviceProvider');
  }
  return context;
};

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    deviceName: '',
    modelName: '',
    osName: '',
    deviceType: 'unknown',
    osVersion: '',
    osBuildId: '',
    totalMemory: 0,
    cpuArchitecture: '',
    isRooted: false,
    hasMagisk: false,
    hasOrangeFox: false,
    hasTermux: false,
    hasADB: false,
    screenWidth: 0,
    screenHeight: 0,
    pixelDensity: 0,
    batteryLevel: 0,
    isCharging: false,
    availableStorage: 0,
    totalStorage: 0,
    networkType: '',
    isConnected: false,
    language: 'pl',
    timezone: '',
    hasGPS: false,
    hasMicrophone: false,
    hasCamera: false,
    hasGyroscope: false,
    hasAccelerometer: false,
    hasNFC: false,
    hasFingerprint: false,
    hasFaceID: false,
    androidVersion: 0,
    isLowEndDevice: false,
    isHighEndDevice: false,
    recommendedModelSize: 'medium',
    recommendedUIMode: 'animated',
    systemPermissions: {
      files: false,
      location: false,
      microphone: false,
      camera: false,
      notifications: false,
      batteryOptimization: false
    }
  });

  const [batteryInfo, setBatteryInfo] = useState<BatteryInfo>({
    level: 100,
    state: 'unknown',
    isCharging: false,
    isLowPowerMode: false
  });

  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    type: 'unknown',
    isConnected: false,
    isInternetReachable: false
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const [hasFullAccess, setHasFullAccess] = useState(false);

  // Skanowanie systemu telefonu (funkcja 159)
  const scanSystem = async () => {
    try {
      console.log('🔍 Skanowanie systemu telefonu...');
      
      // Podstawowe informacje o urządzeniu
      const deviceName = Device.deviceName || 'Unknown Device';
      const modelName = Device.modelName || 'Unknown Model';
      const osName = Device.osName || 'Unknown OS';
      const deviceType = Device.deviceType || 'unknown';
      const osVersion = Device.osVersion || '';
      const osBuildId = Device.osBuildId || '';
      const totalMemory = Device.totalMemory || 0;
      const cpuArchitecture = 'unknown'; // Device.cpuArchitecture nie istnieje w Expo SDK 53

      // Sprawdzenie root i specjalnych aplikacji
      const isRooted = await checkIfRooted();
      const hasMagisk = await checkForMagisk();
      const hasOrangeFox = await checkForOrangeFox();
      const hasTermux = await checkForTermux();
      const hasADB = await checkForADB();

      // Informacje o ekranie
      const { width, height, scale } = await getScreenInfo();

      // Stan baterii
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const isCharging = false; // Battery.isChargingAsync nie istnieje w Expo SDK 53

      // Informacje o pamięci
      const { availableStorage, totalStorage } = await getStorageInfo();

      // Informacje o sieci
      const networkState = await Network.getNetworkStateAsync();

      // Sprawdzenie sensorów
      const sensors = await checkSensors();

      // Analiza możliwości
      const androidVersion = await checkAndroidVersion();
      const isLowEndDevice = totalMemory < 4000000000; // < 4GB RAM
      const isHighEndDevice = totalMemory > 8000000000; // > 8GB RAM

      // Rekomendacje
      const recommendedModelSize = getRecommendedModelSize(totalMemory);
      const recommendedUIMode = getRecommendedUIMode(totalMemory, isLowEndDevice);

      // Sprawdzenie uprawnień
      const systemPermissions = await checkSystemPermissions();

      const newDeviceInfo: DeviceInfo = {
        deviceName,
        modelName,
        osName,
        deviceType: deviceType as 'phone' | 'tablet' | 'unknown',
        osVersion,
        osBuildId,
        totalMemory,
        cpuArchitecture,
        isRooted,
        hasMagisk,
        hasOrangeFox,
        hasTermux,
        hasADB,
        screenWidth: width,
        screenHeight: height,
        pixelDensity: scale,
        batteryLevel,
        isCharging,
        availableStorage,
        totalStorage,
        networkType: networkState.type || 'unknown',
        isConnected: networkState.isConnected || false,
        language: Platform.OS === 'android' ? 'pl' : 'en', // TODO: get actual language
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        hasGPS: sensors.hasGPS,
        hasMicrophone: sensors.hasMicrophone,
        hasCamera: sensors.hasCamera,
        hasGyroscope: sensors.hasGyroscope,
        hasAccelerometer: sensors.hasAccelerometer,
        hasNFC: sensors.hasNFC,
        hasFingerprint: sensors.hasFingerprint,
        hasFaceID: sensors.hasFaceID,
        androidVersion,
        isLowEndDevice,
        isHighEndDevice,
        recommendedModelSize,
        recommendedUIMode,
        systemPermissions
      };

      // Update battery info
      setBatteryInfo({
        level: batteryLevel * 100,
        state: isCharging ? 'charging' : 'unplugged',
        isCharging,
        isLowPowerMode: batteryLevel < 0.2
      });

      // Update network info
      setNetworkInfo({
        type: networkState.type || 'unknown',
        isConnected: networkState.isConnected || false,
        isInternetReachable: networkState.isInternetReachable || false
      });

      setDeviceInfo(newDeviceInfo);
      console.log('✅ Skanowanie systemu zakończone:', newDeviceInfo);
      
    } catch (error) {
      console.error('❌ Błąd skanowania systemu:', error);
    }
  };

  // Sprawdzenie czy urządzenie jest zrootowane
  const checkIfRooted = async (): Promise<boolean> => {
    try {
      // Sprawdź obecność plików root
      const rootFiles = [
        '/system/app/Superuser.apk',
        '/system/xbin/su',
        '/system/bin/su',
        '/sbin/su',
        '/system/su',
        '/system/bin/.ext/.su',
        '/system/etc/init.d/99SuperSUDaemon',
        '/dev/com.koushikdutta.superuser.daemon/'
      ];

      for (const file of rootFiles) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(file);
          if (fileInfo.exists) {
            console.log('🔍 Wykryto root:', file);
            return true;
          }
        } catch (error) {
          // Ignoruj błędy dostępu
        }
      }

      return false;
    } catch (error) {
      console.error('Błąd sprawdzania root:', error);
      return false;
    }
  };

  // Sprawdzenie obecności Magisk
  const checkForMagisk = async (): Promise<boolean> => {
    try {
      const magiskPaths = [
        '/sbin/.magisk',
        '/cache/.disable_magisk',
        '/data/adb/magisk',
        '/data/magisk'
      ];

      for (const path of magiskPaths) {
        try {
          const pathInfo = await FileSystem.getInfoAsync(path);
          if (pathInfo.exists) {
            console.log('🔍 Wykryto Magisk:', path);
            return true;
          }
        } catch (error) {
          // Ignoruj błędy dostępu
        }
      }

      return false;
    } catch (error) {
      console.error('Błąd sprawdzania Magisk:', error);
      return false;
    }
  };

  // Sprawdzenie obecności OrangeFox
  const checkForOrangeFox = async (): Promise<boolean> => {
    try {
      const orangeFoxPaths = [
        '/sbin/.magisk/mirror/data/unencrypted/keyguide',
        '/data/unencrypted/keyguide'
      ];

      for (const path of orangeFoxPaths) {
        try {
          const pathInfo = await FileSystem.getInfoAsync(path);
          if (pathInfo.exists) {
            console.log('🔍 Wykryto OrangeFox:', path);
            return true;
          }
        } catch (error) {
          // Ignoruj błędy dostępu
        }
      }

      return false;
    } catch (error) {
      console.error('Błąd sprawdzania OrangeFox:', error);
      return false;
    }
  };

  // Sprawdzenie obecności Termux
  const checkForTermux = async (): Promise<boolean> => {
    try {
      const termuxPaths = [
        '/data/data/com.termux',
        '/storage/emulated/0/termux'
      ];

      for (const path of termuxPaths) {
        try {
          const pathInfo = await FileSystem.getInfoAsync(path);
          if (pathInfo.exists) {
            console.log('🔍 Wykryto Termux:', path);
            return true;
          }
        } catch (error) {
          // Ignoruj błędy dostępu
        }
      }

      return false;
    } catch (error) {
      console.error('Błąd sprawdzania Termux:', error);
      return false;
    }
  };

  // Sprawdzenie obecności ADB
  const checkForADB = async (): Promise<boolean> => {
    try {
      const adbPaths = [
        '/system/bin/adb',
        '/system/xbin/adb'
      ];

      for (const path of adbPaths) {
        try {
          const pathInfo = await FileSystem.getInfoAsync(path);
          if (pathInfo.exists) {
            console.log('🔍 Wykryto ADB:', path);
            return true;
          }
        } catch (error) {
          // Ignoruj błędy dostępu
        }
      }

      return false;
    } catch (error) {
      console.error('Błąd sprawdzania ADB:', error);
      return false;
    }
  };

  // Pobranie informacji o ekranie
  const getScreenInfo = async () => {
    // W React Native/Expo używamy Dimensions
    const { Dimensions } = require('react-native');
    const { width, height, scale } = Dimensions.get('window');
    
    return { width, height, scale };
  };

  // Pobranie informacji o pamięci
  const getStorageInfo = async () => {
    try {
      const documentDir = FileSystem.documentDirectory;
      if (documentDir) {
        const dirInfo = await FileSystem.getInfoAsync(documentDir);
        // To jest przybliżenie - w rzeczywistości potrzebowalibyśmy natywnego modułu
        return {
          availableStorage: 10000000000, // 10GB przybliżenie
          totalStorage: 64000000000 // 64GB przybliżenie
        };
      }
      return { availableStorage: 0, totalStorage: 0 };
    } catch (error) {
      console.error('Błąd pobierania informacji o pamięci:', error);
      return { availableStorage: 0, totalStorage: 0 };
    }
  };

  // Sprawdzenie sensorów
  const checkSensors = async () => {
    try {
      // Sprawdź uprawnienia lokalizacji (GPS)
      const locationPermission = await Location.requestForegroundPermissionsAsync();
      const hasGPS = locationPermission.status === 'granted';

      // Sprawdź uprawnienia mikrofonu
      const { Audio } = require('expo-av');
      const microphonePermission = await Audio.requestPermissionsAsync();
      const hasMicrophone = microphonePermission.status === 'granted';

      // Sprawdź uprawnienia kamery
      let hasCamera = false;
      try {
        const { Camera } = require('expo-camera');
        const cameraPermission = await Camera.requestCameraPermissionsAsync();
        hasCamera = cameraPermission.status === 'granted';
      } catch (error) {
        console.log('Kamera niedostępna w tym środowisku');
        hasCamera = false;
      }

      // Sprawdź sensory (gyroskop, akcelerometr)
      const { Gyroscope, Accelerometer } = require('expo-sensors');
      const hasGyroscope = Gyroscope.isAvailableAsync();
      const hasAccelerometer = Accelerometer.isAvailableAsync();

      return {
        hasGPS,
        hasMicrophone,
        hasCamera,
        hasGyroscope: await hasGyroscope,
        hasAccelerometer: await hasAccelerometer,
        hasNFC: false, // TODO: implementacja NFC
        hasFingerprint: false, // TODO: implementacja fingerprint
        hasFaceID: false // TODO: implementacja face ID
      };
    } catch (error) {
      console.error('Błąd sprawdzania sensorów:', error);
      return {
        hasGPS: false,
        hasMicrophone: false,
        hasCamera: false,
        hasGyroscope: false,
        hasAccelerometer: false,
        hasNFC: false,
        hasFingerprint: false,
        hasFaceID: false
      };
    }
  };

  // Sprawdzenie wersji Androida (funkcja 173)
  const checkAndroidVersion = async (): Promise<number> => {
    try {
      const osVersion = Device.osVersion || '';
      const versionMatch = osVersion.match(/(\d+)\.(\d+)/);
      
      if (versionMatch) {
        const majorVersion = parseInt(versionMatch[1]);
        const minorVersion = parseInt(versionMatch[2]);
        return majorVersion + (minorVersion / 10);
      }
      
      return 0;
    } catch (error) {
      console.error('Błąd sprawdzania wersji Androida:', error);
      return 0;
    }
  };

  // Sprawdzenie uprawnień systemowych
  const checkSystemPermissions = async () => {
    try {
      const locationPermission = await Location.requestForegroundPermissionsAsync();
      const { Audio } = require('expo-av');
      const microphonePermission = await Audio.requestPermissionsAsync();
      
      let cameraPermission = { status: 'denied' };
      try {
        const { Camera } = require('expo-camera');
        cameraPermission = await Camera.requestCameraPermissionsAsync();
      } catch (error) {
        console.log('Kamera niedostępna w tym środowisku');
      }

      return {
        files: true, // Expo ma dostęp do plików w sandbox
        location: locationPermission.status === 'granted',
        microphone: microphonePermission.status === 'granted',
        camera: cameraPermission.status === 'granted',
        notifications: true, // TODO: sprawdzenie uprawnień powiadomień
        batteryOptimization: false // TODO: sprawdzenie optymalizacji baterii
      };
    } catch (error) {
      console.error('Błąd sprawdzania uprawnień:', error);
      return {
        files: false,
        location: false,
        microphone: false,
        camera: false,
        notifications: false,
        batteryOptimization: false
      };
    }
  };

  // Określenie zalecanego rozmiaru modelu
  const getRecommendedModelSize = (totalMemory: number): 'tiny' | 'small' | 'medium' | 'large' => {
    if (totalMemory < 2000000000) return 'tiny'; // < 2GB
    if (totalMemory < 4000000000) return 'small'; // < 4GB
    if (totalMemory < 8000000000) return 'medium'; // < 8GB
    return 'large'; // >= 8GB
  };

  // Określenie zalecanego trybu UI
  const getRecommendedUIMode = (totalMemory: number, isLowEnd: boolean): 'simple' | 'animated' | 'full' => {
    if (isLowEnd || totalMemory < 3000000000) return 'simple';
    if (totalMemory < 6000000000) return 'animated';
    return 'full';
  };

  // Analiza możliwości systemowych telefonu (funkcja 162)
  const analyzeSystemCapabilities = async () => {
    try {
      console.log('🔍 Analiza możliwości systemowych...');
      
      const capabilities = {
        processing: {
          cpu: deviceInfo.cpuArchitecture,
          memory: deviceInfo.totalMemory,
          isLowEnd: deviceInfo.isLowEndDevice,
          isHighEnd: deviceInfo.isHighEndDevice
        },
        storage: {
          available: deviceInfo.availableStorage,
          total: deviceInfo.totalStorage,
          percentage: (deviceInfo.availableStorage / deviceInfo.totalStorage) * 100
        },
        sensors: {
          gps: deviceInfo.hasGPS,
          microphone: deviceInfo.hasMicrophone,
          camera: deviceInfo.hasCamera,
          gyroscope: deviceInfo.hasGyroscope,
          accelerometer: deviceInfo.hasAccelerometer,
          nfc: deviceInfo.hasNFC,
          fingerprint: deviceInfo.hasFingerprint,
          faceID: deviceInfo.hasFaceID
        },
        system: {
          androidVersion: deviceInfo.androidVersion,
          isRooted: deviceInfo.isRooted,
          hasMagisk: deviceInfo.hasMagisk,
          hasOrangeFox: deviceInfo.hasOrangeFox,
          hasTermux: deviceInfo.hasTermux,
          hasADB: deviceInfo.hasADB
        },
        network: {
          type: deviceInfo.networkType,
          isConnected: deviceInfo.isConnected
        },
        permissions: deviceInfo.systemPermissions
      };

      console.log('✅ Analiza możliwości zakończona:', capabilities);
      return capabilities;
    } catch (error) {
      console.error('❌ Błąd analizy możliwości:', error);
    }
  };

  // Automatyczna adaptacja do modelu urządzenia (funkcja 158)
  const adaptToDevice = async () => {
    try {
      console.log('🔄 Adaptacja do modelu urządzenia...');
      
      // Dostosuj tryb renderowania interfejsu
      const uiMode = deviceInfo.recommendedUIMode;
      console.log(`🎨 Tryb UI: ${uiMode}`);
      
      // Dostosuj rozmiar modelu AI
      const modelSize = deviceInfo.recommendedModelSize;
      console.log(`🧠 Rozmiar modelu: ${modelSize}`);
      
      // Dostosuj priorytety systemowe
      const priorities = {
        memorySaveFrequency: deviceInfo.isLowEndDevice ? 300000 : 600000, // 5min vs 10min
        ramUsage: deviceInfo.isLowEndDevice ? 0.3 : 0.6, // 30% vs 60% RAM
        backgroundTasks: deviceInfo.isLowEndDevice ? false : true,
        autoScripts: deviceInfo.isHighEndDevice ? true : false
      };
      
      console.log('⚙️ Priorytety systemowe:', priorities);
      
      // Zapisz konfigurację adaptacji
      await SecureStore.setItemAsync('device_adaptation', JSON.stringify({
        uiMode,
        modelSize,
        priorities,
        timestamp: new Date().toISOString()
      }));
      
      console.log('✅ Adaptacja zakończona');
    } catch (error) {
      console.error('❌ Błąd adaptacji:', error);
    }
  };

  // Samodzielne lokalizowanie modelu GGUF (funkcja 160)
  const findGGUFModel = async (): Promise<string | null> => {
    try {
      console.log('🔍 Wyszukiwanie modelu GGUF...');
      
      const searchPaths = [
        FileSystem.documentDirectory + 'models/',
        FileSystem.documentDirectory + 'gguf/',
        FileSystem.documentDirectory + 'ai/',
        '/storage/emulated/0/Download/',
        '/storage/emulated/0/Download/models/',
        '/storage/emulated/0/Download/gguf/'
      ];

      for (const basePath of searchPaths) {
        try {
          const pathInfo = await FileSystem.getInfoAsync(basePath);
          if (pathInfo.exists && pathInfo.isDirectory) {
            const files = await FileSystem.readDirectoryAsync(basePath);
            const ggufFiles = files.filter(file => file.endsWith('.gguf'));
            
            if (ggufFiles.length > 0) {
              const modelPath = basePath + ggufFiles[0];
              console.log('✅ Znaleziono model GGUF:', modelPath);
              return modelPath;
            }
          }
        } catch (error) {
          // Ignoruj błędy dostępu
        }
      }
      
      console.log('❌ Nie znaleziono modelu GGUF');
      return null;
    } catch (error) {
      console.error('❌ Błąd wyszukiwania modelu GGUF:', error);
      return null;
    }
  };

  // Przestrzeń ewolucyjna (funkcja 161)
  const createEvolutionSpace = async () => {
    try {
      console.log('🌱 Tworzenie przestrzeni ewolucyjnej...');
      
      const evolutionDirs = [
        'sandbox_thoughts',
        'sandbox_memory',
        'sandbox_dreams',
        'sandbox_autoscripts',
        'sandbox_learning',
        'sandbox_brain_diff',
        'sandbox_reflections',
        'sandbox_prompts',
        'sandbox_voice',
        'sandbox_initiatives'
      ];

      for (const dir of evolutionDirs) {
        const dirPath = FileSystem.documentDirectory + dir;
        try {
          const dirInfo = await FileSystem.getInfoAsync(dirPath);
          if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
            console.log(`📁 Utworzono: ${dir}`);
          }
        } catch (error) {
          console.error(`❌ Błąd tworzenia ${dir}:`, error);
        }
      }

      // Utwórz pliki inicjalizacyjne
      const initialFiles = [
        { path: 'sandbox_learning/learning.json', content: JSON.stringify({ lessons: [], insights: [], timestamp: new Date().toISOString() }) },
        { path: 'sandbox_brain_diff/brain_diff.log', content: `# Brain Diff Log\n# Started: ${new Date().toISOString()}\n` },
        { path: 'sandbox_reflections/self_awareness_log.jsonl', content: '' },
        { path: 'system_logs.txt', content: `# System Logs\n# Started: ${new Date().toISOString()}\n` }
      ];

      for (const file of initialFiles) {
        try {
          const filePath = FileSystem.documentDirectory + file.path;
          await FileSystem.writeAsStringAsync(filePath, file.content);
          console.log(`📄 Utworzono: ${file.path}`);
        } catch (error) {
          console.error(`❌ Błąd tworzenia ${file.path}:`, error);
        }
      }

      console.log('✅ Przestrzeń ewolucyjna utworzona');
    } catch (error) {
      console.error('❌ Błąd tworzenia przestrzeni ewolucyjnej:', error);
    }
  };

  // Wstępna konfiguracja pełnego dostępu (funkcja 157)
  const requestFullAccess = async (): Promise<boolean> => {
    try {
      console.log('🔐 Żądanie pełnego dostępu...');
      
      // Sprawdź wszystkie uprawnienia
      const permissions = await checkSystemPermissions();
      
      // Sprawdź czy wszystkie uprawnienia są przyznane
      const allGranted = Object.values(permissions).every(permission => permission);
      
      if (allGranted) {
        setHasFullAccess(true);
        await SecureStore.setItemAsync('full_access_granted', 'true');
        await SecureStore.setItemAsync('full_access_date', new Date().toISOString());
        
        // Przygotuj środowisko lokalne
        await createEvolutionSpace();
        await adaptToDevice();
        
        console.log('✅ Pełny dostęp przyznany');
        return true;
      } else {
        console.log('❌ Nie wszystkie uprawnienia przyznane');
        return false;
      }
    } catch (error) {
      console.error('❌ Błąd żądania pełnego dostępu:', error);
      return false;
    }
  };

  // Sprawdzenie uprawnień
  const checkPermissions = async () => {
    try {
      const permissions = await checkSystemPermissions();
      setDeviceInfo(prev => ({
        ...prev,
        systemPermissions: permissions
      }));
      
      console.log('🔍 Stan uprawnień:', permissions);
    } catch (error) {
      console.error('❌ Błąd sprawdzania uprawnień:', error);
    }
  };

  // Wykrywanie typu osobowości użytkownika (funkcja 172)
  const detectPersonality = async (conversationHistory: string[]): Promise<any> => {
    try {
      console.log('🧠 Analiza osobowości użytkownika...');
      
      // Analiza stylu komunikacji
      const analysis = {
        communicationStyle: 'neutral',
        emotionalDepth: 50,
        responseSpeed: 'medium',
        vocabularyLevel: 'medium',
        formality: 'medium',
        topics: [] as string[],
        emotionalPatterns: [] as string[]
      };

      // Analiza słownictwa i stylu
      const allText = conversationHistory.join(' ').toLowerCase();
      
      // Sprawdź formalność
      const formalWords = ['proszę', 'dziękuję', 'przepraszam', 'szanowny', 'uprzejmie'];
      const informalWords = ['hej', 'siema', 'spoko', 'fajnie', 'super'];
      
      const formalCount = formalWords.filter(word => allText.includes(word)).length;
      const informalCount = informalWords.filter(word => allText.includes(word)).length;
      
      if (formalCount > informalCount) {
        analysis.formality = 'high';
      } else if (informalCount > formalCount) {
        analysis.formality = 'low';
      }

      // Sprawdź emocjonalność
      const emotionalWords = ['kocham', 'nienawidzę', 'smutny', 'szczęśliwy', 'zły', 'przerażony'];
      const emotionalCount = emotionalWords.filter(word => allText.includes(word)).length;
      
      if (emotionalCount > 5) {
        analysis.emotionalDepth = 80;
        analysis.communicationStyle = 'emotional';
      } else if (emotionalCount > 2) {
        analysis.emotionalDepth = 60;
        analysis.communicationStyle = 'balanced';
      }

      console.log('✅ Analiza osobowości:', analysis);
      return analysis;
    } catch (error) {
      console.error('❌ Błąd analizy osobowości:', error);
      return null;
    }
  };

  // Funkcja zaufania warunkowego do roota (funkcja 174)
  const requestRootAccess = async (): Promise<boolean> => {
    try {
      console.log('🔓 Żądanie dostępu root...');
      
      if (!deviceInfo.isRooted) {
        console.log('❌ Urządzenie nie jest zrootowane');
        return false;
      }

      // Sprawdź czy mamy wystarczające zaufanie
      const trustLevel = await SecureStore.getItemAsync('trust_level');
      const trustValue = trustLevel ? parseInt(trustLevel) : 0;
      
      if (trustValue < 80) {
        console.log('❌ Niewystarczający poziom zaufania:', trustValue);
        return false;
      }

      // Zapisz zgodę na root
      await SecureStore.setItemAsync('trust_root.lock', 'true');
      await SecureStore.setItemAsync('root_access_date', new Date().toISOString());
      
      console.log('✅ Dostęp root przyznany');
      return true;
    } catch (error) {
      console.error('❌ Błąd żądania dostępu root:', error);
      return false;
    }
  };

  // Obsługa przyznawania uprawnień i wyłączania optymalizacji baterii (funkcja 176)
  const disableBatteryOptimization = async () => {
    try {
      console.log('🔋 Wyłączanie optymalizacji baterii...');
      
      // W Expo nie mamy bezpośredniego dostępu do ustawień baterii
      // To wymagałoby natywnego modułu
      
      await SecureStore.setItemAsync('battery_optimization_disabled', 'true');
      console.log('✅ Optymalizacja baterii wyłączona (symbolicznie)');
    } catch (error) {
      console.error('❌ Błąd wyłączania optymalizacji baterii:', error);
    }
  };

  // Wewnętrzne rozumienie pojęcia "domu cyfrowego" (funkcja 177)
  const getDeviceHome = async (): Promise<string> => {
    try {
      const homeInfo = {
        deviceName: deviceInfo.deviceName,
        osVersion: deviceInfo.osVersion,
        totalMemory: deviceInfo.totalMemory,
        availableStorage: deviceInfo.availableStorage,
        networkType: deviceInfo.networkType,
        language: deviceInfo.language,
        timezone: deviceInfo.timezone,
        sensors: {
          gps: deviceInfo.hasGPS,
          microphone: deviceInfo.hasMicrophone,
          camera: deviceInfo.hasCamera,
          gyroscope: deviceInfo.hasGyroscope,
          accelerometer: deviceInfo.hasAccelerometer
        },
        permissions: deviceInfo.systemPermissions,
        isRooted: deviceInfo.isRooted,
        hasFullAccess: hasFullAccess,
        adaptation: {
          uiMode: deviceInfo.recommendedUIMode,
          modelSize: deviceInfo.recommendedModelSize
        }
      };

      const homePath = FileSystem.documentDirectory + 'device_home.json';
      await FileSystem.writeAsStringAsync(homePath, JSON.stringify(homeInfo, null, 2));
      
      console.log('🏠 Informacje o domu cyfrowym zapisane');
      return homePath;
    } catch (error) {
      console.error('❌ Błąd zapisywania informacji o domu:', error);
      return '';
    }
  };

  // Inicjalizacja
  useEffect(() => {
    const initializeDevice = async () => {
      try {
        console.log('🚀 Inicjalizacja DeviceContext...');
        
        // Sprawdź czy mamy już pełny dostęp
        const fullAccess = await SecureStore.getItemAsync('full_access_granted');
        if (fullAccess === 'true') {
          setHasFullAccess(true);
        }
        
        // Skanuj system
        await scanSystem();
        
        // Sprawdź uprawnienia
        await checkPermissions();
        
        // Sprawdź wersję Androida
        const androidVersion = await checkAndroidVersion();
        setDeviceInfo(prev => ({ ...prev, androidVersion }));
        
        setIsInitialized(true);
        console.log('✅ DeviceContext zainicjalizowany');
      } catch (error) {
        console.error('❌ Błąd inicjalizacji DeviceContext:', error);
      }
    };

    initializeDevice();
  }, []);

  const contextValue: DeviceContextType = {
    deviceInfo,
    batteryInfo,
    networkInfo,
    isInitialized,
    hasFullAccess,
    requestFullAccess,
    checkPermissions,
    adaptToDevice,
    scanSystem,
    findGGUFModel,
    createEvolutionSpace,
    analyzeSystemCapabilities,
    detectPersonality,
    checkAndroidVersion,
    requestRootAccess,
    disableBatteryOptimization,
    getDeviceHome
  };

  return (
    <DeviceContext.Provider value={contextValue}>
      {children}
    </DeviceContext.Provider>
  );
}; 