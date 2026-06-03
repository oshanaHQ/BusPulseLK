// app/index.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      router.replace('/login'); // ✅ correct TS-safe path
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <>
        <StatusBar backgroundColor="#000000" barStyle="light-content" />
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Ionicons 
              name="bus" 
              size={120} 
              color="#FF6200" 
              style={styles.icon}
            />
            <Text style={styles.title}>BusPulse LK</Text>
            <Text style={styles.subtitle}>
              Your Sri Lankan Bus Tracker
            </Text>
          </View>

          <ActivityIndicator 
            size="large" 
            color="#FF6200" 
            style={styles.loader}
          />
        </SafeAreaView>
      </>
    );
  }

  return null; // After loading, navigation handles everything
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    marginBottom: 80,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FF6200',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.9,
    letterSpacing: 0.5,
  },
  loader: {
    position: 'absolute',
    bottom: 60,
  },
});
