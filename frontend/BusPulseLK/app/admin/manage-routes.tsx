// app/admin/manage-routes.tsx
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { routeService, townService } from '../../services/api';

interface Town {
  id: number;
  name: string;
}

interface RouteStop {
  id: number;
  stopOrder: number;
  town: Town;
}

interface Route {
  id: number;
  name: string;
  description?: string;
  originTown: Town;
  destinationTown: Town;
  isActive: boolean;
  stops: RouteStop[];
}

const ManageRoutes = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [towns, setTowns] = useState<Town[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);

  // Form State
  const [routeName, setRouteName] = useState('');
  const [routeDescription, setRouteDescription] = useState('');
  const [selectedTownIds, setSelectedTownIds] = useState<number[]>([]);
  const [showTownPicker, setShowTownPicker] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [routesData, townsData] = await Promise.all([
        routeService.getAll(),
        townService.getAll(),
      ]);
      setRoutes(routesData as Route[]);
      setTowns(townsData as Town[]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (route?: Route) => {
    if (route) {
      setEditingRoute(route);
      setRouteName(route.name);
      setRouteDescription(route.description || '');
      setSelectedTownIds(route.stops.map(s => s.town.id));
    } else {
      setEditingRoute(null);
      setRouteName('');
      setRouteDescription('');
      setSelectedTownIds([]);
    }
    setModalVisible(true);
  };

  const handleAddTown = (townId: number) => {
    if (selectedTownIds.includes(townId)) {
      Alert.alert('Info', 'This town is already in the route');
      return;
    }
    setSelectedTownIds([...selectedTownIds, townId]);
    setShowTownPicker(false);
  };

  const handleRemoveTown = (index: number) => {
    const newList = [...selectedTownIds];
    newList.splice(index, 1);
    setSelectedTownIds(newList);
  };

  const handleSave = async () => {
    if (!routeName.trim() || selectedTownIds.length < 2) {
      Alert.alert('Validation', 'Please provide a name and at least 2 cities.');
      return;
    }

    const payload = {
      name: routeName,
      description: routeDescription,
      originTownId: selectedTownIds[0],
      destinationTownId: selectedTownIds[selectedTownIds.length - 1],
      stopTownIds: selectedTownIds,
    };

    try {
      setLoading(true);
      if (editingRoute) {
        await routeService.update(editingRoute.id, payload);
      } else {
        await routeService.create(payload);
      }
      setModalVisible(false);
      fetchData();
      Alert.alert('Success', `Route ${editingRoute ? 'updated' : 'created'} successfully`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save route');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Confirm', 'Are you sure you want to deactivate this route?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Deactivate',
        style: 'destructive',
        onPress: async () => {
          try {
            await routeService.delete(id);
            fetchData();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        }
      },
    ]);
  };

  const renderRouteItem = ({ item }: { item: Route }) => (
    <View style={styles.routeCard}>
      <View style={styles.routeHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.routeName}>{item.name}</Text>
          <Text style={styles.routeSummary}>
            {item.originTown.name} ➔ {item.destinationTown.name}
          </Text>
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

      <View style={styles.stopsContainer}>
        {item.stops.map((stop, index) => (
          <React.Fragment key={stop.id}>
            <Text style={styles.stopText}>{stop.town.name}</Text>
            {index < item.stops.length - 1 && (
              <Ionicons name="chevron-forward" size={12} color="#444" style={{ marginHorizontal: 4 }} />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Routes</Text>
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
          data={routes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderRouteItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="map-outline" size={64} color="#333" />
              <Text style={styles.emptyText}>No routes found.</Text>
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingRoute ? 'Edit Route' : 'New Route'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Route Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Colombo - Kandy Express"
                placeholderTextColor="#555"
                value={routeName}
                onChangeText={setRouteName}
              />

              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Brief route details..."
                placeholderTextColor="#555"
                multiline
                value={routeDescription}
                onChangeText={setRouteDescription}
              />

              <View style={styles.sectionHeader}>
                <Text style={styles.label}>Cities / Stops (In Order)</Text>
                <TouchableOpacity
                  style={styles.addCityBtn}
                  onPress={() => setShowTownPicker(true)}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#FF6200" />
                  <Text style={styles.addCityText}>Add City</Text>
                </TouchableOpacity>
              </View>

              {selectedTownIds.map((tid, index) => {
                const town = towns.find(t => t.id === tid);
                return (
                  <View key={`${tid}-${index}`} style={styles.selectedCityItem}>
                    <View style={styles.cityOrder}>
                      <Text style={styles.orderText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.cityName}>{town?.name || 'Unknown'}</Text>
                    <TouchableOpacity onPress={() => handleRemoveTown(index)}>
                      <Ionicons name="remove-circle-outline" size={24} color="#D32F2F" />
                    </TouchableOpacity>
                  </View>
                );
              })}

              {selectedTownIds.length === 0 && (
                <Text style={styles.helperText}>Add at least 2 cities (Origin and Destination).</Text>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Save Route</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Town Picker Modal */}
        <Modal
          visible={showTownPicker}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContent}>
              <Text style={styles.pickerTitle}>Select City</Text>
              <FlatList
                data={towns}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.pickerItem}
                    onPress={() => handleAddTown(item.id)}
                  >
                    <Text style={styles.pickerItemText}>{item.name}</Text>
                    <Ionicons name="chevron-forward" size={18} color="#FF6200" />
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
              <TouchableOpacity
                style={styles.closePickerBtn}
                onPress={() => setShowTownPicker(false)}
              >
                <Text style={styles.closePickerText}>Cancel</Text>
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
    backgroundColor: '#000000',
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
    paddingBottom: 100,
  },
  routeCard: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  routeSummary: {
    fontSize: 14,
    color: '#FF6200',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  iconBtn: {
    marginLeft: 12,
    padding: 4,
  },
  stopsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    backgroundColor: '#080808',
    padding: 10,
    borderRadius: 8,
  },
  stopText: {
    fontSize: 12,
    color: '#AAAAAA',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addCityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addCityText: {
    color: '#FF6200',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  selectedCityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  cityOrder: {
    backgroundColor: '#FF6200',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cityName: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  helperText: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
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
  // Picker Styles
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 30,
  },
  pickerContent: {
    backgroundColor: '#111111',
    borderRadius: 20,
    maxHeight: '70%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  pickerItemText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#222',
  },
  closePickerBtn: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closePickerText: {
    color: '#AAAAAA',
    fontSize: 16,
  },
});

export default ManageRoutes;
