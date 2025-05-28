import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  StatusBar,
  Animated,
  Image,
  Platform,
  Linking,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useUser } from '@clerk/clerk-expo';
import { Entypo, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import LoadingDots from '../components/LoadingDots';

const { width, height } = Dimensions.get('window');

export default function ScannerScreen() {
  const { user } = useUser();
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [flashMode, setFlashMode] = useState('off');
  const [isScanning, setIsScanning] = useState(false);
  const [selectedOption, setSelectedOption] = useState(1); // 0=manual, 1=scanner, 2=profile
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [selectedIdType, setSelectedIdType] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [profileButtonScale] = useState(new Animated.Value(1));
  const [screenOpacity] = useState(new Animated.Value(1));
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  const idTypes = [
    'Driver\'s License',
    'Senior Citizen',
    'PWD ID',
    'Passport',
    'National ID',
    'SSS ID',
    'GSIS ID',
    'PRC ID',
    'OWWA ID',
    'NBI Clearance',
    'PSA Birth Certificate',
  ];

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  // Screen entrance animation when returning from profile
  useEffect(() => {
    const unsubscribe = router.canGoBack ? () => {
      // Animate screen entrance when returning
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } : null;

    return unsubscribe;
  }, [router]);

  useEffect(() => {
    // Pulse animation for scan frame
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (showBottomSheet) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showBottomSheet]);

  useEffect(() => {
    if (isScannerActive) {
      // Start scan line animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Reset scan line animation
      scanLineAnim.setValue(0);
    }
  }, [isScannerActive]);

  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return;

    setScanned(true);
    setIsScanning(true);
    setIsScannerActive(false);

    // Simulate nutrition checking delay
    setTimeout(() => {
      setIsScanning(false);
      Alert.alert(
        'Scanned Successfully',
        `Bar code with type ${type} and data ${data} has been scanned!`,
        [
          {
            text: 'Scan Another',
            onPress: () => {
              setScanned(false);
              setIsScannerActive(true);
            },
          },
        ]
      );
    }, 2000);
  };

  const toggleFlash = () => {
    setFlashMode(flashMode === 'off' ? 'on' : 'off');
  };

  const handleManualInput = () => {
    setSelectedOption(0);
    setIsScannerActive(false);
    setFlashMode('off');
    setShowBottomSheet(true);
    setManualInput('');
    setSelectedIdType('');
    setShowDropdown(false);
  };

  const closeBottomSheet = () => {
    setShowBottomSheet(false);
    setManualInput('');
    setSelectedIdType('');
    setShowDropdown(false);
    setIsVerifying(false);
  };

  const handleDropdownSelect = (idType) => {
    setSelectedIdType(idType);
    setShowDropdown(false);
  };

  const handleVerifyInput = () => {
    if (!selectedIdType) {
      Alert.alert('Error', 'Please select an ID type');
      return;
    }
    if (!manualInput.trim()) {
      Alert.alert('Error', 'Please enter an ID number');
      return;
    }

    setIsVerifying(true);

    // Simulate verification process
    setTimeout(() => {
      setIsVerifying(false);
      Alert.alert(
        'Verification Complete',
        `${selectedIdType} with ID "${manualInput}" has been verified!`,
        [
          {
            text: 'OK',
            onPress: closeBottomSheet,
          },
        ]
      );
    }, 2000);
  };

  const handleScannerSelect = () => {
    setSelectedOption(1);
    setScanned(false);
    setIsScannerActive(true);
  };

  const handleProfileSelect = () => {
    setSelectedOption(2);
    setIsScannerActive(false);
    setFlashMode('off');
    
    // Animate button press
    Animated.sequence([
      Animated.timing(profileButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(profileButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Add a slight delay before navigation for smooth transition
    setTimeout(() => {
      router.push('/(tabs)/profile');
    }, 200);
  };

  const handleLogoPress = () => {
    const appId = 'your-app-id'; // Replace with your actual app ID
    let storeUrl;

    if (Platform.OS === 'ios') {
      // iOS App Store URL for reviews
      storeUrl = `https://apps.apple.com/app/id${appId}?action=write-review`;
    } else {
      // Google Play Store URL for reviews
      storeUrl = `https://play.google.com/store/apps/details?id=com.yourcompany.edgescanner&showAllReviews=true`;
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
        <Text style={styles.permissionText}>
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>No access to camera</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => Camera.requestCameraPermissionsAsync()}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Animated.View style={[{ flex: 1 }, { opacity: screenOpacity }]}>
        <CameraView
          style={styles.camera}
          facing="back"
          flash={flashMode}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: [
              'qr',
              'ean13',
              'ean8',
              'code128',
              'code39',
              'upc_a',
              'upc_e',
              'codabar',
            ],
          }}
        >
          {/* Top Controls - Logo left, Flash right */}
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
              ]}
              onPress={toggleFlash}
            >
              <Ionicons
                name={flashMode === 'on' ? 'flash' : 'flash-off'}
                size={18}
                color="black"
              />
            </TouchableOpacity>
          </View>

          {/* Scanning Frame */}
          <View style={styles.scanningArea}>
            <Animated.View style={[styles.scanFrame, { opacity: pulseAnim }]}>
              {/* Corner borders */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {/* Animated Scan Line */}
              {isScannerActive && (
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      transform: [
                        {
                          translateY: scanLineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, width * 0.8 - 4], // Scan from top to bottom of frame
                          }),
                        },
                      ],
                    },
                  ]}
                />
              )}
            </Animated.View>
            
            {/* Instruction Text */}
            {!scanned && !isScanning && !isScannerActive && (
              <View style={styles.instructionContainer}>
                <Text style={styles.instructionText}>
                  Tap the scanner button below to start scanning
                </Text>
              </View>
            )}
            
            {/* Active Scanning Instructions */}
            {isScannerActive && !scanned && !isScanning && (
              <View style={styles.activeScanContainer}>
                <Text style={styles.activeScanText}>
                  🔍 Scanning Active
                </Text>
                <Text style={styles.activeScanSubtext}>
                  Point your camera at a barcode or QR code
                </Text>
              </View>
            )}
          </View>

          {/* Status Text */}
          {isScanning && (
            <View style={styles.statusContainer}>
              <View style={styles.statusBubble}>
                <Text style={styles.statusText}>
                  Checking nutrition details...
                </Text>
                <LoadingDots />
              </View>
            </View>
          )}

          {/* Bottom Controls - 3 Options */}
          <View style={styles.bottomControls}>
            <View style={styles.bottomOptionsContainer}>
              {/* Manual Input */}
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedOption === 0 && styles.selectedOption,
                ]}
                onPress={handleManualInput}
              >
                <Entypo
                  name="keyboard"
                  size={24}
                  color={selectedOption === 0 ? 'white' : 'white'}
                />
              </TouchableOpacity>

              {/* Scanner */}
              <TouchableOpacity
                style={[styles.optionButton]}
                onPress={handleScannerSelect}
              >
                <Ionicons name="scan" size={28} color="white" />
              </TouchableOpacity>
              <View
                style={{
                  position: 'absolute',
                  width: 90,
                  height: 90,
                  backgroundColor: '#4F46E5',
                  borderRadius: 90,
                  left: '50%',
                  marginLeft: Platform.OS === 'ios' ? -85 : -45,
                  top: '50%',
                  marginTop: -40,
                  zIndex: -1,
                  shadowColor: '#4F46E5',
                  shadowOffset: {
                    width: 0,
                    height: 4,
                  },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 12,
                }}
              />

              {/* Profile */}
              <Animated.View style={{ transform: [{ scale: profileButtonScale }] }}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    selectedOption === 2 && styles.selectedOption,
                  ]}
                  onPress={handleProfileSelect}
                >
                  <MaterialIcons
                    name="broadcast-on-personal"
                    size={24}
                    color={selectedOption === 2 ? 'white' : 'white'}
                  />
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </CameraView>
      </Animated.View>

      {/* Bottom Sheet Modal */}
      <Modal
        visible={showBottomSheet}
        transparent={true}
        animationType="none"
        onRequestClose={closeBottomSheet}
      >
        <TouchableWithoutFeedback onPress={closeBottomSheet}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
              >
                <Animated.View
                  style={[
                    styles.bottomSheet,
                    { transform: [{ translateY: slideAnim }] },
                  ]}
                >
                  {/* Handle Bar */}
                  <View style={styles.handleBar} />
                  
                  {/* Content */}
                  <View style={styles.bottomSheetContent}>
                    <Text style={styles.bottomSheetTitle}>
                      Enter ID Information
                    </Text>
                    <Text style={styles.bottomSheetSubtitle}>
                      Select ID type and enter ID number for verification
                    </Text>
                    
                    {/* ID Type Dropdown */}
                    <TouchableOpacity
                      style={[
                        styles.dropdownButton,
                        isVerifying && styles.dropdownButtonDisabled
                      ]}
                      onPress={() => !isVerifying && setShowDropdown(!showDropdown)}
                      disabled={isVerifying}
                    >
                      <Text style={[
                        styles.dropdownButtonText,
                        !selectedIdType && styles.dropdownPlaceholder,
                        isVerifying && styles.dropdownTextDisabled
                      ]}>
                        {selectedIdType || 'Select ID Type'}
                      </Text>
                      <Ionicons 
                        name={showDropdown ? 'chevron-up' : 'chevron-down'} 
                        size={20} 
                        color={isVerifying ? "#CCC" : "#666"} 
                      />
                    </TouchableOpacity>
                    
                    {/* Dropdown List */}
                    {showDropdown && !isVerifying && (
                      <ScrollView style={styles.dropdownList}>
                        {idTypes.map((idType, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.dropdownItem,
                              index === idTypes.length - 1 && styles.dropdownItemLast
                            ]}
                            onPress={() => handleDropdownSelect(idType)}
                          >
                            <Text style={styles.dropdownItemText}>{idType}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                    
                    <TextInput
                      style={[
                        styles.textInput,
                        isVerifying && styles.textInputDisabled
                      ]}
                      placeholder="Enter ID number"
                      placeholderTextColor={isVerifying ? "#CCC" : "#999"}
                      value={manualInput}
                      onChangeText={setManualInput}
                      returnKeyType="done"
                      onSubmitEditing={handleVerifyInput}
                      editable={!isVerifying}
                    />
                    
                    <TouchableOpacity
                      style={[
                        styles.verifyButton,
                        isVerifying && styles.verifyButtonDisabled,
                      ]}
                      onPress={handleVerifyInput}
                      disabled={isVerifying}
                    >
                      {isVerifying ? (
                        <View style={styles.verifyingContainer}>
                          <Text style={styles.verifyButtonText}>Verifying...</Text>
                          <LoadingDots />
                        </View>
                      ) : (
                        <Text style={styles.verifyButtonText}>Verify</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
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
    borderRadius: 25,
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
    borderRadius: 25,
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
  profileButton: {
    width: 50,
    height: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  profileText: {
    color: '#4F46E5',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scanningArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: width * 0.8,
    height: width * 0.8,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: 'white',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 10,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 10,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 10,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 10,
  },
  statusContainer: {
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  statusBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#333',
    marginRight: 10,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bottomOptionsContainer: {
    flexDirection: 'row',
    backgroundColor: '#191a20',
    borderRadius: 90,
    paddingHorizontal: 20,
    paddingVertical: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    gap: 20,
  },
  optionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  permissionText: {
    textAlign: 'center',
    fontSize: 18,
    color: 'white',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
    minHeight: 480,
    maxHeight: height * 0.8,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  bottomSheetContent: {
    alignItems: 'center',
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  bottomSheetSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  textInput: {
    width: '100%',
    height: 50,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    marginBottom: 20,
  },
  verifyButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  verifyButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  instructionContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 3,
  },
  instructionSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 3,
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: '#4F46E5',
    left: 0,
    top: 0,
    shadowColor: '#4F46E5',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  activeScanContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  activeScanText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 3,
  },
  activeScanSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 3,
  },
  dropdownButton: {
    width: '100%',
    height: 50,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownPlaceholder: {
    color: '#999',
  },
  dropdownList: {
    width: '100%',
    maxHeight: 200,
    backgroundColor: 'white',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 8,
    marginTop: -20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.6,
  },
  dropdownTextDisabled: {
    color: '#9CA3AF',
  },
  textInputDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.6,
  },
});
