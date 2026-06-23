// app/admin/dashboard.tsx
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
import { userService } from '../../services/api';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await userService.getAdminStats();
      setStats((data as any).stats);
      setActivities((data as any).activities);
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor="#000000" barStyle="light-content" />
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6200" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Admin Dashboard</Text>
            <Text style={styles.subtitle}>Welcome, {user?.fullName ?? 'Admin'}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color="#FF6200" />
          </TouchableOpacity>
        </View>

        {/* Main Action Grid */}
        <View style={styles.grid}>
          <TouchableOpacity style={styles.card} onPress={() => router.push('./manage-routes')}>
            <Ionicons name="location-outline" size={36} color="#FF6200" />
            <Text style={styles.cardText}>Manage Routes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push('./route-requests')}>
            <Ionicons name="git-branch-outline" size={36} color="#FF6200" />
            <Text style={styles.cardText}>Route Requests</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push('./regular-passengers')}>
            <Ionicons name="people-circle-outline" size={36} color="#FF6200" />
            <Text style={styles.cardText}>Regular Passengers</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push('./bus-approvals')}>
            <Ionicons name="checkmark-circle-outline" size={36} color="#FF6200" />
            <Text style={styles.cardText}>Bus Approvals</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push('./manage-towns')}>
            <Ionicons name="map-outline" size={36} color="#FF6200" />
            <Text style={styles.cardText}>Manage Cities</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push('./bus-ratings')}>
            <Ionicons name="star-outline" size={36} color="#FF6200" />
            <Text style={styles.cardText}>Bus Ratings</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Statistics */}
        <Text style={styles.sectionTitle}>Quick Statistics</Text>
        {loading ? (
          <ActivityIndicator color="#FF6200" style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats?.totalBuses ?? 0}</Text>
              <Text style={styles.statLabel}>Total Buses</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats?.totalPassengers ?? 0}</Text>
              <Text style={styles.statLabel}>Total Passengers</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats?.pendingApprovals ?? 0}</Text>
              <Text style={styles.statLabel}>Pending Approvals</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats?.activeRoutes ?? 0}</Text>
              <Text style={styles.statLabel}>Active Routes</Text>
            </View>
          </View>
        )}

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {loading ? (
          <ActivityIndicator color="#FF6200" style={{ marginVertical: 20 }} />
        ) : activities.length === 0 ? (
          <Text style={{ color: '#AAAAAA', marginLeft: 20, marginBottom: 20 }}>No recent activity found.</Text>
        ) : (
          <View style={styles.activityContainer}>
            {activities.map((activity, idx) => (
              <View key={idx} style={styles.activityItem}>
                <Ionicons name={activity.icon} size={24} color="#FF6200" style={styles.activityIcon} />
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>{activity.text}</Text>
                  <Text style={styles.activityTime}>{new Date(activity.time).toLocaleDateString()}</Text>
                </View>
                {activity.type === 'NewOwner' && (
                  <View style={styles.newBadge}>
                    <Text style={styles.badgeText}>New</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={[styles.bottomTab, { height: 60 + insets.bottom, paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="home" size={26} color="#FF6200" />
          <Text style={[styles.tabLabel, { color: '#FF6200' }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => router.push('./manage-routes')}
        >
          <Ionicons name="git-network-outline" size={26} color="#AAAAAA" />
          <Text style={styles.tabLabel}>Routes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
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
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  statNumber: {
    color: '#FF6200',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statLabel: {
    color: '#AAAAAA',
    fontSize: 14,
    textAlign: 'center',
  },
  activityContainer: {
    paddingHorizontal: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  activityIcon: {
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityTime: {
    color: '#888888',
    fontSize: 13,
  },
  newBadge: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgentBadge: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
});

export default AdminDashboard;