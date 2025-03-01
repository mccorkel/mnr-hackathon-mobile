import React from 'react';
import { View, StyleSheet, Alert, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Button, Text, List, Divider, Appbar } from 'react-native-paper';
import { useFasten } from '@/hooks/useFasten';

export default function SettingsScreen() {
  const { fastenDomain, setFastenDomain, signOut } = useFasten();

  const handleResetDomain = () => {
    Alert.alert(
      'Reset Domain',
      'Are you sure you want to reset your Fasten domain? You will need to enter it again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            try {
              setFastenDomain('');
            } catch (error) {
              console.error('Error resetting domain:', error);
              Alert.alert('Error', 'Failed to reset domain. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Appbar.Header>
        <Appbar.Content title="Settings" />
      </Appbar.Header>
      
      <View style={styles.container}>
        <List.Section>
          <List.Subheader>Account</List.Subheader>
          <List.Item 
            title="Sign Out" 
            left={props => <List.Icon {...props} icon="logout" />}
            onPress={handleSignOut}
          />
          <Divider />
          
          <List.Subheader>Domain Settings</List.Subheader>
          <List.Item 
            title="Current Domain" 
            description={fastenDomain || 'Not set'} 
            descriptionNumberOfLines={3}
            descriptionStyle={styles.domainText}
          />
          <Divider />
          <List.Item 
            title="Reset Domain" 
            left={props => <List.Icon {...props} icon="refresh" />}
            onPress={handleResetDomain}
          />
        </List.Section>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  domainText: {
    flexWrap: 'wrap',
    marginTop: 4,
  }
}); 