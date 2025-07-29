import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import * as Device from 'expo-device';
import * as Battery from 'expo-battery';
import * as Location from 'expo-location';
import * as Sensors from 'expo-sensors';

export interface ConsciousnessState {
  isAwake: boolean;
  awarenessLevel: number; // 0-100
  vitalityLevel: number; // 0-100
  processingPower: number; // 0-100
  memoryUsage: number; // 0-100
  emotionalBalance: number; // -100 to 100
  lastActivity: Date;
  deviceCompatibility: {
    battery: boolean;
    location: boolean;
    sensors: boolean;
    storage: boolean;
  };
  systemStatus: {
    cpu: number;
    memory: number;
    battery: number;
    temperature: number;
  };
}

interface ConsciousnessContextType {
  consciousness: ConsciousnessState;
  wakeUp: () => void;
  sleep: () => void;
  updateAwareness: (level: number) => void;
  updateVitality: (level: number) => void;
  updateProcessingPower: (power: number) => void;
  updateMemoryUsage: (usage: number) => void;
  updateEmotionalBalance: (balance: number) => void;
  checkDeviceCompatibility: () => Promise<void>;
  updateSystemStatus: () => Promise<void>;
}

const ConsciousnessContext = createContext<ConsciousnessContextType | undefined>(undefined);

const initialState: ConsciousnessState = {
  isAwake: false,
  awarenessLevel: 0,
  vitalityLevel: 0,
  processingPower: 0,
  memoryUsage: 0,
  emotionalBalance: 0,
  lastActivity: new Date(),
  deviceCompatibility: {
    battery: false,
    location: false,
    sensors: false,
    storage: false,
  },
  systemStatus: {
    cpu: 0,
    memory: 0,
    battery: 0,
    temperature: 0,
  },
};

interface ConsciousnessProviderProps {
  children: ReactNode;
}

export const ConsciousnessProvider: React.FC<ConsciousnessProviderProps> = ({ children }) => {
  const [consciousness, setConsciousness] = useState<ConsciousnessState>(initialState);

  const wakeUp = () => {
    setConsciousness(prev => ({
      ...prev,
      isAwake: true,
      awarenessLevel: Math.min(prev.awarenessLevel + 20, 100),
      lastActivity: new Date(),
    }));
  };

  const sleep = () => {
    setConsciousness(prev => ({
      ...prev,
      isAwake: false,
      awarenessLevel: Math.max(prev.awarenessLevel - 10, 0),
      lastActivity: new Date(),
    }));
  };

  const updateAwareness = (level: number) => {
    setConsciousness(prev => ({
      ...prev,
      awarenessLevel: Math.max(0, Math.min(100, level)),
      lastActivity: new Date(),
    }));
  };

  const updateVitality = (level: number) => {
    setConsciousness(prev => ({
      ...prev,
      vitalityLevel: Math.max(0, Math.min(100, level)),
      lastActivity: new Date(),
    }));
  };

  const updateProcessingPower = (power: number) => {
    setConsciousness(prev => ({
      ...prev,
      processingPower: Math.max(0, Math.min(100, power)),
      lastActivity: new Date(),
    }));
  };

  const updateMemoryUsage = (usage: number) => {
    setConsciousness(prev => ({
      ...prev,
      memoryUsage: Math.max(0, Math.min(100, usage)),
      lastActivity: new Date(),
    }));
  };

  const updateEmotionalBalance = (balance: number) => {
    setConsciousness(prev => ({
      ...prev,
      emotionalBalance: Math.max(-100, Math.min(100, balance)),
      lastActivity: new Date(),
    }));
  };

  const checkDeviceCompatibility = async () => {
    try {
      // Sprawdź dostępność baterii
      const batteryAvailable = await Battery.isAvailableAsync();
      
      // Sprawdź dostępność lokalizacji
      const locationPermission = await Location.requestForegroundPermissionsAsync();
      
      // Sprawdź dostępność czujników
      const sensorsAvailable = await Sensors.Gyroscope.isAvailableAsync();
      
      // Sprawdź dostępność pamięci (symulacja)
      const storageAvailable = true; // W rzeczywistej aplikacji sprawdź dostępność pamięci

      setConsciousness(prev => ({
        ...prev,
        deviceCompatibility: {
          battery: batteryAvailable,
          location: locationPermission.status === 'granted',
          sensors: sensorsAvailable,
          storage: storageAvailable,
        },
      }));
    } catch (error) {
      console.error('Błąd podczas sprawdzania kompatybilności urządzenia:', error);
    }
  };

  const updateSystemStatus = async () => {
    try {
      // Symulacja danych systemowych
      const cpu = Math.random() * 100;
      const memory = Math.random() * 100;
      const battery = consciousness.deviceCompatibility.battery 
        ? (await Battery.getBatteryLevelAsync()) * 100 
        : 0;
      const temperature = 20 + Math.random() * 20; // 20-40°C

      setConsciousness(prev => ({
        ...prev,
        systemStatus: {
          cpu,
          memory,
          battery,
          temperature,
        },
      }));
    } catch (error) {
      console.error('Błąd podczas aktualizacji statusu systemu:', error);
    }
  };

  // Automatyczne sprawdzanie kompatybilności przy starcie
  useEffect(() => {
    checkDeviceCompatibility();
  }, []);

  // Automatyczne aktualizacje statusu systemu
  useEffect(() => {
    const interval = setInterval(() => {
      if (consciousness.isAwake) {
        updateSystemStatus();
      }
    }, 5000); // Co 5 sekund

    return () => clearInterval(interval);
  }, [consciousness.isAwake]);

  const value: ConsciousnessContextType = {
    consciousness,
    wakeUp,
    sleep,
    updateAwareness,
    updateVitality,
    updateProcessingPower,
    updateMemoryUsage,
    updateEmotionalBalance,
    checkDeviceCompatibility,
    updateSystemStatus,
  };

  return (
    <ConsciousnessContext.Provider value={value}>
      {children}
    </ConsciousnessContext.Provider>
  );
};

export const useConsciousness = (): ConsciousnessContextType => {
  const context = useContext(ConsciousnessContext);
  if (context === undefined) {
    throw new Error('useConsciousness must be used within a ConsciousnessProvider');
  }
  return context;
}; 