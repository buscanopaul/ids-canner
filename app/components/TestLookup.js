import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppwriteService from '../services/appwriteService';
import DatabaseLookupDisplay from './DatabaseLookupDisplay';

const TestLookup = () => {
  const [idNumber, setIdNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Sample ID numbers from your database for quick testing
  const sampleIds = [
    '191-589-009-000',
    '0993362',
    '17-13245678-0',
    'P9121902B',
    '2953-7193-6294-5836',
    'N02-14-024202'
  ];

  const testIds = [
    '191-589-009-000', // Wandra Heron
    '0993362', // Jocelyn Andrada - Your test case with photo
    '17-13245678-0', // Juan Dela 
    'P9121902B', // Maria Dela Cruz
    '2953-7193-6294-5836', // Jasmine Tolentino
    'N02-14-024202' // Jon Gabriel Cruz
  ];

  const handleLookup = async () => {
    if (!idNumber.trim()) {
      Alert.alert('Error', 'Please enter an ID number');
      return;
    }

    setIsLoading(true);

    try {
      const result = await AppwriteService.lookupIdByNumber(idNumber.trim());
      
      if (result.found) {
        // Transform the database record to match the expected format
        const transformedData = {
          ...result.record,
          isFromDatabase: true,
          verificationStatus: 'FOUND_IN_DB',
          scanSource: 'database_lookup',
          scannedRawData: `Test lookup for ID: ${idNumber}`,
          recordId: result.record.$id,
          lastUpdated: result.record.$updatedAt
        };
        
        setLookupResult(transformedData);
        setShowResult(true);
      } else {
        Alert.alert(
          'ID Not Found',
          `The ID number "${idNumber}" was not found in the database.`,
          [
            { text: 'OK' },
            { 
              text: 'Try Sample ID', 
              onPress: () => setIdNumber(sampleIds[0]) 
            }
          ]
        );
      }
    } catch (error) {
      console.error('Lookup error:', error);
      Alert.alert('Error', 'Failed to lookup ID in database');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestLookup = async (idNumber) => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      console.log('Testing lookup for ID:', idNumber);
      const result = await AppwriteService.lookupIdByNumber(idNumber);
      console.log('Test lookup result:', result);
      setTestResult(result);
    } catch (error) {
      console.error('Test lookup error:', error);
      setTestResult({ found: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="search" size={24} color="#4F46E5" />
        <Text style={styles.title}>Database ID Lookup</Text>
      </View>

      <Text style={styles.description}>
        Enter an ID number to lookup in the database
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter ID number..."
          value={idNumber}
          onChangeText={setIdNumber}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity 
          style={[styles.lookupButton, isLoading && styles.lookupButtonDisabled]}
          onPress={handleLookup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="search" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.sampleTitle}>Sample ID Numbers from Database:</Text>
      <View style={styles.sampleContainer}>
        {sampleIds.map((sampleId, index) => (
          <TouchableOpacity
            key={index}
            style={styles.sampleButton}
            onPress={() => setIdNumber(sampleId)}
          >
            <Text style={styles.sampleText}>{sampleId}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lookup Result Modal */}
      {showResult && lookupResult && (
        <DatabaseLookupDisplay
          data={lookupResult}
          onClose={() => {
            setShowResult(false);
            setLookupResult(null);
          }}
          onScanAnother={() => {
            setShowResult(false);
            setLookupResult(null);
            setIdNumber('');
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  lookupButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lookupButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  sampleTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  sampleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sampleButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sampleText: {
    fontSize: 12,
    color: '#4B5563',
    fontFamily: 'monospace',
  },
});

export default TestLookup; 