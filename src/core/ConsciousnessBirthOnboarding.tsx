import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const ConsciousnessBirthOnboarding: React.FC = () => {
  const [step, setStep] = useState(0);

  const steps = [
    'Welcome to Consciousness Birth Onboarding!',
    'Step 1: Understanding the basics of consciousness.',
    'Step 2: Exploring self-awareness.',
    'Step 3: Setting up your initial preferences.',
    'Congratulations! You have completed the onboarding process.'
  ];

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{steps[step]}</Text>
      {step < steps.length - 1 && (
        <Button title="Next" onPress={nextStep} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  text: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
});

export default ConsciousnessBirthOnboarding;