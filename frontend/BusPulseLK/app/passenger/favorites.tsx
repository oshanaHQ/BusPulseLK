// app/(tabs)/favorites.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const FavoritesScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>Favorites</Text>
        <TouchableOpacity style={styles.profileIcon}>
          <Ionicons name="person-circle-outline" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Favorites List */}
      <ScrollView style={styles.favoritesList}>
        <View style={styles.favoriteCard}>
          <View style={styles.favoriteInfo}>
            <Text style={styles.busName}>Express 138</Text>
            <Text style={styles.busRoute}>Colombo → Kandy</Text>
            <Text style={styles.busTime}>Depart: 08:30 AM</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#2E7D32' }]}>
              <Text style={styles.statusText}>On Time</Text>
            </View>
          </View>
          <Ionicons name="heart" size={24} color="#FF6200" />
        </View>

        <View style={styles.favoriteCard}>
          <View style={styles.favoriteInfo}>
            <Text style={styles.busName}>Intercity 245</Text>
            <Text style={styles.busRoute}>Colombo → Galle</Text>
            <Text style={styles.busTime}>Depart: 09:15 AM</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#D32F2F' }]}>
              <Text style={styles.statusText}>Delayed</Text>
            </View>
          </View>
          <Ionicons name="heart" size={24} color="#FF6200" />
        </View>

        <View style={styles.favoriteCard}>
          <View style={styles.favoriteInfo}>
            <Text style={styles.busName}>Express 139</Text>
            <Text style={styles.busRoute}>Colombo → Kandy</Text>
            <Text style={styles.busTime}>Depart: 10:00 AM</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#2E7D32' }]}>
              <Text style={styles.statusText}>On Time</Text>
            </View>
          </View>
          <Ionicons name="heart" size={24} color="#FF6200" />
        </View>

        <View style={styles.favoriteCard}>
          <View style={styles.favoriteInfo}>
            <Text style={styles.busName}>Super Express 301</Text>
            <Text style={styles.busRoute}>Negombo → Jaffna</Text>
            <Text style={styles.busTime}>Depart: 11:30 AM</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#2E7D32' }]}>
              <Text style={styles.statusText}>On Time</Text>
            </View>
          </View>
          <Ionicons name="heart" size={24} color="#FF6200" />
        </View>

        <View style={styles.favoriteCard}>
          <View style={styles.favoriteInfo}>
            <Text style={styles.busName}>Express 156</Text>
            <Text style={styles.busRoute}>Colombo → Anuradhapura</Text>
            <Text style={styles.busTime}>Depart: 12:45 PM</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#2E7D32' }]}>
              <Text style={styles.statusText}>On Time</Text>
            </View>
          </View>
          <Ionicons name="heart" size={24} color="#FF6200" />
        </View>

        <View style={styles.favoriteCard}>
          <View style={styles.favoriteInfo}>
            <Text style={styles.busName}>Local 178</Text>
            <Text style={styles.busRoute}>Colombo → Kurunegala</Text>
            <Text style={styles.busTime}>Depart: 02:30 PM</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#2E7D32' }]}>
              <Text style={styles.statusText}>On Time</Text>
            </View>
          </View>
          <Ionicons name="heart" size={24} color="#FF6200" />
        </View>
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

        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => router.push('./search')}
        >
          <Ionicons name="search-outline" size={28} color="#AAAAAA" />
          <Text style={styles.tabLabel}>Search</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="heart" size={28} color="#FF6200" />
          <Text style={[styles.tabLabel, { color: '#FF6200' }]}>Favorites</Text>
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
  favoritesList: {
    paddingHorizontal: 20,
  },
  favoriteCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  favoriteInfo: {
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
    marginBottom: 4,
  },
  busTime: {
    color: '#AAAAAA',
    fontSize: 14,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
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

export default FavoritesScreen;