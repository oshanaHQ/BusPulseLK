import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

const HomeScreen = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>BusPulse LK</Text>
          <Text style={styles.subtitle}>Welcome, {user?.fullName ?? 'Passenger'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={26} color="#FF6200" />
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

      {/* Feature Cards Grid */}
      <View style={styles.grid}>
        <TouchableOpacity 
          style={styles.card}
          onPress={() => router.push('./search')}
        >
          <Ionicons name="search" size={40} color="#FF6200" />
          <Text style={styles.cardText}>Search Buses</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Ionicons
            name="shield-checkmark-outline"
            size={40}
            color="#FF6200"
          />
          <Text style={styles.cardText}>Live Bus Status</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card}
          onPress={() => router.push('./favorites')}
        >
          <Ionicons name="heart-outline" size={40} color="#FF6200" />
          <Text style={styles.cardText}>Favorite Buses</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card}
          onPress={() => router.push('./ratings')}
        >
          <Ionicons name="star-outline" size={40} color="#FF6200" />
          <Text style={styles.cardText}>My Ratings</Text>
        </TouchableOpacity>
      </View>

      {/* Favorite Buses Section */}
      <View style={styles.favoritesHeader}>
        <Text style={styles.sectionTitle}>Favorite Buses</Text>
        <TouchableOpacity>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.favoritesScroll}>
        <TouchableOpacity style={styles.busCard}>
          <View style={styles.busInfo}>
            <Text style={styles.busName}>Expresso 138</Text>
            <Text style={styles.busRoute}>Colombo - Kandy</Text>
            <View
              style={[styles.statusBadge, { backgroundColor: '#2E7D32' }]}
            >
              <Text style={styles.statusText}>On Time</Text>
            </View>
          </View>
          <Ionicons name="heart" size={24} color="#FF6200" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.busCard}>
          <View style={styles.busInfo}>
            <Text style={styles.busName}>Intercity 245</Text>
            <Text style={styles.busRoute}>Colombo - Galle</Text>
            <View
              style={[styles.statusBadge, { backgroundColor: '#D32F2F' }]}
            >
              <Text style={styles.statusText}>Delayed</Text>
            </View>
          </View>
          <Ionicons name="heart" size={24} color="#FF6200" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.busCard}>
          <View style={styles.busInfo}>
            <Text style={styles.busName}>Super Express 301</Text>
            <Text style={styles.busRoute}>Negombo - Jaffna</Text>
            <View
              style={[styles.statusBadge, { backgroundColor: '#2E7D32' }]}
            >
              <Text style={styles.statusText}>On Time</Text>
            </View>
          </View>
          <Ionicons name="heart" size={24} color="#FF6200" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.busCard}>
          <View style={styles.busInfo}>
            <Text style={styles.busName}>Express 156</Text>
            <Text style={styles.busRoute}>Colombo - Anuradhapura</Text>
            <View
              style={[styles.statusBadge, { backgroundColor: '#2E7D32' }]}
            >
              <Text style={styles.statusText}>On Time</Text>
            </View>
          </View>
          <Ionicons name="heart" size={24} color="#FF6200" />
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Tab Bar (simulated - in real app use expo-router Tabs) */}
      <View style={styles.bottomTab}>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="home" size={28} color="#FF6200" />
          <Text style={[styles.tabLabel, { color: '#FF6200' }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => router.push('./search')}
        >
          <Ionicons name="search-outline" size={28} color="#AAAAAA" />
          <Text style={styles.tabLabel}>Search</Text>
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
  subtitle: {
    fontSize: 12,
    color: '#AAAAAA',
    marginTop: 2,
  },
  logoutBtn: {
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16, // reduced middle space
  },
  card: {
    width: '48%',
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12, // reduced
  },
  cardText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  favoritesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8, // reduced
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  viewAll: {
    color: '#FF6200',
    fontSize: 14,
    fontWeight: '600',
  },
  favoritesScroll: {
    paddingHorizontal: 20,
  },
  busCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8, // reduced
  },
  busInfo: {
    flex: 1,
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
    marginBottom: 6,
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
});

export default HomeScreen;