import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert, SafeAreaView, StatusBar as RNStatusBar, ScrollView } from 'react-native';
import { TextInput, Button, Text, Appbar } from 'react-native-paper';
import { useFasten } from '../_layout';
import { StatusBar } from 'expo-status-bar';
import TigerCareLogo from '../../components/TigerCareLogo';
import { useRouter } from 'expo-router';

export default function DomainScreen() {
  const { setFastenDomain } = useFasten();
  const [domain, setDomain] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const router = useRouter();

  const validateDomain = async (domainUrl: string): Promise<boolean> => {
    try {
      setDebugInfo(`Validating domain: ${domainUrl}`);
      
      // Try to fetch the root of the domain to see if it's reachable
      const response = await fetch(domainUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/json',
        },
      });
      
      setDebugInfo(prev => `${prev}\nResponse status: ${response.status}`);
      
      // If we get any response, consider it valid
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setDebugInfo(prev => `${prev}\nValidation error: ${errorMessage}`);
      return false;
    }
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!domain.trim()) {
      setError('Please enter a domain');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setDebugInfo('Processing domain...');

    try {
      // Format the domain (ensure it has https:// prefix)
      let formattedDomain = domain.trim();
      if (!formattedDomain.startsWith('http://') && !formattedDomain.startsWith('https://')) {
        formattedDomain = 'https://' + formattedDomain;
      }
      
      setDebugInfo(prev => `${prev}\nFormatted domain: ${formattedDomain}`);
      
      // Validate the domain
      const isValid = await validateDomain(formattedDomain);
      
      if (isValid) {
        setDebugInfo(prev => `${prev}\nDomain validation successful`);
        // Save the domain
        setFastenDomain(formattedDomain);
        
        // Router will automatically redirect to login screen due to the navigation logic in AuthenticatedLayout
      } else {
        setError('Could not connect to this domain. Please check the URL and try again.');
        setDebugInfo(prev => `${prev}\nDomain validation failed`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error saving domain:', error);
      setError(`Failed to save domain: ${errorMessage}`);
      setDebugInfo(prev => `${prev}\nException: ${errorMessage}`);
      Alert.alert('Error', 'Failed to save domain. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Skip validation and force set domain
  const handleForceSetDomain = () => {
    try {
      // Format the domain (ensure it has https:// prefix)
      let formattedDomain = domain.trim();
      if (!formattedDomain.startsWith('http://') && !formattedDomain.startsWith('https://')) {
        formattedDomain = 'https://' + formattedDomain;
      }
      
      setDebugInfo(`Forcing domain: ${formattedDomain}`);
      
      // Save the domain without validation
      setFastenDomain(formattedDomain);
      
      // Router will automatically redirect to login screen
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error forcing domain:', error);
      setError(`Failed to force domain: ${errorMessage}`);
      Alert.alert('Error', 'Failed to set domain. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      <ScrollView>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          
          <View style={styles.logoContainer}>
            <TigerCareLogo />
          </View>
          
          <View style={styles.formContainer}>
            <Text style={styles.title}>Welcome to TigerCare</Text>
            <Text style={styles.subtitle}>Enter your organization's TigerCare domain to continue</Text>
            
            <TextInput
              label="TigerCare Domain URL"
              value={domain}
              onChangeText={text => {
                setDomain(text);
                setError('');
              }}
              placeholder="0453-69-212-112-109.ngrok-free.app"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={styles.input}
              error={!!error}
              disabled={isSubmitting}
            />
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            <Button 
              mode="contained" 
              onPress={handleSubmit}
              style={styles.button}
              labelStyle={styles.buttonText}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Continue
            </Button>
            
            <Button 
              mode="outlined" 
              onPress={handleForceSetDomain}
              style={[styles.button, styles.altButton]}
              labelStyle={styles.buttonText}
              disabled={isSubmitting || !domain.trim()}
            >
              Skip Validation
            </Button>
            
            {/* Debug information section */}
            {debugInfo ? (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Information:</Text>
                <Text style={styles.debugText}>{debugInfo}</Text>
              </View>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
  altButton: {
    marginTop: 8,
    borderColor: '#0a7ea4',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugContainer: {
    marginTop: 24,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  debugTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  }
}); 