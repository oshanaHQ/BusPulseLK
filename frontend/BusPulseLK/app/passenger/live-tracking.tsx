// app/passenger/live-tracking.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as signalR from '@microsoft/signalr';
import * as Location from 'expo-location';
import { tripService, timetableService, ratingService, reportService, API_BASE_URL } from '../../services/api';
import FreeMap from '../../components/FreeMap';
import { useAuth } from '../../context/AuthContext';
import {
  setActiveTracking,
  clearActiveTracking,
  showPassengerTrackingNotification,
  showAutoPassengerNotification,
  cancelTrackingNotification,
} from '../../services/notificationService';

const LiveTrackingScreen = () => {
  const insets = useSafeAreaInsets();
  const { isGuest } = useAuth();
  const { busId, timetableId } = useLocalSearchParams();
  const [trip, setTrip] = useState<any>(null);
  const [timetable, setTimetable] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);
  
  // Rating/Report states
  const [ratingModal, setRatingModal] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [currentAddress, setCurrentAddress] = useState('Detecting location...');

  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    loadInitialData();
    setupSignalR();
    return () => {
      if (connectionRef.current) connectionRef.current.stop();
      // Cancel notification and clear tracking session when leaving
      cancelTrackingNotification();
      clearActiveTracking();
    };
  }, []);

  const loadInitialData = async () => {
    try {
      // Get active trip for this bus
      const data: any = await tripService.getActiveByBus(Number(busId));
      setTrip(data);
      
      // Load timetable: use param if available, otherwise use the trip's timetableId
      const ttId = timetableId ? Number(timetableId) : data.timetableId;
      let ttData: any = null;
      if (ttId) {
        try {
          ttData = await timetableService.getById(ttId);
          setTimetable(ttData);
        } catch (err) {
          console.log('Error fetching timetable', err);
        }
      }
      
      // Populate status immediately from initial data
      const initialStatus = {
        lastStopId: data.lastPassedTownId,
        lastStopName: data.lastPassedTownName || 'Starting Point',
        nextStopId: data.nextTownId,
        nextStopName: data.nextTownName || '...',
        progressPercent: data.progressPercent || 0,
        latitude: data.currentLatitude,
        longitude: data.currentLongitude,
        trackingMode: data.trackingMode,
        isReturnJourney: data.isReturnJourney || false,
        isEmergency: data.isEmergency || false,
        emergencyTopic: data.emergencyTopic,
        emergencyRoute: data.emergencyRoute,
      };
      setStatus(initialStatus);

      // Save tracking session and show initial notification
      const busName = (ttData as any)?.bus?.name || (ttData as any)?.bus?.numberPlate || `Bus ${busId}`;
      await setActiveTracking({ busId: Number(busId), timetableId: ttId, busName });

      if (data.trackingMode === 'Automatic') {
        await showAutoPassengerNotification(busName, Number(busId), ttId || 0);
      } else {
        await showPassengerTrackingNotification(
          busName,
          initialStatus.nextStopName,
          initialStatus.progressPercent,
        );
      }
    } catch (error) {
      console.log('No active trip found');
    } finally {
      setLoading(false);
    }
  };

  const setupSignalR = async () => {
    // Prevent multiple connections
    if (connectionRef.current) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL.replace('/api', '')}/hubs/bus`)
      .withAutomaticReconnect()
      .build();

    connection.on('ReceiveBusStatus', async (updateBusId, busStatus) => {
      // backend now sends (busId, status)
      if (updateBusId.toString() === busId?.toString()) {
        setStatus((prev: any) => {
          const next = { ...prev, ...busStatus };
          // Update notification with latest stop info (manual mode only)
          if (prev?.trackingMode !== 'Automatic') {
            const busName = timetable?.bus?.name || timetable?.bus?.numberPlate || `Bus ${busId}`;
            showPassengerTrackingNotification(
              busName,
              next.nextStopName || '...',
              next.progressPercent || 0,
            );
          }
          return next;
        });
      }
    });

    try {
      await connection.start();
      console.log('SignalR Connected');
      await connection.invoke('JoinBusGroup', busId.toString());
      connectionRef.current = connection;
    } catch (err) {
      console.log('SignalR Error:', err);
    }
  };

  useEffect(() => {
    if (status?.trackingMode === 'Automatic' && status?.latitude && status?.longitude) {
      reverseGeocode(status.latitude, status.longitude);
    }
  }, [status?.latitude, status?.longitude, status?.trackingMode]);

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (result.length > 0) {
        const place = result[0];
        const address = [place.street || place.name, place.city || place.subregion || place.district].filter(Boolean).join(', ');
        setCurrentAddress(address || 'Unknown Location');
      }
    } catch (error) {
      console.log('Reverse geocode error:', error);
      setCurrentAddress('Location unavailable');
    }
  };

  const submitRating = async () => {
    try {
      await ratingService.submit({ busId: Number(busId), stars, comment });
      Alert.alert('Success', 'Thank you for your feedback!');
      setRatingModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const submitReport = async () => {
    try {
      await reportService.submit({
        busId: Number(busId),
        tripId: trip?.id,
        description: reportDesc,
        isAnonymous,
      });
      Alert.alert('Success', 'Your report has been submitted.');
      setReportModal(false);
      setReportDesc('');
      setIsAnonymous(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const getDelayStatus = () => {
    if (!status?.nextStopId || !timetable?.stationTimes) return null;
    // Filter by the correct journey direction
    const isReturn = status.isReturnJourney || false;
    const directionTimes = timetable.stationTimes.filter((st: any) => !!st.isReturnJourney === isReturn);
    const expectedTimeStr = directionTimes.find((st: any) => st.townId === status.nextStopId)?.expectedTime;
    if (!expectedTimeStr) return null;
    
    const now = new Date();
    const [hours, minutes] = expectedTimeStr.split(':');
    const expectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(hours), parseInt(minutes));
    
    const diffMins = Math.floor((now.getTime() - expectedDate.getTime()) / 60000);
    
    if (diffMins > 5) return { text: `Delayed by ${diffMins} mins`, color: '#D32F2F', expectedTime: expectedTimeStr };
    if (diffMins < -5) return { text: `Early by ${Math.abs(diffMins)} mins`, color: '#4CAF50', expectedTime: expectedTimeStr };
    return { text: 'On Time', color: '#4CAF50', expectedTime: expectedTimeStr };
  };

  const delayStatus = getDelayStatus();

  if (loading) return <View style={styles.center}><ActivityIndicator color="#FF6200" /></View>;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Tracking</Text>
        <View style={styles.liveBadge}><Text style={styles.liveText}>LIVE</Text></View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Emergency Alert View */}
        {status?.isEmergency ? (
          <View style={styles.emergencyCard}>
            <View style={styles.emergencyIconHeader}>
              <Ionicons name="warning" size={48} color="#EF4444" />
              <Text style={styles.emergencyTitle}>EMERGENCY ALERT</Text>
            </View>
            <Text style={styles.emergencySub}>Normal service has been temporarily suspended.</Text>
            
            <View style={styles.emergencyDivider} />
            
            <View style={styles.emergencySection}>
              <Text style={styles.emergencyLabel}>Topic / Reason</Text>
              <Text style={styles.emergencyValue}>{status.emergencyTopic || 'Deviation from normal route'}</Text>
            </View>

            <View style={styles.emergencySection}>
              <Text style={styles.emergencyLabel}>Temporary Route / Details</Text>
              <Text style={styles.emergencyValue}>{status.emergencyRoute || 'Please contact dispatch or check announcements.'}</Text>
            </View>

            <View style={styles.emergencyNoticeBox}>
              <Ionicons name="information-circle-outline" size={16} color="#F59E0B" />
              <Text style={styles.emergencyNoticeText}>
                Live tracking progress is temporarily suspended until the emergency route is cleared.
              </Text>
            </View>
          </View>
        ) : (
          <>
            {/* Automatic Mode View */}
            {status?.trackingMode === 'Automatic' && (
              <>
                {status?.latitude && status?.longitude ? (
                  <>
                    <View style={styles.mapContainer}>
                      <FreeMap 
                        latitude={status.latitude} 
                        longitude={status.longitude} 
                        zoom={15} 
                      />
                    </View>
                    <View style={styles.addressBox}>
                      <Ionicons name="location" size={20} color="#FF6200" />
                      <Text style={styles.addressLabel}>Your bus is now on: </Text>
                      <Text style={styles.addressValue} numberOfLines={1}>{currentAddress}</Text>
                    </View>
                  </>
                ) : (
                  <View style={[styles.mapContainer, styles.mapFallback]}>
                    <Ionicons name="map-outline" size={48} color="#333" />
                    <Text style={styles.mapFallbackText}>Waiting for GPS signal...</Text>
                  </View>
                )}
              </>
            )}

            {/* Manual Mode View */}
            {status?.trackingMode === 'Manual' && (
              <View style={styles.statusCard}>
                <View style={styles.busIconContainer}>
                  <Ionicons name="bus" size={40} color="#FF6200" />
                </View>
                <Text style={styles.statusLabel}>Current Location</Text>
                <Text style={styles.locationName}>{status?.lastStopName || 'Starting Point'}</Text>
                
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${status?.progressPercent || 0}%` }]} />
                  </View>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressText}>Progress</Text>
                    <Text style={styles.progressText}>{Math.round(status?.progressPercent || 0)}%</Text>
                  </View>
                </View>

                <View style={styles.nextStopBox}>
                  <Text style={styles.nextLabel}>Next Stop</Text>
                  <Text style={styles.nextValue}>{status?.nextStopName || '...'}</Text>
                  {delayStatus && (
                    <View style={{ marginTop: 10, alignItems: 'center' }}>
                      <Text style={{ color: '#AAAAAA', fontSize: 12 }}>Normal Time: {delayStatus.expectedTime}</Text>
                      <View style={{ backgroundColor: delayStatus.color + '22', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 4 }}>
                        <Text style={{ color: delayStatus.color, fontWeight: 'bold', fontSize: 14 }}>{delayStatus.text}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* No Active Trip fallback */}
            {!status && (
              <View style={styles.statusCard}>
                <Ionicons name="alert-circle-outline" size={48} color="#FF6200" />
                <Text style={[styles.locationName, { marginTop: 15 }]}>No Active Trip</Text>
                <Text style={{ color: '#666', marginTop: 5, textAlign: 'center', fontSize: 14 }}>
                  This bus is not currently running on any active schedule.
                </Text>
              </View>
            )}
          </>
        )}

        {/* Action Buttons (Rating/Report) — hidden for guests */}
        {!isGuest && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setRatingModal(true)}>
              <Ionicons name="star-outline" size={20} color="#FF6200" />
              <Text style={styles.actionBtnText}>Rate Bus</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.reportBtn]} onPress={() => setReportModal(true)}>
              <Ionicons name="alert-circle-outline" size={20} color="#D32F2F" />
              <Text style={[styles.actionBtnText, { color: '#D32F2F' }]}>Report Issue</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Rating Modal */}
      <Modal visible={ratingModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate this Bus</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <TouchableOpacity key={s} onPress={() => setStars(s)}>
                  <Ionicons name={stars >= s ? "star" : "star-outline"} size={40} color="#FF6200" />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput 
              style={styles.modalInput} 
              placeholder="Tell us more (Optional)" 
              placeholderTextColor="#666"
              multiline
              value={comment}
              onChangeText={setComment}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setRatingModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={submitRating}>
                <Text style={styles.submitText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
      <Modal visible={reportModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: '#D32F2F' }]}>Report a Problem</Text>
            <TextInput 
              style={[styles.modalInput, { height: 120 }]} 
              placeholder="Describe the issue (e.g. bus is very late, bad driving, etc.)" 
              placeholderTextColor="#666"
              multiline
              value={reportDesc}
              onChangeText={setReportDesc}
            />
            
            <TouchableOpacity 
              style={styles.anonToggleRow} 
              onPress={() => setIsAnonymous(!isAnonymous)}
            >
              <Ionicons 
                name={isAnonymous ? "checkbox" : "square-outline"} 
                size={22} 
                color={isAnonymous ? "#D32F2F" : "#666"} 
              />
              <Text style={styles.anonToggleText}>Submit Anonymously</Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setReportModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#D32F2F' }]} onPress={submitReport}>
                <Text style={styles.submitText}>Submit Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  backBtn: { padding: 5 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginLeft: 15, flex: 1 },
  liveBadge: { backgroundColor: '#D32F2F', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  liveText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  content: { padding: 20 },
  statusCard: { backgroundColor: '#111', borderRadius: 20, padding: 25, alignItems: 'center' },
  busIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FF620011', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  statusLabel: { color: '#666', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
  locationName: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginTop: 5, textAlign: 'center' },
  progressContainer: { width: '100%', marginTop: 30 },
  progressBar: { height: 8, backgroundColor: '#222', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FF6200' },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  progressText: { color: '#666', fontSize: 12 },
  nextStopBox: { width: '100%', backgroundColor: '#1A1A1A', padding: 15, borderRadius: 12, marginTop: 25, alignItems: 'center' },
  nextLabel: { color: '#FF6200', fontSize: 12, fontWeight: 'bold' },
  nextValue: { color: '#FFF', fontSize: 18, fontWeight: '600', marginTop: 5 },
  actionRow: { flexDirection: 'row', gap: 15, marginTop: 25 },
  actionBtn: { flex: 1, backgroundColor: '#111', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 12, gap: 8, borderWidth: 1, borderColor: '#FF620044' },
  reportBtn: { borderColor: '#D32F2F44' },
  actionBtnText: { color: '#FF6200', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#111', borderRadius: 20, padding: 25 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 },
  modalInput: { backgroundColor: '#000', color: '#FFF', borderRadius: 12, padding: 15, height: 100, textAlignVertical: 'top', fontSize: 16 },
  modalActions: { flexDirection: 'row', gap: 15, marginTop: 25 },
  cancelBtn: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: 'bold' },
  submitBtn: { flex: 2, backgroundColor: '#FF6200', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  submitText: { color: '#FFF', fontWeight: 'bold' },
  mapContainer: { width: '100%', height: 300, borderRadius: 20, overflow: 'hidden', marginTop: 20, borderWidth: 1, borderColor: '#222' },
  addressBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 15, borderRadius: 12, marginTop: 15, borderWidth: 1, borderColor: '#222' },
  addressLabel: { color: '#AAA', fontSize: 13, marginLeft: 8 },
  addressValue: { color: '#FFF', fontSize: 14, fontWeight: 'bold', flex: 1 },
  mapFallback: { backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', gap: 10 },
  mapFallbackText: { color: '#666', fontSize: 14, fontWeight: 'bold' },
  anonToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 15, paddingVertical: 5 },
  anonToggleText: { color: '#888', fontSize: 14 },
  emergencyCard: { backgroundColor: '#1C1010', borderRadius: 20, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: '#EF444455' },
  emergencyIconHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  emergencyTitle: { color: '#EF4444', fontSize: 22, fontWeight: 'bold' },
  emergencySub: { color: '#AAA', fontSize: 13, textAlign: 'center', marginBottom: 15 },
  emergencyDivider: { width: '100%', height: 1, backgroundColor: '#EF444422', marginBottom: 15 },
  emergencySection: { width: '100%', marginBottom: 15 },
  emergencyLabel: { color: '#666', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  emergencyValue: { color: '#FFF', fontSize: 16, lineHeight: 22 },
  emergencyNoticeBox: { flexDirection: 'row', gap: 8, backgroundColor: '#F59E0B11', padding: 12, borderRadius: 10, marginTop: 10 },
  emergencyNoticeText: { flex: 1, color: '#F59E0B', fontSize: 12, lineHeight: 16 },
});

export default LiveTrackingScreen;
