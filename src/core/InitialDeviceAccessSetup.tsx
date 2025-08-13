import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const InitialDeviceAccessSetup: React.FC = () => {
  const [accessGranted, setAccessGranted] = useState(false);

  const requestAccess = () => {
    // Simulate access request logic
    setAccessGranted(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {accessGranted
          ? 'Access has been granted. You can now proceed.'
          : 'Initial Device Access Setup is required.'}
      </Text>
      {!accessGranted && (
        <Button title="Grant Access" onPress={requestAccess} />
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

export default InitialDeviceAccessSetup;