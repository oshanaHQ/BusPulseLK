// app/owner/assign-route.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  RefreshControl,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { timetableService, busService, routeService } from '../../services/api';

interface Bus {
  id: number;
  numberPlate: string;
  name?: string;
  isActive: boolean;
}

interface Route {
  id: number;
  name: string;
  originTown: { name: string };
  destinationTown: { name: string };
}

interface TimetableEntry {
  id: number;
  departureTime: string;
  operatingDays: string;
  isActive: boolean;
  bus: {
    id: number;
    numberPlate: string;
    name?: string;
  };
  route: {
    id: number;
    name: string;
    originTown: string;
    destinationTown: string;
  };
}

const AssignRoute = () => {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [departureTime, setDepartureTime] = useState('08:00');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeValue, setTimeValue] = useState(new Date());
  const [operatingDays, setOperatingDays] = useState('Daily');

  // Search/Filter for Pickers
  const [showBusPicker, setShowBusPicker] = useState(false);
  const [showRoutePicker, setShowRoutePicker] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [timetableData, busData, routeData] = await Promise.all([
        timetableService.getAll(),
        busService.getMine(),
        routeService.getAll(),
      ]);

      // Filter timetables to only show entries for the owner's buses
      // Note: Backend might already filter this if we had a specific "mine" endpoint for timetables,
      // but for now we filter in frontend by checking if the bus belongs to the owner's fetched buses.
      const myBusIds = (busData as Bus[]).map(b => b.id);
      const myEntries = (timetableData as TimetableEntry[]).filter(t => myBusIds.includes(t.bus.id));
      
      setEntries(myEntries);
      setBuses((busData as Bus[]).filter(b => b.isActive)); // Only approved buses
      setRoutes(routeData as Route[]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSave = async () => {
    if (!selectedBusId || !selectedRouteId || !departureTime || !operatingDays) {
      Alert.alert('Validation', 'Please fill all fields');
      return;
    }

    const payload = {
      busId: selectedBusId,
      routeId: selectedRouteId,
      departureTime,
      operatingDays,
    };

    try {
      setSubmitting(true);
      await timetableService.create(payload);
      setModalVisible(false);
      fetchData();
      Alert.alert('Success', 'Bus assigned to route successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to assign route');
    } finally {
      setSubmitting(false);
    }
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setTimeValue(selectedDate);
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      setDepartureTime(`${hours}:${minutes}`);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Confirm', 'Are you sure you want to remove this assignment?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Remove', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await timetableService.delete(id);
            fetchData();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        } 
      },
    ]);
  };

  const renderEntryItem = ({ item }: { item: TimetableEntry }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <View style={styles.timeContainer}>
          <Ionicons name="time-outline" size={16} color="#FF6200" />
          <Text style={styles.timeText}>{item.departureTime}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#D32F2F" />
        </TouchableOpacity>
      </View>

      <Text style={styles.routeName}>{item.route.name}</Text>
      <Text style={styles.routeStops}>{item.route.originTown} → {item.route.destinationTown}</Text>
      
      <View style={styles.divider} />
      
      <View style={styles.busInfo}>
        <Ionicons name="bus-outline" size={16} color="#AAAAAA" />
        <Text style={styles.busText}>{item.bus.numberPlate} {item.bus.name ? `(${item.bus.name})` : ''}</Text>
      </View>
      
      <View style={styles.daysInfo}>
        <Ionicons name="calendar-outline" size={16} color="#AAAAAA" />
        <Text style={styles.daysText}>{item.operatingDays}</Text>
      </View>
    </View>
  );

  const selectedBus = buses.find(b => b.id === selectedBusId);
  const selectedRoute = routes.find(r => r.id === selectedRouteId);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Assign Routes</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
          <Ionicons name="add-circle" size={32} color="#FF6200" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6200" />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderEntryItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#FF6200" />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="map-outline" size={64} color="#333" />
              <Text style={styles.emptyText}>No routes assigned to your buses yet.</Text>
            </View>
          }
        />
      )}

      {/* Add Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Assignment</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Bus Selection */}
              <Text style={styles.label}>Select Bus (Approved only)</Text>
              <TouchableOpacity 
                style={styles.pickerTrigger}
                onPress={() => setShowBusPicker(true)}
              >
                <Text style={[styles.pickerText, !selectedBus && { color: '#555' }]}>
                  {selectedBus ? `${selectedBus.numberPlate} - ${selectedBus.name || 'Unnamed'}` : 'Pick a bus'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#FF6200" />
              </TouchableOpacity>

              {/* Route Selection */}
              <Text style={styles.label}>Select Route</Text>
              <TouchableOpacity 
                style={styles.pickerTrigger}
                onPress={() => setShowRoutePicker(true)}
              >
                <Text style={[styles.pickerText, !selectedRoute && { color: '#555' }]}>
                  {selectedRoute ? selectedRoute.name : 'Pick a route'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#FF6200" />
              </TouchableOpacity>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.label}>Departure Time</Text>
                  <TouchableOpacity 
                    style={styles.pickerTrigger}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text style={styles.pickerText}>{departureTime}</Text>
                    <Ionicons name="time-outline" size={20} color="#FF6200" />
                  </TouchableOpacity>

                  {showTimePicker && (
                    <DateTimePicker
                      value={timeValue}
                      mode="time"
                      is24Hour={true}
                      display="default"
                      onChange={onTimeChange}
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Operating Days</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Daily"
                    placeholderTextColor="#555"
                    value={operatingDays}
                    onChangeText={setOperatingDays}
                  />
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Assign Bus</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Inner Picker: Bus */}
        <Modal visible={showBusPicker} transparent animationType="fade">
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContent}>
              <Text style={styles.pickerTitle}>Select Bus</Text>
              <FlatList
                data={buses}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.pickerItem}
                    onPress={() => { setSelectedBusId(item.id); setShowBusPicker(false); }}
                  >
                    <Text style={styles.pickerItemText}>{item.numberPlate} - {item.name || 'Unnamed'}</Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
              <TouchableOpacity style={styles.closePickerBtn} onPress={() => setShowBusPicker(false)}>
                <Text style={styles.closePickerBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Inner Picker: Route */}
        <Modal visible={showRoutePicker} transparent animationType="fade">
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContent}>
              <Text style={styles.pickerTitle}>Select Route</Text>
              <FlatList
                data={routes}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.pickerItem}
                    onPress={() => { setSelectedRouteId(item.id); setShowRoutePicker(false); }}
                  >
                    <Text style={styles.pickerItemText}>{item.name}</Text>
                    <Text style={styles.pickerItemSubtext}>{item.originTown.name} → {item.destinationTown.name}</Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
              <TouchableOpacity style={styles.closePickerBtn} onPress={() => setShowRoutePicker(false)}>
                <Text style={styles.closePickerBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Modal>
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
  addBtn: {
    padding: 4,
  },
  listContent: {
    padding: 20,
  },
  entryCard: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF620022',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  timeText: {
    color: '#FF6200',
    fontWeight: 'bold',
    fontSize: 16,
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  routeStops: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#222',
    marginVertical: 12,
  },
  busInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  busText: {
    color: '#AAAAAA',
    fontSize: 14,
  },
  daysInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  daysText: {
    color: '#AAAAAA',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: '#555',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
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
    height: '70%',
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
  pickerTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
  },
  pickerText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
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
  saveBtn: {
    backgroundColor: '#FF6200',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Inner Pickers
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    padding: 30,
  },
  pickerContent: {
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#333',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  pickerItem: {
    paddingVertical: 16,
  },
  pickerItemText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  pickerItemSubtext: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#222',
  },
  closePickerBtn: {
    marginTop: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closePickerBtnText: {
    color: '#FF6200',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AssignRoute;
