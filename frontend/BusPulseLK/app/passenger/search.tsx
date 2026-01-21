// app/(tabs)/search.tsx
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const SearchScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header / Search */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>Bus Search</Text>
        <TouchableOpacity style={styles.profileIcon}>
          <Ionicons name="person-circle-outline" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color="#888"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search buses by destination, time, or bus name"
          placeholderTextColor="#666"
        />
      </View>

      {/* Bus List */}
      <ScrollView style={styles.busList}>
        <TouchableOpacity style={styles.busCard}>
          <View style={styles.busInfo}>
            <Text style={styles.busName}>Express 138</Text>
            <Text style={styles.busRoute}>Colombo → Kandy</Text>
            <Text style={styles.busTime}>Depart: 08:30 AM   Arrive: 11:45 AM</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#2E7D32' }]}>
              <Text style={styles.statusText}>On Time</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.busCard}>
          <View style={styles.busInfo}>
            <Text style={styles.busName}>Intercity 245</Text>
            <Text style={styles.busRoute}>Colombo → Galle</Text>
            <Text style={styles.busTime}>Depart: 09:15 AM   Arrive: 12:30 PM</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#D32F2F' }]}>
              <Text style={styles.statusText}>Delayed</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.busCard}>
          <View style={styles.busInfo}>
            <Text style={styles.busName}>Express 139</Text>
            <Text style={styles.busRoute}>Colombo → Kandy</Text>
            <Text style={styles.busTime}>Depart: 10:00 AM   Arrive: 01:15 PM</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#2E7D32' }]}>
              <Text style={styles.statusText}>On Time</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.busCard}>
          <View style={styles.busInfo}>
            <Text style={styles.busName}>Super Express 301</Text>
            <Text style={styles.busRoute}>Colombo → Jaffna</Text>
            <Text style={styles.busTime}>Depart: 11:30 AM   Arrive: 02:30 PM</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#2E7D32' }]}>
              <Text style={styles.statusText}>On Time</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.busCard}>
          <View style={styles.busInfo}>
            <Text style={styles.busName}>Local 156</Text>
            <Text style={styles.busRoute}>Colombo → Kandy</Text>
            <Text style={styles.busTime}>Depart: 12:45 PM   Arrive: 04:00 PM</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#2E7D32' }]}>
              <Text style={styles.statusText}>On Time</Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.bottomTab}>
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => router.push('./dashboard')}
        >
          <Ionicons name="home-outline" size={28} color="#AAAAAA" />
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="search" size={28} color="#FF6200" />
          <Text style={[styles.tabLabel, { color: '#FF6200' }]}>Search</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => router.push('./favorites')}
        >
          <Ionicons name="heart-outline" size={28} color="#AAAAAA" />
          <Text style={styles.tabLabel}>Favorite</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6200',
  },
  profileIcon: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  busList: {
    paddingHorizontal: 20,
  },
  busCard: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  busName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  busRoute: {
    color: '#AAAAAA',
    fontSize: 14,
    marginBottom: 4,
  },
  busTime: {
    color: '#AAAAAA',
    fontSize: 14,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomTab: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#222222',
    paddingVertical: 8,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
  },
  tabLabel: {
    color: '#AAAAAA',
    fontSize: 12,
    marginTop: 4,
  },
  // ────────────────────────────────────────────────
  // ONLY THIS WAS ADDED — fixes the TypeScript error
  busInfo: {
    flex: 1,
  },
  // ────────────────────────────────────────────────
});

export default SearchScreen;