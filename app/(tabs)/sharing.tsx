import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, List, Divider, Button, Switch } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SharingScreen() {
  const [activeSharing, setActiveSharing] = React.useState(true);
  const [researchSharing, setResearchSharing] = React.useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        <View style={styles.content}>
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="titleMedium">EMR Data Sharing</Text>
              <Text variant="bodySmall" style={styles.infoText}>
                Control how your health data is shared with healthcare providers and research organizations.
              </Text>
            </Card.Content>
          </Card>

          <Text variant="titleMedium" style={styles.sectionTitle}>Active Sharing</Text>
          
          <Card style={styles.card}>
            <Card.Content>
              <List.Item
                title="Dr. Sarah Johnson"
                description="Primary Care • Shared since Jan 2023"
                left={props => <List.Icon {...props} icon="account-outline" />}
                right={props => (
                  <View style={styles.switchContainer}>
                    <Switch value={activeSharing} onValueChange={setActiveSharing} />
                  </View>
                )}
              />
              <Divider />
              <List.Item
                title="City Hospital"
                description="All departments • Shared since Mar 2023"
                left={props => <List.Icon {...props} icon="hospital-building" />}
                right={props => (
                  <View style={styles.switchContainer}>
                    <Switch value={activeSharing} onValueChange={setActiveSharing} />
                  </View>
                )}
              />
            </Card.Content>
          </Card>

          <Text variant="titleMedium" style={styles.sectionTitle}>Research Participation</Text>
          
          <Card style={styles.card}>
            <Card.Content>
              <List.Item
                title="Medical Research Program"
                description="Anonymous data sharing for research purposes"
                left={props => <List.Icon {...props} icon="flask" />}
                right={props => (
                  <View style={styles.switchContainer}>
                    <Switch value={researchSharing} onValueChange={setResearchSharing} />
                  </View>
                )}
              />
            </Card.Content>
          </Card>

          <Text variant="titleMedium" style={styles.sectionTitle}>Sharing History</Text>
          
          <Card style={styles.card}>
            <Card.Content>
              <List.Item
                title="Data accessed by Dr. Johnson"
                description="Yesterday at 2:30 PM"
                left={props => <List.Icon {...props} icon="history" />}
              />
              <Divider />
              <List.Item
                title="Data accessed by City Hospital"
                description="May 10, 2023 at 10:15 AM"
                left={props => <List.Icon {...props} icon="history" />}
              />
            </Card.Content>
            <Card.Actions>
              <Button>View All History</Button>
            </Card.Actions>
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
  infoCard: {
    marginBottom: 24,
  },
  infoText: {
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 16,
    marginTop: 8,
  },
  card: {
    marginBottom: 24,
  },
  switchContainer: {
    justifyContent: 'center',
  },
}); 