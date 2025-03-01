import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, Divider, List, Chip, Avatar, IconButton } from 'react-native-paper';
import { useFasten } from '@/hooks/useFasten';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Key for storing username in AsyncStorage - must match the one in _layout.tsx
const USERNAME_STORAGE_KEY = 'fasten_username';

// Mock data for health information
// In a real app, this would come from an API
const mockVitals = [
  { name: 'Blood Pressure', value: '120/80 mmHg', icon: 'heart-pulse', date: '2023-06-15' },
  { name: 'Heart Rate', value: '72 bpm', icon: 'heart', date: '2023-06-15' },
  { name: 'Temperature', value: '98.6°F', icon: 'thermometer', date: '2023-06-15' },
  { name: 'Weight', value: '160 lbs', icon: 'weight', date: '2023-06-10' },
  { name: 'Blood Glucose', value: '95 mg/dL', icon: 'water', date: '2023-06-12' },
];

const mockConditions = [
  { name: 'Hypertension', since: '2020', status: 'Active' },
  { name: 'Type 2 Diabetes', since: '2019', status: 'Managed' },
];

const mockAllergies = [
  { name: 'Penicillin', severity: 'High', reaction: 'Rash, difficulty breathing' },
  { name: 'Peanuts', severity: 'Moderate', reaction: 'Hives' },
  { name: 'Latex', severity: 'Low', reaction: 'Skin irritation' },
];

const mockMedications = [
  { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', purpose: 'Blood pressure' },
  { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', purpose: 'Diabetes' },
  { name: 'Aspirin', dosage: '81mg', frequency: 'Once daily', purpose: 'Heart health' },
];

// Mock data for immunizations
const mockImmunizations = [
  { name: 'COVID-19 (Pfizer)', date: '2023-01-15', status: 'Current' },
  { name: 'Influenza', date: '2022-10-05', status: 'Current' },
  { name: 'Tetanus/Diphtheria (Td)', date: '2019-03-22', status: 'Due for booster' },
  { name: 'Pneumococcal', date: '2021-05-18', status: 'Current' },
];

export default function DashboardScreen() {
  const { fastenDomain } = useFasten();
  const [username, setUsername] = useState("User"); // Default username

  // Load username from storage when component mounts
  useEffect(() => {
    const loadUsername = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem(USERNAME_STORAGE_KEY);
        if (storedUsername) {
          setUsername(storedUsername);
        }
      } catch (error) {
        console.error('Failed to load username from storage', error);
      }
    };
    
    loadUsername();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        <View style={styles.content}>
          <Card style={styles.welcomeCard}>
            <Card.Content>
              <Text variant="titleLarge">Hello {username}!</Text>
              <Text variant="bodyMedium" style={styles.welcomeText}>
                Here's a summary of your health information
              </Text>
            </Card.Content>
          </Card>

          {/* Health Vitals Section */}
          <Card style={styles.sectionCard}>
            <Card.Title 
              title="Health Vitals" 
              left={(props) => <Avatar.Icon {...props} icon="heart-pulse" />}
              right={(props) => <IconButton {...props} icon="refresh" onPress={() => {}} />}
            />
            <Card.Content>
              <Text variant="bodySmall" style={styles.sectionDescription}>
                Your most recent vital measurements
              </Text>
              <Divider style={styles.divider} />
              {mockVitals.map((vital, index) => (
                <View key={index}>
                  <List.Item
                    title={vital.name}
                    description={`Last updated: ${vital.date}`}
                    left={props => <List.Icon {...props} icon={vital.icon} />}
                    right={() => <Text style={styles.vitalValue}>{vital.value}</Text>}
                  />
                  {index < mockVitals.length - 1 && <Divider />}
                </View>
              ))}
            </Card.Content>
          </Card>

          {/* Medical Conditions Section */}
          <Card style={styles.sectionCard}>
            <Card.Title 
              title="Medical Conditions" 
              left={(props) => <Avatar.Icon {...props} icon="medical-bag" />}
            />
            <Card.Content>
              <Text variant="bodySmall" style={styles.sectionDescription}>
                Your diagnosed conditions
              </Text>
              <Divider style={styles.divider} />
              {mockConditions.length > 0 ? (
                mockConditions.map((condition, index) => (
                  <View key={index}>
                    <List.Item
                      title={condition.name}
                      description={`Since: ${condition.since}`}
                      right={() => (
                        <Chip mode="outlined" style={
                          condition.status === 'Active' 
                            ? styles.activeChip 
                            : styles.managedChip
                        }>
                          {condition.status}
                        </Chip>
                      )}
                    />
                    {index < mockConditions.length - 1 && <Divider />}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No conditions recorded</Text>
              )}
            </Card.Content>
          </Card>

          {/* Allergies Section */}
          <Card style={styles.sectionCard}>
            <Card.Title 
              title="Allergies" 
              left={(props) => <Avatar.Icon {...props} icon="alert-circle" />}
            />
            <Card.Content>
              <Text variant="bodySmall" style={styles.sectionDescription}>
                Your known allergies and reactions
              </Text>
              <Divider style={styles.divider} />
              {mockAllergies.length > 0 ? (
                mockAllergies.map((allergy, index) => (
                  <View key={index}>
                    <List.Item
                      title={allergy.name}
                      description={`Reaction: ${allergy.reaction}`}
                      right={() => (
                        <Chip mode="outlined" style={
                          allergy.severity === 'High' 
                            ? styles.highSeverityChip 
                            : allergy.severity === 'Moderate'
                              ? styles.moderateSeverityChip
                              : styles.lowSeverityChip
                        }>
                          {allergy.severity}
                        </Chip>
                      )}
                    />
                    {index < mockAllergies.length - 1 && <Divider />}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No allergies recorded</Text>
              )}
            </Card.Content>
          </Card>

          {/* Medications Section */}
          <Card style={styles.sectionCard}>
            <Card.Title 
              title="Medications" 
              left={(props) => <Avatar.Icon {...props} icon="pill" />}
            />
            <Card.Content>
              <Text variant="bodySmall" style={styles.sectionDescription}>
                Your current medications
              </Text>
              <Divider style={styles.divider} />
              {mockMedications.length > 0 ? (
                mockMedications.map((medication, index) => (
                  <View key={index}>
                    <List.Item
                      title={medication.name}
                      description={`${medication.dosage} - ${medication.frequency}`}
                      right={() => (
                        <Text style={styles.medicationPurpose}>{medication.purpose}</Text>
                      )}
                    />
                    {index < mockMedications.length - 1 && <Divider />}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No medications recorded</Text>
              )}
            </Card.Content>
          </Card>

          {/* Immunizations Section */}
          <Card style={styles.sectionCard}>
            <Card.Title 
              title="Immunizations" 
              left={(props) => <Avatar.Icon {...props} icon="needle" />}
            />
            <Card.Content>
              <Text variant="bodySmall" style={styles.sectionDescription}>
                Your vaccination history
              </Text>
              <Divider style={styles.divider} />
              {mockImmunizations.length > 0 ? (
                mockImmunizations.map((immunization, index) => (
                  <View key={index}>
                    <List.Item
                      title={immunization.name}
                      description={`Date: ${immunization.date}`}
                      right={() => (
                        <Chip mode="outlined" style={
                          immunization.status === 'Current' 
                            ? styles.currentChip 
                            : styles.dueChip
                        }>
                          {immunization.status}
                        </Chip>
                      )}
                    />
                    {index < mockImmunizations.length - 1 && <Divider />}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No immunizations recorded</Text>
              )}
            </Card.Content>
          </Card>

          <Text variant="bodySmall" style={styles.disclaimer}>
            This information is for reference only. Always consult with your healthcare provider.
          </Text>
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
    marginBottom: 16,
  },
  welcomeText: {
    marginTop: 8,
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionDescription: {
    color: '#666',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 8,
  },
  vitalValue: {
    fontWeight: 'bold',
    alignSelf: 'center',
  },
  emptyText: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
    color: '#666',
  },
  activeChip: {
    backgroundColor: '#ffebee',
    borderColor: '#ef5350',
  },
  managedChip: {
    backgroundColor: '#e8f5e9',
    borderColor: '#66bb6a',
  },
  highSeverityChip: {
    backgroundColor: '#ffebee',
    borderColor: '#ef5350',
  },
  moderateSeverityChip: {
    backgroundColor: '#fff8e1',
    borderColor: '#ffc107',
  },
  lowSeverityChip: {
    backgroundColor: '#e8f5e9',
    borderColor: '#66bb6a',
  },
  currentChip: {
    backgroundColor: '#e8f5e9',
    borderColor: '#66bb6a',
  },
  dueChip: {
    backgroundColor: '#fff8e1',
    borderColor: '#ffc107',
  },
  medicationPurpose: {
    color: '#666',
    fontStyle: 'italic',
    alignSelf: 'center',
  },
  disclaimer: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#666',
    marginTop: 8,
    marginBottom: 24,
  },
});
