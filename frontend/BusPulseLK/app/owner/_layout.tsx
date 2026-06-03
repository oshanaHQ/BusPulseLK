import { Stack } from 'expo-router';
import React from 'react';

export default function OwnerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // ✅ hides "Passenger/Dashboard" top bar
      }}
    />
  );
}
