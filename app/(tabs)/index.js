import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Alert, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, Image, Linking } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppwriteService from '../services/appwriteService';
import DatabaseLookupDisplay from '../components/DatabaseLookupDisplay';
import { parseIDData } from '../utils/idDataParser';

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualIdInput, setManualIdInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [showLookupResult, setShowLookupResult] = useState(false);
  const [isProcessingQR, setIsProcessingQR] = useState(false);
  const [flashMode, setFlashMode] = useState('off');
  const router = useRouter();

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  useEffect(() => {
    if (!isScanning) {
      setFlashMode('off');
    }
  }, [isScanning]);

  useEffect(() => {
    setIsScanning(false);
  }, [showLookupResult]);

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || isProcessingQR) return; // Prevent multiple scans
    
    setScanned(true);
    setIsScanning(false); // Stop scanning immediately
    setIsProcessingQR(true);

    try {
      console.log('QR Code scanned:', data);
      // Use the existing parseIDData function to process the scanned data
      const parsedData = await parseIDData(data, type);
      
      setLookupResult(parsedData);
      setIsProcessingQR(false);
      setShowLookupResult(true);
    } catch (error) {
      console.error('QR parsing error:', error);
      setIsProcessingQR(false);
      
      // Fallback to basic display if parsing fails
      const fallbackData = {
        idNumber: data,
        firstName: '',
        lastName: '',
        middleInitial: '',
        birthday: '',
        idType: 'Unknown',
        isFromDatabase: false,
        verificationStatus: 'PARSE_ERROR',
        scanSource: 'qr_scan',
        scannedRawData: data
      };
      
      setLookupResult(fallbackData);
      setShowLookupResult(true);
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    setScanned(false);
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  const navigateToProfile = () => {
    setIsScanning(false);
    setScanned(false);
    router.push('/(tabs)/profile');
  };

  const openManualInput = () => {
    setIsScanning(false);
    setShowManualInput(true);
    setManualIdInput('');
  };

  const closeManualInput = () => {
    setShowManualInput(false);
    setManualIdInput('');
  };

  const submitManualId = async () => {
    if (!manualIdInput.trim()) {
      Alert.alert('Error', 'Please enter an ID number');
      return;
    }

    setIsSearching(true);

    try {
      console.log('Looking up ID:', manualIdInput.trim());
      const result = await AppwriteService.lookupIdByNumber(manualIdInput.trim());
      
      if (result.found) {
        // Transform the database record to match the expected format
        const transformedData = {
          ...result.record,
          isFromDatabase: true,
          verificationStatus: 'FOUND_IN_DB',
          scanSource: 'manual_lookup',
          scannedRawData: `Manual lookup for ID: ${manualIdInput.trim()}`,
          recordId: result.record.$id,
          lastUpdated: result.record.$updatedAt
        };
        
        setLookupResult(transformedData);
        setIsSearching(false);
        closeManualInput();
        setShowLookupResult(true);
      } else {
        setIsSearching(false);
        Alert.alert(
          'ID Not Found',
          `The ID number "${manualIdInput.trim()}" was not found in the database.`,
          [
            { text: 'OK' },
            { 
              text: 'Try Another', 
              onPress: () => setManualIdInput('') 
            }
          ]
        );
      }
    } catch (error) {
      console.error('Manual lookup error:', error);
      setIsSearching(false);
      Alert.alert('Error', 'Failed to lookup ID in database. Please try again.');
    }
  };

  const closeLookupResult = () => {
    setShowLookupResult(false);
    setLookupResult(null);
    setScanned(false);
    setIsScanning(false); // Stop scanning - same as stop button
    setIsProcessingQR(false); // Reset processing state
  };

  const handleScanAnother = () => {
    setShowLookupResult(false);
    setLookupResult(null);
    setScanned(false);
    setIsScanning(true);
  };

  const toggleFlash = () => {
    if (!isScanning) {
      Alert.alert('Start Scanning First', 'Please start scanning before using the flash');
      return;
    }
    const newFlashMode = flashMode === 'off' ? 'on' : 'off';
    setFlashMode(newFlashMode);
  };

  const handleLogoPress = () => {
    const appId = 'your-app-id'; // Replace with your actual app ID
    let storeUrl;

    if (Platform.OS === 'ios') {
      // iOS App Store URL for reviews
      storeUrl = `https://apps.apple.com/app/id${appId}?action=write-review`;
    } else {
      // Google Play Store URL for reviews
      storeUrl = `https://play.google.com/store/apps/details?id=com.appedgescanner.edgescanner&showAllReviews=true`;
    }

    Linking.canOpenURL(storeUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(storeUrl);
        } else {
          Alert.alert('Error', 'Unable to open app store');
        }
      })
      .catch((err) => {
        console.error('Error opening app store:', err);
        Alert.alert('Error', 'Unable to open app store');
      });
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        torch={flashMode === 'on'}
        onBarcodeScanned={isScanning && !showLookupResult && !isProcessingQR ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'pdf417'],
        }}
      >
        <View style={styles.topControls}>
          <TouchableOpacity style={styles.logoButton} onPress={handleLogoPress}>
            <Image
              source={require('../../assets/logo_edgescanner.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.flashButton,
              flashMode === 'on' && styles.flashButtonActive,
              !isScanning && styles.flashButtonDisabled,
            ]}
            onPress={toggleFlash}
          >
            <Ionicons
              name={flashMode === 'on' ? 'flash' : 'flash-off'}
              size={18}
              color={!isScanning ? '#ccc' : 'black'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.overlay}>
          <View style={styles.unfocusedContainer}></View>
          <View style={styles.middleContainer}>
            <View style={styles.unfocusedContainer}></View>
            <View style={styles.focusedContainer}>
              <Text style={styles.scanText}>
                {isScanning ? 'Scanning for QR Code...' : 'Ready to Scan'}
              </Text>
            </View>
            <View style={styles.unfocusedContainer}></View>
          </View>
          <View style={styles.unfocusedContainer}></View>
        </View>
      </CameraView>
      
      <View style={styles.buttonContainer}>
        <View style={styles.bottomNavigation}>
          {/* Manual Input - Lock Icon */}
          <TouchableOpacity
            style={styles.navButton}
            onPress={openManualInput}
          >
            <Ionicons name="lock-closed" size={24} color="white" />
          </TouchableOpacity>

          {/* Center Scanning Button */}
          <TouchableOpacity
            style={[styles.centerButton, isScanning && styles.centerButtonActive]}
            onPress={isScanning ? stopScanning : startScanning}
          >
            <Ionicons 
              name={isScanning ? "stop" : "scan"} 
              size={28} 
              color="white" 
            />
          </TouchableOpacity>

          {/* Profile Button */}
          <TouchableOpacity
            style={styles.navButton}
            onPress={navigateToProfile}
          >
            <Ionicons name="person" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Manual Input Modal */}
      <Modal
        visible={showManualInput}
        transparent={true}
        animationType="slide"
        onRequestClose={closeManualInput}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter ID Number</Text>
            <Text style={styles.modalSubtitle}>Type the ID number manually</Text>
            
            <TextInput
              style={styles.textInput}
              placeholder="Enter ID number"
              placeholderTextColor="#999"
              value={manualIdInput}
              onChangeText={setManualIdInput}
              returnKeyType="done"
              onSubmitEditing={submitManualId}
              autoFocus={true}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeManualInput}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={submitManualId}
                disabled={isSearching}
              >
                <Text style={styles.modalButtonText}>
                  {isSearching ? 'Searching...' : 'Search Database'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Processing QR Code Overlay */}
      {isProcessingQR && (
        <Modal transparent={true} visible={isProcessingQR}>
          <View style={styles.processingOverlay}>
            <View style={styles.processingContainer}>
              <Text style={styles.processingText}>Processing QR Code...</Text>
              <Text style={styles.processingSubtext}>Looking up in database</Text>
            </View>
          </View>
        </Modal>
      )}

      {/* Database Lookup Result Modal */}
      {showLookupResult && lookupResult && (
        <DatabaseLookupDisplay
          data={lookupResult}
          onClose={closeLookupResult}
          onScanAnother={handleScanAnother}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  middleContainer: {
    flexDirection: 'row',
    flex: 1.5,
  },
  focusedContainer: {
    flex: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 10,
  },
  scanText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  text: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 45,
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 300,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
  },
  centerButtonActive: {
    backgroundColor: '#DC3545',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  textInput: {
    width: '100%',
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  submitButton: {
    backgroundColor: '#28A745',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  processingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContainer: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    minWidth: 200,
  },
  processingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  processingSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  logoButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  flashButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  flashButtonActive: {
    backgroundColor: '#FFD700',
  },
  flashButtonDisabled: {
    backgroundColor: '#f0f0f0',
    opacity: 0.6,
  },
});
