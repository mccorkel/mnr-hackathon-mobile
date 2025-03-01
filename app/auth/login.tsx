import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert, SafeAreaView, StatusBar as RNStatusBar, ScrollView } from 'react-native';
import { TextInput, Button, Text, Appbar, ActivityIndicator } from 'react-native-paper';
import { useFasten } from '../_layout';
import { StatusBar } from 'expo-status-bar';
import VitalSightLogo from '@/components/VitalSightLogo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Key for storing username in AsyncStorage - must match the one in _layout.tsx
const USERNAME_STORAGE_KEY = 'fasten_username';

// Define a type for the API response data
interface ApiResponse {
  data?: string;
  message?: string;
  token?: string;
  access_token?: string;
}

export default function LoginScreen() {
  const { fastenDomain, setAuthToken } = useFasten();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  const handleLogin = async () => {
    // Basic validation
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setDebugInfo('Attempting to login...');

    try {
      // Format the API URL with /api prefix
      const apiUrl = `${fastenDomain}/api/auth/signin`;
      setDebugInfo(prev => `${prev}\nAPI URL: ${apiUrl}`);
      
      // Make API request to login endpoint with exact headers from working request
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Accept-Language': 'en-US,en;q=0.5',
          'Content-Type': 'application/json',
          'Connection': 'keep-alive',
          'Origin': fastenDomain || '',  // Fix: Ensure Origin is never null
          'Referer': `${fastenDomain}/web/auth/signin`,
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      setDebugInfo(prev => `${prev}\nResponse status: ${response.status}`);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      setDebugInfo(prev => `${prev}\nContent-Type: ${contentType}`);
      
      // Get the response text first for debugging
      const responseText = await response.text();
      setDebugInfo(prev => `${prev}\nResponse text: ${responseText.substring(0, 200)}...`);
      
      // Try to parse as JSON
      let data: ApiResponse;
      try {
        data = JSON.parse(responseText) as ApiResponse;
        setDebugInfo(prev => `${prev}\nParsed JSON data: ${JSON.stringify(data).substring(0, 200)}...`);
      } catch (error) {
        const parseError = error as Error;
        setDebugInfo(prev => `${prev}\nJSON parse error: ${parseError.message}`);
        throw new Error(`Failed to parse response as JSON: ${parseError.message}`);
      }

      if (response.ok) {
        // Store the auth token
        if (data.data) {
          setAuthToken(data.data);
          
          // Save the username to AsyncStorage
          try {
            await AsyncStorage.setItem(USERNAME_STORAGE_KEY, username);
            setDebugInfo(prev => `${prev}\nUsername saved to storage`);
          } catch (error) {
            const storageError = error as Error;
            console.error('Failed to save username to storage', storageError);
            setDebugInfo(prev => `${prev}\nFailed to save username: ${storageError.message}`);
          }
          
          setDebugInfo(prev => `${prev}\nLogin successful!`);
        } else {
          setError('Invalid response format. Token not found in response.');
          setDebugInfo(prev => `${prev}\nError: Token not found in response`);
        }
      } else {
        // Handle error response
        setError(data.message || 'Login failed. Please check your credentials.');
        setDebugInfo(prev => `${prev}\nLogin failed with message: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      const networkError = error as Error;
      console.error('Error during login:', networkError);
      setError(`Network error: ${networkError.message}`);
      setDebugInfo(prev => `${prev}\nException: ${networkError.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Try alternative API endpoint with exact headers
  const handleAlternativeLogin = async () => {
    setIsSubmitting(true);
    setError('');
    setDebugInfo('Trying alternative endpoint...');

    try {
      // Try alternative endpoint
      const apiUrl = `${fastenDomain}/api/auth/login`;
      setDebugInfo(prev => `${prev}\nAlternative API URL: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Accept-Language': 'en-US,en;q=0.5',
          'Content-Type': 'application/json',
          'Connection': 'keep-alive',
          'Origin': fastenDomain || '',  // Fix: Ensure Origin is never null
          'Referer': `${fastenDomain}/web/auth/signin`,
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      setDebugInfo(prev => `${prev}\nResponse status: ${response.status}`);
      
      // Get the response text first for debugging
      const responseText = await response.text();
      setDebugInfo(prev => `${prev}\nResponse text: ${responseText.substring(0, 200)}...`);
      
      // Try to parse as JSON
      let data: ApiResponse;
      try {
        data = JSON.parse(responseText) as ApiResponse;
        setDebugInfo(prev => `${prev}\nParsed JSON data: ${JSON.stringify(data).substring(0, 200)}...`);
      } catch (error) {
        const parseError = error as Error;
        setDebugInfo(prev => `${prev}\nJSON parse error: ${parseError.message}`);
        throw new Error(`Failed to parse response as JSON: ${parseError.message}`);
      }

      if (response.ok) {
        // Look for token in different response formats
        const token = data.data || data.token || data.access_token || data;
        if (token) {
          setAuthToken(typeof token === 'string' ? token : JSON.stringify(token));
          setDebugInfo(prev => `${prev}\nAlternative login successful!`);
        } else {
          setError('Invalid response format. Token not found in response.');
          setDebugInfo(prev => `${prev}\nError: Token not found in response`);
        }
      } else {
        // Handle error response
        setError(data.message || 'Login failed. Please check your credentials.');
        setDebugInfo(prev => `${prev}\nLogin failed with message: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      const networkError = error as Error;
      console.error('Error during alternative login:', networkError);
      setError(`Network error: ${networkError.message}`);
      setDebugInfo(prev => `${prev}\nException: ${networkError.message}`);
    } finally {
      setIsSubmitting(false);
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
            <VitalSightLogo />
          </View>
          
          <View style={styles.formContainer}>
            <Text style={styles.title}>Sign In to VitalSight</Text>
            <Text style={styles.subtitle}>Enter your credentials to continue</Text>
            
            <TextInput
              label="Username"
              value={username}
              onChangeText={text => {
                setUsername(text);
                setError('');
              }}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              disabled={isSubmitting}
            />
            
            <TextInput
              label="Password"
              value={password}
              onChangeText={text => {
                setPassword(text);
                setError('');
              }}
              secureTextEntry
              style={styles.input}
              disabled={isSubmitting}
            />
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            <Button 
              mode="contained" 
              onPress={handleLogin}
              style={styles.button}
              labelStyle={styles.buttonText}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Sign In
            </Button>
            
            <Button 
              mode="outlined" 
              onPress={handleAlternativeLogin}
              style={[styles.button, styles.altButton]}
              labelStyle={styles.buttonText}
              disabled={isSubmitting}
            >
              Try Alternative Endpoint
            </Button>
            
            <Text style={styles.domainText}>
              Connected to: {fastenDomain}
            </Text>
            
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
  domainText: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
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