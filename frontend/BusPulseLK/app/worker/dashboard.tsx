// app/worker/dashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { busService } from '../../services/api';

interface Bus {
  id: number;
  numberPlate: string;
  name?: string;
  busType: string;
}

interface TimetableEntry {
  id: number;
  departureTime: string;
  operatingDays: string;
  route: {
    id: number;
    name: string;
    originTown: string;
    destinationTown: string;
  };
}

const StaffDashboard = () => {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [bus, setBus] = useState<Bus | null>(null);
  const [routes, setRoutes] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modeModalVisible, setModeModalVisible] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState<TimetableEntry | null>(null);

  useEffect(() => {
    fetchStaffData();
  }, []);

  const fetchStaffData = async () => {
    try {
      const data = await busService.getMine();
      const buses = data as Bus[];
      
      if (buses.length > 0) {
        setBus(buses[0]);
        // Fetch routes for this bus
        const routeData = await busService.getRoutes(buses[0].id);
        setRoutes(routeData as TimetableEntry[]);
      }
    } catch (error: any) {
      console.error('Staff fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStaffData();
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const promptStartTrip = (timetable: TimetableEntry) => {
    setSelectedTimetable(timetable);
    setModeModalVisible(true);
  };

  const startTrip = (mode: 'Manual' | 'Automatic') => {
    if (!bus || !selectedTimetable) return;
    setModeModalVisible(false);
    router.push({
      pathname: '/worker/trip-view',
      params: { 
        busId: bus.id, 
        timetableId: selectedTimetable.id,
        routeName: selectedTimetable.route.name,
        departureTime: selectedTimetable.departureTime,
        trackingMode: mode
      }
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor="#000000" barStyle="light-content" />
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6200" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{user?.role} Dashboard</Text>
            <Text style={styles.subtitle}>Welcome, {user?.fullName ?? 'Staff'}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color="#FF6200" />
          </TouchableOpacity>
        </View>

        {/* Bus Assignment Card */}
        <View style={styles.content}>
          {!bus && !loading ? (
            <View style={styles.noBusCard}>
              <Ionicons name="alert-circle-outline" size={48} color="#FF6200" />
              <Text style={styles.noBusText}>No Bus Assigned</Text>
              <Text style={styles.noBusSubtext}>Please contact your bus owner to assign you to a vehicle.</Text>
            </View>
          ) : (
            bus && (
              <View style={styles.busHero}>
                <View style={styles.busIconContainer}>
                  <Ionicons name="bus" size={40} color="#FFFFFF" />
                </View>
                <View style={styles.busHeroInfo}>
                  <Text style={styles.heroPlate}>{bus.numberPlate}</Text>
                  <Text style={styles.heroName}>{bus.name || 'Unnamed Bus'}</Text>
                  <View style={styles.heroBadge}>
                    <Text style={styles.heroBadgeText}>{bus.busType}</Text>
                  </View>
                </View>
              </View>
            )
          )}

          {/* Action Grid */}
          <View style={styles.grid}>
            <TouchableOpacity 
              style={styles.card}
              onPress={() => {
                if (routes.length > 0) promptStartTrip(routes[0]);
                else Alert.alert('No Routes', 'No routes assigned to start.');
              }}
            >
              <Ionicons name="play-outline" size={36} color="#FF6200" />
              <Text style={styles.cardText}>Start Trip</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.card}
              onPress={() => router.push({ pathname: '/worker/schedule' as any, params: bus ? { busId: bus.id } : undefined })}
            >
              <Ionicons name="calendar-outline" size={36} color="#FF6200" />
              <Text style={styles.cardText}>Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.card}
              onPress={() => bus && router.push({ pathname: '/worker/announcements' as any, params: { busId: bus.id } })}
            >
              <Ionicons name="megaphone-outline" size={36} color="#FF6200" />
              <Text style={styles.cardText}>Announce</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push('./regular-passengers')}
            >
              <Ionicons name="people-circle-outline" size={36} color="#FF6200" />
              <Text style={styles.cardText}>Regular Passengers</Text>
            </TouchableOpacity>
          </View>

          {/* Assigned Routes Section */}
          <Text style={styles.sectionTitle}>Assigned Routes</Text>
          {loading ? (
            <ActivityIndicator color="#FF6200" style={{ marginTop: 20 }} />
          ) : routes.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No routes assigned to your bus.</Text>
            </View>
          ) : (
            routes.map((route) => (
              <TouchableOpacity 
                key={route.id} 
                style={styles.routeItem}
                onPress={() => promptStartTrip(route)}
              >
                <View style={styles.routeMain}>
                  <Text style={styles.routeTitle}>{route.route.name}</Text>
                  <Text style={styles.routeDetails}>{route.route.originTown} → {route.route.destinationTown}</Text>
                </View>
                <View style={styles.routeSide}>
                  <View style={styles.timeBadge}>
                    <Text style={styles.timeBadgeText}>{route.departureTime}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#FF6200" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={[styles.bottomTab, { height: 60 + insets.bottom, paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="home" size={26} color="#FF6200" />
          <Text style={[styles.tabLabel, { color: '#FF6200' }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => router.push({ pathname: '/worker/schedule' as any, params: bus ? { busId: bus.id } : undefined })}
        >
          <Ionicons name="calendar-outline" size={26} color="#AAAAAA" />
          <Text style={styles.tabLabel}>Schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => bus && router.push({ pathname: '/worker/announcements' as any, params: { busId: bus.id } })}
        >
          <Ionicons name="megaphone-outline" size={26} color="#AAAAAA" />
          <Text style={styles.tabLabel}>Announce</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/profile' as any)}>
          <Ionicons name="person-outline" size={26} color="#AAAAAA" />
          <Text style={styles.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Mode Selection Modal */}
      <Modal visible={modeModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Tracking Mode</Text>
            
            <TouchableOpacity 
              style={[styles.modeCard, { borderColor: '#FF6200' }]}
              onPress={() => startTrip('Automatic')}
            >
              <Ionicons name="location-outline" size={32} color="#FF6200" />
              <View style={styles.modeTextContainer}>
                <Text style={styles.modeTitle}>Automatic (GPS)</Text>
                <Text style={styles.modeDesc}>App will automatically track and share your location using GPS.</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modeCard}
              onPress={() => startTrip('Manual')}
            >
              <Ionicons name="hand-right-outline" size={32} color="#AAA" />
              <View style={styles.modeTextContainer}>
                <Text style={styles.modeTitle}>Manual (Stops)</Text>
                <Text style={styles.modeDesc}>You will manually mark when each town is passed.</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelBtn}
              onPress={() => setModeModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingBottom: 20,
  },
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
  content: {
    paddingHorizontal: 20,
  },
  noBusCard: {
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  noBusText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  noBusSubtext: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  busHero: {
    backgroundColor: '#FF6200',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  busIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  busHeroInfo: {
    flex: 1,
  },
  heroPlate: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  heroName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  heroBadge: {
    backgroundColor: '#000000',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#555',
    fontSize: 15,
  },
  routeItem: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
    alignItems: 'center',
  },
  routeMain: {
    flex: 1,
  },
  routeTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  routeDetails: {
    color: '#666',
    fontSize: 13,
    marginTop: 4,
  },
  routeSide: {
    alignItems: 'flex-end',
  },
  timeBadge: {
    backgroundColor: '#FF620022',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  timeBadgeText: {
    color: '#FF6200',
    fontSize: 13,
    fontWeight: 'bold',
  },
  bottomTab: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#222222',
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
  },
  tabLabel: {
    color: '#AAAAAA',
    fontSize: 11,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
  },
  modeTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  modeTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modeDesc: {
    color: '#888',
    fontSize: 12,
  },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#AAA',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StaffDashboard;
