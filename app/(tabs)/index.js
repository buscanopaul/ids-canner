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
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useUser } from '@clerk/clerk-expo';
import { Entypo, Ionicons, MaterialIcons } from '@expo/vector-icons';
import LoadingDots from '../components/LoadingDots';

const { width, height } = Dimensions.get('window');

export default function ScannerScreen() {
  const { user } = useUser();
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [flashMode, setFlashMode] = useState('off');
  const [isScanning, setIsScanning] = useState(false);
  const [selectedOption, setSelectedOption] = useState(1); // 0=manual, 1=scanner, 2=profile
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

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

  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return;

    setScanned(true);
    setIsScanning(true);

    // Simulate nutrition checking delay
    setTimeout(() => {
      setIsScanning(false);
      Alert.alert(
        'Scanned Successfully',
        `Bar code with type ${type} and data ${data} has been scanned!`,
        [
          {
            text: 'Scan Another',
            onPress: () => setScanned(false),
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
    Alert.alert('Manual Input', 'Manual ID input feature coming soon!');
  };

  const handleScannerSelect = () => {
    setSelectedOption(1);
    setScanned(false);
  };

  const handleProfileSelect = () => {
    setSelectedOption(2);
    Alert.alert('Profile', 'Profile feature coming soon!');
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
          <TouchableOpacity style={styles.logoButton}>
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
          </Animated.View>
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
                marginLeft: -85,
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
          </View>
        </View>
      </CameraView>
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
});
