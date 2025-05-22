import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { fetchMascotas, getPetLocations } from '../../services/api';
import { generateColorFromString } from '../../utils/colors';
import { formatearImagen } from '../../utils/formatImage';

export default function LocationScreen() {
  const [mascotas, setMascotas] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationHistory, setLocationHistory] = useState([]);
  const [isReloading, setIsReloading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const webviewRef = useRef(null);
  const refreshIntervalRef = useRef(null);

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

  // Efecto para manejar el cambio de mascota seleccionada
  useEffect(() => {
    if (selectedPet) {
      // Obtener historial de ubicaciones para la mascota seleccionada
      fetchLocationHistory(selectedPet.id);
      
      // Configurar un intervalo para actualizar la ubicación periódicamente
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      
      refreshIntervalRef.current = setInterval(() => {
        fetchLocationHistory(selectedPet.id);
      }, 60000); // Actualizar cada 60 segundos
    }
    
    // Limpiar intervalo al desmontar o cambiar mascota
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [selectedPet]);

  // Función para obtener el historial de ubicaciones de una mascota
  const fetchLocationHistory = async (petId) => {
    if (!petId) return;
    
    try {
      setFetchingHistory(true);
      
      // Usar la función para obtener ubicaciones por ID
      const petLocations = await getPetLocations(petId, 30, true);
      
      if (Array.isArray(petLocations) && petLocations.length > 0) {
        // Ordenar por timestamp
        const sortedLocations = petLocations
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        // Convertir a formato para el historial
        const formattedLocations = sortedLocations.map(loc => ({
          latitude: loc.latitude,
          longitude: loc.longitude,
          timestamp: new Date(loc.created_at).getTime()
        }));
        
        // Actualizar historial
        setLocationHistory(formattedLocations);
        setLastUpdateTime(new Date());
        
        console.log(`Cargadas ${formattedLocations.length} ubicaciones para la mascota`);
        
        // Actualizar mapa con el historial
        if (webviewRef.current && formattedLocations.length > 0) {
          const lastLocation = formattedLocations[formattedLocations.length - 1];
          updateMap(lastLocation.latitude, lastLocation.longitude);
          drawLocationHistory(formattedLocations);
        }
      } else {
        console.log('No se encontraron ubicaciones recientes para esta mascota');
      }
    } catch (error) {
      console.error('Error al obtener historial de ubicaciones:', error);
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

  // Función para actualizar el mapa con la ubicación de la mascota
  const updateMap = (latitude, longitude) => {
    if (!webviewRef.current || !latitude || !longitude) return;
    
    // Script para actualizar el marcador en el mapa
    const updateScript = `
      try {
        if (window.marker) {
          window.marker.setLatLng([${latitude}, ${longitude}]);
        } else if (window.map) {
          window.marker = L.marker([${latitude}, ${longitude}]).addTo(window.map);
          window.marker.bindPopup("${selectedPet ? selectedPet.nombre : 'Mascota'}").openPopup();
        }
        window.map.setView([${latitude}, ${longitude}], 16);
      } catch(e) {
        console.error('Error updating map:', e);
      }
    `;
    
    webviewRef.current.injectJavaScript(updateScript);
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

  // Función para seleccionar una mascota
  const handleSelectPet = (pet) => {
    setSelectedPet(pet);
    clearMapPath(); // Limpiar el recorrido al cambiar de mascota
    setLocationHistory([]);
  };

  // Función para refrescar manualmente las ubicaciones
  const refreshLocationHistory = async () => {
    if (!selectedPet) return;
    
    try {
      setIsReloading(true);
      await fetchLocationHistory(selectedPet.id);
    } catch (error) {
      console.error('Error al actualizar ubicaciones:', error);
    } finally {
      setIsReloading(false);
    }
  };

  // Generamos el HTML para el mapa de OpenStreetMap
  const getMapHTML = () => {
    // Ubicación por defecto en caso de no tener datos
    const defaultLat = 1.21190;
    const defaultLng = -77.28585;
    
    // Usar la última ubicación conocida si está disponible
    const lastLocation = locationHistory.length > 0 ? 
      locationHistory[locationHistory.length - 1] : null;
    
    const lat = lastLocation ? lastLocation.latitude : defaultLat;
    const lng = lastLocation ? lastLocation.longitude : defaultLng;
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
    // Si hay historial de ubicaciones, mostrarlo
    if (locationHistory.length > 0) {
      const lastLocation = locationHistory[locationHistory.length - 1];
      updateMap(lastLocation.latitude, lastLocation.longitude);
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
          {lastUpdateTime && (
            <View style={styles.lastUpdateContainer}>
              <Text style={styles.lastUpdateText}>
                Última actualización: {lastUpdateTime.toLocaleTimeString()}
              </Text>
            </View>
          )}
          
          {/* Controles del mapa */}
          <View style={styles.mapControls}>
            {/* Botón de recarga de ubicación */}
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={refreshLocationHistory}
              disabled={isReloading || !selectedPet}
            >
              {isReloading ? (
                <ActivityIndicator size="small" color="#4CAF50" />
              ) : (
                <Ionicons name="refresh" size={24} color="#4CAF50" />
              )}
            </TouchableOpacity>
            
            {/* Indicador de estado */}
            <View style={styles.statusIndicator}>
              <View style={[
                styles.statusDot, 
                { backgroundColor: fetchingHistory ? '#FFA000' : '#4CAF50' }
              ]} />
              <Text style={styles.statusText}>
                {fetchingHistory ? 'Actualizando...' : 'En línea'}
              </Text>
            </View>
          </View>
        </View>
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
  lastUpdateContainer: {
    position: 'absolute',
    bottom: 70,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 8,
    borderRadius: 8,
    alignItems: 'flex-end',
    maxWidth: '70%',
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
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  statusText: {
    fontSize: 12,
    color: '#555555',
  },
}); 