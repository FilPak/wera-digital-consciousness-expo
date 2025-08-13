import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

interface RemoteBuildCommandProps {
  onBuildStart: () => void;
  onBuildCancel: () => void;
}

const RemoteBuildCommand: React.FC<RemoteBuildCommandProps> = ({ onBuildStart, onBuildCancel }) => {
  const [buildStatus, setBuildStatus] = useState<string>('Idle');

  const handleBuildStart = () => {
    setBuildStatus('Building...');
    onBuildStart();
  };

  const handleBuildCancel = () => {
    setBuildStatus('Cancelled');
    onBuildCancel();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Remote Build Command</Text>
      <Text style={styles.status}>Status: {buildStatus}</Text>
      <Button title="Start Build" onPress={handleBuildStart} />
      <Button title="Cancel Build" onPress={handleBuildCancel} />
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

export default RemoteBuildCommand;