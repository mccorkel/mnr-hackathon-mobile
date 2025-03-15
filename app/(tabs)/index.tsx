import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, ViewStyle } from 'react-native';
import { Card, Text, Button, Divider, List, Chip, Avatar, IconButton } from 'react-native-paper';
import { useFasten } from '@/hooks/useFasten';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Key for storing username in AsyncStorage - must match the one in _layout.tsx
const USERNAME_STORAGE_KEY = 'fasten_username';

// Interface for vital sign data
interface VitalSign {
  name: string;
  value: string;
  icon: string;
  date: string;
  unit?: string;
  rawDate?: number;
}

// Mock data for health information
// In a real app, this would come from an API
const mockVitals: VitalSign[] = [
  { name: 'Blood Pressure', value: '120/80 mmHg', icon: 'heart-pulse', date: '2023-06-15', rawDate: new Date('2023-06-15').getTime() },
  { name: 'Heart Rate', value: '72 bpm', icon: 'heart', date: '2023-06-15', rawDate: new Date('2023-06-15').getTime() },
  { name: 'Temperature', value: '98.6°F', icon: 'thermometer', date: '2023-06-15', rawDate: new Date('2023-06-15').getTime() },
  { name: 'Weight', value: '160 lbs', icon: 'weight', date: '2023-06-10', rawDate: new Date('2023-06-10').getTime() },
  { name: 'Blood Glucose', value: '95 mg/dL', icon: 'water', date: '2023-06-12', rawDate: new Date('2023-06-12').getTime() },
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

// Add ChipWithIcon interface with proper types
interface ChipWithIconProps {
  text: string;
  style: ViewStyle;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}

// Update the helper function with types
const ChipWithIcon = ({ text, style, icon, iconColor }: ChipWithIconProps) => (
  <Chip 
    mode="flat" 
    style={[styles.baseChip, style]}
    icon={() => (
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={14} color={iconColor} />
      </View>
    )}
  >
    <Text style={styles.chipText}>{text}</Text>
  </Chip>
);

export default function DashboardScreen() {
  const { fastenDomain, authToken } = useFasten();
  const [username, setUsername] = useState("User"); // Default username
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [isLoadingVitals, setIsLoadingVitals] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selfPatientId, setSelfPatientId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');

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

  // Check if the Fasten server is accessible
  useEffect(() => {
    const checkServerStatus = async () => {
      if (!fastenDomain) {
        console.log('No Fasten domain set, skipping server check');
        setServerStatus('offline');
        return;
      }

      try {
        console.log(`Checking server status at ${fastenDomain}`);
        const response = await fetch(`${fastenDomain}/api/health`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          console.log('Server is online');
          setServerStatus('online');
        } else {
          console.log(`Server returned status ${response.status}`);
          setServerStatus('offline');
        }
      } catch (error) {
        console.error('Error checking server status:', error);
        setServerStatus('offline');
      }
    };

    checkServerStatus();
  }, [fastenDomain]);

  // Load self patient ID when component mounts
  useEffect(() => {
    const loadSelfPatientId = async () => {
      try {
        // Get saved relationships from AsyncStorage
        const savedRelationshipsStr = await AsyncStorage.getItem('patientRelationships');
        if (savedRelationshipsStr) {
          const savedRelationships = JSON.parse(savedRelationshipsStr);
          
          // Find the relationship marked as "THAT'S ME!"
          const selfRelationship = savedRelationships.find((r: any) => r.relationship === 'THAT\'S ME!');
          if (selfRelationship) {
            console.log('Found self patient ID:', selfRelationship.id);
            setSelfPatientId(selfRelationship.id);
          } else {
            console.log('No self patient ID found in relationships');
            setErrorMessage('Please set a patient as "THAT\'S ME!" in Settings.');
          }
        } else {
          console.log('No saved relationships found');
          setErrorMessage('Please set a patient as "THAT\'S ME!" in Settings.');
        }
      } catch (error) {
        console.error('Error loading self patient ID:', error);
        setErrorMessage('Error loading patient information.');
      }
    };
    
    loadSelfPatientId();
  }, []);

  // Fetch vital signs when component mounts or when dependencies change
  useEffect(() => {
    if (fastenDomain && authToken && selfPatientId && serverStatus === 'online') {
      fetchVitalSigns();
    } else if (serverStatus === 'offline') {
      console.log('Server is offline, using mock data');
      setVitalSigns(mockVitals);
      setErrorMessage('Server is offline. Showing sample data.');
    }
  }, [fastenDomain, authToken, selfPatientId, serverStatus]);

  // Function to fetch vital signs from the Fasten server
  const fetchVitalSigns = async () => {
    if (!fastenDomain || !authToken) {
      console.error('Domain or authentication token not available');
      console.log('fastenDomain:', fastenDomain ? 'set' : 'not set');
      console.log('authToken:', authToken ? 'set' : 'not set');
      setErrorMessage('Authentication information is missing. Please log in again.');
      // Use mock data when authentication is missing
      setVitalSigns(mockVitals);
      setIsLoadingVitals(false);
      return;
    }
    
    if (!selfPatientId) {
      console.error('Self patient ID not available');
      setErrorMessage('Patient information is missing. Please set a patient as "THAT\'S ME!" in Settings.');
      // Use mock data when patient ID is missing
      setVitalSigns(mockVitals);
      setIsLoadingVitals(false);
      return;
    }
    
    console.log('Starting vital signs fetch with patient ID:', selfPatientId);
    setIsLoadingVitals(true);
    setErrorMessage(null);
    
    try {
      // Construct the full URL for the secure query endpoint
      const queryUrl = `${fastenDomain}/api/secure/query`;
      console.log(`Making vital signs query to: ${queryUrl}`);
      
      // Create the query payload for vital signs - using a more general approach
      const queryPayload = {
        "from": "Observation",
        "select": ["*"],
        "where": {}  // Remove the category filter to get all observations
      };
      
      console.log('Vital signs query payload:', JSON.stringify(queryPayload, null, 2));
      
      const response = await fetch(queryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(queryPayload),
      });
      
      console.log('Vital signs response status:', response.status);
      
      if (!response.ok) {
        console.error(`Server error: ${response.status} ${response.statusText}`);
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      console.log('Vital signs response received, length:', responseText.length);
      console.log('Response preview:', responseText.substring(0, 200) + '...');
      
      // Parse the response
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
        console.log('Response structure:', 
          JSON.stringify({
            type: typeof data,
            isArray: Array.isArray(data),
            keys: typeof data === 'object' && data !== null ? Object.keys(data) : 'N/A',
            length: Array.isArray(data) ? data.length : 'N/A'
          }, null, 2)
        );
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        throw new Error('Invalid response format');
      }
      
      // Process the vital signs data
      const processedVitals = processVitalSigns(data);
      console.log(`Processed ${processedVitals.length} vital signs`);
      if (processedVitals.length > 0) {
        console.log('First vital sign:', JSON.stringify(processedVitals[0], null, 2));
        setVitalSigns(processedVitals);
      } else {
        // If no vitals were found, use mock data
        console.log('No vital signs found, using mock data');
        setVitalSigns(mockVitals);
      }
      
    } catch (error) {
      console.error('Error fetching vital signs:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      // Fall back to mock data if there's an error
      console.log('Using mock data due to error');
      setVitalSigns(mockVitals);
    } finally {
      setIsLoadingVitals(false);
      setRefreshing(false);
    }
  };

  // Helper function to process vital signs data
  const processVitalSigns = (data: any): VitalSign[] => {
    const processedVitals: VitalSign[] = [];
    
    // Handle different response formats
    let observations: any[] = [];
    
    if (Array.isArray(data)) {
      console.log('Data is an array with', data.length, 'items');
      observations = data;
    } else if (data && typeof data === 'object') {
      console.log('Data is an object with keys:', Object.keys(data));
      
      if (data.resourceType === 'Bundle' && Array.isArray(data.entry)) {
        console.log('Found FHIR Bundle with', data.entry.length, 'entries');
        observations = data.entry.map((entry: any) => entry.resource);
      } else if (data.results && Array.isArray(data.results)) {
        console.log('Found results array with', data.results.length, 'items');
        observations = data.results;
      } else if (data.data && Array.isArray(data.data)) {
        console.log('Found data array with', data.data.length, 'items');
        observations = data.data;
      } else if (data.rows && Array.isArray(data.rows)) {
        console.log('Found rows array with', data.rows.length, 'items');
        observations = data.rows;
      } else {
        // Try to handle a single observation
        console.log('Checking if data is a single observation');
        if (data.resourceType === 'Observation' || data.code) {
          console.log('Data appears to be a single observation');
          observations = [data];
        }
      }
    }
    
    console.log(`Processing ${observations.length} vital sign observations`);
    
    // Filter observations to only include vital signs
    const vitalSignObservations = observations.filter(obs => {
      const resource = obs.resource_raw ? 
        (typeof obs.resource_raw === 'string' ? 
          (() => { try { return JSON.parse(obs.resource_raw); } catch(e) { return obs; } })() : 
          obs.resource_raw) : 
        obs;
      
      // Check if this is a vital sign by examining the category or code
      const isVitalSign = 
        // Check category
        (resource.category && 
          Array.isArray(resource.category) && 
          resource.category.some((cat: any) => 
            cat.coding && 
            Array.isArray(cat.coding) && 
            cat.coding.some((coding: any) => 
              coding.system?.includes('observation-category') && 
              coding.code === 'vital-signs'
            )
          )) ||
        // Check common vital sign codes
        (resource.code?.coding?.[0]?.code && 
          ['8480-6', '8462-4', '8867-4', '8310-5', '29463-7', 
           '39156-5', '8302-2', '2339-0', '2708-6', '9279-1'].some(code => 
            resource.code.coding[0].code.includes(code)
          )) ||
        // Check display names
        (resource.code?.coding?.[0]?.display && 
          ['blood pressure', 'heart rate', 'temperature', 'weight', 
           'bmi', 'height', 'glucose', 'oxygen', 'respiratory'].some(term => 
            resource.code.coding[0].display.toLowerCase().includes(term)
          ));
      
      return isVitalSign;
    });
    
    console.log(`Filtered to ${vitalSignObservations.length} vital sign observations`);
    
    // Temporary map to store the most recent vital sign for each type
    const vitalSignMap: { [key: string]: VitalSign } = {};
    
    // Process each vital sign observation
    vitalSignObservations.forEach((obs, index) => {
      console.log(`Processing observation ${index + 1}/${vitalSignObservations.length}`);
      
      // Extract the raw resource if it's wrapped
      let resource = obs;
      if (obs.resource_raw) {
        console.log('Found resource_raw field');
        if (typeof obs.resource_raw === 'string') {
          try {
            resource = JSON.parse(obs.resource_raw);
            console.log('Parsed resource_raw from string');
          } catch (e) {
            console.error('Failed to parse resource_raw:', e);
            resource = obs;
          }
        } else {
          resource = obs.resource_raw;
          console.log('Using resource_raw object directly');
        }
      }
      
      // Get the code information
      const code = resource.code?.coding?.[0]?.code || resource.code?.text || 'Unknown';
      const display = resource.code?.coding?.[0]?.display || resource.code?.text || 'Vital Sign';
      console.log(`Observation code: ${code}, display: ${display}`);
      
      // Get the value
      let value = '';
      let unit = '';
      
      if (resource.valueQuantity) {
        value = resource.valueQuantity.value?.toString() || '';
        unit = resource.valueQuantity.unit || resource.valueQuantity.code || '';
        console.log(`Found valueQuantity: ${value} ${unit}`);
      } else if (resource.valueString) {
        value = resource.valueString;
        console.log(`Found valueString: ${value}`);
      } else if (resource.valueCodeableConcept) {
        value = resource.valueCodeableConcept.coding?.[0]?.display || 
               resource.valueCodeableConcept.text || 'Coded Value';
        console.log(`Found valueCodeableConcept: ${value}`);
      } else if (resource.component && Array.isArray(resource.component)) {
        // Handle blood pressure which has systolic and diastolic components
        console.log(`Found ${resource.component.length} components`);
        
        const systolic = resource.component.find((c: any) => 
          c.code?.coding?.[0]?.code === '8480-6' || 
          c.code?.text?.includes('Systolic'));
          
        const diastolic = resource.component.find((c: any) => 
          c.code?.coding?.[0]?.code === '8462-4' || 
          c.code?.text?.includes('Diastolic'));
          
        if (systolic && diastolic) {
          const systolicValue = systolic.valueQuantity?.value || '';
          const diastolicValue = diastolic.valueQuantity?.value || '';
          value = `${systolicValue}/${diastolicValue}`;
          unit = systolic.valueQuantity?.unit || 'mmHg';
          console.log(`Found blood pressure: ${value} ${unit}`);
        }
      } else {
        console.log('No value found in observation');
      }
      
      // Skip observations without values
      if (!value) {
        console.log('Skipping observation with no value');
        return;
      }
      
      // Get the date
      const date = resource.effectiveDateTime || resource.issued || resource.meta?.lastUpdated || 'Unknown date';
      const formattedDate = date !== 'Unknown date' ? new Date(date).toLocaleDateString() : date;
      console.log(`Observation date: ${date}, formatted: ${formattedDate}`);
      
      // Determine the icon based on the code
      let icon = 'heart-pulse';
      let vitalType = 'other'; // Default type for grouping
      
      if (code.includes('8480-6') || code.includes('8462-4') || display.toLowerCase().includes('blood pressure')) {
        icon = 'heart-pulse';
        vitalType = 'blood-pressure';
      } else if (code.includes('8867-4') || display.toLowerCase().includes('heart rate')) {
        icon = 'heart';
        vitalType = 'heart-rate';
      } else if (code.includes('8310-5') || display.toLowerCase().includes('temperature')) {
        icon = 'thermometer';
        vitalType = 'temperature';
      } else if (code.includes('29463-7') || display.toLowerCase().includes('weight')) {
        icon = 'weight';
        vitalType = 'weight';
      } else if (code.includes('39156-5') || display.toLowerCase().includes('bmi')) {
        icon = 'human';
        vitalType = 'bmi';
      } else if (code.includes('8302-2') || display.toLowerCase().includes('height')) {
        icon = 'human-male-height';
        vitalType = 'height';
      } else if (code.includes('2339-0') || display.toLowerCase().includes('glucose')) {
        icon = 'water';
        vitalType = 'glucose';
      } else if (code.includes('2708-6') || display.toLowerCase().includes('oxygen')) {
        icon = 'gas-cylinder';
        vitalType = 'oxygen';
      } else if (code.includes('9279-1') || display.toLowerCase().includes('respiratory')) {
        icon = 'lungs';
        vitalType = 'respiratory';
      }
      
      // Create the vital sign object
      const vitalSign: VitalSign = {
        name: display,
        value: value + (unit ? ` ${unit}` : ''),
        icon,
        date: formattedDate,
        unit,
        rawDate: date !== 'Unknown date' ? new Date(date).getTime() : 0
      };
      
      console.log('Created vital sign:', JSON.stringify(vitalSign, null, 2));
      
      // Check if we already have this type of vital sign
      if (!vitalSignMap[vitalType] || 
          (vitalSign.rawDate && vitalSignMap[vitalType]?.rawDate && 
           vitalSign.rawDate > (vitalSignMap[vitalType]?.rawDate || 0))) {
        // This is either the first of its type or more recent than the existing one
        vitalSignMap[vitalType] = vitalSign;
        console.log(`Added/Updated ${vitalType} with date ${formattedDate}`);
      } else {
        console.log(`Skipping older ${vitalType} with date ${formattedDate}`);
      }
    });
    
    // Convert the map to an array and sort by name
    const uniqueVitals = Object.values(vitalSignMap).sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`Processed ${uniqueVitals.length} unique vital signs`);
    
    // If no vitals were found, return an empty array
    if (uniqueVitals.length === 0) {
      console.log('No vital signs found in the response');
    }
    
    return uniqueVitals;
  };

  // Handle refresh
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchVitalSigns();
  }, [fastenDomain, authToken, selfPatientId]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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
              left={(props) => <Avatar.Icon {...props} icon="heart-pulse" color="#fff" />}
              right={(props) => <IconButton {...props} icon="refresh" onPress={fetchVitalSigns} />}
            />
            <Card.Content>
              <Text variant="bodySmall" style={styles.sectionDescription}>
                Your most recent vital measurements
                {serverStatus === 'offline' && ' (Sample Data)'}
              </Text>
              <Divider style={styles.divider} />
              
              {isLoadingVitals ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" />
                  <Text style={styles.loadingText}>Loading vital signs...</Text>
                </View>
              ) : errorMessage && vitalSigns.length === 0 ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                  <Button mode="contained" onPress={fetchVitalSigns} style={styles.retryButton}>
                    Retry
                  </Button>
                </View>
              ) : vitalSigns.length > 0 ? (
                <>
                  {serverStatus === 'offline' && (
                    <Text style={styles.offlineNotice}>
                      Server is offline. Showing sample data.
                    </Text>
                  )}
                  {vitalSigns.map((vital, index) => (
                    <View key={index}>
                      <List.Item
                        title={vital.name}
                        description={`Last updated: ${vital.date}`}
                        left={props => <List.Icon {...props} icon={vital.icon} />}
                        right={() => <Text style={styles.vitalValue}>{vital.value}</Text>}
                      />
                      {index < vitalSigns.length - 1 && <Divider />}
                    </View>
                  ))}
                </>
              ) : (
                <Text style={styles.emptyText}>No vital signs recorded</Text>
              )}
            </Card.Content>
          </Card>

          {/* Medical Conditions Section */}
          <Card style={styles.sectionCard}>
            <Card.Title 
              title="Medical Conditions" 
              left={(props) => <Avatar.Icon {...props} icon="medical-bag" color="#fff" />}
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
                        <ChipWithIcon
                          text={condition.status}
                          style={condition.status === 'Active' ? styles.activeChip : styles.managedChip}
                          icon={condition.status === 'Active' ? 'alert-circle' : 'checkmark-circle'}
                          iconColor={condition.status === 'Active' ? '#ef5350' : '#66bb6a'}
                        />
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
              left={(props) => <Avatar.Icon {...props} icon="alert-circle" color="#fff" />}
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
                        <ChipWithIcon
                          text={allergy.severity}
                          style={
                            allergy.severity === 'High'
                              ? styles.highSeverityChip
                              : allergy.severity === 'Moderate'
                                ? styles.moderateSeverityChip
                                : styles.lowSeverityChip
                          }
                          icon={
                            allergy.severity === 'High'
                              ? 'warning'
                              : allergy.severity === 'Moderate'
                                ? 'alert-circle'
                                : 'information-circle'
                          }
                          iconColor={
                            allergy.severity === 'High'
                              ? '#ef5350'
                              : allergy.severity === 'Moderate'
                                ? '#ffa726'
                                : '#66bb6a'
                          }
                        />
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
              left={(props) => <Avatar.Icon {...props} icon="pill" color="#fff" />}
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
              left={(props) => <Avatar.Icon {...props} icon="needle" color="#fff" />}
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
                        <ChipWithIcon
                          text={immunization.status}
                          style={immunization.status === 'Current' ? styles.currentChip : styles.dueChip}
                          icon={immunization.status === 'Current' ? 'checkmark-circle' : 'time'}
                          iconColor={immunization.status === 'Current' ? '#66bb6a' : '#ffa726'}
                        />
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
    color: '#666',
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionDescription: {
    color: '#666',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 8,
  },
  vitalValue: {
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  activeChip: {
    backgroundColor: 'rgba(239, 83, 80, 0.08)',
    borderWidth: 0,
  },
  managedChip: {
    backgroundColor: 'rgba(102, 187, 106, 0.08)',
    borderWidth: 0,
  },
  highSeverityChip: {
    backgroundColor: 'rgba(239, 83, 80, 0.08)',
    borderWidth: 0,
  },
  moderateSeverityChip: {
    backgroundColor: 'rgba(255, 167, 38, 0.08)',
    borderWidth: 0,
  },
  lowSeverityChip: {
    backgroundColor: 'rgba(102, 187, 106, 0.08)',
    borderWidth: 0,
  },
  currentChip: {
    backgroundColor: 'rgba(102, 187, 106, 0.08)',
    borderWidth: 0,
  },
  dueChip: {
    backgroundColor: 'rgba(255, 167, 38, 0.08)',
    borderWidth: 0,
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
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    minWidth: 120,
  },
  offlineNotice: {
    color: '#ff9800',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
  },
  baseChip: {
    borderRadius: 20,
    height: 32,
    marginVertical: 0,
    justifyContent: 'center',
    paddingVertical: 0,
    paddingHorizontal: 8,
    minWidth: 80,
  },
  iconContainer: {
    marginLeft: -6,
    marginRight: 2,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 0,
    lineHeight: 16,
  },
});
