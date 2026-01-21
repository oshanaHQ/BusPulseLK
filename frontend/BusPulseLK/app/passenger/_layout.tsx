import { Stack } from 'expo-router';
import React from 'react';

export default function PassengerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // ✅ hides "Passenger/Dashboard" top bar
      }}
    />
  );
}
