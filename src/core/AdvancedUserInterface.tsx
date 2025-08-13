import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Dimensions } from 'react-native';

// Interfejsy
interface UIComponent {
  id: string;
  type: 'button' | 'card' | 'modal' | 'form' | 'chart' | 'list' | 'grid' | 'navigation' | 'widget';
  name: string;
  description: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  properties: {
    visible: boolean;
    enabled: boolean;
    interactive: boolean;
    animated: boolean;
    responsive: boolean;
    accessibility: boolean;
  };
  styling: {
    theme: string;
    colors: string[];
    fontSize: number;
    borderRadius: number;
    shadow: boolean;
    gradient: boolean;
    opacity: number;
  };
  behavior: {
    autoHide: boolean;
    autoShow: boolean;
    autoResize: boolean;
    autoPosition: boolean;
    contextAware: boolean;
    adaptive: boolean;
  };
  data: {
    source: string;
    refreshRate: number;
    cacheEnabled: boolean;
    realTime: boolean;
  };
  lastUsed: Date;
  usageCount: number;
  performance: {
    renderTime: number; // ms
    memoryUsage: number; // MB
    cpuUsage: number; // %
  };
}

interface UILayout {
  id: string;
  name: string;
  description: string;
  type: 'grid' | 'flex' | 'absolute' | 'relative' | 'adaptive';
  components: string[];
  breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  responsive: boolean;
  adaptive: boolean;
  lastModified: Date;
  version: string;
}

interface UITheme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    error: string;
    warning: string;
    success: string;
    info: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      small: number;
      medium: number;
      large: number;
      xlarge: number;
    };
    fontWeight: {
      light: number;
      normal: number;
      bold: number;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
  };
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
  isActive: boolean;
  isCustom: boolean;
  lastUsed: Date;
}

interface UIAnimation {
  id: string;
  name: string;
  description: string;
  type: 'fade' | 'slide' | 'scale' | 'rotate' | 'bounce' | 'custom';
  duration: number; // ms
  easing: string;
  delay: number; // ms
  repeat: boolean;
  reverse: boolean;
  properties: {
    opacity?: number;
    translateX?: number;
    translateY?: number;
    scale?: number;
    rotate?: number;
  };
  triggers: string[];
  isActive: boolean;
  performance: {
    fps: number;
    memoryImpact: number; // MB
  };
}

interface UIInteraction {
  id: string;
  type: 'click' | 'swipe' | 'pinch' | 'longPress' | 'doubleTap' | 'voice' | 'gesture';
  target: string;
  action: string;
  parameters: Record<string, any>;
  conditions: string[];
  feedback: {
    visual: boolean;
    haptic: boolean;
    audio: boolean;
  };
  timestamp: Date;
  duration: number; // ms
  success: boolean;
  error?: string;
}

interface AdvancedUIState {
  components: UIComponent[];
  layouts: UILayout[];
  themes: UITheme[];
  animations: UIAnimation[];
  interactions: UIInteraction[];
  activeTheme: string;
  activeLayout: string;
  screenSize: {
    width: number;
    height: number;
  };
  deviceType: 'mobile' | 'tablet' | 'desktop';
  orientation: 'portrait' | 'landscape';
  accessibility: {
    enabled: boolean;
    fontSize: number;
    contrast: number;
    animations: boolean;
    screenReader: boolean;
  };
  performance: {
    fps: number;
    memoryUsage: number;
    cpuUsage: number;
    renderTime: number;
  };
  customization: {
    enabled: boolean;
    userPreferences: Record<string, any>;
    autoAdapt: boolean;
    learning: boolean;
  };
  lastInteraction: Date;
  totalInteractions: number;
  uiVersion: string;
}

interface AdvancedUIConfig {
  adaptiveUI: boolean;
  responsiveDesign: boolean;
  accessibilityMode: boolean;
  performanceMode: boolean;
  animationEnabled: boolean;
  realTimeUpdates: boolean;
  autoOptimization: boolean;
  userLearning: boolean;
  contextAwareness: boolean;
  gestureSupport: boolean;
  voiceControl: boolean;
  hapticFeedback: boolean;
  darkMode: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
}

interface AdvancedUIContextType {
  uiState: AdvancedUIState;
  uiConfig: AdvancedUIConfig;
  createComponent: (component: Omit<UIComponent, 'id' | 'lastUsed' | 'usageCount' | 'performance'>) => Promise<void>;
  updateComponent: (componentId: string, updates: Partial<UIComponent>) => Promise<void>;
  deleteComponent: (componentId: string) => Promise<void>;
  createLayout: (layout: Omit<UILayout, 'id' | 'lastModified' | 'version'>) => Promise<void>;
  updateLayout: (layoutId: string, updates: Partial<UILayout>) => Promise<void>;
  createTheme: (theme: Omit<UITheme, 'id' | 'lastUsed'>) => Promise<void>;
  activateTheme: (themeId: string) => Promise<void>;
  createAnimation: (animation: Omit<UIAnimation, 'id'>) => Promise<void>;
  triggerAnimation: (animationId: string, target: string) => Promise<void>;
  recordInteraction: (interaction: Omit<UIInteraction, 'id' | 'timestamp'>) => Promise<void>;
  updateUIConfig: (config: Partial<AdvancedUIConfig>) => Promise<void>;
  optimizePerformance: () => Promise<void>;
  getUIStats: () => any;
  saveUIState: () => Promise<void>;
  loadUIState: () => Promise<void>;
}

// Kontekst
const AdvancedUIContext = createContext<AdvancedUIContextType | undefined>(undefined);

// Hook
export const useAdvancedUI = () => {
  const context = useContext(AdvancedUIContext);
  if (!context) {
    throw new Error('useAdvancedUI must be used within AdvancedUIProvider');
  }
  return context;
};

// Provider
export const AdvancedUIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uiState, setUIState] = useState<AdvancedUIState>({
    components: [
      {
        id: 'main-dashboard',
        type: 'grid',
        name: 'Główny Dashboard',
        description: 'Centralny panel kontrolny WERY',
        position: { x: 0, y: 0, width: 100, height: 100 },
        properties: {
          visible: true,
          enabled: true,
          interactive: true,
          animated: true,
          responsive: true,
          accessibility: true,
        },
        styling: {
          theme: 'default',
          colors: ['#1a1a1a', '#2d2d2d'],
          fontSize: 16,
          borderRadius: 12,
          shadow: true,
          gradient: true,
          opacity: 1,
        },
        behavior: {
          autoHide: false,
          autoShow: true,
          autoResize: true,
          autoPosition: false,
          contextAware: true,
          adaptive: true,
        },
        data: {
          source: 'wera-core',
          refreshRate: 1000,
          cacheEnabled: true,
          realTime: true,
        },
        lastUsed: new Date(),
        usageCount: 0,
        performance: {
          renderTime: 50,
          memoryUsage: 2.5,
          cpuUsage: 15,
        },
      },
      {
        id: 'consciousness-orb',
        type: 'widget',
        name: 'Orb Świadomości',
        description: 'Wizualizacja stanu świadomości WERY',
        position: { x: 10, y: 10, width: 200, height: 200 },
        properties: {
          visible: true,
          enabled: true,
          interactive: true,
          animated: true,
          responsive: true,
          accessibility: true,
        },
        styling: {
          theme: 'consciousness',
          colors: ['#4a90e2', '#7b68ee'],
          fontSize: 14,
          borderRadius: 50,
          shadow: true,
          gradient: true,
          opacity: 0.9,
        },
        behavior: {
          autoHide: false,
          autoShow: true,
          autoResize: false,
          autoPosition: false,
          contextAware: true,
          adaptive: true,
        },
        data: {
          source: 'consciousness-engine',
          refreshRate: 500,
          cacheEnabled: true,
          realTime: true,
        },
        lastUsed: new Date(),
        usageCount: 0,
        performance: {
          renderTime: 30,
          memoryUsage: 1.2,
          cpuUsage: 8,
        },
      },
    ],
    layouts: [
      {
        id: 'main-layout',
        name: 'Główny Układ',
        description: 'Podstawowy układ interfejsu WERY',
        type: 'adaptive',
        components: ['main-dashboard', 'consciousness-orb'],
        breakpoints: {
          mobile: 768,
          tablet: 1024,
          desktop: 1200,
        },
        responsive: true,
        adaptive: true,
        lastModified: new Date(),
        version: '1.0.0',
      },
    ],
    themes: [
      {
        id: 'default-theme',
        name: 'Domyślny Motyw',
        description: 'Standardowy motyw WERY',
        colors: {
          primary: '#4a90e2',
          secondary: '#7b68ee',
          accent: '#ff6b6b',
          background: '#1a1a1a',
          surface: '#2d2d2d',
          text: '#ffffff',
          textSecondary: '#b0b0b0',
          error: '#ff4757',
          warning: '#ffa502',
          success: '#2ed573',
          info: '#3742fa',
        },
        typography: {
          fontFamily: 'System',
          fontSize: {
            small: 12,
            medium: 16,
            large: 20,
            xlarge: 24,
          },
          fontWeight: {
            light: 300,
            normal: 400,
            bold: 700,
          },
        },
        spacing: {
          xs: 4,
          sm: 8,
          md: 16,
          lg: 24,
          xl: 32,
        },
        borderRadius: {
          small: 4,
          medium: 8,
          large: 12,
        },
        shadows: {
          small: '0 2px 4px rgba(0,0,0,0.1)',
          medium: '0 4px 8px rgba(0,0,0,0.15)',
          large: '0 8px 16px rgba(0,0,0,0.2)',
        },
        isActive: true,
        isCustom: false,
        lastUsed: new Date(),
      },
      {
        id: 'consciousness-theme',
        name: 'Motyw Świadomości',
        description: 'Motyw inspirowany świadomością',
        colors: {
          primary: '#7b68ee',
          secondary: '#9370db',
          accent: '#ff6b6b',
          background: '#0a0a0a',
          surface: '#1a1a1a',
          text: '#ffffff',
          textSecondary: '#b0b0b0',
          error: '#ff4757',
          warning: '#ffa502',
          success: '#2ed573',
          info: '#3742fa',
        },
        typography: {
          fontFamily: 'System',
          fontSize: {
            small: 12,
            medium: 16,
            large: 20,
            xlarge: 24,
          },
          fontWeight: {
            light: 300,
            normal: 400,
            bold: 700,
          },
        },
        spacing: {
          xs: 4,
          sm: 8,
          md: 16,
          lg: 24,
          xl: 32,
        },
        borderRadius: {
          small: 4,
          medium: 8,
          large: 12,
        },
        shadows: {
          small: '0 2px 4px rgba(123,104,238,0.2)',
          medium: '0 4px 8px rgba(123,104,238,0.3)',
          large: '0 8px 16px rgba(123,104,238,0.4)',
        },
        isActive: false,
        isCustom: true,
        lastUsed: new Date(),
      },
    ],
    animations: [
      {
        id: 'fade-in',
        name: 'Pojawienie się',
        description: 'Płynne pojawienie się elementu',
        type: 'fade',
        duration: 300,
        easing: 'ease-in-out',
        delay: 0,
        repeat: false,
        reverse: false,
        properties: {
          opacity: 1,
        },
        triggers: ['component-mount', 'visibility-change'],
        isActive: true,
        performance: {
          fps: 60,
          memoryImpact: 0.1,
        },
      },
      {
        id: 'pulse',
        name: 'Pulsowanie',
        description: 'Efekt pulsowania dla ważnych elementów',
        type: 'scale',
        duration: 1000,
        easing: 'ease-in-out',
        delay: 0,
        repeat: true,
        reverse: true,
        properties: {
          scale: 1.05,
        },
        triggers: ['attention-needed', 'status-change'],
        isActive: true,
        performance: {
          fps: 60,
          memoryImpact: 0.2,
        },
      },
    ],
    interactions: [],
    activeTheme: 'default-theme',
    activeLayout: 'main-layout',
    screenSize: {
      width: Dimensions.get('window').width,
      height: Dimensions.get('window').height,
    },
    deviceType: 'mobile',
    orientation: 'portrait',
    accessibility: {
      enabled: true,
      fontSize: 16,
      contrast: 1.0,
      animations: true,
      screenReader: false,
    },
    performance: {
      fps: 60,
      memoryUsage: 15.5,
      cpuUsage: 25,
      renderTime: 45,
    },
    customization: {
      enabled: true,
      userPreferences: {},
      autoAdapt: true,
      learning: true,
    },
    lastInteraction: new Date(),
    totalInteractions: 0,
    uiVersion: '1.0.0',
  });

  const [uiConfig, setUIConfig] = useState<AdvancedUIConfig>({
    adaptiveUI: true,
    responsiveDesign: true,
    accessibilityMode: true,
    performanceMode: false,
    animationEnabled: true,
    realTimeUpdates: true,
    autoOptimization: true,
    userLearning: true,
    contextAwareness: true,
    gestureSupport: true,
    voiceControl: false,
    hapticFeedback: true,
    darkMode: true,
    highContrast: false,
    reducedMotion: false,
  });

  const performanceIntervalRef = useRef<any>(null);

  // Inicjalizacja
  useEffect(() => {
    loadUIState();
    loadUIConfig();
    startPerformanceMonitoring();
    updateScreenSize();
  }, []);

  // Zapisywanie stanu UI
  const saveUIState = async () => {
    try {
      await SecureStore.setItemAsync('wera_ui_state', JSON.stringify(uiState));
    } catch (error) {
      console.error('Błąd zapisywania stanu UI:', error);
    }
  };

  // Ładowanie stanu UI
  const loadUIState = async () => {
    try {
      const saved = await SecureStore.getItemAsync('wera_ui_state');
      if (saved) {
        const data = JSON.parse(saved);
        setUIState(prev => ({
          ...prev,
          ...data,
          components: data.components || prev.components,
          layouts: data.layouts || prev.layouts,
          themes: data.themes || prev.themes,
          animations: data.animations || prev.animations,
          interactions: data.interactions || prev.interactions,
        }));
      }
    } catch (error) {
      console.error('Błąd ładowania stanu UI:', error);
    }
  };

  // Ładowanie konfiguracji
  const loadUIConfig = async () => {
    try {
      const saved = await SecureStore.getItemAsync('wera_ui_config');
      if (saved) {
        setUIConfig(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Błąd ładowania konfiguracji UI:', error);
    }
  };

  // Aktualizacja rozmiaru ekranu
  const updateScreenSize = () => {
    const { width, height } = Dimensions.get('window');
    const deviceType = width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';
    const orientation = width > height ? 'landscape' : 'portrait';

    setUIState(prev => ({
      ...prev,
      screenSize: { width, height },
      deviceType,
      orientation,
    }));
  };

  // Tworzenie komponentu (funkcja 172)
  const createComponent = async (component: Omit<UIComponent, 'id' | 'lastUsed' | 'usageCount' | 'performance'>) => {
    const newComponent: UIComponent = {
      ...component,
      id: Date.now().toString(),
      lastUsed: new Date(),
      usageCount: 0,
      performance: {
        renderTime: 50,
        memoryUsage: 1.0,
        cpuUsage: 10,
      },
    };

    setUIState(prev => ({
      ...prev,
      components: [...prev.components, newComponent],
    }));

    await saveUIState();
  };

  // Aktualizacja komponentu
  const updateComponent = async (componentId: string, updates: Partial<UIComponent>) => {
    setUIState(prev => ({
      ...prev,
      components: prev.components.map(component =>
        component.id === componentId
          ? { ...component, ...updates, lastUsed: new Date() }
          : component
      ),
    }));

    await saveUIState();
  };

  // Usuwanie komponentu
  const deleteComponent = async (componentId: string) => {
    setUIState(prev => ({
      ...prev,
      components: prev.components.filter(component => component.id !== componentId),
    }));

    await saveUIState();
  };

  // Tworzenie układu
  const createLayout = async (layout: Omit<UILayout, 'id' | 'lastModified' | 'version'>) => {
    const newLayout: UILayout = {
      ...layout,
      id: Date.now().toString(),
      lastModified: new Date(),
      version: '1.0.0',
    };

    setUIState(prev => ({
      ...prev,
      layouts: [...prev.layouts, newLayout],
    }));

    await saveUIState();
  };

  // Aktualizacja układu
  const updateLayout = async (layoutId: string, updates: Partial<UILayout>) => {
    setUIState(prev => ({
      ...prev,
      layouts: prev.layouts.map(layout =>
        layout.id === layoutId
          ? { ...layout, ...updates, lastModified: new Date() }
          : layout
      ),
    }));

    await saveUIState();
  };

  // Tworzenie motywu
  const createTheme = async (theme: Omit<UITheme, 'id' | 'lastUsed'>) => {
    const newTheme: UITheme = {
      ...theme,
      id: Date.now().toString(),
      lastUsed: new Date(),
    };

    setUIState(prev => ({
      ...prev,
      themes: [...prev.themes, newTheme],
    }));

    await saveUIState();
  };

  // Aktywacja motywu
  const activateTheme = async (themeId: string) => {
    setUIState(prev => ({
      ...prev,
      themes: prev.themes.map(theme => ({
        ...theme,
        isActive: theme.id === themeId,
        lastUsed: theme.id === themeId ? new Date() : theme.lastUsed,
      })),
      activeTheme: themeId,
    }));

    await saveUIState();
  };

  // Tworzenie animacji
  const createAnimation = async (animation: Omit<UIAnimation, 'id'>) => {
    const newAnimation: UIAnimation = {
      ...animation,
      id: Date.now().toString(),
    };

    setUIState(prev => ({
      ...prev,
      animations: [...prev.animations, newAnimation],
    }));

    await saveUIState();
  };

  // Wywołanie animacji
  const triggerAnimation = async (animationId: string, target: string) => {
    const animation = uiState.animations.find(a => a.id === animationId);
    if (!animation || !animation.isActive) return;

    // Symulacja wywołania animacji
    console.log(`Animacja ${animation.name} wywołana na ${target}`);

    // Aktualizacja wydajności
    setUIState(prev => ({
      ...prev,
      performance: {
        ...prev.performance,
        cpuUsage: Math.min(100, prev.performance.cpuUsage + animation.performance.memoryImpact),
      },
    }));
  };

  // Rejestrowanie interakcji (funkcja 173)
  const recordInteraction = async (interaction: Omit<UIInteraction, 'id' | 'timestamp'>) => {
    const uiInteraction: UIInteraction = {
      ...interaction,
      id: Date.now().toString(),
      timestamp: new Date(),
    };

    setUIState(prev => ({
      ...prev,
      interactions: [...prev.interactions, uiInteraction],
      lastInteraction: new Date(),
      totalInteractions: prev.totalInteractions + 1,
    }));

    // Aktualizacja statystyk komponentu
    setUIState(prev => ({
      ...prev,
      components: prev.components.map(component =>
        component.id === interaction.target
          ? {
              ...component,
              lastUsed: new Date(),
              usageCount: component.usageCount + 1,
            }
          : component
      ),
    }));

    await saveUIState();
  };

  // Aktualizacja konfiguracji UI
  const updateUIConfig = async (config: Partial<AdvancedUIConfig>) => {
    setUIConfig(prev => ({ ...prev, ...config }));
    await SecureStore.setItemAsync('wera_ui_config', JSON.stringify({ ...uiConfig, ...config }));
  };

  // Optymalizacja wydajności
  const optimizePerformance = async () => {
    // Symulacja optymalizacji
    const optimizedComponents = uiState.components.map(component => ({
      ...component,
      performance: {
        renderTime: Math.max(10, component.performance.renderTime * 0.8),
        memoryUsage: Math.max(0.1, component.performance.memoryUsage * 0.9),
        cpuUsage: Math.max(1, component.performance.cpuUsage * 0.85),
      },
    }));

    setUIState(prev => ({
      ...prev,
      components: optimizedComponents,
      performance: {
        ...prev.performance,
        renderTime: Math.max(10, prev.performance.renderTime * 0.8),
        memoryUsage: Math.max(1, prev.performance.memoryUsage * 0.9),
        cpuUsage: Math.max(5, prev.performance.cpuUsage * 0.85),
      },
    }));

    await saveUIState();
  };

  // Rozpoczęcie monitorowania wydajności
  const startPerformanceMonitoring = () => {
    if (performanceIntervalRef.current) return;

    performanceIntervalRef.current = setInterval(() => {
      // Symulacja aktualizacji wydajności
      setUIState(prev => ({
        ...prev,
        performance: {
          fps: 55 + Math.random() * 10,
          memoryUsage: 15 + Math.random() * 5,
          cpuUsage: 20 + Math.random() * 15,
          renderTime: 40 + Math.random() * 20,
        },
      }));
    }, 5000); // Co 5 sekund
  };

  // Statystyki UI
  const getUIStats = () => {
    const totalComponents = uiState.components.length;
    const activeComponents = uiState.components.filter(c => c.properties.visible).length;
    const totalThemes = uiState.themes.length;
    const totalAnimations = uiState.animations.length;
    const recentInteractions = uiState.interactions.filter(i => 
      Date.now() - i.timestamp.getTime() < 24 * 60 * 60 * 1000
    ).length;

    const componentStats = uiState.components.reduce((acc, component) => {
      acc[component.id] = {
        usageCount: component.usageCount,
        renderTime: component.performance.renderTime,
        memoryUsage: component.performance.memoryUsage,
        isVisible: component.properties.visible,
      };
      return acc;
    }, {} as Record<string, any>);

    return {
      totalComponents,
      activeComponents,
      totalThemes,
      totalAnimations,
      totalInteractions: uiState.totalInteractions,
      recentInteractions,
      activeTheme: uiState.activeTheme,
      activeLayout: uiState.activeLayout,
      deviceType: uiState.deviceType,
      orientation: uiState.orientation,
      performance: uiState.performance,
      accessibility: uiState.accessibility,
      customization: uiState.customization,
      componentStats,
      lastInteraction: uiState.lastInteraction,
      uiVersion: uiState.uiVersion,
    };
  };

  // Automatyczne zapisywanie
  useEffect(() => {
    if (uiState.components.length > 0) {
      saveUIState();
    }
  }, [uiState.components, uiState.themes, uiState.interactions]);

  // Czyszczenie interwału
  useEffect(() => {
    return () => {
      if (performanceIntervalRef.current) {
        clearInterval(performanceIntervalRef.current);
      }
    };
  }, []);

  const value: AdvancedUIContextType = {
    uiState,
    uiConfig,
    createComponent,
    updateComponent,
    deleteComponent,
    createLayout,
    updateLayout,
    createTheme,
    activateTheme,
    createAnimation,
    triggerAnimation,
    recordInteraction,
    updateUIConfig,
    optimizePerformance,
    getUIStats,
    saveUIState,
    loadUIState,
  };

  return (
    <AdvancedUIContext.Provider value={value}>
      {children}
    </AdvancedUIContext.Provider>
  );
}; 