// app/admin/bus-approvals.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { busService } from '../../services/api';

interface Bus {
  id: number;
  numberPlate: string;
  name?: string;
  busType: string;
  seatingCapacity: number;
  isActive: boolean;
  owner: { fullName: string; email: string };
}

const BusApprovals = () => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPendingBuses();
  }, []);

  const fetchPendingBuses = async () => {
    try {
      setLoading(true);
      const data = await busService.getPending(); 
      setBuses(data as Bus[]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch pending buses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApprove = async (id: number) => {
    Alert.alert('Confirm Approval', 'Are you sure you want to approve this bus?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Approve', 
        onPress: async () => {
          try {
            await busService.approve(id);
            Alert.alert('Success', 'Bus approved successfully');
            fetchPendingBuses();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        } 
      },
    ]);
  };

  const renderBusItem = ({ item }: { item: Bus }) => (
    <View style={styles.busCard}>
      <View style={styles.busHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.busPlate}>{item.numberPlate}</Text>
          <Text style={styles.busName}>{item.name || 'Unnamed Bus'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.approveBtn}
          onPress={() => handleApprove(item.id)}
        >
          <Text style={styles.approveBtnText}>Approve</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Owner:</Text>
          <Text style={styles.detailValue}>{item.owner.fullName}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Type:</Text>
          <Text style={styles.detailValue}>{item.busType}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Capacity:</Text>
          <Text style={styles.detailValue}>{item.seatingCapacity} seats</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Bus Approvals</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6200" />
        </View>
      ) : (
        <FlatList
          data={buses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBusItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPendingBuses(); }} tintColor="#FF6200" />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-circle-outline" size={64} color="#333" />
              <Text style={styles.emptyText}>No pending bus approvals.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 16,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  listContent: {
    padding: 20,
  },
  busCard: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingBottom: 12,
  },
  busPlate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  busName: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  approveBtn: {
    backgroundColor: '#FF6200',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  detailsContainer: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: '#666',
    fontSize: 13,
  },
  detailValue: {
    color: '#AAA',
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: '#555',
    fontSize: 16,
    marginTop: 16,
  },
});

export default BusApprovals;
