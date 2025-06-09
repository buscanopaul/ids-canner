# PayMongo Integration Setup

## Overview
This app integrates with PayMongo for secure payment processing during subscription upgrades. The integration supports both credit/debit cards and GCash payments.

## Environment Variables

Add the following environment variables to your `.env` or `.env.local` file:

```env
EXPO_PUBLIC_PAYMONGO_SECRET_KEY=sk_test_your_secret_key_here
EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_your_public_key_here
```

## Getting PayMongo API Keys

1. Sign up for a PayMongo account at https://dashboard.paymongo.com/
2. Complete the account verification process
3. Navigate to the API Keys section in your dashboard
4. Copy your test keys for development:
   - Secret Key (starts with `sk_test_`)
   - Public Key (starts with `pk_test_`)

## Features Implemented

### Card Payment Processing
- ✅ Secure card information collection
- ✅ Real-time card validation (Luhn algorithm)
- ✅ Card number formatting with spaces
- ✅ 3D Secure authentication support
- ✅ Payment intent creation and processing

### GCash Integration
- ✅ GCash source creation
- ✅ Redirect URL handling
- ✅ Payment verification after authorization

### Security Features
- ✅ Client-side card validation
- ✅ Encrypted API communication
- ✅ Secure payment method creation
- ✅ Automatic 3D Secure request

## Payment Flow

### Card Payments
1. User enters card information in the payment modal
2. Client-side validation using Luhn algorithm
3. PayMongo payment method creation
4. Payment intent creation with 3D Secure
5. Payment method attachment to intent
6. 3D Secure authentication (if required)
7. Payment verification and subscription update

### GCash Payments
1. User selects GCash payment method
2. GCash source creation with redirect URLs
3. User redirected to GCash for authorization
4. Payment completion after user authorization
5. Payment verification and subscription update

## Components Updated

### PaymentModal (`app/components/PaymentModal.js`)
- Enhanced card form with proper input fields
- Real-time card number formatting
- Integrated PayMongo service calls
- 3D Secure handling

### PayMongoService (`app/services/paymongoService.js`)
- Complete PayMongo API integration
- Card validation utilities
- Payment intent management
- GCash source handling

## Usage

The payment modal is automatically shown when users select a paid subscription plan in the `EnhancedSubscriptionSelector` component. The integration handles:

1. Plan selection
2. Payment method choice (Card or GCash)
3. Payment processing
4. Subscription activation

## Testing

For testing, use PayMongo's test card numbers:
- **Visa**: 4343434343434345
- **Mastercard**: 5555555555554444
- **Visa (3D Secure)**: 4012888888881881

## Error Handling

The integration includes comprehensive error handling for:
- Invalid card information
- Network failures
- Payment declines
- 3D Secure failures
- Subscription update failures

## Security Notes

- All card information is transmitted securely to PayMongo
- No sensitive card data is stored locally
- API keys are environment-based
- 3D Secure authentication is automatically requested when available

## Production Deployment

When deploying to production:
1. Replace test API keys with live keys
2. Update redirect URLs to production domains
3. Test all payment flows thoroughly
4. Monitor PayMongo webhook endpoints

## Webhook Integration (Future Enhancement)

For production apps, consider implementing PayMongo webhooks to handle:
- Payment confirmations
- Subscription status updates
- Failed payment notifications
- Chargeback notifications

## Support

For PayMongo-specific issues, refer to:
- PayMongo Documentation: https://developers.paymongo.com/
- PayMongo Support: support@paymongo.com 