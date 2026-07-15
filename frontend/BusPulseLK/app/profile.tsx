// app/profile.tsx — Shared profile screen for all roles
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';

// ── 16-icon avatar catalogue ──────────────────────────────────────────────────
const AVATARS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'person-circle',    label: 'Default'    },
  { icon: 'happy-outline',    label: 'Happy'      },
  { icon: 'glasses-outline',  label: 'Glasses'    },
  { icon: 'star-outline',     label: 'Star'       },
  { icon: 'flame-outline',    label: 'Flame'      },
  { icon: 'rocket-outline',   label: 'Rocket'     },
  { icon: 'paw-outline',      label: 'Paw'        },
  { icon: 'diamond-outline',  label: 'Diamond'    },
  { icon: 'bus-outline',      label: 'Bus'        },
  { icon: 'bicycle-outline',  label: 'Bicycle'    },
  { icon: 'car-outline',      label: 'Car'        },
  { icon: 'walk-outline',     label: 'Walk'       },
  { icon: 'shield-outline',   label: 'Shield'     },
  { icon: 'leaf-outline',     label: 'Leaf'       },
  { icon: 'moon-outline',     label: 'Moon'       },
  { icon: 'sunny-outline',    label: 'Sun'        },
];

const ProfileScreen = () => {
  const { user, updateUser } = useAuth();
  const insets = useSafeAreaInsets();

  // ── Avatar state ───────────────────────────────────────────────────────────
  const [selectedAvatar, setSelectedAvatar] = useState<number>(user?.avatarId ?? 0);

  // ── Name state ─────────────────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState(user?.fullName ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Password state ─────────────────────────────────────────────────────────
  const [currentPassword,  setCurrentPassword]  = useState('');
  const [newPassword,      setNewPassword]      = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');
  const [showCurrent,      setShowCurrent]      = useState(false);
  const [showNew,          setShowNew]          = useState(false);
  const [showConfirm,      setShowConfirm]      = useState(false);
  const [savingPassword,   setSavingPassword]   = useState(false);

  // ── Load fresh profile on mount ────────────────────────────────────────────
  useEffect(() => {
    userService.getProfile().then(profile => {
      setDisplayName(profile.fullName);
      setSelectedAvatar(profile.avatarId);
    }).catch(() => {/* silently use cached data */});
  }, []);

  // ── Save name + avatar ─────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    const trimmed = displayName.trim();
    if (!trimmed || trimmed.length < 2) {
      Alert.alert('Validation', 'Display name must be at least 2 characters.');
      return;
    }
    setSavingProfile(true);
    try {
      const updated = await userService.updateProfile({ fullName: trimmed, avatarId: selectedAvatar });
      updateUser({ fullName: updated.fullName, avatarId: updated.avatarId });
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Change password ────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Validation', 'Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Validation', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword === currentPassword) {
      Alert.alert('Validation', 'New password must be different from your current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Validation', 'New password and confirmation do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      await userService.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password changed successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback if no history exists
      if (user?.role === 'Admin') router.replace('/admin/dashboard');
      else if (user?.role === 'BusOwner') router.replace('/owner/dashboard');
      else if (user?.role === 'Driver' || user?.role === 'Conductor') router.replace('/worker/dashboard');
      else router.replace('/passenger');
    }
  };

  const currentAvatarIcon = AVATARS[selectedAvatar]?.icon ?? 'person-circle';

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar backgroundColor="#000000" barStyle="light-content" />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Header ─────────────────────────────────────────────────── */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={22} color="#FF6200" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>My Profile</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* ── Hero avatar ────────────────────────────────────────────── */}
            <View style={styles.heroRow}>
              <View style={styles.heroCircle}>
                <Ionicons name={currentAvatarIcon} size={56} color="#FFFFFF" />
              </View>
              <Text style={styles.heroName}>{displayName || user?.fullName}</Text>
              <Text style={styles.heroEmail}>{user?.email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{user?.role}</Text>
              </View>
            </View>

            {/* ══════════════════════════════════════════════════════════════
                SECTION 1 — Avatar Picker
            ══════════════════════════════════════════════════════════════ */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose Avatar</Text>
              <View style={styles.avatarGrid}>
                {AVATARS.map((a, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.avatarCell,
                      selectedAvatar === idx && styles.avatarCellActive,
                    ]}
                    onPress={() => setSelectedAvatar(idx)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={a.icon}
                      size={28}
                      color={selectedAvatar === idx ? '#FF6200' : '#888888'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ══════════════════════════════════════════════════════════════
                SECTION 2 — Display Name
            ══════════════════════════════════════════════════════════════ */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Display Name</Text>

              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Your display name"
                  placeholderTextColor="#555"
                  autoCapitalize="words"
                  returnKeyType="done"
                />
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, savingProfile && styles.saveBtnDisabled]}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile
                  ? <ActivityIndicator color="#FFFFFF" size="small" />
                  : <Text style={styles.saveBtnText}>Save Profile</Text>
                }
              </TouchableOpacity>
            </View>

            {/* ══════════════════════════════════════════════════════════════
                SECTION 3 — Change Password
            ══════════════════════════════════════════════════════════════ */}
            <View style={[styles.section, { marginBottom: 40 }]}>
              <Text style={styles.sectionTitle}>Change Password</Text>

              {/* Current password */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Current password"
                  placeholderTextColor="#555"
                  secureTextEntry={!showCurrent}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowCurrent(v => !v)}>
                  <Ionicons
                    name={showCurrent ? 'eye-outline' : 'eye-off-outline'}
                    size={20} color="#888" style={styles.eyeIcon}
                  />
                </TouchableOpacity>
              </View>

              {/* New password */}
              <View style={[styles.inputContainer, { marginTop: 12 }]}>
                <Ionicons name="lock-open-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="New password (min 6 chars)"
                  placeholderTextColor="#555"
                  secureTextEntry={!showNew}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowNew(v => !v)}>
                  <Ionicons
                    name={showNew ? 'eye-outline' : 'eye-off-outline'}
                    size={20} color="#888" style={styles.eyeIcon}
                  />
                </TouchableOpacity>
              </View>

              {/* Confirm password */}
              <View style={[styles.inputContainer, { marginTop: 12 }]}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor="#555"
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirm(v => !v)}>
                  <Ionicons
                    name={showConfirm ? 'eye-outline' : 'eye-off-outline'}
                    size={20} color="#888" style={styles.eyeIcon}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, styles.saveBtnPassword, savingPassword && styles.saveBtnDisabled]}
                onPress={handleChangePassword}
                disabled={savingPassword}
              >
                {savingPassword
                  ? <ActivityIndicator color="#FFFFFF" size="small" />
                  : <Text style={styles.saveBtnText}>Change Password</Text>
                }
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scroll: {
    paddingHorizontal: 20,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#222222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroRow: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  heroCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF6200',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#FF6200',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  heroName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroEmail: {
    color: '#888888',
    fontSize: 14,
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: '#FF620022',
    borderWidth: 1,
    borderColor: '#FF620055',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: {
    color: '#FF6200',
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Section ───────────────────────────────────────────────────────────────
  section: {
    backgroundColor: '#0D0D0D',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FF6200',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 16,
  },

  // ── Avatar grid ───────────────────────────────────────────────────────────
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-start',
  },
  avatarCell: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#151515',
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCellActive: {
    backgroundColor: '#FF620015',
    borderColor: '#FF6200',
  },

  // ── Inputs ────────────────────────────────────────────────────────────────
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222222',
  },
  inputIcon: {
    marginLeft: 14,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  eyeIcon: {
    marginRight: 14,
  },

  // ── Buttons ───────────────────────────────────────────────────────────────
  saveBtn: {
    backgroundColor: '#FF6200',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnPassword: {
    backgroundColor: '#1A1A2E',
    borderWidth: 1.5,
    borderColor: '#FF6200',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ProfileScreen;
