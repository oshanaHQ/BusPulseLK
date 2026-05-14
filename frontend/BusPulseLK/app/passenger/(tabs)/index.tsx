// app/passenger/(tabs)/index.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { favoriteService } from '../../../services/api';

const PassengerDashboard = () => {
  const { user, logout } = useAuth();
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

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const renderFavoriteItem = (item: any) => (
    <TouchableOpacity 
      key={item.id}
      style={styles.favCard}
      onPress={() => router.push({
        pathname: '/passenger/live-tracking',
        params: { busId: item.id }
      })}
    >
      <View style={styles.favIconBox}>
        <Ionicons name="bus" size={24} color="#FF6200" />
      </View>
      <View style={styles.favInfo}>
        <Text style={styles.favName}>{item.name || item.numberPlate}</Text>
        <Text style={styles.favPlate}>{item.numberPlate}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#333" />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Premium Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Day,</Text>
          <Text style={styles.userName}>{user?.fullName ?? 'Passenger'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Search Action */}
        <TouchableOpacity 
          style={styles.searchHero}
          onPress={() => router.push('/passenger/search')}
        >
          <View style={styles.searchHeroInfo}>
            <Text style={styles.searchHeroTitle}>Where are you going?</Text>
            <Text style={styles.searchHeroSub}>Search by name, destination, or route #</Text>
          </View>
          <View style={styles.searchHeroIcon}>
            <Ionicons name="search" size={28} color="#FFF" />
          </View>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/passenger/search')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FF620022' }]}>
              <Ionicons name="location" size={24} color="#FF6200" />
            </View>
            <Text style={styles.actionLabel}>By Destination</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/passenger/favorites')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FF620022' }]}>
              <Ionicons name="heart" size={24} color="#FF6200" />
            </View>
            <Text style={styles.actionLabel}>Favorites</Text>
          </TouchableOpacity>
        </View>

        {/* Live Tracking Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Live Tracking</Text>
          <TouchableOpacity onPress={() => router.push('/passenger/search')}>
            <Text style={styles.viewAll}>Find Bus</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.liveHero}
          onPress={() => {
            if (favorites.length > 0) {
              router.push({
                pathname: '/passenger/live-tracking',
                params: { busId: favorites[0].id }
              });
            } else {
              router.push('/passenger/search');
            }
          }}
        >
          <View style={styles.liveHeroContent}>
            <View style={styles.liveBadge}><Text style={styles.liveText}>LIVE</Text></View>
            <Text style={styles.liveHeroTitle}>Track Your Bus</Text>
            <Text style={styles.liveHeroSub}>View real-time location and estimated arrivals</Text>
          </View>
          <Ionicons name="map" size={40} color="#FF620033" style={styles.liveMapIcon} />
        </TouchableOpacity>

        {/* Favorites List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Favorites</Text>
          <TouchableOpacity onPress={() => router.push('/passenger/favorites')}>
            <Text style={styles.viewAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {favorites.length === 0 ? (
          <View style={styles.emptyFav}>
            <Text style={styles.emptyFavText}>No favorite buses yet.</Text>
          </View>
        ) : (
          favorites.slice(0, 3).map((item) => renderFavoriteItem(item))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25 },
  greeting: { color: '#666', fontSize: 14 },
  userName: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  logoutBtn: { backgroundColor: '#111', padding: 10, borderRadius: 12 },
  scrollContent: { paddingBottom: 30 },
  searchHero: { backgroundColor: '#FF6200', margin: 20, borderRadius: 20, padding: 25, flexDirection: 'row', alignItems: 'center' },
  searchHeroInfo: { flex: 1 },
  searchHeroTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  searchHeroSub: { color: '#FFD7B0', fontSize: 13, marginTop: 4 },
  searchHeroIcon: { backgroundColor: '#00000033', padding: 12, borderRadius: 15 },
  quickActions: { flexDirection: 'row', paddingHorizontal: 20, gap: 15, marginBottom: 30 },
  actionCard: { flex: 1, backgroundColor: '#111', borderRadius: 16, padding: 15, alignItems: 'center' },
  actionIcon: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  actionLabel: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginBottom: 15 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  viewAll: { color: '#FF6200', fontSize: 14, fontWeight: '600' },
  liveHero: { backgroundColor: '#111', marginHorizontal: 20, borderRadius: 20, padding: 20, marginBottom: 30, overflow: 'hidden' },
  liveHeroContent: { flex: 1, zIndex: 1 },
  liveBadge: { alignSelf: 'flex-start', backgroundColor: '#D32F2F', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginBottom: 10 },
  liveText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  liveHeroTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  liveHeroSub: { color: '#666', fontSize: 13, marginTop: 4 },
  liveMapIcon: { position: 'absolute', right: -10, bottom: -10 },
  favCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', marginHorizontal: 20, padding: 15, borderRadius: 16, marginBottom: 10 },
  favIconBox: { width: 45, height: 45, backgroundColor: '#000', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  favInfo: { flex: 1 },
  favName: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  favPlate: { color: '#444', fontSize: 12, marginTop: 2 },
  emptyFav: { marginHorizontal: 25, padding: 20, backgroundColor: '#080808', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#222', alignItems: 'center' },
  emptyFavText: { color: '#444' }
});

export default PassengerDashboard;
