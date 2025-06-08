import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { SUBSCRIPTION_PLANS, PLAN_DETAILS } from '../services/subscriptionService';
import SubscriptionService from '../services/subscriptionService';
import PaymentModal from './PaymentModal';

const EnhancedSubscriptionSelector = ({ onSubscriptionComplete, onSkip }) => {
  const { user } = useUser();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handlePlanSelect = async (planType) => {
    if (loading) return;
    
    setSelectedPlan(planType);
    
    // For paid plans, show payment modal
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = () => {
    setShowPaymentModal(false);
    onSubscriptionComplete?.(selectedPlan);
  };

  const PlanCard = ({ planType, isSelected }) => {
    const plan = PLAN_DETAILS[planType];
    const isPopular = planType === SUBSCRIPTION_PLANS.YEARLY_PRO;

    return (
      <TouchableOpacity
        style={[
          styles.planCard,
          isSelected && styles.selectedPlan,
          isPopular && styles.popularPlan
        ]}
        onPress={() => handlePlanSelect(planType)}
        disabled={loading}
      >
        {isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
          </View>
        )}
        
        <View style={styles.planHeader}>
          <Text style={[styles.planName, isSelected && styles.selectedText]}>
            {plan.name}
          </Text>
          <View style={styles.priceContainer}>
            <Text style={[styles.price, isSelected && styles.selectedText]}>
              {plan.price}
            </Text>
            <Text style={[styles.period, isSelected && styles.selectedText]}>
              {plan.period}
            </Text>
          </View>
          
          {planType === SUBSCRIPTION_PLANS.YEARLY_PRO && (
            <View style={styles.savingsContainer}>
              <Text style={[styles.savingsText, isSelected && styles.selectedText]}>
                Save ₱40 per year!
              </Text>
            </View>
          )}
        </View>

        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons 
                name="checkmark-circle" 
                size={16} 
                color={isSelected ? '#fff' : '#10B981'} 
              />
              <Text style={[styles.featureText, isSelected && styles.selectedText]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.selectButton,
              isSelected && styles.selectedButton,
              !isSelected && styles.proButton
            ]}
            onPress={() => handlePlanSelect(planType)}
            disabled={loading}
          >
            <Text style={[
              styles.selectButtonText,
              isSelected && styles.selectedButtonText,
              !isSelected && styles.proButtonText
            ]}>
              {isSelected ? 'Selected' : 'Upgrade Now'}
            </Text>
            {!isSelected && (
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>
            Select a plan that works best for you. Upgrade anytime with secure payments via PayMongo.
          </Text>
        </View>

        <View style={styles.plansContainer}>
          <PlanCard 
            planType={SUBSCRIPTION_PLANS.MONTHLY_PRO} 
            isSelected={selectedPlan === SUBSCRIPTION_PLANS.MONTHLY_PRO}
          />
          <PlanCard 
            planType={SUBSCRIPTION_PLANS.YEARLY_PRO} 
            isSelected={selectedPlan === SUBSCRIPTION_PLANS.YEARLY_PRO}
          />
        </View>

        <View style={styles.paymentMethods}>
          <Text style={styles.paymentMethodsTitle}>Accepted Payment Methods</Text>
          <View style={styles.paymentMethodsRow}>
            <View style={styles.paymentMethodItem}>
              <Ionicons name="card" size={24} color="#3b82f6" />
              <Text style={styles.paymentMethodLabel}>Credit/Debit Cards</Text>
            </View>
            <View style={styles.paymentMethodItem}>
              <Ionicons name="phone-portrait" size={24} color="#00D4FF" />
              <Text style={styles.paymentMethodLabel}>GCash</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={onSkip}
            disabled={loading}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
          
          <Text style={styles.footerNote}>
            • Secure payments powered by PayMongo{'\n'}
            • Cancel anytime • 30-day money-back guarantee
          </Text>
        </View>
      </ScrollView>

      <PaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        selectedPlan={selectedPlan}
        planDetails={selectedPlan ? PLAN_DETAILS[selectedPlan] : null}
        onPaymentComplete={handlePaymentComplete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  plansContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedPlan: {
    borderColor: '#3b82f6',
    backgroundColor: '#3b82f6',
  },
  popularPlan: {
    borderColor: '#10b981',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    marginBottom: 20,
  },
  planName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  period: {
    fontSize: 16,
    color: '#6b7280',
  },
  savingsContainer: {
    marginTop: 4,
  },
  savingsText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  selectedText: {
    color: '#fff',
  },
  actionContainer: {
    marginTop: 'auto',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  proButton: {
    backgroundColor: '#3b82f6',
  },
  selectedButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  proButtonText: {
    color: '#fff',
  },
  selectedButtonText: {
    color: '#fff',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  paymentMethods: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  paymentMethodsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 32,
  },
  paymentMethodItem: {
    alignItems: 'center',
    gap: 8,
  },
  paymentMethodLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#6b7280',
    textDecorationLine: 'underline',
  },
  footerNote: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default EnhancedSubscriptionSelector; 