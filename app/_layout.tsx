import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Redirect, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Keys for storing values in AsyncStorage
const FASTEN_DOMAIN_KEY = 'fasten_domain_url';
const AUTH_TOKEN_KEY = 'fasten_auth_token';

// Create a memory fallback for AsyncStorage in case it's not available
let memoryStorage: { [key: string]: string } = {};

// Helper function to safely use AsyncStorage with fallback
const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.warn('AsyncStorage not available, using memory fallback');
      return memoryStorage[key] || null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.warn('AsyncStorage not available, using memory fallback');
      memoryStorage[key] = value;
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn('AsyncStorage not available, using memory fallback');
      delete memoryStorage[key];
    }
  }
};

// Create a context to share the domain and auth state
import { createContext, useContext } from 'react';

type FastenContextType = {
  fastenDomain: string | null;
  setFastenDomain: (domain: string) => void;
  authToken: string | null;
  setAuthToken: (token: string | null) => void;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
};

export const FastenContext = createContext<FastenContextType>({
  fastenDomain: null,
  setFastenDomain: () => {},
  authToken: null,
  setAuthToken: () => {},
  signOut: async () => {},
  refreshToken: async () => false,
});

// Custom hook to use the Fasten context
export const useFasten = () => useContext(FastenContext);

// Create a separate component for the authenticated routes
function AuthenticatedLayout() {
  const { fastenDomain, authToken } = useFasten();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  
  // Set navigation ready after first render
  useEffect(() => {
    setIsNavigationReady(true);
  }, []);
  
  // Handle navigation based on domain and auth status
  useEffect(() => {
    if (!isNavigationReady) return;
    
    const inAuthGroup = segments[0] === 'auth';
    
    if (!fastenDomain || fastenDomain === '') {
      // No domain set, go to domain input
      if (!inAuthGroup || segments[1] !== 'domain') {
        router.replace('/auth/domain');
      }
    } else if (!authToken) {
      // Domain set but no auth token, go to login
      if (!inAuthGroup || segments[1] !== 'login') {
        router.replace('/auth/login');
      }
    } else if (inAuthGroup) {
      // Both domain and auth token set, go to main app if in auth group
      router.replace('/');
    }
  }, [fastenDomain, authToken, segments, router, isNavigationReady]);
  
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth/domain" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [fastenDomain, setFastenDomain] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load the domain and auth token from storage when the app starts
  useEffect(() => {
    async function loadData() {
      try {
        const [domain, token] = await Promise.all([
          safeStorage.getItem(FASTEN_DOMAIN_KEY),
          safeStorage.getItem(AUTH_TOKEN_KEY)
        ]);
        
        setFastenDomain(domain);
        setAuthToken(token);
      } catch (error) {
        console.error('Failed to load data from storage', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);

  // Save the domain to storage when it changes
  useEffect(() => {
    async function saveDomain() {
      if (fastenDomain !== null) {
        try {
          await safeStorage.setItem(FASTEN_DOMAIN_KEY, fastenDomain);
        } catch (error) {
          console.error('Failed to save domain to storage', error);
        }
      }
    }
    
    if (!isLoading) {
      saveDomain();
    }
  }, [fastenDomain, isLoading]);

  // Save the auth token to storage when it changes
  useEffect(() => {
    async function saveToken() {
      if (authToken !== null) {
        try {
          await safeStorage.setItem(AUTH_TOKEN_KEY, authToken);
        } catch (error) {
          console.error('Failed to save auth token to storage', error);
        }
      } else if (authToken === null && !isLoading) {
        // If token is explicitly set to null (during logout), remove it from storage
        try {
          await safeStorage.removeItem(AUTH_TOKEN_KEY);
        } catch (error) {
          console.error('Failed to remove auth token from storage', error);
        }
      }
    }
    
    if (!isLoading) {
      saveToken();
    }
  }, [authToken, isLoading]);

  // Sign out function
  const signOut = async () => {
    setAuthToken(null);
  };

  // Token refresh function
  const refreshToken = async (): Promise<boolean> => {
    if (!fastenDomain) return false;
    
    try {
      console.log('Attempting to refresh token...');
      
      // Make a request to the refresh token endpoint
      const response = await fetch(`${fastenDomain}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          console.log('Token refreshed successfully');
          setAuthToken(data.token);
          return true;
        }
      }
      
      console.error('Failed to refresh token:', response.status);
      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  };

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (isLoading || !loaded) {
    return null; // Still loading
  }

  // Create Paper themes based on color scheme
  const paperTheme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  // Create a context provider to share the domain and auth state
  return (
    <FastenContext.Provider
      value={{
        fastenDomain,
        setFastenDomain: (domain) => setFastenDomain(domain),
        authToken,
        setAuthToken,
        signOut,
        refreshToken
      }}>
      <PaperProvider theme={paperTheme}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          {isLoading ? null : <AuthenticatedLayout />}
        </ThemeProvider>
      </PaperProvider>
    </FastenContext.Provider>
  );
}
