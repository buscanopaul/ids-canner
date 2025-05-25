import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

const tokenCache = {
  async getToken(key) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key, value) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

function RootLayoutNav() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(null);

  // Check onboarding status on app start
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const onboardingStatus = await AsyncStorage.getItem(
          'hasSeenOnboarding'
        );
        setHasSeenOnboarding(onboardingStatus === 'true');
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setHasSeenOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  // Re-check onboarding status when segments change (to catch updates from onboarding screen)
  useEffect(() => {
    const recheckOnboardingStatus = async () => {
      try {
        const onboardingStatus = await AsyncStorage.getItem(
          'hasSeenOnboarding'
        );
        setHasSeenOnboarding(onboardingStatus === 'true');
      } catch (error) {
        console.error('Error re-checking onboarding status:', error);
      }
    };

    // Only recheck if we're navigating and segments have changed
    if (segments.length > 0) {
      recheckOnboardingStatus();
    }
  }, [segments]);

  useEffect(() => {
    if (!isLoaded || hasSeenOnboarding === null) return;

    const inAuthGroup = segments[0] === '(auth)';
    const currentPath = segments.join('/');

    // If user hasn't seen onboarding, show onboarding screen
    if (!hasSeenOnboarding) {
      if (currentPath !== '(auth)/onboarding') {
        router.replace('/(auth)/onboarding');
      }
      return;
    }

    // User has seen onboarding
    if (isSignedIn) {
      // User is signed in, redirect to main app if on auth screens
      if (inAuthGroup) {
        router.replace('/(tabs)');
      }
    } else {
      // User is not signed in, redirect to sign in if not on auth screens or if on onboarding
      if (!inAuthGroup || currentPath === '(auth)/onboarding') {
        router.replace('/(auth)/sign-in');
      }
    }
  }, [isSignedIn, segments, isLoaded, hasSeenOnboarding]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <ClerkProvider
      tokenCache={tokenCache}
      publishableKey={CLERK_PUBLISHABLE_KEY}
    >
      <ClerkLoaded>
        <RootLayoutNav />
      </ClerkLoaded>
    </ClerkProvider>
  );
}
