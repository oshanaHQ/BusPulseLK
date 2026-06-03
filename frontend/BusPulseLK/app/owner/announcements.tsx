// app/owner/announcements.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar, Modal,
  TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { announcementService } from '../../services/api';

const typeColors: Record<string, string> = {
  General: '#FF6200',
  Delayed: '#F59E0B',
  Cancelled: '#EF4444',
  Breakdown: '#EF4444',
  TripStarted: '#22C55E',
  NotRunningToday: '#8B5CF6',
};

const OwnerAnnouncementsScreen = () => {
  const insets = useSafeAreaInsets();
  const { busId, busName } = useLocalSearchParams();
  const numBusId = Number(busId);

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [createModal, setCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('General');

  const load = useCallback(async (isRefresh = false) => {
    if (!numBusId) return;
    try {
      if (isRefresh) setRefreshing(true);
      const data: any = await announcementService.getByBus(numBusId);
      setAnnouncements(data);
    } catch {
      setAnnouncements([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [numBusId]);

  useEffect(() => { load(); }, [numBusId]);

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Required', 'Please fill in all fields.');
      return;
    }

    try {
      setSubmitting(true);
      await announcementService.create({
        busId: numBusId,
        title,
        message,
        type,
      });
      Alert.alert('Success', 'Announcement posted successfully.');
      setCreateModal(false);
      setTitle('');
      setMessage('');
      setType('General');
      load();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to post announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Announcement', 'Are you sure you want to delete this announcement?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await announcementService.remove(id);
            Alert.alert('Deleted', 'Announcement removed.');
            load();
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to delete announcement.');
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }: { item: any }) => {
    const color = typeColors[item.type] ?? '#FF6200';
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={[styles.typeBadge, { backgroundColor: color + '22' }]}>
            <Text style={[styles.typeText, { color }]}>{item.type}</Text>
          </View>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>
        
        <View style={styles.cardFooter}>
          <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
          <Text style={styles.postedBy}>By {item.postedBy}</Text>
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
          <Text style={styles.heading}>Bus Announcements</Text>
          <Text style={styles.sub}>{busName ? `For ${busName}` : 'Manage notices for your passengers'}</Text>
        </View>
        <TouchableOpacity onPress={() => setCreateModal(true)} style={styles.addBtn}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6200" />
        </View>
      ) : (
        <FlatList
          data={announcements}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#FF6200" />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="megaphone-outline" size={56} color="#222" />
              <Text style={styles.emptyTitle}>No Announcements</Text>
              <Text style={styles.emptyText}>Tap the + button to post an update to passengers.</Text>
            </View>
          }
        />
      )}

      {/* Creation Modal */}
      <Modal visible={createModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Post Announcement</Text>

            <Text style={styles.label}>Category</Text>
            <View style={styles.typeSelector}>
              {Object.keys(typeColors).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, type === t && { backgroundColor: typeColors[t] + '22', borderColor: typeColors[t] }]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.typeBtnText, { color: type === t ? typeColors[t] : '#666' }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Schedule Change, Delay Alert"
              placeholderTextColor="#666"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Message Details</Text>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Provide clear instructions or details for your passengers..."
              placeholderTextColor="#666"
              multiline
              value={message}
              onChangeText={setMessage}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => { setCreateModal(false); setTitle(''); setMessage(''); setType('General'); }}
                disabled={submitting}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitText}>Publish Notice</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#111', gap: 12 },
  backBtn: { padding: 4 },
  heading: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  sub: { color: '#666', fontSize: 12, marginTop: 2 },
  addBtn: { backgroundColor: '#FF6200', padding: 8, borderRadius: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 60 },
  card: { backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeText: { fontSize: 11, fontWeight: 'bold' },
  deleteBtn: { backgroundColor: '#FF000011', padding: 6, borderRadius: 8 },
  title: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  message: { color: '#AAA', fontSize: 14, lineHeight: 20, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#222', paddingTop: 8 },
  date: { color: '#444', fontSize: 11 },
  postedBy: { color: '#555', fontSize: 11, fontStyle: 'italic' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { color: '#333', fontSize: 18, fontWeight: 'bold' },
  emptyText: { color: '#444', fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  label: { color: '#666', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6, marginTop: 10 },
  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  typeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#222', backgroundColor: '#000' },
  typeBtnText: { fontSize: 12, fontWeight: 'bold' },
  input: { backgroundColor: '#000', color: '#FFF', borderRadius: 12, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#222', marginBottom: 10 },
  modalActions: { flexDirection: 'row', gap: 15, marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: 'bold' },
  submitBtn: { flex: 2, backgroundColor: '#FF6200', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  submitText: { color: '#FFF', fontWeight: 'bold' },
});

export default OwnerAnnouncementsScreen;
