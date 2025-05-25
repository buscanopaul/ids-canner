import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useUser, useAuth } from '@clerk/clerk-expo';

export default function HomeScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ]
    );
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return 'No phone number';
    // Format +1234567890 to +1 (234) 567-890
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-5 pt-16 pb-8">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Edge Scanner
          </Text>
          <Text className="text-base text-gray-600">
            You're successfully authenticated!
          </Text>
        </View>

        {/* User Info Card */}
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <Text className="text-xl font-semibold text-gray-900 mb-4">
            Your Account
          </Text>
          
          <View className="space-y-3">
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-gray-600 font-medium">User ID</Text>
              <Text className="text-gray-900 font-mono text-sm">
                {user?.id?.slice(0, 8)}...
              </Text>
            </View>
            
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-gray-600 font-medium">Phone Number</Text>
              <Text className="text-gray-900">
                {formatPhoneNumber(user?.primaryPhoneNumber?.phoneNumber)}
              </Text>
            </View>
            
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-gray-600 font-medium">Created</Text>
              <Text className="text-gray-900">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
              </Text>
            </View>
            
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-gray-600 font-medium">Last Sign In</Text>
              <Text className="text-gray-900">
                {user?.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : 'Unknown'}
              </Text>
            </View>
          </View>
        </View>

        {/* Features Card */}
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <Text className="text-xl font-semibold text-gray-900 mb-4">
            App Features
          </Text>
          
          <View className="space-y-3">
            <TouchableOpacity className="flex-row items-center py-3 px-4 bg-blue-50 rounded-xl">
              <View className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center mr-3">
                <Text className="text-white font-bold">📱</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold">SMS Authentication</Text>
                <Text className="text-gray-600 text-sm">Secure phone-based login</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity className="flex-row items-center py-3 px-4 bg-green-50 rounded-xl">
              <View className="w-10 h-10 bg-green-500 rounded-full items-center justify-center mr-3">
                <Text className="text-white font-bold">🔒</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold">Secure Sessions</Text>
                <Text className="text-gray-600 text-sm">Protected user sessions</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity className="flex-row items-center py-3 px-4 bg-purple-50 rounded-xl">
              <View className="w-10 h-10 bg-purple-500 rounded-full items-center justify-center mr-3">
                <Text className="text-white font-bold">⚡</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold">Fast Verification</Text>
                <Text className="text-gray-600 text-sm">Quick 6-digit code verification</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions */}
        <View className="space-y-3">
          <TouchableOpacity className="bg-blue-500 rounded-xl p-4 items-center">
            <Text className="text-white text-base font-semibold">
              Refresh User Data
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="bg-red-500 rounded-xl p-4 items-center"
            onPress={handleSignOut}
          >
            <Text className="text-white text-base font-semibold">
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
} 