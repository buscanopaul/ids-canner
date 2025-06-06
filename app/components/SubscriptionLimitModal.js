import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SUBSCRIPTION_PLANS, PLAN_DETAILS } from '../services/subscriptionService';

const SubscriptionLimitModal = ({ 
  visible, 
  onClose, 
  onUpgrade, 
  remainingScans,
  userPlan = SUBSCRIPTION_PLANS.FREE
}) => {
  const handleUpgrade = (planType) => {
    onUpgrade(planType);
    onClose();
  };

  const PlanOption = ({ planType, isRecommended = false }) => {
    const plan = PLAN_DETAILS[planType];
    
    return (
      <TouchableOpacity
        style={[
          styles.planOption,
          isRecommended && styles.recommendedPlan
        ]}
        onPress={() => handleUpgrade(planType)}
      >
        {isRecommended && (
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedBadgeText}>RECOMMENDED</Text>
          </View>
        )}
        
        <View style={styles.planInfo}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planPrice}>{plan.price}/{plan.period}</Text>
        </View>
        
        <View style={styles.planFeatures}>
          <Text style={styles.planFeature}>✓ Unlimited scans</Text>
          <Text style={styles.planFeature}>✓ Photo viewing</Text>
          <Text style={styles.planFeature}>✓ Priority support</Text>
        </View>
        
        <View style={styles.upgradeButton}>
          <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="scan" size={48} color="#ef4444" />
            </View>
            <Text style={styles.title}>Daily Scan Limit Reached</Text>
            <Text style={styles.subtitle}>
              You've used all {2} of your daily scans. Upgrade to Pro for unlimited scanning!
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Scans Remaining</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>24h</Text>
              <Text style={styles.statLabel}>Until Reset</Text>
            </View>
          </View>

          <View style={styles.plansContainer}>
            <Text style={styles.plansTitle}>Choose Your Plan</Text>
            
            <PlanOption planType={SUBSCRIPTION_PLANS.YEARLY_PRO} isRecommended={true} />
            <PlanOption planType={SUBSCRIPTION_PLANS.MONTHLY_PRO} />
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.waitButton}
              onPress={onClose}
            >
              <Text style={styles.waitButtonText}>Wait for Reset</Text>
            </TouchableOpacity>
            
            <Text style={styles.footerNote}>
              Free plan resets every 24 hours
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 20,
  },
  plansContainer: {
    marginBottom: 24,
  },
  plansTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  planOption: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  recommendedPlan: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    left: 16,
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recommendedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  planInfo: {
    marginBottom: 12,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 16,
    color: '#6b7280',
  },
  planFeatures: {
    marginBottom: 16,
  },
  planFeature: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  upgradeButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  waitButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  waitButtonText: {
    fontSize: 16,
    color: '#6b7280',
    textDecorationLine: 'underline',
  },
  footerNote: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default SubscriptionLimitModal; 