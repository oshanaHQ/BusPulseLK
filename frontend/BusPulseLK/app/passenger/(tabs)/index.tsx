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
import { favoriteService, regularPassengerService } from '../../../services/api';
import { getActiveTracking, cancelTrackingNotification, clearActiveTracking } from '../../../services/notificationService';

const PassengerDashboard = () => {
  const { user, logout, isGuest } = useAuth();
  const insets = useSafeAreaInsets();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [regularBuses, setRegularBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(!isGuest);

  useEffect(() => {
    if (!isGuest) {
      loadFavorites();
      loadRegularBuses();
    }
  }, [isGuest]);

  const loadFavorites = async () => {
    try {
      const data = await favoriteService.getAll();
      setFavorites(data as any[]);
    } catch (error) {} finally {
      setLoading(false);
    }
  };

  const loadRegularBuses = async () => {
    try {
      const data = await regularPassengerService.getMyStatus();
      setRegularBuses(data as any[]);
    } catch (error) {}
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
                    pathname: '/passenger/live-tracking',
                    params: { busId: item.id }
                  });
                }
              }
            ]
          );
        } else {
          router.push({
            pathname: '/passenger/live-tracking',
            params: { busId: item.id }
          });
        }
      }}
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

      {/* Guest Mode Banner */}
      {isGuest && (
        <View style={styles.guestBanner}>
          <Ionicons name="person-circle-outline" size={18} color="#FF6200" />
          <Text style={styles.guestBannerText}>Guest Mode — limited features</Text>
          <TouchableOpacity onPress={() => logout()} style={styles.guestSignInBtn}>
            <Text style={styles.guestSignInText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Premium Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Passenger Dashboard</Text>
          <Text style={styles.subtitle}>{isGuest ? '🗺️ Exploring as Guest' : `Welcome, ${user?.fullName ?? 'Passenger'}`}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#FF6200" />
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

        {/* Quick Actions Grid */}
        <View style={styles.grid}>
          <TouchableOpacity style={styles.card} onPress={() => router.push('/passenger/search')}>
            <Ionicons name="location-outline" size={36} color="#FF6200" />
            <Text style={styles.cardText}>By Destination</Text>
          </TouchableOpacity>

          {!isGuest && (
            <TouchableOpacity style={styles.card} onPress={() => router.push('/passenger/favorites')}>
              <Ionicons name="heart-outline" size={36} color="#FF6200" />
              <Text style={styles.cardText}>Favorites</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* My Regular Bus — hidden for guests */}
        {!isGuest && regularBuses.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Regular Bus</Text>
            </View>
            {regularBuses.map((rb: any) => (
              <TouchableOpacity
                key={rb.requestId}
                style={styles.regularBusCard}
                onPress={() => router.push({ pathname: '/passenger/regular-bus-trip', params: { busId: rb.busId } })}
              >
                <View style={styles.regularBusIcon}>
                  <Ionicons name="star" size={22} color="#FF6200" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.regularBusName}>{rb.busName || rb.busNumberPlate}</Text>
                  <Text style={styles.regularBusPlate}>{rb.busNumberPlate} • {rb.busType}</Text>
                </View>
                <View style={styles.regularLiveBadge}>
                  <Text style={styles.regularLiveText}>TRACK</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Live Tracking Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Live Tracking</Text>
          <TouchableOpacity onPress={() => router.push('/passenger/search')}>
            <Text style={styles.viewAll}>Find Bus</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.liveHero}
          onPress={async () => {
            if (favorites.length > 0) {
              const targetBusId = favorites[0].id;
              const active = await getActiveTracking();
              if (active && active.busId !== targetBusId) {
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
                          pathname: '/passenger/live-tracking',
                          params: { busId: targetBusId }
                        });
                      }
                    }
                  ]
                );
              } else {
                router.push({
                  pathname: '/passenger/live-tracking',
                  params: { busId: targetBusId }
                });
              }
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
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF620011',
    borderBottomWidth: 1,
    borderBottomColor: '#FF620033',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  guestBannerText: {
    flex: 1,
    color: '#FF6200',
    fontSize: 13,
    fontWeight: '500',
  },
  guestSignInBtn: {
    backgroundColor: '#FF6200',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  guestSignInText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { paddingBottom: 30 },

  searchHero: { backgroundColor: '#FF6200', margin: 20, borderRadius: 20, padding: 25, flexDirection: 'row', alignItems: 'center' },
  searchHeroInfo: { flex: 1 },
  searchHeroTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  searchHeroSub: { color: '#FFD7B0', fontSize: 13, marginTop: 4 },
  searchHeroIcon: { backgroundColor: '#00000033', padding: 12, borderRadius: 15 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#AAAAAA',
    marginTop: 4,
  },
  logoutBtn: {
    backgroundColor: '#111111',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222222',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  card: {
    width: '48%',
    backgroundColor: '#111111',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222222',
  },
  cardText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
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
  emptyFavText: { color: '#444' },
  regularBusCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D0D0D', marginHorizontal: 20, padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#FF620033' },
  regularBusIcon: { width: 44, height: 44, backgroundColor: '#FF620022', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  regularBusName: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  regularBusPlate: { color: '#666', fontSize: 12, marginTop: 2 },
  regularLiveBadge: { backgroundColor: '#FF6200', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  regularLiveText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
});

export default PassengerDashboard;
