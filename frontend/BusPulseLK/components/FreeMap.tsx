import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

interface FreeMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  userLatitude?: number;
  userLongitude?: number;
}

const FreeMap: React.FC<FreeMapProps> = ({ 
  latitude, 
  longitude, 
  zoom = 14, 
  userLatitude, 
  userLongitude 
}) => {
  const webviewRef = useRef<WebView>(null);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>
      <style>
        body { padding: 0; margin: 0; background: #111; }
        #map { width: 100%; height: 100vh; }
        
        /* Hide the text directions box provided by leaflet-routing-machine */
        .leaflet-routing-container {
          display: none !important;
        }

        /* Bus Marker Animation */
        @keyframes pulse {
          0%   { box-shadow: 0 0 0 0 rgba(255,98,0,0.7); }
          70%  { box-shadow: 0 0 0 14px rgba(255,98,0,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,98,0,0); }
        }
        .bus-dot {
          width: 20px; height: 20px; border-radius: 50%;
          background: #FF6200; border: 3px solid #fff;
          animation: pulse 1.6s infinite;
          box-shadow: 0 2px 8px rgba(0,0,0,0.6);
        }

        /* Passenger Marker */
        .user-dot {
          width: 16px; height: 16px; border-radius: 50%;
          background: #4CAF50; border: 3px solid #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {
          zoomControl: false,
          attributionControl: false
        }).setView([${latitude}, ${longitude}], ${zoom});

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);

        // --- Bus Marker ---
        var busIcon = L.divIcon({
          className: '',
          html: '<div class="bus-dot"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        
        // --- User Marker ---
        var userIcon = L.divIcon({
          className: '',
          html: '<div class="user-dot"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        var routingControl = null;
        var hasUserLocation = ${userLatitude ? 'true' : 'false'};

        if (hasUserLocation) {
          // If we have both, draw route using Leaflet Routing Machine
          routingControl = L.Routing.control({
            waypoints: [
              L.latLng(${latitude}, ${longitude}),
              L.latLng(${userLatitude || 0}, ${userLongitude || 0})
            ],
            routeWhileDragging: false,
            fitSelectedRoutes: true,
            showAlternatives: false,
            addWaypoints: false,
            createMarker: function(i, wp, nWps) {
              if (i === 0) {
                // Start marker (Bus)
                return L.marker(wp.latLng, { icon: busIcon, zIndexOffset: 1000 });
              } else if (i === nWps - 1) {
                // End marker (User)
                var userMarker = L.marker(wp.latLng, { icon: userIcon, zIndexOffset: 900 });
                userMarker.bindTooltip('You', { permanent: false, direction: 'top' });
                return userMarker;
              }
              return null;
            },
            lineOptions: {
              styles: [{ color: '#00BFFF', opacity: 0.8, weight: 5 }]
            }
          }).addTo(map);
        } else {
          // If no user location, just show the bus
          var busMarker = L.marker([${latitude}, ${longitude}], { icon: busIcon, zIndexOffset: 1000 }).addTo(map);
        }

        // Live update handler called via React Native injectJavaScript
        window.updateBusLocation = function(lat, lng) {
          if (routingControl) {
            // Update the first waypoint (bus)
            var waypoints = routingControl.getWaypoints();
            waypoints[0].latLng = L.latLng(lat, lng);
            routingControl.setWaypoints(waypoints);
          } else if (busMarker) {
            // Update standalone marker
            busMarker.setLatLng([lat, lng]);
            map.panTo([lat, lng], { animate: true, duration: 0.8 });
          }
        };

        window.ReactNativeWebView && window.ReactNativeWebView.postMessage('MAP_READY');
      </script>
    </body>
    </html>
  `;

  // Update bus position live without re-rendering WebView
  useEffect(() => {
    if (!webviewRef.current) return;
    const js = `
      try {
        if (typeof window.updateBusLocation === 'function') {
          window.updateBusLocation(${latitude}, ${longitude});
        }
      } catch(e) {}
      true;
    `;
    webviewRef.current.injectJavaScript(js);
  }, [latitude, longitude]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        key={userLatitude ? `route-${userLatitude}-${userLongitude}` : 'no-user'}
        source={{ html: htmlContent }}
        style={styles.webview}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        originWhitelist={['*']}
        javaScriptEnabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 16,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default FreeMap;
