// app/admin/dashboard.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };
  return (
    <>
      <StatusBar backgroundColor="#000000" barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Admin Dashboard</Text>
              <Text style={styles.subtitle}>Welcome, {user?.fullName ?? 'Admin'}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={24} color="#FF6200" />
            </TouchableOpacity>
          </View>

          {/* Main Action Grid */}
          <View style={styles.grid}>
            <TouchableOpacity 
              style={styles.card}
              onPress={() => router.push('./manage-routes')}
            >
              <Ionicons name="location-outline" size={40} color="#FF6200" />
              <Text style={styles.cardText}>Manage Routes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card}>
              <Ionicons name="people-outline" size={40} color="#FF6200" />
              <Text style={styles.cardText}>Approve Owners</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card}>
              <Ionicons name="document-text-outline" size={40} color="#FF6200" />
              <Text style={styles.cardText}>View Reports</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card}>
              <Ionicons name="stats-chart-outline" size={40} color="#FF6200" />
              <Text style={styles.cardText}>System Statistics</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Statistics */}
          <Text style={styles.sectionTitle}>Quick Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>247</Text>
              <Text style={styles.statLabel}>Total Buses</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>12.5K</Text>
              <Text style={styles.statLabel}>Total Passengers</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>18</Text>
              <Text style={styles.statLabel}>Pending Approvals</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>42</Text>
              <Text style={styles.statLabel}>Active Routes</Text>
            </View>
          </View>

          {/* Recent Activity */}
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityContainer}>
            <View style={styles.activityItem}>
              <Ionicons name="person-add-outline" size={24} color="#FF6200" style={styles.activityIcon} />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>New Owner Registration</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
              <View style={styles.newBadge}>
                <Text style={styles.badgeText}>New</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <Ionicons name="bus-outline" size={24} color="#FF6200" style={styles.activityIcon} />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Bus Added: Express 342</Text>
                <Text style={styles.activityTime}>5 hours ago</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <Ionicons name="alert-circle-outline" size={24} color="#FF6200" style={styles.activityIcon} />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Issue Reported: Route Delay</Text>
                <Text style={styles.activityTime}>8 hours ago</Text>
              </View>
              <View style={styles.urgentBadge}>
                <Text style={styles.badgeText}>Urgent</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <Ionicons name="git-branch-outline" size={24} color="#FF6200" style={styles.activityIcon} />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Route Updated: Colombo-Galle</Text>
                <Text style={styles.activityTime}>1 day ago</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Tab Bar - ONLY Home active */}
        <View style={styles.bottomTab}>
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="home" size={28} color="#FF6200" />
            <Text style={[styles.tabLabel, { color: '#FF6200' }]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.tabItem}
            onPress={() => router.push('./manage-routes')}
          >
            <Ionicons name="git-network-outline" size={28} color="#AAAAAA" />
            <Text style={styles.tabLabel}>Routes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="document-text-outline" size={28} color="#AAAAAA" />
            <Text style={styles.tabLabel}>Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="person-outline" size={28} color="#AAAAAA" />
            <Text style={styles.tabLabel}>Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 13,
    color: '#AAAAAA',
    marginTop: 2,
  },
  logoutBtn: {
    padding: 8,
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
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  cardText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
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
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabItem: {
    alignItems: 'center',
  },
  tabLabel: {
    color: '#AAAAAA',
    fontSize: 12,
    marginTop: 4,
  },
});

export default AdminDashboard;