import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useAdvancedAIModels } from '../core/AdvancedAIModels';
import RootShell from '../core/RootShell';
import { useLocalGGUFModelManager } from '../core/LocalGGUFModelManager';

const { width: screenWidth } = Dimensions.get('window');

interface ModelParameters {
  temperature: number;
  topP: number;
  topK: number;
  maxTokens: number;
  contextLength: number;
  repeatPenalty: number;
  presencePenalty: number;
  frequencyPenalty: number;
}

interface ParameterConfig {
  key: keyof ModelParameters;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

const PARAMETER_CONFIGS: ParameterConfig[] = [
  {
    key: 'temperature',
    label: 'Temperature',
    description: 'Kontroluje kreatywność. Niższe = bardziej przewidywalne.',
    min: 0.1,
    max: 2.0,
    step: 0.1,
  },
  {
    key: 'topP',
    label: 'Top P (Nucleus)',
    description: 'Próg prawdopodobieństwa dla wyboru słów.',
    min: 0.1,
    max: 1.0,
    step: 0.05,
  },
  {
    key: 'topK',
    label: 'Top K',
    description: 'Liczba najlepszych kandydatów do wyboru.',
    min: 1,
    max: 100,
    step: 5,
    unit: 'słów',
  },
  {
    key: 'maxTokens',
    label: 'Max Tokens',
    description: 'Maksymalna długość odpowiedzi.',
    min: 128,
    max: 4096,
    step: 128,
    unit: 'tokenów',
  },
  {
    key: 'contextLength',
    label: 'Context Length',
    description: 'Ile kontekstu model pamięta z poprzednich wiadomości.',
    min: 512,
    max: 8192,
    step: 256,
    unit: 'tokenów',
  },
  {
    key: 'repeatPenalty',
    label: 'Repeat Penalty',
    description: 'Kara za powtarzanie. Wyższe wartości = mniej powtórzeń.',
    min: 0.8,
    max: 1.5,
    step: 0.05,
  },
  {
    key: 'presencePenalty',
    label: 'Presence Penalty',
    description: 'Kara za używanie już użytych słów. Promuje różnorodność.',
    min: -2.0,
    max: 2.0,
    step: 0.1,
  },
  {
    key: 'frequencyPenalty',
    label: 'Frequency Penalty',
    description: 'Kara za częste używanie tych samych słów.',
    min: -2.0,
    max: 2.0,
    step: 0.1,
  },
];

const ModelConfigScreen: React.FC = () => {
  const { theme } = useTheme();
  const { aiState, updateModelConfig } = useAdvancedAIModels();
  const { currentModel, models } = useLocalGGUFModelManager();

  const [parameters, setParameters] = useState<ModelParameters>({
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    maxTokens: 2048,
    contextLength: 4096,
    repeatPenalty: 1.1,
    presencePenalty: 0.0,
    frequencyPenalty: 0.0,
  });

  const [selectedPreset, setSelectedPreset] = useState<string>('balanced');
  const [autoOptimize, setAutoOptimize] = useState(true);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [deviceCodename, setDeviceCodename] = useState<string>('');

  // Presety konfiguracji
  const presets = {
    creative: {
      name: 'Kreatywny',
      description: 'Wysokie temperature, bardziej losowe odpowiedzi',
      icon: 'color-palette-outline',
      parameters: {
        temperature: 1.2,
        topP: 0.95,
        topK: 80,
        maxTokens: 3072,
        contextLength: 6144,
        repeatPenalty: 1.05,
        presencePenalty: 0.5,
        frequencyPenalty: 0.3,
      },
    },
    balanced: {
      name: 'Zrównoważony',
      description: 'Optymalne ustawienia dla większości zastosowań',
      icon: 'balance-outline',
      parameters: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxTokens: 2048,
        contextLength: 4096,
        repeatPenalty: 1.1,
        presencePenalty: 0.0,
        frequencyPenalty: 0.0,
      },
    },
    precise: {
      name: 'Precyzyjny',
      description: 'Niskie temperature, bardziej deterministyczne',
      icon: 'target-outline',
      parameters: {
        temperature: 0.3,
        topP: 0.8,
        topK: 20,
        maxTokens: 1536,
        contextLength: 3072,
        repeatPenalty: 1.2,
        presencePenalty: -0.2,
        frequencyPenalty: -0.1,
      },
    },
    conversational: {
      name: 'Rozmowny',
      description: 'Optymalizowane do naturalnych rozmów',
      icon: 'chatbubbles-outline',
      parameters: {
        temperature: 0.8,
        topP: 0.92,
        topK: 50,
        maxTokens: 2560,
        contextLength: 5120,
        repeatPenalty: 1.08,
        presencePenalty: 0.2,
        frequencyPenalty: 0.1,
      },
    },
  };

  useEffect(() => {
    // Załaduj aktualne ustawienia modelu
    if (aiState.modelConfig) {
      setParameters({
        temperature: aiState.modelConfig.temperature,
        topP: aiState.modelConfig.topP,
        topK: aiState.modelConfig.topK,
        maxTokens: aiState.modelConfig.maxTokens,
        contextLength: aiState.modelConfig.maxContextLength,
        repeatPenalty: aiState.modelConfig.repeatPenalty,
        presencePenalty: 0.0, // Domyślne wartości jeśli nie ma w config
        frequencyPenalty: 0.0,
      });
      setAutoOptimize(aiState.modelConfig.autoOptimize);
    }
  }, [aiState.modelConfig]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const c = await RootShell.getDeviceCodename();
        if (mounted) setDeviceCodename(c);
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  const handleParameterChange = (key: keyof ModelParameters, value: number) => {
    setParameters(prev => ({ ...prev, [key]: value }));
    setUnsavedChanges(true);
  };

  const applyPreset = (presetKey: string) => {
    const preset = presets[presetKey as keyof typeof presets];
    if (preset) {
      setParameters(preset.parameters);
      setSelectedPreset(presetKey);
      setUnsavedChanges(true);
    }
  };

  const saveConfiguration = async () => {
    try {
      await updateModelConfig({
        temperature: parameters.temperature,
        topP: parameters.topP,
        topK: parameters.topK,
        maxTokens: parameters.maxTokens,
        maxContextLength: parameters.contextLength,
        repeatPenalty: parameters.repeatPenalty,
        autoOptimize,
      });

      setUnsavedChanges(false);
      Alert.alert('Sukces', 'Konfiguracja modelu została zapisana!');
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się zapisać konfiguracji.');
    }
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset ustawień',
      'Czy na pewno chcesz przywrócić domyślne ustawienia?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            applyPreset('balanced');
          },
        },
      ]
    );
  };

  const renderParameterSlider = (config: ParameterConfig) => {
    const currentValue = parameters[config.key];
    const percentage = ((currentValue - config.min) / (config.max - config.min)) * 100;

    const handleSliderChange = (event: any) => {
      const { locationX } = event.nativeEvent;
      const sliderWidth = 280; // Szerokość slidera
      const percentage = Math.max(0, Math.min(1, locationX / sliderWidth));
      const newValue = config.min + (config.max - config.min) * percentage;
      const roundedValue = Math.round(newValue * 100) / 100; // Zaokrąglij do 2 miejsc po przecinku
      handleParameterChange(config.key, roundedValue);
    };

    return (
      <View key={config.key} style={styles.parameterContainer}>
        <View style={styles.parameterHeader}>
          <Text style={[styles.parameterTitle, { color: theme.colors.text }]}>
            {config.label}
          </Text>
          <Text style={[styles.parameterValue, { color: theme.colors.primary }]}>
            {currentValue}
          </Text>
        </View>
        
        <Text style={[styles.parameterDescription, { color: theme.colors.textSecondary }]}>
          {config.description}
        </Text>

        <View style={styles.sliderContainer}>
          <TouchableOpacity
            style={[styles.slider, { backgroundColor: theme.colors.surface }]}
            onPress={handleSliderChange}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.sliderTrack,
                { 
                  width: `${percentage}%`,
                  backgroundColor: theme.colors.primary 
                }
              ]}
            />
            <View
              style={[
                styles.sliderThumb,
                { 
                  left: `${percentage}%`,
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.background,
                }
              ]}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.sliderLabels}>
          <Text style={[styles.sliderLabel, { color: theme.colors.textSecondary }]}>
            {config.min}
          </Text>
          <Text style={[styles.sliderProgress, { color: theme.colors.primary }]}>
            {currentValue}
          </Text>
          <Text style={[styles.sliderLabel, { color: theme.colors.textSecondary }]}>
            {config.max}
          </Text>
        </View>
      </View>
    );
  };

  const renderPresetButton = (presetKey: string) => {
    const preset = presets[presetKey as keyof typeof presets];
    const isSelected = selectedPreset === presetKey;

    return (
      <TouchableOpacity
        key={presetKey}
        style={[
          styles.presetButton,
          {
            backgroundColor: isSelected ? theme.colors.primary + '20' : theme.colors.surface,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          }
        ]}
        onPress={() => applyPreset(presetKey)}
      >
        <View style={styles.presetContent}>
          <Text style={styles.presetIcon}>
            {presetKey === 'creative' ? '🎨' : 
             presetKey === 'balanced' ? '⚖️' : 
             presetKey === 'precise' ? '🎯' : '💬'}
          </Text>
          <Text style={[
            styles.presetName,
            { color: isSelected ? theme.colors.primary : theme.colors.text }
          ]}>
            {preset.name}
          </Text>
        </View>
        
        <Text style={[styles.presetDescription, { color: theme.colors.textSecondary }]}>
          {preset.description}
        </Text>
        
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Konfiguracja Modelu AI
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Dostosuj parametry modelu do swoich potrzeb
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Sekcja presetów */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Szybkie Ustawienia
          </Text>
          <View style={styles.presetsGrid}>
            {Object.keys(presets).map(renderPresetButton)}
          </View>
        </View>

        {/* Sekcja ustawień zaawansowanych */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Automatyczna Optymalizacja
          </Text>
          <View style={[styles.settingRow, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                Auto-optymalizacja
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                Automatycznie dostosowuj parametry na podstawie wydajności
              </Text>
            </View>
            <Switch
              value={autoOptimize}
              onValueChange={setAutoOptimize}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '50' }}
              thumbColor={autoOptimize ? theme.colors.primary : theme.colors.textSecondary}
            />
          </View>
        </View>

        {/* Sekcja parametrów */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Parametry Modelu
          </Text>
          {PARAMETER_CONFIGS.map(renderParameterSlider)}
        </View>

        {/* Informacje o modelu */}
        {currentModel && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Aktualny Model
            </Text>
            <View style={[styles.modelInfo, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.modelInfoRow}>
                <Text style={[styles.modelInfoLabel, { color: theme.colors.textSecondary }]}>
                  Nazwa:
                </Text>
                <Text style={[styles.modelInfoValue, { color: theme.colors.text }]}>
                  {currentModel.name}
                </Text>
              </View>
              <View style={styles.modelInfoRow}>
                <Text style={[styles.modelInfoLabel, { color: theme.colors.textSecondary }]}>
                  Rozmiar:
                </Text>
                <Text style={[styles.modelInfoValue, { color: theme.colors.text }]}>
                  {(currentModel.size / (1024 * 1024 * 1024)).toFixed(1)} GB
                </Text>
              </View>
              <View style={styles.modelInfoRow}>
                <Text style={[styles.modelInfoLabel, { color: theme.colors.textSecondary }]}>
                  Wydajność:
                </Text>
                <Text style={[styles.modelInfoValue, { color: theme.colors.primary }]}>
                  {currentModel.performance?.tokensPerSecond?.toFixed(1) || 'N/A'} tok/s
                </Text>
              </View>
              {!!deviceCodename && (
                <View style={styles.modelInfoRow}>
                  <Text style={[styles.modelInfoLabel, { color: theme.colors.textSecondary }]}>
                    Kodowa nazwa urządzenia:
                  </Text>
                  <Text style={[styles.modelInfoValue, { color: theme.colors.text }]}>
                    {deviceCodename}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Przyciski akcji */}
      <View style={[styles.actionButtons, { borderTopColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
          onPress={resetToDefaults}
        >
          <Text style={styles.resetIcon}>🔄</Text>
          <Text style={[styles.secondaryButtonText, { color: theme.colors.textSecondary }]}>
            Resetuj
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            {
              backgroundColor: unsavedChanges ? theme.colors.primary : theme.colors.primary + '50',
              opacity: unsavedChanges ? 1 : 0.6,
            }
          ]}
          onPress={saveConfiguration}
          disabled={!unsavedChanges}
        >
          <Text style={styles.saveIcon}>💾</Text>
          <Text style={styles.primaryButtonText}>
            Zapisz Zmiany
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  presetButton: {
    width: (screenWidth - 60) / 2,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    position: 'relative',
  },
  presetContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  presetIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  presetName: {
    fontSize: 16,
    fontWeight: '600',
  },
  presetDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  checkmark: {
    fontSize: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 10,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  parameterContainer: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  parameterHeader: {
    marginBottom: 16,
  },
  parameterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  parameterValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  parameterDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 16,
  },
  sliderContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  slider: {
    width: 280,
    height: 8,
    borderRadius: 4,
    position: 'relative',
  },
  sliderTrack: {
    height: '100%',
    borderRadius: 4,
  },
  sliderThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: 'absolute',
    top: -8,
    borderWidth: 2,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    width: 280,
  },
  sliderLabel: {
    fontSize: 12,
  },
  sliderProgress: {
    fontSize: 12,
    fontWeight: '600',
  },
  modelInfo: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  modelInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modelInfoLabel: {
    fontSize: 14,
  },
  modelInfoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resetIcon: {
    fontSize: 20,
  },
  saveIcon: {
    fontSize: 20,
  },
});

export default ModelConfigScreen;