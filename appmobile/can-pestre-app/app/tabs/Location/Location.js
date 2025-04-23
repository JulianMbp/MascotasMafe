import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { API_URL, fetchMascotas, sendPetLocation } from '../../services/api';
import { generateColorFromString } from '../../utils/colors';
import { formatearImagen } from '../../utils/formatImage';

export default function LocationScreen() {
  const [mascotas, setMascotas] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [lastSentTime, setLastSentTime] = useState(null);
  const [isReloading, setIsReloading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const intervalRef = useRef(null);
  const webviewRef = useRef(null);

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
      
      // Obtener historial de ubicaciones para la mascota seleccionada
      fetchLocationHistory(selectedPet.id);
      
      // Iniciar seguimiento automático
      startTracking();
      
      // Actualizar el mapa si tenemos el WebView listo
      updateMap();
    }
  }, [selectedPet]);

  // Iniciar el seguimiento automático al cargar el componente
  useEffect(() => {
    if (selectedPet && currentLocation) {
      startTracking();
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [selectedPet, currentLocation]);

  // Función para iniciar el seguimiento automático
  const startTracking = () => {
    if (!selectedPet) return;
    
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
          sendLocationData(newLocation, selectedPet.id);
          
          // Actualizar el mapa
          updateMap();
        }
      } catch (error) {
        console.error('Error en el seguimiento automático:', error);
      }
    }, 60000);
    
    console.log('Seguimiento automático activado - enviando ubicación cada minuto');
  };

  // Función para obtener el historial de ubicaciones de una mascota
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
            window.marker.bindPopup("${selectedPet ? selectedPet.nombre : 'Mi ubicación'}").openPopup();
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

  // Función para limpiar el historial de ubicaciones en el mapa
  const clearMapPath = () => {
    if (webviewRef.current) {
      const clearScript = `
        try {
          if (window.path) {
            window.map.removeLayer(window.path);
            window.path = L.polyline([], {color: '#FF5252', weight: 4, opacity: 0.7}).addTo(window.map);
          }
        } catch(e) {
          console.error('Error clearing path:', e);
        }
      `;
      
      webviewRef.current.injectJavaScript(clearScript);
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
      
      console.log(`Ubicación enviada para ${selectedPet?.nombre}: ${now.toLocaleTimeString()}`);
    } catch (error) {
      console.error('Error al enviar ubicación:', error);
    }
  };

  // Función para seleccionar una mascota
  const handleSelectPet = (pet) => {
    setSelectedPet(pet);
    clearMapPath(); // Limpiar el recorrido al cambiar de mascota
  };

  // Función para refrescar manualmente la ubicación actual y obtener historial
  const refreshLocation = async () => {
    if (!selectedPet) return;
    
    try {
      setIsReloading(true); // Activar indicador de carga
      
      // Obtener ubicación actual
      const newLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      setCurrentLocation(newLocation);
      
      // Enviar ubicación actualizada al servidor
      await sendLocationData(newLocation, selectedPet.id);
      
      // Volver a cargar el historial de ubicaciones
      await fetchLocationHistory(selectedPet.id);
      
      // Opcional: añadir mensaje de confirmación
      console.log('Ubicación actualizada manualmente');
    } catch (error) {
      console.error('Error al actualizar ubicación:', error);
      setErrorMsg('Error al actualizar ubicación');
    } finally {
      setIsReloading(false); // Desactivar indicador de carga
    }
  };

  // Generamos el HTML para el mapa de OpenStreetMap
  const getMapHTML = () => {
    const lat = currentLocation ? currentLocation.coords.latitude : 1.21190;
    const lng = currentLocation ? currentLocation.coords.longitude : -77.28585;
    const petName = selectedPet ? selectedPet.nombre : '';
    
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
          marker.bindPopup("${petName}").openPopup();
          
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

  // Función que se ejecuta cuando el WebView termina de cargar
  const handleWebViewLoad = () => {
    // Actualizar el mapa con la ubicación actual cuando el WebView está listo
    updateMap();
    
    // Si hay historial de ubicaciones, mostrarlo
    if (locationHistory.length > 0) {
      drawLocationHistory(locationHistory);
    } else if (selectedPet) {
      // Si no hay historial cargado pero hay mascota seleccionada, intentar cargar
      fetchLocationHistory(selectedPet.id);
    }
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
        ) : (
          <View style={styles.mapWrapper}>
            <WebView
              ref={webviewRef}
              originWhitelist={['*']}
              source={{ html: getMapHTML() }}
              style={styles.map}
              onLoad={handleWebViewLoad}
              javaScriptEnabled={true}
            />
            
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
              {/* Botón de recarga de ubicación */}
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={refreshLocation}
                disabled={isReloading || !selectedPet}
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
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 10,
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
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
}); 