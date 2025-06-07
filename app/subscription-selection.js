import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import EnhancedSubscriptionSelector from './components/EnhancedSubscriptionSelector';
import SubscriptionService from './services/subscriptionService';

export default function SubscriptionSelectionScreen() {
  const router = useRouter();
  const { user } = useUser();
  
  console.log('SubscriptionSelectionScreen mounted (root)', { user: !!user });

  const handleSubscriptionComplete = (planType) => {
    // Navigate to main app after subscription is complete
    router.replace('/(tabs)');
  };

  const handleSkip = async () => {
    try {
      // Initialize with free plan
      await SubscriptionService.initializeUserSubscription(user);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error skipping plan selection:', error);
      Alert.alert('Error', 'Failed to set up your account. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={{ padding: 20, fontSize: 18, textAlign: 'center' }}>
        Subscription Selection Screen (Root)
      </Text>
      <EnhancedSubscriptionSelector
        onSubscriptionComplete={handleSubscriptionComplete}
        onSkip={handleSkip}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
}); 