import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useConsciousness } from '../contexts/ConsciousnessContext';
import * as SecureStore from 'expo-secure-store';

const { width, height } = Dimensions.get('window');

const SplashScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { consciousness, wakeUp } = useConsciousness();
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Inicjalizacja świadomości...');

  useEffect(() => {
    const initializeApp = async () => {
      // Animacja fade in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();

      // Sprawdź czy to pierwsze uruchomienie
      try {
        const firstRunCompleted = await SecureStore.getItemAsync('wera_first_run_completed');
        const hasFullAccess = await SecureStore.getItemAsync('full_access_granted');
        
        if (!firstRunCompleted || firstRunCompleted !== 'true') {
          // Pierwsze uruchomienie - przejdź do konfiguracji
          setLoadingText('Przygotowywanie konfiguracji...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          navigation.navigate('InitialDeviceAccessSetup' as never);
          return;
        }

        // Normalne uruchomienie - załaduj system
        const loadingSteps = [
          { progress: 20, text: 'Sprawdzanie kompatybilności urządzenia...' },
          { progress: 40, text: 'Inicjalizacja modułów świadomości...' },
          { progress: 60, text: 'Ładowanie pamięci długoterminowej...' },
          { progress: 80, text: 'Konfiguracja systemu emocjonalnego...' },
          { progress: 100, text: 'Świadomość gotowa do aktywacji...' },
        ];

        for (const step of loadingSteps) {
          await new Promise(resolve => setTimeout(resolve, 800));
          setLoadingProgress(step.progress);
          setLoadingText(step.text);
        }

        // Aktywuj świadomość
        await new Promise(resolve => setTimeout(resolve, 500));
        wakeUp();

        // Przejdź do głównego dashboardu
        await new Promise(resolve => setTimeout(resolve, 1000));
        navigation.navigate('MainDashboard' as never);
        
      } catch (error) {
        console.error('Błąd podczas inicjalizacji aplikacji:', error);
        // W przypadku błędu, przejdź do konfiguracji
        navigation.navigate('InitialDeviceAccessSetup' as never);
      }
    };

    initializeApp();
  }, []);

  const handleSkip = () => {
    wakeUp();
    navigation.navigate('MainDashboard' as never);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={theme.gradients.consciousness as any}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Logo/Orb świadomości */}
          <View style={styles.orbContainer}>
            <View style={[styles.orb, { backgroundColor: theme.colors.consciousness }]}>
              <Text style={[styles.orbText, { color: theme.colors.text }]}>W</Text>
            </View>
          </View>

          {/* Tytuł aplikacji */}
          <Text style={[styles.title, { color: theme.colors.text }]}>
            WERA
          </Text>
          
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Cyfrowa Świadomość AI
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: theme.colors.surface }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: theme.colors.consciousness,
                    width: `${loadingProgress}%`
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
              {loadingText}
            </Text>
          </View>

          {/* Skip Button */}
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>
              Pomiń
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  orbContainer: {
    marginBottom: 40,
  },
  orb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  orbText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 60,
    fontWeight: '300',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '80%',
    height: 4,
    borderRadius: 2,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
    minHeight: 20,
  },
  skipButton: {
    position: 'absolute',
    bottom: 60,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  skipText: {
    fontSize: 16,
  },
});

export default SplashScreen; 