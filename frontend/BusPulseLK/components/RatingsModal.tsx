// components/RatingsModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ratingService } from '../services/api';

interface Props {
  visible: boolean;
  onClose: () => void;
  busId: number;
  busName: string;
}

const StarRow = ({ stars }: { stars: number }) => (
  <View style={{ flexDirection: 'row', gap: 2 }}>
    {[1, 2, 3, 4, 5].map(s => (
      <Ionicons key={s} name={s <= stars ? 'star' : 'star-outline'} size={14} color="#FF6200" />
    ))}
  </View>
);

const RatingsModal = ({ visible, onClose, busId, busName }: Props) => {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && busId) {
      setLoading(true);
      ratingService.getByBus(busId)
        .then((res: any) => setData(res))
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    }
  }, [visible, busId]);

  const avg = data?.averageStars ?? 0;
  const total = data?.totalRatings ?? 0;
  const ratings: any[] = data?.ratings ?? [];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
          {/* Handle */}
          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Ratings</Text>
              <Text style={styles.sub}>{busName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color="#FF6200" />
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Average */}
              <View style={styles.avgBox}>
                <Text style={styles.avgNumber}>{avg > 0 ? avg.toFixed(1) : '—'}</Text>
                <View style={{ alignItems: 'center', gap: 6 }}>
                  <StarRow stars={Math.round(avg)} />
                  <Text style={styles.totalText}>{total} {total === 1 ? 'rating' : 'ratings'}</Text>
                </View>
              </View>

              {ratings.length === 0 ? (
                <View style={styles.empty}>
                  <Ionicons name="star-outline" size={40} color="#333" />
                  <Text style={styles.emptyText}>No ratings yet</Text>
                </View>
              ) : (
                ratings.map((r: any) => (
                  <View key={r.id} style={styles.card}>
                    <View style={styles.cardTop}>
                      <StarRow stars={r.stars} />
                      <Text style={styles.date}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    {r.comment ? (
                      <Text style={styles.comment}>{r.comment}</Text>
                    ) : null}
                    <Text style={styles.passenger}>— {r.passengerName}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', padding: 20 },
  handle: { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  sub: { color: '#666', fontSize: 13, marginTop: 2 },
  closeBtn: { backgroundColor: '#222', padding: 8, borderRadius: 10 },
  center: { height: 120, justifyContent: 'center', alignItems: 'center' },
  avgBox: { flexDirection: 'row', alignItems: 'center', gap: 20, backgroundColor: '#1A1A1A', borderRadius: 16, padding: 20, marginBottom: 20 },
  avgNumber: { color: '#FF6200', fontSize: 52, fontWeight: 'bold' },
  totalText: { color: '#666', fontSize: 12 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { color: '#444', fontSize: 14 },
  card: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  date: { color: '#444', fontSize: 11 },
  comment: { color: '#DDD', fontSize: 14, lineHeight: 20, marginBottom: 6 },
  passenger: { color: '#555', fontSize: 12, fontStyle: 'italic' },
});

export default RatingsModal;
