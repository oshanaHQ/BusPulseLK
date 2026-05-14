// app/worker/trip-view.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as signalR from '@microsoft/signalr';
import { tripService, routeService, API_BASE_URL } from '../../services/api';

interface Stop {
  id: number;
  stopOrder: number;
  town: {
    id: number;
    name: string;
  };
}

const TripView = () => {
  const params = useLocalSearchParams();
  const { busId, timetableId, routeName, departureTime } = params;

  const [tripId, setTripId] = useState<number | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [currentStopIndex, setCurrentStopIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isReversed, setIsReversed] = useState(false);
  
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    initTrip();
    setupSignalR();
    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, []);

  const initTrip = async (reverse: boolean = false) => {
    try {
      setLoading(true);
      // 1. Start/Get the trip (Server returns existing trip if active)
      const tripData: any = await tripService.start(Number(timetableId));
      setTripId(tripData.id);

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
      connectionRef.current = connection;
    } catch (err) {
      console.log('SignalR Connection Error: ', err);
    }
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
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setUpdating(false);
    }
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
                  { text: 'No, Exit', onPress: () => router.back() },
                  { 
                    text: 'Yes, Start Return', 
                    onPress: () => {
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

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#FF6200" />
        <Text style={{ color: '#AAA', marginTop: 10 }}>Initializing Live Trip...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
          <Text style={styles.sectionTitle}>Route Progress</Text>
          {isReversed && (
            <View style={styles.reverseBadge}>
              <Ionicons name="swap-vertical" size={12} color="#FF6200" />
              <Text style={styles.reverseText}>REVERSED</Text>
            </View>
          )}
        </View>

        <View style={styles.timeline}>
          {stops.map((stop, index) => {
            const isPassed = index <= currentStopIndex;
            const isNext = index === currentStopIndex + 1;
            
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
                      <Text style={styles.passedAt}>Passed</Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.endTripBtn} 
          onPress={handleEndTrip}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator color="#D32F2F" />
          ) : (
            <Text style={styles.endTripText}>End Current Trip</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
});

export default TripView;
