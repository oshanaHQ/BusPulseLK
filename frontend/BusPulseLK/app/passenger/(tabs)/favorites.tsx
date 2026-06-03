// app/passenger/(tabs)/favorites.tsx
import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { favoriteService } from '../../../services/api';
import { getActiveTracking, cancelTrackingNotification, clearActiveTracking } from '../../../services/notificationService';
import { Alert } from 'react-native';

const FavoritesScreen = () => {
  const insets = useSafeAreaInsets();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const data = await favoriteService.getAll();
      setFavorites(data as any[]);
    } catch (error) {} finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (busId: number) => {
    try {
      await favoriteService.toggle(busId);
      setFavorites(prev => prev.filter(item => item.id !== busId));
    } catch (error) {}
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={async () => {
        const active = await getActiveTracking();
        if (active && active.busId !== item.id) {
          Alert.alert(
            "Already Tracking",
            `You are currently tracking ${active.busName}. Do you want to stop tracking it and track this bus instead?`,
            [
              { text: "Cancel", style: "cancel" },
              { 
                text: "Track New Bus", 
                style: "destructive",
                onPress: async () => {
                  await cancelTrackingNotification();
                  await clearActiveTracking();
                  router.push({
                    pathname: '../live-tracking',
                    params: { busId: item.id }
                  });
                }
              }
            ]
          );
        } else {
          router.push({
            pathname: '../live-tracking',
            params: { busId: item.id }
          });
        }
      }}
    >
      <View style={styles.iconBox}>
        <Ionicons name="bus" size={26} color="#FF6200" />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name || item.numberPlate}</Text>
        <Text style={styles.plate}>{item.numberPlate}</Text>
      </View>
      <TouchableOpacity onPress={() => removeFavorite(item.id)} style={styles.removeBtn}>
        <Ionicons name="heart" size={24} color="#FF6200" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>My Favorites</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#FF6200" /></View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="heart-dislike-outline" size={60} color="#222" />
              <Text style={styles.emptyText}>You haven't saved any buses yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: 25 },
  title: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 15, borderRadius: 18, marginBottom: 15 },
  iconBox: { width: 50, height: 50, backgroundColor: '#000', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  info: { flex: 1 },
  name: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
  plate: { color: '#666', fontSize: 13, marginTop: 2 },
  removeBtn: { padding: 5 },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#444', marginTop: 20, fontSize: 16 }
});

export default FavoritesScreen;
