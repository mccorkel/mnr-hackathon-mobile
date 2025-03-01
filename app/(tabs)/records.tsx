import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, List, Divider, Button, Searchbar, ActivityIndicator, Modal, Portal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFasten } from '@/hooks/useFasten';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Interface for medical record
interface MedicalRecord {
  id: string;
  title: string;
  date?: string;
  provider?: string;
  category?: string;
  resourceType?: string;
}

// Interface for query response
interface QueryResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export default function RecordsScreen() {
  const { fastenDomain, authToken, refreshToken } = useFasten();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [queryResponse, setQueryResponse] = useState<QueryResponse | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selfPatientId, setSelfPatientId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Categories for medical records
  const [categories, setCategories] = useState([
    { name: 'Lab Results', count: 0 },
    { name: 'Medications', count: 0 },
    { name: 'Imaging', count: 0 },
    { name: 'Conditions', count: 0 },
    { name: 'Visits', count: 0 }
  ]);

  // Load the "THAT'S ME!" patient ID when component mounts
  useEffect(() => {
    const loadSelfPatientId = async () => {
      try {
        const savedRelationshipsStr = await AsyncStorage.getItem('patientRelationships');
        if (savedRelationshipsStr) {
          const savedRelationships = JSON.parse(savedRelationshipsStr);
          // Find the patient with "THAT'S ME!" relationship
          const selfPatient = savedRelationships.find((r: any) => r.relationship === 'THAT\'S ME!');
          if (selfPatient) {
            console.log('Found self patient ID:', selfPatient.id);
            setSelfPatientId(selfPatient.id);
          } else {
            console.log('No self patient found in saved relationships');
          }
        }
      } catch (error) {
        console.error('Error loading self patient ID:', error);
      }
    };
    
    loadSelfPatientId();
  }, []);

  // Fetch medical records when component mounts or selfPatientId changes
  useEffect(() => {
    if (fastenDomain && authToken && selfPatientId) {
      fetchMedicalRecords();
    }
  }, [fastenDomain, authToken, selfPatientId]);

  // Function to make a secure query for medical records
  const fetchMedicalRecords = async () => {
    if (!fastenDomain || !authToken) {
      console.error('Domain or authentication token not available');
      setErrorMessage('Authentication information is missing. Please log in again.');
      return;
    }
    
    if (!selfPatientId) {
      console.error('Self patient ID not available');
      setErrorMessage('Patient information is missing. Please set a patient as "THAT\'S ME!" in Settings.');
      return;
    }
    
    setIsLoadingRecords(true);
    setQueryResponse(null);
    setErrorMessage(null);
    
    try {
      // Construct the full URL for the secure query endpoint
      const queryUrl = `${fastenDomain}/api/secure/query`;
      console.log(`Making secure query to: ${queryUrl}`);
      console.log(`Using patient ID: ${selfPatientId}`);
      
      let allRecords: any[] = [];
      
      // Define queries based on the example format
      const queries = [
        // Lab Results
        {
          from: "DiagnosticReport",
          select: ["*"]
        },
        // Observations
        {
          from: "Observation",
          select: ["*"]
        },
        // Medications (prescriptions)
        {
          from: "MedicationRequest",
          select: ["*"]
        },
        // Medications (statements)
        {
          from: "MedicationStatement",
          select: ["*"]
        },
        // Conditions (diagnoses)
        {
          from: "Condition",
          select: ["*"]
        },
        // Procedures
        {
          from: "Procedure",
          select: ["*"]
        },
        // Encounters/Visits
        {
          from: "Encounter",
          select: ["*"]
        },
        // Patient information
        {
          from: "Patient",
          select: ["*"]
        }
      ];
      
      // Execute each query
      for (const query of queries) {
        console.log(`Querying for ${query.from}:`, JSON.stringify(query, null, 2));
        
        try {
          const response = await fetch(queryUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify(query),
          });
          
          console.log(`${query.from} response status:`, response.status);
          
          // Handle token expiration (401 Unauthorized)
          if (response.status === 401) {
            console.log('Token expired, attempting to refresh...');
            
            // Try to refresh the token if a refresh function is available
            if (refreshToken) {
              const refreshed = await refreshToken();
              if (refreshed) {
                console.log('Token refreshed successfully, retrying query');
                
                // Retry the query with the new token
                const retryResponse = await fetch(queryUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`, // Should now have the new token
                  },
                  body: JSON.stringify(query),
                });
                
                if (retryResponse.ok) {
                  // Process the retry response
                  const responseText = await retryResponse.text();
                  console.log(`${query.from} retry response received`);
                  
                  let data;
                  try {
                    data = JSON.parse(responseText);
                  } catch (e) {
                    console.error(`Error parsing ${query.from} retry response:`, e);
                    continue;
                  }
                  
                  // Extract records from the response (same logic as below)
                  let records: any[] = [];
                  
                  if (Array.isArray(data)) {
                    records = data;
                  } else if (data && typeof data === 'object') {
                    if (data.resourceType === 'Bundle' && Array.isArray(data.entry)) {
                      records = data.entry.map((entry: any) => entry.resource);
                    } else if (data.results && Array.isArray(data.results)) {
                      records = data.results;
                    } else if (data.data && Array.isArray(data.data)) {
                      records = data.data;
                    } else if (data.rows && Array.isArray(data.rows)) {
                      records = data.rows;
                    } else if (data.resourceType) {
                      // Single resource
                      records = [data];
                    }
                  }
                  
                  console.log(`Found ${records.length} ${query.from} records after token refresh`);
                  
                  // Add resource type to each record if not present
                  records.forEach(record => {
                    if (!record.resourceType) {
                      record.resourceType = query.from;
                    }
                  });
                  
                  // Add records to the collection
                  allRecords = [...allRecords, ...records];
                  continue; // Continue to next query after successful retry
                } else {
                  console.error(`Retry query for ${query.from} failed after token refresh:`, retryResponse.status);
                }
              } else {
                console.error('Token refresh failed');
              }
            }
            
            // If we reach here, either there's no refresh function or refresh/retry failed
            console.error(`Query for ${query.from} failed due to expired token`);
            // Continue with other queries instead of stopping completely
            continue;
          }
          
          if (response.ok) {
            const responseText = await response.text();
            console.log(`${query.from} raw response:`, responseText.substring(0, 200) + '...');
            
            let data;
            try {
              data = JSON.parse(responseText);
              
              // Check for {"success": false} error pattern
              if (data && data.success === false) {
                console.error(`Query for ${query.from} returned success: false`);
                
                // Log additional details if available
                if (data.error) {
                  console.error(`Error message: ${data.error}`);
                }
                if (data.message) {
                  console.error(`Message: ${data.message}`);
                }
                
                // Set a user-friendly error message
                setErrorMessage(`The server returned an error for ${query.from} records. This may be due to server limitations or configuration issues. We'll try a simpler approach.`);
                
                // Try a simpler query as a fallback
                console.log(`Attempting fallback query for ${query.from}...`);
                
                // Create a simpler query with minimal parameters
                const fallbackQuery = {
                  from: query.from,
                  select: ["*"],
                  limit: 10
                };
                
                console.log(`Fallback query:`, JSON.stringify(fallbackQuery, null, 2));
                
                try {
                  const fallbackResponse = await fetch(queryUrl, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Accept': 'application/json',
                      'Authorization': `Bearer ${authToken}`,
                    },
                    body: JSON.stringify(fallbackQuery),
                  });
                  
                  if (fallbackResponse.ok) {
                    const fallbackText = await fallbackResponse.text();
                    console.log(`Fallback ${query.from} response received`);
                    
                    try {
                      const fallbackData = JSON.parse(fallbackText);
                      
                      // Check if the fallback was successful
                      if (fallbackData && fallbackData.success === false) {
                        console.error(`Fallback query also failed with success: false`);
                        continue; // Skip to next query
                      }
                      
                      // Process the fallback data
                      let fallbackRecords: any[] = [];
                      
                      if (Array.isArray(fallbackData)) {
                        fallbackRecords = fallbackData;
                      } else if (fallbackData && typeof fallbackData === 'object') {
                        if (fallbackData.resourceType === 'Bundle' && Array.isArray(fallbackData.entry)) {
                          fallbackRecords = fallbackData.entry.map((entry: any) => entry.resource);
                        } else if (fallbackData.results && Array.isArray(fallbackData.results)) {
                          fallbackRecords = fallbackData.results;
                        } else if (fallbackData.data && Array.isArray(fallbackData.data)) {
                          fallbackRecords = fallbackData.data;
                        } else if (fallbackData.rows && Array.isArray(fallbackData.rows)) {
                          fallbackRecords = fallbackData.rows;
                        } else if (fallbackData.resourceType) {
                          // Single resource
                          fallbackRecords = [fallbackData];
                        }
                      }
                      
                      console.log(`Found ${fallbackRecords.length} ${query.from} records from fallback query`);
                      
                      // Add resource type to each record if not present
                      fallbackRecords.forEach(record => {
                        if (!record.resourceType) {
                          record.resourceType = query.from;
                        }
                      });
                      
                      // Add records to the collection
                      allRecords = [...allRecords, ...fallbackRecords];
                      
                    } catch (e) {
                      console.error(`Error parsing fallback ${query.from} response:`, e);
                    }
                  } else {
                    console.error(`Fallback query for ${query.from} failed:`, fallbackResponse.status);
                  }
                } catch (e) {
                  console.error(`Error executing fallback query for ${query.from}:`, e);
                }
                
                continue; // Skip to next query after trying fallback
              }
              
              // Continue with normal processing if success is not false
              console.log(`${query.from} response received, type:`, typeof data);
              if (Array.isArray(data)) {
                console.log(`${query.from} response is an array of length:`, data.length);
              } else if (data && typeof data === 'object') {
                console.log(`${query.from} response keys:`, Object.keys(data));
              }
              
              // Extract records from the response
              let records: any[] = [];
              
              if (Array.isArray(data)) {
                records = data;
              } else if (data && typeof data === 'object') {
                if (data.resourceType === 'Bundle' && Array.isArray(data.entry)) {
                  records = data.entry.map((entry: any) => entry.resource);
                } else if (data.results && Array.isArray(data.results)) {
                  records = data.results;
                } else if (data.data && Array.isArray(data.data)) {
                  records = data.data;
                } else if (data.rows && Array.isArray(data.rows)) {
                  records = data.rows;
                } else if (data.resourceType) {
                  // Single resource
                  records = [data];
                }
              }
              
              console.log(`Found ${records.length} ${query.from} records`);
              
              // Add resource type to each record if not present
              records.forEach(record => {
                if (!record.resourceType) {
                  record.resourceType = query.from;
                }
              });
              
              // Add records to the collection
              allRecords = [...allRecords, ...records];
            } catch (e) {
              console.error(`Error parsing ${query.from} response:`, e);
            }
          } else {
            console.error(`Query for ${query.from} failed:`, response.status);
            // Try to get more error details
            try {
              const errorText = await response.text();
              console.error(`Error details: ${errorText}`);
              
              // Try to parse the error response
              try {
                const errorData = JSON.parse(errorText);
                console.error('Parsed error data:', errorData);
                
                // Check for specific error patterns
                if (errorData.error) {
                  console.error('Error message:', errorData.error);
                  setErrorMessage(`Server error: ${errorData.error}`);
                } else if (errorData.message) {
                  console.error('Message:', errorData.message);
                  setErrorMessage(`Server message: ${errorData.message}`);
                } else if (errorData.success === false) {
                  setErrorMessage(`The server could not process the ${query.from} query. This may be due to server limitations.`);
                }
              } catch (e) {
                // Not JSON, just log the raw text
                console.error('Raw error text:', errorText);
                setErrorMessage(`The server returned an unexpected response. Please try again later.`);
              }
            } catch (e) {
              console.error('Could not read error details');
            }
            
            // Try a simpler query as a fallback for non-401 errors
            if (response.status !== 401) {
              console.log(`Attempting fallback query for ${query.from}...`);
              
              // Create a simpler query with minimal parameters
              const fallbackQuery = {
                from: query.from,
                select: ["*"],
                limit: 10
              };
              
              console.log(`Fallback query:`, JSON.stringify(fallbackQuery, null, 2));
              
              try {
                const fallbackResponse = await fetch(queryUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                  },
                  body: JSON.stringify(fallbackQuery),
                });
                
                if (fallbackResponse.ok) {
                  const fallbackText = await fallbackResponse.text();
                  console.log(`Fallback ${query.from} response received`);
                  
                  try {
                    const fallbackData = JSON.parse(fallbackText);
                    
                    // Process the fallback data
                    let fallbackRecords: any[] = [];
                    
                    if (Array.isArray(fallbackData)) {
                      fallbackRecords = fallbackData;
                    } else if (fallbackData && typeof fallbackData === 'object') {
                      if (fallbackData.resourceType === 'Bundle' && Array.isArray(fallbackData.entry)) {
                        fallbackRecords = fallbackData.entry.map((entry: any) => entry.resource);
                      } else if (fallbackData.results && Array.isArray(fallbackData.results)) {
                        fallbackRecords = fallbackData.results;
                      } else if (fallbackData.data && Array.isArray(fallbackData.data)) {
                        fallbackRecords = fallbackData.data;
                      } else if (fallbackData.rows && Array.isArray(fallbackData.rows)) {
                        fallbackRecords = fallbackData.rows;
                      } else if (fallbackData.resourceType) {
                        // Single resource
                        fallbackRecords = [fallbackData];
                      }
                    }
                    
                    console.log(`Found ${fallbackRecords.length} ${query.from} records from fallback query`);
                    
                    // Add resource type to each record if not present
                    fallbackRecords.forEach(record => {
                      if (!record.resourceType) {
                        record.resourceType = query.from;
                      }
                    });
                    
                    // Add records to the collection
                    allRecords = [...allRecords, ...fallbackRecords];
                    
                  } catch (e) {
                    console.error(`Error parsing fallback ${query.from} response:`, e);
                  }
                } else {
                  console.error(`Fallback query for ${query.from} failed:`, fallbackResponse.status);
                }
              } catch (e) {
                console.error(`Error executing fallback query for ${query.from}:`, e);
              }
            }
          }
        } catch (error) {
          console.error(`Error querying ${query.from}:`, error);
        }
      }
      
      // Process all collected records
      console.log('Total records collected:', allRecords.length);
      
      if (allRecords.length > 0) {
        // Log the first record to see its structure
        if (allRecords.length > 0) {
          console.log('First record structure:', JSON.stringify(allRecords[0], null, 2));
          
          // Check if we're dealing with Fasten-wrapped records
          const hasResourceRaw = allRecords[0].resource_raw !== undefined;
          if (hasResourceRaw) {
            console.log('Detected Fasten-wrapped records with resource_raw field');
          }
        }
        
        // Filter records to only include those for our patient
        const patientRecords = allRecords.filter(record => {
          // For Fasten-wrapped records, check the source_resource_id
          if (record.source_resource_type === 'Patient' && record.source_resource_id === selfPatientId) {
            return true;
          }
          
          // Skip filtering for Patient resources that match our ID
          if (record.resourceType === 'Patient' && record.id === selfPatientId) {
            return true;
          }
          
          // For Fasten-wrapped records, check if this record belongs to our patient
          if (record.resource_raw) {
            const rawResource = record.resource_raw;
            
            // Check subject reference in the raw resource
            if (rawResource.subject && rawResource.subject.reference === `Patient/${selfPatientId}`) {
              return true;
            }
            
            // Check patient reference in the raw resource
            if (rawResource.patient && rawResource.patient.reference === `Patient/${selfPatientId}`) {
              return true;
            }
          }
          
          // For other resources, check patient references
          if (record.subject && record.subject.reference === `Patient/${selfPatientId}`) {
            return true;
          }
          
          if (record.patient && record.patient.reference === `Patient/${selfPatientId}`) {
            return true;
          }
          
          // Check for other common patient reference patterns
          if (record.subject && record.subject.id === selfPatientId) {
            return true;
          }
          
          if (record.patient && record.patient.id === selfPatientId) {
            return true;
          }
          
          // For now, include all records during testing
          // TODO: Remove this in production
          return true;
        });
        
        console.log('Patient-specific records:', patientRecords.length);
        
        // Deduplicate records based on ID and content
        console.log('Deduplicating records...');
        const uniqueRecordMap = new Map();
        
        patientRecords.forEach(record => {
          const recordId = record.id || (record.resource_raw && record.resource_raw.id);
          if (!recordId) {
            // Skip records without ID
            return;
          }
          
          // Create a unique key based on resource type and ID
          const resourceType = record.resourceType || record.source_resource_type || 
                              (record.resource_raw && record.resource_raw.resourceType) || 'Unknown';
          const uniqueKey = `${resourceType}|${recordId}`;
          
          // Only add if we haven't seen this record before
          if (!uniqueRecordMap.has(uniqueKey)) {
            uniqueRecordMap.set(uniqueKey, record);
          }
        });
        
        // Convert map back to array
        const deduplicatedRecords = Array.from(uniqueRecordMap.values());
        console.log(`Deduplicated from ${patientRecords.length} to ${deduplicatedRecords.length} records`);
        
        setQueryResponse({
          success: true,
          data: deduplicatedRecords
        });
        
        // Process medical records data
        const extractedRecords = processMedicalRecordsArray(deduplicatedRecords);
        
        console.log('Extracted medical records:', extractedRecords.length);
        if (extractedRecords.length > 0) {
          console.log('First processed record:', JSON.stringify(extractedRecords[0], null, 2));
        } else {
          console.log('No medical records extracted from response');
        }
        
        // Deduplicate processed records based on title, date, and provider
        console.log('Deduplicating processed records...');
        const uniqueProcessedRecords = new Map();
        
        extractedRecords.forEach(record => {
          // Create a unique key based on title, date, and provider
          // This helps catch records that might have different IDs but represent the same medical information
          const uniqueKey = `${record.title}|${record.date || 'unknown'}|${record.provider || 'unknown'}`;
          
          // Only add if we haven't seen this record before, or if this record has more information
          if (!uniqueProcessedRecords.has(uniqueKey) || 
              (record.provider !== 'Unknown Provider' && uniqueProcessedRecords.get(uniqueKey).provider === 'Unknown Provider')) {
            uniqueProcessedRecords.set(uniqueKey, record);
          }
        });
        
        // Convert map back to array
        const finalRecords = Array.from(uniqueProcessedRecords.values());
        console.log(`Deduplicated processed records from ${extractedRecords.length} to ${finalRecords.length}`);
        
        // Sort records by date (newest first)
        finalRecords.sort((a, b) => {
          if (!a.date) return 1;
          if (!b.date) return -1;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        
        setMedicalRecords(finalRecords);
        
        // Update category counts
        updateCategoryCounts(finalRecords);
      } else {
        // No records found
        console.log('No records found for any resource type');
        setErrorMessage('No medical records were found. This could be due to server limitations or because there are no records available.');
        setQueryResponse({
          success: true,
          data: []
        });
        setMedicalRecords([]);
      }
    } catch (error) {
      console.error('Error making secure query:', error);
      setErrorMessage('An error occurred while fetching medical records. Please try again later.');
      setQueryResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      setMedicalRecords([]); // Clear records on error
    } finally {
      setIsLoadingRecords(false);
    }
  };
  
  // Helper function to process an array of medical records
  const processMedicalRecordsArray = (records: any[]): MedicalRecord[] => {
    if (!records || !Array.isArray(records)) {
      console.log('Invalid records array:', records);
      return [];
    }
    
    console.log(`Processing ${records.length} medical records`);
    
    return records
      .map(record => processMedicalRecord(record))
      .filter((record): record is MedicalRecord => record !== null);
  };
  
  // Helper function to process a single medical record
  const processMedicalRecord = (record: any): MedicalRecord | null => {
    if (!record) return null;
    
    console.log('Processing record:', record.source_resource_type || record.resourceType || 'Unknown type');
    
    // Check if this is a Fasten-wrapped record with resource_raw
    if (record.resource_raw) {
      console.log('Found Fasten-wrapped record with resource_raw');
      
      // Extract the actual FHIR resource from resource_raw
      const rawResource = record.resource_raw;
      
      // Create a new record that combines the wrapper metadata with the raw resource
      const combinedRecord = {
        ...rawResource,
        id: record.id || rawResource.id,
        // Use sort_date and sort_title if available
        sort_date: record.sort_date,
        sort_title: record.sort_title
      };
      
      console.log('Using combined record with resource_raw content');
      return processFHIRResource(combinedRecord);
    }
    
    // If it's already a FHIR resource, process it directly
    return processFHIRResource(record);
  };
  
  // Helper function to process a FHIR resource
  const processFHIRResource = (record: any): MedicalRecord | null => {
    // Log the full record structure for debugging
    console.log('Record structure:', JSON.stringify(record, null, 2).substring(0, 500) + '...');
    
    // Extract ID
    let recordId = '';
    if (record.id) {
      recordId = record.id;
    } else if (record._id) {
      recordId = record._id;
    } else if (record.identifier && Array.isArray(record.identifier) && record.identifier.length > 0) {
      recordId = record.identifier[0].value || `record-${Math.random().toString(36).substring(2, 11)}`;
    } else {
      recordId = `record-${Math.random().toString(36).substring(2, 11)}`;
    }
    
    // Extract resource type
    let resourceType = record.resourceType || record.source_resource_type || '';
    
    // Use sort_title if available (from Fasten wrapper)
    let title = record.sort_title || 'Unknown Record';
    
    // If we don't have a title from sort_title, extract it from the record
    if (title === 'Unknown Record') {
      // Check if the record has a code field with text or coding
      if (record.code) {
        console.log('Found code field:', JSON.stringify(record.code, null, 2));
        if (record.code.text) {
          title = record.code.text;
          console.log('Using code.text for title:', title);
        } else if (record.code.coding && Array.isArray(record.code.coding) && record.code.coding.length > 0) {
          if (record.code.coding[0].display) {
            title = record.code.coding[0].display;
            console.log('Using code.coding[0].display for title:', title);
          } else if (record.code.coding[0].code) {
            title = record.code.coding[0].code;
            console.log('Using code.coding[0].code for title:', title);
          }
        }
      }
      
      // Different extraction logic based on resource type
      if (resourceType === 'Observation') {
        // For Observations, use the code display or text
        console.log('Processing observation record');
        
        if (record.code) {
          console.log('Found observation code:', JSON.stringify(record.code, null, 2));
          if (record.code.text) {
            title = record.code.text;
            console.log('Using observation code.text for title:', title);
          } else if (record.code.coding && Array.isArray(record.code.coding) && record.code.coding.length > 0) {
            // Try to find a display value in any of the codings
            const displayCoding = record.code.coding.find((coding: any) => coding.display);
            if (displayCoding) {
              title = displayCoding.display;
              console.log('Using observation coding display for title:', title);
            } else {
              // Fall back to the first coding's code
              title = record.code.coding[0].code || 'Observation';
              console.log('Using observation coding code for title:', title);
            }
          }
        }
        
        // Add the value if available
        if (record.valueQuantity) {
          console.log('Found valueQuantity:', JSON.stringify(record.valueQuantity, null, 2));
          const value = record.valueQuantity.value;
          const unit = record.valueQuantity.unit || record.valueQuantity.code || '';
          if (value !== undefined) {
            title = `${title}: ${value} ${unit}`.trim();
            console.log('Added valueQuantity to title:', title);
          }
        } else if (record.valueString) {
          console.log('Found valueString:', record.valueString);
          title = `${title}: ${record.valueString}`;
          console.log('Added valueString to title:', title);
        } else if (record.valueCodeableConcept) {
          console.log('Found valueCodeableConcept:', JSON.stringify(record.valueCodeableConcept, null, 2));
          if (record.valueCodeableConcept.text) {
            title = `${title}: ${record.valueCodeableConcept.text}`;
            console.log('Added valueCodeableConcept.text to title:', title);
          } else if (record.valueCodeableConcept.coding && 
                    Array.isArray(record.valueCodeableConcept.coding) && 
                    record.valueCodeableConcept.coding.length > 0) {
            const displayCoding = record.valueCodeableConcept.coding.find((coding: any) => coding.display);
            if (displayCoding) {
              title = `${title}: ${displayCoding.display}`;
              console.log('Added valueCodeableConcept coding display to title:', title);
            } else {
              title = `${title}: ${record.valueCodeableConcept.coding[0].code}`;
              console.log('Added valueCodeableConcept coding code to title:', title);
            }
          }
        } else if (record.component && Array.isArray(record.component) && record.component.length > 0) {
          // For panel results, add a count of components
          title = `${title} (${record.component.length} components)`;
          console.log('Added component count to title:', title);
        }
        
        // If title is still unknown, try to use the status
        if (title === 'Unknown Record' && record.status) {
          title = `Observation (${record.status})`;
          console.log('Using status for title:', title);
        }
      } else if (resourceType === 'MedicationRequest' || resourceType === 'MedicationStatement') {
        // For medications, use the medication details
        console.log('Processing medication record');
        
        if (record.medicationCodeableConcept) {
          console.log('Found medicationCodeableConcept:', JSON.stringify(record.medicationCodeableConcept, null, 2));
          if (record.medicationCodeableConcept.text) {
            title = record.medicationCodeableConcept.text;
            console.log('Using medicationCodeableConcept.text for title:', title);
          } else if (record.medicationCodeableConcept.coding && 
                    Array.isArray(record.medicationCodeableConcept.coding) && 
                    record.medicationCodeableConcept.coding.length > 0) {
            // Try to find a display value in any of the codings
            const displayCoding = record.medicationCodeableConcept.coding.find((coding: any) => coding.display);
            if (displayCoding) {
              title = displayCoding.display;
              console.log('Using medicationCodeableConcept coding display for title:', title);
            } else {
              // Fall back to the first coding's code
              title = record.medicationCodeableConcept.coding[0].code || 'Medication';
              console.log('Using medicationCodeableConcept coding code for title:', title);
            }
          }
        } else if (record.medicationReference) {
          console.log('Found medicationReference:', JSON.stringify(record.medicationReference, null, 2));
          if (record.medicationReference.display) {
            title = record.medicationReference.display;
            console.log('Using medicationReference.display for title:', title);
          } else if (record.medicationReference.reference) {
            // Extract name from reference
            const refParts = record.medicationReference.reference.split('/');
            title = `Medication: ${refParts[refParts.length - 1]}`;
            console.log('Using medicationReference.reference for title:', title);
          }
        } else if (record.medication && typeof record.medication === 'string') {
          // Some implementations might just have a string
          title = record.medication;
          console.log('Using medication string for title:', title);
        }
        
        // Add dosage information if available
        if (record.dosageInstruction && Array.isArray(record.dosageInstruction) && 
            record.dosageInstruction.length > 0) {
          console.log('Found dosageInstruction:', JSON.stringify(record.dosageInstruction[0], null, 2));
          const dosage = record.dosageInstruction[0];
          let dosageText = '';
          
          if (dosage.text) {
            dosageText = dosage.text;
          } else {
            // Try to construct dosage from components
            if (dosage.doseAndRate && Array.isArray(dosage.doseAndRate) && dosage.doseAndRate.length > 0) {
              const doseAndRate = dosage.doseAndRate[0];
              if (doseAndRate.doseQuantity) {
                const value = doseAndRate.doseQuantity.value;
                const unit = doseAndRate.doseQuantity.unit || doseAndRate.doseQuantity.code || '';
                if (value !== undefined) {
                  dosageText = `${value} ${unit}`.trim();
                }
              }
            }
            
            // Add frequency
            if (dosage.timing && dosage.timing.code && dosage.timing.code.text) {
              dosageText = dosageText ? `${dosageText}, ${dosage.timing.code.text}` : dosage.timing.code.text;
            }
          }
          
          if (dosageText) {
            title = `${title} (${dosageText})`;
            console.log('Added dosage to title:', title);
          }
        }
        
        // If title is still unknown, try to use the status
        if (title === 'Unknown Record' && record.status) {
          title = `Medication (${record.status})`;
          console.log('Using status for title:', title);
        }
      } else if (resourceType === 'Condition') {
        // For conditions (diagnoses), use the code
        if (record.code) {
          if (record.code.text) {
            title = record.code.text;
          } else if (record.code.coding && Array.isArray(record.code.coding) && record.code.coding.length > 0) {
            title = record.code.coding[0].display || record.code.coding[0].code || 'Condition';
          }
        }
        
        // Add clinical status if available
        if (record.clinicalStatus && record.clinicalStatus.coding && 
            Array.isArray(record.clinicalStatus.coding) && record.clinicalStatus.coding.length > 0) {
          const status = record.clinicalStatus.coding[0].display || record.clinicalStatus.coding[0].code;
          if (status) {
            title = `${title} (${status})`;
          }
        } else if (record.clinicalStatus && typeof record.clinicalStatus === 'string') {
          title = `${title} (${record.clinicalStatus})`;
        }
      } else if (resourceType === 'DiagnosticReport') {
        // For diagnostic reports, use the code or category
        if (record.code) {
          if (record.code.text) {
            title = record.code.text;
            console.log('Using DiagnosticReport code.text for title:', title);
          } else if (record.code.coding && Array.isArray(record.code.coding) && record.code.coding.length > 0) {
            // Try to find a display value in any of the codings
            const displayCoding = record.code.coding.find((coding: any) => coding.display);
            if (displayCoding) {
              title = displayCoding.display;
              console.log('Using DiagnosticReport coding display for title:', title);
            } else {
              // Fall back to the first coding's code
              title = record.code.coding[0].code || 'Diagnostic Report';
              console.log('Using DiagnosticReport coding code for title:', title);
            }
          }
        } else if (record.category && Array.isArray(record.category)) {
          if (record.category[0].text) {
            title = `${record.category[0].text} Report`;
          } else if (record.category[0].coding && Array.isArray(record.category[0].coding) && 
                    record.category[0].coding.length > 0) {
            title = `${record.category[0].coding[0].display || record.category[0].coding[0].code} Report`;
          }
        }
        
        // If we have results, add a count
        if (record.result && Array.isArray(record.result) && record.result.length > 0) {
          title = `${title} (${record.result.length} results)`;
        }
      } else if (resourceType === 'Procedure') {
        // For Procedures, use the code display or text
        console.log('Processing procedure record');
        
        if (record.code) {
          console.log('Found procedure code:', JSON.stringify(record.code, null, 2));
          if (record.code.text) {
            title = record.code.text;
            console.log('Using procedure code.text for title:', title);
          } else if (record.code.coding && Array.isArray(record.code.coding) && record.code.coding.length > 0) {
            // Try to find a display value in any of the codings
            const displayCoding = record.code.coding.find((coding: any) => coding.display);
            if (displayCoding) {
              title = displayCoding.display;
              console.log('Using procedure coding display for title:', title);
            } else {
              // Fall back to the first coding's code
              title = record.code.coding[0].code || 'Procedure';
              console.log('Using procedure coding code for title:', title);
            }
          }
        }
        
        // Add status information if available
        if (record.status) {
          console.log('Found procedure status:', record.status);
          title = `${title} (${record.status})`;
          console.log('Added status to title:', title);
        }
        
        // If title is still unknown, try to use the status
        if (title === 'Unknown Record' && record.status) {
          title = `Procedure (${record.status})`;
          console.log('Using status for title:', title);
        }
      } else if (resourceType === 'Encounter') {
        // For Encounters, use the type display or text
        console.log('Processing encounter record');
        
        // Try to get title from type
        if (record.type && Array.isArray(record.type) && record.type.length > 0) {
          console.log('Found encounter type:', JSON.stringify(record.type, null, 2));
          const encounterType = record.type[0];
          
          if (encounterType.text) {
            title = encounterType.text;
            console.log('Using encounter type.text for title:', title);
          } else if (encounterType.coding && Array.isArray(encounterType.coding) && encounterType.coding.length > 0) {
            // Try to find a display value in any of the codings
            const displayCoding = encounterType.coding.find((coding: any) => coding.display);
            if (displayCoding) {
              title = displayCoding.display;
              console.log('Using encounter type coding display for title:', title);
            } else {
              // Fall back to the first coding's code
              title = encounterType.coding[0].code || 'Encounter';
              console.log('Using encounter type coding code for title:', title);
            }
          }
        } else if (record.class) {
          // Try to get title from class
          console.log('Found encounter class:', JSON.stringify(record.class, null, 2));
          if (record.class.display) {
            title = record.class.display;
            console.log('Using encounter class.display for title:', title);
          } else if (record.class.code) {
            title = record.class.code;
            console.log('Using encounter class.code for title:', title);
          }
        }
        
        // Add status information if available
        if (record.status) {
          console.log('Found encounter status:', record.status);
          title = `${title} (${record.status})`;
          console.log('Added status to title:', title);
        }
        
        // If title is still unknown, try to use the status
        if (title === 'Unknown Record' && record.status) {
          title = `Encounter (${record.status})`;
          console.log('Using status for title:', title);
        }
      } else if (resourceType === 'Patient') {
        // For Patient resources, use name
        if (record.name && Array.isArray(record.name) && record.name.length > 0) {
          const name = record.name[0];
          if (name.text) {
            title = `Patient: ${name.text}`;
          } else {
            const given = name.given ? name.given.join(' ') : '';
            const family = name.family || '';
            title = `Patient: ${given} ${family}`.trim();
          }
        } else {
          title = 'Patient Record';
        }
      } else {
        // Generic extraction for other resource types
        if (record.code && record.code.text) {
          title = record.code.text;
        } else if (record.code && record.code.coding && record.code.coding.length > 0) {
          title = record.code.coding[0].display || record.code.coding[0].code || 'Unknown Record';
        } else if (record.medicationCodeableConcept && record.medicationCodeableConcept.text) {
          title = record.medicationCodeableConcept.text;
        } else if (record.medicationReference && record.medicationReference.display) {
          title = record.medicationReference.display;
        } else if (record.category && record.category.text) {
          title = record.category.text;
        } else if (record.type && record.type.text) {
          title = record.type.text;
        } else if (record.name && Array.isArray(record.name) && record.name.length > 0) {
          // Try to extract name if available
          const name = record.name[0];
          if (name.text) {
            title = name.text;
          } else {
            const given = name.given ? name.given.join(' ') : '';
            const family = name.family || '';
            title = `${given} ${family}`.trim();
          }
        } else if (resourceType) {
          // Use resource type as fallback title
          title = resourceType.replace(/([A-Z])/g, ' $1').trim();
        }
      }
    }
    
    // Extract date
    let date = '';
    console.log('Extracting date information');
    
    // Use sort_date if available (from Fasten wrapper)
    if (record.sort_date) {
      date = record.sort_date;
      console.log('Using sort_date for date:', date);
    } else if (record.created_at) {
      // Use created_at from Fasten wrapper if available
      date = record.created_at;
      console.log('Using created_at for date:', date);
    } else if (record.updated_at) {
      // Use updated_at from Fasten wrapper if available
      date = record.updated_at;
      console.log('Using updated_at for date:', date);
    } else {
      // Try different date fields in order of preference
      if (record.effectiveDateTime) {
        date = record.effectiveDateTime;
        console.log('Using effectiveDateTime for date:', date);
      } else if (record.effectivePeriod && record.effectivePeriod.start) {
        date = record.effectivePeriod.start;
        console.log('Using effectivePeriod.start for date:', date);
      } else if (record.issued) {
        date = record.issued;
        console.log('Using issued for date:', date);
      } else if (record.date) {
        date = record.date;
        console.log('Using date for date:', date);
      } else if (record.authoredOn) {
        date = record.authoredOn;
        console.log('Using authoredOn for date:', date);
      } else if (record.recorded) {
        date = record.recorded;
        console.log('Using recorded for date:', date);
      } else if (record.period && record.period.start) {
        date = record.period.start;
        console.log('Using period.start for date:', date);
      } else if (record.onset && typeof record.onset === 'string') {
        date = record.onset;
        console.log('Using onset for date:', date);
      } else if (record.onsetDateTime) {
        date = record.onsetDateTime;
        console.log('Using onsetDateTime for date:', date);
      } else if (record.recordedDate) {
        date = record.recordedDate;
        console.log('Using recordedDate for date:', date);
      } else if (record.meta && record.meta.lastUpdated) {
        date = record.meta.lastUpdated;
        console.log('Using meta.lastUpdated for date:', date);
      }
    }
    
    // Format the date if we have one
    if (date) {
      try {
        // Try to parse and format the date
        const dateObj = new Date(date);
        if (!isNaN(dateObj.getTime())) {
          // Valid date, format it
          date = dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
          console.log('Formatted date:', date);
        }
      } catch (error) {
        console.log('Error formatting date:', error);
        // Keep the original date string if parsing fails
      }
    } else {
      date = 'Unknown Date';
      console.log('No date found, using default:', date);
    }
    
    // Extract provider information
    let provider = 'Unknown Provider';
    console.log('Extracting provider information');
    
    // Check for performer (used in many resource types)
    if (record.performer) {
      console.log('Found performer:', JSON.stringify(record.performer, null, 2));
      if (Array.isArray(record.performer) && record.performer.length > 0) {
        const performer = record.performer[0];
        if (typeof performer === 'object') {
          if (performer.display) {
            provider = performer.display;
            console.log('Using performer.display for provider:', provider);
          } else if (performer.actor && performer.actor.display) {
            provider = performer.actor.display;
            console.log('Using performer.actor.display for provider:', provider);
          } else if (performer.reference) {
            // Extract the name from the reference if possible
            const refParts = performer.reference.split('/');
            provider = refParts[refParts.length - 1] || 'Provider';
            console.log('Using performer.reference for provider:', provider);
          }
        } else if (typeof performer === 'string') {
          // Handle case where performer is just a string reference
          const refParts = performer.split('/');
          provider = refParts[refParts.length - 1] || 'Provider';
          console.log('Using performer string reference for provider:', provider);
        }
      }
    }
    
    // Check for practitioner (used in MedicationRequest)
    if (provider === 'Unknown Provider' && record.requester) {
      console.log('Found requester:', JSON.stringify(record.requester, null, 2));
      if (record.requester.display) {
        provider = record.requester.display;
        console.log('Using requester.display for provider:', provider);
      } else if (record.requester.reference) {
        const refParts = record.requester.reference.split('/');
        provider = refParts[refParts.length - 1] || 'Provider';
        console.log('Using requester.reference for provider:', provider);
      }
    }
    
    // Check for participant (used in Encounter)
    if (provider === 'Unknown Provider' && record.participant) {
      console.log('Found participant:', JSON.stringify(record.participant, null, 2));
      if (Array.isArray(record.participant) && record.participant.length > 0) {
        const participant = record.participant[0];
        if (participant.individual && participant.individual.display) {
          provider = participant.individual.display;
          console.log('Using participant.individual.display for provider:', provider);
        } else if (participant.individual && participant.individual.reference) {
          const refParts = participant.individual.reference.split('/');
          provider = refParts[refParts.length - 1] || 'Provider';
          console.log('Using participant.individual.reference for provider:', provider);
        }
      }
    }
    
    // Check for author (used in DocumentReference)
    if (provider === 'Unknown Provider' && record.author) {
      console.log('Found author:', JSON.stringify(record.author, null, 2));
      if (Array.isArray(record.author) && record.author.length > 0) {
        const author = record.author[0];
        if (typeof author === 'object' && author.display) {
          provider = author.display;
          console.log('Using author.display for provider:', provider);
        } else if (typeof author === 'object' && author.reference) {
          const refParts = author.reference.split('/');
          provider = refParts[refParts.length - 1] || 'Provider';
          console.log('Using author.reference for provider:', provider);
        } else if (typeof author === 'string') {
          const refParts = author.split('/');
          provider = refParts[refParts.length - 1] || 'Provider';
          console.log('Using author string reference for provider:', provider);
        }
      }
    }
    
    // If we still don't have a provider, check for organization
    if (provider === 'Unknown Provider' && record.organization) {
      console.log('Found organization:', JSON.stringify(record.organization, null, 2));
      if (record.organization.display) {
        provider = record.organization.display;
        console.log('Using organization.display for provider:', provider);
      } else if (record.organization.reference) {
        const refParts = record.organization.reference.split('/');
        provider = refParts[refParts.length - 1] || 'Organization';
        console.log('Using organization.reference for provider:', provider);
      }
    }
    
    // If we still don't have a provider, check for custodian (used in DocumentReference)
    if (provider === 'Unknown Provider' && record.custodian) {
      console.log('Found custodian:', JSON.stringify(record.custodian, null, 2));
      if (record.custodian.display) {
        provider = record.custodian.display;
        console.log('Using custodian.display for provider:', provider);
      } else if (record.custodian.reference) {
        const refParts = record.custodian.reference.split('/');
        provider = refParts[refParts.length - 1] || 'Custodian';
        console.log('Using custodian.reference for provider:', provider);
      }
    }
    
    // Clean up provider name if it's a reference
    if (provider !== 'Unknown Provider' && provider.includes('/')) {
      const refParts = provider.split('/');
      provider = refParts[refParts.length - 1];
      console.log('Cleaned up provider reference:', provider);
    }
    
    // Determine category based on resource type and content
    let category = '';
    if (resourceType === 'Observation') {
      // Check if it's a lab result or vital sign
      if (record.category && Array.isArray(record.category)) {
        const isLabResult = record.category.some((cat: any) => 
          cat.coding && Array.isArray(cat.coding) && 
          cat.coding.some((coding: any) => 
            coding.code === 'laboratory' || 
            coding.display?.toLowerCase().includes('lab') ||
            coding.system?.includes('laboratory')
          )
        );
        
        const isVitalSign = record.category.some((cat: any) => 
          cat.coding && Array.isArray(cat.coding) && 
          cat.coding.some((coding: any) => 
            coding.code === 'vital-signs' || 
            coding.display?.toLowerCase().includes('vital')
          )
        );
        
        if (isLabResult) {
          category = 'Lab Results';
        } else if (isVitalSign) {
          category = 'Visits'; // Group vitals with visits
        } else {
          category = 'Lab Results'; // Default for observations
        }
      } else {
        category = 'Lab Results';
      }
    } else if (resourceType === 'MedicationRequest' || resourceType === 'MedicationStatement') {
      category = 'Medications';
    } else if (resourceType === 'Condition') {
      category = 'Conditions'; // Categorize conditions under Conditions
    } else if (resourceType === 'DiagnosticReport') {
      // Check if it's an imaging report
      if (record.category && Array.isArray(record.category)) {
        const isImaging = record.category.some((cat: any) => 
          cat.coding && Array.isArray(cat.coding) && 
          cat.coding.some((coding: any) => 
            coding.code === 'RAD' || 
            coding.display?.toLowerCase().includes('imaging') ||
            coding.display?.toLowerCase().includes('radiology')
          )
        );
        
        if (isImaging) {
          category = 'Imaging';
        } else {
          category = 'Lab Results';
        }
      } else {
        category = 'Lab Results';
      }
    } else if (resourceType === 'ImagingStudy') {
      category = 'Imaging';
    } else if (resourceType === 'Encounter') {
      category = 'Visits';
    } else if (resourceType === 'Patient') {
      category = 'Visits'; // Categorize patient records under visits
    } else {
      // Default category based on resource type
      const categoryMap: Record<string, string> = {
        'AllergyIntolerance': 'Visits',
        'CarePlan': 'Visits',
        'Condition': 'Visits',
        'Immunization': 'Visits',
        'DocumentReference': 'Imaging'
      };
      
      category = categoryMap[resourceType] || 'Visits';
    }
    
    // Log the extracted information
    console.log(`Extracted: ID=${recordId}, Title=${title}, Provider=${provider}, Category=${category}`);
    
    return {
      id: recordId,
      title,
      date,
      provider,
      category,
      resourceType
    };
  };
  
  // Update category counts based on medical records
  const updateCategoryCounts = (records: MedicalRecord[]) => {
    const counts = {
      'Lab Results': 0,
      'Medications': 0,
      'Imaging': 0,
      'Conditions': 0,
      'Visits': 0
    };
    
    records.forEach(record => {
      if (record.category && record.category in counts) {
        counts[record.category as keyof typeof counts]++;
      }
    });
    
    setCategories([
      { name: 'Lab Results', count: counts['Lab Results'] },
      { name: 'Medications', count: counts['Medications'] },
      { name: 'Imaging', count: counts['Imaging'] },
      { name: 'Conditions', count: counts['Conditions'] },
      { name: 'Visits', count: counts['Visits'] }
    ]);
  };
  
  // Handle pull-to-refresh
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchMedicalRecords().then(() => setRefreshing(false));
  }, [selfPatientId]);
  
  // Get icon for record based on category or resource type
  const getRecordIcon = (record: MedicalRecord) => {
    if (record.category === 'Lab Results') return 'test-tube';
    if (record.category === 'Medications') return 'pill';
    if (record.category === 'Imaging') return 'image';
    if (record.category === 'Conditions') return 'medical-bag';
    if (record.category === 'Visits') return 'hospital-building';
    
    // Fallback based on resource type
    if (record.resourceType === 'Observation') return 'test-tube';
    if (record.resourceType === 'MedicationRequest') return 'pill';
    if (record.resourceType === 'DiagnosticReport') return 'file-document-outline';
    if (record.resourceType === 'Procedure') return 'medical-bag';
    if (record.resourceType === 'Encounter') return 'hospital-building';
    if (record.resourceType === 'Condition') return 'medical-bag';
    
    return 'file-document-outline';
  };
  
  // Filter records based on search query and selected category
  const filteredRecords = medicalRecords
    .filter(record => {
      // First apply category filter if selected
      if (selectedCategory && record.category !== selectedCategory) {
        return false;
      }
      
      // Then apply search filter if there's a search query
      if (searchQuery) {
        return record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (record.provider && record.provider.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (record.category && record.category.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      
      return true;
    });

  // Handle category selection
  const handleCategorySelect = (categoryName: string) => {
    if (selectedCategory === categoryName) {
      // If clicking the already selected category, clear the filter
      setSelectedCategory(null);
    } else {
      // Otherwise, set the selected category
      setSelectedCategory(categoryName);
    }
  };

  // Handle record selection for viewing details
  const handleViewRecord = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setModalVisible(true);
  };

  // Close the record details modal
  const hideModal = () => {
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Searchbar
          placeholder="Search records..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />

        {selectedCategory && (
          <View style={styles.filterBanner}>
            <Text style={styles.filterText}>Filtering by: {selectedCategory}</Text>
            <Button 
              mode="text" 
              onPress={() => setSelectedCategory(null)}
              style={styles.clearFilterButton}
            >
              Clear
            </Button>
          </View>
        )}

        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Text variant="titleMedium" style={styles.sectionTitle}>Recent Records</Text>
          
          {isLoadingRecords ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text style={styles.loadingText}>Loading medical records...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Error loading medical records</Text>
              <Text style={styles.errorDetails}>{errorMessage}</Text>
              <Button mode="contained" onPress={fetchMedicalRecords} style={styles.actionButton}>
                Retry
              </Button>
            </View>
          ) : queryResponse && queryResponse.success === false ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Error loading medical records</Text>
              <Text style={styles.errorDetails}>{queryResponse.error || 'An unknown error occurred'}</Text>
              <Button mode="contained" onPress={fetchMedicalRecords} style={styles.actionButton}>
                Retry
              </Button>
            </View>
          ) : filteredRecords.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery 
                  ? 'No records match your search' 
                  : selectedCategory 
                    ? `No ${selectedCategory} records found` 
                    : 'No medical records found'
                }
              </Text>
              <Text style={styles.emptySubtext}>
                {!selfPatientId 
                  ? 'Please set a patient as "THAT\'S ME!" in Settings'
                  : selectedCategory
                    ? 'Try selecting a different category'
                    : 'Pull down to refresh or check back later'
                }
              </Text>
              {selectedCategory && (
                <Button 
                  mode="outlined" 
                  onPress={() => setSelectedCategory(null)}
                  style={styles.actionButton}
                >
                  View All Records
                </Button>
              )}
            </View>
          ) : (
          <Card style={styles.card}>
            <Card.Content>
                {filteredRecords.slice(0, 10).map((record, index, array) => (
                  <React.Fragment key={record.id}>
                    <List.Item
                      title={record.title}
                      description={`${record.provider || 'Unknown provider'} • ${record.date || 'Unknown date'}`}
                      left={props => <List.Icon {...props} icon={getRecordIcon(record)} />}
                      right={props => <Button mode="text" onPress={() => handleViewRecord(record)}>View</Button>}
                    />
                    {index < array.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
                {filteredRecords.length > 10 && (
                  <Button mode="text" style={styles.viewMoreButton}>
                    View More ({filteredRecords.length - 10} more)
                  </Button>
                )}
            </Card.Content>
          </Card>
          )}

          <Text variant="titleMedium" style={styles.sectionTitle}>Categories</Text>
          
          <View style={styles.categories}>
            {categories.map(category => (
              <Card 
                key={category.name} 
                style={[
                  styles.categoryCard, 
                  selectedCategory === category.name && styles.selectedCategoryCard
                ]}
                onPress={() => handleCategorySelect(category.name)}
              >
                <Card.Content>
                  <Text 
                    variant="titleMedium" 
                    style={selectedCategory === category.name ? styles.selectedCategoryText : null}
                  >
                    {category.name}
                  </Text>
                  <Text 
                    variant="bodySmall"
                    style={selectedCategory === category.name ? styles.selectedCategoryText : null}
                  >
                    {category.count} records
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        </ScrollView>

        {/* Record Details Modal */}
        <Portal>
          <Modal
            visible={modalVisible}
            onDismiss={hideModal}
            contentContainerStyle={styles.modalContainer}
          >
            {selectedRecord && (
              <ScrollView style={styles.modalScrollView}>
                <Card>
                  <Card.Title 
                    title={selectedRecord.title} 
                    subtitle={`${selectedRecord.category || 'Unknown category'}`}
                    left={props => <List.Icon {...props} icon={getRecordIcon(selectedRecord)} />}
                  />
                  <Card.Content>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Date:</Text>
                      <Text style={styles.detailValue}>{selectedRecord.date || 'Unknown date'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Provider:</Text>
                      <Text style={styles.detailValue}>{selectedRecord.provider || 'Unknown provider'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Type:</Text>
                      <Text style={styles.detailValue}>{selectedRecord.resourceType || 'Unknown type'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Record ID:</Text>
                      <Text style={styles.detailValue}>{selectedRecord.id}</Text>
                    </View>
                    
                    <Divider style={styles.divider} />
                    
                    <Text style={styles.noteText}>
                      This is a summary view of your medical record. For complete details, please consult your healthcare provider.
                    </Text>
                  </Card.Content>
                  <Card.Actions>
                    <Button onPress={hideModal}>Close</Button>
                  </Card.Actions>
                </Card>
              </ScrollView>
            )}
          </Modal>
        </Portal>
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
  filterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e8f4fd',
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  filterText: {
    color: '#0066cc',
    fontWeight: '500',
  },
  clearFilterButton: {
    marginLeft: 8,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    marginBottom: 12,
    width: '48%',
    elevation: 2,
  },
  selectedCategoryCard: {
    backgroundColor: '#0066cc',
    elevation: 4,
  },
  selectedCategoryText: {
    color: 'white',
  },
  viewMoreButton: {
    alignSelf: 'center',
    marginTop: 8,
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
  errorDetails: {
    color: '#666',
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  actionButton: {
    marginTop: 16,
    minWidth: 120,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 16,
    color: '#666',
  },
  emptySubtext: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalScrollView: {
    padding: 5,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    fontWeight: 'bold',
    width: 100,
  },
  detailValue: {
    flex: 1,
  },
  divider: {
    marginVertical: 16,
  },
  noteText: {
    fontStyle: 'italic',
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
}); 