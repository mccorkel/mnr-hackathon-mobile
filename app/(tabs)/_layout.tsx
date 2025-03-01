import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, Alert, View, StyleSheet, Pressable } from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { useFasten } from '@/hooks/useFasten';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';

// Key for storing username in AsyncStorage
const USERNAME_STORAGE_KEY = 'fasten_username';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { fastenDomain, signOut } = useFasten();
  const router = useRouter();
  const [username, setUsername] = useState("User"); // Default username
  
  // Load username from storage when component mounts
  useEffect(() => {
    const loadUsername = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem(USERNAME_STORAGE_KEY);
        if (storedUsername) {
          setUsername(storedUsername);
        } else {
          // If no username is stored, we could extract it from the domain or use a default
          // For now, we'll use a placeholder
          setUsername("User");
        }
      } catch (error) {
        console.error('Failed to load username from storage', error);
      }
    };
    
    loadUsername();
  }, []);

  // Handle notification button press
  const handleNotifications = () => {
    Alert.alert(
      "Notifications",
      "You have no new notifications",
      [{ text: "OK" }]
    );
  };

  // Handle settings button press - navigate to settings screen
  const handleSettings = () => {
    router.push('/settings');
  };

  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colorScheme === 'dark' ? '#fff' : '#007AFF',
          tabBarInactiveTintColor: colorScheme === 'dark' ? '#888' : '#999',
          headerShown: true,
          headerTitle: '',
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: 'absolute',
              backgroundColor: colorScheme === 'dark' ? '#121212' : '#fff',
            },
            default: {
              backgroundColor: colorScheme === 'dark' ? '#121212' : '#fff',
            },
          }),
          headerLeft: () => (
            <View style={styles.userContainer}>
              <Ionicons 
                name="person-circle-outline" 
                size={24} 
                color={colorScheme === 'dark' ? '#fff' : '#007AFF'} 
                style={{ marginLeft: 16, marginRight: 8 }}
              />
              <Text style={{ 
                color: colorScheme === 'dark' ? '#fff' : '#000',
                fontWeight: '500'
              }}>
                {username}
              </Text>
            </View>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row' }}>
              <Ionicons 
                name="notifications-outline" 
                size={24} 
                color={colorScheme === 'dark' ? '#fff' : '#007AFF'} 
                style={{ marginRight: 16 }}
                onPress={handleNotifications}
              />
              <Pressable onPress={handleSettings} style={({ pressed }) => [
                { opacity: pressed ? 0.7 : 1 },
                { marginRight: 16 }
              ]}>
                <Ionicons 
                  name="settings-outline" 
                  size={24} 
                  color={colorScheme === 'dark' ? '#fff' : '#007AFF'} 
                />
              </Pressable>
            </View>
          ),
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            headerTitle: '',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="ask-ai"
          options={{
            title: 'Ask AI',
            headerTitle: '',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="records"
          options={{
            title: 'Records',
            headerTitle: '',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="file-document-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="sharing"
          options={{
            title: 'Sharing',
            headerTitle: '',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="share-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="insights"
          options={{
            title: 'Insights',
            headerTitle: '',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="analytics-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  }
});
