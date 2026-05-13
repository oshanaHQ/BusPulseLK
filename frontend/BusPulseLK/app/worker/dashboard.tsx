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
import { useAuth } from '../../context/AuthContext';

const EmployeeDashboard = () => {
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
              <Text style={styles.title}>Worker Dashboard</Text>
              <Text style={styles.subtitle}>Welcome, {user?.fullName ?? 'Worker'}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={24} color="#FF6200" />
            </TouchableOpacity>
          </View>

          {/* Current Bus Info */}
          <View style={styles.busCard}>
            <Text style={styles.busName}>Express 138</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>On Going</Text>
            </View>
            <View style={styles.routeInfo}>
              <Ionicons name="location-outline" size={20} color="#FF6200" />
              <Text style={styles.routeText}>Colombo → Kandy</Text>
            </View>
          </View>

          {/* Action Buttons Grid */}
          <View style={styles.grid}>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="play-circle-outline" size={40} color="#FF6200" />
              <Text style={styles.actionText}>Start Trip</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="checkmark-circle-outline" size={40} color="#FF6200" />
              <Text style={styles.actionText}>Mark Town Passed</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="chatbox-ellipses-outline" size={40} color="#FF6200" />
              <Text style={styles.actionText}>Post Update</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="people-outline" size={40} color="#FF6200" />
              <Text style={styles.actionText}>Approve Passengers</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Updates */}
          <Text style={styles.sectionTitle}>Quick Updates</Text>
          <View style={styles.quickUpdates}>
            <TouchableOpacity style={[styles.updatePill, styles.delayed]}>
              <Text style={styles.pillText}>Bus Delayed</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.updatePill, styles.cancelled]}>
              <Text style={styles.pillText}>Service Cancelled</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.updatePill, styles.started]}>
              <Text style={styles.pillText}>Bus Trip Started</Text>
            </TouchableOpacity>
          </View>

          {/* Route Progress */}
          <Text style={styles.sectionTitle}>Route Progress</Text>
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineLine} />
              <Text style={styles.timelineTime}>06:30 AM</Text>
              <Text style={styles.timelineLocation}>Colombo</Text>
            </View>

            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineLine} />
              <Text style={styles.timelineTime}>06:50 AM</Text>
              <Text style={styles.timelineLocation}>Kadawatha</Text>
            </View>

            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineLine} />
              <Text style={styles.timelineTime}>07:05 AM</Text>
              <Text style={styles.timelineLocation}>Kiribathgoda</Text>
            </View>

            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.currentDot]} />
              <View style={styles.timelineLine} />
              <Text style={[styles.timelineTime, styles.currentTime]}>Current Location</Text>
              <Text style={[styles.timelineLocation, styles.currentLocation]}>Kegalle</Text>
            </View>

            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineLine} />
              <Text style={styles.timelineTime}>10:45 AM</Text>
              <Text style={styles.timelineLocation}>Mawanella (ETA)</Text>
            </View>

            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineLine} />
              <Text style={styles.timelineTime}>11:10 AM</Text>
              <Text style={styles.timelineLocation}>Ampebussa (ETA)</Text>
            </View>

            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <Text style={styles.timelineTime}>11:45 AM</Text>
              <Text style={styles.timelineLocation}>Kandy (ETA)</Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Tab Bar - Home active */}
        <View style={styles.bottomTab}>
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="home" size={28} color="#FF6200" />
            <Text style={[styles.tabLabel, { color: '#FF6200' }]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="git-network-outline" size={28} color="#AAAAAA" />
            <Text style={styles.tabLabel}>Route</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="chatbox-ellipses-outline" size={28} color="#AAAAAA" />
            <Text style={styles.tabLabel}>Updates</Text>
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
    paddingBottom: 20,
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
  busCard: {
    backgroundColor: '#111111',
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 20,
    marginBottom: 24,
  },
  busName: {
    color: '#FF6200',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: '#2E7D32',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeText: {
    color: '#AAAAAA',
    fontSize: 16,
    marginLeft: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#111111',
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  actionText: {
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
  quickUpdates: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  updatePill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 12,
  },
  delayed: {
    backgroundColor: '#F57C00',
  },
  cancelled: {
    backgroundColor: '#D32F2F',
  },
  started: {
    backgroundColor: '#2E7D32',
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  timeline: {
    paddingHorizontal: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#444444',
    marginTop: 4,
    marginRight: 16,
  },
  currentDot: {
    backgroundColor: '#FF6200',
  },
  timelineLine: {
    position: 'absolute',
    left: 7,
    top: 20,
    bottom: -24,
    width: 2,
    backgroundColor: '#444444',
  },
  timelineTime: {
    color: '#AAAAAA',
    fontSize: 14,
    width: 80,
  },
  currentTime: {
    color: '#FF6200',
    fontWeight: '600',
  },
  timelineLocation: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  currentLocation: {
    color: '#FF6200',
    fontWeight: 'bold',
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

export default EmployeeDashboard;