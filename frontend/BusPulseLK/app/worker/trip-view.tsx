// app/worker/trip-view.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  ScrollView,
  AppState,
  Modal,
  TextInput,
  DeviceEventEmitter,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as signalR from '@microsoft/signalr';
import * as Location from 'expo-location';
import { tripService, routeService, timetableService, emergencyService, API_BASE_URL } from '../../services/api';
import FreeMap from '../../components/FreeMap';
import {
  showWorkerTripNotification,
  showAutoWorkerNotification,
  cancelTrackingNotification,
  getWorkerLastAction,
  clearWorkerLastAction,
  ACTION_MARK_PASSED,
  ACTION_ROLLBACK,
} from '../../services/notificationService';

interface Stop {
  id: number;
  stopOrder: number;
  town: {
    id: number;
    name: string;
  };
}

const TripView = () => {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { busId, timetableId, routeName, departureTime, trackingMode } = params;

  const [tripId, setTripId] = useState<number | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [currentStopIndex, setCurrentStopIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isReversed, setIsReversed] = useState(false);

  // GPS Tracking State
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [currentAddress, setCurrentAddress] = useState('Detecting location...');
  const [timetable, setTimetable] = useState<any>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // Emergency Alert State
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [emergencyTopic, setEmergencyTopic] = useState('');
  const [emergencyRoute, setEmergencyRoute] = useState('');
  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);

  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    initTrip();
    setupSignalR();
    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      cancelTrackingNotification();
    };
  }, []);

  // Listen for AppState changes to sync background "Mark Passed" and rollback actions
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        const lastAction = await getWorkerLastAction();
        if (lastAction && stops.length > 0) {
          const index = stops.findIndex(s => s.town.id === lastAction.townId);
          if (index !== -1) {
            if (lastAction.type === 'rollback') {
              setCurrentStopIndex(index - 1);
            } else if (index > currentStopIndex) {
              setCurrentStopIndex(index);
            }
          }
          await clearWorkerLastAction();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [stops, currentStopIndex]);

  // Listen for instant notification actions when shade is open and app is active
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('NotificationActionTriggered', (event) => {
      if (stops.length > 0) {
        const index = stops.findIndex(s => s.town.id === event.townId);
        if (index !== -1) {
          if (event.action === ACTION_ROLLBACK) {
            setCurrentStopIndex(index - 1);
          } else {
            setCurrentStopIndex(index);
          }
        }
      }
    });

    return () => {
      sub.remove();
    };
  }, [stops, currentStopIndex]);

  // Start tracking only when tripId is available and mode is Automatic
  useEffect(() => {
    if (tripId && trackingMode === 'Automatic') {
      startLocationTracking();
    }
  }, [tripId, trackingMode]);

  useEffect(() => {
    if (currentLocation && trackingMode === 'Automatic') {
      reverseGeocode(currentLocation.latitude, currentLocation.longitude);
    }
  }, [currentLocation]);

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (result.length > 0) {
        const place = result[0];
        const address = [place.street || place.name, place.city || place.subregion || place.district].filter(Boolean).join(', ');
        const finalAddress = address || 'Unknown Location';
        setCurrentAddress(finalAddress);
        // Refresh the live notification with the new address
        if (tripId) {
          await showAutoWorkerNotification(
            routeName as string,
            Number(busId),
            Number(timetableId),
            finalAddress,
          );
        }
      }
    } catch (error) {
      console.log('Reverse geocode error:', error);
      setCurrentAddress('Location unavailable');
    }
  };

  const initTrip = async (reverse: boolean = false) => {
    try {
      setLoading(true);
      // 1. Start/Get the trip (Server returns existing trip if active)
      const tripData: any = await tripService.start(Number(timetableId), trackingMode as string, reverse);
      setTripId(tripData.id);
      setIsEmergencyActive(tripData.isEmergency || false);
      setEmergencyTopic(tripData.emergencyTopic || '');
      setEmergencyRoute(tripData.emergencyRoute || '');

      // fetch timetable
      try {
        const ttData = await timetableService.getById(Number(timetableId));
        setTimetable(ttData);
      } catch (err) {
        console.log('Error fetching timetable', err);
      }

      // 2. Get route stops
      const routeData: any = await routeService.getAll();
      const route = routeData.find((r: any) => r.name === routeName);

      if (route) {
        const stopsData = await routeService.getStops(route.id);
        let stopsList = stopsData as Stop[];

        if (reverse) {
          stopsList = [...stopsList].reverse();
        }

        setStops(stopsList);

        // 3. Recovery: Find where we were (only if status is Started)
        if (tripData.status === 'Started' && tripData.lastPassedTownId) {
          const index = stopsList.findIndex(s => s.town.id === tripData.lastPassedTownId);
          if (index !== -1) {
            setCurrentStopIndex(index);
          }
        } else {
          setCurrentStopIndex(-1);
        }

        // Show appropriate notification on start
        if (trackingMode === 'Automatic') {
          await showAutoWorkerNotification(routeName as string, Number(busId), Number(timetableId));
        } else {
          // Manual mode
          const nextIndex = tripData.status === 'Started' && tripData.lastPassedTownId
            ? stopsList.findIndex(s => s.town.id === tripData.lastPassedTownId) + 1
            : 0;

          if (nextIndex < stopsList.length) {
            await showWorkerTripNotification(
              routeName as string,
              stopsList[nextIndex].town.name,
              tripData.id,
              stopsList[nextIndex].town.id,
              Number(busId),
              stopsList.map(s => ({ id: s.town.id, name: s.town.name }))
            );
          }
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const setupSignalR = async () => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL.replace('/api', '')}/hubs/bus`)
      .withAutomaticReconnect()
      .build();

    try {
      await connection.start();
      console.log('SignalR Connected');
      await connection.invoke('JoinBusGroup', busId.toString());
      
      connection.on('ReceiveBusStatus', (incomingBusId: string | number, status: any) => {
        if (incomingBusId.toString() !== busId.toString()) return;

        if (status.rollbackTownId) {
           setCurrentStopIndex(prevIndex => Math.max(-1, prevIndex - 1));
           return;
        }
        
        const passedTownId = status.lastStopId || status.lastPassedTownId;
        if (passedTownId) {
          setStops((prevStops: Stop[]) => {
            const index = prevStops.findIndex(s => s.town.id === passedTownId);
            if (index !== -1) {
               setCurrentStopIndex(prevIndex => Math.max(prevIndex, index));
            }
            return prevStops;
          });
        }
      });

      connectionRef.current = connection;
    } catch (err) {
      console.log('SignalR Connection Error: ', err);
    }
  };

  const startLocationTracking = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required for Automatic tracking.');
      return;
    }

    const sendLocationUpdate = async (latitude: number, longitude: number) => {
      setCurrentLocation({ latitude, longitude });
      if (tripId) {
        try {
          await tripService.updateLocation(tripId, latitude, longitude);
          if (connectionRef.current) {
            await connectionRef.current.invoke('UpdateBusStatus', busId.toString(), {
              tripId,
              latitude,
              longitude,
              timestamp: new Date().toISOString()
            });
          }
        } catch (e) {
          console.log('Error updating location', e);
        }
      }
    };

    try {
      // Get initial position quickly
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await sendLocationUpdate(initialLocation.coords.latitude, initialLocation.coords.longitude);
    } catch (e) {
      console.log('Could not get initial location', e);
    }

    // Then watch for changes
    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000, // Update every 10 seconds
        distanceInterval: 50, // Or every 50 meters
      },
      async (location) => {
        await sendLocationUpdate(location.coords.latitude, location.coords.longitude);
      }
    );
  };

  const markStopPassed = async (index: number) => {
    if (!tripId || updating) return;
    const stop = stops[index];

    try {
      setUpdating(true);
      await tripService.updateProgress(tripId, stop.town.id);

      // Update local state
      setCurrentStopIndex(index);

      // Broadcast via SignalR
      if (connectionRef.current) {
        await connectionRef.current.invoke('UpdateBusStatus', busId.toString(), {
          tripId,
          lastStopId: stop.town.id,
          lastStopName: stop.town.name,
          nextStopId: index + 1 < stops.length ? stops[index + 1].town.id : null,
          nextStopName: index + 1 < stops.length ? stops[index + 1].town.name : 'Destination Reached',
          progressPercent: ((index + 1) / stops.length) * 100,
          timestamp: new Date().toISOString()
        });
      }

      // Update the persistent notification with the new next stop
      if (trackingMode !== 'Automatic' && index + 1 < stops.length) {
        await showWorkerTripNotification(
          routeName as string,
          stops[index + 1].town.name,
          tripId,
          stops[index + 1].town.id,
          Number(busId),
          stops.map(s => ({ id: s.town.id, name: s.town.name }))
        );
      } else if (index + 1 >= stops.length) {
        await cancelTrackingNotification();
      }

    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setUpdating(false);
    }
  };

  const rollbackStopPassed = async (index: number) => {
    if (!tripId || updating) return;
    const stop = stops[index];

    Alert.alert(
      'Rollback Progress',
      `Undo marking "${stop.town.name}" as passed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rollback',
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdating(true);
              await tripService.rollbackProgress(tripId, stop.town.id);

              // Update local state
              setCurrentStopIndex(index - 1);

              // Broadcast via SignalR
              if (connectionRef.current) {
                await connectionRef.current.invoke('UpdateBusStatus', busId.toString(), {
                  rollbackTownId: stop.town.id,
                  timestamp: new Date().toISOString()
                });
              }

              // Update notification
              if (trackingMode !== 'Automatic' && index < stops.length) {
                await showWorkerTripNotification(
                  routeName as string,
                  stops[index].town.name,
                  tripId,
                  stops[index].town.id,
                  Number(busId),
                  stops.map(s => ({ id: s.town.id, name: s.town.name }))
                );
              }
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
  };

  const handleStartEmergency = async () => {
    if (!tripId) return;
    if (!emergencyTopic.trim()) {
      Alert.alert('Required', 'Please enter a reason or topic for the emergency route deviation.');
      return;
    }

    try {
      setUpdating(true);
      await emergencyService.start(tripId, emergencyTopic, emergencyRoute);
      setIsEmergencyActive(true);
      setEmergencyModalVisible(false);

      // Broadcast via SignalR
      if (connectionRef.current) {
        await connectionRef.current.invoke('UpdateBusStatus', busId.toString(), {
          isEmergency: true,
          emergencyTopic,
          emergencyRoute,
          timestamp: new Date().toISOString()
        });
      }
      Alert.alert('Emergency Active', 'The emergency route deviation has been declared and passengers notified.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to start emergency route tracking.');
    } finally {
      setUpdating(false);
    }
  };

  const handleEndEmergency = async () => {
    if (!tripId) return;

    Alert.alert(
      'End Emergency Route',
      'Are you sure the emergency route deviation is cleared and you want to resume normal service?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resume Normal',
          onPress: async () => {
            try {
              setUpdating(true);
              await emergencyService.end(tripId);
              setIsEmergencyActive(false);
              setEmergencyTopic('');
              setEmergencyRoute('');

              // Broadcast via SignalR
              if (connectionRef.current) {
                await connectionRef.current.invoke('UpdateBusStatus', busId.toString(), {
                  isEmergency: false,
                  emergencyTopic: '',
                  emergencyRoute: '',
                  timestamp: new Date().toISOString()
                });
              }
              Alert.alert('Resumed Normal', 'Normal route tracking has been resumed.');
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to end emergency.');
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
  };

  const handleEndTrip = async () => {
    if (!tripId) return;

    Alert.alert(
      'End Trip',
      'Are you sure you want to end this trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Trip',
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdating(true);
              await tripService.end(tripId);

              Alert.alert(
                'Trip Completed',
                'Do you want to start the return journey?',
                [
                  { text: 'No, Exit', onPress: async () => { await cancelTrackingNotification(); router.back(); } },
                  {
                    text: 'Yes, Start Return',
                    onPress: async () => {
                      await cancelTrackingNotification();
                      const nextReverse = !isReversed;
                      setIsReversed(nextReverse);
                      initTrip(nextReverse);
                    }
                  }
                ]
              );
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
  };

  const getDelayStatus = (townId: number) => {
    if (!timetable?.stationTimes) return null;
    // Filter times by journey direction
    const directionTimes = timetable.stationTimes.filter((st: any) => !!st.isReturnJourney === isReversed);
    const expectedTimeStr = directionTimes.find((st: any) => st.townId === townId)?.expectedTime;
    if (!expectedTimeStr) return null;

    const now = new Date();
    const [hours, minutes] = expectedTimeStr.split(':');
    const expectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(hours), parseInt(minutes));

    const diffMins = Math.floor((now.getTime() - expectedDate.getTime()) / 60000);

    if (diffMins > 5) return { text: `Delayed ${diffMins}m`, color: '#D32F2F', expectedTime: expectedTimeStr };
    if (diffMins < -5) return { text: `Early ${Math.abs(diffMins)}m`, color: '#4CAF50', expectedTime: expectedTimeStr };
    return { text: 'On Time', color: '#4CAF50', expectedTime: expectedTimeStr };
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#FF6200" />
        <Text style={{ color: '#AAA', marginTop: 10 }}>Initializing Live Trip...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.routeName}>{routeName}</Text>
          <Text style={styles.tripStatus}>
            {isReversed ? 'RETURN TRIP' : 'FORWARD TRIP'} • {departureTime}
          </Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.dot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {trackingMode === 'Automatic' ? 'Live GPS Map' : 'Route Progress'}
          </Text>
          {isReversed && (
            <View style={styles.reverseBadge}>
              <Ionicons name="swap-vertical" size={12} color="#FF6200" />
              <Text style={styles.reverseText}>REVERSED</Text>
            </View>
          )}
        </View>

        {trackingMode === 'Automatic' ? (
          <View>
            <View style={styles.mapContainer}>
              {currentLocation ? (
                <FreeMap
                  latitude={currentLocation.latitude}
                  longitude={currentLocation.longitude}
                  zoom={15}
                />
              ) : (
                <View style={styles.mapLoading}>
                  <ActivityIndicator color="#FF6200" size="large" />
                  <Text style={{ color: '#888', marginTop: 10 }}>Acquiring GPS Signal...</Text>
                </View>
              )}
            </View>
            {currentLocation && (
              <View style={styles.addressBox}>
                <Ionicons name="location" size={20} color="#FF6200" />
                <Text style={styles.addressLabel}>Your bus is now on: </Text>
                <Text style={styles.addressValue} numberOfLines={1}>{currentAddress}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.timeline}>
            {stops.map((stop, index) => {
              const isPassed = index <= currentStopIndex;
              const isNext = index === currentStopIndex + 1;
              const delayStatus = isNext ? getDelayStatus(stop.town.id) : null;

              return (
                <View key={`${stop.id}-${index}`} style={styles.timelineItem}>
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
                    {index < stops.length - 1 && (
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
                        {stop.town.name}
                      </Text>
                      {delayStatus && isNext && (
                        <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ color: '#AAAAAA', fontSize: 12 }}>{delayStatus.expectedTime}</Text>
                          <View style={{ backgroundColor: delayStatus.color + '22', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ color: delayStatus.color, fontSize: 10, fontWeight: 'bold' }}>{delayStatus.text}</Text>
                          </View>
                        </View>
                      )}
                      {isNext && (
                        <TouchableOpacity
                          style={styles.markBtn}
                          onPress={() => markStopPassed(index)}
                          disabled={updating}
                        >
                          {updating ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text style={styles.markBtnText}>Mark Passed</Text>
                          )}
                        </TouchableOpacity>
                      )}
                      {isPassed && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <Text style={styles.passedAt}>Passed</Text>
                          {index === currentStopIndex && (
                            <TouchableOpacity
                              onPress={() => rollbackStopPassed(index)}
                              disabled={updating}
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

      <View style={styles.footer}>
        {isEmergencyActive ? (
          <TouchableOpacity
            style={[styles.endTripBtn, { backgroundColor: '#EF4444' }]}
            onPress={handleEndEmergency}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={[styles.endTripText, { color: '#FFF' }]}>End Emergency / Resume Normal</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.emergencyBtn}
              onPress={() => setEmergencyModalVisible(true)}
              disabled={updating}
            >
              <Ionicons name="warning-outline" size={20} color="#EF4444" />
              <Text style={styles.emergencyBtnText}>Emergency</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.endTripBtnHalf}
              onPress={handleEndTrip}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#D32F2F" />
              ) : (
                <Text style={styles.endTripText}>End Trip</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Emergency Modal */}
      <Modal visible={emergencyModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={32} color="#EF4444" />
              <Text style={styles.modalTitle}>Start Emergency Deviation</Text>
            </View>
            <Text style={styles.modalSub}>
              Declare an emergency detour or route deviation. Passengers will be alerted in real time.
            </Text>

            <Text style={styles.inputLabel}>Reason / Topic *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Tree fallen, Road closed, Engine issue"
              placeholderTextColor="#666"
              value={emergencyTopic}
              onChangeText={setEmergencyTopic}
            />

            <Text style={styles.inputLabel}>Temporary detoured route details</Text>
            <TextInput
              style={[styles.modalInput, { height: 80 }]}
              placeholder="e.g. Taking diversion via High Street, delays expected"
              placeholderTextColor="#666"
              multiline
              value={emergencyRoute}
              onChangeText={setEmergencyRoute}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setEmergencyModalVisible(false); setEmergencyTopic(''); setEmergencyRoute(''); }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleStartEmergency}>
                <Text style={styles.submitText}>Alert Passengers</Text>
              </TouchableOpacity>
            </View>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  backBtn: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  routeName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tripStatus: {
    color: '#FF6200',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D32F2F',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#666',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  reverseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF620011',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  reverseText: {
    color: '#FF6200',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timeline: {
    paddingLeft: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    height: 80,
  },
  leftCol: {
    alignItems: 'center',
    marginRight: 20,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  circlePassed: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  circleNext: {
    borderColor: '#FF6200',
    backgroundColor: '#FF620011',
  },
  orderText: {
    color: '#333',
    fontSize: 12,
    fontWeight: 'bold',
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: '#222',
    marginVertical: 4,
  },
  linePassed: {
    backgroundColor: '#4CAF50',
  },
  rightCol: {
    flex: 1,
    paddingTop: 4,
  },
  stopInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stopName: {
    color: '#555',
    fontSize: 18,
    fontWeight: '600',
  },
  textPassed: {
    color: '#FFFFFF',
  },
  textNext: {
    color: '#FF6200',
    fontSize: 20,
  },
  markBtn: {
    backgroundColor: '#FF6200',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  markBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  passedAt: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rollbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D32F2F22',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rollbackBtnText: {
    color: '#D32F2F',
    fontSize: 11,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  endTripBtn: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  endTripText: {
    color: '#D32F2F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  endTripBtnHalf: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  emergencyBtn: {
    flex: 1,
    backgroundColor: '#1A1111',
    borderWidth: 1,
    borderColor: '#EF444455',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  emergencyBtnText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 25,
    borderWidth: 1,
    borderColor: '#222',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalSub: {
    color: '#666',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  inputLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: '#000',
    color: '#FFF',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#222',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  cancelText: {
    color: '#666',
    fontWeight: 'bold',
  },
  submitBtn: {
    flex: 2,
    backgroundColor: '#EF4444',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  mapContainer: {
    height: 400,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  mapLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  addressBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 15, borderRadius: 12, marginTop: 15, borderWidth: 1, borderColor: '#222' },
  addressLabel: { color: '#AAA', fontSize: 13, marginLeft: 8 },
  addressValue: { color: '#FFF', fontSize: 14, fontWeight: 'bold', flex: 1 },
});

export default TripView;
