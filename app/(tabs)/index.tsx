import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, Divider, List } from 'react-native-paper';
import { useFasten } from '@/hooks/useFasten';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const { fastenDomain } = useFasten();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        <View style={styles.content}>
          <Card style={styles.welcomeCard}>
            <Card.Content>
              <Text variant="titleLarge">Welcome to Fasten</Text>
              <Text variant="bodyMedium" style={styles.welcomeText}>
                Your secure health data platform
              </Text>
            </Card.Content>
          </Card>

          <Text variant="titleMedium" style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.quickActions}>
            <Card style={styles.actionCard}>
              <Card.Content>
                <Text variant="titleMedium">Ask AI</Text>
                <Text variant="bodySmall">Get answers about your health data</Text>
              </Card.Content>
              <Card.Actions>
                <Button>Open</Button>
              </Card.Actions>
            </Card>
            
            <Card style={styles.actionCard}>
              <Card.Content>
                <Text variant="titleMedium">Records</Text>
                <Text variant="bodySmall">View your health records</Text>
              </Card.Content>
              <Card.Actions>
                <Button>Open</Button>
              </Card.Actions>
            </Card>
            
            <Card style={styles.actionCard}>
              <Card.Content>
                <Text variant="titleMedium">Sharing</Text>
                <Text variant="bodySmall">Manage data sharing</Text>
              </Card.Content>
              <Card.Actions>
                <Button>Open</Button>
              </Card.Actions>
            </Card>
          </View>

          <Text variant="titleMedium" style={styles.sectionTitle}>Recent Activity</Text>
          
          <Card>
            <Card.Content>
              <List.Item
                title="Login from Mobile App"
                description="Just now"
                left={props => <List.Icon {...props} icon="login" />}
              />
              <Divider />
              <List.Item
                title="Domain Connected"
                description={fastenDomain}
                left={props => <List.Icon {...props} icon="link" />}
              />
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  welcomeCard: {
    marginBottom: 24,
  },
  welcomeText: {
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 16,
    marginTop: 8,
  },
  quickActions: {
    marginBottom: 24,
  },
  actionCard: {
    marginBottom: 12,
  },
});
