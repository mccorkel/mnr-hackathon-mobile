import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert, SafeAreaView, StatusBar as RNStatusBar, ScrollView } from 'react-native';
import { TextInput, Button, Text, Appbar, ActivityIndicator } from 'react-native-paper';
import { useFasten } from '../_layout';
import { StatusBar } from 'expo-status-bar';
import TigerCareLogo from '../../components/TigerCareLogo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

// Key for storing username in AsyncStorage - must match the one in _layout.tsx
const USERNAME_STORAGE_KEY = 'fasten_username';
const FASTEN_DOMAIN_KEY = 'fasten_domain_url';
const AUTH_TOKEN_KEY = 'fasten_auth_token';

// Define a type for the API response data
interface ApiResponse {
  data?: string;
  message?: string;
  token?: string;
  access_token?: string;
}

export default function LoginScreen() {
  const { fastenDomain, setFastenDomain, setAuthToken } = useFasten();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [showDomainInput, setShowDomainInput] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  // Registration form state
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const router = useRouter();

  const handleChangeDomain = async () => {
    if (!newDomain.trim()) {
      setError('Please enter a domain');
      return;
    }

    try {
      let formattedDomain = newDomain.trim();
      if (!formattedDomain.startsWith('http://') && !formattedDomain.startsWith('https://')) {
        formattedDomain = 'https://' + formattedDomain;
      }

      // Clear all storage first
      await AsyncStorage.clear();

      // Save the new domain
      await AsyncStorage.setItem(FASTEN_DOMAIN_KEY, formattedDomain);
      
      // Update state
      setFastenDomain(formattedDomain);
      setAuthToken(null);
      setNewDomain('');
      setShowDomainInput(false);
      setDebugInfo(`Domain changed to: ${formattedDomain}`);

      // Force a complete reload by going back to domain screen
      router.replace('/auth/domain');
    } catch (error) {
      const domainError = error as Error;
      setError(`Failed to change domain: ${domainError.message}`);
      setDebugInfo(prev => `${prev}\nError: ${domainError.message}`);
    }
  };

  const handleForceSetDomain = async () => {
    const forcedDomain = 'https://77649bc796b2.ngrok.app';
    try {
      // Clear storage and set new domain
      await AsyncStorage.clear();
      await AsyncStorage.setItem(FASTEN_DOMAIN_KEY, forcedDomain);
      
      // Update state directly
      setFastenDomain(forcedDomain);
      setAuthToken(null);
      setNewDomain('');
      setShowDomainInput(false);
      setDebugInfo(`Forced domain change to: ${forcedDomain}`);
      
      // No redirect - stay on current screen
    } catch (error) {
      const domainError = error as Error;
      setError(`Failed to force set domain: ${domainError.message}`);
      setDebugInfo(prev => `${prev}\nError: ${domainError.message}`);
    }
  };

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

  const handleAlternativeLogin = async () => {
    setIsSubmitting(true);
    setError('');
    setDebugInfo('Starting login attempt...');

    // Try multiple endpoint variations
    const endpoints = [
      '/api/auth/login',
      '/auth/login',
      '/api/auth/signin',
      '/auth/signin'
    ];

    for (const endpoint of endpoints) {
      try {
        const apiUrl = `${fastenDomain}${endpoint}`;
        setDebugInfo(prev => `${prev}\n\nTrying endpoint: ${apiUrl}`);
        
        const headers: HeadersInit = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest' // This helps prevent HTML redirects
        };
        
        if (fastenDomain) {
          headers['Origin'] = fastenDomain;
        }
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers,
          credentials: 'include',
          redirect: 'manual', // Don't follow redirects automatically
          body: JSON.stringify({
            username,
            password,
          }),
        });

        setDebugInfo(prev => `${prev}\nStatus: ${response.status} ${response.statusText}`);
        setDebugInfo(prev => `${prev}\nHeaders: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);
        
        // Check if we got redirected
        if (response.type === 'opaqueredirect' || response.status === 302) {
          setDebugInfo(prev => `${prev}\nGot redirect response - trying next endpoint`);
          continue;
        }

        // Get content type
        const contentType = response.headers.get('content-type');
        setDebugInfo(prev => `${prev}\nContent-Type: ${contentType}`);

        // Get full response for debugging
        const responseText = await response.text();
        setDebugInfo(prev => `${prev}\nResponse (first 500 chars):\n${responseText.substring(0, 500)}`);
        
        // If we got HTML, try next endpoint
        if (contentType?.includes('text/html')) {
          setDebugInfo(prev => `${prev}\nGot HTML response - trying next endpoint`);
          continue;
        }
        
        // Try to parse JSON
        try {
          const data = JSON.parse(responseText) as ApiResponse;
          
          if (response.ok) {
            const token = data.data || data.token || data.access_token;
            if (token) {
              setAuthToken(typeof token === 'string' ? token : JSON.stringify(token));
              await AsyncStorage.setItem(USERNAME_STORAGE_KEY, username);
              setDebugInfo(prev => `${prev}\nLogin successful with endpoint ${endpoint}!`);
              setIsSubmitting(false);
              return; // Success! Exit the function
            }
          }
          
          // If we get here, response was JSON but not successful
          setDebugInfo(prev => `${prev}\nGot JSON but no valid token - trying next endpoint`);
        } catch (parseError) {
          setDebugInfo(prev => `${prev}\nFailed to parse JSON - trying next endpoint`);
        }
      } catch (error) {
        const networkError = error as Error;
        setDebugInfo(prev => `${prev}\nNetwork error with ${endpoint}: ${networkError.message}`);
      }
    }

    // If we get here, all endpoints failed
    setError('Login failed. Could not connect to server. Please check the debug information.');
    setIsSubmitting(false);
  };

  const handleRegister = async () => {
    // Basic validation
    if (!regUsername.trim()) {
      setError('Please enter a username');
      return;
    }
    if (!regPassword.trim()) {
      setError('Please enter a password');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!regEmail.trim()) {
      setError('Please enter an email');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setDebugInfo('Attempting to register...');

    try {
      const apiUrl = `${fastenDomain}/auth/register`;
      setDebugInfo(prev => `${prev}\nRegistration URL: ${apiUrl}`);
      
      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };
      
      if (fastenDomain) {
        headers['Origin'] = fastenDomain;
      }
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          username: regUsername,
          password: regPassword,
          email: regEmail,
        }),
      });

      setDebugInfo(prev => `${prev}\nResponse status: ${response.status}`);
      
      const responseText = await response.text();
      setDebugInfo(prev => `${prev}\nResponse text: ${responseText.substring(0, 200)}...`);
      
      let data: ApiResponse;
      try {
        data = JSON.parse(responseText) as ApiResponse;
      } catch (error) {
        throw new Error('Failed to parse response as JSON');
      }

      if (response.ok) {
        setDebugInfo(prev => `${prev}\nRegistration successful!`);
        Alert.alert(
          'Success',
          'Account created successfully! Please sign in.',
          [{ text: 'OK', onPress: () => setShowRegistration(false) }]
        );
        // Clear registration form
        setRegUsername('');
        setRegPassword('');
        setRegConfirmPassword('');
        setRegEmail('');
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      const networkError = error as Error;
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
            <TigerCareLogo />
          </View>
          
          <View style={styles.formContainer}>
            <Text style={styles.title}>Sign In to TigerCare</Text>
            <Text style={styles.subtitle}>Enter your credentials to continue</Text>
            
            {showDomainInput ? (
              <>
                <TextInput
                  label="New Server URL"
                  value={newDomain}
                  onChangeText={text => {
                    setNewDomain(text);
                    setError('');
                  }}
                  placeholder="77649bc796b2.ngrok.app"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />
                <Button 
                  mode="contained" 
                  onPress={handleChangeDomain}
                  style={styles.button}
                  labelStyle={[styles.buttonText, { color: '#FFFFFF' }]}
                >
                  Connect to New Server
                </Button>
                <Button 
                  mode="contained" 
                  onPress={handleForceSetDomain}
                  style={[styles.button, { backgroundColor: '#5F4B8B' }]}
                  labelStyle={[styles.buttonText, { color: '#FFFFFF' }]}
                >
                  Force Set New Server
                </Button>
                <Button 
                  mode="outlined" 
                  onPress={() => setShowDomainInput(false)}
                  style={[styles.button, styles.altButton]}
                  labelStyle={styles.buttonText}
                >
                  Cancel
                </Button>
              </>
            ) : showRegistration ? (
              <>
                <TextInput
                  label="Username"
                  value={regUsername}
                  onChangeText={text => {
                    setRegUsername(text);
                    setError('');
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                  disabled={isSubmitting}
                />
                
                <TextInput
                  label="Email"
                  value={regEmail}
                  onChangeText={text => {
                    setRegEmail(text);
                    setError('');
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  style={styles.input}
                  disabled={isSubmitting}
                />
                
                <TextInput
                  label="Password"
                  value={regPassword}
                  onChangeText={text => {
                    setRegPassword(text);
                    setError('');
                  }}
                  secureTextEntry
                  style={styles.input}
                  disabled={isSubmitting}
                />
                
                <TextInput
                  label="Confirm Password"
                  value={regConfirmPassword}
                  onChangeText={text => {
                    setRegConfirmPassword(text);
                    setError('');
                  }}
                  secureTextEntry
                  style={styles.input}
                  disabled={isSubmitting}
                />
                
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                
                <Button 
                  mode="contained" 
                  onPress={handleRegister}
                  style={styles.button}
                  labelStyle={styles.buttonText}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  Create Account
                </Button>

                <Button 
                  mode="text" 
                  onPress={() => setShowRegistration(false)}
                  style={[styles.button, styles.linkButton]}
                  labelStyle={[styles.buttonText, styles.linkButtonText]}
                  disabled={isSubmitting}
                >
                  Back to Sign In
                </Button>
              </>
            ) : (
              <>
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
                  onPress={handleAlternativeLogin}
                  style={styles.button}
                  labelStyle={styles.buttonText}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  Sign In
                </Button>

                <Button 
                  mode="text" 
                  onPress={() => setShowRegistration(true)}
                  style={[styles.button, styles.linkButton]}
                  labelStyle={[styles.buttonText, styles.linkButtonText]}
                  disabled={isSubmitting}
                >
                  Create New Account
                </Button>

                <Button 
                  mode="text" 
                  onPress={() => setShowDomainInput(true)}
                  style={[styles.button, styles.linkButton]}
                  labelStyle={[styles.buttonText, styles.linkButtonText]}
                  disabled={isSubmitting}
                >
                  Change Server URL
                </Button>
              </>
            )}
            
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
    marginBottom: 20,
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#5F4B8B',
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
    color: '#FF7A5A',
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
    backgroundColor: '#FF7A5A',
  },
  altButton: {
    marginTop: 8,
    borderColor: '#FF7A5A',
    borderWidth: 2,
  },
  linkButton: {
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  altButtonText: {
    color: '#FF7A5A',
  },
  linkButtonText: {
    color: '#5F4B8B',
    textDecorationLine: 'underline',
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