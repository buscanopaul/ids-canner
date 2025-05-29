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
} from 'react-native';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  // Animation values
  const slideAnim = useRef(new Animated.Value(width)).current; // Start off-screen to the right
  const fadeAnim = useRef(new Animated.Value(0)).current; // Start invisible
  const scaleAnim = useRef(new Animated.Value(0.9)).current; // Start slightly smaller

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
          onPress: () => {
            // In a real app, you would call an API to delete the account
            Alert.alert(
              'Account Deletion',
              'Account deletion feature is coming soon. Please contact support for assistance.'
            );
          },
        },
      ]
    );
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
                    ? new Date(user.lastSignInAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
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
});
