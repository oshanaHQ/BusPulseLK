// app/owner/request-route.tsx
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

const RequestRoute = () => {
  const insets = useSafeAreaInsets();
  const [towns, setTowns] = useState<Town[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [routeNumber, setRouteNumber] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTownIds, setSelectedTownIds] = useState<number[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');

  const filteredTowns = towns.filter(t =>
    t.name.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  useEffect(() => {
    townService.getAll().then((d: any) => setTowns(d)).catch(() => {});
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      setLoadingRequests(true);
      const data = await routeRequestService.getAll() as any[];
      setMyRequests(data);
    } catch (e) {
      console.log('Could not load requests');
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleAddTown = (townId: number) => {
    if (selectedTownIds.includes(townId)) {
      Alert.alert('Info', 'This city is already in the route.');
      return;
    }
    setSelectedTownIds([...selectedTownIds, townId]);
    setShowPicker(false);
    setPickerSearch('');
  };

  const handleRemoveTown = (index: number) => {
    const updated = [...selectedTownIds];
    updated.splice(index, 1);
    setSelectedTownIds(updated);
  };

  const handleSubmit = async () => {
    if (!routeName.trim()) return Alert.alert('Validation', 'Please enter a route name.');
    if (!routeNumber.trim()) return Alert.alert('Validation', 'Please enter a route number.');
    if (selectedTownIds.length < 2)
      return Alert.alert('Validation', 'Add at least 2 cities (origin and destination).');

    const payload = {
      name: routeName.trim(),
      routeNumber: routeNumber.trim(),
      description: description.trim() || undefined,
      originTownId: selectedTownIds[0],
      destinationTownId: selectedTownIds[selectedTownIds.length - 1],
      stopTownIds: selectedTownIds,
    };

    try {
      setSubmitting(true);
      await routeRequestService.create(payload);
      Alert.alert('Submitted!', 'Your route request has been sent to the admin for review.', [
        {
          text: 'OK', onPress: () => {
            setRouteName(''); setRouteNumber(''); setDescription('');
            setSelectedTownIds([]);
            setActiveTab('history');
            fetchMyRequests();
          }
        }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = (s: string) => s === 'Approved' ? '#4CAF50' : s === 'Rejected' ? '#D32F2F' : '#FF9800';
  const statusIcon = (s: string): any => s === 'Approved' ? 'checkmark-circle' : s === 'Rejected' ? 'close-circle' : 'time';

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Route Requests</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'new' && styles.activeTab]}
          onPress={() => setActiveTab('new')}
        >
          <Text style={[styles.tabText, activeTab === 'new' && styles.activeTabText]}>New Request</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => { setActiveTab('history'); fetchMyRequests(); }}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>My Requests</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'new' ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={20} color="#FF9800" />
            <Text style={styles.infoText}>
              Submit a new route request. An admin will review and approve or reject it.
            </Text>
          </View>

          <Text style={styles.label}>Route Name *</Text>
          <TextInput style={styles.input} placeholder="e.g. Colombo - Kandy Express"
            placeholderTextColor="#444" value={routeName} onChangeText={setRouteName} />

          <Text style={styles.label}>Route Number *</Text>
          <TextInput style={styles.input} placeholder="e.g. 400 or 400/1"
            placeholderTextColor="#444" value={routeNumber} onChangeText={setRouteNumber} />

          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput style={[styles.input, styles.textArea]}
            placeholder="Notes about this route..." placeholderTextColor="#444"
            value={description} onChangeText={setDescription} multiline numberOfLines={3} />

          <View style={styles.stopsHeader}>
            <Text style={styles.label}>Cities / Stops (In Order) *</Text>
            <TouchableOpacity style={styles.addCityBtn} onPress={() => setShowPicker(true)}>
              <Ionicons name="add-circle-outline" size={20} color="#FF6200" />
              <Text style={styles.addCityText}>Add City</Text>
            </TouchableOpacity>
          </View>

          {selectedTownIds.length === 0 ? (
            <Text style={styles.helperText}>Add at least 2 cities (origin → destination).</Text>
          ) : (
            selectedTownIds.map((tid, index) => {
              const town = towns.find(t => t.id === tid);
              return (
                <View key={`${tid}-${index}`} style={styles.stopItem}>
                  <View style={styles.stopBadge}>
                    <Text style={styles.stopBadgeText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stopName}>{town?.name || 'Unknown'}</Text>
                  {index === 0 && <Text style={styles.stopRole}>ORIGIN</Text>}
                  {index === selectedTownIds.length - 1 && selectedTownIds.length > 1 && (
                    <Text style={[styles.stopRole, { color: '#4CAF50' }]}>DEST</Text>
                  )}
                  <TouchableOpacity onPress={() => handleRemoveTown(index)}>
                    <Ionicons name="remove-circle-outline" size={24} color="#D32F2F" />
                  </TouchableOpacity>
                </View>
              );
            })
          )}

          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
            onPress={handleSubmit} disabled={submitting}
          >
            {submitting ? <ActivityIndicator color="#FFF" /> : (
              <>
                <Ionicons name="paper-plane-outline" size={20} color="#FFF" />
                <Text style={styles.submitBtnText}>Submit Request</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {loadingRequests ? (
            <ActivityIndicator color="#FF6200" style={{ marginTop: 40 }} />
          ) : myRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="git-branch-outline" size={64} color="#222" />
              <Text style={styles.emptyText}>No requests yet.</Text>
            </View>
          ) : (
            myRequests.map((req: any) => (
              <View key={req.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.requestName}>{req.name}</Text>
                    <Text style={styles.requestNumber}>Route #{req.routeNumber}</Text>
                    <Text style={styles.requestRoute}>
                      {req.originTown?.name} → {req.destinationTown?.name}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor(req.status) + '22' }]}>
                    <Ionicons name={statusIcon(req.status)} size={14} color={statusColor(req.status)} />
                    <Text style={[styles.statusText, { color: statusColor(req.status) }]}>{req.status}</Text>
                  </View>
                </View>
                {req.statusReason ? (
                  <View style={styles.reasonBox}>
                    <Text style={styles.reasonLabel}>Reason:</Text>
                    <Text style={styles.reasonText}>{req.statusReason}</Text>
                  </View>
                ) : null}
                <View style={styles.stopsRow}>
                  {req.stops?.map((s: any, i: number) => (
                    <React.Fragment key={s.id}>
                      <Text style={styles.stopChip}>{s.town?.name}</Text>
                      {i < req.stops.length - 1 && <Ionicons name="chevron-forward" size={10} color="#444" />}
                    </React.Fragment>
                  ))}
                </View>
                <Text style={styles.requestDate}>
                  Submitted: {new Date(req.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <Modal visible={showPicker} transparent animationType="fade">
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Select City</Text>
            <View style={styles.pickerSearchBox}>
              <Ionicons name="search" size={18} color="#555" />
              <TextInput style={styles.pickerSearchInput} placeholder="Filter cities..."
                placeholderTextColor="#555" value={pickerSearch}
                onChangeText={setPickerSearch} autoFocus />
            </View>
            <FlatList
              data={filteredTowns}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.pickerItem} onPress={() => handleAddTown(item.id)}>
                  <Text style={styles.pickerItemText}>{item.name}</Text>
                  <Ionicons name="add-circle-outline" size={20} color="#FF6200" />
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#1A1A1A' }} />}
              ListEmptyComponent={<Text style={{ color: '#444', textAlign: 'center', marginTop: 20 }}>No cities found</Text>}
            />
            <TouchableOpacity style={styles.cancelPickerBtn}
              onPress={() => { setShowPicker(false); setPickerSearch(''); }}>
              <Text style={styles.cancelPickerText}>Cancel</Text>
            </TouchableOpacity>
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
  tabBar: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: '#111', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#FF6200' },
  tabText: { color: '#666', fontSize: 14, fontWeight: '600' },
  activeTabText: { color: '#FFF' },
  content: { padding: 20, paddingBottom: 60 },
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#FF980018', borderRadius: 12, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: '#FF980033' },
  infoText: { color: '#FF9800', fontSize: 13, flex: 1, lineHeight: 20 },
  label: { color: '#AAA', fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#111', borderRadius: 12, padding: 14, color: '#FFF', fontSize: 15, marginBottom: 20, borderWidth: 1, borderColor: '#222' },
  textArea: { height: 90, textAlignVertical: 'top' },
  stopsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addCityBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addCityText: { color: '#FF6200', fontSize: 14, fontWeight: '600' },
  helperText: { color: '#444', fontSize: 14, textAlign: 'center', marginVertical: 20 },
  stopItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 12, padding: 14, marginBottom: 10, gap: 10, borderWidth: 1, borderColor: '#1A1A1A' },
  stopBadge: { backgroundColor: '#FF6200', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  stopBadgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  stopName: { flex: 1, color: '#FFF', fontSize: 16, fontWeight: '500' },
  stopRole: { color: '#FF9800', fontSize: 10, fontWeight: 'bold' },
  submitBtn: { flexDirection: 'row', backgroundColor: '#FF6200', borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: 24, gap: 8 },
  submitBtnText: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
  requestCard: { backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1A1A1A' },
  requestHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  requestName: { color: '#FFF', fontSize: 17, fontWeight: 'bold', marginBottom: 2 },
  requestNumber: { color: '#FF6200', fontSize: 12, fontWeight: '600' },
  requestRoute: { color: '#888', fontSize: 13, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  reasonBox: { backgroundColor: '#0A0A0A', borderRadius: 8, padding: 10, marginBottom: 10 },
  reasonLabel: { color: '#666', fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  reasonText: { color: '#AAA', fontSize: 13 },
  stopsRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginBottom: 8 },
  stopChip: { color: '#888', fontSize: 11 },
  requestDate: { color: '#444', fontSize: 11, marginTop: 4 },
  emptyState: { alignItems: 'center', marginTop: 80, gap: 8 },
  emptyText: { color: '#444', fontSize: 16, fontWeight: '600' },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 24 },
  pickerContent: { backgroundColor: '#111', borderRadius: 20, padding: 20, maxHeight: '70%', borderWidth: 1, borderColor: '#222' },
  pickerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 14 },
  pickerSearchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', borderRadius: 10, paddingHorizontal: 12, height: 42, marginBottom: 12, borderWidth: 1, borderColor: '#222' },
  pickerSearchInput: { flex: 1, color: '#FFF', fontSize: 14, marginLeft: 8 },
  pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  pickerItemText: { color: '#FFF', fontSize: 16 },
  cancelPickerBtn: { marginTop: 14, paddingVertical: 12, alignItems: 'center' },
  cancelPickerText: { color: '#666', fontSize: 15 },
});

export default RequestRoute;
