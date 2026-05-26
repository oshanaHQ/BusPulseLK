// app/passenger/(tabs)/announcements.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  RefreshControl, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { announcementService } from '../../../services/api';

const timeAgo = (dateStr: string) => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const typeColors: Record<string, string> = {
  General: '#FF6200',
  Delayed: '#F59E0B',
  Cancelled: '#EF4444',
  Breakdown: '#EF4444',
  TripStarted: '#22C55E',
  NotRunningToday: '#8B5CF6',
};

const AnnouncementsScreen = () => {
  const insets = useSafeAreaInsets();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const data: any = await announcementService.getFeed();
      setAnnouncements(data);
    } catch {
      setAnnouncements([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const renderItem = ({ item }: { item: any }) => {
    const color = typeColors[item.type] ?? '#FF6200';
    return (
      <View style={styles.card}>
        {/* Bus chip */}
        <View style={styles.busBadge}>
          <Ionicons name="bus-outline" size={12} color="#FF6200" />
          <Text style={styles.busName}>{item.bus.name}</Text>
          <Text style={styles.busPlate}>{item.bus.numberPlate}</Text>
        </View>

        {/* Type badge + time */}
        <View style={styles.cardTop}>
          <View style={[styles.typeBadge, { backgroundColor: color + '22' }]}>
            <Text style={[styles.typeText, { color }]}>{item.type}</Text>
          </View>
          <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.postedBy}>Posted by {item.postedBy}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.heading}>Announcements</Text>
        <Text style={styles.sub}>Updates for your favourite buses</Text>
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
              <Text style={styles.emptyText}>Add buses to your favourites to see updates here.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#111' },
  heading: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  sub: { color: '#666', fontSize: 13, marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 12 },
  busBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  busName: { color: '#FF6200', fontWeight: 'bold', fontSize: 13 },
  busPlate: { color: '#444', fontSize: 11 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeText: { fontSize: 11, fontWeight: 'bold' },
  time: { color: '#444', fontSize: 11 },
  title: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  message: { color: '#AAA', fontSize: 14, lineHeight: 20, marginBottom: 10 },
  postedBy: { color: '#555', fontSize: 12, fontStyle: 'italic' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { color: '#333', fontSize: 18, fontWeight: 'bold' },
  emptyText: { color: '#444', fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
});

export default AnnouncementsScreen;
