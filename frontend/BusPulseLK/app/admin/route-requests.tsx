// app/admin/route-requests.tsx
import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, FlatList, Modal,
  ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { routeRequestService, townService } from '../../services/api';

interface Town { id: number; name: string; }
interface RouteRequest {
  id: number;
  name: string;
  routeNumber: string;
  description?: string;
  status: string;
  statusReason?: string;
  createdAt: string;
  originTown: Town;
  destinationTown: Town;
  requestedByUser: { id: number; fullName: string; email: string; };
  stops: { id: number; stopOrder: number; town: Town; }[];
}

const AdminRouteRequests = () => {
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<RouteRequest[]>([]);
  const [towns, setTowns] = useState<Town[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('Pending');

  // Detail / edit modal
  const [selected, setSelected] = useState<RouteRequest | null>(null);
  const [detailModal, setDetailModal] = useState(false);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStopIds, setEditStopIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  // Town picker for edit
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const filteredTowns = towns.filter(t =>
    t.name.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  // Reject modal
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchAll();
    townService.getAll().then((d: any) => setTowns(d)).catch(() => {});
  }, [activeFilter]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const data = await routeRequestService.getAll(activeFilter) as RouteRequest[];
      setRequests(data);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const openDetail = (req: RouteRequest) => {
    setSelected(req);
    setEditMode(false);
    setEditName(req.name);
    setEditNumber(req.routeNumber);
    setEditDescription(req.description || '');
    setEditStopIds(req.stops.sort((a, b) => a.stopOrder - b.stopOrder).map(s => s.town.id));
    setDetailModal(true);
  };

  const handleAddEditTown = (townId: number) => {
    if (editStopIds.includes(townId)) {
      Alert.alert('Info', 'This city is already in the route.');
      return;
    }
    setEditStopIds([...editStopIds, townId]);
    setShowPicker(false);
    setPickerSearch('');
  };

  const handleSaveEdit = async () => {
    if (!selected) return;
    if (editStopIds.length < 2)
      return Alert.alert('Validation', 'At least 2 stops required.');
    try {
      setSaving(true);
      await routeRequestService.update(selected.id, {
        name: editName.trim(),
        routeNumber: editNumber.trim(),
        description: editDescription.trim() || undefined,
        stopTownIds: editStopIds,
      });
      Alert.alert('Saved', 'Request updated.');
      setEditMode(false);
      fetchAll();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = (req: RouteRequest) => {
    Alert.alert(
      'Approve Route',
      `Approve "${req.name}" and create it as an active route?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve', onPress: async () => {
            try {
              setSaving(true);
              await routeRequestService.approve(req.id);
              setDetailModal(false);
              Alert.alert('Approved!', 'The route has been created successfully.');
              fetchAll();
            } catch (e: any) {
              Alert.alert('Error', e.message);
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const handleReject = async () => {
    if (!selected || !rejectReason.trim())
      return Alert.alert('Validation', 'Please enter a rejection reason.');
    try {
      setSaving(true);
      await routeRequestService.reject(selected.id, rejectReason.trim());
      setRejectModal(false);
      setDetailModal(false);
      setRejectReason('');
      Alert.alert('Rejected', 'The route request has been rejected.');
      fetchAll();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const statusColor = (s: string) => s === 'Approved' ? '#4CAF50' : s === 'Rejected' ? '#D32F2F' : '#FF9800';
  const statusIcon = (s: string): any => s === 'Approved' ? 'checkmark-circle' : s === 'Rejected' ? 'close-circle' : 'time';

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Route Requests</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {['Pending', 'Approved', 'Rejected'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, activeFilter === f && styles.activeFilterBtn]}
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
          <Ionicons name="git-branch-outline" size={64} color="#222" />
          <Text style={styles.emptyText}>No {activeFilter.toLowerCase()} requests.</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => openDetail(item)}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardNumber}>Route #{item.routeNumber}</Text>
                  <Text style={styles.cardOwner}>By: {item.requestedByUser?.fullName}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '22' }]}>
                  <Ionicons name={statusIcon(item.status)} size={14} color={statusColor(item.status)} />
                  <Text style={[styles.statusText, { color: statusColor(item.status) }]}>{item.status}</Text>
                </View>
              </View>
              <View style={styles.stopsRow}>
                {item.stops.sort((a, b) => a.stopOrder - b.stopOrder).map((s, i) => (
                  <React.Fragment key={s.id}>
                    <Text style={styles.stopChip}>{s.town.name}</Text>
                    {i < item.stops.length - 1 && <Ionicons name="chevron-forward" size={10} color="#333" />}
                  </React.Fragment>
                ))}
              </View>
              <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Detail / Edit Modal */}
      <Modal visible={detailModal} animationType="slide" transparent onRequestClose={() => setDetailModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editMode ? 'Edit Request' : 'Route Request'}</Text>
              <TouchableOpacity onPress={() => { setDetailModal(false); setEditMode(false); }}>
                <Ionicons name="close" size={28} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {!editMode ? (
                /* View Mode */
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Submitted By</Text>
                    <Text style={styles.detailValue}>{selected?.requestedByUser?.fullName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Route Name</Text>
                    <Text style={styles.detailValue}>{selected?.name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Route Number</Text>
                    <Text style={styles.detailValue}>{selected?.routeNumber}</Text>
                  </View>
                  {selected?.description ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Description</Text>
                      <Text style={styles.detailValue}>{selected.description}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.detailLabel}>Stops</Text>
                  <View style={styles.stopsBlock}>
                    {selected?.stops.sort((a, b) => a.stopOrder - b.stopOrder).map((s, i) => (
                      <View key={s.id} style={styles.stopLine}>
                        <View style={styles.stopDot} />
                        <Text style={styles.stopLineText}>
                          {s.town.name}
                          {i === 0 ? '  (Origin)' : i === (selected?.stops.length ?? 0) - 1 ? '  (Destination)' : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                  {selected?.statusReason ? (
                    <View style={styles.reasonBox}>
                      <Text style={styles.detailLabel}>Rejection Reason</Text>
                      <Text style={styles.reasonText}>{selected.statusReason}</Text>
                    </View>
                  ) : null}
                </>
              ) : (
                /* Edit Mode */
                <>
                  <Text style={styles.label}>Route Name</Text>
                  <TextInput style={styles.input} value={editName} onChangeText={setEditName}
                    placeholderTextColor="#444" />
                  <Text style={styles.label}>Route Number</Text>
                  <TextInput style={styles.input} value={editNumber} onChangeText={setEditNumber}
                    placeholderTextColor="#444" />
                  <Text style={styles.label}>Description</Text>
                  <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                    value={editDescription} onChangeText={setEditDescription}
                    multiline placeholderTextColor="#444" />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={styles.label}>Stops</Text>
                    <TouchableOpacity style={styles.addCityBtn} onPress={() => setShowPicker(true)}>
                      <Ionicons name="add-circle-outline" size={18} color="#FF6200" />
                      <Text style={styles.addCityText}>Add City</Text>
                    </TouchableOpacity>
                  </View>
                  {editStopIds.map((tid, index) => {
                    const town = towns.find(t => t.id === tid);
                    return (
                      <View key={`${tid}-${index}`} style={styles.stopItem}>
                        <View style={styles.stopBadge}>
                          <Text style={styles.stopBadgeText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.stopName}>{town?.name || 'Unknown'}</Text>
                        <TouchableOpacity onPress={() => {
                          const updated = [...editStopIds];
                          updated.splice(index, 1);
                          setEditStopIds(updated);
                        }}>
                          <Ionicons name="remove-circle-outline" size={22} color="#D32F2F" />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </>
              )}
            </ScrollView>

            {/* Action Buttons — only show for Pending requests */}
            {selected?.status === 'Pending' && (
              <View style={styles.actionRow}>
                {!editMode ? (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#1A1A1A' }]}
                      onPress={() => setEditMode(true)}
                    >
                      <Ionicons name="create-outline" size={18} color="#FF9800" />
                      <Text style={[styles.actionBtnText, { color: '#FF9800' }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#D32F2F22' }]}
                      onPress={() => { setRejectModal(true); }}
                    >
                      <Ionicons name="close-circle-outline" size={18} color="#D32F2F" />
                      <Text style={[styles.actionBtnText, { color: '#D32F2F' }]}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#4CAF5022', flex: 1.2 }]}
                      onPress={() => selected && handleApprove(selected)}
                      disabled={saving}
                    >
                      {saving ? <ActivityIndicator color="#4CAF50" size="small" /> : (
                        <>
                          <Ionicons name="checkmark-circle-outline" size={18} color="#4CAF50" />
                          <Text style={[styles.actionBtnText, { color: '#4CAF50' }]}>Approve</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#1A1A1A' }]}
                      onPress={() => setEditMode(false)}
                    >
                      <Text style={[styles.actionBtnText, { color: '#888' }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#FF620022', flex: 1.2 }]}
                      onPress={handleSaveEdit} disabled={saving}
                    >
                      {saving ? <ActivityIndicator color="#FF6200" size="small" /> : (
                        <>
                          <Ionicons name="save-outline" size={18} color="#FF6200" />
                          <Text style={[styles.actionBtnText, { color: '#FF6200' }]}>Save</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#4CAF5022', flex: 1.2 }]}
                      onPress={async () => {
                        await handleSaveEdit();
                        if (selected) handleApprove({ ...selected, name: editName, routeNumber: editNumber });
                      }}
                      disabled={saving}
                    >
                      <Ionicons name="checkmark-done-outline" size={18} color="#4CAF50" />
                      <Text style={[styles.actionBtnText, { color: '#4CAF50' }]}>Save & Approve</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Town Picker inside detail modal */}
        <Modal visible={showPicker} transparent animationType="fade">
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContent}>
              <Text style={styles.pickerTitle}>Select City</Text>
              <View style={styles.pickerSearchBox}>
                <Ionicons name="search" size={18} color="#555" />
                <TextInput style={styles.pickerSearchInput} placeholder="Filter..."
                  placeholderTextColor="#555" value={pickerSearch}
                  onChangeText={setPickerSearch} autoFocus />
              </View>
              <FlatList
                data={filteredTowns}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.pickerItem} onPress={() => handleAddEditTown(item.id)}>
                    <Text style={styles.pickerItemText}>{item.name}</Text>
                    <Ionicons name="add-circle-outline" size={20} color="#FF6200" />
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#1A1A1A' }} />}
              />
              <TouchableOpacity style={styles.cancelPickerBtn}
                onPress={() => { setShowPicker(false); setPickerSearch(''); }}>
                <Text style={styles.cancelPickerText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal visible={rejectModal} transparent animationType="fade">
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerContent, { maxHeight: undefined }]}>
            <Text style={styles.pickerTitle}>Reject Request</Text>
            <Text style={{ color: '#888', marginBottom: 12 }}>Please provide a reason for rejection:</Text>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="e.g. Route number already exists"
              placeholderTextColor="#444"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[styles.actionBtn, { flex: 1, backgroundColor: '#1A1A1A' }]}
                onPress={() => { setRejectModal(false); setRejectReason(''); }}
              >
                <Text style={[styles.actionBtnText, { color: '#888' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { flex: 1.5, backgroundColor: '#D32F2F22' }]}
                onPress={handleReject} disabled={saving}
              >
                {saving ? <ActivityIndicator color="#D32F2F" size="small" /> : (
                  <Text style={[styles.actionBtnText, { color: '#D32F2F' }]}>Confirm Reject</Text>
                )}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { color: '#444', fontSize: 16 },
  filterRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, gap: 8 },
  filterBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10, backgroundColor: '#111', borderWidth: 1, borderColor: '#222' },
  activeFilterBtn: { backgroundColor: '#FF6200', borderColor: '#FF6200' },
  filterText: { color: '#666', fontSize: 13, fontWeight: '600' },
  activeFilterText: { color: '#FFF' },
  listContent: { padding: 20, paddingBottom: 40 },
  card: { backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#1A1A1A' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  cardName: { color: '#FFF', fontSize: 17, fontWeight: 'bold', marginBottom: 2 },
  cardNumber: { color: '#FF6200', fontSize: 12, fontWeight: '600' },
  cardOwner: { color: '#666', fontSize: 12, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  stopsRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginBottom: 6 },
  stopChip: { color: '#666', fontSize: 11 },
  cardDate: { color: '#333', fontSize: 11 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0D0D0D', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '90%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  modalBody: { flex: 1 },
  detailRow: { marginBottom: 14 },
  detailLabel: { color: '#666', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  detailValue: { color: '#FFF', fontSize: 16 },
  stopsBlock: { marginBottom: 16 },
  stopLine: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  stopDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF6200', marginRight: 12 },
  stopLineText: { color: '#DDD', fontSize: 15 },
  reasonBox: { backgroundColor: '#0A0A0A', borderRadius: 10, padding: 12, marginTop: 8 },
  reasonText: { color: '#AAA', fontSize: 14, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#1A1A1A' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 12 },
  actionBtnText: { fontSize: 13, fontWeight: 'bold' },
  // Edit form
  label: { color: '#AAA', fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#111', borderRadius: 12, padding: 12, color: '#FFF', fontSize: 15, marginBottom: 16, borderWidth: 1, borderColor: '#222' },
  addCityBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addCityText: { color: '#FF6200', fontSize: 13, fontWeight: '600' },
  stopItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 10, padding: 12, marginBottom: 8, gap: 10 },
  stopBadge: { backgroundColor: '#FF6200', width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  stopBadgeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  stopName: { flex: 1, color: '#FFF', fontSize: 15 },
  // Picker
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 24 },
  pickerContent: { backgroundColor: '#111', borderRadius: 20, padding: 20, maxHeight: '70%', borderWidth: 1, borderColor: '#222' },
  pickerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 14 },
  pickerSearchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', borderRadius: 10, paddingHorizontal: 12, height: 42, marginBottom: 12, borderWidth: 1, borderColor: '#222' },
  pickerSearchInput: { flex: 1, color: '#FFF', fontSize: 14, marginLeft: 8 },
  pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  pickerItemText: { color: '#FFF', fontSize: 16 },
  cancelPickerBtn: { marginTop: 14, paddingVertical: 12, alignItems: 'center' },
  cancelPickerText: { color: '#666', fontSize: 15 },
});

export default AdminRouteRequests;
