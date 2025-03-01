// components/VitalSightLogo.tsx
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path, Circle, Polyline } from 'react-native-svg';

export default function VitalSightLogo() {
  return (
    <View style={styles.container}>
      <Svg width="150" height="150" viewBox="0 0 200 200">
        {/* Outer eye shape with teal blue stroke */}
        <Path 
          d="M20,100 C50,40 150,40 180,100 C150,160 50,160 20,100 Z" 
          fill="#ffffff" 
          stroke="#0a7ea4" 
          strokeWidth="4"
        />
        {/* Pupil with primary teal blue fill */}
        <Circle cx="100" cy="100" r="25" fill="#0a7ea4" />
        {/* Heartbeat line using complementary lighter teal accent */}
        <Polyline 
          points="40,100 70,100 80,85 90,115 100,85 110,115 120,100 160,100" 
          fill="none" 
          stroke="#4fb3d9" 
          strokeWidth="4" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </Svg>
      {/* Use regular React Native Text instead of SvgText */}
      <Text style={styles.logoText}>VitalSight</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 150,
    height: 170,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0a7ea4',
    textAlign: 'center',
  }
}); 