// app/passenger/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';

export default function PassengerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="live-tracking" />
    </Stack>
  );
}
