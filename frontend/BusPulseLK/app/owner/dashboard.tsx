// app/(tabs)/owner/dashboard.tsx   ← place it in your owner tab route
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BusOwnerDashboard = () => {
  return (
    <>
      <StatusBar backgroundColor="#000000" barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Bus Owner Dashboard</Text>
            <TouchableOpacity>
              <Ionicons name="person-circle-outline" size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Action Grid */}
          <View style={styles.grid}>
            <TouchableOpacity style={styles.card}>
              <Ionicons name="bus-outline" size={40} color="#FF6200" />
              <Text style={styles.cardText}>Manage Buses</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card}>
              <Ionicons name="location-outline" size={40} color="#FF6200" />
              <Text style={styles.cardText}>Manage Routes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card}>
              <Ionicons name="people-outline" size={40} color="#FF6200" />
              <Text style={styles.cardText}>Manage Staff</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card}>
              <Ionicons name="document-text-outline" size={40} color="#FF6200" />
              <Text style={styles.cardText}>View Reports</Text>
            </TouchableOpacity>
          </View>

          {/* My Buses Section */}
          <View style={styles.busesHeader}>
            <Text style={styles.sectionTitle}>My Buses</Text>
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addButtonText}>+ Add Bus</Text>
            </TouchableOpacity>
          </View>

          {/* Bus List */}
          <View style={styles.busList}>
            {/* Bus 1 */}
            <View style={styles.busItem}>
              <View style={styles.busInfo}>
                <Text style={styles.busName}>Express 138</Text>
                <Text style={styles.busRoute}>Colombo → Kandy</Text>
                <Text style={styles.driverText}>Driver: Kamal Silva</Text>
                <View style={[styles.statusBadge, { backgroundColor: '#2E7D32' }]}>
                  <Text style={styles.statusText}>Active</Text>
                </View>
              </View>
              <TouchableOpacity>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* Bus 2 */}
            <View style={styles.busItem}>
              <View style={styles.busInfo}>
                <Text style={styles.busName}>Intercity 245</Text>
                <Text style={styles.busRoute}>Colombo → Galle</Text>
                <Text style={styles.driverText}>Driver: Nimal Perera</Text>
                <View style={[styles.statusBadge, { backgroundColor: '#D32F2F' }]}>
                  <Text style={styles.statusText}>Delayed</Text>
                </View>
              </View>
              <TouchableOpacity>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* Bus 3 */}
            <View style={styles.busItem}>
              <View style={styles.busInfo}>
                <Text style={styles.busName}>Super Express 301</Text>
                <Text style={styles.busRoute}>Negombo → Jaffna</Text>
                <Text style={styles.driverText}>Driver: Sunil Fernando</Text>
                <View style={[styles.statusBadge, { backgroundColor: '#2E7D32' }]}>
                  <Text style={styles.statusText}>Active</Text>
                </View>
              </View>
              <TouchableOpacity>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* Bus 4 */}
            <View style={styles.busItem}>
              <View style={styles.busInfo}>
                <Text style={styles.busName}>Express 156</Text>
                <Text style={styles.busRoute}>Colombo → Anuradhapura</Text>
                <Text style={styles.driverText}>Driver: Not Assigned</Text>
                <View style={[styles.statusBadge, { backgroundColor: '#757575' }]}>
                  <Text style={styles.statusText}>Not Running</Text>
                </View>
              </View>
              <TouchableOpacity>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* Bus 5 */}
            <View style={styles.busItem}>
              <View style={styles.busInfo}>
                <Text style={styles.busName}>Local 178</Text>
                <Text style={styles.busRoute}>Colombo → Kurunegala</Text>
                <Text style={styles.driverText}>Driver: Ruwan Jayasekara</Text>
                <View style={[styles.statusBadge, { backgroundColor: '#2E7D32' }]}>
                  <Text style={styles.statusText}>Active</Text>
                </View>
              </View>
              <TouchableOpacity>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
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
            <Ionicons name="bus-outline" size={28} color="#AAAAAA" />
            <Text style={styles.tabLabel}>Buses</Text>
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
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  editText: {
    color: '#FF6200',
    fontSize: 14,
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

export default BusOwnerDashboard;