// app/worker/regular-passengers.tsx
import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator, Alert, StatusBar, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { regularPassengerService } from '../../services/api';

const WorkerRegularPassengers = () => {
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nominating, setNominating] = useState(false);
  const [showNominateModal, setShowNominateModal] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await regularPassengerService.getMyBus() as any[];
      setRequests(data);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not load passengers. Make sure you are assigned to a bus.');
    } finally {
      setLoading(false);
    }
  };

  const handleNominate = async () => {
    if (!email.trim()) return Alert.alert('Validation', 'Please enter an email address.');
    try {
      setNominating(true);
      await regularPassengerService.nominate(email.trim());
      setEmail('');
      setShowNominateModal(false);
      Alert.alert('Submitted!', 'Nomination sent to admin for approval.');
      fetchRequests();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to nominate passenger.');
    } finally {
      setNominating(false);
    }
  };

  const handleRemove = (req: any) => {
    Alert.alert(
      'Remove Passenger',
      `Remove ${req.passenger?.fullName} as a regular passenger?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive', onPress: async () => {
            try {
              await regularPassengerService.remove(req.id);
              fetchRequests();
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          }
        }
      ]
    );
  };

  const statusColor = (s: string) => s === 'Approved' ? '#4CAF50' : s === 'Rejected' ? '#D32F2F' : '#FF9800';
  const statusIcon = (s: string): any => s === 'Approved' ? 'checkmark-circle' : s === 'Rejected' ? 'close-circle' : 'time';

  const approved = requests.filter(r => r.status === 'Approved');
  const pending = requests.filter(r => r.status === 'Pending');
  const rejected = requests.filter(r => r.status === 'Rejected');

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Regular Passengers</Text>
        <TouchableOpacity style={styles.nominateBtn} onPress={() => setShowNominateModal(true)}>
          <Ionicons name="person-add-outline" size={22} color="#FF6200" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#FF6200" style={{ marginTop: 60 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Info */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={18} color="#FF9800" />
            <Text style={styles.infoText}>
              You can nominate passengers for your current bus. Nominations require admin approval before passengers gain access.
            </Text>
          </View>

          {/* Approved */}
          {approved.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Approved ({approved.length})</Text>
              {approved.map(req => (
                <View key={req.id} style={styles.card}>
                  <View style={styles.cardLeft}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{req.passenger?.fullName?.[0] ?? '?'}</Text>
                    </View>
                    <View>
                      <Text style={styles.passengerName}>{req.passenger?.fullName}</Text>
                      <Text style={styles.passengerEmail}>{req.passenger?.email}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor(req.status) + '22' }]}>
                        <Ionicons name={statusIcon(req.status)} size={12} color={statusColor(req.status)} />
                        <Text style={[styles.statusText, { color: statusColor(req.status) }]}>{req.status}</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleRemove(req)} style={styles.removeBtn}>
                    <Ionicons name="person-remove-outline" size={20} color="#D32F2F" />
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {/* Pending */}
          {pending.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Pending Admin Approval ({pending.length})</Text>
              {pending.map(req => (
                <View key={req.id} style={styles.card}>
                  <View style={styles.cardLeft}>
                    <View style={[styles.avatar, { backgroundColor: '#FF980022' }]}>
                      <Text style={[styles.avatarText, { color: '#FF9800' }]}>{req.passenger?.fullName?.[0] ?? '?'}</Text>
                    </View>
                    <View>
                      <Text style={styles.passengerName}>{req.passenger?.fullName}</Text>
                      <Text style={styles.passengerEmail}>{req.passenger?.email}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: '#FF980022' }]}>
                        <Ionicons name="time" size={12} color="#FF9800" />
                        <Text style={[styles.statusText, { color: '#FF9800' }]}>Awaiting Approval</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleRemove(req)} style={styles.removeBtn}>
                    <Ionicons name="close-circle-outline" size={20} color="#555" />
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {/* Rejected */}
          {rejected.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Rejected ({rejected.length})</Text>
              {rejected.map(req => (
                <View key={req.id} style={[styles.card, { opacity: 0.6 }]}>
                  <View style={styles.cardLeft}>
                    <View style={[styles.avatar, { backgroundColor: '#D32F2F22' }]}>
                      <Text style={[styles.avatarText, { color: '#D32F2F' }]}>{req.passenger?.fullName?.[0] ?? '?'}</Text>
                    </View>
                    <View>
                      <Text style={styles.passengerName}>{req.passenger?.fullName}</Text>
                      <Text style={styles.passengerEmail}>{req.passenger?.email}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: '#D32F2F22' }]}>
                        <Ionicons name="close-circle" size={12} color="#D32F2F" />
                        <Text style={[styles.statusText, { color: '#D32F2F' }]}>Rejected</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleRemove(req)} style={styles.removeBtn}>
                    <Ionicons name="trash-outline" size={20} color="#333" />
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {requests.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#222" />
              <Text style={styles.emptyText}>No regular passengers yet.</Text>
              <Text style={styles.emptySubText}>Tap the icon above to nominate a passenger.</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Nominate Modal */}
      <Modal visible={showNominateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nominate Passenger</Text>
            <Text style={styles.modalSubtitle}>Enter the passenger's email address. They must have a registered account.</Text>
            <TextInput
              style={styles.input}
              placeholder="passenger@email.com"
              placeholderTextColor="#444"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#111' }]}
                onPress={() => { setShowNominateModal(false); setEmail(''); }}
              >
                <Text style={[styles.modalBtnText, { color: '#666' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#FF6200', flex: 1.5 }]}
                onPress={handleNominate}
                disabled={nominating}
              >
                {nominating ? <ActivityIndicator color="#FFF" size="small" /> :
                  <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Nominate</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  backBtn: { padding: 4 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  nominateBtn: { padding: 4 },
  content: { padding: 20, paddingBottom: 60 },
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#FF980018', borderRadius: 12, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: '#FF980033' },
  infoText: { color: '#FF9800', fontSize: 13, flex: 1, lineHeight: 20 },
  sectionTitle: { color: '#AAA', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginTop: 8 },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1A1A1A' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF620022', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FF6200', fontSize: 18, fontWeight: 'bold' },
  passengerName: { color: '#FFF', fontSize: 16, fontWeight: '600', marginBottom: 2 },
  passengerEmail: { color: '#555', fontSize: 12, marginBottom: 6 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  removeBtn: { padding: 8 },
  emptyState: { alignItems: 'center', marginTop: 80, gap: 10 },
  emptyText: { color: '#444', fontSize: 16, fontWeight: '600' },
  emptySubText: { color: '#333', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#111', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#222' },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  modalSubtitle: { color: '#666', fontSize: 14, marginBottom: 20, lineHeight: 20 },
  input: { backgroundColor: '#000', borderRadius: 12, padding: 14, color: '#FFF', fontSize: 15, marginBottom: 20, borderWidth: 1, borderColor: '#222' },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalBtnText: { fontSize: 15, fontWeight: 'bold' },
});

export default WorkerRegularPassengers;
