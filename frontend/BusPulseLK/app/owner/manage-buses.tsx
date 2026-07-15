// app/owner/manage-buses.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { busService } from '../../services/api';

interface Bus {
  id: number;
  numberPlate: string;
  name?: string;
  busType: string;
  seatingCapacity: number;
  isActive: boolean;
}

const ManageBuses = () => {
  const insets = useSafeAreaInsets();
  const { openAdd } = useLocalSearchParams();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);

  // Form State
  const [numberPlate, setNumberPlate] = useState('');
  const [busName, setBusName] = useState('');
  const [busType, setBusType] = useState('Non-AC');
  const [capacity, setCapacity] = useState('50');

  useEffect(() => {
    fetchBuses();
  }, []);

  useEffect(() => {
    if (openAdd === 'true') {
      handleOpenModal();
    }
  }, [openAdd]);

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

  const handleOpenModal = (bus?: Bus) => {
    if (bus) {
      setEditingBus(bus);
      setNumberPlate(bus.numberPlate);
      setBusName(bus.name || '');
      setBusType(bus.busType);
      setCapacity(bus.seatingCapacity.toString());
    } else {
      setEditingBus(null);
      setNumberPlate('');
      setBusName('');
      setBusType('Non-AC');
      setCapacity('50');
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!numberPlate.trim()) {
      Alert.alert('Validation', 'Number plate is required.');
      return;
    }

    const payload = {
      numberPlate: numberPlate.trim().toUpperCase(),
      name: busName.trim(),
      busType,
      seatingCapacity: parseInt(capacity) || 50,
    };

    try {
      setLoading(true);
      if (editingBus) {
        await busService.update(editingBus.id, payload);
      } else {
        await busService.create(payload);
      }
      setModalVisible(false);
      fetchBuses();
      Alert.alert('Success', `Bus ${editingBus ? 'updated' : 'registered'} successfully. ${!editingBus ? 'Wait for Admin approval.' : ''}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save bus');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Confirm', 'Are you sure you want to deactivate this bus?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Deactivate', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await busService.delete(id);
            fetchBuses();
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
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={() => handleOpenModal(item)} style={styles.iconBtn}>
            <Ionicons name="create-outline" size={22} color="#FF6200" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
            <Ionicons name="trash-outline" size={22} color="#D32F2F" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.detailsContainer}>
        <View style={styles.detailTag}>
          <Ionicons name="options-outline" size={14} color="#AAAAAA" />
          <Text style={styles.detailText}>{item.busType}</Text>
        </View>
        <View style={styles.detailTag}>
          <Ionicons name="people-outline" size={14} color="#AAAAAA" />
          <Text style={styles.detailText}>{item.seatingCapacity} seats</Text>
        </View>
        
        <View style={[
          styles.statusBadge, 
          { backgroundColor: item.isActive ? '#2E7D3222' : '#FF620022' }
        ]}>
          <View style={[
            styles.statusDot, 
            { backgroundColor: item.isActive ? '#2E7D32' : '#FF6200' }
          ]} />
          <Text style={[
            styles.statusText, 
            { color: item.isActive ? '#2E7D32' : '#FF6200' }
          ]}>
            {item.isActive ? 'Active' : 'Pending Approval'}
          </Text>
        </View>
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
        <Text style={styles.title}>Manage Fleet</Text>
        <TouchableOpacity onPress={() => handleOpenModal()} style={styles.addBtn}>
          <Ionicons name="add-circle" size={32} color="#FF6200" />
        </TouchableOpacity>
      </View>

      {loading && !modalVisible ? (
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
              <Ionicons name="bus-outline" size={64} color="#333" />
              <Text style={styles.emptyText}>No buses registered yet.</Text>
            </View>
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingBus ? 'Edit Bus' : 'Register Bus'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Number Plate</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. WP CAB-1234"
                placeholderTextColor="#555"
                value={numberPlate}
                onChangeText={setNumberPlate}
                autoCapitalize="characters"
              />

              <Text style={styles.label}>Bus Display Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Royal Express"
                placeholderTextColor="#555"
                value={busName}
                onChangeText={setBusName}
              />

              <Text style={styles.label}>Bus Type</Text>
              <View style={styles.typeSelector}>
                {['AC', 'Non-AC', 'Luxury', 'Semi-Luxury'].map((type) => (
                  <TouchableOpacity 
                    key={type}
                    style={[styles.typeBtn, busType === type && styles.typeBtnActive]}
                    onPress={() => setBusType(type)}
                  >
                    <Text style={[styles.typeBtnText, busType === type && styles.typeBtnTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Seating Capacity</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 50"
                placeholderTextColor="#555"
                keyboardType="numeric"
                value={capacity}
                onChangeText={setCapacity}
              />
              
              {!editingBus && (
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={20} color="#FF6200" />
                  <Text style={styles.infoText}>
                    New buses require Admin approval before they can be assigned to routes.
                  </Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>{editingBus ? 'Update Bus' : 'Register Bus'}</Text>
              )}
            </TouchableOpacity>
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
  addBtn: {
    padding: 4,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
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
    marginBottom: 12,
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
  actionButtons: {
    flexDirection: 'row',
  },
  iconBtn: {
    marginLeft: 12,
    padding: 4,
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  detailTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#AAAAAA',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalBody: {
    flex: 1,
  },
  label: {
    color: '#AAAAAA',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  typeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
  },
  typeBtnActive: {
    borderColor: '#FF6200',
    backgroundColor: '#FF620011',
  },
  typeBtnText: {
    color: '#888',
    fontSize: 14,
  },
  typeBtnTextActive: {
    color: '#FF6200',
    fontWeight: 'bold',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FF620011',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  infoText: {
    flex: 1,
    color: '#FF6200',
    fontSize: 13,
    lineHeight: 18,
  },
  saveBtn: {
    backgroundColor: '#FF6200',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ManageBuses;
