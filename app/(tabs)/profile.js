import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Animated,
  Dimensions,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import SubscriptionService, { SUBSCRIPTION_PLANS } from '../services/subscriptionService';
import PayMongoService from '../services/paymongoService';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const [subscription, setSubscription] = useState(null);
  const [remainingScans, setRemainingScans] = useState(0);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Animation values
  const slideAnim = useRef(new Animated.Value(width)).current; // Start off-screen to the right
  const fadeAnim = useRef(new Animated.Value(0)).current; // Start invisible
  const scaleAnim = useRef(new Animated.Value(0.9)).current; // Start slightly smaller

  // Load subscription data and payment history
  useEffect(() => {
    if (user) {
      const loadData = async () => {
        try {
          // Load subscription data
          await SubscriptionService.initializeUserSubscription(user);
          const userSubscription = SubscriptionService.getUserSubscription(user);
          const { remainingScans: remaining } = await SubscriptionService.canPerformScan(user);
          setSubscription(userSubscription);
          setRemainingScans(remaining);

          // Load payment history
          setLoadingPayments(true);
          const paymentHistoryResult = await PayMongoService.getPaymentHistory(user.id);
          if (paymentHistoryResult.success) {
            setPaymentHistory(paymentHistoryResult.payments);
          } else {
            console.error('Failed to load payment history:', paymentHistoryResult.error);
          }
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setLoadingPayments(false);
        }
      };
      loadData();
    }
  }, [user]);

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGoBack = () => {
    // Exit animation before navigating
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.back();
    });
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          // Exit animation before signing out
          Animated.parallel([
            Animated.timing(slideAnim, {
              toValue: -width,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 0.8,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => {
            signOut();
          });
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              // Show loading state
              Alert.alert('Deleting Account', 'Please wait while we delete your account...');
              
              // Delete the user account from Clerk
              await user.delete();
              
              // The user will be automatically signed out after deletion
              // No need to manually call signOut() as Clerk handles this
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert(
                'Error',
                'Failed to delete account. Please try again or contact support.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const handleSubscriptionUpgrade = () => {
    router.push('/subscription-selection');
  };

  const handleHelpSupport = () => {
    const email = 'appedgescanner@gmail.com';
    const subject = 'Help & Support Request';
    const body = 'Hi, I need help with...';
    
    const emailUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.openURL(emailUrl).catch(() => {
      Alert.alert(
        'Email Not Available',
        `Please send an email to ${email} for support.`,
        [
          {
            text: 'Copy Email',
            onPress: () => {
              // Note: Clipboard requires @react-native-clipboard/clipboard package
              Alert.alert('Email Address', email);
            },
          },
          { text: 'OK' },
        ]
      );
    });
  };

  const getUserInitials = () => {
    const firstName = user?.firstName || '';
    const lastName = user?.lastName || '';
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}` || '👤';
  };

  const getSignUpMethod = () => {
    // Check external accounts for sign-up method
    const externalAccounts = user?.externalAccounts || [];
    if (externalAccounts.length > 0) {
      const providers = externalAccounts.map(account => {
        switch (account.provider) {
          case 'google':
            return 'Google';
          case 'apple':
            return 'Apple';
          case 'facebook':
            return 'Facebook';
          default:
            return account.provider;
        }
      });
      return providers.join(', ');
    }
    
    // If no external accounts, assume email sign-up
    return 'Email';
  };

  const getJoinedDate = () => {
    if (user?.createdAt) {
      return new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    return 'Unknown';
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [
            { translateX: slideAnim },
            { scale: scaleAnim }
          ],
          opacity: fadeAnim,
        }
      ]}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Profile</Text>
              <View style={styles.headerSpacer} />
            </View>
            <Text style={styles.subtitle}>Manage your account settings</Text>
          </View>

          {/* Profile Info */}
          <View style={styles.profileCard}>
            <View style={styles.profileCenter}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getUserInitials()}</Text>
              </View>
              <Text style={styles.userEmail}>
                {user?.primaryEmailAddress?.emailAddress || 'No email'}
              </Text>
              <Text style={styles.userId}>ID: {user?.id?.slice(0, 8)}...</Text>
            </View>
          </View>

          {/* Subscription Info */}
          {subscription && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Subscription</Text>
              
              <View style={styles.subscriptionCard}>
                <View style={styles.subscriptionHeader}>
                  <View style={styles.subscriptionPlan}>
                    <Text style={styles.planName}>
                      {SubscriptionService.getPlanDetails(subscription.plan).name}
                    </Text>
                    <Text style={styles.planPrice}>
                      {SubscriptionService.getPlanDetails(subscription.plan).price}
                      {subscription.plan !== SUBSCRIPTION_PLANS.FREE && (
                        <Text style={styles.planPeriod}>
                          /{SubscriptionService.getPlanDetails(subscription.plan).period.replace('per ', '')}
                        </Text>
                      )}
                    </Text>
                    {/* Show expiration status for paid plans */}
                    {subscription.plan !== SUBSCRIPTION_PLANS.FREE && (() => {
                      const expirationStatus = SubscriptionService.getSubscriptionExpirationStatus(user);
                      return (
                        <Text style={[
                          styles.expirationText,
                          expirationStatus.status === 'expired' && styles.expiredText,
                          expirationStatus.status === 'expiring_soon' && styles.expiringSoonText
                        ]}>
                          {expirationStatus.message}
                        </Text>
                      );
                    })()}
                  </View>
                  {(subscription.plan === SUBSCRIPTION_PLANS.FREE || 
                    SubscriptionService.getSubscriptionExpirationStatus(user).status === 'expired' ||
                    SubscriptionService.isSubscriptionExpiringSoon(user)) && (
                    <TouchableOpacity 
                      style={styles.upgradeButton}
                      onPress={handleSubscriptionUpgrade}
                    >
                      <Text style={styles.upgradeButtonText}>
                        {subscription.plan === SUBSCRIPTION_PLANS.FREE ? 'Upgrade' : 'Renew'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <View style={styles.subscriptionStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {remainingScans === -1 ? '∞' : remainingScans}
                    </Text>
                    <Text style={styles.statLabel}>Scans Remaining</Text>
                    {remainingScans === 0 && subscription.plan === SUBSCRIPTION_PLANS.FREE && (
                      <Text style={styles.resetLabel}>Scans reset tomorrow</Text>
                    )}
                  </View>
                  {subscription.plan === SUBSCRIPTION_PLANS.FREE && (
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>2</Text>
                      <Text style={styles.statLabel}>Daily Limit</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.subscriptionFeatures}>
                  {SubscriptionService.getPlanDetails(subscription.plan).features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Payment History */}
          <View style={styles.card}>
            <View style={styles.cardHeaderWithAction}>
              <Text style={styles.cardTitle}>Payment History</Text>
              {loadingPayments && (
                <ActivityIndicator size="small" color="#3B82F6" />
              )}
            </View>

            {paymentHistory.length > 0 ? (
              <ScrollView style={styles.paymentHistoryContainer} nestedScrollEnabled={true}>
                {paymentHistory.slice(0, 5).map((payment, index) => (
                  <View key={payment.id} style={styles.paymentItem}>
                    <View style={styles.paymentLeft}>
                      <View style={styles.paymentMethodIcon}>
                        {payment.payment_method === 'gcash' && (
                          <Text style={styles.paymentMethodText}>G</Text>
                        )}
                        {payment.payment_method === 'paymaya' && (
                          <Text style={styles.paymentMethodText}>M</Text>
                        )}
                        {(payment.payment_method === 'card' || !payment.payment_method || payment.payment_method === 'visa' || payment.payment_method === 'mastercard') && (
                          <Ionicons name="card" size={16} color="#3B82F6" />
                        )}
                      </View>
                      <View style={styles.paymentDetails}>
                        <Text style={styles.paymentDescription}>
                          {payment.description?.replace(` - User ID: ${user?.id}`, '') || 'Subscription Payment'}
                        </Text>
                        <Text style={styles.paymentDate}>
                          {(() => {
                            let date;
                            
                            // Handle different date formats from PayMongo
                            if (typeof payment.created_at === 'number') {
                              // Unix timestamp in seconds
                              date = new Date(payment.created_at * 1000);
                            } else if (typeof payment.created_at === 'string') {
                              // Check if it's a Unix timestamp as string
                              const timestamp = parseInt(payment.created_at);
                              if (!isNaN(timestamp) && timestamp > 1000000000 && timestamp < 10000000000) {
                                // Unix timestamp in seconds (10 digits)
                                date = new Date(timestamp * 1000);
                              } else if (!isNaN(timestamp) && timestamp > 1000000000000) {
                                // Unix timestamp in milliseconds (13 digits)
                                date = new Date(timestamp);
                              } else {
                                // ISO string or other date format
                                date = new Date(payment.created_at);
                              }
                            } else {
                              date = new Date(payment.created_at);
                            }
                            
                            if (isNaN(date.getTime())) {
                              return 'Invalid date';
                            }
                            
                            return date.toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            });
                          })()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.paymentRight}>
                      <Text style={styles.paymentAmount}>
                        ₱{payment.amount.toLocaleString()}
                      </Text>
                      <View style={[
                        styles.paymentStatus,
                        payment.status === 'succeeded' || payment.status === 'paid' 
                          ? styles.paymentStatusSuccess 
                          : payment.status === 'pending' 
                          ? styles.paymentStatusPending 
                          : styles.paymentStatusFailed
                      ]}>
                        <Text style={[
                          styles.paymentStatusText,
                          payment.status === 'succeeded' || payment.status === 'paid' 
                            ? styles.paymentStatusSuccessText 
                            : payment.status === 'pending' 
                            ? styles.paymentStatusPendingText 
                            : styles.paymentStatusFailedText
                        ]}>
                          {payment.status === 'succeeded' || payment.status === 'paid' ? 'Success' : 
                           payment.status === 'pending' ? 'Pending' : 
                           payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
                
                {paymentHistory.length > 5 && (
                  <TouchableOpacity style={styles.viewAllPayments}>
                    <Text style={styles.viewAllPaymentsText}>View All Payments</Text>
                    <Ionicons name="arrow-forward" size={16} color="#3B82F6" />
                  </TouchableOpacity>
                )}
              </ScrollView>
            ) : (
              <View style={styles.noPaymentHistory}>
                <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
                <Text style={styles.noPaymentHistoryTitle}>No Payment History</Text>
                <Text style={styles.noPaymentHistoryText}>
                  Your payment transactions will appear here once you make a purchase.
                </Text>
              </View>
            )}
          </View>

          {/* Account Details */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account Details</Text>

            <View style={styles.detailsList}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>First Name</Text>
                <Text style={styles.detailValue}>
                  {user?.firstName || 'Not provided'}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Last Name</Text>
                <Text style={styles.detailValue}>
                  {user?.lastName || 'Not provided'}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Email Address</Text>
                <Text style={styles.detailValue}>
                  {user?.primaryEmailAddress?.emailAddress || 'Not provided'}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Sign Up Method</Text>
                <Text style={styles.detailValue}>
                  {getSignUpMethod()}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Joined Since</Text>
                <Text style={styles.detailValue}>
                  {getJoinedDate()}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Last Sign In</Text>
                <Text style={styles.detailValue}>
                  {user?.lastSignInAt
                    ? new Date(user.lastSignInAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })
                    : 'Unknown'}
                </Text>
              </View>

              <View style={[styles.detailItem, styles.lastItem]}>
                <Text style={styles.detailLabel}>User ID</Text>
                <Text style={[styles.detailValue, styles.userIdText]}>
                  {user?.id}
                </Text>
              </View>
            </View>
          </View>

          {/* Settings */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Settings</Text>

            <View style={styles.settingsList}>
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Text style={styles.settingIcon}>🔒</Text>
                  <Text style={styles.settingLabel}>Privacy & Security</Text>
                </View>
                <Text style={styles.settingArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem} onPress={handleHelpSupport}>
                <View style={styles.settingLeft}>
                  <Text style={styles.settingIcon}>❓</Text>
                  <Text style={styles.settingLabel}>Help & Support</Text>
                </View>
                <Text style={styles.settingArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.settingItem, styles.dangerItem]} onPress={handleDeleteAccount}>
                <View style={styles.settingLeft}>
                  <Text style={styles.settingIcon}>🗑️</Text>
                  <Text style={[styles.settingLabel, styles.dangerText]}>Delete Account</Text>
                </View>
                <Text style={[styles.settingArrow, styles.dangerText]}>→</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Out */}
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 32,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // Compensate for back button width
  },
  headerSpacer: {
    width: 40, // Same width as back button for centering
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  profileCenter: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    backgroundColor: '#3B82F6',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  userId: {
    fontSize: 14,
    color: '#888',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  detailsList: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  userIdText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  settingsList: {
    gap: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  settingArrow: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  dangerItem: {
    backgroundColor: '#FFE5E5',
  },
  dangerText: {
    color: '#EF4444',
  },
  signOutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  subscriptionCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  subscriptionPlan: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  planPeriod: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#6b7280',
  },
  upgradeButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  subscriptionStats: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  resetLabel: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  subscriptionFeatures: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
  },
  expirationText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  expiredText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  expiringSoonText: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  // Payment History Styles
  cardHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentHistoryContainer: {
    maxHeight: 300,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  paymentDetails: {
    flex: 1,
  },
  paymentDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  paymentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paymentStatusSuccess: {
    backgroundColor: '#D1FAE5',
  },
  paymentStatusPending: {
    backgroundColor: '#FEF3C7',
  },
  paymentStatusFailed: {
    backgroundColor: '#FEE2E2',
  },
  paymentStatusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  paymentStatusSuccessText: {
    color: '#065F46',
  },
  paymentStatusPendingText: {
    color: '#92400E',
  },
  paymentStatusFailedText: {
    color: '#991B1B',
  },
  viewAllPayments: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  viewAllPaymentsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  noPaymentHistory: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  noPaymentHistoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 8,
  },
  noPaymentHistoryText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});
