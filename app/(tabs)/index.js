import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Alert, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, Image, Linking } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import AppwriteService from '../services/appwriteService';
import DatabaseLookupDisplay from '../components/DatabaseLookupDisplay';

import SubscriptionService from '../services/subscriptionService';
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
  const [isCameraOn, setIsCameraOn] = useState(true);

  const [remainingScans, setRemainingScans] = useState(2);
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  useEffect(() => {
    if (!isScanning || !isCameraOn) {
      setFlashMode('off');
    }
  }, [isScanning, isCameraOn]);

  useEffect(() => {
    if (!isCameraOn) {
      setIsScanning(false);
    }
  }, [isCameraOn]);

  useEffect(() => {
    setIsScanning(false);
  }, [showLookupResult]);

  // Check subscription status and update remaining scans
  useEffect(() => {
    if (user) {
      const checkSubscription = async () => {
        try {
          await SubscriptionService.initializeUserSubscription(user);
          const { canScan, remainingScans: remaining, wasExpired } = await SubscriptionService.canPerformScan(user);
          setRemainingScans(remaining);
          
          // Show notification if subscription was expired and downgraded
          if (wasExpired) {
            Alert.alert(
              'Subscription Expired',
              'Your subscription has expired and you have been downgraded to the free plan. Upgrade to continue enjoying unlimited scans.',
              [{ text: 'OK' }, { text: 'Upgrade Now', onPress: handleSubscriptionUpgrade }]
            );
          }
        } catch (error) {
          console.error('Error checking subscription:', error);
        }
      };
      checkSubscription();
    }
  }, [user]);

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || isProcessingQR) return; // Prevent multiple scans
    
    // Check subscription limits before processing scan
    if (user) {
      const { canScan, wasExpired } = await SubscriptionService.canPerformScan(user);
      if (!canScan) {
        setScanned(true);
        setIsScanning(false);
        
        // Show different message if subscription was expired
        if (wasExpired) {
          Alert.alert(
            'Subscription Expired',
            'Your subscription has expired. Please upgrade to continue scanning.',
            [
              { text: 'Cancel' },
              { text: 'Upgrade Now', onPress: handleSubscriptionUpgrade }
            ]
          );
        } else {
          handleSubscriptionUpgrade();
        }
        return;
      }
    }
    
    setScanned(true);
    setIsScanning(false); // Stop scanning immediately
    setIsProcessingQR(true);

    try {
      console.log('QR Code scanned:', data);
      
      // Increment scan count
      if (user) {
        await SubscriptionService.incrementScanCount(user);
        const { remainingScans: remaining } = await SubscriptionService.canPerformScan(user);
        setRemainingScans(remaining);
      }
      
      // Use the existing parseIDData function to process the scanned data
      const parsedData = await parseIDData(data, type);
      
      // Check if user can view photos
      const canViewPhotos = user ? SubscriptionService.canViewPhotos(user) : false;
      if (!canViewPhotos && parsedData.photo) {
        delete parsedData.photo; // Remove photo for free users
      }
      
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

  const startScanning = async () => {
    if (!isCameraOn) {
      Alert.alert('Turn On Camera', 'Please turn on the camera first before scanning');
      return;
    }
    
    // Check subscription limits before starting scan
    if (user) {
      const { canScan } = await SubscriptionService.canPerformScan(user);
      if (!canScan) {
        handleSubscriptionUpgrade();
        return;
      }
    }
    
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

  const openManualInput = async () => {
    // Check subscription limits before opening manual input
    if (user) {
      const { canScan } = await SubscriptionService.canPerformScan(user);
      if (!canScan) {
        handleSubscriptionUpgrade();
        return;
      }
    }
    
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

    // Check subscription limits before processing manual lookup
    if (user) {
      const { canScan } = await SubscriptionService.canPerformScan(user);
      if (!canScan) {
        closeManualInput();
        handleSubscriptionUpgrade();
        return;
      }
    }

    setIsSearching(true);

    try {
      console.log('Looking up ID:', manualIdInput.trim());
      const result = await AppwriteService.lookupIdByNumber(manualIdInput.trim());
      
      if (result.found) {
        // Increment scan count for manual lookup
        if (user) {
          await SubscriptionService.incrementScanCount(user);
          const { remainingScans: remaining } = await SubscriptionService.canPerformScan(user);
          setRemainingScans(remaining);
        }
        
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
        
        // Check if user can view photos
        const canViewPhotos = user ? SubscriptionService.canViewPhotos(user) : false;
        if (!canViewPhotos && transformedData.photo) {
          delete transformedData.photo; // Remove photo for free users
        }
        
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

  const toggleCamera = () => {
    setIsCameraOn(!isCameraOn);
    if (isCameraOn) {
      // Turning off camera also stops scanning
      setIsScanning(false);
      setFlashMode('off');
    }
  };

  const toggleFlash = () => {
    if (!isScanning || !isCameraOn) {
      Alert.alert('Start Scanning First', 'Please turn on camera and start scanning before using the flash');
      return;
    }
    const newFlashMode = flashMode === 'off' ? 'on' : 'off';
    setFlashMode(newFlashMode);
  };

  const handleSubscriptionUpgrade = async (planType) => {
    // Navigate to subscription selection screen instead of directly upgrading
    // This ensures payment flow is followed for paid plans
    console.log('Navigating to subscription selection...');
    try {
      router.push('/subscription-selection');
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Navigation Error', 'Unable to open subscription page. Please try again.');
    }
  };

  const handleLogoPress = () => {
    const appId = 'edge-scanner' // Replace with your actual app ID
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
      {isCameraOn ? (
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

            {/* Scan Counter */}
            {user && remainingScans >= 0 && (
              <TouchableOpacity 
                style={styles.scanCounter}
                onPress={remainingScans === 0 ? handleSubscriptionUpgrade : undefined}
                activeOpacity={remainingScans === 0 ? 0.7 : 1}
              >
                <Text style={styles.scanCounterText}>
                  {remainingScans === -1 ? '∞' : remainingScans} scans left
                </Text>
                {remainingScans === 0 && (
                  <Ionicons 
                    name="chevron-forward" 
                    size={14} 
                    color="rgba(255, 255, 255, 0.8)" 
                    style={styles.scanCounterIcon}
                  />
                )}
              </TouchableOpacity>
            )}

            <View style={styles.rightControls}>
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={toggleCamera}
              >
                <Ionicons
                  name="videocam"
                  size={18}
                  color="black"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.flashButton,
                  flashMode === 'on' && styles.flashButtonActive,
                  (!isScanning || !isCameraOn) && styles.flashButtonDisabled,
                ]}
                onPress={toggleFlash}
              >
                <Ionicons
                  name={flashMode === 'on' ? 'flash' : 'flash-off'}
                  size={18}
                  color={(!isScanning || !isCameraOn) ? '#ccc' : 'black'}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.overlay}>
            <View style={styles.unfocusedContainer}></View>
            <View style={styles.middleContainer}>
              <View style={styles.unfocusedContainer}></View>
              <View style={styles.focusedContainer}>
                {/* Corner Brackets */}
                <View style={[styles.cornerBracket, styles.topLeft]} />
                <View style={[styles.cornerBracket, styles.topRight]} />
                <View style={[styles.cornerBracket, styles.bottomLeft]} />
                <View style={[styles.cornerBracket, styles.bottomRight]} />
                
                <Text style={styles.scanText}>
                  {isScanning ? 'Scanning for QR Code...' : 'Click the scan button to start'}
                </Text>
                {!isScanning && remainingScans === 0 && (
                  <Text style={styles.resetMessageText}>
                    Scans reset tomorrow
                  </Text>
                )}
              </View>
              <View style={styles.unfocusedContainer}></View>
            </View>
            <View style={styles.unfocusedContainer}></View>
          </View>
        </CameraView>
      ) : (
        <View style={styles.cameraOff}>
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.logoButton} onPress={handleLogoPress}>
              <Image
                source={require('../../assets/logo_edgescanner.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* Scan Counter */}
            {user && remainingScans >= 0 && (
              <TouchableOpacity 
                style={styles.scanCounter}
                onPress={remainingScans === 0 ? handleSubscriptionUpgrade : undefined}
                activeOpacity={remainingScans === 0 ? 0.7 : 1}
              >
                <Text style={styles.scanCounterText}>
                  {remainingScans === -1 ? '∞' : remainingScans} scans left
                </Text>
                {remainingScans === 0 && (
                  <Ionicons 
                    name="chevron-forward" 
                    size={14} 
                    color="rgba(255, 255, 255, 0.8)" 
                    style={styles.scanCounterIcon}
                  />
                )}
              </TouchableOpacity>
            )}

            <View style={styles.rightControls}>
              <TouchableOpacity
                style={[styles.cameraButton, styles.cameraButtonOff]}
                onPress={toggleCamera}
              >
                <Ionicons
                  name="videocam-off"
                  size={18}
                  color="white"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.flashButton, styles.flashButtonDisabled]}
                onPress={toggleFlash}
              >
                <Ionicons
                  name="flash-off"
                  size={18}
                  color="#ccc"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.cameraOffContent}>
            <Ionicons name="videocam-off" size={80} color="#666" />
            <Text style={styles.cameraOffText}>Camera is off</Text>
            <Text style={styles.cameraOffSubtext}>Tap the camera button to turn it back on</Text>
          </View>
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <View style={styles.bottomNavigation}>
          {/* Manual Input - Keypad Icon */}
          <TouchableOpacity
            style={styles.navButton}
            onPress={openManualInput}
          >
            <Ionicons name="keypad" size={24} color="white" />
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
        <View style={styles.modernModalOverlay}>
          <KeyboardAvoidingView
            style={styles.modernModalContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modernModalContent}>
              {/* Close Button */}
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={closeManualInput}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>

              {/* Illustration */}
              <View style={styles.illustrationContainer}>
                <View style={styles.idCardIllustration}>
                  <Ionicons name="card" size={48} color="#4F46E5" />
                </View>
              </View>

              {/* Title */}
              <Text style={styles.modernModalTitle}>Enter ID Number</Text>
              
              {/* Description */}
              <Text style={styles.modernModalDescription}>
                Type the ID number manually to search our database for verification
              </Text>
              
              {/* Input Field */}
              <TextInput
                style={styles.modernTextInput}
                placeholder="Enter ID number"
                placeholderTextColor="#999"
                value={manualIdInput}
                onChangeText={setManualIdInput}
                returnKeyType="done"
                onSubmitEditing={submitManualId}
                autoFocus={true}
              />
              
              {/* Search Button */}
              <TouchableOpacity
                style={[styles.modernButton, isSearching && styles.modernButtonDisabled]}
                onPress={submitManualId}
                disabled={isSearching}
              >
                <Text style={styles.modernButtonText}>
                  {isSearching ? 'Searching...' : 'Search Database'}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
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
    backgroundColor: 'transparent',
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
    position: 'relative',
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
  modernModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modernModalContainer: {
    justifyContent: 'flex-end',
  },
  modernModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    minHeight: 400,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 24,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  idCardIllustration: {
    width: 100,
    height: 70,
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7ff',
  },
  modernModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 12,
  },
  modernModalDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  modernTextInput: {
    width: '100%',
    height: 56,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  modernButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#8BC34A',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8BC34A',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modernButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  modernButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
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
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cameraButton: {
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
  cameraButtonOff: {
    backgroundColor: '#666',
  },
  cameraOff: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraOffContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  cameraOffText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
    marginBottom: 8,
  },
  cameraOffSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
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
  cornerBracket: {
    width: 30,
    height: 30,
    position: 'absolute',
  },
  topLeft: {
    top: 20,
    left: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#fff',
    borderTopLeftRadius: 5,
  },
  topRight: {
    top: 20,
    right: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#fff',
    borderTopRightRadius: 5,
  },
  bottomLeft: {
    bottom: 20,
    left: 20,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#fff',
    borderBottomLeftRadius: 5,
  },
  bottomRight: {
    bottom: 20,
    right: 20,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#fff',
    borderBottomRightRadius: 5,
  },
  scanCounter: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scanCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  scanCounterIcon: {
    marginLeft: 2,
  },
  resetMessageText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
});
