import { useUser } from '@clerk/clerk-expo';
import PayMongoService from './paymongoService';

export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  MONTHLY_PRO: 'monthly_pro',
  YEARLY_PRO: 'yearly_pro'
};

export const PLAN_LIMITS = {
  [SUBSCRIPTION_PLANS.FREE]: {
    dailyScans: 2,
    showPhoto: false,
    unlimited: false
  },
  [SUBSCRIPTION_PLANS.MONTHLY_PRO]: {
    dailyScans: -1, // unlimited
    showPhoto: true,
    unlimited: true
  },
  [SUBSCRIPTION_PLANS.YEARLY_PRO]: {
    dailyScans: -1, // unlimited
    showPhoto: true,
    unlimited: true
  }
};

export const PLAN_DETAILS = {
  [SUBSCRIPTION_PLANS.FREE]: {
    name: 'Free',
    price: '₱0',
    period: 'forever',
    features: ['2 daily scans', 'QR code scanning', 'Manual ID lookup']
  },
  [SUBSCRIPTION_PLANS.MONTHLY_PRO]: {
    name: 'Monthly Pro',
    price: '₱199',
    period: 'per month',
    features: ['Unlimited scans', 'Photo viewing', 'QR code scanning', 'Manual ID lookup', 'Priority support']
  },
  [SUBSCRIPTION_PLANS.YEARLY_PRO]: {
    name: 'Yearly Pro',
    price: '₱1,999',
    period: 'per year',
    features: ['Unlimited scans', 'Photo viewing', 'QR code scanning', 'Manual ID lookup', 'Priority support', '2 months free!']
  }
};

class SubscriptionService {
  // Initialize user subscription metadata
  static async initializeUserSubscription(user) {
    if (!user) return null;

    try {
      const currentMetadata = user.unsafeMetadata || {};
      
      // If user doesn't have subscription data, initialize with free plan
      if (!currentMetadata.subscription) {
        await user.update({
          unsafeMetadata: {
            ...currentMetadata,
            subscription: {
              plan: SUBSCRIPTION_PLANS.FREE,
              createdAt: new Date().toISOString(),
              dailyScans: {
                count: 0,
                lastResetDate: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
              }
            }
          }
        });
      }
      
      return user.unsafeMetadata.subscription;
    } catch (error) {
      console.error('Error initializing user subscription:', error);
      return null;
    }
  }

  // Get user's current subscription
  static getUserSubscription(user) {
    if (!user?.unsafeMetadata?.subscription) {
      return {
        plan: SUBSCRIPTION_PLANS.FREE,
        dailyScans: { count: 0, lastResetDate: new Date().toISOString().split('T')[0] }
      };
    }
    return user.unsafeMetadata.subscription;
  }

  // Update user's subscription plan
  static async updateSubscriptionPlan(user, newPlan) {
    if (!user) {
      console.error('updateSubscriptionPlan: No user provided');
      return false;
    }

    try {
      console.log('Updating subscription plan to:', newPlan);
      const currentMetadata = user.unsafeMetadata || {};
      const currentSubscription = currentMetadata.subscription || {};

      await user.update({
        unsafeMetadata: {
          ...currentMetadata,
          subscription: {
            ...currentSubscription,
            plan: newPlan,
            updatedAt: new Date().toISOString(),
            dailyScans: {
              count: 0,
              lastResetDate: new Date().toISOString().split('T')[0]
            }
          }
        }
      });
      
      console.log('Subscription plan updated successfully to:', newPlan);
      return true;
    } catch (error) {
      console.error('Error updating subscription plan:', error);
      return false;
    }
  }

  // Check if user can perform a scan
  static canPerformScan(user) {
    const subscription = this.getUserSubscription(user);
    const planLimits = PLAN_LIMITS[subscription.plan];
    
    // Pro plans have unlimited scans
    if (planLimits.unlimited) {
      return { canScan: true, remainingScans: -1 };
    }
    
    // Check daily limit for free plan
    const today = new Date().toISOString().split('T')[0];
    const dailyScans = subscription.dailyScans || { count: 0, lastResetDate: today };
    
    // Reset daily count if it's a new day
    if (dailyScans.lastResetDate !== today) {
      return { canScan: true, remainingScans: planLimits.dailyScans - 1 };
    }
    
    const remainingScans = planLimits.dailyScans - dailyScans.count;
    return { 
      canScan: remainingScans > 0, 
      remainingScans: Math.max(0, remainingScans)
    };
  }

  // Increment scan count
  static async incrementScanCount(user) {
    if (!user) return false;

    try {
      const currentMetadata = user.unsafeMetadata || {};
      const subscription = currentMetadata.subscription || {};
      const today = new Date().toISOString().split('T')[0];
      
      let dailyScans = subscription.dailyScans || { count: 0, lastResetDate: today };
      
      // Reset count if it's a new day
      if (dailyScans.lastResetDate !== today) {
        dailyScans = { count: 0, lastResetDate: today };
      }
      
      // Increment count
      dailyScans.count += 1;
      
      await user.update({
        unsafeMetadata: {
          ...currentMetadata,
          subscription: {
            ...subscription,
            dailyScans
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error incrementing scan count:', error);
      return false;
    }
  }

  // Check if user can view photos
  static canViewPhotos(user) {
    const subscription = this.getUserSubscription(user);
    const planLimits = PLAN_LIMITS[subscription.plan];
    return planLimits.showPhoto;
  }

  // Get plan details
  static getPlanDetails(planType) {
    return PLAN_DETAILS[planType] || PLAN_DETAILS[SUBSCRIPTION_PLANS.FREE];
  }

  // Get plan limits
  static getPlanLimits(planType) {
    return PLAN_LIMITS[planType] || PLAN_LIMITS[SUBSCRIPTION_PLANS.FREE];
  }

  // Check subscription status with PayMongo integration
  static isSubscriptionActive(user) {
    return PayMongoService.isSubscriptionActive(user);
  }

  // Process subscription payment
  static async processSubscriptionPayment(user, planType, paymentMethod, paymentDetails, redirectUrls = null) {
    const planDetails = this.getPlanDetails(planType);
    const amount = parseFloat(planDetails.price.replace('₱', '').replace(',', ''));
    
    if (amount === 0) {
      // Free plan - just update the subscription
      return await this.updateSubscriptionPlan(user, planType);
    }

    try {
      let paymentResult;
      
      if (paymentMethod === 'card') {
        paymentResult = await PayMongoService.processCardPayment(
          amount,
          paymentDetails,
          `${planDetails.name} Subscription`
        );
        
        // For card payments, return the result for client-side 3D Secure handling
        return {
          success: true,
          paymentData: {
            paymentIntentId: paymentResult.paymentIntent.id,
            clientSecret: paymentResult.clientSecret,
            amount: amount
          },
          requiresAction: true
        };
      } else if (paymentMethod === 'gcash') {
        paymentResult = await PayMongoService.processGCashPayment(
          amount,
          redirectUrls,
          `${planDetails.name} Subscription`
        );
        
        return {
          success: true,
          paymentData: {
            source: paymentResult.source,
            sourceId: paymentResult.source.id,
            checkoutUrl: paymentResult.checkoutUrl,
            amount: amount
          },
          requiresRedirect: true
        };
      } else if (paymentMethod === 'maya') {
        // Maya uses Payment Intent workflow, not Sources workflow
        paymentResult = await PayMongoService.processMayaPayment(
          amount,
          `${planDetails.name} Subscription`
        );
        
        return {
          success: true,
          paymentData: {
            paymentIntentId: paymentResult.paymentIntent.id,
            clientSecret: paymentResult.clientSecret,
            amount: amount
          },
          requiresAction: true // Maya requires creating payment method and attaching
        };
      }
    } catch (error) {
      console.error('Error processing subscription payment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify payment and complete subscription
  static async verifyAndCompleteSubscription(user, paymentData, subscriptionPlan) {
    return await PayMongoService.verifyPaymentAndUpdateSubscription(user, paymentData, subscriptionPlan);
  }
}

export default SubscriptionService; 