import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import { sendPetLocation } from '../services/api';

const PetLocationMap = ({ mascotaId, mascotaNombre, mascotaImagen }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [lastSentTime, setLastSentTime] = useState(null);
  const intervalRef = useRef(null);
  const mapRef = useRef(null);

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
      
      // Limpiar el historial de ubicaciones para la nueva mascota
      setLocationHistory([]);
    }
  }, [mascotaId]);

  // Efecto para manejar el intervalo de seguimiento
  useEffect(() => {
    if (isTracking) {
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
          }
        } catch (error) {
          console.error('Error en el seguimiento automático:', error);
        }
      }, 60000);
      
      console.log('Seguimiento activado - enviando ubicación cada minuto');
    } else {
      // Limpiar intervalo cuando se desactiva el seguimiento
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('Seguimiento desactivado');
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isTracking, mascotaId]);

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
      const { latitude, longitude } = location.coords;
      
      // Enviar ubicación al servidor
      await sendPetLocation(petId, latitude, longitude);
      
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

  // Función para activar/desactivar el seguimiento automático
  const toggleTracking = () => {
    setIsTracking(!isTracking);
  };

  // Función para centrar el mapa en la ubicación actual
  const centerMapOnLocation = () => {
    if (mapRef.current && currentLocation) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
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
    const initialRegion = {
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };

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
        
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={true}
          showsMyLocationButton={false}
        >
          {/* Capa de OpenStreetMap */}
          <UrlTile 
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
          />
          
          {/* Marcador para ubicación actual */}
          <Marker
            coordinate={{
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            }}
            title={mascotaNombre}
            description="Ubicación actual"
          >
            <View style={styles.customMarker}>
              {mascotaImagen ? (
                <Image 
                  source={{ uri: mascotaImagen.startsWith('data:image') 
                    ? mascotaImagen 
                    : `data:image/jpeg;base64,${mascotaImagen}`
                  }} 
                  style={styles.markerImage} 
                />
              ) : (
                <View style={styles.markerFallback}>
                  <Text style={styles.markerText}>{mascotaNombre.charAt(0)}</Text>
                </View>
              )}
            </View>
          </Marker>
          
          {/* Línea de recorrido */}
          {locationHistory.length > 1 && (
            <Polyline
              coordinates={locationHistory.map(loc => ({
                latitude: loc.latitude,
                longitude: loc.longitude,
              }))}
              strokeColor="#4CAF50"
              strokeWidth={3}
              lineDashPattern={[5, 5]}
            />
          )}
        </MapView>
        
        {/* Atribución de OpenStreetMap */}
        <View style={styles.attributionContainer}>
          <Text style={styles.attributionText}>
            © OpenStreetMap contributors
          </Text>
        </View>
        
        <View style={styles.mapControls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={centerMapOnLocation}
          >
            <Ionicons name="locate" size={24} color="#4CAF50" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.trackingButton, 
              isTracking ? styles.trackingActiveButton : null
            ]}
            onPress={toggleTracking}
          >
            <Ionicons 
              name={isTracking ? "pause-circle" : "play-circle"} 
              size={24} 
              color={isTracking ? "#FFFFFF" : "#4CAF50"} 
            />
            <Text style={[
              styles.trackingButtonText,
              isTracking ? styles.trackingActiveText : null
            ]}>
              {isTracking ? "Detener seguimiento" : "Iniciar seguimiento"}
            </Text>
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
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
    overflow: 'hidden',
  },
  markerImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  markerFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
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
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  trackingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 10,
  },
  trackingActiveButton: {
    backgroundColor: '#4CAF50',
  },
  trackingButtonText: {
    marginLeft: 8,
    color: '#4CAF50',
    fontWeight: '500',
  },
  trackingActiveText: {
    color: '#FFFFFF',
  },
  attributionContainer: {
    position: 'absolute',
    bottom: 60,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 3,
    borderRadius: 3,
    zIndex: 1000,
  },
  attributionText: {
    fontSize: 8,
    color: '#333333',
  },
});

export default PetLocationMap; 