// app/owner/manage-staff.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { userService, busService } from '../../services/api';

interface Bus {
  id: number;
  numberPlate: string;
  name?: string;
  driver?: { fullName: string };
  conductor?: { fullName: string };
}

interface StaffUser {
  id: number;
  fullName: string;
  email: string;
  role: 'Driver' | 'Conductor';
}

const ManageStaff = () => {
  const insets = useSafeAreaInsets();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<'Driver' | 'Conductor'>('Driver');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StaffUser[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      setLoading(true);
      const data = await busService.getMine();
      setBuses(data as Bus[]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch buses');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setSearching(true);
      // Fetch both roles simultaneously since workers can act as both
      const [drivers, conductors] = await Promise.all([
        userService.searchStaff('Driver', searchQuery).catch(() => []),
        userService.searchStaff('Conductor', searchQuery).catch(() => [])
      ]);
      
      const merged = [...(drivers as StaffUser[]), ...(conductors as StaffUser[])];
      
      // Remove any duplicate users by ID
      const unique = merged.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      
      setSearchResults(unique);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSearching(false);
    }
  };

  const handleAssign = async (staffId: number) => {
    if (!selectedBusId) return;
    try {
      setSearching(true);
      if (selectedRole === 'Driver') {
        await busService.assignDriver(selectedBusId, staffId);
      } else {
        await busService.assignConductor(selectedBusId, staffId);
      }
      setSearchModalVisible(false);
      fetchBuses();
      Alert.alert('Success', `Staff assigned successfully.`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSearching(false);
    }
  };

  const handleUnassign = (busId: number, role: 'Driver' | 'Conductor') => {
    Alert.alert('Confirm', `Unassign this ${role.toLowerCase()}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unassign',
        style: 'destructive',
        onPress: async () => {
          try {
            if (role === 'Driver') {
              await busService.unassignDriver(busId);
            } else {
              await busService.unassignConductor(busId);
            }
            fetchBuses();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        }
      },
    ]);
  };

  const openSearch = (busId: number, role: 'Driver' | 'Conductor') => {
    setSelectedBusId(busId);
    setSelectedRole(role);
    setSearchQuery('');
    setSearchResults([]);
    setSearchModalVisible(true);
  };

  const renderBusItem = ({ item }: { item: Bus }) => (
    <View style={styles.busCard}>
      <Text style={styles.busPlate}>{item.numberPlate}</Text>
      <Text style={styles.busName}>{item.name || 'Unnamed Bus'}</Text>

      <View style={styles.divider} />

      {/* Driver Section */}
      <View style={styles.staffSection}>
        <View style={styles.staffHeader}>
          <Text style={styles.staffLabel}>Driver</Text>
          {item.driver ? (
            <TouchableOpacity onPress={() => handleUnassign(item.id, 'Driver')}>
              <Text style={styles.unassignText}>Unassign</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => openSearch(item.id, 'Driver')}>
              <Text style={styles.assignText}>+ Assign Driver</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.staffName}>{item.driver?.fullName || 'Not assigned'}</Text>
      </View>

      {/* Conductor Section */}
      <View style={styles.staffSection}>
        <View style={styles.staffHeader}>
          <Text style={styles.staffLabel}>Conductor</Text>
          {item.conductor ? (
            <TouchableOpacity onPress={() => handleUnassign(item.id, 'Conductor')}>
              <Text style={styles.unassignText}>Unassign</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => openSearch(item.id, 'Conductor')}>
              <Text style={styles.assignText}>+ Assign Conductor</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.staffName}>{item.conductor?.fullName || 'Not assigned'}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Staff</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6200" />
        </View>
      ) : (
        <FlatList
          data={buses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBusItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#333" />
              <Text style={styles.emptyText}>No buses found. Add buses first.</Text>
            </View>
          }
        />
      )}

      {/* Search Modal */}
      <Modal visible={searchModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Find {selectedRole}</Text>
              <TouchableOpacity onPress={() => setSearchModalVisible(false)}>
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or email..."
                placeholderTextColor="#555"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                <Ionicons name="search" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {searching ? (
              <ActivityIndicator color="#FF6200" style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.resultItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultName}>{item.fullName}</Text>
                      <Text style={styles.resultEmail}>{item.email}</Text>
                    </View>
                    <TouchableOpacity style={styles.selectBtn} onPress={() => handleAssign(item.id)}>
                      <Text style={styles.selectBtnText}>Select</Text>
                    </TouchableOpacity>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyResult}>Search for verified staff members.</Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
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
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  busPlate: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  busName: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#222',
    marginBottom: 16,
  },
  staffSection: {
    marginBottom: 16,
  },
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  staffLabel: {
    color: '#666',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  staffName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  assignText: {
    color: '#FF6200',
    fontSize: 13,
    fontWeight: '600',
  },
  unassignText: {
    color: '#D32F2F',
    fontSize: 13,
    fontWeight: '600',
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
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 16,
  },
  searchBtn: {
    backgroundColor: '#FF6200',
    padding: 12,
    borderRadius: 10,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  resultName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultEmail: {
    color: '#888',
    fontSize: 13,
  },
  selectBtn: {
    backgroundColor: '#FF620022',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectBtnText: {
    color: '#FF6200',
    fontWeight: 'bold',
  },
  emptyResult: {
    color: '#555',
    textAlign: 'center',
    marginTop: 40,
  },
});

export default ManageStaff;
