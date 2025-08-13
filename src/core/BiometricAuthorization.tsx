import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

interface BiometricAuthorizationProps {
  onAuthorize: () => void;
  onCancel: () => void;
}

const BiometricAuthorization: React.FC<BiometricAuthorizationProps> = ({ onAuthorize, onCancel }) => {
  const [authStatus, setAuthStatus] = useState<string>('Pending');

  const handleAuthorize = () => {
    setAuthStatus('Authorized');
    onAuthorize();
  };

  const handleCancel = () => {
    setAuthStatus('Cancelled');
    onCancel();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Biometric Authorization</Text>
      <Text style={styles.status}>Status: {authStatus}</Text>
      <Button title="Authorize" onPress={handleAuthorize} />
      <Button title="Cancel" onPress={handleCancel} />
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

export default BiometricAuthorization;