// app/passenger/regular-bus-trip.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, StatusBar, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

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

  const handleRollbackPassed = async (stop: any) => {
    if (!tripStatus) return;
    const townId = stop.town?.id ?? stop.townId;
    const townName = stop.town?.name ?? stop.townName ?? 'Unknown';

    Alert.alert(
      'Rollback Progress',
      `Undo marking "${townName}" as passed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rollback',
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdatingTown(townId);
              await tripService.rollbackProgress(tripStatus.id, townId);
              await fetchTrip();
              if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
                await connectionRef.current.invoke('UpdateBusStatus', String(numBusId), {
                  rollbackTownId: townId,
                });
              }
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to rollback progress.');
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
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
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
          {/* Emergency Alert View */}
          {tripStatus.isEmergency ? (
            <View style={styles.emergencyCard}>
              <View style={styles.emergencyIconHeader}>
                <Ionicons name="warning" size={48} color="#EF4444" />
                <Text style={styles.emergencyTitle}>EMERGENCY ALERT</Text>
              </View>
              <Text style={styles.emergencySub}>Normal service has been temporarily suspended.</Text>
              
              <View style={styles.emergencyDivider} />
              
              <View style={styles.emergencySection}>
                <Text style={styles.emergencyLabel}>Topic / Reason</Text>
                <Text style={styles.emergencyValue}>{tripStatus.emergencyTopic || 'Deviation from normal route'}</Text>
              </View>

              <View style={styles.emergencySection}>
                <Text style={styles.emergencyLabel}>Temporary Route / Details</Text>
                <Text style={styles.emergencyValue}>{tripStatus.emergencyRoute || 'Please contact dispatch or check announcements.'}</Text>
              </View>

              <View style={styles.emergencyNoticeBox}>
                <Ionicons name="information-circle-outline" size={16} color="#F59E0B" />
                <Text style={styles.emergencyNoticeText}>
                  This bus is currently deviating from the normal route. Standard scheduling is paused.
                </Text>
              </View>
            </View>
          ) : (
            <>
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
            </>
          )}

          {/* Stops */}
          <Text style={styles.sectionTitle}>Route Stops</Text>
          {tripStatus.trackingMode === 'Automatic' ? (
            <View style={styles.automaticNoticeBox}>
              <Ionicons name="location-outline" size={40} color="#4CAF50" />
              <Text style={styles.automaticNoticeTitle}>Automatic GPS Active</Text>
              <Text style={styles.automaticNoticeText}>
                The driver is currently sharing real-time GPS locations. Manual stop check-ins by passengers are disabled.
              </Text>
            </View>
          ) : (
            <View style={styles.timeline}>
              {(tripStatus.stops ?? []).map((stop: any, index: number) => {
              const townId = stop.town?.id ?? stop.townId;
              const townName = stop.town?.name ?? stop.townName ?? 'Unknown';
              const isPassed = passedIds.includes(townId);
              const isNext = !isPassed && (tripStatus.lastPassedTownId == null
                ? index === 0
                : townId === (tripStatus.stops?.[passedIds.length]?.town?.id ?? tripStatus.stops?.[passedIds.length]?.townId));
              const isLoading = updatingTown === townId;
              const isAutomatic = tripStatus.trackingMode === 'Automatic';
              const isLastPassed = townId === tripStatus.lastPassedTownId;

              return (
                <View key={townId} style={styles.timelineItem}>
                  <View style={styles.leftCol}>
                    <View style={[
                      styles.circle,
                      isPassed && styles.circlePassed,
                      isNext && styles.circleNext
                    ]}>
                      {isPassed ? (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      ) : (
                        <Text style={[styles.orderText, isNext && { color: '#FF6200' }]}>{index + 1}</Text>
                      )}
                    </View>
                    {index < (tripStatus.stops?.length ?? 0) - 1 && (
                      <View style={[styles.line, isPassed && styles.linePassed]} />
                    )}
                  </View>

                  <View style={styles.rightCol}>
                    <View style={styles.stopInfo}>
                      <Text style={[
                        styles.stopName,
                        isPassed && styles.textPassed,
                        isNext && styles.textNext
                      ]}>
                        {townName}
                      </Text>
                      {isNext && !isAutomatic && (
                        <TouchableOpacity
                          style={styles.markBtn}
                          onPress={() => handleMarkPassed(stop)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text style={styles.markBtnText}>Mark Passed</Text>
                          )}
                        </TouchableOpacity>
                      )}
                      {isPassed && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <Text style={styles.passedAt}>Passed</Text>
                          {isLastPassed && !isAutomatic && (
                            <TouchableOpacity
                              onPress={() => handleRollbackPassed(stop)}
                              disabled={isLoading}
                              style={styles.rollbackBtn}
                            >
                              <Ionicons name="arrow-undo" size={16} color="#D32F2F" />
                              <Text style={styles.rollbackBtnText}>Undo</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
          )}
        </ScrollView>
      )}
    </View>
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
  timeline: { paddingLeft: 10 },
  timelineItem: { flexDirection: 'row', height: 80 },
  leftCol: { alignItems: 'center', marginRight: 20 },
  circle: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#333', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  circlePassed: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  circleNext: { borderColor: '#FF6200', backgroundColor: '#FF620011' },
  orderText: { color: '#333', fontSize: 12, fontWeight: 'bold' },
  line: { flex: 1, width: 2, backgroundColor: '#222', marginVertical: 4 },
  linePassed: { backgroundColor: '#4CAF50' },
  rightCol: { flex: 1, paddingTop: 4 },
  stopInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stopName: { color: '#555', fontSize: 18, fontWeight: '600' },
  textPassed: { color: '#FFFFFF' },
  textNext: { color: '#FF6200', fontSize: 20 },
  markBtn: { backgroundColor: '#FF6200', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  markBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  passedAt: { color: '#4CAF50', fontSize: 12, fontWeight: 'bold' },
  rollbackBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#D32F2F22', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  rollbackBtnText: { color: '#D32F2F', fontSize: 11, fontWeight: 'bold' },
  emergencyCard: { backgroundColor: '#1C1010', borderRadius: 20, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: '#EF444455', marginBottom: 20 },
  emergencyIconHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  emergencyTitle: { color: '#EF4444', fontSize: 22, fontWeight: 'bold' },
  emergencySub: { color: '#AAA', fontSize: 13, textAlign: 'center', marginBottom: 15 },
  emergencyDivider: { width: '100%', height: 1, backgroundColor: '#EF444422', marginBottom: 15 },
  emergencySection: { width: '100%', marginBottom: 15 },
  emergencyLabel: { color: '#666', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  emergencyValue: { color: '#FFF', fontSize: 16, lineHeight: 22 },
  emergencyNoticeBox: { flexDirection: 'row', gap: 8, backgroundColor: '#F59E0B11', padding: 12, borderRadius: 10, marginTop: 10 },
  emergencyNoticeText: { flex: 1, color: '#F59E0B', fontSize: 12, lineHeight: 16 },
  automaticNoticeBox: { alignItems: 'center', backgroundColor: '#4CAF5011', padding: 25, borderRadius: 16, marginTop: 10, borderWidth: 1, borderColor: '#4CAF5033' },
  automaticNoticeTitle: { color: '#4CAF50', fontSize: 18, fontWeight: 'bold', marginTop: 12, marginBottom: 6 },
  automaticNoticeText: { color: '#AAA', fontSize: 14, textAlign: 'center', lineHeight: 20 },
});

export default RegularBusTrip;
