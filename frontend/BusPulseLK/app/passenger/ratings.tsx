// app/(tabs)/ratings.tsx
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

const RatingsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>Bus Ratings</Text>
        <TouchableOpacity style={styles.profileIcon}>
          <Ionicons name="person-circle-outline" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Ratings List */}
      <ScrollView style={styles.ratingsList}>
        <View style={styles.ratingCard}>
          <View style={styles.ratingInfo}>
            <Text style={styles.busName}>Express 138</Text>
            <Text style={styles.busRoute}>Colombo → Kandy</Text>
            <View style={styles.stars}>
              <Ionicons name="star" size={18} color="#FF6200" />
              <Ionicons name="star" size={18} color="#FF6200" />
              <Ionicons name="star" size={18} color="#FF6200" />
              <Ionicons name="star" size={18} color="#FF6200" />
              <Ionicons name="star-outline" size={18} color="#FF6200" />
              <Text style={styles.ratingNumber}>4.0</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.rateButton}>
            <Text style={styles.rateText}>Rate Bus</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.ratingCard}>
          <View style={styles.ratingInfo}>
            <Text style={styles.busName}>Intercity 245</Text>
            <Text style={styles.busRoute}>Colombo → Galle</Text>
            <Text style={styles.notRated}>Not Rated</Text>
          </View>
          <TouchableOpacity style={styles.rateButton}>
            <Text style={styles.rateText}>Rate Bus</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.ratingCard}>
          <View style={styles.ratingInfo}>
            <Text style={styles.busName}>Super Express 301</Text>
            <Text style={styles.busRoute}>Negombo → Jaffna</Text>
            <View style={styles.stars}>
              <Ionicons name="star" size={18} color="#FF6200" />
              <Ionicons name="star" size={18} color="#FF6200" />
              <Ionicons name="star" size={18} color="#FF6200" />
              <Ionicons name="star" size={18} color="#FF6200" />
              <Ionicons name="star" size={18} color="#FF6200" />
              <Text style={styles.ratingNumber}>5.0</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.rateButton}>
            <Text style={styles.rateText}>Rate Bus</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.ratingCard}>
          <View style={styles.ratingInfo}>
            <Text style={styles.busName}>Express 156</Text>
            <Text style={styles.busRoute}>Colombo → Anuradhapura</Text>
            <View style={styles.stars}>
              <Ionicons name="star" size={18} color="#FF6200" />
              <Ionicons name="star" size={18} color="#FF6200" />
              <Ionicons name="star" size={18} color="#FF6200" />
              <Ionicons name="star-outline" size={18} color="#FF6200" />
              <Ionicons name="star-outline" size={18} color="#FF6200" />
              <Text style={styles.ratingNumber}>3.0</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.rateButton}>
            <Text style={styles.rateText}>Rate Bus</Text>
          </TouchableOpacity>
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
  ratingsList: {
    paddingHorizontal: 20,
  },
  ratingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  ratingInfo: {
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
    marginBottom: 8,
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingNumber: {
    color: '#FF6200',
    fontSize: 14,
    marginLeft: 8,
  },
  notRated: {
    color: '#AAAAAA',
    fontSize: 14,
    fontWeight: '600',
  },
  rateButton: {
    backgroundColor: '#FF6200',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rateText: {
    color: '#FFFFFF',
    fontSize: 14,
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

export default RatingsScreen;