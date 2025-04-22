import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import { fetchMascotas, sendPetLocation } from '../../services/api';
import { generateColorFromString } from '../../utils/colors';

export default function LocationScreen() {
  const [mascotas, setMascotas] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [lastSentTime, setLastSentTime] = useState(null);
  const intervalRef = useRef(null);
  const mapRef = useRef(null);

  // Cargar la lista de mascotas
  useEffect(() => {
    const loadMascotas = async () => {
      try {
        setLoading(true);
        const data = await fetchMascotas();
        setMascotas(data);
        
        // Si hay mascotas, seleccionar la primera por defecto
        if (data && data.length > 0) {
          setSelectedPet(data[0]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar las mascotas:', error);
        setLoading(false);
      }
    };
    
    loadMascotas();
  }, []);

  // Solicitar permisos y obtener ubicación cuando se carga el componente
  useEffect(() => {
    (async () => {
      try {
        setLocationLoading(true);
        let { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setErrorMsg('Permiso de ubicación denegado');
          setLocationLoading(false);
          return;
        }
        
        // Obtener ubicación actual
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        
        setCurrentLocation(location);
        
        // Si hay una mascota seleccionada, enviar la ubicación
        if (selectedPet) {
          sendLocationData(location, selectedPet.id);
        }
        
      } catch (error) {
        console.error('Error al inicializar ubicación:', error);
        setErrorMsg('Error al obtener ubicación');
      } finally {
        setLocationLoading(false);
      }
    })();
    
    // Limpiar intervalo al desmontar
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Efecto para manejar el cambio de mascota seleccionada
  useEffect(() => {
    if (selectedPet && currentLocation) {
      // Cuando cambie la mascota seleccionada, enviar la ubicación
      sendLocationData(currentLocation, selectedPet.id);
      
      // Limpiar el historial de ubicaciones para la nueva mascota
      setLocationHistory([]);
      
      // Si hay seguimiento activo, detenerlo y reiniciarlo
      if (isTracking) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        
        startTracking();
      }
    }
  }, [selectedPet]);

  // Efecto para manejar el seguimiento automático
  useEffect(() => {
    if (isTracking) {
      startTracking();
    } else {
      // Detener el seguimiento si está desactivado
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
  }, [isTracking]);

  // Función para iniciar el seguimiento
  const startTracking = () => {
    if (!selectedPet) return;
    
    // Configurar intervalo para enviar cada minuto (60000 ms)
    intervalRef.current = setInterval(async () => {
      try {
        const newLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        
        setCurrentLocation(newLocation);
        
        // Verificar si la ubicación es diferente a la última enviada
        if (shouldAddLocation(newLocation)) {
          sendLocationData(newLocation, selectedPet.id);
        }
      } catch (error) {
        console.error('Error en el seguimiento automático:', error);
      }
    }, 60000);
    
    console.log('Seguimiento activado - enviando ubicación cada minuto');
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
    
    // Solo agregar si la distancia es mayor a 10 metros (0.01 km)
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
      
      console.log(`Ubicación enviada para ${selectedPet?.nombre}: ${now.toLocaleTimeString()}`);
    } catch (error) {
      console.error('Error al enviar ubicación:', error);
    }
  };

  // Función para seleccionar una mascota
  const handleSelectPet = (pet) => {
    setSelectedPet(pet);
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

  // Función para formatear correctamente la imagen base64
  const formatearImagen = (imagenData) => {
    if (!imagenData) return null;
    
    // Verificar si la cadena ya contiene el prefijo data:image
    if (imagenData.startsWith('data:image')) {
      return imagenData;
    }
    
    // Si no tiene el prefijo, añadirlo
    return `data:image/jpeg;base64,${imagenData}`;
  };

  // Renderizar item de mascota
  const renderPetItem = ({ item }) => {
    const isSelected = selectedPet && selectedPet.id === item.id;
    const petColor = generateColorFromString(`${item.especie}${item.raza}`);
    
    return (
      <TouchableOpacity 
        style={[
          styles.petItem, 
          isSelected && styles.selectedPetItem
        ]} 
        onPress={() => handleSelectPet(item)}
      >
        {item.imagen ? (
          <Image 
            source={{ uri: formatearImagen(item.imagen) }} 
            style={styles.petItemImage} 
          />
        ) : (
          <View style={[styles.petItemFallback, { backgroundColor: petColor }]}>
            <Text style={styles.petItemFallbackText}>{item.nombre.charAt(0)}</Text>
          </View>
        )}
        <Text style={[
          styles.petItemName,
          isSelected && styles.selectedPetItemName
        ]}>
          {item.nombre}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Cargando mascotas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ubicación de Mascotas</Text>
      </View>
      
      {/* Selector de mascotas */}
      <View style={styles.petsContainer}>
        <FlatList
          data={mascotas}
          renderItem={renderPetItem}
          keyExtractor={item => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.petsList}
        />
      </View>
      
      {/* Mapa */}
      <View style={styles.mapContainer}>
        {locationLoading ? (
          <View style={styles.mapLoadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Cargando mapa...</Text>
          </View>
        ) : errorMsg ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={32} color="#FF6B6B" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : currentLocation && selectedPet ? (
          <View style={styles.mapWrapper}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
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
                title={selectedPet.nombre}
                description="Ubicación actual"
              >
                <View style={styles.customMarker}>
                  {selectedPet.imagen ? (
                    <Image 
                      source={{ uri: formatearImagen(selectedPet.imagen) }} 
                      style={styles.markerImage} 
                    />
                  ) : (
                    <View style={[
                      styles.markerFallback, 
                      { backgroundColor: generateColorFromString(`${selectedPet.especie}${selectedPet.raza}`) }
                    ]}>
                      <Text style={styles.markerText}>{selectedPet.nombre.charAt(0)}</Text>
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
            
            {/* Información de la última actualización */}
            {lastSentTime && (
              <View style={styles.lastUpdateContainer}>
                <Text style={styles.lastUpdateText}>
                  Último envío: {lastSentTime.toLocaleTimeString()}
                </Text>
              </View>
            )}
            
            {/* Controles del mapa */}
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
        ) : (
          <View style={styles.errorContainer}>
            <Ionicons name="paw" size={32} color="#888888" />
            <Text style={styles.errorText}>
              {selectedPet 
                ? "No se pudo obtener la ubicación" 
                : "Selecciona una mascota para ver su ubicación"}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666666',
  },
  petsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  petsList: {
    paddingHorizontal: 10,
  },
  petItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
  },
  selectedPetItem: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  petItemImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 5,
  },
  petItemFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  petItemFallbackText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 20,
  },
  petItemName: {
    fontSize: 12,
    color: '#555555',
    fontWeight: '500',
  },
  selectedPetItemName: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    color: '#666666',
    textAlign: 'center',
  },
  lastUpdateContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#555555',
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
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  trackingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    bottom: 70,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 3,
    borderRadius: 3,
  },
  attributionText: {
    fontSize: 8,
    color: '#333333',
  },
}); 