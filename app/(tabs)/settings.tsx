import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, List, Divider, Button, Card, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFasten } from '@/hooks/useFasten';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const { fastenDomain, setFastenDomain, authToken, signOut, llmDomain, setLlmDomain } = useFasten();
  const router = useRouter();
  const [isResetting, setIsResetting] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [newLlmDomain, setNewLlmDomain] = useState('');
  const [showDomainInput, setShowDomainInput] = useState(false);
  const [showLlmDomainInput, setShowLlmDomainInput] = useState(false);

  const handleResetDomain = () => {
    Alert.alert(
      'Reset Domain',
      'Are you sure you want to reset your domain? This will sign you out and clear all settings.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            try {
              // Clear both domains and sign out
              await setFastenDomain('');
              await setLlmDomain('');
              await signOut();
              router.replace('/auth/domain');
            } catch (error) {
              console.error('Error resetting domain:', error);
              Alert.alert('Error', 'Failed to reset domain. Please try again.');
            } finally {
              setIsResetting(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleUpdateDomain = async () => {
    if (!newDomain.trim()) {
      Alert.alert('Error', 'Please enter a valid domain');
      return;
    }

    try {
      const formattedDomain = newDomain.startsWith('http') ? newDomain : `https://${newDomain}`;
      await setFastenDomain(formattedDomain);
      setShowDomainInput(false);
      setNewDomain('');
      Alert.alert('Success', 'Domain updated successfully');
    } catch (error) {
      console.error('Error updating domain:', error);
      Alert.alert('Error', 'Failed to update domain. Please try again.');
    }
  };

  const handleUpdateLlmDomain = async () => {
    if (!newLlmDomain.trim()) {
      Alert.alert('Error', 'Please enter a valid LLM domain');
      return;
    }

    try {
      const formattedDomain = newLlmDomain.startsWith('http') ? newLlmDomain : `https://${newLlmDomain}`;
      await setLlmDomain(formattedDomain);
      setShowLlmDomainInput(false);
      setNewLlmDomain('');
      Alert.alert('Success', 'LLM Domain updated successfully');
    } catch (error) {
      console.error('Error updating LLM domain:', error);
      Alert.alert('Error', 'Failed to update LLM domain. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Account</Text>
            
            {authToken ? (
              <Button
                mode="outlined"
                onPress={signOut}
                style={styles.button}
              >
                Sign Out
              </Button>
            ) : (
              <Button
                mode="outlined"
                onPress={() => router.push('/auth/login')}
                style={styles.button}
              >
                Sign In
              </Button>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Domain Settings</Text>
            
            <List.Item
              title="Current Domain"
              description={fastenDomain || 'Not set'}
              right={props => (
                <Button
                  mode="text"
                  onPress={() => {
                    setShowDomainInput(!showDomainInput);
                    setNewDomain('');
                  }}
                >
                  {showDomainInput ? 'Cancel' : 'Change'}
                </Button>
              )}
            />

            {showDomainInput && (
              <View style={styles.inputContainer}>
                <TextInput
                  label="New Domain"
                  value={newDomain}
                  onChangeText={setNewDomain}
                  mode="outlined"
                  style={styles.input}
                  placeholder="https://your-domain.com"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Button
                  mode="contained"
                  onPress={handleUpdateDomain}
                  style={styles.updateButton}
                >
                  Update
                </Button>
              </View>
            )}

            <Divider style={styles.divider} />

            <List.Item
              title="LLM Domain"
              description={llmDomain || 'Not set'}
              right={props => (
                <Button
                  mode="text"
                  onPress={() => {
                    setShowLlmDomainInput(!showLlmDomainInput);
                    setNewLlmDomain('');
                  }}
                >
                  {showLlmDomainInput ? 'Cancel' : 'Change'}
                </Button>
              )}
            />

            {showLlmDomainInput && (
              <View style={styles.inputContainer}>
                <TextInput
                  label="New LLM Domain"
                  value={newLlmDomain}
                  onChangeText={setNewLlmDomain}
                  mode="outlined"
                  style={styles.input}
                  placeholder="https://your-llm-domain.com"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Button
                  mode="contained"
                  onPress={handleUpdateLlmDomain}
                  style={styles.updateButton}
                >
                  Update
                </Button>
              </View>
            )}

            <Divider style={styles.divider} />

            <Button
              mode="outlined"
              onPress={handleResetDomain}
              loading={isResetting}
              disabled={isResetting}
              style={[styles.button, styles.resetButton]}
              textColor="#f44336"
            >
              Reset Domain
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>About</Text>
            <Text variant="bodyMedium">Fasten Health App</Text>
            <Text variant="bodySmall">Version 1.0.0</Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  resetButton: {
    borderColor: '#f44336',
  },
  divider: {
    marginVertical: 16,
  },
  inputContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
  },
  updateButton: {
    alignSelf: 'flex-end',
  },
}); 