import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OnboardingScreen() {
  const router = useRouter();

  const handleGetStarted = async () => {
    try {
      // Mark onboarding as completed
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');

      // Navigate to sign-in
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      // Still navigate even if storage fails
      router.replace('/(auth)/sign-in');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* Top section with logo and app name */}
      <View style={styles.topSection}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <View style={styles.logoInner}>
              {/* Concentric circles representing the scanner logo */}
              <View style={styles.circle1} />
              <View style={styles.circle2} />
              <View style={styles.circle3} />
              <View style={styles.centerDot} />
            </View>
          </View>
        </View>
        <Text style={styles.appName}>Edge Scanner</Text>
      </View>

      {/* Bottom section with content */}
      <View style={styles.bottomSection}>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Fast and simple scanning</Text>
          <Text style={styles.description}>
            Effortless and smooth document{'\n'}scanning with smart features.
          </Text>
          <View style={{ height: 40 }} />
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
          >
            <Text style={styles.buttonText}>Get Started</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 120,
    backgroundColor: '#4F46E5',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoInner: {
    position: 'relative',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle1: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  circle2: {
    position: 'absolute',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  circle3: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  centerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
  },
  appName: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1f2937',
    letterSpacing: -0.5,
  },
  bottomSection: {
    backgroundColor: '#1f2937',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 32,
    minHeight: 400,
  },
  contentContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 18,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 48,
  },
  indicators: {
    flexDirection: 'row',
    marginBottom: 48,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
  },
  activeIndicator: {
    backgroundColor: '#4F46E5',
    width: 24,
  },
  getStartedButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 50,
    minWidth: 200,
    shadowColor: '#4F46E5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  arrow: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
});
