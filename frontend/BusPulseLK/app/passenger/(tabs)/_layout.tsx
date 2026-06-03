// app/passenger/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { isGuest } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF6200',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: isGuest
          ? { display: 'none' }
          : {
              backgroundColor: '#000',
              borderTopColor: '#111',
              height: 65 + insets.bottom,
              paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
              paddingTop: 10,
            },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="announcements"
        options={{
          title: 'Announcements',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="megaphone-outline" size={size} color={color} />
          ),
          ...(isGuest ? { tabBarButton: () => null } : {}),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
          ...(isGuest ? { tabBarButton: () => null } : {}),
        }}
      />
    </Tabs>
  );
}
