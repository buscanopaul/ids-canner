# Edge Scanner - Modern Authentication App

A React Native Expo app with Clerk authentication featuring username/password sign-in and social OAuth providers.

## Features

- **Username/Password Authentication**: Standard email and password sign-in
- **Social Sign-In**: Google OAuth (and Apple on iOS)
- **Email Verification**: Secure account verification via email
- **User Profile Management**: Complete user profile with first name, last name, username, and email
- **Modern UI**: Clean, responsive design with proper loading states

## Authentication Flow

### 1. Sign In

- **Username/Password**: Users can sign in with username or email + password
- **Google OAuth**: One-click sign-in with Google account
- **Apple OAuth**: One-click sign-in with Apple ID (iOS only)
- **Direct Authentication**: No verification codes needed for existing users

### 2. Sign Up (New Users)

- **Complete Registration Form**: First name, last name, username, email, password
- **Password Validation**: Minimum 8 characters with confirmation
- **Email Verification**: 6-digit code sent to email address
- **Account Activation**: Session activated after email verification

### 3. Email Verification

- **6-digit Code**: Secure verification sent to user's email
- **Auto-advance**: Automatic focus between input fields
- **Auto-submit**: Submits when all digits are entered
- **Resend Option**: Easy code resend functionality

## Project Setup

### Prerequisites

- Node.js 18+
- Bun package manager
- Expo CLI
- iOS Simulator or Android Emulator

### Installation

1. **Clone and install dependencies:**

   ```bash
   git clone <repository-url>
   cd edge-scanner
   bun install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory:

   ```
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
   ```

3. **Configure Clerk Dashboard:**
   - Create a new Clerk application
   - Enable email/password authentication
   - Configure OAuth providers (Google, Apple)
   - Set up email provider for verification
   - Copy the publishable key to your `.env` file

### Running the App

```bash
# Start development server
bun start

# Run on iOS
bun ios

# Run on Android
bun android
```

## Project Structure

```
app/
├── _layout.js                 # Root layout with Clerk provider and auth routing
├── (auth)/                    # Authentication screens group
│   ├── sign-in.js            # Username/password + OAuth sign-in
│   ├── sign-up.js            # User registration form
│   └── verification.js        # Email verification
└── (tabs)/                    # Main app screens (authenticated)
    ├── index.js              # Home screen
    └── profile.js            # User profile and settings
```

## Key Components

### Sign-In Screen (`app/(auth)/sign-in.js`)

- **Username/Email Input**: Accepts both username and email
- **Password Input**: Secure password entry
- **OAuth Buttons**: Google and Apple sign-in options
- **Navigation**: Link to sign-up for new users
- **Error Handling**: Comprehensive error messages

### Sign-Up Screen (`app/(auth)/sign-up.js`)

- **Complete Profile Form**: First name, last name, username, email
- **Password Fields**: Password and confirmation with validation
- **Email Validation**: Real-time email format checking
- **Form Validation**: All required fields with proper error messages

### Verification Screen (`app/(auth)/verification.js`)

- **6-digit Code Input**: Individual input fields for each digit
- **Auto-advance**: Automatic focus progression
- **Auto-submit**: Submits when complete
- **Resend Functionality**: Easy code resend option
- **Email Display**: Shows verification email address

### Profile Screen (`app/(tabs)/profile.js`)

- **User Information**: First name, last name, username, email
- **Account Details**: Creation date, last sign-in
- **Settings Options**: Notifications, privacy, help
- **Sign Out**: Secure session termination

## Technical Details

### Dependencies

- **expo-router**: File-based routing (v4.0.21 for SDK 52 compatibility)
- **@clerk/clerk-expo**: Authentication provider with OAuth support
- **expo-secure-store**: Secure token storage
- **react-native-safe-area-context**: Safe area handling
- **react-native-screens**: Native screen components

### Authentication Logic

- **Username/Password**: Standard Clerk email/password authentication
- **OAuth Integration**: Google and Apple OAuth flows
- **Email Verification**: Secure account verification process
- **Session Management**: Automatic session handling with secure storage
- **Conditional Routing**: Smart navigation based on authentication state

### Form Validation

- **Email Format**: Real-time email validation
- **Password Strength**: Minimum 8 characters requirement
- **Password Confirmation**: Matching password validation
- **Required Fields**: All fields validated before submission

## Security Considerations

- **Secure Authentication**: Industry-standard OAuth and password authentication
- **Email Verification**: Required email verification for account security
- **Session Management**: Secure token storage and session handling
- **Input Validation**: Comprehensive client-side and server-side validation
- **Error Handling**: Secure error messages without sensitive information exposure

## OAuth Configuration

### Google OAuth Setup

1. **Google Cloud Console**:

   - Create new project or use existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs

2. **Clerk Dashboard**:
   - Navigate to OAuth providers
   - Enable Google provider
   - Add client ID and secret
   - Configure scopes and settings

### Apple OAuth Setup (iOS)

1. **Apple Developer Account**:

   - Create App ID with Sign in with Apple capability
   - Configure Sign in with Apple service

2. **Clerk Dashboard**:
   - Enable Apple provider
   - Configure team ID and key ID
   - Upload private key file

## Customization

### Styling

- **React Native StyleSheet**: No external CSS frameworks
- **Modern Design**: Clean, consistent UI components
- **Responsive Layout**: Works on various screen sizes
- **Loading States**: Proper loading indicators for all actions

### Email Provider Setup

Configure your preferred email provider in Clerk dashboard:

- **Clerk Email**: Built-in email service
- **SendGrid**: Popular email service
- **AWS SES**: Amazon email service
- **Custom SMTP**: For advanced configurations

### Form Customization

- **Validation Rules**: Modify password requirements
- **Field Options**: Add or remove form fields
- **UI Components**: Customize input styles and layouts
- **Error Messages**: Personalize error message text

## Troubleshooting

### Common Issues

1. **Clerk Key Missing**

   - Ensure `.env` file exists with correct publishable key
   - Restart development server after adding environment variables

2. **OAuth Not Working**

   - Check OAuth provider configuration in Clerk dashboard
   - Verify client IDs and secrets are correct
   - Ensure redirect URIs are properly configured

3. **Email Verification Issues**

   - Check email provider configuration
   - Verify email delivery settings
   - Check spam/junk folders for verification emails

4. **Navigation Issues**
   - Clear Expo cache: `expo start --clear`
   - Restart development server
   - Check for JavaScript errors in console

## Development

### Adding New Features

1. Create new screens in appropriate groups (`(auth)` or `(tabs)`)
2. Update routing logic in `_layout.js` if needed
3. Add navigation links between screens
4. Test authentication flow thoroughly

### Testing

- Test username and email sign-in variations
- Verify OAuth flows on different platforms
- Test email verification process
- Validate form inputs and error handling
- Test on both iOS and Android platforms

## Production Deployment

1. **Environment Setup**

   - Set up production Clerk environment
   - Configure production OAuth providers
   - Set up production email provider
   - Update environment variables

2. **Build Configuration**

   - Update `app.json` with production settings
   - Configure signing certificates
   - Set up app store metadata
   - Configure OAuth redirect URIs for production

3. **Security Checklist**
   - Review OAuth configuration security
   - Implement proper session management
   - Add rate limiting and abuse protection
   - Configure proper CORS and API security
   - Test email delivery in production

## Support

For issues and questions:

- Check Clerk documentation for authentication setup
- Review Expo Router documentation for navigation
- Test OAuth flows on physical devices
- Monitor Clerk dashboard for authentication analytics
- Check email provider logs for delivery issues

## License

This project is licensed under the MIT License - see the LICENSE file for details.
