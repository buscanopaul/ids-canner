import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import SubscriptionPlanSelector from '../components/SubscriptionPlanSelector';
import SubscriptionService, { SUBSCRIPTION_PLANS } from '../services/subscriptionService';

export default function SubscriptionSelectionScreen() {
  const router = useRouter();
  const { user } = useUser();
  const params = useLocalSearchParams();
  const [selectedPlan, setSelectedPlan] = useState(SUBSCRIPTION_PLANS.FREE);
  const [loading, setLoading] = useState(false);

  const handlePlanSelect = async (planType) => {
    if (loading) return;

    setSelectedPlan(planType);
    setLoading(true);

    try {
      // For demo purposes, we'll just update the metadata
      // In a real app, you'd integrate with a payment processor here
      if (planType !== SUBSCRIPTION_PLANS.FREE) {
        // For now, just show a message about payment integration
        Alert.alert(
          'Payment Integration Required',
          'In a production app, this would integrate with a payment processor like Stripe.',
          [
            {
              text: 'Use Free Plan',
              onPress: () => handleFreePlan(),
            },
            {
              text: 'Continue Demo',
              onPress: () => handlePaidPlan(planType),
            },
          ]
        );
        setLoading(false);
        return;
      }

      await handleFreePlan();
    } catch (error) {
      console.error('Error selecting plan:', error);
      Alert.alert('Error', 'Failed to select plan. Please try again.');
      setLoading(false);
    }
  };

  const handleFreePlan = async () => {
    try {
      // Initialize subscription with free plan
      await SubscriptionService.initializeUserSubscription(user);
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error setting up free plan:', error);
      Alert.alert('Error', 'Failed to set up your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaidPlan = async (planType) => {
    try {
      // For demo purposes, just set the plan
      // In production, this would happen after successful payment
      await SubscriptionService.updateSubscriptionPlan(user, planType);
      
      Alert.alert(
        'Success!',
        `You've been upgraded to ${SubscriptionService.getPlanDetails(planType).name}!`,
        [
          {
            text: 'Get Started',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      console.error('Error setting up paid plan:', error);
      Alert.alert('Error', 'Failed to set up your subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      // Initialize with free plan
      await SubscriptionService.initializeUserSubscription(user);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error skipping plan selection:', error);
      Alert.alert('Error', 'Failed to set up your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SubscriptionPlanSelector
        selectedPlan={selectedPlan}
        onPlanSelect={handlePlanSelect}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
}); 