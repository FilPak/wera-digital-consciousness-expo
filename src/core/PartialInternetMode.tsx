import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';

interface PartialInternetModeProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const PartialInternetMode: React.FC<PartialInternetModeProps> = ({ isEnabled, onToggle }) => {
  const [filterStatus, setFilterStatus] = useState<string>('Inactive');
  const [filterRules, setFilterRules] = useState<string[]>([]);

  const applyFilterRules = () => {
    if (isEnabled) {
      console.log('Applying filter rules:', filterRules);
      // Logic to apply internet filtering based on filterRules
    } else {
      console.log('Partial Internet Mode is inactive');
    }
  };

  useEffect(() => {
    setFilterStatus(isEnabled ? 'Active' : 'Inactive');
  }, [isEnabled]);

  useEffect(() => {
    applyFilterRules();
  }, [isEnabled, filterRules]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Partial Internet Mode</Text>
      <Text style={styles.status}>Status: {filterStatus}</Text>
      <Switch
        value={isEnabled}
        onValueChange={onToggle}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  status: {
    fontSize: 16,
    marginBottom: 10,
  },
});

export default PartialInternetMode;