import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface FreeMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  markers?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    title: string;
    color?: string;
  }>;
}

const FreeMap: React.FC<FreeMapProps> = ({ latitude, longitude, zoom = 14, markers = [] }) => {
  const webviewRef = useRef<WebView>(null);

  // HTML content with Leaflet.js
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { padding: 0; margin: 0; }
        #map { width: 100%; height: 100vh; }
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

        var markers = {};
        
        // Add initial marker for bus
        var busIcon = L.divIcon({
          className: 'custom-div-icon',
          html: "<div style='background-color:#FF6200; width:20px; height:20px; border-radius:50%; border:3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);'></div>",
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        var mainMarker = L.marker([${latitude}, ${longitude}], {icon: busIcon}).addTo(map);

        window.addEventListener("message", function(event) {
          try {
            var data = JSON.parse(event.data);
            if (data.type === 'updateLocation') {
              var lat = data.latitude;
              var lng = data.longitude;
              mainMarker.setLatLng([lat, lng]);
              map.setView([lat, lng]);
            }
          } catch(e) {}
        });
      </script>
    </body>
    </html>
  `;

  // When props change, send message to webview to update map
  useEffect(() => {
    if (webviewRef.current) {
      webviewRef.current.postMessage(JSON.stringify({
        type: 'updateLocation',
        latitude,
        longitude
      }));
    }
  }, [latitude, longitude]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        source={{ html: htmlContent }}
        style={styles.webview}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        originWhitelist={['*']}
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
