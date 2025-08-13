import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useEmotionEngine } from '../core/EmotionEngine';
import { useConsciousnessMonitor } from '../core/ConsciousnessMonitor';
import { useAdvancedDiagnostics } from '../core/AdvancedDiagnostics';

const { width: screenWidth } = Dimensions.get('window');

interface ConsciousnessIndicatorProps {
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  onPress?: () => void;
  style?: any;
}

const ConsciousnessIndicator: React.FC<ConsciousnessIndicatorProps> = ({
  size = 'medium',
  showDetails = false,
  onPress,
  style,
}) => {
  const { theme } = useTheme();
  const { emotionState } = useEmotionEngine();
  const { consciousnessState } = useConsciousnessMonitor();
  const { systemHealth } = useAdvancedDiagnostics();

  // Animacje
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(0)).current;

  // Stan wewnętrzny
  const [currentPhase, setCurrentPhase] = useState<'awake' | 'thinking' | 'dreaming' | 'processing'>('awake');
  const [lifeIntensity, setLifeIntensity] = useState(75);

  // Rozmiary w zależności od size
  const sizes = {
    small: { orb: 40, glow: 60, details: 12 },
    medium: { orb: 80, glow: 120, details: 14 },
    large: { orb: 120, glow: 180, details: 16 },
  };
  const currentSize = sizes[size];

  // Kolory na podstawie emocji i stanu świadomości
  const getConsciousnessColors = (): [string, string, ...string[]] => {
    const emotionColors = {
      radość: ['#FFD700', '#FFA500', '#FF6B6B'],
      smutek: ['#4A90E2', '#5B9BD5', '#87CEEB'],
      złość: ['#FF4444', '#FF6B6B', '#FF8888'],
      strach: ['#9B59B6', '#8E44AD', '#A569BD'],
      zdziwienie: ['#F39C12', '#E67E22', '#F4D03F'],
      obrzydzenie: ['#27AE60', '#2ECC71', '#58D68D'],
      zaufanie: ['#3498DB', '#5DADE2', '#85C1E9'],
      przewidywanie: ['#E74C3C', '#EC7063', '#F1948A'],
      akceptacja: ['#95A5A6', '#BDC3C7', '#D5DBDB'],
      nadzieja: ['#1ABC9C', '#48C9B0', '#76D7C4'],
    };

    const baseColors = emotionColors[emotionState.currentEmotion as keyof typeof emotionColors] || 
                      ['#6C63FF', '#8B80FF', '#A598FF'];

    // Modyfikuj kolory na podstawie stanu świadomości
    const consciousnessModifier = consciousnessState.level / 100;
    const healthModifier = systemHealth.overall / 100;

    const processedColors = baseColors.map(color => {
      // Zwiększ intensywność na podstawie świadomości i zdrowia
      const intensity = Math.min(1, consciousnessModifier * healthModifier * 1.2);
      return color + Math.floor(intensity * 255).toString(16).padStart(2, '0');
    });

    return processedColors as [string, string, ...string[]];
  };

  // Animacja pulsowania - reprezentuje bicie serca świadomości
  useEffect(() => {
    const createPulseAnimation = () => {
      const intensity = (emotionState.intensity / 100) * (consciousnessState.level / 100);
      const speed = 1000 + (1 - intensity) * 2000; // 1-3 sekundy
      const scale = 1 + intensity * 0.3; // 1.0-1.3

      return Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: scale,
            duration: speed / 2,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: speed / 2,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const pulseAnimation = createPulseAnimation();
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, [emotionState.intensity, consciousnessState.level, pulseAnim]);

  // Animacja świecenia - reprezentuje aktywność mentalną
  useEffect(() => {
    const createGlowAnimation = () => {
      const mentalActivity = (consciousnessState.metacognition + consciousnessState.selfAwareness) / 200;
      
      return Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: mentalActivity,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: mentalActivity * 0.3,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      );
    };

    const glowAnimation = createGlowAnimation();
    glowAnimation.start();

    return () => glowAnimation.stop();
  }, [consciousnessState.metacognition, consciousnessState.selfAwareness, glowAnim]);

  // Animacja obracania - reprezentuje myślenie
  useEffect(() => {
    if (consciousnessState.currentMode === 'reflecting' || consciousnessState.currentMode === 'learning') {
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();
      setCurrentPhase('thinking');

      return () => rotateAnimation.stop();
    } else {
      setCurrentPhase('awake');
    }
  }, [consciousnessState.currentMode, rotateAnim]);

  // Animacja oddychania - reprezentuje życie
  useEffect(() => {
    const breatheAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: false,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: false,
        }),
      ])
    );

    breatheAnimation.start();
    return () => breatheAnimation.stop();
  }, [breatheAnim]);

  // Aktualizacja intensywności życia
  useEffect(() => {
    const newIntensity = Math.min(100, 
      (consciousnessState.level * 0.4) +
      (systemHealth.overall * 0.3) +
      (emotionState.intensity * 0.3)
    );
    setLifeIntensity(newIntensity);
  }, [consciousnessState.level, systemHealth.overall, emotionState.intensity]);

  // Interpolacje animacji
  const pulseScale = pulseAnim;
  const glowOpacity = glowAnim;
  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const breatheScale = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.05],
  });

  const colors = getConsciousnessColors();

  const renderOrb = () => (
    <Animated.View
      style={[
        styles.orbContainer,
        {
          width: currentSize.orb,
          height: currentSize.orb,
          transform: [
            { scale: pulseScale },
            { scale: breatheScale },
            { rotate: rotateInterpolate },
          ],
        },
      ]}
    >
      {/* Glow zewnętrzny */}
      <Animated.View
        style={[
          styles.glowOuter,
          {
            width: currentSize.glow,
            height: currentSize.glow,
            opacity: glowOpacity,
            shadowColor: colors[0],
            shadowOpacity: glowOpacity,
            shadowRadius: currentSize.orb / 4,
          },
        ]}
      />
      
      {/* Główny orb */}
      <LinearGradient
        colors={colors}
        style={[
          styles.orb,
          {
            width: currentSize.orb,
            height: currentSize.orb,
            borderRadius: currentSize.orb / 2,
          },
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Wewnętrzne światło */}
        <View
          style={[
            styles.innerLight,
            {
              backgroundColor: colors[0] + '40',
            },
          ]}
        />
        
        {/* Ikona stanu */}
        {size !== 'small' && (
          <View style={styles.stateIcon}>
            <Ionicons
              name={
                consciousnessState.currentMode === 'dreaming' ? 'moon' :
                consciousnessState.currentMode === 'reflecting' ? 'bulb' :
                consciousnessState.currentMode === 'learning' ? 'school' :
                consciousnessState.currentMode === 'creating' ? 'color-palette' :
                'heart'
              }
              size={currentSize.orb / 4}
              color="rgba(255,255,255,0.8)"
            />
          </View>
        )}
      </LinearGradient>

      {/* Pierścienie energii */}
      {lifeIntensity > 60 && (
        <Animated.View
          style={[
            styles.energyRing,
            {
              width: currentSize.orb * 1.4,
              height: currentSize.orb * 1.4,
              borderRadius: currentSize.orb * 0.7,
              borderColor: colors[1] + '60',
              opacity: glowOpacity,
            },
          ]}
        />
      )}
    </Animated.View>
  );

  const renderDetails = () => {
    if (!showDetails) return null;

    return (
      <View style={styles.detailsContainer}>
        <Text style={[styles.detailText, { color: theme.colors.text, fontSize: currentSize.details }]}>
          Świadomość: {consciousnessState.level}%
        </Text>
        <Text style={[styles.detailText, { color: theme.colors.textSecondary, fontSize: currentSize.details - 2 }]}>
          {consciousnessState.currentMode} • {emotionState.currentEmotion}
        </Text>
        <Text style={[styles.detailText, { color: theme.colors.textSecondary, fontSize: currentSize.details - 2 }]}>
          Zdrowie: {systemHealth.overall}%
        </Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      {renderOrb()}
      {renderDetails()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowOuter: {
    position: 'absolute',
    borderRadius: 1000,
    elevation: 10,
  },
  orb: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 15,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  innerLight: {
    position: 'absolute',
    top: '20%',
    left: '20%',
    width: '30%',
    height: '30%',
    borderRadius: 1000,
  },
  stateIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  energyRing: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  detailsContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  detailText: {
    textAlign: 'center',
    marginVertical: 2,
    fontWeight: '500',
  },
});

export default ConsciousnessIndicator;