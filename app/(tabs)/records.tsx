import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, List, Divider, Button, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RecordsScreen() {
  const [searchQuery, setSearchQuery] = React.useState('');

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Searchbar
          placeholder="Search records..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />

        <ScrollView>
          <Text variant="titleMedium" style={styles.sectionTitle}>Recent Records</Text>
          
          <Card style={styles.card}>
            <Card.Content>
              <List.Item
                title="Annual Physical"
                description="Dr. Smith • May 15, 2023"
                left={props => <List.Icon {...props} icon="file-document-outline" />}
                right={props => <Button mode="text">View</Button>}
              />
              <Divider />
              <List.Item
                title="Blood Test Results"
                description="Quest Diagnostics • April 30, 2023"
                left={props => <List.Icon {...props} icon="test-tube" />}
                right={props => <Button mode="text">View</Button>}
              />
              <Divider />
              <List.Item
                title="Vaccination Record"
                description="City Clinic • March 12, 2023"
                left={props => <List.Icon {...props} icon="needle" />}
                right={props => <Button mode="text">View</Button>}
              />
            </Card.Content>
          </Card>

          <Text variant="titleMedium" style={styles.sectionTitle}>Categories</Text>
          
          <View style={styles.categories}>
            <Card style={styles.categoryCard}>
              <Card.Content>
                <Text variant="titleMedium">Lab Results</Text>
                <Text variant="bodySmall">12 records</Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.categoryCard}>
              <Card.Content>
                <Text variant="titleMedium">Medications</Text>
                <Text variant="bodySmall">8 records</Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.categoryCard}>
              <Card.Content>
                <Text variant="titleMedium">Imaging</Text>
                <Text variant="bodySmall">3 records</Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.categoryCard}>
              <Card.Content>
                <Text variant="titleMedium">Visits</Text>
                <Text variant="bodySmall">15 records</Text>
              </Card.Content>
            </Card>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchBar: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    marginTop: 8,
  },
  card: {
    marginBottom: 24,
  },
  categories: {
    marginBottom: 24,
  },
  categoryCard: {
    marginBottom: 12,
  },
}); 