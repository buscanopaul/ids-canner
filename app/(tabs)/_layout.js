import { Stack } from 'expo-router';

export default function TabLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{
          animation: 'slide_from_left',
        }}
      />
      <Stack.Screen 
        name="profile" 
        options={{
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
} 