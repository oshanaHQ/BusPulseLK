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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { busService } from '../../services/api';
import RatingsModal from '../../components/RatingsModal';

interface Bus {
  id: number;
  numberPlate: string;
  name?: string;
  busType: string;
  isActive: boolean;
  driver?: { fullName: string };
}

const BusOwnerDashboard = () => {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Ratings Modal state
  const [ratingsModalVisible, setRatingsModalVisible] = useState(false);
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  const [selectedBusName, setSelectedBusName] = useState<string>('');

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      const data = await busService.getMine();
      setBuses(data as Bus[]);
    } catch (error: any) {
      console.error('Fetch buses error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBuses();
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <RatingsModal
        visible={ratingsModalVisible}
        onClose={() => setRatingsModalVisible(false)}
        busId={selectedBusId || 0}
        busName={selectedBusName}
      />
      <StatusBar backgroundColor="#000000" barStyle="light-content" />
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6200" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Owner Dashboard</Text>
            <Text style={styles.subtitle}>Welcome, {user?.fullName ?? 'Owner'}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color="#FF6200" />
          </TouchableOpacity>
        </View>

        {/* Action Grid */}
        <View style={styles.grid}>
          <TouchableOpacity style={styles.card} onPress={() => router.push('./manage-buses')}>
            <Ionicons name="bus-outline" size={36} color="#FF6200" />
            <Text style={styles.cardText}>Manage Buses</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push('./assign-route')}>
            <Ionicons name="location-outline" size={36} color="#FF6200" />
            <Text style={styles.cardText}>Manage Routes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push('./manage-staff')}>
            <Ionicons name="people-outline" size={36} color="#FF6200" />
            <Text style={styles.cardText}>Manage Staff</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push('./request-route')}>
            <Ionicons name="git-branch-outline" size={36} color="#FF6200" />
            <Text style={styles.cardText}>Request Route</Text>
          </TouchableOpacity>
        </View>

        {/* My Buses Section */}
        <View style={styles.busesHeader}>
          <Text style={styles.sectionTitle}>My Buses</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push({ pathname: './manage-buses', params: { openAdd: 'true' } })}
          >
            <Text style={styles.addButtonText}>+ Add Bus</Text>
          </TouchableOpacity>
        </View>

        {/* Bus List */}
        <View style={styles.busList}>
          {loading ? (
            <ActivityIndicator color="#FF6200" style={{ marginTop: 20 }} />
          ) : buses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No buses found. Add your first bus!</Text>
            </View>
          ) : (
            buses.map((bus) => (
              <View key={bus.id} style={styles.busItem}>
                <View style={styles.busInfo}>
                  <Text style={styles.busName}>{bus.numberPlate}</Text>
                  <Text style={styles.busRoute}>{bus.name || 'No Name'}</Text>
                  <Text style={styles.driverText}>Driver: {bus.driver?.fullName || 'Not Assigned'}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={[
                      styles.statusBadge, 
                      { backgroundColor: bus.isActive ? '#2E7D3222' : '#FF620022' }
                    ]}>
                      <Text style={[
                        styles.statusText, 
                        { color: bus.isActive ? '#2E7D32' : '#FF6200' }
                      ]}>
                        {bus.isActive ? 'Active' : 'Pending Approval'}
                      </Text>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.ratingsBadge}
                      onPress={() => {
                        setSelectedBusId(bus.id);
                        setSelectedBusName(bus.name || bus.numberPlate);
                        setRatingsModalVisible(true);
                      }}
                    >
                      <Ionicons name="star" size={12} color="#FF6200" />
                      <Text style={styles.ratingsBadgeText}>Ratings</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.ratingsBadge}
                      onPress={() => router.push({ 
                        pathname: '/owner/announcements' as any, 
                        params: { busId: bus.id, busName: bus.name || bus.numberPlate } 
                      })}
                    >
                      <Ionicons name="megaphone" size={12} color="#FF6200" />
                      <Text style={styles.ratingsBadgeText}>Announce</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity onPress={() => router.push('./manage-buses')}>
                  <Ionicons name="chevron-forward" size={24} color="#333" />
                </TouchableOpacity>
              </View>
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
          onPress={() => router.push('./manage-buses')}
        >
          <Ionicons name="bus-outline" size={26} color="#AAAAAA" />
          <Text style={styles.tabLabel}>Buses</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => router.push('./issue-reports')}
        >
          <Ionicons name="document-text-outline" size={26} color="#AAAAAA" />
          <Text style={styles.tabLabel}>Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/profile' as any)}>
          <Ionicons name="person-outline" size={26} color="#AAAAAA" />
          <Text style={styles.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
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
  busesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#FF6200',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  busList: {
    paddingHorizontal: 20,
  },
  busItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  busInfo: {
    flex: 1,
  },
  busName: {
    color: '#FF6200',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  busRoute: {
    color: '#AAAAAA',
    fontSize: 14,
    marginBottom: 4,
  },
  driverText: {
    color: '#888888',
    fontSize: 14,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  ratingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF620011',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF620033',
  },
  ratingsBadgeText: {
    color: '#FF6200',
    fontSize: 12,
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
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
    padding: 20,
  },
  emptyText: {
    color: '#666666',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default BusOwnerDashboard;