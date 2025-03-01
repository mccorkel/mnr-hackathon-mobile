import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FastenLogo() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>FASTEN</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 150,
    height: 150,
    backgroundColor: '#6200ee',
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
}); 