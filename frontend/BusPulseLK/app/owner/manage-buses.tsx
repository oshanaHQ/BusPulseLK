// app/(tabs)/owner/manage-buses.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const ManageBuses = () => {
  return (
    <SafeAreaView style={styles.container}>
      {/* StatusBar MUST be inside SafeAreaView */}
      <StatusBar backgroundColor="#000000" barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Manage Buses</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Add New Bus Button */}
        <TouchableOpacity style={styles.addNewButton}>
          <Text style={styles.addNewText}>+ Add New Bus</Text>
        </TouchableOpacity>

        {/* Bus List */}
        <View style={styles.busList}>
          {/* Bus 1 */}
          <View style={styles.busItem}>
            <View style={styles.busInfo}>
              <Text style={styles.busName}>Express 138 - Kandy</Text>
              <View style={styles.busDetails}>
                <Ionicons name="location-outline" size={16} color="#AAAAAA" />
                <Text style={styles.busDetailText}>Colombo - Kandy</Text>
              </View>
              <View style={styles.busDetails}>
                <Ionicons name="people-outline" size={16} color="#AAAAAA" />
                <Text style={styles.busDetailText}>Capacity: 52 seats</Text>
              </View>
              <View style={styles.busDetails}>
                <Ionicons name="person-outline" size={16} color="#AAAAAA" />
                <Text style={styles.busDetailText}>Driver: Kamal Silva</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: '#2E7D32' }]}>
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity>
                <Ionicons name="create-outline" size={24} color="#FF6200" />
              </TouchableOpacity>
              <TouchableOpacity style={{ marginLeft: 12 }}>
                <Ionicons name="trash-outline" size={24} color="#D32F2F" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bus 2 */}
          <View style={styles.busItem}>
            <View style={styles.busInfo}>
              <Text style={styles.busName}>Intercity 245</Text>
              <View style={styles.busDetails}>
                <Ionicons name="location-outline" size={16} color="#AAAAAA" />
                <Text style={styles.busDetailText}>Colombo - Galle</Text>
              </View>
              <View style={styles.busDetails}>
                <Ionicons name="people-outline" size={16} color="#AAAAAA" />
                <Text style={styles.busDetailText}>Capacity: 48 seats</Text>
              </View>
              <View style={styles.busDetails}>
                <Ionicons name="person-outline" size={16} color="#AAAAAA" />
                <Text style={styles.busDetailText}>Driver: Nimal Perera</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: '#D32F2F' }]}>
                <Text style={styles.statusText}>Delayed</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity>
                <Ionicons name="create-outline" size={24} color="#FF6200" />
              </TouchableOpacity>
              <TouchableOpacity style={{ marginLeft: 12 }}>
                <Ionicons name="trash-outline" size={24} color="#D32F2F" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bus 3 */}
          <View style={styles.busItem}>
            <View style={styles.busInfo}>
              <Text style={styles.busName}>Super Express 301</Text>
              <View style={styles.busDetails}>
                <Ionicons name="location-outline" size={16} color="#AAAAAA" />
                <Text style={styles.busDetailText}>Negombo - Jaffna</Text>
              </View>
              <View style={styles.busDetails}>
                <Ionicons name="people-outline" size={16} color="#AAAAAA" />
                <Text style={styles.busDetailText}>Capacity: 56 seats</Text>
              </View>
              <View style={styles.busDetails}>
                <Ionicons name="person-outline" size={16} color="#AAAAAA" />
                <Text style={styles.busDetailText}>Driver: Sunil Fernando</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: '#2E7D32' }]}>
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity>
                <Ionicons name="create-outline" size={24} color="#FF6200" />
              </TouchableOpacity>
              <TouchableOpacity style={{ marginLeft: 12 }}>
                <Ionicons name="trash-outline" size={24} color="#D32F2F" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bus 4 */}
          <View style={styles.busItem}>
            <View style={styles.busInfo}>
              <Text style={styles.busName}>Express 156</Text>
              <View style={styles.busDetails}>
                <Ionicons name="location-outline" size={16} color="#AAAAAA" />
                <Text style={styles.busDetailText}>Colombo - Anuradhapura</Text>
              </View>
              <View style={styles.busDetails}>
                <Ionicons name="people-outline" size={16} color="#AAAAAA" />
                <Text style={styles.busDetailText}>Capacity: 50 seats</Text>
              </View>
              <View style={styles.busDetails}>
                <Ionicons name="person-outline" size={16} color="#AAAAAA" />
                <Text style={styles.busDetailText}>Driver: Not Assigned</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: '#757575' }]}>
                <Text style={styles.statusText}>Not Running</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity>
                <Ionicons name="create-outline" size={24} color="#FF6200" />
              </TouchableOpacity>
              <TouchableOpacity style={{ marginLeft: 12 }}>
                <Ionicons name="trash-outline" size={24} color="#D32F2F" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bus 5 */}
          <View style={styles.busItem}>
            <View style={styles.busInfo}>
              <Text style={styles.busName}>Local 178</Text>
              <View style={styles.busDetails}>
                <Ionicons name="location-outline" size={16} color="#AAAAAA" />
                <Text style={styles.busDetailText}>Colombo - Kurunegala</Text>
              </View>
              <View style={styles.busDetails}>
                <Ionicons name="people-outline" size={16} color="#AAAAAA" />
                <Text style={styles.busDetailText}>Capacity: 45 seats</Text>
              </View>
              <View style={styles.busDetails}>
                <Ionicons name="person-outline" size={16} color="#AAAAAA" />
                <Text style={styles.busDetailText}>Driver: Ruwan Jayasekara</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: '#2E7D32' }]}>
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity>
                <Ionicons name="create-outline" size={24} color="#FF6200" />
              </TouchableOpacity>
              <TouchableOpacity style={{ marginLeft: 12 }}>
                <Ionicons name="trash-outline" size={24} color="#D32F2F" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.bottomTab}>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.back()}>
          <Ionicons name="home-outline" size={28} color="#AAAAAA" />
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="bus" size={28} color="#FF6200" />
          <Text style={[styles.tabLabel, { color: '#FF6200' }]}>Buses</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addNewButton: {
    backgroundColor: '#FF6200',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  addNewText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  busList: {
    paddingHorizontal: 20,
  },
  busItem: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  busInfo: {
    marginBottom: 8,
  },
  busName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  busDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  busDetailText: {
    color: '#AAAAAA',
    fontSize: 14,
    marginLeft: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
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

export default ManageBuses;
