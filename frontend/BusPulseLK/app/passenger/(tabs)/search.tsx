// app/passenger/(tabs)/search.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { searchService, townService, favoriteService } from '../../../services/api';

type SearchMode = 'Name' | 'Destination' | 'Route';

const SearchScreen = () => {
  const [mode, setMode] = useState<SearchMode>('Name');
  const [query, setQuery] = useState('');
  const [originId, setOriginId] = useState<number | null>(null);
  const [destId, setDestId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeValue, setTimeValue] = useState(new Date());
  
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [towns, setTowns] = useState<any[]>([]);
  const [townModalVisible, setTownModalVisible] = useState(false);
  const [selectingFor, setSelectingFor] = useState<'origin' | 'destination'>('origin');

  useEffect(() => {
    loadTowns();
  }, []);

  const loadTowns = async () => {
    try {
      const data = await townService.getAll();
      setTowns(data as any[]);
    } catch (error) {}
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setTimeValue(selectedDate);
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      setStartTime(`${hours}:${minutes}`);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      let params: any = {};
      if (mode === 'Name') params.name = query;
      if (mode === 'Route') params.routeNumber = query;
      if (mode === 'Destination') {
        params.originTownId = originId;
        params.destinationTownId = destId;
      }
      if (startTime) params.startTime = startTime;

      const data = await searchService.buses(params);
      setResults(data as any[]);
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (busId: number) => {
    try {
      await favoriteService.toggle(busId);
      setResults(prev => prev.map(item => 
        item.bus.id === busId ? { ...item, isFavorite: !item.isFavorite } : item
      ));
    } catch (error) {}
  };

  const renderBusItem = ({ item }: { item: any }) => (
    <View style={styles.busCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.routeNumber}>{item.route.routeNumber}</Text>
          <Text style={styles.busName}>{item.bus.name || item.bus.numberPlate}</Text>
        </View>
        <TouchableOpacity onPress={() => toggleFavorite(item.bus.id)}>
          <Ionicons 
            name={item.isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={item.isFavorite ? "#FF6200" : "#666"} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.routeInfo}>
        <Text style={styles.towns}>{item.route.originTown} → {item.route.destinationTown}</Text>
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={14} color="#AAA" />
          <Text style={styles.departureTime}>Departs: {item.departureTime}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.trackBtn}
          onPress={() => router.push({
            pathname: '/passenger/live-tracking',
            params: { busId: item.bus.id, timetableId: item.timetableId }
          })}
        >
          <Ionicons name="map-outline" size={18} color="#FFFFFF" />
          <Text style={styles.trackBtnText}>Live Track</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Find Your Bus</Text>
        
        <View style={styles.modeSelector}>
          {(['Name', 'Destination', 'Route'] as SearchMode[]).map(m => (
            <TouchableOpacity 
              key={m}
              style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
              onPress={() => setMode(m)}
            >
              <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputsContainer}>
          {mode === 'Destination' ? (
            <View style={styles.destinationInputs}>
              <TouchableOpacity 
                style={styles.townPicker}
                onPress={() => { setSelectingFor('origin'); setTownModalVisible(true); }}
              >
                <Ionicons name="location-outline" size={20} color="#FF6200" />
                <Text style={styles.pickerText}>
                  {originId ? towns.find(t => t.id === originId)?.name : 'Select Start Location'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.townPicker}
                onPress={() => { setSelectingFor('destination'); setTownModalVisible(true); }}
              >
                <Ionicons name="navigate-outline" size={20} color="#FF6200" />
                <Text style={styles.pickerText}>
                  {destId ? towns.find(t => t.id === destId)?.name : 'Select End Location'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inputWrapper}>
              <Ionicons 
                name={mode === 'Name' ? "bus-outline" : "barcode-outline"} 
                size={20} 
                color="#666" 
                style={styles.inputIcon} 
              />
              <TextInput 
                style={styles.input}
                placeholder={mode === 'Name' ? "Enter bus or route name" : "Enter route number"}
                placeholderTextColor="#666"
                value={query}
                onChangeText={setQuery}
              />
            </View>
          )}

          <View style={styles.row}>
            <TouchableOpacity 
              style={[styles.inputWrapper, { flex: 1, marginTop: 10 }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color="#666" style={styles.inputIcon} />
              <Text style={[styles.input, !startTime && { color: '#666' }]}>
                {startTime || 'Departure After'}
              </Text>
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
            
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
              <Ionicons name="search" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6200" />
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderBusItem}
          keyExtractor={(item) => item.timetableId.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="bus" size={64} color="#222" />
              <Text style={styles.emptyText}>No buses found matching your search</Text>
            </View>
          }
        />
      )}

      <Modal visible={townModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select City</Text>
              <TouchableOpacity onPress={() => setTownModalVisible(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={towns}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.townItem}
                  onPress={() => {
                    if (selectingFor === 'origin') setOriginId(item.id);
                    else setDestId(item.id);
                    setTownModalVisible(false);
                  }}
                >
                  <Text style={styles.townItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: 20, backgroundColor: '#000', borderBottomWidth: 1, borderBottomColor: '#111' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 15 },
  modeSelector: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 12, padding: 4, marginBottom: 15 },
  modeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  modeBtnActive: { backgroundColor: '#FF6200' },
  modeBtnText: { color: '#666', fontWeight: 'bold', fontSize: 13 },
  modeBtnTextActive: { color: '#FFF' },
  inputsContainer: {},
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 12, paddingHorizontal: 15, height: 48 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#FFF', fontSize: 15 },
  destinationInputs: { gap: 8 },
  townPicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 12, padding: 12, height: 48 },
  pickerText: { color: '#FFF', marginLeft: 12, fontSize: 15 },
  row: { flexDirection: 'row', gap: 10 },
  searchBtn: { backgroundColor: '#FF6200', width: 50, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  listContent: { padding: 20, paddingBottom: 100 },
  busCard: { backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  routeNumber: { color: '#FF6200', fontSize: 18, fontWeight: 'bold' },
  busName: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  routeInfo: { marginTop: 10, gap: 4 },
  towns: { color: '#FFF', fontSize: 14 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  departureTime: { color: '#AAA', fontSize: 12 },
  cardActions: { marginTop: 15 },
  trackBtn: { backgroundColor: '#222', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 8 },
  trackBtnText: { color: '#FFF', fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#444', marginTop: 15, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111', borderTopLeftRadius: 25, borderTopRightRadius: 25, height: '70%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  townItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  townItemText: { color: '#FFF', fontSize: 17 }
});

export default SearchScreen;
