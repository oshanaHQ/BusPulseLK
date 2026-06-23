import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { busService, routeService, timetableService } from '../../services/api';

export default function WorkerScheduleScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const busId = params.busId ? parseInt(params.busId as string, 10) : null;

  const [loading, setLoading] = useState(true);
  const [timetables, setTimetables] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detailsCache, setDetailsCache] = useState<Record<number, any>>({});
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (busId) {
      fetchTimetables();
    } else {
      setLoading(false);
    }
  }, [busId]);

  const fetchTimetables = async () => {
    try {
      const data = await busService.getRoutes(busId!);
      setTimetables(data as any[]);
    } catch (err) {
      console.error('Failed to fetch timetables', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (timetable: any) => {
    if (expandedId === timetable.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(timetable.id);

    if (!detailsCache[timetable.id]) {
      setLoadingDetails(true);
      try {
        const [stopsData, fullTimetableData] = await Promise.all([
          routeService.getStops(timetable.route.id),
          timetableService.getById(timetable.id),
        ]);

        const stops = stopsData as any[];
        const fullTimetable = fullTimetableData as any;

        const timeline = stops.map((stop) => {
          const stTime = fullTimetable.stationTimes?.find((st: any) => st.routeStopId === stop.id);
          return {
            id: stop.id,
            townName: stop.town.name,
            expectedTime: stTime ? stTime.expectedTime : 'N/A',
          };
        });

        setDetailsCache((prev) => ({
          ...prev,
          [timetable.id]: timeline,
        }));
      } catch (err) {
        console.error('Failed to fetch timeline details', err);
      } finally {
        setLoadingDetails(false);
      }
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar backgroundColor="#000000" barStyle="light-content" />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FF6200" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Schedule</Text>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#FF6200" />
          </View>
        ) : !busId ? (
          <View style={styles.centerContainer}>
            <Ionicons name="bus-outline" size={64} color="#333333" />
            <Text style={styles.emptyText}>Not Assigned</Text>
            <Text style={styles.emptySub}>You are not currently assigned to any bus.</Text>
          </View>
        ) : timetables.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="calendar-outline" size={64} color="#333333" />
            <Text style={styles.emptyText}>No Schedule</Text>
            <Text style={styles.emptySub}>No timetables are assigned to your bus.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {timetables.map((t) => {
              const isExpanded = expandedId === t.id;
              const timeline = detailsCache[t.id];

              return (
                <View key={t.id} style={styles.card}>
                  <TouchableOpacity
                    style={styles.cardHeader}
                    activeOpacity={0.8}
                    onPress={() => toggleExpand(t)}
                  >
                    <View style={styles.cardHeaderLeft}>
                      <Text style={styles.routeText}>{t.route.name}</Text>
                      <Text style={styles.timeText}>
                        <Ionicons name="time-outline" size={14} color="#AAAAAA" /> {t.departureTime}
                      </Text>
                      <Text style={styles.daysText}>{t.operatingDays}</Text>
                    </View>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={24}
                      color="#AAAAAA"
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      {loadingDetails && !timeline ? (
                        <ActivityIndicator size="small" color="#FF6200" style={{ marginVertical: 20 }} />
                      ) : timeline ? (
                        <View style={styles.timelineContainer}>
                          {timeline.map((stop: any, index: number) => {
                            const isFirst = index === 0;
                            const isLast = index === timeline.length - 1;
                            return (
                              <View key={stop.id} style={styles.timelineItem}>
                                <View style={styles.timelineLeft}>
                                  <Text style={styles.timelineTime}>{stop.expectedTime}</Text>
                                </View>
                                <View style={styles.timelineCenter}>
                                  <View style={[styles.timelineDot, isFirst || isLast ? styles.timelineDotHighlight : null]} />
                                  {!isLast && <View style={styles.timelineLine} />}
                                </View>
                                <View style={styles.timelineRight}>
                                  <Text style={[styles.timelineTown, isFirst || isLast ? styles.timelineTownHighlight : null]}>
                                    {stop.townName}
                                  </Text>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      ) : (
                        <Text style={{ color: '#AAAAAA', textAlign: 'center', marginVertical: 20 }}>Failed to load details.</Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  backBtn: {
    padding: 5,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 15,
  },
  emptySub: {
    fontSize: 15,
    color: '#888888',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#222222',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  routeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  timeText: {
    fontSize: 15,
    color: '#AAAAAA',
    marginBottom: 4,
  },
  daysText: {
    fontSize: 13,
    color: '#FF6200',
    fontWeight: '500',
  },
  expandedContent: {
    backgroundColor: '#0A0A0A',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#222222',
  },
  timelineContainer: {
    marginVertical: 10,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineLeft: {
    width: 60,
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  timelineTime: {
    color: '#AAAAAA',
    fontSize: 13,
    marginTop: 2,
  },
  timelineCenter: {
    width: 20,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#444444',
    marginTop: 4,
    zIndex: 2,
  },
  timelineDotHighlight: {
    backgroundColor: '#FF6200',
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 3,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#222222',
    marginTop: -4,
    marginBottom: -4,
    zIndex: 1,
  },
  timelineRight: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 25,
  },
  timelineTown: {
    color: '#DDDDDD',
    fontSize: 15,
  },
  timelineTownHighlight: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
