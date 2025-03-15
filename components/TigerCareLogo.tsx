// components/TigerCareLogo.tsx
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

export default function TigerCareLogo() {
  return (
    <View style={styles.container}>
      <Text style={styles.logoText}>
        <Text style={styles.tiger}>Tiger</Text>
        <Text style={styles.care}>Care</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  tiger: {
    color: '#FF7A5A',
  },
  care: {
    color: '#5F4B8B',
  }
}); 