// app/admin/regular-passengers.tsx
import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { regularPassengerService } from '../../services/api';

const AdminRegularPassengers = () => {
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState('Pending');

  useEffect(() => { fetchRequests(); }, [activeFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await regularPassengerService.getPending(activeFilter) as any[];
      setRequests(data);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (req: any) => {
    Alert.alert(
      'Approve Request',
      `Approve ${req.passenger?.fullName} as a regular passenger for bus ${req.bus?.numberPlate}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve', onPress: async () => {
            try {
              setActionLoading(req.id);
              await regularPassengerService.approve(req.id);
              Alert.alert('Approved!', `${req.passenger?.fullName} is now a regular passenger.`);
              fetchRequests();
            } catch (e: any) {
              Alert.alert('Error', e.message);
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  const handleReject = (req: any) => {
    Alert.alert(
      'Reject Request',
      `Reject ${req.passenger?.fullName}'s nomination for bus ${req.bus?.numberPlate}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject', style: 'destructive', onPress: async () => {
            try {
              setActionLoading(req.id);
              await regularPassengerService.reject(req.id);
              fetchRequests();
            } catch (e: any) {
              Alert.alert('Error', e.message);
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  const statusColor = (s: string) => s === 'Approved' ? '#4CAF50' : s === 'Rejected' ? '#D32F2F' : '#FF9800';

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Regular Passengers</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        {['Pending', 'Approved', 'Rejected'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, activeFilter === f && styles.activeFilter]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.activeFilterText]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6200" />
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={64} color="#222" />
          <Text style={styles.emptyText}>No {activeFilter.toLowerCase()} requests.</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.passenger?.fullName?.[0] ?? '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.passengerName}>{item.passenger?.fullName}</Text>
                  <Text style={styles.passengerEmail}>{item.passenger?.email}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '22' }]}>
                  <Text style={[styles.statusText, { color: statusColor(item.status) }]}>{item.status}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="bus-outline" size={14} color="#555" />
                <Text style={styles.detailText}>Bus: {item.bus?.numberPlate} {item.bus?.name ? `(${item.bus.name})` : ''}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={14} color="#555" />
                <Text style={styles.detailText}>Nominated by: {item.nominatedBy?.fullName ?? 'Unknown'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={14} color="#555" />
                <Text style={styles.detailText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>

              {item.status === 'Pending' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#D32F2F22' }]}
                    onPress={() => handleReject(item)}
                    disabled={actionLoading === item.id}
                  >
                    {actionLoading === item.id ? (
                      <ActivityIndicator color="#D32F2F" size="small" />
                    ) : (
                      <>
                        <Ionicons name="close-circle-outline" size={16} color="#D32F2F" />
                        <Text style={[styles.actionBtnText, { color: '#D32F2F' }]}>Reject</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#4CAF5022', flex: 1.2 }]}
                    onPress={() => handleApprove(item)}
                    disabled={actionLoading === item.id}
                  >
                    {actionLoading === item.id ? (
                      <ActivityIndicator color="#4CAF50" size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={16} color="#4CAF50" />
                        <Text style={[styles.actionBtnText, { color: '#4CAF50' }]}>Approve</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  backBtn: { padding: 4 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  filterRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, gap: 8 },
  filterBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10, backgroundColor: '#111', borderWidth: 1, borderColor: '#222' },
  activeFilter: { backgroundColor: '#FF6200', borderColor: '#FF6200' },
  filterText: { color: '#666', fontSize: 13, fontWeight: '600' },
  activeFilterText: { color: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { color: '#444', fontSize: 16 },
  list: { padding: 20, paddingBottom: 40 },
  card: { backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#1A1A1A' },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF620022', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FF6200', fontSize: 18, fontWeight: 'bold' },
  passengerName: { color: '#FFF', fontSize: 16, fontWeight: '600', marginBottom: 2 },
  passengerEmail: { color: '#555', fontSize: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  detailText: { color: '#555', fontSize: 13 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  actionBtnText: { fontSize: 13, fontWeight: 'bold' },
});

export default AdminRegularPassengers;
