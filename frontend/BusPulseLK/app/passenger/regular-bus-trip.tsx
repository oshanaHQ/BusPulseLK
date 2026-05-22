// app/passenger/regular-bus-trip.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, StatusBar, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as signalR from '@microsoft/signalr';
import { tripService } from '../../services/api';
import { API_BASE_URL } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'buspulse_token';

const RegularBusTrip = () => {
  const { busId } = useLocalSearchParams<{ busId: string }>();
  const numBusId = Number(busId);

  const [tripStatus, setTripStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingTown, setUpdatingTown] = useState<number | null>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    fetchTrip();
    connectSignalR();
    return () => { connectionRef.current?.stop(); };
  }, [numBusId]);

  const fetchTrip = async () => {
    try {
      const data = await tripService.getActiveByBus(numBusId);
      setTripStatus(data as any);
    } catch {
      setTripStatus(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const connectSignalR = async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const hubUrl = API_BASE_URL.replace('/api', '') + '/hubs/bus';
      const conn = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, { accessTokenFactory: () => token ?? '' })
        .withAutomaticReconnect()
        .build();

      conn.on('ReceiveBusStatus', (_busId: number, status: any) => {
        setTripStatus((prev: any) => prev ? { ...prev, ...status } : status);
      });

      await conn.start();
      await conn.invoke('JoinBusGroup', String(numBusId));
      connectionRef.current = conn;
    } catch (e) {
      console.log('SignalR connection failed', e);
    }
  };

  const handleMarkPassed = async (stop: any) => {
    if (!tripStatus) return;
    const townId = stop.town?.id ?? stop.townId;
    const townName = stop.town?.name ?? stop.townName ?? 'Unknown';

    Alert.alert(
      'Mark as Passed',
      `Mark "${townName}" as passed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Passed', onPress: async () => {
            try {
              setUpdatingTown(townId);
              await tripService.updateProgress(tripStatus.id, townId);
              await fetchTrip();
              // Also notify SignalR group
              if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
                await connectionRef.current.invoke('UpdateBusStatus', String(numBusId), {
                  lastPassedTownId: townId,
                  lastPassedTownName: townName,
                });
              }
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to update progress.');
            } finally {
              setUpdatingTown(null);
            }
          }
        }
      ]
    );
  };

  const passedIds: number[] = [];
  if (tripStatus?.lastPassedTownId) {
    const stops = tripStatus.stops ?? [];
    for (const s of stops) {
      passedIds.push(s.town?.id ?? s.townId);
      if ((s.town?.id ?? s.townId) === tripStatus.lastPassedTownId) break;
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>My Regular Bus</Text>
          <Text style={styles.headerSub}>Live Trip Progress</Text>
        </View>
        <TouchableOpacity onPress={() => { setRefreshing(true); fetchTrip(); }}>
          <Ionicons name="refresh-outline" size={24} color="#FF6200" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#FF6200" style={{ marginTop: 60 }} />
      ) : !tripStatus ? (
        <View style={styles.noTrip}>
          <Ionicons name="bus-outline" size={72} color="#1A1A1A" />
          <Text style={styles.noTripTitle}>No Active Trip</Text>
          <Text style={styles.noTripSub}>Your bus hasn't started a trip today yet.</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchTrip}>
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchTrip} tintColor="#FF6200" />}
        >
          {/* Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
              <Text style={styles.modeText}>{tripStatus.trackingMode} Mode</Text>
            </View>
            <Text style={styles.progressLabel}>Progress</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(tripStatus.progressPercent ?? 0, 100)}%` }]} />
            </View>
            <Text style={styles.progressPercent}>{Math.round(tripStatus.progressPercent ?? 0)}% complete</Text>
            {tripStatus.lastPassedTownName && (
              <Text style={styles.lastPassed}>Last passed: {tripStatus.lastPassedTownName}</Text>
            )}
            {tripStatus.nextTownName && (
              <Text style={styles.nextTown}>Next stop: {tripStatus.nextTownName}</Text>
            )}
          </View>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="star" size={16} color="#FF6200" />
            <Text style={styles.infoText}>As a regular passenger, you can mark stops as the bus passes them.</Text>
          </View>

          {/* Stops */}
          <Text style={styles.sectionTitle}>Route Stops</Text>
          {(tripStatus.stops ?? []).map((stop: any, index: number) => {
            const townId = stop.town?.id ?? stop.townId;
            const townName = stop.town?.name ?? stop.townName ?? 'Unknown';
            const isPassed = passedIds.includes(townId);
            const isCurrent = townId === tripStatus.lastPassedTownId;
            const isNext = !isPassed && (tripStatus.lastPassedTownId == null
              ? index === 0
              : townId === (tripStatus.stops?.[passedIds.length]?.town?.id));
            const isLoading = updatingTown === townId;

            return (
              <TouchableOpacity
                key={townId}
                style={[
                  styles.stopItem,
                  isPassed && styles.stopPassed,
                  isCurrent && styles.stopCurrent,
                ]}
                onPress={() => !isPassed && handleMarkPassed(stop)}
                disabled={isPassed || isLoading}
              >
                <View style={[styles.stopDot, isPassed && styles.stopDotPassed, isCurrent && styles.stopDotCurrent]}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : isPassed ? (
                    <Ionicons name="checkmark" size={14} color="#FFF" />
                  ) : (
                    <Text style={styles.stopDotText}>{index + 1}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stopName, isPassed && { color: '#4CAF50' }, isCurrent && { color: '#FF6200' }]}>
                    {townName}
                  </Text>
                  {index === 0 && <Text style={styles.stopRole}>ORIGIN</Text>}
                  {index === (tripStatus.stops?.length ?? 0) - 1 && <Text style={[styles.stopRole, { color: '#4CAF50' }]}>DESTINATION</Text>}
                </View>
                {!isPassed && (
                  <View style={[styles.markBtn, isNext && { backgroundColor: '#FF620033' }]}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={isNext ? '#FF6200' : '#333'} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  backBtn: { padding: 4 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  headerSub: { color: '#555', fontSize: 12 },
  content: { padding: 20, paddingBottom: 60 },
  noTrip: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  noTripTitle: { color: '#444', fontSize: 22, fontWeight: 'bold' },
  noTripSub: { color: '#333', fontSize: 14, textAlign: 'center' },
  refreshBtn: { backgroundColor: '#FF6200', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginTop: 8 },
  refreshBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  statusCard: { backgroundColor: '#111', borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#1A1A1A' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D32F2F' },
  liveText: { color: '#D32F2F', fontSize: 11, fontWeight: 'bold' },
  modeText: { color: '#555', fontSize: 12, marginLeft: 'auto' },
  progressLabel: { color: '#666', fontSize: 12, marginBottom: 8 },
  progressBar: { height: 6, backgroundColor: '#222', borderRadius: 3, marginBottom: 6 },
  progressFill: { height: 6, backgroundColor: '#FF6200', borderRadius: 3 },
  progressPercent: { color: '#FF6200', fontSize: 13, fontWeight: 'bold', marginBottom: 8 },
  lastPassed: { color: '#AAA', fontSize: 13 },
  nextTown: { color: '#4CAF50', fontSize: 13, marginTop: 2 },
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FF620011', borderRadius: 12, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: '#FF620022' },
  infoText: { color: '#FF9800', fontSize: 13, flex: 1, lineHeight: 18 },
  sectionTitle: { color: '#666', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  stopItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D0D0D', borderRadius: 14, padding: 14, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: '#111' },
  stopPassed: { backgroundColor: '#4CAF5010', borderColor: '#4CAF5022' },
  stopCurrent: { backgroundColor: '#FF620010', borderColor: '#FF620033' },
  stopDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' },
  stopDotPassed: { backgroundColor: '#4CAF50' },
  stopDotCurrent: { backgroundColor: '#FF6200' },
  stopDotText: { color: '#555', fontSize: 11, fontWeight: 'bold' },
  stopName: { color: '#CCC', fontSize: 15, fontWeight: '500' },
  stopRole: { color: '#FF9800', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  markBtn: { padding: 6, borderRadius: 8 },
});

export default RegularBusTrip;
