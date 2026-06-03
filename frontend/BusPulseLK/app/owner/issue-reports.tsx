// app/owner/issue-reports.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar, Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { reportService } from '../../services/api';

const statusColors: Record<string, string> = {
  Pending: '#EF4444',
  Investigating: '#F59E0B',
  Resolved: '#22C55E',
};

const OwnerIssueReportsScreen = () => {
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Status Change Modal State
  const [statusModal, setStatusModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const data: any = await reportService.getMyBusIssues();
      setReports(data);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const handleUpdateStatus = async (status: string) => {
    if (!selectedReport) return;
    try {
      setUpdatingId(selectedReport.id);
      setStatusModal(false);
      await reportService.updateStatus(selectedReport.id, status);
      Alert.alert('Status Updated', `Report is now marked as "${status}".`);
      load();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update report status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const statusColor = statusColors[item.status] ?? '#EF4444';
    const passengerName = item.isAnonymous ? 'Anonymous Passenger' : (item.passengerName || 'Passenger');
    
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.busInfo}>
            <Ionicons name="bus-outline" size={14} color="#FF6200" />
            <Text style={styles.busName}>{item.busNumberPlate}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor }]}
            onPress={() => {
              setSelectedReport(item);
              setStatusModal(true);
            }}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
            <Ionicons name="chevron-down" size={10} color={statusColor} />
          </TouchableOpacity>
        </View>

        <Text style={styles.description}>{item.description}</Text>

        <View style={styles.cardDivider} />

        <View style={styles.cardFooter}>
          <View style={styles.passengerRow}>
            <Ionicons 
              name={item.isAnonymous ? "eye-off-outline" : "person-circle-outline"} 
              size={16} 
              color={item.isAnonymous ? "#666" : "#FFF"} 
            />
            <Text style={[styles.passengerName, item.isAnonymous && styles.anonText]}>{passengerName}</Text>
          </View>
          <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>Issue Reports</Text>
          <Text style={styles.sub}>Feedback & service issues from passengers</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6200" />
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#FF6200" />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={56} color="#222" />
              <Text style={styles.emptyTitle}>No Issues Reported</Text>
              <Text style={styles.emptyText}>All systems operational. No passenger reports received yet.</Text>
            </View>
          }
        />
      )}

      {/* Status Picker Modal */}
      <Modal visible={statusModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Report Status</Text>
            <Text style={styles.modalSub}>Select current status for this issue report:</Text>

            {Object.keys(statusColors).map(s => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.statusOption,
                  selectedReport?.status === s && { backgroundColor: '#1A1A1A', borderColor: statusColors[s] }
                ]}
                onPress={() => handleUpdateStatus(s)}
              >
                <View style={[styles.statusDot, { backgroundColor: statusColors[s] }]} />
                <Text style={styles.statusOptionText}>{s}</Text>
                {selectedReport?.status === s && (
                  <Ionicons name="checkmark" size={18} color="#FF6200" style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setStatusModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#111', gap: 12 },
  backBtn: { padding: 4 },
  heading: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  sub: { color: '#666', fontSize: 12, marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 60 },
  card: { backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  busInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  busName: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  description: { color: '#CCC', fontSize: 14, lineHeight: 22, marginBottom: 12 },
  cardDivider: { height: 1, backgroundColor: '#222', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  passengerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  passengerName: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  anonText: { color: '#555', fontStyle: 'italic' },
  date: { color: '#444', fontSize: 11 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { color: '#333', fontSize: 18, fontWeight: 'bold' },
  emptyText: { color: '#444', fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#111', borderRadius: 20, padding: 25, borderWidth: 1, borderColor: '#222' },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  modalSub: { color: '#666', fontSize: 13, marginBottom: 20 },
  statusOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#222', marginBottom: 10, backgroundColor: '#000', gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusOptionText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  cancelBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  cancelText: { color: '#AAA', fontSize: 15, fontWeight: 'bold' },
});

export default OwnerIssueReportsScreen;
