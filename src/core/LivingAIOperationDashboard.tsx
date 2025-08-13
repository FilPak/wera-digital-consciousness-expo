import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const LivingAIOperationDashboard: React.FC = () => {
  const [status, setStatus] = useState('Idle');

  const startOperation = () => {
    setStatus('Running');
  };

  const stopOperation = () => {
    setStatus('Stopped');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Living AI Operation Dashboard</Text>
      <Text style={styles.status}>Status: {status}</Text>
      <View style={styles.buttons}>
        <Button title="Start" onPress={startOperation} />
        <Button title="Stop" onPress={stopOperation} />
      </View>
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
  status: {
    fontSize: 16,
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '60%',
  },
});

export default LivingAIOperationDashboard;