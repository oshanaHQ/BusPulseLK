// app/(auth)/login.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { authService, AuthUser } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const LoginScreen = () => {
  const insets = useSafeAreaInsets();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const auth = useAuth();

  const goToRegister = () => {
    router.push('/(auth)/register');
  };

  const handleLogin = async () => {
    if (!emailOrPhone || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login({
        email: emailOrPhone,
        password: password,
      });

      // Save token + user — RouteGuard in _layout.tsx will redirect automatically
      await auth.login(response.token, response.user as AuthUser);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar backgroundColor="#000000" barStyle="light-content" />
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <View style={styles.header}>
            <View style={styles.busCircle}>
              <Ionicons name="bus" size={48} color="#FFFFFF" />
            </View>

            <Text style={styles.title}>BusPulse LK</Text>
            <Text style={styles.subtitle}>Your Journey, Tracked.</Text>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity style={[styles.tab, styles.activeTab]}>
              <Text style={styles.tabTextActive}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tab} onPress={goToRegister}>
              <Text style={styles.tabText}>Register</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Email or Phone</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email or phone"
                placeholderTextColor="#666"
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#888"
                  style={styles.eyeIcon}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotLink} onPress={() => router.push('/(auth)/forgot-password' as any)}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestButton}
            onPress={() => auth.loginAsGuest()}
          >
            <Ionicons name="person-outline" size={20} color="#FF6200" style={{ marginRight: 10 }} />
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text style={styles.registerLink} onPress={goToRegister}>
                Register
              </Text>
            </Text>
          </View>
        </KeyboardAvoidingView>
      </View>
    </>
  );
};

// styles remain 100% the same — no change here
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardAvoid: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  busCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FF6200',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    borderRadius: 30,
    padding: 4,
    marginBottom: 32,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 26,
  },
  activeTab: {
    backgroundColor: '#222222',
  },
  tabText: {
    color: '#888888',
    fontSize: 16,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222222',
  },
  inputIcon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  eyeIcon: {
    marginRight: 16,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: 28,
  },
  forgotText: {
    color: '#FF6200',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#FF6200',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 15,
    marginBottom: 32,
    borderWidth: 1.5,
    borderColor: '#FF6200',
    backgroundColor: 'transparent',
  },
  guestButtonText: {
    color: '#FF6200',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#AAAAAA',
    fontSize: 15,
  },
  registerLink: {
    color: '#FF6200',
    fontWeight: '600',
  },
});

export default LoginScreen;