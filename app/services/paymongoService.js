import { encode } from 'base-64';

// PayMongo API configuration
const PAYMONGO_BASE_URL = 'https://api.paymongo.com/v1';
const PAYMONGO_SECRET_KEY = process.env.EXPO_PUBLIC_PAYMONGO_SECRET_KEY;
const PAYMONGO_PUBLIC_KEY = process.env.EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY;

class PayMongoService {
  // Helper method to create authorization header with secret key
  static getAuthHeader() {
    if (!PAYMONGO_SECRET_KEY) {
      throw new Error('PayMongo secret key not found. Please check your environment variables.');
    }
    const encoded = encode(`${PAYMONGO_SECRET_KEY}:`);
    return `Basic ${encoded}`;
  }

  // Helper method to create authorization header with public key
  static getPublicAuthHeader() {
    if (!PAYMONGO_PUBLIC_KEY) {
      throw new Error('PayMongo public key not found. Please check your environment variables.');
    }
    const encoded = encode(`${PAYMONGO_PUBLIC_KEY}:`);
    return `Basic ${encoded}`;
  }

  // Create payment method with card details
  static async createPaymentMethod(cardDetails) {
    try {
      const { number, expMonth, expYear, cvc, name, email } = cardDetails;
      
      console.log('Creating payment method with PayMongo...');
      console.log('API Keys present:', {
        secretKey: !!PAYMONGO_SECRET_KEY,
        publicKey: !!PAYMONGO_PUBLIC_KEY
      });
      
      const response = await fetch(`${PAYMONGO_BASE_URL}/payment_methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
        body: JSON.stringify({
          data: {
            type: 'payment_method',
            attributes: {
              type: 'card',
              details: {
                card_number: number.replace(/\s/g, ''),
                exp_month: parseInt(expMonth),
                exp_year: parseInt(expYear),
                cvc: cvc,
              },
              billing: {
                name: name,
                email: email,
              },
            },
          },
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.errors?.[0]?.detail || 'Failed to create payment method');
      }

      return {
        success: true,
        paymentMethod: data.data,
      };
    } catch (error) {
      console.error('PayMongo createPaymentMethod error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Create payment intent for card payment
  static async createPaymentIntent(amount, currency = 'PHP', description = 'Payment') {
    try {
      const response = await fetch(`${PAYMONGO_BASE_URL}/payment_intents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
        body: JSON.stringify({
          data: {
            type: 'payment_intent',
            attributes: {
              amount: Math.round(amount * 100), // Convert to centavos
              payment_method_allowed: ['card'],
              payment_method_options: {
                card: {
                  request_three_d_secure: 'automatic',
                },
              },
              currency: currency,
              description: description,
              capture_type: 'automatic',
            },
          },
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.errors?.[0]?.detail || 'Failed to create payment intent');
      }

      return {
        success: true,
        paymentIntent: data.data,
        clientSecret: data.data.attributes.client_key,
      };
    } catch (error) {
      console.error('PayMongo createPaymentIntent error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Attach payment method to payment intent
  static async attachPaymentMethod(paymentIntentId, paymentMethodId) {
    try {
      const response = await fetch(`${PAYMONGO_BASE_URL}/payment_intents/${paymentIntentId}/attach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
        body: JSON.stringify({
          data: {
            type: 'payment_intent',
            attributes: {
              payment_method: paymentMethodId,
              client_key: PAYMONGO_PUBLIC_KEY,
            },
          },
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.errors?.[0]?.detail || 'Failed to attach payment method');
      }

      return {
        success: true,
        paymentIntent: data.data,
      };
    } catch (error) {
      console.error('PayMongo attachPaymentMethod error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Process card payment with 3D Secure support
  static async processCardPayment(amount, cardDetails, description) {
    try {
      // Step 1: Create payment method
      const paymentMethodResult = await this.createPaymentMethod(cardDetails);
      if (!paymentMethodResult.success) {
        throw new Error(paymentMethodResult.error);
      }

      // Step 2: Create payment intent
      const paymentIntentResult = await this.createPaymentIntent(amount, 'PHP', description);
      if (!paymentIntentResult.success) {
        throw new Error(paymentIntentResult.error);
      }

      // Step 3: Attach payment method to intent
      const attachResult = await this.attachPaymentMethod(
        paymentIntentResult.paymentIntent.id,
        paymentMethodResult.paymentMethod.id
      );
      
      if (!attachResult.success) {
        throw new Error(attachResult.error);
      }

      const paymentIntent = attachResult.paymentIntent;
      const status = paymentIntent.attributes.status;

      if (status === 'succeeded') {
        return {
          success: true,
          paymentIntent: paymentIntent,
          requiresAction: false,
        };
      } else if (status === 'requires_action') {
        return {
          success: true,
          paymentIntent: paymentIntent,
          requiresAction: true,
          nextAction: paymentIntent.attributes.next_action,
        };
      } else {
        throw new Error(`Payment failed with status: ${status}`);
      }
    } catch (error) {
      console.error('PayMongo processCardPayment error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Create GCash source for payment
  static async processGCashPayment(amount, redirectUrls, description) {
    try {
      const response = await fetch(`${PAYMONGO_BASE_URL}/sources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
        body: JSON.stringify({
          data: {
            type: 'source',
            attributes: {
              type: 'gcash',
              amount: Math.round(amount * 100), // Convert to centavos
              currency: 'PHP',
              description: description,
              redirect: {
                success: redirectUrls.success,
                failed: redirectUrls.failed,
              },
            },
          },
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.errors?.[0]?.detail || 'Failed to create GCash source');
      }

      return {
        success: true,
        source: data.data,
        checkoutUrl: data.data.attributes.redirect.checkout_url,
      };
    } catch (error) {
      console.error('PayMongo processGCashPayment error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Complete GCash payment after user authorization
  static async completeGCashPayment(source, description) {
    try {
      const response = await fetch(`${PAYMONGO_BASE_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
        body: JSON.stringify({
          data: {
            type: 'payment',
            attributes: {
              amount: source.attributes.amount,
              currency: 'PHP',
              description: description,
              source: {
                id: source.id,
                type: 'source',
              },
            },
          },
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.errors?.[0]?.detail || 'Failed to complete GCash payment');
      }

      return data.data;
    } catch (error) {
      console.error('PayMongo completeGCashPayment error:', error);
      throw error;
    }
  }

  // Create Maya Payment Intent - Maya uses Payment Intent workflow
  static async processMayaPayment(amount, description) {
    console.log('processMayaPayment called with:', { amount, description });
    try {
      const response = await fetch(`${PAYMONGO_BASE_URL}/payment_intents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
        body: JSON.stringify({
          data: {
            type: 'payment_intent',
            attributes: {
              amount: Math.round(amount * 100), // Convert to centavos
              payment_method_allowed: ['paymaya'], // Maya payment method (API still uses 'paymaya')
              currency: 'PHP',
              description: description,
              capture_type: 'automatic',
            },
          },
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.errors?.[0]?.detail || 'Failed to create Maya Payment Intent');
      }

      return {
        success: true,
        paymentIntent: data.data,
        clientSecret: data.data.attributes.client_key,
      };
    } catch (error) {
      console.error('PayMongo processMayaPayment error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Create Maya Payment Method and attach to Payment Intent
  static async createMayaPaymentMethod(clientKey, returnUrl) {
    try {
      // Step 1: Create Maya payment method
      const paymentMethodResponse = await fetch(`${PAYMONGO_BASE_URL}/payment_methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getPublicAuthHeader(), // Use public key for payment methods
        },
        body: JSON.stringify({
          data: {
            type: 'payment_method',
            attributes: {
              type: 'paymaya', // API still uses 'paymaya' for Maya
            },
          },
        }),
      });

      const paymentMethodData = await paymentMethodResponse.json();
      
      if (!paymentMethodResponse.ok) {
        throw new Error(paymentMethodData.errors?.[0]?.detail || 'Failed to create Maya payment method');
      }

      // Step 2: Attach payment method to payment intent
      const paymentIntentId = clientKey.split('_client')[0];
      
      const attachResponse = await fetch(`${PAYMONGO_BASE_URL}/payment_intents/${paymentIntentId}/attach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getPublicAuthHeader(), // Use public key for attach
        },
        body: JSON.stringify({
          data: {
            attributes: {
              client_key: clientKey,
              payment_method: paymentMethodData.data.id,
              return_url: returnUrl,
            },
          },
        }),
      });

      const attachData = await attachResponse.json();
      
      if (!attachResponse.ok) {
        throw new Error(attachData.errors?.[0]?.detail || 'Failed to attach Maya payment method');
      }

      return {
        success: true,
        paymentIntent: attachData.data,
        status: attachData.data.attributes.status,
        nextAction: attachData.data.attributes.next_action,
      };
    } catch (error) {
      console.error('PayMongo createMayaPaymentMethod error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Retrieve payment status
  static async getPaymentStatus(paymentId) {
    try {
      const response = await fetch(`${PAYMONGO_BASE_URL}/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(),
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.errors?.[0]?.detail || 'Failed to get payment status');
      }

      return {
        success: true,
        payment: data.data,
        status: data.data.attributes.status,
      };
    } catch (error) {
      console.error('PayMongo getPaymentStatus error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Verify payment and update subscription
  static async verifyPaymentAndUpdateSubscription(user, paymentData, subscriptionPlan) {
    try {
      let paymentStatus;
      
      if (paymentData.paymentIntentId) {
        // For card payments, check payment intent status
        const response = await fetch(`${PAYMONGO_BASE_URL}/payment_intents/${paymentData.paymentIntentId}`, {
          method: 'GET',
          headers: {
            'Authorization': this.getAuthHeader(),
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.errors?.[0]?.detail || 'Failed to verify payment');
        }

        paymentStatus = data.data.attributes.status;
      } else if (paymentData.paymentId) {
        // For GCash payments, check payment status
        const statusResult = await this.getPaymentStatus(paymentData.paymentId);
        if (!statusResult.success) {
          throw new Error(statusResult.error);
        }
        paymentStatus = statusResult.status;
      } else {
        throw new Error('Invalid payment data provided');
      }

      if (paymentStatus === 'succeeded' || paymentStatus === 'paid') {
        // Payment successful, update subscription
        console.log('Payment verified successfully, updating subscription plan to:', subscriptionPlan);
        const SubscriptionService = require('./subscriptionService').default;
        const updateResult = await SubscriptionService.updateSubscriptionPlan(user, subscriptionPlan);
        
        console.log('Subscription update result:', updateResult);
        
        // updateSubscriptionPlan returns a boolean, not an object
        if (updateResult) {
          console.log('Subscription updated successfully!');
          return {
            success: true,
            message: 'Payment verified and subscription updated successfully',
          };
        } else {
          console.error('Failed to update subscription despite successful payment');
          return {
            success: false,
            message: 'Payment verified but failed to update subscription',
          };
        }
      } else {
        console.log('Payment verification failed, status:', paymentStatus);
        return {
          success: false,
          message: `Payment verification failed. Status: ${paymentStatus}`,
        };
      }
    } catch (error) {
      console.error('PayMongo verifyPaymentAndUpdateSubscription error:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Check if user has active subscription
  static isSubscriptionActive(user) {
    // This should integrate with your subscription storage system
    // For now, return false as placeholder
    return false;
  }

  // Validate card details
  static validateCardDetails(cardDetails) {
    const { number, expMonth, expYear, cvc, name, email } = cardDetails;
    const errors = [];

    if (!name || name.trim().length < 2) {
      errors.push('Cardholder name is required');
    }

    if (!email || !this.isValidEmail(email)) {
      errors.push('Valid email address is required');
    }

    // Basic card number validation (remove spaces and check length)
    const cleanNumber = number.replace(/\s/g, '');
    if (!cleanNumber || cleanNumber.length < 13 || cleanNumber.length > 19) {
      errors.push('Invalid card number');
    }

    // Check if it's a valid number (basic Luhn algorithm)
    if (cleanNumber && !this.isValidCardNumber(cleanNumber)) {
      errors.push('Invalid card number');
    }

    // Expiry month validation
    const month = parseInt(expMonth);
    if (!expMonth || expMonth.length === 0) {
      errors.push('Expiry month is required');
    } else if (!month || month < 1 || month > 12) {
      errors.push('Expiry month must be between 01 and 12');
    }

    // Expiry year validation
    const year = parseInt(expYear);
    const currentYear = new Date().getFullYear();
    if (!year || year < currentYear || year > currentYear + 20) {
      errors.push('Invalid expiry year');
    }

    // Check if card is not expired
    if (year === currentYear && month < new Date().getMonth() + 1) {
      errors.push('Card has expired');
    }

    // CVC validation
    if (!cvc || cvc.length < 3 || cvc.length > 4) {
      errors.push('Invalid CVC');
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  // Luhn algorithm for card number validation
  static isValidCardNumber(cardNumber) {
    let sum = 0;
    let isEven = false;
    
    // Loop through values starting from the rightmost side
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  // Format card number with spaces
  static formatCardNumber(cardNumber) {
    return cardNumber.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  }

  // Get card type from number
  static getCardType(cardNumber) {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(cleanNumber)) return 'visa';
    if (/^5[1-5]/.test(cleanNumber)) return 'mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'amex';
    if (/^6/.test(cleanNumber)) return 'discover';
    
    return 'unknown';
  }

  // Validate email address
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Test API connection
  static async testConnection() {
    try {
      console.log('Testing PayMongo API connection...');
      console.log('Secret Key:', PAYMONGO_SECRET_KEY ? 'Present' : 'Missing');
      console.log('Public Key:', PAYMONGO_PUBLIC_KEY ? 'Present' : 'Missing');
      
      if (!PAYMONGO_SECRET_KEY) {
        throw new Error('EXPO_PUBLIC_PAYMONGO_SECRET_KEY environment variable is not set');
      }
      
      // Simple API test
      const response = await fetch(`${PAYMONGO_BASE_URL}/payment_methods`, {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(),
        },
      });
      
      console.log('API Response Status:', response.status);
      
      if (response.status === 401) {
        throw new Error('Invalid PayMongo API keys. Please check your credentials.');
      }
      
      return { success: true, status: response.status };
    } catch (error) {
      console.error('PayMongo connection test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export default PayMongoService; 