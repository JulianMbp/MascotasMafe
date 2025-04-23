import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { API_URL, sendPetLocation } from '../services/api';

const PetLocationMap = ({ mascotaId, mascotaNombre, mascotaImagen }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [lastSentTime, setLastSentTime] = useState(null);
  const [isReloading, setIsReloading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const intervalRef = useRef(null);
  const webviewRef = useRef(null);

  // Solicitar permisos y obtener ubicación inicial
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        let { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setErrorMsg('Permiso de ubicación denegado');
          setLoading(false);
          return;
        }
        
        // Obtener ubicación actual
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        
        setCurrentLocation(location);
        
        // Envía la ubicación inmediatamente al cargar el componente
        sendLocationData(location, mascotaId);
        
      } catch (error) {
        console.error('Error al inicializar ubicación:', error);
        setErrorMsg('Error al obtener ubicación');
      } finally {
        setLoading(false);
      }
    })();
    
    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [mascotaId]);

  // Efecto para manejar el cambio de ID de mascota
  useEffect(() => {
    if (currentLocation) {
      // Cuando cambie el ID de mascota, enviar la ubicación con el nuevo ID
      sendLocationData(currentLocation, mascotaId);
      
      // Obtener historial de ubicaciones para la mascota seleccionada
      fetchLocationHistory(mascotaId);
      
      // Iniciar seguimiento automático
      startTracking();
      
      // Actualizar el mapa con la nueva mascota
      updateMap();
    }
  }, [mascotaId]);

  // Iniciar el seguimiento automático al cargar el componente
  useEffect(() => {
    if (mascotaId && currentLocation) {
      startTracking();
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [mascotaId, currentLocation]);

  // Función para iniciar el seguimiento automático
  const startTracking = () => {
    // Detener intervalo existente si lo hay
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Configurar intervalo para enviar cada minuto (60000 ms)
    intervalRef.current = setInterval(async () => {
      try {
        const newLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        
        setCurrentLocation(newLocation);
        
        // Verificar si la ubicación es diferente a la última enviada
        if (shouldAddLocation(newLocation)) {
          sendLocationData(newLocation, mascotaId);
          
          // Actualizar el mapa
          updateMap();
        }
      } catch (error) {
        console.error('Error en el seguimiento automático:', error);
      }
    }, 60000);
    
    console.log('Seguimiento automático activado - enviando ubicación cada minuto');
  };

  // Función para obtener el historial de ubicaciones de la mascota
  const fetchLocationHistory = async (petId) => {
    if (!petId) return;
    
    try {
      setFetchingHistory(true);
      setLocationHistory([]);
      
      // Usar la URL de la API configurada en lugar de localhost
      const response = await axios.get(`${API_URL}/location/location_list`);
      
      if (response.data && Array.isArray(response.data)) {
        // Filtrar ubicaciones por mascota seleccionada y ordenar por fecha
        const petLocations = response.data
          .filter(location => location.mascota === petId)
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        if (petLocations.length > 0) {
          // Convertir a formato para el historial
          const formattedLocations = petLocations.map(loc => ({
            latitude: parseFloat(loc.latitude),
            longitude: parseFloat(loc.longitude),
            timestamp: new Date(loc.created_at).getTime()
          }));
          
          // Actualizar historial
          setLocationHistory(formattedLocations);
          
          console.log(`Cargadas ${formattedLocations.length} ubicaciones previas`);
          
          // Actualizar mapa con el historial
          if (webviewRef.current) {
            drawLocationHistory(formattedLocations);
          }
        } else {
          console.log('No se encontraron ubicaciones previas para esta mascota');
        }
      }
    } catch (error) {
      console.error('Error al obtener historial de ubicaciones:', error);
      console.error('Detalles del error:', error.response ? error.response.data : 'Sin detalles');
    } finally {
      setFetchingHistory(false);
    }
  };

  // Función para dibujar el historial de ubicaciones en el mapa
  const drawLocationHistory = (locations) => {
    if (!webviewRef.current || locations.length === 0) return;
    
    try {
      // Crear script para dibujar las líneas en el mapa
      const points = locations.map(loc => `[${loc.latitude}, ${loc.longitude}]`).join(',');
      
      const historyScript = `
        try {
          // Limpiar ruta existente
          if (window.path) {
            window.map.removeLayer(window.path);
          }
          
          // Crear nueva ruta con los puntos históricos
          window.path = L.polyline([${points}], {
            color: '#FF5252',
            weight: 4,
            opacity: 0.7
          }).addTo(window.map);
          
          // Ajustar zoom para mostrar toda la ruta
          if (window.path.getBounds().isValid()) {
            window.map.fitBounds(window.path.getBounds(), { padding: [50, 50] });
          }
        } catch(e) {
          console.error('Error dibujando historial:', e);
        }
      `;
      
      webviewRef.current.injectJavaScript(historyScript);
    } catch (error) {
      console.error('Error al renderizar historial en el mapa:', error);
    }
  };

  // Función para actualizar el mapa con la ubicación actual
  const updateMap = () => {
    if (webviewRef.current && currentLocation) {
      const { latitude, longitude } = currentLocation.coords;
      
      // Script para actualizar el marcador en el mapa
      const updateScript = `
        try {
          if (window.marker) {
            window.marker.setLatLng([${latitude}, ${longitude}]);
          } else if (window.map) {
            window.marker = L.marker([${latitude}, ${longitude}]).addTo(window.map);
            window.marker.bindPopup("${mascotaNombre}").openPopup();
          }
          window.map.setView([${latitude}, ${longitude}], 16);
          
          // Actualizar la ruta si existe
          if (window.path) {
            window.path.addLatLng([${latitude}, ${longitude}]);
          }
        } catch(e) {
          console.error('Error updating map:', e);
        }
      `;
      
      webviewRef.current.injectJavaScript(updateScript);
    }
  };

  // Función para determinar si debemos agregar una nueva ubicación al historial
  const shouldAddLocation = (newLocation) => {
    // Si no hay ubicaciones previas, siempre agregar
    if (locationHistory.length === 0) return true;
    
    const lastLocation = locationHistory[locationHistory.length - 1];
    
    // Calcular distancia entre la última ubicación y la nueva
    const distance = calculateDistance(
      lastLocation.latitude,
      lastLocation.longitude,
      newLocation.coords.latitude,
      newLocation.coords.longitude
    );
    
    // Solo agregar si la distancia es mayor a 10 metros
    return distance > 0.01;
  };

  // Función para calcular la distancia entre dos coordenadas (fórmula de Haversine)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distancia en km
    return d;
  };

  // Función para convertir grados a radianes
  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };

  // Función para enviar datos de ubicación al servidor
  const sendLocationData = async (location, petId) => {
    try {
      if (!location || !location.coords || !petId) {
        console.error('Error: Datos de ubicación o ID de mascota faltantes');
        return;
      }
      
      // Obtener datos exactos de la ubicación
      const { latitude, longitude } = location.coords;
      
      // Registrar los datos exactos que se van a enviar
      console.log(`Enviando a API - ID: ${petId}, Lat: ${latitude}, Lng: ${longitude}`);
      
      // Enviar al servidor - asegurándose de que los tipos sean correctos
      await sendPetLocation(
        petId,
        latitude,
        longitude
      );
      
      // Actualizar hora del último envío
      const now = new Date();
      setLastSentTime(now);
      
      // Agregar ubicación al historial si es diferente de la anterior
      if (shouldAddLocation(location)) {
        setLocationHistory(prevHistory => [
          ...prevHistory,
          {
            latitude,
            longitude,
            timestamp: now.getTime()
          }
        ]);
      }
      
      console.log(`Ubicación enviada: ${now.toLocaleTimeString()}`);
    } catch (error) {
      console.error('Error al enviar ubicación:', error);
    }
  };

  // Función para refrescar manualmente la ubicación actual y obtener historial
  const refreshLocation = async () => {
    try {
      setIsReloading(true);
      
      // Obtener ubicación actual
      const newLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      setCurrentLocation(newLocation);
      
      // Enviar ubicación actualizada al servidor
      await sendLocationData(newLocation, mascotaId);
      
      // Volver a cargar el historial de ubicaciones
      await fetchLocationHistory(mascotaId);
      
      console.log('Ubicación actualizada manualmente');
    } catch (error) {
      console.error('Error al actualizar ubicación:', error);
      setErrorMsg('Error al actualizar ubicación');
    } finally {
      setIsReloading(false);
    }
  };

  // Generamos el HTML para el mapa de OpenStreetMap
  const getMapHTML = () => {
    const lat = currentLocation ? currentLocation.coords.latitude : 0;
    const lng = currentLocation ? currentLocation.coords.longitude : 0;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Mapa de ubicación</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body, html {
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%;
            overflow: hidden;
          }
          #map {
            height: 100%;
            width: 100%;
          }
          .custom-marker {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: white;
            border: 3px solid #4CAF50;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 18px;
            color: #4CAF50;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          // Inicializar el mapa
          var map = window.map = L.map('map').setView([${lat}, ${lng}], 16);
          
          // Añadir capa de OpenStreetMap
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(map);
          
          // Crear marcador inicial
          var marker = window.marker = L.marker([${lat}, ${lng}]).addTo(map);
          marker.bindPopup("${mascotaNombre}").openPopup();
          
          // Inicializar ruta con color rojo
          var path = window.path = L.polyline([], {
            color: '#FF5252',
            weight: 4,
            opacity: 0.7
          }).addTo(map);
          
          // Agregar punto inicial a la ruta
          path.addLatLng([${lat}, ${lng}]);
          
          // Prevenir arrastrar la página al hacer zoom en el mapa
          document.addEventListener('touchmove', function(e) {
            e.preventDefault();
          }, { passive: false });
        </script>
      </body>
      </html>
    `;
  };

  // Función que se ejecuta cuando el WebView termina de cargar
  const handleWebViewLoad = () => {
    // Actualizar el mapa con la ubicación actual cuando el WebView está listo
    updateMap();
    
    // Si hay historial de ubicaciones, mostrarlo
    if (locationHistory.length > 0) {
      drawLocationHistory(locationHistory);
    } else if (mascotaId) {
      // Si no hay historial cargado pero hay mascota seleccionada, intentar cargar
      fetchLocationHistory(mascotaId);
    }
  };

  // Si está cargando, mostrar indicador
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Cargando mapa...</Text>
      </View>
    );
  }

  // Si hay error, mostrar mensaje
  if (errorMsg) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={32} color="#FF6B6B" />
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  // Renderizar mapa si la ubicación está disponible
  if (currentLocation) {
    return (
      <View style={styles.container}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>Ubicación de {mascotaNombre}</Text>
          {lastSentTime && (
            <Text style={styles.lastUpdateText}>
              Último envío: {lastSentTime.toLocaleTimeString()}
            </Text>
          )}
        </View>
        
        <WebView
          ref={webviewRef}
          originWhitelist={['*']}
          source={{ html: getMapHTML() }}
          style={styles.map}
          onLoad={handleWebViewLoad}
          javaScriptEnabled={true}
        />
        
        <View style={styles.mapControls}>
          {/* Botón de recarga de ubicación */}
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={refreshLocation}
            disabled={isReloading}
          >
            {isReloading ? (
              <ActivityIndicator size="small" color="#4CAF50" />
            ) : (
              <Ionicons name="refresh" size={24} color="#4CAF50" />
            )}
          </TouchableOpacity>
          
          {/* Botón de centrar mapa */}
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={updateMap}
          >
            <Ionicons name="locate" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Fallback si no hay ubicación
  return (
    <View style={styles.errorContainer}>
      <Ionicons name="location-off" size={32} color="#FF6B6B" />
      <Text style={styles.errorText}>No se pudo obtener la ubicación</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },
  map: {
    height: 300,
    width: '100%',
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
  },
  loadingText: {
    marginTop: 10,
    color: '#666666',
  },
  errorContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    color: '#666666',
    textAlign: 'center',
  },
  mapControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default PetLocationMap; 