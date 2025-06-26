import React, { useState, useCallback, useMemo } from 'react';
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
  ActivityIndicator,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import SubscriptionService from '../services/subscriptionService';
import PayMongoService from '../services/paymongoService';

const RETURN_URL = process.env.EXPO_PUBLIC_RETURN_URL;

const PaymentModal = ({ visible, onClose, selectedPlan, planDetails, onPaymentComplete }) => {
  const { user } = useUser();
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card', 'gcash', or 'maya'
  const [loading, setLoading] = useState(false);
  const [cardType, setCardType] = useState(null); // 'visa', 'mastercard', or null
  
  // Card form state
  const [cardForm, setCardForm] = useState({
    number: '',
    expMonth: '',
    expYear: '',
    cvc: '',
    name: '',
    email: user?.emailAddresses?.[0]?.emailAddress || ''
  });

  // Separate state for formatted display values
  const [displayValues, setDisplayValues] = useState({
    number: '',
  });

  const handleCardInputChange = useCallback((field, value) => {
    setCardForm(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const detectCardType = useCallback((cardNumber) => {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    
    if (cleanNumber.length >= 1) {
      // Visa cards start with 4
      if (cleanNumber[0] === '4') {
        return 'visa';
      }
      
      // Mastercard cards start with 5 or 2 (new range 2221-2720)
      if (cleanNumber[0] === '5') {
        return 'mastercard';
      }
      
      if (cleanNumber[0] === '2' && cleanNumber.length >= 4) {
        const firstFour = parseInt(cleanNumber.substring(0, 4));
        if (firstFour >= 2221 && firstFour <= 2720) {
          return 'mastercard';
        }
      }
    }
    
    return null;
  }, []);

  const handleCardNumberChange = useCallback((value) => {
    // Remove all non-digits and limit to 19 digits
    const cleanValue = value.replace(/\D/g, '').slice(0, 19);
    
    // Detect card type
    const detectedCardType = detectCardType(cleanValue);
    setCardType(detectedCardType);
    
    // Format for display (add spaces every 4 digits)
    const formattedValue = cleanValue.replace(/(.{4})/g, '$1 ').trim();
    
    // Update both states
    setDisplayValues(prev => ({ ...prev, number: formattedValue }));
    setCardForm(prev => ({
      ...prev,
      number: cleanValue
    }));
  }, [detectCardType]);

  const handleNameChange = useCallback((value) => {
    setCardForm(prev => ({
      ...prev,
      name: value
    }));
  }, []);

  const handleExpMonthChange = useCallback((value) => {
    const cleanValue = value.replace(/\D/g, '').slice(0, 2);
    
    // Validate month range (1-12)
    if (cleanValue.length === 2) {
      const monthNum = parseInt(cleanValue);
      if (monthNum < 1 || monthNum > 12) {
        return; // Don't update if invalid month
      }
    } else if (cleanValue.length === 1) {
      const monthNum = parseInt(cleanValue);
      if (monthNum > 1) {
        // If first digit is > 1, auto-pad with 0 (e.g., 2 becomes 02)
        const paddedValue = `0${cleanValue}`;
        setCardForm(prev => ({
          ...prev,
          expMonth: paddedValue
        }));
        return;
      }
    }
    
    setCardForm(prev => ({
      ...prev,
      expMonth: cleanValue
    }));
  }, []);

  const handleExpYearChange = useCallback((value) => {
    const cleanValue = value.replace(/\D/g, '').slice(0, 4);
    setCardForm(prev => ({
      ...prev,
      expYear: cleanValue
    }));
  }, []);

  const handleCvcChange = useCallback((value) => {
    const cleanValue = value.replace(/\D/g, '').slice(0, 4);
    setCardForm(prev => ({
      ...prev,
      cvc: cleanValue
    }));
  }, []);

  const handleEmailChange = useCallback((value) => {
    setCardForm(prev => ({
      ...prev,
      email: value
    }));
  }, []);

  const validateCardForm = () => {
    const validation = PayMongoService.validateCardDetails(cardForm);
    
    if (!validation.isValid) {
      Alert.alert('Invalid Card Information', validation.errors.join('\n'));
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
        // Validate card form first
        if (!validateCardForm()) {
          setLoading(false);
          return;
        }

        // Process card payment with PayMongo
        const planAmount = parseFloat(planDetails?.price.replace('₱', '').replace(',', ''));
        
        paymentResult = await PayMongoService.processCardPayment(
          planAmount,
          cardForm,
          `${planDetails?.name} Subscription`
        );
        
        if (!paymentResult || !paymentResult.success) {
          let errorMessage = 'Failed to process card payment';
          
          if (paymentResult && paymentResult.error) {
            errorMessage = paymentResult.error;
          } else if (!paymentResult) {
            errorMessage = 'Payment service returned no response. Please try again.';
          }
          
          // Check if it's a network/API key issue
          if (errorMessage.includes('Network request failed')) {
            errorMessage = 'PayMongo API connection failed. Please check your internet connection and API keys.';
          }
          
          console.error('Card payment error:', errorMessage);
          Alert.alert('Payment Error', errorMessage);
          setLoading(false);
          return;
        }
        
        if (paymentResult.requiresAction) {
          // Handle 3D Secure authentication
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
                      { paymentIntentId: paymentResult.paymentIntent.id },
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
        } else {
          // Direct success without 3D Secure
          const verificationResult = await SubscriptionService.verifyAndCompleteSubscription(
            user,
            { paymentIntentId: paymentResult.paymentIntent.id },
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
            success: `${RETURN_URL}/success`,
            failed: `${RETURN_URL}/failed`,
          };
        
        paymentResult = await SubscriptionService.processSubscriptionPayment(
          user,
          selectedPlan,
          'gcash',
          null,
          redirectUrls
        );
        
        if (paymentResult && paymentResult.success && paymentResult.requiresRedirect) {
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
                                `${planDetails?.name} Subscription`,
                                user.id
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
        } else {
          // Handle GCash payment failure
          const errorMessage = paymentResult?.error || 'GCash payment failed. Please try again.';
          console.error('GCash payment error:', errorMessage);
          Alert.alert('Payment Error', errorMessage);
        }
      } else if (paymentMethod === 'maya') {
        const redirectUrls = {
          success: `${RETURN_URL}/success`,
          failed: `${RETURN_URL}/failed`,
        };
      
        paymentResult = await SubscriptionService.processSubscriptionPayment(
          user,
          selectedPlan,
          'maya',
          null,
          redirectUrls
        );
        
        if (paymentResult && paymentResult.success && paymentResult.requiresAction) {
          // Maya uses Payment Intent workflow, handle differently than GCash
          Alert.alert(
            'Maya Payment',
            'Please complete the Maya payment authentication to proceed.',
            [
              {
                text: 'Complete',
                onPress: async () => {
                  try {
                    // Create Maya payment method and attach to payment intent
                    const returnUrl = `${RETURN_URL}/success`;
                    const paymentMethodResult = await PayMongoService.createMayaPaymentMethod(
                      paymentResult.paymentData.clientSecret,
                      returnUrl
                    );
                    
                    if (paymentMethodResult.success) {
                      const status = paymentMethodResult.status;
                      
                      if (status === 'awaiting_next_action') {
                        // Maya requires authentication, redirect user
                        const nextAction = paymentMethodResult.nextAction;
                        if (nextAction?.redirect?.url) {
                          await Linking.openURL(nextAction.redirect.url);
                          
                          // Show verification dialog after redirect
                          Alert.alert(
                            'Complete Payment',
                            'After completing payment in Maya, please return to the app to verify your subscription.',
                            [
                              {
                                text: 'Verify Payment',
                                onPress: async () => {
                                  try {
                                    // Verify payment intent status
                                    const verificationResult = await SubscriptionService.verifyAndCompleteSubscription(
                                      user,
                                      { paymentIntentId: paymentResult.paymentData.paymentIntentId },
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
                                    console.error('Maya verification error:', error);
                                    Alert.alert('Payment Error', 'Failed to verify Maya payment. Please contact support.');
                                  }
                                }
                              }
                            ]
                          );
                        }
                      } else if (status === 'succeeded') {
                        // Payment succeeded immediately
                        const verificationResult = await SubscriptionService.verifyAndCompleteSubscription(
                          user,
                          { paymentIntentId: paymentResult.paymentData.paymentIntentId },
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
                                             } else {
                         Alert.alert('Payment Error', `Maya payment failed with status: ${status}`);
                       }
                     } else {
                       Alert.alert('Payment Error', paymentMethodResult.error || 'Failed to create Maya payment method.');
                     }
                   } catch (error) {
                     console.error('Maya payment error:', error);
                     Alert.alert('Payment Error', 'Failed to process Maya payment. Please try again.');
                  }
                }
              },
              { text: 'Cancel' }
            ]
          );
        } else {
          // Handle Maya payment failure
          const errorMessage = paymentResult?.error || 'Maya payment failed. Please try again.';
          console.error('Maya payment error:', errorMessage);
          Alert.alert('Payment Error', errorMessage);
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
          <Image 
            source={require('../../assets/logo-gcash.png')} 
            style={styles.gcashLogo}
            resizeMode="contain"
          />
          <Text style={styles.paymentMethodText}>GCash</Text>
        </View>
        <View style={[
          styles.radioButton,
          paymentMethod === 'gcash' && styles.radioButtonSelected
        ]}>
          {paymentMethod === 'gcash' && <View style={styles.radioButtonInner} />}
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.paymentMethodOption,
          paymentMethod === 'maya' && styles.selectedPaymentMethod
        ]}
        onPress={() => setPaymentMethod('maya')}
      >
        <View style={styles.paymentMethodInfo}>
          <Image 
            source={require('../../assets/maya-logo.png')} 
            style={styles.mayaLogo}
            resizeMode="contain"
          />
          <Text style={styles.paymentMethodText}>Maya</Text>
        </View>
        <View style={[
          styles.radioButton,
          paymentMethod === 'maya' && styles.radioButtonSelected
        ]}>
          {paymentMethod === 'maya' && <View style={styles.radioButtonInner} />}
        </View>
      </TouchableOpacity>
    </View>
  );

  const CardForm = useMemo(() => (
    <View style={styles.cardFormContainer}>
      <Text style={styles.sectionTitle}>Card Information</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Cardholder Name</Text>
        <TextInput
          key="cardholder-name"
          style={styles.textInput}
          value={cardForm.name}
          onChangeText={handleNameChange}
          placeholder="Enter cardholder name"
          autoCapitalize="words"
          autoCorrect={false}
          blurOnSubmit={false}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email Address</Text>
        <TextInput
          key="email"
          style={styles.textInput}
          value={cardForm.email}
          onChangeText={handleEmailChange}
          placeholder="Enter email address"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          blurOnSubmit={false}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Card Number</Text>
        <View style={styles.cardNumberContainer}>
          <TextInput
            key="card-number"
            style={[styles.textInput, styles.cardNumberInput]}
            value={displayValues.number}
            onChangeText={handleCardNumberChange}
            placeholder="1234 5678 9012 3456"
            keyboardType="numeric"
            maxLength={23} // 19 digits + 4 spaces
            autoCorrect={false}
            blurOnSubmit={false}
          />
          {cardType && (
            <View style={styles.cardTypeContainer}>
              <Image 
                source={cardType === 'visa' 
                  ? require('../../assets/visa-logo.png') 
                  : require('../../assets/mastercard-logo.png')
                } 
                style={styles.cardTypeLogo}
                resizeMode="contain"
              />
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.halfInput]}>
          <Text style={styles.inputLabel}>Expiry Month</Text>
          <TextInput
            key="exp-month"
            style={styles.textInput}
            value={cardForm.expMonth}
            onChangeText={handleExpMonthChange}
            placeholder="MM"
            keyboardType="numeric"
            maxLength={2}
            autoCorrect={false}
            blurOnSubmit={false}
          />
        </View>
        
        <View style={[styles.inputContainer, styles.halfInput]}>
          <Text style={styles.inputLabel}>Expiry Year</Text>
          <TextInput
            key="exp-year"
            style={styles.textInput}
            value={cardForm.expYear}
            onChangeText={handleExpYearChange}
            placeholder="YYYY"
            keyboardType="numeric"
            maxLength={4}
            autoCorrect={false}
            blurOnSubmit={false}
          />
        </View>
        
        <View style={[styles.inputContainer, styles.halfInput]}>
          <Text style={styles.inputLabel}>CVC</Text>
          <TextInput
            key="cvc"
            style={styles.textInput}
            value={cardForm.cvc}
            onChangeText={handleCvcChange}
            placeholder="123"
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry={true}
            autoCorrect={false}
            blurOnSubmit={false}
          />
        </View>
      </View>
      
      <Text style={styles.cardInfoText}>
        Your card information is encrypted and secure via PayMongo.
      </Text>
    </View>
  ), [cardForm.name, cardForm.email, displayValues.number, cardForm.expMonth, cardForm.expYear, cardForm.cvc, handleNameChange, handleEmailChange, handleCardNumberChange, handleExpMonthChange, handleExpYearChange, handleCvcChange]);

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

  const MayaInfo = () => (
    <View style={styles.mayaInfoContainer}>
      <View style={styles.mayaInfoBox}>
        <Ionicons name="information-circle" size={24} color="#00AADF" />
        <Text style={styles.mayaInfoText}>
          You will be redirected to Maya to complete your payment securely.
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
          
          {paymentMethod === 'card' ? CardForm : paymentMethod === 'gcash' ? <GCashInfo /> : <MayaInfo />}
          
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
  gcashLogo: {
    width: 24,
    height: 24,
  },
  cardNumberContainer: {
    position: 'relative',
  },
  cardNumberInput: {
    paddingRight: 50, // Make space for the card type logo
  },
  cardTypeContainer: {
    position: 'absolute',
    right: 12,
    top: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTypeLogo: {
    width: 32,
    height: 20,
  },
  mayaLogo: {
    width: 24,
    height: 24,
  },
  mayaInfoContainer: {
    marginBottom: 24,
  },
  mayaInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f7ff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00AADF',
  },
  mayaInfoText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});

export default PaymentModal; 