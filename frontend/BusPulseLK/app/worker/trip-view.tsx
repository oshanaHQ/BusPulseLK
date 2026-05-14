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

  const initTrip = async () => {
    try {
      setLoading(true);
      // 1. Start/Get the trip
      const tripData: any = await tripService.start(Number(timetableId));
      setTripId(tripData.id);

      // 2. Get route stops (assuming we have an endpoint for this or can derive it)
      // For now, we'll fetch the route details which should include stops
      // Note: We need the routeId. We can get it from the timetable if needed, 
      // but for now I'll assume we have a way to get stops for a timetable's route.
      const routeData: any = await routeService.getAll(); // Simplified search
      const route = routeData.find((r: any) => r.name === routeName);
      if (route) {
        const stopsData = await routeService.getStops(route.id);
        setStops(stopsData as Stop[]);
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
          <Text style={styles.tripStatus}>LIVE TRIP • {departureTime}</Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.dot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Route Progress</Text>
        <View style={styles.timeline}>
          {stops.map((stop, index) => {
            const isPassed = index <= currentStopIndex;
            const isNext = index === currentStopIndex + 1;
            
            return (
              <View key={stop.id} style={styles.timelineItem}>
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
        <TouchableOpacity style={styles.endTripBtn} onPress={() => router.back()}>
          <Text style={styles.endTripText}>End Trip</Text>
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
  sectionTitle: {
    color: '#666',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 24,
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
