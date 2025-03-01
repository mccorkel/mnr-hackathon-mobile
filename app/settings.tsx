// app/settings.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, SafeAreaView, Platform, StatusBar, ScrollView, RefreshControl } from 'react-native';
import { Button, Text, List, Divider, Appbar, Switch, Avatar, Card, IconButton, Dialog, Portal, TextInput, Chip, ActivityIndicator, RadioButton } from 'react-native-paper';
import { useFasten } from '@/hooks/useFasten';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock data for family members
interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  avatar?: string;
  sharedCategories: string[];
}

// Mock data for sharing categories
interface SharingCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  isShared: boolean;
}

// Interface for linked account IDs
interface LinkedAccount {
  id: string;
  source?: string;
  lastAccessed?: string;
}

// Interface for query response
interface QueryResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Interface for patient data
interface PatientData {
  id: string;
  name: string;
  relationship?: string;
}

// Available relationship types
const RELATIONSHIPS = [
  'Mother',
  'Father',
  'Sister',
  'Brother',
  'Daughter',
  'Son',
  'Grandmother',
  'Grandfather',
  'THAT\'S ME!',
  'Other'
];

export default function SettingsScreen() {
  const { fastenDomain, setFastenDomain, signOut, authToken, llmDomain, setLlmDomain } = useFasten();
  const router = useRouter();
  
  // State for family members
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    { 
      id: '1', 
      name: 'Sarah Johnson', 
      relation: 'Mother',
      sharedCategories: ['Medications', 'Appointments'] 
    },
    { 
      id: '2', 
      name: 'Mike Johnson', 
      relation: 'Father',
      sharedCategories: ['Lab Results', 'Vitals'] 
    }
  ]);
  
  // State for sharing categories
  const [sharingCategories, setSharingCategories] = useState<SharingCategory[]>([
    { id: '1', name: 'Medications', description: 'Share your medication information', icon: 'pill', isShared: true },
    { id: '2', name: 'Appointments', description: 'Share your upcoming appointments', icon: 'calendar', isShared: true },
    { id: '3', name: 'Lab Results', description: 'Share your lab test results', icon: 'test-tube', isShared: true },
    { id: '4', name: 'Vitals', description: 'Share your vital signs', icon: 'heart-pulse', isShared: true },
    { id: '5', name: 'Allergies', description: 'Share your allergies', icon: 'alert-circle', isShared: false },
  ]);
  
  // State for linked account IDs
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  
  // State for query response
  const [queryResponse, setQueryResponse] = useState<QueryResponse | null>(null);
  const [isLoadingQuery, setIsLoadingQuery] = useState(false);
  
  // State for privacy mode
  const [privacyMode, setPrivacyMode] = useState(false);
  
  // State for notifications
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // State for add family member dialog
  const [addMemberDialogVisible, setAddMemberDialogVisible] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRelation, setNewMemberRelation] = useState('');
  
  // State for member sharing dialog
  const [sharingDialogVisible, setSharingDialogVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  
  // State for patient data
  const [patients, setPatients] = useState<PatientData[]>([]);
  
  // State for refresh control
  const [refreshing, setRefreshing] = useState(false);
  
  // State for relationship mapping dialog
  const [showRelationshipDialog, setShowRelationshipDialog] = useState(false);
  const [relationshipsMapped, setRelationshipsMapped] = useState(false);
  const [currentPatientIndex, setCurrentPatientIndex] = useState(0);
  const [selectedRelationship, setSelectedRelationship] = useState('');
  const [customRelationship, setCustomRelationship] = useState('');
  const [username, setUsername] = useState('');
  const [usedRelationships, setUsedRelationships] = useState<string[]>([]);
  
  // Add a new state variable for tracking single patient edit mode
  const [editingSinglePatient, setEditingSinglePatient] = useState(false);
  
  // Domain management state
  const [isResetting, setIsResetting] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [newLlmDomain, setNewLlmDomain] = useState('');
  const [showDomainInput, setShowDomainInput] = useState(false);
  const [showLlmDomainInput, setShowLlmDomainInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  
  // Load username and relationship mapping status when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('username');
        if (storedUsername) {
          setUsername(storedUsername);
        }
        
        const mappedStatus = await AsyncStorage.getItem('relationshipsMapped');
        setRelationshipsMapped(mappedStatus === 'true');
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, []);
  
  // Check if we need to show the relationship mapping dialog
  useEffect(() => {
    // Only show dialog if:
    // 1. We have patients loaded
    // 2. Relationships haven't been mapped yet
    // 3. We're not currently loading
    if (
      patients.length > 0 && 
      !relationshipsMapped && 
      !isLoadingQuery && 
      !showRelationshipDialog
    ) {
      // Start the relationship mapping process
      setCurrentPatientIndex(0);
      setShowRelationshipDialog(true);
      
      // Initialize used relationships
      const initialUsedRelationships: string[] = [];
      patients.forEach(patient => {
        if (patient.relationship && ['Mother', 'Father', 'THAT\'S ME!'].includes(patient.relationship)) {
          initialUsedRelationships.push(patient.relationship);
        }
      });
      setUsedRelationships(initialUsedRelationships);
    }
  }, [patients, relationshipsMapped, isLoadingQuery]);
  
  // Function to synchronize family members with patients who have relationships
  const syncFamilyMembersWithPatients = async () => {
    // Get patients with relationships (except "THAT'S ME!")
    const patientsWithRelationships = patients.filter(
      p => p.relationship && p.relationship !== 'THAT\'S ME!'
    );
    
    // Create a new family members array
    const updatedFamilyMembers = [...familyMembers];
    let familyMembersChanged = false;
    
    // First, remove any family members that no longer have relationships
    const familyMembersToKeep = updatedFamilyMembers.filter(member => {
      // Keep manually added family members (those not in the patients list)
      const matchingPatient = patients.find(p => p.id === member.id);
      if (!matchingPatient) return true;
      
      // Keep if the patient has a relationship and it's not "THAT'S ME!"
      return matchingPatient.relationship && matchingPatient.relationship !== 'THAT\'S ME!';
    });
    
    if (familyMembersToKeep.length !== updatedFamilyMembers.length) {
      familyMembersChanged = true;
    }
    
    // Then add or update patients with relationships
    patientsWithRelationships.forEach(patient => {
      const existingIndex = familyMembersToKeep.findIndex(m => m.id === patient.id);
      
      if (existingIndex === -1) {
        // Add new family member
        familyMembersToKeep.push({
          id: patient.id,
          name: patient.name,
          relation: patient.relationship!,
          sharedCategories: []
        });
        familyMembersChanged = true;
      } else if (familyMembersToKeep[existingIndex].relation !== patient.relationship) {
        // Update existing family member's relationship
        familyMembersToKeep[existingIndex] = {
          ...familyMembersToKeep[existingIndex],
          relation: patient.relationship!
        };
        familyMembersChanged = true;
      }
    });
    
    // Update state and storage if changes were made
    if (familyMembersChanged) {
      setFamilyMembers(familyMembersToKeep);
      try {
        await AsyncStorage.setItem('familyMembers', JSON.stringify(familyMembersToKeep));
      } catch (error) {
        console.error('Error saving synchronized family members:', error);
      }
    }
  };
  
  // Handle selecting a relationship for the current patient
  const handleRelationshipSelect = async () => {
    const relationship = selectedRelationship === 'Other' ? customRelationship : selectedRelationship;
    
    if (!relationship) {
      Alert.alert('Please select a relationship');
      return;
    }
    
    // Check if this is a unique relationship that can only be used once
    // Modified to allow re-selecting "THAT'S ME!" by only checking Mother and Father
    if (['Mother', 'Father'].includes(relationship) && usedRelationships.includes(relationship)) {
      Alert.alert(
        'Relationship Already Used',
        `You've already identified someone as your ${relationship.toLowerCase()}. Each person can only have one ${relationship.toLowerCase()}.`
      );
      return;
    }
    
    // Update the relationship for the current patient
    const updatedPatients = [...patients];
    
    if (currentPatientIndex < updatedPatients.length) {
      const currentPatient = updatedPatients[currentPatientIndex];
      const previousRelationship = currentPatient.relationship;
      
      // If this is "THAT'S ME!", first remove any existing "THAT'S ME!" relationships
      if (relationship === 'THAT\'S ME!') {
        // Find any existing "THAT'S ME!" patient and remove that relationship
        const selfPatientIndex = updatedPatients.findIndex(p => p.relationship === 'THAT\'S ME!');
        if (selfPatientIndex >= 0 && selfPatientIndex !== currentPatientIndex) {
          updatedPatients[selfPatientIndex] = {
            ...updatedPatients[selfPatientIndex],
            relationship: undefined
          };
          
          // Update in AsyncStorage as well
          try {
            const savedRelationshipsStr = await AsyncStorage.getItem('patientRelationships');
            if (savedRelationshipsStr) {
              let savedRelationships = JSON.parse(savedRelationshipsStr);
              const selfPatient = updatedPatients[selfPatientIndex];
              const existingIndex = savedRelationships.findIndex((r: any) => r.id === selfPatient.id);
              if (existingIndex >= 0) {
                savedRelationships[existingIndex].relationship = undefined;
                await AsyncStorage.setItem('patientRelationships', JSON.stringify(savedRelationships));
              }
            }
          } catch (error) {
            console.error('Error updating previous self relationship:', error);
          }
        }
      }
      
      // Update the patient with the selected relationship
      updatedPatients[currentPatientIndex] = { 
        ...updatedPatients[currentPatientIndex], 
        relationship 
      };
      setPatients(updatedPatients);
      
      // If this is a unique relationship, add it to used relationships
      if (['Mother', 'Father', 'THAT\'S ME!'].includes(relationship)) {
        // For "THAT'S ME!", first remove it if it exists in the array
        if (relationship === 'THAT\'S ME!') {
          setUsedRelationships(prev => prev.filter(r => r !== 'THAT\'S ME!').concat(['THAT\'S ME!']));
        } else {
          setUsedRelationships(prev => [...prev, relationship]);
        }
      }
      
      // Save this individual relationship immediately
      try {
        // Get existing relationships
        const savedRelationshipsStr = await AsyncStorage.getItem('patientRelationships');
        const savedRelationships = savedRelationshipsStr ? 
          JSON.parse(savedRelationshipsStr) : [];
        
        // Update or add the current relationship
        const existingIndex = savedRelationships.findIndex((r: any) => r.id === currentPatient.id);
        
        if (existingIndex >= 0) {
          savedRelationships[existingIndex].relationship = relationship;
        } else {
          savedRelationships.push({
            id: currentPatient.id,
            relationship: relationship
          });
        }
        
        // Save back to AsyncStorage
        await AsyncStorage.setItem('patientRelationships', JSON.stringify(savedRelationships));
        
        // Synchronize family members with patients
        await syncFamilyMembersWithPatients();
      } catch (error) {
        console.error('Error saving relationship:', error);
      }
      
      // If we're editing a single patient, close the dialog
      if (editingSinglePatient) {
        setShowRelationshipDialog(false);
        setEditingSinglePatient(false);
        
        // Show a confirmation message
        Alert.alert(
          'Relationship Updated',
          `Relationship for ${updatedPatients[currentPatientIndex].name} has been updated.`
        );
        return;
      }
      
      // Otherwise, move to the next patient (for initial mapping)
      const nextIndex = currentPatientIndex + 1;
      
      if (nextIndex < updatedPatients.length) {
        setCurrentPatientIndex(nextIndex);
        setSelectedRelationship('');
        setCustomRelationship('');
      } else {
        // We've gone through all patients
        finishRelationshipMapping();
      }
    } else {
      // No more patients to process
      finishRelationshipMapping();
    }
  };
  
  // Skip the current patient
  const handleSkipPatient = () => {
    // Move to the next patient
    let nextIndex = currentPatientIndex + 1;
    while (nextIndex < patients.length && patients[nextIndex].relationship === 'Self') {
      nextIndex++;
    }
    
    if (nextIndex < patients.length) {
      setCurrentPatientIndex(nextIndex);
      setSelectedRelationship('');
      setCustomRelationship('');
    } else {
      // No more patients to process
      finishRelationshipMapping();
    }
  };
  
  // Finish the relationship mapping process
  const finishRelationshipMapping = async () => {
    setShowRelationshipDialog(false);
    setRelationshipsMapped(true);
    
    try {
      // Save the mapping status to AsyncStorage
      await AsyncStorage.setItem('relationshipsMapped', 'true');
      
      // Synchronize family members with patients
      await syncFamilyMembersWithPatients();
      
      // Show a confirmation message
      Alert.alert(
        'Relationships Saved',
        'You can edit these relationships anytime in the Patient Names section.'
      );
    } catch (error) {
      console.error('Error saving relationship data:', error);
    }
  };
  
  // Reset relationship mapping (for testing)
  const resetRelationshipMapping = async () => {
    try {
      await AsyncStorage.removeItem('relationshipsMapped');
      await AsyncStorage.removeItem('patientRelationships');
      setRelationshipsMapped(false);
      
      // Reset relationships in the patient list
      const updatedPatients = patients.map(p => ({ ...p, relationship: undefined }));
      setPatients(updatedPatients);
      
      Alert.alert('Relationships Reset', 'You will be prompted to set relationships again.');
    } catch (error) {
      console.error('Error resetting relationships:', error);
    }
  };
  
  // Load saved relationships when patients are loaded
  useEffect(() => {
    const loadSavedRelationships = async () => {
      if (patients.length > 0 && relationshipsMapped) {
        try {
          const savedRelationships = await AsyncStorage.getItem('patientRelationships');
          if (savedRelationships) {
            const relationshipData = JSON.parse(savedRelationships);
            console.log('Loading saved relationships from AsyncStorage:', relationshipData.length);
            
            // Apply saved relationships to the patient list
            const updatedPatients = patients.map(patient => {
              const savedRelationship = relationshipData.find((r: any) => r.id === patient.id);
              return {
                ...patient,
                relationship: savedRelationship ? savedRelationship.relationship : undefined
              };
            });
            
            setPatients(updatedPatients);
            
            // Synchronize family members with patients
            await syncFamilyMembersWithPatients();
          }
        } catch (error) {
          console.error('Error loading saved relationships:', error);
        }
      }
    };
    
    loadSavedRelationships();
  }, [patients.length, relationshipsMapped, familyMembers]);
  
  // Fetch linked account IDs when component mounts
  useEffect(() => {
    if (fastenDomain && authToken) {
      fetchLinkedAccountIds();
      // Automatically query patient data when the component mounts
      makeSecureQuery();
    }
  }, [fastenDomain, authToken]);
  
  // Function to make a POST request to the server's /api/secure/query endpoint
  const makeSecureQuery = async () => {
    if (!fastenDomain || !authToken) {
      // Don't show an alert, just log the error
      console.error('Domain or authentication token not available');
      return;
    }
    
    setIsLoadingQuery(true);
    setQueryResponse(null);
    
    try {
      // Construct the full URL for the secure query endpoint
      const queryUrl = `${fastenDomain}/api/secure/query`;
      console.log(`Making secure query to: ${queryUrl}`);
      
      // Request all patient information instead of specific fields
      const queryPayload = {
        "select": ["*"], // Select all fields
        "from": "Patient",
        "where": {}
      };
      
      console.log('Query payload:', JSON.stringify(queryPayload, null, 2));
      
      const response = await fetch(queryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(queryPayload),
      });
      
      const responseText = await response.text();
      console.log('Raw response:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
      
      // Try to parse as JSON, but handle non-JSON responses gracefully
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
        console.log('Response structure:', JSON.stringify({
          type: typeof data,
          isArray: Array.isArray(data),
          keys: typeof data === 'object' && data !== null ? Object.keys(data) : 'N/A',
          length: Array.isArray(data) ? data.length : 'N/A'
        }, null, 2));
      } catch (e) {
        // If not JSON, use the text as is
        console.error('Failed to parse JSON:', e);
        data = { rawResponse: responseText };
      }
      
      if (!response.ok) {
        console.error('Server error:', response.status, response.statusText);
        setQueryResponse({
          success: false,
          error: `Server returned ${response.status}: ${response.statusText}`,
          data: data
        });
        setPatients([]); // Clear patients on error
      } else {
        setQueryResponse({
          success: true,
          data: data
        });
        
        // Process patient data to extract names
        let extractedPatients: PatientData[] = [];
        
        // Handle different response formats
        if (Array.isArray(data)) {
          // Direct array of patients
          console.log('Processing array of patients, length:', data.length);
          extractedPatients = processPatientArray(data);
        } else if (data && typeof data === 'object') {
          // Check if it's a FHIR Bundle
          if (data.resourceType === 'Bundle' && Array.isArray(data.entry)) {
            console.log('Processing FHIR Bundle, entries:', data.entry.length);
            extractedPatients = processPatientArray(data.entry.map((entry: any) => entry.resource));
          } else if (data.results && Array.isArray(data.results)) {
            // Custom format with results array
            console.log('Processing results array, length:', data.results.length);
            extractedPatients = processPatientArray(data.results);
          } else if (data.patients && Array.isArray(data.patients)) {
            // Custom format with patients array
            console.log('Processing patients array, length:', data.patients.length);
            extractedPatients = processPatientArray(data.patients);
          } else if (data.data && Array.isArray(data.data)) {
            // Another common format with data array
            console.log('Processing data array, length:', data.data.length);
            extractedPatients = processPatientArray(data.data);
          } else if (data.rows && Array.isArray(data.rows)) {
            // SQL-like response format
            console.log('Processing rows array, length:', data.rows.length);
            extractedPatients = processPatientArray(data.rows);
          } else {
            // Single patient object
            console.log('Processing single patient object');
            const singlePatient = processPatient(data, 0);
            if (singlePatient) {
              extractedPatients = [singlePatient];
            }
          }
        }
        
        console.log('Extracted patients:', extractedPatients.length);
        if (extractedPatients.length > 0) {
          console.log('First patient:', JSON.stringify(extractedPatients[0], null, 2));
        } else {
          console.log('No patients extracted from response');
          
          // If no patients were extracted but we have data, log more details to help debug
          if (data && typeof data === 'object') {
            console.log('Response data keys:', Object.keys(data));
            console.log('Full response data:', JSON.stringify(data).substring(0, 1000) + '...');
          }
        }
        
        // Apply saved relationships to the extracted patients before setting state
        try {
          const savedRelationshipsStr = await AsyncStorage.getItem('patientRelationships');
          if (savedRelationshipsStr && relationshipsMapped) {
            const savedRelationships = JSON.parse(savedRelationshipsStr);
            console.log('Applying saved relationships to patients:', savedRelationships.length);
            
            // Apply saved relationships to the patient list
            extractedPatients = extractedPatients.map(patient => {
              const savedRelationship = savedRelationships.find((r: any) => r.id === patient.id);
              return {
                ...patient,
                relationship: savedRelationship ? savedRelationship.relationship : undefined
              };
            });
          }
        } catch (error) {
          console.error('Error applying saved relationships:', error);
        }
        
        setPatients(extractedPatients);
        
        // Synchronize family members with patients after loading
        if (relationshipsMapped) {
          try {
            await syncFamilyMembersWithPatients();
          } catch (error) {
            console.error('Error synchronizing family members after query:', error);
          }
        }
        
        // Update linked accounts with server info
        const serverInfo = {
          id: typeof data === 'object' && data !== null && 'id' in data ? data.id : 'Query Response',
          source: 'Secure Query API',
          lastAccessed: new Date().toISOString()
        };
        
        setLinkedAccounts(prev => {
          const exists = prev.some(acc => acc.source === 'Secure Query API');
          if (exists) {
            return prev.map(acc => 
              acc.source === 'Secure Query API' ? serverInfo : acc
            );
          } else {
            return [...prev, serverInfo];
          }
        });
      }
    } catch (error) {
      console.error('Error making secure query:', error);
      setQueryResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      setPatients([]); // Clear patients on error
    } finally {
      setIsLoadingQuery(false);
    }
  };
  
  // Helper function to process an array of patients
  const processPatientArray = (patients: any[]): PatientData[] => {
    if (!patients || !Array.isArray(patients)) {
      console.log('Invalid patients array:', patients);
      return [];
    }
    
    console.log(`Processing ${patients.length} patients`);
    
    // Check if the first patient has resource_raw to help with debugging
    if (patients.length > 0 && patients[0].resource_raw) {
      console.log('First patient has resource_raw field. Sample structure:', 
        JSON.stringify({
          id: patients[0].id,
          resource_raw_keys: Object.keys(patients[0].resource_raw),
          has_name: patients[0].resource_raw.name ? true : false,
          name_type: patients[0].resource_raw.name ? 
            (Array.isArray(patients[0].resource_raw.name) ? 'array' : typeof patients[0].resource_raw.name) : 'none'
        }, null, 2)
      );
    }
    
    return patients
      .map((patient, index) => processPatient(patient, index))
      .filter((patient): patient is PatientData => patient !== null);
  };
  
  // Helper function to process a single patient
  const processPatient = (patient: any, index: number): PatientData | null => {
    if (!patient) return null;
    
    // For debugging
    console.log(`Processing patient ${index}:`, JSON.stringify(patient, null, 2).substring(0, 200) + '...');
    
    // Extract ID
    let patientId = '';
    if (patient.id) {
      patientId = patient.id;
    } else if (patient.resource && patient.resource.id) {
      patientId = patient.resource.id;
    } else if (patient._id) {
      patientId = patient._id;
    } else if (patient.patientId) {
      patientId = patient.patientId;
    } else if (patient.source_resource_id && patient.source_resource_type === 'Patient') {
      // Fasten Health specific field
      patientId = patient.source_resource_id;
    } else {
      patientId = `patient-${index}`;
    }
    
    // Extract name from the patient data
    let patientName = 'Unknown';
    
    // Check if we have a resource_raw field (common in Fasten Health API responses)
    if (patient.resource_raw) {
      console.log(`Found resource_raw field in patient ${index}`);
      
      // Try to extract name from resource_raw
      let rawResource = patient.resource_raw;
      
      // If resource_raw is a string, try to parse it as JSON
      if (typeof rawResource === 'string') {
        try {
          console.log(`resource_raw is a string, attempting to parse as JSON`);
          rawResource = JSON.parse(rawResource);
        } catch (e) {
          console.error(`Failed to parse resource_raw as JSON:`, e);
        }
      }
      
      // Only proceed if rawResource is an object
      if (typeof rawResource === 'object' && rawResource !== null) {
        // Log the structure of resource_raw to help with debugging
        console.log(`resource_raw structure for patient ${index}:`, 
          JSON.stringify({
            keys: Object.keys(rawResource),
            id: rawResource.id,
            has_name: rawResource.name ? true : false,
            name_type: rawResource.name ? 
              (Array.isArray(rawResource.name) ? 'array' : typeof rawResource.name) : 'none'
          }, null, 2)
        );
        
        // Check for name in resource_raw
        if (rawResource.name) {
          console.log(`Found name field in resource_raw for patient ${index}`);
          
          if (Array.isArray(rawResource.name) && rawResource.name.length > 0) {
            // FHIR format - name is an array of name objects
            console.log(`Name is an array with ${rawResource.name.length} entries:`, 
              JSON.stringify(rawResource.name.map((n: any) => ({ 
                use: n.use, 
                text: n.text,
                family: n.family,
                given: n.given
              })), null, 2)
            );
            
            const nameObj = rawResource.name[0];
            
            // Look for the official name if available
            const officialName = rawResource.name.find((n: any) => n.use === 'official') || nameObj;
            
            if (officialName.text) {
              patientName = officialName.text;
              console.log(`Using text field for name: ${patientName}`);
            } else if (officialName.family || officialName.given) {
              const givenNames = Array.isArray(officialName.given) ? officialName.given.join(' ') : officialName.given || '';
              const familyName = typeof officialName.family === 'string' ? officialName.family : 
                                Array.isArray(officialName.family) ? officialName.family.join(' ') : '';
              patientName = `${givenNames} ${familyName}`.trim();
              console.log(`Constructed name from given/family: ${patientName}`);
            }
          } else if (typeof rawResource.name === 'object' && rawResource.name !== null) {
            // Single name object
            console.log(`Name is a single object:`, JSON.stringify(rawResource.name, null, 2));
            
            if (rawResource.name.text) {
              patientName = rawResource.name.text;
              console.log(`Using text field for name: ${patientName}`);
            } else if (rawResource.name.family || rawResource.name.given) {
              const givenNames = Array.isArray(rawResource.name.given) ? rawResource.name.given.join(' ') : rawResource.name.given || '';
              const familyName = typeof rawResource.name.family === 'string' ? rawResource.name.family : 
                                Array.isArray(rawResource.name.family) ? rawResource.name.family.join(' ') : '';
              patientName = `${givenNames} ${familyName}`.trim();
              console.log(`Constructed name from given/family: ${patientName}`);
            }
          }
        }
        
        // If we still don't have a name, check for a resource field that might contain the patient data
        if (patientName === 'Unknown' && rawResource.resource) {
          console.log(`Checking nested resource field in resource_raw`);
          const nestedResource = processPatient(rawResource.resource, index);
          if (nestedResource) {
            return nestedResource;
          }
        }
      }
    }
    
    // If we still don't have a name, try the standard approach
    if (patientName === 'Unknown') {
      // Try to get the name from different possible formats
      const nameData = patient.name || 
                      (patient.resource && patient.resource.name) || 
                      (patient.data && patient.data.name);
      
      if (nameData) {
        if (Array.isArray(nameData) && nameData.length > 0) {
          // If name is an array of name objects (FHIR format)
          const nameObj = nameData[0];
          if (nameObj.text) {
            patientName = nameObj.text;
          } else if (nameObj.family || nameObj.given) {
            const givenNames = Array.isArray(nameObj.given) ? nameObj.given.join(' ') : nameObj.given || '';
            const familyName = typeof nameObj.family === 'string' ? nameObj.family : 
                              Array.isArray(nameObj.family) ? nameObj.family.join(' ') : '';
            patientName = `${givenNames} ${familyName}`.trim();
          }
        } else if (typeof nameData === 'string') {
          // If name is directly a string
          patientName = nameData;
        } else if (typeof nameData === 'object' && nameData !== null) {
          // If name is a single name object
          if (nameData.text) {
            patientName = nameData.text;
          } else if (nameData.family || nameData.given) {
            const givenNames = Array.isArray(nameData.given) ? nameData.given.join(' ') : nameData.given || '';
            const familyName = typeof nameData.family === 'string' ? nameData.family : 
                              Array.isArray(nameData.family) ? nameData.family.join(' ') : '';
            patientName = `${givenNames} ${familyName}`.trim();
          }
        }
      }
    }
    
    // If we still don't have a name, try other fields that might contain name information
    if (patientName === 'Unknown') {
      if (patient.fullName) {
        patientName = patient.fullName;
      } else if (patient.displayName) {
        patientName = patient.displayName;
      } else if (patient.firstName && patient.lastName) {
        patientName = `${patient.firstName} ${patient.lastName}`;
      } else if (patient.givenName && patient.familyName) {
        patientName = `${patient.givenName} ${patient.familyName}`;
      } else if (patient.first_name && patient.last_name) {
        patientName = `${patient.first_name} ${patient.last_name}`;
      }
    }
    
    // If we still don't have a name, check if there's a nested patient object
    if (patientName === 'Unknown' && patient.patient) {
      const nestedPatient = processPatient(patient.patient, index);
      if (nestedPatient) {
        return nestedPatient;
      }
    }
    
    return {
      id: patientId,
      name: patientName
    };
  };
  
  // Function to fetch linked account IDs using FHIRPath query syntax
  const fetchLinkedAccountIds = async () => {
    if (!fastenDomain || !authToken) {
      setAccountError('Domain or authentication token not available');
      return;
    }
    
    setIsLoadingAccounts(true);
    setAccountError(null);
    
    // Try OAuth and metadata endpoints first
    const endpoints = [
      '/.well-known/smart-configuration',  // SMART on FHIR OAuth config
      '/metadata',                         // FHIR capability statement
      '/api/metadata',                     // Alternative metadata path
    ];
    
    try {
      // Try each endpoint
      for (const endpoint of endpoints) {
        try {
          const url = `${fastenDomain}${endpoint}`;
          console.log(`Trying endpoint: ${url}`);
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
          });
          
          if (!response.ok) {
            console.log(`Endpoint ${endpoint} failed with status ${response.status}`);
            continue;
          }
          
          const responseText = await response.text();
          if (!responseText.trim()) continue;
          
          const data = JSON.parse(responseText);
          console.log(`Successful response from ${endpoint}`);
          
          // Extract account IDs based on the endpoint type
          if (endpoint.includes('well-known')) {
            // Process OAuth configuration
            const clientIds = data.client_id_issued_at ? ['OAuth Client'] : [];
            const accounts = clientIds.map(id => ({
              id,
              source: 'OAuth Configuration',
              lastAccessed: new Date().toISOString()
            }));
            
            if (accounts.length > 0) {
              setLinkedAccounts(accounts);
              return;
            }
          } else if (endpoint.includes('metadata')) {
            // Process capability statement
            const serverName = data.software?.name || 'FHIR Server';
            const serverId = data.id || data.software?.version || 'Unknown';
            
            setLinkedAccounts([{
              id: serverId,
              source: serverName,
              lastAccessed: data.date || new Date().toISOString()
            }]);
            return;
          }
        } catch (error) {
          console.log(`Error with endpoint ${endpoint}:`, error);
        }
      }
      
      // If we get here, try a direct root request
      try {
        const rootUrl = fastenDomain;
        console.log(`Trying root endpoint: ${rootUrl}`);
        
        const response = await fetch(rootUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (response.ok) {
          // If we get a successful response, try to extract server info
          setLinkedAccounts([{
            id: 'Server Root',
            source: fastenDomain,
            lastAccessed: new Date().toISOString()
          }]);
          return;
        }
      } catch (error) {
        console.log('Error with root endpoint:', error);
      }
      
      throw new Error('No valid OAuth or server information found');
    } catch (error) {
      console.error('Error fetching server information:', error);
      setAccountError('Could not retrieve server information. Try checking the server URL.');
    } finally {
      setIsLoadingAccounts(false);
    }
  };
  
  const handleGoBack = () => {
    router.back();
  };

  const handleResetDomain = () => {
    Alert.alert(
      'Reset Domain',
      'Are you sure you want to reset your domain? This will sign you out and clear all settings.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            try {
              // Clear both domains and sign out
              await setFastenDomain('');
              await setLlmDomain('');
              await signOut();
              router.replace('/auth/domain');
            } catch (error) {
              console.error('Error resetting domain:', error);
              setError('Failed to reset domain. Please try again.');
              setShowErrorDialog(true);
            } finally {
              setIsResetting(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };
  
  const handleAddFamilyMember = () => {
    if (!newMemberName.trim() || !newMemberRelation.trim()) {
      Alert.alert('Error', 'Please enter both name and relation');
      return;
    }
    
    const newMember: FamilyMember = {
      id: Date.now().toString(),
      name: newMemberName.trim(),
      relation: newMemberRelation.trim(),
      sharedCategories: []
    };
    
    setFamilyMembers([...familyMembers, newMember]);
    setNewMemberName('');
    setNewMemberRelation('');
    setAddMemberDialogVisible(false);
  };
  
  const handleRemoveFamilyMember = (id: string) => {
    Alert.alert(
      'Remove Family Member',
      'Are you sure you want to remove this family member?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setFamilyMembers(familyMembers.filter(member => member.id !== id));
          }
        }
      ]
    );
  };
  
  const handleOpenSharingDialog = (member: FamilyMember) => {
    setSelectedMember(member);
    setSharingDialogVisible(true);
  };
  
  const handleToggleSharing = (categoryId: string) => {
    if (!selectedMember) return;
    
    const updatedMembers = familyMembers.map(member => {
      if (member.id === selectedMember.id) {
        const category = sharingCategories.find(c => c.id === categoryId)?.name;
        if (!category) return member;
        
        if (member.sharedCategories.includes(category)) {
          return {
            ...member,
            sharedCategories: member.sharedCategories.filter(c => c !== category)
          };
        } else {
          return {
            ...member,
            sharedCategories: [...member.sharedCategories, category]
          };
        }
      }
      return member;
    });
    
    setFamilyMembers(updatedMembers);
    // Update the selected member to reflect changes in the dialog
    setSelectedMember(updatedMembers.find(m => m.id === selectedMember.id) || null);
  };
  
  const handleToggleGlobalSharing = (categoryId: string) => {
    setSharingCategories(sharingCategories.map(category => 
      category.id === categoryId 
        ? { ...category, isShared: !category.isShared } 
        : category
    ));
  };

  // Add a retry mechanism if the first query fails
  useEffect(() => {
    // If we have a failed query and we're not currently loading, try again after a delay
    if (queryResponse && !queryResponse.success && !isLoadingQuery) {
      const retryTimer = setTimeout(() => {
        console.log('Automatically retrying failed query...');
        makeSecureQuery();
      }, 5000); // Retry after 5 seconds
      
      return () => clearTimeout(retryTimer);
    }
  }, [queryResponse, isLoadingQuery]);

  // Handle pull-to-refresh
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    makeSecureQuery().then(() => setRefreshing(false));
  }, []);

  // Get the current patient for the relationship dialog
  const getCurrentPatient = () => {
    // Skip patients already marked as 'Self'
    let index = currentPatientIndex;
    while (index < patients.length && patients[index].relationship === 'Self') {
      index++;
    }
    
    return index < patients.length ? patients[index] : null;
  };

  // Load family members when component mounts
  useEffect(() => {
    const loadFamilyMembers = async () => {
      try {
        const savedFamilyMembers = await AsyncStorage.getItem('familyMembers');
        if (savedFamilyMembers) {
          setFamilyMembers(JSON.parse(savedFamilyMembers));
        }
      } catch (error) {
        console.error('Error loading family members:', error);
      }
    };
    
    loadFamilyMembers();
  }, []);

  // Function to edit a patient's relationship
  const editPatientRelationship = (patientId: string) => {
    // Find the patient
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    // Set up the dialog for editing
    setSelectedRelationship(patient.relationship || '');
    setCustomRelationship(
      RELATIONSHIPS.includes(patient.relationship || '') ? '' : (patient.relationship || '')
    );
    
    // Find the index of this patient
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex >= 0) {
      setCurrentPatientIndex(patientIndex);
      
      // Set a flag to indicate we're editing a single patient
      setEditingSinglePatient(true);
      
      // Show the dialog
      setShowRelationshipDialog(true);
    }
  };

  // Load saved settings when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [privacySetting, notificationSetting] = await Promise.all([
          AsyncStorage.getItem('privacyMode'),
          AsyncStorage.getItem('notificationsEnabled')
        ]);
        
        if (privacySetting !== null) {
          setPrivacyMode(privacySetting === 'true');
        }
        
        if (notificationSetting !== null) {
          setNotificationsEnabled(notificationSetting === 'true');
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setError('Failed to load settings. Please try again.');
      }
    };
    
    loadSettings();
  }, []);

  // Save settings when they change
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem('privacyMode', privacyMode.toString());
        await AsyncStorage.setItem('notificationsEnabled', notificationsEnabled.toString());
      } catch (error) {
        console.error('Error saving settings:', error);
        setError('Failed to save settings. Please try again.');
      }
    };
    
    saveSettings();
  }, [privacyMode, notificationsEnabled]);

  // Domain management functions
  const handleUpdateDomain = async () => {
    if (!newDomain.trim()) {
      setError('Please enter a valid domain');
      setShowErrorDialog(true);
      return;
    }

    try {
      const formattedDomain = newDomain.startsWith('http') ? newDomain : `https://${newDomain}`;
      await setFastenDomain(formattedDomain);
      setShowDomainInput(false);
      setNewDomain('');
      Alert.alert('Success', 'Domain updated successfully');
    } catch (error) {
      console.error('Error updating domain:', error);
      setError('Failed to update domain. Please try again.');
      setShowErrorDialog(true);
    }
  };

  const handleUpdateLlmDomain = async () => {
    if (!newLlmDomain.trim()) {
      setError('Please enter a valid LLM domain');
      setShowErrorDialog(true);
      return;
    }

    try {
      const formattedDomain = newLlmDomain.startsWith('http') ? newLlmDomain : `https://${newLlmDomain}`;
      await setLlmDomain(formattedDomain);
      setShowLlmDomainInput(false);
      setNewLlmDomain('');
      Alert.alert('Success', 'LLM Domain updated successfully');
    } catch (error) {
      console.error('Error updating LLM domain:', error);
      setError('Failed to update LLM domain. Please try again.');
      setShowErrorDialog(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Appbar.Header>
        <Appbar.BackAction onPress={handleGoBack} />
        <Appbar.Content title="Settings" />
      </Appbar.Header>
      
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Patient Names Card */}
        <Card style={styles.card}>
          <Card.Title 
            title="Patient Names" 
            right={(props) => (
              <View style={styles.cardActions}>
                <IconButton {...props} icon="refresh" onPress={makeSecureQuery} style={styles.actionIcon} />
              </View>
            )} 
          />
          <Card.Content>
            {isLoadingQuery ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
                <Text style={styles.loadingText}>Loading patient information...</Text>
              </View>
            ) : queryResponse && queryResponse.success === false ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error loading patient data</Text>
                <Text style={styles.errorDetails}>{queryResponse.error}</Text>
                <Button mode="contained" onPress={makeSecureQuery} style={styles.actionButton}>
                  Retry
                </Button>
              </View>
            ) : patients.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No patient records found</Text>
                <Text style={styles.emptySubtext}>Pull down to refresh or tap the refresh button</Text>
              </View>
            ) : (
              <View style={styles.patientsContainer}>
                {/* Filter patients to only show those with no relationship or "THAT'S ME!" */}
                {patients
                  .filter(patient => !patient.relationship || patient.relationship === 'THAT\'S ME!')
                  .map((patient, index, filteredArray) => (
                    <React.Fragment key={patient.id}>
                      <List.Item
                        title={patient.name}
                        description={patient.relationship ? 
                          `Relationship: ${patient.relationship}` : 
                          'No relationship set'
                        }
                        descriptionStyle={styles.patientIdText}
                        left={props => <Avatar.Icon {...props} size={40} icon="account" />}
                        onPress={() => patient.relationship !== 'THAT\'S ME!' && editPatientRelationship(patient.id)}
                        right={props => patient.relationship !== 'THAT\'S ME!' && (
                          <IconButton
                            {...props}
                            icon="pencil"
                            size={20}
                            onPress={() => editPatientRelationship(patient.id)}
                          />
                        )}
                      />
                      {index < filteredArray.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
              </View>
            )}
          </Card.Content>
        </Card>
        
        {/* Family Sharing Card */}
        <Card style={styles.card}>
          <Card.Title title="Family Sharing" />
          <Card.Content>
            {familyMembers.length === 0 ? (
              <Text style={styles.emptyText}>No family members added yet</Text>
            ) : (
              familyMembers.map(member => (
                <View key={member.id} style={styles.memberContainer}>
                  <List.Item
                    title={member.name}
                    description={member.relation}
                    left={props => <Avatar.Icon {...props} icon="account" />}
                    right={props => (
                      <IconButton
                        {...props}
                        icon="dots-vertical"
                        onPress={() => handleOpenSharingDialog(member)}
                      />
                    )}
                  />
                  <View style={styles.chipContainer}>
                    {member.sharedCategories.map(category => (
                      <Chip key={category} style={styles.chip}>{category}</Chip>
                    ))}
                  </View>
                  <Divider />
                </View>
              ))
            )}
          </Card.Content>
        </Card>
        
        {/* Privacy & Notifications Card */}
        <Card style={styles.card}>
          <Card.Title title="Privacy & Notifications" />
          <Card.Content>
            <List.Item
              title="Privacy Mode"
              description="Temporarily pause all data sharing"
              left={props => <List.Icon {...props} icon="shield" />}
              right={props => (
                <Switch
                  value={privacyMode}
                  onValueChange={setPrivacyMode}
                />
              )}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Notifications"
              description="Get notified about important updates"
              left={props => <List.Icon {...props} icon="bell" />}
              right={props => (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Domain Settings Card */}
        <Card style={styles.card}>
          <Card.Title title="Domain Settings" />
          <Card.Content>
            <List.Item
              title="Current Domain"
              description={fastenDomain || 'Not set'}
              descriptionNumberOfLines={3}
              descriptionStyle={styles.domainText}
              right={props => (
                <Button
                  mode="text"
                  onPress={() => {
                    setShowDomainInput(!showDomainInput);
                    setNewDomain('');
                  }}
                >
                  {showDomainInput ? 'Cancel' : 'Change'}
                </Button>
              )}
            />

            {showDomainInput && (
              <View style={styles.inputContainer}>
                <TextInput
                  label="New Domain"
                  value={newDomain}
                  onChangeText={setNewDomain}
                  mode="outlined"
                  style={styles.input}
                  placeholder="https://your-domain.com"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Button
                  mode="contained"
                  onPress={handleUpdateDomain}
                  style={styles.updateButton}
                >
                  Update
                </Button>
              </View>
            )}

            <Divider style={styles.divider} />

            <List.Item
              title="LLM Domain"
              description={llmDomain || 'Not set'}
              descriptionNumberOfLines={3}
              descriptionStyle={styles.domainText}
              right={props => (
                <Button
                  mode="text"
                  onPress={() => {
                    setShowLlmDomainInput(!showLlmDomainInput);
                    setNewLlmDomain('');
                  }}
                >
                  {showLlmDomainInput ? 'Cancel' : 'Change'}
                </Button>
              )}
            />

            {showLlmDomainInput && (
              <View style={styles.inputContainer}>
                <TextInput
                  label="New LLM Domain"
                  value={newLlmDomain}
                  onChangeText={setNewLlmDomain}
                  mode="outlined"
                  style={styles.input}
                  placeholder="https://your-llm-domain.com"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Button
                  mode="contained"
                  onPress={handleUpdateLlmDomain}
                  style={styles.updateButton}
                >
                  Update
                </Button>
              </View>
            )}

            <Divider style={styles.divider} />

            <Button
              mode="outlined"
              onPress={handleResetDomain}
              loading={isResetting}
              disabled={isResetting}
              style={[styles.button, styles.resetButton]}
              textColor="#f44336"
              icon="delete"
            >
              Reset Domain
            </Button>
          </Card.Content>
        </Card>
        
        {/* Account Card */}
        <Card style={styles.card}>
          <Card.Title title="Account" />
          <Card.Content>
            {authToken ? (
              <Button
                mode="outlined"
                onPress={handleSignOut}
                style={styles.button}
                icon="logout"
              >
                Sign Out
              </Button>
            ) : (
              <Button
                mode="outlined"
                onPress={() => router.push('/auth/login')}
                style={styles.button}
                icon="login"
              >
                Sign In
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* About Card */}
        <Card style={styles.card}>
          <Card.Title title="About" />
          <Card.Content>
            <Text variant="bodyLarge" style={styles.aboutTitle}>VitalSight App</Text>
            <Text variant="bodyMedium" style={styles.aboutText}>
              Connect and manage your health data from multiple sources in one secure place.
            </Text>
            <Divider style={styles.divider} />
            <List.Item
              title="Version"
              description="1.0.0"
              left={props => <List.Icon {...props} icon="information" />}
            />
            <List.Item
              title="Build"
              description={`${Platform.OS === 'ios' ? 'iOS' : 'Android'} ${Platform.Version}`}
              left={props => <List.Icon {...props} icon="cellphone" />}
            />
            <List.Item
              title="Support"
              description="help@vitalsight.com"
              left={props => <List.Icon {...props} icon="email" />}
            />
          </Card.Content>
        </Card>
      </ScrollView>
      
      {/* Error Dialog */}
      <Portal>
        <Dialog visible={showErrorDialog} onDismiss={() => setShowErrorDialog(false)}>
          <Dialog.Title>Error</Dialog.Title>
          <Dialog.Content>
            <Text>{error}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowErrorDialog(false)}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* Add Family Member Dialog */}
      <Portal>
        <Dialog visible={addMemberDialogVisible} onDismiss={() => setAddMemberDialogVisible(false)}>
          <Dialog.Title>Add Family Member</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Name"
              value={newMemberName}
              onChangeText={setNewMemberName}
              style={styles.dialogInput}
            />
            <TextInput
              label="Relation"
              value={newMemberRelation}
              onChangeText={setNewMemberRelation}
              style={styles.dialogInput}
              placeholder="e.g. Mother, Father, Child"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddMemberDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleAddFamilyMember}>Add</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* Sharing Settings Dialog */}
      <Portal>
        <Dialog visible={sharingDialogVisible} onDismiss={() => setSharingDialogVisible(false)}>
          <Dialog.Title>
            Sharing with {selectedMember?.name}
          </Dialog.Title>
          <Dialog.Content>
            {sharingCategories.map(category => (
              <List.Item
                key={category.id}
                title={category.name}
                left={props => <List.Icon {...props} icon={category.icon} />}
                right={props => (
                  <Switch
                    value={selectedMember?.sharedCategories.includes(category.name) || false}
                    onValueChange={() => handleToggleSharing(category.id)}
                  />
                )}
              />
            ))}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => handleRemoveFamilyMember(selectedMember?.id || '')}>Remove</Button>
            <Button onPress={() => setSharingDialogVisible(false)}>Done</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* Relationship Mapping Dialog */}
      <Portal>
        <Dialog 
          visible={showRelationshipDialog} 
          dismissable={editingSinglePatient}
          style={styles.relationshipDialog}
        >
          <Dialog.Title>{editingSinglePatient ? 'Edit Relationship' : 'Identify Relationship'}</Dialog.Title>
          <Dialog.Content>
            {getCurrentPatient() ? (
              <>
                <Text style={styles.relationshipQuestion}>
                  What is your relationship to:
                </Text>
                <Text style={styles.patientName}>
                  {getCurrentPatient()?.name}
                </Text>
                
                <RadioButton.Group 
                  onValueChange={value => setSelectedRelationship(value)} 
                  value={selectedRelationship}
                >
                  {RELATIONSHIPS.map(relationship => (
                    <RadioButton.Item 
                      key={relationship}
                      label={relationship} 
                      value={relationship}
                      style={styles.radioItem}
                      disabled={['Mother', 'Father'].includes(relationship) && 
                                usedRelationships.includes(relationship)}
                    />
                  ))}
                </RadioButton.Group>
                
                {selectedRelationship === 'Other' && (
                  <TextInput
                    label="Specify relationship"
                    value={customRelationship}
                    onChangeText={setCustomRelationship}
                    style={styles.customRelationshipInput}
                  />
                )}
              </>
            ) : (
              <Text>No more patients to identify</Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            {editingSinglePatient && (
              <Button onPress={() => {
                setShowRelationshipDialog(false);
                setEditingSinglePatient(false);
              }}>
                Cancel
              </Button>
            )}
            <Button mode="contained" onPress={handleRelationshipSelect}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  memberContainer: {
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 72,
    marginBottom: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 16,
    color: '#666',
  },
  domainText: {
    flexWrap: 'wrap',
    marginTop: 4,
  },
  dialogInput: {
    marginBottom: 16,
  },
  sharingNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
  actionButton: {
    marginTop: 8,
    minWidth: 120,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    marginLeft: 8,
  },
  queryButton: {
    marginTop: 16,
    alignSelf: 'center',
  },
  queryResponseContainer: {
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginTop: 8,
  },
  queryResponseSuccess: {
    color: 'green',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  queryResponseError: {
    color: 'red',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  queryResponseDetails: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  sectionDivider: {
    marginVertical: 16,
  },
  patientsContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptySubtext: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  patientIdText: {
    fontSize: 12,
    color: '#666',
  },
  errorDetails: {
    color: '#666',
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  relationshipDialog: {
    maxHeight: '80%',
  },
  relationshipQuestion: {
    fontSize: 16,
    marginBottom: 8,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  radioItem: {
    paddingVertical: 4,
  },
  customRelationshipInput: {
    marginTop: 8,
  },
  button: {
    marginTop: 8,
  },
  resetButton: {
    borderColor: '#f44336',
  },
  divider: {
    marginVertical: 16,
  },
  inputContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
  },
  updateButton: {
    alignSelf: 'flex-end',
  },
  aboutTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  aboutText: {
    marginBottom: 16,
    lineHeight: 20,
  },
}); 