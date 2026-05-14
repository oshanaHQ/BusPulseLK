// app/admin/manage-towns.tsx
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
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { townService } from '../../services/api';

interface Town {
  id: number;
  name: string;
  description?: string;
}

const ManageTowns = () => {
  const [towns, setTowns] = useState<Town[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [townName, setTownName] = useState('');
  const [townDesc, setTownDesc] = useState('');

  useEffect(() => {
    fetchTowns();
  }, []);

  const fetchTowns = async () => {
    try {
      setLoading(true);
      const data = await townService.getAll();
      setTowns(data as Town[]);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to fetch cities');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTown = async () => {
    if (!townName.trim()) {
      Alert.alert('Validation', 'City name is required');
      return;
    }

    try {
      setLoading(true);
      await townService.create({ 
        name: townName.trim(),
        description: townDesc.trim() 
      });
      setModalVisible(false);
      setTownName('');
      setTownDesc('');
      fetchTowns();
      Alert.alert('Success', 'City added successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add city. It might already exist.');
    } finally {
      setLoading(false);
    }
  };

  const renderTownItem = ({ item }: { item: Town }) => (
    <View style={styles.townCard}>
      <View style={styles.townIcon}>
        <Ionicons name="location" size={20} color="#FF6200" />
      </View>
      <View style={styles.townInfo}>
        <Text style={styles.townName}>{item.name}</Text>
        {item.description ? <Text style={styles.townDesc}>{item.description}</Text> : null}
      </View>
      <TouchableOpacity onPress={() => handleDelete(item.id)}>
        <Ionicons name="trash-outline" size={20} color="#D32F2F" />
      </TouchableOpacity>
    </View>
  );

  const handleDelete = (id: number) => {
    Alert.alert('Confirm', 'Are you sure you want to delete this city?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await townService.delete(id);
            fetchTowns();
          } catch (error: any) {
            Alert.alert('Error', 'Cannot delete city. It might be in use by routes.');
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Cities</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
          <Ionicons name="add-circle" size={32} color="#FF6200" />
        </TouchableOpacity>
      </View>

      {loading && !modalVisible ? (
        <View style={styles.center}><ActivityIndicator color="#FF6200" /></View>
      ) : (
        <FlatList
          data={towns}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTownItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="map-outline" size={60} color="#222" />
              <Text style={styles.emptyText}>No cities added yet</Text>
            </View>
          }
        />
      )}

      {/* Add Town Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New City</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#FFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>City Name</Text>
            <TextInput 
              style={styles.input}
              placeholder="e.g. Colombo"
              placeholderTextColor="#555"
              value={townName}
              onChangeText={setTownName}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput 
              style={[styles.input, { height: 100 }]}
              placeholder="District or main area..."
              placeholderTextColor="#555"
              multiline
              value={townDesc}
              onChangeText={setTownDesc}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleAddTown}>
              <Text style={styles.saveBtnText}>Add City</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, justifyContent: 'space-between' },
  backBtn: { padding: 5 },
  title: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  addBtn: { padding: 5 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 20 },
  townCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 15, borderRadius: 16, marginBottom: 12 },
  townIcon: { width: 40, height: 40, backgroundColor: '#000', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  townInfo: { flex: 1 },
  townName: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
  townDesc: { color: '#666', fontSize: 13, marginTop: 2 },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#444', marginTop: 20, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, paddingBottom: 50 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  label: { color: '#666', fontSize: 14, marginBottom: 8 },
  input: { backgroundColor: '#000', borderRadius: 12, padding: 15, color: '#FFF', fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: '#222' },
  saveBtn: { backgroundColor: '#FF6200', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});

export default ManageTowns;
