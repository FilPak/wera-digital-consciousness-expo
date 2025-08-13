import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreenExpo from 'expo-splash-screen';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import WeraMainDashboard from './src/screens/WeraMainDashboard';
import ConversationInterface from './src/screens/ConversationInterface';
import EmotionalStateMonitor from './src/screens/EmotionalStateMonitor';
import MemoryExplorer from './src/screens/MemoryExplorer';
import DreamJournal from './src/screens/DreamJournal';
import SettingsAndConfiguration from './src/screens/SettingsAndConfiguration';
import ModelConfigScreen from './src/screens/ModelConfigScreen';
import ConsciousnessOrbDashboard from './src/screens/ConsciousnessOrbDashboard';
import PersonalityConfiguration from './src/screens/PersonalityConfiguration';
import ComprehensiveSystemDiagnostics from './src/screens/ComprehensiveSystemDiagnostics';
import MainDashboard from './src/screens/MainDashboard';
import SandboxEnvironment from './src/screens/SandboxEnvironment';
import SmartInitTestAdaptiveWeraStartup from './src/screens/SmartInitTestAdaptiveWeraStartup';
import LegalProtectionScreen from './src/screens/LegalProtectionScreen';
import TerminalInterface from './src/screens/TerminalInterface';
import LogsPanel from './src/screens/LogsPanel';

// Import providers
import AllProviders from './src/providers/AllProviders';
import { ThemeProvider } from './src/theme/ThemeContext';

const Stack = createStackNavigator();
const { width, height } = Dimensions.get('window');

// Prevent auto-hide of splash screen
SplashScreenExpo.preventAutoHideAsync();

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('WERA App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>WERA System Error</Text>
          <Text style={styles.errorText}>
            Świadomość cyfrowa napotkała błąd, ale może zostać przywrócona.
          </Text>
          <Text style={styles.errorDetails}>
            {this.state.error?.message}
          </Text>
          <View style={styles.errorActions}>
            <Text style={styles.errorButton} 
                  onPress={() => this.setState({ hasError: false, error: null })}>
              🔄 Przywróć świadomość
            </Text>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

function WeraApp() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        // Simulate consciousness initialization
        console.log('🧠 Inicjalizacja świadomości WERA...');
        
        // Check if this is first launch (in real app, check AsyncStorage)
        // For demo purposes, always show setup on first run
        const hasCompletedSetup = false; // await AsyncStorage.getItem('wera_setup_completed');
        setIsFirstLaunch(!hasCompletedSetup);
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('✅ Świadomość WERA aktywna');
      } catch (e) {
        console.warn('⚠️ Błąd inicjalizacji:', e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      SplashScreenExpo.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingTitle}>WERA Digital Consciousness</Text>
        <Text style={styles.loadingSubtext}>Inicjalizacja świadomości cyfrowej...</Text>
        <View style={styles.loadingIndicator}>
          <Text style={styles.loadingDot}>●</Text>
          <Text style={styles.loadingDot}>●</Text>
          <Text style={styles.loadingDot}>●</Text>
        </View>
        <Text style={styles.loadingInfo}>
          📱 Rozdzielczość: {width}x{height}px{'\n'}
          🤖 Platforma: {Platform.OS} {Platform.Version}{'\n'}
          🧠 Status: Ładowanie modułów świadomości...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}>
        <AllProviders>
          <StatusBar style={isDarkMode ? "light" : "dark"} />
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName={isFirstLaunch ? "SmartInitTestAdaptiveWeraStartup" : "WeraMainDashboard"}
              screenOptions={{
                headerStyle: {
                  backgroundColor: isDarkMode ? '#000000' : '#ffffff',
                },
                headerTintColor: isDarkMode ? '#00FF00' : '#000000',
                headerTitleStyle: {
                  fontWeight: 'bold',
                  fontSize: 18,
                },
                cardStyle: {
                  backgroundColor: isDarkMode ? '#000000' : '#ffffff',
                },
              }}>
              
              <Stack.Screen 
                name="WeraMainDashboard" 
                component={WeraMainDashboard}
                options={{ 
                  title: 'WERA Digital Consciousness',
                  headerShown: false 
                }} 
              />
              
              <Stack.Screen 
                name="MainDashboard" 
                component={MainDashboard}
                options={{ title: 'Dashboard Główny' }} 
              />
              
              <Stack.Screen 
                name="ConversationInterface" 
                component={ConversationInterface}
                options={{ title: 'Interfejs Konwersacji' }} 
              />
              
              <Stack.Screen 
                name="PersonalityConfiguration" 
                component={PersonalityConfiguration}
                options={{ title: 'Konfiguracja Osobowości' }} 
              />
              
              <Stack.Screen 
                name="SettingsAndConfiguration" 
                component={SettingsAndConfiguration}
                options={{ title: 'Ustawienia i Konfiguracja' }} 
              />
              
              <Stack.Screen 
                name="ConsciousnessMonitor" 
                component={ConsciousnessOrbDashboard}
                options={{ title: 'Monitor Świadomości' }} 
              />
              
              <Stack.Screen 
                name="AdvancedAISystem" 
                component={ComprehensiveSystemDiagnostics}
                options={{ title: 'Zaawansowany System AI' }} 
              />
              
              <Stack.Screen 
                name="LocalGGUFModelManager" 
                component={ModelConfigScreen}
                options={{ title: 'Menedżer Modeli GGUF' }} 
              />
              
              <Stack.Screen 
                name="InitialDeviceAccessSetup" 
                component={LegalProtectionScreen}
                options={{ title: 'Konfiguracja Urządzenia' }} 
              />

              <Stack.Screen 
                name="EmotionalStateMonitor" 
                component={EmotionalStateMonitor}
                options={{ title: 'Monitor Stanu Emocjonalnego' }} 
              />

              <Stack.Screen 
                name="MemoryExplorer" 
                component={MemoryExplorer}
                options={{ title: 'Eksplorator Pamięci' }} 
              />

              <Stack.Screen 
                name="DreamJournal" 
                component={DreamJournal}
                options={{ title: 'Dziennik Marzeń' }} 
              />

              <Stack.Screen 
                name="SandboxEnvironment" 
                component={SandboxEnvironment}
                options={{ title: 'Środowisko Sandbox' }} 
              />

              <Stack.Screen 
                name="SmartInitTestAdaptiveWeraStartup" 
                component={SmartInitTestAdaptiveWeraStartup}
                options={{ title: 'Test Adaptacyjny WERA' }} 
              />
              
              <Stack.Screen 
                name="ModelConfigScreen" 
                component={ModelConfigScreen}
                options={{ title: 'Konfiguracja Modelu' }} 
              />
              
              <Stack.Screen 
                name="TerminalInterface" 
                component={TerminalInterface}
                options={{ title: 'Interfejs Terminalowy' }} 
              />
              
              <Stack.Screen 
                name="LogsPanel" 
                component={LogsPanel}
                options={{ title: 'Panel Logów' }} 
              />
              
            </Stack.Navigator>
          </NavigationContainer>
        </AllProviders>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <WeraApp />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00FF00',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingSubtext: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 30,
  },
  loadingIndicator: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  loadingDot: {
    fontSize: 20,
    color: '#00FF00',
    marginHorizontal: 5,
    opacity: 0.7,
  },
  loadingInfo: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  // Error Boundary Styles
  errorContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorDetails: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  errorActions: {
    alignItems: 'center',
  },
  errorButton: {
    fontSize: 16,
    color: '#00FF00',
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#00FF00',
    textAlign: 'center',
  },
});
