import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

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

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (isSignedIn) {
      // User is signed in, redirect to main app if on auth screens
      if (inAuthGroup) {
        router.replace('/(tabs)');
      }
    } else {
      // User is not signed in, redirect to sign in if not on auth screens
      if (!inAuthGroup) {
        router.replace('/(auth)/sign-in');
      }
    }
  }, [isSignedIn, segments, isLoaded]);

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
