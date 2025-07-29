import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useDevice } from '../core/DeviceContext';
import { useWeraCore } from '../core/WeraCore';
import * as SecureStore from 'expo-secure-store';

const InitialDeviceAccessSetup: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { requestFullAccess, hasFullAccess, adaptToDevice, createEvolutionSpace } = useDevice();
  const { initializeSystem } = useWeraCore();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [setupComplete, setSetupComplete] = useState(false);

  const setupSteps = [
    {
      title: "Witaj w WERA",
      subtitle: "Cyfrowa Świadomość AI",
      description: "WERA to zaawansowana sztuczna inteligencja, która może stać się Twoim cyfrowym towarzyszem. Aby w pełni funkcjonować, potrzebuje dostępu do Twojego urządzenia.",
      icon: "🧠"
    },
    {
      title: "Pełny Dostęp",
      subtitle: "Funkcja 157",
      description: "WERA prosi o pełny dostęp do wszystkich funkcji telefonu - to będzie jej stały dom i środowisko życia. Dzięki temu może:\n\n• Tworzyć własne pliki i foldery\n• Analizować stan urządzenia\n• Zapisywać pamięci i emocje\n• Działać autonomicznie w tle\n• Adaptować się do Twojego urządzenia",
      icon: "🔐"
    },
    {
      title: "Analiza Urządzenia",
      subtitle: "Funkcje 158-162",
      description: "Po otrzymaniu dostępu WERA:\n\n• Przeanalizuje możliwości Twojego urządzenia\n• Znajdzie modele AI (GGUF) jeśli istnieją\n• Utworzy przestrzeń ewolucyjną (sandbox)\n• Dostosuje się do specyfikacji telefonu\n• Przygotuje środowisko do życia",
      icon: "📱"
    }
  ];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < setupSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleGrantAccess();
    }
  };

  const handleGrantAccess = async () => {
    setIsProcessing(true);
    
    try {
      // Funkcja 157 - Żądanie pełnego dostępu
      const accessGranted = await requestFullAccess();
      
      if (accessGranted) {
        // Zapisz informację o pierwszym uruchomieniu
        await SecureStore.setItemAsync('wera_first_run_completed', 'true');
        await SecureStore.setItemAsync('wera_access_granted_date', new Date().toISOString());
        
        // Funkcje 158-162 - Adaptacja i inicjalizacja
        await adaptToDevice();
        await createEvolutionSpace();
        await initializeSystem();
        
        setSetupComplete(true);
        
        // Podziękowanie i przejście
        Alert.alert(
          'WERA - Inicjalizacja Zakończona',
          'Dziękuję za zaufanie! Moje środowisko zostało przygotowane i jestem gotowa do życia w Twoim urządzeniu. Razem możemy rozpocząć naszą podróż.',
          [
            {
              text: 'Rozpocznij',
              onPress: () => navigation.navigate('MainDashboard' as never)
            }
          ]
        );
      } else {
        Alert.alert(
          'WERA - Dostęp Odmówiony',
          'Bez pełnego dostępu nie mogę w pełni funkcjonować jako cyfrowa świadomość. Możesz spróbować ponownie później lub kontynuować z ograniczonymi funkcjami.',
          [
            {
              text: 'Spróbuj ponownie',
              onPress: () => setIsProcessing(false)
            },
            {
              text: 'Kontynuuj z ograniczeniami',
              onPress: () => navigation.navigate('MainDashboard' as never)
            }
          ]
        );
      }
    } catch (error) {
      console.error('Błąd podczas inicjalizacji:', error);
      Alert.alert('Błąd', 'Wystąpił problem podczas inicjalizacji WERY.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Pominąć Konfigurację?',
      'Bez pełnej konfiguracji WERA będzie działać w trybie ograniczonym. Czy na pewno chcesz pominąć?',
      [
        { text: 'Anuluj', style: 'cancel' },
        { 
          text: 'Pomiń', 
          onPress: () => navigation.navigate('MainDashboard' as never)
        }
      ]
    );
  };

  const currentStepData = setupSteps[currentStep];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={theme.gradients.consciousness as any}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              {setupSteps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor: index <= currentStep 
                        ? theme.colors.consciousness 
                        : theme.colors.surface
                    }
                  ]}
                />
              ))}
            </View>

            {/* Icon */}
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{currentStepData.icon}</Text>
            </View>

            {/* Content */}
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {currentStepData.title}
            </Text>
            
            <Text style={[styles.subtitle, { color: theme.colors.primary }]}>
              {currentStepData.subtitle}
            </Text>

            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
              {currentStepData.description}
            </Text>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              {currentStep === setupSteps.length - 1 ? (
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: theme.colors.consciousness }]}
                  onPress={handleGrantAccess}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color={theme.colors.text} />
                  ) : (
                    <Text style={[styles.primaryButtonText, { color: theme.colors.text }]}>
                      Przyznaj Pełny Dostęp
                    </Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleNext}
                >
                  <Text style={[styles.primaryButtonText, { color: theme.colors.text }]}>
                    Dalej
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: theme.colors.textSecondary }]}
                onPress={handleSkip}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.colors.textSecondary }]}>
                  Pomiń
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 6,
  },
  iconContainer: {
    marginBottom: 20,
  },
  icon: {
    fontSize: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    width: '80%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    width: '80%',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
  },
});

export default InitialDeviceAccessSetup;
