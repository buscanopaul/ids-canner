import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import SubscriptionService from '../services/subscriptionService';
import PayMongoService from '../services/paymongoService';

const PaymentModal = ({ visible, onClose, selectedPlan, planDetails, onPaymentComplete }) => {
  const { user } = useUser();
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' or 'gcash'
  const [loading, setLoading] = useState(false);
  
  // Card form state
  const [cardForm, setCardForm] = useState({
    number: '',
    expMonth: '',
    expYear: '',
    cvc: '',
    name: ''
  });

  const handleCardInputChange = (field, value) => {
    setCardForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateCardForm = () => {
    const { number, expMonth, expYear, cvc, name } = cardForm;
    
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter cardholder name');
      return false;
    }
    
    if (!number || number.length < 13) {
      Alert.alert('Error', 'Please enter a valid card number');
      return false;
    }
    
    if (!expMonth || expMonth.length < 1 || parseInt(expMonth) < 1 || parseInt(expMonth) > 12) {
      Alert.alert('Error', 'Please enter a valid expiry month (01-12)');
      return false;
    }
    
    const currentYear = new Date().getFullYear();
    if (!expYear || parseInt(expYear) < currentYear || parseInt(expYear) > currentYear + 20) {
      Alert.alert('Error', 'Please enter a valid expiry year');
      return false;
    }
    
    if (!cvc || cvc.length < 3) {
      Alert.alert('Error', 'Please enter a valid CVC');
      return false;
    }
    
    return true;
  };

  const handlePayment = async () => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      let paymentResult;
      
      if (paymentMethod === 'card') {
        // Card payment will be handled by PayMongo's hosted payment page
        Alert.alert(
          'Card Payment',
          'Card payments will be processed through PayMongo\'s secure payment system.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
        
                 if (paymentResult.success && paymentResult.requiresAction) {
           // Process the actual PayMongo payment
           Alert.alert(
             'Complete Payment',
             'Please complete the payment authentication to proceed.',
             [
               {
                 text: 'Complete',
                 onPress: async () => {
                   try {
                     // In a real implementation, you'd handle 3D Secure here
                     // For now, we'll proceed to verify the payment with PayMongo
                     const verificationResult = await SubscriptionService.verifyAndCompleteSubscription(
                       user,
                       paymentResult.paymentData,
                       selectedPlan
                     );
                     
                     if (verificationResult.success) {
                       Alert.alert(
                         'Payment Successful!',
                         'Your subscription has been activated.',
                         [{ 
                           text: 'OK', 
                           onPress: () => {
                             onClose();
                             onPaymentComplete?.();
                           }
                         }]
                       );
                     } else {
                       Alert.alert('Payment Failed', verificationResult.message || 'Please try again.');
                     }
                   } catch (error) {
                     Alert.alert('Payment Error', 'Failed to process payment. Please try again.');
                   }
                 }
               },
               { text: 'Cancel' }
             ]
           );
         } else if (paymentResult.success) {
           // Direct success without 3D Secure
           const verificationResult = await SubscriptionService.verifyAndCompleteSubscription(
             user,
             paymentResult.paymentData,
             selectedPlan
           );
           
           if (verificationResult.success) {
             Alert.alert(
               'Payment Successful!',
               'Your subscription has been activated.',
               [{ 
                 text: 'OK', 
                 onPress: () => {
                   onClose();
                   onPaymentComplete?.();
                 }
               }]
             );
           } else {
             Alert.alert('Payment Failed', verificationResult.message || 'Please try again.');
           }
         }
              } else if (paymentMethod === 'gcash') {
          const redirectUrls = {
            success: 'https://payment-redirects-edge-scanner.vercel.app/success',
            failed: 'https://payment-redirects-edge-scanner.vercel.app/failed',
          };
        
        paymentResult = await SubscriptionService.processSubscriptionPayment(
          user,
          selectedPlan,
          'gcash',
          null,
          redirectUrls
        );
        
        if (paymentResult.success && paymentResult.requiresRedirect) {
          Alert.alert(
            'GCash Payment',
            'You will be redirected to GCash to complete your payment.',
            [
              {
                text: 'Continue',
                onPress: async () => {
                  try {
                    await Linking.openURL(paymentResult.paymentData.checkoutUrl);
                    
                    // Show a modal or instruction to user about coming back to verify payment
                    Alert.alert(
                      'Complete Payment',
                      'After completing payment in GCash, please return to the app to verify your subscription.',
                      [
                        {
                          text: 'Verify Payment',
                          onPress: async () => {
                            try {
                              // For GCash, we need to create the payment after user authorization
                              const payment = await PayMongoService.completeGCashPayment(
                                paymentResult.paymentData.source,
                                `${planDetails?.name} Subscription`
                              );
                              
                              // Now verify with the actual payment
                              const verificationResult = await SubscriptionService.verifyAndCompleteSubscription(
                                user,
                                { paymentId: payment.id, amount: paymentResult.paymentData.amount },
                                selectedPlan
                              );
                              
                              if (verificationResult.success) {
                                Alert.alert(
                                  'Payment Successful!',
                                  'Your subscription has been activated.',
                                  [{ 
                                    text: 'OK', 
                                    onPress: () => {
                                      onClose();
                                      onPaymentComplete?.();
                                    }
                                  }]
                                );
                              } else {
                                Alert.alert('Payment Verification', verificationResult.message || 'Please try again or contact support.');
                              }
                            } catch (error) {
                              console.error('GCash verification error:', error);
                              Alert.alert('Payment Error', 'Failed to verify GCash payment. Please contact support.');
                            }
                          }
                        }
                      ]
                    );
                  } catch (error) {
                    Alert.alert('Error', 'Unable to open GCash. Please try again.');
                  }
                }
              },
              { text: 'Cancel' }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Payment Error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const PaymentMethodSelector = () => (
    <View style={styles.paymentMethodContainer}>
      <Text style={styles.sectionTitle}>Payment Method</Text>
      
      <TouchableOpacity
        style={[
          styles.paymentMethodOption,
          paymentMethod === 'card' && styles.selectedPaymentMethod
        ]}
        onPress={() => setPaymentMethod('card')}
      >
        <View style={styles.paymentMethodInfo}>
          <Ionicons name="card" size={24} color="#3b82f6" />
          <Text style={styles.paymentMethodText}>Credit/Debit Card</Text>
        </View>
        <View style={[
          styles.radioButton,
          paymentMethod === 'card' && styles.radioButtonSelected
        ]}>
          {paymentMethod === 'card' && <View style={styles.radioButtonInner} />}
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.paymentMethodOption,
          paymentMethod === 'gcash' && styles.selectedPaymentMethod
        ]}
        onPress={() => setPaymentMethod('gcash')}
      >
        <View style={styles.paymentMethodInfo}>
          <Ionicons name="phone-portrait" size={24} color="#00D4FF" />
          <Text style={styles.paymentMethodText}>GCash</Text>
        </View>
        <View style={[
          styles.radioButton,
          paymentMethod === 'gcash' && styles.radioButtonSelected
        ]}>
          {paymentMethod === 'gcash' && <View style={styles.radioButtonInner} />}
        </View>
      </TouchableOpacity>
    </View>
  );

  const CardForm = () => (
    <View style={styles.cardFormContainer}>
      <Text style={styles.sectionTitle}>Card Information</Text>
      <Text style={styles.cardInfoText}>
        Card payment processing will be handled by PayMongo's secure payment system.
      </Text>
    </View>
  );

  const GCashInfo = () => (
    <View style={styles.gcashInfoContainer}>
      <View style={styles.gcashInfoBox}>
        <Ionicons name="information-circle" size={24} color="#00D4FF" />
        <Text style={styles.gcashInfoText}>
          You will be redirected to GCash to complete your payment securely.
        </Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Complete Payment</Text>
          <View style={styles.placeholder} />
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.planSummary}>
            <Text style={styles.planName}>{planDetails?.name}</Text>
            <Text style={styles.planPrice}>{planDetails?.price} {planDetails?.period}</Text>
          </View>
          
          <PaymentMethodSelector />
          
          {paymentMethod === 'card' ? <CardForm /> : <GCashInfo />}
          
          <View style={styles.securityInfo}>
            <Ionicons name="shield-checkmark" size={20} color="#10b981" />
            <Text style={styles.securityText}>
              Secured by PayMongo. Your payment information is encrypted and secure.
            </Text>
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.payButton, loading && styles.payButtonDisabled]}
            onPress={handlePayment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.payButtonText}>
                  Pay {planDetails?.price}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  planSummary: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginVertical: 20,
    alignItems: 'center',
  },
  planName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  paymentMethodContainer: {
    marginBottom: 24,
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  selectedPaymentMethod: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginLeft: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#3b82f6',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  cardFormContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  cardInfoText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  gcashInfoContainer: {
    marginBottom: 24,
  },
  gcashInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f7fa',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00D4FF',
  },
  gcashInfoText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  securityText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  payButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  payButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PaymentModal; 