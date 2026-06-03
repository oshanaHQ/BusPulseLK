// app/admin/bus-ratings.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { busService } from '../../services/api';
import RatingsModal from '../../components/RatingsModal';

const AdminBusRatingsScreen = () => {
  const insets = useSafeAreaInsets();
  const [buses, setBuses] = useState<any[]>([]);
  const [filteredBuses, setFilteredBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // RatingsModal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  const [selectedBusName, setSelectedBusName] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const data: any = await busService.getAll();
      setBuses(data);
      setFilteredBuses(data);
    } catch {
      setBuses([]);
      setFilteredBuses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredBuses(buses);
    } else {
      const q = search.toLowerCase();
      setFilteredBuses(
        buses.filter(
          b =>
            b.numberPlate.toLowerCase().includes(q) ||
            (b.name && b.name.toLowerCase().includes(q))
        )
      );
    }
  }, [search, buses]);

  const renderItem = ({ item }: { item: any }) => {
    const displayRating = typeof item.averageRating === 'number' 
      ? item.averageRating.toFixed(1) 
      : 'N/A';
      
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          setSelectedBusId(item.id);
          setSelectedBusName(item.name || item.numberPlate);
          setModalVisible(true);
        }}
      >
        <View style={styles.cardInfo}>
          <Text style={styles.plate}>{item.numberPlate}</Text>
          <Text style={styles.name}>{item.name || 'No Custom Name'}</Text>
          <View style={styles.metaRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.busType}</Text>
            </View>
            {item.driver && (
              <Text style={styles.staffText}>Driver: {item.driver.fullName}</Text>
            )}
          </View>
        </View>

        <View style={styles.ratingSection}>
          <View style={styles.starRow}>
            <Ionicons name="star" size={16} color="#FF6200" />
            <Text style={styles.ratingText}>{displayRating}</Text>
          </View>
          <Text style={styles.clickToView}>View Reviews</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <RatingsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        busId={selectedBusId || 0}
        busName={selectedBusName}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>Bus Ratings & Reviews</Text>
          <Text style={styles.sub}>Monitor and audit passenger satisfaction levels</Text>
        </View>
      </View>

      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by license plate or name..."
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6200" />
        </View>
      ) : (
        <FlatList
          data={filteredBuses}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#FF6200" />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="star-outline" size={56} color="#222" />
              <Text style={styles.emptyTitle}>No Buses Found</Text>
              <Text style={styles.emptyText}>No registered buses matching search query.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#111', gap: 12 },
  backBtn: { padding: 4 },
  heading: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  sub: { color: '#666', fontSize: 12, marginTop: 2 },
  searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', margin: 16, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#222', gap: 8 },
  searchIcon: { padding: 4 },
  searchInput: { flex: 1, color: '#FFF', paddingVertical: 10, fontSize: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 60 },
  card: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 12, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#222' },
  cardInfo: { flex: 1, gap: 4 },
  plate: { color: '#FF6200', fontSize: 18, fontWeight: 'bold' },
  name: { color: '#FFF', fontSize: 14, fontWeight: '500' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  badge: { backgroundColor: '#222', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: '#888', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  staffText: { color: '#666', fontSize: 12 },
  ratingSection: { alignItems: 'flex-end', gap: 4 },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FF620011', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingText: { color: '#FF6200', fontWeight: 'bold', fontSize: 14 },
  clickToView: { color: '#555', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { color: '#333', fontSize: 18, fontWeight: 'bold' },
  emptyText: { color: '#444', fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
});

export default AdminBusRatingsScreen;
