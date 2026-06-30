// app/(auth)/verify-code.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { authService } from '../../services/api';

export default function VerifyCode() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!code || code.length < 6) {
      Alert.alert('Error', 'Please enter the 6-digit code.');
      return;
    }
    
    setLoading(true);
    try {
      await authService.verifyResetCode(email as string, code);
      // Code is valid, move to reset password screen
      router.push({
        pathname: '/(auth)/reset-password' as any,
        params: { email, code }
      });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail-unread-outline" size={80} color="#FF6200" />
          </View>
          <Text style={styles.title}>Check your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit reset code to <Text style={{color: '#FFF', fontWeight: 'bold'}}>{email}</Text>. Please enter it below.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="000000"
              placeholderTextColor="#444"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus={true}
            />
          </View>

          <TouchableOpacity 
            style={[styles.btn, (!code || code.length < 6 || loading) && styles.btnDisabled]} 
            onPress={handleVerify}
            disabled={!code || code.length < 6 || loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Verify Code</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { flexGrow: 1 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  content: { padding: 20, alignItems: 'center', flex: 1, marginTop: 40 },
  iconContainer: { marginBottom: 30, backgroundColor: '#FF620022', padding: 20, borderRadius: 100 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFF', marginBottom: 15 },
  subtitle: { fontSize: 15, color: '#AAA', textAlign: 'center', marginBottom: 40, lineHeight: 22, paddingHorizontal: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 12, paddingHorizontal: 15, height: 70, marginBottom: 30, width: '100%', borderWidth: 1, borderColor: '#333' },
  input: { flex: 1, color: '#FF6200', fontSize: 32, fontWeight: 'bold', textAlign: 'center', letterSpacing: 10 },
  btn: { backgroundColor: '#FF6200', width: '100%', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
